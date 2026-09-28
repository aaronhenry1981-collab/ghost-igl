// Internal response targets for support cases.
//
// INTERNAL ONLY. These numbers drive the staff queue (at-risk / overdue
// flags). They are not a public promise: no player-facing projection, page or
// email ever includes them, and nothing here may be quoted as a response time
// to a player (docs/player-success/ARCHITECTURE.md §2.5).

const HOUR = 3600000

export const PRIORITIES = Object.freeze(['p1', 'p2', 'p3', 'p4'])

export const TARGETS = Object.freeze({
  p1: Object.freeze({ firstResponseMs: 1 * HOUR, resolveMs: 24 * HOUR }),
  p2: Object.freeze({ firstResponseMs: 4 * HOUR, resolveMs: 72 * HOUR }),
  p3: Object.freeze({ firstResponseMs: 24 * HOUR, resolveMs: 7 * 24 * HOUR }),
  p4: Object.freeze({ firstResponseMs: 72 * HOUR, resolveMs: 14 * 24 * HOUR }),
})

// A target is "at risk" once this share of its window has elapsed.
export const AT_RISK_FRACTION = 0.75

const iso = (ms) => new Date(ms).toISOString()
const targetFor = (priority) => TARGETS[priority] || TARGETS.p3

export function initialSla(priority, createdAt) {
  const t = targetFor(priority)
  const start = Date.parse(createdAt)
  return {
    firstResponseDueAt: iso(start + t.firstResponseMs),
    firstResponseAt: null,
    // While waiting on Recon, the next staff reply is due by this time.
    nextResponseDueAt: iso(start + t.firstResponseMs),
    resolveTargetAt: iso(start + t.resolveMs),
  }
}

// A public staff reply: records the first response and stops the clock.
export function slaAfterStaffReply(sla, at) {
  return { ...(sla || {}), firstResponseAt: sla?.firstResponseAt || at, nextResponseDueAt: null }
}

// A player message (or a reopen): the next reply is due again.
export function slaAfterPlayerMessage(sla, priority, at) {
  const t = targetFor(priority)
  return { ...(sla || {}), nextResponseDueAt: iso(Date.parse(at) + t.firstResponseMs) }
}

// Re-anchor targets when staff change the priority.
export function slaForPriorityChange(sla, priority, createdAt) {
  const fresh = initialSla(priority, createdAt)
  return {
    ...(sla || {}),
    firstResponseDueAt: fresh.firstResponseDueAt,
    resolveTargetAt: fresh.resolveTargetAt,
    nextResponseDueAt: sla?.nextResponseDueAt ? (sla.firstResponseAt ? sla.nextResponseDueAt : fresh.nextResponseDueAt) : null,
  }
}

function clockState(dueAt, startAt, now) {
  const due = Date.parse(dueAt || '')
  if (!Number.isFinite(due)) return 'none'
  if (now > due) return 'overdue'
  const start = Date.parse(startAt || '')
  const window = Number.isFinite(start) ? due - start : 0
  if (window > 0 && now - start >= window * AT_RISK_FRACTION) return 'at_risk'
  return 'on_track'
}

// Flags for the staff queue. Resolved/closed cases and cases waiting on the
// player carry no response clock.
export function slaState(caseRecord, now) {
  const sla = caseRecord?.sla || {}
  const waitingOnRecon = !['resolved', 'closed', 'waiting_on_player'].includes(caseRecord?.status)
  const firstResponse = sla.firstResponseAt ? 'met' : waitingOnRecon ? clockState(sla.firstResponseDueAt, caseRecord.createdAt, now) : 'none'
  const nextResponse = waitingOnRecon && sla.firstResponseAt && sla.nextResponseDueAt
    ? clockState(sla.nextResponseDueAt, caseRecord.lastPlayerMessageAt || caseRecord.updatedAt, now)
    : 'none'
  const resolve = waitingOnRecon ? clockState(sla.resolveTargetAt, caseRecord.createdAt, now) : 'none'
  const states = [firstResponse, nextResponse, resolve]
  const overdue = states.includes('overdue')
  const atRisk = states.includes('at_risk')
  return {
    firstResponse,
    nextResponse,
    resolve,
    atRisk,
    overdue,
    // One summary flag for queue rows: the worst running clock
    // (overdue > at_risk > on_track), or 'none' when no clock is running.
    state: overdue ? 'overdue' : atRisk ? 'at_risk' : states.includes('on_track') ? 'on_track' : 'none',
  }
}
