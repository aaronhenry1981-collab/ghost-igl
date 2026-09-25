import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Unified top navigation — single nav across the entire site (landing +
// in-app). Replaces the previous dual-layout pattern where landing used a
// top nav and /strats /dashboard /etc used a sidebar — the layout shift
// was jarring and unprofessional.
//
// Public visitors get a short marketing path. Signed-in players get their
// dashboard, Road to Champion, and five concrete tools. Reference pages stay
// reachable from the tools themselves and footer instead of crowding the nav.

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
        Tools
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="nav-more-pop" role="menu">
          <div className="nav-more-label">Five working tools</div>
          <button type="button" className="nav-more-item nav-tool-item" onClick={() => go('/live')}>
            <strong>Live Match Coach</strong><span>Evidence-based calls while you play</span>
          </button>
          <button type="button" className="nav-more-item nav-tool-item" onClick={() => go('/match-prep')}>
            <strong>Match Prep</strong><span>Bans, picks, and your job this round</span>
          </button>
          <button type="button" className="nav-more-item nav-tool-item" onClick={() => go('/strats')}>
            <strong>Site Strategy</strong><span>Map, bombsite, side, and execute</span>
          </button>
          <button type="button" className="nav-more-item nav-tool-item" onClick={() => go('/vod')}>
            <strong>Round Review</strong><span>Find the mistake shown in your evidence</span>
          </button>
          <button type="button" className="nav-more-item nav-tool-item" onClick={() => go('/loadouts')}>
            <strong>Loadout Builder</strong><span>Choose an operator and setup with purpose</span>
          </button>
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

  const badge = isAdmin ? 'CEO' : plan === 'champion' ? 'CHAMPION' : plan === 'elite' ? 'ELITE' : plan === 'pro' ? 'PRO' : 'BASIC'
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
          <button type="button" className="nav-more-item" onClick={() => go('/account')}>Account & billing</button>
          {isPro && (
            <button type="button" className="nav-more-item" onClick={() => go('/download')}>Desktop setup</button>
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

// Everything a keyboard user can reach inside the open drawer.
const DRAWER_FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isLanding = location.pathname === '/'
  const { user, isPro, isAdmin, plan, signOut } = useAuth()
  const toggleRef = useRef(null)
  const drawerRef = useRef(null)
  const drawerCloseRef = useRef(null)
  const openerRef = useRef(null)
  const drawerWasOpen = useRef(false)

  function openMobile(e) {
    openerRef.current = e?.currentTarget || toggleRef.current
    setMobileMenu(true)
  }
  function closeMobile() { setMobileMenu(false) }

  // Keyboard focus follows the drawer (WCAG 2.4.3): opening moves focus to
  // its close button; closing returns focus to the control that opened it,
  // but only when focus was inside the drawer (or lost), never stealing it
  // from somewhere the user has already moved on to.
  useEffect(() => {
    if (mobileMenu) {
      drawerWasOpen.current = true
      drawerCloseRef.current?.focus()
      return
    }
    if (!drawerWasOpen.current) return
    drawerWasOpen.current = false
    const active = document.activeElement
    if (active && active !== document.body && !drawerRef.current?.contains(active)) return
    const opener = openerRef.current
    const target = opener && opener.isConnected && opener.offsetParent !== null ? opener : toggleRef.current
    target?.focus()
  }, [mobileMenu])

  // While open, the drawer behaves like a dialog: Escape closes it and Tab
  // cycles through its own controls instead of the page behind the backdrop.
  useEffect(() => {
    if (!mobileMenu) return undefined
    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setMobileMenu(false)
        return
      }
      if (e.key !== 'Tab') return
      const drawer = drawerRef.current
      if (!drawer) return
      const items = [...drawer.querySelectorAll(DRAWER_FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      const inside = drawer.contains(document.activeElement)
      if (e.shiftKey && (!inside || document.activeElement === first)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileMenu])

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

  const badge = isAdmin ? 'CEO' : plan === 'champion' ? 'CHAMPION' : plan === 'elite' ? 'ELITE' : plan === 'pro' ? 'PRO' : 'BASIC'
  const badgeClass = badge.toLowerCase()

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <Link to={user ? '/dashboard' : '/'} className="navbar-logo" onClick={closeMobile}>
            {/* The mark is the 6 (a hexagon's six sides). The wordmark stays real
                DOM text — never a <text> node inside the SVG, which would render
                differently in every browser. */}
            <img src="/logo-mark.svg" alt="" width="24" height="24" aria-hidden="true" />
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
        <ul id="primary-nav" className="navbar-links navbar-desktop-only">
          {user ? (
            <>
              <li><NavLink to="/dashboard" className={({ isActive }) => isActive ? 'is-active' : ''}>Dashboard</NavLink></li>
              <li><NavLink to="/progress" className={({ isActive }) => isActive ? 'is-active' : ''}>Road to Champion</NavLink></li>
              <li><MoreDropdown /></li>
            </>
          ) : (
            <>
              <li><NavLink to="/strats" className={({ isActive }) => isActive ? 'is-active' : ''}>Free strats</NavLink></li>
              <li><button type="button" className="nav-marketing-link" onClick={() => handleSectionClick('how-it-works')}>How it works</button></li>
              <li><button type="button" className="nav-marketing-link" onClick={() => handleSectionClick('pricing')}>Plans</button></li>
            </>
          )}
        </ul>

        <div className="navbar-right navbar-desktop-only">
          {isAdmin
            ? <NavLink to="/admin" className={({ isActive }) => `btn btn-primary btn-sm${isActive ? ' is-active' : ''}`}>Admin console</NavLink>
            : <Link to="/strats" className="btn btn-primary btn-sm">Open a free strat</Link>}
          {user ? (
            <AccountDropdown
              user={user}
              plan={plan}
              isAdmin={isAdmin}
              isPro={isPro}
              signOut={signOut}
            />
          ) : (
            <Link to="/auth" className="btn btn-ghost btn-sm">Sign In</Link>
          )}
        </div>

        {/* Mobile-only avatar (shown above the hamburger) — quick visual
            anchor for plan tier even without opening the drawer. */}
        {user && (
          <button
            type="button"
            className={`nav-account-avatar nav-account-avatar-${badgeClass} navbar-mobile-only`}
            aria-label="Open menu"
            aria-controls="mobile-drawer"
            onClick={openMobile}
          >
            {(user.email || '?')[0].toUpperCase()}
          </button>
        )}

        <button
          ref={toggleRef}
          type="button"
          className={`mobile-toggle${mobileMenu ? ' open' : ''}`}
          onClick={(e) => (mobileMenu ? closeMobile() : openMobile(e))}
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
      {/* Closed, the drawer is inert (and visibility: hidden in App.css for
          browsers without `inert`), so none of its links sit invisibly in
          the tab order on any screen size (WCAG 2.4.3). */}
      <aside
        ref={drawerRef}
        id="mobile-drawer"
        className={`mobile-drawer${mobileMenu ? ' open' : ''}`}
        role="dialog"
        aria-modal={mobileMenu ? 'true' : undefined}
        aria-hidden={!mobileMenu}
        inert={!mobileMenu}
        aria-label="Mobile navigation"
      >
        <div className="mobile-drawer-head">
          <Link to={user ? '/dashboard' : '/'} className="navbar-logo" onClick={closeMobile}>
            {/* The mark is the 6 (a hexagon's six sides). The wordmark stays real
                DOM text — never a <text> node inside the SVG, which would render
                differently in every browser. */}
            <img src="/logo-mark.svg" alt="" width="24" height="24" aria-hidden="true" />
            Recon<span>6</span>
          </Link>
          <button
            ref={drawerCloseRef}
            type="button"
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
          <>
            <div className="mobile-drawer-section">
              <div className="mobile-drawer-section-label">Your improvement</div>
              <NavLink to="/dashboard" onClick={closeMobile} className={({ isActive }) => `mobile-drawer-link${isActive ? ' is-active' : ''}`}>Dashboard</NavLink>
              <NavLink to="/progress" onClick={closeMobile} className={({ isActive }) => `mobile-drawer-link${isActive ? ' is-active' : ''}`}>Road to Champion</NavLink>
              {isAdmin
                ? <NavLink to="/admin" onClick={closeMobile} className={({ isActive }) => `mobile-drawer-link mobile-drawer-primary${isActive ? ' is-active' : ''}`}>Admin console</NavLink>
                : <a href="/coaching/index.html#book" onClick={closeMobile} className="mobile-drawer-link mobile-drawer-primary">Book your first session — $20</a>}
            </div>
            <div className="mobile-drawer-section">
              <div className="mobile-drawer-section-label">Working tools</div>
              <NavLink to="/live" onClick={closeMobile} className={({ isActive }) => `mobile-drawer-link${isActive ? ' is-active' : ''}`}>Live Match Coach</NavLink>
              <NavLink to="/match-prep" onClick={closeMobile} className={({ isActive }) => `mobile-drawer-link${isActive ? ' is-active' : ''}`}>Match Prep</NavLink>
              <NavLink to="/strats" onClick={closeMobile} className={({ isActive }) => `mobile-drawer-link${isActive ? ' is-active' : ''}`}>Site Strategy</NavLink>
              <NavLink to="/vod" onClick={closeMobile} className={({ isActive }) => `mobile-drawer-link${isActive ? ' is-active' : ''}`}>Round Review</NavLink>
              <NavLink to="/loadouts" onClick={closeMobile} className={({ isActive }) => `mobile-drawer-link${isActive ? ' is-active' : ''}`}>Loadout Builder</NavLink>
            </div>
          </>
        ) : (
          <div className="mobile-drawer-section">
            <div className="mobile-drawer-section-label">Recon 6</div>
            <NavLink to="/strats" onClick={closeMobile} className={({ isActive }) => `mobile-drawer-link mobile-drawer-primary${isActive ? ' is-active' : ''}`}>Open a free strat</NavLink>
            <NavLink to="/vod?demo=1" onClick={closeMobile} className="mobile-drawer-link">Review a round free</NavLink>
            <button type="button" className="mobile-drawer-link" onClick={() => handleSectionClick('how-it-works')}>How It Works</button>
            <button type="button" className="mobile-drawer-link" onClick={() => handleSectionClick('pricing')}>Plans & pricing</button>
            <a href="/coaching/index.html" onClick={closeMobile} className="mobile-drawer-link">1-on-1 coaching</a>
          </div>
        )}

          <div className="mobile-drawer-section">
            <div className="mobile-drawer-section-label">Explore</div>
            <Link to="/beginner-guide" onClick={closeMobile} className="mobile-drawer-link">Beginner workbook</Link>
          <button type="button" className="mobile-drawer-link" onClick={() => handleSectionClick('faq')}>FAQ</button>
          <a href="/guides/" onClick={closeMobile} className="mobile-drawer-link">Map guides</a>
          <Link to="/changelog" onClick={closeMobile} className="mobile-drawer-link">Changelog</Link>
        </div>

        {user ? (
          <div className="mobile-drawer-section">
            <div className="mobile-drawer-section-label">Account</div>
            <Link to="/account" onClick={closeMobile} className="mobile-drawer-link">Account & billing</Link>
            {isPro && <Link to="/download" onClick={closeMobile} className="mobile-drawer-link">Desktop setup</Link>}
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
