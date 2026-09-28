import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LIVE_SEASON, NEXT_SEASON, SEASON_LABEL, NEXT_SEASON_LABEL, liveClaimEndsAt, seasonStatus } from './season.js'

const live = { ...LIVE_SEASON, battlePassEndsOn: '2026-12-01' }
const at = (iso) => Date.parse(iso)

test('the live season is Operation Split Fire, consistent with r6-season.js', () => {
  assert.equal(LIVE_SEASON.code, 'Y11S3')
  assert.equal(LIVE_SEASON.name, 'Operation Split Fire')
  assert.equal(LIVE_SEASON.latestPatch, 'Y11S3.1')
  assert.equal(LIVE_SEASON.latestPatchOnLabel, 'September 22, 2026')
  assert.equal(SEASON_LABEL, 'Y11S3 · Operation Split Fire')
  assert.equal(NEXT_SEASON_LABEL, 'Y11S4')
  assert.doesNotMatch(SEASON_LABEL, /Y11S2|System Override/)
})

test('a next-season date is only ever an official timestamp, never a guess', () => {
  if (NEXT_SEASON.launchAt === null) return
  assert.ok(Number.isFinite(Date.parse(NEXT_SEASON.launchAt)), 'launchAt must be an ISO timestamp')
})

test('the config was valid on the day it was verified', () => {
  assert.notEqual(seasonStatus(at(`${LIVE_SEASON.verifiedOn}T12:00:00Z`)).state, 'hidden')
})

test('no announced date: live until the Battle Pass end date, then hidden', () => {
  const next = { code: 'Y11S4', launchAt: null }
  assert.equal(seasonStatus(at('2026-09-25T12:00:00Z'), live, next).state, 'live')
  assert.equal(seasonStatus(at('2026-11-30T23:59:59Z'), live, next).state, 'live')
  assert.equal(liveClaimEndsAt(live), at('2026-12-01T00:00:00Z'))
  assert.equal(seasonStatus(at('2026-12-01T00:00:00Z'), live, next).state, 'hidden')
  assert.equal(seasonStatus(at('2027-02-01T00:00:00Z'), live, next).state, 'hidden')
})

test('announced date: counts down to it, then hides once it passes', () => {
  const next = { code: 'Y11S4', launchAt: '2026-12-01T14:00:00Z' }
  const status = seasonStatus(at('2026-11-29T11:30:00Z'), live, next)
  assert.equal(status.state, 'countdown')
  assert.deepEqual([status.days, status.hours, status.minutes], [2, 2, 30])
  assert.equal(seasonStatus(at('2026-12-01T14:00:00Z'), live, next).state, 'hidden')
})
