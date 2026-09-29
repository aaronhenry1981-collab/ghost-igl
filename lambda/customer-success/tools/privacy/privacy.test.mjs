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

test('pending: only a VERIFIED purge clears a console deletion; a review note is shown, never clears', () => {
  const other = 'other@example.test'
  const third = 'third@example.test'
  const verified = { verification: { verified: true, checked: 3, remaining: 0 } }
  const items = [
    { action: 'user.delete', target: EMAIL, timestamp: '2026-09-01T00:00:00Z', details: { cognito_sub: 'sub-1' } },
    { action: 'user.delete', target: other, timestamp: '2026-09-02T00:00:00Z', details: {} },
    { action: 'privacy.delete', target: `email_hash:${reviewArchiveHash(other)}`, timestamp: '2026-09-03T00:00:00Z', details: verified },
    { action: 'privacy.delete', target: `email_hash:${reviewArchiveHash(EMAIL)}`, timestamp: '2026-08-01T00:00:00Z', details: verified },
    { action: 'user.delete', target: third, timestamp: '2026-09-04T00:00:00Z', details: {} },
    { action: 'privacy.delete', target: `email_hash:${reviewArchiveHash(third)}`, timestamp: '2026-09-05T00:00:00Z', details: { verification: { verified: false, checked: 3, remaining: 1 } } },
    { action: 'user.delete.review', target: EMAIL, timestamp: '2026-09-29T00:00:00Z', details: { finding: 'administrator account removal after cancellation/refund; no customer deletion request found' } },
  ]
  const pending = pendingPurges(items)
  assert.deepEqual(pending.map((p) => p.email), [EMAIL, third], 'an older purge and an unverified purge do not count; a verified later purge does')
  assert.match(pending[0].review, /no customer deletion request found/)
  assert.equal(pending[1].review, null)
})

test('apply re-reads every targeted record: verified only when all are gone', async () => {
  const c = await collect(EMAIL, fakeSources())
  const plan = buildDeletionPlan({ email: c.email, collected: c })
  const calls = []
  const notFound = () => { const e = new Error('nf'); e.name = 'UserNotFoundException'; return e }
  const cognitoGone = { send: async (cmd) => { calls.push({ kind: cmd.constructor.name, input: cmd.input }); if (cmd.constructor.name === 'AdminGetUserCommand') throw notFound(); return {} } }
  const ddbGone = { send: async (cmd) => { calls.push({ kind: cmd.constructor.name, input: cmd.input }); return {} } }
  const res = await applyDeletionPlan({ plan, ddb: ddbGone, cognito: cognitoGone, userPoolId: 'pool', actor: 'operator@example.test' })
  assert.equal(res.failed, 0)
  assert.equal(res.cognitoDelete, 1)
  assert.equal(res.verification.verified, true)
  assert.equal(res.verification.checked, plan.actions.length)
  const kinds = calls.map((x) => x.kind)
  assert.ok(kinds.indexOf('AdminDeleteUserCommand') > kinds.lastIndexOf('DeleteCommand'), 'Cognito goes last')
  assert.ok(calls.filter((x) => x.kind === 'GetCommand').every((x) => x.input.ConsistentRead === true), 'verification uses consistent reads')
  const audit = calls.find((x) => x.kind === 'PutCommand').input.Item
  assert.equal(audit.action, 'privacy.delete')
  assert.deepEqual(audit.details.verification, { verified: true, checked: plan.actions.length, remaining: 0 })
  assert.ok(!JSON.stringify(audit).includes(EMAIL), 'the audit entry never names the email')

  // A row still there after the delete, an anonymised slot still holding the
  // customer, or a surviving account = NOT verified.
  const { verifyDeletionPlan } = await import('./apply.mjs')
  const stillThere = { send: async (cmd) => {
    if (cmd.constructor.name !== 'GetCommand') return {}
    if (cmd.input.TableName === TABLES.profiles) return { Item: { email: EMAIL } }
    if (cmd.input.TableName === TABLES.bookings && cmd.input.Key.slotId === 'S1') return { Item: { slotId: 'S1', customer: { email: EMAIL } } }
    return {}
  } }
  const v1 = await verifyDeletionPlan({ plan, ddb: stillThere, cognito: cognitoGone, userPoolId: 'pool' })
  assert.equal(v1.verified, false)
  assert.deepEqual(v1.remaining.map((r) => `${r.op}:${r.table}`).sort(), [`anonymize:${TABLES.bookings}`, `delete:${TABLES.profiles}`])
  const v2 = await verifyDeletionPlan({ plan, ddb: ddbGone, cognito: { send: async () => ({ Username: 'u-1' }) }, userPoolId: 'pool' })
  assert.equal(v2.verified, false, 'a surviving Cognito account fails verification')
})

test('register completion: export never closes a deletion, unspecified or unfinished combined request', async () => {
  const { manualRow, completionPlan, exportStillOwed, daysLeft, emailHash } = await import('./register.mjs')
  const base = manualRow({ email: ' Player.X@Example.test ', kind: 'deletion', receivedAt: '2026-09-29T10:00:00.000Z' })
  assert.match(base.request_id, /^PR-20260929-[0-9a-f]{6}$/)
  assert.equal(base.due_at, '2026-10-29T10:00:00.000Z')
  assert.equal(base.email_hash, emailHash(EMAIL))
  assert.equal(daysLeft(base, Date.parse('2026-10-19T10:00:00.000Z')), 10)
  assert.throws(() => manualRow({ email: EMAIL, kind: 'nonsense', receivedAt: '2026-09-29' }), /--kind/)
  const rows = [
    { ...base, request_id: 'PR-del', kind: 'deletion' },
    { ...base, request_id: 'PR-exp', kind: 'export' },
    { ...base, request_id: 'PR-acc', kind: 'access' },
    { ...base, request_id: 'PR-both', kind: 'export+deletion' },
    { ...base, request_id: 'PR-unk', kind: 'unspecified' },
    { ...base, request_id: 'PR-done', kind: 'export', status: 'completed' },
    { ...base, request_id: 'PR-other', kind: 'export', email_hash: 'someone-else' },
  ]
  const ex = completionPlan(rows, EMAIL, 'export')
  assert.deepEqual(ex.updates, [
    { requestId: 'PR-exp', part: 'export', close: true },
    { requestId: 'PR-acc', part: 'export', close: true },
    { requestId: 'PR-both', part: 'export', close: false },
  ], 'export closes export/access only; the combined request records the export part and stays open')
  assert.deepEqual(ex.untouched.map((u) => u.requestId).sort(), ['PR-del', 'PR-unk'])

  assert.deepEqual(completionPlan(rows, EMAIL, 'delete', { verified: false }).updates, [], 'an unverified deletion completes nothing')
  const del = completionPlan(rows, EMAIL, 'delete', { verified: true })
  assert.deepEqual(del.updates, [
    { requestId: 'PR-del', part: 'deletion', close: true },
    { requestId: 'PR-both', part: 'deletion', close: false },
  ], 'a combined request closes only when its export part is also done')
  assert.deepEqual(del.untouched.map((u) => u.requestId).sort(), ['PR-acc', 'PR-exp', 'PR-unk'])

  const exportDone = rows.map((r) => (r.request_id === 'PR-both' ? { ...r, export_completed_at: '2026-10-01T00:00:00Z' } : r))
  assert.deepEqual(completionPlan(exportDone, EMAIL, 'delete', { verified: true }).updates.find((u) => u.requestId === 'PR-both'), { requestId: 'PR-both', part: 'deletion', close: true })
  assert.deepEqual(exportStillOwed(rows, EMAIL).map((r) => r.request_id), ['PR-both'], 'apply-delete refuses while the combined export is owed')
  assert.deepEqual(exportStillOwed(exportDone, EMAIL), [])
})
