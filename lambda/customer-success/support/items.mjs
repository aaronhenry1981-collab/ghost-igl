// Support item layouts in the customer-success single table
// (docs/player-success/ARCHITECTURE.md §3). Same table, same pk/sk/gsi1
// conventions as data/items.mjs; PR #24 readers ignore these types
// (csSourceFromItems only picks its own types), so nothing here changes the
// existing home/CRM projections.
//
//   pk                 sk                                    item
//   C#<contactKey>     CASE#<caseId>                         case (version = optimistic concurrency)
//   C#<contactKey>     CEV#<caseId>#<iso>#<seq><rand>        case event (incl. action requests)
//   C#<contactKey>     ATT#<caseId>#<attId>                  attachment manifest (never the bytes)
//   C#<contactKey>     AUDIT#<iso>#<seq><rand>               audit (PR #24 AUDIT type, unique suffix)
//   C#<contactKey>     IDEM#support_*#<clientRequestId>      idempotency marker (PR #24 builder; message
//                                                            markers are scoped by case: support_msg_<caseId>)
//   C#<contactKey>     SUP#RATE#<kind>#<yyyy-mm-dd>#<slot>   daily rate-limit slot (claimed with a conditional put)
//   SUP#COUNTER        CASENO                                case-number counter
//   SUP#CASENO         R6-000123                             case number -> {contactKey, caseId}
//   SUP#CASEID         <caseId>                              case id -> {contactKey, caseNumber} (email plus-token threading)
//   SUP#INCIDENT       INC#<id> / INCEV#<id>#<iso>#<seq>     incident + timeline
//   SUP#EMAIL          MID#<sha256> / UNMATCHED#<iso>#<id>   inbound claim-then-finalize marker / review queue
//   SUP#EMAIL          OUT#<sha256>                          outbound Message-ID -> case (References threading)
//   SUP#PROACTIVE      PRO#<ruleId>#<contactKey>#<window>    proactive dedupe marker
//   SUP#KBPROP         KBP#<iso>#<id>                        Help Center proposal (never published)
//   SUP#AUDIT          AUDIT#<iso>#<seq><rand>               audit for non-player writes

import { randomBytes, randomUUID } from 'node:crypto'
import { ITEM_TYPES, idempotencyItem, pkFor } from '../data/items.mjs'

export { idempotencyItem, pkFor }

export const SUPPORT_TYPES = Object.freeze({
  CASE: 'CASE',
  CASE_EVENT: 'CEV',
  ATTACHMENT: 'ATT',
  INCIDENT: 'INCIDENT',
  INCIDENT_EVENT: 'INCEV',
  COUNTER: 'SUP_COUNTER',
  CASENO: 'SUP_CASENO',
  CASEID: 'SUP_CASEID',
  EMAIL_OUTBOUND: 'SUP_EMAIL_OUT',
  EMAIL_MARKER: 'SUP_EMAIL_MID',
  UNMATCHED_EMAIL: 'SUP_UNMATCHED',
  PROACTIVE: 'SUP_PROACTIVE',
  KB_PROPOSAL: 'SUP_KBPROP',
  RATE: 'SUP_RATE',
})

export const SUP_PK = Object.freeze({
  COUNTER: 'SUP#COUNTER',
  CASENO: 'SUP#CASENO',
  CASEID: 'SUP#CASEID',
  INCIDENT: 'SUP#INCIDENT',
  EMAIL: 'SUP#EMAIL',
  PROACTIVE: 'SUP#PROACTIVE',
  KBPROP: 'SUP#KBPROP',
  AUDIT: 'SUP#AUDIT',
})

// Categories a case can carry. MUST stay equal to the keys of
// support/classify.mjs CATEGORIES (the classifier owns the vocabulary; this
// copy exists so the core validates input without importing an engine).
// Anything the classifier returns outside this list becomes `other`.
export const CATEGORIES = Object.freeze([
  'account_login',
  'email_verification',
  'subscription',
  'access_entitlement',
  'billing_question',
  'cancellation',
  'coaching_credits',
  'coaching_session',
  'vod_upload',
  'replay_upload',
  'vod_analysis',
  'ai_result',
  'ubisoft_connection',
  'psn_connection',
  'xbox_connection',
  'trn_data',
  'rank_stat_discrepancy',
  'historical_data',
  'desktop_client',
  'bug',
  'performance',
  'feature_request',
  'safety_report',
  'other',
])

// Category groups used by queue views and metrics.
export const CATEGORY_GROUPS = Object.freeze({
  billing: Object.freeze(['subscription', 'access_entitlement', 'billing_question', 'cancellation']),
  entitlement: Object.freeze(['access_entitlement', 'subscription', 'billing_question']),
  identity: Object.freeze(['account_login', 'email_verification', 'ubisoft_connection', 'psn_connection', 'xbox_connection', 'trn_data']),
  provider: Object.freeze(['ubisoft_connection', 'psn_connection', 'xbox_connection', 'trn_data', 'rank_stat_discrepancy', 'historical_data']),
  vod: Object.freeze(['vod_upload', 'vod_analysis', 'ai_result', 'replay_upload']),
  coaching: Object.freeze(['coaching_credits', 'coaching_session']),
  bugs: Object.freeze(['bug', 'performance', 'desktop_client']),
})

// Fallback routing when the classifier's categoryInfo is not available
// (mirrors the classify.mjs table: team, priority, severity).
export const CATEGORY_DEFAULTS = Object.freeze({
  account_login: ['support', 'p2', 'sev3'],
  email_verification: ['support', 'p2', 'sev3'],
  subscription: ['billing', 'p3', 'sev4'],
  access_entitlement: ['billing', 'p1', 'sev2'],
  billing_question: ['billing', 'p2', 'sev3'],
  cancellation: ['billing', 'p2', 'sev3'],
  coaching_credits: ['coaching', 'p2', 'sev3'],
  coaching_session: ['coaching', 'p2', 'sev3'],
  vod_upload: ['vod_ai', 'p2', 'sev3'],
  replay_upload: ['support', 'p4', 'sev4'],
  vod_analysis: ['vod_ai', 'p2', 'sev3'],
  ai_result: ['vod_ai', 'p3', 'sev4'],
  ubisoft_connection: ['player_data', 'p3', 'sev4'],
  psn_connection: ['player_data', 'p3', 'sev4'],
  xbox_connection: ['player_data', 'p3', 'sev4'],
  trn_data: ['player_data', 'p3', 'sev4'],
  rank_stat_discrepancy: ['player_data', 'p3', 'sev4'],
  historical_data: ['player_data', 'p3', 'sev4'],
  desktop_client: ['support', 'p3', 'sev3'],
  bug: ['support', 'p3', 'sev3'],
  performance: ['support', 'p3', 'sev4'],
  feature_request: ['support', 'p4', 'sev4'],
  safety_report: ['security', 'p1', 'sev2'],
  other: ['support', 'p3', 'sev4'],
})
export const INTENTS = Object.freeze(['broken', 'how_to', 'value'])
export const SOURCES = Object.freeze(['portal', 'email', 'proactive', 'staff'])
export const SEVERITIES = Object.freeze(['sev1', 'sev2', 'sev3', 'sev4'])
export const TEAMS = Object.freeze(['support', 'billing', 'player_data', 'vod_ai', 'coaching', 'security', 'leadership'])
export const RESOLUTION_CODES = Object.freeze(['fixed', 'answered', 'workaround', 'duplicate', 'known_issue', 'external_action', 'not_reproducible', 'by_design', 'no_response', 'other'])
export const BILLING_CATEGORIES = CATEGORY_GROUPS.billing

export const EVENT_KINDS = Object.freeze([
  'message_player',
  'message_staff',
  'note_private',
  'status_change',
  'assignment',
  'escalation',
  'incident_link',
  'system',
  'csat',
  'attachment',
  'email_in',
  'action_request',
])
// Never visible to a player, whatever the caller asked for.
export const STAFF_ONLY_KINDS = Object.freeze(['note_private', 'assignment', 'escalation', 'incident_link', 'action_request'])

export const CASE_NUMBER = /^R6-\d{6}$/
export const formatCaseNumber = (n) => `R6-${String(n).padStart(6, '0')}`

// ---- unique suffixes ----------------------------------------------------------
// A process-wide monotonic sequence plus a random suffix: two writes in the
// same millisecond (same process or not) never produce the same sort key.
let seq = 0
export function uniqueSuffix() {
  seq = (seq + 1) % 36 ** 6
  return `${seq.toString(36).padStart(6, '0')}${randomBytes(4).toString('hex')}`
}

export const newCaseId = () => randomUUID()
export const newId = (prefix) => `${prefix}_${randomBytes(8).toString('hex')}`

// ---- cases ---------------------------------------------------------------------
export function caseItem({
  caseId,
  caseNumber,
  contactKey,
  email,
  reconPlayerId = null,
  product = 'r6',
  category,
  subcategory = null,
  intent = null,
  source,
  subject,
  description,
  priority,
  severity,
  team = 'support',
  refs = {},
  sla,
  classification = null,
  redactions = [],
  linkedFromCaseNumber = null,
  playerVisible = true,
  tags = [],
  createdBy,
  at,
}) {
  return {
    pk: pkFor(contactKey),
    sk: `${SUPPORT_TYPES.CASE}#${caseId}`,
    type: SUPPORT_TYPES.CASE,
    caseId,
    caseNumber,
    contactKey,
    reconPlayerId,
    email,
    product,
    category,
    subcategory,
    intent,
    source,
    subject,
    description,
    status: 'new',
    priority,
    severity,
    waitingOn: 'recon',
    assignee: null,
    team,
    refs: { subscription: null, coachingSession: null, vodJob: null, replay: null, identitySource: null, conversation: null, incidentId: null, ...refs },
    escalation: null,
    rootCause: null,
    resolution: null,
    learning: null,
    tags,
    csat: null,
    sla,
    classification,
    redactions,
    linkedFromCaseNumber,
    linkedCaseNumbers: [],
    // Proactive cases stay hidden from the player until staff reply publicly.
    playerVisible,
    createdBy,
    createdAt: at,
    updatedAt: at,
    lastPlayerMessageAt: source === 'proactive' ? null : at,
    resolvedAt: null,
    closedAt: null,
    reopenedAt: null,
    reopenCount: 0,
    resolutionCount: 0,
    version: 1,
    gsi1pk: SUPPORT_TYPES.CASE,
    gsi1sk: `${at}#${contactKey}`,
  }
}

// Bump updatedAt/version and the cross-contact index key.
export function touchCase(record, at) {
  return { ...record, updatedAt: at, version: (record.version || 0) + 1, gsi1sk: `${at}#${record.contactKey}` }
}

export function caseEventItem({ caseRecord, kind, visibility = 'staff', actor, body = null, data = null, at, extra = {} }) {
  if (!EVENT_KINDS.includes(kind)) throw new Error(`unknown case event kind ${kind}`)
  const vis = STAFF_ONLY_KINDS.includes(kind) ? 'staff' : visibility === 'public' ? 'public' : 'staff'
  const suffix = uniqueSuffix()
  return {
    pk: pkFor(caseRecord.contactKey),
    sk: `${SUPPORT_TYPES.CASE_EVENT}#${caseRecord.caseId}#${at}#${suffix}`,
    type: SUPPORT_TYPES.CASE_EVENT,
    eventId: `ev_${suffix}`,
    caseId: caseRecord.caseId,
    caseNumber: caseRecord.caseNumber,
    contactKey: caseRecord.contactKey,
    kind,
    visibility: vis,
    actor: { kind: actor.kind, id: actor.id || null },
    body,
    data,
    at,
    ...extra,
    gsi1pk: SUPPORT_TYPES.CASE_EVENT,
    gsi1sk: `${at}#${caseRecord.contactKey}`,
  }
}

// §6 action request: a case event with its own small state machine.
export function actionRequestEvent({ caseRecord, requestId, actionKind, reason, requiredVerification, actor, at }) {
  return caseEventItem({
    caseRecord,
    kind: 'action_request',
    actor,
    at,
    body: null,
    data: null,
    extra: {
      requestId,
      actionKind,
      reason,
      requiredVerification,
      arStatus: 'requested',
      history: [{ at, status: 'requested', by: actor.id }],
      // Support never performs the action: a person does it in the
      // authoritative system and records `done_externally`.
      executesInSupport: false,
    },
  })
}

export function attachmentItem({ caseRecord, attId, name, mime, size, at, by }) {
  return {
    pk: pkFor(caseRecord.contactKey),
    sk: `${SUPPORT_TYPES.ATTACHMENT}#${caseRecord.caseId}#${attId}`,
    type: SUPPORT_TYPES.ATTACHMENT,
    attId,
    caseId: caseRecord.caseId,
    caseNumber: caseRecord.caseNumber,
    contactKey: caseRecord.contactKey,
    name,
    mime,
    size,
    // Planned object key in the private bucket (not provisioned; nothing uploaded).
    objectKey: `support/${caseRecord.contactKey}/${caseRecord.caseId}/${attId}`,
    sha256: null,
    scanState: 'not_uploaded',
    uploadedAt: null,
    createdBy: by,
    createdAt: at,
  }
}

// ---- rate limits -----------------------------------------------------------------
// One item per unit of a player's daily allowance (UTC day). A write claims
// slot N with a conditional put (attribute_not_exists), so two concurrent
// requests can never take the same slot and at most `limit` slots exist per
// player, kind and day, whatever the concurrency. Expires (TTL) two days
// after its day ends.
export const RATE_PREFIX = 'SUP#RATE#'
export function rateSlotSk(kind, day, slot) {
  return `${RATE_PREFIX}${kind}#${day}#${String(slot).padStart(3, '0')}`
}
export function rateSlotItem({ contactKey, kind, day, slot, at }) {
  return {
    pk: pkFor(contactKey),
    sk: rateSlotSk(kind, day, slot),
    type: SUPPORT_TYPES.RATE,
    contactKey,
    kind,
    day,
    slot,
    createdAt: at,
    expires_at: Math.floor(Date.parse(`${day}T00:00:00.000Z`) / 1000) + 3 * 86400,
  }
}

// ---- case numbers ---------------------------------------------------------------
export function counterItem({ value, version, at }) {
  return { pk: SUP_PK.COUNTER, sk: 'CASENO', type: SUPPORT_TYPES.COUNTER, value, version, updatedAt: at }
}

export function caseNumberItem({ caseNumber, contactKey, caseId, at }) {
  return { pk: SUP_PK.CASENO, sk: caseNumber, type: SUPPORT_TYPES.CASENO, caseNumber, contactKey, caseId, createdAt: at }
}

// case id -> owner partition. Written at case creation so a verified
// support+<caseId>.<mac>@ plus-address can be resolved without a scan.
export function caseIdItem({ caseId, contactKey, caseNumber, at }) {
  return { pk: SUP_PK.CASEID, sk: caseId, type: SUPPORT_TYPES.CASEID, caseId, contactKey, caseNumber, createdAt: at }
}

// ---- incidents --------------------------------------------------------------------
export function incidentItem(incident) {
  return {
    ...incident,
    pk: SUP_PK.INCIDENT,
    sk: `INC#${incident.incidentId}`,
    type: SUPPORT_TYPES.INCIDENT,
    gsi1pk: SUPPORT_TYPES.INCIDENT,
    gsi1sk: `${incident.updatedAt}#${incident.incidentId}`,
  }
}

export function incidentEventItem({ incidentId, kind, body = null, data = null, at, by }) {
  const suffix = uniqueSuffix()
  return {
    pk: SUP_PK.INCIDENT,
    sk: `INCEV#${incidentId}#${at}#${suffix}`,
    type: SUPPORT_TYPES.INCIDENT_EVENT,
    eventId: `iev_${suffix}`,
    incidentId,
    kind,
    body,
    data,
    by,
    at,
  }
}

// ---- inbound email -------------------------------------------------------------------
// Inbound dedupe marker, written as a CLAIM (state 'processing') before the
// message is applied and finalized (state 'done') only after the apply
// succeeded. A failed apply marks it 'failed'; a claim left 'processing' by a
// crash becomes reclaimable after a lease. `firstSeenAt` never changes, so a
// retried message keeps deterministic ids.
export function emailMarkerItem({ messageIdHash, providerMessageId = null, outcome = null, state = 'processing', at }) {
  return { pk: SUP_PK.EMAIL, sk: `MID#${messageIdHash}`, type: SUPPORT_TYPES.EMAIL_MARKER, messageIdHash, providerMessageId, outcome, state, claimedAt: at, firstSeenAt: at, createdAt: at }
}

// Outbound support reply Message-ID -> case, for In-Reply-To/References
// threading. Written only when a staff reply is actually sent by email with a
// Message-ID; outbound support email is not wired, so none exist yet.
export function outboundMessageItem({ messageIdHash, caseId, caseNumber, contactKey, at }) {
  return { pk: SUP_PK.EMAIL, sk: `OUT#${messageIdHash}`, type: SUPPORT_TYPES.EMAIL_OUTBOUND, messageIdHash, caseId, caseNumber, contactKey, createdAt: at }
}

export function unmatchedEmailItem({ id, at, senderEmail, senderVerified, subject, text, reason, suggestedContactKey = null, suggestedCaseNumber = null, messageIdHash = null, redactions = [] }) {
  return {
    pk: SUP_PK.EMAIL,
    sk: `UNMATCHED#${at}#${id}`,
    type: SUPPORT_TYPES.UNMATCHED_EMAIL,
    id,
    senderEmail,
    senderVerified: senderVerified === true,
    subject,
    text,
    reason,
    suggestedContactKey,
    suggestedCaseNumber,
    messageIdHash,
    redactions,
    status: 'open',
    receivedAt: at,
    gsi1pk: SUPPORT_TYPES.UNMATCHED_EMAIL,
    gsi1sk: `${at}#${id}`,
  }
}

// ---- proactive ----------------------------------------------------------------------
export function proactiveMarkerItem({ ruleId, contactKey, window, at, caseNumber = null }) {
  return { pk: SUP_PK.PROACTIVE, sk: `PRO#${ruleId}#${contactKey}#${window}`, type: SUPPORT_TYPES.PROACTIVE, ruleId, contactKey, window, caseNumber, createdAt: at }
}

// ---- Help Center proposals -----------------------------------------------------------
export function kbProposalItem({ id, at, by, title, body = null, reason, sourceCaseNumbers = [], origin }) {
  return {
    pk: SUP_PK.KBPROP,
    sk: `KBP#${at}#${id}`,
    type: SUPPORT_TYPES.KB_PROPOSAL,
    id,
    title,
    body,
    reason,
    sourceCaseNumbers,
    origin,
    status: 'proposed',
    // A proposal is never published by the system; accepted means a person
    // writes and reviews the article in the repo.
    published: false,
    createdBy: by,
    createdAt: at,
    decidedAt: null,
    decidedBy: null,
    decisionNote: null,
    gsi1pk: SUPPORT_TYPES.KB_PROPOSAL,
    gsi1sk: `${at}#${id}`,
  }
}

// ---- audit (PR #24 AUDIT type) ---------------------------------------------------------
// `detail` carries ids and kinds only; never free text a player wrote.
export function supportAuditItem({ contactKey = null, action, actor, at, detail = {} }) {
  return {
    pk: contactKey ? pkFor(contactKey) : SUP_PK.AUDIT,
    sk: `${ITEM_TYPES.AUDIT}#${at}#${uniqueSuffix()}`,
    type: ITEM_TYPES.AUDIT,
    contactKey,
    action,
    actor,
    at,
    detail,
    gsi1pk: ITEM_TYPES.AUDIT,
    gsi1sk: `${at}#${contactKey || 'support'}`,
  }
}
