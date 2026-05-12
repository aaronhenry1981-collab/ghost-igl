import MAPS from './maps.js'
import CAST from './operators.js'
import STRATS from './strats.js'
import LOADOUTS from './loadouts.js'
import META from './meta.json' with { type: 'json' }

const gameMeta = {
  id: 'dota2',
  name: 'dota2',
  displayName: 'Dota 2',
  color: '#a01818',
  slug: 'dota2',
  earlyAccess: true,
  vocab: {
    map: 'Match Phase',
    site: 'Lane',
    operator: 'Hero',
    side_attack: 'Radiant',
    side_defense: 'Dire',
  },
}

export { MAPS, CAST, STRATS, LOADOUTS, META, gameMeta }
export default { MAPS, CAST, STRATS, LOADOUTS, META, gameMeta }
