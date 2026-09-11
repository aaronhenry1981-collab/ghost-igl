import { createHash } from 'node:crypto'

export const PROVIDER_IDS = Object.freeze([
  'ubisoft',
  'trn',
  'psn',
  'xbox',
  'replay',
  'vod',
  'desktop',
  'coach',
  'manual',
])

export const FRESHNESS_STATES = Object.freeze([
  'current',
  'recently_refreshed',
  'stale',
  'historical',
  'unavailable',
  'provider_error',
  'unverified',
])

export const VERIFICATION_LEVELS = Object.freeze([
  'official',
  'verified_external',
  'replay_derived',
  'coach_verified',
  'ai_derived',
  'player_reported',
  'unverified',
])

export const VISIBILITY_LEVELS = Object.freeze([
  'private',
  'coach',
  'squad',
  'team_recon',
  'public',
  'anonymized_analytics',
])

const DEFAULT_SOURCE_PRIORITY = Object.freeze([
  'ubisoft',
  'psn',
  'xbox',
  'trn',
  'replay',
  'desktop',
  'vod',
  'coach',
  'manual',
])

const FIELD_SOURCE_PRIORITY = Object.freeze({
  rank: ['ubisoft', 'trn', 'psn', 'xbox', 'replay', 'desktop', 'vod', 'coach', 'manual'],
  peak_rank: ['ubisoft', 'trn', 'replay', 'desktop', 'vod', 'coach', 'manual'],
  rp: ['ubisoft', 'trn', 'replay', 'desktop', 'vod', 'coach', 'manual'],
  mmr: ['ubisoft', 'trn', 'replay', 'desktop', 'vod', 'coach', 'manual'],
  kd: ['ubisoft', 'trn', 'replay', 'desktop', 'vod', 'coach', 'manual'],
  win_rate: ['ubisoft', 'trn', 'replay', 'desktop', 'vod', 'coach', 'manual'],
  matches_played: ['ubisoft', 'trn', 'replay', 'desktop', 'vod', 'coach', 'manual'],
  opening_deaths: ['replay', 'vod', 'desktop', 'ubisoft', 'trn', 'coach', 'manual'],
  opening_death_rate: ['replay', 'vod', 'desktop', 'ubisoft', 'trn', 'coach', 'manual'],
  entry_success: ['replay', 'vod', 'desktop', 'ubisoft', 'trn', 'coach', 'manual'],
  trades: ['replay', 'vod', 'desktop', 'ubisoft', 'trn', 'coach', 'manual'],
  survival: ['replay', 'vod', 'desktop', 'ubisoft', 'trn', 'coach', 'manual'],
  plants: ['replay', 'vod', 'desktop', 'ubisoft', 'trn', 'coach', 'manual'],
  clutch_rate: ['replay', 'vod', 'desktop', 'ubisoft', 'trn', 'coach', 'manual'],
  utility_efficiency: ['replay', 'vod', 'desktop', 'coach', 'manual'],
  drone_usage: ['replay', 'vod', 'desktop', 'coach', 'manual'],
  intel_generation: ['replay', 'vod', 'desktop', 'coach', 'manual'],
  positioning_pattern: ['vod', 'coach', 'replay', 'desktop', 'manual'],
  roam_pattern: ['vod', 'coach', 'replay', 'desktop', 'manual'],
  objective_contribution: ['replay', 'vod', 'desktop', 'coach', 'manual'],
  identified_strength: ['coach', 'vod', 'replay', 'desktop', 'manual'],
  identified_weakness: ['coach', 'vod', 'replay', 'desktop', 'manual'],
})

const VERIFICATION_PRIORITY = Object.freeze([
  'official',
  'verified_external',
  'replay_derived',
  'coach_verified',
  'ai_derived',
  'player_reported',
  'unverified',
])

const CREDENTIAL_KEY_PATTERN = /(?:^|_)(?:password|passwd|secret|token|cookie|session|authorization|credential|credentials|api[_-]?key|access[_-]?key|refresh[_-]?token)(?:$|_)/i
const SAFE_FIELD_PATTERN = /^[a-z][a-z0-9_]{0,63}$/

function rankIn(order, value) {
  const index = order.indexOf(value)
  return index === -1 ? order.length + 1 : index
}

export function reconPlayerIdFor(ownerUserId) {
  const value = String(ownerUserId || '').trim()
  if (!value) throw new Error('ownerUserId is required')
  const digest = createHash('sha256')
    .update(`recon-player:v1:${value}`)
    .digest('hex')
    .slice(0, 24)
  return `RP-${digest}`
}

export function validateFieldName(fieldName) {
  const value = String(fieldName || '').trim()
  if (!SAFE_FIELD_PATTERN.test(value)) {
    throw new Error(`Invalid player data field: ${value || '<empty>'}`)
  }
  return value
}

export function assertNoCredentialFields(value, path = 'payload') {
  if (value == null) return
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoCredentialFields(item, `${path}[${index}]`))
    return
  }
  if (typeof value !== 'object') return

  for (const [key, nested] of Object.entries(value)) {
    if (CREDENTIAL_KEY_PATTERN.test(key)) {
      throw new Error(`Credential-like field is not accepted: ${path}.${key}`)
    }
    assertNoCredentialFields(nested, `${path}.${key}`)
  }
}

export function normalizeConfidence(value, fallback = 0.5) {
  const confidence = value == null ? fallback : Number(value)
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new Error('confidence must be a number between 0 and 1')
  }
  return Math.round(confidence * 1000) / 1000
}

export function normalizeCapturedAt(value) {
  const parsed = value ? new Date(value) : new Date()
  if (Number.isNaN(parsed.getTime())) throw new Error('captured_at must be a valid date')
  return parsed.toISOString()
}

export function sourcePriorityForField(fieldName) {
  return FIELD_SOURCE_PRIORITY[fieldName] || DEFAULT_SOURCE_PRIORITY
}

export function computeFreshness(observation, now = Date.now()) {
  const explicit = observation?.freshness_state
  if (explicit === 'unavailable' || explicit === 'provider_error' || explicit === 'historical') {
    return explicit
  }

  if (observation?.verification === 'unverified' && !observation?.captured_at) return 'unverified'

  const captured = Date.parse(observation?.captured_at || '')
  if (!Number.isFinite(captured)) return 'unverified'

  const freshUntil = Date.parse(observation?.fresh_until || '')
  if (Number.isFinite(freshUntil) && freshUntil < now) return 'stale'

  const ageMs = Math.max(0, now - captured)
  if (ageMs <= 60 * 60 * 1000) return 'current'
  if (ageMs <= 24 * 60 * 60 * 1000) return 'recently_refreshed'
  return 'stale'
}

export function validateProvenance(input = {}) {
  const provider = String(input.source || input.provider || '').trim().toLowerCase()
  if (!PROVIDER_IDS.includes(provider)) throw new Error(`Unsupported player data provider: ${provider || '<empty>'}`)

  const verification = String(input.verification || 'unverified').trim().toLowerCase()
  if (!VERIFICATION_LEVELS.includes(verification)) throw new Error(`Unsupported verification level: ${verification}`)

  const visibility = String(input.visibility || 'private').trim().toLowerCase()
  if (!VISIBILITY_LEVELS.includes(visibility)) throw new Error(`Unsupported visibility level: ${visibility}`)

  const capturedAt = normalizeCapturedAt(input.captured_at)
  const season = input.season == null ? null : String(input.season).trim().slice(0, 40) || null
  const freshUntil = input.fresh_until == null ? null : normalizeCapturedAt(input.fresh_until)

  return {
    source: provider,
    captured_at: capturedAt,
    season,
    confidence: normalizeConfidence(input.confidence),
    verification,
    visibility,
    fresh_until: freshUntil,
  }
}

export function selectCanonicalObservation(observations, fieldName, now = Date.now()) {
  const field = validateFieldName(fieldName)
  const candidates = (Array.isArray(observations) ? observations : [])
    .filter((item) => item && item.field_name === field)
    .map((item) => ({ ...item, freshness_state: computeFreshness(item, now) }))
    .filter((item) => !['unavailable', 'provider_error'].includes(item.freshness_state))

  if (!candidates.length) return null

  const fresh = candidates.filter((item) => ['current', 'recently_refreshed'].includes(item.freshness_state))
  const pool = fresh.length ? fresh : candidates
  const sourceOrder = sourcePriorityForField(field)

  pool.sort((a, b) => {
    const bySource = rankIn(sourceOrder, a.source) - rankIn(sourceOrder, b.source)
    if (bySource !== 0) return bySource

    const byVerification = rankIn(VERIFICATION_PRIORITY, a.verification) - rankIn(VERIFICATION_PRIORITY, b.verification)
    if (byVerification !== 0) return byVerification

    const byConfidence = Number(b.confidence || 0) - Number(a.confidence || 0)
    if (byConfidence !== 0) return byConfidence

    return Date.parse(b.captured_at || 0) - Date.parse(a.captured_at || 0)
  })

  return pool[0]
}

export function getLatestVerifiedRank(observations, now = Date.now()) {
  return selectCanonicalObservation(observations, 'rank', now)
}

export function createPlayerDataProvider(providerId, implementation = {}) {
  const provider = String(providerId || '').trim().toLowerCase()
  if (!PROVIDER_IDS.includes(provider)) throw new Error(`Unsupported player data provider: ${provider || '<empty>'}`)
  if (typeof implementation.healthCheck !== 'function') {
    throw new Error(`Provider ${provider} must implement healthCheck()`)
  }

  const supportedMethods = [
    'resolveIdentity',
    'fetchCurrentProfile',
    'fetchCurrentSeason',
    'fetchRank',
    'fetchMatchSummary',
    'fetchOperatorStats',
    'fetchRecentMatches',
    'fetchPlatformMetadata',
    'fetchAvailableHistory',
    'verifyIdentity',
    'healthCheck',
  ]

  for (const key of Object.keys(implementation)) {
    if (!supportedMethods.includes(key)) throw new Error(`Unsupported provider method: ${key}`)
    if (typeof implementation[key] !== 'function') throw new Error(`Provider method ${key} must be a function`)
  }

  return Object.freeze({ id: provider, ...implementation })
}
