// Dota 2 — position 1-5 item builds, hero pool by position, draft theory.

const LOADOUTS = {
  positions: {
    name: "Position 1-5 Role Catalog",
    role: "Position assignment + responsibilities",
    summary: "Dota 2 has 5 positions, each with distinct gold/XP priority + responsibilities.",
    positions: {
      pos1: {
        name: "Position 1 — Hard Carry (Safe Lane)",
        gold_xp_priority: "1st gold + XP priority. Farms last-hits on safe lane.",
        playstyle: "Late-game damage dealer. Scaling hero. Right-click DPS.",
        items: ["Battle Fury / Manta Style → Black King Bar → Skadi → Daedalus → Butterfly"],
        meta_picks: "Anti-Mage, Spectre, Faceless Void, Wraith King, Phantom Assassin",
      },
      pos2: {
        name: "Position 2 — Mid Lane",
        gold_xp_priority: "2nd gold + XP priority. 1v1 mid for rune control.",
        playstyle: "Snowball + roam role. Mid-game team fight enabler.",
        items: ["Bottle → Power Treads → Aghs Shard → Black King Bar → Refresher / Octarine Core"],
        meta_picks: "Invoker, Shadow Fiend, Storm Spirit, Puck, Tinker, Outworld Destroyer",
      },
      pos3: {
        name: "Position 3 — Offlaner",
        gold_xp_priority: "3rd gold + XP priority. Survives 1v2 lane vs Pos 1 + Pos 5.",
        playstyle: "Mid-game initiator / tank. Team-fight ult priority.",
        items: ["Blink Dagger → Black King Bar → Crimson Guard / Pipe → Heart of Tarrasque"],
        meta_picks: "Axe, Centaur Warrunner, Tidehunter, Bristleback, Mars, Dark Seer",
      },
      pos4: {
        name: "Position 4 — Soft Support / Roamer",
        gold_xp_priority: "4th gold + XP priority. Roams to gank mid + side lanes.",
        playstyle: "Mid-game playmaker. Smoke gank specialist.",
        items: ["Smoke of Deceit → Boots → Aether Lens → Force Staff → Glimmer Cape"],
        meta_picks: "Pudge, Mirana, Tusk, Earth Spirit, Bounty Hunter",
      },
      pos5: {
        name: "Position 5 — Hard Support",
        gold_xp_priority: "5th gold + XP priority. Wards + sentries + heals for carry.",
        playstyle: "Late-game peel + ult save. Vision provider.",
        items: ["Observer + Sentry → Tranquil Boots → Aether Lens → Force Staff → Aeon Disk"],
        meta_picks: "Crystal Maiden, Lion, Lich, Warlock, Witch Doctor, Dazzle, Oracle, Treant Protector",
      },
    },
  },

  draft_theory: {
    name: "Draft Theory",
    role: "Pick + ban order matters",
    summary: "Dota 2 captains pick / ban heroes in phases. Solo Q draft strategy is just picking what works.",
    archetypes: {
      tempo: {
        name: "Tempo / Snowball Draft",
        heroes: ["Storm Spirit (mid)", "Tusk (Pos 4)", "Axe (Pos 3)", "Phantom Assassin (Pos 1)", "Lion (Pos 5)"],
        win_condition: "Mid-game smoke gank dominance. Win lanes early, snowball to high ground by 25 min.",
        weakness: "Late-game scaling carries (Spectre, Anti-Mage) outscale tempo by 35 min.",
      },
      late_game: {
        name: "Late-Game Scaling Draft",
        heroes: ["Anti-Mage (Pos 1)", "Outworld Destroyer (Pos 2)", "Tidehunter (Pos 3)", "Mirana (Pos 4)", "Treant Protector (Pos 5)"],
        win_condition: "Survive lane phase + mid game. 40-minute Battle Fury + Manta + Skadi 1v9.",
        weakness: "Tempo draft snowballing before 25 minutes. Force fights mid-game to disrupt scaling.",
      },
      team_fight: {
        name: "Team Fight Draft",
        heroes: ["Sven (Pos 1)", "Invoker (Pos 2)", "Tidehunter (Pos 3)", "Earth Spirit (Pos 4)", "Crystal Maiden (Pos 5)"],
        win_condition: "5-man team fight ult chain. Tide Ravage + CM Freezing Field + Invoker Cataclysm.",
        weakness: "Split-push comps (Tinker / Anti-Mage) that don't team fight.",
      },
      split_push: {
        name: "Split Push Draft",
        heroes: ["Tinker (Pos 2)", "Nature's Prophet (Pos 4)", "Anti-Mage (Pos 1)", "Dark Seer (Pos 3)", "Treant Protector (Pos 5)"],
        win_condition: "Split-push side lanes while team holds mid. 4v5 advantage on objectives.",
        weakness: "Coordinated 5-man teamfight comps (Wombo Combo Tide + Magnus).",
      },
    },
  },

  item_paths: {
    name: "Core Item Paths Per Position",
    role: "Item build per role + matchup",
    summary: "Item path = your win condition. Match to enemy comp.",
    paths: {
      pos1_carry: {
        name: "Pos 1 Carry (Anti-Mage style)",
        starting: ["Iron Branch x3 + Tango + Healing Salve"],
        early: ["Wraith Band / Magic Stick → Power Treads → Battle Fury"],
        mid: ["Manta Style → Skadi → Black King Bar"],
        late: ["Butterfly → Abyssal Blade → Heart of Tarrasque"],
        situational: ["Linken's Sphere vs single-target (Lion, Pudge)", "Aegis of the Immortal from Roshan"],
      },
      pos2_mid: {
        name: "Pos 2 Mid (Invoker style)",
        starting: ["Tango + Iron Branch + Mango"],
        early: ["Bottle → Boots → Wraith Band"],
        mid: ["Hand of Midas → Aether Lens → Aghs Shard"],
        late: ["Refresher Orb → Octarine Core → Hand of Midas Shard"],
        situational: ["Force Staff for save", "Black King Bar vs CC", "Eul's Scepter for setup"],
      },
      pos3_offlaner: {
        name: "Pos 3 Offlaner (Axe style)",
        starting: ["Iron Branch + Bracer + Quelling Blade"],
        early: ["Phase Boots → Vanguard → Blade Mail"],
        mid: ["Blink Dagger → Black King Bar → Crimson Guard"],
        late: ["Heart of Tarrasque → Aghs Scepter → Lotus Orb"],
        situational: ["Pipe of Insight vs AP", "Force Staff for save", "Eul's Scepter for setup"],
      },
      pos4_roamer: {
        name: "Pos 4 Roamer (Mirana style)",
        starting: ["Iron Branch + Tango + Smoke of Deceit"],
        early: ["Boots → Magic Wand → Smoke of Deceit"],
        mid: ["Aether Lens → Force Staff → Glimmer Cape"],
        late: ["Octarine Core → Aeon Disk → Aghs Shard"],
        situational: ["Force Staff for save", "Glimmer for stealth + dispel", "Eul's Scepter for setup"],
      },
      pos5_hard_support: {
        name: "Pos 5 Hard Support (Crystal Maiden style)",
        starting: ["Observer Ward + Sentry Ward + Tango"],
        early: ["Tranquil Boots → Magic Wand → Force Staff"],
        mid: ["Aether Lens → Glimmer Cape → Aghs Shard"],
        late: ["Aeon Disk → Refresher Orb → Octarine Core"],
        situational: ["Mekansm for team heal", "Pipe of Insight vs AP", "Aghs Scepter for ult upgrade"],
      },
    },
  },

  ward_strategy: {
    name: "Ward Placement Strategy",
    role: "Observer / Sentry placement",
    summary: "Wards = vision = wins. Hard Support carries ward responsibility.",
    placement: {
      observer_ward: [
        "Rune spawn high ground (top + bottom) — minutes 0, 2, 4, 6 cycle",
        "Triangle bush (between lane + jungle) — enemy gank vision",
        "Ancient camp (jungle) — scout enemy roam",
        "Roshan pit (high ground vision) — minute 7+ Aegis prep",
        "Tier-2 tower side (enemy jungle entrance) — mid-game ganks",
      ],
      sentry_ward: [
        "Anti-Pudge dewarding mid lane",
        "Anti-Bounty Hunter / Riki dewarding side lanes",
        "Roshan pit deward (deny enemy vision)",
        "Smoke gank route (catch invisible enemy)",
      ],
    },
  },

  roshan_strategy: {
    name: "Roshan Timing & Strategy",
    role: "Aegis priority + setup",
    summary: "Roshan = 1 free death (Aegis). First spawn 7:30, 8-11 min cycle after.",
    rules: [
      "First Roshan attempt: minute 15-20 with full 5-man team.",
      "Setup: smoke approach pit, deward enemy vision, Sentry pit.",
      "Pos 3 (Axe / Centaur) tanks Roshan damage.",
      "Pos 1 (Carry) takes Aegis last-hit for free life.",
      "After Aegis: push high ground siege (5-man).",
      "Second Roshan attempt: 5-7 minutes after first (Aegis countdown).",
      "Don't fight Rosh under 50% HP team; wait for full team commit.",
    ],
  },

  rune_management: {
    name: "Rune Management",
    role: "Mid lane rune control",
    summary: "Runes spawn at 0:00 + 2-minute cycle. Power Runes (Double Damage / Haste / etc.).",
    schedule: [
      "0:00 — Bounty Rune (Top + Bottom Bounty)",
      "2:00 — Power Rune (1 of 2 random)",
      "4:00, 6:00, 8:00 — Power Rune cycle",
      "After 6:00 — Bounty Rune spawns minute 6 + every 5 min",
    ],
    priority: [
      "Mid Pos 2 takes 1 power rune (Bottle restore).",
      "Pos 4/5 wards rune spawns for vision.",
      "Bounty Rune = gold + XP for support.",
      "Double Damage rune for gank kill.",
      "Haste rune for smoke gank rotation.",
    ],
  },
}

export default LOADOUTS
