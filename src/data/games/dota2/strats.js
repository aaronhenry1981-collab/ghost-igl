// Dota 2 — lane / phase strats per position.
// `attack` = early-game aggression / lane priority; `defense` = late-game scaling / 5-man team fight.

const STRATS = {
  "dota-map": {
    "safe-lane": {
      attack: {
        operators: [
          { name: "Anti-Mage", role: "Pos 1 Carry", priority: "essential" },
          { name: "Crystal Maiden", role: "Pos 5 Support (lane partner)", priority: "essential" },
          { name: "Phantom Assassin", role: "Pos 1 Carry alt", priority: "recommended" },
        ],
        strategy: "Safe Lane is the Carry's lane — bottom-left for Radiant, top-right for Dire. Pos 1 (Carry) farms last-hits while Pos 5 (Hard Support) protects + harasses enemy offlaner. Last-hit creep timing: tap right-click when creep is at 1 HP. Deny own creep at 50% HP. Pos 5 buys observer ward + sentry, stacks ancient camp at minute 0:53. Carry should hit level 6 at 6-8 minutes with Battle Fury / Manta Style components. Rotate to roshan or tower take by 15 minutes if lane won; if lane lost, jungle farm + defend tier-1.",
        callouts: ["Tri-bush (Safe)", "Creep wave", "Tower 1", "Ancient camp", "Roshan timer", "Smoke gank", "TP scroll"],
        utility: [
          "Iron Branch + Tango for sustain",
          "Observer Ward at tri-bush (vision)",
          "Magic Stick / Wand for mana on burst trades",
          "Boots → Power Treads / Phase Boots",
          "TP Scroll always in inventory after 5:00",
        ],
      },
      defense: {
        operators: [
          { name: "Axe", role: "Pos 3 Offlaner (defending)", priority: "essential" },
          { name: "Lion", role: "Pos 4 Roamer support", priority: "recommended" },
        ],
        strategy: "Defending Safe Lane (you're the offlaner harassing): Pos 3 Offlaner pushes wave to enemy tier-1, denies Carry XP / last-hits. Pos 4 Roamer ganks from rune spawn (minute 0:00 + 2:00 rune cycle). Block enemy carry farm with body-blocking + harass. Don't 1v2 the lane; trade XP for damage on Carry's wave. Smoke gank at 5:00 with Pos 4 from jungle. Offlaner Axe Berserker's Call AoE taunt forces Carry death.",
        callouts: ["Tri-bush", "Lane creep wave", "Tower 1 (theirs)", "Rune timer", "Smoke gank lane"],
        utility: [
          "Magic Stick + Iron Branch",
          "Observer Ward + Sentry (vision denial)",
          "Tangos for sustain",
          "Soul Ring / Bracer for offlaner sustain",
          "TP Scroll after 5:00 for rotation",
        ],
      },
    },
    "mid-lane": {
      attack: {
        operators: [
          { name: "Invoker", role: "Pos 2 Mid", priority: "essential" },
          { name: "Shadow Fiend", role: "Pos 2 Mid alt", priority: "recommended" },
          { name: "Puck", role: "Pos 2 Mid mobility", priority: "recommended" },
        ],
        strategy: "Mid Lane is the 1v1 highway. Pos 2 (Mid) farms + harasses + rotates. Mid is the snowball role — win lane → roam side lanes → snowball game. Last-hit / deny game: priority is last-hits on enemy creep, denies on own creep (at 50% HP). Mid hits level 6 at 5-7 minutes; rotate to side lane gank on R unlock. Rune control: bottle the runes at 0:00 + 2:00 + 4:00 cycle. Don't TP cancel mid (loses lane priority).",
        callouts: ["Mid lane creep wave", "Rune (top + bottom)", "TP scroll", "Bottle", "Tower 1 (mid)", "Roam timer", "Smoke gank"],
        utility: [
          "Bottle (mana/HP sustain via runes)",
          "Magic Stick / Wand",
          "Observer Ward at rune spawns",
          "Boots → Power Treads",
          "TP Scroll always in inventory",
        ],
      },
      defense: {
        operators: [
          { name: "Outworld Destroyer", role: "Pos 2 Mid (scaling)", priority: "essential" },
          { name: "Tinker", role: "Pos 2 Mid (rearm scaling)", priority: "recommended" },
        ],
        strategy: "Defending Mid Lane (you're vs aggressive Pos 2): Outworld Destroyer Astral Imprisonment denies all-in commits. Tinker farm-stays + Heat-Seeking Missile chip damage. Don't fight at mid level 3-4 vs Invoker/Storm Spirit; scale to level 6 for R unlock. Bottle for rune sustain; TP Scroll for tower defense. Mid Lane defense = stalling for scaling carry.",
        callouts: ["Mid lane creep wave", "Rune (top + bottom)", "TP scroll", "Bottle", "Tower 1", "Recall to tower"],
        utility: [
          "Bottle for mana sustain",
          "Boots → Arcane Boots (mid mage)",
          "Aether Lens / Hex item",
          "TP Scroll for tower defense",
          "Sentry Ward (anti-Pudge dewarding)",
        ],
      },
    },
    "off-lane": {
      attack: {
        operators: [
          { name: "Axe", role: "Pos 3 Offlaner", priority: "essential" },
          { name: "Centaur Warrunner", role: "Pos 3 Offlaner alt", priority: "recommended" },
          { name: "Tidehunter", role: "Pos 3 Offlaner team-fight", priority: "recommended" },
        ],
        strategy: "Off Lane is the toughest lane — 1v2 vs Pos 1 + Pos 5. Pos 3 (Offlaner) plays defensively, body-blocks for XP, harasses Carry without dying. Don't last-hit; survive + level up. Hit level 6 at 8-10 minutes for ult unlock. Axe Berserker's Call AoE taunt = first kill setup. Smoke gank from jungle at minute 5:00 with Pos 4. Offlaner scales into mid-game team fight role.",
        callouts: ["Tri-bush (Offlane)", "Lane creep wave", "Tower 1 (yours)", "Roam timer", "Smoke gank lane"],
        utility: [
          "Soul Ring + Bracer for offlaner sustain",
          "Magic Stick / Wand",
          "Observer Ward + Sentry",
          "Boots → Phase Boots / Tranquil Boots",
          "TP Scroll always in inventory",
        ],
      },
      defense: {
        operators: [
          { name: "Bristleback", role: "Pos 3 Offlaner scaling", priority: "essential" },
          { name: "Tidehunter", role: "Pos 3 Offlaner team fight", priority: "recommended" },
        ],
        strategy: "Defending Off Lane vs strong Pos 1: stall + scale. Bristleback Quill Spray damage stacks while back-armor sustains. Tidehunter Anchor Smash + Ravage ult for team fight. Don't trade vs aggressive Pos 5 Roamer; back off, jungle farm. Offlaner late-game is initiator role.",
        callouts: ["Tri-bush (Offlane)", "Lane creep wave", "Tower 1 (yours)", "Roam timer", "Jungle camp"],
        utility: [
          "Iron Branch + Tango",
          "Bracer + Magic Stick",
          "Observer Ward + Sentry",
          "Boots → Tranquil Boots (sustain)",
          "TP Scroll after 5:00",
        ],
      },
    },
    "jungle": {
      attack: {
        operators: [
          { name: "Mirana", role: "Pos 4 Roamer", priority: "essential" },
          { name: "Pudge", role: "Pos 4 Roamer alt", priority: "recommended" },
          { name: "Bounty Hunter", role: "Pos 4 Roamer (track gold)", priority: "recommended" },
        ],
        strategy: "Pos 4 Roamer + jungle is the mid-game flex role. Stack ancient camp at 0:53, 1:53, 2:53. Smoke gank at 4:00-5:00 lane. Roam to mid for kill setup. Mirana Sacred Arrow stun is the gank kill button. Pudge Meat Hook pull is the iconic Dota gank. Stack creep camps for Carry jungle farm; rotate ward placements.",
        callouts: ["Ancient camp (stack)", "Creep camp (stack)", "Rune timer", "Lane gank target", "Smoke gank"],
        utility: [
          "Smoke of Deceit (invisible gank)",
          "Observer Ward + Sentry stacks",
          "Tango + Iron Branch",
          "Soul Ring for mana",
          "TP Scroll always in inventory",
        ],
      },
      defense: {
        operators: [
          { name: "Treant Protector", role: "Pos 5 Support (defensive)", priority: "essential" },
          { name: "Witch Doctor", role: "Pos 5 Support team fight", priority: "recommended" },
        ],
        strategy: "Defending jungle = warding to prevent enemy smoke gank. Treant Protector Living Armor team heal lets carry sustain in lane. Witch Doctor Maledict damage stack for team fight. Plant Sentry Wards at enemy jungle entrance, Observer Wards at high ground / rune spawns. Track enemy Pos 4 position via missing minimap.",
        callouts: ["Enemy jungle ward", "Ancient camp (stack)", "Roshan pit", "Smoke gank lane (enemy)"],
        utility: [
          "Smoke of Deceit (defensive)",
          "Observer Ward + Sentry stacks",
          "Tango + Iron Branch",
          "Boots → Arcane Boots (mana)",
          "TP Scroll after 5:00",
        ],
      },
    },
    "roshan-pit": {
      attack: {
        operators: [
          { name: "Axe", role: "Pos 3 Tank (Rosh)", priority: "essential" },
          { name: "Crystal Maiden", role: "Pos 5 Mana support", priority: "recommended" },
          { name: "Anti-Mage", role: "Pos 1 Carry (Aegis priority)", priority: "essential" },
        ],
        strategy: "Roshan = the Aegis of the Immortal (1 free death). Spawns at minute 7:30, then 8-11 minute cycle after death. Setup: 5-man team smoke approach, ward enemy Roshan vision (Observer at high ground + Sentry to deward enemy). Tank Roshan with Pos 3 (Axe / Centaur). Pos 5 mana support during fight. Carry takes Aegis. Force enemy 5-man fight around pit. Roshan armor scales — fight at 15+ minutes only.",
        callouts: ["Roshan pit", "High ground ward", "Sentry deward", "Smoke gank pit"],
        utility: [
          "Smoke of Deceit (5-man approach)",
          "Observer Ward (high ground vision)",
          "Sentry Ward (deward enemy)",
          "Mana support (Crystal Maiden, Treant Protector)",
          "TP Scroll for backup",
        ],
      },
      defense: {
        operators: [
          { name: "Lion", role: "Pos 4 Burst support", priority: "essential" },
          { name: "Tidehunter", role: "Pos 3 Ravage initiator", priority: "recommended" },
        ],
        strategy: "Defending Roshan pit: deny enemy free Aegis. Smoke approach pit from elevated angle. Lion Finger of Death execute on Roshan-low enemy carry. Tidehunter Ravage AoE stun 5-man. Don't dive without smoke; enemy Sentry Ward detects you. Force enemy to commit before they can take Aegis.",
        callouts: ["Roshan pit", "High ground ward", "Smoke approach"],
        utility: [
          "Smoke of Deceit (approach pit)",
          "Sentry Ward (deward enemy)",
          "Observer Ward (track enemy)",
          "Initiator ult (Ravage, Black Hole)",
          "TP Scroll for retreat",
        ],
      },
    },
    "high-ground": {
      attack: {
        operators: [
          { name: "Crystal Maiden", role: "Pos 5 Freezing Field ult", priority: "essential" },
          { name: "Tidehunter", role: "Pos 3 Ravage initiator", priority: "essential" },
          { name: "Anti-Mage", role: "Pos 1 Carry siege", priority: "essential" },
        ],
        strategy: "High Ground siege = attacker tries to break enemy base. Tier-3 tower + barracks + ancient. Setup: 5-man team smoke approach. Ravage / Black Hole / Freezing Field initiation ult. Don't engage without Aegis safety net (Roshan first). Tier-3 tower has damage reflect; back off if low HP. Carry takes barracks for mega creeps.",
        callouts: ["Tier-3 tower", "Barracks", "Ancient", "Aegis status", "Initiator ult"],
        utility: [
          "Smoke of Deceit (siege approach)",
          "Aegis of the Immortal (Roshan)",
          "Initiator ult (Ravage, Black Hole, Freezing Field)",
          "BKB (Black King Bar) anti-disable",
          "Mana support for ult timing",
        ],
      },
      defense: {
        operators: [
          { name: "Treant Protector", role: "Pos 5 Living Armor team heal", priority: "essential" },
          { name: "Crystal Maiden", role: "Pos 5 Freezing Field ult", priority: "essential" },
        ],
        strategy: "Defending High Ground = the comeback mechanic. Tier-3 tower deals reflect damage. Living Armor heals tower. Crystal Maiden Freezing Field AoE damages enemy team. Force enemy to break formation. Backdoor protection: tower regens HP if no creep waves nearby. Aegis-less enemy team = comeback opportunity.",
        callouts: ["Tier-3 tower", "Barracks", "Ancient", "Backdoor protection", "Comeback opportunity"],
        utility: [
          "Glyph of Fortification (tower invuln 5 sec)",
          "Living Armor (Treant heal)",
          "Defensive ult (Freezing Field, Death Ward)",
          "Mana support",
          "Buy-back for last-stand defense",
        ],
      },
    },
  },
}

export default STRATS
