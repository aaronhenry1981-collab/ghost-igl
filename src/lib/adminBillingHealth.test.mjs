import test from 'node:test'
import assert from 'node:assert/strict'
import {
  effectiveAccessPlan,
  effectiveBillingState,
  hasDuplicateLiveSubscriptions,
  hasDuplicateStripeCustomers,
  isPaidWithoutSiteAccount,
} from './adminBillingHealth.mjs'

test('historical Stripe records are not active billing emergencies', () => {
  const historical = {
    orphan: true,
    cognito_status: 'NO_ACCOUNT',
    plan: 'elite',
    sub_status: 'canceled',
    live_subscription_count: 0,
    stripe_customer_count: 5,
  }

  assert.equal(isPaidWithoutSiteAccount(historical), false)
  assert.equal(hasDuplicateLiveSubscriptions(historical), false)
  assert.equal(hasDuplicateStripeCustomers(historical), true)
  assert.equal(effectiveAccessPlan(historical), 'free')
  assert.equal(effectiveBillingState(historical), 'canceled')
})

test('an active Stripe-only subscription is an access emergency', () => {
  const activeOrphan = {
    orphan: true,
    plan: 'pro',
    sub_status: 'active',
    live_subscription_count: 1,
    stripe_customer_count: 1,
  }

  assert.equal(isPaidWithoutSiteAccount(activeOrphan), true)
  assert.equal(effectiveAccessPlan(activeOrphan), 'pro')
  assert.equal(effectiveBillingState(activeOrphan), 'paid')
})

test('only multiple live subscriptions trigger the duplicate billing alarm', () => {
  assert.equal(hasDuplicateLiveSubscriptions({ live_subscription_count: 2 }), true)
  assert.equal(hasDuplicateLiveSubscriptions({ live_subscription_count: 1, stripe_customer_count: 4 }), false)
})

test('webhook-ledger statuses drive attention filters when live Stripe totals are unavailable', () => {
  assert.equal(effectiveBillingState({ sub_status: 'past_due' }), 'payment_issue')
  assert.equal(effectiveBillingState({ sub_status: 'unpaid' }), 'payment_issue')
  assert.equal(effectiveBillingState({ sub_status: 'active' }), 'paid')
})
