#!/usr/bin/env node
// Generates static SEO pages for each game's loadouts at
// public/games/<gameId>/loadouts.html.
//
// Captures high-volume search queries: "CS2 loadouts", "best Valorant agent
// loadouts", "Apex weapon tier list", "OW2 hero comps", "R6 operator
// loadouts". Each page is fully indexable — no JS required to read the
// content — and cross-links to the in-app interactive view at /loadouts.

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

function titleCase(s) {
  return String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

// Render any nested LOADOUTS value into clean HTML — strings → paragraph,
// arrays of strings → list, arrays of objects → mini-table, nested objects
// → grouped sub-section. Same logic as the React LoadoutsPage but as raw
// HTML so the page is indexable without running JS.
function renderValue(value, depth = 0) {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number') {
    return `<p>${escape(value)}</p>`
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return ''
    if (typeof value[0] === 'string') {
      return `<ul>${value.map((s) => `<li>${escape(s)}</li>`).join('')}</ul>`
    }
    if (isPlainObject(value[0])) {
      return `<div class="rows">${value.map((row) => `<div class="row">${
        Object.entries(row).map(([k, v]) => `<div class="row-field"><span class="row-key">${escape(titleCase(k))}</span><span class="row-val">${escape(Array.isArray(v) ? v.join(', ') : String(v))}</span></div>`).join('')
      }</div>`).join('')}</div>`
    }
  }
  if (isPlainObject(value)) {
    return `<div class="subgroup">${Object.entries(value).map(([k, v]) => `
      <div class="subentry">
        <h${Math.min(5, depth + 4)} class="subkey">${escape(titleCase(k))}</h${Math.min(5, depth + 4)}>
        ${renderValue(v, depth + 1)}
      </div>`).join('')}</div>`
  }
  return ''
}

function renderSection(id, sec) {
  const { name, role, summary, ...rest } = sec
  return `
    <article class="section" id="${escape(id)}">
      <header>
        <h2>${escape(name || titleCase(id))}</h2>
        ${role ? `<span class="section-role">${escape(role)}</span>` : ''}
      </header>
      ${summary ? `<p class="section-summary">${escape(summary)}</p>` : ''}
      <div class="section-body">
        ${Object.entries(rest).map(([k, v]) => `
          <div class="block">
            <h3 class="block-title">${escape(titleCase(k))}</h3>
            ${renderValue(v)}
          </div>
        `).join('')}
      </div>
    </article>
  `
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
  ${ldBlocks.map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join('\n  ')}
  <style>
    :root { color-scheme: dark; --accent: ${themeColor || '#00e5ff'}; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #0a0f19; color: #e6e9ef; line-height: 1.6; }
    .container { max-width: 980px; margin: 0 auto; padding: 1.5rem; }
    .nav { padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 1.5rem; }
    .nav a { color: var(--accent); text-decoration: none; margin-right: 1rem; font-weight: 600; font-size: 0.9rem; }
    .hero { padding: 1.75rem 0; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 1.75rem; }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 999px; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); margin-bottom: 1rem; font-weight: 700; }
    h1 { font-size: 2.4rem; margin: 0 0 0.5rem; line-height: 1.15; }
    h1 .accent { color: var(--accent); }
    .lead { font-size: 1.1rem; color: rgba(230,233,239,0.85); max-width: 720px; margin: 0; line-height: 1.55; }
    .section { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 1.5rem 1.75rem; margin: 1.5rem 0; }
    .section header { border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.85rem; margin-bottom: 1rem; }
    .section h2 { margin: 0 0 4px; font-size: 1.5rem; color: #fff; }
    .section-role { font-size: 0.78rem; color: rgba(230,233,239,0.6); letter-spacing: 0.04em; text-transform: uppercase; font-weight: 600; }
    .section-summary { margin: 0 0 1rem; color: rgba(230,233,239,0.85); line-height: 1.55; font-size: 0.95rem; }
    .block { background: rgba(0,0,0,0.18); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 0.95rem 1.1rem; margin: 0.75rem 0; }
    .block-title { margin: 0 0 0.6rem; font-size: 0.78rem; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(230,233,239,0.55); font-weight: 700; }
    .block p, .subentry p { margin: 0 0 0.4rem; color: rgba(230,233,239,0.88); line-height: 1.55; font-size: 0.92rem; }
    .block ul, .subentry ul { margin: 0; padding-left: 1.1rem; color: rgba(230,233,239,0.85); font-size: 0.9rem; line-height: 1.55; }
    .block li, .subentry li { padding: 2px 0; }
    .rows { display: flex; flex-direction: column; gap: 0.5rem; }
    .row { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.5rem; padding: 0.6rem 0.85rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; }
    .row-field { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .row-key { font-size: 0.66rem; color: rgba(230,233,239,0.5); letter-spacing: 0.05em; text-transform: uppercase; font-weight: 700; }
    .row-val { font-size: 0.88rem; color: #fff; word-break: break-word; }
    .subgroup { display: grid; gap: 0.85rem; }
    .subentry { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 0.7rem 0.95rem; }
    .subkey { margin: 0 0 0.45rem; font-size: 0.85rem; color: #fff; font-weight: 700; }
    .cta { display: inline-block; padding: 0.7rem 1.4rem; background: var(--accent); color: #0a0f19; font-weight: 700; border-radius: 8px; text-decoration: none; margin: 0.5rem 0; }
    .cta-row { display: flex; gap: 0.6rem; flex-wrap: wrap; margin: 1.25rem 0; }
    .btn-outline { display: inline-block; padding: 0.7rem 1.4rem; background: transparent; color: var(--accent); border: 1px solid var(--accent); border-radius: 8px; font-weight: 700; text-decoration: none; }
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
      <a href="/blog/">Blog</a>
      <a href="/#pricing">Pricing</a>
    </div>
    ${bodyInner}
    <footer>
      <p>Recon 6 &mdash; coaching across 20 competitive games.<br>
      Game names + characters are property of their respective owners. Fan-made, not affiliated.</p>
      <p><a href="${SITE_URL}/#pricing">See plans &rarr;</a></p>
    </footer>
  </div>
</body>
</html>`
}

async function generateLoadoutsPage(game) {
  let data
  try {
    data = await game.load()
  } catch (err) {
    // R6 fails because operators.js imports './maps' without .js extension
    // (Vite handles, Node doesn't). Sidestep by loading loadouts directly —
    // R6 is the most-searched game, we can't skip it.
    if (game.id === 'r6') {
      try {
        const r6Loadouts = await import('../src/data/games/r6/loadouts.js')
        const r6Meta = await import('../src/data/games/r6/meta.js')
        data = { LOADOUTS: r6Loadouts.default, gameMeta: r6Meta.gameMeta }
      } catch (e) {
        console.warn(`Skipping ${game.id}: ${err.message} (fallback failed: ${e.message})`)
        return null
      }
    } else {
      console.warn(`Skipping ${game.id}: ${err.message}`)
      return null
    }
  }
  const meta = game.gameMeta || data.gameMeta || {}
  const themeColor = meta.color || '#00e5ff'
  const displayName = meta.displayName || meta.name || game.id
  const loadouts = data.LOADOUTS || {}
  const entries = Object.entries(loadouts)
  if (entries.length === 0) {
    console.warn(`No LOADOUTS for ${game.id}, skipping`)
    return null
  }

  const description = `${displayName} loadouts — what to pick and why. Real loadouts, weapon priorities, ability combos, and team-comp synergies. Updated for the current ${displayName} meta.`

  const tocHtml = entries.length > 3 ? `
    <nav class="toc" aria-label="On this page" style="background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.85rem 1.1rem; margin: 0 0 1.5rem;">
      <strong style="font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(230,233,239,0.6); display: block; margin-bottom: 0.5rem;">Sections</strong>
      <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 0.5rem;">
        ${entries.map(([id, sec]) => `<li><a href="#${escape(id)}" style="color: var(--accent); text-decoration: none; padding: 4px 10px; background: rgba(0,229,255,0.06); border: 1px solid rgba(0,229,255,0.25); border-radius: 999px; font-size: 0.8rem;">${escape(sec.name || titleCase(id))}</a></li>`).join('')}
      </ul>
    </nav>
  ` : ''

  const inner = `
    <div class="hero">
      <div class="badge">${escape(displayName)} &middot; Loadouts</div>
      <h1>What to <span class="accent">Pick</span> &mdash; And Why</h1>
      <p class="lead">
        Real ${escape(displayName)} loadouts, weapon priorities, ability combos, and team-comp synergies.
        Use these before the round starts so you walk in with the right gun, the right ability, and the right plan.
      </p>
      <div class="cta-row">
        <a class="cta" href="/loadouts">Open interactive loadouts &rarr;</a>
        <a class="btn-outline" href="/games/${game.id}/">Back to ${escape(displayName)} &larr;</a>
      </div>
    </div>

    ${tocHtml}

    ${entries.map(([id, sec]) => renderSection(id, sec)).join('')}

    <div class="section" style="background: linear-gradient(135deg, rgba(0,229,255,0.06), rgba(180,140,255,0.06)); border-color: var(--accent);">
      <h2 style="margin: 0 0 0.5rem; border: none;">Want These Tuned to Your Rank + Role?</h2>
      <p style="margin: 0 0 1rem; color: rgba(230,233,239,0.85);">
        Recon 6 Pro reviews your screenshots and tells you which loadout pieces you're actually missing &mdash; based on your last 5 matches, not generic meta. $9/mo founding (locked for life if you join before May 31).
      </p>
      <div class="cta-row">
        <a class="cta" href="/#pricing">See pricing</a>
        <a class="btn-outline" href="/match-prep">Match prep cheatsheet</a>
      </div>
    </div>
  `

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${displayName} Loadouts — Weapon, Ability & Team-Comp Guide`,
    description,
    author: { '@type': 'Organization', name: 'Recon 6' },
    publisher: { '@type': 'Organization', name: 'Recon 6', url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/games/${game.id}/loadouts.html`,
    inLanguage: 'en-US',
  }

  return htmlShell({
    title: `${displayName} Loadouts — Weapon, Ability & Comp Guide | Recon 6`,
    description,
    canonical: `${SITE_URL}/games/${game.id}/loadouts.html`,
    bodyInner: inner,
    jsonLd,
    breadcrumbs: [
      { name: 'Recon 6', url: SITE_URL },
      { name: 'Games', url: `${SITE_URL}/games/` },
      { name: displayName, url: `${SITE_URL}/games/${game.id}/` },
      { name: 'Loadouts', url: `${SITE_URL}/games/${game.id}/loadouts.html` },
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
    const html = await generateLoadoutsPage(game)
    if (!html) continue
    const dir = join(ROOT, 'public', 'games', game.id)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'loadouts.html'), html)
    written++
    console.log(`  ✓ ${game.id} → public/games/${game.id}/loadouts.html`)
  }
  console.log(`✓ Generated ${written} game loadouts pages`)
}

main()
