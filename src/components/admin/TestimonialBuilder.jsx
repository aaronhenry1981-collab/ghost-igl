import { useState } from 'react'
import { useTestimonials } from '../../hooks/useTestimonials'

const RANK_SUGGESTIONS = [
  'Copper → Bronze',
  'Bronze → Silver',
  'Silver → Gold',
  'Gold → Platinum',
  'Platinum → Emerald',
  'Emerald → Diamond',
  'Diamond → Champion',
]

function initialsFromName(name) {
  return String(name || '')
    .split(/\s+/)
    .map((part) => part[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function EmptyRow({ children }) {
  return <div className="testi-empty">{children}</div>
}

export default function TestimonialBuilder() {
  const { list, loading, add, remove } = useTestimonials()
  const [form, setForm] = useState({
    name: '',
    text: '',
    rank: '',
    hours: '',
    tier: '',
    featured: false,
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setForm({ name: '', text: '', rank: '', hours: '', tier: '', featured: false })
    setError(null)
  }

  async function submit(e) {
    e.preventDefault()
    setError(null)
    if (!form.name.trim() || !form.text.trim()) {
      setError('Name and quote are both required.')
      return
    }
    if (form.text.length > 500) {
      setError('Keep the quote under 500 characters.')
      return
    }
    setSubmitting(true)
    try {
      await add({
        name: form.name.trim(),
        text: form.text.trim(),
        rank: form.rank.trim() || undefined,
        hours: form.hours.trim() || undefined,
        tier: form.tier || undefined,
        featured: form.featured,
      })
      reset()
    } catch (err) {
      setError(err.message || 'Failed to add testimonial')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(id) {
    if (!window.confirm('Delete this testimonial? It will disappear from the landing page immediately.')) return
    try { await remove(id) }
    catch (err) { setError(err.message || 'Failed to delete') }
  }

  return (
    <section className="admin-section admin-testimonials">
      <div className="admin-section-header">
        <h2>Testimonials</h2>
        <div className="admin-actions">
          <span className="admin-footnote" style={{ margin: 0 }}>
            {loading ? 'Loading…' : `${list.length} total · live on landing page now`}
          </span>
        </div>
      </div>

      <form onSubmit={submit} className="testi-form">
        <div className="testi-form-row">
          <label className="testi-field">
            <span>Author name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Splinter, SarahR6, etc."
              maxLength={60}
              className="testi-input"
            />
          </label>
          <label className="testi-field">
            <span>Rank progression (optional)</span>
            <input
              type="text"
              value={form.rank}
              onChange={(e) => setForm({ ...form, rank: e.target.value })}
              placeholder="e.g. Gold → Platinum"
              maxLength={40}
              className="testi-input"
              list="rank-suggestions"
            />
            <datalist id="rank-suggestions">
              {RANK_SUGGESTIONS.map((r) => <option key={r} value={r} />)}
            </datalist>
          </label>
          <label className="testi-field testi-field-narrow">
            <span>Hours (optional)</span>
            <input
              type="text"
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
              placeholder="1,200 hrs"
              maxLength={20}
              className="testi-input"
            />
          </label>
        </div>
        <label className="testi-field">
          <span>Quote <span className="testi-char-count">{form.text.length}/500</span></span>
          <textarea
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            placeholder="What did they say? Keep it punchy — one or two sentences reads best on the landing page."
            maxLength={500}
            rows={3}
            className="testi-input"
          />
        </label>
        <div className="testi-form-row">
          <label className="testi-field testi-field-narrow">
            <span>Verified tier (optional)</span>
            <select
              value={form.tier}
              onChange={(e) => setForm({ ...form, tier: e.target.value })}
              className="testi-input"
            >
              <option value="">No badge</option>
              <option value="pro">Pro subscriber</option>
              <option value="champion">Champion subscriber</option>
            </select>
          </label>
          <label className="testi-field testi-field-narrow" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            <span style={{ fontSize: '0.9rem' }}>Featured (pin to top)</span>
          </label>
        </div>
        {error && <div className="admin-note admin-note-error">{error}</div>}
        <div className="testi-form-actions">
          <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
            {submitting ? 'Posting…' : 'Add testimonial'}
          </button>
          <button type="button" onClick={reset} className="btn btn-sm btn-outline">Clear</button>
        </div>
      </form>

      <div className="testi-list">
        {list.length === 0 ? (
          <EmptyRow>
            No testimonials yet. The landing page shows the "Players are ranking up" section only
            when at least one testimonial is visible.
          </EmptyRow>
        ) : (
          list.map((t) => (
            <div key={t.id} className="testi-row">
              <div className="testi-row-avatar">{initialsFromName(t.name)}</div>
              <div className="testi-row-body">
                <div className="testi-row-head">
                  <strong>{t.name}</strong>
                  {t.featured && <span className="testi-row-rank" style={{ background: 'rgba(255,155,92,0.2)', color: '#ff9b5c' }}>★ Featured</span>}
                  {t.tier === 'champion' && <span className="testi-row-rank" style={{ background: 'rgba(0,229,255,0.18)', color: '#00e5ff' }}>Champion</span>}
                  {t.tier === 'pro' && <span className="testi-row-rank" style={{ background: 'rgba(120,180,255,0.18)', color: '#7eb4ff' }}>Pro</span>}
                  {t.rank && <span className="testi-row-rank">{t.rank}</span>}
                  {t.hours && <span className="testi-row-hours">{t.hours}</span>}
                </div>
                <p className="testi-row-quote">&ldquo;{t.text}&rdquo;</p>
              </div>
              <div className="testi-row-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => handleRemove(t.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
