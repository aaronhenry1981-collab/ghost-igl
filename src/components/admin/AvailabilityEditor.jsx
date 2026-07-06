import { useState, useEffect, useCallback } from 'react'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../../lib/cognito'

// Coaching scheduler admin — edit availability windows, session length,
// buffers, and blackout dates without touching code, plus a view of upcoming
// bookings. Backend: recon6-booking Lambda (GET/PUT /admin/availability,
// GET /admin/bookings). Slots regenerate from this config on every public
// /booking/slots call, so edits are live immediately.

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

export default function AvailabilityEditor() {
  const [config, setConfig] = useState(null)
  const [bookings, setBookings] = useState([])
  const [status, setStatus] = useState('')
  const [blackoutInput, setBlackoutInput] = useState('')

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        authedFetch('/admin/availability'),
        authedFetch('/admin/bookings'),
      ])
      setConfig(a.config)
      setBookings(b.bookings || [])
    } catch (err) {
      setStatus(`Load failed: ${err.message}`)
    }
  }, [])
  // Mount-time fetch of admin config/bookings — same pattern as the other
  // admin panels; state lands after awaited API calls, not synchronously.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  async function save() {
    setStatus('Saving…')
    try {
      const r = await authedFetch('/admin/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      })
      setConfig(r.config)
      setStatus('Saved — live on /coaching/ immediately.')
    } catch (err) {
      setStatus(`Save failed: ${err.message}`)
    }
  }

  if (!config) {
    return (
      <section className="admin-section">
        <div className="admin-section-header"><h2>Coaching scheduler</h2></div>
        <p className="admin-footnote">{status || 'Loading availability…'}</p>
      </section>
    )
  }

  const setField = (k, v) => setConfig({ ...config, [k]: v })
  const setWindow = (i, k, v) => {
    const w = config.windows.map((x, j) => (j === i ? { ...x, [k]: v } : x))
    setField('windows', w)
  }

  return (
    <section className="admin-section">
      <div className="admin-section-header"><h2>Coaching scheduler</h2></div>
      <p className="admin-footnote">
        Weekly windows are in <strong>{config.timezone}</strong>. Customers see slots in their own timezone.
        Double-booking is impossible by design (conditional writes on the slot key).
      </p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
        <label>Session min<br />
          <input type="number" value={config.session_minutes} style={{ width: 80 }}
            onChange={(e) => setField('session_minutes', Number(e.target.value))} /></label>
        <label>Buffer min<br />
          <input type="number" value={config.buffer_minutes} style={{ width: 80 }}
            onChange={(e) => setField('buffer_minutes', Number(e.target.value))} /></label>
        <label>Horizon days<br />
          <input type="number" value={config.booking_horizon_days} style={{ width: 80 }}
            onChange={(e) => setField('booking_horizon_days', Number(e.target.value))} /></label>
        <label>Min notice hrs<br />
          <input type="number" value={config.min_notice_hours} style={{ width: 80 }}
            onChange={(e) => setField('min_notice_hours', Number(e.target.value))} /></label>
      </div>

      <h3 style={{ margin: '10px 0 6px' }}>Weekly windows</h3>
      {config.windows.map((w, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
          <select value={w.dow} onChange={(e) => setWindow(i, 'dow', Number(e.target.value))}>
            {DOW.map((d, di) => <option key={d} value={di}>{d}</option>)}
          </select>
          <input type="time" value={w.start} onChange={(e) => setWindow(i, 'start', e.target.value)} />
          <span>→</span>
          <input type="time" value={w.end} onChange={(e) => setWindow(i, 'end', e.target.value)} />
          <button type="button" onClick={() => setField('windows', config.windows.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button type="button" onClick={() => setField('windows', [...config.windows, { dow: 1, start: '18:00', end: '22:00' }])}>
        + Add window
      </button>

      <h3 style={{ margin: '14px 0 6px' }}>Blackout dates</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {config.blackouts.map((d) => (
          <span key={d} style={{ padding: '2px 10px', border: '1px solid #2a3550', borderRadius: 999 }}>
            {d} <button type="button" onClick={() => setField('blackouts', config.blackouts.filter((x) => x !== d))}>✕</button>
          </span>
        ))}
        <input type="date" value={blackoutInput} onChange={(e) => setBlackoutInput(e.target.value)} />
        <button type="button" onClick={() => { if (blackoutInput && !config.blackouts.includes(blackoutInput)) { setField('blackouts', [...config.blackouts, blackoutInput]); setBlackoutInput('') } }}>
          + Block
        </button>
      </div>

      <div style={{ marginTop: 14 }}>
        <button type="button" className="btn btn-primary" onClick={save}>Save availability</button>
        {status && <span style={{ marginLeft: 12, color: status.includes('fail') ? '#ff6b6b' : '#7ee2a4' }}>{status}</span>}
      </div>

      <h3 style={{ margin: '20px 0 6px' }}>Upcoming bookings ({bookings.length})</h3>
      {bookings.length === 0 ? (
        <p className="admin-footnote">None yet — the booking widget is live on /coaching/.</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Slot (UTC)</th><th>Type</th><th>Name</th><th>Email</th><th>Discord</th><th>Rank→Goal</th></tr></thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.slotId}>
                <td>{b.slotId}</td><td>{b.sessionType}</td><td>{b.customer?.name}</td>
                <td>{b.customer?.email}</td><td>{b.customer?.discord}</td><td>{b.customer?.rank_goal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
