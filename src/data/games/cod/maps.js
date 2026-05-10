// Call of Duty — Warzone (BR + Resurgence) + MW3 6v6 multiplayer maps.
// Map types: Resurgence BR, BR (large map), 6v6 MP.
// VERIFY: rotation changes per season — check Activision news.

const MAPS = [
  {
    id: "rebirth-island",
    name: "Rebirth Island",
    type: "Resurgence BR",
    rankedPool: true,
    sites: [
      { id: "prison", name: "Prison Block", floor: '—' },
      { id: "security", name: "Security Area", floor: '—' },
      { id: "headquarters", name: "Headquarters", floor: '—' },
      { id: "living-quarters", name: "Living Quarters", floor: '—' },
      { id: "industry", name: "Industry", floor: '—' },
    ],
  },
  {
    id: "verdansk",
    name: "Verdansk",
    type: "BR",
    rankedPool: true,
    sites: [
      { id: "downtown", name: "Downtown", floor: '—' },
      { id: "superstore", name: "Superstore", floor: '—' },
      { id: "airport", name: "Airport", floor: '—' },
      { id: "farmland", name: "Farmland", floor: '—' },
      { id: "stadium", name: "Stadium", floor: '—' },
      { id: "dam", name: "Dam", floor: '—' },
      { id: "hospital", name: "Hospital", floor: '—' },
    ],
  },
  {
    id: "skidrow",
    name: "Skidrow (MW3 6v6)",
    type: "6v6 MP",
    rankedPool: true,
    sites: [
      { id: "mid", name: "Mid Lane", floor: '—' },
      { id: "apartments", name: "Apartments", floor: '—' },
      { id: "spawn-side", name: "Spawn Side", floor: '—' },
    ],
  },
  {
    id: "highrise",
    name: "Highrise (MW3 6v6)",
    type: "6v6 MP",
    rankedPool: true,
    sites: [
      { id: "helipad", name: "Helipad", floor: '—' },
      { id: "cranes", name: "Cranes / Construction", floor: '—' },
      { id: "office", name: "Office Tower", floor: '—' },
    ],
  },
  {
    id: "terminal",
    name: "Terminal (MW3 6v6)",
    type: "6v6 MP",
    rankedPool: true,
    sites: [
      { id: "plane", name: "Plane / Tarmac", floor: '—' },
      { id: "lobby", name: "Lobby", floor: '—' },
      { id: "spawn-side", name: "Spawn Side", floor: '—' },
    ],
  },
  {
    id: "rust",
    name: "Rust (MW3 6v6)",
    type: "6v6 MP",
    rankedPool: true,
    sites: [
      { id: "tower", name: "Tower", floor: '—' },
      { id: "mid", name: "Mid Lane", floor: '—' },
    ],
  },
  {
    id: "karachi",
    name: "Karachi (MW3 6v6)",
    type: "6v6 MP",
    rankedPool: true,
    sites: [
      { id: "mid", name: "Mid Lane", floor: '—' },
      { id: "a-side", name: "A Side", floor: '—' },
      { id: "b-side", name: "B Side", floor: '—' },
    ],
  },
  {
    id: "favela",
    name: "Favela (MW3 6v6)",
    type: "6v6 MP",
    rankedPool: true,
    sites: [
      { id: "mid-hill", name: "Mid / Hill", floor: '—' },
      { id: "a-side", name: "A Side", floor: '—' },
      { id: "b-side", name: "B Side", floor: '—' },
    ],
  },
]

export default MAPS
