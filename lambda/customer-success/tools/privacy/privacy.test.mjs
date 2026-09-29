// Export/deletion planning and execution with fake stores. All data fictional.
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDeletionPlan, buildExport } from './plan.mjs'
import { applyDeletionPlan } from './apply.mjs'
import { TABLES, reviewArchiveHash } from './sources.mjs'
import { collect, pendingPurges } from '../privacy-request.mjs'

const EMAIL = 'player.x@example.test'

function fakeSources(overrides = {}) {
  const base = {
    cognitoUser: async (e) => (e === EMAIL ? [{ username: 'u-1', sub: 'sub-1', email: EMAIL, status: 'CONFIRMED', groups: [], attributes: { email: EMAIL } }] : []),
    profile: async () => [{ email: EMAIL, display_name: 'X' }],
    subscriptions: async () => [{ stripe_customer_id: 'cus_FIXTURE_x', email: EMAIL, status: 'canceled', plan: 'pro' }],
    crmLog: async () => [{ email: EMAIL }],
    referrals: async () => [{ referrer_email: EMAIL, referred_email: 'friend@example.test' }],
    climb: async () => [{ sub: 'sub-1' }],
    coachingEvents: async () => [{ userId: 'sub-1', sk: 'EV#1' }],
    bookings: async () => [{ slotId: 'S1', customer: { email: EMAIL, name: 'X' }, manageToken: 't' }, { slotId: `CREDITS#${EMAIL}`, email: EMAIL, credits: 0 }],
    reviewArchive: async () => [{ review_id: 'r1', email_hash: reviewArchiveHash(EMAIL) }],
    customerSuccess: async (key) => [{ pk: `C#${key}`, sk: 'CASE#1' }, { pk: 'SUP#CASENO', sk: 'R6-000009', contactKey: key }],
    playerData: async () => ({ store: [{ recon_player_id: 'RP-1' }], events: [{ recon_player_id: 'RP-1', event_key: 'e1' }], snapshots: [], identities: [] }),
  }
  return { ...base, ...overrides }
}

test('collect finds every store for the person (lowercased email, sub-derived player id)', async () => {
  const c = await collect('Player.X@Example.test', fakeSources())
  assert.equal(c.email, EMAIL)
  assert.equal(c.cognito.length, 1)
  assert.equal(c.records.customerSuccess.length, 2)
  assert.equal(c.records.playerEvents.length, 1)
  const exp = buildExport({ email: c.email, collected: c, generatedAt: '2026-09-28T00:00:00Z' })
  assert.equal(exp.counts.bookings, 2)
  assert.ok(exp.note.includes('Stripe'))
})

test('deletion plan: deletes personal rows, anonymises booking slots, Cognito last; stable plan id', async () => {
  const c = await collect(EMAIL, fakeSources())
  const plan = buildDeletionPlan({ email: c.email, collected: c })
  assert.deepEqual(plan.blockers, [])
  const slot = plan.actions.find((a) => a.table === TABLES.bookings && a.op === 'anonymize')
  assert.deepEqual(slot.remove, ['customer', 'manageToken'], 'the slot stays on the schedule without the customer')
  assert.ok(plan.actions.some((a) => a.table === TABLES.bookings && a.op === 'delete'), 'credit row deleted')
  assert.ok(plan.actions.some((a) => a.table === TABLES.customerSuccess && a.key.pk === 'SUP#CASENO'), 'pointer items included')
  assert.equal(plan.stripeCustomers.length, 1)
  assert.equal(plan.confirmPhrase, `DELETE ALL DATA FOR ${EMAIL}`)
  assert.equal(buildDeletionPlan({ email: c.email, collected: c }).planId, plan.planId)
})

test('a live subscription or an admin account blocks deletion', async () => {
  const live = await collect(EMAIL, fakeSources({ subscriptions: async () => [{ stripe_customer_id: 'cus_FIXTURE_x', email: EMAIL, status: 'active' }] }))
  assert.match(buildDeletionPlan({ email: EMAIL, collected: live }).blockers.join(), /live_subscription/)
  const admin = await collect(EMAIL, fakeSources({ cognitoUser: async () => [{ username: 'u-1', sub: 'sub-1', groups: ['admins'], attributes: {} }] }))
  assert.match(buildDeletionPlan({ email: EMAIL, collected: admin }).blockers.join(), /admin_account/)
  await assert.rejects(applyDeletionPlan({ plan: buildDeletionPlan({ email: EMAIL, collected: live }), ddb: { send: async () => ({}) }, cognito: { send: async () => ({}) }, userPoolId: 'p' }), /blocked/)
})

test('an account already deleted in the console is still found by its sub (--sub or audit log)', async () => {
  const gone = { cognitoUser: async () => [] }
  const seen = []
  const climb = async (s) => { seen.push(s); return s ? [{ sub: s }] : [] }
  const none = await collect(EMAIL, fakeSources({ ...gone, climb }))
  assert.deepEqual(none.subs, [])
  assert.equal(none.records.climb.length, 0, 'no sub, nothing sub-keyed is reachable')
  const viaFlag = await collect(EMAIL, fakeSources({ ...gone, climb }), { extraSubs: ['sub-9'] })
  assert.deepEqual(viaFlag.subs, ['sub-9'])
  assert.equal(viaFlag.records.climb.length, 1)
  const viaAudit = await collect(EMAIL, fakeSources({ ...gone, climb, deletedAccountSubs: async (e) => (e === EMAIL ? ['sub-7'] : []) }))
  assert.deepEqual(viaAudit.subs, ['sub-7'])
  assert.equal(viaAudit.records.playerStore.length, 1)
  const plan = buildDeletionPlan({ email: EMAIL, collected: viaAudit })
  assert.ok(!plan.actions.some((a) => a.op === 'cognito-delete'), 'no Cognito account left to delete')
  assert.ok(plan.actions.some((a) => a.table === TABLES.climb && a.key.sub === 'sub-7'))
})

test('pending lists console deletions without a later full purge', () => {
  const other = 'other@example.test'
  const items = [
    { action: 'user.delete', target: EMAIL, timestamp: '2026-09-01T00:00:00Z', details: { cognito_sub: 'sub-1' } },
    { action: 'user.delete', target: other, timestamp: '2026-09-02T00:00:00Z', details: {} },
    { action: 'privacy.delete', target: `email_hash:${reviewArchiveHash(other)}`, timestamp: '2026-09-03T00:00:00Z' },
    { action: 'privacy.delete', target: `email_hash:${reviewArchiveHash(EMAIL)}`, timestamp: '2026-08-01T00:00:00Z' },
  ]
  assert.deepEqual(pendingPurges(items), [{ email: EMAIL, deletedAt: '2026-09-01T00:00:00Z', cognitoSub: 'sub-1' }], 'a purge older than the deletion does not count')
})

test('apply deletes, anonymises, removes Cognito last, and audits by hash only', async () => {
  const c = await collect(EMAIL, fakeSources())
  const plan = buildDeletionPlan({ email: c.email, collected: c })
  const calls = []
  const ddb = { send: async (cmd) => { calls.push({ kind: cmd.constructor.name, input: cmd.input }); return {} } }
  const cognito = { send: async (cmd) => { calls.push({ kind: cmd.constructor.name, input: cmd.input }); return {} } }
  const res = await applyDeletionPlan({ plan, ddb, cognito, userPoolId: 'pool', actor: 'operator@example.test' })
  assert.equal(res.failed, 0)
  assert.equal(res.cognitoDelete, 1)
  const kinds = calls.map((c) => c.kind)
  assert.ok(kinds.indexOf('AdminDeleteUserCommand') > kinds.lastIndexOf('DeleteCommand'), 'Cognito goes last')
  const update = calls.find((c) => c.kind === 'UpdateCommand')
  assert.match(update.input.UpdateExpression, /^REMOVE /)
  const audit = calls.find((c) => c.kind === 'PutCommand').input.Item
  assert.equal(audit.action, 'privacy.delete')
  assert.ok(!JSON.stringify(audit).includes(EMAIL), 'the audit entry never names the email')
})

test('register: manual rows get a 30-day due date; completion matches by email and kind', async () => {
  const { manualRow, satisfiedBy, daysLeft, emailHash } = await import('./register.mjs')
  const row = manualRow({ email: ' Player.X@Example.test ', kind: 'deletion', receivedAt: '2026-09-29T10:00:00.000Z' })
  assert.match(row.request_id, /^PR-20260929-[0-9a-f]{6}$/)
  assert.equal(row.due_at, '2026-10-29T10:00:00.000Z')
  assert.equal(row.email_hash, emailHash(EMAIL))
  assert.equal(daysLeft(row, Date.parse('2026-10-19T10:00:00.000Z')), 10)
  assert.throws(() => manualRow({ email: EMAIL, kind: 'nonsense', receivedAt: '2026-09-29' }), /--kind/)
  const rows = [row, { ...row, request_id: 'PR-x', kind: 'export' }, { ...row, request_id: 'PR-y', status: 'completed' }, { ...row, request_id: 'PR-z', email_hash: 'other' }]
  assert.deepEqual(satisfiedBy(rows, EMAIL, 'delete').map((r) => r.request_id), [row.request_id])
  assert.deepEqual(satisfiedBy(rows, EMAIL, 'export').map((r) => r.request_id), ['PR-x'])
})
