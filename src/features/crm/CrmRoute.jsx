import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import CrmPage from './CrmPage'
import { createLiveCrmApi } from './crmApi'
import './Crm.css'

// /admin/crm, /admin/crm/:tab, /admin/crm/players/:key
// Client-side gate for UX only; the API enforces the admins group itself.
export default function CrmRoute() {
  const { user, isAdmin, loading } = useAuth()
  const { tab = 'overview', key = null } = useParams()
  const api = useMemo(() => createLiveCrmApi(), [])

  if (loading) return <div className="crm"><p className="crm-state" role="status">Loading…</p></div>
  if (!user || !isAdmin) {
    return (
      <div className="crm">
        <section className="crm-panel" role="alert">
          <h1 className="crm-title">{user ? 'Admin access required' : 'Sign in required'}</h1>
          {!user && <Link to="/auth?redirect=/admin/crm" className="btn btn-primary btn-sm">Sign in</Link>}
        </section>
      </div>
    )
  }
  return <CrmPage api={api} basePath="/admin/crm" tab={tab} playerKey={key} />
}
