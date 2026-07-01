import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useActiveGame } from '../hooks/useActiveGame'
import { useGameData } from '../hooks/useGameData'
import './GameMetaPage.css'

// Generic game-aware Meta board. Computes top picks across all sites and
// most-banned characters across all maps from STRATS + BANS data. Works
// for every game in the registry.

function pickSide(siteData, key) {
  return siteData[key]
    || siteData[key === 'attack' ? 'sideAttack' : 'sideDefense']
    || siteData[key === 'attack' ? 't' : 'ct']
    || null
}

export default function GameMetaPage() {
  const { activeGameId } = useActiveGame()
  const { data, loading, error, gameMeta } = useGameData()
  const accent = gameMeta.color || '#00e5ff'
  const displayName = gameMeta.displayName || gameMeta.name || activeGameId
  const castWord = gameMeta.vocab?.operator || gameMeta.vocab?.cast || 'Character'

  const computed = useMemo(() => {
    if (!data?.STRATS) return null
    // Roll up picks across every map and side
    const opCounts = new Map()
    let totalSites = 0
    for (const mapId of Object.keys(data.STRATS)) {
      for (const siteId of Object.keys(data.STRATS[mapId] || {})) {
        totalSites++
        for (const sideKey of ['attack', 'defense']) {
          const side = pickSide(data.STRATS[mapId][siteId], sideKey)
          if (!side) continue
          for (const op of side.operators || []) {
            const cur = opCounts.get(op.name) || { name: op.name, role: op.role, essential: 0, recommended: 0, flex: 0, total: 0 }
            const prio = (op.priority || 'flex').toLowerCase()
            if (prio === 'essential') cur.essential++
            else if (prio === 'recommended') cur.recommended++
            else cur.flex++
            cur.total++
            cur.role = cur.role || op.role
            opCounts.set(op.name, cur)
          }
        }
      }
    }
    const opBoard = [...opCounts.values()].sort((a, b) => (b.essential * 3 + b.recommended * 2 + b.flex) - (a.essential * 3 + a.recommended * 2 + a.flex))

    // Ban frequency
    const banCounts = new Map()
    for (const mapId of Object.keys(data.BANS || {})) {
      for (const sideKey of ['attack', 'defense']) {
        for (const ban of (data.BANS[mapId][sideKey] || [])) {
          const cur = banCounts.get(ban.name) || { name: ban.name, total: 0 }
          cur.total++
          banCounts.set(ban.name, cur)
        }
      }
    }
    const banBoard = [...banCounts.values()].sort((a, b) => b.total - a.total)

    return { opBoard, banBoard, totalSites }
  }, [data])

  if (loading) return <div className="game-meta-page"><div className="game-meta-loading">Loading {displayName} meta…</div></div>
  if (error) return <div className="game-meta-page"><div className="game-meta-empty"><h1>Could not load</h1><p>{error}</p></div></div>
  if (!computed) return <div className="game-meta-page"><div className="game-meta-empty"><h1>{displayName} meta coming soon</h1></div></div>

  const maps = Array.isArray(data.MAPS) ? data.MAPS : Object.values(data.MAPS || {})
  const cast = Array.isArray(data.CAST) ? data.CAST : Object.values(data.CAST || {})

  return (
    <div className="game-meta-page">
      <header className="game-meta-header" style={{ borderColor: accent }}>
        <div className="game-meta-eyebrow" style={{ color: accent }}>{displayName} · Meta</div>
        <h1>What's <span style={{ color: accent }}>Working</span> Right Now</h1>
        <p>Aggregate competitive intel across <strong>{maps.length}</strong> {gameMeta.vocab?.map?.toLowerCase() || 'map'}s, <strong>{computed.totalSites}</strong> {gameMeta.vocab?.site?.toLowerCase() || 'site'}s, and <strong>{cast.length}</strong> {castWord.toLowerCase()}s.</p>
      </header>

      <div className="game-meta-grid">
        <section className="game-meta-card">
          <h2>Top {castWord} Picks</h2>
          <p className="game-meta-card-sub">Ranked by frequency across all sites + priority weight (essential / recommended / flex).</p>
          <ol className="game-meta-list">
            {computed.opBoard.slice(0, 15).map((op, i) => (
              <li key={op.name}>
                <span className="game-meta-rank">{i + 1}</span>
                <span className="game-meta-name">{op.name}</span>
                {op.role && <span className="game-meta-role">{op.role}</span>}
                <span className="game-meta-stats">
                  <span className="game-meta-stat-essential">{op.essential} ess</span>
                  <span className="game-meta-stat-recommended">{op.recommended} rec</span>
                  <span className="game-meta-stat-flex">{op.flex} flex</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {computed.banBoard.length > 0 && (
          <section className="game-meta-card">
            <h2>Most-Banned Targets</h2>
            <p className="game-meta-card-sub">{computed.banBoard.length} {castWord.toLowerCase()}s show up on at least one map's ban list.</p>
            <ol className="game-meta-list">
              {computed.banBoard.slice(0, 15).map((b, i) => (
                <li key={b.name}>
                  <span className="game-meta-rank">{i + 1}</span>
                  <span className="game-meta-name">{b.name}</span>
                  <span className="game-meta-role">{b.total} {b.total === 1 ? 'map' : 'maps'}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      <footer className="game-meta-foot">
        <p>Want to apply this read? <Link to="/strats" style={{ color: accent }}>Open Strats</Link> · <Link to="/loadouts" style={{ color: accent }}>Open Loadouts</Link> · <Link to="/match-prep" style={{ color: accent }}>Open Match Prep</Link>.</p>
      </footer>
    </div>
  )
}
