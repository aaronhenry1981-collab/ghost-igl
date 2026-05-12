import MAPS from './maps.js'
import CAST from './operators.js'
import STRATS from './strats.js'
import LOADOUTS from './loadouts.js'
import META from './meta.json' with { type: 'json' }

const gameMeta = {
  id: 'lol',
  name: 'lol',
  displayName: 'League of Legends',
  color: '#c89b3c',
  slug: 'lol',
  earlyAccess: true,
  vocab: {
    map: 'Map',
    site: 'Lane',
    operator: 'Champion',
    side_attack: 'Blue Side',
    side_defense: 'Red Side',
  },
}

export { MAPS, CAST, STRATS, LOADOUTS, META, gameMeta }
export default { MAPS, CAST, STRATS, LOADOUTS, META, gameMeta }
