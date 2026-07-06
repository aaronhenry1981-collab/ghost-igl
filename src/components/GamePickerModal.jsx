import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useActiveGame } from '../hooks/useActiveGame'

// First-time game picker — shown once after a user signs in if they
// haven't yet chosen which game they're playing. We seed the choice into
// localStorage and hide the prompt forever after one pick.
//
// Why a separate modal from WelcomeModal? WelcomeModal is plan/onboarding
// flavor (welcome to Pro, here's what you unlocked, etc.) — it appears
// once and then can re-appear after upgrades. Game picker is "what are
// we coaching today?" and only ever shows once. Different lifecycle.

const SEEN_KEY = 'recon:game-picker-seen'

export default function GamePickerModal() {
  const { user, loading } = useAuth()
  const { games, setActiveGameId } = useActiveGame()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (loading || !user) return
    let seen = false
    try { seen = !!localStorage.getItem(SEEN_KEY) } catch { /* SSR safe */ }
    // One-shot open gated on localStorage (external system) once auth
    // settles — a guarded init, not a render-cascade loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!seen) setOpen(true)
  }, [loading, user])

  function dismiss() {
    try { localStorage.setItem(SEEN_KEY, new Date().toISOString()) } catch { /* no-op */ }
    setOpen(false)
  }

  function pick(gameId) {
    setActiveGameId(gameId)
    dismiss()
    // All 10 games are in-app. /strats routes to the correct per-game view.
    navigate('/strats')
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(5,7,12,0.78)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 5000, padding: '1rem',
      }}
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-picker-title"
    >
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(20,24,34,0.96), rgba(15,18,26,0.96))',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 16,
          padding: '1.75rem',
          maxWidth: 580,
          width: '100%',
          boxShadow: '0 20px 80px rgba(0,0,0,0.6)',
          maxHeight: '92vh',
          overflowY: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'transparent', border: 'none',
            color: 'rgba(230,233,239,0.55)', fontSize: '1.4rem', cursor: 'pointer',
            padding: 4, lineHeight: 1,
          }}
        >×</button>

        <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#00e5ff', fontWeight: 700, marginBottom: 6 }}>
          Welcome to Recon 6
        </div>
        <h2 id="game-picker-title" style={{ margin: '0 0 0.4rem', fontSize: '1.5rem' }}>
          Which game are you playing?
        </h2>
        <p style={{ margin: '0 0 1.25rem', color: 'rgba(230,233,239,0.78)', fontSize: '0.95rem', lineHeight: 1.5 }}>
          Pick the game you want coaching for. 11 live with deep content; 9 in early access with catalogs + structure as content scales.
          R6 has the deepest content today, including premium tactics and the desktop coach app.
          You can switch anytime from the sidebar.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '0.6rem',
          }}
        >
          {games.map((g) => {
            const m = g.gameMeta || {}
            const isEarly = !!m.earlyAccess
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => pick(g.id)}
                style={{
                  textAlign: 'left',
                  padding: '0.85rem 0.9rem',
                  background: 'rgba(0,229,255,0.05)',
                  border: '1px solid rgba(0,229,255,0.3)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  color: '#e6e9ef',
                  display: 'flex', flexDirection: 'column', gap: 4,
                  position: 'relative',
                  transition: 'transform 0.12s, border-color 0.12s, background 0.12s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.borderColor = m.color || '#00e5ff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 10, height: 10, borderRadius: 999,
                      background: m.color || '#00e5ff',
                      boxShadow: `0 0 8px ${m.color || '#00e5ff'}`,
                    }}
                  />
                  <strong style={{ fontSize: '0.92rem' }}>{m.displayName || m.name || g.id}</strong>
                </div>
                <span style={{
                  display: 'inline-block',
                  padding: '1px 6px',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  borderRadius: 999,
                  color: isEarly ? '#ffc97a' : '#7ee2a4',
                  background: isEarly ? 'rgba(255,180,80,0.12)' : 'rgba(80,200,120,0.14)',
                  border: `1px solid ${isEarly ? 'rgba(255,180,80,0.45)' : 'rgba(80,200,120,0.45)'}`,
                  textTransform: 'uppercase',
                  alignSelf: 'flex-start',
                  marginTop: 2,
                }}>
                  {isEarly ? 'Early Access' : 'Live'}
                </span>
              </button>
            )
          })}
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={dismiss}
            style={{
              background: 'transparent', border: 'none',
              color: 'rgba(230,233,239,0.55)', fontSize: '0.85rem',
              cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3,
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
