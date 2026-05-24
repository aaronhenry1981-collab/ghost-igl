#!/usr/bin/env node
// Per-cast (agent/hero/legend/loadout) SEO landing pages for the 9 non-R6
// games. Mirrors R6's per-operator pattern at /guides/operators/<name>.html
// — captures long-tail queries like "Jett Valorant guide", "D.Va Overwatch
// 2 build", "Wraith Apex Legends tips", etc.
//
// Output: public/games/<game-id>/cast/<slug>.html + a per-game cast index.
// Skips R6 — it has its own /guides/operators/ system.
//
// Local Claude's data per game has CAST as an array of {id, name, role, side?, kit: [...]}.
//
// Run: node scripts/generate-game-cast-pages.mjs

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { GAMES } from '../src/data/games/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SITE_URL = 'https://r6coaching.com'

function escape(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function slugify(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function htmlShell({ title, description, canonical, bodyInner, jsonLd, breadcrumbs, themeColor, ogImage }) {
  const og = ogImage || `${SITE_URL}/og-image.png`
  const ldBlocks = []
  if (jsonLd) ldBlocks.push(jsonLd)
  if (breadcrumbs?.length) {
    ldBlocks.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: b.url })),
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
    .container { max-width: 880px; margin: 0 auto; padding: 1.5rem; }
    .nav { padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 1.5rem; }
    .nav a { color: var(--accent); text-decoration: none; margin-right: 1rem; font-weight: 600; }
    h1 { font-size: 2.1rem; margin: 1.5rem 0 0.25rem; line-height: 1.15; }
    h1 .accent { color: var(--accent); }
    .eyebrow { color: rgba(230,233,239,0.6); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; }
    .lead { font-size: 1.05rem; color: rgba(230,233,239,0.85); margin: 0.75rem 0 1.5rem; }
    h2 { font-size: 1.25rem; margin: 2rem 0 0.75rem; color: var(--accent); }
    .pill { display: inline-block; padding: 3px 10px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; border-radius: 999px; margin-right: 6px; }
    .pill-role { background: rgba(255,155,92,0.12); color: #ff9b5c; border: 1px solid rgba(255,155,92,0.4); }
    .pill-side-attack { background: rgba(255,138,80,0.15); color: #ffa67a; border: 1px solid #ff8a50; }
    .pill-side-defense { background: rgba(80,180,255,0.15); color: #7aaaff; border: 1px solid #5099cc; }
    .stat-row { display: flex; gap: 1.25rem; margin: 1rem 0 1.5rem; flex-wrap: wrap; }
    .stat { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.7rem 1.1rem; min-width: 120px; }
    .stat-label { color: rgba(230,233,239,0.6); font-size: 0.7rem; letter-spacing: 0.05em; text-transform: uppercase; }
    .stat-val { font-size: 1.4rem; font-weight: 700; color: #fff; margin-top: 4px; }
    .kit-list { list-style: none; padding: 0; margin: 0.5rem 0; display: grid; gap: 6px; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
    .kit-list li { padding: 8px 12px; background: rgba(255,255,255,0.03); border-left: 3px solid var(--accent); border-radius: 6px; font-size: 0.9rem; }
    .map-list { list-style: none; padding: 0; margin: 0.5rem 0; }
    .map-list li { padding: 0.6rem 0.85rem; margin-bottom: 4px; background: rgba(255,255,255,0.03); border-left: 3px solid rgba(255,155,92,0.3); border-radius: 6px; font-size: 0.92rem; }
    .map-list a { color: #e6e9ef; text-decoration: none; font-weight: 600; }
    .map-list a:hover { color: var(--accent); }
    .cta { display: inline-block; padding: 0.7rem 1.4rem; background: var(--accent); color: #0a0f19; font-weight: 700; border-radius: 8px; text-decoration: none; margin: 1rem 0; }
    .cta:hover { filter: brightness(1.1); }
    footer { margin-top: 3rem; padding: 1.5rem 0; border-top: 1px solid rgba(255,255,255,0.08); color: rgba(230,233,239,0.5); font-size: 0.85rem; text-align: center; }
    footer a { color: var(--accent); }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav">
      <a href="/">Recon 6</a>
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

// Build a per-game index of which maps each cast member appears in (from STRATS).
function buildCastUsageIndex(strats) {
  const usage = {}
  for (const mapId of Object.keys(strats || {})) {
    for (const siteId of Object.keys(strats[mapId] || {})) {
      for (const side of ['attack', 'defense']) {
        const sideData = strats[mapId][siteId]?.[side]
        if (!sideData) continue
        for (const op of sideData.operators || []) {
          if (!op?.name) continue
          const key = op.name.toLowerCase()
          if (!usage[key]) usage[key] = { name: op.name, sites: [] }
          usage[key].sites.push({ mapId, siteId, side, role: op.role, priority: op.priority })
        }
      }
    }
  }
  return usage
}

// Resolve vocab keys with fallback to handle both old (cast/sideAttack) and
// new (operator/side_attack) naming conventions across game gameMeta files.
function vocabOf(meta) {
  const v = meta?.vocab || {}
  return {
    cast: v.operator || v.cast || 'Operator',
    castPlural: v.operatorPlural || v.castPlural || ((v.operator || v.cast || 'Operator') + 's'),
    map: v.map || 'Map',
    mapPlural: v.mapPlural || ((v.map || 'Map') + 's'),
    site: v.site || 'Site',
    sitePlural: v.sitePlural || ((v.site || 'Site') + 's'),
    sideAttack: v.side_attack || v.sideAttack || 'Attack',
    sideDefense: v.side_defense || v.sideDefense || 'Defense',
  }
}

function castPage(game, data, member, usage) {
  const meta = game.gameMeta || {}
  const themeColor = meta.color || '#00e5ff'
  const displayName = meta.displayName || meta.name || game.id
  const V = vocabOf(meta)
  const slug = slugify(member.id || member.name)
  const usageEntry = usage[member.name.toLowerCase()] || { sites: [] }
  const sites = usageEntry.sites
  const description = `${escape(member.name)} ${V.cast.toLowerCase()} guide for ${displayName}. ${member.role ? `Role: ${escape(member.role)}.` : ''} ${sites.length > 0 ? `Picked on ${sites.length} site${sites.length === 1 ? '' : 's'}.` : ''} Recon 6 tactical reference.`

  // Group usage by map
  const byMap = {}
  for (const s of sites) {
    if (!byMap[s.mapId]) byMap[s.mapId] = []
    byMap[s.mapId].push(s)
  }

  const mapsHtml = Object.keys(byMap).length === 0 ? `
    <p style="color: rgba(230,233,239,0.55); font-style: italic;">No site picks logged yet — full strat coverage rolling out.</p>
  ` : `<ul class="map-list">${Object.entries(byMap).map(([mapId, picks]) => {
    const sidesText = picks.map(p => {
      const sideLabel = p.side === 'attack' ? V.sideAttack : V.sideDefense
      const priorityPill = p.priority ? ` <span style="opacity:0.6">${escape(p.priority)}</span>` : ''
      return `<span style="color:${p.side === 'attack' ? '#ffa67a' : '#7aaaff'}">${escape(sideLabel)}</span>${priorityPill}`
    }).join(' · ')
    return `<li>
      <a href="/games/${game.id}/${mapId}.html">${escape(mapId)}</a>
      <span style="color:rgba(230,233,239,0.55); font-size:0.85rem; margin-left:8px">— ${sidesText}</span>
    </li>`
  }).join('')}</ul>`

  const inner = `
    <div class="eyebrow">${escape(displayName)} · ${escape(V.cast)} Guide</div>
    <h1>${escape(member.name)} <span class="accent">— ${escape(displayName)}</span></h1>
    <div style="margin: 0.5rem 0;">
      ${member.role ? `<span class="pill pill-role">${escape(member.role)}</span>` : ''}
      ${member.side === 'attack' ? `<span class="pill pill-side-attack">${escape(V.sideAttack)}</span>` : ''}
      ${member.side === 'defense' ? `<span class="pill pill-side-defense">${escape(V.sideDefense)}</span>` : ''}
    </div>
    <p class="lead">${escape(member.name)} ${member.role ? `is a ${member.role.toLowerCase()} ${V.cast.toLowerCase()} ` : ''}in ${escape(displayName)}. Recon 6 tracks where ${escape(member.name)} is picked across the ${V.mapPlural || V.map.toLowerCase() + 's'} we cover, with role priority and site-by-site usage.</p>

    <div class="stat-row">
      <div class="stat"><div class="stat-label">Sites picked on</div><div class="stat-val">${sites.length}</div></div>
      ${member.role ? `<div class="stat"><div class="stat-label">Role</div><div class="stat-val" style="font-size:1.05rem">${escape(member.role)}</div></div>` : ''}
      <div class="stat"><div class="stat-label">${escape(V.cast)}s in ${escape(displayName)}</div><div class="stat-val">${(Array.isArray(data.CAST) ? data.CAST.length : Object.keys(data.CAST || {}).length)}</div></div>
    </div>

    <a class="cta" href="${SITE_URL}/#pricing">Get Recon 6 — ${escape(displayName)} unlocked with All-Access</a>

    ${member.kit?.length ? `
    <h2>${escape(member.name)} kit / loadout</h2>
    <ul class="kit-list">
      ${member.kit.map(k => `<li>${escape(k)}</li>`).join('')}
    </ul>` : ''}

    <h2>Where ${escape(member.name)} is picked</h2>
    ${mapsHtml}

    <div style="margin-top: 32px; padding: 20px 24px; background: linear-gradient(135deg, rgba(0,229,255,0.06), rgba(180,140,255,0.06)); border: 1px solid rgba(0,229,255,0.25); border-radius: 12px;">
      <h3 style="margin-top:0">More ${escape(displayName)} guides</h3>
      <p style="margin: 0 0 12px;">Recon 6 covers every ${V.cast.toLowerCase()} and ${V.map.toLowerCase()} in ${escape(displayName)}. Browse the full catalog:</p>
      <a href="/games/${game.id}/" class="cta">All ${escape(displayName)} guides →</a>
    </div>
  `

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${member.name} — ${displayName} ${V.cast} Guide`,
    description,
    author: { '@type': 'Organization', name: 'Recon 6' },
    publisher: { '@type': 'Organization', name: 'Recon 6', url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/games/${game.id}/cast/${slug}.html`,
  }

  return {
    slug,
    html: htmlShell({
      title: `${member.name} ${displayName} Guide — ${V.cast} Picks & Sites | Recon 6`,
      description,
      canonical: `${SITE_URL}/games/${game.id}/cast/${slug}.html`,
      bodyInner: inner,
      jsonLd,
      breadcrumbs: [
        { name: 'Recon 6', url: SITE_URL },
        { name: 'Games', url: `${SITE_URL}/games/` },
        { name: displayName, url: `${SITE_URL}/games/${game.id}/` },
        { name: `${V.castPlural}`, url: `${SITE_URL}/games/${game.id}/cast/` },
        { name: member.name, url: `${SITE_URL}/games/${game.id}/cast/${slug}.html` },
      ],
      themeColor,
      ogImage: `${SITE_URL}/games/og/${game.id}.svg`,
    }),
  }
}

function castIndexPage(game, data, members) {
  const meta = game.gameMeta || {}
  const themeColor = meta.color || '#00e5ff'
  const displayName = meta.displayName || meta.name || game.id
  const V = vocabOf(meta)

  const itemsHtml = members.map(m => {
    const slug = slugify(m.id || m.name)
    return `<li><a href="/games/${game.id}/cast/${slug}.html">${escape(m.name)}</a>${m.role ? ` <span style="color:rgba(230,233,239,0.55);font-size:0.85rem;margin-left:6px">${escape(m.role)}</span>` : ''}</li>`
  }).join('\n')

  const inner = `
    <div class="eyebrow">${escape(displayName)}</div>
    <h1>${escape(displayName)} <span class="accent">${escape(V.castPlural)}</span></h1>
    <p class="lead">All ${members.length} ${escape((V.castPlural).toLowerCase())} in ${escape(displayName)} that Recon 6 tracks. Click any to see role, kit, and site-by-site usage.</p>
    <ul class="map-list" style="columns: 2; column-gap: 1.5rem;">${itemsHtml}</ul>
    <a class="cta" href="${SITE_URL}/#pricing">Recon 6 All-Access — $19/mo</a>
  `
  return htmlShell({
    title: `${displayName} ${V.castPlural} — Full Guide Catalog | Recon 6`,
    description: `All ${members.length} ${(V.castPlural).toLowerCase()} in ${displayName}. Role, kit, and site-by-site usage data from Recon 6.`,
    canonical: `${SITE_URL}/games/${game.id}/cast/`,
    bodyInner: inner,
    breadcrumbs: [
      { name: 'Recon 6', url: SITE_URL },
      { name: 'Games', url: `${SITE_URL}/games/` },
      { name: displayName, url: `${SITE_URL}/games/${game.id}/` },
      { name: V.castPlural, url: `${SITE_URL}/games/${game.id}/cast/` },
    ],
    themeColor,
    ogImage: `${SITE_URL}/games/og/${game.id}.svg`,
  })
}

const OUT_BASE = join(ROOT, 'public', 'games')
mkdirSync(OUT_BASE, { recursive: true })

let total = 0
const slugMap = {}  // gameId → list of slugs (for sitemap)

for (const game of GAMES) {
  if (game.id === 'r6') continue
  let data
  try { data = await game.load() }
  catch (err) { console.warn(`Skipping ${game.id}: ${err.message}`); continue }

  const cast = Array.isArray(data.CAST) ? data.CAST : Object.values(data.CAST || {})
  if (cast.length === 0) continue

  const usage = buildCastUsageIndex(data.STRATS)
  const dir = join(OUT_BASE, game.id, 'cast')
  mkdirSync(dir, { recursive: true })

  const slugs = []
  for (const member of cast) {
    if (!member?.name) continue
    const { slug, html } = castPage(game, data, member, usage)
    writeFileSync(join(dir, `${slug}.html`), html)
    slugs.push(slug)
    total++
  }

  writeFileSync(join(dir, 'index.html'), castIndexPage(game, data, cast))
  slugMap[game.id] = slugs
  console.log(`  ✓ ${game.id} → ${slugs.length} cast pages + index`)
}

writeFileSync(join(OUT_BASE, '.cast-slugs.json'), JSON.stringify(slugMap, null, 2))
console.log(`✓ Generated ${total} per-cast pages across ${Object.keys(slugMap).length} games`)
