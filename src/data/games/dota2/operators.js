// Dota 2 — meta hero catalog (2026).
// `side` Radiant (attack) / Dire (defense) — but most heroes flex both sides.
// Role positions 1-5: 1=Carry (Safe Lane), 2=Mid, 3=Offlaner, 4=Soft Support, 5=Hard Support.

const CAST = [
  // POSITION 1 — CARRY (SAFE LANE)
  { name: "Anti-Mage", side: "attack", role: "Pos 1 Carry — Mana Break + Manta Style + Blink, late-game ult Mana Void" },
  { name: "Phantom Assassin", side: "attack", role: "Pos 1 Carry — Crit-based Coup de Grace, blink dagger Phantom Strike" },
  { name: "Spectre", side: "attack", role: "Pos 1 Carry — Late-game Haunt global teleport, Radiance scaling" },
  { name: "Wraith King", side: "attack", role: "Pos 1 Carry — Reincarnation passive (2 lives), Skeleton ult army" },
  { name: "Faceless Void", side: "attack", role: "Pos 1 Carry — Time Lock crit, Chronosphere AoE freeze ult" },
  { name: "Juggernaut", side: "attack", role: "Pos 1 Carry — Healing Ward + Blade Fury, Omnislash ult" },
  { name: "Sven", side: "attack", role: "Pos 1 Carry — Storm Hammer stun, God's Strength damage steroid" },

  // POSITION 2 — MID LANE
  { name: "Invoker", side: "attack", role: "Pos 2 Mid — 10 invokable spells, Cataclysm + EMP + Sun Strike combos" },
  { name: "Shadow Fiend", side: "attack", role: "Pos 2 Mid — Necromastery (souls + damage), Requiem of Souls AoE" },
  { name: "Storm Spirit", side: "attack", role: "Pos 2 Mid — Ball Lightning mobility, mana-based snowball" },
  { name: "Puck", side: "attack", role: "Pos 2 Mid — Phase Shift dodge + Illusory Orb gap-closer" },
  { name: "Tinker", side: "attack", role: "Pos 2 Mid — Rearm cooldown reset, Heat-Seeking Missile spam" },
  { name: "Outworld Destroyer", side: "attack", role: "Pos 2 Mid — Astral Imprisonment + Arcane Orb damage" },
  { name: "Queen of Pain", side: "attack", role: "Pos 2 Mid — Blink + Scream of Pain, Sonic Wave nuke" },

  // POSITION 3 — OFFLANER
  { name: "Axe", side: "defense", role: "Pos 3 Offlaner — Berserker's Call AoE taunt, Counter Helix passive" },
  { name: "Centaur Warrunner", side: "defense", role: "Pos 3 Offlaner — Hoof Stomp AoE, Stampede team mobility ult" },
  { name: "Bristleback", side: "defense", role: "Pos 3 Offlaner — Quill Spray damage stacks, Bristleback passive armor" },
  { name: "Dark Seer", side: "defense", role: "Pos 3 Offlaner — Vacuum + Wall of Replica ult, Surge mobility" },
  { name: "Tidehunter", side: "defense", role: "Pos 3 Offlaner — Anchor Smash, Ravage AoE 5-man stun ult" },
  { name: "Mars", side: "defense", role: "Pos 3 Offlaner — Spear of Mars stun, Arena of Blood ult zone" },

  // POSITION 4 — SOFT SUPPORT (ROAMER)
  { name: "Pudge", side: "attack", role: "Pos 4 Roamer — Meat Hook pull, Dismember channeled execute" },
  { name: "Earth Spirit", side: "attack", role: "Pos 4 Roamer — Boulder Smash + stones, magnetic kick combos" },
  { name: "Mirana", side: "attack", role: "Pos 4 Roamer — Sacred Arrow stun, Leap mobility, Moonlight Shadow" },
  { name: "Tusk", side: "attack", role: "Pos 4 Roamer — Snowball gap-closer, Walrus Punch crit" },
  { name: "Bounty Hunter", side: "attack", role: "Pos 4 Roamer — Track ult (gold bounty), Shuriken Toss spam" },

  // POSITION 5 — HARD SUPPORT
  { name: "Crystal Maiden", side: "defense", role: "Pos 5 Support — Crystal Nova AoE slow, Frostbite stun, Freezing Field ult" },
  { name: "Lion", side: "defense", role: "Pos 5 Support — Earth Spike chain stun, Finger of Death execute" },
  { name: "Lich", side: "defense", role: "Pos 5 Support — Frost Blast + Frost Shield, Chain Frost bounce ult" },
  { name: "Warlock", side: "defense", role: "Pos 5 Support — Fatal Bonds chain, Chaotic Offering golem ult" },
  { name: "Witch Doctor", side: "defense", role: "Pos 5 Support — Maledict damage stack, Death Ward channel ult" },
  { name: "Dazzle", side: "defense", role: "Pos 5 Support — Shallow Grave invuln save, Poison Touch + Shadow Wave" },
  { name: "Oracle", side: "defense", role: "Pos 5 Support — False Promise save ult, Fortune's End purge + heal" },
  { name: "Treant Protector", side: "defense", role: "Pos 5 Support — Living Armor team heal, Overgrowth AoE root ult" },
]

export default CAST
