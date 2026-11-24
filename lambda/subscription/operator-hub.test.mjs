import test from 'node:test'
import assert from 'node:assert/strict'
import { HUB_FIXTURE } from '../../review-tests/operator-hub-fixture.mjs'
import { createOperatorHubHandler, isOperatorHubRequestPath } from './operator-hub.mjs'

const origin = 'https://r6coaching.com'
const fixture = {
  ...HUB_FIXTURE,
  scope: { ...HUB_FIXTURE.scope, private:'NOT-FOR-WEB' },
  operators: HUB_FIXTURE.operators.map(row => ({
    ...row, private:'NOT-FOR-WEB',
    sites: row.sites.map(site => ({ ...site, private:'NOT-FOR-WEB' })),
    loadout: row.loadout && { ...row.loadout, private:'NOT-FOR-WEB' },
  })),
}
const account = { sub:'test-member', email:'member@fixture.invalid', email_verified:true }
function rig(verify = () => account, corpus = () => fixture) {
  let reads = 0
  const tokens = []
  const handler = createOperatorHubHandler({
    allowedOrigins: [origin],
    verifyToken: async token => { tokens.push(token); return verify(token) },
    loadCatalog: () => { reads++; return corpus() },
  })
  return {
    tokens, readCount: () => reads,
    hit: (authorization, method = 'GET', requestOrigin = origin) => handler({
      requestContext:{http:{method}},
      headers:{ authorization, origin:requestOrigin },
    }),
  }
}

test('only exact API Gateway path forms match this route', () => {
  for (const path of ['/content/operator-hub','/prod/content/operator-hub']) assert.equal(isOperatorHubRequestPath(path), true)
  for (const path of ['/content/catalog','/another/content/operator-hub','/content/operator-hub/','/content/operator-hub.json']) {
    assert.equal(isOperatorHubRequestPath(path), false)
  }
})

test('only verified accounts get common data; never load content on missing, invalid, expired or mismatched JWT', async () => {
  const h = rig(token => {
    if (token === 'fixture.valid.id') return account
    throw new Error('PRIVATE-JWT-DETAIL')
  })
  for (const invalid of [undefined, '', 'Basic fixture.valid.id', 'Bearer malformed', 'Bearer fixture.expired.id', 'Bearer fixture.other-pool.id', 'Bearer fixture.other-client.id', 'Bearer fixture.access.token']) {
    const response = await h.hit(invalid)
    assert.equal(response.statusCode, 401)
    assert.equal(response.headers['Cache-Control'], 'private, no-store')
    assert.doesNotMatch(response.body, /PRIVATE-JWT-DETAIL|operators/)
  }
  assert.equal(h.readCount(), 0)
  const ordinary = await h.hit('Bearer fixture.valid.id')
  const paid = await rig(() => ({...account, plan:'champion'})).hit('Bearer fixture.valid.id')
  assert.equal(ordinary.statusCode, 200)
  assert.equal(ordinary.body, paid.body)
  assert.equal(ordinary.headers['Cache-Control'], 'private, no-store')
  assert.equal(ordinary.headers.Vary, 'Origin')
  assert.doesNotMatch(ordinary.body, /member@fixture|NOT-FOR-WEB/)
  assert.equal(h.readCount(), 1)
})

test('unverified or missing email and missing subject are forbidden before data load', async () => {
  for (const claims of [{...account,email_verified:'true'}, {...account,email_verified:false}, {...account,email:''}, {...account,sub:''}, null]) {
    const h = rig(() => claims)
    assert.equal((await h.hit('Bearer fixture.valid.id')).statusCode, 403)
    assert.equal(h.readCount(), 0)
  }
})

test('OPTIONS is empty, unsupported method is denied, CORS never echoes other origins', async () => {
  const h = rig()
  const preflight = await h.hit(undefined, 'OPTIONS')
  assert.equal(preflight.statusCode, 204)
  assert.equal(preflight.body, '')
  assert.equal(preflight.headers['Access-Control-Allow-Origin'], origin)
  assert.equal(preflight.headers['Access-Control-Allow-Headers'], 'Authorization')
  assert.equal((await h.hit(undefined, 'OPTIONS', 'https://elsewhere.invalid')).headers['Access-Control-Allow-Origin'], undefined)
  assert.equal((await h.hit(undefined, 'POST')).statusCode, 405)
  assert.equal(h.readCount(), 0)
  const native = await h.hit('Bearer fixture.valid.id', 'GET', '')
  assert.equal(native.headers['Access-Control-Allow-Origin'], undefined)
})

test('missing/malformed/private-shaped data fails without raw errors or replaying a previous success', async () => {
  for (const load of [
    () => { throw new Error('PRIVATE-PATH') },
    () => ({schemaVersion:9}),
    () => ({ ...fixture, operators:[{...fixture.operators[0], how:{ private:'DO-NOT-LEAK' }}] }),
    () => ({ ...fixture, operators:[{...fixture.operators[0], loadout:{ ...fixture.operators[0].loadout,source:'paid-preset' }}] }),
  ]) {
    const r = await rig(() => account, load).hit('Bearer fixture.valid.id')
    assert.equal(r.statusCode, 503)
    assert.equal(r.headers['Cache-Control'], 'private, no-store')
    assert.doesNotMatch(r.body, /PRIVATE-PATH|DO-NOT-LEAK|paid-preset/)
  }
})
