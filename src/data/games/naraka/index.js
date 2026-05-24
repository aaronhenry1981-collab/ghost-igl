import MAPS from './maps.js'
import CAST from './operators.js'
import STRATS from './strats.js'
import LOADOUTS from './loadouts.js'
import META from './meta.json' with { type: 'json' }

const gameMeta = {
  id: 'naraka',
  name: 'naraka',
  displayName: 'Naraka: Bladepoint',
  color: '#f24c00',
  slug: 'naraka',
  earlyAccess: true,
  vocab: {
    map: 'Map',
    site: 'Region',
    operator: 'Hero',
    side_attack: 'Pushing',
    side_defense: 'Holding',
  },
}

export { MAPS, CAST, STRATS, LOADOUTS, META, gameMeta }
export default { MAPS, CAST, STRATS, LOADOUTS, META, gameMeta }
