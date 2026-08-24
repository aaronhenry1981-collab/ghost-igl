import { Link, useLocation } from 'react-router-dom'
import './SignInGate.css'

// Sign-in gate for premium interactive tools (Match Prep, Loadouts).
// Static R6 guides stay public. The in-app interactive versions require an
// account so settings and training progress can be saved per player.
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
          Create a free account to save your settings and keep your R6 training
          progress together. Takes about 30 seconds.
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
          A free account never requires a card. Paid plans show their trial and
          billing terms before checkout.
        </div>
      </div>
    </div>
  )
}
