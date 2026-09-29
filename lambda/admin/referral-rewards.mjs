// Referral free-month rewards, under the terms already published on the
// referral widget and landing page (nothing new is added here):
//   - "Refer 3 friends. Get a free month." A referral counts once the friend
//     has stayed subscribed 30+ days (qualifies_at has passed and the row is
//     not churned or refunded) at the referrer's own tier, the same-tier count
//     the widget shows.
//   - The referrer must be eligible (lambda/subscription referrerIsEligible):
//     a founding referrer, an Elite/Champion All-Access member, or an admin.
//   - Every 3 counted referrals earn one free month, and each referral counts
//     once.
// The free month is a Stripe customer-balance credit of one month of the
// referrer's current subscription price; Stripe takes it off the next invoice.
//
// Duplicate-credit protection, in layers:
//   1. Claim: one DynamoDB transaction writes the ledger row and marks the 3
//      referral rows with its reward_id, each conditional on not being marked
//      yet. The same referral can never back two rewards.
//   2. Lock: a ledger row moves earned -> applying conditionally, so two runs
//      can never apply the same reward at once.
//   3. Stripe: before posting, the customer's balance transactions are
//      searched for this reward_id; the post itself carries an idempotency
//      key. A crash between Stripe and the ledger update finds the credit
//      next run instead of adding a second one.
import { createHash } from 'node:crypto'
import { GetCommand, QueryCommand, ScanCommand, TransactWriteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

export const REFERRALS_TABLE = process.env.REFERRALS_TABLE || 'ghost-igl-referrals'
export const REWARDS_TABLE = process.env.REFERRAL_REWARDS_TABLE || 'ghost-igl-referral-rewards'
const SUBS_TABLE = process.env.SUBSCRIPTIONS_TABLE || 'ghost-igl-subscriptions'
const PROFILES_TABLE = process.env.PROFILES_TABLE || 'ghost-igl-profiles'
export const REFERRALS_PER_REWARD = 3
const LOCK_MS = 10 * 60 * 1000

// Same tier resolution as lambda/subscription (effectivePlan, isActiveSub,
// pickBestSub): legacy Champion prices are Elite.
const PLAN_RANK = { champion: 4, elite: 3, pro: 2, free: 1 }
const LEGACY_ELITE_PRICE_IDS = new Set([
  process.env.STRIPE_CHAMPION_PRICE_ID,
  process.env.STRIPE_CHAMPION_FOUNDING_PRICE_ID,
  process.env.STRIPE_CHAMPION_REGULAR_PRICE_ID,
  process.env.STRIPE_CHAMPION_ALL_ACCESS_PRICE_ID,
  process.env.STRIPE_CHAMPION_ALL_ACCESS_ANNUAL_PRICE_ID,
  'price_1TLEtsJNddvjgWcgYcmiNmW7',
  'price_1TPtOYJNddvjgWcgfEWjzGnp',
  'price_1TVUd0JNddvjgWcgIPWakA3S',
  'price_1TVUd6JNddvjgWcgc3csHICD',
].filter(Boolean))

export const effectivePlan = (sub) => (!sub ? 'free' : LEGACY_ELITE_PRICE_IDS.has(sub.price_id) ? 'elite' : sub.plan || 'free')

export function isActiveSub(s, now = Date.now()) {
  if (!s || (s.status !== 'active' && s.status !== 'trialing')) return false
  const end = Date.parse(s.current_period_end || '')
  return Number.isFinite(end) && end > now
}

export function pickBestSub(items, now = Date.now()) {
  const live = (items || []).filter((s) => isActiveSub(s, now))
  if (!live.length) return null
  return live.slice().sort((a, b) => (PLAN_RANK[effectivePlan(b)] || 0) - (PLAN_RANK[effectivePlan(a)] || 0)
    || String(b.current_period_end || '').localeCompare(String(a.current_period_end || '')))[0]
}

export function referrerIsEligible({ plan, tierScope, foundingReferrer, isAdmin }) {
  if (isAdmin) return true
  if (foundingReferrer) return true
  return (plan === 'elite' || plan === 'champion') && tierScope === 'all_access'
}

export const isCountable = (r, now) => r.status !== 'churned' && r.status !== 'refunded'
  && Number.isFinite(Date.parse(r.qualifies_at || '')) && Date.parse(r.qualifies_at) <= now

export const rewardIdFor = (email, seq) => `rr_${createHash('sha256').update(String(email)).digest('hex').slice(0, 16)}_${seq}`

// Referrer's tier and eligibility, exactly as /me/referrals computes them.
export function referrerStanding({ subs, profile, isAdmin, now }) {
  const own = pickBestSub(subs, now)
  const tier = isAdmin ? 'champion' : own ? effectivePlan(own) : 'free'
  const tierScope = isAdmin ? 'all_access' : own ? (own.tier_scope || 'single') : 'all_access'
  return { tier, eligible: referrerIsEligible({ plan: tier, tierScope, foundingReferrer: Boolean(profile?.founding_referrer), isAdmin }) }
}

// Pure: which new rewards the referral rows support. `standing` maps a
// referrer email to { tier, eligible }; `nextSeq` to the next ledger number.
export function planNewRewards({ referrals, standing, nextSeq, now }) {
  const byReferrer = new Map()
  for (const r of referrals) {
    if (r.reward_id || !isCountable(r, now)) continue
    if (!byReferrer.has(r.referrer_email)) byReferrer.set(r.referrer_email, [])
    byReferrer.get(r.referrer_email).push(r)
  }
  const rewards = []
  const notes = []
  for (const [email, rows] of byReferrer) {
    const s = standing.get(email)
    if (!s) continue
    const sameTier = rows.filter((r) => r.tier === s.tier).sort((a, b) => String(a.qualifies_at).localeCompare(String(b.qualifies_at)) || String(a.referred_email).localeCompare(String(b.referred_email)))
    if (!s.eligible) { if (sameTier.length >= REFERRALS_PER_REWARD) notes.push({ referrer_email: email, note: 'not_eligible', counted: sameTier.length }); continue }
    let seq = nextSeq.get(email) || 1
    for (let i = 0; i + REFERRALS_PER_REWARD <= sameTier.length; i += REFERRALS_PER_REWARD) {
      const used = sameTier.slice(i, i + REFERRALS_PER_REWARD)
      rewards.push({ referrer_email: email, reward_seq: seq, reward_id: rewardIdFor(email, seq), tier: s.tier, referred_emails: used.map((r) => r.referred_email) })
      seq += 1
    }
  }
  return { rewards, notes }
}

// The Stripe side of one reward. `stripe` = { get(path, params), post(path, form, idempotencyKey) }.
export async function applyRewardInStripe({ reward, subs, stripe, now }) {
  const billing = (subs || []).filter((s) => isActiveSub(s, now) && s.stripe_subscription_id && s.comp !== true
    && !String(s.stripe_customer_id || '').startsWith('comp_') && !String(s.stripe_customer_id || '').startsWith('admin_'))
  const row = pickBestSub(billing, now)
  if (!row) return { status: 'manual_required', reason: 'no_paid_stripe_subscription' }
  const sub = await stripe.get(`/v1/subscriptions/${encodeURIComponent(row.stripe_subscription_id)}`)
  if (!['active', 'trialing', 'past_due'].includes(sub?.status)) return { status: 'manual_required', reason: `stripe_subscription_${sub?.status || 'missing'}` }
  const item = sub.items?.data?.[0]
  const price = item?.price
  if (price?.recurring?.interval !== 'month' || (price.recurring.interval_count || 1) !== 1 || !Number.isInteger(price.unit_amount) || price.unit_amount <= 0) {
    return { status: 'manual_required', reason: 'not_a_monthly_price' }
  }
  const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
  const amount = price.unit_amount * (item.quantity || 1)
  // Already credited (a crash after the Stripe call last time)?
  let startingAfter
  do {
    const page = await stripe.get(`/v1/customers/${encodeURIComponent(customer)}/balance_transactions`, { limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) })
    const hit = (page.data || []).find((t) => t.metadata?.recon_reward_id === reward.reward_id)
    if (hit) return { status: 'applied', customer, amount: -hit.amount, currency: hit.currency, balance_transaction_id: hit.id, recovered: true }
    startingAfter = page.has_more ? page.data?.at(-1)?.id : null
  } while (startingAfter)
  const txn = await stripe.post(`/v1/customers/${encodeURIComponent(customer)}/balance_transactions`, {
    amount: String(-amount),
    currency: price.currency,
    description: 'Recon 6 referral reward: one free month (3 referrals)',
    'metadata[recon_reward_id]': reward.reward_id,
    'metadata[recon_reward_kind]': 'referral_free_month',
  }, `recon-referral-reward-${reward.reward_id}`)
  return { status: 'applied', customer, amount, currency: price.currency, balance_transaction_id: txn.id }
}

async function scanAll(ddb, input) {
  const items = []
  let ExclusiveStartKey
  do {
    const r = await ddb.send(new ScanCommand({ ...input, ExclusiveStartKey }))
    items.push(...(r.Items || []))
    ExclusiveStartKey = r.LastEvaluatedKey
  } while (ExclusiveStartKey)
  return items
}

const subsFor = async (ddb, email) => (await ddb.send(new QueryCommand({ TableName: SUBS_TABLE, IndexName: 'email-index', KeyConditionExpression: 'email = :e', ExpressionAttributeValues: { ':e': email } }))).Items || []

// preview: read-only reconciliation (what is earned, what the ledger holds).
// apply: claim new rewards, then credit every earned reward in Stripe.
// `only` limits the run to one referrer (operator checks).
export async function runReferralRewards({ mode = 'preview', ddb, stripe, isAdmin, audit = async () => {}, now = Date.now(), only = null, maxApply = 10 }) {
  const iso = new Date(now).toISOString()
  const referrals = (await scanAll(ddb, { TableName: REFERRALS_TABLE })).filter((r) => !only || r.referrer_email === only)
  const ledger = (await scanAll(ddb, { TableName: REWARDS_TABLE })).filter((r) => !only || r.referrer_email === only)
  const nextSeq = new Map()
  for (const l of ledger) nextSeq.set(l.referrer_email, Math.max(nextSeq.get(l.referrer_email) || 1, Number(l.reward_seq) + 1))

  // Only referrers with enough countable rows need their standing looked up.
  const counts = new Map()
  for (const r of referrals) if (!r.reward_id && isCountable(r, now)) counts.set(r.referrer_email, (counts.get(r.referrer_email) || 0) + 1)
  const standing = new Map()
  const subsCache = new Map()
  for (const [email, n] of counts) {
    if (n < REFERRALS_PER_REWARD) continue
    const subs = await subsFor(ddb, email)
    subsCache.set(email, subs)
    const profile = (await ddb.send(new GetCommand({ TableName: PROFILES_TABLE, Key: { email } }))).Item
    standing.set(email, referrerStanding({ subs, profile, isAdmin: await isAdmin(email), now }))
  }
  const plan = planNewRewards({ referrals, standing, nextSeq, now })
  const summary = {
    mode, referrals: referrals.length, ledger: ledger.length,
    newRewards: plan.rewards.map((r) => ({ reward_id: r.reward_id, tier: r.tier })),
    notEligible: plan.notes.length,
    ledgerOpen: ledger.filter((l) => l.status !== 'applied').map((l) => ({ reward_id: l.reward_id, status: l.status, reason: l.reason || null })),
    claimed: 0, claimConflicts: 0, applied: 0, manual: 0, failed: 0, deferred: 0,
  }
  if (mode !== 'apply') return summary

  // 1. Claim.
  for (const r of plan.rewards) {
    try {
      await ddb.send(new TransactWriteCommand({
        TransactItems: [
          { Put: { TableName: REWARDS_TABLE, Item: { referrer_email: r.referrer_email, reward_seq: r.reward_seq, reward_id: r.reward_id, tier: r.tier, referred_emails: r.referred_emails, status: 'earned', earned_at: iso }, ConditionExpression: 'attribute_not_exists(referrer_email)' } },
          ...r.referred_emails.map((referred) => ({ Update: {
            TableName: REFERRALS_TABLE,
            Key: { referrer_email: r.referrer_email, referred_email: referred },
            UpdateExpression: 'SET reward_id = :rid, rewarded_at = :now',
            ConditionExpression: 'attribute_not_exists(reward_id) AND qualifies_at <= :now AND NOT #s IN (:churned, :refunded)',
            ExpressionAttributeNames: { '#s': 'status' },
            ExpressionAttributeValues: { ':rid': r.reward_id, ':now': iso, ':churned': 'churned', ':refunded': 'refunded' },
          } })),
        ],
      }))
      summary.claimed += 1
      ledger.push({ referrer_email: r.referrer_email, reward_seq: r.reward_seq, reward_id: r.reward_id, status: 'earned' })
      await audit('referral.reward.earned', r.reward_id, { tier: r.tier, referrals: r.referred_emails.length })
    } catch (err) {
      if (err?.name !== 'TransactionCanceledException') throw err
      summary.claimConflicts += 1
    }
  }

  // 2. Credit earned rewards (and finish any a crashed run left applying).
  const due = ledger.filter((l) => l.status === 'earned' || (l.status === 'applying' && Date.parse(l.applying_since || '') < now - LOCK_MS))
  for (const l of due) {
    if (summary.applied + summary.manual + summary.failed >= maxApply) { summary.deferred += 1; continue }
    const key = { referrer_email: l.referrer_email, reward_seq: l.reward_seq }
    try {
      await ddb.send(new UpdateCommand({
        TableName: REWARDS_TABLE, Key: key,
        UpdateExpression: 'SET #s = :applying, applying_since = :now',
        ConditionExpression: '#s = :earned OR (#s = :applying AND applying_since < :stale)',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':applying': 'applying', ':earned': 'earned', ':now': iso, ':stale': new Date(now - LOCK_MS).toISOString() },
      }))
    } catch (err) {
      if (err?.name === 'ConditionalCheckFailedException') { summary.deferred += 1; continue }
      throw err
    }
    let result
    try {
      const subs = subsCache.get(l.referrer_email) || await subsFor(ddb, l.referrer_email)
      result = await applyRewardInStripe({ reward: l, subs, stripe, now })
    } catch (err) {
      result = { status: 'earned', error: String(err?.message || err).slice(0, 200) }
    }
    const fields = result.status === 'applied'
      ? { ':s': 'applied', ':at': iso, ':cus': result.customer, ':amt': result.amount, ':cur': result.currency, ':txn': result.balance_transaction_id }
      : { ':s': result.status, ':why': result.reason || result.error || null }
    await ddb.send(new UpdateCommand({
      TableName: REWARDS_TABLE, Key: key,
      UpdateExpression: result.status === 'applied'
        ? 'SET #s = :s, applied_at = :at, stripe_customer_id = :cus, amount = :amt, currency = :cur, balance_transaction_id = :txn REMOVE applying_since, reason'
        : 'SET #s = :s, reason = :why REMOVE applying_since',
      ConditionExpression: '#s = :applying',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ...fields, ':applying': 'applying' },
    }))
    if (result.status === 'applied') summary.applied += 1
    else if (result.status === 'manual_required') summary.manual += 1
    else summary.failed += 1
    await audit(`referral.reward.${result.status}`, l.reward_id, result.status === 'applied'
      ? { amount: result.amount, currency: result.currency, balance_transaction_id: result.balance_transaction_id, recovered: Boolean(result.recovered) }
      : { reason: result.reason || result.error || null })
  }
  return summary
}
