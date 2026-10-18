import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import DesktopSetup from '../components/DesktopSetup'
import { useSectionNavigate } from '../utils/sectionLink'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'

const DOWNLOAD_VERSION = import.meta.env.VITE_DOWNLOAD_VERSION || ''
const DOWNLOAD_FILENAME = import.meta.env.VITE_DOWNLOAD_FILENAME || ''

export default function DownloadPage() {
  const { user, plan, isAdmin, loading } = useAuth()
  const hasDesktopAccess = isAdmin || plan === 'pro' || plan === 'elite' || plan === 'champion'
  const navigate = useNavigate()
  const goToPricing = useSectionNavigate('pricing')
  const [downloadState, setDownloadState] = useState('idle')
  const [downloadError, setDownloadError] = useState(null)

  async function startSecureDownload() {
    setDownloadState('loading')
    setDownloadError(null)
    try {
      const cognitoUser = getCurrentUser()
      if (!cognitoUser) throw new Error('Please sign in again.')
      const session = await getSession(cognitoUser)
      const token = getIdToken(session)
      const res = await fetch(`${API_URL}/me/activation-token`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'desktop_download' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) throw new Error(data.error || 'Download is temporarily unavailable.')
      setDownloadState('ready')
      window.location.assign(data.url)
    } catch (err) {
      setDownloadState('error')
      setDownloadError(err.message || 'Download failed')
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?redirect=/download')
    }
  }, [loading, user, navigate])

  if (loading) {
    return (
      <div className="activate-page">
        <div className="activate-box"><p>Loading...</p></div>
      </div>
    )
  }

  if (!user) return null

  if (!hasDesktopAccess) {
    return (
      <div className="activate-page">
        <div className="activate-box">
          <div className="activate-header">
            <div className="activate-icon locked">🔒</div>
            <h1>Pro Membership Required</h1>
          </div>
          <p>
            <strong>Recon 6 Command Desktop</strong> is included with Pro, Elite, and Champion.
            Upgrade to unlock the Windows installer, activation token, and every web coaching tool.
          </p>
          <ul className="activate-feature-list">
            <li><strong>Now:</strong> full web access — strats, operators, VOD review, callouts</li>
            <li><strong>Beta:</strong> Windows desktop access; capture and voice depend on the installed build and verified source setup</li>



          </ul>
          <div className="activate-actions">
            <button type="button" onClick={goToPricing} className="btn btn-primary">See Pro Membership</button>
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
          <div className="activate-icon">⬇</div>
          <div>
            <div className="activate-eyebrow">{isAdmin ? 'Admin' : plan === 'champion' ? 'Champion' : plan === 'elite' ? 'Elite' : 'Pro'} · PC Beta</div>
            <h1>Recon 6 Command Desktop</h1>
          </div>
        </div>

        <>
            <p className="activate-intro">
              The Windows desktop beta for Rainbow Six Siege. Read the platform setup below before using capture or voice. A downloadable installer does not mean every beta feature has passed live gameplay testing.
            </p>
            <div className="download-card">
              <div className="download-meta">
                <div>
                  <div className="download-label">Latest Release</div>
                  <div className="download-version">{DOWNLOAD_VERSION || 'Current'}</div>
                </div>
              </div>
              <button type="button" onClick={startSecureDownload} disabled={downloadState === 'loading'} className="btn btn-primary btn-lg download-btn">
                {downloadState === 'loading' ? 'Preparing secure download…' : 'Download for Windows'}
              </button>
              <div className="download-filename">{DOWNLOAD_FILENAME || 'Recon-6-Command-2.0.4-x64.exe'}</div>
              {downloadError && <div className="activate-note" style={{ borderColor: '#7a2a2a', color: '#ffb4b4' }}>{downloadError}</div>}
            </div>
            <div
              className="activate-note"
              style={{
                marginTop: '1rem',
                borderColor: 'rgba(255,180,80,0.45)',
                background: 'rgba(255,180,80,0.08)',
              }}
            >
              <strong style={{ color: '#ffb450' }}>Heads up — Windows SmartScreen warning</strong>
              <p style={{ marginTop: '0.4rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                This beta installer is not code-signed. Windows may show a SmartScreen warning. Verify that you obtained it from this signed-in download page; contact Support if you are unsure before proceeding.
              </p>
            </div>
            <ol className="activate-steps">
              <li>Download the Windows installer and review the unsigned-app notice before running it.</li>
              <li>Launch <strong>Recon 6 Command</strong> from your Start menu or desktop shortcut.</li>
              <li>Go to <Link to="/activate">the activation page</Link> and copy your token.</li>
              <li>Paste the token into Recon 6 Command and click Activate.</li>
            </ol>
            <DesktopSetup />
            <div className="activate-footer">
              <div>
                <div className="activate-footer-label">Signed in as</div>
                <div className="activate-footer-value">{user.email}</div>
              </div>
              <Link to="/activate" className="btn btn-primary btn-sm">Get Activation Token →</Link>
            </div>
        </>
      </div>
    </div>
  )
}
