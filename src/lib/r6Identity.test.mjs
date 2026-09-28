import assert from 'node:assert/strict'
import test from 'node:test'
import {
  describeRankEvidence,
  normalizeR6Platform,
  resolveR6TrackerIdentity,
  r6TrackerProfileUrl,
} from './r6Identity.js'

test('normalizes every platform value already stored by Recon6', () => {
  assert.equal(normalizeR6Platform('PlayStation'), 'psn')
  assert.equal(normalizeR6Platform('PS5'), 'psn')
  assert.equal(normalizeR6Platform('Xbox Live'), 'xbl')
  assert.equal(normalizeR6Platform('PC'), 'ubi')
})

test('uses exact gamer ID and never guesses from friendly display name', () => {
  assert.deepEqual(
    resolveR6TrackerIdentity({ gamer_id: 'Splinter2581', platform: 'PlayStation', display_name: 'Aaron' }),
    { handle: 'Splinter2581', platform: 'psn', source: 'account-gamer-id' },
  )
  assert.equal(resolveR6TrackerIdentity({ display_name: 'Aaron', platform: 'PlayStation' }), null)
})

test('uses Ubisoft username as an explicit PC identity fallback', () => {
  assert.deepEqual(
    resolveR6TrackerIdentity({ game_profiles: { r6: { ubisoft_username: 'Ubi.Player' } } }),
    { handle: 'Ubi.Player', platform: 'ubi', source: 'ubisoft-username' },
  )
})

test('builds an encoded exact-profile link', () => {
  assert.equal(
    r6TrackerProfileUrl({ handle: 'Player Name', platform: 'PlayStation' }),
    'https://r6.tracker.network/r6siege/profile/psn/Player%20Name/overview',
  )
})

test('marks screenshot evidence stale after 24 hours, an identity change, or missing identity binding', () => {
  const now = Date.parse('2026-09-11T12:00:00Z')
  const current = describeRankEvidence({
    rank: 'Emerald 3', confirmed_at: '2026-09-11T06:00:00Z', source: 'user-confirmed-screenshot',
    player_handle: 'Splinter2581', platform: 'psn',
  }, { handle: 'Splinter2581', platform: 'psn' }, now)
  assert.equal(current.stale, false)
  assert.equal(current.identityMatch, true)

  const changedPlayer = describeRankEvidence({
    rank: 'Emerald 3', confirmed_at: '2026-09-11T06:00:00Z',
    player_handle: 'SomeoneElse', platform: 'psn',
  }, { handle: 'Splinter2581', platform: 'psn' }, now)
  assert.equal(changedPlayer.stale, true)
  assert.equal(changedPlayer.identityMatch, false)

  const unboundLegacySnapshot = describeRankEvidence({
    rank: 'Emerald 3', confirmed_at: '2026-09-11T06:00:00Z',
  }, { handle: 'Splinter2581', platform: 'psn' }, now)
  assert.equal(unboundLegacySnapshot.stale, true)
  assert.equal(unboundLegacySnapshot.identityMatch, null)
})
