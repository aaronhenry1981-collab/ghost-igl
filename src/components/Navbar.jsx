import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const location = useLocation()
  const isLanding = location.pathname === '/'
  const { user, isPro, signOut } = useAuth()

  const sectionLink = (hash) => isLanding ? hash : `/${hash}`

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        Ghost <span>IGL</span>
      </Link>
      <ul className={`navbar-links${mobileMenu ? ' show' : ''}`}>
        <li><Link to="/strats" onClick={() => setMobileMenu(false)}>Strats</Link></li>
        <li><Link to="/vod" onClick={() => setMobileMenu(false)}>VOD Review</Link></li>
        <li><a href={sectionLink('#pricing')} onClick={() => setMobileMenu(false)}>Pricing</a></li>
      </ul>
      <div className="navbar-right">
        <div className="live-dot" />
        <span className="live-count">2,847 players online</span>
        {user ? (
          <>
            {isPro && <span className="nav-pro-badge">PRO</span>}
            <button className="btn btn-ghost btn-sm" onClick={signOut}>Sign Out</button>
          </>
        ) : (
          <>
            <Link to="/auth" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link to="/strats" className="btn btn-primary btn-sm">Try Free</Link>
          </>
        )}
      </div>
      <button className="mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Menu">
        <span /><span /><span />
      </button>
    </nav>
  )
}
