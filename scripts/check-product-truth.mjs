#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { extname } from 'node:path'

const registry = JSON.parse(readFileSync(new URL('../config/product-truth.json', import.meta.url)))
const MARKETING_ROOTS = /^(src\/(pages|components)\/|scripts\/generate-(blog-posts|coaching-page|tools-page)\.mjs$)/
const TEXT_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.html', '.md'])
const OTHER_GAMES = /\b(apex|valorant|overwatch|ow2|fortnite|rocket league|call of duty|cod|counter-strike|cs2|league of legends|dota|tekken|street fighter|pubg|marvel rivals|halo)\b/i

function changedFiles() {
  if (process.env.TRUTH_FILES) return process.env.TRUTH_FILES.split(/\r?\n/).filter(Boolean)
  try {
    return execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMR', 'origin/main...HEAD'], { encoding: 'utf8' })
      .split(/\r?\n/).filter(Boolean)
  } catch {
    return []
  }
}

function violationsFor(path, text) {
  const problems = []
  if (registry.activeMarketingGames.length === 1 && registry.activeMarketingGames[0] === 'r6' && OTHER_GAMES.test(text)) {
    problems.push('active marketing mentions a non-R6 game')
  }
  const desktop = registry.products.desktop
  if (!desktop.shipped || !desktop.live || !desktop.downloadable) {
    const unsupported = [
      /desktop(?: coach| app)?[^\n]{0,70}\b(?:shipped|live now|available now|download now|get the app)\b/i,
      /\b(?:download now|get the desktop app)\b[^\n]{0,70}desktop/i,
    ]
    if (unsupported.some(pattern => pattern.test(text))) {
      problems.push(`desktop claim conflicts with registry (use "${desktop.allowedLabel}")`)
    }
  }
  return problems.map(message => `${path}: ${message}`)
}

// Fixture assertions keep the detector itself from silently weakening.
const fixtureFailures = [
  ...violationsFor('fixture.jsx', 'Coaching for Valorant players'),
  ...violationsFor('fixture.jsx', 'Get the desktop app â€” live now'),
]
if (fixtureFailures.length !== 2) throw new Error('product-truth detector fixture failed')
if (violationsFor('fixture.jsx', 'Rainbow Six Siege coaching. Desktop coach early access.').length) {
  throw new Error('product-truth detector rejected valid R6 early-access copy')
}

const errors = []
for (const path of changedFiles()) {
  if (!MARKETING_ROOTS.test(path) || !TEXT_EXTENSIONS.has(extname(path))) continue
  errors.push(...violationsFor(path, readFileSync(path, 'utf8')))
}

if (errors.length) {
  console.error(`Product-truth check failed:\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
console.log('Product-truth check passed')
