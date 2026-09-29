// Daily privacy-deadline check (EventBridge rule recon6-privacy-deadlines-daily
// -> ghost-igl-mail-forward, {"job":"privacy-deadlines","notify":[...]}). It
// lives in the mail forwarder because that Lambda already sends mail as
// support@r6coaching.com and uses the runtime's AWS SDK (no dependencies).
//
// The register (recon-privacy-requests) gets a row for every privacy request:
// automatically for email to support@ (lambda/mail-forward), by hand for any
// other channel (privacy-request.mjs log). Every day this job emails staff
// while any request is still open, most urgent first, and says when one is
// due within 7 days or overdue. It also counts admin-console deletions whose
// full purge is still owed (audit user.delete without a later privacy.delete).
// The email names requests by id only, never an address; the operator looks
// them up with `privacy-request.mjs requests`. See docs/PRIVACY-REQUESTS.md.
import { createHash } from 'node:crypto'

export const REGISTER_TABLE = process.env.PRIVACY_REGISTER_TABLE || 'recon-privacy-requests'
const AUDIT_TABLE = process.env.AUDIT_TABLE || 'ghost-igl-audit-log'
const DAY = 86400000
const hash24 = (email) => createHash('sha256').update(String(email || '')).digest('hex').slice(0, 24)

/** Open requests with days left, most urgent first; which are due soon / overdue. */
export function deadlineReport(rows, now = Date.now()) {
  const open = rows
    .filter((r) => r.status === 'open')
    .map((r) => ({ id: r.request_id, kind: r.kind || 'unspecified', receivedAt: r.received_at, dueAt: r.due_at, daysLeft: Math.floor((Date.parse(r.due_at) - now) / DAY) }))
    .sort((a, b) => String(a.dueAt).localeCompare(String(b.dueAt)))
  return { open, dueSoon: open.filter((r) => r.daysLeft >= 0 && r.daysLeft <= 7), overdue: open.filter((r) => r.daysLeft < 0) }
}

/** Console deletions (user.delete) with no later privacy.delete for the same email. */
export function consolePurgesOwed(auditRows) {
  const purged = new Map()
  for (const r of auditRows) {
    if (r.action !== 'privacy.delete') continue
    if (String(r.timestamp) > (purged.get(r.target) || '')) purged.set(r.target, String(r.timestamp))
  }
  return auditRows
    .filter((r) => r.action === 'user.delete' && String(r.target || '').includes('@'))
    .filter((r) => String(r.timestamp) > (purged.get(`email_hash:${hash24(r.target)}`) || ''))
    .map((r) => ({ deletedAt: r.timestamp, daysSince: Math.floor((Date.now() - Date.parse(r.timestamp)) / DAY) }))
}

export function reminderEmail(report, owed) {
  const lines = []
  const urgent = report.overdue.length ? `${report.overdue.length} OVERDUE` : report.dueSoon.length ? `${report.dueSoon.length} due within 7 days` : `${report.open.length} open`
  lines.push(`Open privacy requests: ${report.open.length} (${urgent}).`, '')
  for (const r of report.open) {
    const when = r.daysLeft < 0 ? `OVERDUE by ${-r.daysLeft} day(s)` : `${r.daysLeft} day(s) left`
    lines.push(`- ${r.id}  ${r.kind}  received ${String(r.receivedAt).slice(0, 10)}  due ${String(r.dueAt).slice(0, 10)}  (${when})`)
  }
  if (owed.length) {
    lines.push('', `Admin-console deletions still owed a full purge: ${owed.length} (oldest ${Math.max(...owed.map((o) => o.daysSince))} days ago).`)
  }
  lines.push('', 'Look them up and act: node tools/privacy-request.mjs requests (lambda/customer-success). Runbook: docs/PRIVACY-REQUESTS.md.',
    'Close a request when done: the export/apply-delete commands close it automatically; otherwise privacy-request.mjs close <id> --outcome <completed|rejected|not_a_request> --note "...".')
  const subject = report.overdue.length
    ? `[Recon privacy] ${report.overdue.length} request(s) OVERDUE`
    : report.dueSoon.length
      ? `[Recon privacy] ${report.dueSoon.length} request(s) due within 7 days`
      : `[Recon privacy] ${report.open.length} open request(s)`
  return { subject, text: lines.join('\n') }
}

// `scan(TableName)` returns every row as a plain object. mode 'preview'
// never sends; `send(subject, text)` delivers to staff.
export async function runPrivacyDeadlines({ scan, send, mode = 'send', now = Date.now(), subjectPrefix = '' }) {
  const report = deadlineReport(await scan(REGISTER_TABLE), now)
  const owed = consolePurgesOwed(await scan(AUDIT_TABLE))
  const summary = { open: report.open.length, dueSoon: report.dueSoon.length, overdue: report.overdue.length, consolePurgesOwed: owed.length, requests: report.open.map((r) => ({ id: r.id, kind: r.kind, dueAt: r.dueAt, daysLeft: r.daysLeft })), sent: false }
  if (!report.open.length && !owed.length) return summary
  const mail = reminderEmail(report, owed)
  summary.subject = `${subjectPrefix}${mail.subject}`
  if (mode === 'preview') return summary
  await send(summary.subject, mail.text)
  summary.sent = true
  return summary
}
