import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { ConditionFailedError } from '../data/memoryStore.mjs'
import { contactKeyFor } from '../lib/ids.mjs'
import { buildHandoff } from './service.mjs'
import { COPILOT_MARKER, PLAYERS, identityOf, stubEngines, supportServiceHarness } from './fixtures/world.mjs'

const P = (who) => identityOf(who)
const hash = (s) => createHash('sha256').update(s).digest('hex')
const SUPPORT_TYPES = new Set(['CASE', 'CEV', 'ATT', 'AUDIT', 'IDEM', 'INCIDENT', 'INCEV', 'SUP_COUNTER', 'SUP_CASENO', 'SUP_CASEID', 'SUP_EMAIL_OUT', 'SUP_EMAIL_MID', 'SUP_UNMATCHED', 'SUP_PROACTIVE', 'SUP_KBPROP', 'SUP_RATE'])

function seededCase(support, status) {
  const [category, v] = Object.entries(support.caseByCategory).find(([, x]) => x.status === status)
  return { category, ...v }
}
const eventsOf = async (store, caseNumber) => (await store.listAll()).filter((i) => i.type === 'CEV' && i.caseNumber === caseNumber)
let reqSeq = 0
const rid = () => `svc-req-${String((reqSeq += 1)).padStart(6, '0')}`

// ---- inbound email -----------------------------------------------------------------------

test('email: a certain, verified match from the owner is attached and follows the reply rules', async () => {
  const { service, store, support } = supportServiceHarness()
  const target = seededCase(support, 'waiting_on_player')
  const owner = PLAYERS[target.owner]
  const before = (await eventsOf(store, target.caseNumber)).length
  const out = await service.applyInboundEmailDecision({ action: 'attach', messageIdHash: hash('m1@example.test'), sender: { email: owner.email, verified: true }, match: { caseNumber: target.caseNumber, confidence: 'certain' }, subject: 'Re: case', text: 'Here is the screenshot you asked for' })
  assert.equal(out.status, 'attached')
  const events = await eventsOf(store, target.caseNumber)
  assert.equal(events.length, before + 2, 'the email plus the automatic status change')
  const mail = events.find((e) => e.kind === 'email_in' && e.body === 'Here is the screenshot you asked for')
  assert.equal(mail.visibility, 'public')
  const c = (await store.listAll()).find((i) => i.type === 'CASE' && i.caseNumber === target.caseNumber)
  assert.equal(c.status, 'in_progress', 'waiting_on_player -> in_progress on a reply')
})

test('email negative controls: uncertain / unverified / wrong owner are NEVER attached; automated ignored; duplicates dropped', async () => {
  const { service, store, support } = supportServiceHarness()
  const target = seededCase(support, 'waiting_on_player')
  const owner = PLAYERS[target.owner]
  const other = Object.values(PLAYERS).find((p) => p.email !== owner.email)
  const before = (await eventsOf(store, target.caseNumber)).length
  const variants = [
    [{ sender: { email: owner.email, verified: true }, match: { caseNumber: target.caseNumber, confidence: 'uncertain' } }, 'uncertain_match'],
    [{ sender: { email: owner.email, verified: false }, match: { caseNumber: target.caseNumber, confidence: 'certain' } }, 'unverified_sender'],
    [{ sender: { email: other.email, verified: true }, match: { caseNumber: target.caseNumber, confidence: 'certain' } }, 'case_owner_mismatch'],
    [{ sender: { email: owner.email, verified: true }, match: { caseNumber: target.caseNumber, confidence: 'certain', contactKey: contactKeyFor(other.email) } }, 'contact_mismatch'],
    [{ sender: { email: owner.email, verified: true }, match: { caseNumber: 'R6-999999', confidence: 'certain' } }, 'case_not_found'],
  ]
  for (const [i, [d, reason]] of variants.entries()) {
    const out = await service.applyInboundEmailDecision({ action: 'attach', messageIdHash: hash(`neg-${i}`), subject: 's', text: `secret-ish text ${i}`, ...d })
    assert.equal(out.status, 'unmatched', reason)
    assert.equal(out.reason, reason)
  }
  assert.equal((await eventsOf(store, target.caseNumber)).length, before, 'nothing was attached to the case')
  const unmatched = await service.listUnmatchedEmail(P('agent'))
  assert.equal(unmatched.items.length, variants.length)

  const auto = await service.applyInboundEmailDecision({ action: 'attach', automated: true, messageIdHash: hash('auto-1'), sender: { email: owner.email, verified: true }, match: { caseNumber: target.caseNumber, confidence: 'certain' }, text: 'Out of office' })
  assert.equal(auto.status, 'ignored')
  assert.equal((await service.applyInboundEmailDecision({ action: 'ignore', messageIdHash: hash('auto-2'), reason: 'mailer_daemon' })).status, 'ignored')
  assert.equal((await eventsOf(store, target.caseNumber)).length, before)

  const first = await service.applyInboundEmailDecision({ action: 'unmatched', messageIdHash: hash('dup'), sender: { email: 'stranger@example.com' }, text: 'hello' })
  assert.equal(first.status, 'unmatched')
  assert.deepEqual(await service.applyInboundEmailDecision({ action: 'attach', messageIdHash: hash('dup'), sender: { email: owner.email, verified: true }, match: { caseNumber: target.caseNumber, confidence: 'certain' }, text: 'x' }), { status: 'duplicate' })
  await assert.rejects(() => service.applyInboundEmailDecision({ action: 'attach', messageIdHash: 'not-a-hash' }), /sha256/)
})

test('email: new cases only for a verified sender with an account; unknown addresses go to review', async () => {
  const { service, store } = supportServiceHarness({ seedCases: false })
  const ok = await service.applyInboundEmailDecision({ action: 'new_case', messageIdHash: hash('new-1'), sender: { email: PLAYERS.b.email, verified: true }, match: { confidence: 'certain', contactKey: contactKeyFor(PLAYERS.b.email) }, subject: 'Help', text: 'My VOD review is stuck' })
  assert.equal(ok.status, 'new_case')
  const c = (await store.listAll()).find((i) => i.type === 'CASE' && i.caseNumber === ok.caseNumber)
  assert.equal(c.source, 'email')
  assert.equal(c.contactKey, contactKeyFor(PLAYERS.b.email))
  const nobody = await service.applyInboundEmailDecision({ action: 'new_case', messageIdHash: hash('new-2'), sender: { email: 'nobody.here@example.com', verified: true }, match: { confidence: 'certain' }, text: 'Hi' })
  assert.deepEqual([nobody.status, nobody.reason], ['unmatched', 'no_account'])
})

test('email: staff assign an unmatched email as a STAFF-ONLY event; it cannot be assigned twice', async () => {
  const { service, store, support } = supportServiceHarness()
  const target = seededCase(support, 'in_progress')
  const u = await service.applyInboundEmailDecision({ action: 'attach', messageIdHash: hash('um-1'), sender: { email: PLAYERS[target.owner].email, verified: false }, match: { caseNumber: target.caseNumber, confidence: 'certain' }, text: 'UNVERIFIED_BODY' })
  const assigned = await service.assignUnmatched(P('agent'), u.id, { caseNumber: target.caseNumber })
  assert.equal(assigned.ok, true)
  const ev = (await eventsOf(store, target.caseNumber)).find((e) => e.body === 'UNVERIFIED_BODY')
  assert.equal(ev.visibility, 'staff')
  const view = await service.getMyCase(P(target.owner), target.caseNumber)
  assert.ok(!JSON.stringify(view).includes('UNVERIFIED_BODY'))
  await assert.rejects(() => service.assignUnmatched(P('agent'), u.id, { caseNumber: target.caseNumber }), (e) => e.statusCode === 409)
  await assert.rejects(() => service.assignUnmatched(P('a'), u.id, { caseNumber: target.caseNumber }), (e) => e.statusCode === 403)
})

// ---- proactive ------------------------------------------------------------------------------

test('proactive: dry run by default, flag required, dedupe markers, never visible to or messaging the player', async () => {
  const findings = [
    // The window must be the ISO week of the clock (SUPPORT_NOW -> 2026-W39).
    { ruleId: 'paid_unbound', email: PLAYERS.c.email, window: '2026-W39', category: 'access_entitlement', subject: 'Paid row not bound', description: 'Paid but no identity binding', evidence: [{ label: 'row', value: 'active' }] },
    { ruleId: 'provider_down', scope: 'global', service: 'identity_ubisoft', summary: 'Ubisoft refresh failing for many players' },
    { ruleId: 'BAD RULE', email: PLAYERS.c.email, window: 'x' },
  ]
  const off = supportServiceHarness({ seedCases: false })
  await assert.rejects(() => off.service.recordProactive(P('lead'), findings, { dryRun: false }), (e) => e.statusCode === 409)
  const dry = await off.service.recordProactive(P('lead'), findings)
  assert.equal(dry.dryRun, true)
  assert.equal(dry.wouldCreate.length, 1)
  assert.equal(dry.incidentSuggestions.length, 1, 'global findings suggest an incident, not per-player cases')
  assert.equal(dry.skipped, 1)
  assert.equal((await off.store.listAll()).filter((i) => i.type === 'CASE' || i.type === 'SUP_PROACTIVE').length, 0, 'a dry run writes no case and no marker')
  await assert.rejects(() => off.service.recordProactive(P('agent'), findings), (e) => e.statusCode === 403)

  const on = supportServiceHarness({ seedCases: false, config: { support: { proactive: true } } })
  const run = await on.service.recordProactive(P('lead'), findings, { dryRun: false })
  assert.equal(run.created.length, 1)
  const again = await on.service.recordProactive(P('lead'), findings, { dryRun: false })
  assert.equal(again.created.length, 0)
  assert.equal(again.duplicates.length, 1)
  const dryAfter = await on.service.recordProactive(P('lead'), findings)
  assert.equal(dryAfter.duplicates.length, 1)
  const all = await on.store.listAll()
  const cases = all.filter((i) => i.type === 'CASE')
  assert.equal(cases.length, 1)
  assert.equal(cases[0].source, 'proactive')
  assert.equal(cases[0].status, 'new')
  assert.equal(cases[0].playerVisible, false)
  assert.equal(all.filter((i) => i.type === 'CEV' && i.visibility === 'public').length, 0, 'no player-visible event')
  assert.equal(all.filter((i) => i.type === 'MSG').length, 0, 'no conversation message')
  assert.equal((await on.service.listMyCases(P('c'))).total, 0)
  await assert.rejects(() => on.service.getMyCase(P('c'), cases[0].caseNumber), (e) => e.statusCode === 404)
})

test('proactive run feeds the engine copies of the directory ({ contacts, now, existingMarkers, providerHealth })', async () => {
  let contacts = null
  let seen = null
  const { engines } = stubEngines({
    evaluateProactive: (input) => {
      seen = input
      contacts = input.contacts.map((c) => ({ key: c.contactKey, hasOne: Boolean(c.one?.sources), hasFacts: Boolean(c.facts?.billing) }))
      input.contacts.length = 0 // mutating the copy must not matter
      return { findings: [{ ruleId: 'stalled', email: PLAYERS.a.email, window: '2026-W39', subject: 'Stalled onboarding' }] }
    },
  })
  const h = supportServiceHarness({ engines, seedCases: false })
  const out = await h.service.runProactive(P('lead'))
  assert.equal(out.dryRun, true, 'dry run is the default')
  assert.equal(out.wouldCreate.length, 1)
  assert.ok(seen && typeof seen.now === 'number' && Array.isArray(seen.existingMarkers) && Array.isArray(seen.providerHealth))
  assert.ok(contacts.length > 10 && contacts.every((c) => c.key.startsWith('pl_') && c.hasOne && c.hasFacts))
  assert.equal((await h.store.listAll()).filter((i) => i.type === 'CASE').length, 0)
  assert.equal(h.tablesUnchanged(), true)
  await assert.rejects(() => h.service.runProactive(P('agent')), (e) => e.statusCode === 403)
})

// ---- sensitive actions -------------------------------------------------------------------------

test('entitlement repair only via an action request: requested -> authorized -> done_externally; no table is ever written', async () => {
  const { service, store, tableCalls, tablesUnchanged } = supportServiceHarness()
  const before = new Map((await store.listAll()).map((i) => [`${i.pk}|${i.sk}`, JSON.stringify(i)]))
  const created = await service.createCase(P('d'), { text: 'I paid but I am locked out', category: 'access_entitlement', clientRequestId: rid() })
  const cn = created.case.caseNumber
  await assert.rejects(() => service.createActionRequest(P('agent'), cn, { kind: 'entitlement_repair', reason: 'x' }), (e) => e.statusCode === 403, 'agents cannot request billing actions')
  await assert.rejects(() => service.createActionRequest(P('billing'), cn, { kind: 'grant_access_now', reason: 'x' }), (e) => e.statusCode === 400)
  const ar = await service.createActionRequest(P('billing'), cn, { kind: 'entitlement_repair', reason: 'Row shows canceled; player sent receipt' })
  assert.equal(ar.status, 'requested')
  assert.equal(ar.executesInSupport, false)
  await assert.rejects(() => service.decideActionRequest(P('billing'), cn, ar.requestId, { decision: 'authorize' }), (e) => e.statusCode === 403, 'only lead/admin authorize')
  await assert.rejects(() => service.decideActionRequest(P('billing'), cn, ar.requestId, { decision: 'done_externally', note: 'done' }), (e) => e.statusCode === 409, 'cannot be done before it is authorized')
  const auth = await service.decideActionRequest(P('lead'), cn, ar.requestId, { decision: 'authorize' })
  assert.equal(auth.status, 'authorized')
  await assert.rejects(() => service.decideActionRequest(P('lead'), cn, ar.requestId, { decision: 'authorize' }), (e) => e.statusCode === 409)
  await assert.rejects(() => service.decideActionRequest(P('billing'), cn, ar.requestId, { decision: 'done_externally' }), (e) => e.statusCode === 400, 'a note is required')
  const done = await service.decideActionRequest(P('billing'), cn, ar.requestId, { decision: 'done_externally', note: 'Re-applied in Stripe dashboard; access restored by webhook' })
  assert.equal(done.status, 'done_externally')
  assert.deepEqual(done.history.map((h) => h.status), ['requested', 'authorized', 'done_externally'])
  await assert.rejects(() => service.decideActionRequest(P('lead'), cn, ar.requestId, { decision: 'execute' }), (e) => e.statusCode === 400)

  // Only the customer-success table changed, and only with support items.
  assert.equal(tablesUnchanged(), true, 'no subscription/profile/Cognito/player-data row changed')
  assert.ok(tableCalls.every((c) => !c.write), `only reads: ${[...new Set(tableCalls.map((c) => c.method))]}`)
  for (const item of await store.listAll()) {
    const key = `${item.pk}|${item.sk}`
    if (before.get(key) === JSON.stringify(item)) continue
    assert.ok(SUPPORT_TYPES.has(item.type), `unexpected write of ${item.type}`)
  }
  const audits = (await store.listAll()).filter((i) => i.type === 'AUDIT' && i.action.startsWith('support.action_request.')).map((i) => i.action).sort()
  assert.deepEqual(audits, ['support.action_request.authorize', 'support.action_request.create', 'support.action_request.done_externally'])
})

// ---- concurrency and audit ---------------------------------------------------------------------

test('case-number counter: optimistic retries on conflict and parallel creates get distinct numbers', async () => {
  let fails = 2
  const storeWrap = (s) => ({
    ...s,
    async put(item, opts) {
      if (item.pk === 'SUP#COUNTER' && fails > 0) {
        fails -= 1
        throw new ConditionFailedError('simulated concurrent writer')
      }
      return s.put(item, opts)
    },
  })
  const { service, store } = supportServiceHarness({ storeWrap })
  const one = await service.createCase(P('a'), { text: 'Game crashes on launch', clientRequestId: rid() })
  assert.equal(fails, 0, 'two conflicts were retried')
  assert.equal(one.case.caseNumber, 'R6-000025', 'numbers continue from the seeded counter')
  const many = await Promise.all(['a', 'b', 'c', 'd', 'b'].map((w) => service.createCase(P(w), { text: 'Parallel case text', clientRequestId: rid() })))
  const numbers = many.map((m) => m.case.caseNumber)
  assert.equal(new Set(numbers).size, 5)
  const lookups = (await store.listAll()).filter((i) => i.type === 'SUP_CASENO')
  assert.equal(new Set(lookups.map((l) => l.sk)).size, lookups.length)
})

test('every write is audited, with unique keys under a same-millisecond burst', async () => {
  const { service, store, support } = supportServiceHarness()
  const target = seededCase(support, 'in_progress')
  await Promise.all(Array.from({ length: 40 }, (_, i) => service.addPrivateNote(P('agent'), target.caseNumber, { text: `burst note ${i}` })))
  const all = await store.listAll()
  const notes = all.filter((i) => i.type === 'CEV' && i.kind === 'note_private' && i.body?.startsWith('burst note'))
  assert.equal(notes.length, 40)
  assert.equal(new Set(notes.map((n) => n.sk)).size, 40)
  const audits = all.filter((i) => i.type === 'AUDIT' && i.action === 'support.case.note')
  assert.equal(audits.length, 40)
  assert.equal(new Set(audits.map((a) => a.sk)).size, 40)
  assert.ok(audits.every((a) => !JSON.stringify(a.detail).includes('burst note')), 'audit detail never copies free text')
})

test('audit coverage: each write method leaves its audit action', async () => {
  const h = supportServiceHarness({ config: { support: { attachments: true, proactive: true } } })
  const { service, store, clockRef } = h
  const c = (await service.createCase(P('a'), { text: 'My Ubisoft link keeps failing', clientRequestId: rid() })).case.caseNumber
  await service.addPlayerMessage(P('a'), c, { text: 'more detail', clientRequestId: rid() })
  await service.requestAttachmentUpload(P('a'), c, { name: 'shot.png', mime: 'image/png', size: 1000 })
  await service.staffReply(P('agent'), c, { text: 'On it', thenStatus: 'in_progress' })
  await service.addPrivateNote(P('agent'), c, { text: 'checked logs' })
  await service.assign(P('agent'), c, { assignee: 'me', team: 'player_data' })
  await service.setStatus(P('agent'), c, { status: 'waiting_on_player' })
  await service.setStatus(P('agent'), c, { status: 'in_progress' })
  const inc = await service.createIncident(P('lead'), { title: 'Ubisoft link failing', service: 'identity_ubisoft' })
  await service.updateIncident(P('lead'), inc.incidentId, { status: 'identified' })
  await service.addIncidentTimeline(P('lead'), inc.incidentId, { kind: 'note', text: 'Provider acknowledged' })
  await service.linkIncident(P('agent'), c, { incidentId: inc.incidentId })
  await service.escalate(P('agent'), c, { team: 'player_data', reason: 'Needs provider follow-up' })
  const res = await service.resolve(P('agent'), c, { summary: 'Provider fixed the refresh', code: 'fixed', learning: { docGap: true } })
  await service.decideKbProposal(P('lead'), res.kbProposal.id, { decision: 'accept', note: 'Write the article' })
  await service.submitCsat(P('a'), c, { rating: 4 })
  await service.reopen(P('a'), c, { text: 'It broke again' })
  const ar = await service.createActionRequest(P('agent'), c, { kind: 'identity_unlink', reason: 'Player asked to unlink' })
  await service.decideActionRequest(P('lead'), c, ar.requestId, { decision: 'reject', note: 'Not verified' })
  await service.resolve(P('agent'), c, { summary: 'Handled', code: 'answered' })
  await service.confirmResolved(P('a'), c)
  await service.recordProactive(P('lead'), [{ ruleId: 'r1', email: PLAYERS.b.email, window: '2026-W39', subject: 's' }], { dryRun: false })
  clockRef.now += 1000
  const actions = new Set((await store.listAll()).filter((i) => i.type === 'AUDIT').map((i) => i.action))
  for (const a of [
    'support.case.create', 'support.case.message_player', 'support.attachment.manifest', 'support.case.reply', 'support.case.note', 'support.case.assign', 'support.case.status',
    'support.incident.create', 'support.incident.update', 'support.incident.timeline', 'support.case.link_incident', 'support.case.escalate', 'support.case.resolve',
    'support.kb.propose', 'support.kb.accept', 'support.case.csat', 'support.case.reopen', 'support.action_request.create', 'support.action_request.reject',
    'support.case.confirm_resolved', 'support.proactive.run',
  ]) assert.ok(actions.has(a), `audited: ${a}`)
  const kb = await service.listKbProposals(P('agent'))
  assert.ok(kb.proposals.every((p) => p.published === false), 'accepting a proposal never publishes it')
})

// ---- copilot isolation / handoff ---------------------------------------------------------------

test('copilot gets frozen, function-free copies; its "execute" suggestions are never acted on', async () => {
  const { service, store, support, engineCalls } = supportServiceHarness()
  const target = seededCase(support, 'in_progress')
  const before = JSON.stringify(await store.listAll())
  const view = await service.getCaseForStaff(P('agent'), target.caseNumber)
  assert.equal(JSON.stringify(await store.listAll()), before, 'reading a case (and running the copilot) writes nothing')
  assert.equal(view.copilot.advisoryOnly, true)
  assert.ok(view.copilot.summary.text.includes(COPILOT_MARKER))
  const input = engineCalls.buildCopilot.at(-1)
  assert.equal(Object.isFrozen(input), true)
  assert.equal(Object.isFrozen(input.caseRecord), true)
  const hasFunction = (v) => typeof v === 'function' || (v && typeof v === 'object' && Object.values(v).some(hasFunction))
  assert.equal(hasFunction(input), false)
  assert.ok(!('store' in input) && !('ctx' in input))
  assert.equal(view.actionRequests.filter((r) => r.kind === 'refund').length, 0)
})

test('handoff text carries the story so the next team never restarts it', () => {
  const caseRecord = { caseNumber: 'R6-000077', category: 'vod_analysis', subcategory: null, priority: 'p2', severity: 'sev3', subject: 'VOD review stuck', description: 'Uploaded twice, still processing', status: 'in_progress', refs: { vodJob: 'job-1', incidentId: null } }
  const events = [
    { kind: 'message_player', at: '2026-09-25T10:00:00.000Z', body: 'Uploaded twice, still processing' },
    { kind: 'note_private', at: '2026-09-25T11:00:00.000Z', body: 'Checked usage counter: 7 of 10 used' },
    { kind: 'message_staff', at: '2026-09-25T11:05:00.000Z', body: 'Looking now' },
  ]
  const h = buildHandoff({ caseRecord, events, diagnostics: { panels: [{ id: 'vod', status: 'not_recorded' }, { id: 'account', status: 'ok' }] }, copilot: { summary: { text: 'Likely stuck job' } }, playerSummary: { planLabel: 'Pro', billingStatus: 'active' }, team: 'vod_ai', reason: 'Needs job inspection', by: 'agent@example.test', at: '2026-09-25T12:00:00.000Z' })
  for (const needle of ['R6-000077', 'vod_ai', 'Needs job inspection', 'Likely stuck job', 'vod: not_recorded', 'Checked usage counter', 'Uploaded twice', 'Pro', 'vodJob', 'Do not ask the player to repeat']) {
    assert.ok(h.text.includes(needle), needle)
  }
  assert.ok(!h.text.includes('account: ok'), 'healthy providers are not noise')
  assert.deepEqual(h.triedSoFar, { playerMessages: 1, publicReplies: 1, privateNotes: 1 })
})
