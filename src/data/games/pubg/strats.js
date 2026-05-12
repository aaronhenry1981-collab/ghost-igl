// PUBG: Battlegrounds — POI strats per map.
// `attack` = rotating into POI / engaging squad; `defense` = holding compound / endgame.

const STRATS = {
  "erangel": {
    "pochinki": {
      attack: {
        operators: [
          { name: "Fragger", role: "Entry duelist", priority: "essential" },
          { name: "Scout", role: "Recon + lineups", priority: "essential" },
          { name: "Support", role: "Heals + smokes", priority: "recommended" },
          { name: "IGL / Caller", role: "Drop call", priority: "essential" },
        ],
        strategy: "Pochinki is the iconic Erangel hot drop — center map, tier-2 loot, always contested. 3-5 squads land here. Drop priority: split squad on 4 buildings (2 north, 2 south) to avoid stacking. Fragger drops first to engage; Scout drops second with grenades; Support holds back with revive prep. Loot priority: AR + level 2 helmet + 2 frags + smokes within 60 seconds. Don't loot all bodies; grab essential and rotate. Pochinki = 60% of loot piles, 40% chance of squad wipe.",
        callouts: ["Center Buildings", "North Houses", "South Houses", "Wall Corner", "Roof Position", "Pochinki Loot Hub"],
        utility: [
          "Frag grenade for room clear",
          "Stun grenade for breach",
          "Smoke for revive cycle",
          "Boost items (Painkillers, Energy Drink) for HP regen",
          "Mid-range AR (M416 / AKM) for cross-building shots",
        ],
      },
      defense: {
        operators: [
          { name: "Anchor", role: "Compound holder", priority: "essential" },
          { name: "Sniper", role: "Long-range pick-off", priority: "essential" },
          { name: "Support", role: "Heals + revives", priority: "recommended" },
        ],
        strategy: "Defending after Pochinki fight: 1-2 squads remain after wipe. Set up in elevated compound (3-story building), Sniper on rooftop for long-range cover, Anchor holds ground floor with shotgun. Heal cycle priority: Painkillers + Energy Drink stacked for boost gauge. Wait for circle close to rotate; Pochinki is mid-map so circles favor you. 3rd-party timing: if other squads fight north, push for the wipe-and-loot opportunity.",
        callouts: ["Compound Rooftop", "Ground Floor", "Side Window", "Exit Route", "Loot Pile Cover"],
        utility: [
          "Sniper from rooftop for long-range",
          "Smoke grenade for revive escape",
          "Boost items for sustained HP regen",
          "Frag for grenade entries",
          "Mid-range AR cover",
        ],
      },
    },
    "school": {
      attack: {
        operators: [
          { name: "Fragger", role: "Entry duelist", priority: "essential" },
          { name: "Scout", role: "Recon + lineups", priority: "essential" },
          { name: "IGL / Caller", role: "Drop call", priority: "essential" },
        ],
        strategy: "School is Erangel's brutal close-range fight zone. 5-7 squads land here for tier-3 loot. Stacked vertical buildings = grenade spam + close-range. Drop priority: top floor of 4-story building for vertical advantage. Fragger drops first with AR; Scout drops on roof for grenade lineups. Don't engage stair fights — use grenade chains to clear floor by floor. Loot priority: AR + frags + level 2 armor. School is 80% probability of squad wipe; only land if you're confident in close-range.",
        callouts: ["Roof", "Top Floor", "Mid Floor", "Ground Floor", "Stairs", "Exit Route"],
        utility: [
          "Frag chain for stair clear",
          "Stun grenade for breach",
          "Smoke for revive cycle",
          "SMG (UMP45 / P90) for close-range",
          "Shotgun (S686) for breach kill",
        ],
      },
      defense: {
        operators: [
          { name: "Anchor", role: "Compound holder", priority: "essential" },
          { name: "Sniper", role: "Long-range cover", priority: "recommended" },
        ],
        strategy: "Defending after School fight: 1-2 squads remain. Hold roof for vertical advantage. Set up grenade lineups for incoming pushes. Sniper from roof covers all entries. Heal cycle priority: revive teammates before pushing for loot. 3rd-party timing: 1-2 squads will rotate to School for loot; pre-position for the wipe.",
        callouts: ["Roof", "Top Floor", "Stairs Block", "Side Window", "Exit Route"],
        utility: [
          "Sniper roof cover",
          "Smoke for revive cycle",
          "Boost items",
          "Frag denial on stairs",
          "SMG / Shotgun close-range",
        ],
      },
    },
    "military-base": {
      attack: {
        operators: [
          { name: "Fragger", role: "Entry duelist", priority: "essential" },
          { name: "Sniper", role: "Long-range cover", priority: "essential" },
          { name: "Support", role: "Heals + smokes", priority: "recommended" },
          { name: "IGL / Caller", role: "Drop call", priority: "essential" },
        ],
        strategy: "Military Base = Erangel's tier-3 loot island. 3-5 squads land here. Vertical concrete buildings + open beach. Drop priority: main building roof for tier-3 loot. Fragger drops first with AR; Sniper drops on roof for cover. Loot priority: AR + Sniper + level 3 helmet + 2 frags + smokes. Military is 70% chance of squad wipe; the loot is worth it for serious BR play. Use bridge rotation for safe escape; never swim out — too vulnerable.",
        callouts: ["Main Building Roof", "Helipad", "Beach", "Bridge", "South Houses", "Watchtower"],
        utility: [
          "Sniper for long-range cover",
          "Frag for compound breach",
          "Smoke for bridge rotation",
          "Boost items stacked",
          "Mid-range AR + Sniper combo",
        ],
      },
      defense: {
        operators: [
          { name: "Anchor", role: "Compound holder", priority: "essential" },
          { name: "Sniper", role: "Long-range cover", priority: "essential" },
          { name: "Support", role: "Heals + smokes", priority: "recommended" },
        ],
        strategy: "Defending Military Base: 1-2 squads remain after wipe. Rotate out via bridge or swim (with smoke cover). Pre-position for circle close. Sniper from roof covers bridge; Anchor on ground floor of main building. Heal cycle priority: revive teammates, stack boost items. 3rd-party timing: Military is end-game hot spot; pre-position for the final fight.",
        callouts: ["Main Building", "Helipad", "Bridge", "Side Exit", "Beach Cover"],
        utility: [
          "Sniper bridge cover",
          "Smoke for bridge rotation",
          "Boost items for HP regen",
          "Frag denial on stair entry",
          "Mid-range AR sustained fire",
        ],
      },
    },
  },
  "miramar": {
    "pecado": {
      attack: {
        operators: [
          { name: "Fragger", role: "Entry duelist", priority: "essential" },
          { name: "Scout", role: "Recon + lineups", priority: "essential" },
          { name: "IGL / Caller", role: "Drop call", priority: "essential" },
        ],
        strategy: "Pecado is Miramar's iconic hot drop. Casino + Boxing Ring buildings dominate the POI. Drop priority: Casino roof for tier-2 loot. Fragger drops first with AR; Scout drops on Boxing Ring for grenade lineups. Loot priority: AR + Sniper + level 2 helmet + 2 frags + smokes. Pecado is 75% chance of squad wipe; loot pile reward is high. Rotate via vehicle to next circle; never on foot.",
        callouts: ["Casino", "Boxing Ring", "South Buildings", "North Buildings", "Roof Position"],
        utility: [
          "Frag for compound breach",
          "Stun for room clear",
          "Smoke for vehicle rotation",
          "Vehicle for fast rotate",
          "Mid-range AR (M416)",
        ],
      },
      defense: {
        operators: [
          { name: "Anchor", role: "Compound holder", priority: "essential" },
          { name: "Sniper", role: "Long-range cover", priority: "essential" },
        ],
        strategy: "Defending Pecado: 1-2 squads remain. Casino roof for vertical advantage. Sniper covers approach from far buildings. Anchor holds ground floor with shotgun. Vehicle rotation route prepared. 3rd-party timing: Pecado is mid-map; pre-position for circle close.",
        callouts: ["Casino Roof", "Casino Ground Floor", "Boxing Ring", "Exit Vehicle", "Side Cover"],
        utility: [
          "Sniper roof cover",
          "Smoke for vehicle escape",
          "Boost items",
          "Frag denial on entry",
          "Mid-range AR + Sniper",
        ],
      },
    },
    "hacienda": {
      attack: {
        operators: [
          { name: "Fragger", role: "Entry duelist", priority: "essential" },
          { name: "Sniper", role: "Long-range cover", priority: "essential" },
          { name: "Support", role: "Heals + smokes", priority: "recommended" },
        ],
        strategy: "Hacienda is Miramar's tier-3 loot castle. 3-5 squads land here. Drop priority: main mansion roof for tier-3 loot. Fragger drops first with AR; Sniper drops on roof for cover. Loot priority: AR + Sniper + level 3 helmet + 2 frags + smokes. Hacienda is 70% squad wipe; tier-3 loot is worth it for end-game prep.",
        callouts: ["Main Mansion", "Helipad", "Pool Area", "Tower", "Side Buildings"],
        utility: [
          "Sniper from tower",
          "Frag for compound breach",
          "Smoke for vehicle rotation",
          "Boost items stacked",
          "Mid-range AR + Sniper",
        ],
      },
      defense: {
        operators: [
          { name: "Anchor", role: "Compound holder", priority: "essential" },
          { name: "Sniper", role: "Tower sniper", priority: "essential" },
        ],
        strategy: "Defending Hacienda: 1-2 squads remain. Main mansion + tower for vertical advantage. Sniper covers entrance from tower. Anchor holds main mansion. Vehicle rotation prepared. 3rd-party timing: Hacienda is iconic; mid-game hot spot.",
        callouts: ["Main Mansion", "Tower", "Helipad", "Pool Area", "Exit Vehicle"],
        utility: [
          "Sniper tower",
          "Smoke for vehicle escape",
          "Boost items",
          "Frag denial on entry",
          "Mid-range AR + Sniper",
        ],
      },
    },
  },
  "sanhok": {
    "bootcamp": {
      attack: {
        operators: [
          { name: "Fragger", role: "Entry duelist", priority: "essential" },
          { name: "Scout", role: "Recon + lineups", priority: "essential" },
          { name: "IGL / Caller", role: "Drop call", priority: "essential" },
        ],
        strategy: "Bootcamp is Sanhok's center tier-3 loot zone. Most contested POI on the smallest map. 5-7 squads land here. Drop priority: top floor of center building for vertical advantage. Fragger drops first; Scout on roof for grenade lineups. Loot priority: AR + Sniper + level 3 helmet + 2 frags + smokes within 60 seconds. Bootcamp is 80% squad wipe; loot is end-game tier-3.",
        callouts: ["Center Building Roof", "North Buildings", "South Buildings", "Watchtower", "Exit Route"],
        utility: [
          "Frag chain for stair clear",
          "Stun for room breach",
          "Smoke for revive cycle",
          "Mid-range AR + Sniper",
          "Boost items stacked",
        ],
      },
      defense: {
        operators: [
          { name: "Anchor", role: "Compound holder", priority: "essential" },
          { name: "Sniper", role: "Long-range cover", priority: "essential" },
        ],
        strategy: "Defending Bootcamp: 1-2 squads remain. Hold center building roof for vertical advantage. Sniper covers all entries from watchtower. Anchor on ground floor. Sanhok's small map = fast circles; rotate to next zone before circle damage.",
        callouts: ["Center Building", "Watchtower", "North Houses", "Exit Route"],
        utility: [
          "Sniper watchtower",
          "Smoke for rotation",
          "Boost items",
          "Frag denial on stair entry",
          "Mid-range AR + Sniper",
        ],
      },
    },
  },
}

export default STRATS
