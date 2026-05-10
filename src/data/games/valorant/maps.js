// Valorant — current map pool May 2026.
// Haven and Lotus have three bomb sites; everything else has A/B.
// Floor field unused (not vertical maps in the R6 sense) — kept for schema parity.

const MAPS = [
  {
    id: "bind",
    name: "Bind",
    rankedPool: true,
    sites: [
      { id: "a-site", name: "A Site (Bath / Truck)", floor: '—' },
      { id: "b-site", name: "B Site (Hookah / Long)", floor: '—' },
    ],
  },
  {
    id: "haven",
    name: "Haven",
    rankedPool: true,
    sites: [
      { id: "a-site", name: "A Site (Heaven / Default)", floor: '—' },
      { id: "b-site", name: "B Site (Mid)", floor: '—' },
      { id: "c-site", name: "C Site (Long / Lobby)", floor: '—' },
    ],
  },
  {
    id: "split",
    name: "Split",
    rankedPool: true,
    sites: [
      { id: "a-site", name: "A Site (Heaven / Tower)", floor: '—' },
      { id: "b-site", name: "B Site (Tower / Back)", floor: '—' },
    ],
  },
  {
    id: "ascent",
    name: "Ascent",
    rankedPool: true,
    sites: [
      { id: "a-site", name: "A Site (Generator / Tree)", floor: '—' },
      { id: "b-site", name: "B Site (Stairs / Logs)", floor: '—' },
    ],
  },
  {
    id: "icebox",
    name: "Icebox",
    rankedPool: true,
    sites: [
      { id: "a-site", name: "A Site (Belt / Pipes)", floor: '—' },
      { id: "b-site", name: "B Site (Yellow / Green)", floor: '—' },
    ],
  },
  {
    id: "breeze",
    name: "Breeze",
    rankedPool: true,
    sites: [
      { id: "a-site", name: "A Site (Default / Cave)", floor: '—' },
      { id: "b-site", name: "B Site (Tunnel / Hall)", floor: '—' },
    ],
  },
  {
    id: "lotus",
    name: "Lotus",
    rankedPool: true,
    sites: [
      { id: "a-site", name: "A Site (Hut / Drop)", floor: '—' },
      { id: "b-site", name: "B Site (Main / Hut)", floor: '—' },
      { id: "c-site", name: "C Site (Waterfall / Hall)", floor: '—' },
    ],
  },
  {
    id: "sunset",
    name: "Sunset",
    rankedPool: true,
    sites: [
      { id: "a-site", name: "A Site (Default / Elbow)", floor: '—' },
      { id: "b-site", name: "B Site (Mall / Market)", floor: '—' },
    ],
  },
  {
    id: "abyss",
    name: "Abyss",
    rankedPool: true,
    sites: [
      { id: "a-site", name: "A Site (Heaven / Default)", floor: '—' },
      { id: "b-site", name: "B Site (Plat / Default)", floor: '—' },
    ],
  },
  {
    id: "corrode",
    name: "Corrode",
    rankedPool: true,
    sites: [
      { id: "a-site", name: "A Site (Heaven / Default)", floor: '—' },
      { id: "b-site", name: "B Site (Main / Default)", floor: '—' },
    ],
  },
]

export default MAPS
