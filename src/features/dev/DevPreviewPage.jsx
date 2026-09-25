import { useCallback } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import PlayerHome from '../home/PlayerHome'
import { useHomeView } from '../home/useHomeView'
import { devFetch, DEV_SCENARIOS } from './devClient'
import './dev.css'

// DEV ONLY (never in production builds; see main.jsx). Renders real product
// surfaces against the local customer-success dev server, which runs the
// production Lambda code over fictional fixture data.
//   /__dev/home?as=paying_active
export default function DevPreviewPage() {
  const { surface } = useParams()
  const [params] = useSearchParams()
  const as = params.get('as') || 'paying_active'

  if (surface === 'home') return <DevHome key={as} as={as} />
  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Dev previews (fictional data)</h1>
      <ul>
        {DEV_SCENARIOS.map((s) => <li key={s}><Link to={`/__dev/home?as=${s}`}>Player home: {s}</Link></li>)}
      </ul>
    </div>
  )
}

function DevHome({ as }) {
  const loader = useCallback(() => devFetch('/cs/me/home', as), [as])
  const state = useHomeView({ loader })
  return (
    <>
      <p className="dev-preview-banner">Dev preview · fictional scenario <strong>{as}</strong> · actions disabled</p>
      <PlayerHome state={state} preview />
    </>
  )
}
