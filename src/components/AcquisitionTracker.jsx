import { lazy, Suspense, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getCurrentUser, getIdToken, getSession } from '../lib/cognito'
import { addPlayerTimelineEvent, isPlayerDataConfigured } from '../lib/playerData'
import { markSynced, readAttribution, readSynced, userKeyFor } from '../lib/attribution/store'
import { checkoutEvent } from '../lib/attribution/events'
import { syncAttribution } from '../lib/attribution/sync'
import { TRACK_EVENT } from '../utils/analytics'

// Records how a signed-in player found Recon on their own player-data
// timeline (Recon's system of record): the browser's first touch, each real
// touch, and checkout clicks. Anonymous visitors are measured by Plausible
// only. No UI; never blocks or breaks the page.
//
// Mounted once, inside AuthProvider and outside the router.

// Dev-only inspector: add ?attr_debug=1 to any URL under `npm run dev`.
// `import.meta.env.DEV` is false in production builds, so neither the flag nor
// the panel's chunk ships.
const DEBUG = import.meta.env.DEV && typeof window !== 'undefined' && /[?&#]attr_debug=1/.test(window.location.search + window.location.hash)
const DevAttributionPanel = DEBUG ? lazy(() => import('../lib/attribution/DevAttributionPanel')) : null

async function currentIdToken() {
  const cognitoUser = getCurrentUser()
  if (!cognitoUser) return null
  const session = await getSession(cognitoUser)
  return getIdToken(session) || null
}

export default function AcquisitionTracker() {
  const { user, loading } = useAuth()
  const syncedFor = useRef(null)
  const tokenRef = useRef(null)

  // Once per signed-in user per page load.
  useEffect(() => {
    if (loading || !user?.id || !isPlayerDataConfigured()) return
    if (syncedFor.current === user.id) return
    syncedFor.current = user.id
    ;(async () => {
      try {
        const state = readAttribution()
        const token = await currentIdToken()
        tokenRef.current = token
        if (!state || !token) return
        const userKey = userKeyFor(user.id)
        await syncAttribution({
          state,
          synced: readSynced(userKey),
          post: (event) => addPlayerTimelineEvent(token, event),
          markSynced: (keys) => markSynced(userKey, keys),
        })
      } catch {
        // Attribution is nice-to-have; never surface an error.
      }
    })()
  }, [user, loading])

  // Checkout clicks while signed in. The token is cached at sign-in so the
  // request starts before a same-tab checkout navigation; keepalive lets it
  // finish after the page unloads.
  useEffect(() => {
    if (!user?.id || !isPlayerDataConfigured()) return undefined
    function onTrack(e) {
      const { event, props } = e.detail || {}
      if (event !== 'Pricing CTA Click') return
      const payload = checkoutEvent(readAttribution(), { tier: props?.tier, location: props?.location })
      const send = (token) => (token ? addPlayerTimelineEvent(token, payload, { keepalive: true }) : null)
      Promise.resolve(tokenRef.current || currentIdToken())
        .then(send)
        .catch(() => {})
    }
    window.addEventListener(TRACK_EVENT, onTrack)
    return () => window.removeEventListener(TRACK_EVENT, onTrack)
  }, [user])

  if (!DevAttributionPanel) return null
  return (
    <Suspense fallback={null}>
      <DevAttributionPanel />
    </Suspense>
  )
}
