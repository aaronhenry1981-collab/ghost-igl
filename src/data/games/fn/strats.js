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
  "br-current": {
    "tilted-towers": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Rotating IN to Tilted Towers: Tilted is always contested — third party is the bigger threat than the held squad. Drop edge buildings first, push center on contest signal. Marksman covers from off-angle high ground.",
        callouts: ["Tilted Center", "Clocktower", "Loot Lake", "Outer Buildings", "Rooftops", "Skywalk", "Storm Edge"],
        utility: [
          "Aggressor: SMG / Shotgun for entry frag; mobility for repositioning",
          "Marksman: Sniper / DMR for long sightline; AR mid-range",
          "Rotator: Mobility item (Launch Pad / Crash Pad)",
          "Support: Heals + Wall for cover; protects rotation",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Tilted edge drop", from: "Outer Buildings", use: "Safer drop — loot full kit before pushing center contest." },
            { spawn: "Clocktower hot drop", from: "Center", use: "Hot drop top tier-3 loot, contest squad on touchdown." },
          ],
          spawnKillSpots: [
            { from: "Rooftops", target: "contested squad on Loot Lake", risk: "Medium — third party from any direction", reward: "Squad wipe + loot consolidation" },
          ],
          advancedSetups: [
            "Third-party timing: wait for two squads to engage Tilted, push survivor.",
            "Skywalk vertical commit on mobility chain.",
            "Rotation read: storm edge proximity = commit timer.",
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
        strategy: "Holding FROM Tilted Towers: Support heals cycle, Aggressor holds doorway, Marksman covers windows. Save mobility for the inevitable storm rotation.",
        callouts: ["Tilted Center", "Clocktower", "Loot Lake", "Outer Buildings", "Rooftops", "Skywalk", "Storm Edge"],
        utility: [
          "Aggressor: SMG / Shotgun for close-range hold",
          "Marksman: Sniper / DMR for long sightline",
          "Rotator: Mobility ready for storm rotation",
          "Support: Heals + Wall for cover",
        ],
        premiumTactics: {
          runouts: [
            { from: "Clocktower", target: "incoming squad rotation", timing: "Ring 4-5 close — punish forced rotation" },
            { from: "Rooftops", target: "flanking third party", timing: "Mid-fight peel for teammate" },
          ],
          antiSpawnPeek: [
            "Pre-aim Skywalk approach — most pushes commit through there.",
            "Save Marksman off-angle for eco third party.",
            "Trade-stack Clocktower with Aggressor.",
          ],
          advancedSetups: [
            "High ground hold: Marksman ridge, Support heals from above.",
            "Off-angle anchor on Rooftops forces clear of vertical, buys 2-3s.",
            "Final ring: pre-aim rotation path, body-block choke.",
          ],
        },
      },
    },
    "the-citadel": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Rotating IN to The Citadel: castle POI with tower verticality. Drop outer walls first, push interior on contest signal. Marksman covers from tower battlements.",
        callouts: ["Citadel Center", "Tower", "Outer Walls", "Throne Room", "Drawbridge", "Roof", "Storm Edge"],
        utility: [
          "Aggressor: SMG / Shotgun entry",
          "Marksman: Sniper from Tower battlements",
          "Rotator: Mobility for vertical rotates",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Outer Wall drop", from: "Outer Walls", use: "Safer drop — loot kit before pushing Citadel interior." },
            { spawn: "Tower hot drop", from: "Tower", use: "Top vertical loot, contest squad on touchdown." },
          ],
          spawnKillSpots: [
            { from: "Tower", target: "contested squad in courtyard", risk: "Medium — exposed vertical", reward: "Squad wipe + height advantage" },
          ],
          advancedSetups: [
            "Tower vertical: claim Tower top for sightline control.",
            "Drawbridge denial: Marksman covers main approach.",
            "Third-party timing on Citadel.",
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
        strategy: "Holding FROM The Citadel: Marksman from Tower, Aggressor Drawbridge, Support heal cycle.",
        callouts: ["Citadel Center", "Tower", "Outer Walls", "Throne Room", "Drawbridge", "Roof", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun Drawbridge",
          "Marksman: Tower long sightline",
          "Rotator: Mobility for storm rotation",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          runouts: [
            { from: "Tower", target: "incoming squad approach", timing: "Ring 4-5 close — punish rotation" },
            { from: "Drawbridge", target: "flanking third party", timing: "Mid-fight peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim main approach.",
            "Save Marksman Tower for eco party.",
          ],
          advancedSetups: [
            "Tower hold: Marksman vertical advantage.",
            "Off-angle Roof denial.",
            "Final ring: pre-aim rotation path.",
          ],
        },
      },
    },
    "reckless-railways": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Rotating IN to Reckless Railways: train-themed POI with long sightlines along tracks. Marksman covers tracks, Aggressor pushes via station building.",
        callouts: ["Station", "Tracks", "Train Cars", "Platform", "Side Tunnel", "Rooftop", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun for station entry",
          "Marksman: Sniper for tracks long sightline",
          "Rotator: Mobility for tracks rotation",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Station drop", from: "Platform", use: "Station has tier-2 loot — loot before contesting." },
            { spawn: "Tracks rotation", from: "Train Cars", use: "Use tracks as fast rotation route." },
          ],
          spawnKillSpots: [
            { from: "Rooftop", target: "contested squad on Platform", risk: "Medium — third party from tracks", reward: "Squad wipe + loot consolidation" },
          ],
          advancedSetups: [
            "Tracks long-shot: Marksman pre-aims tracks corridor.",
            "Station vertical commit.",
            "Third-party timing on tracks.",
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
        strategy: "Holding FROM Reckless Railways: Marksman covers tracks, Aggressor holds station, Support heals.",
        callouts: ["Station", "Tracks", "Train Cars", "Platform", "Side Tunnel", "Rooftop", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun station hold",
          "Marksman: Tracks long sightline",
          "Rotator: Mobility for storm",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          runouts: [
            { from: "Tracks", target: "incoming squad rotation", timing: "Ring close punish" },
            { from: "Rooftop", target: "flanking third party", timing: "Mid-fight peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Platform approach.",
            "Save Marksman tracks for eco party.",
          ],
          advancedSetups: [
            "Tracks denial: Marksman long-shot pre-aim.",
            "Station hold: Aggressor pre-grenade entry.",
            "Final ring: pre-aim rotation path.",
          ],
        },
      },
    },
    "mythic-poi": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Rotating IN to Mythic POI: rotating boss POI with mythic loot. Wait for boss kill, then contest the mythic squad on weak HP.",
        callouts: ["Boss Room", "Loot Vault", "Outer Approach", "Side Buildings", "Rooftop", "Cave", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun boss room entry",
          "Marksman: Sniper for long shot",
          "Rotator: Mobility for rotation",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Boss Room contest", from: "Outer Approach", use: "Wait for boss kill, contest squad on low HP." },
            { spawn: "Side flank", from: "Cave", use: "Cave flank for back-line trade." },
          ],
          spawnKillSpots: [
            { from: "Rooftop", target: "mythic squad on boss kill", risk: "Medium — third party from any direction", reward: "Mythic loot + squad wipe" },
          ],
          advancedSetups: [
            "Boss kill timing: contest immediately on low HP.",
            "Mythic loot priority — disengage if no contest.",
            "Third-party timing on Mythic POI.",
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
        strategy: "Holding FROM Mythic POI: post-mythic kill, defend the contest. Marksman covers from Rooftop, Aggressor holds Boss Room.",
        callouts: ["Boss Room", "Loot Vault", "Outer Approach", "Side Buildings", "Rooftop", "Cave", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun boss room hold",
          "Marksman: Rooftop long sightline",
          "Rotator: Mobility for storm",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          runouts: [
            { from: "Outer Approach", target: "incoming contest squad", timing: "Post-boss kill — pre-position" },
            { from: "Cave", target: "flanking third party", timing: "Mid-fight peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Outer Approach.",
            "Mythic loot — heal fully before contest.",
          ],
          advancedSetups: [
            "Post-boss heal cycle: Support priority.",
            "Mythic denial: Marksman pre-aim approach.",
            "Final ring: pre-aim rotation path.",
          ],
        },
      },
    },
    "coastal": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Rotating IN to Coastal: beach-side POI with boats and dock cover. Marksman from cliff, Aggressor pushes dock, Rotator uses boat for water rotation.",
        callouts: ["Beach", "Dock", "Boat Spawn", "Cliffside", "Side Cave", "Houses", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun dock entry",
          "Marksman: Cliffside long sightline",
          "Rotator: Boat for water rotation",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Dock contest", from: "Houses", use: "Push Dock via Houses, Aggressor + Support heal cycle." },
            { spawn: "Cave flank", from: "Side Cave", use: "Cave flank for back-line trade." },
          ],
          spawnKillSpots: [
            { from: "Cliffside", target: "contested squad on Dock", risk: "Medium — third party from beach", reward: "Squad wipe + boat rotation" },
          ],
          advancedSetups: [
            "Cliffside Marksman take pre-fight.",
            "Boat rotation: water travel post-fight.",
            "Third-party timing on Coastal.",
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
        strategy: "Holding FROM Coastal: Marksman Cliffside, Aggressor Dock, Support heal cycle.",
        callouts: ["Beach", "Dock", "Boat Spawn", "Cliffside", "Side Cave", "Houses", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun dock hold",
          "Marksman: Cliffside long sightline",
          "Rotator: Boat for storm rotation",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          runouts: [
            { from: "Houses", target: "incoming squad", timing: "Ring close punish" },
            { from: "Cave", target: "flanking third party", timing: "Mid-fight peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Houses approach.",
            "Save Marksman Cliffside for eco party.",
          ],
          advancedSetups: [
            "Cliffside Marksman denial.",
            "Dock hold: Aggressor pre-grenade.",
            "Final ring: pre-aim rotation.",
          ],
        },
      },
    },
  },
  "reload": {
    "lavish-lair": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Reload Lavish Lair is the mansion POI with tier-3 vault. Reload mode = respawn on teammate alive — push aggressively. Mansion vault loot is tier-3.",
        callouts: ["Mansion", "Vault", "Roof", "Side Garden", "Front Lawn", "Storm Edge", "Tunnel"],
        utility: [
          "Aggressor: SMG/Shotgun mansion entry",
          "Marksman: Sniper from Roof",
          "Rotator: Mobility for vault grab",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Mansion vault push", from: "Front Lawn", use: "Push mansion via Front Lawn, secure vault loot." },
            { spawn: "Side Garden flank", from: "Tunnel", use: "Side Garden off-angle entry." },
          ],
          spawnKillSpots: [
            { from: "Roof", target: "vault contest squad", risk: "Medium — third party respawn", reward: "Vault loot + squad wipe" },
          ],
          advancedSetups: [
            "Reload respawn play: keep one teammate alive for respawn cycle.",
            "Vault priority: secure tier-3 loot first.",
            "Third-party timing on vault contests.",
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
        strategy: "Hold Lavish Lair Mansion: Marksman Roof, Aggressor doors, Support heals. Reload respawn means trade for re-engage.",
        callouts: ["Mansion", "Vault", "Roof", "Side Garden", "Front Lawn", "Storm Edge", "Tunnel"],
        utility: [
          "Aggressor: SMG/Shotgun mansion hold",
          "Marksman: Roof long sightline",
          "Rotator: Mobility for respawn cycle",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Garden", target: "incoming squad", timing: "Setup pre-position" },
            { from: "Roof", target: "flanking third party", timing: "Mid-fight peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Front Lawn.",
            "Save Marksman Roof for eco third party.",
          ],
          advancedSetups: [
            "Reload respawn play: keep one teammate alive.",
            "Vault denial: Marksman pre-aim vault contest.",
            "Final ring: pre-aim rotation.",
          ],
        },
      },
    },
    "hazy-hillside": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Reload Hazy Hillside is the foggy elevation POI. Marksman from hilltop, Aggressor pushes via Side Path. Reload respawn aggressive play.",
        callouts: ["Hilltop", "Side Path", "Fog Cover", "Cottage", "Open Valley", "Storm Edge", "Cave"],
        utility: [
          "Aggressor: SMG/Shotgun entry",
          "Marksman: Hilltop long sightline",
          "Rotator: Mobility for rotation",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Hilltop take", from: "Side Path", use: "Push Hilltop for sightline control." },
            { spawn: "Cottage flank", from: "Cave", use: "Cottage off-angle entry." },
          ],
          spawnKillSpots: [
            { from: "Hilltop", target: "contested squad in valley", risk: "Medium — third party respawn", reward: "Height advantage + squad wipe" },
          ],
          advancedSetups: [
            "Reload respawn play.",
            "Fog cover: rotate under fog for surprise.",
            "Third-party timing.",
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
        strategy: "Hold Hazy Hillside: Marksman Hilltop, Aggressor Cottage, Support heals.",
        callouts: ["Hilltop", "Side Path", "Fog Cover", "Cottage", "Open Valley", "Storm Edge", "Cave"],
        utility: [
          "Aggressor: SMG/Shotgun Cottage hold",
          "Marksman: Hilltop long sightline",
          "Rotator: Mobility for respawn cycle",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Path", target: "incoming squad", timing: "Setup pre-position" },
            { from: "Cave", target: "flanking third party", timing: "Mid-fight peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Cottage approach.",
            "Save Marksman Hilltop for eco party.",
          ],
          advancedSetups: [
            "Reload respawn play.",
            "Fog denial: pre-aim path.",
            "Final ring: pre-aim rotation.",
          ],
        },
      },
    },
    "ritzy-riviera": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Reload Ritzy Riviera is the beachfront resort POI. Aggressor pushes pool deck, Marksman from Hotel balcony, Rotator water rotation.",
        callouts: ["Hotel", "Pool Deck", "Cabanas", "Beach", "Marina", "Rooftop", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun pool deck entry",
          "Marksman: Hotel balcony",
          "Rotator: Water mobility",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Pool deck push", from: "Beach", use: "Push pool via Beach, Aggressor + Support heal cycle." },
            { spawn: "Cabana flank", from: "Marina", use: "Cabana off-angle entry." },
          ],
          spawnKillSpots: [
            { from: "Rooftop", target: "contested squad on pool", risk: "Medium — third party respawn", reward: "Squad wipe + loot" },
          ],
          advancedSetups: [
            "Reload respawn play.",
            "Pool hazard: boop into pool for splash.",
            "Third-party timing.",
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
        strategy: "Hold Ritzy Riviera: Marksman Rooftop, Aggressor pool deck, Support heals.",
        callouts: ["Hotel", "Pool Deck", "Cabanas", "Beach", "Marina", "Rooftop", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun pool hold",
          "Marksman: Rooftop long sightline",
          "Rotator: Water mobility",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          runouts: [
            { from: "Beach", target: "incoming squad", timing: "Setup pre-position" },
            { from: "Rooftop", target: "flanking third party", timing: "Mid-fight peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Beach approach.",
            "Don't anchor near pool edge.",
          ],
          advancedSetups: [
            "Reload respawn play.",
            "Pool hazard boop.",
            "Final ring: pre-aim rotation.",
          ],
        },
      },
    },
    "forbidden-falls": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Reload Forbidden Falls is the waterfall mountain POI. Marksman from cliff perch, Aggressor pushes via cave, Rotator water rotation.",
        callouts: ["Waterfall", "Cave", "Mountain Top", "Side Trail", "Pond", "Cliff", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun cave entry",
          "Marksman: Cliff long sightline",
          "Rotator: Water for fast rotation",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Cave push", from: "Side Trail", use: "Push cave entry with Aggressor + Support heal." },
            { spawn: "Mountain Top take", from: "Pond", use: "Mountain Top for sightline control." },
          ],
          spawnKillSpots: [
            { from: "Cliff", target: "contested squad in cave", risk: "Medium — third party respawn", reward: "Height advantage + squad wipe" },
          ],
          advancedSetups: [
            "Reload respawn play.",
            "Cliff long-shot: Marksman pre-aim.",
            "Third-party timing.",
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
        strategy: "Hold Forbidden Falls: Marksman Cliff, Aggressor Cave, Support heals.",
        callouts: ["Waterfall", "Cave", "Mountain Top", "Side Trail", "Pond", "Cliff", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun cave hold",
          "Marksman: Cliff long sightline",
          "Rotator: Water mobility",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Trail", target: "incoming squad", timing: "Setup pre-position" },
            { from: "Cliff", target: "flanking third party", timing: "Mid-fight peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Cave entry.",
            "Save Marksman Cliff for eco party.",
          ],
          advancedSetups: [
            "Reload respawn play.",
            "Cliff long-shot denial.",
            "Final ring: pre-aim rotation.",
          ],
        },
      },
    },
    "salty-springs": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Reload Salty Springs is the classic suburban POI. Multi-house close-quarters fights, Aggressor enters via doorway, Marksman covers from yellow house.",
        callouts: ["Yellow House", "Blue House", "Gas Station", "Front Yards", "Backyards", "Center Road", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun house entry",
          "Marksman: Yellow house upstairs",
          "Rotator: Mobility for rotation",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Yellow House push", from: "Front Yards", use: "Push Yellow House via Front Yard." },
            { spawn: "Blue House flank", from: "Backyards", use: "Blue House off-angle entry." },
          ],
          spawnKillSpots: [
            { from: "Yellow House Roof", target: "contested squad in Blue House", risk: "Medium — third party respawn", reward: "Squad wipe + height advantage" },
          ],
          advancedSetups: [
            "Reload respawn play.",
            "House clear: Aggressor stun + frag chain.",
            "Third-party timing.",
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
        strategy: "Hold Salty Springs: Marksman upstairs window, Aggressor doorway, Support heals.",
        callouts: ["Yellow House", "Blue House", "Gas Station", "Front Yards", "Backyards", "Center Road", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun house hold",
          "Marksman: Upstairs window",
          "Rotator: Mobility for respawn cycle",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          runouts: [
            { from: "Backyards", target: "incoming squad", timing: "Setup pre-position" },
            { from: "Center Road", target: "flanking third party", timing: "Mid-fight peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Front Yards.",
            "Save Marksman upstairs for eco party.",
          ],
          advancedSetups: [
            "Reload respawn play.",
            "House defense: corner trade.",
            "Final ring: pre-aim rotation.",
          ],
        },
      },
    },
    "tilted-towers": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "Reload Tilted Towers is the iconic high-rise POI with vertical loot. Marksman from rooftop, Aggressor pushes via tower entry, Rotator vertical mobility.",
        callouts: ["Tilted Center", "Clocktower", "Skyscrapers", "Rooftops", "Side Buildings", "Loot Lake", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun tower entry",
          "Marksman: Rooftop long sightline",
          "Rotator: Vertical mobility",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Clocktower hot drop", from: "Tilted Center", use: "Top vertical loot, contest squad on touchdown." },
            { spawn: "Skyscrapers flank", from: "Side Buildings", use: "Vertical mobility for back-line trade." },
          ],
          spawnKillSpots: [
            { from: "Clocktower", target: "contested squad below", risk: "Medium — third party respawn", reward: "Vertical advantage + squad wipe" },
          ],
          advancedSetups: [
            "Reload respawn play.",
            "Vertical loot priority: Clocktower tier-3.",
            "Third-party timing.",
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
        strategy: "Hold Reload Tilted: Marksman rooftop, Aggressor tower doorway, Support heals.",
        callouts: ["Tilted Center", "Clocktower", "Skyscrapers", "Rooftops", "Side Buildings", "Loot Lake", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun tower hold",
          "Marksman: Rooftop long sightline",
          "Rotator: Vertical mobility for respawn",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          runouts: [
            { from: "Skyscrapers", target: "incoming squad", timing: "Setup pre-position" },
            { from: "Rooftops", target: "flanking third party", timing: "Mid-fight peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Clocktower approach.",
            "Save Marksman rooftop for eco party.",
          ],
          advancedSetups: [
            "Reload respawn play.",
            "Vertical denial: Marksman pre-aim.",
            "Final ring: pre-aim rotation.",
          ],
        },
      },
    },
  },
  "og": {
    "tilted-towers": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "OG Tilted Towers is the classic Chapter 1 high-rise POI. Drop strategically — Clocktower for tier-3, outer buildings for safer loot. Push center on contest signal.",
        callouts: ["Tilted Center", "Clocktower", "Outer Buildings", "Rooftops", "Skywalk", "Loot Lake", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun building entry",
          "Marksman: Rooftop long sightline",
          "Rotator: Mobility for rotation",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Clocktower hot drop", from: "Tilted Center", use: "Top tier-3 loot, contest on touchdown." },
            { spawn: "Outer Building drop", from: "Outer Buildings", use: "Safer drop, full kit before center push." },
          ],
          spawnKillSpots: [
            { from: "Clocktower", target: "contested squad below", risk: "Medium — third party from outer", reward: "Vertical advantage + squad wipe" },
          ],
          advancedSetups: [
            "OG classic third-party: wait for two squads to engage Tilted.",
            "Skywalk vertical commit.",
            "Storm rotation timing.",
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
        strategy: "Hold OG Tilted Towers: Marksman Rooftop, Aggressor building entry, Support heals.",
        callouts: ["Tilted Center", "Clocktower", "Outer Buildings", "Rooftops", "Skywalk", "Loot Lake", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun building hold",
          "Marksman: Rooftop long sightline",
          "Rotator: Mobility for storm",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          runouts: [
            { from: "Skywalk", target: "incoming squad", timing: "Setup pre-position" },
            { from: "Rooftops", target: "flanking third party", timing: "Mid-fight peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Clocktower approach.",
            "Save Marksman rooftop for eco party.",
          ],
          advancedSetups: [
            "OG classic hold: trade on every entry.",
            "Vertical denial: Marksman Clocktower.",
            "Final ring: pre-aim rotation.",
          ],
        },
      },
    },
    "pleasant-park": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "OG Pleasant Park is the classic suburban POI with 7 houses + soccer field. Marksman covers from Tall House, Aggressor pushes via Center Park.",
        callouts: ["Tall House", "Soccer Field", "Center Park", "Houses", "Gas Station", "Rooftops", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun house entry",
          "Marksman: Tall House top floor",
          "Rotator: Mobility for rotation",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Tall House take", from: "Houses", use: "Push Tall House for sightline control." },
            { spawn: "Soccer Field push", from: "Center Park", use: "Open commit via Soccer Field." },
          ],
          spawnKillSpots: [
            { from: "Tall House Roof", target: "contested squad in houses", risk: "Medium — third party from any direction", reward: "Height advantage + squad wipe" },
          ],
          advancedSetups: [
            "OG classic: Tall House controls Pleasant.",
            "House clear: stun + frag chain.",
            "Third-party timing.",
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
        strategy: "Hold Pleasant Park: Marksman Tall House, Aggressor house corner, Support heals.",
        callouts: ["Tall House", "Soccer Field", "Center Park", "Houses", "Gas Station", "Rooftops", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun house hold",
          "Marksman: Tall House top",
          "Rotator: Mobility for storm",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          runouts: [
            { from: "Soccer Field", target: "incoming squad", timing: "Setup pre-position" },
            { from: "Rooftops", target: "flanking third party", timing: "Mid-fight peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Center Park approach.",
            "Save Marksman Tall House for eco party.",
          ],
          advancedSetups: [
            "OG classic hold: Tall House sustain.",
            "House defense: corner trade.",
            "Final ring: pre-aim rotation.",
          ],
        },
      },
    },
    "retail-row": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "OG Retail Row is the strip mall POI with tier-2 shop loot. Aggressor pushes via parking, Marksman from Houses across.",
        callouts: ["Strip Mall", "Parking", "Houses", "Side Path", "Rooftops", "Gas Station", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun shop entry",
          "Marksman: Houses top floor",
          "Rotator: Mobility for rotation",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Strip Mall push", from: "Parking", use: "Push shops via Parking, Marksman covers." },
            { spawn: "House flank", from: "Side Path", use: "House flank for back-line trade." },
          ],
          spawnKillSpots: [
            { from: "Rooftops", target: "contested squad in shops", risk: "Medium — third party from any direction", reward: "Squad wipe + loot consolidation" },
          ],
          advancedSetups: [
            "Shop clear: stun + frag chain.",
            "OG classic Marksman from Houses.",
            "Third-party timing.",
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
        strategy: "Hold Retail Row: Marksman Houses, Aggressor shop corner, Support heals.",
        callouts: ["Strip Mall", "Parking", "Houses", "Side Path", "Rooftops", "Gas Station", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun shop hold",
          "Marksman: Houses top floor",
          "Rotator: Mobility for storm",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          runouts: [
            { from: "Parking", target: "incoming squad", timing: "Setup pre-position" },
            { from: "Rooftops", target: "flanking third party", timing: "Mid-fight peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Parking approach.",
            "Save Marksman Houses for eco party.",
          ],
          advancedSetups: [
            "Shop defense: corner trade.",
            "Marksman Houses denial.",
            "Final ring: pre-aim rotation.",
          ],
        },
      },
    },
    "greasy-grove": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "OG Greasy Grove is the strip mall + Durr Burger POI. Aggressor pushes Durr Burger, Marksman from gas station.",
        callouts: ["Durr Burger", "Gas Station", "Parking", "Houses", "Pool", "Side Trail", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun Durr Burger entry",
          "Marksman: Gas Station roof",
          "Rotator: Mobility for rotation",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Durr Burger push", from: "Parking", use: "Push Durr Burger via Parking." },
            { spawn: "Pool flank", from: "Side Trail", use: "Pool off-angle entry." },
          ],
          spawnKillSpots: [
            { from: "Gas Station Roof", target: "contested squad Durr Burger", risk: "Medium — third party respawn", reward: "Height advantage + squad wipe" },
          ],
          advancedSetups: [
            "OG classic Marksman gas station.",
            "Durr Burger clear: stun + frag.",
            "Third-party timing.",
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
        strategy: "Hold Greasy Grove: Marksman Gas Station, Aggressor Durr Burger, Support heals.",
        callouts: ["Durr Burger", "Gas Station", "Parking", "Houses", "Pool", "Side Trail", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun Durr Burger hold",
          "Marksman: Gas Station roof",
          "Rotator: Mobility for storm",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          runouts: [
            { from: "Parking", target: "incoming squad", timing: "Setup pre-position" },
            { from: "Pool", target: "flanking third party", timing: "Mid-fight peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Parking approach.",
            "Save Marksman Gas Station for eco party.",
          ],
          advancedSetups: [
            "OG classic hold.",
            "Marksman Gas Station denial.",
            "Final ring: pre-aim rotation.",
          ],
        },
      },
    },
    "salty-springs": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Entry / Push", priority: "essential" },
          { name: "Marksman", role: "Long-range trade", priority: "essential" },
          { name: "Rotator", role: "Mobility / Scout", priority: "recommended" },
          { name: "Support", role: "Heal / Wall", priority: "recommended" },
        ],
        strategy: "OG Salty Springs is the suburban 3-house POI with Yellow House upstairs vantage. Marksman from Yellow House, Aggressor pushes Blue House.",
        callouts: ["Yellow House", "Blue House", "Gas Station", "Front Yards", "Backyards", "Center Road", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun house entry",
          "Marksman: Yellow House upstairs",
          "Rotator: Mobility for rotation",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Yellow House take", from: "Front Yards", use: "Push Yellow House for sightline control." },
            { spawn: "Blue House flank", from: "Backyards", use: "Blue House off-angle." },
          ],
          spawnKillSpots: [
            { from: "Yellow House Roof", target: "contested squad Blue House", risk: "Medium — third party from any direction", reward: "Height advantage + squad wipe" },
          ],
          advancedSetups: [
            "OG classic Yellow House upstairs Marksman.",
            "House clear: stun + frag chain.",
            "Third-party timing.",
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
        strategy: "Hold OG Salty: Marksman Yellow House upstairs, Aggressor doorway, Support heals.",
        callouts: ["Yellow House", "Blue House", "Gas Station", "Front Yards", "Backyards", "Center Road", "Storm Edge"],
        utility: [
          "Aggressor: SMG/Shotgun house hold",
          "Marksman: Yellow House upstairs",
          "Rotator: Mobility for storm",
          "Support: Heals + Wall",
        ],
        premiumTactics: {
          runouts: [
            { from: "Front Yards", target: "incoming squad", timing: "Setup pre-position" },
            { from: "Center Road", target: "flanking third party", timing: "Mid-fight peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Front Yards.",
            "Save Marksman upstairs for eco party.",
          ],
          advancedSetups: [
            "OG classic Yellow House sustain.",
            "House defense: corner trade.",
            "Final ring: pre-aim rotation.",
          ],
        },
      },
    },
  },
  "creative-ranked": {
    "box-fight": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Box-fight Specialist", priority: "essential" },
        ],
        strategy: "Box Fight is the 1v1/2v2 build-and-edit gauntlet. Push edit plays — fast-edit doorways, piece-control with cones, take height for the kill shot. Pre-aimed shotgun + SMG combo wins box-fights.",
        callouts: ["Center Box", "Side Boxes", "Top Floor", "Doorway", "Edit Window", "Cone Stack", "Spawn"],
        utility: [
          "Aggressor: Shotgun + SMG; Edit-bind muscle memory; Cone + Wall piece-control",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Center Box push", from: "Side Boxes", use: "Edit-take Center Box on first contest — fast edits win." },
            { spawn: "Top Floor commit", from: "Cone Stack", use: "Cone-stack to Top Floor for height advantage." },
          ],
          spawnKillSpots: [
            { from: "Top Floor", target: "enemy Center Box", risk: "Medium — counter-edit possible", reward: "Height advantage + kill shot" },
          ],
          advancedSetups: [
            "Edit-take doorway: open + close edit for the surprise shot.",
            "Piece-control: cone-stack to deny enemy build.",
            "Pre-aimed shotgun + SMG combo on doorway.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Aggressor", role: "Box-fight Specialist", priority: "essential" },
        ],
        strategy: "Box Fight defense: pre-aim every doorway, edit-fake to bait enemy peek, cone-stack to take height. Reaction + edit speed wins.",
        callouts: ["Center Box", "Side Boxes", "Top Floor", "Doorway", "Edit Window", "Cone Stack", "Spawn"],
        utility: [
          "Aggressor: Shotgun + SMG; Edit-fake muscle memory; Cone + Wall piece-control",
        ],
      },
    },
    "zone-wars": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Zone Specialist", priority: "essential" },
        ],
        strategy: "Zone Wars is the ranked endgame simulator — closing zones force constant rotation. Take height first, hold the choke, push out on storm damage. Mobility chain wins.",
        callouts: ["Zone Center", "Storm Edge", "High Ground", "Side Cover", "Mobility Spot", "Build Pile", "Spawn"],
        utility: [
          "Aggressor: Mobility item priority (Crash Pad / Launch Pad); Builds + Heals",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "High ground take", from: "Mobility Spot", use: "Crash Pad to High Ground for sightline control." },
            { spawn: "Storm push", from: "Side Cover", use: "Push enemies into storm with builds." },
          ],
          spawnKillSpots: [
            { from: "High Ground", target: "enemy on storm edge", risk: "Medium — counter-take possible", reward: "Height advantage + storm pressure" },
          ],
          advancedSetups: [
            "High ground priority: first to take wins.",
            "Storm pressure: force enemy into storm with builds.",
            "Mobility chain: Crash Pad → Launch Pad → builds.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Aggressor", role: "Zone Specialist", priority: "essential" },
        ],
        strategy: "Zone Wars defense: hold high ground, build cover on storm push, heal in safe zone before contest.",
        callouts: ["Zone Center", "Storm Edge", "High Ground", "Side Cover", "Mobility Spot", "Build Pile", "Spawn"],
        utility: [
          "Aggressor: Mobility + Builds + Heals",
        ],
      },
    },
    "realistic-1v1": {
      attack: {
        operators: [
          { name: "Aggressor", role: "1v1 Specialist", priority: "essential" },
        ],
        strategy: "Realistic 1v1 is the build-free or limited-build 1v1 gauntlet. AR + Shotgun combo, pre-aim corners, listen for footsteps. Reaction + crosshair placement wins.",
        callouts: ["Center", "Side Cover", "High Ground", "Doorway", "Spawn", "Open"],
        utility: [
          "Aggressor: AR + Shotgun; Heals + minimal builds",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Center push", from: "Side Cover", use: "Push Center with AR pre-aim." },
            { spawn: "High ground", from: "Doorway", use: "Take High Ground for sightline control." },
          ],
          spawnKillSpots: [
            { from: "High Ground", target: "enemy in Center", risk: "Medium — counter-take possible", reward: "Height advantage + kill shot" },
          ],
          advancedSetups: [
            "Pre-aim corners: every Realistic 1v1 push commits through same arc.",
            "Audio priority: listen for footsteps before commit.",
            "AR + Shotgun combo: AR mid-range, Shotgun close.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Aggressor", role: "1v1 Specialist", priority: "essential" },
        ],
        strategy: "Realistic 1v1 defense: pre-aim corners, listen for footsteps, hold High Ground.",
        callouts: ["Center", "Side Cover", "High Ground", "Doorway", "Spawn", "Open"],
        utility: [
          "Aggressor: AR + Shotgun; Heals",
        ],
      },
    },
    "tycoon": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Tycoon Specialist", priority: "essential" },
        ],
        strategy: "Tycoon is the resource-gathering PvE/PvP mode. Build base, defend resources, raid enemy bases. Mobility + builds + AR loadout wins raids.",
        callouts: ["Base Center", "Resource Pile", "Side Buildings", "Raid Path", "High Ground", "Storm Edge"],
        utility: [
          "Aggressor: AR + Shotgun; Builds + Mobility",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Raid commit", from: "Raid Path", use: "Push enemy base with AR + builds." },
            { spawn: "Resource grab", from: "Resource Pile", use: "Grab resources fast, mobility chain back to base." },
          ],
          spawnKillSpots: [
            { from: "High Ground", target: "enemy raid party", risk: "Medium — counter-raid possible", reward: "Squad wipe + resource control" },
          ],
          advancedSetups: [
            "Raid timing: hit enemy when resources are full.",
            "Base defense: pre-build cover.",
            "Mobility chain for fast rotation.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Aggressor", role: "Tycoon Specialist", priority: "essential" },
        ],
        strategy: "Tycoon defense: pre-build base cover, defend resource pile, mobility for rotation.",
        callouts: ["Base Center", "Resource Pile", "Side Buildings", "Raid Path", "High Ground", "Storm Edge"],
        utility: [
          "Aggressor: AR + Shotgun; Builds + Mobility",
        ],
      },
    },
    "pit": {
      attack: {
        operators: [
          { name: "Aggressor", role: "Pit Specialist", priority: "essential" },
        ],
        strategy: "Pit is the FFA warm-up arena — fast respawn, AR + sniper combo, chase kill spread. Practice mode for ranked.",
        callouts: ["Pit Center", "Side Cover", "Sniper Tower", "Open", "Spawn", "Top Floor"],
        utility: [
          "Aggressor: AR + Sniper; Heals + fast respawn",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Sniper Tower take", from: "Open", use: "Push Sniper Tower for long-shot warm-up." },
            { spawn: "Center commit", from: "Side Cover", use: "AR cross-map kills + Sniper trade." },
          ],
          spawnKillSpots: [
            { from: "Sniper Tower", target: "Pit Center spawn pile", risk: "Medium — counter-snipe", reward: "Kill spread cycle" },
          ],
          advancedSetups: [
            "Warm-up routine: 20 mins Pit before ranked.",
            "Sniper practice: pre-aim respawn paths.",
            "Kill spread focus.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Aggressor", role: "Pit Specialist", priority: "essential" },
        ],
        strategy: "Pit defense: pre-aim respawn paths, hold Sniper Tower for long-shot practice.",
        callouts: ["Pit Center", "Side Cover", "Sniper Tower", "Open", "Spawn", "Top Floor"],
        utility: [
          "Aggressor: AR + Sniper; Heals",
        ],
      },
    },
  },
}

export default STRATS
