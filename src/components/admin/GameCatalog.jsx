import { useState, useEffect, useCallback } from 'react'
import { GAMES } from '../../data/games/index.js'

// Multi-game catalog viewer for the admin area. Lets Aaron switch between
// any of the 11 supported games and see their data status: maps,
// cast (operators/agents/heroes/loadouts), strats coverage, sample VERIFY
// comments, and quick links to the live SEO pages.
//
// Game data is lazy-loaded — clicking a tab triggers the import. R6 uses
// the legacy data path which doesn't load via Node ESM, so we read its
// counts from a different code path (the global STRATS/MAPS already in
// the bundle).

const SITE_URL = 'https://r6coaching.com'

function StatusPill({ status }) {
  const colors = {
    live: { bg: 'rgba(80,200,120,0.18)', fg: '#7ee2a4', border: '#50c878' },
    soon: { bg: 'rgba(255,180,80,0.15)', fg: '#ffc97a', border: '#ffb450' },
    error: { bg: 'rgba(255,90,90,0.15)', fg: '#ff8a8a', border: '#ff5a5a' },
  }
  const c = colors[status] || colors.soon
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', fontSize: '0.65rem',
      fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
      borderRadius: 999, color: c.fg, background: c.bg, border: `1px solid ${c.border}`,
    }}>
      {status}
    </span>
  )
}

export default function GameCatalog() {
  const [activeGameId, setActiveGameId] = useState('r6')
  const [gameData, setGameData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const activeGame = GAMES.find(g => g.id === activeGameId)
  const meta = activeGame?.gameMeta || {}
  // Resolve a vocab term across the two key conventions used in the data
  // registry (operator/cast, side_attack/sideAttack). Returns the fallback
  // when neither key is set so we never end up with "undefineds" strings.
  const term = (...keys) => {
    for (const k of keys) {
      const v = meta.vocab?.[k]
      if (typeof v === 'string' && v) return v
    }
    return null
  }
  const castLabel = term('operator', 'cast') || 'Cast'
  const castLabelPlural = `${castLabel}${castLabel.endsWith('s') ? '' : 's'}`
  const mapLabel = term('map') || 'Map'
  const siteLabel = term('site') || 'Site'
  const attackLabel = term('side_attack', 'sideAttack') || 'attack'
  const defenseLabel = term('side_defense', 'sideDefense') || 'defense'

  const loadGame = useCallback(async (gameId) => {
    const game = GAMES.find(g => g.id === gameId)
    if (!game) return
    setLoading(true)
    setError(null)
    setGameData(null)
    try {
      const data = await game.load()
      setGameData(data)
    } catch (err) {
      setError(err.message || 'Failed to load game data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGame(activeGameId)
  }, [activeGameId, loadGame])

  // Compute coverage stats from the loaded data
  const stats = (() => {
    if (!gameData) return null
    const maps = Array.isArray(gameData.MAPS) ? gameData.MAPS : Object.values(gameData.MAPS || {})
    const cast = Array.isArray(gameData.CAST) ? gameData.CAST : Object.values(gameData.CAST || {})
    let stratSites = 0
    let stratBlocks = 0
    let mapsCovered = 0
    if (gameData.STRATS) {
      for (const mapId of Object.keys(gameData.STRATS)) {
        const sites = Object.keys(gameData.STRATS[mapId] || {})
        if (sites.length > 0) mapsCovered++
        stratSites += sites.length
        for (const sid of sites) {
          if (gameData.STRATS[mapId][sid]?.attack) stratBlocks++
          if (gameData.STRATS[mapId][sid]?.defense) stratBlocks++
        }
      }
    }
    return {
      mapsTotal: maps.length,
      mapsCovered,
      castTotal: cast.length,
      stratSites,
      stratBlocks,
      hasBans: !!gameData.BANS && Object.keys(gameData.BANS).length > 0,
      hasPicks: !!gameData.PICKS && Object.keys(gameData.PICKS).length > 0,
      hasMeta: !!gameData.META,
      maps,
      cast,
    }
  })()

  return (
    <section className="admin-section">
      <div className="admin-section-header">
        <h2>Multi-Game Catalog</h2>
        <p className="admin-section-sub">
          All 11 supported games. Switch tabs to view each game's data, coverage status, and quick links to the live SEO pages.
        </p>
      </div>

      {/* Game tabs */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1.25rem',
        paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        {GAMES.map(g => {
          const m = g.gameMeta || {}
          const isActive = g.id === activeGameId
          return (
            <button
              key={g.id}
              onClick={() => setActiveGameId(g.id)}
              type="button"
              style={{
                padding: '8px 14px',
                background: isActive ? (m.color || '#00e5ff') : 'rgba(255,255,255,0.04)',
                color: isActive ? '#0a0f19' : '#e6e9ef',
                border: `1px solid ${isActive ? (m.color || '#00e5ff') : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              title={m.displayName || m.name || g.id}
            >
              {(m.shortCode || g.id).toUpperCase()}
            </button>
          )
        })}
      </div>

      {/* Active game header */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, color: meta.color || '#00e5ff' }}>
            {meta.displayName || meta.name || activeGameId}
          </h3>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <StatusPill status={loading ? 'soon' : error ? 'error' : 'live'} />
            <a
              href={activeGameId === 'r6' ? `${SITE_URL}/guides/` : `${SITE_URL}/games/${activeGameId}/`}
              target="_blank" rel="noreferrer"
              style={{ fontSize: '0.85rem', color: '#00e5ff', textDecoration: 'none', fontWeight: 600 }}
            >
              Open live page →
            </a>
          </div>
        </div>
        {meta.vocab && (
          <div style={{ fontSize: '0.8rem', color: 'rgba(230,233,239,0.55)', marginTop: 4 }}>
            Vocab: {castLabel.toLowerCase()} · {mapLabel.toLowerCase()} · {siteLabel.toLowerCase()} · {attackLabel} / {defenseLabel}
          </div>
        )}
      </div>

      {error && (
        <div className="admin-error">
          Could not load {activeGameId} data: {error}
          {activeGameId === 'r6' && ' (R6 has its own legacy data layer — see /admin user lists for now)'}
        </div>
      )}

      {loading && <p style={{ color: 'rgba(230,233,239,0.6)' }}>Loading {activeGameId} data…</p>}

      {!loading && !error && stats && (
        <>
          {/* Coverage stats */}
          <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', marginBottom: '1.5rem' }}>
            <Stat label={`${mapLabel}s`} value={`${stats.mapsCovered}/${stats.mapsTotal}`} sub="with strats" />
            <Stat label={castLabelPlural} value={stats.castTotal} sub="entries" />
            <Stat label="Strat Sites" value={stats.stratSites} sub="across all maps" />
            <Stat label="Strat Blocks" value={stats.stratBlocks} sub={`${attackLabel} + ${defenseLabel}`} />
            <Stat label="Bans/Picks" value={stats.hasBans ? 'Bans' : stats.hasPicks ? 'Picks' : '—'} sub="curated" />
            <Stat label="Meta tier" value={stats.hasMeta ? 'Set' : '—'} sub="S/A/B/C tiers" />
          </div>

          {/* Maps list */}
          <h4 style={{ margin: '1rem 0 0.5rem' }}>{mapLabel}s ({stats.maps.length})</h4>
          <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginBottom: '1.25rem' }}>
            {stats.maps.map(m => {
              const stratData = gameData.STRATS?.[m.id]
              const siteCount = stratData ? Object.keys(stratData).length : 0
              const url = activeGameId === 'r6' ? `${SITE_URL}/guides/${m.id}.html` : `${SITE_URL}/games/${activeGameId}/${m.id}.html`
              return (
                <a key={m.id} href={url} target="_blank" rel="noreferrer" style={{
                  padding: '0.6rem 0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderLeft: `3px solid ${siteCount > 0 ? '#50c878' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: 6,
                  textDecoration: 'none',
                  color: '#e6e9ef',
                  fontSize: '0.88rem',
                }}>
                  <strong>{m.name || m.id}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(230,233,239,0.55)', marginTop: 2 }}>
                    {siteCount > 0 ? `${siteCount} ${siteLabel.toLowerCase()}s with strats` : 'No strats yet'}
                  </div>
                </a>
              )
            })}
          </div>

          {/* Cast list — collapsed by default for high-cast games */}
          {stats.cast.length > 0 && (
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '0.5rem' }}>
                {castLabelPlural} ({stats.cast.length}) — click to expand
              </summary>
              <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', marginTop: '0.5rem' }}>
                {stats.cast.map(c => {
                  const slug = String(c.id || c.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                  const url = activeGameId === 'r6'
                    ? `${SITE_URL}/guides/operators/${slug}.html`
                    : `${SITE_URL}/games/${activeGameId}/cast/${slug}.html`
                  return (
                    <a key={c.id || c.name} href={url} target="_blank" rel="noreferrer" style={{
                      padding: '0.45rem 0.7rem',
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 6,
                      textDecoration: 'none',
                      color: '#e6e9ef',
                      fontSize: '0.85rem',
                    }}>
                      <strong>{c.name}</strong>
                      {c.role && <span style={{ color: 'rgba(230,233,239,0.55)', fontSize: '0.75rem', marginLeft: 6 }}>{c.role}</span>}
                    </a>
                  )
                })}
              </div>
            </details>
          )}

          {/* Quick links footer */}
          <div style={{
            marginTop: '1.25rem', padding: '0.75rem 1rem',
            background: 'rgba(255,255,255,0.03)', borderRadius: 8,
            display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem',
          }}>
            <a href={activeGameId === 'r6' ? `${SITE_URL}/guides/` : `${SITE_URL}/games/${activeGameId}/`} target="_blank" rel="noreferrer" style={{ color: '#00e5ff' }}>
              Live game page →
            </a>
            <a href={activeGameId === 'r6' ? `${SITE_URL}/guides/operators/` : `${SITE_URL}/games/${activeGameId}/cast/`} target="_blank" rel="noreferrer" style={{ color: '#00e5ff' }}>
              Cast catalog →
            </a>
            {activeGameId === 'r6' && (
              <a href={`${SITE_URL}/guides/bans/`} target="_blank" rel="noreferrer" style={{ color: '#00e5ff' }}>
                Ban guides →
              </a>
            )}
          </div>
        </>
      )}
    </section>
  )
}

function Stat({ label, value, sub }) {
  return (
    <div style={{
      padding: '0.85rem 1rem',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
    }}>
      <div style={{ fontSize: '0.7rem', color: 'rgba(230,233,239,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: 2 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'rgba(230,233,239,0.5)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
