// Rocket League — "arenas" mapped by game mode rather than visual variant.
// In RL, the actual ranked meta is driven by mode (3v3 vs 2v2 vs Hoops),
// not the arena's aesthetic theme (DFH vs Mannfield play almost identically
// in standard 3v3). Sites = game phases (kickoff, possession, transition,
// defense, etc.) — those vary by mode.

const MAPS = [
  {
    id: 'standard-3v3',
    name: 'Standard 3v3',
    type: 'Ranked Standard',
    rankedPool: true,
    sites: [
      { id: 'kickoff', name: 'Kickoff', floor: 'Start' },
      { id: 'possession', name: 'Possession', floor: 'Mid-play' },
      { id: 'transition', name: 'Transition', floor: 'After 50' },
      { id: 'defense', name: 'Defense', floor: 'Backboard / save' },
    ],
  },
  {
    id: 'standard-2v2',
    name: 'Standard 2v2 (Doubles)',
    type: 'Ranked Doubles',
    rankedPool: true,
    sites: [
      { id: 'kickoff', name: 'Kickoff', floor: 'Start' },
      { id: 'possession', name: 'Possession', floor: 'Mid-play' },
      { id: 'defense', name: 'Defense', floor: 'One-back rotation' },
    ],
  },
  {
    id: 'standard-1v1',
    name: 'Standard 1v1 (Duel)',
    type: 'Ranked Duel',
    rankedPool: true,
    sites: [
      { id: 'kickoff', name: 'Kickoff', floor: 'Start' },
      { id: 'recovery', name: 'Recovery / Boost', floor: 'Post-touch' },
      { id: 'defense', name: 'Defense', floor: 'Backboard read' },
    ],
  },
  {
    id: 'tournaments',
    name: 'Tournaments 3v3',
    type: 'Tournament Mode',
    rankedPool: true,
    sites: [
      { id: 'series-start', name: 'Series start', floor: 'Game 1 read' },
      { id: 'comp-adjust', name: 'Comp adjust', floor: 'Between games' },
      { id: 'closeout', name: 'Closeout', floor: 'Match-ending defense' },
    ],
  },
  {
    id: 'hoops',
    name: 'Hoops',
    type: 'Ranked Hoops (Basketball)',
    rankedPool: true,
    sites: [
      { id: 'dunk-setup', name: 'Dunk setup', floor: 'Wall pop / aerial' },
      { id: 'defense', name: 'Net defense', floor: 'Below-rim hold' },
    ],
  },
  {
    id: 'snow-day',
    name: 'Snow Day',
    type: 'Ranked Snow Day (Hockey)',
    rankedPool: true,
    sites: [
      { id: 'face-off', name: 'Face-off', floor: 'Center puck' },
      { id: 'possession', name: 'Possession', floor: 'Puck control' },
      { id: 'defense', name: 'Defense', floor: 'Net + crease' },
    ],
  },
  {
    id: 'dropshot',
    name: 'Dropshot',
    type: 'Ranked Dropshot (Tile floor)',
    rankedPool: true,
    sites: [
      { id: 'opening', name: 'Opening the floor', floor: 'Tile damage' },
      { id: 'breaking', name: 'Breaking tiles', floor: 'Power shot' },
      { id: 'defense', name: 'Defense', floor: 'Floor protect' },
    ],
  },
  {
    id: 'rumble',
    name: 'Rumble',
    type: 'Ranked Rumble (Power-ups)',
    rankedPool: true,
    sites: [
      { id: 'power-up-advantage', name: 'Power-up advantage', floor: 'Got the item' },
      { id: 'scramble', name: 'Scramble', floor: 'Item used / waiting' },
    ],
  },
]

export default MAPS
