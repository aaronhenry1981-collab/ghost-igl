import { useState, useEffect } from 'react'
import { GAMES, findGame } from '../data/games/index.js'

// Returns the currently-active game based on subdomain (or ?game= override
// in dev). Uses the GAMES registry built by local-Claude in
// src/data/games/index.js — each game has { id, gameMeta, load() }.
//
// Subdomain routing strategy:
//   r6coaching.com         → r6 (root domain default)
//   cs2.r6coaching.com     → cs2
//   val.r6coaching.com     → valorant
//   ow2.r6coaching.com     → ow2
//   localhost:5173         → r6
//   localhost:5173?game=cs2 → cs2 (dev override)
//
// The hook returns the gameMeta synchronously. If you need the full data
// (MAPS, STRATS, etc.) call game.load() — it's a lazy import so we don't
// pull every game's data into the landing-page bundle.

const SUBDOMAIN_TO_GAME = {
  // Subdomain prefix → game id. R6 is root, no subdomain.
  'cs2': 'cs2',
  'val': 'valorant',
  'valorant': 'valorant',
  'ow2': 'ow2',
  'apex': 'apex',
  'mvr': 'mvr',
  'rivals': 'mvr',
  'halo': 'halo',
  'finals': 'finals',
  'cod': 'cod',
  'warzone': 'cod',
  'fn': 'fn',
  'fortnite': 'fn',
}

function detectGameId(host, search) {
  if (typeof window === 'undefined' && !host) return 'r6'
  const h = host || (typeof window !== 'undefined' ? window.location.hostname : '')
  const s = search || (typeof window !== 'undefined' ? window.location.search : '')

  // Dev override — ?game=cs2 forces a specific game in localhost
  const params = new URLSearchParams(s)
  const override = params.get('game')
  if (override && findGame(override)) return override

  // Subdomain match — check first dotted prefix
  const sub = (h.split('.')[0] || '').toLowerCase()
  if (SUBDOMAIN_TO_GAME[sub]) return SUBDOMAIN_TO_GAME[sub]

  // Default → R6 (root domain or unknown subdomain)
  return 'r6'
}

export function getCurrentGame(host, search) {
  const id = detectGameId(host, search)
  return findGame(id) || GAMES[0]
}

export function useGame() {
  const [game, setGame] = useState(() => GAMES[0])  // default R6 for SSR/initial render

  useEffect(() => {
    // Mount-only sync from window.location (external system) — the initial
    // GAMES[0] default exists for the first SSR-safe paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGame(getCurrentGame())
  }, [])

  return game
}

// Hook variant that resolves the FULL game data (MAPS, STRATS, etc.) via
// the lazy `load()` function. Returns { game, data, loading, error }.
// Use when a page actually needs the strats/maps data, not just the metadata.
export function useGameData() {
  const game = useGame()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Standard fetch-effect loading flags around the lazy game-data load —
    // one set per game change, guarded against cancellation.
    const load = game?.load
    let cancelled = false
    async function loadData() {
      if (!load) {
        if (!cancelled) setLoading(false)
        return
      }
      setLoading(true)
      try {
        const mod = await load()
        if (!cancelled) { setData(mod); setError(null) }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load game data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadData()
    return () => { cancelled = true }
  }, [game?.id, game?.load])

  return { game, data, loading, error }
}

export { GAMES, findGame }
