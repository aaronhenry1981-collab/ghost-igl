import { useId, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCrmResource } from './useCrmResource'
import { Badge, Empty, ErrorState, Loading, Panel } from './crmUi'
import { fmtAgo, fmtDateTime } from './crmFormat'

const STATUS_TONE = { delivered: 'ok', delivery_disabled: 'neutral', pending_approval: 'info', approved: 'info', failed: 'danger', suppressed: 'warning', cancelled: 'muted', sent: 'ok', received: 'info' }
const STATUS_LABEL = { delivered: 'Delivered in-app', delivery_disabled: 'Not delivered (delivery off)', pending_approval: 'Waiting for approval', approved: 'Approved', failed: 'Failed', suppressed: 'Suppressed', cancelled: 'Cancelled', sent: 'Sent', received: 'Received' }

function DeliveryBanner({ mode }) {
  return (
    <p className={mode === 'disabled' ? 'crm-warn' : 'crm-muted'} role="status">
      {mode === 'disabled'
        ? 'Delivery is off. Replies and workflow messages are recorded here and never reach players until delivery is approved and switched on.'
        : 'In-app delivery is on. Email is never sent from this system.'}
    </p>
  )
}

// One id per composed reply, so a double-click or retry is not sent twice.
function newClientId() {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  } catch { /* fall through */ }
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function Thread({ api, threadKey, basePath }) {
  const { status, data, error, reload } = useCrmResource(api, `/cs/admin/conversations/${threadKey}`)
  const [body, setBody] = useState('')
  const [channel, setChannel] = useState('in_app')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [clientId, setClientId] = useState(newClientId)
  const bodyId = useId()
  const channelId = useId()
  if (status === 'loading') return <Loading label="Loading conversation…" />
  if (status === 'error') return <ErrorState error={error} onRetry={reload} />

  async function reply(event) {
    event.preventDefault()
    setSending(true)
    setResult(null)
    try {
      const res = await api.post(`/cs/admin/conversations/${threadKey}/reply`, { body, channel, clientId })
      setResult({
        ok: true,
        text: res.answered
          ? STATUS_LABEL[res.status] || res.status
          : `${STATUS_LABEL[res.status] || res.status}. The player has not seen this reply, so their message still counts as waiting.`,
      })
      setBody('')
      setClientId(newClientId())
      reload()
    } catch (err) {
      setResult({ ok: false, text: err.message })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="crm-stack">
      <div className="crm-thread-head">
        <strong>{data.email}</strong>
        <Link to={`${basePath}/players/${threadKey}`} className="crm-link">Player record</Link>
        {data.consent.doNotContact && <Badge tone="danger">Do not contact</Badge>}
        {data.consent.relationship === 'opted_out' && <Badge tone="warning">Opted out of nudges</Badge>}
      </div>
      <ol className="crm-thread">
        {data.messages.map((m) => (
          <li key={m.id} className={`crm-msg crm-msg-${m.direction}`}>
            <div className="crm-msg-meta">
              <span>{m.direction === 'inbound' ? 'Player' : String(m.author || 'Recon').replace('admin:', '')}</span>
              <span>· {m.channel === 'email' ? 'Email' : 'In-app'} · {fmtDateTime(m.at)}</span>
              <Badge tone={STATUS_TONE[m.status] || 'neutral'}>{STATUS_LABEL[m.status] || m.status}</Badge>
              {m.direction === 'inbound' && m.senderVerified === false && <Badge tone="warning">Sender not verified</Badge>}
              {m.direction === 'outbound' && <span className="crm-muted">{m.visibleToPlayer ? (m.readByPlayerAt ? '· read by player' : '· unread by player') : '· not visible to player'}</span>}
            </div>
            {m.subject && <strong>{m.subject}</strong>}
            <p>{m.body}</p>
          </li>
        ))}
      </ol>
      <form className="crm-reply" onSubmit={reply}>
        <label htmlFor={bodyId}>Reply</label>
        <textarea id={bodyId} className="crm-input" rows={4} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} disabled={data.consent.doNotContact} />
        <div className="crm-qitem-actions">
          <label htmlFor={channelId} className="crm-visually-hidden">Channel</label>
          <select id={channelId} className="crm-input" value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="in_app">In-app message</option>
            <option value="email">Email (recorded only, never sent)</option>
          </select>
          <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !body.trim() || data.consent.doNotContact}>{sending ? 'Saving…' : 'Reply'}</button>
        </div>
        {result && <p className={result.ok ? 'crm-ok' : 'crm-error'} role="status">{result.text}</p>}
      </form>
      <DeliveryBanner mode={data.deliveryMode} />
    </div>
  )
}

function Inbox({ api, basePath }) {
  const [params, setParams] = useSearchParams()
  const { status, data, error, reload } = useCrmResource(api, '/cs/admin/conversations')
  const selected = params.get('thread')
  if (status === 'loading') return <Loading />
  if (status === 'error') return <ErrorState error={error} onRetry={reload} />
  const pick = (key) => {
    const next = new URLSearchParams(params)
    next.set('thread', key)
    setParams(next, { replace: true })
  }
  return (
    <div className="crm-inbox">
      <Panel title={`Threads (${data.threads.length})`} className="crm-inbox-list">
        {data.threads.length === 0 ? <Empty>No conversations yet.</Empty> : (
          <ul className="crm-threads">
            {data.threads.map((t) => (
              <li key={t.key}>
                <button type="button" className={`crm-thread-row${selected === t.key ? ' is-active' : ''}`} onClick={() => pick(t.key)} aria-current={selected === t.key ? 'true' : undefined}>
                  <span className="crm-thread-email">{t.email}</span>
                  <span className="crm-muted">{t.lastDirection === 'inbound' ? 'Player: ' : 'Recon: '}{t.lastPreview}</span>
                  <span className="crm-thread-flags">
                    {t.unreadForAdmin > 0 && <Badge tone="info">{t.unreadForAdmin} new</Badge>}
                    {t.waitingSince && <Badge tone="warning">waiting {fmtAgo(t.waitingSince)}</Badge>}
                    {t.undelivered > 0 && <Badge tone="neutral">{t.undelivered} not delivered</Badge>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <div className="crm-inbox-thread">
        {selected ? <Thread key={selected} api={api} threadKey={selected} basePath={basePath} /> : <Empty>Pick a thread to read and reply.</Empty>}
      </div>
    </div>
  )
}

function OutreachLog({ api, basePath }) {
  const { status, data, error, reload } = useCrmResource(api, '/cs/admin/outreach')
  if (status === 'loading') return <Loading />
  if (status === 'error') return <ErrorState error={error} onRetry={reload} />
  return (
    <div className="crm-stack">
      <DeliveryBanner mode={data.deliveryMode} />
      <div className="crm-kpis">
        {Object.entries(data.byStatus).map(([s, n]) => <div className="crm-kpi" key={s}><span className="crm-kpi-label">{STATUS_LABEL[s] || s}</span><span className="crm-kpi-value">{n}</span></div>)}
        {!Object.keys(data.byStatus).length && <Empty>No outreach recorded yet.</Empty>}
      </div>
      {data.records.length > 0 && (
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead><tr><th scope="col">Player</th><th scope="col">Workflow</th><th scope="col">Status</th><th scope="col">Why</th><th scope="col">Message</th><th scope="col">When</th></tr></thead>
            <tbody>
              {data.records.map((r) => (
                <tr key={`${r.player}-${r.key}`}>
                  <th scope="row" data-label="Player"><Link to={`${basePath}/players/${r.player}`} className="crm-player-name">{r.email}</Link></th>
                  <td data-label="Workflow">{r.workflowName}<span className="crm-muted"> · {r.channel === 'email' ? 'email' : 'in-app'}</span></td>
                  <td data-label="Status"><Badge tone={STATUS_TONE[r.status] || 'neutral'}>{STATUS_LABEL[r.status] || r.status}</Badge></td>
                  <td data-label="Why">{r.triggerReason}</td>
                  <td data-label="Message"><details><summary>{r.subject || 'Message'}</summary><p className="crm-pre">{r.body}</p></details></td>
                  <td data-label="When">{fmtAgo(r.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Workflows({ api }) {
  const { status, data, error, reload } = useCrmResource(api, '/cs/admin/outreach')
  const [plan, setPlan] = useState(null)
  const [busy, setBusy] = useState(false)
  const [runResult, setRunResult] = useState(null)
  if (status === 'loading') return <Loading />
  if (status === 'error') return <ErrorState error={error} onRetry={reload} />

  async function preview() {
    setBusy(true)
    setRunResult(null)
    try { setPlan(await api.post('/cs/admin/outreach/run', { dryRun: true })) } finally { setBusy(false) }
  }
  async function run() {
    setBusy(true)
    try {
      const res = await api.post('/cs/admin/outreach/run', { dryRun: false })
      setRunResult(res)
      reload()
    } finally { setBusy(false) }
  }

  return (
    <div className="crm-stack">
      <DeliveryBanner mode={data.deliveryMode} />
      <Panel title="Rules">
        <p className="crm-muted crm-small">Caps: at most one non-service message every {data.frequency.minHoursBetween} hours and {data.frequency.max30Days} per 30 days (counting the existing daily CRM job). Automated nudges pause for {data.frequency.quietAfterInboundHours} hours after a player writes in.</p>
        <div className="crm-table-wrap">
          <table className="crm-table crm-table-compact">
            <thead><tr><th scope="col">Workflow</th><th scope="col">Consent class</th><th scope="col">Channel</th><th scope="col">Approval</th><th scope="col">Limits</th><th scope="col">When it fires</th></tr></thead>
            <tbody>
              {data.workflows.map((w) => (
                <tr key={w.id}>
                  <th scope="row" data-label="Workflow">{w.name}{w.owner === 'legacy_crm' && <span className="crm-muted"> · existing CRM job</span>}</th>
                  <td data-label="Consent class">{w.category}</td>
                  <td data-label="Channel">{w.channel ? (w.channel === 'email' ? 'email' : 'in-app') : '—'}</td>
                  <td data-label="Approval">{w.approval === 'required' ? 'Aaron approves' : w.approval === 'auto' ? 'automatic' : '—'}</td>
                  <td data-label="Limits">{w.maxSends ? `${w.maxSends} max, ${w.cooldownDays}d apart` : '—'}</td>
                  <td data-label="When it fires">{w.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Next run" action={<div className="crm-qitem-actions"><button type="button" className="btn btn-ghost btn-sm" onClick={preview} disabled={busy}>Preview (no changes)</button>{plan && <button type="button" className="btn btn-primary btn-sm" onClick={run} disabled={busy}>Record eligible messages</button>}</div>}>
        {!plan ? <p className="crm-muted">Preview shows exactly who would get what, and why anything is blocked. Nothing is written.</p> : plan.plan.length === 0 ? <Empty>No workflow is triggered right now.</Empty> : (
          <div className="crm-table-wrap">
            <table className="crm-table crm-table-compact">
              <thead><tr><th scope="col">Player</th><th scope="col">Workflow</th><th scope="col">Result</th><th scope="col">Trigger</th></tr></thead>
              <tbody>
                {plan.plan.map((p) => (
                  <tr key={`${p.player}-${p.workflowId}-${p.instanceKey}`}>
                    <th scope="row" data-label="Player">{p.name}</th>
                    <td data-label="Workflow">{p.workflowName}</td>
                    <td data-label="Result">{p.eligible ? <Badge tone="ok">{p.approval === 'required' ? 'needs approval' : 'eligible'}</Badge> : <Badge tone="neutral">blocked: {String(p.blockedBy).replace(/_/g, ' ')}</Badge>}</td>
                    <td data-label="Trigger">{p.triggerReason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {runResult && <p className="crm-ok" role="status">Recorded {runResult.results.filter((r) => r.status).length} message(s). Delivery mode: {runResult.deliveryMode}.</p>}
      </Panel>
    </div>
  )
}

const VIEWS = [['inbox', 'Inbox'], ['outreach', 'Outreach log'], ['workflows', 'Workflows']]

export default function CrmConversations({ api, basePath }) {
  const [params, setParams] = useSearchParams()
  const view = VIEWS.some(([v]) => v === params.get('view')) ? params.get('view') : 'inbox'
  return (
    <div className="crm-stack">
      <div className="crm-subnav" role="group" aria-label="Conversations views">
        {VIEWS.map(([v, label]) => (
          <button key={v} type="button" aria-pressed={view === v} className={`crm-subtab${view === v ? ' is-active' : ''}`} onClick={() => setParams({ view: v }, { replace: true })}>{label}</button>
        ))}
      </div>
      {view === 'inbox' && <Inbox api={api} basePath={basePath} />}
      {view === 'outreach' && <OutreachLog api={api} basePath={basePath} />}
      {view === 'workflows' && <Workflows api={api} />}
    </div>
  )
}
