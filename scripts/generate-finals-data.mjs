#!/usr/bin/env node
// The Finals — generates v1 data files. 3v3v3 (or 3v3v3v3) Cashout mode.
//
// Schema mapping:
//   "operators" → 3 build archetypes (Light / Medium / Heavy) with weapon
//                 loadout variants captured in kit field.
//   "sites"     → vault + cashout extraction points per map
//   "sides"     → 'attack' = stealing / contesting a vault or Cashout statue
//                 'defense' = defending your own Cashout statue extraction
//   "picks"     → weapon + gadget loadouts per map per side
//   premiumTactics keys re-purposed for vault timing, extract holds.

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '..', 'src', 'data', 'games', 'finals')

const MAP_DATA = {
  'las-vegas': {
    name: 'Las Vegas', rankedPool: true,
    extraCallouts: ['Strip', 'Casino', 'Penthouse', 'Pool', 'Garage', 'Plaza', 'High Ground', 'Streets'],
    sites: [
      { id: 'casino-vault', name: 'Casino Vault', rooms: ['Casino Floor', 'Vault', 'Penthouse', 'Pool', 'Garage'] },
      { id: 'strip-cashout', name: 'Strip Cashout', rooms: ['Strip', 'Plaza', 'Rooftops', 'Streets', 'Garage'] },
      { id: 'penthouse-cashout', name: 'Penthouse Cashout', rooms: ['Penthouse', 'Casino Floor', 'Rooftops', 'Pool', 'Streets'] },
    ],
  },
  monaco: {
    name: 'Monaco', rankedPool: true,
    extraCallouts: ['Harbor', 'Streets', 'Yacht', 'High Ground', 'Plaza', 'Garage', 'Promenade'],
    sites: [
      { id: 'yacht-vault', name: 'Yacht Vault', rooms: ['Yacht Deck', 'Vault Hold', 'Cabin', 'Pool', 'Harbor'] },
      { id: 'plaza-cashout', name: 'Plaza Cashout', rooms: ['Plaza', 'Streets', 'Rooftops', 'Promenade', 'Garage'] },
      { id: 'harbor-cashout', name: 'Harbor Cashout', rooms: ['Harbor', 'Yacht', 'Promenade', 'Streets', 'Plaza'] },
    ],
  },
  seoul: {
    name: 'Seoul', rankedPool: true,
    extraCallouts: ['Streets', 'Mall', 'Subway', 'High Ground', 'Plaza', 'Garage', 'Tower'],
    sites: [
      { id: 'mall-vault', name: 'Mall Vault', rooms: ['Mall Center', 'Vault', 'Floors', 'Atrium', 'Streets'] },
      { id: 'plaza-cashout', name: 'Plaza Cashout', rooms: ['Plaza', 'Streets', 'Rooftops', 'Subway', 'Garage'] },
      { id: 'tower-cashout', name: 'Tower Cashout', rooms: ['Tower Top', 'Streets', 'Rooftops', 'Plaza', 'Garage'] },
    ],
  },
  kyoto: {
    name: 'Kyoto', rankedPool: true,
    extraCallouts: ['Streets', 'Temple', 'Garden', 'High Ground', 'Plaza', 'Tunnels', 'Rooftops'],
    sites: [
      { id: 'temple-vault', name: 'Temple Vault', rooms: ['Temple Center', 'Vault', 'Garden', 'Bridge', 'Streets'] },
      { id: 'plaza-cashout', name: 'Plaza Cashout', rooms: ['Plaza', 'Streets', 'Rooftops', 'Tunnels', 'Garden'] },
      { id: 'rooftop-cashout', name: 'Rooftop Cashout', rooms: ['Rooftops', 'Streets', 'Plaza', 'Temple', 'Bridge'] },
    ],
  },
  'sys-horizon': {
    name: 'SYS$HORIZON', rankedPool: true,
    extraCallouts: ['Grid', 'Tower', 'Rooftops', 'High Ground', 'Plaza', 'Streets', 'Tunnels'],
    sites: [
      { id: 'grid-vault', name: 'Grid Vault', rooms: ['Grid Center', 'Vault', 'Tower', 'Bridge', 'Plaza'] },
      { id: 'tower-cashout', name: 'Tower Cashout', rooms: ['Tower Top', 'Rooftops', 'Bridge', 'Plaza', 'Grid'] },
      { id: 'rooftop-cashout', name: 'Rooftop Cashout', rooms: ['Rooftops', 'Tower', 'Bridge', 'Grid', 'Plaza'] },
    ],
  },
  bernal: {
    name: 'Bernal', rankedPool: true,
    extraCallouts: ['Streets', 'Plaza', 'Mining', 'High Ground', 'Tunnels', 'Bridge', 'Rooftops'],
    sites: [
      { id: 'mining-vault', name: 'Mining Vault', rooms: ['Mining Center', 'Vault', 'Tunnel', 'Bridge', 'Plaza'] },
      { id: 'plaza-cashout', name: 'Plaza Cashout', rooms: ['Plaza', 'Streets', 'Rooftops', 'Mining', 'Tunnels'] },
      { id: 'rooftop-cashout', name: 'Rooftop Cashout', rooms: ['Rooftops', 'Plaza', 'Bridge', 'Streets', 'Mining'] },
    ],
  },
}

// ---------- ARCHETYPES ----------
const CAST = [
  {
    id: 'light',
    name: 'Light',
    role: 'Light',
    side: null,
    kit: ['Sword / Dagger / SR-84 / V9S / XP-54 / SH1900', 'Cloak / Grappling Hook / Evasive Dash', 'Glitch Grenades / Vanishing Bomb / Stun Gun / Breach Charge'],
  },
  {
    id: 'medium',
    name: 'Medium',
    role: 'Medium',
    side: null,
    kit: ['AKM / FCAR / R.357 / Model 1887 / CL-40 / Riot Shield', 'Healing Beam / Guardian Turret / Dematerializer', 'Defibrillator / Goo Gun / Smoke Grenade / Jump Pad / APS Turret'],
  },
  {
    id: 'heavy',
    name: 'Heavy',
    role: 'Heavy',
    side: null,
    kit: ['SA1216 / M60 / Lewis Gun / Sledgehammer / KS-23 / Flamethrower / RPG-7', 'Mesh Shield / Charge \'N\' Slam / Goo Gun / Winch Claw', 'Barricade / Pyro Grenade / Anti-Gravity Cube / C4 / RPG'],
  },
]

function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h }

function buildOps(seed, side) {
  // Standard Finals comp = Heavy + Medium + Light. Variations: 2-Med + Heavy, etc.
  return [
    { name: 'Heavy', role: 'Anchor / Vault Carry', priority: 'essential' },
    { name: 'Medium', role: 'Healer / Utility', priority: 'essential' },
    { name: 'Light', role: 'Flank / Pick', priority: 'recommended' },
  ]
}

const ATTACK_TEMPLATES = [
  ({ obj, r1 }) => `Vault steal on ${obj}: Heavy carries the vault on extract, Medium heals + Defibs on wipes, Light flanks contesting teams from ${r1}. Force a 3rd-team contest by holding the vault between two enemy spawn rotations.`,
  ({ obj, r1 }) => `Cashout contest on ${obj}: Light enters first to scout, Heavy charges in with Mesh Shield, Medium Defibs on wipe. Goal is killing all 3 of the holding team before the extraction completes.`,
  ({ obj, r1 }) => `Off-angle hit on ${obj}: Medium drops a Jump Pad behind the holders, Light flanks via grappling hook, Heavy commits front. Force a multi-angle contest before extract.`,
  ({ obj, r1 }) => `Stealth steal on ${obj}: Light cloaks to scout the contest, Medium positions Defib + heal beam, Heavy waits for the engage call. Strike when the enemy team commits to a fight with a third party.`,
  ({ obj, r1 }) => `Cashout snipe + push on ${obj}: Light snipes with SR-84 from ${r1}, Heavy + Medium push on the trade. Defib chain through the contest. Heavy carries the new Cashout to the next extract.`,
]

const DEFENSE_TEMPLATES = [
  ({ obj, r1 }) => `Defend ${obj}: Heavy sets Barricade + APS Turret on the choke, Medium runs heal beam, Light scouts approaches with grapple from ${r1}. Force teams to push you in a 3rd-team-friendly setup.`,
  ({ obj, r1 }) => `Stack ${obj}: 3-on-objective. Heavy on the Cashout body-blocking, Medium with Defib ready, Light watches the timer + rotation pings. Save utility for the second team push — first contest always brings a third.`,
  ({ obj, r1 }) => `Gas + Goo hold on ${obj}: Heavy goos the choke entries, Medium drops Smoke + heal, Light flanks for the trade kill. Force pushers to break utility before contesting.`,
  ({ obj, r1 }) => `Multi-floor hold on ${obj}: Heavy on the Cashout floor, Medium one floor up with Jump Pad ready, Light on rooftop for vertical pickoffs. Punish the standard ground push.`,
  ({ obj, r1 }) => `Reset / re-steal hold on ${obj}: hold the Cashout but pre-position for the inevitable wipe. Medium has Defib ready, Heavy ready to re-steal post-wipe, Light flanks the contest team for the third-party trade.`,
]

const TACTICAL_NOTES = {
  'las-vegas': {
    'casino-vault': { attack: 'Pool entry is the off-angle flank — Light grapples to penthouse for vertical pickoffs.', defense: 'Penthouse cross-fire from Pool gives the standard 2-floor hold.' },
    'strip-cashout': { attack: 'Streets approach is exposed — Heavy commits front with Mesh Shield cover.', defense: 'Rooftop hold with Light snipe + Heavy choke barricade wins most contests.' },
    'penthouse-cashout': { attack: 'Rooftop entry is the off-angle — Light grapples to roof for the surprise commit.', defense: 'Casino floor anchor with Penthouse trade is the standard 2-floor hold.' },
  },
  monaco: {
    'yacht-vault': { attack: 'Pool entry is the swim flank — Light dives for the surprise rear push.', defense: 'Cabin anchor with Yacht Deck cross-fire denies the standard pool dive.' },
    'plaza-cashout': { attack: 'Promenade rooftop dive splits the holding team.', defense: 'Rooftop snipe + Plaza ground anchor is the textbook hold.' },
    'harbor-cashout': { attack: 'Harbor swim approach catches the standard rooftop hold off-angle.', defense: 'Yacht cross-fire from Harbor wins the standard contest.' },
  },
  seoul: {
    'mall-vault': { attack: 'Floors above the vault give vertical pressure — Light grapples for the drop.', defense: 'Multi-floor anchor with cross-fire from Atrium denies the standard push.' },
    'plaza-cashout': { attack: 'Subway flank from underneath catches the standard rooftop hold.', defense: 'Rooftop hold with Subway choke barricade is the textbook setup.' },
    'tower-cashout': { attack: 'Rooftop dive from adjacent buildings splits the hold.', defense: 'Tower top cross-fire from rooftops denies the standard contest.' },
  },
  kyoto: {
    'temple-vault': { attack: 'Garden approach is the off-angle — Light grapples to bridge for surprise.', defense: 'Bridge cross-fire from Garden gives the standard 2-angle hold.' },
    'plaza-cashout': { attack: 'Tunnels flank from underneath catches the standard hold off-angle.', defense: 'Rooftop snipe + Plaza ground anchor is the textbook hold.' },
    'rooftop-cashout': { attack: 'Bridge dive from adjacent rooftops splits the hold.', defense: 'Cross-fire from Temple + Plaza wins the rooftop contest.' },
  },
  'sys-horizon': {
    'grid-vault': { attack: 'Tower vertical pressure denies the standard Grid hold.', defense: 'Bridge cross-fire from Grid + Tower wins the standard contest.' },
    'tower-cashout': { attack: 'Rooftop dive from adjacent towers splits the hold.', defense: 'Tower cross-fire from Bridge + Grid is the textbook hold.' },
    'rooftop-cashout': { attack: 'Bridge approach from adjacent towers catches the standard hold.', defense: 'Tower cross-fire from Grid wins the rooftop contest.' },
  },
  bernal: {
    'mining-vault': { attack: 'Tunnel flank from underneath catches the standard mining hold.', defense: 'Bridge cross-fire from Plaza + Tunnels denies the standard push.' },
    'plaza-cashout': { attack: 'Rooftop dive splits the hold; Tunnels flank for the trade.', defense: 'Rooftop snipe + Plaza ground anchor is the textbook hold.' },
    'rooftop-cashout': { attack: 'Bridge dive from adjacent rooftops splits the hold.', defense: 'Cross-fire from Plaza + Mining wins the rooftop contest.' },
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
  const obj = site.name

  return {
    attack: {
      operators: aOps,
      strategy: aTmpl({ obj, r1 }) + (tactical.attack ? ' ' + tactical.attack : ''),
      callouts,
      utility: [
        `Heavy: Mesh Shield + Barricade for vault carry; RPG / C4 for cracking the contest`,
        `Medium: Healing Beam + Defibrillator for sustain; APS Turret for projectile defense`,
        `Light: Cloak + Grapple for flanking; Glitch Grenades to disable enemy Defibs`,
      ],
      premiumTactics: {
        attackSpawns: [
          { spawn: `${obj} steal route`, from: r1, use: `Standard vault carry path — Heavy carries with Mesh Shield, team holds adjacent angles.` },
          { spawn: `${obj} re-steal opportunity`, from: 'Adjacent rooftop', use: `When third team contests, re-steal the cashout while two teams fight each other.` },
        ],
        spawnKillSpots: [
          { from: r1, target: 'enemy Cashout team during contest', risk: 'Medium — third team may engage during your push', reward: 'Cashout steal + 3rd-place team eliminated' },
        ],
        advancedSetups: [
          `Third-party timing: wait for two teams to engage at ${obj}, push the survivor + steal the cashout. Standard 3-team rotation read.`,
          `Vault carry route: Heavy commits front with Mesh + Barricade, Medium runs heal beam behind, Light flanks for trade kill.`,
          `Defib chain: Medium Defibs on wipe, team retraces to the same ${obj} position. Force the contest team to commit twice.`,
        ],
      },
    },
    defense: {
      operators: dOps,
      strategy: dTmpl({ obj, r1 }) + (tactical.defense ? ' ' + tactical.defense : ''),
      callouts,
      utility: [
        `Heavy: Barricade + APS Turret + RPG for choke denial; Goo Gun for sealing entries`,
        `Medium: Healing Beam + Defib + Smoke for sustained holds; Jump Pad for vertical reposition`,
        `Light: SR-84 + Grappling Hook + Stun Gun for off-angle pickoffs`,
      ],
      premiumTactics: {
        runouts: [
          { from: r1, target: 'incoming team approach', timing: '15-second extract timer — pre-position before contest engages.' },
          { from: 'Side rooftop', target: 'flanking third team', timing: 'Mid-contest — peel for teammate that engaged first.' },
        ],
        antiSpawnPeek: [
          `Pre-aim the standard approach on ${r1} — most contests come from the same path each round.`,
          `Save the off-angle Light SR-84 shot for after the first team pushes — third team always comes from a different direction.`,
          `Trade-stack ${r1} with the Heavy — if the first contestant takes a duel, the trade kill is on a fixed crosshair placement.`,
        ],
        advancedSetups: [
          `Goo + Pyro combo: Heavy goos the entry, Medium Pyros the goo for fire damage, Light cleans up survivors.`,
          `Multi-floor hold: Heavy on Cashout, Medium one floor up with Jump Pad, Light on rooftop. Punish the standard ground push.`,
          `Reset hold: pre-position for the inevitable wipe — Medium Defib ready, Heavy ready to re-engage. Force contest team to commit twice.`,
        ],
      },
    },
  }
}

const PICKS = {}
for (const [mapId, data] of Object.entries(MAP_DATA)) {
  PICKS[mapId] = {
    attack: [
      { name: 'Heavy with Mesh Shield + RPG', reason: `${data.name} vault contests reward Heavy front-line — Mesh Shield carries the cashout, RPG cracks defender utility.` },
      { name: 'Medium with Defibrillator + Healing Beam', reason: `Defib chain enables re-pushes on wipes; Healing Beam sustains the Heavy front-line through contests.` },
      { name: 'Light with Grappling Hook + Glitch Grenade', reason: `Grapple flanks reach off-angles defenders can't cover; Glitch denies enemy Defib + Mesh Shield.` },
    ],
    defense: [
      { name: 'Heavy with Barricade + APS Turret', reason: `Barricade seals the choke, APS denies grenades + RPGs. Mandatory defender Heavy on every Cashout hold.` },
      { name: 'Medium with Goo Gun + Smoke', reason: `Goo seals the entries, Smoke breaks contest line of sight. Standard utility for any extract hold.` },
      { name: 'Light with SR-84 Sniper + Cloak', reason: `Off-angle Sniper picks reach contest teams before they commit; Cloak repositions on flank reads.` },
    ],
  }
}

const META = {
  _comment: 'Last verified: 2026-05 — based on The Finals tournament + community tier list snapshot.',
  S: ['Heavy', 'Medium', 'Heavy + Medium + Light comp'],
  A: ['Light (cloak / sniper builds)', 'AKM (Medium)', 'Lewis Gun (Heavy)', 'FCAR (Medium)'],
  B: ['M60 (Heavy)', 'V9S (Light)', 'XP-54 (Light)', 'SA1216 (Heavy)', 'Model 1887 (Medium)'],
  C: ['Sword (Light)', 'Sledgehammer (Heavy)', 'Riot Shield (Medium)', 'CL-40 (Medium)'],
  bans_attack: [],
  bans_defense: [],
}

const GAME_META = {
  id: 'finals', name: 'finals', displayName: 'The Finals', color: '#FFFF00', slug: 'finals',
  vocab: { map: 'Arena', site: 'Vault / Cashout', operator: 'Build', side_attack: 'Steal', side_defense: 'Extract' },
}

function emitMaps() {
  const lines = ['// The Finals — Cashout map pool May 2026.']
  lines.push('// Sites = vault locations + Cashout extraction points per map.')
  lines.push('// VERIFY: Embark rotates maps seasonally — re-check current pool.')
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
  const lines = ['// The Finals — 3 build archetypes.']
  lines.push('// Each kit lists weapon variants, specializations, and gadget options.')
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
  const lines = ['// The Finals — v1 generated strats. Per (arena, vault/cashout, side).']
  lines.push('// `attack` = stealing / contesting, `defense` = defending the extract.')
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
  const lines = ['// The Finals — must-pick build / weapon loadouts per arena per side.']
  lines.push('// Replaces bans.js. Per-side recommendations based on extract / steal context.')
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

console.log(`Wrote Finals data to ${OUT_DIR}`)
console.log(`  ${Object.keys(MAP_DATA).length} arenas, ${CAST.length} build archetypes, ${Object.values(MAP_DATA).reduce((n, m) => n + m.sites.length * 2, 0)} strat blocks`)
