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
import { verifiedFor } from '../src/data/verified-callouts.js'
import MAPS from '../src/data/maps.js'
import STRATS from '../src/data/strats.js'
import BANS from '../src/data/bans.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'lambda', 'vod', 'r6-context.json')

const words = (s) => ` ${String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `

// True when every word of `name` was read off the screen on this map: an exact
// footage name, or a shortening of one ("CEO" for "CEO Office"). Stricter than
// isVerifiedName(), which also passes "Football Office" because "Office" was
// seen. That is fine for flagging callouts on strat pages, but the reviewer
// would repeat the unseen name as fact.
function seenInFootage(mapId, name) {
  const v = verifiedFor(mapId)
  if (!v || !name) return false
  const k = words(name)
  return [...v.sites, ...v.spawns, ...v.callouts].some((e) => words(e.name).includes(k))
}

const ctx = {
  generated_at: new Date().toISOString(),
  maps: {},
  // Operator role lookup — useful for prompting the AI to judge utility
  // usage based on what the operator's gadget is actually for.
  operator_roles: {},
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
      return {
        id: site.id,
        name: site.name,
        floor: site.floor,
        attack_operators: attackOps,
        defense_operators: defenseOps,
        // Only room names read off real match footage reach the reviewer. The
        // VOD prompt presents the selected site as authoritative, and strats.js
        // callouts include names nobody has seen in game (map-wide stamps such
        // as "Service Corridor"; see handoff/recon6-strat-audit.md).
        callouts: callouts.filter((name) => seenInFootage(map.id, name)),
        attack_strategy_summary: siteStrat?.attack?.strategy?.slice(0, 250) || null,
        defense_strategy_summary: siteStrat?.defense?.strategy?.slice(0, 250) || null,
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
