import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useRecentStrats } from '../../hooks/useRecentStrats'
import { currentIdToken, fetchClimbProgress, fetchPlayerHome, isCustomerSuccessConfigured } from '../../lib/customerSuccess'
import { getPlayerData, isPlayerDataConfigured } from '../../lib/playerData'
import { buildLiteHomeView } from './liteHome'

// Loads the player home.
//   full mode: one call to the customer-success API (server-side projection)
//   lite mode: builds the same projection in the browser from existing APIs
// `loader` lets the dev preview inject fictional data through the real UI.
export function useHomeView({ loader = null } = {}) {
  const auth = useAuth()
  const { user, isAdmin, plan, profile, profileComplete, vodUsage, account, loading: authLoading } = auth
  const { recents } = useRecentStrats()
  const [state, setState] = useState({ status: 'loading', view: null, error: null, fetched: null })
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    if (!loader && (authLoading || !user)) return undefined
    const controller = new AbortController()
    let cancelled = false

    async function load() {
      if (loader) return { mode: 'preview', view: await loader() }
      const token = await currentIdToken()
      if (isCustomerSuccessConfigured()) {
        return { mode: 'full', view: await fetchPlayerHome(token, { signal: controller.signal }) }
      }
      const [climb, player] = await Promise.all([
        fetchClimbProgress(token, { signal: controller.signal })
          .then((data) => ({ status: 'ok', data }))
          .catch(() => ({ status: 'unavailable', data: null })),
        isPlayerDataConfigured()
          ? getPlayerData(token)
            .then((data) => ({ status: 'ok', data: { record: data?.player ? { ...data.player, canonical: data.canonical || data.player.canonical } : null, events: data?.recent_events || [] } }))
            .catch(() => ({ status: 'unavailable', data: null }))
          : Promise.resolve({ status: 'not_connected', data: null }),
      ])
      return { mode: 'lite', fetched: { climb, player } }
    }

    load()
      .then((result) => {
        if (!cancelled) setState({ status: 'ready', view: result.view || null, error: null, fetched: result.fetched || null })
      })
      .catch((err) => {
        if (!cancelled && err?.name !== 'AbortError') setState({ status: 'error', view: null, error: err, fetched: null })
      })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [loader, authLoading, user, version])

  // Lite projection is recomputed from live auth state (e.g. after the player
  // saves their profile) without refetching the slow sources.
  const liteView = useMemo(() => {
    if (!state.fetched || !user) return null
    return buildLiteHomeView({ user, isAdmin, plan, profile, profileComplete, vodUsage, account, recents, climb: state.fetched.climb, player: state.fetched.player })
  }, [state.fetched, user, isAdmin, plan, profile, profileComplete, vodUsage, account, recents])

  return {
    status: state.status,
    error: state.error,
    view: state.view || liteView,
    reload,
    authLoading: loader ? false : authLoading,
    signedIn: loader ? true : Boolean(user),
  }
}
