#!/usr/bin/env node
// The source archive retains dormant multi-game material for future work.
// This post-build step keeps it out of the deployable dist/ tree today.

import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const BLOG = join(DIST, 'blog')
const nonR6 = /\b(?:Counter-Strike|CS2|Valorant|Overwatch|OW2|Apex|Marvel Rivals|Halo|Fortnite|Rocket League|Call of Duty|CoD|League of Legends|Dota|Tekken|PUBG|EA Sports FC|Naraka|Deadlock|NBA 2K)\b/i
let removed = 0
let rebranded = 0

const remove = (path) => {
  if (!existsSync(path)) return
  rmSync(path, { recursive: true, force: true })
  removed += 1
}

remove(join(DIST, 'games'))
remove(join(DIST, 'tools', 'ow2-stadium-tier-list'))

if (existsSync(BLOG)) {
  for (const name of readdirSync(BLOG)) {
    if (!name.endsWith('.html') || name === 'index.html' || name.startsWith('r6-') || name === 'hardstuck-rainbow-six-not-your-aim.html') continue
    const path = join(BLOG, name)
    if (nonR6.test(readFileSync(path, 'utf8'))) remove(path)
  }
}

function walkHtml(dir) {
  if (!existsSync(dir)) return []
  const files = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) files.push(...walkHtml(path))
    else if (name.endsWith('.html')) files.push(path)
  }
  return files
}

for (const path of walkHtml(DIST)) {
  const current = readFileSync(path, 'utf8')
  const next = current
    .replace(/Ghost IGL/gi, 'Recon 6')
    .replace(/Founding rate \$9\/mo before May (?:8|31)\.?/gi, 'See current pricing for available plans.')
  if (next !== current) {
    writeFileSync(path, next)
    rebranded += 1
  }
}

console.log(`✓ Pruned ${removed} non-R6 deploy output path(s) and refreshed ${rebranded} legacy page(s)`)
