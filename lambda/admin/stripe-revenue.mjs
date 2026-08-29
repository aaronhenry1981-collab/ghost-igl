const LIVE_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid', 'incomplete', 'paused'])

function priceFor(subscription) {
  return subscription?.items?.data?.[0]?.price || null
}

function priceIdFor(subscription) {
  return priceFor(subscription)?.id || null
}

export function reconPriceIds(env = process.env) {
  return new Set([
    env.STRIPE_PRO_PRICE_ID,
    env.STRIPE_PRO_FOUNDING_PRICE_ID,
    env.STRIPE_PRO_ALL_ACCESS_PRICE_ID,
    env.STRIPE_PRO_ALL_ACCESS_ANNUAL_PRICE_ID,
    env.STRIPE_CHAMPION_PRICE_ID,
    env.STRIPE_CHAMPION_FOUNDING_PRICE_ID,
    env.STRIPE_CHAMPION_REGULAR_PRICE_ID,
    env.STRIPE_CHAMPION_ALL_ACCESS_PRICE_ID,
    env.STRIPE_CHAMPION_ALL_ACCESS_ANNUAL_PRICE_ID,
    env.STRIPE_COACHING_ADDON_PRICE_ID,
  ].filter(Boolean))
}

export function isReconSubscription(subscription, env = process.env) {
  const priceId = priceIdFor(subscription)
  if (priceId && reconPriceIds(env).has(priceId)) return true
  const metadata = subscription?.metadata || {}
  return metadata.product === 'ghost-igl' || metadata.site === 'r6coaching'
}

function customerIdFor(subscription) {
  return typeof subscription?.customer === 'string'
    ? subscription.customer
    : subscription?.customer?.id || null
}

export function monthlyRecurringCents(price) {
  const amount = Number(price?.unit_amount || 0)
  const intervalCount = Math.max(1, Number(price?.recurring?.interval_count || 1))
  switch (price?.recurring?.interval) {
    case 'day': return Math.round(amount * 30 / intervalCount)
    case 'week': return Math.round(amount * 52 / 12 / intervalCount)
    case 'year': return Math.round(amount / (12 * intervalCount))
    case 'month': return Math.round(amount / intervalCount)
    default: return 0
  }
}

export function billingStateFor(subscription) {
  if (!subscription) return 'free'
  if (subscription.status === 'trialing') return subscription.cancel_at_period_end ? 'ending' : 'trialing'
  if (subscription.status === 'past_due' || subscription.status === 'unpaid' || subscription.status === 'incomplete') return 'payment_issue'
  if (subscription.status === 'active' && (subscription.cancel_at_period_end || subscription.cancel_at)) return 'ending'
  if (subscription.status === 'active') return 'paid'
  if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') return 'canceled'
  return subscription.status || 'unknown'
}

export function planFor(subscription, fallbackPlan = 'free', env = process.env) {
  const price = priceFor(subscription)
  const priceId = price?.id
  const known = new Map([
    [env.STRIPE_PRO_PRICE_ID, 'pro'],
    [env.STRIPE_PRO_FOUNDING_PRICE_ID, 'pro'],
    [env.STRIPE_PRO_ALL_ACCESS_PRICE_ID, 'pro'],
    [env.STRIPE_PRO_ALL_ACCESS_ANNUAL_PRICE_ID, 'pro'],
    [env.STRIPE_ELITE_PRICE_ID, 'elite'],
    [env.STRIPE_CHAMPION_PRICE_ID, 'champion'],
    [env.STRIPE_CHAMPION_FOUNDING_PRICE_ID, 'champion'],
    [env.STRIPE_CHAMPION_REGULAR_PRICE_ID, 'champion'],
    [env.STRIPE_CHAMPION_ALL_ACCESS_PRICE_ID, 'champion'],
    [env.STRIPE_CHAMPION_ALL_ACCESS_ANNUAL_PRICE_ID, 'champion'],
  ].filter(([id]) => Boolean(id)))
  if (known.has(priceId)) return known.get(priceId)

  const named = [
    subscription?.metadata?.plan,
    price?.nickname,
    price?.lookup_key,
    typeof price?.product === 'object' ? price.product?.name : null,
  ].filter(Boolean).join(' ').toLowerCase()
  if (named.includes('champion')) return 'champion'
  if (named.includes('elite')) return 'elite'
  if (named.includes('pro')) return 'pro'
  return ['pro', 'elite', 'champion'].includes(fallbackPlan) ? fallbackPlan : 'free'
}

export function summarizeStripeSubscriptions(subscriptions, fallbackPlanByCustomer = new Map(), env = process.env) {
  let paying = 0
  let trialing = 0
  let pastDue = 0
  let ending = 0
  let pro = 0
  let elite = 0
  let champion = 0
  let mrrCents = 0
  let trialMrrCents = 0

  for (const subscription of subscriptions) {
    const recurringCents = monthlyRecurringCents(priceFor(subscription))
    const plan = planFor(subscription, fallbackPlanByCustomer.get(customerIdFor(subscription)), env)
    const state = billingStateFor(subscription)
    if (state === 'payment_issue') pastDue += 1
    if (state === 'ending') ending += 1
    if (subscription.status === 'trialing') {
      trialing += 1
      trialMrrCents += recurringCents
      continue
    }
    if (subscription.status !== 'active' || recurringCents <= 0) continue
    paying += 1
    mrrCents += recurringCents
    if (plan === 'pro') pro += 1
    else if (plan === 'elite') elite += 1
    else if (plan === 'champion') champion += 1
  }

  return {
    paying_active: paying,
    trialing,
    trials_expected_to_convert: trialing - subscriptions.filter((s) => s.status === 'trialing' && s.cancel_at_period_end).length,
    ending,
    past_due: pastDue,
    pro_active: pro,
    elite_active: elite,
    champion_active: champion,
    mrr_cents: mrrCents,
    mrr_dollars: (mrrCents / 100).toFixed(2),
    arr_dollars: (mrrCents * 12 / 100).toFixed(2),
    trial_mrr_dollars: (trialMrrCents / 100).toFixed(2),
    revenue_verified: true,
  }
}

export function isLiveStripeSubscription(subscription) {
  return LIVE_STATUSES.has(subscription?.status)
}

export function stripeSubscriptionDetails(subscription, fallbackPlan = 'free', env = process.env) {
  const price = priceFor(subscription)
  // Stripe's Basil-era API moved billing-period timestamps from the
  // subscription to each subscription item. Accept the legacy field too so
  // older webhook payloads and newer list responses both show a renewal date.
  const item = subscription?.items?.data?.[0]
  const periodEnd = item?.current_period_end || subscription?.current_period_end || subscription?.cancel_at || null
  const state = billingStateFor(subscription)
  return {
    plan: planFor(subscription, fallbackPlan, env),
    billing_state: state,
    sub_status: subscription?.status || 'none',
    price_amount_cents: Number(price?.unit_amount || 0),
    next_billing_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    will_renew: ['paid', 'trialing'].includes(state),
    has_collected_payment: ['active', 'past_due', 'unpaid', 'canceled'].includes(subscription?.status),
    stripe_customer_id: customerIdFor(subscription),
    stripe_subscription_id: subscription?.id || null,
  }
}
