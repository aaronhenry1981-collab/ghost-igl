import test from 'node:test'
import assert from 'node:assert/strict'
import {
  effectiveAccessPlan,
  effectiveBillingState,
  hasComplimentaryAccess,
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
    current_period_end: '2099-01-01T00:00:00Z',
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

test('billing lifecycle counts and comp flags cannot grant access by themselves', () => {
  const now = Date.parse('2026-10-19T00:00:00Z')
  for (const sub_status of ['past_due', 'unpaid', 'incomplete', 'paused', 'canceled', 'expired']) {
    assert.equal(effectiveAccessPlan({ plan: 'pro', sub_status, live_subscription_count: 1, current_period_end: '2099-01-01' }, now), 'free', sub_status)
  }
  for (const current_period_end of [null, 'invalid', '2026-10-18', '2026-10-19T00:00:00Z']) {
    assert.equal(effectiveAccessPlan({ plan: 'champion', sub_status: 'active', is_comp: true, current_period_end }, now), 'free')
  }
})

test('access uses the ledger projection even if live Stripe disagrees', () => {
  const now = Date.parse('2026-10-19')
  assert.equal(effectiveAccessPlan({ plan: 'pro', sub_status: 'active', current_period_end: '2099-01-01', access_plan: 'free', access_status: 'past_due', access_period_end: '2099-01-01' }, now), 'free')
  assert.equal(effectiveAccessPlan({ plan: 'pro', sub_status: 'past_due', access_plan: 'champion', access_status: 'active', access_period_end: '2099-01-01' }, now), 'champion')
  assert.equal(effectiveAccessPlan({ is_admin: true, plan: 'free', sub_status: 'past_due' }, now), 'champion')
  assert.equal(effectiveAccessPlan({ access_plan: 'elite', access_status: 'trialing', access_period_end: '2099-01-01' }, now), 'elite')
})

test('cached complimentary access expires without a refresh; admins retain their exemption', () => {
  const member = { is_comp: true, access_source: 'complimentary', access_plan: 'elite', access_status: 'active', access_period_end: '2026-10-20T00:00:00Z' }
  assert.equal(hasComplimentaryAccess(member, Date.parse('2026-10-19')), true)
  assert.equal(hasComplimentaryAccess(member, Date.parse('2026-10-20')), false)
  assert.equal(hasComplimentaryAccess({ ...member, is_admin: true }, Date.parse('2026-10-19')), false)
})
