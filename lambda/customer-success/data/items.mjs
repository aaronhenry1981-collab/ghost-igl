// Item layouts for the customer-success single table.
//
//   pk            C#<contactKey>                       (contactKey = pl_<hash>)
//   sk            ACT#<yyyy-mm-dd>#<type>              activity beacon, one per day/type (latest ref)
//                 MSG#<iso>#<id>                       conversation message (in or out)
//                 FB#<iso>#<id>                        feedback response
//                 PROMPT#<momentKey>                   feedback prompt state (dedupe)
//                 CONSENT                              contact preferences / suppression
//                 OUT#<workflow>#<instance>            outreach record (idempotency key)
//                 DEC#<queueItemKey>                   action-queue decision
//                 AUDIT#<iso>#<id>                     audit trail entry
//                 IDEM#<scope>#<clientId>              idempotency marker (admin replies)
//   gsi1pk/gsi1sk <TYPE> / <iso>#<contactKey>          cross-contact lists without scans
//   expires_at    epoch seconds (TTL) on ACT and IDEM items only

export const ITEM_TYPES = Object.freeze({
  ACTIVITY: 'ACT',
  MESSAGE: 'MSG',
  FEEDBACK: 'FB',
  PROMPT: 'PROMPT',
  CONSENT: 'CONSENT',
  OUTREACH: 'OUT',
  DECISION: 'DEC',
  AUDIT: 'AUDIT',
  IDEMPOTENCY: 'IDEM',
})

export const IDEMPOTENCY_TTL_DAYS = 7

// Claimed with a conditional put before a side effect, so a double-click or a
// retried request with the same client id cannot repeat it.
export function idempotencyItem({ contactKey, scope, clientId, at, actor }) {
  return {
    pk: pkFor(contactKey),
    sk: `${ITEM_TYPES.IDEMPOTENCY}#${scope}#${clientId}`,
    type: ITEM_TYPES.IDEMPOTENCY,
    contactKey,
    scope,
    clientId,
    actor,
    createdAt: at,
    expires_at: Math.floor(Date.parse(at) / 1000) + IDEMPOTENCY_TTL_DAYS * 86400,
  }
}

export const ACTIVITY_TYPES = Object.freeze(['strat_viewed', 'match_prep_opened', 'live_coach_opened'])
export const ACTIVITY_TTL_DAYS = 180

export const pkFor = (contactKey) => `C#${contactKey}`

// Bounded by design: one item per contact, type and day (the latest `ref`
// wins). The key never contains client-supplied text, so no request can
// create more than ACTIVITY_TYPES.length items per player per day.
export function activityItem({ contactKey, email, type, ref = null, at }) {
  const day = at.slice(0, 10)
  return {
    pk: pkFor(contactKey),
    sk: `${ITEM_TYPES.ACTIVITY}#${day}#${type}`,
    type: ITEM_TYPES.ACTIVITY,
    contactKey,
    email,
    activityType: type,
    ref,
    at,
    gsi1pk: ITEM_TYPES.ACTIVITY,
    gsi1sk: `${at}#${contactKey}`,
    expires_at: Math.floor(Date.parse(at) / 1000) + ACTIVITY_TTL_DAYS * 86400,
  }
}

// Split a contact's items into the shape facts.mjs expects under sources.cs.
export function csSourceFromItems(items = []) {
  const out = { consent: null, messages: [], feedback: [], prompts: [], outreach: [], decisions: [], activity: [], audit: [] }
  for (const item of items) {
    switch (item.type) {
      case ITEM_TYPES.ACTIVITY:
        out.activity.push({ type: item.activityType, at: item.at, ref: item.ref || null })
        break
      case ITEM_TYPES.MESSAGE:
        out.messages.push(item)
        break
      case ITEM_TYPES.FEEDBACK:
        out.feedback.push(item)
        break
      case ITEM_TYPES.PROMPT:
        out.prompts.push(item)
        break
      case ITEM_TYPES.CONSENT:
        out.consent = item
        break
      case ITEM_TYPES.OUTREACH:
        out.outreach.push(item)
        break
      case ITEM_TYPES.DECISION:
        out.decisions.push(item)
        break
      case ITEM_TYPES.AUDIT:
        out.audit.push(item)
        break
      default:
        break
    }
  }
  out.messages.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
  out.feedback.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  return out
}

let messageCounter = 0
function newId(at) {
  messageCounter = (messageCounter + 1) % 1e6
  return `${Date.parse(at).toString(36)}${messageCounter.toString(36).padStart(4, '0')}${Math.random().toString(36).slice(2, 8)}`
}

// A conversation message. `status` on outbound messages says whether the
// player can see it (delivered) or it was only recorded (delivery_disabled).
export function messageItem({ contactKey, email, direction, channel, subject = null, body, at, author, workflowId = null, outreachKey = null, status = null, messageId = null, inReplyTo = null }) {
  const id = messageId || newId(at)
  return {
    pk: pkFor(contactKey),
    sk: `${ITEM_TYPES.MESSAGE}#${at}#${id}`,
    type: ITEM_TYPES.MESSAGE,
    contactKey,
    email,
    messageId: id,
    direction,
    channel,
    subject,
    body,
    bodyPreview: String(body || '').slice(0, 140),
    author,
    workflowId,
    outreachKey,
    inReplyTo,
    status: direction === 'outbound' ? status || 'delivery_disabled' : 'received',
    createdAt: at,
    gsi1pk: ITEM_TYPES.MESSAGE,
    gsi1sk: `${at}#${contactKey}`,
  }
}

// One outreach occurrence. The sort key IS the idempotency key: a workflow
// can never create two records for the same occurrence.
export function outreachItem({ contactKey, email, workflow, instanceKey, status, statusReason = null, message, triggerReason, at, actor = 'system', queueItemKey = null }) {
  return {
    pk: pkFor(contactKey),
    sk: `${ITEM_TYPES.OUTREACH}#${workflow.id}#${instanceKey}`,
    type: ITEM_TYPES.OUTREACH,
    contactKey,
    email,
    outreachKey: `${workflow.id}#${instanceKey}`,
    workflowId: workflow.id,
    workflowName: workflow.name,
    category: workflow.category,
    channel: workflow.channel,
    instanceKey,
    status,
    statusReason,
    subject: message?.subject || null,
    body: message?.body || null,
    triggerReason,
    actor,
    queueItemKey,
    createdAt: at,
    updatedAt: at,
    history: [{ at, status, reason: statusReason, actor }],
    gsi1pk: ITEM_TYPES.OUTREACH,
    gsi1sk: `${at}#${contactKey}`,
  }
}

export function consentItem({ contactKey, email, previous = null, patch, at, actor }) {
  const next = {
    marketing: previous?.marketing || 'unknown',
    relationship: previous?.relationship || 'subscribed',
    doNotContact: previous?.doNotContact === true,
    suppressedReason: previous?.suppressedReason || null,
    ...patch,
  }
  const change = Object.fromEntries(Object.entries(patch).filter(([k, v]) => previous?.[k] !== v))
  return {
    pk: pkFor(contactKey),
    sk: ITEM_TYPES.CONSENT,
    type: ITEM_TYPES.CONSENT,
    contactKey,
    email,
    ...next,
    updatedAt: at,
    updatedBy: actor,
    version: (previous?.version || 0) + 1,
    history: [{ at, actor, change }, ...(previous?.history || [])].slice(0, 25),
  }
}
