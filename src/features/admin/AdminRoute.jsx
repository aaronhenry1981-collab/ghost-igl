import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { createLiveCrmApi } from '../crm/crmApi'
import { adminSigninReturn, analyticsStarted } from '../../lib/analyticsScope.mjs'
import AdminApp from './AdminApp'
import { StateView } from './ui'
import './admin.css'

// /admin/*. The client-side gate is for UX only: every admin API route checks
// the admins group on the server.
export default function AdminRoute() {
  const { user, isAdmin, loading } = useAuth()
  const crmApi = useMemo(() => createLiveCrmApi(), [])
  const { pathname } = useLocation()
  // Backstop: analytics started on a public page cannot be stopped, and every
  // link into the admin is a full page load. If anything still arrives here
  // client-side, reload so this page starts without it (lib/analyticsScope.mjs).
  const mustReload = analyticsStarted()
  useEffect(() => {
    if (mustReload) window.location.replace(window.location.href)
  }, [mustReload])

  if (mustReload || loading) return <Gate><StateView kind="loading" title="Checking your admin access…" /></Gate>
  if (!user) {
    return (
      <Gate>
        <h1 className="ax-page-title">Sign in required</h1>
        <p className="ax-page-desc">Sign in with an admin account to open the Recon 6 admin.</p>
        <Link to={`/auth?redirect=${encodeURIComponent(adminSigninReturn(pathname))}`} className="ax-btn ax-btn--primary" style={{ marginTop: 16 }}>Sign in</Link>
      </Gate>
    )
  }
  if (!isAdmin) {
    return (
      <Gate>
        <h1 className="ax-page-title">Admin access required</h1>
        <p className="ax-page-desc">{user.email} is not in the admins group.</p>
        <a href="/" className="ax-btn" style={{ marginTop: 16 }}>Back to the site</a>
      </Gate>
    )
  }
  return <AdminApp base="/admin" viewer={{ email: user.email }} crmApi={crmApi} />
}

function Gate({ children }) {
  return (
    <div className="ax" style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="ax-panel" style={{ width: 'min(440px, 100%)', padding: 28, margin: 0 }}>
        <img src="/logo-lockup.svg" alt="Recon 6" style={{ height: 56, width: 'auto', marginBottom: 20 }} />
        {children}
      </div>
    </div>
  )
}
