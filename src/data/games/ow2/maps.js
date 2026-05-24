// Overwatch 2 — current rotation May 2026 (~16 maps across all gametypes).
// `floor` field unused; `type` field added per-map for gametype dispatch.
// VERIFY: rotation changes seasonally — check Blizzard official pool.

const MAPS = [
  {
    id: "antarctic-peninsula",
    name: "Antarctic Peninsula",
    type: "Control",
    rankedPool: true,
    sites: [
      { id: "icebreaker", name: "Icebreaker", floor: '—' },
      { id: "sub-level", name: "Sub-Level", floor: '—' },
      { id: "labs", name: "Labs", floor: '—' },
    ],
  },
  {
    id: "busan",
    name: "Busan",
    type: "Control",
    rankedPool: true,
    sites: [
      { id: "sanctuary", name: "Sanctuary", floor: '—' },
      { id: "downtown", name: "Downtown", floor: '—' },
      { id: "meka-base", name: "MEKA Base", floor: '—' },
    ],
  },
  {
    id: "ilios",
    name: "Ilios",
    type: "Control",
    rankedPool: true,
    sites: [
      { id: "lighthouse", name: "Lighthouse", floor: '—' },
      { id: "ruins", name: "Ruins", floor: '—' },
      { id: "well", name: "Well", floor: '—' },
    ],
  },
  {
    id: "nepal",
    name: "Nepal",
    type: "Control",
    rankedPool: true,
    sites: [
      { id: "village", name: "Village", floor: '—' },
      { id: "shrine", name: "Shrine", floor: '—' },
      { id: "sanctum", name: "Sanctum", floor: '—' },
    ],
  },
  {
    id: "eichenwalde",
    name: "Eichenwalde",
    type: "Hybrid",
    rankedPool: true,
    sites: [
      { id: "point-a", name: "Point A (Townsquare)", floor: '—' },
      { id: "payload-1", name: "Payload — Castle Gate", floor: '—' },
      { id: "payload-2", name: "Payload — Throne Room", floor: '—' },
    ],
  },
  {
    id: "kings-row",
    name: "King's Row",
    type: "Hybrid",
    rankedPool: true,
    sites: [
      { id: "point-a", name: "Point A (Statue)", floor: '—' },
      { id: "payload-1", name: "Payload — Underground", floor: '—' },
      { id: "payload-2", name: "Payload — Final Bridge", floor: '—' },
    ],
  },
  {
    id: "midtown",
    name: "Midtown",
    type: "Hybrid",
    rankedPool: true,
    sites: [
      { id: "point-a", name: "Point A (Plaza)", floor: '—' },
      { id: "payload-1", name: "Payload — Subway", floor: '—' },
      { id: "payload-2", name: "Payload — Final", floor: '—' },
    ],
  },
  {
    id: "numbani",
    name: "Numbani",
    type: "Hybrid",
    rankedPool: true,
    sites: [
      { id: "point-a", name: "Point A (Lobby)", floor: '—' },
      { id: "payload-1", name: "Payload — Streets", floor: '—' },
      { id: "payload-2", name: "Payload — Final", floor: '—' },
    ],
  },
  {
    id: "circuit-royal",
    name: "Circuit Royal",
    type: "Escort",
    rankedPool: true,
    sites: [
      { id: "payload-1", name: "Payload — Main Entry", floor: '—' },
      { id: "payload-2", name: "Payload — Garage", floor: '—' },
      { id: "payload-3", name: "Payload — Vault", floor: '—' },
    ],
  },
  {
    id: "dorado",
    name: "Dorado",
    type: "Escort",
    rankedPool: true,
    sites: [
      { id: "payload-1", name: "Payload — First Choke", floor: '—' },
      { id: "payload-2", name: "Payload — Bridge", floor: '—' },
      { id: "payload-3", name: "Payload — Final", floor: '—' },
    ],
  },
  {
    id: "junkertown",
    name: "Junkertown",
    type: "Escort",
    rankedPool: true,
    sites: [
      { id: "payload-1", name: "Payload — Big Truck", floor: '—' },
      { id: "payload-2", name: "Payload — Mid", floor: '—' },
      { id: "payload-3", name: "Payload — Final", floor: '—' },
    ],
  },
  {
    id: "gibraltar",
    name: "Watchpoint: Gibraltar",
    type: "Escort",
    rankedPool: true,
    sites: [
      { id: "payload-1", name: "Payload — First Choke", floor: '—' },
      { id: "payload-2", name: "Payload — Hangar", floor: '—' },
      { id: "payload-3", name: "Payload — Final Mech", floor: '—' },
    ],
  },
  {
    id: "colosseo",
    name: "Colosseo",
    type: "Push",
    rankedPool: true,
    sites: [
      { id: "mid", name: "Mid (Arch)", floor: '—' },
      { id: "p1", name: "Push Point 1", floor: '—' },
      { id: "p2", name: "Push Point 2 (Final)", floor: '—' },
    ],
  },
  {
    id: "esperanca",
    name: "Esperança",
    type: "Push",
    rankedPool: true,
    sites: [
      { id: "mid", name: "Mid (Plaza)", floor: '—' },
      { id: "p1", name: "Push Point 1", floor: '—' },
      { id: "p2", name: "Push Point 2 (Final)", floor: '—' },
    ],
  },
  {
    id: "suravasa",
    name: "Suravasa",
    type: "Flashpoint",
    rankedPool: true,
    sites: [
      { id: "point-1", name: "Point — Suravasa Tower", floor: '—' },
      { id: "point-2", name: "Point — Marketplace", floor: '—' },
      { id: "point-3", name: "Point — Reservoir", floor: '—' },
      { id: "point-4", name: "Point — Sanctuary", floor: '—' },
      { id: "point-5", name: "Point — Aerial", floor: '—' },
    ],
  },
  {
    id: "hanaoka",
    name: "Hanaoka",
    type: "Clash",
    rankedPool: true,
    sites: [
      { id: "point-1", name: "Point 1 (Defender Side)", floor: '—' },
      { id: "point-2", name: "Point 2", floor: '—' },
      { id: "point-3", name: "Point 3 (Mid)", floor: '—' },
      { id: "point-4", name: "Point 4", floor: '—' },
      { id: "point-5", name: "Point 5 (Attacker Side)", floor: '—' },
    ],
  },
  {
    id: "lijiang-tower",
    name: "Lijiang Tower",
    type: "Control",
    rankedPool: true,
    sites: [
      { id: 'night-market', name: "Night Market", floor: '—' },
      { id: 'garden', name: "Garden", floor: '—' },
      { id: 'control-center', name: "Control Center", floor: '—' },
    ],
  },
  {
    id: "oasis",
    name: "Oasis",
    type: "Control",
    rankedPool: true,
    sites: [
      { id: 'city-center', name: "City Center", floor: '—' },
      { id: 'gardens', name: "Gardens", floor: '—' },
      { id: 'university', name: "University", floor: '—' },
    ],
  },
  {
    id: "samoa",
    name: "Samoa",
    type: "Control",
    rankedPool: true,
    sites: [
      { id: 'downtown', name: "Downtown", floor: '—' },
      { id: 'beach', name: "Beach", floor: '—' },
      { id: 'volcano', name: "Volcano", floor: '—' },
    ],
  },
  {
    id: "hanamura",
    name: "Hanamura",
    type: "Hybrid",
    rankedPool: true,
    sites: [
      { id: 'point-a', name: "Point A", floor: '—' },
      { id: 'point-b', name: "Point B", floor: '—' },
    ],
  },
  {
    id: "hollywood",
    name: "Hollywood",
    type: "Hybrid",
    rankedPool: true,
    sites: [
      { id: 'point-a', name: "Point A", floor: '—' },
      { id: 'point-b', name: "Point B", floor: '—' },
      { id: 'point-c', name: "Point C", floor: '—' },
    ],
  },
  {
    id: "paraiso",
    name: "Paraíso",
    type: "Escort",
    rankedPool: true,
    sites: [
      { id: 'first-point', name: "First Point", floor: '—' },
      { id: 'second-point', name: "Second Point", floor: '—' },
      { id: 'final-point', name: "Final Point", floor: '—' },
    ],
  },
  {
    id: "rialto",
    name: "Rialto",
    type: "Escort",
    rankedPool: true,
    sites: [
      { id: 'first-point', name: "First Point", floor: '—' },
      { id: 'second-point', name: "Second Point", floor: '—' },
      { id: 'third-point', name: "Third Point", floor: '—' },
    ],
  },
  {
    id: "havana",
    name: "Havana",
    type: "Escort",
    rankedPool: true,
    sites: [
      { id: 'first-point', name: "First Point", floor: '—' },
      { id: 'second-point', name: "Second Point", floor: '—' },
      { id: 'third-point', name: "Third Point", floor: '—' },
    ],
  },
  {
    id: "new-junk-city",
    name: "New Junk City",
    type: "Flashpoint",
    rankedPool: true,
    sites: [
      { id: 'north', name: "North", floor: '—' },
      { id: 'east', name: "East", floor: '—' },
      { id: 'south', name: "South", floor: '—' },
      { id: 'west', name: "West", floor: '—' },
      { id: 'central', name: "Central", floor: '—' },
    ],
  },
  {
    id: "throne-of-anubis",
    name: "Throne of Anubis",
    type: "Flashpoint",
    rankedPool: true,
    sites: [
      { id: 'tomb', name: "Tomb", floor: '—' },
      { id: 'sphinx', name: "Sphinx", floor: '—' },
      { id: 'oasis', name: "Oasis", floor: '—' },
      { id: 'pyramid', name: "Pyramid", floor: '—' },
      { id: 'throne', name: "Throne", floor: '—' },
    ],
  },
  {
    id: "rio",
    name: "Rio",
    type: "Push",
    rankedPool: true,
    sites: [
      { id: 'point-1', name: "Point 1", floor: '—' },
      { id: 'point-2', name: "Point 2", floor: '—' },
      { id: 'point-3', name: "Point 3", floor: '—' },
      { id: 'point-4', name: "Point 4", floor: '—' },
      { id: 'point-5', name: "Point 5", floor: '—' },
    ],
  },

  // ── Stadium maps ──────────────────────────────────────────────────────
  // Stadium is OW2's BO5/BO7 round-based mode with a per-round Cash economy
  // and a build system (4 hero-specific Powers chosen across rounds + Common/
  // Rare/Epic Items in a shop). Stadium uses cut-down variants of the live
  // map pool — usually one Control point, one Push segment, or one Clash
  // bank. Strats here are mode-specific (build paths, round economy, power
  // selection) more than map geometry.
  {
    id: "stadium-hanaoka",
    name: "Stadium — Hanaoka (Clash)",
    type: "Stadium",
    rankedPool: true,
    sites: [
      { id: 'mid', name: "Mid Bank (control)", floor: '—' },
      { id: 'attacker-bank', name: "Attacker Bank", floor: '—' },
      { id: 'defender-bank', name: "Defender Bank", floor: '—' },
    ],
  },
  {
    id: "stadium-throne-of-anubis",
    name: "Stadium — Throne of Anubis (Clash)",
    type: "Stadium",
    rankedPool: true,
    sites: [
      { id: 'mid', name: "Mid Bank (control)", floor: '—' },
      { id: 'tomb', name: "Tomb side", floor: '—' },
      { id: 'pyramid', name: "Pyramid side", floor: '—' },
    ],
  },
  {
    id: "stadium-busan",
    name: "Stadium — Busan Downtown (Control)",
    type: "Stadium",
    rankedPool: true,
    sites: [
      { id: 'point', name: "Downtown Point", floor: '—' },
      { id: 'high-ground', name: "Rooftop high ground", floor: '—' },
      { id: 'spawn-flank', name: "Spawn-side flank", floor: '—' },
    ],
  },
  {
    id: "stadium-nepal",
    name: "Stadium — Nepal Sanctum (Control)",
    type: "Stadium",
    rankedPool: true,
    sites: [
      { id: 'point', name: "Sanctum Point", floor: '—' },
      { id: 'side-rooms', name: "Side rooms", floor: '—' },
      { id: 'high-ground', name: "Catwalk high ground", floor: '—' },
    ],
  },
  {
    id: "stadium-antarctic",
    name: "Stadium — Antarctic Peninsula (Control)",
    type: "Stadium",
    rankedPool: true,
    sites: [
      { id: 'point', name: "Icebreaker Point", floor: '—' },
      { id: 'high-ground', name: "Bridge high ground", floor: '—' },
      { id: 'underground', name: "Sub-Level corridor", floor: '—' },
    ],
  },
  {
    id: "stadium-ilios",
    name: "Stadium — Ilios Lighthouse (Control)",
    type: "Stadium",
    rankedPool: true,
    sites: [
      { id: 'point', name: "Lighthouse Point", floor: '—' },
      { id: 'high-ground', name: "Tower high ground", floor: '—' },
      { id: 'well', name: "Well-side corridor", floor: '—' },
    ],
  },
  {
    id: "stadium-oasis",
    name: "Stadium — Oasis City Center (Control)",
    type: "Stadium",
    rankedPool: true,
    sites: [
      { id: 'point', name: "City Center Point", floor: '—' },
      { id: 'high-ground', name: "Rooftop high ground", floor: '—' },
      { id: 'cars', name: "Car-side flank", floor: '—' },
    ],
  },
  {
    id: "stadium-samoa",
    name: "Stadium — Samoa Downtown (Control)",
    type: "Stadium",
    rankedPool: true,
    sites: [
      { id: 'point', name: "Downtown Point", floor: '—' },
      { id: 'temple', name: "Temple high ground", floor: '—' },
      { id: 'beach-flank', name: "Beach flank", floor: '—' },
    ],
  },
  {
    id: "stadium-colosseo",
    name: "Stadium — Colosseo (Push)",
    type: "Stadium",
    rankedPool: true,
    sites: [
      { id: 'mid', name: "Mid (Arch) — round start", floor: '—' },
      { id: 'attacker-checkpoint', name: "Push toward attacker side", floor: '—' },
      { id: 'defender-checkpoint', name: "Push toward defender side", floor: '—' },
    ],
  },
  {
    id: "stadium-esperanca",
    name: "Stadium — Esperança (Push)",
    type: "Stadium",
    rankedPool: true,
    sites: [
      { id: 'mid', name: "Mid (Plaza) — round start", floor: '—' },
      { id: 'attacker-checkpoint', name: "Push toward attacker side", floor: '—' },
      { id: 'defender-checkpoint', name: "Push toward defender side", floor: '—' },
    ],
  },
  {
    id: "stadium-runasapi",
    name: "Stadium — Runasapi (Push)",
    type: "Stadium",
    rankedPool: true,
    sites: [
      { id: 'mid', name: "Mid — round start", floor: '—' },
      { id: 'attacker-checkpoint', name: "Push toward attacker side", floor: '—' },
      { id: 'defender-checkpoint', name: "Push toward defender side", floor: '—' },
    ],
  },
]

export default MAPS
