// Privacy-request intake for mail sent to support@r6coaching.com.
//
// The Privacy page tells players to email support@ with "Privacy request" in
// the subject, and promises deletion within 30 days. Until 2026-09-29 those
// emails were only forwarded to a personal inbox, with no record, no due date
// and no reminder. This module recognises them so the forwarder can log each
// one to the register (DynamoDB recon-privacy-requests) with a due date; the
// admin Lambda's daily privacy-deadlines job reminds staff until each request
// is closed (lambda/customer-success/tools/privacy-request.mjs records
// completion). See docs/PRIVACY-REQUESTS.md.
//
// Deliberately generous: a false positive costs one `close ... not_a_request`,
// a miss costs a missed legal deadline.
import { createHash } from 'node:crypto'

export const REGISTER_TABLE = 'recon-privacy-requests'
export const DEADLINE_DAYS = 30

const DELETE = /\b(delete|deleting|deletion|erase|erasure|remove|close)\b[^.\n]{0,40}\b(account|data|information|details|profile)\b/
const EXPORT = /\b(export|copy|download|access)\b[^.\n]{0,40}\b(my )?(data|information|personal data)\b/
const TRIGGER = /privacy request|\bgdpr\b|\bccpa\b|data subject|right to (be forgotten|erasure|access)/

/** { isRequest, kind } from the subject and the decoded text body. */
export function classifyPrivacyRequest(subject, text) {
  const s = String(subject || '').toLowerCase()
  const t = `${s}\n${String(text || '').toLowerCase().slice(0, 4000)}`
  const del = DELETE.test(t)
  const exp = EXPORT.test(t)
  const isRequest = TRIGGER.test(t) || del || exp
  const kind = del ? 'deletion' : exp ? 'export' : 'unspecified'
  return { isRequest, kind }
}

const decodeQP = (s) => s.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))

/** Best-effort plain text of a MIME body (text/plain parts, decoded). */
export function plainText(headBlock, body) {
  const ctype = /content-type:\s*([^;\r\n]+)(?:;[^\r\n]*boundary="?([^";\r\n]+)"?)?/i.exec(headBlock) || []
  const boundary = ctype[2] || (/boundary="?([^";\r\n]+)"?/i.exec(body) || [])[1]
  const decodePart = (headers, content) => {
    const cte = (/content-transfer-encoding:\s*([^\r\n;]+)/i.exec(headers) || [])[1]?.trim().toLowerCase()
    if (cte === 'base64') {
      try { return Buffer.from(content.replace(/\s+/g, ''), 'base64').toString('utf8') } catch { return '' }
    }
    return cte === 'quoted-printable' ? decodeQP(content) : content
  }
  if (!boundary) return decodePart(headBlock, body)
  const parts = body.split(`--${boundary}`)
  const texts = []
  for (const part of parts) {
    const i = part.search(/\r?\n\r?\n/)
    if (i < 0) continue
    const headers = part.slice(0, i)
    const content = part.slice(i).trim()
    if (/content-type:\s*multipart\//i.test(headers)) texts.push(plainText(headers, content))
    else if (/content-type:\s*text\/plain/i.test(headers) || !/content-type:/i.test(headers)) texts.push(decodePart(headers, content))
  }
  return texts.join('\n')
}

export const emailHash = (email) => createHash('sha256').update(String(email || '').trim().toLowerCase()).digest('hex').slice(0, 24)

/** Address inside "Name <addr>" (or the bare string). */
export const addressOf = (from) => (String(from || '').match(/<([^>]+)>/)?.[1] || String(from || '')).trim().toLowerCase()

/** The register row for one inbound email. Deterministic id per SES message. */
export function registerItem({ messageId, from, subject, kind, receivedAt }) {
  const received = new Date(receivedAt || Date.now())
  const due = new Date(received.getTime() + DEADLINE_DAYS * 86400000)
  const email = addressOf(from)
  const id = `PR-${received.toISOString().slice(0, 10).replace(/-/g, '')}-${createHash('sha256').update(String(messageId)).digest('hex').slice(0, 6)}`
  return {
    request_id: id,
    status: 'open',
    kind,
    source: 'email',
    received_at: received.toISOString(),
    due_at: due.toISOString(),
    email,
    email_hash: emailHash(email),
    subject: String(subject || '').slice(0, 160),
    ses_message_id: String(messageId),
  }
}
