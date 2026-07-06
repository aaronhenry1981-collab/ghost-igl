#!/usr/bin/env node
// Regenerates public/sitemap.xml from the actual map data + static routes.
// Previously this file was hand-maintained and drifted out of sync — now it's
// part of the build step so every deploy has a fresh, correct sitemap.
// Run: node scripts/generate-sitemap.mjs

import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import MAPS from '../src/data/maps.js'
import STRATS from '../src/data/strats.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'public', 'sitemap.xml')
const SITE = 'https://r6coaching.com'

const today = new Date().toISOString().slice(0, 10)

const STATIC_URLS = [
  { loc: '/', freq: 'weekly', pri: 1.0 },
  { loc: '/#/auth', freq: 'monthly', pri: 0.6 },
  { loc: '/#/dashboard', freq: 'monthly', pri: 0.7 },
  { loc: '/#/strats', freq: 'weekly', pri: 0.9 },
  { loc: '/#/match-prep', freq: 'weekly', pri: 0.85 },
  { loc: '/#/loadouts', freq: 'weekly', pri: 0.85 },
  { loc: '/#/operators', freq: 'weekly', pri: 0.9 },
  { loc: '/#/meta', freq: 'weekly', pri: 0.8 },
  { loc: '/#/vod', freq: 'monthly', pri: 0.8 },
  { loc: '/#/download', freq: 'monthly', pri: 0.7 },
  { loc: '/#/changelog', freq: 'weekly', pri: 0.5 },
  { loc: '/#/live', freq: 'weekly', pri: 0.9 },
  { loc: '/#/press', freq: 'monthly', pri: 0.6 },
  { loc: '/#/tools/r6-tier-list', freq: 'weekly', pri: 0.85 },
  { loc: '/#/tools/ow2-stadium-tier-list', freq: 'weekly', pri: 0.85 },
  { loc: '/#/terms', freq: 'yearly', pri: 0.3 },
  { loc: '/#/privacy', freq: 'yearly', pri: 0.3 },
  { loc: '/#/refund', freq: 'yearly', pri: 0.3 },
  { loc: '/guides/', freq: 'weekly', pri: 0.9 },
  { loc: '/guides/operators/', freq: 'weekly', pri: 0.9 },
  { loc: '/guides/bans/', freq: 'weekly', pri: 0.8 },
  { loc: '/blog/', freq: 'weekly', pri: 0.85 },
  { loc: '/countdown/', freq: 'weekly', pri: 0.85 },
  { loc: '/games/', freq: 'weekly', pri: 0.9 },
  // Per-game landing pages — one per supported FPS, captures
  // long-tail SEO ("CS2 strategy guide", "Valorant agent guide", etc.).
  { loc: '/games/cs2/', freq: 'weekly', pri: 0.85 },
  { loc: '/games/valorant/', freq: 'weekly', pri: 0.85 },
  { loc: '/games/cod/', freq: 'weekly', pri: 0.85 },
  { loc: '/games/apex/', freq: 'weekly', pri: 0.85 },
  { loc: '/games/ow2/', freq: 'weekly', pri: 0.85 },
  { loc: '/games/mvr/', freq: 'weekly', pri: 0.85 },
  { loc: '/games/finals/', freq: 'weekly', pri: 0.85 },
  { loc: '/games/halo/', freq: 'weekly', pri: 0.85 },
  { loc: '/games/fn/', freq: 'weekly', pri: 0.85 },
  { loc: '/games/rl/', freq: 'weekly', pri: 0.85 },
  // Early-access 9 game landing pages (LoL, Dota 2, EA FC, Tekken 8, SF6,
  // PUBG, Deadlock, Naraka, NBA 2K). Catalog + structure live; deep content
  // growing. Priority 0.75 (slightly lower than core 11 until content lands).
  { loc: '/games/lol/', freq: 'weekly', pri: 0.75 },
  { loc: '/games/dota2/', freq: 'weekly', pri: 0.75 },
  { loc: '/games/eafc/', freq: 'weekly', pri: 0.75 },
  { loc: '/games/tk8/', freq: 'weekly', pri: 0.75 },
  { loc: '/games/sf6/', freq: 'weekly', pri: 0.75 },
  { loc: '/games/pubg/', freq: 'weekly', pri: 0.75 },
  { loc: '/games/deadlock/', freq: 'weekly', pri: 0.75 },
  { loc: '/games/naraka/', freq: 'weekly', pri: 0.75 },
  { loc: '/games/nba2k/', freq: 'weekly', pri: 0.75 },
  // Per-game loadouts pages — captures "<game> loadouts" / "best <game>
  // weapons" queries which are extremely high-volume search terms.
  { loc: '/games/r6/loadouts.html', freq: 'monthly', pri: 0.85 },
  { loc: '/games/cs2/loadouts.html', freq: 'monthly', pri: 0.85 },
  { loc: '/games/valorant/loadouts.html', freq: 'monthly', pri: 0.85 },
  { loc: '/games/ow2/loadouts.html', freq: 'monthly', pri: 0.85 },
  { loc: '/games/apex/loadouts.html', freq: 'monthly', pri: 0.85 },
  { loc: '/games/mvr/loadouts.html', freq: 'monthly', pri: 0.85 },
  { loc: '/games/halo/loadouts.html', freq: 'monthly', pri: 0.85 },
  { loc: '/games/finals/loadouts.html', freq: 'monthly', pri: 0.85 },
  { loc: '/games/cod/loadouts.html', freq: 'monthly', pri: 0.85 },
  { loc: '/games/fn/loadouts.html', freq: 'monthly', pri: 0.85 },
  { loc: '/games/rl/loadouts.html', freq: 'monthly', pri: 0.85 },
  { loc: '/tools/', freq: 'weekly', pri: 0.85 },
]

// Per-game per-map landing pages. Local Claude generated 9 games' worth of
// data; we expose each map as its own indexable URL — captures queries like
// "CS2 Mirage strategy guide", "Valorant Bind callouts", "Apex Storm Point POIs",
// etc. Adds ~73 URLs to the sitemap.
// Per-game cast (agent/hero/legend/loadout) URLs. Captures queries like
// "Jett Valorant guide", "D.Va Overwatch 2 build", etc. ~156 URLs.
async function getMultiGameCastUrls() {
  const urls = []
  try {
    const { GAMES } = await import('../src/data/games/index.js')
    for (const game of GAMES) {
      if (game.id === 'r6') continue
      try {
        const data = await game.load()
        const cast = Array.isArray(data.CAST) ? data.CAST : Object.values(data.CAST || {})
        for (const m of cast) {
          if (!m?.name) continue
          const slug = String(m.id || m.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          urls.push({ loc: `/games/${game.id}/cast/${slug}.html`, freq: 'monthly', pri: 0.7 })
        }
        // Index page per game's cast catalog
        urls.push({ loc: `/games/${game.id}/cast/`, freq: 'weekly', pri: 0.8 })
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return urls
}

async function getMultiGameMapUrls() {
  const urls = []
  try {
    const { GAMES } = await import('../src/data/games/index.js')
    for (const game of GAMES) {
      if (game.id === 'r6') continue // R6 has its own /guides/ system
      try {
        const data = await game.load()
        const maps = Array.isArray(data.MAPS) ? data.MAPS : Object.values(data.MAPS || {})
        for (const m of maps) {
          if (!m?.id) continue
          urls.push({
            loc: `/games/${game.id}/${m.id}.html`,
            freq: 'monthly',
            pri: 0.7,
          })
          // Per-map loadout pages — captures "<map> <game> loadouts" queries.
          if (data.STRATS?.[m.id]) {
            urls.push({
              loc: `/games/${game.id}/${m.id}-loadouts.html`,
              freq: 'monthly',
              pri: 0.75,
            })
          }
        }
      } catch {
        // Game data load failed; skip.
      }
    }
  } catch {
    // Multi-game registry not present yet; skip silently.
  }
  return urls
}

function urlEntry({ loc, freq, pri, lastmod }) {
  return `  <url>
    <loc>${SITE}${loc}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${freq}</changefreq>
    <priority>${pri.toFixed(1)}</priority>
  </url>`
}

async function main() {
  const urls = []
  for (const u of STATIC_URLS) urls.push(urlEntry({ ...u, lastmod: today }))

  // Per-map guide pages (only maps with strat data)
  for (const map of MAPS) {
    if (map.comingSoon) continue
    if (!STRATS[map.id]) continue
    urls.push(urlEntry({
      loc: `/guides/${map.id}.html`,
      freq: 'monthly',
      pri: 0.8,
      lastmod: today,
    }))

    // Per-site SEO pages — one per bomb site that has a strat. These target
    // long-tail queries like "bank ceo defense strat" and dramatically expand
    // the site's indexable surface (14 pages → ~70 pages).
    for (const site of map.sites) {
      if (!STRATS[map.id]?.[site.id]) continue
      urls.push(urlEntry({
        loc: `/guides/${map.id}/${site.id}.html`,
        freq: 'monthly',
        pri: 0.7,
        lastmod: today,
      }))
    }
  }

  // Per-operator SEO pages — same long-tail capture pattern as per-site
  // pages. "Thermite operator guide R6 Siege" is a real search query; this
  // gives Google ~47 indexable operator pages with proper internal linking.
  const operatorSet = new Set()
  for (const mapId of Object.keys(STRATS)) {
    for (const siteId of Object.keys(STRATS[mapId])) {
      for (const side of ['attack', 'defense']) {
        const ops = STRATS[mapId][siteId]?.[side]?.operators || []
        for (const op of ops) operatorSet.add(op.name)
      }
    }
  }
  // Append multi-game per-map URLs from local Claude's data
  const gameMapUrls = await getMultiGameMapUrls()
  for (const u of gameMapUrls) urls.push(urlEntry({ ...u, lastmod: today }))

  // Append multi-game per-cast (agent/hero/legend/loadout) URLs.
  const gameCastUrls = await getMultiGameCastUrls()
  for (const u of gameCastUrls) urls.push(urlEntry({ ...u, lastmod: today }))

  for (const opName of [...operatorSet].sort()) {
    const slug = opName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    urls.push(urlEntry({
      loc: `/guides/operators/${slug}.html`,
      freq: 'monthly',
      pri: 0.7,
      lastmod: today,
    }))
  }

  // Per-map ban guide pages — captures "best operators to ban on X" queries.
  for (const map of MAPS) {
    urls.push(urlEntry({
      loc: `/guides/bans/${map.id}.html`,
      freq: 'monthly',
      pri: 0.7,
      lastmod: today,
    }))
  }

  // Blog rank-up posts — long-tail SEO targeting "how to rank up in <game>"
  // queries. Slugs are stable; we can list them directly without rescanning
  // the filesystem so the sitemap stays deterministic.
  const BLOG_SLUGS = [
    // R6
    'r6-copper-to-bronze',
    'r6-bronze-to-silver',
    'r6-silver-to-gold',
    'r6-gold-to-platinum',
    'r6-platinum-to-emerald',
    'r6-emerald-to-diamond',
    'r6-diamond-to-champion',
    // CS2
    'cs2-silver-to-nova',
    'cs2-nova-to-mg',
    'cs2-mg-to-dmg',
    'cs2-dmg-to-le',
    'cs2-le-to-lem',
    'cs2-lem-to-supreme',
    'cs2-supreme-to-global',
    // Valorant
    'valorant-iron-to-bronze',
    'valorant-bronze-to-silver',
    'valorant-silver-to-gold',
    'valorant-gold-to-plat',
    'valorant-plat-to-diamond',
    'valorant-diamond-to-ascendant',
    'valorant-ascendant-to-immortal',
    // OW2
    'ow2-bronze-to-silver',
    'ow2-silver-to-gold',
    'ow2-gold-to-plat',
    'ow2-plat-to-diamond',
    'ow2-diamond-to-master',
    'ow2-master-to-gm',
    'ow2-stadium-guide',
    'ow2-stadium-tier-list',
    'ow2-stadium-items-guide',
    'ow2-stadium-economy',
    // Apex
    'apex-bronze-to-silver',
    'apex-silver-to-gold',
    'apex-gold-to-plat',
    'apex-plat-to-diamond',
    'apex-diamond-to-master',
    'apex-master-to-pred',
    // Marvel Rivals
    'mvr-bronze-to-silver',
    'mvr-silver-to-gold',
    'mvr-gold-to-plat',
    'mvr-plat-to-diamond',
    'mvr-diamond-to-gm',
    'mvr-gm-to-celestial',
    // Halo
    'halo-bronze-to-silver',
    'halo-silver-to-gold',
    'halo-gold-to-plat',
    'halo-plat-to-diamond',
    'halo-diamond-to-onyx',
    'halo-onyx-to-champion',
    // The Finals
    'finals-bronze-to-silver',
    'finals-silver-to-gold',
    'finals-gold-to-plat',
    'finals-plat-to-diamond',
    'finals-diamond-to-ruby',
    // CoD
    'cod-bronze-to-silver',
    'cod-silver-to-gold',
    'cod-gold-to-plat',
    'cod-plat-to-diamond',
    'cod-diamond-to-iri',
    'cod-iri-to-top250',
    // Fortnite
    'fn-bronze-to-silver',
    'fn-silver-to-gold',
    'fn-gold-to-plat',
    'fn-plat-to-diamond',
    'fn-diamond-to-elite',
    'fn-elite-to-champion',
    // Rocket League
    'rl-bronze-to-silver',
    'rl-silver-to-gold',
    'rl-gold-to-platinum',
    'rl-platinum-to-diamond',
    'rl-diamond-to-champion',
    'rl-champion-to-gc',
    'rl-gc-to-ssl',
    // League of Legends
    'lol-beginner-guide-2026',
    'lol-champion-tier-list-2026',
    'lol-itemization-guide',
    'lol-gold-to-platinum',
    'lol-top-lane-matchups',
    // EA Sports FC
    'eafc-beginner-guide-2026',
    'eafc-best-formations-2026',
    'eafc-fut-chemistry-guide',
    'eafc-div5-to-elite',
    'eafc-custom-tactics-guide',
    // Tekken 8
    'tekken-8-beginner-guide-2026',
    'tekken-8-tier-list-2026',
    'tekken-8-bnb-combos-guide',
    'tekken-8-1st-dan-to-king',
    'tekken-8-matchup-chart-2026',
    // PUBG
    'pubg-beginner-guide-2026',
    'pubg-best-drops-2026',
    'pubg-weapon-tier-list-2026',
    'pubg-silver-to-gold',
    'pubg-endgame-strategy',
    // Dota 2
    'dota-2-beginner-guide-2026',
    'dota-2-hero-tier-list-2026',
    'dota-2-item-builds-guide',
    'dota-2-crusader-to-archon',
    'dota-2-warding-guide-2026',
    // R6 operator deep-dives (47 posts)
    'r6-operator-ace', 'r6-operator-alibi', 'r6-operator-aruni', 'r6-operator-ash', 'r6-operator-azami',
    'r6-operator-bandit', 'r6-operator-buck', 'r6-operator-capitao', 'r6-operator-castle', 'r6-operator-caveira',
    'r6-operator-doc', 'r6-operator-dokkaebi', 'r6-operator-echo', 'r6-operator-ela', 'r6-operator-finka',
    'r6-operator-flores', 'r6-operator-fuze', 'r6-operator-glaz', 'r6-operator-goyo', 'r6-operator-gridlock',
    'r6-operator-hibana', 'r6-operator-iana', 'r6-operator-jager', 'r6-operator-kaid', 'r6-operator-kali',
    'r6-operator-lesion', 'r6-operator-lion', 'r6-operator-maestro', 'r6-operator-maverick', 'r6-operator-melusi',
    'r6-operator-mira', 'r6-operator-mozzie', 'r6-operator-mute', 'r6-operator-nomad', 'r6-operator-pulse',
    'r6-operator-sledge', 'r6-operator-smoke', 'r6-operator-thatcher', 'r6-operator-thermite', 'r6-operator-thunderbird',
    'r6-operator-twitch', 'r6-operator-valkyrie', 'r6-operator-vigil', 'r6-operator-wamai', 'r6-operator-ying',
    'r6-operator-zero', 'r6-operator-zofia',
  ]
  for (const slug of BLOG_SLUGS) {
    urls.push(urlEntry({
      loc: `/blog/${slug}.html`,
      freq: 'monthly',
      pri: 0.7,
      lastmod: today,
    }))
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`
  writeFileSync(OUT, body, 'utf8')
  console.log(`✓ Generated sitemap with ${urls.length} URLs`)
}

main()
