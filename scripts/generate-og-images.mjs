#!/usr/bin/env node
// Generates per-map social preview images (1200x630 SVG) used as og:image for
// each guide page. SVG is chosen deliberately: no native rasterization deps,
// renders crisply on Discord / Twitter / modern FB crawlers. Older crawlers
// fall back to the default og-image.png at the site root.
//
// Run: node scripts/generate-og-images.mjs
// Output: public/guides/og/<map-id>.svg

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import MAPS from '../src/data/maps.js'
import STRATS from '../src/data/strats.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'guides', 'og')

const W = 1200
const H = 630

function escape(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderMapOg(map) {
  const siteCount = map.sites.length
  const essentialOps = new Set()
  for (const s of map.sites) {
    const strat = STRATS[map.id]?.[s.id]
    if (!strat) continue
    for (const side of ['attack', 'defense']) {
      for (const op of strat[side]?.operators || []) {
        if (op.priority === 'essential') essentialOps.add(op.name)
      }
    }
  }
  const topOps = [...essentialOps].slice(0, 6)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#06070b"/>
      <stop offset="1" stop-color="#0a0c14"/>
    </linearGradient>
    <radialGradient id="glow1" cx="0.15" cy="0.2" r="0.7">
      <stop offset="0" stop-color="#00e5ff" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#00e5ff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.9" cy="0.85" r="0.6">
      <stop offset="0" stop-color="#9b59ff" stop-opacity="0.2"/>
      <stop offset="1" stop-color="#9b59ff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="title" x1="0" y1="0" x2="1" y2="0.2">
      <stop offset="0" stop-color="#00e5ff"/>
      <stop offset="0.5" stop-color="#66f2ff"/>
      <stop offset="1" stop-color="#c5a7ff"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,229,255,0.05)" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Background layers -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#glow1)"/>
  <rect width="${W}" height="${H}" fill="url(#glow2)"/>

  <!-- Top-left brand -->
  <g transform="translate(64 60)">
    <text font-family="Space Grotesk, Inter, sans-serif" font-weight="700" font-size="24" letter-spacing="4" fill="#ecedf3">RECON<tspan fill="#00e5ff">6</tspan></text>
    <text y="26" font-family="Inter, sans-serif" font-size="14" letter-spacing="2" fill="rgba(230,233,239,0.55)">R6 COACHING</text>
  </g>

  <!-- Top-right kicker -->
  <g transform="translate(${W - 64} 60)" text-anchor="end">
    <text font-family="Space Grotesk, Inter, sans-serif" font-weight="700" font-size="14" letter-spacing="6" fill="#00e5ff">STRATEGY GUIDE</text>
    <text y="26" font-family="Inter, sans-serif" font-size="14" fill="rgba(230,233,239,0.55)">${siteCount} bomb sites · ATK + DEF</text>
  </g>

  <!-- Map title -->
  <g transform="translate(64 260)">
    <text font-family="Space Grotesk, Inter, sans-serif" font-weight="700" font-size="110" letter-spacing="-4" fill="url(#title)">${escape(map.name)}</text>
    <text y="56" font-family="Inter, sans-serif" font-size="28" fill="#ecedf3" opacity="0.85">Every site · Every operator · Every callout</text>
  </g>

  <!-- Operator chips row -->
  <g transform="translate(64 440)">
    ${topOps.map((name, i) => {
      const x = i * 172
      return `
    <g transform="translate(${x} 0)">
      <rect width="158" height="44" rx="8" fill="rgba(0,229,255,0.08)" stroke="#00e5ff" stroke-width="1" opacity="0.9"/>
      <text x="79" y="28" text-anchor="middle" font-family="Inter, sans-serif" font-size="16" font-weight="600" fill="#00e5ff" letter-spacing="1">${escape(name.toUpperCase())}</text>
    </g>`
    }).join('')}
  </g>

  <!-- Bottom URL bar -->
  <g transform="translate(64 ${H - 64})">
    <text font-family="Inter, sans-serif" font-size="22" font-weight="600" fill="#ecedf3">r6coaching.com<tspan fill="rgba(230,233,239,0.55)">/guides/${escape(map.id)}.html</tspan></text>
  </g>
  <g transform="translate(${W - 64} ${H - 64})" text-anchor="end">
    <text font-family="Space Grotesk, Inter, sans-serif" font-size="18" font-weight="700" letter-spacing="3" fill="#c5a7ff">FREE · NO SIGNUP</text>
  </g>

  <!-- Bottom accent bar -->
  <rect x="0" y="${H - 6}" width="${W}" height="6" fill="url(#title)"/>
</svg>
`
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const playable = MAPS.filter((m) => !m.comingSoon && STRATS[m.id])
  let n = 0
  for (const map of playable) {
    writeFileSync(join(OUT_DIR, `${map.id}.svg`), renderMapOg(map), 'utf8')
    n++
  }
  console.log(`✓ Generated ${n} OG images in public/guides/og/`)
}

main()
