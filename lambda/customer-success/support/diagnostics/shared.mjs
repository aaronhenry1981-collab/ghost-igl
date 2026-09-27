// Shared helpers for the Player Success diagnostics providers.
//
// A provider returns a *draft* panel. Each fact / inference carries an
// internal `vis` tag that decides who may see it:
//   player      - safe, simplified text for the player's own view
//   staff       - any support role (agent and up)
//   billing     - full billing identifiers (billing / lead / admin)
//   engineering - request / job / record ids (engineering / lead / admin)
// buildDiagnostics() filters by view + role and strips the tag. A billing
// fact may carry `masked` (shown to roles without billing access instead of
// hiding the row entirely).
//
// Pure module: no AWS SDK, no network.

export const PANEL_STATUS = Object.freeze(['ok', 'degraded', 'unavailable', 'not_connected', 'not_recorded', 'not_available'])

export const NOT_RECORDED = 'not recorded'

const DAY = 86400000

export function toMs(value) {
  if (value === null || value === undefined || value === '') return NaN
  if (typeof value === 'number') return value < 1e12 ? value * 1000 : value
  return Date.parse(value)
}

export function isoOrNull(value) {
  const ms = toMs(value)
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null
}

export function dateOnly(value) {
  const iso = isoOrNull(value)
  return iso ? iso.slice(0, 10) : null
}

export function daysBetween(from, to) {
  const a = toMs(from)
  const b = toMs(to)
  return Number.isFinite(a) && Number.isFinite(b) ? Math.floor((b - a) / DAY) : null
}

export function fact(label, value, source, at = null, vis = 'staff', extra = {}) {
  return { label, value, source, at: isoOrNull(at), vis, ...extra }
}

export function inference(label, value, basis, confidence = 0.5, vis = 'staff') {
  return { label, value, basis, confidence: Math.max(0, Math.min(1, Math.round(confidence * 100) / 100)), vis }
}

export function panel(id, title, status, { facts = [], inferences = [], user = [], recon = [], signals = {}, context = null } = {}) {
  return { id, title, status, facts, inferences, actions: { user, recon }, signals, context }
}

// ---- roles --------------------------------------------------------------------

const ROLE_ALIASES = { admins: 'admin', 'support-agent': 'agent', 'support-billing': 'billing', 'support-engineering': 'engineering', 'support-lead': 'lead' }

export function normalizeRoles(roles) {
  const out = new Set()
  for (const role of Array.isArray(roles) ? roles : []) {
    const value = String(role || '').trim().toLowerCase()
    if (value) out.add(ROLE_ALIASES[value] || value)
  }
  return out
}

export function canSeeBilling(roles) {
  const set = roles instanceof Set ? roles : normalizeRoles(roles)
  return set.has('billing') || set.has('lead') || set.has('admin')
}

export function canSeeEngineering(roles) {
  const set = roles instanceof Set ? roles : normalizeRoles(roles)
  return set.has('engineering') || set.has('lead') || set.has('admin')
}

// `cus_ABCDEFGH1234` -> `cus_…1234`. Anything short or unknown is fully masked.
export function maskId(value) {
  const text = String(value || '')
  if (!text) return null
  const underscore = text.indexOf('_')
  const prefix = underscore > 0 && underscore < 6 ? text.slice(0, underscore + 1) : ''
  const tail = text.length - prefix.length >= 8 ? text.slice(-4) : ''
  return `${prefix}…${tail}`
}

// ---- secret scrubbing (defence in depth; nothing here should ever carry one) ----

export const SECRET_PATTERNS = Object.freeze([
  { id: 'stripe_secret', re: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{6,}/ },
  { id: 'stripe_webhook_secret', re: /\bwhsec_[A-Za-z0-9]{6,}/ },
  { id: 'aws_access_key', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { id: 'jwt', re: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{4,}/ },
  { id: 'private_key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { id: 'password_assignment', re: /\bpass(?:word|wd)\s*[:=]\s*\S{6,}/i },
  { id: 'bearer_token', re: /\bBearer\s+[A-Za-z0-9._~+/-]{16,}/ },
])

export function findSecrets(text) {
  const value = String(text ?? '')
  return SECRET_PATTERNS.filter((p) => p.re.test(value)).map((p) => p.id)
}

export function scrubSecrets(value, depth = 0) {
  if (depth > 12) return null
  if (typeof value === 'string') return findSecrets(value).length ? '[redacted]' : value
  if (Array.isArray(value)) return value.map((item) => scrubSecrets(item, depth + 1))
  if (value && typeof value === 'object') {
    const out = {}
    for (const [key, nested] of Object.entries(value)) {
      if (/(?:password|secret|token|authorization|cookie|credential|api[_-]?key)/i.test(key)) continue
      out[key] = scrubSecrets(nested, depth + 1)
    }
    return out
  }
  return value
}

// ---- source helpers ----------------------------------------------------------

export function sourceStatus(one, name) {
  const entry = one?.sources?.[name]
  if (!entry || typeof entry !== 'object') return 'not_connected'
  return ['ok', 'unavailable', 'not_connected'].includes(entry.status) ? entry.status : 'unavailable'
}

export function sourceData(one, name) {
  return sourceStatus(one, name) === 'ok' ? one.sources[name].data ?? null : null
}

// ISO-8601 week label, e.g. 2026-W39 (UTC).
export function isoWeek(now) {
  const d = new Date(Number.isFinite(now) ? now : Date.now())
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date - yearStart) / DAY + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}
