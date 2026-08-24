import Stripe from 'stripe'
import crypto from 'node:crypto'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, QueryCommand, GetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb'
import { CognitoIdentityProviderClient, AdminGetUserCommand, AdminCreateUserCommand } from '@aws-sdk/client-cognito-identity-provider'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const cognito = new CognitoIdentityProviderClient({})
// Pool uses UsernameAttributes:email — the email IS the sign-in username, so
// AdminGetUser / AdminCreateUser are keyed on the email directly.
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID
const TABLE = process.env.SUBSCRIPTIONS_TABLE || 'ghost-igl-subscriptions'
const PROFILES_TABLE = process.env.PROFILES_TABLE || 'ghost-igl-profiles'
const REFERRALS_TABLE = process.env.REFERRALS_TABLE || 'ghost-igl-referrals'
// Days a referred subscription has to stay active before counting toward
// the referrer's "3 active = free month" credit. Covers refund window +
// dunning churn so we don't comp on customers who immediately bail.
const REFERRAL_QUALIFY_DAYS = 30
// Hybrid referral program: first 90 days post-launch, any paid sub
// becomes a "founding referrer" with permanent referral eligibility at
// their original tier. After the cutoff, only Champion+ All-Access
// subscribers qualify. We stamp the flag onto the profile at first paid
// activation so it's evaluated once, not on every /me read.
const REFERRAL_FOUNDING_CUTOFF_MS = Date.parse('2026-05-11T00:00:00.000Z') + 90 * 86400000

export async function handler(event) {
  // Keep-warm ping (ghost-igl-warmer, rate(5 minutes), Input {"warmer":true}).
  // It carries no stripe-signature, so it used to fall through to verification
  // and log stripe_signature_rejected every 5 minutes forever. That pinned the
  // Recon6-StripeWebhookRejected alarm permanently in ALARM, so a REAL outage
  // produced no state transition and no notification — the same silence that
  // hid the 3-day payment outage. Answer and stop before touching Stripe.
  if (event?.warmer === true) {
    return { statusCode: 200, body: 'warm' }
  }

  const sig = event.headers?.['stripe-signature']
  let stripeEvent

  // API Gateway may base64-encode the body. Stripe's signature is computed
  // over the exact bytes it sent, so decode before verification.
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : event.body

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    // Invalid signatures are expected internet noise, not Lambda failures.
    // Keep a countable warning without echoing attacker-controlled details.
    // NOTE: this warn is what the Recon6-StripeWebhookRejected CloudWatch alarm
    // counts (metric filter 'recon6-stripe-signature-rejected'). A sustained
    // count here means payments are NOT being recorded — on 2026-07-18 the
    // signing secret was corrupted to '****' and this fired silently for 3 days.
    console.warn(JSON.stringify({ level: 'warn', event: 'stripe_signature_rejected' }))
    return { statusCode: 400, body: 'Webhook Error: invalid signature' }
  }

  // Pass the event ID into each handler so they can skip duplicate processing.
  // Stripe redelivers events on transient 5xx — without this guard, we'd
  // process the same checkout.session.completed twice and risk inconsistent
  // state if any handler isn't strictly idempotent.
  const eventId = stripeEvent.id
  const eventCreated = Number(stripeEvent.created || 0)

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckout(stripeEvent.data.object, eventId, eventCreated)
        break
      case 'checkout.session.async_payment_succeeded':
        await handleCheckout(stripeEvent.data.object, eventId, eventCreated)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubUpdate(stripeEvent.data.object, eventId, eventCreated)
        break
      case 'customer.subscription.deleted':
        await handleSubDeleted(stripeEvent.data.object, eventId, eventCreated)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object, eventId, eventCreated)
        break
      case 'invoice.paid':
        await handleInvoicePaid(stripeEvent.data.object, eventId, eventCreated)
        break
      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`)
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) }
  } catch (err) {
    console.error('Error processing webhook:', err)
    return { statusCode: 500, body: 'Internal error' }
  }
}

// The $70/mo coaching add-on price. Its subscription events grant booking
// credits (not an app plan). getPlanFromPrice() returns null for it, so the
// existing app-plan path already ignores it — we add explicit handling.
const COACHING_ADDON_PRICE_ID = process.env.COACHING_ADDON_PRICE_ID || 'price_1TsZtQJNddvjgWcgwPKVEYQm'
const CHAMPION_MEMBERSHIP_PRICE_ID = process.env.STRIPE_CHAMPION_MEMBERSHIP_PRICE_ID || 'price_1TzrjiJNddvjgWcgw1DYSf88'
const COACHING_CREDIT_PRICE_IDS = new Set([COACHING_ADDON_PRICE_ID, CHAMPION_MEMBERSHIP_PRICE_ID].filter(Boolean))
const AI_USAGE_PACK_PRICE_ID = process.env.AI_USAGE_PACK_PRICE_ID || 'price_1TzrjoJNddvjgWcgzp9RSUOK'
const AI_USAGE_PACK_CREDITS = parseInt(process.env.AI_USAGE_PACK_CREDITS || '100', 10)
const BOOKING_API = process.env.BOOKING_API || 'https://u0k402df6j.execute-api.us-east-1.amazonaws.com/prod'

// Coaching confirmation/credits are owned by the booking Lambda (it has the
// slot table, SES, .ics, and credit balance). The webhook just pings it; the
// booking Lambda re-verifies with Stripe (idempotent).
async function finalizeCoaching(session) {
  try {
    const r = await fetch(`${BOOKING_API}/booking/finalize`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id }),
    })
    console.log(`coaching finalize ${session.id}: HTTP ${r.status}`)
  } catch (err) {
    console.error('coaching finalize failed:', err.message)
  }
}

async function syncCoachingCredits(subscriptionId, sourceEventId) {
  try {
    if (!subscriptionId || !sourceEventId || !process.env.STRIPE_SECRET_KEY) {
      throw new Error('coaching credit sync is not configured')
    }
    const signature = crypto
      .createHmac('sha256', process.env.STRIPE_SECRET_KEY)
      .update(`booking-credits:${subscriptionId}:${sourceEventId}`)
      .digest('base64url')
    const r = await fetch(`${BOOKING_API}/booking/credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Recon6-Internal-Signature': signature,
      },
      body: JSON.stringify({ subscriptionId, sourceEventId }),
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    console.log(`coaching credits synced for ${subscriptionId}: HTTP ${r.status}`)
  } catch (err) {
    console.error('coaching credits sync failed:', err.message)
    throw err
  }
}

// invoice.paid = an add-on renewal (or first invoice) → reset the monthly
// credit balance to 2. Only acts on invoices whose line is the add-on price;
// app-subscription invoices are ignored.
async function handleInvoicePaid(invoice, eventId, eventCreated) {
  const grantsCredits = (invoice.lines?.data || []).some((l) =>
    l.price?.id === COACHING_ADDON_PRICE_ID || l.price?.id === CHAMPION_MEMBERSHIP_PRICE_ID
  )
  if (grantsCredits && invoice.subscription) await syncCoachingCredits(invoice.subscription, eventId)
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
    const priceId = subscription.items?.data?.[0]?.price?.id
    if (getPlanFromPrice(priceId)) await handleSubUpdate(subscription, eventId, eventCreated)
  }
}

async function grantUsagePack(session, eventId) {
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') return
  if (!AI_USAGE_PACK_PRICE_ID) throw new Error('AI_USAGE_PACK_PRICE_ID is not configured')
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 })
  if (!(lineItems.data || []).some((item) => item.price?.id === AI_USAGE_PACK_PRICE_ID)) {
    throw new Error(`Checkout ${session.id} is not the configured AI usage pack`)
  }
  const email = String(session.metadata?.email || session.customer_details?.email || session.customer_email || '').trim().toLowerCase()
  if (!email) throw new Error(`Usage pack checkout ${session.id} has no account email`)
  const credits = Number(session.metadata?.credits || AI_USAGE_PACK_CREDITS)
  if (!Number.isFinite(credits) || credits <= 0 || credits > 10000) throw new Error('Invalid usage-pack credit amount')

  try {
    await ddb.send(new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: TABLE,
            Item: {
              stripe_customer_id: `usage_${session.id}`,
              email,
              record_type: 'usage_purchase',
              status: 'paid',
              stripe_checkout_session_id: session.id,
              stripe_payment_intent_id: session.payment_intent || null,
              credits,
              created_at: new Date().toISOString(),
              last_processed_event_id: eventId,
            },
            ConditionExpression: 'attribute_not_exists(stripe_customer_id)',
          },
        },
        {
          Update: {
            TableName: PROFILES_TABLE,
            Key: { email },
            UpdateExpression: 'SET ai_usage_credits = if_not_exists(ai_usage_credits, :zero) + :credits, updated_at = :now, created_at = if_not_exists(created_at, :now)',
            ExpressionAttributeValues: { ':zero': 0, ':credits': credits, ':now': new Date().toISOString() },
          },
        },
      ],
    }))
    console.log(`Granted ${credits} prepaid AI credits to ${email}`)
  } catch (err) {
    if (err.name === 'TransactionCanceledException') {
      console.log(`Skipping duplicate usage-pack grant for ${session.id}`)
      return
    }
    throw err
  }
}

async function subHasGhostIglCustomer(customerId) {
  if (!customerId) return false
  const row = await ddb.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'stripe_customer_id = :c',
    ExpressionAttributeValues: { ':c': customerId },
    Limit: 1,
  }))
  return (row.Items?.length || 0) > 0
}

// DUPLICATE-SIGNUP GUARD — Stripe payment links create a NEW customer per
// checkout, so one person can complete checkout repeatedly and pile up parallel
// subscriptions. Real incident 2026-07-17: fraser2506@gmail.com held 3 Champion
// trials across 3 customer IDs → a pending 3× bill. Idempotency (last_processed_
// event_id) stops the same EVENT twice; it does nothing against the same PERSON
// checking out twice. This finds a pre-existing live sub of the SAME plan for the
// same email so the new one can be cancelled before it ever bills.
//   Same-plan only: an upgrade to a DIFFERENT plan (pro -> champion) is legitimate.
//   Live only: a resubscribe after a real cancellation (old row 'canceled') is legitimate.
async function findDuplicateActiveSub(email, plan, excludeSubId) {
  if (!email) return null
  const res = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :e',
    ExpressionAttributeValues: { ':e': email },
  }))
  return (res.Items || []).find((r) =>
    effectiveStoredPlan(r) === plan &&
    r.stripe_subscription_id && r.stripe_subscription_id !== excludeSubId &&
    (r.status === 'active' || r.status === 'trialing' || r.status === 'past_due')
  ) || null
}

function effectiveStoredPlan(row) {
  if (!row) return null
  const legacyEliteIds = new Set([
    process.env.STRIPE_CHAMPION_PRICE_ID,
    process.env.STRIPE_CHAMPION_FOUNDING_PRICE_ID,
    process.env.STRIPE_CHAMPION_REGULAR_PRICE_ID,
    process.env.STRIPE_CHAMPION_ALL_ACCESS_PRICE_ID,
    process.env.STRIPE_CHAMPION_ALL_ACCESS_ANNUAL_PRICE_ID,
    'price_1TLEtsJNddvjgWcgYcmiNmW7',
    'price_1TPtOYJNddvjgWcgfEWjzGnp',
    'price_1TVUd0JNddvjgWcgIPWakA3S',
    'price_1TVUd6JNddvjgWcgc3csHICD',
  ].filter(Boolean))
  return legacyEliteIds.has(row.price_id) ? 'elite' : row.plan
}

function eventVersion(eventCreated, eventId) {
  return `${String(Math.max(0, Number(eventCreated) || 0)).padStart(12, '0')}:${eventId}`
}

async function handleCheckout(session, eventId, eventCreated) {
  // RECON6 coaching = one-time payment with a booking slot in metadata. Confirm
  // the held slot via the booking API and stop — this is NOT an app sub. The
  // subscription path below is untouched.
  if (session.mode === 'payment' && session.metadata?.slotId) {
    await finalizeCoaching(session)
    return
  }
  if (session.mode === 'payment' && session.metadata?.kind === 'ai_usage_pack') {
    await grantUsagePack(session, eventId)
    return
  }
  if (session.mode !== 'subscription') return

  const customerId = session.customer
  const customerEmail = session.customer_email || session.customer_details?.email
  const subscriptionId = session.subscription
  const evtVersion = eventVersion(eventCreated, eventId)

  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  const item = sub.items.data[0]
  // Coaching add-on subscription → grant booking credits, not an app plan.
  if (COACHING_CREDIT_PRICE_IDS.has(item?.price?.id)) {
    await syncCoachingCredits(subscriptionId, eventId)
    if (!getPlanFromPrice(item?.price?.id)) return
  }
  const plan = getPlanFromPrice(item?.price?.id)
  const tierScope = getTierScope(item?.price?.id)

  if (!plan) {
    console.log(`Skipping non-Ghost-IGL checkout: sub=${subscriptionId} price=${item?.price?.id}`)
    return
  }

  // Duplicate-signup guard (see findDuplicateActiveSub). If this email already has
  // a LIVE sub of the SAME plan, this checkout is a repeat — cancel the new one so
  // the customer is never multi-billed, record it as canceled for the audit trail,
  // and stop (they already have the account/referral/credits from the first).
  // Fails OPEN: if the check errors, fall through to normal processing — a rare
  // dupe is recoverable; a broken checkout loses a paying customer.
  try {
    const dup = await findDuplicateActiveSub(customerEmail?.toLowerCase(), plan, subscriptionId)
    if (dup) {
      console.log(`DUPLICATE signup: ${customerEmail} already has ${plan} (${dup.stripe_subscription_id}); cancelling new sub ${subscriptionId}`)
      await stripe.subscriptions.cancel(subscriptionId)
      await ddb.send(new PutCommand({
        TableName: TABLE,
        Item: {
          stripe_customer_id: customerId,
          email: customerEmail?.toLowerCase(),
          stripe_subscription_id: subscriptionId,
          plan,
          tier_scope: tierScope,
          price_id: item?.price?.id,
          status: 'canceled',
          note: `auto-cancelled duplicate signup — already had ${plan} (${dup.stripe_subscription_id})`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_processed_event_id: eventId,
          last_event_version: evtVersion,
        },
        ConditionExpression: '(attribute_not_exists(last_processed_event_id) OR last_processed_event_id <> :evtId) AND (attribute_not_exists(last_event_version) OR last_event_version < :evtVersion)',
        ExpressionAttributeValues: { ':evtId': eventId, ':evtVersion': evtVersion },
      }))
      return
    }
  } catch (err) {
    console.error('duplicate-signup guard failed (continuing to normal processing):', err)
  }

  // As of API version 2025-10-29.clover, current_period_end moved from the
  // subscription to each item. Fall back to the legacy field for safety.
  const periodEnd = item?.current_period_end ?? sub.current_period_end
  const periodEndIso = Number.isFinite(Number(periodEnd)) ? new Date(Number(periodEnd) * 1000).toISOString() : null

  // Idempotency: skip if this exact event already wrote this row. Lets Stripe
  // safely redeliver checkout.session.completed without duplicate work.
  try {
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: {
        stripe_customer_id: customerId,
        email: customerEmail?.toLowerCase(),
        stripe_subscription_id: subscriptionId,
        plan,
        tier_scope: tierScope, // 'single' | 'all_access' — which games unlocked
        price_id: item?.price?.id, // for diagnostics + audit
        status: sub.status,
        current_period_end: periodEndIso,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_processed_event_id: eventId,
        last_event_version: evtVersion,
      },
      ConditionExpression: '(attribute_not_exists(last_processed_event_id) OR last_processed_event_id <> :evtId) AND (attribute_not_exists(last_event_version) OR last_event_version < :evtVersion)',
      ExpressionAttributeValues: { ':evtId': eventId, ':evtVersion': evtVersion },
    }))
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      console.log(`Skipping duplicate checkout event ${eventId} for customer ${customerId}`)
      return
    }
    throw err
  }

  // Track referrals — if this user's profile has a referred_by field, write
  // a row to the referrals table tying this new subscription to the
  // referrer. Status starts as 'pending' and the daily cron promotes to
  // 'active' once REFERRAL_QUALIFY_DAYS pass without churn.
  try {
    await trackReferralIfAny(customerEmail?.toLowerCase(), plan, subscriptionId, tierScope)
  } catch (err) {
    // Non-fatal — log and continue. The checkout already wrote successfully.
    console.error('trackReferralIfAny failed:', err)
  }

  // Stamp founding-referrer flag on the profile if this user subscribed
  // before the program cutoff. Permanent flag — locks in the referral
  // benefit at their current tier forever, even after the program
  // restricts to Champion+ only post-launch.
  try {
    await markFoundingReferrerIfEligible(customerEmail?.toLowerCase())
  } catch (err) {
    console.error('markFoundingReferrerIfEligible failed:', err)
  }

  // Auto-provision a Cognito login so the customer can actually access what
  // they paid for. Root cause of "paid but NO ACCOUNT" orphans: checkout and
  // signup were decoupled, so a customer could pay without ever creating a
  // login. We create the account keyed on the SAME email as the subscription
  // (Cognito emails them a set-password invite); the subscription Lambda's
  // /me lookup links the plan by email on first sign-in — no manual step.
  // Best-effort + its own try/catch: a failure here must NEVER undo the
  // subscription that was already recorded above.
  try {
    const cognitoSubject = await ensureCognitoAccount(customerEmail?.toLowerCase())
    if (cognitoSubject) {
      await ddb.send(new UpdateCommand({
        TableName: TABLE,
        Key: { stripe_customer_id: customerId },
        UpdateExpression: 'SET cognito_sub = if_not_exists(cognito_sub, :subject), identity_bound_at = if_not_exists(identity_bound_at, :now)',
        ExpressionAttributeValues: { ':subject': cognitoSubject, ':now': new Date().toISOString() },
      }))
    }
  } catch (err) {
    console.error('ensureCognitoAccount failed (subscription still recorded):', err)
  }
}

// Ensure a Cognito login exists for a paying customer. Idempotent: AdminGetUser
// first, create only if missing. Pool is UsernameAttributes:email, so the email
// is the username for both calls. AdminCreateUser (DesiredDeliveryMediums:EMAIL)
// sends a set-password invite; email_verified=true so they don't re-verify, and
// the subscription Lambda's email-index lookup links their plan on first login.
async function ensureCognitoAccount(email) {
  if (!email || !USER_POOL_ID) return null
  try {
    const existing = await cognito.send(new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: email }))
    return existing.UserAttributes?.find((a) => a.Name === 'sub')?.Value || existing.Username || null
  } catch (err) {
    if (err.name !== 'UserNotFoundException') throw err
  }
  const created = await cognito.send(new AdminCreateUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: email,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' },
    ],
    DesiredDeliveryMediums: ['EMAIL'],
  }))
  console.log(`Provisioned Cognito login for paid customer ${email}`)
  return created.User?.Attributes?.find((a) => a.Name === 'sub')?.Value || created.User?.Username || null
}

// Set founding_referrer=true on the profile if the subscriber activated
// before the 90-day cutoff. Idempotent — uses if_not_exists so we never
// strip the flag from someone who got it earlier. Profile row is created
// on first /me access, so by the time webhook fires here the row exists.
async function markFoundingReferrerIfEligible(email) {
  if (!email) return
  if (Date.now() >= REFERRAL_FOUNDING_CUTOFF_MS) return
  await ddb.send(new UpdateCommand({
    TableName: PROFILES_TABLE,
    Key: { email },
    UpdateExpression: 'SET founding_referrer = if_not_exists(founding_referrer, :yes), updated_at = :now, created_at = if_not_exists(created_at, :now)',
    ExpressionAttributeValues: { ':yes': true, ':now': new Date().toISOString() },
  }))
  console.log(`Founding referrer locked in: ${email}`)
}

// Look up the user's referred_by, if set, and create a pending referral row.
// Idempotent — uses the referrer+referred composite key, so re-processing the
// same checkout event won't create duplicates.
async function trackReferralIfAny(email, plan, subId, tierScope) {
  if (!email) return
  const profileResult = await ddb.send(new GetCommand({ TableName: PROFILES_TABLE, Key: { email } }))
  const profile = profileResult.Item
  if (!profile?.referred_by) return // No referrer attached

  const referrerEmail = String(profile.referred_by).toLowerCase()
  if (referrerEmail === email) return // Self-referral guard (also enforced earlier)

  const now = Date.now()
  const qualifiesAt = new Date(now + REFERRAL_QUALIFY_DAYS * 86400000).toISOString()

  try {
    await ddb.send(new PutCommand({
      TableName: REFERRALS_TABLE,
      Item: {
        referrer_email: referrerEmail,
        referred_email: email,
        tier: plan,                          // 'pro' | 'champion' (matches subscription plan)
        tier_scope: tierScope,                // 'single' | 'all_access'
        status: 'pending',                    // → 'active' after qualifies_at
        stripe_subscription_id: subId,
        created_at: new Date(now).toISOString(),
        qualifies_at: qualifiesAt,
      },
      // First-write wins — if this referrer+referred pair already exists
      // (re-subscribe after cancel), don't overwrite the earlier record.
      ConditionExpression: 'attribute_not_exists(referrer_email)',
    }))
    console.log(`Referral tracked: ${referrerEmail} → ${email} (${plan})`)
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      console.log(`Referral already tracked: ${referrerEmail} → ${email}`)
      return
    }
    throw err
  }
}

async function handleSubUpdate(sub, eventId, eventCreated) {
  const item = sub.items.data[0]
  if (COACHING_CREDIT_PRICE_IDS.has(item?.price?.id)) {
    await syncCoachingCredits(sub.id, eventId)
  }
  const plan = getPlanFromPrice(item?.price?.id)
  const tierScope = getTierScope(item?.price?.id)

  if (!plan) {
    console.log(`Skipping non-Ghost-IGL sub update: ${sub.id} price=${item?.price?.id}`)
    return
  }

  const periodEnd = item?.current_period_end ?? sub.current_period_end
  const periodEndIso = Number.isFinite(Number(periodEnd)) ? new Date(Number(periodEnd) * 1000).toISOString() : null
  const evtVersion = eventVersion(eventCreated, eventId)

  try {
    await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { stripe_customer_id: sub.customer },
      ConditionExpression: 'attribute_exists(stripe_customer_id) AND (attribute_not_exists(last_processed_event_id) OR last_processed_event_id <> :evtId) AND (attribute_not_exists(last_event_version) OR last_event_version < :evtVersion)',
      UpdateExpression: 'SET #s = :status, #p = :plan, tier_scope = :scope, price_id = :priceId, current_period_end = :end, updated_at = :now, stripe_subscription_id = :subId, last_processed_event_id = :evtId, last_event_version = :evtVersion',
      ExpressionAttributeNames: { '#s': 'status', '#p': 'plan' },
      ExpressionAttributeValues: {
        ':status': sub.status === 'active' ? 'active' : sub.status,
        ':plan': plan,
        ':scope': tierScope,
        ':priceId': item?.price?.id || null,
        ':end': periodEndIso,
        ':now': new Date().toISOString(),
        ':subId': sub.id,
        ':evtId': eventId,
        ':evtVersion': evtVersion,
      },
    }))
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      // Two reasons this fires:
      //   (1) row doesn't exist yet — awaiting checkout.session.completed
      //   (2) we already processed this event ID for this customer
      // Either way, skipping is safe.
      console.log(`Sub update for ${sub.customer} skipped (row missing or duplicate event ${eventId})`)
      return
    }
    throw err
  }
}

async function handleSubDeleted(sub, eventId, eventCreated) {
  const priceId = sub.items?.data?.[0]?.price?.id
  if (COACHING_CREDIT_PRICE_IDS.has(priceId)) {
    await syncCoachingCredits(sub.id, eventId)
  }
  // Only update if we already have a row for this customer (Ghost IGL customer)
  if (!(await subHasGhostIglCustomer(sub.customer))) return

  try {
    const evtVersion = eventVersion(eventCreated, eventId)
    await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { stripe_customer_id: sub.customer },
      ConditionExpression: '(attribute_not_exists(last_processed_event_id) OR last_processed_event_id <> :evtId) AND (attribute_not_exists(last_event_version) OR last_event_version < :evtVersion)',
      UpdateExpression: 'SET #s = :status, updated_at = :now, last_processed_event_id = :evtId, last_event_version = :evtVersion',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':status': 'canceled',
        ':now': new Date().toISOString(),
        ':evtId': eventId,
        ':evtVersion': evtVersion,
      },
    }))
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      console.log(`Sub deleted for ${sub.customer} skipped — duplicate event ${eventId}`)
      return
    }
    throw err
  }

  // Mark any referral row tied to this subscription as 'churned' so the
  // referrer's "active" count drops accordingly. Uses the GSI on
  // referred_email to find the row from the subscription's customer email.
  try {
    const customer = await stripe.customers.retrieve(sub.customer)
    const email = customer?.email?.toLowerCase()
    if (email) await markReferralChurned(email, sub.id)
  } catch (err) {
    console.error('markReferralChurned failed:', err)
  }
}

async function markReferralChurned(referredEmail, subId) {
  // Query the GSI to find the referrer for this referred user.
  const r = await ddb.send(new QueryCommand({
    TableName: REFERRALS_TABLE,
    IndexName: 'referred-email-index',
    KeyConditionExpression: 'referred_email = :email',
    ExpressionAttributeValues: { ':email': referredEmail },
  }))
  for (const row of r.Items || []) {
    if (subId && row.stripe_subscription_id && row.stripe_subscription_id !== subId) continue
    try {
      await ddb.send(new UpdateCommand({
        TableName: REFERRALS_TABLE,
        Key: { referrer_email: row.referrer_email, referred_email: row.referred_email },
        UpdateExpression: 'SET #s = :status, updated_at = :now',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':status': 'churned', ':now': new Date().toISOString() },
      }))
      console.log(`Referral churned: ${row.referrer_email} → ${row.referred_email}`)
    } catch (err) {
      console.error('Failed to mark referral churned:', err)
    }
  }
}

async function handlePaymentFailed(invoice, eventId, eventCreated) {
  if (invoice.subscription) {
    const sub = await stripe.subscriptions.retrieve(invoice.subscription)
    if (COACHING_CREDIT_PRICE_IDS.has(sub.items?.data?.[0]?.price?.id)) {
      await syncCoachingCredits(sub.id, eventId)
    }
  }
  if (!(await subHasGhostIglCustomer(invoice.customer))) return

  try {
    const evtVersion = eventVersion(eventCreated, eventId)
    await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { stripe_customer_id: invoice.customer },
      ConditionExpression: '(attribute_not_exists(last_processed_event_id) OR last_processed_event_id <> :evtId) AND (attribute_not_exists(last_event_version) OR last_event_version < :evtVersion)',
      UpdateExpression: 'SET #s = :status, updated_at = :now, last_processed_event_id = :evtId, last_event_version = :evtVersion',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':status': 'past_due',
        ':now': new Date().toISOString(),
        ':evtId': eventId,
        ':evtVersion': evtVersion,
      },
    }))
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      console.log(`Payment failed update for ${invoice.customer} skipped — duplicate event ${eventId}`)
      return
    }
    throw err
  }
}

// Multi-price plan resolution. Each tier can have multiple Stripe price IDs
// at once — e.g. $9/$12 Pro and the legacy $29/$39 digital tier now called
// Elite. All prices for a
// tier map to the same plan label so admin/UI logic stays simple.
function getPlanFromPrice(priceId) {
  if (!priceId) return null
  const proIds = [
    process.env.STRIPE_PRO_PRICE_ID,
    process.env.STRIPE_PRO_FOUNDING_PRICE_ID,
    process.env.STRIPE_PRO_ALL_ACCESS_PRICE_ID,
    process.env.STRIPE_PRO_ALL_ACCESS_ANNUAL_PRICE_ID,
    'price_1TPtOKJNddvjgWcg47I16AQp',
    'price_1TLEtrJNddvjgWcg9iTWJoLS',
    'price_1TVUcxJNddvjgWcgBImnUKZe',
    'price_1TVUd3JNddvjgWcgShz9Ndg5',
  ].filter(Boolean)
  const eliteIds = [
    process.env.STRIPE_CHAMPION_PRICE_ID,
    process.env.STRIPE_CHAMPION_FOUNDING_PRICE_ID,
    process.env.STRIPE_CHAMPION_REGULAR_PRICE_ID,
    process.env.STRIPE_CHAMPION_ALL_ACCESS_PRICE_ID,
    process.env.STRIPE_CHAMPION_ALL_ACCESS_ANNUAL_PRICE_ID,
    'price_1TLEtsJNddvjgWcgYcmiNmW7',
    'price_1TPtOYJNddvjgWcgfEWjzGnp',
    'price_1TVUd0JNddvjgWcgIPWakA3S',
    'price_1TVUd6JNddvjgWcgc3csHICD',
  ].filter(Boolean)
  const champIds = [CHAMPION_MEMBERSHIP_PRICE_ID].filter(Boolean)
  if (proIds.includes(priceId)) return 'pro'
  if (eliteIds.includes(priceId)) return 'elite'
  if (champIds.includes(priceId)) return 'champion'
  return null
}

// All-access price IDs unlock every supported game. Single-game prices unlock
// only R6 today (and will unlock the customer's selected game post-multi-game
// rollout). Webhook records this as `tier_scope` on the subscription row so
// the frontend gating layer can decide whether a customer has access to CS2,
// Valorant, etc. when those launch.
function getTierScope(priceId) {
  if (!priceId) return 'single'
  const allAccessIds = [
    process.env.STRIPE_PRO_ALL_ACCESS_PRICE_ID,
    process.env.STRIPE_PRO_ALL_ACCESS_ANNUAL_PRICE_ID,
    process.env.STRIPE_CHAMPION_ALL_ACCESS_PRICE_ID,
    process.env.STRIPE_CHAMPION_ALL_ACCESS_ANNUAL_PRICE_ID,
    'price_1TVUcxJNddvjgWcgBImnUKZe',
    'price_1TVUd3JNddvjgWcgShz9Ndg5',
    'price_1TVUd0JNddvjgWcgIPWakA3S',
    'price_1TVUd6JNddvjgWcgc3csHICD',
  ].filter(Boolean)
  return allAccessIds.includes(priceId) ? 'all_access' : 'single'
}
