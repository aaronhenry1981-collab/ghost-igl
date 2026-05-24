import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useActiveGame } from '../hooks/useActiveGame'

// Shown when a user has a non-R6 game active and lands on an in-app route
// (Strats, Operators, Meta, VOD) whose interactive UI is still R6-only.
// The catalog content for the other 9 games already exists at /games/<id>/
// (per-game landing + per-map + per-cast + blog rank-up posts), so we
// route the user there with a clear explanation rather than showing an
// empty page or a fake "coming soon" placeholder.
//
// Lazy-loads the active game's data so we can show real numbers (maps,
// cast count, strat coverage) — keeps it honest about what's actually
// shipped for the picked game vs vapor.

export default function GameRedirect({ feature, gameId, subPath = '' }) {
  const { activeGame, setActiveGameId } = useActiveGame()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    activeGame?.load?.()
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activeGame])

  const meta = activeGame?.gameMeta || {}
  const accent = meta.color || '#00e5ff'
  const displayName = meta.displayName || meta.name || gameId

  const stats = (() => {
    if (!data) return null
    const maps = Array.isArray(data.MAPS) ? data.MAPS : Object.values(data.MAPS || {})
    const cast = Array.isArray(data.CAST) ? data.CAST : Object.values(data.CAST || {})
    return { mapCount: maps.length, castCount: cast.length }
  })()

  const targetUrl = `/games/${gameId}/${subPath}`.replace(/\/$/, '/') || `/games/${gameId}/`

  return (
    <div style={{
      maxWidth: 760,
      margin: '2.5rem auto',
      padding: '0 1.25rem',
    }}>
      <div style={{
        padding: '2rem 2.25rem',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))',
        border: `1px solid ${accent}`,
        borderRadius: 16,
        boxShadow: `0 0 40px ${accent}1a`,
      }}>
        <div style={{
          fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase',
          color: accent, fontWeight: 700, marginBottom: 6,
        }}>
          {feature} &middot; {displayName}
        </div>
        <h1 style={{ margin: '0 0 0.6rem', fontSize: '1.85rem', lineHeight: 1.2 }}>
          {displayName} {feature.toLowerCase()} live in the catalog &mdash; in-app UI rolling out next.
        </h1>
        <p style={{ color: 'rgba(230,233,239,0.85)', margin: '0 0 1.25rem', lineHeight: 1.55 }}>
          {loading ? (
            'Loading game data…'
          ) : stats ? (
            <>
              {displayName} ships with <strong>{stats.mapCount} maps</strong> and{' '}
              <strong>{stats.castCount} {meta.vocab?.operator?.toLowerCase() || meta.vocab?.cast?.toLowerCase() || 'characters'}</strong>{' '}
              fully indexed at <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4 }}>/games/{gameId}/</code>.
              The interactive in-app pages are being built per game &mdash; for now the catalog page is your home for {displayName} content.
            </>
          ) : (
            <>
              The {displayName} catalog page has the maps, characters, and rank-up posts that are ready today.
              In-app interactive pages roll out per game.
            </>
          )}
        </p>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <a
            href={targetUrl}
            className="btn btn-primary"
            style={{ background: accent, color: '#0a0f19' }}
          >
            Open {displayName} catalog &rarr;
          </a>
          <button
            type="button"
            onClick={() => setActiveGameId('r6')}
            className="btn btn-outline"
          >
            Switch to R6 (fully live)
          </button>
        </div>

        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: '0.85rem',
          color: 'rgba(230,233,239,0.6)',
        }}>
          You can change games anytime from the sidebar switcher above. R6 is the only fully-live in-app
          experience today &mdash; the others have generated catalogs and rolling-out interactive UI.
        </div>
      </div>

      <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem' }}>
        <Link to="/account" style={{ color: 'rgba(230,233,239,0.65)', textDecoration: 'none' }}>
          Manage subscription &rarr;
        </Link>
      </div>
    </div>
  )
}
