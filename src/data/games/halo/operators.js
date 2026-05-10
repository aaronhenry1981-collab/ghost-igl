// Halo Infinite — 4 player role archetypes (Halo has no characters).
// Cast represents the standard 4v4 role split: Slayer, Power Weapon, Objective, Support.

const CAST = [
  { id: "slayer", name: "Slayer", role: "Entry / Frag", side: null, kit: ["BR / Commando", "Sidekick", "Frag Grenades", "Repulsor", "Grappleshot"] },
  { id: "objective", name: "Objective Runner", role: "Objective", side: null, kit: ["BR", "Sidekick", "Plasma Grenades", "Drop Wall", "Threat Sensor"] },
  { id: "power-weapon", name: "Power Weapon Controller", role: "AWP / Snipe", side: null, kit: ["Sniper Rifle / Skewer", "BR (secondary)", "Frag Grenades", "Threat Sensor", "Active Camo"] },
  { id: "support", name: "Support / Backup", role: "Support", side: null, kit: ["BR / Commando", "Sidekick", "Plasma + Frag mix", "Drop Wall", "Repulsor"] },
]

export default CAST
