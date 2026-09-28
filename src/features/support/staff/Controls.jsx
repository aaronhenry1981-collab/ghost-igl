import { useId, useState } from 'react'
import { ACTION_KINDS, auditDetailText, BILLING_ACTION_KINDS, buildHandoffPreview, fmtBytes, RESOLUTION_CODES, TEAMS } from '../supportLogic.mjs'
import { Ago, Chip, NotRecorded } from '../ui/bits'
import { Dialog } from '../ui/Dialog'

function Field({ label, children, id, hint }) {
  return (
    <div className="sc-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <p className="sp-muted sp-small">{hint}</p>}
    </div>
  )
}

export function EscalateDialog({ open, onClose, onSubmit, busy, detail, preset }) {
  const [team, setTeam] = useState(preset?.team || 'billing')
  const [reason, setReason] = useState(preset?.reason || '')
  const ids = { team: useId(), reason: useId(), preview: useId() }
  // Preview only: the server builds and stores the real hand-off.
  const handoff = buildHandoffPreview({ caseRecord: detail?.case, team, reason, copilot: detail?.copilot, diagnostics: detail?.diagnostics?.panels || [] })
  return (
    <Dialog
      open={open}
      onClose={onClose}
      wide
      title="Escalate with a hand-off"
      footer={(
        <>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy || !reason.trim()} onClick={() => onSubmit({ team, reason: reason.trim() })}>{busy ? 'Escalating…' : `Escalate to ${TEAMS.find((t) => t.id === team)?.label}`}</button>
        </>
      )}
    >
      <div className="sc-form-grid">
        <Field label="Team" id={ids.team}>
          <select id={ids.team} className="sp-input" value={team} onChange={(e) => setTeam(e.target.value)} data-autofocus>
            {TEAMS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Why escalate?" id={ids.reason} hint="Required. The specialist reads this first.">
          <textarea id={ids.reason} className="sp-textarea" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={600} />
        </Field>
      </div>
      <p className="sc-subhead" id={ids.preview}>Hand-off preview (the server writes the stored hand-off from the case record)</p>
      <pre className="sc-handoff" aria-labelledby={ids.preview} tabIndex={0}>{handoff}</pre>
    </Dialog>
  )
}

export function LinkIncidentDialog({ open, onClose, onSubmit, busy, incidents = [], current }) {
  const [id, setId] = useState(current || incidents.find((i) => i.status !== 'resolved')?.incidentId || '')
  const selId = useId()
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Link an incident"
      footer={(
        <>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy || !id} onClick={() => onSubmit({ incidentId: id })}>{busy ? 'Linking…' : 'Link incident'}</button>
        </>
      )}
    >
      {incidents.length ? (
        <Field label="Incident" id={selId}>
          <select id={selId} className="sp-input" value={id} onChange={(e) => setId(e.target.value)} data-autofocus>
            {incidents.map((i) => <option key={i.incidentId} value={i.incidentId}>{i.title} ({i.status})</option>)}
          </select>
        </Field>
      ) : <p className="sp-muted">No incidents to link.</p>}
    </Dialog>
  )
}

export function ResolveDialog({ open, onClose, onSubmit, busy }) {
  const [summary, setSummary] = useState('')
  const [code, setCode] = useState('answered')
  const [learning, setLearning] = useState({ avoidable: false, docGap: false, onboardingGap: false, bug: false, featureRequest: false })
  const ids = { summary: useId(), code: useId() }
  const flags = [['avoidable', 'Avoidable'], ['docGap', 'Help article missing'], ['onboardingGap', 'Onboarding gap'], ['bug', 'Bug'], ['featureRequest', 'Feature request']]
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Resolve case"
      footer={(
        <>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy || !summary.trim()} onClick={() => onSubmit({ summary: summary.trim(), code, learning })}>{busy ? 'Saving…' : 'Mark resolved'}</button>
        </>
      )}
    >
      <Field label="What fixed it?" id={ids.summary} hint="The player sees this summary with the Resolved status, so write it for them. No refund, credit or timing promises.">
        <textarea id={ids.summary} className="sp-textarea" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={2000} data-autofocus />
      </Field>
      <Field label="Resolution code" id={ids.code}>
        <select id={ids.code} className="sp-input" value={code} onChange={(e) => setCode(e.target.value)}>
          {RESOLUTION_CODES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
      </Field>
      <fieldset className="sc-checks">
        <legend>Learning</legend>
        {flags.map(([k, l]) => (
          <label key={k}><input type="checkbox" checked={learning[k]} onChange={(e) => setLearning((s) => ({ ...s, [k]: e.target.checked }))} /> {l}</label>
        ))}
      </fieldset>
    </Dialog>
  )
}

// Billing kinds (entitlement repair, cancellation, refund) need the billing
// role; the server refuses them otherwise, so they are not offered.
export function ActionRequestDialog({ open, onClose, onSubmit, busy, preset = 'entitlement_repair', canBilling = false }) {
  const kinds = ACTION_KINDS.filter((a) => canBilling || !BILLING_ACTION_KINDS.includes(a.id))
  const [kind, setKind] = useState(kinds.some((a) => a.id === preset) ? preset : kinds[0]?.id)
  const [reason, setReason] = useState('')
  const ids = { kind: useId(), reason: useId() }
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Request action (needs authorization)"
      footer={(
        <>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy || !reason.trim()} onClick={() => onSubmit({ kind, reason: reason.trim() })}>{busy ? 'Requesting…' : 'Submit request'}</button>
        </>
      )}
    >
      <p className="sp-note sp-note-warn">This records a request only. A different lead or admin (never the person who asked) authorizes it, and a person makes the change in the billing, identity or account system. Both steps are audited.</p>
      <Field label="Action" id={ids.kind}>
        <select id={ids.kind} className="sp-input" value={kind} onChange={(e) => setKind(e.target.value)} data-autofocus>
          {kinds.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
      </Field>
      <Field label="Reason and evidence" id={ids.reason}>
        <textarea id={ids.reason} className="sp-textarea" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
      </Field>
    </Dialog>
  )
}

const SCAN_TONE = { clean: 'ok', pending: 'info', blocked: 'danger', not_uploaded: 'muted' }

// Attachment manifests: { attId, name, mime, size, scanState, objectKey,
// createdAt } (never the bytes).
export function Attachments({ items = [], uploads }) {
  return (
    <div>
      {uploads && uploads.enabled === false && <p className="sp-note sp-note-warn">Uploads are off: {uploads.reason || 'attachment storage is not provisioned.'} Players are asked to describe issues in words.</p>}
      {items.length ? (
        <ul className="sc-mini">
          {items.map((a) => (
            <li key={a.attId || a.id}>
              <span className="sc-wrap">{a.name}</span>
              <span className="sp-muted sp-small">{a.mime} · {fmtBytes(a.size)}</span>
              <Chip tone={SCAN_TONE[a.scanState] || 'muted'}>{String(a.scanState || 'unscanned').replace(/_/g, ' ')}</Chip>
            </li>
          ))}
        </ul>
      ) : <p className="sp-muted sp-small">No attachments on this case.</p>}
    </div>
  )
}

const REQ_TONE = { requested: 'warning', authorized: 'info', done_externally: 'ok', rejected: 'muted' }

// { requestId, kind, reason, requiredVerification, status, history[],
// executesInSupport: false }. Support never performs the action.
export function ActionRequests({ items = [] }) {
  if (!items.length) return <p className="sp-muted sp-small">No action requests.</p>
  return (
    <ul className="sc-mini sc-requests">
      {items.map((r) => {
        const last = (r.history || [])[r.history.length - 1]
        return (
          <li key={r.requestId}>
            <span>{ACTION_KINDS.find((k) => k.id === r.kind)?.label || r.kind}</span>
            <Chip tone={REQ_TONE[r.status] || 'muted'}>{String(r.status).replace(/_/g, ' ')}</Chip>
            {last && <span className="sp-muted sp-small sc-wrap">{String(last.status).replace(/_/g, ' ')} by {last.by} <Ago at={last.at} /></span>}
            <span className="sp-muted sp-small sc-wrap sc-line">{r.requiredVerification ? `Needs: ${r.requiredVerification}` : ''}</span>
          </li>
        )
      })}
    </ul>
  )
}

// Audit entries: { id, at, actor, action, detail } (ids and kinds only).
export function AuditHistory({ items = [], me = null }) {
  if (!items.length) return <NotRecorded>No audit entries</NotRecorded>
  return (
    <ol className="sc-audit">
      {items.slice().reverse().map((a) => (
        <li key={a.id}>
          <Ago at={a.at} />
          <span className="sp-mono sc-audit-action">{String(a.action).replace(/^support\./, '')}</span>
          <span className="sc-wrap">{auditDetailText(a.detail)}</span>
          <span className="sp-muted sp-small sc-wrap">{a.actor === me ? 'you' : a.actor}</span>
        </li>
      ))}
    </ol>
  )
}
