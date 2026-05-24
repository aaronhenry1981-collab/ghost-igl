import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'ghost-igl:recent-strats'
const MAX_RECENT = 5

function safeRead() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function safeWrite(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // Storage quota / disabled - no-op
  }
}

/**
 * Tracks the last N strats a user has viewed, by (mapId, siteId, side).
 * Entries are deduplicated and sorted most-recent-first.
 */
export function useRecentStrats() {
  const [recents, setRecents] = useState(safeRead)

  const track = useCallback((entry) => {
    if (!entry || !entry.mapId || !entry.siteId) return
    setRecents((prev) => {
      const filtered = prev.filter(
        (r) => !(r.mapId === entry.mapId && r.siteId === entry.siteId && r.side === entry.side),
      )
      const next = [{ ...entry, ts: Date.now() }, ...filtered].slice(0, MAX_RECENT)
      safeWrite(next)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setRecents([])
    safeWrite([])
  }, [])

  // Cross-tab sync
  useEffect(() => {
    function onStorage(e) {
      if (e.key === STORAGE_KEY) setRecents(safeRead())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return { recents, track, clear }
}
