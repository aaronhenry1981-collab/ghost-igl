// Call of Duty loadouts — class setups by role with attachments, perks,
// equipment, killstreaks. Meta shifts patch-to-patch but the role
// structure is stable.

const LOADOUTS = {
  ar_aggressor: {
    name: 'AR Aggressor',
    role: 'Mid-range objective player',
    summary: 'Push the obj, win mid-range fights. AR with mobility attachments.',
    weapons: {
      primary: 'M4 / MTZ-556 / SVA 545 / BP50',
      secondary: 'WSP Swarm SMG (akimbo or stim-rush)',
    },
    attachments: [
      'Muzzle: Compensator or Suppressor',
      'Barrel: Long barrel (range) or short (mobility)',
      'Optic: 1x red dot or iron sights',
      'Magazine: extended (40+)',
      'Underbarrel: vertical grip (recoil) or commando (run-and-gun)',
    ],
    perks: ['Double Time (sprint)', 'Sleight of Hand (reload)', 'Tempered (faster armor plating)', 'Quick Fix (heal on kill)'],
    equipment: ['Frag Grenade', 'Stim Shot', 'Field Upgrade: Dead Silence (silent footsteps)'],
    killstreaks: ['UAV (4 kills)', 'Counter-UAV (5 kills)', 'Cluster Mine (5 kills)'],
    rotation_notes: [
      'Push obj first 30s, set up the angle.',
      'Stim + Dead Silence = ghost the flank.',
      'Reload BEFORE the fight, never DURING.',
    ],
  },

  smg_rusher: {
    name: 'SMG Rusher',
    role: 'CQC / Aggressive flanker',
    summary: 'Maximum movement speed. Slide-strafe-cancel + shotgun-tier TTK in close range.',
    weapons: {
      primary: 'WSP Swarm / Static-HV / AMR9 / Striker',
      secondary: 'Sidearm (.50 GS or COR-45)',
    },
    attachments: [
      'Muzzle: Suppressor (off radar)',
      'Barrel: Short (max sprint speed)',
      'Stock: lightweight (sprint-to-fire)',
      'Magazine: extended',
      'Laser: tac stance steady (hip-fire)',
    ],
    perks: ['Double Time', 'Tracker (footprint vision)', 'Lightweight Boots (silent)', 'Quick Fix'],
    equipment: ['Stim Shot', 'Smoke Grenade', 'Field Upgrade: Dead Silence'],
    killstreaks: ['UAV (4)', 'SAE (Strafing aircraft, 7)', 'Cruise Missile (8)'],
    rotation_notes: [
      'Slide-cancel into every entry. Don\'t walk into a room standing.',
      'Use SMG kill = stim refresh. Chain kills.',
      'Drop to second floor / vertical angles enemies don\'t expect.',
    ],
  },

  marksman: {
    name: 'Marksman / Mid-Range Anchor',
    role: 'Long-sightline holder',
    summary: 'BR / DMR for long-range engagements. Hold map control points, chip enemies before they push.',
    weapons: {
      primary: 'KAR98K / MCW (BR) / DM56 / Crossbow (memes)',
      secondary: 'WSP-9 SMG (close-range backup)',
    },
    attachments: [
      'Optic: 4x or variable scope',
      'Barrel: long range / heavy',
      'Stock: marksman steady',
      'Magazine: extended',
      'Underbarrel: bipod or grip (steady ADS)',
    ],
    perks: ['Sleight of Hand', 'Cold-Blooded (no targeting)', 'Battle Hardened (resist flashes)', 'High Alert (warns when seen)'],
    equipment: ['Smoke Grenade', 'Trip Mine (flank watch)', 'Field Upgrade: Dead Silence or Munitions Box'],
    killstreaks: ['UAV (4)', 'Sentry Gun (7)', 'Chopper Gunner (15)'],
    rotation_notes: [
      'Hold one angle until you get a kill OR enemy commits to push you.',
      'Always have an escape route prepped — don\'t over-extend the marksman spot.',
      'Trip Mine or claymore behind you on flank approach.',
    ],
  },

  sniper: {
    name: 'Sniper / Quickscope',
    role: 'High-skill picks',
    summary: 'One-shot one-kill at any range. Movement-quickscope mechanics + fast ADS attachment.',
    weapons: {
      primary: 'KATT-AMR / SP-X 80 / Longbow',
      secondary: 'X12 pistol or akimbo SMG (close-range backup)',
    },
    attachments: [
      'Optic: variable / SP-X scope (fast ADS)',
      'Barrel: tactical (faster ADS, lower range)',
      'Stock: lightweight',
      'Stock pad: aim walking',
      'Magazine: standard',
    ],
    perks: ['Double Time', 'Sleight of Hand', 'Tempered', 'Quick Fix'],
    equipment: ['Stim Shot', 'Smoke Grenade', 'Field Upgrade: Dead Silence'],
    killstreaks: ['UAV (4)', 'Sentry Gun (7)', 'VTOL Jet (12)'],
    rotation_notes: [
      'Quickscope movement: jump-shot or drop-shot to win duels.',
      'Pre-aim head height every doorway / sightline.',
      'Carry an SMG secondary — sniper alone loses every CQC fight.',
    ],
  },

  defensive_anchor: {
    name: 'Defensive Anchor / SBMM Stomper',
    role: 'Hardpoint / Search hold',
    summary: 'Sit on a window with full anti-flank kit. Win by attrition, not movement.',
    weapons: {
      primary: 'M4 / SVA 545 / DG-58 LSW',
      secondary: 'COR-45 pistol',
    },
    attachments: [
      'Muzzle: Suppressor',
      'Barrel: Long range',
      'Optic: 4x or 1.5x',
      'Stock: marksman / heavy',
      'Magazine: 60-round mag',
    ],
    perks: ['Cold-Blooded', 'High Alert', 'Battle Hardened', 'Tempered'],
    equipment: ['Trip Mine', 'Stun Grenade', 'Field Upgrade: Munitions Box (refill on hold)'],
    killstreaks: ['UAV', 'SAE', 'Sentry Gun'],
    rotation_notes: [
      'Trip mines on every entry to your hold spot.',
      'Munitions box = unlimited ammo + grenades on the hold.',
      'High Alert means you can pre-aim before a flanker peeks you.',
    ],
  },
}

export default LOADOUTS
