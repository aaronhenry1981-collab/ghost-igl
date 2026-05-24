import { useState, useEffect, useCallback } from 'react'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../../lib/cognito'

// Admin audit log — shows the last 100 admin actions (comp grants, revokes,
// user deletions) with actor, timestamp, target, and details. Backed by
// /admin/audit endpoint reading from the ghost-igl-audit-log DDB table.
//
// Logged actions today: comp.grant, comp.revoke, user.delete. Future actions
// can be logged by adding `await audit(actorEmail, 'verb.noun', target, details)`
// to any handler in the admin Lambda.

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

const ACTION_COLORS = {
  'comp.grant':  { bg: 'rgba(80,200,120,0.12)',  fg: '#7ee2a4', border: '#50c878' },
  'comp.revoke': { bg: 'rgba(220,90,90,0.12)',   fg: '#d99',    border: '#a85050' },
  'user.delete': { bg: 'rgba(255,90,90,0.15)',   fg: '#ff8a8a', border: '#ff5a5a' },
}

function actionStyle(action) {
  const c = ACTION_COLORS[action] || { bg: 'rgba(180,180,180,0.12)', fg: '#aaa', border: '#888' }
  return {
    display: 'inline-block', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.04em',
    color: c.fg, background: c.bg, border: `1px solid ${c.border}`,
    borderRadius: 999,
  }
}

function formatTimeAgo(iso) {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function AuditLog() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [collapsed, setCollapsed] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await authedFetch('/admin/audit')
      setEvents(data.events || [])
    } catch (err) {
      setError(err.message || 'Failed to load audit log')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!collapsed) refresh()
  }, [collapsed, refresh])

  return (
    <section className="admin-section">
      <div className="admin-section-header">
        <h2>Admin Audit Log</h2>
        <div className="admin-actions">
          <button onClick={() => setCollapsed(c => !c)} className="btn btn-sm btn-outline">
            {collapsed ? 'Show log' : 'Hide log'}
          </button>
          {!collapsed && (
            <button onClick={refresh} className="btn btn-sm btn-outline" disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <>
          {error && <div className="admin-error">{error}</div>}
          {loading && events.length === 0 ? (
            <p style={{ color: 'rgba(230,233,239,0.6)' }}>Loading audit events…</p>
          ) : events.length === 0 ? (
            <p style={{ color: 'rgba(230,233,239,0.55)', fontSize: '0.9rem' }}>
              No admin actions logged yet. Comp grants, comp revokes, and user deletions will show up here.
            </p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Target</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id}>
                      <td className="admin-mono" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {formatTimeAgo(e.timestamp)}
                      </td>
                      <td><span style={actionStyle(e.action)}>{e.action}</span></td>
                      <td className="admin-mono" style={{ fontSize: '0.85rem' }}>{e.actor || '—'}</td>
                      <td className="admin-mono" style={{ fontSize: '0.85rem' }}>{e.target || '—'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'rgba(230,233,239,0.65)', maxWidth: 380 }}>
                        {e.details ? (
                          <code style={{ fontSize: '0.75rem' }}>
                            {Object.entries(e.details).map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' · ')}
                          </code>
                        ) : <span style={{ opacity: 0.4 }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="admin-footnote" style={{ marginTop: '0.5rem' }}>
                Showing the last {events.length} admin actions. Full history persists in DynamoDB (PITR enabled).
              </p>
            </div>
          )}
        </>
      )}
    </section>
  )
}
