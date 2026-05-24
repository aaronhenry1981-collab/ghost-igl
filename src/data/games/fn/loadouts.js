// Fortnite loadouts — weapon priority, healing kit, build/no-build modes,
// drop strategy. Loot is RNG so this is "best-case slot order" not strict.

const LOADOUTS = {
  weapon_priority: {
    name: 'Weapon Slot Priority',
    role: 'Inventory order',
    summary: 'Standard 5-slot inventory. Mid-late game ideal: Shotgun + AR + sub + sniper + heal.',
    slots: [
      {
        slot: 1,
        type: 'Shotgun',
        best: ['Pump Shotgun (mythic)', 'Frenzy Shotgun', 'Drum Shotgun', 'Striker Pump'],
        why: 'Box fights and 1v1 build battles. Mythic gold pump = one-shot headshot in crank.',
      },
      {
        slot: 2,
        type: 'AR / Mid-Range',
        best: ['Combat AR', 'Striker AR', 'Hammer AR', 'Burst AR'],
        why: 'Mid-range chip damage + breaking enemy builds.',
      },
      {
        slot: 3,
        type: 'SMG / Close-mid backup',
        best: ['Stinger SMG', 'Combat SMG', 'Submachine Gun (red dot)'],
        why: 'Backup when shotgun is dry, follow-up after shotty body shot.',
      },
      {
        slot: 4,
        type: 'Sniper / Long range',
        best: ['Heavy Sniper', 'Bolt Sniper', 'DMR / Auto Sniper'],
        why: 'Pre-edit flicks, structure damage from range, last-ring picks.',
      },
      {
        slot: 5,
        type: 'Heals / Mobility',
        best: ['Mini Shields (stack 6)', 'Big Shield Potion', 'Med Kit', 'Slurp Juice', 'Chug Splash', 'Launch Pad / Shockwave'],
        why: 'Sustained healing + repositioning. Late-ring rotation tools.',
      },
    ],
  },

  build_priority: {
    name: 'Build Priority (Build Mode)',
    role: 'Material spend order',
    summary: 'Build mode is half the game. Wood for fast, brick for durable, metal for rotations.',
    materials: [
      { mat: 'Wood', use: 'Fast walls in fight (instant HP, weak)', cap: 1000, priority: 'Always have 300+ in pocket' },
      { mat: 'Brick', use: 'Box up + edit plays, mid-fight rotation', cap: 1000, priority: 'Stack 500+ for mid-game' },
      { mat: 'Metal', use: 'Endgame ring builds, durable cover', cap: 1000, priority: 'Stack 800+ for top 10' },
    ],
    techniques: [
      'Crank 90s = win box fights. Practice in Creative.',
      'Cone-piece = denies enemy edit play.',
      'Triple-edit (window + door + cone) = fastest peek timing.',
      'Tunnel rotations = mat-efficient cross-map move.',
    ],
  },

  zero_build_loadout: {
    name: 'Zero Build Loadout',
    role: 'No-build mode',
    summary: 'Zero Build doesn\'t have building. Mantle + sprint + cover-based shooter. Loadout shifts.',
    slots: [
      'Shotgun (Frenzy or Pump)',
      'AR (Combat or Striker)',
      'SMG or Pistol (close backup)',
      'Heavy Sniper or DMR',
      'Heals + Mobility (Shockwaves are king in Zero Build)',
    ],
    notes: [
      'Mantle over walls — built-in mobility replaces building.',
      'Augments: pick mobility / shield-charge augments first.',
      'Use natural cover. Pre-aim corners. Hold high ground.',
    ],
  },

  drop_strategy: {
    name: 'Drop Strategy',
    role: 'Where to land',
    summary: 'Drop choice = win condition. Hot drops are high RP variance, edge drops are high consistency.',
    options: {
      hot: {
        zones: ['Tilted Towers', 'The Citadel', 'Reckless Railways', 'Mythic POIs'],
        why: 'Loot density + early action. Eliminate 2-3 squads round 1.',
        risk: '40% squad-wipe rate before storm round 2.',
      },
      medium: {
        zones: ['Named POIs (mid-tier)', 'Gas station / single-house spots'],
        why: 'Decent loot, lower contest.',
        risk: '20% wipe rate, slow gas-tank fill.',
      },
      edge: {
        zones: ['Far-corner loot spots', 'Single-shack / chest-spawn islands'],
        why: 'Always survive. Loot up calmly, third-party fights.',
        risk: 'Low kills but high top-10 rate.',
      },
    },
  },

  endgame_priorities: {
    name: 'Top 10 Priority',
    role: 'Late game checklist',
    summary: 'When you reach top 10 / final ring, your inventory and approach should shift.',
    checklist: [
      'Full materials capped (1000 of metal especially).',
      'Two heals minimum (Big Shield + Mini stack OR Chug Splash).',
      'Mobility item slotted (Launch Pad in Build, Shockwave in Zero Build).',
      'Zone-edge sniper or DMR for picks.',
      'High ground positioning before final 25 alive.',
    ],
  },
}

export default LOADOUTS
