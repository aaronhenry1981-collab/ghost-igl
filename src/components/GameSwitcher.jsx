import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useActiveGame } from '../hooks/useActiveGame'
import { useAuth } from '../hooks/useAuth'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'

// GameSwitcher — sidebar dropdown that lets the user pick which of the 10
// supported games they're currently looking at. The choice persists across
// reloads (localStorage) and drives the data shown on Strats / Operators /
// Meta / VOD Review pages.
//
// All 10 games are now live in-app: GameStratsPage, GameOperatorsPage,
// GameMetaPage, GameMatchPrepPage, and LoadoutsPage all read from the
// active game's data. R6 keeps a deeper bespoke StratsPage with the
// ProGate / ChampionGate / premium-tactics extras; the other 9 games
// use the standard tool set.

function StatusPill() {
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 6px',
      fontSize: '0.6rem',
      fontWeight: 700,
      letterSpacing: '0.06em',
      borderRadius: 999,
      color: '#7ee2a4',
      background: 'rgba(80,200,120,0.14)',
      border: '1px solid rgba(80,200,120,0.45)',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      Live
    </span>
  )
}

export default function GameSwitcher() {
  const { activeGame, activeGameId, setActiveGameId, games } = useActiveGame()
  const { plan, isAdmin, tierScope, profile, user, refreshProfile } = useAuth()
  const [open, setOpen] = useState(false)
  const [upgradeFor, setUpgradeFor] = useState(null) // { gameId, gameName } when locked
  const popRef = useRef(null)
  const navigate = useNavigate()

  // tier_scope semantics:
  //   'single'     — Pro / Champion locked to one game (active_game_id)
  //   'all_access' — admins, free users, and All-Access subscribers
  // Free users default to 'all_access' from the backend since gating
  // doesn't apply (most non-R6 free content is browse-only anyway).
  const isAllAccess = isAdmin || tierScope === 'all_access'
  const lockedGameId = !isAllAccess ? (profile?.active_game_id || null) : null

  // Persist the active_game_id to the user's profile (one-shot for
  // single-tier subscribers; harmless for everyone else).
  async function persistActiveGame(gameId) {
    if (!user) return
    try {
      const cognitoUser = getCurrentUser()
      if (!cognitoUser) return
      const session = await getSession(cognitoUser)
      const token = getIdToken(session)
      await fetch(`${API_URL}/me`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ active_game_id: gameId }),
      })
      // Refresh the profile state so other components see the new lock
      // without a page reload.
      refreshProfile?.()
    } catch {
      // Non-fatal — they keep using the game from localStorage, just
      // not synced cross-device. Re-tries on next switch attempt.
    }
  }

  // Close on outside click / escape — table-stakes for any popover.
  useEffect(() => {
    if (!open) return
    function onClick(e) {
      if (popRef.current && !popRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function pick(id) {
    // Tier scoping: single-tier subscribers are locked to one game once
    // they've picked it. Trying to switch shows an upgrade modal instead
    // of silently swapping — the user knows why it didn't work.
    if (lockedGameId && id !== lockedGameId) {
      const target = games.find((g) => g.id === id)
      setUpgradeFor({ gameId: id, gameName: target?.gameMeta?.displayName || id })
      setOpen(false)
      return
    }

    // First-time pick for a single-tier subscriber locks in the game on
    // their profile (server-side, cross-device). All-access users and
    // free users skip the lock — they can switch freely.
    if (!isAllAccess && user && !lockedGameId) {
      persistActiveGame(id)
    }

    setActiveGameId(id)
    setOpen(false)
    navigate('/strats')
  }

  const meta = activeGame?.gameMeta || {}
  const isR6 = activeGameId === 'r6'

  return (
    <div className="game-switcher" ref={popRef}>
      <button
        type="button"
        className="game-switcher-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change active game"
      >
        <span className="game-switcher-label">Active game</span>
        <span className="game-switcher-current">
          <span
            className="game-switcher-dot"
            style={{ background: meta.color || '#00e5ff' }}
            aria-hidden="true"
          />
          <span className="game-switcher-name">{meta.displayName || meta.name || activeGameId}</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`game-switcher-chev${open ? ' open' : ''}`}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="game-switcher-pop" role="listbox">
          <div className="game-switcher-pop-head">
            <strong>Pick a game</strong>
            <span style={{ color: 'rgba(230,233,239,0.55)', fontSize: '0.72rem' }}>
              {isAdmin ? 'Admin · every game'
                : isAllAccess ? 'All-Access · every game'
                : lockedGameId ? 'Pro · single game' : 'Pick your game'}
            </span>
          </div>
          <ul className="game-switcher-list">
            {games.map((g) => {
              const m = g.gameMeta || {}
              const isActive = g.id === activeGameId
              // Locked when single-tier subscriber has chosen a game and
              // this option isn't it. Active game is always unlocked.
              const isLocked = !!lockedGameId && g.id !== lockedGameId
              return (
                <li key={g.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={`game-switcher-option${isActive ? ' active' : ''}${isLocked ? ' locked' : ''}`}
                    onClick={() => pick(g.id)}
                  >
                    <span
                      className="game-switcher-option-dot"
                      style={{ background: m.color || '#00e5ff' }}
                      aria-hidden="true"
                    />
                    <span className="game-switcher-option-name">{m.displayName || m.name || g.id}</span>
                    {isLocked ? (
                      <span className="game-switcher-lock" title="Pro single-game — upgrade for all 20">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="5" y="11" width="14" height="10" rx="2" />
                          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                        </svg>
                      </span>
                    ) : (
                      <StatusPill />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
          {lockedGameId && (
            <div className="game-switcher-pop-foot">
              Want all 20 games? <Link to="/#pricing" onClick={() => setOpen(false)}>Upgrade to All-Access →</Link>
            </div>
          )}
        </div>
      )}

      {upgradeFor && (
        <div
          className="game-switcher-upgrade-overlay"
          onClick={() => setUpgradeFor(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="game-switcher-upgrade-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="game-switcher-upgrade-close"
              onClick={() => setUpgradeFor(null)}
              aria-label="Close"
            >×</button>
            <div className="game-switcher-upgrade-eyebrow">Pro single-game</div>
            <h3>Want to switch to {upgradeFor.gameName}?</h3>
            <p>
              Your Pro / Champion plan covers one game at a time. Upgrade to
              <strong> All-Access</strong> to unlock all 20 games — switch anytime, no upgrade fee per game.
            </p>
            <ul className="game-switcher-upgrade-perks">
              <li><strong>Pro+ All-Access</strong> — $19/mo (was $9 for one game)</li>
              <li><strong>Champion+ All-Access</strong> — $49/mo (was $29 for one game)</li>
              <li>Save 17% with annual at checkout</li>
            </ul>
            <div className="game-switcher-upgrade-cta">
              <Link to="/#pricing" onClick={() => setUpgradeFor(null)} className="btn btn-primary">
                See All-Access pricing →
              </Link>
              <button type="button" className="btn btn-ghost" onClick={() => setUpgradeFor(null)}>
                Stay on {games.find((g) => g.id === lockedGameId)?.gameMeta?.displayName || 'current game'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
