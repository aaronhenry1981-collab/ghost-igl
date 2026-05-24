// Apex Legends loadouts — weapon meta tier list, attachment priorities,
// legend-specific synergies. Apex loot is RNG-driven so this is "ideal
// case" reference, not a strict buy.

const LOADOUTS = {
  weapon_tiers: {
    name: 'Weapon Meta Tiers',
    role: 'Tier list — pick first to last',
    summary: 'Current Apex weapon meta. Top-tier = always pick. B-tier = situational. F-tier = floor unless you have nothing.',
    tiers: {
      S: {
        weapons: ['R-301 Carbine', 'Flatline', 'CAR SMG', 'Nemesis Burst AR', 'Wingman'],
        why: 'Highest DPS-to-skill ratio. Forgiving recoil, high damage, plentiful ammo.',
      },
      A: {
        weapons: ['Volt SMG', 'Havoc', 'G7 Scout', '30-30 Repeater', 'Mozambique (Hammerpoint)', 'P2020 (Hammerpoint)'],
        why: 'Strong situational picks. Volt for close fights, Havoc for mid, G7 / 30-30 for marksman play.',
      },
      B: {
        weapons: ['R-99 SMG', 'Hemlok Burst AR', 'Spitfire LMG', 'Triple Take', 'Bocek Bow', 'EVA-8 Auto'],
        why: 'Solid weapons but require care. Spitfire for sustained damage, R-99 for melt range.',
      },
      C: {
        weapons: ['Alternator SMG', 'RE-45 Auto', 'Mastiff', 'Peacekeeper', 'Charge Rifle', 'Sentinel'],
        why: 'Specialized — Sentinel can two-shot with shield amp, Mastiff melts close-range squads.',
      },
      F: {
        weapons: ['Mozambique (no hammerpoint)', 'P2020 (no hammerpoint)', 'RE-45 (no hammerpoint)'],
        why: 'Floor pickups. Replace immediately when you find anything else.',
      },
    },
  },

  attachment_priority: {
    name: 'Attachment Priority',
    role: 'Loot priority order',
    summary: 'When you crack a death box, what to grab first.',
    order: [
      { item: 'Magazine (extended)', why: 'Doubles your effective fight time before reload' },
      { item: 'Optic (1x or 2x for AR / SMG, 3x for marksman)', why: 'Pre-fight prep — open box mid-fight = use your gun' },
      { item: 'Stock', why: 'Reduces aim drift + ADS time. Flat DPS upgrade.' },
      { item: 'Barrel (recoil dampener)', why: 'Lowers vertical recoil — caps the gun\'s skill ceiling' },
      { item: 'Hop-up (Boosted Loader, Disruptor, etc.)', why: 'Game-changer when slot-matched (Skullpiercer + Wingman = oneshot headshots)' },
    ],
    notes: [
      'Always upgrade body shield before ANY weapon attachment.',
      'Helmet, knockdown, evo shield — health > damage. Get all three before optimizing.',
      'Carry one stack (60+) ammo per weapon type — running out mid-fight = death.',
    ],
  },

  legend_synergies: {
    name: 'Legend Squad Synergies',
    role: 'Team comp pairings that win',
    summary: 'Three legends that work together. Squads with good comp punch above their MMR.',
    comps: [
      {
        name: 'Dive Comp',
        legends: ['Pathfinder', 'Wraith', 'Octane'],
        why: 'Maximum mobility. Grapple in, portal out, dash to reset. Hard counter to slow comps.',
        ult_combo: 'Wraith portal → Octane jump pad on the other end → squad rotation in 3 seconds',
      },
      {
        name: 'Anchor Comp',
        legends: ['Gibraltar', 'Lifeline', 'Caustic'],
        why: 'Hold positions, heal through fights, deny pushes. Storm-edge endgame ideal.',
        ult_combo: 'Caustic ult on choke → Gibby dome on push → Lifeline drone heals through gas',
      },
      {
        name: 'Recon Comp',
        legends: ['Bloodhound', 'Crypto', 'Seer'],
        why: 'Total information warfare. Always know enemy positions before commit.',
        ult_combo: 'Bloodhound ult → Seer ult on enemy squad → Crypto EMP cracks shields',
      },
      {
        name: 'Scan + Push',
        legends: ['Bloodhound', 'Wraith', 'Bangalore'],
        why: 'Bloodhound finds, Wraith repositions, Bangalore smokes the entry.',
        ult_combo: 'Bloodhound ult → Bangalore smoke for entry cover → Wraith portal for squad reset',
      },
      {
        name: 'Edge Hold',
        legends: ['Wattson', 'Caustic', 'Catalyst'],
        why: 'Endgame ring-edge specialists. Deny entry while you ratchet to top 3.',
        ult_combo: 'Catalyst ult wall → Wattson pylon nullifies grenades → Caustic gas in choke',
      },
    ],
  },

  drop_priorities: {
    name: 'Hot Drop vs Edge Drop',
    role: 'Where to land',
    summary: 'Strategy depends on legend pick + squad confidence.',
    hot_drop: {
      legends: ['Octane', 'Pathfinder', 'Wraith', 'Bangalore'],
      logic: 'Mobile legends with disengage tools. If you fail the loot race, you can dip.',
      pick_rate_modifier: 'Hot drop = 30% chance to die round 1. High variance, fast XP / RP.',
    },
    edge_drop: {
      legends: ['Caustic', 'Wattson', 'Lifeline', 'Bloodhound'],
      logic: 'Hold legends. Loot up, third-party fights, push toward storm edge.',
      pick_rate_modifier: 'Edge drop = 70% top-10 reach. Slow RP gain, low variance.',
    },
  },
}

export default LOADOUTS
