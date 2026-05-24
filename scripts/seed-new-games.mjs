// One-shot seeder — creates skeleton data files for the 9 new games we're
// adding to bring Recon 6's coverage from 11 → 20 games:
//
//   League of Legends, Dota 2, EA Sports FC, Tekken 8, Street Fighter 6,
//   PUBG: Battlegrounds, Deadlock, Naraka: Bladepoint, NBA 2K.
//
// Each game gets a directory under src/data/games/<id>/ with:
//   - maps.js      — 3-6 maps/modes/stages with site/zone breakdowns
//   - operators.js — characters/heroes/roles (the game's CAST)
//   - strats.js    — empty stub (Aaron fills via /fill-strat)
//   - loadouts.js  — empty stub
//   - meta.json    — empty meta stub
//   - index.js     — exports + gameMeta for the registry
//
// The skeleton renders correctly in every consumer (Strats, Loadouts,
// Match Prep, VOD) — pages show "early access" placeholders where
// strats data is missing rather than crashing.

import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const GAMES_DIR = join(__dirname, '..', 'src', 'data', 'games')

const GAMES = [
  {
    id: 'lol',
    displayName: 'League of Legends',
    color: '#c89b3c',
    vocab: { map: 'Map', site: 'Lane', operator: 'Champion', side_attack: 'Blue Side', side_defense: 'Red Side' },
    maps: [
      { id: 'summoners-rift', name: "Summoner's Rift", type: '5v5', rankedPool: true,
        sites: [
          { id: 'top-lane', name: 'Top Lane', floor: '—' },
          { id: 'mid-lane', name: 'Mid Lane', floor: '—' },
          { id: 'bot-lane', name: 'Bot Lane', floor: '—' },
          { id: 'jungle', name: 'Jungle', floor: '—' },
          { id: 'dragon-soul', name: 'Dragon / Soul Objective', floor: '—' },
          { id: 'baron', name: 'Baron Nashor Pit', floor: '—' },
        ] },
      { id: 'aram', name: 'ARAM (Howling Abyss)', type: 'ARAM', rankedPool: false,
        sites: [
          { id: 'mid-lane', name: 'Single Lane', floor: '—' },
          { id: 'fountain', name: 'Fountain', floor: '—' },
        ] },
      { id: 'arena', name: 'Arena (Rings of Wrath)', type: '2v2v2v2', rankedPool: false,
        sites: [
          { id: 'arena-round', name: 'Round Phase', floor: '—' },
          { id: 'cameos', name: 'Cameo Phase', floor: '—' },
        ] },
    ],
    cast: [
      { name: 'Yasuo', side: 'attack', role: 'Mid Skirmisher' },
      { name: 'Lee Sin', side: 'attack', role: 'Jungle Diver' },
      { name: 'Jhin', side: 'attack', role: 'ADC Marksman' },
      { name: 'Lulu', side: 'defense', role: 'Enchanter Support' },
      { name: 'Garen', side: 'defense', role: 'Top Tank' },
      { name: 'Ahri', side: 'attack', role: 'Mid Burst Mage' },
      { name: 'Thresh', side: 'defense', role: 'Support Engage' },
      { name: 'Kha\'Zix', side: 'attack', role: 'Jungle Assassin' },
    ],
  },
  {
    id: 'dota2',
    displayName: 'Dota 2',
    color: '#a01818',
    vocab: { map: 'Match Phase', site: 'Lane', operator: 'Hero', side_attack: 'Radiant', side_defense: 'Dire' },
    maps: [
      { id: 'dota-map', name: 'The Dota Map', type: '5v5', rankedPool: true,
        sites: [
          { id: 'safe-lane', name: 'Safe Lane (Carry)', floor: '—' },
          { id: 'mid-lane', name: 'Mid Lane', floor: '—' },
          { id: 'off-lane', name: 'Off Lane', floor: '—' },
          { id: 'jungle', name: 'Jungle / Stacking', floor: '—' },
          { id: 'roshan-pit', name: 'Roshan Pit', floor: '—' },
          { id: 'high-ground', name: 'High Ground Defense', floor: '—' },
        ] },
      { id: 'turbo', name: 'Turbo Mode', type: 'Casual', rankedPool: false,
        sites: [
          { id: 'lane', name: 'Lanes (Compressed)', floor: '—' },
          { id: 'objectives', name: 'Objectives Phase', floor: '—' },
        ] },
    ],
    cast: [
      { name: 'Pudge', side: 'attack', role: 'Position 3 / Support' },
      { name: 'Invoker', side: 'attack', role: 'Position 2 Mid' },
      { name: 'Anti-Mage', side: 'attack', role: 'Position 1 Carry' },
      { name: 'Crystal Maiden', side: 'defense', role: 'Position 5 Support' },
      { name: 'Axe', side: 'defense', role: 'Position 3 Offlaner' },
      { name: 'Phantom Assassin', side: 'attack', role: 'Position 1 Carry' },
      { name: 'Shadow Fiend', side: 'attack', role: 'Position 2 Mid' },
      { name: 'Lion', side: 'defense', role: 'Position 4 Roamer' },
    ],
  },
  {
    id: 'eafc',
    displayName: 'EA Sports FC',
    color: '#00b140',
    vocab: { map: 'Mode', site: 'Phase', operator: 'Formation Slot', side_attack: 'Possession', side_defense: 'Defending' },
    maps: [
      { id: 'ultimate-team', name: 'Ultimate Team (FUT)', type: 'Online', rankedPool: true,
        sites: [
          { id: 'rivals', name: 'Division Rivals', floor: '—' },
          { id: 'champions', name: 'FUT Champions', floor: '—' },
          { id: 'squad-battles', name: 'Squad Battles', floor: '—' },
        ] },
      { id: 'pro-clubs', name: 'Pro Clubs', type: 'Online Coop', rankedPool: true,
        sites: [
          { id: 'club-match', name: 'Drop-in Club Match', floor: '—' },
          { id: 'league', name: 'Club League', floor: '—' },
        ] },
      { id: 'career', name: 'Career Mode', type: 'Single-Player', rankedPool: false,
        sites: [
          { id: 'player-career', name: 'Player Career', floor: '—' },
          { id: 'manager-career', name: 'Manager Career', floor: '—' },
        ] },
      { id: 'volta', name: 'Volta Football', type: 'Street', rankedPool: false,
        sites: [
          { id: 'arcade', name: 'Volta Arcade', floor: '—' },
          { id: 'tour', name: 'Volta Tour', floor: '—' },
        ] },
    ],
    cast: [
      { name: '4-3-3 (Attack)', side: 'attack', role: 'High-Press Formation' },
      { name: '4-2-3-1 (Wide)', side: 'attack', role: 'Possession Formation' },
      { name: '4-4-2 (Flat)', side: 'defense', role: 'Counter-Attack Formation' },
      { name: '5-3-2', side: 'defense', role: 'Park-the-Bus Formation' },
      { name: '3-4-3', side: 'attack', role: 'Wide-Wingback Formation' },
      { name: 'Custom Tactics — High Press', side: 'attack', role: 'Pressing Style' },
      { name: 'Custom Tactics — Contain', side: 'defense', role: 'Defensive Style' },
    ],
  },
  {
    id: 'tk8',
    displayName: 'Tekken 8',
    color: '#8b2929',
    vocab: { map: 'Stage', site: 'Round Phase', operator: 'Character', side_attack: 'P1', side_defense: 'P2' },
    maps: [
      { id: 'arena', name: 'Arena (Default)', type: 'Open', rankedPool: true,
        sites: [
          { id: 'neutral', name: 'Neutral Game', floor: '—' },
          { id: 'wall', name: 'Wall Pressure', floor: '—' },
          { id: 'corner', name: 'Corner Carry', floor: '—' },
        ] },
      { id: 'infinite-azure', name: 'Infinite Azure', type: 'Walled', rankedPool: true,
        sites: [
          { id: 'neutral', name: 'Neutral Game', floor: '—' },
          { id: 'wall', name: 'Wall Combo Setup', floor: '—' },
        ] },
      { id: 'urban-square', name: 'Urban Square', type: 'Walled', rankedPool: true,
        sites: [
          { id: 'neutral', name: 'Neutral Game', floor: '—' },
          { id: 'wall', name: 'Wall Carry', floor: '—' },
        ] },
    ],
    cast: [
      { name: 'Kazuya', side: 'attack', role: 'Mishima / Heat Pressure' },
      { name: 'Jin', side: 'attack', role: 'All-Rounder' },
      { name: 'King', side: 'attack', role: 'Grappler' },
      { name: 'Paul', side: 'attack', role: 'Damage Striker' },
      { name: 'Asuka', side: 'defense', role: 'Defensive Counter' },
      { name: 'Reina', side: 'attack', role: 'Mishima Newcomer' },
      { name: 'Bryan', side: 'attack', role: 'Mid-Range Pressure' },
      { name: 'Lili', side: 'defense', role: 'Spacing & Whiff-Punish' },
    ],
  },
  {
    id: 'sf6',
    displayName: 'Street Fighter 6',
    color: '#ed1c24',
    vocab: { map: 'Stage', site: 'Round Phase', operator: 'Character', side_attack: 'P1', side_defense: 'P2' },
    maps: [
      { id: 'genbu-temple', name: 'Genbu Temple', type: 'Walled', rankedPool: true,
        sites: [
          { id: 'neutral', name: 'Neutral Spacing', floor: '—' },
          { id: 'corner', name: 'Corner Carry', floor: '—' },
          { id: 'drive-pressure', name: 'Drive Pressure Setups', floor: '—' },
        ] },
      { id: 'metro-city', name: 'Metro City Downtown', type: 'Walled', rankedPool: true,
        sites: [
          { id: 'neutral', name: 'Neutral Spacing', floor: '—' },
          { id: 'corner', name: 'Corner Carry', floor: '—' },
        ] },
    ],
    cast: [
      { name: 'Ryu', side: 'attack', role: 'Shoto / Fundamentals' },
      { name: 'Ken', side: 'attack', role: 'Rush-Down Shoto' },
      { name: 'Luke', side: 'attack', role: 'Modern-Friendly All-Rounder' },
      { name: 'JP', side: 'defense', role: 'Zoner / Trap Setter' },
      { name: 'Chun-Li', side: 'attack', role: 'Footsies / Spacing' },
      { name: 'Cammy', side: 'attack', role: 'Rush-Down Pressure' },
      { name: 'Dee Jay', side: 'attack', role: 'Hit-and-Run Charge' },
      { name: 'Guile', side: 'defense', role: 'Charge Zoner' },
    ],
  },
  {
    id: 'pubg',
    displayName: 'PUBG: Battlegrounds',
    color: '#f5a623',
    vocab: { map: 'Map', site: 'Zone', operator: 'Squad Role', side_attack: 'Pushing', side_defense: 'Holding' },
    maps: [
      { id: 'erangel', name: 'Erangel', type: '8x8km Classic', rankedPool: true,
        sites: [
          { id: 'pochinki', name: 'Pochinki', floor: '—' },
          { id: 'school', name: 'School', floor: '—' },
          { id: 'georgopol', name: 'Georgopol', floor: '—' },
          { id: 'military-base', name: 'Military Base', floor: '—' },
        ] },
      { id: 'miramar', name: 'Miramar', type: '8x8km Desert', rankedPool: true,
        sites: [
          { id: 'pecado', name: 'Pecado', floor: '—' },
          { id: 'hacienda', name: 'Hacienda del Patrón', floor: '—' },
          { id: 'los-leones', name: 'Los Leones', floor: '—' },
        ] },
      { id: 'sanhok', name: 'Sanhok', type: '4x4km Jungle', rankedPool: true,
        sites: [
          { id: 'paradise-resort', name: 'Paradise Resort', floor: '—' },
          { id: 'bootcamp', name: 'Bootcamp', floor: '—' },
        ] },
      { id: 'vikendi', name: 'Vikendi', type: '6x6km Snow', rankedPool: true,
        sites: [
          { id: 'castle', name: 'Castle', floor: '—' },
          { id: 'cosmodrome', name: 'Cosmodrome', floor: '—' },
        ] },
      { id: 'taego', name: 'Taego', type: '8x8km Korean Forest', rankedPool: true,
        sites: [
          { id: 'go-san', name: 'Go-Sang Village', floor: '—' },
          { id: 'shipyard', name: 'Shipyard', floor: '—' },
        ] },
    ],
    cast: [
      { name: 'IGL / Caller', side: 'attack', role: 'Squad shotcaller, rotates calls' },
      { name: 'Fragger', side: 'attack', role: 'Entry duels, top-K player' },
      { name: 'Sniper', side: 'defense', role: 'Long-range pick-off' },
      { name: 'Support', side: 'defense', role: 'Heals, smokes, revives' },
      { name: 'Scout', side: 'attack', role: 'Recon + grenade lineups' },
      { name: 'Anchor', side: 'defense', role: 'Holds the compound' },
    ],
  },
  {
    id: 'deadlock',
    displayName: 'Deadlock',
    color: '#7b2cbf',
    vocab: { map: 'Map', site: 'Lane', operator: 'Hero', side_attack: 'Sapphire', side_defense: 'Amber' },
    maps: [
      { id: 'main-map', name: 'The Deadlock Map', type: '6v6', rankedPool: true,
        sites: [
          { id: 'lane-1', name: 'Lane 1', floor: '—' },
          { id: 'lane-2', name: 'Lane 2', floor: '—' },
          { id: 'lane-3', name: 'Lane 3', floor: '—' },
          { id: 'lane-4', name: 'Lane 4', floor: '—' },
          { id: 'mid-boss', name: 'Mid Boss / Patron', floor: '—' },
          { id: 'urn', name: 'Soul Urn Spawn', floor: '—' },
        ] },
    ],
    cast: [
      { name: 'Abrams', side: 'defense', role: 'Tank / Initiator' },
      { name: 'Bebop', side: 'attack', role: 'Hook / Long-Range' },
      { name: 'Dynamo', side: 'defense', role: 'Support Ult' },
      { name: 'Haze', side: 'attack', role: 'DPS Carry' },
      { name: 'Infernus', side: 'attack', role: 'Damage-Over-Time' },
      { name: 'Lash', side: 'attack', role: 'Mobility Diver' },
      { name: 'Pocket', side: 'attack', role: 'Burst Assassin' },
      { name: 'Vindicta', side: 'attack', role: 'Sniper' },
    ],
  },
  {
    id: 'naraka',
    displayName: 'Naraka: Bladepoint',
    color: '#f24c00',
    vocab: { map: 'Map', site: 'Region', operator: 'Hero', side_attack: 'Pushing', side_defense: 'Holding' },
    maps: [
      { id: 'morus', name: 'Morus Isle', type: 'Trios BR', rankedPool: true,
        sites: [
          { id: 'hidden-fort', name: 'Hidden Fortress', floor: '—' },
          { id: 'man-cheng', name: 'Man Cheng', floor: '—' },
          { id: 'shipwreck', name: 'Shipwreck', floor: '—' },
        ] },
      { id: 'holoroth', name: 'Holoroth', type: 'Trios BR', rankedPool: true,
        sites: [
          { id: 'ancient-fortress', name: 'Ancient Fortress', floor: '—' },
          { id: 'temple-of-shadows', name: 'Temple of Shadows', floor: '—' },
        ] },
      { id: 'solo-arena', name: 'Solo Showdown', type: 'Solo', rankedPool: true,
        sites: [
          { id: 'duel-zone', name: 'Duel Zone', floor: '—' },
        ] },
    ],
    cast: [
      { name: 'Viper Ning', side: 'attack', role: 'Mobile Assassin' },
      { name: 'Tianhai', side: 'defense', role: 'Tank Grappler' },
      { name: 'Yueshan', side: 'attack', role: 'Rush Striker' },
      { name: 'Yoto Hime', side: 'attack', role: 'Glaive Dueler' },
      { name: 'Tarka Ji', side: 'attack', role: 'Counter-Striker' },
      { name: 'Matari', side: 'attack', role: 'Ranged Mobility' },
      { name: 'Justina Gu', side: 'defense', role: 'Healing Support' },
      { name: 'Wuchen', side: 'defense', role: 'Defensive Bubble' },
    ],
  },
  {
    id: 'nba2k',
    displayName: 'NBA 2K',
    color: '#c8102e',
    vocab: { map: 'Mode', site: 'Possession', operator: 'Build', side_attack: 'Offense', side_defense: 'Defense' },
    maps: [
      { id: 'mycareer', name: 'MyCareer / The City', type: 'Single-Player + Online', rankedPool: true,
        sites: [
          { id: 'rec-center', name: 'Rec Center 5v5', floor: '—' },
          { id: 'park', name: 'Park 3v3', floor: '—' },
          { id: 'pro-am', name: 'Pro-Am', floor: '—' },
        ] },
      { id: 'myteam', name: 'MyTeam', type: 'Online Card Game', rankedPool: true,
        sites: [
          { id: 'triple-threat', name: 'Triple Threat 3v3', floor: '—' },
          { id: 'unlimited', name: 'Unlimited 5v5', floor: '—' },
          { id: 'limited', name: 'Limited Weekend', floor: '—' },
        ] },
      { id: 'play-now', name: 'Play Now Online', type: 'Online 5v5', rankedPool: true,
        sites: [
          { id: 'quick-match', name: 'Quick Match', floor: '—' },
          { id: 'ranked-match', name: 'Ranked Match', floor: '—' },
        ] },
    ],
    cast: [
      { name: 'PG Playmaker', side: 'attack', role: 'Point Guard — Playmaking Build' },
      { name: 'PG 3-Level Scorer', side: 'attack', role: 'Point Guard — Scoring Build' },
      { name: 'SG Sharpshooter', side: 'attack', role: 'Shooting Guard — Shooting Build' },
      { name: 'SF Slasher', side: 'attack', role: 'Small Forward — Slashing Build' },
      { name: 'PF 2-Way Lockdown', side: 'defense', role: 'Power Forward — Defensive Build' },
      { name: 'C Glass Cleaner', side: 'defense', role: 'Center — Rebounder Build' },
      { name: 'C Stretch Big', side: 'attack', role: 'Center — Stretch Build' },
    ],
  },
]

function w(p, content) {
  if (existsSync(p)) {
    console.log(`  SKIP ${p} (already exists)`)
    return
  }
  writeFileSync(p, content, 'utf8')
  console.log(`  WROTE ${p}`)
}

for (const g of GAMES) {
  const dir = join(GAMES_DIR, g.id)
  mkdirSync(dir, { recursive: true })

  // maps.js
  const mapsCode = `// ${g.displayName} — early-access map/mode catalog. Strats data being added
// per Recon 6's content pipeline; this seeds the structure so the strats /
// loadouts / match-prep pages render correctly while content depth grows.

const MAPS = ${JSON.stringify(g.maps, null, 2)}

export default MAPS
`
  w(join(dir, 'maps.js'), mapsCode)

  // operators.js (CAST)
  const castCode = `// ${g.displayName} — early-access character/role catalog.

const CAST = ${JSON.stringify(g.cast, null, 2)}

export default CAST
`
  w(join(dir, 'operators.js'), castCode)

  // strats.js — empty stub, filled via /fill-strat over time
  const stratsCode = `// ${g.displayName} — strats data. Currently early-access; populate per
// site via Aaron's /fill-strat slash command. Empty {} renders the
// "early access — strats being curated" placeholder in GameStratsPage.

const STRATS = {}

export default STRATS
`
  w(join(dir, 'strats.js'), stratsCode)

  // loadouts.js — empty stub
  const loadoutsCode = `// ${g.displayName} — loadouts content. Early-access stub.

const LOADOUTS = {}

export default LOADOUTS
`
  w(join(dir, 'loadouts.js'), loadoutsCode)

  // meta.json — empty meta
  const metaCode = `{
  "_comment": "${g.displayName} meta data — early-access stub. Populate via Aaron's content pipeline as the tier list crystallizes."
}
`
  w(join(dir, 'meta.json'), metaCode)

  // index.js — barrel + gameMeta
  const indexCode = `import MAPS from './maps.js'
import CAST from './operators.js'
import STRATS from './strats.js'
import LOADOUTS from './loadouts.js'
import META from './meta.json' with { type: 'json' }

const gameMeta = {
  id: '${g.id}',
  name: '${g.id}',
  displayName: '${g.displayName}',
  color: '${g.color}',
  slug: '${g.id}',
  earlyAccess: true,
  vocab: {
    map: '${g.vocab.map}',
    site: '${g.vocab.site}',
    operator: '${g.vocab.operator}',
    side_attack: '${g.vocab.side_attack}',
    side_defense: '${g.vocab.side_defense}',
  },
}

export { MAPS, CAST, STRATS, LOADOUTS, META, gameMeta }
export default { MAPS, CAST, STRATS, LOADOUTS, META, gameMeta }
`
  w(join(dir, 'index.js'), indexCode)
}

console.log(`\n✓ Seeded ${GAMES.length} new games. Next: update src/data/games/index.js registry.`)
