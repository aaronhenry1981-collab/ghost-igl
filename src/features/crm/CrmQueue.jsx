import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCrmResource } from './useCrmResource'
import { Badge, Empty, ErrorState, Loading, Panel } from './crmUi'
import { fmtAgo } from './crmFormat'

const SEVERITY_TONE = { critical: 'danger', high: 'warning', medium: 'info', low: 'neutral' }
const CONTROL_LABEL = { approve: 'Approve', deny: 'Deny', dismiss: 'Dismiss', fix: 'Mark fixed' }

export function QueueItem({ item, api, basePath, onDecided, compact = false }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [subject, setSubject] = useState(item.draft?.subject || '')
  const [body, setBody] = useState(item.draft?.body || '')
  const noteId = useId()
  const subjectId = useId()
  const bodyId = useId()

  async function decide(decision) {
    setBusy(decision)
    setError(null)
    try {
      const res = await api.post('/cs/admin/queue/decision', { itemKey: item.key, decision, note: note || null, ...(decision === 'approve' && item.draft ? { message: { subject, body } } : {}) })
      onDecided?.(item, decision, res)
    } catch (err) {
      setError(err.message)
      setBusy(null)
    }
  }

  return (
    <article className={`crm-qitem crm-sev-${item.severity}`} aria-label={`${item.title}: ${item.player.name || 'player'}`}>
      <header className="crm-qitem-head">
        <Badge tone={SEVERITY_TONE[item.severity]}>{item.severity}</Badge>
        <h3>{item.title}</h3>
        {!compact && (
          <Link to={`${basePath}/players/${item.player.key}`} className="crm-link">
            {item.player.name || item.player.email || 'Player'} · {item.player.planLabel}
          </Link>
        )}
      </header>
      <dl className="crm-qitem-body">
        <dt>What happened</dt>
        <dd>{item.whatHappened}</dd>
        <dt>Why it was flagged</dt>
        <dd>
          <ul>{item.whyFlagged.map((w) => <li key={w}>{w}</li>)}</ul>
          {item.detectedAt && <span className="crm-muted">Detected {fmtAgo(item.detectedAt)}</span>}
        </dd>
        <dt>Recommended action</dt>
        <dd>{item.recommended}</dd>
      </dl>
      {item.draft && !item.approveBlockedBy && (
        <details className="crm-draft">
          <summary>Message that "{item.approveLabel || 'Approve'}" records ({item.draft.channel === 'email' ? 'email' : 'in-app'})</summary>
          <label htmlFor={subjectId}>Subject</label>
          <input id={subjectId} className="crm-input" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={140} />
          <label htmlFor={bodyId}>Message</label>
          <textarea id={bodyId} className="crm-input" rows={6} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} />
          {/\[[^\]]*(Aaron|adds|TODO)[^\]]*\]/i.test(body) && <p className="crm-warn">Replace the [bracketed] text before approving.</p>}
        </details>
      )}
      {item.approveBlockedBy && <p className="crm-warn">Approval blocked: {item.approveBlockedBy.replace(/_/g, ' ')}.</p>}
      <div className="crm-qitem-actions">
        <label htmlFor={noteId} className="crm-visually-hidden">Note for the audit log (optional)</label>
        <input id={noteId} className="crm-input" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
        {item.controls.map((c) => (
          <button key={c} type="button" className={c === 'approve' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'} onClick={() => decide(c)} disabled={Boolean(busy) || (c === 'approve' && Boolean(item.approveBlockedBy))}>
            {busy === c ? 'Saving…' : c === 'approve' && item.approveLabel ? item.approveLabel : CONTROL_LABEL[c]}
          </button>
        ))}
      </div>
      {error && <p className="crm-error" role="alert">{error}</p>}
    </article>
  )
}

export default function CrmQueue({ api, basePath }) {
  const { status, data, error, reload } = useCrmResource(api, '/cs/admin/queue')
  const [done, setDone] = useState([])
  if (status === 'loading') return <Loading />
  if (status === 'error') return <ErrorState error={error} onRetry={reload} />
  const items = data.items.filter((i) => !done.some((d) => d.key === i.key))

  return (
    <div className="crm-stack">
      <p className="crm-lede">
        Only items that need a person are here. Each one says what happened, why, and what to do.
        Routine follow-ups run automatically and are counted below.
      </p>
      {done.length > 0 && (
        <p className="crm-note-ok" role="status">
          {done.length} decision{done.length === 1 ? '' : 's'} saved: {done.map((d) => `${d.title} (${d.decision})`).join('; ')}
        </p>
      )}
      {items.length === 0 ? (
        <Empty>Nothing needs your decision right now.</Empty>
      ) : (
        <div className="crm-queue">
          {items.map((item) => (
            <QueueItem key={item.key} item={item} api={api} basePath={basePath} onDecided={(it, decision) => setDone((d) => [...d, { key: it.key, title: it.title, decision }])} />
          ))}
        </div>
      )}
      <Panel title="Handled automatically">
        {data.autoHandled.length ? (
          <ul className="crm-auto">{data.autoHandled.map((a) => <li key={a.code}><strong>{a.count}</strong> {a.how}</li>)}</ul>
        ) : <p className="crm-muted">Nothing routine pending.</p>}
      </Panel>
    </div>
  )
}
