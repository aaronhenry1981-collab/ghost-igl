import { useState } from 'react'
import { useTestimonials } from '../../hooks/useTestimonials'
import { Badge, Field, Notice, Panel, Skeleton, StateView } from '../../features/admin/ui'

const RANK_SUGGESTIONS = [
  'Copper → Bronze',
  'Bronze → Silver',
  'Silver → Gold',
  'Gold → Platinum',
  'Platinum → Emerald',
  'Emerald → Diamond',
  'Diamond → Champion',
]
const TIER_BADGE = { champion: ['accent', 'Champion'], elite: ['bone', 'Elite'], pro: ['info', 'Pro'] }
const EMPTY = { name: '', text: '', rank: '', hours: '', tier: '', featured: false }

function initialsFromName(name) {
  return String(name || '')
    .split(/\s+/)
    .map((part) => part[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function TestimonialBuilder() {
  const { list, loading, error: loadError, refresh, add, remove } = useTestimonials()
  const [form, setForm] = useState(EMPTY)
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setStatus(null)
    if (!form.name.trim() || !form.text.trim()) {
      setStatus({ tone: 'danger', text: 'Author name and quote are both required.' })
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
      setForm(EMPTY)
      setStatus({ tone: 'ok', text: 'Testimonial added. It is live on the landing page.' })
    } catch (err) {
      setStatus({ tone: 'danger', text: `Not added: ${err.message || 'request failed'}` })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(t) {
    if (!window.confirm(`Delete the testimonial from ${t.name}? It disappears from the landing page immediately.`)) return
    setStatus(null)
    try {
      await remove(t.id)
      setStatus({ tone: 'ok', text: 'Testimonial deleted.' })
    } catch (err) {
      setStatus({ tone: 'danger', text: `Delete failed: ${err.message || 'request failed'}` })
    }
  }

  return (
    <Panel
      title="Testimonials"
      description="Real customer quotes shown on the landing page. The section is hidden when there are none. Only publish what the customer actually said, with their permission."
      actions={<span className="ax-muted ax-num" style={{ fontSize: '0.78rem' }}>{loading ? 'Loading…' : `${list.length} live`}</span>}
      bodyClassName="is-flush"
    >
      <div style={{ padding: '16px 20px 20px', borderBottom: '1px solid var(--ax-border)' }}>
        {status && <Notice tone={status.tone} onDismiss={() => setStatus(null)}>{status.text}</Notice>}
        <form onSubmit={submit} className="ax-form-stack">
          <div className="ax-form-grid">
            <Field label="Author name">
              <input className="ax-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={60} placeholder="Name or gamer tag they approved" />
            </Field>
            <Field label="Rank progression (optional)">
              <input className="ax-input" value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} maxLength={40} placeholder="Gold → Platinum" list="ax-rank-suggestions" />
              <datalist id="ax-rank-suggestions">{RANK_SUGGESTIONS.map((r) => <option key={r} value={r} />)}</datalist>
            </Field>
            <Field label="Hours played (optional)">
              <input className="ax-input" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} maxLength={20} placeholder="1,200 hrs" />
            </Field>
            <Field label="Verified plan (optional)">
              <select className="ax-select" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>
                <option value="">No badge</option>
                <option value="pro">Pro subscriber</option>
                <option value="elite">Elite subscriber</option>
                <option value="champion">Champion subscriber</option>
              </select>
            </Field>
          </div>
          <Field label="Quote" hint={`${form.text.length}/500`}>
            <textarea className="ax-textarea" rows={3} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} maxLength={500} placeholder="One or two sentences reads best." />
          </Field>
          <div className="ax-btn-row">
            <label className="ax-check"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Feature (pin to top)</label>
            <span style={{ flex: 1 }} />
            <button type="button" className="ax-btn ax-btn--sm ax-btn--ghost" onClick={() => { setForm(EMPTY); setStatus(null) }}>Clear</button>
            <button type="submit" className="ax-btn ax-btn--sm ax-btn--primary" disabled={submitting}>{submitting ? 'Adding…' : 'Add testimonial'}</button>
          </div>
        </form>
      </div>

      {loading && list.length === 0 ? <Skeleton rows={3} />
        : loadError && list.length === 0 ? <StateView kind="error" title="Testimonials could not be loaded" onRetry={refresh}>{loadError}</StateView>
          : list.length === 0 ? <StateView kind="empty" title="No testimonials">The landing page hides the section until one is added.</StateView>
            : (
              <ul className="ax-quote-list">
                {list.map((t) => (
                  <li key={t.id} className="ax-quote">
                    <span className="ax-avatar" aria-hidden="true">{initialsFromName(t.name)}</span>
                    <div style={{ minWidth: 0 }}>
                      <div className="ax-quote__head">
                        <span className="ax-strong">{t.name}</span>
                        {t.featured && <Badge tone="accent">Featured</Badge>}
                        {TIER_BADGE[t.tier] && <Badge tone={TIER_BADGE[t.tier][0]}>{TIER_BADGE[t.tier][1]}</Badge>}
                        {t.rank && <Badge tone="muted">{t.rank}</Badge>}
                        {t.hours && <span className="ax-muted" style={{ fontSize: '0.75rem' }}>{t.hours}</span>}
                      </div>
                      <p className="ax-quote__text">“{t.text}”</p>
                    </div>
                    <div><button type="button" className="ax-btn ax-btn--sm ax-btn--danger" onClick={() => handleRemove(t)}>Delete</button></div>
                  </li>
                ))}
              </ul>
            )}
    </Panel>
  )
}
