import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

export default function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isLanding = location.pathname === '/'
  const { user, isPro, signOut } = useAuth()

  const handleSectionClick = (sectionId) => (e) => {
    e.preventDefault()
    setMobileMenu(false)
    if (isLanding) {
      scrollToSection(sectionId)
    } else {
      navigate('/')
      setTimeout(() => scrollToSection(sectionId), 100)
    }
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        Ghost <span>IGL</span>
      </Link>

      <ul className={`navbar-links${mobileMenu ? ' show' : ''}`}>
        <li><Link to="/strats" onClick={() => setMobileMenu(false)}>Strats</Link></li>
        <li><Link to="/vod" onClick={() => setMobileMenu(false)}>VOD Review</Link></li>
        <li><a href="#" onClick={handleSectionClick('pricing')}>Pricing</a></li>
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
