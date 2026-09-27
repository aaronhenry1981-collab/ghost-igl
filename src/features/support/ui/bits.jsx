import { Link } from 'react-router-dom'
import { fmtAgo, fmtStamp } from '../supportLogic.mjs'
import { highlightSegments } from '../helpText.mjs'

// Small shared pieces for the player portal, Help Center and staff console.

export function Chip({ tone = 'neutral', children, title, className = '' }) {
  return <span className={`sp-chip sp-tone-${tone} ${className}`} title={title}>{children}</span>
}

// Panel statuses from the diagnostics engine (diagnostics/shared.mjs PANEL_STATUS).
const PROVIDER_TONE = { ok: 'ok', degraded: 'warning', unavailable: 'danger', not_connected: 'muted', not_recorded: 'muted', not_available: 'muted', error: 'danger' }
const PROVIDER_LABEL = { ok: 'OK', degraded: 'Degraded', unavailable: 'Unavailable', not_connected: 'Not connected', not_recorded: 'Not recorded', not_available: 'Not available', error: 'Error' }

export function ProviderStatus({ status }) {
  return <Chip tone={PROVIDER_TONE[status] || 'neutral'}>{PROVIDER_LABEL[status] || status || 'Unknown'}</Chip>
}

export function Dot({ status }) {
  return <span className={`sp-dot sp-dot-${PROVIDER_TONE[status] || 'neutral'}`} aria-hidden="true" />
}

export function Ago({ at, fallback = 'not recorded' }) {
  const text = fmtAgo(at)
  if (!text) return <span className="sp-notrec">{fallback}</span>
  return <time dateTime={at} title={fmtStamp(at) || undefined}>{text}</time>
}

export function NotRecorded({ children = 'Not recorded' }) {
  return <span className="sp-notrec">{children}</span>
}

export function InferenceTag({ confidence }) {
  return (
    <span className="sp-inference-tag" title="Derived by a rule, not directly observed">
      Inference{confidence ? ` · ${typeof confidence === 'number' ? `${Math.round(confidence * 100)}%` : confidence}` : ''}
    </span>
  )
}

export function FactTag() {
  return <span className="sp-fact-tag">Fact</span>
}

export function Highlight({ text, query }) {
  return (
    <>
      {highlightSegments(text, query).map((s, i) => (s.match ? <mark key={i} className="sp-mark">{s.text}</mark> : <span key={i}>{s.text}</span>))}
    </>
  )
}

export function Skeleton({ lines = 3, label = 'Loading…' }) {
  return (
    <div className="sp-skeleton" aria-busy="true">
      <span className="sp-visually-hidden" role="status">{label}</span>
      {Array.from({ length: lines }, (_, i) => <span key={i} className="sp-skeleton-line" style={{ width: `${92 - i * 14}%` }} />)}
    </div>
  )
}

// "Round interrupted" recovery card: same tone as the app ErrorBoundary.
export function RoundInterrupted({ title = 'Round interrupted', message, onRetry, children }) {
  return (
    <div className="sp-interrupt" role="alert">
      <span className="sp-interrupt-code" aria-hidden="true">ERR</span>
      <div>
        <h3>{title}</h3>
        {message && <p>{message}</p>}
        <div className="sp-row">
          {onRetry && <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>Try again</button>}
          {children}
        </div>
      </div>
    </div>
  )
}

export function EmptyState({ title, children, action = null }) {
  return (
    <div className="sp-empty">
      <p className="sp-empty-title">{title}</p>
      {children && <p className="sp-empty-body">{children}</p>}
      {action}
    </div>
  )
}

export function SectionLabel({ index, children, id }) {
  return (
    <p className="sp-section-label" id={id}>
      {index && <span className="sp-section-index">{index}</span>}
      {children}
    </p>
  )
}

export function Breadcrumb({ to, children }) {
  return <Link to={to} className="sp-back">← {children}</Link>
}
