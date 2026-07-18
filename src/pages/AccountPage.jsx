import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'
import { useSectionNavigate } from '../utils/sectionLink'
import './AccountPage.css'

const PLATFORMS = ['PC', 'Xbox', 'PlayStation']
const SERVERS = ['US East', 'US Central', 'US West', 'EU', 'SEA', 'OCE', 'LATAM', 'Brazil']
const ROLES = ['IGL', 'Entry', 'Support', 'Anchor', 'Roamer', 'Flex']

export default function AccountPage() {
  const { user, plan: authPlan, isAdmin, vodUsage, loading: authLoading, signOut } = useAuth()
  const navigate = useNavigate()
  const goToPricing = useSectionNavigate('pricing')
  const [me, setMe] = useState(null)
  const [form, setForm] = useState({
    discord_handle: '',
    gamer_id: '',
    platform: '',
    preferred_server: '',
    main_role: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [notice, setNotice] = useState(null)
  const [error, setError] = useState(null)

  const authedFetch = useCallback(async (path, init = {}) => {
    const cognitoUser = getCurrentUser()
    if (!cognitoUser) throw new Error('Not authenticated')
    const session = await getSession(cognitoUser)
    const token = getIdToken(session)
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `HTTP ${res.status}`)
    }
    return res.json()
  }, [])

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth?redirect=/account')
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await authedFetch('/me')
        if (cancelled) return
        setMe(data)
        if (data.profile) {
          setForm((f) => ({ ...f, ...pickFields(data.profile) }))
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user, authedFetch])

  async function saveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const body = JSON.stringify(pickFields(form))
      const res = await authedFetch('/me', { method: 'PUT', body })
      setMe((m) => ({ ...(m || {}), profile: res.profile }))
      setNotice('Profile saved.')
      setTimeout(() => setNotice(null), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function openBillingPortal() {
    setPortalLoading(true)
    setError(null)
    try {
      const res = await authedFetch('/me/billing-portal', { method: 'POST' })
      window.location.href = res.url
    } catch (err) {
      setError(err.message)
      setPortalLoading(false)
    }
  }

  if (authLoading) return <div className="account-page"><p>Loading…</p></div>
  if (!user) return null

  // Prefer /me response, fall back to local auth state while loading
  const plan = me?.plan || authPlan || 'free'
  const subStatus = me?.sub_status || 'none'
  const comp = me?.comp || isAdmin
  const isPaid = plan !== 'free'
  const displayPlan = isAdmin ? 'CEO' : plan.toUpperCase()
  const planClassKey = isAdmin ? 'ceo' : plan

  return (
    <div className="account-page">
      <header className="account-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Your Account</h1>
          <p>Signed in as <span className="account-mono">{user.email}</span></p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="btn btn-ghost btn-sm"
          style={{
            borderColor: 'rgba(255, 77, 95, 0.4)',
            color: '#ff8a8a',
          }}
        >
          Sign out
        </button>
      </header>

      <section className="account-section">
        <div className={`account-plan-card account-plan-card-${planClassKey}`}>
          <div>
            <div className="account-label">Current plan</div>
            <div className="account-plan-name">
              <span className={`account-badge account-badge-${planClassKey}`}>{displayPlan}</span>
              {comp && <span className="account-badge account-badge-comp">COMP</span>}
              {subStatus === 'past_due' && <span className="account-badge account-badge-past_due">PAST DUE</span>}
              {subStatus === 'canceled' && <span className="account-badge account-badge-canceled">CANCELED</span>}
            </div>
            {me?.current_period_end && !comp && (
              <div className="account-muted">
                {subStatus === 'active' ? 'Renews' : 'Ended'} {new Date(me.current_period_end).toLocaleDateString()}
              </div>
            )}
            {comp && (
              <div className="account-muted">Full access · no billing</div>
            )}
          </div>
          <div className="account-plan-actions">
            {isAdmin ? (
              <Link to="/admin" className="btn btn-primary btn-sm">Open admin</Link>
            ) : isPaid ? (
              <button onClick={openBillingPortal} className="btn btn-primary btn-sm" disabled={portalLoading}>
                {portalLoading ? 'Opening…' : 'Manage billing'}
              </button>
            ) : (
              <button type="button" onClick={goToPricing} className="btn btn-primary btn-sm">See plans</button>
            )}
          </div>
        </div>
      </section>

      {vodUsage && !isAdmin && (
        <section className="account-section">
          <h2>VOD review usage</h2>
          <p className="account-muted">
            VOD review sessions are capped to keep the AI compute fair across all subscribers. Caps reset {vodUsage.is_trial ? 'never (trial is a lifetime allowance)' : 'every 30 days from your billing period start'}.
          </p>
          <div style={{
            padding: '1.1rem 1.25rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            marginTop: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                  <span style={{ color: '#fff' }}>{vodUsage.used}</span>
                  <span style={{ color: 'rgba(230,233,239,0.5)', fontSize: '1rem', fontWeight: 500 }}> / {vodUsage.limit} sessions</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(230,233,239,0.65)', marginTop: 2 }}>
                  <strong style={{ color: '#7ee2a4' }}>{vodUsage.remaining}</strong> remaining {vodUsage.is_trial ? 'in your trial' : 'this period'}
                </div>
              </div>
              {vodUsage.period_end && (
                <div style={{ fontSize: '0.85rem', color: 'rgba(230,233,239,0.6)', textAlign: 'right' }}>
                  Resets<br />
                  <strong style={{ color: '#fff' }}>{new Date(vodUsage.period_end).toLocaleDateString()}</strong>
                </div>
              )}
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden', marginTop: 12 }}>
              <div style={{
                width: `${vodUsage.limit > 0 ? Math.min(100, (vodUsage.used / vodUsage.limit) * 100) : 0}%`,
                height: '100%',
                background: vodUsage.remaining <= 2 ? '#ff8a8a' : vodUsage.remaining <= 5 ? '#ffc97a' : '#7ee2a4',
                transition: 'width 0.3s ease',
              }} />
            </div>
            {vodUsage.is_trial && (
              <p style={{ marginTop: 10, fontSize: '0.85rem', color: 'rgba(230,233,239,0.7)' }}>
                Trial allowance is <strong>3 lifetime sessions</strong> — enough to test the AI on real matches. Subscribe to Pro for 20 sessions per month.
              </p>
            )}
          </div>
        </section>
      )}

      <section className="account-section">
        <h2>Your gamer profile</h2>
        <p className="account-muted">
          Used by coaching features to tailor callouts and team-mate matching. You can change it anytime.
        </p>

        {loading ? (
          <p>Loading profile…</p>
        ) : (
          <form onSubmit={saveProfile} className="account-form">
            <Field label="Discord handle" placeholder="yourname or yourname#1234">
              <input
                type="text"
                maxLength={100}
                value={form.discord_handle}
                onChange={(e) => setForm({ ...form, discord_handle: e.target.value })}
                className="account-input"
              />
            </Field>

            <Field label="In-game name (Ubisoft / Xbox / PSN ID)" placeholder="YourGamerTag">
              <input
                type="text"
                maxLength={100}
                value={form.gamer_id}
                onChange={(e) => setForm({ ...form, gamer_id: e.target.value })}
                className="account-input"
              />
            </Field>

            <div className="account-form-row">
              <Field label="Platform">
                <select
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  className="account-input"
                >
                  <option value="">—</option>
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>

              <Field label="Preferred server">
                <select
                  value={form.preferred_server}
                  onChange={(e) => setForm({ ...form, preferred_server: e.target.value })}
                  className="account-input"
                >
                  <option value="">—</option>
                  {SERVERS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="Main role">
                <select
                  value={form.main_role}
                  onChange={(e) => setForm({ ...form, main_role: e.target.value })}
                  className="account-input"
                >
                  <option value="">—</option>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
            </div>

            {notice && <div className="account-note account-note-success">{notice}</div>}
            {error && <div className="account-note account-note-error">{error}</div>}

            <div className="account-form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="account-section">
        <h2>What you have access to</h2>
        <ul className="account-access-list">
          <AccessItem enabled allow="Map strats, operator picks, community access" />
          <AccessItem enabled={isPaid || isAdmin} allow="Ban targets and pick recommendations matched to your role and rank" note="Pro+" />
          <AccessItem enabled={isPaid || isAdmin} allow="Round-by-round VOD breakdowns from your screenshots" note="Pro+" />
          <AccessItem enabled={false} allow="Desktop live coach" note="Planned — not currently available" />
          <AccessItem enabled={plan === 'champion' || isAdmin} allow="Real-time 5-stack team sessions + voice callouts" note="Champion" />
        </ul>
        {!isPaid && !isAdmin && (
          <div className="account-upgrade-cta">
            <button type="button" onClick={goToPricing} className="btn btn-primary">Upgrade to Pro →</button>
          </div>
        )}
      </section>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="account-field">
      <span className="account-field-label">{label}</span>
      {children}
    </label>
  )
}

function AccessItem({ enabled, allow, note }) {
  return (
    <li className={`account-access-item${enabled ? ' enabled' : ''}`}>
      <span className="account-access-mark">{enabled ? '✓' : '×'}</span>
      <span className="account-access-text">{allow}</span>
      {note && <span className="account-access-note">{note}</span>}
    </li>
  )
}

function pickFields(o) {
  const keys = ['discord_handle', 'gamer_id', 'platform', 'preferred_server', 'main_role']
  const out = {}
  for (const k of keys) out[k] = o[k] ?? ''
  return out
}
