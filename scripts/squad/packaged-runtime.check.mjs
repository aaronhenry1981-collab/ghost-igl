import '../test-netguard.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const directory = process.env.SQUAD_PACKAGE_DIR
if (!directory) throw new Error('Set SQUAD_PACKAGE_DIR to the freshly packaged local output')
const entry = await import(pathToFileURL(resolve(directory, 'index.mjs')).href)
const env = { AWS_REGION: 'us-east-1', STATE_TABLE: 'recon-squad-state', GRANTS_TABLE: 'recon-squad-grants', HTTP_API_ID: 'abcdefghij', WS_API_ID: 'klmnopqrst', COGNITO_POOL_ID: 'us-east-1_rvLy8WLQB', COGNITO_CLIENT_ID: '5bpa1cteenctoue24v4e245re8' }
test('packaged runtime imports real pinned SDKs but refuses the wrong deployment without any sender call', async () => {
  let calls = 0; const fake = { send: async () => { calls++; throw new Error('unexpected fixture call') } }
  assert.throws(() => entry.buildRuntime({ env: { ...env, STATE_TABLE: 'ghost-igl-subscriptions' }, documentClient: fake, transport: {} }), /exact/)
  const runtime = entry.buildRuntime({ env, documentClient: fake, transport: {}, now: () => 1000 })
  const response = await runtime.handle({ rawPath: '/squads/me/profile', requestContext: { apiId: env.HTTP_API_ID, http: { method: 'GET' } } })
  assert.equal(response.statusCode, 401); assert.equal(calls, 0)
  assert.equal((await entry.handler({}, { invokedFunctionArn: 'arn:aws:lambda:us-east-1:183678667221:function:another-app' })).statusCode, 503)
})
test('packaged profile route binds a trusted gateway subject and uses a strong read on the dedicated table', async () => {
  const calls = [], runtime = entry.buildRuntime({ env, documentClient: { send: async command => { calls.push(command.input); return {} } }, transport: {}, now: () => 1000 })
  const response = await runtime.handle({ rawPath: '/prod/squads/me/profile', requestContext: { apiId: env.HTTP_API_ID, stage: 'prod', http: { method: 'GET' }, authorizer: { jwt: { claims: { sub: 'synthetic-owner-001', iss: `https://cognito-idp.us-east-1.amazonaws.com/${env.COGNITO_POOL_ID}`, aud: env.COGNITO_CLIENT_ID, token_use: 'id', exp: 100 } } } } })
  assert.equal(response.statusCode, 200); assert.equal(JSON.parse(response.body).subject, 'synthetic-owner-001')
  assert.equal(calls[0].TableName, env.STATE_TABLE); assert.equal(calls[0].Key.PK, 'USER#synthetic-owner-001'); assert.equal(calls[0].ConsistentRead, true)
})
test('packaged domain is byte identical to the actual frontend domain', () => {
  const hash = bytes => createHash('sha256').update(bytes).digest('hex')
  assert.equal(hash(readFileSync(resolve(directory, 'domain.mjs'))), hash(readFileSync(new URL('../../src/features/squad/domain.mjs', import.meta.url))))
})
