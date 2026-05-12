// Tekken 8 — stages with neutral / wall / corner as sites.
// In Tekken, the stage is functionally identical except for: walls, balconies,
// floor breaks, ceiling breaks. Sites = phases of gameplay (neutral, wall, corner).

const MAPS = [
  {
    id: "arena",
    name: "Arena (Default Stage)",
    type: "Open Stage",
    rankedPool: true,
    sites: [
      { id: "neutral", name: "Neutral Game (Mid Distance)", floor: "—" },
      { id: "wall", name: "Wall Pressure", floor: "—" },
      { id: "corner", name: "Corner Carry", floor: "—" },
      { id: "round-start", name: "Round Start (Whiff Punish Range)", floor: "—" },
    ],
  },
  {
    id: "infinite-azure",
    name: "Infinite Azure",
    type: "Walled Stage with Balcony Break",
    rankedPool: true,
    sites: [
      { id: "neutral", name: "Neutral Game", floor: "—" },
      { id: "wall", name: "Wall Combo Setup", floor: "—" },
      { id: "balcony-break", name: "Balcony Break", floor: "—" },
    ],
  },
  {
    id: "urban-square",
    name: "Urban Square",
    type: "Walled Stage",
    rankedPool: true,
    sites: [
      { id: "neutral", name: "Neutral Game", floor: "—" },
      { id: "wall", name: "Wall Carry", floor: "—" },
    ],
  },
  {
    id: "yakushima",
    name: "Yakushima",
    type: "Floor Break Stage",
    rankedPool: true,
    sites: [
      { id: "neutral", name: "Neutral Game", floor: "—" },
      { id: "wall", name: "Wall Combo", floor: "—" },
      { id: "floor-break", name: "Floor Break", floor: "—" },
    ],
  },
  {
    id: "into-the-stratosphere",
    name: "Into the Stratosphere",
    type: "Open Stage (No Walls)",
    rankedPool: true,
    sites: [
      { id: "neutral", name: "Neutral Game", floor: "—" },
      { id: "midfield-carry", name: "Midfield Carry (No Wall)", floor: "—" },
    ],
  },
  {
    id: "ortiz-farm",
    name: "Ortiz Farm",
    type: "Walled Stage with Floor Break",
    rankedPool: true,
    sites: [
      { id: "neutral", name: "Neutral Game", floor: "—" },
      { id: "wall", name: "Wall Pressure", floor: "—" },
      { id: "floor-break", name: "Floor Break", floor: "—" },
    ],
  },
]

export default MAPS
