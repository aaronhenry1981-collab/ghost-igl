import MAPS from './maps.js'
import CAST from './operators.js'
import STRATS from './strats.js'
import BANS from './bans.js'
import META from './meta.json' with { type: 'json' }

const gameMeta = {
  "id": "valorant",
  "name": "valorant",
  "displayName": "Valorant",
  "color": "#FF4655",
  "slug": "valorant",
  "vocab": {
    "map": "Map",
    "site": "Site",
    "operator": "Agent",
    "side_attack": "Attack",
    "side_defense": "Defense"
  }
}

export { MAPS, CAST, STRATS, BANS, META, gameMeta }
export default { MAPS, CAST, STRATS, BANS, META, gameMeta }
