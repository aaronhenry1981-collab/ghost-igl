import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { adminFetch } from './adminFetch'
import { accountIdOf } from './memberDirectory.mjs'

// Member directory + business summary, loaded once for the whole admin area
// (GET /admin/users reconciles against live Stripe) and kept while moving
// between screens, so opening a member and coming back does not refetch.
const AdminDataContext = createContext(null)

const EMPTY_SUMMARY = {
  total: 0, active: 0, canceled: 0, past_due: 0,
  pro_active: 0, elite_active: 0, champion_active: 0,
  trialing: 0, trials_expected_to_convert: 0, ending: 0,
  mrr_dollars: '0.00', trial_mrr_dollars: '0.00',
  collected_30d_dollars: null, refunds_30d_dollars: null, new_last_30_days: 0,
}

export function AdminDataProvider({ base = '/admin', viewer, preview = false, crmApi = null, children }) {
  const [state, setState] = useState({ status: 'loading', users: [], summary: EMPTY_SUMMARY, billingSource: null, billingWarning: null, error: null, loadedAt: null })

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, status: s.users.length ? 'refreshing' : 'loading', error: null }))
    try {
      const data = await adminFetch('/admin/users')
      setState({
        status: 'ready',
        users: data.users || [],
        summary: { ...EMPTY_SUMMARY, ...(data.summary || {}) },
        billingSource: data.billing_source || null,
        billingWarning: data.billing_warning || null,
        error: null,
        loadedAt: Date.now(),
      })
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err.message }))
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  // Clock for "last active" labels; refreshed each minute, never read during render.
  const [nowMs, setNowMs] = useState(0)
  useEffect(() => {
    const tick = () => setNowMs(Date.now())
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  // Local update after a name edit (the server response is the source).
  const patchMember = useCallback((accountId, patch) => {
    setState((s) => ({ ...s, users: s.users.map((u) => (accountIdOf(u) === accountId ? { ...u, ...patch } : u)) }))
  }, [])

  const value = useMemo(() => ({ ...state, reload, patchMember, nowMs, base, viewer, preview, crmApi }), [state, reload, patchMember, nowMs, base, viewer, preview, crmApi])
  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext)
  if (!ctx) throw new Error('useAdminData outside AdminDataProvider')
  return ctx
}

/** Loads one admin resource with loading / error / reload state. */
export function useAdminResource(path, { enabled = true } = {}) {
  const [state, setState] = useState({ status: enabled ? 'loading' : 'idle', data: null, error: null })
  const load = useCallback(async () => {
    if (!path) return
    setState((s) => ({ ...s, status: s.data ? 'refreshing' : 'loading', error: null }))
    try {
      setState({ status: 'ready', data: await adminFetch(path), error: null })
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err.message }))
    }
  }, [path])
  useEffect(() => { if (enabled) load() }, [enabled, load])
  return { ...state, reload: load }
}
