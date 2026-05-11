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
  "argyle": {
    "top-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Argyle Top Mid is the Sniper spawn — controlling it controls the map. Stack two BRs on the upper walkway, Plasma stick the contested top-cover, Sniper trades from the back angle. Push when the OS or Sniper respawn count hits 0.",
        callouts: ["Top Mid", "Sniper Spawn", "Sky Walkway", "Pillars", "Pink Lift", "Yellow Lift", "Sniper Roof"],
        utility: [
          "Slayer: BR + Sidekick — pre-aim Top Mid corner; Frag chain on Sniper take",
          "Power Weapon: Sniper from back base; Plasma stick on contested mid",
          "Objective Runner: Plasma + BR for objective grab; Repulsor on rotates",
          "Support: Drop Wall for the Sniper line; Frag/Plasma chain on push",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Sniper respawn push", from: "Top Mid", use: "Count 120s from last Sniper pickup — push the Top Mid window when Sniper respawns." },
            { spawn: "Sky Walkway flank", from: "Pink Lift", use: "Take Pink Lift onto Sky Walkway for the off-angle Top Mid pinch." },
          ],
          spawnKillSpots: [
            { from: "Sniper Spawn", target: "enemy spawn-flip behind base", risk: "Medium — exposes you on Sniper line", reward: "Power Weapon control = map momentum" },
          ],
          advancedSetups: [
            "Power-up cycle: OS 60s, Sniper 120s — push Top Mid on stacked spawn.",
            "Grenade chain: Plasma stick to Top Mid pillar, Frag chain into the held angle.",
            "Spawn flip: push hard to flip enemy spawn, Sniper traps the new rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Argyle Top Mid from Sky Walkway — Sniper covers the long sightline, BR pair holds the lift trade. Drop Wall on the Sniper line denies the contested take. Off-angle from Pink Lift catches the push.",
        callouts: ["Top Mid", "Sniper Spawn", "Sky Walkway", "Pillars", "Pink Lift", "Yellow Lift", "Sniper Roof"],
        utility: [
          "Slayer: BR holds Pillars + Lift trade angle",
          "Power Weapon: Sniper holds Sky Walkway long sightline",
          "Objective Runner: protects objective spawn behind base",
          "Support: Drop Wall on Sniper line; pre-grenade lift",
        ],
        premiumTactics: {
          runouts: [
            { from: "Pink Lift", target: "enemy Sniper pickup", timing: "Sniper respawn timing — deny the pickup with team grenade" },
            { from: "Sniper Roof", target: "enemy back-line", timing: "Mid-fight — flank punish on Top Mid commit" },
          ],
          antiSpawnPeek: [
            "Pre-aim Top Mid corner on the lift — every Top Mid push commits through the same angle.",
            "Drop Wall the Sniper line before contested take — denies the trade.",
          ],
          advancedSetups: [
            "Sniper denial: pre-aim respawn pickup, deny with grenade or pre-emptive BR.",
            "Off-angle anchor on Pink Lift forces push to clear, buys Sniper 2s.",
            "Spawn-flip recovery: regroup at base lift, push Sniper respawn count.",
          ],
        },
      },
    },
    "bottom-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Argyle Bottom Mid is the Skewer pickup. Lurk the pillars, Plasma stick the bottom cluster, Skewer trades the held position. Bottom Mid setup: Slayer pre-aims the lift, Support grenades on commit.",
        callouts: ["Bottom Mid", "Skewer Spawn", "Pillars", "Side Lifts", "Center Cover", "Ramp", "Hallway"],
        utility: [
          "Slayer: BR + Sidekick on close-range trades",
          "Power Weapon: Skewer trades from cover; one-shot tank/vehicle",
          "Objective Runner: BR + Plasma for objective grab",
          "Support: Drop Wall the Pillar line; Plasma stick the choke",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Skewer respawn push", from: "Bottom Mid", use: "Count 90s from last Skewer pickup — push Bottom Mid on respawn count." },
            { spawn: "Side Lift flank", from: "Ramp", use: "Take Side Lift for off-angle Bottom Mid pinch." },
          ],
          spawnKillSpots: [
            { from: "Pillars", target: "enemy pickup attempt", risk: "Medium — exposes you to BR trade", reward: "Power Weapon control + map momentum" },
          ],
          advancedSetups: [
            "Grenade chain: Plasma stick on the Pillar, Frag chain the cluster.",
            "Skewer trade: pre-aim the lift, one-shot pickup attempts.",
            "Spawn flip: push hard to flip enemy spawn, Skewer traps the new rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Argyle Bottom Mid from Hallway cover — Skewer denies the Pillar pickup, BR pair trades the lift. Drop Wall denies the standard grenade arc.",
        callouts: ["Bottom Mid", "Skewer Spawn", "Pillars", "Side Lifts", "Center Cover", "Ramp", "Hallway"],
        utility: [
          "Slayer: BR holds the lift trade angle",
          "Power Weapon: Skewer denies pickup attempts",
          "Objective Runner: protects objective spawn",
          "Support: Drop Wall the Pillar line; pre-grenade lift",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Lifts", target: "enemy Skewer pickup", timing: "Skewer respawn — deny pickup with grenade" },
            { from: "Ramp", target: "enemy back-line", timing: "Mid-fight — flank punish on Bottom Mid commit" },
          ],
          antiSpawnPeek: [
            "Pre-aim Pillar line on the lift — every Bottom Mid push commits through the same angle.",
            "Drop Wall the Skewer line before contested take.",
          ],
          advancedSetups: [
            "Skewer denial: pre-aim pickup, deny with grenade or BR trade.",
            "Off-angle anchor on Hallway forces push to clear, buys Skewer 2s.",
            "Spawn-flip recovery: regroup at base, push Skewer respawn count.",
          ],
        },
      },
    },
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag / Stronghold", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Push Red Base on Argyle: Drop Wall the base entrance, Slayer enters with BR + Plasma chain, Power Weapon trades from outside cover. Objective Runner grabs flag, exits through Side Lift on the return.",
        callouts: ["Red Base", "Top Red", "Bottom Red", "Side Lift", "Outside Cover", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR + Sidekick entry; Frag chain on flag commit",
          "Power Weapon: Sniper or Skewer trade from outside",
          "Objective Runner: Plasma stick + flag grab; Repulsor on return",
          "Support: Drop Wall entrance; Plasma chain the cluster",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Outside cover commit", from: "Side Lift", use: "Drop Wall + grenade chain on base entrance — clear before commit." },
            { spawn: "Window flank", from: "Outside Cover", use: "Top window flank for the back-line trade — surprise the standard anchor." },
          ],
          spawnKillSpots: [
            { from: "Outside Cover", target: "enemy flag-anchor position", risk: "Medium — exposes you to top window", reward: "Flag pick = round-winning play" },
          ],
          advancedSetups: [
            "Grenade chain: Plasma stick + Frag combo on base entrance — clears the standard hold.",
            "Flag-grab return: Power Weapon trades the return path, Drop Wall on exit lift.",
            "Spawn-flip: force enemy to spawn on the flag attempt, Slayer cleans up.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Red Base on Argyle: Slayer anchors flag spawn, Power Weapon covers the long entrance, Support pre-grenades the lift. Off-angle from Side Lift catches the push.",
        callouts: ["Red Base", "Top Red", "Bottom Red", "Side Lift", "Outside Cover", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR holds the entrance trade angle",
          "Power Weapon: Sniper/Skewer trade from base cover",
          "Objective Runner: protects flag spawn area",
          "Support: Drop Wall entrance; pre-grenade lift",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Lift", target: "enemy flag-runner", timing: "Mid-fight — peel for the return trade" },
            { from: "Window", target: "enemy back-line", timing: "Mid-fight — flank punish on base commit" },
          ],
          antiSpawnPeek: [
            "Pre-aim base entrance — every push commits through the same lift.",
            "Drop Wall the flag line on contested attempt.",
          ],
          advancedSetups: [
            "Pre-grenade lift: Frag the lift as enemy commits — denies the push.",
            "Off-angle anchor on Window forces push to clear, buys Power Weapon 2s.",
            "Flag-return denial: Power Weapon trades the return path, Drop Wall on exit.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag / Stronghold", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Mirror of Red — push Blue Base on Argyle: Drop Wall the entrance, Slayer commits with grenade chain, Power Weapon trades from outside. Flag grab + return through Side Lift.",
        callouts: ["Blue Base", "Top Blue", "Bottom Blue", "Side Lift", "Outside Cover", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR + Sidekick entry; Frag chain on flag commit",
          "Power Weapon: Sniper/Skewer trade from outside",
          "Objective Runner: Plasma + flag grab; Repulsor on return",
          "Support: Drop Wall entrance; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Outside cover commit", from: "Side Lift", use: "Drop Wall + grenade chain on entrance — clear before commit." },
            { spawn: "Window flank", from: "Outside Cover", use: "Top window flank for the back-line trade." },
          ],
          spawnKillSpots: [
            { from: "Outside Cover", target: "enemy flag-anchor", risk: "Medium — exposes to top window", reward: "Flag pick = round-winning play" },
          ],
          advancedSetups: [
            "Grenade chain: Plasma + Frag on base entrance.",
            "Flag-grab return: Power Weapon trades return path.",
            "Spawn-flip: force enemy to spawn on flag attempt.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Blue Base on Argyle: Slayer anchors flag spawn, Power Weapon covers entrance, Support pre-grenades the lift. Off-angle from Side Lift catches push.",
        callouts: ["Blue Base", "Top Blue", "Bottom Blue", "Side Lift", "Outside Cover", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR holds entrance trade angle",
          "Power Weapon: Sniper/Skewer trade from cover",
          "Objective Runner: protects flag spawn",
          "Support: Drop Wall entrance; pre-grenade lift",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Lift", target: "enemy flag-runner", timing: "Mid-fight — peel for return trade" },
            { from: "Window", target: "enemy back-line", timing: "Mid-fight — flank punish on base commit" },
          ],
          antiSpawnPeek: [
            "Pre-aim base entrance — every push commits through the same lift.",
            "Drop Wall flag line on contested attempt.",
          ],
          advancedSetups: [
            "Pre-grenade lift: Frag as enemy commits.",
            "Off-angle anchor on Window forces clear of trade angle.",
            "Flag-return denial: Power Weapon trades return path.",
          ],
        },
      },
    },
  },
  "behemoth": {
    "cave": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Hammer / Sword", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Behemoth Cave is the tight underground close-range zone — Gravity Hammer/Sword spawn pickup. Grenade chain the entrance, Slayer trades on hammer respawn, Support Drop Walls the cave choke.",
        callouts: ["Cave Entrance", "Hammer Spawn", "Cave Center", "Back Exit", "Side Tunnel", "Choke", "Top Cave"],
        utility: [
          "Slayer: BR + Sidekick on entrance trade",
          "Power Weapon: Gravity Hammer one-shot in close quarters",
          "Objective Runner: Plasma stick + BR for grab",
          "Support: Drop Wall the cave choke; Plasma chain entrance",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Hammer respawn push", from: "Cave Entrance", use: "Count 90s — push Cave on Hammer respawn count." },
            { spawn: "Back Exit flank", from: "Side Tunnel", use: "Back Exit catches the standard hold off-angle." },
          ],
          spawnKillSpots: [
            { from: "Top Cave", target: "enemy Hammer pickup", risk: "Medium — exposes you to grenade", reward: "Power Weapon control + map momentum" },
          ],
          advancedSetups: [
            "Grenade chain: Plasma stick at Hammer Spawn, Frag chain into cluster.",
            "Hammer one-shot: pre-aim pickup, melee kill on first contest.",
            "Spawn flip: push hard to flip enemy, Hammer traps new rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Hammer Denial", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Behemoth Cave from top — denies the Hammer pickup, BR trades from cover. Drop Wall the entrance choke.",
        callouts: ["Cave Entrance", "Hammer Spawn", "Cave Center", "Back Exit", "Side Tunnel", "Choke", "Top Cave"],
        utility: [
          "Slayer: BR holds entrance trade",
          "Power Weapon: Hammer/Sniper denies pickup",
          "Objective Runner: protects objective spawn",
          "Support: Drop Wall cave choke; pre-grenade entrance",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Tunnel", target: "enemy Hammer pickup", timing: "Hammer respawn — deny with grenade" },
            { from: "Back Exit", target: "enemy back-line", timing: "Mid-fight — flank punish on Cave commit" },
          ],
          antiSpawnPeek: [
            "Pre-aim Cave Entrance — every push commits through the same choke.",
            "Drop Wall Hammer line before contested take.",
          ],
          advancedSetups: [
            "Hammer denial: pre-aim pickup, deny with grenade.",
            "Off-angle anchor on Top Cave forces clear of vertical.",
            "Spawn-flip recovery: regroup at base, push Hammer respawn count.",
          ],
        },
      },
    },
    "top-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Behemoth Top Mid is the asymmetric high-ground take. Sniper trades from cover, Slayer pre-aims the climb, Support Drop Walls the climb path. Owns the map if held.",
        callouts: ["Top Mid", "Sniper Cover", "Climb Path", "Skewer Spawn", "Lift", "Roof", "Side Cover"],
        utility: [
          "Slayer: BR + Sidekick on climb trade",
          "Power Weapon: Sniper from cover; Skewer trades vehicles",
          "Objective Runner: Plasma + BR for objective grab",
          "Support: Drop Wall the climb path; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Top Mid take", from: "Climb Path", use: "Drop Wall the climb, Slayer commits with grenade chain." },
            { spawn: "Side flank", from: "Lift", use: "Side Cover flank catches the standard hold off-angle." },
          ],
          spawnKillSpots: [
            { from: "Roof", target: "enemy Sniper pickup", risk: "Medium — exposes to long shot", reward: "Power Weapon control + map momentum" },
          ],
          advancedSetups: [
            "Grenade chain: Plasma + Frag on climb — clears the standard hold.",
            "Sniper trade: pre-aim climb angle, trade on first contest.",
            "Spawn flip: push hard to flip enemy, Sniper traps new rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Behemoth Top Mid from Roof — Sniper covers long sightline, BR pair holds the climb trade. Drop Wall on the climb denies the contested take.",
        callouts: ["Top Mid", "Sniper Cover", "Climb Path", "Skewer Spawn", "Lift", "Roof", "Side Cover"],
        utility: [
          "Slayer: BR holds climb trade angle",
          "Power Weapon: Sniper holds long sightline from Roof",
          "Objective Runner: protects objective spawn",
          "Support: Drop Wall climb; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Lift", target: "enemy climb attempt", timing: "Setup phase — pre-position to deny climb" },
            { from: "Side Cover", target: "enemy back-line", timing: "Mid-fight — flank punish" },
          ],
          antiSpawnPeek: [
            "Pre-aim climb path — every push commits through the same arc.",
            "Drop Wall climb on contested take.",
          ],
          advancedSetups: [
            "Sniper denial: pre-aim respawn pickup.",
            "Off-angle anchor on Roof forces clear of vertical.",
            "Spawn-flip recovery: regroup at base, push Sniper respawn count.",
          ],
        },
      },
    },
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag / Stronghold", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Push Behemoth Red Base via Cave route — bottom approach is safer than top. Drop Wall entrance, Slayer commits, Power Weapon trades from outside. Flag grab + Cave return.",
        callouts: ["Red Base", "Cave Approach", "Top Red", "Outside", "Flag Spawn", "Lift", "Window"],
        utility: [
          "Slayer: BR + Sidekick entry; Frag chain on commit",
          "Power Weapon: Sniper/Skewer from outside cover",
          "Objective Runner: Plasma + flag grab; Repulsor on Cave return",
          "Support: Drop Wall entrance; Plasma chain cluster",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Cave Approach commit", from: "Cave", use: "Cave is the safer route — Drop Wall + grenade chain on entrance." },
            { spawn: "Window flank", from: "Top Red", use: "Window flank for back-line trade." },
          ],
          spawnKillSpots: [
            { from: "Outside", target: "enemy flag-anchor", risk: "Medium — exposes to Top Red", reward: "Flag pick = round-winning play" },
          ],
          advancedSetups: [
            "Grenade chain: Plasma + Frag on entrance.",
            "Flag return through Cave: Power Weapon trades the return path.",
            "Spawn-flip: force enemy spawn on flag attempt.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Behemoth Red Base: Slayer anchors flag, Power Weapon covers Cave approach, Support pre-grenades the entrance.",
        callouts: ["Red Base", "Cave Approach", "Top Red", "Outside", "Flag Spawn", "Lift", "Window"],
        utility: [
          "Slayer: BR holds entrance trade",
          "Power Weapon: Sniper/Skewer from base cover",
          "Objective Runner: protects flag spawn",
          "Support: Drop Wall entrance; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Top Red", target: "enemy flag-runner", timing: "Mid-fight — peel for return trade" },
            { from: "Lift", target: "enemy back-line", timing: "Mid-fight — flank punish" },
          ],
          antiSpawnPeek: [
            "Pre-aim Cave approach — every push commits through Cave first.",
            "Drop Wall flag line on contested attempt.",
          ],
          advancedSetups: [
            "Pre-grenade Cave entrance.",
            "Off-angle anchor on Top Red forces clear of vertical.",
            "Flag-return denial through Cave route.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag / Stronghold", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Mirror Red push — Behemoth Blue Base attack via Cave route. Drop Wall entrance, Slayer commits, Power Weapon trades from outside. Flag return through Cave.",
        callouts: ["Blue Base", "Cave Approach", "Top Blue", "Outside", "Flag Spawn", "Lift", "Window"],
        utility: [
          "Slayer: BR + Sidekick entry; Frag chain",
          "Power Weapon: Sniper/Skewer from outside",
          "Objective Runner: Plasma + flag grab; Repulsor on return",
          "Support: Drop Wall entrance; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Cave Approach commit", from: "Cave", use: "Drop Wall + grenade chain on entrance." },
            { spawn: "Window flank", from: "Top Blue", use: "Window flank for back-line trade." },
          ],
          spawnKillSpots: [
            { from: "Outside", target: "enemy flag-anchor", risk: "Medium — exposes to Top Blue", reward: "Flag pick = round-winning play" },
          ],
          advancedSetups: [
            "Grenade chain: Plasma + Frag.",
            "Flag return through Cave.",
            "Spawn-flip on flag attempt.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Behemoth Blue Base: Slayer anchors flag, Power Weapon covers Cave approach.",
        callouts: ["Blue Base", "Cave Approach", "Top Blue", "Outside", "Flag Spawn", "Lift", "Window"],
        utility: [
          "Slayer: BR holds entrance",
          "Power Weapon: Sniper/Skewer from base cover",
          "Objective Runner: protects flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Top Blue", target: "enemy flag-runner", timing: "Mid-fight — peel for return" },
            { from: "Lift", target: "enemy back-line", timing: "Mid-fight — flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Cave approach.",
            "Drop Wall flag line on contested attempt.",
          ],
          advancedSetups: [
            "Pre-grenade Cave entrance.",
            "Off-angle on Top Blue.",
            "Flag-return denial through Cave.",
          ],
        },
      },
    },
  },
  "fragmentation": {
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Vehicle Trade", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper / Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Flag / Stronghold", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Fragmentation Red Base is BTB — vehicles dominate. Push with Warthog + Ghost coverage, Skewer trades vehicles from cover, Slayer Squad clears infantry on commit. Drop Wall on the base entrance.",
        callouts: ["Red Base", "Top Red", "Vehicle Bay", "Side Approach", "Outside", "Flag Spawn", "Hill"],
        utility: [
          "Slayer Squad: BR + Sidekick infantry clear",
          "Power Weapon: Skewer trades vehicles; Sniper for long shot",
          "Objective Runner: Plasma + flag grab",
          "Support: Drop Wall entrance; pre-grenade Vehicle Bay",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Vehicle commit", from: "Hill", use: "Warthog + Ghost coordinated push — Skewer trades enemy vehicle from cover." },
            { spawn: "Side Approach flank", from: "Outside", use: "Side Approach for the off-angle infantry commit." },
          ],
          spawnKillSpots: [
            { from: "Hill", target: "enemy vehicle spawn", risk: "Medium — exposes to long sightline", reward: "Vehicle denial = map control" },
          ],
          advancedSetups: [
            "Vehicle trade priority: Skewer one-shots Warthog/Ghost — clear before infantry commit.",
            "Flag return: Warthog pickup on flag-runner, fast return route.",
            "Spawn-flip: force enemy spawn on flag attempt.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper / Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Fragmentation Red Base: Skewer denies the Warthog commit, Slayer Squad holds entrance, Support Drop Walls the entrance.",
        callouts: ["Red Base", "Top Red", "Vehicle Bay", "Side Approach", "Outside", "Flag Spawn", "Hill"],
        utility: [
          "Slayer Squad: BR holds infantry trade",
          "Power Weapon: Skewer denies enemy vehicle; Sniper long shot",
          "Objective Runner: protects flag spawn",
          "Support: Drop Wall entrance; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Approach", target: "enemy vehicle escort", timing: "Mid-fight — Skewer trades from cover" },
            { from: "Top Red", target: "enemy back-line", timing: "Mid-fight — flank punish" },
          ],
          antiSpawnPeek: [
            "Pre-aim Vehicle Bay — every push commits with vehicle escort.",
            "Drop Wall flag line on contested attempt.",
          ],
          advancedSetups: [
            "Vehicle denial: Skewer respawn timing.",
            "Off-angle on Top Red forces clear of vertical.",
            "Flag-return denial: Sniper trades return path.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Vehicle Trade", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper / Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Flag / Stronghold", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Mirror Red — Fragmentation Blue Base attack. Warthog + Ghost coordinated push, Skewer trades vehicles, Slayer Squad infantry clears.",
        callouts: ["Blue Base", "Top Blue", "Vehicle Bay", "Side Approach", "Outside", "Flag Spawn", "Hill"],
        utility: [
          "Slayer Squad: BR + Sidekick infantry",
          "Power Weapon: Skewer vehicles; Sniper long",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Vehicle commit", from: "Hill", use: "Warthog + Ghost push, Skewer trades enemy vehicle." },
            { spawn: "Side Approach flank", from: "Outside", use: "Side flank for off-angle commit." },
          ],
          spawnKillSpots: [
            { from: "Hill", target: "enemy vehicle spawn", risk: "Medium — exposes to long shot", reward: "Vehicle denial = map control" },
          ],
          advancedSetups: [
            "Vehicle trade: Skewer one-shots.",
            "Flag return: Warthog pickup on runner.",
            "Spawn-flip on flag attempt.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper / Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Fragmentation Blue Base: Skewer denies Warthog, Slayer Squad holds entrance, Drop Wall the entrance.",
        callouts: ["Blue Base", "Top Blue", "Vehicle Bay", "Side Approach", "Outside", "Flag Spawn", "Hill"],
        utility: [
          "Slayer Squad: BR holds entrance",
          "Power Weapon: Skewer denies vehicles",
          "Objective Runner: protects flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Approach", target: "enemy vehicle escort", timing: "Mid-fight — Skewer trades" },
            { from: "Top Blue", target: "enemy back-line", timing: "Mid-fight — flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Vehicle Bay.",
            "Drop Wall flag line.",
          ],
          advancedSetups: [
            "Vehicle denial via Skewer respawn.",
            "Off-angle on Top Blue.",
            "Flag-return Sniper trade.",
          ],
        },
      },
    },
    "tower": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Push", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Hill / Capture", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Fragmentation Tower is the central sniper perch. Vehicle escort to the lift, Sniper trades from base, Slayer Squad climbs for the contested take. Tower owns Sniper line + map control.",
        callouts: ["Tower Top", "Lift", "Tower Base", "Side Ramps", "Roof", "Vehicle Approach", "Open Field"],
        utility: [
          "Slayer Squad: BR + Sidekick on climb trade",
          "Power Weapon: Sniper trades from Tower",
          "Objective Runner: Plasma + capture for hill",
          "Support: Drop Wall climb; pre-grenade lift",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Lift commit", from: "Vehicle Approach", use: "Vehicle escort to lift, climb on Drop Wall cover." },
            { spawn: "Side Ramps flank", from: "Open Field", use: "Side Ramps for off-angle climb." },
          ],
          spawnKillSpots: [
            { from: "Roof", target: "enemy lift attempt", risk: "Medium — exposes to long shot", reward: "Sniper control + map momentum" },
          ],
          advancedSetups: [
            "Grenade chain: Plasma + Frag on lift — clears contested take.",
            "Sniper trade: pre-aim climb angle.",
            "Vehicle escort: Warthog covers the lift commit.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Hill Defender", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Fragmentation Tower: Sniper anchors top, Slayer Squad covers the lift trade, Support Drop Walls the lift line.",
        callouts: ["Tower Top", "Lift", "Tower Base", "Side Ramps", "Roof", "Vehicle Approach", "Open Field"],
        utility: [
          "Slayer Squad: BR holds lift trade",
          "Power Weapon: Sniper holds long sightline",
          "Objective Runner: protects hill spawn",
          "Support: Drop Wall lift; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Ramps", target: "enemy climb attempt", timing: "Setup phase — pre-position to deny climb" },
            { from: "Roof", target: "enemy back-line", timing: "Mid-fight — flank punish" },
          ],
          antiSpawnPeek: [
            "Pre-aim lift — every climb commits through the same arc.",
            "Drop Wall climb on contested take.",
          ],
          advancedSetups: [
            "Sniper denial: pre-aim respawn pickup.",
            "Off-angle anchor on Roof.",
            "Spawn-flip recovery: regroup at base.",
          ],
        },
      },
    },
    "mid": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Vehicle Push", priority: "essential" },
          { name: "Power Weapon Controller", role: "Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Capture", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Fragmentation Mid is the open field — vehicles win. Warthog + Ghost coordinated push, Skewer trades enemy vehicle, Slayer Squad infantry clears. Capture the central objective on vehicle dominance.",
        callouts: ["Mid Field", "Open Approach", "Side Cover", "Vehicle Spawn", "Capture Point", "Bridge", "Hill"],
        utility: [
          "Slayer Squad: BR + Sidekick infantry",
          "Power Weapon: Skewer vehicles; Sniper long",
          "Objective Runner: Plasma + capture",
          "Support: Drop Wall on capture; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Vehicle commit", from: "Hill", use: "Warthog + Ghost push, Skewer trades enemy vehicle." },
            { spawn: "Side Cover flank", from: "Open Approach", use: "Side Cover for off-angle infantry." },
          ],
          spawnKillSpots: [
            { from: "Hill", target: "enemy vehicle spawn", risk: "Medium — exposes to long shot", reward: "Vehicle denial = map control" },
          ],
          advancedSetups: [
            "Vehicle trade: Skewer one-shots.",
            "Capture commit: Drop Wall the capture, full team rush.",
            "Spawn-flip: force enemy on capture attempt.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Capture Defender", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Fragmentation Mid: Skewer denies enemy vehicle, Slayer Squad anchors capture, Drop Walls cover the approach.",
        callouts: ["Mid Field", "Open Approach", "Side Cover", "Vehicle Spawn", "Capture Point", "Bridge", "Hill"],
        utility: [
          "Slayer Squad: BR holds capture trade",
          "Power Weapon: Skewer denies vehicles",
          "Objective Runner: protects capture point",
          "Support: Drop Wall capture; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Cover", target: "enemy vehicle escort", timing: "Mid-fight — Skewer trades" },
            { from: "Bridge", target: "enemy back-line", timing: "Mid-fight — flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Open Approach.",
            "Drop Wall capture on contested attempt.",
          ],
          advancedSetups: [
            "Vehicle denial: Skewer respawn timing.",
            "Off-angle on Bridge.",
            "Capture denial: full team on capture, deny enemy approach.",
          ],
        },
      },
    },
    "cave": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Infantry Rush", priority: "essential" },
          { name: "Power Weapon Controller", role: "Hammer / Sword", priority: "essential" },
          { name: "Objective Runner", role: "Capture", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Fragmentation Cave is the underground close-quarters zone — no vehicles. Hammer + grenade chain, Slayer Squad rush the entrance, Power Weapon trades on cover. Cave is flank route to back base.",
        callouts: ["Cave Entrance", "Hammer Spawn", "Cave Center", "Back Exit", "Side Tunnel", "Choke", "Top Cave"],
        utility: [
          "Slayer Squad: BR + Sidekick infantry",
          "Power Weapon: Hammer one-shot close quarters",
          "Objective Runner: Plasma + capture",
          "Support: Drop Wall choke; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Hammer push", from: "Cave Entrance", use: "Drop Wall + grenade chain on choke, Hammer one-shots the held position." },
            { spawn: "Back Exit flank", from: "Side Tunnel", use: "Back Exit flanks the standard hold." },
          ],
          spawnKillSpots: [
            { from: "Top Cave", target: "enemy pickup attempt", risk: "Medium — exposes to grenade", reward: "Power Weapon + map flank" },
          ],
          advancedSetups: [
            "Grenade chain: Plasma + Frag on Hammer Spawn.",
            "Hammer one-shot: pre-aim pickup, melee kill.",
            "Cave flank: Cave is the back-base route — exit to flank.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Hammer Denial", priority: "essential" },
          { name: "Objective Runner", role: "Capture", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Fragmentation Cave from top — denies Hammer pickup, BR trades from cover. Drop Wall the choke.",
        callouts: ["Cave Entrance", "Hammer Spawn", "Cave Center", "Back Exit", "Side Tunnel", "Choke", "Top Cave"],
        utility: [
          "Slayer Squad: BR holds entrance",
          "Power Weapon: Hammer/Sniper denies pickup",
          "Objective Runner: protects capture",
          "Support: Drop Wall choke; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Tunnel", target: "enemy Hammer pickup", timing: "Hammer respawn — deny with grenade" },
            { from: "Back Exit", target: "enemy back-line", timing: "Mid-fight — flank punish" },
          ],
          antiSpawnPeek: [
            "Pre-aim Cave Entrance.",
            "Drop Wall Hammer line on contested take.",
          ],
          advancedSetups: [
            "Hammer denial: pre-aim pickup.",
            "Off-angle on Top Cave forces clear of vertical.",
            "Cave denial: control Cave to prevent back-flank.",
          ],
        },
      },
    },
  },
  "highpower": {
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Vehicle Push", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper / Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Highpower Red Base is vertical BTB — cliffside dominates. Vehicle push with Sniper coverage from Cliffside, Slayer Squad commits on Skewer trade. Drop Wall the entrance.",
        callouts: ["Red Base", "Top Red", "Vehicle Approach", "Cliffside", "Flag Spawn", "Side Lift", "Outside"],
        utility: [
          "Slayer Squad: BR + Sidekick infantry",
          "Power Weapon: Sniper from Cliffside; Skewer vehicles",
          "Objective Runner: Plasma + flag grab",
          "Support: Drop Wall entrance; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Vehicle commit", from: "Vehicle Approach", use: "Warthog push with Sniper from Cliffside cover." },
            { spawn: "Side Lift flank", from: "Outside", use: "Side Lift for off-angle infantry commit." },
          ],
          spawnKillSpots: [
            { from: "Cliffside", target: "enemy flag-anchor", risk: "Medium — exposes to long shot", reward: "Sniper control + flag pick" },
          ],
          advancedSetups: [
            "Vehicle trade: Skewer one-shots.",
            "Flag return: Warthog pickup on runner.",
            "Spawn-flip on flag attempt.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper / Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Highpower Red Base: Sniper from Cliffside denies the vehicle commit, Slayer Squad holds entrance, Drop Wall the entrance.",
        callouts: ["Red Base", "Top Red", "Vehicle Approach", "Cliffside", "Flag Spawn", "Side Lift", "Outside"],
        utility: [
          "Slayer Squad: BR holds entrance",
          "Power Weapon: Sniper from Cliffside",
          "Objective Runner: protects flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Lift", target: "enemy vehicle escort", timing: "Mid-fight — Skewer trades" },
            { from: "Top Red", target: "enemy back-line", timing: "Mid-fight — flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Vehicle Approach.",
            "Drop Wall flag line.",
          ],
          advancedSetups: [
            "Sniper denial from Cliffside.",
            "Off-angle on Top Red.",
            "Flag-return Sniper trade.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Vehicle Push", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper / Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Mirror Red — Highpower Blue Base attack via vehicle + Cliffside Sniper coverage.",
        callouts: ["Blue Base", "Top Blue", "Vehicle Approach", "Cliffside", "Flag Spawn", "Side Lift", "Outside"],
        utility: [
          "Slayer Squad: BR + Sidekick",
          "Power Weapon: Sniper Cliffside; Skewer vehicles",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Vehicle commit", from: "Vehicle Approach", use: "Warthog push with Sniper from Cliffside." },
            { spawn: "Side Lift flank", from: "Outside", use: "Off-angle infantry commit." },
          ],
          spawnKillSpots: [
            { from: "Cliffside", target: "enemy flag-anchor", risk: "Medium — exposes to long shot", reward: "Sniper + flag pick" },
          ],
          advancedSetups: [
            "Vehicle trade Skewer.",
            "Flag return via Warthog.",
            "Spawn-flip on flag.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper / Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Highpower Blue Base: Sniper from Cliffside, Slayer Squad holds entrance.",
        callouts: ["Blue Base", "Top Blue", "Vehicle Approach", "Cliffside", "Flag Spawn", "Side Lift", "Outside"],
        utility: [
          "Slayer Squad: BR holds entrance",
          "Power Weapon: Sniper Cliffside",
          "Objective Runner: protects flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Lift", target: "enemy vehicle", timing: "Mid-fight Skewer" },
            { from: "Top Blue", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Vehicle Approach.",
            "Drop Wall flag line.",
          ],
          advancedSetups: [
            "Sniper Cliffside denial.",
            "Off-angle Top Blue.",
            "Flag-return Sniper trade.",
          ],
        },
      },
    },
    "cliffside": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Push", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Capture", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Highpower Cliffside is the central Sniper perch. Vertical climb on Drop Wall cover, Sniper takes the perch, Slayer Squad clears the back-line. Owns long sightline.",
        callouts: ["Cliffside Top", "Climb Path", "Side Ramps", "Sniper Cover", "Back Approach", "Lift", "Open"],
        utility: [
          "Slayer Squad: BR + Sidekick on climb",
          "Power Weapon: Sniper from Cliffside",
          "Objective Runner: Plasma + capture",
          "Support: Drop Wall climb; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Climb commit", from: "Climb Path", use: "Drop Wall + grenade chain on climb." },
            { spawn: "Side flank", from: "Lift", use: "Side Ramps for off-angle climb." },
          ],
          spawnKillSpots: [
            { from: "Sniper Cover", target: "enemy lift attempt", risk: "Medium — exposes to long shot", reward: "Sniper control + map momentum" },
          ],
          advancedSetups: [
            "Sniper trade pre-aim climb.",
            "Vertical commit on grenade chain.",
            "Spawn-flip on Cliffside take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Capture", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Highpower Cliffside: Sniper anchors top, Slayer Squad holds climb trade, Drop Wall the climb.",
        callouts: ["Cliffside Top", "Climb Path", "Side Ramps", "Sniper Cover", "Back Approach", "Lift", "Open"],
        utility: [
          "Slayer Squad: BR holds climb",
          "Power Weapon: Sniper from Cliffside Top",
          "Objective Runner: protects capture",
          "Support: Drop Wall climb; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Ramps", target: "enemy climb", timing: "Setup phase — pre-position" },
            { from: "Back Approach", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim climb path.",
            "Drop Wall climb.",
          ],
          advancedSetups: [
            "Sniper denial respawn.",
            "Off-angle Back Approach.",
            "Spawn-flip recovery at base.",
          ],
        },
      },
    },
    "tower": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Push", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Hill / Capture", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Highpower Tower is the central vertical perch — Sniper + Skewer pickup. Climb via lift, grenade chain the top, Slayer Squad cleans up.",
        callouts: ["Tower Top", "Lift", "Side Ramps", "Tower Base", "Roof", "Sniper Cover", "Open Field"],
        utility: [
          "Slayer Squad: BR + Sidekick on climb",
          "Power Weapon: Sniper trades from Tower Top",
          "Objective Runner: Plasma + capture",
          "Support: Drop Wall lift; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Lift commit", from: "Lift", use: "Drop Wall + grenade chain on lift." },
            { spawn: "Side Ramps flank", from: "Open Field", use: "Side Ramps for off-angle climb." },
          ],
          spawnKillSpots: [
            { from: "Roof", target: "enemy lift attempt", risk: "Medium — exposes to long shot", reward: "Sniper + map control" },
          ],
          advancedSetups: [
            "Sniper trade pre-aim lift.",
            "Vertical commit on grenade chain.",
            "Spawn-flip on Tower take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Hill", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Highpower Tower: Sniper anchors top, Slayer Squad covers lift trade.",
        callouts: ["Tower Top", "Lift", "Side Ramps", "Tower Base", "Roof", "Sniper Cover", "Open Field"],
        utility: [
          "Slayer Squad: BR holds lift",
          "Power Weapon: Sniper Tower Top",
          "Objective Runner: protects hill",
          "Support: Drop Wall lift; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Ramps", target: "enemy lift attempt", timing: "Setup phase pre-position" },
            { from: "Roof", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim lift.",
            "Drop Wall lift line.",
          ],
          advancedSetups: [
            "Sniper denial respawn.",
            "Off-angle Roof.",
            "Spawn-flip recovery at base.",
          ],
        },
      },
    },
  },
  "deadlock": {
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Vehicle Push", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper / Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Deadlock Red Base is the standard BTB base hold — Wraith + Banshee can spawn. Heavy vehicle escort, Skewer trades Wraith from cover, Slayer Squad commits on vehicle clear.",
        callouts: ["Red Base", "Top Red", "Vehicle Bay", "Side Approach", "Outside", "Flag Spawn", "Hill"],
        utility: [
          "Slayer Squad: BR + Sidekick infantry",
          "Power Weapon: Skewer trades Wraith/Banshee; Sniper long",
          "Objective Runner: Plasma + flag grab",
          "Support: Drop Wall entrance; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Vehicle commit", from: "Hill", use: "Warthog + Wasp coordinated push, Skewer trades Wraith." },
            { spawn: "Side Approach flank", from: "Outside", use: "Side Approach for off-angle infantry." },
          ],
          spawnKillSpots: [
            { from: "Hill", target: "enemy vehicle spawn", risk: "Medium — exposes to long sightline", reward: "Vehicle denial = map control" },
          ],
          advancedSetups: [
            "Vehicle trade: Skewer one-shots Wraith.",
            "Flag return: Warthog pickup.",
            "Spawn-flip on flag attempt.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper / Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Deadlock Red Base: Skewer denies Warthog/Wasp commit, Slayer Squad holds entrance.",
        callouts: ["Red Base", "Top Red", "Vehicle Bay", "Side Approach", "Outside", "Flag Spawn", "Hill"],
        utility: [
          "Slayer Squad: BR holds entrance",
          "Power Weapon: Skewer denies vehicles",
          "Objective Runner: protects flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Approach", target: "enemy vehicle escort", timing: "Mid-fight Skewer trades" },
            { from: "Top Red", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Vehicle Bay.",
            "Drop Wall flag line.",
          ],
          advancedSetups: [
            "Vehicle denial Skewer respawn.",
            "Off-angle Top Red.",
            "Flag-return Sniper trade.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Vehicle Push", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper / Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Mirror Red — Deadlock Blue Base attack with vehicle + Skewer trade.",
        callouts: ["Blue Base", "Top Blue", "Vehicle Bay", "Side Approach", "Outside", "Flag Spawn", "Hill"],
        utility: [
          "Slayer Squad: BR + Sidekick",
          "Power Weapon: Skewer vehicles",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Vehicle commit", from: "Hill", use: "Warthog + Wasp push, Skewer trades." },
            { spawn: "Side Approach", from: "Outside", use: "Side flank infantry commit." },
          ],
          spawnKillSpots: [
            { from: "Hill", target: "enemy vehicle spawn", risk: "Medium — long sightline", reward: "Vehicle denial" },
          ],
          advancedSetups: [
            "Vehicle Skewer.",
            "Flag return Warthog.",
            "Spawn-flip flag attempt.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper / Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Deadlock Blue Base: Skewer denies vehicle commit.",
        callouts: ["Blue Base", "Top Blue", "Vehicle Bay", "Side Approach", "Outside", "Flag Spawn", "Hill"],
        utility: [
          "Slayer Squad: BR holds entrance",
          "Power Weapon: Skewer denies",
          "Objective Runner: protects flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Approach", target: "enemy vehicle", timing: "Mid-fight Skewer" },
            { from: "Top Blue", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Vehicle Bay.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Vehicle Skewer denial.",
            "Off-angle Top Blue.",
            "Flag-return Sniper.",
          ],
        },
      },
    },
    "tower": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Push", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Hill", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Deadlock Tower is the central Sniper perch with elevated cover. Lift climb, grenade chain top, Sniper takes the long sightline.",
        callouts: ["Tower Top", "Lift", "Side Ramps", "Tower Base", "Roof", "Sniper Cover", "Open Field"],
        utility: [
          "Slayer Squad: BR + Sidekick climb",
          "Power Weapon: Sniper Tower Top",
          "Objective Runner: Plasma + hill capture",
          "Support: Drop Wall lift; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Lift commit", from: "Lift", use: "Drop Wall + grenade chain on lift." },
            { spawn: "Side Ramps", from: "Open Field", use: "Side Ramps off-angle climb." },
          ],
          spawnKillSpots: [
            { from: "Roof", target: "enemy lift", risk: "Medium — exposes to long shot", reward: "Sniper + map control" },
          ],
          advancedSetups: [
            "Sniper pre-aim lift.",
            "Vertical commit on grenade chain.",
            "Spawn-flip Tower take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Hill Defender", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Deadlock Tower: Sniper anchors top, Slayer Squad covers lift.",
        callouts: ["Tower Top", "Lift", "Side Ramps", "Tower Base", "Roof", "Sniper Cover", "Open Field"],
        utility: [
          "Slayer Squad: BR holds lift",
          "Power Weapon: Sniper Top",
          "Objective Runner: protects hill",
          "Support: Drop Wall lift; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Ramps", target: "enemy lift", timing: "Setup phase pre-position" },
            { from: "Roof", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim lift.",
            "Drop Wall lift line.",
          ],
          advancedSetups: [
            "Sniper denial respawn.",
            "Off-angle Roof.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "mid": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Vehicle Push", priority: "essential" },
          { name: "Power Weapon Controller", role: "Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Capture", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Deadlock Mid is the open field battleground. Coordinated vehicle push, Skewer trades enemy Wraith, Slayer Squad commits on capture.",
        callouts: ["Mid Field", "Open Approach", "Side Cover", "Vehicle Spawn", "Capture Point", "Bridge", "Hill"],
        utility: [
          "Slayer Squad: BR + Sidekick",
          "Power Weapon: Skewer vehicles; Sniper long",
          "Objective Runner: Plasma + capture",
          "Support: Drop Wall capture; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Vehicle commit", from: "Hill", use: "Warthog + Wasp push, Skewer trades Wraith." },
            { spawn: "Side Cover flank", from: "Open Approach", use: "Side Cover off-angle infantry." },
          ],
          spawnKillSpots: [
            { from: "Hill", target: "enemy vehicle", risk: "Medium — long shot", reward: "Vehicle denial" },
          ],
          advancedSetups: [
            "Vehicle Skewer.",
            "Capture commit on Drop Wall.",
            "Spawn-flip on capture.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Capture Defender", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Deadlock Mid: Skewer denies enemy Wraith, Slayer Squad anchors capture.",
        callouts: ["Mid Field", "Open Approach", "Side Cover", "Vehicle Spawn", "Capture Point", "Bridge", "Hill"],
        utility: [
          "Slayer Squad: BR holds capture",
          "Power Weapon: Skewer denies vehicles",
          "Objective Runner: protects capture",
          "Support: Drop Wall capture; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Cover", target: "enemy vehicle", timing: "Mid-fight Skewer" },
            { from: "Bridge", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Open Approach.",
            "Drop Wall capture.",
          ],
          advancedSetups: [
            "Vehicle Skewer denial.",
            "Off-angle Bridge.",
            "Capture full team commit.",
          ],
        },
      },
    },
  },
  "breaker": {
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Vehicle Push", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper / Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Breaker Red Base is BTB with mining industrial layout. Vehicle push + Skewer trade, Slayer Squad commits on vehicle clear.",
        callouts: ["Red Base", "Top Red", "Vehicle Bay", "Side Approach", "Outside", "Flag Spawn", "Hill"],
        utility: [
          "Slayer Squad: BR + Sidekick infantry",
          "Power Weapon: Skewer vehicles; Sniper long",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall entrance; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Vehicle commit", from: "Hill", use: "Warthog push, Skewer trades enemy vehicle." },
            { spawn: "Side Approach flank", from: "Outside", use: "Side Approach off-angle infantry." },
          ],
          spawnKillSpots: [
            { from: "Hill", target: "enemy vehicle spawn", risk: "Medium — long shot", reward: "Vehicle denial" },
          ],
          advancedSetups: [
            "Vehicle Skewer.",
            "Flag return Warthog.",
            "Spawn-flip flag attempt.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper / Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Breaker Red Base: Skewer denies vehicle commit, Slayer Squad holds entrance.",
        callouts: ["Red Base", "Top Red", "Vehicle Bay", "Side Approach", "Outside", "Flag Spawn", "Hill"],
        utility: [
          "Slayer Squad: BR holds entrance",
          "Power Weapon: Skewer denies",
          "Objective Runner: protects flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Approach", target: "enemy vehicle", timing: "Mid-fight Skewer" },
            { from: "Top Red", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Vehicle Bay.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Vehicle Skewer denial.",
            "Off-angle Top Red.",
            "Flag-return Sniper.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Vehicle Push", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper / Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Mirror Red — Breaker Blue Base attack with vehicle + Skewer trade.",
        callouts: ["Blue Base", "Top Blue", "Vehicle Bay", "Side Approach", "Outside", "Flag Spawn", "Hill"],
        utility: [
          "Slayer Squad: BR + Sidekick",
          "Power Weapon: Skewer vehicles",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Vehicle commit", from: "Hill", use: "Warthog push, Skewer trades." },
            { spawn: "Side Approach", from: "Outside", use: "Side flank infantry." },
          ],
          spawnKillSpots: [
            { from: "Hill", target: "enemy vehicle spawn", risk: "Medium — long shot", reward: "Vehicle denial" },
          ],
          advancedSetups: [
            "Vehicle Skewer.",
            "Flag return Warthog.",
            "Spawn-flip flag attempt.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper / Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Breaker Blue Base: Skewer denies vehicle commit.",
        callouts: ["Blue Base", "Top Blue", "Vehicle Bay", "Side Approach", "Outside", "Flag Spawn", "Hill"],
        utility: [
          "Slayer Squad: BR holds entrance",
          "Power Weapon: Skewer denies",
          "Objective Runner: protects flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Approach", target: "enemy vehicle", timing: "Mid-fight Skewer" },
            { from: "Top Blue", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Vehicle Bay.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Vehicle Skewer denial.",
            "Off-angle Top Blue.",
            "Flag-return Sniper.",
          ],
        },
      },
    },
    "reactor": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Push", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Capture", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Breaker Reactor is the central capture point — industrial cover layered around the core. Drop Wall the entrance, grenade chain the cluster, Sniper trades from elevated cover.",
        callouts: ["Reactor Core", "Top Reactor", "Side Catwalks", "Lift", "Outside", "Loot Cover", "Ramp"],
        utility: [
          "Slayer Squad: BR + Sidekick on entry",
          "Power Weapon: Sniper from elevated cover",
          "Objective Runner: Plasma + capture",
          "Support: Drop Wall entrance; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Reactor commit", from: "Lift", use: "Drop Wall + grenade chain on capture." },
            { spawn: "Side Catwalks flank", from: "Outside", use: "Side flank for off-angle commit." },
          ],
          spawnKillSpots: [
            { from: "Top Reactor", target: "enemy capture defender", risk: "Medium — long shot", reward: "Capture control" },
          ],
          advancedSetups: [
            "Grenade chain Plasma + Frag on capture.",
            "Sniper trade pre-aim entry.",
            "Capture full team commit.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Capture Defender", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Breaker Reactor: Sniper from Top Reactor, Slayer Squad anchors capture.",
        callouts: ["Reactor Core", "Top Reactor", "Side Catwalks", "Lift", "Outside", "Loot Cover", "Ramp"],
        utility: [
          "Slayer Squad: BR holds entrance",
          "Power Weapon: Sniper Top Reactor",
          "Objective Runner: protects capture",
          "Support: Drop Wall capture; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Catwalks", target: "enemy capture", timing: "Mid-fight Sniper trade" },
            { from: "Ramp", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Lift.",
            "Drop Wall capture.",
          ],
          advancedSetups: [
            "Sniper denial Top Reactor.",
            "Off-angle Side Catwalks.",
            "Capture full-team defense.",
          ],
        },
      },
    },
    "quarry": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Vehicle Push", priority: "essential" },
          { name: "Power Weapon Controller", role: "Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Capture", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Breaker Quarry is the open vehicle field. Warthog push, Skewer trades vehicles, Slayer Squad commits on capture.",
        callouts: ["Quarry Floor", "Open Approach", "Side Cover", "Vehicle Spawn", "Capture Point", "Bridge", "Hill"],
        utility: [
          "Slayer Squad: BR + Sidekick",
          "Power Weapon: Skewer vehicles",
          "Objective Runner: Plasma + capture",
          "Support: Drop Wall capture; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Vehicle commit", from: "Hill", use: "Warthog push, Skewer trades." },
            { spawn: "Side Cover flank", from: "Open Approach", use: "Side flank infantry commit." },
          ],
          spawnKillSpots: [
            { from: "Hill", target: "enemy vehicle", risk: "Medium — long shot", reward: "Vehicle denial" },
          ],
          advancedSetups: [
            "Vehicle Skewer.",
            "Capture commit Drop Wall.",
            "Spawn-flip on capture.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Capture Defender", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Breaker Quarry: Skewer denies enemy Warthog.",
        callouts: ["Quarry Floor", "Open Approach", "Side Cover", "Vehicle Spawn", "Capture Point", "Bridge", "Hill"],
        utility: [
          "Slayer Squad: BR holds capture",
          "Power Weapon: Skewer denies",
          "Objective Runner: protects capture",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Cover", target: "enemy vehicle", timing: "Mid-fight Skewer" },
            { from: "Bridge", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Open Approach.",
            "Drop Wall capture.",
          ],
          advancedSetups: [
            "Vehicle Skewer denial.",
            "Off-angle Bridge.",
            "Capture full team commit.",
          ],
        },
      },
    },
  },
  "forbidden": {
    "temple": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sword / Hammer", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Forbidden Temple is asymmetric covenant interior. Sword/Hammer pickup at the altar — controlling the Temple controls the center fight.",
        callouts: ["Temple Altar", "Side Pillars", "Top Roof", "Lift", "Outside", "Inner Ring", "Side Entry"],
        utility: [
          "Slayer: BR + Sidekick on entry",
          "Power Weapon: Sword/Hammer on altar pickup",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall altar; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Altar push", from: "Side Entry", use: "Drop Wall + grenade chain on altar." },
            { spawn: "Top Roof flank", from: "Lift", use: "Top Roof for off-angle commit." },
          ],
          spawnKillSpots: [
            { from: "Side Pillars", target: "enemy altar pickup", risk: "Medium — exposes to grenade", reward: "Power Weapon control" },
          ],
          advancedSetups: [
            "Sword pickup: pre-aim altar, melee kill on contest.",
            "Grenade chain Plasma + Frag on altar.",
            "Spawn-flip on Temple take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sword Denial", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Forbidden Temple: denies altar pickup, BR pair holds entrance.",
        callouts: ["Temple Altar", "Side Pillars", "Top Roof", "Lift", "Outside", "Inner Ring", "Side Entry"],
        utility: [
          "Slayer: BR holds entrance",
          "Power Weapon: Sword denies pickup",
          "Objective Runner: protects objective",
          "Support: Drop Wall altar; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Lift", target: "enemy altar attempt", timing: "Sword respawn — deny pickup" },
            { from: "Top Roof", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim altar.",
            "Drop Wall altar line.",
          ],
          advancedSetups: [
            "Sword denial respawn.",
            "Off-angle Top Roof.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "vault": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Forbidden Vault is the deep recessed pickup zone. Drop Wall the choke, Skewer trades from cover.",
        callouts: ["Vault Floor", "Vault Top", "Side Ramps", "Lift", "Outside", "Loot Cover", "Stairs"],
        utility: [
          "Slayer: BR + Sidekick entry",
          "Power Weapon: Skewer trades from cover",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall choke; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Vault commit", from: "Lift", use: "Drop Wall + grenade chain on choke." },
            { spawn: "Side Ramps flank", from: "Stairs", use: "Side flank for off-angle commit." },
          ],
          spawnKillSpots: [
            { from: "Vault Top", target: "enemy pickup", risk: "Medium — exposes to grenade", reward: "Power Weapon control" },
          ],
          advancedSetups: [
            "Grenade chain Plasma + Frag on choke.",
            "Skewer pre-aim entry.",
            "Spawn-flip Vault take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Skewer Denial", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Forbidden Vault: Skewer denies pickup, Slayer Squad holds entrance.",
        callouts: ["Vault Floor", "Vault Top", "Side Ramps", "Lift", "Outside", "Loot Cover", "Stairs"],
        utility: [
          "Slayer: BR holds entrance",
          "Power Weapon: Skewer denies",
          "Objective Runner: protects objective",
          "Support: Drop Wall choke; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Ramps", target: "enemy pickup", timing: "Skewer respawn — deny" },
            { from: "Stairs", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim choke.",
            "Drop Wall pickup line.",
          ],
          advancedSetups: [
            "Skewer denial respawn.",
            "Off-angle Vault Top.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "spire": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Forbidden Spire is the vertical Sniper perch — owns the long sightline. Climb on Drop Wall cover, Sniper trades from top.",
        callouts: ["Spire Top", "Climb Path", "Side Ramps", "Sniper Cover", "Lift", "Back Approach", "Outside"],
        utility: [
          "Slayer: BR + Sidekick climb",
          "Power Weapon: Sniper trades from Spire Top",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall climb; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Climb commit", from: "Lift", use: "Drop Wall + grenade chain on climb." },
            { spawn: "Side flank", from: "Back Approach", use: "Side Ramps off-angle climb." },
          ],
          spawnKillSpots: [
            { from: "Sniper Cover", target: "enemy climb", risk: "Medium — long shot", reward: "Sniper control" },
          ],
          advancedSetups: [
            "Sniper pre-aim climb.",
            "Vertical commit grenade chain.",
            "Spawn-flip Spire take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Forbidden Spire: Sniper anchors top, Slayer Squad covers climb trade.",
        callouts: ["Spire Top", "Climb Path", "Side Ramps", "Sniper Cover", "Lift", "Back Approach", "Outside"],
        utility: [
          "Slayer: BR holds climb trade",
          "Power Weapon: Sniper Spire Top",
          "Objective Runner: protects objective",
          "Support: Drop Wall climb; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Ramps", target: "enemy climb", timing: "Setup phase pre-position" },
            { from: "Back Approach", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim climb path.",
            "Drop Wall climb.",
          ],
          advancedSetups: [
            "Sniper denial respawn.",
            "Off-angle Back Approach.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "top-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Forbidden Top Mid is the elevated central walkway with sightline. Sniper trades from cover, Slayer Squad pre-aims climb angle.",
        callouts: ["Top Mid", "Walkway", "Pillars", "Pink Lift", "Yellow Lift", "Sky Bridge", "Back Cover"],
        utility: [
          "Slayer: BR + Sidekick climb",
          "Power Weapon: Sniper from back cover",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall climb; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Walkway take", from: "Pink Lift", use: "Drop Wall + grenade chain on walkway." },
            { spawn: "Sky Bridge flank", from: "Yellow Lift", use: "Sky Bridge off-angle climb." },
          ],
          spawnKillSpots: [
            { from: "Back Cover", target: "enemy lift attempt", risk: "Medium — long shot", reward: "Sniper control" },
          ],
          advancedSetups: [
            "Sniper trade pre-aim lift.",
            "Vertical commit on grenade chain.",
            "Spawn-flip Top Mid take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Forbidden Top Mid: Sniper from Back Cover, Slayer Squad covers lift.",
        callouts: ["Top Mid", "Walkway", "Pillars", "Pink Lift", "Yellow Lift", "Sky Bridge", "Back Cover"],
        utility: [
          "Slayer: BR holds lift",
          "Power Weapon: Sniper Back Cover",
          "Objective Runner: protects objective",
          "Support: Drop Wall lift; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Yellow Lift", target: "enemy climb", timing: "Setup phase pre-position" },
            { from: "Sky Bridge", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim lift.",
            "Drop Wall lift line.",
          ],
          advancedSetups: [
            "Sniper denial respawn.",
            "Off-angle Sky Bridge.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
  },
  "catalyst": {
    "top-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Catalyst Top Mid is the central Sniper pickup. Stack two BRs on Top, Plasma stick the contested cover, Sniper trades from the back angle.",
        callouts: ["Top Mid", "Sniper Spawn", "Bridge", "Pillars", "Pink Lift", "Yellow Lift", "Back Ramp"],
        utility: [
          "Slayer: BR + Sidekick — pre-aim Top Mid",
          "Power Weapon: Sniper from back base",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall Sniper line; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Sniper respawn push", from: "Top Mid", use: "Count 120s — push Top Mid on Sniper respawn." },
            { spawn: "Bridge flank", from: "Pink Lift", use: "Bridge off-angle pinch." },
          ],
          spawnKillSpots: [
            { from: "Sniper Spawn", target: "enemy spawn flip", risk: "Medium — exposes Sniper line", reward: "Power Weapon control" },
          ],
          advancedSetups: [
            "Power-up cycle: OS 60s, Sniper 120s.",
            "Grenade chain: Plasma + Frag.",
            "Spawn flip: push hard to flip enemy.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Catalyst Top Mid from Bridge — Sniper long sightline, BR holds lift trade.",
        callouts: ["Top Mid", "Sniper Spawn", "Bridge", "Pillars", "Pink Lift", "Yellow Lift", "Back Ramp"],
        utility: [
          "Slayer: BR holds Pillars + lift",
          "Power Weapon: Sniper Bridge sightline",
          "Objective Runner: protects objective",
          "Support: Drop Wall Sniper; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Pink Lift", target: "enemy Sniper pickup", timing: "Sniper respawn deny" },
            { from: "Back Ramp", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Top Mid corner.",
            "Drop Wall Sniper line.",
          ],
          advancedSetups: [
            "Sniper denial respawn.",
            "Off-angle Back Ramp.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "bridge": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Hammer", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Catalyst Bridge is the central mid-tier walkway with Hammer pickup. Drop Wall the entry, Hammer one-shots on contest, Slayer cleans up.",
        callouts: ["Bridge", "Hammer Spawn", "Side Cover", "Center", "Lift", "Top Mid", "Back Ramp"],
        utility: [
          "Slayer: BR + Sidekick entry",
          "Power Weapon: Hammer one-shot",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall entry; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Bridge push", from: "Lift", use: "Drop Wall + grenade chain on Bridge entry." },
            { spawn: "Side flank", from: "Back Ramp", use: "Side Cover off-angle." },
          ],
          spawnKillSpots: [
            { from: "Top Mid", target: "enemy Hammer pickup", risk: "Medium — exposes grenade", reward: "Power Weapon control" },
          ],
          advancedSetups: [
            "Hammer one-shot: pre-aim pickup.",
            "Grenade chain Plasma + Frag.",
            "Spawn flip on Bridge take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Hammer Denial", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Catalyst Bridge from Side Cover — denies Hammer pickup, BR holds entry.",
        callouts: ["Bridge", "Hammer Spawn", "Side Cover", "Center", "Lift", "Top Mid", "Back Ramp"],
        utility: [
          "Slayer: BR holds entry",
          "Power Weapon: Hammer denies pickup",
          "Objective Runner: protects objective",
          "Support: Drop Wall entry; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Back Ramp", target: "enemy Hammer pickup", timing: "Hammer respawn deny" },
            { from: "Top Mid", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Bridge entry.",
            "Drop Wall Hammer line.",
          ],
          advancedSetups: [
            "Hammer denial respawn.",
            "Off-angle Top Mid.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Push Catalyst Red Base: Drop Wall entrance, Slayer commits, Power Weapon trades from outside.",
        callouts: ["Red Base", "Top Red", "Bottom Red", "Side Lift", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR + Sidekick entry",
          "Power Weapon: Sniper/Skewer from outside",
          "Objective Runner: Plasma + flag grab",
          "Support: Drop Wall entrance; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Outside commit", from: "Side Lift", use: "Drop Wall + grenade chain on entrance." },
            { spawn: "Window flank", from: "Outside", use: "Top window for back-line trade." },
          ],
          spawnKillSpots: [
            { from: "Outside", target: "enemy flag-anchor", risk: "Medium — top window exposes", reward: "Flag pick" },
          ],
          advancedSetups: [
            "Grenade chain Plasma + Frag.",
            "Flag-return Power Weapon trade.",
            "Spawn-flip on flag attempt.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Catalyst Red Base: Slayer anchors flag, Power Weapon covers entrance.",
        callouts: ["Red Base", "Top Red", "Bottom Red", "Side Lift", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR holds entrance",
          "Power Weapon: Sniper/Skewer from cover",
          "Objective Runner: protects flag",
          "Support: Drop Wall entrance; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Lift", target: "enemy flag-runner", timing: "Mid-fight peel" },
            { from: "Window", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim entrance.",
            "Drop Wall flag line.",
          ],
          advancedSetups: [
            "Pre-grenade lift.",
            "Off-angle Window.",
            "Flag-return denial.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Mirror Red — Catalyst Blue Base attack.",
        callouts: ["Blue Base", "Top Blue", "Bottom Blue", "Side Lift", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR + Sidekick entry",
          "Power Weapon: Sniper/Skewer outside",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Outside commit", from: "Side Lift", use: "Drop Wall + grenade chain." },
            { spawn: "Window flank", from: "Outside", use: "Top window flank." },
          ],
          spawnKillSpots: [
            { from: "Outside", target: "enemy flag-anchor", risk: "Medium — top window", reward: "Flag pick" },
          ],
          advancedSetups: [
            "Grenade chain.",
            "Flag-return Sniper.",
            "Spawn-flip on flag.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Catalyst Blue Base.",
        callouts: ["Blue Base", "Top Blue", "Bottom Blue", "Side Lift", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR holds entrance",
          "Power Weapon: Sniper/Skewer",
          "Objective Runner: protects flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Lift", target: "enemy flag-runner", timing: "Mid-fight peel" },
            { from: "Window", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim entrance.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Pre-grenade lift.",
            "Off-angle Window.",
            "Flag-return denial.",
          ],
        },
      },
    },
  },
  "oasis": {
    "top-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Oasis Top Mid is the central elevated sniper perch over the water feature. Drop Wall climb, Sniper trades from cover.",
        callouts: ["Top Mid", "Sniper Cover", "Pool", "Pillars", "Pink Lift", "Yellow Lift", "Side Cover"],
        utility: [
          "Slayer: BR + Sidekick climb",
          "Power Weapon: Sniper from cover",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall climb; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Top Mid take", from: "Pink Lift", use: "Drop Wall + grenade chain climb." },
            { spawn: "Side flank", from: "Yellow Lift", use: "Side Cover off-angle." },
          ],
          spawnKillSpots: [
            { from: "Sniper Cover", target: "enemy lift attempt", risk: "Medium — long shot", reward: "Sniper control" },
          ],
          advancedSetups: [
            "Sniper pre-aim lift.",
            "Vertical commit grenade chain.",
            "Spawn-flip Top Mid take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Oasis Top Mid: Sniper from Side Cover, Slayer Squad covers lift.",
        callouts: ["Top Mid", "Sniper Cover", "Pool", "Pillars", "Pink Lift", "Yellow Lift", "Side Cover"],
        utility: [
          "Slayer: BR holds lift",
          "Power Weapon: Sniper Side Cover",
          "Objective Runner: protects objective",
          "Support: Drop Wall lift; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Yellow Lift", target: "enemy climb", timing: "Setup phase pre-position" },
            { from: "Side Cover", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim lift.",
            "Drop Wall lift line.",
          ],
          advancedSetups: [
            "Sniper denial respawn.",
            "Off-angle Side Cover.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "bottom-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Hammer / Sword", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Oasis Bottom Mid is the water-feature close-range zone. Hammer/Sword pickup at center, grenade chain, Slayer commits.",
        callouts: ["Bottom Mid", "Hammer Spawn", "Pool", "Side Ramps", "Center Cover", "Top Mid", "Back Cubby"],
        utility: [
          "Slayer: BR + Sidekick close-range",
          "Power Weapon: Hammer one-shot",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall choke; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Hammer push", from: "Side Ramps", use: "Drop Wall + grenade chain on Hammer Spawn." },
            { spawn: "Back Cubby flank", from: "Top Mid", use: "Back Cubby off-angle." },
          ],
          spawnKillSpots: [
            { from: "Top Mid", target: "enemy pickup", risk: "Medium — exposes grenade", reward: "Power Weapon control" },
          ],
          advancedSetups: [
            "Hammer one-shot pre-aim pickup.",
            "Grenade chain Plasma + Frag.",
            "Spawn flip on Bottom Mid take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Hammer Denial", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Oasis Bottom Mid: denies Hammer pickup, BR holds entry.",
        callouts: ["Bottom Mid", "Hammer Spawn", "Pool", "Side Ramps", "Center Cover", "Top Mid", "Back Cubby"],
        utility: [
          "Slayer: BR holds entry",
          "Power Weapon: Hammer denies pickup",
          "Objective Runner: protects objective",
          "Support: Drop Wall choke; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Ramps", target: "enemy Hammer pickup", timing: "Hammer respawn deny" },
            { from: "Back Cubby", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Bottom Mid entry.",
            "Drop Wall Hammer line.",
          ],
          advancedSetups: [
            "Hammer denial respawn.",
            "Off-angle Top Mid.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Push Oasis Red Base: Drop Wall entrance, Slayer commits, Power Weapon trades.",
        callouts: ["Red Base", "Top Red", "Bottom Red", "Side Lift", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR + Sidekick entry",
          "Power Weapon: Sniper/Skewer outside",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Outside commit", from: "Side Lift", use: "Drop Wall + grenade chain." },
            { spawn: "Window flank", from: "Outside", use: "Top window flank." },
          ],
          spawnKillSpots: [
            { from: "Outside", target: "enemy flag-anchor", risk: "Medium — top window", reward: "Flag pick" },
          ],
          advancedSetups: [
            "Grenade chain.",
            "Flag-return Sniper trade.",
            "Spawn-flip on flag.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Oasis Red Base.",
        callouts: ["Red Base", "Top Red", "Bottom Red", "Side Lift", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR holds entrance",
          "Power Weapon: Sniper/Skewer cover",
          "Objective Runner: protects flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Lift", target: "enemy flag-runner", timing: "Mid-fight peel" },
            { from: "Window", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim entrance.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Pre-grenade lift.",
            "Off-angle Window.",
            "Flag-return denial.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Mirror Red — Oasis Blue Base attack.",
        callouts: ["Blue Base", "Top Blue", "Bottom Blue", "Side Lift", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR + Sidekick entry",
          "Power Weapon: Sniper/Skewer outside",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Outside commit", from: "Side Lift", use: "Drop Wall + grenade chain." },
            { spawn: "Window flank", from: "Outside", use: "Top window flank." },
          ],
          spawnKillSpots: [
            { from: "Outside", target: "enemy flag-anchor", risk: "Medium — top window", reward: "Flag pick" },
          ],
          advancedSetups: [
            "Grenade chain.",
            "Flag-return Sniper trade.",
            "Spawn-flip on flag.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Oasis Blue Base.",
        callouts: ["Blue Base", "Top Blue", "Bottom Blue", "Side Lift", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR holds entrance",
          "Power Weapon: Sniper/Skewer cover",
          "Objective Runner: protects flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Lift", target: "enemy flag-runner", timing: "Mid-fight peel" },
            { from: "Window", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim entrance.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Pre-grenade lift.",
            "Off-angle Window.",
            "Flag-return denial.",
          ],
        },
      },
    },
  },
  "launch-site": {
    "top-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Rocket Launcher", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Launch Site Top Mid is the Rocket Launcher pickup zone. Drop Wall climb, Rocket trades on cluster, Slayer cleans up. Owns the map.",
        callouts: ["Top Mid", "Rocket Spawn", "Launch Pad", "Pillars", "Side Lift", "Back Ramp", "Sky Walkway"],
        utility: [
          "Slayer: BR + Sidekick climb",
          "Power Weapon: Rocket Launcher on cluster",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall climb; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Rocket respawn push", from: "Side Lift", use: "Count 120s — push Top Mid on Rocket respawn." },
            { spawn: "Sky Walkway flank", from: "Back Ramp", use: "Sky Walkway off-angle pinch." },
          ],
          spawnKillSpots: [
            { from: "Launch Pad", target: "enemy pickup attempt", risk: "Medium — exposes grenade", reward: "Power Weapon control + cluster kill" },
          ],
          advancedSetups: [
            "Rocket cluster: pre-aim pickup, trade on first contest.",
            "Grenade chain Plasma + Frag on pickup.",
            "Spawn-flip on Top Mid take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Rocket Denial", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Launch Site Top Mid: Rocket denies enemy pickup, Slayer Squad covers lift.",
        callouts: ["Top Mid", "Rocket Spawn", "Launch Pad", "Pillars", "Side Lift", "Back Ramp", "Sky Walkway"],
        utility: [
          "Slayer: BR holds lift",
          "Power Weapon: Rocket denies pickup",
          "Objective Runner: protects objective",
          "Support: Drop Wall lift; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Lift", target: "enemy Rocket pickup", timing: "Rocket respawn deny" },
            { from: "Sky Walkway", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim lift.",
            "Drop Wall Rocket line.",
          ],
          advancedSetups: [
            "Rocket denial respawn.",
            "Off-angle Sky Walkway.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "bottom-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sword", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Launch Site Bottom Mid is the close-range Sword pickup. Drop Wall choke, Sword one-shot, Slayer cleans up.",
        callouts: ["Bottom Mid", "Sword Spawn", "Side Cover", "Center", "Lift", "Top Mid", "Back Cubby"],
        utility: [
          "Slayer: BR + Sidekick entry",
          "Power Weapon: Sword one-shot",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall choke; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Sword push", from: "Lift", use: "Drop Wall + grenade chain on Sword Spawn." },
            { spawn: "Back Cubby flank", from: "Top Mid", use: "Back Cubby off-angle." },
          ],
          spawnKillSpots: [
            { from: "Top Mid", target: "enemy Sword pickup", risk: "Medium — grenade exposed", reward: "Power Weapon control" },
          ],
          advancedSetups: [
            "Sword one-shot pre-aim pickup.",
            "Grenade chain Plasma + Frag.",
            "Spawn-flip Bottom Mid take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sword Denial", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Launch Site Bottom Mid: denies Sword pickup, BR holds entry.",
        callouts: ["Bottom Mid", "Sword Spawn", "Side Cover", "Center", "Lift", "Top Mid", "Back Cubby"],
        utility: [
          "Slayer: BR holds entry",
          "Power Weapon: Sword denies pickup",
          "Objective Runner: protects objective",
          "Support: Drop Wall choke; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Lift", target: "enemy Sword pickup", timing: "Sword respawn deny" },
            { from: "Back Cubby", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Bottom Mid entry.",
            "Drop Wall Sword line.",
          ],
          advancedSetups: [
            "Sword denial respawn.",
            "Off-angle Top Mid.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Push Launch Site Red Base: Drop Wall entrance, Slayer commits, Power Weapon trades.",
        callouts: ["Red Base", "Top Red", "Bottom Red", "Side Lift", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR + Sidekick entry",
          "Power Weapon: Sniper/Skewer outside",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Outside commit", from: "Side Lift", use: "Drop Wall + grenade chain." },
            { spawn: "Window flank", from: "Outside", use: "Top window flank." },
          ],
          spawnKillSpots: [
            { from: "Outside", target: "enemy flag-anchor", risk: "Medium — top window", reward: "Flag pick" },
          ],
          advancedSetups: [
            "Grenade chain.",
            "Flag-return Sniper.",
            "Spawn-flip on flag.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Launch Site Red Base.",
        callouts: ["Red Base", "Top Red", "Bottom Red", "Side Lift", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR holds entrance",
          "Power Weapon: Sniper/Skewer",
          "Objective Runner: protects flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Lift", target: "enemy flag-runner", timing: "Mid-fight peel" },
            { from: "Window", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim entrance.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Pre-grenade lift.",
            "Off-angle Window.",
            "Flag-return denial.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Mirror Red — Launch Site Blue Base attack.",
        callouts: ["Blue Base", "Top Blue", "Bottom Blue", "Side Lift", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR + Sidekick",
          "Power Weapon: Sniper/Skewer outside",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Outside commit", from: "Side Lift", use: "Drop Wall + grenade chain." },
            { spawn: "Window flank", from: "Outside", use: "Top window flank." },
          ],
          spawnKillSpots: [
            { from: "Outside", target: "enemy flag-anchor", risk: "Medium — top window", reward: "Flag pick" },
          ],
          advancedSetups: [
            "Grenade chain.",
            "Flag-return Sniper.",
            "Spawn-flip on flag.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Launch Site Blue Base.",
        callouts: ["Blue Base", "Top Blue", "Bottom Blue", "Side Lift", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR holds entrance",
          "Power Weapon: Sniper/Skewer",
          "Objective Runner: protects flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Lift", target: "enemy flag-runner", timing: "Mid-fight peel" },
            { from: "Window", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim entrance.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Pre-grenade lift.",
            "Off-angle Window.",
            "Flag-return denial.",
          ],
        },
      },
    },
  },
  "origin": {
    "top-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Origin Top Mid is the forerunner sniper perch. Drop Wall climb, Sniper trades from cover.",
        callouts: ["Top Mid", "Sniper Cover", "Atrium View", "Pillars", "Pink Lift", "Yellow Lift", "Sky Bridge"],
        utility: [
          "Slayer: BR + Sidekick climb",
          "Power Weapon: Sniper from cover",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall climb; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Top Mid take", from: "Pink Lift", use: "Drop Wall + grenade chain climb." },
            { spawn: "Sky Bridge flank", from: "Yellow Lift", use: "Sky Bridge off-angle pinch." },
          ],
          spawnKillSpots: [
            { from: "Sniper Cover", target: "enemy lift", risk: "Medium — long shot", reward: "Sniper control" },
          ],
          advancedSetups: [
            "Sniper pre-aim lift.",
            "Vertical commit grenade chain.",
            "Spawn-flip Top Mid take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Origin Top Mid: Sniper from Sniper Cover, BR holds lift.",
        callouts: ["Top Mid", "Sniper Cover", "Atrium View", "Pillars", "Pink Lift", "Yellow Lift", "Sky Bridge"],
        utility: [
          "Slayer: BR holds lift",
          "Power Weapon: Sniper Cover",
          "Objective Runner: protects objective",
          "Support: Drop Wall lift; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Yellow Lift", target: "enemy climb", timing: "Setup pre-position" },
            { from: "Sky Bridge", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim lift.",
            "Drop Wall lift line.",
          ],
          advancedSetups: [
            "Sniper denial respawn.",
            "Off-angle Sky Bridge.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "atrium": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Hammer", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Origin Atrium is the central forerunner chamber. Hammer pickup, grenade chain choke, Slayer cleans up.",
        callouts: ["Atrium Floor", "Hammer Spawn", "Side Pillars", "Top Atrium", "Lift", "Sky Bridge", "Back Hall"],
        utility: [
          "Slayer: BR + Sidekick close-range",
          "Power Weapon: Hammer one-shot",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall choke; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Atrium push", from: "Lift", use: "Drop Wall + grenade chain on Hammer Spawn." },
            { spawn: "Sky Bridge flank", from: "Top Atrium", use: "Sky Bridge off-angle." },
          ],
          spawnKillSpots: [
            { from: "Top Atrium", target: "enemy pickup", risk: "Medium — grenade exposed", reward: "Power Weapon control" },
          ],
          advancedSetups: [
            "Hammer one-shot pre-aim pickup.",
            "Grenade chain Plasma + Frag.",
            "Spawn-flip Atrium take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Hammer Denial", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Origin Atrium from Top: denies Hammer pickup.",
        callouts: ["Atrium Floor", "Hammer Spawn", "Side Pillars", "Top Atrium", "Lift", "Sky Bridge", "Back Hall"],
        utility: [
          "Slayer: BR holds entry",
          "Power Weapon: Hammer denies pickup",
          "Objective Runner: protects objective",
          "Support: Drop Wall choke; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Sky Bridge", target: "enemy Hammer pickup", timing: "Hammer respawn deny" },
            { from: "Back Hall", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Atrium entry.",
            "Drop Wall Hammer line.",
          ],
          advancedSetups: [
            "Hammer denial respawn.",
            "Off-angle Top Atrium.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Push Origin Red Base: Drop Wall entrance, Slayer commits.",
        callouts: ["Red Base", "Top Red", "Bottom Red", "Side Lift", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR + Sidekick entry",
          "Power Weapon: Sniper/Skewer outside",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Outside commit", from: "Side Lift", use: "Drop Wall + grenade chain." },
            { spawn: "Window flank", from: "Outside", use: "Top window flank." },
          ],
          spawnKillSpots: [
            { from: "Outside", target: "enemy flag-anchor", risk: "Medium — top window", reward: "Flag pick" },
          ],
          advancedSetups: [
            "Grenade chain.",
            "Flag-return Sniper.",
            "Spawn-flip on flag.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Origin Red Base.",
        callouts: ["Red Base", "Top Red", "Bottom Red", "Side Lift", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR holds entrance",
          "Power Weapon: Sniper/Skewer",
          "Objective Runner: protects flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Lift", target: "enemy flag-runner", timing: "Mid-fight peel" },
            { from: "Window", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim entrance.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Pre-grenade lift.",
            "Off-angle Window.",
            "Flag-return denial.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Mirror Red — Origin Blue Base attack.",
        callouts: ["Blue Base", "Top Blue", "Bottom Blue", "Side Lift", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR + Sidekick",
          "Power Weapon: Sniper/Skewer",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Outside commit", from: "Side Lift", use: "Drop Wall + grenade chain." },
            { spawn: "Window flank", from: "Outside", use: "Top window flank." },
          ],
          spawnKillSpots: [
            { from: "Outside", target: "enemy flag-anchor", risk: "Medium — top window", reward: "Flag pick" },
          ],
          advancedSetups: [
            "Grenade chain.",
            "Flag-return Sniper.",
            "Spawn-flip on flag.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Origin Blue Base.",
        callouts: ["Blue Base", "Top Blue", "Bottom Blue", "Side Lift", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR holds entrance",
          "Power Weapon: Sniper/Skewer",
          "Objective Runner: protects flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Lift", target: "enemy flag-runner", timing: "Mid-fight peel" },
            { from: "Window", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim entrance.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Pre-grenade lift.",
            "Off-angle Window.",
            "Flag-return denial.",
          ],
        },
      },
    },
  },
  "banished": {
    "banished-camp": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Vehicle Push", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper / Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Flag / Stronghold", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Banished Camp is the brute-side BTB base — fortified covenant defenses. Vehicle push + Skewer trade Wraith, Slayer Squad infantry clears.",
        callouts: ["Banished Camp", "Top Camp", "Vehicle Bay", "Side Approach", "Outside", "Flag Spawn", "Hill"],
        utility: [
          "Slayer Squad: BR + Sidekick infantry",
          "Power Weapon: Skewer Wraith; Sniper long",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall entrance; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Vehicle commit", from: "Hill", use: "Warthog + Wasp push, Skewer trades Wraith." },
            { spawn: "Side Approach flank", from: "Outside", use: "Side Approach off-angle infantry." },
          ],
          spawnKillSpots: [
            { from: "Hill", target: "enemy vehicle", risk: "Medium — long shot", reward: "Vehicle denial" },
          ],
          advancedSetups: [
            "Vehicle Skewer.",
            "Flag return Warthog.",
            "Spawn-flip on flag.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper / Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Banished Camp: Skewer denies enemy Warthog, Slayer Squad anchors entrance.",
        callouts: ["Banished Camp", "Top Camp", "Vehicle Bay", "Side Approach", "Outside", "Flag Spawn", "Hill"],
        utility: [
          "Slayer Squad: BR holds entrance",
          "Power Weapon: Skewer denies",
          "Objective Runner: protects flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Approach", target: "enemy vehicle", timing: "Mid-fight Skewer" },
            { from: "Top Camp", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Vehicle Bay.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Vehicle Skewer denial.",
            "Off-angle Top Camp.",
            "Flag-return Sniper.",
          ],
        },
      },
    },
    "unsc-camp": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Vehicle Push", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper / Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Flag / Stronghold", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Banished UNSC Camp is the marines-side BTB base. Mirror Banished Camp push pattern.",
        callouts: ["UNSC Camp", "Top Camp", "Vehicle Bay", "Side Approach", "Outside", "Flag Spawn", "Hill"],
        utility: [
          "Slayer Squad: BR + Sidekick",
          "Power Weapon: Skewer; Sniper long",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Vehicle commit", from: "Hill", use: "Warthog push, Skewer trades vehicle." },
            { spawn: "Side Approach flank", from: "Outside", use: "Side off-angle infantry." },
          ],
          spawnKillSpots: [
            { from: "Hill", target: "enemy vehicle", risk: "Medium — long shot", reward: "Vehicle denial" },
          ],
          advancedSetups: [
            "Vehicle Skewer.",
            "Flag return Warthog.",
            "Spawn-flip on flag.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper / Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Banished UNSC Camp: Skewer denies, Slayer Squad holds entrance.",
        callouts: ["UNSC Camp", "Top Camp", "Vehicle Bay", "Side Approach", "Outside", "Flag Spawn", "Hill"],
        utility: [
          "Slayer Squad: BR holds entrance",
          "Power Weapon: Skewer denies",
          "Objective Runner: protects flag",
          "Support: Drop Wall; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Approach", target: "enemy vehicle", timing: "Mid-fight Skewer" },
            { from: "Top Camp", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Vehicle Bay.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Vehicle Skewer denial.",
            "Off-angle Top Camp.",
            "Flag-return Sniper.",
          ],
        },
      },
    },
    "tower": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Push", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Hill", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Banished Tower is the central Sniper perch with vertical layering.",
        callouts: ["Tower Top", "Lift", "Side Ramps", "Tower Base", "Roof", "Sniper Cover", "Open Field"],
        utility: [
          "Slayer Squad: BR + Sidekick climb",
          "Power Weapon: Sniper Tower Top",
          "Objective Runner: Plasma + hill capture",
          "Support: Drop Wall lift; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Lift commit", from: "Lift", use: "Drop Wall + grenade chain on lift." },
            { spawn: "Side Ramps", from: "Open Field", use: "Off-angle climb." },
          ],
          spawnKillSpots: [
            { from: "Roof", target: "enemy lift", risk: "Medium — long shot", reward: "Sniper control" },
          ],
          advancedSetups: [
            "Sniper pre-aim lift.",
            "Vertical commit grenade chain.",
            "Spawn-flip Tower take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Hill", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Banished Tower: Sniper anchors top.",
        callouts: ["Tower Top", "Lift", "Side Ramps", "Tower Base", "Roof", "Sniper Cover", "Open Field"],
        utility: [
          "Slayer Squad: BR holds lift",
          "Power Weapon: Sniper Top",
          "Objective Runner: protects hill",
          "Support: Drop Wall lift; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Ramps", target: "enemy lift", timing: "Setup pre-position" },
            { from: "Roof", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim lift.",
            "Drop Wall lift line.",
          ],
          advancedSetups: [
            "Sniper denial respawn.",
            "Off-angle Roof.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "hill": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Vehicle Push", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Hill Capture", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Banished Hill is the central elevated capture zone. Vehicle escort to the climb, Sniper trades from cover, Slayer Squad commits on capture.",
        callouts: ["Hill Top", "Climb Path", "Side Approach", "Sniper Cover", "Vehicle Spawn", "Open Field", "Back Ramp"],
        utility: [
          "Slayer Squad: BR + Sidekick climb",
          "Power Weapon: Sniper from Hill Top",
          "Objective Runner: Plasma + capture",
          "Support: Drop Wall climb; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Hill climb commit", from: "Climb Path", use: "Drop Wall + grenade chain climb." },
            { spawn: "Side flank", from: "Back Ramp", use: "Side Approach off-angle climb." },
          ],
          spawnKillSpots: [
            { from: "Sniper Cover", target: "enemy climb", risk: "Medium — long shot", reward: "Capture control + Sniper" },
          ],
          advancedSetups: [
            "Sniper pre-aim climb.",
            "Capture commit Drop Wall.",
            "Vehicle escort on commit.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Hill Defender", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Banished Hill: Sniper anchors top, Slayer Squad holds climb.",
        callouts: ["Hill Top", "Climb Path", "Side Approach", "Sniper Cover", "Vehicle Spawn", "Open Field", "Back Ramp"],
        utility: [
          "Slayer Squad: BR holds climb",
          "Power Weapon: Sniper Hill Top",
          "Objective Runner: protects capture",
          "Support: Drop Wall climb; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Approach", target: "enemy climb", timing: "Setup pre-position" },
            { from: "Back Ramp", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim climb path.",
            "Drop Wall climb.",
          ],
          advancedSetups: [
            "Sniper denial respawn.",
            "Off-angle Back Ramp.",
            "Capture full-team defense.",
          ],
        },
      },
    },
  },
  "high-ground": {
    "unsc-camp": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Vehicle Push", priority: "essential" },
          { name: "Power Weapon Controller", role: "Gravity Hammer", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "High Ground UNSC Camp is the iconic Halo 3 fortified base — front gate + side beach approach. Gravity Hammer spawns inside the base, sniper rifle at the cliff. Push the beach with Warthog cover, force the gate open.",
        callouts: ["UNSC Camp", "Gate", "Beach", "Cliff", "Inside", "Gravity Hammer", "Back Hill"],
        utility: [
          "Slayer Squad: BR + Sidekick infantry on beach",
          "Power Weapon: Gravity Hammer inside; Sniper from cliff",
          "Objective Runner: Plasma + flag grab",
          "Support: Drop Wall gate; Frag chain inside",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Beach push", from: "Back Hill", use: "Warthog covers Beach approach, full team commits with grenade chain." },
            { spawn: "Cliff flank", from: "Side Approach", use: "Cliff sniper pickup denies the gate hold." },
          ],
          spawnKillSpots: [
            { from: "Cliff", target: "enemy gate defender", risk: "Medium — long shot exposed", reward: "Flag grab + map control" },
          ],
          advancedSetups: [
            "Beach + Cliff combo: Warthog covers Beach, Sniper from Cliff denies the gate defense.",
            "Gate breach: grenade chain Plasma + Frag on the gate as it opens.",
            "Flag return: Warthog pickup outside, fast escape via Beach.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper / Hammer", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Iconic H3 hold — close the gate, anchor inside with Gravity Hammer, Sniper from Cliff covers Beach. Forces enemy to commit Beach without cover.",
        callouts: ["UNSC Camp", "Gate", "Beach", "Cliff", "Inside", "Gravity Hammer", "Back Hill"],
        utility: [
          "Slayer Squad: BR holds gate trade",
          "Power Weapon: Sniper Cliff + Hammer inside",
          "Objective Runner: protects flag",
          "Support: Drop Wall gate; pre-grenade Beach",
        ],
        premiumTactics: {
          runouts: [
            { from: "Cliff", target: "enemy Beach commit", timing: "Setup phase — Sniper denies Beach push" },
            { from: "Back Hill", target: "enemy vehicle escort", timing: "Mid-fight — Skewer trade" },
          ],
          antiSpawnPeek: [
            "Sniper pre-aim Beach — every push commits up the same lane.",
            "Hammer inside the gate — pre-aim the breach.",
          ],
          advancedSetups: [
            "Gate breach denial: Hammer + grenade on gate open — instant wipe on first contestant.",
            "Sniper Cliff denial: pre-aim the standard Beach push.",
            "Flag-return denial: Warthog pickup at Beach exit.",
          ],
        },
      },
    },
    "cliff": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Push", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Capture", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "High Ground Cliff is the sniper perch overlooking Beach. Climb on Drop Wall cover, Sniper trades from cliff edge, denies UNSC Camp gate defenders.",
        callouts: ["Cliff", "Sniper Spawn", "Beach View", "Climb Path", "Side Trail", "Roof", "Back Cover"],
        utility: [
          "Slayer Squad: BR + Sidekick climb",
          "Power Weapon: Sniper Rifle on Cliff",
          "Objective Runner: Plasma + capture",
          "Support: Drop Wall climb; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Sniper respawn push", from: "Climb Path", use: "Count 120s — push Cliff on Sniper respawn." },
            { spawn: "Side Trail flank", from: "Back Cover", use: "Side Trail off-angle climb." },
          ],
          spawnKillSpots: [
            { from: "Roof", target: "enemy Sniper pickup", risk: "Medium — exposed to BR trade", reward: "Sniper control + map momentum" },
          ],
          advancedSetups: [
            "Sniper trade: pre-aim Beach + Sniper Spawn.",
            "Vertical commit on grenade chain.",
            "Spawn-flip Cliff take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Capture", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold High Ground Cliff: Sniper anchors top, BR pair holds climb.",
        callouts: ["Cliff", "Sniper Spawn", "Beach View", "Climb Path", "Side Trail", "Roof", "Back Cover"],
        utility: [
          "Slayer Squad: BR holds climb",
          "Power Weapon: Sniper Cliff",
          "Objective Runner: protects capture",
          "Support: Drop Wall climb; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Trail", target: "enemy climb", timing: "Setup pre-position" },
            { from: "Back Cover", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim climb path.",
            "Drop Wall Sniper line.",
          ],
          advancedSetups: [
            "Sniper denial respawn.",
            "Off-angle Back Cover.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "mid": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Push", priority: "essential" },
          { name: "Power Weapon Controller", role: "Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Capture", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "High Ground Mid is the open beach approach connecting both bases. Vehicle push + Skewer trade, Slayer Squad infantry pinches.",
        callouts: ["Mid Field", "Beach", "Open Approach", "Side Cover", "Vehicle Spawn", "Capture Point", "Hill"],
        utility: [
          "Slayer Squad: BR + Sidekick",
          "Power Weapon: Skewer vehicles; Sniper long",
          "Objective Runner: Plasma + capture",
          "Support: Drop Wall capture; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Vehicle commit", from: "Hill", use: "Warthog push, Skewer trades vehicle." },
            { spawn: "Side Cover flank", from: "Open Approach", use: "Side off-angle infantry." },
          ],
          spawnKillSpots: [
            { from: "Hill", target: "enemy vehicle", risk: "Medium — long shot", reward: "Vehicle denial" },
          ],
          advancedSetups: [
            "Vehicle Skewer.",
            "Capture commit Drop Wall.",
            "Spawn-flip on capture.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Capture Defender", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold High Ground Mid: Skewer denies enemy Warthog.",
        callouts: ["Mid Field", "Beach", "Open Approach", "Side Cover", "Vehicle Spawn", "Capture Point", "Hill"],
        utility: [
          "Slayer Squad: BR holds capture",
          "Power Weapon: Skewer denies",
          "Objective Runner: protects capture",
          "Support: Drop Wall capture; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Cover", target: "enemy vehicle", timing: "Mid-fight Skewer" },
            { from: "Hill", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Open Approach.",
            "Drop Wall capture.",
          ],
          advancedSetups: [
            "Vehicle Skewer denial.",
            "Off-angle Hill.",
            "Capture full-team defense.",
          ],
        },
      },
    },
    "tunnels": {
      attack: {
        operators: [
          { name: "Slayer Squad", role: "Infantry Rush", priority: "essential" },
          { name: "Power Weapon Controller", role: "Shotgun / Hammer", priority: "essential" },
          { name: "Objective Runner", role: "Flag Flank", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "High Ground Tunnels are the iconic H3 back-flank route into UNSC Camp. Shotgun/Hammer pickup in tunnels, grenade chain the choke, flank into base from below.",
        callouts: ["Tunnel Entrance", "Hammer Spawn", "Tunnel Center", "Back Exit", "Side Tunnel", "Choke", "Top Tunnel"],
        utility: [
          "Slayer Squad: BR + Sidekick infantry",
          "Power Weapon: Shotgun/Hammer close-range",
          "Objective Runner: Plasma + flag flank",
          "Support: Drop Wall choke; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Tunnel rush", from: "Tunnel Entrance", use: "Drop Wall + grenade chain on choke, Hammer one-shots." },
            { spawn: "Back Exit flank", from: "Side Tunnel", use: "Back Exit into base for the flag flank — iconic H3 play." },
          ],
          spawnKillSpots: [
            { from: "Top Tunnel", target: "enemy pickup attempt", risk: "Medium — grenade exposed", reward: "Power Weapon + map flank" },
          ],
          advancedSetups: [
            "Tunnels flag flank: classic H3 — flank into UNSC Camp from below, surprise the gate defense.",
            "Grenade chain Plasma + Frag on choke.",
            "Hammer one-shot: pre-aim pickup.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer Squad", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Hammer Denial", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold High Ground Tunnels from top — denies Hammer pickup, prevents the iconic flag flank.",
        callouts: ["Tunnel Entrance", "Hammer Spawn", "Tunnel Center", "Back Exit", "Side Tunnel", "Choke", "Top Tunnel"],
        utility: [
          "Slayer Squad: BR holds entrance",
          "Power Weapon: Hammer/Sniper denies pickup",
          "Objective Runner: protects flag",
          "Support: Drop Wall choke; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Tunnel", target: "enemy Hammer pickup", timing: "Hammer respawn deny" },
            { from: "Back Exit", target: "enemy flag flank", timing: "Mid-fight — denies the classic flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Tunnel Entrance.",
            "Drop Wall Hammer line.",
          ],
          advancedSetups: [
            "Hammer denial respawn.",
            "Off-angle Top Tunnel.",
            "Tunnel flank denial: don't let flag-runner exit through Tunnels.",
          ],
        },
      },
    },
  },
  "sanctuary": {
    "top-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sword / OS", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Sanctuary Top Mid is the iconic H2 remake center — Energy Sword spawn + Overshield pickup. Whoever holds Top Mid runs the map.",
        callouts: ["Top Mid", "Sword Spawn", "OS Spawn", "Side Pillars", "Pink Ramp", "Blue Ramp", "Sniper Towers"],
        utility: [
          "Slayer: BR + Sidekick — pre-aim Sword/OS",
          "Power Weapon: Sword one-shot in close range",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall Top Mid; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "OS respawn push", from: "Pink Ramp", use: "OS respawn 60s — push Top Mid on the count." },
            { spawn: "Sword respawn", from: "Blue Ramp", use: "Sword respawn 90s — pre-aim pickup, one-shot the contest." },
          ],
          spawnKillSpots: [
            { from: "Sword Spawn", target: "enemy OS pickup", risk: "Medium — grenade exposed", reward: "OS + Sword control = map control" },
          ],
          advancedSetups: [
            "OS + Sword combo: pickup OS first, push Sword on the contest.",
            "Grenade chain Plasma + Frag on Top Mid.",
            "Spawn-flip on Top Mid take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "OS / Sword Denial", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Sanctuary Top Mid: denies OS + Sword pickups. BR pair from Sniper Towers holds the long sightline.",
        callouts: ["Top Mid", "Sword Spawn", "OS Spawn", "Side Pillars", "Pink Ramp", "Blue Ramp", "Sniper Towers"],
        utility: [
          "Slayer: BR holds Side Pillars trade",
          "Power Weapon: Sniper from Towers denies pickup",
          "Objective Runner: protects objective",
          "Support: Drop Wall Top Mid; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Sniper Towers", target: "enemy pickup", timing: "OS/Sword respawn deny" },
            { from: "Pink Ramp", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Top Mid — every push commits through the same arch.",
            "Sniper Tower denial: pre-aim OS pickup.",
          ],
          advancedSetups: [
            "OS denial respawn.",
            "Off-angle Sniper Tower.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "bottom-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Sanctuary Bottom Mid is the central low ground — grenade-spam hell on contested plays.",
        callouts: ["Bottom Mid", "Side Pillars", "Center Cover", "Pink Ramp", "Blue Ramp", "Top Mid View", "Base Lift"],
        utility: [
          "Slayer: BR + Sidekick close-range",
          "Power Weapon: Sniper from Towers; BR from Side",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall choke; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Bottom Mid commit", from: "Base Lift", use: "Drop Wall + grenade chain on Center." },
            { spawn: "Side Pillar flank", from: "Pink Ramp", use: "Side Pillar off-angle." },
          ],
          spawnKillSpots: [
            { from: "Top Mid View", target: "enemy Bottom Mid commit", risk: "Medium — exposes to long shot", reward: "Mid-range control" },
          ],
          advancedSetups: [
            "Grenade chain Plasma + Frag on Center.",
            "Sniper Tower pre-aim Bottom Mid commits.",
            "Spawn-flip on Bottom Mid take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Trade", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Sanctuary Bottom Mid from Sniper Towers — pre-aim every push through Center.",
        callouts: ["Bottom Mid", "Side Pillars", "Center Cover", "Pink Ramp", "Blue Ramp", "Top Mid View", "Base Lift"],
        utility: [
          "Slayer: BR holds Side Pillars",
          "Power Weapon: Sniper Towers",
          "Objective Runner: protects objective",
          "Support: Drop Wall choke; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Top Mid View", target: "enemy push", timing: "Setup pre-position" },
            { from: "Pink Ramp", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Center.",
            "Drop Wall choke.",
          ],
          advancedSetups: [
            "Sniper Tower denial.",
            "Off-angle Top Mid View.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Push Sanctuary Red Base — base has Sniper Rifle spawn. Drop Wall entrance, Sniper trades from cover.",
        callouts: ["Red Base", "Sniper Tower", "Base Lift", "Side Cover", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR + Sidekick entry",
          "Power Weapon: Sniper trades from outside",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Base Lift commit", from: "Outside", use: "Drop Wall + grenade chain on Lift." },
            { spawn: "Sniper Tower take", from: "Side Cover", use: "Sniper Tower for the long sightline pick." },
          ],
          spawnKillSpots: [
            { from: "Outside", target: "enemy flag-anchor", risk: "Medium — top window exposed", reward: "Flag pick" },
          ],
          advancedSetups: [
            "Sniper Tower take pre-fight.",
            "Grenade chain Plasma + Frag.",
            "Flag-return Sniper trade.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Sanctuary Red Base: Sniper from Tower, Slayer holds Base Lift.",
        callouts: ["Red Base", "Sniper Tower", "Base Lift", "Side Cover", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR holds Lift",
          "Power Weapon: Sniper Tower",
          "Objective Runner: protects flag",
          "Support: Drop Wall Lift; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Cover", target: "enemy flag-runner", timing: "Mid-fight peel" },
            { from: "Window", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Lift.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Sniper Tower denial.",
            "Off-angle Window.",
            "Flag-return denial.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Mirror Red — Sanctuary Blue Base attack.",
        callouts: ["Blue Base", "Sniper Tower", "Base Lift", "Side Cover", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR + Sidekick entry",
          "Power Weapon: Sniper outside",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Base Lift commit", from: "Outside", use: "Drop Wall + grenade chain on Lift." },
            { spawn: "Sniper Tower take", from: "Side Cover", use: "Sniper Tower long sightline pick." },
          ],
          spawnKillSpots: [
            { from: "Outside", target: "enemy flag-anchor", risk: "Medium — top window", reward: "Flag pick" },
          ],
          advancedSetups: [
            "Sniper Tower take pre-fight.",
            "Grenade chain.",
            "Flag-return Sniper.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Sanctuary Blue Base.",
        callouts: ["Blue Base", "Sniper Tower", "Base Lift", "Side Cover", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR holds Lift",
          "Power Weapon: Sniper Tower",
          "Objective Runner: protects flag",
          "Support: Drop Wall Lift; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Cover", target: "enemy flag-runner", timing: "Mid-fight peel" },
            { from: "Window", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Lift.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Sniper Tower denial.",
            "Off-angle Window.",
            "Flag-return denial.",
          ],
        },
      },
    },
  },
  "guardian": {
    "top-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "OS / Mauler", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Guardian Top Mid is the iconic H3 remake center — Overshield spawn + Mauler. Whoever holds Top Mid runs the map.",
        callouts: ["Top Mid", "OS Spawn", "Mauler", "Gold Lift", "Pink Lift", "Sniper Tree", "Hammer Room"],
        utility: [
          "Slayer: BR + Sidekick pre-aim OS",
          "Power Weapon: Mauler close-range; OS for the push",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall Top Mid; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "OS respawn push", from: "Gold Lift", use: "OS 60s respawn — push on count." },
            { spawn: "Mauler respawn", from: "Pink Lift", use: "Mauler 60s respawn — pre-aim pickup." },
          ],
          spawnKillSpots: [
            { from: "Sniper Tree", target: "enemy OS pickup", risk: "Medium — exposed long shot", reward: "OS + Mauler control = map control" },
          ],
          advancedSetups: [
            "OS + Mauler combo: pickup OS first, push Mauler.",
            "Grenade chain Plasma + Frag on Top Mid.",
            "Spawn-flip on Top Mid take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "OS Denial", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Guardian Top Mid: Sniper from Tree denies OS, BR pair holds Lift trade.",
        callouts: ["Top Mid", "OS Spawn", "Mauler", "Gold Lift", "Pink Lift", "Sniper Tree", "Hammer Room"],
        utility: [
          "Slayer: BR holds Lift trade",
          "Power Weapon: Sniper Tree denies OS",
          "Objective Runner: protects objective",
          "Support: Drop Wall Top Mid; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Sniper Tree", target: "enemy OS pickup", timing: "OS respawn deny" },
            { from: "Hammer Room", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Top Mid.",
            "Sniper Tree denial.",
          ],
          advancedSetups: [
            "OS denial respawn.",
            "Off-angle Hammer Room.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "bottom-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Hammer", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Guardian Bottom Mid is Hammer Room — Gravity Hammer pickup. Grenade chain entry, Hammer one-shot the contest.",
        callouts: ["Bottom Mid", "Hammer Room", "Hammer Spawn", "Side Cover", "Lift", "Top Mid View", "Back Cubby"],
        utility: [
          "Slayer: BR + Sidekick close-range",
          "Power Weapon: Hammer one-shot",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall choke; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Hammer push", from: "Lift", use: "Drop Wall + grenade chain on Hammer Room." },
            { spawn: "Side flank", from: "Back Cubby", use: "Side off-angle." },
          ],
          spawnKillSpots: [
            { from: "Top Mid View", target: "enemy Hammer pickup", risk: "Medium — grenade exposed", reward: "Power Weapon control" },
          ],
          advancedSetups: [
            "Hammer one-shot pre-aim pickup.",
            "Grenade chain Plasma + Frag.",
            "Spawn-flip Bottom Mid take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Hammer Denial", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Guardian Hammer Room: denies Hammer pickup.",
        callouts: ["Bottom Mid", "Hammer Room", "Hammer Spawn", "Side Cover", "Lift", "Top Mid View", "Back Cubby"],
        utility: [
          "Slayer: BR holds entry",
          "Power Weapon: Hammer denies pickup",
          "Objective Runner: protects objective",
          "Support: Drop Wall choke; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Top Mid View", target: "enemy Hammer pickup", timing: "Hammer respawn deny" },
            { from: "Back Cubby", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Bottom Mid entry.",
            "Drop Wall Hammer line.",
          ],
          advancedSetups: [
            "Hammer denial respawn.",
            "Off-angle Top Mid View.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Push Guardian Red Base — sniper spawn from base.",
        callouts: ["Red Base", "Sniper Tower", "Base Lift", "Side Cover", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR + Sidekick entry",
          "Power Weapon: Sniper from cover",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Base Lift commit", from: "Outside", use: "Drop Wall + grenade chain on Lift." },
            { spawn: "Sniper Tower take", from: "Side Cover", use: "Sniper Tower long sightline pick." },
          ],
          spawnKillSpots: [
            { from: "Outside", target: "enemy flag-anchor", risk: "Medium — top window", reward: "Flag pick" },
          ],
          advancedSetups: [
            "Sniper Tower take pre-fight.",
            "Grenade chain.",
            "Flag-return Sniper.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Guardian Red Base.",
        callouts: ["Red Base", "Sniper Tower", "Base Lift", "Side Cover", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR holds Lift",
          "Power Weapon: Sniper Tower",
          "Objective Runner: protects flag",
          "Support: Drop Wall Lift; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Cover", target: "enemy flag-runner", timing: "Mid-fight peel" },
            { from: "Window", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Lift.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Sniper Tower denial.",
            "Off-angle Window.",
            "Flag-return denial.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Mirror Red — Guardian Blue Base attack.",
        callouts: ["Blue Base", "Sniper Tower", "Base Lift", "Side Cover", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR + Sidekick entry",
          "Power Weapon: Sniper outside",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Base Lift commit", from: "Outside", use: "Drop Wall + grenade chain on Lift." },
            { spawn: "Sniper Tower take", from: "Side Cover", use: "Sniper Tower long sightline pick." },
          ],
          spawnKillSpots: [
            { from: "Outside", target: "enemy flag-anchor", risk: "Medium — top window", reward: "Flag pick" },
          ],
          advancedSetups: [
            "Sniper Tower take pre-fight.",
            "Grenade chain.",
            "Flag-return Sniper.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Guardian Blue Base.",
        callouts: ["Blue Base", "Sniper Tower", "Base Lift", "Side Cover", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR holds Lift",
          "Power Weapon: Sniper Tower",
          "Objective Runner: protects flag",
          "Support: Drop Wall Lift; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Cover", target: "enemy flag-runner", timing: "Mid-fight peel" },
            { from: "Window", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Lift.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Sniper Tower denial.",
            "Off-angle Window.",
            "Flag-return denial.",
          ],
        },
      },
    },
  },
  "the-pit": {
    "sniper-tower": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "The Pit Sniper Tower is the iconic H3 sniper spawn at each base. Sniper trades from Tower covers the central court. Whoever controls the Sniper controls The Pit.",
        callouts: ["Sniper Tower", "Sniper Spawn", "Top Sniper", "Sniper Window", "Lift", "Base Roof", "Court"],
        utility: [
          "Slayer: BR + Sidekick pre-aim Sniper",
          "Power Weapon: Sniper Rifle long sightline",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall Sniper window; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Sniper respawn push", from: "Lift", use: "Count 120s — push Tower on Sniper respawn." },
            { spawn: "Sniper Window flank", from: "Base Roof", use: "Sniper Window for the off-angle Tower pinch." },
          ],
          spawnKillSpots: [
            { from: "Top Sniper", target: "enemy Sniper pickup", risk: "Medium — exposed to BR", reward: "Sniper control + map momentum" },
          ],
          advancedSetups: [
            "Sniper one-shot: pre-aim pickup, trade on first contest.",
            "Sniper respawn pickup cycle 120s.",
            "Spawn-flip on Tower take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper Denial", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold The Pit Sniper Tower: denies enemy Sniper pickup, BR pair holds Lift trade.",
        callouts: ["Sniper Tower", "Sniper Spawn", "Top Sniper", "Sniper Window", "Lift", "Base Roof", "Court"],
        utility: [
          "Slayer: BR holds Lift trade",
          "Power Weapon: Sniper Tower long sightline",
          "Objective Runner: protects objective",
          "Support: Drop Wall Sniper line; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Sniper Window", target: "enemy Sniper pickup", timing: "Sniper respawn deny" },
            { from: "Base Roof", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Sniper Spawn — every push commits through Lift first.",
            "Drop Wall Sniper line on contested take.",
          ],
          advancedSetups: [
            "Sniper denial respawn pickup.",
            "Off-angle Base Roof.",
            "Spawn-flip recovery at Base.",
          ],
        },
      },
    },
    "sword-room": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sword / OS", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "The Pit Sword Room is the central OS + Sword pickup zone. Grenade chain the room, Sword one-shot on contest.",
        callouts: ["Sword Room", "Sword Spawn", "OS Spawn", "Side Doors", "Top Sword", "Lift", "Court"],
        utility: [
          "Slayer: BR + Sidekick close-range",
          "Power Weapon: Sword one-shot + OS for engage",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall doors; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Sword push", from: "Lift", use: "Drop Wall + grenade chain on Sword Room." },
            { spawn: "OS respawn", from: "Side Doors", use: "OS 60s — push on count." },
          ],
          spawnKillSpots: [
            { from: "Top Sword", target: "enemy pickup", risk: "Medium — grenade exposed", reward: "Sword + OS = map control" },
          ],
          advancedSetups: [
            "OS + Sword combo: pickup OS, push Sword on contest.",
            "Grenade chain Plasma + Frag.",
            "Spawn-flip Sword Room take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sword Denial", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold The Pit Sword Room from top — denies Sword + OS pickups.",
        callouts: ["Sword Room", "Sword Spawn", "OS Spawn", "Side Doors", "Top Sword", "Lift", "Court"],
        utility: [
          "Slayer: BR holds Side Doors",
          "Power Weapon: Sword denies pickup",
          "Objective Runner: protects objective",
          "Support: Drop Wall doors; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Lift", target: "enemy Sword pickup", timing: "Sword respawn deny" },
            { from: "Top Sword", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Sword Spawn.",
            "Drop Wall pickup line.",
          ],
          advancedSetups: [
            "Sword denial respawn.",
            "Off-angle Top Sword.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "carbine": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Carbine / BR", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "The Pit Carbine area is the side mid-range BR fight zone. BR + Carbine trades from cover, Slayer commits on the team trade.",
        callouts: ["Carbine", "Side Cover", "Window", "Base Roof", "Lift", "Court", "Sniper View"],
        utility: [
          "Slayer: BR + Sidekick mid-range",
          "Power Weapon: Carbine from cover; BR pair",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall cover; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Carbine BR trade", from: "Window", use: "BR pair trades from cover, commit on team trade." },
            { spawn: "Side Cover flank", from: "Base Roof", use: "Side Cover off-angle BR trade." },
          ],
          spawnKillSpots: [
            { from: "Sniper View", target: "enemy Carbine push", risk: "Medium — long shot", reward: "Mid-range control" },
          ],
          advancedSetups: [
            "BR pair trade pre-aim.",
            "Grenade chain Plasma + Frag.",
            "Sniper denial Sniper View.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Carbine / BR", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold The Pit Carbine: BR pair pre-aims trade angle.",
        callouts: ["Carbine", "Side Cover", "Window", "Base Roof", "Lift", "Court", "Sniper View"],
        utility: [
          "Slayer: BR holds trade angle",
          "Power Weapon: BR pair from cover",
          "Objective Runner: protects objective",
          "Support: Drop Wall cover; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Base Roof", target: "enemy Carbine push", timing: "Setup pre-position" },
            { from: "Window", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Carbine angle.",
            "Drop Wall cover line.",
          ],
          advancedSetups: [
            "BR pair pre-aim denial.",
            "Off-angle Sniper View.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "long-hall": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Rocket / Skewer", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "The Pit Long Hall is the iconic H3 rocket spawn corridor. Rocket trades from cover, grenade chain the choke.",
        callouts: ["Long Hall", "Rocket Spawn", "Side Cover", "Choke", "Lift", "Top Long", "Court"],
        utility: [
          "Slayer: BR + Sidekick close-range",
          "Power Weapon: Rocket Launcher / Skewer trades",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall choke; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Rocket respawn push", from: "Lift", use: "Count 120s — push Long Hall on Rocket respawn." },
            { spawn: "Top Long flank", from: "Side Cover", use: "Top Long for off-angle Rocket pinch." },
          ],
          spawnKillSpots: [
            { from: "Top Long", target: "enemy Rocket pickup", risk: "Medium — grenade exposed", reward: "Rocket control + cluster kill" },
          ],
          advancedSetups: [
            "Rocket trade pre-aim pickup.",
            "Grenade chain Plasma + Frag.",
            "Spawn-flip Long Hall take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Rocket Denial", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold The Pit Long Hall: denies Rocket pickup.",
        callouts: ["Long Hall", "Rocket Spawn", "Side Cover", "Choke", "Lift", "Top Long", "Court"],
        utility: [
          "Slayer: BR holds choke",
          "Power Weapon: Rocket denies pickup",
          "Objective Runner: protects objective",
          "Support: Drop Wall choke; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Lift", target: "enemy Rocket pickup", timing: "Rocket respawn deny" },
            { from: "Top Long", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Long Hall choke.",
            "Drop Wall Rocket line.",
          ],
          advancedSetups: [
            "Rocket denial respawn.",
            "Off-angle Top Long.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
  },
  "lockout": {
    "sniper-tower": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Lockout Sniper Tower is the iconic H2 S1 sniper spawn. Sniper from Tower covers BR Tower + Library. Whoever controls Sniper Tower controls Lockout — single most important position on the map.",
        callouts: ["Sniper Tower", "S1 Spawn", "Sniper Window", "Sniper Lift", "Bridge", "BR Tower View", "Library Roof"],
        utility: [
          "Slayer: BR + Sidekick pre-aim Tower",
          "Power Weapon: Sniper Rifle from Tower",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall Sniper line; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Sniper respawn push", from: "Bridge", use: "Count 120s — push Tower on Sniper respawn." },
            { spawn: "Sniper Lift flank", from: "Library Roof", use: "Sniper Lift catches the off-angle Tower take." },
          ],
          spawnKillSpots: [
            { from: "Sniper Window", target: "enemy Sniper pickup", risk: "Medium — exposed to BR Tower", reward: "Sniper control = Lockout control" },
          ],
          advancedSetups: [
            "Sniper one-shot: pre-aim pickup, trade on first contest.",
            "Sniper Tower take wins games — never trickle, full team commit.",
            "Spawn-flip on Tower take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Lockout Sniper Tower: anchor with Sniper, BR pair from Bridge covers the long trade.",
        callouts: ["Sniper Tower", "S1 Spawn", "Sniper Window", "Sniper Lift", "Bridge", "BR Tower View", "Library Roof"],
        utility: [
          "Slayer: BR holds Bridge trade",
          "Power Weapon: Sniper Tower long sightline",
          "Objective Runner: protects objective",
          "Support: Drop Wall Sniper line; pre-grenade Lift",
        ],
        premiumTactics: {
          runouts: [
            { from: "Sniper Lift", target: "enemy climb attempt", timing: "Setup pre-position" },
            { from: "Library Roof", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Bridge — every push commits through Bridge.",
            "Drop Wall Sniper line on contested take.",
          ],
          advancedSetups: [
            "Sniper denial respawn pickup.",
            "Off-angle Library Roof.",
            "Spawn-flip recovery at base.",
          ],
        },
      },
    },
    "br-tower": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "BR / Carbine", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Lockout BR Tower is the secondary vertical perch — Battle Rifle pickup. Used as the counter-angle to Sniper Tower.",
        callouts: ["BR Tower", "Top BR", "BR Spawn", "BR Lift", "Bridge", "Sniper View", "Side Cover"],
        utility: [
          "Slayer: BR + Sidekick climb",
          "Power Weapon: BR pair from Tower",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall climb; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "BR Lift take", from: "Bridge", use: "Drop Wall + grenade chain on Lift." },
            { spawn: "Side Cover flank", from: "Sniper View", use: "Side Cover off-angle climb." },
          ],
          spawnKillSpots: [
            { from: "Top BR", target: "enemy lift attempt", risk: "Medium — exposed long shot", reward: "BR Tower + counter-angle" },
          ],
          advancedSetups: [
            "BR pair pre-aim Sniper Tower.",
            "Vertical commit grenade chain.",
            "Counter-Sniper: BR Tower duels Sniper Tower.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "BR / Carbine", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Lockout BR Tower: BR pair anchors top.",
        callouts: ["BR Tower", "Top BR", "BR Spawn", "BR Lift", "Bridge", "Sniper View", "Side Cover"],
        utility: [
          "Slayer: BR holds Lift",
          "Power Weapon: BR pair from BR Tower",
          "Objective Runner: protects objective",
          "Support: Drop Wall Lift; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Cover", target: "enemy lift attempt", timing: "Setup pre-position" },
            { from: "Bridge", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Lift.",
            "Drop Wall Lift line.",
          ],
          advancedSetups: [
            "BR pair denial respawn.",
            "Off-angle Bridge.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "library": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sword", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Lockout Library is the bottom-center pickup zone — Energy Sword spawn. Grenade chain entry, Sword one-shot.",
        callouts: ["Library", "Sword Spawn", "Lift Bottom", "Side Door", "Roof", "Choke", "Sniper View"],
        utility: [
          "Slayer: BR + Sidekick close-range",
          "Power Weapon: Sword one-shot",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall choke; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Sword push", from: "Lift Bottom", use: "Drop Wall + grenade chain on Library." },
            { spawn: "Side Door flank", from: "Roof", use: "Side Door for off-angle Sword pinch." },
          ],
          spawnKillSpots: [
            { from: "Roof", target: "enemy Sword pickup", risk: "Medium — grenade exposed", reward: "Sword control + map momentum" },
          ],
          advancedSetups: [
            "Sword one-shot pre-aim pickup.",
            "Grenade chain Plasma + Frag.",
            "Spawn-flip Library take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sword Denial", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Lockout Library: denies Sword pickup.",
        callouts: ["Library", "Sword Spawn", "Lift Bottom", "Side Door", "Roof", "Choke", "Sniper View"],
        utility: [
          "Slayer: BR holds choke",
          "Power Weapon: Sword denies pickup",
          "Objective Runner: protects objective",
          "Support: Drop Wall choke; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Door", target: "enemy Sword pickup", timing: "Sword respawn deny" },
            { from: "Roof", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Library entry.",
            "Drop Wall Sword line.",
          ],
          advancedSetups: [
            "Sword denial respawn.",
            "Off-angle Roof.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "lift": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Lift Control", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Lockout Lift is the central vertical mover — bottom-to-top. Grenade chain top of lift, push vertically.",
        callouts: ["Lift Top", "Lift Bottom", "Side Cover", "Library View", "Sniper Tower View", "Bridge", "Back Cover"],
        utility: [
          "Slayer: BR + Sidekick lift",
          "Power Weapon: BR pair from top",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall lift; pre-grenade top",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Lift commit", from: "Lift Bottom", use: "Drop Wall + grenade chain at top of lift." },
            { spawn: "Side flank", from: "Back Cover", use: "Side Cover off-angle lift entry." },
          ],
          spawnKillSpots: [
            { from: "Library View", target: "enemy lift attempt", risk: "Medium — exposed grenade", reward: "Lift control = vertical map control" },
          ],
          advancedSetups: [
            "Lift grenade chain pre-aim top.",
            "BR pair denial.",
            "Spawn-flip lift take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Lift Denial", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Lockout Lift: pre-grenade lift top, BR pair denies climb.",
        callouts: ["Lift Top", "Lift Bottom", "Side Cover", "Library View", "Sniper Tower View", "Bridge", "Back Cover"],
        utility: [
          "Slayer: BR holds top of lift",
          "Power Weapon: BR pair denies climb",
          "Objective Runner: protects objective",
          "Support: Drop Wall lift; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Cover", target: "enemy lift attempt", timing: "Setup pre-position" },
            { from: "Bridge", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim lift top.",
            "Drop Wall lift line.",
          ],
          advancedSetups: [
            "Lift grenade chain denial.",
            "Off-angle Bridge.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
  },
  "midship": {
    "top-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "OS", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Midship Top Mid is the iconic H2 OS spawn over the central pit. Grav lifts boost up to Top Mid — grenade chain on lift, OS pickup wins teamfights.",
        callouts: ["Top Mid", "OS Spawn", "Pit Top", "Pink Grav", "Yellow Grav", "Side Roofs", "Sniper Bases"],
        utility: [
          "Slayer: BR + Sidekick pre-aim OS",
          "Power Weapon: OS for engage; BR pair top",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall lift; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "OS respawn push", from: "Pink Grav", use: "OS 60s — push Top Mid on respawn count." },
            { spawn: "Yellow Grav flank", from: "Side Roofs", use: "Yellow Grav off-angle Top Mid pinch." },
          ],
          spawnKillSpots: [
            { from: "Pit Top", target: "enemy OS pickup", risk: "Medium — grenade exposed", reward: "OS control = map momentum" },
          ],
          advancedSetups: [
            "OS pickup: pre-aim Top Mid, grenade chain on contest.",
            "Grav lift grenade chain Plasma + Frag.",
            "Spawn-flip on Top Mid take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "OS Denial", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Midship Top Mid: pre-grenade Grav lift top, BR pair from Sniper Bases denies climb.",
        callouts: ["Top Mid", "OS Spawn", "Pit Top", "Pink Grav", "Yellow Grav", "Side Roofs", "Sniper Bases"],
        utility: [
          "Slayer: BR holds Top Mid trade",
          "Power Weapon: Sniper Bases denies OS",
          "Objective Runner: protects objective",
          "Support: Drop Wall lift; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Yellow Grav", target: "enemy OS pickup", timing: "OS respawn deny" },
            { from: "Side Roofs", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Top Mid OS Spawn.",
            "Drop Wall lift line.",
          ],
          advancedSetups: [
            "OS denial respawn.",
            "Off-angle Side Roofs.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "bottom-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sword", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Midship Bottom Mid is the iconic H2 pit floor — Sword spawn. Drop Wall the pit, Sword one-shot, Slayer cleans up.",
        callouts: ["Bottom Mid", "Sword Spawn", "Pit Floor", "Pink Grav Bottom", "Yellow Grav Bottom", "Side Doors", "Top Mid View"],
        utility: [
          "Slayer: BR + Sidekick close-range",
          "Power Weapon: Sword one-shot in pit",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall pit; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Sword push", from: "Pink Grav Bottom", use: "Drop Wall + grenade chain on Sword Spawn." },
            { spawn: "Side Door flank", from: "Yellow Grav Bottom", use: "Side Door off-angle Sword pinch." },
          ],
          spawnKillSpots: [
            { from: "Top Mid View", target: "enemy Sword pickup", risk: "Medium — grenade exposed", reward: "Sword control + map momentum" },
          ],
          advancedSetups: [
            "Sword one-shot pre-aim pickup.",
            "Grenade chain Plasma + Frag.",
            "Spawn-flip Bottom Mid take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sword Denial", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Midship Bottom Mid: denies Sword pickup, BR pair from Top Mid View pre-aims pit.",
        callouts: ["Bottom Mid", "Sword Spawn", "Pit Floor", "Pink Grav Bottom", "Yellow Grav Bottom", "Side Doors", "Top Mid View"],
        utility: [
          "Slayer: BR holds Side Doors",
          "Power Weapon: Sword denies pickup; BR from Top Mid View",
          "Objective Runner: protects objective",
          "Support: Drop Wall pit; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Top Mid View", target: "enemy Sword pickup", timing: "Sword respawn deny" },
            { from: "Side Doors", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Bottom Mid pit.",
            "Drop Wall Sword line.",
          ],
          advancedSetups: [
            "Sword denial respawn.",
            "Off-angle Top Mid View.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Push Midship Red Base — Sniper Rifle spawn from base. Drop Wall entrance, Sniper trades from outside.",
        callouts: ["Red Base", "Sniper Spawn", "Base Lift", "Side Cover", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR + Sidekick entry",
          "Power Weapon: Sniper from cover",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Base Lift commit", from: "Outside", use: "Drop Wall + grenade chain on Lift." },
            { spawn: "Sniper Spawn take", from: "Side Cover", use: "Sniper pickup pre-fight." },
          ],
          spawnKillSpots: [
            { from: "Outside", target: "enemy flag-anchor", risk: "Medium — top window", reward: "Flag pick" },
          ],
          advancedSetups: [
            "Sniper Spawn take pre-fight.",
            "Grenade chain.",
            "Flag-return Sniper trade.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Midship Red Base: Sniper anchors base.",
        callouts: ["Red Base", "Sniper Spawn", "Base Lift", "Side Cover", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR holds Lift",
          "Power Weapon: Sniper base",
          "Objective Runner: protects flag",
          "Support: Drop Wall Lift; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Cover", target: "enemy flag-runner", timing: "Mid-fight peel" },
            { from: "Window", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Lift.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Sniper denial.",
            "Off-angle Window.",
            "Flag-return denial.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Mirror Red — Midship Blue Base attack.",
        callouts: ["Blue Base", "Sniper Spawn", "Base Lift", "Side Cover", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR + Sidekick entry",
          "Power Weapon: Sniper outside",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Base Lift commit", from: "Outside", use: "Drop Wall + grenade chain on Lift." },
            { spawn: "Sniper Spawn take", from: "Side Cover", use: "Sniper pickup pre-fight." },
          ],
          spawnKillSpots: [
            { from: "Outside", target: "enemy flag-anchor", risk: "Medium — top window", reward: "Flag pick" },
          ],
          advancedSetups: [
            "Sniper Spawn take pre-fight.",
            "Grenade chain.",
            "Flag-return Sniper.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Midship Blue Base.",
        callouts: ["Blue Base", "Sniper Spawn", "Base Lift", "Side Cover", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR holds Lift",
          "Power Weapon: Sniper base",
          "Objective Runner: protects flag",
          "Support: Drop Wall Lift; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Cover", target: "enemy flag-runner", timing: "Mid-fight peel" },
            { from: "Window", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Lift.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Sniper denial.",
            "Off-angle Window.",
            "Flag-return denial.",
          ],
        },
      },
    },
  },
  "narrows": {
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Narrows Red Base is the iconic H3 narrow-bridge base — single long-line approach. Sniper covers Bridge sightline, Drop Wall the entry.",
        callouts: ["Red Base", "Bridge Approach", "Base Lift", "Side Cover", "Flag Spawn", "Window", "Roof"],
        utility: [
          "Slayer: BR + Sidekick entry",
          "Power Weapon: Sniper covers Bridge",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall Bridge; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Bridge commit", from: "Bridge Approach", use: "Drop Wall + grenade chain on Bridge entry." },
            { spawn: "Side Cover flank", from: "Roof", use: "Side Cover off-angle entry." },
          ],
          spawnKillSpots: [
            { from: "Bridge Approach", target: "enemy flag-anchor", risk: "Medium — Bridge exposes", reward: "Flag pick" },
          ],
          advancedSetups: [
            "Sniper Bridge pre-aim.",
            "Grenade chain Plasma + Frag.",
            "Flag-return Sniper trade.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Narrows Red Base: Sniper anchors Bridge sightline, BR pair holds entry.",
        callouts: ["Red Base", "Bridge Approach", "Base Lift", "Side Cover", "Flag Spawn", "Window", "Roof"],
        utility: [
          "Slayer: BR holds Lift",
          "Power Weapon: Sniper Bridge",
          "Objective Runner: protects flag",
          "Support: Drop Wall Bridge; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Cover", target: "enemy flag-runner", timing: "Mid-fight peel" },
            { from: "Roof", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Bridge — every push commits through Bridge.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Sniper Bridge denial.",
            "Off-angle Roof.",
            "Flag-return denial.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Mirror Red — Narrows Blue Base attack via Bridge.",
        callouts: ["Blue Base", "Bridge Approach", "Base Lift", "Side Cover", "Flag Spawn", "Window", "Roof"],
        utility: [
          "Slayer: BR + Sidekick entry",
          "Power Weapon: Sniper Bridge",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall Bridge; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Bridge commit", from: "Bridge Approach", use: "Drop Wall + grenade chain on Bridge." },
            { spawn: "Side Cover flank", from: "Roof", use: "Side Cover off-angle entry." },
          ],
          spawnKillSpots: [
            { from: "Bridge Approach", target: "enemy flag-anchor", risk: "Medium — Bridge exposes", reward: "Flag pick" },
          ],
          advancedSetups: [
            "Sniper Bridge pre-aim.",
            "Grenade chain.",
            "Flag-return Sniper trade.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Narrows Blue Base.",
        callouts: ["Blue Base", "Bridge Approach", "Base Lift", "Side Cover", "Flag Spawn", "Window", "Roof"],
        utility: [
          "Slayer: BR holds Lift",
          "Power Weapon: Sniper Bridge",
          "Objective Runner: protects flag",
          "Support: Drop Wall Bridge; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Cover", target: "enemy flag-runner", timing: "Mid-fight peel" },
            { from: "Roof", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Bridge.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Sniper denial.",
            "Off-angle Roof.",
            "Flag-return denial.",
          ],
        },
      },
    },
    "mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Rocket", priority: "essential" },
          { name: "Objective Runner", role: "Capture", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Narrows Mid is the iconic Rocket Launcher pickup spawn under the bridge. Grenade chain on Rocket, push vertically with Man Cannon.",
        callouts: ["Mid Floor", "Rocket Spawn", "Man Cannon", "Bridge Bottom", "Side Cover", "Top View", "Choke"],
        utility: [
          "Slayer: BR + Sidekick bridge",
          "Power Weapon: Rocket Launcher",
          "Objective Runner: Plasma + capture",
          "Support: Drop Wall Mid; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Rocket respawn push", from: "Bridge Bottom", use: "Count 120s — push Mid on Rocket respawn." },
            { spawn: "Man Cannon flank", from: "Side Cover", use: "Man Cannon catches off-angle commit." },
          ],
          spawnKillSpots: [
            { from: "Top View", target: "enemy Rocket pickup", risk: "Medium — grenade exposed", reward: "Rocket control + cluster kill" },
          ],
          advancedSetups: [
            "Rocket trade pre-aim pickup.",
            "Grenade chain Plasma + Frag.",
            "Man Cannon launch take: classic H3 — vertical commit with Rocket.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Rocket Denial", priority: "essential" },
          { name: "Objective Runner", role: "Capture", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Narrows Mid: denies Rocket pickup.",
        callouts: ["Mid Floor", "Rocket Spawn", "Man Cannon", "Bridge Bottom", "Side Cover", "Top View", "Choke"],
        utility: [
          "Slayer: BR holds choke",
          "Power Weapon: Rocket denies pickup",
          "Objective Runner: protects capture",
          "Support: Drop Wall Mid; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Top View", target: "enemy Rocket pickup", timing: "Rocket respawn deny" },
            { from: "Bridge Bottom", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Mid choke.",
            "Drop Wall Rocket line.",
          ],
          advancedSetups: [
            "Rocket denial respawn.",
            "Off-angle Top View.",
            "Man Cannon launch denial.",
          ],
        },
      },
    },
    "bridge": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "BR pair", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Narrows Bridge is the central walkway connecting bases — single long sightline. BR pair trades from cover, Drop Wall the cross.",
        callouts: ["Bridge", "Side Lifts", "Bridge Top", "Sniper Cover", "Cross View", "Bridge Bottom", "Lift"],
        utility: [
          "Slayer: BR + Sidekick bridge",
          "Power Weapon: BR pair from cover",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall Bridge; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Bridge cross", from: "Side Lifts", use: "Drop Wall + grenade chain on Bridge cross." },
            { spawn: "Bridge Top flank", from: "Sniper Cover", use: "Bridge Top off-angle." },
          ],
          spawnKillSpots: [
            { from: "Cross View", target: "enemy Bridge commit", risk: "Medium — long shot", reward: "Bridge control" },
          ],
          advancedSetups: [
            "BR pair pre-aim Cross.",
            "Grenade chain Plasma + Frag.",
            "Spawn-flip Bridge take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "BR pair", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Narrows Bridge from Cross View.",
        callouts: ["Bridge", "Side Lifts", "Bridge Top", "Sniper Cover", "Cross View", "Bridge Bottom", "Lift"],
        utility: [
          "Slayer: BR holds Cross View",
          "Power Weapon: BR pair from cover",
          "Objective Runner: protects objective",
          "Support: Drop Wall Bridge; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Sniper Cover", target: "enemy Bridge cross", timing: "Setup pre-position" },
            { from: "Bridge Top", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Bridge Cross.",
            "Drop Wall Bridge line.",
          ],
          advancedSetups: [
            "BR pair denial.",
            "Off-angle Sniper Cover.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
  },
  "construct": {
    "top-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "OS / Tower", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Construct Top Mid is the iconic H3 Tower with Overshield pickup. Whoever holds Tower runs the map — sniper rifle covers all key lifts.",
        callouts: ["Top Mid", "Tower", "OS Spawn", "Gold Lift", "Green Lift", "Sniper Cover", "Bridge"],
        utility: [
          "Slayer: BR + Sidekick pre-aim OS",
          "Power Weapon: OS + Sniper from Tower",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall Tower; pre-grenade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "OS respawn push", from: "Gold Lift", use: "OS 60s — push Tower on respawn count." },
            { spawn: "Green Lift flank", from: "Bridge", use: "Green Lift off-angle Tower pinch." },
          ],
          spawnKillSpots: [
            { from: "Sniper Cover", target: "enemy OS pickup", risk: "Medium — exposed long shot", reward: "OS + Sniper = map control" },
          ],
          advancedSetups: [
            "OS + Sniper combo: pickup OS, Sniper trades back-line.",
            "Grenade chain Plasma + Frag on Tower.",
            "Spawn-flip Tower take.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "OS / Sniper Denial", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Construct Tower: Sniper anchors top, BR pair from Bridge denies climb.",
        callouts: ["Top Mid", "Tower", "OS Spawn", "Gold Lift", "Green Lift", "Sniper Cover", "Bridge"],
        utility: [
          "Slayer: BR holds Lift trade",
          "Power Weapon: Sniper Tower",
          "Objective Runner: protects objective",
          "Support: Drop Wall Tower; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Green Lift", target: "enemy OS pickup", timing: "OS respawn deny" },
            { from: "Bridge", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Tower.",
            "Drop Wall OS line.",
          ],
          advancedSetups: [
            "OS denial respawn.",
            "Off-angle Bridge.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "bottom-mid": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Shotgun", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Construct Bottom Mid is the iconic H3 elevator-lift bottom — Shotgun pickup. Grenade chain bottom, push vertically through lifts.",
        callouts: ["Bottom Mid", "Shotgun Spawn", "Gold Lift Bottom", "Green Lift Bottom", "Side Cover", "Top View", "Choke"],
        utility: [
          "Slayer: BR + Sidekick close-range",
          "Power Weapon: Shotgun one-shot in close",
          "Objective Runner: Plasma + grab",
          "Support: Drop Wall choke; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Shotgun push", from: "Gold Lift Bottom", use: "Drop Wall + grenade chain on Shotgun Spawn." },
            { spawn: "Side flank", from: "Green Lift Bottom", use: "Side Cover off-angle." },
          ],
          spawnKillSpots: [
            { from: "Top View", target: "enemy Shotgun pickup", risk: "Medium — grenade exposed", reward: "Shotgun control + map flank" },
          ],
          advancedSetups: [
            "Shotgun one-shot pre-aim pickup.",
            "Grenade chain Plasma + Frag.",
            "Vertical commit via lifts.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Shotgun Denial", priority: "essential" },
          { name: "Objective Runner", role: "Objective", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Construct Bottom Mid: denies Shotgun pickup.",
        callouts: ["Bottom Mid", "Shotgun Spawn", "Gold Lift Bottom", "Green Lift Bottom", "Side Cover", "Top View", "Choke"],
        utility: [
          "Slayer: BR holds choke",
          "Power Weapon: Shotgun denies pickup",
          "Objective Runner: protects objective",
          "Support: Drop Wall choke; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Top View", target: "enemy Shotgun pickup", timing: "Shotgun respawn deny" },
            { from: "Side Cover", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Bottom Mid entry.",
            "Drop Wall Shotgun line.",
          ],
          advancedSetups: [
            "Shotgun denial respawn.",
            "Off-angle Top View.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "red-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Push Construct Red Base — Sniper Rifle spawn at base.",
        callouts: ["Red Base", "Sniper Spawn", "Base Lift", "Side Cover", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR + Sidekick entry",
          "Power Weapon: Sniper from cover",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Base Lift commit", from: "Outside", use: "Drop Wall + grenade chain on Lift." },
            { spawn: "Sniper Spawn take", from: "Side Cover", use: "Sniper pickup pre-fight." },
          ],
          spawnKillSpots: [
            { from: "Outside", target: "enemy flag-anchor", risk: "Medium — top window", reward: "Flag pick" },
          ],
          advancedSetups: [
            "Sniper take pre-fight.",
            "Grenade chain.",
            "Flag-return Sniper.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Construct Red Base.",
        callouts: ["Red Base", "Sniper Spawn", "Base Lift", "Side Cover", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR holds Lift",
          "Power Weapon: Sniper base",
          "Objective Runner: protects flag",
          "Support: Drop Wall Lift; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Cover", target: "enemy flag-runner", timing: "Mid-fight peel" },
            { from: "Window", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Lift.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Sniper denial.",
            "Off-angle Window.",
            "Flag-return denial.",
          ],
        },
      },
    },
    "blue-base": {
      attack: {
        operators: [
          { name: "Slayer", role: "Entry", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Flag", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Mirror Red — Construct Blue Base attack.",
        callouts: ["Blue Base", "Sniper Spawn", "Base Lift", "Side Cover", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR + Sidekick entry",
          "Power Weapon: Sniper outside",
          "Objective Runner: Plasma + flag",
          "Support: Drop Wall; Plasma chain",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Base Lift commit", from: "Outside", use: "Drop Wall + grenade chain on Lift." },
            { spawn: "Sniper Spawn take", from: "Side Cover", use: "Sniper pickup pre-fight." },
          ],
          spawnKillSpots: [
            { from: "Outside", target: "enemy flag-anchor", risk: "Medium — top window", reward: "Flag pick" },
          ],
          advancedSetups: [
            "Sniper take pre-fight.",
            "Grenade chain.",
            "Flag-return Sniper.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Slayer", role: "Anchor", priority: "essential" },
          { name: "Power Weapon Controller", role: "Sniper", priority: "essential" },
          { name: "Objective Runner", role: "Flag Anchor", priority: "recommended" },
          { name: "Support", role: "Drop Wall / Grenades", priority: "recommended" },
        ],
        strategy: "Hold Construct Blue Base.",
        callouts: ["Blue Base", "Sniper Spawn", "Base Lift", "Side Cover", "Outside", "Flag Spawn", "Window"],
        utility: [
          "Slayer: BR holds Lift",
          "Power Weapon: Sniper base",
          "Objective Runner: protects flag",
          "Support: Drop Wall Lift; pre-grenade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Cover", target: "enemy flag-runner", timing: "Mid-fight peel" },
            { from: "Window", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Lift.",
            "Drop Wall flag.",
          ],
          advancedSetups: [
            "Sniper denial.",
            "Off-angle Window.",
            "Flag-return denial.",
          ],
        },
      },
    },
  },
}

export default STRATS
