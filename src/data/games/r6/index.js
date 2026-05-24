// Rainbow Six Siege — game-data wrapper for the multi-game registry.
//
// R6 is the original game and lives at src/data/{maps,strats,bans,operators}.js
// at the top-level. This file re-exports those modules under the same shape
// the new games/<id>/index.js files use.
//
// gameMeta + META are split into ./meta.js so the top-level games/index.js
// can import them eagerly without pulling the R6 data graph. The data here
// (MAPS/STRATS/BANS/CAST) is heavyweight and intended for lazy load only.
//
// Existing site code that imports from '../../maps' / '../../strats' / etc.
// continues to work unchanged — this wrapper is purely additive.

import MAPS from '../../maps.js'
import STRATS from '../../strats.js'
import BANS from '../../bans.js'
import OPERATORS from '../../operators.js'
import LOADOUTS from './loadouts.js'
import { META, gameMeta } from './meta.js'

// R6's operators.js is auto-derived from STRATS (an aggregate index, not a
// hand-written cast). We expose it under both names so consumers expecting
// the new shape (CAST) and the old shape (OPERATORS) both work.
const CAST = OPERATORS

export { MAPS, CAST, OPERATORS, STRATS, BANS, LOADOUTS, META, gameMeta }
export default { MAPS, CAST, OPERATORS, STRATS, BANS, LOADOUTS, META, gameMeta }
