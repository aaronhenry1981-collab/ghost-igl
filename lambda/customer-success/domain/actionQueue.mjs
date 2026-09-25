// Action queue: ONLY items that need a human decision.
//
// Every item says what happened, why it was flagged (the facts), what we
// recommend, and which controls apply. Routine signals are handled by
// automation and only counted ("auto-handled"), so the queue stays short.
//
// Items are keyed by an occurrence fingerprint. Once decided, the same
// occurrence never re-appears; a NEW occurrence (e.g. a later failed payment)
// does.

import { toMs } from './facts.mjs'
import { checkEligibility, workflowForQueueType } from './outreach.mjs'

const DAY = 86400000

export const QUEUE_RULES = Object.freeze({
  paid_no_account: {
    severity: 'critical',
    title: 'Paying, but has no site login',
    recommended: 'Create or resend their login invite, then send the account-help message so they can open what they bought.',
    controls: ['approve', 'fix', 'dismiss'],
    approveLabel: 'Draft account-help message',
  },
  account_setup_incomplete: {
    severity: 'critical',
    title: 'Paying, first login never finished',
    recommended: 'Send first-login help. The invite email may have expired or landed in spam.',
    controls: ['approve', 'fix', 'dismiss'],
    approveLabel: 'Draft login-help message',
  },
  renewal_unconfirmed: {
    severity: 'critical',
    title: 'Renewal not recorded; player may be locked out',
    recommended: 'Check the subscription in Stripe. If it renewed, run the Stripe backfill so access returns, then mark fixed.',
    controls: ['fix', 'dismiss'],
  },
  payment_failed_persistent: {
    severity: 'high',
    title: 'Payment still failing after 3 days',
    recommended: 'Stripe keeps retrying and emails the customer. Approve one short card-update reminder from Recon.',
    controls: ['approve', 'deny', 'dismiss'],
    approveLabel: 'Queue card-update reminder',
  },
  at_risk_checkin: {
    severity: 'high',
    title: 'Paying subscriber has gone quiet',
    recommended: 'Send a personal check-in with one specific next step based on their last activity.',
    controls: ['approve', 'deny', 'dismiss'],
    approveLabel: 'Draft check-in',
  },
  negative_feedback: {
    severity: 'medium',
    title: 'Unhappy feedback needs a reply',
    recommended: 'Reply personally, and note what will change.',
    controls: ['approve', 'fix', 'dismiss'],
    approveLabel: 'Draft reply',
  },
  unanswered_message: {
    severity: 'medium',
    title: 'Player message waiting for a reply',
    recommended: 'Reply in Conversations.',
    controls: ['fix', 'dismiss'],
  },
  duplicate_live_subscriptions: {
    severity: 'medium',
    title: 'Two live subscriptions on one email',
    recommended: 'Check invoice history in Stripe before refunding anything. A create-then-cycle pattern is a real customer, not a duplicate.',
    controls: ['fix', 'dismiss'],
  },
  comp_with_paid_subscription: {
    severity: 'medium',
    title: 'Paying while on complimentary access',
    recommended: 'Decide whether they should keep paying while the comp is on. Change it in Stripe or end the comp, then mark fixed.',
    controls: ['fix', 'dismiss'],
  },
  coaching_followup: {
    severity: 'medium',
    title: 'Coaching session recap to send',
    recommended: 'Replace the placeholder with the one thing to drill from the session, then approve.',
    controls: ['approve', 'deny', 'dismiss'],
    approveLabel: 'Approve recap',
  },
})

// Risk codes that automation (in-product prompts, the existing daily CRM job,
// or approved workflow templates) handles without a person.
export const AUTO_HANDLED = Object.freeze({
  payment_failed: 'In-product notice; Stripe retries and emails. Escalates to the queue after 3 days.',
  paid_never_logged_in: 'Sign-in reminder workflow (existing account).',
  not_activated_7d: 'Activation nudge workflow.',
  unused_paid_features: '"What you paid for" workflow.',
  email_unconfirmed: 'Confirmation nudges from the existing daily CRM job.',
  cancel_scheduled: 'Cancellation feedback prompt.',
  plan_label_mismatch: 'Shown on the player record; access follows production rules.',
  secondary_payment_failed: 'Shown on the player record.',
})

const SEVERITY_RANK = { critical: 3, high: 2, medium: 1, low: 0 }

function day(iso) {
  return iso ? String(iso).slice(0, 10) : 'unknown'
}

function playerRef(summary) {
  return {
    key: summary.key,
    name: summary.name,
    email: summary.email,
    planLabel: summary.planLabel,
    stageLabel: summary.stageLabel,
    healthLabel: summary.healthLabel,
  }
}

export function queueItemsFor(summary, facts, lifecycle, now = facts.now || Date.now()) {
  const items = []
  const risks = new Map(lifecycle.risks.map((r) => [r.code, r]))
  const b = facts.billing
  const add = (type, fingerprint, whatHappened, whyFlagged, detectedAt) => {
    const rule = QUEUE_RULES[type]
    const key = `${type}:${summary.key}:${fingerprint}`
    const workflow = rule.controls.includes('approve') ? workflowForQueueType(type) : null
    const eligibility = workflow ? checkEligibility(workflow, facts, { now, instance: key }) : null
    items.push({
      key,
      type,
      severity: rule.severity,
      title: rule.title,
      player: playerRef(summary),
      whatHappened,
      whyFlagged,
      recommended: rule.recommended,
      controls: rule.controls,
      approveLabel: rule.approveLabel || null,
      detectedAt: detectedAt || null,
      draft: workflow ? { ...workflow.render(facts), channel: workflow.channel, workflow: workflow.name } : null,
      approveBlockedBy: eligibility && !eligibility.ok ? eligibility.reason : null,
    })
  }

  if (risks.has('paid_no_account')) {
    add('paid_no_account', b.stripeCustomerId || 'unknown', `Has an active ${b.planLabel} subscription but no Recon login.`, risks.get('paid_no_account').evidence, b.asOf)
  }
  if (risks.has('account_setup_incomplete')) {
    add('account_setup_incomplete', day(facts.account.createdAt), `Bought ${b.planLabel} but never completed the first sign-in.`, risks.get('account_setup_incomplete').evidence, facts.account.createdAt)
  }
  if (risks.has('renewal_unconfirmed')) {
    add('renewal_unconfirmed', b.staleReason === 'missing_period_end' ? `nodate:${b.stripeCustomerId || 'unknown'}` : day(b.currentPeriodEnd), b.staleReason === 'missing_period_end'
      ? 'Subscription is live in the ledger but has no paid-through date, so paid features are paused.'
      : `Paid-through date ${day(b.currentPeriodEnd)} passed with no renewal recorded, so paid features are paused.`, risks.get('renewal_unconfirmed').evidence, b.currentPeriodEnd || b.asOf)
  }
  if (risks.has('payment_failed')) {
    // Stripe retries and emails the customer first; escalate after 3 days.
    // The start date is estimated from the billing period (updated_at moves
    // on every retry), and the item says which basis it used.
    const since = toMs(b.paymentIssueSince)
    if (Number.isFinite(since) && now - since >= 3 * DAY) {
      const planName = b.lastPaidPlan ? `${b.lastPaidPlan[0].toUpperCase()}${b.lastPaidPlan.slice(1)}` : 'Membership'
      const when = b.paymentIssueSinceBasis === 'last_ledger_update' ? `(last Stripe update ${day(b.paymentIssueSince)})` : `since about ${day(b.paymentIssueSince)}`
      add('payment_failed_persistent', `${day(b.currentPeriodEnd)}:${b.rowStatus}`, `${planName} payment has been failing ${when}.`, risks.get('payment_failed').evidence, b.paymentIssueSince)
    }
  }
  if (risks.has('inactive_14d') || (risks.has('cancel_scheduled') && lifecycle.stage === 'at_risk')) {
    const r = risks.get('inactive_14d') || risks.get('cancel_scheduled')
    const extra = lifecycle.risks.filter((x) => x.code === 'unused_paid_features' || x.code === 'negative_feedback').map((x) => x.reason)
    add('at_risk_checkin', day(facts.activity.lastActiveAt), r.reason, [...r.evidence, ...extra], facts.activity.lastActiveAt)
  }
  for (const f of facts.cs.feedback) {
    const negative = (Number.isFinite(f.answers?.helpful) && f.answers.helpful <= 2) || (Number.isFinite(f.answers?.nps) && f.answers.nps <= 6)
    if (negative && f.status !== 'resolved' && now - toMs(f.createdAt) <= 30 * DAY) {
      const quote = f.answers?.confusing || f.answers?.missing || f.answers?.comment || null
      add('negative_feedback', f.feedbackId, `Rated ${Number.isFinite(f.answers?.helpful) ? `helpfulness ${f.answers.helpful}/5` : ''}${Number.isFinite(f.answers?.helpful) && Number.isFinite(f.answers?.nps) ? ', ' : ''}${Number.isFinite(f.answers?.nps) ? `recommend ${f.answers.nps}/10` : ''} (${f.moment}).`, quote ? [`"${String(quote).slice(0, 180)}"`] : ['No written comment'], f.createdAt)
    }
  }
  for (const m of facts.cs.messages) {
    if (m.direction === 'inbound' && !m.answeredAt && now - toMs(m.createdAt) > DAY) {
      add('unanswered_message', m.messageId, 'Sent a message more than 24 hours ago with no reply yet.', [m.subject || m.bodyPreview || 'Message'], m.createdAt)
    }
  }
  if (risks.has('duplicate_live_subscriptions')) {
    add('duplicate_live_subscriptions', `${b.liveRowCount}:${day(b.currentPeriodEnd)}`, `${b.liveRowCount} live Stripe subscriptions on one email.`, risks.get('duplicate_live_subscriptions').evidence, b.asOf)
  }
  if (risks.has('comp_with_paid_subscription')) {
    add('comp_with_paid_subscription', b.alsoPaying?.stripeCustomerId || 'unknown', risks.get('comp_with_paid_subscription').reason, risks.get('comp_with_paid_subscription').evidence, b.asOf)
  }
  // Personal recap after a completed coaching session. It needs Aaron's words
  // (the draft has a placeholder), so it is approved here rather than sent by
  // the scheduled run.
  const completed = coachingRecapDue(facts, now)
  if (completed) {
    add('coaching_followup', String(completed).slice(0, 16), `Coaching session completed ${day(completed)}.`, ['Recap window: 12 hours to 3 days after the session'], completed)
  }
  return items
}

export function coachingRecapDue(facts, now = facts.now || Date.now()) {
  const at = toMs(facts.activity.coaching?.lastCompletedAt)
  if (!Number.isFinite(at)) return null
  const days = (now - at) / DAY
  return days >= 0.5 && days <= 3 ? facts.activity.coaching.lastCompletedAt : null
}

// Build the queue across all players, removing already-decided occurrences.
export function buildQueue(entries, now = Date.now()) {
  const items = []
  const auto = {}
  for (const { summary, facts, lifecycle } of entries) {
    if (facts.identity.isAdmin) continue
    const decided = new Set(facts.cs.decisions.map((d) => d.itemKey))
    for (const item of queueItemsFor(summary, facts, lifecycle, now)) {
      if (!decided.has(item.key)) items.push(item)
    }
    for (const r of lifecycle.risks) {
      if (AUTO_HANDLED[r.code]) auto[r.code] = (auto[r.code] || 0) + 1
    }
  }
  items.sort((a, b) => (SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]) || String(a.detectedAt || '').localeCompare(String(b.detectedAt || '')))
  const byType = {}
  for (const item of items) byType[item.type] = (byType[item.type] || 0) + 1
  return {
    items,
    total: items.length,
    byType,
    autoHandled: Object.entries(auto).map(([code, count]) => ({ code, count, how: AUTO_HANDLED[code] })),
  }
}

export const DECISIONS = Object.freeze(['approve', 'deny', 'dismiss', 'fix'])
