// Read-only admin projection of subscription/index.mjs authorization. Stripe
// reconciliation may update billing labels, but must never overwrite this
// ledger-derived access snapshot. Parity tests cover the authorization rules.
import { WEBHOOK_ELITE_PRICE_IDS } from './reconcile.mjs'

const PLAN_RANK = { champion: 4, elite: 3, pro: 2, free: 1 }

export function membershipPlan(row, env = process.env) {
  const legacyElite = new Set([
    env.STRIPE_CHAMPION_PRICE_ID, env.STRIPE_CHAMPION_FOUNDING_PRICE_ID,
    env.STRIPE_CHAMPION_REGULAR_PRICE_ID, env.STRIPE_CHAMPION_ALL_ACCESS_PRICE_ID,
    env.STRIPE_CHAMPION_ALL_ACCESS_ANNUAL_PRICE_ID, ...WEBHOOK_ELITE_PRICE_IDS,
  ].filter(Boolean))
  return legacyElite.has(row?.price_id) ? 'elite' : row?.plan || 'free'
}

export function hasMembershipAccess(row, nowMs = Date.now()) {
  if (!['active', 'trialing'].includes(row?.status)) return false
  const end = Date.parse(row.current_period_end || '')
  return Number.isFinite(end) && end > nowMs
}

export function bestMembership(rows, nowMs = Date.now(), env = process.env) {
  const active = (rows || []).filter((row) => hasMembershipAccess(row, nowMs))
  if (!active.length) return rows?.[0] || null
  return active.sort((a, b) =>
    ((PLAN_RANK[membershipPlan(b, env)] || 0) - (PLAN_RANK[membershipPlan(a, env)] || 0)) ||
    String(b.current_period_end || '').localeCompare(String(a.current_period_end || '')))[0]
}

export function memberAccessFields(row, isAdmin = false, nowMs = Date.now()) {
  const active = hasMembershipAccess(row, nowMs)
  const complimentary = Boolean(row && (row.comp || !row.stripe_subscription_id || String(row.current_period_end || '').startsWith('2099')))
  return {
    is_admin: isAdmin,
    access_plan: isAdmin ? 'champion' : active ? membershipPlan(row) : 'free',
    access_status: isAdmin ? 'active' : row?.comp === true && row.status === 'active' && !active ? 'expired' : row?.status || 'none',
    access_period_end: row?.current_period_end || null,
    access_source: isAdmin ? 'admin' : active ? complimentary ? 'complimentary' : 'subscription' : 'free',
  }
}
