import test from 'node:test'
import assert from 'node:assert/strict'
import { entitlementView, MISMATCH_RULES } from './entitlement.mjs'
import { resolveBilling } from '../../domain/plans.mjs'

const NOW = Date.parse('2026-10-14T15:00:00.000Z')
const DAY = 86400000
const ahead = (d) => new Date(NOW + d * DAY).toISOString()
const ago = (d) => new Date(NOW - d * DAY).toISOString()
const PRO = 'price_1TLEtrJNddvjgWcg9iTWJoLS'
const ELITE = 'price_1TPtOYJNddvjgWcgfEWjzGnp'
const LOGIN = { sub: 'sub-fixture-ent-1', email: 'ent.player@example.com' }

const row = (over = {}) => ({
  stripe_customer_id: 'cus_ENTFIXTURE0001', stripe_subscription_id: 'sub_ENTFIXTURE0001', email: 'ent.player@example.com',
  plan: 'pro', price_id: PRO, status: 'active', current_period_end: ahead(20), updated_at: ago(5), cognito_sub: LOGIN.sub, ...over,
})
const rules = (view) => view.mismatches.map((m) => m.ruleId).sort()

test('clean bound row: no mismatch, Stripe state not checked, never a repair', () => {
  const v = entitlementView({ rows: [row()], profile: { email: LOGIN.email, cognito_sub: LOGIN.sub }, cognitoUser: LOGIN, now: NOW })
  assert.equal(v.mismatchSuspected, false)
  assert.deepEqual(v.mismatches, [])
  assert.equal(v.stripeReportedState, 'not_checked')
  assert.equal(v.repair, null)
  assert.equal(v.identityBinding.state, 'bound')
  assert.equal(v.identityBinding.profileMatchesLogin, true)
  assert.equal(v.product.plan, 'pro')
  assert.equal(v.product.planLabel, 'Pro')
})

test('Recon state is exactly resolveBilling (the only resolver)', () => {
  const rows = [row({ status: 'past_due' }), row({ stripe_customer_id: 'cus_ENTFIXTURE0002', price_id: ELITE, plan: 'champion', current_period_end: ago(2) })]
  const v = entitlementView({ rows, now: NOW })
  const b = resolveBilling(rows, { now: NOW })
  assert.equal(v.reconState.status, b.status)
  assert.equal(v.reconState.hasAccess, b.hasAccess)
  assert.equal(v.reconState.plan, b.plan)
  assert.equal(v.reconState.resolver, 'domain/plans.mjs resolveBilling')
})

test('rule: paid live row with an unbound identity', () => {
  const v = entitlementView({ rows: [row({ cognito_sub: undefined })], cognitoUser: LOGIN, now: NOW })
  assert.deepEqual(rules(v), ['paid_live_identity_unbound'])
  assert.equal(v.identityBinding.state, 'unbound')
  const foreign = entitlementView({ rows: [row({ cognito_sub: 'sub-someone-else' })], cognitoUser: LOGIN, now: NOW })
  assert.deepEqual(rules(foreign), ['paid_live_identity_unbound'])
  assert.equal(foreign.identityBinding.state, 'mismatch')
  assert.match(foreign.mismatches[0].detail, /different login/)
  // A comp row is not a paid row.
  const comp = entitlementView({ rows: [row({ stripe_customer_id: 'comp_ent.player@example.com', comp: true, cognito_sub: undefined, stripe_subscription_id: undefined })], now: NOW })
  assert.deepEqual(rules(comp), [])
})

test('rule: multiple live paid rows', () => {
  const v = entitlementView({ rows: [row(), row({ stripe_customer_id: 'cus_ENTFIXTURE0009', stripe_subscription_id: 'sub_ENTFIXTURE0009', price_id: ELITE, plan: 'elite' })], cognitoUser: LOGIN, now: NOW })
  assert.deepEqual(rules(v), ['multiple_live_paid_rows'])
  assert.equal(v.mismatches[0].count, 2)
})

test('rule: live status with a past (or missing) period end', () => {
  const past = entitlementView({ rows: [row({ current_period_end: ago(3) })], cognitoUser: LOGIN, now: NOW })
  assert.ok(rules(past).includes('live_status_past_period_end'))
  assert.equal(past.reconState.status, 'renewal_unconfirmed')
  const missing = entitlementView({ rows: [row({ current_period_end: null })], cognitoUser: LOGIN, now: NOW })
  assert.ok(rules(missing).includes('live_status_past_period_end'))
  assert.match(missing.mismatches.find((m) => m.ruleId === 'live_status_past_period_end').detail, /no paid-through date/)
})

test('rule: past_due while the access decision is still true', () => {
  const rows = [
    row({ status: 'past_due', stripe_customer_id: 'cus_ENTFIXTURE0003', stripe_subscription_id: 'sub_ENTFIXTURE0003' }),
    row({ stripe_customer_id: 'comp_ent.player@example.com', comp: true, current_period_end: '2099-01-01T00:00:00.000Z', stripe_subscription_id: undefined }),
  ]
  const v = entitlementView({ rows, cognitoUser: LOGIN, now: NOW })
  assert.equal(v.reconState.hasAccess, true)
  assert.ok(rules(v).includes('past_due_access_granted'))
  const alone = entitlementView({ rows: [row({ status: 'past_due' })], cognitoUser: LOGIN, now: NOW })
  assert.ok(!rules(alone).includes('past_due_access_granted'), 'past_due alone: access is already false')
})

test('rule: Stripe-billed row missing stripe_subscription_id', () => {
  const v = entitlementView({ rows: [row({ stripe_subscription_id: undefined })], cognitoUser: LOGIN, now: NOW })
  assert.deepEqual(rules(v), ['missing_subscription_id'])
  assert.ok(Object.keys(MISMATCH_RULES).includes('missing_subscription_id'))
})

test('last check: state_fetched_at / applied_seq or "not recorded"', () => {
  const none = entitlementView({ rows: [row()], now: NOW })
  assert.deepEqual(none.lastCheck, { stateFetchedAt: 'not recorded', appliedSeq: 'not recorded' })
  const recorded = entitlementView({ rows: [row({ state_fetched_at: ago(1), applied_seq: 42 })], now: NOW })
  assert.equal(recorded.lastCheck.stateFetchedAt, ago(1))
  assert.equal(recorded.lastCheck.appliedSeq, 42)
})

test('Stripe references are masked unless the role may see billing ids', () => {
  const masked = entitlementView({ rows: [row()], now: NOW, roles: ['agent'] })
  assert.equal(masked.refsMasked, true)
  assert.equal(masked.stripeRefs[0].customerId, 'cus_…0001')
  assert.equal(masked.stripeRefs[0].subscriptionId, 'sub_…0001')
  const full = entitlementView({ rows: [row()], now: NOW, roles: ['billing'] })
  assert.equal(full.stripeRefs[0].customerId, 'cus_ENTFIXTURE0001')
  assert.equal(entitlementView({ rows: [row()], now: NOW, roles: ['admins'] }).refsMasked, false)
  assert.equal(entitlementView({ rows: [row()], now: NOW, roles: ['support-engineering'] }).refsMasked, true)
})

test('no rows: empty but well-formed view', () => {
  const v = entitlementView({ rows: [], now: NOW })
  assert.equal(v.identityBinding.state, 'no_rows')
  assert.equal(v.reconState.status, 'none')
  assert.equal(v.mismatchSuspected, false)
})
