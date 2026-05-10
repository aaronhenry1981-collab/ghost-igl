// Marvel Rivals — current map rotation May 2026 (~12 maps).
// Map types: Convoy (escort), Convergence (hybrid), Domination (control).
// VERIFY: rotation may change per season.

const MAPS = [
  {
    id: "shin-shibuya",
    name: "Tokyo 2099: Shin-Shibuya",
    type: "Convoy",
    rankedPool: true,
    sites: [
      { id: "p1", name: "Payload — First Stretch", floor: '—' },
      { id: "p2", name: "Payload — Second Stretch", floor: '—' },
      { id: "p3", name: "Payload — Final", floor: '—' },
    ],
  },
  {
    id: "ninomaru",
    name: "Tokyo 2099: Ninomaru",
    type: "Convergence",
    rankedPool: true,
    sites: [
      { id: "point-a", name: "Capture Point (Garden)", floor: '—' },
      { id: "p1", name: "Payload — First Stretch", floor: '—' },
      { id: "p2", name: "Payload — Final", floor: '—' },
    ],
  },
  {
    id: "spider-islands",
    name: "Tokyo 2099: Spider-Islands",
    type: "Domination",
    rankedPool: true,
    sites: [
      { id: "point", name: "Capture Point", floor: '—' },
    ],
  },
  {
    id: "yggdrasill-path",
    name: "Yggsgard: Yggdrasill Path",
    type: "Convoy",
    rankedPool: true,
    sites: [
      { id: "p1", name: "Payload — First Stretch", floor: '—' },
      { id: "p2", name: "Payload — Halls", floor: '—' },
      { id: "p3", name: "Payload — Final", floor: '—' },
    ],
  },
  {
    id: "royal-palace",
    name: "Yggsgard: Royal Palace",
    type: "Domination",
    rankedPool: true,
    sites: [
      { id: "point", name: "Capture Point", floor: '—' },
    ],
  },
  {
    id: "symbiotic-surface",
    name: "Klyntar: Symbiotic Surface",
    type: "Convergence",
    rankedPool: true,
    sites: [
      { id: "point-a", name: "Capture Point (Pool)", floor: '—' },
      { id: "p1", name: "Payload — First Stretch", floor: '—' },
      { id: "p2", name: "Payload — Final", floor: '—' },
    ],
  },
  {
    id: "celestial-apex",
    name: "Klyntar: Celestial's Apex",
    type: "Domination",
    rankedPool: true,
    sites: [
      { id: "point", name: "Capture Point", floor: '—' },
    ],
  },
  {
    id: "birnin-tchalla",
    name: "Wakanda: Birnin T'Challa",
    type: "Domination",
    rankedPool: true,
    sites: [
      { id: "point", name: "Capture Point", floor: '—' },
    ],
  },
  {
    id: "hall-of-djalia",
    name: "Wakanda: Hall of Djalia",
    type: "Convergence",
    rankedPool: true,
    sites: [
      { id: "point-a", name: "Capture Point (Hall)", floor: '—' },
      { id: "p1", name: "Payload — First Stretch", floor: '—' },
      { id: "p2", name: "Payload — Final", floor: '—' },
    ],
  },
  {
    id: "krakoa",
    name: "Hellfire Gala: Krakoa",
    type: "Domination",
    rankedPool: true,
    sites: [
      { id: "point", name: "Capture Point", floor: '—' },
    ],
  },
  {
    id: "hells-heaven",
    name: "Hydra Charteris Base: Hell's Heaven",
    type: "Convoy",
    rankedPool: true,
    sites: [
      { id: "p1", name: "Payload — First Stretch", floor: '—' },
      { id: "p2", name: "Payload — Bridge", floor: '—' },
      { id: "p3", name: "Payload — Final", floor: '—' },
    ],
  },
  {
    id: "midtown",
    name: "Empire of Eternal Night: Midtown",
    type: "Convergence",
    rankedPool: true,
    sites: [
      { id: "point-a", name: "Capture Point (Plaza)", floor: '—' },
      { id: "p1", name: "Payload — First Stretch", floor: '—' },
      { id: "p2", name: "Payload — Final", floor: '—' },
    ],
  },
]

export default MAPS
