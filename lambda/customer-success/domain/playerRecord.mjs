// Admin projections: one summary row per player for lists, and the full
// canonical player record for the player page.

import { deriveActivation } from './activation.mjs'
import { deriveMission } from './mission.mjs'
import { PLAN_LABEL } from './plans.mjs'
import { effectiveConsent } from './outreach.mjs'

const NEXT_ACTION = Object.freeze({
  paid_no_account: { label: 'Restore their login', detail: 'Paying with no site account. Create or resend the invite, then send account help.', automated: false },
  account_setup_incomplete: { label: 'Help them finish first login', detail: 'The invite may have expired. Resend it and send login help.', automated: false },
  disabled: { label: 'Re-enable their login', detail: 'Paying but the Cognito user is disabled.', automated: false },
  renewal_unconfirmed: { label: 'Verify renewal in Stripe', detail: 'If Stripe shows it paid, run the Stripe backfill so access returns.', automated: false },
  payment_failed: { label: 'Watch the payment retry', detail: 'Stripe retries and emails them. The queue escalates after 3 days.', automated: true },
  cancel_scheduled: { label: 'Ask why they are leaving', detail: 'The cancellation prompt asks automatically; reply if they answer.', automated: true },
  inactive_14d: { label: 'Check in personally', detail: 'Paying and quiet for 2+ weeks. Approve the check-in in the queue.', automated: false },
  paid_never_logged_in: { label: 'Nudge first sign-in', detail: 'Sign-in reminder runs automatically.', automated: true },
  not_activated_7d: { label: 'Get them to a first win', detail: 'Activation nudge runs automatically.', automated: true },
  unused_paid_features: { label: 'Show them what they paid for', detail: 'Feature walkthrough runs automatically.', automated: true },
  negative_feedback: { label: 'Reply to their feedback', detail: 'Unhappy feedback in the last 30 days.', automated: false },
  unanswered_message: { label: 'Reply to their message', detail: 'Waiting more than 24 hours.', automated: false },
  duplicate_live_subscriptions: { label: 'Check for a double charge', detail: 'Review invoice history before refunding.', automated: false },
  email_unconfirmed: { label: 'Nothing to do', detail: 'The daily CRM job nudges email confirmation.', automated: true },
})

export function deriveNextAction(facts, lifecycle) {
  const top = lifecycle.risks.find((r) => NEXT_ACTION[r.code])
  if (top) return { code: top.code, ...NEXT_ACTION[top.code] }
  if (lifecycle.stage === 'signed_up' || lifecycle.stage === 'activating') {
    return { code: 'activation', label: 'Nothing to do yet', detail: 'Activation prompts run automatically.', automated: true }
  }
  if (lifecycle.health === 'dormant') {
    return { code: 'dormant', label: 'Win-back eligible', detail: 'Only with marketing consent; the dormant workflow handles it.', automated: true }
  }
  return { code: 'none', label: 'No action needed', detail: null, automated: true }
}

export function buildPlayerSummary(contact, facts, lifecycle) {
  const activation = deriveActivation(facts)
  const b = facts.billing
  const paused = b.status === 'payment_failed' || b.status === 'renewal_unconfirmed'
  const plan = paused && b.lastPaidPlan ? b.lastPaidPlan : b.plan
  const name = [facts.identity.firstName, facts.identity.lastName].filter(Boolean).join(' ') || facts.identity.displayName || null
  return {
    key: contact.contactKey,
    email: facts.identity.email,
    name,
    displayName: facts.identity.displayName,
    platform: facts.identity.platform,
    rank: facts.identity.rank,
    isAdmin: facts.identity.isAdmin,
    plan,
    planLabel: facts.identity.isAdmin ? 'Admin' : plan ? PLAN_LABEL[plan] : 'Unknown',
    billingStatus: b.status,
    hasAccess: b.hasAccess,
    stage: lifecycle.stage,
    stageLabel: lifecycle.stageLabel,
    health: lifecycle.health,
    healthLabel: lifecycle.healthLabel,
    reasons: lifecycle.healthReasons.slice(0, 2),
    accountStatus: facts.account.status,
    createdAt: facts.account.createdAt,
    lastSeenAt: facts.account.lastSeenAt,
    lastActiveAt: facts.activity.lastActiveAt,
    activation: { done: activation.done, total: activation.total, complete: activation.complete },
    nextAction: deriveNextAction(facts, lifecycle),
    monthlyValue: b.isPaidMember && b.amount ? (b.interval === 'year' ? Math.round((b.amount / 12) * 100) / 100 : b.amount) : 0,
    vod: facts.usage.vod
      ? { used: facts.usage.vod.used, limit: facts.usage.vod.limit, lastAt: facts.activity.vod.lastAt }
      : { used: null, limit: null, lastAt: facts.activity.vod.lastAt },
    coaching: facts.activity.coaching
      ? {
        upcoming: (facts.activity.coaching.upcoming || []).length,
        nextAt: facts.activity.coaching.upcoming?.[0]?.startsAt || null,
        completed: facts.activity.coaching.completedCount ?? null,
        credits: facts.activity.coaching.credits ?? null,
        included: facts.usage.coachingSessionsIncluded,
      }
      : null,
    activity: {
      strategy7: facts.activity.strategy.count7,
      matchPrep7: facts.activity.matchPrep.count7,
      liveGuide7: facts.activity.liveCoach.count7,
      activeDays14: facts.activity.activeDays14,
      rtcDone: facts.activity.roadToChampion?.tasksDone ?? null,
      evidence: facts.activity.usageEvidence,
    },
  }
}

export function buildPlayerRecord(contact, facts, lifecycle, { rows = [], cognitoUsers = [], timeline = [], homePreview = null, bookings = [] } = {}) {
  const summary = buildPlayerSummary(contact, facts, lifecycle)
  const activation = deriveActivation(facts)
  const b = facts.billing
  return {
    summary,
    identity: {
      reconPlayerId: facts.identity.reconPlayerId,
      email: facts.identity.email,
      firstName: facts.identity.firstName,
      lastName: facts.identity.lastName,
      displayName: facts.identity.displayName,
      platform: facts.identity.platform,
      region: facts.identity.region,
      discord: facts.identity.discord,
      ubisoftUsername: facts.identity.ubisoftUsername,
      rank: facts.identity.rank,
      goalRank: facts.identity.goalRank,
      mainRole: facts.identity.mainRole,
      referralSource: facts.identity.referralSource,
      referralCode: facts.identity.referralCode,
      referredBy: facts.identity.referredBy,
    },
    access: {
      status: facts.account.status,
      cognitoUsers: cognitoUsers.map((u) => ({ email: u.email, status: u.status, enabled: u.enabled, createdAt: u.createdAt })),
      createdAt: facts.account.createdAt,
      lastSeenAt: facts.account.lastSeenAt,
      hasProfileRow: facts.account.hasProfileRow,
      profileComplete: facts.account.profileComplete,
      problems: lifecycle.risks.filter((r) => ['paid_no_account', 'account_setup_incomplete', 'account_disabled', 'paid_never_logged_in', 'email_unconfirmed', 'renewal_unconfirmed', 'payment_failed'].includes(r.code)),
    },
    billing: {
      ...b,
      rows: rows.map((r) => ({
        stripeCustomerId: r.stripe_customer_id,
        plan: r.plan,
        priceId: r.price_id || null,
        status: r.status,
        comp: r.comp === true,
        trial: r.trial === true,
        tierScope: r.tier_scope || null,
        currentPeriodEnd: r.current_period_end || null,
        createdAt: r.created_at || null,
        updatedAt: r.updated_at || null,
      })),
      note: 'From the webhook ledger. Cancellation schedules and invoice history live only in Stripe; use the live Stripe check for those.',
    },
    lifecycle,
    activation,
    usage: facts.usage,
    activity: facts.activity,
    skill: facts.skill,
    coaching: { summary: facts.activity.coaching, bookings: bookings.slice(0, 10) },
    roadToChampion: facts.activity.roadToChampion,
    referrals: facts.referrals,
    legacyOutreach: facts.legacyOutreach,
    cs: {
      consent: effectiveConsent(facts.cs.consent),
      messages: facts.cs.messages.slice(-50).map((m) => ({ id: m.messageId, direction: m.direction, channel: m.channel, status: m.status, subject: m.subject || null, preview: m.bodyPreview, at: m.createdAt, answeredAt: m.answeredAt || null })),
      outreach: facts.cs.outreach.map((o) => ({ key: o.outreachKey, workflowName: o.workflowName, channel: o.channel, status: o.status, statusReason: o.statusReason || null, triggerReason: o.triggerReason, at: o.updatedAt || o.createdAt })),
      feedback: facts.cs.feedback,
      decisions: facts.cs.decisions,
    },
    customerMission: deriveMission(facts),
    timeline,
    homePreview,
    sources: facts.sources,
  }
}
