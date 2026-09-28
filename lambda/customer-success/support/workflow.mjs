// Support case status workflow (docs/player-success/ARCHITECTURE.md §3.2).
//
// Pure functions only. The transition table is explicit and keyed by actor
// kind, so "who may move a case from X to Y" is answered in one place:
//
//   player  the signed-in owner of the case (identity from the verified token)
//   system  automatic rules (a player reply, the auto-close sweep)
//   staff   a support role checked by roles.mjs
//
// Priority and severity are independent of state and never change here.

export const STATUSES = Object.freeze([
  'new',
  'triaged',
  'in_progress',
  'waiting_on_player',
  'waiting_on_provider',
  'escalated',
  'resolved',
  'closed',
  'reopened',
])

export const ACTOR_KINDS = Object.freeze(['player', 'system', 'staff'])

const DAY = 86400000
// A player reply within this window after a resolve reopens the case.
export const REOPEN_WINDOW_MS = 14 * DAY
// Resolved cases close after this long without activity (the sweep that
// applies it is not wired; `dueForAutoClose` is the rule it will call).
export const AUTO_CLOSE_AFTER_MS = 7 * DAY

const WORKING = ['waiting_on_player', 'waiting_on_provider', 'escalated', 'resolved']

// from -> { to: [actor kinds allowed] }
const TABLE = Object.freeze({
  new: { triaged: ['staff'], in_progress: ['staff'], escalated: ['staff'], resolved: ['staff'] },
  triaged: { in_progress: ['staff'], waiting_on_player: ['staff'], waiting_on_provider: ['staff'], escalated: ['staff'], resolved: ['staff'] },
  in_progress: Object.fromEntries(WORKING.map((to) => [to, ['staff']])),
  waiting_on_player: { in_progress: ['system', 'staff'], resolved: ['staff'] },
  waiting_on_provider: { in_progress: ['staff'], resolved: ['staff'] },
  escalated: { in_progress: ['staff'], resolved: ['staff'] },
  resolved: { closed: ['system', 'player', 'staff'], reopened: ['system', 'player', 'staff'] },
  // A player reply after close opens a NEW linked case instead (see
  // decidePlayerReply); only staff can reopen a closed case itself.
  closed: { reopened: ['staff'] },
  // "Same as in_progress", plus starting work on it again.
  reopened: { in_progress: ['staff'], ...Object.fromEntries(WORKING.map((to) => [to, ['staff']])) },
})

export const TRANSITIONS = TABLE

export function isStatus(value) {
  return STATUSES.includes(value)
}

export function canTransition(from, to, actor) {
  if (!ACTOR_KINDS.includes(actor)) return false
  return Boolean(TABLE[from]?.[to]?.includes(actor))
}

export function allowedTargets(from, actor) {
  return Object.entries(TABLE[from] || {}).filter(([, actors]) => actors.includes(actor)).map(([to]) => to)
}

export class TransitionError extends Error {
  constructor(from, to, actor) {
    super(`a ${actor} cannot move a case from ${from} to ${to}`)
    this.name = 'TransitionError'
    this.code = 'transition_refused'
    this.from = from
    this.to = to
    this.actor = actor
  }
}

export function waitingOnFor(status) {
  if (status === 'waiting_on_player') return 'player'
  if (status === 'waiting_on_provider') return 'provider'
  if (status === 'resolved' || status === 'closed') return null
  return 'recon'
}

export const OPEN_STATUSES = Object.freeze(STATUSES.filter((s) => s !== 'resolved' && s !== 'closed'))
export const isOpen = (status) => OPEN_STATUSES.includes(status)

// Returns a NEW case record; never mutates the input. Throws TransitionError
// when the table does not allow it.
export function applyTransition(caseRecord, to, { actor, at }) {
  const from = caseRecord.status
  if (!canTransition(from, to, actor)) throw new TransitionError(from, to, actor)
  const next = { ...caseRecord, status: to, updatedAt: at, waitingOn: waitingOnFor(to) }
  if (to === 'resolved') {
    next.resolvedAt = at
    next.closedAt = null
    next.resolutionCount = (caseRecord.resolutionCount || 0) + 1
  }
  if (to === 'closed') next.closedAt = at
  if (to === 'reopened') {
    next.reopenedAt = at
    next.reopenCount = (caseRecord.reopenCount || 0) + 1
    next.resolvedAt = null
    next.closedAt = null
  }
  return next
}

// A resolved case older than the reopen window behaves like a closed one for
// player replies, even if the auto-close sweep has not run yet.
export function effectivelyClosed(caseRecord, now) {
  if (caseRecord.status === 'closed') return true
  if (caseRecord.status !== 'resolved') return false
  const resolvedMs = Date.parse(caseRecord.resolvedAt || '')
  return !Number.isFinite(resolvedMs) || now - resolvedMs > REOPEN_WINDOW_MS
}

// What a player reply does to a case:
//   waiting_on_player           -> in_progress (system)
//   resolved, <= 14 days        -> reopened (system)
//   resolved > 14 days / closed -> a new linked case; the old one is untouched
//   anything else               -> no status change
export function decidePlayerReply(caseRecord, now) {
  if (caseRecord.status === 'waiting_on_player') return { action: 'transition', to: 'in_progress', actor: 'system' }
  if (effectivelyClosed(caseRecord, now)) return { action: 'new_linked_case' }
  if (caseRecord.status === 'resolved') return { action: 'transition', to: 'reopened', actor: 'system' }
  return { action: 'none' }
}

export function dueForAutoClose(caseRecord, now) {
  if (caseRecord.status !== 'resolved') return false
  const resolvedMs = Date.parse(caseRecord.resolvedAt || '')
  return Number.isFinite(resolvedMs) && now - resolvedMs >= AUTO_CLOSE_AFTER_MS
}

// Player-facing buckets (§3.2).
export const PLAYER_BUCKETS = Object.freeze({
  open: Object.freeze(['new', 'triaged', 'reopened']),
  waiting_on_recon: Object.freeze(['in_progress', 'escalated', 'waiting_on_provider']),
  waiting_on_me: Object.freeze(['waiting_on_player']),
  resolved: Object.freeze(['resolved']),
  closed: Object.freeze(['closed']),
})

export const BUCKET_LABEL = Object.freeze({
  open: 'Open',
  waiting_on_recon: 'Waiting on Recon',
  waiting_on_me: 'Waiting on me',
  resolved: 'Resolved',
  closed: 'Closed',
})

export function playerBucket(status) {
  for (const [bucket, statuses] of Object.entries(PLAYER_BUCKETS)) if (statuses.includes(status)) return bucket
  return 'open'
}
