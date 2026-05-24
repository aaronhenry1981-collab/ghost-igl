import { useState } from 'react'
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { GameProvider } from '../hooks/useActiveGame'
import GameSwitcher from './GameSwitcher'
import AnnouncementBanner from './AnnouncementBanner'
import WelcomeModal from './WelcomeModal'
import ProfileSetupModal from './ProfileSetupModal'
import GamePickerModal from './GamePickerModal'
import './AppShell.css'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
  { to: '/strats', label: 'Strats', icon: 'M3 7h18M3 12h18M3 17h18' },
  { to: '/match-prep', label: 'Match Prep', icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
  { to: '/loadouts', label: 'Loadouts', icon: 'M3 12h2l2-7h10l2 7h2M5 12v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8M9 16h6' },
  { to: '/operators', label: 'Operators', icon: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 21a8 8 0 0 1 16 0' },
  { to: '/meta', label: 'Meta', icon: 'M3 3v18h18M7 14l4-4 4 4 5-5' },
  { to: '/vod', label: 'VOD Review', icon: 'M15 10l4.5-2.5v9L15 14m-3 4H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2z' },
  { to: '/download', label: 'Desktop App', icon: 'M12 3v12m0 0l-4-4m4 4l4-4M4 21h16', tier: 'champion' },
  { to: '/activate', label: 'Activation', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', tier: 'champion' },
  { to: '/account', label: 'Account', icon: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z' },
]

const ADMIN_NAV = [
  { to: '/admin', label: 'Admin', icon: 'M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z' },
]

function PlanBadge({ plan, isAdmin }) {
  if (isAdmin) return <span className="plan-badge plan-ceo">CEO</span>
  if (plan === 'champion') return <span className="plan-badge plan-champion">CHAMPION</span>
  if (plan === 'pro') return <span className="plan-badge plan-pro">PRO</span>
  return <span className="plan-badge plan-free">FREE</span>
}

function NavIcon({ d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

export default function AppShell() {
  const { user, plan, isAdmin, signOut } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()

  const isChampion = plan === 'champion' || isAdmin
  const visibleNav = NAV.filter((n) => !n.tier || (n.tier === 'champion' && isChampion))
  const allNav = isAdmin ? [...visibleNav, ...ADMIN_NAV] : visibleNav

  return (
    <GameProvider>
    <div className="app-shell">
      <aside className={`app-sidebar${mobileNavOpen ? ' open' : ''}`}>
        <Link to="/" className="app-brand">
          RECON<span>+</span>
        </Link>

        <GameSwitcher />

        <nav className="app-nav">
          {allNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) => `app-nav-item${isActive ? ' active' : ''}`}
            >
              <NavIcon d={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <a
          href="https://discord.gg/namGQqs3jb"
          target="_blank"
          rel="noopener noreferrer"
          className="app-nav-item app-nav-item-discord"
          onClick={() => setMobileNavOpen(false)}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          <span>Discord</span>
        </a>

        <div className="app-sidebar-footer">
          {user ? (
            <>
              <div className="app-user-block">
                <PlanBadge plan={plan} isAdmin={isAdmin} />
                <div className="app-user-email" title={user.email}>{user.email}</div>
              </div>
              <button onClick={signOut} className="app-signout">Sign out</button>
            </>
          ) : (
            <Link to="/auth" className="app-signin-cta">Sign in / Sign up</Link>
          )}
        </div>
      </aside>

      <button
        className="app-mobile-toggle"
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
        aria-label="Toggle menu"
      >
        <span /><span /><span />
      </button>

      {mobileNavOpen && <div className="app-sidebar-backdrop" onClick={() => setMobileNavOpen(false)} />}

      <main className="app-main">
        <AnnouncementBanner />
        <div className="app-main-inner">
          <Outlet context={{ location }} />
        </div>
      </main>

      <WelcomeModal />
      <ProfileSetupModal />
      <GamePickerModal />
    </div>
    </GameProvider>
  )
}
