import { StrictMode, Component, useEffect, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider, Navigate, useNavigate } from 'react-router-dom'
import './index.css'
import './App.css'
import './styles/polish.css'
import { AuthProvider } from './hooks/useAuth'
import { captureRefSource } from './lib/refSource'
import Layout from './components/Layout'
// (AppShell, the old sidebar layout, was deleted 2026-07-06 — Layout is the
// single shell for landing + in-app routes.)
import LandingPage from './pages/LandingPage'

// Code-splitting strategy:
// LandingPage stays eager — it's what 90% of new visitors hit first, so we
// don't want to make them wait on a chunk fetch. Every other page is lazy-
// loaded so first-load JS shrinks dramatically (~774 KB → ~250 KB landing
// chunk + smaller per-route chunks fetched on demand).
//
// Page-specific CSS (AdminPage.css, ActivatePage.css) is now imported by
// the page itself rather than in main.jsx — keeps the landing CSS lean.
const StratsPage = lazy(() => import('./pages/StratsPage'))
const LiveCoachPage = lazy(() => import('./pages/LiveCoachPage'))
const PressPage = lazy(() => import('./pages/PressPage'))
const R6TierListPage = lazy(() => import('./pages/R6TierListPage'))
const OW2StadiumTierListPage = lazy(() => import('./pages/OW2StadiumTierListPage'))
const EmbedMatchPrepPage = lazy(() => import('./pages/EmbedMatchPrepPage'))
const OperatorsPage = lazy(() => import('./pages/OperatorsPage'))
const OperatorsComparePage = lazy(() => import('./pages/OperatorsComparePage'))
const MetaPage = lazy(() => import('./pages/MetaPage'))
const VodPage = lazy(() => import('./pages/VodPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const ActivatePage = lazy(() => import('./pages/ActivatePage'))
const DownloadPage = lazy(() => import('./pages/DownloadPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const RefundPage = lazy(() => import('./pages/RefundPage'))
const ChangelogPage = lazy(() => import('./pages/ChangelogPage'))
const MatchPrepPage = lazy(() => import('./pages/MatchPrepPage'))
const LoadoutsPage = lazy(() => import('./pages/LoadoutsPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProgressPage = lazy(() => import('./pages/ProgressPage'))
const CoachConnectPage = lazy(() => import('./pages/CoachConnectPage'))
const ReferralLandingPage = lazy(() => import('./pages/ReferralLandingPage'))

// Tiny loading fallback shown while a route's chunk fetches. Keep it minimal
// — typical chunk fetch on a warm connection is <100ms and the user shouldn't
// see noticeable layout shift.
function RouteLoading() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(230,233,239,0.6)' }}>
      Loading…
    </div>
  )
}

// Catches chunk-load failures and silently reloads the page so the user
// picks up the freshly-deployed index.html and the new chunk hashes.
//
// Why this exists: when we deploy, every lazy chunk gets a new content-hash
// in its filename. Users who already have the old index.html in memory will
// try to fetch the OLD chunk URL on their next route navigation — that URL
// 404s because S3 deleted it during the sync. Without this boundary, react-
// router shows its default "Unexpected Application Error!" screen.
//
// Strategy: detect the chunk-load error pattern (TypeError mentioning
// "dynamically imported module" or "Failed to fetch"), then force-reload
// with a cache-busting query param. Use sessionStorage to bail out if we've
// already reloaded once for this URL — prevents an infinite reload loop if
// the chunk is genuinely missing (e.g. mid-deploy race).
class ChunkErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error) {
    const msg = String(error?.message || error || '')
    const isChunkError =
      msg.includes('dynamically imported module') ||
      msg.includes('Failed to fetch') ||
      msg.includes('Loading chunk') ||
      msg.includes('Importing a module script failed')
    if (!isChunkError) return
    // Guard against reload loops: only auto-reload once per pathname.
    const key = `chunkReloadAt:${window.location.pathname}${window.location.hash}`
    const lastReload = Number(sessionStorage.getItem(key) || 0)
    if (Date.now() - lastReload < 30_000) return // already tried within 30s
    sessionStorage.setItem(key, String(Date.now()))
    // Cache-bust to bypass any intermediate cache holding stale index.html.
    const url = new URL(window.location.href)
    url.searchParams.set('_v', String(Date.now()))
    window.location.replace(url.toString())
  }
  render() {
    if (this.state.hasError) {
      // Render a minimal loading state while the reload kicks off — much
      // friendlier than the default error screen for the brief moment the
      // user sees it.
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(230,233,239,0.6)' }}>
          Updating to latest version…
        </div>
      )
    }
    return this.props.children
  }
}

// Wraps a lazy-loaded page in a Suspense + chunk-error boundary so the
// router doesn't hang on the chunk fetch and stale clients silently
// recover when chunk hashes have changed since their last visit.
function L({ children }) {
  return (
    <ChunkErrorBoundary>
      <Suspense fallback={<RouteLoading />}>{children}</Suspense>
    </ChunkErrorBoundary>
  )
}

// Lands on the home page and scrolls to a section. Used for friendly URL
// aliases like /pricing → home + scroll to #pricing — better than the old
// silent redirect to / where the user couldn't tell anything happened.
//
// Implementation note: we deliberately don't clear the timeout on unmount.
// The unmount fires the moment we navigate('/'), which would cancel the
// scroll. The 350ms window gives LandingPage time to render before we look
// for the section element by ID.
function RedirectToSection({ sectionId }) {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/', { replace: true })
    window.setTimeout(() => {
      const el = document.getElementById(sectionId)
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY - 60
      window.scrollTo({ top, behavior: 'smooth' })
    }, 350)
  }, [navigate, sectionId])
  return null
}

const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/auth', element: <L><AuthPage /></L> },
      { path: '/terms', element: <L><TermsPage /></L> },
      { path: '/privacy', element: <L><PrivacyPage /></L> },
      { path: '/refund', element: <L><RefundPage /></L> },
      { path: '/changelog', element: <L><ChangelogPage /></L> },
      { path: '/press', element: <L><PressPage /></L> },
      { path: '/tools/r6-tier-list', element: <L><R6TierListPage /></L> },
      { path: '/tools/ow2-stadium-tier-list', element: <L><OW2StadiumTierListPage /></L> },
      { path: '/r/:code', element: <L><ReferralLandingPage /></L> },
      { path: '/strats', element: <L><StratsPage /></L> },
      { path: '/strats/:mapId', element: <L><StratsPage /></L> },
      { path: '/strats/:mapId/:siteId', element: <L><StratsPage /></L> },
      { path: '/strats/:mapId/:siteId/:side', element: <L><StratsPage /></L> },
      { path: '/live', element: <L><LiveCoachPage /></L> },
      { path: '/match-prep', element: <L><MatchPrepPage /></L> },
      { path: '/match-prep/:mapId', element: <L><MatchPrepPage /></L> },
      { path: '/loadouts', element: <L><LoadoutsPage /></L> },
      { path: '/dashboard', element: <L><DashboardPage /></L> },
      { path: '/progress', element: <L><ProgressPage /></L> },
      { path: '/coach-connect', element: <L><CoachConnectPage /></L> },
      { path: '/operators', element: <L><OperatorsPage /></L> },
      { path: '/operators/compare', element: <L><OperatorsComparePage /></L> },
      { path: '/operators/:opName', element: <L><OperatorsPage /></L> },
      { path: '/meta', element: <L><MetaPage /></L> },
      { path: '/vod', element: <L><VodPage /></L> },
      { path: '/admin', element: <L><AdminPage /></L> },
      { path: '/account', element: <L><AccountPage /></L> },
      { path: '/activate', element: <L><ActivatePage /></L> },
      { path: '/download', element: <L><DownloadPage /></L> },
    ],
  },
  // Embed routes — registered OUTSIDE the Layout wrapper so the iframed
  // widget has NO navbar / footer / founding banner. Iframe-safe by
  // design (no global UI that would render weirdly in a 600px frame).
  { path: '/embed/match-prep/:mapId', element: <L><EmbedMatchPrepPage /></L> },

  // Friendly redirects for paths a curious user (or auditor) might type
  // directly. Pricing is a landing-page section, so we send them home and
  // let the page-level scroll-on-mount logic handle the hash. Activation
  // and desktop have real routes — these aliases just match common guesses.
  { path: '/pricing', element: <RedirectToSection sectionId="pricing" /> },
  { path: '/activation', element: <Navigate to="/activate" replace /> },
  { path: '/desktop', element: <Navigate to="/download" replace /> },
  { path: '/desktop-app', element: <Navigate to="/download" replace /> },
  { path: '/sign-in', element: <Navigate to="/auth" replace /> },
  { path: '/signin', element: <Navigate to="/auth" replace /> },
  { path: '/login', element: <Navigate to="/auth" replace /> },
  { path: '/signup', element: <Navigate to="/auth?mode=signup" replace /> },
  { path: '/sign-up', element: <Navigate to="/auth?mode=signup" replace /> },
  { path: '/register', element: <Navigate to="/auth?mode=signup" replace /> },
  { path: '*', element: <Navigate to="/" replace /> },
])

// Capture ?ref= channel attribution before the router mounts — the router
// normalizes the URL on first navigation, which would drop the query param.
captureRefSource()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
