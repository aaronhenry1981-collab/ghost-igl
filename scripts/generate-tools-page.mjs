#!/usr/bin/env node
// Generates /tools/index.html â€” a discoverable landing page surfacing every
// customer tool (Strats, Loadouts, Match Prep, Operators, Meta, VOD Review,
// R6 catalogs). Captures generic search queries like "R6 coaching
// tools" and serves as a soft on-ramp for users who don't know where to
// start.

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SITE_URL = 'https://r6coaching.com'

function escape(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const TOOLS = [
  {
    id: 'strats',
    name: 'Strats Browser',
    href: '/strats',
    summary: 'Site-by-site Rainbow Six breakdowns. Picks, callouts, utility, and post-plant plans by side.',
    pill: 'Rainbow Six',
  },
  {
    id: 'loadouts',
    name: 'Loadouts',
    href: '/loadouts',
    summary: 'Rainbow Six weapon picks, gadget priorities, and operator combinations.',
    pill: 'Rainbow Six',
  },
  {
    id: 'match-prep',
    name: 'Match Prep Cheatsheet',
    href: '/match-prep',
    summary: 'One-screen pre-round prep. Bans, picks, callouts. Bookmark-able. Copy as text for Discord. Print-friendly.',
    pill: 'Rainbow Six',
  },
  {
    id: 'operators',
    name: 'Cast Catalog',
    href: '/operators',
    summary: 'Browse every Rainbow Six operator by name, role, and gadget. See where each one fits.',
    pill: 'Rainbow Six',
  },
  {
    id: 'meta',
    name: 'Meta Board',
    href: '/meta',
    summary: 'Aggregate competitive intel â€” top picks, most-banned characters, frequency across maps. Refreshed each season.',
    pill: 'Rainbow Six',
  },
  {
    id: 'vod',
    name: 'VOD Review',
    href: '/vod',
    summary: 'Drop a screenshot, get a specific fix. Round-by-round breakdowns with positioning, crosshair, and utility feedback.',
    pill: 'Rainbow Six',
  },
  {
    id: 'r6-guides',
    name: 'R6 Map Guides',
    href: '/guides/',
    summary: 'Static, indexable map + site + operator guides. No login required. 200+ pages across every R6 ranked map.',
    pill: 'R6 SEO surface',
  },
  {
    id: 'blog',
    name: 'Rank-Up Guides',
    href: '/blog/',
    summary: 'Structured Rainbow Six rank-up guides for improving decisions at every rank.',
    pill: 'R6 guides',
  },
]

const title = 'Rainbow Six Coaching Tools | Recon 6'
const description = 'Strats, loadouts, match prep, VOD review, meta board, and 60+ rank-up guides. Every tool Recon 6 ships, in one place. Free to browse â€” Pro unlocks the deep AI VOD review.'

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}" />
  <link rel="canonical" href="${SITE_URL}/tools/" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#0a0f19" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escape(title)}" />
  <meta property="og:description" content="${escape(description)}" />
  <meta property="og:url" content="${SITE_URL}/tools/" />
  <meta property="og:image" content="${SITE_URL}/og-image.png" />
  <meta property="og:site_name" content="Recon 6" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${SITE_URL}/og-image.png" />
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: `${SITE_URL}/tools/`,
    publisher: { '@type': 'Organization', name: 'Recon 6', url: SITE_URL },
  })}</script>
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Recon 6', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: `${SITE_URL}/tools/` },
    ],
  })}</script>
  <style>
    :root { color-scheme: dark; --accent: #00e5ff; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #0a0f19; color: #e6e9ef; line-height: 1.6; }
    .container { max-width: 1080px; margin: 0 auto; padding: 1.5rem; }
    .nav { padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 1.5rem; }
    .nav a { color: var(--accent); text-decoration: none; margin-right: 1rem; font-weight: 600; font-size: 0.9rem; }
    .hero { text-align: center; padding: 2rem 0 2.25rem; }
    .badge { display: inline-block; padding: 4px 14px; background: rgba(0,229,255,0.06); border: 1px solid rgba(0,229,255,0.4); border-radius: 999px; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); margin-bottom: 1rem; font-weight: 700; }
    h1 { font-size: 2.6rem; margin: 0 0 0.5rem; line-height: 1.1; }
    h1 .accent { color: var(--accent); }
    .lead { font-size: 1.1rem; color: rgba(230,233,239,0.85); max-width: 760px; margin: 0 auto; line-height: 1.55; }
    h2 { font-size: 1.35rem; margin: 2.25rem 0 0.85rem; color: var(--accent); }
    h2 .num { color: rgba(230,233,239,0.4); margin-right: 8px; font-size: 0.95rem; letter-spacing: 0.05em; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.85rem; }
    .card { display: block; padding: 1.1rem 1.25rem; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-left: 3px solid var(--accent); border-radius: 12px; text-decoration: none; color: inherit; transition: transform 0.12s, border-color 0.12s, background 0.12s; }
    .card:hover { transform: translateY(-2px); background: rgba(255,255,255,0.04); }
    .card-head { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; margin-bottom: 6px; }
    .card-head strong { font-size: 1.05rem; color: #fff; }
    .card-pill { font-size: 0.7rem; color: rgba(230,233,239,0.55); padding: 2px 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 999px; white-space: nowrap; font-weight: 600; }
    .card-summary { margin: 0; color: rgba(230,233,239,0.78); font-size: 0.88rem; line-height: 1.5; }
    .game-card { padding: 0.85rem 1rem; text-align: center; }
    .game-card-name { font-weight: 700; font-size: 0.95rem; }
    .game-card-status { font-size: 0.7rem; padding: 2px 8px; border-radius: 999px; display: inline-block; margin-top: 4px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    .live-pill { color: #7ee2a4; background: rgba(80,200,120,0.14); border: 1px solid rgba(80,200,120,0.45); }
    .soon-pill { color: rgba(230,233,239,0.55); background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); }
    .pricing-cta { padding: 1.5rem 1.75rem; background: linear-gradient(135deg, rgba(0,229,255,0.08), rgba(180,140,255,0.08)); border: 1px solid var(--accent); border-radius: 14px; margin: 2.5rem 0; text-align: center; }
    .pricing-cta h3 { margin: 0 0 0.5rem; font-size: 1.25rem; }
    .pricing-cta p { margin: 0 0 1rem; color: rgba(230,233,239,0.85); }
    .cta { display: inline-block; padding: 0.7rem 1.4rem; background: var(--accent); color: #0a0f19; font-weight: 700; border-radius: 8px; text-decoration: none; }
    footer { margin-top: 3rem; padding: 1.5rem 0; border-top: 1px solid rgba(255,255,255,0.08); color: rgba(230,233,239,0.5); font-size: 0.85rem; text-align: center; }
    footer a { color: var(--accent); }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav">
      <a href="/">Recon 6</a>
      <a href="/guides/">R6 Guides</a>
      <a href="/blog/">Blog</a>
      <a href="/#pricing">Pricing</a>
    </div>

    <div class="hero">
      <div class="badge">Recon 6 Tools</div>
      <h1>Every <span class="accent">Tool</span> in One Place</h1>
      <p class="lead">
        Rainbow Six strats, loadouts, match prep, VOD review, meta intel, and rank-up guides. Free to browse. Pro unlocks deeper AI VOD analysis.
      </p>
    </div>

    <h2><span class="num">01</span>The Coaching Toolkit</h2>
    <div class="grid">
      ${TOOLS.map((t) => `
        <a href="${escape(t.href)}" class="card">
          <div class="card-head">
            <strong>${escape(t.name)}</strong>
            <span class="card-pill">${escape(t.pill)}</span>
          </div>
          <p class="card-summary">${escape(t.summary)}</p>
        </a>
      `).join('')}
    </div>

    <div class="pricing-cta">
      <h3>Most of these tools are free. Pro unlocks the AI VOD reviews.</h3>
      <p>Pro gets you 5-screenshot VOD breakdowns, ban intel, and opponent reads. Champion adds 10-screenshot multi-round sessions, recurring-weakness reports, every R6 map, premium tactics, and a weekly drill list.</p>
      <a href="/#pricing" class="cta">See pricing &rarr;</a>
    </div>

    <footer>
      <p>Recon 6 &mdash; coaching for Rainbow Six Siege.<br>
      Rainbow Six and its operators are property of Ubisoft. Fan-made, not affiliated.</p>
    </footer>
  </div>
</body>
</html>`

const outDir = join(ROOT, 'public', 'tools')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'index.html'), html)
console.log('âœ“ Generated /tools/index.html')

