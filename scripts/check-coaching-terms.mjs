#!/usr/bin/env node
// Coaching pricing tripwire. Fails (exit 1) if any stale coaching pricing or
// "free session" claim survives in customer-facing surfaces. The coaching model
// is: $20 first session (50% off the $40 single), $40 single, $70/mo add-on.
// Anything advertising a FREE intro, or the retired $75 / $140 / $195 tiers, is
// a bug — copy must always agree with what Stripe actually charges.
//
// Scope: src, scripts, public, lambda. Historical blog posts are OUT of scope
// (public/blog/ is a large corpus of already-shipped content the reconcile does
// not rewrite). node_modules is skipped.
//
// Run: node scripts/check-coaching-terms.mjs   (or: npm run check:coaching-terms)

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..')
const ROOTS = ['src', 'scripts', 'public', 'lambda']
const EXTS = new Set(['.html', '.js', '.mjs', '.jsx'])
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist'])

// Out of scope: historical blog posts, and this checker itself (it necessarily
// names the forbidden terms in its own pattern/comments).
const isExcluded = (rel) => {
  const p = rel.replace(/\\/g, '/')
  return p.includes('/blog/') || p.endsWith('scripts/check-coaching-terms.mjs')
}

// \b after the digits so $140 does NOT match $1400 (a CS2 buy-round bonus, etc).
const FORBIDDEN = /\$(75|140|195)\b|free intro|first session is free|free coaching|first session free|intro session is free/i

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (EXTS.has(extname(name))) out.push(full)
  }
}

const files = []
for (const r of ROOTS) {
  try { walk(join(ROOT, r), files) } catch { /* root may not exist */ }
}

const hits = []
for (const file of files) {
  const rel = file.slice(ROOT.length + 1)
  if (isExcluded(rel)) continue
  const lines = readFileSync(file, 'utf8').split(/\r?\n/)
  lines.forEach((line, i) => {
    const m = line.match(FORBIDDEN)
    if (m) hits.push(`${rel.replace(/\\/g, '/')}:${i + 1}: ${m[0]}  ->  ${line.trim().slice(0, 120)}`)
  })
}

if (hits.length) {
  console.error(`✗ ${hits.length} forbidden coaching term(s) found (stale pricing / "free" claims):\n`)
  for (const h of hits) console.error('  ' + h)
  console.error('\nFix the copy to match the live model ($20 first / $40 single / $70mo add-on), then re-run.')
  process.exit(1)
}
console.log(`✓ no forbidden coaching terms in ${files.length} scanned files (blog corpus excluded)`)
