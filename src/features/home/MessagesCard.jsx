import { useEffect, useId, useState } from 'react'
import { formatRelative } from './homeFormat'

// In-product conversation with Recon. The player marks their own messages
// read by opening this card; nothing an admin does can change that.
export default function MessagesCard({ api, summary, open, onOpenChange }) {
  const [thread, setThread] = useState(null)
  const [version, setVersion] = useState(0)
  const [draft, setDraft] = useState('')
  const [state, setState] = useState({ sending: false, error: null, notice: null })
  const titleId = useId()
  const inputId = useId()

  useEffect(() => {
    if (!open) return undefined
    let cancelled = false
    api.get('/cs/me/messages')
      .then(async (data) => {
        if (cancelled) return
        setThread(data)
        if (data.unread > 0 && !api.preview) await api.post('/cs/me/messages/read', {})
      })
      .catch((err) => { if (!cancelled) setState((s) => ({ ...s, error: err.message })) })
    return () => { cancelled = true }
  }, [open, api, version])

  async function send(event) {
    event.preventDefault()
    if (!draft.trim()) return
    setState({ sending: true, error: null, notice: null })
    try {
      const res = await api.post('/cs/me/messages', { body: draft.trim() })
      setDraft('')
      setState({ sending: false, error: null, notice: res.suppressed ? 'Done. We will not email you about coaching or offers.' : 'Sent. Aaron reads every message.' })
      setVersion((v) => v + 1)
    } catch (err) {
      setState({ sending: false, error: err.message, notice: null })
    }
  }

  const unread = summary?.unread || 0
  return (
    <section className="ph-card ph-messages" aria-labelledby={titleId}>
      <header className="ph-card-head">
        <div>
          <p className="ph-eyebrow">Support</p>
          <h2 id={titleId} className="ph-card-title">Messages{unread > 0 && <span className="ph-unread" aria-label={`${unread} unread`}>{unread}</span>}</h2>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" aria-expanded={open} onClick={() => onOpenChange(!open)}>{open ? 'Close' : unread ? 'Read' : 'Open'}</button>
      </header>
      {!open && summary?.latest && (
        <p className="ph-muted">{summary.latest.author === 'you' ? 'You' : 'Recon 6'}: {summary.latest.body.slice(0, 90)}{summary.latest.body.length > 90 ? '…' : ''}</p>
      )}
      {!open && !summary?.latest && <p className="ph-muted">Questions, bugs or billing. Aaron reads every message.</p>}
      {open && (
        <>
          <ol className="ph-thread" aria-live="polite">
            {thread?.messages?.length ? thread.messages.map((m) => (
              <li key={m.id} className={`ph-msg ph-msg-${m.direction}`}>
                <span className="ph-msg-meta">{m.author === 'you' ? 'You' : 'Recon 6'} · {formatRelative(m.at)}</span>
                {m.subject && <strong className="ph-msg-subject">{m.subject}</strong>}
                <p>{m.body}</p>
              </li>
            )) : <li className="ph-muted">No messages yet.</li>}
          </ol>
          <form onSubmit={send} className="ph-compose">
            <label htmlFor={inputId} className="ph-visually-hidden">Message to Recon 6</label>
            <textarea id={inputId} rows={3} maxLength={2000} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message. Do not include passwords or card numbers." />
            <div className="ph-card-foot">
              <button type="submit" className="btn btn-primary btn-sm" disabled={state.sending || !draft.trim()}>{state.sending ? 'Sending…' : 'Send'}</button>
            </div>
            {state.error && <p className="ph-error" role="alert">{state.error}</p>}
            {state.notice && <p className="ph-source" role="status">{state.notice}</p>}
          </form>
        </>
      )}
    </section>
  )
}
