import test, { mock } from 'node:test'
import assert from 'node:assert/strict'

process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_receipt'
process.env.STRIPE_PRO_PRICE_ID = 'price_pro_receipt_test'

const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb')
const Stripe = (await import('stripe')).default

const rows = new Map()
mock.method(DynamoDBDocumentClient.prototype, 'send', async (command) => {
  const name = command.constructor.name
  const input = command.input

  if (name === 'QueryCommand') {
    if (input.IndexName === 'email-index') {
      const email = input.ExpressionAttributeValues?.[':e'] || input.ExpressionAttributeValues?.[':email']
      return { Items: [...rows.values()].filter((row) => row.email === email) }
    }
    return { Items: [] }
  }

  if (name === 'GetCommand') return { Item: undefined }

  if (name === 'PutCommand' && input.TableName === 'ghost-igl-subscriptions') {
    rows.set(input.Item.stripe_customer_id, { ...input.Item })
    return {}
  }

  if (name === 'UpdateCommand' && input.TableName === 'ghost-igl-subscriptions') {
    const row = rows.get(input.Key.stripe_customer_id)
    assert.ok(row, 'subscription update must target the row written by checkout')
    const values = input.ExpressionAttributeValues
    rows.set(input.Key.stripe_customer_id, {
      ...row,
      status: values[':status'],
      plan: values[':plan'],
      tier_scope: values[':scope'],
      price_id: values[':priceId'],
      current_period_end: values[':end'],
      updated_at: values[':now'],
      stripe_subscription_id: values[':subId'],
      last_processed_event_id: values[':evtId'],
      last_event_version: values[':evtVersion'],
    })
    return {}
  }

  return {}
})

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const subscriptions = Object.getPrototypeOf(stripe.subscriptions)
mock.method(subscriptions, 'retrieve', async (id) => ({
  id,
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
