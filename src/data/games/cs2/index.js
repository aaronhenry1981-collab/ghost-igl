import MAPS from './maps.js'
import CAST from './operators.js'
import STRATS from './strats.js'
import PICKS from './picks.js'
import META from './meta.json' with { type: 'json' }

const gameMeta = {
  "id": "cs2",
  "name": "cs2",
  "displayName": "Counter-Strike 2",
  "color": "#F2A526",
  "slug": "cs2",
  "vocab": {
    "map": "Map",
    "site": "Bombsite",
    "operator": "Role",
    "side_attack": "T",
    "side_defense": "CT"
  }
}

export { MAPS, CAST, STRATS, PICKS, META, gameMeta }
export default { MAPS, CAST, STRATS, PICKS, META, gameMeta }
