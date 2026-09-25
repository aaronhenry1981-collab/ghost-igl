// Plan catalog and billing truth for the Recon 6 customer-success layer.
//
// This module is deliberately pure (no AWS SDK, no Node built-ins) so the same
// rules run in the customer-success Lambda AND in the browser's lite-mode home.
//
// Live plans (production, September 2026):
//   Basic    - free signed-in account (no active paid row)
//   Pro      - $9 founding / $12 regular (legacy All-Access $19/$190 also Pro)
//   Elite    - the former digital "Champion" tier: $29 legacy founding, $39
//              regular (legacy All-Access $49/$490 also Elite)
//   Champion - $70/mo high-touch membership: everything in Elite plus two live
//              1:1 coaching sessions with Aaron each month
//
// Access rules mirror the production subscription Lambda exactly
// (`effectivePlan`, `isActiveSub`, `pickBestSub`): a legacy Elite price always
// resolves to Elite even though older ledger rows still carry the label
// "champion". Where the ledger label and the price disagree we keep production's
// answer for access and surface the disagreement as a diagnostic instead of
// silently "fixing" a customer's entitlement.

export const PLAN_RANK = Object.freeze({ free: 0, pro: 1, elite: 2, champion: 3 })

export const PLAN_LABEL = Object.freeze({
  free: 'Basic',
  pro: 'Pro',
  elite: 'Elite',
  champion: 'Champion',
})

export const PAID_PLANS = Object.freeze(['pro', 'elite', 'champion'])

// Known live Stripe prices. `amount` is in whole dollars per `interval`.
export const PRICE_CATALOG = Object.freeze({
  price_1TPtOKJNddvjgWcg47I16AQp: { plan: 'pro', amount: 9, interval: 'month', scope: 'single', name: 'Pro (founding rate)' },
  price_1TLEtrJNddvjgWcg9iTWJoLS: { plan: 'pro', amount: 12, interval: 'month', scope: 'single', name: 'Pro' },
  price_1TVUcxJNddvjgWcgBImnUKZe: { plan: 'pro', amount: 19, interval: 'month', scope: 'all_access', name: 'Pro All-Access (legacy)' },
  price_1TVUd3JNddvjgWcgShz9Ndg5: { plan: 'pro', amount: 190, interval: 'year', scope: 'all_access', name: 'Pro All-Access annual (legacy)' },
  price_1TLEtsJNddvjgWcgYcmiNmW7: { plan: 'elite', amount: 29, interval: 'month', scope: 'single', name: 'Elite (legacy founding rate)' },
  price_1TPtOYJNddvjgWcgfEWjzGnp: { plan: 'elite', amount: 39, interval: 'month', scope: 'single', name: 'Elite' },
  price_1TVUd0JNddvjgWcgIPWakA3S: { plan: 'elite', amount: 49, interval: 'month', scope: 'all_access', name: 'Elite All-Access (legacy)' },
  price_1TVUd6JNddvjgWcgc3csHICD: { plan: 'elite', amount: 490, interval: 'year', scope: 'all_access', name: 'Elite All-Access annual (legacy)' },
  price_1TzrjiJNddvjgWcgw1DYSf88: { plan: 'champion', amount: 70, interval: 'month', scope: 'single', name: 'Champion' },
})

// Monthly VOD session allowances. Env names and defaults match the production
// subscription Lambda so the customer home never promises a different number
// than the upload endpoint enforces.
export const DEFAULT_VOD_LIMITS = Object.freeze({
  trial: 3,
  pro: 20,
  pro_all_access: 30,
  elite: 60,
  elite_all_access: 75,
  champion: 75,
  champion_all_access: 90,
})

export const VOD_PERIOD_MS = 30 * 24 * 60 * 60 * 1000

// What each plan genuinely includes. Only list things that ship today.
export const PLAN_FEATURES = Object.freeze({
  free: ['Free sample maps and round plans', 'Operator catalog', 'Road to Champion checklist'],
  pro: ['Every ranked map and site plan', 'Match prep and ban recommendations', 'AI VOD review'],
  elite: ['Everything in Pro', 'Premium tactics and verified setups', 'Larger VOD review allowance'],
  champion: ['Everything in Elite', 'Two live 1:1 coaching sessions with Aaron each month'],
})

export const COACHING_SESSIONS_PER_MONTH = Object.freeze({ free: 0, pro: 0, elite: 0, champion: 2 })

const LIVE_STATUSES = new Set(['active', 'trialing'])
const PAYMENT_ISSUE_STATUSES = new Set(['past_due', 'unpaid', 'incomplete'])
const ENDED_STATUSES = new Set(['canceled', 'cancelled', 'incomplete_expired', 'expired', 'churned', 'refunded'])

export function normalizePlan(plan) {
  const value = String(plan || '').trim().toLowerCase()
  return Object.prototype.hasOwnProperty.call(PLAN_RANK, value) ? value : 'free'
}

export function planLabel(plan) {
  return PLAN_LABEL[normalizePlan(plan)]
}

export function hasPlan(plan, minimum) {
  return (PLAN_RANK[normalizePlan(plan)] || 0) >= (PLAN_RANK[normalizePlan(minimum)] || 0)
}

function toMs(value) {
  if (value === null || value === undefined || value === '') return NaN
  if (typeof value === 'number') return value < 1e12 ? value * 1000 : value
  return Date.parse(value)
}

function iso(ms) {
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null
}

// Build a catalog that also recognises price IDs configured through the same
// environment variables the production webhook reads.
export function createPlanCatalog({ extraPriceIds = {} } = {}) {
  const priceToPlan = new Map(Object.entries(PRICE_CATALOG).map(([id, info]) => [id, info.plan]))
  for (const plan of PAID_PLANS) {
    for (const id of extraPriceIds[plan] || []) {
      if (id && !priceToPlan.has(id)) priceToPlan.set(id, plan)
    }
  }
  const allAccess = new Set(Object.entries(PRICE_CATALOG).filter(([, info]) => info.scope === 'all_access').map(([id]) => id))
  for (const id of extraPriceIds.all_access || []) if (id) allAccess.add(id)

  return {
    planForPrice(priceId) {
      return priceToPlan.get(priceId) || null
    },
    scopeForPrice(priceId) {
      return allAccess.has(priceId) ? 'all_access' : 'single'
    },
    priceInfo(priceId) {
      return PRICE_CATALOG[priceId] || null
    },
  }
}

// Read the same env names the production webhook/subscription Lambdas use.
export function catalogFromEnv(env = {}) {
  const pick = (...names) => names.map((name) => env[name]).filter(Boolean)
  return createPlanCatalog({
    extraPriceIds: {
      pro: pick('STRIPE_PRO_PRICE_ID', 'STRIPE_PRO_FOUNDING_PRICE_ID', 'STRIPE_PRO_ALL_ACCESS_PRICE_ID', 'STRIPE_PRO_ALL_ACCESS_ANNUAL_PRICE_ID'),
      elite: pick(
        'STRIPE_ELITE_PRICE_ID',
        'STRIPE_CHAMPION_PRICE_ID',
        'STRIPE_CHAMPION_FOUNDING_PRICE_ID',
        'STRIPE_CHAMPION_REGULAR_PRICE_ID',
        'STRIPE_CHAMPION_ALL_ACCESS_PRICE_ID',
        'STRIPE_CHAMPION_ALL_ACCESS_ANNUAL_PRICE_ID',
      ),
      champion: pick('STRIPE_CHAMPION_MEMBERSHIP_PRICE_ID'),
      all_access: pick(
        'STRIPE_PRO_ALL_ACCESS_PRICE_ID',
        'STRIPE_PRO_ALL_ACCESS_ANNUAL_PRICE_ID',
        'STRIPE_CHAMPION_ALL_ACCESS_PRICE_ID',
        'STRIPE_CHAMPION_ALL_ACCESS_ANNUAL_PRICE_ID',
      ),
    },
  })
}

const DEFAULT_CATALOG = createPlanCatalog()

// Production `effectivePlan`: a legacy Elite price always wins; otherwise the
// ledger label decides access.
export function effectivePlan(row, catalog = DEFAULT_CATALOG) {
  if (!row) return 'free'
  if (catalog.planForPrice(row.price_id) === 'elite') return 'elite'
  return normalizePlan(row.plan)
}

// Production `isActiveSub`: active or trialing AND paid through a future date.
export function isActiveSub(row, now = Date.now()) {
  if (!row) return false
  if (!LIVE_STATUSES.has(row.status)) return false
  const end = toMs(row.current_period_end)
  return Number.isFinite(end) && end > now
}

// Production `pickBestSub`: highest plan among live rows, then furthest
// paid-through date. When nothing is live we return the most recently
// updated row so the status we display is the latest one, not an arbitrary one.
export function pickBestSub(rows, { catalog = DEFAULT_CATALOG, now = Date.now() } = {}) {
  const list = Array.isArray(rows) ? rows.filter(Boolean) : []
  const live = list.filter((row) => isActiveSub(row, now))
  if (live.length) {
    return live.slice().sort((a, b) => {
      const byPlan = (PLAN_RANK[effectivePlan(b, catalog)] || 0) - (PLAN_RANK[effectivePlan(a, catalog)] || 0)
      if (byPlan) return byPlan
      return String(b.current_period_end || '').localeCompare(String(a.current_period_end || ''))
    })[0]
  }
  return latestRow(list)
}

function rowTimestamp(row) {
  const candidates = [row.updated_at, row.current_period_end, row.created_at].map(toMs).filter(Number.isFinite)
  return candidates.length ? Math.max(...candidates) : 0
}

function latestRow(rows) {
  if (!rows.length) return null
  return rows.slice().sort((a, b) => rowTimestamp(b) - rowTimestamp(a))[0]
}

function isStripeBilled(row) {
  return Boolean(row && row.comp !== true && String(row.stripe_customer_id || '').startsWith('cus_'))
}

// Everything the customer home and the CRM need to know about billing, derived
// only from ledger rows the webhook wrote. `source` and `asOf` travel with the
// answer so nothing downstream presents ledger data as a live Stripe read.
export function resolveBilling(rows, { catalog = DEFAULT_CATALOG, now = Date.now(), isAdmin = false, available = true } = {}) {
  if (!available) {
    return {
      available: false,
      source: 'webhook_ledger',
      plan: isAdmin ? 'champion' : null,
      planLabel: isAdmin ? PLAN_LABEL.champion : null,
      status: 'unknown',
      hasAccess: isAdmin ? true : null,
    }
  }
  const list = Array.isArray(rows) ? rows.filter(Boolean) : []
  const best = pickBestSub(list, { catalog, now })
  const live = list.filter((row) => isActiveSub(row, now))
  const hasAccess = isAdmin || isActiveSub(best, now)
  const plan = isAdmin ? 'champion' : hasAccess ? effectivePlan(best, catalog) : 'free'
  const pricePlan = best ? catalog.planForPrice(best.price_id) : null
  const labelPlan = best?.plan ? normalizePlan(best.plan) : null
  const priceInfo = best ? catalog.priceInfo(best.price_id) : null
  const endMs = toMs(best?.current_period_end)
  const cancelAtPeriodEnd = best?.cancel_at_period_end === true
  const rowStatus = best?.status || null

  const paidRows = list.filter((row) => isStripeBilled(row) || catalog.planForPrice(row.price_id))
  const everPaid = paidRows.some((row) => row.status !== 'incomplete' && row.status !== 'incomplete_expired')
  const stale = Boolean(best && LIVE_STATUSES.has(best.status) && Number.isFinite(endMs) && endMs <= now)
  const paymentIssue = !hasAccess && best && PAYMENT_ISSUE_STATUSES.has(best.status) ? best.status : null

  let status
  if (isAdmin) status = 'admin'
  else if (!best) status = 'none'
  // No-card trial rows (`comp: true, trial: true`, written by /me/start-trial)
  // are trials, not gifts.
  else if (hasAccess && best.trial === true) status = 'trialing'
  else if (hasAccess && best.comp === true) status = 'comp'
  else if (hasAccess && cancelAtPeriodEnd) status = 'cancelling'
  else if (hasAccess && best.status === 'trialing') status = 'trialing'
  else if (hasAccess) status = 'active'
  else if (paymentIssue) status = 'payment_failed'
  else if (stale && best.comp === true) status = 'comp_expired'
  else if (stale) status = 'renewal_unconfirmed'
  else if (ENDED_STATUSES.has(best.status) || Number.isFinite(endMs)) status = 'ended'
  else status = 'none'

  // past_due means Stripe is still retrying: at risk, not gone. A stale ledger
  // row may belong to someone Stripe renewed successfully, so it is never
  // counted as churn on its own.
  const churned = !isAdmin && !hasAccess && everPaid && (status === 'ended' || rowStatus === 'unpaid')
  const lastPaidRow = latestRow(paidRows)
  const paymentIssueRows = list.filter((row) => PAYMENT_ISSUE_STATUSES.has(row.status) && toMs(row.current_period_end) > now - 45 * 86400000).length

  return {
    available: true,
    source: 'webhook_ledger',
    asOf: iso(Math.max(0, ...list.map((row) => toMs(row.updated_at)).filter(Number.isFinite))) || null,
    plan,
    planLabel: isAdmin ? 'CEO' : PLAN_LABEL[plan],
    status,
    rowStatus,
    hasAccess,
    isComp: best?.comp === true && best?.trial !== true,
    isTrial: Boolean(best && (best.trial === true || best.status === 'trialing')),
    // A paid member has access through a Stripe-billed row (not a comp).
    isPaidMember: Boolean(!isAdmin && hasAccess && best && isStripeBilled(best)),
    isPaying: Boolean(!isAdmin && hasAccess && best && isStripeBilled(best) && best.status === 'active'),
    paymentIssueRows,
    currentPeriodEnd: iso(endMs),
    cancelAtPeriodEnd,
    paymentIssue,
    stale,
    tierScope: best?.tier_scope === 'all_access' || catalog.scopeForPrice(best?.price_id) === 'all_access' ? 'all_access' : 'single',
    priceId: best?.price_id || null,
    priceName: priceInfo?.name || null,
    amount: priceInfo?.amount ?? null,
    interval: priceInfo?.interval || null,
    pricePlan,
    labelPlan,
    labelMismatch: Boolean(pricePlan && labelPlan && pricePlan !== labelPlan && !(pricePlan === 'elite' && labelPlan === 'champion')),
    everPaid,
    churned,
    lastPaidPlan: lastPaidRow ? effectivePlan(lastPaidRow, catalog) : null,
    endedAt: churned ? iso(endMs) : null,
    rowCount: list.length,
    liveRowCount: live.length,
    duplicateLiveRows: live.filter(isStripeBilled).length > 1,
    stripeCustomerId: best?.stripe_customer_id || null,
  }
}

export function vodLimitFor(plan, tierScope, limits = DEFAULT_VOD_LIMITS) {
  const normalized = normalizePlan(plan)
  if (normalized === 'free') return 0
  const key = tierScope === 'all_access' ? `${normalized}_all_access` : normalized
  return limits[key] ?? limits[normalized] ?? 0
}

// Mirrors the production `computeVodUsage` so the home shows the same numbers
// the VOD upload endpoint enforces.
export function computeVodUsage(row, plan, tierScope, { now = Date.now(), limits = DEFAULT_VOD_LIMITS, isAdmin = false } = {}) {
  const normalized = normalizePlan(plan)
  if (normalized === 'free' && !isAdmin) return null
  if (!row) return { used: 0, limit: null, remaining: null, isTrial: false, periodEnd: null, unlimited: true }
  if (row.trial === true) {
    const used = Number(row.vod_lifetime_used || 0)
    const limit = limits.trial
    return { used, limit, remaining: Math.max(0, limit - used), isTrial: true, periodEnd: null, unlimited: false }
  }
  const periodStart = toMs(row.vod_period_start_at)
  const periodEnd = Number.isFinite(periodStart) ? periodStart + VOD_PERIOD_MS : NaN
  const expired = !Number.isFinite(periodStart) || now > periodEnd
  const used = expired ? 0 : Number(row.vod_sessions_used || 0)
  const limit = vodLimitFor(normalized, tierScope, limits)
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    isTrial: false,
    periodEnd: expired ? null : iso(periodEnd),
    unlimited: false,
  }
}

export function vodLimitsFromEnv(env = {}) {
  const read = (name, fallback) => {
    const value = Number.parseInt(env[name] ?? '', 10)
    return Number.isFinite(value) && value >= 0 ? value : fallback
  }
  return {
    trial: read('VOD_TRIAL_LIMIT', DEFAULT_VOD_LIMITS.trial),
    pro: read('VOD_PRO_LIMIT', DEFAULT_VOD_LIMITS.pro),
    pro_all_access: read('VOD_PRO_ALL_LIMIT', DEFAULT_VOD_LIMITS.pro_all_access),
    elite: read('VOD_ELITE_LIMIT', DEFAULT_VOD_LIMITS.elite),
    elite_all_access: read('VOD_ELITE_ALL_LIMIT', DEFAULT_VOD_LIMITS.elite_all_access),
    champion: read('VOD_CHAMPION_LIMIT', DEFAULT_VOD_LIMITS.champion),
    champion_all_access: read('VOD_CHAMPION_ALL_LIMIT', DEFAULT_VOD_LIMITS.champion_all_access),
  }
}

// Monthly-equivalent revenue for one row, only when the price is known.
export function monthlyValue(priceId, catalog = DEFAULT_CATALOG) {
  const info = catalog.priceInfo(priceId)
  if (!info) return null
  return info.interval === 'year' ? Math.round((info.amount / 12) * 100) / 100 : info.amount
}
