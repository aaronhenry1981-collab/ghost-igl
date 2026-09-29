import { lazy, Suspense, useEffect } from 'react'
import { Link, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { AdminDataProvider, useAdminData } from './AdminData'
import AdminShell from './AdminShell'
import { PageHeader, StateView } from './ui'
import OverviewPage from './pages/OverviewPage'
import MembersPage from './pages/MembersPage'
import MemberRecordPage from './pages/MemberRecordPage'

// Heavier sections load on first visit.
const CoachingPage = lazy(() => import('./pages/CoachingPage'))
const GrowthPage = lazy(() => import('./pages/GrowthPage'))
const ContentPage = lazy(() => import('./pages/ContentPage'))
const SystemPage = lazy(() => import('./pages/SystemPage'))
const CrmPage = lazy(() => import('../crm/CrmPage'))

/**
 * The admin application. Routes are relative to wherever it is mounted
 * (/admin/* in production, /__dev/admin/* for the fictional preview).
 */
export default function AdminApp({ base, viewer, preview = false, crmApi }) {
  return (
    <AdminDataProvider base={base} viewer={viewer} preview={preview} crmApi={crmApi}>
      <AdminShell>
        <ScrollToTop />
        <Suspense fallback={<StateView kind="loading" title="Loading…" />}>
          <Routes>
            <Route index element={<OverviewPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="members/:accountId" element={<MemberRecordPage />} />
            <Route path="coaching" element={<CoachingPage />} />
            <Route path="growth" element={<GrowthPage />} />
            <Route path="content" element={<ContentPage />} />
            <Route path="system" element={<SystemPage />} />
            <Route path="crm" element={<CrmSection />} />
            <Route path="crm/players/:key" element={<CrmSection />} />
            <Route path="crm/support/*" element={<CrmSection support />} />
            <Route path="crm/:tab" element={<CrmSection />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AdminShell>
    </AdminDataProvider>
  )
}

// New screen = top of page. Returning to the member list carries a focus
// target instead, and the list scrolls to that member itself.
function ScrollToTop() {
  const { pathname, state } = useLocation()
  useEffect(() => {
    if (!state?.focus) window.scrollTo(0, 0)
  }, [pathname, state])
  return null
}

function CrmSection({ support = false }) {
  const { base, crmApi, preview } = useAdminData()
  const params = useParams()
  const supportPath = support ? params['*'] || '' : null
  const tab = support ? 'support' : params.tab || 'overview'
  return (
    <CrmPage
      api={crmApi}
      basePath={`${base}/crm`}
      tab={tab}
      playerKey={support ? null : params.key || null}
      support={support ? { path: supportPath } : null}
      preview={preview}
      embedded
    />
  )
}

function NotFound() {
  const { base } = useAdminData()
  return (
    <>
      <PageHeader title="Page not found" description="This admin address does not exist." />
      <Link to={base} className="ax-btn">Go to the overview</Link>
    </>
  )
}
