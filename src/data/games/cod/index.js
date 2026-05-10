import MAPS from './maps.js'
import CAST from './operators.js'
import STRATS from './strats.js'
import PICKS from './picks.js'
import META from './meta.json' with { type: 'json' }

const gameMeta = {
  "id": "cod",
  "name": "cod",
  "displayName": "Call of Duty",
  "color": "#FF8C00",
  "slug": "cod",
  "vocab": {
    "map": "Map",
    "site": "POI / Zone",
    "operator": "Loadout",
    "side_attack": "Push",
    "side_defense": "Hold"
  }
}

export { MAPS, CAST, STRATS, PICKS, META, gameMeta }
export default { MAPS, CAST, STRATS, PICKS, META, gameMeta }
