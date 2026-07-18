// Proves the booking Lambda's /booking/credits route for real: drives the actual
// exported handler() with a mocked Stripe subscription + mocked DynamoDB, and
// asserts it SETS (resets, not increments) the balance to 2 for an active add-on
// subscription and refuses inactive / wrong-price subscriptions.
//
// Run: node --test lambda/booking/coaching-credits.test.mjs
// (colocated so `stripe` / `@aws-sdk/*` resolve from this Lambda's node_modules)

import test, { mock } from 'node:test'
import assert from 'node:assert/strict'

process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
process.env.COACHING_ADDON_PRICE_ID = 'price_addon_test'

const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb')
const Stripe = (await import('stripe')).default

// Record every DynamoDB command; simulate reads.
let ddbCalls = []
mock.method(DynamoDBDocumentClient.prototype, 'send', async (command) => {
  const name = command.constructor.name
  ddbCalls.push({ name, input: command.input })
  if (name === 'GetCommand') return { Item: null }
  return {}
})

// Mock Stripe subscription retrieval on the shared resource prototype.
let fakeSub = null
const subsProto = Object.getPrototypeOf(new Stripe('sk_test_dummy').subscriptions)
mock.method(subsProto, 'retrieve', async () => {
  if (!fakeSub) throw new Error('no subscription configured')
  return fakeSub
})

const { handler } = await import('./index.mjs')

const creditsEvent = (subscriptionId) => ({
  requestContext: { http: { method: 'POST' } },
  rawPath: '/prod/booking/credits',
  body: JSON.stringify({ subscriptionId }),
})
const creditWrite = () => ddbCalls.find(
  (c) => c.name === 'UpdateCommand' && String(c.input.Key?.slotId || '').startsWith('credits#'),
)

test('active add-on subscription SETs the balance to 2 (reset, not increment)', async () => {
  ddbCalls = []
  fakeSub = { id: 'sub_addon', status: 'active', items: { data: [{ price: { id: 'price_addon_test' } }] }, customer_email: 'player@test.com' }
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
  fakeSub = { id: 'sub_trial', status: 'trialing', items: { data: [{ price: { id: 'price_addon_test' } }] }, customer_email: 'trial@test.com' }
  const res = await handler(creditsEvent('sub_trial'))
  assert.equal(res.statusCode, 200)
  assert.ok(creditWrite(), 'trialing should still set credits')
})

test('inactive (canceled) subscription is refused with no credit write', async () => {
  ddbCalls = []
  fakeSub = { id: 'sub_dead', status: 'canceled', items: { data: [{ price: { id: 'price_addon_test' } }] }, customer_email: 'x@test.com' }
  const res = await handler(creditsEvent('sub_dead'))
  assert.equal(res.statusCode, 402)
  assert.equal(creditWrite(), undefined)
})

test('a non-add-on price is refused (wrong product)', async () => {
  ddbCalls = []
  fakeSub = { id: 'sub_wrong', status: 'active', items: { data: [{ price: { id: 'price_champion_plan' } }] }, customer_email: 'y@test.com' }
  const res = await handler(creditsEvent('sub_wrong'))
  assert.equal(res.statusCode, 400)
  assert.equal(creditWrite(), undefined)
})
