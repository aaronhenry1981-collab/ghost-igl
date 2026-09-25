import { useId } from 'react'
import { HIDDEN_SOURCES, SOURCE_LABEL } from './crmFormat'

export function Badge({ tone = 'neutral', children, title }) {
  return <span className={`crm-badge crm-tone-${tone}`} title={title}>{children}</span>
}

const STAGE_TONE = { signed_up: 'neutral', activating: 'info', activated: 'info', engaged: 'ok', paid: 'ok', at_risk: 'warning', churned: 'muted' }
const HEALTH_TONE = { healthy: 'ok', needs_attention: 'info', at_risk: 'warning', critical: 'danger', dormant: 'muted', churned: 'muted', unknown: 'neutral' }
const PLAN_TONE = { free: 'neutral', pro: 'pro', elite: 'elite', champion: 'champion' }

export function StageBadge({ stage, label }) {
  return <Badge tone={STAGE_TONE[stage] || 'neutral'}>{label || stage}</Badge>
}

export function HealthBadge({ health, label }) {
  return <Badge tone={HEALTH_TONE[health] || 'neutral'}>{label || health}</Badge>
}

export function PlanBadge({ plan, label }) {
  return <Badge tone={PLAN_TONE[plan] || 'neutral'}>{label || plan || 'Unknown'}</Badge>
}

export function Kpi({ label, value, detail }) {
  return (
    <div className="crm-kpi">
      <span className="crm-kpi-label">{label}</span>
      <span className="crm-kpi-value">{value}</span>
      {detail && <span className="crm-kpi-detail">{detail}</span>}
    </div>
  )
}

export function Panel({ title, children, action = null, className = '' }) {
  const id = useId()
  return (
    <section className={`crm-panel ${className}`} aria-labelledby={id}>
      <header className="crm-panel-head">
        <h2 id={id}>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  )
}

export function Loading({ label = 'Loading…' }) {
  return <p className="crm-state" role="status">{label}</p>
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="crm-state crm-state-error" role="alert">
      <p>{error?.status === 403 ? 'Admin access required.' : error?.message || 'Could not load this view.'}</p>
      {onRetry && <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>Try again</button>}
    </div>
  )
}

export function Empty({ children }) {
  return <p className="crm-state crm-empty">{children}</p>
}

export function SourceStatus({ status }) {
  if (!status) return null
  const entries = Object.entries(status).filter(([name]) => !HIDDEN_SOURCES.has(name))
  const bad = entries.filter(([, s]) => s === 'unavailable')
  return (
    <div className="crm-sources">
      <span className="crm-sources-title">{bad.length ? `${bad.length} data source${bad.length === 1 ? '' : 's'} degraded` : 'All data sources read'}</span>
      <ul>
        {entries.map(([name, s]) => (
          <li key={name}>
            <Badge tone={s === 'ok' ? 'ok' : s === 'not_connected' ? 'neutral' : 'danger'}>{s === 'ok' ? 'OK' : s === 'not_connected' ? 'Not connected' : 'Unavailable'}</Badge>
            <span>{SOURCE_LABEL[name] || name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
