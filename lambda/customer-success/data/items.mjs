// Item layouts for the customer-success single table.
//
//   pk            C#<contactKey>                       (contactKey = pl_<hash>)
//   sk            ACT#<yyyy-mm-dd>#<type>#<ref>        activity beacon, one per day/type/ref
//                 MSG#<iso>#<id>                       conversation message (in or out)
//                 FB#<iso>#<id>                        feedback response
//                 PROMPT#<momentKey>                   feedback prompt state (dedupe)
//                 CONSENT                              contact preferences / suppression
//                 OUT#<workflow>#<instance>            outreach record (idempotency key)
//                 DEC#<queueItemKey>                   action-queue decision
//                 AUDIT#<iso>#<id>                     audit trail entry
//   gsi1pk/gsi1sk <TYPE> / <iso>#<contactKey>          cross-contact lists without scans
//   expires_at    epoch seconds (TTL) on ACT items only

export const ITEM_TYPES = Object.freeze({
  ACTIVITY: 'ACT',
  MESSAGE: 'MSG',
  FEEDBACK: 'FB',
  PROMPT: 'PROMPT',
  CONSENT: 'CONSENT',
  OUTREACH: 'OUT',
  DECISION: 'DEC',
  AUDIT: 'AUDIT',
})

export const ACTIVITY_TYPES = Object.freeze(['strat_viewed', 'match_prep_opened', 'live_coach_opened'])
export const ACTIVITY_TTL_DAYS = 180

export const pkFor = (contactKey) => `C#${contactKey}`

function safeSegment(value, max = 80) {
  return String(value ?? '').replace(/[^a-z0-9_.:-]/gi, '-').slice(0, max) || '-'
}

export function activityItem({ contactKey, email, type, ref = null, at }) {
  const day = at.slice(0, 10)
  const refKey = ref ? safeSegment([ref.mapId, ref.siteId, ref.side].filter(Boolean).join('.'), 60) : '-'
  return {
    pk: pkFor(contactKey),
    sk: `${ITEM_TYPES.ACTIVITY}#${day}#${type}#${refKey}`,
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
