import MAPS from './maps.js'
import CAST from './operators.js'
import STRATS from './strats.js'
import PICKS from './picks.js'
import LOADOUTS from './loadouts.js'
import META from './meta.json' with { type: 'json' }

const gameMeta = {
  "id": "finals",
  "name": "finals",
  "displayName": "The Finals",
  "color": "#FFFF00",
  "slug": "finals",
  "vocab": {
    "map": "Arena",
    "site": "Vault / Cashout",
    "operator": "Build",
    "side_attack": "Steal",
    "side_defense": "Extract"
  }
}

export { MAPS, CAST, STRATS, PICKS, LOADOUTS, META, gameMeta }
export default { MAPS, CAST, STRATS, PICKS, LOADOUTS, META, gameMeta }
