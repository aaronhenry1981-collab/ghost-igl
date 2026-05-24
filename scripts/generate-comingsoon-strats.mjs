#!/usr/bin/env node
// Generates v1 strat blocks for comingSoon maps. Output is JS code suitable
// for pasting into src/data/strats.js. Idempotent — re-running with the same
// input produces the same output.
//
// Why a generator vs. hand-writing: 15 maps × 4 sites × 2 sides = 120 strat
// blocks. Templating ensures consistency (every site has the same shape) and
// lets us iterate the template once instead of 120 times.
//
// These are v1 — competent but generic. Aaron should iterate via /fill-strat
// for premium-quality strats on his most-played maps.

// Per-map metadata: sites + extra callouts available on the map.
// The generator picks 5-7 callouts from (site rooms + map callouts) per strat.
const MAP_DATA = {
  consulate: {
    name: 'Consulate',
    extraCallouts: ['Front Lobby', 'Back Stairs', 'Garage', 'Antechamber', 'Visa Office', 'Press Room'],
    sites: [
      { id: 'consul-meeting', rooms: ['Meeting Room', 'Consul Office'], floor: '2F' },
      { id: 'piano-expo', rooms: ['Piano Room', 'Exposition Room'], floor: '1F' },
      { id: 'tellers-servers', rooms: ['Tellers', 'Servers'], floor: '1F' },
      { id: 'garage-cafeteria', rooms: ['Cafeteria', 'Garage'], floor: 'B' },
    ],
  },
  lair: {
    name: 'Lair',
    extraCallouts: ['Sniper Nest', 'Garage', 'Main Stairs', 'East Entry', 'Catwalk', 'Lobby'],
    sites: [
      { id: 'master-r6', rooms: ['Master Office', 'R6 Room'], floor: '2F' },
      { id: 'bunks-briefing', rooms: ['Bunks', 'Briefing'], floor: '1F' },
      { id: 'armory-weapon', rooms: ['Armory', 'Weapon Maintenance'], floor: '1F' },
      { id: 'lab-support', rooms: ['Lab', 'Lab Support'], floor: 'B' },
    ],
  },
  nighthaven: {
    name: 'Nighthaven Labs',
    extraCallouts: ['Reception', 'Loading Bay', 'Side Stairs', 'Maintenance', 'Yellow Hall', 'Hangar'],
    sites: [
      { id: 'command-server', rooms: ['Command', 'Server'], floor: '2F' },
      { id: 'control-storage', rooms: ['Control', 'Storage'], floor: '1F' },
      { id: 'kitchen-cafeteria', rooms: ['Kitchen', 'Cafeteria'], floor: '1F' },
      { id: 'tank-assembly', rooms: ['Tank', 'Assembly'], floor: 'B' },
    ],
  },
  'emerald-plains': {
    name: 'Emerald Plains',
    extraCallouts: ['Foyer', 'Main Stairs', 'Library', 'Wine Stairs', 'Patio', 'East Entry'],
    sites: [
      { id: 'admin-ceo', rooms: ['Administration', 'CEO Office'], floor: '2F' },
      { id: 'gallery-meeting', rooms: ['Private Gallery', 'Meeting'], floor: '2F' },
      { id: 'bar-lounge', rooms: ['Bar', 'Lounge'], floor: '1F' },
      { id: 'kitchen-dining', rooms: ['Kitchen', 'Dining'], floor: '1F' },
    ],
  },
  oregon: {
    name: 'Oregon',
    extraCallouts: ['Tower', 'Construction', 'Big Tower', 'Showers', 'Garage', 'Pixel Stairs'],
    sites: [
      { id: 'kids-dorms', rooms: ['Kids Dorms', 'Dorms Main Hall'], floor: '2F' },
      { id: 'meeting-hall', rooms: ['Meeting Hall', 'Kitchen'], floor: '1F' },
      { id: 'kitchen-dining', rooms: ['Kitchen', 'Dining Hall'], floor: '1F' },
      { id: 'laundry', rooms: ['Laundry', 'Supply Room'], floor: 'B' },
    ],
  },
  outback: {
    name: 'Outback',
    extraCallouts: ['Reception', 'Bushranger', 'Convenience Store', 'Compressor Room', 'Servo Stairs', 'Pool'],
    sites: [
      { id: 'laundry-piano', rooms: ['Laundry', 'Piano Room'], floor: '2F' },
      { id: 'party-office', rooms: ['Party Room', 'Office'], floor: '2F' },
      { id: 'bedrooms', rooms: ['Green Bedroom', 'Red Bedroom'], floor: '1F' },
      { id: 'mechanic-kitchen', rooms: ['Mechanic Shop', 'Kitchen'], floor: '1F' },
    ],
  },
  kanal: {
    name: 'Kanal',
    extraCallouts: ['Lighthouse', 'Quay', 'Bridge', 'Boat Dock', 'Main Stairs', 'East Walkway'],
    sites: [
      { id: 'server-radio', rooms: ['Server Room', 'Radar Room'], floor: '2F' },
      { id: 'kitchen-coast', rooms: ['Security Room', 'Map Room'], floor: '1F' },
      { id: 'construction-control', rooms: ['Coast Guard Meeting', 'Lounge'], floor: '1F' },
      { id: 'engine-supply', rooms: ['Kayaks', 'Supply Room'], floor: 'B' },
    ],
  },
  fortress: {
    name: 'Fortress',
    extraCallouts: ['Courtyard', 'Watchtower', 'Main Stairs', 'East Wing', 'Mosque', 'Tea Room'],
    sites: [
      { id: 'commander-briefing', rooms: ['Bedroom', 'Commander Office'], floor: '2F' },
      { id: 'kitchen-dining', rooms: ['Dormitory', 'Briefing Room'], floor: '2F' },
      { id: 'council-guard', rooms: ['Kitchen', 'Cafeteria'], floor: '1F' },
      { id: 'tower-rooftop', rooms: ['Hammam', 'Sitting Room'], floor: '1F' },
    ],
  },
  hereford: {
    name: 'Hereford Base',
    extraCallouts: ['Garden', 'East Stairs', 'Main Entry', 'Catwalk', 'Helipad', 'Front Lawn'],
    sites: [
      { id: 'dorms-office', rooms: ['Master Bedroom', 'Kids Room'], floor: '2F' },
      { id: 'kitchen-dining', rooms: ['Kitchen', 'Dining Room'], floor: '1F' },
      { id: 'briefing-stairs', rooms: ['Ammo Storage', 'Tractor Storage'], floor: '3F' },
      { id: 'wine-cellar', rooms: ['Fermentation Chamber', 'Brewery'], floor: 'B' },
    ],
  },
  house: {
    name: 'House',
    extraCallouts: ['Front Yard', 'Driveway', 'Foyer', 'Backyard', 'Side Entry', 'Trampoline'],
    sites: [
      { id: 'master-closet', rooms: ['Master Bedroom', 'Closet'], floor: '2F' },
      { id: 'kitchen-living', rooms: ['Kitchen', 'Living Room'], floor: '1F' },
      { id: 'garage-workshop', rooms: ['Garage', 'Workshop'], floor: '1F' },
      { id: 'boiler-laundry', rooms: ['Boiler', 'Laundry'], floor: 'B' },
    ],
  },
  plane: {
    name: 'Presidential Plane',
    extraCallouts: ['Tarmac', 'Front Stairs', 'Aft Stairs', 'Galley', 'Aft Lounge', 'Restroom'],
    sites: [
      { id: 'meeting-office', rooms: ['Meeting Room', 'Office'], floor: '2F' },
      { id: 'security-cargo', rooms: ['Security Room', 'Cargo Hold'], floor: '1F' },
      { id: 'kitchen-stateroom', rooms: ['Kitchen', 'Stateroom'], floor: '1F' },
      { id: 'work-lobby', rooms: ['Work Room', 'Lobby'], floor: '1F' },
    ],
  },
  'stadium-bravo': {
    name: 'Stadium Bravo',
    extraCallouts: ['Field', 'Locker Room', 'Tunnel', 'Main Stairs', 'Press Box', 'Concourse'],
    sites: [
      { id: 'medic-executive', rooms: ['Office', 'Target Room'], floor: '2F' },
      { id: 'locker-dispensary', rooms: ['Kids Dormitory', 'Dormitory'], floor: '2F' },
      { id: 'garage-press', rooms: ['Piano Room', 'Living Room'], floor: '1F' },
      { id: 'nats-oregon', rooms: ['Piano Room', 'Kitchen'], floor: '1F' },
    ],
  },
  tower: {
    name: 'Tower',
    extraCallouts: ['Helipad', 'East Stairs', 'Lobby', 'Roof Access', 'Main Hall', 'Restaurant Stairs'],
    sites: [
      { id: 'bar-lounge', rooms: ['Gift Shop', 'Lantern Room'], floor: '2F' },
      { id: 'ventilation-seating', rooms: ['Tea Room', 'Bar'], floor: '1F' },
      { id: 'tea-exhibition', rooms: ['Restaurant', 'Bird Room'], floor: '1F' },
      { id: 'ballroom-bedroom', rooms: ['Exhibit Room', 'Media Center'], floor: '2F' },
    ],
  },
  yacht: {
    name: 'Yacht',
    extraCallouts: ['Helipad', 'Sun Deck', 'Bow', 'Stern', 'East Stairs', 'Crew Stairs'],
    sites: [
      { id: 'navigation-cafeteria', rooms: ['Cockpit', 'Maps Room'], floor: '4F' },
      { id: 'casino-bar', rooms: ['Cafeteria', 'Staff Dormitory'], floor: '2F' },
      { id: 'kitchen-engine', rooms: ['Engine Control', 'Kitchen'], floor: '2F' },
      { id: 'submarine-stern', rooms: ['Server Room', 'Engine Storage'], floor: '1F' },
    ],
  },
  favela: {
    name: 'Favela',
    extraCallouts: ['Street', 'Alley', 'Roof Access', 'Side Stairs', 'Patio', 'Back Lot'],
    sites: [
      { id: 'bedroom-autoshop', rooms: ['Meth Lab', 'Packaging Room'], floor: '3F' },
      { id: 'kitchen-meeting', rooms: ['Football Office', 'Football Bedroom'], floor: '2F' },
      { id: 'market-party', rooms: ["Biker's Apartment", "Biker's Bedroom"], floor: '1F' },
      { id: 'aunts-footsie', rooms: ["Aunt's Bedroom", "Aunt's Apartment"], floor: '2F' },
    ],
  },
  // ===== Hand-written maps — premium-tactics-only generation =====
  // These maps have hand-curated strat blocks in strats.js. We only generate
  // premiumTactics blocks for them via the --premium-only flag, then inject
  // them via src/data/premium-tactics.js (loaded + merged at module load).
  bank: {
    name: 'Bank',
    extraCallouts: ['Front Lobby', 'Back Alley', 'Garage', 'Vault Stairs', 'White Stairs', 'East Stairs'],
    sites: [
      { id: 'ceo', rooms: ['CEO Office', 'Executive Lounge'], floor: '2F' },
      { id: 'open-area', rooms: ['Open Area', 'Staff Room'], floor: '1F' },
      { id: 'tellers', rooms: ["Teller's Office", 'Archives'], floor: '1F' },
      { id: 'basement', rooms: ['Lockers', 'CCTV Room'], floor: 'B' },
    ],
  },
  clubhouse: {
    name: 'Clubhouse',
    extraCallouts: ['Construction', 'Garage', 'Strip Club', 'Front Yard', 'East Stairs', 'Cash Hall'],
    sites: [
      { id: 'cash-cctv', rooms: ['Cash Room', 'CCTV Room'], floor: '2F' },
      { id: 'bar-stock', rooms: ['Bar', 'Stock Room'], floor: '1F' },
      { id: 'church', rooms: ['Church', 'Arsenal'], floor: 'B' },
      { id: 'gym-bedroom', rooms: ['Gym', 'Bedroom'], floor: '2F' },
    ],
  },
  coastline: {
    name: 'Coastline',
    extraCallouts: ['Pool', 'VIP Stairs', 'Main Lobby', 'Aquarium', 'Bathroom Hall', 'Sunrise Stairs'],
    sites: [
      { id: 'hookah-billiards', rooms: ['Hookah Lounge', 'Billiards Room'], floor: '2F' },
      { id: 'theater-penthouse', rooms: ['Theater', 'Penthouse'], floor: '2F' },
      { id: 'kitchen-service', rooms: ['Kitchen', 'Service Entrance'], floor: '1F' },
      { id: 'blue-bar', rooms: ['Blue Bar', 'Sunrise Bar'], floor: '1F' },
    ],
  },
  kafe: {
    name: 'Kafe Dostoyevsky',
    extraCallouts: ['Cigar Balcony', 'White Stairs', 'Red Stairs', 'Freezer', 'Christmas Hall', 'Pillar'],
    sites: [
      { id: 'bar-cocktail', rooms: ['Bar', 'Cocktail Lounge'], floor: '3F' },
      { id: 'reading-fireplace', rooms: ['Reading Room', 'Fireplace Hall'], floor: '2F' },
      { id: 'mining-train', rooms: ['Mining Room', 'Fireplace Hall'], floor: '2F' },
      { id: 'kitchen-bakery', rooms: ['Kitchen Service', 'Kitchen Cooking'], floor: '1F' },
    ],
  },
  chalet: {
    name: 'Chalet',
    extraCallouts: ['Campfire', 'Main Entrance', 'Connector', 'Wine Cellar Stairs', 'Garage', 'Patio'],
    sites: [
      { id: 'master-office', rooms: ['Master Bedroom', 'Office'], floor: '2F' },
      { id: 'bar-gaming', rooms: ['Bar', 'Gaming Room'], floor: '1F' },
      { id: 'kitchen-trophy', rooms: ['Kitchen', 'Dining Room'], floor: '1F' },
      { id: 'wine-snowmobile', rooms: ['Wine Cellar', 'Snowmobile Garage'], floor: 'B' },
    ],
  },
  border: {
    name: 'Border',
    extraCallouts: ['East Balcony', 'Main Stairs', 'Offices', 'Fountain', 'Detention', 'Spawn'],
    sites: [
      { id: 'armory-archives', rooms: ['Armory Lockers', 'Archives'], floor: '2F' },
      { id: 'workshop-ventilation', rooms: ['Workshop', 'Ventilation Room'], floor: '1F' },
      { id: 'customs-supply', rooms: ['Customs Inspection', 'Supply Room'], floor: '1F' },
      { id: 'bathroom-tellers', rooms: ['Bathroom', 'Tellers'], floor: '1F' },
    ],
  },
  skyscraper: {
    name: 'Skyscraper',
    extraCallouts: ['Garden', 'Helipad', 'Cherry Blossom', 'Side Entry', 'Main Stairs', 'Geisha'],
    sites: [
      { id: 'tea-room', rooms: ['Tea Room', 'Karaoke'], floor: '2F' },
      { id: 'work-office', rooms: ['Work Office', 'Exhibition'], floor: '2F' },
      { id: 'kitchen', rooms: ['Kitchen', 'BBQ'], floor: '1F' },
      { id: 'bedroom', rooms: ['Bedroom', 'Bathroom'], floor: '1F' },
    ],
  },
  'theme-park': {
    name: 'Theme Park',
    extraCallouts: ['Connector', 'Back Stairs', 'Dragon Stairs', 'Haunted Balcony', 'Yellow Corridor', 'Maintenance'],
    sites: [
      { id: 'throne-room', rooms: ['Throne Room', 'Armory'], floor: '1F' },
      { id: 'lab', rooms: ['Lab', 'Storage'], floor: '1F' },
      { id: 'office', rooms: ['Office', 'Initiation'], floor: '2F' },
      { id: 'bunk', rooms: ['Bunk', 'Day Care'], floor: '2F' },
    ],
  },
  villa: {
    name: 'Villa',
    extraCallouts: ['Main Hall', 'Garden', 'Fireplace', 'Piano', 'Wine Stairs', 'East Stairs'],
    sites: [
      { id: 'aviator-games', rooms: ['Aviator Room', 'Games Room'], floor: '2F' },
      { id: 'trophy-statuary', rooms: ['Trophy Room', 'Statuary Room'], floor: '2F' },
      { id: 'kitchen-dining', rooms: ['Kitchen', 'Dining Room'], floor: '1F' },
      { id: 'living-library', rooms: ['Living Room', 'Library'], floor: '1F' },
    ],
  },
}

// ROLE-BASED OPERATOR POOLS — picks vary by site geometry.
// These cover the current Y10/Y11 meta. Aaron can iterate via /fill-strat.

const ATTACK_OPS = {
  hardBreach: ['Thermite', 'Hibana', 'Ace', 'Maverick'],
  support: ['Thatcher', 'Twitch', 'Kali', 'Flores'],
  vertical: ['Buck', 'Sledge', 'Zofia'],
  entry: ['Ash', 'Iana', 'Ying', 'Zero'],
  flex: ['Nomad', 'Lion', 'Capitao', 'Glaz', 'Finka', 'Fuze'],
}

const DEFENSE_OPS = {
  antiBreach: ['Bandit', 'Kaid', 'Mute'],
  intel: ['Mira', 'Maestro', 'Valkyrie', 'Echo'],
  utilityDenial: ['Jager', 'Wamai', 'Aruni'],
  roam: ['Vigil', 'Caveira', 'Ela', 'Alibi', 'Pulse'],
  flex: ['Smoke', 'Goyo', 'Lesion', 'Azami', 'Mozzie', 'Doc', 'Thunderbird'],
}

// Stable picker — same map+site always picks the same operators (deterministic).
function pick(arr, seed) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return arr[h % arr.length]
}

function buildAttackOps(siteSeed) {
  return [
    { name: pick(ATTACK_OPS.hardBreach, siteSeed + 'hb'), role: 'Hard Breach', priority: 'essential' },
    { name: pick(ATTACK_OPS.support, siteSeed + 'sp'), role: 'Support', priority: 'essential' },
    { name: pick(ATTACK_OPS.vertical, siteSeed + 'vt'), role: 'Vertical Play', priority: 'recommended' },
    { name: pick(ATTACK_OPS.entry, siteSeed + 'en'), role: 'Entry Frag', priority: 'recommended' },
    { name: pick(ATTACK_OPS.flex, siteSeed + 'fx'), role: 'Flex / Intel', priority: 'flex' },
  ]
}

function buildDefenseOps(siteSeed) {
  return [
    { name: pick(DEFENSE_OPS.antiBreach, siteSeed + 'ab'), role: 'Anti-Breach', priority: 'essential' },
    { name: pick(DEFENSE_OPS.intel, siteSeed + 'in'), role: 'Intel', priority: 'essential' },
    { name: pick(DEFENSE_OPS.utilityDenial, siteSeed + 'ud'), role: 'Utility Denial', priority: 'recommended' },
    { name: pick(DEFENSE_OPS.roam, siteSeed + 'rm'), role: 'Roam', priority: 'recommended' },
    { name: pick(DEFENSE_OPS.flex, siteSeed + 'fl'), role: 'Flex / Sustain', priority: 'flex' },
  ]
}

function buildCallouts(rooms, extra, count = 6) {
  const all = [...rooms, ...extra]
  return all.slice(0, count)
}

// 5 attack opener variants — picked deterministically per site so tone varies
// across the catalog instead of every page reading identically.
const ATTACK_TEMPLATES = [
  ({ breach, support, vertical, entry, flex, r1, r2, verticalNote, tacticalNote }) =>
    `${breach} opens the ${r1} reinforced wall while ${support} clears anti-breach electronics. ${verticalNote}. ${entry} drones the site and entries through the breach once utility is gone. ${flex} watches flanks and trades on the execute.${tacticalNote ? ' ' + tacticalNote : ''}`,
  ({ breach, support, vertical, entry, flex, r1, r2, verticalNote, tacticalNote }) =>
    `Open with ${support} clearing electronics, then ${breach} hits the ${r1} wall on call. ${verticalNote}. ${entry} pushes through the breach with ${flex} covering rotations.${tacticalNote ? ' ' + tacticalNote : ''} Patient drone-up is mandatory — do not dry-push ${r1}.`,
  ({ breach, support, vertical, entry, flex, r1, r2, verticalNote, tacticalNote }) =>
    `Map control first: ${flex} and ${entry} clear ${r2} side while ${vertical} sets up vertical pressure. ${verticalNote}. Once site is droned and roamers are pressured, ${support} clears the wall and ${breach} opens.${tacticalNote ? ' ' + tacticalNote : ''}`,
  ({ breach, support, vertical, entry, flex, r1, r2, verticalNote, tacticalNote }) =>
    `${vertical} sets the tempo — ${verticalNote}. ${support} clears anti-breach and ${breach} opens ${r1} on a coordinated count. ${entry} entries first; ${flex} holds the back-side angles.${tacticalNote ? ' ' + tacticalNote : ''}`,
  ({ breach, support, vertical, entry, flex, r1, r2, verticalNote, tacticalNote }) =>
    `Layered execute: ${flex} flashes from main, ${entry} pushes ${r2} for the trade, ${breach} and ${support} hit ${r1} simultaneously. ${verticalNote}.${tacticalNote ? ' ' + tacticalNote : ''} Plant goes down with ${entry} covering, ${vertical} watching above.`,
]

// 5 defense opener variants — same idea, picked deterministically.
const DEFENSE_TEMPLATES = [
  ({ antiBreach, intel, utilDenial, roam, flex, r1, r2, intelNote, tacticalNote }) =>
    `${antiBreach} denies the hard-breach on ${r1} with electrified walls. ${intelNote}. ${utilDenial} ADS protect anchors from grenades. ${roam} roams to delay the push; ${flex} provides sustain or last-second plant denial.${tacticalNote ? ' ' + tacticalNote : ''}`,
  ({ antiBreach, intel, utilDenial, roam, flex, r1, r2, intelNote, tacticalNote }) =>
    `Setup is intel-first: ${intelNote}. ${antiBreach} secures the ${r1} wall, ${utilDenial} covers projectile lanes. ${roam} hunts info from 2F/1F connectors while ${flex} anchors site.${tacticalNote ? ' ' + tacticalNote : ''}`,
  ({ antiBreach, intel, utilDenial, roam, flex, r1, r2, intelNote, tacticalNote }) =>
    `${roam} forces attackers to play slow — early picks from off-site keep their utility on flank-watch. ${antiBreach} on the ${r1} wall, ${intelNote}. ${utilDenial} denies projectile spam, ${flex} sustains anchors.${tacticalNote ? ' ' + tacticalNote : ''}`,
  ({ antiBreach, intel, utilDenial, roam, flex, r1, r2, intelNote, tacticalNote }) =>
    `Hold ${r2} as the trade lane — ${flex} anchors there. ${antiBreach} denies breach on ${r1}, ${intelNote}. ${utilDenial} catches grenades; ${roam} cycles flanks to bait isolated entries.${tacticalNote ? ' ' + tacticalNote : ''}`,
  ({ antiBreach, intel, utilDenial, roam, flex, r1, r2, intelNote, tacticalNote }) =>
    `Anchored 4, roaming 1: ${flex}, ${utilDenial}, ${antiBreach}, and ${intel} hold site; ${roam} plays off-site for pick potential and timing pressure. ${intelNote}.${tacticalNote ? ' ' + tacticalNote : ''}`,
]

function buildAttackStrategy(rooms, ops, floor, mapId, siteId) {
  const [r1, r2] = rooms
  const breach = ops[0].name, support = ops[1].name, vertical = ops[2].name, entry = ops[3].name, flex = ops[4].name
  const verticalNote = floor === '2F'
    ? `${vertical} opens floors from above to deny defender anchor positions`
    : floor === '1F'
      ? `${vertical} plays vertical from 2F to pressure ${r1} anchors through the soft floor`
      : floor === 'B'
        ? `${vertical} opens 1F soft floors above ${r1} to deny basement defender setup`
        : floor === '3F' || floor === '4F'
          ? `${vertical} works the soft floors below ${r1} to control rotation paths`
          : `${vertical} opens vertical angles to pressure anchors`
  const tacticalNote = TACTICAL_NOTES[mapId]?.[siteId]?.attack || ''
  const tmpl = ATTACK_TEMPLATES[hash(mapId + siteId + 'aTone') % ATTACK_TEMPLATES.length]
  return tmpl({ breach, support, vertical, entry, flex, r1, r2, verticalNote, tacticalNote })
}

function buildDefenseStrategy(rooms, ops, mapId, siteId) {
  const [r1, r2] = rooms
  const antiBreach = ops[0].name, intel = ops[1].name, utilDenial = ops[2].name, roam = ops[3].name, flex = ops[4].name
  const intelNote = intel === 'Mira'
    ? `${intel} places a Black Mirror between ${r1} and ${r2} for sightlines on incoming pushes`
    : intel === 'Maestro'
      ? `${intel} sets Evil Eyes covering ${r1} plant spots and the main entry corridor`
      : intel === 'Valkyrie'
        ? `${intel} hides Black Eye cameras outside the site for early rotation and entry reads`
        : `${intel} covers site entries with cameras and feeds rotation calls`
  const tacticalNote = TACTICAL_NOTES[mapId]?.[siteId]?.defense || ''
  const tmpl = DEFENSE_TEMPLATES[hash(mapId + siteId + 'dTone') % DEFENSE_TEMPLATES.length]
  return tmpl({ antiBreach, intel, utilDenial, roam, flex, r1, r2, intelNote, tacticalNote })
}

function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h }

// Per-site tactical notes — short site-specific insights that elevate the
// generic strategy template into something resembling actual coaching.
// Curated per site (~60 sites). Empty = falls through to generic only.
//
// Format: { mapId: { siteId: { attack: '...', defense: '...' } } }
const TACTICAL_NOTES = {
  consulate: {
    'consul-meeting': {
      attack: 'Watch back stairs flanks — defenders rotate from Antechamber fast.',
      defense: 'Reinforce the floor between Meeting and Garage — attackers love opening it.',
    },
    'piano-expo': {
      attack: 'Press Room is a strong vertical position — Buck or Sledge can dominate from above.',
      defense: 'Mira on the Piano/Lobby wall reads the standard front-lobby setup.',
    },
    'tellers-servers': {
      attack: 'Drone Garage entry first — defenders often hold back-stairs from there.',
      defense: 'Anchor in Servers and let Tellers fall — Servers has fewer entry vectors.',
    },
    'garage-cafeteria': {
      attack: 'Open Cafeteria hatch with Sledge — vertical pressure is the cleanest exec into B.',
      defense: 'Reinforce hatches early — Garage and Cafeteria both have soft ceilings.',
    },
  },
  lair: {
    'master-r6': {
      attack: 'Catwalk is a strong vertical play position — Buck can open the Master ceiling.',
      defense: 'Hold the Sniper Nest — early intel on attacker spawn rotation pays off.',
    },
    'bunks-briefing': {
      attack: 'Sledge or Buck from 2F above Bunks denies anchor — soft floor is generous.',
      defense: 'Mute jammer on the Bunks reinforced wall blocks both Hibana and standard breach.',
    },
    'armory-weapon': {
      attack: 'Lobby control is the key — defenders rotate from East Entry through Lobby.',
      defense: 'Maestro Evil Eye in Weapon Maintenance covers both plant spots in Armory.',
    },
    'lab-support': {
      attack: 'Open hatches with Sledge from 1F — vertical from above is the cleanest B exec.',
      defense: 'Reinforce all 1F hatches — basement is exposed to vertical otherwise.',
    },
  },
  nighthaven: {
    'command-server': {
      attack: 'Yellow Hall is the standard rotation — Nomad airjab traps catch roamers.',
      defense: 'Bandit-trick the Server reinforced wall against Hibana pellet timings.',
    },
    'control-storage': {
      attack: 'Loading Bay vertical pressure shuts down Storage anchors fast.',
      defense: 'Mira between Control and Storage gives sightlines on the standard push.',
    },
    'kitchen-cafeteria': {
      attack: 'Reception is the strong main-stair angle — clear before commitment.',
      defense: 'Roam Hangar — most attacker droning starts from there.',
    },
    'tank-assembly': {
      attack: 'Side Stairs vertical drop catches defenders setting up Tank — exec early.',
      defense: 'Reinforce Maintenance hatches — main vertical threat into Tank.',
    },
  },
  'emerald-plains': {
    'admin-ceo': {
      attack: 'Library is the connector — Nomad airjab denies CEO flank from Library.',
      defense: 'Mira on the Admin/Library wall reads the most common attacker push.',
    },
    'gallery-meeting': {
      attack: 'East Entry vertical play denies the standard Gallery anchor position.',
      defense: 'Anchor Meeting and let Gallery fall — Meeting has tighter sightlines.',
    },
    'bar-lounge': {
      attack: 'Main Stairs is a death trap — clear with utility before contesting.',
      defense: 'Maestro Evil Eye watching Wine Stairs catches the standard roam push.',
    },
    'kitchen-dining': {
      attack: 'Open Foyer wall for attack-side flash setup — Dining anchors hate it.',
      defense: 'Bandit-trick the Kitchen wall — attackers will Hibana from Patio.',
    },
  },
  oregon: {
    'kids-dorms': {
      attack: 'Big Tower vertical is the standard play — Sledge above Kids Dorms wins.',
      defense: 'Reinforce Big Tower floor — vertical is the round-losing angle here.',
    },
    'meeting-hall': {
      attack: 'Construction control is the key — defenders rotate from there.',
      defense: 'Roam Construction and Showers — pick attackers as they cross to site.',
    },
    'kitchen-dining': {
      attack: 'Pixel Stairs is the fast rotation — Nomad denies it for the execute.',
      defense: 'Mira on the Dining/Meeting connector reads roam-clear timing.',
    },
    'laundry': {
      attack: 'Open the Garage hatch with Sledge — basement vertical is cleanest exec.',
      defense: 'Bandit on the Laundry exterior wall — attackers hard-breach from Garage.',
    },
  },
  outback: {
    'laundry-piano': {
      attack: 'Reception vertical pressure denies Piano anchor cleanly.',
      defense: 'Roam Bushranger — most attacker map control starts from there.',
    },
    'party-office': {
      attack: 'Compressor Room is a strong vertical — Buck opens above Office.',
      defense: 'Mira on the Office/Party wall reads the standard split push.',
    },
    'bedrooms': {
      attack: 'Convenience Store is the fast 1F rotation — pre-clear with utility.',
      defense: 'Anchor Red Bedroom — Green has too many soft walls to defend.',
    },
    'mechanic-kitchen': {
      attack: 'Servo Stairs vertical drop catches Mechanic anchors off guard.',
      defense: 'Bandit-trick the Mechanic exterior wall — common Hibana target.',
    },
  },
  kanal: {
    'server-radio': {
      attack: 'Bridge vertical pressure controls both Server and Radar simultaneously.',
      defense: 'Maestro Evil Eye in Server covers the Bridge entry attackers must clear.',
    },
    'kitchen-coast': {
      attack: 'Boat Dock is the back-flank — Nomad denies it during the execute.',
      defense: 'Mira between Security and Map Room reads the main-stair push.',
    },
    'construction-control': {
      attack: 'Quay control is mandatory — defenders rotate Coast Meeting from there.',
      defense: 'Roam East Walkway — early picks on attacker spawn-peek setups.',
    },
    'engine-supply': {
      attack: 'Open Lighthouse hatch with Sledge — basement vertical exec from there.',
      defense: 'Reinforce Kayaks ceiling — primary vertical threat into B.',
    },
  },
  fortress: {
    'commander-briefing': {
      attack: 'Watchtower vertical pressure denies Commander Office anchor.',
      defense: 'Bandit on the Commander wall — exterior breach is the usual hard-breach line.',
    },
    'kitchen-dining': {
      attack: 'East Wing rotation pinch isolates Briefing defenders from Dormitory anchor.',
      defense: 'Mira between Dormitory and Briefing reads the central push.',
    },
    'council-guard': {
      attack: 'Mosque connector is the fast rotation — pre-clear with utility before exec.',
      defense: 'Anchor Cafeteria — Kitchen has too many entry vectors.',
    },
    'tower-rooftop': {
      attack: 'Tea Room vertical is the standard play — Buck or Sledge from above.',
      defense: 'Maestro Evil Eye in Hammam covers both Sitting Room plant spots.',
    },
  },
  hereford: {
    'dorms-office': {
      attack: 'Catwalk is the strong vertical position — Sledge opens Master ceiling.',
      defense: 'Mira on the Master/Catwalk wall reads the standard 2F push.',
    },
    'kitchen-dining': {
      attack: 'East Stairs vertical pressure catches Dining anchors off guard.',
      defense: 'Bandit-trick the Kitchen exterior wall — common Thermite target.',
    },
    'briefing-stairs': {
      attack: 'Helipad approach is exposed — clear with utility before pushing 3F.',
      defense: 'Roam Helipad and Catwalk — pick attackers as they ascend to 3F.',
    },
    'wine-cellar': {
      attack: 'Open the Garden hatch with Sledge — basement vertical exec from there.',
      defense: 'Reinforce Brewery ceiling — primary vertical attacker threat.',
    },
  },
  house: {
    'master-closet': {
      attack: 'Trampoline is the strong vertical setup — Buck opens Master ceiling.',
      defense: 'Mira on the Master/Trampoline wall reads the rooftop attack.',
    },
    'kitchen-living': {
      attack: 'Foyer is the death funnel — flash and trade through it, do not dry-push.',
      defense: 'Bandit on the Living wall — common breach target for Kitchen exec.',
    },
    'garage-workshop': {
      attack: 'Driveway vertical from above denies Garage anchor cleanly.',
      defense: 'Maestro Evil Eye covers both Workshop and Garage plant spots.',
    },
    'boiler-laundry': {
      attack: 'Open the Living Room hatch with Sledge — vertical exec into B.',
      defense: 'Reinforce Living and Kitchen hatches early — both threaten B vertical.',
    },
  },
  plane: {
    'meeting-office': {
      attack: 'Front Stairs is the standard exec — clear Galley utility before pushing.',
      defense: 'Mira on the Meeting wall reads the standard front-stair push.',
    },
    'security-cargo': {
      attack: 'Tarmac is exposed — flash before clearing the standard Cargo entry.',
      defense: 'Anchor Security — Cargo has too many entry vectors to hold solo.',
    },
    'kitchen-stateroom': {
      attack: 'Aft Stairs is the fast rotation flank — Nomad denies it during exec.',
      defense: 'Bandit-trick the Kitchen exterior wall — common hard-breach line.',
    },
    'work-lobby': {
      attack: 'Aft Lounge connector control isolates Lobby defenders from Work anchor.',
      defense: 'Maestro Evil Eye in Lobby covers both plant spots cleanly.',
    },
  },
  'stadium-bravo': {
    'medic-executive': {
      attack: 'Press Box vertical is the standard play — Buck opens Office ceiling.',
      defense: 'Mira on the Office/Target wall reads the central 2F push.',
    },
    'locker-dispensary': {
      attack: 'Concourse rotation pinch isolates Kids Dorm from Dormitory anchor.',
      defense: 'Roam Concourse — pick attackers as they cross from Tunnel side.',
    },
    'garage-press': {
      attack: 'Tunnel control is mandatory — defenders rotate Living from there.',
      defense: 'Bandit on the Living exterior wall — common hard-breach line.',
    },
    'nats-oregon': {
      attack: 'Field side flash setup denies Kitchen anchor on the standard exec.',
      defense: 'Maestro Evil Eye in Piano covers both Kitchen plant spots.',
    },
  },
  tower: {
    'bar-lounge': {
      attack: 'Helipad vertical pressure denies Gift Shop anchor cleanly.',
      defense: 'Bandit on the Gift Shop exterior wall — common hard-breach target.',
    },
    'ventilation-seating': {
      attack: 'East Stairs is the fast rotation flank — Nomad denies during exec.',
      defense: 'Mira between Tea and Bar reads the main-hall push.',
    },
    'tea-exhibition': {
      attack: 'Restaurant Stairs vertical pressure denies the standard Bird anchor.',
      defense: 'Maestro Evil Eye in Bird covers both Restaurant plant spots.',
    },
    'ballroom-bedroom': {
      attack: 'Lobby control is mandatory — defenders rotate Media Center from there.',
      defense: 'Anchor Media Center — Exhibit has too many soft walls to defend.',
    },
  },
  yacht: {
    'navigation-cafeteria': {
      attack: 'Helipad approach is exposed — clear with utility before pushing 4F.',
      defense: 'Mira on the Cockpit/Maps wall reads the standard helipad push.',
    },
    'casino-bar': {
      attack: 'Crew Stairs is the back-flank — Nomad denies it during the execute.',
      defense: 'Bandit-trick the Cafeteria exterior wall — common hard-breach line.',
    },
    'kitchen-engine': {
      attack: 'Sun Deck vertical pressure denies Engine Control anchor.',
      defense: 'Maestro Evil Eye in Engine Control covers both Kitchen plant spots.',
    },
    'submarine-stern': {
      attack: 'Open Bow hatches with Sledge — vertical exec from above is cleanest.',
      defense: 'Reinforce Server ceiling — primary vertical threat from 2F.',
    },
  },
  favela: {
    'bedroom-autoshop': {
      attack: 'Roof Access vertical pressure denies Packaging anchor cleanly.',
      defense: 'Mira on the Meth Lab wall reads the standard roof approach.',
    },
    'kitchen-meeting': {
      attack: 'Side Stairs is the fast rotation flank — Nomad denies during exec.',
      defense: 'Bandit on the Football Office exterior wall — common breach line.',
    },
    'market-party': {
      attack: 'Street control is mandatory — defenders rotate from Alley.',
      defense: 'Maestro Evil Eye in Bedroom covers both Apartment plant spots.',
    },
    'aunts-footsie': {
      attack: 'Patio vertical pressure catches Aunt\'s Bedroom anchors off guard.',
      defense: 'Mira between Bedroom and Apartment reads the central push.',
    },
  },
}

// Premium tactics — Champion-tier content per CLAUDE.md schema. Generated
// per site using a small set of templates that cover the universal R6
// patterns: spawn-kill spots, attack spawn locations, advanced setups
// (attack), runouts, anti-spawn-peek, advanced setups (defense).
function buildPremiumTactics(mapId, site, side) {
  const [r1, r2] = site.rooms
  const seed = mapId + site.id + side
  const map = MAP_DATA[mapId]
  const extras = map.extraCallouts || []
  const ext = (i) => extras[hash(seed + 'ext' + i) % extras.length] || 'main approach'

  if (side === 'attack') {
    return {
      attackSpawns: [
        {
          spawn: ext(0),
          from: ext(1),
          use: `Standard exec spawn for ${r1} pushes — drone-up and clear ${ext(2)} before commitment.`,
        },
        {
          spawn: ext(3),
          from: ext(4),
          use: `Off-angle spawn for split-push tactics — useful when defenders stack ${r1}.`,
        },
      ],
      spawnKillSpots: [
        {
          from: ext(0),
          target: ext(5) || ext(1),
          risk: 'Medium — exposes you to defender ACOG counter-peek',
          reward: 'Round opener pick that flips utility plan',
        },
      ],
      advancedSetups: [
        `Pre-frag the ${r1} reinforced wall during execute — soft-breach gadget cycles it open under support cover.`,
        `${ext(0)} flash rotation forces defenders off ${r2} window angles before main push.`,
        `Coordinated double-vertical: open soft floor above ${r1} AND open ${r2} ceiling on the same count to split anchor attention.`,
      ],
    }
  } else {
    return {
      runouts: [
        {
          from: r2,
          target: ext(0),
          timing: 'Action phase 0:30-0:45 — catches attackers droning the spawn area.',
        },
        {
          from: ext(1),
          target: ext(2),
          timing: 'Mid-round 1:30 mark — disrupts attacker setup before main exec.',
        },
      ],
      antiSpawnPeek: [
        `Reinforce ${r1} exterior wall facing ${ext(0)} approach — denies the standard spawn-peek angle.`,
        `Pre-place barbed wire at ${ext(1)} window frame to slow attacker drones and entry attempts.`,
        `Castle barricade on ${r2} window forces attackers to bring soft-breach utility instead of free entry.`,
      ],
      advancedSetups: [
        `Mira in ${r1} placed last — wait until attackers commit utility, then drop the canister to surprise the push.`,
        `Bandit-trick the ${r1} reinforced wall against Hibana — pellet timings are predictable on this site.`,
        `Roamer rotation: ${ext(0)} → ${ext(1)} → back to anchor on the 2:00 mark forces attackers to re-clear flanks.`,
      ],
    }
  }
}

function buildAttackUtility(rooms, ops) {
  const [r1] = rooms
  return [
    `${ops[0].name}: Charges on ${r1} reinforced wall`,
    `${ops[1].name}: Clear electronics and gadgets on the ${r1} wall`,
    `${ops[2].name}: Vertical destruction to pressure anchors`,
    `${ops[3].name}: Drone clear + entry frag once utility is gone`,
  ]
}

function buildDefenseUtility(rooms, ops) {
  const [r1, r2] = rooms
  return [
    `${ops[0].name}: Electrify ${r1} reinforced wall against breach`,
    `${ops[1].name}: Intel coverage on ${r2} and key entry points`,
    `${ops[2].name}: ADS protecting Mira window and main doorways`,
    `${ops[3].name}: Hold rotations and waste attacker time`,
  ]
}

function buildSiteStrat(mapId, site) {
  const seed = mapId + site.id
  const aOps = buildAttackOps(seed + 'A')
  const dOps = buildDefenseOps(seed + 'D')
  const callouts = buildCallouts(site.rooms, MAP_DATA[mapId].extraCallouts || [])
  return {
    attack: {
      operators: aOps,
      strategy: buildAttackStrategy(site.rooms, aOps, site.floor, mapId, site.id),
      callouts,
      utility: buildAttackUtility(site.rooms, aOps),
      premiumTactics: buildPremiumTactics(mapId, site, 'attack'),
    },
    defense: {
      operators: dOps,
      strategy: buildDefenseStrategy(site.rooms, dOps, mapId, site.id),
      callouts,
      utility: buildDefenseUtility(site.rooms, dOps),
      premiumTactics: buildPremiumTactics(mapId, site, 'defense'),
    },
  }
}

function emitJs(mapId, mapBlock) {
  const sitesJs = Object.entries(mapBlock).map(([siteId, site]) => {
    return `    ${JSON.stringify(siteId)}: ${formatSide(site)}`
  }).join(',\n')
  return `  ${JSON.stringify(mapId)}: {\n${sitesJs}\n  }`
}

function formatSide(site) {
  return `{
      attack: ${formatStratBlock(site.attack)},
      defense: ${formatStratBlock(site.defense)},
    }`
}

function formatStratBlock(b) {
  const opsJs = b.operators.map(o =>
    `          { name: ${JSON.stringify(o.name)}, role: ${JSON.stringify(o.role)}, priority: ${JSON.stringify(o.priority)} }`
  ).join(',\n')
  const calloutsJs = b.callouts.map(c => JSON.stringify(c)).join(', ')
  const utilityJs = b.utility.map(u => `          ${JSON.stringify(u)}`).join(',\n')
  const premiumJs = b.premiumTactics ? `,
        premiumTactics: ${formatPremiumTactics(b.premiumTactics)}` : ''
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

function formatPremiumTactics(p) {
  const parts = []
  if (p.attackSpawns) {
    const items = p.attackSpawns.map(s => `            { spawn: ${JSON.stringify(s.spawn)}, from: ${JSON.stringify(s.from)}, use: ${JSON.stringify(s.use)} }`).join(',\n')
    parts.push(`          attackSpawns: [\n${items},\n          ]`)
  }
  if (p.spawnKillSpots) {
    const items = p.spawnKillSpots.map(s => `            { from: ${JSON.stringify(s.from)}, target: ${JSON.stringify(s.target)}, risk: ${JSON.stringify(s.risk)}, reward: ${JSON.stringify(s.reward)} }`).join(',\n')
    parts.push(`          spawnKillSpots: [\n${items},\n          ]`)
  }
  if (p.runouts) {
    const items = p.runouts.map(s => `            { from: ${JSON.stringify(s.from)}, target: ${JSON.stringify(s.target)}, timing: ${JSON.stringify(s.timing)} }`).join(',\n')
    parts.push(`          runouts: [\n${items},\n          ]`)
  }
  if (p.antiSpawnPeek) {
    const items = p.antiSpawnPeek.map(s => `            ${JSON.stringify(s)}`).join(',\n')
    parts.push(`          antiSpawnPeek: [\n${items},\n          ]`)
  }
  if (p.advancedSetups) {
    const items = p.advancedSetups.map(s => `            ${JSON.stringify(s)}`).join(',\n')
    parts.push(`          advancedSetups: [\n${items},\n          ]`)
  }
  return `{\n${parts.join(',\n')},\n        }`
}

const args = process.argv.slice(2)
const premiumOnly = args.includes('--premium-only')
const mapArgs = args.filter(a => !a.startsWith('--'))
const onlyMaps = mapArgs.length ? mapArgs : Object.keys(MAP_DATA)

if (premiumOnly) {
  // Emit ONLY the premiumTactics for each (map, site) → suitable for a
  // separate import file that merges into strats at module load.
  const out = {}
  for (const mapId of onlyMaps) {
    const data = MAP_DATA[mapId]
    if (!data) continue
    out[mapId] = {}
    for (const site of data.sites) {
      out[mapId][site.id] = {
        attack: buildPremiumTactics(mapId, site, 'attack'),
        defense: buildPremiumTactics(mapId, site, 'defense'),
      }
    }
  }
  console.log('// Auto-generated by scripts/generate-comingsoon-strats.mjs --premium-only')
  console.log('// Premium tactics for hand-written maps — merged into strats at runtime.')
  console.log('// Re-generate by running: node scripts/generate-comingsoon-strats.mjs --premium-only <maps...>')
  console.log('')
  console.log('const PREMIUM_TACTICS = ' + JSON.stringify(out, null, 2))
  console.log('')
  console.log('export default PREMIUM_TACTICS')
} else {
  const blocks = onlyMaps.map(mapId => {
    const data = MAP_DATA[mapId]
    if (!data) throw new Error(`No map data for ${mapId}`)
    const mapBlock = {}
    for (const site of data.sites) {
      mapBlock[site.id] = buildSiteStrat(mapId, site)
    }
    return emitJs(mapId, mapBlock)
  })
  console.log(blocks.join(',\n'))
}
