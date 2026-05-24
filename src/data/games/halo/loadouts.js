// Halo Infinite loadouts — weapon spawns, power weapon timing, vehicle
// priority, equipment usage. Halo's "loadout" is map awareness: knowing
// where the rocket launcher spawns and when it respawns wins games.

const LOADOUTS = {
  weapon_priority: {
    name: 'Weapon Tiers',
    role: 'Pick first to last',
    summary: 'Halo Infinite weapon meta. Power weapons trump precision rifles trump utility.',
    tiers: {
      power: {
        weapons: ['M41 SPNKr Rocket Launcher', 'Skewer', 'Sniper Rifle', 'Energy Sword', 'Gravity Hammer', 'Cindershot', 'Hydra'],
        why: 'Match-deciding weapons. Spawn timed every 90s-180s. Always contest.',
        respawn_timing: 'Track the spawn timer — call it out the moment it picks up.',
      },
      precision: {
        weapons: ['BR75 Battle Rifle', 'MA40 Assault Rifle', 'VK78 Commando', 'Bandit Evo', 'Heatwave (close-mid)'],
        why: 'Standard pickups. BR is the workhorse — 4-shot kill at any range.',
      },
      utility: {
        weapons: ['MK50 Sidekick', 'Mangler', 'Plasma Pistol', 'Disruptor', 'Needler', 'Shock Rifle'],
        why: 'Situational. Mangler one-shot melee combo, Plasma EMP for vehicles.',
      },
      starter: {
        weapons: ['MK50 Sidekick', 'MA40 Assault Rifle', 'BR75 Battle Rifle (Ranked)'],
        why: 'Always check spawn loadout — Ranked starts BR for free.',
      },
    },
  },

  power_up_timing: {
    name: 'Power-Up Spawn Timer',
    role: 'Map control timing',
    summary: 'Power-ups (Overshield, Active Camo) spawn on fixed timers. Win the timer = win the round.',
    pickups: [
      { name: 'Overshield', spawn_time: '120s', effect: '300 extra shield HP. Charge into a fight you would lose.', hold: 'Power weapon holder takes priority' },
      { name: 'Active Camo', spawn_time: '120s', effect: 'Invisibility for 15s. Flank or sit on power weapon.', hold: 'Sniper or off-angle player' },
      { name: 'Repulsor', spawn_time: '60s', effect: 'Pushback shield — counters rockets, sends grenades back.', hold: 'Player closing on power weapon' },
      { name: 'Threat Sensor', spawn_time: '60s', effect: 'Wallhack for 6s in throw radius.', hold: 'Pre-power-weapon contest player' },
      { name: 'Drop Wall', spawn_time: '60s', effect: 'Hard cover that blocks shots.', hold: 'Sniper / push entry player' },
      { name: 'Grappleshot', spawn_time: '60s', effect: 'Reach high ground or rapid escape.', hold: 'Map-mover / aggressive player' },
    ],
  },

  vehicle_priorities: {
    name: 'Vehicle Tier',
    role: 'BTB vehicle pick order',
    summary: 'Big Team Battle vehicle hierarchy. Wasp dominates, Banshee mobile, Warthog versatile.',
    tiers: {
      S: ['Wasp (best DPS, flight)', 'Banshee (mobility + missiles)', 'Scorpion Tank (slow but deletes)', 'Razorback (driver-DPS combo)'],
      A: ['Warthog (Chaingun)', 'Wraith (anti-vehicle plasma mortar)', 'Rocket Hog (anti-vehicle)'],
      B: ['Mongoose (mobility, no DPS)', 'Chopper (anti-vehicle ramming)'],
      C: ['Ghost (light, easy to disable)', 'Civilian Warthog (no gunner)'],
    },
    counters: [
      { vehicle: 'Wasp / Banshee', counter: 'Skewer, Rocket, Plasma Pistol EMP + DMR' },
      { vehicle: 'Scorpion / Wraith', counter: 'Skewer, Plasma Grenade stick, Hijack from behind' },
      { vehicle: 'Warthog', counter: 'Hijack, Plasma stick, Splaser/Skewer to driver' },
    ],
  },

  spawn_routes: {
    name: 'Spawn Routes',
    role: 'Movement out of base',
    summary: 'Predictable death = bad spawn route. Rotate through power-up spawns + power weapons.',
    flow: [
      'On spawn, identify your team\'s nearest power weapon — sprint there first.',
      'Mid-fight rotate: don\'t take the same path back. Predictable spawn = grenade death.',
      'Track teammate deaths — if 2 teammates die from one direction, that side has the power weapon. Rotate AWAY.',
      'Power weapon holder = bodyguard. Don\'t leave them alone.',
    ],
  },

  equipment_usage: {
    name: 'Equipment Combos',
    role: 'Equipment + weapon synergy',
    summary: 'Halo equipment is a 1-charge ability. Combo with weapons for fight-winning plays.',
    combos: [
      { combo: 'Threat Sensor + BR/Sniper', why: 'Wall-hack tells you exactly where to pre-aim' },
      { combo: 'Grappleshot + Sword', why: 'Pull-and-strike instakill from range' },
      { combo: 'Repulsor + Rocket', why: 'Push enemies into your rocket splash; deflect their rockets' },
      { combo: 'Drop Wall + BR', why: 'Hard cover for sustained 4-shot duels' },
      { combo: 'Active Camo + Sniper', why: 'Invisible scope hold — uncontested picks' },
    ],
  },
}

export default LOADOUTS
