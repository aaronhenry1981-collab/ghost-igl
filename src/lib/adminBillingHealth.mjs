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

export function effectiveAccessPlan(user) {
  return hasLiveStripeSubscription(user) || user?.is_comp ? (user?.plan || 'free') : 'free'
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
