import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useActiveGame } from '../hooks/useActiveGame'
import { useGameData } from '../hooks/useGameData'
import './MatchPrepPage.css'

// Generic game-aware Match Prep cheatsheet — same one-screen pre-round
// concept as the R6 page, but data-driven from the active game's MAPS,
// STRATS, BANS, PICKS so it works for every game in the registry.

function pickSide(siteData, key) {
  return siteData[key]
    || siteData[key === 'attack' ? 'sideAttack' : 'sideDefense']
    || siteData[key === 'attack' ? 't' : 'ct']
    || null
}

export default function GameMatchPrepPage() {
  const { activeGameId } = useActiveGame()
  const { data, loading, error, gameMeta } = useGameData()
  const [mapId, setMapId] = useState(null)
  const [copied, setCopied] = useState(false)

  const accent = gameMeta.color || '#00e5ff'
  const displayName = gameMeta.displayName || gameMeta.name || activeGameId
  const sideAttack = gameMeta.vocab?.side_attack || gameMeta.vocab?.sideAttack || 'Attack'
  const sideDefense = gameMeta.vocab?.side_defense || gameMeta.vocab?.sideDefense || 'Defense'
  const mapWord = gameMeta.vocab?.map || 'Map'
  const siteWord = gameMeta.vocab?.site || 'Site'

  const maps = useMemo(() => {
    if (!data?.MAPS) return []
    const arr = Array.isArray(data.MAPS) ? data.MAPS : Object.values(data.MAPS)
    return arr.filter((m) => data.STRATS?.[m.id])
  }, [data])

  useEffect(() => {
    if (!mapId && maps.length > 0) setMapId(maps[0].id)
  }, [maps, mapId])

  const mapData = maps.find((m) => m.id === mapId)
  const sites = Array.isArray(mapData?.sites) ? mapData.sites : Object.values(mapData?.sites || {})
  const stratsForMap = data?.STRATS?.[mapId]
  const banList = data?.BANS?.[mapId] || null
  const pickList = data?.PICKS?.[mapId] || null

  // Roll up top picks across the map
  const topPicks = useMemo(() => {
    if (!stratsForMap) return { attack: [], defense: [] }
    const counts = { attack: new Map(), defense: new Map() }
    const weight = { essential: 3, recommended: 2, flex: 1 }
    for (const siteId of Object.keys(stratsForMap)) {
      for (const sideKey of ['attack', 'defense']) {
        const sideStrat = pickSide(stratsForMap[siteId], sideKey)
        if (!sideStrat) continue
        for (const op of sideStrat.operators || []) {
          const w = weight[op.priority] || 1
          const cur = counts[sideKey].get(op.name) || { name: op.name, role: op.role, score: 0, sites: 0 }
          cur.score += w
          cur.sites += 1
          cur.role = cur.role || op.role
          counts[sideKey].set(op.name, cur)
        }
      }
    }
    return {
      attack: [...counts.attack.values()].sort((a, b) => b.score - a.score).slice(0, 5),
      defense: [...counts.defense.values()].sort((a, b) => b.score - a.score).slice(0, 5),
    }
  }, [stratsForMap])

  function copyAsText() {
    if (!mapData) return
    const lines = [`MATCH PREP — ${displayName.toUpperCase()} · ${(mapData.name || mapData.id).toUpperCase()}`, '']
    if (banList?.attack?.length) {
      lines.push(`BANS — ${sideAttack.toUpperCase()}`)
      banList.attack.forEach((b) => lines.push(`  • ${b.name} — ${b.reason}`))
      lines.push('')
    }
    if (banList?.defense?.length) {
      lines.push(`BANS — ${sideDefense.toUpperCase()}`)
      banList.defense.forEach((b) => lines.push(`  • ${b.name} — ${b.reason}`))
      lines.push('')
    }
    if (pickList?.attack?.length) {
      lines.push(`PICKS — ${sideAttack.toUpperCase()}`)
      pickList.attack.forEach((p) => lines.push(`  • ${p.name || p}${p.reason ? ' — ' + p.reason : ''}`))
      lines.push('')
    }
    if (pickList?.defense?.length) {
      lines.push(`PICKS — ${sideDefense.toUpperCase()}`)
      pickList.defense.forEach((p) => lines.push(`  • ${p.name || p}${p.reason ? ' — ' + p.reason : ''}`))
      lines.push('')
    }
    lines.push(`TOP ${sideAttack.toUpperCase()} PICKS`)
    topPicks.attack.forEach((p) => lines.push(`  • ${p.name} (${p.role || 'flex'}) — ${p.sites} ${siteWord.toLowerCase()}${p.sites === 1 ? '' : 's'}`))
    lines.push('')
    lines.push(`TOP ${sideDefense.toUpperCase()} PICKS`)
    topPicks.defense.forEach((p) => lines.push(`  • ${p.name} (${p.role || 'flex'}) — ${p.sites} ${siteWord.toLowerCase()}${p.sites === 1 ? '' : 's'}`))
    lines.push('')
    for (const site of sites) {
      const s = stratsForMap?.[site.id]
      if (!s) continue
      lines.push(`${siteWord.toUpperCase()} — ${site.name || site.id}`)
      const atk = pickSide(s, 'attack')
      const def = pickSide(s, 'defense')
      const callouts = (atk?.callouts || def?.callouts || []).slice(0, 6)
      if (callouts.length) lines.push(`  Callouts: ${callouts.join(', ')}`)
      lines.push('')
    }
    lines.push(`— Recon 6 · r6coaching.com/match-prep · ${displayName}`)
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  if (loading) return <div className="match-prep-page"><div className="game-strats-loading">Loading {displayName}…</div></div>
  if (error) return <div className="match-prep-page"><div className="match-prep-empty"><h1>Could not load</h1><p>{error}</p></div></div>
  if (!mapData) return <div className="match-prep-page"><div className="match-prep-empty"><h1>{displayName} match prep coming soon</h1><p>Map data is being curated for {displayName}.</p></div></div>

  return (
    <div className="match-prep-page">
      <header className="match-prep-header">
        <div className="section-label" style={{ color: accent }}>{displayName} · Free tool</div>
        <h1>Match Prep <span style={{ color: accent }}>Cheatsheet</span></h1>
        <p>One screen, every {mapWord.toLowerCase()}. Picks, callouts, bans — ready before you ready up. Copy as text for your Discord or print for the desk.</p>
      </header>

      {/* Map picker — grid replaces native select for the same readability
          reason as MatchPrepPage. Stays compact even with many maps. */}
      <div className="match-prep-mapgrid-wrap">
        <div className="match-prep-mapgrid-label">{mapWord}</div>
        <div className="match-prep-mapgrid">
          {maps.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`match-prep-mapgrid-btn${mapId === m.id ? ' active' : ''}`}
              onClick={() => setMapId(m.id)}
            >
              {m.name || m.id}
            </button>
          ))}
        </div>
      </div>
      <div className="match-prep-controls">
        <div className="match-prep-actions">
          <button type="button" onClick={copyAsText} className="btn btn-outline btn-sm">
            {copied ? 'Copied' : 'Copy as text'}
          </button>
          <button type="button" onClick={() => window.print()} className="btn btn-outline btn-sm match-prep-print-btn">Print</button>
        </div>
      </div>

      <div className="match-prep-card">
        <div className="match-prep-card-head" style={{ background: `linear-gradient(90deg, ${accent}1a, ${accent}0d)` }}>
          <div>
            <div className="match-prep-card-eyebrow" style={{ color: accent }}>{displayName} Match Prep</div>
            <h2>{mapData.name}</h2>
          </div>
          <div className="match-prep-card-meta">
            <span>{sites.length} {siteWord.toLowerCase()}s</span>
          </div>
        </div>

        {(banList?.attack?.length || banList?.defense?.length) && (
          <section className="match-prep-section">
            <h3>Ban Targets</h3>
            <div className="match-prep-bans">
              <div className="match-prep-bans-col">
                <div className="match-prep-side-label match-prep-side-attack">Ban from {sideAttack.toLowerCase()}</div>
                {(banList.attack || []).length === 0
                  ? <p className="match-prep-empty-line">No curated bans yet.</p>
                  : banList.attack.map((b, i) => (
                    <div key={i} className="match-prep-ban-row"><strong>{b.name}</strong><p>{b.reason}</p></div>
                  ))}
              </div>
              <div className="match-prep-bans-col">
                <div className="match-prep-side-label match-prep-side-defense">Ban from {sideDefense.toLowerCase()}</div>
                {(banList.defense || []).length === 0
                  ? <p className="match-prep-empty-line">No curated bans yet.</p>
                  : banList.defense.map((b, i) => (
                    <div key={i} className="match-prep-ban-row"><strong>{b.name}</strong><p>{b.reason}</p></div>
                  ))}
              </div>
            </div>
          </section>
        )}

        {(pickList?.attack?.length || pickList?.defense?.length) && (
          <section className="match-prep-section">
            <h3>Curated Picks</h3>
            <div className="match-prep-bans">
              <div className="match-prep-bans-col">
                <div className="match-prep-side-label match-prep-side-attack">{sideAttack}</div>
                {(pickList.attack || []).map((p, i) => (
                  <div key={i} className="match-prep-ban-row">
                    <strong>{p.name || p}</strong>
                    {p.reason && <p>{p.reason}</p>}
                  </div>
                ))}
              </div>
              <div className="match-prep-bans-col">
                <div className="match-prep-side-label match-prep-side-defense">{sideDefense}</div>
                {(pickList.defense || []).map((p, i) => (
                  <div key={i} className="match-prep-ban-row">
                    <strong>{p.name || p}</strong>
                    {p.reason && <p>{p.reason}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="match-prep-section">
          <h3>Picks That Win Rounds</h3>
          <div className="match-prep-picks">
            <div className="match-prep-picks-col">
              <div className="match-prep-side-label match-prep-side-attack">{sideAttack} lineup</div>
              <ol className="match-prep-pick-list">
                {topPicks.attack.length === 0 ? <li>No picks indexed yet.</li> : topPicks.attack.map((p, i) => (
                  <li key={p.name}>
                    <span className="match-prep-pick-rank">{i + 1}</span>
                    <span className="match-prep-pick-name">{p.name}</span>
                    {p.role && <span className="match-prep-pick-role">{p.role}</span>}
                    <span className="match-prep-pick-sites">{p.sites} {siteWord.toLowerCase()}{p.sites === 1 ? '' : 's'}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="match-prep-picks-col">
              <div className="match-prep-side-label match-prep-side-defense">{sideDefense} lineup</div>
              <ol className="match-prep-pick-list">
                {topPicks.defense.length === 0 ? <li>No picks indexed yet.</li> : topPicks.defense.map((p, i) => (
                  <li key={p.name}>
                    <span className="match-prep-pick-rank">{i + 1}</span>
                    <span className="match-prep-pick-name">{p.name}</span>
                    {p.role && <span className="match-prep-pick-role">{p.role}</span>}
                    <span className="match-prep-pick-sites">{p.sites} {siteWord.toLowerCase()}{p.sites === 1 ? '' : 's'}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="match-prep-section">
          <h3>{siteWord}-By-{siteWord} Quick Read</h3>
          <div className="match-prep-sites">
            {sites.map((site) => {
              const s = stratsForMap?.[site.id]
              if (!s) return null
              const atk = pickSide(s, 'attack')
              const def = pickSide(s, 'defense')
              const callouts = (atk?.callouts || def?.callouts || []).slice(0, 6)
              const keyAtk = (atk?.utility || []).slice(0, 2)
              const keyDef = (def?.utility || []).slice(0, 2)
              return (
                <article className="match-prep-site" key={site.id} style={{ borderLeftColor: accent }}>
                  <header>
                    <h4>{site.name || site.id}</h4>
                    {site.floor && <span className="match-prep-site-floor">{site.floor}</span>}
                  </header>
                  {callouts.length > 0 && (
                    <div className="match-prep-site-row">
                      <span className="match-prep-row-label">Callouts</span>
                      <span>{callouts.join(' · ')}</span>
                    </div>
                  )}
                  {keyAtk.length > 0 && (
                    <div className="match-prep-site-row">
                      <span className="match-prep-row-label match-prep-row-atk">{sideAttack.toUpperCase()}</span>
                      <ul>{keyAtk.map((u, i) => <li key={i}>{u}</li>)}</ul>
                    </div>
                  )}
                  {keyDef.length > 0 && (
                    <div className="match-prep-site-row">
                      <span className="match-prep-row-label match-prep-row-def">{sideDefense.toUpperCase()}</span>
                      <ul>{keyDef.map((u, i) => <li key={i}>{u}</li>)}</ul>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </section>

        <footer className="match-prep-card-foot">
          <span>Recon 6 · r6coaching.com/match-prep · {displayName}</span>
        </footer>
      </div>

      <section className="match-prep-other-maps">
        <div className="match-prep-other-label">Prep another {mapWord.toLowerCase()}</div>
        <div className="match-prep-other-grid">
          {maps.filter((m) => m.id !== mapId).map((m) => (
            <button key={m.id} type="button" className="match-prep-other-pill" onClick={() => setMapId(m.id)}>
              {m.name || m.id}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
