import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { ALIAS_ROUTES, OPEN_ROUTE_PREFIXES, allRoutePaths, metaForPath } from '../src/config/routeMeta.js'

const source = readFileSync(new URL('./cloudfront-site-router.js', import.meta.url), 'utf8')
const sandbox = {}
vm.runInNewContext(`${source}\nthis.handler = handler; this.EXACT = EXACT; this.APP_PREFIXES = APP_PREFIXES; this.DEEP_DIVE_OPERATORS = DEEP_DIVE_OPERATORS;`, sandbox)

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
  assert.equal(served('/guides/bank.html'), '/guides/bank.html')
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

test('merged thin pages redirect to their map guide', () => {
  assert.equal(run('/guides/bans/bank.html').headers.location.value, '/guides/bank.html')
  assert.equal(run('/guides/bans/kafe').headers.location.value, '/guides/kafe.html')
  assert.equal(run('/guides/bans/').headers.location.value, '/guides/')
  assert.equal(run('/blog/bank-defense-setups-ranked.html').headers.location.value, '/guides/bank.html')
  assert.equal(run('/blog/emerald-plains-defense-setups-ranked.html').statusCode, 301)
  assert.equal(run('/blog/emerald-plains-defense-setups-ranked.html').headers.location.value, '/guides/emerald-plains.html')
  // Per-site guides land on their section of the map guide; a query string
  // stays ahead of the anchor.
  assert.equal(run('/guides/bank/ceo.html').headers.location.value, '/guides/bank.html#ceo')
  assert.equal(run('/guides/stadium-bravo/nats-oregon').headers.location.value, '/guides/stadium-bravo.html#nats-oregon')
  assert.equal(run('/guides/bank/ceo.html', { ref: { value: 'tt' } }).headers.location.value, '/guides/bank.html?ref=tt#ceo')
  // An operator with a deep dive has one page; the rest keep their guide.
  assert.equal(run('/guides/operators/ash.html').headers.location.value, '/blog/r6-operator-ash.html')
  assert.equal(run('/guides/operators/ash').headers.location.value, '/blog/r6-operator-ash.html')
  assert.equal(served('/guides/operators/jackal.html'), '/guides/operators/jackal.html')
  assert.equal(served('/guides/operators/'), '/guides/operators/index.html')
  assert.equal(served('/guides/og/bank.svg'), '/guides/og/bank.svg')
})

test('HeyCatch short links land on the home page with the channel as UTM tags', () => {
  for (const c of ['f', 'i', 'l', 'r', 't', 'x', 'y', '7']) {
    const res = run(`/${c}`)
    assert.equal(res.statusCode, 302, c)
    assert.equal(res.headers.location.value, `/?utm_source=heycatch&utm_campaign=${c}`, c)
  }
  assert.equal(run('/i/').headers.location.value, '/?utm_source=heycatch&utm_campaign=i')
  // Longer paths keep their own handling.
  assert.equal(served('/r/ABC123'), '/_shell/app.html')
  assert.equal(served('/ii'), '/ii')
  assert.equal(served('/I'), '/I')
})

test('blog posts for other games go to the blog index; R6 posts are served', async () => {
  for (const uri of ['/blog/valorant-plat-to-diamond.html', '/blog/pubg-endgame-strategy', '/blog/finals-gold-to-plat.html']) {
    assert.equal(run(uri).statusCode, 301, uri)
    assert.equal(run(uri).headers.location.value, '/blog/', uri)
  }
  assert.equal(run('/blog/cs2-silver-to-gold.html', { ref: { value: 'x' } }).headers.location.value, '/blog/?ref=x')
  assert.equal(served('/blog/index.html'), '/blog/index.html')
  const { readdirSync } = await import('node:fs')
  const kept = readdirSync(new URL('../public/blog/', import.meta.url))
    .filter((f) => f.endsWith('.html') && (f.startsWith('r6-') || f.startsWith('hardstuck-')))
  assert.ok(kept.length > 50)
  for (const f of kept) assert.equal(served(`/blog/${f}`), `/blog/${f}`, f)
})

test('the operator redirects match the deep dives on disk', async () => {
  const { readdirSync, existsSync } = await import('node:fs')
  const dir = new URL('../public/blog/', import.meta.url)
  const onDisk = readdirSync(dir).map((f) => f.match(/^r6-operator-([a-z0-9-]+)\.html$/)?.[1]).filter(Boolean).sort()
  assert.deepEqual(Object.keys(sandbox.DEEP_DIVE_OPERATORS).sort(), onDisk)
  // A folded guide must not be regenerated next to its redirect.
  for (const slug of onDisk) assert.equal(existsSync(new URL(`../public/guides/operators/${slug}.html`, import.meta.url)), false, slug)
})

// Every directory under public/ that has an index.html must also answer
// without its trailing slash (Stripe and booking emails link both forms).
test('every static directory redirects to its trailing-slash form', async () => {
  const { readdirSync, existsSync } = await import('node:fs')
  const { join } = await import('node:path')
  const root = new URL('../public/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
  const dirs = []
  const walk = (rel) => {
    for (const entry of readdirSync(join(root, rel), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const sub = rel ? `${rel}/${entry.name}` : entry.name
      if (existsSync(join(root, sub, 'index.html'))) dirs.push(`/${sub}`)
      walk(sub)
    }
  }
  walk('')
  const missing = dirs.filter((d) => !d.startsWith('/games') && run(d).statusCode !== 301)
  assert.deepEqual(missing, [])
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
