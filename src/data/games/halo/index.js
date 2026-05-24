import MAPS from './maps.js'
import CAST from './operators.js'
import STRATS from './strats.js'
import PICKS from './picks.js'
import LOADOUTS from './loadouts.js'
import META from './meta.json' with { type: 'json' }

const gameMeta = {
  "id": "halo",
  "name": "halo",
  "displayName": "Halo Infinite",
  "color": "#0099FF",
  "slug": "halo",
  "vocab": {
    "map": "Map",
    "site": "Zone",
    "operator": "Role",
    "side_attack": "Aggress",
    "side_defense": "Anchor"
  }
}

export { MAPS, CAST, STRATS, PICKS, LOADOUTS, META, gameMeta }
export default { MAPS, CAST, STRATS, PICKS, LOADOUTS, META, gameMeta }
