import test from 'node:test'
import assert from 'node:assert/strict'
import { CONNECTION_SOURCES, connectionHealth, freshnessOf, rankDiscrepancyContext } from './connections.mjs'

const NOW = Date.parse('2026-10-14T15:00:00.000Z')
const MIN = 60000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const iso = (ms) => new Date(ms).toISOString()
const snap = (source, ageMs, over = {}) => ({ source, captured_at: iso(NOW - ageMs), created_at: iso(NOW - ageMs + MIN), snapshot_id: `s-${source}-${ageMs}`, verification: 'verified_external', fields: { rank: 'Gold I' }, ...over })

test('one entry per source, with honest not-recorded fields', () => {
  const out = connectionHealth({ snapshots: [snap('ubisoft', 10 * MIN)], identities: [{ provider: 'ubisoft', verified: true }], providerHealth: [], now: NOW })
  assert.deepEqual(out.map((e) => e.source), [...CONNECTION_SOURCES])
  assert.deepEqual([...CONNECTION_SOURCES], ['ubisoft', 'psn', 'xbox', 'trn', 'replay', 'vod', 'desktop'])
  for (const e of out) {
    assert.equal(e.lastAttemptAt, null)
    assert.ok(e.notes.some((n) => /not recorded per player/.test(n)))
  }
  const ubi = out.find((e) => e.source === 'ubisoft')
  assert.equal(ubi.linked, true)
  assert.equal(ubi.freshness, 'fresh')
  assert.equal(ubi.lastSuccessAt, iso(NOW - 10 * MIN + MIN))
  assert.equal(ubi.observedAt, iso(NOW - 10 * MIN))
  assert.equal(ubi.errorClass, null)
  assert.equal(ubi.retryEligible, false, 'fresh data needs no retry')
  const replay = out.find((e) => e.source === 'replay')
  assert.equal(replay.linked, null)
  assert.ok(replay.notes.some((n) => /No replay upload system/.test(n)))
  assert.ok(out.find((e) => e.source === 'desktop').notes.some((n) => /not recorded/.test(n)))
})

test('freshness follows player-data computeFreshness thresholds', () => {
  assert.equal(freshnessOf(snap('trn', 30 * MIN), NOW), 'fresh')
  assert.equal(freshnessOf(snap('trn', 5 * HOUR), NOW), 'aging')
  assert.equal(freshnessOf(snap('trn', 2 * DAY), NOW), 'stale')
  assert.equal(freshnessOf(snap('trn', 10 * MIN, { fresh_until: iso(NOW - MIN) }), NOW), 'stale')
  assert.equal(freshnessOf(null, NOW), 'unknown')
  assert.equal(freshnessOf({ source: 'trn', captured_at: 'garbage' }, NOW), 'unknown')
})

test('global provider failure is an error class, not a per-player error', () => {
  const out = connectionHealth({
    snapshots: [snap('psn', 3 * DAY)],
    identities: [{ provider: 'psn', verified: false }],
    providerHealth: [{ provider: 'psn', status: 'down', observed_at: iso(NOW - 5 * MIN) }, { provider: 'trn', status: 'rate_limited', observed_at: iso(NOW - MIN) }],
    now: NOW,
    platform: 'ps5',
  })
  const psn = out.find((e) => e.source === 'psn')
  assert.equal(psn.errorClass, 'global_down')
  assert.equal(psn.reconActionRequired, true)
  assert.equal(psn.retryEligible, false, 'no retry while the provider is down')
  assert.ok(psn.notes.some((n) => /applies to every player/.test(n)))
  assert.ok(psn.notes.some((n) => /player-reported/.test(n)))
  const trn = out.find((e) => e.source === 'trn')
  assert.equal(trn.errorClass, 'global_rate_limited')
  assert.equal(trn.reconActionRequired, false)
})

test('user action only for the platform the player actually uses', () => {
  const xboxPlayer = connectionHealth({ snapshots: [], identities: [], providerHealth: [], now: NOW, platform: 'xbox' })
  assert.equal(xboxPlayer.find((e) => e.source === 'xbox').userActionRequired, true)
  assert.equal(xboxPlayer.find((e) => e.source === 'psn').userActionRequired, false)
  assert.equal(xboxPlayer.find((e) => e.source === 'ubisoft').userActionRequired, true)
  const stale = connectionHealth({ snapshots: [snap('ubisoft', 3 * DAY)], identities: [{ provider: 'ubisoft' }], providerHealth: [], now: NOW })
  assert.equal(stale.find((e) => e.source === 'ubisoft').retryEligible, true)
})

test('unreadable identities / provider health are unknown, not "not linked"', () => {
  const out = connectionHealth({ snapshots: [snap('ubisoft', HOUR * 2)], identities: null, providerHealth: null, now: NOW })
  const ubi = out.find((e) => e.source === 'ubisoft')
  assert.equal(ubi.linked, null)
  assert.ok(ubi.notes.some((n) => /could not be read/.test(n)))
  assert.equal(ubi.freshness, 'aging')
})

test('rank context: sources, latest provider and history state (facts)', () => {
  const ctx = rankDiscrepancyContext({ snapshots: [snap('ubisoft', 2 * HOUR, { season: 'Y11S3' }), snap('trn', 3 * DAY, { season: 'Y11S3', fields: { kd: 1.1 } }), snap('vod', DAY, { fields: { last_vod_map: 'Bank' } })], now: NOW })
  assert.equal(ctx.latestProvider.kind, 'fact')
  assert.equal(ctx.latestProvider.source, 'ubisoft')
  assert.equal(ctx.history.state, 'multiple')
  assert.equal(ctx.history.snapshots, 3)
  assert.deepEqual(ctx.dataSources.map((s) => s.source).sort(), ['trn', 'ubisoft', 'vod'])
  assert.equal(ctx.classification.kind, 'inference')
  assert.equal(ctx.classification.value, 'our_normalization', 'fresh verified source: a mismatch would be ours')
  assert.equal(ctx.seasonRollover.suspected, false)
})

test('rank context: season rollover inferred from the season field', () => {
  const ctx = rankDiscrepancyContext({ snapshots: [snap('ubisoft', 2 * HOUR, { season: 'Y11S4', fields: { rank: 'Unranked' } }), snap('ubisoft', 10 * DAY, { season: 'Y11S3' })], now: NOW })
  assert.equal(ctx.seasonRollover.kind, 'inference')
  assert.equal(ctx.seasonRollover.suspected, true)
  assert.match(ctx.seasonRollover.basis, /Y11S3.*Y11S4/)
  assert.ok(ctx.seasonRollover.confidence >= 0.7)
  assert.equal(ctx.classification.value, 'external_data_freshness')
})

test('rank context: date-window rollover fallback when no season field exists', () => {
  const march = Date.parse('2027-03-06T12:00:00.000Z')
  const ctx = rankDiscrepancyContext({ snapshots: [{ source: 'trn', captured_at: iso(march - 3 * HOUR), created_at: iso(march - 3 * HOUR), verification: 'verified_external', fields: { rank: 'Gold I' } }], now: march })
  assert.equal(ctx.seasonRollover.suspected, true)
  assert.match(ctx.seasonRollover.basis, /date window only/)
  assert.ok(ctx.seasonRollover.confidence < 0.4)
})

test('rank context: stale or self-reported data is external freshness; none is undetermined', () => {
  assert.equal(rankDiscrepancyContext({ snapshots: [snap('trn', 4 * DAY)], now: NOW }).classification.value, 'external_data_freshness')
  assert.equal(rankDiscrepancyContext({ snapshots: [snap('manual', 10 * MIN, { verification: 'player_reported' })], now: NOW }).classification.value, 'external_data_freshness')
  const none = rankDiscrepancyContext({ snapshots: [], now: NOW })
  assert.equal(none.classification.value, 'undetermined')
  assert.equal(none.history.state, 'none')
  assert.equal(none.latestProvider, null)
})
