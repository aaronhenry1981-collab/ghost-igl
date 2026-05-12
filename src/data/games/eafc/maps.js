// EA Sports FC — game modes as "maps", in-game phases as "sites".
// FUT (Ultimate Team) is the ranked mode; Pro Clubs is co-op; Career is single-player.

const MAPS = [
  {
    id: "ultimate-team",
    name: "Ultimate Team (FUT)",
    type: "Online Competitive",
    rankedPool: true,
    sites: [
      { id: "rivals", name: "Division Rivals (Weekly Rank)", floor: "—" },
      { id: "champions", name: "FUT Champions (Weekly Tournament)", floor: "—" },
      { id: "squad-battles", name: "Squad Battles (vs AI)", floor: "—" },
      { id: "draft", name: "Draft Mode", floor: "—" },
      { id: "kickoff-attack", name: "Kickoff & Build-up Phase", floor: "—" },
      { id: "final-third", name: "Final Third (Attacking)", floor: "—" },
      { id: "set-pieces", name: "Set Pieces (Corners / Free Kicks)", floor: "—" },
      { id: "defending", name: "Defensive Phase", floor: "—" },
    ],
  },
  {
    id: "pro-clubs",
    name: "Pro Clubs",
    type: "Online Coop",
    rankedPool: true,
    sites: [
      { id: "club-match", name: "Drop-in Club Match", floor: "—" },
      { id: "league", name: "Club League", floor: "—" },
      { id: "playoffs", name: "Club Playoffs", floor: "—" },
    ],
  },
  {
    id: "career",
    name: "Career Mode",
    type: "Single-Player",
    rankedPool: false,
    sites: [
      { id: "player-career", name: "Player Career", floor: "—" },
      { id: "manager-career", name: "Manager Career", floor: "—" },
      { id: "youth-academy", name: "Youth Academy", floor: "—" },
    ],
  },
  {
    id: "volta",
    name: "Volta Football",
    type: "Street",
    rankedPool: false,
    sites: [
      { id: "arcade", name: "Volta Arcade", floor: "—" },
      { id: "tour", name: "Volta Tour", floor: "—" },
    ],
  },
]

export default MAPS
