// Pure planning for data export and deletion requests. No I/O here: the CLI
// collects records (sources.mjs), this module turns them into an export
// bundle and a deletion plan, and apply.mjs executes a confirmed plan.
import { createHash } from 'node:crypto'
import { KEYS, TABLES } from './sources.mjs'

const LIVE = ['active', 'trialing', 'past_due', 'unpaid', 'incomplete']

const keyOf = (table, item) => Object.fromEntries(KEYS[table].map((k) => [k, item[k]]))

// Everything collected, grouped by source, for the person's copy of their data.
export function buildExport({ email, collected, generatedAt }) {
  const counts = {}
  for (const [name, records] of Object.entries(collected.records)) counts[name] = records.length
  return {
    kind: 'recon-data-export',
    email,
    generatedAt,
    note: 'Payment records are held by Stripe (payment processor); request those from Stripe or via support.',
    counts,
    cognito: collected.cognito.map((u) => ({ status: u.status, created: u.created, attributes: u.attributes })),
    records: collected.records,
  }
}

// What deletion would remove or anonymise, the blockers, and a plan id
// (hash of the actions) that apply must present so a stale plan never runs.
export function buildDeletionPlan({ email, collected }) {
  const blockers = []
  const liveSubs = collected.records.subscriptions.filter((s) => LIVE.includes(String(s.status || '').toLowerCase()) && !s.deleted_at)
  if (liveSubs.length) blockers.push(`live_subscription: ${liveSubs.length} membership row(s) are ${[...new Set(liveSubs.map((s) => s.status))].join('/')}; cancel in Stripe first`)
  if (collected.cognito.some((u) => (u.groups || []).includes('admins'))) blockers.push('admin_account: remove the account from the admins group first')

  const actions = []
  const del = (table, items) => { for (const i of items) actions.push({ op: 'delete', table, key: keyOf(table, i) }) }
  del(TABLES.profiles, collected.records.profile)
  del(TABLES.subscriptions, collected.records.subscriptions)
  del(TABLES.crmLog, collected.records.crmLog)
  del(TABLES.referrals, collected.records.referrals)
  del(TABLES.referralRewards, collected.records.referralRewards || [])
  del(TABLES.climb, collected.records.climb)
  del(TABLES.coachingEvents, collected.records.coachingEvents)
  del(TABLES.reviewArchive, collected.records.reviewArchive)
  del(TABLES.customerSuccess, collected.records.customerSuccess)
  del(TABLES.playerStore, collected.records.playerStore)
  del(TABLES.playerEvents, collected.records.playerEvents)
  del(TABLES.playerSnapshots, collected.records.playerSnapshots)
  del(TABLES.playerIdentities, collected.records.playerIdentities)
  for (const b of collected.records.bookings) {
    // Credit rows are the person's own record; booking slots stay on the
    // schedule with the customer details removed.
    if (b.customer) actions.push({ op: 'anonymize', table: TABLES.bookings, key: keyOf(TABLES.bookings, b), remove: ['customer', 'manageToken'] })
    else actions.push({ op: 'delete', table: TABLES.bookings, key: keyOf(TABLES.bookings, b) })
  }
  for (const u of collected.cognito) actions.push({ op: 'cognito-delete', username: u.username })

  const stripeCustomers = [...new Set(collected.records.subscriptions.map((s) => s.stripe_customer_id).filter(Boolean))]
  const normalized = actions.map((a) => JSON.stringify(a)).sort()
  const planId = createHash('sha256').update(`${email}\n${normalized.join('\n')}`).digest('hex').slice(0, 16)
  const counts = actions.reduce((m, a) => { const k = `${a.op}:${a.table || 'cognito'}`; m[k] = (m[k] || 0) + 1; return m }, {})
  return { planId, email, blockers, actions, counts, stripeCustomers, confirmPhrase: `DELETE ALL DATA FOR ${email}` }
}
