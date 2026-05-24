#!/usr/bin/env node
// Per-game OG image generator. Builds a themed 1200x630 SVG per supported
// game using the game's accent color from gameMeta. Used as og:image on the
// per-game landing pages and per-map / per-cast pages.
//
// SVG was chosen for the same reason as generate-og-images.mjs (R6 maps):
// no native rasterization deps, crisp on Discord/Twitter/FB crawlers.
//
// Run: node scripts/generate-game-og-images.mjs
// Output: public/games/og/<gameId>.svg

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { GAMES } from '../src/data/games/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'games', 'og')

const W = 1200
const H = 630

function escape(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Convert a hex color to a darker variant for gradient stops.
function darken(hex, amount = 0.7) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex || '')
  if (!m) return '#0a0f19'
  const num = parseInt(m[1], 16)
  const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * (1 - amount)))
  const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * (1 - amount)))
  const b = Math.max(0, Math.floor((num & 0xff) * (1 - amount)))
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`
}

function vocabOf(meta) {
  const v = meta.vocab || {}
  return {
    op: v.operator || v.cast || 'Operator',
    map: v.map || 'Map',
    site: v.site || 'Site',
    atk: v.side_attack || v.sideAttack || 'Attack',
    def: v.side_defense || v.sideDefense || 'Defense',
  }
}

async function renderGameOg(game) {
  const meta = game.gameMeta || {}
  const accent = meta.color || '#00e5ff'
  const accentDim = darken(accent, 0.6)
  const v = vocabOf(meta)

  // Best-effort load of game data so we can put real numbers on the OG.
  // If the load fails (R6 has Node-ESM issues with extensionless imports),
  // we fall back to neutral copy.
  let mapCount = null
  let castCount = null
  try {
    const data = await game.load()
    const maps = Array.isArray(data.MAPS) ? data.MAPS : Object.values(data.MAPS || {})
    const cast = Array.isArray(data.CAST) ? data.CAST : Object.values(data.CAST || {})
    mapCount = maps.length
    castCount = cast.length
  } catch {
    // Skip stats — render anyway.
  }

  const subtitle = (mapCount && castCount)
    ? `${mapCount} ${v.map.toLowerCase()}s · ${castCount} ${v.op.toLowerCase()}s · ${v.atk} + ${v.def}`
    : `Strats · Callouts · ${v.op}s · ${v.atk} + ${v.def}`

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#06070b"/>
      <stop offset="1" stop-color="${accentDim}"/>
    </linearGradient>
    <radialGradient id="glow1" cx="0.15" cy="0.2" r="0.7">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.28"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.9" cy="0.85" r="0.6">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.18"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="title" x1="0" y1="0" x2="1" y2="0.2">
      <stop offset="0" stop-color="${accent}"/>
      <stop offset="0.6" stop-color="#ffffff"/>
      <stop offset="1" stop-color="${accent}"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${accent}" stroke-opacity="0.06" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Background layers -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#glow1)"/>
  <rect width="${W}" height="${H}" fill="url(#glow2)"/>

  <!-- Top-left brand -->
  <g transform="translate(64 60)">
    <text font-family="Space Grotesk, Inter, sans-serif" font-weight="700" font-size="26" letter-spacing="4" fill="#ecedf3">RECON<tspan fill="${accent}">6</tspan></text>
    <text y="26" font-family="Inter, sans-serif" font-size="13" letter-spacing="2" fill="rgba(230,233,239,0.55)">AI COACHING · 20 GAMES</text>
  </g>

  <!-- Top-right kicker -->
  <g transform="translate(${W - 64} 60)" text-anchor="end">
    <text font-family="Space Grotesk, Inter, sans-serif" font-weight="700" font-size="14" letter-spacing="6" fill="${accent}">STRATEGY GUIDE</text>
    <text y="26" font-family="Inter, sans-serif" font-size="14" fill="rgba(230,233,239,0.55)">${escape(subtitle)}</text>
  </g>

  <!-- Game title -->
  <g transform="translate(64 280)">
    <text font-family="Space Grotesk, Inter, sans-serif" font-weight="800" font-size="${(meta.displayName || meta.name || game.id).length > 14 ? 78 : 110}" letter-spacing="-3" fill="url(#title)">${escape(meta.displayName || meta.name || game.id)}</text>
    <text y="56" font-family="Inter, sans-serif" font-size="28" fill="#ecedf3" opacity="0.85">Every ${v.map.toLowerCase()} · Every ${v.op.toLowerCase()} · Every callout</text>
  </g>

  <!-- Tactic chips row -->
  <g transform="translate(64 460)">
    <g transform="translate(0 0)">
      <rect width="200" height="48" rx="10" fill="${accent}" fill-opacity="0.12" stroke="${accent}" stroke-width="1.5"/>
      <text x="100" y="30" text-anchor="middle" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="${accent}" letter-spacing="2">${escape(v.atk.toUpperCase())} STRATS</text>
    </g>
    <g transform="translate(216 0)">
      <rect width="200" height="48" rx="10" fill="${accent}" fill-opacity="0.12" stroke="${accent}" stroke-width="1.5"/>
      <text x="100" y="30" text-anchor="middle" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="${accent}" letter-spacing="2">${escape(v.def.toUpperCase())} SETUPS</text>
    </g>
    <g transform="translate(432 0)">
      <rect width="200" height="48" rx="10" fill="${accent}" fill-opacity="0.12" stroke="${accent}" stroke-width="1.5"/>
      <text x="100" y="30" text-anchor="middle" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="${accent}" letter-spacing="2">AI VOD REVIEW</text>
    </g>
    <g transform="translate(648 0)">
      <rect width="200" height="48" rx="10" fill="${accent}" fill-opacity="0.12" stroke="${accent}" stroke-width="1.5"/>
      <text x="100" y="30" text-anchor="middle" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="${accent}" letter-spacing="2">RANK UP</text>
    </g>
  </g>

  <!-- Bottom URL bar -->
  <g transform="translate(64 ${H - 64})">
    <text font-family="Inter, sans-serif" font-size="22" font-weight="600" fill="#ecedf3">r6coaching.com<tspan fill="rgba(230,233,239,0.55)">/games/${escape(game.id)}/</tspan></text>
  </g>
  <g transform="translate(${W - 64} ${H - 64})" text-anchor="end">
    <text font-family="Space Grotesk, Inter, sans-serif" font-size="18" font-weight="700" letter-spacing="3" fill="${accent}">FREE · NO SIGNUP</text>
  </g>

  <!-- Bottom accent bar -->
  <rect x="0" y="${H - 6}" width="${W}" height="6" fill="${accent}"/>
</svg>
`
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  let n = 0
  for (const game of GAMES) {
    try {
      const svg = await renderGameOg(game)
      writeFileSync(join(OUT_DIR, `${game.id}.svg`), svg, 'utf8')
      n++
    } catch (err) {
      console.error(`✗ Failed to render OG for ${game.id}: ${err.message}`)
    }
  }
  console.log(`✓ Generated ${n} game OG images in public/games/og/`)
}

main()
