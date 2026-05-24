// Valorant loadouts — agent-aware buys keyed to credit state. Players check
// before round buy phase. Crucially Valorant has free abilities (signature)
// and credit-cost abilities (basic + ultimate signature) — buy decisions
// branch around what your sig is on cooldown for.
//
// Shape: keyed by agent role since loadouts cluster by role more than agent.
// Per-agent specifics live in CAST data.

const LOADOUTS = {
  duelist: {
    name: 'Duelist',
    role: 'Entry / First contact',
    summary: 'Jett, Raze, Reyna, Phoenix, Yoru, Neon. First through smokes. Wins or dies trying.',
    credit_state: {
      eco: {
        primary: 'Sheriff (800c) — one-tap pistol',
        shield: 'Light Shield (400c) only if duo-eco',
        abilities: 'Sig only — don\'t buy basic abilities on eco',
        money_target: '< 2000c spend — save for full-buy',
      },
      half: {
        primary: 'Spectre (1600c) or Bulldog (2050c)',
        shield: 'Light Shield (400c) — full not affordable',
        abilities: '1× basic ability if Jett (updraft) or Raze (boombot)',
        money_target: 'Force-buy SMG mode',
      },
      full: {
        primary: 'Vandal or Phantom (2900c)',
        shield: 'Heavy Shield (1000c)',
        abilities: 'Both basics + sig',
        money_target: 'Full kit + rifle every full-round',
      },
    },
    agent_priorities: {
      Jett: 'Updraft → Cloudburst → Tailwind (sig free) → Bladestorm (ult)',
      Raze: 'Boom Bot → Blast Pack → Paint Shells (sig free) → Showstopper (ult)',
      Reyna: 'Devour → Dismiss → Leer (sig free) → Empress (ult)',
      Phoenix: 'Curveball → Hot Hands → Blaze (sig free) → Run It Back (ult)',
      Neon: 'Fast Lane → Relay Bolt → High Gear (sig free) → Overdrive (ult)',
    },
    rotation_notes: [
      'On full-buy: always entry first — your job is to take space and trade out.',
      'Save Jett dash / Neon slide for the angle break, not the entry itself.',
      'Reyna: Leer before peek. Dismiss the trade.',
    ],
  },

  controller: {
    name: 'Controller',
    role: 'Smokes / Map control',
    summary: 'Brimstone, Omen, Viper, Astra, Harbor, Clove. Owns the smoke economy. Calls execute timing.',
    credit_state: {
      eco: {
        primary: 'Sheriff (800c)',
        shield: 'No shield — survive on positioning',
        abilities: 'Sig only (most controller sigs are free)',
        money_target: 'Save for next round',
      },
      half: {
        primary: 'Spectre (1600c) or Stinger (950c)',
        shield: 'Light Shield (400c)',
        abilities: '1× smoke ability minimum (Brim Sky Smoke = 100c, Omen = free, Viper = sig)',
        money_target: '~3000c spend, force vs save',
      },
      full: {
        primary: 'Phantom or Vandal (2900c)',
        shield: 'Heavy Shield (1000c)',
        abilities: 'Full smoke kit + utility',
        money_target: 'Smokes are not optional on a full-buy',
      },
    },
    agent_priorities: {
      Brimstone: 'Sky Smokes (3 stacks, 100c each) → Stim Beacon → Incendiary → Orbital Strike (ult)',
      Omen: 'Dark Cover (free sig, 2 stacks) → Paranoia → Shrouded Step → From The Shadows (ult)',
      Viper: 'Snake Bite → Toxic Screen (free sig) → Poison Cloud → Viper\'s Pit (ult)',
      Astra: 'Stars (free, 5 charges) → Nova Pulse / Nebula / Gravity Well (transformed from stars)',
      Harbor: 'Cascade → High Tide (sig) → Cove → Reckoning (ult)',
      Clove: 'Pick-Me-Up → Meddle → Ruse (sig) → Not Dead Yet (ult, post-death)',
    },
    rotation_notes: [
      'Pre-place smokes on common attack angles before the round timer hits 0.',
      'Brimstone: 3 sky-smokes is the entire execute. Time them.',
      'Omen: free sig refresh = unlimited smokes if you can wait the cooldown.',
      'Viper Pit ult is a 1v3 win condition on a defuse — pop it on plant.',
    ],
  },

  initiator: {
    name: 'Initiator',
    role: 'Intel / Flashes / Concussion',
    summary: 'Sova, Skye, Breach, KAY/O, Fade, Gekko. Reveals defenders, breaks holds, opens the entry.',
    credit_state: {
      eco: {
        primary: 'Sheriff (800c)',
        shield: 'Light Shield only if affordable',
        abilities: 'Sig only',
        money_target: 'Save for full-buy',
      },
      half: {
        primary: 'Stinger (950c) or Spectre (1600c)',
        shield: 'Light Shield (400c)',
        abilities: '1× recon / flash basic',
        money_target: 'Force buy with Stinger if light',
      },
      full: {
        primary: 'Phantom or Vandal (2900c)',
        shield: 'Heavy Shield (1000c)',
        abilities: 'Full kit — recon + flash + entry tool',
        money_target: 'Recon dart or flash before entry, every round',
      },
    },
    agent_priorities: {
      Sova: 'Recon Bolt (sig free) → Owl Drone → Shock Bolt → Hunter\'s Fury (ult)',
      Skye: 'Trailblazer → Guiding Light (sig free) → Regrowth → Seekers (ult)',
      Breach: 'Aftershock → Flashpoint (sig free) → Fault Line → Rolling Thunder (ult)',
      'KAY/O': 'Frag/ment → Flash/drive → Zero/Point (sig free) → Null/cmd (ult)',
      Fade: 'Prowler → Seize → Haunt (sig free) → Nightfall (ult)',
      Gekko: 'Mosh Pit → Wingman (sig free) → Dizzy → Thrash (ult)',
    },
    rotation_notes: [
      'Sova: recon dart line-up before peek, every round.',
      'Skye: flash for the entry, dog for intel, heal post-fight.',
      'Breach: stagger flash + stun on execute — defenders get blinded then concussed.',
    ],
  },

  sentinel: {
    name: 'Sentinel',
    role: 'Site anchor / Flank watch',
    summary: 'Killjoy, Cypher, Sage, Chamber, Deadlock. Locks down site. Catches flanks. Slows attacks.',
    credit_state: {
      eco: {
        primary: 'Ghost (500c) or Sheriff (800c)',
        shield: 'Light Shield (400c)',
        abilities: 'Sig only — most are placeable / setup tools',
        money_target: 'Save the AWP or rifle for next round',
      },
      half: {
        primary: 'Spectre (1600c) or Marshal (950c) for Chamber',
        shield: 'Light Shield (400c)',
        abilities: 'Recon trip / cage if affordable',
        money_target: 'Anchor mode — survive, force a save next',
      },
      full: {
        primary: 'Phantom / Vandal — or Operator (4700c) for Chamber',
        shield: 'Heavy Shield (1000c)',
        abilities: 'Full setup kit on site',
        money_target: 'Pre-place sig the moment the round starts',
      },
    },
    agent_priorities: {
      Killjoy: 'Alarmbot → Nanoswarm → Turret (sig free) → Lockdown (ult)',
      Cypher: 'Trapwire (sig free, 2 stacks) → Cyber Cage → Spycam → Neural Theft (ult)',
      Sage: 'Slow Orb → Healing Orb → Barrier Orb (sig free) → Resurrection (ult)',
      Chamber: 'Trademark → Headhunter (Sheriff for free) → Rendezvous → Tour de Force (Operator-tier ult)',
      Deadlock: 'Sonic Sensor → Barrier Mesh (sig free) → GravNet → Annihilation (ult)',
    },
    rotation_notes: [
      'Killjoy: Lockdown ult on retake = forced rotation.',
      'Cypher: trip wire on flank, spycam on entry, save cages for the post-plant retake.',
      'Sage: barrier on the choke, save heal for site anchor on plant.',
      'Chamber: rendezvous for free Operator angle change. Trademark on flank.',
    ],
  },
}

export default LOADOUTS
