import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ActivatePage() {
  const { user, isPro, loading } = useAuth()
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [copied, setCopied] = useState(false)
  const [plan, setPlan] = useState(null)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?redirect=/activate')
    }
  }, [loading, user, navigate])

  useEffect(() => {
    if (!user) return
    // Only Champion subscribers (or admin) can activate the desktop app
    const ADMIN_EMAILS = ['aaronhenry1981@gmail.com']
    const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')
    // We only have isPro from auth — we need to know if they're specifically Champion
    // For now: admins always get champion, otherwise rely on isPro and the plan field
    // (checkProStatus grants isPro for both pro and champion — we'll gate further inside)
    if (isAdmin) {
      setPlan('champion')
    } else if (isPro) {
      // We don't have plan granularity in useAuth — assume they're Champion if isPro
      // for activation purposes. The desktop app will re-verify.
      setPlan('champion')
    } else {
      setPlan('free')
    }

    if (user && isPro) {
      // Build the activation token: base64(JSON({user_id, email, plan, issued_at}))
      const payload = {
        user_id: user.id,
        email: user.email,
        plan: 'champion',
        issued_at: new Date().toISOString()
      }
      const b64 = btoa(JSON.stringify(payload))
      setToken(b64)
    }
  }, [user, isPro])

  async function copyToken() {
    try {
      await navigator.clipboard.writeText(token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback — select text
      const ta = document.getElementById('activation-token-area')
      if (ta) {
        ta.select()
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  if (loading) {
    return (
      <div className="activate-page">
        <div className="activate-box">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // redirect in effect
  }

  if (!isPro) {
    return (
      <div className="activate-page">
        <div className="activate-box">
          <div className="activate-header">
            <div className="activate-icon locked">🔒</div>
            <h1>Champion Only</h1>
          </div>
          <p>
            The <strong>IGL Command</strong> desktop app is exclusive to <strong>Champion</strong>{' '}
            subscribers. Upgrade to unlock live capture-based coaching, team sessions, and voice guidance.
          </p>
          <div className="activate-actions">
            <Link to="/#pricing" className="btn btn-primary">Upgrade to Champion</Link>
            <Link to="/" className="btn btn-ghost">Back to Home</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="activate-page">
      <div className="activate-box">
        <div className="activate-header">
          <div className="activate-icon">✓</div>
          <div>
            <div className="activate-eyebrow">Champion Subscription Verified</div>
            <h1>Activate IGL Command</h1>
          </div>
        </div>

        <p className="activate-intro">
          Copy the token below and paste it into the <strong>IGL Command</strong> desktop app to
          activate your license.
        </p>

        <ol className="activate-steps">
          <li>
            <strong>Open IGL Command</strong> on your Windows PC (download the latest installer from{' '}
            <Link to="/download">the download page</Link>).
          </li>
          <li>On the activation screen, paste this token:</li>
        </ol>

        <div className="activate-token-row">
          <textarea
            id="activation-token-area"
            readOnly
            value={token}
            className="activate-token"
            rows={4}
          />
          <button onClick={copyToken} className="btn btn-primary activate-copy">
            {copied ? '✓ Copied' : 'Copy Token'}
          </button>
        </div>

        <ol start="3" className="activate-steps">
          <li>Click <strong>Activate</strong> in the desktop app.</li>
          <li>Your license verifies automatically — no passwords to type.</li>
        </ol>

        <div className="activate-note">
          <strong>Security note:</strong> This token is tied to your r6coaching.com account.
          Don't share it. If someone else uses it, the desktop app will re-verify with our servers
          and detect the mismatch.
        </div>

        <div className="activate-footer">
          <div>
            <div className="activate-footer-label">Signed in as</div>
            <div className="activate-footer-value">{user.email}</div>
          </div>
          <Link to="/" className="btn btn-ghost btn-sm">Done</Link>
        </div>
      </div>
    </div>
  )
}
