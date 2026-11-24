import assert from 'node:assert/strict'
import test from 'node:test'
import { HUB_FIXTURE as catalog } from '../../../review-tests/operator-hub-fixture.mjs'
import { HUB_PATH, hubPathFor, hubAuthHref, filterOperators, formatCheckedDate, fetchOperatorHub, operatorRecommendations } from './operatorHub.mjs'
import { analyticsEnabledFor } from '../../lib/analyticsScope.mjs'
import { allRoutePaths, metaForPath } from '../../config/routeMeta.js'

const { operators } = catalog

test('role-based recommendations fill gaps without overriding named examples or loadouts', () => {
  const [named, fallback] = operators
  assert.deepEqual(operatorRecommendations(named), { siteFit: null, setupFit: null })
  const result = operatorRecommendations(fallback)
  assert.equal(result.siteFit, fallback.when)
  assert.match(result.setupFit, /Fixture Bjørn’s fixture watcher role/)
  assert.doesNotMatch(result.setupFit + result.siteFit, /not yet verified|doesn’t have|not enough/i)
})

test('side filtering, accent aliases and safe sign-in return with no arbitrary URL state', () => {
  assert.equal(filterOperators(operators, 'all', 'bjorn')[0].name, 'Fixture Bjørn')
  assert.equal(filterOperators(operators, 'attack', 'bjorn').length, 0)
  assert.equal(filterOperators(operators, 'defense', 'watcher').length, 1)
  assert.equal(hubPathFor('fictional-operator'), '/operator-hub/fictional-operator')
  for (const slug of [undefined, '../dashboard', '//outside.test', 'foo?private=bad', 'a#fragment', 'É']) {
    assert.equal(hubPathFor(slug), HUB_PATH, String(slug))
  }
  assert.equal(new URL(hubAuthHref('fictional-operator', true), 'https://example.test').searchParams.get('redirect'), '/operator-hub/fictional-operator')
  assert.equal(formatCheckedDate('2000-01-01'), 'Jan 1, 2000')
})

test('hub bootstrap metadata excludes tracking and the existing operator routes remain public', () => {
  for (const path of ['/operator-hub', '/operator-hub/fictional-operator']) {
    assert.equal(metaForPath(path).noindex, true)
    assert.ok(!allRoutePaths().includes(path))
    assert.equal(analyticsEnabledFor(path), false)
  }
  for (const path of ['/operators', '/operators/compare', '/operators/ash']) {
    assert.equal(metaForPath(path).noindex, false)
    assert.ok(allRoutePaths().includes(path))
  }
})

test('anonymous browser fetch fails without network; actual request is abortable no-store bearer GET', async () => {
  let network = 0
  const { signal } = new AbortController()
  const transport = async (url, opts) => {
    ++network
    assert.equal(url, 'https://example.test/prod/content/operator-hub')
    assert.deepEqual(opts, { method: 'GET', headers: { Authorization: 'Bearer synthetic', Accept: 'application/json' },
      credentials: 'omit', cache: 'no-store', redirect: 'error', signal })
    return { status: 200, ok: true, json: async () => catalog }
  }
  await assert.rejects(fetchOperatorHub({ apiBase: 'https://example.test/prod/', signal, transport }), { code: 'session' })
  assert.equal(network, 0)
  assert.equal(await fetchOperatorHub({ apiBase: 'https://example.test/prod/', token: 'synthetic', signal, transport }), catalog)
  assert.equal(network, 1)
  for (const [status, code] of [[401, 'session'], [403, 'verify'], [503, 'unavailable']]) {
    await assert.rejects(fetchOperatorHub({ apiBase: 'https://example.test', token: 'synthetic', signal,
      transport: async () => ({status}) }), {code})
  }
})
