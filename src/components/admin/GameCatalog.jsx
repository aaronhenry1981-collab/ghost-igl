import { useState, useEffect, useCallback } from 'react'
import { GAMES } from '../../data/games/index.js'
import { Badge, Icon, Panel, Skeleton, StateView } from '../../features/admin/ui'

// Rainbow Six Siege content coverage: which maps have published site plans,
// how many attack/defense plans exist, and links to the live guide pages.
// Reads the same bundled data the public site renders (lazy-loaded here).

export default function GameCatalog() {
  const game = GAMES.find((g) => g.id === 'r6') || GAMES[0]
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setData(await game.load())
    } catch (err) {
      setError(err.message || 'Could not load the content data')
    }
  }, [game])

  useEffect(() => { load() }, [load])

  const stats = (() => {
    if (!data) return null
    const maps = Array.isArray(data.MAPS) ? data.MAPS : Object.values(data.MAPS || {})
    const cast = Array.isArray(data.CAST) ? data.CAST : Object.values(data.CAST || {})
    let sites = 0
    let plans = 0
    let covered = 0
    for (const mapId of Object.keys(data.STRATS || {})) {
      const siteIds = Object.keys(data.STRATS[mapId] || {})
      if (siteIds.length) covered += 1
      sites += siteIds.length
      for (const sid of siteIds) {
        if (data.STRATS[mapId][sid]?.attack) plans += 1
        if (data.STRATS[mapId][sid]?.defense) plans += 1
      }
    }
    return { maps, cast, sites, plans, covered }
  })()

  return (
    <Panel
      title="Rainbow Six Siege content"
      description="Coverage of the published map guides, from the same data the public site renders."
      actions={
        <>
          <a className="ax-btn ax-btn--sm" href="/guides/" target="_blank" rel="noreferrer"><Icon name="external" /> Map guides</a>
          <a className="ax-btn ax-btn--sm" href="/guides/operators/" target="_blank" rel="noreferrer"><Icon name="external" /> Operators</a>
          <a className="ax-btn ax-btn--sm" href="/guides/bans/" target="_blank" rel="noreferrer"><Icon name="external" /> Bans</a>
        </>
      }
      bodyClassName="is-flush"
    >
      {error ? <StateView kind="error" title="Content data could not be loaded" onRetry={load}>{error}</StateView>
        : !stats ? <Skeleton rows={4} />
          : (
            <>
              <div className="ax-metrics ax-metrics--4" style={{ borderRadius: 0 }}>
                <div className="ax-metric"><p className="ax-metric__label">Maps with site plans</p><p className="ax-metric__value">{stats.covered} / {stats.maps.length}</p></div>
                <div className="ax-metric"><p className="ax-metric__label">Sites covered</p><p className="ax-metric__value">{stats.sites}</p></div>
                <div className="ax-metric"><p className="ax-metric__label">Attack and defense plans</p><p className="ax-metric__value">{stats.plans}</p></div>
                <div className="ax-metric"><p className="ax-metric__label">Operators indexed</p><p className="ax-metric__value">{stats.cast.length}</p></div>
              </div>
              <div style={{ padding: '16px 20px 20px' }}>
                <p className="ax-subhead">Maps</p>
                <div className="ax-tiles">
                  {stats.maps.map((m) => {
                    const siteCount = Object.keys(data.STRATS?.[m.id] || {}).length
                    return (
                      <a key={m.id} href={`/guides/${m.id}.html`} target="_blank" rel="noreferrer" className={`ax-tile${siteCount ? ' is-covered' : ''}`}>
                        <span className="ax-badges">
                          <strong>{m.name || m.id}</strong>
                          {m.rankedPool && <Badge tone="muted">Ranked</Badge>}
                          {m.championOnly && <Badge tone="accent">Champion</Badge>}
                        </span>
                        <small>{siteCount ? `${siteCount} site${siteCount === 1 ? '' : 's'} with plans` : 'No site plans yet'}</small>
                      </a>
                    )
                  })}
                </div>
              </div>
            </>
          )}
    </Panel>
  )
}
