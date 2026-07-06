import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'
import { useAuth } from '../hooks/useAuth'

// /progress — the customer's coaching report card (sync spine Part A surface).
// Reads the aggregates from recon6-coaching-sync. Data arrives from the
// desktop coach's shadow-mode logger (Part B, igl-coach-ps5 repo) — until a
// user has coached sessions, this shows an honest empty state, not fake stats.

async function authedFetch(path) {
  const cognitoUser = getCurrentUser()
  if (!cognitoUser) throw new Error('Not signed in')
  const session = await getSession(cognitoUser)
  const token = getIdToken(session)
  const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
  return data
}

const card = {
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12, padding: '1.2rem 1.4rem', minWidth: 160,
}

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState(null)
  const [sessions, setSessions] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !user) return
    let cancelled = false
    Promise.all([authedFetch('/me/coaching-profile'), authedFetch('/me/coaching-history')])
      .then(([p, h]) => { if (!cancelled) { setProfile(p); setSessions(h.sessions || []) } })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [authLoading, user])

  if (!authLoading && !user) {
    return (
      <div className="section" style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1rem' }}>
        <h1>Your coaching progress</h1>
        <p style={{ color: 'rgba(230,233,239,0.7)' }}>
          Sign in to see your session history, death-cause trends, and climb progress.
        </p>
        <Link to="/auth?redirect=/progress" className="btn btn-primary" style={{ marginTop: 12 }}>Sign in</Link>
      </div>
    )
  }

  const top = (obj, n = 5) => Object.entries(obj || {}).sort((a, b) => b[1] - a[1]).slice(0, n)

  return (
    <div className="section" style={{ maxWidth: 960, margin: '0 auto', padding: '2.5rem 1rem' }}>
      <h1>Your coaching progress</h1>
      <p style={{ color: 'rgba(230,233,239,0.7)', maxWidth: 640 }}>
        Every coached session syncs here: what killed you, where, and how the plan is trending.
      </p>

      {loading && <p style={{ color: 'rgba(230,233,239,0.6)' }}>Loading your data…</p>}
      {error && <p style={{ color: '#ff6b6b' }}>Could not load progress: {error}</p>}

      {!loading && !error && (!profile || profile.totals.sessions === 0) && (
        <div style={{ ...card, marginTop: 20, maxWidth: 640 }}>
          <h3 style={{ marginBottom: 8 }}>No coached sessions yet</h3>
          <p style={{ color: 'rgba(230,233,239,0.7)', marginBottom: 12 }}>
            Sessions land here automatically after you play with the coach. The fastest way to start:
          </p>
          <a href="/coaching/" className="btn btn-primary">Book your free intro session</a>
        </div>
      )}

      {!loading && profile && profile.totals.sessions > 0 && (
        <>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', margin: '20px 0' }}>
            <div style={card}><strong style={{ fontSize: '1.6rem', color: '#00e5ff' }}>{profile.totals.sessions}</strong><div>Sessions</div></div>
            <div style={card}><strong style={{ fontSize: '1.6rem', color: '#00e5ff' }}>{profile.totals.events}</strong><div>Coached moments</div></div>
            <div style={card}><strong style={{ fontSize: '1.6rem', color: '#00e5ff' }}>{profile.totals.deaths}</strong><div>Deaths analyzed</div></div>
            {profile.aiShadow?.pairs > 0 && (
              <div style={card}>
                <strong style={{ fontSize: '1.6rem', color: '#00e5ff' }}>
                  {Math.round(100 * profile.aiShadow.agreements / profile.aiShadow.pairs)}%
                </strong>
                <div>AI–coach agreement</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ ...card, flex: '1 1 280px' }}>
              <h3>Deaths by map</h3>
              {top(profile.deathsByMap).map(([k, v]) => <div key={k}>{k}: <strong>{v}</strong></div>)}
            </div>
            <div style={{ ...card, flex: '1 1 280px' }}>
              <h3>Deaths by operator</h3>
              {top(profile.deathsByOperator).map(([k, v]) => <div key={k}>{k}: <strong>{v}</strong></div>)}
            </div>
          </div>

          <h3 style={{ margin: '24px 0 8px' }}>Sessions</h3>
          <table className="admin-table" style={{ width: '100%' }}>
            <thead><tr><th>Date</th><th>Maps</th><th>Moments</th><th>Deaths</th><th>Rounds W–L</th></tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.sessionId}>
                  <td>{(s.firstTs || '').slice(0, 10)}</td>
                  <td>{(s.maps || []).join(', ')}</td>
                  <td>{s.events}</td>
                  <td>{s.deaths}</td>
                  <td>{s.roundsWon}–{s.roundsLost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
