import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCrmResource } from './useCrmResource'
import { Badge, Empty, ErrorState, Kpi, Loading, Panel } from './crmUi'
import { fmtAgo } from './crmFormat'

const MOMENT_LABEL = {
  early_days: 'First days',
  week_1: 'Week 1',
  month_1: 'Month 1',
  after_vod: 'After VOD review',
  after_coaching: 'After coaching',
  meaningful_use: 'After real use',
  cancellation: 'Cancelling',
  failed_renewal: 'Renewal failed',
}

const REASON_LABEL = {
  too_expensive: 'Too expensive',
  not_using: 'Not using it enough',
  content_quality: 'Content not accurate enough',
  missing_feature: 'Missing something',
  technical: 'Technical problems',
  card: 'Card problem',
  cost: 'Cost',
  value: 'Not enough value',
  pausing: 'Taking a break',
  other: 'Something else',
}

function Answers({ answers }) {
  const parts = []
  if (Number.isFinite(answers.helpful)) parts.push(`helpful ${answers.helpful}/5`)
  if (Number.isFinite(answers.nps)) parts.push(`recommend ${answers.nps}/10`)
  if (answers.result) parts.push(answers.result.replace(/_/g, ' '))
  if (answers.cancel_reason) parts.push(REASON_LABEL[answers.cancel_reason])
  if (answers.blocker) parts.push(REASON_LABEL[answers.blocker])
  if (answers.used?.length) parts.push(`used ${answers.used.join(', ').replace(/_/g, ' ')}`)
  return (
    <>
      <span>{parts.join(' · ') || 'No ratings'}</span>
      {['confusing', 'missing', 'comment'].filter((k) => answers[k]).map((k) => (
        <p key={k} className="crm-quote"><span className="crm-muted">{k === 'confusing' ? 'Confusing' : k === 'missing' ? 'Missing' : 'Comment'}:</span> “{answers[k]}”</p>
      ))}
    </>
  )
}

function Complaint({ item, api, basePath, onResolved }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const noteId = useId()
  async function resolve() {
    setBusy(true)
    try {
      await api.post('/cs/admin/feedback/resolve', { player: item.player.key, feedbackId: item.feedbackId, note })
      onResolved(item.feedbackId)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }
  return (
    <li className="crm-complaint">
      <div>
        <Link to={`${basePath}/players/${item.player.key}`} className="crm-player-name">{item.player.name}</Link>
        <span className="crm-muted"> · {MOMENT_LABEL[item.moment] || item.moment} · {fmtAgo(item.createdAt)}</span>
      </div>
      <Answers answers={item.answers} />
      <div className="crm-qitem-actions">
        <label htmlFor={noteId} className="crm-visually-hidden">What changed</label>
        <input id={noteId} className="crm-input" placeholder="What changed (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
        <button type="button" className="btn btn-ghost btn-sm" onClick={resolve} disabled={busy}>Mark resolved</button>
      </div>
      {error && <p className="crm-error" role="alert">{error}</p>}
    </li>
  )
}

export default function CrmFeedback({ api, basePath }) {
  const { status, data, error, reload } = useCrmResource(api, '/cs/admin/feedback')
  const [resolved, setResolved] = useState([])
  if (status === 'loading') return <Loading />
  if (status === 'error') return <ErrorState error={error} onRetry={reload} />
  const complaints = data.complaints.filter((c) => !resolved.includes(c.feedbackId))

  return (
    <div className="crm-stack">
      <div className="crm-kpis">
        <Kpi label="Responses" value={data.responses} />
        <Kpi label="Helpfulness" value={data.helpful.average === null ? 'n/a' : `${data.helpful.average} / 5`} detail={`${data.helpful.n} rating${data.helpful.n === 1 ? '' : 's'}`} />
        <Kpi label="Recommend score" value={data.nps.score === null ? 'Too few answers' : data.nps.score} detail={`${data.nps.n} answer${data.nps.n === 1 ? "" : "s"} · ${data.nps.promoters} promoter${data.nps.promoters === 1 ? "" : "s"} · ${data.nps.detractors} detractor${data.nps.detractors === 1 ? "" : "s"}`} />
        <Kpi label="Unresolved complaints" value={complaints.length} />
      </div>

      <div className="crm-two">
        <Panel title="Unresolved complaints">
          {complaints.length === 0 ? <Empty>No open complaints.</Empty> : (
            <ul className="crm-list">
              {complaints.map((c) => <Complaint key={c.feedbackId} item={c} api={api} basePath={basePath} onResolved={(id) => setResolved((r) => [...r, id])} />)}
            </ul>
          )}
        </Panel>
        <div className="crm-stack">
          <Panel title="Themes">
            <p className="crm-muted crm-small">Keyword rules over written answers. Each theme shows the quotes that produced it.</p>
            {data.themes.length === 0 ? <Empty>No written answers yet.</Empty> : (
              <ul className="crm-list">
                {data.themes.map((t) => (
                  <li key={t.id}>
                    <strong>{t.label}</strong> <Badge tone="info">{t.count}</Badge>
                    {t.quotes.map((q) => <p key={q.feedbackId + q.text} className="crm-quote">“{q.text}”</p>)}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Requested features">
            {data.requests.length === 0 ? <Empty>No requests yet.</Empty> : (
              <ul className="crm-list">
                {data.requests.map((r) => <li key={r.feedbackId}>“{r.text}” {r.themes.length > 0 && <span className="crm-muted">({r.themes.join(', ')})</span>}</li>)}
              </ul>
            )}
          </Panel>
          {Object.keys(data.reasons).length > 0 && (
            <Panel title="Cancellation and renewal reasons">
              <ul className="crm-auto">{Object.entries(data.reasons).map(([k, n]) => <li key={k}><strong>{n}</strong> {REASON_LABEL[k] || k}</li>)}</ul>
            </Panel>
          )}
        </div>
      </div>

      <Panel title="All responses">
        {data.list.length === 0 ? <Empty>No feedback yet. Prompts appear in the player home at the moments listed in the docs.</Empty> : (
          <ul className="crm-list">
            {data.list.map((f) => (
              <li key={f.feedbackId}>
                <Link to={`${basePath}/players/${f.player.key}`} className="crm-player-name">{f.player.name}</Link>
                <span className="crm-muted"> · {MOMENT_LABEL[f.moment] || f.moment} · {fmtAgo(f.createdAt)}</span>
                {f.status === 'resolved' && <Badge tone="ok">resolved</Badge>}
                <div><Answers answers={f.answers} /></div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
