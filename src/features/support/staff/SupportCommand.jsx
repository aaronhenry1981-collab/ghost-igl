import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { queueViewOrDefault } from '../supportLogic.mjs'
import { createSupportClient, transportFromCrmApi } from '../supportApi'
import SupportQueue from './SupportQueue'
import CaseWorkspace from './CaseWorkspace'
import { IncidentDetail, IncidentList } from './Incidents'
import Metrics from './Metrics'
import EmailReview from './EmailReview'
import '../support.css'
import './command.css'

const SECTIONS = [
  { id: '', label: 'Queue' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'email', label: 'Email review' },
]

// Support Command Center inside the PR #24 CRM console (/admin/crm/support/*).
// `api` is the CRM's injected client; `api.support` (dev preview) overrides
// the transport with fictional fixtures. `keep` carries dev query params.
export default function SupportCommand({ api, basePath, path = '', keep = null }) {
  const client = useMemo(() => api.support || createSupportClient(transportFromCrmApi(api)), [api])
  const [params, setParams] = useSearchParams()
  const parts = String(path || '').split('/').filter(Boolean)
  const base = `${basePath}/support`

  const to = (sub = '', query = {}) => {
    const q = new URLSearchParams({ ...(keep || {}), ...query })
    const s = q.toString()
    return `${base}${sub ? `/${sub}` : ''}${s ? `?${s}` : ''}`
  }

  const section = parts[0] === 'cases' && parts[1] ? 'case'
    : parts[0] === 'incidents' ? (parts[1] ? 'incident' : 'incidents')
      : parts[0] === 'metrics' ? 'metrics'
        : parts[0] === 'email' ? 'email'
          : 'queue'
  const activeTop = section === 'case' || section === 'queue' ? '' : section === 'incident' ? 'incidents' : section
  const view = queueViewOrDefault(params.get('view'))

  function onView(next) {
    setParams((prev) => {
      const n = new URLSearchParams(prev)
      n.set('view', next)
      return n
    }, { replace: true })
  }

  return (
    <div className="sc">
      <nav className="sc-subnav" aria-label="Support sections">
        {SECTIONS.map((s) => (
          <Link key={s.id || 'queue'} to={to(s.id)} className={`sc-subnav-link${activeTop === s.id ? ' is-active' : ''}`} aria-current={activeTop === s.id ? 'page' : undefined}>{s.label}</Link>
        ))}
      </nav>
      {section === 'queue' && <SupportQueue client={client} view={view} onView={onView} to={to} />}
      {section === 'case' && (
        <CaseWorkspace
          key={parts[1]}
          client={client}
          caseNumber={decodeURIComponent(parts[1])}
          to={to}
          playerHref={(key) => (key && !keep ? `${basePath}/players/${encodeURIComponent(key)}` : null)}
          articleHref={(slug) => (keep ? `/__dev/help/${slug}?${new URLSearchParams(keep)}` : `/help/${slug}`)}
        />
      )}
      {section === 'incidents' && <IncidentList client={client} to={to} />}
      {section === 'incident' && <IncidentDetail key={parts[1]} client={client} id={decodeURIComponent(parts[1])} to={to} />}
      {section === 'metrics' && <Metrics client={client} />}
      {section === 'email' && <EmailReview client={client} to={to} />}
    </div>
  )
}
