import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSectionNavigate } from '../utils/sectionLink'

const DOWNLOAD_URL = import.meta.env.VITE_DOWNLOAD_URL || ''
const DOWNLOAD_VERSION = import.meta.env.VITE_DOWNLOAD_VERSION || ''
const DOWNLOAD_FILENAME = import.meta.env.VITE_DOWNLOAD_FILENAME || ''

export default function DownloadPage() {
  const { user, isPro, plan, isAdmin, loading } = useAuth()
  const isChampion = plan === 'champion' || isAdmin
  const navigate = useNavigate()
  const goToPricing = useSectionNavigate('pricing')

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

  if (!isChampion) {
    return (
      <div className="activate-page">
        <div className="activate-box">
          <div className="activate-header">
            <div className="activate-icon locked">🔒</div>
            <h1>Champion — Founding Member</h1>
          </div>
          {isPro && (
            <p className="activate-note" style={{ marginBottom: '1rem' }}>
              You're on the <strong>Pro</strong> plan. The desktop app is a Champion-tier feature —
              upgrade from your <Link to="/account">Account</Link> page to lock in your founding-member
              spot. Champions get the signed installer by email as soon as it ships.
            </p>
          )}
          <p>
            <strong>Recon 6 Command Desktop</strong> is in <strong>final pre-release</strong>. Champion
            subscribers are queued for the signed installer the moment it's ready — web features are
            live right now.
          </p>
          <ul className="activate-feature-list">
            <li><strong>Now:</strong> full web access — strats, operators, VOD review, callouts</li>
            <li><strong>Early access:</strong> live capture coaching from PC or console (capture card)</li>
            <li><strong>Early access:</strong> voice-first TTS callouts while you play</li>
            <li><strong>Early access:</strong> real-time shared strat board for your full stack</li>
            <li><strong>Early access:</strong> VOD review with timeline tagging</li>
          </ul>
          <div className="activate-actions">
            <button type="button" onClick={goToPricing} className="btn btn-primary">Lock in Champion</button>
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
            <div className="activate-eyebrow">Champion · Desktop App</div>
            <h1>Recon 6 Command Desktop</h1>
          </div>
        </div>

        {DOWNLOAD_URL ? (
          <>
            <p className="activate-intro">
              Your real-time coach for Rainbow Six Siege. Install on your Windows PC, capture your PC
              gameplay or your console feed, and get live voice coaching plus team coordination.
            </p>
            <div className="download-card">
              <div className="download-meta">
                <div>
                  <div className="download-label">Latest Release</div>
                  <div className="download-version">{DOWNLOAD_VERSION || 'Current'}</div>
                </div>
              </div>
              <a
                href={DOWNLOAD_URL}
                className="btn btn-primary btn-lg download-btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download for Windows
              </a>
              {DOWNLOAD_FILENAME && <div className="download-filename">{DOWNLOAD_FILENAME}</div>}
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
                This installer isn't code-signed yet (we're working on it). When you run it,
                Windows will probably show a blue "Windows protected your PC" screen. Click
                <strong> "More info" → "Run anyway"</strong> to install. The app is safe — it's the
                same r6coaching.com Champion subscription you already paid for, just packaged for
                desktop.
              </p>
            </div>
            <ol className="activate-steps">
              <li>Download and run the installer (click "More info → Run anyway" if SmartScreen pops up).</li>
              <li>Launch <strong>Recon 6 Command</strong> from your Start menu or desktop shortcut.</li>
              <li>Go to <Link to="/activate">the activation page</Link> and copy your token.</li>
              <li>Paste the token into Recon 6 Command and click Activate.</li>
            </ol>
            <div className="activate-footer">
              <div>
                <div className="activate-footer-label">Signed in as</div>
                <div className="activate-footer-value">{user.email}</div>
              </div>
              <Link to="/activate" className="btn btn-primary btn-sm">Get Activation Token →</Link>
            </div>
          </>
        ) : (
          <>
            <div className="activate-eyebrow" style={{ color: '#ff9b5c', marginBottom: '0.5rem' }}>
              Final pre-release — installer shipping soon
            </div>
            <p className="activate-intro">
              <strong>Your Champion spot is locked in.</strong> The signed Windows installer is in
              final pre-release — we'll email it to you the moment it's ready, along with the
              activation steps. Until then, your subscription gives you full Pro-level web access.
            </p>

            <div className="activate-note" style={{ marginTop: '1rem' }}>
              <strong>What you already have today:</strong>
              <ul className="activate-feature-list" style={{ marginTop: '0.5rem' }}>
                <li>Full map strats, site setups, operator loadouts</li>
                <li>Round-by-round VOD breakdowns from screenshots</li>
                <li>Enemy predictions and ban recommendations</li>
                <li>Web callout maps and utility breakdowns</li>
              </ul>
            </div>

            <div className="activate-note" style={{ marginTop: '1rem' }}>
              <strong>What ships in early access:</strong>
              <ul className="activate-feature-list" style={{ marginTop: '0.5rem' }}>
                <li>Live capture coaching (PC window/display or console via capture card)</li>
                <li>Voice-first TTS callouts during matches</li>
                <li>Real-time shared strat board across your 5-stack</li>
                <li>Local session brain (SQLite) that learns your patterns</li>
              </ul>
            </div>

            <div className="activate-actions" style={{ marginTop: '1.5rem' }}>
              <Link to="/strats" className="btn btn-primary">Start Using Web Features</Link>
              <Link to="/" className="btn btn-ghost">Back to Home</Link>
            </div>

            <div className="activate-footer">
              <div>
                <div className="activate-footer-label">Signed in as</div>
                <div className="activate-footer-value">{user.email}</div>
              </div>
              <div className="activate-footer-label">
                Questions? <a href="mailto:support@r6coaching.com">support@r6coaching.com</a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
