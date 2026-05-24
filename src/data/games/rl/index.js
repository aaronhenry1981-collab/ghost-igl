import MAPS from './maps.js'
import CAST from './operators.js'
import STRATS from './strats.js'
import LOADOUTS from './loadouts.js'
import META from './meta.json' with { type: 'json' }

const gameMeta = {
  id: 'rl',
  name: 'rl',
  displayName: 'Rocket League',
  color: '#f7941d',
  slug: 'rl',
  vocab: {
    map: 'Mode',
    site: 'Phase',
    operator: 'Role',
    side_attack: 'Offense',
    side_defense: 'Defense',
  },
}

export { MAPS, CAST, STRATS, LOADOUTS, META, gameMeta }
export default { MAPS, CAST, STRATS, LOADOUTS, META, gameMeta }
