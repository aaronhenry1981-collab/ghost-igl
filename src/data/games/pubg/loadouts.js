// PUBG: Battlegrounds — drop strategy per map, squad role responsibilities, weapon loadouts.

const LOADOUTS = {
  drop_strategy: {
    name: "Drop Strategy Per Map",
    role: "Pre-game drop call",
    summary: "Drop choice = game outcome. Hot drop for action, edge drop for survival.",
    by_map: {
      erangel: {
        name: "Erangel (8x8km)",
        hot_drops: ["Pochinki (center)", "School (center)", "Military Base (south)", "Georgopol (north-west)"],
        edge_drops: ["Primorsk (south coast)", "Lipovka (east)", "Stalber (north-east)"],
        recommended: "Pochinki for hot drop, Primorsk for edge drop. Mid-game rotate to circle.",
        tier_3_pois: ["Military Base", "School roof", "Georgopol Crates"],
      },
      miramar: {
        name: "Miramar (8x8km)",
        hot_drops: ["Pecado (center)", "Hacienda del Patrón (tier-3 castle)", "Los Leones (largest city)"],
        edge_drops: ["Crater Fields (north)", "Tuna Park (south)", "Power Grid (east)"],
        recommended: "Pecado for hot drop (Casino), Crater Fields for edge drop. Vehicle rotation mandatory.",
        tier_3_pois: ["Hacienda del Patrón", "Los Leones", "Pecado Casino"],
      },
      sanhok: {
        name: "Sanhok (4x4km)",
        hot_drops: ["Bootcamp (center)", "Paradise Resort (center)", "Ruins (cave)"],
        edge_drops: ["Ha Tinh (north-east)", "Lakawi (south)", "Camp Charlie (west)"],
        recommended: "Bootcamp for hot drop. Edge drops are risky on Sanhok — small map = fast rotates.",
        tier_3_pois: ["Bootcamp", "Paradise Resort"],
      },
      vikendi: {
        name: "Vikendi (6x6km)",
        hot_drops: ["Castle (center)", "Cosmodrome (tier-3 vertical)", "Villa"],
        edge_drops: ["Goroka (south)", "Tovar (north-west)"],
        recommended: "Castle for hot drop, Goroka for edge. Snow tracks visible to enemies.",
        tier_3_pois: ["Cosmodrome", "Castle", "Villa"],
      },
      taego: {
        name: "Taego (8x8km)",
        hot_drops: ["Go-Sang Village (center)", "Shipyard (tier-3)", "Hosan Town"],
        edge_drops: ["Pyungwon (south)", "Lussan (north-east)"],
        recommended: "Shipyard for tier-3 hot drop, Pyungwon for edge. Use Comeback BR feature if downed.",
        tier_3_pois: ["Shipyard", "Hosan Town", "Pochenok"],
      },
      deston: {
        name: "Deston (8x8km)",
        hot_drops: ["Amusement Park (center)", "Off-Shore Rig (tier-3)", "Ripton"],
        edge_drops: ["Ascent (south-west)", "Hindun (north)"],
        recommended: "Amusement Park for hot drop, Ascent for edge. Rig is unique vertical POI.",
        tier_3_pois: ["Off-Shore Rig", "Amusement Park", "Tomb"],
      },
    },
  },

  squad_roles: {
    name: "Squad Role Responsibilities",
    role: "4-stack role assignment",
    summary: "Each squad of 4 needs: IGL, Fragger, Sniper, Support. Assign before queue.",
    roles: {
      igl: {
        name: "IGL / Caller",
        responsibilities: [
          "Drop spot decision pre-game",
          "Rotation calls (when + which direction)",
          "Engagement decision (engage vs skip)",
          "Endgame circle reads + positioning",
          "3rd-party timing tracking",
        ],
        loadout: "M416 / AKM + Kar98k + 4 frags + 2 smokes",
      },
      fragger: {
        name: "Fragger / Entry",
        responsibilities: [
          "First push into engagements",
          "Top-K player on squad",
          "Close-range duels + entry kills",
          "Aggressive grenade usage",
          "Re-engages quickly after revives",
        ],
        loadout: "AKM / Beryl M762 + UMP45 / SMG + 4 frags + smokes",
      },
      sniper: {
        name: "Sniper / Marksman",
        responsibilities: [
          "Long-range pick-off support",
          "Compound watching + spotting",
          "Covers squad rotation",
          "Holds elevated angle",
          "Vehicle disabler",
        ],
        loadout: "Kar98k / SLR + M416 backup + 6 ranged ammo + 2 smokes",
      },
      support: {
        name: "Support / Anchor",
        responsibilities: [
          "Heals + smokes + revives",
          "Drops boost items for fragger",
          "Holds back during fights",
          "Mid-range AR backup",
          "Compound holder during fights",
        ],
        loadout: "M416 + SMG + 8 heals + 4 smokes + 2 boost stacks",
      },
    },
  },

  weapon_meta: {
    name: "Weapon Meta 2026",
    role: "Best weapons by category",
    summary: "AR + Sniper combo wins ranked. SMG/Shotgun is close-range pick.",
    categories: {
      assault_rifle: {
        S: ["Beryl M762 (highest damage AR)", "M416 (versatile, low recoil)", "AKM (high damage, hard recoil)"],
        A: ["Groza (Care Package — best AR)", "SCAR-L (low recoil beginner)", "Famas (semi-auto burst)"],
        B: ["QBZ (Sanhok variant)", "G36C (Vikendi variant)"],
      },
      sniper_rifle: {
        S: ["AWM (Care Package — 1-shot any helmet)", "Kar98k (helmet 2 1-shot)", "Mosin (Kar98 alternative)"],
        A: ["SLR (semi-auto marksman)", "Mk14 (DMR semi/full-auto)"],
        B: ["VSS (suppressed)", "M21"],
      },
      smg_shotgun: {
        S: ["UMP45 (versatile mid-range)", "S686 (instant breach kill)", "P90 (50-round mag)"],
        A: ["Uzi (fastest fire-rate)", "MP5K (Vikendi variant)"],
        B: ["Vector (low ammo mag)", "Tommy Gun (low range)"],
      },
    },
  },

  rotation_strategy: {
    name: "Rotation Strategy",
    role: "Move from POI to next circle safely",
    summary: "60% of squads die to circle damage or rotation 3rd parties. Rotation is the meta skill.",
    rules: [
      "Always rotate before circle damage starts (yellow circle close warning).",
      "Use vehicles for long rotations (Miramar / Erangel / Deston).",
      "Avoid open fields — rotate from cover to cover.",
      "Pre-position for circle close 60 seconds early.",
      "Identify 3rd-party squads via kill feed; avoid contested rotations.",
      "Smoke cover for road crossings if open terrain.",
      "Boost items stacked for HP regen during circle damage.",
    ],
  },

  endgame_strategy: {
    name: "Endgame Strategy",
    role: "Final circles (5-1 squads remaining)",
    summary: "Endgame is positional. Squad-killing rate at endgame = win condition.",
    rules: [
      "Pre-position 30 seconds before circle close (cover, prone if open).",
      "Sniper from elevated angle covers all squad approach lines.",
      "Smoke cover for rotation under enemy fire.",
      "Boost items full stacks for HP regen during damage.",
      "Identify 3rd-party squads; avoid solo engagements.",
      "Final circle: high-ground squads win 70% of time.",
      "Frag denial on common compound approach paths.",
    ],
  },
}

export default LOADOUTS
