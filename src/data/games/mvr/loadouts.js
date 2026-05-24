// Marvel Rivals loadouts — team comp synergies, ult combos, hero counters.
// MVR has team-up bonuses where specific hero combos unlock buffs (e.g.
// Hulk + Iron Man = Gamma Charge). Loadout = hero pick + team composition.

const LOADOUTS = {
  team_ups: {
    name: 'Team-Up Bonuses',
    role: 'Combo unlocks',
    summary: 'Pick two heroes from a team-up pair to unlock the bonus. Major power spike — always check the board.',
    pairs: [
      { team_up: 'Gamma Charge', heroes: ['Hulk', 'Iron Man', 'Doctor Strange'], bonus: 'Iron Man / Strange gain a charged AoE attack when Hulk is alive.' },
      { team_up: 'Symbiote Bond', heroes: ['Venom', 'Spider-Man', 'Peni Parker'], bonus: 'Spider-Man / Peni gain symbiote tendrils when Venom is alive.' },
      { team_up: 'Voltaic Union', heroes: ['Thor', 'Storm', 'Captain America'], bonus: 'Storm / Cap gain lightning empowerment.' },
      { team_up: 'Chilling Charisma', heroes: ['Luna Snow', 'Namor', 'Jeff the Land Shark'], bonus: 'Namor / Jeff get an ice-themed combo attack.' },
      { team_up: 'Atlas Bond', heroes: ['Hela', 'Loki', 'Thor'], bonus: 'Loki / Thor gain bonus attacks when Hela is alive.' },
      { team_up: 'Metallic Fusion', heroes: ['Magneto', 'Iron Man', 'Scarlet Witch'], bonus: 'Iron Man / Scarlet Witch get metallic projectile shields.' },
      { team_up: 'Lunar Force', heroes: ['Moon Knight', 'Cloak & Dagger'], bonus: 'C&D gain shadow-empowered abilities.' },
    ],
    notes: [
      'Team-up bonus persists only while the anchor hero is alive — protect them.',
      'Solo queue: pick a hero whose team-up has multiple anchors so you\'re not gated by one teammate.',
      'Tournament play: lock team-up combos first, then fill the rest.',
    ],
  },

  comp_archetypes: {
    name: 'Comp Archetypes',
    role: 'Team styles',
    summary: 'Three core comp styles. Pick by map + ult readiness + enemy comp.',
    styles: {
      dive: {
        name: 'Dive',
        roles: ['Vanguard: Hulk / Venom / Captain America', 'Duelist: Spider-Man / Magik / Black Panther', 'Strategist: Mantis / Adam Warlock'],
        plays: 'Coordinated jump on a back-line target. Win the fight by making them play out of position.',
        win_condition: 'Pick off a strategist before they can ult.',
      },
      brawl: {
        name: 'Brawl',
        roles: ['Vanguard: Doctor Strange / Magneto / Thor', 'Duelist: The Punisher / Hela / Scarlet Witch', 'Strategist: Luna Snow / Cloak & Dagger'],
        plays: 'Stack together, push the choke, win through sustained damage and team healing.',
        win_condition: 'Out-sustain in a closed area. Don\'t get split.',
      },
      poke: {
        name: 'Poke / Long-Range',
        roles: ['Vanguard: Peni Parker / Magneto', 'Duelist: Hawkeye / Black Widow / Storm', 'Strategist: Adam Warlock / Mantis'],
        plays: 'Long-range chip damage. Force fights on your terms.',
        win_condition: 'Score early picks at range, snowball the player advantage.',
      },
    },
  },

  ult_combos: {
    name: 'Ult Combos',
    role: 'Win-condition chains',
    summary: 'Coordinated ult sequences that wipe enemy teams in seconds.',
    combos: [
      { name: 'Strange Anchor + DPS', chain: 'Doctor Strange Eye of Agamotto pulls enemies → Hela / Iron Man / Punisher ult into the cluster', result: 'Team wipe.' },
      { name: 'Magneto + Scarlet Witch', chain: 'Magneto Meteor M slow on enemies → Scarlet Witch Reality Erasure', result: 'AoE wipe in caught radius.' },
      { name: 'Cap + Thor', chain: 'Cap shield throw stagger → Thor God of Thunder ult on stunned cluster', result: '2-3 picks minimum.' },
      { name: 'Luna Snow Save', chain: 'Luna Snow ultimate as enemy ult lands — heals team through 1000 damage', result: 'Negates Punisher / Iron Man / Scarlet wipe ults.' },
    ],
  },

  counter_picks: {
    name: 'Counter Pick Table',
    role: 'Hard counters',
    summary: 'When losing, swap. MVR is built for mid-match flex.',
    counters: [
      { hero: 'Storm (flying)', counter: 'Hawkeye, Black Widow, Hela', why: 'Hitscan DPS forces her off mid-air' },
      { hero: 'Iron Man (flying)', counter: 'Hawkeye, Black Widow, Hela', why: 'Same — sky control' },
      { hero: 'Spider-Man', counter: 'Peni\'s mines, Magneto shield, Mantis sleep', why: 'Block his swing-in or stun mid-attack' },
      { hero: 'Hulk', counter: 'Magneto reverse-pull, sustained DPS', why: 'Magneto pulls away from frontline' },
      { hero: 'Doctor Strange shield', counter: 'Magneto bubble break, Storm tornado, Wanda chaos', why: 'Burst through or bypass shield' },
      { hero: 'Hela (sniper)', counter: 'Spider-Man dive, Magik teleport, Black Panther', why: 'Close the gap — she\'s squishy in melee' },
      { hero: 'Luna Snow / Mantis (heals)', counter: 'Spider-Man, Magik, Iron Fist dive', why: 'Pick the back line first' },
    ],
  },
}

export default LOADOUTS
