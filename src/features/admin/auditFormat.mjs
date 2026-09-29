// Readable labels for audit-log actions (ghost-igl-audit-log).
export const AUDIT_ACTIONS = {
  'comp.grant': { label: 'Complimentary access granted', tone: 'ok' },
  'comp.revoke': { label: 'Complimentary access revoked', tone: 'warning' },
  'user.delete': { label: 'Account removed in the console', tone: 'danger' },
  'user.delete.review': { label: 'Account removal reviewed', tone: 'muted' },
  'privacy.delete': { label: 'Privacy deletion completed', tone: 'danger' },
  'user.name.update': { label: 'Member name updated', tone: 'info' },
  'reconcile.preview': { label: 'Stripe reconciliation previewed', tone: 'muted' },
  'reconcile.apply': { label: 'Stripe reconciliation applied', tone: 'info' },
  'reconcile.row': { label: 'Membership row reconciled', tone: 'info' },
}

export function auditLabel(action) {
  return AUDIT_ACTIONS[action]?.label || action || 'Unknown action'
}

export function auditTone(action) {
  return AUDIT_ACTIONS[action]?.tone || 'muted'
}

function short(value) {
  if (value == null) return '—'
  if (typeof value === 'object') {
    const parts = Object.entries(value).filter(([, v]) => v != null && v !== '').map(([k, v]) => `${k.replace(/_/g, ' ')} ${typeof v === 'object' ? JSON.stringify(v) : v}`)
    return parts.length ? parts.join(', ') : '—'
  }
  return String(value)
}

/** One line per detail field, for a record's history. */
export function auditDetailLines(details) {
  if (!details || typeof details !== 'object') return []
  if (details.before !== undefined || details.after !== undefined) {
    return [`Before: ${short(details.before)}`, `After: ${short(details.after)}`]
  }
  return Object.entries(details)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
}

export function timeAgo(iso, nowMs) {
  const ms = nowMs - Date.parse(iso || '')
  if (!Number.isFinite(ms)) return '—'
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
