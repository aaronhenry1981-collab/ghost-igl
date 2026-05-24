// Multi-game registry for Recon 6 — aggregates all 20 supported titles.
//
// Each entry in GAMES has:
//   { id, gameMeta, load: () => Promise<{MAPS, CAST, STRATS, ...}> }
//
// The `load` field is a lazy import so we don't pull every game's strats data
// into the bundle on the landing page. Consumers call `game.load()` when they
// route into a specific game's strats/maps view.
//
// gameMeta is imported eagerly so the GAMES list is enough to render the
// game-picker UI without triggering any per-game data load.
//
// Games are split into two tiers:
//   - Core 11 (R6 → RL): deep content, full strats, loadouts, match prep
//   - Early Access 9 (LoL → NBA 2K): skeleton catalogs + game-aware UI;
//     strats/loadouts depth growing per content pipeline.
// The earlyAccess flag on gameMeta lets consumers (GameSwitcher, dashboard)
// surface the right state — "live" vs "early access" — without lying about
// coverage.

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
import { gameMeta as rlMeta } from './rl/index.js'
import { gameMeta as lolMeta } from './lol/index.js'
import { gameMeta as dota2Meta } from './dota2/index.js'
import { gameMeta as eafcMeta } from './eafc/index.js'
import { gameMeta as tk8Meta } from './tk8/index.js'
import { gameMeta as sf6Meta } from './sf6/index.js'
import { gameMeta as pubgMeta } from './pubg/index.js'
import { gameMeta as deadlockMeta } from './deadlock/index.js'
import { gameMeta as narakaMeta } from './naraka/index.js'
import { gameMeta as nba2kMeta } from './nba2k/index.js'

export const GAMES = [
  // ── Core 11 (full content) ────────────────────────────────────────────
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
  { id: 'rl', gameMeta: rlMeta, load: () => import('./rl/index.js') },
  // ── Early Access 9 (catalog + game-aware UI, strats depth growing) ────
  { id: 'lol', gameMeta: lolMeta, load: () => import('./lol/index.js') },
  { id: 'dota2', gameMeta: dota2Meta, load: () => import('./dota2/index.js') },
  { id: 'eafc', gameMeta: eafcMeta, load: () => import('./eafc/index.js') },
  { id: 'tk8', gameMeta: tk8Meta, load: () => import('./tk8/index.js') },
  { id: 'sf6', gameMeta: sf6Meta, load: () => import('./sf6/index.js') },
  { id: 'pubg', gameMeta: pubgMeta, load: () => import('./pubg/index.js') },
  { id: 'deadlock', gameMeta: deadlockMeta, load: () => import('./deadlock/index.js') },
  { id: 'naraka', gameMeta: narakaMeta, load: () => import('./naraka/index.js') },
  { id: 'nba2k', gameMeta: nba2kMeta, load: () => import('./nba2k/index.js') },
]

export function findGame(id) {
  return GAMES.find((g) => g.id === id) || null
}

export default { GAMES, findGame }
