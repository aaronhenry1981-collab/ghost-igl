#!/usr/bin/env node
/**
 * Guards the committed generator output under public/ against drift.
 *
 * The pages, feeds, sitemap and OG images under public/ are produced by the
 * generators in scripts/ (`npm run generate:all`, which `npm run build` runs
 * first). Because that output is committed, it can silently fall behind the
 * generators that produce it — a generator or its source data changes, nobody
 * re-runs the build, and the stale copy is what ships. That is exactly what
 * happened with the old "$19/mo All-Access" pricing copy, which outlived the
 * rule that generated it by months.
 *
 * CI runs `npm run build` before the content checks, so by the time this
 * script runs the working tree already holds freshly generated output. Any
 * difference against what is committed means the committed copy is stale.
 *
 * Two fields are stamped with wall-clock time and are expected to differ on
 * every run, so they are normalised before comparison rather than treated as
 * drift:
 *
 *   - <lastBuildDate> in feed.xml  — changes on every single build
 *   - <lastmod> in sitemap.xml     — changes on every calendar day
 *
 * Everything else must match byte for byte. Normalisation is deliberately
 * narrow: it is scoped to these two tags so that a real content change which
 * happens to sit on the same line still fails the check.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const OUTPUT_DIR = 'public'

const VOLATILE = [
  { tag: 'lastmod', re: /<lastmod>[^<]*<\/lastmod>/g, to: '<lastmod>__NORMALISED__</lastmod>' },
  {
    tag: 'lastBuildDate',
    re: /<lastBuildDate>[^<]*<\/lastBuildDate>/g,
    to: '<lastBuildDate>__NORMALISED__</lastBuildDate>',
  },
]

function git(args, opts = {}) {
  return execFileSync('git', args, { maxBuffer: 1 << 28, ...opts })
}

function isBinary(buf) {
  return buf.includes(0)
}

function normalise(buf) {
  if (isBinary(buf)) return buf.toString('base64')
  let text = buf.toString('utf8')
  for (const { re, to } of VOLATILE) text = text.replace(re, to)
  return text
}

/** Parse `git status --porcelain=v1 -z` into { code, path } records. */
function changedEntries() {
  const raw = git(['status', '--porcelain=v1', '-z', '--', OUTPUT_DIR]).toString('utf8')
  const parts = raw.split('\0')
  const entries = []
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i]
    if (!part) continue
    const code = part.slice(0, 2)
    const path = part.slice(3)
    // Renames/copies carry their source path in the following NUL-separated field.
    if (code[0] === 'R' || code[0] === 'C') i += 1
    entries.push({ code, path })
  }
  return entries
}

function committedBlob(path) {
  try {
    return git(['show', `HEAD:${path}`])
  } catch {
    return null
  }
}

const entries = changedEntries()

const stale = []
const added = []
const removed = []

for (const { code, path } of entries) {
  if (code === '??') {
    added.push(path)
    continue
  }
  if (code.includes('D')) {
    removed.push(path)
    continue
  }

  const committed = committedBlob(path)
  if (committed === null) {
    added.push(path)
    continue
  }

  let current
  try {
    current = readFileSync(path)
  } catch {
    removed.push(path)
    continue
  }

  if (normalise(committed) !== normalise(current)) stale.push(path)
}

const problems = stale.length + added.length + removed.length

if (problems === 0) {
  const skipped = entries.length
  const note = skipped
    ? ` (${skipped} file${skipped === 1 ? '' : 's'} differ only in build timestamps)`
    : ''
  console.log(`check:generated — ${OUTPUT_DIR}/ is in sync with the generators${note}`)
  process.exit(0)
}

console.error(`\ncheck:generated — committed output under ${OUTPUT_DIR}/ is stale.\n`)
console.error('The generators in scripts/ produce different output than what is committed,')
console.error('which means the stale copy is what ships to r6coaching.com.\n')

const report = (label, list) => {
  if (!list.length) return
  console.error(`${label} (${list.length}):`)
  for (const path of list.slice(0, 40)) console.error(`  ${path}`)
  if (list.length > 40) console.error(`  ...and ${list.length - 40} more`)
  console.error('')
}

report('Content differs from the generated output', stale)
report('Generated but not committed', added)
report('Committed but no longer generated', removed)

console.error('Fix: run `npm run build`, review the diff, then commit public/.')
console.error('Only <lastmod> and <lastBuildDate> churn is ignored by this check.\n')

process.exit(1)
