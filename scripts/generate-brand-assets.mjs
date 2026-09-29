#!/usr/bin/env node
// Generates every shipped brand asset from the approved R6 signature.
//
// THE IDENTITY (approved 2026-09-28, "01 / R6 SIGNATURE"; do not redraw it):
//   A bone R and an ember 6 locked together, with the RECON 6 wordmark
//   (bone, ember 6) underneath, on charcoal. No tagline.
//   Sources: brand/r6-signature-{mark,wordmark,lockup}.svg, traced from the
//   approved artwork by brand/trace-r6-signature.py (98-99% pixel agreement,
//   checked with brand/compare-r6-signature.py). Edit those, never this file's
//   output.
//
// Palette (sampled from the approved artwork):
//   charcoal #151616 · bone #EBE4D7 · ember #F07430
//
// Run: node scripts/generate-brand-assets.mjs

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PUBLIC = join(ROOT, 'public')
const BRAND = join(ROOT, 'brand')

export const CHARCOAL = '#151616'
export const BONE = '#EBE4D7'
export const EMBER = '#F07430'

function load(name) {
  const svg = readFileSync(join(BRAND, `r6-signature-${name}.svg`), 'utf8')
  const [, w, h] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
  const paths = [...svg.matchAll(/<path [^>]+\/>/g)].map((m) => m[0])
  return { w: Number(w), h: Number(h), paths }
}

const mark = load('mark')
const wordmark = load('wordmark')
const lockup = load('lockup')

// Transparent UI assets (navbar etc.) keep the artwork's own viewBox.
const uiSvg = (a) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${a.w} ${a.h}" width="${a.w}" height="${a.h}" role="img" aria-label="Recon 6">
  ${a.paths.join('\n  ')}
</svg>
`

// A piece of artwork centred at `width` inside a charcoal canvas.
function onField(a, canvasW, canvasH, width, dy = 0) {
  const scale = width / a.w
  const x = (canvasW - width) / 2
  const y = (canvasH - a.h * scale) / 2 + dy
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasW} ${canvasH}" width="${canvasW}" height="${canvasH}" role="img" aria-label="Recon 6">
  <rect width="${canvasW}" height="${canvasH}" fill="${CHARCOAL}"/>
  <g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(5)})">
    ${a.paths.join('\n    ')}
  </g>
</svg>
`
}

async function main() {
  mkdirSync(PUBLIC, { recursive: true })

  // Icon: the monogram on charcoal, filling ~84% of the square so it still
  // reads at 32px.
  const favicon = onField(mark, 512, 512, 430)
  writeFileSync(join(PUBLIC, 'favicon.svg'), favicon)
  writeFileSync(join(PUBLIC, 'logo-mark.svg'), uiSvg(mark))
  writeFileSync(join(PUBLIC, 'logo-wordmark.svg'), uiSvg(wordmark))
  writeFileSync(join(PUBLIC, 'logo-lockup.svg'), uiSvg(lockup))

  // PNG fallbacks. 32 = browser tab, 180 = apple-touch, 192/512 = manifest.
  for (const size of [32, 180, 192, 512]) {
    await sharp(Buffer.from(favicon), { density: 384 })
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(join(PUBLIC, `favicon-${size}.png`))
  }

  // OG / Twitter card: the full approved lockup, centred on charcoal.
  const og = onField(lockup, 1200, 630, 620)
  writeFileSync(join(PUBLIC, 'og-image.svg'), og)
  await sharp(Buffer.from(og), { density: 144 })
    .resize(1200, 630)
    .png({ compressionLevel: 9 })
    .toFile(join(PUBLIC, 'og-image.png'))

  console.log('✓ brand assets: favicon.svg, logo-{mark,wordmark,lockup}.svg, favicon-{32,180,192,512}.png, og-image.{svg,png}')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
