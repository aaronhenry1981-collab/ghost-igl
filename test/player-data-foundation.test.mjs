import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  assertNoCredentialFields,
  createPlayerDataProvider,
  getLatestVerifiedRank,
  reconPlayerIdFor,
  selectCanonicalObservation,
  validateProvenance,
} from '../lambda/player-data/core.mjs'

const NOW = Date.parse('2026-09-11T21:00:00.000Z')

function observation(overrides = {}) {
  return {
    field_name: 'rank',
    value: 'Gold II',
    source: 'manual',
    captured_at: '2026-09-11T20:30:00.000Z',
    confidence: 0.5,
    verification: 'player_reported',
    visibility: 'private',
    ...overrides,
  }
}

test('recon player IDs are stable and do not depend on email or username', () => {
  const first = reconPlayerIdFor('cognito-sub-123')
  const again = reconPlayerIdFor('cognito-sub-123')
  const other = reconPlayerIdFor('cognito-sub-456')
  assert.equal(first, again)
  assert.match(first, /^RP-[a-f0-9]{24}$/)
  assert.notEqual(first, other)
})

test('credential-like fields are rejected recursively without blocking gameplay session IDs', () => {
  assert.throws(
    () => assertNoCredentialFields({ provider: 'trn', auth: { password: 'do-not-store-this' } }),
    /Credential-like field is not accepted/,
  )
  assert.throws(
    () => assertNoCredentialFields({ metadata: { refresh_token: 'do-not-store-this' } }),
    /Credential-like field is not accepted/,
  )
  assert.throws(
    () => assertNoCredentialFields({ metadata: { session_token: 'do-not-store-this' } }),
    /Credential-like field is not accepted/,
  )
  assert.doesNotThrow(() => assertNoCredentialFields({ provider: 'trn', username: 'player-name' }))
  assert.doesNotThrow(() => assertNoCredentialFields({ session_id: 'match-session-123', session: { map: 'Clubhouse' } }))
})

test('fresh official Ubisoft rank wins over fresh TRN rank', () => {
  const canonical = selectCanonicalObservation([
    observation({ source: 'trn', value: 'Gold I', verification: 'verified_external', confidence: 0.95 }),
    observation({ source: 'ubisoft', value: 'Platinum V', verification: 'official', confidence: 1 }),
  ], 'rank', NOW)
  assert.equal(canonical.source, 'ubisoft')
  assert.equal(canonical.value, 'Platinum V')
})

test('fresh lower-priority rank can replace stale official data without deleting the conflict', () => {
  const observations = [
    observation({
      source: 'ubisoft',
      value: 'Gold II',
      verification: 'official',
      confidence: 1,
      captured_at: '2026-09-08T20:30:00.000Z',
    }),
    observation({
      source: 'trn',
      value: 'Gold I',
      verification: 'verified_external',
      confidence: 0.95,
      captured_at: '2026-09-11T19:00:00.000Z',
    }),
  ]
  const canonical = selectCanonicalObservation(observations, 'rank', NOW)
  assert.equal(observations.length, 2)
  assert.equal(canonical.source, 'trn')
  assert.equal(canonical.value, 'Gold I')
})

test('replay-derived factual gameplay metrics outrank VOD and manual estimates', () => {
  const canonical = selectCanonicalObservation([
    observation({ field_name: 'opening_death_rate', source: 'manual', value: 0.3 }),
    observation({ field_name: 'opening_death_rate', source: 'vod', value: 0.24, verification: 'ai_derived', confidence: 0.8 }),
    observation({ field_name: 'opening_death_rate', source: 'replay', value: 0.19, verification: 'replay_derived', confidence: 0.98 }),
  ], 'opening_death_rate', NOW)
  assert.equal(canonical.source, 'replay')
  assert.equal(canonical.value, 0.19)
})

test('getLatestVerifiedRank uses the same provider-independent canonical selector', () => {
  const canonical = getLatestVerifiedRank([
    observation({ source: 'trn', value: 'Gold I', verification: 'verified_external', confidence: 0.9 }),
    observation({ source: 'ubisoft', value: 'Platinum V', verification: 'official', confidence: 1 }),
  ], NOW)
  assert.equal(canonical.value, 'Platinum V')
})

test('provenance validation normalizes timestamps and accepts trusted client observations', () => {
  const provenance = validateProvenance({
    source: 'desktop',
    captured_at: '2026-09-11T20:00:00-04:00',
    season: 'Y11S3',
    confidence: 0.98765,
    verification: 'client_observed',
    visibility: 'coach',
  })
  assert.equal(provenance.captured_at, '2026-09-12T00:00:00.000Z')
  assert.equal(provenance.confidence, 0.988)
  assert.throws(() => validateProvenance({ source: 'replay', confidence: 1.5 }), /between 0 and 1/)
})

test('provider adapters require a health check and reject vendor-specific interface drift', () => {
  const adapter = createPlayerDataProvider('ubisoft', {
    healthCheck: async () => ({ ok: true }),
    fetchRank: async () => ({ rank: 'Gold II' }),
  })
  assert.equal(adapter.id, 'ubisoft')
  assert.throws(() => createPlayerDataProvider('trn', {}), /must implement healthCheck/)
  assert.throws(() => createPlayerDataProvider('trn', { healthCheck: async () => ({}), scrapePassword: () => {} }), /Unsupported provider method/)
})

test('TRN, coaching, VOD, and Road to Champion use the IAM-only player-data ingestion contract', () => {
  const producers = [
    '../lambda/trn/index.mjs',
    '../lambda/coaching-sync/index.mjs',
    '../lambda/vod/index.mjs',
    '../lambda/climb-progress/index.mjs',
  ]
  for (const path of producers) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8')
    assert.match(source, /PLAYER_DATA_INGEST_FUNCTION/)
    assert.match(source, /recon\.player-data-provider/)
    assert.match(source, /action:\s*'ingest_bundle'/)
    assert.match(source, /InvocationType:\s*'Event'/)
  }
})

test('trusted ingestion has no public HTTP route and requires the provider event envelope', () => {
  const source = readFileSync(new URL('../lambda/player-data/trusted-ingest.mjs', import.meta.url), 'utf8')
  const template = readFileSync(new URL('../aws/player-data-template.yaml', import.meta.url), 'utf8')
  assert.match(source, /event\?\.source !== 'recon\.player-data-provider'/)
  assert.match(source, /event\?\.detail\?\.action !== 'ingest_bundle'/)
  assert.match(template, /TrustedIngestFunction:/)
  assert.doesNotMatch(template.split('TrustedIngestFunction:')[1], /Type:\s*HttpApi/)
})
