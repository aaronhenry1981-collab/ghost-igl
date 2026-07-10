#!/usr/bin/env node
// Generates every shipped brand asset from one geometry definition.
//
// THE CONCEPT (do not "improve" this):
//   A hexagon has six sides — that IS the 6, built structurally instead of
//   typed. Five sides are ice, silent. One is amber — the call. Amber appears
//   exactly once in the identity. A second amber element kills both.
//   Field is #07090B.
//
// Geometry is lifted verbatim from brand/recon6-avatar.svg (the master), so
// the shipped mark and the master can never drift.
//
// WHY THE SHIPPED MARK IS SIMPLER THAN THE MASTER:
//   The master carries a 5%-opacity lattice (550 paths) and a reticle ring at
//   stroke-width 11. At a 32px favicon the lattice is invisible and the ring
//   is a 0.4px stroke — it renders as grey dirt, not a ring. So the small mark
//   keeps only what survives: the hexagon, the amber call, and the centre dot.
//   That's exactly what brand/scale_test.png shows surviving. Nothing is
//   redesigned; sub-pixel detail is dropped.
//
// Run: node scripts/generate-brand-assets.mjs

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PUBLIC = join(ROOT, 'public')

const FIELD = '#07090B'
const ICE = '#9BE7FF'
const AMBER = '#FFB03A'

// Master geometry (1000×1000 viewBox), verbatim from brand/recon6-avatar.svg.
// Five ice sides drawn as an open polyline; the amber bar closes the sixth.
const ICE_FIVE_SIDES =
  'M 694,163.982 L 888,500 L 694,836.018 L 306,836.018 L 112,500 L 306,163.982'
const AMBER_SIDE = 'M 306,163.982 L 694,163.982'
const STROKE = 33

// Painted bbox is x 95.5→904.5, y 147.5→852.5. Square-crop it and add 6 units
// of air for the miter overshoot at the left/right vertices, so the hexagon
// nearly fills the frame instead of floating in padding.
const VB = '89.5 89.5 821 821'

/** The mark. `field=false` gives a transparent background for UI use. */
function markSvg({ field = true, reticle = false } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB}" width="512" height="512" role="img" aria-label="RECON6">
${field ? `  <rect x="89.5" y="89.5" width="821" height="821" fill="${FIELD}"/>\n` : ''}  <path d="${ICE_FIVE_SIDES}" fill="none" stroke="${ICE}" stroke-width="${STROKE}" stroke-linejoin="miter" opacity="0.93"/>
  <path d="${AMBER_SIDE}" fill="none" stroke="${AMBER}" stroke-width="${STROKE}" stroke-linecap="butt"/>
${reticle ? `  <circle cx="500" cy="500" r="92" fill="none" stroke="${ICE}" stroke-width="11" opacity="0.88"/>\n` : ''}  <circle cx="500" cy="500" r="30" fill="${ICE}" opacity="0.94"/>
</svg>
`
}

// Open Graph: 1200×630 on the field, mark left, wordmark as OUTLINED shapes is
// overkill here — we draw the mark only. Any wordmark lives in DOM text, never
// as an SVG <text> node (it would render differently in every browser).
function ogSvg() {
  const s = 380
  const x = (1200 - s) / 2
  const y = (630 - s) / 2 - 28
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="${FIELD}"/>
  <svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="${VB}">
    <path d="${ICE_FIVE_SIDES}" fill="none" stroke="${ICE}" stroke-width="${STROKE}" stroke-linejoin="miter" opacity="0.93"/>
    <path d="${AMBER_SIDE}" fill="none" stroke="${AMBER}" stroke-width="${STROKE}" stroke-linecap="butt"/>
    <circle cx="500" cy="500" r="92" fill="none" stroke="${ICE}" stroke-width="11" opacity="0.88"/>
    <circle cx="500" cy="500" r="30" fill="${ICE}" opacity="0.94"/>
  </svg>
</svg>
`
}

async function main() {
  mkdirSync(PUBLIC, { recursive: true })

  const favicon = markSvg({ field: true })
  const logoMark = markSvg({ field: false })

  writeFileSync(join(PUBLIC, 'favicon.svg'), favicon)
  writeFileSync(join(PUBLIC, 'logo-mark.svg'), logoMark)

  // PNG fallbacks. 32 = browser tab, 180 = apple-touch, 192/512 = manifest.
  const buf = Buffer.from(favicon)
  for (const size of [32, 180, 192, 512]) {
    await sharp(buf, { density: 384 })
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(join(PUBLIC, `favicon-${size}.png`))
  }

  // OG / Twitter card.
  writeFileSync(join(PUBLIC, 'og-image.svg'), ogSvg())
  await sharp(Buffer.from(ogSvg()), { density: 192 })
    .png({ compressionLevel: 9 })
    .toFile(join(PUBLIC, 'og-image.png'))

  console.log('✓ brand assets: favicon.svg, logo-mark.svg, favicon-{32,180,192,512}.png, og-image.{svg,png}')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
