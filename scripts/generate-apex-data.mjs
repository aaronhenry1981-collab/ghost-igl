#!/usr/bin/env node
// Apex Legends — generates v1 data files. BR (3-squad fights, ring phases).
//
// Schema mapping:
//   "operators" → legends (Assault/Skirmisher/Recon/Controller/Support)
//   "sites"     → POIs (drop spots / hot zones) per map
//   "sides"     → 'attack' = early/mid game POI takeover (drop + early fight)
//                 'defense' = late game / endgame zone hold from this POI
//   "picks"     → drop spot recommendations per map (replaces bans.js)
//   premiumTactics keys re-purposed:
//     attackSpawns   → drop pathing + early loot priorities
//     spawnKillSpots → push timings + 3rd-party windows
//     advancedSetups → squad comp synergies + ult chain plays
//     runouts        → rotation routes from this POI to next ring
//     antiSpawnPeek  → counter-3rd-party setups + zone exit reads
//     advancedSetups → final ring positioning + zone-edge plays

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '..', 'src', 'data', 'games', 'apex')

// ---------- MAPS ----------
// Current ranked rotation May 2026 per user spec.
// VERIFY: rotation changes per season — check Apex official news.

const MAP_DATA = {
  'storm-point': {
    name: 'Storm Point', rankedPool: true,
    extraCallouts: ['Gravity Cannon', 'Coast', 'Trident Path', 'Wildlife', 'Storm', 'Ring Edge', 'Ring Center'],
    sites: [
      { id: 'storm-catcher', name: 'Storm Catcher', rooms: ['Center Tower', 'Outer Buildings', 'Loot Bins', 'Trident Spawn'] },
      { id: 'antenna', name: 'Antenna', rooms: ['Tower', 'Loot Houses', 'Gravity Cannon', 'Trident Path'] },
      { id: 'lightning-rod', name: 'Lightning Rod', rooms: ['Tower', 'Loot Pile', 'Ridge', 'Tunnel'] },
      { id: 'barometer', name: 'Barometer', rooms: ['Tower', 'Inland Loot', 'Ridge', 'Trident Spawn'] },
      { id: 'fish-farms', name: 'Fish Farms', rooms: ['Tanks', 'Tunnels', 'Pier', 'Loot Buildings'] },
      { id: 'thunder-watch', name: 'Thunder Watch', rooms: ['Cliff Towers', 'Ridge', 'Loot Bins', 'Coast Path'] },
      { id: 'cascade-falls', name: 'Cascade Falls', rooms: ['Falls', 'Loot Houses', 'Bridge', 'Cave'] },
      { id: 'launch-pad', name: 'Launch Pad', rooms: ['Pad Center', 'Loot Pile', 'Ridge', 'Cannon'] },
      { id: 'highpoint', name: 'Highpoint', rooms: ['Tower', 'Loot Bins', 'Ridge', 'Trident Path'] },
      { id: 'mill', name: 'The Mill', rooms: ['Mill Building', 'Loot Houses', 'Coast', 'Ridge'] },
      { id: 'north-pad', name: 'North Pad', rooms: ['Pad', 'Loot Pile', 'Tunnel', 'Cannon'] },
      { id: 'cenote-cave', name: 'Cenote Cave', rooms: ['Cave', 'Bridge', 'Loot Spire', 'Edge'] },
    ],
  },
  'worlds-edge': {
    name: "World's Edge", rankedPool: true,
    extraCallouts: ['Lava', 'Tunnels', 'Train Yard', 'Ridge', 'Ring Edge', 'Ring Center', 'Capacitor'],
    sites: [
      { id: 'skyhook', name: 'Skyhook', rooms: ['Center Lab', 'Outer Buildings', 'Crane', 'Tunnels'] },
      { id: 'fragment-east', name: 'Fragment East', rooms: ['Apartment Complex', 'Loot Streets', 'Ridge', 'Capacitor'] },
      { id: 'fragment-west', name: 'Fragment West', rooms: ['Streets', 'Apartments', 'Ridge', 'Capacitor'] },
      { id: 'lava-city', name: 'Lava City', rooms: ['Center Plaza', 'Loot Buildings', 'Ridge', 'Tunnels'] },
      { id: 'trials', name: 'The Trials', rooms: ['Arena Floor', 'Loot Spire', 'Ridge', 'Cave'] },
      { id: 'refinery', name: 'Refinery', rooms: ['Center Plant', 'Pipes', 'Loot Buildings', 'Ridge'] },
      { id: 'geyser', name: 'Geyser', rooms: ['Center Geyser', 'Loot Pile', 'Ridge', 'Tunnel'] },
      { id: 'survey-camp', name: 'Survey Camp', rooms: ['Tents', 'Loot Bins', 'Ridge', 'Tunnel'] },
      { id: 'drill-site', name: 'Drill Site', rooms: ['Drill', 'Loot Pile', 'Ridge', 'Tunnel'] },
      { id: 'climatizer', name: 'Climatizer', rooms: ['Center', 'Loot Bins', 'Ridge', 'Tunnel'] },
      { id: 'staging', name: 'Staging', rooms: ['Buildings', 'Loot Pile', 'Ridge', 'Train Yard'] },
      { id: 'tree', name: 'The Tree', rooms: ['Tree Center', 'Loot Pile', 'Ridge', 'Tunnel'] },
    ],
  },
  olympus: {
    name: 'Olympus', rankedPool: true,
    extraCallouts: ['Sky Bridge', 'Tunnels', 'Phase Driver', 'Ridge', 'Ring Edge', 'Trident Path'],
    sites: [
      { id: 'hammond-labs', name: 'Hammond Labs', rooms: ['Center Building', 'Outer Loot', 'Ridge', 'Trident Path'] },
      { id: 'energy-depot', name: 'Energy Depot', rooms: ['Loot Buildings', 'Ridge', 'Trident Path', 'Coast'] },
      { id: 'solar-array', name: 'Solar Array', rooms: ['Center Array', 'Loot Pile', 'Ridge', 'Trident Path'] },
      { id: 'bonsai-plaza', name: 'Bonsai Plaza', rooms: ['Plaza Center', 'Loot Streets', 'Ridge', 'Tunnels'] },
      { id: 'power-grid', name: 'Power Grid', rooms: ['Grid Center', 'Loot Buildings', 'Ridge', 'Phase Driver'] },
      { id: 'oasis', name: 'Oasis', rooms: ['Center Pool', 'Loot Buildings', 'Ridge', 'Trident Path'] },
      { id: 'estates', name: 'Estates', rooms: ['Mansion', 'Loot Yard', 'Ridge', 'Pool'] },
      { id: 'phase-driver', name: 'Phase Driver', rooms: ['Driver Center', 'Loot Pile', 'Ridge', 'Tunnel'] },
      { id: 'carrier', name: 'Carrier', rooms: ['Ship Deck', 'Loot Cargo', 'Ridge', 'Crane'] },
      { id: 'orbital-cannon', name: 'Orbital Cannon', rooms: ['Cannon Center', 'Loot Pile', 'Ridge', 'Tunnel'] },
      { id: 'velvet', name: 'Velvet', rooms: ['Center Building', 'Loot Streets', 'Ridge', 'Pool'] },
      { id: 'gardens', name: 'Gardens', rooms: ['Garden Plaza', 'Loot Pile', 'Ridge', 'Tunnel'] },
    ],
  },
  'e-district': {
    name: 'E-District', rankedPool: true,
    // VERIFY: E-District (2024 release) POIs confirmed against Apex official map breakdown.
    extraCallouts: ['Streets', 'Tunnels', 'Ring Edge', 'Ring Center', 'Sky Bridge', 'Highway'],
    sites: [
      { id: 'showcase', name: 'Showcase', rooms: ['Stage', 'Loot Floors', 'Ridge', 'Sky Bridge'] },
      { id: 'pinnacle', name: 'Pinnacle', rooms: ['Tower Top', 'Loot Floors', 'Ridge', 'Sky Bridge'] },
      { id: 'construction', name: 'Construction', rooms: ['Site Center', 'Crane', 'Loot Pile', 'Ridge'] },
      { id: 'skyway-garage', name: 'Skyway Garage', rooms: ['Garage', 'Loot Pile', 'Ridge', 'Sky Bridge'] },
      { id: 'cosmetic-lounge', name: 'Cosmetic Lounge', rooms: ['Lounge Center', 'Loot Bins', 'Ridge', 'Tunnel'] },
      { id: 'commerce', name: 'Commerce', rooms: ['Streets', 'Loot Buildings', 'Ridge', 'Sky Bridge'] },
      { id: 'spires', name: 'The Spires', rooms: ['Tower Cluster', 'Loot Pile', 'Ridge', 'Sky Bridge'] },
      { id: 'theater', name: 'Theater', rooms: ['Stage', 'Loot Floors', 'Ridge', 'Tunnel'] },
      { id: 'highrise', name: 'Highrise', rooms: ['Tower Top', 'Loot Floors', 'Ridge', 'Tunnel'] },
      { id: 'electrical', name: 'Electrical', rooms: ['Plant Center', 'Loot Pile', 'Ridge', 'Tunnel'] },
    ],
  },
  'broken-moon': {
    name: 'Broken Moon', rankedPool: true,
    extraCallouts: ['Zip Rails', 'Tunnels', 'Ring Edge', 'Ring Center', 'Promenade', 'Foundry'],
    sites: [
      { id: 'foundry', name: 'Foundry', rooms: ['Center Plant', 'Loot Bins', 'Ridge', 'Zip Rail'] },
      { id: 'stasis', name: 'Stasis', rooms: ['Center Building', 'Loot Streets', 'Ridge', 'Tunnel'] },
      { id: 'atmostation', name: 'Atmostation', rooms: ['Center Tower', 'Loot Pile', 'Ridge', 'Zip Rail'] },
      { id: 'dry-gulch', name: 'Dry Gulch', rooms: ['Gulch Floor', 'Loot Houses', 'Ridge', 'Cave'] },
      { id: 'backup', name: 'Backup', rooms: ['Center Building', 'Loot Streets', 'Ridge', 'Tunnel'] },
      { id: 'production-yard', name: 'Production Yard', rooms: ['Center Crane', 'Loot Pile', 'Ridge', 'Zip Rail'] },
      { id: 'cultivation', name: 'Cultivation', rooms: ['Center Greenhouse', 'Loot Pile', 'Ridge', 'Tunnel'] },
      { id: 'eternal-gardens', name: 'Eternal Gardens', rooms: ['Garden Plaza', 'Loot Buildings', 'Ridge', 'Zip Rail'] },
      { id: 'bionomics', name: 'Bionomics', rooms: ['Lab Center', 'Loot Pile', 'Ridge', 'Tunnel'] },
      { id: 'terraformer', name: 'Terraformer', rooms: ['Center Reactor', 'Loot Pile', 'Ridge', 'Zip Rail'] },
      { id: 'promenade', name: 'Promenade', rooms: ['Streets', 'Loot Buildings', 'Ridge', 'Tunnel'] },
    ],
  },
}

// ---------- LEGENDS ----------
// 26 legends as of May 2026. VERIFY: re-check against Apex official roster.
const CAST = [
  // Assault
  { id: 'bangalore', name: 'Bangalore', role: 'Assault', side: null, kit: ['Smoke Launcher', 'Double Time', 'Rolling Thunder'] },
  { id: 'fuse', name: 'Fuse', role: 'Assault', side: null, kit: ['Knuckle Cluster', 'Grenadier', 'The Motherlode'] },
  { id: 'ash', name: 'Ash', role: 'Assault', side: null, kit: ['Arc Snare', 'Marked for Death', 'Phase Breach'] },
  { id: 'mad-maggie', name: 'Mad Maggie', role: 'Assault', side: null, kit: ['Riot Drill', 'Warlord\'s Ire', 'Wrecking Ball'] },
  { id: 'ballistic', name: 'Ballistic', role: 'Assault', side: null, kit: ['Whistler', 'Sling', 'Tempest'] },
  // Skirmisher
  { id: 'pathfinder', name: 'Pathfinder', role: 'Skirmisher', side: null, kit: ['Grappling Hook', 'Insider Knowledge', 'Zipline Gun'] },
  { id: 'wraith', name: 'Wraith', role: 'Skirmisher', side: null, kit: ['Into the Void', 'Voices from the Void', 'Dimensional Rift'] },
  { id: 'octane', name: 'Octane', role: 'Skirmisher', side: null, kit: ['Stim', 'Swift Mend', 'Launch Pad'] },
  { id: 'revenant', name: 'Revenant', role: 'Skirmisher', side: null, kit: ['Shadow Pounce', 'Assassin\'s Instinct', 'Forged Shadows'] },
  { id: 'horizon', name: 'Horizon', role: 'Skirmisher', side: null, kit: ['Gravity Lift', 'Spacewalk', 'Black Hole'] },
  { id: 'valkyrie', name: 'Valkyrie', role: 'Skirmisher', side: null, kit: ['Missile Swarm', 'VTOL Jets', 'Skyward Dive'] },
  { id: 'alter', name: 'Alter', role: 'Skirmisher', side: null, kit: ['Void Passage', 'Gift from the Rift', 'Void Nexus'] },
  // Recon
  { id: 'bloodhound', name: 'Bloodhound', role: 'Recon', side: null, kit: ['Eye of the Allfather', 'Tracker', 'Beast of the Hunt'] },
  { id: 'crypto', name: 'Crypto', role: 'Recon', side: null, kit: ['Surveillance Drone', 'Neurolink', 'Drone EMP'] },
  { id: 'seer', name: 'Seer', role: 'Recon', side: null, kit: ['Focus of Attention', 'Heart Seeker', 'Exhibit'] },
  { id: 'vantage', name: 'Vantage', role: 'Recon', side: null, kit: ['Echo Relocation', 'Spotter\'s Lens', 'Sniper\'s Mark'] },
  // Controller
  { id: 'caustic', name: 'Caustic', role: 'Controller', side: null, kit: ['Nox Gas Trap', 'Nox Vision', 'Nox Gas Grenade'] },
  { id: 'wattson', name: 'Wattson', role: 'Controller', side: null, kit: ['Perimeter Security', 'Spark of Genius', 'Interception Pylon'] },
  { id: 'rampart', name: 'Rampart', role: 'Controller', side: null, kit: ['Amped Cover', 'Modded Loader', 'Sheila'] },
  { id: 'catalyst', name: 'Catalyst', role: 'Controller', side: null, kit: ['Piercing Spikes', 'Resilient Reinforcement', 'Dark Veil'] },
  // Support
  { id: 'lifeline', name: 'Lifeline', role: 'Support', side: null, kit: ['D.O.C. Heal Drone', 'Combat Medic', 'Care Package'] },
  { id: 'gibraltar', name: 'Gibraltar', role: 'Support', side: null, kit: ['Dome of Protection', 'Gun Shield', 'Defensive Bombardment'] },
  { id: 'mirage', name: 'Mirage', role: 'Support', side: null, kit: ['Psyche Out', 'Now You See Me', 'Life of the Party'] },
  { id: 'loba', name: 'Loba', role: 'Support', side: null, kit: ['Burglar\'s Best Friend', 'Eye for Quality', 'Black Market Boutique'] },
  { id: 'newcastle', name: 'Newcastle', role: 'Support', side: null, kit: ['Mobile Shield', 'Retrieve the Wounded', 'Castle Wall'] },
  { id: 'conduit', name: 'Conduit', role: 'Support', side: null, kit: ['Radiant Transfer', 'Savior\'s Speed', 'Energy Barricade'] },
]

function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h }
function pick(arr, seed) { return arr[hash(seed) % arr.length] }

const POOLS = {
  assault: ['Bangalore', 'Ash', 'Ballistic', 'Fuse'],
  skirmisher: ['Pathfinder', 'Wraith', 'Octane', 'Valkyrie', 'Horizon'],
  recon: ['Bloodhound', 'Seer', 'Vantage', 'Crypto'],
  controller: ['Caustic', 'Catalyst', 'Wattson', 'Rampart'],
  support: ['Lifeline', 'Newcastle', 'Conduit', 'Gibraltar', 'Loba'],
}

function buildOps(seed, side) {
  const skirmisher = pick(POOLS.skirmisher, seed + 's')
  const recon = pick(POOLS.recon, seed + 'r')
  const support = pick(POOLS.support, seed + 'p')
  if (side === 'attack') {
    return [
      { name: skirmisher, role: 'Skirmisher', priority: 'essential' },
      { name: recon, role: 'Recon', priority: 'essential' },
      { name: support, role: 'Support', priority: 'recommended' },
    ]
  }
  const controller = pick(POOLS.controller, seed + 'c')
  return [
    { name: controller, role: 'Controller', priority: 'essential' },
    { name: support, role: 'Support', priority: 'essential' },
    { name: recon, role: 'Recon', priority: 'recommended' },
  ]
}

const ATTACK_TEMPLATES = [
  ({ poi, r1, skirmisher, recon, support }) =>
    `Hot drop on ${poi}: ${skirmisher} drops first to grab the high-tier loot, ${recon} pings nearby squads, ${support} loots while ${skirmisher} secures the building. Fight for ${r1} early — third party is the bigger threat than the contested squad.`,
  ({ poi, r1, skirmisher, recon, support }) =>
    `Edge drop on ${poi}: land outside the contested zone, ${recon} scans for threats, ${support} loots up. Push ${r1} when you have full kit; do not rush undergeared.`,
  ({ poi, r1, skirmisher, recon, support }) =>
    `Mid-game rotation through ${poi}: ${recon} scans squads ahead, ${skirmisher} positions for the third-party, ${support} preps utility. Take ${r1} as a transit point, not a fight commit.`,
  ({ poi, r1, skirmisher, recon, support }) =>
    `Squad split on ${poi}: ${skirmisher} + ${recon} take ${r1}, ${support} loots the outer ring. Reconvene on the next ring callout — do not split past 50m.`,
  ({ poi, r1, skirmisher, recon, support }) =>
    `Late-game push into ${poi}: ${recon} scans the holding squad, ${skirmisher} flanks via high ground, ${support} prepares utility for cover. Force the fight before zone closes — do not get caught outside.`,
]

const DEFENSE_TEMPLATES = [
  ({ poi, r1, controller, support, recon }) =>
    `Hold ${poi} for endgame: ${controller} sets traps + denial utility on the chokes, ${support} prepares heals + revive utility, ${recon} watches squad approach pings. Force squads to push you — do not rotate out unless ring forces.`,
  ({ poi, r1, controller, support, recon }) =>
    `Building hold on ${poi}: ${controller} locks down ${r1}, ${support} runs heal cycle, ${recon} scans for the third party. Save ults for the second team push — the first squad always brings a third.`,
  ({ poi, r1, controller, support, recon }) =>
    `Stack ${poi} with the high ground: ${controller} drops utility on the choke, ${support} pockets the team, ${recon} spots the rotation in. Push only when the ring forces movement.`,
  ({ poi, r1, controller, support, recon }) =>
    `Final ring hold on ${poi}: ${controller} ult on the choke, ${support} prepares revive util, ${recon} watches for late rotators. Read the squad count from kill feed — adapt push or hold based on ring direction.`,
  ({ poi, r1, controller, support, recon }) =>
    `Off-angle hold on ${poi}: ${controller} traps the standard push lane, ${support} bunkers behind cover, ${recon} pre-pings the third party. Save ults for the cleanup, not the engage.`,
]

// Per-POI tactical notes (selected high-traffic POIs only).
const TACTICAL_NOTES = {
  'storm-point': {
    'storm-catcher': { attack: 'Center Tower has the best loot — drop first or fight for it.', defense: 'Hold the Center Tower with Wattson fences; Trident escape if zone forces.' },
    antenna: { attack: 'Tower top has a Gravity Cannon — use it to rotate out fast.', defense: 'Hold high ground on Tower; Cannon gives clean rotation if squads push.' },
    'fish-farms': { attack: 'Tank tunnels are death traps — clear with utility before entering.', defense: 'Pier funnel forces single-file pushes; Caustic gas wins the fight.' },
  },
  'worlds-edge': {
    'fragment-east': { attack: 'Apartment complex is the contested fight — hot drop ready.', defense: 'Capacitor high ground denies the standard push from Streets.' },
    'fragment-west': { attack: 'Streets are open sightlines — Bangalore smoke for cover.', defense: 'Capacitor side counter-flanks the standard Streets push.' },
    'lava-city': { attack: 'Center Plaza loot is contested — drop edge buildings first if ring forces.', defense: 'Tunnels give rotation options; do not anchor solo on center.' },
  },
  olympus: {
    'hammond-labs': { attack: 'Center Building is the loot pile — drop the building, secure the floor.', defense: 'Trident path is the rotation route — hold ridge, deny the trident push.' },
    'bonsai-plaza': { attack: 'Plaza Center is open — hot drop demands fast positioning.', defense: 'Tunnels offer rotation; do not get stuck in Plaza if zone closes.' },
  },
  'e-district': {
    showcase: { attack: 'Stage is the contested fight — drop with team for the early advantage.', defense: 'Sky Bridge rotation gives clean exit if zone closes.' },
    pinnacle: { attack: 'Tower Top has best loot — Skyway garage gives backup option.', defense: 'Tower top hold with sky-bridge denial wins endgame rotations.' },
  },
  'broken-moon': {
    foundry: { attack: 'Center Plant has tier-1 loot — drop fast, secure the building.', defense: 'Zip Rails give rotation options; hold Plant with squad utility.' },
    promenade: { attack: 'Streets are contested — Bangalore smokes give cover for the loot run.', defense: 'Tunnels offer counter-flank routes; do not anchor solo on streets.' },
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

  const aArgs = { poi, r1, skirmisher: aOps[0].name, recon: aOps[1].name, support: aOps[2].name }
  const dArgs = { poi, r1, controller: dOps[0].name, support: dOps[1].name, recon: dOps[2].name }

  return {
    attack: {
      operators: aOps,
      strategy: aTmpl(aArgs) + (tactical.attack ? ' ' + tactical.attack : ''),
      callouts,
      utility: [
        `${aOps[0].name} (Skirmisher): mobility first — rotate to next ring before contest`,
        `${aOps[1].name} (Recon): scan POI on drop, ping squads in adjacent ring`,
        `${aOps[2].name} (Support): healing cycle + utility for ring rotations`,
      ],
      premiumTactics: {
        attackSpawns: [
          { spawn: `${poi} primary drop`, from: r1, use: `Hot-drop loot priority — secure tier-1 weapons before contesting building.` },
          { spawn: `${poi} edge drop`, from: 'Outer ridge', use: `Safer drop — loot full kit before pushing main building.` },
        ],
        spawnKillSpots: [
          { from: r1, target: 'contested squad on adjacent loot pile', risk: 'Medium — third party from any direction', reward: 'Squad wipe + loot consolidation in early game' },
        ],
        advancedSetups: [
          `Ult chain priority: ${aOps[1].name} scan → ${aOps[0].name} engage → ${aOps[2].name} healing during the fight.`,
          `Squad comp synergy: with ${aOps[0].name} mobility + ${aOps[1].name} info, push fights from off-angle ridges, not main entries.`,
          `Rotation read: at ring 2 close, decide to fight or rotate based on adjacent squad count — never engage 3-team fights without info advantage.`,
        ],
      },
    },
    defense: {
      operators: dOps,
      strategy: dTmpl(dArgs) + (tactical.defense ? ' ' + tactical.defense : ''),
      callouts,
      utility: [
        `${dOps[0].name} (Controller): traps + zone denial on POI chokes`,
        `${dOps[1].name} (Support): heal cycle + revive utility for sustained holds`,
        `${dOps[2].name} (Recon): squad scans + rotation reads for incoming pushes`,
      ],
      premiumTactics: {
        runouts: [
          { from: r1, target: 'incoming squad rotation path', timing: 'Ring 4-5 close — punish squads forced into your zone' },
          { from: 'Side ridge', target: 'flanking third party', timing: 'Mid-fight — peel for teammate that engaged first' },
        ],
        antiSpawnPeek: [
          `Pre-aim the ${tactical.attack?.includes('high ground') ? 'high-ground' : 'main'} entry — most pushes commit from the same path each fight.`,
          `Save the off-angle ${dOps[2].name} scan for after the first squad pushes — third party always comes from a different direction.`,
          `Trade-stack ${r1} with the team — if the engage takes a duel, the trade kill is on a fixed crosshair placement.`,
        ],
        advancedSetups: [
          `Ult bait: pre-burn ${dOps[0].name} ult on a fake commit, then rotate back to ${r1} for the real fight.`,
          `Off-angle hold in ${r1} forces push to re-clear, buys teammates 2-3 seconds for utility setup.`,
          `Final ring positioning: hold the highest ground, drop ${dOps[0].name} traps at the choke, save ${dOps[1].name} ult for the revive cycle on the cleanup.`,
        ],
      },
    },
  }
}

// ---------- DROP PICKS ----------
// Apex picks.js = drop spot recommendations per map.
const DROP_PICKS = {
  'storm-point': [
    { name: 'Storm Catcher', reason: 'Tier-1 loot guaranteed in Center Tower. Hot drop with full squad — fight for it or land edge.', tier: 'S' },
    { name: 'Antenna', reason: 'Mid-tier loot + Gravity Cannon for fast rotation. Lower contest than Storm Catcher.', tier: 'A' },
    { name: 'Cenote Cave', reason: 'Tier-1 loot spire in middle of cave. High contest; only drop with full squad commit.', tier: 'S' },
    { name: 'Lightning Rod', reason: 'Mid-tier loot, low contest. Safe drop for solo/duo squads still learning the map.', tier: 'B' },
  ],
  'worlds-edge': [
    { name: 'Fragment East', reason: 'Apartment complex has tier-1 loot — highest contest POI on World\'s Edge. Hot drop only with full commit.', tier: 'S' },
    { name: 'Fragment West', reason: 'Same loot tier as East with slightly less contest. Default fragment for ranked play.', tier: 'S' },
    { name: 'Skyhook', reason: 'Center Lab has tier-1 loot, multiple loot floors for safe spread-out drops.', tier: 'A' },
    { name: 'Survey Camp', reason: 'Mid-tier loot, low contest. Safe drop for ranked when fragments are crowded.', tier: 'B' },
  ],
  olympus: [
    { name: 'Hammond Labs', reason: 'Center Building has tier-1 loot with multiple floors. Mid contest — usually a 2-team drop.', tier: 'A' },
    { name: 'Bonsai Plaza', reason: 'Plaza center has tier-1 loot but open sightlines. Hot drop demands fast positioning.', tier: 'S' },
    { name: 'Estates', reason: 'Mid-tier loot in mansion. Low contest, good for ranked solo drops.', tier: 'B' },
    { name: 'Energy Depot', reason: 'Mid-tier loot with Trident access for rotation. Safe drop for cautious play.', tier: 'B' },
  ],
  'e-district': [
    { name: 'Showcase', reason: 'Stage has tier-1 loot, multiple floors. Highest contest POI — VERIFY: confirm with current pro VODs.', tier: 'S' },
    { name: 'Pinnacle', reason: 'Tower top has tier-1 loot + sky-bridge rotation. Mid contest.', tier: 'A' },
    { name: 'Skyway Garage', reason: 'Mid-tier loot with multiple rotation routes. Low contest.', tier: 'B' },
    { name: 'Theater', reason: 'Mid-tier loot in stage area. Low contest, good for solo drops.', tier: 'B' },
  ],
  'broken-moon': [
    { name: 'Foundry', reason: 'Center Plant has tier-1 loot, multiple zip-rail rotations. High contest.', tier: 'S' },
    { name: 'Promenade', reason: 'Streets have tier-1 loot but open sightlines. Hot drop with full team commit.', tier: 'A' },
    { name: 'Atmostation', reason: 'Center Tower has mid-tier loot with zip-rail rotation. Mid contest.', tier: 'A' },
    { name: 'Dry Gulch', reason: 'Mid-tier loot in gulch floor. Low contest, good for cautious squads.', tier: 'B' },
  ],
}

const META = {
  _comment: 'Last verified: 2026-05 — based on ALGS pro pick rates + Apex Legends Status tier list.',
  S: ['Bloodhound', 'Catalyst', 'Newcastle', 'Conduit', 'Lifeline'],
  A: ['Bangalore', 'Wraith', 'Pathfinder', 'Valkyrie', 'Horizon', 'Caustic', 'Gibraltar', 'Loba'],
  B: ['Octane', 'Ash', 'Mad Maggie', 'Ballistic', 'Seer', 'Vantage', 'Wattson', 'Mirage', 'Alter'],
  C: ['Fuse', 'Revenant', 'Crypto', 'Rampart'],
  bans_attack: [],
  bans_defense: [],
}

const GAME_META = {
  id: 'apex', name: 'apex', displayName: 'Apex Legends', color: '#DA292A', slug: 'apex',
  vocab: { map: 'Map', site: 'POI', operator: 'Legend', side_attack: 'Engage', side_defense: 'Hold' },
}

function emitMaps() {
  const lines = ['// Apex Legends — current ranked rotation May 2026.']
  lines.push('// Sites = POIs (drop spots / hot zones); floor field unused.')
  lines.push('// VERIFY: rotation changes per season — check Apex official news.')
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
  const lines = ['// Apex Legends — 26 legends as of May 2026.']
  lines.push('// VERIFY: re-check Respawn roster if a new legend ships.')
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
  const lines = ['// Apex Legends — v1 generated strats. Per (map, POI, side).']
  lines.push('// `attack` = early/mid game POI engage, `defense` = endgame zone hold.')
  lines.push('// Generated by scripts/generate-apex-data.mjs')
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
  const lines = ['// Apex Legends — drop spot recommendations per map.']
  lines.push('// Replaces bans.js. Tier indicates contest level + loot quality.')
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

console.log(`Wrote Apex data to ${OUT_DIR}`)
console.log(`  ${Object.keys(MAP_DATA).length} maps, ${CAST.length} legends, ${Object.values(MAP_DATA).reduce((n, m) => n + m.sites.length * 2, 0)} strat blocks, ${Object.values(DROP_PICKS).reduce((n, d) => n + d.length, 0)} drop spots`)
