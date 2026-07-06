import { useEffect, useRef, useState } from 'react'

// Soft paywall counter for free-tier visitors. Tracks distinct (map, site, side)
// triples viewed and triggers the upsell modal once a threshold is crossed.
//
// Storage: localStorage `ghost-igl:free-strat-views` = { keys: ['bank/ceo/attack', ...], dismissedAt: ISO|null }
// Threshold: 5 distinct views before the first nudge. After dismissal, allow 3
// more views, then re-nudge. After that, every view re-nudges (graceful escalation).
//
// `useFreeStratLimit({ enabled, mapId, siteId, side })` — pass enabled=false for
// authed Pro/Champion (never gate them) and the function no-ops.

const STORAGE_KEY = 'ghost-igl:free-strat-views'
const FIRST_NUDGE_AT = 5
const POST_DISMISS_GRACE = 3

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { keys: [], dismissedAt: null, dismissCount: 0 }
    const parsed = JSON.parse(raw)
    return {
      keys: Array.isArray(parsed.keys) ? parsed.keys : [],
      dismissedAt: parsed.dismissedAt || null,
      dismissCount: parsed.dismissCount || 0,
    }
  } catch {
    return { keys: [], dismissedAt: null, dismissCount: 0 }
  }
}

function writeState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage blocked — degrade gracefully
  }
}

export function useFreeStratLimit({ enabled, mapId, siteId, side }) {
  const [showPaywall, setShowPaywall] = useState(false)
  const [viewCount, setViewCount] = useState(0)
  // Avoid double-increment on the same render (StrictMode + effect re-runs)
  const recordedKeysRef = useRef(new Set())

  useEffect(() => {
    if (!enabled || !mapId || !siteId || !side) return

    const key = `${mapId}/${siteId}/${side}`
    if (recordedKeysRef.current.has(key)) return
    recordedKeysRef.current.add(key)

    const state = readState()
    const isNew = !state.keys.includes(key)
    const nextKeys = isNew ? [...state.keys, key] : state.keys

    // Synced from localStorage (external view-count state), once per new
    // strat key — the recordedKeysRef guard makes cascades impossible.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setViewCount(nextKeys.length)

    let shouldShow = false
    if (state.dismissedAt) {
      // Already dismissed at least once. Re-show after POST_DISMISS_GRACE more views.
      const totalSinceFirstDismiss = nextKeys.length - FIRST_NUDGE_AT - state.dismissCount * POST_DISMISS_GRACE
      shouldShow = isNew && totalSinceFirstDismiss >= POST_DISMISS_GRACE
    } else {
      // First nudge: trigger when crossing the threshold
      shouldShow = nextKeys.length >= FIRST_NUDGE_AT
    }

    writeState({ ...state, keys: nextKeys })

    if (shouldShow) setShowPaywall(true)
  }, [enabled, mapId, siteId, side])

  function dismiss() {
    const state = readState()
    writeState({
      ...state,
      dismissedAt: new Date().toISOString(),
      dismissCount: (state.dismissCount || 0) + 1,
    })
    setShowPaywall(false)
  }

  return { showPaywall, viewCount, dismiss }
}
