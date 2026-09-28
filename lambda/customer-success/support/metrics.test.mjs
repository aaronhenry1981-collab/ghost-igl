import test from 'node:test'
import assert from 'node:assert/strict'
import { computeSupportMetrics } from './metrics.mjs'
import { buildSupportCaseWorld, SUPPORT_NOW } from './fixtures/world.mjs'

const HOUR = 3600000
const DAY = 24 * HOUR
const NOW = Date.parse('2026-09-30T00:00:00.000Z')
const iso = (ms) => new Date(ms).toISOString()
const FROM = iso(NOW - 30 * DAY)
const TO = iso(NOW)

const kase = (id, fields) => ({ caseId: id, contactKey: 'pl_aaaaaaaaaaaaaaaaaaaa', category: 'bug', status: 'new', source: 'portal', refs: {}, reopenCount: 0, resolutionCount: 0, ...fields })
const ev = (caseId, kind, at, data = null, visibility = 'public') => ({ caseId, kind, at: iso(at), data, visibility })

test('no data: rates and durations are null, counts are 0', () => {
  const m = computeSupportMetrics({ cases: [], events: [], incidents: [], activeMembers: null, from: FROM, to: TO, now: NOW })
  assert.equal(m.created, 0)
  assert.equal(m.firstResponse, null)
  assert.equal(m.resolution, null)
  assert.equal(m.reopen.rate, null)
  assert.equal(m.volumePerActiveMember, null)
  assert.equal(m.csat.responseRate, null)
  assert.equal(m.csat.positiveShare, null)
  assert.equal(m.repeatUsers.share, null)
  assert.equal(m.aging.oldestOpenAgeMs, null)
  assert.equal(m.incidents.count, 0)
  assert.deepEqual(m.categories, {})
  // active members known but zero is still "no denominator".
  assert.equal(computeSupportMetrics({ cases: [], events: [], incidents: [], activeMembers: 0, from: FROM, to: TO, now: NOW }).volumePerActiveMember, null)
  assert.throws(() => computeSupportMetrics({ from: TO, to: FROM, now: NOW }), /window/)
})

test('every §14 metric computed from cases and events only', () => {
  const c1 = NOW - 10 * DAY
  const c2 = NOW - 5 * DAY
  const c3 = NOW - 2 * DAY
  const c4 = NOW - 20 * HOUR
  const cases = [
    kase('c1', { contactKey: 'pl_1', category: 'access_entitlement', createdAt: iso(c1), status: 'closed', resolutionCount: 1, rootCause: 'webhook_delay' }),
    kase('c2', { contactKey: 'pl_1', category: 'vod_analysis', createdAt: iso(c2), status: 'reopened', reopenCount: 1, resolutionCount: 1, refs: { incidentId: 'inc_x' } }),
    kase('c3', { contactKey: 'pl_2', category: 'ubisoft_connection', createdAt: iso(c3), status: 'in_progress' }),
    kase('c4', { contactKey: 'pl_3', category: 'coaching_session', createdAt: iso(c4), status: 'new' }),
    kase('old', { contactKey: 'pl_4', category: 'bug', createdAt: iso(NOW - 60 * DAY), status: 'waiting_on_player' }),
  ]
  const events = [
    ev('c1', 'message_player', c1),
    ev('c1', 'message_staff', c1 + 2 * HOUR),
    ev('c1', 'message_staff', c1 + 5 * HOUR),
    ev('c1', 'status_change', c1 + 10 * HOUR, { from: 'in_progress', to: 'resolved' }),
    ev('c1', 'csat', c1 + 11 * HOUR, { rating: 5 }),
    ev('c2', 'message_staff', c2 + 4 * HOUR),
    ev('c2', 'note_private', c2 + 1 * HOUR, null, 'staff'),
    ev('c2', 'status_change', c2 + 30 * HOUR, { from: 'in_progress', to: 'resolved' }),
    ev('c2', 'status_change', c2 + 40 * HOUR, { from: 'resolved', to: 'reopened' }),
    ev('c3', 'message_staff', c3 + 6 * HOUR),
  ]
  const incidents = [
    { incidentId: 'inc_x', createdAt: iso(NOW - 6 * DAY), service: 'vod_processing', severity: 'sev2' },
    { incidentId: 'inc_old', createdAt: iso(NOW - 90 * DAY), service: 'auth', severity: 'sev3' },
  ]
  const m = computeSupportMetrics({ cases, events, incidents, activeMembers: 8, from: FROM, to: TO, now: NOW })

  assert.equal(m.created, 4, 'the 60-day-old case is outside the window')
  assert.equal(m.open.total, 4, 'open is as of now: reopened, in_progress, new, waiting')
  assert.deepEqual(m.open.byStatus, { reopened: 1, in_progress: 1, new: 1, waiting_on_player: 1 })
  assert.deepEqual(m.aging.buckets, { lt_1d: 1, d1_3: 1, d3_7: 1, d7_14: 0, gt_14d: 1 })
  assert.equal(m.aging.oldestOpenAgeMs, 60 * DAY)
  // First responses: 2h, 4h, 6h (c4 has none; note_private is not a response).
  assert.deepEqual(m.firstResponse, { count: 3, medianMs: 4 * HOUR, p90Ms: Math.round(5.6 * HOUR), meanMs: 4 * HOUR })
  assert.equal(m.awaitingFirstResponse, 1)
  // Resolution: first resolve event (10h, 30h).
  assert.deepEqual(m.resolution, { count: 2, medianMs: 20 * HOUR, p90Ms: 28 * HOUR, meanMs: 20 * HOUR })
  assert.deepEqual(m.reopen, { resolved: 2, reopened: 1, rate: 0.5 })
  assert.equal(m.volumePerActiveMember, 0.5)
  assert.deepEqual(m.categories, { access_entitlement: 1, vod_analysis: 1, ubisoft_connection: 1, coaching_session: 1 })
  assert.deepEqual(m.rootCauses, { webhook_delay: 1 })
  assert.deepEqual(m.issueCounts, { entitlement: 1, provider: 1, vod: 1, coaching: 1 })
  assert.equal(m.csat.eligible, 2)
  assert.equal(m.csat.responses, 1)
  assert.equal(m.csat.responseRate, 0.5)
  assert.equal(m.csat.distribution[5], 1)
  assert.equal(m.csat.positiveShare, 1)
  assert.deepEqual(m.repeatUsers, { count: 1, contacts: 3, share: 0.3333 })
  assert.equal(m.incidents.count, 1)
  assert.deepEqual(m.incidents.byService, { vod_processing: 1 })
  assert.equal(m.incidents.linkedCases, 1)
  assert.equal(m.incidents.perWeek, Math.round((1 / (30 / 7)) * 100) / 100)
})

test('the seeded fixture world produces metrics without errors', () => {
  const w = buildSupportCaseWorld(SUPPORT_NOW)
  const cases = w.items.filter((i) => i.type === 'CASE')
  const events = w.items.filter((i) => i.type === 'CEV')
  const m = computeSupportMetrics({ cases, events, incidents: w.incidents, activeMembers: 10, from: iso(SUPPORT_NOW - 60 * DAY), to: iso(SUPPORT_NOW), now: SUPPORT_NOW })
  assert.equal(m.created, cases.length)
  assert.equal(Object.values(m.categories).reduce((a, b) => a + b, 0), cases.length)
  assert.ok(m.firstResponse.count > 0)
})
