import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { CHAMPION_CHECKOUT_LINK, CHAMPION_CURRENT_AMOUNT } from '../../config/stripe'
import { track } from '../../utils/analytics'

// Gates content behind the Champion tier specifically. Use ChampionGate for
// premium tactics (spawn-kill spots, attack spawn locations, deep defense
// setups) and Champion-only maps. Pro users see the upgrade overlay; Champions
// (and admins) see the content directly.
export default function ChampionGate({ label, children, compact = false }) {
  const { user, isAdmin, plan } = useAuth()
  const isChampion = isAdmin || plan === 'champion'

  if (isChampion) {
    return <>{children}</>
  }

  const isPro = plan === 'pro'
  const ctaCopy = isPro ? `Upgrade to Champion — $${CHAMPION_CURRENT_AMOUNT}/mo` : `Unlock Champion — $${CHAMPION_CURRENT_AMOUNT}/mo`
  const helperText = isPro
    ? 'Champion-tier intel: spawn-kill spots, attack spawn locations, advanced setups.'
    : user
      ? 'Champion unlocks all maps + premium tactics + the desktop coach (early access).'
      : 'Sign in and subscribe to Champion to unlock.'

  return (
    <div className="pro-gate champion-gate" style={{ borderColor: 'rgba(0, 229, 255, 0.4)' }}>
      <div className="pro-gate-content">
        {children}
      </div>
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
          <strong style={{ color: '#00e5ff' }}>{label || 'Champion Only'}</strong>
          <p>{helperText}</p>
        </div>
        {user ? (
          <a
            href={CHAMPION_CHECKOUT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('Pricing CTA Click', { tier: 'champion', location: 'champion-gate' })}
            className="btn btn-primary btn-sm pro-gate-btn"
            style={{ background: 'linear-gradient(135deg, #00e5ff 0%, #0091ea 100%)' }}
          >
            {ctaCopy}
          </a>
        ) : (
          <Link to="/auth" className="btn btn-primary btn-sm pro-gate-btn">
            Sign Up Free
          </Link>
        )}
      </div>
    </div>
  )
}
