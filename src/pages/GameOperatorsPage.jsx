import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useActiveGame } from '../hooks/useActiveGame'
import { useGameData } from '../hooks/useGameData'
import './GameOperatorsPage.css'

// Generic, game-aware Operators / Cast browser. Renders CAST data for any
// game in the registry. Different games use different vocab (operator,
// agent, hero, legend, role) — we adapt the H1 + filters off gameMeta.

export default function GameOperatorsPage() {
  const { activeGameId } = useActiveGame()
  const { data, loading, error, gameMeta } = useGameData()
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const accent = gameMeta.color || '#00e5ff'
  const displayName = gameMeta.displayName || gameMeta.name || activeGameId
  const castWord = gameMeta.vocab?.operator || gameMeta.vocab?.cast || 'Character'
  const castWordPlural = `${castWord}${castWord.endsWith('s') ? '' : 's'}`

  const cast = useMemo(() => {
    if (!data?.CAST) return []
    return Array.isArray(data.CAST) ? data.CAST : Object.values(data.CAST)
  }, [data])

  const roles = useMemo(() => {
    const set = new Set()
    cast.forEach((c) => { if (c.role) set.add(c.role) })
    return ['all', ...[...set].sort()]
  }, [cast])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cast.filter((c) => {
      if (roleFilter !== 'all' && c.role !== roleFilter) return false
      if (!q) return true
      const hay = [c.name, c.role, c.id, ...(c.abilities || []).map((a) => a.name || a)].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [cast, query, roleFilter])

  if (loading) return <div className="game-ops-page"><div className="game-ops-loading">Loading {displayName} {castWordPlural.toLowerCase()}…</div></div>
  if (error) return <div className="game-ops-page"><div className="game-ops-empty"><h1>Could not load</h1><p>{error}</p></div></div>
  if (cast.length === 0) {
    return <div className="game-ops-page"><div className="game-ops-empty"><h1>{displayName} cast coming soon</h1></div></div>
  }

  return (
    <div className="game-ops-page">
      <header className="game-ops-header" style={{ borderColor: accent }}>
        <div className="game-ops-eyebrow" style={{ color: accent }}>
          {displayName} · {castWordPlural}
        </div>
        <h1>Every <span style={{ color: accent }}>{castWord}</span></h1>
        <p>{cast.length} {castWordPlural.toLowerCase()} indexed by role and kit. Search by name or role; click any to see their full breakdown.</p>
      </header>

      <div className="game-ops-controls">
        <input
          type="search"
          className="game-ops-search"
          placeholder={`Search ${castWordPlural.toLowerCase()}, roles, abilities…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {roles.length > 1 && (
          <div className="game-ops-roles">
            {roles.map((r) => (
              <button
                key={r}
                type="button"
                className={`game-ops-role-btn${r === roleFilter ? ' active' : ''}`}
                onClick={() => setRoleFilter(r)}
                style={r === roleFilter ? { borderColor: accent, color: accent } : undefined}
              >
                {r === 'all' ? 'All roles' : r}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="game-ops-grid">
        {filtered.map((c) => {
          const slug = String(c.id || c.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          return (
            <a
              key={c.id || c.name}
              href={`/games/${activeGameId}/cast/${slug}.html`}
              className="game-ops-card"
              target="_blank"
              rel="noreferrer"
              style={{ borderLeftColor: accent }}
            >
              <div className="game-ops-card-head">
                <strong>{c.name}</strong>
                {c.role && <span className="game-ops-card-role">{c.role}</span>}
              </div>
              {c.kit && <p className="game-ops-card-desc">{c.kit}</p>}
              {Array.isArray(c.abilities) && c.abilities.length > 0 && (
                <ul className="game-ops-card-abilities">
                  {c.abilities.slice(0, 3).map((a, i) => <li key={i}>{a.name || a}</li>)}
                </ul>
              )}
            </a>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="game-ops-empty-block">
          <p>No {castWordPlural.toLowerCase()} match those filters.</p>
          <button type="button" onClick={() => { setQuery(''); setRoleFilter('all') }} className="btn btn-outline btn-sm">Clear</button>
        </div>
      )}

      <footer className="game-ops-foot">
        <p>Want loadouts and team-comp combos for {displayName}? <Link to="/loadouts" style={{ color: accent }}>Open Loadouts</Link>.</p>
      </footer>
    </div>
  )
}
