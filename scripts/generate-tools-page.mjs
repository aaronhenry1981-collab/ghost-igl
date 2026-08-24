#!/usr/bin/env node
// Generates an R6-only tools page. The public product story must match the
// product a visitor can buy today.

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://r6coaching.com'
const escape = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const TOOLS = [
  ['Strats Browser', '/strats', 'Site-by-site R6 breakdowns for operator choices, callouts, utility, and post-plant plans.', 'Rainbow Six'],
  ['Loadouts', '/loadouts', 'Choose an R6 operator, weapon, and setup that fits the job you are playing.', 'Rainbow Six'],
  ['Match Prep', '/match-prep', 'Build a short plan for bans, picks, roles, and callouts before the round starts.', 'Rainbow Six'],
  ['Operator Catalog', '/operators', 'Browse Rainbow Six operators by name, role, and kit before you queue.', 'Rainbow Six'],
  ['Meta Board', '/meta', 'Use the R6 pick-and-ban reference by map to check the current context.', 'Rainbow Six'],
  ['VOD Review', '/vod', 'Submit screenshots for feedback tied to the round you actually played.', 'Pro'],
  ['R6 Map Guides', '/guides/', 'Static Rainbow Six map, site, and operator guides. No account required.', 'Free R6 guides'],
  ['Rank-Up Guides', '/blog/', 'Rainbow Six rank-up guides and operator references.', 'R6 guides'],
]

const title = 'Recon 6 Tools — Rainbow Six Siege Strategy & VOD Review'
const description = 'Rainbow Six Siege strats, loadouts, match preparation, operator reference, VOD review, and meta tools in one place. Start with free R6 reference tools; Pro adds AI VOD review.'
const cards = TOOLS.map(([name, href, summary, pill]) => `
  <a href="${escape(href)}" class="card"><div class="card-head"><strong>${escape(name)}</strong><span>${escape(pill)}</span></div><p>${escape(summary)}</p></a>`).join('')

const html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escape(title)}</title><meta name="description" content="${escape(description)}" />
<link rel="canonical" href="${SITE}/tools/" /><meta name="robots" content="index, follow, max-image-preview:large" />
<meta property="og:type" content="website" /><meta property="og:title" content="${escape(title)}" /><meta property="og:description" content="${escape(description)}" /><meta property="og:url" content="${SITE}/tools/" /><meta property="og:image" content="${SITE}/og-image.png" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" /><style>
:root{color-scheme:dark;--accent:#00e5ff}*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0a0f19;color:#e6e9ef;line-height:1.6}.container{max-width:1080px;margin:0 auto;padding:1.5rem}.nav{padding:.75rem 0;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:1.5rem}.nav a{color:var(--accent);text-decoration:none;margin-right:1rem;font-weight:600;font-size:.9rem}.hero{text-align:center;padding:2rem 0 2.25rem}.badge{display:inline-block;padding:4px 14px;background:rgba(0,229,255,.06);border:1px solid rgba(0,229,255,.4);border-radius:999px;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin-bottom:1rem;font-weight:700}h1{font-size:2.6rem;margin:0 0 .5rem;line-height:1.1}h1 span,h2{color:var(--accent)}.lead{font-size:1.1rem;color:rgba(230,233,239,.85);max-width:720px;margin:0 auto}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:.85rem}.card{display:block;padding:1.1rem 1.25rem;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);border-left:3px solid var(--accent);border-radius:12px;text-decoration:none;color:inherit}.card:hover{background:rgba(255,255,255,.05)}.card-head{display:flex;justify-content:space-between;gap:.5rem}.card-head strong{color:#fff}.card-head span{font-size:.7rem;color:rgba(230,233,239,.55)}.card p{margin:.4rem 0 0;color:rgba(230,233,239,.78);font-size:.9rem}.pricing{padding:1.5rem 1.75rem;background:rgba(0,229,255,.08);border:1px solid var(--accent);border-radius:14px;margin:2.5rem 0;text-align:center}.cta{display:inline-block;padding:.7rem 1.4rem;background:var(--accent);color:#0a0f19;font-weight:700;border-radius:8px;text-decoration:none}footer{margin-top:3rem;padding:1.5rem 0;border-top:1px solid rgba(255,255,255,.08);color:rgba(230,233,239,.5);font-size:.85rem;text-align:center}</style></head>
<body><main class="container"><nav class="nav"><a href="/">Recon 6</a><a href="/guides/">Map guides</a><a href="/blog/">Blog</a><a href="/#pricing">Pricing</a></nav>
<section class="hero"><div class="badge">Recon 6 Tools</div><h1>Every <span>R6 Tool</span> in One Place</h1><p class="lead">Use the Rainbow Six reference tool that matches the job: prepare the round, review your match, and keep one clear practice focus.</p></section>
<h2>The R6 Coaching Toolkit</h2><section class="grid">${cards}</section>
<section class="pricing"><h3>Start with the free R6 reference tools. Pro adds AI VOD review.</h3><p>Pro includes a 30-day card-required trial, then bills at the price shown at checkout. Review each plan’s included tools before you subscribe.</p><a href="/#pricing" class="cta">See pricing &rarr;</a></section>
<footer>Recon 6 — Rainbow Six Siege coaching. Fan-made, not affiliated with Ubisoft.</footer></main></body></html>`

const out = join(ROOT, 'public', 'tools')
mkdirSync(out, { recursive: true })
writeFileSync(join(out, 'index.html'), html)
console.log('✓ Generated R6-only /tools/index.html')
