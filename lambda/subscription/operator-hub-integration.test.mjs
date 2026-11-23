import test, { mock } from 'node:test'
import assert from 'node:assert/strict'
import fs, { readFileSync } from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { HUB_FIXTURE as catalog } from '../../review-tests/operator-hub-fixture.mjs'

process.env.COGNITO_USER_POOL_ID = 'us-east-1_synthetic'
process.env.COGNITO_CLIENT_ID = 'synthetic-client'
process.env.AWS_ACCESS_KEY_ID = 'synthetic'
process.env.AWS_SECRET_ACCESS_KEY = 'synthetic'
process.env.AWS_REGION = 'us-east-1'
process.env.AWS_ENDPOINT_URL = 'http://127.0.0.1:9'
const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb')
const { CognitoJwtVerifier } = await import('aws-jwt-verify')
let calls = 0
mock.method(DynamoDBDocumentClient.prototype, 'send', async () => {
  calls++
  throw new Error('Operator Hub must not access account or subscription storage')
})
const verifierProto = Object.getPrototypeOf(CognitoJwtVerifier.create({
  userPoolId: 'us-east-1_synthetic', tokenUse: 'id', clientId: 'synthetic-client',
}))
const base = { sub: 'synthetic-subject', email: 'operator@example.test', email_verified: true }
mock.method(verifierProto, 'verify', async jwt => {
  if (jwt === 'mock.free.jwt') return base
  if (jwt === 'mock.admin.jwt') return { ...base, 'cognito:groups': ['admins'] }
  if (jwt === 'mock.unverified.jwt') return { ...base, email_verified: false }
  throw new Error('Synthetic token rejected')
})
mock.method(globalThis, 'fetch', async () => { throw new Error('Network prohibited in this suite') })
let packageRead = 0
let packaged = false
const origRead = readFileSync
mock.method(fs, 'readFileSync', (path, ...args) => {
  if (String(path) === String(new URL('./operator-hub-content.json', import.meta.url))) {
    packageRead++
    if (!packaged) throw Object.assign(new Error('FIXTURE-PATH-MUST-NOT-LEAK'), {code:'ENOENT'})
    return JSON.stringify(catalog)
  }
  return origRead(path, ...args)
})
syncBuiltinESMExports()
const { handler } = await import('./index.mjs')

function hub(jwt, method = 'GET') {
  return handler({
    requestContext: { http: { method, path: '/prod/content/operator-hub' } },
    headers: { origin: 'https://r6coaching.com', ...(jwt ? { authorization: `Bearer ${jwt}` } : {}) },
  })
}

test('exported handler denies unauthorized and unverified users before returning private JSON', async () => {
  for (const [token, statusCode] of [[null, 401], ['mock.invalid.jwt', 401], ['mock.unverified.jwt', 403]]) {
    const result = await hub(token)
    assert.equal(result.statusCode, statusCode)
    assert.equal(result.headers['Cache-Control'], 'private, no-store')
    assert.ok(!result.body.includes('operators'))
  }
  const response = await hub(null, 'OPTIONS')
  assert.equal(response.statusCode, 204)
  assert.equal(response.body, '')
  assert.equal(calls, 0)
})
test('a verified account gets a generic no-store 503 when the private artifact is not packaged', async () => {
  assert.equal(packageRead, 0)
  const response = await hub('mock.free.jwt')
  assert.equal(response.statusCode, 503)
  assert.equal(response.headers['Cache-Control'], 'private, no-store')
  assert.doesNotMatch(response.body, /FIXTURE-PATH-MUST-NOT-LEAK|operators/)
  assert.equal(packageRead, 1)
})
test('verified Free and admin can retrieve the same curated payload without touching paid state', async () => {
  packaged = true
  for (const jwt of ['mock.free.jwt', 'mock.admin.jwt']) {
    const response = await hub(jwt)
    assert.equal(response.statusCode, 200)
    assert.equal(response.headers['Cache-Control'], 'private, no-store')
    assert.equal(response.headers['Access-Control-Allow-Origin'], 'https://r6coaching.com')
    assert.deepEqual(JSON.parse(response.body), catalog)
  }
  assert.equal(calls, 0)
})
