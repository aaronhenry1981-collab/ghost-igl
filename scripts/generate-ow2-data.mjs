#!/usr/bin/env node
// Overwatch 2 — generates v1 data files. 5v5, role-locked (1/2/2).
//
// Schema mapping:
//   "operators" → heroes (Tank/DPS/Support)
//   "sites"     → objectives. Map-type-dependent:
//                   Control: single 'point' per round
//                   Hybrid: 'point-a' + payload checkpoints
//                   Escort: 3 payload checkpoints
//                   Push: 'mid' + push points
//                   Flashpoint: 5 capture points
//                   Clash: 5 capture points
//   "sides"     → 'attack' = offensive side (or 'first-cap' on Control)
//                 'defense' = defending side (or 'first-hold' on Control)
//   "bans"      → per-map hero ban recommendations (OW2 added bans in S9)
//   premiumTactics keys re-purposed:
//     attackSpawns   → ult combo windows + push timings
//     spawnKillSpots → high-ground takeover spots
//     advancedSetups → ult chain priorities, swap reads
//     runouts        → defender aggressive re-spawn pushes
//     antiSpawnPeek  → counter-dive / counter-flank reads
//     advancedSetups → off-angles, ult bait windows

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '..', 'src', 'data', 'games', 'ow2')

// ---------- MAPS ----------
// 16 maps representing each gametype. May 2026 rotation reference.
// VERIFY: rotation changes seasonally — re-check Blizzard official pool.

const MAP_DATA = {
  'antarctic-peninsula': {
    name: 'Antarctic Peninsula', type: 'Control', rankedPool: true,
    extraCallouts: ['Icebreaker', 'Sub-Level', 'Labs', 'High Ground', 'Choke', 'Spawn Path', 'Side Path'],
    sites: [
      { id: 'icebreaker', name: 'Icebreaker', rooms: ['Point', 'Bridge', 'Crow\'s Nest', 'Dock', 'Hangar'] },
      { id: 'sub-level', name: 'Sub-Level', rooms: ['Point', 'Crane', 'Pipes', 'Side Room', 'High Ground'] },
      { id: 'labs', name: 'Labs', rooms: ['Point', 'Server Room', 'Catwalk', 'Side Path', 'Spawn Hall'] },
    ],
  },
  busan: {
    name: 'Busan', type: 'Control', rankedPool: true,
    extraCallouts: ['Sanctuary', 'Downtown', 'MEKA Base', 'Spawn', 'Tower', 'Garage', 'Construction', 'Apartments'],
    sites: [
      { id: 'sanctuary', name: 'Sanctuary', rooms: ['Point', 'Pagoda', 'High Ground', 'Bridge', 'Spawn Path'] },
      { id: 'downtown', name: 'Downtown', rooms: ['Point', 'Karaoke', 'High Ground', 'Tunnel', 'Side Bar'] },
      { id: 'meka-base', name: 'MEKA Base', rooms: ['Point', 'Catwalk', 'Bunker', 'Spawn Hall', 'Garage'] },
    ],
  },
  ilios: {
    name: 'Ilios', type: 'Control', rankedPool: true,
    extraCallouts: ['Lighthouse', 'Ruins', 'Well', 'Spawn', 'High Ground', 'Side Bridge', 'Boop Spot'],
    sites: [
      { id: 'lighthouse', name: 'Lighthouse', rooms: ['Point', 'Spiral Stairs', 'High Ground', 'Side Path', 'Spawn Door'] },
      { id: 'ruins', name: 'Ruins', rooms: ['Point', 'Pillars', 'Greek Ruins', 'High Ground', 'Spawn Hall'] },
      { id: 'well', name: 'Well', rooms: ['Point', 'Boop Edge', 'High Ground', 'Side Path', 'Café'] },
    ],
  },
  nepal: {
    name: 'Nepal', type: 'Control', rankedPool: true,
    extraCallouts: ['Village', 'Shrine', 'Sanctum', 'Spawn', 'High Ground', 'Side Path', 'Bell'],
    sites: [
      { id: 'village', name: 'Village', rooms: ['Point', 'Bell', 'High Ground', 'Side Path', 'Spawn Door'] },
      { id: 'shrine', name: 'Shrine', rooms: ['Point', 'Stairs', 'High Ground', 'Side Bridge', 'Spawn Hall'] },
      { id: 'sanctum', name: 'Sanctum', rooms: ['Point', 'Boop Edge', 'High Ground', 'Spawn Door', 'Side Path'] },
    ],
  },
  eichenwalde: {
    name: 'Eichenwalde', type: 'Hybrid', rankedPool: true,
    extraCallouts: ['Bridge', 'Townsquare', 'Castle', 'Throne Room', 'Spawn', 'High Ground', 'Tavern', 'Courtyard'],
    sites: [
      { id: 'point-a', name: 'Point A (Townsquare)', rooms: ['Point', 'Tavern', 'High Ground', 'Bridge', 'Side Window'] },
      { id: 'payload-1', name: 'Payload — Castle Gate', rooms: ['Payload', 'Courtyard', 'High Ground', 'Side Path'] },
      { id: 'payload-2', name: 'Payload — Throne Room', rooms: ['Payload', 'Throne Room', 'Stairs', 'Side Door', 'Choke'] },
    ],
  },
  'kings-row': {
    name: "King's Row", type: 'Hybrid', rankedPool: true,
    extraCallouts: ['Statue', 'Streets', 'Underground', 'High Ground', 'Spawn', 'Roof', 'Big Window', 'Side Window'],
    sites: [
      { id: 'point-a', name: 'Point A (Statue)', rooms: ['Point', 'Big Window', 'High Ground', 'Side Window', 'Spawn'] },
      { id: 'payload-1', name: 'Payload — Underground', rooms: ['Payload', 'Tunnel', 'High Ground', 'Side Door', 'Choke'] },
      { id: 'payload-2', name: 'Payload — Final Bridge', rooms: ['Payload', 'Bridge', 'High Ground', 'Side Path', 'Spawn'] },
    ],
  },
  midtown: {
    name: 'Midtown', type: 'Hybrid', rankedPool: true,
    extraCallouts: ['Cinema', 'Plaza', 'Rooftops', 'High Ground', 'Spawn', 'Subway', 'Big Window', 'Side Window'],
    sites: [
      { id: 'point-a', name: 'Point A (Plaza)', rooms: ['Point', 'Cinema', 'Rooftops', 'Side Window', 'Spawn'] },
      { id: 'payload-1', name: 'Payload — Subway', rooms: ['Payload', 'Subway', 'High Ground', 'Side Door'] },
      { id: 'payload-2', name: 'Payload — Final', rooms: ['Payload', 'Plaza', 'Rooftops', 'Side Path', 'Spawn'] },
    ],
  },
  numbani: {
    name: 'Numbani', type: 'Hybrid', rankedPool: true,
    extraCallouts: ['Doomfist', 'Lobby', 'Streets', 'High Ground', 'Spawn', 'Roof', 'Big Window', 'Side Window'],
    sites: [
      { id: 'point-a', name: 'Point A (Lobby)', rooms: ['Point', 'Lobby', 'High Ground', 'Side Window', 'Spawn'] },
      { id: 'payload-1', name: 'Payload — Streets', rooms: ['Payload', 'Streets', 'High Ground', 'Side Door'] },
      { id: 'payload-2', name: 'Payload — Final', rooms: ['Payload', 'Plaza', 'Rooftops', 'Side Path', 'Spawn'] },
    ],
  },
  'circuit-royal': {
    name: 'Circuit Royal', type: 'Escort', rankedPool: true,
    extraCallouts: ['Main Entry', 'Garage', 'Vault', 'High Ground', 'Spawn', 'Streets', 'Casino'],
    sites: [
      { id: 'payload-1', name: 'Payload — Main Entry', rooms: ['Payload', 'Choke', 'High Ground', 'Side Door', 'Spawn'] },
      { id: 'payload-2', name: 'Payload — Garage', rooms: ['Payload', 'Garage', 'High Ground', 'Side Path', 'Spawn'] },
      { id: 'payload-3', name: 'Payload — Vault', rooms: ['Payload', 'Vault', 'High Ground', 'Side Door', 'Spawn'] },
    ],
  },
  dorado: {
    name: 'Dorado', type: 'Escort', rankedPool: true,
    extraCallouts: ['First Choke', 'Bridge', 'Backstreets', 'High Ground', 'Spawn', 'Streets', 'Plaza'],
    sites: [
      { id: 'payload-1', name: 'Payload — First Choke', rooms: ['Payload', 'Choke', 'High Ground', 'Side Door', 'Spawn'] },
      { id: 'payload-2', name: 'Payload — Bridge', rooms: ['Payload', 'Bridge', 'High Ground', 'Side Path', 'Spawn'] },
      { id: 'payload-3', name: 'Payload — Final', rooms: ['Payload', 'Plaza', 'High Ground', 'Side Door', 'Spawn'] },
    ],
  },
  junkertown: {
    name: 'Junkertown', type: 'Escort', rankedPool: true,
    extraCallouts: ['Big Truck', 'Mid', 'Final Choke', 'High Ground', 'Spawn', 'Streets', 'Mining'],
    sites: [
      { id: 'payload-1', name: 'Payload — Big Truck', rooms: ['Payload', 'Big Truck', 'High Ground', 'Side Door', 'Spawn'] },
      { id: 'payload-2', name: 'Payload — Mid', rooms: ['Payload', 'Mid', 'High Ground', 'Side Path', 'Spawn'] },
      { id: 'payload-3', name: 'Payload — Final', rooms: ['Payload', 'Final Choke', 'High Ground', 'Side Door', 'Spawn'] },
    ],
  },
  gibraltar: {
    name: 'Watchpoint: Gibraltar', type: 'Escort', rankedPool: true,
    extraCallouts: ['First Choke', 'Hangar', 'Final Mech', 'High Ground', 'Spawn', 'Side Path', 'Streets'],
    sites: [
      { id: 'payload-1', name: 'Payload — First Choke', rooms: ['Payload', 'Choke', 'High Ground', 'Side Door', 'Spawn'] },
      { id: 'payload-2', name: 'Payload — Hangar', rooms: ['Payload', 'Hangar', 'High Ground', 'Side Path', 'Spawn'] },
      { id: 'payload-3', name: 'Payload — Final Mech', rooms: ['Payload', 'Mech Bay', 'High Ground', 'Side Door', 'Spawn'] },
    ],
  },
  colosseo: {
    name: 'Colosseo', type: 'Push', rankedPool: true,
    extraCallouts: ['Mid Arch', 'High Ground', 'Spawn', 'Side Door', 'Streets', 'Robot'],
    sites: [
      { id: 'mid', name: 'Mid (Arch)', rooms: ['Robot Spawn', 'Arch', 'High Ground', 'Side Door', 'Spawn'] },
      { id: 'p1', name: 'Push Point 1', rooms: ['Robot', 'Streets', 'High Ground', 'Side Path', 'Spawn'] },
      { id: 'p2', name: 'Push Point 2 (Final)', rooms: ['Robot', 'Plaza', 'High Ground', 'Side Door', 'Spawn'] },
    ],
  },
  esperanca: {
    name: 'Esperança', type: 'Push', rankedPool: true,
    extraCallouts: ['Mid Plaza', 'High Ground', 'Spawn', 'Garden', 'Side Door', 'Streets', 'Robot'],
    sites: [
      { id: 'mid', name: 'Mid (Plaza)', rooms: ['Robot Spawn', 'Plaza', 'High Ground', 'Garden', 'Spawn'] },
      { id: 'p1', name: 'Push Point 1', rooms: ['Robot', 'Streets', 'High Ground', 'Side Door', 'Spawn'] },
      { id: 'p2', name: 'Push Point 2 (Final)', rooms: ['Robot', 'Final', 'High Ground', 'Side Path', 'Spawn'] },
    ],
  },
  suravasa: {
    name: 'Suravasa', type: 'Flashpoint', rankedPool: true,
    extraCallouts: ['Spawn', 'High Ground', 'Side Path', 'Streets', 'Tower'],
    sites: [
      { id: 'point-1', name: 'Point — Suravasa Tower', rooms: ['Point', 'Tower', 'High Ground', 'Side Path', 'Spawn'] },
      { id: 'point-2', name: 'Point — Marketplace', rooms: ['Point', 'Market', 'High Ground', 'Side Door', 'Spawn'] },
      { id: 'point-3', name: 'Point — Reservoir', rooms: ['Point', 'Reservoir', 'High Ground', 'Side Path', 'Spawn'] },
      { id: 'point-4', name: 'Point — Sanctuary', rooms: ['Point', 'Shrine', 'High Ground', 'Side Door', 'Spawn'] },
      { id: 'point-5', name: 'Point — Aerial', rooms: ['Point', 'Aerial Platform', 'High Ground', 'Side Path', 'Spawn'] },
    ],
  },
  hanaoka: {
    name: 'Hanaoka', type: 'Clash', rankedPool: true,
    extraCallouts: ['Spawn', 'High Ground', 'Side Path', 'Streets', 'Garden', 'Bridge'],
    sites: [
      { id: 'point-1', name: 'Point 1 (Defender Side)', rooms: ['Point', 'Garden', 'High Ground', 'Side Path', 'Spawn'] },
      { id: 'point-2', name: 'Point 2', rooms: ['Point', 'Bridge', 'High Ground', 'Side Door', 'Spawn'] },
      { id: 'point-3', name: 'Point 3 (Mid)', rooms: ['Point', 'Mid', 'High Ground', 'Side Path', 'Spawn'] },
      { id: 'point-4', name: 'Point 4', rooms: ['Point', 'Streets', 'High Ground', 'Side Door', 'Spawn'] },
      { id: 'point-5', name: 'Point 5 (Attacker Side)', rooms: ['Point', 'Plaza', 'High Ground', 'Side Path', 'Spawn'] },
    ],
  },
}

// ---------- HEROES ----------
// 41 heroes as of May 2026. VERIFY: re-check against Blizzard hero roster.
const CAST = [
  // Tanks (13)
  { id: 'dva', name: 'D.Va', role: 'Tank', side: null, kit: ['Boosters', 'Defense Matrix', 'Micro Missiles', 'Self-Destruct'] },
  { id: 'doomfist', name: 'Doomfist', role: 'Tank', side: null, kit: ['Power Block', 'Rocket Punch', 'Seismic Slam', 'Meteor Strike'] },
  { id: 'hazard', name: 'Hazard', role: 'Tank', side: null, kit: ['Jagged Wall', 'Violent Leap', 'Spike Guard', 'Downpour'] },
  { id: 'junker-queen', name: 'Junker Queen', role: 'Tank', side: null, kit: ['Jagged Blade', 'Commanding Shout', 'Carnage', 'Rampage'] },
  { id: 'mauga', name: 'Mauga', role: 'Tank', side: null, kit: ['Overrun', 'Cardiac Overdrive', 'Berserker', 'Cage Fight'] },
  { id: 'orisa', name: 'Orisa', role: 'Tank', side: null, kit: ['Energy Javelin', 'Javelin Spin', 'Fortify', 'Terra Surge'] },
  { id: 'ramattra', name: 'Ramattra', role: 'Tank', side: null, kit: ['Void Barrier', 'Ravenous Vortex', 'Nemesis Form', 'Annihilation'] },
  { id: 'reinhardt', name: 'Reinhardt', role: 'Tank', side: null, kit: ['Barrier Field', 'Charge', 'Fire Strike', 'Earthshatter'] },
  { id: 'roadhog', name: 'Roadhog', role: 'Tank', side: null, kit: ['Chain Hook', 'Take a Breather', 'Pig Pen', 'Whole Hog'] },
  { id: 'sigma', name: 'Sigma', role: 'Tank', side: null, kit: ['Experimental Barrier', 'Kinetic Grasp', 'Accretion', 'Gravitic Flux'] },
  { id: 'winston', name: 'Winston', role: 'Tank', side: null, kit: ['Jump Pack', 'Barrier Projector', 'Tesla Cannon', 'Primal Rage'] },
  { id: 'wrecking-ball', name: 'Wrecking Ball', role: 'Tank', side: null, kit: ['Roll', 'Grappling Claw', 'Adaptive Shield', 'Minefield'] },
  { id: 'zarya', name: 'Zarya', role: 'Tank', side: null, kit: ['Particle Barrier', 'Projected Barrier', 'Energy', 'Graviton Surge'] },
  // DPS (19)
  { id: 'ashe', name: 'Ashe', role: 'DPS', side: null, kit: ['Coach Gun', 'Dynamite', 'B.O.B.', 'Aim Down Sights'] },
  { id: 'bastion', name: 'Bastion', role: 'DPS', side: null, kit: ['A-36 Tactical Grenade', 'Configuration: Assault', 'Configuration: Artillery', 'Self-Repair'] },
  { id: 'cassidy', name: 'Cassidy', role: 'DPS', side: null, kit: ['Combat Roll', 'Magnetic Grenade', 'Deadeye', 'Fan the Hammer'] },
  { id: 'echo', name: 'Echo', role: 'DPS', side: null, kit: ['Sticky Bombs', 'Flight', 'Focusing Beam', 'Duplicate'] },
  { id: 'freja', name: 'Freja', role: 'DPS', side: null, kit: ['Take Aim', 'Updraft', 'Quick Dash', 'Bola Shot'] }, // VERIFY: Freja release
  { id: 'genji', name: 'Genji', role: 'DPS', side: null, kit: ['Swift Strike', 'Deflect', 'Shuriken', 'Dragonblade'] },
  { id: 'hanzo', name: 'Hanzo', role: 'DPS', side: null, kit: ['Storm Arrow', 'Sonic Arrow', 'Lunge', 'Dragonstrike'] },
  { id: 'junkrat', name: 'Junkrat', role: 'DPS', side: null, kit: ['Concussion Mine', 'Steel Trap', 'Frag Launcher', 'RIP-Tire'] },
  { id: 'mei', name: 'Mei', role: 'DPS', side: null, kit: ['Cryo-Freeze', 'Ice Wall', 'Endothermic Blaster', 'Blizzard'] },
  { id: 'pharah', name: 'Pharah', role: 'DPS', side: null, kit: ['Jump Jet', 'Concussive Blast', 'Rocket Launcher', 'Barrage'] },
  { id: 'reaper', name: 'Reaper', role: 'DPS', side: null, kit: ['Wraith Form', 'Shadow Step', 'Hellfire Shotguns', 'Death Blossom'] },
  { id: 'sojourn', name: 'Sojourn', role: 'DPS', side: null, kit: ['Power Slide', 'Disruptor Shot', 'Railgun', 'Overclock'] },
  { id: 'soldier-76', name: 'Soldier: 76', role: 'DPS', side: null, kit: ['Sprint', 'Helix Rockets', 'Biotic Field', 'Tactical Visor'] },
  { id: 'sombra', name: 'Sombra', role: 'DPS', side: null, kit: ['Hack', 'Stealth', 'Translocator', 'EMP'] },
  { id: 'symmetra', name: 'Symmetra', role: 'DPS', side: null, kit: ['Sentry Turrets', 'Teleporter', 'Photon Projector', 'Photon Barrier'] },
  { id: 'torbjorn', name: 'Torbjörn', role: 'DPS', side: null, kit: ['Build Turret', 'Overload', 'Rivet Gun', 'Molten Core'] },
  { id: 'tracer', name: 'Tracer', role: 'DPS', side: null, kit: ['Blink', 'Recall', 'Pulse Pistols', 'Pulse Bomb'] },
  { id: 'venture', name: 'Venture', role: 'DPS', side: null, kit: ['Burrow', 'Drill Dash', 'Smart Excavator', 'Tectonic Shock'] },
  { id: 'widowmaker', name: 'Widowmaker', role: 'DPS', side: null, kit: ['Grappling Hook', 'Venom Mine', 'Widow\'s Kiss', 'Infra-Sight'] },
  // Supports (11)
  { id: 'ana', name: 'Ana', role: 'Support', side: null, kit: ['Sleep Dart', 'Biotic Grenade', 'Biotic Rifle', 'Nano Boost'] },
  { id: 'baptiste', name: 'Baptiste', role: 'Support', side: null, kit: ['Regenerative Burst', 'Immortality Field', 'Biotic Launcher', 'Amplification Matrix'] },
  { id: 'brigitte', name: 'Brigitte', role: 'Support', side: null, kit: ['Whip Shot', 'Repair Pack', 'Barrier Shield', 'Rally'] },
  { id: 'illari', name: 'Illari', role: 'Support', side: null, kit: ['Healing Pylon', 'Outburst', 'Solar Rifle', 'Captive Sun'] },
  { id: 'juno', name: 'Juno', role: 'Support', side: null, kit: ['Glide Boost', 'Pulsar Torpedoes', 'Mediblaster', 'Orbital Ray'] },
  { id: 'kiriko', name: 'Kiriko', role: 'Support', side: null, kit: ['Swift Step', 'Protection Suzu', 'Healing Ofuda', 'Kitsune Rush'] },
  { id: 'lifeweaver', name: 'Lifeweaver', role: 'Support', side: null, kit: ['Petal Platform', 'Life Grip', 'Healing Blossom', 'Tree of Life'] },
  { id: 'lucio', name: 'Lúcio', role: 'Support', side: null, kit: ['Crossfade', 'Amp It Up', 'Sonic Amplifier', 'Sound Barrier'] },
  { id: 'mercy', name: 'Mercy', role: 'Support', side: null, kit: ['Guardian Angel', 'Resurrect', 'Caduceus Staff', 'Valkyrie'] },
  { id: 'moira', name: 'Moira', role: 'Support', side: null, kit: ['Fade', 'Biotic Orb', 'Biotic Grasp', 'Coalescence'] },
  { id: 'zenyatta', name: 'Zenyatta', role: 'Support', side: null, kit: ['Orb of Discord', 'Orb of Harmony', 'Snap Kick', 'Transcendence'] },
]

// ---------- HELPERS ----------
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h }
function pick(arr, seed) { return arr[hash(seed) % arr.length] }

const POOLS = {
  tank: ['Reinhardt', 'D.Va', 'Winston', 'Sigma', 'Orisa', 'Junker Queen', 'Ramattra', 'Zarya'],
  dps: ['Tracer', 'Sojourn', 'Cassidy', 'Ashe', 'Genji', 'Soldier: 76', 'Reaper', 'Hanzo', 'Widowmaker', 'Pharah', 'Echo'],
  support: ['Ana', 'Kiriko', 'Lúcio', 'Baptiste', 'Mercy', 'Juno', 'Illari', 'Brigitte'],
}

// Map-type bias — pick comp archetype hints
const TYPE_BIAS = {
  Control: { tank: 'Winston', dps: ['Tracer', 'Sojourn'], support: ['Lúcio', 'Kiriko'] },
  Hybrid: { tank: 'Reinhardt', dps: ['Cassidy', 'Ashe'], support: ['Ana', 'Brigitte'] },
  Escort: { tank: 'Sigma', dps: ['Ashe', 'Pharah'], support: ['Ana', 'Mercy'] },
  Push: { tank: 'Orisa', dps: ['Cassidy', 'Soldier: 76'], support: ['Baptiste', 'Lúcio'] },
  Flashpoint: { tank: 'Winston', dps: ['Tracer', 'Sojourn'], support: ['Lúcio', 'Kiriko'] },
  Clash: { tank: 'Reinhardt', dps: ['Cassidy', 'Ashe'], support: ['Ana', 'Kiriko'] },
}

function buildOps(mapId, siteSeed, side, mapType) {
  const bias = TYPE_BIAS[mapType] || TYPE_BIAS.Control
  const tank = bias.tank || pick(POOLS.tank, siteSeed + 't')
  const dps1 = bias.dps[0] || pick(POOLS.dps, siteSeed + 'd1')
  const dps2 = bias.dps[1] || pick(POOLS.dps, siteSeed + 'd2')
  const sup1 = bias.support[0] || pick(POOLS.support, siteSeed + 's1')
  const sup2 = bias.support[1] || pick(POOLS.support, siteSeed + 's2')

  if (side === 'attack') {
    return [
      { name: tank, role: 'Tank', priority: 'essential' },
      { name: dps1, role: 'DPS', priority: 'essential' },
      { name: dps2, role: 'DPS', priority: 'recommended' },
      { name: sup1, role: 'Support', priority: 'essential' },
      { name: sup2, role: 'Support', priority: 'recommended' },
    ]
  }
  return [
    { name: tank, role: 'Tank', priority: 'essential' },
    { name: dps1, role: 'DPS', priority: 'essential' },
    { name: dps2, role: 'DPS', priority: 'recommended' },
    { name: sup1, role: 'Support', priority: 'essential' },
    { name: sup2, role: 'Support', priority: 'recommended' },
  ]
}

const ATTACK_TEMPLATES = [
  ({ obj, r1, mapType, tank, dps1, dps2, sup1, sup2 }) =>
    `Standard ${obj} push: ${tank} engages on ult cycle, ${dps1} pre-positions on high ground, ${sup1} pockets the dive. ${dps2} flanks from ${r1}; ${sup2} stays behind for retreat heals. Hold the engage until ult diff is favorable.`,
  ({ obj, r1, mapType, tank, dps1, dps2, sup1, sup2 }) =>
    `Dive comp on ${obj}: ${tank} dives the back-line on ${sup1} pocket, ${dps2} dives with the tank, ${dps1} traffics from high ground. Goal is forcing a support cooldown — then committing the next push.`,
  ({ obj, r1, mapType, tank, dps1, dps2, sup1, sup2 }) =>
    `Brawl comp on ${obj}: stack the choke with ${tank} + ${sup2}, ${dps1} + ${dps2} hold ${r1} angles, ${sup1} pre-heals the front-line. Walk the team forward on Lúcio speed boost.`,
  ({ obj, r1, mapType, tank, dps1, dps2, sup1, sup2 }) =>
    `Poke setup on ${obj}: ${dps1} on high ground, ${tank} bunkers behind cover, ${sup1} amps damage. ${dps2} flanks ${r1} on ult charge. Push when both supports have ult.`,
  ({ obj, r1, mapType, tank, dps1, dps2, sup1, sup2 }) =>
    `Layered ult chain on ${obj}: ${tank} ult on engage, ${sup1} amps with Nano/Mercy boost, ${dps1} ults under cover, ${dps2} cleans up. ${sup2} preps Trans/Sound Barrier for the trade.`,
]

const DEFENSE_TEMPLATES = [
  ({ obj, r1, mapType, tank, dps1, dps2, sup1, sup2 }) =>
    `Default hold on ${obj}: ${tank} anchors choke, ${dps1} + ${dps2} cover high ground, ${sup1} + ${sup2} bunker behind cover. Save ults for the attacker push commit — do not blow on a poke.`,
  ({ obj, r1, mapType, tank, dps1, dps2, sup1, sup2 }) =>
    `Aggressive forward hold on ${obj}: ${tank} pre-positions at ${r1}, ${dps1} on the high ground for the round-opener pick. ${sup1} pockets the tank, ${sup2} watches flank.`,
  ({ obj, r1, mapType, tank, dps1, dps2, sup1, sup2 }) =>
    `Stack ${obj}: 5-on-objective with ${tank} body-blocking the cap. ${dps1} + ${dps2} cover both flanks, ${sup1} + ${sup2} chain heals. Read the pace from ult usage — full attacker ults means full commit, save your trade ults.`,
  ({ obj, r1, mapType, tank, dps1, dps2, sup1, sup2 }) =>
    `Off-angle setup on ${obj}: ${dps1} on the unconventional high ground, ${tank} draws aggro on the main, ${dps2} flanks. ${sup1} pockets the off-angle, ${sup2} mid-line.`,
  ({ obj, r1, mapType, tank, dps1, dps2, sup1, sup2 }) =>
    `Save / reset round: hold the back of ${obj}, do not commit ults. ${tank} body-blocks defuse, ${dps1} picks distance, ${sup1} keeps the team alive. Goal is a stall that wins on overtime trade or denies progress.`,
]

const TACTICAL_NOTES = {
  'antarctic-peninsula': {
    icebreaker: { attack: 'Crow\'s Nest high-ground take wins the round; commit Pharah/Echo first.', defense: 'Bridge anchor with Hangar cover punishes the standard dive engage.' },
    'sub-level': { attack: 'Crane high ground is the contested space — Sojourn slide secures it cleanly.', defense: 'Pipes off-angle for Widow + Pharah trade is the textbook hold.' },
    labs: { attack: 'Catwalk dive into back-line wins — Winston bubble + Tracer follow-up.', defense: 'Server Room anchor with Server cover denies the dive engage.' },
  },
  busan: {
    sanctuary: { attack: 'Pagoda high ground is mandatory — Pharah / Sojourn first commit.', defense: 'Bridge off-angle Widow punishes the standard high-ground take.' },
    downtown: { attack: 'Karaoke flank with Tracer / Genji isolates the support line.', defense: 'Tunnel anchor with Garage cover cycles tank between sides.' },
    'meka-base': { attack: 'Catwalk takeover is the contested space — Echo flight up.', defense: 'Bunker anchor with cross-fire from Garage punishes the dive.' },
  },
  ilios: {
    lighthouse: { attack: 'Spiral Stairs control is the round — boop knockoff is the swing kill.', defense: 'Lighthouse high ground anchor with boop denial wins most rounds.' },
    ruins: { attack: 'Pillars cover for the brawl push; commit Rein/Brig walk-down.', defense: 'Greek Ruins high-ground hold with cross-fire from spawn punishes.' },
    well: { attack: 'Boop Edge knockoff with Lúcio is the swing kill — control top first.', defense: 'High Ground anchor with boop denial denies the standard take.' },
  },
  nepal: {
    village: { attack: 'Bell high-ground takeover with Pharah / Echo first commit.', defense: 'Side path flank watch is mandatory — Tracer/Genji punish the high-ground stack.' },
    shrine: { attack: 'Stairs takeover with Reinhardt walk + Brig pocket is textbook.', defense: 'Bridge off-angle Widow punishes the standard stairs commit.' },
    sanctum: { attack: 'Spawn Door pinch with side-path flank isolates the back-line.', defense: 'High Ground anchor with boop denial punishes the standard take.' },
  },
  eichenwalde: {
    'point-a': { attack: 'Tavern high ground take + Bridge dive splits the defender stack.', defense: 'Big Window anchor with Bridge cover denies the standard tavern push.' },
    'payload-1': { attack: 'Courtyard high ground commit with Pharah / Echo first push.', defense: 'Side Path flank watch is mandatory; rotate from Castle, not main.' },
    'payload-2': { attack: 'Throne Room funnel demands ult chain — commit Nano + Dragonblade or Bob.', defense: 'Throne Room cross-fire from Stairs + Side Door wins the final hold.' },
  },
  'kings-row': {
    'point-a': { attack: 'Big Window high ground takeover wins the choke — commit Pharah first.', defense: 'Statue anchor with Side Window cross-fire denies the standard push.' },
    'payload-1': { attack: 'Tunnel side-path flank with Tracer/Genji isolates back-line.', defense: 'Underground anchor with high-ground cross-fire wins most pushes.' },
    'payload-2': { attack: 'Bridge dive with Winston + Tracer commits the back-line takedown.', defense: 'Spawn high ground hold with cross-fire from Side Path punishes.' },
  },
  midtown: {
    'point-a': { attack: 'Cinema rooftop takeover with Pharah / Echo first commit.', defense: 'Side Window flank watch — Tracer / Genji punish rooftop stack.' },
    'payload-1': { attack: 'Subway flank with side-door entry isolates the support line.', defense: 'Subway anchor with main cross-fire wins the choke.' },
    'payload-2': { attack: 'Plaza rooftop dive splits the defender stack on final.', defense: 'Plaza high ground hold with side-path cross-fire punishes.' },
  },
  numbani: {
    'point-a': { attack: 'Lobby high ground commit with Pharah / Echo wins choke.', defense: 'Big Window anchor with Side Window cross-fire denies the push.' },
    'payload-1': { attack: 'Streets side-path flank isolates the back-line.', defense: 'High Ground hold with cross-fire from Spawn punishes the standard push.' },
    'payload-2': { attack: 'Plaza rooftop dive splits the defender stack.', defense: 'Plaza high ground hold with rooftop cross-fire wins final.' },
  },
  'circuit-royal': {
    'payload-1': { attack: 'Choke high-ground take with Pharah / Echo first commit.', defense: 'Side Door flank watch is mandatory; rotate from spawn high ground.' },
    'payload-2': { attack: 'Garage roof takeover splits the defender stack on the second hold.', defense: 'Garage anchor with high-ground cross-fire denies the push.' },
    'payload-3': { attack: 'Vault funnel demands ult chain — Nano + Dragonblade or Bob.', defense: 'Vault cross-fire from spawn + side door wins final hold.' },
  },
  dorado: {
    'payload-1': { attack: 'First Choke high-ground take with Pharah / Echo first.', defense: 'Side Door flank watch is mandatory — Tracer punishes high-ground stack.' },
    'payload-2': { attack: 'Bridge dive with Winston + Tracer isolates back-line.', defense: 'Bridge anchor with cross-fire from Backstreets denies the dive.' },
    'payload-3': { attack: 'Plaza funnel demands ult chain — Mei wall isolates targets.', defense: 'Plaza cross-fire from spawn + side path wins the final hold.' },
  },
  junkertown: {
    'payload-1': { attack: 'Big Truck high ground take wins the choke; commit Pharah / Echo first.', defense: 'Side Door flank watch is mandatory; rotate from spawn.' },
    'payload-2': { attack: 'Mining side-path flank isolates the back-line on second hold.', defense: 'Mining anchor with main choke cross-fire denies the dive.' },
    'payload-3': { attack: 'Final Choke funnel demands ult chain — Nano-blade or Bob commits.', defense: 'Final Choke cross-fire from spawn + side door wins the final hold.' },
  },
  gibraltar: {
    'payload-1': { attack: 'First Choke high-ground take with Pharah / Echo first.', defense: 'Side Door flank watch is mandatory; rotate from spawn high ground.' },
    'payload-2': { attack: 'Hangar dive with Winston + Tracer isolates back-line.', defense: 'Hangar anchor with side-path cross-fire denies the dive.' },
    'payload-3': { attack: 'Mech Bay funnel demands ult chain — Nano + Dragonblade.', defense: 'Mech Bay cross-fire from spawn + side door wins final.' },
  },
  colosseo: {
    mid: { attack: 'Arch high ground takeover with Pharah / Echo first commit.', defense: 'Side Door flank watch — Tracer punishes high-ground stack.' },
    p1: { attack: 'Streets side-path flank isolates the back-line.', defense: 'High Ground anchor with Spawn cross-fire denies the push.' },
    p2: { attack: 'Plaza funnel demands ult chain on final push.', defense: 'Plaza cross-fire from Spawn + Side Door wins the final hold.' },
  },
  esperanca: {
    mid: { attack: 'Plaza high-ground take with Pharah / Echo first commit.', defense: 'Garden flank watch — Tracer / Genji punish high-ground stack.' },
    p1: { attack: 'Streets side-path flank isolates the support line.', defense: 'High Ground anchor with Spawn cross-fire denies the push.' },
    p2: { attack: 'Final funnel demands ult chain — commit Nano + Dragonblade.', defense: 'Final cross-fire from Spawn + Side Path wins the hold.' },
  },
  suravasa: {
    'point-1': { attack: 'Tower high-ground take with Pharah / Echo first.', defense: 'Side Path flank watch — Tracer punishes Tower stack.' },
    'point-2': { attack: 'Market side-path flank isolates back-line.', defense: 'Market anchor with main cross-fire denies push.' },
    'point-3': { attack: 'Reservoir high-ground take wins the choke.', defense: 'Reservoir anchor with Spawn cross-fire denies the push.' },
    'point-4': { attack: 'Shrine dive with Winston + Tracer isolates back-line.', defense: 'Shrine anchor with side-path cross-fire denies the dive.' },
    'point-5': { attack: 'Aerial Platform takeover with Pharah / Echo first.', defense: 'Aerial side-path flank watch is mandatory.' },
  },
  hanaoka: {
    'point-1': { attack: 'Garden flank with Tracer / Genji isolates support line.', defense: 'Garden anchor with cross-fire from Spawn denies the dive.' },
    'point-2': { attack: 'Bridge high-ground take with Pharah / Echo first.', defense: 'Bridge cross-fire from Spawn + Side Door wins the hold.' },
    'point-3': { attack: 'Mid funnel demands ult chain — commit Nano-blade.', defense: 'Mid cross-fire from Spawn + High Ground wins the hold.' },
    'point-4': { attack: 'Streets side-path flank isolates back-line.', defense: 'Streets anchor with main cross-fire denies the push.' },
    'point-5': { attack: 'Plaza high-ground take wins the final push.', defense: 'Plaza cross-fire from Spawn + Side Path wins the hold.' },
  },
}

// ---------- BUILD ----------
function buildSiteStrat(mapId, site) {
  const seed = mapId + site.id
  const aOps = buildOps(mapId, seed + 'A', 'attack', MAP_DATA[mapId].type)
  const dOps = buildOps(mapId, seed + 'D', 'defense', MAP_DATA[mapId].type)
  const aTmpl = ATTACK_TEMPLATES[hash(seed + 'aTone') % ATTACK_TEMPLATES.length]
  const dTmpl = DEFENSE_TEMPLATES[hash(seed + 'dTone') % DEFENSE_TEMPLATES.length]
  const callouts = [...site.rooms, ...MAP_DATA[mapId].extraCallouts].slice(0, 7)
  const tactical = TACTICAL_NOTES[mapId]?.[site.id] || {}
  const r1 = site.rooms[0]
  const obj = site.name.replace(/\s*\(.+\)$/, '')
  const mapType = MAP_DATA[mapId].type

  const aArgs = { obj, r1, mapType, tank: aOps[0].name, dps1: aOps[1].name, dps2: aOps[2].name, sup1: aOps[3].name, sup2: aOps[4].name }
  const dArgs = { obj, r1, mapType, tank: dOps[0].name, dps1: dOps[1].name, dps2: dOps[2].name, sup1: dOps[3].name, sup2: dOps[4].name }

  return {
    attack: {
      operators: aOps,
      strategy: aTmpl(aArgs) + (tactical.attack ? ' ' + tactical.attack : ''),
      callouts,
      utility: [
        `${aOps[0].name} (Tank): ult cycle dictates push timing — engage on Nano window`,
        `${aOps[1].name} (DPS): high-ground positioning, save ult for the team-fight commit`,
        `${aOps[2].name} (DPS): flank or trade, depending on map type — ${mapType}`,
        `${aOps[3].name} (Support): pocket the engage, hold ult for the trade`,
        `${aOps[4].name} (Support): off-angle heals + utility for retreat`,
      ],
      premiumTactics: {
        attackSpawns: [
          { spawn: `${obj} engage timing`, from: `${r1} high ground`, use: `Push on Nano + ${aOps[0].name === 'Reinhardt' ? 'Earthshatter' : 'tank ult'} window — 4-5 ults charged is the commit threshold.` },
          { spawn: `${obj} re-engage spawn`, from: 'Spawn high ground', use: `Group up at spawn high ground after a wipe — do not trickle, full team commit only.` },
        ],
        spawnKillSpots: [
          { from: r1, target: `defender ${tactical.attack?.includes('Widow') ? 'Widow angle' : 'support line'}`, risk: 'Medium — exposes you to off-angle Widow', reward: 'Pick that flips ult diff for the next push' },
        ],
        advancedSetups: [
          `Ult chain priority: ${aOps[3].name} amp/Nano → ${aOps[1].name} or ${aOps[0].name} ult → trade with ${aOps[2].name}.`,
          `Swap read: if defenders run double-shield, swap ${aOps[2].name} → Sombra/Mei to break the comp.`,
          `${mapType} note: ${mapType === 'Push' ? 'lock mid arch first — mid control wins push rounds' : mapType === 'Control' ? 'first cap is round 1 only — round 2/3 reset positioning each fight' : 'time the ult window with overtime cap — never engage at 30s without ults'}.`,
        ],
      },
    },
    defense: {
      operators: dOps,
      strategy: dTmpl(dArgs) + (tactical.defense ? ' ' + tactical.defense : ''),
      callouts,
      utility: [
        `${dOps[0].name} (Tank): anchor objective, save ult for retake`,
        `${dOps[1].name} (DPS): forward pick attempts on high ground`,
        `${dOps[2].name} (DPS): off-angle / flank watch`,
        `${dOps[3].name} (Support): pocket main DPS, hold ult for the engage`,
        `${dOps[4].name} (Support): mid-line heals + utility cycle`,
      ],
      premiumTactics: {
        runouts: [
          { from: r1, target: `attacker spawn high ground approach`, timing: 'Setup phase — pre-position to deny the standard high-ground take.' },
          { from: 'Side path', target: `attacker support line`, timing: 'Mid-fight — flank punish on attacker tank engage.' },
        ],
        antiSpawnPeek: [
          `Pre-aim the standard ${tactical.attack?.includes('Pharah') ? 'Pharah jump-jet' : 'engage angle'} — most attacker pushes commit from the same path each round.`,
          `Save the off-angle ${dOps[1].name} pick for the eco round — switching position forces re-clearing on the attacker push.`,
          `Trade-stack ${r1} with the tank — if the entry takes a duel, the trade kill is on a fixed crosshair placement.`,
        ],
        advancedSetups: [
          `Ult bait: pre-burn ${dOps[3].name === 'Lúcio' ? 'Sound Barrier' : 'Trans / utility'} on a fake commit, then walk it down with ${dOps[0].name} ult on the real push.`,
          `Off-angle anchor in ${r1} forces entry to re-clear, buys retake 2-3 seconds.`,
          `Retake utility: ${dOps[3].name} amp/Nano + ${dOps[1].name} ult on the cap reset — do not stagger entries.`,
        ],
      },
    },
  }
}

// ---------- BANS ----------
const BANS_BASE = {
  attack_S: ['Sombra', 'Tracer', 'Mei', 'Roadhog'],
  defense_S: ['Widowmaker', 'Pharah', 'Bastion', 'Torbjörn'],
}
function buildBans() {
  const bans = {}
  for (const [mapId, data] of Object.entries(MAP_DATA)) {
    bans[mapId] = {
      attack: [
        { name: 'Sombra', reason: `Sombra hack disrupts ${data.type} engage timings — ban removes the only reliable counter to coordinated pushes.` },
        { name: data.type === 'Escort' || data.type === 'Hybrid' ? 'Mei' : 'Roadhog', reason: data.type === 'Escort' || data.type === 'Hybrid' ? 'Mei wall + freeze on funneled attacker pushes blocks payload progression cleanly.' : 'Roadhog hook on engage punishes any tank commit; map-defining on tight chokes.' },
      ],
      defense: [
        { name: 'Pharah', reason: `${data.name} has open sightlines that favor Pharah air superiority — ban forces ground engages.` },
        { name: 'Widowmaker', reason: `${data.name} long sightlines reward Widowmaker pick attempts — ban removes the round-opener pick threat.` },
      ],
    }
  }
  return bans
}
const BANS = buildBans()

const META = {
  _comment: 'Last verified: 2026-05 — based on tier-1 OWCS pick rates + Liquipedia tier list snapshot.',
  S: ['Tracer', 'Sojourn', 'Ana', 'Kiriko', 'Reinhardt', 'D.Va'],
  A: ['Cassidy', 'Ashe', 'Pharah', 'Genji', 'Mercy', 'Lúcio', 'Baptiste', 'Winston', 'Sigma', 'Orisa', 'Junker Queen'],
  B: ['Soldier: 76', 'Reaper', 'Hanzo', 'Echo', 'Widowmaker', 'Sombra', 'Mei', 'Brigitte', 'Illari', 'Juno', 'Zarya', 'Ramattra'],
  C: ['Bastion', 'Junkrat', 'Symmetra', 'Torbjörn', 'Venture', 'Freja', 'Lifeweaver', 'Moira', 'Zenyatta', 'Roadhog', 'Mauga', 'Wrecking Ball', 'Doomfist', 'Hazard'],
  bans_attack: BANS_BASE.attack_S,
  bans_defense: BANS_BASE.defense_S,
}

const GAME_META = {
  id: 'ow2', name: 'ow2', displayName: 'Overwatch 2', color: '#F99E1A', slug: 'ow2',
  vocab: { map: 'Map', site: 'Objective', operator: 'Hero', side_attack: 'Attack', side_defense: 'Defense' },
}

// ---------- EMITTERS (shared inline) ----------
function emitMaps() {
  const lines = ['// Overwatch 2 — current rotation May 2026 (~16 maps across all gametypes).']
  lines.push('// `floor` field unused; `type` field added per-map for gametype dispatch.')
  lines.push('// VERIFY: rotation changes seasonally — check Blizzard official pool.')
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
  const lines = ['// Overwatch 2 heroes — 41 heroes May 2026.']
  lines.push('// VERIFY: re-check Blizzard hero roster if a new hero ships.')
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
  const lines = ['// Overwatch 2 — v1 generated strats. Per (map, site, side).']
  lines.push('// `attack` = offensive side, `defense` = defending side.')
  lines.push('// Generated by scripts/generate-ow2-data.mjs')
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
  const lines = ['// Overwatch 2 — per-map hero ban recommendations (S9+ ban phase).']
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

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(resolve(OUT_DIR, 'maps.js'), emitMaps() + '\n')
writeFileSync(resolve(OUT_DIR, 'operators.js'), emitOperators() + '\n')
writeFileSync(resolve(OUT_DIR, 'strats.js'), emitStrats() + '\n')
writeFileSync(resolve(OUT_DIR, 'bans.js'), emitBans() + '\n')
writeFileSync(resolve(OUT_DIR, 'meta.json'), emitMeta() + '\n')
writeFileSync(resolve(OUT_DIR, 'index.js'), emitIndex())

console.log(`Wrote OW2 data to ${OUT_DIR}`)
console.log(`  ${Object.keys(MAP_DATA).length} maps, ${CAST.length} heroes, ${Object.values(MAP_DATA).reduce((n, m) => n + m.sites.length * 2, 0)} strat blocks`)
