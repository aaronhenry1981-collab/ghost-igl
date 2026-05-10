// Counter-Strike 2 — Active Duty map pool (May 2026).
// `rankedPool: true` flags maps in the current Premier / Active Duty rotation.
// `sites` are the two bombsites; the floor field is unused on CS2 maps
// but kept for schema parity with the R6 maps.js shape.

const MAPS = [
  {
    id: "mirage",
    name: "Mirage",
    rankedPool: true,
    sites: [
      { id: "a-site", name: "A Site (Default / Triple)", floor: '—' },
      { id: "b-site", name: "B Site (Apartments)", floor: '—' },
    ],
  },
  {
    id: "inferno",
    name: "Inferno",
    rankedPool: true,
    sites: [
      { id: "a-site", name: "A Site (Pit / Default)", floor: '—' },
      { id: "b-site", name: "B Site (Banana)", floor: '—' },
    ],
  },
  {
    id: "anubis",
    name: "Anubis",
    rankedPool: true,
    sites: [
      { id: "a-site", name: "A Site (Heaven / Connector)", floor: '—' },
      { id: "b-site", name: "B Site (Bridge / Water)", floor: '—' },
    ],
  },
  {
    id: "nuke",
    name: "Nuke",
    rankedPool: true,
    sites: [
      { id: "a-site", name: "A Site (Upper / Heaven)", floor: '—' },
      { id: "b-site", name: "B Site (Lower / Vent)", floor: '—' },
    ],
  },
  {
    id: "ancient",
    name: "Ancient",
    rankedPool: true,
    sites: [
      { id: "a-site", name: "A Site (Heaven / Donut)", floor: '—' },
      { id: "b-site", name: "B Site (Pillar)", floor: '—' },
    ],
  },
  {
    id: "vertigo",
    name: "Vertigo",
    rankedPool: true,
    sites: [
      { id: "a-site", name: "A Site (Ramp / Heaven)", floor: '—' },
      { id: "b-site", name: "B Site (Generator / Catwalk)", floor: '—' },
    ],
  },
  {
    id: "dust2",
    name: "Dust 2",
    rankedPool: true,
    sites: [
      { id: "a-site", name: "A Site (Long / Short)", floor: '—' },
      { id: "b-site", name: "B Site (Tunnels / Door)", floor: '—' },
    ],
  },
  {
    id: "train",
    name: "Train",
    rankedPool: true,
    sites: [
      { id: "a-site", name: "A Site (Z / Halls)", floor: '—' },
      { id: "b-site", name: "B Site (Upper / Lower)", floor: '—' },
    ],
  },
]

export default MAPS
