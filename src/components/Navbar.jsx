import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const location = useLocation()
  const isLanding = location.pathname === '/'

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
        <Link to="/strats" className="btn btn-primary btn-sm">Try Free</Link>
      </div>
      <button className="mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Menu">
        <span /><span /><span />
      </button>
    </nav>
  )
}
