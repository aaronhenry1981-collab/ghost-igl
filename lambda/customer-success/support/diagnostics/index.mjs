// Player Success diagnostics (ARCHITECTURE §7).
//
// buildDiagnostics() gathers the player's record once (PR #24 ctx.factsFor /
// assembleOne) and runs every provider independently: one failing source
// degrades only its own panel. Output is filtered for the audience:
//   view 'player' - only facts tagged player-safe, simplified text, the
//                   player's own actions; no inferences, no Recon actions,
//                   no staff-only panels, no identifiers.
//   view 'staff'  - everything, with billing identifiers only for
//                   billing/lead/admin (agents see `cus_…abcd`) and record /
//                   request / job ids only for engineering/lead/admin.
// A final pass scrubs anything secret-shaped (defence in depth).

import { assembleOne } from '../../data/assemble.mjs'
import { buildFacts } from '../../domain/facts.mjs'
import { deriveLifecycle } from '../../domain/lifecycle.mjs'
import { accountProvider } from './account.mjs'
import { coachingProvider } from './coaching.mjs'
import { connectionsProvider } from './connections.mjs'
import { desktopProvider } from './desktop.mjs'
import { entitlementProvider } from './entitlement.mjs'
import { incidentsProvider } from './incidents.mjs'
import { onboardingProvider } from './onboarding.mjs'
import { previousCasesProvider } from './previousCases.mjs'
import { replayProvider } from './replay.mjs'
import { canSeeBilling, canSeeEngineering, fact, normalizeRoles, panel, scrubSecrets } from './shared.mjs'
import { usageProvider } from './usage.mjs'
import { vodProvider } from './vod.mjs'

export const PROVIDERS = Object.freeze([
  { id: 'account', title: 'Account and login', run: accountProvider, player: true },
  { id: 'entitlement', title: 'Membership and access', run: entitlementProvider, player: true },
  { id: 'connections', title: 'Connected accounts and data', run: connectionsProvider, player: true },
  { id: 'vod', title: 'AI VOD review', run: vodProvider, player: true },
  { id: 'replay', title: 'Match replays', run: replayProvider, player: true },
  { id: 'coaching', title: 'Coaching', run: coachingProvider, player: true },
  { id: 'onboarding', title: 'Onboarding and activation', run: onboardingProvider, player: false },
  { id: 'usage', title: 'Feature usage', run: usageProvider, player: false },
  { id: 'desktop', title: 'Desktop client', run: desktopProvider, player: true },
  { id: 'incidents', title: 'Known incidents', run: incidentsProvider, player: false },
  { id: 'previousCases', title: 'Previous cases', run: previousCasesProvider, player: false },
])

// Signals the player-facing triage may use (no identifiers, no rule ids).
const PLAYER_SIGNALS = new Set([
  'signedIn', 'accountStatus', 'profileComplete', 'entitlementKnown', 'plan', 'hasAccess', 'billingStatus',
  'linkedPlatforms', 'platform', 'ubisoftLinked', 'trnLinked', 'vodIncluded', 'vodUsed', 'vodLimit', 'vodLastReviewAt',
  'coachingCredits', 'coachingCreditsKnown', 'replaySupported', 'desktopVersionKnown',
])

// Players see plain-language sources, never table or service names.
export function playerSourceLabel(source) {
  const s = String(source || '').toLowerCase()
  if (/subscription|membership|usage counter/.test(s)) return 'Your membership'
  if (/cognito|profile|session|account/.test(s)) return 'Your account'
  if (/snapshot|identit|provider/.test(s)) return 'Your connected accounts'
  if (/booking|coaching/.test(s)) return 'Your coaching bookings'
  if (/review history|player-events|vod/.test(s)) return 'Your review history'
  return 'Recon'
}

function filterItems(items, view, roles) {
  const out = []
  for (const item of Array.isArray(items) ? items : []) {
    const { vis = 'staff', masked, ...rest } = item || {}
    if (view === 'player') {
      if (vis === 'player') out.push('source' in rest ? { ...rest, source: playerSourceLabel(rest.source) } : rest)
      continue
    }
    if (vis === 'billing') {
      if (canSeeBilling(roles)) out.push(rest)
      else if (masked !== undefined) out.push({ ...rest, value: masked })
      continue
    }
    if (vis === 'engineering') {
      if (canSeeEngineering(roles)) out.push(rest)
      continue
    }
    out.push(rest)
  }
  return out
}

function shapePanel(draft, view, roles) {
  return {
    id: draft.id,
    title: draft.title,
    status: draft.status,
    facts: filterItems(draft.facts, view, roles),
    inferences: view === 'player' ? filterItems(draft.inferences.filter((i) => i.vis === 'player'), view, roles) : filterItems(draft.inferences, view, roles),
    actions: { user: [...(draft.actions?.user || [])], recon: view === 'player' ? [] : [...(draft.actions?.recon || [])] },
  }
}

// Record / request / job ids are for engineering, lead and admin only.
const RECORD_ID_KEYS = new Set(['snapshotId', 'lastReviewId', 'id', 'incidentId', 'eventId'])

function withoutRecordIds(value, depth = 0) {
  if (depth > 8) return null
  if (Array.isArray(value)) return value.map((item) => withoutRecordIds(item, depth + 1))
  if (value && typeof value === 'object') {
    const out = {}
    for (const [key, nested] of Object.entries(value)) if (!RECORD_ID_KEYS.has(key)) out[key] = withoutRecordIds(nested, depth + 1)
    return out
  }
  return value
}

async function gather({ ctx, identity, one, facts, now, view }) {
  if (one && facts) return { one, facts, lifecycle: deriveLifecycle(facts) }
  const withCognito = view === 'staff'
  const signedIn = identity?.signedIn !== false
  try {
    if (!one && typeof ctx?.factsFor === 'function') {
      const r = await ctx.factsFor(identity, { withCognito, signedIn })
      return { one: r.one, facts: facts || r.facts, lifecycle: r.lifecycle || deriveLifecycle(facts || r.facts) }
    }
    if (!one && ctx?.tables) {
      const assembled = await assembleOne({ tables: ctx.tables, store: ctx.store, email: identity.email, sub: identity.sub || null, signedIn, isAdmin: identity.isAdmin === true, withCognito, log: ctx.log })
      const built = facts || buildFacts({ now, catalog: ctx.catalog, config: ctx.config || {}, identity: { ...assembled.identity, signedIn }, sources: assembled.sources })
      return { one: assembled, facts: built, lifecycle: deriveLifecycle(built) }
    }
    if (one && !facts) {
      const built = buildFacts({ now, catalog: ctx?.catalog, config: ctx?.config || {}, identity: { ...one.identity, signedIn }, sources: one.sources })
      return { one, facts: built, lifecycle: deriveLifecycle(built) }
    }
  } catch (err) {
    ctx?.log?.warn?.('support_diagnostics_gather_failed', { error: err?.name || 'Error' })
  }
  return { one: one || null, facts: facts || null, lifecycle: facts ? deriveLifecycle(facts) : null }
}

// `playerData` ({ snapshots, identities, providerHealth }, each
// { status, data }) is the player-data history already read by the caller.
// The support service passes it as plain data because engines never get
// table handles; without it the connections provider reads ctx.tables.
export async function buildDiagnostics({ ctx = {}, identity = {}, one = null, facts = null, now, view = 'player', roles = [], incidents = [], cases = [], category = null, caseId = null, playerData = null } = {}) {
  const nowMs = Number.isFinite(now) ? now : typeof ctx?.now === 'function' ? ctx.now() : Date.now()
  const audience = view === 'staff' ? 'staff' : 'player'
  const roleSet = normalizeRoles(roles)
  const record = await gather({ ctx, identity, one, facts, now: nowMs, view: audience })
  const who = { ...identity, reconPlayerId: identity?.reconPlayerId || record.one?.identity?.reconPlayerId || record.facts?.identity?.reconPlayerId || null }
  const input = { ctx, identity: who, one: record.one, facts: record.facts, lifecycle: record.lifecycle, now: nowMs, roles: [...roleSet], incidents, cases, category, currentCaseId: caseId, playerData }

  const selected = PROVIDERS.filter((p) => audience === 'staff' || p.player)
  const drafts = await Promise.all(selected.map(async (p) => {
    try {
      const result = await p.run(input)
      return result && result.id ? result : panel(p.id, p.title, 'unavailable', { facts: [fact(p.title, 'could not be checked right now', 'diagnostics', null, 'player')] })
    } catch (err) {
      ctx?.log?.warn?.('support_diagnostics_provider_failed', { provider: p.id, error: err?.name || 'Error' })
      return panel(p.id, p.title, 'unavailable', { facts: [fact(p.title, 'could not be checked right now', 'diagnostics', null, 'player')] })
    }
  }))

  const signals = {}
  for (const d of drafts) Object.assign(signals, d.signals || {})
  const outSignals = audience === 'player' ? Object.fromEntries(Object.entries(signals).filter(([key]) => PLAYER_SIGNALS.has(key))) : signals

  const result = {
    view: audience,
    panels: drafts.map((d) => shapePanel(d, audience, roleSet)),
    signals: outSignals,
    observedAt: new Date(nowMs).toISOString(),
  }
  if (audience === 'staff') {
    const context = {}
    for (const d of drafts) if (d.context) Object.assign(context, d.context)
    result.context = canSeeEngineering(roleSet) ? context : withoutRecordIds(context)
  }
  return scrubSecrets(result)
}
