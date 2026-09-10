import { useCallback, useEffect, useState } from 'react'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../../lib/cognito'

const CATEGORY_LABELS = {
  'game-plan': 'Game plan',
  'live-coach': 'Live Coach',
  'round-review': 'Round Review',
  billing: 'Billing',
  account: 'Account',
  other: 'Other',
}

export default function FeedbackQueue() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const cognitoUser = getCurrentUser()
      if (!cognitoUser) throw new Error('Not authenticated')
      const session = await getSession(cognitoUser)
      const token = getIdToken(session)
      const res = await fetch(`${API_URL}/admin/feedback`, { headers: { Authorization: `Bearer ${token}` } })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
      setItems(body.feedback || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <section className="admin-section">
      <div className="admin-section-header">
        <div><span className="admin-eyebrow">Voice of the player</span><h2>Feedback queue</h2></div>
        <button type="button" className="btn btn-sm btn-outline" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
      </div>
      {error && <div className="admin-note admin-note-error">Feedback could not load: {error}</div>}
      {!loading && !error && items.length === 0 && <div className="admin-empty"><p>No player feedback yet.</p></div>}
      {items.length > 0 && (
        <div className="admin-announce-list">
          {items.map((item) => (
            <article key={item.feedbackId} className="admin-announce-item">
              <div>
                <div className="admin-announce-title">
                  <span className="admin-badge admin-badge-info">{CATEGORY_LABELS[item.category] || item.category}</span>
                  {item.rating ? `${item.rating}/5` : 'No rating'}
                </div>
                <div className="admin-announce-meta">{item.email} · {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</div>
                <div className="admin-announce-message">{item.message}</div>
                {item.page && <small className="admin-muted">Page: {item.page}</small>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
