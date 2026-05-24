import MAPS from './maps.js'
import CAST from './operators.js'
import STRATS from './strats.js'
import BANS from './bans.js'
import LOADOUTS from './loadouts.js'
import META from './meta.json' with { type: 'json' }

const gameMeta = {
  "id": "ow2",
  "name": "ow2",
  "displayName": "Overwatch 2",
  "color": "#F99E1A",
  "slug": "ow2",
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
