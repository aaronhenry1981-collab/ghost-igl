// Entitlement operator view (ARCHITECTURE §7.2) and the entitlement panel.
//
// Read-only. Access is decided ONLY by PR #24 `resolveBilling` (production
// parity); this file never calls Stripe, never imports webhook code and never
// repairs anything. A suspected mismatch names the rule that raised it; any
// change is an action request a lead authorizes and the billing system runs.

import { createPlanCatalog, effectivePlan, isActiveSub, PLAN_LABEL, pickBestSub, resolveBilling } from '../../domain/plans.mjs'
import { canSeeBilling, dateOnly, fact, inference, isoOrNull, maskId, NOT_RECORDED, normalizeRoles, panel, sourceData, sourceStatus, toMs } from './shared.mjs'

const DEFAULT_CATALOG = createPlanCatalog()
// Statuses under which Stripe still bills the subscription.
const STRIPE_LIVE = new Set(['active', 'trialing', 'past_due'])

export const MISMATCH_RULES = Object.freeze({
  paid_live_identity_unbound: 'A live paid row is not bound to a Recon login (no cognito_sub, or bound to a different login).',
  multiple_live_paid_rows: 'More than one live paid subscription row on this email.',
  live_status_past_period_end: 'A row says active/trialing but its paid-through date has passed or is missing.',
  past_due_access_granted: 'A row is past_due while the access decision is still true.',
  missing_subscription_id: 'A Stripe-billed row has no stripe_subscription_id.',
})

function isStripeBilledRow(row) {
  return Boolean(row && row.comp !== true && String(row.stripe_customer_id || '').startsWith('cus_'))
}

function rowRef(row, showFull) {
  const customer = row.stripe_customer_id || null
  const subscription = row.stripe_subscription_id || null
  return {
    customerId: showFull ? customer : maskId(customer),
    subscriptionId: subscription ? (showFull ? subscription : maskId(subscription)) : null,
    priceId: row.price_id || null,
    ledgerPlan: row.plan || null,
    ledgerStatus: row.status || null,
    currentPeriodEnd: isoOrNull(row.current_period_end),
    comp: row.comp === true,
    trial: row.trial === true,
    identityBound: Boolean(row.cognito_sub),
  }
}

function checkedAt(row) {
  if (!row) return { stateFetchedAt: NOT_RECORDED, appliedSeq: NOT_RECORDED }
  return {
    stateFetchedAt: isoOrNull(row.state_fetched_at) || NOT_RECORDED,
    appliedSeq: row.applied_seq === undefined || row.applied_seq === null || row.applied_seq === '' ? NOT_RECORDED : row.applied_seq,
  }
}

export function entitlementView({ rows = [], profile = null, cognitoUser = null, catalog = DEFAULT_CATALOG, now = Date.now(), roles = [] } = {}) {
  const list = Array.isArray(rows) ? rows.filter(Boolean) : []
  const showFull = canSeeBilling(normalizeRoles(roles))
  const cat = catalog || DEFAULT_CATALOG
  const billing = resolveBilling(list, { catalog: cat, now })
  const best = pickBestSub(list, { catalog: cat, now })
  const plan = billing.hasAccess ? billing.plan : billing.lastPaidPlan || null

  // ---- identity binding --------------------------------------------------
  const loginSub = cognitoUser?.sub || null
  const profileSub = profile?.cognito_sub || null
  const paidRows = list.filter(isStripeBilledRow)
  const liveStripeRows = paidRows.filter((row) => STRIPE_LIVE.has(row.status))
  const boundRows = list.filter((row) => row.cognito_sub)
  const foreignRows = loginSub ? boundRows.filter((row) => row.cognito_sub !== loginSub) : []
  let bindingState
  if (!list.length) bindingState = 'no_rows'
  else if (foreignRows.length) bindingState = 'mismatch'
  else if (boundRows.length === list.length) bindingState = 'bound'
  else if (boundRows.length) bindingState = 'partial'
  else bindingState = 'unbound'

  // ---- mismatch rules ----------------------------------------------------------
  const mismatches = []
  const add = (ruleId, detail, count = 1) => mismatches.push({ ruleId, rule: MISMATCH_RULES[ruleId], detail, count })
  const unboundLive = liveStripeRows.filter((row) => !row.cognito_sub || (loginSub && row.cognito_sub !== loginSub))
  if (unboundLive.length) {
    const foreign = unboundLive.filter((row) => row.cognito_sub).length
    add('paid_live_identity_unbound', foreign
      ? `${unboundLive.length} live paid row(s) not bound to this login (${foreign} bound to a different login)`
      : `${unboundLive.length} live paid row(s) with no cognito_sub`, unboundLive.length)
  }
  if (liveStripeRows.length > 1) add('multiple_live_paid_rows', `${liveStripeRows.length} live paid rows (${liveStripeRows.map((r) => r.status).join(', ')})`, liveStripeRows.length)
  const pastEnd = list.filter((row) => (row.status === 'active' || row.status === 'trialing') && !isActiveSub(row, now))
  if (pastEnd.length) {
    const missing = pastEnd.filter((row) => !Number.isFinite(toMs(row.current_period_end))).length
    add('live_status_past_period_end', missing
      ? `${pastEnd.length} active/trialing row(s); ${missing} with no paid-through date`
      : `${pastEnd.length} active/trialing row(s) paid through ${pastEnd.map((r) => dateOnly(r.current_period_end)).join(', ')}`, pastEnd.length)
  }
  const pastDue = list.filter((row) => row.status === 'past_due')
  if (pastDue.length && billing.hasAccess) add('past_due_access_granted', `${pastDue.length} past_due row(s) while access is granted by another row`, pastDue.length)
  const noSubId = paidRows.filter((row) => !row.stripe_subscription_id)
  if (noSubId.length) add('missing_subscription_id', `${noSubId.length} Stripe-billed row(s) without stripe_subscription_id`, noSubId.length)

  const priceInfo = best ? cat.priceInfo(best.price_id) : null
  return {
    source: 'webhook_ledger',
    stripeRefs: list.map((row) => rowRef(row, showFull)),
    refsMasked: !showFull,
    product: {
      plan: plan || 'free',
      planLabel: PLAN_LABEL[plan || 'free'] || null,
      effectivePlanOfBestRow: best ? effectivePlan(best, cat) : null,
      tierScope: billing.tierScope,
      priceName: priceInfo?.name || null,
    },
    stripeReportedState: 'not_checked',
    stripeReportedNote: 'No read-only Stripe port is configured; the Stripe-side state has not been checked.',
    reconState: {
      status: billing.status,
      hasAccess: billing.hasAccess,
      plan: billing.plan,
      planLabel: billing.planLabel,
      rowStatus: billing.rowStatus,
      currentPeriodEnd: billing.currentPeriodEnd,
      cancelAtPeriodEnd: billing.cancelAtPeriodEnd,
      paymentIssue: billing.paymentIssue,
      stale: billing.stale,
      staleReason: billing.staleReason,
      asOf: billing.asOf,
      rowCount: billing.rowCount,
      liveRowCount: billing.liveRowCount,
      resolver: 'domain/plans.mjs resolveBilling',
    },
    identityBinding: {
      state: bindingState,
      rowsBound: boundRows.length,
      rowsTotal: list.length,
      profileBound: profile ? Boolean(profileSub) : null,
      profileMatchesLogin: profileSub && loginSub ? profileSub === loginSub : null,
      loginKnown: Boolean(loginSub),
    },
    lastCheck: checkedAt(best),
    mismatchSuspected: mismatches.length > 0,
    mismatches,
    repair: null,
    note: 'Read-only. Any change is an action request that a lead authorizes and the billing system executes.',
  }
}

const PLAYER_STATUS_TEXT = Object.freeze({
  active: 'Active',
  trialing: 'Active',
  comp: 'Active',
  admin: 'Staff account',
  cancelling: 'Active until the end of the current period',
  payment_failed: 'Paused: the last payment did not go through',
  renewal_unconfirmed: 'We are checking your renewal',
  comp_expired: 'Ended',
  ended: 'Ended',
  none: 'No paid membership',
})

// Diagnostics provider.
export async function entitlementProvider({ one, ctx, now, roles }) {
  const status = sourceStatus(one, 'billing')
  if (status !== 'ok') {
    return panel('entitlement', 'Membership and access', status, {
      facts: [fact('Membership record', status === 'unavailable' ? 'could not be read right now' : 'not connected', 'ghost-igl-subscriptions', null, 'player')],
      signals: { entitlementKnown: false },
    })
  }
  const rows = Array.isArray(sourceData(one, 'billing')) ? sourceData(one, 'billing') : []
  const profile = sourceData(one, 'profile')
  const view = entitlementView({ rows, profile, cognitoUser: one?.cognitoUser || null, catalog: ctx?.catalog, now, roles })
  const r = view.reconState
  const at = r.asOf
  const facts = [
    fact('Plan', view.product.planLabel || 'Basic', 'Recon membership record', at, 'player'),
    fact('Access', PLAYER_STATUS_TEXT[r.status] || 'Unknown', 'Recon membership record', at, 'player'),
  ]
  if (r.currentPeriodEnd && (r.hasAccess || r.status === 'payment_failed')) facts.push(fact(r.cancelAtPeriodEnd ? 'Access ends' : 'Current period ends', dateOnly(r.currentPeriodEnd), 'Recon membership record', at, 'player'))
  facts.push(
    fact('Recon entitlement state', `${r.status}${r.rowStatus ? ` (ledger status ${r.rowStatus})` : ''}; access ${r.hasAccess ? 'granted' : 'not granted'}`, 'resolveBilling over ghost-igl-subscriptions', at),
    fact('Subscription rows', `${r.rowCount} row(s), ${r.liveRowCount} live`, 'ghost-igl-subscriptions', at),
    fact('Stripe-reported state', 'not checked (no read-only Stripe port configured)', 'none', null),
    fact('Identity binding', `${view.identityBinding.state} (${view.identityBinding.rowsBound}/${view.identityBinding.rowsTotal} rows carry cognito_sub)`, 'ghost-igl-subscriptions / ghost-igl-profiles', at),
    fact('Last reconciliation check', view.lastCheck.stateFetchedAt === NOT_RECORDED ? NOT_RECORDED : view.lastCheck.stateFetchedAt, 'state_fetched_at on the subscription row', null),
    fact('Last applied event sequence', String(view.lastCheck.appliedSeq), 'applied_seq on the subscription row', null),
  )
  const refs = view.stripeRefs
  if (refs.length) {
    const fullRoles = canSeeBilling(normalizeRoles(roles))
    facts.push(fact('Stripe references', refs.map((ref) => [ref.customerId, ref.subscriptionId].filter(Boolean).join(' / ')).join('; '), 'ghost-igl-subscriptions', at, fullRoles ? 'billing' : 'staff'))
  }
  const inferences = view.mismatches.map((m) => inference(`Mismatch suspected: ${m.ruleId}`, m.detail, `rule ${m.ruleId}: ${m.rule}`, 0.7))
  const user = []
  const recon = []
  if (r.status === 'payment_failed') user.push('Update your payment method in the billing portal. If you cannot find the way in, tell us on this case.')
  if (r.status === 'renewal_unconfirmed') recon.push('Check the subscription in Stripe; if it renewed, record an entitlement_repair action request for a lead to authorize.')
  if (view.mismatchSuspected) recon.push('Verify in Stripe before contacting the player. Any fix is an entitlement_repair action request (lead authorizes; billing system executes).')
  return panel('entitlement', 'Membership and access', view.mismatchSuspected || r.stale ? 'degraded' : 'ok', {
    facts,
    inferences,
    user,
    recon,
    signals: {
      entitlementKnown: true,
      plan: r.plan,
      hasAccess: r.hasAccess,
      billingStatus: r.status,
      hasPaidRow: rows.some(isStripeBilledRow),
      identityBound: view.identityBinding.state === 'bound' ? true : view.identityBinding.state === 'no_rows' ? null : false,
      mismatchSuspected: view.mismatchSuspected,
      mismatchRules: view.mismatches.map((m) => m.ruleId),
    },
    context: { entitlement: view },
  })
}
