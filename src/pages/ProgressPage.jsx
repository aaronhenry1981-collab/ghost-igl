import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'
import { useAuth } from '../hooks/useAuth'

// R6 Tracker (TRN) auto-connect: derived from the profile the user already
// has (display_name = in-game name, platform). Set once here, saved to the
// account, and the card deep-links to their live tracker profile. Full
// stat IMPORT (rank/RP pulled onto this page) needs a tracker.gg API key —
// the proxy endpoint gets built the day we have one.
const TRN_PLATFORM = { ps5: 'psn', psn: 'psn', xbox: 'xbl', xbl: 'xbl', pc: 'ubi', ubi: 'ubi' }
function trnUrl(platform, ign) {
  const slug = TRN_PLATFORM[(platform || '').toLowerCase()]
  if (!slug || !ign) return null
  return `https://r6.tracker.network/r6siege/profile/${slug}/${encodeURIComponent(ign)}/overview`
}

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
  const { user, loading: authLoading, profile: account, refreshProfile } = useAuth()
  const [profile, setProfile] = useState(null)
  const [sessions, setSessions] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [trnIgn, setTrnIgn] = useState('')
  const [trnPlatform, setTrnPlatform] = useState('ps5')
  const [trnSaving, setTrnSaving] = useState(false)

  async function saveTrn() {
    if (!trnIgn.trim()) return
    setTrnSaving(true)
    try {
      const cognitoUser = getCurrentUser()
      const session = await getSession(cognitoUser)
      const token = getIdToken(session)
      const res = await fetch(`${API_URL}/me`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: trnIgn.trim(), platform: trnPlatform }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await refreshProfile?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setTrnSaving(false)
    }
  }

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

      {/* R6 Tracker connect — one card, set once, lives on the account. */}
      <div style={{ ...card, margin: '18px 0', maxWidth: 640 }}>
        <h3 style={{ marginBottom: 6 }}>R6 Tracker</h3>
        {trnUrl(account?.platform, account?.display_name) ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: 'rgba(230,233,239,0.75)' }}>
              Connected: <strong>{account.display_name}</strong> ({account.platform?.toUpperCase()})
            </span>
            <a
              href={trnUrl(account.platform, account.display_name)}
              target="_blank" rel="noopener noreferrer"
              className="btn btn-outline"
            >
              Open live rank &amp; stats →
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.85rem', color: 'rgba(230,233,239,0.65)' }}>In-game name<br />
              <input value={trnIgn} onChange={(e) => setTrnIgn(e.target.value)} placeholder="Splinter2581"
                style={{ padding: '8px 10px', background: '#0d1320', color: 'inherit', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8 }} />
            </label>
            <label style={{ fontSize: '0.85rem', color: 'rgba(230,233,239,0.65)' }}>Platform<br />
              <select value={trnPlatform} onChange={(e) => setTrnPlatform(e.target.value)}
                style={{ padding: '9px 10px', background: '#0d1320', color: 'inherit', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8 }}>
                <option value="ps5">PlayStation</option>
                <option value="xbox">Xbox</option>
                <option value="pc">PC</option>
              </select>
            </label>
            <button type="button" className="btn btn-primary" onClick={saveTrn} disabled={trnSaving}>
              {trnSaving ? 'Saving…' : 'Connect tracker'}
            </button>
          </div>
        )}
      </div>

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
