// Proactive Player Care (ARCHITECTURE §12).
//
// Rules run ONLY on data production records today. A finding becomes a
// flagged case (source `proactive`) or, for a global provider failure, an
// incident suggestion. Nothing here contacts a player. Each finding carries a
// dedupe key `<ruleId>#<contactKey>#<ISO week>`; findings whose key is already
// in `existingMarkers` (the SUP#PROACTIVE markers) are skipped.

import { entitlementView } from './diagnostics/entitlement.mjs'
import { coachingEvidence } from './diagnostics/coaching.mjs'
import { vodEvidence } from './diagnostics/vod.mjs'
import { dateOnly, isoWeek, sourceData, sourceStatus } from './diagnostics/shared.mjs'
import { createPlanCatalog, pickBestSub } from '../domain/plans.mjs'

const DEFAULT_CATALOG = createPlanCatalog()

export const RULES = Object.freeze([
  {
    id: 'paid_past_due_or_unbound',
    category: 'access_entitlement',
    severity: 'sev2',
    summary: 'Paid Recon row is past_due, or a live paid row is not bound to a login',
    dataSources: ['ghost-igl-subscriptions (status, cognito_sub)', 'Cognito user'],
  },
  {
    id: 'coaching_purchase_no_credits',
    category: 'coaching_credits',
    severity: 'sev3',
    summary: 'Coaching purchase (paid membership cycle or paid package booking) with no credits row',
    dataSources: ['recon6-bookings booking rows + credits#<email>', 'ghost-igl-subscriptions'],
  },
  {
    id: 'onboarding_stalled_paid',
    category: 'other',
    severity: 'sev3',
    summary: 'Paying member whose onboarding has stalled',
    dataSources: ['PR #24 lifecycle risks (not_activated_7d, paid_never_logged_in, account_setup_incomplete)'],
  },
  {
    id: 'vod_usage_without_review',
    category: 'vod_analysis',
    severity: 'sev3',
    summary: 'VOD usage counted with no completed review record (possible failed review)',
    dataSources: ['ghost-igl-subscriptions vod_* counter', 'recon-player-events vod_reviewed'],
  },
  {
    id: 'provider_global_failure',
    category: 'incident_suggestion',
    severity: 'sev2',
    summary: 'A data provider is failing globally: suggest an incident, not per-player cases',
    dataSources: ['recon-player-provider-health (newest per provider)'],
  },
])

const RULE = Object.fromEntries(RULES.map((r) => [r.id, r]))
const FAILING = new Set(['down', 'auth_failed', 'schema_changed'])
const PROVIDER_CATEGORY = { ubisoft: 'ubisoft_connection', psn: 'psn_connection', xbox: 'xbox_connection', trn: 'trn_data', vod: 'vod_analysis', desktop: 'desktop_client', replay: 'replay_upload' }
const PROVIDER_SERVICE = { ubisoft: 'identity_ubisoft', psn: 'identity_psn', xbox: 'identity_xbox', trn: 'trn', vod: 'vod_processing', desktop: 'desktop_client', replay: 'other' }

const ev = (label, value, source, at = null) => ({ kind: 'fact', label, value, source, at: at || null })

function finding(ruleId, contactKey, week, { summary, evidence, category, severity, extra = {} }) {
  const rule = RULE[ruleId]
  const text = summary || rule.summary
  return {
    ruleId,
    contactKey,
    dedupeKey: `${ruleId}#${contactKey}#${week}`,
    category: category || rule.category,
    severity: severity || rule.severity,
    summary: text,
    evidence,
    // Fields the support service reads when it records a flagged case.
    scope: ruleId === 'provider_global_failure' ? 'global' : 'player',
    window: week,
    subject: text,
    description: [text, ...evidence.map((e) => `${e.label}: ${e.value} (${e.source})`)].join('\n'),
    ...extra,
  }
}

function rulePaidRow({ contactKey, one, facts }, now, catalog, week) {
  if (facts?.identity?.isAdmin) return null
  if (!one && facts?.billing?.available) {
    // Facts-only entry (no raw rows): past_due is visible, identity binding is not.
    const b = facts.billing
    if (b.rowStatus !== 'past_due' && b.paymentIssue !== 'past_due') return null
    return finding('paid_past_due_or_unbound', contactKey, week, {
      category: 'billing_question',
      summary: 'Paid row is past_due',
      evidence: [
        ev('Ledger status', `past_due (period end ${dateOnly(b.currentPeriodEnd) || 'not recorded'})`, 'resolveBilling over ghost-igl-subscriptions', b.asOf),
        ev('Identity binding', 'not checked (raw rows not supplied)', 'ghost-igl-subscriptions cognito_sub'),
      ],
    })
  }
  if (sourceStatus(one, 'billing') !== 'ok') return null
  const rows = Array.isArray(sourceData(one, 'billing')) ? sourceData(one, 'billing') : []
  const pastDue = rows.filter((row) => row.status === 'past_due' && String(row.stripe_customer_id || '').startsWith('cus_'))
  const view = entitlementView({ rows, profile: sourceData(one, 'profile'), cognitoUser: one?.cognitoUser || null, catalog, now, roles: [] })
  const unbound = view.mismatches.find((m) => m.ruleId === 'paid_live_identity_unbound')
  if (!pastDue.length && !unbound) return null
  const evidence = []
  for (const row of pastDue) evidence.push(ev('Ledger status', `past_due (period end ${dateOnly(row.current_period_end) || 'not recorded'})`, 'ghost-igl-subscriptions', row.updated_at))
  if (unbound) evidence.push(ev('Identity binding', unbound.detail, 'ghost-igl-subscriptions cognito_sub'))
  evidence.push(ev('Recon access decision', view.reconState.hasAccess ? 'granted' : 'not granted', 'resolveBilling'))
  return finding('paid_past_due_or_unbound', contactKey, week, {
    category: pastDue.length ? 'billing_question' : 'access_entitlement',
    summary: pastDue.length && unbound ? 'Paid row past_due and not bound to a login' : pastDue.length ? 'Paid row is past_due' : 'Live paid row is not bound to a login',
    evidence,
  })
}

function ruleCoaching({ contactKey, one, facts }, week) {
  if (!facts || facts.identity.isAdmin) return null
  if (!one) {
    // Facts-only entry: summarizeBookings reports credits null when no credits row exists.
    const coaching = facts.activity?.coaching
    const b = facts.billing
    const membership = Boolean(b?.hasAccess && (b.plan === 'champion' || b.paidPlan === 'champion'))
    if (facts.sources?.bookings !== 'ok' || !coaching || coaching.credits !== null || !membership) return null
    return finding('coaching_purchase_no_credits', contactKey, week, {
      evidence: [ev('Credits row', 'none on record', 'recon6-bookings credits#<email>'), ev('Coaching membership', `${b.planLabel || 'Champion'} access granted`, 'resolveBilling', b.asOf)],
    })
  }
  if (sourceStatus(one, 'bookings') !== 'ok') return null
  const c = coachingEvidence({ bookingData: sourceData(one, 'bookings'), email: facts.identity.email, billing: facts.billing })
  if (!c.purchaseWithoutCredits) return null
  const evidence = [ev('Credits row', 'none on record', 'recon6-bookings credits#<email>')]
  if (c.membership) evidence.push(ev('Coaching membership', `${facts.billing.planLabel || 'Champion'} access granted`, 'resolveBilling', facts.billing.asOf))
  if (c.paidPackages) evidence.push(ev('Paid package bookings', String(c.paidPackages), 'recon6-bookings'))
  return finding('coaching_purchase_no_credits', contactKey, week, { evidence })
}

function ruleOnboarding({ contactKey, facts, lifecycle }, week) {
  if (!facts || !lifecycle || facts.identity.isAdmin || !facts.billing?.isPaidMember) return null
  const stalled = (lifecycle.risks || []).filter((r) => ['not_activated_7d', 'paid_never_logged_in', 'account_setup_incomplete'].includes(r.code))
  if (!stalled.length) return null
  return finding('onboarding_stalled_paid', contactKey, week, {
    evidence: [
      ev('Membership', `${facts.billing.planLabel} (${facts.billing.status})`, 'resolveBilling', facts.billing.asOf),
      ...stalled.map((r) => ev(`Lifecycle risk ${r.code}`, r.reason, 'domain/lifecycle.mjs')),
    ],
  })
}

function ruleVod({ contactKey, one, facts }, now, catalog, week) {
  if (!facts || facts.identity.isAdmin) return null
  if (!one) {
    // Facts-only entry: compare counted uses with completed reviews in the
    // last 30 days (a superset of the 30-day usage period, so conservative).
    const u = facts.usage?.vod
    if (facts.sources?.player !== 'ok' || !u || u.unlimited || !(u.used > 0)) return null
    const reviews = Number(facts.activity?.vod?.count30 || 0)
    if (u.used <= reviews) return null
    return finding('vod_usage_without_review', contactKey, week, {
      evidence: [
        ev('Counted uses this period', String(u.used), 'ghost-igl-subscriptions vod_sessions_used'),
        ev('Completed review records (last 30 days)', String(reviews), 'recon-player-events vod_reviewed', facts.activity?.vod?.lastAt),
        ev('Job / failure records', 'not recorded', 'VOD Lambda'),
      ],
      extra: { inference: { kind: 'inference', value: `${u.used - reviews} use(s) without a completed review`, basis: 'counter is reserved before the model call; events capped at the newest 50', confidence: 0.45 } },
    })
  }
  if (sourceStatus(one, 'billing') !== 'ok' || sourceStatus(one, 'player') !== 'ok') return null
  const plan = facts.billing.plan
  if (!plan || plan === 'free') return null
  const rows = Array.isArray(sourceData(one, 'billing')) ? sourceData(one, 'billing') : []
  const row = pickBestSub(rows, { catalog, now })
  const events = sourceData(one, 'player')?.events || []
  const v = vodEvidence({ row, events, plan, tierScope: facts.billing.tierScope, now })
  if (!v.usage || v.unmatchedUsage <= 0) return null
  return finding('vod_usage_without_review', contactKey, week, {
    evidence: [
      ev('Counted uses this period', String(v.usage.used), 'ghost-igl-subscriptions vod_sessions_used', v.counterUpdatedAt),
      ev('Completed review records this period', String(v.reviewRecordsInPeriod), 'recon-player-events vod_reviewed', v.lastReviewAt),
      ev('Job / failure records', 'not recorded', 'VOD Lambda'),
    ],
    extra: { inference: { kind: 'inference', value: `${v.unmatchedUsage} use(s) without a completed review`, basis: 'counter is reserved before the model call', confidence: v.eventsTruncated ? 0.35 : 0.55 } },
  })
}

function ruleProviders(providerHealth, week) {
  const out = []
  for (const h of Array.isArray(providerHealth) ? providerHealth : []) {
    const status = String(h?.status || '').toLowerCase()
    if (!FAILING.has(status)) continue
    const provider = String(h.provider || '').toLowerCase()
    out.push(finding('provider_global_failure', `global:${provider}`, week, {
      category: PROVIDER_CATEGORY[provider] || 'other',
      summary: `${provider} provider is ${status}: open or update an incident (service ${PROVIDER_SERVICE[provider] || 'other'})`,
      evidence: [ev('Provider health', `${status}${h.error_code ? ` (${h.error_code})` : ''}`, 'recon-player-provider-health', h.observed_at)],
      extra: { kind: 'incident_suggestion', service: PROVIDER_SERVICE[provider] || 'other' },
    }))
  }
  return out
}

function markerSet(existing) {
  const set = new Set()
  for (const key of existing instanceof Set || Array.isArray(existing) ? existing : []) {
    const value = String(key || '')
    set.add(value.startsWith('PRO#') ? value.slice(4) : value)
  }
  return set
}

// `entries` is accepted as an alias of `contacts` (the service's directory
// entries: { contactKey, email, facts, lifecycle } without raw sources). With
// no `one`, rules fall back to what facts carry; identity binding and package
// bookings then cannot be checked and are skipped, never guessed.
export function evaluateProactive({ contacts, entries, now = Date.now(), existingMarkers = new Set(), providerHealth = [], catalog = DEFAULT_CATALOG } = {}) {
  const week = isoWeek(now)
  const seen = markerSet(existingMarkers)
  const findings = []
  const list = Array.isArray(contacts) ? contacts : Array.isArray(entries) ? entries : []
  for (const contact of list) {
    if (!contact?.contactKey) continue
    const before = findings.length
    const candidates = [
      rulePaidRow(contact, now, catalog, week),
      ruleCoaching(contact, week),
      ruleOnboarding(contact, week),
      ruleVod(contact, now, catalog, week),
    ]
    for (const f of candidates) if (f) findings.push(f)
    if (contact.email) for (const f of findings.slice(before)) f.email = String(contact.email).trim().toLowerCase()
  }
  findings.push(...ruleProviders(providerHealth, week))
  const out = []
  for (const f of findings) {
    if (seen.has(f.dedupeKey)) continue
    seen.add(f.dedupeKey)
    out.push(f)
  }
  return out
}
