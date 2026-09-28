// Permanent regression tests for the adversarial security review of the
// Player Success & Support module (fifteen findings, SEC-01 .. SEC-15). Each
// test reproduces a probe that failed before the fix. All data is fictional
// (example.test addresses, FIXTURE ids). Key-shaped test values are built at
// runtime so no key-shaped literal appears in this file.

import test from 'node:test'
import assert from 'node:assert/strict'
import { parseInboundEmail, senderVerified, ingestInboundEmail as legacyIngest } from '../inbound.mjs'
import { matchPath } from '../lib/http.mjs'
import { createMemoryStore } from '../data/memoryStore.mjs'
import { contactKeyFor } from '../lib/ids.mjs'
import { redactSensitive } from './redact.mjs'
import { caseTokenFor, htmlToText } from './email.mjs'
import { projectPlayerCase } from './service.mjs'
import { isoWeek } from './diagnostics/shared.mjs'
import * as realEngines from './engines.mjs'
import { FAKE_STRIPE, PLAYERS, SUPPORT_NOW, identityOf, stubEngines, supportApp, supportServiceHarness } from './fixtures/world.mjs'

const P = (who) => identityOf(who)
const keyOf = (who) => contactKeyFor(PLAYERS[who].email)
let seq = 0
const rid = (p = 'sec') => `${p}-${String((seq += 1)).padStart(8, '0')}`

// Runtime-built key prefixes (see redact.test.mjs).
const SK_LIVE = ['sk', 'live', ''].join('_')
const RK_LIVE = ['rk', 'live', ''].join('_')
const WHSEC = ['whsec', ''].join('_')
const AKIA = ['AK', 'IA'].join('')
// A fake 40-character AWS-secret-shaped value (and a 40-character variant
// without separators), assembled so no secret-shaped literal is in the file.
const AWS_SECRET = ['wJalrXUtnFEMI', 'K7MDENG', 'bPxRfiCYFIXTUREKEY'].join('/')
const AWS_SECRET_PLAIN = ['wJalrXUtnFEMIK7MDENG', 'bPxRfiCYFIXTUREKEY0'].join('')

const SECRET = ['fixture', 'security', 'plus', 'token', 'key', '0123456789'].join('-')
const PASS = { spf: 'PASS', dkim: 'PASS', dmarc: 'PASS' }

let mailSeq = 0
function mail({ from, to = 'support@r6coaching.com', id = `sec-${(mailSeq += 1)}`, subject = 'Re: case', body = 'Still stuck after the fix.', contentType = 'text/plain; charset=utf-8', extraHeaders = [] }) {
  return [`From: ${from}`, ...extraHeaders, `To: ${to}`, `Subject: ${subject}`, `Message-ID: <${id}@mail.example.test>`, 'Date: Thu, 24 Sep 2026 14:00:00 +0000', `Content-Type: ${contentType}`, '', body].join('\r\n')
}

function emailHarness(extra = {}) {
  return supportServiceHarness({ engines: realEngines, config: { support: { emailTokenSecret: SECRET, ...extra } } })
}
async function newCase(h, who, text = 'My VOD review never finished') {
  const out = await h.service.createCase(P(who), { text, clientRequestId: rid() })
  const ref = await h.store.get('SUP#CASENO', out.case.caseNumber)
  return { caseNumber: out.case.caseNumber, caseId: ref.caseId }
}
const emailEventsOf = async (store, who) => (await store.listContact(`C#${keyOf(who)}`)).filter((i) => i.type === 'CEV' && i.kind === 'email_in')

// ---- SEC-01 (BLOCKER) encoded-word From smuggling ---------------------------------------------

test('SEC-01a parseInboundEmail takes the addr-spec from the RAW From header; an encoded word is display text only', () => {
  const victim = PLAYERS.a.email
  const smuggled = Buffer.from(`<${victim}>`).toString('base64')
  const parsed = parseInboundEmail(mail({ from: `<attacker@evil.test> =?utf-8?B?${smuggled}?=` }))
  assert.notEqual(parsed.from, victim, 'the decoded encoded word must never become the sender address')
  assert.equal(parsed.fromStatus, 'trailing_text')
  assert.equal(senderVerified(PASS, parsed), false, 'text after the addr-spec makes the sender unverified')
  // The display name is still decoded for display.
  const named = parseInboundEmail(mail({ from: `=?utf-8?B?${Buffer.from('Player Ä').toString('base64')}?= <${victim}>` }))
  assert.equal(named.from, victim)
  assert.equal(named.fromStatus, 'ok')
  assert.equal(named.fromName, 'Player Ä')
  assert.equal(senderVerified(PASS, named), true)
  // An encoded word that decodes to an address inside the display name changes nothing.
  const inName = parseInboundEmail(mail({ from: `=?utf-8?B?${Buffer.from(`${victim} `).toString('base64')}?= <attacker@evil.test>` }))
  assert.equal(inName.from, 'attacker@evil.test')
})

test('SEC-01b refuses more than one mailbox, group syntax, trailing text and duplicate From headers', () => {
  const victim = PLAYERS.a.email
  const bad = {
    multiple_mailboxes: `${victim}, attacker@evil.test`,
    multiple_mailboxes_named: `"A" <attacker@evil.test>, "B" <${victim}>`,
    group: `undisclosed: ${victim};`,
    group_empty: 'undisclosed-recipients:;',
    trailing_text: `${victim} extra words`,
    trailing_after_angle: `<attacker@evil.test> <${victim}>`,
  }
  for (const [expected, from] of Object.entries(bad)) {
    const parsed = parseInboundEmail(mail({ from }))
    assert.notEqual(parsed.fromStatus, 'ok', `${expected}: ${from}`)
    assert.equal(senderVerified(PASS, parsed), false, `${expected} must not verify`)
  }
  assert.equal(parseInboundEmail(mail({ from: `"A" <attacker@evil.test>, "B" <${victim}>` })).fromStatus, 'multiple_mailboxes')
  assert.equal(parseInboundEmail(mail({ from: `undisclosed: ${victim};` })).fromStatus, 'group')
  const twice = parseInboundEmail(mail({ from: 'attacker@evil.test', extraHeaders: [`From: ${victim}`] }))
  assert.equal(twice.fromStatus, 'multiple_from_headers')
  assert.equal(senderVerified(PASS, twice), false)
  // Ordinary forms still parse cleanly: bare, angle, quoted display name with a comma, a comment.
  for (const from of [victim, `<${victim}>`, `"Player, A" <${victim}>`, `${victim} (Player A)`, `Player A <${victim.toUpperCase()}>`]) {
    const p = parseInboundEmail(mail({ from }))
    assert.deepEqual([p.from, p.fromStatus], [victim, 'ok'], from)
  }
})

test('SEC-01c DMARC must be evaluated for the From domain when the verdicts name it', () => {
  const clean = parseInboundEmail(mail({ from: PLAYERS.a.email }))
  assert.equal(senderVerified({ ...PASS, dmarcDomain: 'evil.test' }, clean), false, 'DMARC passed for another domain')
  assert.equal(senderVerified({ ...PASS, dmarcDomain: 'EXAMPLE.TEST' }, clean), true, 'domain compare is case-insensitive')
  assert.equal(senderVerified({ ...PASS, dmarcDomain: 'example.test' }, clean), true)
  // Without the domain, only a single clean mailbox counts.
  assert.equal(senderVerified(PASS, clean), true)
})

test('SEC-01d an attacker aligned to their own domain cannot attach to or open a case as the victim (real email engine)', async () => {
  const h = emailHarness()
  const { caseNumber, caseId } = await newCase(h, 'a')
  const token = caseTokenFor(caseId, SECRET)
  const smuggled = Buffer.from(`<${PLAYERS.a.email}>`).toString('base64')
  const from = `<attacker@evil.test> =?utf-8?B?${smuggled}?=`
  const attach = await h.service.ingestInboundEmail({ raw: mail({ from, to: `support+${token}@r6coaching.com`, body: 'Injected as the victim.' }), verdicts: { ...PASS, dmarcDomain: 'evil.test' } })
  const opened = await h.service.ingestInboundEmail({ raw: mail({ from, body: 'Opened in the victim partition.' }), verdicts: PASS })
  assert.equal(attach.status, 'unmatched')
  assert.equal(opened.status, 'unmatched')
  assert.equal((await emailEventsOf(h.store, 'a')).length, 0)
  const view = await h.service.getMyCase(P('a'), caseNumber)
  assert.ok(!JSON.stringify(view).includes('Injected'))
  assert.equal((await h.store.listContact(`C#${keyOf('a')}`)).filter((i) => i.type === 'CASE' && i.source === 'email').length, 0)
  // A DMARC pass for the victim's own domain with a single clean mailbox still attaches.
  const ok = await h.service.ingestInboundEmail({ raw: mail({ from: `Player A <${PLAYERS.a.email}>`, to: `support+${token}@r6coaching.com` }), verdicts: { ...PASS, dmarcDomain: 'example.test' } })
  assert.equal(ok.status, 'attached')
})

// ---- SEC-02 SPF+DKIM without DMARC ---------------------------------------------------------------

test('SEC-02 only a DMARC pass verifies a sender; SPF+DKIM without DMARC (absent or GRAY) is unverified', async () => {
  assert.equal(senderVerified({ spf: 'PASS', dkim: 'PASS' }), false)
  assert.equal(senderVerified({ spf: 'PASS', dkim: 'PASS', dmarc: 'GRAY' }), false)
  assert.equal(senderVerified({ spf: { status: 'PASS' }, dkim: { status: 'PASS' }, dmarc: { status: 'PASS' } }), true)
  const h = emailHarness()
  const { caseId } = await newCase(h, 'a')
  const to = `support+${caseTokenFor(caseId, SECRET)}@r6coaching.com`
  const gray = await h.service.ingestInboundEmail({ raw: mail({ from: PLAYERS.a.email, to }), verdicts: { spf: 'PASS', dkim: 'PASS', dmarc: 'GRAY' } })
  const none = await h.service.ingestInboundEmail({ raw: mail({ from: PLAYERS.a.email, body: 'Change my email please' }), verdicts: { spf: 'PASS', dkim: 'PASS' } })
  assert.equal(gray.status, 'unmatched')
  assert.equal(none.status, 'unmatched')
  assert.equal((await emailEventsOf(h.store, 'a')).length, 0)
  // PR #24 path: the message is stored but never shown to the player as theirs.
  const store = createMemoryStore()
  const legacy = await legacyIngest({ raw: mail({ from: PLAYERS.b.email }), store, verdicts: { spf: 'PASS', dkim: 'PASS' }, now: SUPPORT_NOW })
  assert.equal(legacy.senderVerified, false)
})

// ---- SEC-03 (MAJOR) proactive evidence ---------------------------------------------------------

const EVIDENCE_NEEDLES = ['ghost-igl-subscriptions', 'resolveBilling', 'recon6-bookings', 'recon-player-events', 'domain/lifecycle', 'Lifecycle risk', 'cognito_sub', 'VOD Lambda', 'past_due', 'vod_sessions_used', 'credits#']

test('SEC-03a real proactive engine: the player sees a player-safe description; the evidence stays in the staff system event', async () => {
  const h = supportServiceHarness({ engines: realEngines, config: { support: { proactive: true } }, playerData: true })
  const run = await h.service.runProactive(P('lead'), { dryRun: false })
  assert.ok(run.created.length > 0, 'the real rules produce findings on the fixture world')
  let checked = 0
  for (const c of run.created) {
    const staffView = await h.service.getCaseForStaff(P('lead'), c.caseNumber)
    const system = staffView.timeline.find((e) => e.kind === 'system')
    assert.equal(system.visibleToPlayer, false)
    assert.ok(EVIDENCE_NEEDLES.some((n) => JSON.stringify(system).includes(n)), 'staff keep the evidence')
    await h.service.staffReply(P('agent'), c.caseNumber, { text: 'We noticed something on your account and are checking it.' })
    const owner = { email: staffView.case.email, sub: 'x', groups: [], isAdmin: false }
    const pv = await h.service.getMyCase(owner, c.caseNumber)
    const list = await h.service.listMyCases(owner)
    const text = JSON.stringify([pv, list])
    for (const n of EVIDENCE_NEEDLES) assert.ok(!text.includes(n), `${c.ruleId}: player sees "${n}"`)
    assert.ok(pv.description && pv.subject, 'a player-safe subject and description exist')
    checked += 1
  }
  assert.ok(checked >= 3)
})

test('SEC-03b a proactive finding whose description carries evidence never reaches the player, and old stored cases fall back', async () => {
  const h = supportServiceHarness({ config: { support: { proactive: true } } })
  const finding = {
    ruleId: 'onboarding_stalled_paid', email: PLAYERS.a.email, window: isoWeek(SUPPORT_NOW), category: 'other',
    subject: 'Paying member whose onboarding has stalled',
    description: 'Membership: Pro (active) (resolveBilling)\nLifecycle risk paid_never_logged_in (domain/lifecycle.mjs)\nLedger status: past_due (ghost-igl-subscriptions)',
    evidence: [{ label: 'Lifecycle risk paid_never_logged_in', value: 'x', source: 'domain/lifecycle.mjs' }],
  }
  const out = await h.service.recordProactive(P('lead'), [finding], { dryRun: false })
  const n = out.created[0].caseNumber
  await h.service.staffReply(P('agent'), n, { text: 'Need a hand getting set up?' })
  const view = await h.service.getMyCase(P('a'), n)
  for (const needle of EVIDENCE_NEEDLES) assert.ok(!JSON.stringify(view).includes(needle), needle)
  // A proactive case stored before this fix (evidence in its description) still projects the fallback.
  const legacy = { caseNumber: 'R6-000999', status: 'in_progress', category: 'other', source: 'proactive', subject: 'Ledger status past_due', description: finding.description, createdAt: 'x', updatedAt: 'x' }
  const projected = projectPlayerCase(legacy, { now: SUPPORT_NOW })
  for (const needle of EVIDENCE_NEEDLES) assert.ok(!JSON.stringify(projected).includes(needle), `fallback leaks ${needle}`)
})

// ---- SEC-04 concurrent rate limit --------------------------------------------------------------

test('SEC-04 rate limits are atomic: 20 parallel creates open exactly 5 cases; 60 parallel messages fill exactly the daily 30', async () => {
  const app = supportApp({ seedCases: false })
  const burst = await Promise.all(Array.from({ length: 20 }, (_, i) => app.call('POST', '/cs/me/support/cases', { who: 'd', body: { text: `vod stuck burst ${i}`, clientRequestId: rid('burst') } })))
  const statuses = burst.map((r) => r.statusCode)
  assert.equal(statuses.filter((s) => s === 201).length, 5, JSON.stringify(statuses))
  assert.ok(statuses.every((s) => s === 201 || s === 429))
  const all = await app.store.listAll()
  assert.equal(all.filter((i) => i.type === 'CASE' && i.contactKey === keyOf('d')).length, 5)

  const app2 = supportApp({ seedCases: false })
  const n = (await app2.call('POST', '/cs/me/support/cases', { who: 'd', body: { text: 'vod stuck', clientRequestId: rid('one') } })).json.case.caseNumber
  const mb = await Promise.all(Array.from({ length: 60 }, (_, i) => app2.call('POST', `/cs/me/support/cases/${n}/messages`, { who: 'd', body: { text: `m${i}`, clientRequestId: rid('mb') } })))
  const accepted = mb.filter((r) => r.statusCode === 201).length
  const stored = (await app2.store.listAll()).filter((i) => i.type === 'CEV' && i.kind === 'message_player' && i.actor?.kind === 'player' && i.contactKey === keyOf('d'))
  assert.equal(stored.length, 30, 'the opening message plus 29 replies: exactly the daily limit')
  assert.equal(accepted, 29)
})

// ---- SEC-05 email attach path metered -------------------------------------------------------------

test('SEC-05 attached email counts toward the daily message limit; overflow goes to the unmatched review queue', async () => {
  const h = emailHarness()
  const { caseId } = await newCase(h, 'a')
  const to = `support+${caseTokenFor(caseId, SECRET)}@r6coaching.com`
  const results = []
  for (let i = 0; i < 45; i += 1) results.push(await h.service.ingestInboundEmail({ raw: mail({ from: PLAYERS.a.email, to, id: `flood-${i}`, body: `flood ${i}` }), verdicts: PASS }))
  assert.equal(results.filter((r) => r.status === 'attached').length, 29, 'opening message + 29 emails = 30')
  const overflow = results.filter((r) => r.status !== 'attached')
  assert.ok(overflow.length === 16 && overflow.every((r) => r.status === 'unmatched' && r.reason === 'rate_limited'))
  // A portal message after the email flood is refused too: one shared budget.
  const n = (await h.store.get('SUP#CASEID', caseId)).caseNumber
  await assert.rejects(() => h.service.addPlayerMessage(P('a'), n, { text: 'one more', clientRequestId: rid() }), (e) => e.statusCode === 429)
})

// ---- SEC-06 redaction gaps -------------------------------------------------------------------------

const SECRETS = {
  card_space: '4242 4242 4242 4242',
  card_dash: '4242-4242-4242-4242',
  card_plain: '4242424242424242',
  amex: '3782 822463 10005',
  card_dots: '4242.4242.4242.4242',
  card_double_space: '4242  4242  4242  4242',
  card_zero_width: '4242​4242​4242​4242',
  card_nbsp: '4242 4242 4242 4242',
  card_newlines: '4242\n4242\n4242\n4242',
  card_after_dash: 'ref-4242424242424242',
  card_slashes: '4242/4242/4242/4242',
  card_then_expiry: '4242 4242 4242 4242 12/28 123',
  card_fullwidth: '４２４２４２４２４２４２４２４２',
  stripe_live: `${SK_LIVE}FIXTUREabcdef123456`,
  stripe_rk: `${RK_LIVE}FIXTUREabcdef123456`,
  stripe_glued: `key=x${SK_LIVE}FIXTUREabcdef123456`,
  whsec: `${WHSEC}FIXTUREabcdef123456`,
  whsec_glued: `x${WHSEC}FIXTUREabcdef123456`,
  aws: `${AKIA}FIXTURE000000000`,
  aws_secret_next_to_id: `${AKIA}FIXTURE000000000 ${AWS_SECRET}`,
  aws_secret_labelled: `aws_secret ${AWS_SECRET_PLAIN}`,
  aws_secret_bare: AWS_SECRET,
  jwt: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmaXh0dXJlIn0.c2lnbmF0dXJlZml4dHVyZQ',
  pw_colon: 'password: Hunter2Fixture!',
  pw_is: 'my password is Hunter2Fixture!',
  pw_plain_is: 'the password is Hunter2Fixture!',
  pw_space: 'password Hunter2Fixture!',
  pw_login: 'login fixture@example.test / Hunter2Fixture!',
  pw_unicode_colon: 'password： Hunter2Fixture!',
}
const NEEDLES = { card: /4242.{0,3}4242.{0,3}4242.{0,3}4242|3782.?822463.?10005|４２４２/, key: /(sk|rk)_live_FIXTURE|whsec_FIXTURE|AKIAFIXTURE|FIXTUREKEY/, jwt: /eyJhbGciOiJIUzI1NiJ9/, pw: /Hunter2Fixture/ }

test('SEC-06a redactSensitive catches separator, zero-width, glued, bare-AWS and password-phrasing variants', () => {
  const leaked = {}
  for (const [k, v] of Object.entries(SECRETS)) {
    const out = redactSensitive(`hi ${v} bye`)
    const hit = Object.entries(NEEDLES).find(([, re]) => re.test(out.text))
    if (hit) leaked[k] = out.text
    else assert.ok(out.redactions.length > 0, `${k}: a redaction is reported`)
  }
  assert.deepEqual(leaked, {})
})

test('SEC-06b ordinary game and support text is NOT redacted', () => {
  const keep = [
    'Gold 2 → Plat 1',
    'lost a 3-2 round on Bank, won 7-3 later',
    'went 12-4, K/D 1.25, 1v3 clutch at 00:12:34',
    'Session 2026-09-25 18:00-19:00 UTC, logged at 2026-09-25T15:00:00.000Z',
    'App v1.2.3 on patch Y11S3.1 (build 11.3.1.4, 2026.09.25)',
    'Diamond 1 / Champion by season end, MMR 3500 → 3620',
    'order 1234567890123456 is not a card',
    'Called 555-0100 at 10:30, or +1 (555) 010-0199',
    'rounds 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15',
    'I forgot my password and the password reset email never came',
    'the password field is broken on the login / signup page',
    'the password is wrong every time, password manager says it is saved',
    'my network_connection1 keeps dropping',
    'Case R6-000123 about my Ubisoft link',
    'Refund of $12 on 09/25, receipt #4471',
  ]
  for (const t of keep) {
    const out = redactSensitive(t)
    assert.equal(out.text, t, t)
    assert.deepEqual(out.redactions, [], t)
  }
})

// ---- SEC-07 unredacted fields --------------------------------------------------------------------

test('SEC-07 context.page keeps the path only; attachment names, KB decision notes and incident fields are redacted on create, PATCH and PUT', async () => {
  const app = supportApp({ config: { support: { attachments: true } } })
  const card = '4242 4242 4242 4242'
  const jwt = SECRETS.jwt
  const payload = `card ${card} key ${SECRETS.stripe_live} jwt ${jwt} password: Hunter2Fixture!`
  const c = await app.call('POST', '/cs/me/support/cases', { who: 'a', body: { text: 'vod stuck', clientRequestId: rid(), context: { page: `/support/new?t=${jwt}&card=4242424242424242#frag-${jwt}` } } })
  assert.equal(c.statusCode, 201, c.body)
  const n = c.json.case.caseNumber
  const att = await app.call('POST', `/cs/me/support/cases/${n}/attachments`, { who: 'a', body: { name: `‮gnp.exe‬ ${card} card.png`, mime: 'image/png', size: 10 } })
  assert.equal(att.statusCode, 200, att.body)
  assert.ok(!/[‪-‮⁦-⁩]/.test(att.json.attachment.name))
  assert.equal((await app.call('POST', `/cs/admin/support/cases/${n}/status`, { who: 'agent', body: { status: 'in_progress' } })).statusCode, 200)
  const resolved = await app.call('POST', `/cs/admin/support/cases/${n}/resolve`, { who: 'agent', body: { summary: 'done', code: 'answered', learning: { docGap: true } } })
  const kbId = resolved.json.kbProposal.id
  assert.equal((await app.call('POST', `/cs/admin/support/kb/proposals/${kbId}/decision`, { who: 'lead', body: { decision: 'accept', note: payload } })).statusCode, 200)
  const inc = await app.call('POST', '/cs/admin/support/incidents', { who: 'lead', body: { title: `Access ${card}`, service: 'auth', owner: `lead password: Hunter2Fixture!`, internalNotes: payload, workaround: payload, customerUpdateDraft: payload } })
  assert.equal(inc.statusCode, 201, inc.body)
  const id = inc.json.incidentId
  assert.equal((await app.call('PATCH', `/cs/admin/support/incidents/${id}`, { who: 'lead', body: { title: `Still ${card}`, internalNotes: payload, workaround: payload } })).statusCode, 200)
  assert.equal((await app.call('PUT', `/cs/admin/support/incidents/${id}`, { who: 'lead', body: { owner: `x ${SECRETS.stripe_live}`, customerUpdateDraft: payload } })).statusCode, 200)
  const stored = (await app.store.listAll()).filter((i) => String(i.pk).startsWith('SUP#') || ['CASE', 'CEV', 'ATT', 'AUDIT'].includes(i.type))
  const where = {}
  for (const item of stored) {
    const s = JSON.stringify(item)
    for (const [k, re] of Object.entries(NEEDLES)) if (re.test(s)) (where[`${item.type}:${item.sk}`] ||= []).push(k)
  }
  assert.deepEqual(where, {})
  const caseItem = stored.find((i) => i.type === 'CASE' && i.caseNumber === n)
  assert.equal(caseItem.context.page, '/support/new', 'query and fragment are dropped')
})

// ---- SEC-08 role masking ---------------------------------------------------------------------------

test('SEC-08 agents see masked Stripe ids in unmatched email, incident list/detail and KB proposals; billing sees them in full', async () => {
  const h = supportServiceHarness()
  const cus = 'cus_FIXTUREUNMAT9876'
  await h.service.applyInboundEmailDecision({ action: 'unmatched', messageIdHash: 'a'.repeat(64), text: `my customer id is ${cus}`, subject: `about ${cus}`, sender: { email: 'x@example.test' } })
  const inc = await h.service.createIncident(P('lead'), { title: `Access for ${FAKE_STRIPE.customer}`, service: 'payment_access', internalNotes: `affected ${FAKE_STRIPE.customer} ${FAKE_STRIPE.subscription}` })
  await h.service.proposeKb({ by: 'support.lead@example.test', title: 'Gap', body: `Seen on ${FAKE_STRIPE.customer}`, reason: `from ${FAKE_STRIPE.subscription}`, sourceCaseNumbers: [], origin: 'resolution' })
  for (const who of ['agent', 'engineering']) {
    const views = [
      await h.service.listUnmatchedEmail(P(who)),
      await h.service.getIncident(P(who), inc.incidentId),
      await h.service.listIncidents(P(who)),
      await h.service.listKbProposals(P(who)),
    ]
    for (const [i, v] of views.entries()) {
      const s = JSON.stringify(v)
      for (const full of [cus, FAKE_STRIPE.customer, FAKE_STRIPE.subscription]) assert.ok(!s.includes(full), `${who} view ${i} shows ${full}`)
    }
    assert.ok(JSON.stringify(views[0]).includes('cus_…9876'))
  }
  assert.ok(JSON.stringify(await h.service.listUnmatchedEmail(P('billing'))).includes(cus))
  assert.ok(JSON.stringify(await h.service.getIncident(P('billing'), inc.incidentId)).includes(FAKE_STRIPE.customer))
})

// ---- SEC-09 four-eyes ------------------------------------------------------------------------------

test('SEC-09 the requester can never authorize their own action request; it stays pending for another lead', async () => {
  const app = supportApp()
  const n = 'R6-000001'
  for (const who of ['lead', 'admin']) {
    const ar = (await app.call('POST', `/cs/admin/support/cases/${n}/action-requests`, { who, body: { kind: 'refund', reason: 'duplicate charge' } })).json
    const self = await app.call('POST', `/cs/admin/support/cases/${n}/action-requests/${ar.requestId}/decision`, { who, body: { decision: 'authorize' } })
    assert.equal(self.statusCode, 403, `${who} self-authorized`)
    assert.equal(self.json.code, 'four_eyes_required')
    assert.equal((await app.call('POST', `/cs/admin/support/cases/${n}/action-requests/${ar.requestId}/decision`, { who, body: { decision: 'done_externally', note: 'refunded' } })).statusCode, 409, 'done needs a prior authorization')
    const view = await app.call('GET', `/cs/admin/support/cases/${n}`, { who: 'lead' })
    assert.equal(view.json.actionRequests.find((r) => r.requestId === ar.requestId).status, 'requested', 'still pending')
    const other = who === 'lead' ? 'admin' : 'lead'
    assert.equal((await app.call('POST', `/cs/admin/support/cases/${n}/action-requests/${ar.requestId}/decision`, { who: other, body: { decision: 'authorize' } })).statusCode, 200)
    assert.equal((await app.call('POST', `/cs/admin/support/cases/${n}/action-requests/${ar.requestId}/decision`, { who: 'billing', body: { decision: 'done_externally', note: 'refunded' } })).statusCode, 200)
  }
})

// ---- SEC-10 proactive dry run + window ------------------------------------------------------------

test('SEC-10 a proactive dry run writes nothing; the window must be the current ISO week; two runs in a week create one case', async () => {
  const week = isoWeek(SUPPORT_NOW)
  const finding = (window) => ({ ruleId: 'vod_usage_without_review', email: PLAYERS.a.email, window, category: 'vod_analysis', subject: 'VOD usage without review', description: 'x' })
  const h = supportServiceHarness({ config: { support: { proactive: true } } })
  const before = JSON.stringify(await h.store.listAll())
  const dry = await h.service.recordProactive(P('lead'), [finding(week)], { dryRun: true })
  assert.equal(dry.wouldCreate.length, 1)
  assert.equal(JSON.stringify(await h.store.listAll()), before, 'the dry run wrote an item')
  for (const bad of ['run-1', 'run-2', '2026-W40', '2026-W38', '2026-w39', '2026-W39x']) {
    const out = await h.service.recordProactive(P('lead'), [finding(bad)], { dryRun: false })
    assert.equal(out.created.length, 0, `window ${bad} accepted`)
  }
  let n = 0
  const engines = stubEngines({ evaluateProactive: () => [{ ...finding(week), note: `run-${(n += 1)}` }] }).engines
  const h2 = supportServiceHarness({ engines, seedCases: false, config: { support: { proactive: true } } })
  const run1 = await h2.service.runProactive(P('lead'), { dryRun: false })
  const run2 = await h2.service.runProactive(P('lead'), { dryRun: false })
  assert.equal(run1.created.length, 1)
  assert.equal(run2.created.length, 0)
  assert.equal((await h2.store.listAll()).filter((i) => i.type === 'CASE' && i.source === 'proactive').length, 1)
})

// ---- SEC-11 malformed percent-encoding -------------------------------------------------------------

test('SEC-11 malformed percent-encoding in a path parameter is a 400, not a 500', async () => {
  assert.throws(() => matchPath('/cs/x/{id}', '/cs/x/%E0%A4%A'), (e) => e.statusCode === 400)
  const app = supportApp()
  for (const [path, who] of [['/cs/me/support/cases/%E0%A4%A', 'a'], ['/cs/admin/support/cases/%', 'agent'], ['/cs/help/articles/%', undefined]]) {
    const r = await app.call('GET', path, { who })
    assert.equal(r.statusCode, 400, `${path} -> ${r.statusCode}`)
  }
})

// ---- SEC-12 clientRequestId reuse across cases -----------------------------------------------------

test('SEC-12 the same message clientRequestId on two different cases stores both messages', async () => {
  const app = supportApp({ seedCases: false })
  const n1 = (await app.call('POST', '/cs/me/support/cases', { who: 'a', body: { text: 'vod stuck', clientRequestId: rid() } })).json.case.caseNumber
  const n2 = (await app.call('POST', '/cs/me/support/cases', { who: 'a', body: { text: 'coaching session question', clientRequestId: rid() } })).json.case.caseNumber
  const mid = 'msg-reuse-sec-0001'
  const m1 = await app.call('POST', `/cs/me/support/cases/${n1}/messages`, { who: 'a', body: { text: 'first message for case one', clientRequestId: mid } })
  const m2 = await app.call('POST', `/cs/me/support/cases/${n2}/messages`, { who: 'a', body: { text: 'different message for case two', clientRequestId: mid } })
  assert.equal(m1.statusCode, 201)
  const t2 = await app.call('GET', `/cs/me/support/cases/${n2}`, { who: 'a' })
  const stored = t2.json.timeline.some((e) => e.body === 'different message for case two')
  assert.ok(stored || m2.statusCode === 409, `acknowledged ${m2.statusCode} ${m2.body} but never stored`)
  assert.equal(m2.json.replayed, false)
  const replay = await app.call('POST', `/cs/me/support/cases/${n1}/messages`, { who: 'a', body: { text: 'first message for case one', clientRequestId: mid } })
  assert.equal(replay.json.replayed, true)
  assert.equal(replay.json.eventId, m1.json.eventId)
})

// ---- SEC-13 server marks player events public ---------------------------------------------------------

test('SEC-13 every event in a player case view carries visibility "public"', async () => {
  const app = supportApp()
  const list = await app.call('GET', '/cs/me/support/cases', { who: 'a' })
  let events = 0
  for (const c of Object.values(list.json.buckets).flat()) {
    const v = await app.call('GET', `/cs/me/support/cases/${c.caseNumber}`, { who: 'a' })
    for (const e of v.json.timeline) {
      assert.equal(e.visibility, 'public', JSON.stringify(e))
      events += 1
    }
  }
  assert.ok(events > 5)
})

// ---- SEC-14 bidi / zero-width text ----------------------------------------------------------------

test('SEC-14 bidi overrides and zero-width characters are stripped before length checks; invisible-only text is rejected', async () => {
  const app = supportApp({ seedCases: false })
  const rtl = 'Refund ‮gnp.exe‬ please ​​ vod ⁦x⁩'
  const r = await app.call('POST', '/cs/me/support/cases', { who: 'a', body: { text: rtl, clientRequestId: rid() } })
  assert.equal(r.statusCode, 201)
  const q = await app.call('GET', '/cs/admin/support/queue?view=all_open', { who: 'agent' })
  const row = q.json.cases.find((c) => c.caseNumber === r.json.case.caseNumber)
  const INVISIBLE = /[​-‏‪-‮⁠-⁩﻿؜]/
  assert.ok(!INVISIBLE.test(row.subject), 'staff queue subject')
  const stored = (await app.store.listAll()).filter((i) => i.caseNumber === r.json.case.caseNumber && ['CASE', 'CEV'].includes(i.type))
  assert.ok(stored.every((i) => !INVISIBLE.test(JSON.stringify([i.subject, i.description, i.body]))))
  for (const text of ['​​​​', '‮‬⁦⁩‎', ' ​ ﻿ ']) {
    assert.equal((await app.call('POST', '/cs/me/support/cases', { who: 'a', body: { text, clientRequestId: rid() } })).statusCode, 400, JSON.stringify(text))
    assert.equal((await app.call('POST', `/cs/me/support/cases/${r.json.case.caseNumber}/messages`, { who: 'a', body: { text, clientRequestId: rid() } })).statusCode, 400)
  }
  // Length is measured after stripping: 3 visible characters padded with invisibles is still too short.
  assert.equal((await app.call('POST', '/cs/me/support/cases', { who: 'a', body: { text: `a​b${'​'.repeat(10)}`, clientRequestId: rid() } })).statusCode, 400)
})

// ---- SEC-15 HTML -> text ordering ----------------------------------------------------------------------

const DANGEROUS = [/<script/i, /<img/i, /\bon[a-z]+\s*=/i, /javascript:/i]

test('SEC-15 HTML-only mail: entity-encoded markup never survives into the stored text', async () => {
  const html = '<html><body><p>Help</p><script>alert(1)</script><scr<script>x</script>ipt>alert(2)</script>&lt;img src=x onerror=alert(3)&gt; &lt;script&gt;alert(4)&lt;/script&gt;<a href="javascript:alert(5)">x</a> &#106;avascript:alert(6) &amp;lt;script&amp;gt;alert(7)&amp;lt;/script&amp;gt; <svg onload=alert(8)></body></html>'
  const direct = htmlToText(html)
  for (const re of DANGEROUS) assert.ok(!re.test(direct), `${re} in "${direct}"`)
  assert.match(direct, /Help/)
  const h = emailHarness()
  const r = await h.service.ingestInboundEmail({ raw: mail({ from: PLAYERS.a.email, contentType: 'text/html; charset=utf-8', body: html }), verdicts: PASS })
  assert.equal(r.status, 'new_case')
  const ev = (await emailEventsOf(h.store, 'a'))[0]
  for (const re of DANGEROUS) assert.ok(!re.test(ev.body), `${re} stored: ${ev.body}`)
  const c = (await h.store.listContact(`C#${keyOf('a')}`)).find((i) => i.type === 'CASE' && i.caseNumber === r.caseNumber)
  for (const re of DANGEROUS) assert.ok(!re.test(`${c.subject}\n${c.description}`), `${re} in case`)
})
