import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ALIAS_ROUTES, OPEN_ROUTE_PREFIXES, allRoutePaths, metaForPath } from './routeMeta.js'

const indexable = allRoutePaths().map((path) => [path, metaForPath(path)]).filter(([, m]) => m && !m.noindex)

test('every indexable route has a 30-60 character title and a 110-160 character description', () => {
  const bad = []
  for (const [path, meta] of [['/', metaForPath('/')], ...indexable]) {
    if (meta.title.length < 30 || meta.title.length > 60) bad.push(`${path} title ${meta.title.length}: ${meta.title}`)
    if (!meta.description || meta.description.length < 110 || meta.description.length > 160) {
      bad.push(`${path} description ${meta.description?.length}: ${meta.description}`)
    }
  }
  assert.deepEqual(bad, [])
})

test('no two indexable routes share a title or a description', () => {
  const seen = new Map()
  const dupes = []
  for (const [path, meta] of [['/', metaForPath('/')], ...indexable]) {
    for (const key of [`t:${meta.title}`, `d:${meta.description}`]) {
      if (seen.has(key)) dupes.push(`${seen.get(key)} and ${path}: ${key}`)
      seen.set(key, path)
    }
  }
  assert.deepEqual(dupes, [])
})

test('canonical is the route itself, without a trailing slash or query', () => {
  assert.equal(metaForPath('/').canonical, 'https://r6coaching.com/')
  assert.equal(metaForPath('/pricing/').canonical, 'https://r6coaching.com/pricing')
  assert.equal(metaForPath('/strats/bank/ceo/defense?x=1').canonical, 'https://r6coaching.com/strats/bank/ceo/defense')
})

test('unknown paths have no route, so the edge serves a real 404', () => {
  for (const path of ['/about-us', '/features', '/strats/atlantis', '/strats/bank/ceo/sideways', '/operators/nobody', '/llms']) {
    assert.equal(metaForPath(path), null, path)
  }
})

test('sign-in and private pages stay out of search', () => {
  for (const path of ['/auth', '/account', '/dashboard', '/admin/members', '/r/ABC123', ...ALIAS_ROUTES]) {
    assert.equal(metaForPath(path)?.noindex, true, path)
  }
})

// Every route the router registers must resolve here, or the CloudFront
// router would answer it with a 404.
test('every route registered in main.jsx has a head', () => {
  const source = readFileSync(new URL('../main.jsx', import.meta.url), 'utf8')
  const paths = [...source.matchAll(/path: '([^']+)'/g)].map((m) => m[1]).filter((p) => p !== '*' && !p.startsWith('/__dev'))
  const sample = {
    ':mapId': 'bank', ':siteId': 'ceo', ':side': 'defense', ':opName': 'ash', ':code': 'ABC123', ':slug': 'billing', ':caseNumber': 'R6-000001',
  }
  const missing = []
  for (const path of paths) {
    const concrete = path.replace(/:[a-zA-Z]+/g, (k) => sample[k] || 'x').replace('/*', '/members')
    if (!metaForPath(concrete)) missing.push(`${path} -> ${concrete}`)
  }
  assert.deepEqual(missing, [])
  assert.ok(OPEN_ROUTE_PREFIXES.includes('/admin'))
})
