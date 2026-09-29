// Privacy deadline reminders: which requests are urgent, what the staff email
// says (ids only, never an address), and when nothing is sent.
import test from 'node:test'
import assert from 'node:assert/strict'
import { consolePurgesOwed, deadlineReport, reminderEmail, runPrivacyDeadlines } from './privacy-deadlines.mjs'

const NOW = Date.parse('2026-09-29T12:00:00.000Z')
const DAY = 86400000
const row = (id, dueInDays, extra = {}) => ({ request_id: id, status: 'open', kind: 'deletion', email: `${id}@example.test`, received_at: new Date(NOW + (dueInDays - 30) * DAY).toISOString(), due_at: new Date(NOW + dueInDays * DAY).toISOString(), ...extra })

test('open requests sorted by due date; due-soon and overdue flagged; closed ones ignored', () => {
  const r = deadlineReport([row('PR-a', 20), row('PR-b', 3), row('PR-c', -2), row('PR-d', 1, { status: 'completed' })], NOW)
  assert.deepEqual(r.open.map((x) => x.id), ['PR-c', 'PR-b', 'PR-a'])
  assert.deepEqual(r.dueSoon.map((x) => x.id), ['PR-b'])
  assert.deepEqual(r.overdue.map((x) => x.id), ['PR-c'])
})

test('the staff email names ids and dates only, never an address', () => {
  const r = deadlineReport([row('PR-a', 20), row('PR-c', -2)], NOW)
  const mail = reminderEmail(r, [{ deletedAt: '2026-07-17T00:00:00Z', daysSince: 74 }])
  assert.match(mail.subject, /1 request\(s\) OVERDUE/)
  assert.match(mail.text, /PR-c\s+deletion.*OVERDUE by 2 day/)
  assert.match(mail.text, /still owed a full purge: 1/)
  assert.doesNotMatch(mail.text + mail.subject, /@/)
})

test('console deletions count as owed until a later privacy.delete for the same email', async () => {
  const { createHash } = await import('node:crypto')
  const h = (e) => createHash('sha256').update(e).digest('hex').slice(0, 24)
  const audit = [
    { action: 'user.delete', target: 'a@example.test', timestamp: '2026-07-17T00:00:00Z' },
    { action: 'user.delete', target: 'b@example.test', timestamp: '2026-07-18T00:00:00Z' },
    { action: 'privacy.delete', target: `email_hash:${h('b@example.test')}`, timestamp: '2026-07-20T00:00:00Z' },
  ]
  assert.equal(consolePurgesOwed(audit).length, 1)
})

test('nothing open and nothing owed: no email; preview never sends', async () => {
  const sent = []
  const ddb = (register, audit) => async (TableName) => (TableName === 'ghost-igl-audit-log' ? audit : register)
  const send = async (s, t) => sent.push({ s, t })
  const quiet = await runPrivacyDeadlines({ scan: ddb([], []), send, now: NOW })
  assert.equal(quiet.sent, false)
  const preview = await runPrivacyDeadlines({ scan: ddb([row('PR-a', 3)], []), send, mode: 'preview', now: NOW })
  assert.equal(preview.sent, false)
  assert.equal(preview.dueSoon, 1)
  const real = await runPrivacyDeadlines({ scan: ddb([row('PR-a', 3)], []), send, now: NOW, subjectPrefix: '[TEST] ' })
  assert.equal(real.sent, true)
  assert.equal(sent.length, 1)
  assert.match(sent[0].s, /^\[TEST\] \[Recon privacy\] 1 request\(s\) due within 7 days/)
})
