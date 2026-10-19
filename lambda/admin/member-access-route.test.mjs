// Read-only GET /admin/users end-to-end projection. SDK and Stripe are strict
// in-memory stubs; unexpected calls (including all writes) fail the test.
import test from 'node:test'
import assert from 'node:assert/strict'

Object.assign(process.env, {
  STRIPE_SECRET_KEY: ['sk', 'test', 'fixture'].join('_'),
  COGNITO_USER_POOL_ID: 'us-east-1_FIXTURE', COGNITO_CLIENT_ID: 'fixture-client',
  AWS_ACCESS_KEY_ID: 'fixture', AWS_SECRET_ACCESS_KEY: 'fixture', AWS_REGION: 'us-east-1', AWS_ENDPOINT_URL: 'http://127.0.0.1:9',
  STRIPE_PRO_PRICE_ID: 'price_1TLEtrJNddvjgWcg9iTWJoLS',
})
delete process.env.AWS_PROFILE

const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb')
const { CognitoIdentityProviderClient } = await import('@aws-sdk/client-cognito-identity-provider')
let rows = []
let stripeUnavailable = false
const calls = []
const protoWithSend = (cls) => {
  let proto = cls.prototype
  while (proto && !Object.prototype.hasOwnProperty.call(proto, 'send')) proto = Object.getPrototypeOf(proto)
  return proto
}
const stub = async (command) => {
  const name = command.constructor.name
  const input = command.input
  calls.push(name)
  if (name === 'ListUsersCommand') return { Users: ['paid', 'trial', 'failed', 'ended', 'expired', 'comp', 'expiredcomp', 'admin', 'multiple', 'compwithdebt'].map((id) => ({ Username: id, UserStatus: 'CONFIRMED', Enabled: true, Attributes: [{ Name: 'email', Value: `${id}@example.test` }] })) }
  if (name === 'ListUsersInGroupCommand') return input.NextToken ? { Users: [{ Username: 'admin' }] } : { Users: [], NextToken: 'fixture-page-2' }
  if (name === 'ScanCommand') return { Items: input.TableName === 'ghost-igl-subscriptions' ? rows : [] }
  throw new Error(`Unexpected SDK call: ${name}`)
}
protoWithSend(DynamoDBDocumentClient).send = stub
protoWithSend(CognitoIdentityProviderClient).send = stub

globalThis.fetch = async (url, options) => {
  assert.equal(options?.method || 'GET', 'GET')
  const path = new URL(String(url)).pathname
  if (path === '/v1/subscriptions') {
    if (stripeUnavailable) throw new Error('fixture Stripe unavailable')
    return { ok: true, json: async () => ({ data: rows.filter((row) => row.stripe_subscription_id).map((row) => ({
      id: row.stripe_subscription_id,
      // Exercise both disagreements: active Stripe must not grant access to a
      // failed ledger row; failed Stripe must not hide a separate valid grant.
      status: row.email === 'failed@example.test' ? 'active' : row.email === 'multiple@example.test' ? 'past_due' : row.status,
      customer: { id: row.stripe_customer_id, email: row.email },
      items: { data: [{ current_period_end: 4070908800, price: { id: 'price_1TLEtrJNddvjgWcg9iTWJoLS', unit_amount: 1200, recurring: { interval: 'month' } } }] },
    })), has_more: false }) }
  }
  if (['/v1/charges', '/v1/refunds', '/v1/payouts'].includes(path)) return { ok: true, json: async () => ({ data: [], has_more: false }) }
  if (path === '/v1/balance') return { ok: true, json: async () => ({ available: [], pending: [] }) }
  throw new Error(`Unexpected Stripe path: ${path}`)
}

const { getUsers } = await import('./index.mjs')
const seed = () => {
  calls.length = 0
  rows = [
    ['paid', 'active'], ['trial', 'trialing'], ['failed', 'past_due'], ['ended', 'canceled'], ['expired', 'active'], ['comp', 'active'], ['expiredcomp', 'active'], ['multiple', 'past_due'], ['orphan', 'past_due'], ['compwithdebt', 'past_due'],
  ].map(([id, status]) => ({
    email: `${id}@example.test`, stripe_customer_id: `cus_${id}`, stripe_subscription_id: `sub_${id}`, plan: 'pro', status,
    current_period_end: id.startsWith('expired') ? '2000-01-01T00:00:00Z' : '2098-01-01T00:00:00Z',
    ...(['comp', 'expiredcomp'].includes(id) ? { comp: true, stripe_subscription_id: null } : {}),
  }))
  rows.push({ email: 'multiple@example.test', stripe_customer_id: 'cus_valid', stripe_subscription_id: 'sub_valid', plan: 'champion', status: 'active', current_period_end: '2098-01-01T00:00:00Z' })
  rows.push({ email: 'compwithdebt@example.test', stripe_customer_id: 'cus_comp', comp: true, plan: 'elite', status: 'active', current_period_end: '2098-01-01T00:00:00Z' })
}

test('live Stripe enrichment preserves effective ledger access, expiry and admin exemption', async () => {
  seed(); stripeUnavailable = false
  const result = JSON.parse((await getUsers({})).body)
  const member = (id) => result.users.find((user) => user.email === `${id}@example.test`)
  for (const [id, plan] of Object.entries({ paid: 'pro', trial: 'pro', failed: 'free', ended: 'free', expired: 'free', comp: 'pro', expiredcomp: 'free', admin: 'champion', multiple: 'champion', orphan: 'free', compwithdebt: 'elite' })) {
    assert.equal(member(id).access_plan, plan, id)
  }
  assert.equal(member('failed').plan, 'pro', 'historical Stripe product remains visible')
  assert.equal(member('failed').access_status, 'past_due', 'live Stripe cannot overwrite authorization status')
  assert.equal(member('multiple').billing_state, 'payment_issue', 'billing issue stays visible alongside valid access')
  assert.equal(member('expired').access_period_end, '2000-01-01T00:00:00Z', 'Stripe future period cannot revive expired ledger access')
  assert.equal(member('expiredcomp').access_status, 'expired')
  assert.equal(member('admin').access_source, 'admin')
  assert.equal(member('compwithdebt').billing_state, 'payment_issue', 'a separate complimentary grant must not hide unpaid billing')
  assert.equal(member('compwithdebt').access_source, 'complimentary')
  assert.equal(calls.filter((name) => name === 'ListUsersInGroupCommand').length, 2, 'admin group read is paginated')
})

test('Stripe outage retains ledger access and failed payment status without writes', async () => {
  seed(); stripeUnavailable = true
  const result = JSON.parse((await getUsers({})).body)
  const failed = result.users.find((user) => user.email === 'failed@example.test')
  assert.equal(result.billing_source, null)
  assert.equal(failed.access_plan, 'free')
  assert.equal(failed.sub_status, 'past_due')
  assert.equal(result.users.find((user) => user.is_admin).access_plan, 'champion')
})
