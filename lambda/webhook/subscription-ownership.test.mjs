// Regression tests for subscription ownership of the membership row.
//
// The subscriptions table holds ONE membership row per Stripe customer, but a
// customer can carry several subscriptions (a past-due member who buys again,
// an auto-cancelled duplicate signup, the coaching add-on). Before the
// ownership guard, a newer event about ANY of them could cancel or downgrade a
// paying member. These tests drive the real exported handler() with SIGNED
// Stripe events (signature verification runs for real); Stripe's API,
// DynamoDB (conditions enforced), Cognito and fetch are in-memory fakes.
// All ids and emails are synthetic.
//
// Run: node --test lambda/webhook/subscription-ownership.test.mjs
// (colocated so `stripe` / `@aws-sdk/*` resolve from this Lambda's node_modules)

import test, { beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createFakeDynamo } from './test-support/fakeDynamo.mjs'

process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
process.env.COACHING_ADDON_PRICE_ID = 'price_addon_test'
process.env.STRIPE_CHAMPION_MEMBERSHIP_PRICE_ID = 'price_champion_membership_test'
process.env.BOOKING_API = 'https://booking.test'
process.env.COGNITO_USER_POOL_ID = 'us-east-1_TESTPOOL'
// Isolation: any AWS call that escapes the fakes below fails locally instead
// of reaching a real account with the developer's credentials.
process.env.AWS_ACCESS_KEY_ID = 'AKIATESTONLY'
process.env.AWS_SECRET_ACCESS_KEY = 'test-only'
process.env.AWS_SESSION_TOKEN = ''
process.env.AWS_REGION = 'us-east-1'
process.env.AWS_ENDPOINT_URL = 'http://127.0.0.1:9'
delete process.env.AWS_PROFILE

const PRO = 'price_1TLEtrJNddvjgWcg9iTWJoLS' // Pro $12 (non-secret price id the handler maps)
const ELITE = 'price_1TPtOYJNddvjgWcgfEWjzGnp' // Elite $39
const ADDON = 'price_addon_test'
const CUS = 'cus_TESTmemberA'
const EMAIL = 'member-a@example.com'
const SUBS = 'ghost-igl-subscriptions'
const T0 = 1790000000 // event.created, seconds
const DAY = 86400

const { handler, invoiceSubscriptionId } = await import('./index.mjs')
const Stripe = (await import('stripe')).default
const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb')
const { CognitoIdentityProviderClient } = await import('@aws-sdk/client-cognito-identity-provider')
const signer = new Stripe('sk_test_dummy')

// ---- fakes -----------------------------------------------------------------
const db = createFakeDynamo()
const ownerOf = (obj, name) => { let p = obj; while (p && !Object.prototype.hasOwnProperty.call(p, name)) p = Object.getPrototypeOf(p); return p }
// The two SDK clients may resolve `send` from different prototypes (separate
// @smithy copies), so each is faked on its own owner, and every other client
// sharing a prototype is refused rather than allowed onto the network.
const fakeSends = new Map([
  [ownerOf(DynamoDBDocumentClient.prototype, 'send'), null],
  [ownerOf(CognitoIdentityProviderClient.prototype, 'send'), null],
])
for (const proto of fakeSends.keys()) {
  mock.method(proto, 'send', function (cmd) {
    if (this instanceof DynamoDBDocumentClient) return db.send(cmd)
    if (this instanceof CognitoIdentityProviderClient) return cognitoSend(cmd)
    return Promise.reject(new Error(`test isolation: unexpected AWS call ${cmd?.constructor?.name}`))
  })
}

const cognitoUsers = new Map()
let cognitoCreates = 0
function cognitoSend(cmd) {
  const name = cmd.constructor.name
  if (name === 'AdminGetUserCommand') {
    const u = cognitoUsers.get(cmd.input.Username)
    if (!u) { const e = new Error('User does not exist.'); e.name = 'UserNotFoundException'; return Promise.reject(e) }
    return Promise.resolve({ Username: u.sub, UserAttributes: [{ Name: 'sub', Value: u.sub }] })
  }
  if (name === 'AdminCreateUserCommand') {
    cognitoCreates++
    const sub = `00000000-0000-4000-8000-${String(cognitoCreates).padStart(12, '0')}`
    cognitoUsers.set(cmd.input.Username, { sub })
    return Promise.resolve({ User: { Username: sub, Attributes: [{ Name: 'sub', Value: sub }] } })
  }
  return Promise.reject(new Error(`unexpected Cognito command ${name}`))
}

const stripeSubs = new Map()
let cancelCalls = []
let customerRetrieves = 0
const subsProto = Object.getPrototypeOf(signer.subscriptions)
// A gate holds a retrieve AFTER it has read Stripe's state, to model a slow
// request that returns an old snapshot and writes after a newer one.
const retrieveGates = new Map()
mock.method(subsProto, 'retrieve', async (id) => {
  const s = stripeSubs.get(id)
  if (!s) { const e = new Error(`No such subscription: '${id}'`); e.type = 'StripeInvalidRequestError'; throw e }
  const snapshot = structuredClone(s)
  const gate = retrieveGates.get(id)
  if (gate) { retrieveGates.delete(id); gate.reached(); await gate.release }
  return snapshot
})
function holdNextRetrieve(id) {
  let release, reached
  const g = { release: new Promise((r) => { release = r }), reachedP: new Promise((r) => { reached = r }) }
  retrieveGates.set(id, { release: g.release, reached })
  return { release, reached: g.reachedP }
}
// Monotonic wall clock (ms): every Date.now() call is later than the previous one.
let clockMs = Date.now()
mock.method(Date, 'now', () => ++clockMs)
mock.method(subsProto, 'cancel', async (id) => {
  cancelCalls.push(id)
  const s = stripeSubs.get(id)
  if (!s || s.status === 'canceled') { const e = new Error('This subscription is already canceled.'); e.type = 'StripeInvalidRequestError'; throw e }
  s.status = 'canceled'
  return structuredClone(s)
})
mock.method(Object.getPrototypeOf(signer.customers), 'retrieve', async (id) => { customerRetrieves++; return { id, email: EMAIL } })

let bookingCalls = []
globalThis.fetch = async (url, opts) => {
  bookingCalls.push({ url, body: JSON.parse(opts.body) })
  return { ok: true, status: 200, json: async () => ({ ok: true }) }
}

// ---- builders ----------------------------------------------------------------
// shape 'legacy' = pre-2025-03-31 payloads; 'basil' = 2025-03-31.basil and later
// (current_period_end on the item, invoice subscription under parent).
function stripeSub(id, { customer = CUS, price = PRO, status = 'active', end = T0 + 30 * DAY, shape = 'legacy' } = {}) {
  const item = { id: `si_${id}`, price: { id: price }, ...(shape === 'basil' ? { current_period_end: end } : {}) }
  const s = { id, object: 'subscription', customer, status, items: { data: [item] }, ...(shape === 'legacy' ? { current_period_end: end } : {}) }
  stripeSubs.set(id, s)
  return s
}
const setStatus = (id, status, extra = {}) => Object.assign(stripeSubs.get(id), { status }, extra)

function signed(obj) {
  const payload = JSON.stringify(obj)
  const sig = signer.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET })
  return { headers: { 'stripe-signature': sig }, body: payload, isBase64Encoded: false }
}
async function deliver(id, type, created, object) {
  const res = await handler(signed({ id, object: 'event', type, created, data: { object } }))
  assert.equal(res.statusCode, 200, `${type} ${id} should be accepted`)
  return res
}
const checkout = (id, created, subId, { customer = CUS, email = EMAIL } = {}) =>
  deliver(id, 'checkout.session.completed', created, { id: `cs_TEST_${id}`, object: 'checkout.session', mode: 'subscription', customer, subscription: subId, customer_email: email, metadata: { email }, payment_status: 'paid' })
const subEvent = (id, type, created, subId, payloadOverride = {}) =>
  deliver(id, type, created, { ...structuredClone(stripeSubs.get(subId) || { id: subId, customer: CUS, items: { data: [{ price: { id: PRO } }] } }), ...payloadOverride })
function invoice(subId, { customer = CUS, price = PRO, shape = 'legacy', id = `in_TEST_${subId}` } = {}) {
  return shape === 'legacy'
    ? { id, object: 'invoice', customer, subscription: subId, lines: { data: [{ price: { id: price }, subscription: subId }] } }
    : { id, object: 'invoice', customer, parent: { type: 'subscription_details', subscription_details: { subscription: subId } },
        lines: { data: [{ pricing: { price_details: { price } }, parent: { type: 'subscription_item_details', subscription_item_details: { subscription: subId } } }] } }
}
const row = (customer = CUS) => db.get(SUBS, { stripe_customer_id: customer })

beforeEach(() => {
  db.reset(); stripeSubs.clear(); cognitoUsers.clear()
  cancelCalls = []; bookingCalls = []; cognitoCreates = 0; customerRetrieves = 0
})

// A member on Pro (sub_TESTold) who went past due and then bought Elite (sub_TESTnew)
// on the SAME Stripe customer — the reachable production case.
async function pastDueMemberWhoBoughtAgain() {
  stripeSub('sub_TESTold', { price: PRO })
  await checkout('evt_TEST_c1', T0, 'sub_TESTold')
  setStatus('sub_TESTold', 'past_due')
  await deliver('evt_TEST_f1', 'invoice.payment_failed', T0 + 30 * DAY, invoice('sub_TESTold'))
  assert.equal(row().status, 'past_due')
  stripeSub('sub_TESTnew', { price: ELITE, status: 'active', end: T0 + 61 * DAY })
  await checkout('evt_TEST_c2', T0 + 31 * DAY, 'sub_TESTnew')
  assert.equal(row().stripe_subscription_id, 'sub_TESTnew')
  assert.equal(row().status, 'active')
}

// ---- 1. old subscription cannot cancel a newer paid membership ------------------
test("an old subscription's cancellation cannot cancel a newer paid membership", async () => {
  await pastDueMemberWhoBoughtAgain()
  setStatus('sub_TESTold', 'canceled')
  await subEvent('evt_TEST_d1', 'customer.subscription.deleted', T0 + 40 * DAY, 'sub_TESTold')
  assert.deepEqual([row().status, row().plan, row().stripe_subscription_id], ['active', 'elite', 'sub_TESTnew'])
})

test("an old subscription's later updates cannot re-point or downgrade the row", async () => {
  await pastDueMemberWhoBoughtAgain()
  setStatus('sub_TESTold', 'unpaid')
  await subEvent('evt_TEST_u1', 'customer.subscription.updated', T0 + 38 * DAY, 'sub_TESTold')
  assert.deepEqual([row().status, row().stripe_subscription_id], ['active', 'sub_TESTnew'])
})

// ---- 2. old subscription's failed payment cannot mark the newer one past due ---
for (const shape of ['legacy', 'basil']) {
  test(`an old subscription's failed payment cannot mark a newer paid membership past due (${shape} invoice)`, async () => {
    await pastDueMemberWhoBoughtAgain()
    await deliver(`evt_TEST_f2_${shape}`, 'invoice.payment_failed', T0 + 35 * DAY, invoice('sub_TESTold', { shape }))
    assert.deepEqual([row().status, row().stripe_subscription_id], ['active', 'sub_TESTnew'])
  })
}

test('a failed one-off invoice with no subscription never marks the membership past due', async () => {
  stripeSub('sub_TESTa'); await checkout('evt_TEST_c1', T0, 'sub_TESTa')
  await deliver('evt_TEST_f1', 'invoice.payment_failed', T0 + DAY, { id: 'in_TEST_oneoff', object: 'invoice', customer: CUS, lines: { data: [{ price: { id: 'price_TEST_oneoff' } }] } })
  assert.equal(row().status, 'active')
})

// ---- 3. coaching add-on --------------------------------------------------------
test('canceling a coaching add-on cannot cancel the base membership', async () => {
  stripeSub('sub_TESTbase', { price: PRO }); await checkout('evt_TEST_c1', T0, 'sub_TESTbase')
  stripeSub('sub_TESTaddon', { price: ADDON })
  setStatus('sub_TESTaddon', 'canceled')
  await subEvent('evt_TEST_d1', 'customer.subscription.deleted', T0 + 5 * DAY, 'sub_TESTaddon')
  assert.deepEqual([row().status, row().stripe_subscription_id], ['active', 'sub_TESTbase'])
  assert.ok(bookingCalls.some((c) => c.url.endsWith('/booking/credits') && c.body.subscriptionId === 'sub_TESTaddon'), 'add-on credits still synced')
})

test('a failed add-on payment cannot mark the base membership past due', async () => {
  stripeSub('sub_TESTbase', { price: PRO }); await checkout('evt_TEST_c1', T0, 'sub_TESTbase')
  stripeSub('sub_TESTaddon', { price: ADDON, status: 'past_due' })
  await deliver('evt_TEST_f1', 'invoice.payment_failed', T0 + 5 * DAY, invoice('sub_TESTaddon', { price: ADDON }))
  assert.equal(row().status, 'active')
})

// ---- 4. replays ------------------------------------------------------------------
test('a replayed checkout does not repeat the row write, referral, account creation or profile write', async () => {
  db.put('ghost-igl-profiles', { email: EMAIL, referred_by: 'referrer-b@example.com' })
  stripeSub('sub_TESTa')
  await checkout('evt_TEST_c1', T0, 'sub_TESTa')
  const counts = () => [db.writes(SUBS).length, db.writes('ghost-igl-referrals').length, cognitoCreates, db.writes('ghost-igl-profiles').length]
  const after1 = counts()
  await checkout('evt_TEST_c1', T0, 'sub_TESTa') // Stripe redelivery
  await checkout('evt_TEST_c1', T0, 'sub_TESTa')
  assert.deepEqual(counts(), after1)
  assert.equal(after1[1], 1); assert.equal(after1[2], 1)
})

test('a replayed cancellation does not repeat the row write or the referral churn', async () => {
  db.put('ghost-igl-referrals', { referrer_email: 'referrer-b@example.com', referred_email: EMAIL, stripe_subscription_id: 'sub_TESTa', status: 'active' })
  stripeSub('sub_TESTa'); await checkout('evt_TEST_c1', T0, 'sub_TESTa')
  setStatus('sub_TESTa', 'canceled')
  await subEvent('evt_TEST_d1', 'customer.subscription.deleted', T0 + 9 * DAY, 'sub_TESTa')
  const before = [db.writes(SUBS).length, db.writes('ghost-igl-referrals').length, customerRetrieves]
  await subEvent('evt_TEST_d1', 'customer.subscription.deleted', T0 + 9 * DAY, 'sub_TESTa')
  assert.deepEqual([db.writes(SUBS).length, db.writes('ghost-igl-referrals').length, customerRetrieves], before)
  assert.equal(row().status, 'canceled')
})

test('a replayed duplicate-signup checkout cannot overwrite the live member with the cancelled duplicate', async () => {
  stripeSub('sub_TESTfirst', { price: PRO }); await checkout('evt_TEST_c1', T0, 'sub_TESTfirst')
  stripeSub('sub_TESTdup', { price: PRO })
  await checkout('evt_TEST_c2', T0 + 60, 'sub_TESTdup') // same plan, same email → auto-cancel
  assert.deepEqual(cancelCalls, ['sub_TESTdup'])
  await checkout('evt_TEST_c2', T0 + 60, 'sub_TESTdup') // redelivery: dup is now canceled in Stripe
  assert.deepEqual(cancelCalls, ['sub_TESTdup'], 'no second cancel')
  assert.deepEqual([row().status, row().stripe_subscription_id], ['active', 'sub_TESTfirst'])
})

test('the duplicate\'s own created/deleted events cannot take over or cancel the live row', async () => {
  stripeSub('sub_TESTfirst', { price: PRO }); await checkout('evt_TEST_c1', T0, 'sub_TESTfirst')
  stripeSub('sub_TESTdup', { price: PRO })
  await subEvent('evt_TEST_s1', 'customer.subscription.created', T0 + 59, 'sub_TESTdup')
  assert.equal(row().stripe_subscription_id, 'sub_TESTfirst', 'created event of a second live sub does not re-point the row')
  await checkout('evt_TEST_c2', T0 + 60, 'sub_TESTdup')
  await subEvent('evt_TEST_d1', 'customer.subscription.deleted', T0 + 61, 'sub_TESTdup')
  assert.deepEqual([row().status, row().stripe_subscription_id], ['active', 'sub_TESTfirst'])
})

// ---- 5. late / out-of-order events -----------------------------------------------
test('an older event delivered late cannot overwrite a newer state', async () => {
  stripeSub('sub_TESTa'); await checkout('evt_TEST_c1', T0, 'sub_TESTa')
  setStatus('sub_TESTa', 'active')
  await subEvent('evt_TEST_u2', 'customer.subscription.updated', T0 + 20 * DAY, 'sub_TESTa')
  const snap = row()
  setStatus('sub_TESTa', 'past_due') // what an older snapshot said
  await subEvent('evt_TEST_u1', 'customer.subscription.updated', T0 + 10 * DAY, 'sub_TESTa')
  assert.deepEqual(row(), snap)
})

test('a stale payload is not trusted: the row takes the subscription state Stripe holds now', async () => {
  stripeSub('sub_TESTa'); await checkout('evt_TEST_c1', T0, 'sub_TESTa')
  setStatus('sub_TESTa', 'active')
  // Delivered with a newer timestamp but a stale body that says past_due.
  await subEvent('evt_TEST_u9', 'customer.subscription.updated', T0 + 20 * DAY, 'sub_TESTa', { status: 'past_due' })
  assert.equal(row().status, 'active')
})

test('a late payment-failed event after recovery does not downgrade access', async () => {
  stripeSub('sub_TESTa'); await checkout('evt_TEST_c1', T0, 'sub_TESTa')
  setStatus('sub_TESTa', 'active') // the retry succeeded before the failure event arrived
  await deliver('evt_TEST_f1', 'invoice.payment_failed', T0 + 31 * DAY, invoice('sub_TESTa'))
  assert.equal(row().status, 'active')
})

test('a late checkout for a subscription that is no longer live cannot displace the current owner', async () => {
  await pastDueMemberWhoBoughtAgain()
  setStatus('sub_TESTold', 'canceled')
  await checkout('evt_TEST_c9', T0 + 45 * DAY, 'sub_TESTold') // newer timestamp, dead subscription
  assert.deepEqual([row().status, row().stripe_subscription_id], ['active', 'sub_TESTnew'])
})

test('concurrent events for two subscriptions converge on the owner, in either order', async () => {
  for (const order of [0, 1]) {
    db.reset(); stripeSubs.clear()
    await pastDueMemberWhoBoughtAgain()
    setStatus('sub_TESTold', 'canceled')
    setStatus('sub_TESTnew', 'active', { current_period_end: T0 + 92 * DAY })
    const a = () => subEvent(`evt_TEST_d${order}`, 'customer.subscription.deleted', T0 + 50 * DAY, 'sub_TESTold')
    const b = () => subEvent(`evt_TEST_u${order}`, 'customer.subscription.updated', T0 + 50 * DAY, 'sub_TESTnew')
    await Promise.all(order ? [b(), a()] : [a(), b()])
    assert.deepEqual([row().status, row().stripe_subscription_id], ['active', 'sub_TESTnew'])
  }
})

test('the same event processed twice concurrently applies once', async () => {
  stripeSub('sub_TESTa'); await checkout('evt_TEST_c1', T0, 'sub_TESTa')
  setStatus('sub_TESTa', 'canceled')
  const before = db.writes(SUBS).length
  await Promise.all([1, 2].map(() => subEvent('evt_TEST_d1', 'customer.subscription.deleted', T0 + DAY, 'sub_TESTa')))
  assert.equal(db.writes(SUBS).length - before, 1)
})

// ---- 6. genuine lifecycle for the owning subscription still works -----------------
test('genuine cancellation of the owning subscription cancels access and churns its referral', async () => {
  db.put('ghost-igl-referrals', { referrer_email: 'referrer-b@example.com', referred_email: EMAIL, stripe_subscription_id: 'sub_TESTa', status: 'active' })
  stripeSub('sub_TESTa'); await checkout('evt_TEST_c1', T0, 'sub_TESTa')
  setStatus('sub_TESTa', 'canceled')
  await subEvent('evt_TEST_d1', 'customer.subscription.deleted', T0 + 9 * DAY, 'sub_TESTa')
  assert.equal(row().status, 'canceled')
  assert.equal(db.all('ghost-igl-referrals')[0].status, 'churned')
})

for (const shape of ['legacy', 'basil']) {
  test(`genuine payment failure marks the owning subscription past due (${shape} invoice)`, async () => {
    stripeSub('sub_TESTa'); await checkout('evt_TEST_c1', T0, 'sub_TESTa')
    setStatus('sub_TESTa', 'past_due')
    await deliver('evt_TEST_f1', 'invoice.payment_failed', T0 + 30 * DAY, invoice('sub_TESTa', { shape }))
    assert.equal(row().status, 'past_due')
  })

  test(`genuine renewal moves the period end forward (${shape} subscription shape)`, async () => {
    stripeSub('sub_TESTa', { shape, end: T0 + 30 * DAY }); await checkout('evt_TEST_c1', T0, 'sub_TESTa')
    assert.equal(row().current_period_end, new Date((T0 + 30 * DAY) * 1000).toISOString())
    stripeSub('sub_TESTa', { shape, end: T0 + 60 * DAY })
    await deliver('evt_TEST_p1', 'invoice.paid', T0 + 30 * DAY, invoice('sub_TESTa', { shape }))
    assert.equal(row().current_period_end, new Date((T0 + 60 * DAY) * 1000).toISOString())
    await subEvent('evt_TEST_u1', 'customer.subscription.updated', T0 + 30 * DAY + 5, 'sub_TESTa')
    assert.equal(row().status, 'active')
  })
}

test('genuine recovery (past_due → active) restores access', async () => {
  stripeSub('sub_TESTa'); await checkout('evt_TEST_c1', T0, 'sub_TESTa')
  setStatus('sub_TESTa', 'past_due')
  await deliver('evt_TEST_f1', 'invoice.payment_failed', T0 + 30 * DAY, invoice('sub_TESTa'))
  setStatus('sub_TESTa', 'active', { current_period_end: T0 + 61 * DAY })
  await subEvent('evt_TEST_u1', 'customer.subscription.updated', T0 + 32 * DAY, 'sub_TESTa')
  assert.equal(row().status, 'active')
})

test('after a genuine cancellation, a new live subscription takes the row over', async () => {
  stripeSub('sub_TESTa'); await checkout('evt_TEST_c1', T0, 'sub_TESTa')
  setStatus('sub_TESTa', 'canceled')
  await subEvent('evt_TEST_d1', 'customer.subscription.deleted', T0 + 40 * DAY, 'sub_TESTa')
  stripeSub('sub_TESTb', { price: ELITE })
  await subEvent('evt_TEST_s1', 'customer.subscription.created', T0 + 50 * DAY, 'sub_TESTb')
  assert.deepEqual([row().status, row().plan, row().stripe_subscription_id], ['active', 'elite', 'sub_TESTb'])
})

test('a legacy row without stripe_subscription_id still accepts its cancellation', async () => {
  db.put(SUBS, { stripe_customer_id: CUS, email: EMAIL, plan: 'pro', status: 'active' })
  stripeSub('sub_TESTlegacy', { status: 'canceled' })
  await subEvent('evt_TEST_d1', 'customer.subscription.deleted', T0, 'sub_TESTlegacy')
  assert.equal(row().status, 'canceled')
})

// ---- signature verification is unchanged -----------------------------------------
test('an event with a bad signature is rejected before any write', async () => {
  const payload = JSON.stringify({ id: 'evt_TEST_x', type: 'customer.subscription.deleted', created: T0, data: { object: { id: 'sub_TESTa', customer: CUS } } })
  const res = await handler({ headers: { 'stripe-signature': 't=1,v1=deadbeef' }, body: payload, isBase64Encoded: false })
  assert.equal(res.statusCode, 400)
  assert.equal(db.log.length, 0)
})

// ---- invoice → subscription resolution across payload versions --------------------
test('invoiceSubscriptionId resolves every payload shape', () => {
  assert.equal(invoiceSubscriptionId({ subscription: 'sub_TEST1' }), 'sub_TEST1')
  assert.equal(invoiceSubscriptionId({ subscription: { id: 'sub_TEST2' } }), 'sub_TEST2')
  assert.equal(invoiceSubscriptionId({ parent: { subscription_details: { subscription: 'sub_TEST3' } } }), 'sub_TEST3')
  assert.equal(invoiceSubscriptionId({ lines: { data: [{ parent: { subscription_item_details: { subscription: 'sub_TEST4' } } }] } }), 'sub_TEST4')
  assert.equal(invoiceSubscriptionId({ lines: { data: [{ subscription: 'sub_TEST5' }] } }), 'sub_TEST5')
  assert.equal(invoiceSubscriptionId({ lines: { data: [{ price: { id: 'x' } }] } }), null)
})

// ---- 7. same-second events: order comes from Stripe's current state, never from event ids ----
// Stripe doesn't guarantee delivery order, and event.created has one-second
// resolution. Distinct events in the same second must not be ordered by their
// alphabetical ids (review finding on c7baa12).
const SAME = T0 + 30 * DAY
for (const [failId, recId] of [['evt_TEST_z_fail', 'evt_TEST_a_recover'], ['evt_TEST_a_fail', 'evt_TEST_z_recover']]) {
  test(`same-second failure then recovery restores access (${failId} / ${recId})`, async () => {
    stripeSub('sub_TESTa'); await checkout('evt_TEST_c1', T0, 'sub_TESTa')
    setStatus('sub_TESTa', 'past_due')
    await deliver(failId, 'invoice.payment_failed', SAME, invoice('sub_TESTa'))
    assert.equal(row().status, 'past_due')
    setStatus('sub_TESTa', 'active', { current_period_end: T0 + 61 * DAY })
    await subEvent(recId, 'customer.subscription.updated', SAME, 'sub_TESTa')
    assert.equal(row().status, 'active')
  })
  test(`same-second recovery delivered BEFORE the failure keeps access (${failId} / ${recId})`, async () => {
    stripeSub('sub_TESTa'); await checkout('evt_TEST_c1', T0, 'sub_TESTa')
    setStatus('sub_TESTa', 'active', { current_period_end: T0 + 61 * DAY }) // the retry already succeeded
    await subEvent(recId, 'customer.subscription.updated', SAME, 'sub_TESTa')
    await deliver(failId, 'invoice.payment_failed', SAME, invoice('sub_TESTa'))
    assert.equal(row().status, 'active')
  })
}

for (const [updId, delId] of [['evt_TEST_z_upd', 'evt_TEST_a_del'], ['evt_TEST_a_upd', 'evt_TEST_z_del']]) {
  for (const order of ['update-first', 'delete-first']) {
    test(`same-second cancellation ends access whatever the ids and delivery order (${updId}/${delId}, ${order})`, async () => {
      stripeSub('sub_TESTa'); await checkout('evt_TEST_c1', T0, 'sub_TESTa')
      const upd = () => subEvent(updId, 'customer.subscription.updated', SAME, 'sub_TESTa')
      const del = () => subEvent(delId, 'customer.subscription.deleted', SAME, 'sub_TESTa')
      if (order === 'update-first') {
        setStatus('sub_TESTa', 'active', { cancel_at_period_end: true }) // Stripe when the update is processed
        await upd()
        assert.equal(row().status, 'active')
        setStatus('sub_TESTa', 'canceled') // then the period ends, in the same second
        await del()
      } else {
        setStatus('sub_TESTa', 'canceled')
        await del(); await upd()
      }
      assert.equal(row().status, 'canceled')
    })
  }
}

for (const [slowId, fastId] of [['evt_TEST_z_slow', 'evt_TEST_a_fast'], ['evt_TEST_a_slow', 'evt_TEST_z_fast']]) {
  test(`a slow handler holding an older Stripe snapshot cannot overwrite a newer write (${slowId} / ${fastId})`, async () => {
    stripeSub('sub_TESTa'); await checkout('evt_TEST_c1', T0, 'sub_TESTa')
    setStatus('sub_TESTa', 'past_due')
    const hold = holdNextRetrieve('sub_TESTa')
    const slowFailure = deliver(slowId, 'invoice.payment_failed', SAME, invoice('sub_TESTa')) // reads past_due, then stalls
    await hold.reached
    setStatus('sub_TESTa', 'active', { current_period_end: T0 + 61 * DAY })
    await subEvent(fastId, 'customer.subscription.updated', SAME, 'sub_TESTa') // reads active, writes first
    assert.equal(row().status, 'active')
    hold.release()
    await slowFailure
    assert.equal(row().status, 'active', 'the stale past_due snapshot must not land after the newer active one')
  })
}

test('an older duplicate of an already-applied event is still ignored after later events', async () => {
  stripeSub('sub_TESTa'); await checkout('evt_TEST_c1', T0, 'sub_TESTa')
  setStatus('sub_TESTa', 'canceled')
  await subEvent('evt_TEST_d1', 'customer.subscription.deleted', T0 + 9 * DAY, 'sub_TESTa')
  const writes = db.writes(SUBS).length
  const churns = db.writes('ghost-igl-referrals').length
  await checkout('evt_TEST_c1', T0, 'sub_TESTa') // redelivery of the original checkout, days later
  assert.equal(db.writes(SUBS).length, writes, 'no second write for a processed event')
  assert.equal(db.writes('ghost-igl-referrals').length, churns)
  assert.equal(row().status, 'canceled')
})
