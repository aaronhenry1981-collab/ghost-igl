import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import AnnouncementBanner from './AnnouncementBanner'
import FoundingTopBanner from './FoundingTopBanner'
import WelcomeModal from './WelcomeModal'
import ExitIntentModal from './ExitIntentModal'
import ProfileSetupModal from './ProfileSetupModal'
import GamePickerModal from './GamePickerModal'
import ReferralAttributor from './ReferralAttributor'
import ErrorBoundary from './ErrorBoundary'
import { GameProvider } from '../hooks/useActiveGame'

// Unified layout — single Navbar across the entire site (landing + in-app).
// Replaces the previous AppShell sidebar pattern that switched UI on /strats
// and friends. Now every route gets the same top horizontal nav.
//
// GameProvider wraps everything so any route (including the homepage) can
// read the active game. Pre-Navbar so the game switcher inside the nav can
// access context.

export default function Layout() {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <ErrorBoundary>
      <GameProvider>
        <FoundingTopBanner />
        <AnnouncementBanner />
        <Navbar />
        <main className="app-main">
          <Outlet />
        </main>
        <Footer />
        <WelcomeModal />
        <ProfileSetupModal />
        <GamePickerModal />
        <ReferralAttributor />
        {isLanding && <ExitIntentModal />}
      </GameProvider>
    </ErrorBoundary>
  )
}
