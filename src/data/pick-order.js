// Operator pick order, from the player's OWN tracker record.
//
// This is deliberately map-independent. A site with no verified setup still has
// a correct answer to "who do I play", because that answer comes from his win
// rates, not from the map. Showing nothing on 23 of 25 maps made the library
// useless in the exact moment it was needed -- Aaron, mid-match on Bank:
// "I'm on attack in this site but get no operator pick or anything."
//
// Phase 3 replaces this with the signed-in user's own synced pool. Until then
// it is one player's, and the page says so rather than implying it is universal.

export const PICK_ORDER = {
  attack: [
    { op: 'Osa', win: '58%', why: 'Shields open angles without you entering first' },
    { op: 'Jackal', win: '56%', why: 'Track the roamer, deny the flank' },
    { op: 'Amaru', win: '54%', why: 'Take a window nobody is watching' },
    { op: 'Dokkaebi', win: '52%', why: 'Phone the cams back, hunt the roamer' },
    { op: 'Maverick', win: '52%', why: 'Your own hole in any reinforced wall' },
    { op: 'Iana', win: '51%', why: 'Scout with the replicator, never dry-peek' },
    { op: 'Striker', win: '50%', why: 'Flex frag once the site is already open' },
    { op: 'Twitch', win: '49%', why: 'Darts kill the claw before the breach' },
    { op: 'Thatcher', win: '47%', why: 'Only when they are running electric denial' },
  ],
  defense: [
    // A win rate belongs to a LOADOUT, not to an operator. Aaron, 2026-07-27:
    // "Vigil might have been a top pick for me but I wasn't using the BOSG then,
    // now you having me running it and im struggling." The 63% was earned on a
    // different gun, so quoting it as current is what keeps pushing him onto a
    // pick that is not working. Flagged rather than deleted — the operator is
    // still strong; the number just does not transfer.
    { op: 'Vigil', win: '63%', staleStat: 'earned before you switched to the BOSG',
      why: 'Invisible to attacker drones — but that 63% is on your old gun. If the BOSG is not landing, change the loadout before you drop the operator' },
    { op: 'Kapkan', win: '55%', why: 'Traps on the doors they actually use' },
    { op: 'Kaid', win: '53%', why: 'Electrify the hatch from underneath' },
    { op: 'Doc', win: '53%', why: 'Anchor, overheal after a trade' },
    { op: 'Castle', win: '53%', why: 'Barricade the lane you cannot watch' },
    { op: 'Frost', win: '53%', why: 'Mats where they vault, never open floor' },
    { op: 'Mute', win: '53%', why: 'Jam the breach wall and the drone choke' },
    { op: 'Goyo', win: '51%', why: 'Shields on the entry lane and plant deny' },
    { op: 'Melusi', win: '50%', why: 'Banshees slow the push into site' },
    { op: 'Valkyrie', win: '49%', why: 'Cams early, then anchor' },
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

// Operators he plays a lot and LOSES on. Naming them is the point: the two most
// -played attackers in his account are both 47% over 2,344 combined rounds.
export const AVOID = [
  { op: 'Ash', win: '47%', note: '1,284 rounds' },
  { op: 'Thermite', win: '47%', note: '1,060 rounds' },
  { op: 'Buck', win: '42%' },
  { op: 'Sledge', win: '44%' },
  { op: 'Gridlock', win: '42%' },
  { op: 'Fuze', win: '45%' },
]

export default PICK_ORDER
