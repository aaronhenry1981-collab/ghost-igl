import { useState } from 'react'
import SquadDemo from './SquadDemo.jsx'
import AccountApp from './AccountApp.jsx'
import { squadEndpoints } from './endpoint-config.mjs'
const endpoints = squadEndpoints(import.meta.env.VITE_SQUAD_API_BASE_URL, import.meta.env.VITE_SQUAD_WS_BASE_URL)
export default function SquadLauncher() {
  const [accountMode, setAccountMode] = useState(false)
  if (accountMode && endpoints) return <AccountApp endpoints={endpoints} onDemo={() => setAccountMode(false)} />
  return <><div className="sq-mode-bar"><span>{endpoints ? 'Private account test connection available' : 'Online squad backend is not connected in this demo build'}</span><button disabled={!endpoints} onClick={() => setAccountMode(true)}>Use existing Recon account</button></div><SquadDemo /></>
}
