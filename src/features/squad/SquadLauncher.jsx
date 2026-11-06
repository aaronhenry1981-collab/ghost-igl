import { useEffect, useState } from 'react'
import SquadDemo from './SquadDemo.jsx'
import AccountApp from './AccountApp.jsx'
import { squadEndpoints } from './endpoint-config.mjs'
import { initialSquadMode, squadModePath } from './launch-mode.mjs'
const endpoints = squadEndpoints(import.meta.env.VITE_SQUAD_API_BASE_URL, import.meta.env.VITE_SQUAD_WS_BASE_URL)
const readMode = () => initialSquadMode({ configured: Boolean(endpoints), hash: window.location.hash })

export default function SquadLauncher() {
  const [mode, setMode] = useState(readMode)
  useEffect(() => {
    const changed = () => setMode(readMode())
    window.addEventListener('popstate', changed)
    window.addEventListener('hashchange', changed)
    return () => {
      window.removeEventListener('popstate', changed)
      window.removeEventListener('hashchange', changed)
    }
  }, [])
  function chooseMode(next) {
    const path = squadModePath(window.location, next)
    if (path !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.pushState(null, '', path)
    setMode(initialSquadMode({ configured: Boolean(endpoints), hash: next === 'demo' ? '#local-demo' : '' }))
  }
  if (mode === 'account' && endpoints) return <AccountApp endpoints={endpoints} onDemo={() => chooseMode('demo')} />
  return <><div className="sq-mode-bar"><span>{endpoints ? 'Local demo: same-browser simulation. Use your Recon account for the private online app.' : 'Online squad backend is not connected in this demo build'}</span><button disabled={!endpoints} onClick={() => chooseMode('account')}>Use existing Recon account</button></div><SquadDemo /></>
}
