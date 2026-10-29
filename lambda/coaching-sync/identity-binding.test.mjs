// Entirely local: ephemeral signing keys, cached synthetic JWKS and in-memory
// Dynamo boundary. The real JWT verifier and production handlers execute.
import '../../scripts/test-netguard.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { generateKeyPairSync, sign } from 'node:crypto'
import vm from 'node:vm'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { aggregateProgressEvidence, sanitizeProgressEvidence } from './progress-evidence.mjs'

const source = readFileSync(process.env.RECON_SYNC_BASELINE_SOURCE || new URL('./index.mjs', import.meta.url), 'utf8')
assert.match(source, /tokenUse:\s*'id'/)
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'local-fixture', use: 'sig', alg: 'RS256' }
const issuer = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_synthetic'
const baseClaims = () => ({ iss: issuer, aud: 'synthetic', token_use: 'id', sub: 'subject-a', email: 'member@example.test', email_verified: true, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 })
function token(overrides = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: jwk.kid })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ ...baseClaims(), ...overrides })).toString('base64url')
  const signed = header + '.' + payload
  return signed + '.' + sign('RSA-SHA256', Buffer.from(signed), privateKey).toString('base64url')
}
function fixture() {
  const verifier = CognitoJwtVerifier.create({ userPoolId: 'us-east-1_synthetic', clientId: 'synthetic', tokenUse: 'id' })
  verifier.cacheJwks({ keys: [jwk] })
  const current = new Map([['customer-a', { stripe_customer_id: 'customer-a', cognito_sub: 'subject-a', email: 'member@example.test', plan: 'pro', status: 'active', current_period_end: '2099-01-01T00:00:00Z' }]])
  const state = { candidates: [structuredClone(current.get('customer-a'))], failLookup: false, calls: [], events: new Map() }
  class QueryCommand { constructor(input) { this.input = input } }
  class GetCommand { constructor(input) { this.input = input } }
  class UpdateCommand { constructor(input) { this.input = input } }
  class BatchWriteCommand { constructor(input) { this.input = input } }
  const context = vm.createContext({
    Buffer, verifier, QueryCommand, GetCommand, UpdateCommand, BatchWriteCommand,
    aggregateProgressEvidence, sanitizeProgressEvidence, console: { error() {} },
    SUBSCRIPTIONS_TABLE: 'subs', TABLE: 'events', MAX_BATCH_EVENTS: 100, MAX_BODY_BYTES: 262144,
    MAX_EVENT_BYTES: 8192, DAILY_EVENT_LIMIT: 5000, RETENTION_DAYS: 90,
    ddb: { send: async command => {
      state.calls.push(command)
      const input = command.input
      if (command instanceof QueryCommand && input.TableName === 'subs') return { Items: structuredClone(state.candidates) }
      if (command instanceof GetCommand) {
        assert.equal(input.TableName, 'subs')
        assert.equal(input.ConsistentRead, true)
        if (state.failLookup) throw Error('synthetic storage unavailable')
        return { Item: structuredClone(current.get(input.Key.stripe_customer_id)) }
      }
      if (command instanceof QueryCommand) return { Items: [...state.events.values()].filter(row => row.userId === input.ExpressionAttributeValues[':u']) }
      if (command instanceof UpdateCommand) { assert.equal(input.TableName, 'events'); return {} }
      assert.ok(command instanceof BatchWriteCommand)
      for (const { PutRequest: { Item } } of input.RequestItems.events) state.events.set(Item.userId + '#' + Item.sk, structuredClone(Item))
      return { UnprocessedItems: {} }
    } },
  })
  vm.runInContext(source.slice(source.indexOf('const HEADERS =')).replace('export async function handler', 'async function handler'), context)
  return {
    state, current,
    request: (jwt = token(), method = 'GET', path = '/me/coaching-history', body) => context.handler({ headers: jwt === null ? {} : { authorization: 'Bearer ' + jwt }, requestContext: { http: { method } }, rawPath: path, body: body && JSON.stringify(body) }),
    eventCalls: () => state.calls.filter(command => command.input.TableName === 'events' || command instanceof BatchWriteCommand),
  }
}
const event = { sessionId: 'local-review', ts: '2026-10-29T00:00:00Z', phase: 'review' }

test('same-owner verified ID token saves and reads only its own evidence; replay is one event', async () => {
  const app = fixture(), jwt = token()
  for (let i = 0; i < 2; i++) {
    const response = await app.request(jwt, 'POST', '/me/coaching-events', { userId: 'subject-b', events: [{ ...event, userId: 'subject-b' }] })
    assert.equal(response.statusCode, 200)
    assert.deepEqual(JSON.parse(response.body), { written: 1, received: 1 })
  }
  assert.equal(app.state.events.size, 1)
  assert.equal([...app.state.events.values()][0].userId, 'subject-a')
  const history = await app.request(jwt)
  assert.equal(JSON.parse(history.body).sessions[0].events, 1)
  assert.equal((await app.request(jwt, 'GET', '/me/coaching-profile')).statusCode, 200)
})

for (const path of ['/me/coaching-events', '/me/coaching-history', '/me/coaching-profile']) test(`verified same-email wrong subject is denied before data access: ${path}`, async () => {
  const app = fixture()
  const response = await app.request(token({ sub: 'subject-b' }), path.endsWith('events') ? 'POST' : 'GET', path, { events: [event] })
  assert.equal(response.statusCode, 403)
  assert.equal(app.eventCalls().length, 0)
})

test('account switch and old-token replay cannot use stale email-index entitlement after rebind', async () => {
  const app = fixture(), oldToken = token()
  assert.equal((await app.request(oldToken, 'POST', '/me/coaching-events', { events: [event] })).statusCode, 200)
  app.current.get('customer-a').cognito_sub = 'subject-b'
  // Intentionally retain old subject-a row in the eventually consistent index.
  assert.equal((await app.request(oldToken)).statusCode, 403)
  const switched = await app.request(token({ sub: 'subject-b' }))
  assert.equal(switched.statusCode, 200)
  assert.deepEqual(JSON.parse(switched.body).sessions, [])
})

for (const [label, change] of Object.entries({
  canceled: { status: 'canceled' }, past_due: { status: 'past_due' },
  expired: { current_period_end: '2000-01-01T00:00:00Z' }, invalid_period: { current_period_end: 'invalid' },
  free: { plan: 'recruit' }, unbound: { cognito_sub: undefined },
  different_email: { email: 'other@example.test' },
})) test(`current entitlement fails closed despite stale active index: ${label}`, async () => {
  const app = fixture()
  Object.assign(app.current.get('customer-a'), change)
  assert.equal((await app.request()).statusCode, 403)
  assert.equal(app.eventCalls().length, 0)
})

test('deleted or keyless subscription cannot grant access or bind a new identity', async () => {
  for (const missingKey of [false, true]) {
    const app = fixture()
    if (missingKey) delete app.state.candidates[0].stripe_customer_id
    else app.current.clear()
    assert.equal((await app.request()).statusCode, 403)
    assert.equal(app.eventCalls().length, 0)
  }
})

for (const [label, claims] of Object.entries({
  expired: { exp: 1 }, wrong_audience: { aud: 'another-client' },
  wrong_token_use: { token_use: 'access' }, missing_subject: { sub: undefined },
  blank_subject: { sub: ' ' }, missing_email: { email: undefined },
  unverified_email: { email_verified: false },
})) test(`actual JWT verifier/principal validation rejects ${label} before Dynamo`, async () => {
  const app = fixture()
  assert.equal((await app.request(token(claims))).statusCode, 401)
  assert.equal(app.state.calls.length, 0)
})

test('missing token and invalid signature are rejected before entitlement lookup', async () => {
  const app = fixture(), jwt = token(), split = jwt.lastIndexOf('.')
  assert.equal((await app.request(null)).statusCode, 401)
  const signature = Buffer.from(jwt.slice(split + 1), 'base64url'); signature[0] ^= 1
  assert.equal((await app.request(jwt.slice(0, split + 1) + signature.toString('base64url'))).statusCode, 401)
  assert.equal(app.state.calls.length, 0)
})

test('only an actual admins group array bypasses paid entitlement; own subject still scopes reads', async () => {
  const app = fixture(); app.current.clear(); app.state.candidates = []
  assert.equal((await app.request(token({ 'cognito:groups': 'admins' }))).statusCode, 403)
  assert.equal((await app.request(token({ 'cognito:groups': ['admins'] }))).statusCode, 200)
  assert.equal(app.eventCalls()[0].input.ExpressionAttributeValues[':u'], 'subject-a')
})

test('membership read failure returns retryable 503 with no quota reservation, evidence write or read', async () => {
  const app = fixture(); app.state.failLookup = true
  assert.equal((await app.request(token(), 'POST', '/me/coaching-events', { events: [event] })).statusCode, 503)
  assert.equal(app.eventCalls().length, 0)
})
