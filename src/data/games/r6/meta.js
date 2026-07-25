// R6 gameMeta — kept in its own file so the top-level games/index.js can
// import it eagerly without pulling in the full R6 data graph (maps.js,
// strats.js, operators.js). Without this split, Node ESM tries to resolve
// R6's extensionless imports (legacy code) at module-load time.
//
// The actual data is exported from games/r6/index.js, loaded lazily.

export const META = {
  _comment: 'R6 meta tier list. Verified 2026-07-25, post-Y11S2.2 mid-season patch (Jul 14): Wamai reworked (7 Mag-NETs, 20s regen, C4+shield), Jager now 3-speed with smoothed 416-C, Zofia +1 concussion/+1 impact, Melusi 4.3m Banshees, Lesion 25s Gu refill. Dokkaebi nerfed (14s per-target cooldown) but still a top ban. Ban rates from Ubisoft Plat+ charts.',
  S: ['Mira', 'Ace', 'Dokkaebi', 'Melusi', 'Jager', 'Nomad'],
  A: ['Wamai', 'Thermite', 'Hibana', 'Twitch', 'Sledge', 'Buck', 'Kaid', 'Smoke', 'Bandit', 'Valkyrie', 'Echo', 'Zofia', 'Lesion', 'Maestro', 'Thatcher', 'Ram'],
  B: ['Iana', 'Capitao', 'Maverick', 'Lion', 'Mute', 'Ela', 'Alibi', 'Vigil', 'Gridlock', 'Pulse'],
  C: ['Ash', 'Doc', 'Rook', 'Castle', 'Caveira', 'Glaz', 'Fuze', 'Blackbeard', 'Frost', 'Tachanka', 'Thorn'],
  bans_attack: ['Ace', 'Dokkaebi', 'Ram'],
  bans_defense: ['Mira', 'Kaid', 'Wamai'],
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
