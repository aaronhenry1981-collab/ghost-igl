#!/usr/bin/env node
// Generates 47 R6 operator deep-dive blog posts at public/blog/r6-operator-<slug>.html.
// Format: H1 + intro + Best Maps & Sites (dynamic from strats) + Loadout/Gadget +
// Common Mistakes + Counter Picks + How to Counter / How to Climb + related links + JSON-LD.
// Idempotent — re-run replaces files.
//
// Run: node scripts/generate-r6-operator-posts.mjs

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import MAPS from '../src/data/maps.js'
import STRATS from '../src/data/strats.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'blog')
const SITE_URL = 'https://r6coaching.com'
const YEAR = '2026'

function escape(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ---------- OPERATOR DATA ----------
// Per-op static data. side, role, gadget, weapons, speed, content snippets.

const OP_DATA = {
  // ===== ATTACK =====
  Thatcher: {
    side: 'attack', role: 'Support / Hard Breach Enabler', gadget: 'EMP Grenade',
    gadgetDesc: 'Three EMP grenades that disable all electronics in a wide radius for ~9 seconds — including Bandit/Kaid batteries, Mute jammers, Mira windows, ADS, Maestro Evil Eyes.',
    primary: 'AR33 / L85A2 / M590A1', secondary: '5.7 USG / 1911 TACOPS', secondaryGadget: 'Frag Grenades / Breach Charge', speed: '2-speed / 2-armor',
    intro: 'Thatcher is the cornerstone of any coordinated R6 attack. His EMP grenades disable every electronic gadget in their radius for ~9 seconds, opening a window where Thermite or Hibana can place charges on reinforced walls without Bandit or Kaid trick interference. He\'s banned in 80%+ of Plat+ matches for a reason.',
    strengths: ['Globally disables electronics — Bandits, Kaids, Mutes, Maestros, Echoes, Miras, ADSes all cleared in one EMP', 'EMP throws over walls and through soft surfaces — easier than line-of-sight gadgets', 'Three charges = three windows of breach safety per round', 'Forces defenders to bring Mute or duplicate anti-breach to compensate'],
    counterPicks: ['Mute (jammers block EMP throw if placed properly)', 'Kaid (Electroclaws on hatches force vertical EMP play)'],
    counterAdvice: 'On defense: Mute jammers placed near reinforced walls can block Thatcher\'s EMP from disabling them — but Thatcher can EMP from below or above through soft floors/ceilings, so position jammers in tight cubbies. Kaid Electroclaws on hatches and walls have wider range than Bandit batteries, making them harder to clear with a single EMP throw.',
    howToClimb: 'Master EMP timing with your Thermite or Hibana. The sequence: at 1:50 round timer, EMP the wall, wait 2 seconds for the EMP to fully detonate, then the breacher places their charge while Bandits are forcibly off the wall. Practice this exec in Custom Game with a buddy 10 times before relying on it in ranked. Don\'t throw EMP through line-of-sight if a Mute jammer is visible — the jammer eats it. Always EMP from cover.',
  },
  Ace: {
    side: 'attack', role: 'Hard Breach', gadget: 'S.E.L.M.A. Aniti-Intruder Demolisher',
    gadgetDesc: 'Three S.E.L.M.A. devices that stick to reinforced walls and detonate in a self-extending sequence, opening a 1x2-meter hole. Cannot be denied by Bandit batteries (too far from the wall surface), only by Mute jammers.',
    primary: 'AK-12 / M1014', secondary: 'P9', secondaryGadget: 'Smoke Grenade / Breach Charge', speed: '2-speed / 2-armor',
    intro: 'Ace is the Plat+ default hard breacher when Thermite and Hibana are banned. His S.E.L.M.A. devices open reinforced walls without needing line-of-sight to the entire wall section, making him better than Thermite on wall types where Thermite can\'t place flush.',
    strengths: ['Three S.E.L.M.A. charges per round — three breach windows', 'Bandit batteries can\'t directly counter S.E.L.M.A. (the device extends away from the wall surface)', 'Strong primary AR (AK-12) for entry frag', 'Smoke secondary gadget enables post-plant lineups'],
    counterPicks: ['Mute (jammers prevent S.E.L.M.A. detonation)', 'Kaid (Electroclaws on hatches limit Ace\'s flexibility)'],
    counterAdvice: 'On defense: Mute jammers placed within ~1m of a reinforced wall block S.E.L.M.A. detonation. Position jammers to cover both walls of a bomb pair if Ace is on the attacking team — one jammer often covers two walls.',
    howToClimb: 'Position S.E.L.M.A. on the wall section closest to where your team will exec — the device opens a hole big enough for entry. Pair Ace with Thatcher (clears Mute jammers) for max effectiveness. If Mute is unbanned, save your S.E.L.M.A. for a second wall after Mute jammer is destroyed.',
  },
  Thermite: {
    side: 'attack', role: 'Hard Breach', gadget: 'Brimstone BC-3 Exothermic Charge',
    gadgetDesc: 'Two Exothermic Charges that open large 2x2-meter holes in reinforced walls. Requires direct placement on the wall surface, making it counterable by Bandit/Kaid electricity.',
    primary: '556xi / M1014', secondary: 'M45 MEUSOC / 5.7 USG', secondaryGadget: 'Smoke Grenade / Stun Grenade', speed: '2-speed / 2-armor',
    intro: 'Thermite is the original R6 hard breacher and still a Plat+ staple. His Exothermic Charges open the largest holes of any breacher — 2x2 meters — perfect for full-team executions. The catch: Bandit batteries and Kaid Electroclaws disable his charges before detonation, so Thermite is functionally inseparable from Thatcher.',
    strengths: ['Largest breach hole in the game (2x2 meters)', 'Two charges enable double-breach setups (front wall + rotation wall)', 'Strong primary AR (556xi)', 'Smoke secondary enables post-plant'],
    counterPicks: ['Bandit (batteries trick the charge)', 'Kaid (Electroclaws have wider range)', 'Mute (jammer prevents activation)'],
    counterAdvice: 'On defense: Bandit-trick the wall on the count of Thermite\'s placement sound. Place battery within 1 second of hearing Thermite plant his charge — the battery shorts out the Exothermic. Practice this timing in Custom Game with a Thermite-equivalent attacker.',
    howToClimb: 'Always run Thermite with Thatcher when both unbanned. The combo: Thatcher EMPs at 1:50, Thermite places his charge at 1:48-1:47 (when Bandits are still flinching from EMP). Don\'t place Thermite charges if Mute jammer is on the wall — the charge gets denied. Always check for jammers via drone before placing.',
  },
  Hibana: {
    side: 'attack', role: 'Hard Breach', gadget: 'X-KAIROS Pellet Launcher',
    gadgetDesc: 'Six X-KAIROS pellets in three 2-pellet shots that pierce reinforced walls and create small holes. Activates after a 4-second timer.',
    primary: 'TYPE-89 / SUPERNOVA', secondary: 'BEARING 9 / P229', secondaryGadget: 'Smoke Grenade / Stun Grenade', speed: '3-speed / 1-armor',
    intro: 'Hibana is the speedier alternative to Thermite. Her X-KAIROS pellets pierce reinforced walls without needing flush placement, and the 4-second timer (vs Thermite\'s 5) gives slightly faster execs. Smaller hole means tighter executions but better for vertical breach setups.',
    strengths: ['3-speed mobility for fast peeks during exec', '4-second activation (faster than Thermite)', 'Pellets pierce walls without flush placement — works on awkward surfaces', 'Smoke / stun secondary enables varied utility'],
    counterPicks: ['Bandit (batteries trick pellets)', 'Kaid (wider Electroclaw range)', 'Mute (jammers block pellets)'],
    counterAdvice: 'On defense: Bandit-trick on the count of Hibana\'s pellet placement sound. Pellets activate ~4 seconds after attaching, so battery placement window is tight but doable. Mute jammers block pellets entirely if the pellets land within jammer range.',
    howToClimb: 'Use Hibana for vertical breach (floors and hatches) — her pellets work on more surface types than Thermite. Run with Thatcher for the EMP combo. On verticals, place pellets from above on a soft hatch reinforcement to drop on defenders below. Smoke secondary enables post-plant lineups; choose stun if your team needs flash util instead.',
  },
  Maverick: {
    side: 'attack', role: 'Soft / Silent Hard Breach', gadget: 'Suri Blowtorch',
    gadgetDesc: 'A blowtorch that silently cuts through reinforced walls, creating either murder holes (peek angles) or full breach paths. Cannot be denied by Bandit batteries — they don\'t affect the blowtorch.',
    primary: 'M4 / AR-15.50', secondary: 'M1911', secondaryGadget: 'Frag Grenades / Smoke Grenade', speed: '3-speed / 1-armor',
    intro: 'Maverick is the only operator who can silently breach reinforced walls without electronic counter-play. His blowtorch cuts at near-silent volume and bypasses Bandit / Kaid entirely. Banned in 60%+ of Plat+ matches because of his uncounterable utility.',
    strengths: ['Bypasses Bandit/Kaid entirely — no battery trick possible', 'Near-silent breach (defenders can\'t hear from far away)', 'Creates custom hole sizes — small murder hole or full breach', 'Frag secondary gadget for direct kills'],
    counterPicks: ['Mute (jammers don\'t block blowtorch but make Maverick noisier)', 'Aruni (Surya gates require breaking before Maverick can blowtorch through)'],
    counterAdvice: 'On defense: there\'s no electronic counter to Maverick. The only counters are Aruni Surya gates (which Maverick can still cut through but slowly) and audio awareness — when you hear blowtorch sound on a wall, immediately rotate to deny the murder hole. Some pro teams ban Maverick rather than try to counter him.',
    howToClimb: 'Maverick is best used for opening murder holes that defenders don\'t expect — small 1-pellet-sized holes that let you peek a single angle. Pair with Glaz or Kali for long-range Mira windows. For full breach, Maverick alone takes too long; use his murder holes to support Thermite or Hibana on the same wall.',
  },
  Sledge: {
    side: 'attack', role: 'Vertical Play / Soft Breach', gadget: 'Tactical Breaching Hammer',
    gadgetDesc: 'A breaching hammer that destroys soft walls and floors silently and instantly. 25 charges per round — effectively unlimited.',
    primary: 'L85A2 / M590A1', secondary: 'P226 MK 25', secondaryGadget: 'Frag Grenades / Stun Grenade', speed: '2-speed / 2-armor',
    intro: 'Sledge is the king of vertical play. His breaching hammer creates instant soft floor / wall holes for vertical drops, murder holes, and custom angles. Banned in 50%+ of Coastline / Skyscraper / Chalet matches because of his vertical destruction.',
    strengths: ['Unlimited soft breach charges (25 hammer hits)', 'Silent breach — defenders don\'t hear hammer like they hear breach charges', 'Frag secondary gadget for direct kills through soft walls', 'Strong AR (L85A2) for entry frag'],
    counterPicks: ['Mute (jammers don\'t block hammer but Sledge can\'t hatch through Mute-protected hatches if reinforced)', 'Maestro (Evil Eye on the floor below catches Sledge through soft floor)'],
    counterAdvice: 'On defense: reinforce floors above bomb sites if Sledge is on the attack. If reinforce isn\'t possible, place Maestro Evil Eyes on the floor below covering common vertical drop spots — Maestro\'s laser punishes Sledge through the soft floor. Goyo canisters on the floor below also work for vertical denial.',
    howToClimb: 'Memorize the standard vertical drop spots per map: Bank CEO from white stairs, Clubhouse Cash from bedroom, Kafe Cocktail from 3F. Drop a frag through the hole onto known anchor positions. Don\'t hammer randomly — vertical destruction without target wastes utility. Run with a hard breacher below for combined floor + wall pressure.',
  },
  Buck: {
    side: 'attack', role: 'Vertical Play / Soft Breach', gadget: 'Skeleton Key',
    gadgetDesc: 'An under-barrel shotgun (Skeleton Key) attached to his primary — destroys soft walls/floors and damages defenders at close range.',
    primary: 'C8-SFW / CAMRS', secondary: 'MK1 9MM', secondaryGadget: 'Frag Grenades / Stun Grenade', speed: '2-speed / 2-armor',
    intro: 'Buck is Sledge\'s long-range counterpart. His Skeleton Key shotgun creates soft breach holes from distance and works as a secondary kill-weapon. Strong on big maps with vertical play (Coastline, Skyscraper, Chalet).',
    strengths: ['Skeleton Key creates breach holes at distance (no need to be at the wall)', 'Camrs is a strong DMR for long-range picks', 'Frag secondary for direct kills', 'Works on both soft walls AND soft floors'],
    counterPicks: ['Mute (limits floor breach above protected hatches)', 'Maestro (Evil Eye below catches vertical Buck)'],
    counterAdvice: 'Same as Sledge — reinforce critical floors and place Maestro Evil Eyes below common vertical drop spots. Buck is slightly louder than Sledge (shotgun blast) so audio cues can warn defenders.',
    howToClimb: 'Use Buck for vertical play on maps with multiple floor levels (Coastline, Skyscraper). His Skeleton Key shoots from distance — he doesn\'t need to be flush with the floor to breach. Pair with a hard breacher for combined wall + floor exec. The Camrs DMR is excellent for long-range angle holds.',
  },
  Zofia: {
    side: 'attack', role: 'Soft Breach / Self-Revive Entry', gadget: 'KS79 LIFELINE',
    gadgetDesc: 'A grenade launcher that fires impact grenades (soft breach) and concussion grenades (disorients defenders). Plus the Withstand passive (self-revive).',
    primary: 'LMG-E / M762', secondary: 'RG15', secondaryGadget: 'Breach Charge / Claymore', speed: '2-speed / 2-armor',
    intro: 'Zofia is a versatile entry attacker with soft breach + concussion utility plus a unique self-revive (Withstand). Her LMG-E gives her sustained fire for entry duels, and her impact grenades create rotation paths.',
    strengths: ['Self-revive from down state (Withstand passive — once per round)', 'Both soft breach AND concussion utility in one gadget', 'LMG-E gives high mag size for entry duels', 'Versatile across maps'],
    counterPicks: ['Caveira (DBNO interrogate prevents Withstand activation)', 'Frost (mats keep Zofia in DBNO before she can self-revive)'],
    counterAdvice: 'On defense: Caveira interrogate denies Zofia\'s self-revive (the interrogate kills her in DBNO). Frost mats can also pin her down before she can self-revive. Don\'t rush a downed Zofia — let her bleed out or interrogate.',
    howToClimb: 'Use concussion grenades to disorient anchors during exec, then push through the disorientation window. Save Withstand passive for clutch 1v1s — don\'t commit to it as guaranteed revive. Impact grenades create soft breach paths for rotations and post-plant cover.',
  },
  Ash: {
    side: 'attack', role: 'Entry Fragger', gadget: 'M120 CREM Breaching Round',
    gadgetDesc: 'Two breaching rounds that punch a soft-breach hole at distance. Strong for clearing window/wall obstacles before pushing.',
    primary: 'R4-C / G36C', secondary: '5.7 USG / M45 MEUSOC', secondaryGadget: 'Breach Charge / Stun Grenade', speed: '3-speed / 1-armor',
    intro: 'Ash is the textbook entry fragger. 3-speed mobility + R4-C (one of the strongest ARs in the game) + breaching rounds for soft breach at distance. Plat+ players ban her for the speed/aim combo.',
    strengths: ['3-speed mobility — fastest peeks in the game', 'R4-C high recoil but high RPM = fastest TTK at close range', 'Breach rounds at distance allow surprise wall openings', 'Strong stun secondary'],
    counterPicks: ['Caveira (interrogate ends Ash plays)', 'Frost (mats catch her speed)', 'Pulse (heartbeat sensor reads her flank)'],
    counterAdvice: 'On defense: Ash dies fast but pushes faster. Pre-aim her common entry angles at head height — her 3-speed peek means she\'s usually first through the door. Caveira and Frost punish her over-commit habit.',
    howToClimb: 'Don\'t over-extend with Ash — her 1-armor means she dies in 1-2 bullets to most weapons. Use breach rounds to soft-breach from distance (window, wall) before peeking. Stun secondary is preferred over breach charge in most matchups for its denial value.',
  },
  Iana: {
    side: 'attack', role: 'Intel / Entry', gadget: 'Gemini Replicator',
    gadgetDesc: 'A holographic clone (Gemini) that runs into the site to gather intel. Can be destroyed by defenders but draws their fire and reveals positions.',
    primary: 'ARX200 / G36C', secondary: 'MK1 9MM', secondaryGadget: 'Smoke Grenade / Frag Grenade', speed: '2-speed / 2-armor',
    intro: 'Iana is intel-first attack. Her Gemini Replicator scouts site without risk, identifies defender positions, and bait gadgets like Maestro Evil Eyes. Strong on intel-dense maps where pre-exec info wins rounds.',
    strengths: ['Gemini provides risk-free site intel — no consequence if defender shoots it', 'Bait gadgets — defenders waste Maestro shots on the holo', 'ARX200 is a strong AR with great recoil control', 'Smoke / frag secondary for utility flexibility'],
    counterPicks: ['Mozzie (Pests destroy Iana\'s real drone, limiting her info)', 'Vigil (uncatchable on cam — Iana can\'t see him)'],
    counterAdvice: 'On defense: Mozzie Pests on common drone-entry windows kill Iana\'s real drone. Don\'t shoot Iana\'s Gemini holo unless you can\'t identify it — give it 2 seconds to confirm it\'s the holo, then ignore it.',
    howToClimb: 'Use Gemini for site exec intel — pop holo into the room, scan defender positions, push real Iana through the breach with team support. Don\'t use Gemini in the open air — it\'s too obvious as a fake.',
  },
  Twitch: {
    side: 'attack', role: 'Support / Utility Clear', gadget: 'Shock Drone',
    gadgetDesc: 'Two shock drones that fire small darts (5 charges each, 10 total) to destroy defender gadgets and damage operators. Replaces standard drone.',
    primary: 'F2 / 417', secondary: 'P9 / Luison', secondaryGadget: 'Smoke Grenade / Claymore', speed: '2-speed / 2-armor',
    intro: 'Twitch is the alternative to Thatcher for clearing defender gadgets. Her Shock Drones can\'t EMP electronics, but they can SHOOT them — Bandit batteries, Mira windows, Maestro Evil Eyes all get destroyed by a well-aimed dart.',
    strengths: ['Shock drones can clear gadgets through walls (you don\'t need line-of-sight to the gadget itself)', 'F2 is one of the highest-RPM ARs in the game', 'Drones can chain-clear multiple gadgets per round', 'Smoke / claymore secondary'],
    counterPicks: ['Mute (jammers block drone signals)', 'Mozzie (Pests can capture Twitch drones)'],
    counterAdvice: 'On defense: Mute jammers near key gadgets block Twitch drones from approaching. Mozzie Pests capture Twitch drones and make them work for the defenders. Watch for the small drone shape — destroy it with primary fire if it\'s near a gadget.',
    howToClimb: 'Master the Bandit-trick counter: shoot Bandit batteries with Twitch drone darts before Thermite places his charge. The drone doesn\'t need EMP timing — it can clear at any time. Save 2-3 darts for late-round Maestro / Mira clearing.',
  },
  Capitao: {
    side: 'attack', role: 'Area Denial', gadget: 'Tactical Crossbow',
    gadgetDesc: 'A crossbow with two ammo types: smoke bolts (creates instant smoke for 6 seconds) and asphyxiation bolts (fire damage in a wide area).',
    primary: 'PARA-308 / M249', secondary: 'PRB92', secondaryGadget: 'Frag Grenade / Claymore', speed: '2-speed / 2-armor',
    intro: 'Capitao denies anchor positions with fire bolts and creates instant smoke cover with smoke bolts. Strong on sites with predictable anchor spots where the fire bolt forces defenders out of position.',
    strengths: ['Fire bolts create area denial that doesn\'t expire (until destroyed)', 'Smoke bolts give instant cover (no 4-second wait like Smoke grenade)', 'PARA-308 is a strong AR with high damage', 'Versatile across attack scenarios'],
    counterPicks: ['Smoke (his canisters can clear Capitao fire bolts)', 'Goyo (Volcan shields counter Capitao fire denial)'],
    counterAdvice: 'On defense: most teams don\'t bother countering Capitao directly — instead they reposition off the anchor he targets. Smoke can clear his fire bolts, but it\'s a niche play.',
    howToClimb: 'Use fire bolts to force anchors off their default positions during exec. Save 1 fire bolt for late-round denial of post-plant defuse. Smoke bolts are excellent for instant cover during a coordinated rush — better than Smoke grenades because no fuse delay.',
  },
  Glaz: {
    side: 'attack', role: 'Sniper / Long-range Pick', gadget: 'OTs-03 Sniper',
    gadgetDesc: 'A semi-auto sniper rifle with a thermal scope that sees through smoke (when zoomed). Headshot 1-tap kill at any range.',
    primary: 'OTs-03', secondary: 'PMM / 9x19VSN', secondaryGadget: 'Smoke Grenade / Frag Grenade', speed: '2-speed / 2-armor',
    intro: 'Glaz is the only true sniper on attack. His OTs-03 1-taps any defender on a headshot, and the thermal scope reads heat signatures through Glaz-thrown smoke for free picks. Strong on long-sightline maps (Coastline, Border, Plane).',
    strengths: ['1-shot headshot kill at any range', 'Thermal scope sees through smoke (Glaz\'s own smoke grenades)', 'Long-range sightline control', 'Smoke secondary creates the smoke he can see through'],
    counterPicks: ['Smoke (his canisters block thermal scope)', 'Castle (barricades deny Glaz long sightlines)'],
    counterAdvice: 'On defense: don\'t hold long sightlines against Glaz unless you have hard cover. His thermal scope means smokes don\'t protect you. Castle barricades on common Glaz angles deny his sightlines entirely.',
    howToClimb: 'Throw your own smoke at site, then thermal-scope through it for free picks. Use long-sightline maps where Glaz can hold an angle from spawn through the site. Save smoke for the post-plant, not for entry — Glaz at long range with thermal scope is your strength.',
  },
  Fuze: {
    side: 'attack', role: 'Area Denial / Anti-Plant', gadget: 'APM-6 Cluster Charge',
    gadgetDesc: 'A wall-mounted device that fires 5 grenades through the wall in succession, exploding inside the room. Lethal to defenders who don\'t evacuate.',
    primary: 'BALLISTIC SHIELD / AK-12', secondary: '6P9', secondaryGadget: 'Frag Grenade / Smoke Grenade', speed: '1-speed / 3-armor',
    intro: 'Fuze is the area-denial king. His Cluster Charge fires 5 grenades into a room over 3 seconds — defenders either evacuate or die. Plat+ Fuze plays around hostage modes (where defenders can\'t evacuate) and post-plant denial.',
    strengths: ['Cluster Charge is uncounterable except by leaving the room', 'Strong against stacked anchor positions', 'Ballistic shield primary for safe peeks', 'High armor (3) for sustained fire'],
    counterPicks: ['Castle (barricades force Fuze to find different walls)', 'Bandit (batteries on the wall trick the cluster charge)'],
    counterAdvice: 'On defense: when you hear the Cluster Charge attaching sound, evacuate the room immediately. Don\'t hold position. Bandit batteries on key walls trick the device. Castle barricades on commonly-used Fuze walls force him to find alternates.',
    howToClimb: 'Use Cluster Charge on sites with stacked defenders or in hostage modes (defenders can\'t evac). Place on the wall AND the floor above — vertical Fuze charges catch defenders on the floor below. Pair with Thermite/Hibana to combine wall breach with cluster spray.',
  },
  Lion: {
    side: 'attack', role: 'Intel / Pick', gadget: 'EE-ONE-D Drone',
    gadgetDesc: 'A drone that activates a global scan revealing every moving defender on the map for 4 seconds. Defenders must hold still to avoid detection.',
    primary: 'V308 / 417', secondary: 'LFP586', secondaryGadget: 'Stun Grenade / Claymore', speed: '2-speed / 2-armor',
    intro: 'Lion provides global intel via his drone scan. Defenders must freeze in place to avoid detection — those who keep moving get pinged for the team. Strong against mobile roamers and during exec phases.',
    strengths: ['Global scan reveals all moving defenders', 'Forces defenders into corners and freezes their rotations', 'Strong primary AR (V308)', 'Stun / claymore secondary'],
    counterPicks: ['Vigil (3-second cloak nullifies Lion scan)', 'Caveira (Silent Step makes her hard to scan even with movement)'],
    counterAdvice: 'On defense: when you hear Lion scan activating, freeze in place. Don\'t move for 4 seconds even if you\'re mid-fight. Vigil hard-counters Lion with his cloak ability. Mute jammers block Lion drone deployment.',
    howToClimb: 'Time Lion scans for the moment defenders are most likely to be repositioning — early round (1:30 mark) when roamers are moving to flanks, or late round (1:00 mark) when defenders rotate to plant denial. Coordinate with team to push during the scan window — defenders frozen for 4 seconds = free entry.',
  },
  Nomad: {
    side: 'attack', role: 'Flank Watch / Anti-Roam', gadget: 'Airjab Launcher',
    gadgetDesc: 'Three Airjabs that proximity-trigger and knock back defenders. Stops roams in their tracks.',
    primary: 'AK-74M / ARX200', secondary: 'PRB92', secondaryGadget: 'Stun Grenade / Breach Charge', speed: '2-speed / 2-armor',
    intro: 'Nomad denies flank routes and roamer plays. Her Airjabs proximity-trigger when defenders cross — knocks them down for 4 seconds, denying their roam attempt. Strong on big maps with long flank routes.',
    strengths: ['Proximity-triggered Airjabs catch roamers without line-of-sight', 'AK-74M is a high-recoil but high-damage AR', 'Three Airjabs cover three flank routes per round', 'Stun secondary'],
    counterPicks: ['Mozzie (Pests find Airjabs and destroy them)', 'Caveira (Silent Step doesn\'t trigger Airjabs)'],
    counterAdvice: 'On defense: Mozzie Pests can find and destroy Airjabs. Caveira can sneak past Airjabs without triggering them (Silent Step). If you must cross an Airjab area, peek wide first to identify the device — they\'re visible from cover.',
    howToClimb: 'Place Airjabs on standard roam routes — between the bomb pair, at hatches, on the rotation paths. Use them defensively to deny enemy flanks during your team\'s exec. Coordinate with Lion for combined intel + denial.',
  },
  Kali: {
    side: 'attack', role: 'Sniper / Hard Breach Support', gadget: 'CSRX 300',
    gadgetDesc: 'A bolt-action sniper that 1-shots if hitting the head. Plus a passive that deletes Bandit batteries / Kaid Electroclaws when hit through the wall.',
    primary: 'CSRX 300', secondary: 'C75 AUTO / SPSMG9', secondaryGadget: 'Stun Grenade / Claymore', speed: '2-speed / 2-armor',
    intro: 'Kali is a long-range sniper with a unique anti-electronic passive. Her CSRX 300 1-shots on headshots, and her bullets pierce reinforced walls to destroy Bandit batteries on the other side — making her a hard-breach enabler.',
    strengths: ['1-shot headshot kill', 'Wall-piercing rounds destroy Bandit batteries', 'Strong long-range pick option', 'Stun / claymore secondary'],
    counterPicks: ['Smoke (canisters block long sightlines)', 'Castle (barricades deny Kali angles)'],
    counterAdvice: 'On defense: don\'t hold long sightlines against Kali. If she\'s on attack, Bandit-tricking the wall is risky — Kali can shoot through and destroy your battery. Use Mute jammers on key walls instead, or Kaid for wider Electroclaw range.',
    howToClimb: 'Use Kali for hard-breach support on Bandit-heavy walls. Coordinate with Thermite/Hibana — Kali clears Bandit batteries through the wall, breacher places charge in the cleared window. Strong long-range angle holder on Coastline / Border.',
  },
  Dokkaebi: {
    side: 'attack', role: 'Intel / Cam Hack', gadget: 'Logic Bomb',
    gadgetDesc: 'A device that calls every defender\'s phone simultaneously, revealing their position via the phone vibration. Plus passive: hacks defender cams when she kills a defender.',
    primary: 'BOSG.12.2 / Mk 14 EBR', secondary: 'C75 AUTO / SMG-12', secondaryGadget: 'Stun Grenade / Frag Grenade', speed: '3-speed / 1-armor',
    intro: 'Dokkaebi provides forced intel via her phone call ability. Defenders must shoot their phones to silence them — revealing their position. Plus the passive cam-hack on kill makes her information-dense.',
    strengths: ['Logic Bomb forces defenders to reveal positions', 'Cam hack on kill exposes defender setups', 'BOSG shotgun is a one-tap close-range', '3-speed mobility'],
    counterPicks: ['Mute (jammers block phone activation)', 'Vigil (cloak nullifies phone reveal)'],
    counterAdvice: 'On defense: Mute jammers near defenders block Dokkaebi phone activation. Vigil\'s cloak nullifies the phone signal. If your phone rings, shoot it immediately to silence.',
    howToClimb: 'Use Logic Bomb at the start of round to find roamer positions. Save phone activation for late round when defenders are setting up plant denial. Coordinate with Lion for combined intel ult.',
  },
  Finka: {
    side: 'attack', role: 'Support / Buff', gadget: 'Adrenal Surge',
    gadgetDesc: 'A team-wide nano-shot that revives down teammates, restores all teammates\' health, and increases their movement speed for 20 seconds.',
    primary: 'SPEAR .308 / 6P41', secondary: 'PMM / GSh-18', secondaryGadget: 'Stun Grenade / Smoke Grenade', speed: '2-speed / 2-armor',
    intro: 'Finka buffs the entire team. Her Adrenal Surge revives downed teammates, restores HP, and gives a 20-second speed boost. Strong on coordinated execs where her buff timing aligns with the team push.',
    strengths: ['Team-wide buff (revives + heals + speed)', 'Strong primary (SPEAR .308)', 'Multiple Adrenal Surge charges (2 per round)', 'Versatile across attack scenarios'],
    counterPicks: ['Smoke (canisters disrupt buffed pushes)', 'Caveira (interrogate denies Finka self-revive)'],
    counterAdvice: 'On defense: Finka\'s buff makes the team faster and harder to kill. Don\'t engage during the speed window unless you have positional advantage. Smoke canisters on the choke deny their push during the buff.',
    howToClimb: 'Time Adrenal Surges with team execs — buff right before the breach for max push effect. Save 1 surge for late-round revives (down teammates auto-revive). Don\'t buff for solo plays — the team-wide effect is wasted.',
  },
  Ying: {
    side: 'attack', role: 'Soft Breach / Flash', gadget: 'Candela',
    gadgetDesc: 'Three Candela cluster grenades that flash defenders 4 times in succession. Each Candela = 4 individual flashes. Plus passive that lets her flash through soft floors and walls.',
    primary: 'T-95 LSW / SIX12', secondary: 'Q-929', secondaryGadget: 'Smoke Grenade / Stun Grenade', speed: '2-speed / 2-armor',
    intro: 'Ying is the master of disorientation. Her Candela cluster flashes any defender she rolls them at, and the passive lets her flash through soft floors. Strong on coordinated execs where flash timing wins the duel.',
    strengths: ['Candela flashes 4 times in succession — defenders can\'t fully recover between', 'Three Candela charges = 12 individual flashes per round', 'Flashes work through soft floors (vertical play)', 'Strong primary LMG (T-95 LSW)'],
    counterPicks: ['Echo (Yokai disorients Ying mid-flash)', 'Mute (jammers block Candela rolling activation)'],
    counterAdvice: 'On defense: when you hear Candela rolling sound, look at the floor or turn around. Echo Yokai disorients can interrupt Ying\'s flash play. Stay behind cover during exec — Candela flashes don\'t penetrate solid walls.',
    howToClimb: 'Roll Candelas through doorways before pushing — the 4-flash chain disorients defenders for 6+ seconds. Use the soft-floor passive on vertical execs (Bank CEO, Clubhouse Cash) — flash defenders below before dropping. Save 1 Candela for post-plant defuse cover.',
  },
  Zero: {
    side: 'attack', role: 'Intel / Cam', gadget: 'ARGUS Launcher',
    gadgetDesc: 'A camera launcher that fires Argus cams that pierce reinforced walls and provide intel from inside the site. Cameras can be destroyed but provide map-control intel.',
    primary: 'SC3000K / MP7', secondary: '5.7 USG', secondaryGadget: 'Frag Grenade / Hard Breach Charge', speed: '2-speed / 2-armor',
    intro: 'Zero (Sam Fisher) is intel-first attack. His Argus cameras pierce reinforced walls — placing them on common defender holding spots gives free pre-exec intel. Plus he has access to a hard breach charge as secondary gadget.',
    strengths: ['Argus cameras provide intel through reinforced walls', 'Hard breach charge secondary (small breach hole)', 'SC3000K is a strong AR', '5 cameras per round = 5 intel windows'],
    counterPicks: ['Mute (jammers block Argus deployment)', 'Mozzie (Pests can\'t catch Argus but defenders can shoot them)'],
    counterAdvice: 'On defense: Mute jammers near common Argus placement spots block deployment. Watch for the small camera lens — shoot on sight if positioned in your sightline.',
    howToClimb: 'Place Argus cameras on bomb pair walls and rotation room walls before exec. The cameras give intel that doesn\'t require risking your real drone. Use the hard breach charge as a backup when Thermite/Hibana are denied.',
  },
  Flores: {
    side: 'attack', role: 'Utility Clear / Anti-Gadget', gadget: 'RCE-Ratero Charge',
    gadgetDesc: 'Three remote-controlled drones that explode after a 10-second delay or on detonate. Used to clear gadgets safely without exposing yourself.',
    primary: 'AR33 / SR-25', secondary: 'GSh-18', secondaryGadget: 'Stun Grenade / Claymore', speed: '2-speed / 2-armor',
    intro: 'Flores is the safer alternative to Twitch for utility clearing. His RCE-Ratero drones drive into the site and detonate, destroying any gadget in their explosion radius. Plat+ players ban him on coordinated executions because he clears Mira windows / Maestros uncounterably.',
    strengths: ['Remote-controlled drones — clears gadgets without line-of-sight', 'Three drones per round = three clearing opportunities', 'AR33 is a strong AR for entry frag', 'Stun / claymore secondary'],
    counterPicks: ['Mute (jammers block drone control signals)', 'Mozzie (Pests capture Flores drones if positioned)'],
    counterAdvice: 'On defense: Mute jammers block Flores\'s drone control. When you hear the RCE-Ratero entering, shoot the drone on sight — they\'re bigger than standard drones and easier to hit.',
    howToClimb: 'Use Flores drones to clear Mira windows, Maestro Evil Eyes, and Bandit batteries that other utility can\'t reach. Drive the drone into the gadget and detonate. Save 1 drone for late-round defender frags — the explosion damages defenders within 2m.',
  },
  Gridlock: {
    side: 'attack', role: 'Area Denial / Flank Watch', gadget: 'Trax Stinger',
    gadgetDesc: 'A trap-launching gadget that scatters spiked traps across an area. Defenders walking through take damage and slow down. Plus has the F90 LMG.',
    primary: 'F90 / M249 SAW', secondary: 'SUPER SHORTY', secondaryGadget: 'Smoke Grenade / Frag Grenade', speed: '1-speed / 3-armor',
    intro: 'Gridlock denies large areas with her Trax Stingers. Three Trax devices scatter spiked traps across rotation routes, denying flanks and forcing defenders into specific paths. Strong on big maps with long flank routes.',
    strengths: ['Three Trax per round = wide area coverage', 'Spikes damage defenders + slow movement', 'F90 LMG for sustained fire', '3-armor for tankiness'],
    counterPicks: ['Mozzie (Pests can\'t affect Trax but defenders can shoot the launcher)', 'Frost (mats counter Gridlock\'s area denial with their own area denial)'],
    counterAdvice: 'On defense: shoot Trax launchers on sight (they\'re visible from a distance). Avoid spiked areas — Trax doesn\'t expire, so defenders must take alternate routes. Frost mats can be placed in rotation paths Gridlock doesn\'t cover.',
    howToClimb: 'Use Trax to deny defender flank routes during your team\'s exec. Place on the rotation room between the bomb pair walls. Coordinate with Lion / Nomad for combined intel + denial.',
  },

  // ===== DEFENSE =====
  Alibi: {
    side: 'defense', role: 'Roam / Intel', gadget: 'Prisma',
    gadgetDesc: 'Three Prisma decoys that look like Alibi when activated. Reveals attackers who shoot the decoy. Plus a passive that detects attackers who cross specific cameras.',
    primary: 'MX4 STORM / ACS12', secondary: 'BAILIFF 410 / KERATOS .357', secondaryGadget: 'Impact Grenade / Proximity Alarm', speed: '3-speed / 1-armor',
    intro: 'Alibi is the bait-and-pick defender. Her Prisma decoys look exactly like her — attackers shooting them get pinged for the team. Plus the 3-speed mobility makes her one of the strongest aggressive roamers.',
    strengths: ['Prisma decoys bait shots and reveal attacker positions', 'Three Prismas = three intel-bait zones', '3-speed mobility for flank plays', 'Strong primary SMG (MX4 STORM)'],
    counterPicks: ['Lion (scan reveals real Alibi vs decoy)', 'IQ (electronics scanner finds Prismas)'],
    counterAdvice: 'On attack: Lion scan reveals the real Alibi (decoys don\'t move). IQ scanner finds Prismas through walls. Don\'t waste shots on decoys — verify with drone first.',
    howToClimb: 'Place Prismas in roam-watch positions — when attackers see them and shoot, you get free intel. Use Alibi\'s 3-speed for flank plays after baiting attacker utility on decoys. Save 1 Prisma for late-round positioning to fake your real position.',
  },
  Mira: {
    side: 'defense', role: 'Intel / Anchor', gadget: 'Black Mirror',
    gadgetDesc: 'Two Black Mirror gadgets that create one-way bulletproof windows on reinforced walls. Defenders see through; attackers see only mirror reflection.',
    primary: 'VECTOR .45 ACP / ITA12L', secondary: 'USP40', secondaryGadget: 'Nitro Cell / Proximity Alarm', speed: '2-speed / 2-armor',
    intro: 'Mira is the strongest intel anchor in the game. Her Black Mirror windows give defenders bulletproof intel through reinforced walls. Banned in 70%+ of Plat+ matches because her information advantage is round-deciding.',
    strengths: ['Bulletproof one-way intel through reinforced walls', 'Two Black Mirrors = two intel windows per round', 'Strong primary (VECTOR .45 ACP)', 'Nitro Cell secondary for area denial'],
    counterPicks: ['Twitch (drones shoot Mira from outside)', 'Flores (RCE drones detonate near Mira)', 'Maverick (blowtorch through Mira reinforcement near canister)'],
    counterAdvice: 'On attack: Twitch drone darts can shoot the canister at the bottom of a Mira window through soft surfaces — destroys the Mira. Flores RCE drones detonate near Mira to clear them. Maverick can blowtorch the wall near a Mira window to expose her.',
    howToClimb: 'Place Mira windows on non-obvious walls — between rotation rooms, on the wall opposite the obvious bomb-pair wall. The non-standard placement reads attacker pushes 4-5 seconds before they realize what\'s happening. Drop the canister late — wait until attackers commit utility, then drop the canister to surprise them.',
  },
  Bandit: {
    side: 'defense', role: 'Anti-Breach', gadget: 'CED-1 Shock Wire',
    gadgetDesc: 'Four batteries that electrify any reinforced wall they\'re placed on. Disrupts Thermite/Hibana/Ace charges. Three-second active time before depletion.',
    primary: 'MP7 / M870', secondary: 'B-9 / P12', secondaryGadget: 'Nitro Cell / Barbed Wire', speed: '3-speed / 1-armor',
    intro: 'Bandit is the original anti-breach defender. His batteries electrify reinforced walls, denying Thermite, Hibana, and Ace breach charges. Banned in 50%+ of Plat+ matches when Thatcher is unbanned.',
    strengths: ['Four batteries per round = four wall protections', '3-speed mobility for tricking + roaming', 'MP7 is a strong SMG', 'Nitro Cell secondary for area denial'],
    counterPicks: ['Thatcher (EMP clears all Bandit batteries)', 'Twitch (drone darts destroy batteries)', 'Maverick (silent blowtorch bypasses batteries)'],
    counterAdvice: 'On attack: bring Thatcher always. EMP at 1:50 timer clears all Bandit batteries on a wall. Twitch drone is the alt-counter — darts destroy batteries on walls Thatcher can\'t reach.',
    howToClimb: 'Master the Bandit trick: place battery on the wall RIGHT before Hibana/Thermite/Ace places their charge. The trick window is 1-2 seconds — too early and the battery depletes; too late and the charge has already detonated. Practice in Custom Game.',
  },
  Kaid: {
    side: 'defense', role: 'Anti-Breach (Wide Range)', gadget: 'Rtila Electroclaw',
    gadgetDesc: 'Three Electroclaws that electrify reinforced walls AND hatches in a wider range than Bandit batteries. Easier to deploy on hatches.',
    primary: 'TCSG12 / AUG A2', secondary: '.44 MAG SEMI-AUTO / LFP586', secondaryGadget: 'Nitro Cell / Barbed Wire', speed: '1-speed / 3-armor',
    intro: 'Kaid is Bandit\'s wider-range cousin. His Electroclaws electrify multiple wall sections + hatches simultaneously, making him easier to deploy on vertical maps. Stronger than Bandit on Coastline, Skyscraper, Bank.',
    strengths: ['Wider Electroclaw range than Bandit batteries (covers 2 walls if positioned right)', 'Electrifies hatches AND walls', '3-armor for tankiness', 'TCSG12 is a strong shotgun'],
    counterPicks: ['Thatcher (EMP clears Electroclaws)', 'Twitch (drone darts destroy them)', 'Maverick (silent breach bypasses)'],
    counterAdvice: 'On attack: same as Bandit — bring Thatcher. Kaid\'s wider range means EMPs need to be placed precisely. Twitch drone darts destroy individual Electroclaws if Thatcher EMPs are limited.',
    howToClimb: 'Use Kaid on maps with multiple electrification needs — Bank (CEO + Tellers walls), Coastline (Hookah + Theater), Clubhouse (Cash + Stock). His wider range covers more positions per Electroclaw than Bandit per battery.',
  },
  Mute: {
    side: 'defense', role: 'Intel Denial / Anti-Breach', gadget: 'Moni Disruptor',
    gadgetDesc: 'Four signal disruptors that block enemy electronic signals (drones, breach charges, Twitch drones, Maestro\'s wider area). Don\'t electrify walls but block signals.',
    primary: 'MP5K / M590A1', secondary: 'P226 MK 25', secondaryGadget: 'Nitro Cell / Barbed Wire', speed: '2-speed / 2-armor',
    intro: 'Mute is the dual-purpose defender. His jammers block enemy drones (denying intel) AND prevent Thatcher EMPs from disabling key gadgets. Strong support pick alongside Bandit/Kaid.',
    strengths: ['Four jammers per round = four intel-denial zones', 'Blocks Thatcher EMPs near key gadgets', 'Strong primary SMG (MP5K)', 'Nitro Cell secondary'],
    counterPicks: ['IQ (electronics scanner finds jammers)', 'Twitch (drones destroy jammers from outside)'],
    counterAdvice: 'On attack: IQ\'s electronics scanner finds Mute jammers through walls. Twitch drone darts destroy jammers without needing line-of-sight. Some teams use Flores RCE drones to clear jammers via explosion.',
    howToClimb: 'Place Mute jammers near reinforced walls to block both Thatcher EMPs AND drones. Position one jammer near the bomb default plant — denies attacker drone clearing. Save 1 jammer for late-round repositioning if needed.',
  },
  Maestro: {
    side: 'defense', role: 'Intel / Damage', gadget: 'Evil Eye',
    gadgetDesc: 'Two Evil Eye cameras with bulletproof shells. They shoot lasers that damage attackers and provide intel. Bulletproof — can\'t be destroyed except by specific gadgets.',
    primary: 'ALDA 5.56 / M590A1', secondary: 'BAILIFF 410 / Keratos .357', secondaryGadget: 'Impact Grenade / Barbed Wire', speed: '1-speed / 3-armor',
    intro: 'Maestro is intel-and-damage in one. His Evil Eyes provide bulletproof cameras that deal damage to anyone Maestro shoots through them. Strong on sites with predictable plant spots — Maestro punishes the planter.',
    strengths: ['Bulletproof cameras — can\'t be shot through normally', 'Lasers damage attackers (chips them down for plant denial)', 'Two Evil Eyes per round', 'Strong primary LMG (ALDA 5.56)'],
    counterPicks: ['Twitch (drones can shoot Maestro lasers off when active)', 'Flores (RCE drones detonate Maestros)', 'Glaz (thermal scope sees Maestro target zones)'],
    counterAdvice: 'On attack: Twitch drone darts disable Maestro lasers when they\'re active. Flores drones detonate Maestros via explosion. Maverick can blowtorch the wall near a Maestro to expose it.',
    howToClimb: 'Place Evil Eyes on commonly-planted bomb spots — defenders shoot the laser at the planter through the camera. Position one Evil Eye on the wall where Maestro himself can shoot through it for double-damage. Save laser shots for the post-plant defuse window.',
  },
  Smoke: {
    side: 'defense', role: 'Area Denial / Plant Denial', gadget: 'Compound Z8 Gas Canister',
    gadgetDesc: 'Three remote-detonatable gas canisters that release toxic gas, dealing damage to anyone in the radius. Dense gas, lasts ~10 seconds.',
    primary: 'FMG-9 / M590A1', secondary: 'P226 MK 25 / SMG-11', secondaryGadget: 'Nitro Cell / Barbed Wire', speed: '2-speed / 2-armor',
    intro: 'Smoke is the post-plant denier. His gas canisters delay defuse and force attackers to reposition. Banned in 30%+ of late-round-heavy matches because his gas wins overtime rounds.',
    strengths: ['Gas damages attackers + forces reposition', 'Three canisters = three plant-denial windows', 'Strong primary SMG (FMG-9)', 'Nitro Cell secondary for area denial'],
    counterPicks: ['Lion (scan reveals Smoke positioning)', 'Capitao (fire bolts can clear gas)'],
    counterAdvice: 'On attack: when you see gas deploying, retreat to non-gas terrain immediately. Don\'t commit defuse through gas unless you have full HP. Capitao fire bolts can clear gas in a small radius.',
    howToClimb: 'Save gas for the post-plant defuse window. Detonate canisters as the planter approaches the bomb — forces them to abandon plant or take damage. Coordinate with Maestro for combined gas + laser denial.',
  },
  Jager: {
    side: 'defense', role: 'Utility Denial', gadget: 'ADS-MK IV "Magpie"',
    gadgetDesc: 'Three ADS gadgets that intercept thrown projectiles (grenades, breach charges, smoke grenades) within their radius. Each ADS can intercept 2 projectiles before deactivating.',
    primary: '416-C CARBINE / M870', secondary: 'P12 / SMG-12', secondaryGadget: 'Bulletproof Camera / Impact Grenade', speed: '3-speed / 1-armor',
    intro: 'Jager denies attacker utility — flashes, smokes, frag grenades all get intercepted. Strong on sites where attackers rely on flash/smoke utility for entry. Banned occasionally in coordinated exec metas.',
    strengths: ['Three ADS units = up to 6 projectile intercepts per round', '3-speed mobility for repositioning', 'Strong primary AR (416-C)', 'Versatile secondary gadgets'],
    counterPicks: ['Twitch (drones shoot ADS units)', 'IQ (scanner finds ADS through walls)', 'Thatcher (EMP disables ADS for 9 seconds)'],
    counterAdvice: 'On attack: Twitch drone darts destroy ADS units. Thatcher EMPs disable them temporarily. Throw multiple grenades simultaneously — ADS can only intercept 2 projectiles before depletion.',
    howToClimb: 'Place ADS units near key choke points where attackers throw flashes/smokes for exec. Position one near the bomb default plant for late-round nitro denial. Don\'t cluster ADS units — spread them across the site.',
  },
  Valkyrie: {
    side: 'defense', role: 'Intel / Roam', gadget: 'Black Eye Camera',
    gadgetDesc: 'Three sticky cameras that can be thrown anywhere on the map (including outside the site). Provides external intel for spawn-peek + flank reads.',
    primary: 'MPX / SPAS-12', secondary: 'D-50', secondaryGadget: 'Nitro Cell / Impact Grenade', speed: '2-speed / 2-armor',
    intro: 'Valkyrie is external-intel. Her Black Eye cameras can be thrown outside the site for spawn-peek reads. Banned in 60%+ of Plat+ matches because her intel + roaming aggression wins rounds.',
    strengths: ['Throwable cameras give external intel (spawn area, rooftops)', 'Three cameras = three intel angles', 'Nitro Cell for area denial', 'Strong primary SMG (MPX)'],
    counterPicks: ['Iana (Gemini draws Valkyrie shots)', 'Twitch (drones destroy Black Eye cameras)', 'Dokkaebi (cam hack on kill exposes camera positions)'],
    counterAdvice: 'On attack: drone every common camera placement spot before exec. Twitch drones can destroy cameras through walls (drone darts pierce). Don\'t expose to Valkyrie\'s known camera angles during exec.',
    howToClimb: 'Throw cameras outside the site for spawn-area intel — read attacker spawns and rotation directions. Position one camera in the bomb room for plant-denial intel. Save 1 camera for late-round repositioning.',
  },
  Echo: {
    side: 'defense', role: 'Intel / Plant Denial', gadget: 'Yokai Hover Drone',
    gadgetDesc: 'Two Yokai drones that hover on ceilings and emit sonic blasts that disorient attackers (5-second disorientation). Plus provides intel.',
    primary: 'SUPERNOVA / MP5SD', secondary: 'BEARING 9 / P229', secondaryGadget: 'Impact Grenade / Deployable Shield', speed: '1-speed / 3-armor',
    intro: 'Echo is the plant denier. His Yokai drones disorient defuse attempts via sonic blasts, denying plant for the full 45-second timer. Strong on sites with predictable defuse spots.',
    strengths: ['Yokai sonic blast disorients attackers (similar to Ying flash)', 'Two drones = two plant-denial windows', '3-armor for tankiness', 'Strong primary shotgun (SUPERNOVA)'],
    counterPicks: ['Twitch (drones destroy Yokai)', 'Dokkaebi (cam hack on kill exposes Yokai positions)', 'IQ (scanner finds Yokai through walls)'],
    counterAdvice: 'On attack: drone every ceiling for Yokai placements. Twitch drones can destroy Yokai mid-flight. IQ scanner finds Yokai through walls. Plant the bomb in a spot Yokai can\'t reach (under overhangs).',
    howToClimb: 'Place Yokai drones near common plant spots. Save sonic blasts for the post-plant defuse window. Position one Yokai high on a wall for general intel; one ceiling-mounted near the plant for denial.',
  },
  Pulse: {
    side: 'defense', role: 'Intel / Vertical Read', gadget: 'HB-5 Cardiac Sensor',
    gadgetDesc: 'A heartbeat sensor that detects nearby attackers through walls and floors (10-meter range). Gives directional + distance intel.',
    primary: 'M1014 / UMP45', secondary: 'M45 MEUSOC / 5.7 USG', secondaryGadget: 'Nitro Cell / Barbed Wire', speed: '2-speed / 2-armor',
    intro: 'Pulse is anti-vertical. His heartbeat sensor detects attackers through walls and floors, making him strong on multi-floor maps. Counter to Sledge/Buck vertical play.',
    strengths: ['Heartbeat sensor sees through walls AND floors', 'Strong primary shotgun (M1014)', 'Nitro Cell secondary (often for vertical kills via floor)', '2-speed / 2-armor balance'],
    counterPicks: ['Twitch (drones detect Pulse positions)', 'Lion (scan reveals Pulse movement)', 'Vigil (Pulse passive blocks Pulse sensor — Pulse vs Pulse mirror)'],
    counterAdvice: 'On attack: assume Pulse is below the bomb site if vertical play is strong on the map. Use Lion to scan Pulse positions. Vigil\'s passive blocks Pulse sensor — strong counter-pick.',
    howToClimb: 'Position Pulse on the floor below or above the bomb site for vertical reads. Use heartbeat sensor for late-round plant detection — sensor reveals planter\'s position. Nitro Cell on the floor below for vertical kills on attackers crossing.',
  },
  Lesion: {
    side: 'defense', role: 'Intel / Damage / Slow', gadget: 'Gu Mine',
    gadgetDesc: 'Eight invisible mines that damage attackers and slow them for 7 seconds when stepped on. Mines deploy gradually (one every 30 seconds during the round).',
    primary: 'T-5 SMG / SIX12 SD', secondary: 'Q-929', secondaryGadget: 'Bulletproof Camera / Impact Grenade', speed: '2-speed / 2-armor',
    intro: 'Lesion provides distributed intel + damage via Gu mines. Eight mines spread across the site catch flanking attackers and slow them for safe trade kills. Strong on big maps with multiple flank routes.',
    strengths: ['Eight Gu mines = wide-area coverage', 'Mines damage AND slow attackers', 'Invisible until stepped on', 'Strong primary (T-5 SMG)'],
    counterPicks: ['IQ (scanner finds Gu mines through walls)', 'Twitch (drones destroy mines)', 'Mozzie (Pests can\'t affect mines but can spot them)'],
    counterAdvice: 'On attack: IQ scans common rotation paths to find Gu mines. Twitch drone darts destroy mines safely. If you step on a Gu mine, take cover for 7 seconds — the slow makes you a free kill if you keep moving.',
    howToClimb: 'Place Gu mines on rotation routes between the bomb pair. Save 2-3 mines for late-round plant denial — the slow on the planter denies defuse attempt. Coordinate with Maestro for combined intel + damage.',
  },
  Caveira: {
    side: 'defense', role: 'Roam / Intel', gadget: 'Silent Step',
    gadgetDesc: 'Passive — Caveira moves silently when activated. Plus the Luison pistol that puts attackers in DBNO instead of killing, allowing interrogate (which reveals all attackers\' positions).',
    primary: 'M12 / SPAS-15', secondary: 'Luison', secondaryGadget: 'Barbed Wire / Impact Grenade', speed: '3-speed / 1-armor',
    intro: 'Caveira is the silent roamer. Silent Step lets her sneak up on attackers, and her Luison pistol puts them in DBNO for interrogate — revealing all teammate positions. Plat+ players ban her for the information advantage.',
    strengths: ['Silent footsteps for surprise flanks', 'Luison interrogate reveals all attacker positions', '3-speed mobility', 'Strong primary (M12)'],
    counterPicks: ['Lion (scan reveals Caveira even with Silent Step partial)', 'Iana (Gemini draws Caveira shots)'],
    counterAdvice: 'On attack: bring Lion for scans — even with Silent Step, Lion reveals Caveira during scan window. Don\'t solo-flank — Caveira interrogate kills isolated attackers. If you go DBNO to Caveira, expect interrogate.',
    howToClimb: 'Use Silent Step to flank attackers from spawn-side. Get Luison kills early in the round — interrogate reveals attacker positions for the rest of the team. Don\'t use Luison kills late round — too risky.',
  },
  Ela: {
    side: 'defense', role: 'Roam / Mine', gadget: 'GRZMOT Mine',
    gadgetDesc: 'Three GRZMOT (concussion) mines that disorient attackers when triggered. Sticks to walls and floors. 5-second disorientation per mine.',
    primary: 'SCORPION EVO 3 A1 / FO-12', secondary: 'RG15', secondaryGadget: 'Deployable Shield / Impact Grenade', speed: '3-speed / 1-armor',
    intro: 'Ela is the aggressive roamer. Her GRZMOT mines disorient attackers + provide intel. Pair with her own concussion-resistant scope for free roam picks. Strong on big maps.',
    strengths: ['Three GRZMOT mines = three disorientation traps', 'Mines provide intel when triggered', '3-speed mobility', 'Scorpion EVO is a high-RPM SMG'],
    counterPicks: ['Lion (scan finds Ela)', 'Iana (Gemini draws Ela shots)', 'Twitch (drones destroy GRZMOT mines)'],
    counterAdvice: 'On attack: drone rotation paths for GRZMOT mines. Twitch drones destroy them. If you trigger a mine, go behind cover for 5 seconds — you\'re vulnerable.',
    howToClimb: 'Place GRZMOT mines on common attacker rotation paths. Stay close to mines — when triggered, push the disoriented attacker for free trade kills. Use Scorpion EVO\'s high RPM for close-range duels.',
  },
  Vigil: {
    side: 'defense', role: 'Roam / Anti-Drone', gadget: 'ERC-7 Disruptor',
    gadgetDesc: 'A passive that cloaks Vigil from attacker drones and Lion scans for 6 seconds at a time. Recharges between uses.',
    primary: 'K1A / BOSG.12.2', secondary: 'C75 AUTO / SMG-12', secondaryGadget: 'Bulletproof Camera / Impact Grenade', speed: '3-speed / 1-armor',
    intro: 'Vigil is the cloaked roamer. His ERC-7 makes him invisible to attacker drones AND Lion scans for 6-second windows. Strong against drone-heavy attack comps.',
    strengths: ['Cloak vs all attacker intel (drones + Lion + Iana scans)', '3-speed mobility for flanking', 'Strong primary (K1A)', 'Cloak recharges — can be used multiple times per round'],
    counterPicks: ['Caveira (interrogate works on Vigil)', 'Pulse (heartbeat sensor still detects Vigil even cloaked)'],
    counterAdvice: 'On attack: Vigil is invisible to drones — assume he\'s on a flank route. Use Pulse-equivalent intel (when on attack, doesn\'t exist) — instead, predict Vigil paths from spawn and pre-aim. Caveira-equivalent doesn\'t exist on attack.',
    howToClimb: 'Activate cloak when you hear Lion scan or attacker drone deployment. Use 6-second windows for surprise flanks. Don\'t cloak preemptively — wait for actual scan / drone usage to maximize cloak value.',
  },
  Goyo: {
    side: 'defense', role: 'Area Denial', gadget: 'Volcán Shield',
    gadgetDesc: 'Two Volcán Shields with explosive canisters attached. Defenders can detonate the canister to create a fire wall in a wide area.',
    primary: 'TCSG12 / Vector .45 ACP', secondary: 'P229', secondaryGadget: 'Nitro Cell / Proximity Alarm', speed: '2-speed / 2-armor',
    intro: 'Goyo is the fire-denial defender. His Volcán Shields combine deployable shield protection with explosive fire denial. Strong on sites with vertical play (fire from Volcán denies floor breakers).',
    strengths: ['Volcán shields provide cover + fire denial', 'Two shields = two area-denial zones', 'TCSG12 is a strong shotgun', 'Nitro Cell secondary'],
    counterPicks: ['Capitao (fire bolts can clear Volcán fire)', 'Twitch (drones detonate Volcán safely)'],
    counterAdvice: 'On attack: shoot the Volcán canister from outside cover to detonate it — Goyo wastes the shield. Capitao fire bolts can clear deployed Volcán fire. Twitch drone darts detonate Volcáns from a distance.',
    howToClimb: 'Place Volcán shields on common vertical drop spots — when Sledge / Buck breaks the floor, you detonate the Volcán to deny the drop. Position one shield in the bomb room for plant denial. Save 1 detonation for the post-plant.',
  },
  Castle: {
    side: 'defense', role: 'Choke Denial', gadget: 'Universal Breaching Shield',
    gadgetDesc: 'Four Castle armor barricades that block doors and windows with reinforced metal. Bulletproof unless attacked by specific gadgets.',
    primary: 'UMP45 / M1014', secondary: 'MAGNUM', secondaryGadget: 'Bulletproof Camera / Proximity Alarm', speed: '2-speed / 2-armor',
    intro: 'Castle denies attacker entry routes via reinforced barricades. Strong on sites with multiple choke points where forcing attackers into one entry is round-deciding.',
    strengths: ['Four armor barricades = four entry denials', 'Forces attackers to bring soft-breach utility (Buck, Sledge, Zofia)', 'Strong primary SMG (UMP45)', 'Versatile secondary gadgets'],
    counterPicks: ['Sledge (hammer breaks barricades)', 'Buck (Skeleton Key shotgun)', 'Zofia (impact grenades)', 'Maverick (blowtorch)'],
    counterAdvice: 'On attack: bring soft-breach (Sledge, Buck, Zofia) for any Castle-banned site. Castle barricades take 4-6 hits to break with normal weapons; with hammer/shotgun, 1-2 hits.',
    howToClimb: 'Place Castle barricades on common attacker entry routes — windows, doorways. Force attackers to bring soft breach, removing one of their meta picks. Coordinate with Mira windows on adjacent walls — Castle denies one entry; Mira reads the other.',
  },
  Doc: {
    side: 'defense', role: 'Anchor / Heal', gadget: 'MPD-0 Stim Pistol',
    gadgetDesc: 'A stim pistol that revives downed teammates from a distance, heals self, or boosts teammate HP above max. Three shots per round.',
    primary: 'MP5 / P90 / SG-CQB', secondary: 'P90 (BackUp) / LFP586', secondaryGadget: 'Bulletproof Camera / Barbed Wire', speed: '1-speed / 3-armor',
    intro: 'Doc is the anchor healer. His Stim Pistol heals teammates remotely and revives downed defenders. Strong on tight sites where anchors die from grenades and need fast revives.',
    strengths: ['Remote revive (no need to crawl to teammate)', 'HP boost above max (+40 HP) for tanky pushes', '3-armor for tankiness', 'Three stim shots per round'],
    counterPicks: ['Caveira (interrogate Doc denies revive)', 'Frost (mats keep Doc team in DBNO)'],
    counterAdvice: 'On attack: focus Doc when possible — without him, defender revives are local-only. Caveira interrogate kills downed teammates that Doc would otherwise revive.',
    howToClimb: 'Save stim shots for the late-round revive — don\'t waste on pre-emptive HP boosts. Position Doc behind primary anchor for fast revive coverage. HP boost above max enables aggressive plays — boost the Pulse / Caveira before their roam push.',
  },
  Rook: {
    side: 'defense', role: 'Anchor / Armor', gadget: 'GIGN R1N "Rhino" Armor',
    gadgetDesc: 'Drops a bag of armor plates that any teammate can grab. Each plate adds 20 HP-equivalent armor and prevents one DBNO state.',
    primary: 'P90 / MP5', secondary: 'LFP586 / SMG-12', secondaryGadget: 'Bulletproof Camera / Impact Grenade', speed: '1-speed / 3-armor',
    intro: 'Rook is the team-armor defender. His armor plates give every defender +20 HP equivalent and prevent the first DBNO. Strong on every defense round — the armor advantage is round-deciding.',
    strengths: ['Team-wide armor boost (+20 HP equivalent per teammate)', 'Prevents first DBNO state', '3-armor for tankiness', 'Strong primary (P90)'],
    counterPicks: ['Glaz (1-shot headshot bypasses armor)', 'Kali (1-shot headshot)'],
    counterAdvice: 'On attack: the armor bypasses first-DBNO mechanics, but headshots still 1-tap. Use Glaz / Kali for headshot picks. Don\'t expect to down Rook-team players in 1-2 body shots.',
    howToClimb: 'Drop the Rook bag at round start in a central location all defenders can grab. Don\'t hoard plates yourself — give to teammates. Use the +20 HP for aggressive holds — the armor lets you push duels you wouldn\'t otherwise win.',
  },
  Aruni: {
    side: 'defense', role: 'Utility Gate / Anti-Breach', gadget: 'Surya Gate',
    gadgetDesc: 'Three laser gates that activate on movement detection — damage attackers and destroy thrown projectiles. Doors block reinforced wall paths.',
    primary: 'P10 RONI / Mk 14 EBR', secondary: 'PRB92', secondaryGadget: 'Bulletproof Camera / Barbed Wire', speed: '2-speed / 2-armor',
    intro: 'Aruni is the laser-gate defender. Her Surya gates create damage barriers on doorways and windows, denying entry through specific paths. Plus the gates destroy projectiles (grenades, breach charges) thrown through.',
    strengths: ['Three Surya gates = three entry denials', 'Gates destroy thrown projectiles', 'Strong primary (P10 RONI)', 'Versatile secondary'],
    counterPicks: ['Maverick (blowtorch through Surya-protected walls)', 'Twitch (drones disable gates)'],
    counterAdvice: 'On attack: Maverick can blowtorch through walls Aruni Surya gates protect. Twitch drone darts disable gates. Throw grenades into gates — they\'re destroyed but the gate goes on cooldown.',
    howToClimb: 'Place Surya gates on commonly-used attacker entry routes — windows, doorways. The gate forces attackers to either break the gate (loud + slow) or take an alternate entry. Coordinate with Mira windows for combined intel + denial.',
  },
  Kapkan: {
    side: 'defense', role: 'Trap / Roam', gadget: 'Entry Denial Device (EDD)',
    gadgetDesc: 'Five EDDs that deploy on doorways and trigger when attackers cross. Damages and disorients. Visible if you look for them.',
    primary: '9x19VSN / SASG-12', secondary: 'PMM / GSh-18', secondaryGadget: 'Nitro Cell / Impact Grenade', speed: '2-speed / 2-armor',
    intro: 'Kapkan is the trap-based denier. His EDDs catch attackers crossing doorways. Plat+ Kapkans place them on rotation routes, not obvious entries (which attackers always drone).',
    strengths: ['Five EDDs = wide-area coverage', 'Damages + disorients', 'Strong primary SMG (9x19VSN)', 'Nitro Cell secondary'],
    counterPicks: ['IQ (scanner finds EDDs)', 'Twitch (drones destroy EDDs)'],
    counterAdvice: 'On attack: drone every doorway. EDDs are visible if you look for the small canisters. IQ scans through walls. Don\'t cross doorways without checking — EDD damage + disorient is round-losing.',
    howToClimb: 'Place EDDs on rotation routes between bomb pair walls, not obvious entry doors. Save 2-3 for late-round plant denial — the planter triggers them.',
  },
  Frost: {
    side: 'defense', role: 'Trap / Roam', gadget: 'Welcome Mat',
    gadgetDesc: 'Three Welcome Mats that put crossing attackers into DBNO state immediately. Mats are visible but easy to miss in cluttered terrain.',
    primary: 'SUPER 90 / 9MM C1', secondary: 'MK1 9MM', secondaryGadget: 'Bulletproof Camera / Deployable Shield', speed: '2-speed / 2-armor',
    intro: 'Frost is the surprise denier. Her Welcome Mats DBNO any attacker who steps on them. Banned in 30%+ of matches because of the round-changing potential.',
    strengths: ['DBNO any attacker (no kill, no revive without Doc/Finka)', 'Three mats = three trap zones', 'Strong primary shotgun (SUPER 90)', 'Versatile secondary'],
    counterPicks: ['IQ (scanner finds mats)', 'Twitch (drones destroy mats)'],
    counterAdvice: 'On attack: drone every floor — mats are visible from drone view. IQ finds them through walls. Don\'t step on uncleared floor sections.',
    howToClimb: 'Place mats in unexpected spots — under windows, in dark corners, on rotation paths. Save the surprise factor by placing in non-obvious spots. Coordinate with Caveira for combined trap + interrogate.',
  },
  Mozzie: {
    side: 'defense', role: 'Anti-Drone / Roam', gadget: 'Pest Drone',
    gadgetDesc: 'Three Pests that capture attacker drones and turn them into Mozzie\'s drones. Captured drones can scout for the defender team.',
    primary: 'COMMANDO 9 / P10 RONI', secondary: 'SDP 9MM', secondaryGadget: 'Nitro Cell / Barbed Wire', speed: '2-speed / 2-armor',
    intro: 'Mozzie counters attacker drones. His Pests capture drones (Twitch, Iana, Flores) — flips intel to defender team. Strong against drone-heavy attack comps.',
    strengths: ['Captures attacker drones for defender intel', 'Three Pests = three intel-capture opportunities', 'Strong primary (COMMANDO 9)', 'Nitro Cell secondary'],
    counterPicks: ['Twitch (special drones can\'t be captured by Pests)', 'Lion (scan reveals Mozzie position even when roaming)'],
    counterAdvice: 'On attack: Twitch drones can\'t be captured by Pests (they\'re wired-controlled, immune to Pest hijack). Use Twitch to clear Pests safely. Lion scans find Mozzie roaming.',
    howToClimb: 'Place Pests near common drone-entry windows. Save 1 Pest for late-round drone capture — when attackers re-drone for plant intel, capture and use it for plant denial.',
  },
  Wamai: {
    side: 'defense', role: 'Utility Denial', gadget: 'Mag-NET System',
    gadgetDesc: 'Five Mag-NET devices that magnetically pull thrown projectiles (grenades, breach charges) and detonate them safely. Strong against utility-heavy attack comps.',
    primary: 'AUG A2 / MP5K', secondary: 'KERATOS .357 / P12', secondaryGadget: 'Deployable Shield / Proximity Alarm', speed: '2-speed / 2-armor',
    intro: 'Wamai is the next-gen Jager. His Mag-NETs pull projectiles toward themselves and detonate them away from defenders. Strong on sites where attackers rely on flash/grenade utility.',
    strengths: ['Pulls projectiles away from defender positions', 'Five Mag-NETs = wider coverage than Jager ADS', 'Strong primary AR (AUG A2)', 'Versatile secondary'],
    counterPicks: ['Twitch (drones destroy Mag-NETs)', 'IQ (scanner finds Mag-NETs)'],
    counterAdvice: 'On attack: same as Jager — bring Twitch / IQ to clear. Throw multiple grenades simultaneously — Mag-NETs pull only one at a time.',
    howToClimb: 'Place Mag-NETs near choke points where attackers throw flashes/smokes. Position one near the bomb default plant for late-round nitro pulls. Coordinate with Jager for combined utility denial.',
  },
  Azami: {
    side: 'defense', role: 'Utility Gate / Anchor', gadget: 'Kiba Barrier',
    gadgetDesc: 'Five Kiba Barriers that throw onto walls/floors to create reinforced cover. Bulletproof barriers create custom angles + deny breach.',
    primary: '9x19VSN / ACS12', secondary: 'D-50', secondaryGadget: 'Impact Grenade / Barbed Wire', speed: '2-speed / 2-armor',
    intro: 'Azami creates custom cover via Kiba Barriers. Five throwable reinforced barriers let her plug breach holes mid-round, create off-angle anchors, and deny attacker push paths.',
    strengths: ['Five throwable barriers — extreme flexibility', 'Plugs breach holes mid-round', 'Creates custom anchor angles', 'Strong primary SMG (9x19VSN)'],
    counterPicks: ['Maverick (blowtorch through Azami plugs)', 'Twitch (drones can\'t destroy Kiba Barriers but can shoot Azami)'],
    counterAdvice: 'On attack: Maverick can blowtorch through Kiba Barriers. Don\'t hard-breach the same wall twice — Azami will plug it. Save Thatcher EMP for re-clearing if Azami plugs Bandit-tricked walls.',
    howToClimb: 'Use Kiba Barriers to plug breached walls mid-round (after Thermite breach, plug it back). Create off-angle anchors that attackers don\'t expect. Save 1 barrier for late-round plant denial — plug the entry to the bomb spot.',
  },
  Melusi: {
    side: 'defense', role: 'Intel / Slow', gadget: 'Banshee Sonic Defense',
    gadgetDesc: 'Three Banshees that emit sonic field — slows attackers in the area + reveals their position via sound directional cue. Bulletproof until destroyed by hammer/shotgun. Effective range covers most doorway entries.',
    primary: 'MP5 / SUPER 90', secondary: 'PRB92', secondaryGadget: 'Bulletproof Camera / Impact Grenade', speed: '2-speed / 2-armor',
    intro: 'Melusi is the slow-and-intel defender. Her Banshees slow attackers + provide directional intel through their sonic emission. Banned in some metas because of the wide-area coverage. Plat+ Melusi mains place Banshees on rotation routes between bomb pair walls — the slow forces attackers into pre-aimed angles.',
    strengths: ['Three Banshees = three slow-and-intel zones', 'Bulletproof — defenders can\'t shoot them', 'Strong primary SMG (MP5)', 'Versatile secondary'],
    counterPicks: ['Sledge / Buck (hammer breaks Banshees)', 'Maverick (blowtorch destroys Banshees)'],
    counterAdvice: 'On attack: Sledge hammer or Buck Skeleton Key breaks Banshees in 1-2 hits. Maverick blowtorch is silent if you need stealth. Don\'t stay in Banshee fields — the slow makes you a free kill.',
    howToClimb: 'Place Banshees near choke points where attackers must cross. Position one near the rotation room for flanking attackers. Save 1 Banshee for late-round repositioning if needed.',
  },
  Thunderbird: {
    side: 'defense', role: 'Heal / Sustain', gadget: 'Kona Station',
    gadgetDesc: 'Three Kona Stations that heal anyone (defender OR attacker) who interacts with them. Defenders prioritize them; attackers can use them but it\'s rare.',
    primary: 'SPEAR .308 / SPAS-15', secondary: 'BEARING 9', secondaryGadget: 'Barbed Wire / Impact Grenade', speed: '2-speed / 2-armor',
    intro: 'Thunderbird is sustained heal. Her Kona Stations restore HP throughout the round, making her a strong anchor on sites with heavy frag damage. Banned in 20%+ of late-round metas.',
    strengths: ['Three Kona Stations = three heal zones', 'Strong primary (SPEAR .308)', 'Heals work passively (no active reset like Doc)', 'Versatile secondary'],
    counterPicks: ['Caveira (interrogate denies Thunderbird heals)', 'Frost (mats keep team in DBNO)'],
    counterAdvice: 'On attack: identify Kona Station positions early — destroying them denies the heals. Caveira interrogate kills DBNO\'d defenders before Kona heals trigger.',
    howToClimb: 'Place Kona Stations in central defender positions — anchors can heal between fights. Position one in the bomb room for plant denial heals. Save 1 station for late-round repositioning if site collapses.',
  },
  Solis: {
    side: 'defense', role: 'Intel / Anti-Tech', gadget: 'SPEC-IO Electro Sensor',
    gadgetDesc: 'A specs-mounted device that scans through walls and reveals all attacker electronics (drones, breach charges, gadgets) within 8 meters.',
    primary: 'P90 / ITA12L', secondary: 'SMG-11 / ITA12S', secondaryGadget: 'Impact Grenade / Bulletproof Camera', speed: '2-speed / 2-armor',
    intro: 'Solis reads attacker electronics. Her SPEC-IO reveals all attacker tech — drones, charges, sensors — within 8 meters. Strong against utility-heavy attack comps where electronic identification wins rounds.',
    strengths: ['Reveals all attacker electronics through walls', 'Strong primary SMG (P90)', 'Active scan that\'s hard to counter', 'SMG-11 secondary for high-RPM duels'],
    counterPicks: ['Iana (Gemini draws Solis shots)', 'Vigil (cloak nullifies Solis scan)'],
    counterAdvice: 'On attack: assume Solis reads all your electronics within 8m of her position. Use Iana Gemini to bait her shots. Vigil\'s cloak is the hard counter to Solis-equivalent intel.',
    howToClimb: 'Use SPEC-IO to scan common attacker drone-entry windows. Position to detect Twitch drones, Maestro Evil Eye placements, or Mira windows being placed. Save scans for the post-plant — defuse intel reads where attackers are.',
  },
  Tubarao: {
    side: 'defense', role: 'Slow / Anti-Speed', gadget: 'Zoto Canister',
    gadgetDesc: 'Three Zoto Canisters that release a freezing wave, slowing attackers + disabling electronic gadgets temporarily.',
    primary: 'AR-15.50 / MPX', secondary: 'P226 MK 25', secondaryGadget: 'Impact Grenade / Bulletproof Camera', speed: '2-speed / 2-armor',
    intro: 'Tubarao is the slow-and-deny defender. His Zoto Canisters slow attackers and disable their electronics — strong against fast-push attack comps.',
    strengths: ['Slows attackers + disables electronics', 'Three canisters = three deny zones', 'Strong primary (AR-15.50)', 'Versatile secondary'],
    counterPicks: ['Twitch (drones destroy Zoto canisters)', 'IQ (scanner finds them)'],
    counterAdvice: 'On attack: Zoto Canisters are visible — destroy on sight with primary fire. The slow effect lasts ~5 seconds; take cover to wait it out.',
    howToClimb: 'Place Zoto Canisters near choke points where attackers will push. Save 1 for late-round plant denial — slow the planter for safe trade kill. Coordinate with Maestro for combined slow + laser damage.',
  },
}

// Add fallback for any operator missing from OP_DATA
const OP_FALLBACK = {
  side: 'attack',
  role: 'Operator',
  gadget: 'Unique gadget',
  gadgetDesc: 'See in-game description for full ability details.',
  primary: 'See loadout',
  secondary: 'See loadout',
  secondaryGadget: 'Frag / Stun / Smoke',
  speed: '2-speed / 2-armor',
  intro: 'A Rainbow Six Siege operator with unique utility. Pick based on map and team comp synergy. <em>Detailed write-up VERIFY: confirm specifics before relying on this guide.</em>',
  strengths: ['Versatile across attack scenarios', 'Strong primary weapon options', 'Unique gadget for tactical advantage'],
  counterPicks: ['Universal counters (Thatcher, Mute, etc.)'],
  counterAdvice: 'See per-operator counter strategies in the Recon 6 operator guide.',
  howToClimb: 'Master the operator\'s gadget timing and weapon recoil. Coordinate with team for synergy plays.',
}

// ---------- BUILD OPERATOR INDEX FROM STRATS ----------

function buildOperatorIndex() {
  const index = {}
  for (const mapId of Object.keys(STRATS)) {
    const map = MAPS.find((m) => m.id === mapId)
    if (!map) continue
    for (const siteId of Object.keys(STRATS[mapId])) {
      const site = map.sites.find((s) => s.id === siteId)
      if (!site) continue
      for (const side of ['attack', 'defense']) {
        const strat = STRATS[mapId][siteId]?.[side]
        if (!strat) continue
        for (const op of strat.operators || []) {
          if (!index[op.name]) {
            index[op.name] = { name: op.name, sites: [] }
          }
          index[op.name].sites.push({
            mapId, mapName: map.name, siteId, siteName: site.name,
            siteFloor: site.floor || '', side, priority: op.priority, role: op.role,
          })
        }
      }
    }
  }
  return index
}

// ---------- HTML SHELL ----------

function htmlShell({ title, description, canonical, bodyInner, jsonLdBlocks = [] }) {
  const ogImageUrl = `${SITE_URL}/og-image.png`
  const jsonLdHtml = jsonLdBlocks.map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join('\n  ')
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}" />
  <link rel="canonical" href="${escape(canonical)}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#0a0f19" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escape(title)}" />
  <meta property="og:description" content="${escape(description)}" />
  <meta property="og:url" content="${escape(canonical)}" />
  <meta property="og:image" content="${escape(ogImageUrl)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Recon 6" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${escape(ogImageUrl)}" />
  ${jsonLdHtml}
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #0a0f19; color: #e6e9ef; line-height: 1.7; }
    a { color: #00e5ff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .nav { padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; }
    .brand { font-weight: 900; letter-spacing: 0.06em; color: #fff; text-decoration: none; }
    .brand span { color: #00e5ff; }
    .nav-links a { margin-left: 18px; color: rgba(230,233,239,0.85); font-size: 0.9rem; }
    main { max-width: 760px; margin: 0 auto; padding: 32px 24px 80px; }
    article h1 { font-size: 2.1rem; margin: 0 0 8px; line-height: 1.25; }
    .meta-row { color: rgba(230,233,239,0.6); font-size: 0.88rem; margin-bottom: 24px; display: flex; gap: 14px; flex-wrap: wrap; }
    .meta-row .pill { background: rgba(0,229,255,0.08); border: 1px solid rgba(0,229,255,0.2); border-radius: 999px; padding: 2px 10px; color: #c0f4fc; }
    .meta-row .pill.attack { background: rgba(255,128,96,0.1); border-color: rgba(255,128,96,0.3); color: #ffaa88; }
    .meta-row .pill.defense { background: rgba(80,180,255,0.1); border-color: rgba(80,180,255,0.3); color: #88c2ff; }
    article p { margin: 0 0 16px; color: rgba(230,233,239,0.9); }
    article h2 { font-size: 1.4rem; margin: 32px 0 12px; color: #fff; border-left: 3px solid #00e5ff; padding-left: 12px; }
    article h3 { font-size: 1.05rem; margin: 22px 0 8px; color: #c0f4fc; }
    article ul, article ol { padding-left: 22px; margin: 0 0 18px; color: rgba(230,233,239,0.9); }
    article ul li, article ol li { margin-bottom: 6px; }
    article strong { color: #fff; font-weight: 700; }
    article code { background: rgba(0,229,255,0.08); padding: 1px 6px; border-radius: 3px; font-size: 0.92em; color: #c0f4fc; }
    .callout { margin: 22px 0; padding: 16px 18px; background: rgba(0,229,255,0.05); border-left: 3px solid #00e5ff; border-radius: 0 6px 6px 0; }
    .callout.mistakes { background: rgba(255,80,80,0.05); border-left-color: #ff5050; }
    .callout.mistakes h3 { color: #ff8899; margin-top: 0; }
    .callout.loadout { background: rgba(80,255,140,0.04); border-left-color: #50ff8c; }
    .callout.loadout h3 { color: #98ffc6; margin-top: 0; }
    .callout h3 { margin: 0 0 8px; }
    .callout p:last-child, .callout ul:last-child, .callout ol:last-child { margin-bottom: 0; }
    .related { margin: 32px 0; padding: 20px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; }
    .related h3 { margin: 0 0 10px; }
    .related ul { margin: 0; padding-left: 18px; }
    .breadcrumb { font-size: 0.85rem; color: rgba(230,233,239,0.6); margin-bottom: 12px; }
    .breadcrumb a { color: rgba(230,233,239,0.85); }
    .intro-cta { padding: 24px; background: linear-gradient(180deg, rgba(0,229,255,0.06), rgba(10,15,25,0.6)); border: 1px solid rgba(0,229,255,0.2); border-radius: 12px; margin: 32px 0; text-align: center; }
    .intro-cta h3 { margin: 0 0 6px; color: #fff; }
    .intro-cta p { margin: 0 0 12px; color: rgba(230,233,239,0.8); }
    .btn { display: inline-block; padding: 10px 20px; background: #00e5ff; color: #051117; font-weight: 700; border-radius: 6px; text-decoration: none; }
    .footer-strip { max-width: 760px; margin: 40px auto; padding: 0 24px; color: rgba(230,233,239,0.5); font-size: 0.82rem; text-align: center; }
    .site-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.92rem; }
    .site-table th { background: rgba(0,229,255,0.1); color: #c0f4fc; text-align: left; padding: 8px 10px; }
    .site-table td { padding: 6px 10px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .site-table .pri-essential { color: #50ff8c; font-weight: 700; }
    .site-table .pri-recommended { color: #c0f4fc; }
    .site-table .pri-flex { color: rgba(230,233,239,0.7); }
    @media (max-width: 600px) {
      main { padding: 20px 16px 40px; }
      article h1 { font-size: 1.55rem; }
      article h2 { font-size: 1.18rem; }
    }
  </style>
</head>
<body>
  <nav class="nav">
    <a class="brand" href="${SITE_URL}/">RECON<span>+</span></a>
    <div class="nav-links">
      <a href="${SITE_URL}/blog/">Blog</a>
      <a href="${SITE_URL}/guides/">Map guides</a>
      <a href="${SITE_URL}/#/strats">Interactive strats</a>
      <a href="${SITE_URL}/#pricing">Pricing</a>
    </div>
  </nav>
  <main>
    ${bodyInner}
  </main>
  <div class="footer-strip">
    <p>&copy; Recon 6 — AI-powered FPS coaching across 10 games. <a href="${SITE_URL}/">r6coaching.com</a></p>
  </div>
</body>
</html>`
}

// ---------- RENDER ----------

function renderBestSites(opName, opSites) {
  if (!opSites || opSites.length === 0) {
    return `<p>${escape(opName)} doesn\'t have specific assigned site placements in our current strat library — works as a flex pick across multiple maps based on team comp.</p>`
  }
  // Sort by priority (essential > recommended > flex), then by mapName
  const order = { essential: 0, recommended: 1, flex: 2 }
  const sorted = [...opSites].sort((a, b) => {
    const p = (order[a.priority] ?? 3) - (order[b.priority] ?? 3)
    if (p !== 0) return p
    return a.mapName.localeCompare(b.mapName)
  })
  // Group by map
  const byMap = {}
  for (const s of sorted) {
    if (!byMap[s.mapName]) byMap[s.mapName] = []
    byMap[s.mapName].push(s)
  }
  const rows = sorted.map((s) => `
    <tr>
      <td><a href="/guides/${escape(s.mapId)}.html">${escape(s.mapName)}</a></td>
      <td>${escape(s.siteName)} <span style="color:rgba(230,233,239,0.5)">(${escape(s.siteFloor || '—')})</span></td>
      <td>${escape(s.side)}</td>
      <td><span class="pri-${s.priority}">${escape(s.priority)}</span></td>
      <td>${escape(s.role || '—')}</td>
    </tr>`).join('\n')
  return `
    <p>${escape(opName)} appears across ${sorted.length} site/side combinations in the Recon 6 strats library. Top picks where ${escape(opName)} is essential are the priority maps to learn first.</p>
    <table class="site-table">
      <thead><tr><th>Map</th><th>Site</th><th>Side</th><th>Priority</th><th>Role</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`
}

function renderOperatorPost(opName, opIndex) {
  const op = OP_DATA[opName] || OP_FALLBACK
  const opSites = (opIndex[opName]?.sites) || []
  const slug = `r6-operator-${slugify(opName)}`
  const canonical = `${SITE_URL}/blog/${slug}.html`

  const title = `${opName} R6 Guide — Loadout, Sites, & How to Play in ${YEAR}`
  const description = `Complete ${opName} guide for Rainbow Six Siege ${YEAR}. ${op.role} on ${op.side}. Best maps + sites, gadget breakdown, common mistakes, counter picks, and how to climb with ${opName}.`

  const intro = `<p>${op.intro}</p>
<p>This guide covers ${opName}\'s loadout and gadget use, the maps + sites where they\'re strongest, common mistakes that hold ${opName} mains back, counter picks ${opName} is most vulnerable to, a practice drill to lock in their mechanics, and how to climb ranked with them. Last updated ${YEAR} — patch-current as of the most recent Operation.</p>
<p>${opName} is a ${op.side === 'attack' ? 'attacker' : 'defender'} ${op.role.toLowerCase().includes('hard breach') ? 'used in coordinated executions where wall opening is round-deciding' : op.role.toLowerCase().includes('intel') ? 'whose information advantage shapes every team fight' : op.role.toLowerCase().includes('roam') ? 'whose flank plays disrupt attacker timing and force re-clears' : op.role.toLowerCase().includes('anchor') ? 'who holds site from cover and trade-frags pushers' : op.role.toLowerCase().includes('support') ? 'whose utility enables teammates direct frags' : 'with a unique kit that rewards specific situational play'}. Pick them when the team comp needs their role — running ${opName} as filler instead of fit is the fastest way to throw the round.</p>`

  const sitesSection = `
    <h2>Best Maps & Sites for ${opName}</h2>
    ${renderBestSites(opName, opSites)}
    <p>Click any map name above to open the full Recon 6 strat guide for that map. The site cell shows the bomb pair where ${opName} appears as ${op.side === 'attack' ? 'an attacker' : 'a defender'}.</p>`

  const loadoutSection = `
    <h2>Loadout & Gadget Use</h2>
    <div class="callout loadout">
      <h3>${opName} kit at a glance</h3>
      <ul>
        <li><strong>Side:</strong> ${escape(op.side === 'attack' ? 'Attack' : 'Defense')}</li>
        <li><strong>Role:</strong> ${escape(op.role)}</li>
        <li><strong>Gadget:</strong> ${escape(op.gadget)}</li>
        <li><strong>Primary:</strong> ${escape(op.primary)}</li>
        <li><strong>Secondary:</strong> ${escape(op.secondary)}</li>
        <li><strong>Secondary gadget:</strong> ${escape(op.secondaryGadget)}</li>
        <li><strong>Speed / armor:</strong> ${escape(op.speed)}</li>
      </ul>
    </div>
    <p>${op.gadgetDesc}</p>
    <h3>Strengths</h3>
    <ul>${op.strengths.map((s) => `<li>${s}</li>`).join('')}</ul>`

  // Common mistakes are roughly templated by side + role
  const mistakes = op.side === 'attack' ? [
    `Solo-pushing without team support — ${opName} relies on coordinated execs in 80%+ of competitive setups.`,
    `Wasting gadget charges in the first 30 seconds before knowing defender setups. Drone first; deploy gadget after.`,
    `Picking ${opName} on maps where another operator is mathematically better. Check the Best Maps table above.`,
    `Using ${opName}\'s primary at the wrong range (e.g., AR at point-blank, SMG at 30+ meters). Match weapon to engagement.`,
    `Ignoring the secondary gadget. Most attackers use it as the &quot;throw it whenever&quot; option — pre-plan the secondary use.`,
  ] : [
    `Anchoring the same default position every round. Predictable to Plat+ attackers — vary your hold spots.`,
    `Wasting gadget charges in the first 30 seconds before knowing attacker setups. Wait for drones / commit reads first.`,
    `Picking ${opName} on maps where another operator is mathematically better. Check the Best Maps table above.`,
    `Roaming when site needs an anchor (or anchoring when site needs a roamer). Match role to team comp.`,
    `Ignoring the secondary gadget. Most defenders default-pick — pre-plan whether you need barbed wire, nitro, or impact for the round.`,
  ]

  const mistakesSection = `
    <h2>Common Mistakes</h2>
    <div class="callout mistakes">
      <h3>What ${opName} mains get wrong</h3>
      <ul>${mistakes.map((m) => `<li>${m}</li>`).join('')}</ul>
    </div>`

  const counterPicksSection = `
    <h2>Counter Picks — Who to ${op.side === 'attack' ? 'Run vs ' : 'Ban Against '}${opName}</h2>
    <p>${op.side === 'attack' ? `If you\'re defending against ${opName}, the operators below directly counter their kit:` : `If you\'re attacking against ${opName}, the operators below directly counter their kit:`}</p>
    <ul>${op.counterPicks.map((c) => `<li>${c}</li>`).join('')}</ul>`

  const counterAdviceSection = op.side === 'defense' ? `
    <h2>How to Play Against ${opName} (Attacker Side)</h2>
    <p>${op.counterAdvice}</p>
    <p>The general rule for facing ${opName}: drone-up before commitment, identify their gadget placement, and either clear it (Twitch / Thatcher / Flores) or play around it (rotate, smoke cover, alternate angle). Forcing ${opName} to react instead of letting them set up wins ${opName}-affected rounds.</p>` : `
    <h2>How to Counter ${opName} (Defender Side)</h2>
    <p>${op.counterAdvice}</p>
    <p>The general rule for facing ${opName}: identify their setup early (round 1 reads), pre-aim the angles their gadget enables, and force them off their default position. ${opName}\'s utility loses value when used in unexpected positions or against alert teammates.</p>`

  const whenToPickSection = `
    <h2>When to Pick ${opName} — and When to Avoid</h2>
    <p><strong>Pick ${opName} when:</strong></p>
    <ul>
      <li>The team comp lacks their role (${escape(op.role)}) and the map favors it.</li>
      <li>The map appears in the Best Maps table above with ${opName} as essential or recommended priority.</li>
      <li>${op.side === 'attack' ? `Defenders are likely to run gadgets ${opName}\'s kit specifically counters (e.g., heavy electronics, predictable anchors)` : `Attackers are likely to use the strategies ${opName}\'s kit denies (e.g., droning-heavy, gadget-reliant exec patterns)`}.</li>
      <li>You\'ve put 50+ hours of muscle memory into ${opName} — pulling them out cold is risky in ranked.</li>
    </ul>
    <p><strong>Avoid ${opName} when:</strong></p>
    <ul>
      <li>Your team already has redundancy in ${opName}\'s role.</li>
      <li>The map is short or simple enough that ${opName}\'s utility is overkill (a basic operator with a strong gun is better in those cases).</li>
      <li>${opName} is banned (obvious) or the matchup specifically counters them (see Counter Picks above).</li>
    </ul>`

  const climbSection = `
    <h2>How to Climb With ${opName}</h2>
    <p>${op.howToClimb}</p>
    <p>For specific site setups, check the per-map guides linked in the Best Maps table — each guide has the full operator + utility breakdown for that bomb pair. The interactive strats tool also lets you filter by ${opName} to see all the strats they appear in.</p>
    <h3>Tips for veterans</h3>
    <p>If you\'ve been maining ${opName} for 100+ hours, the climb above Plat / Emerald comes from the small refinements: ${op.side === 'attack' ? 'varying your gadget timing per round (don\'t use it on the same count every match), pre-aiming the angle the defender holds against your typical entry, and saving secondary gadget for the post-plant rather than entry' : 'rotating your anchor position round-to-round (don\'t hold the same corner more than twice in a row), pre-aiming the head-height angle attackers peek through your typical hold spot, and timing your gadget for the late-round commit rather than spawn-time pre-emption'}. The mechanical skills that got you to your current rank stop working at higher elos — opponents have read your patterns. Vary deliberately.</p>
    <h3>Practice drill — 5-game ${opName} focus</h3>
    <p>Queue 5 ranked games with ${opName} locked in. After each game, write down (1) where you used your gadget and whether it landed, (2) which map and site you played, (3) one mistake you saw in the kill cam. By game 5 you\'ll have specific patterns to fix, and the next 10 games convert that knowledge into rank. The deliberate-practice loop beats grinding 50 random games where you don\'t track what you\'re fixing.</p>`

  const aiVod = `
    <p>If you\'re trying to debug your ${opName} play, <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> reads your replays and flags positioning + utility-timing mistakes per round. Particularly useful for finding the rounds where you wasted a gadget charge or held a predictable angle. <strong>7-day money back if it doesn\'t help.</strong></p>`

  // Related links: 4-5 links to operator-relevant content
  const topMaps = opSites.length > 0
    ? Array.from(new Set(opSites.slice(0, 4).map((s) => s.mapId)))
    : ['bank', 'clubhouse', 'kafe']
  const relatedLinks = [
    { name: 'All R6 Operator Guides', url: '/guides/operators/' },
    ...topMaps.slice(0, 3).map((mapId) => {
      const map = MAPS.find((m) => m.id === mapId)
      return { name: `${map?.name || mapId} Strategy Guide`, url: `/guides/${mapId}.html` }
    }),
    { name: `${opName} on /guides/operators`, url: `/guides/operators/${slugify(opName)}.html` },
    { name: 'Recon 6 R6 Rank-Up Blog Posts', url: '/blog/' },
  ]
  const relatedHtml = `
    <div class="related">
      <h3>Related Recon 6 guides</h3>
      <ul>${relatedLinks.map((l) => `<li><a href="${escape(l.url)}">${escape(l.name)}</a></li>`).join('')}</ul>
    </div>`

  const ctaHtml = `
    <div class="intro-cta">
      <h3>Want AI-powered VOD review on your ${opName} play?</h3>
      <p>Recon 6 Pro reads your replays and flags positioning, utility, and decision mistakes per round. Founding rate $9/mo until May 31 — locked in for life. 7-day money back guarantee.</p>
      <a class="btn" href="${SITE_URL}/#pricing">See plans</a>
    </div>`

  const breadcrumb = `<nav class="breadcrumb">
    <a href="/">Recon 6</a> ›
    <a href="/blog/">Blog</a> ›
    <a href="/blog/?game=r6">R6 Operators</a> ›
    <span>${escape(opName)}</span>
  </nav>`

  const bodyInner = `
    ${breadcrumb}
    <article>
      <h1>${escape(title)}</h1>
      <div class="meta-row">
        <span class="pill ${op.side}">${op.side === 'attack' ? 'Attack' : 'Defense'}</span>
        <span class="pill">${escape(op.role)}</span>
        <span class="pill">${escape(op.speed)}</span>
        <span>10 min read</span>
        <span>Last updated: ${YEAR}-05</span>
      </div>
      ${intro}
      ${sitesSection}
      ${loadoutSection}
      ${mistakesSection}
      ${counterPicksSection}
      ${counterAdviceSection}
      ${whenToPickSection}
      ${climbSection}
      ${aiVod}
      ${relatedHtml}
      ${ctaHtml}
    </article>`

  // JSON-LD: Article + HowTo + BreadcrumbList
  const jsonLdBlocks = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      author: { '@type': 'Organization', name: 'Recon 6' },
      publisher: { '@type': 'Organization', name: 'Recon 6', logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-image.png` } },
      datePublished: `${YEAR}-05-10`,
      dateModified: `${YEAR}-05-10`,
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      inLanguage: 'en-US',
      articleSection: 'R6 Operators',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: `How to play ${opName} in Rainbow Six Siege`,
      description,
      totalTime: 'PT10M',
      step: [
        { '@type': 'HowToStep', position: 1, name: `Master ${opName}\'s loadout`, text: `${op.gadget}: ${op.gadgetDesc}` },
        { '@type': 'HowToStep', position: 2, name: `Pick the right map for ${opName}`, text: `Use the Best Maps table to see the sites where ${opName} is essential.` },
        { '@type': 'HowToStep', position: 3, name: `Avoid common mistakes`, text: mistakes[0] },
        { '@type': 'HowToStep', position: 4, name: `Counter ${opName}'s weaknesses`, text: op.counterAdvice },
        { '@type': 'HowToStep', position: 5, name: `Climb with ${opName}`, text: op.howToClimb },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Recon 6', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog/` },
        { '@type': 'ListItem', position: 3, name: 'R6 Operators', item: `${SITE_URL}/blog/?game=r6` },
        { '@type': 'ListItem', position: 4, name: opName, item: canonical },
      ],
    },
  ]

  return htmlShell({ title, description, canonical, bodyInner, jsonLdBlocks })
}

// ---------- MAIN ----------

function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const opIndex = buildOperatorIndex()
  const opNames = Object.keys(opIndex).sort()

  let written = 0
  for (const opName of opNames) {
    const slug = `r6-operator-${slugify(opName)}`
    const html = renderOperatorPost(opName, opIndex)
    writeFileSync(join(OUT_DIR, `${slug}.html`), html, 'utf8')
    written++
  }

  console.log(`✓ Generated ${written} R6 operator deep-dive posts in public/blog/`)
  console.log(`  Operators: ${opNames.join(', ')}`)
}

main()
