import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Unified top navigation — single nav across the entire site (landing +
// in-app). Replaces the previous dual-layout pattern where landing used a
// top nav and /strats /dashboard /etc used a sidebar — the layout shift
// was jarring and unprofessional.
//
// Sections:
//   Left:   brand + game switcher (auth'd only)
//   Center: primary tools (Strats, Loadouts, Match Prep, VOD, Dashboard)
//   Right:  account dropdown OR sign-in CTA
//
// A "More" dropdown collapses secondary nav (Operators, Meta, Blog,
// Pricing) so the bar doesn't crowd. Mobile gets a hamburger drawer.

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 64
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

function MoreDropdown({ onClose }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const isLanding = location.pathname === '/'

  useEffect(() => {
    if (!open) return
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function go(to) {
    setOpen(false)
    onClose?.()
    if (to.startsWith('#')) {
      if (isLanding) scrollToSection(to.slice(1))
      else { navigate('/'); setTimeout(() => scrollToSection(to.slice(1)), 300) }
    } else if (to.startsWith('/') && !to.includes('#')) {
      // External static page (e.g. /blog/, /games/) — full page nav
      if (to.endsWith('/') || to.endsWith('.html')) window.location.href = to
      else navigate(to)
    } else {
      navigate(to)
    }
  }

  return (
    <div className="nav-more" ref={ref}>
      <button
        type="button"
        className={`nav-more-trigger${open ? ' active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        More
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="nav-more-pop" role="menu">
          <button type="button" className="nav-more-item" onClick={() => go('/operators')}>Operators</button>
          <button type="button" className="nav-more-item" onClick={() => go('/meta')}>Meta Board</button>
          <a className="nav-more-item" href="/games/">All Games</a>
          <a className="nav-more-item" href="/blog/">Blog</a>
          <a className="nav-more-item" href="/tools/">Tools index</a>
          <div className="nav-more-divider" />
          <button type="button" className="nav-more-item" onClick={() => go('#pricing')}>Pricing</button>
          <button type="button" className="nav-more-item" onClick={() => go('#faq')}>FAQ</button>
          <button type="button" className="nav-more-item" onClick={() => go('/changelog')}>Changelog</button>
        </div>
      )}
    </div>
  )
}

function AccountDropdown({ user, plan, isAdmin, isPro, signOut, onClose }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const badge = isAdmin ? 'CEO' : plan === 'champion' ? 'CHAMPION' : plan === 'pro' ? 'PRO' : 'FREE'
  const badgeClass = badge.toLowerCase()
  const initial = (user.email || '?')[0].toUpperCase()

  function go(to) {
    setOpen(false)
    onClose?.()
    navigate(to)
  }

  return (
    <div className="nav-account" ref={ref}>
      <button
        type="button"
        className={`nav-account-trigger${open ? ' active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <span className={`nav-account-avatar nav-account-avatar-${badgeClass}`}>{initial}</span>
        <span className={`nav-account-badge nav-account-badge-${badgeClass}`}>{badge}</span>
      </button>
      {open && (
        <div className="nav-account-pop" role="menu">
          <div className="nav-account-pop-head">
            <div className="nav-account-pop-email" title={user.email}>{user.email}</div>
            <span className={`nav-account-badge nav-account-badge-${badgeClass}`}>{badge}</span>
          </div>
          <button type="button" className="nav-more-item" onClick={() => go('/dashboard')}>Dashboard</button>
          <button type="button" className="nav-more-item" onClick={() => go('/account')}>Account & billing</button>
          {isPro && (
            <button type="button" className="nav-more-item" onClick={() => go('/download')}>Desktop app</button>
          )}
          {isPro && (
            <button type="button" className="nav-more-item" onClick={() => go('/activate')}>Activation</button>
          )}
          {isAdmin && (
            <>
              <div className="nav-more-divider" />
              <button type="button" className="nav-more-item" onClick={() => go('/admin')}>Admin dashboard</button>
            </>
          )}
          <div className="nav-more-divider" />
          <button type="button" className="nav-more-item nav-more-item-signout" onClick={() => { setOpen(false); onClose?.(); signOut() }}>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isLanding = location.pathname === '/'
  const { user, isPro, isAdmin, plan, signOut } = useAuth()

  function closeMobile() { setMobileMenu(false) }

  // Lock body scroll while the mobile drawer is open so users can't
  // scroll the page behind it. Restore on close.
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (mobileMenu) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [mobileMenu])

  function handleSectionClick(sectionId) {
    closeMobile()
    if (isLanding) scrollToSection(sectionId)
    else { navigate('/'); setTimeout(() => scrollToSection(sectionId), 300) }
  }

  const badge = isAdmin ? 'CEO' : plan === 'champion' ? 'CHAMPION' : plan === 'pro' ? 'PRO' : 'FREE'
  const badgeClass = badge.toLowerCase()

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <Link to={user ? '/dashboard' : '/'} className="navbar-logo" onClick={closeMobile}>
            Recon<span>6</span>
          </Link>
          {/* GameSwitcher removed 2026-07-06 — RECON6 is R6-only now. The
              component + game data stay in the tree (existing All-Access subs
              keep their entitlements; routes stay live for SEO). */}
        </div>

        {/* Desktop nav — center cluster. Hidden on mobile in favor of the
            drawer. Each Link is a NavLink so the current route gets the
            "active" class — that gives users a real visual signal of which
            tab they're on. The old standalone Dashboard pill was always
            bright cyan, which read as "I'm always on Dashboard" no matter
            the route — we removed it. Signed-in users still get to /dashboard
            via the logo (left), the avatar dropdown (right), or the More
            menu.

            AUTH-SPLIT: signed-in users get the in-app TOOL nav (Live Coach,
            Strats, etc). Signed-OUT visitors used to see this exact same
            nav — clicking any of it just hit a sign-in wall (LiveCoachPage,
            StratsPage's gated features, etc.), a dead end for someone who
            hasn't decided to sign up yet. Logged-out visitors now get a
            MARKETING nav instead (How It Works / Pricing / Guides / FAQ) —
            real anchors on the landing page, nothing that walls them off. */}
        {user ? (
          <ul id="primary-nav" className="navbar-links navbar-desktop-only">
            <li><NavLink to="/live" className={({ isActive }) => `nav-live-link${isActive ? ' is-active' : ''}`}>Live Coach</NavLink></li>
            <li><NavLink to="/strats" className={({ isActive }) => (isActive ? 'is-active' : undefined)}>Strats</NavLink></li>
            <li><NavLink to="/loadouts" className={({ isActive }) => (isActive ? 'is-active' : undefined)}>Loadouts</NavLink></li>
            <li><NavLink to="/match-prep" className={({ isActive }) => (isActive ? 'is-active' : undefined)}>Match Prep</NavLink></li>
            <li><NavLink to="/vod" className={({ isActive }) => (isActive ? 'is-active' : undefined)}>VOD Review</NavLink></li>
            <li><a href="/coaching/">Coaching</a></li>
            <li><MoreDropdown /></li>
          </ul>
        ) : (
          <ul id="primary-nav" className="navbar-links navbar-desktop-only">
            <li><button type="button" className="nav-marketing-link" onClick={() => handleSectionClick('how-it-works')}>How It Works</button></li>
            {/* "Games" section link removed with the R6-only pivot; Coaching
                (the primary revenue CTA) takes the slot. */}
            <li><a className="nav-marketing-link" href="/coaching/">Coaching</a></li>
            <li><button type="button" className="nav-marketing-link" onClick={() => handleSectionClick('pricing')}>Pricing</button></li>
            <li><a className="nav-marketing-link" href="/blog/">Guides</a></li>
            <li><button type="button" className="nav-marketing-link" onClick={() => handleSectionClick('faq')}>FAQ</button></li>
          </ul>
        )}

        <div className="navbar-right navbar-desktop-only">
          {user ? (
            <AccountDropdown
              user={user}
              plan={plan}
              isAdmin={isAdmin}
              isPro={isPro}
              signOut={signOut}
            />
          ) : (
            <>
              <Link to="/auth" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/auth?mode=signup" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          )}
        </div>

        {/* Mobile-only avatar (shown above the hamburger) — quick visual
            anchor for plan tier even without opening the drawer. */}
        {user && (
          <button
            type="button"
            className={`nav-account-avatar nav-account-avatar-${badgeClass} navbar-mobile-only`}
            aria-label="Open menu"
            onClick={() => setMobileMenu(true)}
          >
            {(user.email || '?')[0].toUpperCase()}
          </button>
        )}

        <button
          className={`mobile-toggle${mobileMenu ? ' open' : ''}`}
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label={mobileMenu ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenu}
          aria-controls="mobile-drawer"
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* Mobile drawer + backdrop. Slides in from the right; full screen
          height; locked body scroll while open. Includes everything:
          game switcher, primary tools, secondary links, account section. */}
      {mobileMenu && (
        <div className="mobile-drawer-backdrop" onClick={closeMobile} aria-hidden="true" />
      )}
      <aside
        id="mobile-drawer"
        className={`mobile-drawer${mobileMenu ? ' open' : ''}`}
        aria-hidden={!mobileMenu}
        aria-label="Mobile navigation"
      >
        <div className="mobile-drawer-head">
          <Link to={user ? '/dashboard' : '/'} className="navbar-logo" onClick={closeMobile}>
            Recon<span>6</span>
          </Link>
          <button
            className="mobile-drawer-close"
            onClick={closeMobile}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        {user && (
          <div className="mobile-drawer-account">
            <div className={`nav-account-avatar nav-account-avatar-${badgeClass}`}>
              {(user.email || '?')[0].toUpperCase()}
            </div>
            <div className="mobile-drawer-account-info">
              <div className="mobile-drawer-account-email">{user.email}</div>
              <span className={`nav-account-badge nav-account-badge-${badgeClass}`}>{badge}</span>
            </div>
          </div>
        )}

        {/* Mobile "Active game" switcher removed 2026-07-06 — R6-only. */}

        {/* Signed-in users get the in-app tool list. Signed-out visitors used
            to see this same list — every link walled them off immediately
            (Live Coach, Strats' gated features, etc). Give them a marketing
            section instead; the real Explore section below still works for
            everyone. */}
        {user ? (
          <div className="mobile-drawer-section">
            <div className="mobile-drawer-section-label">Tools</div>
            <NavLink to="/live" onClick={closeMobile} className={({ isActive }) => `mobile-drawer-link${isActive ? ' is-active' : ''}`}>Live Coach</NavLink>
            <NavLink to="/strats" onClick={closeMobile} className={({ isActive }) => `mobile-drawer-link${isActive ? ' is-active' : ''}`}>Strats</NavLink>
            <NavLink to="/loadouts" onClick={closeMobile} className={({ isActive }) => `mobile-drawer-link${isActive ? ' is-active' : ''}`}>Loadouts</NavLink>
            <NavLink to="/match-prep" onClick={closeMobile} className={({ isActive }) => `mobile-drawer-link${isActive ? ' is-active' : ''}`}>Match Prep</NavLink>
            <NavLink to="/vod" onClick={closeMobile} className={({ isActive }) => `mobile-drawer-link${isActive ? ' is-active' : ''}`}>VOD Review</NavLink>
            <NavLink to="/operators" onClick={closeMobile} className={({ isActive }) => `mobile-drawer-link${isActive ? ' is-active' : ''}`}>Operators</NavLink>
            <NavLink to="/meta" onClick={closeMobile} className={({ isActive }) => `mobile-drawer-link${isActive ? ' is-active' : ''}`}>Meta Board</NavLink>
            <NavLink to="/dashboard" onClick={closeMobile} className={({ isActive }) => `mobile-drawer-link${isActive ? ' is-active' : ''}`}>Dashboard</NavLink>
          </div>
        ) : (
          <div className="mobile-drawer-section">
            <div className="mobile-drawer-section-label">Recon 6</div>
            <button type="button" className="mobile-drawer-link" onClick={() => handleSectionClick('how-it-works')}>How It Works</button>
            <button type="button" className="mobile-drawer-link" onClick={() => handleSectionClick('games')}>Games</button>
            <button type="button" className="mobile-drawer-link" onClick={() => handleSectionClick('testimonials')}>Testimonials</button>
          </div>
        )}

        <div className="mobile-drawer-section">
          <div className="mobile-drawer-section-label">Explore</div>
          <a href="/games/" onClick={closeMobile} className="mobile-drawer-link">All Games</a>
          <a href="/blog/" onClick={closeMobile} className="mobile-drawer-link">Blog</a>
          <a href="/tools/" onClick={closeMobile} className="mobile-drawer-link">Tools index</a>
          <button type="button" className="mobile-drawer-link" onClick={() => handleSectionClick('pricing')}>Pricing</button>
          <button type="button" className="mobile-drawer-link" onClick={() => handleSectionClick('faq')}>FAQ</button>
          <Link to="/changelog" onClick={closeMobile} className="mobile-drawer-link">Changelog</Link>
        </div>

        {user ? (
          <div className="mobile-drawer-section">
            <div className="mobile-drawer-section-label">Account</div>
            <Link to="/account" onClick={closeMobile} className="mobile-drawer-link">Account & billing</Link>
            {isPro && <Link to="/download" onClick={closeMobile} className="mobile-drawer-link">Desktop app</Link>}
            {isPro && <Link to="/activate" onClick={closeMobile} className="mobile-drawer-link">Activation</Link>}
            {isAdmin && <Link to="/admin" onClick={closeMobile} className="mobile-drawer-link">Admin dashboard</Link>}
            <button
              type="button"
              className="mobile-drawer-link mobile-drawer-signout"
              onClick={() => { closeMobile(); signOut() }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="mobile-drawer-section mobile-drawer-section-cta">
            <Link to="/auth?mode=signup" onClick={closeMobile} className="btn btn-primary btn-block">Sign Up — Free</Link>
            <Link to="/auth" onClick={closeMobile} className="btn btn-ghost btn-block">Sign In</Link>
          </div>
        )}
      </aside>
    </>
  )
}
