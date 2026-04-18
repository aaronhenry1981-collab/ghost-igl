import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (el) {
    const navHeight = 60
    const top = el.getBoundingClientRect().top + window.scrollY - navHeight
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

export default function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isLanding = location.pathname === '/'
  const { user, isPro, signOut } = useAuth()

  const handleSectionClick = (sectionId) => {
    setMobileMenu(false)
    if (isLanding) {
      scrollToSection(sectionId)
    } else {
      navigate('/')
      setTimeout(() => scrollToSection(sectionId), 300)
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
        <li><span style={{ cursor: 'pointer' }} onClick={() => handleSectionClick('pricing')}>Pricing</span></li>
      </ul>

      <div className="navbar-right">
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
