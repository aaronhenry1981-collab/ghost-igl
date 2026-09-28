// Incident model (docs/player-success/ARCHITECTURE.md §9).
//
// An incident is a service-level problem that many cases can link to. The
// customer-safe update is a DRAFT field only: nothing in this module or the
// service publishes it anywhere (`published` is always false). Free-text
// fields lose bidi / zero-width / control characters here; the service
// redacts them before storage.

import { stripInvisible } from './redact.mjs'

export const INCIDENT_SERVICES = Object.freeze([
  'identity_ubisoft',
  'identity_psn',
  'identity_xbox',
  'trn',
  'vod_processing',
  'auth',
  'payment_access',
  'desktop_client',
  'other',
])
export const INCIDENT_STATUSES = Object.freeze(['investigating', 'identified', 'monitoring', 'resolved'])
export const INCIDENT_SEVERITIES = Object.freeze(['sev1', 'sev2', 'sev3', 'sev4'])
export const INCIDENT_EVENT_KINDS = Object.freeze(['note', 'status_change', 'customer_update_draft', 'update'])

export const INCIDENT_ID = /^inc_[a-z0-9]{8,40}$/

const LIMITS = Object.freeze({ title: 160, owner: 120, workaround: 2000, internalNotes: 4000, customerUpdateDraft: 2000 })

export class IncidentValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'IncidentValidationError'
  }
}

function text(value, field, { required = false } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new IncidentValidationError(`${field} is required`)
    return null
  }
  if (typeof value !== 'string') throw new IncidentValidationError(`${field} must be text`)
  const trimmed = stripInvisible(value).trim()
  if (required && !trimmed) throw new IncidentValidationError(`${field} is required`)
  if (trimmed.length > LIMITS[field]) throw new IncidentValidationError(`${field} is too long (max ${LIMITS[field]})`)
  return trimmed || null
}

const ALLOWED_FIELDS = new Set(['title', 'service', 'status', 'severity', 'owner', 'affectedCount', 'workaround', 'internalNotes', 'customerUpdateDraft'])

// Validates a create (partial=false) or PATCH (partial=true) body. Returns
// only known, normalized fields; unknown fields are an error.
export function validateIncidentInput(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new IncidentValidationError('incident must be an object')
  for (const key of Object.keys(body)) if (!ALLOWED_FIELDS.has(key)) throw new IncidentValidationError(`unknown field ${key}`)
  const out = {}
  const has = (k) => body[k] !== undefined
  if (!partial || has('title')) out.title = text(body.title, 'title', { required: !partial || has('title') })
  if (!partial || has('service')) {
    if (!INCIDENT_SERVICES.includes(body.service)) throw new IncidentValidationError(`service must be one of ${INCIDENT_SERVICES.join(', ')}`)
    out.service = body.service
  }
  if (has('status') || !partial) {
    const status = body.status ?? 'investigating'
    if (!INCIDENT_STATUSES.includes(status)) throw new IncidentValidationError(`status must be one of ${INCIDENT_STATUSES.join(', ')}`)
    out.status = status
  }
  if (has('severity') || !partial) {
    const severity = body.severity ?? 'sev3'
    if (!INCIDENT_SEVERITIES.includes(severity)) throw new IncidentValidationError(`severity must be one of ${INCIDENT_SEVERITIES.join(', ')}`)
    out.severity = severity
  }
  if (has('owner')) out.owner = text(body.owner, 'owner')
  if (has('affectedCount')) {
    const n = body.affectedCount
    if (n !== null && (!Number.isInteger(n) || n < 0 || n > 1e6)) throw new IncidentValidationError('affectedCount must be a whole number or null (unknown)')
    out.affectedCount = n
  }
  if (has('workaround')) out.workaround = text(body.workaround, 'workaround')
  if (has('internalNotes')) out.internalNotes = text(body.internalNotes, 'internalNotes')
  if (has('customerUpdateDraft')) out.customerUpdateDraft = text(body.customerUpdateDraft, 'customerUpdateDraft')
  if (partial && !Object.keys(out).length) throw new IncidentValidationError('nothing to update')
  return out
}

export function newIncident({ incidentId, input, at, by }) {
  return {
    incidentId,
    title: input.title,
    service: input.service,
    status: input.status || 'investigating',
    severity: input.severity || 'sev3',
    owner: input.owner ?? null,
    // null = not known (never guessed).
    affectedCount: input.affectedCount ?? null,
    workaround: input.workaround ?? null,
    internalNotes: input.internalNotes ?? null,
    customerUpdate: input.customerUpdateDraft ? { draft: input.customerUpdateDraft, published: false, updatedAt: at, updatedBy: by } : null,
    createdAt: at,
    createdBy: by,
    updatedAt: at,
    resolvedAt: input.status === 'resolved' ? at : null,
    version: 1,
  }
}

// Apply a validated PATCH. A customer-safe update stays a draft.
export function patchIncident(incident, patch, { at, by }) {
  const next = { ...incident, updatedAt: at, version: (incident.version || 0) + 1 }
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'customerUpdateDraft') next.customerUpdate = v ? { draft: v, published: false, updatedAt: at, updatedBy: by } : null
    else next[k] = v
  }
  if (patch.status === 'resolved' && incident.status !== 'resolved') next.resolvedAt = at
  if (patch.status && patch.status !== 'resolved') next.resolvedAt = null
  return next
}

export const isActiveIncident = (incident) => incident?.status !== 'resolved'
