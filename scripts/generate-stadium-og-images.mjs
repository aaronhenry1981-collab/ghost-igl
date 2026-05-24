#!/usr/bin/env node
// Per-Stadium-map OG image generator. Stadium is OW2's hottest mode AND
// Recon 6's flagship Pro feature — when a Stadium URL shares to Reddit/
// Discord/Twitter, the preview should look distinctly Stadium-branded
// (amber Pro accent) and name the specific map, not the generic OW2 OG.
//
// Builds amber-themed 1200x630 SVG per Stadium map. Detects mode from the
// map name suffix ("(Clash)", "(Control)", "(Push)") and prints it on the
// card so the preview tells you what kind of round you're previewing.
//
// Run: node scripts/generate-stadium-og-images.mjs
// Output: public/games/og/stadium-<mapId>.svg
//
// Wired up by: scripts/generate-game-landing-pages.mjs, which now sets
// `og:image` to the per-Stadium-map SVG when the map is type='Stadium'.

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import OW2_MAPS from '../src/data/games/ow2/maps.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'games', 'og')

const W = 1200
const H = 630

// Pro feature → amber accent (matches the Pro gate styling site-wide).
const ACCENT = '#ffc97a'
const ACCENT_BRIGHT = '#ffd998'
const ACCENT_DEEP = '#7a5210'

function escape(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderStadiumOg(map) {
  // Map names look like "Stadium — Busan Downtown (Control)" — pull the
  // city/place out of the middle and the mode out of the parens for layout.
  const fullName = map.name || map.id
  const modeMatch = /\(([^)]+)\)\s*$/.exec(fullName)
  const mode = modeMatch ? modeMatch[1] : ''
  // Strip "Stadium — " prefix + "(<mode>)" suffix to get the cleaner map name
  const cleanName = fullName
    .replace(/^Stadium\s*[—\-:]\s*/i, '')
    .replace(/\s*\([^)]+\)\s*$/, '')
    .trim() || fullName
  const siteCount = Array.isArray(map.sites) ? map.sites.length : 0
  // Use a smaller font size if the name is long so it doesn't overflow
  const nameFontSize = cleanName.length > 16 ? 88 : 110

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0c0805"/>
      <stop offset="1" stop-color="${ACCENT_DEEP}"/>
    </linearGradient>
    <radialGradient id="glow1" cx="0.15" cy="0.2" r="0.7">
      <stop offset="0" stop-color="${ACCENT}" stop-opacity="0.32"/>
      <stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.9" cy="0.85" r="0.6">
      <stop offset="0" stop-color="${ACCENT}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="title" x1="0" y1="0" x2="1" y2="0.2">
      <stop offset="0" stop-color="${ACCENT}"/>
      <stop offset="0.6" stop-color="${ACCENT_BRIGHT}"/>
      <stop offset="1" stop-color="${ACCENT}"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${ACCENT}" stroke-opacity="0.06" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Background layers -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#glow1)"/>
  <rect width="${W}" height="${H}" fill="url(#glow2)"/>

  <!-- Top-left brand -->
  <g transform="translate(64 60)">
    <text font-family="Space Grotesk, Inter, sans-serif" font-weight="700" font-size="26" letter-spacing="4" fill="#ecedf3">RECON<tspan fill="${ACCENT}">6</tspan></text>
    <text y="26" font-family="Inter, sans-serif" font-size="13" letter-spacing="2" fill="rgba(230,233,239,0.55)">OVERWATCH 2 · STADIUM MODE</text>
  </g>

  <!-- Top-right Pro pill -->
  <g transform="translate(${W - 64} 60)" text-anchor="end">
    <g transform="translate(-180 -10)">
      <rect width="180" height="32" rx="16" fill="${ACCENT}" fill-opacity="0.15" stroke="${ACCENT}" stroke-width="1.5"/>
      <text x="90" y="22" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="13" letter-spacing="3" fill="${ACCENT}">⚑ PRO FEATURE</text>
    </g>
    ${mode ? `<text y="44" font-family="Inter, sans-serif" font-size="14" fill="rgba(230,233,239,0.55)">${escape(mode)} mode · ${siteCount} sites</text>` : ''}
  </g>

  <!-- Map name -->
  <g transform="translate(64 290)">
    <text font-family="Space Grotesk, Inter, sans-serif" font-weight="800" font-size="${nameFontSize}" letter-spacing="-3" fill="url(#title)">${escape(cleanName)}</text>
    <text y="56" font-family="Inter, sans-serif" font-size="28" fill="#ecedf3" opacity="0.85">Cash economy · Power picks · Item shop · Round-7 closeouts</text>
  </g>

  <!-- Stadium-specific chips -->
  <g transform="translate(64 460)">
    <g transform="translate(0 0)">
      <rect width="180" height="48" rx="10" fill="${ACCENT}" fill-opacity="0.12" stroke="${ACCENT}" stroke-width="1.5"/>
      <text x="90" y="30" text-anchor="middle" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="${ACCENT}" letter-spacing="2">CASH STRATEGY</text>
    </g>
    <g transform="translate(196 0)">
      <rect width="180" height="48" rx="10" fill="${ACCENT}" fill-opacity="0.12" stroke="${ACCENT}" stroke-width="1.5"/>
      <text x="90" y="30" text-anchor="middle" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="${ACCENT}" letter-spacing="2">POWER PICKS</text>
    </g>
    <g transform="translate(392 0)">
      <rect width="180" height="48" rx="10" fill="${ACCENT}" fill-opacity="0.12" stroke="${ACCENT}" stroke-width="1.5"/>
      <text x="90" y="30" text-anchor="middle" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="${ACCENT}" letter-spacing="2">ITEM SHOP</text>
    </g>
    <g transform="translate(588 0)">
      <rect width="180" height="48" rx="10" fill="${ACCENT}" fill-opacity="0.12" stroke="${ACCENT}" stroke-width="1.5"/>
      <text x="90" y="30" text-anchor="middle" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="${ACCENT}" letter-spacing="2">BO7 PLAYBOOK</text>
    </g>
  </g>

  <!-- Bottom URL bar -->
  <g transform="translate(64 ${H - 64})">
    <text font-family="Inter, sans-serif" font-size="22" font-weight="600" fill="#ecedf3">r6coaching.com<tspan fill="rgba(230,233,239,0.55)">/games/ow2/${escape(map.id)}.html</tspan></text>
  </g>
  <g transform="translate(${W - 64} ${H - 64})" text-anchor="end">
    <text font-family="Space Grotesk, Inter, sans-serif" font-size="18" font-weight="700" letter-spacing="3" fill="${ACCENT}">FOUNDING $9/MO</text>
  </g>

  <!-- Bottom accent bar (amber for Pro framing) -->
  <rect x="0" y="${H - 6}" width="${W}" height="6" fill="${ACCENT}"/>
</svg>
`
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const stadiumMaps = OW2_MAPS.filter(m => m.type === 'Stadium')
  let n = 0
  for (const map of stadiumMaps) {
    const svg = renderStadiumOg(map)
    writeFileSync(join(OUT_DIR, `${map.id}.svg`), svg, 'utf8')
    n++
  }
  console.log(`Generated ${n} Stadium OG images in public/games/og/`)
  console.log('  Maps:', stadiumMaps.map(m => m.id).join(', '))
}

main()
