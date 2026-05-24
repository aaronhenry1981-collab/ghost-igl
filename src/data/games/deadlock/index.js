import MAPS from './maps.js'
import CAST from './operators.js'
import STRATS from './strats.js'
import LOADOUTS from './loadouts.js'
import META from './meta.json' with { type: 'json' }

const gameMeta = {
  id: 'deadlock',
  name: 'deadlock',
  displayName: 'Deadlock',
  color: '#7b2cbf',
  slug: 'deadlock',
  earlyAccess: true,
  vocab: {
    map: 'Map',
    site: 'Lane',
    operator: 'Hero',
    side_attack: 'Sapphire',
    side_defense: 'Amber',
  },
}

export { MAPS, CAST, STRATS, LOADOUTS, META, gameMeta }
export default { MAPS, CAST, STRATS, LOADOUTS, META, gameMeta }
