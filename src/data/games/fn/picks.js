// Fortnite Zero Build — drop spot recommendations per map.
// Tier indicates contest level + loot quality.

const PICKS = {
  "current-chapter": [
    { name: "Pleasant Piazza", tier: "S", reason: "Tier-1 loot guaranteed in plaza buildings. Hot drop with full squad — fight for it or land edge." },
    { name: "Foxy Floodgate", tier: "A", reason: "Dam center has tier-1 loot + bridge rotation. Mid contest level." },
    { name: "Demon's Domain", tier: "S", reason: "Castle has tier-1 loot but high contest. Drop with full squad commit only." },
    { name: "Hidden Hollow", tier: "B", reason: "Mid-tier loot, low contest. Safe drop for ranked when contested POIs are crowded." },
    { name: "Brutal Beachhead", tier: "A", reason: "Tier-1 loot in coastal buildings. Mid contest with rotation options via boats." },
    { name: "Magic Mosses", tier: "B", reason: "Mid-tier loot in tower + houses. Low contest, good for cautious squads." },
  ],
}

export default PICKS
