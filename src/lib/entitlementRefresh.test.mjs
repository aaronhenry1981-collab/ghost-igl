import test from 'node:test'
import assert from 'node:assert/strict'

import { hasVerifiedPaidCheckout, loadMembershipAfterCheckout } from './entitlementRefresh.js'

const basic = { plan: 'free', sub_status: 'none', stripe_customer_id: null }
const sessionId = 'cs_test_SYNTHETIC123'
const paid = {
  plan: 'pro',
  sub_status: 'active',
  stripe_customer_id: 'cus_SYNTHETIC123',
  checkout_session_id: sessionId,
  checkout_payment_status: 'paid',
}

test('paid conversion requires the exact webhook-backed Checkout Session', () => {
  assert.equal(hasVerifiedPaidCheckout(paid, sessionId), true)
  assert.equal(hasVerifiedPaidCheckout(paid, 'cs_test_OTHER'), false)
  assert.equal(hasVerifiedPaidCheckout({ ...paid, checkout_session_id: null }, sessionId), false)
  assert.equal(hasVerifiedPaidCheckout({ ...paid, checkout_payment_status: 'unpaid' }, sessionId), false)
  assert.equal(hasVerifiedPaidCheckout({ ...paid, is_admin: true }, sessionId), false)
  assert.equal(hasVerifiedPaidCheckout({ ...paid, comp: true }, sessionId), false)
})

test('successful checkout retries until the webhook-backed entitlement appears', async () => {
  const states = [basic, basic, paid]
  let calls = 0
  const slept = []
  const result = await loadMembershipAfterCheckout(
    async () => states[Math.min(calls++, states.length - 1)],
    { checkoutStatus: 'success', checkoutSessionId: sessionId, delays: [1, 2, 4], sleep: async (ms) => slept.push(ms) },
  )
  assert.equal(result.verifiedPayment, true)
  assert.equal(result.data.plan, 'pro')
  assert.equal(calls, 3)
  assert.deepEqual(slept, [1, 2])
})

test('checkout polling is bounded and keeps the last good server state', async () => {
  let calls = 0
  const result = await loadMembershipAfterCheckout(
    async () => {
      calls += 1
      if (calls === 2) throw new Error('synthetic transient failure')
      return basic
    },
    { checkoutStatus: 'success', checkoutSessionId: sessionId, delays: [1, 2], sleep: async () => {} },
  )
  assert.equal(result.verifiedPayment, false)
  assert.deepEqual(result.data, basic)
  assert.equal(calls, 3)
})

test('a transient first fetch is retried during a successful checkout return', async () => {
  let calls = 0
  const result = await loadMembershipAfterCheckout(
    async () => {
      calls += 1
      if (calls === 1) throw new Error('synthetic first fetch failure')
      return paid
    },
    { checkoutStatus: 'success', checkoutSessionId: sessionId, delays: [1], sleep: async () => {} },
  )
  assert.equal(result.verifiedPayment, true)
  assert.equal(calls, 2)
})

test('polling aborts before another fetch after the account view unmounts', async () => {
  const controller = new AbortController()
  let calls = 0
  await assert.rejects(
    loadMembershipAfterCheckout(
      async () => { calls += 1; return basic },
      {
        checkoutStatus: 'success',
        checkoutSessionId: sessionId,
        delays: [1],
        signal: controller.signal,
        sleep: async () => { controller.abort() },
      },
    ),
    { name: 'AbortError' },
  )
  assert.equal(calls, 1)
})

test('ordinary Account loads do not poll', async () => {
  let calls = 0
  const result = await loadMembershipAfterCheckout(
    async () => { calls += 1; return basic },
    { checkoutStatus: null, delays: [1, 2], sleep: async () => {} },
  )
  assert.equal(result.verifiedPayment, false)
  assert.equal(calls, 1)
})
