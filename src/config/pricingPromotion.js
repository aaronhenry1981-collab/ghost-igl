// D4.3 preparation only. No offer is approved and no checkout behavior changes.
// This config intentionally has no rendering/checkout consumer until the owner
// chooses terms and a tested Stripe price/coupon matches those exact terms.
export const PRICING_PROMOTION = Object.freeze({
  enabled: false,
  kind: null, // annual or first_period_discount
  tier: 'pro',
  currency: 'usd',
  amount: null,
  billingInterval: null,
  savingsPercent: null,
  duration: null,
  eligibility: null,
  startsAt: null,
  endsAt: null,
  renewalTerms: null,
  approved: false,
})
