import test from 'node:test'
import assert from 'node:assert/strict'
import { applyCommand, createRoom, myRole } from './domain.mjs'
const a = { subject: 'demo-a', alias: 'Demo Alpha' }, b = { subject: 'demo-b', alias: 'Demo Bravo' }
const now = 1000
let serial = 0
const fresh = () => createRoom({ id: 'local-room', actor: a, now, inviteExpiresAt: 10_000 })
const cmd = (room, actor, type, values = {}) => applyCommand(room, { type, requestId: `test-${++serial}`, phaseEpoch: room.phaseEpoch, iglTerm: room.iglTerm, expectedRevision: room.revision, ...values }, actor, now)
const selected = () => cmd(cmd(fresh(), a, 'choose_map', { map: 'Bank' }), a, 'select_plan', { planId: 'solo' })
const locked = () => cmd(cmd(selected(), a, 'assign', { roleId: 'observe', memberSubject: a.subject }), a, 'lock')
test('create requires identity and a future invite; input is not mutated', () => {
  assert.throws(() => createRoom({ id: 'x', actor: {}, now, inviteExpiresAt: 2000 }), { code: 'IDENTITY' })
  assert.throws(() => createRoom({ id: 'x', actor: a, now, inviteExpiresAt: now }), { code: 'EXPIRY' })
  const original = fresh(); cmd(original, a, 'vote', { planId: 'solo' }); assert.equal(original.revision, 0)
})
test('late join preserves current phase, plan, assignments and existing Ready', () => {
  const room = cmd(locked(), a, 'ready', { planRevision: locked().planRevision, assignmentRevision: locked().assignmentRevision })
  const joined = cmd(room, b, 'join')
  for (const key of ['phase', 'round', 'phaseEpoch', 'plan', 'assignments', 'ready']) assert.deepEqual(joined[key], room[key])
  assert.equal(myRole(joined, b.subject), null)
})
test('same member on another device occupies no extra seat', () => {
  const room = cmd(fresh(), b, 'join'); const repeated = cmd(room, b, 'join')
  assert.equal(Object.keys(repeated.members).length, 2)
})
test('a sixth player cannot join and no room mutation occurs', () => {
  let room = fresh()
  for (let i = 1; i < 5; i++) room = cmd(room, { subject: `member-${i}`, alias: `Demo ${i}` }, 'join')
  assert.throws(() => cmd(room, b, 'join'), { code: 'FULL' }); assert.equal(Object.keys(room.members).length, 5)
})
test('expired or revoked invitations reject new participants', () => {
  const room = fresh(); room.inviteExpiresAt = now
  assert.throws(() => cmd(room, b, 'join'), { code: 'INVITE_EXPIRED' })
  assert.throws(() => cmd(cmd(fresh(), a, 'revoke_invite'), b, 'join'), { code: 'INVITE_EXPIRED' })
})
test('member ballots do not require an unrelated global revision', () => {
  const room = cmd(fresh(), b, 'join')
  const voted = cmd(room, a, 'vote', { planId: 'solo' })
  const next = cmd(voted, b, 'vote', { planId: 'pair', expectedRevision: 0 })
  assert.equal(next.votes[a.subject], 'solo'); assert.equal(next.votes[b.subject], 'pair')
})
test('wrong member cannot control IGL decisions or read a role', () => {
  assert.throws(() => cmd(fresh(), b, 'choose_map', { map: 'Bank' }), { code: 'MEMBERSHIP' })
  assert.throws(() => cmd(cmd(fresh(), b, 'join'), b, 'choose_map', { map: 'Bank' }), { code: 'IGL_ONLY' })
  assert.equal(myRole(locked(), b.subject), null)
})
test('leadership transfer fences old leader and old term', () => {
  const room = cmd(fresh(), b, 'join'); const next = cmd(room, a, 'transfer', { memberSubject: b.subject })
  assert.throws(() => cmd(next, a, 'choose_map', { map: 'Bank' }), { code: 'IGL_ONLY' })
  assert.throws(() => cmd(next, b, 'choose_map', { map: 'Bank', iglTerm: 1 }), { code: 'STALE_IGL' })
})
test('stale IGL revision and stale phase fail closed', () => {
  assert.throws(() => cmd(selected(), a, 'lock', { expectedRevision: 0 }), { code: 'STALE_REVISION' })
  assert.throws(() => cmd(selected(), a, 'vote', { planId: 'solo', phaseEpoch: 1 }), { code: 'STALE_PHASE' })
})
test('lock requires every role and minimum coordinated stack', () => {
  assert.throws(() => cmd(selected(), a, 'lock'), { code: 'INCOMPLETE' })
  const pair = cmd(selected(), a, 'select_plan', { planId: 'pair' })
  assert.throws(() => cmd(pair, a, 'lock'), { code: 'STACK_SIZE' })
})
test('operator capability, not just player presence, controls assignment', () => {
  let room = cmd(selected(), a, 'select_plan', { planId: 'pair' }); room = cmd(room, b, 'join')
  assert.throws(() => cmd(room, a, 'assign', { roleId: 'support', memberSubject: a.subject }), { code: 'CAPABILITY' })
  room = cmd(room, a, 'assign', { roleId: 'first', memberSubject: a.subject })
  room = cmd(room, a, 'assign', { roleId: 'support', memberSubject: b.subject })
  assert.equal(cmd(room, a, 'lock').plan.locked, true)
})
test('repick invalidates the lock and Ready rather than silently reassigning', () => {
  let room = locked(); room = cmd(room, a, 'ready', { planRevision: room.planRevision, assignmentRevision: room.assignmentRevision })
  const next = cmd(room, a, 'report_operator', { operator: 'Buck' })
  assert.equal(next.plan.locked, false); assert.deepEqual(next.ready, {}); assert.deepEqual(next.assignments, room.assignments)
})
test('Ready requires the exact locked assignment and plan revisions', () => {
  const room = locked()
  assert.throws(() => cmd(room, a, 'ready', { planRevision: room.planRevision - 1, assignmentRevision: room.assignmentRevision }), { code: 'STALE_PLAN' })
  assert.throws(() => cmd(cmd(room, b, 'join'), b, 'ready', { planRevision: room.planRevision, assignmentRevision: room.assignmentRevision }), { code: 'UNASSIGNED' })
})
test('identical retry is idempotent; changed payload with same request ID is rejected', () => {
  const room = fresh(); const command = { type: 'vote', requestId: 'same', phaseEpoch: 1, planId: 'solo' }
  const next = applyCommand(room, command, a, now)
  assert.deepEqual(applyCommand(next, command, a, now), next)
  assert.throws(() => applyCommand(next, { ...command, planId: 'pair' }, a, now), { code: 'REPLAY' })
})
test('removed member cannot use a receipt replay or old invitation to regain room', () => {
  const join = { type: 'join', requestId: 'joined', phaseEpoch: 1 }
  let room = applyCommand(fresh(), join, b, now); room = cmd(room, a, 'remove', { memberSubject: b.subject })
  assert.throws(() => applyCommand(room, join, b, now), { code: 'MEMBERSHIP' })
  assert.throws(() => cmd(room, b, 'join'), { code: 'MEMBERSHIP' })
})
test('round transitions cannot skip an unlocked plan; fresh round retires old plan', () => {
  assert.throws(() => cmd(selected(), a, 'advance'), { code: 'UNLOCKED' })
  const action = cmd(locked(), a, 'advance'); const result = cmd(action, a, 'advance')
  const next = cmd(cmd(result, a, 'record_result', { result: 'unknown' }), a, 'new_round')
  assert.equal(next.round, 2); assert.equal(next.plan, null); assert.deepEqual(next.assignments, {})
  assert.throws(() => cmd(next, a, 'record_result', { result: 'win' }), { code: 'RESULT' })
})
test('new round clears decision ballots on either reported side, while retaining membership', () => {
  let room = cmd(locked(), a, 'vote', { planId: 'pair' })
  room = cmd(cmd(room, a, 'advance'), a, 'advance')
  for (const side of ['attack', 'defense']) {
    const next = cmd(room, a, 'new_round', { side })
    assert.deepEqual(next.votes, {}); assert.equal(next.side, side); assert.deepEqual(next.members, room.members)
  }
  assert.throws(() => cmd(room, a, 'new_round', { side: 'unknown' }), { code: 'SIDE' })
})
test('a new map decision retires earlier ballots rather than showing them as current', () => {
  const room = cmd(fresh(), a, 'vote', { planId: 'pair' })
  assert.deepEqual(cmd(room, a, 'choose_map', { map: 'Bank' }).votes, {})
})
