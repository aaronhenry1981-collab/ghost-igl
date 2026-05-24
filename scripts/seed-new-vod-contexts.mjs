// Seeds minimal VOD context files for the 9 new games so the Lambda can
// recognize them and produce game-aware feedback even before deep content
// lands. Each file follows the schema the Lambda already expects:
//
//   { game_meta: { name, short_name, tagline, sides, character_vocab,
//                  key_mechanics, round_format },
//     maps: { <id>: { name, notes } },
//     <character_field>: { <name>: { roles, side, notes } },
//     common_mistakes_by_rank: { low/mid/high: [...] },
//     review_template, vocabulary }
//
// Lambda's pickCharacterField() prefers operator_roles → agents → heroes →
// legends → builds → roles, so each game picks the most semantically
// correct field name for its roster.
//
// These contexts ship empty enough that they bloat the Lambda zip by only
// ~5-8 KB each (~60 KB total). Local will deepen them as the per-game data
// files mature.

import { writeFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'lambda', 'vod')

const CONTEXTS = {
  lol: {
    game_meta: {
      name: 'League of Legends',
      short_name: 'LoL',
      tagline: '5v5 MOBA — destroy the enemy Nexus through lane control, jungle pathing, and team-fight execution.',
      sides: { attack: 'Blue Side (bottom of map)', defense: 'Red Side (top of map)' },
      character_vocab: 'champions (170+ available, 5 picked per match across 5 positions: top, jungle, mid, ADC, support)',
      round_format: 'Best-of-1 or Best-of-5 (tournament). Single match ~25-45 minutes. No rounds.',
      key_mechanics: [
        'Last-hitting minions for gold (CS — Creep Score)',
        'Vision control via Wards (Stealth, Control, Farsight)',
        'Lane phase → Mid game → Late game power-spike scaling',
        'Jungle pathing + gank timing windows',
        'Drake / Herald / Baron Nashor objective trades',
        'Items + Mythic/Legendary build paths per champion',
      ],
    },
    maps: {
      'summoners-rift': { name: "Summoner's Rift", notes: 'Standard 5v5 map. Three lanes + jungle + neutral objectives.' },
      'aram': { name: 'ARAM (Howling Abyss)', notes: 'Single-lane 5v5 brawl mode.' },
      'arena': { name: 'Arena (Rings of Wrath)', notes: '2v2v2v2 brawl rounds with augments.' },
    },
    operator_roles: {
      Top: { roles: ['Tank', 'Bruiser', 'Split Pusher'], side: 'mixed', notes: 'Solo lane top of map. Often isolated 1v1 matchups.' },
      Jungle: { roles: ['Ganker', 'Farmer', 'Tank Initiator'], side: 'mixed', notes: 'Pathing decides early game; should track enemy jungle CD.' },
      Mid: { roles: ['Mage', 'Assassin', 'Skirmisher'], side: 'mixed', notes: 'Central lane. Shortest rotation paths to side lanes.' },
      ADC: { roles: ['Marksman'], side: 'mixed', notes: 'Bot lane carry. Scales with items; needs protection late game.' },
      Support: { roles: ['Enchanter', 'Engage', 'Mage Support'], side: 'mixed', notes: 'Bot lane utility. Vision + peel + engage windows.' },
    },
    common_mistakes_by_rank: {
      iron_bronze: ['Last-hitting only when minions are low — should pre-aim attack', 'No vision purchases; running blind into ganks', 'Trying to 1v5 instead of grouping at 14+ min'],
      silver_gold: ['Bad recall timing — backing with full HP instead of empty mana', 'Wrong build choices vs enemy comp', 'Tunnel-vision on kills instead of objectives'],
      platinum_plus: ['Sub-optimal jungle pathing on first clear', 'Wrong wave management before recall', 'Not tracking enemy summoner cooldowns (Flash, Teleport)'],
    },
  },

  dota2: {
    game_meta: {
      name: 'Dota 2',
      short_name: 'Dota',
      tagline: '5v5 MOBA — destroy the enemy Ancient. Deeper mechanic ceiling than LoL (denying, couriers, neutral items, illusion mechanics).',
      sides: { attack: 'Radiant (bottom-left)', defense: 'Dire (top-right)' },
      character_vocab: 'heroes (120+, 5 picked per match across 5 positions, numbered 1-5 from hard-carry to position 5 support)',
      round_format: 'BO1, BO3, or BO5 (tournament). Single match ~30-60 minutes. No rounds.',
      key_mechanics: [
        'Last-hitting + denying (deny own creeps to starve enemy XP)',
        'Position 1-5 system: carry / mid / offlaner / soft support / hard support',
        'Courier management + item couriering',
        'Roshan timer + Aegis of the Immortal',
        'Neutral items (drops from neutral camps every X min)',
        'High-ground defense via shrines + buybacks',
      ],
    },
    maps: {
      'dota-map': { name: 'The Dota Map', notes: 'Single map. Two sides (Radiant SW / Dire NE), three lanes, jungle camps, Roshan pit.' },
    },
    operator_roles: {
      'Position 1 Carry': { roles: ['Hard Carry'], side: 'mixed', notes: 'Farms gold/XP, scales into late-game wincon. Safe lane.' },
      'Position 2 Mid': { roles: ['Tempo Controller'], side: 'mixed', notes: 'Solo mid lane. Rotates to side lanes earliest.' },
      'Position 3 Offlaner': { roles: ['Initiator', 'Disruptor'], side: 'mixed', notes: 'Off lane. Tanks the lane, initiates fights.' },
      'Position 4 Roamer': { roles: ['Soft Support'], side: 'mixed', notes: 'Roams + early ganks + neutral item priority.' },
      'Position 5 Hard Support': { roles: ['Babysitter', 'Sentry'], side: 'mixed', notes: 'Wards the map, peels carry, sacrifices farm.' },
    },
    common_mistakes_by_rank: {
      herald_guardian: ['Not denying creeps', 'Buying TPs only after the fight', 'Buying wrong items for hero/comp'],
      crusader_archon: ['Buyback used too early', 'Wrong Aegis pickup priority', 'Pos 4-5 building carry items'],
      legend_plus: ['Sub-optimal smoke-gank timing', 'Wrong neutral item selection', 'Bad rotation reads on enemy mid'],
    },
  },

  eafc: {
    game_meta: {
      name: 'EA Sports FC',
      short_name: 'FC',
      tagline: 'Football simulation. 1v1 online (FUT Rivals, Champions, Squad Battles), Pro Clubs co-op, Career single-player.',
      sides: { attack: 'Possession (in-attack)', defense: 'Defending (out-of-possession)' },
      character_vocab: 'formations, custom tactics, and player cards (FUT Ultimate Team build)',
      round_format: '2x6 minute halves online. Career mode uses full match lengths.',
      key_mechanics: [
        'Formation selection (4-3-3, 4-2-3-1, 4-4-2, 5-3-2, 3-4-3, etc)',
        'Custom Tactics — defending depth, width, attacking width, pressing intensity',
        'Skill moves + finesse shots + driven shots',
        'FUT chemistry + position changes',
        'Set pieces — corners, free kicks, penalties',
        'Player switching + defensive AI behavior',
      ],
    },
    maps: {
      'ultimate-team': { name: 'Ultimate Team (FUT)', notes: 'Online card-collection game mode. Rivals + Champions weekend.' },
      'pro-clubs': { name: 'Pro Clubs', notes: '11v11 co-op online. Each player controls one position.' },
      'career': { name: 'Career Mode', notes: 'Single-player. Manager or Player career.' },
      'volta': { name: 'Volta Football', notes: 'Street football mode. Smaller pitches, freestyle skill moves.' },
    },
    builds: {
      'High-Press 4-3-3': { roles: ['Attacking'], side: 'attack', notes: 'High defensive line + constant pressure. Counter risk if midfield gets bypassed.' },
      'Possession 4-2-3-1': { roles: ['Tika-Taka'], side: 'attack', notes: 'Patient passing build. Slow tempo, control midfield.' },
      'Counter 4-4-2': { roles: ['Counter-Attack'], side: 'defense', notes: 'Drop deep, hit on the break with pacy wingers.' },
      'Park the Bus 5-3-2': { roles: ['Ultra-Defensive'], side: 'defense', notes: 'Three CBs + wing-backs drop deep. Hard to break down.' },
    },
    common_mistakes_by_rank: {
      div_10_8: ['Constant ball-running into tackles', 'Not learning the L2/LT jockey defending', 'Spamming finesse shots without rebound positioning'],
      div_7_5: ['Wrong formation vs opponent style', 'Bad sub timing — leaving tired strikers on', 'Pre-set pieces routine not practiced'],
      div_4_elite: ['Sub-optimal custom tactics mid-game', 'Bad WL prep — fatigue management', 'Player switching to wrong CB on cutbacks'],
    },
  },

  tk8: {
    game_meta: {
      name: 'Tekken 8',
      short_name: 'TK8',
      tagline: '1v1 3D fighting game. Best-of-3 rounds. Heat system + Rage Arts + comeback mechanics.',
      sides: { attack: 'P1 (left side)', defense: 'P2 (right side)' },
      character_vocab: 'characters (32+ roster, each with unique 100+ move list, frame data, and combo paths)',
      round_format: 'Best of 3 rounds (FT2). Each round ~30-60 seconds. Online matches: BO3 sets or longer in tournament.',
      key_mechanics: [
        'Frame data — startup, hit advantage, block advantage, recovery',
        'Heat system — engages Heat mode for one round; Heat Smash + Heat Burst',
        'Rage Art (Rage mode below ~25% HP) — comeback super',
        'Combo trees — launcher → bound → wall carry → wall combo',
        'Movement — Korean Backdash Cancel (KBD), Wavedash (Mishima archetype)',
        'Sidestepping + sidewalking — break linear strings',
      ],
    },
    maps: {
      'arena-default': { name: 'Arena (Default)', notes: 'Open stage. No walls — neutral spacing matters more.' },
      'infinite-azure': { name: 'Infinite Azure', notes: 'Walled stage. Wall carry combos become decisive.' },
      'urban-square': { name: 'Urban Square', notes: 'Walled stage. Standard tournament pick.' },
    },
    operator_roles: {
      Mishima: { roles: ['Electric', 'Mixup'], side: 'mixed', notes: 'Kazuya, Reina, Heihachi-lineage. Wavedash + electric mid (i13 launch on counter-hit).' },
      'All-Rounder': { roles: ['Balanced'], side: 'mixed', notes: 'Jin, Devil Jin, Kazuya. Strong neutral + decent everything.' },
      Grappler: { roles: ['Throw Mixup'], side: 'mixed', notes: 'King, Marduk. Command grabs + 50/50 high/low.' },
      Striker: { roles: ['Damage'], side: 'mixed', notes: 'Paul, Bryan. Big damage per hit, limited mobility.' },
      'Counter-Specialist': { roles: ['Reactive'], side: 'mixed', notes: 'Asuka, Lili. Parry + whiff-punish + spacing.' },
    },
    common_mistakes_by_rank: {
      green_blue: ['Spamming Rage Art on wakeup', 'Not blocking lows after sidestepping', 'Mashing buttons mid-combo instead of confirming hit'],
      yellow_orange: ['Wrong combo route (basic > optimal because mental stack is full)', 'Not respecting i13 punishes on -13 moves', 'Eating same string 3x without sidestep'],
      red_purple_blue: ['Bad Heat resource management', 'Sub-optimal wall carry route', 'Predictable defensive option (always SS-right after T jab string)'],
    },
  },

  sf6: {
    game_meta: {
      name: 'Street Fighter 6',
      short_name: 'SF6',
      tagline: '1v1 2D fighting game. Best-of-3 rounds. Drive system + Modern/Classic control schemes.',
      sides: { attack: 'P1 (left side)', defense: 'P2 (right side)' },
      character_vocab: 'characters (22+ roster), played on Classic (full inputs) or Modern (simplified) controls',
      round_format: 'Best of 3 rounds (FT2). Each round ~99 seconds in-game.',
      key_mechanics: [
        'Drive Gauge — Drive Rush, Drive Impact, Drive Parry, Drive Reversal, OD (super) versions',
        'Burnout state — when Drive Gauge empties, you take chip damage + lose throw escapes',
        'SA1/SA2/SA3 super arts',
        'Drive Rush cancel from normals for combo extensions',
        'Parry / Perfect Parry timing windows',
        'Charge vs motion inputs (Guile/Honda vs Ryu/Ken)',
      ],
    },
    maps: {
      'genbu-temple': { name: 'Genbu Temple', notes: 'Walled stage. Corner carry matters.' },
      'metro-city-downtown': { name: 'Metro City Downtown', notes: 'Walled stage. Standard online pick.' },
    },
    operator_roles: {
      Shoto: { roles: ['Fireball Footsies', 'Fundamentals'], side: 'mixed', notes: 'Ryu, Ken, Luke. Hadoken + DP + tatsu. Classic toolkit.' },
      Rushdown: { roles: ['Pressure'], side: 'mixed', notes: 'Cammy, Ken, Kim. Frame traps + tick throws + safe pressure.' },
      Zoner: { roles: ['Keep-Away'], side: 'mixed', notes: 'JP, Guile, Dhalsim. Trap setters + projectiles + anti-airs.' },
      Grappler: { roles: ['Throw Mixup'], side: 'mixed', notes: 'Manon, Marisa, Zangief. Command grabs + frame traps to setup grabs.' },
      'Charge Specialist': { roles: ['Spacing Charge'], side: 'mixed', notes: 'Guile, Dee Jay, Honda. Charge inputs reward patient defense.' },
    },
    common_mistakes_by_rank: {
      rookie_iron: ['Mashing reversal DP on every blockstring', 'Not punishing -8 or worse moves on block', 'Throwing in Burnout state (no escape)'],
      bronze_silver: ['Sub-optimal Drive resource use — burning all 6 bars in one combo', 'Wrong button after Drive Rush — too slow for combo confirm', 'Missing Drive Parry timing on obvious projectiles'],
      gold_plus: ['Bad SA3 timing — using before opponent is in punishable state', 'Wrong combo route ending position (corner vs midscreen)', 'Predictable wakeup option select'],
    },
  },

  pubg: {
    game_meta: {
      name: 'PUBG: Battlegrounds',
      short_name: 'PUBG',
      tagline: '100-player battle royale. Solo, duo, or squad. Last team standing wins.',
      sides: { attack: 'Pushing (third-partying / rotating)', defense: 'Holding (compound defense)' },
      character_vocab: 'squad roles — IGL, Fragger, Sniper, Support, Scout, Anchor',
      round_format: 'Single match, ~30 minutes. Zone shrinks ~7-9 times.',
      key_mechanics: [
        'Loot prioritization — armor + helmet + meds before damage attachments',
        'Bluezone (poison gas) — track timer, time the next rotation',
        'Map-specific drop strategy (hot drop vs edge drop)',
        'Sound discipline — footstep + reload + gunshot directional reads',
        'Recoil patterns per weapon — AKM, Beryl M762, M416 spray control',
        'Grenade lineups for compounds (frags, smokes, flashes)',
      ],
    },
    maps: {
      erangel: { name: 'Erangel', notes: '8x8km classic map. Mixed terrain.' },
      miramar: { name: 'Miramar', notes: '8x8km desert. Long sightlines.' },
      sanhok: { name: 'Sanhok', notes: '4x4km jungle. Faster pace.' },
      vikendi: { name: 'Vikendi', notes: '6x6km snow. Snow track visibility.' },
      taego: { name: 'Taego', notes: '8x8km. Self-revive feature.' },
    },
    operator_roles: {
      IGL: { roles: ['Shotcaller'], side: 'mixed', notes: 'Drops calls, rotation calls, target priority.' },
      Fragger: { roles: ['Entry'], side: 'attack', notes: 'Top-K player. Pushes corners first.' },
      Sniper: { roles: ['Long Range'], side: 'defense', notes: '8x+ scope. Pick-offs from distance.' },
      Support: { roles: ['Heal + Smoke'], side: 'defense', notes: 'Carries meds + smokes. Revives priority.' },
      Anchor: { roles: ['Compound Hold'], side: 'defense', notes: 'Stays in cover. Watches off-angles for third party.' },
    },
    common_mistakes_by_rank: {
      bronze_silver: ['Hot-dropping every game = 80% R1 wipe', 'Looting in the open instead of cover', 'Spraying without recoil pattern'],
      gold_plat: ['Bad rotation timing — late to next zone, fighting through bluezone', 'Wrong angle holds — droneable from elevation', 'No grenade lineups for compound pushes'],
      diamond_plus: ['Sub-optimal third-party timing', 'Bad final-zone positioning (low ground)', 'Squad spread too thin — can\'t support each other'],
    },
  },

  deadlock: {
    game_meta: {
      name: 'Deadlock',
      short_name: 'DL',
      tagline: 'Valve\'s 6v6 hero-shooter MOBA hybrid. 4 lanes, soul/gold farming, item shop, mid boss.',
      sides: { attack: 'Sapphire side', defense: 'Amber side' },
      character_vocab: 'heroes (20+ launch roster, each with 4 abilities + ult)',
      round_format: 'Single match ~30-45 minutes. No rounds.',
      key_mechanics: [
        '4-lane minion wave management',
        'Soul economy — kills + minions + neutral souls',
        'Item shop (vitality, spirit, weapon categories with active items)',
        'Mid-boss objective (Patron) + soul urn',
        'Z-axis verticality — wall jumping, dashing, rope sliding',
        'Lane phase → mid game → patron push',
      ],
    },
    maps: {
      'main-map': { name: 'The Deadlock Map', notes: '4 lanes, mid boss, urn. Single map.' },
    },
    operator_roles: {
      Tank: { roles: ['Frontline'], side: 'mixed', notes: 'Abrams, Bebop tank build. Soak damage, peel for carries.' },
      DPS: { roles: ['Carry'], side: 'mixed', notes: 'Haze, Infernus. Scales late game with items.' },
      Diver: { roles: ['Pick-off'], side: 'mixed', notes: 'Lash, Mo & Krill. Single-target burst from advantage.' },
      Sniper: { roles: ['Long Range'], side: 'mixed', notes: 'Vindicta, Grey Talon. Pick from elevated angles.' },
      Support: { roles: ['Utility'], side: 'mixed', notes: 'Dynamo, Kelvin. CC + healing + zone control.' },
    },
    common_mistakes_by_rank: {
      low: ['Last-hitting minions only — should also deny if soul-share active', 'No vision in lane', 'Wrong item path (vitality when you need spirit)'],
      mid: ['Bad mid-boss timing — taking with low HP', 'Wrong rotation calls', 'Not buying active items at item shop'],
      high: ['Sub-optimal soul management (banking when should spend)', 'Bad lane swap timing', 'Predictable diving angles'],
    },
  },

  naraka: {
    game_meta: {
      name: 'Naraka: Bladepoint',
      short_name: 'Naraka',
      tagline: 'Martial-arts battle royale. Melee-focused with parkour + grappling hook.',
      sides: { attack: 'Pushing', defense: 'Holding (high ground)' },
      character_vocab: 'heroes (10+, each with unique active + ultimate skills)',
      round_format: 'BR match ~20-30 minutes. Solo, duo, or trio modes.',
      key_mechanics: [
        'Melee timing — parry (blue), focus attack (red), grab break',
        'Grappling hook (Zipline + free aim) — mobility-defining',
        'Weapon types — sword, longsword, katana, polearm, dual halberds, greatsword',
        'Soul Jade enhancements (passive perks)',
        'Bow/musket for ranged engagements',
        'Sound design — listen for steps, weapon swings',
      ],
    },
    maps: {
      morus: { name: 'Morus Isle', notes: 'Original trios map.' },
      holoroth: { name: 'Holoroth', notes: 'Larger trios map with more verticality.' },
      'solo-arena': { name: 'Solo Showdown', notes: 'Faster-pace solo BR.' },
    },
    operator_roles: {
      'Mobile Assassin': { roles: ['Burst'], side: 'attack', notes: 'Viper Ning, Matari. Hit-and-run dueling.' },
      'Tank Grappler': { roles: ['Initiator'], side: 'defense', notes: 'Tianhai. Holds ground + initiates.' },
      'Rush Striker': { roles: ['Aggressor'], side: 'attack', notes: 'Yueshan. Closes distance fast.' },
      Dueler: { roles: ['1v1 Specialist'], side: 'attack', notes: 'Yoto Hime, Tarka Ji. Pure duel win-rate.' },
      Support: { roles: ['Heal + Defense'], side: 'defense', notes: 'Justina Gu, Wuchen. Team-keep-alive.' },
    },
    common_mistakes_by_rank: {
      low: ['Spamming attack — eaten by parry every time', 'Bad grapple landing (out of stamina mid-fight)', 'Loot in the open'],
      mid: ['Wrong weapon for situation (greatsword in tight quarters)', 'No focus attack reads', 'Predictable grapple angles'],
      high: ['Sub-optimal Soul Jade selection', 'Bad rotation away from final zone', 'Engaging duels when team is third-partying'],
    },
  },

  nba2k: {
    game_meta: {
      name: 'NBA 2K',
      short_name: '2K',
      tagline: 'Basketball simulation. Player-controlled (MyCareer / Pro-Am) or team-controlled (MyTeam, Play Now).',
      sides: { attack: 'Offense (with ball)', defense: 'Defense (without ball)' },
      character_vocab: 'builds — Point Guard (Playmaker / 3-Level Scorer), Shooting Guard, Small Forward (Slasher), Power Forward (2-Way Lockdown), Center (Glass Cleaner / Stretch Big)',
      round_format: '4 quarters x 8-12 minutes. Real-time minutes only in MyTeam Limited.',
      key_mechanics: [
        'Shot meter timing — green release = guaranteed make at high stats',
        'Pick and roll execution — pass, dive, fade reads',
        'Defensive stance + on-ball pressure intensity',
        'Stamina management — sprinting drains, affects shot %',
        'Set plays + freelance offense — running designed actions',
        'Badges system — passive boosts to specific actions (Catch & Shoot, Limitless Range, etc.)',
      ],
    },
    maps: {
      mycareer: { name: 'MyCareer / The City', notes: 'Online open-world hub with Rec Center 5v5, Park 3v3, Pro-Am.' },
      myteam: { name: 'MyTeam', notes: 'Card collection mode. Triple Threat 3v3, Unlimited 5v5, Limited weekend.' },
      'play-now': { name: 'Play Now Online', notes: 'Direct online 5v5 with real NBA teams.' },
    },
    builds: {
      'PG Playmaker': { roles: ['Floor General'], side: 'attack', notes: 'High ball-handle + pass accuracy. Sets up team.' },
      'PG 3-Level Scorer': { roles: ['Score-First Guard'], side: 'attack', notes: 'Three + mid + finish. Self-create.' },
      'SG Sharpshooter': { roles: ['Catch & Shoot'], side: 'attack', notes: 'Spot-up 3 specialist.' },
      'SF Slasher': { roles: ['Finisher'], side: 'attack', notes: 'Drives the lane. Posters + dunk packages.' },
      'PF 2-Way Lockdown': { roles: ['Wing Defender'], side: 'defense', notes: 'Guards 1-4. Steals + contests.' },
      'C Glass Cleaner': { roles: ['Rebounder'], side: 'defense', notes: 'Offensive + defensive board specialist.' },
      'C Stretch Big': { roles: ['Stretch'], side: 'attack', notes: 'Pop after pick-and-roll. Trail 3.' },
    },
    common_mistakes_by_rank: {
      rookie: ['Shooting outside green window every time', 'No defensive stance on ball — getting blown by', 'Spamming dribble moves without setting up shot'],
      starter: ['Bad pick-and-roll reads — picking wrong defender side', 'Forcing 3s instead of mid-range with high mid-range stats', 'Not using freelance for spacing'],
      veteran: ['Sub-optimal play calling vs defensive matchup', 'Bad fatigue management — running starters into 4th quarter', 'Wrong badge load-out for build archetype'],
    },
  },
}

const REVIEW_TEMPLATE = {
  format: 'JSON',
  required_fields: ['session.headline', 'session.score', 'per_image[].detected', 'per_image[].what_went_wrong', 'patterns.recurring_weaknesses', 'practice_plan.this_week'],
  style: 'Specific over generic. Reference visible HUD elements, in-game timers, and concrete tactical concepts. Never say "play smart" or "use abilities better".',
}

const VOCABULARY = ['standard tactical vocabulary varies by game; defer to game_meta.character_vocab and key_mechanics for terms']

for (const [gameId, ctx] of Object.entries(CONTEXTS)) {
  const out = {
    generated_at: new Date().toISOString(),
    ...ctx,
    review_template: REVIEW_TEMPLATE,
    vocabulary: VOCABULARY,
  }
  const p = join(OUT_DIR, `${gameId}-context.json`)
  writeFileSync(p, JSON.stringify(out, null, 2))
  console.log(`  WROTE ${p} (${statSync(p).size} bytes)`)
}

console.log(`\n✓ Seeded ${Object.keys(CONTEXTS).length} VOD context files.`)
