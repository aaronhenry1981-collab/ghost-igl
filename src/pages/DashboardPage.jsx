import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useActiveGame } from '../hooks/useActiveGame'
import { useGameData } from '../hooks/useGameData'
import { useRecentStrats } from '../hooks/useRecentStrats'
import { useTestimonials } from '../hooks/useTestimonials'
import ReferralsWidget from '../components/dashboard/ReferralsWidget'
import FoundingCountdown from '../components/FoundingCountdown'
import { isFoundingOpen } from '../config/founding'
import './DashboardPage.css'

// Dashboard — the home base for signed-in users. Replaces "land on /strats
// and figure it out" with "land on dashboard, see what to do next."
//
// Sections:
//   1. Personalized welcome header — name + active game + tier
//   2. "Start here" — top tool CTAs tuned to active game
//   3. Today's prep — direct link to match-prep for active game
//   4. Recent activity — strats they've recently viewed (R6 only currently)
//   5. Latest content — newest blog post for the active game
//   6. Subscription status + upgrade CTA if relevant

const TIER_LABEL = {
  champion: { label: 'Champion', color: '#c5a7ff', bg: 'rgba(180,140,255,0.12)', border: 'rgba(180,140,255,0.45)' },
  pro: { label: 'Pro', color: '#00e5ff', bg: 'rgba(0,229,255,0.12)', border: 'rgba(0,229,255,0.45)' },
  free: { label: 'Free', color: 'rgba(230,233,239,0.7)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.15)' },
}

// Discover the freshest blog post for the active game by listing the static
// /blog/ directory at runtime — but the directory listing isn't available
// from the browser, so we use a baked-in list aligned to the build's blog
// generator. Cheap to maintain — local Claude updates the rank-up posts and
// we mirror the slug list here on next deploy.
const BLOG_BY_GAME = {
  r6: [
    { slug: 'r6-diamond-to-champion', title: 'Diamond → Champion in R6' },
    { slug: 'r6-emerald-to-diamond', title: 'Emerald → Diamond in R6' },
    { slug: 'r6-platinum-to-emerald', title: 'Platinum → Emerald in R6' },
  ],
  cs2: [
    { slug: 'cs2-supreme-to-global', title: 'Supreme → Global Elite' },
    { slug: 'cs2-lem-to-supreme', title: 'LEM → Supreme' },
    { slug: 'cs2-le-to-lem', title: 'LE → LEM' },
  ],
  valorant: [
    { slug: 'valorant-ascendant-to-immortal', title: 'Ascendant → Immortal' },
    { slug: 'valorant-diamond-to-ascendant', title: 'Diamond → Ascendant' },
  ],
  ow2: [
    { slug: 'ow2-master-to-gm', title: 'Master → Grandmaster' },
    { slug: 'ow2-diamond-to-master', title: 'Diamond → Master' },
    { slug: 'ow2-plat-to-diamond', title: 'Plat → Diamond' },
  ],
  apex: [
    { slug: 'apex-master-to-pred', title: 'Master → Predator' },
    { slug: 'apex-diamond-to-master', title: 'Diamond → Master' },
    { slug: 'apex-plat-to-diamond', title: 'Plat → Diamond' },
  ],
  mvr: [
    { slug: 'mvr-gm-to-celestial', title: 'GM → Celestial' },
    { slug: 'mvr-diamond-to-gm', title: 'Diamond → Grandmaster' },
    { slug: 'mvr-plat-to-diamond', title: 'Plat → Diamond' },
  ],
  halo: [
    { slug: 'halo-onyx-to-champion', title: 'Onyx → Champion' },
    { slug: 'halo-diamond-to-onyx', title: 'Diamond → Onyx' },
    { slug: 'halo-plat-to-diamond', title: 'Plat → Diamond' },
  ],
  finals: [
    { slug: 'finals-diamond-to-ruby', title: 'Diamond → Ruby' },
    { slug: 'finals-gold-to-plat', title: 'Gold → Plat' },
  ],
  cod: [
    { slug: 'cod-iri-to-top250', title: 'Iridescent → Top 250' },
    { slug: 'cod-plat-to-diamond', title: 'Plat → Diamond' },
  ],
  fn: [
    { slug: 'fn-elite-to-champion', title: 'Elite → Champion' },
    { slug: 'fn-diamond-to-elite', title: 'Diamond → Elite' },
  ],
}

const TIPS_BY_GAME = {
  r6: [
    'Drone before you peek. Always. Three seconds of intel saves a round.',
    'Pre-aim head height through every reinforced wall after Thermite breach.',
    'On site, communicate the plant. Before plant: who covers, who plants.',
    'Bring at least one Thatcher-replacer (Twitch / IQ) if Thatcher is banned.',
    'Roamers waste time, not lives. Trade for a bomber, then reset.',
  ],
  cs2: [
    'Always armor on full-buy. One bodyshot from an AK saved is a round saved.',
    'Pop-flash for entry, then smoke crossfires. Order matters.',
    'M4A1-S on CT-side gives away no muzzle flash from across the map.',
    'Save AWP discipline. If you die with it, drop to SSG next round.',
    'Tec-9 eco rounds win games. One-tap headshots through smoke.',
  ],
  valorant: [
    'Pre-place sentry sig the moment the round starts.',
    'Bait Suzu / Immortality before committing ults.',
    'Astra free-sig refresh = unlimited smokes if you can wait the cooldown.',
    'Sova: line up the recon dart BEFORE you peek, not after.',
    'Trade frags. Solo entries lose rounds even if you frag once.',
  ],
  ow2: [
    'Track enemy support ults FIRST. Bait Suzu before ulting.',
    'Reinhardt Earthshatter timing: wait for Kiriko cooldown.',
    'Group up before commit. 5v5 doesn\'t forgive split pushes.',
    'Switch off your hero if you lose 2 fights in a row. Counter-pick wins.',
    'Sound Barrier Lúcio ult negates 750 damage — track enemy ult voicelines.',
  ],
  apex: [
    'Helmet, knockdown, evo shield FIRST. Health > damage attachments.',
    'Don\'t race for high ground in final ring — build there pre-storm.',
    'One stack (60+) ammo per weapon type. Running dry mid-fight = death.',
    'Volt SMG for close fights. R-301 / Flatline for everything else.',
    'Edge-drop = 70% top-10 reach. Hot-drop = 30% round-1 wipe.',
  ],
  mvr: [
    'Team-up bonus persists only while anchor hero is alive. Protect them.',
    'Strange Eye + Hela ult = team wipe. Coordinate the chain.',
    'Pick the back-line support first. Mantis sleep can pre-empt their ult.',
    'Magneto pulls Hulk away from frontline. Counter pick pure value.',
    'Hela counter = Spider-Man dive or Magik teleport. Close the gap fast.',
  ],
  halo: [
    'Track power-up timers. Overshield + Camo spawn every 120s.',
    'Power weapon holder = bodyguard. Don\'t leave them alone.',
    'Hijack Wraith from behind. Plasma stick takes Wraith out in 1 nade.',
    'BR burst tracking: pull-down between shots is the recoil pattern.',
    'M4A1-S CT-side, M4A4 if you need raw DPS.',
  ],
  finals: [
    'Heavy Mesh Shield anchors THE cashout, not the choke in front.',
    'Defib > heal beam if you can get a teammate up safely.',
    'Goo Gun on doors during cashout = hard counter to entry.',
    'Light Cloak: time vanish to break LOS, isolate one target.',
    'APS Turret blocks projectiles — drop on your retake angle.',
  ],
  cod: [
    'Slide-cancel into every entry. Don\'t walk in standing.',
    'Trip mines on every entry to your hold spot. Anti-flank insurance.',
    'High Alert perk warns when seen — pre-aim before they peek.',
    'Stim + Dead Silence = ghost the flank without scope warnings.',
    'Reload BEFORE the fight, never DURING.',
  ],
  fn: [
    'Crank 90s wins box fights. Practice in Creative until automatic.',
    'Cone-piece denies enemy edit play. Triple-edit = fastest peek.',
    'Build a 1x1 on natural high ground BEFORE storm closes.',
    'Mythic gold pump = one-shot in crank. Always pick up.',
    'Top 10 priority: full mats + 2 heals + mobility item slotted.',
  ],
}

function pickTip(gameId) {
  const tips = TIPS_BY_GAME[gameId] || TIPS_BY_GAME.r6
  // Use day-of-year so the tip changes daily but is stable within a day —
  // a player checking 5 times today sees the same tip, encouraging them to
  // come back tomorrow for the next one.
  const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  return tips[day % tips.length]
}

export default function DashboardPage() {
  const { user, plan, isAdmin, loading: authLoading } = useAuth()
  const { activeGameId, activeGame, isR6 } = useActiveGame()
  const { data, gameMeta } = useGameData()
  const { recents } = useRecentStrats()
  const { visible: testimonials } = useTestimonials()

  const accent = gameMeta.color || '#00e5ff'
  const displayName = gameMeta.displayName || activeGameId

  const tier = isAdmin ? 'champion' : (plan === 'champion' ? 'champion' : (plan === 'pro' ? 'pro' : 'free'))
  const tierMeta = TIER_LABEL[tier]
  const isPaid = tier === 'pro' || tier === 'champion'

  const gameStats = useMemo(() => {
    if (!data) return null
    const maps = Array.isArray(data.MAPS) ? data.MAPS : Object.values(data.MAPS || {})
    const cast = Array.isArray(data.CAST) ? data.CAST : Object.values(data.CAST || {})
    const stratSites = Object.keys(data.STRATS || {}).reduce((sum, mapId) => sum + Object.keys(data.STRATS[mapId] || {}).length, 0)
    return { mapCount: maps.length, castCount: cast.length, stratSites }
  }, [data])

  const tip = useMemo(() => pickTip(activeGameId), [activeGameId])
  const blogList = BLOG_BY_GAME[activeGameId] || []

  if (authLoading) {
    return <div className="dashboard-page"><div className="dashboard-loading">Loading…</div></div>
  }

  if (!user) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-empty">
          <h1>Sign in to your dashboard</h1>
          <p>Your dashboard shows what to do next based on your active game and recent activity.</p>
          <Link to="/auth" className="btn btn-primary">Sign in</Link>
        </div>
      </div>
    )
  }

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 5) return 'Late night'
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const firstName = (user.email || '').split('@')[0].split('.')[0].split('+')[0]
  const niceName = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : 'player'

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <div className="dashboard-eyebrow">Dashboard</div>
          <h1>
            {greeting}, {niceName}.
          </h1>
          <p className="dashboard-sub">
            Active game: <strong style={{ color: accent }}>{displayName}</strong>
            {gameStats && <> &middot; {gameStats.mapCount} maps, {gameStats.castCount} {gameMeta.vocab?.operator?.toLowerCase() || 'characters'}, {gameStats.stratSites} sites with strats</>}
          </p>
        </div>
        <div className="dashboard-tier" style={{ color: tierMeta.color, background: tierMeta.bg, borderColor: tierMeta.border }}>
          {tierMeta.label.toUpperCase()}
          {isAdmin && <span className="dashboard-tier-admin">Admin</span>}
        </div>
      </header>

      {/* Tip of the day — fresh content each day for retention. */}
      <div className="dashboard-tip" style={{ borderColor: accent }}>
        <div className="dashboard-tip-label" style={{ color: accent }}>Today's {displayName} tip</div>
        <p>{tip}</p>
      </div>

      <ReferralsWidget />

      <h2 className="dashboard-section-h">Pick up where you left off</h2>
      <div className="dashboard-grid dashboard-grid-tools">
        <Link to="/strats" className="dashboard-card" style={{ borderLeftColor: accent }}>
          <div className="dashboard-card-head">
            <strong>Strats</strong>
            <span className="dashboard-card-pill">{displayName}</span>
          </div>
          <p>Site-by-site picks, callouts, utility. {isR6 ? 'Full R6 catalog.' : `${gameStats?.stratSites || 0} sites.`}</p>
        </Link>

        <Link to="/loadouts" className="dashboard-card" style={{ borderLeftColor: accent }}>
          <div className="dashboard-card-head">
            <strong>Loadouts</strong>
            <span className="dashboard-card-pill">What to pick</span>
          </div>
          <p>Weapon picks, ability priorities, comp combos for {displayName}.</p>
        </Link>

        <Link to="/match-prep" className="dashboard-card" style={{ borderLeftColor: accent }}>
          <div className="dashboard-card-head">
            <strong>Match Prep</strong>
            <span className="dashboard-card-pill">90-second prep</span>
          </div>
          <p>One-screen pre-round cheatsheet. Bans, picks, callouts. Copy to Discord or print.</p>
        </Link>

        <Link to="/vod" className="dashboard-card" style={{ borderLeftColor: accent }}>
          <div className="dashboard-card-head">
            <strong>VOD Review</strong>
            <span className="dashboard-card-pill">{isR6 ? 'Live' : `${displayName} preview`}</span>
          </div>
          <p>{isR6 ? 'Drop a screenshot, find out what cost you the round.' : `Preview what ${displayName} VOD review looks like — full review engine ships per game.`}</p>
        </Link>
      </div>

      {recents.length > 0 && isR6 && (
        <>
          <h2 className="dashboard-section-h">Your recent strats</h2>
          <div className="dashboard-grid dashboard-grid-recents">
            {recents.slice(0, 6).map((r) => (
              <Link
                key={`${r.mapId}:${r.siteId}:${r.side}`}
                to={`/strats/${r.mapId}/${r.siteId}/${r.side}`}
                className="dashboard-recent"
              >
                <span className="dashboard-recent-side">{r.side === 'attack' ? 'ATK' : 'DEF'}</span>
                <strong>{(r.mapName || r.mapId).replace(/-/g, ' ')}</strong>
                <span>{r.siteName || r.siteId}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {blogList.length > 0 && (
        <>
          <h2 className="dashboard-section-h">Latest {displayName} rank-up guides</h2>
          <div className="dashboard-grid dashboard-grid-blog">
            {blogList.map((p) => (
              <a key={p.slug} href={`/blog/${p.slug}.html`} className="dashboard-blog-card">
                <strong>{p.title}</strong>
                <span>Read the guide &rarr;</span>
              </a>
            ))}
            <a href="/blog/" className="dashboard-blog-card dashboard-blog-card-all">
              <strong>All rank-up guides</strong>
              <span>62 posts &rarr;</span>
            </a>
          </div>
        </>
      )}

      {!isPaid && (
        <div className="dashboard-upsell" style={{ borderColor: accent }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginBottom: 6 }}>
              <div className="dashboard-eyebrow" style={{ color: accent }}>Upgrade</div>
              {isFoundingOpen() && <FoundingCountdown variant="pill" />}
            </div>
            <h3>Unlock the round-by-round VOD breakdowns</h3>
            <p>
              {isFoundingOpen() ? (
                <>
                  Pro is <strong>$9/mo founding</strong> &mdash; locked for life if you join before the countdown ends.
                  Pro reviews your screenshots and tells you exactly what cost you the round &mdash; with a fix.
                  All-Access ($19) extends to all 20 games.
                </>
              ) : (
                <>
                  Pro reviews your screenshots and tells you exactly what cost you the round &mdash; with a fix.
                  All-Access extends to all 20 games.
                </>
              )}
            </p>
            <div className="dashboard-upsell-cta">
              <Link to="/#pricing" className="btn btn-primary" style={{ background: accent, color: '#0a0f19' }}>See pricing</Link>
              <Link to="/account" className="btn btn-outline">My account</Link>
            </div>
          </div>
        </div>
      )}

      {isPaid && (
        <div className="dashboard-tier-status">
          <div>
            <strong>You're on {tierMeta.label}.</strong>
            <p>
              {tier === 'champion'
                ? 'Full access &mdash; multi-round VOD sessions, weekly drill plans, premium tactics, and the desktop coach app.'
                : 'Pro access — VOD reviews, ban intel, opponent reads. Want multi-round + drill plans? Upgrade to Champion.'}
            </p>
          </div>
          <Link to="/account" className="btn btn-outline btn-sm">Manage subscription</Link>
        </div>
      )}

      {testimonials.length > 0 && (
        <>
          <h2 className="dashboard-section-h">Players ranking up</h2>
          <div className="dashboard-grid dashboard-grid-testi">
            {testimonials.slice(0, 3).map((t) => (
              <div key={t.id || t.name} className="dashboard-testi">
                <p>&ldquo;{t.text}&rdquo;</p>
                <div className="dashboard-testi-meta">
                  <strong>{t.name}</strong>
                  {t.rank && <span>{t.rank}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
