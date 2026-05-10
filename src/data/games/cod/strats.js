// Call of Duty — v1 generated strats. Per (map, POI/zone, side).

const STRATS = {
  "rebirth-island": {
    "prison": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Mid-game rotation through Prison Block: AR Anchor pre-aims contested choke, SMG Rusher secures the flank, Sniper picks stragglers. Support runs Trophy System for utility denial. Yard is a death trap — clear with frags before contesting.",
        callouts: ["Prison Cells", "Yard", "Tower", "Side Roof", "Tunnel", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Prison Block push timing", from: "Prison Cells", use: "Ring rotation timing dictates push window — count 30s on incoming circle." },
            { spawn: "Prison Block re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Prison Cells", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Loadout drop timing: drop the specialist box after the first ring close, full kit before mid-game commit.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Setup hold on Prison Block: Sniper on high ground, AR Anchor on mid-range angle, SMG Rusher trades on entry, Support runs Recon Drone for push reads. Tower hold with Sniper + Tunnel anchor wins most contests.",
        callouts: ["Prison Cells", "Yard", "Tower", "Side Roof", "Tunnel", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Prison Cells", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Prison Cells with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Prison Cells forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Rotation read: pre-position for the inevitable ring close — second team always comes from the new ring direction.",
          ],
        },
      },
    },
    "security": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Setup play on Security Area: SMG Rusher takes Security Building for the early frag, AR Anchor and Sniper trade through chokes. Support throws Stun + Smoke for cover. Rooftop entry from adjacent buildings catches the standard hold off-angle.",
        callouts: ["Security Building", "Loot Bins", "Rooftop", "Side Door", "Streets", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Security Area push timing", from: "Security Building", use: "Ring rotation timing dictates push window — count 30s on incoming circle." },
            { spawn: "Security Area re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Security Building", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Loadout drop timing: drop the specialist box after the first ring close, full kit before mid-game commit.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Save / reset round on Security Area: hold the back of the zone, do not commit. AR Anchor body-blocks the objective, Support keeps team alive with Stim. Stall for the next ring rotation. Side Door + Streets cross-fire denies the standard rooftop push.",
        callouts: ["Security Building", "Loot Bins", "Rooftop", "Side Door", "Streets", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Security Building", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Security Building with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Security Building forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Rotation read: pre-position for the inevitable ring close — second team always comes from the new ring direction.",
          ],
        },
      },
    },
    "headquarters": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Coordinated push on Headquarters: SMG Rusher Stun-Grenades the choke, AR Anchor pushes on the explosion, Sniper traps the rotation, Support clears the next room. Main Building rooftop dive with Stun cover splits the hold.",
        callouts: ["Main Building", "Rooftop", "Loot Bins", "Side Door", "Streets", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Headquarters push timing", from: "Main Building", use: "Ring rotation timing dictates push window — count 30s on incoming circle." },
            { spawn: "Headquarters re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Main Building", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Loadout drop timing: drop the specialist box after the first ring close, full kit before mid-game commit.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Stack Headquarters: 3-on-zone with AR + Support + SMG, Sniper plays off-angle for round-opener pick. Force teams to push you in a 3rd-team-friendly setup. Rooftop snipe + Streets ground anchor is the textbook hold.",
        callouts: ["Main Building", "Rooftop", "Loot Bins", "Side Door", "Streets", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Main Building", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Main Building with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Main Building forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Rotation read: pre-position for the inevitable ring close — second team always comes from the new ring direction.",
          ],
        },
      },
    },
    "living-quarters": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Setup play on Living Quarters: SMG Rusher takes Apartments for the early frag, AR Anchor and Sniper trade through chokes. Support throws Stun + Smoke for cover.",
        callouts: ["Apartments", "Loot Bins", "Rooftop", "Side Door", "Streets", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Living Quarters push timing", from: "Apartments", use: "Ring rotation timing dictates push window — count 30s on incoming circle." },
            { spawn: "Living Quarters re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Apartments", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Loadout drop timing: drop the specialist box after the first ring close, full kit before mid-game commit.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Save / reset round on Living Quarters: hold the back of the zone, do not commit. AR Anchor body-blocks the objective, Support keeps team alive with Stim. Stall for the next ring rotation.",
        callouts: ["Apartments", "Loot Bins", "Rooftop", "Side Door", "Streets", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Apartments", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Apartments with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Apartments forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Rotation read: pre-position for the inevitable ring close — second team always comes from the new ring direction.",
          ],
        },
      },
    },
    "industry": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Mid-game rotation through Industry: AR Anchor pre-aims contested choke, SMG Rusher secures the flank, Sniper picks stragglers. Support runs Trophy System for utility denial.",
        callouts: ["Factory", "Loot Yard", "Rooftop", "Side Door", "Streets", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Industry push timing", from: "Factory", use: "Ring rotation timing dictates push window — count 30s on incoming circle." },
            { spawn: "Industry re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Factory", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Loadout drop timing: drop the specialist box after the first ring close, full kit before mid-game commit.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Setup hold on Industry: Sniper on high ground, AR Anchor on mid-range angle, SMG Rusher trades on entry, Support runs Recon Drone for push reads.",
        callouts: ["Factory", "Loot Yard", "Rooftop", "Side Door", "Streets", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Factory", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Factory with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Factory forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Rotation read: pre-position for the inevitable ring close — second team always comes from the new ring direction.",
          ],
        },
      },
    },
  },
  "verdansk": {
    "downtown": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Flank play on Downtown: SMG Rusher takes the side path, AR Anchor + Sniper hold main angles, Support clears Claymores with EOD. Force a multi-angle commit. Subway flank from underneath catches the standard rooftop hold.",
        callouts: ["Skyscrapers", "Streets", "Rooftops", "Subway", "Plaza", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Downtown push timing", from: "Skyscrapers", use: "Ring rotation timing dictates push window — count 30s on incoming circle." },
            { spawn: "Downtown re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Skyscrapers", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Loadout drop timing: drop the specialist box after the first ring close, full kit before mid-game commit.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Anchor Downtown: AR Anchor holds main choke from cover, Sniper picks distant targets, SMG Rusher watches flanks, Support places Claymores + Trophy System on entries. Skyscraper hold with Subway choke Claymore is the textbook setup.",
        callouts: ["Skyscrapers", "Streets", "Rooftops", "Subway", "Plaza", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Skyscrapers", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Skyscrapers with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Skyscrapers forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Rotation read: pre-position for the inevitable ring close — second team always comes from the new ring direction.",
          ],
        },
      },
    },
    "superstore": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Coordinated push on Superstore: SMG Rusher Stun-Grenades the choke, AR Anchor pushes on the explosion, Sniper traps the rotation, Support clears the next room.",
        callouts: ["Main Floor", "Rooftop", "Parking Lot", "Loading Dock", "Streets", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Superstore push timing", from: "Main Floor", use: "Ring rotation timing dictates push window — count 30s on incoming circle." },
            { spawn: "Superstore re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Main Floor", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Loadout drop timing: drop the specialist box after the first ring close, full kit before mid-game commit.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Stack Superstore: 3-on-zone with AR + Support + SMG, Sniper plays off-angle for round-opener pick. Force teams to push you in a 3rd-team-friendly setup.",
        callouts: ["Main Floor", "Rooftop", "Parking Lot", "Loading Dock", "Streets", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Main Floor", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Main Floor with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Main Floor forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Rotation read: pre-position for the inevitable ring close — second team always comes from the new ring direction.",
          ],
        },
      },
    },
    "airport": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Mid-game rotation through Airport: AR Anchor pre-aims contested choke, SMG Rusher secures the flank, Sniper picks stragglers. Support runs Trophy System for utility denial. Tarmac is exposed — Support smokes for cover on the loot run.",
        callouts: ["Terminal", "Tower", "Tarmac", "Hangars", "Streets", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Airport push timing", from: "Terminal", use: "Ring rotation timing dictates push window — count 30s on incoming circle." },
            { spawn: "Airport re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Terminal", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Loadout drop timing: drop the specialist box after the first ring close, full kit before mid-game commit.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Setup hold on Airport: Sniper on high ground, AR Anchor on mid-range angle, SMG Rusher trades on entry, Support runs Recon Drone for push reads. Tower hold with Hangar cross-fire denies the standard push.",
        callouts: ["Terminal", "Tower", "Tarmac", "Hangars", "Streets", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Terminal", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Terminal with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Terminal forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Rotation read: pre-position for the inevitable ring close — second team always comes from the new ring direction.",
          ],
        },
      },
    },
    "farmland": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Hot drop on Farmland: SMG Rusher entries first, AR Anchor trades from mid-range, Sniper holds long sightline. Support runs Recon Drone for incoming squad info. Force loot consolidation before third-party arrives.",
        callouts: ["Barn", "Silos", "Fields", "Roadside", "House", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Farmland push timing", from: "Barn", use: "Ring rotation timing dictates push window — count 30s on incoming circle." },
            { spawn: "Farmland re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Barn", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Loadout drop timing: drop the specialist box after the first ring close, full kit before mid-game commit.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Off-angle hold on Farmland: Sniper plays the unconventional angle, AR Anchor draws aggro on main, SMG Rusher trades, Support feeds intel.",
        callouts: ["Barn", "Silos", "Fields", "Roadside", "House", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Barn", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Barn with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Barn forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Rotation read: pre-position for the inevitable ring close — second team always comes from the new ring direction.",
          ],
        },
      },
    },
    "stadium": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Mid-game rotation through Stadium: AR Anchor pre-aims contested choke, SMG Rusher secures the flank, Sniper picks stragglers. Support runs Trophy System for utility denial. Tunnels flank from underneath catches the standard Stands hold.",
        callouts: ["Field", "Stands", "Tunnels", "Concourse", "Plaza", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Stadium push timing", from: "Field", use: "Ring rotation timing dictates push window — count 30s on incoming circle." },
            { spawn: "Stadium re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Field", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Loadout drop timing: drop the specialist box after the first ring close, full kit before mid-game commit.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Setup hold on Stadium: Sniper on high ground, AR Anchor on mid-range angle, SMG Rusher trades on entry, Support runs Recon Drone for push reads. Concourse high ground with Plaza ground anchor wins most contests.",
        callouts: ["Field", "Stands", "Tunnels", "Concourse", "Plaza", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Field", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Field with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Field forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Rotation read: pre-position for the inevitable ring close — second team always comes from the new ring direction.",
          ],
        },
      },
    },
    "dam": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Hot drop on Dam: SMG Rusher entries first, AR Anchor trades from mid-range, Sniper holds long sightline. Support runs Recon Drone for incoming squad info. Force loot consolidation before third-party arrives.",
        callouts: ["Top Catwalk", "Lower Tunnels", "Center Building", "Rooftop", "Streets", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Dam push timing", from: "Top Catwalk", use: "Ring rotation timing dictates push window — count 30s on incoming circle." },
            { spawn: "Dam re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Top Catwalk", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Loadout drop timing: drop the specialist box after the first ring close, full kit before mid-game commit.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Off-angle hold on Dam: Sniper plays the unconventional angle, AR Anchor draws aggro on main, SMG Rusher trades, Support feeds intel.",
        callouts: ["Top Catwalk", "Lower Tunnels", "Center Building", "Rooftop", "Streets", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Top Catwalk", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Top Catwalk with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Top Catwalk forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Rotation read: pre-position for the inevitable ring close — second team always comes from the new ring direction.",
          ],
        },
      },
    },
    "hospital": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Setup play on Hospital: SMG Rusher takes Main Floor for the early frag, AR Anchor and Sniper trade through chokes. Support throws Stun + Smoke for cover.",
        callouts: ["Main Floor", "Rooftop", "Side Wing", "Garage", "Streets", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Hospital push timing", from: "Main Floor", use: "Ring rotation timing dictates push window — count 30s on incoming circle." },
            { spawn: "Hospital re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Main Floor", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Loadout drop timing: drop the specialist box after the first ring close, full kit before mid-game commit.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Save / reset round on Hospital: hold the back of the zone, do not commit. AR Anchor body-blocks the objective, Support keeps team alive with Stim. Stall for the next ring rotation.",
        callouts: ["Main Floor", "Rooftop", "Side Wing", "Garage", "Streets", "Spawn", "Streets"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Main Floor", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Main Floor with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Main Floor forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Rotation read: pre-position for the inevitable ring close — second team always comes from the new ring direction.",
          ],
        },
      },
    },
  },
  "skidrow": {
    "mid": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Mid-game rotation through Mid Lane: AR Anchor pre-aims contested choke, SMG Rusher secures the flank, Sniper picks stragglers. Support runs Trophy System for utility denial. Mid Alley is an SMG fight — Rusher takes the duel.",
        callouts: ["Mid Alley", "Window", "Rooftop", "Side Door", "Streets", "Mid", "Apartments"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Mid Lane push timing", from: "Mid Alley", use: "Killstreak respawn timer + UAV cycle dictates push." },
            { spawn: "Mid Lane re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Mid Alley", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Spawn read: push hard to force a spawn flip behind the enemy team — Sniper traps the new spawn rotation.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Setup hold on Mid Lane: Sniper on high ground, AR Anchor on mid-range angle, SMG Rusher trades on entry, Support runs Recon Drone for push reads. Window cross-fire from Apartments wins the standard mid contest.",
        callouts: ["Mid Alley", "Window", "Rooftop", "Side Door", "Streets", "Mid", "Apartments"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Mid Alley", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Mid Alley with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Mid Alley forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Killstreak hold: bring VTOL or Chopper Gunner for the final push, force enemies into prepared sightlines.",
          ],
        },
      },
    },
    "apartments": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Coordinated push on Apartments: SMG Rusher Stun-Grenades the choke, AR Anchor pushes on the explosion, Sniper traps the rotation, Support clears the next room. Apt Hall vertical pressure denies the standard hold.",
        callouts: ["Apt Hall", "Floors", "Window", "Rooftop", "Streets", "Mid", "Apartments"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Apartments push timing", from: "Apt Hall", use: "Killstreak respawn timer + UAV cycle dictates push." },
            { spawn: "Apartments re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Apt Hall", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Spawn read: push hard to force a spawn flip behind the enemy team — Sniper traps the new spawn rotation.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Stack Apartments: 3-on-zone with AR + Support + SMG, Sniper plays off-angle for round-opener pick. Save lethal utility for the second push commit. Multi-floor anchor with Window cross-fire wins the apartments fight.",
        callouts: ["Apt Hall", "Floors", "Window", "Rooftop", "Streets", "Mid", "Apartments"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Apt Hall", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard vertical / rooftop angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Apt Hall with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Apt Hall forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Killstreak hold: bring VTOL or Chopper Gunner for the final push, force enemies into prepared sightlines.",
          ],
        },
      },
    },
    "spawn-side": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Flank play on Spawn Side: SMG Rusher takes the side path, AR Anchor + Sniper hold main angles, Support clears Claymores with EOD. Force a multi-angle commit.",
        callouts: ["Spawn Building", "Loot Bins", "Rooftop", "Streets", "Side Door", "Mid", "Apartments"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Spawn Side push timing", from: "Spawn Building", use: "Killstreak respawn timer + UAV cycle dictates push." },
            { spawn: "Spawn Side re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Spawn Building", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Spawn read: push hard to force a spawn flip behind the enemy team — Sniper traps the new spawn rotation.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Anchor Spawn Side: AR Anchor holds main choke from cover, Sniper picks distant targets, SMG Rusher watches flanks, Support places Claymores + Trophy System on entries.",
        callouts: ["Spawn Building", "Loot Bins", "Rooftop", "Streets", "Side Door", "Mid", "Apartments"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Spawn Building", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Spawn Building with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Spawn Building forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Killstreak hold: bring VTOL or Chopper Gunner for the final push, force enemies into prepared sightlines.",
          ],
        },
      },
    },
  },
  "highrise": {
    "helipad": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Flank play on Helipad: SMG Rusher takes the side path, AR Anchor + Sniper hold main angles, Support clears Claymores with EOD. Force a multi-angle commit. Pad is exposed — Stun + Smoke for cover on the take.",
        callouts: ["Pad", "Office", "Rooftop", "Side Catwalk", "Streets", "Helipad", "Cranes"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Helipad push timing", from: "Pad", use: "Killstreak respawn timer + UAV cycle dictates push." },
            { spawn: "Helipad re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Pad", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Spawn read: push hard to force a spawn flip behind the enemy team — Sniper traps the new spawn rotation.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Anchor Helipad: AR Anchor holds main choke from cover, Sniper picks distant targets, SMG Rusher watches flanks, Support places Claymores + Trophy System on entries. Office tower cross-fire denies the standard helipad take.",
        callouts: ["Pad", "Office", "Rooftop", "Side Catwalk", "Streets", "Helipad", "Cranes"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Pad", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Pad with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Pad forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Killstreak hold: bring VTOL or Chopper Gunner for the final push, force enemies into prepared sightlines.",
          ],
        },
      },
    },
    "cranes": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Push on Cranes / Construction: SMG Rusher entries first, AR Anchor trades from mid-range, Sniper holds long sightline. Support runs Recon Drone for incoming squad info. Goal is gaining map control to start the rotation cycle. Crane top vertical pressure denies the standard construction hold.",
        callouts: ["Crane Top", "Construction Floor", "Rooftop", "Side Door", "Streets", "Helipad", "Cranes"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Cranes / Construction push timing", from: "Crane Top", use: "Killstreak respawn timer + UAV cycle dictates push." },
            { spawn: "Cranes / Construction re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Crane Top", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Spawn read: push hard to force a spawn flip behind the enemy team — Sniper traps the new spawn rotation.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Off-angle hold on Cranes / Construction: Sniper plays the unconventional angle, AR Anchor draws aggro on main, SMG Rusher trades, Support feeds intel. Construction Floor anchor with Rooftop cross-fire wins the contest.",
        callouts: ["Crane Top", "Construction Floor", "Rooftop", "Side Door", "Streets", "Helipad", "Cranes"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Crane Top", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard vertical / rooftop angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Crane Top with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Crane Top forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Killstreak hold: bring VTOL or Chopper Gunner for the final push, force enemies into prepared sightlines.",
          ],
        },
      },
    },
    "office": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Push on Office Tower: SMG Rusher entries first, AR Anchor trades from mid-range, Sniper holds long sightline. Support runs Recon Drone for incoming squad info. Goal is gaining map control to start the rotation cycle.",
        callouts: ["Office Floors", "Window", "Rooftop", "Side Door", "Streets", "Helipad", "Cranes"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Office Tower push timing", from: "Office Floors", use: "Killstreak respawn timer + UAV cycle dictates push." },
            { spawn: "Office Tower re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Office Floors", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Spawn read: push hard to force a spawn flip behind the enemy team — Sniper traps the new spawn rotation.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Off-angle hold on Office Tower: Sniper plays the unconventional angle, AR Anchor draws aggro on main, SMG Rusher trades, Support feeds intel.",
        callouts: ["Office Floors", "Window", "Rooftop", "Side Door", "Streets", "Helipad", "Cranes"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Office Floors", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Office Floors with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Office Floors forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Killstreak hold: bring VTOL or Chopper Gunner for the final push, force enemies into prepared sightlines.",
          ],
        },
      },
    },
  },
  "terminal": {
    "plane": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Coordinated push on Plane / Tarmac: SMG Rusher Stun-Grenades the choke, AR Anchor pushes on the explosion, Sniper traps the rotation, Support clears the next room. Plane Stairs is the contested space — AR Anchor pre-aims the lane.",
        callouts: ["Plane Stairs", "Tarmac", "Side Door", "Rooftop", "Streets", "Plane", "Tarmac"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Plane / Tarmac push timing", from: "Plane Stairs", use: "Killstreak respawn timer + UAV cycle dictates push." },
            { spawn: "Plane / Tarmac re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Plane Stairs", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Spawn read: push hard to force a spawn flip behind the enemy team — Sniper traps the new spawn rotation.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Stack Plane / Tarmac: 3-on-zone with AR + Support + SMG, Sniper plays off-angle for round-opener pick. Save lethal utility for the second push commit. Tarmac cross-fire from Lobby wins the standard Plane contest.",
        callouts: ["Plane Stairs", "Tarmac", "Side Door", "Rooftop", "Streets", "Plane", "Tarmac"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Plane Stairs", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Plane Stairs with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Plane Stairs forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Killstreak hold: bring VTOL or Chopper Gunner for the final push, force enemies into prepared sightlines.",
          ],
        },
      },
    },
    "lobby": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Setup play on Lobby: SMG Rusher takes Main Floor for the early frag, AR Anchor and Sniper trade through chokes. Support throws Stun + Smoke for cover. Lobby Window vertical pressure isolates the standard hold.",
        callouts: ["Main Floor", "Side Hall", "Window", "Rooftop", "Streets", "Plane", "Tarmac"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Lobby push timing", from: "Main Floor", use: "Killstreak respawn timer + UAV cycle dictates push." },
            { spawn: "Lobby re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Main Floor", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Spawn read: push hard to force a spawn flip behind the enemy team — Sniper traps the new spawn rotation.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Save / reset round on Lobby: hold the back of the zone, do not commit. AR Anchor body-blocks the objective, Support keeps team alive with Stim. Stall for overtime trade or denied capture. Main Floor anchor with Side Hall cross-fire denies the push.",
        callouts: ["Main Floor", "Side Hall", "Window", "Rooftop", "Streets", "Plane", "Tarmac"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Main Floor", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard vertical / rooftop angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Main Floor with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Main Floor forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Killstreak hold: bring VTOL or Chopper Gunner for the final push, force enemies into prepared sightlines.",
          ],
        },
      },
    },
    "spawn-side": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Coordinated push on Spawn Side: SMG Rusher Stun-Grenades the choke, AR Anchor pushes on the explosion, Sniper traps the rotation, Support clears the next room.",
        callouts: ["Spawn Building", "Loot Bins", "Rooftop", "Streets", "Side Door", "Plane", "Tarmac"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Spawn Side push timing", from: "Spawn Building", use: "Killstreak respawn timer + UAV cycle dictates push." },
            { spawn: "Spawn Side re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Spawn Building", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Spawn read: push hard to force a spawn flip behind the enemy team — Sniper traps the new spawn rotation.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Stack Spawn Side: 3-on-zone with AR + Support + SMG, Sniper plays off-angle for round-opener pick. Save lethal utility for the second push commit.",
        callouts: ["Spawn Building", "Loot Bins", "Rooftop", "Streets", "Side Door", "Plane", "Tarmac"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Spawn Building", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Spawn Building with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Spawn Building forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Killstreak hold: bring VTOL or Chopper Gunner for the final push, force enemies into prepared sightlines.",
          ],
        },
      },
    },
  },
  "rust": {
    "tower": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Setup play on Tower: SMG Rusher takes Tower Top for the early frag, AR Anchor and Sniper trade through chokes. Support throws Stun + Smoke for cover.",
        callouts: ["Tower Top", "Tower Base", "Side Door", "Rooftop", "Streets", "Tower", "Mid"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Tower push timing", from: "Tower Top", use: "Killstreak respawn timer + UAV cycle dictates push." },
            { spawn: "Tower re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Tower Top", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Spawn read: push hard to force a spawn flip behind the enemy team — Sniper traps the new spawn rotation.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Save / reset round on Tower: hold the back of the zone, do not commit. AR Anchor body-blocks the objective, Support keeps team alive with Stim. Stall for overtime trade or denied capture.",
        callouts: ["Tower Top", "Tower Base", "Side Door", "Rooftop", "Streets", "Tower", "Mid"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Tower Top", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Tower Top with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Tower Top forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Killstreak hold: bring VTOL or Chopper Gunner for the final push, force enemies into prepared sightlines.",
          ],
        },
      },
    },
    "mid": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Setup play on Mid Lane: SMG Rusher takes Mid Alley for the early frag, AR Anchor and Sniper trade through chokes. Support throws Stun + Smoke for cover.",
        callouts: ["Mid Alley", "Crates", "Window", "Rooftop", "Streets", "Tower", "Mid"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Mid Lane push timing", from: "Mid Alley", use: "Killstreak respawn timer + UAV cycle dictates push." },
            { spawn: "Mid Lane re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Mid Alley", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Spawn read: push hard to force a spawn flip behind the enemy team — Sniper traps the new spawn rotation.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Save / reset round on Mid Lane: hold the back of the zone, do not commit. AR Anchor body-blocks the objective, Support keeps team alive with Stim. Stall for overtime trade or denied capture.",
        callouts: ["Mid Alley", "Crates", "Window", "Rooftop", "Streets", "Tower", "Mid"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Mid Alley", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Mid Alley with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Mid Alley forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Killstreak hold: bring VTOL or Chopper Gunner for the final push, force enemies into prepared sightlines.",
          ],
        },
      },
    },
  },
  "karachi": {
    "mid": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Mid-game rotation through Mid Lane: AR Anchor pre-aims contested choke, SMG Rusher secures the flank, Sniper picks stragglers. Support runs Trophy System for utility denial.",
        callouts: ["Mid Alley", "Window", "Rooftop", "Side Door", "Streets", "Mid", "Streets"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Mid Lane push timing", from: "Mid Alley", use: "Killstreak respawn timer + UAV cycle dictates push." },
            { spawn: "Mid Lane re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Mid Alley", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Spawn read: push hard to force a spawn flip behind the enemy team — Sniper traps the new spawn rotation.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Setup hold on Mid Lane: Sniper on high ground, AR Anchor on mid-range angle, SMG Rusher trades on entry, Support runs Recon Drone for push reads.",
        callouts: ["Mid Alley", "Window", "Rooftop", "Side Door", "Streets", "Mid", "Streets"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Mid Alley", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Mid Alley with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Mid Alley forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Killstreak hold: bring VTOL or Chopper Gunner for the final push, force enemies into prepared sightlines.",
          ],
        },
      },
    },
    "a-side": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Mid-game rotation through A Side: AR Anchor pre-aims contested choke, SMG Rusher secures the flank, Sniper picks stragglers. Support runs Trophy System for utility denial.",
        callouts: ["Building", "Loot Bins", "Rooftop", "Streets", "Side Door", "Mid", "Streets"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "A Side push timing", from: "Building", use: "Killstreak respawn timer + UAV cycle dictates push." },
            { spawn: "A Side re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Building", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Spawn read: push hard to force a spawn flip behind the enemy team — Sniper traps the new spawn rotation.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Setup hold on A Side: Sniper on high ground, AR Anchor on mid-range angle, SMG Rusher trades on entry, Support runs Recon Drone for push reads.",
        callouts: ["Building", "Loot Bins", "Rooftop", "Streets", "Side Door", "Mid", "Streets"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Building", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Building with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Building forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Killstreak hold: bring VTOL or Chopper Gunner for the final push, force enemies into prepared sightlines.",
          ],
        },
      },
    },
    "b-side": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Coordinated push on B Side: SMG Rusher Stun-Grenades the choke, AR Anchor pushes on the explosion, Sniper traps the rotation, Support clears the next room.",
        callouts: ["Building", "Loot Bins", "Rooftop", "Streets", "Side Door", "Mid", "Streets"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "B Side push timing", from: "Building", use: "Killstreak respawn timer + UAV cycle dictates push." },
            { spawn: "B Side re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Building", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Spawn read: push hard to force a spawn flip behind the enemy team — Sniper traps the new spawn rotation.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Stack B Side: 3-on-zone with AR + Support + SMG, Sniper plays off-angle for round-opener pick. Save lethal utility for the second push commit.",
        callouts: ["Building", "Loot Bins", "Rooftop", "Streets", "Side Door", "Mid", "Streets"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Building", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Building with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Building forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Killstreak hold: bring VTOL or Chopper Gunner for the final push, force enemies into prepared sightlines.",
          ],
        },
      },
    },
  },
  "favela": {
    "mid-hill": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Push on Mid / Hill: SMG Rusher entries first, AR Anchor trades from mid-range, Sniper holds long sightline. Support runs Recon Drone for incoming squad info. Goal is gaining map control to start the rotation cycle.",
        callouts: ["Hill Top", "Mid Alley", "Window", "Rooftop", "Streets", "Mid", "Hill"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Mid / Hill push timing", from: "Hill Top", use: "Killstreak respawn timer + UAV cycle dictates push." },
            { spawn: "Mid / Hill re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Hill Top", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Spawn read: push hard to force a spawn flip behind the enemy team — Sniper traps the new spawn rotation.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Off-angle hold on Mid / Hill: Sniper plays the unconventional angle, AR Anchor draws aggro on main, SMG Rusher trades, Support feeds intel.",
        callouts: ["Hill Top", "Mid Alley", "Window", "Rooftop", "Streets", "Mid", "Hill"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Hill Top", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Hill Top with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Hill Top forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Killstreak hold: bring VTOL or Chopper Gunner for the final push, force enemies into prepared sightlines.",
          ],
        },
      },
    },
    "a-side": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Flank play on A Side: SMG Rusher takes the side path, AR Anchor + Sniper hold main angles, Support clears Claymores with EOD. Force a multi-angle commit.",
        callouts: ["Buildings", "Loot Bins", "Rooftop", "Streets", "Side Door", "Mid", "Hill"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "A Side push timing", from: "Buildings", use: "Killstreak respawn timer + UAV cycle dictates push." },
            { spawn: "A Side re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Buildings", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Spawn read: push hard to force a spawn flip behind the enemy team — Sniper traps the new spawn rotation.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Anchor A Side: AR Anchor holds main choke from cover, Sniper picks distant targets, SMG Rusher watches flanks, Support places Claymores + Trophy System on entries.",
        callouts: ["Buildings", "Loot Bins", "Rooftop", "Streets", "Side Door", "Mid", "Hill"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Buildings", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Buildings with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Buildings forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Killstreak hold: bring VTOL or Chopper Gunner for the final push, force enemies into prepared sightlines.",
          ],
        },
      },
    },
    "b-side": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Mid-game rotation through B Side: AR Anchor pre-aims contested choke, SMG Rusher secures the flank, Sniper picks stragglers. Support runs Trophy System for utility denial.",
        callouts: ["Buildings", "Loot Bins", "Rooftop", "Streets", "Side Door", "Mid", "Hill"],
        utility: [
          "AR Anchor: AR + Frag Grenades for mid-range trades",
          "SMG Rusher: SMG + Throwing Knife / Stun for entry frag",
          "Sniper / Marksman: Sniper for long sightlines, Smoke for repositioning",
          "Support: Recon Drone for intel, Trophy System for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "B Side push timing", from: "Buildings", use: "Killstreak respawn timer + UAV cycle dictates push." },
            { spawn: "B Side re-engage spawn", from: "Adjacent cover", use: "Group up after a wipe; do not trickle. Killstreak respawn priority on commit." },
          ],
          spawnKillSpots: [
            { from: "Buildings", target: "enemy spawn rotation path", risk: "Medium — exposes you to off-angle Sniper counter", reward: "Round-opener pick that flips spawns + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Counter-UAV → Cluster Strike or Precision Airstrike for the contested zone push.",
            "Spawn read: push hard to force a spawn flip behind the enemy team — Sniper traps the new spawn rotation.",
            "Smoke cover: Support smokes the contested choke, AR Anchor pushes on the smoke fade, Sniper holds the trade angle.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Setup hold on B Side: Sniper on high ground, AR Anchor on mid-range angle, SMG Rusher trades on entry, Support runs Recon Drone for push reads.",
        callouts: ["Buildings", "Loot Bins", "Rooftop", "Streets", "Side Door", "Mid", "Hill"],
        utility: [
          "AR Anchor: AR + Frag for mid-range hold",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper / Marksman: Sniper for long sightline, Cold-Blooded for UAV / Recon Drone counter",
          "Support: Claymores on entries, Trophy System for grenade denial, Recon Drone for intel",
        ],
        premiumTactics: {
          runouts: [
            { from: "Buildings", target: "enemy approach path", timing: "Setup phase — pre-position to deny the standard push." },
            { from: "Side rooftop", target: "enemy back-line", timing: "Mid-fight — flank punish on enemy main commit." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard main entry angle — most pushes commit from the same path each round.",
            "Save the off-angle Sniper shot for after the first push wipes — third party always comes from a different direction.",
            "Trade-stack Buildings with the AR Anchor — if the SMG entry takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo: Claymore on entry, Trophy on mid-room — denies grenade spam + rush attempts.",
            "Off-angle hold in Buildings forces entry to re-clear, buys teammates 2-3 seconds for utility setup.",
            "Killstreak hold: bring VTOL or Chopper Gunner for the final push, force enemies into prepared sightlines.",
          ],
        },
      },
    },
  },
}

export default STRATS
