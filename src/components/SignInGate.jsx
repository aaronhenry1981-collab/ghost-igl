import { Link, useLocation } from 'react-router-dom'
import './SignInGate.css'

// Sign-in gate for premium interactive tools (Match Prep, Loadouts).
// Static SEO pages (/games/<id>/, /games/<id>/loadouts.html, /guides/, etc.)
// stay public — Google indexes them and they drive traffic. The in-app
// interactive versions require an account so we can:
//   1. Track which tools each customer uses (drives retention)
//   2. Give the auto 7-day Pro trial that ships with every signup
//   3. Stop competitors from scraping the deep curated picks
//
// Props:
//   feature  — short label shown in the headline ("Match Prep", "Loadouts")
//   gameMeta — { displayName, color, ... } from useActiveGame() — used to
//              theme the gate to the active game
//   benefits — array of strings: "what you get" bullet list. Should reflect
//              the actual depth users unlock (not generic marketing)

export default function SignInGate({ feature, gameMeta, benefits }) {
  const location = useLocation()
  const accent = gameMeta?.color || '#00e5ff'
  const displayName = gameMeta?.displayName || ''
  // Preserve the route they were trying to reach so post-sign-in lands
  // them right back here instead of /dashboard.
  const redirectTo = encodeURIComponent(location.pathname + location.search + location.hash)
  const signInUrl = `/auth?redirect=${redirectTo}`
  const signUpUrl = `/auth?mode=signup&redirect=${redirectTo}`

  return (
    <div className="signin-gate">
      <div className="signin-gate-card" style={{ borderColor: accent }}>
        <div className="signin-gate-eyebrow" style={{ color: accent }}>
          {displayName ? `${displayName} · ` : ''}{feature}
        </div>
        <h1>
          Sign in to see your <span style={{ color: accent }}>{feature.toLowerCase()}</span>
        </h1>
        <p className="signin-gate-lead">
          Free to use — just need an account so we can save your settings,
          track your active game, and give you the 7-day Pro trial on signup.
          Takes 30 seconds.
        </p>

        {benefits && benefits.length > 0 && (
          <ul className="signin-gate-benefits">
            {benefits.map((b, i) => (
              <li key={i}>
                <span className="signin-gate-check" style={{ color: accent }}>&#10003;</span>
                {b}
              </li>
            ))}
          </ul>
        )}

        <div className="signin-gate-cta">
          <Link to={signUpUrl} className="btn btn-primary" style={{ background: accent, color: '#0a0f19' }}>
            Sign up — free
          </Link>
          <Link to={signInUrl} className="btn btn-outline">
            Sign in
          </Link>
        </div>

        <div className="signin-gate-foot">
          7-day Pro trial included with every signup. No credit card needed.
          Cancel anytime.
        </div>
      </div>
    </div>
  )
}
