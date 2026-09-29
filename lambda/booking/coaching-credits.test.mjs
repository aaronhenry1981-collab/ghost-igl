// Proves the booking Lambda's /booking/credits route for real: drives the actual
// exported handler() with a mocked Stripe subscription + mocked DynamoDB, and
// asserts it SETS (resets, not increments) the balance to 2 for an active add-on
// subscription and refuses inactive / wrong-price subscriptions.
//
// Run: node --test lambda/booking/coaching-credits.test.mjs
// (colocated so `stripe` / `@aws-sdk/*` resolve from this Lambda's node_modules)

import test, { mock } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'

process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
process.env.COACHING_ADDON_PRICE_ID = 'price_addon_test'
process.env.STRIPE_CHAMPION_MEMBERSHIP_PRICE_ID = 'price_champion_membership_test'

const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb')
const { SESv2Client } = await import('@aws-sdk/client-sesv2')
const { CognitoJwtVerifier } = await import('aws-jwt-verify')
const Stripe = (await import('stripe')).default

// Record every DynamoDB command; simulate reads.
let ddbCalls = []
let ddbResponder = null
mock.method(DynamoDBDocumentClient.prototype, 'send', async (command) => {
  const name = command.constructor.name
  ddbCalls.push({ name, input: command.input })
  if (ddbResponder) return ddbResponder(name, command.input)
  if (name === 'GetCommand') return { Item: null }
  return {}
})
mock.method(SESv2Client.prototype, 'send', async () => ({}))
const verifierProto = Object.getPrototypeOf(CognitoJwtVerifier.create({
  userPoolId: 'us-east-1_test', tokenUse: 'id', clientId: 'test-client',
}))
mock.method(verifierProto, 'verify', async () => ({
  sub: 'user-1', email: 'player@example.test', email_verified: true,
}))

// Mock Stripe subscription retrieval on the shared resource prototype.
let fakeSub = null
let fakeCheckoutSession = null
const subsProto = Object.getPrototypeOf(new Stripe('sk_test_dummy').subscriptions)
mock.method(subsProto, 'retrieve', async () => {
  if (!fakeSub) throw new Error('no subscription configured')
  return fakeSub
})

const { handler, buildCheckinMessage } = await import('./index.mjs')

const creditsEvent = (subscriptionId, sourceEventId = 'evt_test') => ({
  requestContext: { http: { method: 'POST' } },
  rawPath: '/prod/booking/credits',
  headers: {
    'x-recon6-internal-signature': crypto
      .createHmac('sha256', process.env.STRIPE_SECRET_KEY)
      .update(`booking-credits:${subscriptionId}:${sourceEventId}`)
      .digest('base64url'),
  },
  body: JSON.stringify({ subscriptionId, sourceEventId }),
})
const creditWrite = () => ddbCalls.find(
  (c) => c.name === 'UpdateCommand' && String(c.input.Key?.slotId || '').startsWith('credits#'),
)

test('customer check-in copy includes the customer and local appointment time', () => {
  const message = buildCheckinMessage({
    slotId: '2026-08-19T22:30:00.000Z',
    customer: { name: 'Alex Player' },
  }, 'America/New_York')
  assert.equal(message.subject, 'Are you joining your RECON6 coaching session?')
  assert.match(message.body, /Hi Alex,/)
  assert.match(message.body, /Wednesday, August 19/)
  assert.match(message.body, /6:30 PM EDT/)
  assert.match(message.body, /I’m online and ready/)
})

test('active add-on subscription SETs the balance to 2 (reset, not increment)', async () => {
  ddbCalls = []
  fakeSub = { id: 'sub_addon', status: 'active', items: { data: [{ price: { id: 'price_addon_test' }, current_period_end: 4102444800 }] }, customer_email: 'player@test.com' }
  const res = await handler(creditsEvent('sub_addon'))
  assert.equal(res.statusCode, 200)
  assert.equal(JSON.parse(res.body).credits, 2)
  const upd = creditWrite()
  assert.ok(upd, 'must write the credits#<email> row')
  // SET credits = :n  → a reset. A rollover bug would look like `credits + :n`.
  assert.match(upd.input.UpdateExpression, /SET\s+credits\s*=\s*:n/)
  assert.doesNotMatch(upd.input.UpdateExpression, /credits\s*\+/)
  assert.equal(upd.input.ExpressionAttributeValues[':n'], 2)
  assert.equal(upd.input.Key.slotId, 'credits#player@test.com')
})

test('trialing add-on subscription also grants (Stripe trials count)', async () => {
  ddbCalls = []
  fakeSub = { id: 'sub_trial', status: 'trialing', items: { data: [{ price: { id: 'price_addon_test' }, current_period_end: 4102444800 }] }, customer_email: 'trial@test.com' }
  const res = await handler(creditsEvent('sub_trial'))
  assert.equal(res.statusCode, 200)
  assert.ok(creditWrite(), 'trialing should still set credits')
})
const sessionsProto = Object.getPrototypeOf(new Stripe('sk_test_dummy').checkout.sessions)
mock.method(sessionsProto, 'create', async () => ({ id: 'cs_test', url: 'https://checkout.test/session' }))
mock.method(sessionsProto, 'retrieve', async () => {
  if (!fakeCheckoutSession) throw new Error('no checkout session configured')
  return fakeCheckoutSession
})

test('active Champion membership grants the same two non-rollover credits', async () => {
  ddbCalls = []
  fakeSub = { id: 'sub_champion', status: 'active', items: { data: [{ price: { id: 'price_champion_membership_test' }, current_period_end: 4102444800 }] }, customer_email: 'champion@test.com' }
  const res = await handler(creditsEvent('sub_champion'))
  assert.equal(res.statusCode, 200)
  const upd = creditWrite()
  assert.ok(upd, 'Champion membership should set coaching credits')
  assert.equal(upd.input.ExpressionAttributeValues[':n'], 2)
  assert.doesNotMatch(upd.input.UpdateExpression, /credits\s*\+/)
})

test('inactive (canceled) subscription revokes any remaining credits', async () => {
  ddbCalls = []
  fakeSub = { id: 'sub_dead', status: 'canceled', items: { data: [{ price: { id: 'price_addon_test' } }] }, customer_email: 'x@test.com' }
  const res = await handler(creditsEvent('sub_dead'))
  assert.equal(res.statusCode, 200)
  assert.equal(JSON.parse(res.body).credits, 0)
  assert.equal(creditWrite().input.ExpressionAttributeValues[':n'], 0)
})

test('an unrelated price is refused (wrong product)', async () => {
  ddbCalls = []
  fakeSub = { id: 'sub_wrong', status: 'active', items: { data: [{ price: { id: 'price_unrelated_plan' } }] }, customer_email: 'y@test.com' }
  const res = await handler(creditsEvent('sub_wrong'))
  assert.equal(res.statusCode, 400)
  assert.equal(creditWrite(), undefined)
})

test('obsolete public confirm route cannot turn a hold into a free booking', async () => {
  ddbCalls = []
  ddbResponder = null
  const res = await handler({
    requestContext: { http: { method: 'POST' } },
    rawPath: '/prod/booking/confirm',
    body: JSON.stringify({
      slotId: '2026-08-20T18:00:00.000Z', holdToken: 'public-hold-token',
      name: 'Attacker', email: 'attacker@example.test', sessionType: 'Single Session',
    }),
  })
  assert.equal(res.statusCode, 410)
  assert.equal(ddbCalls.length, 0, 'retired route must not read or mutate booking state')
})

test('credit booking atomically consumes one credit and binds confirmation to the same hold', async () => {
  ddbCalls = []
  fakeSub = null
  const slotId = '2026-08-20T18:00:00.000Z'
  let creditBalance = 1
  ddbResponder = async (name, input) => {
    if (name === 'GetCommand' && String(input.Key?.slotId || '').startsWith('credits#')) {
      return { Item: { credits: creditBalance } }
    }
    if (name === 'GetCommand' && input.Key?.slotId === slotId) {
      return { Item: {
        slotId, status: 'held', holdToken: 'hold-1',
        customer: { name: 'Player', email: 'player@example.test' },
        sessionType: 'Single Session',
      } }
    }
    if (name === 'TransactWriteCommand') {
      creditBalance = 0
      return {}
    }
    if (name === 'GetCommand') return { Item: null }
    return {}
  }
  const res = await handler({
    requestContext: { http: { method: 'POST' } },
    rawPath: '/prod/booking/checkout',
    headers: { authorization: 'Bearer valid-test-token' },
    body: JSON.stringify({
      slotId, holdToken: 'hold-1', name: 'Player', email: 'player@example.test', type: 'single',
    }),
  })
  assert.equal(res.statusCode, 200)
  assert.equal(JSON.parse(res.body).creditsLeft, 0)

  const transaction = ddbCalls.find((call) => call.name === 'TransactWriteCommand')
  assert.ok(transaction, 'credit consumption and booking confirmation must share one transaction')
  assert.equal(transaction.input.TransactItems.length, 2)
  const creditMutation = transaction.input.TransactItems[0].Update
  assert.match(creditMutation.ConditionExpression, /credits\s*>=\s*:one/)
  assert.match(creditMutation.UpdateExpression, /credits\s*-\s*:one/)

  const confirmation = transaction.input.TransactItems[1].Update
  assert.match(confirmation.UpdateExpression, /confirmed/)
  assert.match(confirmation.ConditionExpression, /holdToken\s*=\s*:hold/)
  assert.equal(confirmation.ExpressionAttributeValues[':hold'], 'hold-1')
  const attach = ddbCalls.find((call) =>
    call.name === 'UpdateCommand' && call.input.Key?.slotId === slotId && /customer/.test(String(call.input.UpdateExpression)))
  assert.match(attach.input.ConditionExpression, /heldUntil\s*>=\s*:now/)
  ddbResponder = null
})

test('paid finalization is bound to the hold token embedded by checkout', async () => {
  ddbCalls = []
  const slotId = '2026-08-21T18:00:00.000Z'
  fakeCheckoutSession = {
    id: 'cs_paid', payment_status: 'paid', amount_total: 4000, payment_intent: 'pi_paid',
    metadata: { slotId, holdToken: 'hold-paid', email: 'paid@example.test', type: 'single' },
  }
  ddbResponder = async (name, input) => {
    if (name === 'GetCommand' && input.Key?.slotId === slotId) return { Item: {
      slotId, status: 'held', holdToken: 'hold-paid', customer: { email: 'paid@example.test' },
      sessionType: 'Single Session',
    } }
    if (name === 'GetCommand') return { Item: null }
    return {}
  }
  const res = await handler({
    requestContext: { http: { method: 'POST' } }, rawPath: '/prod/booking/finalize',
    body: JSON.stringify({ sessionId: 'cs_paid' }),
  })
  assert.equal(res.statusCode, 200)
  const confirmation = ddbCalls.find((call) =>
    call.name === 'UpdateCommand' && call.input.Key?.slotId === slotId && /confirmed/.test(String(call.input.UpdateExpression)))
  assert.ok(confirmation)
  assert.match(confirmation.input.ConditionExpression, /holdToken\s*=\s*:hold/)
  assert.equal(confirmation.input.ExpressionAttributeValues[':hold'], 'hold-paid')
  ddbResponder = null
  fakeCheckoutSession = null
})

test('legacy paid session without hold proof cannot finalize a slot', async () => {
  ddbCalls = []
  fakeCheckoutSession = {
    id: 'cs_legacy', payment_status: 'paid', amount_total: 4000, payment_intent: 'pi_legacy',
    metadata: { slotId: '2026-08-22T18:00:00.000Z', email: 'legacy@example.test', type: 'single' },
  }
  ddbResponder = null
  const res = await handler({
    requestContext: { http: { method: 'POST' } }, rawPath: '/prod/booking/finalize',
    body: JSON.stringify({ sessionId: 'cs_legacy' }),
  })
  assert.equal(res.statusCode, 404)
  assert.equal(ddbCalls.length, 0, 'missing hold proof must fail before booking state is read or mutated')
  fakeCheckoutSession = null
})

// ---------- included sessions: self-service redemption, duplicates, cancellation ----------

const CYCLE = '2099-01-31T00:00:00.000Z'
const FUTURE_SLOT = '2099-01-10T18:00:00.000Z'
const PAST_SLOT = '2020-01-10T18:00:00.000Z'
const checkoutCalls = () => sessionsProto.create.mock.calls.length
const manageTokenFor = (slotId) => {
  const payload = Buffer.from(JSON.stringify({ slotId, nonce: 'n'.repeat(32) })).toString('base64url')
  return `${payload}.${crypto.createHmac('sha256', process.env.STRIPE_SECRET_KEY).update(payload).digest('base64url')}`
}
const checkoutEvent = (fields, token = 'valid-test-token') => ({
  requestContext: { http: { method: 'POST' } }, rawPath: '/prod/booking/checkout',
  headers: token ? { authorization: `Bearer ${token}` } : {},
  body: JSON.stringify({ slotId: FUTURE_SLOT, holdToken: 'hold-inc', name: 'Player', email: 'player@example.test', type: 'included', ...fields }),
})
const cancelled = () => { const e = new Error('cancelled'); e.name = 'TransactionCanceledException'; return e }
// A held slot plus a membership credit row with `credits` left in cycle CYCLE.
function heldWorld(credits) {
  const state = { credits, slot: { slotId: FUTURE_SLOT, status: 'held', holdToken: 'hold-inc', heldUntil: '2099-01-01T00:00:00.000Z' } }
  ddbResponder = async (name, input) => {
    if (name === 'GetCommand' && String(input.Key?.slotId || '').startsWith('credits#')) {
      return { Item: state.credits == null ? null : { credits: state.credits, creditType: 'membership', validUntil: CYCLE } }
    }
    if (name === 'GetCommand' && input.Key?.slotId === FUTURE_SLOT) return { Item: { ...state.slot } }
    if (name === 'UpdateCommand' && input.Key?.slotId === FUTURE_SLOT && /customer/.test(input.UpdateExpression)) {
      if (state.slot.status !== 'held') { const e = new Error('conditional'); e.name = 'ConditionalCheckFailedException'; throw e }
      state.slot.customer = input.ExpressionAttributeValues[':cust']
      return {}
    }
    if (name === 'TransactWriteCommand') {
      const debit = input.TransactItems[0].Update
      if (state.credits < 1 || debit.ExpressionAttributeValues[':cycle'] !== CYCLE) throw cancelled()
      state.credits -= 1
      state.slot = { ...state.slot, status: 'confirmed', payment: input.TransactItems[1].Update.ExpressionAttributeValues[':payment'] }
      return {}
    }
    if (name === 'GetCommand') return { Item: null }
    return {}
  }
  return state
}

test('included session: signed-in member books with a credit, never card checkout, and the cycle is recorded', async () => {
  ddbCalls = []
  const before = checkoutCalls()
  const state = heldWorld(2)
  const res = await handler(checkoutEvent({}))
  assert.equal(res.statusCode, 200)
  const body = JSON.parse(res.body)
  assert.equal(body.viaCredit, true)
  assert.equal(body.creditsLeft, 1)
  assert.equal(checkoutCalls(), before, 'no Stripe checkout for an included session')
  const debit = ddbCalls.find((c) => c.name === 'TransactWriteCommand').input.TransactItems[0].Update
  assert.match(debit.ConditionExpression, /validUntil = :cycle/)
  assert.equal(state.slot.payment.creditValidUntil, CYCLE)
  ddbResponder = null
})

test('included session without a credit (or signed out, or another email) is refused, never charged', async () => {
  const cases = [['no credit', 'valid-test-token', 'player@example.test', 0], ['signed out', null, 'player@example.test', 2], ['other email', 'valid-test-token', 'someone.else@example.test', 2]]
  for (const [label, token, email, credits] of cases) {
    ddbCalls = []
    const before = checkoutCalls()
    heldWorld(credits)
    const res = await handler(checkoutEvent({ email }, token))
    assert.equal(res.statusCode, 409, label)
    assert.equal(JSON.parse(res.body).code, 'no_included_credit', label)
    assert.equal(checkoutCalls(), before, `${label}: no checkout`)
    assert.ok(!ddbCalls.some((c) => c.name === 'TransactWriteCommand'), `${label}: no credit movement`)
  }
  ddbResponder = null
})

test('a duplicate submission for the same hold books once and takes one credit', async () => {
  ddbCalls = []
  const state = heldWorld(2)
  const first = await handler(checkoutEvent({}))
  const second = await handler(checkoutEvent({}))
  assert.equal(first.statusCode, 200)
  assert.equal(second.statusCode, 409)
  assert.equal(state.credits, 1)
  assert.equal(ddbCalls.filter((c) => c.name === 'TransactWriteCommand').length, 1)
  ddbResponder = null
})

function bookedWorld(slotId, { payment = { status: 'credit', amount: 0, creditValidUntil: CYCLE }, reasons = null, gone = false } = {}) {
  const token = manageTokenFor(slotId)
  const state = { txns: [] }
  ddbResponder = async (name, input) => {
    if (name === 'GetCommand' && input.Key?.slotId === slotId) {
      return { Item: gone ? null : { slotId, status: 'confirmed', manageToken: token, customer: { name: 'Player', email: 'player@example.test' }, sessionType: 'Included session (Champion)', payment } }
    }
    if (name === 'TransactWriteCommand') {
      state.txns.push(input.TransactItems)
      if (reasons && (reasons.length === input.TransactItems.length)) {
        const e = cancelled(); e.CancellationReasons = reasons.map((Code) => ({ Code })); throw e
      }
      return {}
    }
    if (name === 'GetCommand') return { Item: null }
    return {}
  }
  return { token, state }
}
const manageEvent = (token, action = 'cancel', extra = {}) => ({
  requestContext: { http: { method: 'POST' } }, rawPath: '/prod/booking/manage',
  body: JSON.stringify({ token, action, ...extra }),
})

test('cancelling an included session before it starts returns the credit to the same cycle, atomically', async () => {
  ddbCalls = []
  const { token, state } = bookedWorld(FUTURE_SLOT)
  const res = await handler(manageEvent(token))
  assert.equal(res.statusCode, 200)
  assert.equal(JSON.parse(res.body).creditReturned, true)
  assert.equal(state.txns.length, 1)
  const [put, del, credit] = state.txns[0]
  assert.match(put.Put.ConditionExpression, /attribute_not_exists\(slotId\)/)
  assert.match(del.Delete.ConditionExpression, /#s = :st AND manageToken = :m/)
  assert.match(credit.Update.UpdateExpression, /credits \+ :one/)
  assert.equal(credit.Update.ExpressionAttributeValues[':cycle'], CYCLE)
  ddbResponder = null
})

test('cancelling after the start time, or a paid session, returns no credit', async () => {
  const cases = [['after start', PAST_SLOT, undefined], ['paid session', FUTURE_SLOT, { status: 'paid', amount: 4000 }]]
  for (const [label, slot, payment] of cases) {
    ddbCalls = []
    const { token, state } = bookedWorld(slot, payment ? { payment } : {})
    const res = await handler(manageEvent(token))
    assert.equal(res.statusCode, 200, label)
    assert.equal(JSON.parse(res.body).creditReturned, false, label)
    assert.equal(state.txns[0].length, 2, `${label}: tombstone + delete only`)
  }
  ddbResponder = null
})

test('after the monthly reset the credit has lapsed: the cancel goes through without it', async () => {
  ddbCalls = []
  const { token, state } = bookedWorld(FUTURE_SLOT, { reasons: ['None', 'None', 'ConditionalCheckFailed'] })
  const res = await handler(manageEvent(token))
  assert.equal(res.statusCode, 200)
  assert.equal(JSON.parse(res.body).creditReturned, false)
  assert.deepEqual(state.txns.map((t) => t.length), [3, 2])
  ddbResponder = null
})

test('a cancel of an already-cancelled booking is refused and returns nothing', async () => {
  ddbCalls = []
  const { token } = bookedWorld(FUTURE_SLOT, { gone: true })
  const res = await handler(manageEvent(token))
  assert.equal(res.statusCode, 404)
  assert.ok(!ddbCalls.some((c) => c.name === 'TransactWriteCommand'))
  ddbResponder = null
})

test('a concurrent cancel that loses the race returns no credit and does not retry', async () => {
  ddbCalls = []
  const { token, state } = bookedWorld(FUTURE_SLOT, { reasons: ['None', 'ConditionalCheckFailed', 'None'] })
  const res = await handler(manageEvent(token))
  assert.equal(res.statusCode, 409)
  assert.equal(state.txns.length, 1)
  ddbResponder = null
})

test('rescheduling keeps the credit payment so a later cancel can return it', async () => {
  ddbCalls = []
  const { token } = bookedWorld(FUTURE_SLOT)
  const slots = JSON.parse((await handler({ requestContext: { http: { method: 'GET' } }, rawPath: '/prod/booking/slots' })).body).slots || []
  assert.ok(slots.length, 'the default availability config yields open slots')
  const res = await handler(manageEvent(token, 'reschedule', { newSlotId: slots[0] }))
  assert.equal(res.statusCode, 200)
  const put = ddbCalls.find((c) => c.name === 'PutCommand' && c.input.Item?.slotId === slots[0])
  assert.deepEqual(put.input.Item.payment, { status: 'credit', amount: 0, creditValidUntil: CYCLE })
  ddbResponder = null
})

test('GET /booking/my-credits needs a signed-in member', async () => {
  heldWorld(2)
  const anon = await handler({ requestContext: { http: { method: 'GET' } }, rawPath: '/prod/booking/my-credits', headers: {} })
  assert.equal(anon.statusCode, 401)
  const me = await handler({ requestContext: { http: { method: 'GET' } }, rawPath: '/prod/booking/my-credits', headers: { authorization: 'Bearer valid-test-token' } })
  assert.equal(me.statusCode, 200)
  assert.deepEqual(JSON.parse(me.body), { email: 'player@example.test', credits: 2, validUntil: CYCLE })
  ddbResponder = null
})
