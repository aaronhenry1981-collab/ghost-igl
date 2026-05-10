// Apex Legends — drop spot recommendations per map.
// Replaces bans.js. Tier indicates contest level + loot quality.

const PICKS = {
  "storm-point": [
    { name: "Storm Catcher", tier: "S", reason: "Tier-1 loot guaranteed in Center Tower. Hot drop with full squad — fight for it or land edge." },
    { name: "Antenna", tier: "A", reason: "Mid-tier loot + Gravity Cannon for fast rotation. Lower contest than Storm Catcher." },
    { name: "Cenote Cave", tier: "S", reason: "Tier-1 loot spire in middle of cave. High contest; only drop with full squad commit." },
    { name: "Lightning Rod", tier: "B", reason: "Mid-tier loot, low contest. Safe drop for solo/duo squads still learning the map." },
  ],
  "worlds-edge": [
    { name: "Fragment East", tier: "S", reason: "Apartment complex has tier-1 loot — highest contest POI on World's Edge. Hot drop only with full commit." },
    { name: "Fragment West", tier: "S", reason: "Same loot tier as East with slightly less contest. Default fragment for ranked play." },
    { name: "Skyhook", tier: "A", reason: "Center Lab has tier-1 loot, multiple loot floors for safe spread-out drops." },
    { name: "Survey Camp", tier: "B", reason: "Mid-tier loot, low contest. Safe drop for ranked when fragments are crowded." },
  ],
  "olympus": [
    { name: "Hammond Labs", tier: "A", reason: "Center Building has tier-1 loot with multiple floors. Mid contest — usually a 2-team drop." },
    { name: "Bonsai Plaza", tier: "S", reason: "Plaza center has tier-1 loot but open sightlines. Hot drop demands fast positioning." },
    { name: "Estates", tier: "B", reason: "Mid-tier loot in mansion. Low contest, good for ranked solo drops." },
    { name: "Energy Depot", tier: "B", reason: "Mid-tier loot with Trident access for rotation. Safe drop for cautious play." },
  ],
  "e-district": [
    { name: "Showcase", tier: "S", reason: "Stage has tier-1 loot, multiple floors. Highest contest POI — VERIFY: confirm with current pro VODs." },
    { name: "Pinnacle", tier: "A", reason: "Tower top has tier-1 loot + sky-bridge rotation. Mid contest." },
    { name: "Skyway Garage", tier: "B", reason: "Mid-tier loot with multiple rotation routes. Low contest." },
    { name: "Theater", tier: "B", reason: "Mid-tier loot in stage area. Low contest, good for solo drops." },
  ],
  "broken-moon": [
    { name: "Foundry", tier: "S", reason: "Center Plant has tier-1 loot, multiple zip-rail rotations. High contest." },
    { name: "Promenade", tier: "A", reason: "Streets have tier-1 loot but open sightlines. Hot drop with full team commit." },
    { name: "Atmostation", tier: "A", reason: "Center Tower has mid-tier loot with zip-rail rotation. Mid contest." },
    { name: "Dry Gulch", tier: "B", reason: "Mid-tier loot in gulch floor. Low contest, good for cautious squads." },
  ],
}

export default PICKS
