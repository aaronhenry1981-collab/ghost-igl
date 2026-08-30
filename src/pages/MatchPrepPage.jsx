import { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import MAPS from '../data/maps'
import STRATS from '../data/public-strats.generated'
import BANS from '../data/public-bans.generated'
import { useAuth } from '../hooks/useAuth'
import { useActiveGame } from '../hooks/useActiveGame'
import GameMatchPrepPage from './GameMatchPrepPage'
import SignInGate from '../components/SignInGate'
import { foundingPromisePhrase, isFoundingOpen } from '../config/founding'
import FoundingCountdown from '../components/FoundingCountdown'
import { track } from '../utils/analytics'
import './MatchPrepPage.css'

// Match Prep — a one-screen pre-round prep card. The buyer's question
// is "what do I need to know in the 90 seconds before I ready up?". This
// page answers that on a single map: the bans (theirs + yours), the
// picks the meta supports, and the key callouts/utility per site, all
// without requiring the user to click into each site individually.
//
// Free tier — no signup, bookmark-friendly. The footer surfaces the Pro
// upsell honestly: "want this for your last 5 matches' problem maps?"

const RANKED_MAPS = MAPS.filter(m => m.rankedPool && !m.comingSoon && STRATS[m.id])

function rollUpOperators(mapId) {
  // Aggregate the operator picks across every site on this map and return
  // them ordered by frequency. Essentials count more than recommended;
  // recommended more than flex. Lets us surface the "top 3 picks for the
  // whole map" without the user opening each site.
  const counts = { attack: new Map(), defense: new Map() }
  const weight = { essential: 3, recommended: 2, flex: 1 }
  for (const site of MAPS.find(m => m.id === mapId)?.sites || []) {
    const strat = STRATS[mapId]?.[site.id]
    if (!strat) continue
    for (const side of ['attack', 'defense']) {
      for (const op of strat[side]?.operators || []) {
        const w = weight[op.priority] || 1
        const cur = counts[side].get(op.name) || { name: op.name, role: op.role, score: 0, sites: 0 }
        cur.score += w
        cur.sites += 1
        cur.role = cur.role || op.role
        counts[side].set(op.name, cur)
      }
    }
  }
  return {
    attack: [...counts.attack.values()].sort((a, b) => b.score - a.score || b.sites - a.sites).slice(0, 6),
    defense: [...counts.defense.values()].sort((a, b) => b.score - a.score || b.sites - a.sites).slice(0, 6),
  }
}

function pickKeyUtility(strat, max = 3) {
  // Each utility row in strat data is a string like "Thatcher: EMP CEO wall
  // to clear Bandit tricking". We surface the first few so the prep card
  // doesn't drown the user in detail.
  return (strat?.utility || []).slice(0, max)
}

export default function MatchPrepPage() {
  const { user, loading: authLoading } = useAuth()
  const { isR6, activeGame } = useActiveGame()
  // Sign-in gate. Static SEO pages at /games/<id>/<map>-loadouts.html stay
  // public; the interactive cheatsheet requires an account so we can save
  // their settings and keep their R6 preparation consistent.
  if (!authLoading && !user) {
    return <SignInGate
      feature="Match Prep"
      gameMeta={activeGame?.gameMeta}
      benefits={[
        'One-screen pre-round cheatsheet — bans, picks, callouts, utility',
        'Copy-as-text for your Discord, or print for the desk',
        'Built around the current Rainbow Six map pool',
      ]}
    />
  }
  if (!isR6) return <GameMatchPrepPage />
  return <R6MatchPrepPage />
}

function R6MatchPrepPage() {
  const { mapId: urlMapId } = useParams()
  const navigate = useNavigate()
  const { isPro } = useAuth()
  const [mapId, setMapId] = useState(() => {
    if (urlMapId && STRATS[urlMapId]) return urlMapId
    return RANKED_MAPS[0]?.id || 'bank'
  })
  const cardRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const [showFullPlan, setShowFullPlan] = useState(() => window.location.hash.startsWith('#prep-site-'))
  const [selectedSiteId, setSelectedSiteId] = useState(() => window.location.hash.replace('#prep-site-', '') || null)
  const [selectedSide, setSelectedSide] = useState('attack')
  const [squadSize, setSquadSize] = useState(1)

  // Keep URL in sync with selected map so users can bookmark + share.
  useEffect(() => {
    if (urlMapId !== mapId) navigate(`/match-prep/${mapId}`, { replace: true })
  }, [mapId, urlMapId, navigate])

  // Honor #prep-site-<id> hash on load — supports shareable deep links to
  // a specific site card. We wait one tick for the cards to render, then
  // scroll. Re-runs whenever the map changes so users can hash-jump on a
  // newly loaded map without a full page refresh.
  useEffect(() => {
    const hash = window.location.hash
    if (!hash || !hash.startsWith('#prep-site-')) return
    const siteId = hash.replace('#prep-site-', '')
    // Verify the site exists on the current map AND has strats (otherwise
    // we'd scroll to an element that wasn't rendered).
    if (!STRATS[mapId]?.[siteId]) return
    setShowFullPlan(true)
    setSelectedSiteId(siteId)
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`prep-site-${siteId}`)
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top, behavior: 'smooth' })
    }, 150) // small delay so the site-card DOM is mounted
    return () => window.clearTimeout(timer)
  }, [mapId])

  const mapData = useMemo(() => MAPS.find(m => m.id === mapId), [mapId])
  const bans = BANS[mapId] || { attack: [], defense: [] }
  const picks = useMemo(() => rollUpOperators(mapId), [mapId])
  const publishedSites = useMemo(
    () => mapData?.sites.filter((site) => STRATS[mapId]?.[site.id]) || [],
    [mapData, mapId],
  )
  const selectedSite = publishedSites.find((site) => site.id === selectedSiteId) || null
  const selectedPlan = selectedSite ? STRATS[mapId]?.[selectedSite.id]?.[selectedSide] : null
  const firstOperator = selectedPlan?.operators?.find((operator) => operator.priority === 'essential')
    || selectedPlan?.operators?.[0]
  const firstBan = bans[selectedSide]?.[0]
  const prepVisual = mapId === 'coastline'
    ? {
        src: '/creator-gameplay-coastline-cover.webp',
        alt: 'Real Coastline gameplay looking into Billiards from Hookah Lounge',
        label: 'Real ranked POV',
      }
    : {
        src: `/guides/og/${mapId}.svg`,
        alt: `${mapData?.name || 'Map'} strategy guide preview`,
        label: 'Map briefing',
      }

  useEffect(() => {
    if (!selectedSiteId && publishedSites[0]) setSelectedSiteId(publishedSites[0].id)
  }, [publishedSites, selectedSiteId])

  function copyAsText() {
    if (!mapData) return
    const lines = []
    lines.push(`MATCH PREP — ${mapData.name.toUpperCase()}`)
    lines.push('')
    lines.push('BANS — ATTACK')
    bans.attack.forEach(b => lines.push(`  • ${b.name} — ${b.reason}`))
    lines.push('')
    lines.push('BANS — DEFENSE')
    bans.defense.forEach(b => lines.push(`  • ${b.name} — ${b.reason}`))
    lines.push('')
    lines.push('TOP ATTACK PICKS')
    picks.attack.slice(0, 5).forEach(p => lines.push(`  • ${p.name} (${p.role}) — strong on ${p.sites} site${p.sites === 1 ? '' : 's'}`))
    lines.push('')
    lines.push('TOP DEFENSE PICKS')
    picks.defense.slice(0, 5).forEach(p => lines.push(`  • ${p.name} (${p.role}) — strong on ${p.sites} site${p.sites === 1 ? '' : 's'}`))
    lines.push('')
    for (const site of mapData.sites) {
      const s = STRATS[mapId]?.[site.id]
      if (!s) continue
      lines.push(`SITE — ${site.name}${site.floor ? ` (${site.floor})` : ''}`)
      const callouts = (s.attack?.callouts || s.defense?.callouts || []).slice(0, 6).join(', ')
      if (callouts) lines.push(`  Callouts: ${callouts}`)
      const keyUtil = pickKeyUtility(s.attack, 2)
      keyUtil.forEach(u => lines.push(`  Atk: ${u}`))
      lines.push('')
    }
    lines.push('— Recon 6 · r6coaching.com/match-prep')
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      track('Match Prep Copy', { mapId })
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  function printCard() {
    track('Match Prep Print', { mapId })
    window.print()
  }

  if (!mapData) {
    return (
      <div className="match-prep-page">
        <div className="match-prep-empty">
          <h1>Map not found</h1>
          <Link to="/match-prep" className="btn btn-primary">Pick a map</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="match-prep-page">
      <header className="match-prep-header">
        <div className="section-label">Free tool · R6</div>
        <h1>Your next <span className="accent">ranked plan</span></h1>
        <p>Pick the map once. Recon 6 puts the ban, first operator choice, and next site action at the top. Open the full reference only when you need it.</p>
      </header>

      <details className="match-prep-map-picker">
        <summary>
          <span><small>Selected map</small>{mapData.name}</span>
          <strong>Change map</strong>
        </summary>
        <div className="match-prep-mapgrid-wrap">
        <div className="match-prep-mapgrid-label">Ranked maps</div>
        <div className="match-prep-mapgrid">
          {RANKED_MAPS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`match-prep-mapgrid-btn${mapId === m.id ? ' active' : ''}`}
              onClick={() => {
                setMapId(m.id)
                setShowFullPlan(false)
                setSelectedSiteId(null)
              }}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>
      </details>
      <section className="match-prep-brief" aria-labelledby="match-prep-brief-title">
        <figure className={`match-prep-brief-visual${mapId === 'coastline' ? ' gameplay' : ''}`}>
          <img src={prepVisual.src} alt={prepVisual.alt} />
          <figcaption>
            <span>{prepVisual.label}</span>
            <strong>{mapData.name}{selectedSite ? ` · ${selectedSite.name}` : ''}</strong>
          </figcaption>
        </figure>
        <div className="match-prep-brief-content">
          <span className="match-prep-brief-kicker">Do this first</span>
          <h2 id="match-prep-brief-title">Build your {mapData.name} round</h2>
          <div className="match-prep-choice-row">
            <div className="match-prep-choice">
              <small>1 · Side</small>
              <div className="match-prep-segmented" aria-label="Choose your side">
                {['attack', 'defense'].map((side) => (
                  <button
                    type="button"
                    key={side}
                    className={selectedSide === side ? 'active' : ''}
                    onClick={() => setSelectedSide(side)}
                  >
                    {side}
                  </button>
                ))}
              </div>
            </div>
            <div className="match-prep-choice">
              <small>2 · Squad</small>
              <div className="match-prep-segmented compact" aria-label="Choose your squad size">
                {[1, 2, 3, 4, 5].map((size) => (
                  <button
                    type="button"
                    key={size}
                    className={squadSize === size ? 'active' : ''}
                    onClick={() => setSquadSize(size)}
                    aria-label={size === 1 ? 'Solo' : `${size}-stack`}
                  >
                    {size === 1 ? 'Solo' : size}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="match-prep-choice match-prep-site-choice">
            <small>3 · Bomb site</small>
            <div className="match-prep-site-picker" aria-label="Choose a bomb site">
              {publishedSites.map((site) => (
                <button
                  type="button"
                  key={site.id}
                  className={selectedSiteId === site.id ? 'active' : ''}
                  onClick={() => setSelectedSiteId(site.id)}
                >
                  {site.name}
                </button>
              ))}
            </div>
          </div>
          <div className="match-prep-brief-grid">
            <article>
              <small>Your ban</small>
              <strong>{firstBan?.name || 'Use the team ban'}</strong>
              <span>{selectedSide === 'attack' ? 'Remove a defender' : 'Remove an attacker'}</span>
            </article>
            <article>
              <small>Your first pick</small>
              <strong>{firstOperator?.name || picks[selectedSide][0]?.name || 'Open the site plan'}</strong>
              <span>{firstOperator?.role || picks[selectedSide][0]?.role || `${selectedSide} flex`}</span>
            </article>
            <article>
              <small>Your round plan</small>
              <strong>{selectedSite?.name || 'Choose your bomb site'}</strong>
              <span>{selectedPlan?.strategy || 'Choose a site to build the plan.'}</span>
            </article>
          </div>
          {selectedSite && (
            <div className="match-prep-brief-actions">
              <Link to={`/strats/${mapId}/${selectedSite.id}/${selectedSide}?squad=${squadSize}`} className="btn btn-primary">
                Open my {selectedSide} plan
              </Link>
            </div>
          )}
        </div>
      </section>

      <details
        className="match-prep-full-plan"
        open={showFullPlan}
        onToggle={(event) => setShowFullPlan(event.currentTarget.open)}
      >
        <summary>
          <span className="match-prep-more-copy">
            <strong>More match details</strong>
            <small>All bans, lineups, site callouts, copy, and print tools</small>
          </span>
        </summary>
      <div className="match-prep-controls">
        <div className="match-prep-actions">
          <button type="button" onClick={copyAsText} className="btn btn-outline btn-sm">
            {copied ? 'Copied' : 'Copy as text'}
          </button>
          <button type="button" onClick={printCard} className="btn btn-outline btn-sm match-prep-print-btn">
            Print
          </button>
        </div>
      </div>
      <div className="match-prep-card" ref={cardRef}>
        <div className="match-prep-card-head">
          <div>
            <div className="match-prep-card-eyebrow">R6 Match Prep</div>
            <h2>{mapData.name}</h2>
          </div>
          <div className="match-prep-card-meta">
            <span>{mapData.sites.length} sites</span>
            <span aria-hidden="true">·</span>
            <span>Ranked pool</span>
          </div>
        </div>

        {/* Bans — first thing you do in a ranked match */}
        <section className="match-prep-section">
          <h3>Ban Targets</h3>
          <div className="match-prep-bans">
            <div className="match-prep-bans-col">
              <div className="match-prep-side-label match-prep-side-attack">Ban from attack</div>
              {bans.attack.length === 0 ? (
                <p className="match-prep-empty-line">No curated bans yet. Open the strats tool for site-by-site picks.</p>
              ) : bans.attack.map(b => (
                <div className="match-prep-ban-row" key={`atk-${b.name}`}>
                  <strong>{b.name}</strong>
                  <p>{b.reason}</p>
                </div>
              ))}
            </div>
            <div className="match-prep-bans-col">
              <div className="match-prep-side-label match-prep-side-defense">Ban from defense</div>
              {bans.defense.length === 0 ? (
                <p className="match-prep-empty-line">No curated bans yet. Open the strats tool for site-by-site picks.</p>
              ) : bans.defense.map(b => (
                <div className="match-prep-ban-row" key={`def-${b.name}`}>
                  <strong>{b.name}</strong>
                  <p>{b.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Picks — what to actually run */}
        <section className="match-prep-section">
          <h3>Picks That Win Rounds</h3>
          <div className="match-prep-picks">
            <div className="match-prep-picks-col">
              <div className="match-prep-side-label match-prep-side-attack">Attack lineup</div>
              <ol className="match-prep-pick-list">
                {picks.attack.slice(0, 5).map((p, i) => (
                  <li key={p.name}>
                    <span className="match-prep-pick-rank">{i + 1}</span>
                    <Link to={`/operators/${encodeURIComponent(p.name.toLowerCase())}`} className="match-prep-pick-name">{p.name}</Link>
                    <span className="match-prep-pick-role">{p.role}</span>
                    <span className="match-prep-pick-sites">{p.sites} site{p.sites === 1 ? '' : 's'}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="match-prep-picks-col">
              <div className="match-prep-side-label match-prep-side-defense">Defense lineup</div>
              <ol className="match-prep-pick-list">
                {picks.defense.slice(0, 5).map((p, i) => (
                  <li key={p.name}>
                    <span className="match-prep-pick-rank">{i + 1}</span>
                    <Link to={`/operators/${encodeURIComponent(p.name.toLowerCase())}`} className="match-prep-pick-name">{p.name}</Link>
                    <span className="match-prep-pick-role">{p.role}</span>
                    <span className="match-prep-pick-sites">{p.sites} site{p.sites === 1 ? '' : 's'}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Per-site strip — one block per bomb site with the key callouts + utility */}
        <section className="match-prep-section">
          <h3>Site-By-Site Quick Read</h3>
          {/* Sticky jump-nav — between rounds you tap the site you're playing
              and scroll lands on its card. Way faster than scroll-hunt on
              long maps (Theme Park, Skyscraper, Villa). Sticky so it stays
              accessible no matter how far you scroll. */}
          {mapData.sites.filter(s => STRATS[mapId]?.[s.id]).length > 1 && (
            <nav className="match-prep-jump-nav" aria-label="Jump to site">
              {mapData.sites
                .filter(s => STRATS[mapId]?.[s.id])
                .map(site => (
                  <a
                    key={`jump-${site.id}`}
                    href={`#prep-site-${site.id}`}
                    className="match-prep-jump-btn"
                    onClick={(e) => {
                      e.preventDefault()
                      const el = document.getElementById(`prep-site-${site.id}`)
                      if (!el) return
                      const top = el.getBoundingClientRect().top + window.scrollY - 80
                      window.scrollTo({ top, behavior: 'smooth' })
                      // Push the hash to the URL so the page is shareable —
                      // someone opening /match-prep/bank#prep-site-ceo will
                      // auto-scroll to CEO on load (handled by the effect
                      // below). Uses replaceState so back-button doesn't
                      // get cluttered with every site tap.
                      if (window.history?.replaceState) {
                        window.history.replaceState(null, '', `#prep-site-${site.id}`)
                      }
                      track('Match Prep Jump', { mapId, siteId: site.id })
                    }}
                  >
                    {site.name}
                    {site.floor && <span className="match-prep-jump-floor">{site.floor}</span>}
                  </a>
                ))}
            </nav>
          )}
          <div className="match-prep-sites">
            {mapData.sites.map(site => {
              const s = STRATS[mapId]?.[site.id]
              if (!s) return null
              const callouts = (s.attack?.callouts || s.defense?.callouts || []).slice(0, 6)
              const keyAtk = pickKeyUtility(s.attack, 2)
              const keyDef = pickKeyUtility(s.defense, 2)
              return (
                <article className="match-prep-site" id={`prep-site-${site.id}`} key={site.id}>
                  <header>
                    <h4>{site.name}</h4>
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
                      <span className="match-prep-row-label match-prep-row-atk">ATK</span>
                      <ul>
                        {keyAtk.map((u, i) => <li key={i}>{u}</li>)}
                      </ul>
                    </div>
                  )}
                  {keyDef.length > 0 && (
                    <div className="match-prep-site-row">
                      <span className="match-prep-row-label match-prep-row-def">DEF</span>
                      <ul>
                        {keyDef.map((u, i) => <li key={i}>{u}</li>)}
                      </ul>
                    </div>
                  )}
                  <Link to={`/strats/${mapId}/${site.id}`} className="match-prep-site-link">Open full {site.name} strat →</Link>
                </article>
              )
            })}
          </div>
        </section>

        <footer className="match-prep-card-foot">
          <span>Recon 6 · r6coaching.com/match-prep/{mapId}</span>
        </footer>
      </div>
      </details>

      {/* Embed widget pitch — surfaces to content creators / community
          mods that they can iframe this cheatsheet on their own site.
          Every embed is an organic inbound link. The actual embed code
          uses the dedicated /embed/match-prep/<mapId> route which strips
          all site chrome for a clean iframe-friendly render. */}
      <details className="match-prep-embed-pitch">
        <summary>Embed this cheatsheet on your site / blog / Discord channel</summary>
        <p>Copy this snippet — drop it in any HTML page. Every embed shows the latest data automatically.</p>
        <textarea
          readOnly
          rows={5}
          className="match-prep-embed-snippet"
          onFocus={(e) => e.target.select()}
          value={`<iframe
  src="https://r6coaching.com/embed/match-prep/${mapId}"
  width="100%" height="640" frameborder="0" loading="lazy"
  title="R6 ${mapData.name} match prep — Recon 6">
</iframe>`}
        />
        <small>
          Live preview:{' '}
          <a href={`#/embed/match-prep/${mapId}`} target="_blank" rel="noopener noreferrer">
            r6coaching.com/embed/match-prep/{mapId} →
          </a>
        </small>
      </details>

      {/* Honest Pro upsell — reframes the same tool around the buyer's
          recurring problem instead of selling the engine. */}
      {!isPro && (
        <section className="match-prep-upsell">
          <div className="match-prep-upsell-inner">
            <div>
              <h3>Want this generated from your own last 5 matches?</h3>
              <p>
                Pro reviews your screenshots and shows you the maps where you’re losing the most rounds —
                with the ban targets, picks, and utility usage that fix what cost you, specifically.
                {isFoundingOpen() ? <> $9/mo {foundingPromisePhrase()}.</> : null}
              </p>
              {isFoundingOpen() && (
                <div style={{ marginBottom: 12 }}>
                  <FoundingCountdown variant="pill" />
                </div>
              )}
              <div className="match-prep-upsell-cta">
                <Link to="/#pricing" className="btn btn-primary">See Pro plans</Link>
                <Link to="/strats" className="btn btn-ghost">Open the strats tool</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="match-prep-other-maps">
        <div className="match-prep-other-label">Prep another map</div>
        <div className="match-prep-other-grid">
          {RANKED_MAPS.filter(m => m.id !== mapId).map(m => (
            <button
              key={m.id}
              type="button"
              className="match-prep-other-pill"
              onClick={() => setMapId(m.id)}
            >
              {m.name}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
