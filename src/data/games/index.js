// Recon 6 is a Rainbow Six Siege product. Keeping a single entry here avoids
// shipping dormant multi-game data to visitors or offering an inactive switch.

import { gameMeta as r6Meta } from './r6/meta.js'

export const GAMES = [
  { id: 'r6', gameMeta: r6Meta, load: () => import('./r6/index.js') },
]

export function findGame(id) {
  return GAMES.find((g) => g.id === id) || null
}

export default { GAMES, findGame }
