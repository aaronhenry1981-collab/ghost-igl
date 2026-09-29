// Admin plan labels must match the plan the webhook grants access from.
import test from 'node:test'
import assert from 'node:assert/strict'
import { planFor, summarizeStripeSubscriptions } from './stripe-revenue.mjs'

// The production variables still carry pre-rename names: the $29 legacy and
// $39 prices sit in STRIPE_CHAMPION_* but are Elite everywhere else.
const ENV = {
  STRIPE_PRO_PRICE_ID: 'price_1TLEtrJNddvjgWcg9iTWJoLS',
  STRIPE_PRO_FOUNDING_PRICE_ID: 'price_1TPtOKJNddvjgWcg47I16AQp',
  STRIPE_CHAMPION_PRICE_ID: 'price_1TLEtsJNddvjgWcgYcmiNmW7',
  STRIPE_CHAMPION_REGULAR_PRICE_ID: 'price_1TPtOYJNddvjgWcgfEWjzGnp',
}
const sub = (priceId, cents, status = 'active') => ({ id: `sub_${priceId}`, status, customer: 'cus_x', items: { data: [{ price: { id: priceId, unit_amount: cents, recurring: { interval: 'month', interval_count: 1 } } }] } })

test('legacy $29 and $39 prices are Elite; only the $70 membership is Champion', () => {
  assert.equal(planFor(sub('price_1TLEtsJNddvjgWcgYcmiNmW7', 2900), 'free', ENV), 'elite')
  assert.equal(planFor(sub('price_1TPtOYJNddvjgWcgfEWjzGnp', 3900), 'free', ENV), 'elite')
  assert.equal(planFor(sub('price_1TzrjiJNddvjgWcgw1DYSf88', 7000), 'free', ENV), 'champion')
  assert.equal(planFor(sub('price_1TPtOKJNddvjgWcg47I16AQp', 900), 'free', ENV), 'pro')
  assert.equal(planFor(sub('price_unknown', 500), 'elite', ENV), 'elite', 'unknown price keeps the membership row plan')
})

test('plan counts in the business summary follow the same labels', () => {
  const s = summarizeStripeSubscriptions([
    sub('price_1TLEtsJNddvjgWcgYcmiNmW7', 2900),
    sub('price_1TLEtsJNddvjgWcgYcmiNmW7', 2900),
    sub('price_1TLEtrJNddvjgWcg9iTWJoLS', 1200),
    sub('price_1TzrjiJNddvjgWcgw1DYSf88', 7000),
  ], new Map(), ENV)
  assert.deepEqual([s.pro_active, s.elite_active, s.champion_active], [1, 2, 1])
})
