import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  PLAN_LABEL,
  PLAN_RANK,
  catalogFromEnv,
  computeVodUsage,
  effectivePlan,
  hasPlan,
  isActiveSub,
  monthlyValue,
  normalizePlan,
  pickBestSub,
  resolveBilling,
} from './plans.mjs'

const NOW = Date.parse('2026-09-25T12:00:00.000Z')
const DAY = 86400000
const future = (days) => new Date(NOW + days * DAY).toISOString()
const past = (days) => new Date(NOW - days * DAY).toISOString()

const PRO = 'price_1TLEtrJNddvjgWcg9iTWJoLS'
const ELITE_39 = 'price_1TPtOYJNddvjgWcgfEWjzGnp'
const ELITE_LEGACY_29 = 'price_1TLEtsJNddvjgWcgYcmiNmW7'
const CHAMPION_70 = 'price_1TzrjiJNddvjgWcgw1DYSf88'

test('plan ranks and labels match the live membership catalog (src/config/memberships.js)', () => {
  const source = readFileSync(new URL('../../../src/config/memberships.js', import.meta.url), 'utf8')
  for (const [plan, rank] of Object.entries(PLAN_RANK)) {
    assert.match(source, new RegExp(`${plan}: ${rank},`), `rank for ${plan}`)
  }
  for (const [plan, label] of Object.entries(PLAN_LABEL)) {
    assert.match(source, new RegExp(`${plan}: '${label}'`), `label for ${plan}`)
  }
})

test('unknown plan labels normalize to Basic (free) and elite is never dropped', () => {
  assert.equal(normalizePlan('elite'), 'elite')
  assert.equal(normalizePlan('ELITE'), 'elite')
  assert.equal(normalizePlan('all_access'), 'free')
  assert.equal(normalizePlan(undefined), 'free')
  assert.equal(hasPlan('elite', 'pro'), true)
  assert.equal(hasPlan('pro', 'elite'), false)
  assert.equal(hasPlan('champion', 'elite'), true)
})

test('legacy "champion" ledger rows on Elite prices resolve to Elite, like production effectivePlan', () => {
  assert.equal(effectivePlan({ plan: 'champion', price_id: ELITE_LEGACY_29 }), 'elite')
  assert.equal(effectivePlan({ plan: 'champion', price_id: ELITE_39 }), 'elite')
  assert.equal(effectivePlan({ plan: 'champion', price_id: CHAMPION_70 }), 'champion')
  assert.equal(effectivePlan({ plan: 'pro', price_id: PRO }), 'pro')
  // Comp rows have no price: the label decides, exactly as in production.
  assert.equal(effectivePlan({ plan: 'champion', comp: true }), 'champion')
})

test('env-configured price IDs are recognised the same way the webhook reads them', () => {
  const catalog = catalogFromEnv({ STRIPE_CHAMPION_REGULAR_PRICE_ID: 'price_env_elite', STRIPE_CHAMPION_MEMBERSHIP_PRICE_ID: 'price_env_champ' })
  assert.equal(catalog.planForPrice('price_env_elite'), 'elite')
  assert.equal(catalog.planForPrice('price_env_champ'), 'champion')
  assert.equal(effectivePlan({ plan: 'champion', price_id: 'price_env_elite' }, catalog), 'elite')
})

test('isActiveSub requires active/trialing AND a future paid-through date', () => {
  assert.equal(isActiveSub({ status: 'active', current_period_end: future(3) }, NOW), true)
  assert.equal(isActiveSub({ status: 'trialing', current_period_end: future(3) }, NOW), true)
  assert.equal(isActiveSub({ status: 'active', current_period_end: past(1) }, NOW), false)
  assert.equal(isActiveSub({ status: 'past_due', current_period_end: future(3) }, NOW), false)
  assert.equal(isActiveSub({ status: 'active' }, NOW), false)
})

test('pickBestSub ranks by plan then paid-through date, not by arbitrary row order', () => {
  // The 2026-07-29 incident shape: Pro bought first, upgrade added a new row,
  // and the index returned the Pro row first.
  const rows = [
    { stripe_customer_id: 'cus_a', plan: 'pro', price_id: PRO, status: 'active', current_period_end: future(20) },
    { stripe_customer_id: 'cus_b', plan: 'champion', price_id: ELITE_39, status: 'active', current_period_end: future(29) },
    { stripe_customer_id: 'cus_c', plan: 'champion', price_id: ELITE_39, status: 'canceled', current_period_end: future(29) },
  ]
  const best = pickBestSub(rows, { now: NOW })
  assert.equal(best.stripe_customer_id, 'cus_b')
  assert.equal(effectivePlan(best), 'elite')
})

test('resolveBilling: active Elite member', () => {
  const billing = resolveBilling([
    { stripe_customer_id: 'cus_x', plan: 'champion', price_id: ELITE_39, status: 'active', current_period_end: future(12), updated_at: past(18) },
  ], { now: NOW })
  assert.equal(billing.plan, 'elite')
  assert.equal(billing.planLabel, 'Elite')
  assert.equal(billing.status, 'active')
  assert.equal(billing.hasAccess, true)
  assert.equal(billing.isPaidMember, true)
  assert.equal(billing.amount, 39)
  assert.equal(billing.labelMismatch, false, 'legacy champion label on Elite price is expected, not a mismatch')
  assert.equal(billing.source, 'webhook_ledger')
})

test('resolveBilling: past_due loses access (production rule) but is at risk, not churned', () => {
  const billing = resolveBilling([
    { stripe_customer_id: 'cus_x', plan: 'pro', price_id: PRO, status: 'past_due', current_period_end: future(5), updated_at: past(1) },
  ], { now: NOW })
  assert.equal(billing.hasAccess, false)
  assert.equal(billing.plan, 'free')
  assert.equal(billing.status, 'payment_failed')
  assert.equal(billing.paymentIssue, 'past_due')
  assert.equal(billing.churned, false)
  assert.equal(billing.lastPaidPlan, 'pro')
})

test('resolveBilling: a stale "active" row is renewal_unconfirmed, never silently churned', () => {
  const billing = resolveBilling([
    { stripe_customer_id: 'cus_x', plan: 'pro', price_id: PRO, status: 'active', current_period_end: past(2), updated_at: past(32) },
  ], { now: NOW })
  assert.equal(billing.hasAccess, false)
  assert.equal(billing.status, 'renewal_unconfirmed')
  assert.equal(billing.stale, true)
  assert.equal(billing.churned, false)
})

test('resolveBilling: cancelled and ended subscription is churned', () => {
  const billing = resolveBilling([
    { stripe_customer_id: 'cus_x', plan: 'champion', price_id: CHAMPION_70, status: 'canceled', current_period_end: past(10), updated_at: past(10) },
  ], { now: NOW })
  assert.equal(billing.status, 'ended')
  assert.equal(billing.churned, true)
  assert.equal(billing.lastPaidPlan, 'champion')
})

test('resolveBilling: scheduled cancellation keeps access and reports cancelling', () => {
  const billing = resolveBilling([
    { stripe_customer_id: 'cus_x', plan: 'champion', price_id: CHAMPION_70, status: 'active', cancel_at_period_end: true, current_period_end: future(6) },
  ], { now: NOW })
  assert.equal(billing.status, 'cancelling')
  assert.equal(billing.hasAccess, true)
  assert.equal(billing.plan, 'champion')
})

test('resolveBilling: no rows is Basic with status none; unavailable ledger is unknown, not Basic', () => {
  assert.equal(resolveBilling([], { now: NOW }).status, 'none')
  assert.equal(resolveBilling([], { now: NOW }).planLabel, 'Basic')
  const unknown = resolveBilling(null, { now: NOW, available: false })
  assert.equal(unknown.status, 'unknown')
  assert.equal(unknown.plan, null)
  assert.equal(unknown.hasAccess, null)
})

test('resolveBilling flags duplicate live Stripe rows without counting them as extra customers', () => {
  const billing = resolveBilling([
    { stripe_customer_id: 'cus_1', plan: 'pro', price_id: PRO, status: 'active', current_period_end: future(10) },
    { stripe_customer_id: 'cus_2', plan: 'pro', price_id: PRO, status: 'active', current_period_end: future(11) },
  ], { now: NOW })
  assert.equal(billing.duplicateLiveRows, true)
  assert.equal(billing.liveRowCount, 2)
})

test('computeVodUsage mirrors production allowances and period rollover', () => {
  const row = { vod_period_start_at: past(5), vod_sessions_used: 7 }
  assert.deepEqual(
    { ...computeVodUsage(row, 'elite', 'single', { now: NOW }), periodEnd: null },
    { used: 7, limit: 60, remaining: 53, isTrial: false, periodEnd: null, unlimited: false },
  )
  const rolled = computeVodUsage({ vod_period_start_at: past(40), vod_sessions_used: 19 }, 'pro', 'single', { now: NOW })
  assert.equal(rolled.used, 0)
  assert.equal(rolled.limit, 20)
  assert.equal(computeVodUsage(row, 'free', 'single', { now: NOW }), null)
  assert.equal(computeVodUsage(row, 'champion', 'all_access', { now: NOW }).limit, 90)
})

test('monthlyValue only prices known Stripe prices', () => {
  assert.equal(monthlyValue(CHAMPION_70), 70)
  assert.equal(monthlyValue('price_1TVUd6JNddvjgWcgc3csHICD'), 40.83)
  assert.equal(monthlyValue('price_unknown'), null)
})
