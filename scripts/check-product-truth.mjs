#!/usr/bin/env node
// Build-time guard: the public deployment must market only the product sold now.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (relative) => readFileSync(join(ROOT, relative), 'utf8')
const errors = []
const otherGames = /\b(?:Counter-Strike|CS2|Valorant|Overwatch|OW2|Apex|Marvel Rivals|Halo|Fortnite|Rocket League|Call of Duty|CoD|League of Legends|Dota|Tekken|PUBG|EA Sports FC|Naraka|Deadlock|NBA 2K)\b/i
const mustNotMatch = (relative, pattern, message) => {
  const path = join(ROOT, relative)
  if (existsSync(path) && pattern.test(read(relative))) errors.push(`${relative}: ${message}`)
}
const mustMatch = (relative, pattern, message) => {
  const path = join(ROOT, relative)
  if (!existsSync(path) || !pattern.test(read(relative))) errors.push(`${relative}: ${message}`)
}

mustMatch('src/pages/LandingPage.jsx', /const R6_ONLY = true/, 'R6-only marketing flag is disabled')
mustNotMatch('index.html', otherGames, 'homepage metadata promotes another game')
mustNotMatch('package.json', /"generate:all"[^\n]+generate:(?:games|gameog|stadiumog|cast|loadouts|maploadouts)/, 'default build regenerates dormant multi-game pages')
mustNotMatch('dist/sitemap.xml', /<loc>[^<]*\/(?:games\/|tools\/ow2)[^<]*<\/loc>/i, 'sitemap promotes a non-R6 page')
mustNotMatch('dist/sitemap.xml', /<loc>[^<]*\/blog\/(?!r6-)[^<]+<\/loc>/i, 'sitemap promotes a non-R6 blog')
mustNotMatch('dist/feed.xml', otherGames, 'RSS feed promotes another game')
mustNotMatch('dist/tools/index.html', otherGames, 'tools page promotes another game')
mustNotMatch('dist/index.html', /Ghost IGL|ghost-igl/i, 'homepage retains the old brand')

if (existsSync(join(ROOT, 'dist', 'games'))) errors.push('dist/games: dormant multi-game pages were not pruned')

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
for (const path of walkHtml(join(ROOT, 'dist'))) {
  const content = readFileSync(path, 'utf8')
  const relative = path.slice(ROOT.length + 1)
  if (/Ghost IGL|ghost-igl/i.test(content)) errors.push(`${relative}: retains the old brand`)
  // Vite modulepreload tags can legitimately retain a dormant source chunk's
  // filename. They are not visitor-facing marketing copy.
  const visitorCopy = content.replace(/<link\b[^>]*>/gi, '')
  if (otherGames.test(visitorCopy)) errors.push(`${relative}: promotes another game`)
}

if (errors.length) {
  console.error(`Product-truth check failed:\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
console.log('✓ Product truth check passed (R6-only public marketing surfaces)')
