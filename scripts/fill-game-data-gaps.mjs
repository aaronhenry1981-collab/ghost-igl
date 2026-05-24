#!/usr/bin/env node
// One-shot script: appends missing real-world maps and cast members to
// each game's data files so the catalog matches what's actually in the
// games today.
//
// Strategy: each MISSING entry has its real-world name + plausible site
// list. We mark them `rankedPool: true` so they show up in the in-app
// strats viewer. No strats data is generated (StratsPage renders "no
// strats yet" gracefully — content gets curated later). Champion-tier
// accounts can see every map immediately.
//
// Run once: node scripts/fill-game-data-gaps.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Map additions per game — real maps that should exist in the catalog
// but aren't yet in the data file.
const MAP_ADDITIONS = {
  ow2: [
    { id: 'lijiang-tower', name: 'Lijiang Tower', type: 'Control', sites: ['Night Market', 'Garden', 'Control Center'] },
    { id: 'oasis', name: 'Oasis', type: 'Control', sites: ['City Center', 'Gardens', 'University'] },
    { id: 'samoa', name: 'Samoa', type: 'Control', sites: ['Downtown', 'Beach', 'Volcano'] },
    { id: 'hanamura', name: 'Hanamura', type: 'Hybrid', sites: ['Point A', 'Point B'] },
    { id: 'hollywood', name: 'Hollywood', type: 'Hybrid', sites: ['Point A', 'Point B', 'Point C'] },
    { id: 'paraiso', name: 'Paraíso', type: 'Escort', sites: ['First Point', 'Second Point', 'Final Point'] },
    { id: 'rialto', name: 'Rialto', type: 'Escort', sites: ['First Point', 'Second Point', 'Third Point'] },
    { id: 'havana', name: 'Havana', type: 'Escort', sites: ['First Point', 'Second Point', 'Third Point'] },
    { id: 'new-junk-city', name: 'New Junk City', type: 'Flashpoint', sites: ['North', 'East', 'South', 'West', 'Central'] },
    { id: 'throne-of-anubis', name: 'Throne of Anubis', type: 'Flashpoint', sites: ['Tomb', 'Sphinx', 'Oasis', 'Pyramid', 'Throne'] },
    { id: 'rio', name: 'Rio', type: 'Push', sites: ['Point 1', 'Point 2', 'Point 3', 'Point 4', 'Point 5'] },
  ],
  apex: [
    { id: 'kings-canyon', name: "Kings Canyon", type: 'Battle Royale', sites: ['Skull Town', 'Capacitor', 'Artillery', 'Bunker', 'Containment', 'Hydro Dam'] },
    { id: 'solace', name: 'Solace Street', type: 'Mixtape', sites: ['Main Street', 'Plaza', 'Apartments', 'Marketplace'] },
  ],
  halo: [
    { id: 'argyle', name: 'Argyle', type: 'Arena', sites: ['Top Mid', 'Bottom Mid', 'Red Base', 'Blue Base'] },
    { id: 'behemoth', name: 'Behemoth', type: 'Arena', sites: ['Cave', 'Top Mid', 'Red Base', 'Blue Base'] },
    { id: 'fragmentation', name: 'Fragmentation', type: 'Big Team Battle', sites: ['Red Base', 'Blue Base', 'Tower', 'Mid', 'Cave'] },
    { id: 'highpower', name: 'Highpower', type: 'Big Team Battle', sites: ['Red Base', 'Blue Base', 'Cliffside', 'Tower'] },
    { id: 'deadlock', name: 'Deadlock', type: 'Big Team Battle', sites: ['Red Base', 'Blue Base', 'Tower', 'Mid'] },
    { id: 'breaker', name: 'Breaker', type: 'Big Team Battle', sites: ['Red Base', 'Blue Base', 'Reactor', 'Quarry'] },
    { id: 'forbidden', name: 'Forbidden', type: 'Arena', sites: ['Temple', 'Vault', 'Spire', 'Top Mid'] },
    { id: 'catalyst', name: 'Catalyst', type: 'Arena', sites: ['Top Mid', 'Bridge', 'Red Base', 'Blue Base'] },
    { id: 'oasis', name: 'Oasis', type: 'Arena', sites: ['Top Mid', 'Bottom Mid', 'Red Base', 'Blue Base'] },
    { id: 'launch-site', name: 'Launch Site', type: 'Arena', sites: ['Top Mid', 'Bottom Mid', 'Red Base', 'Blue Base'] },
    { id: 'origin', name: 'Origin', type: 'Arena', sites: ['Top Mid', 'Atrium', 'Red Base', 'Blue Base'] },
    { id: 'banished', name: 'Banished', type: 'Big Team Battle', sites: ['Banished Camp', 'UNSC Camp', 'Tower', 'Hill'] },
    { id: 'high-ground', name: 'High Ground', type: 'Big Team Battle', sites: ['UNSC Camp', 'Cliff', 'Mid', 'Tunnels'] },
    { id: 'sanctuary', name: 'Sanctuary', type: 'Arena', sites: ['Top Mid', 'Bottom Mid', 'Red Base', 'Blue Base'] },
    { id: 'guardian', name: 'Guardian', type: 'Arena', sites: ['Top Mid', 'Bottom Mid', 'Red Base', 'Blue Base'] },
    { id: 'the-pit', name: 'The Pit', type: 'Arena', sites: ['Sniper Tower', 'Sword Room', 'Carbine', 'Long Hall'] },
    { id: 'lockout', name: 'Lockout', type: 'Arena', sites: ['Sniper Tower', 'BR Tower', 'Library', 'Lift'] },
    { id: 'midship', name: 'Midship', type: 'Arena', sites: ['Top Mid', 'Bottom Mid', 'Red Base', 'Blue Base'] },
    { id: 'narrows', name: 'Narrows', type: 'Arena', sites: ['Red Base', 'Blue Base', 'Mid', 'Bridge'] },
    { id: 'construct', name: 'Construct', type: 'Arena', sites: ['Top Mid', 'Bottom Mid', 'Red Base', 'Blue Base'] },
  ],
  finals: [
    { id: 'skyway-stadium', name: 'Skyway Stadium', type: 'Cashout / World Tour', sites: ['Stadium', 'Skybridges', 'Plaza', 'Pavilion'] },
    { id: 'fortune-stadium', name: 'Fortune Stadium', type: 'Cashout / World Tour', sites: ['Stadium', 'Concourse', 'Plaza', 'Parking'] },
    { id: 'dean-square', name: 'Dean Square', type: 'Cashout', sites: ['Plaza', 'Theater', 'Apartments', 'Underpass'] },
    { id: 'studio', name: 'Studio', type: 'Cashout / TV Studio', sites: ['Stage A', 'Stage B', 'Green Room', 'Sound Booth'] },
    { id: 'vegas-strip', name: 'Vegas Strip', type: 'Cashout', sites: ['Casino Floor', 'Hotel', 'Strip', 'Pool'] },
    { id: 'horizon-2', name: 'SYS$HORIZON 2.0', type: 'Cashout', sites: ['Server Room', 'Network', 'Backbone', 'Datacenter'] },
  ],
  cod: [
    { id: 'shipment', name: 'Shipment', type: '6v6 / 24/7', sites: ['Red Spawn', 'Blue Spawn', 'Center'] },
    { id: 'nuketown', name: 'Nuketown', type: '6v6 / Iconic', sites: ['Yellow House', 'Green House', 'Center', 'Backyard'] },
    { id: 'hijacked', name: 'Hijacked', type: '6v6 / Hardpoint', sites: ['Yacht Stern', 'Yacht Bow', 'Top Deck', 'Galley'] },
    { id: 'standoff', name: 'Standoff', type: '6v6 / Hardpoint', sites: ['Truck', 'Warehouse', 'OP-2', 'Boneyard'] },
    { id: 'babylon', name: 'Babylon', type: '6v6 / BO6', sites: ['Garden', 'Throne Room', 'Tower', 'Courtyard'] },
    { id: 'vondel', name: 'Vondel', type: 'Resurgence', sites: ['City Center', 'Cathedral', 'Marina', 'Stadium'] },
    { id: 'stalingrad', name: 'Stalingrad', type: '6v6 / Vanguard pool', sites: ['Tank', 'Factory', 'Plaza', 'Bridge'] },
    { id: 'gulag', name: 'Gulag (1v1)', type: 'Gulag', sites: ['Main Floor', 'Catwalk'] },
  ],
  fn: [
    { id: 'br-current', name: 'BR Current Chapter', type: 'Battle Royale', sites: ['Tilted Towers', 'The Citadel', 'Reckless Railways', 'Mythic POI', 'Coastal'] },
    { id: 'reload', name: 'Reload', type: 'Reload', sites: ['Lavish Lair', 'Hazy Hillside', 'Ritzy Riviera', 'Forbidden Falls', 'Salty Springs', 'Tilted Towers'] },
    { id: 'og', name: 'OG (Original Map)', type: 'Battle Royale OG', sites: ['Tilted Towers', 'Pleasant Park', 'Retail Row', 'Greasy Grove', 'Salty Springs'] },
    { id: 'creative-ranked', name: 'Creative Ranked Pool', type: 'Creative / UEFN', sites: ['Box Fight', 'Zone Wars', 'Realistic 1v1', 'Tycoon', 'Pit'] },
  ],
}

// Cast / role additions where the count is short.
const CAST_ADDITIONS = {
  cod: [
    { id: 'tactical-objective', name: 'Tactical Objective', role: 'Hardpoint / SnD Specialist', kit: 'Hardpoint timing, plant/defuse precision, objective slaying with team-coordinated loadout' },
  ],
  fn: [
    { id: 'box-fighter', name: 'Box Fighter', role: 'Close-Range Specialist', kit: 'Wall-take, edit-shotgun, double-pump rotation. Lives and dies in 1x1 builds.' },
    { id: 'sniper-specialist', name: 'Sniper Specialist', role: 'Long-Range Marksman', kit: 'Heavy Sniper + Bolt rotation, pre-edit flick shots, structure damage from range.' },
    { id: 'zone-rotation', name: 'Zone Rotation Pro', role: 'Endgame IGL', kit: 'Material management, high-ground racing, late-ring positioning, third-party timing.' },
    { id: 'mat-farmer', name: 'Material Farmer', role: 'Eco-Build Specialist', kit: 'Cap mats fast, tunnel rotations, build economy carry for the squad in endgame.' },
  ],
}

function patchMapsFile(gameId, additions) {
  const path = join(ROOT, 'src', 'data', 'games', gameId, 'maps.js')
  let s = readFileSync(path, 'utf8')

  // Don't double-add — bail if any of the new map ids already appear.
  const newIds = additions.map((a) => a.id)
  const already = newIds.filter((id) => s.includes(`id: "${id}"`) || s.includes(`id: '${id}'`))
  if (already.length === additions.length) {
    console.log(`  · ${gameId}: all ${additions.length} maps already present, skipping`)
    return 0
  }
  const toAdd = additions.filter((a) => !s.includes(`id: "${a.id}"`) && !s.includes(`id: '${a.id}'`))

  const block = toAdd.map((m) => {
    const sites = m.sites.map((siteName) => {
      const sid = String(siteName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      return `      { id: '${sid}', name: ${JSON.stringify(siteName)}, floor: '—' },`
    }).join('\n')
    return `  {
    id: ${JSON.stringify(m.id)},
    name: ${JSON.stringify(m.name)},
    type: ${JSON.stringify(m.type)},
    rankedPool: true,
    sites: [
${sites}
    ],
  },`
  }).join('\n')

  // Inject before the closing `]` of the array (handles both `]\n\nexport`
  // and `]\nexport`).
  s = s.replace(/\n\]\s*\n\s*export default MAPS\s*$/m, `\n${block}\n]\n\nexport default MAPS\n`)
  writeFileSync(path, s)
  return toAdd.length
}

function patchCastFile(gameId, additions) {
  const path = join(ROOT, 'src', 'data', 'games', gameId, 'operators.js')
  let s = readFileSync(path, 'utf8')

  const newIds = additions.map((a) => a.id)
  const toAdd = additions.filter((a) => !s.includes(`id: "${a.id}"`) && !s.includes(`id: '${a.id}'`))
  if (toAdd.length === 0) {
    console.log(`  · ${gameId}: all cast already present, skipping`)
    return 0
  }
  const block = toAdd.map((c) => `  {
    id: ${JSON.stringify(c.id)},
    name: ${JSON.stringify(c.name)},
    role: ${JSON.stringify(c.role)},
    kit: ${JSON.stringify(c.kit)},
  },`).join('\n')

  s = s.replace(/\n\]\s*\n\s*export default (CAST|OPERATORS)\s*$/m, `\n${block}\n]\n\nexport default $1\n`)
  writeFileSync(path, s)
  return toAdd.length
}

console.log('Filling game data gaps…\n')
console.log('=== Maps ===')
let mapTotal = 0
for (const [gameId, additions] of Object.entries(MAP_ADDITIONS)) {
  const added = patchMapsFile(gameId, additions)
  if (added > 0) console.log(`  ✓ ${gameId}: +${added} maps`)
  mapTotal += added
}
console.log(`  Total: +${mapTotal} maps\n`)

console.log('=== Cast / Roles ===')
let castTotal = 0
for (const [gameId, additions] of Object.entries(CAST_ADDITIONS)) {
  const added = patchCastFile(gameId, additions)
  if (added > 0) console.log(`  ✓ ${gameId}: +${added} cast`)
  castTotal += added
}
console.log(`  Total: +${castTotal} cast\n`)

console.log('Done. Re-run generators to refresh static pages + sitemap.')
