import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function ProGate({ label, children }) {
  const { user, isPro } = useAuth()

  // Pro users see content unlocked
  if (isPro) {
    return <>{children}</>
  }

  return (
    <div className="pro-gate">
      <div className="pro-gate-content">
        {children}
      </div>
      <div className="pro-gate-overlay">
        <div className="pro-gate-lock">{'\uD83D\uDD12'}</div>
        <div className="pro-gate-text">
          <strong>{label || 'Pro Feature'}</strong>
          <p>{user ? 'Upgrade to Pro to unlock this intel' : 'Sign in and upgrade to unlock'}</p>
        </div>
        {user ? (
          <a
            href="https://buy.stripe.com/00weVe0gygI4c3d3tM7ss0a"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm pro-gate-btn"
          >
            Unlock for $12/mo
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
