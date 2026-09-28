import { useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ATTACHMENT_TYPES,
  bucketForStatus,
  categoryLabel,
  createClientRequestId,
  csatLabel,
  detectSensitive,
  diagnosticsRows,
  fmtStamp,
  isResolvedLike,
  MESSAGE_MAX,
  playerActions,
  playerStatusLabel,
  playerTimeline,
  sensitiveWarning,
  validateAttachment,
  validateMessage,
} from '../supportLogic.mjs'
import { errorMessage, isNotEnabled, isUploadDisabled } from '../supportApi'
import { useSupportResource } from '../useSupportResource'
import { Ago, Breadcrumb, Chip, Dot, EmptyState, RoundInterrupted, Skeleton } from '../ui/bits'
import Csat from './Csat'

const BUCKET_TONE = { waiting_on_me: 'warning', open: 'accent', waiting_on_recon: 'info', resolved: 'ok', closed: 'muted' }

// /support/cases/:caseNumber: one coherent timeline, reply, confirm/reopen, CSAT.
// The API returns the player projection flat (API-CONTRACT.md): case fields
// + actions {canMessage, canConfirmResolved, canReopen, canRate} + timeline
// + attachments + uploads {enabled, reason} + diagnostics {panels}.
export default function CaseTimeline({ api, caseNumber, paths }) {
  const res = useSupportResource(api, 'getCase', caseNumber)
  const navigate = useNavigate()
  const composerRef = useRef(null)
  const [reply, setReply] = useState('')
  const [requestId, setRequestId] = useState(() => createClientRequestId())
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const ids = { reply: useId(), file: useId(), hint: useId() }

  if (res.status === 'loading') return <div className="sp-case"><Breadcrumb to={paths.support()}>Player Command</Breadcrumb><Skeleton lines={6} label="Loading case…" /></div>
  if (res.status === 'error') {
    const notFound = res.error?.status === 404 && !isNotEnabled(res.error)
    return (
      <div className="sp-case">
        <Breadcrumb to={paths.support()}>Player Command</Breadcrumb>
        {notFound ? (
          <EmptyState title={`No case ${caseNumber} on your account`}>Check the number, or find it under My Support.</EmptyState>
        ) : (
          <RoundInterrupted message={errorMessage(res.error, "Couldn't load this case.")} onRetry={res.reload} />
        )}
      </div>
    )
  }
  if (res.status !== 'ready') return null

  const c = res.data.case || res.data || {}
  const actions = c.actions || {}
  const timeline = playerTimeline(c.timeline)
  const seeRows = diagnosticsRows(c.diagnostics)
  const panelsSeen = [...new Set(seeRows.map((r) => r.panelTitle))]
  const todo = playerActions(c.diagnostics)
  const uploadsOn = c.uploads?.enabled === true
  const bucket = bucketForStatus(c.status)
  const replyError = validateMessage(reply)
  const sensitive = sensitiveWarning(detectSensitive(reply))

  async function run(kind, fn, okNotice) {
    setBusy(kind)
    setError(null)
    setNotice(null)
    try {
      const out = await fn()
      if (okNotice) setNotice(okNotice)
      res.reload()
      return out
    } catch (err) {
      setError(errorMessage(err))
      return null
    } finally {
      setBusy(null)
    }
  }

  async function sendReply(e) {
    e.preventDefault()
    if (replyError) { setError(replyError); composerRef.current?.focus(); return }
    const out = await run('reply', () => api.sendMessage(caseNumber, { text: reply.trim(), clientRequestId: requestId }), 'Sent. Recon sees it now.')
    if (!out) return
    setReply('')
    setRequestId(createClientRequestId())
    // A reply to a closed case opens a new linked case ({ linkedCaseNumber }).
    const next = out.linkedCaseNumber
    if (next && next !== caseNumber) navigate(paths.caseUrl(next), { state: { followUpOf: caseNumber } })
  }

  async function attach(file) {
    const err = validateAttachment(file, 0)
    if (err) { setError(err); return }
    setBusy('attach')
    setError(null)
    setNotice(null)
    try {
      const out = await api.requestAttachment(caseNumber, { name: file.name, mime: file.type, size: file.size })
      if (isUploadDisabled(out)) setNotice("Uploads aren't switched on yet. Describe what you see in a reply instead.")
      else setNotice('Upload started.')
    } catch (e2) {
      if (isUploadDisabled(e2)) setNotice("Uploads aren't switched on yet. Describe what you see in a reply instead.")
      else setError(errorMessage(e2))
    } finally {
      setBusy(null)
    }
  }

  const focusComposer = () => composerRef.current?.focus()

  return (
    <div className="sp-case">
      <Breadcrumb to={paths.support()}>Player Command</Breadcrumb>
      <header className="sp-case-head">
        <div className="sp-case-id">
          <span className="sp-case-no">{c.caseNumber}</span>
          <Chip tone={BUCKET_TONE[bucket]}>{playerStatusLabel(c.status)}</Chip>
          {c.linkedFromCaseNumber && <Link to={paths.caseUrl(c.linkedFromCaseNumber)} className="sp-chip sp-tone-muted sp-chip-link">Follow-up to {c.linkedFromCaseNumber}</Link>}
          {(c.linkedCaseNumbers || []).map((n) => <Link key={n} to={paths.caseUrl(n)} className="sp-chip sp-tone-info sp-chip-link">Continued in {n}</Link>)}
        </div>
        <h1 className="sp-case-title">{c.subject}</h1>
        <p className="sp-muted sp-small">{categoryLabel(c.category)} · opened <Ago at={c.createdAt} fallback="—" /> · updated <Ago at={c.updatedAt} fallback="—" /></p>
      </header>

      {c.status === 'waiting_on_player' && (
        <div className="sp-callout sp-callout-warn">
          <div>
            <p className="sp-callout-title">Your move</p>
            <p>Recon asked you something below. Reply and the case goes straight back to us.</p>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={focusComposer}>Reply</button>
        </div>
      )}
      {c.status === 'resolved' && (
        <div className="sp-callout sp-callout-ok">
          <div>
            <p className="sp-callout-title">Recon marked this resolved</p>
            {c.resolution?.summary && <p>{c.resolution.summary}</p>}
            <p>Working now? Confirm and we&apos;ll close it.{actions.canReopen ? " Still broken? Reopen and tell us what's off." : ' Still broken? Reply below and we open a follow-up.'}</p>
          </div>
          <div className="sp-row">
            {actions.canConfirmResolved && <button type="button" className="btn btn-primary btn-sm" disabled={Boolean(busy)} onClick={() => run('confirm', () => api.confirmResolved(caseNumber), 'Closed. Good to hear.')}>{busy === 'confirm' ? 'Saving…' : 'This fixed it'}</button>}
            {actions.canReopen && <button type="button" className="btn btn-ghost btn-sm" disabled={Boolean(busy)} onClick={async () => { const ok = await run('reopen', () => api.reopen(caseNumber), 'Reopened. Tell us what is still off.'); if (ok) focusComposer() }}>{busy === 'reopen' ? 'Saving…' : 'Still broken'}</button>}
          </div>
        </div>
      )}

      <div className="sp-case-grid">
        <section className="sp-panel sp-comms" aria-label="Case timeline">
          <p className="sp-hud-label">Comms log</p>
          <ol className="sp-timeline">
            {timeline.map((e) => <TimelineEvent key={e.id} e={e} />)}
          </ol>

          <form className="sp-composer" onSubmit={sendReply} noValidate>
            <label htmlFor={ids.reply} className="sp-label">{c.status === 'closed' ? 'Need more help?' : 'Reply'}</label>
            {c.status === 'closed' && <p id={ids.hint} className="sp-muted sp-small">This case is closed. Sending opens a follow-up case linked to this one.</p>}
            <textarea
              id={ids.reply}
              ref={composerRef}
              className="sp-textarea"
              rows={3}
              maxLength={MESSAGE_MAX}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={c.status === 'waiting_on_player' ? 'Answer here…' : 'Add detail or ask a question…'}
              aria-describedby={c.status === 'closed' ? ids.hint : undefined}
            />
            {sensitive && <p className="sp-note sp-note-danger" role="alert">{sensitive}</p>}
            <div className="sp-composer-actions">
              {uploadsOn ? (
                <>
                  <input id={ids.file} type="file" className="sp-visually-hidden" accept={ATTACHMENT_TYPES.join(',')} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) attach(f) }} />
                  <label htmlFor={ids.file} className="sp-attach-btn">{busy === 'attach' ? 'Checking…' : '+ Screenshot'}</label>
                </>
              ) : (
                <span className="sp-muted sp-small" title={c.uploads?.reason || undefined}>Screenshots aren&apos;t switched on yet. Describe what you see instead.</span>
              )}
              <button type="submit" className="btn btn-primary btn-sm" disabled={Boolean(busy)}>{busy === 'reply' ? 'Sending…' : c.status === 'closed' ? 'Open follow-up' : 'Send reply'}</button>
            </div>
          </form>
          <div aria-live="polite">
            {notice && <p className="sp-note sp-note-ok">{notice}</p>}
          </div>
          {error && <p className="sp-note sp-note-danger" role="alert">{error}</p>}
        </section>

        <aside className="sp-case-side">
          {isResolvedLike(c.status) && (actions.canRate || c.csat) && <Csat api={api} caseNumber={caseNumber} existing={c.csat} onDone={res.reload} />}
          <section className="sp-panel">
            <p className="sp-hud-label">What we can see</p>
            {seeRows.length ? (
              <div className="sp-seegroups">
                {panelsSeen.map((title) => (
                  <div key={title} className="sp-seegroup">
                    <p className="sp-seegroup-title">{title}</p>
                    <ul className="sp-seelist">
                      {seeRows.filter((r) => r.panelTitle === title).map((r) => <li key={r.id}><Dot status={r.status} />{r.text}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            ) : <p className="sp-muted sp-small">No account checks attached to this case.</p>}
            <p className="sp-muted sp-small">Recon checks these for you, so you don&apos;t have to explain them.</p>
          </section>
          {todo.length > 0 && (
            <section className="sp-panel">
              <p className="sp-hud-label">You can try</p>
              <ul className="sp-seelist sp-todo">{todo.map((t) => <li key={t}>{t}</li>)}</ul>
            </section>
          )}
          <section className="sp-panel">
            <p className="sp-hud-label">Case</p>
            <dl className="sp-dl">
              <dt>Number</dt><dd className="sp-mono">{c.caseNumber}</dd>
              <dt>Area</dt><dd>{categoryLabel(c.category)}</dd>
              <dt>Opened</dt><dd>{fmtStamp(c.createdAt) || '—'}</dd>
              {c.csat?.rating && <><dt>Your rating</dt><dd>{csatLabel(c.csat.rating)}</dd></>}
            </dl>
          </section>
        </aside>
      </div>
    </div>
  )
}

// Player events: { id, kind, at, author: 'you' | 'Recon 6 support' | 'Recon 6',
// body, channel?, status?, rating?, attachment? }.
function TimelineEvent({ e }) {
  const role = e.author === 'you' ? 'player' : e.kind === 'status_change' || e.kind === 'system' ? 'system' : 'recon'
  if (e.kind === 'status_change') {
    return (
      <li className="sp-tl sp-tl-system">
        <span className="sp-tl-line">
          {e.status === 'closed' && e.author === 'you' ? 'You confirmed the fix. Closed.' : `Status: ${playerStatusLabel(e.status)}`}
          {e.body ? ` · ${e.body}` : ''}
        </span>
        <Ago at={e.at} fallback="" />
      </li>
    )
  }
  if (e.kind === 'csat') {
    return (
      <li className="sp-tl sp-tl-system">
        <span className="sp-tl-line">You rated this: {csatLabel(e.rating)}{e.body ? ` · “${e.body}”` : ''}</span>
        <Ago at={e.at} fallback="" />
      </li>
    )
  }
  if (e.kind === 'attachment') {
    return (
      <li className="sp-tl sp-tl-system">
        <span className="sp-tl-line">Attachment: {e.attachment?.name || 'file'}</span>
        <Ago at={e.at} fallback="" />
      </li>
    )
  }
  if (e.kind === 'system') {
    return (
      <li className="sp-tl sp-tl-system">
        <span className="sp-tl-line">{e.body}</span>
        <Ago at={e.at} fallback="" />
      </li>
    )
  }
  return (
    <li className={`sp-tl sp-tl-${role}`}>
      <div className="sp-tl-meta">
        <span className={`sp-tl-badge sp-tl-badge-${role}`} aria-hidden="true">{role === 'player' ? 'YOU' : 'R6'}</span>
        <span className="sp-tl-author">{role === 'player' ? 'You' : 'Recon support'}</span>
        {e.channel === 'email' && <span className="sp-tl-channel">by email</span>}
        <Ago at={e.at} fallback="" />
      </div>
      <p className="sp-tl-text">{e.body}</p>
    </li>
  )
}
