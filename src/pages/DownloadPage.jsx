import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const GITHUB_RELEASES_API = 'https://api.github.com/repos/aaronhenry1981-collab/igl-command/releases/latest'
const FALLBACK_DOWNLOAD = 'https://github.com/aaronhenry1981-collab/igl-command/releases/latest'

export default function DownloadPage() {
  const { user, isPro, loading } = useAuth()
  const navigate = useNavigate()
  const [release, setRelease] = useState(null)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?redirect=/download')
    }
  }, [loading, user, navigate])

  useEffect(() => {
    if (!isPro) return
    fetch(GITHUB_RELEASES_API)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        const winAsset = data.assets?.find((a) =>
          a.name.toLowerCase().endsWith('.exe')
        )
        setRelease({
          version: data.tag_name || data.name,
          publishedAt: data.published_at,
          notes: data.body,
          downloadUrl: winAsset?.browser_download_url || FALLBACK_DOWNLOAD,
          size: winAsset?.size,
          name: winAsset?.name
        })
      })
      .catch((err) => setFetchError(err.message))
  }, [isPro])

  if (loading) {
    return (
      <div className="activate-page">
        <div className="activate-box"><p>Loading...</p></div>
      </div>
    )
  }

  if (!user) return null

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
            subscribers. Upgrade for real-time capture-based coaching, voice guidance, and team
            coordination across your squad.
          </p>
          <ul className="activate-feature-list">
            <li>Live coaching from your PC or console capture feed</li>
            <li>Voice-first TTS callouts while you play</li>
            <li>Real-time shared strat board for your full stack</li>
            <li>Local SQLite brain that learns your mistakes</li>
            <li>VOD review with timeline tagging</li>
          </ul>
          <div className="activate-actions">
            <Link to="/#pricing" className="btn btn-primary">Upgrade to Champion</Link>
            <Link to="/" className="btn btn-ghost">Back to Home</Link>
          </div>
        </div>
      </div>
    )
  }

  function formatSize(bytes) {
    if (!bytes) return ''
    const mb = bytes / (1024 * 1024)
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
  }

  return (
    <div className="activate-page">
      <div className="activate-box">
        <div className="activate-header">
          <div className="activate-icon">⬇</div>
          <div>
            <div className="activate-eyebrow">Champion · Download</div>
            <h1>IGL Command Desktop</h1>
          </div>
        </div>

        <p className="activate-intro">
          Your real-time coach for Rainbow Six Siege. Install on your Windows PC, capture your PC
          gameplay or your console feed, and get live voice coaching plus team coordination.
        </p>

        {!release && !fetchError && <p>Loading latest release...</p>}

        {fetchError && (
          <div className="activate-note">
            Couldn't fetch release info automatically.{' '}
            <a href={FALLBACK_DOWNLOAD} target="_blank" rel="noopener noreferrer">
              Go to GitHub Releases →
            </a>
          </div>
        )}

        {release && (
          <div className="download-card">
            <div className="download-meta">
              <div>
                <div className="download-label">Latest Release</div>
                <div className="download-version">{release.version}</div>
              </div>
              {release.publishedAt && (
                <div className="download-date">
                  Released {new Date(release.publishedAt).toLocaleDateString()}
                </div>
              )}
            </div>
            <a
              href={release.downloadUrl}
              className="btn btn-primary btn-lg download-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download for Windows {release.size && <span>({formatSize(release.size)})</span>}
            </a>
            {release.name && <div className="download-filename">{release.name}</div>}
          </div>
        )}

        <ol className="activate-steps">
          <li>Download and run the installer.</li>
          <li>Launch <strong>IGL Command</strong>.</li>
          <li>Go to <Link to="/activate">the activation page</Link> and copy your token.</li>
          <li>Paste the token into IGL Command and click Activate.</li>
        </ol>

        <div className="activate-footer">
          <div>
            <div className="activate-footer-label">Signed in as</div>
            <div className="activate-footer-value">{user.email}</div>
          </div>
          <Link to="/activate" className="btn btn-primary btn-sm">Get Activation Token →</Link>
        </div>
      </div>
    </div>
  )
}
