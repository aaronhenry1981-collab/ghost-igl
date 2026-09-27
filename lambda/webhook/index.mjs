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
  const subscriptionId = invoiceSubscriptionId(invoice)
  // line.price (pre-basil) or line.pricing.price_details.price (basil+)
  const grantsCredits = (invoice.lines?.data || []).some((l) => COACHING_CREDIT_PRICE_IDS.has(linePriceId(l)))
  if (grantsCredits && subscriptionId) await syncCoachingCredits(subscriptionId, eventId)
  if (subscriptionId && payloadIsMembership(invoice) !== false) {
    const { sub: subscription, ticket, fetchedAt } = await fetchWithTicket(idOf(invoice.customer), subscriptionId)
    const priceId = subscription.items?.data?.[0]?.price?.id
    if (getPlanFromPrice(priceId)) await applySubscriptionState(subscription, eventId, eventCreated, ticket, fetchedAt)
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

// DUPLICATE-SIGNUP GUARD — Stripe payment links create a NEW customer per
// checkout, so one person can complete checkout repeatedly and pile up parallel
// subscriptions. Real incident 2026-07-17: customer@example.com held 3 Champion
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

// SUBSCRIPTION OWNERSHIP — the table holds ONE membership row per Stripe
// customer, but one customer can carry several subscriptions over time (a
// past-due member who buys again, an auto-cancelled duplicate signup, the
// coaching add-on). The row's stripe_subscription_id names the subscription
// that owns the entitlement. An event about any OTHER subscription must not
// cancel, downgrade or re-point that row; before this guard, a newer event
// from an old or duplicate subscription won the last_event_version check and
// took a paying member's access away.
const LIVE_STATUSES = ['active', 'trialing', 'past_due']
const isLiveStatus = (status) => LIVE_STATUSES.includes(status)
const isMembershipPrice = (priceId) => Boolean(getPlanFromPrice(priceId))
const idOf = (ref) => (typeof ref === 'string' ? ref : ref?.id) || null

// The subscription an invoice belongs to, across the payload versions the
// endpoint can receive (its api_version follows the account default):
//   pre-2025-03-31: invoice.subscription (id or expanded object), line.subscription
//   2025-03-31.basil+: invoice.parent.subscription_details.subscription,
//                      line.parent.subscription_item_details.subscription
export function invoiceSubscriptionId(invoice) {
  if (!invoice) return null
  const direct = idOf(invoice.subscription) || idOf(invoice.parent?.subscription_details?.subscription)
  if (direct) return direct
  for (const line of invoice.lines?.data || []) {
    const fromLine = idOf(line.subscription) || idOf(line.parent?.subscription_item_details?.subscription)
    if (fromLine) return fromLine
  }
  return null
}

// ORDERING — Stripe does not guarantee delivery order, event.created has
// one-second resolution, and concurrent Lambda executions can read the clock
// in the same millisecond, so neither event time, event ids nor wall-clock
// stamps order writes. Instead each handler takes a TICKET from the row itself
// (DynamoDB `ADD fetch_seq`: atomic, so every ticket is unique and increasing)
// BEFORE it fetches the subscription from Stripe, and a write lands only if no
// higher ticket has been applied (`applied_seq < :ticket`). Every Stripe change
// emits an event whose handler takes its ticket after the change, so the
// highest applied ticket always carries a snapshot that includes every change
// whose event has been handled. Duplicate delivery is a separate check
// (processed_event_ids). state_fetched_at is kept for diagnostics only.
async function takeTicket(customerId) {
  if (!customerId) return null
  try {
    const out = await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { stripe_customer_id: customerId },
      ConditionExpression: 'attribute_exists(stripe_customer_id)', // never creates a row
      UpdateExpression: 'ADD fetch_seq :one',
      ExpressionAttributeValues: { ':one': 1 },
      ReturnValues: 'UPDATED_NEW',
    }))
    return Number(out.Attributes.fetch_seq)
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') return null // no row for this customer
    throw err
  }
}

// Ticket first, then the Stripe read: the order is what makes the ticket safe.
async function fetchWithTicket(customerId, subscriptionId) {
  const ticket = await takeTicket(customerId)
  const fetchedAt = Date.now() // diagnostic only
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  return { sub, ticket, fetchedAt }
}

// Membership or not, from the event payload itself (subscription item price,
// or invoice line prices in either shape), so add-on and non-Recon events
// never touch the membership table. Returns null when the payload doesn't say.
const linePriceId = (l) => idOf(l.price) || idOf(l.pricing?.price_details?.price)
function payloadIsMembership(obj) {
  const prices = obj?.object === 'invoice' || obj?.lines
    ? (obj.lines?.data || []).map(linePriceId).filter(Boolean)
    : [idOf(obj?.items?.data?.[0]?.price)].filter(Boolean)
  if (!prices.length) return null
  return prices.some(isMembershipPrice)
}

const NOT_DUPLICATE = '(attribute_not_exists(last_processed_event_id) OR last_processed_event_id <> :evtId) AND (attribute_not_exists(processed_event_ids) OR NOT contains(processed_event_ids, :evtId))'
const NEWER_TICKET = '(attribute_not_exists(applied_seq) OR applied_seq < :ticket)'
const BOOKKEEPING_SET = 'applied_seq = :ticket, last_processed_event_id = :evtId, last_event_version = :evtVersion, state_fetched_at = :fetchedAt, updated_at = :now, processed_event_ids = list_append(if_not_exists(processed_event_ids, :noIds), :evtIds)'
const bookkeepingValues = ({ ticket, eventId, eventCreated, fetchedAt }) => ({
  ':ticket': ticket, ':evtId': eventId, ':evtVersion': eventVersion(eventCreated, eventId),
  ':fetchedAt': fetchedAt, ':now': new Date().toISOString(), ':noIds': [], ':evtIds': [eventId],
})

// processed_event_ids is a FIFO list of the most recent event ids for the row.
// Past DEDUPE_TRIM_AT entries the oldest are removed down to DEDUPE_KEEP by a
// size-guarded update (a concurrent append makes it a no-op; the next write
// trims). Handled events per member are a few a month, so 100 ids span years;
// an older redelivery beyond that window re-applies Stripe's CURRENT state
// under its own ticket, which is harmless for the row.
const DEDUPE_KEEP = 100
const DEDUPE_TRIM_AT = 120
async function trimProcessedIds(customerId, attributes) {
  const n = attributes?.processed_event_ids?.length || 0
  if (n <= DEDUPE_TRIM_AT) return
  try {
    await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { stripe_customer_id: customerId },
      ConditionExpression: 'size(processed_event_ids) = :n',
      UpdateExpression: `REMOVE ${Array.from({ length: n - DEDUPE_KEEP }, (_, i) => `processed_event_ids[${i}]`).join(', ')}`,
      ExpressionAttributeValues: { ':n': n },
    }))
  } catch (err) {
    if (err.name !== 'ConditionalCheckFailedException') console.error('trimProcessedIds failed:', err.message)
  }
}

// Conditional update of an existing row for one Stripe event. True when applied.
async function writeEventState({ customerId, ticket, eventId, eventCreated, fetchedAt, set = '', remove = [], condition, names = {}, values = {} }) {
  const params = {
    TableName: TABLE,
    Key: { stripe_customer_id: customerId },
    ConditionExpression: `attribute_exists(stripe_customer_id) AND ${NOT_DUPLICATE} AND ${NEWER_TICKET} AND ${condition}`,
    UpdateExpression: `SET ${[set, BOOKKEEPING_SET].filter(Boolean).join(', ')}${remove.length ? ` REMOVE ${remove.join(', ')}` : ''}`,
    ExpressionAttributeValues: { ...bookkeepingValues({ ticket, eventId, eventCreated, fetchedAt }), ...values },
    ReturnValues: 'UPDATED_NEW',
  }
  if (Object.keys(names).length) params.ExpressionAttributeNames = names
  try {
    const out = await ddb.send(new UpdateCommand(params))
    await trimProcessedIds(customerId, out.Attributes)
    return true
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') return false
    throw err
  }
}

// First row for a customer (checkout completion only). No other handler can
// race it: every other path needs an existing row to take a ticket.
async function createRow(customerId, fields, { eventId, eventCreated, fetchedAt }) {
  try {
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: {
        stripe_customer_id: customerId,
        ...fields,
        fetch_seq: 1,
        applied_seq: 1,
        last_processed_event_id: eventId,
        last_event_version: eventVersion(eventCreated, eventId),
        state_fetched_at: fetchedAt,
        processed_event_ids: [eventId],
      },
      ConditionExpression: 'attribute_not_exists(stripe_customer_id)',
    }))
    return true
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') return false // it exists now: take a ticket instead
    throw err
  }
}

// Condition fragment: this event's subscription owns the row. A row without
// stripe_subscription_id (none exist today) is owned by no subscription, so
// only checkout completion can claim it.
const OWNED_BY_EVENT_SUB = 'stripe_subscription_id = :subId'
// A live subscription may take a row over only from an entitlement that is no
// longer live; while the owner is live, only checkout completion re-points it.
const OWNER_NOT_LIVE = 'NOT (#s IN (:liveA, :liveT, :liveP))'
const LIVE_VALUES = { ':liveA': 'active', ':liveT': 'trialing', ':liveP': 'past_due' }

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
  // Authenticated Checkout writes the verified Cognito email into metadata.
  // Keep legacy Payment Links working as a fallback until they are retired.
  const customerEmail = String(session.metadata?.email || session.customer_email || session.customer_details?.email || '').trim().toLowerCase()
  const checkoutSubject = String(session.metadata?.cognito_sub || session.client_reference_id || '').trim()
  const subscriptionId = session.subscription
  // A first read classifies the checkout (add-on, non-Recon, membership); the
  // write below always uses a second read taken AFTER its ticket.
  let sub = await stripe.subscriptions.retrieve(subscriptionId)
  let ticket = null
  let fetchedAt = Date.now()
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
  // Fails OPEN only on the LOOKUP: if it errors, fall through to normal
  // processing — a rare dupe is recoverable; a broken checkout loses a paying
  // customer. Once a duplicate IS found, errors never fall through (below).
  let dup = null
  try {
    dup = await findDuplicateActiveSub(customerEmail, plan, subscriptionId)
  } catch (err) {
    console.error('duplicate-signup guard failed (continuing to normal processing):', err)
  }
  if (dup) {
    console.log(`DUPLICATE signup: ${customerEmail} already has ${plan} (${dup.stripe_subscription_id}); cancelling new sub ${subscriptionId}`)
    // A redelivered checkout for a duplicate that is already cancelled must
    // stop here. It used to reach the cancel, throw "already canceled", fall
    // through the fail-open catch and overwrite the member's live row with the
    // cancelled duplicate.
    if (sub.status !== 'canceled' && sub.status !== 'incomplete_expired') {
      try {
        await stripe.subscriptions.cancel(subscriptionId)
      } catch (err) {
        const now = await stripe.subscriptions.retrieve(subscriptionId)
        if (now.status !== 'canceled') throw err // let Stripe retry; never fall through
      }
    }
    // Two subscriptions can exist on one Stripe Customer. Never overwrite the
    // live DynamoDB row with the canceled duplicate when they share a customer ID.
    // On a different customer the audit row is written only if none exists.
    if (dup.stripe_customer_id !== customerId) {
      const created = await createRow(customerId, {
        email: customerEmail, stripe_subscription_id: subscriptionId, plan, tier_scope: tierScope, price_id: item?.price?.id,
        status: 'canceled', note: `auto-cancelled duplicate signup — already had ${plan} (${dup.stripe_subscription_id})`,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }, { eventId, eventCreated, fetchedAt })
      if (!created) console.log(`Duplicate-signup audit row for ${customerId} skipped (a row already exists)`)
    }
    return
  }

  // The row write. A first row is created outright; an existing row is updated
  // under a ticket. If the first-row create loses a race, take a ticket, read
  // Stripe again and retry (bounded; Stripe redelivers on the final error).
  const fieldsFor = (s) => {
    const it = s.items.data[0]
    // As of API version 2025-10-29.clover, current_period_end moved from the
    // subscription to each item. Fall back to the legacy field for safety.
    const periodEnd = it?.current_period_end ?? s.current_period_end
    const subCreated = Number.isFinite(Number(s.created)) ? Number(s.created) : null
    return {
      email: customerEmail,
      stripe_subscription_id: subscriptionId,
      plan: getPlanFromPrice(it?.price?.id),
      tier_scope: getTierScope(it?.price?.id), // 'single' | 'all_access' — which games unlocked
      price_id: it?.price?.id, // for diagnostics + audit
      status: s.status,
      current_period_end: Number.isFinite(Number(periodEnd)) ? new Date(Number(periodEnd) * 1000).toISOString() : null,
      created_at: new Date().toISOString(),
      ...(subCreated !== null ? { subscription_created: subCreated } : {}),
      ...(checkoutSubject ? { cognito_sub: checkoutSubject, identity_bound_at: new Date().toISOString() } : {}),
    }
  }
  let applied = false
  for (let attempt = 0; attempt < 3; attempt++) {
    ({ sub, ticket, fetchedAt } = await fetchWithTicket(customerId, subscriptionId))
    const fields = fieldsFor(sub)
    if (!fields.plan) return
    if (ticket === null) {
      if (await createRow(customerId, { ...fields, updated_at: new Date().toISOString() }, { eventId, eventCreated, fetchedAt })) { applied = true; break }
      continue // the row appeared concurrently
    }
    // Existing row: not a duplicate delivery, no higher ticket applied, and
    // allowed to own it. A completed checkout for a LIVE subscription may
    // re-point the row (a past-due member buying again) unless the row already
    // belongs to a live subscription created later (a late or replayed older
    // checkout). A checkout whose subscription is no longer live never
    // displaces a live owner. Fields a full replace used to drop are removed.
    const live = isLiveStatus(fields.status)
    const precedence = live && fields.subscription_created !== undefined
    const names = { '#s': 'status', '#p': 'plan' }
    const setKeys = Object.keys(fields).map((k) => (k === 'status' ? '#s = :f_status' : k === 'plan' ? '#p = :f_plan' : `${k} = :f_${k}`))
    const values = { ':subId': subscriptionId, ...LIVE_VALUES, ...Object.fromEntries(Object.entries(fields).map(([k, v]) => [`:f_${k}`, v])) }
    if (precedence) values[':subCreated'] = fields.subscription_created
    applied = await writeEventState({
      customerId, ticket, eventId, eventCreated, fetchedAt,
      set: setKeys.join(', '),
      remove: ['subscription_id', 'cancel_at_period_end', 'comp', 'comp_note', 'note', 'deleted_at'],
      condition: `(${OWNED_BY_EVENT_SUB} OR ${OWNER_NOT_LIVE}` +
        (live ? ' OR attribute_not_exists(stripe_subscription_id)' : '') +
        (precedence ? ' OR attribute_not_exists(subscription_created) OR subscription_created <= :subCreated' : '') + ')',
      names, values,
    })
    if (!applied) {
      console.log(`Skipping checkout event ${eventId} for customer ${customerId} (duplicate delivery, a newer ticket already applied, or a subscription that may not own the row)`)
      return
    }
    break
  }
  if (!applied) throw new Error(`checkout ${eventId}: row write did not settle; letting Stripe redeliver`)

  // Track referrals — if this user's profile has a referred_by field, write
  // a row to the referrals table tying this new subscription to the
  // referrer. Status starts as 'pending' and the daily cron promotes to
  // 'active' once REFERRAL_QUALIFY_DAYS pass without churn.
  try {
    await trackReferralIfAny(customerEmail, plan, subscriptionId, tierScope)
  } catch (err) {
    // Non-fatal — log and continue. The checkout already wrote successfully.
    console.error('trackReferralIfAny failed:', err)
  }

  // Stamp founding-referrer flag on the profile if this user subscribed
  // before the program cutoff. Permanent flag — locks in the referral
  // benefit at their current tier forever, even after the program
  // restricts to Champion+ only post-launch.
  try {
    await markFoundingReferrerIfEligible(customerEmail)
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
    const cognitoSubject = checkoutSubject || await ensureCognitoAccount(customerEmail)
    if (cognitoSubject) {
      const now = new Date().toISOString()
      await Promise.all([
        ddb.send(new UpdateCommand({
          TableName: TABLE,
          Key: { stripe_customer_id: customerId },
          UpdateExpression: 'SET cognito_sub = if_not_exists(cognito_sub, :subject), identity_bound_at = if_not_exists(identity_bound_at, :now)',
          ExpressionAttributeValues: { ':subject': cognitoSubject, ':now': now },
        })),
        ddb.send(new UpdateCommand({
          TableName: PROFILES_TABLE,
          Key: { email: customerEmail },
          UpdateExpression: 'SET stripe_customer_id = :customer, cognito_sub = if_not_exists(cognito_sub, :subject), updated_at = :now',
          ExpressionAttributeValues: { ':customer': customerId, ':subject': cognitoSubject, ':now': now },
        })),
      ])
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

// customer.subscription.created / .updated. The payload can be stale (Stripe
// does not guarantee delivery order), so the row is written from the
// subscription as Stripe holds it NOW, not from the event body.
async function handleSubUpdate(eventSub, eventId, eventCreated) {
  if (payloadIsMembership(eventSub) === false) {
    // Coaching add-on (or a non-Recon price): its credits only, no membership row.
    if (COACHING_CREDIT_PRICE_IDS.has(idOf(eventSub.items?.data?.[0]?.price))) await syncCoachingCredits(eventSub.id, eventId)
    else console.log(`Skipping non-Ghost-IGL sub update: ${eventSub.id}`)
    return
  }
  const { sub, ticket, fetchedAt } = await fetchWithTicket(idOf(eventSub.customer), eventSub.id)
  await applySubscriptionState(sub, eventId, eventCreated, ticket, fetchedAt)
}

async function applySubscriptionState(sub, eventId, eventCreated, ticket, fetchedAt) {
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
  if (ticket === null) {
    console.log(`Sub update ${sub.id}: no row for ${idOf(sub.customer)} yet (awaiting checkout.session.completed)`)
    return
  }

  const periodEnd = item?.current_period_end ?? sub.current_period_end
  const periodEndIso = Number.isFinite(Number(periodEnd)) ? new Date(Number(periodEnd) * 1000).toISOString() : null
  const subCreated = Number.isFinite(Number(sub.created)) ? Number(sub.created) : null

  // Ownership: update the row only for the subscription that owns it. A live
  // subscription may take over a row whose entitlement is no longer live;
  // while the owner is live, only checkout completion re-points the row.
  const live = isLiveStatus(sub.status)
  const applied = await writeEventState({
    customerId: idOf(sub.customer), ticket, eventId, eventCreated, fetchedAt,
    set: '#s = :status, #p = :plan, tier_scope = :scope, price_id = :priceId, current_period_end = :end, stripe_subscription_id = :subId' +
      (subCreated !== null ? ', subscription_created = :subCreated' : ''),
    condition: live ? `(${OWNED_BY_EVENT_SUB} OR ${OWNER_NOT_LIVE})` : OWNED_BY_EVENT_SUB,
    names: { '#s': 'status', '#p': 'plan' },
    values: {
      ':status': sub.status === 'active' ? 'active' : sub.status,
      ':plan': plan,
      ':scope': tierScope,
      ':priceId': item?.price?.id || null,
      ':end': periodEndIso,
      ':subId': sub.id,
      ...(subCreated !== null ? { ':subCreated': subCreated } : {}),
      ...(live ? LIVE_VALUES : {}),
    },
  })
  // Skipped writes, all safe: a duplicate delivery, a newer ticket already
  // applied (its snapshot is at least as new), or not the owning subscription.
  if (!applied) console.log(`Sub update ${sub.id} for ${idOf(sub.customer)} skipped (duplicate delivery, newer ticket applied, or not the owning subscription)`)
}

async function handleSubDeleted(sub, eventId, eventCreated) {
  const priceId = sub.items?.data?.[0]?.price?.id
  if (COACHING_CREDIT_PRICE_IDS.has(priceId)) {
    await syncCoachingCredits(sub.id, eventId)
  }
  // A deleted coaching add-on (or any non-membership price) ends only its own
  // credits above; it never cancels the base membership row.
  if (!isMembershipPrice(priceId)) {
    console.log(`Sub deleted ${sub.id}: price ${priceId} is not a membership; membership row untouched`)
    return
  }
  const customerId = idOf(sub.customer)
  // Ticket (only if this customer has a row), then the subscription as Stripe
  // holds it now (a deleted subscription reads back as canceled).
  const { sub: current, ticket, fetchedAt } = await fetchWithTicket(customerId, sub.id)
  if (ticket === null) return // not a Recon member
  // Only the owning subscription can cancel the row: an old or duplicate
  // subscription on the same customer must not end a newer paid membership.
  const applied = await writeEventState({
    customerId, ticket, eventId, eventCreated, fetchedAt,
    set: '#s = :status',
    condition: OWNED_BY_EVENT_SUB,
    names: { '#s': 'status' },
    values: { ':status': current.status || 'canceled', ':subId': sub.id },
  })
  if (!applied) {
    console.log(`Sub deleted ${sub.id} for ${customerId} skipped (duplicate delivery, newer ticket applied, or not the owning subscription)`)
    return
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
  // Resolve the invoice to ITS subscription (both payload versions). An
  // invoice with no subscription (a one-off charge) says nothing about the
  // membership; it used to mark the whole customer past due.
  const subscriptionId = invoiceSubscriptionId(invoice)
  if (!subscriptionId) {
    console.log(`Payment failed ${invoice.id}: not a subscription invoice; membership row untouched`)
    return
  }
  const customerId = idOf(invoice.customer)
  if (payloadIsMembership(invoice) === false) {
    // Add-on (or non-Recon) invoice: its credits only; the membership row is never touched.
    const addon = (invoice.lines?.data || []).some((l) => COACHING_CREDIT_PRICE_IDS.has(linePriceId(l)))
    if (addon) await syncCoachingCredits(subscriptionId, eventId)
    console.log(`Payment failed on ${subscriptionId}: not a membership invoice; membership row untouched`)
    return
  }
  const { sub, ticket, fetchedAt } = await fetchWithTicket(customerId, subscriptionId)
  const priceId = sub.items?.data?.[0]?.price?.id
  if (COACHING_CREDIT_PRICE_IDS.has(priceId)) {
    await syncCoachingCredits(sub.id, eventId)
  }
  if (!isMembershipPrice(priceId)) {
    console.log(`Payment failed on ${sub.id} (price ${priceId}): not a membership; membership row untouched`)
    return
  }
  // Write what Stripe holds now. A late failure event for an invoice that has
  // since been paid (subscription active again) must not re-downgrade access.
  if (sub.status !== 'past_due' && sub.status !== 'unpaid') {
    console.log(`Payment failed on ${sub.id} but Stripe reports ${sub.status}; row untouched`)
    return
  }
  if (ticket === null) return // not a Recon member
  // Only the owning subscription's failure changes the row, and only if no
  // newer ticket (e.g. a recovery that read Stripe later) has been applied.
  const applied = await writeEventState({
    customerId, ticket, eventId, eventCreated, fetchedAt,
    set: '#s = :status',
    condition: OWNED_BY_EVENT_SUB,
    names: { '#s': 'status' },
    values: { ':status': sub.status, ':subId': sub.id },
  })
  if (!applied) console.log(`Payment failed update ${sub.id} for ${customerId} skipped (duplicate delivery, newer ticket applied, or not the owning subscription)`)
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
