import test from 'node:test'
import assert from 'node:assert/strict'
import { ingestInboundEmail, parseInboundEmail, stripQuoted } from './inbound.mjs'
import { createMemoryStore } from './data/memoryStore.mjs'
import { contactKeyFor } from './lib/ids.mjs'

const CRLF = (s) => s.replace(/\n/g, '\r\n')

const MULTIPART = CRLF(`From: "Maya Fixture" <Quiet.Anchor@example.test>
To: coach@r6coaching.com
Subject: =?UTF-8?B?UmU6IFlvdXIgc2Vzc2lvbiByZWNhcA==?=
Message-ID: <abc123@mail.example.test>
In-Reply-To: <out-1@r6coaching.com>
Date: Thu, 24 Sep 2026 18:00:00 +0000
Content-Type: multipart/alternative; boundary="b1"

--b1
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: quoted-printable

That drill helped. Went 7-3 on Bank last night.=0A
Can we look at CEO next?

On Wed, Sep 23, 2026 at 5:00 PM Recon 6 <coach@r6coaching.com> wrote:
> Your session recap
> Drill: change angle after every trade
--b1
Content-Type: text/html; charset=utf-8

<p>That drill helped.</p>
--b1--
`)

test('parses sender, decoded subject, ids and only the new text of a reply', () => {
  const parsed = parseInboundEmail(MULTIPART)
  assert.equal(parsed.from, 'quiet.anchor@example.test')
  assert.equal(parsed.subject, 'Re: Your session recap')
  assert.equal(parsed.messageId, 'abc123@mail.example.test')
  assert.equal(parsed.inReplyTo, 'out-1@r6coaching.com')
  assert.match(parsed.text, /Went 7-3 on Bank/)
  assert.doesNotMatch(parsed.text, /Your session recap|change angle/)
})

test('stripQuoted drops quoted history and signatures', () => {
  assert.equal(stripQuoted('Thanks!\n\n-- \nSent from phone'), 'Thanks!')
  assert.equal(stripQuoted('Yes\n> old line\n> older'), 'Yes')
})

test('ingest puts the reply on the player timeline, once', async () => {
  const store = createMemoryStore()
  const first = await ingestInboundEmail({ raw: MULTIPART, store, now: Date.parse('2026-09-24T18:01:00Z') })
  assert.equal(first.ok, true)
  assert.equal(first.contactKey, contactKeyFor('quiet.anchor@example.test'))
  const again = await ingestInboundEmail({ raw: MULTIPART, store, now: Date.parse('2026-09-24T18:02:00Z') })
  assert.equal(again.duplicate, true, 'the same Message-ID is ingested once')
  const msgs = (await store.listAll()).filter((i) => i.type === 'MSG')
  assert.equal(msgs.length, 1)
  assert.equal(msgs[0].direction, 'inbound')
  assert.equal(msgs[0].channel, 'email')
})

test('STOP reply from an authenticated sender suppresses relationship + marketing email and mirrors to the existing CRM log', async () => {
  const store = createMemoryStore()
  const mirrored = []
  const raw = CRLF('From: rookie.recruit@example.test\nSubject: Re: hi\nMessage-ID: <stop1@x.test>\n\nSTOP\n')
  const res = await ingestInboundEmail({ raw, store, verdicts: { spf: 'PASS', dkim: 'PASS', dmarc: 'PASS' }, legacy: { mirrorSuppression: async (email, at, reason) => mirrored.push({ email, reason }) } })
  assert.equal(res.suppressed, true)
  const consent = (await store.listAll()).find((i) => i.type === 'CONSENT')
  assert.equal(consent.relationship, 'opted_out')
  assert.equal(consent.marketing, 'opted_out')
  assert.deepEqual(mirrored, [{ email: 'rookie.recruit@example.test', reason: 'player_stop_reply' }])
})

test('rejects unparseable senders and empty bodies', async () => {
  const store = createMemoryStore()
  assert.equal((await ingestInboundEmail({ raw: 'Subject: x\n\nhello', store })).reason, 'unparseable_sender')
  assert.equal((await ingestInboundEmail({ raw: 'From: a@b.test\n\n> only quoted', store })).reason, 'empty_body')
})
