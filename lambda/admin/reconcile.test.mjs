import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  BILLING_FIELDS, WEBHOOK_ELITE_PRICE_IDS, WEBHOOK_PRO_PRICE_IDS, DEFAULT_CHAMPION_MEMBERSHIP_PRICE_ID,
  chooseSubscription, confirmationPhrase, planFromPrice, planReconciliation,
} from './reconcile.mjs'

// All ids are fictional except the public price ids mirrored from the webhook.
const PRO = WEBHOOK_PRO_PRICE_IDS[1]
const ELITE = WEBHOOK_ELITE_PRICE_IDS[0]
const CHAMP = DEFAULT_CHAMPION_MEMBERSHIP_PRICE_ID
const T = (iso) => Math.floor(Date.parse(iso) / 1000)
const sub = (id, customer, price, status, created, periodEnd = '2026-10-28T00:00:00Z') => ({
  id, customer, status, created: T(created), current_period_end: T(periodEnd), items: { data: [{ price: { id: price } }] },
})

test('price mapping mirrors the webhook exactly (legacy "Champion" prices are Elite)', () => {
  const src = readFileSync(new URL('../webhook/index.mjs', import.meta.url), 'utf8')
  const start = src.indexOf('function getPlanFromPrice')
  const fn = src.slice(start, src.slice(start).search(/\r?\n}\r?\n/) + start)
  const block = (name) => [...fn.slice(fn.indexOf(`const ${name}`), fn.indexOf('].filter', fn.indexOf(`const ${name}`))).matchAll(/'(price_[A-Za-z0-9]+)'/g)].map((m) => m[1])
  assert.deepEqual(block('proIds'), [...WEBHOOK_PRO_PRICE_IDS])
  assert.deepEqual(block('eliteIds'), [...WEBHOOK_ELITE_PRICE_IDS])
  assert.ok(src.includes(`'${DEFAULT_CHAMPION_MEMBERSHIP_PRICE_ID}'`), 'champion membership default matches the webhook')
  assert.equal(planFromPrice(ELITE), 'elite')
  assert.equal(planFromPrice('price_env_legacy', { STRIPE_CHAMPION_PRICE_ID: 'price_env_legacy' }), 'elite', 'the old backfill called these champion')
  assert.equal(planFromPrice(CHAMP), 'champion')
  assert.equal(planFromPrice('price_unknown'), null)
})

test('a live subscription beats a newer canceled one; ties go to the newest', () => {
  const chosen = chooseSubscription([
    sub('sub_old_live', 'cus_A', PRO, 'active', '2026-05-01'),
    sub('sub_new_canceled', 'cus_A', ELITE, 'canceled', '2026-09-01'),
  ])
  assert.equal(chosen.id, 'sub_old_live')
  assert.equal(chooseSubscription([sub('a', 'c', PRO, 'canceled', '2026-01-01'), sub('b', 'c', PRO, 'canceled', '2026-02-01')]).id, 'b')
})

test('only billing fields change; usage, identity and scope are preserved', () => {
  const row = { stripe_customer_id: 'cus_A', stripe_subscription_id: 'sub_1', plan: 'pro', status: 'past_due', current_period_end: '2026-10-28T00:00:00.000Z', vod_sessions_used: 7, cognito_sub: 'fixture-sub', tier_scope: 'single', email: 'a@example.test' }
  const plan = planReconciliation({ subscriptions: [sub('sub_1', 'cus_A', PRO, 'active', '2026-05-01')], rows: [row] })
  assert.equal(plan.changes.length, 1)
  const c = plan.changes[0]
  assert.deepEqual(c.fields, ['status'])
  assert.deepEqual(Object.keys(c.after).sort(), [...BILLING_FIELDS].sort())
  for (const k of ['vod_sessions_used', 'cognito_sub', 'tier_scope', 'email']) assert.ok(!(k in c.after), `${k} is never written`)
  assert.equal(c.revokesAccess, false)
})

test('an older canceled subscription never replaces a live row', () => {
  const row = { stripe_customer_id: 'cus_B', stripe_subscription_id: 'sub_live', plan: 'elite', status: 'active', current_period_end: '2026-10-28T00:00:00.000Z' }
  const plan = planReconciliation({ subscriptions: [sub('sub_gone', 'cus_B', PRO, 'canceled', '2026-01-01')], rows: [row] })
  assert.equal(plan.changes.length, 0)
  assert.deepEqual(plan.skipped, [{ stripe_customer_id: 'cus_B', reason: 'would_replace_live_row_with_inactive_subscription' }])
})

test('the same subscription ending is shown as a revocation, never hidden', () => {
  const row = { stripe_customer_id: 'cus_C', stripe_subscription_id: 'sub_c', plan: 'pro', status: 'active', current_period_end: '2026-10-28T00:00:00.000Z' }
  const plan = planReconciliation({ subscriptions: [sub('sub_c', 'cus_C', PRO, 'canceled', '2026-03-01')], rows: [row] })
  assert.equal(plan.counts.revocations, 1)
  assert.equal(plan.changes[0].revokesAccess, true)
})

test('comp rows are never touched; non-membership prices are ignored; matching rows are unchanged', () => {
  const rows = [
    { stripe_customer_id: 'cus_comp', comp: true, plan: 'champion', status: 'active', current_period_end: '2099-01-01T00:00:00.000Z' },
    { stripe_customer_id: 'cus_ok', stripe_subscription_id: 'sub_ok', plan: 'pro', status: 'active', current_period_end: '2026-10-28T00:00:00.000Z' },
  ]
  const subs = [
    sub('sub_x', 'cus_comp', PRO, 'active', '2026-05-01'),
    sub('sub_ok', 'cus_ok', PRO, 'active', '2026-05-01'),
    sub('sub_addon', 'cus_ok', 'price_coaching_addon', 'active', '2026-06-01'),
  ]
  const plan = planReconciliation({ subscriptions: subs, rows })
  assert.equal(plan.changes.length, 0)
  assert.equal(plan.counts.unchanged, 1)
  assert.equal(plan.counts.ignoredNonMembership, 1)
  assert.deepEqual(plan.skipped.map((s) => s.reason), ['comp_row'])
})

test('a missing row is a create; the preview id changes when the plan changes; the phrase names the count', () => {
  const a = planReconciliation({ subscriptions: [sub('sub_n', 'cus_N', ELITE, 'active', '2026-05-01')], rows: [] })
  assert.equal(a.changes[0].action, 'create')
  assert.equal(a.changes[0].after.plan, 'elite')
  const b = planReconciliation({ subscriptions: [sub('sub_n', 'cus_N', ELITE, 'past_due', '2026-05-01')], rows: [] })
  assert.notEqual(a.previewId, b.previewId)
  assert.equal(confirmationPhrase(a), 'APPLY 1 CHANGES')
})
