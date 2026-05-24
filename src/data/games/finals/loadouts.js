// The Finals loadouts — build (Light/Medium/Heavy) + Specialization +
// gadgets + weapon. Build choice locks ability slots, weapon, gadget.

const LOADOUTS = {
  light: {
    name: 'Light Build',
    role: 'High mobility / Flank',
    summary: '150 HP. Fastest movement. Solo flank or pair with cloak / dash specialization. Get picks, get out.',
    specializations: {
      Cloak: {
        why: 'Invisibility for 5s. Flank, pick, vanish. Best for objective steals.',
        playstyle: 'Loop around the map, time vanish to break LOS, isolate one enemy.',
      },
      Dash: {
        why: 'Quick burst dash. Reposition mid-fight, escape disengages.',
        playstyle: 'Dash in for shotgun-melt range, dash out before they trade.',
      },
      Grappling_Hook: {
        why: 'Vertical mobility. Reach rooftops + pull from edges.',
        playstyle: 'Map-control with verticality. Snipe + grapple to a new spot.',
      },
    },
    weapons: {
      best: ['M11 SMG', 'Sword', 'V9S Pistol', 'XP-54 SMG', 'M26 Matter (shotgun)', 'Throwing Knives', 'LH1 (light AR)'],
      situational: ['SR-84 Sniper', 'SH1900 Shotgun'],
    },
    gadgets: ['Goo Grenade', 'Flashbang', 'Glitch Grenade', 'Frag Grenade', 'Stun Gun', 'Pyro Grenade', 'Smoke Grenade', 'Tracking Dart', 'Vanishing Bomb'],
    role_in_team: 'Flank initiator. Find a single enemy, drop them with cloak / dash burst, vanish.',
  },

  medium: {
    name: 'Medium Build',
    role: 'Versatile / Support',
    summary: '250 HP. Balance of damage, sustain, and mobility. Most flexible build — good for solo queue.',
    specializations: {
      Healing_Beam: {
        why: 'Hold-to-heal teammate. Top-tier in 5v5 / Cashout.',
        playstyle: 'Stay behind the heavy, heal them through fights. Win attrition.',
      },
      Guardian_Turret: {
        why: 'Auto-targeting turret. Hold cashout / chokepoint.',
        playstyle: 'Place turret on flanks, defend objective from secondary angle.',
      },
      Dematerializer: {
        why: 'Tear through walls. Open new sightlines / escape routes.',
        playstyle: 'Make your own paths. Pair with team dive.',
      },
    },
    weapons: {
      best: ['AKM AR', 'FCAR AR', 'CL-40 Grenade Launcher', 'R.357 Revolver', 'Riot Shield', 'Model 1887 Lever Shotgun', 'Famas (burst AR)'],
      situational: ['Pike-556 (DMR)'],
    },
    gadgets: ['APS Turret (anti-projectile)', 'Defibrillator', 'Glitch Trap', 'Smoke Grenade', 'Goo Grenade', 'Frag Grenade', 'Pyro Grenade', 'Jump Pad', 'Zipline', 'Gas Mine'],
    role_in_team: 'Mid-line — heal the heavy, frag the light, hold the cashout.',
  },

  heavy: {
    name: 'Heavy Build',
    role: 'Tank / Anchor',
    summary: '350 HP. Slowest but deadliest. Hold objectives, soak damage, deny pushes.',
    specializations: {
      Mesh_Shield: {
        why: 'Deployable shield wall. Block lanes, protect cashout.',
        playstyle: 'Drop shield on the angle that matters most for the fight.',
      },
      Charge_n_Slam: {
        why: 'Charge forward + AoE knockback. Disrupt grouped enemies.',
        playstyle: 'Charge into clustered enemies on cashout / objective.',
      },
      Goo_Gun: {
        why: 'Shoots goo barricades. Build cover on the fly.',
        playstyle: 'Block doors, build defensive structures, deny vertical pushes.',
      },
    },
    weapons: {
      best: ['Lewis Gun (LMG)', 'M60 LMG', 'M134 Minigun', 'KS-23 Slug Shotgun', 'SA1216 Auto-Shotgun', 'Sledgehammer', 'Spear'],
      situational: ['MGL32 Grenade Launcher', 'Flamethrower'],
    },
    gadgets: ['Barricade', 'RPG-7', 'C4', 'Pyro Mine', 'Dome Shield', 'Gas Grenade', 'Goo Grenade', 'Anti-Gravity Cube', 'Lockbolt'],
    role_in_team: 'Front line — soak damage, anchor objective, push through chokes.',
  },

  team_comps: {
    name: 'Recommended 3-Stack Comps',
    role: 'Cashout team comps',
    summary: 'Three-build combinations that win Cashout / World Tour.',
    options: [
      {
        name: 'Triple Threat',
        builds: ['Heavy w/ Mesh Shield + Lewis Gun', 'Medium w/ Healing Beam + AKM', 'Light w/ Cloak + Throwing Knives'],
        why: 'Anchor + heal + flank. The standard. Heavy holds, medium sustains, light disrupts.',
      },
      {
        name: 'Dive Squad',
        builds: ['Light w/ Dash + M11', 'Light w/ Cloak + Sword', 'Medium w/ Defibrillator + AKM'],
        why: 'Three flankers. Win by getting picks before fights start. Defib keeps the rotation alive.',
      },
      {
        name: 'Demolition',
        builds: ['Heavy w/ Charge\'n\'Slam + Spear', 'Heavy w/ Goo Gun + RPG', 'Medium w/ Dematerializer + CL-40'],
        why: 'Break-everything comp. Tear walls open, charge through. Hard counter to defensive holds.',
      },
    ],
  },
}

export default LOADOUTS
