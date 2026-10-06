#!/usr/bin/env node
// Static SEO guide pages: one per playable map, with every bomb site on the
// same page under its own #anchor, plus the /guides/ index.
// The per-site pages (/guides/<map>/<site>.html) repeated a section of their
// map guide; they were folded in here on 2026-10-06 and the CloudFront router
// (aws/cloudfront-site-router.js) 301s them to /guides/<map>.html#<site>.
// Run: node scripts/generate-guides.mjs

import { existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import MAPS from '../src/data/maps.js'
import STRATS from '../src/data/public-strats.generated.js'
import BANS from '../src/data/public-bans.generated.js'
import { verifiedFor } from '../src/data/verified-callouts.js'
import {
  ARTICLE_CSS, SITE_URL, TEMPLATE_REVISED, articleSchema, bylineHtml, figureHtml, firstPublished,
  fitDescription, fitTitle, footerHtml, mapRefs, navHtml, officialSourcesLine,
} from './lib/article-seo.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'guides')

// "CEO Office / Executive Lounge" -> "CEO Office"; both rooms when two sites
// on the map share the first one.
function siteLabel(map, site) {
  const first = (s) => String(s.name).split(' / ')[0]
  const shared = map.sites.some((other) => other.id !== site.id && first(other) === first(site))
  return shared ? String(site.name).replace(' / ', ' & ') : first(site)
}

const operatorSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
// An operator's page: the deep dive when there is one (the "where to play"
// guide was folded into it), otherwise the operator guide.
function operatorPath(name) {
  const deepDive = `r6-operator-${operatorSlug(name)}`
  return existsSync(join(ROOT, 'public', 'blog', `${deepDive}.html`)) ? `/blog/${deepDive}.html` : `/guides/operators/${operatorSlug(name)}.html`
}
const listOf = (names) => (names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`)
const withStop = (text) => (/[.!?]$/.test(String(text).trim()) ? String(text).trim() : `${String(text).trim()}.`)

function escape(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// A visible notice on a site whose plan is known to be out of date (maps.js
// `notice`, e.g. a bomb site Ubisoft moved in a season update).
function siteNoticeHtml(site) {
  if (!site?.notice) return ''
  const since = site.notice.since ? ` in ${escape(site.notice.since)}` : ''
  const heading = site.notice.kind === 'unavailable' ? 'Plan withdrawn' : 'Layout changed'
  return `<p class="site-notice" role="note" style="border:1px solid rgba(255,196,92,.55);background:rgba(255,196,92,.1);border-radius:8px;padding:.7rem .9rem;color:#ffe2a8"><strong style="color:#ffc45c">${heading}${since}.</strong> ${escape(site.notice.text)}</p>`
}

const isWithdrawn = (site) => site?.notice?.kind === 'unavailable'

function htmlShell({ title, description, canonical, bodyInner, extraHead = '', ogImage, jsonLd, breadcrumbs }) {
  const ogImageUrl = ogImage || `${SITE_URL}/og-image.png`
  const ldBlocks = []
  if (jsonLd) ldBlocks.push(jsonLd)
  if (breadcrumbs && breadcrumbs.length) {
    ldBlocks.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: b.url })),
    })
  }
  const jsonLdHtml = ldBlocks.map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join('\n  ')
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}" />
  <link rel="canonical" href="${escape(canonical)}" />
  ${extraHead.includes('name="robots"') ? '' : '<meta name="robots" content="index, follow, max-image-preview:large" />'}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#121211" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escape(title)}" />
  <meta property="og:description" content="${escape(description)}" />
  <meta property="og:url" content="${escape(canonical)}" />
  <meta property="og:image" content="${escape(ogImageUrl)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Recon 6" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${escape(ogImageUrl)}" />
  ${jsonLdHtml}
  ${extraHead}
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #121211; color: #ebe4d7; line-height: 1.6; }
    a { color: #f07430; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .nav { padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; }
    .brand { font-weight: 900; letter-spacing: 0.06em; color: #fff; text-decoration: none; }
    .brand span { color: #f07430; }
    .nav-links a { margin-left: 18px; color: rgba(235,228,215,0.85); font-size: 0.9rem; }
    main { max-width: 820px; margin: 0 auto; padding: 32px 24px 80px; }
    h1 { font-size: 2rem; margin: 0 0 8px; }
    .definition { font-size: 1.04rem; color: rgba(235,228,215,0.94); }
    .official { font-size: 0.92rem; color: rgba(235,228,215,0.8); }
    .cta-top { display: inline-block; padding: 10px 18px; background: linear-gradient(90deg, #f07430, #ed6212); color: #0f0e0d; font-weight: 700; border-radius: 6px; text-decoration: none; margin: 4px 0 18px; }
    .site-toc { font-size: 0.92rem; margin: 0 0 24px; }
    .site { margin-bottom: 36px; padding: 22px; background: rgba(255,255,255,0.03); border: 1px solid rgba(240,116,48,0.15); border-radius: 10px; scroll-margin-top: 16px; }
    .site h3 { margin: 0 0 10px; font-size: 1.3rem; color: #fff; }
    .site-answer { margin: 0 0 6px; }
    .side { margin: 16px 0; padding: 14px 16px; background: rgba(18,18,17,0.5); border-left: 3px solid; border-radius: 0 6px 6px 0; }
    .side.attack { border-left-color: #ff8060; }
    .side.defense { border-left-color: #50b4ff; }
    .side h4 { margin: 0 0 8px; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.08em; }
    .side.attack h4 { color: #ff8060; }
    .side.defense h4 { color: #50b4ff; }
    .side p { margin: 6px 0; }
    .lineup strong, .callout-line strong { color: #fad6c2; }
    .callout-line { font-size: 0.9rem; color: rgba(235,228,215,0.85); }
    .deep-link { display: inline-block; margin-top: 6px; font-size: 0.88rem; }
    .bans { margin-top: 12px; padding: 14px 16px; background: rgba(255,70,90,0.05); border: 1px solid rgba(255,70,90,0.2); border-radius: 8px; }
    .related-links { margin-top: 32px; padding: 20px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; }
    .related-links h2 { margin: 0 0 10px; font-size: 1.1rem; }
    .related-links ul { margin: 0; padding-left: 18px; }
    .pro-note { margin-top: 24px; font-size: 0.95rem; }
    .footer-strip { max-width: 820px; margin: 40px auto; padding: 0 24px; color: rgba(235,228,215,0.5); font-size: 0.82rem; text-align: center; }${ARTICLE_CSS}
    @media (max-width: 600px) {
      main { padding: 20px 16px 40px; }
      h1 { font-size: 1.5rem; }
      .site { padding: 16px; }
    }
  </style>
</head>
<body>
  ${navHtml()}
  <main>
    ${bodyInner}
  </main>
  ${footerHtml()}
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

const opsOf = (strat, priority) => (strat?.operators || []).filter((o) => o.priority === priority)
const opPhrase = (o) => `${o.name} (${String(o.role || '').toLowerCase()})`

// One side of a site as plain sentences: the lineup by priority, the
// execute or setup, then the callouts.
function renderSide(side, strat) {
  if (!strat) return ''
  const groups = [['Essential', 'essential'], ['Recommended', 'recommended'], ['Flex', 'flex']]
    .map(([label, key]) => [label, opsOf(strat, key)])
    .filter(([, ops]) => ops.length)
    .map(([label, ops]) => `<strong>${label}:</strong> ${escape(ops.map(opPhrase).join(', '))}.`)
  const callouts = (strat.callouts || []).filter(Boolean)
  return `
      <div class="side ${side}">
        <h4>${side === 'attack' ? 'Attack' : 'Defense'}</h4>
        <p class="lineup">${groups.join(' ')}</p>
        ${strat.strategy ? `<p class="strategy">${escape(withStop(strat.strategy))}</p>` : ''}
        ${callouts.length ? `<p class="callout-line"><strong>Callouts:</strong> ${escape(callouts.join(', '))}.</p>` : ''}
      </div>`
}

// The first sentence under each site's heading: which operators each side
// is built on.
function siteAnswer(map, site, strat) {
  const lead = (side) => {
    const ops = opsOf(strat[side], 'essential').length ? opsOf(strat[side], 'essential') : opsOf(strat[side], 'recommended')
    return ops.length ? listOf(ops.map((o) => o.name)) : null
  }
  const atk = strat.attack && lead('attack')
  const def = strat.defense && lead('defense')
  const parts = [atk && `${atk} lead the attack`, def && `${def} lead the defense`].filter(Boolean)
  return parts.length ? `On ${siteLabel(map, site)}, ${parts.join('; ')}.` : ''
}

function renderSiteSection(map, site) {
  const strat = STRATS[map.id]?.[site.id]
  if (!strat && isWithdrawn(site)) {
    return `
      <section class="site" id="${escape(site.id)}">
        <h3>${escape(site.name)} (${escape(site.floor)})</h3>${siteNoticeHtml(site)}
      </section>`
  }
  if (!strat) return ''
  return `
      <section class="site" id="${escape(site.id)}">
        <h3>${escape(site.name)} (${escape(site.floor)})</h3>${siteNoticeHtml(site)}
        <p class="site-answer">${escape(siteAnswer(map, site, strat))}</p>
        ${renderSide('attack', strat.attack)}
        ${renderSide('defense', strat.defense)}
        <a class="deep-link" href="${SITE_URL}/strats/${map.id}/${site.id}/attack">Open the interactive ${escape(siteLabel(map, site))} strat &rarr;</a>
      </section>`
}

// The two essential operators a side's plans on this map use most.
function leansOn(map, side) {
  const counts = {}
  for (const site of map.sites) {
    for (const o of opsOf(STRATS[map.id]?.[site.id]?.[side], 'essential')) counts[o.name] = (counts[o.name] || 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 2).map(([name]) => name)
}

// Spawn and room names Recon 6 read off the in-game labels in its own
// recorded matches (src/data/verified-callouts.js: geography only, each name
// seen on at least two frames). The most-seen room names, not all of them.
function footageHtml(map) {
  const v = verifiedFor(map.id)
  if (!v || !(v.spawns?.length || v.callouts?.length)) return ''
  const byFrames = (list) => [...(list || [])].sort((a, b) => b.frames - a.frames)
  const spawns = byFrames(v.spawns).map((e) => e.name)
  const rooms = byFrames(v.callouts).map((e) => e.name).filter((n) => !spawns.includes(n)).slice(0, 12)
  return `
    <h2>${escape(map.name)} callouts from match footage</h2>
    ${spawns.length ? `<p>${escape(map.name)}'s attacker spawns: ${escape(listOf(spawns))}.</p>` : ''}
    ${rooms.length ? `<p>Most-seen ${escape(map.name)} room callouts: ${escape(listOf(rooms))}.</p>` : ''}
    <p><a href="/guides/#footage">How the ${escape(map.name)} names were read</a>.</p>`
}

function renderMapGuide(map) {
  const playable = map.sites.filter((s) => STRATS[map.id]?.[s.id])
  const siteList = map.sites.map((s) => `${siteLabel(map, s)} (${s.floor})`)
  const url = `${SITE_URL}/guides/${map.id}.html`
  const datePublished = firstPublished(join(OUT_DIR, `${map.id}.html`))
  const description = fitDescription(
    `Rainbow Six Siege strategy for ${map.name}: operator picks, a short execute overview, and key callouts for every bomb site (${map.sites.map((s) => s.name).join(', ')}).`,
    `${map.name} guide for Rainbow Six Siege: operator picks, a short execute overview and the key callouts for all ${map.sites.length} bomb sites.`,
  )
  // The page's answer, first: what the map is and what this guide gives.
  const atk = leansOn(map, 'attack')
  const def = leansOn(map, 'defense')
  const answer = [
    map.rankedPool
      ? `In Rainbow Six Siege, ${map.name} is a ranked map this season with ${map.sites.length} bomb sites: ${listOf(siteList)}.`
      : `In Rainbow Six Siege, ${map.name} is out of the ranked pool this season. ${map.name} has ${map.sites.length} bomb sites: ${listOf(siteList)}.`,
    atk.length && def.length ? `Recon 6's plans on ${map.name} lean on ${listOf(atk)} for attack and on ${listOf(def)} for defense.` : '',
  ].filter(Boolean).join(' ')

  const essentialOps = [...new Set(playable.flatMap((s) => ['attack', 'defense'].flatMap((side) =>
    opsOf(STRATS[map.id][s.id][side], 'essential').map((o) => o.name))))]

  const bans = BANS[map.id]
  const bansHtml = bans ? `
      <div class="bans">
        <h3>Ban recommendations</h3>
        <ul>
          ${(bans.attack || []).map((b) => `<li><strong>${escape(b.name)}</strong> (attack): ${escape(withStop(b.reason))}</li>`).join('')}
          ${(bans.defense || []).map((b) => `<li><strong>${escape(b.name)}</strong> (defense): ${escape(withStop(b.reason))}</li>`).join('')}
        </ul>
      </div>` : ''

  const official = officialSourcesLine(map.name, mapRefs(map.id))

  const bodyInner = `
    <nav class="breadcrumb" style="font-size:0.85rem;color:rgba(235,228,215,0.6);margin-bottom:8px">
      <a href="/guides/">Map Guides</a> ›
      <span>${escape(map.name)}</span>
    </nav>
    ${bylineHtml({ datePublished, kind: 'guide' })}
    <h1>${escape(map.name)} — Complete Strategy Guide</h1>
    <p class="definition">${escape(answer)}</p>
    <a class="cta-top" href="${SITE_URL}/strats/${map.id}">Open interactive ${escape(map.name)} strats &rarr;</a>
    ${figureHtml({ src: `/guides/og/${map.id}.svg`, alt: `${map.name} map card from Recon 6's Rainbow Six Siege guide`, caption: `${map.name}: ${siteList.join(', ')}` })}
    <p class="site-toc"><strong>Jump to a site:</strong> ${map.sites.map((s) => `<a href="#${escape(s.id)}">${escape(siteLabel(map, s))}</a>`).join(', ')}.</p>
    ${bansHtml}
    <h2>How should you play ${escape(map.name)}'s bomb sites?</h2>
    ${map.sites.map((s) => renderSiteSection(map, s)).join('\n')}
    ${footageHtml(map)}
    ${official ? `<p class="official">${official}</p>` : ''}
    ${relatedHtml(`Operators ${map.name} plans lean on`, [
      ...essentialOps.slice(0, 6).map((name) => ({ name: `${name} guide`, url: operatorPath(name) })),
    ])}
    <p class="pro-note"><a href="${SITE_URL}/pricing">Get ${escape(map.name)}'s utility plans with Pro</a></p>`

  const jsonLd = articleSchema({
    headline: `${map.name} — Complete Rainbow Six Siege Strategy Guide`,
    description,
    url,
    datePublished,
    dateModified: TEMPLATE_REVISED,
    image: `${SITE_URL}/og-image.png`,
    section: 'Map guides',
  })

  return htmlShell({
    title: fitTitle(`${map.name} Strategy Guide — Recon 6 (R6 Siege)`, `${map.name} Guide — Recon 6 (R6 Siege)`, `${map.name} R6 Guide`),
    description,
    canonical: url,
    bodyInner,
    jsonLd,
    breadcrumbs: [
      { name: 'Recon 6', url: SITE_URL },
      { name: 'Map Guides', url: `${SITE_URL}/guides/` },
      { name: map.name, url },
    ],
    ogImage: `${SITE_URL}/guides/og/${map.id}.svg`,
  })
}

function guideCard(m) {
  const atk = leansOn(m, 'attack')
  const def = leansOn(m, 'defense')
  const lean = atk.length && def.length ? ` Attack leans on ${listOf(atk)}; defense on ${listOf(def)}.` : ''
  return `
        <li class="guide-card">
          <a href="${escape(m.id)}.html">
            <h3>${escape(m.name)}</h3>
            <p>${m.sites.length} bomb sites: ${escape(listOf(m.sites.map((s) => siteLabel(m, s))))}.${escape(lean)}</p>
          </a>
        </li>`
}

function renderIndex(mapsWithStrats) {
  const rankedMaps = mapsWithStrats.filter((m) => m.rankedPool)
  const otherMaps = mapsWithStrats.filter((m) => !m.rankedPool)
  const ranked = rankedMaps.length

  const bodyInner = `
    <h1>Recon 6 — Rainbow Six Siege Map Guides</h1>
    <p class="definition">Recon 6 has a free strategy guide for each of ${mapsWithStrats.length} Rainbow Six Siege maps, ${ranked} of them in the current ranked pool. Every guide puts all of a map's bomb sites on one page. Each site lists the operators the attack and defense plans use, a short execute overview and the callouts.</p>
    <p>The guides come from the same strat library as the interactive app. Open a guide to learn a map before you queue. Open the app when you want the full plan for one site and side, with the job for each of the five players.</p>
    <p id="footage">Most guides also list the attacker spawns and room callouts seen in Recon 6's own recorded matches. Those names are read off the in-game labels, and each one appeared on at least two frames. They cover map geography only, not tactics.</p>
    <style>
      .guide-grid { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
      .guide-card a { display: block; padding: 18px 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(240,116,48,0.15); border-radius: 10px; color: inherit; text-decoration: none; transition: background 0.15s, border-color 0.15s; }
      .guide-card a:hover { background: rgba(240,116,48,0.06); border-color: #f07430; text-decoration: none; }
      .guide-card h3 { margin: 0 0 4px; color: #f07430; }
      .guide-card p { margin: 0; color: rgba(235,228,215,0.75); font-size: 0.9rem; }
    </style>
    <h2>Which maps are in the ranked pool?</h2>
    <p>${ranked} maps with a guide are in the current ranked pool: ${escape(listOf(rankedMaps.map((m) => m.name)))}. The list follows Ubisoft's official map index, and Ubisoft rotates the ranked pool at each season launch and midseason. Each card below names a map's bomb sites and the two essential operators each side's plans use most.</p>
    <ul class="guide-grid">
      ${rankedMaps.map(guideCard).join('\n')}
    </ul>
    ${otherMaps.length ? `<h2>Maps outside the ranked pool</h2>
    <p>The other ${otherMaps.length} maps with guides are not in the current ranked pool: ${escape(listOf(otherMaps.map((m) => m.name)))}.</p>
    <ul class="guide-grid">
      ${otherMaps.map(guideCard).join('\n')}
    </ul>` : ''}
    ${relatedHtml('More guides', [
      { name: "Operator guides: every operator in Recon 6's plans", url: '/guides/operators/' },
      { name: 'Blog: rank-up guides and operator deep dives', url: '/blog/' },
      { name: 'Compare Recon 6 with a coach, free guides and other tools', url: '/compare/' },
    ])}
    <p class="pro-note"><a href="${SITE_URL}/strats">Open the interactive strats</a></p>`

  return htmlShell({
    title: 'Rainbow Six Siege Strategy Guides — Recon 6',
    description: 'Free R6 Siege strategy guides for every map in the ranked pool: operator picks, callouts and a short execute overview for every bomb site.',
    canonical: `${SITE_URL}/guides/`,
    bodyInner,
  })
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const playable = MAPS.filter((m) => !m.comingSoon && STRATS[m.id])
  for (const map of playable) writeFileSync(join(OUT_DIR, `${map.id}.html`), renderMapGuide(map), 'utf8')
  writeFileSync(join(OUT_DIR, 'index.html'), renderIndex(playable), 'utf8')
  console.log(`✓ Generated ${playable.length} map guides + index in public/guides/`)
  console.log(`  Maps: ${playable.map((m) => m.id).join(', ')}`)
}

main()
