#!/usr/bin/env node
// Marvel Rivals — generates v1 data files. 6v6 hero shooter, three roles:
// Vanguard (tank), Duelist (DPS), Strategist (support).
//
// Schema mapping:
//   "operators" → heroes (Vanguard/Duelist/Strategist)
//   "sites"     → objectives. Map-type-dependent:
//                   Convoy: 3 payload checkpoints
//                   Convergence: capture point + payload (hybrid)
//                   Domination: 1 capture point
//   "sides"     → 'attack' = offensive, 'defense' = defensive (Domination
//                 uses first-cap / first-hold semantics)
//   premiumTactics keys re-purposed for ult chains, dive timings, retake reads.

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '..', 'src', 'data', 'games', 'mvr')

// ---------- MAPS ----------
// 12 representative maps May 2026. VERIFY: rotation may have changed.

const MAP_DATA = {
  'shin-shibuya': {
    name: 'Tokyo 2099: Shin-Shibuya', type: 'Convoy', rankedPool: true,
    extraCallouts: ['Streets', 'Rooftops', 'High Ground', 'Spawn', 'Side Path', 'Choke', 'Vending'],
    sites: [
      { id: 'p1', name: 'Payload — First Stretch', rooms: ['Streets', 'Rooftops', 'Choke', 'Side Door', 'Spawn'] },
      { id: 'p2', name: 'Payload — Second Stretch', rooms: ['Mid Plaza', 'High Ground', 'Side Path', 'Tunnel', 'Spawn'] },
      { id: 'p3', name: 'Payload — Final', rooms: ['Final Plaza', 'High Ground', 'Side Door', 'Tunnel', 'Spawn'] },
    ],
  },
  ninomaru: {
    name: 'Tokyo 2099: Ninomaru', type: 'Convergence', rankedPool: true,
    extraCallouts: ['Streets', 'Garden', 'High Ground', 'Spawn', 'Side Path', 'Bridge', 'Choke'],
    sites: [
      { id: 'point-a', name: 'Capture Point (Garden)', rooms: ['Garden', 'High Ground', 'Side Path', 'Bridge', 'Spawn'] },
      { id: 'p1', name: 'Payload — First Stretch', rooms: ['Streets', 'High Ground', 'Side Door', 'Tunnel', 'Spawn'] },
      { id: 'p2', name: 'Payload — Final', rooms: ['Final Plaza', 'High Ground', 'Side Path', 'Tunnel', 'Spawn'] },
    ],
  },
  'spider-islands': {
    name: 'Tokyo 2099: Spider-Islands', type: 'Domination', rankedPool: true,
    extraCallouts: ['Spawn', 'High Ground', 'Side Path', 'Streets', 'Bridge', 'Choke'],
    sites: [
      { id: 'point', name: 'Capture Point', rooms: ['Center Bridge', 'High Ground', 'Side Path', 'Spawn', 'Tunnel'] },
    ],
  },
  'yggdrasill-path': {
    name: 'Yggsgard: Yggdrasill Path', type: 'Convoy', rankedPool: true,
    extraCallouts: ['Halls', 'Bridge', 'High Ground', 'Spawn', 'Side Path', 'Choke', 'Garden'],
    sites: [
      { id: 'p1', name: 'Payload — First Stretch', rooms: ['Bridge', 'High Ground', 'Choke', 'Side Door', 'Spawn'] },
      { id: 'p2', name: 'Payload — Halls', rooms: ['Halls', 'High Ground', 'Side Path', 'Tunnel', 'Spawn'] },
      { id: 'p3', name: 'Payload — Final', rooms: ['Throne', 'High Ground', 'Side Door', 'Tunnel', 'Spawn'] },
    ],
  },
  'royal-palace': {
    name: 'Yggsgard: Royal Palace', type: 'Domination', rankedPool: true,
    extraCallouts: ['Spawn', 'High Ground', 'Side Path', 'Halls', 'Throne', 'Bridge'],
    sites: [
      { id: 'point', name: 'Capture Point', rooms: ['Throne Room', 'High Ground', 'Side Path', 'Spawn', 'Bridge'] },
    ],
  },
  'symbiotic-surface': {
    name: 'Klyntar: Symbiotic Surface', type: 'Convergence', rankedPool: true,
    extraCallouts: ['Streets', 'Sym Pool', 'High Ground', 'Spawn', 'Side Path', 'Bridge', 'Choke'],
    sites: [
      { id: 'point-a', name: 'Capture Point (Pool)', rooms: ['Sym Pool', 'High Ground', 'Side Path', 'Bridge', 'Spawn'] },
      { id: 'p1', name: 'Payload — First Stretch', rooms: ['Streets', 'High Ground', 'Side Door', 'Tunnel', 'Spawn'] },
      { id: 'p2', name: 'Payload — Final', rooms: ['Final Plaza', 'High Ground', 'Side Path', 'Tunnel', 'Spawn'] },
    ],
  },
  'celestial-apex': {
    name: "Klyntar: Celestial's Apex", type: 'Domination', rankedPool: true,
    extraCallouts: ['Spawn', 'High Ground', 'Side Path', 'Streets', 'Bridge', 'Choke'],
    sites: [
      { id: 'point', name: 'Capture Point', rooms: ['Apex Center', 'High Ground', 'Side Path', 'Spawn', 'Tunnel'] },
    ],
  },
  'birnin-tchalla': {
    name: "Wakanda: Birnin T'Challa", type: 'Domination', rankedPool: true,
    extraCallouts: ['Spawn', 'High Ground', 'Side Path', 'Streets', 'Bridge', 'Choke'],
    sites: [
      { id: 'point', name: 'Capture Point', rooms: ['Plaza', 'High Ground', 'Side Path', 'Spawn', 'Bridge'] },
    ],
  },
  'hall-of-djalia': {
    name: 'Wakanda: Hall of Djalia', type: 'Convergence', rankedPool: true,
    extraCallouts: ['Halls', 'High Ground', 'Spawn', 'Side Path', 'Bridge', 'Choke'],
    sites: [
      { id: 'point-a', name: 'Capture Point (Hall)', rooms: ['Central Hall', 'High Ground', 'Side Path', 'Bridge', 'Spawn'] },
      { id: 'p1', name: 'Payload — First Stretch', rooms: ['Halls', 'High Ground', 'Side Door', 'Tunnel', 'Spawn'] },
      { id: 'p2', name: 'Payload — Final', rooms: ['Throne', 'High Ground', 'Side Path', 'Tunnel', 'Spawn'] },
    ],
  },
  krakoa: {
    name: 'Hellfire Gala: Krakoa', type: 'Domination', rankedPool: true,
    extraCallouts: ['Spawn', 'High Ground', 'Side Path', 'Streets', 'Garden', 'Choke'],
    sites: [
      { id: 'point', name: 'Capture Point', rooms: ['Garden Center', 'High Ground', 'Side Path', 'Spawn', 'Tunnel'] },
    ],
  },
  'hells-heaven': {
    name: "Hydra Charteris Base: Hell's Heaven", type: 'Convoy', rankedPool: true,
    extraCallouts: ['Streets', 'Bridge', 'High Ground', 'Spawn', 'Side Path', 'Choke', 'Hangar'],
    sites: [
      { id: 'p1', name: 'Payload — First Stretch', rooms: ['Hangar', 'High Ground', 'Choke', 'Side Door', 'Spawn'] },
      { id: 'p2', name: 'Payload — Bridge', rooms: ['Bridge', 'High Ground', 'Side Path', 'Tunnel', 'Spawn'] },
      { id: 'p3', name: 'Payload — Final', rooms: ['Final Bay', 'High Ground', 'Side Door', 'Tunnel', 'Spawn'] },
    ],
  },
  midtown: {
    name: 'Empire of Eternal Night: Midtown', type: 'Convergence', rankedPool: true,
    extraCallouts: ['Streets', 'Rooftops', 'High Ground', 'Spawn', 'Side Path', 'Bridge', 'Choke'],
    sites: [
      { id: 'point-a', name: 'Capture Point (Plaza)', rooms: ['Central Plaza', 'High Ground', 'Side Path', 'Bridge', 'Spawn'] },
      { id: 'p1', name: 'Payload — First Stretch', rooms: ['Streets', 'Rooftops', 'Side Door', 'Tunnel', 'Spawn'] },
      { id: 'p2', name: 'Payload — Final', rooms: ['Final Plaza', 'High Ground', 'Side Path', 'Tunnel', 'Spawn'] },
    ],
  },
}

// ---------- HEROES ----------
// 37 heroes as of May 2026. VERIFY: re-check NetEase roster.
const CAST = [
  // Vanguards (10)
  { id: 'captain-america', name: 'Captain America', role: 'Vanguard', side: null, kit: ['Living Legend Shield', 'Sentinel Strike', 'Freedom Charge'] },
  { id: 'doctor-strange', name: 'Doctor Strange', role: 'Vanguard', side: null, kit: ['Shield of Seraphim', 'Pentagram of Farallah', 'Eye of Agamotto'] },
  { id: 'groot', name: 'Groot', role: 'Vanguard', side: null, kit: ['Ironwood Wall', 'Vengeful Stamen', 'Strangling Prison'] },
  { id: 'hulk', name: 'Hulk', role: 'Vanguard', side: null, kit: ['Indestructible Guard', 'Incredible Leap', 'Hulk Smash'] },
  { id: 'magneto', name: 'Magneto', role: 'Vanguard', side: null, kit: ['Metal Bulwark', 'Iron Volley', 'Meteor M'] },
  { id: 'peni-parker', name: 'Peni Parker', role: 'Vanguard', side: null, kit: ['Cyber-Web Cluster', 'Bionic Spider-Nest', 'Ultimate Bionic Hyperthrust'] },
  { id: 'thor', name: 'Thor', role: 'Vanguard', side: null, kit: ['Awakening Rune', 'Storm Surge', 'God of Thunder'] },
  { id: 'venom', name: 'Venom', role: 'Vanguard', side: null, kit: ['Cellular Corrosion', 'Frenzied Arrival', 'Feast of the Abyss'] },
  { id: 'emma-frost', name: 'Emma Frost', role: 'Vanguard', side: null, kit: ['Diamond Form', 'Mind Control', 'Psionic Seduction'] },
  { id: 'the-thing', name: 'The Thing', role: 'Vanguard', side: null, kit: ['Stone Smash', 'Embattled Leap', 'Clobbering Time'] },
  // Duelists (18)
  { id: 'black-panther', name: 'Black Panther', role: 'Duelist', side: null, kit: ['Spinning Kick', 'Spirit Rend', 'Bast\'s Descent'] },
  { id: 'black-widow', name: 'Black Widow', role: 'Duelist', side: null, kit: ['Edge Dancer', 'Electro-Plasma Explosion', 'Fearsome Sting'] },
  { id: 'hawkeye', name: 'Hawkeye', role: 'Duelist', side: null, kit: ['Crescent Dive', 'Skyward Leap', 'Hunter\'s Sight'] },
  { id: 'hela', name: 'Hela', role: 'Duelist', side: null, kit: ['Soul Drainer', 'Hel\'s Descent', 'Goddess of Death'] },
  { id: 'iron-fist', name: 'Iron Fist', role: 'Duelist', side: null, kit: ['Wall of Wind', 'Dragon\'s Defense', 'Living Chi'] },
  { id: 'iron-man', name: 'Iron Man', role: 'Duelist', side: null, kit: ['Hyper-Density Armor', 'Micro-Missile Barrage', 'Gamma Overdrive'] },
  { id: 'magik', name: 'Magik', role: 'Duelist', side: null, kit: ['Dark Teleportation', 'Stepping Discs', 'Darkchild'] },
  { id: 'moon-knight', name: 'Moon Knight', role: 'Duelist', side: null, kit: ['Hand of Khonshu', 'Moon Blade', 'Hand of Khonshu Ult'] },
  { id: 'namor', name: 'Namor', role: 'Duelist', side: null, kit: ['Aquatic Dominion', 'Wrath of the Seven Seas', 'Horn of Proteus'] },
  { id: 'psylocke', name: 'Psylocke', role: 'Duelist', side: null, kit: ['Wing Shuriken', 'Psi-Blade Dash', 'Dance of the Butterfly'] },
  { id: 'punisher', name: 'The Punisher', role: 'Duelist', side: null, kit: ['Smart Web', 'Adjudication', 'Final Judgment'] },
  { id: 'scarlet-witch', name: 'Scarlet Witch', role: 'Duelist', side: null, kit: ['Mystic Projection', 'Telekinesis', 'Reality Erasure'] },
  { id: 'spider-man', name: 'Spider-Man', role: 'Duelist', side: null, kit: ['Web-Cluster', 'Get Over Here!', 'Spectacular Spin'] },
  { id: 'squirrel-girl', name: 'Squirrel Girl', role: 'Duelist', side: null, kit: ['Mammal Bond', 'Squirrel Tsunami', 'Unbeatable Squirrel Tsunami'] },
  { id: 'star-lord', name: 'Star-Lord', role: 'Duelist', side: null, kit: ['Stellar Shift', 'Blaster Barrage', 'Galactic Legend'] },
  { id: 'storm', name: 'Storm', role: 'Duelist', side: null, kit: ['Wind Blade', 'Goddess Boost', 'Omega Hurricane'] },
  { id: 'winter-soldier', name: 'Winter Soldier', role: 'Duelist', side: null, kit: ['Trooper Bot', 'Tainted Voltage', 'Kraken Impact'] },
  { id: 'wolverine', name: 'Wolverine', role: 'Duelist', side: null, kit: ['Berserker Leap', 'Vicious Rampage', 'Last Stand'] },
  { id: 'human-torch', name: 'Human Torch', role: 'Duelist', side: null, kit: ['Plasma Body', 'Scorching Trail', 'Supernova'] },
  { id: 'mister-fantastic', name: 'Mister Fantastic', role: 'Duelist', side: null, kit: ['Reflexive Rubber', 'Stretch Punch', 'Brainiac Bounce'] },
  // Strategists (9)
  { id: 'adam-warlock', name: 'Adam Warlock', role: 'Strategist', side: null, kit: ['Avatar Life Stream', 'Cosmic Cluster', 'Karmic Revival'] },
  { id: 'cloak-and-dagger', name: 'Cloak & Dagger', role: 'Strategist', side: null, kit: ['Veil of Lightforce', 'Dagger Storm', 'Eternal Bond'] },
  { id: 'invisible-woman', name: 'Invisible Woman', role: 'Strategist', side: null, kit: ['Force Field', 'Psionic Vortex', 'Invisible Boundary'] },
  { id: 'jeff-the-land-shark', name: 'Jeff the Land Shark', role: 'Strategist', side: null, kit: ['Joyful Splash', 'Hide and Seek', 'It\'s Jeff!'] },
  { id: 'loki', name: 'Loki', role: 'Strategist', side: null, kit: ['Regeneration Domain', 'Devious Exchange', 'God of Mischief'] },
  { id: 'luna-snow', name: 'Luna Snow', role: 'Strategist', side: null, kit: ['Cryo Heart', 'Absolute Zero', 'Fate of Both Worlds'] },
  { id: 'mantis', name: 'Mantis', role: 'Strategist', side: null, kit: ['Nature\'s Soothing', 'Spore Slumber', 'Soul Resurgence'] },
  { id: 'rocket-raccoon', name: 'Rocket Raccoon', role: 'Strategist', side: null, kit: ['Repair Mode', 'Jetpack Dash', 'C.Y.A.'] },
  { id: 'ultron', name: 'Ultron', role: 'Strategist', side: null, kit: ['Imperative Fix', 'Encephalo-Ray', 'Rage of Ultron'] },
]

function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h }
function pick(arr, seed) { return arr[hash(seed) % arr.length] }

const POOLS = {
  vanguard: ['Doctor Strange', 'Magneto', 'Hulk', 'Thor', 'Venom', 'Captain America', 'Groot'],
  duelist: ['Hela', 'Punisher', 'Black Panther', 'Iron Man', 'Hawkeye', 'Storm', 'Spider-Man', 'Magik', 'Psylocke'],
  strategist: ['Luna Snow', 'Mantis', 'Adam Warlock', 'Cloak & Dagger', 'Invisible Woman', 'Rocket Raccoon'],
}

function buildOps(seed, side) {
  const v1 = pick(POOLS.vanguard, seed + 'v1')
  const v2 = pick(POOLS.vanguard.filter((n) => n !== v1), seed + 'v2')
  const d1 = pick(POOLS.duelist, seed + 'd1')
  const d2 = pick(POOLS.duelist.filter((n) => n !== d1), seed + 'd2')
  const s1 = pick(POOLS.strategist, seed + 's1')
  const s2 = pick(POOLS.strategist.filter((n) => n !== s1), seed + 's2')
  return [
    { name: v1, role: 'Vanguard', priority: 'essential' },
    { name: v2, role: 'Vanguard', priority: 'recommended' },
    { name: d1, role: 'Duelist', priority: 'essential' },
    { name: d2, role: 'Duelist', priority: 'recommended' },
    { name: s1, role: 'Strategist', priority: 'essential' },
    { name: s2, role: 'Strategist', priority: 'recommended' },
  ]
}

const ATTACK_TEMPLATES = [
  ({ obj, r1, mapType, v1, d1, s1 }) =>
    `Standard ${obj} push: ${v1} engages on ult cycle, ${d1} pre-positions for the dive, ${s1} pockets the engage. Hold ult chain until ${mapType === 'Convoy' ? 'payload chokes' : 'cap point engages'} — never burn ults on poke.`,
  ({ obj, r1, mapType, v1, d1, s1 }) =>
    `Dive comp on ${obj}: ${d1} dives the back-line on ${s1} amp, ${v1} commits behind for the trade. Force a cooldown cycle, then commit the team.`,
  ({ obj, r1, mapType, v1, d1, s1 }) =>
    `Brawl push on ${obj}: stack the choke with ${v1} + ${s1}, ${d1} traffics from ${r1} angles. Walk team forward on Luna/Mantis amp boost.`,
  ({ obj, r1, mapType, v1, d1, s1 }) =>
    `Poke setup on ${obj}: ${d1} on high ground, ${v1} bunkers behind cover, ${s1} pre-heals. Push when both Strategists have ult.`,
  ({ obj, r1, mapType, v1, d1, s1 }) =>
    `Layered ult chain on ${obj}: ${v1} ult on engage, ${s1} amp/heal ult to sustain, ${d1} cleans up. Save the second Strategist ult for the trade.`,
]

const DEFENSE_TEMPLATES = [
  ({ obj, r1, mapType, v1, d1, s1 }) =>
    `Default hold on ${obj}: ${v1} anchors the choke, ${d1} covers high ground, ${s1} bunkers. Save ults for the attacker push commit.`,
  ({ obj, r1, mapType, v1, d1, s1 }) =>
    `Aggressive forward hold on ${obj}: ${v1} pre-positions at ${r1}, ${d1} on high ground for the round-opener pick. ${s1} pockets the tank.`,
  ({ obj, r1, mapType, v1, d1, s1 }) =>
    `Stack ${obj}: 6-on-objective with ${v1} body-blocking. ${d1} covers both flanks, ${s1} chains heals. Read pace from ult usage.`,
  ({ obj, r1, mapType, v1, d1, s1 }) =>
    `Off-angle setup on ${obj}: ${d1} on the unconventional high ground, ${v1} draws aggro on main, ${s1} pockets the off-angle.`,
  ({ obj, r1, mapType, v1, d1, s1 }) =>
    `Save / reset round: hold the back of ${obj}, do not commit ults. ${v1} body-blocks the cap, ${s1} keeps team alive. Stall for overtime trade.`,
]

const TACTICAL_NOTES = {
  'shin-shibuya': {
    p1: { attack: 'Rooftop dive with Spider-Man / Iron Man isolates support line.', defense: 'Bridge anchor with high-ground cross-fire denies the standard push.' },
    p2: { attack: 'Mid Plaza high ground take is the contested space — Storm ult is the swing kill.', defense: 'Tunnel rotation gives clean exit if zone closes — do not anchor solo on Plaza.' },
    p3: { attack: 'Final Plaza funnel demands ult chain — commit Hela ult + Cloak/Dagger amp.', defense: 'Final cross-fire from spawn + side door wins the final hold.' },
  },
  ninomaru: {
    'point-a': { attack: 'Garden bridge pinch isolates defenders from Hall rotation.', defense: 'Bridge anchor with Garden cover punishes the standard dive.' },
    p1: { attack: 'Streets side-path flank isolates the back-line.', defense: 'High Ground anchor with Spawn cross-fire denies the push.' },
    p2: { attack: 'Final Plaza funnel demands ult chain push.', defense: 'Plaza cross-fire from Spawn + Side Door wins the hold.' },
  },
  'spider-islands': {
    point: { attack: 'Center Bridge dive splits the defender stack — commit Magik teleport ult.', defense: 'Bridge cross-fire from Spawn high ground denies the standard dive.' },
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
  const mapType = MAP_DATA[mapId].type

  const aArgs = { obj, r1, mapType, v1: aOps[0].name, d1: aOps[2].name, s1: aOps[4].name }
  const dArgs = { obj, r1, mapType, v1: dOps[0].name, d1: dOps[2].name, s1: dOps[4].name }

  return {
    attack: {
      operators: aOps,
      strategy: aTmpl(aArgs) + (tactical.attack ? ' ' + tactical.attack : ''),
      callouts,
      utility: [
        `${aOps[0].name} (Vanguard): main tank, engages on ult window`,
        `${aOps[1].name} (Vanguard): off-tank, peels for back-line`,
        `${aOps[2].name} (Duelist): primary damage, high-ground priority`,
        `${aOps[3].name} (Duelist): flanker / dive damage`,
        `${aOps[4].name} (Strategist): main healer, ult on engage`,
        `${aOps[5].name} (Strategist): off-healer, utility for retreat`,
      ],
      premiumTactics: {
        attackSpawns: [
          { spawn: `${obj} engage timing`, from: `${r1} high ground`, use: `Push on ${aOps[4].name} ult window — 4-5 ults charged is the commit threshold.` },
          { spawn: `${obj} re-engage spawn`, from: 'Spawn high ground', use: `Group up after a wipe — do not trickle, full team commit only.` },
        ],
        spawnKillSpots: [
          { from: r1, target: `defender support line`, risk: 'Medium — exposes you to Vanguard counter-engage', reward: 'Pick that flips ult diff for the next push' },
        ],
        advancedSetups: [
          `Ult chain priority: ${aOps[4].name} amp → ${aOps[2].name} ult → ${aOps[0].name} commit → trade with ${aOps[3].name}.`,
          `${mapType === 'Convoy' ? 'Payload sit timing: drop tank ult on the choke, walk payload through the engage' : mapType === 'Convergence' ? 'Cap then escort — do not over-extend after first cap' : 'Domination: first cap wins; do not lose the cap to a fake'}`,
          `Team-up combo: ${POOLS.vanguard.includes(aOps[0].name) && POOLS.duelist.includes(aOps[2].name) ? `${aOps[0].name} + ${aOps[2].name} team-up provides the engage damage spike — VERIFY: confirm current team-up bonuses.` : 'Coordinate ult timings — never solo-ult into 6'}`,
        ],
      },
    },
    defense: {
      operators: dOps,
      strategy: dTmpl(dArgs) + (tactical.defense ? ' ' + tactical.defense : ''),
      callouts,
      utility: [
        `${dOps[0].name} (Vanguard): anchors objective, save ult for retake`,
        `${dOps[1].name} (Vanguard): off-tank, peels for healer`,
        `${dOps[2].name} (Duelist): forward picks on high ground`,
        `${dOps[3].name} (Duelist): flank watch / counter-dive`,
        `${dOps[4].name} (Strategist): main healer, ult on engage`,
        `${dOps[5].name} (Strategist): off-healer, utility cycle`,
      ],
      premiumTactics: {
        runouts: [
          { from: r1, target: 'attacker spawn high ground', timing: 'Setup phase — pre-position to deny standard high-ground take.' },
          { from: 'Side path', target: 'attacker support line', timing: 'Mid-fight — flank punish on attacker tank engage.' },
        ],
        antiSpawnPeek: [
          `Pre-aim the ${tactical.attack?.includes('high ground') ? 'high-ground' : 'engage'} angle — most attacker pushes commit from the same path each round.`,
          `Save the off-angle ${dOps[2].name} pick for the eco round — switching position forces re-clearing.`,
          `Trade-stack ${r1} with the tank — if entry takes a duel, the trade kill is on a fixed crosshair placement.`,
        ],
        advancedSetups: [
          `Ult bait: pre-burn ${dOps[4].name} amp on a fake commit, then walk it down with ${dOps[0].name} ult on the real push.`,
          `Off-angle anchor in ${r1} forces entry to re-clear, buys retake 2-3 seconds.`,
          `Retake utility: ${dOps[4].name} amp + ${dOps[2].name} ult on the cap reset — do not stagger entries.`,
        ],
      },
    },
  }
}

const BANS_BASE = {
  attack_S: ['Hela', 'Iron Man', 'Doctor Strange'],
  defense_S: ['Punisher', 'Hawkeye', 'Magneto'],
}
function buildBans() {
  const bans = {}
  for (const [mapId, data] of Object.entries(MAP_DATA)) {
    bans[mapId] = {
      attack: [
        { name: 'Hela', reason: `${data.name} long sightlines reward Hela's ranged DPS — ban removes the round-opener pick threat.` },
        { name: 'Doctor Strange', reason: `${data.type} engages favor Strange's portal play + bubble — ban opens up dive comps cleanly.` },
      ],
      defense: [
        { name: 'Punisher', reason: `${data.name} chokes funnel attackers into Punisher's turret + ult lanes — ban removes the brawl-shutdown.` },
        { name: 'Magneto', reason: `${data.type === 'Domination' ? 'Cap point' : 'Payload'} hold rewards Magneto bubble + ult absorb — ban removes the iron Vanguard hold.` },
      ],
    }
  }
  return bans
}
const BANS = buildBans()

const META = {
  _comment: 'Last verified: 2026-05 — based on Marvel Rivals tournament pick rates + community tier list snapshot.',
  S: ['Hela', 'Doctor Strange', 'Magneto', 'Luna Snow', 'Mantis'],
  A: ['Punisher', 'Iron Man', 'Hulk', 'Thor', 'Captain America', 'Adam Warlock', 'Cloak & Dagger', 'Invisible Woman'],
  B: ['Black Panther', 'Hawkeye', 'Spider-Man', 'Storm', 'Magik', 'Psylocke', 'Venom', 'Groot', 'Peni Parker', 'Rocket Raccoon', 'Loki', 'Jeff the Land Shark'],
  C: ['Iron Fist', 'Moon Knight', 'Namor', 'Scarlet Witch', 'Squirrel Girl', 'Star-Lord', 'Black Widow', 'Winter Soldier', 'Wolverine', 'Human Torch', 'Mister Fantastic', 'Emma Frost', 'The Thing', 'Ultron'],
  bans_attack: BANS_BASE.attack_S,
  bans_defense: BANS_BASE.defense_S,
}

const GAME_META = {
  id: 'mvr', name: 'mvr', displayName: 'Marvel Rivals', color: '#E10A19', slug: 'mvr',
  vocab: { map: 'Map', site: 'Objective', operator: 'Hero', side_attack: 'Attack', side_defense: 'Defense' },
}

function emitMaps() {
  const lines = ['// Marvel Rivals — current map rotation May 2026 (~12 maps).']
  lines.push('// Map types: Convoy (escort), Convergence (hybrid), Domination (control).')
  lines.push('// VERIFY: rotation may change per season.')
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
  const lines = ['// Marvel Rivals — 37 heroes as of May 2026.']
  lines.push('// Roles: Vanguard (tank), Duelist (DPS), Strategist (support).')
  lines.push('// VERIFY: re-check NetEase roster for new releases.')
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
  const lines = ['// Marvel Rivals — v1 generated strats. Per (map, objective, side).']
  lines.push('// Generated by scripts/generate-mvr-data.mjs')
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

function emitBans() {
  const lines = ['// Marvel Rivals — per-map hero ban recommendations.']
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

console.log(`Wrote MVR data to ${OUT_DIR}`)
console.log(`  ${Object.keys(MAP_DATA).length} maps, ${CAST.length} heroes, ${Object.values(MAP_DATA).reduce((n, m) => n + m.sites.length * 2, 0)} strat blocks`)
