// Member directory logic for the admin Members screens: identity, search,
// filters, sorting, pagination and exports. Pure functions over the rows
// GET /admin/users returns, so every rule here is unit-tested.
//
// Identity rules:
//   - A member is keyed by a stable account id: the Cognito username, or
//     `stripe:<customer id>` for a paid customer with no site account.
//     Names are display data only; two people with the same name stay two
//     rows, and nothing is ever looked up or merged by name.
//   - Email stays visible and searchable everywhere.
import {
  effectiveBillingState,
  hasDuplicateLiveSubscriptions,
  hasDuplicateStripeCustomers,
  isPaidWithoutSiteAccount,
} from '../../lib/adminBillingHealth.mjs'

export function accountIdOf(member) {
  if (member?.username) return String(member.username)
  if (member?.stripe_customer_id) return `stripe:${member.stripe_customer_id}`
  return `email:${String(member?.email || '').toLowerCase()}`
}

export function findMember(members, accountId) {
  return (members || []).find((m) => accountIdOf(m) === accountId) || null
}

export function fullNameOf(member) {
  return [member?.first_name, member?.last_name].map((p) => String(p || '').trim()).filter(Boolean).join(' ')
}

/** complete | single | review | missing */
export function nameStatusOf(member) {
  const first = String(member?.first_name || '').trim()
  const last = String(member?.last_name || '').trim()
  if (first && last) return 'complete'
  if (first || last) return 'single'
  if (Array.isArray(member?.name_review) && member.name_review.length > 0) return 'review'
  return 'missing'
}

export const NAME_STATUS_LABELS = {
  complete: 'Full name',
  single: 'Single name',
  review: 'Name to review',
  missing: 'No name',
}

// Case-, accent- and whitespace-insensitive text for matching.
export function foldText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function haystackOf(member) {
  return foldText([
    member?.first_name,
    member?.last_name,
    fullNameOf(member),
    member?.email,
    member?.display_name,
    member?.stripe_customer_id,
  ].filter(Boolean).join(' \u0000 '))
}

/** Every word of the query must appear somewhere in the member's name, email, gamer name or Stripe id. */
export function matchesQuery(member, query) {
  const tokens = foldText(query).split(' ').filter(Boolean)
  if (tokens.length === 0) return true
  const hay = haystackOf(member)
  return tokens.every((t) => hay.includes(t))
}

export const STATUS_FILTERS = [
  { id: 'all', label: 'All statuses', test: () => true },
  { id: 'free', label: 'Free only', test: (u) => u.plan === 'free' },
  { id: 'paid', label: 'Paid and renewing', test: (u) => u.billing_state === 'paid' },
  { id: 'trialing', label: 'Trial scheduled to charge', test: (u) => u.billing_state === 'trialing' },
  { id: 'ending', label: 'Ending, no next charge', test: (u) => effectiveBillingState(u) === 'ending' },
  { id: 'payment_issue', label: 'Payment issue', test: (u) => effectiveBillingState(u) === 'payment_issue' },
  { id: 'comp', label: 'Complimentary', test: (u) => effectiveBillingState(u) === 'comp' },
  { id: 'stripe_only', label: 'Paid without site account', test: (u) => isPaidWithoutSiteAccount(u) },
  { id: 'duplicate', label: 'Duplicate live subscriptions', test: (u) => hasDuplicateLiveSubscriptions(u) },
  { id: 'duplicate_customer', label: 'Duplicate Stripe customers', test: (u) => hasDuplicateStripeCustomers(u) },
  { id: 'canceled', label: 'Canceled', test: (u) => u.sub_status === 'canceled' },
  { id: 'unconfirmed', label: 'Email unconfirmed', test: (u) => u.cognito_status === 'UNCONFIRMED' },
]

export const PLAN_FILTERS = [
  { id: 'all', label: 'All plans' },
  { id: 'free', label: 'Basic' },
  { id: 'pro', label: 'Pro' },
  { id: 'elite', label: 'Elite' },
  { id: 'champion', label: 'Champion' },
]

export const NAME_FILTERS = [
  { id: 'all', label: 'All names' },
  { id: 'complete', label: 'Full name' },
  { id: 'single', label: 'Single name' },
  { id: 'needs', label: 'Needs a name' },
  { id: 'review', label: 'Name to review' },
  { id: 'missing', label: 'No name' },
]

function nameFilterTest(id, member) {
  if (!id || id === 'all') return true
  const status = nameStatusOf(member)
  if (id === 'needs') return status === 'missing' || status === 'review'
  return status === id
}

export function filterMembers(members, { q = '', status = 'all', plan = 'all', name = 'all' } = {}) {
  const statusTest = (STATUS_FILTERS.find((f) => f.id === status) || STATUS_FILTERS[0]).test
  return (members || []).filter((u) =>
    (plan === 'all' || u.plan === plan) &&
    statusTest(u) &&
    nameFilterTest(name, u) &&
    matchesQuery(u, q))
}

export const SORTS = [
  { id: 'joined', label: 'Newest first' },
  { id: 'name', label: 'Name (A–Z)' },
  { id: 'email', label: 'Email (A–Z)' },
  { id: 'active', label: 'Recently active' },
  { id: 'renewal', label: 'Next charge' },
]

const time = (iso) => {
  const ms = Date.parse(iso || '')
  return Number.isFinite(ms) ? ms : null
}
const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true })

function nameKey(member) {
  const last = String(member?.last_name || '').trim()
  const first = String(member?.first_name || '').trim()
  // Single-name members sort by the name they have.
  return last ? `${last} ${first}` : first
}

// Missing values always sort last, whatever the direction.
function byNullableTime(a, b, desc) {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return desc ? b - a : a - b
}

export function sortMembers(members, sort = 'joined') {
  const list = [...(members || [])]
  const byEmail = (a, b) => collator.compare(a.email || '', b.email || '')
  const compare = {
    joined: (a, b) => byNullableTime(time(a.created_at), time(b.created_at), true) || byEmail(a, b),
    active: (a, b) => byNullableTime(time(a.last_seen_at), time(b.last_seen_at), true) || byEmail(a, b),
    renewal: (a, b) => byNullableTime(a.will_renew ? time(a.next_billing_at) : null, b.will_renew ? time(b.next_billing_at) : null, false) || byEmail(a, b),
    email: byEmail,
    name: (a, b) => {
      const ka = nameKey(a)
      const kb = nameKey(b)
      if (!ka && !kb) return byEmail(a, b)
      if (!ka) return 1
      if (!kb) return -1
      return collator.compare(ka, kb) || byEmail(a, b)
    },
  }[sort] || (() => 0)
  return list.sort(compare)
}

export const PAGE_SIZES = [25, 50, 100]

export function paginate(list, page = 1, size = 25) {
  const total = list.length
  const pageSize = PAGE_SIZES.includes(Number(size)) ? Number(size) : 25
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(Math.max(1, Math.floor(Number(page) || 1)), pages)
  const start = (current - 1) * pageSize
  return {
    items: list.slice(start, start + pageSize),
    page: current,
    pages,
    pageSize,
    total,
    from: total ? start + 1 : 0,
    to: Math.min(start + pageSize, total),
  }
}

// CSV: names and email first, then the billing columns the export always had.
export const CSV_COLUMNS = [
  'account_id', 'first_name', 'last_name', 'full_name', 'email', 'name_status',
  'plan', 'billing_state', 'sub_status', 'price_amount_cents', 'next_billing_at', 'will_renew',
  'has_collected_payment', 'stripe_customer_count', 'live_subscription_count', 'billing_alerts',
  'cognito_status', 'referral_source', 'created_at', 'stripe_customer_id',
]

export function csvCell(value) {
  if (value == null) return ''
  let s = Array.isArray(value) ? value.join('; ') : String(value)
  // A cell starting with = + - @ (or a tab/CR) runs as a formula in
  // spreadsheet apps; prefix it so a name can never execute.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
  return s
}

export function membersCsv(members) {
  const rows = [CSV_COLUMNS.join(',')]
  for (const u of members || []) {
    const row = {
      ...u,
      account_id: accountIdOf(u),
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      full_name: fullNameOf(u),
      name_status: nameStatusOf(u),
    }
    rows.push(CSV_COLUMNS.map((c) => csvCell(row[c])).join(','))
  }
  return `${rows.join('\r\n')}\r\n`
}

/** "Copy emails": the email addresses only, never names. */
export function emailsOnly(members) {
  const seen = new Set()
  const out = []
  for (const u of members || []) {
    const email = String(u?.email || '').trim()
    if (!email || seen.has(email.toLowerCase())) continue
    seen.add(email.toLowerCase())
    out.push(email)
  }
  return out.join(', ')
}

export function directoryCounts(members) {
  const counts = { total: 0, complete: 0, single: 0, review: 0, missing: 0 }
  for (const u of members || []) {
    counts.total += 1
    counts[nameStatusOf(u)] += 1
  }
  return counts
}

export function attentionItems(members) {
  const list = members || []
  return [
    { id: 'payment_issue', label: 'Payment issues', count: list.filter((u) => effectiveBillingState(u) === 'payment_issue').length, tone: 'danger' },
    { id: 'duplicate', label: 'Duplicate live subscriptions', count: list.filter(hasDuplicateLiveSubscriptions).length, tone: 'danger' },
    { id: 'stripe_only', label: 'Paid without site account', count: list.filter(isPaidWithoutSiteAccount).length, tone: 'warning' },
    { id: 'ending', label: 'Ending plans', count: list.filter((u) => effectiveBillingState(u) === 'ending').length, tone: 'warning' },
  ]
}
