import MAPS from './maps.js'
import CAST from './operators.js'
import STRATS from './strats.js'
import PICKS from './picks.js'
import LOADOUTS from './loadouts.js'
import META from './meta.json' with { type: 'json' }

const gameMeta = {
  "id": "apex",
  "name": "apex",
  "displayName": "Apex Legends",
  "color": "#DA292A",
  "slug": "apex",
  "vocab": {
    "map": "Map",
    "site": "POI",
    "operator": "Legend",
    "side_attack": "Engage",
    "side_defense": "Hold"
  }
}

export { MAPS, CAST, STRATS, PICKS, LOADOUTS, META, gameMeta }
export default { MAPS, CAST, STRATS, PICKS, LOADOUTS, META, gameMeta }
