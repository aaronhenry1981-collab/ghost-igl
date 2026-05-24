import MAPS from './maps.js'
import CAST from './operators.js'
import STRATS from './strats.js'
import LOADOUTS from './loadouts.js'
import META from './meta.json' with { type: 'json' }

const gameMeta = {
  id: 'sf6',
  name: 'sf6',
  displayName: 'Street Fighter 6',
  color: '#ed1c24',
  slug: 'sf6',
  earlyAccess: true,
  vocab: {
    map: 'Stage',
    site: 'Round Phase',
    operator: 'Character',
    side_attack: 'P1',
    side_defense: 'P2',
  },
}

export { MAPS, CAST, STRATS, LOADOUTS, META, gameMeta }
export default { MAPS, CAST, STRATS, LOADOUTS, META, gameMeta }
