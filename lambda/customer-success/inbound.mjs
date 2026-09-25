// Inbound replies: parse a raw email (as stored by an SES receipt rule) and
// put it on the player's canonical timeline, so normal operations never need
// a separate inbox. A reply starting with STOP/UNSUBSCRIBE suppresses all
// relationship and marketing email for that address (and, when enabled,
// mirrors the suppression into the existing CRM job's log).
//
// Not wired to SES in this change; see docs/RECON-CUSTOMER-SUCCESS.md.
//
// Sender authentication: the From header is trivially forged, so the SES
// receipt verdicts decide how far a message is trusted. Only a DMARC pass (or
// SPF and DKIM both passing when no DMARC verdict exists) counts as verified.
// An unverified message is kept for admins, is never shown to the player as
// their own words, and a STOP in it only turns marketing off (the harmless
// direction); an admin confirms anything more.

import { contactKeyFor } from './lib/ids.mjs'
import { ITEM_TYPES, messageItem, pkFor } from './data/items.mjs'
import { STOP_PATTERN } from './domain/outreach.mjs'
import { updateConsentWithRetry } from './routes/messages.mjs'

export { STOP_PATTERN }
const MAX_BODY = 4000
const MAX_HEADER = 2000
const FUTURE_SKEW_MS = 5 * 60 * 1000

function unfold(headerText) {
  return headerText.replace(/\r?\n[ \t]+/g, ' ')
}

function headerMap(headerText) {
  const map = {}
  for (const line of unfold(headerText).split(/\r?\n/)) {
    const idx = line.indexOf(':')
    if (idx > 0) {
      const name = line.slice(0, idx).trim().toLowerCase()
      if (!(name in map)) map[name] = line.slice(idx + 1).trim()
    }
  }
  return map
}

function decodeWords(value) {
  return String(value || '').replace(/=\?([^?]+)\?([BQbq])\?([^?]*)\?=/g, (_m, _charset, enc, text) => {
    try {
      if (enc.toUpperCase() === 'B') return Buffer.from(text, 'base64').toString('utf8')
      return Buffer.from(text.replace(/_/g, ' ').replace(/=([0-9A-F]{2})/gi, (_x, h) => String.fromCharCode(parseInt(h, 16))), 'binary').toString('utf8')
    } catch {
      return text
    }
  })
}

function decodeBody(text, encoding) {
  const enc = String(encoding || '').toLowerCase()
  if (enc === 'base64') {
    try { return Buffer.from(text.replace(/\s+/g, ''), 'base64').toString('utf8') } catch { return '' }
  }
  if (enc === 'quoted-printable') {
    return Buffer.from(text.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (_x, h) => String.fromCharCode(parseInt(h, 16))), 'binary').toString('utf8')
  }
  return text
}

function splitMessage(raw) {
  const match = /\r?\n\r?\n/.exec(raw)
  if (!match) return { headers: headerMap(raw), body: '' }
  return { headers: headerMap(raw.slice(0, match.index)), body: raw.slice(match.index + match[0].length) }
}

function plainTextPart(headers, body, depth = 0) {
  const type = String(headers['content-type'] || 'text/plain')
  const boundary = /boundary="?([^";]+)"?/i.exec(type)?.[1]
  if (/^multipart\//i.test(type) && boundary && depth < 4) {
    const parts = body.split(`--${boundary}`).slice(1).filter((p) => !p.startsWith('--'))
    for (const part of parts) {
      const inner = splitMessage(part.replace(/^\r?\n/, ''))
      const text = plainTextPart(inner.headers, inner.body, depth + 1)
      if (text !== null) return text
    }
    return null
  }
  if (/^text\/plain/i.test(type) || !headers['content-type']) return decodeBody(body, headers['content-transfer-encoding'])
  return null
}

// Keep only what the player newly wrote: drop quoted history and signatures.
export function stripQuoted(text) {
  const lines = String(text || '').split(/\r?\n/)
  const out = []
  for (const line of lines) {
    if (/^On .+wrote:\s*$/i.test(line.trim()) || /^-{2,}\s*Original Message/i.test(line.trim()) || /^From: .+/i.test(line.trim())) break
    if (line.trim() === '--') break
    if (line.startsWith('>')) continue
    out.push(line)
  }
  return out.join('\n').trim()
}

// Linear-time address extraction ("Name <a@b>" or a bare address). A regex
// like /<([^>]+)>/ is quadratic on input made of many "<" characters.
function addressFrom(header) {
  const value = String(header || '').slice(0, MAX_HEADER)
  const lt = value.lastIndexOf('<')
  const gt = lt === -1 ? -1 : value.indexOf('>', lt + 1)
  return (lt !== -1 && gt !== -1 ? value.slice(lt + 1, gt) : value).trim().toLowerCase()
}

function dateOrNull(value) {
  const ms = Date.parse(String(value || '').slice(0, 200))
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null
}

export function parseInboundEmail(raw) {
  const { headers, body } = splitMessage(String(raw || ''))
  const from = addressFrom(decodeWords(String(headers.from || '').slice(0, MAX_HEADER)))
  const text = stripQuoted(plainTextPart(headers, body) || '').slice(0, MAX_BODY)
  return {
    from,
    subject: decodeWords(String(headers.subject || '').slice(0, MAX_HEADER)).slice(0, 200) || null,
    messageId: String(headers['message-id'] || '').replace(/[<>]/g, '').slice(0, 200) || null,
    inReplyTo: String(headers['in-reply-to'] || '').replace(/[<>]/g, '').slice(0, 200) || null,
    date: dateOrNull(headers.date),
    text,
  }
}

// SES receipt verdicts: { spf, dkim, dmarc } each 'PASS' | 'FAIL' | 'GRAY' | ...
export function senderVerified(verdicts) {
  const v = verdicts || {}
  const status = (x) => String(x?.status || x || '').toUpperCase()
  if (status(v.dmarc) === 'PASS') return true
  if (!status(v.dmarc) || status(v.dmarc) === 'GRAY') return status(v.spf) === 'PASS' && status(v.dkim) === 'PASS'
  return false
}

const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i

export async function ingestInboundEmail({ raw, store, verdicts = null, now = Date.now(), legacy = null, log = console }) {
  const parsed = parseInboundEmail(raw)
  if (!EMAIL.test(parsed.from)) return { ok: false, reason: 'unparseable_sender' }
  if (!parsed.text) return { ok: false, reason: 'empty_body' }
  const contactKey = contactKeyFor(parsed.from)
  const verified = senderVerified(verdicts)
  // Key the message by the email's own Date header so a redelivered email
  // maps to the same item; also refuse a Message-ID we already stored. A
  // missing, malformed or future Date falls back to the receipt time (a
  // future date would otherwise hold outreach in "open conversation" for
  // as long as it liked).
  const headerMs = Date.parse(parsed.date || '')
  const at = Number.isFinite(headerMs) && headerMs <= now + FUTURE_SKEW_MS ? parsed.date : new Date(now).toISOString()
  const emailId = parsed.messageId ? `em-${parsed.messageId.replace(/[^a-z0-9]/gi, '').slice(0, 60)}` : null
  if (emailId) {
    const existing = await store.listContact(pkFor(contactKey))
    if (existing.some((i) => i.type === ITEM_TYPES.MESSAGE && i.messageId === emailId)) return { ok: true, duplicate: true, contactKey }
  }
  const item = messageItem({
    contactKey,
    email: parsed.from,
    direction: 'inbound',
    channel: 'email',
    subject: parsed.subject,
    body: parsed.text,
    at,
    author: 'player',
    messageId: emailId,
    inReplyTo: parsed.inReplyTo,
  })
  item.senderVerified = verified
  try {
    await store.put(item, { ifNotExists: true })
  } catch (err) {
    if (err?.name === 'ConditionalCheckFailedException') return { ok: true, duplicate: true, contactKey }
    throw err
  }

  let suppressed = false
  let suppressedScope = null
  if (STOP_PATTERN.test(parsed.text)) {
    const patch = verified
      ? { relationship: 'opted_out', marketing: 'opted_out', suppressedReason: 'player_stop_reply' }
      : { marketing: 'opted_out', suppressedReason: 'unverified_stop_reply' }
    await updateConsentWithRetry({ store, now: () => now }, { contactKey, email: parsed.from, patch, actor: verified ? 'player:email-reply' : 'unverified:email-reply' })
    suppressed = true
    suppressedScope = verified ? 'all' : 'marketing'
    if (legacy?.mirrorSuppression) {
      try { await legacy.mirrorSuppression(parsed.from, at, verified ? 'player_stop_reply' : 'unverified_stop_reply') } catch (err) { log.warn?.('legacy_suppression_mirror_failed', { error: err?.name }) }
    }
  }
  return { ok: true, contactKey, messageId: item.messageId, senderVerified: verified, suppressed, suppressedScope }
}
