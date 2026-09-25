// Acquisition events recorded on the signed-in player's own player-data
// timeline (POST /player-data/events), Recon's system of record.
//
// Every event is idempotent: a fixed event_id plus an occurred_at taken from
// the stored attribution (never "now" for past facts), so a retry or a second
// tab produces the same key (player-data stores events under
// occurred_at#event_id with a conditional write).
//
// Payloads use snake_case, carry no personal data, no full URLs, no query
// strings and nothing credential-like (player-data rejects such keys).

import { ATTRIBUTION_VERSION, attributionSnapshot, slug } from './core.js'

export const CAPTURED_BY = 'recon-web'

export const ACQUISITION_EVENTS = Object.freeze({
  acquisition_attributed: {
    description: 'How this browser first found Recon: first touch, first non-direct touch, last touch and landing page.',
    trigger: 'The first signed-in page load on a browser that has attribution stored.',
    idempotency: 'event_id "acq-first-v1" with occurred_at = when this browser was first seen. One record per player per browser; the earliest record per player is their first touch.',
    fields: 'attribution_version, first_touch, first_non_direct_touch, last_touch, landing_path, visits, first_seen_at, seeded_from_legacy, captured_by',
  },
  acquisition_touch: {
    description: 'One visit that arrived from a real source (UTM tag, referrer, creator code or friend referral).',
    trigger: 'Each recorded non-direct touch not yet recorded for this player (up to the last 10 per browser).',
    idempotency: 'event_id "acq-touch-<hash of source, campaign, content, referral code, time>" with occurred_at = the visit time.',
    fields: 'touch, captured_by',
  },
  checkout_started: {
    description: 'A signed-in player clicked a membership checkout button (not a purchase; purchases come from Stripe).',
    trigger: 'The existing "Pricing CTA Click" analytics event while signed in.',
    idempotency: 'event_id "checkout-<tier>-<location>" with occurred_at rounded down to the minute: repeated clicks in one minute record once.',
    fields: 'tier, location, attribution (first / first non-direct / last touch, landing path), captured_by',
  },
})

// Shared by every event (docs/RECON-ACQUISITION.md, "Event definitions").
export const EVENT_POLICY = Object.freeze({
  storedIn: 'player-data events table (recon-player-events), private visibility',
  consent: 'First-party measurement of how people found Recon; no cross-site identifiers, no advertising IDs, no personal data in payloads',
  retention: 'Player-data event retention: deleted or anonymised on account request',
  owner: 'Growth (Aaron)',
})

export const ACQUISITION_EVENT_TYPES = Object.freeze(Object.keys(ACQUISITION_EVENTS))

function hash(text) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

function snakeTouch(touch) {
  if (!touch) return null
  return {
    source: touch.source ?? null,
    source_label: touch.sourceLabel ?? null,
    source_raw: touch.sourceRaw ?? null,
    channel: touch.channel ?? null,
    evidence: touch.evidence ?? null,
    medium: touch.medium ?? null,
    campaign: touch.campaign ?? null,
    content: touch.content ?? null,
    term: touch.term ?? null,
    content_id: touch.contentId ?? null,
    ref: touch.ref ?? null,
    referral_code: touch.referralCode ?? null,
    referrer_domain: touch.referrerDomain ?? null,
    landing_path: touch.landingPath ?? null,
    at: touch.at ?? null,
  }
}

function snakeSnapshot(snap) {
  if (!snap) return null
  return {
    first_touch: snakeTouch(snap.firstTouch),
    first_non_direct_touch: snakeTouch(snap.firstNonDirectTouch),
    last_touch: snakeTouch(snap.lastTouch),
    landing_path: snap.landingPath ?? null,
    visits: snap.visits ?? 0,
  }
}

export function eventKey(event) {
  return `${event.occurred_at}#${event.event_id}`
}

export function attributedEvent(state) {
  if (!state?.firstTouch || !state.firstSeenAt) return null
  const snap = snakeSnapshot(attributionSnapshot(state))
  return {
    event_type: 'acquisition_attributed',
    event_id: 'acq-first-v1',
    occurred_at: state.firstSeenAt,
    visibility: 'private',
    data: {
      attribution_version: ATTRIBUTION_VERSION,
      ...snap,
      first_seen_at: state.firstSeenAt,
      seeded_from_legacy: Boolean(state.seededFromLegacy),
      captured_by: CAPTURED_BY,
    },
  }
}

export function touchEvent(touch) {
  if (!touch || touch.evidence === 'none' || touch.evidence === 'legacy_first_touch' || !touch.at) return null
  const id = hash([touch.source, touch.campaign, touch.content, touch.referralCode, touch.at].join('|'))
  return {
    event_type: 'acquisition_touch',
    event_id: `acq-touch-${id}`,
    occurred_at: touch.at,
    visibility: 'private',
    data: { attribution_version: ATTRIBUTION_VERSION, touch: snakeTouch(touch), captured_by: CAPTURED_BY },
  }
}

export function checkoutEvent(state, { tier, location, now = Date.now() } = {}) {
  const minute = Math.floor(now / 60000) * 60000
  const tierSlug = slug(tier) || 'unknown'
  const locationSlug = slug(location) || 'unknown'
  return {
    event_type: 'checkout_started',
    event_id: `checkout-${tierSlug}-${locationSlug}`.slice(0, 100),
    occurred_at: new Date(minute).toISOString(),
    visibility: 'private',
    data: {
      attribution_version: ATTRIBUTION_VERSION,
      tier: tierSlug,
      location: locationSlug,
      attribution: snakeSnapshot(attributionSnapshot(state)),
      captured_by: CAPTURED_BY,
    },
  }
}

// Events a signed-in player still needs recorded from this browser.
export function pendingEvents(state, syncedKeys = new Set()) {
  if (!state) return []
  const events = [attributedEvent(state), ...(state.touches || []).map(touchEvent)].filter(Boolean)
  const seen = new Set()
  return events.filter((event) => {
    const key = eventKey(event)
    if (syncedKeys.has(key) || seen.has(key)) return false
    seen.add(key)
    return true
  })
}
