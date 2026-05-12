// Dota 2 — single ranked map with lanes + objectives as sites.
// `side` mapping: Radiant = attack-side (bottom-left), Dire = defense-side (top-right).

const MAPS = [
  {
    id: "dota-map",
    name: "The Dota Map",
    type: "5v5 Ranked",
    rankedPool: true,
    sites: [
      { id: "safe-lane", name: "Safe Lane (Carry, Pos 1)", floor: "—" },
      { id: "mid-lane", name: "Mid Lane (Pos 2)", floor: "—" },
      { id: "off-lane", name: "Off Lane (Pos 3)", floor: "—" },
      { id: "jungle", name: "Jungle / Stacking (Pos 4)", floor: "—" },
      { id: "roshan-pit", name: "Roshan Pit (Aegis Objective)", floor: "—" },
      { id: "high-ground", name: "High Ground Defense", floor: "—" },
      { id: "ancient-siege", name: "Ancient Siege (Final Push)", floor: "—" },
      { id: "lane-phase", name: "Lane Phase (0-15 min)", floor: "—" },
      { id: "mid-game", name: "Mid Game (15-25 min)", floor: "—" },
      { id: "late-game", name: "Late Game (25+ min)", floor: "—" },
    ],
  },
  {
    id: "turbo",
    name: "Turbo Mode",
    type: "Casual",
    rankedPool: false,
    sites: [
      { id: "lane-compressed", name: "Lanes (Compressed Phase)", floor: "—" },
      { id: "objectives", name: "Objectives Phase", floor: "—" },
    ],
  },
]

export default MAPS
