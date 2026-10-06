import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { ALIAS_ROUTES, OPEN_ROUTE_PREFIXES, allRoutePaths, metaForPath } from '../src/config/routeMeta.js'

const source = readFileSync(new URL('./cloudfront-site-router.js', import.meta.url), 'utf8')
const sandbox = {}
vm.runInNewContext(`${source}\nthis.handler = handler; this.EXACT = EXACT; this.APP_PREFIXES = APP_PREFIXES;`, sandbox)

function run(uri, querystring = {}) {
  return sandbox.handler({ request: { uri, querystring, headers: {} } })
}
const served = (uri) => run(uri).uri

test('app routes are served from their own shell', () => {
  assert.equal(served('/strats'), '/_shell/strats.html')
  assert.equal(served('/pricing'), '/_shell/pricing.html')
  assert.equal(served('/about'), '/_shell/about.html')
  assert.equal(served('/strats/bank/ceo/defense'), '/_shell/strats/bank/ceo/defense.html')
  assert.equal(served('/operators/ash'), '/_shell/operators/ash.html')
  assert.equal(served('/operators/compare'), '/_shell/operators/compare.html')
  assert.equal(served('/tools/r6-tier-list'), '/_shell/tools/r6-tier-list.html')
})

test('open-ended routes share the generic shell', () => {
  for (const uri of ['/admin', '/admin/members/abc', '/r/ABC123', '/help/billing', '/support/cases/R6-000001', '/embed/match-prep/bank']) {
    assert.equal(served(uri), '/_shell/app.html', uri)
  }
})

test('static files and directories pass through', () => {
  assert.equal(served('/'), '/')
  assert.equal(served('/blog/'), '/blog/index.html')
  assert.equal(served('/guides/bank/ceo.html'), '/guides/bank/ceo.html')
  assert.equal(served('/assets/index-abc.js'), '/assets/index-abc.js')
  assert.equal(served('/sitemap.xml'), '/sitemap.xml')
  assert.equal(served('/llms.txt'), '/llms.txt')
  assert.equal(served('/guides/bank'), '/guides/bank.html')
})

test('unknown paths are left for S3 to miss, which the distribution turns into a 404', () => {
  for (const uri of ['/about-us', '/features', '/wp-login', '/strats-old']) assert.equal(served(uri), uri)
})

test('trailing slashes and bare directories redirect to the canonical form', () => {
  const a = run('/strats/', { utm_source: { value: 'tiktok' } })
  assert.equal(a.statusCode, 301)
  assert.equal(a.headers.location.value, '/strats?utm_source=tiktok')
  const b = run('/coaching')
  assert.equal(b.statusCode, 301)
  assert.equal(b.headers.location.value, '/coaching/')
  assert.equal(run('/pricing/').headers.location.value, '/pricing')
})

test('the router knows exactly the routes routeMeta describes', () => {
  const exact = allRoutePaths().filter((p) => p.split('/').length === 2 || ['/operators/compare', '/tools/r6-tier-list'].includes(p))
  assert.deepEqual(Object.keys(sandbox.EXACT).sort(), exact.sort())
  for (const alias of ALIAS_ROUTES) assert.equal(sandbox.EXACT[alias], 1, alias)
  for (const prefix of OPEN_ROUTE_PREFIXES) {
    assert.ok(sandbox.APP_PREFIXES.includes(prefix.endsWith('/') ? prefix : `${prefix}/`), prefix)
  }
})

test('every concrete route maps to the shell the build writes for it', () => {
  const missing = allRoutePaths().filter((path) => served(path) !== `/_shell${path}.html` || !metaForPath(path))
  assert.deepEqual(missing, [])
})
