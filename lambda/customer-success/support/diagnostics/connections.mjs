// Connection health per data source (ARCHITECTURE §7.3) and rank/stat
// discrepancy context.
//
// Built only from what player-data really records:
//   recon-player-snapshots      newest snapshot per source (captured_at =
//                               observed, created_at = fetched/ingested)
//   recon-player-identities     which providers are linked (player_reported
//                               unless an admin verified them)
//   recon-player-provider-health  GLOBAL provider status (not per player)
// Per-player sync attempts and error classes are NOT recorded, so
// `lastAttemptAt` is always null with a "not recorded per player" note.
//
// Freshness uses player-data `computeFreshness` thresholds
// (lambda/player-data/core.mjs): <= 1 h "current", <= 24 h
// "recently_refreshed", otherwise "stale" (or `fresh_until` passed). Mapped:
//   current -> fresh, recently_refreshed -> aging, stale -> stale,
//   no snapshot / unparseable time -> unknown.

import { fact, inference, isoOrNull, NOT_RECORDED, panel, toMs } from './shared.mjs'

export const CONNECTION_SOURCES = Object.freeze(['ubisoft', 'psn', 'xbox', 'trn', 'replay', 'vod', 'desktop'])
const IDENTITY_SOURCES = new Set(['ubisoft', 'psn', 'xbox', 'trn'])
const HOUR = 3600000
const DAY = 24 * HOUR
const FAILING = new Set(['down', 'auth_failed', 'schema_changed'])
const IMPAIRED = new Set(['degraded', 'rate_limited'])

export const FRESHNESS_RULES = Object.freeze({ freshMaxMs: HOUR, agingMaxMs: DAY, basis: 'lambda/player-data/core.mjs computeFreshness' })

export function freshnessOf(snapshot, now = Date.now()) {
  if (!snapshot) return 'unknown'
  const captured = toMs(snapshot.captured_at)
  if (!Number.isFinite(captured)) return 'unknown'
  const freshUntil = toMs(snapshot.fresh_until)
  if (Number.isFinite(freshUntil) && freshUntil < now) return 'stale'
  const age = Math.max(0, now - captured)
  if (age <= FRESHNESS_RULES.freshMaxMs) return 'fresh'
  if (age <= FRESHNESS_RULES.agingMaxMs) return 'aging'
  return 'stale'
}

function newestBySource(snapshots) {
  const out = new Map()
  for (const snap of Array.isArray(snapshots) ? snapshots : []) {
    if (!snap?.source) continue
    const current = out.get(snap.source)
    if (!current || String(snap.captured_at || '') > String(current.captured_at || '')) out.set(snap.source, snap)
  }
  return out
}

function platformNeeds(source, platform) {
  const p = String(platform || '').toLowerCase()
  if (source === 'ubisoft') return true
  if (source === 'psn') return /ps|playstation/.test(p)
  if (source === 'xbox') return /xbox/.test(p)
  return false
}

export function connectionHealth({ snapshots = [], identities = null, providerHealth = null, now = Date.now(), platform = null } = {}) {
  const newest = newestBySource(snapshots)
  const linkedSet = Array.isArray(identities) ? new Set(identities.map((i) => String(i?.provider || '').toLowerCase())) : null
  const health = new Map((Array.isArray(providerHealth) ? providerHealth : []).map((h) => [String(h.provider || '').toLowerCase(), h]))

  return CONNECTION_SOURCES.map((source) => {
    const snap = newest.get(source) || null
    const notes = ['lastAttemptAt / per-player errors: not recorded per player']
    const g = health.get(source) || null
    const globalStatus = g ? String(g.status || '').toLowerCase() : null
    const errorClass = globalStatus && globalStatus !== 'healthy' ? `global_${globalStatus}` : null
    if (errorClass) notes.push(`Global provider status "${globalStatus}" observed ${isoOrNull(g.observed_at) || 'at an unknown time'} (applies to every player, not this one specifically)`)
    if (!Array.isArray(providerHealth)) notes.push('Provider health could not be read')

    let linked = null
    if (IDENTITY_SOURCES.has(source)) {
      if (linkedSet) linked = linkedSet.has(source)
      else notes.push('Identity links could not be read')
    } else if (source === 'replay') {
      notes.push('No replay upload system exists in Recon today')
    } else if (source === 'desktop') {
      notes.push('Desktop client activation and version are not recorded')
    } else if (source === 'vod') {
      notes.push('VOD review results reach player-data as vod_analysis snapshots')
    }
    const identity = linkedSet && Array.isArray(identities) ? identities.find((i) => String(i?.provider || '').toLowerCase() === source) : null
    if (identity && identity.verified !== true) notes.push('Link is player-reported (not verified)')

    const freshness = freshnessOf(snap, now)
    const providerOk = !globalStatus || globalStatus === 'healthy'
    const retryEligible = linked === true && providerOk && freshness !== 'fresh'
    const userActionRequired = IDENTITY_SOURCES.has(source) && linked === false && platformNeeds(source, platform)
    const reconActionRequired = Boolean(globalStatus && FAILING.has(globalStatus))
    if (globalStatus && IMPAIRED.has(globalStatus)) notes.push('Provider impaired globally; retry later rather than per player')

    return {
      source,
      linked,
      lastSuccessAt: snap ? isoOrNull(snap.created_at) || isoOrNull(snap.captured_at) : null,
      observedAt: snap ? isoOrNull(snap.captured_at) : null,
      lastAttemptAt: null,
      errorClass,
      freshness,
      retryEligible,
      userActionRequired,
      reconActionRequired,
      snapshotId: snap?.snapshot_id || null,
      notes,
    }
  })
}

// ---- rank / stat discrepancy context --------------------------------------------

// Siege seasons have started in early March, June, September and December.
// Used ONLY as a weak fallback when snapshots carry no season field.
const SEASON_START_MONTHS = [2, 5, 8, 11] // 0-based: Mar, Jun, Sep, Dec
const ROLLOVER_WINDOW_DAYS = 21

function inRolloverWindow(ms) {
  const d = new Date(ms)
  return SEASON_START_MONTHS.includes(d.getUTCMonth()) && d.getUTCDate() <= ROLLOVER_WINDOW_DAYS
}

function hasRankField(snap) {
  const f = snap?.fields
  return Boolean(f && typeof f === 'object' && (f.rank !== undefined || f.rp !== undefined || f.mmr !== undefined || f.kd !== undefined))
}

export function rankDiscrepancyContext({ snapshots = [], now = Date.now() } = {}) {
  const list = (Array.isArray(snapshots) ? snapshots : []).filter((s) => s && Number.isFinite(toMs(s.captured_at)))
    .sort((a, b) => toMs(b.captured_at) - toMs(a.captured_at))
  const bySource = [...newestBySource(list).values()].map((s) => ({
    source: s.source,
    observedAt: isoOrNull(s.captured_at),
    fetchedAt: isoOrNull(s.created_at),
    season: s.season || null,
    verification: s.verification || null,
    freshness: freshnessOf(s, now),
    kind: 'fact',
  }))
  const rankSnaps = list.filter(hasRankField)
  const latest = rankSnaps[0] || list[0] || null
  const seasons = [...new Set(list.map((s) => s.season).filter(Boolean))]

  const history = {
    kind: 'fact',
    snapshots: list.length,
    withStatFields: rankSnaps.length,
    oldestAt: list.length ? isoOrNull(list[list.length - 1].captured_at) : null,
    newestAt: list.length ? isoOrNull(list[0].captured_at) : null,
    seasons,
    state: list.length === 0 ? 'none' : list.length === 1 ? 'single' : 'multiple',
  }

  // Season rollover (inference).
  let seasonRollover = { kind: 'inference', suspected: false, basis: 'no season change seen', confidence: 0.2 }
  const seasoned = rankSnaps.filter((s) => s.season)
  if (seasoned.length >= 2 && seasoned[0].season !== seasoned[1].season) {
    seasonRollover = { kind: 'inference', suspected: true, basis: `season field changed from "${seasoned[1].season}" to "${seasoned[0].season}" between the two newest stat snapshots`, confidence: 0.8 }
  } else if (latest && latest.season && seasons.length === 1 && inRolloverWindow(now) && !inRolloverWindow(toMs(latest.captured_at))) {
    seasonRollover = { kind: 'inference', suspected: true, basis: `newest stat snapshot (season "${latest.season}") predates the current season-start window`, confidence: 0.4 }
  } else if (!seasoned.length && inRolloverWindow(now)) {
    seasonRollover = { kind: 'inference', suspected: true, basis: `date window only: now is within ${ROLLOVER_WINDOW_DAYS} days of a typical season start (approximate; snapshots carry no season field)`, confidence: 0.25 }
  }

  // Classification (inference).
  let classification
  if (!latest) {
    classification = { value: 'undetermined', basis: 'Recon has no snapshot history for this player', confidence: 0.2 }
  } else {
    const fresh = freshnessOf(latest, now)
    const selfReported = ['manual'].includes(latest.source) || ['player_reported', 'unverified'].includes(latest.verification)
    if (seasonRollover.suspected && seasonRollover.confidence >= 0.4) {
      classification = { value: 'external_data_freshness', basis: 'likely season rollover: ranks reset or re-placed at the source', confidence: 0.6 }
    } else if (fresh === 'stale' || fresh === 'unknown') {
      classification = { value: 'external_data_freshness', basis: `newest ${latest.source} snapshot is ${fresh} (observed ${isoOrNull(latest.captured_at)})`, confidence: 0.6 }
    } else if (selfReported) {
      classification = { value: 'external_data_freshness', basis: `newest value is ${latest.verification || 'self'}-reported (${latest.source}), not from a verified source`, confidence: 0.5 }
    } else {
      classification = { value: 'our_normalization', basis: `newest ${latest.source} snapshot is ${fresh} and ${latest.verification || 'unlabelled'}; a mismatch would come from how Recon selects or displays it`, confidence: 0.4 }
    }
  }

  return {
    dataSources: bySource,
    latestProvider: latest ? { kind: 'fact', source: latest.source, observedAt: isoOrNull(latest.captured_at), season: latest.season || null } : null,
    history,
    seasonRollover,
    classification: { kind: 'inference', ...classification },
    notes: ['Per-player sync attempts are not recorded; only successful snapshots exist.'],
  }
}

// ---- diagnostics provider ------------------------------------------------------

async function tryRead(fn) {
  if (typeof fn !== 'function') return { status: 'not_connected', data: null }
  try {
    return { status: 'ok', data: await fn() }
  } catch (err) {
    return { status: err?.name === 'NotConnectedError' ? 'not_connected' : 'unavailable', data: null }
  }
}

const SOURCE_LABEL = { ubisoft: 'Ubisoft', psn: 'PlayStation Network', xbox: 'Xbox', trn: 'Tracker Network', replay: 'Replays', vod: 'VOD reviews', desktop: 'Desktop client' }
const FRESH_TEXT = { fresh: 'updated in the last hour', aging: 'updated in the last day', stale: 'older than a day', unknown: 'no update recorded' }

const readResult = (r) => (r && typeof r === 'object' && ['ok', 'unavailable', 'not_connected'].includes(r.status) ? { status: r.status, data: r.status === 'ok' ? r.data ?? null : null } : null)

export async function connectionsProvider({ ctx, identity, facts, now, playerData = null }) {
  const tables = ctx?.tables || {}
  const rpid = identity?.reconPlayerId || facts?.identity?.reconPlayerId || null
  if (!rpid) {
    return panel('connections', 'Connected accounts and data', 'not_recorded', {
      facts: [fact('Recon player record', 'none yet for this login', 'recon-player-store', null, 'player')],
      signals: { linkedPlatforms: [], platform: facts?.identity?.platform || null },
    })
  }
  // Pre-read history (support service) wins; otherwise read the tables.
  const [snaps, ids, health] = await Promise.all([
    readResult(playerData?.snapshots) || tryRead(tables.playerSnapshots ? () => tables.playerSnapshots(rpid) : null),
    readResult(playerData?.identities) || tryRead(tables.playerIdentities ? () => tables.playerIdentities(rpid) : null),
    readResult(playerData?.providerHealth) || tryRead(tables.providerHealth ? () => tables.providerHealth() : null),
  ])
  if (snaps.status !== 'ok' && ids.status !== 'ok') {
    const status = snaps.status === 'unavailable' || ids.status === 'unavailable' ? 'unavailable' : 'not_connected'
    return panel('connections', 'Connected accounts and data', status, {
      facts: [fact('Connection history', status === 'unavailable' ? 'could not be read right now' : 'not connected in this deployment', 'recon-player-snapshots', null, 'player')],
      signals: { platform: facts?.identity?.platform || null },
    })
  }
  const platform = facts?.identity?.platform || null
  const entries = connectionHealth({
    snapshots: snaps.data || [],
    identities: ids.status === 'ok' ? ids.data || [] : null,
    providerHealth: health.status === 'ok' ? health.data || [] : null,
    now,
    platform,
  })
  const out = []
  const infs = []
  const user = []
  const recon = []
  for (const e of entries) {
    const label = SOURCE_LABEL[e.source]
    if (e.source === 'replay') {
      out.push(fact(label, 'not available in Recon today', 'product', null, 'player'))
      continue
    }
    if (e.source === 'desktop') {
      out.push(fact(label, 'activation and version are not recorded', 'product', null, 'player'))
      continue
    }
    const linkedText = e.linked === null ? '' : e.linked ? 'linked, ' : 'not linked, '
    const relevant = e.linked === true || e.lastSuccessAt || platformNeeds(e.source, platform)
    out.push(fact(label, `${linkedText}${FRESH_TEXT[e.freshness]}`, 'recon-player-snapshots / recon-player-identities', e.lastSuccessAt, relevant ? 'player' : 'staff'))
    out.push(fact(`${label} detail`, `last success ${e.lastSuccessAt || 'none'}; observed ${e.observedAt || 'n/a'}; last attempt ${NOT_RECORDED}; error class ${e.errorClass || 'none recorded'}; retry eligible ${e.retryEligible}`, 'recon-player-snapshots / recon-player-provider-health', e.lastSuccessAt))
    if (e.snapshotId) out.push(fact(`${label} snapshot id`, e.snapshotId, 'recon-player-snapshots', e.observedAt, 'engineering'))
    if (e.userActionRequired) user.push(`Link your ${label} account from your profile so we know which account to read.`)
    if (e.reconActionRequired && (e.linked === true || platformNeeds(e.source, platform))) {
      recon.push(`${label} is failing globally (${e.errorClass}). Link this case to the provider incident; do not troubleshoot per player.`)
      infs.push(inference(`${label} affected by a provider-wide failure`, e.errorClass, 'recon-player-provider-health newest observation', 0.7))
    }
  }
  if (health.status !== 'ok') out.push(fact('Provider health', health.status === 'unavailable' ? 'could not be read' : 'not connected', 'recon-player-provider-health', null))
  const rank = rankDiscrepancyContext({ snapshots: snaps.data || [], now })
  infs.push(inference('Rank/stat discrepancy classification', rank.classification.value, rank.classification.basis, rank.classification.confidence))
  if (rank.seasonRollover.suspected) infs.push(inference('Possible season rollover', 'suspected', rank.seasonRollover.basis, rank.seasonRollover.confidence))
  const linkedPlatforms = entries.filter((e) => ['ubisoft', 'psn', 'xbox'].includes(e.source) && e.linked === true).map((e) => e.source)
  const degraded = entries.some((e) => e.reconActionRequired && (e.linked === true || platformNeeds(e.source, platform))) || snaps.status !== 'ok' || ids.status !== 'ok'
  return panel('connections', 'Connected accounts and data', degraded ? 'degraded' : 'ok', {
    facts: out,
    inferences: infs,
    user,
    recon,
    signals: {
      linkedPlatforms,
      platform,
      ubisoftLinked: entries.find((e) => e.source === 'ubisoft')?.linked ?? null,
      trnLinked: entries.find((e) => e.source === 'trn')?.linked ?? null,
      globalProviderFailures: entries.filter((e) => e.reconActionRequired && (e.linked === true || platformNeeds(e.source, platform))).map((e) => e.source),
    },
    context: { connections: entries, rank },
  })
}
