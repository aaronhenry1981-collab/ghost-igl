// CS2 loadouts — economy-aware weapon configs by role. Players check this
// before round buy phase to know what to pick at any team-money state.
//
// Shape: keyed by role id. Each role has eco/half/full configs covering
// primary, secondary, utility, plus role-specific notes.

const LOADOUTS = {
  rifler: {
    name: 'Rifler',
    role: 'Entry / Fragger',
    summary: 'The base of every CS2 team. AK-47 on T-side, M4A4 / M4A1-S on CT. Holds default angles, takes opening duels, bridges economy.',
    economy: {
      eco: {
        primary: 'P250 (T) / Five-SeveN or Tec-9 (CT) — armor optional',
        secondary: '—',
        utility: ['1× HE grenade', '1× flash'],
        money_target: 'Win one duel, save anything left for next round',
      },
      half: {
        primary: 'Galil AR (T) / FAMAS (CT) — half-buy rifle',
        secondary: 'P250',
        utility: ['Kevlar', '1× HE', '1× flash', '1× smoke'],
        money_target: '$2350-3100 spend, save grenades if pushed',
      },
      full: {
        primary: 'AK-47 (T) / M4A4 or M4A1-S (CT)',
        secondary: 'Default pistol',
        utility: ['Kevlar + helmet', '2× flash', '1× smoke', '1× HE', '1× molly'],
        money_target: 'Full nade + armor every full-buy',
      },
    },
    rotation_notes: [
      'Always armor on full-buy. One bodyshot from an AK saved is a round saved.',
      'Drop M4 / AK to your AWPer if the team econ supports it before you self-buy.',
      'Carry at least one flash + smoke every full-buy round — you are the support layer.',
    ],
  },

  awper: {
    name: 'AWPer',
    role: 'Pick / Hold long angles',
    summary: 'The 1k-per-shot scope. Makes or breaks rounds. Save discipline matters as much as aim.',
    economy: {
      eco: {
        primary: 'Pistol only — never AWP on eco unless gifted',
        secondary: 'P250 or Five-SeveN',
        utility: ['Smoke', 'Kevlar if affordable'],
        money_target: 'Survive, save AWP for next round',
      },
      half: {
        primary: 'SSG 08 (Scout) — $1700, two-shot kill',
        secondary: 'P250',
        utility: ['Kevlar', '1× flash', '1× smoke'],
        money_target: 'Force-buy mode — get a pick or save',
      },
      full: {
        primary: 'AWP — $4750',
        secondary: 'Desert Eagle ($700) or P250',
        utility: ['Kevlar + helmet', '1× flash', '1× smoke'],
        money_target: 'Always armor on AWP — one body-shot from a rifle and the AWP is gone',
      },
    },
    rotation_notes: [
      'If you die with AWP, drop to SSG 08 next round — save $3050.',
      'Prefer Desert Eagle as secondary on full-buy: long-range backup if AWP runs dry.',
      'Smoke for repositioning — never get caught reloading without one.',
    ],
  },

  support: {
    name: 'Support',
    role: 'Utility / Trade fragger',
    summary: 'Throws the smokes that win rounds. First flash, last to entry. Trades the entry fragger.',
    economy: {
      eco: {
        primary: 'Tec-9 (T) / Five-SeveN or P250 (CT)',
        secondary: '—',
        utility: ['1× flash', '1× smoke if affordable'],
        money_target: 'Save grenades for next round if alive',
      },
      half: {
        primary: 'MP9 / MAC-10 — $1050-1250 SMG',
        secondary: 'P250',
        utility: ['Kevlar', '2× flash', '1× smoke'],
        money_target: 'SMG kills give $600 each — ride a half-buy hot streak',
      },
      full: {
        primary: 'AK-47 / M4 — match the rifler',
        secondary: 'Default pistol',
        utility: ['Kevlar + helmet', '2× flash', '2× smoke', '1× HE', '1× molly'],
        money_target: 'Maximum utility — you are the team\'s smoke + flash budget',
      },
    },
    rotation_notes: [
      'On T-side full buy: pop-flash for entry fragger, then smoke crossfires.',
      'On CT-side: smoke off ramps and choke points, save flash for retake.',
      'Drop your second smoke + flash to teammates if they self-bought light.',
    ],
  },

  lurker: {
    name: 'Lurker',
    role: 'Map control / Late-round impact',
    summary: 'Plays alone. Catches rotations off-guard. Wins 1v3 retakes that should have been losses.',
    economy: {
      eco: {
        primary: 'Tec-9 (T) — devastating eco-round one-tap',
        secondary: '—',
        utility: ['Smoke for repositioning', '1× flash'],
        money_target: 'Stab from rotation — pick a rotator, save AK',
      },
      half: {
        primary: 'Galil / FAMAS or MP9',
        secondary: 'P250',
        utility: ['Kevlar', '1× smoke', '1× flash'],
        money_target: 'Stay alive — your value is delayed contact',
      },
      full: {
        primary: 'AK-47 / M4A1-S (silenced for stealth lurking)',
        secondary: 'Default pistol',
        utility: ['Kevlar + helmet', '1× smoke', '1× flash', '1× HE'],
        money_target: 'M4A1-S preferred for CT lurking — no tracers',
      },
    },
    rotation_notes: [
      'M4A1-S on CT-side gives away no muzzle flash from across the map.',
      'Take the long route alone. Watch rotates, not the bomb plant.',
      'Save the smoke to break sightline on your retake angle.',
    ],
  },

  igl: {
    name: 'IGL (In-Game Leader)',
    role: 'Calls / Flexes utility',
    summary: 'The brain. Calls executes, force-buys, eco-rounds. Plays where the team needs them.',
    economy: {
      eco: {
        primary: 'Pistol only — call the eco round structure',
        secondary: 'CZ-75 or P250',
        utility: ['Smoke', 'Flash for the team'],
        money_target: 'Direct teammates: who saves, who exits, who pushes',
      },
      half: {
        primary: 'Galil / FAMAS',
        secondary: 'P250',
        utility: ['Kevlar', '1× smoke', '1× flash'],
        money_target: 'Coordinate force-buy vs save call',
      },
      full: {
        primary: 'AK-47 / M4 — flex',
        secondary: 'Default pistol',
        utility: ['Kevlar + helmet', '1× smoke', '2× flash', '1× HE', '1× molly'],
        money_target: 'Whatever the team needs — you adapt',
      },
    },
    rotation_notes: [
      'Lock in next-round economy call before round starts so teammates know the buy structure.',
      'Communicate utility holes — "no smoke for ramp" means support drops one.',
      'On T-side: call execute timing and direction every round. Don\'t freelance.',
    ],
  },
}

export default LOADOUTS
