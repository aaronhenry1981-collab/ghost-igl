#!/usr/bin/env node
// Generates static SEO guide pages for each playable map.
// Hash-routed React pages can't be crawled; these static HTML files can.
// Run: node scripts/generate-guides.mjs
// Output: public/guides/<map-id>.html + public/guides/index.html

import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import MAPS from '../src/data/maps.js'
import STRATS from '../src/data/public-strats.generated.js'
import BANS from '../src/data/public-bans.generated.js'
import {
  ARTICLE_CSS, SITE_URL, TEMPLATE_REVISED, articleSchema, bylineHtml, figureHtml, firstPublished,
  fitDescription, fitTitle, footerHtml, mapSources, navHtml, sourcesHtml,
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
const mapFigure = (map, caption) => figureHtml({
  src: `/guides/og/${map.id}.svg`,
  alt: `${map.name} map card from Recon 6's Rainbow Six Siege guide`,
  caption,
})

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

// A site whose plan was withdrawn (maps.js notice.kind 'unavailable'). Its
// page is still written, so the copy already on S3 (deploys never delete) is
// replaced by the notice instead of the old plan.
const isWithdrawn = (site) => site?.notice?.kind === 'unavailable'

function renderWithdrawnSite(map, site) {
  const others = map.sites
    .filter((s) => s.id !== site.id && STRATS[map.id]?.[s.id])
    .map((s) => `<li><a href="/guides/${map.id}/${escape(s.id)}.html">${escape(s.name)}</a> <span style="color:rgba(235,228,215,0.5);font-size:0.8rem">(${escape(s.floor)})</span></li>`)
    .join('')
  const bodyInner = `
    <nav class="breadcrumb" style="font-size:0.85rem;color:rgba(235,228,215,0.6);margin-bottom:8px">
      <a href="/guides/">Map Guides</a> ›
      <a href="/guides/${map.id}.html">${escape(map.name)}</a> ›
      <span>${escape(site.name)}</span>
    </nav>
    <h1>${escape(map.name)} — ${escape(site.name)}</h1>${siteNoticeHtml(site)}
    ${others ? `<h3>Current ${escape(map.name)} site plans</h3><ul>${others}</ul>` : ''}`
  return htmlShell({
    title: `${map.name} ${site.name} — plan withdrawn | Recon 6`,
    description: `The ${map.name} ${site.name} plan was withdrawn after Ubisoft changed the site. The other ${map.name} sites are current.`,
    canonical: `${SITE_URL}/guides/${map.id}/${site.id}.html`,
    bodyInner,
    extraHead: '<meta name="robots" content="noindex" />',
  })
}

function htmlShell({ title, description, canonical, bodyInner, extraHead = '', ogImage, jsonLd, breadcrumbs }) {
  const ogImageUrl = ogImage || `${SITE_URL}/og-image.png`
  // Compose JSON-LD: optional Article + optional BreadcrumbList. Both improve
  // Google SERP appearance (rich results) and don't bloat the page much.
  const ldBlocks = []
  if (jsonLd) ldBlocks.push(jsonLd)
  if (breadcrumbs && breadcrumbs.length) {
    ldBlocks.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: b.name,
        item: b.url,
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
    body {
      margin: 0;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: #121211;
      color: #ebe4d7;
      line-height: 1.6;
    }
    a { color: #f07430; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .nav { padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; }
    .brand { font-weight: 900; letter-spacing: 0.06em; color: #fff; text-decoration: none; }
    .brand span { color: #f07430; }
    .nav-links a { margin-left: 18px; color: rgba(235,228,215,0.85); font-size: 0.9rem; }
    main { max-width: 820px; margin: 0 auto; padding: 32px 24px 80px; }
    h1 { font-size: 2rem; margin: 0 0 8px; }
    .sub { color: rgba(235,228,215,0.7); margin-bottom: 24px; font-size: 0.95rem; }
    .cta-top {
      display: inline-block; padding: 10px 18px; background: linear-gradient(90deg, #f07430, #ed6212);
      color: #0f0e0d; font-weight: 700; border-radius: 6px; text-decoration: none; margin-bottom: 28px;
    }
    .site { margin-bottom: 36px; padding: 22px; background: rgba(255,255,255,0.03); border: 1px solid rgba(240,116,48,0.15); border-radius: 10px; }
    .site h2 { margin: 0 0 14px; font-size: 1.3rem; color: #fff; }
    .side { margin: 18px 0; padding: 14px 16px; background: rgba(18,18,17,0.5); border-left: 3px solid; border-radius: 0 6px 6px 0; }
    .side.attack { border-left-color: #ff8060; }
    .side.defense { border-left-color: #50b4ff; }
    .side h3 { margin: 0 0 10px; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.08em; }
    .side.attack h3 { color: #ff8060; }
    .side.defense h3 { color: #50b4ff; }
    .ops { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 12px; }
    .op { padding: 4px 10px; background: rgba(240,116,48,0.08); border: 1px solid rgba(240,116,48,0.3); border-radius: 4px; font-size: 0.85rem; color: #fad6c2; }
    .op.essential { background: rgba(240,116,48,0.16); border-color: #f07430; font-weight: 700; }
    .strategy { margin: 8px 0; color: rgba(235,228,215,0.9); }
    .callouts { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
    .callout { padding: 2px 8px; background: rgba(255,255,255,0.05); border-radius: 3px; font-size: 0.78rem; color: rgba(235,228,215,0.85); }
    .deep-link { display: inline-block; margin-top: 10px; font-size: 0.88rem; }
    .bans { margin-top: 12px; padding: 14px 16px; background: rgba(255,70,90,0.05); border: 1px solid rgba(255,70,90,0.2); border-radius: 8px; }
    .bans h4 { margin: 0 0 8px; color: #ff8899; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.08em; }
    .bans ul { margin: 0; padding-left: 18px; }
    .bans li { margin-bottom: 4px; font-size: 0.9rem; }
    .intro-cta { padding: 24px; background: linear-gradient(180deg, rgba(240,116,48,0.06), rgba(18,18,17,0.6)); border: 1px solid rgba(240,116,48,0.2); border-radius: 12px; margin: 32px 0; text-align: center; }
    .intro-cta h3 { margin: 0 0 6px; }
    .intro-cta p { margin: 0 0 12px; color: rgba(235,228,215,0.8); }
    .btn { display: inline-block; padding: 10px 20px; background: #f07430; color: #0f0e0d; font-weight: 700; border-radius: 6px; text-decoration: none; }
    .footer-strip { max-width: 820px; margin: 40px auto; padding: 0 24px; color: rgba(235,228,215,0.5); font-size: 0.82rem; text-align: center; }
    .definition { font-size: 1.02rem; color: rgba(235,228,215,0.92); }
    .related-links { margin-top: 32px; padding: 20px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; }
    .related-links h2 { margin: 0 0 10px; font-size: 1.1rem; }
    .related-links ul { margin: 0; padding-left: 18px; }${ARTICLE_CSS}
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

function renderSide(side, strat) {
  if (!strat) return ''
  const essentials = strat.operators.filter((o) => o.priority === 'essential').map((o) => o.name)
  const recommended = strat.operators.filter((o) => o.priority === 'recommended').map((o) => o.name)
  const flex = strat.operators.filter((o) => o.priority === 'flex').map((o) => o.name)
  return `
    <div class="side ${side}">
      <h3>${side}</h3>
      <div class="ops">
        ${essentials.map((n) => `<span class="op essential">${escape(n)}</span>`).join('')}
        ${recommended.map((n) => `<span class="op">${escape(n)}</span>`).join('')}
        ${flex.map((n) => `<span class="op">${escape(n)}</span>`).join('')}
      </div>
      <p class="strategy">${escape(strat.strategy)}</p>
      <div class="callouts">
        ${(strat.callouts || []).map((c) => `<span class="callout">${escape(c)}</span>`).join('')}
      </div>
    </div>`
}

function renderMapGuide(map) {
  const siteSections = map.sites
    .map((site) => {
      const strat = STRATS[map.id]?.[site.id]
      if (!strat && isWithdrawn(site)) {
        return `
        <section class="site" id="${escape(site.id)}">
          <h2>${escape(site.floor)} &mdash; ${escape(site.name)}</h2>${siteNoticeHtml(site)}
        </section>`
      }
      if (!strat) return ''
      const canonicalSite = `${SITE_URL}/strats/${map.id}/${site.id}/attack`
      return `
        <section class="site" id="${escape(site.id)}">
          <h2>${escape(site.floor)} &mdash; ${escape(site.name)}</h2>${siteNoticeHtml(site)}
          ${renderSide('attack', strat.attack)}
          ${renderSide('defense', strat.defense)}
          <a class="deep-link" href="${canonicalSite}">Open full interactive strat &rarr;</a>
        </section>`
    })
    .join('\n')

  const bans = BANS[map.id]
  let bansHtml = ''
  if (bans) {
    bansHtml = `
      <div class="bans">
        <h4>Ban recommendations</h4>
        <ul>
          ${(bans.attack || []).map((b) => `<li><strong>${escape(b.name)}</strong> (attack) — ${escape(b.reason)}</li>`).join('')}
          ${(bans.defense || []).map((b) => `<li><strong>${escape(b.name)}</strong> (defense) — ${escape(b.reason)}</li>`).join('')}
        </ul>
      </div>`
  }

  const siteNames = map.sites.map((s) => s.name).join(', ')
  const shortNames = map.sites.map((s) => siteLabel(map, s))
  const description = fitDescription(
    `Rainbow Six Siege strategy preview for ${map.name}: operator picks, a short execute overview, and key callouts for every bomb site (${siteNames}).`,
    `${map.name} guide for Rainbow Six Siege: operator picks, a short execute overview and the key callouts for all ${map.sites.length} bomb sites.`,
  )
  const url = `${SITE_URL}/guides/${map.id}.html`
  const datePublished = firstPublished(join(OUT_DIR, `${map.id}.html`))

  const siteGuideLinks = map.sites
    .filter((s) => STRATS[map.id]?.[s.id])
    .map((s) => ({ name: `${map.name} ${siteLabel(map, s)} guide`, url: `/guides/${map.id}/${s.id}.html` }))

  const bodyInner = `
    <nav class="breadcrumb" style="font-size:0.85rem;color:rgba(235,228,215,0.6);margin-bottom:8px">
      <a href="/guides/">Map Guides</a> ›
      <span>${escape(map.name)}</span>
    </nav>
    <h1>${escape(map.name)} — Complete Strategy Guide</h1>
    ${bylineHtml({ datePublished, dateModified: TEMPLATE_REVISED, kind: 'guide' })}
    <p class="definition">${escape(map.name)} is a Rainbow Six Siege map with ${map.sites.length} bomb sites: ${escape(shortNames.join(', '))}. For each one, this guide gives the operator picks, a short execute overview and the key callouts.</p>
    <p class="sub">Full utility and ban intel unlock after sign-in.</p>
    <a class="cta-top" href="${SITE_URL}/strats/${map.id}">Open interactive ${escape(map.name)} strats &rarr;</a>
    ${mapFigure(map, `${map.name}: ${shortNames.join(', ')}`)}
    ${bansHtml}
    ${siteSections}
    ${relatedHtml(`More on ${map.name}`, [
      ...siteGuideLinks,
    ])}
    ${sourcesHtml(mapSources(map.id, map.name))}
    <div class="intro-cta">
      <h3>The full ${escape(map.name)} plan is in Pro</h3>
      <p>Utility for every operator on every ${escape(map.name)} site, and AI review of your own rounds.</p>
      <a class="btn" href="${SITE_URL}/pricing">See plans</a>
    </div>`

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
    canonical: `${SITE_URL}/guides/${map.id}.html`,
    bodyInner,
    jsonLd,
    breadcrumbs: [
      { name: 'Recon 6', url: SITE_URL },
      { name: 'Map Guides', url: `${SITE_URL}/guides/` },
      { name: map.name, url: `${SITE_URL}/guides/${map.id}.html` },
    ],
    ogImage: `${SITE_URL}/guides/og/${map.id}.svg`,
  })
}

// Per-site SEO pages — one per (map, site) covering both attack and defense.
// Targets long-tail queries like "bank ceo defense strat", "kafe cocktail
// callouts", which are the actual searches an R6 player runs mid-prep.
// Higher specificity = less competition = easier to rank.
function renderSiteGuide(map, site) {
  const strat = STRATS[map.id]?.[site.id]
  if (!strat && isWithdrawn(site)) return renderWithdrawnSite(map, site)
  if (!strat) return null

  const canonical = `${SITE_URL}/guides/${map.id}/${site.id}.html`
  const label = siteLabel(map, site)
  // Distinct from the app's /strats/<map>/<site> titles ("… Strats: Attack & Defense").
  const title = fitTitle(
    `${map.name} ${label} Guide: Operators & Callouts | Recon 6`,
    `${map.name} ${label} Guide | Recon 6`,
    `${label} on ${map.name}: R6 Site Guide`,
    `${label} Site Guide (${map.name})`,
  )
  const description = fitDescription(
    `${map.name} ${site.name} (${site.floor}) Rainbow Six Siege strategy: attack lineup, defense setup, callouts, and utility usage. Free tactical guide.`,
    `${map.name} ${label} (${site.floor}) Rainbow Six Siege strategy: attack lineup, defense setup, callouts, and utility usage. Free tactical guide.`,
    `${label} on ${map.name} in Rainbow Six Siege: the attack lineup, the defense setup and the callouts, in one free guide.`,
  )
  const datePublished = firstPublished(join(OUT_DIR, map.id, `${site.id}.html`))
  const essentialOps = [...new Set(['attack', 'defense'].flatMap((side) =>
    (strat[side]?.operators || []).filter((o) => o.priority === 'essential').map((o) => o.name)))]

  // Sibling sites for internal linking — Google rewards a tight cluster.
  const siblingsHtml = map.sites
    .filter((s) => s.id !== site.id && STRATS[map.id]?.[s.id])
    .map((s) => `<li><a href="/guides/${map.id}/${escape(s.id)}.html">${escape(s.name)}</a> <span style="color:rgba(235,228,215,0.5);font-size:0.8rem">(${escape(s.floor)})</span></li>`)
    .join('')

  const bans = BANS[map.id]
  let bansHtml = ''
  if (bans) {
    bansHtml = `
      <div class="bans">
        <h4>Map-wide ban recommendations (${escape(map.name)})</h4>
        <ul>
          ${(bans.attack || []).map((b) => `<li><strong>${escape(b.name)}</strong> (attack ban) — ${escape(b.reason)}</li>`).join('')}
          ${(bans.defense || []).map((b) => `<li><strong>${escape(b.name)}</strong> (defense ban) — ${escape(b.reason)}</li>`).join('')}
        </ul>
      </div>`
  }

  const bodyInner = `
    <nav class="breadcrumb" style="font-size:0.85rem;color:rgba(235,228,215,0.6);margin-bottom:8px">
      <a href="/guides/">Map Guides</a> ›
      <a href="/guides/${map.id}.html">${escape(map.name)}</a> ›
      <span>${escape(site.name)}</span>
    </nav>
    <h1>${escape(map.name)} — ${escape(site.name)} <span style="color:rgba(235,228,215,0.55);font-weight:400;font-size:0.7em">(${escape(site.floor)})</span></h1>
    ${bylineHtml({ datePublished, dateModified: TEMPLATE_REVISED, kind: 'guide' })}
    <p class="definition">${escape(site.name)} is a ${escape(site.floor)} bomb site on ${escape(map.name)} in Rainbow Six Siege. This guide gives the attack lineup, the defense setup and the callouts for it.</p>${siteNoticeHtml(site)}
    <a class="cta-top" href="${SITE_URL}/strats/${map.id}/${site.id}/attack">Open interactive ${escape(site.name)} strat &rarr;</a>
    ${mapFigure(map, `${map.name} — ${site.name} (${site.floor})`)}

    <section class="site" id="${escape(site.id)}">
      <h2>${escape(site.floor)} &mdash; ${escape(site.name)}</h2>
      ${renderSide('attack', strat.attack)}
      ${renderSide('defense', strat.defense)}
    </section>

    ${bansHtml}

    ${
      siblingsHtml
        ? `<section style="margin-top:32px;padding:20px;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:8px">
            <h3 style="margin-top:0">Other ${escape(map.name)} bomb sites</h3>
            <ul style="margin:0;padding-left:18px">${siblingsHtml}</ul>
          </section>`
        : ''
    }

    ${relatedHtml(`Related ${map.name} guides`, [
      { name: `${map.name} map guide`, url: `/guides/${map.id}.html` },
      ...essentialOps.slice(0, 4).map((name) => ({ name: `${name} operator guide`, url: `/guides/operators/${operatorSlug(name)}.html` })),
    ])}
    ${sourcesHtml(mapSources(map.id, map.name))}

    <div class="intro-cta">
      <h3>Run the full ${escape(label)} plan</h3>
      <p>Pro adds the utility for every operator on ${escape(label)}, and AI review of your own rounds.</p>
      <a class="btn" href="${SITE_URL}/pricing">See plans</a>
    </div>`

  // Layered JSON-LD via @graph — Article + HowTo + breadcrumbs in one block.
  // HowTo schema captures Google's "how to do X" SERP rich-results card,
  // which is huge for queries like "how to attack bank ceo office".
  const howToSteps = []
  if (strat.attack) {
    howToSteps.push({
      '@type': 'HowToStep',
      name: `Attack ${site.name} on ${map.name}`,
      text: strat.attack.strategy?.slice(0, 500) || `Execute the standard attack on ${site.name}.`,
      url: `${canonical}#attack`,
    })
  }
  if (strat.defense) {
    howToSteps.push({
      '@type': 'HowToStep',
      name: `Defend ${site.name} on ${map.name}`,
      text: strat.defense.strategy?.slice(0, 500) || `Hold ${site.name} as defenders.`,
      url: `${canonical}#defense`,
    })
  }
  const { '@context': _context, ...article } = articleSchema({
    headline: `${map.name} ${site.name} — Rainbow Six Siege Attack & Defense Strategy`,
    description,
    url: canonical,
    datePublished,
    dateModified: TEMPLATE_REVISED,
    image: `${SITE_URL}/og-image.png`,
    section: 'Site guides',
  })
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { ...article, isPartOf: { '@type': 'WebPage', '@id': `${SITE_URL}/guides/${map.id}.html` } },
      {
        '@type': 'HowTo',
        name: `How to play ${site.name} on ${map.name}`,
        description: `Step-by-step strategy for both attack and defense on ${map.name}'s ${site.name}.`,
        totalTime: 'PT3M',
        step: howToSteps,
      },
    ],
  }

  return htmlShell({
    title,
    description,
    canonical,
    bodyInner,
    jsonLd,
    breadcrumbs: [
      { name: 'Recon 6', url: SITE_URL },
      { name: 'Map Guides', url: `${SITE_URL}/guides/` },
      { name: map.name, url: `${SITE_URL}/guides/${map.id}.html` },
      { name: site.name, url: canonical },
    ],
    ogImage: `${SITE_URL}/guides/og/${map.id}.svg`,
  })
}

function renderIndex(mapsWithStrats) {
  const cards = mapsWithStrats
    .map(
      (m) => `
        <li class="guide-card">
          <a href="${escape(m.id)}.html">
            <h3>${escape(m.name)}</h3>
            <p>${m.sites.length} bomb sites · Attack &amp; defense strats · Ban recommendations</p>
          </a>
        </li>`,
    )
    .join('\n')

  const bodyInner = `
    <h1>Recon 6 — Rainbow Six Siege Map Guides</h1>
    <p class="sub">Free strategy guides for every map in the ranked pool. Operators, callouts, utility, and bans for every bomb site.</p>
    <style>
      .guide-grid { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
      .guide-card a { display: block; padding: 18px 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(240,116,48,0.15); border-radius: 10px; color: inherit; text-decoration: none; transition: background 0.15s, border-color 0.15s; }
      .guide-card a:hover { background: rgba(240,116,48,0.06); border-color: #f07430; text-decoration: none; }
      .guide-card h3 { margin: 0 0 4px; color: #f07430; }
      .guide-card p { margin: 0; color: rgba(235,228,215,0.75); font-size: 0.9rem; }
    </style>
    <ul class="guide-grid">
      ${cards}
    </ul>
    ${relatedHtml('More guides', [
      { name: "Operator guides: every operator in Recon 6's plans", url: '/guides/operators/' },
      { name: 'Blog: rank-up guides and operator deep dives', url: '/blog/' },
      { name: 'Compare Recon 6 with a coach, free guides and other tools', url: '/compare/' },
    ])}
    <div class="intro-cta">
      <h3>Prefer the interactive tool?</h3>
      <p>Deep-linked strats with search, keyboard shortcuts, and personalized operator picks based on your main role.</p>
      <a class="btn" href="${SITE_URL}/strats">Open interactive strats &rarr;</a>
    </div>`

  return htmlShell({
    title: 'Rainbow Six Siege Strategy Guides — Recon 6',
    description: 'Free R6 Siege map strategy guides for every map in the ranked pool. Operator picks, callouts, utility, and ban recommendations for every bomb site.',
    canonical: `${SITE_URL}/guides/`,
    bodyInner,
  })
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  const playable = MAPS.filter((m) => !m.comingSoon && STRATS[m.id])
  let mapPages = 0
  let sitePages = 0

  for (const map of playable) {
    // Per-map landing page (already worked).
    const html = renderMapGuide(map)
    writeFileSync(join(OUT_DIR, `${map.id}.html`), html, 'utf8')
    mapPages++

    // Per-site SEO pages — one per (map, site) targeting long-tail queries.
    const mapDir = join(OUT_DIR, map.id)
    mkdirSync(mapDir, { recursive: true })
    const expectedSiteFiles = new Set(
      map.sites.filter((site) => STRATS[map.id]?.[site.id] || isWithdrawn(site)).map((site) => `${site.id}.html`),
    )
    for (const file of readdirSync(mapDir)) {
      if (file.endsWith('.html') && !expectedSiteFiles.has(file)) unlinkSync(join(mapDir, file))
    }
    for (const site of map.sites) {
      const siteHtml = renderSiteGuide(map, site)
      if (!siteHtml) continue
      writeFileSync(join(mapDir, `${site.id}.html`), siteHtml, 'utf8')
      sitePages++
    }
  }

  writeFileSync(join(OUT_DIR, 'index.html'), renderIndex(playable), 'utf8')

  console.log(`✓ Generated ${mapPages} map guides + ${sitePages} per-site guides + index in public/guides/`)
  console.log(`  Maps: ${playable.map((m) => m.id).join(', ')}`)
}

main()
