import { NavLink } from 'react-router-dom'
import CrmOverview from './CrmOverview'
import CrmQueue from './CrmQueue'
import CrmPlayers from './CrmPlayers'
import CrmPlayerRecord from './CrmPlayerRecord'
import CrmBilling from './CrmBilling'
import { CRM_TABS } from './crmTabs'
import './Crm.css'

// Recon customer-success CRM shell. `api` is injected (live Cognito-backed
// client, or the dev fixture client) so the same screens render either way.
export default function CrmPage({ api, basePath, tab = 'overview', playerKey = null, preview = false }) {
  const tabs = CRM_TABS
  const current = playerKey ? 'players' : tab
  const active = tabs.find((t) => t.id === current) || tabs[0]

  return (
    <div className="crm">
      <header className="crm-header">
        <div>
          <p className="crm-eyebrow">Recon 6 · Customer success{preview ? ' · fictional preview data' : ''}</p>
          <h1 className="crm-title">{playerKey ? 'Player record' : active.label}</h1>
        </div>
        {!preview && <NavLink to="/admin" className="btn btn-ghost btn-sm">Admin console</NavLink>}
      </header>

      <nav className="crm-tabs" aria-label="Customer success sections">
        <ul>
          {tabs.map((t) => (
            <li key={t.id}>
              <NavLink to={`${basePath}/${t.id}`} className={() => `crm-tab${t.id === current ? ' is-active' : ''}`} aria-current={t.id === current ? 'page' : undefined}>
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {!api.configured ? (
        <section className="crm-panel" role="status">
          <h2>Customer-success API not configured</h2>
          <p>This deployment has no <code>VITE_CUSTOMER_SUCCESS_API_URL</code>. Deploy the isolated stack in <code>aws/customer-success-template.yaml</code> after approval, then set the URL from its output. The rest of the admin console is unaffected.</p>
        </section>
      ) : (
        <div className="crm-body">
          {playerKey ? <CrmPlayerRecord key={playerKey} api={api} basePath={basePath} playerKey={playerKey} />
            : current === 'overview' ? <CrmOverview api={api} basePath={basePath} />
              : current === 'queue' ? <CrmQueue api={api} basePath={basePath} />
                : current === 'billing' ? <CrmBilling api={api} basePath={basePath} />
                  : <CrmPlayers key={current} api={api} basePath={basePath} variant={active.variant || 'players'} />}
        </div>
      )}
    </div>
  )
}
