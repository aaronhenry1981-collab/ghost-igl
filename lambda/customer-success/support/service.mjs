// Recon 6 Player Success & Support: the service core
// (docs/player-success/ARCHITECTURE.md §3-§6, §9-§14).
//
// createSupportService({ ctx, now, keyFor, engines })
//   ctx      the customer-success app context (store, tables, config, log,
//            factsFor, catalog). Only ctx.store is ever written, and only
//            with support item types (items.mjs). ctx.tables is read-only.
//   now      () => epoch ms
//   keyFor   (email) => contactKey. Player partitions are ALWAYS derived
//            from the verified identity with this, never from input.
//   engines  { classifyIssue, buildDiagnostics, buildCopilot, searchHelp,
//            getArticle, evaluateProactive, decideInboundEmail } injected;
//            see engines.mjs. Engines receive cloned, read-only snapshots and
//            no store/ctx, so none of them can write anything.
//
// Invariants:
//   - Every write is audited (AUDIT items with unique sort keys).
//   - Every staff method checks can(roles, action) first.
//   - A player can only reach their own cases; another player's case number
//     is a 404, exactly like a case that does not exist.
//   - Player projections never include private notes, staff events,
//     assignee, team, SLA, copilot, staff diagnostics, action requests,
//     learning or billing references.
//   - Support records action requests; it has NO code path that changes
//     billing, Cognito, Stripe or player-data.

import { assembleDirectory } from '../data/assemble.mjs'
import { buildFacts } from '../domain/facts.mjs'
import { deriveLifecycle } from '../domain/lifecycle.mjs'
import { buildPlayerSummary } from '../domain/playerRecord.mjs'
import { pickBestSub } from '../domain/plans.mjs'
import { HttpError } from '../lib/http.mjs'
import * as wf from './workflow.mjs'
import { can, isStaff, rolesFor } from './roles.mjs'
import { maskBillingRefs, redactSensitive, stripInvisible } from './redact.mjs'
import { isoWeek } from './diagnostics/shared.mjs'
import { PRIORITIES, initialSla, slaAfterPlayerMessage, slaAfterStaffReply, slaState } from './sla.mjs'
import { INCIDENT_ID, IncidentValidationError, isActiveIncident, newIncident, patchIncident, validateIncidentInput } from './incidents.mjs'
import { computeSupportMetrics } from './metrics.mjs'
import { caseFromPlusAddress, messageIdHash } from './email.mjs'
import {
  BILLING_CATEGORIES,
  CASE_NUMBER,
  CATEGORIES,
  CATEGORY_DEFAULTS,
  CATEGORY_GROUPS,
  INTENTS,
  RESOLUTION_CODES,
  SEVERITIES,
  SUPPORT_TYPES,
  SUP_PK,
  TEAMS,
  actionRequestEvent,
  attachmentItem,
  caseEventItem,
  caseIdItem,
  caseItem,
  caseNumberItem,
  counterItem,
  emailMarkerItem,
  formatCaseNumber,
  idempotencyItem,
  incidentEventItem,
  incidentItem,
  kbProposalItem,
  newCaseId,
  newId,
  outboundMessageItem,
  pkFor,
  proactiveMarkerItem,
  rateSlotItem,
  supportAuditItem,
  touchCase,
  unmatchedEmailItem,
} from './items.mjs'

const DAY = 86400000
export const LIMITS = Object.freeze({
  casesPerDay: 5,
  messagesPerDay: 30,
  caseText: 4000,
  messageText: 4000,
  comment: 1000,
  reason: 1000,
  summary: 2000,
  subject: 120,
  // HARD SAFETY BOUND, not a page size: store.listByType reads every page
  // (and itself fails closed after its page limit). A cross-contact list
  // larger than this is refused with a 503 instead of being processed in one
  // Lambda invocation; raise it deliberately if support volume ever gets there.
  maxListRead: 25000,
})

// Lease after which an inbound-email claim left 'processing' by a crash may
// be reclaimed by a retry.
export const EMAIL_CLAIM_LEASE_MS = 5 * 60 * 1000

export const ATTACHMENT_MIME = Object.freeze(['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'text/plain', 'application/zip'])
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024
export const MAX_FILE_BYTES = 10 * 1024 * 1024

export const ACTION_KINDS = Object.freeze(['entitlement_repair', 'email_change', 'account_recovery', 'identity_unlink', 'data_export', 'data_deletion', 'cancellation', 'refund'])
export const BILLING_ACTION_KINDS = Object.freeze(['entitlement_repair', 'cancellation', 'refund'])
export const ACTION_DECISIONS = Object.freeze(['authorize', 'reject', 'done_externally'])
// What a person must verify before doing the action in the authoritative
// system. None of these is done by Support.
export const REQUIRED_VERIFICATION = Object.freeze({
  entitlement_repair: 'Compare the Stripe subscription with the Recon row and the verified email before changing access in the billing system.',
  email_change: 'The player confirms from the current verified address and from the new address.',
  account_recovery: 'The player confirms from the verified address on file.',
  identity_unlink: 'The player confirms from the verified address on file.',
  data_export: 'The request comes from the verified address; follow the export runbook.',
  data_deletion: 'The request comes from the verified address; follow the deletion runbook.',
  cancellation: 'The player confirms from the verified address; cancel in Stripe, not here.',
  refund: 'Lead decision; issue it in Stripe only. Nothing is promised to the player before it is done.',
})

export const QUEUE_VIEWS = Object.freeze(['unassigned', 'mine', 'critical', 'billing', 'identity', 'vod', 'coaching', 'bugs', 'waiting', 'at_risk', 'incidents', 'all_open'])


const PUBLIC_EVENT_KINDS = Object.freeze(['message_player', 'message_staff', 'status_change', 'csat', 'attachment', 'email_in', 'system'])

const CLIENT_ID = /^[A-Za-z0-9_-]{8,64}$/
const SLUG = /^[a-z0-9][a-z0-9_-]{0,39}$/
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/
const CONTACT_KEY = /^pl_[a-f0-9]{20}$/
const HASH = /^[a-f0-9]{64}$/
const PLATFORMS = Object.freeze(['pc', 'ps5', 'xbox', 'other'])

// ---- validation helpers ------------------------------------------------------------
const bad = (message, code = null) => new HttpError(400, message, code)

function onlyKeys(obj, allowed, where) {
  if (obj === undefined || obj === null) return {}
  if (typeof obj !== 'object' || Array.isArray(obj)) throw bad(`${where} must be an object`)
  for (const key of Object.keys(obj)) if (!allowed.includes(key)) throw bad(`unknown field ${where === 'request' ? key : `${where}.${key}`}`)
  return obj
}

function text(value, field, { min = 1, max, required = true } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw bad(`${field} is required`)
    return null
  }
  if (typeof value !== 'string') throw bad(`${field} must be text`)
  // Bidi overrides, zero-width and control characters are removed BEFORE
  // the length checks: text that is empty once they are gone is rejected.
  const trimmed = stripInvisible(value).trim()
  if (trimmed.length < min) throw bad(required ? `${field} is required` : `${field} is too short`)
  if (trimmed.length > max) throw bad(`${field} is too long (max ${max} characters)`)
  return trimmed
}

function oneOf(value, list, field, { required = true } = {}) {
  if (value === undefined || value === null) {
    if (required) throw bad(`${field} is required`)
    return null
  }
  if (!list.includes(value)) throw bad(`${field} must be one of ${list.join(', ')}`)
  return value
}

export function assertCaseNumber(value) {
  if (!CASE_NUMBER.test(String(value || ''))) throw bad('invalid case number (expected R6-000000)')
  return String(value)
}

function clientRequestId(value, { required = true } = {}) {
  if (value === undefined || value === null) {
    if (required) throw bad('clientRequestId is required')
    return null
  }
  if (!CLIENT_ID.test(String(value))) throw bad('invalid clientRequestId')
  return String(value)
}

function validateAnswers(answers) {
  if (answers === undefined || answers === null) return null
  if (typeof answers !== 'object' || Array.isArray(answers)) throw bad('answers must be an object')
  const entries = Object.entries(answers)
  if (entries.length > 10) throw bad('too many answers (max 10)')
  const out = {}
  for (const [k, v] of entries) {
    if (!SLUG.test(k)) throw bad(`invalid answer key ${k.slice(0, 40)}`)
    if (!['string', 'number', 'boolean'].includes(typeof v)) throw bad(`answer ${k} must be text, a number or true/false`)
    const s = String(v).trim()
    if (s.length > 500) throw bad(`answer ${k} is too long (max 500)`)
    out[k] = s
  }
  return out
}

function validateContext(context) {
  const c = onlyKeys(context, ['page', 'feature', 'platform', 'appVersion'], 'context')
  const out = {}
  if (c.page !== undefined) {
    if (typeof c.page !== 'string' || c.page.length > 200 || !/^[\w\-/#:.?=&%]*$/.test(c.page)) throw bad('invalid context.page')
    // The path only: a query string or fragment can carry tokens, emails or
    // card numbers, so neither is stored. The path itself is redacted too.
    out.page = redactSensitive(c.page.split(/[?#]/)[0]).text
  }
  if (c.feature !== undefined) {
    if (!SLUG.test(String(c.feature))) throw bad('invalid context.feature')
    out.feature = c.feature
  }
  if (c.platform !== undefined) out.platform = oneOf(c.platform, PLATFORMS, 'context.platform')
  if (c.appVersion !== undefined) {
    if (!/^[\w.-]{1,32}$/.test(String(c.appVersion))) throw bad('invalid context.appVersion')
    out.appVersion = c.appVersion
  }
  return Object.keys(out).length ? out : null
}

function validateRating(rating) {
  if (rating === 'up' || rating === 'down') return rating
  if (Number.isInteger(rating) && rating >= 1 && rating <= 5) return rating
  throw bad('rating must be 1-5, "up" or "down"')
}

function validateLearning(learning) {
  if (learning === undefined || learning === null) return null
  const l = onlyKeys(learning, ['productArea', 'avoidable', 'docGap', 'onboardingGap', 'bug', 'featureRequest'], 'learning')
  const out = { productArea: null, avoidable: null, docGap: null, onboardingGap: null, bug: null, featureRequest: null }
  if (l.productArea !== undefined && l.productArea !== null) {
    if (!SLUG.test(String(l.productArea))) throw bad('invalid learning.productArea')
    out.productArea = l.productArea
  }
  for (const flag of ['avoidable', 'docGap', 'onboardingGap', 'bug', 'featureRequest']) {
    if (l[flag] === undefined || l[flag] === null) continue
    if (typeof l[flag] !== 'boolean') throw bad(`learning.${flag} must be true or false`)
    out[flag] = l[flag]
  }
  return out
}

// Optional optimistic-concurrency guard sent by the staff UI: the `version`
// of the case it is looking at. Absent = no check (the store's own version
// condition still prevents lost updates).
function expectedVersion(value) {
  if (value === undefined || value === null) return null
  if (!Number.isInteger(value) || value < 1) throw bad('version must be a positive whole number')
  return value
}

function isoDate(value, field) {
  const ms = Date.parse(String(value || ''))
  if (!Number.isFinite(ms)) throw bad(`${field} must be an ISO date`)
  return ms
}

// ---- small utilities -----------------------------------------------------------------
const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)))
function deepFreeze(v) {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.freeze(v)
    for (const k of Object.keys(v)) deepFreeze(v[k])
  }
  return v
}
const isConflict = (err) => err?.name === 'ConditionalCheckFailedException'
const strip = (item) => {
  if (!item) return item
  const { pk, sk, gsi1pk, gsi1sk, ...rest } = item
  return rest
}
const subjectFrom = (t) => {
  const first = String(t || '').split(/\r?\n/).find((l) => l.trim()) || ''
  const s = first.trim()
  return s.length > LIMITS.subject ? `${s.slice(0, LIMITS.subject - 1)}…` : s
}

// ---- projections -----------------------------------------------------------------------

function playerWaitingOn(status) {
  if (status === 'waiting_on_player') return 'you'
  if (status === 'resolved' || status === 'closed') return null
  return 'recon'
}

// Player-safe copy for proactive cases. A finding's own text carries the
// evidence (table and field names, lifecycle labels, billing statuses): it
// is kept for staff in the case's staff-only `system` event, and the case
// stores only this copy as its subject and description.
export const PROACTIVE_PLAYER_COPY = Object.freeze({
  paid_past_due_or_unbound: Object.freeze({ subject: 'Checking your membership access', description: 'Something looks off with how your membership is applied to your account. Support is checking it and will follow up in this case. You do not need to do anything yet.' }),
  coaching_purchase_no_credits: Object.freeze({ subject: 'Checking your coaching credits', description: 'Your coaching purchase may not have added credits to your account. Support is checking it and will follow up in this case. You do not need to do anything yet.' }),
  onboarding_stalled_paid: Object.freeze({ subject: 'Helping you get set up', description: 'Your account setup looks unfinished. Support can walk you through the rest. Reply here if you want a hand.' }),
  vod_usage_without_review: Object.freeze({ subject: 'Checking a VOD review', description: 'One of your VOD reviews may not have finished. Support is checking it and will follow up in this case. You do not need to upload again yet.' }),
})
export const PROACTIVE_FALLBACK_COPY = Object.freeze({ subject: 'A check from Recon 6 support', description: 'Support spotted something on your account worth a second look and will follow up in this case. You do not need to do anything yet.' })
export const proactivePlayerCopy = (ruleId) => PROACTIVE_PLAYER_COPY[ruleId] || PROACTIVE_FALLBACK_COPY

// What a player may read as the case subject / description. A proactive
// case shows its stored text only when it was written as player-safe copy
// (`playerSafe: true`); any other proactive case (for example one stored
// before this rule existed) shows the generic copy, never its description.
function playerText(c) {
  if (c.source !== 'proactive' || c.playerSafe === true) return { subject: c.subject, description: c.description }
  return proactivePlayerCopy(c.proactive?.ruleId)
}

// Every event a player receives is marked `visibility: 'public'`; the client
// renders an event only with that mark AND an allowlisted kind (second lock,
// src/features/support/supportLogic.mjs playerTimeline).
function playerEvent(e) {
  const author = e.actor?.kind === 'player' ? 'you' : e.actor?.kind === 'staff' ? 'Recon 6 support' : 'Recon 6'
  const out = { id: e.eventId, kind: e.kind === 'email_in' ? 'message_player' : e.kind, visibility: 'public', at: e.at, author, body: e.body ?? null }
  if (e.kind === 'email_in') out.channel = 'email'
  if (e.kind === 'status_change') out.status = e.data?.to ?? null
  if (e.kind === 'csat') out.rating = e.data?.rating ?? null
  if (e.kind === 'attachment') out.attachment = { name: e.data?.name ?? null }
  return out
}

// Only what a player may see. The engine is always called with
// view 'player' for these paths; this projection is a second, independent
// filter: player-tagged items only, no Recon-side actions, no context or
// staff blocks, and billing ids masked.
const playerItems = (list) => (Array.isArray(list) ? list : []).filter((i) => i && typeof i === 'object' && (i.vis === undefined || i.vis === 'player')).map((i) => {
  const { vis, masked, ...rest } = i
  return clone(rest)
})

function playerDiagnostics(d) {
  if (!d || typeof d !== 'object') return null
  if (Array.isArray(d.panels)) {
    return maskBillingRefs({
      status: d.status || 'ok',
      observedAt: d.observedAt || null,
      panels: d.panels.map((p) => ({
        id: String(p?.id || ''),
        title: p?.title || null,
        status: p?.status || null,
        facts: playerItems(p?.facts),
        inferences: playerItems(p?.inferences),
        actions: { user: clone(p?.actions?.user || []) },
      })),
    })
  }
  const providers = Array.isArray(d.providers) ? d.providers : []
  return maskBillingRefs({
    status: d.status || (providers.length ? 'ok' : 'not_available'),
    observedAt: d.observedAt || null,
    panels: providers.map((p) => ({ id: String(p?.id || ''), title: null, status: p?.status || null, facts: [], inferences: [], actions: { user: [] }, playerSafe: clone(p?.playerSafe ?? null) })),
  })
}

export function playerCaseSummary(c) {
  const bucket = wf.playerBucket(c.status)
  return {
    caseNumber: c.caseNumber,
    subject: playerText(c).subject,
    category: c.category,
    status: c.status,
    bucket,
    bucketLabel: wf.BUCKET_LABEL[bucket],
    waitingOn: playerWaitingOn(c.status),
    csat: c.csat ? { rating: c.csat.rating } : null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }
}

// Whether the player can attach files, from config only. The private bucket
// and presign route are not provisioned, so this is `enabled: false` today.
export function uploadsState(supportConfig = {}) {
  return supportConfig.attachments === true
    ? { enabled: true, reason: null }
    : { enabled: false, reason: 'Attachment storage is not switched on yet.' }
}

export function projectPlayerCase(c, { events = [], attachments = [], diagnostics = null, now, uploads = null }) {
  const canRate = (c.status === 'resolved' || c.status === 'closed') && (c.resolutionCount || 0) > 0 && c.csat?.forResolution !== c.resolutionCount
  return {
    ...playerCaseSummary(c),
    subcategory: c.subcategory || null,
    description: playerText(c).description,
    source: c.source === 'proactive' ? 'recon' : c.source,
    resolvedAt: c.resolvedAt || null,
    closedAt: c.closedAt || null,
    reopenCount: c.reopenCount || 0,
    resolution: c.resolution ? { summary: c.resolution.summary, at: c.resolution.at } : null,
    linkedFromCaseNumber: c.linkedFromCaseNumber || null,
    linkedCaseNumbers: c.linkedCaseNumbers || [],
    csat: c.csat ? { rating: c.csat.rating, at: c.csat.at } : null,
    actions: {
      canMessage: true,
      canConfirmResolved: c.status === 'resolved',
      canReopen: c.status === 'resolved' && !wf.effectivelyClosed(c, now),
      canRate,
    },
    timeline: events
      .filter((e) => e.visibility === 'public' && PUBLIC_EVENT_KINDS.includes(e.kind))
      .sort((a, b) => String(a.sk).localeCompare(String(b.sk)))
      .map(playerEvent),
    attachments: attachments.map((a) => ({ id: a.attId, name: a.name, mime: a.mime, size: a.size, scanState: a.scanState })),
    uploads: uploads || uploadsState(),
    diagnostics: playerDiagnostics(diagnostics),
  }
}

// Staff summary row for queues. `player` comes from the Player 360 directory
// (display name and plan label); nulls when the directory is unavailable.
function queueRow(c, now, player = null) {
  return {
    caseNumber: c.caseNumber,
    contactKey: c.contactKey,
    player: { key: c.contactKey, handle: player?.displayName ?? null, planLabel: player?.planLabel ?? null },
    subject: c.subject,
    category: c.category,
    intent: c.intent,
    source: c.source,
    status: c.status,
    priority: c.priority,
    severity: c.severity,
    assignee: c.assignee,
    team: c.team,
    waitingOn: c.waitingOn,
    incidentId: c.refs?.incidentId || null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    sla: slaState(c, now),
  }
}

// Copilot output is advisory data only: a JSON copy (no functions), tagged,
// never acted on by the service.
function sanitizeCopilot(out) {
  if (!out || typeof out !== 'object') return { status: 'not_available', advisoryOnly: true }
  return { ...clone(out), advisoryOnly: true }
}

const summaryText = (value) => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && typeof value.text === 'string') return value.text
  if (typeof value === 'object' && typeof value.value === 'string') return value.value
  return null
}
const clip = (s, n) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim()
  return t.length > n ? `${t.slice(0, n - 1)}…` : t
}

// The escalation handoff: everything the next team needs so nobody asks the
// player to repeat the story or re-runs the same checks.
export function buildHandoff({ caseRecord: c, events = [], diagnostics = null, copilot = null, playerSummary = null, team, reason, by, at }) {
  const byKind = (k) => events.filter((e) => e.kind === k)
  const playerMsgs = [...byKind('message_player'), ...byKind('email_in')].sort((a, b) => String(a.at).localeCompare(String(b.at)))
  const staffMsgs = byKind('message_staff')
  const notes = byKind('note_private').sort((a, b) => String(a.at).localeCompare(String(b.at)))
  const providers = Array.isArray(diagnostics?.panels) ? diagnostics.panels : Array.isArray(diagnostics?.providers) ? diagnostics.providers : []
  const flags = providers.filter((p) => p?.status && p.status !== 'ok').map((p) => `${p.id}: ${p.status}`)
  const summary = summaryText(copilot?.summary) || clip(c.description, 280)
  const player = playerSummary
    ? { plan: playerSummary.planLabel || playerSummary.plan || null, billingStatus: playerSummary.billingStatus || null, stage: playerSummary.stageLabel || playerSummary.stage || null, accountStatus: playerSummary.accountStatus || null }
    : null
  const openRefs = Object.entries(c.refs || {}).filter(([, v]) => v).map(([k]) => k)
  const lines = [
    `${c.caseNumber} escalated to ${team}: ${reason}`,
    `Issue (${c.category}${c.subcategory ? `/${c.subcategory}` : ''}, ${c.priority}/${c.severity}): ${c.subject}`,
    `Summary: ${summary}`,
    player ? `Player: ${[player.plan, player.billingStatus, player.stage, player.accountStatus].filter(Boolean).join(', ')}` : 'Player: context unavailable',
    `Diagnostics: ${flags.length ? flags.join('; ') : 'no provider reported a problem'}`,
    `So far: ${playerMsgs.length} player message(s), ${staffMsgs.length} public repl${staffMsgs.length === 1 ? 'y' : 'ies'}, ${notes.length} private note(s)`,
    notes.length ? `Latest note: ${clip(notes[notes.length - 1].body, 280)}` : null,
    playerMsgs.length ? `Latest from player: ${clip(playerMsgs[playerMsgs.length - 1].body, 280)}` : null,
    openRefs.length ? `References on file: ${openRefs.join(', ')}` : null,
    'Do not ask the player to repeat any of the above.',
  ].filter(Boolean)
  return {
    team,
    reason,
    by,
    at,
    caseNumber: c.caseNumber,
    category: c.category,
    priority: c.priority,
    severity: c.severity,
    statusBefore: c.status,
    summary,
    player,
    diagnosticsFlags: flags,
    triedSoFar: { playerMessages: playerMsgs.length, publicReplies: staffMsgs.length, privateNotes: notes.length },
    latestNote: notes.length ? clip(notes[notes.length - 1].body, 280) : null,
    latestPlayerMessage: playerMsgs.length ? clip(playerMsgs[playerMsgs.length - 1].body, 280) : null,
    openRefs,
    text: lines.join('\n'),
  }
}

// Maps the email engine's decision ({ outcome, reason, message, caseRef,
// contactKey }) onto applyInboundEmailDecision's input. The engine only
// returns `attach` for a verified sender who owns the case, and `new_case`
// for a verified sender with an account; the service re-checks both.
export function decisionFromEngine(out) {
  if (!out || typeof out !== 'object') return null
  if (out.action) return out // already in the service's shape
  const m = out.message || {}
  if (!HASH.test(String(m.messageIdHash || ''))) return null
  const base = { messageIdHash: m.messageIdHash, providerMessageId: m.providerMessageId || null, subject: m.subject || '', text: m.text || '', reason: out.reason || null }
  const from = String(m.from || '').trim().toLowerCase()
  switch (out.outcome) {
    case 'attach':
      return { ...base, action: 'attach', sender: { email: from, verified: true }, match: { caseNumber: out.caseRef?.caseNumber || null, contactKey: out.contactKey || out.caseRef?.contactKey || null, confidence: 'certain' } }
    case 'new_case':
      return { ...base, action: 'new_case', sender: { email: from, verified: true }, match: { contactKey: out.contactKey || null, confidence: 'certain' } }
    case 'automated':
      return { ...base, action: 'ignore', automated: true }
    case 'duplicate':
      return { ...base, action: 'ignore' }
    case 'unmatched':
      return { ...base, action: 'unmatched', sender: { email: from, verified: false }, match: { caseNumber: out.caseRef?.caseNumber || null, confidence: 'uncertain' } }
    default:
      return null // rejected / unknown: nothing to record
  }
}

// ======================================================================================

export function createSupportService({ ctx, now = () => ctx.now(), keyFor, engines }) {
  if (!ctx?.store) throw new Error('support service needs ctx.store')
  if (typeof keyFor !== 'function') throw new Error('support service needs keyFor')
  if (!engines) throw new Error('support service needs engines')
  const store = ctx.store
  const log = ctx.log || console
  const supportConfig = () => ctx.config?.support || {}
  const iso = () => new Date(now()).toISOString()

  // ---- engines: isolated, cloned input, failures degrade one panel ------------------
  // `args` are JSON copies (no functions, no store, no ctx), so an engine can
  // read what it is given and nothing else. `freeze` additionally makes them
  // immutable (copilot).
  async function runEngine(name, args, fallback, { freeze = false } = {}) {
    const fn = engines[name]
    if (typeof fn !== 'function') return fallback
    try {
      const copies = args.map((a) => (freeze ? deepFreeze(clone(a)) : clone(a)))
      const out = await fn(...copies)
      return out ?? fallback
    } catch (err) {
      log.warn?.('support_engine_failed', { engine: name, error: err?.name || 'Error' })
      return { ...(typeof fallback === 'object' && fallback ? fallback : {}), status: 'error' }
    }
  }

  // ---- authorization -----------------------------------------------------------------
  function requireRole(identity, action) {
    const roles = rolesFor(identity)
    if (!roles.length) throw new HttpError(401, 'sign in required')
    if (!can(roles, action)) throw new HttpError(403, 'support role required')
    return roles
  }
  const staffActor = (identity) => ({ kind: 'staff', id: identity.email })
  const playerActor = (identity) => ({ kind: 'player', id: identity.email })
  const SYSTEM = { kind: 'system', id: 'system' }

  // ---- writes ------------------------------------------------------------------------
  async function audit({ contactKey = null, action, actor, detail = {} }) {
    for (let attempt = 1; ; attempt += 1) {
      try {
        return await store.put(supportAuditItem({ contactKey, action, actor, at: iso(), detail }), { ifNotExists: true })
      } catch (err) {
        if (!isConflict(err) || attempt >= 3) throw err
      }
    }
  }

  async function writeEvent(args) {
    for (let attempt = 1; ; attempt += 1) {
      const item = args.build ? args.build() : caseEventItem({ at: iso(), ...args })
      try {
        await store.put(item, { ifNotExists: true })
        return item
      } catch (err) {
        if (!isConflict(err) || attempt >= 3) throw err
      }
    }
  }

  async function mutateCase(contactKey, caseId, fn, attempts = 4, { expectVersion = null } = {}) {
    for (let attempt = 1; ; attempt += 1) {
      const current = await store.get(pkFor(contactKey), `${SUPPORT_TYPES.CASE}#${caseId}`)
      if (!current) throw new HttpError(404, 'case not found')
      if (expectVersion !== null && current.version !== expectVersion) throw new HttpError(409, 'this case changed since you opened it; reload it and try again', 'version_conflict')
      let next
      try {
        next = fn(current)
      } catch (err) {
        if (err instanceof wf.TransitionError) throw new HttpError(409, err.message, err.code)
        throw err
      }
      if (!next || next === current) return { previous: current, next: current, changed: false }
      const stamped = touchCase({ ...next, version: current.version }, next.updatedAt || iso())
      try {
        await store.put(stamped, { expectVersion: current.version })
        return { previous: current, next: stamped, changed: true }
      } catch (err) {
        if (!isConflict(err)) throw err
        if (expectVersion !== null) throw new HttpError(409, 'this case changed since you opened it; reload it and try again', 'version_conflict')
        if (attempt >= attempts) throw new HttpError(409, 'the case changed at the same time; try again')
      }
    }
  }

  // Idempotency marker (PR #24 builder). Returns { claimed } or the marker
  // that already exists. A marker whose first attempt failed is reclaimable.
  async function claimOnce({ contactKey, scope, clientId, actor }) {
    const at = iso()
    const item = idempotencyItem({ contactKey, scope, clientId, at, actor })
    try {
      await store.put(item, { ifNotExists: true })
      return { claimed: true, item }
    } catch (err) {
      if (!isConflict(err)) throw err
    }
    const existing = await store.get(item.pk, item.sk)
    if (existing && !existing.resultRef && existing.failedAt) {
      try {
        await store.update(item.pk, item.sk, { failedAt: null, reclaimedAt: at }, { expect: { failedAt: existing.failedAt } })
        return { claimed: true, item }
      } catch (err) {
        if (!isConflict(err)) throw err
      }
    }
    return { claimed: false, existing }
  }
  const settleClaim = (item, patch) => store.update(item.pk, item.sk, patch).catch((err) => log.warn?.('support_idem_settle_failed', { error: err?.name }))

  // ---- case numbers (optimistic counter) ---------------------------------------------
  async function allocateCaseNumber(attempts = 10) {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const counter = await store.get(SUP_PK.COUNTER, 'CASENO')
      const version = counter?.version ?? 0
      const value = (counter?.value || 0) + 1
      try {
        await store.put(counterItem({ value, version: version + 1, at: iso() }), { expectVersion: version })
        return formatCaseNumber(value)
      } catch (err) {
        if (!isConflict(err)) throw err
      }
    }
    throw new HttpError(503, 'could not allocate a case number; try again')
  }

  // ---- reads -----------------------------------------------------------------------------
  // Cross-contact lists fail closed instead of silently returning a first page.
  async function listAllOfType(type) {
    const list = await store.listByType(type, { all: true })
    if (list.length > LIMITS.maxListRead) throw new HttpError(503, `more than ${LIMITS.maxListRead} ${type} items; refusing to process them in one request`)
    return list
  }
  const listAllCases = () => listAllOfType(SUPPORT_TYPES.CASE)

  async function lookupCaseNumber(caseNumber) {
    return store.get(SUP_PK.CASENO, caseNumber)
  }

  async function loadCase(contactKey, caseId) {
    return store.get(pkFor(contactKey), `${SUPPORT_TYPES.CASE}#${caseId}`)
  }

  // Player lookup: the number must belong to the caller's own partition.
  async function loadOwnCase(identity, caseNumber) {
    assertCaseNumber(caseNumber)
    const contactKey = keyFor(identity.email)
    const ref = await lookupCaseNumber(caseNumber)
    if (!ref || ref.contactKey !== contactKey) throw new HttpError(404, 'case not found')
    const c = await loadCase(contactKey, ref.caseId)
    if (!c || c.contactKey !== contactKey || c.playerVisible === false) throw new HttpError(404, 'case not found')
    return c
  }

  async function loadCaseForStaff(caseNumber) {
    assertCaseNumber(caseNumber)
    const ref = await lookupCaseNumber(caseNumber)
    const c = ref ? await loadCase(ref.contactKey, ref.caseId) : null
    if (!c) throw new HttpError(404, 'case not found')
    return c
  }

  async function caseEvents(c) {
    const items = await store.listContact(pkFor(c.contactKey))
    const prefix = `${SUPPORT_TYPES.CASE_EVENT}#${c.caseId}#`
    const attPrefix = `${SUPPORT_TYPES.ATTACHMENT}#${c.caseId}#`
    return {
      all: items,
      events: items.filter((i) => String(i.sk).startsWith(prefix)).sort((a, b) => String(a.sk).localeCompare(String(b.sk))),
      attachments: items.filter((i) => String(i.sk).startsWith(attPrefix)),
    }
  }

  async function safeFacts(identity, opts) {
    if (typeof ctx.factsFor !== 'function') return null
    try {
      return await ctx.factsFor(identity, opts)
    } catch (err) {
      log.warn?.('support_facts_unavailable', { error: err?.name || 'Error' })
      return null
    }
  }

  // ---- classification ---------------------------------------------------------------------
  // classifyIssue(text, { signals }) -> { category, subcategory, intent,
  // confidence, questions[] }; routing (team/priority/severity) comes from
  // categoryInfo(category) or the CATEGORY_DEFAULTS fallback.
  async function classify({ text: t, category = null, subcategory = null, signals = {} }) {
    const out = await runEngine('classifyIssue', [t, { signals: signals || {} }], { status: 'not_available' })
    const suggested = CATEGORIES.includes(out?.category) ? out.category : null
    const cat = CATEGORIES.includes(category) ? category : suggested || 'other'
    const info = await runEngine('categoryInfo', [cat], null)
    const [dTeam, dPriority, dSeverity] = CATEGORY_DEFAULTS[cat]
    const priority = PRIORITIES.includes(info?.priority) ? info.priority : dPriority
    const questions = Array.isArray(out?.questions)
      ? out.questions
        .map((q) => (typeof q === 'string' ? { id: null, prompt: q, why: null } : { id: typeof q?.id === 'string' ? q.id : null, prompt: q?.prompt || q?.text || null, why: q?.why || null }))
        .filter((q) => typeof q.prompt === 'string' && q.prompt.trim())
        .map((q) => ({ id: q.id, prompt: clip(q.prompt, 200), why: q.why ? clip(q.why, 200) : null }))
        .slice(0, 5)
      : []
    return {
      category: cat,
      subcategory: subcategory || (cat === suggested && typeof out?.subcategory === 'string' && SLUG.test(out.subcategory) ? out.subcategory : null),
      intent: INTENTS.includes(out?.intent) ? out.intent : null,
      confidence: Number.isFinite(out?.confidence) ? Math.max(0, Math.min(1, out.confidence)) : 0,
      priority,
      severity: SEVERITIES.includes(info?.severity) ? info.severity : dSeverity,
      team: TEAMS.includes(info?.team) ? info.team : dTeam,
      suggestedCategory: suggested,
      questions: cat === suggested || !category ? questions : [],
      engineStatus: out?.status || 'ok',
    }
  }

  // buildDiagnostics({ view, roles, identity, one, facts, now, category,
  // caseId, incidents, cases }) -> { view, panels[], signals, observedAt }.
  // Player-data history (recon-player-snapshots / -identities /
  // -provider-health) read here, read-only, and handed to the engine as plain
  // data: engines never receive table handles. Each source degrades on its own.
  async function readPlayerData(reconPlayerId) {
    const t = ctx.tables || {}
    const one = async (fn) => {
      if (typeof fn !== 'function') return { status: 'not_connected', data: null }
      try {
        return { status: 'ok', data: await fn() }
      } catch (err) {
        return { status: err?.name === 'NotConnectedError' ? 'not_connected' : 'unavailable', data: null }
      }
    }
    const [snapshots, identities, providerHealth] = await Promise.all([
      reconPlayerId && t.playerSnapshots ? one(() => t.playerSnapshots(reconPlayerId)) : { status: reconPlayerId ? 'not_connected' : 'ok', data: [] },
      reconPlayerId && t.playerIdentities ? one(() => t.playerIdentities(reconPlayerId)) : { status: reconPlayerId ? 'not_connected' : 'ok', data: [] },
      t.providerHealth ? one(() => t.providerHealth()) : { status: 'not_connected', data: null },
    ])
    return { snapshots, identities, providerHealth }
  }

  async function diagnosticsFor({ view, roles = [], email, factsResult = null, category = null, caseId = null, incidents = [], cases = [] }) {
    const reconPlayerId = factsResult?.one?.identity?.reconPlayerId || null
    const playerData = reconPlayerId ? await readPlayerData(reconPlayerId) : null
    return runEngine('buildDiagnostics', [{
      view,
      roles,
      identity: { email, signedIn: view === 'player', reconPlayerId: factsResult?.one?.identity?.reconPlayerId || null },
      one: factsResult?.one || null,
      facts: factsResult?.facts || null,
      now: now(),
      category,
      caseId,
      incidents,
      cases,
      playerData,
    }], { status: 'not_available', view, panels: [], signals: {} })
  }

  function subscriptionRefs(factsResult) {
    const rows = factsResult?.one?.sources?.billing?.status === 'ok' ? factsResult.one.sources.billing.data || [] : []
    const best = pickBestSub(rows, { catalog: ctx.catalog, now: now() })
    if (!best) return null
    return { stripeCustomerId: best.stripe_customer_id || null, stripeSubscriptionId: best.stripe_subscription_id || null }
  }

  // Core case creation used by the portal, email, proactive and linked cases.
  // `openingText` (proactive only) is the staff-only text of the opening
  // `system` event when it differs from the stored, player-safe description;
  // `subject` overrides the subject derived from the text; `extra` adds
  // staff-only fields to the case record.
  async function openCase({ contactKey, email, reconPlayerId = null, rawText, subject = null, openingText = null, extra = null, category = null, subcategory = null, answers = null, context = null, source, createdBy, linkedFromCaseNumber = null, playerVisible = true, factsResult = null, signals = {}, openingKind = 'message_player', openingActor, extraEventData = null }) {
    const redacted = redactSensitive(rawText)
    const openingRedacted = openingText === null ? redacted : redactSensitive(openingText)
    const answersRedacted = answers ? Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, redactSensitive(v).text])) : null
    const answerRedactions = answers ? Object.values(answers).flatMap((v) => redactSensitive(v).redactions) : []
    const cls = await classify({ text: redacted.text, category, subcategory, signals })
    const at = iso()
    const caseNumber = await allocateCaseNumber()
    const caseId = newCaseId()
    const refs = {}
    if (BILLING_CATEGORIES.includes(cls.category)) refs.subscription = subscriptionRefs(factsResult)
    const record = {
      ...caseItem({
        caseId,
        caseNumber,
        contactKey,
        email,
        reconPlayerId: reconPlayerId || factsResult?.one?.identity?.reconPlayerId || null,
        category: cls.category,
        subcategory: cls.subcategory,
        intent: cls.intent,
        source,
        subject: subject ? subjectFrom(redactSensitive(subject).text) : subjectFrom(redacted.text),
        description: redacted.text,
        priority: cls.priority,
        severity: cls.severity,
        team: cls.team,
        refs,
        sla: initialSla(cls.priority, at),
        classification: { suggestedCategory: cls.suggestedCategory, confidence: cls.confidence, engineStatus: cls.engineStatus },
        redactions: [...redacted.redactions, ...answerRedactions],
        linkedFromCaseNumber,
        playerVisible,
        createdBy,
        at,
      }),
      answers: answersRedacted,
      context: context || null,
      ...(extra || {}),
    }
    await store.put(record, { ifNotExists: true })
    await store.put(caseNumberItem({ caseNumber, contactKey, caseId, at }), { ifNotExists: true })
    await store.put(caseIdItem({ caseId, contactKey, caseNumber, at }), { ifNotExists: true })
    const opening = openingKind === 'system'
      ? { kind: 'system', visibility: 'staff', actor: SYSTEM, body: openingRedacted.text, data: extraEventData }
      : { kind: openingKind, visibility: 'public', actor: openingActor, body: redacted.text, data: extraEventData }
    await writeEvent({ caseRecord: record, ...opening })
    await audit({ contactKey, action: 'support.case.create', actor: createdBy, detail: { caseNumber, source, category: record.category, redactions: record.redactions.length, linkedFromCaseNumber } })
    await notifyStaffOfNewCase(record)
    return record
  }

  // Staff-only "new case" notification. Off unless index.mjs injects a sender
  // (SUPPORT_STAFF_NOTIFY). It never carries the player's email or message,
  // only what a person needs to open the case; it can never fail the request.
  async function notifyStaffOfNewCase(record) {
    const send = supportConfig().notifyStaff
    if (typeof send !== 'function') return
    try {
      await send({ caseNumber: record.caseNumber, category: record.category, priority: record.priority, source: record.source, linked: Boolean(record.linkedFromCaseNumber) })
    } catch (err) {
      log.warn?.('support_staff_notify_failed', { error: err?.name || 'Error' })
    }
  }

  function assertCaseRate(items) {
    const cutoff = now() - DAY
    const recent = items.filter((i) => i.type === SUPPORT_TYPES.CASE && ['portal', 'email'].includes(i.source) && Date.parse(i.createdAt) > cutoff)
    if (recent.length >= LIMITS.casesPerDay) throw new HttpError(429, 'case limit reached for today; add details to an open case instead', 'rate_limited')
  }

  // Portal messages AND email the player sent (email_in with a player actor)
  // share one daily budget.
  function assertMessageRate(items) {
    const cutoff = now() - DAY
    const recent = items.filter((i) => i.type === SUPPORT_TYPES.CASE_EVENT && ['message_player', 'email_in'].includes(i.kind) && i.actor?.kind === 'player' && Date.parse(i.at) > cutoff)
    if (recent.length >= LIMITS.messagesPerDay) throw new HttpError(429, 'message limit reached for today', 'rate_limited')
  }

  // The rolling checks above read stored items, so concurrent requests all
  // pass them before any of them writes. The hard cap is a claimed slot:
  // slot N of the player's daily allowance for `kind` ('case' | 'msg') is a
  // conditional put, so at most `limit` requests per player, kind and UTC
  // day ever get one, however many run at once. Every accepted case also
  // claims a 'msg' slot (its opening message counts, as in the rolling
  // check). A slot is spent even when the request later fails.
  const RATE_KINDS = { case: { limit: LIMITS.casesPerDay, message: 'case limit reached for today; add details to an open case instead' }, msg: { limit: LIMITS.messagesPerDay, message: 'message limit reached for today' } }
  async function claimRateSlot(contactKey, kind, items = null) {
    const { limit, message } = RATE_KINDS[kind]
    const at = iso()
    const day = at.slice(0, 10)
    const prefix = `SUP#RATE#${kind}#${day}#`
    const known = (items || (await store.listContact(pkFor(contactKey)))).filter((i) => String(i.sk || '').startsWith(prefix)).length
    for (let slot = Math.min(known, limit); slot < limit; slot += 1) {
      try {
        await store.put(rateSlotItem({ contactKey, kind, day, slot, at }), { ifNotExists: true })
        return slot
      } catch (err) {
        if (!isConflict(err)) throw err
      }
    }
    throw new HttpError(429, message, 'rate_limited')
  }
  async function claimRateSlots(contactKey, kinds, items = null) {
    for (const kind of kinds) await claimRateSlot(contactKey, kind, items)
  }

  // A player reply after close (or > 14 days after resolve) opens a new case
  // linked to the old one; the old one is only annotated.
  async function openLinkedCase({ previous, rawText, source, actor, factsResult = null, openingKind = 'message_player', openingData = null }) {
    const linked = await openCase({
      contactKey: previous.contactKey,
      email: previous.email,
      reconPlayerId: previous.reconPlayerId,
      rawText,
      category: previous.category,
      subcategory: previous.subcategory,
      source,
      createdBy: actor.kind === 'player' ? 'player' : actor.id,
      linkedFromCaseNumber: previous.caseNumber,
      factsResult,
      openingKind,
      openingActor: actor,
      extraEventData: openingData,
    })
    const { next } = await mutateCase(previous.contactKey, previous.caseId, (c) => ({ ...c, linkedCaseNumbers: [...new Set([...(c.linkedCaseNumbers || []), linked.caseNumber])], updatedAt: iso() }))
    await writeEvent({ caseRecord: next, kind: 'system', visibility: 'public', actor: SYSTEM, body: `A new case ${linked.caseNumber} was opened from a reply to this closed case.`, data: { linkedCaseNumber: linked.caseNumber } })
    await audit({ contactKey: previous.contactKey, action: 'support.case.link_new', actor: actor.kind === 'player' ? 'player' : actor.id, detail: { from: previous.caseNumber, to: linked.caseNumber } })
    return linked
  }

  // Shared by portal replies and attached inbound email.
  async function applyPlayerReply({ caseRecord, rawText, actor, kind = 'message_player', data = null, source = 'portal' }) {
    const decision = wf.decidePlayerReply(caseRecord, now())
    if (decision.action === 'new_linked_case') {
      const linked = await openLinkedCase({ previous: caseRecord, rawText, source, actor, openingKind: kind, openingData: data })
      return { linkedCase: linked, event: null, caseRecord }
    }
    const redacted = redactSensitive(rawText)
    const at = iso()
    const { previous, next } = await mutateCase(caseRecord.contactKey, caseRecord.caseId, (c) => {
      let n = { ...c, updatedAt: at, lastPlayerMessageAt: at, sla: slaAfterPlayerMessage(c.sla, c.priority, at) }
      const d = wf.decidePlayerReply(c, now())
      if (d.action === 'transition') n = wf.applyTransition(n, d.to, { actor: d.actor, at })
      return n
    })
    const event = await writeEvent({ caseRecord: next, kind, visibility: 'public', actor, body: redacted.text, data: { ...(data || {}), redactions: redacted.redactions.length } })
    if (previous.status !== next.status) {
      await writeEvent({ caseRecord: next, kind: 'status_change', visibility: 'public', actor: SYSTEM, data: { from: previous.status, to: next.status, rule: 'player_reply' } })
    }
    await audit({ contactKey: caseRecord.contactKey, action: kind === 'email_in' ? 'support.case.email_in' : 'support.case.message_player', actor: actor.kind === 'player' ? 'player' : actor.id, detail: { caseNumber: caseRecord.caseNumber, eventId: event.eventId, statusFrom: previous.status, statusTo: next.status, redactions: redacted.redactions.length } })
    return { event, caseRecord: next, linkedCase: null }
  }

  // ---- directory (Player 360 / proactive / active members) ---------------------------
  // Short in-container cache: the queue reads the directory for display
  // names and plan labels on every load. config.directoryCacheMs (default
  // 30 s); 0 disables it.
  let directoryCache = null
  async function directoryEntries() {
    const ttl = Number.isFinite(ctx.config?.directoryCacheMs) ? ctx.config.directoryCacheMs : 30000
    if (ttl > 0 && directoryCache && Date.now() - directoryCache.at < ttl) return directoryCache.entries
    const entries = await buildDirectoryEntries()
    if (ttl > 0) directoryCache = { at: Date.now(), entries }
    return entries
  }

  async function playerSummariesByKey() {
    try {
      return new Map((await directoryEntries()).map((e) => [e.contactKey, e.summary]))
    } catch (err) {
      log.warn?.('support_directory_unavailable', { error: err?.name || 'Error' })
      return new Map()
    }
  }

  async function buildDirectoryEntries() {
    const dir = await assembleDirectory({ tables: ctx.tables, store, log })
    const t = now()
    return dir.contacts.map((contact) => {
      const facts = buildFacts({ now: t, catalog: ctx.catalog, config: ctx.config, identity: contact.identity, sources: contact.sources })
      const lifecycle = deriveLifecycle(facts, t)
      const one = { identity: contact.identity, sources: contact.sources, cognitoUser: contact.cognitoUsers?.[0] || null }
      return { contactKey: contact.contactKey, email: contact.email, one, facts, lifecycle, summary: buildPlayerSummary(contact, facts, lifecycle) }
    })
  }

  async function countActiveMembers() {
    try {
      const entries = await directoryEntries()
      return entries.filter((e) => e.facts.billing?.hasAccess === true && !e.facts.identity?.isAdmin).length
    } catch (err) {
      log.warn?.('support_active_members_unavailable', { error: err?.name || 'Error' })
      return null
    }
  }

  async function staffContext(c, roles) {
    const { events, attachments, all } = await caseEvents(c)
    const factsResult = await safeFacts({ email: c.email, sub: null, isAdmin: false }, { withCognito: true, signedIn: false })
    let player360 = { status: 'unavailable', summary: null }
    if (factsResult) {
      try {
        player360 = { status: 'ok', summary: buildPlayerSummary({ contactKey: c.contactKey }, factsResult.facts, factsResult.lifecycle) }
      } catch (err) {
        log.warn?.('support_player360_failed', { error: err?.name || 'Error' })
      }
    }
    const previousCases = all
      .filter((i) => i.type === SUPPORT_TYPES.CASE && i.caseId !== c.caseId)
      .map((p) => ({ caseNumber: p.caseNumber, status: p.status, category: p.category, subject: p.subject, createdAt: p.createdAt, resolvedAt: p.resolvedAt || null }))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    const incident = c.refs?.incidentId ? strip(await store.get(SUP_PK.INCIDENT, `INC#${c.refs.incidentId}`)) : null
    const activeIncidents = (await listIncidentItems()).filter(isActiveIncident).map(strip)
    const diagnostics = await diagnosticsFor({ view: 'staff', roles, email: c.email, factsResult, category: c.category, caseId: c.caseId, incidents: activeIncidents, cases: previousCases })
    // The copilot gets frozen copies and nothing else: it cannot reach the
    // store, and its output is advisory data the service never acts on.
    const copilot = sanitizeCopilot(await runEngine('buildCopilot', [{
      caseRecord: strip(c),
      // The copilot reads `type` (not the store's `type: 'CEV'`) and from/to.
      events: events.map((e) => ({ ...strip(e), type: e.kind, from: e.data?.from ?? null, to: e.data?.to ?? null })),
      diagnostics,
      related: { cases: previousCases, incidents: activeIncidents },
      articles: [],
      playerSummary: player360.summary,
      previousCases,
      incident,
      incidents: activeIncidents,
      roles,
      modelEnabled: supportConfig().copilotModel === true,
      now: now(),
    }], { status: 'not_available' }, { freeze: true }))
    // The case's own audit trail (support.* AUDIT items in the player's
    // partition whose detail names this case). Ids and kinds only.
    const audit = all
      .filter((i) => i.type === 'AUDIT' && String(i.action || '').startsWith('support.') && i.detail?.caseNumber === c.caseNumber)
      .sort((a, b) => String(a.sk).localeCompare(String(b.sk)))
      .map((i) => ({ id: `au_${String(i.sk).split('#').pop()}`, at: i.at, actor: i.actor, action: i.action, detail: clone(i.detail || {}) }))
    return { events, attachments, player360, previousCases, incident, diagnostics, copilot, audit }
  }

  // Final staff payload: billing references masked for roles without
  // billing.refs.full (agent, engineering).
  const forRoles = (roles, payload) => (can(roles, 'billing.refs.full') ? payload : maskBillingRefs(payload))

  function staffCaseView(c, now_) {
    return { ...strip(c), slaState: slaState(c, now_), allowedTransitions: wf.allowedTargets(c.status, 'staff') }
  }

  async function findActionRequest(c, requestId) {
    const { events } = await caseEvents(c)
    return events.find((e) => e.kind === 'action_request' && e.requestId === requestId) || null
  }

  function actionRequestView(e) {
    return { requestId: e.requestId, caseNumber: e.caseNumber, kind: e.actionKind, reason: e.reason, requiredVerification: e.requiredVerification, status: e.arStatus, history: e.history, executesInSupport: false, createdAt: e.at }
  }

  // ======================================================================================
  // Player methods
  // ======================================================================================

  async function triage(identity, body = {}) {
    requireRole(identity, 'case.create_own')
    onlyKeys(body, ['text', 'context', 'category'], 'request')
    const raw = text(body.text, 'text', { min: 3, max: LIMITS.caseText })
    const category = oneOf(body.category, CATEGORIES, 'category', { required: false })
    const context = validateContext(body.context)
    const redacted = redactSensitive(raw)
    const factsResult = await safeFacts(identity)
    const preview = await diagnosticsFor({ view: 'player', email: identity.email, factsResult, category })
    const cls = await classify({ text: redacted.text, category, signals: preview?.signals || {} })
    const help = await runEngine('searchHelp', [redacted.text, { limit: 3 }], [])
    const diagnostics = cls.category === category ? preview : await diagnosticsFor({ view: 'player', email: identity.email, factsResult, category: cls.category })
    return {
      suggestedCategory: cls.suggestedCategory || cls.category,
      confidence: cls.confidence,
      intent: cls.intent,
      questions: cls.questions,
      diagnosticsPreview: playerDiagnostics(diagnostics),
      helpArticles: reviewedOnly(Array.isArray(help) ? help : help?.articles).slice(0, 3),
      redacted: redacted.redactions.length > 0,
    }
  }

  async function createCase(identity, body = {}) {
    requireRole(identity, 'case.create_own')
    onlyKeys(body, ['text', 'category', 'subcategory', 'answers', 'context', 'clientRequestId'], 'request')
    const raw = text(body.text, 'text', { min: 3, max: LIMITS.caseText })
    const category = oneOf(body.category, CATEGORIES, 'category', { required: false })
    let subcategory = null
    if (body.subcategory !== undefined && body.subcategory !== null) {
      if (!SLUG.test(String(body.subcategory))) throw bad('invalid subcategory')
      subcategory = body.subcategory
    }
    const answers = validateAnswers(body.answers)
    const context = validateContext(body.context)
    const clientId = clientRequestId(body.clientRequestId)
    const contactKey = keyFor(identity.email)

    const claim = await claimOnce({ contactKey, scope: 'support_case', clientId, actor: 'player' })
    if (!claim.claimed) {
      if (claim.existing?.resultRef) {
        const existing = await loadCase(contactKey, claim.existing.resultRef)
        if (existing) return { replayed: true, case: projectPlayerCase(existing, { now: now() }) }
      }
      throw new HttpError(409, 'this request is already being processed', 'in_progress')
    }
    try {
      const items = await store.listContact(pkFor(contactKey))
      assertCaseRate(items)
      await claimRateSlots(contactKey, ['case', 'msg'], items)
      const factsResult = await safeFacts(identity)
      const preview = await diagnosticsFor({ view: 'player', email: identity.email, factsResult, category })
      const record = await openCase({ contactKey, email: identity.email, rawText: raw, category, subcategory, answers, context, source: 'portal', createdBy: 'player', factsResult, signals: preview?.signals || {}, openingActor: playerActor(identity) })
      await settleClaim(claim.item, { resultRef: record.caseId, caseNumber: record.caseNumber })
      const { events, attachments } = await caseEvents(record)
      return { replayed: false, case: projectPlayerCase(record, { events, attachments, now: now() }) }
    } catch (err) {
      await settleClaim(claim.item, { failedAt: iso() })
      throw err
    }
  }

  async function listMyCases(identity) {
    requireRole(identity, 'case.read_own')
    const items = await store.listContact(pkFor(keyFor(identity.email)))
    const cases = items.filter((i) => i.type === SUPPORT_TYPES.CASE && i.playerVisible !== false).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    const buckets = Object.fromEntries(Object.keys(wf.PLAYER_BUCKETS).map((b) => [b, []]))
    for (const c of cases) buckets[wf.playerBucket(c.status)].push(playerCaseSummary(c))
    return { buckets, labels: wf.BUCKET_LABEL, total: cases.length }
  }

  async function getMyCase(identity, caseNumber) {
    requireRole(identity, 'case.read_own')
    const c = await loadOwnCase(identity, caseNumber)
    const { events, attachments } = await caseEvents(c)
    const factsResult = await safeFacts(identity)
    const diagnostics = await diagnosticsFor({ view: 'player', email: identity.email, factsResult, category: c.category, caseId: c.caseId })
    return projectPlayerCase(c, { events, attachments, diagnostics, now: now(), uploads: uploadsState(supportConfig()) })
  }

  async function addPlayerMessage(identity, caseNumber, body = {}) {
    requireRole(identity, 'case.message_own')
    onlyKeys(body, ['text', 'clientRequestId'], 'request')
    const raw = text(body.text, 'text', { max: LIMITS.messageText })
    const clientId = clientRequestId(body.clientRequestId)
    const c = await loadOwnCase(identity, caseNumber)
    // The idempotency marker is scoped to this case: the same clientRequestId
    // sent to another case is a different message, never a replay of this one.
    const claim = await claimOnce({ contactKey: c.contactKey, scope: `support_msg_${c.caseId}`, clientId, actor: 'player' })
    if (!claim.claimed) {
      if (claim.existing?.resultRef) return { replayed: true, eventId: claim.existing.resultRef, caseNumber: c.caseNumber, linkedCaseNumber: claim.existing.linkedCaseNumber || null }
      throw new HttpError(409, 'this message is already being processed', 'in_progress')
    }
    try {
      const items = await store.listContact(pkFor(c.contactKey))
      assertMessageRate(items)
      const linked = wf.decidePlayerReply(c, now()).action === 'new_linked_case'
      if (linked) assertCaseRate(items)
      await claimRateSlots(c.contactKey, linked ? ['case', 'msg'] : ['msg'], items)
      const result = await applyPlayerReply({ caseRecord: c, rawText: raw, actor: playerActor(identity) })
      if (result.linkedCase) {
        await settleClaim(claim.item, { resultRef: `case:${result.linkedCase.caseId}`, linkedCaseNumber: result.linkedCase.caseNumber })
        return { replayed: false, caseNumber: c.caseNumber, linkedCaseNumber: result.linkedCase.caseNumber, status: c.status, linkedCase: projectPlayerCase(result.linkedCase, { now: now() }) }
      }
      await settleClaim(claim.item, { resultRef: result.event.eventId })
      return { replayed: false, caseNumber: c.caseNumber, eventId: result.event.eventId, status: result.caseRecord.status, linkedCaseNumber: null }
    } catch (err) {
      await settleClaim(claim.item, { failedAt: iso() })
      throw err
    }
  }

  async function requestAttachmentUpload(identity, caseNumber, body = {}) {
    requireRole(identity, 'case.message_own')
    onlyKeys(body, ['name', 'mime', 'size'], 'request')
    const c = await loadOwnCase(identity, caseNumber)
    // text() strips control, bidi and zero-width characters first; the name
    // is then redacted (it is shown to staff and in the player's timeline).
    const cleanName = text(body.name, 'name', { max: 120 })
    if (!/^[\w\- .()]+$/.test(cleanName)) throw bad('invalid file name')
    const name = redactSensitive(cleanName).text
    const mime = oneOf(body.mime, ATTACHMENT_MIME, 'mime')
    const size = body.size
    if (!Number.isInteger(size) || size <= 0) throw bad('size must be a positive whole number of bytes')
    const max = mime === 'video/mp4' ? MAX_VIDEO_BYTES : MAX_FILE_BYTES
    if (size > max) throw new HttpError(413, `file too large (max ${Math.round(max / 1048576)} MB for ${mime})`)
    // The private bucket and presign route are not provisioned.
    if (supportConfig().attachments !== true) return { status: 'upload_disabled' }
    const at = iso()
    const attId = newId('att')
    const manifest = attachmentItem({ caseRecord: c, attId, name, mime, size, at, by: 'player' })
    await store.put(manifest, { ifNotExists: true })
    await writeEvent({ caseRecord: c, kind: 'attachment', visibility: 'public', actor: playerActor(identity), data: { attId, name, mime, size } })
    await audit({ contactKey: c.contactKey, action: 'support.attachment.manifest', actor: 'player', detail: { caseNumber: c.caseNumber, attId, mime, size } })
    return { status: 'manifest_recorded', attachment: { id: attId, name, mime, size, scanState: manifest.scanState }, upload: null }
  }

  async function confirmResolved(identity, caseNumber) {
    requireRole(identity, 'case.read_own')
    const c = await loadOwnCase(identity, caseNumber)
    const { previous, next } = await mutateCase(c.contactKey, c.caseId, (cur) => wf.applyTransition(cur, 'closed', { actor: 'player', at: iso() }))
    await writeEvent({ caseRecord: next, kind: 'status_change', visibility: 'public', actor: playerActor(identity), data: { from: previous.status, to: 'closed', rule: 'player_confirmed' } })
    await audit({ contactKey: c.contactKey, action: 'support.case.confirm_resolved', actor: 'player', detail: { caseNumber: c.caseNumber } })
    return projectPlayerCase(next, { now: now() })
  }

  async function reopen(identity, caseNumber, body = {}) {
    requireRole(identity, 'case.message_own')
    onlyKeys(body, ['text', 'clientRequestId'], 'request')
    const reason = text(body.text, 'text', { max: LIMITS.messageText, required: false })
    const c = await loadOwnCase(identity, caseNumber)
    if (wf.effectivelyClosed(c, now())) {
      if (!reason) throw bad('this case is closed; tell us what is still wrong and we will open a new linked case', 'closed_needs_text')
      const items = await store.listContact(pkFor(c.contactKey))
      assertCaseRate(items)
      assertMessageRate(items)
      await claimRateSlots(c.contactKey, ['case', 'msg'], items)
      const linked = await openLinkedCase({ previous: c, rawText: reason, source: 'portal', actor: playerActor(identity) })
      return { reopened: false, linkedCaseNumber: linked.caseNumber, case: projectPlayerCase(linked, { now: now() }) }
    }
    if (reason) {
      const items = await store.listContact(pkFor(c.contactKey))
      assertMessageRate(items)
      // Refuse an impossible reopen before spending a slot on it.
      try {
        wf.applyTransition(c, 'reopened', { actor: 'player', at: iso() })
      } catch (err) {
        if (err instanceof wf.TransitionError) throw new HttpError(409, err.message, err.code)
        throw err
      }
      await claimRateSlot(c.contactKey, 'msg', items)
    }
    const at = iso()
    const { previous, next } = await mutateCase(c.contactKey, c.caseId, (cur) => ({ ...wf.applyTransition(cur, 'reopened', { actor: 'player', at }), lastPlayerMessageAt: at, sla: slaAfterPlayerMessage(cur.sla, cur.priority, at) }))
    await writeEvent({ caseRecord: next, kind: 'status_change', visibility: 'public', actor: playerActor(identity), data: { from: previous.status, to: 'reopened', rule: 'player_reopen' } })
    if (reason) {
      const r = redactSensitive(reason)
      await writeEvent({ caseRecord: next, kind: 'message_player', visibility: 'public', actor: playerActor(identity), body: r.text, data: { redactions: r.redactions.length } })
    }
    await audit({ contactKey: c.contactKey, action: 'support.case.reopen', actor: 'player', detail: { caseNumber: c.caseNumber } })
    return { reopened: true, linkedCaseNumber: null, case: projectPlayerCase(next, { now: now() }) }
  }

  async function submitCsat(identity, caseNumber, body = {}) {
    requireRole(identity, 'case.csat_own')
    onlyKeys(body, ['rating', 'comment'], 'request')
    const rating = validateRating(body.rating)
    const comment = text(body.comment, 'comment', { max: LIMITS.comment, required: false })
    const c = await loadOwnCase(identity, caseNumber)
    const r = comment ? redactSensitive(comment) : null
    const at = iso()
    const { next } = await mutateCase(c.contactKey, c.caseId, (cur) => {
      if (!['resolved', 'closed'].includes(cur.status) || !(cur.resolutionCount > 0)) throw new HttpError(409, 'you can rate a case once it is resolved', 'not_resolved')
      if (cur.csat && cur.csat.forResolution === cur.resolutionCount) throw new HttpError(409, 'you already rated this case', 'already_rated')
      return { ...cur, csat: { rating, comment: r?.text || null, at, forResolution: cur.resolutionCount }, updatedAt: at }
    })
    await writeEvent({ caseRecord: next, kind: 'csat', visibility: 'public', actor: playerActor(identity), body: r?.text || null, data: { rating, forResolution: next.csat.forResolution } })
    await audit({ contactKey: c.contactKey, action: 'support.case.csat', actor: 'player', detail: { caseNumber: c.caseNumber, rating } })
    return { ok: true, rating }
  }

  // ======================================================================================
  // Staff methods
  // ======================================================================================

  const QUEUE_FILTERS = {
    unassigned: (c) => !c.assignee,
    mine: (c, me) => c.assignee === me,
    critical: (c) => c.priority === 'p1' || c.severity === 'sev1',
    billing: (c) => BILLING_CATEGORIES.includes(c.category) || c.team === 'billing',
    identity: (c) => CATEGORY_GROUPS.identity.includes(c.category),
    vod: (c) => CATEGORY_GROUPS.vod.includes(c.category),
    coaching: (c) => CATEGORY_GROUPS.coaching.includes(c.category) || c.intent === 'value',
    bugs: (c) => CATEGORY_GROUPS.bugs.includes(c.category),
    waiting: (c) => c.status === 'waiting_on_player' || c.status === 'waiting_on_provider',
    at_risk: (c, me, t) => {
      const s = slaState(c, t)
      return s.atRisk || s.overdue
    },
    incidents: (c) => Boolean(c.refs?.incidentId),
    all_open: () => true,
  }
  const PRIORITY_RANK = { p1: 0, p2: 1, p3: 2, p4: 3 }

  async function queue(identity, view = 'unassigned') {
    const roles = requireRole(identity, 'queue.read')
    oneOf(view, QUEUE_VIEWS, 'view')
    const t = now()
    const open = (await listAllCases()).filter((c) => wf.isOpen(c.status))
    const inView = open.filter((c) => QUEUE_FILTERS[view](c, identity.email, t))
    const players = inView.length ? await playerSummariesByKey() : new Map()
    const rows = inView
      .map((c) => queueRow(c, t, players.get(c.contactKey)))
      .sort((a, b) => (PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]) || (Number(b.sla.overdue) - Number(a.sla.overdue)) || String(a.createdAt).localeCompare(String(b.createdAt)))
    const counts = Object.fromEntries(QUEUE_VIEWS.map((v) => [v, open.filter((c) => QUEUE_FILTERS[v](c, identity.email, t)).length]))
    let incidents
    if (view === 'incidents') incidents = (await listIncidentItems()).filter(isActiveIncident).map(strip)
    return forRoles(roles, { view, me: identity.email, cases: rows, counts, ...(incidents ? { incidents } : {}) })
  }

  async function getCaseForStaff(identity, caseNumber) {
    const roles = requireRole(identity, 'case.read')
    const c = await loadCaseForStaff(caseNumber)
    const sc = await staffContext(c, roles)
    return forRoles(roles, {
      me: identity.email,
      case: staffCaseView(c, now()),
      timeline: sc.events.map((e) => ({ ...strip(e), visibleToPlayer: e.visibility === 'public' && PUBLIC_EVENT_KINDS.includes(e.kind) && c.playerVisible !== false })),
      attachments: sc.attachments.map(strip),
      uploads: uploadsState(supportConfig()),
      audit: sc.audit,
      actionRequests: sc.events.filter((e) => e.kind === 'action_request').map(actionRequestView),
      player360: sc.player360,
      previousCases: sc.previousCases,
      incident: sc.incident,
      diagnostics: can(roles, 'diagnostics.staff') ? clone(sc.diagnostics) : null,
      copilot: sc.copilot,
      permissions: Object.fromEntries(['case.reply', 'case.note', 'case.status', 'case.assign', 'case.escalate', 'case.link_incident', 'case.resolve', 'action.request', 'action.request.billing', 'action.authorize', 'action.record_done', 'billing.refs.full', 'diagnostics.technical'].map((a) => [a, can(roles, a)])),
    })
  }

  // `delivery` is NOT reachable from HTTP: the future outbound-email sender
  // passes { emailMessageId } after it actually sent the reply, so the
  // Message-ID can thread the player's answer. Outbound support email is not
  // wired, so today no reply carries one and the OUT# index stays empty.
  async function staffReply(identity, caseNumber, body = {}, delivery = null) {
    const roles = requireRole(identity, 'case.reply')
    onlyKeys(body, ['text', 'thenStatus', 'clientRequestId'], 'request')
    const raw = text(body.text, 'text', { max: LIMITS.messageText })
    const thenStatus = oneOf(body.thenStatus, wf.STATUSES, 'thenStatus', { required: false })
    if (thenStatus === 'resolved') throw bad('use resolve to resolve a case (it records the resolution)')
    if (thenStatus === 'escalated') throw bad('use escalate to escalate a case (it writes the handoff)')
    const clientId = clientRequestId(body.clientRequestId, { required: false })
    const c = await loadCaseForStaff(caseNumber)
    let claim = null
    if (clientId) {
      claim = await claimOnce({ contactKey: c.contactKey, scope: 'support_reply', clientId, actor: identity.email })
      if (!claim.claimed) throw new HttpError(409, 'this reply was already submitted', 'duplicate')
    }
    const r = redactSensitive(raw)
    const at = iso()
    const { previous, next } = await mutateCase(c.contactKey, c.caseId, (cur) => {
      let n = { ...cur, sla: slaAfterStaffReply(cur.sla, at), playerVisible: true, updatedAt: at }
      if (thenStatus && thenStatus !== cur.status) n = wf.applyTransition(n, thenStatus, { actor: 'staff', at })
      return n
    })
    const outboundHash = delivery?.emailMessageId ? messageIdHash(delivery.emailMessageId) : null
    const event = await writeEvent({ caseRecord: next, kind: 'message_staff', visibility: 'public', actor: staffActor(identity), body: r.text, data: { redactions: r.redactions.length, delivery: outboundHash ? 'email' : 'case_timeline_only', ...(outboundHash ? { emailMessageIdHash: outboundHash } : {}) } })
    if (outboundHash) await store.put(outboundMessageItem({ messageIdHash: outboundHash, caseId: next.caseId, caseNumber: next.caseNumber, contactKey: next.contactKey, at }), { ifNotExists: true }).catch((err) => { if (!isConflict(err)) throw err })
    if (previous.status !== next.status) await writeEvent({ caseRecord: next, kind: 'status_change', visibility: 'public', actor: staffActor(identity), data: { from: previous.status, to: next.status } })
    if (claim) await settleClaim(claim.item, { resultRef: event.eventId })
    await audit({ contactKey: c.contactKey, action: 'support.case.reply', actor: identity.email, detail: { caseNumber: c.caseNumber, eventId: event.eventId, statusFrom: previous.status, statusTo: next.status } })
    // Nothing is emailed here: the reply is visible in the player's case timeline.
    return forRoles(roles, { ok: true, eventId: event.eventId, status: next.status, delivery: outboundHash ? 'email' : 'case_timeline_only' })
  }

  async function addPrivateNote(identity, caseNumber, body = {}) {
    requireRole(identity, 'case.note')
    onlyKeys(body, ['text', 'clientRequestId'], 'request')
    const raw = text(body.text, 'text', { max: LIMITS.messageText })
    const clientId = clientRequestId(body.clientRequestId, { required: false })
    const c = await loadCaseForStaff(caseNumber)
    let claim = null
    if (clientId) {
      claim = await claimOnce({ contactKey: c.contactKey, scope: 'support_note', clientId, actor: identity.email })
      if (!claim.claimed) throw new HttpError(409, 'this note was already saved', 'duplicate')
    }
    const r = redactSensitive(raw)
    const event = await writeEvent({ caseRecord: c, kind: 'note_private', visibility: 'staff', actor: staffActor(identity), body: r.text, data: { redactions: r.redactions.length } })
    if (claim) await settleClaim(claim.item, { resultRef: event.eventId })
    await audit({ contactKey: c.contactKey, action: 'support.case.note', actor: identity.email, detail: { caseNumber: c.caseNumber, eventId: event.eventId } })
    return { ok: true, eventId: event.eventId }
  }

  async function setStatus(identity, caseNumber, body = {}) {
    const roles = requireRole(identity, 'case.status')
    onlyKeys(body, ['status', 'reason', 'version'], 'request')
    const to = oneOf(body.status, wf.STATUSES, 'status')
    const version = expectedVersion(body.version)
    if (to === 'resolved') throw bad('use resolve to resolve a case (it records the resolution)')
    if (to === 'escalated') throw bad('use escalate to escalate a case (it writes the handoff)')
    const reason = text(body.reason, 'reason', { max: 500, required: false })
    const c = await loadCaseForStaff(caseNumber)
    const at = iso()
    const { previous, next } = await mutateCase(c.contactKey, c.caseId, (cur) => wf.applyTransition(cur, to, { actor: 'staff', at }), 4, { expectVersion: version })
    await writeEvent({ caseRecord: next, kind: 'status_change', visibility: 'public', actor: staffActor(identity), data: { from: previous.status, to } })
    if (reason) await writeEvent({ caseRecord: next, kind: 'note_private', actor: staffActor(identity), body: redactSensitive(reason).text, data: { about: 'status_change' } })
    await audit({ contactKey: c.contactKey, action: 'support.case.status', actor: identity.email, detail: { caseNumber: c.caseNumber, from: previous.status, to } })
    return forRoles(roles, staffCaseView(next, now()))
  }

  async function assign(identity, caseNumber, body = {}) {
    const roles = requireRole(identity, 'case.assign')
    onlyKeys(body, ['assignee', 'team', 'version'], 'request')
    if (body.assignee === undefined && body.team === undefined) throw bad('assignee or team is required')
    const version = expectedVersion(body.version)
    let assignee
    if (body.assignee !== undefined) {
      if (body.assignee === null) assignee = null
      else if (body.assignee === 'me') assignee = identity.email
      else if (typeof body.assignee === 'string' && EMAIL.test(body.assignee.trim().toLowerCase())) assignee = body.assignee.trim().toLowerCase()
      else throw bad('assignee must be "me", a staff email or null')
    }
    const team = oneOf(body.team, TEAMS, 'team', { required: false })
    const c = await loadCaseForStaff(caseNumber)
    const at = iso()
    const { previous, next } = await mutateCase(c.contactKey, c.caseId, (cur) => ({ ...cur, ...(assignee !== undefined ? { assignee } : {}), ...(team ? { team } : {}), updatedAt: at }), 4, { expectVersion: version })
    await writeEvent({ caseRecord: next, kind: 'assignment', actor: staffActor(identity), data: { fromAssignee: previous.assignee, toAssignee: next.assignee, fromTeam: previous.team, toTeam: next.team } })
    await audit({ contactKey: c.contactKey, action: 'support.case.assign', actor: identity.email, detail: { caseNumber: c.caseNumber, assignee: next.assignee, team: next.team } })
    return forRoles(roles, staffCaseView(next, now()))
  }

  async function escalate(identity, caseNumber, body = {}) {
    const roles = requireRole(identity, 'case.escalate')
    onlyKeys(body, ['team', 'reason', 'version'], 'request')
    const team = oneOf(body.team, TEAMS, 'team')
    const version = expectedVersion(body.version)
    const reason = redactSensitive(text(body.reason, 'reason', { max: LIMITS.reason })).text
    const c = await loadCaseForStaff(caseNumber)
    if (c.status !== 'escalated' && !wf.canTransition(c.status, 'escalated', 'staff')) throw new HttpError(409, `a case in ${c.status} cannot be escalated; move it to in progress first`, 'transition_refused')
    const sc = await staffContext(c, roles)
    const at = iso()
    const handoff = buildHandoff({ caseRecord: c, events: sc.events, diagnostics: sc.diagnostics, copilot: sc.copilot, playerSummary: sc.player360.summary, team, reason, by: identity.email, at })
    const { previous, next } = await mutateCase(c.contactKey, c.caseId, (cur) => {
      const moved = cur.status === 'escalated' ? { ...cur, updatedAt: at } : wf.applyTransition(cur, 'escalated', { actor: 'staff', at })
      return { ...moved, team, escalation: { team, at, by: identity.email, reason, handoff } }
    }, 4, { expectVersion: version })
    await writeEvent({ caseRecord: next, kind: 'escalation', actor: staffActor(identity), body: handoff.text, data: { team, handoff } })
    if (previous.status !== next.status) await writeEvent({ caseRecord: next, kind: 'status_change', visibility: 'public', actor: staffActor(identity), data: { from: previous.status, to: next.status } })
    await audit({ contactKey: c.contactKey, action: 'support.case.escalate', actor: identity.email, detail: { caseNumber: c.caseNumber, team, from: previous.status } })
    return forRoles(roles, { case: staffCaseView(next, now()), handoff })
  }

  async function linkIncident(identity, caseNumber, body = {}) {
    const roles = requireRole(identity, 'case.link_incident')
    onlyKeys(body, ['incidentId', 'version'], 'request')
    const version = expectedVersion(body.version)
    const incidentId = String(body.incidentId || '')
    if (!INCIDENT_ID.test(incidentId)) throw bad('invalid incidentId')
    const incident = await store.get(SUP_PK.INCIDENT, `INC#${incidentId}`)
    if (!incident) throw new HttpError(404, 'incident not found')
    const c = await loadCaseForStaff(caseNumber)
    const at = iso()
    const { previous, next } = await mutateCase(c.contactKey, c.caseId, (cur) => ({ ...cur, refs: { ...(cur.refs || {}), incidentId }, updatedAt: at }), 4, { expectVersion: version })
    await writeEvent({ caseRecord: next, kind: 'incident_link', actor: staffActor(identity), data: { incidentId, previousIncidentId: previous.refs?.incidentId || null } })
    await audit({ contactKey: c.contactKey, action: 'support.case.link_incident', actor: identity.email, detail: { caseNumber: c.caseNumber, incidentId } })
    return forRoles(roles, staffCaseView(next, now()))
  }

  async function resolve(identity, caseNumber, body = {}) {
    const roles = requireRole(identity, 'case.resolve')
    onlyKeys(body, ['summary', 'code', 'learning', 'rootCause', 'version'], 'request')
    const version = expectedVersion(body.version)
    const summary = redactSensitive(text(body.summary, 'summary', { max: LIMITS.summary })).text
    const code = oneOf(body.code, RESOLUTION_CODES, 'code')
    const learning = validateLearning(body.learning)
    let rootCause = null
    if (body.rootCause !== undefined && body.rootCause !== null) {
      if (!SLUG.test(String(body.rootCause))) throw bad('invalid rootCause')
      rootCause = body.rootCause
    }
    const c = await loadCaseForStaff(caseNumber)
    const at = iso()
    const { previous, next } = await mutateCase(c.contactKey, c.caseId, (cur) => ({
      ...wf.applyTransition(cur, 'resolved', { actor: 'staff', at }),
      resolution: { summary, code, at, by: identity.email },
      rootCause: rootCause || cur.rootCause || null,
      learning: learning || cur.learning || null,
    }), 4, { expectVersion: version })
    await writeEvent({ caseRecord: next, kind: 'status_change', visibility: 'public', actor: staffActor(identity), body: summary, data: { from: previous.status, to: 'resolved' } })
    await audit({ contactKey: c.contactKey, action: 'support.case.resolve', actor: identity.email, detail: { caseNumber: c.caseNumber, code, rootCause } })
    let kbProposal = null
    if (learning?.docGap === true) {
      kbProposal = await proposeKb({ by: identity.email, title: `Help Center gap: ${next.category}${next.subcategory ? ` / ${next.subcategory}` : ''}`, reason: `Resolved case ${next.caseNumber} was marked as a documentation gap.`, sourceCaseNumbers: [next.caseNumber], origin: 'resolution' })
    }
    return forRoles(roles, { case: staffCaseView(next, now()), kbProposal })
  }

  async function createActionRequest(identity, caseNumber, body = {}) {
    const roles = requireRole(identity, 'action.request')
    onlyKeys(body, ['kind', 'reason'], 'request')
    const kind = oneOf(body.kind, ACTION_KINDS, 'kind')
    if (BILLING_ACTION_KINDS.includes(kind) && !can(roles, 'action.request.billing')) throw new HttpError(403, 'billing role required for this action request')
    const reason = redactSensitive(text(body.reason, 'reason', { max: LIMITS.reason })).text
    const c = await loadCaseForStaff(caseNumber)
    const requestId = newId('ar')
    const event = await writeEvent({ build: () => actionRequestEvent({ caseRecord: c, requestId, actionKind: kind, reason, requiredVerification: REQUIRED_VERIFICATION[kind], actor: staffActor(identity), at: iso() }) })
    await audit({ contactKey: c.contactKey, action: 'support.action_request.create', actor: identity.email, detail: { caseNumber: c.caseNumber, requestId, kind } })
    return forRoles(roles, actionRequestView(event))
  }

  const DECISION_RULES = {
    authorize: { permission: 'action.authorize', from: ['requested'], to: 'authorized' },
    reject: { permission: 'action.reject', from: ['requested', 'authorized'], to: 'rejected' },
    done_externally: { permission: 'action.record_done', from: ['authorized'], to: 'done_externally' },
  }

  // Records a person's decision. It NEVER performs the action: done_externally
  // means someone already did it in the authoritative system.
  async function decideActionRequest(identity, caseNumber, requestId, body = {}) {
    onlyKeys(body, ['decision', 'note'], 'request')
    const decision = oneOf(body.decision, ACTION_DECISIONS, 'decision')
    const rule = DECISION_RULES[decision]
    const roles = requireRole(identity, rule.permission)
    if (!/^ar_[a-f0-9]{16}$/.test(String(requestId || ''))) throw bad('invalid requestId')
    const note = text(body.note, 'note', { max: LIMITS.reason, required: decision === 'done_externally' })
    const c = await loadCaseForStaff(caseNumber)
    const req = await findActionRequest(c, requestId)
    if (!req) throw new HttpError(404, 'action request not found')
    if (!rule.from.includes(req.arStatus)) throw new HttpError(409, `cannot ${decision} a request that is ${req.arStatus}`, 'invalid_state')
    // Four-eyes: the person who asked for an action never authorizes it. With
    // only one lead/admin, their own requests stay `requested` until another
    // lead or admin exists (ARCHITECTURE §6).
    if (decision === 'authorize') {
      const requester = String(req.history?.[0]?.by || req.actor?.id || '').trim().toLowerCase()
      if (!requester || requester === String(identity.email || '').trim().toLowerCase()) {
        throw new HttpError(403, 'a different lead or admin must authorize this request (four-eyes rule)', 'four_eyes_required')
      }
    }
    const at = iso()
    const history = [...(req.history || []), { at, status: rule.to, by: identity.email, note: note ? redactSensitive(note).text : null }]
    let updated
    try {
      updated = await store.update(req.pk, req.sk, { arStatus: rule.to, history }, { expect: { arStatus: req.arStatus } })
    } catch (err) {
      if (isConflict(err)) throw new HttpError(409, 'the request changed at the same time; reload it')
      throw err
    }
    await audit({ contactKey: c.contactKey, action: `support.action_request.${decision}`, actor: identity.email, detail: { caseNumber: c.caseNumber, requestId, kind: req.actionKind, from: req.arStatus, to: rule.to } })
    return forRoles(roles, actionRequestView(updated))
  }

  // ---- incidents --------------------------------------------------------------------------
  async function listIncidentItems() {
    const items = await store.listContact(SUP_PK.INCIDENT)
    return items.filter((i) => i.type === SUPPORT_TYPES.INCIDENT).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
  }

  const incidentError = (err) => (err instanceof IncidentValidationError ? bad(err.message) : err)

  // Free-text incident fields are redacted before storage, on create and on
  // every PATCH/PUT, like every other free text in Support.
  const INCIDENT_TEXT_FIELDS = ['title', 'owner', 'workaround', 'internalNotes', 'customerUpdateDraft']
  function redactIncidentInput(input) {
    const out = { ...input }
    for (const field of INCIDENT_TEXT_FIELDS) if (typeof out[field] === 'string') out[field] = redactSensitive(out[field]).text
    return out
  }

  async function listIncidents(identity, { status = null } = {}) {
    const roles = requireRole(identity, 'incident.read')
    const list = await listIncidentItems()
    const linked = {}
    for (const c of await listAllCases()) if (c.refs?.incidentId) linked[c.refs.incidentId] = (linked[c.refs.incidentId] || 0) + 1
    return forRoles(roles, { incidents: list.filter((i) => !status || i.status === status).map((i) => ({ ...strip(i), linkedCaseCount: linked[i.incidentId] || 0 })) })
  }

  async function createIncident(identity, body = {}) {
    const roles = requireRole(identity, 'incident.write')
    let input
    try {
      input = redactIncidentInput(validateIncidentInput(body))
    } catch (err) {
      throw incidentError(err)
    }
    const at = iso()
    const incident = newIncident({ incidentId: newId('inc'), input, at, by: identity.email })
    await store.put(incidentItem(incident), { ifNotExists: true })
    await store.put(incidentEventItem({ incidentId: incident.incidentId, kind: 'update', body: 'Incident opened', data: { status: incident.status, severity: incident.severity }, at, by: identity.email }), { ifNotExists: true })
    await audit({ action: 'support.incident.create', actor: identity.email, detail: { incidentId: incident.incidentId, service: incident.service, severity: incident.severity } })
    return forRoles(roles, strip(incident))
  }

  async function getIncident(identity, incidentId) {
    const roles = requireRole(identity, 'incident.read')
    if (!INCIDENT_ID.test(String(incidentId || ''))) throw bad('invalid incident id')
    const items = await store.listContact(SUP_PK.INCIDENT)
    const incident = items.find((i) => i.sk === `INC#${incidentId}`)
    if (!incident) throw new HttpError(404, 'incident not found')
    const timeline = items.filter((i) => String(i.sk).startsWith(`INCEV#${incidentId}#`)).sort((a, b) => String(a.sk).localeCompare(String(b.sk))).map(strip)
    const linkedCases = (await listAllCases()).filter((c) => c.refs?.incidentId === incidentId).map((c) => ({ caseNumber: c.caseNumber, status: c.status, priority: c.priority, createdAt: c.createdAt }))
    return forRoles(roles, { incident: strip(incident), timeline, linkedCases })
  }

  async function updateIncident(identity, incidentId, body = {}) {
    const roles = requireRole(identity, 'incident.write')
    if (!INCIDENT_ID.test(String(incidentId || ''))) throw bad('invalid incident id')
    let patch
    try {
      patch = redactIncidentInput(validateIncidentInput(body, { partial: true }))
    } catch (err) {
      throw incidentError(err)
    }
    const current = await store.get(SUP_PK.INCIDENT, `INC#${incidentId}`)
    if (!current) throw new HttpError(404, 'incident not found')
    const at = iso()
    const next = incidentItem(patchIncident(strip(current), patch, { at, by: identity.email }))
    try {
      await store.put(next, { expectVersion: current.version })
    } catch (err) {
      if (isConflict(err)) throw new HttpError(409, 'the incident changed at the same time; reload it')
      throw err
    }
    if (patch.status && patch.status !== current.status) await store.put(incidentEventItem({ incidentId, kind: 'status_change', data: { from: current.status, to: patch.status }, at, by: identity.email }), { ifNotExists: true })
    if (patch.customerUpdateDraft !== undefined) await store.put(incidentEventItem({ incidentId, kind: 'customer_update_draft', body: patch.customerUpdateDraft, data: { published: false }, at, by: identity.email }), { ifNotExists: true })
    await audit({ action: 'support.incident.update', actor: identity.email, detail: { incidentId, fields: Object.keys(patch) } })
    return forRoles(roles, strip(next))
  }

  async function addIncidentTimeline(identity, incidentId, body = {}) {
    const roles = requireRole(identity, 'incident.write')
    if (!INCIDENT_ID.test(String(incidentId || ''))) throw bad('invalid incident id')
    onlyKeys(body, ['kind', 'text'], 'request')
    const kind = oneOf(body.kind ?? 'note', ['note', 'customer_update_draft'], 'kind')
    const t = redactSensitive(text(body.text, 'text', { max: 2000 })).text
    const current = await store.get(SUP_PK.INCIDENT, `INC#${incidentId}`)
    if (!current) throw new HttpError(404, 'incident not found')
    const at = iso()
    const event = incidentEventItem({ incidentId, kind, body: t, data: kind === 'customer_update_draft' ? { published: false } : null, at, by: identity.email })
    await store.put(event, { ifNotExists: true })
    if (kind === 'customer_update_draft') {
      const next = incidentItem(patchIncident(strip(current), { customerUpdateDraft: t }, { at, by: identity.email }))
      try {
        await store.put(next, { expectVersion: current.version })
      } catch (err) {
        if (isConflict(err)) throw new HttpError(409, 'the incident changed at the same time; reload it')
        throw err
      }
    }
    await audit({ action: 'support.incident.timeline', actor: identity.email, detail: { incidentId, kind, eventId: event.eventId } })
    return forRoles(roles, strip(event))
  }

  // ---- metrics -------------------------------------------------------------------------------
  async function metrics(identity, { from = null, to = null } = {}) {
    requireRole(identity, 'metrics.read')
    const toMs = to ? isoDate(to, 'to') : now()
    const fromMs = from ? isoDate(from, 'from') : toMs - 30 * DAY
    if (toMs < fromMs) throw bad('to must be after from')
    if (toMs - fromMs > 366 * DAY) throw bad('the window can be at most 366 days')
    const cases = await listAllCases()
    const contacts = [...new Set(cases.map((c) => c.contactKey))]
    const events = []
    for (const key of contacts) events.push(...(await store.listContact(pkFor(key))).filter((i) => i.type === SUPPORT_TYPES.CASE_EVENT))
    const incidents = await listIncidentItems()
    const activeMembers = await countActiveMembers()
    return computeSupportMetrics({ cases, events, incidents, activeMembers, from: new Date(fromMs).toISOString(), to: new Date(toMs).toISOString(), now: now() })
  }

  // ---- inbound email ---------------------------------------------------------------------
  // Only reads an owner lookup; handed to the email engine.
  async function lookupCaseForEmail(caseNumber) {
    if (!CASE_NUMBER.test(String(caseNumber || ''))) return null
    const ref = await lookupCaseNumber(caseNumber)
    if (!ref) return null
    const c = await loadCase(ref.contactKey, ref.caseId)
    return c ? { caseNumber: c.caseNumber, contactKey: c.contactKey, status: c.status } : null
  }

  async function accountExists(email) {
    try {
      const [user, profile, rows] = await Promise.all([
        ctx.tables?.getCognitoUserByEmail?.(email) ?? null,
        ctx.tables?.getProfile?.(email) ?? null,
        ctx.tables?.subscriptionsByEmail?.(email) ?? [],
      ])
      return Boolean(user || profile || (Array.isArray(rows) && rows.length))
    } catch {
      return false
    }
  }

  // ---- inbound email: threading lookups -----------------------------------------------
  // The plus-address secret comes from config support.emailTokenSecret (a
  // string of at least 32 bytes, or an async function returning one; index.mjs
  // resolves SUPPORT_EMAIL_TOKEN_SECRET_ARN into it). UNSET = token lookups
  // return null, so every plus-addressed reply falls back to References
  // threading or the unmatched review queue. Never guessed, never defaulted.
  async function emailTokenSecret() {
    const value = supportConfig().emailTokenSecret
    if (value === undefined || value === null || value === '') return null
    try {
      const secret = typeof value === 'function' ? await value() : value
      return typeof secret === 'string' && Buffer.byteLength(secret, 'utf8') >= 32 ? secret : null
    } catch (err) {
      log.warn?.('support_email_secret_unavailable', { error: err?.name || 'Error' })
      return null
    }
  }

  async function caseRefById(caseId) {
    const ref = await store.get(SUP_PK.CASEID, String(caseId || ''))
    if (!ref) return null
    const c = await loadCase(ref.contactKey, ref.caseId)
    return c ? { caseNumber: c.caseNumber, contactKey: c.contactKey, email: c.email, status: c.status } : null
  }

  // support+<caseId>.<hmac>@ -> the case, only when the HMAC verifies.
  async function caseByToken(token) {
    const secret = await emailTokenSecret()
    if (!secret) return null
    let parsed = null
    try {
      parsed = caseFromPlusAddress(token, secret)
    } catch {
      return null
    }
    return parsed ? caseRefById(parsed.caseId) : null
  }

  // In-Reply-To / References -> a Message-ID we sent. Empty until outbound
  // support email exists (staffReply's delivery.emailMessageId writes OUT#).
  async function caseByOutboundMessageId(id) {
    const hash = messageIdHash(id)
    if (!hash) return null
    const out = await store.get(SUP_PK.EMAIL, `OUT#${hash}`)
    return out ? caseRefById(out.caseId) : null
  }

  // ---- inbound email: claim-then-finalize dedupe ------------------------------------
  // The MID# marker is a claim ('processing') written before the message is
  // applied and finalized ('done') only after the apply succeeded. A failed
  // apply marks it 'failed' (a retry may reclaim it at once); a crash leaves
  // it 'processing', reclaimable after EMAIL_CLAIM_LEASE_MS. Each apply path
  // is also idempotent (the email_in event carries messageIdHash; the review
  // item id derives from it), so a reclaimed retry never double-applies.
  function markerBlocks(marker, t) {
    if (!marker) return false
    if (marker.state === 'failed') return false
    if (marker.state === 'processing') return t - Date.parse(marker.claimedAt || '') < EMAIL_CLAIM_LEASE_MS
    return true // 'done', or a marker written before claims existed
  }

  async function claimEmail(d) {
    const at = iso()
    try {
      await store.put(emailMarkerItem({ messageIdHash: d.messageIdHash, providerMessageId: d.providerMessageId || null, at }), { ifNotExists: true })
      return { claimed: true, firstSeenAt: at }
    } catch (err) {
      if (!isConflict(err)) throw err
    }
    const existing = await store.get(SUP_PK.EMAIL, `MID#${d.messageIdHash}`)
    if (!existing || markerBlocks(existing, now())) return { claimed: false }
    try {
      await store.update(SUP_PK.EMAIL, `MID#${d.messageIdHash}`, { state: 'processing', claimedAt: at, reclaimedFrom: existing.state || null }, { expect: { claimedAt: existing.claimedAt ?? null } })
    } catch (err) {
      if (isConflict(err)) return { claimed: false }
      throw err
    }
    await audit({ action: 'support.email.reclaimed', actor: 'system', detail: { from: existing.state || null } })
    return { claimed: true, firstSeenAt: existing.firstSeenAt || existing.createdAt || at, reclaimed: true }
  }

  async function appliedEmailEvent(contactKey, hash) {
    const items = await store.listContact(pkFor(contactKey))
    return items.find((i) => i.type === SUPPORT_TYPES.CASE_EVENT && i.data?.messageIdHash === hash) || null
  }

  async function recordUnmatched(d, reason, claim) {
    const at = claim?.firstSeenAt || iso()
    const id = `um_${d.messageIdHash.slice(0, 16)}`
    const r = redactSensitive(String(d.text || ''))
    const item = unmatchedEmailItem({
      id,
      at,
      senderEmail: String(d.sender?.email || '').trim().toLowerCase() || null,
      senderVerified: d.sender?.verified === true,
      subject: clip(redactSensitive(String(d.subject || '')).text, 200),
      text: clip(r.text, LIMITS.caseText),
      reason,
      suggestedContactKey: CONTACT_KEY.test(String(d.match?.contactKey || '')) ? d.match.contactKey : null,
      suggestedCaseNumber: CASE_NUMBER.test(String(d.match?.caseNumber || '')) ? d.match.caseNumber : null,
      messageIdHash: d.messageIdHash,
      redactions: r.redactions,
    })
    try {
      await store.put(item, { ifNotExists: true })
    } catch (err) {
      if (!isConflict(err)) throw err
      return { status: 'unmatched', id, reason } // recorded by an earlier attempt
    }
    await audit({ action: 'support.email.unmatched', actor: 'system', detail: { id, reason } })
    return { status: 'unmatched', id, reason }
  }

  // Applies the email engine's decision. Uncertain matches are NEVER attached:
  // attach/new_case require a verified sender, a `certain` match and an owner
  // check against the stored case/contact; anything else goes to review.
  async function applyInboundEmailDecision(decision) {
    const d = decision && typeof decision === 'object' ? decision : {}
    const action = ['attach', 'new_case', 'unmatched', 'ignore'].includes(d.action) ? d.action : 'unmatched'
    if (!HASH.test(String(d.messageIdHash || ''))) throw bad('decision.messageIdHash must be a sha256 hex digest')
    const claim = await claimEmail(d)
    if (!claim.claimed) return { status: 'duplicate' }
    let result
    try {
      result = await applyClaimedEmail(d, action, claim)
    } catch (err) {
      await store.update(SUP_PK.EMAIL, `MID#${d.messageIdHash}`, { state: 'failed', failedAt: iso() }).catch((e) => log.warn?.('support_email_mark_failed', { error: e?.name }))
      throw err
    }
    await store.update(SUP_PK.EMAIL, `MID#${d.messageIdHash}`, { state: 'done', outcome: result.status, finishedAt: iso(), ...(result.caseNumber ? { caseNumber: result.caseNumber } : {}) })
    return result
  }

  async function applyClaimedEmail(d, action, claim) {
    if (action === 'ignore' || d.automated === true) {
      await audit({ action: 'support.email.ignored', actor: 'system', detail: { reason: String(d.reason || (d.automated ? 'automated' : 'ignored')).slice(0, 80) } })
      return { status: 'ignored', reason: d.reason || (d.automated ? 'automated' : 'ignored') }
    }
    if (action === 'unmatched') return recordUnmatched(d, String(d.reason || 'unmatched').slice(0, 80), claim)

    const senderEmail = String(d.sender?.email || '').trim().toLowerCase()
    if (!EMAIL.test(senderEmail)) return recordUnmatched(d, 'invalid_sender', claim)
    if (d.sender?.verified !== true) return recordUnmatched(d, 'unverified_sender', claim)
    if (d.match?.confidence !== 'certain') return recordUnmatched(d, 'uncertain_match', claim)
    const senderKey = keyFor(senderEmail)
    if (d.match?.contactKey && d.match.contactKey !== senderKey) return recordUnmatched(d, 'contact_mismatch', claim)
    const raw = stripInvisible(String(d.text || '')).trim()
    if (!raw) return recordUnmatched(d, 'empty_body', claim)

    // Idempotency: an earlier attempt that got as far as the case event
    // already applied this message.
    const prior = await appliedEmailEvent(senderKey, d.messageIdHash)
    if (prior) return { status: action === 'attach' ? 'attached' : 'new_case', caseNumber: prior.caseNumber, eventId: prior.eventId, replayed: true }

    const emailData = { subject: clip(redactSensitive(String(d.subject || '')).text, 200), providerMessageId: d.providerMessageId || null, messageIdHash: d.messageIdHash }
    if (action === 'attach') {
      const ref = CASE_NUMBER.test(String(d.match?.caseNumber || '')) ? await lookupCaseNumber(d.match.caseNumber) : null
      if (!ref) return recordUnmatched(d, 'case_not_found', claim)
      if (ref.contactKey !== senderKey) return recordUnmatched(d, 'case_owner_mismatch', claim)
      const c = await loadCase(ref.contactKey, ref.caseId)
      if (!c) return recordUnmatched(d, 'case_not_found', claim)
      // Attached email is metered like a portal message (one shared daily
      // budget); a reply that opens a linked case also needs a case slot.
      // Over the limit, the email waits in the review queue instead.
      try {
        const items = await store.listContact(pkFor(senderKey))
        assertMessageRate(items)
        const linked = wf.decidePlayerReply(c, now()).action === 'new_linked_case'
        if (linked) assertCaseRate(items)
        await claimRateSlots(senderKey, linked ? ['case', 'msg'] : ['msg'], items)
      } catch (err) {
        if (err instanceof HttpError && err.statusCode === 429) return recordUnmatched(d, 'rate_limited', claim)
        throw err
      }
      const result = await applyPlayerReply({ caseRecord: c, rawText: clip(raw, LIMITS.caseText), actor: { kind: 'player', id: senderEmail }, kind: 'email_in', data: emailData, source: 'email' })
      return result.linkedCase ? { status: 'new_linked_case', caseNumber: result.linkedCase.caseNumber, linkedFrom: c.caseNumber } : { status: 'attached', caseNumber: c.caseNumber, eventId: result.event.eventId }
    }

    // new_case
    if (!(await accountExists(senderEmail))) return recordUnmatched(d, 'no_account', claim)
    const items = await store.listContact(pkFor(senderKey))
    try {
      assertCaseRate(items)
      assertMessageRate(items)
      await claimRateSlots(senderKey, ['case', 'msg'], items)
    } catch (err) {
      if (err instanceof HttpError && err.statusCode === 429) return recordUnmatched(d, 'rate_limited', claim)
      throw err
    }
    const record = await openCase({ contactKey: senderKey, email: senderEmail, rawText: clip(raw, LIMITS.caseText), source: 'email', createdBy: 'system:email', openingKind: 'email_in', openingActor: { kind: 'player', id: senderEmail }, extraEventData: emailData })
    return { status: 'new_case', caseNumber: record.caseNumber }
  }

  // decideInboundEmail({ raw, verdicts, lookups, now, providerMessageId }).
  // The lookups are read-only functions; the engine returns an `outcome`
  // that decisionFromEngine() maps onto applyInboundEmailDecision().
  async function ingestInboundEmail({ raw, verdicts = null, providerMessageId = null } = {}) {
    const lookups = {
      seenMessageIdHash: async (h) => (HASH.test(String(h || '')) ? markerBlocks(await store.get(SUP_PK.EMAIL, `MID#${h}`), now()) : false),
      caseByToken,
      caseByOutboundMessageId,
      contactByEmail: async (email) => {
        const e = String(email || '').trim().toLowerCase()
        return EMAIL.test(e) && (await accountExists(e)) ? keyFor(e) : null
      },
    }
    let out
    try {
      out = typeof engines.decideInboundEmail === 'function' ? await engines.decideInboundEmail({ raw, verdicts, lookups, now: now(), providerMessageId }) : null
    } catch (err) {
      log.warn?.('support_engine_failed', { engine: 'decideInboundEmail', error: err?.name || 'Error' })
      out = null
    }
    const decision = decisionFromEngine(out)
    if (!decision) return { status: 'rejected', reason: out?.reason || 'email_engine_not_available' }
    return applyInboundEmailDecision(decision)
  }

  async function listUnmatchedEmail(identity, { status = 'open' } = {}) {
    const roles = requireRole(identity, 'email.unmatched.read')
    const items = await store.listContact(SUP_PK.EMAIL)
    return forRoles(roles, {
      items: items
        .filter((i) => i.type === SUPPORT_TYPES.UNMATCHED_EMAIL && (!status || i.status === status))
        .sort((a, b) => String(b.receivedAt).localeCompare(String(a.receivedAt)))
        .map(strip),
    })
  }

  // Staff decide which case an unmatched email belongs to. The email is added
  // as a STAFF-ONLY event: its sender was never verified, so its text is not
  // shown to the player as their own message.
  async function assignUnmatched(identity, id, body = {}) {
    const roles = requireRole(identity, 'email.unmatched.assign')
    onlyKeys(body, ['caseNumber'], 'request')
    if (!/^um_[a-f0-9]{16}$/.test(String(id || ''))) throw bad('invalid unmatched email id')
    const caseNumber = assertCaseNumber(body.caseNumber)
    const items = await store.listContact(SUP_PK.EMAIL)
    const item = items.find((i) => i.type === SUPPORT_TYPES.UNMATCHED_EMAIL && i.id === id)
    if (!item) throw new HttpError(404, 'unmatched email not found')
    if (item.status !== 'open') throw new HttpError(409, 'this email was already handled')
    const c = await loadCaseForStaff(caseNumber)
    try {
      await store.update(item.pk, item.sk, { status: 'assigned', assignedCaseNumber: caseNumber, assignedBy: identity.email, assignedAt: iso() }, { expect: { status: 'open' } })
    } catch (err) {
      if (isConflict(err)) throw new HttpError(409, 'this email was already handled')
      throw err
    }
    const event = await writeEvent({ caseRecord: c, kind: 'email_in', visibility: 'staff', actor: staffActor(identity), body: item.text, data: { assignedFromUnmatched: id, senderVerified: item.senderVerified, subject: item.subject } })
    await audit({ contactKey: c.contactKey, action: 'support.email.assign_unmatched', actor: identity.email, detail: { id, caseNumber } })
    return forRoles(roles, { ok: true, caseNumber, eventId: event.eventId })
  }

  // ---- proactive care ---------------------------------------------------------------------
  // Accepts the proactive engine's findings ({ ruleId, contactKey, dedupeKey
  // '<rule>#<contactKey>#<week>', category, severity, summary, evidence,
  // kind: 'incident_suggestion' }) and simple { ruleId, email, window } ones.
  // The dedupe window must be the ISO week of `now` ("2026-W39"): anything
  // else (a run id, another week, a free-form string) would let every run
  // create a new case, so such a finding is skipped. A finding without a
  // window gets the current week.
  const ISO_WEEK = /^\d{4}-W\d{2}$/
  function normalizeFinding(f, emailFor = new Map(), week = isoWeek(now())) {
    if (!f || typeof f !== 'object') return null
    const ruleId = String(f.ruleId || '')
    if (!SLUG.test(ruleId)) return null
    if (f.scope === 'global' || f.kind === 'incident_suggestion' || String(f.contactKey || '').startsWith('global:')) {
      return { scope: 'global', ruleId, service: f.service || null, category: f.category || null, summary: clip(summaryText(f.summary) || f.subject || ruleId, 200), evidence: clone(f.evidence || []) }
    }
    let email = String(f.email || '').trim().toLowerCase()
    const contactKey = email ? keyFor(email) : String(f.contactKey || '')
    if (!email && CONTACT_KEY.test(contactKey)) email = emailFor.get(contactKey) || ''
    if (!EMAIL.test(email) || !CONTACT_KEY.test(contactKey) || keyFor(email) !== contactKey) return null
    if (f.contactKey && f.contactKey !== contactKey) return null
    const window = String(f.window || (f.dedupeKey ? String(f.dedupeKey).split('#').pop() : '') || week)
    if (!ISO_WEEK.test(window) || window !== week) return null
    const summary = summaryText(f.summary) || f.subject || ruleId
    const evidence = clone(Array.isArray(f.evidence) ? f.evidence : [])
    const evidenceLines = evidence.map((e) => (e && typeof e === 'object' ? [e.label, e.value, e.source ? `(${e.source})` : null].filter(Boolean).join(': ') : null)).filter(Boolean)
    return {
      scope: 'player',
      ruleId,
      email,
      contactKey,
      window,
      category: CATEGORIES.includes(f.category) ? f.category : 'other',
      severity: SEVERITIES.includes(f.severity) ? f.severity : null,
      subject: clip(f.subject || summary, 120),
      description: clip(f.description || [summary, ...evidenceLines].join('\n'), 2000),
      evidence,
    }
  }

  // Dry run by default: a dry run only reads (no marker, no case, no audit).
  // Creates flagged cases (source proactive, status new, hidden from the
  // player) only when dryRun is false AND the flag is on. Never messages the
  // player. The case stores player-safe copy (PROACTIVE_PLAYER_COPY) as its
  // subject and description; the finding's evidence goes into the opening
  // `system` event, which is staff-only.
  async function recordProactive(identity, findings = [], { dryRun = true, emailFor = new Map() } = {}) {
    requireRole(identity, 'proactive.run')
    if (!dryRun && supportConfig().proactive !== true) throw new HttpError(409, 'proactive case creation is disabled (support.proactive is off)', 'proactive_disabled')
    const out = { dryRun, week: isoWeek(now()), created: [], duplicates: [], wouldCreate: [], skipped: 0, incidentSuggestions: [] }
    for (const raw of Array.isArray(findings) ? findings : []) {
      const f = normalizeFinding(raw, emailFor, out.week)
      if (!f) {
        out.skipped += 1
        continue
      }
      if (f.scope === 'global') {
        out.incidentSuggestions.push(f)
        continue
      }
      const marker = proactiveMarkerItem({ ruleId: f.ruleId, contactKey: f.contactKey, window: f.window, at: iso() })
      const key = `${f.ruleId}#${f.contactKey}#${f.window}`
      if (dryRun) {
        const exists = await store.get(marker.pk, marker.sk)
        ;(exists ? out.duplicates : out.wouldCreate).push({ key, ruleId: f.ruleId, contactKey: f.contactKey, window: f.window, category: f.category, subject: f.subject })
        continue
      }
      try {
        await store.put(marker, { ifNotExists: true })
      } catch (err) {
        if (!isConflict(err)) throw err
        out.duplicates.push({ key, ruleId: f.ruleId, contactKey: f.contactKey, window: f.window })
        continue
      }
      const copy = proactivePlayerCopy(f.ruleId)
      const record = await openCase({
        contactKey: f.contactKey,
        email: f.email,
        rawText: copy.description,
        subject: copy.subject,
        openingText: `${f.subject}\n${f.description}`,
        extra: { playerSafe: true, proactive: { ruleId: f.ruleId, window: f.window } },
        category: f.category,
        source: 'proactive',
        createdBy: `system:proactive:${identity.email}`,
        playerVisible: false,
        openingKind: 'system',
        extraEventData: { ruleId: f.ruleId, window: f.window, evidence: f.evidence },
      })
      await store.update(marker.pk, marker.sk, { caseNumber: record.caseNumber })
      out.created.push({ key, caseNumber: record.caseNumber, ruleId: f.ruleId })
    }
    if (!dryRun) await audit({ action: 'support.proactive.run', actor: identity.email, detail: { created: out.created.length, duplicates: out.duplicates.length, skipped: out.skipped, incidentSuggestions: out.incidentSuggestions.length } })
    return out
  }

  async function runProactive(identity, { dryRun = true } = {}) {
    requireRole(identity, 'proactive.run')
    let entries = []
    try {
      entries = await directoryEntries()
    } catch (err) {
      throw new HttpError(503, 'player directory unavailable; nothing was evaluated')
    }
    // evaluateProactive({ contacts, now, existingMarkers, providerHealth })
    // -> findings[]. Markers are the SUP#PROACTIVE sort keys. Each contact
    // carries its raw sources (`one`: billing rows, profile, bookings,
    // player events, Cognito user) so the identity-binding and paid-package
    // rules run on real rows instead of the facts-only fallback. Provider
    // health is the newest observation per provider (global findings only).
    const markers = (await store.listContact(SUP_PK.PROACTIVE)).filter((i) => i.type === SUPPORT_TYPES.PROACTIVE).map((i) => i.sk)
    const contacts = entries.map((e) => ({ contactKey: e.contactKey, email: e.email, one: { identity: e.one.identity, sources: e.one.sources, cognitoUser: e.one.cognitoUser || null }, facts: e.facts, lifecycle: e.lifecycle }))
    let providerHealth = []
    let providerHealthStatus = 'not_connected'
    if (typeof ctx.tables?.providerHealth === 'function') {
      try {
        providerHealth = (await ctx.tables.providerHealth()) || []
        providerHealthStatus = 'ok'
      } catch (err) {
        providerHealthStatus = 'unavailable'
        log.warn?.('support_provider_health_unavailable', { error: err?.name || 'Error' })
      }
    }
    const out = await runEngine('evaluateProactive', [{ contacts, now: now(), existingMarkers: markers, providerHealth }], { status: 'not_available', findings: [] })
    const findings = Array.isArray(out) ? out : out?.findings || []
    const emailFor = new Map(entries.map((e) => [e.contactKey, e.email]))
    return { engineStatus: Array.isArray(out) ? 'ok' : out?.status || 'ok', providerHealthStatus, evaluatedContacts: contacts.length, ...(await recordProactive(identity, findings, { dryRun, emailFor })) }
  }

  // ---- maintenance: auto-close resolved cases ------------------------------------------
  // A resolved case with no activity for AUTO_CLOSE_AFTER_MS (7 days) closes
  // (workflow.dueForAutoClose). Dry run by default: it lists what would
  // close. A real run moves each case resolved -> closed as the SYSTEM actor,
  // writes a public status event and a per-case audit, and never messages
  // the player. Safe to re-run: a case already closed is not due.
  async function autoCloseResolved({ now: at = now(), dryRun = true, actor = 'system' } = {}) {
    const due = (await listAllCases()).filter((c) => wf.dueForAutoClose(c, at))
    const out = { dryRun, checkedAt: new Date(at).toISOString(), due: due.map((c) => ({ caseNumber: c.caseNumber, resolvedAt: c.resolvedAt })), closed: [], skipped: [] }
    if (dryRun) return out
    for (const c of due) {
      try {
        const stamp = new Date(at).toISOString()
        const { previous, next, changed } = await mutateCase(c.contactKey, c.caseId, (cur) => (wf.dueForAutoClose(cur, at) ? wf.applyTransition(cur, 'closed', { actor: 'system', at: stamp }) : cur))
        if (!changed) {
          out.skipped.push({ caseNumber: c.caseNumber, reason: 'no_longer_due' })
          continue
        }
        await writeEvent({ caseRecord: next, kind: 'status_change', visibility: 'public', actor: SYSTEM, data: { from: previous.status, to: 'closed', rule: 'auto_close_after_resolve' } })
        await audit({ contactKey: c.contactKey, action: 'support.case.auto_close', actor, detail: { caseNumber: c.caseNumber, resolvedAt: previous.resolvedAt } })
        out.closed.push(c.caseNumber)
      } catch (err) {
        if (!(err instanceof HttpError)) throw err
        out.skipped.push({ caseNumber: c.caseNumber, reason: err.code || 'changed' })
      }
    }
    return out
  }

  // Lead/admin route wrapper: role check + one audit for the whole run.
  async function runAutoClose(identity, { dryRun = true } = {}) {
    requireRole(identity, 'maintenance.run')
    const out = await autoCloseResolved({ dryRun, actor: identity.email })
    await audit({ action: dryRun ? 'support.maintenance.auto_close.dry_run' : 'support.maintenance.auto_close', actor: identity.email, detail: { due: out.due.length, closed: out.closed.length, skipped: out.skipped.length } })
    return out
  }

  // ---- Help Center proposals ---------------------------------------------------------------
  async function proposeKb({ by, title, body = null, reason, sourceCaseNumbers = [], origin }) {
    const item = kbProposalItem({ id: newId('kbp'), at: iso(), by, title: clip(title, 160), body: body ? clip(redactSensitive(body).text, 4000) : null, reason: clip(reason, 1000), sourceCaseNumbers: sourceCaseNumbers.filter((n) => CASE_NUMBER.test(n)), origin })
    await store.put(item, { ifNotExists: true })
    await audit({ action: 'support.kb.propose', actor: by, detail: { id: item.id, origin } })
    return strip(item)
  }

  // Stored proposals (resolution doc gaps), plus proposals COMPUTED on read
  // from case trends (help/search.mjs proposeArticlesFromCases): 3+ cases in
  // a category, or any doc-gap flag. Trend proposals are never stored or
  // published; a person decides whether an article gets written.
  async function listKbProposals(identity, { status = null } = {}) {
    const roles = requireRole(identity, 'kb.read')
    const items = await store.listContact(SUP_PK.KBPROP)
    const cases = (await listAllCases()).map((c) => ({ caseId: c.caseId, caseNumber: c.caseNumber, category: c.category, rootCause: c.rootCause || null, learning: c.learning ? { docGap: c.learning.docGap === true } : null }))
    const trends = await runEngine('proposeArticles', [cases], [])
    return forRoles(roles, {
      proposals: items.filter((i) => i.type === SUPPORT_TYPES.KB_PROPOSAL && (!status || i.status === status)).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).map(strip),
      trendProposals: (Array.isArray(trends) ? trends : []).map((t) => ({ ...clone(t), origin: 'case_trends', stored: false, publish: false })),
    })
  }

  async function decideKbProposal(identity, id, body = {}) {
    const roles = requireRole(identity, 'kb.decide')
    onlyKeys(body, ['decision', 'note'], 'request')
    if (!/^kbp_[a-f0-9]{16}$/.test(String(id || ''))) throw bad('invalid proposal id')
    const decision = oneOf(body.decision, ['accept', 'reject'], 'decision')
    const rawNote = text(body.note, 'note', { max: LIMITS.reason, required: false })
    const note = rawNote === null ? null : redactSensitive(rawNote).text
    const items = await store.listContact(SUP_PK.KBPROP)
    const item = items.find((i) => i.type === SUPPORT_TYPES.KB_PROPOSAL && i.id === id)
    if (!item) throw new HttpError(404, 'proposal not found')
    let updated
    try {
      // Accepting never publishes: a person writes and reviews the article.
      updated = await store.update(item.pk, item.sk, { status: decision === 'accept' ? 'accepted' : 'rejected', published: false, decidedAt: iso(), decidedBy: identity.email, decisionNote: note }, { expect: { status: 'proposed' } })
    } catch (err) {
      if (isConflict(err)) throw new HttpError(409, 'this proposal was already decided')
      throw err
    }
    await audit({ action: `support.kb.${decision}`, actor: identity.email, detail: { id } })
    return forRoles(roles, strip(updated))
  }

  // ---- Help Center (public, reviewed only) ---------------------------------------------------
  // Reviewed articles only. The ONE exception is a dev-only engines override
  // that sets `helpPreview: true` (scripts/support/generate-fixtures.mjs, for
  // screenshots): drafts then pass and every response says `preview: true`.
  // The production engines module (engines.mjs) never sets it.
  const helpPreview = engines.helpPreview === true
  function servable(a) {
    if (!a || typeof a !== 'object') return false
    if (a.status === undefined || a.status === 'reviewed') return true
    return helpPreview && a.status === 'draft'
  }
  function reviewedOnly(list) {
    return (Array.isArray(list) ? list : []).filter(servable).map((a) => clone(a))
  }

  // No query: the Help Center home lists every servable article (summaries).
  async function searchHelpArticles({ q = '' } = {}) {
    const query = String(q || '').trim().slice(0, 200)
    const out = query
      ? await runEngine('searchHelp', [query, { limit: 10 }], { status: 'not_available', articles: [] })
      : await runEngine('listArticles', [{}], { status: 'not_available', articles: [] })
    const articles = reviewedOnly(Array.isArray(out) ? out : out?.articles)
    return { q: query, articles, status: Array.isArray(out) ? 'ok' : out?.status || 'ok', ...(helpPreview ? { preview: true } : {}) }
  }

  async function getHelpArticle(slug) {
    if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(String(slug || ''))) throw bad('invalid article slug')
    const article = await runEngine('getArticle', [slug], null)
    if (!article || typeof article !== 'object' || article.status === 'error' || !servable(article)) throw new HttpError(404, 'article not found')
    return { ...clone(article), ...(helpPreview ? { preview: true } : {}) }
  }

  return {
    // player
    triage,
    createCase,
    listMyCases,
    getMyCase,
    addPlayerMessage,
    requestAttachmentUpload,
    confirmResolved,
    reopen,
    submitCsat,
    // staff
    queue,
    getCaseForStaff,
    staffReply,
    addPrivateNote,
    setStatus,
    assign,
    escalate,
    linkIncident,
    resolve,
    createActionRequest,
    decideActionRequest,
    listIncidents,
    createIncident,
    getIncident,
    updateIncident,
    addIncidentTimeline,
    metrics,
    applyInboundEmailDecision,
    ingestInboundEmail,
    lookupCaseForEmail,
    listUnmatchedEmail,
    assignUnmatched,
    recordProactive,
    runProactive,
    autoCloseResolved,
    runAutoClose,
    listKbProposals,
    decideKbProposal,
    proposeKb,
    // public
    searchHelpArticles,
    getHelpArticle,
    // helpers for routes
    rolesFor,
    isStaffIdentity: (identity) => isStaff(rolesFor(identity)),
  }
}
