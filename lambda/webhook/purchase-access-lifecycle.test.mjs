import test, { mock } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createFakeDynamo } from './test-support/fakeDynamo.mjs'
import { hasVerifiedPaidCheckout } from '../../src/lib/entitlementRefresh.js'

// Local integration across both real exported handlers and the frontend's
// conversion gate. Stripe signatures are verified for real; provider APIs,
// Cognito claims and DynamoDB are synthetic. No account/charge is created.
Object.assign(process.env, {
  STRIPE_SECRET_KEY: 'sk_test_synthetic', STRIPE_WEBHOOK_SECRET: 'whsec_synthetic_lifecycle',
  COGNITO_USER_POOL_ID: 'us-east-1_synthetic', COGNITO_CLIENT_ID: 'synthetic-client',
  AWS_ACCESS_KEY_ID: 'synthetic', AWS_SECRET_ACCESS_KEY: 'synthetic', AWS_SESSION_TOKEN: '',
  AWS_REGION: 'us-east-1', AWS_ENDPOINT_URL: 'http://127.0.0.1:9',
})
const email = 'lifecycle@example.test', subject = 'synthetic-lifecycle-subject'
const customer = 'cus_SYNTHETICLIFECYCLE', subscription = 'sub_SYNTHETICLIFECYCLE'
const sessionId = 'cs_test_SYNTHETICLIFECYCLE'
const db = createFakeDynamo()
db.put('ghost-igl-profiles', { email, cognito_sub: subject, referral_code: 'SYNTHETIC', ai_usage_credits: 0 })

const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb')
const { CognitoIdentityProviderClient } = await import('@aws-sdk/client-cognito-identity-provider')
const subscriptionRequire = createRequire(new URL('../subscription/package.json', import.meta.url))
const subscriptionDdb = subscriptionRequire('@aws-sdk/lib-dynamodb').DynamoDBDocumentClient
for (const prototype of new Set([DynamoDBDocumentClient.prototype, subscriptionDdb.prototype])) {
  mock.method(prototype, 'send', command => db.send(command))
}
mock.method(CognitoIdentityProviderClient.prototype, 'send', async command => {
  assert.equal(command.constructor.name, 'AdminGetUserCommand', 'Cognito writes are prohibited')
  return { Username: subject, UserAttributes: [{ Name: 'sub', Value: subject }] }
})
// Use the same ESM verifier class as the production handler. The package's
// CommonJS export is a separate class, so mocking it would not isolate auth.
const { CognitoJwtVerifier } = await import(new URL('../subscription/node_modules/aws-jwt-verify/dist/esm/index.js', import.meta.url))
const verifier = CognitoJwtVerifier.create({ userPoolId: process.env.COGNITO_USER_POOL_ID, tokenUse: 'id', clientId: process.env.COGNITO_CLIENT_ID })
mock.method(Object.getPrototypeOf(verifier), 'verify', async () => ({ sub: subject, email, email_verified: true }))
mock.method(globalThis, 'fetch', async () => { throw new Error('External HTTP is prohibited in this local integration') })

const Stripe = (await import('stripe')).default
const signer = new Stripe(process.env.STRIPE_SECRET_KEY)
const created = Math.floor(Date.now() / 1000)
let paidThrough = created + 30 * 86400
let state = { id: subscription, customer, status: 'active', created, items: { data: [{ price: { id: 'price_1TLEtrJNddvjgWcg9iTWJoLS' }, current_period_end: paidThrough }] } }
mock.method(Object.getPrototypeOf(signer.subscriptions), 'retrieve', async id => {
  assert.equal(id, subscription)
  return structuredClone(state)
})
mock.method(Object.getPrototypeOf(signer.subscriptions), 'cancel', async () => { throw new Error('Stripe mutation is prohibited') })
mock.method(Object.getPrototypeOf(signer.customers), 'retrieve', async id => {
  assert.equal(id, customer)
  return { id, email }
})
const webhook = (await import('./index.mjs')).handler
const account = (await import('../subscription/index.mjs')).handler
let sequence = 0
async function deliver(type, object) {
  sequence++
  const body = JSON.stringify({ id: `evt_SYNTHETIC_${sequence}`, created: created + sequence, type, data: { object } })
  const signature = signer.webhooks.generateTestHeaderString({ payload: body, secret: process.env.STRIPE_WEBHOOK_SECRET })
  const result = await webhook({ headers: { 'stripe-signature': signature }, body })
  assert.equal(result.statusCode, 200)
}
async function membership() {
  const result = await account({
    requestContext: { http: { method: 'GET', path: '/prod/me' } },
    headers: { authorization: 'Bearer synthetic-local-identity' },
  })
  assert.equal(result.statusCode, 200)
  return JSON.parse(result.body)
}
const invoice = () => ({
  id: `in_SYNTHETIC_${sequence}`, customer,
  parent: { type: 'subscription_details', subscription_details: { subscription } },
  lines: { data: [{ pricing: { price_details: { price: 'price_1TLEtrJNddvjgWcg9iTWJoLS' } } }] },
})

test('signed purchase, renewal, payment recovery and cancellation drive actual member access', async () => {
  assert.equal((await membership()).plan, 'free')
  await deliver('checkout.session.completed', {
    id: sessionId, mode: 'subscription', customer, subscription, customer_email: email,
    payment_status: 'paid', metadata: { email, cognito_sub: subject },
  })
  let member = await membership()
  assert.equal(member.plan, 'pro')
  assert.equal(member.is_admin, false)
  assert.equal(member.comp, false)
  assert.equal(hasVerifiedPaidCheckout(member, sessionId), true)
  assert.equal(hasVerifiedPaidCheckout(member, 'cs_test_OTHER'), false)

  paidThrough += 30 * 86400
  state.items.data[0].current_period_end = paidThrough
  await deliver('invoice.paid', invoice())
  member = await membership()
  assert.equal(member.plan, 'pro')
  assert.equal(Date.parse(member.current_period_end), paidThrough * 1000)

  state.status = 'past_due'
  await deliver('invoice.payment_failed', invoice())
  member = await membership()
  assert.equal(member.plan, 'free')
  assert.equal(member.sub_status, 'past_due')
  assert.equal(hasVerifiedPaidCheckout(member, sessionId), false)

  state.status = 'active'
  await deliver('invoice.paid', invoice())
  assert.equal((await membership()).plan, 'pro')

  state.cancel_at_period_end = true
  await deliver('customer.subscription.updated', state)
  assert.equal((await membership()).plan, 'pro', 'scheduled cancellation retains paid-through access')

  state.status = 'canceled'
  await deliver('customer.subscription.deleted', state)
  member = await membership()
  assert.equal(member.plan, 'free')
  assert.equal(member.sub_status, 'canceled')
  assert.equal(hasVerifiedPaidCheckout(member, sessionId), false)
})
