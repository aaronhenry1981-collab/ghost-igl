// Safeguarded "reconcile memberships from Stripe" (growth audit P0-4).
//
// The old backfill wrote a FULL replacement row for every Stripe subscription
// it listed, canceled ones included, with no preview, confirmation or audit.
// That could wipe usage and identity fields, let an older canceled
// subscription overwrite a live row, and (because its price map disagreed
// with the webhook) relabel every Elite member as Champion.
//
// This module only PLANS. It is pure: the Lambda fetches Stripe subscriptions
// and the current rows, calls planReconciliation(), and shows the preview. An
// apply must send back the preview's id (a hash of the planned changes) and a
// typed confirmation; the Lambda recomputes the plan and refuses if anything
// moved. Each write is conditional on the row still matching the preview.

import { createHash } from 'node:crypto'

// Exactly the webhook's getPlanFromPrice() (lambda/webhook/index.mjs). The
// legacy STRIPE_CHAMPION_* prices are the digital tier now called ELITE; the
// live-coaching Champion membership is its own price. reconcile.test.mjs
// fails if these lists drift from the webhook's.
export const WEBHOOK_PRO_PRICE_IDS = Object.freeze([
  'price_1TPtOKJNddvjgWcg47I16AQp',
  'price_1TLEtrJNddvjgWcg9iTWJoLS',
  'price_1TVUcxJNddvjgWcgBImnUKZe',
  'price_1TVUd3JNddvjgWcgShz9Ndg5',
])
export const WEBHOOK_ELITE_PRICE_IDS = Object.freeze([
  'price_1TLEtsJNddvjgWcgYcmiNmW7',
  'price_1TPtOYJNddvjgWcgfEWjzGnp',
  'price_1TVUd0JNddvjgWcgIPWakA3S',
  'price_1TVUd6JNddvjgWcgc3csHICD',
])
export const DEFAULT_CHAMPION_MEMBERSHIP_PRICE_ID = 'price_1TzrjiJNddvjgWcgw1DYSf88'

export function planFromPrice(priceId, env = {}) {
  if (!priceId) return null
  const pro = [env.STRIPE_PRO_PRICE_ID, env.STRIPE_PRO_FOUNDING_PRICE_ID, env.STRIPE_PRO_ALL_ACCESS_PRICE_ID, env.STRIPE_PRO_ALL_ACCESS_ANNUAL_PRICE_ID, ...WEBHOOK_PRO_PRICE_IDS].filter(Boolean)
  const elite = [env.STRIPE_CHAMPION_PRICE_ID, env.STRIPE_CHAMPION_FOUNDING_PRICE_ID, env.STRIPE_CHAMPION_REGULAR_PRICE_ID, env.STRIPE_CHAMPION_ALL_ACCESS_PRICE_ID, env.STRIPE_CHAMPION_ALL_ACCESS_ANNUAL_PRICE_ID, ...WEBHOOK_ELITE_PRICE_IDS].filter(Boolean)
  const champion = [env.STRIPE_CHAMPION_MEMBERSHIP_PRICE_ID || DEFAULT_CHAMPION_MEMBERSHIP_PRICE_ID]
  if (pro.includes(priceId)) return 'pro'
  if (elite.includes(priceId)) return 'elite'
  if (champion.includes(priceId)) return 'champion'
  return null
}

export const LIVE_STATUSES = Object.freeze(['active', 'trialing', 'past_due'])
const isLive = (status) => LIVE_STATUSES.includes(status)

// The only fields reconciliation may change. Usage (vod_*), identity
// (cognito_sub, email), tier_scope, comp and every other field are kept.
export const BILLING_FIELDS = Object.freeze(['stripe_subscription_id', 'plan', 'status', 'current_period_end'])

// Comp rows are admin-granted access (flagged `comp`, or the 2099 placeholder
// period end). Reconciliation never touches them.
export function isCompRow(row) {
  return Boolean(row?.comp) || String(row?.current_period_end || '').startsWith('2099')
}

const iso = (seconds) => (seconds ? new Date(seconds * 1000).toISOString() : null)

// The subscription that should own a customer's row: a live one beats any
// ended one; ties go to the newest.
export function chooseSubscription(subs) {
  return [...subs].sort((a, b) => (isLive(b.status) - isLive(a.status)) || ((b.created || 0) - (a.created || 0)))[0] || null
}

function billingOf(row) {
  return Object.fromEntries(BILLING_FIELDS.map((f) => [f, row?.[f] ?? null]))
}

export function planReconciliation({ subscriptions, rows, env = {} }) {
  const byCustomer = new Map()
  let ignoredNonMembership = 0
  for (const sub of subscriptions) {
    const plan = planFromPrice(sub.items?.data?.[0]?.price?.id, env)
    if (!plan) { ignoredNonMembership += 1; continue }
    const list = byCustomer.get(sub.customer) || []
    list.push({ ...sub, plan })
    byCustomer.set(sub.customer, list)
  }
  const rowByCustomer = new Map(rows.map((r) => [r.stripe_customer_id, r]))
  const changes = []
  const skipped = []
  let unchanged = 0
  for (const [customer, subs] of [...byCustomer.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const chosen = chooseSubscription(subs)
    const target = { stripe_subscription_id: chosen.id, plan: chosen.plan, status: chosen.status, current_period_end: iso(chosen.current_period_end) }
    const row = rowByCustomer.get(customer)
    if (!row) {
      changes.push({ action: 'create', stripe_customer_id: customer, before: null, after: target, revokesAccess: false })
      continue
    }
    if (isCompRow(row)) { skipped.push({ stripe_customer_id: customer, reason: 'comp_row' }); continue }
    const before = billingOf(row)
    if (isLive(before.status) && !isLive(target.status) && before.stripe_subscription_id !== target.stripe_subscription_id) {
      skipped.push({ stripe_customer_id: customer, reason: 'would_replace_live_row_with_inactive_subscription' })
      continue
    }
    const changed = BILLING_FIELDS.filter((f) => (before[f] ?? null) !== (target[f] ?? null))
    if (!changed.length) { unchanged += 1; continue }
    changes.push({ action: 'update', stripe_customer_id: customer, before, after: target, fields: changed, revokesAccess: isLive(before.status) && !isLive(target.status) })
  }
  const previewId = createHash('sha256').update(JSON.stringify(changes)).digest('hex').slice(0, 16)
  return {
    previewId,
    changes,
    skipped,
    counts: {
      stripeSubscriptions: subscriptions.length,
      membershipCustomers: byCustomer.size,
      ignoredNonMembership,
      rows: rows.length,
      creates: changes.filter((c) => c.action === 'create').length,
      updates: changes.filter((c) => c.action === 'update').length,
      revocations: changes.filter((c) => c.revokesAccess).length,
      unchanged,
      skipped: skipped.length,
    },
  }
}

// What the admin must type to apply, so a stray click can never write.
export function confirmationPhrase(plan) {
  return `APPLY ${plan.changes.length} CHANGES`
}
