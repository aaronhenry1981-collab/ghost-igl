import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { GAMES } from '../data/games/index.js'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'

// Active-game context — tracks which game (r6, cs2, valorant, etc.) the
// logged-in user is currently looking at. Powers the sidebar game switcher
// and the per-route data resolution (Strats, Operators, Meta, VOD).
//
// Persistence:
//   - localStorage key 'recon:active-game' so the choice survives reloads
//     even for signed-out visitors (instant, no network dependency)
//   - ALSO synced to the profile's active_game_id via PUT /me (best-effort,
//     fire-and-forget) whenever the user is signed in. active_game_id was
//     already an accepted /me field server-side — it just wasn't being sent.
//     This is what powers the admin dashboard's "who's active, which game"
//     view; the localStorage copy stays authoritative for the UI itself.
//
// Default game is R6 — the only one with full live coverage today. When the
// other 9 games' interactive UIs are wired up, the default stays R6 unless
// the user has explicitly picked something else.

const STORAGE_KEY = 'recon:active-game'
const DEFAULT_GAME = 'r6'

const GameContext = createContext(null)

function readStoredGame() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v && GAMES.some((g) => g.id === v)) return v
  } catch { /* SSR / disabled storage */ }
  return DEFAULT_GAME
}

// Best-effort background sync — never blocks the UI, never throws. Uses the
// raw cognito helpers (not useAuth()) so this works regardless of provider
// nesting order. Silently no-ops for signed-out visitors (no current user).
function syncActiveGameToProfile(gameId) {
  try {
    const cognitoUser = getCurrentUser()
    if (!cognitoUser) return
    getSession(cognitoUser)
      .then((session) => {
        const token = getIdToken(session)
        return fetch(`${API_URL}/me`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ active_game_id: gameId }),
        })
      })
      .catch(() => { /* best-effort — UI already updated from localStorage */ })
  } catch { /* no-op */ }
}

export function GameProvider({ children }) {
  const [activeGameId, setActiveGameIdState] = useState(readStoredGame)

  const setActiveGameId = useCallback((nextId) => {
    if (!GAMES.some((g) => g.id === nextId)) return
    setActiveGameIdState(nextId)
    try { localStorage.setItem(STORAGE_KEY, nextId) } catch { /* no-op */ }
    syncActiveGameToProfile(nextId)
  }, [])

  const activeGame = useMemo(() => GAMES.find((g) => g.id === activeGameId) || GAMES.find((g) => g.id === DEFAULT_GAME), [activeGameId])
  const isR6 = activeGameId === 'r6'

  // One-time sync on mount — covers signed-in users who never touch the game
  // switcher (they'd otherwise never get an active_game_id written at all).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { syncActiveGameToProfile(activeGameId) }, [])

  // Notify other tabs / components when the active game changes — useful
  // for the strats page redirecting on switch, etc.
  useEffect(() => {
    function onStorage(e) {
      if (e.key !== STORAGE_KEY) return
      if (e.newValue && GAMES.some((g) => g.id === e.newValue)) {
        setActiveGameIdState(e.newValue)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo(() => ({
    activeGameId,
    activeGame,
    setActiveGameId,
    isR6,
    games: GAMES,
  }), [activeGameId, activeGame, setActiveGameId, isR6])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useActiveGame() {
  const ctx = useContext(GameContext)
  if (!ctx) {
    // If a page reads the context before the provider mounts (e.g. tests,
    // hot-reload edge cases), return a sane R6 default rather than throw.
    return {
      activeGameId: DEFAULT_GAME,
      activeGame: GAMES.find((g) => g.id === DEFAULT_GAME),
      setActiveGameId: () => {},
      isR6: true,
      games: GAMES,
    }
  }
  return ctx
}
