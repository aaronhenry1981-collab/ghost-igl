// League of Legends — Summoner's Rift is the only ranked map. ARAM and Arena
// are queue modes that share a "map" concept for vocab consistency. Sites are
// game-phase lanes/objectives, since the map is one fixed playing field.

const MAPS = [
  {
    id: "summoners-rift",
    name: "Summoner's Rift",
    type: "5v5 Ranked",
    rankedPool: true,
    sites: [
      { id: "top-lane", name: "Top Lane", floor: "—" },
      { id: "mid-lane", name: "Mid Lane", floor: "—" },
      { id: "bot-lane", name: "Bot Lane (ADC + Support)", floor: "—" },
      { id: "jungle", name: "Jungle", floor: "—" },
      { id: "dragon-soul", name: "Dragon / Soul Objective", floor: "—" },
      { id: "baron", name: "Baron Nashor Pit", floor: "—" },
      { id: "rift-herald", name: "Rift Herald", floor: "—" },
      { id: "early-game", name: "Early Game (0-15 min)", floor: "—" },
      { id: "mid-game", name: "Mid Game (15-25 min)", floor: "—" },
      { id: "late-game", name: "Late Game (25+ min)", floor: "—" },
    ],
  },
  {
    id: "aram",
    name: "ARAM (Howling Abyss)",
    type: "ARAM",
    rankedPool: false,
    sites: [
      { id: "single-lane", name: "Single Lane", floor: "—" },
      { id: "fountain", name: "Fountain Defense", floor: "—" },
      { id: "team-fight", name: "Team Fight Phase", floor: "—" },
    ],
  },
  {
    id: "arena",
    name: "Arena (Rings of Wrath)",
    type: "2v2v2v2",
    rankedPool: false,
    sites: [
      { id: "arena-round", name: "Round Phase", floor: "—" },
      { id: "cameos", name: "Cameo Phase", floor: "—" },
      { id: "augment-select", name: "Augment Selection", floor: "—" },
    ],
  },
]

export default MAPS
