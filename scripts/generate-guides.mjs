#!/usr/bin/env node
// Generates static SEO guide pages for each playable map.
// Hash-routed React pages can't be crawled; these static HTML files can.
// Run: node scripts/generate-guides.mjs
// Output: public/guides/<map-id>.html + public/guides/index.html

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import MAPS from '../src/data/maps.js'
import STRATS from '../src/data/strats.js'
import BANS from '../src/data/bans.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'guides')

const SITE_URL = 'https://r6coaching.com'

function escape(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#0a0f19" />
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
      background: #0a0f19;
      color: #e6e9ef;
      line-height: 1.6;
    }
    a { color: #00e5ff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .nav { padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; }
    .brand { font-weight: 900; letter-spacing: 0.06em; color: #fff; text-decoration: none; }
    .brand span { color: #00e5ff; }
    .nav-links a { margin-left: 18px; color: rgba(230,233,239,0.85); font-size: 0.9rem; }
    main { max-width: 820px; margin: 0 auto; padding: 32px 24px 80px; }
    h1 { font-size: 2rem; margin: 0 0 8px; }
    .sub { color: rgba(230,233,239,0.7); margin-bottom: 24px; font-size: 0.95rem; }
    .cta-top {
      display: inline-block; padding: 10px 18px; background: linear-gradient(90deg, #00e5ff, #00b4d8);
      color: #051117; font-weight: 700; border-radius: 6px; text-decoration: none; margin-bottom: 28px;
    }
    .site { margin-bottom: 36px; padding: 22px; background: rgba(255,255,255,0.03); border: 1px solid rgba(0,229,255,0.15); border-radius: 10px; }
    .site h2 { margin: 0 0 14px; font-size: 1.3rem; color: #fff; }
    .side { margin: 18px 0; padding: 14px 16px; background: rgba(10,15,25,0.5); border-left: 3px solid; border-radius: 0 6px 6px 0; }
    .side.attack { border-left-color: #ff8060; }
    .side.defense { border-left-color: #50b4ff; }
    .side h3 { margin: 0 0 10px; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.08em; }
    .side.attack h3 { color: #ff8060; }
    .side.defense h3 { color: #50b4ff; }
    .ops { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 12px; }
    .op { padding: 4px 10px; background: rgba(0,229,255,0.08); border: 1px solid rgba(0,229,255,0.3); border-radius: 4px; font-size: 0.85rem; color: #c0f4fc; }
    .op.essential { background: rgba(0,229,255,0.16); border-color: #00e5ff; font-weight: 700; }
    .strategy { margin: 8px 0; color: rgba(230,233,239,0.9); }
    .callouts { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
    .callout { padding: 2px 8px; background: rgba(255,255,255,0.05); border-radius: 3px; font-size: 0.78rem; color: rgba(230,233,239,0.85); }
    .deep-link { display: inline-block; margin-top: 10px; font-size: 0.88rem; }
    .bans { margin-top: 12px; padding: 14px 16px; background: rgba(255,70,90,0.05); border: 1px solid rgba(255,70,90,0.2); border-radius: 8px; }
    .bans h4 { margin: 0 0 8px; color: #ff8899; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.08em; }
    .bans ul { margin: 0; padding-left: 18px; }
    .bans li { margin-bottom: 4px; font-size: 0.9rem; }
    .intro-cta { padding: 24px; background: linear-gradient(180deg, rgba(0,229,255,0.06), rgba(10,15,25,0.6)); border: 1px solid rgba(0,229,255,0.2); border-radius: 12px; margin: 32px 0; text-align: center; }
    .intro-cta h3 { margin: 0 0 6px; }
    .intro-cta p { margin: 0 0 12px; color: rgba(230,233,239,0.8); }
    .btn { display: inline-block; padding: 10px 20px; background: #00e5ff; color: #051117; font-weight: 700; border-radius: 6px; text-decoration: none; }
    .footer-strip { max-width: 820px; margin: 40px auto; padding: 0 24px; color: rgba(230,233,239,0.5); font-size: 0.82rem; text-align: center; }
    @media (max-width: 600px) {
      main { padding: 20px 16px 40px; }
      h1 { font-size: 1.5rem; }
      .site { padding: 16px; }
    }
  </style>
</head>
<body>
  <nav class="nav">
    <a class="brand" href="${SITE_URL}/">RECON<span>6</span></a>
    <div class="nav-links">
      <a href="${SITE_URL}/guides/">All guides</a>
      <a href="${SITE_URL}/strats">Interactive strats</a>
      <a href="${SITE_URL}/#pricing">Pricing</a>
    </div>
  </nav>
  <main>
    ${bodyInner}
  </main>
  <div class="footer-strip">
    <p>&copy; Recon 6 — AI-powered Rainbow Six Siege coaching. <a href="${SITE_URL}/">r6coaching.com</a></p>
  </div>
</body>
</html>`
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
      if (!strat) return ''
      const canonicalSite = `${SITE_URL}/strats/${map.id}/${site.id}/attack`
      return `
        <section class="site" id="${escape(site.id)}">
          <h2>${escape(site.floor)} &mdash; ${escape(site.name)}</h2>
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
  const description = `Complete Rainbow Six Siege strategy guide for ${map.name}: operator picks, callouts, utility usage, and ban recommendations for every bomb site (${siteNames}). Attack and defense strats for ranked play.`

  const bodyInner = `
    <h1>${escape(map.name)} — Complete Strategy Guide</h1>
    <p class="sub">Operator picks, callouts, utility, and ban recommendations for every bomb site. Free tactical guide from Recon 6.</p>
    <a class="cta-top" href="${SITE_URL}/strats/${map.id}">Open interactive ${escape(map.name)} strats &rarr;</a>
    ${bansHtml}
    ${siteSections}
    <div class="intro-cta">
      <h3>Want the full utility breakdown + AI VOD review?</h3>
      <p>Recon 6 Pro unlocks per-operator utility placement, enemy predictions, and AI-powered Rainbow Six gameplay analysis.</p>
      <a class="btn" href="${SITE_URL}/#pricing">See plans</a>
    </div>

    </div>`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${map.name} — Complete Rainbow Six Siege Strategy Guide`,
    description,
    author: { '@type': 'Organization', name: 'Recon 6' },
    publisher: { '@type': 'Organization', name: 'Recon 6', logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-image.png` } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/guides/${map.id}.html` },
    inLanguage: 'en-US',
  }

  return htmlShell({
    title: `${map.name} Strategy Guide — Recon 6 (R6 Siege)`,
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
  if (!strat) return null

  const canonical = `${SITE_URL}/guides/${map.id}/${site.id}.html`
  const slug = `${map.name} ${site.name}`
  const title = `${slug} — Attack & Defense Strats (R6 Siege) | Recon 6`
  const description = `${map.name} ${site.name} (${site.floor}) Rainbow Six Siege strategy: attack lineup, defense setup, callouts, and utility usage. Free tactical guide.`

  // Sibling sites for internal linking — Google rewards a tight cluster.
  const siblingsHtml = map.sites
    .filter((s) => s.id !== site.id && STRATS[map.id]?.[s.id])
    .map((s) => `<li><a href="/guides/${map.id}/${escape(s.id)}.html">${escape(s.name)}</a> <span style="color:rgba(230,233,239,0.5);font-size:0.8rem">(${escape(s.floor)})</span></li>`)
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
    <nav class="breadcrumb" style="font-size:0.85rem;color:rgba(230,233,239,0.6);margin-bottom:8px">
      <a href="/guides/">Map Guides</a> ›
      <a href="/guides/${map.id}.html">${escape(map.name)}</a> ›
      <span>${escape(site.name)}</span>
    </nav>
    <h1>${escape(map.name)} — ${escape(site.name)} <span style="color:rgba(230,233,239,0.55);font-weight:400;font-size:0.7em">(${escape(site.floor)})</span></h1>
    <p class="sub">Operator picks, callouts, utility, and bans for ${escape(site.name)} on ${escape(map.name)}. Both attack and defense covered.</p>
    <a class="cta-top" href="${SITE_URL}/strats/${map.id}/${site.id}/attack">Open interactive ${escape(site.name)} strat &rarr;</a>

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

    <div class="intro-cta">
      <h3>Want full utility placement + AI VOD review?</h3>
      <p>Recon 6 Pro unlocks per-operator utility breakdown, enemy predictions, and AI-powered gameplay analysis. Founding rate $9/mo before May 31.</p>
      <a class="btn" href="${SITE_URL}/#pricing">See plans</a>
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: `${map.name} ${site.name} — Rainbow Six Siege Attack & Defense Strategy`,
        description,
        author: { '@type': 'Organization', name: 'Recon 6' },
        publisher: { '@type': 'Organization', name: 'Recon 6', logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-image.png` } },
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        isPartOf: { '@type': 'WebPage', '@id': `${SITE_URL}/guides/${map.id}.html` },
        inLanguage: 'en-US',
      },
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
      .guide-card a { display: block; padding: 18px 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(0,229,255,0.15); border-radius: 10px; color: inherit; text-decoration: none; transition: background 0.15s, border-color 0.15s; }
      .guide-card a:hover { background: rgba(0,229,255,0.06); border-color: #00e5ff; text-decoration: none; }
      .guide-card h3 { margin: 0 0 4px; color: #00e5ff; }
      .guide-card p { margin: 0; color: rgba(230,233,239,0.75); font-size: 0.9rem; }
    </style>
    <ul class="guide-grid">
      ${cards}
    </ul>
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
