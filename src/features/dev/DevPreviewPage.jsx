import { useCallback, useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import PlayerHome from '../home/PlayerHome'
import { useHomeView } from '../home/useHomeView'
import CrmPage from '../crm/CrmPage'
import { createDevCrmApi, createDevHomeApi, devFetch, DEV_SCENARIOS } from './devClient'
import './dev.css'

// DEV ONLY (never in production builds; see main.jsx). Renders real product
// surfaces against the local customer-success dev server, which runs the
// production Lambda code over fictional fixture data.
//   /__dev/home?as=paying_active
//   /__dev/crm, /__dev/crm/queue, /__dev/crm/players/<key>
export default function DevPreviewPage() {
  const splat = useParams()['*'] || ''
  const [params] = useSearchParams()
  const parts = splat.split('/').filter(Boolean)

  if (parts[0] === 'home') {
    const as = params.get('as') || 'paying_active'
    return <DevHome key={as} as={as} />
  }
  if (parts[0] === 'crm') {
    const playerKey = parts[1] === 'players' && parts[2] ? parts[2] : null
    return <DevCrm tab={parts[1] && parts[1] !== 'players' ? parts[1] : parts[1] === 'players' && !parts[2] ? 'players' : 'overview'} playerKey={playerKey} />
  }
  return (
    <div className="dev-index">
      <h1>Dev previews (fictional data)</h1>
      <h2>Player home</h2>
      <ul>
        {DEV_SCENARIOS.map((s) => <li key={s}><Link to={`/__dev/home?as=${s}`}>{s}</Link></li>)}
      </ul>
      <h2>Customer success CRM</h2>
      <ul><li><Link to="/__dev/crm">CRM overview (fictional admin)</Link></li></ul>
    </div>
  )
}

function DevHome({ as }) {
  const loader = useCallback(() => devFetch('/cs/me/home', as), [as])
  const state = useHomeView({ loader })
  const api = useMemo(() => createDevHomeApi(as), [as])
  return (
    <>
      <p className="dev-preview-banner">Dev preview · fictional scenario <strong>{as}</strong> · account actions disabled</p>
      <PlayerHome state={state} preview api={api} />
    </>
  )
}

function DevCrm({ tab, playerKey }) {
  const api = useMemo(() => createDevCrmApi(), [])
  return <CrmPage api={api} basePath="/__dev/crm" tab={tab} playerKey={playerKey} preview />
}
