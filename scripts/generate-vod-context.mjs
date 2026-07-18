#!/usr/bin/env node
// Exports a flat JSON file of map → site → side context (operators, callouts,
// utility, bans, premium tactics) that the VOD Lambda imports at cold start.
// Lets the AI VOD review reference Aaron's strat data when giving feedback,
// instead of relying solely on Claude's general R6 knowledge.
//
// Output: lambda/vod/r6-context.json
// Run: node scripts/generate-vod-context.mjs

import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import MAPS from '../src/data/maps.js'
import { RANKED_ROTATION } from '../src/data/rankedRotation.js'
import STRATS from '../src/data/strats.js'
import BANS from '../src/data/bans.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'lambda', 'vod', 'r6-context.json')

const ctx = {
  generated_at: new Date().toISOString(),
  ranked_rotation: RANKED_ROTATION,
  maps: {},
  // Operator role lookup — useful for prompting the AI to judge utility
  // usage based on what the operator's gadget is actually for.
  operator_roles: {},
}

// Exact summaries repeated across multiple sites are templated filler, not
// trustworthy site knowledge. Keep the source data intact, but quarantine
// those sentences from coach context until a human verifies replacements.
const summaryFrequency = new Map()
const longStringFrequency = new Map()
function countLongStrings(value) {
  if (typeof value === 'string' && value.length >= 60) {
    longStringFrequency.set(value, (longStringFrequency.get(value) || 0) + 1)
  } else if (Array.isArray(value)) {
    value.forEach(countLongStrings)
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach(countLongStrings)
  }
}
countLongStrings(STRATS)

for (const mapStrats of Object.values(STRATS)) {
  for (const siteStrat of Object.values(mapStrats)) {
    for (const side of ['attack', 'defense']) {
      const summary = siteStrat?.[side]?.strategy?.trim()
      if (summary) summaryFrequency.set(summary, (summaryFrequency.get(summary) || 0) + 1)
    }
  }
}

function repeatedTacticCount(value) {
  let count = 0
  function walk(item) {
    if (typeof item === 'string' && item.length >= 60 && (longStringFrequency.get(item) || 0) >= 3) count++
    else if (Array.isArray(item)) item.forEach(walk)
    else if (item && typeof item === 'object') Object.values(item).forEach(walk)
  }
  walk(value)
  return count
}

function safeSummary(summary) {
  if (!summary) return { summary: null, context_status: 'missing' }
  if ((summaryFrequency.get(summary.trim()) || 0) >= 3) {
    return { summary: null, context_status: 'quarantined_repeated_generic' }
  }
  return { summary: summary.slice(0, 250), context_status: 'available' }
}

// Build map index
for (const map of MAPS) {
  const mapStrats = STRATS[map.id] || {}
  const mapBans = BANS[map.id] || { attack: [], defense: [] }
  ctx.maps[map.id] = {
    name: map.name,
    sites: map.sites.map(site => {
      const siteStrat = mapStrats[site.id]
      const attackOps = siteStrat?.attack?.operators?.map(o => `${o.name} (${o.role})`) || []
      const defenseOps = siteStrat?.defense?.operators?.map(o => `${o.name} (${o.role})`) || []
      const callouts = siteStrat?.attack?.callouts || siteStrat?.defense?.callouts || []
      const attack = safeSummary(siteStrat?.attack?.strategy)
      const defense = safeSummary(siteStrat?.defense?.strategy)
      return {
        id: site.id,
        name: site.name,
        floor: site.floor,
        attack_operators: attackOps,
        defense_operators: defenseOps,
        callouts,
        attack_strategy_summary: attack.summary,
        attack_context_status: attack.context_status,
        attack_quarantined_repeated_tactics: repeatedTacticCount(siteStrat?.attack),
        defense_strategy_summary: defense.summary,
        defense_context_status: defense.context_status,
        defense_quarantined_repeated_tactics: repeatedTacticCount(siteStrat?.defense),
      }
    }),
    bans: {
      attack: mapBans.attack.map(b => ({ name: b.name, reason: b.reason.slice(0, 200) })),
      defense: mapBans.defense.map(b => ({ name: b.name, reason: b.reason.slice(0, 200) })),
    },
  }
}

// Build operator role index from STRATS
const opIndex = {}
for (const mapId of Object.keys(STRATS)) {
  for (const siteId of Object.keys(STRATS[mapId])) {
    for (const side of ['attack', 'defense']) {
      const ops = STRATS[mapId][siteId][side]?.operators || []
      for (const op of ops) {
        if (!opIndex[op.name]) opIndex[op.name] = { roles: new Set(), side }
        opIndex[op.name].roles.add(op.role)
      }
    }
  }
}
for (const [name, data] of Object.entries(opIndex)) {
  ctx.operator_roles[name] = {
    roles: [...data.roles],
    side: data.side, // dominant side
  }
}

writeFileSync(OUT, JSON.stringify(ctx, null, 2))
const size = JSON.stringify(ctx).length
console.log(`✓ Wrote ${OUT} (${(size/1024).toFixed(1)} KB)`)
console.log(`  Maps: ${Object.keys(ctx.maps).length}`)
console.log(`  Operators: ${Object.keys(ctx.operator_roles).length}`)
