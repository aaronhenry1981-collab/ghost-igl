// Stripe TEST-MODE run of referral free-month credits (PR #44).
//
// Real Stripe test objects, the REAL reward code (referral-rewards.mjs) and
// the REAL Stripe client the admin Lambda uses (stripe-http.mjs). The
// referral/ledger/membership tables are in memory, so nothing touches
// production data. Live keys are refused.
//
// Run through the masked-prompt runner (never paste a key into chat or a
// file): recon6-recovery\entitlement-check-2026-09-27\run-sandbox.ps1
//
// Restricted TEST key permissions this run needs (together with the #33
// webhook sandbox run in the same session): Write on Customers (this covers
// customer balance transactions, /v1/customers/:id/balance_transactions),
// Payment Methods, Products, Prices, Subscriptions, Invoices and Test Clocks;
// Read on Events and Checkout Sessions. Nothing else.
//
// It creates a test clock with one customer (card pm_card_visa) on a $12
// monthly test price tagged recon6-sandbox, then checks:
//   1 three qualifying referrals -> exactly one credit of -$12 on the balance
//   2 the job runs again         -> no second credit
//   3 crash after the Stripe post (ledger left "applying") -> the rerun finds
//     the credit by its reward id and does not post again
//   4 the same idempotency key replayed straight to Stripe -> same object
//   5 the clock passes the renewal -> the next invoice uses the credit
//   6 three more referrals       -> a second, separate credit
// The test clock is deleted at the end (removing its customer/subscription);
// the product and price are archived.
import { randomBytes } from 'node:crypto'
import { createStripeHttp } from '../stripe-http.mjs'
import { REFERRALS_TABLE, REWARDS_TABLE, runReferralRewards } from '../referral-rewards.mjs'

const key = process.env.STRIPE_SANDBOX_KEY || ''
if (!/^(sk|rk)_test_/.test(key)) {
  console.error('STRIPE_SANDBOX_KEY must be a TEST-mode key (sk_test_… or rk_test_…). Live keys are refused.')
  process.exit(2)
}
// On a permission error, name the missing restricted-key permission (Stripe's
// error says e.g. "Having the 'rak_customer_write' permission would allow
// this request"). Only the permission id is printed, never the message,
// which quotes a masked form of the key.
async function fetchNamingPermissions(url, init = {}) {
  const res = await fetch(url, init)
  if (res.status === 401 || res.status === 403) {
    const body = await res.clone().json().catch(() => null)
    const permission = String(body?.error?.message || '').match(/'(rak_[a-z_]+)'/)?.[1]
    console.error(`MISSING PERMISSION for ${init.method || 'GET'} ${new URL(url).pathname}: ${permission || body?.error?.code || res.status}`)
  }
  return res
}
const stripe = createStripeHttp(key, fetchNamingPermissions)
const run = randomBytes(4).toString('hex')
const REF = `referral-sandbox-${run}@example.test`
const DAY = 86400000
const results = []
const check = (label, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` (${detail})` : ''}`) }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---- in-memory tables with the conditional semantics the job relies on ----
function memoryDdb() {
  const t = { [REFERRALS_TABLE]: new Map(), [REWARDS_TABLE]: new Map(), subs: [] }
  const refKey = (k) => `${k.referrer_email}|${k.referred_email}`
  const rewKey = (k) => `${k.referrer_email}|${k.reward_seq}`
  const fail = (name) => { const e = new Error(name); e.name = name; return e }
  return {
    t,
    async send(cmd) {
      const n = cmd.constructor.name
      const i = cmd.input
      if (n === 'ScanCommand') return { Items: [...t[i.TableName].values()].map((x) => structuredClone(x)) }
      if (n === 'QueryCommand') return { Items: t.subs.filter((s) => s.email === i.ExpressionAttributeValues[':e']) }
      if (n === 'GetCommand') return { Item: i.Key.email === REF ? { email: REF, founding_referrer: true } : undefined }
      if (n === 'TransactWriteCommand') {
        const now = i.TransactItems.find((x) => x.Update)?.Update.ExpressionAttributeValues[':now']
        const ok = i.TransactItems.every((x) => {
          if (x.Put) return !t[REWARDS_TABLE].has(rewKey(x.Put.Item))
          const row = t[REFERRALS_TABLE].get(refKey(x.Update.Key))
          return row && !row.reward_id && row.qualifies_at <= now && !['churned', 'refunded'].includes(row.status)
        })
        if (!ok) throw fail('TransactionCanceledException')
        for (const x of i.TransactItems) {
          if (x.Put) t[REWARDS_TABLE].set(rewKey(x.Put.Item), { ...x.Put.Item })
          else Object.assign(t[REFERRALS_TABLE].get(refKey(x.Update.Key)), { reward_id: x.Update.ExpressionAttributeValues[':rid'] })
        }
        return {}
      }
      if (n === 'UpdateCommand') {
        const row = t[REWARDS_TABLE].get(rewKey(i.Key))
        const v = i.ExpressionAttributeValues
        if (i.UpdateExpression.includes('applying_since = :now')) {
          if (!(row.status === 'earned' || (row.status === 'applying' && row.applying_since < v[':stale']))) throw fail('ConditionalCheckFailedException')
          Object.assign(row, { status: 'applying', applying_since: v[':now'] })
          return {}
        }
        if (row.status !== 'applying') throw fail('ConditionalCheckFailedException')
        delete row.applying_since
        Object.assign(row, v[':s'] === 'applied'
          ? { status: 'applied', stripe_customer_id: v[':cus'], amount: v[':amt'], currency: v[':cur'], balance_transaction_id: v[':txn'] }
          : { status: v[':s'], reason: v[':why'] })
        return {}
      }
      throw new Error(`unexpected ${n}`)
    },
  }
}

function addReferrals(ddb, from, count) {
  for (let n = from; n < from + count; n += 1) {
    const referred = `friend${n}-${run}@example.test`
    ddb.t[REFERRALS_TABLE].set(`${REF}|${referred}`, { referrer_email: REF, referred_email: referred, tier: 'pro', status: 'active', created_at: new Date(Date.now() - 40 * DAY).toISOString(), qualifies_at: new Date(Date.now() - 10 * DAY + n).toISOString() })
  }
}

const creditsFor = async (customer) => (await stripe.get(`/v1/customers/${customer}/balance_transactions`, { limit: 100 })).data.filter((x) => x.metadata?.recon_reward_kind === 'referral_free_month')

let clock = null
let product = null
let price = null
try {
  // ---- Stripe test objects ----
  clock = await stripe.post('/v1/test_helpers/test_clocks', { frozen_time: String(Math.floor(Date.now() / 1000)), name: `recon6-sandbox referral ${run}` })
  product = await stripe.post('/v1/products', { name: `recon6-sandbox referral ${run}`, 'metadata[recon6]': 'sandbox' })
  price = await stripe.post('/v1/prices', { product: product.id, unit_amount: '1200', currency: 'usd', 'recurring[interval]': 'month', 'metadata[recon6]': 'sandbox' })
  const customer = await stripe.post('/v1/customers', { email: REF, test_clock: clock.id, payment_method: 'pm_card_visa', 'invoice_settings[default_payment_method]': 'pm_card_visa', 'metadata[recon6]': 'sandbox' })
  const sub = await stripe.post('/v1/subscriptions', { customer: customer.id, 'items[0][price]': price.id, 'metadata[recon6]': 'sandbox' })
  check('test subscription is active', sub.status === 'active' && sub.livemode === false, sub.status)

  const ddb = memoryDdb()
  ddb.t.subs.push({ email: REF, stripe_customer_id: customer.id, stripe_subscription_id: sub.id, plan: 'pro', status: 'active', current_period_end: new Date(Date.now() + 25 * DAY).toISOString() })
  const job = (extra = {}) => runReferralRewards({ mode: 'apply', ddb, stripe, isAdmin: async () => false, ...extra })

  // 1
  addReferrals(ddb, 1, 3)
  const r1 = await job()
  let credits = await creditsFor(customer.id)
  const bal1 = (await stripe.get(`/v1/customers/${customer.id}`)).balance
  check('1 three referrals -> exactly one -$12 credit', r1.applied === 1 && credits.length === 1 && credits[0].amount === -1200 && bal1 === -1200, `applied ${r1.applied}, credits ${credits.length}, balance ${bal1}`)
  // 2
  const r2 = await job()
  credits = await creditsFor(customer.id)
  check('2 running again adds no credit', r2.claimed === 0 && r2.applied === 0 && credits.length === 1)
  // 3
  const row = [...ddb.t[REWARDS_TABLE].values()][0]
  Object.assign(row, { status: 'applying', applying_since: new Date(Date.now() - 60 * 60 * 1000).toISOString() })
  delete row.balance_transaction_id
  const r3 = await job()
  credits = await creditsFor(customer.id)
  check('3 crash after the post: rerun recovers the credit, no second post', r3.applied === 1 && credits.length === 1 && row.status === 'applied' && row.balance_transaction_id === credits[0].id)
  // 4
  const idem = `recon-referral-reward-${row.reward_id}`
  const replay = await stripe.post(`/v1/customers/${customer.id}/balance_transactions`, { amount: '-1200', currency: 'usd', description: 'Recon 6 referral reward: one free month (3 referrals)', 'metadata[recon_reward_id]': row.reward_id, 'metadata[recon_reward_kind]': 'referral_free_month' }, idem)
  credits = await creditsFor(customer.id)
  check('4 same idempotency key replayed to Stripe -> same object', credits.length === 1 && replay.id === credits[0].id, replay.id === credits[0].id ? 'replayed' : 'NEW OBJECT')
  // 5
  await stripe.post(`/v1/test_helpers/test_clocks/${clock.id}/advance`, { frozen_time: String(Math.floor(Date.now() / 1000) + 32 * 86400) })
  for (let i = 0; i < 40; i += 1) {
    if ((await stripe.get(`/v1/test_helpers/test_clocks/${clock.id}`)).status === 'ready') break
    await sleep(3000)
  }
  const invoices = (await stripe.get('/v1/invoices', { subscription: sub.id, limit: 10 })).data
  const renewal = invoices.find((inv) => inv.billing_reason === 'subscription_cycle')
  check('5 the renewal invoice uses the credit', Boolean(renewal) && renewal.starting_balance === -1200 && renewal.amount_due === 0, renewal ? `starting_balance ${renewal.starting_balance}, amount_due ${renewal.amount_due}` : 'no renewal invoice')
  // 6
  addReferrals(ddb, 4, 3)
  ddb.t.subs[0].current_period_end = new Date(Date.now() + 60 * DAY).toISOString()
  const r6 = await job()
  credits = await creditsFor(customer.id)
  check('6 three more referrals -> a second, separate credit', r6.applied === 1 && credits.length === 2 && new Set(credits.map((c) => c.metadata.recon_reward_id)).size === 2)
} catch (err) {
  check('run completed', false, err.message)
} finally {
  // Deleting a test clock removes its customer and subscriptions.
  if (clock) {
    const res = await fetch(`https://api.stripe.com/v1/test_helpers/test_clocks/${clock.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${key}` } })
    check('cleanup: test clock deleted', res.ok)
  }
  if (price) await stripe.post(`/v1/prices/${price.id}`, { active: 'false' }).catch(() => null)
  if (product) await stripe.post(`/v1/products/${product.id}`, { active: 'false' }).catch(() => null)
}
const failed = results.filter((x) => !x).length
console.log(`${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
