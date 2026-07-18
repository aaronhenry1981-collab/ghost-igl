import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSectionNavigate } from '../utils/sectionLink'

const DOWNLOAD_URL = import.meta.env.VITE_DOWNLOAD_URL || ''
const DOWNLOAD_VERSION = import.meta.env.VITE_DOWNLOAD_VERSION || ''
const DOWNLOAD_FILENAME = import.meta.env.VITE_DOWNLOAD_FILENAME || ''
// A URL alone is not proof that the app is ready to ship. Production must
// explicitly opt in after the installer and activation flow are verified.
const DESKTOP_APP_RELEASED = import.meta.env.VITE_DESKTOP_APP_RELEASED === 'true'
const ACTIVE_DOWNLOAD_URL = DESKTOP_APP_RELEASED ? DOWNLOAD_URL : ''

// Everything both platforms get â€” console is never the lesser tier, it just
// reaches the live coach through a capture card instead of native capture.
const SHARED_FEATURES = [
  'Live voice-first AI coaching',
  'Ban / pick, site setup, drone planner, operators hub',
  'Real-time team strat board for your 5-stack',
  'AI VOD review + session trends',
  'Everything on r6coaching.com',
]
// PC-only because the coach runs on the same machine as the game. now=shipped,
// now:false = on the roadmap (labelled honestly, never sold as live).
const PC_EXTRAS = [
  { t: 'Native window & region capture â€” no capture-card latency', now: true },
  { t: 'Sharper map / site / ban / operator recognition from a clean render', now: true },
  { t: 'On-screen overlay HUD â€” callouts, timer and site setup on your game screen', now: true },
  { t: 'Global hotkeys â€” overlay, mute, re-brief, mark-clip, record (while in-game)', now: true },
  { t: 'One-key session recording + auto-clips â€” no capture card, no OBS', now: true },
  { t: 'Auto game-window detection â€” no manual region boxing', now: true },
]

function PlatformSplit() {
  const card = {
    flex: '1 1 300px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
    padding: '1.1rem 1.2rem', background: 'rgba(255,255,255,0.02)',
  }
  const tag = (now) => ({
    fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
    padding: '2px 7px', borderRadius: 5, marginLeft: 8, whiteSpace: 'nowrap',
    background: now ? 'rgba(53,210,154,0.16)' : 'rgba(255,180,80,0.16)',
    color: now ? '#35d29a' : '#ffb450',
  })
  return (
    <div style={{ marginTop: '1.25rem' }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>PC vs console</div>
      <p style={{ fontSize: '0.88rem', color: 'rgba(230,233,239,0.7)', marginBottom: 12 }}>
        Console gets the full coach through a capture card â€” nothing is held back. PC just <em>also</em> gets
        the things that are only possible when the coach runs on the same machine as your game.
      </p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ ...card, borderColor: 'rgba(0,229,255,0.4)' }}>
          <div style={{ fontWeight: 700, color: '#00e5ff', marginBottom: 8 }}>PC â€” native</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.88rem', lineHeight: 1.7 }}>
            {SHARED_FEATURES.map((f) => <li key={f}>âœ“ {f}</li>)}
            {PC_EXTRAS.map((f) => (
              <li key={f.t}>
                <span style={{ color: '#00e5ff' }}>ï¼‹</span> {f.t}
                <span style={tag(f.now)}>{f.now ? 'Now' : 'Soon'}</span>
              </li>
            ))}
          </ul>
        </div>
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Console â€” capture card</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.88rem', lineHeight: 1.7 }}>
            {SHARED_FEATURES.map((f) => <li key={f}>âœ“ {f}</li>)}
            <li style={{ color: 'rgba(230,233,239,0.6)', marginTop: 6 }}>
              Live coaching runs off your HDMI capture feed â€” fully supported, first-class.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

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
            <div className="activate-icon locked">ðŸ”’</div>
            <h1>Champion â€” Founding Member</h1>
          </div>
          {isPro && (
            <p className="activate-note" style={{ marginBottom: '1rem' }}>
              You're on the <strong>Pro</strong> plan. Desktop live coaching is still in development
              and is not currently part of an upgrade you can use today.
            </p>
          )}
          <p>
            <strong>Recon 6 Command Desktop</strong> is still in development. There is no public
            installer or announced release date. The web features listed on pricing are live now.
          </p>
          <ul className="activate-feature-list">
            <li><strong>Now:</strong> full web access â€” strats, operators, VOD review, callouts</li>
            <li><strong>Planned:</strong> desktop live coaching and voice callouts</li>
          </ul>
          <div className="activate-actions">
            <button type="button" onClick={goToPricing} className="btn btn-primary">Compare Web Plans</button>
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
          <div className="activate-icon">â¬‡</div>
          <div>
            <div className="activate-eyebrow">Champion Â· Desktop App</div>
            <h1>Recon 6 Command Desktop</h1>
          </div>
        </div>

        {ACTIVE_DOWNLOAD_URL ? (
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
                href={ACTIVE_DOWNLOAD_URL}
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
              <strong style={{ color: '#ffb450' }}>Heads up â€” Windows SmartScreen warning</strong>
              <p style={{ marginTop: '0.4rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                This installer isn't code-signed yet (we're working on it). When you run it,
                Windows will probably show a blue "Windows protected your PC" screen. Click
                <strong> "More info" â†’ "Run anyway"</strong> to install. The app is safe â€” it's the
                same r6coaching.com Champion subscription you already paid for, just packaged for
                desktop.
              </p>
            </div>
            <ol className="activate-steps">
              <li>Download and run the installer (click "More info â†’ Run anyway" if SmartScreen pops up).</li>
              <li>Launch <strong>Recon 6 Command</strong> from your Start menu or desktop shortcut.</li>
              <li>Go to <Link to="/activate">the activation page</Link> and copy your token.</li>
              <li>Paste the token into Recon 6 Command and click Activate.</li>
            </ol>
            <PlatformSplit />
            <div className="activate-footer">
              <div>
                <div className="activate-footer-label">Signed in as</div>
                <div className="activate-footer-value">{user.email}</div>
              </div>
              <Link to="/activate" className="btn btn-primary btn-sm">Get Activation Token â†’</Link>
            </div>
          </>
        ) : (
          <>
            <div className="activate-eyebrow" style={{ color: '#ff9b5c', marginBottom: '0.5rem' }}>
              Desktop app not currently available
            </div>
            <p className="activate-intro">
              Recon 6 Command is still in development. There is no public installer or announced
              release date. Your subscription's current benefits are the web features below.
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

