// Business overview aggregates for the CRM. Every number is a count of
// real records; ratios carry their denominators so small samples are obvious.

import { STAGES, STAGE_DEFINITION, STAGE_LABEL, HEALTH, HEALTH_LABEL } from './lifecycle.mjs'
import { toMs } from './facts.mjs'

const DAY = 86400000

export function ratio(numerator, denominator) {
  return { numerator, denominator, pct: denominator ? Math.round((numerator / denominator) * 1000) / 10 : null }
}

export function buildOverview(entries, { now = Date.now(), queue = null, sourceStatus = {} } = {}) {
  const customers = entries.filter((e) => !e.facts.identity.isAdmin)
  const byStage = Object.fromEntries(STAGES.map((s) => [s, 0]))
  const byHealth = Object.fromEntries(HEALTH.map((h) => [h, 0]))
  const payingByPlan = { pro: 0, elite: 0, champion: 0 }
  let ledgerMrr = 0
  let unknownPrice = 0
  const billing = { paymentFailed: 0, renewalUnconfirmed: 0, duplicates: 0, comps: 0, trials: 0, churned30: 0 }

  let signedUp30 = 0
  let activated30 = 0
  for (const { facts, lifecycle, summary } of customers) {
    byStage[lifecycle.stage] += 1
    byHealth[lifecycle.health] += 1
    const b = facts.billing
    if (b.isPaidMember && payingByPlan[b.plan] !== undefined) {
      payingByPlan[b.plan] += 1
      if (summary.monthlyValue) ledgerMrr += summary.monthlyValue
      else unknownPrice += 1
    }
    if (b.status === 'payment_failed') billing.paymentFailed += 1
    if (b.status === 'renewal_unconfirmed') billing.renewalUnconfirmed += 1
    if (b.duplicateLiveRows) billing.duplicates += 1
    if (b.status === 'comp') billing.comps += 1
    if (b.status === 'trialing') billing.trials += 1
    if (b.churned && now - toMs(b.currentPeriodEnd) <= 30 * DAY) billing.churned30 += 1
    const created = toMs(facts.account.createdAt)
    if (Number.isFinite(created) && now - created <= 30 * DAY) {
      signedUp30 += 1
      if (lifecycle.activated) activated30 += 1
    }
  }

  const feedback = customers.flatMap(({ facts, summary }) => facts.cs.feedback.map((f) => ({ ...f, player: { key: summary.key, name: summary.name } })))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  const unanswered = customers.reduce((n, { facts }) => n + facts.cs.messages.filter((m) => m.direction === 'inbound' && !m.answeredAt).length, 0)

  return {
    generatedAt: new Date(now).toISOString(),
    totals: { players: customers.length, paying: payingByPlan.pro + payingByPlan.elite + payingByPlan.champion },
    stages: STAGES.map((s) => ({ stage: s, label: STAGE_LABEL[s], count: byStage[s], definition: STAGE_DEFINITION[s] })),
    health: HEALTH.map((h) => ({ health: h, label: HEALTH_LABEL[h], count: byHealth[h] })),
    activation30: ratio(activated30, signedUp30),
    payingByPlan,
    ledgerMrr: Math.round(ledgerMrr * 100) / 100,
    unknownPriceMembers: unknownPrice,
    billing,
    queue: queue ? { total: queue.total, byType: queue.byType, autoHandled: queue.autoHandled } : null,
    recentFeedback: feedback.slice(0, 5),
    unansweredMessages: unanswered,
    sourceStatus,
    notes: [
      'Stages and health are derived from recorded facts on every load; nothing is hand-entered.',
      'Ledger MRR uses the webhook ledger and known Stripe prices. The live Stripe check in Billing is the authority for revenue.',
    ],
  }
}
