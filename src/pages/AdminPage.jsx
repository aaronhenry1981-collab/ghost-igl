import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'
import PromoKit from '../components/admin/PromoKit'
import TestimonialBuilder from '../components/admin/TestimonialBuilder'
import DemoVideoManager from '../components/admin/DemoVideoManager'
import CompManager from '../components/admin/CompManager'
import AuditLog from '../components/admin/AuditLog'
import GameCatalog from '../components/admin/GameCatalog'
import DailyPlaybook from '../components/admin/DailyPlaybook'
import AvailabilityEditor from '../components/admin/AvailabilityEditor'
import './AdminPage.css'

const EMPTY_SUMMARY = {
  total: 0, active: 0, canceled: 0, past_due: 0,
  pro_active: 0, champion_active: 0,
  mrr_dollars: '0.00', arr_dollars: '0.00', new_last_30_days: 0,
}

// Display-only id -> name map for the "Active Game" column. Deliberately NOT
// importing the full GAMES catalog (src/data/games/index.js) here — each
// entry lazy-loads a whole game module via load(), way too heavy just to
// print a label in an admin table. Keep in sync with GAMES' id list.
const GAME_NAMES = {
  r6: 'Rainbow Six Siege', cs2: 'Counter-Strike 2', valorant: 'Valorant',
  ow2: 'Overwatch 2', apex: 'Apex Legends', mvr: 'Marvel Rivals',
  halo: 'Halo', finals: 'The Finals', cod: 'Call of Duty', fn: 'Fortnite',
  rl: 'Rocket League', lol: 'League of Legends', dota2: 'Dota 2',
  eafc: 'EA FC', tk8: 'Tekken 8', sf6: 'Street Fighter 6', pubg: 'PUBG',
  deadlock: 'Deadlock', naraka: 'Naraka: Bladepoint', nba2k: 'NBA 2K',
}

// Admin console is grouped into tabs so it's not one endless scroll. Every
// existing panel is preserved — just sorted into a logical home. Members is
// the default (the day-to-day view: who's signed up, who's active, billing).
const ADMIN_TABS = [
  { id: 'members', label: 'Members' },
  { id: 'growth', label: 'Growth' },
  { id: 'content', label: 'Content' },
  { id: 'system', label: 'System' },
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
      setSummary(data.summary || EMPTY_SUMMARY)
    } catch (err) {
      setError(err.message)
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
        if (statusFilter === 'active' && u.sub_status !== 'active') return false
        if (statusFilter === 'past_due' && u.sub_status !== 'past_due') return false
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
  // Form supports plan (Pro/Champion), duration (1mo/3mo/6mo/1yr/forever),
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
    const cols = ['email', 'plan', 'sub_status', 'cognito_status', 'referral_source', 'created_at', 'current_period_end', 'stripe_customer_id']
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
        <h1>Recon 6 Admin</h1>
        <p style={{ color: 'rgba(230,233,239,0.6)', marginTop: '-0.5rem', fontSize: '0.9rem' }}>
          Multi-game console — users, subscriptions, content, audit log, and per-game catalog.
        </p>
        <p>Signed in as <span className="admin-mono">{user.email}</span></p>
      </header>

      {/* MRR + paying counts exclude comp grants (admin-granted 2099 access
          with no Stripe sub) — comps are access, not revenue. They get their
          own card so the split is always visible. */}
      <div className="admin-stats-grid">
        <StatCard label="MRR (paying)" value={`$${summary.mrr_dollars}`} />
        <StatCard label="ARR (projected)" value={`$${summary.arr_dollars}`} />
        <StatCard label="Paying subs" value={summary.paying_active ?? '—'} />
        <StatCard label="Comp access" value={summary.comp_active ?? '—'} />
        <StatCard label="Total users" value={users.length} />
        <StatCard label="Active now" value={activeNowCount} />
        <StatCard label="Pro" value={summary.pro_active} />
        <StatCard label="Champion" value={summary.champion_active} />
        <StatCard label="Past due" value={summary.past_due} />
        <StatCard label="New (30d)" value={summary.new_last_30_days} />
      </div>

      {notice && <div className="admin-note admin-note-success">{notice}</div>}
      {error && <div className="admin-note admin-note-error">{error}</div>}

      <div className="admin-tabs" role="tablist">
        {ADMIN_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={adminTab === t.id}
            className={`admin-tab${adminTab === t.id ? ' active' : ''}`}
            onClick={() => setAdminTab(t.id)}
          >
            {t.label}
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
            <button onClick={runBackfill} className="btn btn-sm btn-outline" disabled={backfilling}>
              {backfilling ? 'Backfilling…' : 'Backfill from Stripe'}
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
            <option value="active">Active paying</option>
            <option value="past_due">Past due</option>
            <option value="canceled">Canceled</option>
            <option value="unconfirmed">Email unconfirmed</option>
          </select>
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="admin-input">
            <option value="all">All plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
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
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Verified</th>
                  <th>Active game</th>
                  <th>Last active</th>
                  <th>Source</th>
                  <th>Signed up</th>
                  <th>Renews</th>
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
                  const isActivePaid = u.sub_status === 'active' && u.stripe_customer_id && !u.stripe_customer_id.startsWith('comp_') && !u.stripe_customer_id.startsWith('admin_')
                  // Orphan = paid in Stripe but never created a Cognito
                  // account. Renders with an amber row tint + "NO ACCOUNT"
                  // badge so Aaron can spot customers who need a signup
                  // chase before they churn.
                  const isOrphan = u.orphan === true || u.cognito_status === 'NO_ACCOUNT'
                  const cannotDelete = isYou || isActivePaid || isOrphan
                  const deleteTooltip = isYou
                    ? "You can't delete your own admin account here."
                    : isOrphan
                      ? 'Stripe-only customer — no Cognito account to delete. Cancel via Stripe instead.'
                      : isActivePaid
                        ? 'Active paying customer — cancel their Stripe subscription first.'
                        : 'Permanently delete this account.'
                  return (
                    <tr
                      key={u.username || u.email}
                      style={isOrphan ? { background: 'rgba(255, 180, 80, 0.06)' } : undefined}
                      title={isOrphan ? 'Paid in Stripe but never created a Recon 6 account — send them a signup link.' : undefined}
                    >
                      <td className="admin-mono">
                        {u.email || '-'}
                        {isOrphan && (
                          <span
                            className="admin-badge"
                            style={{
                              marginLeft: 8,
                              background: 'rgba(255, 180, 80, 0.18)',
                              border: '1px solid rgba(255, 180, 80, 0.5)',
                              color: '#ffc97a',
                              fontSize: '0.65rem',
                              padding: '2px 7px',
                              borderRadius: 999,
                              fontWeight: 700,
                              letterSpacing: '0.05em',
                            }}
                          >
                            ⚠ NO ACCOUNT
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`admin-badge admin-badge-${u.plan}`}>{u.plan}</span>
                        {u.is_comp && (
                          <span
                            className="admin-badge"
                            title="Comp grant — free access, no Stripe subscription, not counted in MRR"
                            style={{ marginLeft: 6, background: 'rgba(160,120,255,0.15)', border: '1px solid rgba(160,120,255,0.45)', color: '#c9b3ff', fontSize: '0.62rem', padding: '2px 6px', borderRadius: 999, fontWeight: 700 }}
                          >
                            COMP
                          </span>
                        )}
                      </td>
                      <td><span className={`admin-badge admin-badge-${u.sub_status === 'none' ? 'free' : u.sub_status}`}>{u.sub_status === 'none' ? '—' : u.sub_status}</span></td>
                      <td>
                        {u.cognito_status === 'CONFIRMED'
                          ? '✓'
                          : u.cognito_status === 'NO_ACCOUNT'
                            ? <span style={{ color: '#ffc97a', fontSize: '0.85rem' }}>Stripe-only</span>
                            : <span className="admin-badge admin-badge-past_due">{u.cognito_status}</span>}
                      </td>
                      <td>{u.active_game_id ? (GAME_NAMES[u.active_game_id] || u.active_game_id) : <span style={{ opacity: 0.4 }}>—</span>}</td>
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
                      <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                      <td>{u.current_period_end ? new Date(u.current_period_end).toLocaleDateString() : '-'}</td>
                      <td>
                        {u.stripe_customer_id ? (
                          <a href={`https://dashboard.stripe.com/customers/${u.stripe_customer_id}`} target="_blank" rel="noreferrer" className="admin-link-inline">
                            Open →
                          </a>
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
          To upgrade a customer, click <strong>Open</strong> next to their row to go to their Stripe customer page, then use Stripe's native upgrade flow (applies proration automatically). Changes flow back here via webhook.
        </p>
      </section>
      )}

      {adminTab === 'growth' && (
        <>
          <DailyPlaybook />
          <AvailabilityEditor />
          <CompManager />
          <PromoKit />
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

function csvEscape(v) {
  if (v == null) return ''
  const s = String(v)
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}
