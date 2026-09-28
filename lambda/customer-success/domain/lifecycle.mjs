// Lifecycle stage and customer health, derived only from facts.
//
// Stages (in journey order):
//   signed_up   - account exists, no sign of use yet
//   activating  - has signed in / started, but not activated
//   activated   - profile complete AND at least one core coaching action
//   engaged     - activated AND active on 3+ distinct days in the last 14
//   paid        - has access through a Stripe-billed membership, no risks
//   at_risk     - paying (or payment retrying) with at least one risk fact
//   churned     - paid before, no access now, subscription ended
//
// Health is separate from stage: it answers "does anyone need to act?" and
// always carries the facts that produced it. Unknown data yields "unknown",
// never a guess.

import { toMs } from './facts.mjs'

const DAY = 86400000

export const STAGES = Object.freeze(['signed_up', 'activating', 'activated', 'engaged', 'paid', 'at_risk', 'churned'])

export const STAGE_LABEL = Object.freeze({
  signed_up: 'Signed up',
  activating: 'Activating',
  activated: 'Activated',
  engaged: 'Engaged',
  paid: 'Paid',
  at_risk: 'At risk',
  churned: 'Churned',
})

export const STAGE_DEFINITION = Object.freeze({
  signed_up: 'Account exists. No sign-in activity or product use recorded yet.',
  activating: 'Has signed in or started setup, but has not finished the profile and a first coaching action.',
  activated: 'Profile complete and at least one core action (round plan, match prep, VOD review, Road to Champion, coaching).',
  engaged: 'Activated and active on 3+ separate days in the last 14 days.',
  paid: 'Has access through a Stripe-billed membership and no risk signals.',
  at_risk: 'Paying (or payment retrying) with at least one risk signal that needs attention.',
  churned: 'Paid before, no longer has access, and the subscription ended.',
})

export const HEALTH = Object.freeze(['healthy', 'needs_attention', 'at_risk', 'critical', 'dormant', 'churned', 'unknown'])

export const HEALTH_LABEL = Object.freeze({
  healthy: 'Healthy',
  needs_attention: 'Needs attention',
  at_risk: 'At risk',
  critical: 'Critical',
  dormant: 'Dormant',
  churned: 'Churned',
  unknown: 'Unknown',
})

// Severity: critical > high > medium > low.
const SEVERITY_RANK = { critical: 3, high: 2, medium: 1, low: 0 }

function daysSince(iso, now) {
  const ms = toMs(iso)
  return Number.isFinite(ms) ? Math.floor((now - ms) / DAY) : null
}

function fmtDate(iso) {
  return iso ? String(iso).slice(0, 10) : 'unknown date'
}

function risk(code, severity, reason, evidence = []) {
  return { code, severity, reason, evidence }
}

export function isActivated(facts) {
  return facts.account.profileComplete === true && facts.activity.hasCoreAction === true
}

export function isEngaged(facts) {
  return isActivated(facts) && facts.activity.activeDays14 >= 3
}

function hasStarted(facts) {
  return Boolean(
    facts.account.lastSeenAt ||
    facts.account.hasProfileRow ||
    facts.activity.hasCoreAction ||
    facts.cs.feedback.length ||
    facts.cs.messages.some((m) => m.direction === 'inbound'),
  )
}

// Billing risks apply to anyone with a paid relationship that is still alive.
function billingRisks(facts, now) {
  const b = facts.billing
  const out = []
  if (!b.available) return out
  if (b.status === 'payment_failed') {
    out.push(risk('payment_failed', 'critical', `Last payment failed (${b.paymentIssue}). Access is paused until the card is updated.`, [
      `Ledger status ${b.rowStatus} for ${b.lastPaidPlan ? b.lastPaidPlan : 'membership'}${b.currentPeriodEnd ? `, period end ${fmtDate(b.currentPeriodEnd)}` : ''}`,
    ]))
  }
  if (b.status === 'renewal_unconfirmed') {
    const missingDate = b.staleReason === 'missing_period_end'
    out.push(risk('renewal_unconfirmed', 'critical', missingDate
      ? 'Stripe status is live but no paid-through date is recorded, so production blocks paid features. The player may be paying but locked out.'
      : 'Paid-through date passed with no renewal recorded. The player may be paying but locked out.', [
      missingDate ? `Ledger says ${b.rowStatus} with no paid-through date` : `Ledger says ${b.rowStatus} until ${fmtDate(b.currentPeriodEnd)}`,
      'Verify the subscription in Stripe before contacting the player',
    ]))
  }
  if (b.alsoPaying) {
    const price = b.alsoPaying.amount ? ` at $${b.alsoPaying.amount}/${b.alsoPaying.interval === 'year' ? 'yr' : 'mo'}` : ''
    out.push(risk('comp_with_paid_subscription', 'medium', 'Has complimentary access and is also paying for a subscription on the same email.', [
      `Live paid ${b.alsoPaying.planLabel} subscription${price}`,
      `Access currently comes from the ${b.status === 'trialing' ? 'no-card trial' : 'complimentary'} row`,
    ]))
  }
  if (b.hasAccess && b.paymentIssueRows > 0 && b.status !== 'payment_failed') {
    out.push(risk('secondary_payment_failed', 'medium', 'Another subscription on this email has a failed payment.', [`${b.paymentIssueRows} row(s) past due or unpaid`]))
  }
  if (b.status === 'cancelling') {
    out.push(risk('cancel_scheduled', 'high', `Cancellation scheduled; access ends ${fmtDate(b.currentPeriodEnd)}.`, ['cancel_at_period_end is set']))
  }
  if (b.duplicateLiveRows) {
    out.push(risk('duplicate_live_subscriptions', 'medium', 'More than one live Stripe subscription on this email. Check invoice history before refunding anything.', [`${b.liveRowCount} live rows`]))
  }
  if (b.labelMismatch) {
    out.push(risk('plan_label_mismatch', 'low', `Ledger label "${b.labelPlan}" disagrees with the price's plan "${b.pricePlan}". Access follows production rules.`, [b.priceId || 'no price id']))
  }
  void now
  return out
}

function accessRisks(facts, now) {
  const out = []
  const b = facts.billing
  const paidAlive = b.available && (b.isPaidMember || b.status === 'payment_failed' || b.status === 'renewal_unconfirmed')
  const status = facts.account.status
  if (!paidAlive) {
    const age = daysSince(facts.account.createdAt, now)
    if (status === 'unconfirmed' && age !== null && age >= 2) {
      out.push(risk('email_unconfirmed', 'low', 'Signed up but never entered the email confirmation code.', [`Cognito status UNCONFIRMED for ${age} days`]))
    }
    return out
  }
  if (status === 'no_account') {
    out.push(risk('paid_no_account', 'critical', 'Paying for a membership with no site login. They cannot open what they bought.', ['No Cognito user for this email']))
  } else if (status === 'force_change_password' || status === 'unconfirmed' || status === 'reset_required') {
    out.push(risk('account_setup_incomplete', 'critical', 'Paying, but the login was never finished, so the account cannot be used yet.', [`Cognito status ${status.toUpperCase()}`]))
  } else if (status === 'disabled') {
    out.push(risk('account_disabled', 'critical', 'Paying, but the login is disabled.', ['Cognito user disabled']))
  }
  if (status === 'ok' && !facts.account.lastSeenAt && facts.account.hasProfileRow === false) {
    const age = daysSince(facts.account.createdAt, now)
    if (age === null || age >= 2) {
      out.push(risk('paid_never_logged_in', 'high', 'Paying, but has never opened the app.', ['No profile row and no last-seen time recorded']))
    }
  }
  return out
}

function usageRisks(facts, now) {
  const out = []
  const b = facts.billing
  if (!b.available || !b.isPaidMember) return out
  const lastActive = daysSince(facts.activity.lastActiveAt, now)
  const tenure = daysSince(facts.account.createdAt, now)
  if (lastActive !== null && lastActive >= 14 && facts.account.lastSeenAt) {
    out.push(risk('inactive_14d', 'high', `No activity for ${lastActive} days while paying.`, [`Last activity ${fmtDate(facts.activity.lastActiveAt)}`]))
  }
  if (!isActivated(facts) && (tenure === null || tenure >= 7) && facts.account.lastSeenAt) {
    const missing = []
    if (!facts.account.profileComplete) missing.push('profile incomplete')
    if (!facts.activity.hasCoreAction) missing.push('no core coaching action recorded')
    out.push(risk('not_activated_7d', 'medium', 'Paid for 7+ days without activating.', missing))
  }
  if (isActivated(facts) && (tenure === null || tenure >= 14)) {
    const unused = []
    if ((b.plan === 'elite' || b.plan === 'champion') && facts.usage.vod && facts.usage.vod.used === 0 && !facts.activity.vod.reviewsKnown) {
      unused.push('No VOD reviews used this period')
    }
    const coaching = facts.activity.coaching
    if (b.plan === 'champion' && coaching && coaching.bookedThisMonth === 0) {
      unused.push('No coaching session booked in the last 30 days (2 included per month)')
    }
    if (unused.length) out.push(risk('unused_paid_features', 'medium', 'Paying for features they are not using.', unused))
  }
  return out
}

function relationshipRisks(facts, now) {
  const out = []
  const recentNegative = facts.cs.feedback.filter((f) => {
    const age = daysSince(f.createdAt, now)
    const negative = (Number.isFinite(f.answers?.helpful) && f.answers.helpful <= 2) || (Number.isFinite(f.answers?.nps) && f.answers.nps <= 6)
    return negative && age !== null && age <= 30 && f.status !== 'resolved'
  })
  if (recentNegative.length) {
    out.push(risk('negative_feedback', 'medium', 'Recent unhappy feedback that has not been resolved.', recentNegative.slice(0, 2).map((f) => `${fmtDate(f.createdAt)}: ${f.moment}`)))
  }
  const waiting = facts.cs.messages
    .filter((m) => m.direction === 'inbound' && !m.answeredAt)
    .filter((m) => {
      const age = toMs(m.createdAt)
      return Number.isFinite(age) && now - age > DAY
    })
  if (waiting.length) {
    out.push(risk('unanswered_message', 'medium', 'Player message waiting more than 24 hours for a reply.', [`${waiting.length} message(s), oldest ${fmtDate(waiting[waiting.length - 1]?.createdAt)}`]))
  }
  return out
}

export function deriveLifecycle(facts, now = facts.now || Date.now()) {
  const b = facts.billing
  const risks = [...billingRisks(facts, now), ...accessRisks(facts, now), ...usageRisks(facts, now), ...relationshipRisks(facts, now)]
  risks.sort((a, b2) => SEVERITY_RANK[b2.severity] - SEVERITY_RANK[a.severity])

  const activated = isActivated(facts)
  const engaged = isEngaged(facts)
  const paidAlive = b.available && (b.isPaidMember || b.status === 'payment_failed' || b.status === 'renewal_unconfirmed')

  let stage
  const reasons = []
  if (facts.identity.isAdmin) {
    stage = 'engaged'
    reasons.push('Admin account (excluded from customer metrics)')
  } else if (b.available && b.churned) {
    stage = 'churned'
    reasons.push(`Last paid plan ${b.lastPaidPlan || 'unknown'} ended ${fmtDate(b.currentPeriodEnd)}`)
  } else if (paidAlive) {
    const commercial = risks.filter((r) => r.severity === 'critical' || r.severity === 'high' || r.code === 'not_activated_7d' || r.code === 'unused_paid_features' || r.code === 'negative_feedback')
    stage = commercial.length ? 'at_risk' : 'paid'
    reasons.push(`${b.planLabel || b.lastPaidPlan} membership (${b.status})`)
    if (commercial.length) reasons.push(...commercial.map((r) => r.reason))
  } else if (engaged) {
    stage = 'engaged'
    reasons.push(`Active on ${facts.activity.activeDays14} day(s) in the last 14`)
  } else if (activated) {
    stage = 'activated'
    reasons.push('Profile complete and at least one core action')
  } else if (hasStarted(facts)) {
    stage = 'activating'
    if (!facts.account.profileComplete) reasons.push('Profile not complete')
    if (!facts.activity.hasCoreAction) reasons.push('No core coaching action yet')
  } else {
    stage = 'signed_up'
    reasons.push('No sign-in or usage recorded yet')
  }

  // Health
  let health
  const top = risks[0]
  if (facts.identity.isAdmin) health = 'healthy'
  else if (!b.available) health = 'unknown'
  else if (stage === 'churned') health = 'churned'
  else if (top && top.severity === 'critical') health = 'critical'
  else if (top && top.severity === 'high') health = 'at_risk'
  else if (top && top.severity === 'medium') health = 'needs_attention'
  else {
    const idle = daysSince(facts.activity.lastActiveAt, now)
    const tenure = daysSince(facts.account.createdAt, now)
    if (!paidAlive && activated && idle !== null && idle >= 30) health = 'dormant'
    else if (!paidAlive && !activated && tenure !== null && tenure >= 7 && hasStarted(facts)) health = 'needs_attention'
    else if (!paidAlive && !hasStarted(facts) && tenure !== null && tenure >= 14) health = 'dormant'
    else health = 'healthy'
  }

  const healthReasons = risks.length
    ? risks.map((r) => r.reason)
    : health === 'dormant'
      ? [`No activity for ${daysSince(facts.activity.lastActiveAt || facts.account.createdAt, now) ?? 'many'} days`]
      : health === 'needs_attention'
        ? ['Signed up 7+ days ago and has not activated']
        : health === 'unknown'
          ? ['Billing records could not be read, so health cannot be judged']
          : []

  return {
    stage,
    stageLabel: STAGE_LABEL[stage],
    stageReasons: reasons,
    activated,
    engaged,
    health,
    healthLabel: HEALTH_LABEL[health],
    healthReasons,
    risks,
  }
}
