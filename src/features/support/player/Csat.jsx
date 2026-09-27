import { useId, useState } from 'react'
import { CSAT_COMMENT_MAX, csatLabel, normalizeCsat } from '../supportLogic.mjs'
import { errorMessage } from '../supportApi'

// "Did we get this handled?" Asked once, after resolution. Thumbs first;
// a 1-5 scale for players who want to be precise. Comment optional.
export default function Csat({ api, caseNumber, existing, onDone }) {
  const [mode, setMode] = useState('thumbs')
  const [rating, setRating] = useState(null)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(null)
  const ids = { q: useId(), comment: useId() }
  const done = existing?.rating || sent?.rating

  if (done) {
    return (
      <section className="sp-csat is-done" aria-labelledby={ids.q}>
        <h2 id={ids.q} className="sp-csat-q">Did we get this handled?</h2>
        <p className="sp-muted" role="status">You said: <strong>{csatLabel(done)}</strong>. Logged, thanks.</p>
      </section>
    )
  }

  async function send() {
    const parsed = normalizeCsat({ rating, comment })
    if (!parsed.ok) { setError(parsed.error); return }
    setBusy(true)
    setError(null)
    try {
      await api.submitCsat(caseNumber, parsed.value)
      setSent(parsed.value)
      onDone?.()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="sp-csat" aria-labelledby={ids.q}>
      <h2 id={ids.q} className="sp-csat-q">Did we get this handled?</h2>
      {mode === 'thumbs' ? (
        <fieldset className="sp-csat-thumbs">
          <legend className="sp-visually-hidden">Did we get this handled?</legend>
          <label className={`sp-thumb${rating === 'up' ? ' is-on' : ''}`}>
            <input type="radio" className="sp-visually-hidden" name={`${ids.q}-r`} checked={rating === 'up'} onChange={() => setRating('up')} />
            <span aria-hidden="true">👍</span> Yes
          </label>
          <label className={`sp-thumb sp-thumb-down${rating === 'down' ? ' is-on' : ''}`}>
            <input type="radio" className="sp-visually-hidden" name={`${ids.q}-r`} checked={rating === 'down'} onChange={() => setRating('down')} />
            <span aria-hidden="true">👎</span> Not really
          </label>
        </fieldset>
      ) : (
        <fieldset className="sp-csat-scale">
          <legend className="sp-visually-hidden">Rate 1 to 5</legend>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={`sp-scale${rating === n ? ' is-on' : ''}`}>
              <input type="radio" className="sp-visually-hidden" name={`${ids.q}-s`} checked={rating === n} onChange={() => setRating(n)} aria-label={`${n} out of 5`} />
              <span aria-hidden="true">{n}</span>
            </label>
          ))}
        </fieldset>
      )}
      <button type="button" className="sp-linkbtn sp-small" onClick={() => { setMode((m) => (m === 'thumbs' ? 'scale' : 'thumbs')); setRating(null) }}>
        {mode === 'thumbs' ? 'Rate 1–5 instead' : 'Use thumbs instead'}
      </button>
      {rating !== null && (
        <div className="sp-csat-more">
          <label htmlFor={ids.comment} className="sp-small">Anything we should know? <span className="sp-muted">(optional)</span></label>
          <input id={ids.comment} className="sp-input" value={comment} maxLength={CSAT_COMMENT_MAX} onChange={(e) => setComment(e.target.value)} placeholder={rating === 'down' || rating <= 2 ? "What's still off?" : 'Short and sweet works'} />
          <button type="button" className="btn btn-primary btn-sm" onClick={send} disabled={busy}>{busy ? 'Sending…' : 'Send'}</button>
        </div>
      )}
      {error && <p className="sp-field-error" role="alert">{error}</p>}
    </section>
  )
}
