import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useActiveGame } from '../hooks/useActiveGame'
import { useGameData } from '../hooks/useGameData'
import { useAuth } from '../hooks/useAuth'
import { useSectionNavigate } from '../utils/sectionLink'
import './GameStratsPage.css'

// Generic, game-aware Strats page. Renders MAPS + STRATS + BANS/PICKS for
// any game in the registry. Used for every game except R6 (R6 has its
// own bespoke StratsPage with deeper UI: ProGate, ChampionGate, free-
// strat soft-paywall, recent-strats, etc.).
//
// Why separate? R6 has 2 years of UI features welded into StratsPage that
// presume R6 data shape (premiumTactics, ENEMY_META, SQUAD_ROLES). Until
// each non-R6 game has equivalent hand-curated content, the cleaner UX
// is a focused single-file viewer that shows what we DO have: per-map
// site list, per-site picks, strats, callouts, utility. No fake gates.

function pickSideKey(siteData, key) {
  // Resolves the strat side from whatever key shape the game's data file
  // happens to use. We standardize on 'attack' / 'defense' in the brief, but
  // games whose semantics fight that mapping sometimes ship native keys.
  // Order of attempts (first hit wins):
  //
  //   attack ↔ defense           (R6, Apex, OW2, MVR, Halo, Finals, CoD, FN, generic adapted)
  //   t      ↔ ct                (CS2 native)
  //   tside  ↔ ctside            (CS2 alt)
  //   sideAttack ↔ sideDefense   (early-iteration camelCase)
  //   blue   ↔ red               (LoL)
  //   radiant ↔ dire             (Dota 2)
  //   p1     ↔ p2                (Tekken 8, Street Fighter 6)
  //   offense ↔ defense          (NBA 2K, EA FC)
  //   possession ↔ defending     (EA FC alt)
  //   pushing ↔ holding          (BR-style: PUBG, Naraka)
  //   earlyGame ↔ lateGame       (LoL/Dota strategic phase alt)
  //
  // Falls through to null so the GameStratsPage shows the "early access"
  // placeholder instead of crashing on a missing side.
  const isAttack = key === 'attack'
  const tries = [
    key,
    isAttack ? 'sideAttack' : 'sideDefense',
    isAttack ? 't' : 'ct',
    isAttack ? 'tside' : 'ctside',
    isAttack ? 'blue' : 'red',
    isAttack ? 'radiant' : 'dire',
    isAttack ? 'p1' : 'p2',
    isAttack ? 'offense' : 'defense',
    isAttack ? 'possession' : 'defending',
    isAttack ? 'pushing' : 'holding',
    isAttack ? 'earlyGame' : 'lateGame',
  ]
  for (const k of tries) {
    if (siteData[k]) return siteData[k]
  }
  return null
}

function getSideLabels(meta) {
  const v = meta.vocab || {}
  return {
    attack: v.side_attack || v.sideAttack || 'Attack',
    defense: v.side_defense || v.sideDefense || 'Defense',
  }
}

// Renders the premium-tactics block for any side. Free/Pro users see a
// gate with a teaser; Champions/admins see the full thing. Mirrors the R6
// ChampionGate pattern but works for any game.
function PremiumTactics({ data, side, accent, isChampion, goToPricing }) {
  if (!data) return null
  const hasContent =
    (Array.isArray(data.attackSpawns) && data.attackSpawns.length > 0) ||
    (Array.isArray(data.spawnKillSpots) && data.spawnKillSpots.length > 0) ||
    (Array.isArray(data.runouts) && data.runouts.length > 0) ||
    (Array.isArray(data.antiSpawnPeek) && data.antiSpawnPeek.length > 0) ||
    (Array.isArray(data.advancedSetups) && data.advancedSetups.length > 0)
  if (!hasContent) return null

  if (!isChampion) {
    // Locked teaser — show what's there but blur the specifics, with an
    // explicit upgrade prompt. Same conversion pattern as R6's gate.
    const counts = {
      attackSpawns: data.attackSpawns?.length || 0,
      spawnKillSpots: data.spawnKillSpots?.length || 0,
      runouts: data.runouts?.length || 0,
      antiSpawnPeek: data.antiSpawnPeek?.length || 0,
      advancedSetups: data.advancedSetups?.length || 0,
    }
    return (
      <section className="game-strat-premium-locked" style={{ borderColor: accent }}>
        <div className="game-strat-premium-pill" style={{ background: accent, color: '#0a0f19' }}>Champion</div>
        <h3>Premium Tactics</h3>
        <p>
          {side === 'attack'
            ? `${counts.attackSpawns} attack-spawn ${counts.attackSpawns === 1 ? 'lineup' : 'lineups'} · ${counts.spawnKillSpots} spawn-kill ${counts.spawnKillSpots === 1 ? 'spot' : 'spots'} · ${counts.advancedSetups} advanced setup${counts.advancedSetups === 1 ? '' : 's'} locked behind Champion.`
            : `${counts.runouts} runout${counts.runouts === 1 ? '' : 's'} · ${counts.antiSpawnPeek} anti-spawn-peek ${counts.antiSpawnPeek === 1 ? 'setup' : 'setups'} · ${counts.advancedSetups} advanced setup${counts.advancedSetups === 1 ? '' : 's'} locked behind Champion.`}
        </p>
        <button type="button" onClick={goToPricing} className="btn btn-primary btn-sm" style={{ background: accent, color: '#0a0f19' }}>
          Unlock with Champion →
        </button>
      </section>
    )
  }

  // Champion view — render every premium block that has data.
  return (
    <section className="game-strat-premium">
      <header className="game-strat-premium-head">
        <div className="game-strat-premium-pill game-strat-premium-pill-active" style={{ background: accent, color: '#0a0f19' }}>Champion</div>
        <h3>Premium Tactics</h3>
      </header>

      {Array.isArray(data.attackSpawns) && data.attackSpawns.length > 0 && (
        <div className="game-strat-premium-block">
          <h4>Attack Spawns / Plant Lineups</h4>
          <ul className="game-strat-premium-list">
            {data.attackSpawns.map((s, i) => (
              <li key={i}>
                <strong>{s.spawn}</strong>
                {s.from && <span className="premium-from"> from {s.from}</span>}
                {s.use && <p>{s.use}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(data.spawnKillSpots) && data.spawnKillSpots.length > 0 && (
        <div className="game-strat-premium-block">
          <h4>Spawn-Kill Opportunities</h4>
          <ul className="game-strat-premium-list">
            {data.spawnKillSpots.map((s, i) => (
              <li key={i}>
                <strong>{s.from}</strong> → <span className="premium-target">{s.target}</span>
                {s.risk && <p><strong className="premium-risk">Risk:</strong> {s.risk}</p>}
                {s.reward && <p><strong className="premium-reward">Reward:</strong> {s.reward}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(data.runouts) && data.runouts.length > 0 && (
        <div className="game-strat-premium-block">
          <h4>Runouts</h4>
          <ul className="game-strat-premium-list">
            {data.runouts.map((r, i) => (
              <li key={i}>
                <strong>{r.from}</strong> → <span className="premium-target">{r.target}</span>
                {r.timing && <p><strong>Timing:</strong> {r.timing}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(data.antiSpawnPeek) && data.antiSpawnPeek.length > 0 && (
        <div className="game-strat-premium-block">
          <h4>Anti-Spawn-Peek</h4>
          <ul className="game-strat-premium-list-simple">
            {data.antiSpawnPeek.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {Array.isArray(data.advancedSetups) && data.advancedSetups.length > 0 && (
        <div className="game-strat-premium-block">
          <h4>Advanced Setups</h4>
          <ul className="game-strat-premium-list-simple">
            {data.advancedSetups.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}
    </section>
  )
}

export default function GameStratsPage() {
  const { activeGameId } = useActiveGame()
  const { data, loading, error, gameMeta } = useGameData()
  const { plan, isAdmin, isPro } = useAuth()
  const goToPricing = useSectionNavigate('pricing')
  const isChampion = isAdmin || plan === 'champion'
  // Pro+: gates Stadium-mode strats (OW2 Stadium = Pro-only feature).
  // Admin always bypasses; Champion is a superset of Pro so they pass too.
  const hasProAccess = isAdmin || isPro || isChampion
  const accent = gameMeta.color || '#00e5ff'
  const displayName = gameMeta.displayName || gameMeta.name || activeGameId
  const sideLabels = getSideLabels(gameMeta)

  const [selectedMapId, setSelectedMapId] = useState(null)
  const [selectedSiteId, setSelectedSiteId] = useState(null)
  const [side, setSide] = useState('attack')

  const maps = useMemo(() => {
    if (!data?.MAPS) return []
    return Array.isArray(data.MAPS) ? data.MAPS : Object.values(data.MAPS)
  }, [data])

  // Pick first map with strats by default — guarded one-shot once the async
  // map list lands, not a cascade.
  useEffect(() => {
    if (!selectedMapId && maps.length > 0) {
      const withStrats = maps.find((m) => m.id && data?.STRATS?.[m.id]) || maps[0]
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedMapId(withStrats.id)
    }
  }, [maps, selectedMapId, data])

  // Pick first site by default — same guarded one-shot pattern.
  useEffect(() => {
    if (selectedMapId && !selectedSiteId) {
      const map = maps.find((m) => m.id === selectedMapId)
      const sites = Array.isArray(map?.sites) ? map.sites : Object.values(map?.sites || {})
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (sites.length > 0) setSelectedSiteId(sites[0].id)
    }
  }, [selectedMapId, selectedSiteId, maps])

  if (loading) {
    return <div className="game-strats-page"><div className="game-strats-loading">Loading {displayName} strats…</div></div>
  }
  if (error) {
    return <div className="game-strats-page"><div className="game-strats-empty"><h1>Could not load {displayName} data</h1><p>{error}</p></div></div>
  }
  if (maps.length === 0) {
    return (
      <div className="game-strats-page">
        <div className="game-strats-empty">
          <h1>{displayName} strats coming soon</h1>
          <p>Map data for {displayName} is being curated.</p>
        </div>
      </div>
    )
  }

  const selectedMap = maps.find((m) => m.id === selectedMapId) || maps[0]
  const sites = Array.isArray(selectedMap?.sites) ? selectedMap.sites : Object.values(selectedMap?.sites || {})
  const selectedSite = sites.find((s) => s.id === selectedSiteId) || sites[0]
  const stratsForMap = data?.STRATS?.[selectedMap?.id]
  const stratsForSite = stratsForMap?.[selectedSite?.id]
  const sideStrat = stratsForSite ? pickSideKey(stratsForSite, side) : null
  // OW2 Stadium-mode strats are Pro-only end-to-end (build/Power/economy
  // knowledge maps poorly to a free preview, partial intel would mislead).
  // The whole strat card swaps to a Pro upgrade teaser for non-Pro users.
  const isStadiumMap = selectedMap?.type === 'Stadium'
  const stadiumLocked = isStadiumMap && !hasProAccess

  return (
    <div className="game-strats-page">
      <header className="game-strats-header" style={{ borderColor: accent }}>
        <div className="game-strats-eyebrow" style={{ color: accent }}>
          {displayName} · Strats
        </div>
        <h1>Walk Into Every <span style={{ color: accent }}>{gameMeta.vocab?.map || 'Map'}</span> Prepared</h1>
        <p>
          Site-by-site breakdowns for {displayName} — picks, callouts, utility, post-plant. Pick a map below
          and toggle {sideLabels.attack} or {sideLabels.defense}.
        </p>
      </header>

      {/* Map picker — switched from select to button grid so users can
          see every map at once. Pro / coming-soon suffixes render
          inline as small badges. Stadium gets an amber Pro badge. */}
      <div className="game-strats-mapgrid-wrap">
        <div className="game-strats-mapgrid-label">{gameMeta.vocab?.map || 'Map'}</div>
        <div className="game-strats-mapgrid">
          {maps.map((m) => {
            const hasStrats = !!data.STRATS?.[m.id]
            const isStadium = m.type === 'Stadium'
            const isActive = selectedMapId === m.id
            return (
              <button
                key={m.id}
                type="button"
                className={`game-strats-mapgrid-btn${isActive ? ' active' : ''}${!hasStrats ? ' empty' : ''}${isStadium ? ' stadium' : ''}`}
                onClick={() => { setSelectedMapId(m.id); setSelectedSiteId(null) }}
                title={!hasStrats ? 'Strats coming soon' : isStadium && !hasProAccess ? 'Pro feature' : undefined}
              >
                {m.name || m.id}
                {!hasStrats && <span className="game-strats-mapgrid-suffix coming">soon</span>}
                {hasStrats && isStadium && !hasProAccess && <span className="game-strats-mapgrid-suffix pro">Pro</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="game-strats-bar">
        <div className="game-strats-side-toggle" role="tablist">
          <button
            type="button"
            className={`game-strats-side-btn${side === 'attack' ? ' active' : ''}`}
            onClick={() => setSide('attack')}
            style={side === 'attack' ? { borderColor: accent, color: accent } : undefined}
          >
            {sideLabels.attack}
          </button>
          <button
            type="button"
            className={`game-strats-side-btn${side === 'defense' ? ' active' : ''}`}
            onClick={() => setSide('defense')}
            style={side === 'defense' ? { borderColor: accent, color: accent } : undefined}
          >
            {sideLabels.defense}
          </button>
        </div>
      </div>

      <div className="game-strats-layout">
        <aside className="game-strats-sites" aria-label={`${gameMeta.vocab?.site || 'Site'}s on ${selectedMap?.name}`}>
          <div className="game-strats-sites-label">{gameMeta.vocab?.site || 'Site'}s ({sites.length})</div>
          {sites.map((s) => {
            const has = !!stratsForMap?.[s.id]
            const isActive = s.id === selectedSiteId
            return (
              <button
                key={s.id}
                type="button"
                className={`game-strats-site-btn${isActive ? ' active' : ''}${!has ? ' empty' : ''}`}
                onClick={() => setSelectedSiteId(s.id)}
                style={isActive ? { borderLeftColor: accent, color: accent } : undefined}
              >
                <strong>{s.name || s.id}</strong>
                {s.floor && <span>{s.floor}</span>}
                {!has && <span className="game-strats-site-coming">no strats yet</span>}
              </button>
            )
          })}
        </aside>

        <section className="game-strats-content">
          {!sideStrat && (
            <div className="game-strats-empty-block">
              <h3 style={{ margin: '0 0 0.6rem', color: 'var(--text-h, #fff)' }}>
                {selectedSite?.name || 'This site'} — curated strat in progress
              </h3>
              <p>
                We're rolling out site-by-site strats across {displayName} weekly.
                In the meantime: <Link to="/loadouts" style={{ color: accent }}>{displayName} loadouts</Link>{' '}
                cover picks and team-comp, and <Link to="/match-prep" style={{ color: accent }}>Match Prep</Link>{' '}
                gives you the one-screen pre-round cheatsheet for {selectedMap?.name || 'this map'}.
              </p>
              {/* Surface other sites on this map that DO have strats so users
                  don't bounce — keeps them inside the active game's flow. */}
              {sites.some((s) => stratsForMap?.[s.id] && s.id !== selectedSiteId) && (
                <div style={{ marginTop: '0.85rem' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(230,233,239,0.5)', marginBottom: 6, fontWeight: 700 }}>
                    Other {gameMeta.vocab?.site?.toLowerCase() || 'site'}s with strats
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {sites
                      .filter((s) => stratsForMap?.[s.id] && s.id !== selectedSiteId)
                      .map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedSiteId(s.id)}
                          style={{
                            padding: '5px 12px',
                            background: 'rgba(0,229,255,0.06)',
                            border: '1px solid rgba(0,229,255,0.3)',
                            borderRadius: 999,
                            color: accent,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          {s.name || s.id}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {sideStrat && stadiumLocked && (
            <article className="game-strat-card game-strat-card-locked" style={{ borderColor: 'rgba(255, 180, 80, 0.45)' }}>
              <header>
                <span className="game-strat-side-pill" style={{ background: 'rgba(255, 180, 80, 0.14)', color: '#ffc97a', borderColor: 'rgba(255, 180, 80, 0.5)' }}>
                  ⚑ Pro feature
                </span>
                <h2>{selectedSite?.name || selectedSite?.id}</h2>
                {selectedSite?.floor && <span className="game-strat-floor">{selectedSite.floor}</span>}
              </header>
              <section style={{ marginTop: '0.85rem' }}>
                <h3>Stadium strats are Pro-only</h3>
                <p style={{ marginTop: '0.5rem' }}>
                  Stadium runs on a Cash economy + 4 Power picks + Item shop — partial strats would mislead more than help. Pro unlocks all <strong>11 Stadium maps</strong> (33 sites · 66 build paths) including Cash priorities, Power-pick rounds, and Item shop timing.
                </p>
                <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.85 }}>
                  This site has <strong>{sideStrat.operators?.length || 5}</strong> hero picks · <strong>{sideStrat.callouts?.length || 0}</strong> callouts · <strong>{sideStrat.utility?.length || 0}</strong> Power/Item recommendations behind the gate.
                </p>
                <button
                  type="button"
                  onClick={goToPricing}
                  className="btn btn-primary"
                  style={{ marginTop: '0.85rem', background: '#ffc97a', color: '#0a0f19', borderColor: '#ffc97a' }}
                >
                  Unlock Stadium — $9/mo founding →
                </button>
                <p style={{ marginTop: '0.6rem', fontSize: '0.75rem', opacity: 0.7 }}>
                  Founding rate locked for life if you join before May 31.
                </p>
              </section>
            </article>
          )}

          {sideStrat && !stadiumLocked && (
            <article className="game-strat-card">
              <header>
                <span className="game-strat-side-pill" style={{ background: side === 'attack' ? 'rgba(255,138,80,0.14)' : 'rgba(80,180,255,0.14)', color: side === 'attack' ? '#ffa67a' : '#7aaaff', borderColor: side === 'attack' ? '#ff8a50' : '#5099cc' }}>
                  {side === 'attack' ? sideLabels.attack : sideLabels.defense}
                </span>
                <h2>{selectedSite?.name || selectedSite?.id}</h2>
                {selectedSite?.floor && <span className="game-strat-floor">{selectedSite.floor}</span>}
              </header>

              {sideStrat.strategy && (
                <section>
                  <h3>The Plan</h3>
                  <p>{sideStrat.strategy}</p>
                </section>
              )}

              {Array.isArray(sideStrat.operators) && sideStrat.operators.length > 0 && (
                <section>
                  <h3>{gameMeta.vocab?.operator || 'Picks'}</h3>
                  <ul className="game-strat-ops">
                    {sideStrat.operators.map((op, i) => (
                      <li key={op.name || i} className={`prio-${(op.priority || 'flex').toLowerCase()}`}>
                        <strong>{op.name}</strong>
                        {op.role && <span className="op-role">{op.role}</span>}
                        {op.priority && <span className={`op-prio op-prio-${op.priority.toLowerCase()}`}>{op.priority}</span>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {Array.isArray(sideStrat.callouts) && sideStrat.callouts.length > 0 && (
                <section>
                  <h3>Callouts</h3>
                  <div className="game-strat-callouts">
                    {sideStrat.callouts.map((c, i) => <span key={i} className="game-strat-callout-pill">{c}</span>)}
                  </div>
                </section>
              )}

              {Array.isArray(sideStrat.utility) && sideStrat.utility.length > 0 && (
                <section>
                  <h3>Key Utility</h3>
                  <ul className="game-strat-util">
                    {sideStrat.utility.map((u, i) => <li key={i}>{u}</li>)}
                  </ul>
                </section>
              )}

              <PremiumTactics
                data={sideStrat.premiumTactics}
                side={side}
                accent={accent}
                isChampion={isChampion}
                goToPricing={goToPricing}
              />
            </article>
          )}
        </section>
      </div>

      <footer className="game-strats-foot">
        <p>
          Want loadouts and team-comp combos for {displayName}? <Link to="/loadouts" style={{ color: accent }}>Open Loadouts</Link>.
          Want a one-screen pre-round prep card? <Link to="/match-prep" style={{ color: accent }}>Open Match Prep</Link>.
        </p>
      </footer>
    </div>
  )
}
