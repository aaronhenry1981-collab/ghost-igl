#!/usr/bin/env node
// The operator hub (/guides/operators/) and a "where to play" page for each
// operator in the strat library that has no deep dive on the blog.
// An operator with a deep dive (scripts/generate-r6-operator-posts.mjs) has
// one page, the deep dive: its site list carries everything the "where to
// play" page listed, so that page was folded in on 2026-10-06 and the
// CloudFront router (aws/cloudfront-site-router.js) 301s it to the deep dive.
//
// Output: public/guides/operators/index.html + <slug>.html for the rest.
// Run: node scripts/generate-operator-guides.mjs

import { existsSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import MAPS from '../src/data/maps.js'
import STRATS from '../src/data/public-strats.generated.js'
import {
  ARTICLE_CSS, SITE_URL, TEMPLATE_REVISED, articleSchema, bylineHtml, figureHtml, firstPublished,
  fitDescription, fitTitle, footerHtml, navHtml, officialLinksSentence, operatorRefs,
} from './lib/article-seo.mjs'

const listOf = (items) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`)

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'guides', 'operators')

// The operator's deep-dive blog post (scripts/generate-r6-operator-posts.mjs), when one exists.
function deepDivePath(name) {
  const slug = `r6-operator-${operatorSlug(name)}`
  return existsSync(join(ROOT, 'public', 'blog', `${slug}.html`)) ? `/blog/${slug}.html` : null
}

function escape(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Build operator → sites index from STRATS + MAPS.
function buildOperatorIndex() {
  const index = {}
  for (const mapId of Object.keys(STRATS)) {
    const map = MAPS.find(m => m.id === mapId)
    if (!map) continue
    for (const siteId of Object.keys(STRATS[mapId])) {
      const site = map.sites.find(s => s.id === siteId)
      if (!site) continue
      for (const side of ['attack', 'defense']) {
        const strat = STRATS[mapId][siteId]?.[side]
        if (!strat) continue
        for (const op of strat.operators || []) {
          if (!index[op.name]) {
            index[op.name] = {
              name: op.name,
              roles: new Set(),
              sites: [],
              essentialCount: 0,
              recommendedCount: 0,
              flexCount: 0,
            }
          }
          const o = index[op.name]
          o.roles.add(op.role)
          o.sites.push({
            mapId, mapName: map.name,
            siteId, siteName: site.name,
            side, role: op.role,
            priority: op.priority,
          })
          o[`${op.priority}Count`]++
        }
      }
    }
  }
  // Convert sets to arrays for JSON-friendliness
  return Object.values(index).map(o => ({
    ...o,
    roles: [...o.roles],
    side: o.sites[0]?.side === 'attack' ? 'attack' : 'defense', // dominant side guess
  })).sort((a, b) => a.name.localeCompare(b.name))
}

function operatorSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function htmlShell({ title, description, canonical, bodyInner, ogImage, jsonLd, breadcrumbs }) {
  const ogImageUrl = ogImage || `${SITE_URL}/og-image.png`
  const ldBlocks = []
  if (jsonLd) ldBlocks.push(jsonLd)
  if (breadcrumbs && breadcrumbs.length) {
    ldBlocks.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((b, i) => ({
        '@type': 'ListItem', position: i + 1, name: b.name, item: b.url,
      })),
    })
  }
  const jsonLdHtml = ldBlocks.map(b => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join('\n  ')
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
  <meta name="theme-color" content="#121211" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escape(title)}" />
  <meta property="og:description" content="${escape(description)}" />
  <meta property="og:url" content="${escape(canonical)}" />
  <meta property="og:image" content="${escape(ogImageUrl)}" />
  <meta property="og:site_name" content="Recon 6" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${escape(ogImageUrl)}" />
  ${jsonLdHtml}
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #121211; color: #ebe4d7; line-height: 1.6; }
    .container { max-width: 880px; margin: 0 auto; padding: 1.5rem; }
    .nav { padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .nav a { color: #f07430; text-decoration: none; margin-right: 1rem; font-weight: 600; }
    .nav a:hover { text-decoration: underline; }
    h1 { font-size: 2rem; margin: 1.5rem 0 0.25rem; }
    .eyebrow { color: rgba(235,228,215,0.6); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.08em; }
    .lead { color: rgba(235,228,215,0.85); font-size: 1.05rem; margin: 1rem 0 1.5rem; }
    h2 { font-size: 1.3rem; margin: 2rem 0 0.5rem; color: #ff9b5c; }
    h3 { font-size: 1.05rem; margin: 1.25rem 0 0.4rem; color: #f07430; }
    .pill { display: inline-block; padding: 2px 10px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-radius: 999px; margin-right: 6px; }
    .pill-essential { background: rgba(80,200,120,0.15); color: #7ee2a4; border: 1px solid #50c878; }
    .pill-recommended { background: rgba(255,180,80,0.15); color: #ffc97a; border: 1px solid #ffb450; }
    .pill-flex { background: rgba(180,180,180,0.15); color: #aaa; border: 1px solid #888; }
    .pill-attack { background: rgba(255,138,80,0.15); color: #ffa67a; border: 1px solid #ff8a50; }
    .pill-defense { background: rgba(80,180,255,0.15); color: #7aaaff; border: 1px solid #5099cc; }
    .stat-row { display: flex; gap: 1.5rem; margin: 1rem 0 2rem; flex-wrap: wrap; }
    .stat { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.75rem 1rem; min-width: 120px; }
    .stat-label { color: rgba(235,228,215,0.6); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-val { font-size: 1.5rem; font-weight: 700; color: #fff; margin-top: 4px; }
    .site-list { list-style: none; padding: 0; margin: 0.5rem 0; }
    .site-list li { padding: 0.5rem 0.75rem; margin-bottom: 4px; background: rgba(255,255,255,0.03); border-radius: 8px; border-left: 3px solid rgba(255,155,92,0.4); }
    .site-list a { color: #ebe4d7; text-decoration: none; font-weight: 600; }
    .site-list a:hover { color: #f07430; }
    .cta { display: inline-block; padding: 0.7rem 1.4rem; background: #f07430; color: #121211; font-weight: 700; border-radius: 8px; text-decoration: none; margin: 1.5rem 0; }
    .cta:hover { background: #f49b67; }
    a { color: #f07430; }
    .nav { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .brand { font-weight: 900; letter-spacing: 0.06em; color: #fff !important; }
    .brand span { color: #f07430; }
    .nav-links a { margin-left: 14px; margin-right: 0; color: rgba(235,228,215,0.85); font-size: 0.9rem; font-weight: 500; }
    .footer-strip { margin-top: 3rem; padding: 1.5rem 0; border-top: 1px solid rgba(255,255,255,0.08); color: rgba(235,228,215,0.5); font-size: 0.85rem; text-align: center; }
    .related-links ul { padding-left: 18px; }${ARTICLE_CSS}
  </style>
</head>
<body>
  <div class="container">
    ${navHtml()}
    ${bodyInner}
    ${footerHtml()}
  </div>
</body>
</html>`
}

function relatedHtml(heading, links) {
  const items = links.filter(Boolean)
  if (!items.length) return ''
  return `
    <section class="related-links">
      <h2>${escape(heading)}</h2>
      <ul>${items.map((l) => `<li><a href="${escape(l.url)}">${escape(l.name)}</a></li>`).join('')}</ul>
    </section>`
}

function operatorPage(op) {
  const slug = operatorSlug(op.name)
  const total = op.sites.length
  const sidesPlayed = new Set(op.sites.map(s => s.side))
  const sideText = sidesPlayed.has('attack') && sidesPlayed.has('defense')
    ? 'both attack and defense'
    : sidesPlayed.has('attack') ? 'attack' : 'defense'
  const description = fitDescription(
    `${op.name} operator guide for Rainbow Six Siege: every site where ${op.name} is picked, role, and priority. Played on ${sideText} across ${total} site${total === 1 ? '' : 's'} on Recon 6.`,
    `${op.name} guide for Rainbow Six Siege: the ${total} site${total === 1 ? '' : 's'} where Recon 6's plans pick ${op.name}, with the role and priority at each one.`,
  )
  const canonical = `${SITE_URL}/guides/operators/${slug}.html`
  const datePublished = firstPublished(join(OUT_DIR, `${slug}.html`))
  const sideNoun = sideText === 'attack' ? 'attacker' : sideText === 'defense' ? 'defender' : 'operator'
  const topMapIds = [...new Set(op.sites.filter((s) => s.priority === 'essential').concat(op.sites).map((s) => s.mapId))]
  const topMap = MAPS.find((m) => m.id === topMapIds[0])
  const deepDive = deepDivePath(op.name)

  // Group sites by map
  const byMap = {}
  for (const s of op.sites) {
    if (!byMap[s.mapId]) byMap[s.mapId] = { mapName: s.mapName, sites: [] }
    byMap[s.mapId].sites.push(s)
  }

  const order = { essential: 0, recommended: 1, flex: 2 }
  const ranked = [...op.sites].sort((a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3))
  const roleCounts = {}
  for (const s of op.sites) roleCounts[s.role] = (roleCounts[s.role] || 0) + 1
  const topRole = String(Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || op.roles[0] || '').toLowerCase()
  const firstRoom = (s) => String(s.siteName).split(' / ')[0]
  const mapCount = Object.keys(byMap).length
  const best = ranked.slice(0, 2).map((s) => `${firstRoom(s)} on ${s.mapName} (${s.side})`)

  // The answer first: what the operator is, how much the plans use them, and where.
  const answer = `${op.name} is a Rainbow Six Siege ${sideNoun}. Recon 6's plans pick ${op.name} at ${total} site${total === 1 ? '' : 's'} on ${mapCount} map${mapCount === 1 ? '' : 's'}${op.essentialCount ? ` (${op.essentialCount} essential)` : ''}, mostly as ${topRole} on ${sideText.includes(' and ') ? 'both sides' : sideText}. ${op.name}'s strongest ${best.length === 1 ? 'spot is' : 'spots are'} ${listOf(best)}. Below, each of ${op.name}'s sites shows the job ${op.name} does there.`

  const mapSections = Object.entries(byMap).map(([mapId, { mapName, sites }]) => {
    const items = sites.map((s) => `<li><a href="/guides/${mapId}.html#${escape(s.siteId)}">${escape(s.siteName)}</a>: ${escape(s.side)}, ${escape(s.priority)}, ${escape(String(s.role || '').toLowerCase())}.</li>`).join('\n')
    return `<h3>${escape(mapName)}</h3>
      <ul class="site-list">${items}</ul>`
  }).join('\n')

  const official = officialLinksSentence(op.name, operatorRefs(op.name), { ubisoftWhat: 'has the official loadout', siegeggWhat: 'track pro picks' })

  const inner = `
    <div class="eyebrow">Operator Guide</div>
    ${bylineHtml({ datePublished, kind: 'guide' })}
    <h1>${escape(op.name)} — Where to Play</h1>
    <p class="lead">${escape(answer)}</p>
    ${official ? `<p class="official">${official}</p>` : ''}
    ${topMap ? figureHtml({ src: `/guides/og/${topMap.id}.svg`, alt: `${topMap.name} map card from Recon 6's Rainbow Six Siege guide`, caption: `${topMap.name} — ${op.name}'s top map` }) : ''}
    <div class="stat-row">
      <div class="stat"><div class="stat-label">Sites</div><div class="stat-val">${total}</div></div>
      <div class="stat"><div class="stat-label">Essential</div><div class="stat-val">${op.essentialCount}</div></div>
      <div class="stat"><div class="stat-label">Recommended</div><div class="stat-val">${op.recommendedCount}</div></div>
      <div class="stat"><div class="stat-label">Flex</div><div class="stat-val">${op.flexCount}</div></div>
    </div>
    <a class="cta" href="${SITE_URL}/operators/${encodeURIComponent(op.name.toLowerCase())}">Open ${escape(op.name)} in the interactive tool →</a>
    <h2>Where is ${escape(op.name)} picked?</h2>
    ${mapSections}
    ${relatedHtml(`More on ${op.name}`, [
      deepDive && { name: `${op.name} deep dive: loadout, counters and how to climb`, url: deepDive },
      ...topMapIds.slice(0, 3).map((id) => {
        const m = MAPS.find((x) => x.id === id)
        return m && { name: `${m.name} map guide`, url: `/guides/${m.id}.html` }
      }),
      { name: 'All operator guides', url: '/guides/operators/' },
    ])}
  `
  return {
    slug,
    html: htmlShell({
      title: fitTitle(
        `${op.name} Operator Guide — Where to Play (R6 Siege) | Recon 6`,
        `${op.name} Operator Guide: Where to Play | Recon 6`,
        `${op.name} R6 Operator Guide | Recon 6`,
      ),
      description,
      canonical,
      bodyInner: inner,
      jsonLd: articleSchema({
        headline: `${op.name} Operator Guide — R6 Siege`,
        description,
        url: canonical,
        datePublished,
        dateModified: TEMPLATE_REVISED,
        image: `${SITE_URL}/og-image.png`,
        section: 'Operator guides',
      }),
      breadcrumbs: [
        { name: 'Recon 6', url: SITE_URL },
        { name: 'Operators', url: `${SITE_URL}/guides/operators/` },
        { name: op.name, url: `${SITE_URL}/guides/operators/${slug}.html` },
      ],
    }),
  }
}

const PRIORITY_ORDER = { essential: 0, recommended: 1, flex: 2 }
const firstRoom = (site) => String(site.siteName).split(' / ')[0]

// One line per operator: the job, how often the plans pick them, and where.
function operatorLine(op) {
  const page = deepDivePath(op.name) || `/guides/operators/${operatorSlug(op.name)}.html`
  const roleCounts = {}
  for (const s of op.sites) roleCounts[s.role] = (roleCounts[s.role] || 0) + 1
  const role = String(Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '').toLowerCase()
  const best = [...op.sites]
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3) || a.mapName.localeCompare(b.mapName))
    .slice(0, 2)
    .map((s) => `${firstRoom(s)} on ${s.mapName}`)
  const n = op.sites.length
  return `<li><a href="${page}">${escape(op.name)}</a>: ${escape(role)} at ${n} site${n === 1 ? '' : 's'}${op.essentialCount ? ` (${op.essentialCount} essential)` : ''}, strongest at ${escape(listOf(best))}.</li>`
}

function indexPage(operators) {
  const sideOf = (op) => {
    const atk = op.sites.filter((s) => s.side === 'attack').length
    return atk >= op.sites.length - atk ? 'attack' : 'defense'
  }
  const attackers = operators.filter((op) => sideOf(op) === 'attack')
  const defenders = operators.filter((op) => sideOf(op) === 'defense')

  const inner = `
    <div class="eyebrow">Operator Guides</div>
    <h1>R6 Siege Operator Guides</h1>
    <p class="lead">Recon 6 has a page for each of the ${operators.length} operators its plans use: ${attackers.length} attackers and ${defenders.length} defenders. Each page lists every map site where the plans pick that operator, with the side, the priority (essential, recommended or flex) and the operator's job there. Most pages also cover the loadout and counters.</p>
    <div class="stat-row">
      <div class="stat"><div class="stat-label">Operators</div><div class="stat-val">${operators.length}</div></div>
      <div class="stat"><div class="stat-label">Maps</div><div class="stat-val">${Object.keys(STRATS).length}</div></div>
      <div class="stat"><div class="stat-label">Sites</div><div class="stat-val">${Object.values(STRATS).reduce((a, m) => a + Object.keys(m).length, 0)}</div></div>
    </div>
    <h2>Which attackers do Recon 6's plans use?</h2>
    <ul class="site-list">${attackers.map(operatorLine).join('\n')}</ul>
    <h2>Which defenders do Recon 6's plans use?</h2>
    <ul class="site-list">${defenders.map(operatorLine).join('\n')}</ul>
    <h2>Where are the full site plans?</h2>
    <p>Each operator page links to the map guides for its sites. The map guides have the attack and defense plan and the callouts for every bomb site.</p>
    <a class="cta" href="/guides/">Browse map guides →</a>
  `
  return htmlShell({
    title: fitTitle('R6 Siege Operator Guides — Where to Play Every Operator | Recon 6', 'R6 Siege Operator Guides: Where to Play Each One', 'R6 Siege Operator Guides | Recon 6'),
    description: `Complete operator guide catalog for Rainbow Six Siege. ${operators.length} operators across ${Object.keys(STRATS).length} maps with full site-by-site picks.`,
    canonical: `${SITE_URL}/guides/operators/`,
    bodyInner: inner,
  })
}

const operators = buildOperatorIndex()
mkdirSync(OUT_DIR, { recursive: true })

let written = 0
const folded = []
for (const op of operators) {
  const slug = operatorSlug(op.name)
  const out = join(OUT_DIR, `${slug}.html`)
  if (deepDivePath(op.name)) {
    if (existsSync(out)) rmSync(out)
    folded.push(op.name)
    continue
  }
  writeFileSync(out, operatorPage(op).html)
  written++
}

writeFileSync(join(OUT_DIR, 'index.html'), indexPage(operators))

console.log(`✓ Generated ${written} operator guide${written === 1 ? '' : 's'} + index in public/guides/operators/ (${folded.length} live in their blog deep dive)`)
