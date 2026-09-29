// Display formatting for member billing, access and activity. Pure; the
// current time is passed in so rendering stays deterministic.
import { effectiveBillingState } from '../../lib/adminBillingHealth.mjs'

export const PLAN_LABELS = { free: 'Basic', pro: 'Pro', elite: 'Elite', champion: 'Champion' }

export function formatMoney(cents) {
  const value = Number(cents || 0) / 100
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

export function formatDollars(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n.toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : null
}

export function formatDate(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// "Active" = seen within the last 15 minutes.
const ACTIVE_WINDOW_MS = 15 * 60 * 1000

export function formatLastSeen(iso, nowMs) {
  const ms = Date.parse(iso || '')
  if (!iso || Number.isNaN(ms)) return { label: 'No recorded activity', isActive: false }
  const diffMs = nowMs - ms
  const isActive = diffMs >= 0 && diffMs < ACTIVE_WINDOW_MS
  if (diffMs < 60_000) return { label: 'Just now', isActive }
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return { label: `${mins}m ago`, isActive }
  const hours = Math.floor(mins / 60)
  if (hours < 24) return { label: `${hours}h ago`, isActive }
  const days = Math.floor(hours / 24)
  if (days < 30) return { label: `${days}d ago`, isActive }
  return { label: formatDate(iso), isActive }
}

export function billingLabel(user) {
  const date = formatDate(user.next_billing_at)
  const amount = formatMoney(user.price_amount_cents)
  switch (effectiveBillingState(user)) {
    case 'paid': return { title: 'Paid', tone: 'ok', detail: user.price_amount_cents ? `Renews ${date} · ${amount}` : `Active through ${formatDate(user.current_period_end)}` }
    case 'trialing': return { title: 'Trial', tone: 'info', detail: `First charge ${date} · ${amount}` }
    case 'ending': return { title: user.sub_status === 'trialing' ? 'Trial ending' : 'Ending', tone: 'warning', detail: `No charge after ${date}` }
    case 'payment_issue': return { title: 'Payment issue', tone: 'danger', detail: 'Action needed in Stripe' }
    case 'comp': return { title: 'Complimentary', tone: 'info', detail: `Access through ${formatDate(user.current_period_end)}` }
    case 'canceled': return { title: 'Canceled', tone: 'muted', detail: user.has_collected_payment ? 'Previously paid' : 'No payment collected' }
    case 'free':
    case 'none':
    case undefined:
    case null:
    case '':
      return { title: 'No subscription', tone: 'muted', detail: 'Basic access' }
    default: return { title: user.sub_status || 'Unknown', tone: 'muted', detail: date !== '—' ? date : 'Check Stripe' }
  }
}

export function accountStateLabel(user) {
  switch (user?.cognito_status) {
    case 'CONFIRMED': return { title: 'Ready', tone: 'ok', detail: 'Can sign in' }
    case 'NO_ACCOUNT': return { title: 'No site account', tone: 'warning', detail: 'Stripe customer only' }
    case 'UNCONFIRMED': return { title: 'Email unconfirmed', tone: 'warning', detail: 'Has not confirmed the sign-up code' }
    case 'FORCE_CHANGE_PASSWORD': return { title: 'Finish account setup', tone: 'warning', detail: 'Must set a password at first sign-in' }
    case 'RESET_REQUIRED': return { title: 'Password reset required', tone: 'warning', detail: 'Must reset the password to sign in' }
    default: return { title: user?.cognito_status || 'Unknown', tone: 'muted', detail: '' }
  }
}

export function nameSourceLabel(source) {
  return { admin: 'Edited by an admin', member: 'Entered by the member', cognito: 'From the sign-up record', stripe: 'From the Stripe customer' }[source] || null
}
