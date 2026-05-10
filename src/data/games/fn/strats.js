// Fortnite Zero Build — v1 generated strats. Per (map, POI, side).
// `attack` = early/mid game engage, `defense` = endgame zone hold.

const STRATS = {
  "current-chapter": {
    "pleasant-piazza": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Squad split on Pleasant Piazza: Aggressor + Rotator take Plaza Center, Support + Marksman loot the outer ring. Reconvene on next ring callout — do not split past 100m. Plaza center is contested — drop edge buildings first if ring forces.",
        callouts: ["Plaza Center", "Loot Buildings", "Rooftops", "Side Streets", "Spawn Path", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for entry frag; mobility item for repositioning",
          "Marksman: Sniper / DMR for long sightline; AR for mid-range trade",
          "Rotator: Mobility item priority (Launch Pad / Crash Pad / Shockwave)",
          "Support: Heals + Wall item for cover; protects rotation",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Pleasant Piazza primary drop", from: "Plaza Center", use: "Hot-drop loot priority — secure tier-1 weapons + heals before contesting building." },
            { spawn: "Pleasant Piazza edge drop", from: "Outer ridge", use: "Safer drop — loot full kit before pushing main building." },
          ],
          spawnKillSpots: [
            { from: "Plaza Center", target: "contested squad on adjacent loot pile", risk: "Medium — third party from any direction", reward: "Squad wipe + loot consolidation in early game" },
          ],
          advancedSetups: [
            "Mobility chain: Aggressor uses Crash Pad to commit, Rotator follows with Launch Pad, Support throws heals during the push.",
            "Squad comp synergy: Marksman pre-aims long sightline, Aggressor takes the close-range duel, Rotator pinches from off-angle.",
            "Rotation read: at ring 2 close, decide to fight or rotate based on adjacent squad count — never engage 3-team fights without info advantage.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Building hold on Pleasant Piazza: Support runs heal cycle, Aggressor holds the door, Marksman covers windows. Save mobility items for the inevitable spawn flip. Rooftop hold with Marksman + Plaza ground anchor wins most contests.",
        callouts: ["Plaza Center", "Loot Buildings", "Rooftops", "Side Streets", "Spawn Path", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for close-range hold",
          "Marksman: Sniper / DMR holds long sightline",
          "Rotator: Mobility item ready for the inevitable rotation",
          "Support: Heals + Wall for cover; protects squad through the contest",
        ],
        premiumTactics: {
          runouts: [
            { from: "Plaza Center", target: "incoming squad rotation path", timing: "Ring 4-5 close — punish squads forced into your zone" },
            { from: "Side ridge", target: "flanking third party", timing: "Mid-fight — peel for teammate that engaged first" },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main approach — most pushes commit from the same path each round.",
            "Save the off-angle Marksman shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Plaza Center with the Aggressor — if entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "High ground: Marksman holds the highest available ridge, Support drops heals from above, Aggressor pulls duel from below.",
            "Off-angle anchor in Plaza Center forces push to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Final ring positioning: Marksman pre-aims most-likely rotation path, Aggressor body-blocks the choke, Support cycles heals on the cleanup.",
          ],
        },
      },
    },
    "foxy-floodgate": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Late-game push into Foxy Floodgate: Marksman scans the holding squad, Aggressor flanks via mobility item, Support preps heals. Force the fight before zone closes. Dam center is exposed — Aggressor commits with Support heal cover.",
        callouts: ["Dam Center", "Loot Buildings", "Bridge", "Side Path", "Coast", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for entry frag; mobility item for repositioning",
          "Marksman: Sniper / DMR for long sightline; AR for mid-range trade",
          "Rotator: Mobility item priority (Launch Pad / Crash Pad / Shockwave)",
          "Support: Heals + Wall item for cover; protects rotation",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Foxy Floodgate primary drop", from: "Dam Center", use: "Hot-drop loot priority — secure tier-1 weapons + heals before contesting building." },
            { spawn: "Foxy Floodgate edge drop", from: "Outer ridge", use: "Safer drop — loot full kit before pushing main building." },
          ],
          spawnKillSpots: [
            { from: "Dam Center", target: "contested squad on adjacent loot pile", risk: "Medium — third party from any direction", reward: "Squad wipe + loot consolidation in early game" },
          ],
          advancedSetups: [
            "Mobility chain: Aggressor uses Crash Pad to commit, Rotator follows with Launch Pad, Support throws heals during the push.",
            "Squad comp synergy: Marksman pre-aims long sightline, Aggressor takes the close-range duel, Rotator pinches from off-angle.",
            "Rotation read: at ring 2 close, decide to fight or rotate based on adjacent squad count — never engage 3-team fights without info advantage.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Stack Foxy Floodgate with high ground: Marksman on ridge, Aggressor anchor, Support on heal cycle, Rotator scouting. Push only when ring forces movement. Bridge cross-fire from Coast wins the standard contest.",
        callouts: ["Dam Center", "Loot Buildings", "Bridge", "Side Path", "Coast", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for close-range hold",
          "Marksman: Sniper / DMR holds long sightline",
          "Rotator: Mobility item ready for the inevitable rotation",
          "Support: Heals + Wall for cover; protects squad through the contest",
        ],
        premiumTactics: {
          runouts: [
            { from: "Dam Center", target: "incoming squad rotation path", timing: "Ring 4-5 close — punish squads forced into your zone" },
            { from: "Side ridge", target: "flanking third party", timing: "Mid-fight — peel for teammate that engaged first" },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main approach — most pushes commit from the same path each round.",
            "Save the off-angle Marksman shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Dam Center with the Aggressor — if entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "High ground: Marksman holds the highest available ridge, Support drops heals from above, Aggressor pulls duel from below.",
            "Off-angle anchor in Dam Center forces push to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Final ring positioning: Marksman pre-aims most-likely rotation path, Aggressor body-blocks the choke, Support cycles heals on the cleanup.",
          ],
        },
      },
    },
    "hidden-hollow": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Squad split on Hidden Hollow: Aggressor + Rotator take Cave, Support + Marksman loot the outer ring. Reconvene on next ring callout — do not split past 100m.",
        callouts: ["Cave", "Loot Pile", "Forest Edge", "Side Path", "Spawn Path", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for entry frag; mobility item for repositioning",
          "Marksman: Sniper / DMR for long sightline; AR for mid-range trade",
          "Rotator: Mobility item priority (Launch Pad / Crash Pad / Shockwave)",
          "Support: Heals + Wall item for cover; protects rotation",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Hidden Hollow primary drop", from: "Cave", use: "Hot-drop loot priority — secure tier-1 weapons + heals before contesting building." },
            { spawn: "Hidden Hollow edge drop", from: "Outer ridge", use: "Safer drop — loot full kit before pushing main building." },
          ],
          spawnKillSpots: [
            { from: "Cave", target: "contested squad on adjacent loot pile", risk: "Medium — third party from any direction", reward: "Squad wipe + loot consolidation in early game" },
          ],
          advancedSetups: [
            "Mobility chain: Aggressor uses Crash Pad to commit, Rotator follows with Launch Pad, Support throws heals during the push.",
            "Squad comp synergy: Marksman pre-aims long sightline, Aggressor takes the close-range duel, Rotator pinches from off-angle.",
            "Rotation read: at ring 2 close, decide to fight or rotate based on adjacent squad count — never engage 3-team fights without info advantage.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Building hold on Hidden Hollow: Support runs heal cycle, Aggressor holds the door, Marksman covers windows. Save mobility items for the inevitable spawn flip.",
        callouts: ["Cave", "Loot Pile", "Forest Edge", "Side Path", "Spawn Path", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for close-range hold",
          "Marksman: Sniper / DMR holds long sightline",
          "Rotator: Mobility item ready for the inevitable rotation",
          "Support: Heals + Wall for cover; protects squad through the contest",
        ],
        premiumTactics: {
          runouts: [
            { from: "Cave", target: "incoming squad rotation path", timing: "Ring 4-5 close — punish squads forced into your zone" },
            { from: "Side ridge", target: "flanking third party", timing: "Mid-fight — peel for teammate that engaged first" },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main approach — most pushes commit from the same path each round.",
            "Save the off-angle Marksman shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Cave with the Aggressor — if entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "High ground: Marksman holds the highest available ridge, Support drops heals from above, Aggressor pulls duel from below.",
            "Off-angle anchor in Cave forces push to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Final ring positioning: Marksman pre-aims most-likely rotation path, Aggressor body-blocks the choke, Support cycles heals on the cleanup.",
          ],
        },
      },
    },
    "magic-mosses": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Edge drop on Magic Mosses: land outside the contested zone, Rotator scouts threats, Support loots up. Push Tower when full kit; do not rush undergeared.",
        callouts: ["Tower", "Loot Houses", "Forest", "Side Path", "Bridge", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for entry frag; mobility item for repositioning",
          "Marksman: Sniper / DMR for long sightline; AR for mid-range trade",
          "Rotator: Mobility item priority (Launch Pad / Crash Pad / Shockwave)",
          "Support: Heals + Wall item for cover; protects rotation",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Magic Mosses primary drop", from: "Tower", use: "Hot-drop loot priority — secure tier-1 weapons + heals before contesting building." },
            { spawn: "Magic Mosses edge drop", from: "Outer ridge", use: "Safer drop — loot full kit before pushing main building." },
          ],
          spawnKillSpots: [
            { from: "Tower", target: "contested squad on adjacent loot pile", risk: "Medium — third party from any direction", reward: "Squad wipe + loot consolidation in early game" },
          ],
          advancedSetups: [
            "Mobility chain: Aggressor uses Crash Pad to commit, Rotator follows with Launch Pad, Support throws heals during the push.",
            "Squad comp synergy: Marksman pre-aims long sightline, Aggressor takes the close-range duel, Rotator pinches from off-angle.",
            "Rotation read: at ring 2 close, decide to fight or rotate based on adjacent squad count — never engage 3-team fights without info advantage.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Off-angle hold on Magic Mosses: Marksman on the unconventional sightline, Aggressor draws aggro on main, Support trades, Rotator pre-pings third party.",
        callouts: ["Tower", "Loot Houses", "Forest", "Side Path", "Bridge", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for close-range hold",
          "Marksman: Sniper / DMR holds long sightline",
          "Rotator: Mobility item ready for the inevitable rotation",
          "Support: Heals + Wall for cover; protects squad through the contest",
        ],
        premiumTactics: {
          runouts: [
            { from: "Tower", target: "incoming squad rotation path", timing: "Ring 4-5 close — punish squads forced into your zone" },
            { from: "Side ridge", target: "flanking third party", timing: "Mid-fight — peel for teammate that engaged first" },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main approach — most pushes commit from the same path each round.",
            "Save the off-angle Marksman shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Tower with the Aggressor — if entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "High ground: Marksman holds the highest available ridge, Support drops heals from above, Aggressor pulls duel from below.",
            "Off-angle anchor in Tower forces push to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Final ring positioning: Marksman pre-aims most-likely rotation path, Aggressor body-blocks the choke, Support cycles heals on the cleanup.",
          ],
        },
      },
    },
    "foxy-faulks": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Edge drop on Foxy Faulks: land outside the contested zone, Rotator scouts threats, Support loots up. Push Center Plaza when full kit; do not rush undergeared.",
        callouts: ["Center Plaza", "Loot Buildings", "Rooftops", "Side Streets", "Spawn Path", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for entry frag; mobility item for repositioning",
          "Marksman: Sniper / DMR for long sightline; AR for mid-range trade",
          "Rotator: Mobility item priority (Launch Pad / Crash Pad / Shockwave)",
          "Support: Heals + Wall item for cover; protects rotation",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Foxy Faulks primary drop", from: "Center Plaza", use: "Hot-drop loot priority — secure tier-1 weapons + heals before contesting building." },
            { spawn: "Foxy Faulks edge drop", from: "Outer ridge", use: "Safer drop — loot full kit before pushing main building." },
          ],
          spawnKillSpots: [
            { from: "Center Plaza", target: "contested squad on adjacent loot pile", risk: "Medium — third party from any direction", reward: "Squad wipe + loot consolidation in early game" },
          ],
          advancedSetups: [
            "Mobility chain: Aggressor uses Crash Pad to commit, Rotator follows with Launch Pad, Support throws heals during the push.",
            "Squad comp synergy: Marksman pre-aims long sightline, Aggressor takes the close-range duel, Rotator pinches from off-angle.",
            "Rotation read: at ring 2 close, decide to fight or rotate based on adjacent squad count — never engage 3-team fights without info advantage.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Off-angle hold on Foxy Faulks: Marksman on the unconventional sightline, Aggressor draws aggro on main, Support trades, Rotator pre-pings third party.",
        callouts: ["Center Plaza", "Loot Buildings", "Rooftops", "Side Streets", "Spawn Path", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for close-range hold",
          "Marksman: Sniper / DMR holds long sightline",
          "Rotator: Mobility item ready for the inevitable rotation",
          "Support: Heals + Wall for cover; protects squad through the contest",
        ],
        premiumTactics: {
          runouts: [
            { from: "Center Plaza", target: "incoming squad rotation path", timing: "Ring 4-5 close — punish squads forced into your zone" },
            { from: "Side ridge", target: "flanking third party", timing: "Mid-fight — peel for teammate that engaged first" },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main approach — most pushes commit from the same path each round.",
            "Save the off-angle Marksman shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Center Plaza with the Aggressor — if entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "High ground: Marksman holds the highest available ridge, Support drops heals from above, Aggressor pulls duel from below.",
            "Off-angle anchor in Center Plaza forces push to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Final ring positioning: Marksman pre-aims most-likely rotation path, Aggressor body-blocks the choke, Support cycles heals on the cleanup.",
          ],
        },
      },
    },
    "demons-domain": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Hot drop on Demon's Domain: Aggressor entries for the early frag, Marksman holds long sightline from Castle, Rotator scouts incoming squads, Support loots up. Force loot consolidation before third party arrives. Castle vertical pressure denies the standard hold.",
        callouts: ["Castle", "Loot Houses", "Tower", "Side Path", "Forest Edge", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for entry frag; mobility item for repositioning",
          "Marksman: Sniper / DMR for long sightline; AR for mid-range trade",
          "Rotator: Mobility item priority (Launch Pad / Crash Pad / Shockwave)",
          "Support: Heals + Wall item for cover; protects rotation",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Demon's Domain primary drop", from: "Castle", use: "Hot-drop loot priority — secure tier-1 weapons + heals before contesting building." },
            { spawn: "Demon's Domain edge drop", from: "Outer ridge", use: "Safer drop — loot full kit before pushing main building." },
          ],
          spawnKillSpots: [
            { from: "Castle", target: "contested squad on adjacent loot pile", risk: "Medium — third party from any direction", reward: "Squad wipe + loot consolidation in early game" },
          ],
          advancedSetups: [
            "Mobility chain: Aggressor uses Crash Pad to commit, Rotator follows with Launch Pad, Support throws heals during the push.",
            "Squad comp synergy: Marksman pre-aims long sightline, Aggressor takes the close-range duel, Rotator pinches from off-angle.",
            "Rotation read: at ring 2 close, decide to fight or rotate based on adjacent squad count — never engage 3-team fights without info advantage.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Final ring hold on Demon's Domain: Marksman picks rotators, Aggressor body-blocks the standard push, Support cycles heals, Rotator watches for late approaches. Tower + Side Path cross-fire wins the standard contest.",
        callouts: ["Castle", "Loot Houses", "Tower", "Side Path", "Forest Edge", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for close-range hold",
          "Marksman: Sniper / DMR holds long sightline",
          "Rotator: Mobility item ready for the inevitable rotation",
          "Support: Heals + Wall for cover; protects squad through the contest",
        ],
        premiumTactics: {
          runouts: [
            { from: "Castle", target: "incoming squad rotation path", timing: "Ring 4-5 close — punish squads forced into your zone" },
            { from: "Side ridge", target: "flanking third party", timing: "Mid-fight — peel for teammate that engaged first" },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard vertical / rooftop — most pushes commit from the same path each round.",
            "Save the off-angle Marksman shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Castle with the Aggressor — if entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "High ground: Marksman holds the highest available ridge, Support drops heals from above, Aggressor pulls duel from below.",
            "Off-angle anchor in Castle forces push to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Final ring positioning: Marksman pre-aims most-likely rotation path, Aggressor body-blocks the choke, Support cycles heals on the cleanup.",
          ],
        },
      },
    },
    "brutal-beachhead": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Hot drop on Brutal Beachhead: Aggressor entries for the early frag, Marksman holds long sightline from Beach, Rotator scouts incoming squads, Support loots up. Force loot consolidation before third party arrives. Beach approach is open — Support smokes for cover on the loot run.",
        callouts: ["Beach", "Loot Buildings", "Coast", "Side Path", "Spawn Path", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for entry frag; mobility item for repositioning",
          "Marksman: Sniper / DMR for long sightline; AR for mid-range trade",
          "Rotator: Mobility item priority (Launch Pad / Crash Pad / Shockwave)",
          "Support: Heals + Wall item for cover; protects rotation",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Brutal Beachhead primary drop", from: "Beach", use: "Hot-drop loot priority — secure tier-1 weapons + heals before contesting building." },
            { spawn: "Brutal Beachhead edge drop", from: "Outer ridge", use: "Safer drop — loot full kit before pushing main building." },
          ],
          spawnKillSpots: [
            { from: "Beach", target: "contested squad on adjacent loot pile", risk: "Medium — third party from any direction", reward: "Squad wipe + loot consolidation in early game" },
          ],
          advancedSetups: [
            "Mobility chain: Aggressor uses Crash Pad to commit, Rotator follows with Launch Pad, Support throws heals during the push.",
            "Squad comp synergy: Marksman pre-aims long sightline, Aggressor takes the close-range duel, Rotator pinches from off-angle.",
            "Rotation read: at ring 2 close, decide to fight or rotate based on adjacent squad count — never engage 3-team fights without info advantage.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Final ring hold on Brutal Beachhead: Marksman picks rotators, Aggressor body-blocks the standard push, Support cycles heals, Rotator watches for late approaches. Rooftop hold with Coast trade is the standard hold.",
        callouts: ["Beach", "Loot Buildings", "Coast", "Side Path", "Spawn Path", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for close-range hold",
          "Marksman: Sniper / DMR holds long sightline",
          "Rotator: Mobility item ready for the inevitable rotation",
          "Support: Heals + Wall for cover; protects squad through the contest",
        ],
        premiumTactics: {
          runouts: [
            { from: "Beach", target: "incoming squad rotation path", timing: "Ring 4-5 close — punish squads forced into your zone" },
            { from: "Side ridge", target: "flanking third party", timing: "Mid-fight — peel for teammate that engaged first" },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main approach — most pushes commit from the same path each round.",
            "Save the off-angle Marksman shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Beach with the Aggressor — if entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "High ground: Marksman holds the highest available ridge, Support drops heals from above, Aggressor pulls duel from below.",
            "Off-angle anchor in Beach forces push to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Final ring positioning: Marksman pre-aims most-likely rotation path, Aggressor body-blocks the choke, Support cycles heals on the cleanup.",
          ],
        },
      },
    },
    "shogun-x": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Late-game push into Shogun's X-tate: Marksman scans the holding squad, Aggressor flanks via mobility item, Support preps heals. Force the fight before zone closes.",
        callouts: ["Temple", "Loot Houses", "Garden", "Side Path", "Bridge", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for entry frag; mobility item for repositioning",
          "Marksman: Sniper / DMR for long sightline; AR for mid-range trade",
          "Rotator: Mobility item priority (Launch Pad / Crash Pad / Shockwave)",
          "Support: Heals + Wall item for cover; protects rotation",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Shogun's X-tate primary drop", from: "Temple", use: "Hot-drop loot priority — secure tier-1 weapons + heals before contesting building." },
            { spawn: "Shogun's X-tate edge drop", from: "Outer ridge", use: "Safer drop — loot full kit before pushing main building." },
          ],
          spawnKillSpots: [
            { from: "Temple", target: "contested squad on adjacent loot pile", risk: "Medium — third party from any direction", reward: "Squad wipe + loot consolidation in early game" },
          ],
          advancedSetups: [
            "Mobility chain: Aggressor uses Crash Pad to commit, Rotator follows with Launch Pad, Support throws heals during the push.",
            "Squad comp synergy: Marksman pre-aims long sightline, Aggressor takes the close-range duel, Rotator pinches from off-angle.",
            "Rotation read: at ring 2 close, decide to fight or rotate based on adjacent squad count — never engage 3-team fights without info advantage.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Stack Shogun's X-tate with high ground: Marksman on ridge, Aggressor anchor, Support on heal cycle, Rotator scouting. Push only when ring forces movement.",
        callouts: ["Temple", "Loot Houses", "Garden", "Side Path", "Bridge", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for close-range hold",
          "Marksman: Sniper / DMR holds long sightline",
          "Rotator: Mobility item ready for the inevitable rotation",
          "Support: Heals + Wall for cover; protects squad through the contest",
        ],
        premiumTactics: {
          runouts: [
            { from: "Temple", target: "incoming squad rotation path", timing: "Ring 4-5 close — punish squads forced into your zone" },
            { from: "Side ridge", target: "flanking third party", timing: "Mid-fight — peel for teammate that engaged first" },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main approach — most pushes commit from the same path each round.",
            "Save the off-angle Marksman shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Temple with the Aggressor — if entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "High ground: Marksman holds the highest available ridge, Support drops heals from above, Aggressor pulls duel from below.",
            "Off-angle anchor in Temple forces push to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Final ring positioning: Marksman pre-aims most-likely rotation path, Aggressor body-blocks the choke, Support cycles heals on the cleanup.",
          ],
        },
      },
    },
    "masked-meadows": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Mid-game rotation through Masked Meadows: Marksman scans the contested zone, Aggressor positions for the third party, Support preps healing. Take Field as a transit point, not a fight commit.",
        callouts: ["Field", "Loot Houses", "Forest", "Side Path", "Bridge", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for entry frag; mobility item for repositioning",
          "Marksman: Sniper / DMR for long sightline; AR for mid-range trade",
          "Rotator: Mobility item priority (Launch Pad / Crash Pad / Shockwave)",
          "Support: Heals + Wall item for cover; protects rotation",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Masked Meadows primary drop", from: "Field", use: "Hot-drop loot priority — secure tier-1 weapons + heals before contesting building." },
            { spawn: "Masked Meadows edge drop", from: "Outer ridge", use: "Safer drop — loot full kit before pushing main building." },
          ],
          spawnKillSpots: [
            { from: "Field", target: "contested squad on adjacent loot pile", risk: "Medium — third party from any direction", reward: "Squad wipe + loot consolidation in early game" },
          ],
          advancedSetups: [
            "Mobility chain: Aggressor uses Crash Pad to commit, Rotator follows with Launch Pad, Support throws heals during the push.",
            "Squad comp synergy: Marksman pre-aims long sightline, Aggressor takes the close-range duel, Rotator pinches from off-angle.",
            "Rotation read: at ring 2 close, decide to fight or rotate based on adjacent squad count — never engage 3-team fights without info advantage.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Hold Masked Meadows for endgame: Support places utility on chokes, Aggressor anchors the close-range fight, Marksman picks distant pushers. Rotator watches squad approach pings.",
        callouts: ["Field", "Loot Houses", "Forest", "Side Path", "Bridge", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for close-range hold",
          "Marksman: Sniper / DMR holds long sightline",
          "Rotator: Mobility item ready for the inevitable rotation",
          "Support: Heals + Wall for cover; protects squad through the contest",
        ],
        premiumTactics: {
          runouts: [
            { from: "Field", target: "incoming squad rotation path", timing: "Ring 4-5 close — punish squads forced into your zone" },
            { from: "Side ridge", target: "flanking third party", timing: "Mid-fight — peel for teammate that engaged first" },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main approach — most pushes commit from the same path each round.",
            "Save the off-angle Marksman shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Field with the Aggressor — if entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "High ground: Marksman holds the highest available ridge, Support drops heals from above, Aggressor pulls duel from below.",
            "Off-angle anchor in Field forces push to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Final ring positioning: Marksman pre-aims most-likely rotation path, Aggressor body-blocks the choke, Support cycles heals on the cleanup.",
          ],
        },
      },
    },
    "open-air-onsen": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Squad split on Open-Air Onsen: Aggressor + Rotator take Spa Center, Support + Marksman loot the outer ring. Reconvene on next ring callout — do not split past 100m.",
        callouts: ["Spa Center", "Loot Buildings", "Forest", "Side Path", "Bridge", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for entry frag; mobility item for repositioning",
          "Marksman: Sniper / DMR for long sightline; AR for mid-range trade",
          "Rotator: Mobility item priority (Launch Pad / Crash Pad / Shockwave)",
          "Support: Heals + Wall item for cover; protects rotation",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Open-Air Onsen primary drop", from: "Spa Center", use: "Hot-drop loot priority — secure tier-1 weapons + heals before contesting building." },
            { spawn: "Open-Air Onsen edge drop", from: "Outer ridge", use: "Safer drop — loot full kit before pushing main building." },
          ],
          spawnKillSpots: [
            { from: "Spa Center", target: "contested squad on adjacent loot pile", risk: "Medium — third party from any direction", reward: "Squad wipe + loot consolidation in early game" },
          ],
          advancedSetups: [
            "Mobility chain: Aggressor uses Crash Pad to commit, Rotator follows with Launch Pad, Support throws heals during the push.",
            "Squad comp synergy: Marksman pre-aims long sightline, Aggressor takes the close-range duel, Rotator pinches from off-angle.",
            "Rotation read: at ring 2 close, decide to fight or rotate based on adjacent squad count — never engage 3-team fights without info advantage.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Building hold on Open-Air Onsen: Support runs heal cycle, Aggressor holds the door, Marksman covers windows. Save mobility items for the inevitable spawn flip.",
        callouts: ["Spa Center", "Loot Buildings", "Forest", "Side Path", "Bridge", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for close-range hold",
          "Marksman: Sniper / DMR holds long sightline",
          "Rotator: Mobility item ready for the inevitable rotation",
          "Support: Heals + Wall for cover; protects squad through the contest",
        ],
        premiumTactics: {
          runouts: [
            { from: "Spa Center", target: "incoming squad rotation path", timing: "Ring 4-5 close — punish squads forced into your zone" },
            { from: "Side ridge", target: "flanking third party", timing: "Mid-fight — peel for teammate that engaged first" },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main approach — most pushes commit from the same path each round.",
            "Save the off-angle Marksman shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Spa Center with the Aggressor — if entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "High ground: Marksman holds the highest available ridge, Support drops heals from above, Aggressor pulls duel from below.",
            "Off-angle anchor in Spa Center forces push to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Final ring positioning: Marksman pre-aims most-likely rotation path, Aggressor body-blocks the choke, Support cycles heals on the cleanup.",
          ],
        },
      },
    },
    "twinkle-terrace": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Hot drop on Twinkle Terrace: Aggressor entries for the early frag, Marksman holds long sightline from Plaza, Rotator scouts incoming squads, Support loots up. Force loot consolidation before third party arrives.",
        callouts: ["Plaza", "Loot Buildings", "Rooftops", "Side Streets", "Spawn Path", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for entry frag; mobility item for repositioning",
          "Marksman: Sniper / DMR for long sightline; AR for mid-range trade",
          "Rotator: Mobility item priority (Launch Pad / Crash Pad / Shockwave)",
          "Support: Heals + Wall item for cover; protects rotation",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Twinkle Terrace primary drop", from: "Plaza", use: "Hot-drop loot priority — secure tier-1 weapons + heals before contesting building." },
            { spawn: "Twinkle Terrace edge drop", from: "Outer ridge", use: "Safer drop — loot full kit before pushing main building." },
          ],
          spawnKillSpots: [
            { from: "Plaza", target: "contested squad on adjacent loot pile", risk: "Medium — third party from any direction", reward: "Squad wipe + loot consolidation in early game" },
          ],
          advancedSetups: [
            "Mobility chain: Aggressor uses Crash Pad to commit, Rotator follows with Launch Pad, Support throws heals during the push.",
            "Squad comp synergy: Marksman pre-aims long sightline, Aggressor takes the close-range duel, Rotator pinches from off-angle.",
            "Rotation read: at ring 2 close, decide to fight or rotate based on adjacent squad count — never engage 3-team fights without info advantage.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Final ring hold on Twinkle Terrace: Marksman picks rotators, Aggressor body-blocks the standard push, Support cycles heals, Rotator watches for late approaches.",
        callouts: ["Plaza", "Loot Buildings", "Rooftops", "Side Streets", "Spawn Path", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for close-range hold",
          "Marksman: Sniper / DMR holds long sightline",
          "Rotator: Mobility item ready for the inevitable rotation",
          "Support: Heals + Wall for cover; protects squad through the contest",
        ],
        premiumTactics: {
          runouts: [
            { from: "Plaza", target: "incoming squad rotation path", timing: "Ring 4-5 close — punish squads forced into your zone" },
            { from: "Side ridge", target: "flanking third party", timing: "Mid-fight — peel for teammate that engaged first" },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main approach — most pushes commit from the same path each round.",
            "Save the off-angle Marksman shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Plaza with the Aggressor — if entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "High ground: Marksman holds the highest available ridge, Support drops heals from above, Aggressor pulls duel from below.",
            "Off-angle anchor in Plaza forces push to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Final ring positioning: Marksman pre-aims most-likely rotation path, Aggressor body-blocks the choke, Support cycles heals on the cleanup.",
          ],
        },
      },
    },
    "ranger-ridge": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Squad split on Ranger Ridge: Aggressor + Rotator take Ridge Top, Support + Marksman loot the outer ring. Reconvene on next ring callout — do not split past 100m.",
        callouts: ["Ridge Top", "Loot Houses", "Forest", "Side Path", "Bridge", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for entry frag; mobility item for repositioning",
          "Marksman: Sniper / DMR for long sightline; AR for mid-range trade",
          "Rotator: Mobility item priority (Launch Pad / Crash Pad / Shockwave)",
          "Support: Heals + Wall item for cover; protects rotation",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Ranger Ridge primary drop", from: "Ridge Top", use: "Hot-drop loot priority — secure tier-1 weapons + heals before contesting building." },
            { spawn: "Ranger Ridge edge drop", from: "Outer ridge", use: "Safer drop — loot full kit before pushing main building." },
          ],
          spawnKillSpots: [
            { from: "Ridge Top", target: "contested squad on adjacent loot pile", risk: "Medium — third party from any direction", reward: "Squad wipe + loot consolidation in early game" },
          ],
          advancedSetups: [
            "Mobility chain: Aggressor uses Crash Pad to commit, Rotator follows with Launch Pad, Support throws heals during the push.",
            "Squad comp synergy: Marksman pre-aims long sightline, Aggressor takes the close-range duel, Rotator pinches from off-angle.",
            "Rotation read: at ring 2 close, decide to fight or rotate based on adjacent squad count — never engage 3-team fights without info advantage.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Building hold on Ranger Ridge: Support runs heal cycle, Aggressor holds the door, Marksman covers windows. Save mobility items for the inevitable spawn flip.",
        callouts: ["Ridge Top", "Loot Houses", "Forest", "Side Path", "Bridge", "Storm Edge", "Storm Center"],
        utility: [
          "Aggressor: SMG / Shotgun for close-range hold",
          "Marksman: Sniper / DMR holds long sightline",
          "Rotator: Mobility item ready for the inevitable rotation",
          "Support: Heals + Wall for cover; protects squad through the contest",
        ],
        premiumTactics: {
          runouts: [
            { from: "Ridge Top", target: "incoming squad rotation path", timing: "Ring 4-5 close — punish squads forced into your zone" },
            { from: "Side ridge", target: "flanking third party", timing: "Mid-fight — peel for teammate that engaged first" },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main approach — most pushes commit from the same path each round.",
            "Save the off-angle Marksman shot for the eco round — switching position forces re-clearing.",
            "Trade-stack Ridge Top with the Aggressor — if entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "High ground: Marksman holds the highest available ridge, Support drops heals from above, Aggressor pulls duel from below.",
            "Off-angle anchor in Ridge Top forces push to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Final ring positioning: Marksman pre-aims most-likely rotation path, Aggressor body-blocks the choke, Support cycles heals on the cleanup.",
          ],
        },
      },
    },
  },
}

export default STRATS
