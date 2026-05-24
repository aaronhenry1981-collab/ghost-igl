import { useState, useEffect, useCallback } from 'react'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../../lib/cognito'

// Comp account manager — grant time-limited Pro/Champion access without
// charging, then convert to paid or revoke when the trial ends.
//
// Use cases: influencer trials, Discord giveaways, refunds-in-progress,
// support cases, beta testers. Comp rows have `comp: true` so MRR
// calculations exclude them — they don't pollute revenue metrics.
//
// Backend: POST /admin/comp grants, GET /admin/comps lists, POST /admin/uncomp
// revokes early. The subscription Lambda enforces expiry server-side: when
// `current_period_end` passes, the comp stops granting access automatically
// (no cron needed — checked at request time).

const DURATIONS = [
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
  { label: '6 months', days: 180 },
  { label: '1 year', days: 365 },
  { label: 'Forever (placeholder 2099)', days: 0 },
]

async function authedFetch(path, opts = {}) {
  const cognitoUser = getCurrentUser()
  if (!cognitoUser) throw new Error('Not signed in')
  const session = await getSession(cognitoUser)
  const token = getIdToken(session)
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
  return data
}

function statusPillStyle(status) {
  const colors = {
    active: { bg: 'rgba(80,200,120,0.15)', border: '#50c878', fg: '#7ee2a4' },
    expiring: { bg: 'rgba(255,180,80,0.15)', border: '#ffb450', fg: '#ffc97a' },
    expired: { bg: 'rgba(180,180,180,0.15)', border: '#888', fg: '#aaa' },
    canceled: { bg: 'rgba(220,90,90,0.12)', border: '#a85050', fg: '#d99' },
  }
  const c = colors[status] || colors.canceled
  return {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: '0.72rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: c.fg,
    background: c.bg,
    border: `1px solid ${c.border}`,
    borderRadius: 999,
  }
}

export default function CompManager() {
  const [comps, setComps] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  // Grant-form state
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState('champion')
  const [durationDays, setDurationDays] = useState(90) // default 3 months — Aaron's primary use case
  const [note, setNote] = useState('')
  const [granting, setGranting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await authedFetch('/admin/comps')
      setComps(data.comps || [])
    } catch (err) {
      setError(`Could not load comps: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function grant(e) {
    e.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail.includes('@')) {
      setError('Valid email required')
      return
    }
    const friendly = DURATIONS.find((d) => d.days === durationDays)?.label || `${durationDays}d`
    if (!window.confirm(`Grant ${plan} comp to ${cleanEmail} for ${friendly}?`)) return
    setGranting(true)
    setError(null)
    setNotice(null)
    try {
      const res = await authedFetch('/admin/comp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, plan, durationDays, note: note.trim() }),
      })
      setNotice(`Comped ${res.email} → ${res.plan} until ${res.current_period_end?.slice(0, 10)}.`)
      setEmail('')
      setNote('')
      await load()
    } catch (err) {
      setError(`Comp failed: ${err.message}`)
    } finally {
      setGranting(false)
    }
  }

  async function revoke(targetEmail) {
    if (!window.confirm(`Revoke comp for ${targetEmail}?\n\nThey'll lose access immediately. Use this when converting to a paying customer or ending a trial early.`)) return
    setError(null)
    setNotice(null)
    try {
      await authedFetch('/admin/uncomp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      })
      setNotice(`Revoked comp for ${targetEmail}.`)
      await load()
    } catch (err) {
      setError(`Revoke failed: ${err.message}`)
    }
  }

  const active = comps.filter((c) => c.status === 'active' || c.status === 'expiring')
  const expired = comps.filter((c) => c.status === 'expired')
  const revoked = comps.filter((c) => c.raw_status === 'canceled')

  return (
    <section className="admin-section">
      <div className="admin-section-header">
        <h2>Comp Accounts</h2>
        <p className="admin-section-sub">
          Free Pro / Champion access for influencers, Discord giveaways, refunds, beta testers.
          Excluded from MRR. Auto-expires when the period ends — no cron needed.
        </p>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {notice && <div className="admin-notice">{notice}</div>}

      <form onSubmit={grant} className="comp-grant-form" style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '2fr 1fr 1fr 2fr auto', alignItems: 'end', marginBottom: '1.5rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem' }}>
          <span style={{ color: 'rgba(230,233,239,0.65)' }}>Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="player@gmail.com"
            className="admin-input"
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem' }}>
          <span style={{ color: 'rgba(230,233,239,0.65)' }}>Plan</span>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className="admin-input">
            <option value="champion">Champion</option>
            <option value="pro">Pro</option>
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem' }}>
          <span style={{ color: 'rgba(230,233,239,0.65)' }}>Duration</span>
          <select value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} className="admin-input">
            {DURATIONS.map((d) => (
              <option key={d.days} value={d.days}>{d.label}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem' }}>
          <span style={{ color: 'rgba(230,233,239,0.65)' }}>Note (audit trail)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Discord giveaway #3"
            maxLength={200}
            className="admin-input"
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={granting}>
          {granting ? 'Granting…' : 'Grant Comp'}
        </button>
      </form>

      {loading ? (
        <p style={{ color: 'rgba(230,233,239,0.6)' }}>Loading comps…</p>
      ) : (
        <>
          <CompTable title={`Active (${active.length})`} comps={active} onRevoke={revoke} showDays />
          {expired.length > 0 && <CompTable title={`Expired — auto-revoked (${expired.length})`} comps={expired} onRevoke={revoke} dimmed />}
          {revoked.length > 0 && <CompTable title={`Revoked (${revoked.length})`} comps={revoked} onRevoke={null} dimmed />}
          {comps.length === 0 && <p style={{ color: 'rgba(230,233,239,0.55)', fontSize: '0.9rem' }}>No comps yet. Use the form above to grant your first one.</p>}
        </>
      )}
    </section>
  )
}

function CompTable({ title, comps, onRevoke, showDays = false, dimmed = false }) {
  if (!comps.length) return null
  return (
    <div style={{ marginBottom: '1.25rem', opacity: dimmed ? 0.7 : 1 }}>
      <h3 style={{ fontSize: '0.95rem', margin: '0 0 0.5rem', color: 'rgba(230,233,239,0.85)' }}>{title}</h3>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Plan</th>
              <th>Status</th>
              {showDays && <th>Days left</th>}
              <th>Expires</th>
              <th>Note</th>
              {onRevoke && <th></th>}
            </tr>
          </thead>
          <tbody>
            {comps.map((c) => (
              <tr key={c.stripe_customer_id}>
                <td className="admin-mono">{c.email}</td>
                <td style={{ textTransform: 'capitalize' }}>{c.plan}</td>
                <td><span style={statusPillStyle(c.status)}>{c.status}</span></td>
                {showDays && <td>{c.days_remaining != null ? `${c.days_remaining}d` : '—'}</td>}
                <td className="admin-mono" style={{ fontSize: '0.8rem' }}>
                  {c.current_period_end ? c.current_period_end.slice(0, 10) : '—'}
                </td>
                <td style={{ fontSize: '0.85rem', color: 'rgba(230,233,239,0.65)', maxWidth: 220 }}>
                  {c.comp_note || <span style={{ opacity: 0.4 }}>—</span>}
                </td>
                {onRevoke && (
                  <td>
                    <button onClick={() => onRevoke(c.email)} className="btn btn-sm btn-outline">
                      Revoke
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
