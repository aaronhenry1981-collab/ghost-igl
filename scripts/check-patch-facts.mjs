#!/usr/bin/env node
// Stale patch-fact audit (Y11S3.1). Fails when any source or generated file
// states a value or Noor behaviour that the official Y11S3.1 patch notes
// (September 22, 2026) changed, e.g. "Skeleton Key ... 31 rounds".
//
// Every check is tied to its operator, gadget or weapon; a bare 31, 9, 2, 8,
// 200, 1, 28 or 24 never matches. Clearly historical wording is allowed:
// "(was 31)", "up from 9", "previously 1 second", "no longer auto-retracts",
// or a quoted "Fixed -" patch-note line.
//
// Usage:
//   node scripts/check-patch-facts.mjs                  # repo sources + generated output
//   node scripts/check-patch-facts.mjs <path> [<path>]  # also scan extra files/folders
//
// Exit code 1 lists every finding as file:line.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const SCAN_DIRS = ['src', 'scripts', 'lambda', 'public', 'desktop', 'handoff', 'aws']
const SCAN_FILES = ['index.html', 'README.md', 'CLAUDE.md']
const EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json', '.html', '.xml', '.txt', '.md', '.py', '.csv', '.yaml', '.yml'])
const SKIP_DIRS = new Set(['node_modules', 'dist', '.aws-sam', '.git', 'backup', 'backups'])
const SKIP_FILES = new Set(['scripts/check-patch-facts.mjs', 'scripts/check-patch-facts.test.mjs'])

// A sentence-sized window: stops at a full stop, a newline or a list break.
const W = '[^.\\n;|]'

const STALE = [
  {
    id: 'skeleton-key-ammo-31',
    note: 'Buck Skeleton Key total ammo is 36 as of Y11S3.1 (was 31).',
    patterns: [
      new RegExp(`skeleton\\s*key${W}{0,90}?\\b(31)\\b`, 'gi'),
      new RegExp(`\\b(31)\\b${W}{0,40}?(shells?|rounds?|ammo|shots?)${W}{0,60}?skeleton\\s*key`, 'gi'),
    ],
  },
  {
    id: 'armor-panel-9-melee-hits',
    note: 'Castle Armor Panel takes 10 melee hits as of Y11S3.1 (was 9).',
    patterns: [
      new RegExp(`(armou?r\\s*panels?|castle\\s*(barricades?|panels?))${W}{0,110}?\\b(9|nine)\\b\\s*(melee\\s*)?(hits?|strikes?|melees?|swings?)`, 'gi'),
      new RegExp(`\\b(9|nine)\\b\\s*(melee\\s*)?(hits?|strikes?|melees?)${W}{0,90}?(armou?r\\s*panels?|castle\\s*(barricades?|panels?))`, 'gi'),
    ],
  },
  {
    id: 'dread-mine-gas-2s',
    note: 'Fenrir F-NATT Dread Mine gas reaches maximum range in 1.9 seconds as of Y11S3.1 (was 2 seconds).',
    patterns: [
      new RegExp(`(dread\\s*mines?|f-?natt|fenrir)${W}{0,120}?(gas|expan\\w*|range|spread|cloud)${W}{0,70}?\\b(2(?:\\.0)?|two)\\s*-?\\s*(s|secs?|seconds?)\\b`, 'gi'),
      new RegExp(`\\b(2(?:\\.0)?|two)\\s*-?\\s*(s|secs?|seconds?)\\b${W}{0,70}?(gas|expan\\w*|range|spread)${W}{0,90}?(dread\\s*mines?|f-?natt|fenrir)`, 'gi'),
    ],
  },
  {
    id: 'evil-eye-battery-8s',
    note: 'Maestro Evil Eye battery lasts 9 seconds as of Y11S3.1 (was 8 seconds).',
    patterns: [
      new RegExp(`(evil\\s*eyes?|maestro)${W}{0,110}?(battery|laser|fir\\w*|charge)${W}{0,70}?\\b(8|eight)\\s*-?\\s*(s|secs?|seconds?)\\b`, 'gi'),
      new RegExp(`\\b(8|eight)\\s*-?\\s*(s|secs?|seconds?)\\b${W}{0,60}?(battery|laser)${W}{0,90}?(evil\\s*eyes?|maestro)`, 'gi'),
    ],
  },
  {
    id: 'exothermic-200-hp',
    note: 'Thermite Exothermic Charge deals 220 HP as of Y11S3.1 (was 200 HP).',
    patterns: [
      new RegExp(`(exothermic|brimstone|thermite\\W{0,3}s\\s+charge)${W}{0,110}?\\b(200)\\s*(hp|damage|dmg|health)\\b`, 'gi'),
      new RegExp(`\\b(200)\\s*(hp|damage|dmg)\\b${W}{0,70}?(exothermic|brimstone)`, 'gi'),
    ],
  },
  {
    id: 'sledge-hammer-swing-1s',
    note: "Sledge's Breaching Hammer swing takes 0.8 seconds as of Y11S3.1 (was 1 second).",
    patterns: [
      new RegExp(`(sledge|breaching\\s*hammer|caber)${W}{0,110}?(swing\\w*)${W}{0,60}?\\b(1(?:\\.0)?|one)\\s*-?\\s*(s|secs?|seconds?)\\b`, 'gi'),
      new RegExp(`\\b(1(?:\\.0)?|one)\\s*-?\\s*(s|secs?|seconds?)\\b${W}{0,40}?(swing\\w*)${W}{0,90}?(sledge|hammer)`, 'gi'),
      new RegExp(`(sledge|breaching\\s*hammer)${W}{0,80}?(swing\\w*)${W}{0,30}?(instant\\w*)`, 'gi'),
    ],
  },
  {
    id: 'm1014-damage-28',
    note: 'M1014 deals 30 damage as of Y11S3.1 (was 28).',
    patterns: [
      new RegExp(`m1014${W}{0,80}?\\b(28)\\b`, 'gi'),
      new RegExp(`\\b(28)\\b\\s*(hp|damage|dmg)?${W}{0,40}?m1014`, 'gi'),
    ],
  },
  {
    id: 'spas15-damage-24',
    note: 'SPAS-15 deals 26 damage as of Y11S3.1 (was 24).',
    patterns: [
      new RegExp(`spas\\s*-?\\s*15${W}{0,80}?\\b(24)\\b`, 'gi'),
      new RegExp(`\\b(24)\\b\\s*(hp|damage|dmg)?${W}{0,40}?spas\\s*-?\\s*15`, 'gi'),
    ],
  },
  {
    id: 'noor-le-roc-auto-retract',
    note: "Fixed in Y11S3.1: Montagne's Le Roc no longer auto-retracts just because a Horus Lance hits it.",
    noorClaim: true,
    patterns: [
      new RegExp(`(le\\s*roc|montagne|horus|lance|noor)${W}{0,140}?(auto\\s*-?\\s*retract\\w*|automatically\\s+retract\\w*|forced?\\s+to\\s+retract|retracts?\\s+(on|when)\\s+(hit|impact))`, 'gi'),
      new RegExp(`(auto\\s*-?\\s*retract\\w*|automatically\\s+retract\\w*)${W}{0,140}?(horus|lance|noor)`, 'gi'),
    ],
  },
  {
    id: 'noor-shield-no-device-throw',
    note: 'Fixed in Y11S3.1: shield Operators can throw devices while affected by a Horus Lance.',
    noorClaim: true,
    patterns: [
      new RegExp(`(shields?)${W}{0,100}?(can'?t|cannot|can\\s+not|unable\\s+to|won'?t\\s+be\\s+able\\s+to|lose\\s+the\\s+ability\\s+to)\\s+(throw|use|deploy)${W}{0,100}?(horus|lance|noor)`, 'gi'),
      new RegExp(`(horus|lance|noor)${W}{0,140}?(can'?t|cannot|can\\s+not|unable\\s+to|won'?t\\s+be\\s+able\\s+to|lose\\s+the\\s+ability\\s+to)\\s+(throw|use|deploy)\\s+(devices?|gadgets?|utility|grenades?)`, 'gi'),
    ],
  },
  {
    id: 'noor-lance-wall-press',
    note: 'Fixed in Y11S3.1: pressing an embedded Horus Lance against a wall does not prevent its damage.',
    noorClaim: true,
    patterns: [
      new RegExp(`(press|push|pin|jam|rub|shove|lean)\\w*${W}{0,70}?(lance|horus)${W}{0,70}?(against|into|on)\\s+(a\\s+|the\\s+)?wall`, 'gi'),
      new RegExp(`(lance|horus)${W}{0,90}?(against|into)\\s+(a\\s+|the\\s+)?wall${W}{0,90}?(no\\s+damage|prevent\\w*|avoid\\w*|negat\\w*|block\\w*|stop\\w*)`, 'gi'),
    ],
  },
  {
    id: 'noor-animation-cancel-removal',
    note: 'Fixed in Y11S3.1: cancelling the animation no longer removes a Horus Lance immediately.',
    noorClaim: true,
    patterns: [
      new RegExp(`(animation\\s*-?\\s*cancel\\w*|cancel\\w*\\s+(the\\s+)?animation)${W}{0,140}?(lance|horus)`, 'gi'),
      new RegExp(`(lance|horus)${W}{0,140}?(animation\\s*-?\\s*cancel\\w*|cancel\\w*\\s+(the\\s+)?animation)`, 'gi'),
    ],
  },
]

// Historical or corrected wording right before the old number, or anywhere
// in the matched sentence for Noor claims.
const HISTORICAL_BEFORE_NUMBER = /((\bwas|\bpreviously|\bformerly|\bfrom|\bup\s+from|\bdown\s+from|\bold|\bpre-?y11s3\.1)\s*\(?\s*|\bbefore['"]?\s*[:=]\s*['"]?)$/i
// Explicit correction phrases only; a bare "not" would excuse "can not throw".
const CORRECTED_SENTENCE = /(\bno\s+longer\b|\bfixed\b|\bpatched\b|\bas\s+of\s+y11s3\.1\b|\b(does|do|will)\s+not\s+prevent\b|\b(doesn|don|won)['’]t\s+prevent\b|\bcan\s+(now\s+)?throw\b)/i

function sentenceAround(text, index, length) {
  const start = Math.max(text.lastIndexOf('.', index) + 1, text.lastIndexOf('\n', index) + 1)
  let end = text.indexOf('.', index + length)
  const nl = text.indexOf('\n', index + length)
  if (end === -1 || (nl !== -1 && nl < end)) end = nl === -1 ? text.length : nl
  return text.slice(start, end + 1)
}

export function findStale(text) {
  const findings = []
  for (const rule of STALE) {
    for (const pattern of rule.patterns) {
      pattern.lastIndex = 0
      let m
      while ((m = pattern.exec(text))) {
        const sentence = sentenceAround(text, m.index, m[0].length)
        if (/\bFixed\s*[-–—]/.test(sentence)) continue // quoted patch-note line
        if (rule.noorClaim) {
          if (CORRECTED_SENTENCE.test(sentence)) continue
        } else {
          // Locate the old number inside the match and check what precedes it.
          const oldNumber = m.slice(1).find((g) => g && /^(\d+(\.\d+)?|one|two|eight|nine)$/i.test(g))
          if (oldNumber) {
            const rel = m[0].search(new RegExp(`\\b${oldNumber.replace('.', '\\.')}\\b`, 'i'))
            const before = text.slice(Math.max(0, m.index + rel - 24), m.index + rel)
            if (HISTORICAL_BEFORE_NUMBER.test(before)) continue
          }
          if (rule.id === 'sledge-hammer-swing-1s' && /0\.8\s*(s|secs?|seconds?)/i.test(sentence)) continue
        }
        findings.push({ rule: rule.id, note: rule.note, index: m.index, match: m[0].slice(0, 160) })
      }
    }
  }
  return findings
}

function walk(path, out) {
  let st
  try {
    st = statSync(path)
  } catch {
    return
  }
  if (st.isDirectory()) {
    for (const name of readdirSync(path)) {
      if (SKIP_DIRS.has(name) || name.startsWith('backup-') || name === 'ui-cleanup-backups') continue
      walk(join(path, name), out)
    }
  } else if (EXTENSIONS.has(extname(path).toLowerCase()) && st.size < 5_000_000) {
    out.push(path)
  }
}

export function scan(paths) {
  const files = []
  for (const p of paths) walk(p, files)
  const results = []
  for (const file of files) {
    const rel = relative(ROOT, file).replace(/\\/g, '/')
    if (SKIP_FILES.has(rel)) continue
    const text = readFileSync(file, 'utf8')
    for (const f of findStale(text)) {
      const line = text.slice(0, f.index).split('\n').length
      results.push({ file: rel.startsWith('..') ? file : rel, line, ...f })
    }
  }
  return { files: files.length, results }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const extra = process.argv.slice(2).map((p) => resolve(p))
  const targets = [...SCAN_DIRS.map((d) => join(ROOT, d)), ...SCAN_FILES.map((f) => join(ROOT, f)), ...extra]
  const { files, results } = scan(targets)
  if (results.length) {
    console.error(`Stale Y11S3.1 patch facts: ${results.length} finding(s) in ${files} files`)
    for (const r of results) console.error(`  ${r.file}:${r.line} [${r.rule}] ${r.match}\n    -> ${r.note}`)
    process.exit(1)
  }
  console.log(`Patch-fact audit passed: no stale Y11S3.1 values or fixed Noor behaviours in ${files} files`)
}
