// Renders the traced SVGs over the charcoal field at the approved artwork's
// own pixel size and writes PNGs that brand/trace-r6-signature.py's compare
// step (or a reviewer) can diff against the approved crop.
//   node brand/verify-r6-signature.mjs
import sharp from 'sharp'
import { readFileSync } from 'node:fs'

for (const name of ['r6-signature-mark', 'r6-signature-lockup']) {
  const svg = readFileSync(`brand/${name}.svg`, 'utf8')
  const [, w, h] = svg.match(/viewBox="0 0 (\d+) (\d+)"/)
  await sharp(Buffer.from(svg), { density: 72 })
    .resize(Number(w), Number(h))
    .flatten({ background: '#151616' })
    .png()
    .toFile(`brand/${name}.render.png`)
  console.log(`rendered brand/${name}.render.png ${w}x${h}`)
}
