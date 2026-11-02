import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createShellCache } from './worker-core.mjs'
const scope = 'https://preview.invalid/squad-preview/', digest = text => createHash('sha256').update(text).digest('hex')
const navigation = () => { const request = new Request(scope); Object.defineProperty(request, 'mode', { value: 'navigate' }); return request }
function fixture() {
  const buckets = new Map(), requests = []; let server = {}, online = true
  const fetchImpl = async request => { requests.push(request); if (!online || !(request.url in server)) throw new Error('offline or absent'); return new Response(server[request.url]) }
  const caches = { open: async name => {
    if (!buckets.has(name)) {
      const rows = new Map()
      buckets.set(name, { rows, addAll: async reqs => { for (const request of reqs) rows.set(request.url, await fetchImpl(request)) }, match: async key => rows.get(typeof key === 'string' ? key : key.url)?.clone(), put: async (key, response) => rows.set(key, response) })
    }
    return buckets.get(name)
  }, keys: async () => [...buckets.keys()], delete: async name => buckets.delete(name) }
  const make = (label, version) => {
    const files = { 'index.html': `<script src="assets/${label}.js"></script>`, [`assets/${label}.js`]: label }
    return { files, shell: createShellCache({ scope, assets: Object.keys(files), assetHashes: Object.fromEntries(Object.entries(files).map(([key, value]) => [key, digest(value)])), version, cacheStorage: caches, fetchImpl }) }
  }
  return { make, buckets, requests, setServer(files) { server = Object.fromEntries(Object.entries(files).map(([key, value]) => [new URL(key, scope).href, value])) }, offline() { online = false } }
}
test('offline navigation restores only the cached public preview index', async () => {
  const f = fixture(), old = f.make('old', '1111111111111111'); f.setServer(old.files); await old.shell.install(); f.offline()
  assert.match(await (await old.shell.handle(navigation())).text(), /old.js/)
  assert.equal(old.shell.handle(new Request('https://preview.invalid/account')), null)
})
test('an old worker never replaces its HTML with next-release network HTML', async () => {
  const f = fixture(), old = f.make('old', '1111111111111111'), next = f.make('new', '2222222222222222')
  f.setServer(old.files); await old.shell.install(); const requests = f.requests.length; f.setServer(next.files)
  assert.match(await (await old.shell.handle(navigation())).text(), /old.js/); assert.equal(f.requests.length, requests)
  f.offline(); assert.match(await (await old.shell.handle(navigation())).text(), /old.js/)
  assert.equal(await (await old.shell.handle(new Request(scope + 'assets/old.js'))).text(), 'old')
})
test('waiting and activated releases each retain a complete internally consistent offline shell', async () => {
  const f = fixture(), old = f.make('old', '1111111111111111'), next = f.make('new', '2222222222222222')
  f.setServer(old.files); await old.shell.install(); await old.shell.activate(); f.setServer(next.files); await next.shell.install()
  assert.match(await (await old.shell.handle(navigation())).text(), /old.js/)
  await next.shell.activate(); f.offline()
  assert.match(await (await next.shell.handle(navigation())).text(), /new.js/)
  assert.equal(await (await next.shell.handle(new Request(scope + 'assets/new.js'))).text(), 'new')
  assert.match(await (await old.shell.handle(navigation())).text(), /old.js/); assert.equal(f.buckets.size, 2)
})
test('a mixed deployment or changed asset fails installation without damaging the active release', async () => {
  const f = fixture(), old = f.make('old', '1111111111111111'), next = f.make('new', '2222222222222222')
  f.setServer(old.files); await old.shell.install(); f.setServer({ ...next.files, 'index.html': old.files['index.html'] })
  await assert.rejects(() => next.shell.install(), /does not match/); assert.equal(f.buckets.size, 1)
  f.offline(); assert.match(await (await old.shell.handle(navigation())).text(), /old.js/)
})
test('missing cached HTML cannot be repopulated with the wrong release', async () => {
  const f = fixture(), old = f.make('old', '1111111111111111'), next = f.make('new', '2222222222222222')
  f.setServer(old.files); await old.shell.install(); const cache = [...f.buckets.values()][0]; cache.rows.delete(scope + 'index.html'); f.setServer(next.files)
  await assert.rejects(() => old.shell.handle(navigation()), /does not match/); assert.equal(cache.rows.has(scope + 'index.html'), false)
})
