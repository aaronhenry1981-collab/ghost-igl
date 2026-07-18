// Proves the $70/mo coaching add-on WEBHOOK wiring for real: drives the actual
// exported handler() with signed Stripe events and a mocked fetch, asserting
// that add-on invoices/checkouts ping the booking Lambda's /booking/credits
// (the monthly reset) and that ordinary app-plan events never do.
//
// Run: node --test lambda/webhook/coaching-addon.test.mjs
// (colocated so `stripe` / `@aws-sdk/*` resolve from this Lambda's node_modules)

import test, { mock } from 'node:test'
import assert from 'node:assert/strict'

process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
process.env.COACHING_ADDON_PRICE_ID = 'price_addon_test'
process.env.BOOKING_API = 'https://booking.test'

const { handler } = await import('./index.mjs')
const Stripe = (await import('stripe')).default
const signer = new Stripe('sk_test_dummy')

// Same resource class across Stripe instances → patching this prototype also
// intercepts the module's internal `stripe.subscriptions.retrieve`.
const subsProto = Object.getPrototypeOf(signer.subscriptions)
mock.method(subsProto, 'retrieve', async (id) => ({
  id, status: 'active',
  items: { data: [{ price: { id: 'price_addon_test' } }] },
  customer_email: 'player@test.com',
}))

// Capture outbound POSTs the webhook makes to the booking Lambda.
let fetchCalls = []
globalThis.fetch = async (url, opts) => {
  fetchCalls.push({ url, body: JSON.parse(opts.body) })
  return { status: 200, json: async () => ({ ok: true }) }
}

// Build a signed API-Gateway event Stripe's constructEvent() will accept.
function signed(obj) {
  const payload = JSON.stringify(obj)
  const sig = signer.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET })
  return { headers: { 'stripe-signature': sig }, body: payload, isBase64Encoded: false }
}

test('invoice.paid on the add-on price resets the monthly credit (pings /booking/credits)', async () => {
  fetchCalls = []
  const res = await handler(signed({
    id: 'evt_addon', type: 'invoice.paid',
    data: { object: { id: 'in_1', subscription: 'sub_ADDON', lines: { data: [{ price: { id: 'price_addon_test' } }] } } },
  }))
  assert.equal(res.statusCode, 200)
  const call = fetchCalls.find((c) => c.url === 'https://booking.test/booking/credits')
  assert.ok(call, 'add-on invoice.paid must POST /booking/credits')
  assert.equal(call.body.subscriptionId, 'sub_ADDON')
})

test('invoice.paid on an ordinary app-plan invoice does NOT touch coaching credits', async () => {
  fetchCalls = []
  const res = await handler(signed({
    id: 'evt_app', type: 'invoice.paid',
    data: { object: { id: 'in_2', subscription: 'sub_APP', lines: { data: [{ price: { id: 'price_pro_plan' } }] } } },
  }))
  assert.equal(res.statusCode, 200)
  assert.equal(fetchCalls.some((c) => c.url.endsWith('/booking/credits')), false)
})

test('invoice.paid add-on with no subscription id is a no-op (guard)', async () => {
  fetchCalls = []
  await handler(signed({
    id: 'evt_nosub', type: 'invoice.paid',
    data: { object: { id: 'in_3', subscription: null, lines: { data: [{ price: { id: 'price_addon_test' } }] } } },
  }))
  assert.equal(fetchCalls.some((c) => c.url.endsWith('/booking/credits')), false)
})

test('checkout.session.completed for the add-on subscription grants the first credit', async () => {
  fetchCalls = []
  const res = await handler(signed({
    id: 'evt_co', type: 'checkout.session.completed',
    data: { object: { id: 'cs_1', mode: 'subscription', subscription: 'sub_CHECKOUT', customer: 'cus_1', customer_email: 'player@test.com' } },
  }))
  assert.equal(res.statusCode, 200)
  const call = fetchCalls.find((c) => c.url === 'https://booking.test/booking/credits')
  assert.ok(call, 'add-on checkout must POST /booking/credits')
  assert.equal(call.body.subscriptionId, 'sub_CHECKOUT')
})
