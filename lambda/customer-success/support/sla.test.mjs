import test from 'node:test'
import assert from 'node:assert/strict'
import { TARGETS, initialSla, slaAfterPlayerMessage, slaAfterStaffReply, slaState } from './sla.mjs'

const HOUR = 3600000
const T0 = Date.parse('2026-09-25T12:00:00.000Z')
const iso = (ms) => new Date(ms).toISOString()

test('internal first-response targets: p1 1h, p2 4h, p3 24h, p4 72h', () => {
  assert.deepEqual(Object.fromEntries(Object.entries(TARGETS).map(([p, t]) => [p, t.firstResponseMs / HOUR])), { p1: 1, p2: 4, p3: 24, p4: 72 })
  assert.equal(initialSla('p1', iso(T0)).firstResponseDueAt, iso(T0 + HOUR))
  assert.equal(initialSla('p4', iso(T0)).firstResponseDueAt, iso(T0 + 72 * HOUR))
  assert.equal(initialSla('nonsense', iso(T0)).firstResponseDueAt, iso(T0 + 24 * HOUR), 'unknown priority falls back to p3')
})

test('at-risk after 75% of the window, overdue after the due time, met after a public reply', () => {
  const c = { status: 'new', priority: 'p2', createdAt: iso(T0), updatedAt: iso(T0), sla: initialSla('p2', iso(T0)) }
  assert.equal(slaState(c, T0 + HOUR).firstResponse, 'on_track')
  assert.equal(slaState(c, T0 + 3 * HOUR).firstResponse, 'at_risk')
  assert.equal(slaState(c, T0 + 3 * HOUR).atRisk, true)
  assert.equal(slaState(c, T0 + 5 * HOUR).firstResponse, 'overdue')
  assert.equal(slaState(c, T0 + 5 * HOUR).overdue, true)
  const replied = { ...c, status: 'in_progress', sla: slaAfterStaffReply(c.sla, iso(T0 + HOUR)) }
  assert.equal(slaState(replied, T0 + 5 * HOUR).firstResponse, 'met')
  assert.equal(slaState(replied, T0 + 5 * HOUR).nextResponse, 'none')
  const again = { ...replied, lastPlayerMessageAt: iso(T0 + 6 * HOUR), sla: slaAfterPlayerMessage(replied.sla, 'p2', iso(T0 + 6 * HOUR)) }
  assert.equal(slaState(again, T0 + 11 * HOUR).nextResponse, 'overdue')
  // Negative controls: no clock while waiting on the player or after resolve.
  assert.equal(slaState({ ...c, status: 'waiting_on_player' }, T0 + 99 * HOUR).overdue, false)
  assert.equal(slaState({ ...c, status: 'resolved' }, T0 + 99 * HOUR).overdue, false)
})
