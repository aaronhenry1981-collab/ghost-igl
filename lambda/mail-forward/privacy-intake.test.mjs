// Privacy-request intake: what counts as a request, how the body is read,
// and the register row. All addresses fictional.
import test from 'node:test'
import assert from 'node:assert/strict'
import { addressOf, classifyPrivacyRequest, emailHash, plainText, registerItem } from './privacy-intake.mjs'

test('requests are recognised from the subject the Privacy page asks for, or the body', () => {
  assert.deepEqual(classifyPrivacyRequest('Privacy request', ''), { isRequest: true, kind: 'unspecified' })
  assert.deepEqual(classifyPrivacyRequest('Privacy request', 'Please delete my account and all my data.'), { isRequest: true, kind: 'deletion' })
  assert.deepEqual(classifyPrivacyRequest('hi', 'Can I get a copy of my data?'), { isRequest: true, kind: 'export' })
  assert.deepEqual(classifyPrivacyRequest('GDPR', 'right to erasure'), { isRequest: true, kind: 'unspecified' })
  assert.deepEqual(classifyPrivacyRequest('Privacy request', 'Please send me a copy of my data and then delete my account.'), { isRequest: true, kind: 'export+deletion' }, 'copy + delete is one combined request')
  assert.equal(classifyPrivacyRequest('Refund', 'I would like to cancel my subscription, manage subscription says invalid API key').isRequest, false)
  assert.equal(classifyPrivacyRequest('Question about my booking', 'Can I move my session to Friday?').isRequest, false)
})

test('plain text is decoded from quoted-printable and base64 multipart mail', () => {
  const qpHead = 'Content-Type: multipart/alternative; boundary="b1"'
  const qpBody = '--b1\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\nPlease delete my acc=\r\nount=2E\r\n--b1\r\nContent-Type: text/html\r\n\r\n<p>x</p>\r\n--b1--'
  assert.match(plainText(qpHead, qpBody), /delete my account\./)
  const b64 = Buffer.from('I want to erase my personal data').toString('base64')
  const b64Body = `--b2\r\nContent-Type: text/plain\r\nContent-Transfer-Encoding: base64\r\n\r\n${b64}\r\n--b2--`
  assert.match(plainText('Content-Type: multipart/mixed; boundary=b2', b64Body), /erase my personal data/)
  assert.equal(plainText('Content-Type: text/plain', 'just text'), 'just text')
})

test('the register row: deterministic id per message, 30-day due date, hashed and plain address', () => {
  const row = registerItem({ messageId: 'ses-msg-1', from: 'Player One <Player.One@Example.test>', subject: 'Privacy request', kind: 'deletion', receivedAt: '2026-09-29T10:00:00.000Z' })
  assert.match(row.request_id, /^PR-20260929-[0-9a-f]{6}$/)
  assert.equal(row.request_id, registerItem({ messageId: 'ses-msg-1', from: 'x', receivedAt: '2026-09-29T10:00:00.000Z' }).request_id, 'SES redelivery maps to the same row')
  assert.equal(row.due_at, '2026-10-29T10:00:00.000Z')
  assert.equal(row.status, 'open')
  assert.equal(row.email, 'player.one@example.test')
  assert.equal(row.email_hash, emailHash('player.one@example.test'))
  assert.equal(addressOf('bare@example.test'), 'bare@example.test')
})
