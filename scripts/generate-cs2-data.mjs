#!/usr/bin/env node
// Generates v1 CS2 data files for the Recon+ multi-game expansion.
// Mirrors the templating approach in scripts/generate-comingsoon-strats.mjs
// but emits to disk (multi-file) rather than stdout. Re-running is idempotent.
//
// Output: src/data/games/cs2/{maps,operators,strats,picks,meta,index}.js
//
// Notes on the schema mapping for CS2:
//   - "operators" → CS2 player-role archetypes (Entry, AWPer, Support, Lurker, IGL).
//     CS2 has no operator picks; we treat these 5 roles as the cast so the gating
//     UI (which expects {operators[]} per side per site) renders sensibly.
//   - "sites"     → bombsites A and B (no per-map mid site; mid is a callout).
//   - "sides"     → 'attack' = T-side (offence), 'defense' = CT-side (defence).
//                   We use attack/defense in the data to match the R6 schema so
//                   shared components (StratDisplay, ProGate) keep working.
//   - "bans"      → not applicable in CS2; we emit picks.js instead with
//                   must-pick weapon/utility loadouts per side per map.
//   - "premiumTactics" attack fields use {attackSpawns, spawnKillSpots,
//                   advancedSetups}; defense fields use {runouts, antiSpawnPeek,
//                   advancedSetups}. We re-purpose those keys to encode CS2
//                   concepts (default plant spots, post-plant lineups, retake
//                   stacks, anti-eco setups) without renaming the schema.

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '..', 'src', 'data', 'games', 'cs2')

// ---------- MAP CATALOG (Active Duty pool, May 2026) ----------
// Site IDs are stable; site names use canonical Liquipedia callouts.
// Per-site rooms[] are the on-site sub-callouts used in strategy text.
// Per-map extraCallouts are off-site/connector callouts cited in strats.

const MAP_DATA = {
  mirage: {
    name: 'Mirage',
    rankedPool: true,
    extraCallouts: ['Mid', 'Top Mid', 'Underpass', 'Window', 'Connector', 'Catwalk', 'Jungle', 'Stairs', 'Apps', 'Tetris', 'Palace', 'Ramp', 'CT'],
    sites: [
      { id: 'a-site', name: 'A Site (Default / Triple)', rooms: ['Default', 'Triple Box', 'CT', 'Palace', 'Ticket Booth'] },
      { id: 'b-site', name: 'B Site (Apartments)', rooms: ['Site', 'Apps', 'Short', 'Bench', 'Construction'] },
    ],
  },
  inferno: {
    name: 'Inferno',
    rankedPool: true,
    extraCallouts: ['Mid', 'Banana', 'Apps', 'Top Banana', 'Truck', 'Long', 'Short', 'Ruins', 'Arch', 'Boiler', 'Pit', 'CT', 'Library'],
    sites: [
      { id: 'a-site', name: 'A Site (Pit / Default)', rooms: ['Pit', 'Default', 'Graveyard', 'Library', 'Truck'] },
      { id: 'b-site', name: 'B Site (Banana)', rooms: ['Site', 'Coffins', 'New Box', 'Dark', 'CT'] },
    ],
  },
  anubis: {
    name: 'Anubis',
    rankedPool: true,
    extraCallouts: ['Mid', 'Connector', 'Heaven', 'Palace', 'Canal', 'Window', 'Bridge', 'Walkway', 'Lower', 'Upper', 'Tunnels', 'Boats'],
    sites: [
      { id: 'a-site', name: 'A Site (Heaven / Connector)', rooms: ['Default', 'Heaven', 'Connector', 'Palace', 'Stairs'] },
      { id: 'b-site', name: 'B Site (Bridge / Water)', rooms: ['Site', 'Bridge', 'Pillar', 'Water', 'Connector'] },
    ],
  },
  nuke: {
    name: 'Nuke',
    rankedPool: true,
    extraCallouts: ['Outside', 'Heaven', 'Hut', 'Squeaky', 'Mini', 'Ramp', 'Lobby', 'Vent', 'Toxic', 'Secret', 'Garage', 'Decon', 'Silo'],
    sites: [
      { id: 'a-site', name: 'A Site (Upper / Heaven)', rooms: ['Default', 'Heaven', 'Mini', 'Hut', 'Squeaky'] },
      { id: 'b-site', name: 'B Site (Lower / Vent)', rooms: ['Site', 'Vent', 'Toxic', 'Default', 'Lobby'] },
    ],
  },
  ancient: {
    name: 'Ancient',
    rankedPool: true,
    extraCallouts: ['Mid', 'Cave', 'Donut', 'Tunnel', 'Ramp', 'House', 'Top Mid', 'Lane', 'CT', 'Pillar', 'Bigbox', 'Heaven', 'Stairs'],
    sites: [
      { id: 'a-site', name: 'A Site (Heaven / Donut)', rooms: ['Default', 'Heaven', 'Donut', 'Stairs', 'Cave'] },
      { id: 'b-site', name: 'B Site (Pillar)', rooms: ['Site', 'Pillar', 'Bigbox', 'Tunnel', 'Lane'] },
    ],
  },
  vertigo: {
    name: 'Vertigo',
    rankedPool: true,
    extraCallouts: ['Mid', 'Ramp', 'Heaven', 'Sandbags', 'Stairs', 'CT', 'T Stairs', 'Elevator', 'Top Mid', 'Catwalk', 'Generator'],
    sites: [
      { id: 'a-site', name: 'A Site (Ramp / Heaven)', rooms: ['Default', 'Heaven', 'Boxes', 'A Ramp', 'Sandbags'] },
      { id: 'b-site', name: 'B Site (Generator / Catwalk)', rooms: ['Site', 'Generator', 'Stairs', 'B Hall', 'Catwalk'] },
    ],
  },
  dust2: {
    name: 'Dust 2',
    rankedPool: true,
    extraCallouts: ['Mid', 'Long', 'Short', 'Cat', 'Tunnels', 'Lower Tunnels', 'Upper Tunnels', 'Xbox', 'CT', 'Pit', 'Goose', 'Plat', 'Mid Doors'],
    sites: [
      { id: 'a-site', name: 'A Site (Long / Short)', rooms: ['Default', 'Pit', 'Goose', 'CT', 'Long Corner'] },
      { id: 'b-site', name: 'B Site (Tunnels / Door)', rooms: ['Site', 'Plat', 'Door', 'Back Plat', 'Window'] },
    ],
  },
  train: {
    name: 'Train',
    rankedPool: true,
    extraCallouts: ['Mid', 'Z Connector', 'Halls', 'Pop Dog', 'Lower', 'Upper', 'Ivy', 'Connector', 'Sandwich', 'Olof', 'Ladder', 'CT'],
    sites: [
      { id: 'a-site', name: 'A Site (Z / Halls)', rooms: ['Default', 'Z', 'Pop Dog', 'Halls', 'Heaven'] },
      { id: 'b-site', name: 'B Site (Upper / Lower)', rooms: ['Site', 'Lower', 'Upper', 'Headshot Box', 'Ivy'] },
    ],
  },
}

// ---------- ROLE / CAST ----------
// 5 standard CS2 player roles. Side flag indicates the side where the role's
// kit is most distinctive — IGL/Support are dual-side and left null.

const CAST = [
  {
    id: 'entry',
    name: 'Entry Fragger',
    role: 'Entry',
    side: 'attack',
    kit: ['AK-47', 'Glock / Tec-9 (pistol round)', 'Two flashbangs', 'Smoke', 'Kevlar+Helmet'],
  },
  {
    id: 'awper',
    name: 'AWPer',
    role: 'AWP',
    side: null,
    kit: ['AWP', 'Desert Eagle (secondary)', 'Smoke', 'Flashbang', 'Kevlar+Helmet'],
  },
  {
    id: 'support',
    name: 'Support',
    role: 'Support',
    side: null,
    kit: ['AK-47 / M4A4', 'Two smokes', 'Two flashbangs', 'Molotov / Incendiary', 'Kevlar+Helmet', 'Defuse kit (CT)'],
  },
  {
    id: 'lurker',
    name: 'Lurker',
    role: 'Lurker',
    side: 'attack',
    kit: ['AK-47 / AUG', 'Smoke', 'Flashbang', 'Molotov', 'Kevlar+Helmet'],
  },
  {
    id: 'igl',
    name: 'In-Game Leader',
    role: 'IGL',
    side: null,
    kit: ['AK-47 / M4A1-S', 'Two flashbangs', 'Smoke', 'Decoy / HE', 'Kevlar+Helmet', 'Defuse kit (CT)'],
  },
]

// ---------- ROLE COMPOSITIONS ----------
// CS2 always has the same 5 roles in a buy round. Priority varies by site:
// every site needs Entry+AWPer+Support; the IGL/Lurker can shift based on
// whether the call is set-piece or default.

function attackOps(siteSeed) {
  return [
    { name: 'Entry Fragger', role: 'Entry', priority: 'essential' },
    { name: 'AWPer', role: 'AWP', priority: 'essential' },
    { name: 'Support', role: 'Support', priority: 'recommended' },
    { name: 'Lurker', role: 'Lurker', priority: 'recommended' },
    { name: 'In-Game Leader', role: 'IGL', priority: 'flex' },
  ]
}

function defenseOps(siteSeed) {
  return [
    { name: 'AWPer', role: 'AWP', priority: 'essential' },
    { name: 'Support', role: 'Anchor', priority: 'essential' },
    { name: 'Entry Fragger', role: 'Trade', priority: 'recommended' },
    { name: 'In-Game Leader', role: 'IGL / Mid Anchor', priority: 'recommended' },
    { name: 'Lurker', role: 'Rotator', priority: 'flex' },
  ]
}

// ---------- DETERMINISTIC HELPERS ----------
function hash(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function pick(arr, seed) {
  return arr[hash(seed) % arr.length]
}

// ---------- STRATEGY TEMPLATES ----------
// Five attack openers + five defense setups, picked deterministically per
// (mapId, siteId) so the catalog reads with variety instead of identical prose.

const ATTACK_TEMPLATES = [
  ({ site, r1, r2, mid, breachLine, lurkLine, tacticalNote }) =>
    `Standard ${site} execute: smoke ${breachLine}, flash over from ${r2} on a coordinated count, Entry takes ${r1} first contact while AWPer holds the trade angle. Support drops molly behind boxes to clear default planting spot. ${lurkLine}.${tacticalNote ? ' ' + tacticalNote : ''}`,
  ({ site, r1, r2, mid, breachLine, lurkLine, tacticalNote }) =>
    `Mid-control opener: AWPer takes ${mid} pick attempts while Support smokes ${breachLine}. Once mid is locked, the team splits — Entry hits ${r1} on the flash, Support and IGL trail. ${lurkLine}.${tacticalNote ? ' ' + tacticalNote : ''} Plant goes down for the AWPer's post-plant cross-map angle.`,
  ({ site, r1, r2, mid, breachLine, lurkLine, tacticalNote }) =>
    `Fast hit: pop the smoke on ${breachLine} round-start, Entry takes first frag with double flashes from Support. AWPer and IGL trade in. ${lurkLine}.${tacticalNote ? ' ' + tacticalNote : ''} Goal is to land before defenders rotate from the off-site stack.`,
  ({ site, r1, r2, mid, breachLine, lurkLine, tacticalNote }) =>
    `Default → re-take read: take map control through ${mid} and ${r2}, force the rotate, then re-fake to ${site}. Support smokes ${breachLine} only after defenders bite on the off-site noise. ${lurkLine}.${tacticalNote ? ' ' + tacticalNote : ''}`,
  ({ site, r1, r2, mid, breachLine, lurkLine, tacticalNote }) =>
    `Split execute: two players hit from ${r2}, three (Entry, AWPer, Support) take ${r1}. ${breachLine} is smoked to deny the trade-cross. Both sides flash on the same count. ${lurkLine}.${tacticalNote ? ' ' + tacticalNote : ''}`,
]

const DEFENSE_TEMPLATES = [
  ({ site, r1, r2, mid, anchorLine, awpLine, tacticalNote }) =>
    `Default 2-1-2 setup: ${awpLine}. Two anchors hold ${r1}, ${anchorLine}. IGL plays ${mid} for the early read; Lurker rotates from ${r2} based on the call. Save utility for the retake — do not blow smokes on a fake.${tacticalNote ? ' ' + tacticalNote : ''}`,
  ({ site, r1, r2, mid, anchorLine, awpLine, tacticalNote }) =>
    `Aggressive ${mid} setup: ${awpLine} contests early, IGL and Support flank-watch from ${r1}. ${anchorLine}. Goal is a round-opener pick that flips the economy.${tacticalNote ? ' ' + tacticalNote : ''}`,
  ({ site, r1, r2, mid, anchorLine, awpLine, tacticalNote }) =>
    `Stack ${site}: 3-on-site, 2 watching mid + ${r2} flank. ${awpLine}. ${anchorLine}. Read the pace from utility usage — full smoke commit means full execute, walk it down with HEs and flashes.${tacticalNote ? ' ' + tacticalNote : ''}`,
  ({ site, r1, r2, mid, anchorLine, awpLine, tacticalNote }) =>
    `Default 1-2-2: solo ${mid} for AWP info, two on ${site} (anchor + trade), two on ${r2}. ${anchorLine}. ${awpLine}. Listen for the mid take — that's the rotate trigger.${tacticalNote ? ' ' + tacticalNote : ''}`,
  ({ site, r1, r2, mid, anchorLine, awpLine, tacticalNote }) =>
    `Eco / force-buy hold: stack ${site} with all 5, save the AWP for the retake. ${anchorLine}. Trade from ${r1} on the entry. Goal is a round win or a clean save — do not chase frags into the rotate.${tacticalNote ? ' ' + tacticalNote : ''}`,
]

// ---------- PER-SITE TACTICAL NOTES ----------
// Short site-specific insights to lift the generic template into actual coaching.
// Verified against Liquipedia map breakdowns (May 2026).
// Format: { mapId: { siteId: { attack, defense } } }

const TACTICAL_NOTES = {
  mirage: {
    'a-site': {
      attack: 'Smoke CT and Stairs round-start; Jungle smoke is non-negotiable for any A take.',
      defense: 'Connector control wins A rounds — lose Connector, lose site. Trade off a Window pick if forced.',
    },
    'b-site': {
      attack: 'Apps takeover with Short flash is the cleanest exec; Window smoke denies the rotator.',
      defense: 'Bench molly delays the standard Apps push by 6+ seconds — burn it on every executed round.',
    },
  },
  inferno: {
    'a-site': {
      attack: 'Library smoke is mandatory — without it the AWP holds Pit indefinitely.',
      defense: 'Pit + Default hold loses to a coordinated smoke-and-flash; rotate Truck off CT on the take.',
    },
    'b-site': {
      attack: 'Coffins molly clears the default anchor; Banana control with two utility cycles wins the round.',
      defense: 'New Box molly + CT Mid AWP is the standard hold. Save smokes for Banana retake, not the initial hit.',
    },
  },
  anubis: {
    'a-site': {
      attack: 'Connector smoke + Heaven flash is the standard exec. Palace fake pulls the rotator off Site.',
      defense: 'Heaven AWP must trade out before commit — falling back to Default loses A every round.',
    },
    'b-site': {
      attack: 'Bridge molly forces the anchor off pillar; Walkway flash blinds the Heaven rotator.',
      defense: 'Water control is mandatory — losing Water means Site is splittable from two angles.',
    },
  },
  nuke: {
    'a-site': {
      attack: 'Outside control is non-negotiable; Hut smoke blocks Heaven trade. Vent rush is the off-meta option.',
      defense: 'Heaven AWP + Squeaky anchor wins most rounds; do not over-rotate to Outside on smokes alone.',
    },
    'b-site': {
      attack: 'Vent drop into B is the highest-EV exec when CTs commit Outside. Toxic flash blinds the anchor.',
      defense: 'Vent peek into Site catches drops; Toxic molly delays the standard Lobby push.',
    },
  },
  ancient: {
    'a-site': {
      attack: 'Donut control + Cave smoke is the standard split. Heaven flash blinds the AWPer for the cross.',
      defense: 'Donut is the contested choke — anchor Cave, trade off Heaven, and rotate from Mid not B.',
    },
    'b-site': {
      attack: 'Tunnel smoke + Lane flash is the cleanest hit; Pillar molly clears the default anchor.',
      defense: 'Tunnel smoke fade gives a 2-second window — pre-aim Default common, do not peek Tunnel.',
    },
  },
  vertigo: {
    'a-site': {
      attack: 'Ramp peek is suicide without Sandbags smoke; Heaven flash blinds the anchor for Boxes plant.',
      defense: 'Ramp molly + Heaven AWP is the standard hold; rotate from B Hall through Mid not the long route.',
    },
    'b-site': {
      attack: 'Stairs + Generator double-take requires synced flashes; Catwalk lurker pinches the rotate.',
      defense: 'Catwalk control wins B rounds; trade off the Stairs entry, do not anchor Site behind boxes.',
    },
  },
  dust2: {
    'a-site': {
      attack: 'Long take with double smoke (CT + Pit) and X-Box flash is the textbook A exec; Goose plant denies retake.',
      defense: 'Long AWP with Cat trade is mandatory; under-rotate B unless you hear utility commit.',
    },
    'b-site': {
      attack: 'Tunnel smoke + Door flash blinds Plat anchor; Window denies the CT mid rotator.',
      defense: 'Plat anchor with Door molly is the standard B hold; save smoke for Tunnel retake.',
    },
  },
  train: {
    'a-site': {
      attack: 'Pop Dog smoke + Z connector flash isolates Halls anchor; default plant for Ivy post-plant lineup.',
      defense: 'Halls AWP with Z Connector trade is mandatory; do not over-extend to Pop Dog without info.',
    },
    'b-site': {
      attack: 'Lower take splits the anchor between Site and Headshot Box; Upper Lurk pinches the retake.',
      defense: 'Headshot Box AWP + Ivy molly is the standard hold; Upper rotation through Sandwich, not Olof.',
    },
  },
}

// ---------- BREACH / LURK / ANCHOR LINES ----------
// Site-specific descriptive snippets used inside the strategy templates.

function attackLines(mapId, siteId) {
  const lines = {
    mirage: {
      'a-site': { breach: 'CT + Stairs + Jungle', lurk: 'Lurker pinches Apps to deny the B-rotator', mid: 'Mid' },
      'b-site': { breach: 'Apps Connector + Window', lurk: 'Lurker holds Mid to delay CT rotation', mid: 'Mid' },
    },
    inferno: {
      'a-site': { breach: 'Library + Short + Pit', lurk: 'Lurker plays Banana to delay the rotator', mid: 'Top Mid' },
      'b-site': { breach: 'CT + Coffins', lurk: 'Lurker holds Apps + Mid for the rotation pinch', mid: 'Banana' },
    },
    anubis: {
      'a-site': { breach: 'Connector + Heaven Stairs', lurk: 'Lurker pinches B Connector for the rotate', mid: 'Mid' },
      'b-site': { breach: 'Walkway + Heaven', lurk: 'Lurker holds Mid for the A rotator pinch', mid: 'Mid' },
    },
    nuke: {
      'a-site': { breach: 'Heaven + Hut + Squeaky', lurk: 'Lurker plays Lobby/Vent for the rotate', mid: 'Outside' },
      'b-site': { breach: 'Vent + Lobby', lurk: 'Lurker holds Outside for the A pressure pinch', mid: 'Outside' },
    },
    ancient: {
      'a-site': { breach: 'Donut + Heaven + Cave', lurk: 'Lurker pressures Mid + B Tunnel for the rotate', mid: 'Mid' },
      'b-site': { breach: 'Tunnel + Lane + CT', lurk: 'Lurker holds Mid + Donut for the A pinch', mid: 'Mid' },
    },
    vertigo: {
      'a-site': { breach: 'Sandbags + Heaven', lurk: 'Lurker holds Mid + B Hall for the rotate read', mid: 'Mid' },
      'b-site': { breach: 'Catwalk + Generator', lurk: 'Lurker pinches Mid for the A rotator', mid: 'Mid' },
    },
    dust2: {
      'a-site': { breach: 'CT + Pit + Long Corner', lurk: 'Lurker plays Cat + Mid for the rotate read', mid: 'Mid' },
      'b-site': { breach: 'Door + Window + Back Plat', lurk: 'Lurker holds Cat for the A rotator pinch', mid: 'Mid Doors' },
    },
    train: {
      'a-site': { breach: 'Pop Dog + Z + Halls', lurk: 'Lurker plays Ivy + B Halls for the rotate', mid: 'Mid' },
      'b-site': { breach: 'Headshot Box + Ivy + Upper', lurk: 'Lurker holds Sandwich for the A rotator pinch', mid: 'Mid' },
    },
  }
  return lines[mapId]?.[siteId] || { breach: 'main entry chokes', lurk: 'Lurker covers the off-site flank', mid: 'Mid' }
}

function defenseLines(mapId, siteId) {
  const lines = {
    mirage: {
      'a-site': { anchor: 'Trade out from Triple to CT on the entry, not Default', awp: 'AWP holds Jungle from CT spawn for the round-opening pick' },
      'b-site': { anchor: 'Anchor Bench, trade from CT through Connector', awp: 'AWP rotates from Window to Apps on utility commit' },
    },
    inferno: {
      'a-site': { anchor: 'Default trade with Pit anchor; do not over-extend Long', awp: 'AWP holds Long from Pit, rotates to Truck on commit' },
      'b-site': { anchor: 'Coffins anchor with New Box trade; Dark molly delays the retake', awp: 'AWP rotates from CT Mid to B on the molly trade' },
    },
    anubis: {
      'a-site': { anchor: 'Heaven trade-out, anchor Default with Palace molly cycle', awp: 'AWP holds Connector from Heaven for the early pick' },
      'b-site': { anchor: 'Pillar anchor, trade from Bridge with Water rotation cover', awp: 'AWP holds Walkway from Bridge for the early read' },
    },
    nuke: {
      'a-site': { anchor: 'Heaven trade with Squeaky anchor; Hut molly delays the take', awp: 'AWP holds Hut + Mini from Heaven, rotates Outside on commit' },
      'b-site': { anchor: 'Default anchor with Vent peek; Toxic flash denies Lobby push', awp: 'AWP rotates from Heaven to B through Vent on commit' },
    },
    ancient: {
      'a-site': { anchor: 'Cave anchor with Donut trade; Stairs molly delays the take', awp: 'AWP holds Donut from Heaven, rotates Mid on commit' },
      'b-site': { anchor: 'Pillar anchor with Bigbox trade; Lane molly denies the take', awp: 'AWP holds Lane from CT, rotates Tunnel on smoke commit' },
    },
    vertigo: {
      'a-site': { anchor: 'Ramp anchor with Heaven trade; Sandbags molly delays the take', awp: 'AWP holds Ramp from Heaven for the round-opener pick' },
      'b-site': { anchor: 'Site anchor with B Hall trade; Catwalk molly cycle delays', awp: 'AWP holds B Hall from Stairs, rotates Mid on commit' },
    },
    dust2: {
      'a-site': { anchor: 'Goose anchor with CT trade; Pit molly delays the Long take', awp: 'AWP holds Long from CT, rotates Cat on Mid commit' },
      'b-site': { anchor: 'Plat anchor with Door trade; Tunnel molly delays the take', awp: 'AWP rotates from Mid Doors to B on the molly commit' },
    },
    train: {
      'a-site': { anchor: 'Halls anchor with Z trade; Pop Dog molly delays the take', awp: 'AWP holds Z + Pop Dog from Heaven for the early read' },
      'b-site': { anchor: 'Upper anchor with Ivy trade; Lower molly delays the rush', awp: 'AWP holds Headshot Box from Ivy for the round-opener pick' },
    },
  }
  return lines[mapId]?.[siteId] || { anchor: 'Trade carefully off the entry — don\'t over-peek', awp: 'AWP holds the long sightline and rotates on info' }
}

// ---------- UTILITY LOADOUTS ----------
// Per-site utility for both sides. Standardized for v1; refine per pro VOD review.

function attackUtility(mapId, siteId) {
  const a = attackLines(mapId, siteId)
  return [
    `Smoke: ${a.breach.split(' + ').slice(0, 2).join(' + ')} (execute smokes)`,
    `Flash: pop-flash over from off-site to blind anchor on entry`,
    `Molotov: clear default plant spot anchor + post-plant lineup`,
    `Decoy: optional fake at ${siteId === 'a-site' ? 'B' : 'A'} to pull rotators`,
  ]
}

function defenseUtility(mapId, siteId) {
  const d = defenseLines(mapId, siteId)
  return [
    `Smoke: save for retake — ${siteId === 'a-site' ? 'Connector' : 'Mid Connector'} smoke on commit`,
    `Flash: pop-flash to break execute timing`,
    `Molotov: ${d.anchor.match(/(\w+) molly/)?.[0] || 'choke molly'} cycle to delay the take`,
    `HE: chip damage on stacked entry, post-plant area denial`,
  ]
}

// ---------- PREMIUM TACTICS ----------
// Same field shape as R6: {attackSpawns, spawnKillSpots, advancedSetups} on
// attack; {runouts, antiSpawnPeek, advancedSetups} on defense. We re-purpose
// these to encode CS2 concepts so the existing UI components work as-is.
//
//   attackSpawns   → default plant spots + post-plant lineups
//   spawnKillSpots → AWP opening picks (T-side rifle peek angles)
//   advancedSetups → smoke lineups, fake exec patterns, anti-stack reads
//   runouts        → CT-side aggressive peeks before T setup
//   antiSpawnPeek  → counter-utility against T-side pop-flash + fast hits
//   advancedSetups → boost spots, off-angles, retake stacks

function attackPremium(mapId, site) {
  const a = attackLines(mapId, site.id)
  const r1 = site.rooms[0]
  const r2 = site.rooms[1] || site.rooms[0]
  return {
    attackSpawns: [
      {
        spawn: `${site.name} default plant`,
        from: `${r1} corner`,
        use: `Standard plant spot — defusable from ${r2} but covered by post-plant lineup. Default for any executed round.`,
      },
      {
        spawn: `${site.name} default + 1 plant`,
        from: `${r2} edge`,
        use: `Off-angle plant for stalling retake — forces CT to commit utility before defusing.`,
      },
    ],
    spawnKillSpots: [
      {
        from: a.mid,
        target: `${site.id === 'a-site' ? 'CT spawn' : 'CT rotator path'}`,
        risk: 'Medium — peeker disadvantage if CT pre-aimed',
        reward: 'Round-opener pick that flips utility plan and economy',
      },
    ],
    advancedSetups: [
      `Pre-execute smoke timing: ${a.breach.split(' + ')[0]} smoke goes 0:55, second smoke at 0:50, flash on the nade — counts the molly cycle.`,
      `Fake at ${site.id === 'a-site' ? 'B' : 'A'} with two utility (smoke + decoy) pulls the rotator before the real ${site.name} hit.`,
      `Post-plant: AWPer holds ${a.mid} from default plant, denies the CT-side defuse trade for full timer.`,
    ],
  }
}

function defensePremium(mapId, site) {
  const d = defenseLines(mapId, site.id)
  const r1 = site.rooms[0]
  const r2 = site.rooms[1] || site.rooms[0]
  return {
    runouts: [
      {
        from: r1,
        target: `${site.id === 'a-site' ? 'A connector / Long' : 'B Tunnel / Apps'}`,
        timing: 'Round start 0:05-0:10 — catches T-side spawn-clear before utility comes out.',
      },
      {
        from: r2,
        target: 'Mid takeover path',
        timing: 'Mid round 1:00 mark — disrupts T-side default before commit.',
      },
    ],
    antiSpawnPeek: [
      `Pre-aim the standard pop-flash angle on ${r1} — most T-side flashes come from the same corner every round.`,
      `Save the off-angle peek for the eco round — switching position forces re-clearing on the T-side commit.`,
      `Trade-stack ${r1} with the IGL — if the entry takes a duel, the trade kill is on a fixed crosshair placement.`,
    ],
    advancedSetups: [
      `Boost spot: ${site.id === 'a-site' ? 'Triple boost on Mirage A or Heaven box on Anubis A' : 'New Box on Inferno B or Pillar boost on Ancient B'} — VERIFY: confirm with current pro VODs.`,
      `Off-angle anchor in ${r2} forces the entry to re-clear, buys the rotator 2-3 seconds.`,
      `Retake utility: smoke ${d.anchor.match(/from (\w+)/)?.[1] || r1} the cross, flash over from CT, push together — do not stagger entries.`,
    ],
  }
}

// ---------- BUILD A SITE STRAT BLOCK ----------

function buildSiteStrat(mapId, site) {
  const seed = mapId + site.id
  const aOps = attackOps(seed + 'A')
  const dOps = defenseOps(seed + 'D')
  const a = attackLines(mapId, site.id)
  const d = defenseLines(mapId, site.id)
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
        r1,
        r2,
        mid: a.mid,
        breachLine: a.breach,
        lurkLine: a.lurk,
        tacticalNote: tactical.attack || '',
      }),
      callouts,
      utility: attackUtility(mapId, site.id),
      premiumTactics: attackPremium(mapId, site),
    },
    defense: {
      operators: dOps,
      strategy: dTmpl({
        site: siteName,
        r1,
        r2,
        mid: a.mid,
        anchorLine: d.anchor,
        awpLine: d.awp,
        tacticalNote: tactical.defense || '',
      }),
      callouts,
      utility: defenseUtility(mapId, site.id),
      premiumTactics: defensePremium(mapId, site),
    },
  }
}

// ---------- PICKS (CS2-specific replacement for bans.js) ----------
// Per-map per-side must-pick weapons + utility loadouts. Specific to map
// geometry (e.g., AWP-friendly maps emphasize AWP; molly-heavy maps call out
// specific incendiary lineups).

const PICKS = {
  mirage: {
    attack: [
      { name: 'AK-47', reason: 'T-side rifle, one-shot headshot. Mandatory full-buy on every gun round.' },
      { name: 'Window smoke', reason: 'Smoking CT Window denies the AWPer\'s most dangerous mid pick angle. Zero-cost mid control.' },
      { name: 'Apps molotov (B exec)', reason: 'Bench molly clears the default B anchor and forces a 6-second utility trade.' },
    ],
    defense: [
      { name: 'AWP', reason: 'Mirage is AWP-defining — Jungle hold from CT spawn wins more rounds than any other CT setup.' },
      { name: 'M4A1-S', reason: 'Connector and Apps holds reward the silenced one-tap; M4A4 acceptable but A1-S is preferred at the level.' },
      { name: 'Stairs molotov (A hold)', reason: 'Standard CT Stairs molly delays the A take and forces a re-smoke from the Ts.' },
    ],
  },
  inferno: {
    attack: [
      { name: 'AK-47', reason: 'Mandatory T rifle for Banana and A site executes — both sites reward one-tap rifling at distance.' },
      { name: 'Banana molotov', reason: 'Standard T-side Banana molly clears CT pre-aim spots and unlocks the choke. Single most-thrown utility on Inferno.' },
      { name: 'Library smoke (A exec)', reason: 'Without Library smoke, the CT AWP holds Pit indefinitely — one-way smoke is non-negotiable.' },
    ],
    defense: [
      { name: 'AWP', reason: 'Banana and Pit AWP angles win Inferno rounds; A-default AWP holds the Long sightline by itself.' },
      { name: 'New Box molotov (B hold)', reason: 'New Box molly + CT mid AWP is the textbook Inferno B hold. Burn it on every executed round.' },
      { name: 'CT Banana molotov', reason: 'Forces the T-side Banana take to commit two utility instead of one — economy lever.' },
    ],
  },
  anubis: {
    attack: [
      { name: 'AK-47', reason: 'Long sightlines on both sites reward consistent rifle play; Anubis A take is rifle-heavy.' },
      { name: 'Connector smoke (A exec)', reason: 'Connector smoke isolates Heaven from Default — without it, the Heaven AWP shuts down every A take.' },
      { name: 'Walkway flash (B exec)', reason: 'Standard pop-flash to blind Heaven rotator on the B hit. Mandatory for the Bridge take.' },
    ],
    defense: [
      { name: 'AWP', reason: 'Heaven and Bridge AWP angles define Anubis CT — rifle anchors lose without the AWP trade.' },
      { name: 'Mid molotov (early hold)', reason: 'Mid molly delays the standard T-side Mid takeover by 4-5 seconds, opens room for the rotate.' },
      { name: 'Defuse kit', reason: 'Anubis post-plants on both sites favor 5-second defuses; the kit gap is round-deciding.' },
    ],
  },
  nuke: {
    attack: [
      { name: 'AK-47', reason: 'Outside takeover and ramp peeks reward the AK\'s one-tap; M4A4 trade is fine on Outside ramp.' },
      { name: 'Hut smoke (A exec)', reason: 'Hut smoke blocks the Heaven trade angle — without it, every A take collapses on the cross.' },
      { name: 'Vent flashbang (B exec)', reason: 'Pop-flash on the Vent drop blinds the Default anchor; mandatory for any B exec into Lobby/Vent.' },
    ],
    defense: [
      { name: 'AWP', reason: 'Heaven AWP holds A site by itself; Outside AWP from CT controls the ramp pre-utility.' },
      { name: 'Outside molotov', reason: 'Round-opening Outside molly delays Outside takeover by 6+ seconds — economy lever.' },
      { name: 'Vent peek setup', reason: 'CT Vent peek into B catches drops; mandatory for the Lobby-stacked round.' },
    ],
  },
  ancient: {
    attack: [
      { name: 'AK-47', reason: 'Donut and Tunnel choke fights reward the rifle one-tap; Ancient is an aim map.' },
      { name: 'Donut smoke (A exec)', reason: 'Donut smoke blocks the Heaven trade and isolates the anchor; without it, A take collapses.' },
      { name: 'Tunnel smoke (B exec)', reason: 'Tunnel smoke on B exec is a fade — pre-aim Default common as the smoke fades.' },
    ],
    defense: [
      { name: 'AWP', reason: 'Donut AWP from Heaven holds the choke; Lane AWP from CT denies Tunnel pushes solo.' },
      { name: 'M4A1-S', reason: 'Cave and Pillar holds reward the silenced one-tap; off-angle pre-aim wins more than M4A4 spam.' },
      { name: 'Mid molotov', reason: 'Mid molly cycle delays the standard Mid takeover by 4-5 seconds; primary economy lever.' },
    ],
  },
  vertigo: {
    attack: [
      { name: 'AK-47', reason: 'Ramp peeks and Stairs takes reward the AK one-tap at close range.' },
      { name: 'Sandbags smoke (A exec)', reason: 'Without Sandbags smoke, Ramp peek is suicide — the Heaven AWP locks the angle.' },
      { name: 'Catwalk smoke (B exec)', reason: 'Catwalk smoke isolates the rotator from Site; mandatory for any B Stairs+Generator double-take.' },
    ],
    defense: [
      { name: 'AWP', reason: 'Ramp AWP from Heaven defines Vertigo A — rifle anchor at A loses without the AWP trade.' },
      { name: 'Ramp molotov', reason: 'Ramp molly cycle delays the A take by 5+ seconds; primary economy lever on Vertigo.' },
      { name: 'Catwalk molotov', reason: 'Catwalk molly forces the B take to commit smokes early; flips the round economy.' },
    ],
  },
  dust2: {
    attack: [
      { name: 'AK-47', reason: 'Long peeks and Tunnel takes reward the AK one-tap at all distances; Dust 2 is rifle-defining.' },
      { name: 'CT smoke + Pit smoke (A exec)', reason: 'Double smoke for A Long take is the textbook exec; without both, AWP picks the lane.' },
      { name: 'Tunnel smoke (B exec)', reason: 'Tunnel smoke isolates Plat anchor; standard for any executed B take.' },
    ],
    defense: [
      { name: 'AWP', reason: 'Long AWP defines Dust 2 — every CT round routes through the Long pick or trade.' },
      { name: 'Cat molotov', reason: 'Cat molly delays the Mid takeover and the Cat-to-A drop; primary CT utility.' },
      { name: 'Plat molotov (B hold)', reason: 'Plat molly cycle on B forces the T side to over-commit utility on the take.' },
    ],
  },
  train: {
    attack: [
      { name: 'AK-47', reason: 'Halls peeks and Z connector trades reward the AK one-tap; Train is an aim-heavy map.' },
      { name: 'Pop Dog smoke (A exec)', reason: 'Pop Dog smoke blocks the Z connector trade; mandatory for any A take.' },
      { name: 'Headshot Box smoke (B exec)', reason: 'Headshot Box smoke isolates the Upper anchor; required for the Lower drop B take.' },
    ],
    defense: [
      { name: 'AWP', reason: 'Halls AWP from Heaven holds A by itself; Headshot Box AWP from Ivy locks B.' },
      { name: 'Ivy molotov', reason: 'Ivy molly cycle delays the standard B take by 4-5 seconds; primary economy lever.' },
      { name: 'Pop Dog molotov', reason: 'Pop Dog molly delays the A take and forces the smoke commit; CT economy lever.' },
    ],
  },
}

// ---------- META TIER LIST (May 2026) ----------
// Tiers the WEAPONS that drive CS2 strategic differentiation. CS2 has no
// character-pick meta — players pick guns, not heroes. The cast (5 role
// archetypes) is a constant per round, not a tier-able choice.

const META = {
  // Last verified: 2026-05 — based on HLTV pro stats, Liquipedia tournament data
  S: ['AK-47', 'AWP', 'M4A4', 'M4A1-S'],
  A: ['Desert Eagle', 'Galil AR', 'FAMAS', 'P250', 'Tec-9', 'USP-S'],
  B: ['SG 553', 'AUG', 'MP9', 'MAC-10', 'MP7', 'Five-SeveN', 'CZ75-Auto'],
  C: ['UMP-45', 'Negev', 'M249', 'P90', 'Bizon', 'XM1014', 'MAG-7'],
  // CS2 has no T/CT-side bans — included as empty arrays for schema parity.
  bans_attack: [],
  bans_defense: [],
}

// ---------- gameMeta ----------

const GAME_META = {
  id: 'cs2',
  name: 'cs2',
  displayName: 'Counter-Strike 2',
  color: '#F2A526',
  slug: 'cs2',
  vocab: {
    map: 'Map',
    site: 'Bombsite',
    operator: 'Role',
    side_attack: 'T',
    side_defense: 'CT',
  },
}

// ---------- EMITTERS ----------

function emitMaps() {
  const lines = ['// Counter-Strike 2 — Active Duty map pool (May 2026).']
  lines.push('// `rankedPool: true` flags maps in the current Premier / Active Duty rotation.')
  lines.push('// `sites` are the two bombsites; the floor field is unused on CS2 maps')
  lines.push('// but kept for schema parity with the R6 maps.js shape.')
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
  const lines = ['// Counter-Strike 2 — Player role archetypes (the "cast").']
  lines.push('// CS2 has no character picks; the cast is the 5 standard player roles')
  lines.push('// every team runs in a buy round. Kits list the canonical weapon +')
  lines.push('// utility loadout each role buys on a full-buy.')
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
  const lines = ['// Counter-Strike 2 — v1 generated strats. Per (map, site, side) blocks.']
  lines.push('// Generated by scripts/generate-cs2-data.mjs — re-run to refresh.')
  lines.push('// `attack` = T-side, `defense` = CT-side (schema parity with R6).')
  lines.push('// premiumTactics fields re-purpose R6 keys for CS2 concepts:')
  lines.push('//   attackSpawns   → default plant spots + post-plant lineups')
  lines.push('//   spawnKillSpots → AWP / rifle peek opening picks')
  lines.push('//   advancedSetups → smoke lineups, fake exec patterns, retake stacks')
  lines.push('//   runouts        → CT aggressive early peeks')
  lines.push('//   antiSpawnPeek  → counter-utility against fast hits')
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
  const opsJs = b.operators.map((o) =>
    `          { name: ${JSON.stringify(o.name)}, role: ${JSON.stringify(o.role)}, priority: ${JSON.stringify(o.priority)} }`
  ).join(',\n')
  const calloutsJs = b.callouts.map((c) => JSON.stringify(c)).join(', ')
  const utilityJs = b.utility.map((u) => `          ${JSON.stringify(u)}`).join(',\n')
  const premiumJs = b.premiumTactics ? `,
        premiumTactics: ${formatPremium(b.premiumTactics)}` : ''
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
  if (p.attackSpawns) {
    const items = p.attackSpawns.map((s) => `            { spawn: ${JSON.stringify(s.spawn)}, from: ${JSON.stringify(s.from)}, use: ${JSON.stringify(s.use)} }`).join(',\n')
    parts.push(`          attackSpawns: [\n${items},\n          ]`)
  }
  if (p.spawnKillSpots) {
    const items = p.spawnKillSpots.map((s) => `            { from: ${JSON.stringify(s.from)}, target: ${JSON.stringify(s.target)}, risk: ${JSON.stringify(s.risk)}, reward: ${JSON.stringify(s.reward)} }`).join(',\n')
    parts.push(`          spawnKillSpots: [\n${items},\n          ]`)
  }
  if (p.runouts) {
    const items = p.runouts.map((s) => `            { from: ${JSON.stringify(s.from)}, target: ${JSON.stringify(s.target)}, timing: ${JSON.stringify(s.timing)} }`).join(',\n')
    parts.push(`          runouts: [\n${items},\n          ]`)
  }
  if (p.antiSpawnPeek) {
    const items = p.antiSpawnPeek.map((s) => `            ${JSON.stringify(s)}`).join(',\n')
    parts.push(`          antiSpawnPeek: [\n${items},\n          ]`)
  }
  if (p.advancedSetups) {
    const items = p.advancedSetups.map((s) => `            ${JSON.stringify(s)}`).join(',\n')
    parts.push(`          advancedSetups: [\n${items},\n          ]`)
  }
  return `{\n${parts.join(',\n')},\n        }`
}

function emitPicks() {
  const lines = ['// Counter-Strike 2 — must-pick weapon + utility loadouts per map per side.']
  lines.push('// CS2 has no character ban phase; this file replaces bans.js for the CS2')
  lines.push('// game data shape. Per-map list of weapons / utility you cannot skip.')
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

function emitMeta() {
  return JSON.stringify({
    _comment: 'Last verified: 2026-05 — HLTV pro stats + Liquipedia tournament data. CS2 weapons-tier list (no character meta).',
    ...META,
  }, null, 2)
}

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

// ---------- WRITE ----------

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(resolve(OUT_DIR, 'maps.js'), emitMaps() + '\n')
writeFileSync(resolve(OUT_DIR, 'operators.js'), emitOperators() + '\n')
writeFileSync(resolve(OUT_DIR, 'strats.js'), emitStrats() + '\n')
writeFileSync(resolve(OUT_DIR, 'picks.js'), emitPicks() + '\n')
writeFileSync(resolve(OUT_DIR, 'meta.json'), emitMeta() + '\n')
writeFileSync(resolve(OUT_DIR, 'index.js'), emitIndex())

console.log(`Wrote CS2 data to ${OUT_DIR}`)
console.log(`  maps.js       — ${Object.keys(MAP_DATA).length} maps`)
console.log(`  operators.js  — ${CAST.length} role archetypes`)
console.log(`  strats.js     — ${Object.values(MAP_DATA).reduce((n, m) => n + m.sites.length * 2, 0)} strat blocks (sites × sides)`)
console.log(`  picks.js      — ${Object.keys(PICKS).length} maps × 2 sides`)
console.log(`  meta.json     — weapons tier list (S/A/B/C)`)
console.log(`  index.js      — gameMeta + bundled exports`)
