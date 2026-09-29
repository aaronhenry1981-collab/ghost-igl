// Referral rewards: published terms only, and no path to a second credit.
// DynamoDB and Stripe are in-memory fakes; all ids and emails are fictional.
import test from 'node:test'
import assert from 'node:assert/strict'
import { planNewRewards, referrerStanding, rewardIdFor, runReferralRewards, REFERRALS_TABLE, REWARDS_TABLE } from './referral-rewards.mjs'

const NOW = Date.parse('2026-09-29T12:00:00.000Z')
const DAY = 86400000
const iso = (ms) => new Date(ms).toISOString()
const REF = 'referrer@example.test'
const PRO_MONTHLY = { id: 'price_FIXTURE_pro', unit_amount: 1200, currency: 'usd', recurring: { interval: 'month', interval_count: 1 } }

function referral(n, extra = {}) {
  return { referrer_email: REF, referred_email: `friend${n}@example.test`, tier: 'pro', status: 'pending', created_at: iso(NOW - 40 * DAY), qualifies_at: iso(NOW - 10 * DAY + n), ...extra }
}

function world({ referrals = [], subs = null, profile = { email: REF, founding_referrer: true }, price = PRO_MONTHLY, admins = [] } = {}) {
  const tables = {
    [REFERRALS_TABLE]: new Map(referrals.map((r) => [`${r.referrer_email}|${r.referred_email}`, { ...r }])),
    [REWARDS_TABLE]: new Map(),
  }
  const subRows = subs || [{ stripe_customer_id: 'cus_FIXTURE_ref', stripe_subscription_id: 'sub_FIXTURE_ref', email: REF, plan: 'pro', status: 'active', current_period_end: iso(NOW + 20 * DAY) }]
  const rewardKey = (k) => `${k.referrer_email}|${k.reward_seq}`
  const refKey = (k) => `${k.referrer_email}|${k.referred_email}`
  const conditional = () => { const e = new Error('conditional'); e.name = 'ConditionalCheckFailedException'; return e }
  const ddb = {
    writes: 0,
    failNextFinalUpdate: false,
    async send(cmd) {
      const name = cmd.constructor.name
      const i = cmd.input
      if (name === 'ScanCommand') return { Items: [...tables[i.TableName].values()].map((x) => structuredClone(x)) }
      if (name === 'QueryCommand') return { Items: subRows.filter((s) => s.email === i.ExpressionAttributeValues[':e']) }
      if (name === 'GetCommand') return { Item: profile && i.Key.email === profile.email ? profile : undefined }
      this.writes += 1
      if (name === 'TransactWriteCommand') {
        const now = i.TransactItems.find((t) => t.Update)?.Update.ExpressionAttributeValues[':now']
        const ok = i.TransactItems.every((t) => {
          if (t.Put) return !tables[REWARDS_TABLE].has(rewardKey(t.Put.Item))
          const row = tables[REFERRALS_TABLE].get(refKey(t.Update.Key))
          return row && !row.reward_id && row.qualifies_at <= now && !['churned', 'refunded'].includes(row.status)
        })
        if (!ok) { const e = new Error('cancelled'); e.name = 'TransactionCanceledException'; throw e }
        for (const t of i.TransactItems) {
          if (t.Put) tables[REWARDS_TABLE].set(rewardKey(t.Put.Item), { ...t.Put.Item })
          else Object.assign(tables[REFERRALS_TABLE].get(refKey(t.Update.Key)), { reward_id: t.Update.ExpressionAttributeValues[':rid'], rewarded_at: now })
        }
        return {}
      }
      if (name === 'UpdateCommand' && i.TableName === REWARDS_TABLE) {
        const row = tables[REWARDS_TABLE].get(rewardKey(i.Key))
        const v = i.ExpressionAttributeValues
        if (i.UpdateExpression.includes('applying_since = :now')) {
          if (!(row.status === 'earned' || (row.status === 'applying' && row.applying_since < v[':stale']))) throw conditional()
          Object.assign(row, { status: 'applying', applying_since: v[':now'] })
          return {}
        }
        if (row.status !== 'applying') throw conditional()
        if (this.failNextFinalUpdate) { this.failNextFinalUpdate = false; throw new Error('simulated crash after Stripe') }
        delete row.applying_since
        if (v[':s'] === 'applied') { delete row.reason; Object.assign(row, { status: 'applied', stripe_customer_id: v[':cus'], amount: v[':amt'], currency: v[':cur'], balance_transaction_id: v[':txn'] }) }
        else Object.assign(row, { status: v[':s'], reason: v[':why'] })
        return {}
      }
      throw new Error(`unexpected ${name} ${i.TableName}`)
    },
  }
  const stripe = {
    txns: [],
    posts: 0,
    failPosts: false,
    byKey: new Map(),
    async get(path) {
      if (path.startsWith('/v1/subscriptions/')) return { id: 'sub_FIXTURE_ref', status: 'active', customer: 'cus_FIXTURE_ref', items: { data: [{ quantity: 1, price }] } }
      if (path.endsWith('/balance_transactions')) return { data: [...this.txns].reverse(), has_more: false }
      throw new Error(`unexpected GET ${path}`)
    },
    async post(path, form, key) {
      if (this.failPosts) throw new Error('Stripe POST returned HTTP 500')
      if (this.byKey.has(key)) return this.byKey.get(key)
      this.posts += 1
      const txn = { id: `cbtxn_FIXTURE_${this.posts}`, amount: Number(form.amount), currency: form.currency, metadata: { recon_reward_id: form['metadata[recon_reward_id]'] } }
      this.txns.push(txn); this.byKey.set(key, txn)
      return txn
    },
  }
  const auditLog = []
  const run = (mode, extra = {}) => runReferralRewards({ mode, ddb, stripe, now: NOW, isAdmin: async (e) => admins.includes(e), audit: async (action, target, details) => auditLog.push({ action, target, details }), ...extra })
  return { tables, ddb, stripe, auditLog, run }
}

test('published terms: 3 same-tier referrals past 30 days, not churned, eligible referrer; each counts once', () => {
  const rows = [1, 2, 3, 4, 5, 6, 7].map((n) => referral(n))
  rows.push(referral(8, { tier: 'champion' }), referral(9, { status: 'churned' }), referral(10, { qualifies_at: iso(NOW + DAY) }), referral(11, { reward_id: 'rr_old' }))
  const standing = new Map([[REF, { tier: 'pro', eligible: true }]])
  const { rewards } = planNewRewards({ referrals: rows, standing, nextSeq: new Map(), now: NOW })
  assert.equal(rewards.length, 2, '7 countable same-tier referrals = 2 free months, 1 left over')
  assert.deepEqual(rewards.map((r) => r.reward_seq), [1, 2])
  const used = rewards.flatMap((r) => r.referred_emails)
  assert.equal(new Set(used).size, 6)
  for (const n of [8, 9, 10, 11]) assert.ok(!used.includes(`friend${n}@example.test`), `friend${n} does not count`)
  const ineligible = planNewRewards({ referrals: rows, standing: new Map([[REF, { tier: 'pro', eligible: false }]]), nextSeq: new Map(), now: NOW })
  assert.equal(ineligible.rewards.length, 0)
  assert.equal(ineligible.notes[0].note, 'not_eligible')
})

test('eligibility and tier match /me/referrals', () => {
  const live = (plan, extra = {}) => [{ plan, status: 'active', current_period_end: iso(NOW + DAY), ...extra }]
  assert.deepEqual(referrerStanding({ subs: live('pro'), profile: { founding_referrer: true }, isAdmin: false, now: NOW }), { tier: 'pro', eligible: true })
  assert.deepEqual(referrerStanding({ subs: live('pro'), profile: {}, isAdmin: false, now: NOW }), { tier: 'pro', eligible: false })
  assert.deepEqual(referrerStanding({ subs: live('champion', { tier_scope: 'all_access' }), profile: {}, isAdmin: false, now: NOW }), { tier: 'champion', eligible: true })
  assert.deepEqual(referrerStanding({ subs: live('champion', { price_id: 'price_1TLEtsJNddvjgWcgYcmiNmW7' }), profile: {}, isAdmin: false, now: NOW }), { tier: 'elite', eligible: false })
  assert.deepEqual(referrerStanding({ subs: [], profile: {}, isAdmin: true, now: NOW }), { tier: 'champion', eligible: true })
})

test('preview is read-only reconciliation', async () => {
  const w = world({ referrals: [1, 2, 3].map((n) => referral(n)) })
  const s = await w.run('preview')
  assert.equal(s.newRewards.length, 1)
  assert.equal(w.ddb.writes, 0)
  assert.equal(w.stripe.posts, 0)
})

test('apply credits one month of the current price once; a second run adds nothing', async () => {
  const w = world({ referrals: [1, 2, 3, 4].map((n) => referral(n)) })
  const first = await w.run('apply')
  assert.equal(first.claimed, 1)
  assert.equal(first.applied, 1)
  assert.equal(w.stripe.posts, 1)
  assert.equal(w.stripe.txns[0].amount, -1200, 'a credit (negative) of one month')
  const ledger = [...w.tables[REWARDS_TABLE].values()]
  assert.equal(ledger[0].status, 'applied')
  assert.equal(ledger[0].reward_id, rewardIdFor(REF, 1))
  assert.equal([...w.tables[REFERRALS_TABLE].values()].filter((r) => r.reward_id).length, 3, 'exactly 3 referrals used')
  const second = await w.run('apply')
  assert.equal(second.claimed, 0)
  assert.equal(second.applied, 0)
  assert.equal(w.stripe.posts, 1, 'no second credit')
  assert.ok(w.auditLog.some((a) => a.action === 'referral.reward.applied'))
})

test('a crash after the Stripe credit never leads to a second credit', async () => {
  const w = world({ referrals: [1, 2, 3].map((n) => referral(n)) })
  w.ddb.failNextFinalUpdate = true
  await assert.rejects(w.run('apply'), /simulated crash/)
  assert.equal(w.stripe.posts, 1)
  const row = [...w.tables[REWARDS_TABLE].values()][0]
  assert.equal(row.status, 'applying')
  // Still locked: an immediate rerun leaves it alone.
  const locked = await w.run('apply')
  assert.equal(locked.applied, 0)
  assert.equal(locked.ledgerOpen[0].status, 'applying')
  assert.equal(w.stripe.posts, 1)
  // After the lock goes stale, the rerun finds the credit in Stripe.
  row.applying_since = iso(NOW - 60 * 60 * 1000)
  const s = await w.run('apply')
  assert.equal(s.applied, 1)
  assert.equal(w.stripe.posts, 1, 'recovered, not re-posted')
  assert.equal(row.status, 'applied')
  assert.ok(w.auditLog.some((a) => a.action === 'referral.reward.applied' && a.details.recovered))
})

test('a referral already used elsewhere cancels the whole claim', async () => {
  const w = world({ referrals: [1, 2, 3].map((n) => referral(n)) })
  const origSend = w.ddb.send.bind(w.ddb)
  w.ddb.send = async (cmd) => {
    if (cmd.constructor.name === 'TransactWriteCommand') w.tables[REFERRALS_TABLE].get(`${REF}|friend2@example.test`).reward_id = 'rr_other_run'
    return origSend(cmd)
  }
  const s = await w.run('apply')
  assert.equal(s.claimConflicts, 1)
  assert.equal(w.tables[REWARDS_TABLE].size, 0)
  assert.equal(w.stripe.posts, 0)
})

test('no paid Stripe subscription, or a non-monthly price: manual, no Stripe write', async () => {
  const comp = world({ referrals: [1, 2, 3].map((n) => referral(n)), subs: [{ stripe_customer_id: 'comp_referrer', email: REF, plan: 'pro', status: 'active', comp: true, current_period_end: iso(NOW + DAY) }] })
  const s = await comp.run('apply')
  assert.equal(s.manual, 1)
  assert.equal(comp.stripe.posts, 0)
  assert.equal([...comp.tables[REWARDS_TABLE].values()][0].reason, 'no_paid_stripe_subscription')
  const annual = world({ referrals: [1, 2, 3].map((n) => referral(n)), price: { ...PRO_MONTHLY, recurring: { interval: 'year', interval_count: 1 } } })
  assert.equal((await annual.run('apply')).manual, 1)
  assert.equal(annual.stripe.posts, 0)
})

test('a Stripe error leaves the reward earned for the next run', async () => {
  const w = world({ referrals: [1, 2, 3].map((n) => referral(n)) })
  w.stripe.failPosts = true
  const s = await w.run('apply')
  assert.equal(s.failed, 1)
  const row = [...w.tables[REWARDS_TABLE].values()][0]
  assert.equal(row.status, 'earned')
  w.stripe.failPosts = false
  assert.equal((await w.run('apply')).applied, 1)
  assert.equal(w.stripe.posts, 1)
})

test('only= limits a run to one referrer', async () => {
  const other = { ...referral(1), referrer_email: 'other@example.test' }
  const w = world({ referrals: [referral(1), referral(2), referral(3), other] })
  const s = await w.run('preview', { only: 'other@example.test' })
  assert.equal(s.referrals, 1)
  assert.equal(s.newRewards.length, 0)
})
