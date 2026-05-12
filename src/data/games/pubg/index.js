import MAPS from './maps.js'
import CAST from './operators.js'
import STRATS from './strats.js'
import LOADOUTS from './loadouts.js'
import META from './meta.json' with { type: 'json' }

const gameMeta = {
  id: 'pubg',
  name: 'pubg',
  displayName: 'PUBG: Battlegrounds',
  color: '#f5a623',
  slug: 'pubg',
  earlyAccess: true,
  vocab: {
    map: 'Map',
    site: 'Zone',
    operator: 'Squad Role',
    side_attack: 'Pushing',
    side_defense: 'Holding',
  },
}

export { MAPS, CAST, STRATS, LOADOUTS, META, gameMeta }
export default { MAPS, CAST, STRATS, LOADOUTS, META, gameMeta }
