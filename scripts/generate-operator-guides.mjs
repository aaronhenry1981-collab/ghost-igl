#!/usr/bin/env node
// Generates static SEO landing pages for each operator that appears in any
// site strat. "Thermite operator guide R6 Siege", "Where to play Mira", etc.
// are real long-tail search queries with weak SERP competition — capture
// them with crawlable static HTML instead of the hash-routed React app.
//
// Output: public/guides/operators/<slug>.html + an index page linking them.
// Run: node scripts/generate-operator-guides.mjs

import { existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import MAPS from '../src/data/maps.js'
import STRATS from '../src/data/public-strats.generated.js'
import {
  ARTICLE_CSS, SITE_URL, TEMPLATE_REVISED, articleSchema, bylineHtml, figureHtml, firstPublished,
  fitDescription, fitTitle, footerHtml, navHtml, operatorSources, sourcesHtml,
} from './lib/article-seo.mjs'

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

  const mapSections = Object.entries(byMap).map(([mapId, { mapName, sites }]) => {
    const items = sites.map(s => {
      const sidePill = `<span class="pill pill-${s.side}">${s.side}</span>`
      const priorityPill = `<span class="pill pill-${s.priority}">${s.priority}</span>`
      return `<li>
        <a href="/guides/${mapId}/${s.siteId}.html">${escape(s.siteName)}</a>
        ${sidePill}${priorityPill}
        <span style="color:rgba(235,228,215,0.6); font-size:0.85rem;">${escape(s.role)}</span>
      </li>`
    }).join('\n')
    return `<h3>${escape(mapName)}</h3>
      <ul class="site-list">${items}</ul>`
  }).join('\n')

  const inner = `
    <div class="eyebrow">Operator Guide</div>
    <h1>${escape(op.name)} — Where to Play</h1>
    ${bylineHtml({ datePublished, dateModified: TEMPLATE_REVISED, kind: 'operatorGuide' })}
    <p class="lead">${escape(op.name)} is a Rainbow Six Siege ${sideNoun} that Recon 6's plans pick at ${total} site${total === 1 ? '' : 's'}, as ${op.roles.map(escape).join(', ')}. Played on ${sideText}.</p>
    ${topMap ? figureHtml({ src: `/guides/og/${topMap.id}.svg`, alt: `${topMap.name} map card from Recon 6's Rainbow Six Siege guide`, caption: `${op.name}'s first map in Recon 6's plans: ${topMap.name}` }) : ''}
    <div class="stat-row">
      <div class="stat"><div class="stat-label">Sites</div><div class="stat-val">${total}</div></div>
      <div class="stat"><div class="stat-label">Essential</div><div class="stat-val">${op.essentialCount}</div></div>
      <div class="stat"><div class="stat-label">Recommended</div><div class="stat-val">${op.recommendedCount}</div></div>
      <div class="stat"><div class="stat-label">Flex</div><div class="stat-val">${op.flexCount}</div></div>
    </div>
    <a class="cta" href="${SITE_URL}/operators/${encodeURIComponent(op.name)}">Open ${escape(op.name)} in the interactive tool →</a>
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
    ${sourcesHtml(operatorSources(op.name))}
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

function indexPage(operators) {
  const groupedByRole = {}
  for (const op of operators) {
    for (const role of op.roles) {
      if (!groupedByRole[role]) groupedByRole[role] = []
      groupedByRole[role].push(op)
    }
  }

  const deepDives = operators.map((op) => ({ name: op.name, path: deepDivePath(op.name) })).filter((d) => d.path)
  const opCardsHtml = operators.map(op => {
    const slug = operatorSlug(op.name)
    return `<li>
      <a href="/guides/operators/${slug}.html">${escape(op.name)}</a>
      <span style="color:rgba(235,228,215,0.5); font-size:0.85rem; margin-left:6px;">${op.sites.length} site${op.sites.length === 1 ? '' : 's'}</span>
    </li>`
  }).join('\n')

  const inner = `
    <div class="eyebrow">Operator Guides</div>
    <h1>R6 Siege Operator Guides</h1>
    <p class="lead">Every operator that appears in Recon 6's strat catalog. Click any operator for the full list of sites where they're picked, with role and priority breakdown.</p>
    <div class="stat-row">
      <div class="stat"><div class="stat-label">Operators</div><div class="stat-val">${operators.length}</div></div>
      <div class="stat"><div class="stat-label">Maps</div><div class="stat-val">${Object.keys(STRATS).length}</div></div>
      <div class="stat"><div class="stat-label">Sites</div><div class="stat-val">${Object.values(STRATS).reduce((a, m) => a + Object.keys(m).length, 0)}</div></div>
    </div>
    <ul class="site-list" style="columns: 2; column-gap: 1.5rem;">${opCardsHtml}</ul>
    ${deepDives.length ? `<h2>Which operators have a full deep dive?</h2>
    <p>These ${deepDives.length} operators also have a long-form guide on the blog: loadout, counters and how to climb with them.</p>
    <ul class="site-list" style="columns: 2; column-gap: 1.5rem;">${deepDives.map(({ name, path }) => `<li><a href="${path}">${escape(name)} deep dive</a></li>`).join('\n')}</ul>` : ''}
    <h2>Looking for full strat coverage?</h2>
    <p>Each operator page links back to the specific sites where they shine. For full strats, ban recs, callouts, and utility breakdowns:</p>
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
for (const op of operators) {
  const { slug, html } = operatorPage(op)
  writeFileSync(join(OUT_DIR, `${slug}.html`), html)
  written++
}

writeFileSync(join(OUT_DIR, 'index.html'), indexPage(operators))

console.log(`✓ Generated ${written} operator guides + index in public/guides/operators/`)
console.log(`  Operators: ${operators.map(o => o.name).join(', ')}`)
