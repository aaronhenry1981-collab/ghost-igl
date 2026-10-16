import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentUser, getSession } from '../lib/cognito'
import { coachSessionEntries } from '../lib/coachConnect'

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
    if (!window.opener) { setStatus('no-opener'); return }
    let canceled = false
    async function connect() {
      try {
        const user = getCurrentUser()
        const session = user ? await getSession(user) : null
        if (canceled) return
        const entries = coachSessionEntries(CLIENT_ID, user?.getUsername(), session)
        if (!entries) {
          window.opener.postMessage({ type: 'recon6-coach-connect-status', status: 'signed-out' }, COACH_ORIGIN)
          setStatus('signed-out')
          return
        }
        window.opener.postMessage({ type: 'recon6-coach-connect', entries }, COACH_ORIGIN)
        setStatus('sent')
      } catch {
        if (!canceled) setStatus('error')
      }
    }
    connect()
    return () => { canceled = true }
  }, [])

  const wrap = { maxWidth: 460, margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }
  if (status === 'sent') {
    return <div style={wrap}><h2>Sign-in sent to your coach</h2><p>Return to the coach and check the account shown beside sync. Sending your sign-in does not confirm that a match has uploaded.</p><p>After your session, open Progress to check for the saved review.</p><Link className="btn btn-primary" to="/progress">Open my progress</Link></div>
  }
  if (status === 'error') return <div style={wrap}><h2>Could not connect your account</h2><p>Your sign-in could not be refreshed. Sign in again, then use the sync button in your coach.</p><Link className="btn btn-primary" to="/auth?redirect=/coach-connect">Sign in again</Link></div>
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
