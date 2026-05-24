import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSectionNavigate } from '../utils/sectionLink'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'
import './ActivatePage.css'

export default function ActivatePage() {
  const { user, isAdmin, plan: userPlan, loading } = useAuth()
  const navigate = useNavigate()
  const goToPricing = useSectionNavigate('pricing')
  const [token, setToken] = useState('')
  const [tokenError, setTokenError] = useState(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [tokenExpiresAt, setTokenExpiresAt] = useState(null)
  const [copied, setCopied] = useState(false)

  const isChampion = isAdmin || userPlan === 'champion'

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?redirect=/activate')
    }
  }, [loading, user, navigate])

  // Fetch a server-signed activation token. Replaces the old client-side
  // base64 trick — the new HMAC-signed token can't be forged by anyone who
  // happens to know a Champion's email.
  useEffect(() => {
    if (!user || !isChampion || !API_URL) {
      setToken('')
      setTokenError(null)
      return
    }
    let cancelled = false
    async function fetchToken() {
      setTokenLoading(true)
      setTokenError(null)
      try {
        const cognitoUser = getCurrentUser()
        if (!cognitoUser) throw new Error('Not signed in')
        const session = await getSession(cognitoUser)
        const idToken = getIdToken(session)
        const res = await fetch(`${API_URL}/me/activation-token`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
          body: '{}',
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
        if (cancelled) return
        setToken(data.token || '')
        setTokenExpiresAt(data.expires_at || null)
      } catch (err) {
        if (cancelled) return
        setTokenError(err.message || 'Could not generate activation token')
        setToken('')
      } finally {
        if (!cancelled) setTokenLoading(false)
      }
    }
    fetchToken()
    return () => { cancelled = true }
  }, [user, isChampion])

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

  if (!isChampion) {
    return (
      <div className="activate-page">
        <div className="activate-box">
          <div className="activate-header">
            <div className="activate-icon locked">🔒</div>
            <h1>Champion Only</h1>
          </div>
          <p>
            The <strong>Recon 6 Command</strong> desktop app is exclusive to <strong>Champion</strong>{' '}
            subscribers. Upgrade to unlock live capture-based coaching, team sessions, and voice guidance.
          </p>
          <div className="activate-actions">
            <button type="button" onClick={goToPricing} className="btn btn-primary">Upgrade to Champion</button>
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
            <h1>Activate Recon 6 Command</h1>
          </div>
        </div>

        <p className="activate-intro">
          Copy the token below and paste it into the <strong>Recon 6 Command</strong> desktop app to
          activate your license.
        </p>

        {tokenError && (
          <div className="activate-note" style={{ borderColor: '#7a2a2a', background: 'rgba(160,40,40,0.12)', color: '#ffb4b4', marginBottom: '1rem' }}>
            <strong>Couldn't generate a token:</strong> {tokenError}
            <br />
            Try refreshing the page. If it keeps failing, email <a href="mailto:support@r6coaching.com">support@r6coaching.com</a>.
          </div>
        )}

        <ol className="activate-steps">
          <li>
            <strong>Open Recon 6 Command</strong> on your Windows PC (download the latest installer from{' '}
            <Link to="/download">the download page</Link>).
          </li>
          <li>On the activation screen, paste this token:</li>
        </ol>

        <div className="activate-token-row">
          <textarea
            id="activation-token-area"
            readOnly
            value={tokenLoading ? 'Generating signed token…' : token}
            className="activate-token"
            rows={4}
          />
          <button onClick={copyToken} className="btn btn-primary activate-copy" disabled={!token || tokenLoading}>
            {copied ? '✓ Copied' : tokenLoading ? 'Loading…' : 'Copy Token'}
          </button>
        </div>

        {tokenExpiresAt && (
          <div className="activate-footer-label" style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>
            Token expires {new Date(tokenExpiresAt).toLocaleDateString()} — generate a new one if you reinstall the app after that.
          </div>
        )}

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
