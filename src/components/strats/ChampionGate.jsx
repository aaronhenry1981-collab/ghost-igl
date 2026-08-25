import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ELITE_CURRENT_AMOUNT } from '../../config/stripe'
import MembershipCheckoutButton from '../MembershipCheckoutButton'

// Legacy component name retained so existing strategy content does not need a
// risky bulk migration. In the four-tier model this gates the Champion-level
// DIGITAL library at Elite+, while Champion adds Aaron's live sessions.
export default function ChampionGate({ label, children, compact = false }) {
  const { user, isAdmin, plan } = useAuth()
  const hasEliteAccess = isAdmin || plan === 'elite' || plan === 'champion'

  if (hasEliteAccess) {
    return <>{children}</>
  }

  const isPro = plan === 'pro'
  const ctaCopy = isPro ? `Upgrade to Elite — $${ELITE_CURRENT_AMOUNT}/mo` : `Unlock Elite — $${ELITE_CURRENT_AMOUNT}/mo`
  const helperText = isPro
    ? 'Elite unlocks Champion-level intel: spawn-kill spots, attack spawns, and advanced setups.'
    : user
      ? 'Elite unlocks the complete self-service strategy library.'
      : 'Sign in and subscribe to Elite to unlock.'

  return (
    <div className="pro-gate champion-gate" style={{ borderColor: 'rgba(0, 229, 255, 0.4)' }}>
      <div
        className="pro-gate-overlay"
        style={{
          background: compact
            ? 'linear-gradient(180deg, rgba(0,229,255,0.05) 0%, rgba(0,229,255,0.18) 100%)'
            : undefined,
        }}
      >
        <div className="pro-gate-lock" style={{ filter: 'hue-rotate(180deg)' }}>★</div>
        <div className="pro-gate-text">
          <strong style={{ color: '#00e5ff' }}>{label || 'Elite Strategy Library'}</strong>
          <p>{helperText}</p>
        </div>
        {user ? (
          <MembershipCheckoutButton
            tier="elite"
            location="elite-gate"
            className="btn btn-primary btn-sm pro-gate-btn"
            style={{ background: 'linear-gradient(135deg, #00e5ff 0%, #0091ea 100%)' }}
          >
            {ctaCopy}
          </MembershipCheckoutButton>
        ) : (
          <Link to="/auth" className="btn btn-primary btn-sm pro-gate-btn">
            Sign Up Free
          </Link>
        )}
      </div>
    </div>
  )
}
