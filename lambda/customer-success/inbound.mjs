// Inbound replies: parse a raw email (as stored by an SES receipt rule) and
// put it on the player's canonical timeline, so normal operations never need
// a separate inbox. A reply starting with STOP/UNSUBSCRIBE suppresses all
// relationship and marketing email for that address (and, when enabled,
// mirrors the suppression into the existing CRM job's log).
//
// Not wired to SES in this change; see docs/RECON-CUSTOMER-SUCCESS.md.

import { contactKeyFor } from './lib/ids.mjs'
import { consentItem, ITEM_TYPES, messageItem, pkFor } from './data/items.mjs'
import { STOP_PATTERN } from './domain/outreach.mjs'

export { STOP_PATTERN }
const MAX_BODY = 4000

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

export function parseInboundEmail(raw) {
  const { headers, body } = splitMessage(String(raw || ''))
  const fromHeader = decodeWords(headers.from || '')
  const from = (/<([^>]+)>/.exec(fromHeader)?.[1] || fromHeader).trim().toLowerCase()
  const text = stripQuoted(plainTextPart(headers, body) || '').slice(0, MAX_BODY)
  return {
    from,
    subject: decodeWords(headers.subject || '').slice(0, 200) || null,
    messageId: String(headers['message-id'] || '').replace(/[<>]/g, '').slice(0, 200) || null,
    inReplyTo: String(headers['in-reply-to'] || '').replace(/[<>]/g, '').slice(0, 200) || null,
    date: headers.date ? new Date(headers.date).toISOString() : null,
    text,
  }
}

const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i

export async function ingestInboundEmail({ raw, store, now = Date.now(), legacy = null, log = console }) {
  const parsed = parseInboundEmail(raw)
  if (!EMAIL.test(parsed.from)) return { ok: false, reason: 'unparseable_sender' }
  if (!parsed.text) return { ok: false, reason: 'empty_body' }
  const contactKey = contactKeyFor(parsed.from)
  // Key the message by the email's own Date header so a redelivered email
  // maps to the same item; also refuse a Message-ID we already stored.
  const at = parsed.date && Number.isFinite(Date.parse(parsed.date)) ? parsed.date : new Date(now).toISOString()
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
  try {
    await store.put(item, { ifNotExists: true })
  } catch (err) {
    if (err?.name === 'ConditionalCheckFailedException') return { ok: true, duplicate: true, contactKey }
    throw err
  }

  let suppressed = false
  if (STOP_PATTERN.test(parsed.text)) {
    const previous = await store.get(pkFor(contactKey), ITEM_TYPES.CONSENT)
    await store.put(consentItem({
      contactKey,
      email: parsed.from,
      previous,
      patch: { relationship: 'opted_out', marketing: 'opted_out', suppressedReason: 'player_stop_reply' },
      at,
      actor: 'player:email-reply',
    }))
    suppressed = true
    if (legacy?.mirrorSuppression) {
      try { await legacy.mirrorSuppression(parsed.from, at, 'player_stop_reply') } catch (err) { log.warn?.('legacy_suppression_mirror_failed', { error: err?.name }) }
    }
  }
  return { ok: true, contactKey, messageId: item.messageId, suppressed }
}
