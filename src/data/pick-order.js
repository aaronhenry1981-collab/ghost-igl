// Operator pick order, from Aaron's OWN record.
//
// This is deliberately map-independent. A site with no verified setup still has
// a correct answer to "who do I play", because that answer comes from his win
// rates, not from the map. Showing nothing on 23 of 25 maps made the library
// useless in the exact moment it was needed -- Aaron, mid-match on Bank:
// "I'm on attack in this site but get no operator pick or anything."
//
// REBUILT 2026-07-28 against his real Tracker.gg profile (Splinter2581, PSN),
// Y11S2 "System Override". The old numbers were badly wrong at the top, which
// matters more than being wrong anywhere else — the ladder is read top-down:
//
//   Melusi   was 9th at "50%"   -> actually 55.3% over 257 rounds. HIS BEST.
//   Vigil    was 1st at "63%"   -> does not appear in this season at all.
//   Kapkan   was "55%"          -> 51.2%, but the best K/D on the account (1.55)
//   Dokkaebi was "52%"          -> 54.0% over 211 rounds
//   Ash      was on the AVOID list at "47%" -> 50.3% over 189 rounds
//
// Aaron had already caught the Vigil entry from the other end: "Vigil might have
// been a top pick for me but I wasn't using the BOSG then, now you having me
// running it and im struggling." He was right, and it was worse than a loadout
// change — the number was not from this season at all.
//
// `season` marks an entry measured this season. Everything else is a legacy
// figure of unknown origin, kept because the operator is still reasonable but
// never presented as if it were measured. Do not add a number without a source.

export const PICK_ORDER = {
  attack: [
    { op: 'Dokkaebi', win: '54%', season: { rounds: 211, kd: 1.24 },
      why: 'Your best attacker this season. Phone the cams back, hunt the roamer' },
    { op: 'Ash', win: '50%', season: { rounds: 189, kd: 1.14 },
      why: 'Measured at 50.3% this season — she was wrongly on your avoid list' },
    { op: 'Osa', win: '58%', why: 'Shields open angles without you entering first' },
    { op: 'Jackal', win: '56%', why: 'Track the roamer, deny the flank' },
    { op: 'Amaru', win: '54%', why: 'Take a window nobody is watching' },
    { op: 'Maverick', win: '52%', why: 'Your own hole in any reinforced wall' },
    { op: 'Iana', win: '51%', why: 'Scout with the replicator, never dry-peek' },
    { op: 'Striker', win: '50%', why: 'Flex frag once the site is already open' },
    { op: 'Twitch', win: '49%', why: 'Darts kill the claw before the breach' },
    { op: 'Thatcher', win: '47%', why: 'Only when they are running electric denial' },
  ],
  defense: [
    { op: 'Melusi', win: '55%', season: { rounds: 257, kd: 1.26 },
      why: 'Your single best operator this season — banshees slow every push into site' },
    { op: 'Kapkan', win: '51%', season: { rounds: 162, kd: 1.55 },
      why: 'Your highest K/D on the account by a distance. Traps on the doors they actually use' },
    { op: 'Kaid', win: '53%', why: 'Electrify the hatch from underneath' },
    { op: 'Doc', win: '53%', why: 'Anchor, overheal after a trade' },
    { op: 'Castle', win: '53%', why: 'Barricade the lane you cannot watch' },
    { op: 'Frost', win: '53%', why: 'Mats where they vault, never open floor' },
    { op: 'Mute', win: '53%', why: 'Jam the breach wall and the drone choke' },
    { op: 'Goyo', win: '51%', why: 'Shields on the entry lane and plant deny' },
    { op: 'Valkyrie', win: '48%', season: { rounds: 270, kd: 1.00 },
      why: 'Your most-played defender and one of your weakest — 47.8% over 270 rounds. Cams early, then anchor' },
    { op: 'Vigil', win: null, staleStat: 'no rounds recorded this season',
      why: 'Invisible to attacker drones, but you have not played him this season. The old 63% was a different season and a different gun — treat this as unproven, not as your best pick' },
  ],
}

// Jackson's pool, in his own order. Known because he is the regular duo — the
// only teammate we have real data on. Assigning him an operator he does not own
// is the same failure as recommending Aaron one he loses on.
export const DUO_POOL = {
  attack: ['Ace', 'Hibana', 'Osa', 'Buck', 'Sledge', 'Jackal', 'Ash'],
  defense: ['Mute', 'Melusi', 'Azami', 'Thorn', 'Aruni', 'Echo', 'Frost', 'Kapkan', 'Wamai', 'Bandit'],
}

// Which named teammates we actually hold a pool for. Anyone else gets the
// generic next-best, clearly labelled as such rather than pretending we know
// what they play.
export const KNOWN_MATES = {
  jocephus88: { label: 'JoCephus88', pool: DUO_POOL },
  jocephis88: { label: 'JoCephis88', pool: DUO_POOL },
}

export function poolFor(name) {
  if (!name) return null
  const k = String(name).toLowerCase().replace(/[^a-z0-9]/g, '')
  return KNOWN_MATES[k] ? KNOWN_MATES[k].pool : null
}

// Operators he plays a lot and LOSES on.
//
// Ash was removed 2026-07-28: this list had her at 47% and the season record
// says 50.3% over 189 rounds with a 1.14 K/D. Telling him to avoid an operator
// he is actually fine on costs him a pick every round it fires.
export const AVOID = [
  { op: 'Thermite', win: '46%', note: '236 rounds this season' },
  { op: 'Buck', win: '42%' },
  { op: 'Sledge', win: '44%' },
  { op: 'Gridlock', win: '42%' },
  { op: 'Fuze', win: '45%' },
]

// Where he actually wins, this season. Real match counts, not round counts.
// Useful at map-ban: ban toward the maps he is good on, away from the ones he
// is not, rather than reciting a meta list.
export const MAP_RECORD = {
  consulate: { wr: 65.6, matches: 32, kd: 1.15 },
  'emerald-plains': { wr: 56.5, kd: 1.37 },
  'calypso-casino': { wr: 53.8, matches: 91, kd: 1.22 },
  clubhouse: { wr: 50.0, kd: 1.24 },
}

// Season context, so nothing has to guess at his rank again — the coach had
// been asserting "Gold I" in its own prose.
export const SEASON = {
  season: 'Y11S2 System Override',
  rank: 'Gold IV',
  rp: 2639,
  ranked: { matches: 497, wins: 241, losses: 255, winRate: 48.5 },
  kd: 1.04,
  headshot: 51.8,
  clutchWinRate: 24.6,
  careerBestRp: 3824,
  source: 'Tracker.gg — Splinter2581 (PSN), pulled 2026-07-28',
}

export default PICK_ORDER
