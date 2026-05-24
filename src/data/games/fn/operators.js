// Fortnite Zero Build — 4 player loadout archetypes (Fortnite skins are cosmetic).

const CAST = [
  { id: "aggressor", name: "Aggressor", role: "Aggressor / Entry", side: null, kit: ["SMG / Shotgun", "Heals (Med Kit, Big Pots)", "Mobility (Crash Pad / Shockwave)"] },
  { id: "marksman", name: "Marksman", role: "Sniper / Marksman", side: null, kit: ["Sniper Rifle / DMR", "AR (secondary)", "Mobility item", "Mini Shields"] },
  { id: "support", name: "Support", role: "Support / Healer", side: null, kit: ["AR / SMG", "Med Kit / Bandages", "Mobility item", "Wall Item / Trap"] },
  { id: "rotator", name: "Rotator", role: "Mobility / Scout", side: null, kit: ["SMG / AR", "Mobility (Launch Pad / Boogie Bomb)", "Mini Shields", "Heals"] },
  {
    id: "box-fighter",
    name: "Box Fighter",
    role: "Close-Range Specialist",
    kit: ["Wall-take, edit-shotgun, double-pump rotation","Lives and dies in 1x1 builds"],
  },
  {
    id: "sniper-specialist",
    name: "Sniper Specialist",
    role: "Long-Range Marksman",
    kit: ["Heavy Sniper + Bolt rotation","pre-edit flick shots","structure damage from range."],
  },
  {
    id: "zone-rotation",
    name: "Zone Rotation Pro",
    role: "Endgame IGL",
    kit: ["Material management","high-ground racing","late-ring positioning","third-party timing."],
  },
  {
    id: "mat-farmer",
    name: "Material Farmer",
    role: "Eco-Build Specialist",
    kit: ["Cap mats fast","tunnel rotations","build economy carry for the squad in endgame."],
  },
]

export default CAST
