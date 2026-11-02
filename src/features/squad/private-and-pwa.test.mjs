import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createAccountViewCache } from './account-cache.mjs'
import { createRemoteSquadAdapter } from './remote-adapter.mjs'
import { createShellCache } from './pwa/worker-core.mjs'
const subjectA = 'verified-account-a', subjectB = 'verified-account-b'
const snapshot = { room: { id: 'room-test-001', members: { 'local-member': { alias: 'Demo', subject: 'local-member' } }, receipts: ['private'], excluded: [] }, memberId: 'local-member', revision: 1, expiresAt: 100_000 }
function store() { const rows = new Map(); return { getItem: key => rows.get(key), setItem: (key, value) => rows.set(key, value), removeItem: key => rows.delete(key), key: i => [...rows.keys()][i], get length() { return rows.size }, rows } }
test('owner view cache separates accounts and never saves a full token/invite response', () => {
  const storage = store(), cache = createAccountViewCache({ storage, now: () => 1000 })
  cache.save(subjectA, { ...snapshot, invite: 'secret-invite', token: 'secret-token' })
  assert.equal(cache.read(subjectB, snapshot.room.id), null)
  const value = cache.read(subjectA, snapshot.room.id)
  assert.equal(value.stale, true); assert.equal(value.offline, true)
  const raw = [...storage.rows.values()].join(''); assert.equal(raw.includes('secret-'), false); assert.equal(raw.includes('private'), false)
  cache.save(subjectB, snapshot); cache.clear(subjectA); assert.equal(cache.read(subjectA, snapshot.room.id), null); assert.ok(cache.read(subjectB, snapshot.room.id))
})
test('expired, malformed and wrong-owner cached views fail closed', () => {
  const storage = store(); let clock = 1000; const cache = createAccountViewCache({ storage, now: () => clock, maxAgeMs: 1000 })
  cache.save(subjectA, snapshot); clock = 2001; assert.equal(cache.read(subjectA, snapshot.room.id), null)
  clock = 1000; cache.save(subjectA, snapshot); const key = [...storage.rows.keys()][0], saved = JSON.parse(storage.getItem(key)); saved.owner = subjectB; storage.setItem(key, JSON.stringify(saved)); assert.equal(cache.read(subjectA, snapshot.room.id), null)
  storage.setItem(key, '{'); assert.equal(cache.read(subjectA, snapshot.room.id), null)
})
function client({ fetchImpl, cache, timeoutMs = 1000 } = {}) {
  let subject = subjectA, online = true
  const adapter = createRemoteSquadAdapter({ baseUrl: 'https://squad-api.invalid/prod', trustedOrigins: ['https://squad-api.invalid'], getIdentity: async () => ({ subject, token: `fixture-${subject}` }), getCurrentSubject: () => subject, online: () => online, fetchImpl, viewCache: cache, timeoutMs })
  return { adapter, switch: value => { subject = value }, offline: () => { online = false } }
}
test('unconfigured or unapproved endpoints fail instead of using a production fallback', async () => {
  assert.throws(() => createRemoteSquadAdapter({ baseUrl: 'https://other.invalid', trustedOrigins: [], getIdentity: () => {}, getCurrentSubject: () => {} }), /approved/)
  const c = createRemoteSquadAdapter({ getIdentity: () => {}, getCurrentSubject: () => {} })
  await assert.rejects(() => c.snapshot('room'), /not connected/)
})
test('account switch rejects delayed success and never caches it for the new account', async () => {
  let release, calls = 0; const saved = []
  const c = client({ fetchImpl: async () => { calls++; return new Promise(resolve => { release = () => resolve({ ok: true, json: async () => snapshot }) }) }, cache: { save: (...args) => saved.push(args), clear: () => {} } })
  const pending = c.adapter.snapshot(snapshot.room.id); await new Promise(resolve => setTimeout(resolve, 0)); c.switch(subjectB); release()
  await assert.rejects(() => pending, { name: 'StaleAccountError' }); assert.equal(calls, 1); assert.equal(saved.length, 0)
})
test('logout clears the bound former account even if current identity already changed', async () => {
  const cleared = [], c = client({ fetchImpl: async () => ({ ok: true, json: async () => snapshot }), cache: { save: () => {}, clear: subject => cleared.push(subject) } })
  await c.adapter.snapshot(snapshot.room.id); c.switch(subjectB); c.adapter.disconnect()
  assert.deepEqual(cleared, [subjectA])
})
test('offline requests do not fetch or queue a command', async () => {
  let calls = 0; const c = client({ fetchImpl: async () => { calls++ } }); c.offline()
  await assert.rejects(() => c.adapter.command('room', { requestId: 'test' }), /cached viewing only/); assert.equal(calls, 0)
})
test('uncertain mutation timeout performs one request and requires readback', async () => {
  let calls = 0
  const c = client({ timeoutMs: 5, fetchImpl: (_url, options) => { calls++; return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('timeout')))) } })
  await assert.rejects(() => c.adapter.command('room-test-001', { requestId: 'request-001' }), { uncertain: true }); assert.equal(calls, 1)
})
test('storage failure does not turn a confirmed server operation into an uncertain one', async () => {
  const c = client({ fetchImpl: async () => ({ ok: true, json: async () => snapshot }), cache: { save: () => { throw new Error('quota') }, clear: () => {} } })
  const response = await c.adapter.command('room-test-001', { requestId: 'request-001' }); assert.equal(response.revision, 1); assert.equal(response.cacheStatus, 'unavailable')
})
function shell() {
  const entries = new Map(), buckets = new Map(), calls = []
  const cache = { addAll: async requests => { for (const request of requests) { calls.push(request); entries.set(request.url, new Response('cached shell')) } }, match: async key => entries.get(typeof key === 'string' ? key : key.url)?.clone(), put: async (key, value) => entries.set(key, value) }
  const caches = { open: async name => { buckets.set(name, cache); return cache }, keys: async () => [...buckets.keys()], delete: async name => buckets.delete(name) }
  const hash = createHash('sha256').update('cached shell').digest('hex')
  const handler = createShellCache({ scope: 'https://preview.invalid/squad-preview/', assets: ['index.html', 'assets/app.js'], assetHashes: { 'index.html': hash, 'assets/app.js': hash }, version: '1234567890abcdef', cacheStorage: caches, fetchImpl: async request => { calls.push(request); return new Response('cached shell') } })
  return { handler, entries, buckets, calls }
}
test('service worker refuses root scope, external/encoded assets and private routes', () => {
  for (const [scope, assets] of [['https://preview.invalid/', ['index.html']], ['https://preview.invalid/squad-preview/', ['index.html', '../login']], ['https://preview.invalid/squad-preview/', ['index.html', 'assets/%2fsecret']], ['https://preview.invalid/squad-preview/', ['index.html', 'api/private']]]) {
    assert.throws(() => createShellCache({ scope, assets, version: '1234567890abcdef' }))
  }
})
test('worker ignores auth, billing, APIs, queries and writes rather than caching them', () => {
  const f = shell()
  for (const url of ['/login', '/me', '/squad-preview/api/room', '/squad-preview/index.html?token=secret']) assert.equal(f.handler.handle(new Request('https://preview.invalid' + url)), null)
  assert.equal(f.handler.handle(new Request('https://preview.invalid/squad-preview/index.html', { method: 'POST', body: '{}' })), null)
})
test('shell precache and network fetch omit cookies and authentication headers', async () => {
  const f = shell(); await f.handler.install()
  assert.ok(f.calls.every(request => request.credentials === 'omit' && request.redirect === 'error'))
  f.entries.delete('https://preview.invalid/squad-preview/index.html')
  const incoming = new Request('https://preview.invalid/squad-preview/', { headers: { Authorization: 'secret' } }); Object.defineProperty(incoming, 'mode', { value: 'navigate' })
  await f.handler.handle(incoming); const request = f.calls.at(-1); assert.equal(request.headers.get('Authorization'), null); assert.equal(request.credentials, 'omit')
})
test('worker uses only its own two most recent caches and preserves other website caches', async () => {
  const f = shell(); f.buckets.set('existing-paid-site', {}); f.buckets.set('recon-squad-preview-shell-v1-old1', {}); f.buckets.set('recon-squad-preview-shell-v1-old2', {})
  await f.handler.install(); await f.handler.activate()
  assert.equal(f.buckets.has('existing-paid-site'), true); assert.equal(f.buckets.has('recon-squad-preview-shell-v1-old1'), false); assert.equal(f.buckets.has('recon-squad-preview-shell-v1-old2'), true)
})
