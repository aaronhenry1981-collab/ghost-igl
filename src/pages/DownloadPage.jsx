import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSectionNavigate } from '../utils/sectionLink'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'

const DOWNLOAD_VERSION = import.meta.env.VITE_DOWNLOAD_VERSION || ''
const DOWNLOAD_FILENAME = import.meta.env.VITE_DOWNLOAD_FILENAME || ''

// Everything both platforms get — console is never the lesser tier, it just
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
//
// All false until the installer is actually downloadable. "Now" has to mean
// "you can have this today" — while no installer exists, a customer cannot get
// any of these, so labelling them shipped is selling something we don't hand over.
const PC_EXTRAS = [
  { t: 'Native window & region capture — no capture-card latency', now: true },
  { t: 'Sharper map / site / ban / operator recognition from a clean render', now: true },
  { t: 'On-screen overlay HUD — callouts, timer and site setup on your game screen', now: true },
  { t: 'Global hotkeys — overlay, mute, re-brief, mark-clip, record (while in-game)', now: true },
  { t: 'One-key session recording + auto-clips — no capture card, no OBS', now: true },
  { t: 'Auto game-window detection — no manual region boxing', now: true },
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
        Console gets the full coach through a capture card — nothing is held back. PC just <em>also</em> gets
        the things that are only possible when the coach runs on the same machine as your game.
      </p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ ...card, borderColor: 'rgba(0,229,255,0.4)' }}>
          <div style={{ fontWeight: 700, color: '#00e5ff', marginBottom: 8 }}>PC — native</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.88rem', lineHeight: 1.7 }}>
            {SHARED_FEATURES.map((f) => <li key={f}>✓ {f}</li>)}
            {PC_EXTRAS.map((f) => (
              <li key={f.t}>
                <span style={{ color: '#00e5ff' }}>＋</span> {f.t}
                <span style={tag(f.now)}>{f.now ? 'Now' : 'Soon'}</span>
              </li>
            ))}
          </ul>
        </div>
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Console — capture card</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.88rem', lineHeight: 1.7 }}>
            {SHARED_FEATURES.map((f) => <li key={f}>✓ {f}</li>)}
            <li style={{ color: 'rgba(230,233,239,0.6)', marginTop: 6 }}>
              Live coaching runs off your HDMI capture feed — fully supported, first-class.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

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
            <li><strong>Early access:</strong> live capture coaching from PC or console (capture card)</li>
            <li><strong>Early access:</strong> voice-first TTS callouts while you play</li>
            <li><strong>Early access:</strong> real-time shared strat board for your full stack</li>
            <li><strong>Early access:</strong> VOD review with timeline tagging</li>
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
                This installer isn't code-signed yet (we're working on it). When you run it,
                Windows will probably show a blue "Windows protected your PC" screen. Click
                <strong> "More info" → "Run anyway"</strong> to install. The app is safe — it's the
                same Recon 6 beta your membership includes, just packaged for
                desktop.
              </p>
            </div>
            <ol className="activate-steps">
              <li>Download and run the installer (click "More info → Run anyway" if SmartScreen pops up).</li>
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
              <Link to="/activate" className="btn btn-primary btn-sm">Get Activation Token →</Link>
            </div>
        </>
      </div>
    </div>
  )
}
