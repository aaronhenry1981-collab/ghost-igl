// Multi-game registry for Recon+ — aggregates all 10 supported titles.
//
// Each entry in GAMES has:
//   { id, gameMeta, load: () => Promise<{MAPS, CAST, STRATS, ...}> }
//
// The `load` field is a lazy import so we don't pull every game's strats data
// into the bundle on the landing page. Consumers call `game.load()` when they
// route into a specific game's strats/maps view.
//
// gameMeta is also imported eagerly so the GAMES list is enough to render the
// game-picker UI without triggering any per-game data load.

// R6 gameMeta is imported from a meta-only file so we don't pull the full R6
// data graph (which uses extensionless imports that Node ESM can't resolve at
// load time). The full r6/index.js still loads via the lazy `load()` below.
import { gameMeta as r6Meta } from './r6/meta.js'
import { gameMeta as cs2Meta } from './cs2/index.js'
import { gameMeta as valorantMeta } from './valorant/index.js'
import { gameMeta as ow2Meta } from './ow2/index.js'
import { gameMeta as apexMeta } from './apex/index.js'
import { gameMeta as mvrMeta } from './mvr/index.js'
import { gameMeta as haloMeta } from './halo/index.js'
import { gameMeta as finalsMeta } from './finals/index.js'
import { gameMeta as codMeta } from './cod/index.js'
import { gameMeta as fnMeta } from './fn/index.js'

export const GAMES = [
  { id: 'r6', gameMeta: r6Meta, load: () => import('./r6/index.js') },
  { id: 'cs2', gameMeta: cs2Meta, load: () => import('./cs2/index.js') },
  { id: 'valorant', gameMeta: valorantMeta, load: () => import('./valorant/index.js') },
  { id: 'ow2', gameMeta: ow2Meta, load: () => import('./ow2/index.js') },
  { id: 'apex', gameMeta: apexMeta, load: () => import('./apex/index.js') },
  { id: 'mvr', gameMeta: mvrMeta, load: () => import('./mvr/index.js') },
  { id: 'halo', gameMeta: haloMeta, load: () => import('./halo/index.js') },
  { id: 'finals', gameMeta: finalsMeta, load: () => import('./finals/index.js') },
  { id: 'cod', gameMeta: codMeta, load: () => import('./cod/index.js') },
  { id: 'fn', gameMeta: fnMeta, load: () => import('./fn/index.js') },
]

export function findGame(id) {
  return GAMES.find((g) => g.id === id) || null
}

export default { GAMES, findGame }
