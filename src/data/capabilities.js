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
      label: 'Utility clear',
      ops: ['Thatcher', 'Twitch', 'Kali', 'Brava', 'Flores', 'Zero'],
      have: 'Jammers, electric claws and cams can be removed before the breach.',
      missing: 'No answer to a jammer or an electrified wall.',
      then: 'A single Mute or Bandit stops the whole breach. Find the gadget with a drone and shoot it, or pick a wall they have not covered.',
      needs: /jammer|emp|electrif|electric|claw|bandit|mute|kaid|shock wire/i,
    },
    {
      key: 'intel',
      label: 'Intel',
      ops: ['IQ', 'Jackal', 'Dokkaebi', 'Lion', 'Zero', 'Twitch', 'Flores', 'Brava', 'Iana'],
      have: 'You can find the roamer and the anchor before committing.',
      missing: 'You are entering blind past the drone phase.',
      then: 'Clear behind you before you touch a wall. Keep one drone alive for the entry — a dead drone phase is how a two-man site turns into a flank.',
      needs: /roamer|flank|find the anchor|drone|intel|behind you/i,
    },
    {
      key: 'softBreach',
      label: 'Soft breach',
      ops: ['Sledge', 'Buck', 'Zofia', 'Ash', 'Ram', 'Striker', 'Amaru'],
      have: 'You can make your own rotates, sightlines and vertical holes.',
      missing: 'You are limited to the doors and windows already there.',
      then: 'Both entries are known to the defenders. Expect the anchor pre-aimed on them — take the fight from an angle rather than walking the obvious lane.',
      needs: /soft wall|soft breach|open the floor|vertical|make a hole|shoot through/i,
    },
    {
      key: 'cover',
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
      label: 'Breach denial',
      ops: ['Mute', 'Bandit', 'Kaid'],
      have: 'The reinforced walls in the plan can actually be defended.',
      missing: 'Nothing stops a hard breacher.',
      then: 'Every reinforced wall opens on their schedule. Reinforce for angles you can shoot rather than walls you cannot hold, and plan to fight after the breach, not before it.',
      needs: /jammer|electrif|electric|claw|denies a breach|deny the breach|gc90|shock wire/i,
    },
    {
      key: 'intelDenial',
      label: 'Intel denial',
      ops: ['Mute', 'Mozzie', 'Vigil', 'Bandit', 'Aruni', 'Fenrir', 'Skopos'],
      have: 'Their drones die before they map the site.',
      missing: 'They will see your setup in full before the action phase.',
      then: 'Assume they know where you are. Move after the drone phase — the spot you set up in is the spot they cleared.',
      needs: /drone|jammer|deny the drone|kill early drones/i,
    },
    {
      key: 'traps',
      label: 'Traps',
      ops: ['Kapkan', 'Frost', 'Lesion', 'Ela', 'Thorn', 'Melusi', 'Fenrir', 'Tubarao'],
      have: 'Flanks and unwatched entries cost them something without a body there.',
      missing: 'Every lane needs a real person watching it.',
      then: 'With two of you there are more entries than guns. Give up the far lane deliberately and hold the two that reach the defuser instead of spreading thin.',
      needs: /trap|edd|welcome mat|banshee|toxic|mine|flank/i,
    },
    {
      key: 'intel',
      label: 'Intel',
      ops: ['Valkyrie', 'Echo', 'Maestro', 'Mozzie', 'Pulse', 'Solis'],
      have: 'You can watch approaches you are not standing in.',
      missing: 'You only know what you can see.',
      then: 'The default cams are all you have, so use them in prep and call from sound after that. Do not rotate on a guess.',
      needs: /\bcam\b|cams|camera|watch the approach|early warning/i,
    },
    {
      key: 'projectileDenial',
      label: 'Projectile denial',
      ops: ['Jager', 'Wamai', 'Aruni'],
      have: 'Grenades and breach charges thrown at your setup get eaten.',
      missing: 'A single frag or impact clears your anchor spot.',
      then: 'Do not hold a static angle they can grenade. Play off the spot, not on it, and reposition after the first utility comes in.',
      needs: /grenade|frag|utility thrown|ads\b/i,
    },
    {
      key: 'anchor',
      label: 'Anchor support',
      ops: ['Doc', 'Rook', 'Thunderbird', 'Azami', 'Goyo', 'Castle', 'Aruni'],
      have: 'A trade or a bad opening does not immediately lose the site.',
      missing: 'The first death is a straight 2-on-1.',
      then: 'Never take a duel you did not choose. Trade only when the second gun is already looking at the same hole.',
      needs: /overheal|revive|armour|armor|barricade|kiba|shield the/i,
    },
  ],
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
