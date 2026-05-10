#!/usr/bin/env node
// Fortnite — generates v1 data files for No Build / Zero Build BR.
//
// Schema mapping:
//   "operators" → 4 player loadout archetypes (Fortnite skins are cosmetic only)
//   "sites"     → POIs on the current chapter map
//   "sides"     → 'attack' = early/mid game POI engage, 'defense' = endgame zone hold
//   "picks"     → drop spot recommendations per map (replaces bans.js)

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '..', 'src', 'data', 'games', 'fn')

// VERIFY: Chapter cycle changes every 3-4 months. Current chapter POIs as of
// May 2026 — re-verify against official Fortnite map. The structure of (chapter,
// POIs) holds even if specific names rotate.

const MAP_DATA = {
  'current-chapter': {
    name: 'Current Chapter Map (Zero Build)', rankedPool: true,
    extraCallouts: ['Storm Edge', 'Storm Center', 'Highway', 'Forest', 'River', 'Spawn Island', 'Rotation Path'],
    sites: [
      { id: 'pleasant-piazza', name: 'Pleasant Piazza', rooms: ['Plaza Center', 'Loot Buildings', 'Rooftops', 'Side Streets', 'Spawn Path'] },
      { id: 'foxy-floodgate', name: 'Foxy Floodgate', rooms: ['Dam Center', 'Loot Buildings', 'Bridge', 'Side Path', 'Coast'] },
      { id: 'hidden-hollow', name: 'Hidden Hollow', rooms: ['Cave', 'Loot Pile', 'Forest Edge', 'Side Path', 'Spawn Path'] },
      { id: 'magic-mosses', name: 'Magic Mosses', rooms: ['Tower', 'Loot Houses', 'Forest', 'Side Path', 'Bridge'] },
      { id: 'foxy-faulks', name: 'Foxy Faulks', rooms: ['Center Plaza', 'Loot Buildings', 'Rooftops', 'Side Streets', 'Spawn Path'] },
      { id: 'demons-domain', name: "Demon's Domain", rooms: ['Castle', 'Loot Houses', 'Tower', 'Side Path', 'Forest Edge'] },
      { id: 'brutal-beachhead', name: 'Brutal Beachhead', rooms: ['Beach', 'Loot Buildings', 'Coast', 'Side Path', 'Spawn Path'] },
      { id: 'shogun-x', name: "Shogun's X-tate", rooms: ['Temple', 'Loot Houses', 'Garden', 'Side Path', 'Bridge'] },
      { id: 'masked-meadows', name: 'Masked Meadows', rooms: ['Field', 'Loot Houses', 'Forest', 'Side Path', 'Bridge'] },
      { id: 'open-air-onsen', name: 'Open-Air Onsen', rooms: ['Spa Center', 'Loot Buildings', 'Forest', 'Side Path', 'Bridge'] },
      { id: 'twinkle-terrace', name: 'Twinkle Terrace', rooms: ['Plaza', 'Loot Buildings', 'Rooftops', 'Side Streets', 'Spawn Path'] },
      { id: 'ranger-ridge', name: 'Ranger Ridge', rooms: ['Ridge Top', 'Loot Houses', 'Forest', 'Side Path', 'Bridge'] },
    ],
  },
}

const CAST = [
  { id: 'aggressor', name: 'Aggressor', role: 'Aggressor / Entry', side: null, kit: ['SMG / Shotgun', 'Heals (Med Kit, Big Pots)', 'Mobility (Crash Pad / Shockwave)'] },
  { id: 'marksman', name: 'Marksman', role: 'Sniper / Marksman', side: null, kit: ['Sniper Rifle / DMR', 'AR (secondary)', 'Mobility item', 'Mini Shields'] },
  { id: 'support', name: 'Support', role: 'Support / Healer', side: null, kit: ['AR / SMG', 'Med Kit / Bandages', 'Mobility item', 'Wall Item / Trap'] },
  { id: 'rotator', name: 'Rotator', role: 'Mobility / Scout', side: null, kit: ['SMG / AR', 'Mobility (Launch Pad / Boogie Bomb)', 'Mini Shields', 'Heals'] },
]

function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h }

function buildOps(seed, side) {
  return [
    { name: 'Aggressor', role: 'Entry / Push', priority: 'essential' },
    { name: 'Marksman', role: 'Long-range trade', priority: 'essential' },
    { name: 'Rotator', role: 'Mobility / Scout', priority: 'recommended' },
    { name: 'Support', role: 'Heal / Wall', priority: 'recommended' },
  ]
}

const ATTACK_TEMPLATES = [
  ({ poi, r1 }) => `Hot drop on ${poi}: Aggressor entries for the early frag, Marksman holds long sightline from ${r1}, Rotator scouts incoming squads, Support loots up. Force loot consolidation before third party arrives.`,
  ({ poi, r1 }) => `Edge drop on ${poi}: land outside the contested zone, Rotator scouts threats, Support loots up. Push ${r1} when full kit; do not rush undergeared.`,
  ({ poi, r1 }) => `Mid-game rotation through ${poi}: Marksman scans the contested zone, Aggressor positions for the third party, Support preps healing. Take ${r1} as a transit point, not a fight commit.`,
  ({ poi, r1 }) => `Squad split on ${poi}: Aggressor + Rotator take ${r1}, Support + Marksman loot the outer ring. Reconvene on next ring callout — do not split past 100m.`,
  ({ poi, r1 }) => `Late-game push into ${poi}: Marksman scans the holding squad, Aggressor flanks via mobility item, Support preps heals. Force the fight before zone closes.`,
]

const DEFENSE_TEMPLATES = [
  ({ poi, r1 }) => `Hold ${poi} for endgame: Support places utility on chokes, Aggressor anchors the close-range fight, Marksman picks distant pushers. Rotator watches squad approach pings.`,
  ({ poi, r1 }) => `Building hold on ${poi}: Support runs heal cycle, Aggressor holds the door, Marksman covers windows. Save mobility items for the inevitable spawn flip.`,
  ({ poi, r1 }) => `Stack ${poi} with high ground: Marksman on ridge, Aggressor anchor, Support on heal cycle, Rotator scouting. Push only when ring forces movement.`,
  ({ poi, r1 }) => `Final ring hold on ${poi}: Marksman picks rotators, Aggressor body-blocks the standard push, Support cycles heals, Rotator watches for late approaches.`,
  ({ poi, r1 }) => `Off-angle hold on ${poi}: Marksman on the unconventional sightline, Aggressor draws aggro on main, Support trades, Rotator pre-pings third party.`,
]

const TACTICAL_NOTES = {
  'current-chapter': {
    'pleasant-piazza': { attack: 'Plaza center is contested — drop edge buildings first if ring forces.', defense: 'Rooftop hold with Marksman + Plaza ground anchor wins most contests.' },
    'foxy-floodgate': { attack: 'Dam center is exposed — Aggressor commits with Support heal cover.', defense: 'Bridge cross-fire from Coast wins the standard contest.' },
    'demons-domain': { attack: 'Castle vertical pressure denies the standard hold.', defense: 'Tower + Side Path cross-fire wins the standard contest.' },
    'brutal-beachhead': { attack: 'Beach approach is open — Support smokes for cover on the loot run.', defense: 'Rooftop hold with Coast trade is the standard hold.' },
  },
}

function buildSiteStrat(mapId, site) {
  const seed = mapId + site.id
  const aOps = buildOps(seed + 'A', 'attack')
  const dOps = buildOps(seed + 'D', 'defense')
  const aTmpl = ATTACK_TEMPLATES[hash(seed + 'aTone') % ATTACK_TEMPLATES.length]
  const dTmpl = DEFENSE_TEMPLATES[hash(seed + 'dTone') % DEFENSE_TEMPLATES.length]
  const callouts = [...site.rooms, ...MAP_DATA[mapId].extraCallouts].slice(0, 7)
  const tactical = TACTICAL_NOTES[mapId]?.[site.id] || {}
  const r1 = site.rooms[0]
  const poi = site.name

  return {
    attack: {
      operators: aOps,
      strategy: aTmpl({ poi, r1 }) + (tactical.attack ? ' ' + tactical.attack : ''),
      callouts,
      utility: [
        `Aggressor: SMG / Shotgun for entry frag; mobility item for repositioning`,
        `Marksman: Sniper / DMR for long sightline; AR for mid-range trade`,
        `Rotator: Mobility item priority (Launch Pad / Crash Pad / Shockwave)`,
        `Support: Heals + Wall item for cover; protects rotation`,
      ],
      premiumTactics: {
        attackSpawns: [
          { spawn: `${poi} primary drop`, from: r1, use: `Hot-drop loot priority — secure tier-1 weapons + heals before contesting building.` },
          { spawn: `${poi} edge drop`, from: 'Outer ridge', use: `Safer drop — loot full kit before pushing main building.` },
        ],
        spawnKillSpots: [
          { from: r1, target: 'contested squad on adjacent loot pile', risk: 'Medium — third party from any direction', reward: 'Squad wipe + loot consolidation in early game' },
        ],
        advancedSetups: [
          `Mobility chain: Aggressor uses Crash Pad to commit, Rotator follows with Launch Pad, Support throws heals during the push.`,
          `Squad comp synergy: Marksman pre-aims long sightline, Aggressor takes the close-range duel, Rotator pinches from off-angle.`,
          `Rotation read: at ring 2 close, decide to fight or rotate based on adjacent squad count — never engage 3-team fights without info advantage.`,
        ],
      },
    },
    defense: {
      operators: dOps,
      strategy: dTmpl({ poi, r1 }) + (tactical.defense ? ' ' + tactical.defense : ''),
      callouts,
      utility: [
        `Aggressor: SMG / Shotgun for close-range hold`,
        `Marksman: Sniper / DMR holds long sightline`,
        `Rotator: Mobility item ready for the inevitable rotation`,
        `Support: Heals + Wall for cover; protects squad through the contest`,
      ],
      premiumTactics: {
        runouts: [
          { from: r1, target: 'incoming squad rotation path', timing: 'Ring 4-5 close — punish squads forced into your zone' },
          { from: 'Side ridge', target: 'flanking third party', timing: 'Mid-fight — peel for teammate that engaged first' },
        ],
        antiSpawnPeek: [
          `Pre-aim the standard ${tactical.attack?.includes('vertical') ? 'vertical / rooftop' : 'main approach'} — most pushes commit from the same path each round.`,
          `Save the off-angle Marksman shot for the eco round — switching position forces re-clearing.`,
          `Trade-stack ${r1} with the Aggressor — if entry takes a duel, the trade kill is on a fixed crosshair placement.`,
        ],
        advancedSetups: [
          `High ground: Marksman holds the highest available ridge, Support drops heals from above, Aggressor pulls duel from below.`,
          `Off-angle anchor in ${r1} forces push to re-clear, buys teammates 2-3 seconds for utility setup.`,
          `Final ring positioning: Marksman pre-aims most-likely rotation path, Aggressor body-blocks the choke, Support cycles heals on the cleanup.`,
        ],
      },
    },
  }
}

const DROP_PICKS = {
  'current-chapter': [
    { name: 'Pleasant Piazza', reason: 'Tier-1 loot guaranteed in plaza buildings. Hot drop with full squad — fight for it or land edge.', tier: 'S' },
    { name: 'Foxy Floodgate', reason: 'Dam center has tier-1 loot + bridge rotation. Mid contest level.', tier: 'A' },
    { name: 'Demon\'s Domain', reason: 'Castle has tier-1 loot but high contest. Drop with full squad commit only.', tier: 'S' },
    { name: 'Hidden Hollow', reason: 'Mid-tier loot, low contest. Safe drop for ranked when contested POIs are crowded.', tier: 'B' },
    { name: 'Brutal Beachhead', reason: 'Tier-1 loot in coastal buildings. Mid contest with rotation options via boats.', tier: 'A' },
    { name: 'Magic Mosses', reason: 'Mid-tier loot in tower + houses. Low contest, good for cautious squads.', tier: 'B' },
  ],
}

const META = {
  _comment: 'Last verified: 2026-05 — based on Fortnite community + competitive tier list snapshot. Weapons tier list (no character meta).',
  S: ['Hammer Pump Shotgun', 'Striker AR', 'Rapid SMG', 'Heisted Sniper'],
  A: ['Frenzy Auto Shotgun', 'Tactical AR', 'Hyper SMG', 'DMR Sniper', 'Combat Pistol'],
  B: ['Pump Shotgun', 'Burst AR', 'Submachine Gun', 'Heavy Sniper', 'Suppressed Pistol'],
  C: ['Twin Mag SMG', 'Heavy Shotgun', 'Bolt Sniper', 'Revolver', 'Throwables (Boogie / Shockwave)'],
  bans_attack: [],
  bans_defense: [],
}

const GAME_META = {
  id: 'fn', name: 'fn', displayName: 'Fortnite (Zero Build)', color: '#9D4DBB', slug: 'fn',
  vocab: { map: 'Map', site: 'POI', operator: 'Loadout', side_attack: 'Engage', side_defense: 'Hold' },
}

function emitMaps() {
  const lines = ['// Fortnite Zero Build — current chapter map POIs (May 2026).']
  lines.push('// VERIFY: Fortnite rotates POIs every chapter (~3-4 months) — re-verify')
  lines.push('// names against the official Fortnite map before relying on specific POIs.')
  lines.push('')
  lines.push('const MAPS = [')
  for (const [id, data] of Object.entries(MAP_DATA)) {
    lines.push('  {')
    lines.push(`    id: ${JSON.stringify(id)},`)
    lines.push(`    name: ${JSON.stringify(data.name)},`)
    lines.push(`    rankedPool: ${data.rankedPool},`)
    lines.push('    sites: [')
    for (const site of data.sites) {
      lines.push(`      { id: ${JSON.stringify(site.id)}, name: ${JSON.stringify(site.name)}, floor: '—' },`)
    }
    lines.push('    ],')
    lines.push('  },')
  }
  lines.push(']')
  lines.push('')
  lines.push('export default MAPS')
  return lines.join('\n')
}

function emitOperators() {
  const lines = ['// Fortnite Zero Build — 4 player loadout archetypes (Fortnite skins are cosmetic).']
  lines.push('')
  lines.push('const CAST = [')
  for (const op of CAST) {
    lines.push(`  { id: ${JSON.stringify(op.id)}, name: ${JSON.stringify(op.name)}, role: ${JSON.stringify(op.role)}, side: null, kit: [${op.kit.map((k) => JSON.stringify(k)).join(', ')}] },`)
  }
  lines.push(']')
  lines.push('')
  lines.push('export default CAST')
  return lines.join('\n')
}

function emitStrats() {
  const lines = ['// Fortnite Zero Build — v1 generated strats. Per (map, POI, side).']
  lines.push('// `attack` = early/mid game engage, `defense` = endgame zone hold.')
  lines.push('')
  lines.push('const STRATS = {')
  for (const [mapId, data] of Object.entries(MAP_DATA)) {
    lines.push(`  ${JSON.stringify(mapId)}: {`)
    for (const site of data.sites) {
      lines.push(`    ${JSON.stringify(site.id)}: ${formatSide(buildSiteStrat(mapId, site))},`)
    }
    lines.push('  },')
  }
  lines.push('}')
  lines.push('')
  lines.push('export default STRATS')
  return lines.join('\n')
}

function formatSide(strat) { return `{
      attack: ${formatStratBlock(strat.attack)},
      defense: ${formatStratBlock(strat.defense)},
    }` }
function formatStratBlock(b) {
  const opsJs = b.operators.map((o) => `          { name: ${JSON.stringify(o.name)}, role: ${JSON.stringify(o.role)}, priority: ${JSON.stringify(o.priority)} }`).join(',\n')
  const calloutsJs = b.callouts.map((c) => JSON.stringify(c)).join(', ')
  const utilityJs = b.utility.map((u) => `          ${JSON.stringify(u)}`).join(',\n')
  const premiumJs = b.premiumTactics ? `,\n        premiumTactics: ${formatPremium(b.premiumTactics)}` : ''
  return `{
        operators: [
${opsJs},
        ],
        strategy: ${JSON.stringify(b.strategy)},
        callouts: [${calloutsJs}],
        utility: [
${utilityJs},
        ]${premiumJs},
      }`
}
function formatPremium(p) {
  const parts = []
  if (p.attackSpawns) parts.push(`          attackSpawns: [\n${p.attackSpawns.map((s) => `            { spawn: ${JSON.stringify(s.spawn)}, from: ${JSON.stringify(s.from)}, use: ${JSON.stringify(s.use)} }`).join(',\n')},\n          ]`)
  if (p.spawnKillSpots) parts.push(`          spawnKillSpots: [\n${p.spawnKillSpots.map((s) => `            { from: ${JSON.stringify(s.from)}, target: ${JSON.stringify(s.target)}, risk: ${JSON.stringify(s.risk)}, reward: ${JSON.stringify(s.reward)} }`).join(',\n')},\n          ]`)
  if (p.runouts) parts.push(`          runouts: [\n${p.runouts.map((s) => `            { from: ${JSON.stringify(s.from)}, target: ${JSON.stringify(s.target)}, timing: ${JSON.stringify(s.timing)} }`).join(',\n')},\n          ]`)
  if (p.antiSpawnPeek) parts.push(`          antiSpawnPeek: [\n${p.antiSpawnPeek.map((s) => `            ${JSON.stringify(s)}`).join(',\n')},\n          ]`)
  if (p.advancedSetups) parts.push(`          advancedSetups: [\n${p.advancedSetups.map((s) => `            ${JSON.stringify(s)}`).join(',\n')},\n          ]`)
  return `{\n${parts.join(',\n')},\n        }`
}

function emitPicks() {
  const lines = ['// Fortnite Zero Build — drop spot recommendations per map.']
  lines.push('// Tier indicates contest level + loot quality.')
  lines.push('')
  lines.push('const PICKS = {')
  for (const [mapId, drops] of Object.entries(DROP_PICKS)) {
    lines.push(`  ${JSON.stringify(mapId)}: [`)
    for (const d of drops) {
      lines.push(`    { name: ${JSON.stringify(d.name)}, tier: ${JSON.stringify(d.tier)}, reason: ${JSON.stringify(d.reason)} },`)
    }
    lines.push('  ],')
  }
  lines.push('}')
  lines.push('')
  lines.push('export default PICKS')
  return lines.join('\n')
}

function emitMeta() { return JSON.stringify(META, null, 2) }

function emitIndex() {
  return [
    "import MAPS from './maps.js'",
    "import CAST from './operators.js'",
    "import STRATS from './strats.js'",
    "import PICKS from './picks.js'",
    "import META from './meta.json' with { type: 'json' }",
    '',
    `const gameMeta = ${JSON.stringify(GAME_META, null, 2)}`,
    '',
    'export { MAPS, CAST, STRATS, PICKS, META, gameMeta }',
    'export default { MAPS, CAST, STRATS, PICKS, META, gameMeta }',
    '',
  ].join('\n')
}

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(resolve(OUT_DIR, 'maps.js'), emitMaps() + '\n')
writeFileSync(resolve(OUT_DIR, 'operators.js'), emitOperators() + '\n')
writeFileSync(resolve(OUT_DIR, 'strats.js'), emitStrats() + '\n')
writeFileSync(resolve(OUT_DIR, 'picks.js'), emitPicks() + '\n')
writeFileSync(resolve(OUT_DIR, 'meta.json'), emitMeta() + '\n')
writeFileSync(resolve(OUT_DIR, 'index.js'), emitIndex())

console.log(`Wrote Fortnite data to ${OUT_DIR}`)
console.log(`  ${Object.keys(MAP_DATA).length} maps, ${CAST.length} archetypes, ${Object.values(MAP_DATA).reduce((n, m) => n + m.sites.length * 2, 0)} strat blocks`)
