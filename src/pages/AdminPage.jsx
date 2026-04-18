import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

const ADMIN_EMAILS = ['aaronhenry1981@gmail.com']

export default function AdminPage() {
  const { user, loading } = useAuth()
  const [stats, setStats] = useState({ totalUsers: 0, proUsers: 0, signupsToday: 0 })
  const [subs, setSubs] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  const isAdmin = user && ADMIN_EMAILS.includes(user.email?.toLowerCase())

  useEffect(() => {
    if (!isAdmin || !supabase) return
    loadData()
  }, [isAdmin])

  async function loadData() {
    setLoadingData(true)
    try {
      // Get subscriptions
      const { data: subsData } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false })

      setSubs(subsData || [])

      // Calculate stats
      const total = subsData?.length || 0
      const pro = subsData?.filter((s) => s.status === 'active' && (s.plan === 'pro' || s.plan === 'champion')).length || 0
      const today = new Date().toDateString()
      const todayCount = subsData?.filter((s) => new Date(s.created_at).toDateString() === today).length || 0

      setStats({ totalUsers: total, proUsers: pro, signupsToday: todayCount })
    } catch (err) {
      console.error('Error loading admin data:', err)
    }
    setLoadingData(false)
  }

  if (loading) return <div className="admin-page"><p>Loading...</p></div>

  if (!user) {
    return (
      <div className="admin-page">
        <div className="admin-locked">
          <h1>Admin Access Required</h1>
          <p>You must be signed in to view this page.</p>
          <Link to="/auth" className="btn btn-primary">Sign In</Link>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <div className="admin-locked">
          <h1>Access Denied</h1>
          <p>Your account does not have admin permissions.</p>
          <Link to="/" className="btn btn-primary">Back to Home</Link>
        </div>
      </div>
    )
  }

  const monthlyRevenue = subs
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + (s.plan === 'pro' ? 12 : s.plan === 'champion' ? 29 : 0), 0)

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {user.email}</p>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Subscribers</div>
          <div className="admin-stat-value">{stats.totalUsers}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Active Pro/Champion</div>
          <div className="admin-stat-value">{stats.proUsers}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Signups Today</div>
          <div className="admin-stat-value">{stats.signupsToday}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Monthly Revenue</div>
          <div className="admin-stat-value">${monthlyRevenue}</div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Manage Business</h2>
        </div>
        <div className="admin-links-grid admin-links-single">
          <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="admin-link-card admin-link-stripe">
            <div className="admin-link-icon">{'\uD83D\uDCB3'}</div>
            <div>
              <h3>Stripe Dashboard</h3>
              <p>Customers, subscriptions, payments, refunds, disputes</p>
            </div>
            <div className="admin-link-arrow">{'\u2192'}</div>
          </a>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Subscribers ({subs.length})</h2>
          <button onClick={loadData} className="btn btn-sm btn-outline">Refresh</button>
        </div>
        {loadingData ? (
          <p>Loading subscribers...</p>
        ) : subs.length === 0 ? (
          <div className="admin-empty">
            <p>No subscribers yet. Share your site to get your first signup!</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Stripe Customer</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id}>
                    <td className="admin-mono">{s.user_id?.slice(0, 8)}...</td>
                    <td><span className={`admin-badge admin-badge-${s.plan}`}>{s.plan}</span></td>
                    <td><span className={`admin-badge admin-badge-${s.status}`}>{s.status}</span></td>
                    <td>{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="admin-mono">{s.stripe_customer_id || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
