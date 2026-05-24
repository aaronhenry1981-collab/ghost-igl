import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { PRO_CHECKOUT_LINK, PRO_CURRENT_AMOUNT, STRIPE_FOUNDING_ACTIVE } from '../../config/stripe'
import { track } from '../../utils/analytics'

export default function ProGate({ label, children }) {
  const { user, isPro } = useAuth()

  // Pro users see content unlocked
  if (isPro) {
    return <>{children}</>
  }

  const ctaLabel = STRIPE_FOUNDING_ACTIVE
    ? `Unlock — $${PRO_CURRENT_AMOUNT}/mo founding`
    : `Unlock — $${PRO_CURRENT_AMOUNT}/mo`

  return (
    <div className="pro-gate">
      <div className="pro-gate-content">
        {children}
      </div>
      <div className="pro-gate-overlay">
        <div className="pro-gate-lock">{'🔒'}</div>
        <div className="pro-gate-text">
          <strong>{label || 'Pro Feature'}</strong>
          <p>{user ? 'Upgrade to Pro to unlock this intel' : 'Sign in and upgrade to unlock'}</p>
        </div>
        {user ? (
          <a
            href={PRO_CHECKOUT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('Pricing CTA Click', { tier: 'pro', location: 'pro-gate' })}
            className="btn btn-primary btn-sm pro-gate-btn"
          >
            {ctaLabel}
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
