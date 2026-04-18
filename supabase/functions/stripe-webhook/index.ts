// Supabase Edge Function: Stripe webhook handler
// Keeps the subscriptions table in sync when customers pay, cancel, or fail payment.
//
// Deploy:
//   supabase functions deploy stripe-webhook --no-verify-jwt
//
// Set secrets:
//   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
//   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
//
// Configure in Stripe Dashboard → Developers → Webhooks:
//   Endpoint: https://zewzeaoecdjcbkdqpcfh.supabase.co/functions/v1/stripe-webhook
//   Events: customer.subscription.created
//           customer.subscription.updated
//           customer.subscription.deleted
//           checkout.session.completed
//           invoice.payment_failed

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Map Stripe product/price IDs to plan names.
// IMPORTANT: Update these IDs when products change.
const PRICE_TO_PLAN: Record<string, 'pro' | 'champion'> = {
  price_1TLEtrJNddvjgWcg9iTWJoLS: 'pro',
  price_1TLEtsJNddvjgWcgYcmiNmW7: 'champion'
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
})

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing signature', { status: 400 })
  }

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET,
      undefined,
      cryptoProvider
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(sub)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(sub)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }
      default:
        console.log('Unhandled event type:', event.type)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Webhook handler error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function findUserByEmail(email: string): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) {
    console.error('Error listing users:', error)
    return null
  }
  const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  return user?.id ?? null
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription') return
  const email = session.customer_details?.email || session.customer_email
  if (!email) {
    console.warn('Checkout completed without email')
    return
  }
  const userId = await findUserByEmail(email)
  if (!userId) {
    console.warn('Checkout completed for unknown user email:', email)
    return
  }

  const subId = session.subscription as string
  if (!subId) return
  const sub = await stripe.subscriptions.retrieve(subId)
  await upsertSubscription(userId, sub)
}

async function handleSubscriptionChange(sub: Stripe.Subscription) {
  const customer = await stripe.customers.retrieve(sub.customer as string)
  if (!customer || (customer as Stripe.DeletedCustomer).deleted) return
  const email = (customer as Stripe.Customer).email
  if (!email) return
  const userId = await findUserByEmail(email)
  if (!userId) {
    console.warn('Subscription for unknown user:', email)
    return
  }
  await upsertSubscription(userId, sub)
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const customer = await stripe.customers.retrieve(sub.customer as string)
  if (!customer || (customer as Stripe.DeletedCustomer).deleted) return
  const email = (customer as Stripe.Customer).email
  if (!email) return
  const userId = await findUserByEmail(email)
  if (!userId) return

  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      plan: 'free',
      stripe_subscription_id: sub.id,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return
  const sub = await stripe.subscriptions.retrieve(invoice.subscription as string)
  await handleSubscriptionChange(sub)
}

async function upsertSubscription(userId: string, sub: Stripe.Subscription) {
  // Determine plan from the first subscription item's price
  const priceId = sub.items.data[0]?.price.id
  const plan = priceId ? PRICE_TO_PLAN[priceId] ?? 'free' : 'free'

  // Only mark active if Stripe status is active or trialing
  const isActive = sub.status === 'active' || sub.status === 'trialing'

  const { error } = await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      status: isActive ? 'active' : sub.status,
      plan: isActive ? plan : 'free',
      stripe_customer_id: sub.customer as string,
      stripe_subscription_id: sub.id,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    console.error('Error upserting subscription:', error)
    throw error
  }

  console.log(`Synced subscription for user ${userId}: ${plan} (${sub.status})`)
}
