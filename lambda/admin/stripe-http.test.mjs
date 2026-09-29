// The shared Stripe client: query/form encoding and the idempotency key on
// POST (what the referral credit relies on). fetch is stubbed.
import test from 'node:test'
import assert from 'node:assert/strict'
import { createStripeHttp } from './stripe-http.mjs'

test('GET encodes params; POST is form-encoded with the idempotency key', async () => {
  const calls = []
  const fetchImpl = async (url, init = {}) => { calls.push({ url, init }); return { ok: true, json: async () => ({ id: 'obj_1' }) } }
  const s = createStripeHttp(['sk', 'test', 'fixture'].join('_'), fetchImpl)
  await s.get('/v1/customers/cus_1/balance_transactions', { limit: 100, starting_after: undefined })
  assert.equal(calls[0].url, 'https://api.stripe.com/v1/customers/cus_1/balance_transactions?limit=100')
  await s.post('/v1/customers/cus_1/balance_transactions', { amount: '-1200', 'metadata[recon_reward_id]': 'rr_1' }, 'recon-referral-reward-rr_1')
  assert.equal(calls[1].init.method, 'POST')
  assert.equal(calls[1].init.headers['Idempotency-Key'], 'recon-referral-reward-rr_1')
  assert.equal(calls[1].init.body, 'amount=-1200&metadata%5Brecon_reward_id%5D=rr_1')
})

test('HTTP errors throw; a missing key refuses to call Stripe', async () => {
  const s = createStripeHttp(['sk', 'test', 'fixture'].join('_'), async () => ({ ok: false, status: 402 }))
  await assert.rejects(s.post('/v1/x', {}, 'k'), /HTTP 402/)
  await assert.rejects(createStripeHttp('').get('/v1/x'), /not configured/)
})
