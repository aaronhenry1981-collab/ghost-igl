import MAPS from './maps.js'
import CAST from './operators.js'
import STRATS from './strats.js'
import LOADOUTS from './loadouts.js'
import META from './meta.json' with { type: 'json' }

const gameMeta = {
  id: 'nba2k',
  name: 'nba2k',
  displayName: 'NBA 2K',
  color: '#c8102e',
  slug: 'nba2k',
  earlyAccess: true,
  vocab: {
    map: 'Mode',
    site: 'Possession',
    operator: 'Build',
    side_attack: 'Offense',
    side_defense: 'Defense',
  },
}

export { MAPS, CAST, STRATS, LOADOUTS, META, gameMeta }
export default { MAPS, CAST, STRATS, LOADOUTS, META, gameMeta }
