#!/usr/bin/env node
// Halo Infinite — generates v1 data files for Arena Ranked. 4v4, symmetric.
//
// Schema mapping:
//   "operators" → 4 player role archetypes (Halo has no heroes)
//   "sites"     → key map zones (Top Mid, Power Weapon spawns, Bases)
//   "sides"     → 'attack' = aggressing on enemy base / power-pickup setup
//                 'defense' = anchoring own base / setup hold
//   "picks"     → must-pick weapon + power-up loadouts per map (no bans in Halo)
//   premiumTactics keys re-purposed for power weapon timings, grenade arcs.

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '..', 'src', 'data', 'games', 'halo')

const MAP_DATA = {
  aquarius: {
    name: 'Aquarius', rankedPool: true,
    extraCallouts: ['Top Mid', 'Bottom Mid', 'Snipe Tower', 'Red Tunnel', 'Blue Tunnel', 'Pink Hall', 'Yellow Hall', 'Hammer'],
    sites: [
      { id: 'top-mid', name: 'Top Mid (Snipe)', rooms: ['Top Mid', 'Snipe Tower', 'Sky Bridge', 'Pink Ramp', 'Yellow Ramp'] },
      { id: 'bottom-mid', name: 'Bottom Mid', rooms: ['Bottom Mid', 'Hammer Spawn', 'Tunnel', 'Side Door', 'Center Pillar'] },
      { id: 'red-base', name: 'Red Base', rooms: ['Red Spawn', 'Red Lift', 'Red Hall', 'Red Window', 'Red Tunnel'] },
      { id: 'blue-base', name: 'Blue Base', rooms: ['Blue Spawn', 'Blue Lift', 'Blue Hall', 'Blue Window', 'Blue Tunnel'] },
    ],
  },
  'live-fire': {
    name: 'Live Fire', rankedPool: true,
    extraCallouts: ['Top Mid', 'Bottom Mid', 'Sniper Tower', 'OS Spawn', 'Red Hall', 'Blue Hall', 'Loading Dock', 'Garage'],
    sites: [
      { id: 'top-mid', name: 'Top Mid (OS)', rooms: ['OS Spawn', 'Top Bridge', 'Sniper Tower', 'Pink Hall', 'Yellow Hall'] },
      { id: 'bottom-mid', name: 'Bottom Mid', rooms: ['Bottom Mid', 'Loading Dock', 'Garage', 'Side Lift', 'Center Pillar'] },
      { id: 'red-base', name: 'Red Base', rooms: ['Red Spawn', 'Red Lift', 'Red Hall', 'Red Catwalk', 'Red Tunnel'] },
      { id: 'blue-base', name: 'Blue Base', rooms: ['Blue Spawn', 'Blue Lift', 'Blue Hall', 'Blue Catwalk', 'Blue Tunnel'] },
    ],
  },
  recharge: {
    name: 'Recharge', rankedPool: true,
    extraCallouts: ['Top Mid', 'Bottom Mid', 'Sniper Spawn', 'Power Drain', 'Pit', 'Red Tunnel', 'Blue Tunnel', 'Cat Walk'],
    sites: [
      { id: 'top-mid', name: 'Top Mid (Snipe)', rooms: ['Top Mid', 'Sniper Spawn', 'Cat Walk', 'Red Ramp', 'Blue Ramp'] },
      { id: 'bottom-mid', name: 'Bottom Mid (Pit)', rooms: ['Pit', 'Power Drain', 'Tunnel', 'Side Lift', 'Center Pillar'] },
      { id: 'red-base', name: 'Red Base', rooms: ['Red Spawn', 'Red Lift', 'Red Hall', 'Red Window', 'Red Tunnel'] },
      { id: 'blue-base', name: 'Blue Base', rooms: ['Blue Spawn', 'Blue Lift', 'Blue Hall', 'Blue Window', 'Blue Tunnel'] },
    ],
  },
  streets: {
    name: 'Streets', rankedPool: true,
    extraCallouts: ['Top Mid', 'Bottom Mid', 'Hammer Spawn', 'Bus Stop', 'Diner', 'Subway', 'Red Tunnel', 'Blue Tunnel'],
    sites: [
      { id: 'top-mid', name: 'Top Mid (Bus Stop)', rooms: ['Bus Stop', 'Top Hall', 'Pink Window', 'Yellow Window', 'Sky Bridge'] },
      { id: 'bottom-mid', name: 'Bottom Mid (Subway)', rooms: ['Subway', 'Hammer Spawn', 'Tunnel', 'Side Door', 'Center Pillar'] },
      { id: 'red-base', name: 'Red Base', rooms: ['Red Spawn', 'Red Lift', 'Red Hall', 'Red Window', 'Red Tunnel'] },
      { id: 'blue-base', name: 'Blue Base', rooms: ['Blue Spawn', 'Blue Lift', 'Blue Hall', 'Blue Window', 'Blue Tunnel'] },
    ],
  },
  bazaar: {
    name: 'Bazaar', rankedPool: true,
    extraCallouts: ['Top Mid', 'Bottom Mid', 'Snipe Tower', 'Market', 'OS Spawn', 'Red Tunnel', 'Blue Tunnel', 'Cafe'],
    sites: [
      { id: 'top-mid', name: 'Top Mid (Market)', rooms: ['Market', 'Snipe Tower', 'Top Bridge', 'Cafe', 'Yellow Hall'] },
      { id: 'bottom-mid', name: 'Bottom Mid', rooms: ['Bottom Mid', 'OS Spawn', 'Tunnel', 'Side Lift', 'Center Pillar'] },
      { id: 'red-base', name: 'Red Base', rooms: ['Red Spawn', 'Red Lift', 'Red Hall', 'Red Window', 'Red Tunnel'] },
      { id: 'blue-base', name: 'Blue Base', rooms: ['Blue Spawn', 'Blue Lift', 'Blue Hall', 'Blue Window', 'Blue Tunnel'] },
    ],
  },
  solitude: {
    name: 'Solitude', rankedPool: true,
    extraCallouts: ['Top Mid', 'Bottom Mid', 'Sniper Spawn', 'Center Bridge', 'Red Tunnel', 'Blue Tunnel', 'Snowdrift'],
    sites: [
      { id: 'top-mid', name: 'Top Mid (Snipe)', rooms: ['Top Mid', 'Sniper Spawn', 'Center Bridge', 'Red Ramp', 'Blue Ramp'] },
      { id: 'bottom-mid', name: 'Bottom Mid', rooms: ['Bottom Mid', 'Snowdrift', 'Tunnel', 'Side Lift', 'Center Pillar'] },
      { id: 'red-base', name: 'Red Base', rooms: ['Red Spawn', 'Red Lift', 'Red Hall', 'Red Window', 'Red Tunnel'] },
      { id: 'blue-base', name: 'Blue Base', rooms: ['Blue Spawn', 'Blue Lift', 'Blue Hall', 'Blue Window', 'Blue Tunnel'] },
    ],
  },
  empyrean: {
    name: 'Empyrean', rankedPool: true,
    extraCallouts: ['Top Mid', 'Bottom Mid', 'Sniper Tower', 'OS Spawn', 'Red Tunnel', 'Blue Tunnel', 'Sky Bridge', 'Forerunner'],
    sites: [
      { id: 'top-mid', name: 'Top Mid (Sniper Tower)', rooms: ['Sniper Tower', 'Sky Bridge', 'Top Hall', 'Forerunner', 'Pink Hall'] },
      { id: 'bottom-mid', name: 'Bottom Mid', rooms: ['Bottom Mid', 'OS Spawn', 'Tunnel', 'Side Lift', 'Center Pillar'] },
      { id: 'red-base', name: 'Red Base', rooms: ['Red Spawn', 'Red Lift', 'Red Hall', 'Red Window', 'Red Tunnel'] },
      { id: 'blue-base', name: 'Blue Base', rooms: ['Blue Spawn', 'Blue Lift', 'Blue Hall', 'Blue Window', 'Blue Tunnel'] },
    ],
  },
}

const CAST = [
  { id: 'slayer', name: 'Slayer', role: 'Entry / Frag', side: null, kit: ['BR / Commando', 'Sidekick', 'Frag Grenades', 'Repulsor', 'Grappleshot'] },
  { id: 'objective', name: 'Objective Runner', role: 'Objective', side: null, kit: ['BR', 'Sidekick', 'Plasma Grenades', 'Drop Wall', 'Threat Sensor'] },
  { id: 'power-weapon', name: 'Power Weapon Controller', role: 'AWP / Snipe', side: null, kit: ['Sniper Rifle / Skewer', 'BR (secondary)', 'Frag Grenades', 'Threat Sensor', 'Active Camo'] },
  { id: 'support', name: 'Support / Backup', role: 'Support', side: null, kit: ['BR / Commando', 'Sidekick', 'Plasma + Frag mix', 'Drop Wall', 'Repulsor'] },
]

function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h }

function buildOps(seed, side) {
  return [
    { name: 'Slayer', role: 'Entry', priority: 'essential' },
    { name: 'Power Weapon Controller', role: side === 'attack' ? 'Snipe / Trade' : 'Anchor', priority: 'essential' },
    { name: 'Objective Runner', role: 'Objective', priority: 'recommended' },
    { name: 'Support', role: 'Support', priority: 'recommended' },
  ]
}

const ATTACK_TEMPLATES = [
  ({ zone, r1 }) => `Aggress ${zone}: Slayer pushes the choke first, Power Weapon trades from range, Objective Runner sets up the next rotation. Support throws grenades to clear the corner anchor. Goal is gaining map control to start the power-up cycle.`,
  ({ zone, r1 }) => `Power-up rotation push on ${zone}: Power Weapon snipes the contested spot, Slayer entries on the trade, Objective Runner picks up. Support holds back-line for the spawn flip read.`,
  ({ zone, r1 }) => `Setup play on ${zone}: stack ${r1} with grenades, Slayer + Support push together, Power Weapon trades from high ground. Objective Runner stays back for the objective grab.`,
  ({ zone, r1 }) => `Spawn-flip aggression on ${zone}: push hard to force a spawn flip behind the enemy team. Slayer entries, Power Weapon traps the rotation, Objective Runner controls the new spawn area.`,
  ({ zone, r1 }) => `Coordinated rotation on ${zone}: Power Weapon grenade-arcs the contested spot, Slayer pushes on the explosion, Objective Runner secures, Support cleans up.`,
]

const DEFENSE_TEMPLATES = [
  ({ zone, r1 }) => `Anchor ${zone}: Slayer holds the choke from cover, Power Weapon snipes the long sightline, Objective Runner protects the objective spawn, Support throws grenades on push reads.`,
  ({ zone, r1 }) => `Defensive setup on ${zone}: Power Weapon controls the high ground, Slayer trades from cover, Objective Runner holds the spawn area, Support cycles utility on push.`,
  ({ zone, r1 }) => `Stack ${zone}: 3-on-zone with Slayer + Support + Objective Runner, Power Weapon plays off-angle for the round-opener pick. Hold the timing of power-up respawns.`,
  ({ zone, r1 }) => `Off-angle hold on ${zone}: Power Weapon plays the unconventional sightline, Slayer draws aggro on main, Objective Runner protects, Support trades.`,
  ({ zone, r1 }) => `Save / reset round: hold the back of ${zone}, do not commit. Slayer body-blocks the objective, Support keeps team alive. Stall for the spawn flip recovery.`,
]

const TACTICAL_NOTES = {
  aquarius: {
    'top-mid': { attack: 'Snipe Tower control wins the round — push with grenade-arc cover.', defense: 'Hold Snipe Tower with Power Weapon, trade off Tower lift on the take.' },
    'bottom-mid': { attack: 'Hammer pickup is the tempo swing — clear with grenades before contesting.', defense: 'Hammer denial with Drop Wall + grenades is the textbook bottom-mid hold.' },
    'red-base': { attack: 'Red Tunnel grenade arcs clear default anchor positions.', defense: 'Red Window + Red Lift cross-fire denies the standard tunnel push.' },
    'blue-base': { attack: 'Blue Tunnel grenade arcs clear default anchor positions.', defense: 'Blue Window + Blue Lift cross-fire denies the standard tunnel push.' },
  },
  'live-fire': {
    'top-mid': { attack: 'OS pickup is the round-opener — Power Weapon traps the rotation in.', defense: 'OS denial with Sniper from Tower wins the early game.' },
    'bottom-mid': { attack: 'Loading Dock + Garage flank isolates back-line on the take.', defense: 'Loading Dock anchor with grenades denies standard Bottom Mid push.' },
    'red-base': { attack: 'Red Catwalk vertical pressure denies the standard hold.', defense: 'Red Catwalk + Red Hall cross-fire wins the base hold.' },
    'blue-base': { attack: 'Blue Catwalk vertical pressure denies the standard hold.', defense: 'Blue Catwalk + Blue Hall cross-fire wins the base hold.' },
  },
  recharge: {
    'top-mid': { attack: 'Sniper Spawn timing is the round — Power Weapon traps the contested timing.', defense: 'Cat Walk anchor with Sniper denial wins the early game.' },
    'bottom-mid': { attack: 'Pit grenade arcs clear default anchor; push with Hammer pickup.', defense: 'Power Drain pickup denial with grenades is the standard bottom-mid hold.' },
    'red-base': { attack: 'Red Tunnel push with grenade cover clears the standard anchor.', defense: 'Red Window + Red Lift cross-fire denies the tunnel push.' },
    'blue-base': { attack: 'Blue Tunnel push with grenade cover clears the standard anchor.', defense: 'Blue Window + Blue Lift cross-fire denies the tunnel push.' },
  },
  streets: {
    'top-mid': { attack: 'Bus Stop is the tempo swing — push with grenade-arc cover.', defense: 'Sky Bridge cross-fire denies the standard Bus Stop push.' },
    'bottom-mid': { attack: 'Hammer pickup denial with Subway entry isolates the anchor.', defense: 'Hammer denial with grenades is the standard Subway hold.' },
    'red-base': { attack: 'Red Tunnel grenade arcs clear default anchor.', defense: 'Red Window + Red Lift cross-fire wins the base hold.' },
    'blue-base': { attack: 'Blue Tunnel grenade arcs clear default anchor.', defense: 'Blue Window + Blue Lift cross-fire wins the base hold.' },
  },
  bazaar: {
    'top-mid': { attack: 'Snipe Tower control wins the round — push with grenade cover.', defense: 'Sniper Tower hold + Cafe trade is the textbook top-mid hold.' },
    'bottom-mid': { attack: 'OS pickup is the tempo swing — Power Weapon traps the rotation.', defense: 'OS denial with grenades is the standard bottom-mid hold.' },
    'red-base': { attack: 'Red Tunnel push with grenade cover clears the standard anchor.', defense: 'Red Window cross-fire denies the standard tunnel push.' },
    'blue-base': { attack: 'Blue Tunnel push with grenade cover clears the standard anchor.', defense: 'Blue Window cross-fire denies the standard tunnel push.' },
  },
  solitude: {
    'top-mid': { attack: 'Sniper Spawn timing is the round — Power Weapon traps the contest.', defense: 'Center Bridge anchor with Sniper denial wins the early game.' },
    'bottom-mid': { attack: 'Snowdrift grenade arcs clear default anchor.', defense: 'Snowdrift denial with grenades is the standard hold.' },
    'red-base': { attack: 'Red Tunnel push with grenade cover clears the anchor.', defense: 'Red Window cross-fire denies the standard tunnel push.' },
    'blue-base': { attack: 'Blue Tunnel push with grenade cover clears the anchor.', defense: 'Blue Window cross-fire denies the standard tunnel push.' },
  },
  empyrean: {
    'top-mid': { attack: 'Sniper Tower is the contested space — Power Weapon traps the contest.', defense: 'Sky Bridge cross-fire denies the standard Sniper Tower take.' },
    'bottom-mid': { attack: 'OS pickup denial isolates the standard hold.', defense: 'OS denial with grenades is the standard bottom-mid hold.' },
    'red-base': { attack: 'Red Tunnel grenade arcs clear default anchor.', defense: 'Red Window cross-fire denies the standard tunnel push.' },
    'blue-base': { attack: 'Blue Tunnel grenade arcs clear default anchor.', defense: 'Blue Window cross-fire denies the standard tunnel push.' },
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
  const zone = site.name.replace(/\s*\(.+\)$/, '')

  return {
    attack: {
      operators: aOps,
      strategy: aTmpl({ zone, r1 }) + (tactical.attack ? ' ' + tactical.attack : ''),
      callouts,
      utility: [
        `Slayer: BR + Sidekick, Frag grenades for entry`,
        `Power Weapon: Sniper / Skewer trade from high ground`,
        `Objective Runner: BR + Plasma grenade for stick + objective grab`,
        `Support: Drop Wall + Repulsor for cover on push commit`,
      ],
      premiumTactics: {
        attackSpawns: [
          { spawn: `${zone} push timing`, from: r1, use: `Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup.` },
          { spawn: `${zone} re-engage spawn`, from: 'Spawn lift', use: `Group up after a wipe; do not trickle. Power Weapon respawn priority on commit.` },
        ],
        spawnKillSpots: [
          { from: r1, target: 'enemy power-weapon spawn timing', risk: 'Medium — exposes you to off-angle counter', reward: 'Power weapon control + map momentum' },
        ],
        advancedSetups: [
          `Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.`,
          `Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.`,
          `Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.`,
        ],
      },
    },
    defense: {
      operators: dOps,
      strategy: dTmpl({ zone, r1 }) + (tactical.defense ? ' ' + tactical.defense : ''),
      callouts,
      utility: [
        `Slayer: BR + Sidekick, holds choke from cover`,
        `Power Weapon: Sniper / Skewer holds long sightline`,
        `Objective Runner: protects objective spawn area`,
        `Support: Drop Wall + grenades for push denial`,
      ],
      premiumTactics: {
        runouts: [
          { from: r1, target: 'enemy power-up spawn approach', timing: 'Power-up respawn timer — pre-position to deny the standard pickup.' },
          { from: 'Side lift', target: 'enemy back-line', timing: 'Mid-fight — flank punish on enemy push commit.' },
        ],
        antiSpawnPeek: [
          `Pre-aim the standard grenade arc on ${r1} — most pushes throw the same Plasma at the choke each round.`,
          `Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.`,
          `Trade-stack ${r1} with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.`,
        ],
        advancedSetups: [
          `Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.`,
          `Off-angle anchor in ${r1} forces entry to re-clear, buys 2-3 seconds for utility setup.`,
          `Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.`,
        ],
      },
    },
  }
}

const PICKS = {}
for (const [mapId, data] of Object.entries(MAP_DATA)) {
  PICKS[mapId] = {
    attack: [
      { name: 'BR75 Battle Rifle', reason: `${data.name} is BR-defining — every gunfight at any range routes through the BR.` },
      { name: 'Sniper Rifle (power weapon)', reason: `${data.name} long sightlines reward the Sniper pickup; control the spawn timing.` },
      { name: 'Plasma Grenade (anchor sticky)', reason: `Plasma stick on contested choke + Frag chain denies the standard anchor on every push.` },
    ],
    defense: [
      { name: 'BR75 Battle Rifle', reason: `BR is the universal hold weapon — anchor positions all over ${data.name} reward consistent BR play.` },
      { name: 'Power weapon denial setup', reason: `${data.name} power weapon spawns rotate every 60-120s; deny the pickup with grenade arc + cross-fire.` },
      { name: 'Drop Wall + Threat Sensor', reason: `Drop Wall on the choke + Threat Sensor on push read covers most ${data.name} hold setups.` },
    ],
  }
}

const META = {
  _comment: 'Last verified: 2026-05 — based on HCS pro stats + Halo Infinite ranked tier list snapshot. Halo weapons-tier list (no character meta).',
  S: ['BR75 Battle Rifle', 'Sniper Rifle', 'Mangler', 'Bandit Evo'],
  A: ['Skewer', 'Rocket Launcher', 'Energy Sword', 'Gravity Hammer', 'Sidekick', 'Commando'],
  B: ['Stalker Rifle', 'Hydra', 'Cindershot', 'Heatwave', 'Plasma Pistol', 'Disruptor'],
  C: ['Pulse Carbine', 'Ravager', 'Needler', 'Plasma Carbine', 'Shock Rifle'],
  bans_attack: [],
  bans_defense: [],
}

const GAME_META = {
  id: 'halo', name: 'halo', displayName: 'Halo Infinite', color: '#0099FF', slug: 'halo',
  vocab: { map: 'Map', site: 'Zone', operator: 'Role', side_attack: 'Aggress', side_defense: 'Anchor' },
}

function emitMaps() {
  const lines = ['// Halo Infinite — Arena Ranked map pool May 2026.']
  lines.push('// Sites = key map zones (Top Mid, Bottom Mid, Red/Blue Base) per 4v4 symmetric layout.')
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
  const lines = ['// Halo Infinite — 4 player role archetypes (Halo has no characters).']
  lines.push('// Cast represents the standard 4v4 role split: Slayer, Power Weapon, Objective, Support.')
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
  const lines = ['// Halo Infinite — v1 generated strats. Per (map, zone, side).']
  lines.push('// `attack` = aggressing on enemy zone, `defense` = anchoring own zone.')
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
  const lines = ['// Halo Infinite — must-pick weapon + setup loadouts per map per side.']
  lines.push('// Halo has no character bans; this replaces bans.js with weapon priorities.')
  lines.push('')
  lines.push('const PICKS = {')
  for (const [mapId, sides] of Object.entries(PICKS)) {
    lines.push(`  ${JSON.stringify(mapId)}: {`)
    for (const side of ['attack', 'defense']) {
      lines.push(`    ${side}: [`)
      for (const item of sides[side]) {
        lines.push(`      { name: ${JSON.stringify(item.name)}, reason: ${JSON.stringify(item.reason)} },`)
      }
      lines.push('    ],')
    }
    lines.push('  },')
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

console.log(`Wrote Halo data to ${OUT_DIR}`)
console.log(`  ${Object.keys(MAP_DATA).length} maps, ${CAST.length} role archetypes, ${Object.values(MAP_DATA).reduce((n, m) => n + m.sites.length * 2, 0)} strat blocks`)
