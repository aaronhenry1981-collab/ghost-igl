import MAPS from './maps.js'
import CAST from './operators.js'
import STRATS from './strats.js'
import LOADOUTS from './loadouts.js'
import META from './meta.json' with { type: 'json' }

const gameMeta = {
  id: 'eafc',
  name: 'eafc',
  displayName: 'EA Sports FC',
  color: '#00b140',
  slug: 'eafc',
  earlyAccess: true,
  vocab: {
    map: 'Mode',
    site: 'Phase',
    operator: 'Formation Slot',
    side_attack: 'Possession',
    side_defense: 'Defending',
  },
}

export { MAPS, CAST, STRATS, LOADOUTS, META, gameMeta }
export default { MAPS, CAST, STRATS, LOADOUTS, META, gameMeta }
