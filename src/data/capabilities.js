// What the team can actually DO, derived from who locked in.
//
// The setups page used to treat a ban and a teammate's pick as the same thing:
// "gone this round, you cannot have it." That is right for choosing your own
// operator and wrong for planning the round. A banned Thermite means nobody
// opens the reinforced wall. A teammate's Thermite means the wall is already
// somebody's job — and the plan should say so instead of quietly assuming it.
//
// So picks feed capabilities, capabilities feed the strat. Only operators in
// op-roster.js appear here; a name that isn't in the game helps nobody.

export const CAPABILITIES = {
  attack: [
    {
      key: 'hardBreach',
      job: 'You open the reinforced wall — on the call, never on your own read. Nobody walks through it until it is clear.',
      label: 'Hard breach',
      ops: ['Thermite', 'Hibana', 'Ace', 'Maverick'],
      have: 'Reinforced walls and hatches can be opened. Run the plan as written.',
      missing: 'Nobody can open a reinforced surface.',
      then: 'Every reinforced wall in the plan is a dead end. Go through soft walls, existing doors or a hatch instead, and expect to fight into the site rather than through it.',
      // Which words in a plan mean this capability is required.
      needs: /hard breach|hard-breach|breach charge|reinforced wall|reinforced hatch|selma|exothermic|open the wall|opens the wall/i,
    },
    {
      key: 'utilityClear',
      job: 'You kill the jammer or the electric claw before the breach, and you say it out loud when it is down.',
      label: 'Utility clear',
      ops: ['Thatcher', 'Twitch', 'Kali', 'Brava', 'Flores', 'Zero'],
      have: 'Jammers, electric claws and cams can be removed before the breach.',
      missing: 'No answer to a jammer or an electrified wall.',
      then: 'A single Mute or Bandit stops the whole breach. Find the gadget with a drone and shoot it, or pick a wall they have not covered.',
      needs: /jammer|emp|electrif|electric|claw|bandit|mute|kaid|shock wire/i,
    },
    {
      key: 'intel',
      job: 'You find the roamer and the anchor before anyone commits, and you keep one drone alive for the entry.',
      label: 'Intel',
      ops: ['IQ', 'Jackal', 'Dokkaebi', 'Lion', 'Zero', 'Twitch', 'Flores', 'Brava', 'Iana'],
      have: 'You can find the roamer and the anchor before committing.',
      missing: 'You are entering blind past the drone phase.',
      then: 'Clear behind you before you touch a wall. Keep one drone alive for the entry — a dead drone phase is how a two-man site turns into a flank.',
      needs: /roamer|flank|find the anchor|drone|intel|behind you/i,
    },
    {
      key: 'softBreach',
      job: 'You make the rotates and the extra sightlines — open the angle the anchor is not expecting.',
      label: 'Soft breach',
      ops: ['Sledge', 'Buck', 'Zofia', 'Ash', 'Ram', 'Striker', 'Amaru'],
      have: 'You can make your own rotates, sightlines and vertical holes.',
      missing: 'You are limited to the doors and windows already there.',
      then: 'Both entries are known to the defenders. Expect the anchor pre-aimed on them — take the fight from an angle rather than walking the obvious lane.',
      needs: /soft wall|soft breach|open the floor|vertical|make a hole|shoot through/i,
    },
    {
      key: 'cover',
      job: 'You break the anchor sightline before anyone steps into the plant lane. Shield or flash first, bodies second.',
      label: 'Cover',
      ops: ['Montagne', 'Blitz', 'Osa', 'Blackbeard', 'Rauora', 'Ying', 'Capitao'],
      have: 'Someone can hold an angle open without winning a duel first.',
      missing: 'Every angle has to be taken with a body.',
      then: 'Do not dry-peek the plant lane. Use smoke or a flash to break the anchor sightline before anyone steps into it.',
      needs: /shield|hold the angle|plant lane|open the angle|cover the plant/i,
    },
  ],

  defense: [
    {
      key: 'breachDenial',
      job: 'You keep the reinforced walls alive — electrics and jammers on the wall they want, placed in prep.',
      label: 'Breach denial',
      ops: ['Mute', 'Bandit', 'Kaid'],
      have: 'The reinforced walls in the plan can actually be defended.',
      missing: 'Nothing stops a hard breacher.',
      then: 'Every reinforced wall opens on their schedule. Reinforce for angles you can shoot rather than walls you cannot hold, and plan to fight after the breach, not before it.',
      needs: /jammer|electrif|electric|claw|denies a breach|deny the breach|gc90|shock wire/i,
    },
    {
      key: 'intelDenial',
      job: 'You kill their drones early so they never map the site. Jammers down in prep, then anchor.',
      label: 'Intel denial',
      ops: ['Mute', 'Mozzie', 'Vigil', 'Bandit', 'Aruni', 'Fenrir', 'Skopos'],
      have: 'Their drones die before they map the site.',
      missing: 'They will see your setup in full before the action phase.',
      then: 'Assume they know where you are. Move after the drone phase — the spot you set up in is the spot they cleared.',
      needs: /drone|jammer|deny the drone|kill early drones/i,
    },
    {
      key: 'traps',
      job: 'You cover the lanes nobody is standing in. Traps on the flank, not on the door someone already watches.',
      label: 'Traps',
      ops: ['Kapkan', 'Frost', 'Lesion', 'Ela', 'Thorn', 'Melusi', 'Fenrir', 'Tubarao'],
      have: 'Flanks and unwatched entries cost them something without a body there.',
      missing: 'Every lane needs a real person watching it.',
      then: 'With two of you there are more entries than guns. Give up the far lane deliberately and hold the two that reach the defuser instead of spreading thin.',
      needs: /trap|edd|welcome mat|banshee|toxic|mine|flank/i,
    },
    {
      key: 'intel',
      job: 'You are the eyes — cams placed in prep covering approaches nobody is standing in, then call from them. You do not chase what you see.',
      label: 'Intel',
      ops: ['Valkyrie', 'Echo', 'Maestro', 'Mozzie', 'Pulse', 'Solis'],
      have: 'You can watch approaches you are not standing in.',
      missing: 'You only know what you can see.',
      then: 'The default cams are all you have, so use them in prep and call from sound after that. Do not rotate on a guess.',
      needs: /\bcam\b|cams|camera|watch the approach|early warning/i,
    },
    {
      key: 'projectileDenial',
      job: 'You eat the grenades aimed at the anchor. Place it covering the spot people actually stand.',
      label: 'Projectile denial',
      ops: ['Jager', 'Wamai', 'Aruni'],
      have: 'Grenades and breach charges thrown at your setup get eaten.',
      missing: 'A single frag or impact clears your anchor spot.',
      then: 'Do not hold a static angle they can grenade. Play off the spot, not on it, and reposition after the first utility comes in.',
      needs: /grenade|frag|utility thrown|ads\b/i,
    },
    {
      key: 'anchor',
      job: 'You make sure the first trade does not lose the site — hold with the second gun, heal or shield after it.',
      label: 'Anchor support',
      ops: ['Doc', 'Rook', 'Thunderbird', 'Azami', 'Goyo', 'Castle', 'Aruni'],
      have: 'A trade or a bad opening does not immediately lose the site.',
      missing: 'The first death is a straight 2-on-1.',
      then: 'Never take a duel you did not choose. Trade only when the second gun is already looking at the same hole.',
      needs: /overheal|revive|armour|armor|barricade|kiba|shield the/i,
    },
  ],
}

// Which defenders matter MORE on this particular site.
//
// Aaron: "operator pick is very important definately on defense bc after
// picking there is no going back and these should also be site specific not
// just for me to figure out." A generic ladder is the same answer on a basement
// site as on a top floor, and those are not the same round.
//
// The only site fact confirmed on all 100 sites is the FLOOR — read off his own
// objective screen. That is enough to shift a pick order honestly, because where
// the attack can come FROM is what makes a defender good. Stated as a tendency
// with its reason, never as verified geometry: nobody has confirmed this
// specific site's hatches, so the text says "if" and asks him to check.
export const FLOOR_PRIORITY = {
  B: {
    label: 'Basement',
    lift: ['Kaid', 'Mute', 'Bandit', 'Kapkan', 'Frost', 'Lesion', 'Ela'],
    why: 'Everything arrives from above — down the stairs or through a hatch. Denial on the ceiling and traps on the drop are worth more here than anything watching a door.',
    check: 'Find the hatches into this site in prep. If there are none, drop the electric denial and put that pick into another gun.',
  },
  '1F': {
    label: 'Ground floor',
    lift: ['Castle', 'Goyo', 'Kapkan', 'Mute', 'Valkyrie', 'Melusi', 'Azami'],
    why: 'Pressure comes from outside AND from the floor above, so there are more ways in than you have bodies. Closing entries and slowing the push beats trying to watch them all.',
    check: 'Count the outside entries before you reinforce. Anything you cannot watch should be barricaded or trapped, not left open.',
  },
  '2F': {
    label: 'Top floor',
    lift: ['Kapkan', 'Frost', 'Valkyrie', 'Vigil', 'Melusi', 'Mute'],
    why: 'They rappel to your windows and push up the stairs, so the fight is same-floor and from below. Traps on windows and vault points pay more than ceiling denial.',
    check: 'Check whether anything above you opens into this site. If nothing does, no reinforcement or gadget should be pointing up.',
  },
  '3F': {
    label: 'Top floor',
    lift: ['Kapkan', 'Frost', 'Valkyrie', 'Vigil', 'Melusi', 'Mute'],
    why: 'They rappel to your windows and push up the stairs, so the fight is same-floor and from below. Traps on windows and vault points pay more than ceiling denial.',
    check: 'Check whether anything above you opens into this site. If nothing does, no reinforcement or gadget should be pointing up.',
  },
}

/**
 * Re-order a defender pool for this site's floor, keeping only operators the
 * player actually owns. Returns null when the floor is unknown — a guess about
 * an unknown floor is worse than the plain ladder.
 */
export function floorPicks(floor, pool = [], gone = new Set()) {
  const f = FLOOR_PRIORITY[floor]
  if (!f) return null
  const own = new Set(pool.map((o) => String(o).toLowerCase()))
  const lift = f.lift.filter((o) => own.has(o.toLowerCase()) && !gone.has(o.toLowerCase()))
  if (!lift.length) return null
  return { ...f, lift }
}

const norm = (s) => String(s || '').toLowerCase().trim()

/**
 * What the squad's locked picks cover on this side.
 * `taken` = operators teammates have picked. `mine` = your own pick, if chosen.
 * Returns every capability with who provides it, so "missing" is as visible as "have".
 */
export function teamCapabilities(side, taken = new Set(), mine = null) {
  const held = new Set([...taken].map(norm))
  if (mine) held.add(norm(mine))
  return (CAPABILITIES[side] || []).map((c) => {
    const by = c.ops.filter((op) => held.has(norm(op)))
    return { ...c, by, covered: by.length > 0 }
  })
}

/** Capabilities this side needs that nobody picked. Most consequential first. */
export function gaps(side, taken = new Set(), mine = null) {
  return teamCapabilities(side, taken, mine).filter((c) => !c.covered)
}

/** Which capability, if any, a single plan step depends on. */
export function stepNeeds(side, text) {
  const t = String(text || '')
  return (CAPABILITIES[side] || []).filter((c) => c.needs.test(t))
}

export default CAPABILITIES

/**
 * What the player in this seat actually DOES, from the operator they hold.
 *
 * A 4-stack used to hand seats 3 and 4 an operator and nothing else — "Amaru,
 * next best open · 54%" and not one word about their job. Two of four players
 * were told a name and left to guess, which is the exact thing the library
 * exists to stop.
 *
 * Derived from the operator's own gadget, so it is true on every site including
 * the 62 with no written setup.
 */
export function seatJob(op, side) {
  if (!op) return null
  const k = String(op).toLowerCase()
  const c = (CAPABILITIES[side] || []).find((x) => x.ops.some((o) => o.toLowerCase() === k))
  return c ? { role: c.label, job: c.job } : null
}
