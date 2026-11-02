import test from 'node:test'
import assert from 'node:assert/strict'
import { createGatewayAuthenticator } from './gateway-auth.mjs'
const config = { apiId: 'new-squad-api', issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_fixture', audience: 'existing-client', now: () => 1000 }
const event = () => ({ requestContext: { apiId: config.apiId, authorizer: { jwt: { claims: { iss: config.issuer, aud: config.audience, sub: 'verified-subject-001', exp: 1000, token_use: 'id' } } } } })
test('gateway adapter uses only the declared authorizer subject, not a body/header identity', async () => {
  const e = event(); e.body = JSON.stringify({ subject: 'other-person' }); e.headers = { 'x-user-sub': 'other-person' }
  assert.deepEqual(await createGatewayAuthenticator(config)(e), { subject: 'verified-subject-001', tokenExpiresAt: 1000_000 })
})
test('missing authorizer, wrong gateway, issuer, client, token type and expired token fail closed', async () => {
  const auth = createGatewayAuthenticator(config)
  await assert.rejects(() => auth({ body: JSON.stringify(event()) }), { status: 401 })
  const otherApi = event(); otherApi.requestContext.apiId = 'old-paid-api'; await assert.rejects(() => auth(otherApi), { status: 401 })
  for (const values of [{ iss: 'https://attacker.invalid' }, { aud: 'other-client' }, { token_use: 'access' }, { exp: 1 }, { exp: 'invalid' }, { sub: '' }]) {
    const e = event(); Object.assign(e.requestContext.authorizer.jwt.claims, values); await assert.rejects(() => auth(e), { status: 401 })
  }
})
