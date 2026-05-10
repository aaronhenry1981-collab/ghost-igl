#!/usr/bin/env node
// Call of Duty — generates v1 data files. Covers Warzone BR/Resurgence
// + MW3 multiplayer 6v6.
//
// Schema mapping:
//   "operators" → 5 player loadout archetypes (CoD operators are skins, not roles)
//   "sites"     → POIs (Warzone) or objective zones (MP maps)
//   "sides"     → 'attack' = aggressing / rotating, 'defense' = anchoring
//   "picks"     → weapon loadout recommendations per map per side (no character bans)

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '..', 'src', 'data', 'games', 'cod')

const MAP_DATA = {
  // Warzone BR / Resurgence
  'rebirth-island': {
    name: 'Rebirth Island', type: 'Resurgence BR', rankedPool: true,
    extraCallouts: ['Spawn', 'Streets', 'Rooftops', 'High Ground', 'Tunnels', 'Coast', 'Lighthouse'],
    sites: [
      { id: 'prison', name: 'Prison Block', rooms: ['Prison Cells', 'Yard', 'Tower', 'Side Roof', 'Tunnel'] },
      { id: 'security', name: 'Security Area', rooms: ['Security Building', 'Loot Bins', 'Rooftop', 'Side Door', 'Streets'] },
      { id: 'headquarters', name: 'Headquarters', rooms: ['Main Building', 'Rooftop', 'Loot Bins', 'Side Door', 'Streets'] },
      { id: 'living-quarters', name: 'Living Quarters', rooms: ['Apartments', 'Loot Bins', 'Rooftop', 'Side Door', 'Streets'] },
      { id: 'industry', name: 'Industry', rooms: ['Factory', 'Loot Yard', 'Rooftop', 'Side Door', 'Streets'] },
    ],
  },
  verdansk: {
    name: 'Verdansk', type: 'BR', rankedPool: true,
    extraCallouts: ['Spawn', 'Streets', 'Rooftops', 'Highway', 'Train', 'Riverside', 'Forest'],
    sites: [
      { id: 'downtown', name: 'Downtown', rooms: ['Skyscrapers', 'Streets', 'Rooftops', 'Subway', 'Plaza'] },
      { id: 'superstore', name: 'Superstore', rooms: ['Main Floor', 'Rooftop', 'Parking Lot', 'Loading Dock', 'Streets'] },
      { id: 'airport', name: 'Airport', rooms: ['Terminal', 'Tower', 'Tarmac', 'Hangars', 'Streets'] },
      { id: 'farmland', name: 'Farmland', rooms: ['Barn', 'Silos', 'Fields', 'Roadside', 'House'] },
      { id: 'stadium', name: 'Stadium', rooms: ['Field', 'Stands', 'Tunnels', 'Concourse', 'Plaza'] },
      { id: 'dam', name: 'Dam', rooms: ['Top Catwalk', 'Lower Tunnels', 'Center Building', 'Rooftop', 'Streets'] },
      { id: 'hospital', name: 'Hospital', rooms: ['Main Floor', 'Rooftop', 'Side Wing', 'Garage', 'Streets'] },
    ],
  },
  // MW3 multiplayer maps (popular 6v6)
  skidrow: {
    name: 'Skidrow (MW3 6v6)', type: '6v6 MP', rankedPool: true,
    extraCallouts: ['Mid', 'Apartments', 'Streets', 'Rooftops', 'Spawn', 'Side Alley', 'Tunnel'],
    sites: [
      { id: 'mid', name: 'Mid Lane', rooms: ['Mid Alley', 'Window', 'Rooftop', 'Side Door', 'Streets'] },
      { id: 'apartments', name: 'Apartments', rooms: ['Apt Hall', 'Floors', 'Window', 'Rooftop', 'Streets'] },
      { id: 'spawn-side', name: 'Spawn Side', rooms: ['Spawn Building', 'Loot Bins', 'Rooftop', 'Streets', 'Side Door'] },
    ],
  },
  highrise: {
    name: 'Highrise (MW3 6v6)', type: '6v6 MP', rankedPool: true,
    extraCallouts: ['Helipad', 'Cranes', 'Office', 'Rooftops', 'Spawn', 'Side Catwalk', 'Tunnel'],
    sites: [
      { id: 'helipad', name: 'Helipad', rooms: ['Pad', 'Office', 'Rooftop', 'Side Catwalk', 'Streets'] },
      { id: 'cranes', name: 'Cranes / Construction', rooms: ['Crane Top', 'Construction Floor', 'Rooftop', 'Side Door', 'Streets'] },
      { id: 'office', name: 'Office Tower', rooms: ['Office Floors', 'Window', 'Rooftop', 'Side Door', 'Streets'] },
    ],
  },
  terminal: {
    name: 'Terminal (MW3 6v6)', type: '6v6 MP', rankedPool: true,
    extraCallouts: ['Plane', 'Tarmac', 'Lobby', 'Spawn', 'Side Hall', 'Tunnel', 'Rooftop'],
    sites: [
      { id: 'plane', name: 'Plane / Tarmac', rooms: ['Plane Stairs', 'Tarmac', 'Side Door', 'Rooftop', 'Streets'] },
      { id: 'lobby', name: 'Lobby', rooms: ['Main Floor', 'Side Hall', 'Window', 'Rooftop', 'Streets'] },
      { id: 'spawn-side', name: 'Spawn Side', rooms: ['Spawn Building', 'Loot Bins', 'Rooftop', 'Streets', 'Side Door'] },
    ],
  },
  rust: {
    name: 'Rust (MW3 6v6)', type: '6v6 MP', rankedPool: true,
    extraCallouts: ['Tower', 'Mid', 'Spawn', 'Rooftop', 'Streets', 'Tunnel'],
    sites: [
      { id: 'tower', name: 'Tower', rooms: ['Tower Top', 'Tower Base', 'Side Door', 'Rooftop', 'Streets'] },
      { id: 'mid', name: 'Mid Lane', rooms: ['Mid Alley', 'Crates', 'Window', 'Rooftop', 'Streets'] },
    ],
  },
  karachi: {
    name: 'Karachi (MW3 6v6)', type: '6v6 MP', rankedPool: true,
    extraCallouts: ['Mid', 'Streets', 'Buildings', 'Rooftops', 'Spawn', 'Side Alley', 'Tunnel'],
    sites: [
      { id: 'mid', name: 'Mid Lane', rooms: ['Mid Alley', 'Window', 'Rooftop', 'Side Door', 'Streets'] },
      { id: 'a-side', name: 'A Side', rooms: ['Building', 'Loot Bins', 'Rooftop', 'Streets', 'Side Door'] },
      { id: 'b-side', name: 'B Side', rooms: ['Building', 'Loot Bins', 'Rooftop', 'Streets', 'Side Door'] },
    ],
  },
  favela: {
    name: 'Favela (MW3 6v6)', type: '6v6 MP', rankedPool: true,
    extraCallouts: ['Mid', 'Hill', 'Streets', 'Rooftops', 'Spawn', 'Side Alley', 'Tunnel'],
    sites: [
      { id: 'mid-hill', name: 'Mid / Hill', rooms: ['Hill Top', 'Mid Alley', 'Window', 'Rooftop', 'Streets'] },
      { id: 'a-side', name: 'A Side', rooms: ['Buildings', 'Loot Bins', 'Rooftop', 'Streets', 'Side Door'] },
      { id: 'b-side', name: 'B Side', rooms: ['Buildings', 'Loot Bins', 'Rooftop', 'Streets', 'Side Door'] },
    ],
  },
}

const CAST = [
  { id: 'ar-anchor', name: 'AR Anchor', role: 'AR / Mid-range', side: null, kit: ['Assault Rifle', 'Frag Grenade', 'Stun Grenade', 'Dead Silence', 'Kevlar Vest'] },
  { id: 'smg-rush', name: 'SMG Rusher', role: 'SMG / Close-range', side: null, kit: ['SMG', 'Throwing Knife', 'Stun Grenade', 'Dead Silence', 'EOD'] },
  { id: 'lmg-pin', name: 'LMG Pinner', role: 'LMG / Suppression', side: null, kit: ['LMG', 'Claymore', 'Smoke Grenade', 'Cold-Blooded', 'Bomb Squad'] },
  { id: 'sniper', name: 'Sniper / Marksman', role: 'Sniper / Long-range', side: null, kit: ['Sniper Rifle / Marksman Rifle', 'Pistol (secondary)', 'Smoke Grenade', 'Cold-Blooded', 'Ghost'] },
  { id: 'support', name: 'Support / Tactical', role: 'Support', side: null, kit: ['Battle Rifle / SMG', 'Smoke Grenade', 'Stim', 'Recon Drone', 'Trophy System'] },
]

function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h }

function buildOps(seed, side) {
  return [
    { name: 'AR Anchor', role: 'AR', priority: 'essential' },
    { name: 'SMG Rusher', role: 'SMG / Entry', priority: 'essential' },
    { name: 'Sniper / Marksman', role: 'Sniper', priority: 'recommended' },
    { name: 'Support / Tactical', role: 'Support', priority: 'recommended' },
  ]
}

const ATTACK_TEMPLATES = [
  ({ poi, r1, mapType }) => `${mapType.includes('BR') ? 'Hot drop' : 'Push'} on ${poi}: SMG Rusher entries first, AR Anchor trades from mid-range, Sniper holds long sightline. Support runs Recon Drone for incoming squad info. ${mapType.includes('BR') ? 'Force loot consolidation before third-party arrives.' : 'Goal is gaining map control to start the rotation cycle.'}`,
  ({ poi, r1, mapType }) => `Setup play on ${poi}: SMG Rusher takes ${r1} for the early frag, AR Anchor and Sniper trade through chokes. Support throws Stun + Smoke for cover.`,
  ({ poi, r1, mapType }) => `Flank play on ${poi}: SMG Rusher takes the side path, AR Anchor + Sniper hold main angles, Support clears Claymores with EOD. Force a multi-angle commit.`,
  ({ poi, r1, mapType }) => `Mid-game rotation through ${poi}: AR Anchor pre-aims contested choke, SMG Rusher secures the flank, Sniper picks stragglers. Support runs Trophy System for utility denial.`,
  ({ poi, r1, mapType }) => `Coordinated push on ${poi}: SMG Rusher Stun-Grenades the choke, AR Anchor pushes on the explosion, Sniper traps the rotation, Support clears the next room.`,
]

const DEFENSE_TEMPLATES = [
  ({ poi, r1, mapType }) => `Anchor ${poi}: AR Anchor holds main choke from cover, Sniper picks distant targets, SMG Rusher watches flanks, Support places Claymores + Trophy System on entries.`,
  ({ poi, r1, mapType }) => `Setup hold on ${poi}: Sniper on high ground, AR Anchor on mid-range angle, SMG Rusher trades on entry, Support runs Recon Drone for push reads.`,
  ({ poi, r1, mapType }) => `Stack ${poi}: 3-on-zone with AR + Support + SMG, Sniper plays off-angle for round-opener pick. ${mapType.includes('BR') ? 'Force teams to push you in a 3rd-team-friendly setup.' : 'Save lethal utility for the second push commit.'}`,
  ({ poi, r1, mapType }) => `Off-angle hold on ${poi}: Sniper plays the unconventional angle, AR Anchor draws aggro on main, SMG Rusher trades, Support feeds intel.`,
  ({ poi, r1, mapType }) => `Save / reset round on ${poi}: hold the back of the zone, do not commit. AR Anchor body-blocks the objective, Support keeps team alive with Stim. Stall for ${mapType.includes('BR') ? 'the next ring rotation' : 'overtime trade or denied capture'}.`,
]

const TACTICAL_NOTES = {
  'rebirth-island': {
    prison: { attack: 'Yard is a death trap — clear with frags before contesting.', defense: 'Tower hold with Sniper + Tunnel anchor wins most contests.' },
    security: { attack: 'Rooftop entry from adjacent buildings catches the standard hold off-angle.', defense: 'Side Door + Streets cross-fire denies the standard rooftop push.' },
    headquarters: { attack: 'Main Building rooftop dive with Stun cover splits the hold.', defense: 'Rooftop snipe + Streets ground anchor is the textbook hold.' },
  },
  verdansk: {
    downtown: { attack: 'Subway flank from underneath catches the standard rooftop hold.', defense: 'Skyscraper hold with Subway choke Claymore is the textbook setup.' },
    airport: { attack: 'Tarmac is exposed — Support smokes for cover on the loot run.', defense: 'Tower hold with Hangar cross-fire denies the standard push.' },
    stadium: { attack: 'Tunnels flank from underneath catches the standard Stands hold.', defense: 'Concourse high ground with Plaza ground anchor wins most contests.' },
  },
  skidrow: {
    mid: { attack: 'Mid Alley is an SMG fight — Rusher takes the duel.', defense: 'Window cross-fire from Apartments wins the standard mid contest.' },
    apartments: { attack: 'Apt Hall vertical pressure denies the standard hold.', defense: 'Multi-floor anchor with Window cross-fire wins the apartments fight.' },
  },
  highrise: {
    helipad: { attack: 'Pad is exposed — Stun + Smoke for cover on the take.', defense: 'Office tower cross-fire denies the standard helipad take.' },
    cranes: { attack: 'Crane top vertical pressure denies the standard construction hold.', defense: 'Construction Floor anchor with Rooftop cross-fire wins the contest.' },
  },
  terminal: {
    plane: { attack: 'Plane Stairs is the contested space — AR Anchor pre-aims the lane.', defense: 'Tarmac cross-fire from Lobby wins the standard Plane contest.' },
    lobby: { attack: 'Lobby Window vertical pressure isolates the standard hold.', defense: 'Main Floor anchor with Side Hall cross-fire denies the push.' },
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
  const mapType = MAP_DATA[mapId].type

  return {
    attack: {
      operators: aOps,
      strategy: aTmpl({ poi, r1, mapType }) + (tactical.attack ? ' ' + tactical.attack : ''),
      callouts,
      utility: [
        `AR Anchor: AR + Frag Grenades for mid-range trades`,
        `SMG Rusher: SMG + Throwing Knife / Stun for entry frag`,
        `Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning`,
        `Support: Recon Drone for intel, Trophy System for grenade denial`,
      ],
      premiumTactics: {
        attackSpawns: [
          { spawn: `${poi} push timing`, from: r1, use: `${mapType.includes('BR') ? 'Ring rotation timing dictates push window — count 30s on incoming circle' : 'Killstreak respawn timer + UAV cycle dictates push'}.` },
          { spawn: `${poi} re-engage spawn`, from: 'Adjacent cover', use: `Group up after a wipe; do not trickle. Killstreak respawn priority on commit.` },
        ],
        spawnKillSpots: [
          { from: r1, target: 'enemy spawn rotation path', risk: 'Medium — exposes you to off-angle Sniper counter', reward: 'Round-opener pick that flips spawns + map control' },
        ],
        advancedSetups: [
          `Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.`,
          `${mapType.includes('BR') ? 'Loadout drop timing: drop the specialist box after the first ring close, full kit before mid-game commit' : 'Spawn read: push hard to force a spawn flip behind the enemy team — Sniper traps the new spawn rotation'}.`,
          `Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.`,
        ],
      },
    },
    defense: {
      operators: dOps,
      strategy: dTmpl({ poi, r1, mapType }) + (tactical.defense ? ' ' + tactical.defense : ''),
      callouts,
      utility: [
        `AR Anchor: AR + Frag for mid-range hold`,
        `SMG Rusher: SMG + Stun for entry trade`,
        `Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter`,
        `Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel`,
      ],
      premiumTactics: {
        runouts: [
          { from: r1, target: 'enemy approach path', timing: 'Setup phase — pre-position to deny the standard push.' },
          { from: 'Side rooftop', target: 'enemy back-line', timing: 'Mid-fight — flank punish on enemy main commit.' },
        ],
        antiSpawnPeek: [
          `Pre-aim the standard ${tactical.attack?.includes('vertical') ? 'vertical / rooftop' : 'main entry'} angle — most pushes commit from the same path each round.`,
          `Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.`,
          `Trade-stack ${r1} with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.`,
        ],
        advancedSetups: [
          `Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.`,
          `Off-angle hold in ${r1} forces entry to re-clear, buys teammates 2-3 seconds for utility setup.`,
          `${mapType.includes('BR') ? 'Rotation read: pre-position for the inevitable ring close — second team always comes from the new ring direction' : 'Killstreak hold: bring VTOL or Chopper Gunner for the final push, force enemies into prepared sightlines'}.`,
        ],
      },
    },
  }
}

const PICKS = {}
for (const [mapId, data] of Object.entries(MAP_DATA)) {
  PICKS[mapId] = {
    attack: [
      { name: 'Assault Rifle (mid-range loadout)', reason: `${data.name} mid-range engagements reward the AR — primary loadout for any push commit.` },
      { name: 'SMG (entry loadout)', reason: data.type.includes('BR') ? `${data.name} POI fights at close range; SMG Rusher takes first frag in any building contest.` : `${data.name} chokes are SMG range — Rusher with Dead Silence wins the mid take.` },
      { name: 'Stun Grenade + Smoke', reason: `${data.name} pushes commit on Stun + Smoke combo — denies the anchor's pre-aim and breaks line of sight.` },
    ],
    defense: [
      { name: 'Assault Rifle (anchor loadout)', reason: `AR is the universal hold weapon — anchor positions on ${data.name} all reward consistent AR play.` },
      { name: 'Sniper / Marksman (long sightline)', reason: `${data.name} long sightlines reward the Sniper pickup; off-angle is round-decider on contested zones.` },
      { name: 'Claymore + Trophy System', reason: `Claymore on entry + Trophy on mid-room covers most ${data.name} hold setups against grenade + rush attempts.` },
    ],
  }
}

const META = {
  _comment: 'Last verified: 2026-05 — based on Activision tournament + community tier list snapshot. CoD weapons-tier list (no character meta).',
  S: ['MCW (AR)', 'RAM-7 (AR)', 'WSP Swarm (SMG)', 'Holger 26 (LMG)', 'Kar98k / KV Inhibitor (Sniper)'],
  A: ['SVA 545 (AR)', 'Ram-9 (SMG)', 'Striker (SMG)', 'XRK Stalker (Sniper)', 'BAS-B (Battle Rifle)'],
  B: ['MCW 6.8 (Marksman)', 'Bruen Mk9 (LMG)', 'Striker 9 (SMG)', 'KATT-AMR (Sniper)', 'M16 (Battle Rifle)'],
  C: ['SOA Subverter (Battle Rifle)', 'TAQ Eradicator (LMG)', 'BP50 (AR)', 'AMR9 (SMG)', 'Pulemyot (LMG)'],
  bans_attack: [],
  bans_defense: [],
}

const GAME_META = {
  id: 'cod', name: 'cod', displayName: 'Call of Duty', color: '#FF8C00', slug: 'cod',
  vocab: { map: 'Map', site: 'POI / Zone', operator: 'Loadout', side_attack: 'Push', side_defense: 'Hold' },
}

function emitMaps() {
  const lines = ['// Call of Duty — Warzone (BR + Resurgence) + MW3 6v6 multiplayer maps.']
  lines.push('// Map types: Resurgence BR, BR (large map), 6v6 MP.')
  lines.push('// VERIFY: rotation changes per season — check Activision news.')
  lines.push('')
  lines.push('const MAPS = [')
  for (const [id, data] of Object.entries(MAP_DATA)) {
    lines.push('  {')
    lines.push(`    id: ${JSON.stringify(id)},`)
    lines.push(`    name: ${JSON.stringify(data.name)},`)
    lines.push(`    type: ${JSON.stringify(data.type)},`)
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
  const lines = ['// Call of Duty — 5 player loadout archetypes.']
  lines.push('// CoD operators are skins, not roles. Cast represents the standard loadout splits.')
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
  const lines = ['// Call of Duty — v1 generated strats. Per (map, POI/zone, side).']
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
  const lines = ['// Call of Duty — must-pick weapon + utility loadouts per map per side.']
  lines.push('// Replaces bans.js — CoD has no character bans.')
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

console.log(`Wrote CoD data to ${OUT_DIR}`)
console.log(`  ${Object.keys(MAP_DATA).length} maps, ${CAST.length} archetypes, ${Object.values(MAP_DATA).reduce((n, m) => n + m.sites.length * 2, 0)} strat blocks`)
