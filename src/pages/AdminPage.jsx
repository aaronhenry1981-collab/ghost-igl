import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'
import TestimonialBuilder from '../components/admin/TestimonialBuilder'
import DemoVideoManager from '../components/admin/DemoVideoManager'
import CompManager from '../components/admin/CompManager'
import AuditLog from '../components/admin/AuditLog'
import GameCatalog from '../components/admin/GameCatalog'
import AvailabilityEditor from '../components/admin/AvailabilityEditor'
import AppointmentsCalendar from '../components/admin/AppointmentsCalendar'
import GrowthEngine from '../components/admin/GrowthEngine'
import {
  effectiveAccessPlan,
  effectiveBillingState,
  hasDuplicateLiveSubscriptions,
  hasDuplicateStripeCustomers,
  hasLiveStripeSubscription,
  isPaidWithoutSiteAccount,
  isStripeOnlyRecord,
} from '../lib/adminBillingHealth.mjs'
import './AdminPage.css'

const EMPTY_SUMMARY = {
  total: 0, active: 0, canceled: 0, past_due: 0,
  pro_active: 0, elite_active: 0, champion_active: 0,
  trialing: 0, trials_expected_to_convert: 0, ending: 0,
  mrr_dollars: '0.00', arr_dollars: '0.00', trial_mrr_dollars: '0.00',
  collected_30d_dollars: '0.00', refunds_30d_dollars: '0.00', new_last_30_days: 0,
}

const PLAN_LABELS = { free: 'Basic', pro: 'Pro', elite: 'Elite', champion: 'Champion' }

function formatMoney(cents) {
  const value = Number(cents || 0) / 100
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

function formatDate(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

function billingLabel(user) {
  const date = formatDate(user.next_billing_at)
  const amount = formatMoney(user.price_amount_cents)
  const billingState = effectiveBillingState(user)
  switch (billingState) {
    case 'paid': return { title: 'Paid', detail: user.price_amount_cents ? `Renews ${date} · ${amount}` : `Active through ${formatDate(user.current_period_end)}` }
    case 'trialing': return { title: 'Trial', detail: `First charge ${date} · ${amount}` }
    case 'ending': return { title: user.sub_status === 'trialing' ? 'Trial ending' : 'Ending', detail: `No charge after ${date}` }
    case 'payment_issue': return { title: 'Payment issue', detail: 'Action needed in Stripe' }
    case 'comp': return { title: 'Complimentary', detail: `Access through ${formatDate(user.current_period_end)}` }
    case 'canceled': return { title: 'Canceled', detail: user.has_collected_payment ? 'Previously paid' : 'No payment collected' }
    case 'free':
    case 'none':
    case undefined:
    case null:
    case '':
      return { title: 'No subscription', detail: 'Basic access' }
    default: return { title: user.sub_status || 'Unknown', detail: date !== '—' ? date : 'Check Stripe' }
  }
}

// Admin console is grouped into tabs so it's not one endless scroll. Every
// existing panel is preserved — just sorted into a logical home. Members is
// the default (the day-to-day view: who's signed up, who's active, billing).
const ADMIN_TABS = [
  { id: 'members', label: 'Members', hint: 'Access and billing' },
  { id: 'appointments', label: 'Coaching', hint: 'Appointments and contact' },
  { id: 'growth', label: 'Growth', hint: 'Evidence publishing' },
  { id: 'content', label: 'Site content', hint: 'Proof and product content' },
  { id: 'system', label: 'System', hint: 'Reconciliation and audit' },
]

// "Active" = seen within the last 15 minutes (rough, matches typical
// "online now" UX conventions). Anything older shows a relative time instead.
const ACTIVE_WINDOW_MS = 15 * 60 * 1000

function formatLastSeen(iso) {
  if (!iso) return { label: 'Never', isActive: false }
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return { label: 'Never', isActive: false }
  const diffMs = Date.now() - ms
  const isActive = diffMs >= 0 && diffMs < ACTIVE_WINDOW_MS
  if (diffMs < 60_000) return { label: 'Just now', isActive }
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return { label: `${mins}m ago`, isActive }
  const hours = Math.floor(mins / 60)
  if (hours < 24) return { label: `${hours}h ago`, isActive }
  const days = Math.floor(hours / 24)
  if (days < 30) return { label: `${days}d ago`, isActive }
  return { label: new Date(ms).toLocaleDateString(), isActive }
}

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [users, setUsers] = useState([])
  const [summary, setSummary] = useState(EMPTY_SUMMARY)
  const [billingSource, setBillingSource] = useState(null)
  const [billingWarning, setBillingWarning] = useState(null)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [backfilling, setBackfilling] = useState(false)
  const [query, setQuery] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [announcements, setAnnouncements] = useState([])
  const [announceForm, setAnnounceForm] = useState({ title: '', message: '', level: 'info', expires_at: '' })
  const [posting, setPosting] = useState(false)
  // Account-deletion target (moved up here from below the early returns — a hook
  // after a conditional return violates Rules of Hooks and crashed the page with
  // React #310 for loaded admins).
  const [deletingEmail, setDeletingEmail] = useState(null)
  const [adminTab, setAdminTab] = useState('members')

  const authedFetch = useCallback(async (path, init = {}) => {
    const cognitoUser = getCurrentUser()
    if (!cognitoUser) throw new Error('Not authenticated')
    const session = await getSession(cognitoUser)
    const token = getIdToken(session)
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) },
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `HTTP ${res.status}`)
    }
    return res.json()
  }, [])

  const loadData = useCallback(async () => {
    setLoadingData(true)
    setError(null)
    try {
      const data = await authedFetch('/admin/users')
      setUsers(data.users || [])
      setSummary({ ...EMPTY_SUMMARY, ...(data.summary || {}) })
      setBillingSource(data.billing_source || null)
      setBillingWarning(data.billing_warning || null)
    } catch (err) {
      const isLocalPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname)
      setError(isLocalPreview && /fetch/i.test(err.message)
        ? 'Local preview cannot reach the live admin data service. The layout is available to review, but member totals and admin actions require the deployed site.'
        : `Admin data could not be loaded. ${err.message}`)
    } finally {
      setLoadingData(false)
    }
  }, [authedFetch])

  const loadAnnouncements = useCallback(async () => {
    try {
      const data = await authedFetch('/admin/announcements')
      setAnnouncements(data.announcements || [])
    } catch (err) {
      console.error('Failed to load announcements:', err)
    }
  }, [authedFetch])

  useEffect(() => {
    if (isAdmin) {
      loadData()
      loadAnnouncements()
    }
  }, [isAdmin, loadData, loadAnnouncements])

  async function postAnnouncement(e) {
    e.preventDefault()
    setPosting(true)
    setError(null)
    try {
      const body = {
        title: announceForm.title,
        message: announceForm.message,
        level: announceForm.level,
        expires_at: announceForm.expires_at ? new Date(announceForm.expires_at).toISOString() : null,
      }
      await authedFetch('/admin/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setAnnounceForm({ title: '', message: '', level: 'info', expires_at: '' })
      setNotice('Announcement posted.')
      setTimeout(() => setNotice(null), 2500)
      await loadAnnouncements()
    } catch (err) {
      setError(err.message)
    } finally {
      setPosting(false)
    }
  }

  async function deleteAnnouncement(id) {
    if (!window.confirm('Delete this announcement?')) return
    try {
      await authedFetch(`/admin/announcements/${id}`, { method: 'DELETE' })
      await loadAnnouncements()
    } catch (err) {
      setError(err.message)
    }
  }

  // Count of users seen within the last 15 minutes — the "Active now" stat card.
  const activeNowCount = useMemo(
    () => users.filter((u) => formatLastSeen(u.last_seen_at).isActive).length,
    [users]
  )

  // All hooks must be declared before any early returns — moving useMemo up
  // here keeps the hook order stable across signed-in vs signed-out renders.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      if (planFilter !== 'all' && u.plan !== planFilter) return false
      if (statusFilter !== 'all') {
        if (statusFilter === 'free' && u.plan !== 'free') return false
        if (statusFilter === 'paid' && u.billing_state !== 'paid') return false
        if (statusFilter === 'trialing' && u.billing_state !== 'trialing') return false
        if (statusFilter === 'ending' && effectiveBillingState(u) !== 'ending') return false
        if (statusFilter === 'payment_issue' && effectiveBillingState(u) !== 'payment_issue') return false
        if (statusFilter === 'comp' && effectiveBillingState(u) !== 'comp') return false
        if (statusFilter === 'stripe_only' && !isPaidWithoutSiteAccount(u)) return false
        if (statusFilter === 'duplicate' && !hasDuplicateLiveSubscriptions(u)) return false
        if (statusFilter === 'duplicate_customer' && !hasDuplicateStripeCustomers(u)) return false
        if (statusFilter === 'canceled' && u.sub_status !== 'canceled') return false
        if (statusFilter === 'unconfirmed' && u.cognito_status !== 'UNCONFIRMED') return false
      }
      if (!q) return true
      return (
        (u.email || '').toLowerCase().includes(q) ||
        (u.stripe_customer_id || '').toLowerCase().includes(q)
      )
    })
  }, [users, query, planFilter, statusFilter])

  const attention = useMemo(() => {
    const paymentIssues = users.filter((u) => effectiveBillingState(u) === 'payment_issue').length
    const ending = users.filter((u) => effectiveBillingState(u) === 'ending').length
    const stripeOnly = users.filter(isPaidWithoutSiteAccount).length
    const duplicateBilling = users.filter(hasDuplicateLiveSubscriptions).length
    return [
      { id: 'payment_issue', label: 'Payment issues', count: paymentIssues, tone: 'danger' },
      { id: 'ending', label: 'Ending plans', count: ending, tone: 'warning' },
      { id: 'stripe_only', label: 'Paid without site account', count: stripeOnly, tone: 'warning' },
      { id: 'duplicate', label: 'Duplicate live subscriptions', count: duplicateBilling, tone: 'danger' },
    ]
  }, [users])

  function openAttention(item) {
    setAdminTab('members')
    setPlanFilter('all')
    setQuery('')
    setStatusFilter(item.id)
  }

  if (authLoading) return <div className="admin-page"><p>Loading…</p></div>
  if (!user) return <div className="admin-page admin-locked"><h1>Sign in required</h1><p>You must sign in to view admin.</p></div>
  if (!isAdmin) return <div className="admin-page admin-locked"><h1>Admin access required</h1><p>Your account is not in the admins group.</p></div>

  async function runBackfill() {
    setBackfilling(true)
    setNotice(null)
    setError(null)
    try {
      const res = await authedFetch('/admin/backfill', { method: 'POST' })
      setNotice(`Backfill complete — scanned ${res.scanned} Stripe subs, upserted ${res.upserted} Recon 6 rows.`)
      await loadData()
    } catch (err) {
      setError(`Backfill failed: ${err.message}`)
    } finally {
      setBackfilling(false)
    }
  }

  // Comp grant + management UI moved to <CompManager /> component below.
  // Form supports plan (Pro/Elite/Champion), duration (1mo/3mo/6mo/1yr/forever),
  // active comp list with days-remaining + one-click revoke.

  // Permanently delete a user account. Cascades across Cognito + profiles +
  // subscription rows. Backend has guards: refuses admins, refuses users with
  // active paid Stripe subs (those must cancel via Stripe portal first).
  // (deletingEmail state is declared up top with the other hooks.)
  async function deleteUserAccount(targetEmail) {
    if (!targetEmail) return
    // Two-step confirm — type the email to confirm, prevents fat-finger deletes.
    const typed = window.prompt(
      `PERMANENTLY DELETE the account for ${targetEmail}?\n\n` +
      `This deletes:\n` +
      `  • Their Cognito account (login)\n` +
      `  • Their profile data\n` +
      `  • Marks their subscription rows as canceled (audit trail kept)\n\n` +
      `Cannot be undone. Type the full email to confirm:`
    )
    if (!typed || typed.trim().toLowerCase() !== targetEmail.toLowerCase()) {
      if (typed != null) setError('Email did not match — deletion cancelled.')
      return
    }
    setDeletingEmail(targetEmail)
    setError(null)
    setNotice(null)
    try {
      const res = await authedFetch('/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      })
      const parts = []
      if (res.cognito_deleted) parts.push('Cognito user removed')
      if (res.profile_deleted) parts.push('profile removed')
      if (res.sub_rows > 0) parts.push(`${res.sub_rows} sub row(s) marked canceled`)
      setNotice(`Deleted ${targetEmail}: ${parts.join(', ') || 'nothing to delete (already gone)'}.`)
      await loadData()
    } catch (err) {
      setError(`Delete failed: ${err.message}`)
    } finally {
      setDeletingEmail(null)
    }
  }

  function exportCsv() {
    const cols = ['email', 'plan', 'billing_state', 'sub_status', 'price_amount_cents', 'next_billing_at', 'will_renew', 'has_collected_payment', 'stripe_customer_count', 'live_subscription_count', 'billing_alerts', 'cognito_status', 'referral_source', 'created_at', 'stripe_customer_id']
    const rows = [cols.join(',')]
    for (const u of filtered) rows.push(cols.map((c) => csvEscape(u[c])).join(','))
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function copyEmails() {
    const emails = filtered.map((u) => u.email).filter(Boolean).join(', ')
    navigator.clipboard.writeText(emails).catch(() => {})
    setNotice(`Copied ${filtered.length} emails.`)
    setTimeout(() => setNotice(null), 2000)
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <div className="admin-eyebrow">Business operations</div>
          <h1>Recon 6 Command Center</h1>
          <p>Members, coaching appointments, growth, content, and system controls in one place.</p>
        </div>
        <div className="admin-account-chip">
          <span>Signed in</span>
          <strong>{user.email}</strong>
        </div>
      </header>

      {/* MRR + paying counts exclude comp grants (admin-granted 2099 access
          with no Stripe sub) — comps are access, not revenue. They get their
          own card so the split is always visible. */}
      <section className="admin-overview" aria-label="Business overview">
        <div className="admin-stats-grid">
          <StatCard label="Current MRR" value={`$${summary.mrr_dollars}`} />
          <StatCard label="Collected (30 days)" value={billingSource === 'dynamodb' ? 'Unavailable' : `$${summary.collected_30d_dollars}`} />
          <StatCard label="Trials expected to convert" value={`${summary.trials_expected_to_convert ?? 0} · $${summary.trial_mrr_dollars}`} />
          <StatCard label="Payment issues" value={attention.find((item) => item.id === 'payment_issue')?.count ?? 0} />
        </div>
        <div className="admin-summary-strip">
          <SummaryMetric label="Paying" value={summary.paying_active ?? '—'} />
          <SummaryMetric label="Trials" value={summary.trialing ?? 0} />
          <SummaryMetric label="Ending" value={summary.ending ?? 0} tone={summary.ending > 0 ? 'warning' : ''} />
          <SummaryMetric label="Pro" value={summary.pro_active} />
          <SummaryMetric label="Elite" value={summary.elite_active} />
          <SummaryMetric label="Champion" value={summary.champion_active} />
          <SummaryMetric label="Complimentary" value={summary.comp_active ?? '—'} />
          <SummaryMetric label="Active now" value={activeNowCount} />
          <SummaryMetric label="Refunds (30d)" value={billingSource === 'dynamodb' ? 'Unavailable' : `$${summary.refunds_30d_dollars}`} />
        </div>
      </section>

      {notice && <div className="admin-note admin-note-success">{notice}</div>}
      {error && <div className="admin-note admin-note-error">{error}</div>}
      {billingWarning && <div className="admin-note admin-note-warning">{billingWarning} Cash and refund totals are hidden until live reconciliation recovers.</div>}

      <section className="admin-attention" aria-label="Items needing attention">
        <div className="admin-attention-heading">
          <div><span className="admin-eyebrow">Needs attention</span><h2>Protect revenue and customer access</h2></div>
          <small>Zero is good. Open an item to review the affected members.</small>
        </div>
        <div className="admin-attention-grid">
          {attention.map((item) => (
            <button key={item.id} type="button" className={`admin-attention-card is-${item.tone}${item.count === 0 ? ' is-clear' : ''}`} onClick={() => openAttention(item)}>
              <strong>{item.count}</strong><span>{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        {ADMIN_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={adminTab === t.id}
            className={`admin-tab${adminTab === t.id ? ' active' : ''}`}
            onClick={() => setAdminTab(t.id)}
          >
            <strong>{t.label}</strong>
            <small>{t.hint}</small>
          </button>
        ))}
      </div>

      {adminTab === 'members' && (
      <section className="admin-section">
        <div className="admin-section-header">
          <h2>Users ({filtered.length}{filtered.length !== users.length ? ` of ${users.length}` : ''})</h2>
          <div className="admin-actions">
            <button onClick={loadData} className="btn btn-sm btn-outline" disabled={loadingData}>
              {loadingData ? 'Loading…' : 'Refresh'}
            </button>
            <button onClick={copyEmails} className="btn btn-sm btn-outline" disabled={!filtered.length}>Copy emails</button>
            <button onClick={exportCsv} className="btn btn-sm btn-outline" disabled={!filtered.length}>Export CSV</button>
          </div>
        </div>

        <div className="admin-filters">
          <input
            type="search"
            placeholder="Search by email or Stripe ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="admin-input"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-input">
            <option value="all">All statuses</option>
            <option value="free">Free only</option>
            <option value="paid">Paid and renewing</option>
            <option value="trialing">Trial — scheduled to charge</option>
            <option value="ending">Ending — no next charge</option>
            <option value="payment_issue">Payment issue</option>
            <option value="comp">Complimentary</option>
            <option value="stripe_only">Paid without site account</option>
            <option value="duplicate">Duplicate live subscriptions</option>
            <option value="duplicate_customer">Duplicate Stripe customer profiles</option>
            <option value="canceled">Canceled</option>
            <option value="unconfirmed">Email unconfirmed</option>
          </select>
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="admin-input">
            <option value="all">All plans</option>
            <option value="free">Basic</option>
            <option value="pro">Pro</option>
            <option value="elite">Elite</option>
            <option value="champion">Champion</option>
          </select>
        </div>

        {loadingData && users.length === 0 ? (
          <div className="admin-empty"><p>Loading users…</p></div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <p>{users.length === 0 ? 'No users yet — they appear here after signing up.' : 'No matches for current filters.'}</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Access</th>
                  <th>Billing</th>
                  <th>Next</th>
                  <th>Website account</th>
                  <th>Last active</th>
                  <th>Source</th>
                  <th>Stripe</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  // Disable delete for admins (you) and active paying subs.
                  // Keeps the button visible but greyed out so it's obvious
                  // why some users can't be deleted from this UI.
                  const isYou = u.email === user.email
                  const isLiveStripe = hasLiveStripeSubscription(u)
                  const isOrphan = isStripeOnlyRecord(u)
                  const isPaidOrphan = isPaidWithoutSiteAccount(u)
                  const cannotDelete = isYou || isLiveStripe || isOrphan
                  const billing = billingLabel(u)
                  const accessPlan = effectiveAccessPlan(u)
                  const hasAlerts = Array.isArray(u.billing_alerts) && u.billing_alerts.length > 0
                  const deleteTooltip = isYou
                    ? "You can't delete your own admin account here."
                    : isPaidOrphan
                      ? 'Active Stripe billing without a site account — open Stripe and restore customer access.'
                      : isOrphan
                        ? 'Historical Stripe record only — there is no Cognito site account to delete.'
                      : isLiveStripe
                        ? 'Live Stripe subscription — change or cancel it in Stripe first.'
                        : 'Permanently delete this account.'
                  return (
                    <tr
                      key={u.username || u.email}
                      className={`${isPaidOrphan ? 'admin-row-orphan ' : ''}${hasAlerts ? 'admin-row-warning' : ''}`.trim()}
                      title={isPaidOrphan ? 'Active Stripe billing exists, but this email has no Recon 6 website account.' : isOrphan ? 'Historical Stripe record; no active site account or live subscription.' : hasAlerts ? 'This email has multiple Stripe customer profiles or live subscriptions. Open Stripe to review.' : undefined}
                    >
                      <td className="admin-mono">
                        {u.email || '-'}
                        {isOrphan && (
                          <span className="admin-badge admin-badge-warning-soft">NO ACCOUNT</span>
                        )}
                      </td>
                      <td>
                        <span className={`admin-badge admin-badge-${accessPlan}`}>{PLAN_LABELS[accessPlan] || accessPlan}</span>
                        {u.is_comp && (
                          <span className="admin-badge admin-badge-comp" title="Free access; excluded from revenue">COMP</span>
                        )}
                        {hasAlerts && (
                          <div className="admin-cell-alert">
                            Review {u.live_subscription_count > 1
                              ? `${u.live_subscription_count} live subscriptions`
                              : u.stripe_customer_count > 1
                                ? `${u.stripe_customer_count} Stripe customers`
                                : 'billing'}
                          </div>
                        )}
                      </td>
                      <td className="admin-billing-cell">
                        <span className={`admin-badge admin-badge-${u.billing_state || 'free'}`}>{billing.title}</span>
                        <small>{billing.detail}</small>
                      </td>
                      <td className="admin-next-cell">
                        {u.will_renew
                          ? <><strong>{formatMoney(u.price_amount_cents)}</strong><small>{formatDate(u.next_billing_at)}</small></>
                          : u.billing_state === 'ending'
                            ? <><strong>No next charge</strong><small>Ends {formatDate(u.next_billing_at)}</small></>
                            : <span className="admin-muted">—</span>}
                      </td>
                      <td className="admin-account-state">
                        {u.cognito_status === 'CONFIRMED'
                          ? <span className="admin-account-ok">Ready</span>
                          : u.cognito_status === 'NO_ACCOUNT'
                            ? <span style={{ color: '#ffc97a', fontSize: '0.85rem' }}>Stripe-only</span>
                            : <span className="admin-badge admin-badge-past_due">{u.cognito_status}</span>}
                      </td>
                      <td>
                        {(() => {
                          const seen = formatLastSeen(u.last_seen_at)
                          return (
                            <span style={{ color: seen.isActive ? '#4ade80' : undefined }}>
                              {seen.isActive && '● '}{seen.label}
                            </span>
                          )
                        })()}
                      </td>
                      <td>{u.referral_source || <span style={{ opacity: 0.4 }}>—</span>}</td>
                      <td>
                        {u.stripe_customer_id ? (
                          <>
                            <a href={`https://dashboard.stripe.com/customers/${u.stripe_customer_id}`} target="_blank" rel="noreferrer" className="admin-link-inline">
                              Open →
                            </a>
                            {Number(u.stripe_customer_count || 0) > 1 && (
                              <small className="admin-cell-alert">{u.stripe_customer_count} customer records</small>
                            )}
                          </>
                        ) : '-'}
                      </td>
                      <td>
                        <button
                          onClick={() => deleteUserAccount(u.email)}
                          className="btn btn-sm btn-outline"
                          disabled={cannotDelete || deletingEmail === u.email}
                          title={deleteTooltip}
                          style={{ opacity: cannotDelete ? 0.4 : 1, color: cannotDelete ? undefined : '#ff8a8a', borderColor: cannotDelete ? undefined : 'rgba(255,138,138,0.4)' }}
                        >
                          {deletingEmail === u.email ? 'Deleting…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="admin-footnote">
          “Paid” means Stripe has an active paid subscription. “Trial” means $0 has been collected so far. “Ending” means Stripe is not expected to charge again. Use <strong>Open</strong> for plan changes so Stripe applies proration correctly.
        </p>
      </section>
      )}

      {adminTab === 'appointments' && (
        <>
          <AppointmentsCalendar />
          <AvailabilityEditor />
        </>
      )}

      {adminTab === 'growth' && (
        <>
          <GrowthEngine currentMrr={Number(summary.mrr_dollars || 0)} />
          <CompManager />
        </>
      )}

      {adminTab === 'content' && (
        <>
          <GameCatalog />
          <DemoVideoManager />
          <TestimonialBuilder />
        </>
      )}

      {adminTab === 'system' && (
      <>
      <section className="admin-section admin-system-actions">
        <div className="admin-section-header"><div><span className="admin-eyebrow">Billing source of truth</span><h2>Stripe reconciliation</h2></div></div>
        <p className="admin-footnote">Use this only when the website membership table is missing or mislabeling Stripe subscriptions. It does not reprice, charge, or cancel customers.</p>
        <div className="admin-actions">
          <button onClick={runBackfill} className="btn btn-sm btn-outline" disabled={backfilling}>
            {backfilling ? 'Reconciling…' : 'Reconcile memberships from Stripe'}
          </button>
          <a className="btn btn-sm btn-outline" href="https://dashboard.stripe.com/" target="_blank" rel="noreferrer">Open Stripe dashboard</a>
        </div>
      </section>
      <AuditLog />

      <section className="admin-section">
        <div className="admin-section-header"><h2>Site announcements</h2></div>
        <p className="admin-footnote">
          Posts appear as a dismissible banner at the top of every page. Good for maintenance windows, new feature launches, or outage updates.
        </p>

        <form onSubmit={postAnnouncement} className="admin-announce-form">
          <input
            type="text"
            placeholder="Title (e.g. Scheduled maintenance tonight)"
            value={announceForm.title}
            onChange={(e) => setAnnounceForm({ ...announceForm, title: e.target.value })}
            maxLength={120}
            required
            className="admin-input"
          />
          <textarea
            placeholder="Message body — what's happening, when, and what users should expect."
            value={announceForm.message}
            onChange={(e) => setAnnounceForm({ ...announceForm, message: e.target.value })}
            maxLength={2000}
            required
            rows={3}
            className="admin-input"
          />
          <div className="admin-filters">
            <select
              value={announceForm.level}
              onChange={(e) => setAnnounceForm({ ...announceForm, level: e.target.value })}
              className="admin-input"
            >
              <option value="info">Info</option>
              <option value="update">Product update</option>
              <option value="maintenance">Maintenance</option>
              <option value="warning">Warning / Outage</option>
            </select>
            <input
              type="datetime-local"
              value={announceForm.expires_at}
              onChange={(e) => setAnnounceForm({ ...announceForm, expires_at: e.target.value })}
              className="admin-input"
              title="Auto-expire (optional)"
            />
            <button type="submit" className="btn btn-primary" disabled={posting}>
              {posting ? 'Posting…' : 'Post announcement'}
            </button>
          </div>
        </form>

        {announcements.length > 0 ? (
          <div className="admin-announce-list">
            {announcements.map((a) => (
              <div key={a.id} className={`admin-announce-item admin-announce-${a.level}`}>
                <div>
                  <div className="admin-announce-title">
                    <span className={`admin-badge admin-badge-${a.level}`}>{a.level}</span>
                    {a.title}
                  </div>
                  <div className="admin-announce-meta">
                    Posted {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                    {a.expires_at && ` · Expires ${new Date(a.expires_at).toLocaleString()}`}
                  </div>
                  <div className="admin-announce-message">{a.message}</div>
                </div>
                <button onClick={() => deleteAnnouncement(a.id)} className="btn btn-sm btn-outline">Delete</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-empty" style={{ marginTop: '1rem' }}><p>No announcements posted.</p></div>
        )}
      </section>
      </>
      )}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value">{value}</div>
    </div>
  )
}

function SummaryMetric({ label, value, tone = '' }) {
  return (
    <div className={`admin-summary-metric${tone ? ` admin-summary-${tone}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function csvEscape(v) {
  if (v == null) return ''
  const s = String(v)
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}
