import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeYoutubeUrl } from './youtube-url.mjs'
import { supportApp, PLAYERS, SUPPORT_NOW } from './fixtures/world.mjs'

const id = 'AbCdEfGhI_1'
const canonical = `https://www.youtube.com/watch?v=${id}`
const route = '/cs/me/support/youtube-vods'
for (const url of [canonical, `https://youtu.be/${id}?si=tracker`, `https://m.youtube.com/watch?v=${id}&t=30#anything`, `https://youtube.com/shorts/${id}`, `https://www.youtube.com/live/${id}`, `https://youtube.com/embed/${id}`]) {
  test(`canonicalizes ${url}`, () => assert.deepEqual(normalizeYoutubeUrl(url), { videoId: id, url: canonical }))
}
test('rejects non-video URLs, hostile destinations, credentials and malformed input', () => {
  for (const url of [null, {}, '', 'http://youtube.com/watch?v='+id, 'javascript:alert(1)', 'https://youtube.com.evil.test/watch?v='+id,
    'https://youtube.com@evil.test/watch?v='+id, 'https://user:pass@youtube.com/watch?v='+id, 'https://youtube.com:8443/watch?v='+id,
    'https://127.0.0.1/watch?v='+id, 'https://youtu.be/'+id+'/extra', 'https://youtube.com/playlist?list=abc', 'https://youtube.com/@channel',
    canonical+'&v=Different12', 'https://youtube.com/watch?v=short', canonical+'\nX', 'https://youtube.com\\@evil.test/'+id]) assert.throws(() => normalizeYoutubeUrl(url), String(url))
})
test('requires authentication, entitlement and enabled support; rejects forged ownership fields', async () => {
  const app = supportApp({ seedCases: false })
  assert.equal((await app.call('POST', route, { body: { url: canonical } })).statusCode, 401)
  assert.equal((await app.call('POST', route, { who: 'a', body: { url: canonical } })).statusCode, 403)
  assert.equal((await app.call('POST', route, { who: 'd', body: { url: canonical, email: PLAYERS.a.email } })).statusCode, 400)
  const off = supportApp({ supportFlag: false })
  assert.equal((await off.call('POST', route, { who: 'd', body: { url: canonical } })).statusCode, 404)
})
test('persists a pending support request, reuses receipt, and isolates customer reads', async () => {
  const app = supportApp({ seedCases: false })
  const first = await app.call('POST', route, { who: 'd', body: { url: canonical+'&t=20' } })
  assert.equal(first.statusCode, 201, JSON.stringify(first.json))
  assert.equal(first.json.analysisCompleted, false)
  assert.match(first.json.caseNumber, /^R6-\d+$/)
  const retry = await app.call('POST', route, { who: 'd', body: { url: 'https://youtu.be/'+id } })
  assert.equal(retry.statusCode, 200); assert.equal(retry.json.caseNumber, first.json.caseNumber)
  assert.equal(retry.json.replayed, true)
  const path = '/cs/me/support/cases/'+first.json.caseNumber
  const own = await app.call('GET', path, { who: 'd' })
  assert.equal(own.statusCode, 200)
  assert.match(JSON.stringify(own.json), /Video has not been downloaded or analyzed/)
  assert.match(JSON.stringify(own.json), /AbCdEfGhI_1/)
  assert.notEqual((await app.call('GET', path, { who: 'a' })).statusCode, 200)
  const staff = await app.call('GET', '/cs/admin/support/cases/'+first.json.caseNumber, { who: 'agent' })
  assert.equal(staff.statusCode, 200)
  assert.match(JSON.stringify(staff.json), /AbCdEfGhI_1/)
  assert.equal(app.tablesUnchanged(), true, 'no billing or screenshot quota mutations')
})
test('active Elite comp qualifies; expired comp cannot submit', async () => {
  for (const active of [true, false]) {
    const app = supportApp({ seedCases: false, extendWorld: world => world.subscriptions.push({
      email: PLAYERS.a.email, stripe_customer_id: 'comp_fixture_a', plan: 'elite', status: 'active', comp: true,
      current_period_end: new Date(SUPPORT_NOW+(active?1:-1)*86400000).toISOString(),
    }) })
    const res = await app.call('POST', route, { who: 'a', body: { url: canonical } })
    assert.equal(res.statusCode, active?201:403, JSON.stringify(res.json))
  }
})
test('simultaneous retries cannot create multiple cases', async () => {
  const app = supportApp({ seedCases: false })
  const out = await Promise.all(Array.from({ length: 4 }, () => app.call('POST', route, { who: 'd', body: { url: canonical } })))
  assert.equal(out.filter(x => x.statusCode===201).length, 1)
  assert.ok(out.every(x => [200,201,409].includes(x.statusCode)))
})
test('existing daily case limit also bounds video submissions', async () => {
  const app = supportApp({ seedCases: false })
  const statuses = []
  for (let n=0; n<12; n++) statuses.push((await app.call('POST', route, { who: 'd', body: { url: `https://youtu.be/VideoTest${String(n).padStart(2,'0')}` } })).statusCode)
  assert.ok(statuses.includes(201)); assert.ok(statuses.includes(429))
})
