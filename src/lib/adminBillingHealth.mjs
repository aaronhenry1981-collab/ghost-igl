export function hasLiveStripeSubscription(user) {
  return Number(user?.live_subscription_count || 0) > 0
}

export function isStripeOnlyRecord(user) {
  return user?.orphan === true || user?.cognito_status === 'NO_ACCOUNT'
}

export function isPaidWithoutSiteAccount(user) {
  return isStripeOnlyRecord(user) && hasLiveStripeSubscription(user)
}

export function hasDuplicateLiveSubscriptions(user) {
  return Number(user?.live_subscription_count || 0) > 1
}

export function hasDuplicateStripeCustomers(user) {
  return Number(user?.stripe_customer_count || 0) > 1
}

export function effectiveAccessPlan(user, nowMs = Date.now()) {
  if (user?.is_admin === true) return 'champion'
  // New API fields retain the authorization ledger before live Stripe billing
  // enrichment. The fallback supports either deployment order without using a
  // billing lifecycle count as proof of access.
  const projected = user?.access_plan != null
  const status = projected ? user.access_status : user?.sub_status
  const end = Date.parse((projected ? user.access_period_end : user?.current_period_end) || '')
  if (!['active', 'trialing'].includes(status) || !Number.isFinite(end) || end <= nowMs) return 'free'
  return (projected ? user.access_plan : user?.plan) || 'free'
}

export function hasComplimentaryAccess(user, nowMs = Date.now()) {
  return effectiveAccessPlan(user, nowMs) !== 'free' && !user?.is_admin &&
    (user?.access_source === 'complimentary' || (user?.access_plan == null && user?.is_comp === true))
}

export function effectiveBillingState(user) {
  if (user?.billing_state) return user.billing_state
  if (user?.is_comp) return 'comp'
  if (user?.sub_status === 'active') return 'paid'
  if (user?.sub_status === 'trialing') return 'trialing'
  if (['past_due', 'unpaid', 'incomplete'].includes(user?.sub_status)) return 'payment_issue'
  if (user?.sub_status === 'canceled') return 'canceled'
  return 'free'
}
