import test from 'node:test'
import assert from 'node:assert/strict'
import { canonicalMessageId, caseFromPlusAddress, caseTokenFor, classifyAutomated, decideInboundEmail, htmlToText, messageIdHash } from './email.mjs'

const SECRET = 'fixture-secret-0123456789abcdef0123456789abcdef'
const CASE_ID = '5f0c2b1e-7a3d-4c1b-9e2f-0a1b2c3d4e5f'
const OWNER = 'case.owner@example.com'
const PASS = { spf: 'PASS', dkim: 'PASS', dmarc: 'PASS' }
const FAIL = { spf: 'FAIL', dkim: 'FAIL', dmarc: 'FAIL' }
const CASE_REF = { caseId: CASE_ID, caseNumber: 'R6-000123', contactKey: 'pl_fixture000000000001', ownerEmail: OWNER }

function mail({ from = `Case Owner <${OWNER}>`, to = 'support@r6coaching.example', subject = 'Re: your case', messageId = '<abc.123@Mail.Example.COM>', headers = [], body = 'Still broken after the update.', contentType = 'text/plain; charset=utf-8' } = {}) {
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    messageId ? `Message-ID: ${messageId}` : null,
    'Date: Wed, 14 Oct 2026 12:00:00 +0000',
    ...headers,
    `Content-Type: ${contentType}`,
    '',
    body,
  ].filter((line) => line !== null).join('\r\n')
}

function lookups(over = {}) {
  const seen = new Set(over.seen || [])
  return {
    async caseByToken(token) {
      const r = caseFromPlusAddress(token, SECRET)
      return r && r.caseId === CASE_ID ? CASE_REF : null
    },
    async caseByOutboundMessageId(id) {
      return id === 'out-777@r6coaching.example' ? CASE_REF : null
    },
    async contactByEmail(email) {
      return email === OWNER || email === 'known.player@example.com' ? { contactKey: `pl_${email.length}` } : null
    },
    async seenMessageIdHash(hash) {
      return seen.has(hash)
    },
    ...over.fns,
  }
}

test('canonical Message-ID and its hash', () => {
  assert.equal(canonicalMessageId('<ABC.123@Mail.Example.COM>'), 'ABC.123@mail.example.com')
  assert.equal(canonicalMessageId('  ABC.123@mail.example.com '), 'ABC.123@mail.example.com')
  assert.equal(canonicalMessageId(''), null)
  assert.equal(messageIdHash('<ABC.123@MAIL.example.com>'), messageIdHash('ABC.123@mail.example.com'))
  assert.match(messageIdHash('<x@y.z>'), /^[0-9a-f]{64}$/)
})

test('dedupe: a seen Message-ID hash is a duplicate', async () => {
  const raw = mail()
  const first = await decideInboundEmail({ raw, verdicts: PASS, lookups: lookups() })
  assert.equal(first.outcome, 'new_case')
  const again = await decideInboundEmail({ raw, verdicts: PASS, lookups: lookups({ seen: [first.message.messageIdHash] }) })
  assert.equal(again.outcome, 'duplicate')
  // No Message-ID: a stable synthetic hash still dedupes redelivery.
  const noId = mail({ messageId: null })
  const a = await decideInboundEmail({ raw: noId, verdicts: PASS, lookups: lookups() })
  const b = await decideInboundEmail({ raw: noId, verdicts: PASS, lookups: lookups({ seen: [a.message.messageIdHash] }) })
  assert.equal(b.outcome, 'duplicate')
})

test('case token: HMAC, lowercase, verifiable, and a >=32-byte secret is required', () => {
  const token = caseTokenFor(CASE_ID, SECRET)
  assert.match(token, /^[0-9a-f-]+\.[0-9a-f]{16}$/)
  assert.equal(`support+${token}`.length <= 64, true, 'fits an email local part')
  assert.deepEqual(caseFromPlusAddress(`Recon Support <support+${token}@r6coaching.example>`, SECRET), { caseId: CASE_ID, token })
  assert.deepEqual(caseFromPlusAddress(`SUPPORT+${token.toUpperCase()}@R6COACHING.EXAMPLE`, SECRET), { caseId: CASE_ID, token })
  const forged = `${CASE_ID}.0000000000000000`
  assert.equal(caseFromPlusAddress(`support+${forged}@r6coaching.example`, SECRET), null)
  assert.equal(caseFromPlusAddress(`support+${token}@r6coaching.example`, `${SECRET}-other`), null)
  assert.throws(() => caseTokenFor(CASE_ID, 'short'), /32 bytes/)
  assert.throws(() => caseTokenFor('not a case id!', SECRET), /caseId/)
})

test('threading via plus-address token attaches for the verified owner', async () => {
  const token = caseTokenFor(CASE_ID, SECRET)
  const r = await decideInboundEmail({ raw: mail({ to: `support+${token}@r6coaching.example` }), verdicts: PASS, lookups: lookups() })
  assert.equal(r.outcome, 'attach')
  assert.equal(r.threadedBy, 'plus_token')
  assert.equal(r.caseRef.caseNumber, 'R6-000123')
  assert.equal(r.contactKey, CASE_REF.contactKey)
})

test('threading via References / In-Reply-To', async () => {
  const raw = mail({ headers: ['In-Reply-To: <unknown@elsewhere.example>', 'References: <first@r6coaching.example> <OUT-777@R6COACHING.EXAMPLE>'] })
  const r = await decideInboundEmail({ raw, verdicts: PASS, lookups: lookups({ fns: { caseByOutboundMessageId: async (id) => (id === 'OUT-777@r6coaching.example' ? CASE_REF : null) } }) })
  assert.equal(r.outcome, 'attach')
  assert.equal(r.threadedBy, 'references')
})

test('unverified sender is never attached, even with a valid token', async () => {
  const token = caseTokenFor(CASE_ID, SECRET)
  const r = await decideInboundEmail({ raw: mail({ to: `support+${token}@r6coaching.example` }), verdicts: FAIL, lookups: lookups() })
  assert.equal(r.outcome, 'unmatched')
  assert.equal(r.reason, 'sender_unverified')
  const noVerdicts = await decideInboundEmail({ raw: mail(), verdicts: null, lookups: lookups() })
  assert.equal(noVerdicts.outcome, 'unmatched')
})

test('a verified sender who is not the case owner goes to review', async () => {
  const token = caseTokenFor(CASE_ID, SECRET)
  const r = await decideInboundEmail({ raw: mail({ from: 'Someone Else <someone.else@example.com>', to: `support+${token}@r6coaching.example` }), verdicts: PASS, lookups: lookups() })
  assert.equal(r.outcome, 'unmatched')
  assert.equal(r.reason, 'sender_not_case_owner')
})

test('verified sender with no case: new case if known, unmatched otherwise', async () => {
  const known = await decideInboundEmail({ raw: mail({ from: 'known.player@example.com' }), verdicts: PASS, lookups: lookups() })
  assert.equal(known.outcome, 'new_case')
  assert.ok(known.contactKey)
  const stranger = await decideInboundEmail({ raw: mail({ from: 'stranger@example.net' }), verdicts: PASS, lookups: lookups() })
  assert.equal(stranger.outcome, 'unmatched')
  assert.equal(stranger.reason, 'no_matching_account')
})

test('auto-replies, bulk mail and bounces are automated, never player messages', async () => {
  const cases = [
    ['Auto-Submitted: auto-replied', 'auto_reply'],
    ['Precedence: bulk', 'bulk'],
    ['Precedence: auto_reply', 'auto_reply'],
    ['X-Autoreply: yes', 'auto_reply'],
    ['X-Auto-Response-Suppress: All', 'auto_generated'],
  ]
  for (const [header, kind] of cases) {
    const r = await decideInboundEmail({ raw: mail({ headers: [header] }), verdicts: PASS, lookups: lookups() })
    assert.equal(r.outcome, 'automated', header)
    assert.equal(r.automated.kind, kind, header)
  }
  const dsn = await decideInboundEmail({ raw: mail({ from: 'Mail Delivery Subsystem <MAILER-DAEMON@mx.example.net>' }), verdicts: PASS, lookups: lookups() })
  assert.equal(dsn.outcome, 'automated')
  const report = mail({ contentType: 'multipart/report; report-type=delivery-status; boundary="b1"', body: '--b1\r\nContent-Type: text/plain\r\n\r\nDelivery failed.\r\n--b1--' })
  assert.equal((await decideInboundEmail({ raw: report, verdicts: PASS, lookups: lookups() })).outcome, 'automated')
  assert.equal(classifyAutomated({ 'auto-submitted': 'no' }).automated, false)
  assert.equal(classifyAutomated({ from: 'postmaster@example.org' }).kind, 'dsn')
})

test('HTML-only mail falls back to quote-stripped text', async () => {
  const html = '<html><head><style>p{color:red}</style></head><body><p>My VOD review is stuck &amp; the page is blank.</p><br><p>Thanks</p><blockquote>On Mon we wrote: old stuff</blockquote></body></html>'
  const r = await decideInboundEmail({ raw: mail({ contentType: 'text/html; charset=utf-8', body: html }), verdicts: PASS, lookups: lookups() })
  assert.equal(r.message.format, 'html_fallback')
  assert.match(r.message.text, /My VOD review is stuck & the page is blank\./)
  assert.ok(!/old stuff|color:red|<p>/.test(r.message.text))
  assert.equal(htmlToText('a&nbsp;b &#39;c&#39; &#x41;'), "a b 'c' A")
})

test('plain text keeps only the new reply', async () => {
  const body = 'New details here.\r\n\r\nOn Tue, Recon Support wrote:\r\n> old quoted text'
  const r = await decideInboundEmail({ raw: mail({ body }), verdicts: PASS, lookups: lookups() })
  assert.equal(r.message.text, 'New details here.')
  assert.equal(r.message.format, 'text')
})

test('attachments become a manifest only (name, mime, size)', async () => {
  const png = Buffer.from('fake-png-bytes-for-a-fixture').toString('base64')
  const body = [
    '--mix',
    'Content-Type: text/plain; charset=utf-8',
    '',
    'Screenshot attached.',
    '--mix',
    'Content-Type: image/png; name="round-3.png"',
    'Content-Disposition: attachment; filename="round-3.png"',
    'Content-Transfer-Encoding: base64',
    '',
    png,
    '--mix--',
  ].join('\r\n')
  const r = await decideInboundEmail({ raw: mail({ contentType: 'multipart/mixed; boundary="mix"', body }), verdicts: PASS, lookups: lookups(), providerMessageId: 'ses-fixture-1' })
  assert.equal(r.message.text, 'Screenshot attached.')
  assert.deepEqual(r.message.attachments, [{ name: 'round-3.png', mime: 'image/png', size: Buffer.from(png, 'base64').length }])
  assert.equal(r.message.providerMessageId, 'ses-fixture-1')
  assert.ok(!JSON.stringify(r).includes(png), 'no attachment bytes in the decision')
})

test('STOP-like text in a support reply is not an opt-out', async () => {
  const token = caseTokenFor(CASE_ID, SECRET)
  const r = await decideInboundEmail({ raw: mail({ to: `support+${token}@r6coaching.example`, body: 'STOP charging me twice please' }), verdicts: PASS, lookups: lookups() })
  assert.equal(r.outcome, 'attach')
  assert.equal(r.stopTextIsOptOut, false)
  assert.deepEqual(r.notes, ['stop_like_text_not_an_opt_out'])
  assert.ok(!('suppressed' in r) && !('consent' in r))
})

test('rejects unparseable senders and empty mail', async () => {
  assert.equal((await decideInboundEmail({ raw: mail({ from: 'not an address' }), verdicts: PASS, lookups: lookups() })).outcome, 'rejected')
  assert.equal((await decideInboundEmail({ raw: mail({ body: '' }), verdicts: PASS, lookups: lookups() })).outcome, 'rejected')
})

test('service-facing aliases: { message } input and action/sender/match output', async () => {
  const token = caseTokenFor(CASE_ID, SECRET)
  const raw = mail({ to: `support+${token}@r6coaching.example` })
  const attached = await decideInboundEmail({ message: { raw, verdicts: PASS, providerMessageId: 'ses-2' }, lookups: lookups() })
  assert.equal(attached.action, 'attach')
  assert.equal(attached.match.confidence, 'certain')
  assert.equal(attached.match.caseNumber, 'R6-000123')
  assert.deepEqual(attached.sender, { email: OWNER, verified: true })
  assert.match(attached.messageIdHash, /^[0-9a-f]{64}$/)
  assert.equal(attached.providerMessageId, 'ses-2')
  // Raw string, no verdicts, no lookups: safe default is human review.
  const bare = await decideInboundEmail({ message: raw })
  assert.equal(bare.action, 'unmatched')
  assert.equal(bare.match.confidence, 'none')
  const auto = await decideInboundEmail({ message: { raw: mail({ headers: ['Auto-Submitted: auto-generated'] }), verdicts: PASS } })
  assert.equal(auto.action, 'ignore')
})
