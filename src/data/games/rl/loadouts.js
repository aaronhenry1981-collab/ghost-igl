// Rocket League — "loadouts" are car hitbox + camera settings + mechanic
// priority + boost-economy rules. Picking the right car + dialing camera
// is the foundation. Above that, mechanic priority matters more than
// fancy custom training packs.

const LOADOUTS = {
  hitbox_tiers: {
    name: 'Car Hitbox Tier List',
    role: 'Pick the body that fits your playstyle',
    summary: 'There are six unique hitboxes in Rocket League; everything else is cosmetic. The hitbox you pick determines your turning radius, how the ball comes off your roof, and how reliable your aerial dribbles are.',
    tiers: {
      S: {
        hitboxes: ['Octane (default)', 'Fennec (Octane clone, longer/lower)', 'Dominus (Lamborghini-style)'],
        why: 'Octane is the universal pick — most consistent ball lift, smallest turn radius. Fennec is identical mechanically but visually lower. Dominus is the long body, better for power shots and flat ball control.',
      },
      A: {
        hitboxes: ['Plank (Batmobile, Endo)', 'Hybrid (Breakout)'],
        why: 'Plank is fastest off the line, longest body — strong for one-touch flicks but bad for turning. Hybrid is between Octane and Dominus, balanced but no specialty.',
      },
      B: {
        hitboxes: ['Breakout-type hitbox cars'],
        why: 'Long and low — niche use for flat-ball power shots and shadow defense.',
      },
      F: {
        hitboxes: ['Merc (truck body)'],
        why: 'Merc hitbox is functionally bad. Almost no high-rank player uses it. Strictly worse Dominus for everything except looking silly.',
      },
    },
    notes: [
      'Don\'t switch hitboxes between rank checkpoints — muscle memory matters more than the body.',
      'Octane / Fennec recommended for everyone under Diamond — easiest learning curve.',
      'Dominus / Plank only if you\'ve already locked Octane mechanics in.',
    ],
  },

  camera: {
    name: 'Camera Settings',
    role: 'The single biggest free improvement you can make',
    summary: 'Default camera is bad. Every Champion + above runs custom settings. Set these once and never change them.',
    recommended: {
      'Camera Shake': 'OFF (always)',
      'FOV': '110 (max)',
      'Distance': '270-280',
      'Height': '100-110',
      'Angle': '-3 to -5',
      'Stiffness': '0.40-0.50',
      'Swivel Speed': '6.0-7.0',
      'Transition Speed': '1.0-1.4 (faster = better for aerials)',
      'Ball Camera (toggle vs hold)': 'Toggle (most pros)',
      'Invert Swivel': 'OFF (default)',
    },
    notes: [
      'These come from the average of Champion+ / pro player camera settings.',
      'Tweak Distance + Height if you feel "too zoomed in" — most players push Distance closer to 280.',
      'Transition Speed at 1.4 = camera snaps to ball faster on toggle (helps aerials), but takes practice.',
    ],
  },

  mechanic_priority: {
    name: 'Mechanic Priority (in order)',
    role: 'What to learn next, by rank',
    summary: 'Don\'t learn flip resets before you can hit a basic aerial. Every mechanic you skip in order will cap your rank.',
    bronze_silver: [
      { mechanic: 'Half-flip', why: 'Recover backward 2x faster. Free 200 rank points.' },
      { mechanic: 'Boost on small pads (sniff pads)', why: 'Stop picking up the big 100s if you have 60+.' },
      { mechanic: 'Ball cam toggling', why: 'Off during dribble, on during chase. Saves dozens of own-goals.' },
    ],
    gold_plat: [
      { mechanic: 'Power slide for tight turns', why: 'You\'re flipping into walls instead of cornering. Power slide fixes it.' },
      { mechanic: 'Fast aerials (jump → release → jump → boost)', why: 'Your aerials are too slow because you\'re holding jump. The 3-step input doubles your aerial speed.' },
      { mechanic: 'Wave dash (recovery)', why: 'You\'re landing flat instead of dashing. Wave dash = free 200 boost worth of speed.' },
    ],
    diamond_champ: [
      { mechanic: 'Speedflip kickoff', why: 'The diagonal-flip kickoff that wins center 50/50s. If you don\'t have this by Champion, you lose every kickoff.' },
      { mechanic: 'Aerial car control (yaw + pitch + roll)', why: 'Your aerial shots miss because you can\'t aim mid-air. Train this in Workshop maps.' },
      { mechanic: 'Backboard reads', why: 'You panic-clear backboard balls. Champions read where they land and pre-position.' },
    ],
    gc_ssl: [
      { mechanic: 'Air dribble', why: 'Setup → control → finish. Pro mechanic but Champions can learn the basic form.' },
      { mechanic: 'Flip reset', why: 'Touch ball with all 4 wheels mid-air → flip again. SSL-tier mechanic but worth grinding once you have everything else.' },
      { mechanic: 'Musty flicks / pinch passes', why: 'High-skill finishing moves. Don\'t prioritize over rotation.' },
    ],
  },

  rotation_rules: {
    name: 'Rotation Rules (3v3)',
    role: 'The thing that wins games at every rank',
    summary: 'If you have one rotation rule and three teammates with no rotation, you win. Mechanical skill matters less than rotation discipline through Champion.',
    rules: [
      'After any touch on the ball, rotate to 3rd man — NO exceptions.',
      'Rotate through the corner, not through the middle. Middle rotations = bumps + own-goals.',
      'Cover backpost on every defensive rotation — 80% of goals come from the far post.',
      'If teammate is challenging, you are 2nd man. If teammate is 2nd man, you are 3rd. Always count to three.',
      'Boost target by role: 1st = 30+, 2nd = 60+, 3rd = 80+. Pick up pads while rotating, never stop to grab a big.',
    ],
  },

  team_comps: {
    name: '3v3 Team Comps',
    role: 'Pre-game role assignment',
    summary: 'High-rank teams assign roles before kickoff. "Striker, Mid, Goalie" or "Aggressive, Support, Anchor."',
    comps: [
      {
        name: 'Balanced (default)',
        roles: ['Striker', 'IGL / Mid', 'Last Back'],
        why: 'Most flexible. Striker pushes pressure, Mid calls + supports, Last Back never leaves goal.',
        works_against: 'Almost any opponent comp.',
      },
      {
        name: 'Double Attack',
        roles: ['Striker', 'Striker', 'Goalie'],
        why: 'High pressure — two players forward, one absolute anchor.',
        works_against: 'Slow / passive teams. Loses to fast counter teams.',
      },
      {
        name: 'Possession',
        roles: ['Dribbler', 'Pass option', 'Backboard reader'],
        why: 'Hold the ball, force opponent to commit, then strike when they leave net.',
        works_against: 'Teams that over-rotate. Loses to fast pressure.',
      },
    ],
  },
}

export default LOADOUTS
