// Which subscription row wins when one email has several.
//
// Regression source: a real customer on 2026-07-29 (thurnallandrew72@gmail.com).
// He bought Pro at 07:00, upgraded to Champion at 07:29, and the site kept
// telling him he was Pro — so he re-bought Champion at 07:30, 07:31 and 07:34,
// then gave up and signed up again under a second email, which worked first try.
//
// Cause: `email-index` is a HASH-only GSI, so DynamoDB returns the rows for an
// email in arbitrary order, and the old code took the first one that happened to
// be live. The ROW ORDER IN THE FIXTURE BELOW IS THE REAL ONE, copied off the
// live table — Pro first. That ordering is the whole bug; do not "tidy" it.
import test from 'node:test'
import assert from 'node:assert'

const PLAN_RANK = { champion: 4, elite: 3, pro: 2, free: 1 }

function isActiveSub(s) {
  if (!s) return false
  if (s.status !== 'active' && s.status !== 'trialing') return false
  if (s.comp === true && s.current_period_end) {
    const end = Date.parse(s.current_period_end)
    if (Number.isFinite(end) && end < Date.now()) return false
  }
  return true
}

function pickBestSub(items) {
  const live = (items || []).filter(isActiveSub)
  if (!live.length) return (items || [])[0] || null
  return live.slice().sort((a, b) => {
    const byPlan = (PLAN_RANK[b.plan] || 0) - (PLAN_RANK[a.plan] || 0)
    if (byPlan) return byPlan
    return String(b.current_period_end || '').localeCompare(String(a.current_period_end || ''))
  })[0]
}

// Verbatim from the live table, in the order the GSI returned them.
const ANDREW = [
  { plan: 'pro', status: 'trialing', current_period_end: '2026-08-28T07:00:27.000Z', stripe_customer_id: 'cus_UyOGbEzDunqqa6' },
  { plan: 'champion', status: 'canceled', current_period_end: '2026-08-28T07:33:59.000Z', stripe_customer_id: 'cus_UyOn31btlYm3Ec' },
  { plan: 'champion', status: 'trialing', current_period_end: '2026-08-28T07:30:12.000Z', stripe_customer_id: 'cus_UyOjEbGSfqbDTm' },
  { plan: 'champion', status: 'active', current_period_end: '2026-08-28T07:29:05.000Z', stripe_customer_id: 'cus_UyOiRduUgSKwPn' },
  { plan: 'champion', status: 'canceled', current_period_end: '2026-08-28T07:31:33.000Z', stripe_customer_id: 'cus_UyOlQepNIC6oq1' },
]

test('the customer who paid for Champion is served Champion', () => {
  assert.equal(pickBestSub(ANDREW).plan, 'champion')
})

test('the old first-match rule is what served him Pro', () => {
  const old = ANDREW.find(isActiveSub)
  assert.equal(old.plan, 'pro', 'fixture no longer reproduces the bug — check the row order')
})

test('a cancelled row never wins over a live one', () => {
  assert.ok(['active', 'trialing'].includes(pickBestSub(ANDREW).status))
})

test('single Pro subscriber still gets Pro, not an upgrade', () => {
  const rows = [{ plan: 'pro', status: 'active', current_period_end: '2026-09-01T00:00:00.000Z' }]
  assert.equal(pickBestSub(rows).plan, 'pro')
})

test('Champion beats Elite and Elite beats Pro', () => {
  const rows = [
    { plan: 'pro', status: 'active', current_period_end: '2027-02-01' },
    { plan: 'elite', status: 'active', current_period_end: '2027-01-01' },
    { plan: 'champion', status: 'active', current_period_end: '2026-12-01' },
  ]
  assert.equal(pickBestSub(rows).plan, 'champion')
  assert.equal(pickBestSub(rows.slice(0, 2)).plan, 'elite')
})

test('a cancelled Champion does not beat a live Pro', () => {
  const rows = [
    { plan: 'champion', status: 'canceled', current_period_end: '2026-12-01T00:00:00.000Z' },
    { plan: 'pro', status: 'active', current_period_end: '2026-08-28T00:00:00.000Z' },
  ]
  assert.equal(pickBestSub(rows).plan, 'pro')
})

test('same tier twice: the row paid furthest ahead wins', () => {
  const rows = [
    { plan: 'champion', status: 'active', current_period_end: '2026-08-01T00:00:00.000Z', stripe_customer_id: 'old' },
    { plan: 'champion', status: 'active', current_period_end: '2026-11-01T00:00:00.000Z', stripe_customer_id: 'new' },
  ]
  assert.equal(pickBestSub(rows).stripe_customer_id, 'new')
})

test('an expired comp row does not grant access', () => {
  const rows = [{ plan: 'champion', status: 'active', comp: true, current_period_end: '2020-01-01T00:00:00.000Z' }]
  assert.equal(pickBestSub(rows).status, 'active')
  assert.equal(isActiveSub(rows[0]), false, 'expired comp must not count as live')
})

test('no rows at all is not a crash', () => {
  assert.equal(pickBestSub([]), null)
  assert.equal(pickBestSub(undefined), null)
})
