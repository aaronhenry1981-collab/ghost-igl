import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

// /coach-connect — one-click session handoff to the LOCAL coach app.
//
// The coach runs on localhost:5599, a different origin, so the browser walls
// it off from this site's Cognito session. Instead of making the user type
// their password again, the coach opens this page in a popup; we read our own
// Cognito tokens from localStorage and postMessage them to the coach, which
// stores them under identical keys — the auth library then just works there
// (including refresh). Tokens only ever travel browser→browser on the user's
// own machine, targeted strictly at the localhost origin.

const CLIENT_ID = '5bpa1cteenctoue24v4e245re8'
const COACH_ORIGIN = 'http://localhost:5599'

export default function CoachConnectPage() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    const prefix = `CognitoIdentityServiceProvider.${CLIENT_ID}.`
    const entries = {}
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith(prefix)) entries[k] = localStorage.getItem(k)
      }
    } catch { /* storage blocked */ }

    // One-shot mount handoff — terminal status per branch, no cascade possible.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!window.opener) { setStatus('no-opener'); return }

    if (!Object.keys(entries).length) {
      // Not signed in here — tell the coach immediately so it can guide the
      // user instead of waiting on a timeout.
      window.opener.postMessage({ type: 'recon6-coach-connect-status', status: 'signed-out' }, COACH_ORIGIN)
      setStatus('signed-out')
      return
    }

    window.opener.postMessage({ type: 'recon6-coach-connect', entries }, COACH_ORIGIN)
    setStatus('sent')
    setTimeout(() => { try { window.close() } catch { /* browser refused */ } }, 1200)
  }, [])

  const wrap = { maxWidth: 460, margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }
  if (status === 'sent') {
    return <div style={wrap}><h2>Coach connected ✓</h2><p>This window will close itself.</p></div>
  }
  if (status === 'signed-out') {
    return (
      <div style={wrap}>
        <h2>Sign in first</h2>
        <p>Sign in to your RECON6 account, then click the sync button on the coach again.</p>
        <Link to="/auth?redirect=/coach-connect" className="btn btn-primary" style={{ marginTop: 12 }}>Sign in</Link>
      </div>
    )
  }
  if (status === 'no-opener') {
    return (
      <div style={wrap}>
        <h2>Open this from the coach</h2>
        <p>This page hands your login to the local coach app — click the ☁ sync button on the coach page to use it.</p>
      </div>
    )
  }
  return <div style={wrap}><p>Connecting…</p></div>
}
