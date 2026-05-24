#!/usr/bin/env node
// Generates per-game SEO landing pages at public/games/<gameId>/index.html.
// Each page lists maps + cast (operators/agents/heroes) for that game and
// pitches Recon 6 as the multi-game coaching platform.
//
// Captures SEO terms like "CS2 strategy guide", "Valorant agent guide",
// "Apex Legends ranked tips" before each game's interactive UI is wired up.
// As soon as Google indexes these, organic traffic flows to subscriptions.
//
// Skips R6 — it already has full static pages at /guides/.
//
// Run: node scripts/generate-game-landing-pages.mjs

import { writeFileSync, mkdirSync, readdirSync, existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { GAMES } from '../src/data/games/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SITE_URL = 'https://r6coaching.com'

function escape(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Discover the rank-up blog posts for a given game by scanning public/blog/.
// Filenames follow `<gameId>-<from>-to-<to>.html`, so we filter on the
// game-id prefix. Returns sorted by rank order (file order is already
// alphabetical, but blog filenames intentionally use rank progression so
// alphabetical = rank-ascending for most games — good enough).
const BLOG_DIR = join(ROOT, 'public', 'blog')
function blogPostsForGame(gameId) {
  if (!existsSync(BLOG_DIR)) return []
  const files = readdirSync(BLOG_DIR).filter(f => f.endsWith('.html') && f !== 'index.html' && f.startsWith(`${gameId}-`))
  return files.map(f => {
    const slug = f.replace(/\.html$/, '')
    // Pull the <title> from the file so the link text matches the post.
    let title = slug
    try {
      const content = readFileSync(join(BLOG_DIR, f), 'utf8')
      const m = /<title>([^<]+)<\/title>/.exec(content)
      if (m) title = m[1].replace(/\s*\|\s*Recon\+\s*$/, '').trim()
    } catch {/* fall back to slug */}
    return { slug, title }
  })
}

function htmlShell({ title, description, canonical, bodyInner, jsonLd, breadcrumbs, themeColor, ogImage }) {
  const og = ogImage || `${SITE_URL}/og-image.png`
  const ldBlocks = []
  if (jsonLd) ldBlocks.push(jsonLd)
  if (breadcrumbs?.length) {
    ldBlocks.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((b, i) => ({
        '@type': 'ListItem', position: i + 1, name: b.name, item: b.url,
      })),
    })
  }
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}" />
  <link rel="canonical" href="${escape(canonical)}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="${themeColor || '#0a0f19'}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escape(title)}" />
  <meta property="og:description" content="${escape(description)}" />
  <meta property="og:url" content="${escape(canonical)}" />
  <meta property="og:image" content="${og}" />
  <meta property="og:site_name" content="Recon 6" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${og}" />
  ${ldBlocks.map(b => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join('\n  ')}
  <style>
    :root { color-scheme: dark; --accent: ${themeColor || '#00e5ff'}; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #0a0f19; color: #e6e9ef; line-height: 1.6; }
    .container { max-width: 980px; margin: 0 auto; padding: 1.5rem; }
    .nav { padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 1.5rem; }
    .nav a { color: var(--accent); text-decoration: none; margin-right: 1rem; font-weight: 600; }
    .game-hero { padding: 2.5rem 0; text-align: center; }
    .game-hero .badge { display: inline-block; padding: 4px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 999px; font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(230,233,239,0.6); margin-bottom: 1rem; }
    h1 { font-size: 2.5rem; margin: 0 0 0.5rem; line-height: 1.15; }
    h1 .accent { color: var(--accent); }
    .lead { font-size: 1.15rem; color: rgba(230,233,239,0.85); max-width: 720px; margin: 0.5rem auto 1.5rem; }
    .cta-row { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; margin: 1.5rem 0; }
    .btn { display: inline-block; padding: 0.7rem 1.5rem; border-radius: 8px; font-weight: 700; text-decoration: none; transition: all 0.15s; }
    .btn-primary { background: var(--accent); color: #0a0f19; }
    .btn-primary:hover { filter: brightness(1.1); }
    .btn-outline { background: transparent; color: var(--accent); border: 1px solid var(--accent); }
    h2 { font-size: 1.5rem; margin: 2rem 0 1rem; color: var(--accent); }
    h3 { font-size: 1.05rem; margin: 1rem 0 0.5rem; }
    .stat-row { display: flex; gap: 1.5rem; flex-wrap: wrap; justify-content: center; margin: 1.5rem 0; }
    .stat { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 1rem 1.25rem; min-width: 140px; text-align: center; }
    .stat-label { color: rgba(230,233,239,0.6); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-val { font-size: 1.7rem; font-weight: 800; color: #fff; margin-top: 4px; }
    .grid { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); margin: 1rem 0; }
    .grid-item { padding: 0.85rem 1rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-left: 3px solid var(--accent); border-radius: 8px; font-size: 0.9rem; }
    .grid-item strong { color: #fff; }
    .grid-item span { color: rgba(230,233,239,0.6); font-size: 0.78rem; display: block; margin-top: 2px; }
    .pricing-callout { padding: 1.5rem; background: linear-gradient(135deg, rgba(0,229,255,0.08), rgba(180,140,255,0.08)); border: 1px solid var(--accent); border-radius: 12px; margin: 2rem 0; }
    footer { margin-top: 3rem; padding: 1.5rem 0; border-top: 1px solid rgba(255,255,255,0.08); color: rgba(230,233,239,0.5); font-size: 0.85rem; text-align: center; }
    footer a { color: var(--accent); }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav">
      <a href="/">Recon 6</a>
      <a href="/guides/">R6 Guides</a>
      <a href="/games/">All Games</a>
      <a href="/#pricing">Pricing</a>
    </div>
    ${bodyInner}
    <footer>
      <p>Recon 6 — coaching across 20 competitive games.<br>
      Game names + characters are property of their respective owners. Fan-made, not affiliated.</p>
      <p><a href="${SITE_URL}/#pricing">See plans →</a></p>
    </footer>
  </div>
</body>
</html>`
}

async function generateGamePage(game) {
  // Skip R6 — already has full guides at /guides/.
  if (game.id === 'r6') return null

  let data
  try {
    data = await game.load()
  } catch (err) {
    console.warn(`Skipping ${game.id}: load error — ${err.message}`)
    return null
  }

  const meta = game.gameMeta || {}
  const themeColor = meta.color || '#00e5ff'
  const displayName = meta.displayName || meta.name || game.id
  const vocabRaw = meta.vocab || {}
  // Resolve a vocab term across naming conventions; never produce
  // "undefineds" — `undefined + 's'` evaluates to that truthy string
  // and breaks fallback chains that use `||`.
  const _term = (...keys) => {
    for (const k of keys) {
      const v = vocabRaw[k]
      if (typeof v === 'string' && v) return v
    }
    return null
  }
  const _castWord = _term('operator', 'cast') || 'Character'
  const _castWordPlural = `${_castWord}${_castWord.endsWith('s') ? '' : 's'}`
  const _mapWord = _term('map') || 'Map'
  const _mapWordPlural = `${_mapWord}${_mapWord.endsWith('s') ? '' : 's'}`
  const _siteWord = _term('site') || 'Site'
  const _siteWordPlural = `${_siteWord}${_siteWord.endsWith('s') ? '' : 's'}`
  const vocab = {
    ...vocabRaw,
    cast: _castWord, castPlural: _castWordPlural,
    map: _mapWord, mapPlural: _mapWordPlural,
    site: _siteWord, sitePlural: _siteWordPlural,
  }

  const maps = Array.isArray(data.MAPS) ? data.MAPS : Object.values(data.MAPS || {})
  const cast = Array.isArray(data.CAST) ? data.CAST : Object.values(data.CAST || {})
  const stratCount = data.STRATS ? Object.keys(data.STRATS).length : 0

  const description = `${displayName} strategy guide for ranked play. Maps, ${vocab.castPlural?.toLowerCase() || vocab.cast?.toLowerCase() + 's' || 'characters'}, callouts, and round-by-round VOD breakdowns. Recon 6 covers ${displayName} as part of the All-Access subscription.`

  const mapsListHtml = maps.length > 0 ? `
    <h2>${escape(displayName)} ${escape(vocab.mapPlural || (vocab.map + 's') || 'Maps')}</h2>
    <div class="grid">
      ${maps.slice(0, 24).map(m => `
        <div class="grid-item">
          <strong>${escape(m.name || m.id)}</strong>
          ${m.sites?.length ? `<span>${m.sites.length} ${escape(vocab.sitePlural || vocab.site + 's' || 'sites')}</span>` : ''}
        </div>
      `).join('')}
    </div>
  ` : ''

  const castListHtml = cast.length > 0 ? `
    <h2>${escape(displayName)} ${escape(vocab.castPlural || vocab.cast + 's' || 'Characters')}</h2>
    <div class="grid">
      ${cast.slice(0, 36).map(c => `
        <div class="grid-item">
          <strong>${escape(c.name || c.id)}</strong>
          ${c.role ? `<span>${escape(c.role)}</span>` : ''}
        </div>
      `).join('')}
    </div>
  ` : ''

  const blogPosts = blogPostsForGame(game.id)
  const blogHtml = blogPosts.length > 0 ? `
    <h2>${escape(displayName)} Rank-Up Guides</h2>
    <p style="color: rgba(230,233,239,0.75); margin: 0 0 1rem;">Step-by-step guides for climbing each rank tier in ${escape(displayName)} — what to focus on, common mistakes, and drills.</p>
    <div class="grid">
      ${blogPosts.map(p => `
        <a href="/blog/${p.slug}.html" class="grid-item" style="text-decoration:none; color:inherit; display:block;">
          <strong>${escape(p.title)}</strong>
          <span>Read the guide →</span>
        </a>
      `).join('')}
    </div>
  ` : ''

  // Loadouts section — surfaces the LOADOUTS data on the public landing
  // page so Google can index "<game> loadouts" queries (high search volume).
  const loadoutsData = data.LOADOUTS || {}
  const loadoutEntries = Object.entries(loadoutsData)
  const loadoutsHtml = loadoutEntries.length > 0 ? `
    <h2>${escape(displayName)} Loadouts</h2>
    <p style="color: rgba(230,233,239,0.75); margin: 0 0 1rem;">What to pick &mdash; and why. Real loadouts, weapon priorities, and team-comp combos.
      <a href="/#/loadouts" style="color: var(--accent);">Open the full interactive loadouts &rarr;</a>
    </p>
    <div class="grid">
      ${loadoutEntries.slice(0, 12).map(([id, sec]) => `
        <a href="/#/loadouts" class="grid-item" style="text-decoration:none; color:inherit; display:block;">
          <strong>${escape(sec.name || id)}</strong>
          ${sec.role ? `<span>${escape(sec.role)}</span>` : ''}
          ${sec.summary ? `<div style="font-size: 0.78rem; color: rgba(230,233,239,0.62); margin-top: 4px; line-height: 1.45;">${escape(sec.summary.slice(0, 140))}${sec.summary.length > 140 ? '…' : ''}</div>` : ''}
        </a>
      `).join('')}
    </div>
  ` : ''

  const inner = `
    <div class="game-hero">
      <div class="badge">${escape(displayName)} on Recon 6 · Live</div>
      <h1>${escape(displayName)} <span class="accent">Coaching</span></h1>
      <p class="lead">
        ${maps.length} ${escape(vocab.mapPlural || vocab.map?.toLowerCase() + 's' || 'maps')} ·
        ${cast.length} ${escape(vocab.castPlural?.toLowerCase() || vocab.cast?.toLowerCase() + 's' || 'characters')} ·
        ${stratCount} strategy breakdowns. Live in-app today.
      </p>
      <div class="cta-row">
        <a class="btn btn-primary" href="${SITE_URL}/#/strats">Open ${escape(displayName)} in-app →</a>
        <a class="btn btn-outline" href="${SITE_URL}/#pricing">See pricing</a>
      </div>
      <div class="stat-row">
        <div class="stat"><div class="stat-label">Maps</div><div class="stat-val">${maps.length}</div></div>
        <div class="stat"><div class="stat-label">${escape(vocab.castPlural || (vocab.cast + 's') || 'Cast')}</div><div class="stat-val">${cast.length}</div></div>
        <div class="stat"><div class="stat-label">Strats</div><div class="stat-val">${stratCount}</div></div>
      </div>
    </div>

    <div class="pricing-callout">
      <h3 style="margin-top:0">Why ${escape(displayName)} on Recon 6?</h3>
      <p>Same AI VOD analysis that's live for R6 today — drop a screenshot, get specific feedback referencing the map, your operator/agent/hero, and the actual strats. Recon 6 All-Access ($19/mo Pro, $49/mo Champion) unlocks ${escape(displayName)} the moment it goes live, plus all 19 other supported games.</p>
      <a class="btn btn-primary" href="${SITE_URL}/#pricing">See pricing →</a>
    </div>

    ${mapsListHtml}
    ${castListHtml}
    ${loadoutsHtml}
    ${blogHtml}

    <h2>What you get for ${escape(displayName)}</h2>
    <ul>
      <li><strong>Site-by-site strats</strong> — ${stratCount}+ tactical breakdowns by ${escape((vocab.map || 'Map').toLowerCase())} and ${escape((vocab.site || 'Site').toLowerCase())}, with picks, callouts, and utility</li>
      <li><strong>Loadouts</strong> — weapon priorities, ability combos, and team-comp synergies tuned for ${escape(displayName)}</li>
      <li><strong>Match Prep cheatsheet</strong> — bans, top picks, and callouts on one screen before you ready up</li>
      <li><strong>Cast catalog</strong> — ${cast.length} ${escape((vocab.castPlural || 'characters').toLowerCase())} indexed by role and kit</li>
      <li><strong>Meta board</strong> — top picks + most-banned across the active ${escape(displayName)} meta</li>
      <li><strong>Discord coaching channels</strong> — Recon 6 Discord with ${escape(displayName)}-specific rooms</li>
    </ul>
  `

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: displayName,
    description,
    publisher: { '@type': 'Organization', name: 'Recon 6', url: SITE_URL },
    url: `${SITE_URL}/games/${game.id}/`,
    genre: 'First Person Shooter',
  }

  return htmlShell({
    title: `${displayName} Strategy Guide & AI VOD Analysis | Recon 6`,
    description,
    canonical: `${SITE_URL}/games/${game.id}/`,
    bodyInner: inner,
    jsonLd,
    breadcrumbs: [
      { name: 'Recon 6', url: SITE_URL },
      { name: 'Games', url: `${SITE_URL}/games/` },
      { name: displayName, url: `${SITE_URL}/games/${game.id}/` },
    ],
    themeColor,
    ogImage: `${SITE_URL}/games/og/${game.id}.svg`,
  })
}

function indexPage(games) {
  // 20 games total. Core 11 (R6 → RL) show LIVE with full strats, loadouts,
  // match prep, meta board, and cast catalog. New 9 (LoL → NBA 2K) show
  // EARLY ACCESS with the catalog structure live + strats depth growing.
  // R6 also gets the static /guides/ system + premium tactics + AI VOD review.
  const cards = games.map(g => {
    const meta = g.gameMeta || {}
    const isR6 = g.id === 'r6'
    const isEarly = !!meta.earlyAccess
    const url = isR6 ? `${SITE_URL}/guides/` : `/games/${g.id}/`
    const badgeColor = isEarly ? '#ffc97a' : '#7ee2a4'
    const badgeText = isEarly ? 'EARLY ACCESS' : 'LIVE'
    return `
      <a href="${url}" class="grid-item" style="text-decoration:none; color:inherit; display:block;">
        <strong>${escape(meta.displayName || meta.name || g.id)}</strong>
        <span style="color:${badgeColor}; font-weight:600; font-size:0.78rem;">${badgeText}</span>
      </a>`
  }).join('')

  return htmlShell({
    title: 'All 20 Games Supported by Recon 6 | Coaching Platform',
    description: 'Recon 6 supports 20 of the biggest competitive games — strats, loadouts, match prep, meta board across Rainbow Six Siege, CS2, Valorant, Overwatch 2, Apex Legends, Marvel Rivals, Halo Infinite, The Finals, Call of Duty, Fortnite, Rocket League, League of Legends, Dota 2, EA Sports FC, Tekken 8, Street Fighter 6, PUBG, Deadlock, Naraka: Bladepoint, and NBA 2K.',
    canonical: `${SITE_URL}/games/`,
    bodyInner: `
      <div class="game-hero">
        <h1>20 Games. <span class="accent">One Subscription.</span></h1>
        <p class="lead">Same coaching toolkit — strats, loadouts, match prep, meta board — across 20 of the biggest competitive games. 11 live with deep content today; 9 in early access with the catalog structure live and depth growing.</p>
        <div class="cta-row">
          <a class="btn btn-primary" href="${SITE_URL}/#pricing">All-Access $19/mo</a>
        </div>
      </div>
      <div class="grid">${cards}</div>`,
    breadcrumbs: [
      { name: 'Recon 6', url: SITE_URL },
      { name: 'Games', url: `${SITE_URL}/games/` },
    ],
  })
}

// Per-map SEO page for a specific game. Captures long-tail like
// "CS2 Mirage strategy guide" or "Valorant Bind agent picks". 73 new
// pages across the 9 new games — major SEO surface expansion.
async function generateMapPage(game, data, map) {
  const meta = game.gameMeta || {}
  const themeColor = meta.color || '#00e5ff'
  const displayName = meta.displayName || meta.name || game.id
  const vocabRaw = meta.vocab || {}
  // Resolve a vocab term across naming conventions; never produce
  // "undefineds" — `undefined + 's'` evaluates to that truthy string
  // and breaks fallback chains that use `||`.
  const _term = (...keys) => {
    for (const k of keys) {
      const v = vocabRaw[k]
      if (typeof v === 'string' && v) return v
    }
    return null
  }
  const _castWord = _term('operator', 'cast') || 'Character'
  const _castWordPlural = `${_castWord}${_castWord.endsWith('s') ? '' : 's'}`
  const _mapWord = _term('map') || 'Map'
  const _mapWordPlural = `${_mapWord}${_mapWord.endsWith('s') ? '' : 's'}`
  const _siteWord = _term('site') || 'Site'
  const _siteWordPlural = `${_siteWord}${_siteWord.endsWith('s') ? '' : 's'}`
  const vocab = {
    ...vocabRaw,
    cast: _castWord, castPlural: _castWordPlural,
    map: _mapWord, mapPlural: _mapWordPlural,
    site: _siteWord, sitePlural: _siteWordPlural,
  }
  const stratData = data.STRATS?.[map.id]
  // OW2 Stadium-mode maps need a different page treatment than regular maps:
  // - Their strats are Pro-only (per StratsPage gating)
  // - Their mode has Cash/Power/Item mechanics that drive the value prop
  // - Stadium is hot organic-search territory ("ow2 stadium busan", etc.)
  // So we render a Stadium-specific page variant when map.type === 'Stadium'.
  const isStadium = map.type === 'Stadium'
  // Detect Clash / Control / Push from the map name (already formatted as
  // "Stadium — <City> (<Mode>)" in src/data/games/ow2/maps.js).
  const stadiumModeMatch = isStadium && /\(([^)]+)\)\s*$/.exec(map.name || '')
  const stadiumMode = stadiumModeMatch ? stadiumModeMatch[1] : null

  const sites = Array.isArray(map.sites) ? map.sites : Object.values(map.sites || {})
  const description = isStadium
    ? `${escape(map.name || map.id)} — Overwatch 2 Stadium mode strategy guide. Build paths, Power picks per round, Item shop priorities, hero lineups for ${stadiumMode || 'Stadium'} mode. Pro-feature on Recon 6.`
    : `${escape(map.name || map.id)} on ${escape(displayName)} — strategy guide for every ${escape((vocab.site || 'site').toLowerCase())}. Operator picks, callouts, utility, and AI VOD analysis from Recon 6.`

  // Build site sections from the map's strats — handles attack + defense
  // OR generic side names from vocab (e.g. T-side / CT-side for CS2).
  const sideAttackLabel = vocab.sideAttack || 'Attack'
  const sideDefenseLabel = vocab.sideDefense || 'Defense'
  const sitesHtml = sites.length > 0 ? sites.map(s => {
    const siteStrat = stratData?.[s.id] || {}
    const attackOps = siteStrat.attack?.operators?.map(o => `${o.name} (${o.role || 'pick'})`).slice(0, 5).join(', ') || ''
    const defenseOps = siteStrat.defense?.operators?.map(o => `${o.name} (${o.role || 'pick'})`).slice(0, 5).join(', ') || ''
    return `
    <div class="grid-item" style="grid-column: 1 / -1; padding: 1.25rem;">
      <h3 style="margin:0 0 0.5rem; color: var(--accent);">${escape(s.name || s.id)}${s.floor ? ` <span style="font-size:0.85rem;color:rgba(230,233,239,0.5);font-weight:400">(${escape(s.floor)})</span>` : ''}</h3>
      ${attackOps ? `<div style="margin: 0.5rem 0;"><strong style="color:#ffa67a;font-size:0.85rem;">${escape(sideAttackLabel)} picks:</strong> <span style="color:rgba(230,233,239,0.85);font-size:0.9rem;">${escape(attackOps)}</span></div>` : ''}
      ${defenseOps ? `<div style="margin: 0.5rem 0;"><strong style="color:#7aaaff;font-size:0.85rem;">${escape(sideDefenseLabel)} picks:</strong> <span style="color:rgba(230,233,239,0.85);font-size:0.9rem;">${escape(defenseOps)}</span></div>` : ''}
      ${siteStrat.attack?.callouts?.length ? `<div style="margin: 0.5rem 0; font-size:0.85rem; color:rgba(230,233,239,0.65);"><strong>Callouts:</strong> ${siteStrat.attack.callouts.slice(0, 8).map(escape).join(' · ')}</div>` : ''}
    </div>`
  }).join('') : '<p style="opacity:0.5">Site-by-site strats coming with full launch.</p>'

  // Stadium-mode body: lead with the Pro-feature framing, explain mode
  // mechanics (Cash / Powers / Items), then link directly into the gated
  // strats page for each site. This is the SEO landing → Pro conversion
  // funnel for Stadium-mode organic search.
  const stadiumIntro = isStadium ? `
    <div class="game-hero">
      <div class="badge" style="background:rgba(255,201,122,0.14);border-color:rgba(255,201,122,0.5);color:#ffc97a">${escape(displayName)} · Stadium ${stadiumMode ? '· ' + escape(stadiumMode) : ''} · Pro Feature</div>
      <h1>${escape(map.name || map.id)} <span class="accent" style="color:#ffc97a">Stadium Guide</span></h1>
      <p class="lead">
        Stadium-mode strategy for ${escape(map.name || map.id)} — Cash economy, Power picks per round, Item shop priorities, hero lineups${stadiumMode ? ' for ' + escape(stadiumMode) + ' mode' : ''}. Stadium runs on a BO7 round structure with 4 Power picks (rounds 1, 3, 5, 7) and a per-round Item shop economy that makes build literacy more decisive than aim.
      </p>
      <div class="cta-row">
        <a class="btn btn-primary" href="${SITE_URL}/#/strats/${escape(map.id)}/${escape(sites[0]?.id || 'point')}/attack" style="background:#ffc97a;color:#0a0f19;border-color:#ffc97a">Open ${escape(map.name || map.id)} strats →</a>
        <a class="btn btn-outline" href="${SITE_URL}/#pricing">Founding rate $9/mo (ends May 31)</a>
      </div>
    </div>

    <div class="pricing-callout" style="background:rgba(255,201,122,0.06);border-color:rgba(255,201,122,0.3);margin-top:1rem">
      <h3 style="margin-top:0;color:#ffc97a">What Pro unlocks for this map</h3>
      <ul style="margin:0.5rem 0 0;padding-left:1.2rem;color:rgba(230,233,239,0.9)">
        <li><strong>${sites.length} sites</strong> on ${escape(map.name || map.id)} with attack + defense breakdowns</li>
        <li><strong>Cash priorities per round</strong> — when to bank, when to spend, when to commit Epic Items</li>
        <li><strong>Power-pick reads</strong> — which of your 4 Power picks (R1/R3/R5/R7) wins against dive vs brawl vs comp-counter</li>
        <li><strong>Item shop synergies</strong> — Cooldown Reduction vs Reinforced Shield vs Weapon Power per hero archetype</li>
        <li><strong>Round 7 game-point framework</strong> — full-build commit, ult-economy reads, the engages that close BO7 series</li>
      </ul>
      <p style="margin:0.85rem 0 0;font-size:0.85rem;opacity:0.85">
        Stadium strats are Pro-only because partial build advice misleads — getting the Power pick wrong loses the round. Pro $9/mo founding (locked for life if you join before May 31). 11 Stadium maps · 33 sites · 66 build paths.
      </p>
    </div>
  ` : ''

  const inner = isStadium ? `
    ${stadiumIntro}

    <h2>Sites on ${escape(map.name || map.id)}</h2>
    <p style="color:rgba(230,233,239,0.7);font-size:0.95rem">
      Each Stadium objective plays differently — Clash bank flips reward Brawl comps, Control points reward Dive, Push robot contests reward sustain. Pick your site for the full Pro breakdown.
    </p>
    <div class="grid" style="grid-template-columns: 1fr;">
      ${sites.map(s => `
        <div class="grid-item" style="grid-column: 1 / -1; padding: 1.25rem; border-color:rgba(255,201,122,0.25)">
          <h3 style="margin:0 0 0.5rem;color:#ffc97a">${escape(s.name || s.id)}${s.floor ? ` <span style="font-size:0.85rem;color:rgba(230,233,239,0.5);font-weight:400">(${escape(s.floor)})</span>` : ''}</h3>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.6rem">
            <a class="btn btn-outline" href="${SITE_URL}/#/strats/${escape(map.id)}/${escape(s.id)}/attack" style="border-color:rgba(255,201,122,0.5);color:#ffc97a;font-size:0.85rem;padding:6px 14px">Attack strats →</a>
            <a class="btn btn-outline" href="${SITE_URL}/#/strats/${escape(map.id)}/${escape(s.id)}/defense" style="border-color:rgba(255,201,122,0.5);color:#ffc97a;font-size:0.85rem;padding:6px 14px">Defense strats →</a>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="pricing-callout" style="margin-top:1.5rem">
      <h3 style="margin-top:0">Learn Stadium mode end-to-end</h3>
      <p>Pair the per-map strats with the Stadium fundamentals: builds, Powers, Items, economy.</p>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.85rem">
        <a class="btn btn-outline" href="${SITE_URL}/blog/ow2-stadium-guide.html">Stadium Builds & Powers Guide →</a>
        <a class="btn btn-outline" href="${SITE_URL}/blog/ow2-stadium-tier-list.html">Stadium Hero Tier List →</a>
        <a class="btn btn-outline" href="${SITE_URL}/blog/ow2-stadium-items-guide.html">Stadium Items Guide →</a>
        <a class="btn btn-outline" href="${SITE_URL}/blog/ow2-stadium-economy.html">Stadium Economy Guide →</a>
      </div>
    </div>
  ` : `
    <div class="game-hero">
      <div class="badge">${escape(displayName)} · ${escape(map.name || map.id)}</div>
      <h1>${escape(map.name || map.id)} <span class="accent">Strategy Guide</span></h1>
      <p class="lead">
        Complete tactical breakdown for ${escape(map.name || map.id)} on ${escape(displayName)} — every ${escape((vocab.site || 'site').toLowerCase())}, every ${escape((vocab.cast || 'character').toLowerCase())} pick, callouts, and utility usage. Map-aware AI VOD analysis available with Recon 6.
      </p>
      <div class="cta-row">
        <a class="btn btn-primary" href="${SITE_URL}/#pricing">Lock in All-Access — $19/mo</a>
        <a class="btn btn-outline" href="/games/${game.id}/">More ${escape(displayName)} maps →</a>
      </div>
    </div>

    <h2>${escape(vocab.sitePlural || vocab.site + 's' || 'Sites')} on ${escape(map.name || map.id)}</h2>
    <div class="grid" style="grid-template-columns: 1fr;">
      ${sitesHtml}
    </div>

    <div class="pricing-callout">
      <h3 style="margin-top:0">AI VOD analysis for ${escape(map.name || map.id)}</h3>
      <p>Drop a screenshot from any ${escape(map.name || map.id)} round — the AI reads the HUD, identifies your ${escape((vocab.cast || 'character').toLowerCase())}, and references this map's standard plays to give you specific feedback. Not generic advice. Pro $9/mo (R6 only) or All-Access $19/mo (all 20 games).</p>
      <a class="btn btn-primary" href="${SITE_URL}/#pricing">See plans →</a>
    </div>
  `

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${map.name || map.id} Strategy Guide — ${displayName}`,
    description,
    author: { '@type': 'Organization', name: 'Recon 6' },
    publisher: { '@type': 'Organization', name: 'Recon 6', url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/games/${game.id}/${map.id}.html`,
    inLanguage: 'en-US',
  }

  return htmlShell({
    title: `${map.name || map.id} Strategy Guide — ${displayName} | Recon 6`,
    description,
    canonical: `${SITE_URL}/games/${game.id}/${map.id}.html`,
    bodyInner: inner,
    jsonLd,
    breadcrumbs: [
      { name: 'Recon 6', url: SITE_URL },
      { name: 'Games', url: `${SITE_URL}/games/` },
      { name: displayName, url: `${SITE_URL}/games/${game.id}/` },
      { name: map.name || map.id, url: `${SITE_URL}/games/${game.id}/${map.id}.html` },
    ],
    themeColor,
    // Stadium maps get their own per-map OG image (amber Pro-feature
    // styling) — every other map falls back to the generic per-game OG.
    // The Stadium SVGs are generated by scripts/generate-stadium-og-images.mjs
    // which runs before this generator in the build pipeline.
    ogImage: isStadium
      ? `${SITE_URL}/games/og/${map.id}.svg`
      : `${SITE_URL}/games/og/${game.id}.svg`,
  })
}

const OUT_BASE = join(ROOT, 'public', 'games')
mkdirSync(OUT_BASE, { recursive: true })

let written = 0
let mapPagesWritten = 0
for (const game of GAMES) {
  if (game.id === 'r6') continue
  const html = await generateGamePage(game)
  if (!html) continue
  const dir = join(OUT_BASE, game.id)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html)
  written++

  // Per-map landing pages — load the game data once, write one file per map
  try {
    const data = await game.load()
    const maps = Array.isArray(data.MAPS) ? data.MAPS : Object.values(data.MAPS || {})
    for (const map of maps) {
      if (!map.id) continue
      const mapHtml = await generateMapPage(game, data, map)
      if (mapHtml) {
        writeFileSync(join(dir, `${map.id}.html`), mapHtml)
        mapPagesWritten++
      }
    }
  } catch (err) {
    console.warn(`  Skipped per-map pages for ${game.id}: ${err.message}`)
  }
  console.log(`  ✓ ${game.id} → public/games/${game.id}/index.html`)
}

writeFileSync(join(OUT_BASE, 'index.html'), indexPage(GAMES))
console.log(`✓ Generated ${written} per-game landing pages + ${mapPagesWritten} per-map pages + index in public/games/`)
