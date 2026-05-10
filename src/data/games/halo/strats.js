// Halo Infinite — v1 generated strats. Per (map, zone, side).
// `attack` = aggressing on enemy zone, `defense` = anchoring own zone.

const STRATS = {
  "aquarius": {
    "top-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Setup play on Top Mid: stack Top Mid with grenades, Slayer + Support push together, Power Weapon trades from high ground. Objective Runner stays back for the objective grab. Snipe Tower control wins the round — push with grenade-arc cover.",
        callouts: ["Top Mid", "Snipe Tower", "Sky Bridge", "Pink Ramp", "Yellow Ramp", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Top Mid push timing", from: "Top Mid", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Top Mid re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Top Mid", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Anchor Top Mid: Slayer holds the choke from cover, Power Weapon snipes the long sightline, Objective Runner protects the objective spawn, Support throws grenades on push reads. Hold Snipe Tower with Power Weapon, trade off Tower lift on the take.",
        callouts: ["Top Mid", "Snipe Tower", "Sky Bridge", "Pink Ramp", "Yellow Ramp", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Top Mid", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Top Mid — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Top Mid with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Top Mid forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
    "bottom-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Coordinated rotation on Bottom Mid: Power Weapon grenade-arcs the contested spot, Slayer pushes on the explosion, Objective Runner secures, Support cleans up. Hammer pickup is the tempo swing — clear with grenades before contesting.",
        callouts: ["Bottom Mid", "Hammer Spawn", "Tunnel", "Side Door", "Center Pillar", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Bottom Mid push timing", from: "Bottom Mid", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Bottom Mid re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Bottom Mid", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Stack Bottom Mid: 3-on-zone with Slayer + Support + Objective Runner, Power Weapon plays off-angle for the round-opener pick. Hold the timing of power-up respawns. Hammer denial with Drop Wall + grenades is the textbook bottom-mid hold.",
        callouts: ["Bottom Mid", "Hammer Spawn", "Tunnel", "Side Door", "Center Pillar", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Bottom Mid", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Bottom Mid — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Bottom Mid with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Bottom Mid forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Setup play on Red Base: stack Red Spawn with grenades, Slayer + Support push together, Power Weapon trades from high ground. Objective Runner stays back for the objective grab. Red Tunnel grenade arcs clear default anchor positions.",
        callouts: ["Red Spawn", "Red Lift", "Red Hall", "Red Window", "Red Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Red Base push timing", from: "Red Spawn", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Red Base re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Red Spawn", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Anchor Red Base: Slayer holds the choke from cover, Power Weapon snipes the long sightline, Objective Runner protects the objective spawn, Support throws grenades on push reads. Red Window + Red Lift cross-fire denies the standard tunnel push.",
        callouts: ["Red Spawn", "Red Lift", "Red Hall", "Red Window", "Red Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Red Spawn", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Red Spawn — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Red Spawn with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Red Spawn forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Power-up rotation push on Blue Base: Power Weapon snipes the contested spot, Slayer entries on the trade, Objective Runner picks up. Support holds back-line for the spawn flip read. Blue Tunnel grenade arcs clear default anchor positions.",
        callouts: ["Blue Spawn", "Blue Lift", "Blue Hall", "Blue Window", "Blue Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Blue Base push timing", from: "Blue Spawn", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Blue Base re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Blue Spawn", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Save / reset round: hold the back of Blue Base, do not commit. Slayer body-blocks the objective, Support keeps team alive. Stall for the spawn flip recovery. Blue Window + Blue Lift cross-fire denies the standard tunnel push.",
        callouts: ["Blue Spawn", "Blue Lift", "Blue Hall", "Blue Window", "Blue Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Blue Spawn", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Blue Spawn — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Blue Spawn with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Blue Spawn forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
  },
  "live-fire": {
    "top-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Coordinated rotation on Top Mid: Power Weapon grenade-arcs the contested spot, Slayer pushes on the explosion, Objective Runner secures, Support cleans up. OS pickup is the round-opener — Power Weapon traps the rotation in.",
        callouts: ["OS Spawn", "Top Bridge", "Sniper Tower", "Pink Hall", "Yellow Hall", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Top Mid push timing", from: "OS Spawn", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Top Mid re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "OS Spawn", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Stack Top Mid: 3-on-zone with Slayer + Support + Objective Runner, Power Weapon plays off-angle for the round-opener pick. Hold the timing of power-up respawns. OS denial with Sniper from Tower wins the early game.",
        callouts: ["OS Spawn", "Top Bridge", "Sniper Tower", "Pink Hall", "Yellow Hall", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "OS Spawn", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on OS Spawn — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack OS Spawn with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in OS Spawn forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
    "bottom-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Spawn-flip aggression on Bottom Mid: push hard to force a spawn flip behind the enemy team. Slayer entries, Power Weapon traps the rotation, Objective Runner controls the new spawn area. Loading Dock + Garage flank isolates back-line on the take.",
        callouts: ["Bottom Mid", "Loading Dock", "Garage", "Side Lift", "Center Pillar", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Bottom Mid push timing", from: "Bottom Mid", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Bottom Mid re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Bottom Mid", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Defensive setup on Bottom Mid: Power Weapon controls the high ground, Slayer trades from cover, Objective Runner holds the spawn area, Support cycles utility on push. Loading Dock anchor with grenades denies standard Bottom Mid push.",
        callouts: ["Bottom Mid", "Loading Dock", "Garage", "Side Lift", "Center Pillar", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Bottom Mid", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Bottom Mid — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Bottom Mid with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Bottom Mid forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Coordinated rotation on Red Base: Power Weapon grenade-arcs the contested spot, Slayer pushes on the explosion, Objective Runner secures, Support cleans up. Red Catwalk vertical pressure denies the standard hold.",
        callouts: ["Red Spawn", "Red Lift", "Red Hall", "Red Catwalk", "Red Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Red Base push timing", from: "Red Spawn", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Red Base re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Red Spawn", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Stack Red Base: 3-on-zone with Slayer + Support + Objective Runner, Power Weapon plays off-angle for the round-opener pick. Hold the timing of power-up respawns. Red Catwalk + Red Hall cross-fire wins the base hold.",
        callouts: ["Red Spawn", "Red Lift", "Red Hall", "Red Catwalk", "Red Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Red Spawn", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Red Spawn — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Red Spawn with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Red Spawn forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Spawn-flip aggression on Blue Base: push hard to force a spawn flip behind the enemy team. Slayer entries, Power Weapon traps the rotation, Objective Runner controls the new spawn area. Blue Catwalk vertical pressure denies the standard hold.",
        callouts: ["Blue Spawn", "Blue Lift", "Blue Hall", "Blue Catwalk", "Blue Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Blue Base push timing", from: "Blue Spawn", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Blue Base re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Blue Spawn", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Defensive setup on Blue Base: Power Weapon controls the high ground, Slayer trades from cover, Objective Runner holds the spawn area, Support cycles utility on push. Blue Catwalk + Blue Hall cross-fire wins the base hold.",
        callouts: ["Blue Spawn", "Blue Lift", "Blue Hall", "Blue Catwalk", "Blue Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Blue Spawn", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Blue Spawn — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Blue Spawn with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Blue Spawn forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
  },
  "recharge": {
    "top-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Aggress Top Mid: Slayer pushes the choke first, Power Weapon trades from range, Objective Runner sets up the next rotation. Support throws grenades to clear the corner anchor. Goal is gaining map control to start the power-up cycle. Sniper Spawn timing is the round — Power Weapon traps the contested timing.",
        callouts: ["Top Mid", "Sniper Spawn", "Cat Walk", "Red Ramp", "Blue Ramp", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Top Mid push timing", from: "Top Mid", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Top Mid re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Top Mid", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Off-angle hold on Top Mid: Power Weapon plays the unconventional sightline, Slayer draws aggro on main, Objective Runner protects, Support trades. Cat Walk anchor with Sniper denial wins the early game.",
        callouts: ["Top Mid", "Sniper Spawn", "Cat Walk", "Red Ramp", "Blue Ramp", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Top Mid", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Top Mid — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Top Mid with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Top Mid forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
    "bottom-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Setup play on Bottom Mid: stack Pit with grenades, Slayer + Support push together, Power Weapon trades from high ground. Objective Runner stays back for the objective grab. Pit grenade arcs clear default anchor; push with Hammer pickup.",
        callouts: ["Pit", "Power Drain", "Tunnel", "Side Lift", "Center Pillar", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Bottom Mid push timing", from: "Pit", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Bottom Mid re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Pit", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Anchor Bottom Mid: Slayer holds the choke from cover, Power Weapon snipes the long sightline, Objective Runner protects the objective spawn, Support throws grenades on push reads. Power Drain pickup denial with grenades is the standard bottom-mid hold.",
        callouts: ["Pit", "Power Drain", "Tunnel", "Side Lift", "Center Pillar", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Pit", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Pit — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Pit with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Pit forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Spawn-flip aggression on Red Base: push hard to force a spawn flip behind the enemy team. Slayer entries, Power Weapon traps the rotation, Objective Runner controls the new spawn area. Red Tunnel push with grenade cover clears the standard anchor.",
        callouts: ["Red Spawn", "Red Lift", "Red Hall", "Red Window", "Red Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Red Base push timing", from: "Red Spawn", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Red Base re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Red Spawn", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Defensive setup on Red Base: Power Weapon controls the high ground, Slayer trades from cover, Objective Runner holds the spawn area, Support cycles utility on push. Red Window + Red Lift cross-fire denies the tunnel push.",
        callouts: ["Red Spawn", "Red Lift", "Red Hall", "Red Window", "Red Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Red Spawn", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Red Spawn — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Red Spawn with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Red Spawn forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Power-up rotation push on Blue Base: Power Weapon snipes the contested spot, Slayer entries on the trade, Objective Runner picks up. Support holds back-line for the spawn flip read. Blue Tunnel push with grenade cover clears the standard anchor.",
        callouts: ["Blue Spawn", "Blue Lift", "Blue Hall", "Blue Window", "Blue Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Blue Base push timing", from: "Blue Spawn", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Blue Base re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Blue Spawn", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Save / reset round: hold the back of Blue Base, do not commit. Slayer body-blocks the objective, Support keeps team alive. Stall for the spawn flip recovery. Blue Window + Blue Lift cross-fire denies the tunnel push.",
        callouts: ["Blue Spawn", "Blue Lift", "Blue Hall", "Blue Window", "Blue Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Blue Spawn", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Blue Spawn — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Blue Spawn with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Blue Spawn forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
  },
  "streets": {
    "top-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Spawn-flip aggression on Top Mid: push hard to force a spawn flip behind the enemy team. Slayer entries, Power Weapon traps the rotation, Objective Runner controls the new spawn area. Bus Stop is the tempo swing — push with grenade-arc cover.",
        callouts: ["Bus Stop", "Top Hall", "Pink Window", "Yellow Window", "Sky Bridge", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Top Mid push timing", from: "Bus Stop", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Top Mid re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Bus Stop", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Defensive setup on Top Mid: Power Weapon controls the high ground, Slayer trades from cover, Objective Runner holds the spawn area, Support cycles utility on push. Sky Bridge cross-fire denies the standard Bus Stop push.",
        callouts: ["Bus Stop", "Top Hall", "Pink Window", "Yellow Window", "Sky Bridge", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Bus Stop", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Bus Stop — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Bus Stop with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Bus Stop forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
    "bottom-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Power-up rotation push on Bottom Mid: Power Weapon snipes the contested spot, Slayer entries on the trade, Objective Runner picks up. Support holds back-line for the spawn flip read. Hammer pickup denial with Subway entry isolates the anchor.",
        callouts: ["Subway", "Hammer Spawn", "Tunnel", "Side Door", "Center Pillar", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Bottom Mid push timing", from: "Subway", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Bottom Mid re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Subway", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Save / reset round: hold the back of Bottom Mid, do not commit. Slayer body-blocks the objective, Support keeps team alive. Stall for the spawn flip recovery. Hammer denial with grenades is the standard Subway hold.",
        callouts: ["Subway", "Hammer Spawn", "Tunnel", "Side Door", "Center Pillar", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Subway", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Subway — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Subway with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Subway forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Setup play on Red Base: stack Red Spawn with grenades, Slayer + Support push together, Power Weapon trades from high ground. Objective Runner stays back for the objective grab. Red Tunnel grenade arcs clear default anchor.",
        callouts: ["Red Spawn", "Red Lift", "Red Hall", "Red Window", "Red Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Red Base push timing", from: "Red Spawn", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Red Base re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Red Spawn", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Anchor Red Base: Slayer holds the choke from cover, Power Weapon snipes the long sightline, Objective Runner protects the objective spawn, Support throws grenades on push reads. Red Window + Red Lift cross-fire wins the base hold.",
        callouts: ["Red Spawn", "Red Lift", "Red Hall", "Red Window", "Red Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Red Spawn", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Red Spawn — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Red Spawn with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Red Spawn forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Power-up rotation push on Blue Base: Power Weapon snipes the contested spot, Slayer entries on the trade, Objective Runner picks up. Support holds back-line for the spawn flip read. Blue Tunnel grenade arcs clear default anchor.",
        callouts: ["Blue Spawn", "Blue Lift", "Blue Hall", "Blue Window", "Blue Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Blue Base push timing", from: "Blue Spawn", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Blue Base re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Blue Spawn", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Save / reset round: hold the back of Blue Base, do not commit. Slayer body-blocks the objective, Support keeps team alive. Stall for the spawn flip recovery. Blue Window + Blue Lift cross-fire wins the base hold.",
        callouts: ["Blue Spawn", "Blue Lift", "Blue Hall", "Blue Window", "Blue Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Blue Spawn", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Blue Spawn — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Blue Spawn with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Blue Spawn forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
  },
  "bazaar": {
    "top-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Setup play on Top Mid: stack Market with grenades, Slayer + Support push together, Power Weapon trades from high ground. Objective Runner stays back for the objective grab. Snipe Tower control wins the round — push with grenade cover.",
        callouts: ["Market", "Snipe Tower", "Top Bridge", "Cafe", "Yellow Hall", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Top Mid push timing", from: "Market", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Top Mid re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Market", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Anchor Top Mid: Slayer holds the choke from cover, Power Weapon snipes the long sightline, Objective Runner protects the objective spawn, Support throws grenades on push reads. Sniper Tower hold + Cafe trade is the textbook top-mid hold.",
        callouts: ["Market", "Snipe Tower", "Top Bridge", "Cafe", "Yellow Hall", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Market", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Market — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Market with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Market forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
    "bottom-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Power-up rotation push on Bottom Mid: Power Weapon snipes the contested spot, Slayer entries on the trade, Objective Runner picks up. Support holds back-line for the spawn flip read. OS pickup is the tempo swing — Power Weapon traps the rotation.",
        callouts: ["Bottom Mid", "OS Spawn", "Tunnel", "Side Lift", "Center Pillar", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Bottom Mid push timing", from: "Bottom Mid", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Bottom Mid re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Bottom Mid", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Save / reset round: hold the back of Bottom Mid, do not commit. Slayer body-blocks the objective, Support keeps team alive. Stall for the spawn flip recovery. OS denial with grenades is the standard bottom-mid hold.",
        callouts: ["Bottom Mid", "OS Spawn", "Tunnel", "Side Lift", "Center Pillar", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Bottom Mid", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Bottom Mid — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Bottom Mid with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Bottom Mid forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Power-up rotation push on Red Base: Power Weapon snipes the contested spot, Slayer entries on the trade, Objective Runner picks up. Support holds back-line for the spawn flip read. Red Tunnel push with grenade cover clears the standard anchor.",
        callouts: ["Red Spawn", "Red Lift", "Red Hall", "Red Window", "Red Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Red Base push timing", from: "Red Spawn", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Red Base re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Red Spawn", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Save / reset round: hold the back of Red Base, do not commit. Slayer body-blocks the objective, Support keeps team alive. Stall for the spawn flip recovery. Red Window cross-fire denies the standard tunnel push.",
        callouts: ["Red Spawn", "Red Lift", "Red Hall", "Red Window", "Red Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Red Spawn", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Red Spawn — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Red Spawn with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Red Spawn forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Power-up rotation push on Blue Base: Power Weapon snipes the contested spot, Slayer entries on the trade, Objective Runner picks up. Support holds back-line for the spawn flip read. Blue Tunnel push with grenade cover clears the standard anchor.",
        callouts: ["Blue Spawn", "Blue Lift", "Blue Hall", "Blue Window", "Blue Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Blue Base push timing", from: "Blue Spawn", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Blue Base re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Blue Spawn", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Save / reset round: hold the back of Blue Base, do not commit. Slayer body-blocks the objective, Support keeps team alive. Stall for the spawn flip recovery. Blue Window cross-fire denies the standard tunnel push.",
        callouts: ["Blue Spawn", "Blue Lift", "Blue Hall", "Blue Window", "Blue Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Blue Spawn", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Blue Spawn — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Blue Spawn with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Blue Spawn forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
  },
  "solitude": {
    "top-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Coordinated rotation on Top Mid: Power Weapon grenade-arcs the contested spot, Slayer pushes on the explosion, Objective Runner secures, Support cleans up. Sniper Spawn timing is the round — Power Weapon traps the contest.",
        callouts: ["Top Mid", "Sniper Spawn", "Center Bridge", "Red Ramp", "Blue Ramp", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Top Mid push timing", from: "Top Mid", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Top Mid re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Top Mid", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Stack Top Mid: 3-on-zone with Slayer + Support + Objective Runner, Power Weapon plays off-angle for the round-opener pick. Hold the timing of power-up respawns. Center Bridge anchor with Sniper denial wins the early game.",
        callouts: ["Top Mid", "Sniper Spawn", "Center Bridge", "Red Ramp", "Blue Ramp", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Top Mid", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Top Mid — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Top Mid with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Top Mid forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
    "bottom-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Power-up rotation push on Bottom Mid: Power Weapon snipes the contested spot, Slayer entries on the trade, Objective Runner picks up. Support holds back-line for the spawn flip read. Snowdrift grenade arcs clear default anchor.",
        callouts: ["Bottom Mid", "Snowdrift", "Tunnel", "Side Lift", "Center Pillar", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Bottom Mid push timing", from: "Bottom Mid", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Bottom Mid re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Bottom Mid", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Save / reset round: hold the back of Bottom Mid, do not commit. Slayer body-blocks the objective, Support keeps team alive. Stall for the spawn flip recovery. Snowdrift denial with grenades is the standard hold.",
        callouts: ["Bottom Mid", "Snowdrift", "Tunnel", "Side Lift", "Center Pillar", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Bottom Mid", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Bottom Mid — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Bottom Mid with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Bottom Mid forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Setup play on Red Base: stack Red Spawn with grenades, Slayer + Support push together, Power Weapon trades from high ground. Objective Runner stays back for the objective grab. Red Tunnel push with grenade cover clears the anchor.",
        callouts: ["Red Spawn", "Red Lift", "Red Hall", "Red Window", "Red Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Red Base push timing", from: "Red Spawn", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Red Base re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Red Spawn", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Anchor Red Base: Slayer holds the choke from cover, Power Weapon snipes the long sightline, Objective Runner protects the objective spawn, Support throws grenades on push reads. Red Window cross-fire denies the standard tunnel push.",
        callouts: ["Red Spawn", "Red Lift", "Red Hall", "Red Window", "Red Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Red Spawn", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Red Spawn — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Red Spawn with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Red Spawn forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Aggress Blue Base: Slayer pushes the choke first, Power Weapon trades from range, Objective Runner sets up the next rotation. Support throws grenades to clear the corner anchor. Goal is gaining map control to start the power-up cycle. Blue Tunnel push with grenade cover clears the anchor.",
        callouts: ["Blue Spawn", "Blue Lift", "Blue Hall", "Blue Window", "Blue Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Blue Base push timing", from: "Blue Spawn", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Blue Base re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Blue Spawn", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Off-angle hold on Blue Base: Power Weapon plays the unconventional sightline, Slayer draws aggro on main, Objective Runner protects, Support trades. Blue Window cross-fire denies the standard tunnel push.",
        callouts: ["Blue Spawn", "Blue Lift", "Blue Hall", "Blue Window", "Blue Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Blue Spawn", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Blue Spawn — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Blue Spawn with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Blue Spawn forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
  },
  "empyrean": {
    "top-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Spawn-flip aggression on Top Mid: push hard to force a spawn flip behind the enemy team. Slayer entries, Power Weapon traps the rotation, Objective Runner controls the new spawn area. Sniper Tower is the contested space — Power Weapon traps the contest.",
        callouts: ["Sniper Tower", "Sky Bridge", "Top Hall", "Forerunner", "Pink Hall", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Top Mid push timing", from: "Sniper Tower", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Top Mid re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Sniper Tower", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Defensive setup on Top Mid: Power Weapon controls the high ground, Slayer trades from cover, Objective Runner holds the spawn area, Support cycles utility on push. Sky Bridge cross-fire denies the standard Sniper Tower take.",
        callouts: ["Sniper Tower", "Sky Bridge", "Top Hall", "Forerunner", "Pink Hall", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Sniper Tower", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Sniper Tower — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Sniper Tower with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Sniper Tower forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
    "bottom-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Aggress Bottom Mid: Slayer pushes the choke first, Power Weapon trades from range, Objective Runner sets up the next rotation. Support throws grenades to clear the corner anchor. Goal is gaining map control to start the power-up cycle. OS pickup denial isolates the standard hold.",
        callouts: ["Bottom Mid", "OS Spawn", "Tunnel", "Side Lift", "Center Pillar", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Bottom Mid push timing", from: "Bottom Mid", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Bottom Mid re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Bottom Mid", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Off-angle hold on Bottom Mid: Power Weapon plays the unconventional sightline, Slayer draws aggro on main, Objective Runner protects, Support trades. OS denial with grenades is the standard bottom-mid hold.",
        callouts: ["Bottom Mid", "OS Spawn", "Tunnel", "Side Lift", "Center Pillar", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Bottom Mid", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Bottom Mid — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Bottom Mid with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Bottom Mid forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Aggress Red Base: Slayer pushes the choke first, Power Weapon trades from range, Objective Runner sets up the next rotation. Support throws grenades to clear the corner anchor. Goal is gaining map control to start the power-up cycle. Red Tunnel grenade arcs clear default anchor.",
        callouts: ["Red Spawn", "Red Lift", "Red Hall", "Red Window", "Red Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Red Base push timing", from: "Red Spawn", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Red Base re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Red Spawn", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Off-angle hold on Red Base: Power Weapon plays the unconventional sightline, Slayer draws aggro on main, Objective Runner protects, Support trades. Red Window cross-fire denies the standard tunnel push.",
        callouts: ["Red Spawn", "Red Lift", "Red Hall", "Red Window", "Red Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Red Spawn", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Red Spawn — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Red Spawn with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Red Spawn forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Snipe / Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Spawn-flip aggression on Blue Base: push hard to force a spawn flip behind the enemy team. Slayer entries, Power Weapon traps the rotation, Objective Runner controls the new spawn area. Blue Tunnel grenade arcs clear default anchor.",
        callouts: ["Blue Spawn", "Blue Lift", "Blue Hall", "Blue Window", "Blue Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, Frag grenades for entry",
          "Power Weapon: Sniper / Skewer trade from high ground",
          "Objective Runner: BR + Plasma grenade for stick + objective grab",
          "Support: Drop Wall + Repulsor for cover on push commit",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Blue Base push timing", from: "Blue Spawn", use: "Power-up + power-weapon respawn timing dictates push window — count 60-90 seconds from last pickup." },
            { spawn: "Blue Base re-engage spawn", from: "Spawn lift", use: "Group up after a wipe; do not trickle. Power Weapon respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Blue Spawn", target: "enemy power-weapon spawn timing", risk: "Medium — exposes you to off-angle counter", reward: "Power weapon control + map momentum" },
          ],
          advancedSetups: [
            "Power-up rotation: count 60s for OS, 120s for Active Camo, 90s for Sniper / Rocket. Power Weapon priority dictates the push window.",
            "Grenade arc setup: Plasma stick on the contested choke + Frag chain into the anchor — denies the standard hold.",
            "Spawn flip read: push hard to force a spawn flip behind the enemy team — Power Weapon traps the new spawn rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Anchor", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Support", priority: "recommended" },
        ],
        strategy: "Defensive setup on Blue Base: Power Weapon controls the high ground, Slayer trades from cover, Objective Runner holds the spawn area, Support cycles utility on push. Blue Window cross-fire denies the standard tunnel push.",
        callouts: ["Blue Spawn", "Blue Lift", "Blue Hall", "Blue Window", "Blue Tunnel", "Top Mid", "Bottom Mid"],
        utility: [
          "Slayer: BR + Sidekick, holds choke from cover",
          "Power Weapon: Sniper / Skewer holds long sightline",
          "Objective Runner: protects objective spawn area",
          "Support: Drop Wall + grenades for push denial",
        ],
        premiumTactics: {
          runouts: [
            { from: "Blue Spawn", target: "enemy power-up spawn approach", timing: "Power-up respawn timer — pre-position to deny the standard pickup." },
            { from: "Side lift", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy push commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard grenade arc on Blue Spawn — most pushes throw the same Plasma at the choke each round.",
            "Save the off-angle Power Weapon shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Blue Spawn with the Slayer — if the entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Power-weapon denial: time the Sniper / Rocket respawn cycle, hold off-angle on the pickup spawn — guaranteed pick.",
            "Off-angle anchor in Blue Spawn forces entry to re-clear, buys 2-3 seconds for utility setup.",
            "Spawn-flip recovery: if pushed back to base, regroup at base lift, push Power Weapon respawn cycle on the count.",
          ],
        },
      },
    },
  },
}

export default STRATS
