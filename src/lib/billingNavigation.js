// Access grants (including admin access) are not Stripe customer records.
// Keep real customer portal navigation intact, even for an administrator.
export function hasStripeBilling(account) {
  return /^cus_[A-Za-z0-9]+$/.test(account?.stripe_customer_id || '')
}
