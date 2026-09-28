// Integration gaps closed by the reconciliation pass: store pagination,
// CORS, optimistic concurrency, email threading lookups, the
// claim-then-finalize email dedupe, the auto-close sweep, proactive rules
// over raw sources, player-data diagnostics, KB trend proposals and the
// Help Center preview override. Fictional data only.

import test from 'node:test'
import assert from 'node:assert/strict'
import * as realEngines from './engines.mjs'
import { caseTokenFor } from './email.mjs'
import { EMAIL_CLAIM_LEASE_MS } from './service.mjs'
import { PLAYERS, SUPPORT_NOW, identityOf, supportApp, supportServiceHarness } from './fixtures/world.mjs'
import { createDynamoStore, StoreLimitError } from '../data/dynamoStore.mjs'
import { corsHeaders } from '../lib/http.mjs'
import { contactKeyFor } from '../lib/ids.mjs'

// A fictional HMAC key for the plus-address tests (not a real secret).
const TOKEN_KEY = ['fixture', 'plus', 'address', 'key', '0123456789abcdef'].join('-')
const PASS = { spf: 'PASS', dkim: 'PASS', dmarc: 'PASS' }
const P = (who) => identityOf(who)
let seq = 0
const rid = () => `integ-${String((seq += 1)).padStart(6, '0')}`

function mail({ from, to = 'support@r6coaching.com', id, inReplyTo = null, subject = 'Re: my case', body = 'Still stuck. The review page went back to upload again.' }) {
  return [
    `From: Fixture Player <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Message-ID: <${id}@mail.example.test>`,
    ...(inReplyTo ? [`In-Reply-To: <${inReplyTo}>`] : []),
    'Date: Thu, 24 Sep 2026 14:00:00 +0000',
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\r\n')
}

async function newCase(h, who, text = 'My VOD review never finished') {
  const out = await h.service.createCase(P(who), { text, clientRequestId: rid() })
  const ref = await h.store.get('SUP#CASENO', out.case.caseNumber)
  return { caseNumber: out.case.caseNumber, caseId: ref.caseId }
}

const emailEvents = async (h, who, caseNumber) => (await h.service.getMyCase(P(who), caseNumber)).timeline.filter((e) => e.channel === 'email')
const markers = async (h) => (await h.store.listContact('SUP#EMAIL')).filter((i) => i.type === 'SUP_EMAIL_MID')

// ---- store pagination ------------------------------------------------------------------

function pagedDdb(pages, { failOn = null, endless = false } = {}) {
  const calls = []
  return {
    calls,
    async send(cmd) {
      const start = cmd.input.ExclusiveStartKey ? cmd.input.ExclusiveStartKey.page : 0
      calls.push({ start, limit: cmd.input.Limit })
      if (failOn === start) throw Object.assign(new Error('throttled'), { name: 'ProvisionedThroughputExceededException' })
      if (endless) return { Items: [{ pk: `p${start}` }], LastEvaluatedKey: { page: start + 1 } }
      return { Items: pages[start] || [], LastEvaluatedKey: start + 1 < pages.length ? { page: start + 1 } : undefined }
    },
  }
}

test('dynamoStore.listByType reads every page for all:true, honours limit, fails closed', async () => {
  const pages = [[{ id: 1 }, { id: 2 }], [{ id: 3 }], [{ id: 4 }]]
  const ddb = pagedDdb(pages)
  const store = createDynamoStore({ ddb, tableName: 't' })
  assert.deepEqual((await store.listByType('CASE', { all: true })).map((i) => i.id), [1, 2, 3, 4])
  assert.equal(ddb.calls.length, 3)
  assert.deepEqual((await createDynamoStore({ ddb: pagedDdb(pages), tableName: 't' }).listByType('CASE', { limit: 3 })).map((i) => i.id), [1, 2, 3], 'limit collects across pages, then stops')
  assert.deepEqual((await createDynamoStore({ ddb: pagedDdb(pages), tableName: 't' }).listByType('CASE')).length, 4, 'PR #24 default (limit 200) still returns everything under the limit')
  await assert.rejects(() => createDynamoStore({ ddb: pagedDdb(pages, { failOn: 1 }), tableName: 't' }).listByType('CASE', { all: true }), /throttled/, 'a page error rejects the whole read')
  await assert.rejects(() => createDynamoStore({ ddb: pagedDdb([], { endless: true }), tableName: 't' }).listByType('CASE', { all: true }), StoreLimitError, 'no silent truncation')
})

test('the support service lists every case (no 1,000-item cap) through the paginated read', async () => {
  const h = supportServiceHarness()
  let asked = null
  const original = h.store.listByType
  h.store.listByType = async (type, opts) => {
    asked = opts
    return original(type, opts)
  }
  const q = await h.service.queue(P('agent'), 'all_open')
  assert.equal(asked.all, true)
  assert.ok(q.cases.length > 0)
})

// ---- CORS and PATCH ---------------------------------------------------------------------

test('CORS allows PATCH; PATCH and the PUT alias both update an incident', async () => {
  assert.match(corsHeaders('https://r6coaching.com')['Access-Control-Allow-Methods'], /\bPATCH\b/)
  assert.match(corsHeaders('https://r6coaching.com')['Access-Control-Allow-Methods'], /\bPUT\b/)
  const app = supportApp()
  const pre = await app.call('OPTIONS', '/cs/admin/support/incidents/inc_fixture0001')
  assert.equal(pre.statusCode, 204)
  assert.match(pre.headers['Access-Control-Allow-Methods'], /PATCH/)
  const patched = await app.call('PATCH', '/cs/admin/support/incidents/inc_fixture0001', { who: 'lead', body: { workaround: 'Upload the screenshots again later.' } })
  assert.equal(patched.statusCode, 200)
  assert.equal(patched.json.workaround, 'Upload the screenshots again later.')
  const put = await app.call('PUT', '/cs/admin/support/incidents/inc_fixture0001', { who: 'lead', body: { status: 'identified' } })
  assert.equal(put.statusCode, 200)
  assert.equal(put.json.status, 'identified')
})

// ---- optimistic concurrency ----------------------------------------------------------------

test('staff writes that send a stale version get 409 version_conflict; no version = no check', async () => {
  const app = supportApp()
  const detail = await app.call('GET', '/cs/admin/support/cases/R6-000001', { who: 'agent' })
  const v = detail.json.case.version
  const moved = await app.call('POST', '/cs/admin/support/cases/R6-000001/status', { who: 'agent', body: { status: 'triaged', version: v } })
  assert.equal(moved.statusCode, 200)
  assert.equal(moved.json.version, v + 1)
  const stale = await app.call('POST', '/cs/admin/support/cases/R6-000001/assign', { who: 'agent', body: { assignee: 'me', version: v } })
  assert.equal(stale.statusCode, 409)
  assert.equal(stale.json.code, 'version_conflict')
  const bad = await app.call('POST', '/cs/admin/support/cases/R6-000001/assign', { who: 'agent', body: { assignee: 'me', version: 'latest' } })
  assert.equal(bad.statusCode, 400)
  const noCheck = await app.call('POST', '/cs/admin/support/cases/R6-000001/assign', { who: 'agent', body: { assignee: 'me' } })
  assert.equal(noCheck.statusCode, 200)
  const esc = await app.call('POST', '/cs/admin/support/cases/R6-000001/escalate', { who: 'agent', body: { team: 'billing', reason: 'x', handoff: 'client text' } })
  assert.equal(esc.statusCode, 400, 'the handoff is built server-side; a client handoff is refused')
})

// ---- email threading lookups -------------------------------------------------------------

test('email: a verified reply carrying a valid plus-address token attaches to that case', async () => {
  const h = supportServiceHarness({ engines: realEngines, seedCases: false, config: { support: { emailTokenSecret: TOKEN_KEY } } })
  const { caseNumber, caseId } = await newCase(h, 'b')
  const index = await h.store.get('SUP#CASEID', caseId)
  assert.equal(index.caseNumber, caseNumber, 'case-id index written at creation')
  assert.equal(index.contactKey, contactKeyFor(PLAYERS.b.email))
  const token = caseTokenFor(caseId, TOKEN_KEY)
  const out = await h.service.ingestInboundEmail({ raw: mail({ from: PLAYERS.b.email, to: `Recon 6 Support <support+${token}@r6coaching.com>`, id: 'tok-attach-1' }), verdicts: PASS })
  assert.equal(out.status, 'attached', JSON.stringify(out))
  assert.equal(out.caseNumber, caseNumber)
  assert.equal((await emailEvents(h, 'b', caseNumber)).length, 1)
  const [marker] = await markers(h)
  assert.equal(marker.state, 'done')
  assert.equal(marker.outcome, 'attached')
})

test('email: a token for someone else\'s case from a different sender goes to review, never onto that case', async () => {
  const h = supportServiceHarness({ engines: realEngines, seedCases: false, config: { support: { emailTokenSecret: TOKEN_KEY } } })
  const { caseNumber, caseId } = await newCase(h, 'b')
  const token = caseTokenFor(caseId, TOKEN_KEY)
  const out = await h.service.ingestInboundEmail({ raw: mail({ from: PLAYERS.c.email, to: `support+${token}@r6coaching.com`, id: 'tok-foreign-1' }), verdicts: PASS })
  assert.equal(out.status, 'unmatched')
  assert.equal(out.reason, 'sender_not_case_owner')
  assert.equal((await emailEvents(h, 'b', caseNumber)).length, 0, 'nothing reached the owner\'s case')
  const review = await h.service.listUnmatchedEmail(P('agent'))
  assert.equal(review.items.length, 1)
  assert.equal(review.items[0].senderEmail, PLAYERS.c.email)
  assert.equal(review.items[0].suggestedCaseNumber, caseNumber)

  // A forged token (wrong MAC) resolves to nothing at all.
  const forged = `${caseId}.0000000000000000`
  const out2 = await h.service.ingestInboundEmail({ raw: mail({ from: PLAYERS.b.email, to: `support+${forged}@r6coaching.com`, id: 'tok-forged-1' }), verdicts: PASS })
  assert.equal(out2.status, 'new_case', 'a forged token never threads; the verified known sender opens a new case')
  assert.notEqual(out2.caseNumber, caseNumber)
})

test('email: with no token secret configured, plus-address lookups return nothing', async () => {
  const h = supportServiceHarness({ engines: realEngines, seedCases: false })
  const { caseNumber, caseId } = await newCase(h, 'b')
  const token = caseTokenFor(caseId, TOKEN_KEY)
  const out = await h.service.ingestInboundEmail({ raw: mail({ from: PLAYERS.b.email, to: `support+${token}@r6coaching.com`, id: 'nosecret-1' }), verdicts: PASS })
  assert.equal(out.status, 'new_case')
  assert.notEqual(out.caseNumber, caseNumber)
  assert.equal((await emailEvents(h, 'b', caseNumber)).length, 0)
})

test('email: References threading uses stored outbound Message-IDs (empty until outbound email exists)', async () => {
  const h = supportServiceHarness({ engines: realEngines, seedCases: false })
  const { caseNumber } = await newCase(h, 'b')
  const outbound = async () => (await h.store.listContact('SUP#EMAIL')).filter((i) => i.type === 'SUP_EMAIL_OUT')
  await h.service.staffReply(P('agent'), caseNumber, { text: 'What time did it happen?' })
  assert.equal((await outbound()).length, 0, 'a timeline-only reply stores no Message-ID')
  const reply = await h.service.staffReply(P('agent'), caseNumber, { text: 'Which map was it?' }, { emailMessageId: '<support-reply-1@r6coaching.com>' })
  assert.equal(reply.delivery, 'email')
  assert.equal((await outbound()).length, 1)
  const out = await h.service.ingestInboundEmail({ raw: mail({ from: PLAYERS.b.email, id: 'answer-1', inReplyTo: 'support-reply-1@r6coaching.com' }), verdicts: PASS })
  assert.equal(out.status, 'attached', JSON.stringify(out))
  assert.equal(out.caseNumber, caseNumber)

  const app = supportApp()
  const viaHttp = await app.call('POST', '/cs/admin/support/cases/R6-000001/messages', { who: 'agent', body: { text: 'x', emailMessageId: '<forged@r6coaching.com>' } })
  assert.equal(viaHttp.statusCode, 400, 'the Message-ID cannot be set from HTTP')
})

// ---- claim-then-finalize dedupe --------------------------------------------------------------

test('email dedupe: a crash mid-apply marks the claim failed; the retry applies it exactly once', async () => {
  let failOnce = true
  const storeWrap = (store) => ({
    ...store,
    async put(item, opts) {
      if (failOnce && item.type === 'CEV' && item.kind === 'email_in') {
        failOnce = false
        throw new Error('simulated crash')
      }
      return store.put(item, opts)
    },
  })
  const h = supportServiceHarness({ engines: realEngines, seedCases: false, storeWrap, config: { support: { emailTokenSecret: TOKEN_KEY } } })
  const { caseNumber, caseId } = await newCase(h, 'b')
  const raw = mail({ from: PLAYERS.b.email, to: `support+${caseTokenFor(caseId, TOKEN_KEY)}@r6coaching.com`, id: 'crash-1' })
  await assert.rejects(() => h.service.ingestInboundEmail({ raw, verdicts: PASS }), /simulated crash/)
  assert.equal((await markers(h))[0].state, 'failed', 'the message is not marked handled')
  const retry = await h.service.ingestInboundEmail({ raw, verdicts: PASS })
  assert.equal(retry.status, 'attached')
  const again = await h.service.ingestInboundEmail({ raw, verdicts: PASS })
  assert.equal(again.status, 'duplicate')
  assert.equal((await emailEvents(h, 'b', caseNumber)).length, 1)
})

test('email dedupe: a claim left processing is reclaimable after the lease, and the apply is idempotent', async () => {
  const h = supportServiceHarness({ engines: realEngines, seedCases: false, config: { support: { emailTokenSecret: TOKEN_KEY } } })
  const { caseNumber, caseId } = await newCase(h, 'b')
  const raw = mail({ from: PLAYERS.b.email, to: `support+${caseTokenFor(caseId, TOKEN_KEY)}@r6coaching.com`, id: 'lease-1' })
  assert.equal((await h.service.ingestInboundEmail({ raw, verdicts: PASS })).status, 'attached')
  const [marker] = await markers(h)

  // As if the Lambda died after the case event but before finalizing.
  await h.store.update(marker.pk, marker.sk, { state: 'processing', claimedAt: new Date(SUPPORT_NOW - EMAIL_CLAIM_LEASE_MS - 1000).toISOString() })
  const reclaimed = await h.service.ingestInboundEmail({ raw, verdicts: PASS })
  assert.equal(reclaimed.status, 'attached')
  assert.equal(reclaimed.replayed, true, 'recognised as already applied')
  assert.equal((await emailEvents(h, 'b', caseNumber)).length, 1, 'never doubled')
  assert.equal((await markers(h))[0].state, 'done')

  // A live claim (inside the lease) blocks a concurrent copy.
  await h.store.update(marker.pk, marker.sk, { state: 'processing', claimedAt: new Date(SUPPORT_NOW).toISOString() })
  assert.equal((await h.service.ingestInboundEmail({ raw, verdicts: PASS })).status, 'duplicate')
})

test('email dedupe: an unmatched message retried after a crash yields one review item', async () => {
  const h = supportServiceHarness({ engines: realEngines, seedCases: false })
  const raw = mail({ from: 'stranger@example.test', id: 'stranger-1' })
  assert.equal((await h.service.ingestInboundEmail({ raw, verdicts: PASS })).status, 'unmatched')
  const [marker] = await markers(h)
  await h.store.update(marker.pk, marker.sk, { state: 'failed' })
  assert.equal((await h.service.ingestInboundEmail({ raw, verdicts: PASS })).status, 'unmatched')
  assert.equal((await h.service.listUnmatchedEmail(P('agent'))).items.length, 1)
})

// ---- auto-close sweep -------------------------------------------------------------------------

test('auto-close: dry run by default, lead/admin only, closes resolved cases after 7 days, audited, idempotent', async () => {
  const h = supportServiceHarness()
  await assert.rejects(() => h.service.runAutoClose(P('agent'), { dryRun: true }), (e) => e.statusCode === 403)
  const dry = await h.service.runAutoClose(P('lead'))
  assert.equal(dry.dryRun, true)
  assert.ok(dry.due.length >= 1)
  assert.equal(dry.closed.length, 0)
  for (const d of dry.due) {
    const ref = await h.store.get('SUP#CASENO', d.caseNumber)
    assert.equal((await h.store.get(`C#${ref.contactKey}`, `CASE#${ref.caseId}`)).status, 'resolved', 'a dry run changes nothing')
  }

  // A case resolved today is not due.
  const fresh = await newCase(h, 'a', 'Where do I change my platform?')
  await h.service.setStatus(P('agent'), fresh.caseNumber, { status: 'in_progress' })
  await h.service.resolve(P('agent'), fresh.caseNumber, { summary: 'Explained the profile setting.', code: 'answered' })

  const run = await h.service.runAutoClose(P('admin'), { dryRun: false })
  assert.deepEqual([...run.closed].sort(), dry.due.map((d) => d.caseNumber).sort())
  assert.ok(!run.closed.includes(fresh.caseNumber))
  const first = dry.due[0].caseNumber
  const staffView = await h.service.getCaseForStaff(P('lead'), first)
  assert.equal(staffView.case.status, 'closed')
  assert.ok(staffView.timeline.some((e) => e.kind === 'status_change' && e.data?.rule === 'auto_close_after_resolve' && e.actor.kind === 'system'))
  assert.ok(staffView.audit.some((a) => a.action === 'support.case.auto_close'))
  const runAudit = (await h.store.listContact('SUP#AUDIT')).filter((i) => i.action === 'support.maintenance.auto_close')
  assert.equal(runAudit.length, 1)
  assert.equal((await h.service.runAutoClose(P('lead'), { dryRun: false })).closed.length, 0, 're-running is a no-op')
})

test('auto-close route: POST /cs/admin/support/maintenance/auto-close is a dry run unless dryRun=0', async () => {
  const app = supportApp()
  assert.equal((await app.call('POST', '/cs/admin/support/maintenance/auto-close', { who: 'agent' })).statusCode, 403)
  assert.equal((await app.call('POST', '/cs/admin/support/maintenance/auto-close', { who: 'a' })).statusCode, 403)
  const dry = await app.call('POST', '/cs/admin/support/maintenance/auto-close', { who: 'lead' })
  assert.equal(dry.statusCode, 200)
  assert.equal(dry.json.dryRun, true)
  const real = await app.call('POST', '/cs/admin/support/maintenance/auto-close?dryRun=0', { who: 'lead' })
  assert.equal(real.json.dryRun, false)
  assert.equal(real.json.closed.length, dry.json.due.length)
  assert.equal(app.tablesUnchanged(), true)
  const off = supportApp({ supportFlag: false })
  assert.equal((await off.call('POST', '/cs/admin/support/maintenance/auto-close', { who: 'lead' })).statusCode, 404)
})

// ---- proactive rules over raw sources ------------------------------------------------------------

test('proactive: raw sources reach the engine, so identity-binding and paid-package rules run; provider health is read', async () => {
  const addPackage = (world) => world.bookings.push({ slotId: '2026-09-20T15:00:00.000Z', status: 'confirmed', customer: { email: PLAYERS.a.email, name: 'Fixture' }, coachingType: 'package', payment: { status: 'paid' } })
  const h = supportServiceHarness({ engines: realEngines, seedCases: false, playerData: true, extendWorld: addPackage })
  const out = await h.service.runProactive(P('lead'), { dryRun: true })
  assert.equal(out.dryRun, true)
  assert.equal(out.providerHealthStatus, 'ok')
  assert.ok(out.evaluatedContacts > 0)
  const has = (ruleId, email) => out.wouldCreate.some((f) => f.ruleId === ruleId && f.contactKey === contactKeyFor(email))
  assert.ok(has('paid_past_due_or_unbound', 'locked.breacher@example.test'), 'live paid row with no login binding')
  assert.ok(has('coaching_purchase_no_credits', PLAYERS.a.email), 'paid package booking without a credits row')
  assert.ok(out.incidentSuggestions.some((s) => s.ruleId === 'provider_global_failure'), 'a provider down globally suggests an incident')
  assert.equal(out.created.length, 0)
  assert.equal(h.tablesUnchanged(), true)
})

// ---- diagnostics over player-data history -------------------------------------------------------

test('staff diagnostics read snapshots/identities/provider health (as data, read-only); players never see ids', async () => {
  const app = supportApp({ engines: realEngines, seedCases: false, playerData: true })
  const created = await app.call('POST', '/cs/me/support/cases', { who: 'scn-paying_active', body: { text: 'My rank on Recon is two divisions lower than in game', category: 'rank_stat_discrepancy', clientRequestId: rid() } })
  assert.equal(created.statusCode, 201)
  const cn = created.json.case.caseNumber
  const lead = await app.call('GET', `/cs/admin/support/cases/${cn}`, { who: 'lead' })
  const conns = lead.json.diagnostics.context.connections
  assert.equal(conns.find((c) => c.source === 'ubisoft').linked, true)
  assert.ok(conns.find((c) => c.source === 'ubisoft').lastSuccessAt)
  assert.equal(conns.find((c) => c.source === 'psn').errorClass, 'global_down')
  assert.equal(lead.json.diagnostics.panels.find((p) => p.id === 'connections').status, 'ok')
  const mine = await app.call('GET', `/cs/me/support/cases/${cn}`, { who: 'scn-paying_active' })
  assert.ok(!mine.body.includes('snap-vex'), 'no snapshot ids in the player view')
  assert.ok(!mine.body.includes('fixture-ubi'), 'no external ids in the player view')
  assert.equal(app.tablesUnchanged(), true)
  assert.ok(app.tableCalls.some((c) => c.method === 'playerSnapshots'))
  assert.ok(app.tableCalls.every((c) => !c.write))
})

// ---- UI projections backed by real data --------------------------------------------------------

test('queue rows carry player display name, plan label and a summary SLA state; the staff case carries me, uploads, audit', async () => {
  const app = supportApp()
  const q = await app.call('GET', '/cs/admin/support/queue?view=all_open', { who: 'agent' })
  assert.equal(q.json.me, 'support.agent@example.test')
  const row = q.json.cases[0]
  assert.equal(row.player.key, row.contactKey)
  assert.ok(q.json.cases.some((r) => r.player.handle && r.player.handle.startsWith('FixturePlayer')))
  assert.ok(q.json.cases.every((r) => ['overdue', 'at_risk', 'on_track', 'none'].includes(r.sla.state)))
  const d = await app.call('GET', `/cs/admin/support/cases/${row.caseNumber}`, { who: 'agent' })
  assert.equal(d.json.me, 'support.agent@example.test')
  assert.deepEqual(d.json.uploads, { enabled: false, reason: 'Attachment storage is not switched on yet.' })
  assert.ok(Array.isArray(d.json.audit))
  await app.call('POST', `/cs/admin/support/cases/${row.caseNumber}/notes`, { who: 'agent', body: { text: 'Checked the usage counter.', clientRequestId: rid() } })
  const after = await app.call('GET', `/cs/admin/support/cases/${row.caseNumber}`, { who: 'agent' })
  assert.ok(after.json.audit.some((a) => a.action === 'support.case.note' && a.detail.caseNumber === row.caseNumber))
})

// ---- Help Center: drafts only through the dev preview override -------------------------------

test('help: production engines never serve drafts; only a dev override with helpPreview does, and says so', async () => {
  assert.equal('helpPreview' in realEngines, false, 'the production engines module never enables drafts')
  const prod = supportApp({ engines: realEngines, seedCases: false })
  const list = await prod.call('GET', '/cs/help/articles')
  assert.equal(list.statusCode, 200)
  assert.deepEqual(list.json.articles, [], 'every article is still a draft')
  assert.equal(list.json.preview, undefined)
  assert.equal((await prod.call('GET', '/cs/help/articles/connect-your-gaming-account')).statusCode, 404)

  const drafts = {
    ...realEngines,
    listArticles: (o) => realEngines.listArticles({ ...o, includeDrafts: true }),
    searchHelp: (q, o) => realEngines.searchHelp(q, { ...o, includeDrafts: true }),
    getArticle: (s, o) => realEngines.getArticle(s, { ...o, includeDrafts: true }),
  }
  const noFlag = supportApp({ engines: drafts, seedCases: false })
  assert.deepEqual((await noFlag.call('GET', '/cs/help/articles')).json.articles, [], 'an engine returning drafts is not enough')
  assert.equal((await noFlag.call('GET', '/cs/help/articles/connect-your-gaming-account')).statusCode, 404)

  const preview = supportApp({ engines: { ...drafts, helpPreview: true }, seedCases: false })
  const home = await preview.call('GET', '/cs/help/articles')
  assert.ok(home.json.articles.length > 5)
  assert.equal(home.json.preview, true)
  assert.ok(home.json.articles.every((a) => a.status === 'draft' && !('body' in a)))
  const search = await preview.call('GET', '/cs/help/articles?q=vod review stuck')
  assert.ok(search.json.articles.length > 0)
  const article = await preview.call('GET', '/cs/help/articles/connect-your-gaming-account')
  assert.equal(article.statusCode, 200)
  assert.equal(article.json.preview, true)
})

// ---- KB trend proposals ------------------------------------------------------------------------

test('KB: case trends become proposals on read, never stored or published', async () => {
  const h = supportServiceHarness({ engines: realEngines, seedCases: false })
  for (const who of ['a', 'b', 'c']) await h.service.createCase(P(who), { text: 'VOD review failed after upload', category: 'vod_analysis', clientRequestId: rid() })
  const out = await h.service.listKbProposals(P('agent'))
  const trend = out.trendProposals.find((p) => p.category === 'vod_analysis')
  assert.ok(trend, JSON.stringify(out.trendProposals))
  assert.equal(trend.stored, false)
  assert.equal(trend.publish, false)
  assert.equal(trend.evidence.caseCount, 3)
  assert.deepEqual(out.proposals, [])
  assert.equal((await h.store.listContact('SUP#KBPROP')).length, 0)
})
