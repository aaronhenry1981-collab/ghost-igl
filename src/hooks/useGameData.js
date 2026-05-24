import { useState, useEffect, useRef } from 'react'
import { useActiveGame } from './useActiveGame'

// Loads the active game's data graph (MAPS, CAST, STRATS, BANS/PICKS,
// LOADOUTS, META, gameMeta) lazily via the registry. Caches per game id
// so swapping back-and-forth doesn't trigger a re-fetch.
//
// Returns: { data, loading, error, gameId, gameMeta }
//
// `data` is null while the chunk is loading (first switch to a game).
// Components should branch on loading/data and render skeletons or a
// "loading {Game}" placeholder.

const cache = new Map()

export function useGameData() {
  const { activeGameId, activeGame } = useActiveGame()
  const [data, setData] = useState(() => cache.get(activeGameId) || null)
  const [loading, setLoading] = useState(!cache.has(activeGameId))
  const [error, setError] = useState(null)
  const reqIdRef = useRef(0)

  useEffect(() => {
    const cached = cache.get(activeGameId)
    if (cached) {
      setData(cached)
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    setData(null)
    const reqId = ++reqIdRef.current
    activeGame?.load?.()
      .then((mod) => {
        if (reqId !== reqIdRef.current) return // stale request
        cache.set(activeGameId, mod)
        setData(mod)
        setLoading(false)
      })
      .catch((err) => {
        if (reqId !== reqIdRef.current) return
        setError(err.message || 'Failed to load game data')
        setLoading(false)
      })
  }, [activeGameId, activeGame])

  return {
    data,
    loading,
    error,
    gameId: activeGameId,
    gameMeta: activeGame?.gameMeta || {},
  }
}
