#!/usr/bin/env node
// WCAG 2.1 AA contrast check for the player home and CRM colour tokens.
// Reads the real values from the CSS files so a palette edit that breaks
// contrast fails CI. Normal text needs 4.5:1.

import { readFileSync } from 'node:fs'

const FILES = ['src/features/home/PlayerHome.css', 'src/features/crm/Crm.css']
const PAGE_BG = '#06070b' // --bg in src/index.css

function tokens() {
  const out = {}
  for (const file of FILES) {
    const css = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
    for (const m of css.matchAll(/--((?:ph|crm)-[a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)) out[m[1]] = m[2]
  }
  return out
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

export function checkContrast() {
  const t = tokens()
  const failures = []
  const results = []
  for (const prefix of ['ph', 'crm']) {
    const fgs = ['text', 'text-strong', 'text-muted', 'accent', 'ok', 'warn', 'danger', 'pro', 'elite', 'champion', ...(prefix === 'crm' ? ['info'] : [])]
    const bgs = { surface: t[`${prefix}-surface`], 'surface-2': t[`${prefix}-surface-2`], page: PAGE_BG }
    for (const fg of fgs) {
      const color = t[`${prefix}-${fg}`]
      if (!color) {
        failures.push(`${prefix}-${fg}: token not found`)
        continue
      }
      for (const [bgName, bg] of Object.entries(bgs)) {
        const ratio = contrast(color, bg)
        results.push({ pair: `--${prefix}-${fg} on ${bgName}`, ratio: Math.round(ratio * 100) / 100 })
        if (ratio < 4.5) failures.push(`--${prefix}-${fg} (${color}) on ${bgName} (${bg}) is ${ratio.toFixed(2)}:1, needs 4.5:1`)
      }
    }
  }
  // Fixed pairs used by specific components.
  for (const [label, fg, bg] of [['unread badge', '#03141a', t['ph-accent']], ['done checkmark', '#04110a', t['ph-ok']]]) {
    const ratio = contrast(fg, bg)
    results.push({ pair: label, ratio: Math.round(ratio * 100) / 100 })
    if (ratio < 4.5) failures.push(`${label} is ${ratio.toFixed(2)}:1, needs 4.5:1`)
  }
  return { failures, results }
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('check-contrast.mjs')) {
  const { failures, results } = checkContrast()
  const worst = results.slice().sort((a, b) => a.ratio - b.ratio).slice(0, 5)
  console.log(`checked ${results.length} colour pairs; lowest: ${worst.map((w) => `${w.pair} ${w.ratio}:1`).join('; ')}`)
  if (failures.length) {
    console.error(`Contrast check failed:\n- ${failures.join('\n- ')}`)
    process.exit(1)
  }
}
