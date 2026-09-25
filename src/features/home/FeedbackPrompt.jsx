import { useEffect, useId, useState } from 'react'

function ScaleQuestion({ q, value, onChange }) {
  const name = useId()
  const values = Array.from({ length: q.max - q.min + 1 }, (_, i) => q.min + i)
  return (
    <fieldset className="ph-fb-q">
      <legend>{q.label}</legend>
      <div className={`ph-scale ph-scale-${values.length}`}>
        {values.map((v) => (
          <label key={v} className={`ph-scale-opt${value === v ? ' is-on' : ''}`}>
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} />
            <span>{v}</span>
          </label>
        ))}
      </div>
      <div className="ph-scale-ends" aria-hidden="true"><span>{q.low}</span><span>{q.high}</span></div>
    </fieldset>
  )
}

function ChoiceQuestion({ q, value, onChange, multi = false }) {
  const name = useId()
  const selected = multi ? value || [] : value
  return (
    <fieldset className="ph-fb-q">
      <legend>{q.label}{multi && <span className="ph-source"> (pick any)</span>}</legend>
      <div className="ph-chips">
        {q.options.map(([v, label]) => {
          const on = multi ? selected.includes(v) : selected === v
          return (
            <label key={v} className={`ph-chip${on ? ' is-on' : ''}`}>
              <input
                type={multi ? 'checkbox' : 'radio'}
                name={name}
                value={v}
                checked={on}
                onChange={() => onChange(multi ? (on ? selected.filter((x) => x !== v) : [...selected, v]) : v)}
              />
              <span>{label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

function TextQuestion({ q, value, onChange }) {
  const id = useId()
  return (
    <div className="ph-fb-q">
      <label htmlFor={id} className="ph-fb-label">{q.label}{q.optional && <span className="ph-source"> (optional)</span>}</label>
      <textarea id={id} rows={2} maxLength={q.max || 500} value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function ReviewQuestion({ value, onChange }) {
  const quoteId = useId()
  const nameId = useId()
  const v = value || { mayRequest: false, mayPublishQuote: false, quote: '', displayName: '' }
  const set = (patch) => onChange({ ...v, ...patch })
  return (
    <fieldset className="ph-fb-q">
      <legend>Can we share your experience? <span className="ph-source">(optional)</span></legend>
      <label className="ph-toggle">
        <input type="checkbox" checked={v.mayRequest} onChange={(e) => set({ mayRequest: e.target.checked })} />
        <span>You may ask me for a short review later</span>
      </label>
      <label className="ph-toggle">
        <input type="checkbox" checked={v.mayPublishQuote} onChange={(e) => set({ mayPublishQuote: e.target.checked })} />
        <span>You may publish the quote below on r6coaching.com</span>
      </label>
      {v.mayPublishQuote && (
        <>
          <label htmlFor={quoteId} className="ph-fb-label">Your quote</label>
          <textarea id={quoteId} rows={2} maxLength={400} value={v.quote} onChange={(e) => set({ quote: e.target.value })} />
          <label htmlFor={nameId} className="ph-fb-label">Name to show (for example, first name and last initial)</label>
          <input id={nameId} className="ph-input" maxLength={60} value={v.displayName} onChange={(e) => set({ displayName: e.target.value })} />
        </>
      )}
    </fieldset>
  )
}

// A small in-product feedback card. One prompt at a time; the server decides
// which moment is due and never repeats an answered or dismissed one.
export default function FeedbackPrompt({ api, prompt, onDone }) {
  const [answers, setAnswers] = useState({})
  const [state, setState] = useState({ busy: false, error: null, done: null })
  const titleId = useId()

  useEffect(() => {
    if (!prompt || !api) return
    api.post('/cs/me/feedback/seen', { momentKey: prompt.momentKey }).catch(() => {})
  }, [api, prompt])

  if (!prompt) return null
  if (state.done) {
    return <section className="ph-card ph-feedback" role="status"><p>{state.done}</p></section>
  }

  const set = (id) => (value) => setAnswers((a) => ({ ...a, [id]: value }))

  async function submit(event) {
    event.preventDefault()
    setState({ busy: true, error: null, done: null })
    try {
      const payload = { ...answers }
      if (payload.review) payload.review = { ...payload.review, quote: payload.review.quote || '' }
      await api.post('/cs/me/feedback', { momentKey: prompt.momentKey, answers: payload })
      setState({ busy: false, error: null, done: 'Thanks. Aaron reads every answer.' })
      onDone?.()
    } catch (err) {
      setState({ busy: false, error: err.message, done: null })
    }
  }

  async function later(action) {
    setState({ busy: true, error: null, done: null })
    try {
      await api.post('/cs/me/feedback/dismiss', { momentKey: prompt.momentKey, action })
      setState({ busy: false, error: null, done: action === 'snooze' ? 'No problem. We will ask again in a few days.' : 'Got it. We will not ask about this again.' })
    } catch (err) {
      setState({ busy: false, error: err.message, done: null })
    }
  }

  return (
    <section className="ph-card ph-feedback" aria-labelledby={titleId}>
      <p className="ph-eyebrow">Quick feedback</p>
      <h2 id={titleId} className="ph-card-title">{prompt.title}</h2>
      <p className="ph-muted">{prompt.intro}</p>
      <form onSubmit={submit} className="ph-fb-form">
        {prompt.questions.map((q) => {
          if (q.type === 'scale') return <ScaleQuestion key={q.id} q={q} value={answers[q.id]} onChange={set(q.id)} />
          if (q.type === 'choice') return <ChoiceQuestion key={q.id} q={q} value={answers[q.id]} onChange={set(q.id)} />
          if (q.type === 'multi') return <ChoiceQuestion key={q.id} q={q} value={answers[q.id]} onChange={set(q.id)} multi />
          if (q.type === 'review') return <ReviewQuestion key={q.id} value={answers[q.id]} onChange={set(q.id)} />
          return <TextQuestion key={q.id} q={q} value={answers[q.id]} onChange={set(q.id)} />
        })}
        {state.error && <p className="ph-error" role="alert">{state.error}</p>}
        <div className="ph-card-foot">
          <button type="submit" className="btn btn-primary btn-sm" disabled={state.busy}>Send</button>
          {prompt.canSnooze && <button type="button" className="btn btn-ghost btn-sm" onClick={() => later('snooze')} disabled={state.busy}>Not now</button>}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => later('dismiss')} disabled={state.busy}>Don&apos;t ask again</button>
        </div>
      </form>
    </section>
  )
}
