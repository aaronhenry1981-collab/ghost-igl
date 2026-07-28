// Operator pick order, from Aaron's OWN Y11S2 record.
//
// Map-independent on purpose. A site with no verified setup still has a correct
// answer to "who do I play", because that answer comes from his record, not the
// map. Showing nothing on 23 of 25 maps made the library useless in the exact
// moment it was needed -- Aaron, mid-match on Bank: "I'm on attack in this site
// but get no operator pick or anything."
//
// REBUILT 2026-07-28 from the complete, unfiltered Y11S2 operator table
// (Tracker.gg, Splinter2581 PSN). EVERY number below has a round count behind
// it. The previous version was invented at the top and wrong in both directions:
//
//   Osa      was 1st on "58%"   -> 46.8% over 47 rounds. Ninth on attack.
//   Vigil    was 1st on "63%"   -> 45.0% over 20 rounds at 0.47 K/D, his worst.
//   Melusi   was 9th on "50%"   -> 55.3% over 257 rounds. His best operator.
//   Kaid     was 3rd on "53%"   -> 57.7% over 78 rounds. Correctly high.
//   Mute     was 7th on "53%"   -> 43.9% over 82 rounds at 0.73 K/D.
//   Sledge   was on AVOID "44%" -> 51.4% over 109 rounds. Removed from AVOID.
//   Frost    was 6th on "53%"   -> 28.6% over SEVEN rounds. Unranked now.
//
// HOW THIS IS ORDERED, so it can be checked rather than trusted:
//
//   1. Minimum 40 rounds to hold a ladder position at all. Grim reads 66.7% off
//      twelve rounds with a 0.44 K/D; sorting on raw win rate puts a coin-flip
//      above 257 rounds of Melusi. Under 40 there is no position to earn, only
//      a sample to build — those sit in SMALL_SAMPLE below.
//   2. Ranked on win rate shrunk toward his own season baseline (48.5%) with a
//      50-round prior, so volume has to be earned before an operator can claim
//      it beats his average.
//   3. K/D is reported, never sorted on. He is trying to climb, and rounds won
//      is what climbs. Kapkan's 1.55 is the best on the account and he still
//      sits sixth, because 51.2% is what it actually produces.
//
// There are no unsourced numbers left in this file. Do not add one.

export const PICK_ORDER = {
  attack: [
    { op: 'Dokkaebi', win: '54%', season: { rounds: 211, kd: 1.24 },
      why: 'Clearly your best attacker — 54% over 211 rounds. Phone the cams back, hunt the roamer' },
    { op: 'Jackal', win: '54%', season: { rounds: 52, kd: 0.82 },
      why: 'Track the roamer, deny the flank. Wins rounds despite a low K/D — you are not meant to be fragging on him' },
    { op: 'Twitch', win: '54%', season: { rounds: 54, kd: 0.85 },
      why: 'Darts kill the claw before the breach. Same shape as Jackal: high win rate, low K/D, doing a job' },
    { op: 'Sledge', win: '51%', season: { rounds: 109, kd: 0.90 },
      why: 'Was wrongly on your avoid list at 44%. Actually 51.4% over 109 rounds — your best soft breach' },
    { op: 'Ash', win: '50%', season: { rounds: 189, kd: 1.14 },
      why: 'Also wrongly avoided. 50.3% over 189 rounds with a positive K/D' },
    { op: 'Striker', win: '50%', season: { rounds: 145, kd: 1.17 },
      why: 'Flex frag once the site is already open' },
    { op: 'Brava', win: '50%', season: { rounds: 40, kd: 1.38 },
      why: 'Steals their gadgets outright. Smallest sample here, but a strong K/D behind it' },
    { op: 'Fuze', win: '49%', season: { rounds: 117, kd: 1.19 },
      why: 'Was on your avoid list at 45%. Nearer break-even than that, with a good K/D' },
    { op: 'Osa', win: '47%', season: { rounds: 47, kd: 1.41 },
      why: 'Was listed as your best attacker at 58%. It is 46.8% — the 1.41 K/D is real, the rounds are not being won' },
    { op: 'Amaru', win: '47%', season: { rounds: 45, kd: 0.75 },
      why: 'Was listed at 54%. Actually 46.7% at 0.75 K/D — the entry is getting you killed' },
    { op: 'Thermite', win: '46%', season: { rounds: 236, kd: 1.11 },
      why: 'Your second-most-played attacker and a losing one. Only when the site genuinely needs a hard breach' },
  ],
  defense: [
    { op: 'Melusi', win: '55%', season: { rounds: 257, kd: 1.26 },
      why: 'Your single best operator on the account — 55.3% over 257 rounds. Banshees slow every push into site' },
    { op: 'Kaid', win: '58%', season: { rounds: 78, kd: 0.90 },
      why: 'Highest raw win rate of anything you play with real volume. Electrify the hatch from underneath' },
    { op: 'Mozzie', win: '54%', season: { rounds: 81, kd: 1.07 },
      why: 'Takes their drones and turns the intel around. Quietly one of your best' },
    { op: 'Lesion', win: '53%', season: { rounds: 88, kd: 1.06 },
      why: 'Gu mines everywhere — free damage and information without holding an angle' },
    { op: 'Doc', win: '53%', season: { rounds: 45, kd: 0.83 },
      why: 'Anchor, overheal after a trade' },
    { op: 'Kapkan', win: '51%', season: { rounds: 162, kd: 1.55 },
      why: 'The best K/D on your whole account by a distance. Traps on the doors they actually use' },
    { op: 'Wamai', win: '50%', season: { rounds: 46, kd: 0.86 },
      why: 'Eats the utility thrown at your anchor' },
    { op: 'Valkyrie', win: '48%', season: { rounds: 270, kd: 1.00 },
      why: 'Your most-played defender and a losing one — 47.8% over 270 rounds. Consider Melusi instead' },
    { op: 'Thorn', win: '47%', season: { rounds: 135, kd: 1.26 },
      why: 'Good K/D, losing record. The traps work; the rounds are not being won' },
    { op: 'Azami', win: '46%', season: { rounds: 93, kd: 1.06 },
      why: 'Kiba barriers reshape the site, but this sits below your baseline' },
    { op: 'Mute', win: '44%', season: { rounds: 82, kd: 0.73 },
      why: 'Was ranked 7th on a fabricated 53%. Real record is 43.9% at 0.73 K/D — one of your worst' },
    { op: 'Goyo', win: '40%', season: { rounds: 43, kd: 0.85 },
      why: 'Was listed at 51%. Actually 39.5% — the weakest defender you play with any volume' },
  ],
}

// Under 40 rounds this season: not bad, not proven. Kept separate so a twelve
// -round hot streak never outranks a two-hundred-round record.
//
// Worth building a sample on: Mira (63.2%, 1.91 K/D) and Bandit (57.1%, 1.62)
// are the two best-looking things on the account that nobody can yet trust.
export const SMALL_SAMPLE = {
  attack: [
    { op: 'Ram', wr: 58.3, rounds: 24, kd: 1.35 },
    { op: 'Ying', wr: 59.1, rounds: 22, kd: 0.64 },
    { op: 'Solid Snake', wr: 55.3, rounds: 38, kd: 0.73 },
    { op: 'Iana', wr: 51.9, rounds: 27, kd: 0.85 },
    { op: 'Maverick', wr: 51.5, rounds: 33, kd: 1.00 },
    { op: 'Zofia', wr: 47.6, rounds: 21, kd: 1.00 },
    { op: 'Thatcher', wr: 41.9, rounds: 31, kd: 0.92 },
    { op: 'Ace', wr: 38.5, rounds: 39, kd: 1.46 },
  ],
  defense: [
    { op: 'Mira', wr: 63.2, rounds: 19, kd: 1.91 },
    { op: 'Jager', wr: 60.0, rounds: 25, kd: 0.50 },
    { op: 'Bandit', wr: 57.1, rounds: 21, kd: 1.62 },
    { op: 'Sentry', wr: 57.1, rounds: 14, kd: 1.67 },
    { op: 'Denari', wr: 56.8, rounds: 37, kd: 1.00 },
    { op: 'Vigil', wr: 45.0, rounds: 20, kd: 0.47 },
    { op: 'Castle', wr: 40.9, rounds: 22, kd: 1.07 },
    { op: 'Smoke', wr: 39.3, rounds: 28, kd: 0.52 },
    { op: 'Frost', wr: 28.6, rounds: 7, kd: 0.29 },
  ],
}

// Jackson's pool, in his own order. Known because he is the regular duo — the
// only teammate we have real data on. Assigning him an operator he does not own
// is the same failure as recommending Aaron one he loses on.
export const DUO_POOL = {
  attack: ['Ace', 'Hibana', 'Osa', 'Buck', 'Sledge', 'Jackal', 'Ash'],
  defense: ['Mute', 'Melusi', 'Azami', 'Thorn', 'Aruni', 'Echo', 'Frost', 'Kapkan', 'Wamai', 'Bandit'],
}

export const KNOWN_MATES = {
  jocephus88: { label: 'JoCephus88', pool: DUO_POOL },
  jocephis88: { label: 'JoCephis88', pool: DUO_POOL },
}

export function poolFor(name) {
  if (!name) return null
  const k = String(name).toLowerCase().replace(/[^a-z0-9]/g, '')
  return KNOWN_MATES[k] ? KNOWN_MATES[k].pool : null
}

// Real losing records with enough rounds to mean it.
//
// Ash, Sledge and Fuze came OFF this list 2026-07-28. It had them at 47/44/45%
// and the season record says 50.3, 51.4 and 48.7. Telling him to avoid
// operators he is fine on cost him a pick every round it fired.
export const AVOID = [
  { op: 'Buck', win: '36%', note: '56 rounds — your worst attacker' },
  { op: 'Gridlock', win: '42%', note: '53 rounds' },
  { op: 'Goyo', win: '40%', note: '43 rounds' },
  { op: 'Mute', win: '44%', note: '82 rounds at 0.73 K/D' },
]

// Where he actually wins. Real match counts, not round counts. Useful at
// map-ban: ban toward the maps he is good on rather than reciting a meta list.
export const MAP_RECORD = {
  consulate: { wr: 65.6, matches: 32, kd: 1.15 },
  'emerald-plains': { wr: 56.5, kd: 1.37 },
  'calypso-casino': { wr: 53.8, matches: 91, kd: 1.22 },
  clubhouse: { wr: 50.0, kd: 1.24 },
}

export const SEASON = {
  season: 'Y11S2 System Override',
  rank: 'Gold IV',
  rp: 2639,
  ranked: { matches: 497, wins: 241, losses: 255, winRate: 48.5 },
  kd: 1.04,
  headshot: 51.8,
  clutchWinRate: 24.6,
  careerBestRp: 3824,
  source: 'Tracker.gg — Splinter2581 (PSN), full unfiltered table pulled 2026-07-28',
}

export default PICK_ORDER
