import test, { mock } from 'node:test'
import assert from 'node:assert/strict'
import { createFakeDynamo } from './test-support/fakeDynamo.mjs'

process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_receipt'
process.env.STRIPE_PRO_PRICE_ID = 'price_pro_receipt_test'

const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb')
const Stripe = (await import('stripe')).default

const db = createFakeDynamo()
const rows = {
  clear: () => db.reset(),
  get: (id) => db.get('ghost-igl-subscriptions', { stripe_customer_id: id }),
}
mock.method(DynamoDBDocumentClient.prototype, 'send', (command) => db.send(command))

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const subscriptions = Object.getPrototypeOf(stripe.subscriptions)
mock.method(subscriptions, 'retrieve', async (id) => ({
  id,
  customer: 'cus_RECEIPT123',
  status: 'active',
  items: {
    data: [{
      price: { id: process.env.STRIPE_PRO_PRICE_ID },
      current_period_end: 1_900_000_000,
    }],
  },
}))

const { handler } = await import('./index.mjs')

function signed(event) {
  const payload = JSON.stringify(event)
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  })
  return {
    headers: { 'stripe-signature': signature },
    body: payload,
    isBase64Encoded: false,
  }
}

test('signed paid checkout stores its receipt and a later subscription update preserves it', async () => {
  rows.clear()

  const checkout = await handler(signed({
    id: 'evt_checkout_receipt',
    created: 1_800_000_000,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_RECEIPT123',
        mode: 'subscription',
        customer: 'cus_RECEIPT123',
        customer_email: 'owner@example.test',
        subscription: 'sub_RECEIPT123',
        payment_status: 'paid',
        metadata: {
          email: 'owner@example.test',
          cognito_sub: 'cognito-owner-123',
        },
      },
    },
  }))
  assert.equal(checkout.statusCode, 200)
  assert.equal(rows.get('cus_RECEIPT123')?.stripe_checkout_session_id, 'cs_test_RECEIPT123')
  assert.equal(rows.get('cus_RECEIPT123')?.checkout_payment_status, 'paid')
  assert.equal(rows.get('cus_RECEIPT123')?.cognito_sub, 'cognito-owner-123')

  const update = await handler(signed({
    id: 'evt_subscription_after_checkout',
    created: 1_800_000_100,
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: 'sub_RECEIPT123',
        customer: 'cus_RECEIPT123',
        status: 'active',
        items: {
          data: [{
            price: { id: process.env.STRIPE_PRO_PRICE_ID },
            current_period_end: 1_900_000_100,
          }],
        },
      },
    },
  }))
  assert.equal(update.statusCode, 200)

  const afterUpdate = rows.get('cus_RECEIPT123')
  assert.equal(afterUpdate.stripe_checkout_session_id, 'cs_test_RECEIPT123')
  assert.equal(afterUpdate.checkout_payment_status, 'paid')
  assert.equal(afterUpdate.cognito_sub, 'cognito-owner-123')
  assert.equal(afterUpdate.last_processed_event_id, 'evt_subscription_after_checkout')
})


test('checkout on an existing inactive row replaces the receipt under an ownership ticket', async () => {
  rows.clear()
  db.put('ghost-igl-subscriptions', {
    stripe_customer_id: 'cus_RECEIPT123', email: 'owner@example.test',
    stripe_subscription_id: 'sub_OLD', status: 'canceled', plan: 'pro',
    stripe_checkout_session_id: 'cs_test_OLD', checkout_payment_status: 'unpaid',
  })
  const result = await handler(signed({
    id: 'evt_replacement_receipt', created: 1800000200, type: 'checkout.session.completed',
    data: { object: {
      id: 'cs_test_REPLACEMENT', mode: 'subscription', customer: 'cus_RECEIPT123',
      customer_email: 'owner@example.test', subscription: 'sub_RECEIPT123', payment_status: 'paid',
      metadata: { email: 'owner@example.test', cognito_sub: 'cognito-owner-123' },
    } },
  }))
  assert.equal(result.statusCode, 200)
  const row = rows.get('cus_RECEIPT123')
  assert.equal(row.stripe_checkout_session_id, 'cs_test_REPLACEMENT')
  assert.equal(row.checkout_payment_status, 'paid')
  assert.equal(row.stripe_subscription_id, 'sub_RECEIPT123')
  assert.equal(row.applied_seq, row.fetch_seq)
  assert.ok(row.applied_seq > 0)
})
