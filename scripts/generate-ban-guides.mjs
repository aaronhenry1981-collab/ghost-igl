#!/usr/bin/env node
// Generates static SEO ban guide pages — one per map. Targets long-tail
// queries like "best operators to ban on Bank R6", "Kafe ban order", etc.
//
// Output: public/guides/bans/<map-id>.html + index page.
// Run: node scripts/generate-ban-guides.mjs

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import MAPS from '../src/data/maps.js'
import BANS from '../src/data/bans.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'guides', 'bans')
const SITE_URL = 'https://r6coaching.com'

function escape(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function htmlShell({ title, description, canonical, bodyInner, ogImage, jsonLd }) {
  const ogImageUrl = ogImage || `${SITE_URL}/og-image.png`
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
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escape(title)}" />
  <meta property="og:description" content="${escape(description)}" />
  <meta property="og:url" content="${escape(canonical)}" />
  <meta property="og:image" content="${escape(ogImageUrl)}" />
  <meta property="og:site_name" content="Recon 6" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${escape(ogImageUrl)}" />
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #0a0f19; color: #e6e9ef; line-height: 1.6; }
    .container { max-width: 880px; margin: 0 auto; padding: 1.5rem; }
    .nav { padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .nav a { color: #00e5ff; text-decoration: none; margin-right: 1rem; font-weight: 600; }
    .nav a:hover { text-decoration: underline; }
    h1 { font-size: 2rem; margin: 1.5rem 0 0.25rem; }
    .eyebrow { color: rgba(230,233,239,0.6); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.08em; }
    .lead { color: rgba(230,233,239,0.85); font-size: 1.05rem; margin: 1rem 0 1.5rem; }
    h2 { font-size: 1.3rem; margin: 2rem 0 0.5rem; color: #ff9b5c; }
    .ban-card { background: rgba(255,90,90,0.06); border: 1px solid rgba(255,90,90,0.3); border-left: 4px solid #ff5a5a; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1rem; }
    .ban-card.defense { background: rgba(90,180,255,0.06); border-color: rgba(90,180,255,0.3); border-left-color: #5a99ff; }
    .ban-name { font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .ban-reason { color: rgba(230,233,239,0.85); font-size: 0.95rem; }
    .cta { display: inline-block; padding: 0.7rem 1.4rem; background: #00e5ff; color: #0a0f19; font-weight: 700; border-radius: 8px; text-decoration: none; margin: 1.5rem 0; }
    .cta:hover { background: #5cf0ff; }
    footer { margin-top: 3rem; padding: 1.5rem 0; border-top: 1px solid rgba(255,255,255,0.08); color: rgba(230,233,239,0.5); font-size: 0.85rem; text-align: center; }
    footer a { color: #00e5ff; }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav">
      <a href="/">Recon 6</a>
      <a href="/guides/">Map Guides</a>
      <a href="/guides/operators/">Operators</a>
      <a href="/guides/bans/">Ban Guides</a>
    </div>
    ${bodyInner}
    <footer>
      <p>Recon 6 — AI-powered coaching for Rainbow Six Siege.<br>
      Operator names are property of Ubisoft Entertainment. Fan-made, not affiliated with Ubisoft.</p>
      <p><a href="${SITE_URL}/#/strats">Open the interactive strats tool →</a></p>
    </footer>
  </div>
</body>
</html>`
}

function banGuidePage(map) {
  const bans = BANS[map.id]
  if (!bans) return null

  const attackBansHtml = bans.attack.map(b => `
    <div class="ban-card">
      <div class="ban-name">${escape(b.name)} <span style="color:#ff5a5a; font-size:0.8rem; font-weight:600;">— ATTACK BAN</span></div>
      <p class="ban-reason">${escape(b.reason)}</p>
    </div>`).join('\n')

  const defenseBansHtml = bans.defense.map(b => `
    <div class="ban-card defense">
      <div class="ban-name">${escape(b.name)} <span style="color:#5a99ff; font-size:0.8rem; font-weight:600;">— DEFENSE BAN</span></div>
      <p class="ban-reason">${escape(b.reason)}</p>
    </div>`).join('\n')

  const description = `Best operators to ban on ${map.name} in Rainbow Six Siege ranked. ${bans.attack.length} attacker bans, ${bans.defense.length} defender bans, with reasoning per pick.`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${map.name} Ban Guide — R6 Siege`,
    description,
    author: { '@type': 'Organization', name: 'Recon 6' },
    publisher: { '@type': 'Organization', name: 'Recon 6', url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/guides/bans/${map.id}.html`,
  }

  const inner = `
    <div class="eyebrow">Ban Guide</div>
    <h1>${escape(map.name)} — Ban Order</h1>
    <p class="lead">Optimal ban targets for ${escape(map.name)} ranked play. Attack bans neutralize the most dangerous attacker operators against this map; defense bans neutralize the most oppressive defender setups.</p>

    <h2>Attack Bans (ban these attackers)</h2>
    ${attackBansHtml}

    <h2>Defense Bans (ban these defenders)</h2>
    ${defenseBansHtml}

    <h2>Want full strats?</h2>
    <p>Ban order is half the round. The other half is execute, anchor, and rotation reads.</p>
    <a class="cta" href="/guides/${map.id}.html">Open the ${escape(map.name)} strat guide →</a>
  `

  return htmlShell({
    title: `${map.name} Ban Order — R6 Siege Ranked Bans | Recon 6`,
    description,
    canonical: `${SITE_URL}/guides/bans/${map.id}.html`,
    bodyInner: inner,
    jsonLd,
  })
}

function indexPage(maps) {
  const itemsHtml = maps
    .filter(m => BANS[m.id])
    .map(m => {
      const ab = BANS[m.id].attack.map(x => x.name).join(', ')
      const db = BANS[m.id].defense.map(x => x.name).join(', ')
      return `<li>
        <a href="/guides/bans/${m.id}.html"><strong>${escape(m.name)}</strong></a>
        <div style="font-size:0.85rem; color:rgba(230,233,239,0.6); margin-top:4px;">
          Attack: ${escape(ab)} · Defense: ${escape(db)}
        </div>
      </li>`
    }).join('\n')

  const inner = `
    <div class="eyebrow">Ban Guides</div>
    <h1>R6 Siege Ban Order Guides</h1>
    <p class="lead">Optimal ban targets for every map in Recon 6's catalog. Save ban-phase mistakes that cost rounds before utility hits the ground.</p>
    <ul style="list-style:none; padding:0;">${itemsHtml.replace(/<li>/g, '<li style="padding:0.75rem; margin-bottom:6px; background:rgba(255,255,255,0.03); border-radius:8px; border-left:3px solid rgba(255,155,92,0.4);">')}</ul>
    <h2>Want full strats?</h2>
    <a class="cta" href="/guides/">Browse map guides →</a>
  `
  return htmlShell({
    title: 'R6 Siege Ban Order Guides — Per-Map Ban Recommendations | Recon 6',
    description: `Complete ban guide catalog for Rainbow Six Siege ranked play. Per-map ban recommendations across ${maps.filter(m => BANS[m.id]).length} maps.`,
    canonical: `${SITE_URL}/guides/bans/`,
    bodyInner: inner,
  })
}

mkdirSync(OUT_DIR, { recursive: true })
let written = 0
for (const map of MAPS) {
  const html = banGuidePage(map)
  if (!html) continue
  writeFileSync(join(OUT_DIR, `${map.id}.html`), html)
  written++
}
writeFileSync(join(OUT_DIR, 'index.html'), indexPage(MAPS))

console.log(`✓ Generated ${written} ban guides + index in public/guides/bans/`)
