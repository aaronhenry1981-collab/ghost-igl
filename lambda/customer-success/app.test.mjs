import test from 'node:test'
import assert from 'node:assert/strict'
import { fixtureApp, FIXTURE_NOW as NOW } from './fixtures/app.mjs'

const parse = (res) => JSON.parse(res.body)

test('health check is public and does not leak data', async () => {
  const { call } = fixtureApp()
  const res = await call('GET', '/cs/health')
  assert.equal(res.statusCode, 200)
  assert.deepEqual(parse(res), { ok: true, service: 'recon-customer-success' })
})

test('home requires a signed-in user', async () => {
  const { call } = fixtureApp()
  assert.equal((await call('GET', '/cs/me/home')).statusCode, 401)
  assert.equal((await call('GET', '/cs/me/home', { token: 'forged' })).statusCode, 401)
})

test('home returns the caller\'s own projection, never another player\'s', async () => {
  const { call } = fixtureApp()
  const res = await call('GET', '/cs/me/home', { token: 'tok-paying_active' })
  assert.equal(res.statusCode, 200)
  assert.equal(res.headers['Cache-Control'], 'no-store')
  const view = parse(res)
  assert.equal(view.mode, 'full')
  assert.equal(view.membership.planLabel, 'Elite')
  assert.equal(view.player.name, 'Theo')
  assert.equal(view.lifecycle, null)
  assert.doesNotMatch(res.body, /vertical\.vex@example\.test|quiet\.anchor|cus_FIXTURE/)
})

test('home degrades per source: billing outage yields unknown membership, other sections intact', async () => {
  const { call } = fixtureApp({ failures: { subscriptions: true } })
  const view = parse(await call('GET', '/cs/me/home', { token: 'tok-paying_active' }))
  assert.equal(view.membership.available, false)
  assert.equal(view.membership.status, 'unknown')
  assert.equal(view.sources.billing, 'unavailable')
  assert.ok(view.roadToChampion, 'Road to Champion still renders')
})

test('activity beacon: validated, idempotent per day/type/ref, and scoped to the caller', async () => {
  const { call, store } = fixtureApp()
  const body = { type: 'strat_viewed', ref: { mapId: 'bank', siteId: 'ceo', side: 'defense' } }
  assert.equal((await call('POST', '/cs/me/activity', { token: 'tok-new', body })).statusCode, 202)
  assert.equal((await call('POST', '/cs/me/activity', { token: 'tok-new', body })).statusCode, 202)
  const all = await store.listAll()
  const mine = all.filter((i) => i.type === 'ACT' && i.email === 'rookie.recruit@example.test')
  assert.equal(mine.length, 1, 'second identical beacon on the same day is a no-op')
  assert.ok(mine[0].expires_at > NOW / 1000, 'activity carries a TTL')
})

test('activity beacon rejects unknown types, bad slugs, bad sides and oversized bodies', async () => {
  const { call } = fixtureApp()
  const bad = [
    { type: 'purchase_completed' },
    { type: 'strat_viewed', ref: { mapId: '../../etc', siteId: 'x' } },
    { type: 'strat_viewed', ref: { mapId: 'bank', siteId: 'ceo', side: 'both' } },
    { type: 'strat_viewed', ref: 'bank' },
  ]
  for (const body of bad) assert.equal((await call('POST', '/cs/me/activity', { token: 'tok-new', body })).statusCode, 400)
  assert.equal((await call('POST', '/cs/me/activity', { token: 'tok-new', body: '[1,2]' })).statusCode, 400)
  const big = { type: 'strat_viewed', pad: 'x'.repeat(4000) }
  assert.equal((await call('POST', '/cs/me/activity', { token: 'tok-new', body: big })).statusCode, 413)
  assert.equal((await call('POST', '/cs/me/activity', { body: { type: 'strat_viewed' } })).statusCode, 401)
})

test('CORS: preflight echoes only allow-listed origins; localhost only when configured', async () => {
  const { call } = fixtureApp()
  const ok = await call('OPTIONS', '/cs/me/home', { origin: 'https://www.r6coaching.com' })
  assert.equal(ok.statusCode, 204)
  assert.equal(ok.headers['Access-Control-Allow-Origin'], 'https://www.r6coaching.com')
  const local = await call('OPTIONS', '/cs/me/home', { origin: 'http://localhost:5173' })
  assert.notEqual(local.headers['Access-Control-Allow-Origin'], 'http://localhost:5173', 'production defaults exclude localhost')
  const evil = await call('OPTIONS', '/cs/me/home', { origin: 'https://evil.example' })
  assert.notEqual(evil.headers['Access-Control-Allow-Origin'], 'https://evil.example')
  const dev = fixtureApp({ config: { allowedOrigins: ['https://r6coaching.com', 'http://localhost:5173'] } })
  const devOk = await dev.call('OPTIONS', '/cs/me/home', { origin: 'http://localhost:5173' })
  assert.equal(devOk.headers['Access-Control-Allow-Origin'], 'http://localhost:5173')
})

test('unknown routes are 404 and internal errors do not leak details', async () => {
  const { call } = fixtureApp({
    extraRoutes: [() => ({ routes: [{ method: 'GET', path: '/cs/boom', handler: async () => { throw new Error('secret table name ghost-igl-subscriptions') } }] })],
  })
  assert.equal((await call('GET', '/cs/nope')).statusCode, 404)
  const res = await call('GET', '/cs/boom')
  assert.equal(res.statusCode, 500)
  assert.doesNotMatch(res.body, /ghost-igl-subscriptions/)
})
