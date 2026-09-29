import { useCallback, useEffect, useState } from 'react'
import { adminFetch, adminSend } from '../../features/admin/adminFetch'
import { Badge, Field, Notice, Panel, Skeleton, StateView } from '../../features/admin/ui'

// Site announcements: a dismissible banner on every public page (maintenance
// windows, launches, outage updates). Backend: announcements Lambda,
// GET/POST /admin/announcements, DELETE /admin/announcements/{id}.
const LEVELS = [
  { id: 'info', label: 'Info', tone: 'info' },
  { id: 'update', label: 'Product update', tone: 'ok' },
  { id: 'maintenance', label: 'Maintenance', tone: 'warning' },
  { id: 'warning', label: 'Warning / outage', tone: 'danger' },
]
const EMPTY = { title: '', message: '', level: 'info', expires_at: '' }

export default function AnnouncementsManager() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [posting, setPosting] = useState(false)
  const [status, setStatus] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminFetch('/admin/announcements')
      setItems(data.announcements || [])
      setLoadError(null)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  async function post(e) {
    e.preventDefault()
    setPosting(true)
    setStatus(null)
    try {
      await adminSend('/admin/announcements', 'POST', {
        title: form.title,
        message: form.message,
        level: form.level,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      })
      setForm(EMPTY)
      setStatus({ tone: 'ok', text: 'Announcement posted. It shows on every public page now.' })
      await load()
    } catch (err) {
      setStatus({ tone: 'danger', text: `Not posted: ${err.message}` })
    } finally {
      setPosting(false)
    }
  }

  async function remove(a) {
    if (!window.confirm(`Delete the announcement “${a.title}”? It disappears from the site immediately.`)) return
    setStatus(null)
    try {
      await adminFetch(`/admin/announcements/${encodeURIComponent(a.id)}`, { method: 'DELETE' })
      setStatus({ tone: 'ok', text: 'Announcement deleted.' })
      await load()
    } catch (err) {
      setStatus({ tone: 'danger', text: `Delete failed: ${err.message}` })
    }
  }

  const levelOf = (id) => LEVELS.find((l) => l.id === id) || LEVELS[0]

  return (
    <Panel title="Site announcements" description="A dismissible banner at the top of every public page. Use it for maintenance windows, launches and outage updates.">
      {status && <Notice tone={status.tone} onDismiss={() => setStatus(null)}>{status.text}</Notice>}
      <form onSubmit={post} className="ax-form-stack" style={{ marginBottom: 20 }}>
        <Field label="Title">
          <input className="ax-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} required placeholder="Scheduled maintenance tonight" />
        </Field>
        <Field label="Message" hint={`${form.message.length}/2000`}>
          <textarea className="ax-textarea" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={2000} required placeholder="What is happening, when, and what players should expect." />
        </Field>
        <div className="ax-form-grid">
          <Field label="Type">
            <select className="ax-select" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </Field>
          <Field label="Expires (optional)">
            <input className="ax-input" type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
          </Field>
          <div><button type="submit" className="ax-btn ax-btn--primary" disabled={posting}>{posting ? 'Posting…' : 'Post announcement'}</button></div>
        </div>
      </form>

      <p className="ax-subhead">Live announcements</p>
      {loading && items.length === 0 ? <Skeleton rows={2} />
        : loadError ? <StateView kind="error" compact title="Announcements could not be loaded" onRetry={load}>{loadError}</StateView>
          : items.length === 0 ? <p className="ax-help">No announcements are showing.</p>
            : (
              <ul className="ax-list" style={{ border: '1px solid var(--ax-border)', borderRadius: 6 }}>
                {items.map((a) => (
                  <li key={a.id} className="ax-list__item" style={{ alignItems: 'flex-start' }}>
                    <div className="ax-list__main">
                      <div className="ax-badges"><Badge tone={levelOf(a.level).tone}>{levelOf(a.level).label}</Badge><span className="ax-list__title">{a.title}</span></div>
                      <p className="ax-help" style={{ marginTop: 6, color: 'var(--ax-text)' }}>{a.message}</p>
                      <p className="ax-list__meta" style={{ marginTop: 4 }}>
                        Posted {a.created_at ? new Date(a.created_at).toLocaleString() : '—'}{a.expires_at ? ` · Expires ${new Date(a.expires_at).toLocaleString()}` : ' · No expiry'}
                      </p>
                    </div>
                    <button type="button" className="ax-btn ax-btn--sm ax-btn--danger" onClick={() => remove(a)}>Delete</button>
                  </li>
                ))}
              </ul>
            )}
    </Panel>
  )
}
