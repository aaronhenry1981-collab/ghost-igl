import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import MAPS from '../data/maps'
import STRATS from '../data/strats'
import BANS from '../data/bans'
import SQUAD_ROLES from '../data/squadRoles'
import ENEMY_META from '../data/enemyMeta'
import { useActiveGame } from '../hooks/useActiveGame'
import GameStratsPage from './GameStratsPage'
import MapSelector from '../components/strats/MapSelector'
import SiteSelector from '../components/strats/SiteSelector'
import SideToggle from '../components/strats/SideToggle'
import SquadToggle from '../components/strats/SquadToggle'
import SquadGuide from '../components/strats/SquadGuide'
import StratDisplay from '../components/strats/StratDisplay'
import BanDisplay from '../components/strats/BanDisplay'
import EnemyIntel from '../components/strats/EnemyIntel'
import ProGate from '../components/strats/ProGate'
import QuickBrief from '../components/strats/QuickBrief'
import StratSearch from '../components/strats/StratSearch'
import ShortcutsModal from '../components/strats/ShortcutsModal'
import { useRecentStrats } from '../hooks/useRecentStrats'
import { useAuth } from '../hooks/useAuth'
import { useFreeStratLimit } from '../hooks/useFreeStratLimit'
import SoftPaywall from '../components/strats/SoftPaywall'
import './StratsPage.css'

const VIEW_MODE_KEY = 'ghost-igl:strats-view-mode'

function readViewMode() {
  try {
    const v = localStorage.getItem(VIEW_MODE_KEY)
    return v === 'brief' ? 'brief' : 'full'
  } catch {
    return 'full'
  }
}

function validSide(s) {
  return s === 'attack' || s === 'defense' ? s : 'attack'
}

function RecentStrip({ recents }) {
  if (!recents.length) return null
  return (
    <div className="recent-strats">
      <div className="recent-strats-label">Jump back in</div>
      <div className="recent-strats-list">
        {recents.map((r) => {
          const map = MAPS.find((m) => m.id === r.mapId)
          const site = map?.sites.find((s) => s.id === r.siteId)
          if (!map || !site) return null
          return (
            <Link
              key={`${r.mapId}:${r.siteId}:${r.side}`}
              to={`/strats/${r.mapId}/${r.siteId}/${r.side}`}
              className="recent-strats-chip"
            >
              <span className="recent-strats-chip-map">{map.name}</span>
              <span className="recent-strats-chip-site">{site.name} · {r.side === 'attack' ? 'ATK' : 'DEF'}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// Routes between the R6 strats UI (full bespoke experience with ProGate /
// ChampionGate / soft-paywall / recent-strats) and the generic game-aware
// strats viewer for the other 9 games. Wrapper because R6StratsPage runs
// many hooks — we bail BEFORE those hooks when the active game isn't R6
// to satisfy Rules-of-Hooks across game switches.
export default function StratsPage() {
  const { isR6 } = useActiveGame()
  if (!isR6) return <GameStratsPage />
  return <R6StratsPage />
}

function R6StratsPage() {
  const { mapId: urlMapId, siteId: urlSiteId, side: urlSide } = useParams()
  const navigate = useNavigate()
  const [squadSize, setSquadSize] = useState(1)
  const [copyState, setCopyState] = useState('idle')
  const [viewMode, setViewMode] = useState(readViewMode)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const { recents, track } = useRecentStrats()
  const { user, isPro, isAdmin, plan } = useAuth()
  const isChampion = isAdmin || plan === 'champion'
  // Free-tier soft paywall: only count views for unauthed users and unsubscribed
  // free users. Pro / Champion / admin get full access without nudging.
  const paywallEnabled = !isPro && !isAdmin

  function toggleViewMode() {
    const next = viewMode === 'full' ? 'brief' : 'full'
    setViewMode(next)
    try { localStorage.setItem(VIEW_MODE_KEY, next) } catch { /* no-op */ }
  }

  const mapData = urlMapId ? MAPS.find((m) => m.id === urlMapId) : null
  // Access rules:
  //   - Admins: see everything (testing).
  //   - Champions: see everything — including comingSoon maps. They get the
  //     full catalog as part of their tier benefit; comingSoon strats show a
  //     friendly "being written" placeholder rather than blocking access.
  //   - Pro / Free: blocked from comingSoon and championOnly maps.
  // The useEffect below redirects the URL back to /strats so non-Champions
  // can't bypass MapSelector by typing a URL.
  // Thin free tier: non-subscribers (free / signed-out) can open ONLY the free
  // SAMPLE maps (freeSample: true) — the rest needs a trial or a paid plan.
  // Subscribers (pro / champion / admin) keep the full-catalog rules.
  const subscriber = isPro || isAdmin
  const mapAccessible = mapData && (
    subscriber
      ? (isAdmin || isChampion || (!mapData.comingSoon && !mapData.championOnly))
      : (!!mapData.freeSample && !mapData.comingSoon)
  )
  const selectedMap = mapAccessible ? mapData.id : null
  const selectedSite =
    selectedMap && urlSiteId && mapData.sites.some((s) => s.id === urlSiteId)
      ? urlSiteId
      : null
  const side = validSide(urlSide)

  useEffect(() => {
    if (urlMapId && !selectedMap) {
      navigate('/strats', { replace: true })
    } else if (urlSiteId && !selectedSite) {
      navigate(`/strats/${selectedMap}`, { replace: true })
    } else if (urlSide && urlSide !== side) {
      navigate(`/strats/${selectedMap}/${selectedSite}/${side}`, { replace: true })
    }
  }, [urlMapId, urlSiteId, urlSide, selectedMap, selectedSite, side, navigate])

  // Track strat view for recent list (on every site view, including side toggles)
  useEffect(() => {
    if (selectedMap && selectedSite) {
      track({ mapId: selectedMap, siteId: selectedSite, side })
    }
  }, [selectedMap, selectedSite, side, track])

  // Soft paywall — increments per distinct (map, site, side) view for free users
  const { showPaywall, viewCount, dismiss: dismissPaywall } = useFreeStratLimit({
    enabled: paywallEnabled && !!selectedMap && !!selectedSite,
    mapId: selectedMap,
    siteId: selectedSite,
    side,
  })

  const strat = selectedMap && selectedSite && STRATS[selectedMap]?.[selectedSite]?.[side]
  const bans = selectedMap && BANS[selectedMap]
  const squadGuide = SQUAD_ROLES[side]?.[squadSize]
  const enemySide = side === 'attack' ? 'defense' : 'attack'
  const enemyIntel =
    selectedMap && selectedSite && ENEMY_META[selectedMap]?.[selectedSite]?.[enemySide]

  function goMap(mapId) {
    const map = MAPS.find((m) => m.id === mapId)
    if (!map) return
    if (subscriber) {
      // Admins + Champions bypass comingSoon + championOnly gates.
      // Pro is still blocked from coming-soon and Champion-only maps.
      if (!isAdmin && !isChampion) {
        if (map.comingSoon) return
        if (map.championOnly) return
      }
    } else if (!map.freeSample || map.comingSoon) {
      // Free / signed-out: sample maps only — MapSelector shows the rest locked.
      return
    }
    navigate(`/strats/${mapId}`)
  }

  function goSite(siteId) {
    if (!selectedMap) return
    navigate(`/strats/${selectedMap}/${siteId}/${side}`)
  }

  function changeSide(newSide) {
    if (selectedMap && selectedSite) {
      navigate(`/strats/${selectedMap}/${selectedSite}/${newSide}`, { replace: true })
    } else if (selectedMap) {
      navigate(`/strats/${selectedMap}`, { replace: true })
    }
  }

  function handleBack() {
    if (selectedSite) navigate(`/strats/${selectedMap}`)
    else if (selectedMap) navigate('/strats')
  }

  async function shareLink() {
    const url = window.location.href
    try {
      if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
        await navigator.share({
          title: mapData
            ? `Recon 6 · ${mapData.name}${selectedSite ? ` — ${mapData.sites.find((s) => s.id === selectedSite)?.name}` : ''}`
            : 'Recon 6 Strats',
          text: 'Check out this Rainbow Six Siege strat on Recon 6',
          url,
        })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 1800)
    } catch {
      // User canceled share sheet or clipboard blocked
    }
  }

  // Keyboard shortcuts — only when not typing in an input
  useEffect(() => {
    function onKey(e) {
      const tag = (e.target.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      // / -> focus the strat search (only on map list)
      if (!selectedMap && e.key === '/') {
        const input = document.querySelector('.strat-search-input')
        if (input) {
          e.preventDefault()
          input.focus()
          return
        }
      }
      // ? -> open shortcuts cheat sheet (any view)
      if (e.key === '?') {
        e.preventDefault()
        setShortcutsOpen((v) => !v)
        return
      }

      // ESC -> back one level
      if (e.key === 'Escape' && selectedMap) {
        e.preventDefault()
        handleBack()
        return
      }
      // A / D -> switch side (on site view or map view)
      if (selectedMap && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault()
        changeSide('attack')
        return
      }
      if (selectedMap && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault()
        changeSide('defense')
        return
      }
      // 1-4 -> jump to site when viewing a map's site list
      if (selectedMap && !selectedSite && /^[1-4]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1
        const site = mapData?.sites[idx]
        if (site) {
          e.preventDefault()
          goSite(site.id)
        }
        return
      }
      // S -> share when on a full strat view
      if (selectedMap && selectedSite && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        shareLink()
        return
      }
      // B -> toggle Quick Brief on a site strat view
      if (selectedMap && selectedSite && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault()
        toggleViewMode()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMap, selectedSite, side, mapData])

  return (
    <div className="strats-page">
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <SoftPaywall
        open={showPaywall}
        viewCount={viewCount}
        onDismiss={dismissPaywall}
        isAuthed={!!user}
      />

      <div className="strats-header">
        <h1>
          Map <span className="accent">Strategies</span>
        </h1>
        <p>Select a map, pick a site, choose your side. Get the strat your team needs to win.</p>
      </div>

      {selectedMap && (
        <div className="strats-toolbar">
          <button className="strats-back" onClick={handleBack}>
            ← {selectedSite ? mapData?.name : 'All Maps'}
          </button>
          {selectedSite && (
            <div className="strats-toolbar-actions">
              <button
                className={`strats-view-toggle${viewMode === 'brief' ? ' active' : ''}`}
                onClick={toggleViewMode}
                title="Quick brief mode (B) - compact pre-round scan"
              >
                {viewMode === 'brief' ? '\u25A0 Full view' : '\u26A1 Quick brief'}
              </button>
              <button
                className={`strats-share${copyState === 'copied' ? ' copied' : ''}`}
                onClick={shareLink}
                title="Copy link to this strat (S)"
              >
                {copyState === 'copied' ? '\u2713 Link copied' : '\uD83D\uDD17 Share strat'}
              </button>
            </div>
          )}
        </div>
      )}

      {!selectedMap && (
        <>
          <StratSearch />
          <RecentStrip recents={recents} />
          <MapSelector maps={MAPS} onSelect={goMap} />
          <div className="strats-kb-hint">
            <kbd>/</kbd> search · <kbd>A</kbd>/<kbd>D</kbd> side · <kbd>1</kbd>–<kbd>4</kbd> site · <kbd>Esc</kbd> back · <kbd>S</kbd> share · <kbd>B</kbd> quick brief · <kbd>?</kbd> all shortcuts
          </div>
        </>
      )}

      {selectedMap && !selectedSite && (
        <>
          <div className="strats-map-title">
            <h2>{mapData?.name}</h2>
          </div>
          <div className="strats-controls">
            <SideToggle side={side} onToggle={changeSide} />
          </div>
          {bans && (
            <ProGate label="Ban Recommendations">
              <BanDisplay bans={bans} side={side} />
            </ProGate>
          )}
          <SiteSelector sites={mapData?.sites || []} onSelect={goSite} />
        </>
      )}

      {selectedMap && selectedSite && (
        <>
          <div className="strats-map-title">
            <h2>
              {mapData?.name} —{' '}
              {mapData?.sites.find((s) => s.id === selectedSite)?.name}
            </h2>
          </div>
          <div className="strats-controls">
            <SideToggle side={side} onToggle={changeSide} />
          </div>
          {bans && (
            <ProGate label="Ban Recommendations">
              <BanDisplay bans={bans} side={side} />
            </ProGate>
          )}
          {strat ? (
            // Stadium-mode strats are Pro-only end-to-end. The mode requires
            // build/economy/Power knowledge that maps poorly to a free preview —
            // a few free callouts here would mislead more than help. Wrap the
            // entire strat output (brief + full) in ProGate; non-Pro users see
            // a single locked card instead of partial intel.
            mapData?.type === 'Stadium' ? (
              <ProGate label="Stadium Strats — Pro Feature">
                {viewMode === 'brief' ? (
                  <QuickBrief
                    strat={strat}
                    side={side}
                    mapName={mapData?.name}
                    siteName={mapData?.sites.find((s) => s.id === selectedSite)?.name}
                  />
                ) : (
                  <>
                    <SquadToggle size={squadSize} onToggle={setSquadSize} />
                    {squadGuide && <SquadGuide guide={squadGuide} operators={strat.operators} />}
                    <StratDisplay strat={strat} side={side} gated={false} />
                    {enemyIntel && <EnemyIntel intel={enemyIntel} />}
                  </>
                )}
              </ProGate>
            ) : viewMode === 'brief' ? (
              <QuickBrief
                strat={strat}
                side={side}
                mapName={mapData?.name}
                siteName={mapData?.sites.find((s) => s.id === selectedSite)?.name}
              />
            ) : (
              <>
                <ProGate label="Squad Coaching">
                  <SquadToggle size={squadSize} onToggle={setSquadSize} />
                  {squadGuide && <SquadGuide guide={squadGuide} operators={strat.operators} />}
                </ProGate>
                <StratDisplay strat={strat} side={side} gated />
                {enemyIntel && (
                  <ProGate label="Enemy Intel & Predictions">
                    <EnemyIntel intel={enemyIntel} />
                  </ProGate>
                )}
              </>
            )
          ) : mapData?.comingSoon ? (
            // ComingSoon maps intentionally have no strats yet — the data was
            // either drifted from the current game state or never written.
            // Show a friendly placeholder instead of the cold "no data" line
            // so admins (the only ones who can navigate here) don't think
            // the page is broken. Bans + expected enemy bans above are still
            // accurate intel even without full attack/defense breakdowns.
            <div
              className="strats-empty"
              style={{
                border: '1px dashed rgba(255,155,92,0.4)',
                background: 'rgba(255,155,92,0.06)',
                borderRadius: 12,
                padding: '1.5rem',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 700, color: '#ff9b5c', marginBottom: '0.5rem' }}>
                Strats coming soon
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                Full attack and defense breakdowns for {mapData.name} are being written.
                The ban recommendations + expected attacker bans above are accurate intel
                you can use right now.
              </div>
            </div>
          ) : (
            <div className="strats-empty">No strategy data available for this configuration.</div>
          )}
        </>
      )}
    </div>
  )
}
