// Support email ingestion decisions (ARCHITECTURE §10). Pure: no SES, no
// storage writes. The caller performs the side effects the decision names.
//
//   dedupe     canonical Message-ID -> sha256 -> SUP#EMAIL MID#<hash>
//   threading  1) support+<caseToken>@ plus-address (token = caseId + HMAC,
//                 lowercase so MTAs that fold case do not break it)
//              2) In-Reply-To / References against stored outbound ids
//   trust      SES verdicts via PR #24 senderVerified(verdicts, parsed): a
//              DMARC pass for a From header that is exactly one clean
//              mailbox (and, when the verdicts name it, the DMARC domain).
//              An unverified sender or a From that is not the case owner is
//              NEVER auto-attached
//   automated  Auto-Submitted, Precedence, X-Autoreply, X-Auto-Response-
//              Suppress, DSN multipart/report, MAILER-DAEMON / postmaster
//   content    quote-stripped text; HTML-only mail falls back to text;
//              attachments become a manifest (name, mime, size) only
//   STOP       STOP-like text in a support reply is NOT an opt-out.

import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { parseInboundEmail, senderVerified, stripQuoted } from '../inbound.mjs'
import { redactSensitive } from './redact.mjs'

const MAX_RAW = 2 * 1024 * 1024
const MAX_HTML = 200 * 1024
const MAX_TEXT = 4000
const MAX_PARTS = 50
const MAX_HEADER = 4000
const TOKEN_MAC_HEX = 16
const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i

// ---- MIME helpers (bounded, linear) ----------------------------------------------

function unfold(text) {
  return text.replace(/\r?\n[ \t]+/g, ' ')
}

export function parseHeaders(headerText) {
  const map = {}
  for (const line of unfold(String(headerText || '')).split(/\r?\n/)) {
    const idx = line.indexOf(':')
    if (idx <= 0) continue
    const name = line.slice(0, idx).trim().toLowerCase()
    const value = line.slice(idx + 1).trim().slice(0, MAX_HEADER)
    if (!(name in map)) map[name] = value
    else if (['received', 'references'].includes(name)) map[name] = `${map[name]} ${value}`
  }
  return map
}

function split(raw) {
  const m = /\r?\n\r?\n/.exec(raw)
  if (!m) return { headers: parseHeaders(raw), body: '' }
  return { headers: parseHeaders(raw.slice(0, m.index)), body: raw.slice(m.index + m[0].length) }
}

function param(value, name) {
  const re = new RegExp(`(?:^|;)\\s*${name}\\*?=\\s*(?:"([^"]*)"|([^;\\s]*))`, 'i')
  const m = re.exec(String(value || ''))
  return m ? (m[1] ?? m[2] ?? '').trim() : null
}

function decode(body, encoding) {
  const enc = String(encoding || '').toLowerCase()
  if (enc === 'base64') {
    try { return Buffer.from(body.replace(/\s+/g, ''), 'base64') } catch { return Buffer.alloc(0) }
  }
  if (enc === 'quoted-printable') {
    return Buffer.from(body.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (_x, h) => String.fromCharCode(parseInt(h, 16))), 'binary')
  }
  return Buffer.from(body, 'utf8')
}

// Flatten a MIME tree into leaf parts.
export function mimeParts(raw) {
  const leaves = []
  const walk = (headers, body, depth) => {
    if (leaves.length >= MAX_PARTS) return
    const type = String(headers['content-type'] || 'text/plain')
    const boundary = param(type, 'boundary')
    if (/^multipart\//i.test(type) && boundary && depth < 5) {
      for (const chunk of body.split(`--${boundary}`).slice(1)) {
        if (chunk.startsWith('--')) break
        const inner = split(chunk.replace(/^\r?\n/, ''))
        walk(inner.headers, inner.body, depth + 1)
      }
      return
    }
    leaves.push({ headers, body })
  }
  const top = split(String(raw || '').slice(0, MAX_RAW))
  walk(top.headers, top.body, 0)
  return { headers: top.headers, parts: leaves }
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" }

// Removes script/style/head blocks, quoted history and every tag, repeating
// until nothing changes (nested fragments like "<scr<script>x</script>ipt>"
// only become a tag after the inner one is removed).
function stripMarkup(input) {
  let s = input
  for (let pass = 0; pass < 5; pass += 1) {
    const before = s
    s = s.replace(/<(script|style|head)\b[\s\S]*?<\/\1\s*>/gi, ' ')
    s = s.replace(/<blockquote\b[\s\S]*?<\/blockquote\s*>/gi, ' ')
    s = s.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|tr|h[1-6])\s*>/gi, '\n')
    s = s.replace(/<[^>]{0,2000}>/g, ' ')
    if (s === before) break
  }
  return s
}

function decodeEntities(s) {
  return s.replace(/&(#\d{1,6}|#x[0-9a-f]{1,6}|[a-z]{2,6}|#39);/gi, (m, code) => {
    const key = code.toLowerCase()
    if (ENTITIES[key] !== undefined) return ENTITIES[key]
    const cp = key.startsWith('#x') ? parseInt(key.slice(2), 16) : key.startsWith('#') ? parseInt(key.slice(1), 10) : NaN
    if (key.startsWith('#')) return Number.isFinite(cp) && cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ' '
    return m
  })
}

// HTML -> plain text. Tags are stripped, entities decoded ONCE, and tags are
// stripped again, because "&lt;script&gt;" only becomes markup after
// decoding. A final guard neutralizes anything that still reads as markup
// or a script URL, so the stored text never contains "<script", "<img",
// "on<event>=" or "javascript:".
export function htmlToText(html) {
  let s = String(html || '').slice(0, MAX_HTML)
  // Quoted history in HTML replies.
  s = s.replace(/<div[^>]*class="?[^">]*gmail_quote[\s\S]*$/i, ' ')
  s = stripMarkup(s)
  s = decodeEntities(s)
  s = stripMarkup(s)
  s = s.replace(/<(?=[A-Za-z!/?])/g, '< ')
  s = s.replace(/javascript\s*:/gi, 'javascript ')
  s = s.replace(/\b(on[a-z]{2,})\s*=/gi, '$1 ')
  return s.split('\n').map((line) => line.replace(/[ \t]+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

// ---- identifiers -------------------------------------------------------------------------

// "<ABC.123@Mail.Example.COM>" -> "ABC.123@mail.example.com"
export function canonicalMessageId(raw) {
  let value = String(raw || '').trim().slice(0, 1000)
  const lt = value.indexOf('<')
  const gt = lt === -1 ? -1 : value.indexOf('>', lt + 1)
  if (lt !== -1 && gt !== -1) value = value.slice(lt + 1, gt)
  value = value.replace(/[<>\s]/g, '')
  if (!value) return null
  const at = value.lastIndexOf('@')
  return at > 0 ? `${value.slice(0, at)}@${value.slice(at + 1).toLowerCase()}` : value
}

export function messageIdHash(raw) {
  const canonical = canonicalMessageId(raw)
  return canonical ? createHash('sha256').update(canonical).digest('hex') : null
}

function idsFrom(header) {
  const out = []
  const text = String(header || '').slice(0, MAX_HEADER)
  let i = 0
  while (out.length < 50) {
    const lt = text.indexOf('<', i)
    if (lt === -1) break
    const gt = text.indexOf('>', lt + 1)
    if (gt === -1) break
    const id = canonicalMessageId(text.slice(lt, gt + 1))
    if (id) out.push(id)
    i = gt + 1
  }
  return out
}

// ---- automated mail ----------------------------------------------------------------------

export function classifyAutomated(headers = {}) {
  const h = {}
  for (const [k, v] of Object.entries(headers || {})) h[String(k).toLowerCase()] = String(v ?? '')
  const from = h.from || ''
  const autoSubmitted = (h['auto-submitted'] || '').trim().toLowerCase()
  if (autoSubmitted && autoSubmitted !== 'no') return { automated: true, kind: autoSubmitted.startsWith('auto-replied') ? 'auto_reply' : 'auto_generated', reason: `Auto-Submitted: ${autoSubmitted}` }
  const precedence = (h.precedence || '').trim().toLowerCase()
  if (['bulk', 'auto_reply', 'list', 'junk'].includes(precedence)) return { automated: true, kind: precedence === 'auto_reply' ? 'auto_reply' : precedence === 'list' ? 'list' : 'bulk', reason: `Precedence: ${precedence}` }
  if ('x-autoreply' in h || 'x-autorespond' in h) return { automated: true, kind: 'auto_reply', reason: 'X-Autoreply header' }
  const suppress = (h['x-auto-response-suppress'] || '').toLowerCase()
  if (/\b(all|oof|autoreply|dr|rn|nrn)\b/.test(suppress)) return { automated: true, kind: 'auto_generated', reason: `X-Auto-Response-Suppress: ${suppress}` }
  const type = (h['content-type'] || '').toLowerCase()
  if (/^multipart\/report/.test(type) && /report-type="?(delivery-status|disposition-notification)/.test(type)) return { automated: true, kind: 'dsn', reason: 'multipart/report delivery status' }
  if (/(^|[<\s"])(mailer-daemon|postmaster)@/i.test(from) || /^\s*(mailer-daemon|postmaster)\b/i.test(from)) return { automated: true, kind: 'dsn', reason: 'MAILER-DAEMON / postmaster sender' }
  if ((h['return-path'] || '').replace(/\s/g, '') === '<>') return { automated: true, kind: 'dsn', reason: 'null Return-Path' }
  return { automated: false, kind: null, reason: null }
}

// ---- case tokens --------------------------------------------------------------------------

function secretBytes(secret) {
  const buf = Buffer.isBuffer(secret) ? secret : Buffer.from(String(secret || ''), 'utf8')
  if (buf.length < 32) throw new Error('case token secret must be at least 32 bytes')
  return buf
}

function mac(caseId, secret) {
  return createHmac('sha256', secretBytes(secret)).update(`recon-support-case:v1:${caseId}`).digest('hex').slice(0, TOKEN_MAC_HEX)
}

const CASE_ID = /^[0-9a-f][0-9a-f-]{6,62}[0-9a-f]$/

export function caseTokenFor(caseId, secret) {
  const id = String(caseId || '').trim().toLowerCase()
  if (!CASE_ID.test(id)) throw new Error('caseId must be a lowercase hex/uuid id')
  return `${id}.${mac(id, secret)}`
}

// Accepts an address ("Support <support+<token>@r6coaching.com>") or a bare
// token; returns { caseId, token } only when the HMAC verifies.
export function caseFromPlusAddress(address, secret) {
  const value = String(address || '').slice(0, 1000).toLowerCase()
  const m = /(?:^|[\s<,"'])support\+([0-9a-f-]{8,64})\.([0-9a-f]{16})@/.exec(value) || /^([0-9a-f-]{8,64})\.([0-9a-f]{16})$/.exec(value.trim())
  if (!m) return null
  const caseId = m[1]
  if (!CASE_ID.test(caseId)) return null
  const expected = Buffer.from(mac(caseId, secret), 'utf8')
  const given = Buffer.from(m[2], 'utf8')
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  return { caseId, token: `${caseId}.${m[2]}` }
}

function plusTokens(headers) {
  const fields = ['to', 'cc', 'delivered-to', 'x-original-to', 'x-forwarded-to', 'envelope-to']
  const out = []
  for (const field of fields) {
    const value = String(headers[field] || '').toLowerCase()
    const re = /support\+([0-9a-f-]{8,64}\.[0-9a-f]{16})@/g
    let m
    let guard = 0
    while ((m = re.exec(value)) && guard < 10) {
      if (!out.includes(m[1])) out.push(m[1])
      guard += 1
    }
  }
  return out
}

// ---- decision ------------------------------------------------------------------------------

function attachmentsOf(parts) {
  const out = []
  for (const part of parts) {
    const disposition = String(part.headers['content-disposition'] || '')
    const type = String(part.headers['content-type'] || '')
    const name = param(disposition, 'filename') || param(type, 'name')
    if (!/^attachment/i.test(disposition) && !name) continue
    const size = decode(part.body, part.headers['content-transfer-encoding']).length
    // Names are shown to staff: control / bidi / zero-width characters are
    // removed (redactSensitive normalizes) and secrets in them redacted.
    const safeName = redactSensitive(String(name || 'attachment').slice(0, 400)).text.replace(/[\\/\r\n\0]/g, '_').slice(0, 200) || 'attachment'
    out.push({ name: safeName, mime: (type.split(';')[0] || 'application/octet-stream').trim().toLowerCase().slice(0, 100), size })
  }
  return out
}

function bodyText(parsedText, parts) {
  if (parsedText) return { text: parsedText, format: 'text' }
  const html = parts.find((p) => /^text\/html/i.test(String(p.headers['content-type'] || '')) && !/^attachment/i.test(String(p.headers['content-disposition'] || '')))
  if (!html) return { text: '', format: 'none' }
  const decoded = decode(html.body, html.headers['content-transfer-encoding']).toString('utf8')
  return { text: stripQuoted(htmlToText(decoded)).slice(0, MAX_TEXT), format: 'html_fallback' }
}

const STOP_LIKE = /^\s*(stop|unsubscribe|remove me|opt out)\b/i

async function call(fn, ...args) {
  return typeof fn === 'function' ? fn(...args) : null
}

async function decide({ raw, verdicts = null, lookups = {}, now = Date.now(), providerMessageId = null } = {}) {
  const parsed = parseInboundEmail(raw)
  const { headers, parts } = mimeParts(raw)
  const { text, format } = bodyText(parsed.text, parts)
  const attachments = attachmentsOf(parts)
  const midHash = messageIdHash(headers['message-id'])
    || createHash('sha256').update(`synthetic:${parsed.from}|${headers.date || ''}|${parsed.subject || ''}|${text.slice(0, 500)}`).digest('hex')
  const message = {
    text,
    format,
    subject: parsed.subject,
    from: parsed.from,
    messageIdHash: midHash,
    providerMessageId: providerMessageId ? String(providerMessageId).slice(0, 200) : null,
    attachments,
    receivedAt: new Date(now).toISOString(),
  }
  // Verified = DMARC pass for a From header that is one clean mailbox (and
  // the DMARC domain, when the verdicts name it). Several mailboxes, group
  // syntax or text after the address make the sender unverified.
  const verified = senderVerified(verdicts, parsed)
  const base = { message, stopTextIsOptOut: false, senderVerified: verified, fromStatus: parsed.fromStatus }
  if (STOP_LIKE.test(text)) base.notes = ['stop_like_text_not_an_opt_out']

  if (!EMAIL.test(parsed.from)) return { ...base, outcome: 'rejected', reason: 'unparseable_sender' }
  if (!text && !attachments.length) return { ...base, outcome: 'rejected', reason: 'empty_message' }
  if (await call(lookups.seenMessageIdHash, midHash)) return { ...base, outcome: 'duplicate', reason: 'message_id_seen' }
  const automated = classifyAutomated(headers)
  if (automated.automated) return { ...base, outcome: 'automated', reason: `automated_${automated.kind}`, automated }

  // Threading: plus-address token first, then References / In-Reply-To.
  let caseRef = null
  let threadedBy = null
  for (const token of plusTokens(headers)) {
    caseRef = await call(lookups.caseByToken, token)
    if (caseRef) { threadedBy = 'plus_token'; break }
  }
  if (!caseRef) {
    const ids = [...idsFrom(headers['in-reply-to']), ...idsFrom(headers.references).reverse()]
    for (const id of [...new Set(ids)]) {
      caseRef = await call(lookups.caseByOutboundMessageId, id)
      if (caseRef) { threadedBy = 'references'; break }
    }
  }

  if (caseRef) {
    if (!verified) return { ...base, outcome: 'unmatched', reason: parsed.fromStatus !== 'ok' ? `sender_${parsed.fromStatus}` : 'sender_unverified', caseRef, threadedBy }
    const owner = String(caseRef.ownerEmail || caseRef.email || '').trim().toLowerCase()
    if (!owner || owner !== parsed.from) return { ...base, outcome: 'unmatched', reason: 'sender_not_case_owner', caseRef, threadedBy }
    return { ...base, outcome: 'attach', reason: `threaded_by_${threadedBy}`, caseRef, contactKey: caseRef.contactKey || null, threadedBy }
  }
  if (!verified) return { ...base, outcome: 'unmatched', reason: parsed.fromStatus !== 'ok' ? `sender_${parsed.fromStatus}` : 'sender_unverified' }
  const contact = await call(lookups.contactByEmail, parsed.from)
  if (!contact) return { ...base, outcome: 'unmatched', reason: 'no_matching_account' }
  return { ...base, outcome: 'new_case', reason: 'verified_known_sender', contactKey: typeof contact === 'string' ? contact : contact.contactKey || null }
}

// Service-facing aliases. The support service reads `action`
// (attach | new_case | unmatched | ignore), `sender`, `match` and a top-level
// `messageIdHash`; it may also pass the SES message as `{ message }`. Both
// shapes map onto the same decision; nothing is loosened: `match.confidence`
// is 'certain' only for attach/new_case, which already require a verified
// sender (and, for attach, the case owner).
const ACTION_FOR = { attach: 'attach', new_case: 'new_case', unmatched: 'unmatched', automated: 'ignore', duplicate: 'ignore', rejected: 'ignore' }

export async function decideInboundEmail(input = {}) {
  let { raw, verdicts = null, lookups = {}, now = Date.now(), providerMessageId = null } = input || {}
  const m = input?.message
  if (raw === undefined && typeof m === 'string') raw = m
  else if (raw === undefined && m && typeof m === 'object') {
    raw = m.raw ?? m.content ?? ''
    verdicts = verdicts ?? m.verdicts ?? null
    providerMessageId = providerMessageId ?? m.providerMessageId ?? null
  }
  const d = await decide({ raw, verdicts, lookups: lookups || {}, now, providerMessageId })
  const certain = d.outcome === 'attach' || d.outcome === 'new_case'
  return {
    ...d,
    action: ACTION_FOR[d.outcome] || 'unmatched',
    messageIdHash: d.message.messageIdHash,
    providerMessageId: d.message.providerMessageId,
    subject: d.message.subject,
    text: d.message.text,
    sender: { email: d.message.from, verified: d.senderVerified === true },
    match: {
      confidence: certain ? 'certain' : 'none',
      contactKey: d.contactKey || d.caseRef?.contactKey || null,
      caseNumber: d.caseRef?.caseNumber || null,
    },
  }
}
