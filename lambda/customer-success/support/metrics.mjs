// Support metrics (docs/player-success/ARCHITECTURE.md §14).
//
// Computed ONLY from stored case items, case events and incidents. Nothing is
// backfilled or estimated. Convention: a count with no matching items is 0
// (the store was read, and there were none); an average, median, rate or
// share with an empty denominator is null ("no data"), never 0.

import { isOpen } from './workflow.mjs'
import { CATEGORY_GROUPS } from './items.mjs'

const DAY = 86400000

export const AGING_BUCKETS = Object.freeze([
  { id: 'lt_1d', label: '< 1 day', maxMs: DAY },
  { id: 'd1_3', label: '1-3 days', maxMs: 3 * DAY },
  { id: 'd3_7', label: '3-7 days', maxMs: 7 * DAY },
  { id: 'd7_14', label: '7-14 days', maxMs: 14 * DAY },
  { id: 'gt_14d', label: '> 14 days', maxMs: Infinity },
])

const ms = (v) => {
  const n = Date.parse(v || '')
  return Number.isFinite(n) ? n : null
}

function quantile(sorted, q) {
  if (!sorted.length) return null
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo))
}

export function durationStats(values) {
  const list = values.filter((v) => Number.isFinite(v) && v >= 0).sort((a, b) => a - b)
  if (!list.length) return null
  return {
    count: list.length,
    medianMs: quantile(list, 0.5),
    p90Ms: quantile(list, 0.9),
    meanMs: Math.round(list.reduce((s, v) => s + v, 0) / list.length),
  }
}

const ratio = (num, den) => (den > 0 ? Math.round((num / den) * 10000) / 10000 : null)

function countBy(list, fn) {
  const out = {}
  for (const item of list) {
    const key = fn(item)
    if (key === null || key === undefined) continue
    out[key] = (out[key] || 0) + 1
  }
  return out
}

export function computeSupportMetrics({ cases = [], events = [], incidents = [], activeMembers = null, from, to, now }) {
  const fromMs = ms(from)
  const toMs = ms(to)
  if (fromMs === null || toMs === null || toMs < fromMs) throw new Error('metrics need a valid from <= to window')
  const inWindow = (v) => {
    const t = ms(v)
    return t !== null && t >= fromMs && t <= toMs
  }

  const eventsByCase = new Map()
  for (const e of events) {
    if (!eventsByCase.has(e.caseId)) eventsByCase.set(e.caseId, [])
    eventsByCase.get(e.caseId).push(e)
  }
  for (const list of eventsByCase.values()) list.sort((a, b) => String(a.at).localeCompare(String(b.at)))
  const eventsOf = (c) => eventsByCase.get(c.caseId) || []

  // ---- current open cases (as of now, regardless of window) -------------------
  const open = cases.filter((c) => isOpen(c.status))
  const aging = Object.fromEntries(AGING_BUCKETS.map((b) => [b.id, 0]))
  for (const c of open) {
    const age = now - (ms(c.createdAt) ?? now)
    const bucket = AGING_BUCKETS.find((b) => age < b.maxMs)
    aging[bucket.id] += 1
  }
  const oldestOpen = open.map((c) => ms(c.createdAt)).filter((v) => v !== null).sort((a, b) => a - b)[0]

  // ---- cases created in the window --------------------------------------------
  const created = cases.filter((c) => inWindow(c.createdAt))

  const firstResponses = []
  const resolutions = []
  let everResolved = 0
  let reopened = 0
  for (const c of created) {
    const evs = eventsOf(c)
    const created0 = ms(c.createdAt)
    const firstStaff = evs.find((e) => e.kind === 'message_staff' && e.visibility === 'public')
    if (firstStaff) firstResponses.push(ms(firstStaff.at) - created0)
    const firstResolve = evs.find((e) => e.kind === 'status_change' && e.data?.to === 'resolved')
    const resolvedAt = firstResolve ? ms(firstResolve.at) : null
    if (resolvedAt !== null) resolutions.push(resolvedAt - created0)
    const wasResolved = resolvedAt !== null || (c.resolutionCount || 0) > 0
    if (wasResolved) {
      everResolved += 1
      const wasReopened = (c.reopenCount || 0) > 0 || evs.some((e) => e.kind === 'status_change' && e.data?.to === 'reopened')
      if (wasReopened) reopened += 1
    }
  }

  // ---- CSAT (asked once per resolution) ----------------------------------------
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, up: 0, down: 0 }
  let responses = 0
  let positive = 0
  const respondedCases = new Set()
  for (const c of created) {
    for (const e of eventsOf(c).filter((x) => x.kind === 'csat')) {
      const rating = e.data?.rating
      if (distribution[rating] === undefined) continue
      distribution[rating] += 1
      responses += 1
      respondedCases.add(c.caseId)
      if (rating === 'up' || (typeof rating === 'number' && rating >= 4)) positive += 1
    }
  }

  // ---- repeat users --------------------------------------------------------------
  const perContact = countBy(created, (c) => c.contactKey)
  const contacts = Object.keys(perContact).length
  const repeat = Object.values(perContact).filter((n) => n >= 2).length

  // ---- incidents -------------------------------------------------------------------
  const windowIncidents = incidents.filter((i) => inWindow(i.createdAt))
  const weeks = (toMs - fromMs) / (7 * DAY)

  const resolvedInWindow = created.filter((c) => c.resolution || c.rootCause)

  return {
    window: { from: new Date(fromMs).toISOString(), to: new Date(toMs).toISOString() },
    generatedAt: new Date(now).toISOString(),
    basis: 'stored support cases, case events and incidents only',
    open: { total: open.length, byStatus: countBy(open, (c) => c.status) },
    aging: { buckets: aging, oldestOpenAgeMs: oldestOpen === undefined ? null : now - oldestOpen },
    created: created.length,
    firstResponse: durationStats(firstResponses),
    awaitingFirstResponse: created.filter((c) => !eventsOf(c).some((e) => e.kind === 'message_staff')).length,
    resolution: durationStats(resolutions),
    reopen: { resolved: everResolved, reopened, rate: ratio(reopened, everResolved) },
    volumePerActiveMember: Number.isFinite(activeMembers) && activeMembers > 0 ? ratio(created.length, activeMembers) : null,
    activeMembers: Number.isFinite(activeMembers) ? activeMembers : null,
    categories: countBy(created, (c) => c.category),
    intents: countBy(created, (c) => c.intent),
    sources: countBy(created, (c) => c.source),
    rootCauses: countBy(resolvedInWindow, (c) => c.rootCause || c.resolution?.code || null),
    issueCounts: {
      entitlement: created.filter((c) => CATEGORY_GROUPS.entitlement.includes(c.category)).length,
      provider: created.filter((c) => CATEGORY_GROUPS.provider.includes(c.category)).length,
      vod: created.filter((c) => CATEGORY_GROUPS.vod.includes(c.category)).length,
      coaching: created.filter((c) => CATEGORY_GROUPS.coaching.includes(c.category)).length,
    },
    csat: {
      eligible: everResolved,
      responses,
      responseRate: ratio(respondedCases.size, everResolved),
      distribution,
      positiveShare: ratio(positive, responses),
    },
    repeatUsers: { count: repeat, contacts, share: ratio(repeat, contacts) },
    incidents: {
      count: windowIncidents.length,
      perWeek: weeks > 0 ? Math.round((windowIncidents.length / weeks) * 100) / 100 : null,
      byService: countBy(windowIncidents, (i) => i.service),
      bySeverity: countBy(windowIncidents, (i) => i.severity),
      linkedCases: created.filter((c) => c.refs?.incidentId).length,
    },
  }
}
