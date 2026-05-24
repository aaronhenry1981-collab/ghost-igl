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
  {
    id: "shipment",
    name: "Shipment",
    type: "6v6 / 24/7",
    rankedPool: true,
    sites: [
      { id: 'red-spawn', name: "Red Spawn", floor: '—' },
      { id: 'blue-spawn', name: "Blue Spawn", floor: '—' },
      { id: 'center', name: "Center", floor: '—' },
    ],
  },
  {
    id: "nuketown",
    name: "Nuketown",
    type: "6v6 / Iconic",
    rankedPool: true,
    sites: [
      { id: 'yellow-house', name: "Yellow House", floor: '—' },
      { id: 'green-house', name: "Green House", floor: '—' },
      { id: 'center', name: "Center", floor: '—' },
      { id: 'backyard', name: "Backyard", floor: '—' },
    ],
  },
  {
    id: "hijacked",
    name: "Hijacked",
    type: "6v6 / Hardpoint",
    rankedPool: true,
    sites: [
      { id: 'yacht-stern', name: "Yacht Stern", floor: '—' },
      { id: 'yacht-bow', name: "Yacht Bow", floor: '—' },
      { id: 'top-deck', name: "Top Deck", floor: '—' },
      { id: 'galley', name: "Galley", floor: '—' },
    ],
  },
  {
    id: "standoff",
    name: "Standoff",
    type: "6v6 / Hardpoint",
    rankedPool: true,
    sites: [
      { id: 'truck', name: "Truck", floor: '—' },
      { id: 'warehouse', name: "Warehouse", floor: '—' },
      { id: 'op-2', name: "OP-2", floor: '—' },
      { id: 'boneyard', name: "Boneyard", floor: '—' },
    ],
  },
  {
    id: "babylon",
    name: "Babylon",
    type: "6v6 / BO6",
    rankedPool: true,
    sites: [
      { id: 'garden', name: "Garden", floor: '—' },
      { id: 'throne-room', name: "Throne Room", floor: '—' },
      { id: 'tower', name: "Tower", floor: '—' },
      { id: 'courtyard', name: "Courtyard", floor: '—' },
    ],
  },
  {
    id: "vondel",
    name: "Vondel",
    type: "Resurgence",
    rankedPool: true,
    sites: [
      { id: 'city-center', name: "City Center", floor: '—' },
      { id: 'cathedral', name: "Cathedral", floor: '—' },
      { id: 'marina', name: "Marina", floor: '—' },
      { id: 'stadium', name: "Stadium", floor: '—' },
    ],
  },
  {
    id: "stalingrad",
    name: "Stalingrad",
    type: "6v6 / Vanguard pool",
    rankedPool: true,
    sites: [
      { id: 'tank', name: "Tank", floor: '—' },
      { id: 'factory', name: "Factory", floor: '—' },
      { id: 'plaza', name: "Plaza", floor: '—' },
      { id: 'bridge', name: "Bridge", floor: '—' },
    ],
  },
  {
    id: "gulag",
    name: "Gulag (1v1)",
    type: "Gulag",
    rankedPool: true,
    sites: [
      { id: 'main-floor', name: "Main Floor", floor: '—' },
      { id: 'catwalk', name: "Catwalk", floor: '—' },
    ],
  },
]

export default MAPS
