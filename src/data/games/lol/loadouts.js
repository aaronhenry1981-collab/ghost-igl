// League of Legends — comp archetypes, counter picks, item priorities per role.
// LoL "loadouts" = team comp + champion-specific item path. No per-round buy
// like CS/Valorant; build is recall-by-recall purchase from base shop.

const LOADOUTS = {
  comps: {
    name: "Team Compositions",
    role: "Comp archetype identification",
    summary: "Three core comps in LoL: dive, poke, protect. Pick what your draft enables; mismatch loses.",
    archetypes: {
      dive: {
        name: "Dive Comp",
        recommended: [
          "Malphite / Ornn (top engage)",
          "Hecarim / Lee Sin (jungle dive)",
          "Akali / Yasuo (mid burst)",
          "Kai'Sa (ADC mobility)",
          "Leona / Nautilus (support engage)",
        ],
        plays: "Coordinated multi-engage on enemy backline. Tank front, assassins follow up, support locks down the carry.",
        win_condition: "Pick off enemy ADC before mid-game team fights solidify positioning.",
        weakness: "Disengage comps (Janna / Anivia walls / Tahm Kench eat), shield supports.",
      },
      poke: {
        name: "Poke Comp",
        recommended: [
          "Jayce / Kennen (top poke)",
          "Nidalee / Karthus (jungle poke)",
          "Ziggs / Xerath (mid poke)",
          "Caitlyn / Jhin (ADC range)",
          "Karma / Lux (support poke)",
        ],
        plays: "Stay max range, force enemy to engage at low HP. Long sightlines + abilities chip enemy before commit.",
        win_condition: "Enemy team starts at 60% HP from poke pre-fight; you win the 5v5 inevitable engage.",
        weakness: "Dive comps closing the distance with hard engage (Malphite R, Sejuani R, Leona R chain).",
      },
      protect: {
        name: "Protect the Carry Comp",
        recommended: [
          "Ornn / Sion (top tank)",
          "Sejuani / Maokai (jungle CC tank)",
          "Orianna / Lulu (mid enchanter)",
          "Jinx / Vayne (ADC hyper-carry)",
          "Janna / Soraka (support enchanter)",
        ],
        plays: "Build entire team around protecting hyper-carry ADC. Two enchanters peel, 2 tanks frontline, ADC kites infinitely.",
        win_condition: "Late game (30+ min) ADC out-DPS-es enemy entire team in extended team fights.",
        weakness: "Early-game pressure (15-20 min team fight commits before carry scaling).",
      },
      split_push: {
        name: "Split Push Comp",
        recommended: [
          "Fiora / Camille / Tryndamere (top split)",
          "Hecarim / Master Yi (fast jungle)",
          "Akshan / Ziggs (mid wave clear)",
          "Senna / Sivir (ADC team fight)",
          "Tahm Kench / Janna (support peel)",
        ],
        plays: "Side-lane carry creates 4v5 pressure. Team holds mid, side-laner takes towers. Force enemy 1v1 → win team fight 4v4.",
        win_condition: "Enemy can't decide whether to defend tower or fight 4v5 around objective.",
        weakness: "Coordinated 5-man enemy team-fight comps (Malphite + Yasuo R wombo).",
      },
    },
  },

  counters: {
    name: "Counter Picks",
    role: "Hard counters by champion",
    summary: "Lane counter-pick wins lane. Use Champion Select to deny opponent's pick or counter directly.",
    counter_table: [
      { champion: "Yasuo", counter: "Malphite, Renekton, Pantheon", why: "Malphite point-and-click stun + AP burst; Renekton early all-in pressure" },
      { champion: "Darius", counter: "Vayne, Quinn, Kennen", why: "Range bullies — kite Darius before he Q-pulls into 5-stack" },
      { champion: "Camille", counter: "Renekton, Tryndamere, Ornn", why: "Tank or scaling bruiser; Camille falls off late game" },
      { champion: "Fiora", counter: "Malphite, Jax, Cho'Gath", why: "Tank busters or Jax E-stun stops Fiora R" },
      { champion: "Lee Sin", counter: "Skarner, Karthus, Nocturne", why: "Scaling junglers — Lee falls off after 20 min" },
      { champion: "Kha'Zix", counter: "Jarvan IV, Vi, Skarner", why: "CC + tank front-line shuts down Kha isolation kit" },
      { champion: "Zed", counter: "Lissandra, Malzahar, Pantheon", why: "Hard CC + R suppress lock down Zed all-ins" },
      { champion: "Akali", counter: "Pantheon, Annie, Galio", why: "Burst champions that 1-shot Akali in lane before shroud" },
      { champion: "Ahri", counter: "Yasuo, Talon, Fizz", why: "Mobility champions slip Ahri charm + burst her down" },
      { champion: "Jhin", counter: "Lucian, Kalista, Draven", why: "Lane bullies that all-in Jhin in his reload windows" },
      { champion: "Jinx", counter: "Caitlyn, Draven, Lucian", why: "Early-game bullies stop Jinx scaling" },
      { champion: "Caitlyn", counter: "Kalista, Lucian, Draven", why: "Mobility ADCs close Cait's auto range advantage" },
      { champion: "Thresh", counter: "Morgana, Janna, Soraka", why: "Anti-CC supports nullify Thresh hooks" },
      { champion: "Leona", counter: "Janna, Morgana, Karma", why: "Disengage shields/heals after Leona R commit" },
      { champion: "Lulu", counter: "Brand, Vel'Koz, Zyra", why: "AoE damage supports out-trade Lulu pre-6" },
    ],
  },

  item_paths: {
    name: "Item Priority Per Role",
    role: "Build paths by role + matchup",
    summary: "Mythic Items anchor each role build. Adjust based on enemy comp.",
    role_paths: {
      top_bruiser: {
        name: "Top Bruiser (Darius, Sett, Camille)",
        core: ["Stridebreaker → Sterak's Gage → Death's Dance"],
        situational: ["Tabis (vs AD)", "Mercury's Treads (vs AP/CC)", "Maw of Malmortius (vs full AP)"],
        priority: "Mythic → Defensive Boots → Second damage item → 1 defensive (Steark's or Death's Dance)",
      },
      top_tank: {
        name: "Top Tank (Ornn, Malphite, Garen)",
        core: ["Thornmail → Heartsteel → Frozen Heart"],
        situational: ["Sunfire Aegis (engage)", "Force of Nature (vs AP)", "Randuin's (vs crit ADC)"],
        priority: "Mythic → Defensive Boots → Resistance items (1 armor + 1 MR) → Late tank scaling",
      },
      jungle_diver: {
        name: "Jungle Diver (Lee, Hecarim, Vi)",
        core: ["Eclipse → Ravenous Hydra → Death's Dance"],
        situational: ["Tabis", "Mercury's Treads", "Maw"],
        priority: "Mythic → Damage item 2 → 1 defensive item (Stearaks)",
      },
      jungle_tank: {
        name: "Jungle Tank (Sejuani, Maokai)",
        core: ["Sunfire Aegis → Thornmail → Force of Nature"],
        situational: ["Heartsteel", "Frozen Heart", "Randuin's"],
        priority: "Mythic → Defensive Boots → Resistance items → Late tank scaling",
      },
      mid_burst_mage: {
        name: "Mid Burst Mage (Syndra, Ahri, Orianna)",
        core: ["Luden's Companion → Shadowflame → Rabadon's Deathcap"],
        situational: ["Zhonya's Hourglass (vs assassin)", "Banshee's Veil (vs hook)"],
        priority: "Mythic → Damage item 2 → 1 defensive item (Zhonya's or Banshee's)",
      },
      mid_assassin: {
        name: "Mid Assassin (Zed, Akali, Talon)",
        core: ["Eclipse → Edge of Night → Serylda's Grudge"],
        situational: ["Maw of Malmortius (vs AP)", "Death's Dance (vs sustain)"],
        priority: "Mythic → Edge of Night (spell shield) → Late penetration",
      },
      adc_crit: {
        name: "ADC Crit (Caitlyn, Jinx, Jhin)",
        core: ["Galeforce / Yun Tal → Infinity Edge → Rapid Firecannon"],
        situational: ["Bloodthirster (vs poke)", "Mercurial Scimitar (vs Zed/Malzahar R)"],
        priority: "Mythic → IE → Crit item 3 → 1 defensive item (Mercurial or GA)",
      },
      adc_hybrid: {
        name: "ADC Hybrid (Kai'Sa)",
        core: ["Kraken Slayer / Galeforce → Nashor's Tooth → Rabadon's"],
        situational: ["Bloodthirster", "Zhonya's (anti-burst)"],
        priority: "Mythic → AP evolution → Defensive item (Mercurial or Zhonya's)",
      },
      support_enchanter: {
        name: "Support Enchanter (Lulu, Janna, Soraka)",
        core: ["Moonstone Renewer → Ardent Censer → Redemption"],
        situational: ["Mikael's Blessing (vs CC)", "Locket of the Iron Solari (vs burst)"],
        priority: "Mythic → Ally enchant items → 1 defensive item (Locket)",
      },
      support_engage: {
        name: "Support Engage (Thresh, Leona, Nautilus)",
        core: ["Locket of the Iron Solari → Knight's Vow → Zeke's Convergence"],
        situational: ["Frozen Heart (vs AS)", "Force of Nature (vs AP)"],
        priority: "Mythic → Ally protect items → Late tank scaling",
      },
    },
  },

  rune_pages: {
    name: "Rune Page Setups",
    role: "Keystone + secondary tree",
    summary: "Rune choice matters more than build for snowball lanes.",
    keystones: [
      { keystone: "Conqueror", users: "Darius, Garen, Camille, Lee Sin", why: "Sustain duelists — adaptive force per stack" },
      { keystone: "Phase Rush", users: "Yasuo, Hecarim, Ezreal", why: "Kited bruisers — movement speed escape" },
      { keystone: "Electrocute", users: "Zed, Akali, Talon, Pantheon", why: "Burst damage on 3rd attack/ability" },
      { keystone: "Arcane Comet", users: "Ahri, Orianna, Lux, Karma", why: "Poke mages — comet for sustained damage" },
      { keystone: "Aery", users: "Lulu, Karma, Soraka, Janna", why: "Enchanters — ally shield/heal" },
      { keystone: "Press the Attack", users: "Jinx, Caitlyn, Vayne", why: "ADC sustained DPS — 3 auto stack" },
      { keystone: "First Strike", users: "Senna, ADC roamers", why: "Damage boost for first ability/auto" },
      { keystone: "Lethal Tempo", users: "Master Yi, Tryndamere, Aphelios", why: "Attack speed scaling carries" },
      { keystone: "Glacial Augment", users: "Lulu, Janna (poke)", why: "Slow on auto, poke enchanter" },
    ],
  },

  summoner_spells: {
    name: "Summoner Spells",
    role: "Flash + secondary by role",
    summary: "Flash mandatory for every role. Second slot depends on role + comp.",
    by_role: {
      top: { flash: "always", secondary: "Teleport (lane / map presence)", alt: "Ignite (kill pressure on Conqueror champs)" },
      jungle: { flash: "always", secondary: "Smite (mandatory for jungle camps + objectives)", alt: "Ghost (for Hecarim / Singed)" },
      mid: { flash: "always", secondary: "Teleport (roam) or Ignite (kill pressure)", alt: "Cleanse (vs CC mid like Lissandra)" },
      adc: { flash: "always", secondary: "Heal (sustain)", alt: "Cleanse (vs hook supports)" },
      support: { flash: "always", secondary: "Ignite (kill setup support)", alt: "Exhaust (vs assassin comp)" },
    },
  },
}

export default LOADOUTS
