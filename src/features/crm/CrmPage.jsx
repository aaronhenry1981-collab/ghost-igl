import { lazy, Suspense, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import CrmOverview from './CrmOverview'
import CrmQueue from './CrmQueue'
import CrmPlayers from './CrmPlayers'
import CrmPlayerRecord from './CrmPlayerRecord'
import CrmBilling from './CrmBilling'
import CrmConversations from './CrmConversations'
import CrmFeedback from './CrmFeedback'
import CrmReviews from './CrmReviews'
import { CRM_TABS } from './crmTabs'
import { Loading } from './crmUi'
import './Crm.css'

// Support Command Center: its own chunk, loaded only on the Support tab.
const SupportCommand = lazy(() => import('../support/staff/SupportCommand'))

// Recon customer-success CRM shell. `api` is injected (live Cognito-backed
// client, or the dev fixture client) so the same screens render either way.
export default function CrmPage({ api, basePath, tab = 'overview', playerKey = null, preview = false, support = null, embedded = false }) {
  // In the admin shell, Support has its own sidebar entry and sub-navigation.
  const tabs = embedded ? CRM_TABS.filter((t) => t.id !== 'support') : CRM_TABS
  const current = playerKey ? 'players' : tab
  const active = CRM_TABS.find((t) => t.id === current) || CRM_TABS[0]
  const title = playerKey ? 'Player record' : embedded && current === 'overview' ? 'Customer success' : active.label
  useEffect(() => {
    if (embedded) document.title = `${title} · Recon 6 Admin`
  }, [embedded, title])

  return (
    <div className="crm">
      {embedded ? (
        // Inside the admin shell: the shell supplies navigation, so this is
        // just the standard admin page header.
        <header className="ax-page-header crm-embedded-header">
          <div className="ax-page-header__text">
            <p className="ax-eyebrow">{current === 'support' ? 'Support' : current === 'overview' ? 'Overview' : 'Customer success'}{preview ? ' · fictional preview data' : ''}</p>
            <h1 className="ax-page-title">{title}</h1>
          </div>
        </header>
      ) : (
        <header className="crm-header">
          <div>
            <p className="crm-eyebrow">Recon 6 · Customer success{preview ? ' · fictional preview data' : ''}</p>
            <h1 className="crm-title">{title}</h1>
          </div>
          {!preview && <NavLink to="/admin" className="btn btn-ghost btn-sm">Admin console</NavLink>}
        </header>
      )}

      {!(embedded && current === 'support') && <nav className="crm-tabs" aria-label="Customer success sections">
        <ul>
          {tabs.map((t) => (
            <li key={t.id}>
              <NavLink to={`${basePath}/${t.id}`} className={() => `crm-tab${t.id === current ? ' is-active' : ''}`} aria-current={t.id === current ? 'page' : undefined}>
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>}

      {!api.configured ? (
        <section className="crm-panel" role="status">
          <h2>Customer-success API not configured</h2>
          <p>This deployment has no <code>VITE_CUSTOMER_SUCCESS_API_URL</code>. Deploy the isolated stack in <code>aws/customer-success-template.yaml</code> after approval, then set the URL from its output. The rest of the admin console is unaffected.</p>
        </section>
      ) : (
        <div className="crm-body">
          {playerKey ? <CrmPlayerRecord key={playerKey} api={api} basePath={basePath} playerKey={playerKey} />
            : current === 'support' ? <Suspense fallback={<Loading />}><SupportCommand api={api} basePath={basePath} path={support?.path || ''} keep={support?.keep || null} /></Suspense>
            : current === 'overview' ? <CrmOverview api={api} basePath={basePath} />
              : current === 'queue' ? <CrmQueue api={api} basePath={basePath} />
                : current === 'billing' ? <CrmBilling api={api} basePath={basePath} />
                  : current === 'conversations' ? <CrmConversations api={api} basePath={basePath} />
                    : current === 'feedback' ? <CrmFeedback api={api} basePath={basePath} />
                      : current === 'reviews' ? <CrmReviews api={api} basePath={basePath} />
                  : <CrmPlayers key={current} api={api} basePath={basePath} variant={active.variant || 'players'} />}
        </div>
      )}
    </div>
  )
}
