import Stripe from 'stripe'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE = process.env.SUBSCRIPTIONS_TABLE || 'ghost-igl-subscriptions'

export async function handler(event) {
  const sig = event.headers?.['stripe-signature']
  let stripeEvent

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckout(stripeEvent.data.object)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubUpdate(stripeEvent.data.object)
        break
      case 'customer.subscription.deleted':
        await handleSubDeleted(stripeEvent.data.object)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object)
        break
      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`)
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) }
  } catch (err) {
    console.error('Error processing webhook:', err)
    return { statusCode: 500, body: 'Internal error' }
  }
}

async function handleCheckout(session) {
  if (session.mode !== 'subscription') return

  const customerId = session.customer
  const customerEmail = session.customer_email || session.customer_details?.email
  const subscriptionId = session.subscription

  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  const plan = getPlanFromPrice(sub.items.data[0]?.price?.id)

  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: {
      stripe_customer_id: customerId,
      email: customerEmail?.toLowerCase(),
      stripe_subscription_id: subscriptionId,
      plan,
      status: 'active',
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  }))
}

async function handleSubUpdate(sub) {
  const plan = getPlanFromPrice(sub.items.data[0]?.price?.id)

  await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { stripe_customer_id: sub.customer },
    UpdateExpression: 'SET #s = :status, #p = :plan, current_period_end = :end, updated_at = :now, stripe_subscription_id = :subId',
    ExpressionAttributeNames: { '#s': 'status', '#p': 'plan' },
    ExpressionAttributeValues: {
      ':status': sub.status === 'active' ? 'active' : sub.status,
      ':plan': plan,
      ':end': new Date(sub.current_period_end * 1000).toISOString(),
      ':now': new Date().toISOString(),
      ':subId': sub.id,
    },
  }))
}

async function handleSubDeleted(sub) {
  await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { stripe_customer_id: sub.customer },
    UpdateExpression: 'SET #s = :status, updated_at = :now',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':status': 'canceled',
      ':now': new Date().toISOString(),
    },
  }))
}

async function handlePaymentFailed(invoice) {
  await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { stripe_customer_id: invoice.customer },
    UpdateExpression: 'SET #s = :status, updated_at = :now',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':status': 'past_due',
      ':now': new Date().toISOString(),
    },
  }))
}

function getPlanFromPrice(priceId) {
  const priceMap = {
    [process.env.STRIPE_PRO_PRICE_ID || 'price_pro']: 'pro',
    [process.env.STRIPE_CHAMPION_PRICE_ID || 'price_champion']: 'champion',
  }
  return priceMap[priceId] || 'pro'
}
