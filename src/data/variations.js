// Running the same setup twice on the same site loses the second time.
//
// Aaron: "if we use the same strat more than once its going to fail most likely
// the 2nd time." That is correct and it is the single biggest hole in a static
// setup library — the enemy watched you reinforce that wall and sit in that
// corner, and on the rematch they are already looking at it.
//
// What varies here is deliberately NOT geometry. We do not have confirmed
// walls on most of these maps, and inventing a second route would be the same
// mistake as the ceiling hatch. What varies is tempo, spawn, who does what, and
// how much of the site you are willing to concede — all of which are real
// levers, all of which change what the enemy sees, and none of which require
// knowing the building.
//
// Ordered by what beats the read they just formed. Run 1 is the written plan.

export const VARIATIONS = {
  attack: [
    {
      key: 'default',
      name: 'Default',
      tempo: 'Slow',
      lead: 'Run the plan as written.',
      changes: [
        'Full drone phase, clear utility, breach, enter together.',
        'This is the baseline. Everything below is a change FROM it.',
      ],
      why: 'They have no read on you yet. Take the version with the most information.',
    },
    {
      key: 'reangle',
      name: 'Same plan, different face',
      tempo: 'Slow',
      lead: 'They now expect pressure from where you came last round.',
      changes: [
        'Take a different spawn. Same site, same operators, same breach — approach from another side of the building.',
        'Drone the side you used last round anyway. If someone is holding it, that is a body not defending the site.',
        'Breach the opposite face of the site if there is one, or the same wall from the other end of the room.',
      ],
      why: 'The cheapest possible change. Their setup rotated toward your last approach, and rotating costs them more than it costs you.',
    },
    {
      key: 'fast',
      name: 'Fast hit',
      tempo: 'Fast',
      lead: 'Hit before the setup is finished.',
      changes: [
        'Skip the full drone phase. One drone in, find the anchor, go.',
        'Take the entry with your faster operators — this is the round the fraggers lead, not the utility.',
        'Accept you will not clear the roamer. Leave one body watching the flank instead of hunting it.',
        'Plant early and play the post-plant with the clock on your side.',
      ],
      why: 'A defense that beat you on a slow default has been rewarded for setting up deep. Arriving before the reinforcements and gadgets are down takes that away.',
    },
    {
      key: 'fake',
      name: 'Fake and late plant',
      tempo: 'Slow',
      lead: 'Make noise where you are not going.',
      changes: [
        'Commit real noise to one entry — a charge, a breach, a body they can hear — then take a different one.',
        'Do not plant on contact. Trade, back out, and let them rotate to the noise.',
        'Plant late, with under thirty seconds, and defend the defuser rather than the room.',
        'Whoever faked is now the flank watch, not part of the entry.',
      ],
      why: 'Beats a defense that has started pre-aiming your entry. Their read is now a liability — they are looking at a doorway nobody is walking through.',
    },
  ],

  defense: [
    {
      key: 'default',
      name: 'Default',
      tempo: 'Standard',
      lead: 'Run the setup as written.',
      changes: [
        'Reinforce in the written order, anchor holds, support calls.',
        'This is the baseline. Everything below is a change FROM it.',
      ],
      why: 'They have no read on you yet. Take the version with the strongest setup.',
    },
    {
      key: 'shift',
      name: 'Same setup, different bodies',
      tempo: 'Standard',
      lead: 'They droned your positions last round. Keep the setup, move the people.',
      changes: [
        'Reinforce identically — the walls were right, they are not the thing that got read.',
        'Both of you set up in prep as normal, then move before the action phase starts.',
        'Swap roles: whoever anchored now takes the short roam, and the roamer holds the site.',
        'Hold a different angle onto the same entry. Not a different room — a different line into it.',
      ],
      why: 'The cheapest possible change, and it beats the most common read: they cleared the corner you sat in, and you are not in it.',
    },
    {
      key: 'aggressive',
      name: 'Early pressure',
      tempo: 'Fast',
      lead: 'Meet them before they are set.',
      changes: [
        'One of you pushes out early for information and a possible pick, then comes straight back. One angle, one trade.',
        'Kill drones aggressively in the first twenty seconds instead of saving utility.',
        'The other body does not move — this only works if the site is still held while it happens.',
        'If the early push gets a kill, collapse back and play the man advantage. Do not chase a second.',
      ],
      why: 'Beats a team running a slow default. They are used to walking to the site unopposed; a body where they did not expect one costs them the whole setup phase.',
    },
    {
      key: 'concede',
      name: 'Give the room, take the retake',
      tempo: 'Slow',
      lead: 'They have beaten you on entry twice. Stop contesting the entry.',
      changes: [
        'Set up off-site, not in it. Let them come in and let them plant.',
        'Hold the angles they have to cross AFTER the plant, not the ones they cross to get in.',
        'Do not trade at the doorway. The whole round is the retake.',
        'One of you covers the defuser line, one covers their re-entry, and neither of you is where they cleared.',
      ],
      why: 'Beats a team with a working entry. You cannot out-aim a coordinated push into a room they have solved — but a post-plant retake against a spread-out attack is a different fight.',
    },
  ],
}

/** The variation for run N (1-based) on a site. Wraps after the last one. */
export function variationFor(side, run) {
  const list = VARIATIONS[side] || []
  if (!list.length) return null
  return list[(Math.max(1, run) - 1) % list.length]
}

export default VARIATIONS
