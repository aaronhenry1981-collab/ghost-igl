const DAY = 86400000

export function fmtDate(iso) {
  const ms = Date.parse(iso || '')
  if (!Number.isFinite(ms)) return '—'
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function fmtDateTime(iso) {
  const ms = Date.parse(iso || '')
  if (!Number.isFinite(ms)) return '—'
  return new Date(ms).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function fmtAgo(iso, now = Date.now()) {
  const ms = Date.parse(iso || '')
  if (!Number.isFinite(ms)) return 'never'
  const d = Math.floor((now - ms) / DAY)
  if (d <= 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 60) return `${d}d ago`
  return fmtDate(iso)
}

export function fmtMoney(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return 'unavailable'
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function pct(ratio) {
  if (!ratio || !ratio.denominator) return 'n/a'
  return `${ratio.pct}%`
}

export const SOURCE_LABEL = {
  cognito: 'Logins (Cognito)',
  account: 'Logins (Cognito)',
  subscriptions: 'Billing ledger',
  billing: 'Billing ledger',
  profiles: 'Player profiles',
  profile: 'Player profile',
  climb: 'Road to Champion',
  roadToChampion: 'Road to Champion',
  bookings: 'Coaching bookings',
  coaching: 'Live coach history',
  player: 'Player data',
  referrals: 'Referrals',
  legacyCrm: 'Existing CRM log',
  legacyOutreach: 'Existing CRM log',
  cs: 'Customer success',
}

// Sources that only exist in the browser never apply to server views.
export const HIDDEN_SOURCES = new Set(['local'])

export const BILLING_LABEL = {
  none: 'no subscription',
  active: 'active',
  trialing: 'trial',
  cancelling: 'cancel scheduled',
  comp: 'complimentary',
  payment_failed: 'payment failed',
  renewal_unconfirmed: 'renewal not recorded',
  ended: 'ended',
  comp_expired: 'comp expired',
  admin: 'admin',
  unknown: 'unavailable',
}

export function billingLabel(status) {
  return BILLING_LABEL[status] || String(status || '').replace(/_/g, ' ')
}
