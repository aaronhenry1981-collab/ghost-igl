import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ATTACHMENT_TYPES,
  CATEGORIES,
  categoryLabel,
  createClientRequestId,
  detectSensitive,
  diagnosticsRows,
  fmtBytes,
  MAX_ATTACHMENTS,
  pickAnswers,
  playerStatusLabel,
  sensitiveWarning,
  TEXT_MAX,
  TRIAGE_MIN_CHARS,
  validateAttachment,
  validateCaseDraft,
} from '../supportLogic.mjs'
import { errorMessage, isUploadDisabled } from '../supportApi'
import { Chip, Dot } from '../ui/bits'

const EXAMPLES = ['My Pro tools are locked after I paid', 'VOD review spun forever and never finished', 'Rank on Road to Champion looks wrong']

// Natural-language entry → live triage → case. Asks only what triage says the
// system can't already see. Triage response (API-CONTRACT.md):
// { suggestedCategory, confidence, intent, questions: [{ id, prompt, why }],
//   diagnosticsPreview: { panels: [...] }, helpArticles: [{ slug, title, summary }] }
// Questions are free text and optional: the server never marks one required.
export default function GetHelp({ api, paths, initialText = '', initialCategory = null, source = null, onCreated }) {
  const [text, setText] = useState(initialText)
  const [override, setOverride] = useState(initialCategory)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [triage, setTriage] = useState({ status: 'idle', data: null })
  const [answers, setAnswers] = useState({})
  const [files, setFiles] = useState([])
  const [fileError, setFileError] = useState(null)
  const [showErrors, setShowErrors] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [created, setCreated] = useState(null)
  const [requestId, setRequestId] = useState(() => createClientRequestId())
  const textRef = useRef(null)
  const ids = { text: useId(), hint: useId(), err: useId(), live: useId(), file: useId(), cats: useId() }

  const trimmed = text.trim()
  const canTriage = trimmed.length >= TRIAGE_MIN_CHARS

  useEffect(() => {
    if (!api || !canTriage) return undefined
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setTriage((s) => ({ status: 'loading', data: s.data }))
      // `source` (e.g. "help:vod") is where the player came from; the API
      // accepts it as context.page.
      api.triage({ text: trimmed, category: override || undefined, context: source ? { page: source } : undefined }, { signal: controller.signal })
        .then((data) => setTriage({ status: 'ready', data }))
        .catch((err) => { if (err?.name !== 'AbortError') setTriage((s) => ({ status: 'error', data: s.data })) })
    }, 600)
    return () => { clearTimeout(timer); controller.abort() }
  }, [api, trimmed, canTriage, override, source])

  const data = canTriage ? triage.data : null
  const category = override || data?.suggestedCategory || null
  const questions = data?.questions || []
  // One line per diagnostics panel ("Plan: Elite", "Ubisoft: linked…").
  const preview = diagnosticsRows(data?.diagnosticsPreview, { perPanel: 1 })
  const articles = data?.helpArticles || []
  const validation = validateCaseDraft({ text, questions, answers })
  const sensitive = sensitiveWarning(detectSensitive(text))

  const liveText = !canTriage ? ''
    : triage.status === 'loading' && !data ? 'Checking your account…'
      : data ? `Looks like ${categoryLabel(category)}. ${questions.length ? `${questions.length} quick question${questions.length === 1 ? '' : 's'}.` : 'Nothing else to ask.'}${articles.length ? ` ${articles.length} help article${articles.length === 1 ? '' : 's'} might fix it.` : ''}`
        : ''

  function onText(e) {
    const v = e.target.value
    setText(v)
    if (v.trim().length < TRIAGE_MIN_CHARS) setTriage({ status: 'idle', data: null })
  }

  function addFiles(list) {
    setFileError(null)
    const next = [...files]
    for (const f of list) {
      const err = validateAttachment(f, next.length)
      if (err) { setFileError(`${f.name}: ${err}`); continue }
      next.push({ id: `${f.name}-${f.size}-${f.lastModified}`, file: f, name: f.name, size: f.size, type: f.type })
    }
    setFiles(next)
  }

  async function uploadAll(caseNumber, staged) {
    const results = []
    for (const f of staged) {
      try {
        const res = await api.requestAttachment(caseNumber, { name: f.name, mime: f.type, size: f.size })
        // { status: 'upload_disabled' } while storage is off; with it on,
        // { status: 'manifest_recorded', attachment, upload } where `upload`
        // stays null until a presign route exists (nothing is uploaded).
        if (isUploadDisabled(res)) { results.push({ name: f.name, outcome: 'disabled' }); continue }
        if (res?.upload?.url) {
          const put = await fetch(res.upload.url, { method: 'PUT', headers: { 'Content-Type': f.type, ...(res.upload.headers || {}) }, body: f.file })
          results.push({ name: f.name, outcome: put.ok ? 'uploaded' : 'failed' })
        } else {
          results.push({ name: f.name, outcome: res?.status === 'manifest_recorded' ? 'disabled' : 'failed' })
        }
      } catch (err) {
        results.push({ name: f.name, outcome: isUploadDisabled(err) ? 'disabled' : 'failed' })
      }
    }
    return results
  }

  async function submit(e) {
    e.preventDefault()
    setSubmitError(null)
    if (!validation.ok) {
      setShowErrors(true)
      if (validation.errors.text) textRef.current?.focus()
      else document.querySelector('[data-question-error="true"] input')?.focus()
      return
    }
    setSubmitting(true)
    try {
      const res = await api.createCase({ text: trimmed, category: category || 'other', answers: pickAnswers(questions, answers), context: source ? { page: source } : undefined, clientRequestId: requestId })
      const c = res?.case || res
      const staged = files
      setCreated({ ...c, attachments: [] })
      setText('')
      setAnswers({})
      setFiles([])
      setOverride(null)
      setTriage({ status: 'idle', data: null })
      setShowErrors(false)
      setRequestId(createClientRequestId())
      onCreated?.(c)
      if (staged.length) {
        const results = await uploadAll(c.caseNumber, staged)
        setCreated((prev) => (prev && prev.caseNumber === c.caseNumber ? { ...prev, attachments: results } : prev))
      }
    } catch (err) {
      setSubmitError(errorMessage(err, "Couldn't send that. Your text is still here, try again."))
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    const disabled = created.attachments.filter((a) => a.outcome === 'disabled')
    const failed = created.attachments.filter((a) => a.outcome === 'failed')
    return (
      <div className="sp-created" role="status">
        <p className="sp-created-kicker">Case filed</p>
        <p className="sp-created-number">{created.caseNumber}</p>
        <p className="sp-created-subject">{created.subject}</p>
        <p className="sp-muted">Status: <strong>{playerStatusLabel(created.status)}</strong>. Replies land here and on the case page. No need to email as well.</p>
        {disabled.length > 0 && (
          <p className="sp-note sp-note-warn">
            {disabled.length === 1 ? `${disabled[0].name} wasn't attached` : `${disabled.length} files weren't attached`}: uploads aren&apos;t switched on yet. Describe what you saw in a reply instead.
          </p>
        )}
        {failed.length > 0 && <p className="sp-note sp-note-danger">{failed.map((f) => f.name).join(', ')} didn&apos;t upload. Your case is still filed.</p>}
        <div className="sp-row">
          <Link to={paths.caseUrl(created.caseNumber)} className="btn btn-primary btn-sm">Open case</Link>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCreated(null)}>Report something else</button>
        </div>
      </div>
    )
  }

  const textInvalid = showErrors && validation.errors.text
  return (
    <form className="sp-gethelp" onSubmit={submit} noValidate>
      <label htmlFor={ids.text} className="sp-label-big">What&apos;s going on?</label>
      <p id={ids.hint} className="sp-muted sp-small">Say it how you&apos;d say it to a teammate. We already see your plan, linked accounts and recent data.</p>
      <div className={`sp-input-frame${textInvalid ? ' is-invalid' : ''}`}>
        <textarea
          id={ids.text}
          ref={textRef}
          className="sp-textarea"
          rows={4}
          value={text}
          onChange={onText}
          maxLength={TEXT_MAX}
          placeholder="e.g. Paid for Pro this morning but Match Prep still says upgrade"
          aria-describedby={`${ids.hint}${textInvalid ? ` ${ids.err}` : ''}`}
          aria-invalid={textInvalid ? 'true' : undefined}
        />
        <span className="sp-counter" aria-hidden="true">{text.length}/{TEXT_MAX}</span>
      </div>
      {textInvalid && <p id={ids.err} className="sp-field-error">{validation.errors.text}</p>}
      {sensitive && <p className="sp-note sp-note-danger" role="alert">{sensitive}</p>}
      {!trimmed && (
        <div className="sp-examples" aria-label="Examples">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="sp-example" onClick={() => setText(ex)}>{ex}</button>
          ))}
        </div>
      )}

      <p id={ids.live} className="sp-visually-hidden" aria-live="polite">{liveText}</p>

      {canTriage && (
        <div className="sp-triage" aria-busy={triage.status === 'loading'}>
          <div className="sp-triage-head">
            <span className="sp-hud-label">Issue area</span>
            {category ? (
              <Chip tone="accent" className="sp-cat-chip">{categoryLabel(category)}</Chip>
            ) : (
              <span className="sp-muted sp-small">{triage.status === 'error' ? 'Auto-sort is down. Pick one.' : 'Reading…'}</span>
            )}
            {data && !override && data.confidence !== undefined && data.confidence < 0.5 && <span className="sp-muted sp-small">Best guess</span>}
            <button type="button" className="sp-linkbtn" aria-expanded={pickerOpen} aria-controls={ids.cats} onClick={() => setPickerOpen((v) => !v)}>
              {pickerOpen ? 'Done' : 'Change'}
            </button>
          </div>
          {pickerOpen && (
            <fieldset id={ids.cats} className="sp-cat-picker">
              <legend className="sp-visually-hidden">Issue area</legend>
              {[...new Set(CATEGORIES.map((c) => c.group))].map((group) => (
                <div key={group} className="sp-cat-group">
                  <span className="sp-cat-group-label">{group}</span>
                  <div className="sp-pills">
                    {CATEGORIES.filter((c) => c.group === group).map((c) => (
                      <label key={c.id} className={`sp-pill${category === c.id ? ' is-on' : ''}`}>
                        <input type="radio" name={`${ids.cats}-cat`} value={c.id} checked={category === c.id} onChange={() => { setOverride(c.id); setPickerOpen(false) }} />
                        <span>{c.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </fieldset>
          )}

          {preview.length > 0 && (
            <div className="sp-cansee">
              <span className="sp-hud-label">We can see</span>
              <ul>
                {preview.map((p) => <li key={p.id}><Dot status={p.status} />{p.text}{p.ago ? <span className="sp-muted"> · {p.ago}</span> : null}</li>)}
              </ul>
            </div>
          )}

          {questions.length > 0 && (
            <div className="sp-questions">
              <span className="sp-hud-label">Only what we can&apos;t see</span>
              {questions.map((q) => <Question key={q.id} q={q} value={answers[q.id]} error={showErrors ? validation.errors.answers?.[q.id] : null} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />)}
            </div>
          )}
          {data && questions.length === 0 && <p className="sp-muted sp-small">Nothing else to ask. We have what we need to start.</p>}

          {articles.length > 0 && (
            <div className="sp-suggest">
              <span className="sp-hud-label">Might fix it now</span>
              <ul>
                {articles.map((a) => (
                  <li key={a.slug}><Link to={paths.article(a.slug)} className="sp-suggest-link">{a.title}<span aria-hidden="true"> →</span></Link></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="sp-attach">
        <input id={ids.file} type="file" className="sp-visually-hidden" multiple accept={ATTACHMENT_TYPES.join(',')} onChange={(e) => { addFiles([...e.target.files]); e.target.value = '' }} disabled={files.length >= MAX_ATTACHMENTS} />
        <label htmlFor={ids.file} className={`sp-attach-btn${files.length >= MAX_ATTACHMENTS ? ' is-disabled' : ''}`}>+ Screenshot or file</label>
        <span className="sp-muted sp-small">Optional · up to {MAX_ATTACHMENTS} · sent after your case is filed</span>
        {fileError && <p className="sp-field-error" role="alert">{fileError}</p>}
        {files.length > 0 && (
          <ul className="sp-files">
            {files.map((f) => (
              <li key={f.id}>
                <span className="sp-file-name">{f.name}</span>
                <span className="sp-muted sp-small">{fmtBytes(f.size)}</span>
                <button type="button" className="sp-linkbtn" onClick={() => setFiles((l) => l.filter((x) => x.id !== f.id))} aria-label={`Remove ${f.name}`}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {submitError && <p className="sp-note sp-note-danger" role="alert">{submitError}</p>}
      <div className="sp-submit-row">
        <button type="submit" className="btn btn-primary" disabled={submitting || !api}>{submitting ? 'Sending…' : 'Send to Recon'}</button>
        <span className="sp-muted sp-small">You get a case number instantly.</span>
      </div>
    </form>
  )
}

// Server questions are { id, prompt, why } free text. `kind`/`options`/
// `required` are optional extras the server does not send today.
function Question({ q, value, error, onChange }) {
  const id = useId()
  if (q.kind === 'choice' || q.kind === 'yesno') {
    const options = q.kind === 'yesno' && !q.options ? [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] : q.options || []
    return (
      <fieldset className="sp-question" data-question-error={error ? 'true' : undefined} aria-describedby={error ? `${id}-err` : undefined}>
        <legend>{q.prompt}{!q.required && <span className="sp-muted"> (optional)</span>}</legend>
        <div className="sp-pills">
          {options.map((o) => {
            const v = typeof o === 'string' ? o : o.value
            const l = typeof o === 'string' ? o : o.label
            return (
              <label key={v} className={`sp-pill${value === v ? ' is-on' : ''}`}>
                <input type="radio" name={id} value={v} checked={value === v} onChange={() => onChange(v)} />
                <span>{l}</span>
              </label>
            )
          })}
        </div>
        {error && <p id={`${id}-err`} className="sp-field-error">{error}</p>}
      </fieldset>
    )
  }
  return (
    <div className="sp-question" data-question-error={error ? 'true' : undefined}>
      <label htmlFor={id}>{q.prompt}{!q.required && <span className="sp-muted"> (optional)</span>}</label>
      {q.why && <p id={`${id}-why`} className="sp-muted sp-small sp-why">{q.why}</p>}
      <input id={id} className="sp-input" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={q.placeholder || ''} maxLength={200} aria-invalid={error ? 'true' : undefined} aria-describedby={[q.why ? `${id}-why` : null, error ? `${id}-err` : null].filter(Boolean).join(' ') || undefined} />
      {error && <p id={`${id}-err`} className="sp-field-error">{error}</p>}
    </div>
  )
}
