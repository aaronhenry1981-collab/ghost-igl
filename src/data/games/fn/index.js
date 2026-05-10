import MAPS from './maps.js'
import CAST from './operators.js'
import STRATS from './strats.js'
import PICKS from './picks.js'
import META from './meta.json' with { type: 'json' }

const gameMeta = {
  "id": "fn",
  "name": "fn",
  "displayName": "Fortnite (Zero Build)",
  "color": "#9D4DBB",
  "slug": "fn",
  "vocab": {
    "map": "Map",
    "site": "POI",
    "operator": "Loadout",
    "side_attack": "Engage",
    "side_defense": "Hold"
  }
}

export { MAPS, CAST, STRATS, PICKS, META, gameMeta }
export default { MAPS, CAST, STRATS, PICKS, META, gameMeta }
