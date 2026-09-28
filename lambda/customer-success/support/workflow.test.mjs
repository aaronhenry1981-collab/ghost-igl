import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ACTOR_KINDS,
  REOPEN_WINDOW_MS,
  STATUSES,
  TransitionError,
  allowedTargets,
  applyTransition,
  canTransition,
  decidePlayerReply,
  dueForAutoClose,
  effectivelyClosed,
  playerBucket,
  waitingOnFor,
} from './workflow.mjs'

const DAY = 86400000
const NOW = Date.parse('2026-09-25T15:00:00.000Z')
const iso = (ms) => new Date(ms).toISOString()

// The §3.2 table, written out independently of workflow.mjs.
const S = ['staff']
const EXPECTED = {
  new: { triaged: S, in_progress: S, escalated: S, resolved: S },
  triaged: { in_progress: S, waiting_on_player: S, waiting_on_provider: S, escalated: S, resolved: S },
  in_progress: { waiting_on_player: S, waiting_on_provider: S, escalated: S, resolved: S },
  waiting_on_player: { in_progress: ['system', 'staff'], resolved: S },
  waiting_on_provider: { in_progress: S, resolved: S },
  escalated: { in_progress: S, resolved: S },
  resolved: { closed: ['system', 'player', 'staff'], reopened: ['system', 'player', 'staff'] },
  closed: { reopened: S },
  reopened: { in_progress: S, waiting_on_player: S, waiting_on_provider: S, escalated: S, resolved: S },
}

test('every (from, to, actor) combination matches the §3.2 table: allowed AND refused', () => {
  let allowed = 0
  let refused = 0
  for (const from of STATUSES) {
    for (const to of STATUSES) {
      for (const actor of ACTOR_KINDS) {
        const want = Boolean(EXPECTED[from]?.[to]?.includes(actor))
        assert.equal(canTransition(from, to, actor), want, `${actor}: ${from} -> ${to}`)
        want ? (allowed += 1) : (refused += 1)
      }
    }
  }
  assert.equal(allowed, 32)
  assert.equal(refused, STATUSES.length * STATUSES.length * ACTOR_KINDS.length - 32)
})

test('negative controls: players never move a case except resolved -> closed/reopened; unknown actors and states are refused', () => {
  for (const from of STATUSES) {
    const targets = allowedTargets(from, 'player')
    if (from === 'resolved') assert.deepEqual(targets.sort(), ['closed', 'reopened'])
    else assert.deepEqual(targets, [], `player from ${from}`)
  }
  assert.equal(canTransition('new', 'triaged', 'admin'), false, 'roles are not actor kinds')
  assert.equal(canTransition('new', 'bogus', 'staff'), false)
  assert.equal(canTransition('bogus', 'new', 'staff'), false)
  assert.equal(canTransition('closed', 'reopened', 'player'), false, 'a player reply after close opens a new case instead')
  assert.equal(canTransition('closed', 'in_progress', 'staff'), false)
  assert.equal(canTransition('new', 'closed', 'staff'), false, 'close only after resolve')
})

test('applyTransition sets timestamps, counters and waitingOn without mutating input', () => {
  const base = { status: 'in_progress', updatedAt: iso(NOW - DAY), reopenCount: 0, resolutionCount: 0 }
  const resolved = applyTransition(base, 'resolved', { actor: 'staff', at: iso(NOW) })
  assert.equal(base.status, 'in_progress', 'input untouched')
  assert.equal(resolved.resolvedAt, iso(NOW))
  assert.equal(resolved.resolutionCount, 1)
  assert.equal(resolved.waitingOn, null)
  const closed = applyTransition(resolved, 'closed', { actor: 'player', at: iso(NOW + 1) })
  assert.equal(closed.closedAt, iso(NOW + 1))
  const reopened = applyTransition(closed, 'reopened', { actor: 'staff', at: iso(NOW + 2) })
  assert.equal(reopened.reopenedAt, iso(NOW + 2))
  assert.equal(reopened.reopenCount, 1)
  assert.equal(reopened.resolvedAt, null)
  assert.equal(reopened.closedAt, null)
  assert.equal(reopened.waitingOn, 'recon')
  assert.equal(applyTransition(base, 'waiting_on_player', { actor: 'staff', at: iso(NOW) }).waitingOn, 'player')
  assert.equal(waitingOnFor('waiting_on_provider'), 'provider')
  assert.throws(() => applyTransition(base, 'closed', { actor: 'staff', at: iso(NOW) }), TransitionError)
  assert.throws(() => applyTransition({ status: 'resolved' }, 'in_progress', { actor: 'player', at: iso(NOW) }), (err) => err.code === 'transition_refused')
})

test('player reply rules: waiting -> in_progress; resolved <= 14 days -> reopened; later or closed -> new linked case', () => {
  assert.deepEqual(decidePlayerReply({ status: 'waiting_on_player' }, NOW), { action: 'transition', to: 'in_progress', actor: 'system' })
  assert.deepEqual(decidePlayerReply({ status: 'resolved', resolvedAt: iso(NOW - 3 * DAY) }, NOW), { action: 'transition', to: 'reopened', actor: 'system' })
  assert.deepEqual(decidePlayerReply({ status: 'resolved', resolvedAt: iso(NOW - REOPEN_WINDOW_MS) }, NOW).to, 'reopened', 'exactly 14 days still reopens')
  assert.deepEqual(decidePlayerReply({ status: 'resolved', resolvedAt: iso(NOW - REOPEN_WINDOW_MS - 1) }, NOW), { action: 'new_linked_case' })
  assert.deepEqual(decidePlayerReply({ status: 'closed', resolvedAt: iso(NOW - DAY) }, NOW), { action: 'new_linked_case' })
  for (const status of ['new', 'triaged', 'in_progress', 'waiting_on_provider', 'escalated', 'reopened']) {
    assert.deepEqual(decidePlayerReply({ status }, NOW), { action: 'none' }, status)
  }
  assert.equal(effectivelyClosed({ status: 'resolved', resolvedAt: null }, NOW), true, 'a resolved case with no timestamp fails closed')
  assert.equal(dueForAutoClose({ status: 'resolved', resolvedAt: iso(NOW - 7 * DAY) }, NOW), true)
  assert.equal(dueForAutoClose({ status: 'resolved', resolvedAt: iso(NOW - 6 * DAY) }, NOW), false)
  assert.equal(dueForAutoClose({ status: 'closed', resolvedAt: iso(NOW - 30 * DAY) }, NOW), false)
})

test('player buckets cover every status', () => {
  const want = { new: 'open', triaged: 'open', reopened: 'open', in_progress: 'waiting_on_recon', escalated: 'waiting_on_recon', waiting_on_provider: 'waiting_on_recon', waiting_on_player: 'waiting_on_me', resolved: 'resolved', closed: 'closed' }
  for (const s of STATUSES) assert.equal(playerBucket(s), want[s], s)
})
