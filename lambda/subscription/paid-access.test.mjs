import test, { mock } from 'node:test'
import assert from 'node:assert/strict'

// Actual exported production handler, synthetic identities/storage only.
// Never use real credentials, sessions, customers or Stripe in this suite.
process.env.COGNITO_USER_POOL_ID = 'us-east-1_synthetic'
process.env.COGNITO_CLIENT_ID = 'synthetic-client'
process.env.AWS_ACCESS_KEY_ID = 'synthetic'
process.env.AWS_SECRET_ACCESS_KEY = 'synthetic'
process.env.AWS_REGION = 'us-east-1'
process.env.AWS_ENDPOINT_URL = 'http://127.0.0.1:9'
const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb')
const { CognitoJwtVerifier } = await import('aws-jwt-verify')
let rows = [], identity = {}
mock.method(DynamoDBDocumentClient.prototype, 'send', async command => {
  const name = command.constructor.name
  if (name === 'QueryCommand') return { Items: rows }
  if (name === 'GetCommand') return { Item: { cognito_sub: 'synthetic-subject' } }
  if (name === 'UpdateCommand') return {}
  throw new Error(`Unexpected storage operation: ${name}`)
})
const proto = Object.getPrototypeOf(CognitoJwtVerifier.create({
  userPoolId: 'us-east-1_synthetic', tokenUse: 'id', clientId: 'synthetic-client',
}))
mock.method(proto, 'verify', async () => identity)
mock.method(globalThis, 'fetch', async () => { throw new Error('Network is prohibited in this synthetic suite') })
const { handler } = await import('./index.mjs')
const future = new Date(Date.now() + 86400000).toISOString()
const past = new Date(Date.now() - 86400000).toISOString()
const row = (plan, changes = {}) => ({
  plan, status: 'active', current_period_end: future, cognito_sub: 'synthetic-subject',
  stripe_customer_id: 'cus_SYNTHETIC', ...changes,
})
async function access(items, claims = {}) {
  rows = items
  identity = { sub: 'synthetic-subject', email: 'synthetic@example.test', email_verified: true, ...claims }
  const result = await handler({
    requestContext: { http: { method: 'GET', path: '/prod/subscription' } },
    headers: { authorization: 'Bearer local-fixture' },
  })
  return { status: result.statusCode, body: JSON.parse(result.body) }
}

test('actual subscription handler grants each current paid tier without admin bypass', async () => {
  for (const plan of ['pro', 'elite', 'champion']) {
    const result = await access([row(plan)])
    assert.equal(result.status, 200)
    assert.equal(result.body.plan, plan)
    assert.equal(result.body.comp, false)
  }
})

test('highest valid paid tier wins regardless of database row ordering', async () => {
  for (const items of [[row('pro'), row('champion'), row('elite')], [row('elite'), row('pro'), row('champion')]]) {
    assert.equal((await access(items)).body.plan, 'champion')
  }
})

test('expired, missing-expiry and canceled higher tiers never override current Pro', async () => {
  for (const changes of [{ current_period_end: past }, { current_period_end: null }, { current_period_end: 'invalid' }, { status: 'canceled' }, { status: 'past_due' }]) {
    const result = await access([row('champion', changes), row('pro')])
    assert.equal(result.body.plan, 'pro')
  }
})

test('expired paid and comp rows cannot grant access; current trial and comp still qualify', async () => {
  for (const changes of [{ current_period_end: past }, { comp: true, current_period_end: past }, { status: 'canceled' }]) {
    assert.equal((await access([row('champion', changes)])).body.plan, 'free')
  }
  for (const changes of [{ comp: true }, { status: 'trialing' }]) {
    assert.equal((await access([row('pro', changes)])).body.plan, 'pro')
  }
})

test('legacy Elite price remains Elite even when a historical row says Champion', async () => {
  const result = await access([row('champion', { price_id: 'price_1TPtOYJNddvjgWcgfEWjzGnp' })])
  assert.equal(result.body.plan, 'elite')
})

test('another account identity or an unverified email cannot unlock paid content', async () => {
  assert.equal((await access([row('champion', { cognito_sub: 'different-synthetic-subject' })])).status, 403)
  assert.equal((await access([row('champion')], { email_verified: false })).status, 403)
})

test('Basic remains free; administrator access is a separately identified synthetic case', async () => {
  assert.equal((await access([])).body.plan, 'free')
  const result = await access([], { 'cognito:groups': ['admins'] })
  assert.equal(result.body.plan, 'champion')
  assert.equal(result.body.comp, true)
})
