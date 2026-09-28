// Regression tests for the inbound-email and routing security fixes found by
// the adversarial review of the Support module (SEC-01, SEC-02, SEC-11 there).
// They live here because the vulnerable code is this Lambda's shared parser
// and router, which ship with the customer-success foundation on their own.
// Each test fails against the previous parser/router. All addresses are
// fictional (example.test / evil.test).

import test from 'node:test'
import assert from 'node:assert/strict'
import { parseInboundEmail, senderVerified, ingestInboundEmail } from './inbound.mjs'
import { matchPath } from './lib/http.mjs'
import { createMemoryStore } from './data/memoryStore.mjs'
import { fixtureApp, FIXTURE_NOW as NOW } from './fixtures/app.mjs'
import { routeModules } from './routes/index.mjs'

const VICTIM = 'player.a@example.test'
const PASS = { spf: 'PASS', dkim: 'PASS', dmarc: 'PASS' }

let mailSeq = 0
function mail({ from, body = 'Still stuck after the fix.', extraHeaders = [] }) {
  mailSeq += 1
  return [`From: ${from}`, ...extraHeaders, 'To: support@r6coaching.com', 'Subject: Re: help', `Message-ID: <sec-${mailSeq}@mail.example.test>`, 'Date: Thu, 24 Sep 2026 14:00:00 +0000', 'Content-Type: text/plain; charset=utf-8', '', body].join('\r\n')
}
const b64 = (s) => Buffer.from(s).toString('base64')

test('encoded-word From smuggling: the address comes from the RAW header; encoded words are display text only', () => {
  const smuggled = parseInboundEmail(mail({ from: `<attacker@evil.test> =?utf-8?B?${b64(`<${VICTIM}>`)}?=` }))
  assert.notEqual(smuggled.from, VICTIM, 'a decoded encoded word must never become the sender address')
  assert.equal(smuggled.fromStatus, 'trailing_text')
  assert.equal(senderVerified(PASS, smuggled), false, 'text after the addr-spec makes the sender unverified')

  const named = parseInboundEmail(mail({ from: `=?utf-8?B?${b64('Player Ä')}?= <${VICTIM}>` }))
  assert.deepEqual([named.from, named.fromStatus, named.fromName], [VICTIM, 'ok', 'Player Ä'])
  assert.equal(senderVerified(PASS, named), true)

  const inName = parseInboundEmail(mail({ from: `=?utf-8?B?${b64(`${VICTIM} `)}?= <attacker@evil.test>` }))
  assert.equal(inName.from, 'attacker@evil.test', 'an address inside the display name changes nothing')
})

test('several mailboxes, group syntax, trailing text and duplicate From headers never verify', () => {
  const bad = {
    multiple_mailboxes: `${VICTIM}, attacker@evil.test`,
    multiple_mailboxes_named: `"A" <attacker@evil.test>, "B" <${VICTIM}>`,
    group: `undisclosed: ${VICTIM};`,
    group_empty: 'undisclosed-recipients:;',
    trailing_text: `${VICTIM} extra words`,
    trailing_after_angle: `<attacker@evil.test> <${VICTIM}>`,
  }
  for (const [label, from] of Object.entries(bad)) {
    const parsed = parseInboundEmail(mail({ from }))
    assert.notEqual(parsed.fromStatus, 'ok', `${label}: ${from}`)
    assert.equal(senderVerified(PASS, parsed), false, `${label} must not verify`)
  }
  const twice = parseInboundEmail(mail({ from: 'attacker@evil.test', extraHeaders: [`From: ${VICTIM}`] }))
  assert.equal(twice.fromStatus, 'multiple_from_headers')
  assert.equal(senderVerified(PASS, twice), false)
  // Ordinary forms still parse cleanly.
  for (const from of [VICTIM, `<${VICTIM}>`, `"Player, A" <${VICTIM}>`, `${VICTIM} (Player A)`, `Player A <${VICTIM.toUpperCase()}>`]) {
    const p = parseInboundEmail(mail({ from }))
    assert.deepEqual([p.from, p.fromStatus], [VICTIM, 'ok'], from)
  }
})

test('DMARC must be evaluated for the From domain when the verdicts name it', () => {
  const clean = parseInboundEmail(mail({ from: VICTIM }))
  assert.equal(senderVerified({ ...PASS, dmarcDomain: 'evil.test' }, clean), false, 'DMARC passed for another domain')
  assert.equal(senderVerified({ ...PASS, dmarcDomain: 'EXAMPLE.TEST' }, clean), true)
  assert.equal(senderVerified(PASS, clean), true)
})

test('only a DMARC pass verifies: SPF+DKIM with DMARC absent or GRAY is unverified', async () => {
  assert.equal(senderVerified({ spf: 'PASS', dkim: 'PASS' }), false)
  assert.equal(senderVerified({ spf: 'PASS', dkim: 'PASS', dmarc: 'GRAY' }), false)
  assert.equal(senderVerified({ spf: { status: 'PASS' }, dkim: { status: 'PASS' }, dmarc: { status: 'PASS' } }), true)
  const store = createMemoryStore()
  const res = await ingestInboundEmail({ raw: mail({ from: VICTIM }), store, verdicts: { spf: 'PASS', dkim: 'PASS' }, now: NOW })
  assert.equal(res.senderVerified, false)
})

test('an attacker passing DMARC for their own domain is stored unverified, never as the victim', async () => {
  const store = createMemoryStore()
  const from = `<attacker@evil.test> =?utf-8?B?${b64(`<${VICTIM}>`)}?=`
  const res = await ingestInboundEmail({ raw: mail({ from, body: 'Injected as the victim.' }), store, verdicts: { ...PASS, dmarcDomain: 'evil.test' }, now: NOW })
  assert.notEqual(res.senderVerified, true)
  const stored = (await store.listAll()).filter((i) => JSON.stringify(i).includes('Injected'))
  for (const item of stored) {
    assert.notEqual(item.email, VICTIM, 'nothing is filed under the victim')
    assert.notEqual(item.senderVerified, true)
  }
})

test('malformed percent-encoding in a path parameter is a 400, not a 500', async () => {
  assert.throws(() => matchPath('/cs/x/{id}', '/cs/x/%E0%A4%A'), (e) => e.statusCode === 400)
  assert.equal(matchPath('/cs/y/{id}', '/cs/x/%'), null, 'a route whose literals differ never decodes')
  // The production route modules, as index.mjs wires them.
  const { call } = fixtureApp({ extraRoutes: routeModules })
  for (const path of ['/cs/admin/players/%E0%A4%A', '/cs/admin/players/%/home-preview', '/cs/admin/conversations/%']) {
    const res = await call('GET', path, { token: 'tok-admin' })
    assert.equal(res.statusCode, 400, `${path} -> ${res.statusCode}`)
  }
})

test('a named API stage prefix is stripped before routing (deployed as /prod)', async () => {
  const { requestOf } = await import('./lib/http.mjs')
  const at = (rawPath, stage) => requestOf({ rawPath, requestContext: { stage, http: { method: 'GET' } } }).path
  assert.equal(at('/prod/cs/health', 'prod'), '/cs/health')
  assert.equal(at('/prod', 'prod'), '/')
  assert.equal(at('/cs/health', '$default'), '/cs/health')
  assert.equal(at('/production/cs/health', 'prod'), '/production/cs/health', 'only a whole-segment stage prefix is stripped')
  const { call } = fixtureApp({ extraRoutes: routeModules })
  assert.equal((await call('GET', '/cs/health')).statusCode, 200)
})
