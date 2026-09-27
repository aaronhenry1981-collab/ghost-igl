import { useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  allowedTransitionsFor,
  categoryLabel,
  createClientRequestId,
  PRIORITY_LABEL,
  priorityTone,
  SEVERITY_LABEL,
  SLA_LABEL,
  SLA_TONE,
  slaState,
  staffStatusLabel,
  teamLabel,
} from '../supportLogic.mjs'
import { errorMessage } from '../supportApi'
import { useSupportResource } from '../useSupportResource'
import { Ago, Chip, RoundInterrupted, Skeleton } from '../ui/bits'
import Player360 from './Player360'
import Copilot from './Copilot'
import { ConnectionHealth, DiagnosticsPanels, EntitlementView } from './Diagnostics'
import { Composer, StaffTimeline } from './Conversation'
import { ActionRequestDialog, ActionRequests, Attachments, AuditHistory, EscalateDialog, LinkIncidentDialog, ResolveDialog } from './Controls'

function Block({ id, title, children, className = '', action = null }) {
  return (
    <section id={id} className={`sc-block ${className}`} aria-labelledby={`${id}-h`}>
      <header className="sc-block-head">
        <h2 id={`${id}-h`}>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  )
}

// /admin/crm/support/cases/:caseNumber. The staff case payload
// (GET /cs/admin/support/cases/{n}, API-CONTRACT.md): { me, case (with
// slaState + allowedTransitions + version), timeline, attachments, uploads,
// audit, actionRequests, player360 {status, summary}, previousCases,
// incident, diagnostics {panels, signals, context}, copilot, permissions }.
export default function CaseWorkspace({ client, caseNumber, to, playerHref, articleHref }) {
  const res = useSupportResource(client, 'staffCase', caseNumber)
  const incidentsRes = useSupportResource(client, 'incidents')
  const [mode, setMode] = useState('reply')
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [nextStatus, setNextStatus] = useState('')
  const [requestId, setRequestId] = useState(() => createClientRequestId())
  const composerRef = useRef(null)
  const statusId = useId()

  if (res.status === 'loading') return <Skeleton lines={8} label="Loading case workspace…" />
  if (res.status === 'error') return <RoundInterrupted message={errorMessage(res.error, "Couldn't load this case.")} onRetry={res.reload}><Link to={to('')} className="btn btn-ghost btn-sm">Back to queue</Link></RoundInterrupted>
  if (res.status !== 'ready') return null

  const d = res.data
  const c = d.case || {}
  const can = d.permissions || {}
  const transitions = allowedTransitionsFor(c).filter((s) => s !== 'escalated')
  const sla = slaState(c.slaState)
  const incidentId = d.incident?.incidentId || c.refs?.incidentId || null
  const version = c.version

  async function act(kind, fn, okText) {
    setBusy(kind)
    setError(null)
    setNotice(null)
    try {
      await fn()
      setNotice(okText)
      setDialog(null)
      res.reload()
      return true
    } catch (err) {
      setError(errorMessage(err))
      return false
    } finally {
      setBusy(null)
    }
  }

  async function sendComposer() {
    const text = draft.trim()
    if (!text) return
    const ok = mode === 'note'
      ? await act('compose', () => client.staffNote(caseNumber, { text, clientRequestId: requestId }), 'Private note saved.')
      : await act('compose', () => client.staffReply(caseNumber, { text, clientRequestId: requestId }), 'Reply added to the player’s case timeline.')
    if (ok) { setDraft(''); setRequestId(createClientRequestId()) }
  }

  function insertDraft(text) {
    setMode('reply')
    setDraft((cur) => (cur.trim() ? `${cur.trim()}\n\n${text}` : text))
    setNotice('Copilot draft inserted into the public reply. Edit it, then send.')
    window.setTimeout(() => {
      composerRef.current?.focus()
      composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 0)
  }

  const incidents = incidentsRes.data?.incidents || []
  const context = d.diagnostics?.context || {}
  const jump = [['sc-p360', 'Player 360'], ['sc-convo', 'Conversation'], ['sc-copilot', 'Copilot'], ['sc-diag', 'Diagnostics'], ['sc-ent', 'Entitlement'], ['sc-health', 'Connections'], ['sc-audit', 'Audit']]

  return (
    <div className="sc-ws-wrap">
      <p className="sc-crumb"><Link to={to('')}>← Queue</Link></p>
      <header className="sc-ws-head">
        <div className="sc-ws-title">
          <span className="sp-case-no">{c.caseNumber}</span>
          <h2 className="sc-ws-subject">{c.subject}</h2>
        </div>
        <div className="sc-ws-chips">
          <Chip tone="info">{staffStatusLabel(c.status)}</Chip>
          {c.priority && <Chip tone={priorityTone(c.priority)}>{PRIORITY_LABEL[c.priority]}</Chip>}
          {c.severity && <Chip tone="muted">{SEVERITY_LABEL[c.severity]}</Chip>}
          <Chip tone="neutral">{categoryLabel(c.category)}</Chip>
          {c.source === 'proactive' && <Chip tone="info">Flagged by Recon</Chip>}
          {c.source === 'email' && <Chip tone="muted">By email</Chip>}
          {c.waitingOn && <Chip tone="muted">Waiting on {c.waitingOn}</Chip>}
          {sla && <Chip tone={SLA_TONE[sla]} title="Internal target; never shown to the player">{SLA_LABEL[sla]}</Chip>}
          {c.team && <Chip tone="muted">Team: {teamLabel(c.team)}</Chip>}
          <Chip tone={c.assignee ? 'neutral' : 'warning'}>{c.assignee ? `Owner: ${c.assignee === d.me ? 'you' : c.assignee}` : 'Unassigned'}</Chip>
          {incidentId && <Link to={to(`incidents/${incidentId}`)} className="sp-chip sp-tone-warning sp-chip-link">{d.incident?.title ? `Incident: ${d.incident.title}` : 'Incident linked'}</Link>}
        </div>
        <div className="sc-ws-actions">
          {can['case.status'] !== false && transitions.length > 0 && (
            <>
              <label htmlFor={statusId} className="sp-visually-hidden">Change status</label>
              <select id={statusId} className="sp-input sc-status-select" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
                <option value="">Move to…</option>
                {transitions.map((s) => <option key={s} value={s}>{staffStatusLabel(s)}</option>)}
              </select>
              <button type="button" className="btn btn-ghost btn-sm" disabled={!nextStatus || Boolean(busy)} onClick={() => (nextStatus === 'resolved' ? setDialog('resolve') : act('status', () => client.setStatus(caseNumber, { status: nextStatus, version }), `Moved to ${staffStatusLabel(nextStatus)}.`).then(() => setNextStatus('')))}>Apply</button>
            </>
          )}
          {can['case.assign'] !== false && c.assignee !== d.me && <button type="button" className="btn btn-ghost btn-sm" disabled={Boolean(busy)} onClick={() => act('assign', () => client.assign(caseNumber, { assignee: 'me', version }), 'Assigned to you.')}>Assign to me</button>}
          {can['case.escalate'] !== false && allowedTransitionsFor(c).includes('escalated') && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDialog('escalate')}>Escalate</button>}
          {can['case.link_incident'] !== false && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDialog('incident')}>Link incident</button>}
          {can['case.resolve'] !== false && allowedTransitionsFor(c).includes('resolved') && <button type="button" className="btn btn-primary btn-sm" onClick={() => setDialog('resolve')}>Resolve</button>}
        </div>
      </header>

      <div aria-live="polite">{notice && <p className="sp-note sp-note-ok">{notice}</p>}</div>
      {error && <p className="sp-note sp-note-danger" role="alert">{error}</p>}

      <nav className="sc-jump" aria-label="Jump to section">
        {jump.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </nav>

      <div className="sc-ws">
        <Block id="sc-p360" title="Player 360" className="sc-area-p360">
          <Player360 data={d.player360} previousCases={d.previousCases || []} connections={context.connections || null} caseHref={(n) => to(`cases/${n}`)} playerHref={playerHref?.(d.player360?.summary?.key || c.contactKey)} />
        </Block>

        <Block id="sc-convo" title="Conversation" className="sc-area-convo">
          <StaffTimeline events={d.timeline || []} />
          <Composer ref={composerRef} mode={mode} onMode={setMode} text={draft} onText={setDraft} onSubmit={sendComposer} busy={busy === 'compose'} canReply={can['case.reply'] !== false} canNote={can['case.note'] !== false} />
        </Block>

        <Block id="sc-copilot" title="Copilot" className="sc-area-copilot">
          <Copilot data={d.copilot} onInsert={insertDraft} onEscalate={() => setDialog('escalate')} articleHref={articleHref} />
        </Block>

        <Block id="sc-diag" title="Diagnostics" className="sc-area-diag">
          {d.diagnostics ? <DiagnosticsPanels panels={d.diagnostics.panels || []} observedAt={d.diagnostics.observedAt} /> : <p className="sp-muted">Staff diagnostics are not available for your role.</p>}
        </Block>

        <Block id="sc-ent" title="Entitlement (operator view)" className={`sc-area-ent${context.entitlement?.mismatchSuspected ? ' is-flagged' : ''}`}>
          <EntitlementView ent={context.entitlement || null} canRequest={can['action.request'] !== false} onRequestAction={() => setDialog('action')} />
        </Block>

        <Block id="sc-health" title="Connection health" className="sc-area-health">
          <ConnectionHealth rows={context.connections || []} />
        </Block>

        <Block id="sc-files" title="Attachments" className="sc-area-files">
          <Attachments items={d.attachments || []} uploads={d.uploads} />
        </Block>

        <Block id="sc-actions" title="Action requests" className="sc-area-actions" action={can['action.request'] !== false ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDialog('action')}>New request</button> : null}>
          <ActionRequests items={d.actionRequests || []} />
        </Block>

        <Block id="sc-audit" title="Audit history" className="sc-area-audit">
          <AuditHistory items={d.audit || []} me={d.me} />
        </Block>
      </div>

      {dialog === 'escalate' && (
        <EscalateDialog open onClose={() => setDialog(null)} busy={busy === 'escalate'} detail={d} preset={d.copilot?.suggestedEscalation}
          onSubmit={(body) => act('escalate', () => client.escalate(caseNumber, { ...body, version }), `Escalated to ${teamLabel(body.team)}. The server wrote the hand-off.`)} />
      )}
      {dialog === 'incident' && (
        <LinkIncidentDialog open onClose={() => setDialog(null)} busy={busy === 'incident'} incidents={incidents} current={incidentId}
          onSubmit={(body) => act('incident', () => client.linkIncident(caseNumber, { ...body, version }), 'Incident linked.')} />
      )}
      {dialog === 'resolve' && (
        <ResolveDialog open onClose={() => setDialog(null)} busy={busy === 'resolve'}
          onSubmit={(body) => act('resolve', () => client.resolve(caseNumber, { ...body, version }), 'Resolved. The player sees your summary and a "Did we get this handled?" prompt.').then((ok) => ok && setNextStatus(''))} />
      )}
      {dialog === 'action' && (
        <ActionRequestDialog open onClose={() => setDialog(null)} busy={busy === 'action'} canBilling={can['action.request.billing'] === true} preset={context.entitlement?.mismatchSuspected ? 'entitlement_repair' : 'account_recovery'}
          onSubmit={(body) => act('action', () => client.requestAction(caseNumber, body), 'Request recorded. It needs a lead to authorize it.')} />
      )}
      <p className="sp-muted sp-small sc-ws-foot">Opened <Ago at={c.createdAt} /> · updated <Ago at={c.updatedAt} /> · version {c.version ?? '—'}</p>
    </div>
  )
}
