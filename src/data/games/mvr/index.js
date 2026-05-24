import MAPS from './maps.js'
import CAST from './operators.js'
import STRATS from './strats.js'
import BANS from './bans.js'
import LOADOUTS from './loadouts.js'
import META from './meta.json' with { type: 'json' }

const gameMeta = {
  "id": "mvr",
  "name": "mvr",
  "displayName": "Marvel Rivals",
  "color": "#E10A19",
  "slug": "mvr",
  "vocab": {
    "map": "Map",
    "site": "Objective",
    "operator": "Hero",
    "side_attack": "Attack",
    "side_defense": "Defense"
  }
}

export { MAPS, CAST, STRATS, BANS, LOADOUTS, META, gameMeta }
export default { MAPS, CAST, STRATS, BANS, LOADOUTS, META, gameMeta }
