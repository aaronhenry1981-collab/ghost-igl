// R6 gameMeta — kept in its own file so the top-level games/index.js can
// import it eagerly without pulling in the full R6 data graph (maps.js,
// strats.js, operators.js). Without this split, Node ESM tries to resolve
// R6's extensionless imports (legacy code) at module-load time.
//
// The actual data is exported from games/r6/index.js, loaded lazily.

export const META = {
  _comment: 'R6 meta tier list. Verified 2026-05.',
  S: ['Thatcher', 'Mira', 'Thermite', 'Maestro'],
  A: ['Hibana', 'Ace', 'Twitch', 'Sledge', 'Buck', 'Kaid', 'Smoke', 'Bandit', 'Jager', 'Valkyrie', 'Echo'],
  B: ['Ash', 'Iana', 'Zofia', 'Nomad', 'Capitao', 'Maverick', 'Lion', 'Mute', 'Lesion', 'Ela', 'Alibi', 'Vigil'],
  C: ['Doc', 'Rook', 'Castle', 'Pulse', 'Caveira', 'Glaz', 'Fuze', 'Blackbeard', 'Frost', 'Tachanka'],
  bans_attack: ['Thatcher', 'Maverick', 'Iana'],
  bans_defense: ['Mira', 'Valkyrie', 'Maestro'],
}

export const gameMeta = {
  id: 'r6',
  name: 'r6',
  displayName: 'Rainbow Six Siege',
  color: '#FFB733',
  slug: 'r6',
  vocab: {
    map: 'Map',
    site: 'Bombsite',
    operator: 'Operator',
    side_attack: 'Attack',
    side_defense: 'Defense',
  },
}

export default { META, gameMeta }
