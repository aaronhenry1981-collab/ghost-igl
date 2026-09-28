import test from 'node:test'
import assert from 'node:assert/strict'
import { PERMISSIONS, can, isStaff, rolesFor } from './roles.mjs'

const id = (groups = [], extra = {}) => ({ email: 'someone@example.test', sub: 's', groups, isAdmin: groups.includes('admins'), ...extra })

test('roles come only from Cognito groups; admins hold every role', () => {
  assert.deepEqual(rolesFor(null), [])
  assert.deepEqual(rolesFor({ groups: ['admins'] }), [], 'no verified email, no roles')
  assert.deepEqual(rolesFor(id()), ['player'])
  assert.deepEqual(rolesFor(id(['support-agent'])), ['player', 'agent'])
  assert.deepEqual(rolesFor(id(['support-billing'])), ['player', 'agent', 'billing'])
  assert.deepEqual(rolesFor(id(['support-engineering'])), ['player', 'agent', 'engineering'])
  assert.deepEqual(rolesFor(id(['support-lead'])), ['player', 'agent', 'billing', 'engineering', 'lead'])
  assert.deepEqual(rolesFor(id(['admins'])), ['player', 'agent', 'billing', 'engineering', 'lead', 'admin'])
  assert.deepEqual(rolesFor(id([], { isAdmin: true })), ['player', 'agent', 'billing', 'engineering', 'lead', 'admin'], 'isAdmin is the admins group (auth.mjs derives it)')
  assert.deepEqual(rolesFor(id(['support-superuser', 'role:admin'])), ['player'], 'unknown groups grant nothing')
  const groups = ['support-agent']
  rolesFor({ email: 'x@example.test', groups, isAdmin: true })
  assert.deepEqual(groups, ['support-agent'], 'rolesFor never mutates the identity')
  assert.equal(isStaff(rolesFor(id())), false)
  assert.equal(isStaff(rolesFor(id(['support-agent']))), true)
})

test('permission matrix (§5) with negative controls', () => {
  const R = (g) => rolesFor(id(g))
  const player = R([])
  const agent = R(['support-agent'])
  const billing = R(['support-billing'])
  const eng = R(['support-engineering'])
  const lead = R(['support-lead'])
  const admin = R(['admins'])
  const matrix = {
    'queue.read': [false, true, true, true, true, true],
    'case.reply': [false, true, true, true, true, true],
    'case.note': [false, true, true, true, true, true],
    'billing.refs.full': [false, false, true, false, true, true],
    'diagnostics.technical': [false, false, false, true, true, true],
    'action.request': [false, true, true, true, true, true],
    'action.request.billing': [false, false, true, false, true, true],
    'action.authorize': [false, false, false, false, true, true],
    'action.reject': [false, false, false, false, true, true],
    'action.record_done': [false, false, true, false, true, true],
    'incident.read': [false, true, true, true, true, true],
    'incident.write': [false, false, false, false, true, true],
    'metrics.read': [false, false, false, false, true, true],
    'kb.decide': [false, false, false, false, true, true],
    'proactive.run': [false, false, false, false, true, true],
    'case.read_own': [true, true, true, true, true, true],
  }
  for (const [action, want] of Object.entries(matrix)) {
    assert.deepEqual([player, agent, billing, eng, lead, admin].map((r) => can(r, action)), want, action)
  }
  assert.equal(can(admin, 'billing.refund.execute'), false, 'unknown actions are refused, even for admin')
  assert.equal(can(admin, 'stripe.write'), false)
  assert.equal(can(undefined, 'queue.read'), false)
  assert.ok(Object.keys(PERMISSIONS).every((a) => !/execute|write_billing|cognito|stripe/.test(a)), 'no permission executes a sensitive action')
})
