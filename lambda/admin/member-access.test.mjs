import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { bestMembership, hasMembershipAccess, memberAccessFields, membershipPlan } from './member-access.mjs'

const now = Date.parse('2026-10-19T00:00:00Z')
const row = (fields = {}) => ({ plan: 'pro', status: 'active', stripe_subscription_id: 'sub_fixture', current_period_end: '2026-11-01T00:00:00Z', ...fields })

// Evaluate only the existing authorization functions, with a fixed clock, no
// AWS client import or network. This catches display/authorization drift.
const source = readFileSync(new URL('../subscription/index.mjs', import.meta.url), 'utf8')
const legacy = source.slice(source.indexOf('const LEGACY_ELITE_PRICE_IDS'), source.indexOf('const verifier ='))
const selection = source.slice(source.indexOf('const PLAN_RANK ='), source.indexOf('async function getActiveSub('))
const predicate = source.slice(source.indexOf('function isActiveSub('), source.indexOf('async function getSubscriptionRows('))
const authorization = vm.runInNewContext(`${legacy}\n${selection}\n${predicate}\n({ effectivePlan, pickBestSub, isActiveSub })`, {
  process: { env: {} }, Date: class extends Date { static now() { return now } },
})

for (const [name, fields, expected] of [
  ['active paid period', {}, 'pro'],
  ['trialing', { status: 'trialing' }, 'pro'],
  ['past due despite future period', { status: 'past_due' }, 'free'],
  ['unpaid', { status: 'unpaid' }, 'free'],
  ['canceled', { status: 'canceled' }, 'free'],
  ['cancel at period end retains paid period', { cancel_at_period_end: true }, 'pro'],
  ['expired paid period', { current_period_end: '2026-10-18' }, 'free'],
  ['expiry boundary', { current_period_end: '2026-10-19T00:00:00Z' }, 'free'],
  ['missing period', { current_period_end: null }, 'free'],
  ['malformed period', { current_period_end: 'invalid' }, 'free'],
  ['valid complimentary grant', { comp: true, stripe_subscription_id: null }, 'pro'],
  ['expired complimentary grant', { comp: true, stripe_subscription_id: null, current_period_end: '2026-10-18' }, 'free'],
  ['legacy Elite mapping', { plan: 'champion', price_id: 'price_1TLEtsJNddvjgWcgYcmiNmW7' }, 'elite'],
]) {
  test(`admin matches authorization: ${name}`, () => {
    const sub = row(fields)
    assert.equal(hasMembershipAccess(sub, now), authorization.isActiveSub(sub))
    assert.equal(membershipPlan(sub, {}), authorization.effectivePlan(sub))
    assert.equal(memberAccessFields(sub, false, now).access_plan, expected)
  })
}

test('admin group exemption is independent of payment and comp expiration', () => {
  for (const sub of [null, row({ status: 'past_due' }), row({ comp: true, current_period_end: '2026-01-01' })]) {
    assert.equal(memberAccessFields(sub, true, now).access_plan, 'champion')
    assert.equal(memberAccessFields(sub, true, now).access_source, 'admin')
  }
})

test('multiple rows protect the best valid paid/comp period regardless of order', () => {
  const rows = [row({ plan: 'champion', status: 'past_due' }), row(), row({ plan: 'elite', comp: true, stripe_subscription_id: null }), row({ plan: 'champion', current_period_end: '2026-01-01' })]
  for (const ordered of [rows, [...rows].reverse()]) {
    assert.equal(bestMembership(ordered, now, {}), authorization.pickBestSub(ordered))
    assert.equal(memberAccessFields(bestMembership(ordered, now, {}), false, now).access_plan, 'elite')
  }
  const longer = row({ current_period_end: '2026-12-01' })
  assert.equal(bestMembership([row(), longer], now), longer)
})
