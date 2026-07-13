#!/usr/bin/env node
// Generates per-game per-map loadout SEO pages at
// public/games/<gameId>/<mapId>-loadouts.html.
//
// Each page combines the game's LOADOUTS data with map-specific picks
// pulled from STRATS so a search for "Mirage CS2 loadouts" lands on a
// page that's actually about Mirage — not just generic CS2.
//
// Adds ~73 new long-tail SEO URLs across 9 non-R6 games (R6 keeps its
// existing /guides/<map>.html surface).

import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { GAMES } from '../src/data/games/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SITE_URL = 'https://r6coaching.com'

function escape(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function pickSide(siteData, key) {
  return siteData[key]
    || siteData[key === 'attack' ? 'sideAttack' : 'sideDefense']
    || siteData[key === 'attack' ? 't' : 'ct']
    || null
}

function htmlShell({ title, description, canonical, bodyInner, jsonLd, breadcrumbs, themeColor, ogImage }) {
  const og = ogImage || `${SITE_URL}/og-image.png`
  const ldBlocks = [jsonLd, breadcrumbs?.length ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: b.url })),
  } : null].filter(Boolean)

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
  <meta name="theme-color" content="${themeColor || '#0a0f19'}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escape(title)}" />
  <meta property="og:description" content="${escape(description)}" />
  <meta property="og:url" content="${escape(canonical)}" />
  <meta property="og:image" content="${og}" />
  <meta property="og:site_name" content="Recon 6" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${og}" />
  ${ldBlocks.map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join('\n  ')}
  <style>
    :root { color-scheme: dark; --accent: ${themeColor || '#00e5ff'}; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #0a0f19; color: #e6e9ef; line-height: 1.6; }
    .container { max-width: 980px; margin: 0 auto; padding: 1.5rem; }
    .nav { padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 1.5rem; }
    .nav a { color: var(--accent); text-decoration: none; margin-right: 1rem; font-weight: 600; font-size: 0.9rem; }
    .hero { padding: 1.5rem 0 2rem; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 1.75rem; }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 999px; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); margin-bottom: 1rem; font-weight: 700; }
    h1 { font-size: 2.2rem; margin: 0 0 0.5rem; line-height: 1.15; }
    h1 .accent { color: var(--accent); }
    .lead { font-size: 1.05rem; color: rgba(230,233,239,0.85); max-width: 720px; margin: 0; line-height: 1.55; }
    h2 { font-size: 1.25rem; margin: 2rem 0 0.85rem; color: var(--accent); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; }
    .card { padding: 0.85rem 1rem; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-left: 3px solid var(--accent); border-radius: 8px; }
    .card strong { display: block; margin-bottom: 4px; color: #fff; }
    .card .role { font-size: 0.75rem; color: rgba(230,233,239,0.6); }
    .pill-row { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.5rem 0; }
    .pill { padding: 3px 10px; background: rgba(0,229,255,0.06); border: 1px solid rgba(0,229,255,0.25); color: #66f2ff; border-radius: 999px; font-size: 0.78rem; }
    .site-block { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 0.85rem; }
    .site-block h3 { margin: 0 0 0.5rem; font-size: 1.05rem; color: var(--accent); }
    .site-block p { margin: 0 0 0.5rem; font-size: 0.9rem; line-height: 1.5; color: rgba(230,233,239,0.8); }
    .site-block ul { margin: 0.4rem 0 0; padding-left: 1.1rem; font-size: 0.85rem; color: rgba(230,233,239,0.85); }
    .cta-block { padding: 1.25rem 1.5rem; background: linear-gradient(135deg, rgba(0,229,255,0.06), rgba(180,140,255,0.06)); border: 1px solid var(--accent); border-radius: 14px; margin: 2rem 0; }
    .cta { display: inline-block; padding: 0.65rem 1.3rem; background: var(--accent); color: #0a0f19; font-weight: 700; border-radius: 8px; text-decoration: none; }
    .cta-row { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.85rem; }
    .btn-outline { display: inline-block; padding: 0.65rem 1.3rem; background: transparent; color: var(--accent); border: 1px solid var(--accent); border-radius: 8px; font-weight: 700; text-decoration: none; }
    footer { margin-top: 3rem; padding: 1.5rem 0; border-top: 1px solid rgba(255,255,255,0.08); color: rgba(230,233,239,0.5); font-size: 0.85rem; text-align: center; }
    footer a { color: var(--accent); }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav">
      <a href="/">Recon 6</a>
      <a href="/games/">All Games</a>
      <a href="/blog/">Blog</a>
      <a href="/#pricing">Pricing</a>
    </div>
    ${bodyInner}
    <footer>
      <p>Recon 6 &mdash; coaching across 20 competitive games.<br>
      Game names + characters are property of their respective owners. Fan-made, not affiliated.</p>
    </footer>
  </div>
</body>
</html>`
}

function rollUpPicksForMap(stratsForMap) {
  const counts = { attack: new Map(), defense: new Map() }
  const weight = { essential: 3, recommended: 2, flex: 1 }
  for (const siteId of Object.keys(stratsForMap || {})) {
    for (const sideKey of ['attack', 'defense']) {
      const side = pickSide(stratsForMap[siteId], sideKey)
      if (!side) continue
      for (const op of side.operators || []) {
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
    attack: [...counts.attack.values()].sort((a, b) => b.score - a.score).slice(0, 6),
    defense: [...counts.defense.values()].sort((a, b) => b.score - a.score).slice(0, 6),
  }
}

function findCharacterLoadout(loadouts, characterName) {
  // Loadouts can either be keyed by character or grouped by role with
  // operators[] / agent_priorities. Search both shapes for a match.
  const target = String(characterName).toLowerCase()
  for (const [sectionId, section] of Object.entries(loadouts)) {
    if (!section || typeof section !== 'object') continue
    if (Array.isArray(section.operators)) {
      const op = section.operators.find((o) => o.name?.toLowerCase() === target)
      if (op) return { sectionId, sectionName: section.name || sectionId, ...op }
    }
    if (section.agent_priorities && typeof section.agent_priorities === 'object') {
      for (const [k, v] of Object.entries(section.agent_priorities)) {
        if (k.toLowerCase() === target) return { sectionId, sectionName: section.name || sectionId, name: k, priority_chain: v }
      }
    }
  }
  return null
}

async function generateMapLoadoutPage(game, map, data) {
  const meta = game.gameMeta || {}
  const themeColor = meta.color || '#00e5ff'
  const displayName = meta.displayName || meta.name || game.id
  const vocab = meta.vocab || {}
  const sideAttack = vocab.side_attack || vocab.sideAttack || 'Attack'
  const sideDefense = vocab.side_defense || vocab.sideDefense || 'Defense'
  const castWord = vocab.operator || vocab.cast || 'Character'
  const mapName = map.name || map.id

  const stratsForMap = data.STRATS?.[map.id]
  if (!stratsForMap) return null

  const picks = rollUpPicksForMap(stratsForMap)
  const sites = Array.isArray(map.sites) ? map.sites : Object.values(map.sites || {})
  const loadouts = data.LOADOUTS || {}

  const description = `${mapName} loadouts for ${displayName} — top picks per side, weapon priorities, ability combos, and site-by-site setup notes. Updated for the current ${displayName} meta.`

  // Match each top pick against the loadouts data so we can describe
  // their loadout context inline.
  const inlineLoadout = (op) => {
    const ld = findCharacterLoadout(loadouts, op.name)
    if (!ld) return ''
    if (ld.priority_chain) return `<br><span style="font-size: 0.8rem; color: rgba(230,233,239,0.6);">Priority: ${escape(ld.priority_chain)}</span>`
    if (ld.primary) return `<br><span style="font-size: 0.8rem; color: rgba(230,233,239,0.6);">Primary: ${escape(ld.primary)}</span>`
    return ''
  }

  const inner = `
    <div class="hero">
      <div class="badge">${escape(displayName)} &middot; ${escape(mapName)} Loadouts</div>
      <h1>${escape(mapName)} <span class="accent">Loadouts</span> &mdash; ${escape(displayName)}</h1>
      <p class="lead">
        The ${escape(castWord.toLowerCase())} picks, weapon configs, and ability combos that win rounds on ${escape(mapName)} in ${escape(displayName)}.
        Site-by-site breakdowns + the loadouts that actually pair with them.
      </p>
      <div class="cta-row">
        <a class="cta" href="/games/${game.id}/${map.id}.html">Full ${escape(mapName)} strats &rarr;</a>
        <a class="btn-outline" href="/games/${game.id}/loadouts.html">All ${escape(displayName)} loadouts &rarr;</a>
      </div>
    </div>

    <h2>Top ${escape(sideAttack)} Picks on ${escape(mapName)}</h2>
    <div class="grid">
      ${picks.attack.map((op) => `
        <div class="card">
          <strong>${escape(op.name)}</strong>
          <span class="role">${escape(op.role || 'pick')} &middot; ${op.sites} ${op.sites === 1 ? 'site' : 'sites'}</span>
          ${inlineLoadout(op)}
        </div>
      `).join('') || '<p>No picks indexed yet.</p>'}
    </div>

    <h2>Top ${escape(sideDefense)} Picks on ${escape(mapName)}</h2>
    <div class="grid">
      ${picks.defense.map((op) => `
        <div class="card">
          <strong>${escape(op.name)}</strong>
          <span class="role">${escape(op.role || 'pick')} &middot; ${op.sites} ${op.sites === 1 ? 'site' : 'sites'}</span>
          ${inlineLoadout(op)}
        </div>
      `).join('') || '<p>No picks indexed yet.</p>'}
    </div>

    <h2>Site-By-Site Notes</h2>
    ${sites.map((site) => {
      const s = stratsForMap[site.id]
      if (!s) return ''
      const atk = pickSide(s, 'attack')
      const def = pickSide(s, 'defense')
      const callouts = (atk?.callouts || def?.callouts || []).slice(0, 8)
      return `
        <div class="site-block">
          <h3>${escape(site.name || site.id)}${site.floor ? ` <span style="font-size: 0.8rem; color: rgba(230,233,239,0.5);">${escape(site.floor)}</span>` : ''}</h3>
          ${atk ? `<p><strong style="color: #ffa67a;">${escape(sideAttack)}:</strong> ${escape(atk.strategy || '')}</p>` : ''}
          ${def ? `<p><strong style="color: #7aaaff;">${escape(sideDefense)}:</strong> ${escape(def.strategy || '')}</p>` : ''}
          ${callouts.length > 0 ? `<div class="pill-row">${callouts.map((c) => `<span class="pill">${escape(c)}</span>`).join('')}</div>` : ''}
        </div>
      `
    }).join('')}

    <div class="cta-block">
      <h2 style="margin: 0 0 0.5rem; border: none;">Want These Tuned to Your Rank?</h2>
      <p style="margin: 0 0 0.85rem; color: rgba(230,233,239,0.85);">
        Recon 6 Pro reviews your screenshots and tells you which picks + loadout pieces are actually missing
        from your last 5 matches on ${escape(mapName)}. Not generic meta &mdash; specific fixes.
      </p>
      <div class="cta-row">
        <a class="cta" href="/#pricing">See pricing &rarr;</a>
        <a class="btn-outline" href="/match-prep">Match prep cheatsheet</a>
      </div>
    </div>
  `

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${mapName} Loadouts — ${displayName}`,
    description,
    author: { '@type': 'Organization', name: 'Recon 6' },
    publisher: { '@type': 'Organization', name: 'Recon 6', url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/games/${game.id}/${map.id}-loadouts.html`,
    inLanguage: 'en-US',
  }

  return htmlShell({
    title: `${mapName} Loadouts — ${displayName} | Recon 6`,
    description,
    canonical: `${SITE_URL}/games/${game.id}/${map.id}-loadouts.html`,
    bodyInner: inner,
    jsonLd,
    breadcrumbs: [
      { name: 'Recon 6', url: SITE_URL },
      { name: 'Games', url: `${SITE_URL}/games/` },
      { name: displayName, url: `${SITE_URL}/games/${game.id}/` },
      { name: `${mapName} Loadouts`, url: `${SITE_URL}/games/${game.id}/${map.id}-loadouts.html` },
    ],
    themeColor,
    ogImage: existsSync(join(ROOT, 'public', 'games', 'og', `${game.id}.svg`))
      ? `${SITE_URL}/games/og/${game.id}.svg`
      : undefined,
  })
}

async function main() {
  let written = 0
  for (const game of GAMES) {
    if (game.id === 'r6') continue // R6 has /guides/ system
    let data
    try {
      data = await game.load()
    } catch (err) {
      console.warn(`Skipping ${game.id}: ${err.message}`)
      continue
    }
    const maps = Array.isArray(data.MAPS) ? data.MAPS : Object.values(data.MAPS || {})
    const dir = join(ROOT, 'public', 'games', game.id)
    mkdirSync(dir, { recursive: true })
    let perGame = 0
    for (const map of maps) {
      if (!map.id) continue
      const html = await generateMapLoadoutPage(game, map, data)
      if (!html) continue
      writeFileSync(join(dir, `${map.id}-loadouts.html`), html)
      perGame++
      written++
    }
    console.log(`  ✓ ${game.id} → ${perGame} per-map loadout pages`)
  }
  console.log(`✓ Generated ${written} per-map loadout pages`)
}

main()
