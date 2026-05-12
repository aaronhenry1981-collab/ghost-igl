// League of Legends — strats per lane / objective on Summoner's Rift.
// `attack` = early-game aggression, lane priority, snowball windows.
// `defense` = late-game scaling, team-fight positioning, comeback mechanics.

const STRATS = {
  "summoners-rift": {
    "top-lane": {
      attack: {
        operators: [
          { name: "Darius", role: "Top Bruiser", priority: "essential" },
          { name: "Sett", role: "Top Bruiser", priority: "essential" },
          { name: "Camille", role: "Top Diver", priority: "recommended" },
          { name: "Fiora", role: "Top Skirmisher", priority: "recommended" },
        ],
        strategy: "Top lane is the island lane — 1v1 with minimal jungle interaction until 6+. Win it by trading at minion-wave advantage (your wave bigger than theirs), denying CS at their tower, and pressuring tower plates before 14:00 (plates fall off at 14:00). Push wave when river is warded for an Ignite-Teleport kill setup. Counter-engage with Q→W cancel on Darius for the 5-stack execute. Recall on plate proc; never recall on equal wave. Identify a kill window at 6 (when Sett W comes online or Camille hookshot R unlocks isolate damage).",
        callouts: ["Tri-bush", "Lane bush", "River bush", "Tower plates", "Lane minion wave", "Toplane Krug", "Raptor camp", "Recall timer"],
        utility: [
          "Ignite + Teleport for kill pressure (kill pressure at 4)",
          "Phase Rush keystone for kited bruiser matchups",
          "Conqueror keystone for sustain duelist matchups",
          "Ward river bush at 2:50 before bot lane minions land",
          "Push priority pre-6 for jungler dive setup",
        ],
      },
      defense: {
        operators: [
          { name: "Garen", role: "Top Tank", priority: "essential" },
          { name: "Ornn", role: "Top Tank", priority: "essential" },
          { name: "Malphite", role: "Top Tank", priority: "recommended" },
        ],
        strategy: "Late-game top lane is about team-fight positioning, not 1v1 trades. Group with team at 25:00 — split-pushing past this without team comm = loss. Frontline engage from side: Ornn R global slow into team commitment, Malphite R AoE knockup on 3+ enemy carries. Buy 1 magic resist + 1 armor item before late-game fights; pure armor or pure MR is throwing. Hold flash for the R combo — flashing into Malphite R is the highest-impact play in LoL. Pre-position before fights start; never engage 2v3 in the side lane.",
        callouts: ["Tri-bush", "Tower plates", "River bush", "Recall timer", "Engagement range", "Frontline cover", "Late game commit"],
        utility: [
          "Hold R for team-fight engage (never burn on solo)",
          "Position before the 5 cluster (no split-push 25:00+)",
          "Build 1 armor + 1 MR (mix damage types)",
          "Ward river before Baron commit (3:00 timer)",
          "Counter-engage on enemy carry positioning",
        ],
      },
    },
    "mid-lane": {
      attack: {
        operators: [
          { name: "Yasuo", role: "Mid Skirmisher", priority: "essential" },
          { name: "Akali", role: "Mid Assassin", priority: "essential" },
          { name: "Zed", role: "Mid Assassin", priority: "recommended" },
          { name: "Ahri", role: "Mid Burst Mage", priority: "recommended" },
        ],
        strategy: "Mid lane wins the map. Push pre-6, get level 6 ult timer, roam to bot lane at 5:30 or top lane at 4:00 (when CSers respawn from the first push). Reset on full mana + 1300 gold for component item, return with R level. Trade in lane at minion advantage: Q-W combo as Ahri while minions distract enemy auto-aim. Snowball window: 6-12 minutes. After 12 the side lanes have farm leads and you need to enable them. Track enemy mid lane Flash; if they flash early, you have a 5-minute kill window every time they push past river.",
        callouts: ["Mid lane river", "Tower plates", "Raptor camp", "Roam timer", "Recall timer", "Flash cooldown enemy mid", "Lane wave state"],
        utility: [
          "Flash + Ignite kill setup (3-4 second commit)",
          "Roam timer: 5:30 to bot lane on mid push",
          "Track enemy Flash cooldown (5-minute kill window)",
          "Reset on full mana + 1300 gold for component",
          "Ward both river bushes (track jungler position)",
        ],
      },
      defense: {
        operators: [
          { name: "Orianna", role: "Mid Control Mage", priority: "essential" },
          { name: "Syndra", role: "Mid Burst Mage", priority: "essential" },
          { name: "Lulu", role: "Mid Enchanter (off-meta)", priority: "recommended" },
        ],
        strategy: "Late-game mid is team-fight central. Position 2-3 screens behind ADC, R ready for the engage. Orianna ball management: keep ball on your tank pre-fight, R AoE pull engage on enemy 3+ cluster. Syndra: 6 sphere R 1-shot on enemy ADC mid-fight (must position with Stopwatch ready). Hold ult for the team-fight commit — burning R on a side-lane skirmish is a throw. Buy 1 mana item + 1 AP item per back; component scaling matters more than direct damage at 30:00.",
        callouts: ["Mid lane river", "Engagement range", "Frontline cover", "ADC positioning", "Recall timer", "Flash cooldown enemy carries"],
        utility: [
          "Hold R for team-fight engage",
          "Position 2 screens behind ADC",
          "Buy 1 mana item per back (don't go full AP first)",
          "Track enemy Flash cooldowns on carries",
          "Counter-engage on enemy R timing",
        ],
      },
    },
    "bot-lane": {
      attack: {
        operators: [
          { name: "Caitlyn", role: "ADC Marksman", priority: "essential" },
          { name: "Jinx", role: "ADC Marksman", priority: "essential" },
          { name: "Pyke", role: "Support Assassin", priority: "recommended" },
          { name: "Thresh", role: "Support Engage", priority: "recommended" },
        ],
        strategy: "Bot lane has the most kill pressure in the early game — 2v2 with potential 4v4 dragon fights at 6:00. Push wave for plate gold pre-7:30 (first dragon spawn). Cait + Pyke: trap-setup at level 1, R-hook execute at 6. Bait Flash with poke; once enemy Flash is down, all-in trade. Recall after each plate proc or when Flash is up on enemy. Track enemy jungler position via top lane river ward at 3:30; bot dives at 4:00 if jungler is bot-side. Scale toward Item 1 spike: BF Sword + Pickaxe (Cait) or BF + Vamp Scepter (Jinx late).",
        callouts: ["Tri-bush", "River bush", "Lane bush", "Dragon pit", "Tower plates", "Jungler ward (top river)", "Recall timer", "Flash cooldown enemy bot"],
        utility: [
          "Flash + Ignite kill at level 6",
          "Push for plate gold before first dragon",
          "Track enemy Flash (5-minute kill window)",
          "Ward top river at 3:30 for jungler track",
          "Component spike Item 1 at 7-8 min",
        ],
      },
      defense: {
        operators: [
          { name: "Jhin", role: "ADC Marksman", priority: "essential" },
          { name: "Senna", role: "Support Marksman", priority: "recommended" },
          { name: "Janna", role: "Enchanter Support", priority: "essential" },
          { name: "Lulu", role: "Enchanter Support", priority: "recommended" },
        ],
        strategy: "Late-game bot lane is ADC hyper-carry mode. ADC stays 3+ screens from front line, attacks slowest tank for max DPS through wave clear. Lulu W polymorph on diving assassin, R ally HP burst pre-engage. Janna E shield on ADC pre-fight, R AoE knockback when enemy commits. Don't go for kills late game — kite the engage, win team fight from positioning. Track enemy assassin Flash + R cooldowns; if Zed R is down, ADC can play forward 1 screen.",
        callouts: ["Tri-bush", "ADC positioning", "Tank frontline", "Engagement range", "Carry peel", "R cooldown enemy assassin"],
        utility: [
          "Position 3+ screens from frontline",
          "Hold W polymorph for diving assassin",
          "R AoE knockback on enemy commit",
          "Track enemy assassin R cooldown",
          "Build 1 defensive item if dive comp (Mercurial / GA)",
        ],
      },
    },
    "jungle": {
      attack: {
        operators: [
          { name: "Lee Sin", role: "Jungle Diver", priority: "essential" },
          { name: "Hecarim", role: "Jungle Bruiser", priority: "recommended" },
          { name: "Kha'Zix", role: "Jungle Assassin", priority: "essential" },
          { name: "Vi", role: "Jungle Diver", priority: "recommended" },
        ],
        strategy: "Jungle wins the early game through coordination. Path Red → Blue → Krugs for Lee Sin (full clear ganking bot at 3:30). Counter-jungle at 5:00 if mid has push and enemy jungler is opposite side. Gank windows: 3:30 (first wave pushes), 5:00 (level 3 spike), 6:00 (R unlocked, kill pressure on Tabis tanks). Drake control: first drake at 7:30 (have wards at 7:00). Track enemy jungler via mid wave state + top lane ward. Snowball window: 6-12 minutes. Past 12, you transition to side lane Gromp/Wolves farm and team-fight prep.",
        callouts: ["Red buff", "Blue buff", "Krugs", "Raptors", "Wolves", "Gromp", "Drake spawn timer", "Baron timer", "Scuttle crab", "Enemy jungler position"],
        utility: [
          "Path: Red → Blue → Krugs (full clear)",
          "Counter-jungle at 5:00 if push priority elsewhere",
          "Gank windows: 3:30 / 5:00 / 6:00",
          "Drake control at 7:30 (ward 7:00)",
          "Track enemy jungler via mid wave state",
        ],
      },
      defense: {
        operators: [
          { name: "Sejuani", role: "Jungle Tank", priority: "essential" },
          { name: "Bel'Veth", role: "Jungle Skirmisher", priority: "recommended" },
        ],
        strategy: "Late-game jungle is engagement timing. Sejuani R AoE stun on 3+ enemies = team-fight winner. Bel'Veth scales infinite (true damage Q resets, attack speed scaling). Late game: clear your camps fast, ward enemy Baron pit and Drake pit, group with team. Don't solo skirmish past 25:00 — your value is the R engage in the 5v5. Hold R for the team commit. Build 1 armor + 1 MR; mixed defensive items beat 2× same-type. Track enemy Smite (jungler can steal Baron with Smite range).",
        callouts: ["Drake pit", "Baron pit", "Enemy jungler position", "Engagement range", "Recall timer", "Flash cooldown enemy carries"],
        utility: [
          "Hold R for team-fight engage",
          "Ward Baron + Drake pits before 5 minutes spawn",
          "Build 1 armor + 1 MR (mixed defensive)",
          "Track enemy Smite cooldown",
          "Don't solo skirmish past 25:00",
        ],
      },
    },
    "dragon-soul": {
      attack: {
        operators: [
          { name: "Sejuani", role: "Jungle Tank", priority: "essential" },
          { name: "Caitlyn", role: "ADC Marksman", priority: "essential" },
          { name: "Lulu", role: "Enchanter Support", priority: "recommended" },
        ],
        strategy: "Dragon is the snowball objective. First drake spawns at 7:30, then every 5 minutes. Soul = 4 drakes of one type (occurs around 25:00 if you control early). Soul wins games. Setup: clear vision in enemy bot-side jungle (Krug, Gromp), ward pit at 7:00 for 7:30 spawn. ADC drops Pickaxe/BF for damage boost on drake hit. Jungler Smite priority — count enemy Smite cooldown (90s). If down, drake is uncontested. Soul Point game (3-2 in drakes): force the 4th drake with full team commit. Push wave 1 lane to draw enemy split.",
        callouts: ["Dragon pit", "Drake spawn timer", "Krug camp", "Gromp camp", "Tri-bush ward", "Enemy Smite cooldown"],
        utility: [
          "Ward pit at 7:00 for 7:30 spawn",
          "Track enemy Smite (90s cooldown)",
          "Force soul 4th drake with full team commit",
          "Push wave 1 lane to split enemy",
          "Drop component item for damage boost (Pickaxe)",
        ],
      },
      defense: {
        operators: [
          { name: "Ornn", role: "Top Tank", priority: "essential" },
          { name: "Orianna", role: "Mid Control Mage", priority: "recommended" },
          { name: "Janna", role: "Enchanter Support", priority: "essential" },
        ],
        strategy: "Defending drake from soul point = contest, not deny. If you can't kill the drake or out-fight, force trades that bleed enemy team for Baron pivot. Deep ward enemy jungle 5 minutes before spawn. Smoke screen the pit: Orianna R AoE for pit displacement, Janna R knockback enemy from drake. Don't engage 3v5 to save drake — turn it into a 5v5 around Baron or push enemy mid lane while they take drake. If they take 4th drake (soul), tank up and force one team-fight win in 30 seconds before soul scaling kicks in.",
        callouts: ["Dragon pit", "Baron pit pivot", "Enemy jungler position", "Engagement range", "Frontline cover"],
        utility: [
          "Deep ward enemy jungle 5 min pre-spawn",
          "R AoE displacement on pit (Orianna)",
          "Pivot to Baron if can't contest drake",
          "Force 5v5 with full ult availability",
          "Buy 1 defensive item per soul scaling",
        ],
      },
    },
    "baron": {
      attack: {
        operators: [
          { name: "Sejuani", role: "Jungle Tank", priority: "essential" },
          { name: "Ornn", role: "Top Tank", priority: "recommended" },
          { name: "Orianna", role: "Mid Control Mage", priority: "essential" },
        ],
        strategy: "Baron spawns at 25:00. Baron buff: empowers minions, gives team boost — game-winning. Setup: ward enemy jungle 3 minutes pre-spawn, push 1-2 lanes to draw enemy split. Don't start Baron without team awareness — check enemy position via warding. Smite priority on jungler (count enemy Smite). Sejuani R AoE stun on enemy 3+ commit. Orianna R AoE pull engage on pit. If contested: force the 5v5 around the pit, not in. Tank dives onto enemy ADC, mage backline kills support, carry takes Baron after.",
        callouts: ["Baron pit", "Drake pit pivot", "Top river ward", "Jungle camps", "Enemy Smite cooldown", "Engagement range"],
        utility: [
          "Ward enemy jungle 3 min pre-spawn",
          "Push 1-2 lanes to draw enemy split",
          "Force 5v5 around pit, not in",
          "Smite priority on jungler",
          "Buy 1 defensive item + 1 damage item before commit",
        ],
      },
      defense: {
        operators: [
          { name: "Ornn", role: "Top Tank", priority: "essential" },
          { name: "Janna", role: "Enchanter Support", priority: "recommended" },
          { name: "Lulu", role: "Enchanter Support", priority: "essential" },
        ],
        strategy: "Defending Baron = either contest or punish. If you can't kill Baron + survive, force a trade lane while they Baron. Lulu/Janna R disengage on enemy commit; never solo engage 3v5. Deep ward enemy jungle from minute 22 (Baron-1, Baron-2, Baron-pit, river-2). Smite steal: Sejuani jungle can Smite Baron from pit edge for steal (R AoE before Smite). If enemy takes Baron + buff: rotate to defensive position, push minion waves to clear empowered minions, hold tower 2 base. Don't team-fight under Baron buff disadvantage — wait it out (3 minutes).",
        callouts: ["Baron pit", "Top river", "Top tower 2", "Mid tower 2", "Engagement range", "Enemy Smite cooldown"],
        utility: [
          "Deep ward enemy jungle from 22:00",
          "Smite steal setup (R AoE before Smite)",
          "Defensive R disengage on enemy commit",
          "Push waves to clear empowered minions",
          "Hold tower 2 base if Baron lost (3 min)",
        ],
      },
    },
  },
}

export default STRATS
