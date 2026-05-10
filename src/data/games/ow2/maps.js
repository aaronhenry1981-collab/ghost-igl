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
]

export default MAPS
