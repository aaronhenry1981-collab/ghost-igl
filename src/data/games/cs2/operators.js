// Counter-Strike 2 — Player role archetypes (the "cast").
// CS2 has no character picks; the cast is the 5 standard player roles
// every team runs in a buy round. Kits list the canonical weapon +
// utility loadout each role buys on a full-buy.

const CAST = [
  {
    id: "entry",
    name: "Entry Fragger",
    role: "Entry",
    side: "attack",
    kit: ["AK-47", "Glock / Tec-9 (pistol round)", "Two flashbangs", "Smoke", "Kevlar+Helmet"],
  },
  {
    id: "awper",
    name: "AWPer",
    role: "AWP",
    side: null,
    kit: ["AWP", "Desert Eagle (secondary)", "Smoke", "Flashbang", "Kevlar+Helmet"],
  },
  {
    id: "support",
    name: "Support",
    role: "Support",
    side: null,
    kit: ["AK-47 / M4A4", "Two smokes", "Two flashbangs", "Molotov / Incendiary", "Kevlar+Helmet", "Defuse kit (CT)"],
  },
  {
    id: "lurker",
    name: "Lurker",
    role: "Lurker",
    side: "attack",
    kit: ["AK-47 / AUG", "Smoke", "Flashbang", "Molotov", "Kevlar+Helmet"],
  },
  {
    id: "igl",
    name: "In-Game Leader",
    role: "IGL",
    side: null,
    kit: ["AK-47 / M4A1-S", "Two flashbangs", "Smoke", "Decoy / HE", "Kevlar+Helmet", "Defuse kit (CT)"],
  },
]

export default CAST
