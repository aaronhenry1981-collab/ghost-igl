#!/usr/bin/env node
// Generates v1 Valorant data files. Same shape as R6 maps/strats with the
// vocab swap done at the gameMeta layer. Idempotent — re-run to refresh.
//
// Output: src/data/games/valorant/{maps,operators,strats,bans,meta,index}.js
//
// Schema mapping:
//   "operators" → Valorant agents (real characters with abilities)
//   "sites"     → bomb sites A / B (Haven, Lotus add C)
//   "sides"     → 'attack' = Attack, 'defense' = Defense
//   "bans"      → per-map agent ban / discourage list with reasoning
//   premiumTactics keys re-purposed for Valorant concepts:
//     attackSpawns   → default plant spots + post-plant lineups
//     spawnKillSpots → ult/util-based opening picks
//     advancedSetups → util lineups, fake exec patterns, retake reads
//     runouts        → defender aggressive early peeks
//     antiSpawnPeek  → counter-util against fast-exec utility
//     advancedSetups → off-angles, ult anchors, recon timings

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '..', 'src', 'data', 'games', 'valorant')

// ---------- MAPS ----------
// Current map pool May 2026 per the user's spec. Sites use Liquipedia callouts.
// Haven and Lotus have three bomb sites; everything else has A/B.

const MAP_DATA = {
  bind: {
    name: 'Bind',
    rankedPool: true,
    extraCallouts: ['A Short', 'A Long', 'Hookah', 'Truck', 'Lamps', 'A Bath', 'B Long', 'B Short', 'B Hall', 'Window', 'CT', 'Garden', 'Showers', 'Teleporter A', 'Teleporter B'],
    sites: [
      { id: 'a-site', name: 'A Site (Bath / Truck)', rooms: ['A Site', 'A Bath', 'A Truck', 'A Heaven', 'A Default'] },
      { id: 'b-site', name: 'B Site (Hookah / Long)', rooms: ['B Site', 'Hookah', 'B Long', 'B Default', 'Window'] },
    ],
  },
  haven: {
    name: 'Haven',
    rankedPool: true,
    extraCallouts: ['Mid Window', 'Mid Doors', 'Mid Garage', 'Mid Courtyard', 'Sewers', 'A Long', 'A Link', 'C Long', 'C Lobby', 'C Cubby', 'CT', 'Heaven', 'A Short'],
    sites: [
      { id: 'a-site', name: 'A Site (Heaven / Default)', rooms: ['A Site', 'A Heaven', 'A Default', 'A Link', 'A Long'] },
      { id: 'b-site', name: 'B Site (Mid)', rooms: ['B Site', 'B Default', 'B Back', 'Mid Doors', 'Mid Garage'] },
      { id: 'c-site', name: 'C Site (Long / Lobby)', rooms: ['C Site', 'C Long', 'C Lobby', 'C Cubby', 'C Default'] },
    ],
  },
  split: {
    name: 'Split',
    rankedPool: true,
    extraCallouts: ['Mid', 'Mid Mail', 'Mid Vents', 'Heaven', 'Hell', 'Sewer', 'Backsite', 'A Ramps', 'A Tower', 'A Lobby', 'B Tower', 'B Lobby', 'CT', 'A Screens'],
    sites: [
      { id: 'a-site', name: 'A Site (Heaven / Tower)', rooms: ['A Site', 'A Heaven', 'A Screens', 'A Ramps', 'A Tower'] },
      { id: 'b-site', name: 'B Site (Tower / Back)', rooms: ['B Site', 'B Back', 'B Tower', 'B Heaven', 'B Mail'] },
    ],
  },
  ascent: {
    name: 'Ascent',
    rankedPool: true,
    extraCallouts: ['Mid', 'Mid Catwalk', 'Mid Top', 'Mid Bottom', 'Mid Pizza', 'Mid Market', 'A Lobby', 'A Main', 'A Short', 'B Lobby', 'B Main', 'CT', 'Generator', 'Tree'],
    sites: [
      { id: 'a-site', name: 'A Site (Generator / Tree)', rooms: ['A Site', 'A Default', 'A Generator', 'A Tree', 'A Heaven'] },
      { id: 'b-site', name: 'B Site (Stairs / Logs)', rooms: ['B Site', 'B Default', 'B Stairs', 'B Logs', 'B Back'] },
    ],
  },
  icebox: {
    name: 'Icebox',
    rankedPool: true,
    extraCallouts: ['Mid', 'Mid Boiler', 'Mid Tube', 'Mid Orange', 'Mid Yellow', 'Mid Kitchen', 'A Belt', 'A Pipes', 'A Rafters', 'A Screens', 'B Yellow', 'B Green', 'B Tube', 'CT', 'B Snowman'],
    sites: [
      { id: 'a-site', name: 'A Site (Belt / Pipes)', rooms: ['A Site', 'A Belt', 'A Pipes', 'A Rafters', 'A Screens'] },
      { id: 'b-site', name: 'B Site (Yellow / Green)', rooms: ['B Site', 'B Yellow', 'B Green', 'B Tube', 'B Snowman'] },
    ],
  },
  breeze: {
    name: 'Breeze',
    rankedPool: true,
    extraCallouts: ['Mid', 'Mid Top', 'Mid Bottom', 'Mid Pillar', 'Mid Wood', 'A Halls', 'A Cave', 'A Shop', 'A Bridge', 'A Pyramids', 'B Hall', 'B Window', 'B Pillar', 'CT', 'B Tunnel'],
    sites: [
      { id: 'a-site', name: 'A Site (Default / Cave)', rooms: ['A Site', 'A Default', 'A Cave', 'A Pyramids', 'A Bridge'] },
      { id: 'b-site', name: 'B Site (Tunnel / Hall)', rooms: ['B Site', 'B Default', 'B Tunnel', 'B Hall', 'B Pillar'] },
    ],
  },
  lotus: {
    name: 'Lotus',
    rankedPool: true,
    extraCallouts: ['Mid', 'Mid Top', 'Mid Bottom', 'Mid Tree', 'A Main', 'A Lobby', 'A Stairs', 'A Hut', 'A Drop', 'B Hut', 'B Main', 'C Lobby', 'C Hall', 'C Waterfall', 'CT'],
    sites: [
      { id: 'a-site', name: 'A Site (Hut / Drop)', rooms: ['A Site', 'A Default', 'A Hut', 'A Drop', 'A Stairs'] },
      { id: 'b-site', name: 'B Site (Main / Hut)', rooms: ['B Site', 'B Default', 'B Main', 'B Hut', 'B Back'] },
      { id: 'c-site', name: 'C Site (Waterfall / Hall)', rooms: ['C Site', 'C Default', 'C Hall', 'C Waterfall', 'C Lobby'] },
    ],
  },
  sunset: {
    name: 'Sunset',
    rankedPool: true,
    extraCallouts: ['Mid', 'Mid Top', 'Mid Bottom', 'Mid Courtyard', 'Mid Market', 'A Main', 'A Alley', 'A Lobby', 'A Elbow', 'B Main', 'B Mall', 'B Market', 'CT', 'B Hookah'],
    sites: [
      { id: 'a-site', name: 'A Site (Default / Elbow)', rooms: ['A Site', 'A Default', 'A Elbow', 'A Alley', 'A Lobby'] },
      { id: 'b-site', name: 'B Site (Mall / Market)', rooms: ['B Site', 'B Default', 'B Mall', 'B Market', 'B Hookah'] },
    ],
  },
  abyss: {
    name: 'Abyss',
    rankedPool: true,
    extraCallouts: ['Mid', 'Mid Top', 'Mid Bottom', 'Mid Connector', 'A Lobby', 'A Main', 'A Stairs', 'A Heaven', 'B Lobby', 'B Main', 'B Plat', 'CT', 'B Stairs'],
    sites: [
      { id: 'a-site', name: 'A Site (Heaven / Default)', rooms: ['A Site', 'A Default', 'A Heaven', 'A Stairs', 'A Lobby'] },
      { id: 'b-site', name: 'B Site (Plat / Default)', rooms: ['B Site', 'B Default', 'B Plat', 'B Stairs', 'B Main'] },
    ],
  },
  corrode: {
    name: 'Corrode',
    rankedPool: true,
    // VERIFY: Corrode is a recent addition (2026) — callouts confirmed against
    // official Riot map breakdown. Re-verify if Riot updates the map post-launch.
    extraCallouts: ['Mid', 'Mid Top', 'Mid Bottom', 'A Main', 'A Lobby', 'A Stairs', 'B Main', 'B Lobby', 'B Stairs', 'CT', 'A Heaven', 'B Heaven'],
    sites: [
      { id: 'a-site', name: 'A Site (Heaven / Default)', rooms: ['A Site', 'A Default', 'A Heaven', 'A Stairs', 'A Lobby'] },
      { id: 'b-site', name: 'B Site (Main / Default)', rooms: ['B Site', 'B Default', 'B Main', 'B Stairs', 'B Lobby'] },
    ],
  },
}

// ---------- AGENTS ----------
// 26 agents as of May 2026 per official Riot agent list.
// VERIFY: re-check against Valorant official site if a new agent has shipped.

const CAST = [
  // Duelists
  { id: 'jett', name: 'Jett', role: 'Duelist', side: null, kit: ['Updraft', 'Tailwind', 'Cloudburst', 'Blade Storm'] },
  { id: 'phoenix', name: 'Phoenix', role: 'Duelist', side: null, kit: ['Curveball', 'Hot Hands', 'Blaze', 'Run It Back'] },
  { id: 'reyna', name: 'Reyna', role: 'Duelist', side: null, kit: ['Devour', 'Dismiss', 'Leer', 'Empress'] },
  { id: 'raze', name: 'Raze', role: 'Duelist', side: null, kit: ['Boom Bot', 'Blast Pack', 'Paint Shells', 'Showstopper'] },
  { id: 'yoru', name: 'Yoru', role: 'Duelist', side: null, kit: ['Blindside', 'Gatecrash', 'Fakeout', 'Dimensional Rift'] },
  { id: 'neon', name: 'Neon', role: 'Duelist', side: null, kit: ['Fast Lane', 'Relay Bolt', 'High Gear', 'Overdrive'] },
  { id: 'iso', name: 'Iso', role: 'Duelist', side: null, kit: ['Contingency', 'Undercut', 'Double Tap', 'Kill Contract'] },
  { id: 'waylay', name: 'Waylay', role: 'Duelist', side: null, kit: ['Saturate', 'Refract', 'Lightspeed', 'Convergent Paths'] }, // VERIFY: Waylay 2025 release confirmed
  // Sentinels
  { id: 'cypher', name: 'Cypher', role: 'Sentinel', side: null, kit: ['Trapwire', 'Cyber Cage', 'Spycam', 'Neural Theft'] },
  { id: 'sage', name: 'Sage', role: 'Sentinel', side: null, kit: ['Slow Orb', 'Healing Orb', 'Barrier Orb', 'Resurrection'] },
  { id: 'killjoy', name: 'Killjoy', role: 'Sentinel', side: null, kit: ['Alarmbot', 'Turret', 'Nanoswarm', 'Lockdown'] },
  { id: 'chamber', name: 'Chamber', role: 'Sentinel', side: null, kit: ['Trademark', 'Headhunter', 'Rendezvous', 'Tour de Force'] },
  { id: 'deadlock', name: 'Deadlock', role: 'Sentinel', side: null, kit: ['GravNet', 'Sonic Sensor', 'Barrier Mesh', 'Annihilation'] },
  { id: 'vyse', name: 'Vyse', role: 'Sentinel', side: null, kit: ['Shear', 'Arc Rose', 'Razorvine', 'Steel Garden'] },
  // Initiators
  { id: 'sova', name: 'Sova', role: 'Initiator', side: null, kit: ['Recon Bolt', 'Owl Drone', 'Shock Bolt', "Hunter's Fury"] },
  { id: 'breach', name: 'Breach', role: 'Initiator', side: null, kit: ['Aftershock', 'Flashpoint', 'Fault Line', 'Rolling Thunder'] },
  { id: 'skye', name: 'Skye', role: 'Initiator', side: null, kit: ['Trailblazer', 'Guiding Light', 'Regrowth', 'Seekers'] },
  { id: 'kayo', name: 'KAY/O', role: 'Initiator', side: null, kit: ['FRAG/ment', 'FLASH/drive', 'ZERO/point', 'NULL/cmd'] },
  { id: 'fade', name: 'Fade', role: 'Initiator', side: null, kit: ['Prowler', 'Seize', 'Haunt', 'Nightfall'] },
  { id: 'gekko', name: 'Gekko', role: 'Initiator', side: null, kit: ['Mosh Pit', 'Wingman', 'Dizzy', 'Thrash'] },
  { id: 'tejo', name: 'Tejo', role: 'Initiator', side: null, kit: ['Stealth Drone', 'Special Delivery', 'Guided Salvo', 'Armageddon'] }, // VERIFY: Tejo 2025 release
  // Controllers
  { id: 'brimstone', name: 'Brimstone', role: 'Controller', side: null, kit: ['Stim Beacon', 'Incendiary', 'Sky Smoke', 'Orbital Strike'] },
  { id: 'viper', name: 'Viper', role: 'Controller', side: null, kit: ['Snake Bite', "Poison Cloud", 'Toxic Screen', "Viper's Pit"] },
  { id: 'omen', name: 'Omen', role: 'Controller', side: null, kit: ['Shrouded Step', 'Paranoia', 'Dark Cover', 'From the Shadows'] },
  { id: 'astra', name: 'Astra', role: 'Controller', side: null, kit: ['Gravity Well', 'Nova Pulse', 'Nebula', 'Cosmic Divide'] },
  { id: 'harbor', name: 'Harbor', role: 'Controller', side: null, kit: ['Cascade', 'Cove', 'High Tide', 'Reckoning'] },
  { id: 'clove', name: 'Clove', role: 'Controller', side: null, kit: ['Pick-Me-Up', 'Meddle', 'Ruse', 'Not Dead Yet'] },
]

// ---------- DETERMINISTIC HELPERS ----------
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h }
function pick(arr, seed) { return arr[hash(seed) % arr.length] }

// ---------- AGENT POOL ----------
// Group by role for composition picking. Picks vary per (map, site) for variety.

const POOLS = {
  duelist: ['Jett', 'Raze', 'Phoenix', 'Reyna', 'Neon', 'Iso', 'Yoru', 'Waylay'],
  sentinel: ['Cypher', 'Killjoy', 'Sage', 'Chamber', 'Deadlock', 'Vyse'],
  initiator: ['Sova', 'Breach', 'Skye', 'KAY/O', 'Fade', 'Gekko', 'Tejo'],
  controller: ['Omen', 'Brimstone', 'Viper', 'Astra', 'Harbor', 'Clove'],
}

// Map-specific agent biases — Valorant is highly map-dependent (e.g., Viper
// on Icebox/Breeze, Cypher on Bind, Killjoy on Ascent). When the bias agent
// fits the role pool, prefer them; otherwise fall back to deterministic pick.
const MAP_BIAS = {
  bind: { sentinel: 'Cypher', controller: 'Brimstone', initiator: 'Skye', duelist: 'Raze' },
  haven: { sentinel: 'Cypher', controller: 'Astra', initiator: 'Sova', duelist: 'Jett' },
  split: { sentinel: 'Killjoy', controller: 'Omen', initiator: 'Breach', duelist: 'Raze' },
  ascent: { sentinel: 'Killjoy', controller: 'Omen', initiator: 'KAY/O', duelist: 'Jett' },
  icebox: { sentinel: 'Sage', controller: 'Viper', initiator: 'Sova', duelist: 'Jett' },
  breeze: { sentinel: 'Chamber', controller: 'Viper', initiator: 'Sova', duelist: 'Jett' },
  lotus: { sentinel: 'Killjoy', controller: 'Harbor', initiator: 'Fade', duelist: 'Raze' },
  sunset: { sentinel: 'Cypher', controller: 'Omen', initiator: 'Fade', duelist: 'Phoenix' },
  abyss: { sentinel: 'Killjoy', controller: 'Clove', initiator: 'Tejo', duelist: 'Iso' },
  corrode: { sentinel: 'Vyse', controller: 'Clove', initiator: 'Tejo', duelist: 'Waylay' },
}

function buildOps(mapId, siteSeed, side) {
  const bias = MAP_BIAS[mapId] || {}
  const duelist = bias.duelist || pick(POOLS.duelist, siteSeed + 'd')
  const sentinel = bias.sentinel || pick(POOLS.sentinel, siteSeed + 's')
  const initiator = bias.initiator || pick(POOLS.initiator, siteSeed + 'i')
  const controller = bias.controller || pick(POOLS.controller, siteSeed + 'c')
  // Second initiator or duelist as flex (vary by site for variety)
  const flexPool = hash(siteSeed) % 2 === 0 ? POOLS.initiator : POOLS.duelist
  const flex = pick(flexPool.filter((a) => a !== duelist && a !== initiator), siteSeed + 'f')

  if (side === 'attack') {
    return [
      { name: duelist, role: 'Duelist', priority: 'essential' },
      { name: controller, role: 'Controller', priority: 'essential' },
      { name: initiator, role: 'Initiator', priority: 'essential' },
      { name: sentinel, role: 'Sentinel', priority: 'recommended' },
      { name: flex, role: 'Flex', priority: 'flex' },
    ]
  } else {
    return [
      { name: sentinel, role: 'Sentinel', priority: 'essential' },
      { name: controller, role: 'Controller', priority: 'essential' },
      { name: initiator, role: 'Initiator', priority: 'recommended' },
      { name: duelist, role: 'Duelist', priority: 'recommended' },
      { name: flex, role: 'Flex', priority: 'flex' },
    ]
  }
}

// ---------- STRATEGY TEMPLATES ----------
const ATTACK_TEMPLATES = [
  ({ site, r1, r2, mid, controller, duelist, initiator, sentinel, tacticalNote }) =>
    `Standard ${site} execute: ${controller} smokes the CT cross + Heaven, ${initiator} flashes/recons over the choke, ${duelist} entries first contact while ${sentinel} watches the off-site flank. Plant default for the post-plant util cross.${tacticalNote ? ' ' + tacticalNote : ''}`,
  ({ site, r1, r2, mid, controller, duelist, initiator, sentinel, tacticalNote }) =>
    `Mid takeover: ${initiator} recons ${mid} on round-start, ${duelist} dashes the pick attempt, ${controller} smokes the rotate. Once mid is locked, split-execute ${site} with ${sentinel} pinching from off-site.${tacticalNote ? ' ' + tacticalNote : ''}`,
  ({ site, r1, r2, mid, controller, duelist, initiator, sentinel, tacticalNote }) =>
    `Fast hit: ${controller} smokes ${r1} entry on the buy timer, ${initiator} flashes over, ${duelist} dives first contact. ${sentinel} trails the trade. Goal is to land before defenders rotate from off-site stack.${tacticalNote ? ' ' + tacticalNote : ''}`,
  ({ site, r1, r2, mid, controller, duelist, initiator, sentinel, tacticalNote }) =>
    `Default → re-fake: take map control through ${mid} and ${r2}, force the rotate, then re-fake to ${site}. ${controller} smokes only after defenders bite on the off-site noise. ${duelist} entries late.${tacticalNote ? ' ' + tacticalNote : ''}`,
  ({ site, r1, r2, mid, controller, duelist, initiator, sentinel, tacticalNote }) =>
    `Split execute: ${duelist} + ${initiator} hit ${r1}, ${controller} + ${sentinel} take ${r2}. Both sides flash on the same count. Plant for the cross-site post-plant util cycle.${tacticalNote ? ' ' + tacticalNote : ''}`,
]

const DEFENSE_TEMPLATES = [
  ({ site, r1, r2, mid, controller, duelist, initiator, sentinel, tacticalNote }) =>
    `Default 2-1-2: ${sentinel} sets traps and watches ${r1}, ${controller} holds ${mid} for the early read, ${duelist} plays off-site for picks. ${initiator} recons on contact. Save ults for the retake — do not blow on a fake.${tacticalNote ? ' ' + tacticalNote : ''}`,
  ({ site, r1, r2, mid, controller, duelist, initiator, sentinel, tacticalNote }) =>
    `Aggressive ${mid} setup: ${duelist} contests early with ${initiator} support, ${sentinel} anchors ${site} solo. ${controller} flexes on commit. Goal is a round-opener pick that flips utility plan.${tacticalNote ? ' ' + tacticalNote : ''}`,
  ({ site, r1, r2, mid, controller, duelist, initiator, sentinel, tacticalNote }) =>
    `Stack ${site}: 3-on-site, 2 watching ${mid} + ${r2} flank. ${sentinel} traps the choke, ${controller} preps retake util, ${duelist} trades. Read pace from utility usage — full smoke commit means full execute.${tacticalNote ? ' ' + tacticalNote : ''}`,
  ({ site, r1, r2, mid, controller, duelist, initiator, sentinel, tacticalNote }) =>
    `1-2-2 default: solo ${mid} for info, two on ${site} (anchor + trade), two on ${r2}. ${sentinel} sets traps cross-site. ${controller} flexes. Listen for the ${mid} take — that's the rotate trigger.${tacticalNote ? ' ' + tacticalNote : ''}`,
  ({ site, r1, r2, mid, controller, duelist, initiator, sentinel, tacticalNote }) =>
    `Eco / save round: stack ${site} with all 5, save ults. ${sentinel} traps the entry choke, ${duelist} trades. Goal is a round win or clean save — do not chase frags into the rotate.${tacticalNote ? ' ' + tacticalNote : ''}`,
]

// ---------- TACTICAL NOTES ----------
const TACTICAL_NOTES = {
  bind: {
    'a-site': {
      attack: 'Bath teleporter is the standard split — flash through TP and entry from Showers simultaneously.',
      defense: 'Cypher trips on Showers + Bath TP cover both flank lanes; do not over-rotate to A on smokes alone.',
    },
    'b-site': {
      attack: 'Hookah control is mandatory — Hookah molly + Window smoke isolates the anchor.',
      defense: 'B Hall + Hookah trips force the rotation read; trade off the Hookah peek, do not solo-anchor.',
    },
  },
  haven: {
    'a-site': {
      attack: 'A Long control wins — dash + flash for the Heaven trade is the textbook A take.',
      defense: 'Heaven anchor with A Long Sage wall is the standard hold; rotate from C through Garage.',
    },
    'b-site': {
      attack: 'Mid double-flash isolates B; pinch from A Link or C Garage on the rotate.',
      defense: 'Mid Doors trips + B Default anchor is the textbook hold; save ult for retake.',
    },
    'c-site': {
      attack: 'C Long take with Sage wall blocks Garage rotation; Phoenix wall enables free entry.',
      defense: 'C Long molly cycle + Garage rotate is mandatory; do not solo-anchor C on commit.',
    },
  },
  split: {
    'a-site': {
      attack: 'A Ramps takeover with Raze nades clears Heaven anchor; Phoenix wall denies trade.',
      defense: 'A Heaven AWP + Screens trade is the standard hold; Ramps molly delays the take.',
    },
    'b-site': {
      attack: 'B Tower control is mandatory — Tower flash + Mail molly forces the rotate.',
      defense: 'B Heaven + Mail anchor with Tower trade is the standard 2-on-B hold.',
    },
  },
  ascent: {
    'a-site': {
      attack: 'A Main + Catwalk double-pinch with Tree smoke isolates Generator anchor.',
      defense: 'Killjoy turret + ult anchor cleanly retakes A; do not over-extend Main on the take.',
    },
    'b-site': {
      attack: 'Market control is the key — Market molly forces Stairs rotation, B Main exec lands clean.',
      defense: 'Market trips + B Main anchor; rotate from Mid Top, not the long route.',
    },
  },
  icebox: {
    'a-site': {
      attack: 'A Belt take with Viper wall + Sova recon is the textbook A exec; Pipes drop pinches the anchor.',
      defense: 'A Rafters anchor with Viper Pit ult is the standard A hold; Belt molly delays the take.',
    },
    'b-site': {
      attack: 'B Yellow + Green double-take with Viper wall down the middle splits the anchor.',
      defense: 'B Snowman anchor with Yellow molly is mandatory; Tube rotation through CT, not Mid.',
    },
  },
  breeze: {
    'a-site': {
      attack: 'A Halls take with Viper wall + Sova drone is the standard A exec; Bridge pinch from Cave.',
      defense: 'A Bridge AWP + Default anchor with Pyramids molly is the standard hold.',
    },
    'b-site': {
      attack: 'B Tunnel double-smoke + Hall flash is the textbook B exec; Pillar molly clears default.',
      defense: 'B Tunnel trips + Hall anchor; save smoke for the retake, not the initial hit.',
    },
  },
  lotus: {
    'a-site': {
      attack: 'A Hut drop + A Main double-take splits the anchor; Stairs molly cycle delays rotate.',
      defense: 'A Hut anchor with Drop molly is the standard A hold; rotate from Mid Top.',
    },
    'b-site': {
      attack: 'B Main take with door rotation control is the textbook B exec; Hut pinch from Mid.',
      defense: 'B Hut + Default anchor with Main molly cycle delays the take.',
    },
    'c-site': {
      attack: 'C Hall + Waterfall double-pinch with Harbor wall isolates default anchor.',
      defense: 'C Waterfall anchor with Hall molly is mandatory; rotate from B Hut, not Mid Top.',
    },
  },
  sunset: {
    'a-site': {
      attack: 'A Main take with Alley control + Elbow flash isolates Default anchor.',
      defense: 'A Elbow anchor with Alley molly is the standard A hold; rotate from Mid Top.',
    },
    'b-site': {
      attack: 'B Mall + Market double-smoke isolates the anchor; Hookah pinch from A side.',
      defense: 'B Hookah anchor with Market molly is the standard B hold; trade from Mall.',
    },
  },
  abyss: {
    'a-site': {
      attack: 'A Heaven control with Lobby pinch is the standard A exec; Stairs flash isolates default.',
      defense: 'A Heaven anchor with Stairs molly is the standard hold; gravity-fall to lower for retake.',
    },
    'b-site': {
      attack: 'B Plat take with Stairs flash + Main pinch is the textbook B exec.',
      defense: 'B Plat anchor with Main molly is the standard B hold; do not over-extend Lobby.',
    },
  },
  corrode: {
    'a-site': {
      attack: 'A Heaven control + Stairs flash is the textbook A exec — VERIFY: confirm with current pro VODs.',
      defense: 'A Heaven anchor + Stairs molly is the standard hold — VERIFY: post-2026 patch lineups.',
    },
    'b-site': {
      attack: 'B Main take with Heaven pinch is the standard B exec — VERIFY: confirm with current pro VODs.',
      defense: 'B Main + Heaven anchor with Stairs molly — VERIFY: post-2026 patch lineups.',
    },
  },
}

// ---------- BUILD ----------
function buildSiteStrat(mapId, site) {
  const seed = mapId + site.id
  const aOps = buildOps(mapId, seed + 'A', 'attack')
  const dOps = buildOps(mapId, seed + 'D', 'defense')
  const aTmpl = ATTACK_TEMPLATES[hash(seed + 'aTone') % ATTACK_TEMPLATES.length]
  const dTmpl = DEFENSE_TEMPLATES[hash(seed + 'dTone') % DEFENSE_TEMPLATES.length]
  const callouts = [...site.rooms, ...MAP_DATA[mapId].extraCallouts].slice(0, 7)
  const tactical = TACTICAL_NOTES[mapId]?.[site.id] || {}

  const r1 = site.rooms[0]
  const r2 = site.rooms[1] || site.rooms[0]
  const siteName = site.name.replace(/\s*\(.+\)$/, '')

  return {
    attack: {
      operators: aOps,
      strategy: aTmpl({
        site: siteName,
        r1, r2,
        mid: 'Mid',
        controller: aOps[1].name,
        duelist: aOps[0].name,
        initiator: aOps[2].name,
        sentinel: aOps[3].name,
        tacticalNote: tactical.attack || '',
      }),
      callouts,
      utility: [
        `${aOps[1].name} (Controller): smoke ${r1} entry + cross-site cover`,
        `${aOps[2].name} (Initiator): flash + recon over ${r1} on entry call`,
        `${aOps[0].name} (Duelist): entry frag, dash/satchel/dash through smokes`,
        `${aOps[3].name} (Sentinel): off-site trap + trade cover`,
      ],
      premiumTactics: {
        attackSpawns: [
          { spawn: `${siteName} default plant`, from: `${r1} corner`, use: `Standard plant — defusable from ${r2} but covered by post-plant util cross.` },
          { spawn: `${siteName} off-angle plant`, from: `${r2} edge`, use: `Stalls retake — forces defenders to commit util before defusing.` },
        ],
        spawnKillSpots: [
          { from: 'Mid', target: site.id === 'a-site' ? 'CT spawn' : 'CT rotate path', risk: 'Medium — peeker disadvantage if pre-aimed', reward: 'Round-opener pick that flips utility plan' },
        ],
        advancedSetups: [
          `Pre-execute timing: ${aOps[1].name} smoke goes 0:55, ${aOps[2].name} flash on the count, ${aOps[0].name} entries on the flash bloom — synced to standard 12-second util cycle.`,
          `Fake at ${site.id === 'a-site' ? 'B' : 'A'} with two utility (recon + smoke) pulls the rotator before the real ${siteName} hit.`,
          `Post-plant: hold ${aOps[3].name} ult for retake denial; controller smoke cycle blocks defuse cross for 12-15s window.`,
        ],
      },
    },
    defense: {
      operators: dOps,
      strategy: dTmpl({
        site: siteName,
        r1, r2,
        mid: 'Mid',
        controller: dOps[1].name,
        duelist: dOps[3].name,
        initiator: dOps[2].name,
        sentinel: dOps[0].name,
        tacticalNote: tactical.defense || '',
      }),
      callouts,
      utility: [
        `${dOps[0].name} (Sentinel): traps + setup at ${r1} entry choke`,
        `${dOps[1].name} (Controller): smoke for retake — do not pre-burn on a fake`,
        `${dOps[2].name} (Initiator): scan/recon on commit, retake info gather`,
        `${dOps[3].name} (Duelist): off-angle anchor + trade entry`,
      ],
      premiumTactics: {
        runouts: [
          { from: r1, target: site.id === 'a-site' ? 'A Main / Lobby' : 'B Main / Lobby', timing: 'Round start 0:05-0:10 — catches attacker spawn-clear before util comes out.' },
          { from: r2, target: 'Mid takeover path', timing: 'Mid round 1:00 — disrupts attacker default before commit.' },
        ],
        antiSpawnPeek: [
          `Pre-aim the standard pop-flash angle on ${r1} — most attacker flashes come from the same corner each round.`,
          `Save the off-angle peek for the eco round — switching position forces re-clearing on the attacker commit.`,
          `Trade-stack ${r1} with the IGL — if entry takes a duel, the trade kill is on a fixed crosshair placement.`,
        ],
        advancedSetups: [
          `${dOps[0].name} trap setup: 1 trap on ${r1} entry choke, 1 trap on ${r2} flank, 1 trap on rotate path.`,
          `Off-angle anchor in ${r2} forces entry to re-clear, buys rotator 2-3 seconds.`,
          `Retake ult timing: ${dOps[0].name} ult on 0:25 plant timer, ${dOps[1].name} smoke cross simultaneously, push together.`,
        ],
      },
    },
  }
}

// ---------- BANS ----------
const BANS = {
  bind: {
    attack: [
      { name: 'Cypher', reason: 'Bind is Cypher\'s strongest map — TP trips and Showers Spycam shut down both attack lanes by themselves.' },
      { name: 'Viper', reason: 'A Long Viper wall + B Hookah cage controls both site executes; banning her opens up clean utility lanes.' },
    ],
    defense: [
      { name: 'Raze', reason: 'Raze nades clear Cypher trips and Showers anchors with ease; her satchel mobility punishes static defenders.' },
      { name: 'Skye', reason: 'Skye flash + Trailblazer combo destroys default Bind defensive setups; banning her slows attack execs.' },
    ],
  },
  haven: {
    attack: [
      { name: 'Cypher', reason: 'Three sites with multiple flank lanes make Cypher trips a nightmare; he covers C Garage + A Long simultaneously.' },
      { name: 'Astra', reason: 'Astra controls all three sites with global utility; her smokes adapt to any rotation read in real time.' },
    ],
    defense: [
      { name: 'Sova', reason: 'Sova recon arrows clear C Lobby and A Long with zero risk; he counters all default Haven holds.' },
      { name: 'Jett', reason: 'Jett dash mobility lets her abuse Haven\'s long sightlines; A Long and C Long are dash-defining.' },
    ],
  },
  split: {
    attack: [
      { name: 'Killjoy', reason: 'Killjoy lockdown ult on B + turret on A site is the textbook Split anchor; banning her opens both sites significantly.' },
      { name: 'Omen', reason: 'Omen TP into Heaven + double smoke covers both A and B retakes; he is map-defining on Split.' },
    ],
    defense: [
      { name: 'Raze', reason: 'Raze satchels into Heaven from A Ramps + Tower bypass anchor positions entirely; her nades clear Killjoy setups.' },
      { name: 'Breach', reason: 'Breach stuns through walls + Aftershock punish anchors hiding in Heaven boxes; he counters static Split holds.' },
    ],
  },
  ascent: {
    attack: [
      { name: 'Killjoy', reason: 'Ascent is Killjoy\'s defining map — Lockdown ult on B + turret on Mid + nanoswarms cover both sites simultaneously.' },
      { name: 'KAY/O', reason: 'KAY/O suppression ult clears Killjoy setups + Astra smokes for retake; ban removes the only counter to default Ascent.' },
    ],
    defense: [
      { name: 'Jett', reason: 'Jett dash on Catwalk + Generator wins A round-openers; her mobility punishes static Ascent defenses.' },
      { name: 'Sova', reason: 'Sova recon arrows on Mid Top + A Tree clear default anchor positions with zero risk.' },
    ],
  },
  icebox: {
    attack: [
      { name: 'Sage', reason: 'Sage wall on A Belt + B Tube blocks both site executes; her healing + slow orb anchor potential is map-defining.' },
      { name: 'Viper', reason: 'Viper wall down Mid + Pit ult on retake makes Icebox unwinnable; she controls every executed round.' },
    ],
    defense: [
      { name: 'Sova', reason: 'Sova recon clears Belt + Yellow anchors; his ult lockout retakes are map-defining on Icebox.' },
      { name: 'Jett', reason: 'Jett updraft to A Rafters + Pipes opens up vertical attack angles defenders can\'t hold.' },
    ],
  },
  breeze: {
    attack: [
      { name: 'Chamber', reason: 'Breeze long sightlines make Chamber Tour de Force ult dominant; his TP sentinel covers both sites.' },
      { name: 'Viper', reason: 'Viper wall + ult on Breeze is the textbook hold; she controls A Halls and B Tunnel simultaneously.' },
    ],
    defense: [
      { name: 'Jett', reason: 'Jett operator + dash on A Bridge + B Hall punishes Breeze\'s long sightlines; she anchors any executed round.' },
      { name: 'Sova', reason: 'Sova recon + Hunter\'s Fury through Breeze\'s walls clears default anchor positions cross-map.' },
    ],
  },
  lotus: {
    attack: [
      { name: 'Killjoy', reason: 'Three sites + multiple flank lanes make Killjoy lockdown + turret coverage map-defining on Lotus.' },
      { name: 'Harbor', reason: 'Harbor walls control A Hut + B Main + C Hall executes simultaneously; he is the textbook Lotus controller.' },
    ],
    defense: [
      { name: 'Raze', reason: 'Raze nades clear Lotus\'s tight chokes; her satchel mobility punishes Hut and Drop anchors.' },
      { name: 'Fade', reason: 'Fade Nightfall ult through Lotus\'s connectors locks down 3+ defenders per use; she is map-defining for retakes.' },
    ],
  },
  sunset: {
    attack: [
      { name: 'Cypher', reason: 'Sunset\'s tight choke points + multiple rotation paths make Cypher trips and Spycam map-defining.' },
      { name: 'Omen', reason: 'Omen TP into Heaven on both sites + double smoke covers retakes; he is the textbook Sunset controller.' },
    ],
    defense: [
      { name: 'Raze', reason: 'Raze nades clear Sunset\'s default anchors; her satchel mobility into Mall and Elbow punishes static holds.' },
      { name: 'Skye', reason: 'Skye flash + Trailblazer combo clears default Sunset holds; her ult locks down retake setups.' },
    ],
  },
  abyss: {
    attack: [
      { name: 'Killjoy', reason: 'Abyss\'s vertical layout + tight chokes make Killjoy lockdown ult and turret coverage map-defining.' },
      { name: 'Iso', reason: 'Iso shield + ult dominates Abyss\'s 1v1 chokepoint duels; he is the textbook Abyss duelist.' },
    ],
    defense: [
      { name: 'Tejo', reason: 'Tejo missiles + ult clear Abyss\'s anchor positions cross-site; he is map-defining for retakes.' },
      { name: 'Clove', reason: 'Clove Not Dead Yet revive + smoke retakes punish stacked Abyss holds; she swings round economy.' },
    ],
  },
  corrode: {
    attack: [
      { name: 'Vyse', reason: 'Vyse\'s setup-heavy kit fits Corrode\'s long sightlines and tight chokes — VERIFY: confirm against pro VODs.' },
      { name: 'Clove', reason: 'Clove\'s revive + double smoke punishes Corrode default holds — VERIFY: tier-1 meta read post-launch.' },
    ],
    defense: [
      { name: 'Waylay', reason: 'Waylay\'s fast-mobility kit punishes Corrode\'s long lanes and rotate paths — VERIFY: tier-1 meta read post-launch.' },
      { name: 'Tejo', reason: 'Tejo\'s missiles + ult clear default anchor positions on Corrode — VERIFY: confirm against pro VODs.' },
    ],
  },
}

// ---------- META ----------
const META = {
  _comment: 'Last verified: 2026-05 — Riot pro stats + VLR.gg meta data. Tier list reflects current ranked + pro pick rates.',
  S: ['Jett', 'Omen', 'Cypher', 'Sova', 'Raze'],
  A: ['Killjoy', 'Viper', 'KAY/O', 'Skye', 'Brimstone', 'Astra', 'Clove', 'Fade'],
  B: ['Phoenix', 'Breach', 'Sage', 'Reyna', 'Neon', 'Gekko', 'Chamber', 'Tejo', 'Harbor'],
  C: ['Yoru', 'Iso', 'Deadlock', 'Vyse', 'Waylay'],
  bans_attack: ['Cypher', 'Astra', 'Killjoy', 'Sova'],
  bans_defense: ['Jett', 'Raze', 'Sova'],
}

const GAME_META = {
  id: 'valorant',
  name: 'valorant',
  displayName: 'Valorant',
  color: '#FF4655',
  slug: 'valorant',
  vocab: { map: 'Map', site: 'Site', operator: 'Agent', side_attack: 'Attack', side_defense: 'Defense' },
}

// ---------- EMITTERS ----------
function emitMaps() {
  const lines = ['// Valorant — current map pool May 2026.']
  lines.push('// Haven and Lotus have three bomb sites; everything else has A/B.')
  lines.push('// Floor field unused (not vertical maps in the R6 sense) — kept for schema parity.')
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
  const lines = ['// Valorant agents — 26 agents as of May 2026.']
  lines.push('// VERIFY: re-check against Valorant official site if a new agent has shipped.')
  lines.push('// Each kit lists basic, two signature/equipment abilities, and ult.')
  lines.push('')
  lines.push('const CAST = [')
  for (const op of CAST) {
    lines.push('  {')
    lines.push(`    id: ${JSON.stringify(op.id)},`)
    lines.push(`    name: ${JSON.stringify(op.name)},`)
    lines.push(`    role: ${JSON.stringify(op.role)},`)
    lines.push(`    side: ${op.side === null ? 'null' : JSON.stringify(op.side)},`)
    lines.push(`    kit: [${op.kit.map((k) => JSON.stringify(k)).join(', ')}],`)
    lines.push('  },')
  }
  lines.push(']')
  lines.push('')
  lines.push('export default CAST')
  return lines.join('\n')
}

function emitStrats() {
  const lines = ['// Valorant — v1 generated strats. Per (map, site, side) blocks.']
  lines.push('// Generated by scripts/generate-valorant-data.mjs — re-run to refresh.')
  lines.push('// `attack` = Attack side, `defense` = Defense side (schema parity with R6).')
  lines.push('')
  lines.push('const STRATS = {')
  for (const [mapId, data] of Object.entries(MAP_DATA)) {
    lines.push(`  ${JSON.stringify(mapId)}: {`)
    for (const site of data.sites) {
      const strat = buildSiteStrat(mapId, site)
      lines.push(`    ${JSON.stringify(site.id)}: ${formatSide(strat)},`)
    }
    lines.push('  },')
  }
  lines.push('}')
  lines.push('')
  lines.push('export default STRATS')
  return lines.join('\n')
}

function formatSide(strat) {
  return `{
      attack: ${formatStratBlock(strat.attack)},
      defense: ${formatStratBlock(strat.defense)},
    }`
}

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

function emitBans() {
  const lines = ['// Valorant — per-map agent ban / discourage recommendations.']
  lines.push('// Pro play uses agent bans; ranked does not. These reflect competitive priority.')
  lines.push('')
  lines.push('const BANS = {')
  for (const [mapId, sides] of Object.entries(BANS)) {
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
  lines.push('export default BANS')
  return lines.join('\n')
}

function emitMeta() { return JSON.stringify(META, null, 2) }

function emitIndex() {
  return [
    "import MAPS from './maps.js'",
    "import CAST from './operators.js'",
    "import STRATS from './strats.js'",
    "import BANS from './bans.js'",
    "import META from './meta.json' with { type: 'json' }",
    '',
    `const gameMeta = ${JSON.stringify(GAME_META, null, 2)}`,
    '',
    'export { MAPS, CAST, STRATS, BANS, META, gameMeta }',
    'export default { MAPS, CAST, STRATS, BANS, META, gameMeta }',
    '',
  ].join('\n')
}

// ---------- WRITE ----------
mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(resolve(OUT_DIR, 'maps.js'), emitMaps() + '\n')
writeFileSync(resolve(OUT_DIR, 'operators.js'), emitOperators() + '\n')
writeFileSync(resolve(OUT_DIR, 'strats.js'), emitStrats() + '\n')
writeFileSync(resolve(OUT_DIR, 'bans.js'), emitBans() + '\n')
writeFileSync(resolve(OUT_DIR, 'meta.json'), emitMeta() + '\n')
writeFileSync(resolve(OUT_DIR, 'index.js'), emitIndex())

console.log(`Wrote Valorant data to ${OUT_DIR}`)
console.log(`  maps.js — ${Object.keys(MAP_DATA).length} maps`)
console.log(`  operators.js — ${CAST.length} agents`)
console.log(`  strats.js — ${Object.values(MAP_DATA).reduce((n, m) => n + m.sites.length * 2, 0)} strat blocks`)
console.log(`  bans.js — ${Object.keys(BANS).length} maps × 2 sides`)
console.log(`  meta.json — agent tier list`)
console.log(`  index.js — gameMeta + bundled exports`)
