import { useEffect, useState } from 'react'
import { authedFetch } from '../../hooks/useTestimonials'
import { testimonialReviewPresentation } from './testimonialReviewPresentation.mjs'

export default function TestimonialReviewQueue() {
  const [items, setItems] = useState([]), [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)
  async function refresh(cursor = '') {
    try {
      const data = await authedFetch('/admin/testimonials' + (cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''))
      setItems(data.testimonials || [])
      setNextCursor(data.nextCursor || null)
    } catch (error) { setMessage(error.message) }
  }
  useEffect(() => { refresh() }, [])
  async function review(item, action) {
    const presentation = testimonialReviewPresentation(item)
    if (action === 'delete') {
      if (!window.confirm(`Permanently delete the submission from ${item.name}?`)) return
      setBusy(true)
      try { await authedFetch(`/admin/testimonials/${encodeURIComponent(item.id)}`, { method: 'DELETE' }); await refresh(); setMessage('Submission deleted.') }
      catch (error) { setMessage(error.message) }
      finally { setBusy(false) }
      return
    }
    if (['approve', 'publish'].includes(action) && presentation.publishDisabled) return
    if (!window.confirm(['approve', 'publish'].includes(action) ? presentation.publishPrompt : `Reject the submission from ${item.name}?`)) return
    setBusy(true); setMessage('')
    try {
      await authedFetch('/admin/testimonials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, action }) })
      setMessage(['approve', 'publish'].includes(action) ? presentation.publishSuccess : 'Rejected; email and photo removed.')
      await refresh()
    } catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }
  return <section style={{ padding: 20, borderBottom: '1px solid var(--ax-border)' }} aria-labelledby="testimonial-review-title">
    <h3 id="testimonial-review-title">Customer submission review and history</h3>
    <p>Share <a href="/testimonial" target="_blank" rel="noopener noreferrer">the customer form</a> only after its API release is verified. Confirm the story is authentic and the selected name/photo are appropriate before publishing. Do not turn private feedback into an endorsement.</p>
    <button type="button" className="ax-btn" onClick={() => refresh()} disabled={busy}>Refresh submissions</button>
    {message && <p role="status">{message}</p>}
    {!items.length && <p>No customer submissions on this page. Use Next page if available.</p>}
    {items.map(item => {
      const presentation = testimonialReviewPresentation(item)
      return <article key={item.id} style={{ padding: '20px 0', borderTop: '1px solid var(--ax-border)' }}>
      <strong>{item.name}</strong> <span>({item.display_preference || 'Admin entry'}; {item.status || 'Manual quote'})</span>
      <blockquote>{item.text}</blockquote>
      {item.outcome && <p>Private outcome context: {item.outcome}</p>}
      <p>{item.rank || 'No rank context'} · {item.hours || 'No play time supplied'}</p>
      <p>Quote permission: {presentation.quotePermission}. Photo permission: {presentation.photoPermission}. Recorded {presentation.recorded}.</p>
      {presentation.legacyNotice && <p>{presentation.legacyNotice}</p>}
      {item.email && <p>Private contact: {item.email}</p>}
      {item.photo && <img src={item.photo} alt={`Submitted photo for ${item.name}`} width="96" height="96" style={{ objectFit: 'cover' }} />}
      <div style={{ display: 'flex', gap: 12 }}><button type="button" className="ax-btn ax-btn--primary" disabled={busy || presentation.publishDisabled} onClick={() => review(item, presentation.publishAction)}>Publish / retry publication</button><button type="button" className="ax-btn" disabled={busy || item.status !== 'pending'} onClick={() => review(item, 'reject')}>Reject</button><button type="button" className="ax-btn" disabled={busy} onClick={() => review(item, 'delete')}>Delete permanently</button></div>
    </article>})}
    {nextCursor && <button type="button" className="ax-btn" disabled={busy} onClick={() => refresh(nextCursor)}>Next page</button>}
  </section>
}
