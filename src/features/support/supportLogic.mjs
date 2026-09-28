// Pure support logic shared by the player portal, the staff Command Center and
// the fixture transport. No React, no fetch: everything here is node-tested
// (supportLogic.test.mjs). Contract: docs/player-success/ARCHITECTURE.md.

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// ---- Status workflow (§3.2) ---------------------------------------------------

export const CASE_STATUSES = Object.freeze([
  'new', 'triaged', 'in_progress', 'waiting_on_player', 'waiting_on_provider',
  'escalated', 'resolved', 'closed', 'reopened',
])

// Player-facing buckets. Order is the tab order.
export const BUCKETS = Object.freeze([
  { id: 'open', label: 'Open', statuses: ['new', 'triaged', 'reopened'] },
  { id: 'waiting_on_recon', label: 'Waiting on Recon', statuses: ['in_progress', 'escalated', 'waiting_on_provider'] },
  { id: 'waiting_on_me', label: 'Waiting on me', statuses: ['waiting_on_player'] },
  { id: 'resolved', label: 'Resolved', statuses: ['resolved'] },
  { id: 'closed', label: 'Closed', statuses: ['closed'] },
])

export const BUCKET_IDS = Object.freeze(BUCKETS.map((b) => b.id))

// Unknown or missing statuses land in "Open" so a case never disappears from
// the player's list because the server added a state the client doesn't know.
export function bucketForStatus(status) {
  const hit = BUCKETS.find((b) => b.statuses.includes(status))
  return hit ? hit.id : 'open'
}

function camel(id) {
  return id.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function byUpdatedDesc(a, b) {
  return (Date.parse(b.updatedAt || b.createdAt || '') || 0) - (Date.parse(a.updatedAt || a.createdAt || '') || 0)
}

// Accepts `{buckets:{open:[...],...}}` (contract) or a flat `{cases:[...]}` /
// `{items:[...]}` list, and always returns every bucket id with a sorted,
// de-duplicated array. A case the server puts in a bucket that contradicts
// its status is re-bucketed by status (status is the source of truth).
export function normalizeBuckets(payload) {
  const out = Object.fromEntries(BUCKET_IDS.map((id) => [id, []]))
  const seen = new Set()
  const push = (c) => {
    if (!c || typeof c !== 'object') return
    const key = c.caseNumber || c.caseId
    if (!key || seen.has(key)) return
    seen.add(key)
    out[bucketForStatus(c.status)].push(c)
  }
  if (payload && payload.buckets && typeof payload.buckets === 'object') {
    for (const id of BUCKET_IDS) {
      const list = payload.buckets[id] || payload.buckets[camel(id)] || []
      if (Array.isArray(list)) list.forEach(push)
    }
  }
  const flat = payload?.cases || payload?.items
  if (Array.isArray(flat)) flat.forEach(push)
  for (const id of BUCKET_IDS) out[id].sort(byUpdatedDesc)
  return out
}

export function bucketCounts(buckets) {
  return Object.fromEntries(BUCKET_IDS.map((id) => [id, (buckets?.[id] || []).length]))
}

export const PLAYER_STATUS_LABEL = Object.freeze({
  new: 'Received',
  triaged: 'Received',
  in_progress: 'Recon is on it',
  waiting_on_provider: 'Waiting on a provider',
  escalated: 'With a specialist',
  waiting_on_player: 'Needs your reply',
  resolved: 'Resolved',
  closed: 'Closed',
  reopened: 'Reopened',
})

export const STAFF_STATUS_LABEL = Object.freeze({
  new: 'New',
  triaged: 'Triaged',
  in_progress: 'In progress',
  waiting_on_player: 'Waiting on player',
  waiting_on_provider: 'Waiting on provider',
  escalated: 'Escalated',
  resolved: 'Resolved',
  closed: 'Closed',
  reopened: 'Reopened',
})

export function playerStatusLabel(status) {
  return PLAYER_STATUS_LABEL[status] || 'In the queue'
}

export function staffStatusLabel(status) {
  return STAFF_STATUS_LABEL[status] || String(status || 'unknown').replace(/_/g, ' ')
}

// Staff-initiated transitions (§3.2), mirroring the staff rows of
// lambda/customer-success/support/workflow.mjs TABLE (a contract test keeps
// them equal). The staff case payload carries the server's own
// `case.allowedTransitions`; the UI prefers that and uses this only when
// the field is missing (and in the dev fixture transport).
const STAFF_TRANSITIONS = Object.freeze({
  new: ['triaged', 'in_progress', 'escalated', 'resolved'],
  triaged: ['in_progress', 'waiting_on_player', 'waiting_on_provider', 'escalated', 'resolved'],
  in_progress: ['waiting_on_player', 'waiting_on_provider', 'escalated', 'resolved'],
  waiting_on_player: ['in_progress', 'resolved'],
  waiting_on_provider: ['in_progress', 'resolved'],
  escalated: ['in_progress', 'resolved'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['in_progress', 'waiting_on_player', 'waiting_on_provider', 'escalated', 'resolved'],
})

export function staffTransitions(status) {
  return STAFF_TRANSITIONS[status] ? [...STAFF_TRANSITIONS[status]] : []
}

export function allowedTransitionsFor(caseRecord) {
  return Array.isArray(caseRecord?.allowedTransitions) ? [...caseRecord.allowedTransitions] : staffTransitions(caseRecord?.status)
}

// ---- Categories & queue views --------------------------------------------------

// The backend vocabulary (lambda/customer-success/support/items.mjs
// CATEGORIES, labels from classify.mjs). A contract test keeps the ids equal.
// `group` only orders the picker; the server never sees it.
export const CATEGORIES = Object.freeze([
  { id: 'access_entitlement', label: 'Paid but locked out', group: 'Membership & billing' },
  { id: 'subscription', label: 'Membership plan', group: 'Membership & billing' },
  { id: 'billing_question', label: 'Billing question', group: 'Membership & billing' },
  { id: 'cancellation', label: 'Cancelling', group: 'Membership & billing' },
  { id: 'account_login', label: 'Signing in', group: 'Account' },
  { id: 'email_verification', label: 'Email confirmation', group: 'Account' },
  { id: 'ubisoft_connection', label: 'Ubisoft account', group: 'Connected accounts & stats' },
  { id: 'psn_connection', label: 'PlayStation account', group: 'Connected accounts & stats' },
  { id: 'xbox_connection', label: 'Xbox account', group: 'Connected accounts & stats' },
  { id: 'trn_data', label: 'Tracker stats', group: 'Connected accounts & stats' },
  { id: 'rank_stat_discrepancy', label: 'Rank or stats look wrong', group: 'Connected accounts & stats' },
  { id: 'historical_data', label: 'History and tracking', group: 'Connected accounts & stats' },
  { id: 'vod_upload', label: 'VOD upload', group: 'VOD review' },
  { id: 'vod_analysis', label: 'VOD review not finishing', group: 'VOD review' },
  { id: 'ai_result', label: 'AI review quality', group: 'VOD review' },
  { id: 'replay_upload', label: 'Match replays', group: 'VOD review' },
  { id: 'coaching_credits', label: 'Coaching credits', group: 'Coaching' },
  { id: 'coaching_session', label: 'Coaching session', group: 'Coaching' },
  { id: 'desktop_client', label: 'Desktop app', group: 'App & site' },
  { id: 'bug', label: 'Something is broken', group: 'App & site' },
  { id: 'performance', label: 'Slow or laggy', group: 'App & site' },
  { id: 'feature_request', label: 'Feature request', group: 'Other' },
  { id: 'safety_report', label: 'Safety report', group: 'Other' },
  { id: 'other', label: 'Something else', group: 'Other' },
])

export function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label || 'Something else'
}

export function isCategory(id) {
  return CATEGORIES.some((c) => c.id === id)
}

export const QUEUE_VIEWS = Object.freeze([
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'mine', label: 'Mine' },
  { id: 'critical', label: 'High / critical' },
  { id: 'billing', label: 'Billing / access' },
  { id: 'identity', label: 'Game identity / data' },
  { id: 'vod', label: 'VOD / replay' },
  { id: 'coaching', label: 'Coaching' },
  { id: 'bugs', label: 'Bugs' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'at_risk', label: 'Overdue / at risk' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'all_open', label: 'All open' },
])

export function queueViewOrDefault(id) {
  return QUEUE_VIEWS.some((v) => v.id === id) ? id : 'unassigned'
}

export const TEAMS = Object.freeze([
  { id: 'support', label: 'Support' },
  { id: 'billing', label: 'Billing' },
  { id: 'player_data', label: 'Player data' },
  { id: 'vod_ai', label: 'VOD / AI' },
  { id: 'coaching', label: 'Coaching' },
  { id: 'security', label: 'Security' },
  { id: 'leadership', label: 'Leadership' },
])

export function teamLabel(id) {
  return TEAMS.find((t) => t.id === id)?.label || String(id || '—')
}

export const ACTION_KINDS = Object.freeze([
  { id: 'entitlement_repair', label: 'Entitlement repair' },
  { id: 'email_change', label: 'Email change' },
  { id: 'account_recovery', label: 'Account recovery' },
  { id: 'identity_unlink', label: 'Unlink game identity' },
  { id: 'data_export', label: 'Data export' },
  { id: 'data_deletion', label: 'Data deletion' },
  { id: 'cancellation', label: 'Cancellation' },
  { id: 'refund', label: 'Refund review' },
])

// = items.mjs RESOLUTION_CODES (contract-tested).
export const RESOLUTION_CODES = Object.freeze([
  { id: 'fixed', label: 'Fixed' },
  { id: 'answered', label: 'Answered / explained' },
  { id: 'workaround', label: 'Workaround given' },
  { id: 'known_issue', label: 'Known issue (incident)' },
  { id: 'external_action', label: 'Done in another system' },
  { id: 'duplicate', label: 'Duplicate' },
  { id: 'not_reproducible', label: 'Could not reproduce' },
  { id: 'by_design', label: 'Works as designed' },
  { id: 'no_response', label: 'No response from player' },
  { id: 'other', label: 'Other' },
])

// Action kinds that need the billing role (service BILLING_ACTION_KINDS).
export const BILLING_ACTION_KINDS = Object.freeze(['entitlement_repair', 'cancellation', 'refund'])

export const PRIORITY_LABEL = Object.freeze({ p1: 'P1', p2: 'P2', p3: 'P3', p4: 'P4' })
export const SEVERITY_LABEL = Object.freeze({ sev1: 'Sev 1', sev2: 'Sev 2', sev3: 'Sev 3', sev4: 'Sev 4' })

export function priorityTone(p) {
  return p === 'p1' ? 'danger' : p === 'p2' ? 'warning' : p === 'p3' ? 'info' : 'neutral'
}

// Internal response clocks (staff only). The server sends
// `sla.state` on queue rows and `case.slaState.state` on the case:
// overdue | at_risk | on_track | none. `none` (no clock running) -> null.
export const SLA_LABEL = Object.freeze({ overdue: 'Overdue', at_risk: 'At risk', on_track: 'On track' })
export const SLA_TONE = Object.freeze({ overdue: 'danger', at_risk: 'warning', on_track: 'muted' })

export function slaState(sla) {
  const state = sla?.state
  return SLA_LABEL[state] ? state : null
}

// ---- Time formatting ------------------------------------------------------------

export function fmtAgo(iso, now = Date.now()) {
  const ms = Date.parse(iso || '')
  if (!Number.isFinite(ms)) return null
  const d = now - ms
  if (d < MINUTE) return 'just now'
  if (d < HOUR) return `${Math.floor(d / MINUTE)}m ago`
  if (d < DAY) return `${Math.floor(d / HOUR)}h ago`
  if (d < 30 * DAY) return `${Math.floor(d / DAY)}d ago`
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function fmtStamp(iso) {
  const ms = Date.parse(iso || '')
  if (!Number.isFinite(ms)) return null
  return new Date(ms).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function fmtDuration(minutes) {
  if (minutes === null || minutes === undefined || !Number.isFinite(Number(minutes))) return null
  const m = Math.max(0, Math.round(Number(minutes)))
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 48) return m % 60 ? `${h}h ${m % 60}m` : `${h}h`
  const d = Math.floor(h / 24)
  return h % 24 ? `${d}d ${h % 24}h` : `${d}d`
}

export function fmtBytes(n) {
  const v = Number(n)
  if (!Number.isFinite(v) || v < 0) return null
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${Math.round(v / 1024)} KB`
  return `${(v / (1024 * 1024)).toFixed(1)} MB`
}

// Metrics never fake a number: null/undefined/NaN reads "No data yet".
export function metricText(value, format = (v) => String(v)) {
  if (value === null || value === undefined) return 'No data yet'
  if (typeof value === 'number' && !Number.isFinite(value)) return 'No data yet'
  return format(value)
}

// ---- Validation -------------------------------------------------------------------

export const TEXT_MIN = 10
export const TEXT_MAX = 4000
export const MESSAGE_MAX = 4000
export const CSAT_COMMENT_MAX = 500
export const TRIAGE_MIN_CHARS = 12
export const MAX_ATTACHMENTS = 3
// = service.mjs ATTACHMENT_MIME / MAX_FILE_BYTES / MAX_VIDEO_BYTES.
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024
export const ATTACHMENT_TYPES = Object.freeze(['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'text/plain', 'application/zip'])

export function validateCaseDraft({ text = '', questions = [], answers = {} } = {}) {
  const errors = {}
  const t = String(text).trim()
  if (t.length < TEXT_MIN) errors.text = 'Give us a sentence or two about what happened.'
  else if (t.length > TEXT_MAX) errors.text = `Keep it under ${TEXT_MAX} characters.`
  const answerErrors = {}
  for (const q of questions || []) {
    if (!q?.required) continue
    const v = answers?.[q.id]
    if (v === undefined || v === null || String(v).trim() === '') answerErrors[q.id] = 'Pick or type an answer.'
  }
  if (Object.keys(answerErrors).length) errors.answers = answerErrors
  return { ok: Object.keys(errors).length === 0, errors }
}

export function validateMessage(text = '') {
  const t = String(text).trim()
  if (!t) return 'Type a message first.'
  if (t.length > MESSAGE_MAX) return `Keep it under ${MESSAGE_MAX} characters.`
  return null
}

// Keep only answers for questions the triage currently asks.
export function pickAnswers(questions = [], answers = {}) {
  const out = {}
  for (const q of questions || []) {
    const v = answers?.[q.id]
    if (v !== undefined && v !== null && String(v).trim() !== '') out[q.id] = typeof v === 'string' ? v.trim() : v
  }
  return out
}

export function validateAttachment(file, existingCount = 0) {
  if (!file) return 'No file selected.'
  if (existingCount >= MAX_ATTACHMENTS) return `Up to ${MAX_ATTACHMENTS} files per case.`
  if (file.type && !ATTACHMENT_TYPES.includes(file.type)) return 'Screenshots (PNG, JPG, WebP), MP4 clips, text logs or ZIPs only.'
  if (file.type === 'video/mp4' ? Number(file.size) > MAX_VIDEO_BYTES : Number(file.size) > MAX_ATTACHMENT_BYTES) return file.type === 'video/mp4' ? 'That clip is over 25 MB.' : 'That file is over 10 MB.'
  return null
}

function luhnOk(digits) {
  let sum = 0
  let dbl = false
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = digits.charCodeAt(i) - 48
    if (dbl) { d *= 2; if (d > 9) d -= 9 }
    sum += d
    dbl = !dbl
  }
  return sum % 10 === 0
}

// Client-side heads-up only (the server redacts before storage, §11).
export function detectSensitive(text = '') {
  const s = String(text)
  const hits = new Set()
  for (const m of s.matchAll(/(?:\d[ -]?){13,19}/g)) {
    const digits = m[0].replace(/\D/g, '')
    if (digits.length >= 13 && digits.length <= 19 && luhnOk(digits)) hits.add('card_number')
  }
  if (/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{6,}|\bwhsec_[A-Za-z0-9]{6,}|\bAKIA[0-9A-Z]{16}\b/.test(s)) hits.add('secret_key')
  if (/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/.test(s)) hits.add('token')
  if (/\b(?:password|passwd|pwd)\s*[:=]\s*\S+/i.test(s)) hits.add('password')
  return [...hits]
}

export function sensitiveWarning(kinds = []) {
  if (!kinds.length) return null
  if (kinds.includes('card_number')) return 'That looks like a card number. Remove it: we never need card details here.'
  if (kinds.includes('password')) return 'That looks like a password. Remove it: Recon never asks for passwords.'
  return 'That looks like a key or token. Remove it before sending.'
}

export function normalizeCsat({ rating, comment } = {}) {
  let r = rating
  if (r === 'up' || r === 'down') {
    // ok
  } else if (Number.isInteger(Number(r)) && Number(r) >= 1 && Number(r) <= 5) {
    r = Number(r)
  } else {
    return { ok: false, error: 'Pick a rating.' }
  }
  const c = String(comment || '').trim()
  if (c.length > CSAT_COMMENT_MAX) return { ok: false, error: `Keep the comment under ${CSAT_COMMENT_MAX} characters.` }
  return { ok: true, value: c ? { rating: r, comment: c } : { rating: r } }
}

export function csatLabel(rating) {
  if (rating === 'up') return 'Handled'
  if (rating === 'down') return 'Not handled'
  if (Number.isInteger(rating)) return `${rating} / 5`
  return null
}

// ---- Player-safe projection (defense in depth) ---------------------------------

// Player timeline events (GET /cs/me/support/cases/{n}): { id, kind,
// visibility: 'public', at, author: 'you' | 'Recon 6 support' | 'Recon 6',
// body, channel?, status?, rating?, attachment? }.
const PLAYER_EVENT_KINDS = new Set(['message_player', 'message_staff', 'status_change', 'system', 'csat', 'attachment', 'email_in'])

// The API already strips staff-only events for players; this is the second
// lock so a server regression can never render a private note to a player.
// It is an allowlist on BOTH axes: the server marks every player-visible
// event `visibility: 'public'`, and an event without that exact mark (or
// with a kind outside the list) is never rendered.
export function playerTimeline(events = []) {
  return (Array.isArray(events) ? events : [])
    .filter((e) => e && e.visibility === 'public' && PLAYER_EVENT_KINDS.has(e.kind) && !e.private)
    .slice()
    .sort((a, b) => (Date.parse(a.at || '') || 0) - (Date.parse(b.at || '') || 0))
}

export function isResolvedLike(status) {
  return status === 'resolved' || status === 'closed'
}

// Diagnostics (triage `diagnosticsPreview`, case `diagnostics`):
// { status, observedAt, panels: [{ id, title, status, facts: [{ label,
// value, source, at }], inferences, actions: { user } }] }.
// `perPanel` facts from each panel, as display rows.
export function diagnosticsRows(diagnostics, { perPanel = Infinity, now = Date.now() } = {}) {
  const panels = Array.isArray(diagnostics?.panels) ? diagnostics.panels : []
  const rows = []
  for (const p of panels) {
    const facts = (Array.isArray(p?.facts) ? p.facts : []).filter((f) => f && f.label)
    for (const f of facts.slice(0, perPanel)) {
      const ago = f.at ? fmtAgo(f.at, now) : null
      const value = f.value === null || f.value === undefined || f.value === '' ? 'not recorded' : String(f.value)
      rows.push({ id: `${p.id}:${f.label}`, panel: p.id, panelTitle: p.title || p.id, text: `${f.label}: ${value}`, ago, status: p.status || 'ok' })
    }
  }
  return rows
}

// "We can see: Plan: Elite · Ubisoft: linked, updated in the last hour"
export function diagnosticsSentence(diagnostics, now = Date.now()) {
  const parts = diagnosticsRows(diagnostics, { perPanel: 1, now }).map((r) => r.text)
  return parts.length ? `We can see: ${parts.join(' · ')}` : null
}

// The things the player can do themselves, from every panel.
export function playerActions(diagnostics) {
  const out = []
  for (const p of Array.isArray(diagnostics?.panels) ? diagnostics.panels : []) {
    for (const a of p?.actions?.user || []) if (typeof a === 'string' && !out.includes(a)) out.push(a)
  }
  return out
}

// ---- Staff timeline --------------------------------------------------------------

// Staff timeline events are stored case events: { eventId, kind, visibility,
// actor: { kind, id }, body, data, at, visibleToPlayer }.
export function staffEventView(e) {
  const data = e?.data || {}
  const actor = e?.actor || {}
  return {
    id: e?.eventId || `${e?.kind}:${e?.at}`,
    kind: e?.kind || 'system',
    at: e?.at || null,
    author: actor.kind === 'system' ? 'System' : actor.id || (actor.kind === 'player' ? 'Player' : 'Staff'),
    authorKind: actor.kind || 'system',
    text: e?.body ?? null,
    from: data.from ?? null,
    to: data.to ?? null,
    rating: data.rating ?? null,
    team: data.team ?? null,
    incidentId: data.incidentId ?? null,
    channel: e?.kind === 'email_in' ? 'email' : null,
    assignedFromUnmatched: data.assignedFromUnmatched || null,
    // action_request events keep their state on the event itself.
    actionKind: e?.actionKind || null,
    actionStatus: e?.arStatus || null,
    reason: e?.reason || null,
    visibleToPlayer: e?.visibleToPlayer === true,
    data,
  }
}

// Audit entries: { id, at, actor, action, detail: {caseNumber, ...ids} }.
export function auditDetailText(detail) {
  if (!detail || typeof detail !== 'object') return ''
  return Object.entries(detail)
    .filter(([k, v]) => k !== 'caseNumber' && v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
    .join(' · ')
}

export function createClientRequestId(cryptoImpl = globalThis.crypto) {
  if (cryptoImpl?.randomUUID) return cryptoImpl.randomUUID()
  const rand = () => Math.random().toString(16).slice(2, 10)
  return `${rand()}-${rand()}-${Date.now().toString(16)}`
}

// ---- Keyboard helpers -----------------------------------------------------------

// Roving index for tablists (arrows wrap; Home/End jump).
export function tabKeyIndex(current, key, length) {
  if (!length) return current
  if (key === 'ArrowRight' || key === 'ArrowDown') return (current + 1) % length
  if (key === 'ArrowLeft' || key === 'ArrowUp') return (current - 1 + length) % length
  if (key === 'Home') return 0
  if (key === 'End') return length - 1
  return current
}

// Queue row movement (arrows or j/k; no wrap).
export function rowKeyIndex(current, key, length) {
  if (!length) return -1
  if (key === 'ArrowDown' || key === 'j') return Math.min(length - 1, current < 0 ? 0 : current + 1)
  if (key === 'ArrowUp' || key === 'k') return Math.max(0, current < 0 ? 0 : current - 1)
  if (key === 'Home') return 0
  if (key === 'End') return length - 1
  return current
}

// ---- Escalation hand-off --------------------------------------------------------

function line(label, value) {
  return value ? `${label}: ${value}` : null
}

// A local PREVIEW of the hand-off, shown in the escalate dialog. The server
// builds and stores the real hand-off (service buildHandoff) from its own
// records; the client never sends this text. Facts and inferences stay
// labelled; nothing secret is included (IDs are the masked refs the API sends).
export function buildHandoffPreview({ caseRecord = {}, team, reason = '', copilot = null, diagnostics = [] } = {}) {
  const facts = []
  for (const p of diagnostics || []) {
    for (const f of p.facts || []) {
      if (facts.length >= 5) break
      facts.push(`- ${f.label}: ${f.value}${f.source ? ` (${f.source})` : ''}`)
    }
  }
  const root = copilot?.likelyRootCause?.text
  const steps = (copilot?.suggestedSteps || []).slice(0, 3).map((s) => `- ${s.text || s}`)
  const parts = [
    `Hand-off to ${teamLabel(team)}`,
    line('Case', [caseRecord.caseNumber, caseRecord.subject].filter(Boolean).join(' · ')),
    line('Category', caseRecord.category ? categoryLabel(caseRecord.category) : null),
    line('Priority / severity', [PRIORITY_LABEL[caseRecord.priority], SEVERITY_LABEL[caseRecord.severity]].filter(Boolean).join(' / ')),
    line('Status', caseRecord.status ? staffStatusLabel(caseRecord.status) : null),
    copilot?.summary?.text ? `Summary: ${copilot.summary.text}` : null,
    facts.length ? `Facts checked:\n${facts.join('\n')}` : null,
    root ? `Likely root cause (inference, not verified): ${root}` : null,
    steps.length ? `Suggested next steps:\n${steps.join('\n')}` : null,
    `Why escalating: ${String(reason).trim() || '(add a reason)'}`,
  ]
  return parts.filter(Boolean).join('\n')
}
