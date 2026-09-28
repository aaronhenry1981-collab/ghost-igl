// Customer home view model. One projection, rendered identically whether it
// was built by the customer-success Lambda (full mode) or in the browser from
// the account API (lite mode).
//
// Never includes admin-only judgements (health labels, risk codes, notes).

import { deriveActivation } from './activation.mjs'
import { deriveEvidence, deriveFocus, deriveHelp, deriveMission, deriveStuck } from './mission.mjs'
import { toMs } from './facts.mjs'
import { COACHING_SESSIONS_PER_MONTH, PLAN_FEATURES, PLAN_LABEL, hasPlan } from './plans.mjs'

export const HOME_VIEW_VERSION = 1

const NEXT_PLAN = Object.freeze({ free: 'pro', pro: 'elite', elite: 'champion', champion: null })

function fmtDay(iso) {
  const ms = toMs(iso)
  if (!Number.isFinite(ms)) return null
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export function customerStatusLabel(billing) {
  if (!billing.available) return 'Membership status unavailable right now'
  const end = fmtDay(billing.currentPeriodEnd)
  switch (billing.status) {
    case 'admin': return 'Admin account'
    case 'none': return 'Free account'
    case 'active': return end ? `Paid through ${end}` : 'Active'
    case 'trialing': return end ? `Trial ends ${end}` : 'Trial'
    case 'cancelling': return end ? `Cancels ${end}` : 'Cancellation scheduled'
    case 'comp': return end && !end.includes('2099') ? `Complimentary access until ${end}` : 'Complimentary access'
    case 'payment_failed': return 'Payment failed · paid features paused'
    case 'renewal_unconfirmed': return 'Renewal not confirmed · paid features paused'
    case 'ended': return end ? `Ended ${end}` : 'Ended'
    case 'comp_expired': return 'Complimentary access ended'
    default: return 'Status unavailable'
  }
}

function statusTone(status) {
  if (status === 'payment_failed' || status === 'renewal_unconfirmed') return 'danger'
  if (status === 'cancelling' || status === 'ended' || status === 'comp_expired' || status === 'unknown') return 'warning'
  if (status === 'none') return 'neutral'
  return 'ok'
}

function upgradeFor(billing) {
  if (!billing.available || billing.status === 'admin') return null
  // Do not upsell someone whose payment is failing or unconfirmed.
  if (billing.status === 'payment_failed' || billing.status === 'renewal_unconfirmed') return null
  const current = billing.hasAccess ? billing.plan : 'free'
  const next = NEXT_PLAN[current]
  if (!next) return null
  return {
    plan: next,
    label: PLAN_LABEL[next],
    features: PLAN_FEATURES[next],
    cta: { label: `See ${PLAN_LABEL[next]}`, to: '/pricing' },
  }
}

function vodSection(facts) {
  const plan = facts.billing.plan || 'free'
  const vod = facts.usage.vod
  const included = hasPlan(plan, 'pro') && facts.billing.hasAccess
  let next
  if (!facts.billing.available) next = null
  else if (!included) next = { label: 'See plans with VOD review', to: '/pricing' }
  else if (vod && !vod.unlimited && vod.limit && vod.remaining === 0) next = { label: vod.periodEnd ? `Resets ${fmtDay(vod.periodEnd)}` : 'Allowance used', to: '/account' }
  else next = { label: facts.activity.vod.reviewsKnown ? 'Review another round' : 'Upload your first round', to: '/vod' }
  return {
    included,
    usage: vod,
    lastReviewAt: facts.activity.vod.lastAt,
    lastMap: facts.activity.vod.lastMap,
    reviewsKnown: facts.activity.vod.reviewsKnown,
    // Analyses are not stored server-side; only usage and review events are.
    historyNote: 'Recon keeps your review count and summary, not the full report. Save anything you want to keep.',
    next,
  }
}

function coachingSection(facts) {
  const plan = facts.billing.plan || 'free'
  const c = facts.activity.coaching
  return {
    available: facts.sources.bookings === 'ok',
    includedPerMonth: facts.billing.hasAccess ? COACHING_SESSIONS_PER_MONTH[plan] || 0 : 0,
    credits: c?.credits ?? null,
    upcoming: (c?.upcoming || []).slice(0, 3).map((s) => ({ id: s.id, startsAt: s.startsAt, status: s.status, type: s.type })),
    completedCount: c?.completedCount ?? null,
    lastCompletedAt: c?.lastCompletedAt ?? null,
    cta: plan === 'champion' || (c?.credits || 0) > 0
      ? { label: 'Book a session', href: '/coaching/index.html#book' }
      : { label: 'See coaching', href: '/coaching/index.html' },
  }
}

function activitySection(facts) {
  const a = facts.activity
  return {
    evidence: a.usageEvidence,
    strategy: { total: a.strategy.total, count7: a.strategy.count7, lastAt: a.strategy.lastAt },
    matchPrep: { total: a.matchPrep.total, count7: a.matchPrep.count7, lastAt: a.matchPrep.lastAt },
    liveCoach: { total: a.liveCoach.total, count7: a.liveCoach.count7, lastAt: a.liveCoach.lastAt },
    liveCoachSessions: a.coaching?.liveSessions ?? null,
  }
}

function skillsSection(facts, focus) {
  const s = facts.skill
  const practice = []
  if (s.coachingDrill?.value) practice.push({ label: String(s.coachingDrill.value), source: 'coached match' })
  const plan = s.vodPracticePlan?.value
  for (const item of (Array.isArray(plan) ? plan : plan ? [plan] : []).slice(0, 2)) {
    practice.push({ label: typeof item === 'string' ? item : String(item?.drill || item?.title || item?.label || ''), source: 'VOD review' })
  }
  const climb = facts.activity.roadToChampion
  if (climb?.currentTier?.nextTask) practice.push({ label: climb.currentTier.nextTask, source: 'Road to Champion' })
  return {
    focus,
    gaps: s.vodWeaknesses.map((w) => ({ label: String(w), source: 'VOD review' })),
    practice: practice.filter((p) => p.label).slice(0, 3),
  }
}

function continueItems(facts) {
  const items = []
  const recent = facts.activity.strategy.recents?.[0] || facts.activity.strategy.lastServer?.ref || null
  if (recent?.mapId && recent?.siteId) {
    items.push({ kind: 'round_plan', mapId: recent.mapId, siteId: recent.siteId, side: recent.side || null, to: `/strats/${recent.mapId}/${recent.siteId}${recent.side ? `/${recent.side}` : ''}` })
  }
  const climb = facts.activity.roadToChampion
  if (climb?.currentTier?.nextTask) {
    items.push({ kind: 'road_to_champion', label: climb.currentTier.nextTask, tier: climb.currentTier.rank, done: climb.currentTier.done, total: climb.currentTier.total, href: '/climb/' })
  }
  if (facts.activity.vod.lastAt) {
    items.push({ kind: 'vod', at: facts.activity.vod.lastAt, map: facts.activity.vod.lastMap, to: '/vod' })
  }
  return items
}

const TOOLS = Object.freeze([
  { id: 'strats', label: 'Round plans', to: '/strats', minPlan: 'free' },
  { id: 'match_prep', label: 'Match prep', to: '/match-prep', minPlan: 'free' },
  { id: 'vod', label: 'VOD review', to: '/vod', minPlan: 'pro' },
  { id: 'climb', label: 'Road to Champion', href: '/climb/', minPlan: 'free' },
  { id: 'live', label: 'Live round guide', to: '/live', minPlan: 'free' },
  { id: 'progress', label: 'Coaching history', to: '/progress', minPlan: 'free' },
])

export function buildHomeView(facts, { lifecycle = null, mode = 'full', feedbackPrompt = null, messages = null } = {}) {
  const b = facts.billing
  // Access follows production rules (a failed or unconfirmed renewal pauses
  // paid features), but the player still sees the plan they pay for.
  const paused = b.status === 'payment_failed' || b.status === 'renewal_unconfirmed'
  // When paused and the paid plan is unknown (lite mode: the account API says
  // "free"), show "Paid membership" rather than "Basic".
  const planUnknown = paused && (!b.lastPaidPlan || b.lastPaidPlan === 'free')
  const displayPlan = paused && !planUnknown ? b.lastPaidPlan : planUnknown ? null : b.plan
  const mission = deriveMission(facts)
  const focus = deriveFocus(facts)
  const activation = deriveActivation(facts)
  const plan = b.plan || 'free'
  const name = facts.identity.firstName || (facts.identity.displayName ? String(facts.identity.displayName) : null)

  return {
    version: HOME_VIEW_VERSION,
    mode,
    generatedAt: facts.generatedAt,
    player: {
      name,
      displayName: facts.identity.displayName,
      platform: facts.identity.platform,
      rank: facts.identity.rank,
      goalRank: facts.identity.goalRank,
      isAdmin: facts.identity.isAdmin,
    },
    membership: {
      available: b.available,
      plan: displayPlan,
      planLabel: b.status === 'admin' ? b.planLabel : planUnknown ? 'Paid membership' : displayPlan ? PLAN_LABEL[displayPlan] : b.planLabel,
      accessPlan: b.plan,
      paused,
      // Complimentary access while a paid subscription is also live: say so,
      // so the player can stop paying if they did not mean to.
      alsoPaying: b.alsoPaying
        ? { planLabel: b.alsoPaying.planLabel, amount: b.alsoPaying.amount, interval: b.alsoPaying.interval }
        : null,
      status: b.status,
      statusLabel: customerStatusLabel(b),
      tone: statusTone(b.status),
      hasAccess: b.hasAccess,
      currentPeriodEnd: b.currentPeriodEnd,
      canManageBilling: Boolean(b.canManageBilling),
      features: b.available && b.hasAccess ? PLAN_FEATURES[plan] || [] : PLAN_FEATURES.free,
      upgrade: upgradeFor(b),
      source: b.source,
    },
    mission,
    focus,
    evidence: deriveEvidence(facts),
    stuck: deriveStuck(facts),
    help: deriveHelp(facts),
    activation: activation.complete ? { ...activation, steps: [] } : activation,
    roadToChampion: facts.activity.roadToChampion
      ? {
        tasksDone: facts.activity.roadToChampion.tasksDone,
        tasksTotal: facts.activity.roadToChampion.tasksTotal,
        tiersComplete: facts.activity.roadToChampion.tiersComplete,
        tiersTotal: facts.activity.roadToChampion.tiersTotal,
        currentTier: facts.activity.roadToChampion.currentTier,
        tiers: facts.activity.roadToChampion.tiers.map(({ id, rank, done, total, complete }) => ({ id, rank, done, total, complete })),
        updatedAt: facts.activity.roadToChampion.updatedAt,
      }
      : null,
    continue: continueItems(facts),
    vod: vodSection(facts),
    coaching: coachingSection(facts),
    activity: activitySection(facts),
    skills: skillsSection(facts, focus),
    messages,
    feedbackPrompt,
    tools: TOOLS.map((tool) => ({ ...tool, locked: !facts.identity.isAdmin && !(b.hasAccess ? hasPlan(plan, tool.minPlan) : tool.minPlan === 'free') })),
    sources: facts.sources,
    // Lifecycle is only attached for internal previews; the customer API strips it.
    lifecycle: lifecycle ? { stage: lifecycle.stage, stageLabel: lifecycle.stageLabel } : null,
  }
}
