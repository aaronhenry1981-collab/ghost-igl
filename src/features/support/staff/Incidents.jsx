import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { PRIORITY_LABEL, SEVERITY_LABEL, staffStatusLabel } from '../supportLogic.mjs'
import { errorMessage } from '../supportApi'
import { useSupportResource } from '../useSupportResource'
import { Ago, Chip, EmptyState, NotRecorded, RoundInterrupted, Skeleton } from '../ui/bits'

const STATUS_TONE = { investigating: 'danger', identified: 'warning', monitoring: 'info', resolved: 'ok' }
const SERVICE_LABEL = {
  identity_ubisoft: 'Ubisoft identity', identity_psn: 'PSN identity', identity_xbox: 'Xbox identity', trn: 'Tracker (TRN)',
  vod_processing: 'VOD processing', auth: 'Sign-in', payment_access: 'Payment access', desktop_client: 'Desktop client', other: 'Other',
}
const EVENT_LABEL = { update: 'update', note: 'note', status_change: 'status', customer_update_draft: 'draft update' }

// GET /cs/admin/support/incidents -> { incidents: [{ incidentId, title,
// service, status, severity, owner, affectedCount (null = unknown),
// workaround, internalNotes, customerUpdate { draft, published: false },
// createdAt, updatedAt, resolvedAt, linkedCaseCount }] }
export function IncidentList({ client, to }) {
  const res = useSupportResource(client, 'incidents')
  if (res.status === 'loading') return <Skeleton lines={4} label="Loading incidents…" />
  if (res.status === 'error') return <RoundInterrupted message={errorMessage(res.error, "Couldn't load incidents.")} onRetry={res.reload} />
  const items = res.data?.incidents || []
  if (!items.length) return <EmptyState title="No incidents">When a service breaks for many players, open an incident and link cases to it.</EmptyState>
  return (
    <ul className="sc-incidents">
      {items.map((i) => (
        <li key={i.incidentId}>
          <Link to={to(`incidents/${i.incidentId}`)} className={`sc-inc-row sc-inc-${i.status}`}>
            <span className="sc-inc-top">
              <Chip tone={STATUS_TONE[i.status] || 'muted'}>{i.status}</Chip>
              <Chip tone="muted">{SEVERITY_LABEL[i.severity] || i.severity}</Chip>
              <span className="sp-muted sp-small">{SERVICE_LABEL[i.service] || i.service}</span>
            </span>
            <span className="sc-inc-title">{i.title}</span>
            <span className="sp-muted sp-small">
              affected {i.affectedCount ?? 'unknown'} · {i.linkedCaseCount ?? 0} linked case{i.linkedCaseCount === 1 ? '' : 's'} · updated <Ago at={i.updatedAt} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

// GET /cs/admin/support/incidents/{id} -> { incident, timeline: [{ eventId,
// kind, body, data, by, at }], linkedCases: [{ caseNumber, status, priority,
// createdAt }] }
export function IncidentDetail({ client, id, to }) {
  const res = useSupportResource(client, 'incident', id)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const noteId = useId()
  if (res.status === 'loading') return <Skeleton lines={6} label="Loading incident…" />
  if (res.status === 'error') return <RoundInterrupted message={errorMessage(res.error, "Couldn't load this incident.")} onRetry={res.reload}><Link to={to('incidents')} className="btn btn-ghost btn-sm">All incidents</Link></RoundInterrupted>
  if (res.status !== 'ready') return null
  const i = res.data.incident || {}
  const timeline = res.data.timeline || []
  const linkedCases = res.data.linkedCases || []

  async function addNote(e) {
    e.preventDefault()
    if (!note.trim()) return
    setBusy(true)
    setError(null)
    try {
      await client.addIncidentTimeline(id, { text: note.trim() })
      setNote('')
      res.reload()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sc-incident">
      <p className="sc-crumb"><Link to={to('incidents')}>← Incidents</Link></p>
      <header className="sc-ws-head">
        <div className="sc-ws-title">
          <h2 className="sc-ws-subject">{i.title}</h2>
        </div>
        <div className="sc-ws-chips">
          <Chip tone={STATUS_TONE[i.status] || 'muted'}>{i.status}</Chip>
          <Chip tone="muted">{SEVERITY_LABEL[i.severity] || i.severity}</Chip>
          <Chip tone="neutral">{SERVICE_LABEL[i.service] || i.service}</Chip>
          <Chip tone="muted">Owner: {i.owner || 'none'}</Chip>
          <Chip tone="muted">Affected: {i.affectedCount ?? 'unknown'}</Chip>
        </div>
      </header>
      <div className="sc-inc-grid">
        <section className="sc-block" aria-labelledby="inc-tl">
          <header className="sc-block-head"><h2 id="inc-tl">Timeline</h2></header>
          <ol className="sc-audit">
            {timeline.slice().reverse().map((t) => (
              <li key={t.eventId}>
                <Ago at={t.at} />
                <span className="sp-mono sc-audit-action">{EVENT_LABEL[t.kind] || t.kind}</span>
                <span className="sc-wrap">{t.body || (t.data?.to ? `${t.data.from || '?'} → ${t.data.to}` : '')}</span>
                <span className="sp-muted sp-small sc-wrap">{t.by}</span>
              </li>
            ))}
          </ol>
          <form className="sc-inc-note" onSubmit={addNote}>
            <label htmlFor={noteId} className="sp-small">Add timeline entry (internal)</label>
            <textarea id={noteId} className="sp-textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} />
            <button type="submit" className="btn btn-ghost btn-sm" disabled={busy || !note.trim()}>{busy ? 'Saving…' : 'Add entry'}</button>
            {error && <p className="sp-field-error" role="alert">{error}</p>}
          </form>
        </section>
        <div className="sc-stack">
          <section className="sc-block" aria-labelledby="inc-wa">
            <header className="sc-block-head"><h2 id="inc-wa">Workaround</h2></header>
            {i.workaround ? <p>{i.workaround}</p> : <NotRecorded>No workaround yet</NotRecorded>}
          </section>
          <section className="sc-block sc-customer-update" aria-labelledby="inc-cu">
            <header className="sc-block-head">
              <h2 id="inc-cu">Customer-safe update</h2>
              <span className="sp-draft-badge">Draft · not published</span>
            </header>
            {i.customerUpdate?.draft ? <blockquote className="sc-draft-text">{i.customerUpdate.draft}</blockquote> : <NotRecorded>No draft yet</NotRecorded>}
            <p className="sp-muted sp-small">Nothing here reaches players automatically. Publishing is a separate, approved step.</p>
          </section>
          <section className="sc-block" aria-labelledby="inc-notes">
            <header className="sc-block-head"><h2 id="inc-notes">Internal notes</h2></header>
            {i.internalNotes ? <p>{i.internalNotes}</p> : <NotRecorded>None</NotRecorded>}
          </section>
          <section className="sc-block" aria-labelledby="inc-cases">
            <header className="sc-block-head"><h2 id="inc-cases">Linked cases</h2></header>
            {linkedCases.length ? (
              <ul className="sc-mini">
                {linkedCases.map((c) => (
                  <li key={c.caseNumber}>
                    <Link to={to(`cases/${c.caseNumber}`)} className="sp-mono sc-link">{c.caseNumber}</Link>
                    <span className="sp-muted sp-small">{PRIORITY_LABEL[c.priority] || ''}</span>
                    <span className="sp-muted sp-small">{staffStatusLabel(c.status)} · opened <Ago at={c.createdAt} /></span>
                  </li>
                ))}
              </ul>
            ) : <p className="sp-muted sp-small">No cases linked.</p>}
          </section>
        </div>
      </div>
    </div>
  )
}
