import Stripe from 'stripe'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
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
    console.error('Webhook signature verification failed:', err.message)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  // Pass the event ID into each handler so they can skip duplicate processing.
  // Stripe redelivers events on transient 5xx — without this guard, we'd
  // process the same checkout.session.completed twice and risk inconsistent
  // state if any handler isn't strictly idempotent.
  const eventId = stripeEvent.id

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckout(stripeEvent.data.object, eventId)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubUpdate(stripeEvent.data.object, eventId)
        break
      case 'customer.subscription.deleted':
        await handleSubDeleted(stripeEvent.data.object, eventId)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object, eventId)
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

// Coaching confirmation is owned by the booking Lambda (it has the slot table,
// SES, and .ics). The webhook just pings /booking/finalize, which re-verifies
// payment with Stripe (idempotent) and flips held → confirmed.
async function finalizeCoaching(session) {
  const base = process.env.BOOKING_API || 'https://u0k402df6j.execute-api.us-east-1.amazonaws.com/prod'
  try {
    const r = await fetch(`${base}/booking/finalize`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id }),
    })
    console.log(`coaching finalize ${session.id}: HTTP ${r.status}`)
  } catch (err) {
    console.error('coaching finalize failed:', err.message)
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

async function handleCheckout(session, eventId) {
  // RECON6 coaching = one-time payment with a booking slot in metadata. Confirm
  // the held slot via the booking API and stop — this is NOT an app sub. The
  // subscription path below is untouched.
  if (session.mode === 'payment' && session.metadata?.slotId) {
    await finalizeCoaching(session)
    return
  }
  if (session.mode !== 'subscription') return

  const customerId = session.customer
  const customerEmail = session.customer_email || session.customer_details?.email
  const subscriptionId = session.subscription

  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  const item = sub.items.data[0]
  const plan = getPlanFromPrice(item?.price?.id)
  const tierScope = getTierScope(item?.price?.id)

  if (!plan) {
    console.log(`Skipping non-Ghost-IGL checkout: sub=${subscriptionId} price=${item?.price?.id}`)
    return
  }

  // As of API version 2025-10-29.clover, current_period_end moved from the
  // subscription to each item. Fall back to the legacy field for safety.
  const periodEnd = item?.current_period_end ?? sub.current_period_end

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
        status: 'active',
        current_period_end: new Date(periodEnd * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_processed_event_id: eventId,
      },
      ConditionExpression: 'attribute_not_exists(last_processed_event_id) OR last_processed_event_id <> :evtId',
      ExpressionAttributeValues: { ':evtId': eventId },
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
    await ensureCognitoAccount(customerEmail?.toLowerCase())
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
  if (!email || !USER_POOL_ID) return
  try {
    await cognito.send(new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: email }))
    return // already has a login — nothing to do
  } catch (err) {
    if (err.name !== 'UserNotFoundException') throw err
  }
  await cognito.send(new AdminCreateUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: email,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' },
    ],
    DesiredDeliveryMediums: ['EMAIL'],
  }))
  console.log(`Provisioned Cognito login for paid customer ${email}`)
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

async function handleSubUpdate(sub, eventId) {
  const item = sub.items.data[0]
  const plan = getPlanFromPrice(item?.price?.id)
  const tierScope = getTierScope(item?.price?.id)

  if (!plan) {
    console.log(`Skipping non-Ghost-IGL sub update: ${sub.id} price=${item?.price?.id}`)
    return
  }

  const periodEnd = item?.current_period_end ?? sub.current_period_end

  try {
    await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { stripe_customer_id: sub.customer },
      ConditionExpression: 'attribute_exists(stripe_customer_id) AND (attribute_not_exists(last_processed_event_id) OR last_processed_event_id <> :evtId)',
      UpdateExpression: 'SET #s = :status, #p = :plan, tier_scope = :scope, price_id = :priceId, current_period_end = :end, updated_at = :now, stripe_subscription_id = :subId, last_processed_event_id = :evtId',
      ExpressionAttributeNames: { '#s': 'status', '#p': 'plan' },
      ExpressionAttributeValues: {
        ':status': sub.status === 'active' ? 'active' : sub.status,
        ':plan': plan,
        ':scope': tierScope,
        ':priceId': item?.price?.id || null,
        ':end': new Date(periodEnd * 1000).toISOString(),
        ':now': new Date().toISOString(),
        ':subId': sub.id,
        ':evtId': eventId,
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

async function handleSubDeleted(sub, eventId) {
  // Only update if we already have a row for this customer (Ghost IGL customer)
  if (!(await subHasGhostIglCustomer(sub.customer))) return

  try {
    await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { stripe_customer_id: sub.customer },
      ConditionExpression: 'attribute_not_exists(last_processed_event_id) OR last_processed_event_id <> :evtId',
      UpdateExpression: 'SET #s = :status, updated_at = :now, last_processed_event_id = :evtId',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':status': 'canceled',
        ':now': new Date().toISOString(),
        ':evtId': eventId,
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

async function handlePaymentFailed(invoice, eventId) {
  if (!(await subHasGhostIglCustomer(invoice.customer))) return

  try {
    await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { stripe_customer_id: invoice.customer },
      ConditionExpression: 'attribute_not_exists(last_processed_event_id) OR last_processed_event_id <> :evtId',
      UpdateExpression: 'SET #s = :status, updated_at = :now, last_processed_event_id = :evtId',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':status': 'past_due',
        ':now': new Date().toISOString(),
        ':evtId': eventId,
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
// at once — e.g. founding-rate ($9 Pro, $29 Champion) sold pre-launch and
// regular-rate ($12 Pro, $39 Champion) sold post-launch. All prices for a
// tier map to the same plan label so admin/UI logic stays simple.
function getPlanFromPrice(priceId) {
  if (!priceId) return null
  const proIds = [
    process.env.STRIPE_PRO_PRICE_ID,
    process.env.STRIPE_PRO_FOUNDING_PRICE_ID,
    process.env.STRIPE_PRO_ALL_ACCESS_PRICE_ID,
    process.env.STRIPE_PRO_ALL_ACCESS_ANNUAL_PRICE_ID,
  ].filter(Boolean)
  const champIds = [
    process.env.STRIPE_CHAMPION_PRICE_ID,
    process.env.STRIPE_CHAMPION_FOUNDING_PRICE_ID,
    process.env.STRIPE_CHAMPION_REGULAR_PRICE_ID,
    process.env.STRIPE_CHAMPION_ALL_ACCESS_PRICE_ID,
    process.env.STRIPE_CHAMPION_ALL_ACCESS_ANNUAL_PRICE_ID,
  ].filter(Boolean)
  if (proIds.includes(priceId)) return 'pro'
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
  ].filter(Boolean)
  return allAccessIds.includes(priceId) ? 'all_access' : 'single'
}
