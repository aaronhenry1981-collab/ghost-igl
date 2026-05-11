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
  "shipment": {
    "red-spawn": {
      attack: {
        operators: [
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Shotgun", role: "Close-range trade", priority: "essential" },
          { name: "AR Anchor", role: "AR", priority: "recommended" },
        ],
        strategy: "Shipment is 24/7 chaos — 4 containers + open center. Rush Red Spawn with SMG, Shotgun pre-aims spawn doors, AR Anchor trades from center. No long sightlines — speed kills.",
        callouts: ["Red Spawn", "Center Containers", "Blue Spawn", "Side Container", "Corner", "Doorway", "Spawn Pile"],
        utility: [
          "SMG Rusher: SMG + Stun for entry frag; Dead Silence on rush",
          "Shotgun: Close-range hold; pre-aim corner",
          "AR Anchor: AR + Frag for cross-map trade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Red Spawn rush", from: "Center Containers", use: "Rush Red Spawn with SMG + Stun chain, frag the spawn pile." },
            { spawn: "Side flank", from: "Side Container", use: "Side Container flank denies the corner camp." },
          ],
          spawnKillSpots: [
            { from: "Center Containers", target: "Red Spawn pile", risk: "Medium — counter-spawn flip", reward: "Spawn pile kill = +3 to +5 kill streak" },
          ],
          advancedSetups: [
            "Spawn-flip read: Shipment spawns flip fast — track kill direction.",
            "Killstreak: UAV → Counter-UAV → Cluster Strike spawn pile.",
            "Stun + Frag chain: Stun on entry, Frag the corner camp.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Shotgun", role: "Close-range hold", priority: "essential" },
          { name: "SMG Rusher", role: "Flank", priority: "recommended" },
        ],
        strategy: "Hold Red Spawn with AR pre-aiming center, Shotgun in corner trade angle. Spawn-flip happens fast — track and re-adjust.",
        callouts: ["Red Spawn", "Center Containers", "Blue Spawn", "Side Container", "Corner", "Doorway", "Spawn Pile"],
        utility: [
          "AR Anchor: AR + Claymore on spawn doors",
          "Shotgun: Close-range corner trade",
          "SMG Rusher: Flank for counter-rush",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Container", target: "enemy rush attempt", timing: "Setup phase pre-position" },
            { from: "Corner", target: "enemy flank", timing: "Mid-fight peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Center Containers — every rush commits through center.",
            "Claymore on spawn doors.",
          ],
          advancedSetups: [
            "Claymore chain: pre-place on every spawn door.",
            "Trophy System for grenade denial.",
            "Spawn-flip recovery: track kill direction, reposition.",
          ],
        },
      },
    },
    "blue-spawn": {
      attack: {
        operators: [
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Shotgun", role: "Close-range", priority: "essential" },
          { name: "AR Anchor", role: "AR", priority: "recommended" },
        ],
        strategy: "Mirror Red Spawn — Blue Spawn rush is the standard 24/7 play. SMG + Stun chain, Frag spawn pile.",
        callouts: ["Blue Spawn", "Center Containers", "Red Spawn", "Side Container", "Corner", "Doorway", "Spawn Pile"],
        utility: [
          "SMG Rusher: SMG + Stun; Dead Silence",
          "Shotgun: Close-range corner",
          "AR Anchor: AR + Frag",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Blue Spawn rush", from: "Center Containers", use: "Rush Blue with SMG + Stun, Frag spawn pile." },
            { spawn: "Side flank", from: "Side Container", use: "Side Container flank corner." },
          ],
          spawnKillSpots: [
            { from: "Center Containers", target: "Blue Spawn pile", risk: "Medium — counter-flip", reward: "Spawn pile +3 to +5 kills" },
          ],
          advancedSetups: [
            "Spawn-flip read.",
            "Killstreak Cluster Strike spawn pile.",
            "Stun + Frag chain.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Shotgun", role: "Close-range hold", priority: "essential" },
          { name: "SMG Rusher", role: "Flank", priority: "recommended" },
        ],
        strategy: "Hold Blue Spawn: AR pre-aims center, Shotgun corner.",
        callouts: ["Blue Spawn", "Center Containers", "Red Spawn", "Side Container", "Corner", "Doorway", "Spawn Pile"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Shotgun: Corner trade",
          "SMG Rusher: Counter-flank",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Container", target: "enemy rush", timing: "Setup phase pre-position" },
            { from: "Corner", target: "enemy flank", timing: "Mid-fight peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Center.",
            "Claymore spawn doors.",
          ],
          advancedSetups: [
            "Claymore chain.",
            "Trophy denial.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "center": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Flank", priority: "essential" },
          { name: "Shotgun", role: "Close-range", priority: "recommended" },
        ],
        strategy: "Shipment Center is the contested kill-zone between containers. AR pre-aims spawn doors, SMG flanks side container, Shotgun holds the corner trade.",
        callouts: ["Center", "Container Cover", "Spawn Doors", "Side Path", "Corner", "Doorway", "Open"],
        utility: [
          "AR Anchor: AR + Frag for cross-map",
          "SMG Rusher: SMG + Stun for flank",
          "Shotgun: Corner trade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Center hold", from: "Spawn Doors", use: "AR pre-aims both spawns, Frag spawn pile on every flip." },
            { spawn: "Side flank", from: "Side Path", use: "SMG flank breaks the standard center hold." },
          ],
          spawnKillSpots: [
            { from: "Container Cover", target: "spawn flip side", risk: "Medium — counter-flank", reward: "Continuous spawn-flip kill cycle" },
          ],
          advancedSetups: [
            "Center hold: AR sustains the spawn-pile cycle.",
            "Killstreak Cluster Strike on both spawns.",
            "Side flank: SMG cleans up runners.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Shotgun", role: "Close-range hold", priority: "essential" },
          { name: "SMG Rusher", role: "Flank", priority: "recommended" },
        ],
        strategy: "Hold Center: AR sustains the spawn-flip cycle, Shotgun denies corner pushes.",
        callouts: ["Center", "Container Cover", "Spawn Doors", "Side Path", "Corner", "Doorway", "Open"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Shotgun: Corner trade",
          "SMG Rusher: Counter-flank",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Path", target: "enemy flank attempt", timing: "Setup pre-position" },
            { from: "Corner", target: "enemy rush", timing: "Mid-fight peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim both Spawn Doors.",
            "Claymore corner.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo.",
            "Center sustain: AR continuous spawn-flip pressure.",
            "Killstreak chain on cap.",
          ],
        },
      },
    },
  },
  "nuketown": {
    "yellow-house": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Push Nuketown Yellow House via the front yard — SMG entry, AR holds center, Sniper trades from Side. The bunker is an off-angle flank.",
        callouts: ["Yellow House", "Front Yard", "Garage", "Back Yard", "Side Bunker", "Driveway", "Roof"],
        utility: [
          "AR Anchor: AR + Frag for mid-range",
          "SMG Rusher: SMG + Stun entry",
          "Sniper / Marksman: Sniper from Side Bunker",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Front Yard push", from: "Garage", use: "SMG + Stun chain on Front Yard entry." },
            { spawn: "Side Bunker flank", from: "Driveway", use: "Side Bunker for off-angle Sniper pick." },
          ],
          spawnKillSpots: [
            { from: "Roof", target: "Yellow House defender", risk: "Medium — exposed long shot", reward: "Spawn-flip + map control" },
          ],
          advancedSetups: [
            "Stun + Frag chain on entry.",
            "Killstreak UAV → Cluster.",
            "Side Bunker Sniper pre-aims defender.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Shotgun", role: "Close-range hold", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Hold Yellow House: AR from Front Yard window, Shotgun in living room, Sniper from upstairs window.",
        callouts: ["Yellow House", "Front Yard", "Garage", "Back Yard", "Side Bunker", "Driveway", "Roof"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Shotgun: Living room trade",
          "Sniper: Upstairs window",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Bunker", target: "enemy push", timing: "Setup pre-position" },
            { from: "Roof", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Front Yard.",
            "Claymore Garage door.",
          ],
          advancedSetups: [
            "Claymore + Trophy.",
            "Sniper upstairs denial.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "green-house": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Mirror Yellow House — push Green House via front yard. SMG entry, AR holds center, Sniper from Side Bunker.",
        callouts: ["Green House", "Front Yard", "Garage", "Back Yard", "Side Bunker", "Driveway", "Roof"],
        utility: [
          "AR Anchor: AR + Frag mid-range",
          "SMG Rusher: SMG + Stun entry",
          "Sniper: Side Bunker",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Front Yard push", from: "Garage", use: "SMG + Stun chain on Front Yard." },
            { spawn: "Side Bunker flank", from: "Driveway", use: "Side Bunker for off-angle Sniper." },
          ],
          spawnKillSpots: [
            { from: "Roof", target: "Green House defender", risk: "Medium — long shot", reward: "Spawn-flip + map control" },
          ],
          advancedSetups: [
            "Stun + Frag chain.",
            "Killstreak UAV → Cluster.",
            "Side Bunker Sniper.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Shotgun", role: "Close-range", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Hold Green House: AR from Front Yard window, Shotgun living room, Sniper upstairs.",
        callouts: ["Green House", "Front Yard", "Garage", "Back Yard", "Side Bunker", "Driveway", "Roof"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Shotgun: Living room",
          "Sniper: Upstairs window",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Bunker", target: "enemy push", timing: "Setup pre-position" },
            { from: "Roof", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Front Yard.",
            "Claymore Garage door.",
          ],
          advancedSetups: [
            "Claymore + Trophy.",
            "Sniper upstairs denial.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
    "center": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Flank", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Nuketown Center is the iconic spawn-trade lane — AR cross-map, SMG flanks Side Bunker, Sniper trades from Roof.",
        callouts: ["Center", "Bus", "Side Bunker", "Driveways", "Open", "Front Yards", "Roof"],
        utility: [
          "AR Anchor: AR + Frag cross-map",
          "SMG Rusher: SMG + Stun for Side flank",
          "Sniper: Roof long sightline",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Center hold", from: "Bus", use: "AR pre-aims both yards, Frag both driveways." },
            { spawn: "Side flank", from: "Side Bunker", use: "SMG flank Side Bunker for back-line." },
          ],
          spawnKillSpots: [
            { from: "Roof", target: "Front Yard spawn flip", risk: "Medium — exposed long shot", reward: "Continuous spawn-flip kill cycle" },
          ],
          advancedSetups: [
            "Center sustain: AR continuous spawn-flip pressure.",
            "Killstreak Cluster on both yards.",
            "Bus cover route for SMG flank.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Shotgun", role: "Close-range", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Hold Nuketown Center: AR sustains spawn-flip cycle, Sniper denies cross-map.",
        callouts: ["Center", "Bus", "Side Bunker", "Driveways", "Open", "Front Yards", "Roof"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Shotgun: Corner trade",
          "Sniper: Roof",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Bunker", target: "enemy flank", timing: "Setup pre-position" },
            { from: "Roof", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim both yards.",
            "Claymore Side Bunker.",
          ],
          advancedSetups: [
            "Claymore chain.",
            "Center sustain: AR continuous pressure.",
            "Killstreak chain on cap.",
          ],
        },
      },
    },
    "backyard": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Backyard is the off-angle flank route — push through fence into base via the back.",
        callouts: ["Backyard", "Fence", "Pool / Truck", "Side Yard", "Back Entry", "Roof", "Corner"],
        utility: [
          "AR Anchor: AR + Frag",
          "SMG Rusher: SMG + Stun fence",
          "Sniper: Side Yard",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Fence rush", from: "Side Yard", use: "SMG vault Fence for back-line entry." },
            { spawn: "Side flank", from: "Back Entry", use: "Off-angle Back Entry for surprise." },
          ],
          spawnKillSpots: [
            { from: "Roof", target: "Backyard defender", risk: "Medium — exposed long shot", reward: "Spawn-flip + back-line trade" },
          ],
          advancedSetups: [
            "Fence vault flank for back-line.",
            "Killstreak UAV → Cluster on Backyard.",
            "Stun + Frag chain on Fence entry.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Shotgun", role: "Close-range hold", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Hold Backyard: AR pre-aims Fence vault, Shotgun corner, Sniper from upstairs window.",
        callouts: ["Backyard", "Fence", "Pool / Truck", "Side Yard", "Back Entry", "Roof", "Corner"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Shotgun: Corner trade",
          "Sniper: Upstairs window",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Yard", target: "enemy fence vault", timing: "Setup pre-position" },
            { from: "Roof", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Fence.",
            "Claymore Back Entry.",
          ],
          advancedSetups: [
            "Claymore + Trophy.",
            "Sniper upstairs denial.",
            "Spawn-flip recovery.",
          ],
        },
      },
    },
  },
  "hijacked": {
    "yacht-stern": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Hijacked Yacht Stern is the iconic Hardpoint zone on the back of the yacht. SMG rush + AR hold center, Sniper trades from yacht bow.",
        callouts: ["Yacht Stern", "Center Deck", "Stairs", "Galley", "Side Cover", "Bow View", "Top Deck"],
        utility: [
          "AR Anchor: AR + Frag for mid-range",
          "SMG Rusher: SMG + Stun entry",
          "Sniper: Bow long sightline",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Stern Hardpoint push", from: "Center Deck", use: "SMG rush Stern with Stun chain, AR holds center trade." },
            { spawn: "Stairs flank", from: "Galley", use: "Stairs flank for back-line trade." },
          ],
          spawnKillSpots: [
            { from: "Top Deck", target: "Stern Hardpoint defender", risk: "Medium — exposed vertical", reward: "Hardpoint pick + Killstreak" },
          ],
          advancedSetups: [
            "Stun + Frag chain on Stern entry.",
            "Killstreak UAV → Cluster Strike on Hardpoint.",
            "Stairs flank for surprise.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Shotgun", role: "Close-range", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Hold Yacht Stern Hardpoint: AR from Side Cover, Shotgun corner, Sniper from Top Deck.",
        callouts: ["Yacht Stern", "Center Deck", "Stairs", "Galley", "Side Cover", "Bow View", "Top Deck"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Shotgun: Corner",
          "Sniper: Top Deck",
        ],
        premiumTactics: {
          runouts: [
            { from: "Stairs", target: "enemy push", timing: "Setup pre-position" },
            { from: "Top Deck", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Center Deck entry.",
            "Claymore Galley doors.",
          ],
          advancedSetups: [
            "Claymore + Trophy.",
            "Sniper Top Deck denial.",
            "Killstreak hold: Chopper Gunner on cap.",
          ],
        },
      },
    },
    "yacht-bow": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Hijacked Yacht Bow is the front Hardpoint. SMG rush + Sniper from Stern trade angle, AR holds center.",
        callouts: ["Yacht Bow", "Center Deck", "Stairs", "Galley", "Side Cover", "Stern View", "Top Deck"],
        utility: [
          "AR Anchor: AR + Frag",
          "SMG Rusher: SMG + Stun entry",
          "Sniper: Stern View long sightline",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Bow Hardpoint push", from: "Center Deck", use: "SMG rush Bow with Stun chain." },
            { spawn: "Side flank", from: "Galley", use: "Galley flank for back-line trade." },
          ],
          spawnKillSpots: [
            { from: "Top Deck", target: "Bow Hardpoint defender", risk: "Medium — exposed vertical", reward: "Hardpoint pick + Killstreak" },
          ],
          advancedSetups: [
            "Stun + Frag chain on entry.",
            "Killstreak Cluster on Hardpoint.",
            "Galley flank for surprise.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Shotgun", role: "Close-range", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Hold Bow Hardpoint: AR Side Cover, Shotgun corner, Sniper Top Deck.",
        callouts: ["Yacht Bow", "Center Deck", "Stairs", "Galley", "Side Cover", "Stern View", "Top Deck"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Shotgun: Corner",
          "Sniper: Top Deck",
        ],
        premiumTactics: {
          runouts: [
            { from: "Galley", target: "enemy push", timing: "Setup pre-position" },
            { from: "Top Deck", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Center Deck.",
            "Claymore Galley doors.",
          ],
          advancedSetups: [
            "Claymore + Trophy.",
            "Sniper Top Deck.",
            "Killstreak hold.",
          ],
        },
      },
    },
    "top-deck": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "recommended" },
        ],
        strategy: "Top Deck Hardpoint is the elevated central zone. Sniper controls long sightline, AR holds mid-range, SMG rushes via Stairs.",
        callouts: ["Top Deck", "Sniper Spot", "Stairs Up", "Center", "Side Cover", "Bow View", "Stern View"],
        utility: [
          "AR Anchor: AR + Frag",
          "Sniper: Long sightline",
          "SMG Rusher: SMG + Stun via Stairs",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Stairs commit", from: "Stairs Up", use: "SMG Stun chain up Stairs, Sniper trades from cover." },
            { spawn: "Sniper take", from: "Side Cover", use: "Sniper pre-aims Hardpoint from cover." },
          ],
          spawnKillSpots: [
            { from: "Sniper Spot", target: "Top Deck defender", risk: "Medium — counter-snipe", reward: "Hardpoint pick + map control" },
          ],
          advancedSetups: [
            "Sniper long-shot pre-aim Hardpoint.",
            "Killstreak VTOL on Hardpoint.",
            "Stairs Stun + Frag chain.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "essential" },
          { name: "Shotgun", role: "Close-range", priority: "recommended" },
        ],
        strategy: "Hold Top Deck Hardpoint: Sniper anchors long sightline, AR holds mid-range, Shotgun trades Stairs.",
        callouts: ["Top Deck", "Sniper Spot", "Stairs Up", "Center", "Side Cover", "Bow View", "Stern View"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Sniper: Long sightline",
          "Shotgun: Stairs trade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Cover", target: "enemy Sniper attempt", timing: "Setup pre-position" },
            { from: "Stern View", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Stairs Up.",
            "Claymore Stairs.",
          ],
          advancedSetups: [
            "Claymore + Trophy.",
            "Sniper long-shot denial.",
            "Killstreak VTOL on cap.",
          ],
        },
      },
    },
    "galley": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Shotgun", role: "Close-range", priority: "recommended" },
        ],
        strategy: "Hijacked Galley is the tight interior corridor — close-range gun fights. SMG rush + Shotgun trade.",
        callouts: ["Galley", "Stairs Down", "Side Doors", "Hallway", "Stern Door", "Bow Door", "Kitchen"],
        utility: [
          "AR Anchor: AR + Frag for cross",
          "SMG Rusher: SMG + Stun entry",
          "Shotgun: Corner trade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Galley rush", from: "Stairs Down", use: "SMG Stun chain through Galley." },
            { spawn: "Side flank", from: "Side Doors", use: "Side flank for back-line trade." },
          ],
          spawnKillSpots: [
            { from: "Hallway", target: "Galley defender", risk: "Medium — exposed flank", reward: "Hardpoint pick + back-line trade" },
          ],
          advancedSetups: [
            "Stun + Frag chain on Galley entry.",
            "Killstreak Cluster on Galley.",
            "Side Door flank for back-line.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Shotgun", role: "Close-range hold", priority: "essential" },
          { name: "SMG Rusher", role: "Flank", priority: "recommended" },
        ],
        strategy: "Hold Galley: AR from Hallway, Shotgun corner, SMG counter-flank.",
        callouts: ["Galley", "Stairs Down", "Side Doors", "Hallway", "Stern Door", "Bow Door", "Kitchen"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Shotgun: Corner",
          "SMG Rusher: Counter-flank",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Doors", target: "enemy push", timing: "Setup pre-position" },
            { from: "Hallway", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Stairs Down.",
            "Claymore Side Doors.",
          ],
          advancedSetups: [
            "Claymore + Trophy.",
            "Corner sustain trade.",
            "Killstreak hold.",
          ],
        },
      },
    },
  },
  "standoff": {
    "truck": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Standoff Truck is the iconic Hardpoint at center map. AR cross-map, SMG rushes Mid, Sniper trades from rooftops.",
        callouts: ["Truck", "Mid Lane", "House", "Warehouse", "Side Path", "Rooftops", "Corner"],
        utility: [
          "AR Anchor: AR + Frag for cross-map",
          "SMG Rusher: SMG + Stun entry",
          "Sniper: Rooftops long sightline",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Mid Lane push", from: "House", use: "AR cross-map + SMG rush via Mid Lane." },
            { spawn: "Side Path flank", from: "Warehouse", use: "Side Path off-angle Hardpoint push." },
          ],
          spawnKillSpots: [
            { from: "Rooftops", target: "Truck Hardpoint defender", risk: "Medium — exposed long shot", reward: "Hardpoint pick + Killstreak" },
          ],
          advancedSetups: [
            "Stun + Frag chain on entry.",
            "Killstreak VTOL or Chopper on Hardpoint.",
            "Side Path flank for back-line.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Shotgun", role: "Close-range", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Hold Standoff Truck Hardpoint: AR cross-map, Sniper rooftops, Shotgun corner.",
        callouts: ["Truck", "Mid Lane", "House", "Warehouse", "Side Path", "Rooftops", "Corner"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Shotgun: Corner",
          "Sniper: Rooftops",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Path", target: "enemy push", timing: "Setup pre-position" },
            { from: "Rooftops", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Mid Lane.",
            "Claymore Side Path.",
          ],
          advancedSetups: [
            "Claymore + Trophy.",
            "Sniper Rooftops denial.",
            "Killstreak Chopper on Hardpoint.",
          ],
        },
      },
    },
    "warehouse": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Shotgun", role: "Close-range", priority: "recommended" },
        ],
        strategy: "Standoff Warehouse is the interior Hardpoint — tight chokes. SMG entry + AR cross.",
        callouts: ["Warehouse", "Loading Dock", "Side Doors", "Office", "Roof", "Hallway", "Truck View"],
        utility: [
          "AR Anchor: AR + Frag",
          "SMG Rusher: SMG + Stun entry",
          "Shotgun: Corner trade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Loading Dock push", from: "Truck View", use: "SMG Stun chain through Loading Dock." },
            { spawn: "Side Door flank", from: "Office", use: "Side Door off-angle Hardpoint." },
          ],
          spawnKillSpots: [
            { from: "Roof", target: "Warehouse defender", risk: "Medium — exposed long shot", reward: "Hardpoint pick + back-line trade" },
          ],
          advancedSetups: [
            "Stun + Frag chain.",
            "Killstreak Cluster on Warehouse.",
            "Side Door flank.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Shotgun", role: "Close-range hold", priority: "essential" },
          { name: "SMG Rusher", role: "Flank", priority: "recommended" },
        ],
        strategy: "Hold Warehouse Hardpoint: AR Hallway, Shotgun corner, SMG counter-flank.",
        callouts: ["Warehouse", "Loading Dock", "Side Doors", "Office", "Roof", "Hallway", "Truck View"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Shotgun: Corner",
          "SMG Rusher: Counter-flank",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Doors", target: "enemy push", timing: "Setup pre-position" },
            { from: "Roof", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Loading Dock.",
            "Claymore Side Doors.",
          ],
          advancedSetups: [
            "Claymore + Trophy.",
            "Corner sustain trade.",
            "Killstreak hold.",
          ],
        },
      },
    },
    "op-2": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "recommended" },
        ],
        strategy: "OP-2 is the elevated Hardpoint with long sightlines. Sniper controls, AR holds mid-range, SMG rushes via Stairs.",
        callouts: ["OP-2", "Sniper Spot", "Stairs", "Side Cover", "Lower Floor", "Hallway", "Roof"],
        utility: [
          "AR Anchor: AR + Frag",
          "Sniper: Long sightline",
          "SMG Rusher: SMG + Stun Stairs",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Stairs commit", from: "Lower Floor", use: "SMG Stun chain up Stairs." },
            { spawn: "Sniper take", from: "Side Cover", use: "Sniper pre-aims Hardpoint from cover." },
          ],
          spawnKillSpots: [
            { from: "Sniper Spot", target: "OP-2 defender", risk: "Medium — counter-snipe", reward: "Hardpoint pick + map control" },
          ],
          advancedSetups: [
            "Sniper long-shot pre-aim.",
            "Killstreak VTOL on cap.",
            "Stairs Stun + Frag chain.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "essential" },
          { name: "Shotgun", role: "Close-range", priority: "recommended" },
        ],
        strategy: "Hold OP-2 Hardpoint: Sniper long-shot, AR mid-range, Shotgun Stairs.",
        callouts: ["OP-2", "Sniper Spot", "Stairs", "Side Cover", "Lower Floor", "Hallway", "Roof"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Sniper: Long sightline",
          "Shotgun: Stairs trade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Cover", target: "enemy Sniper attempt", timing: "Setup pre-position" },
            { from: "Roof", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Stairs.",
            "Claymore Stairs.",
          ],
          advancedSetups: [
            "Claymore + Trophy.",
            "Sniper denial.",
            "Killstreak VTOL.",
          ],
        },
      },
    },
    "boneyard": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "recommended" },
        ],
        strategy: "Boneyard is the open junk-vehicle field. Sniper from long sightlines, AR mid-range, SMG flanks via Side Pile.",
        callouts: ["Boneyard", "Junk Pile", "Side Pile", "Tank Cover", "Open Field", "Side Path", "Wall"],
        utility: [
          "AR Anchor: AR + Frag",
          "Sniper: Long sightline",
          "SMG Rusher: SMG + Stun Side Pile",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Junk Pile commit", from: "Open Field", use: "AR cross-map + Sniper trade from Side Path." },
            { spawn: "Tank flank", from: "Side Pile", use: "Tank Cover flank for back-line." },
          ],
          spawnKillSpots: [
            { from: "Wall", target: "Boneyard defender", risk: "Medium — exposed long shot", reward: "Hardpoint pick + back-line trade" },
          ],
          advancedSetups: [
            "Sniper long-shot pre-aim.",
            "Killstreak Cluster on Junk Pile.",
            "Side Pile flank.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "essential" },
          { name: "SMG Rusher", role: "Flank", priority: "recommended" },
        ],
        strategy: "Hold Boneyard Hardpoint: Sniper from cover, AR mid-range, SMG counter-flank.",
        callouts: ["Boneyard", "Junk Pile", "Side Pile", "Tank Cover", "Open Field", "Side Path", "Wall"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Sniper: Long sightline",
          "SMG Rusher: Counter-flank",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Pile", target: "enemy flank", timing: "Setup pre-position" },
            { from: "Wall", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Open Field.",
            "Claymore Tank Cover.",
          ],
          advancedSetups: [
            "Claymore + Trophy.",
            "Sniper denial.",
            "Killstreak hold.",
          ],
        },
      },
    },
  },
  "babylon": {
    "garden": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Babylon Garden is the open Hanging Gardens-themed Hardpoint. AR cross-map, SMG flanks via Side Statues, Sniper trades from Tower View.",
        callouts: ["Garden", "Hedges", "Statue Cover", "Fountain", "Side Path", "Tower View", "Pond"],
        utility: [
          "AR Anchor: AR + Frag cross-map",
          "SMG Rusher: SMG + Stun entry",
          "Sniper: Tower View long sightline",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Garden commit", from: "Hedges", use: "AR + SMG cross commit, Sniper trades from Tower View." },
            { spawn: "Statue flank", from: "Side Path", use: "Statue flank off-angle Hardpoint." },
          ],
          spawnKillSpots: [
            { from: "Tower View", target: "Garden defender", risk: "Medium — exposed long shot", reward: "Hardpoint pick + Killstreak" },
          ],
          advancedSetups: [
            "Stun + Frag chain on entry.",
            "Killstreak VTOL on Hardpoint.",
            "Statue Cover flank.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Shotgun", role: "Close-range", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Hold Babylon Garden: AR Hedges cover, Shotgun corner, Sniper Tower View.",
        callouts: ["Garden", "Hedges", "Statue Cover", "Fountain", "Side Path", "Tower View", "Pond"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Shotgun: Corner",
          "Sniper: Tower View",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Path", target: "enemy flank", timing: "Setup pre-position" },
            { from: "Tower View", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Hedges entry.",
            "Claymore Statue Cover.",
          ],
          advancedSetups: [
            "Claymore + Trophy.",
            "Sniper Tower denial.",
            "Killstreak Chopper.",
          ],
        },
      },
    },
    "throne-room": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Shotgun", role: "Close-range", priority: "recommended" },
        ],
        strategy: "Babylon Throne Room is the interior Hardpoint with palace cover. SMG entry + AR cross from Garden View.",
        callouts: ["Throne Room", "Throne", "Side Pillars", "Doorway", "Garden View", "Stairs", "Back Hall"],
        utility: [
          "AR Anchor: AR + Frag cross",
          "SMG Rusher: SMG + Stun entry",
          "Shotgun: Corner trade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Throne push", from: "Doorway", use: "SMG Stun chain through Doorway." },
            { spawn: "Back Hall flank", from: "Stairs", use: "Back Hall off-angle Hardpoint." },
          ],
          spawnKillSpots: [
            { from: "Side Pillars", target: "Throne defender", risk: "Medium — exposed flank", reward: "Hardpoint pick + back-line trade" },
          ],
          advancedSetups: [
            "Stun + Frag chain on entry.",
            "Killstreak Cluster on Throne.",
            "Back Hall flank.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Shotgun", role: "Close-range hold", priority: "essential" },
          { name: "SMG Rusher", role: "Flank", priority: "recommended" },
        ],
        strategy: "Hold Throne Room: AR from Side Pillars, Shotgun Throne corner, SMG counter-flank.",
        callouts: ["Throne Room", "Throne", "Side Pillars", "Doorway", "Garden View", "Stairs", "Back Hall"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Shotgun: Throne corner",
          "SMG Rusher: Counter-flank",
        ],
        premiumTactics: {
          runouts: [
            { from: "Back Hall", target: "enemy flank", timing: "Setup pre-position" },
            { from: "Stairs", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Doorway.",
            "Claymore Back Hall.",
          ],
          advancedSetups: [
            "Claymore + Trophy.",
            "Throne sustain trade.",
            "Killstreak hold.",
          ],
        },
      },
    },
    "tower": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "recommended" },
        ],
        strategy: "Babylon Tower is the elevated Hardpoint with long sightlines. Sniper anchors, AR mid-range, SMG rushes via Stairs.",
        callouts: ["Tower Top", "Sniper Spot", "Stairs", "Side Cover", "Lower Floor", "Garden View", "Roof"],
        utility: [
          "AR Anchor: AR + Frag",
          "Sniper: Long sightline",
          "SMG Rusher: SMG + Stun Stairs",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Stairs commit", from: "Lower Floor", use: "SMG Stun chain up Stairs." },
            { spawn: "Sniper take", from: "Side Cover", use: "Sniper pre-aims Tower from cover." },
          ],
          spawnKillSpots: [
            { from: "Sniper Spot", target: "Tower defender", risk: "Medium — counter-snipe", reward: "Hardpoint pick + map control" },
          ],
          advancedSetups: [
            "Sniper long-shot pre-aim.",
            "Killstreak VTOL on cap.",
            "Stairs Stun + Frag chain.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "essential" },
          { name: "Shotgun", role: "Close-range", priority: "recommended" },
        ],
        strategy: "Hold Tower Hardpoint: Sniper anchors, AR mid-range, Shotgun Stairs trade.",
        callouts: ["Tower Top", "Sniper Spot", "Stairs", "Side Cover", "Lower Floor", "Garden View", "Roof"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Sniper: Long sightline",
          "Shotgun: Stairs trade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Cover", target: "enemy Sniper attempt", timing: "Setup pre-position" },
            { from: "Roof", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Stairs.",
            "Claymore Stairs.",
          ],
          advancedSetups: [
            "Claymore + Trophy.",
            "Sniper denial.",
            "Killstreak VTOL.",
          ],
        },
      },
    },
    "courtyard": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Babylon Courtyard is the open central Hardpoint. AR cross-map, SMG rush, Sniper from Tower View.",
        callouts: ["Courtyard", "Center Fountain", "Side Pillars", "Statue Cover", "Side Path", "Tower View", "Wall"],
        utility: [
          "AR Anchor: AR + Frag cross",
          "SMG Rusher: SMG + Stun entry",
          "Sniper: Tower View",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Courtyard commit", from: "Center Fountain", use: "AR + SMG cross commit." },
            { spawn: "Side flank", from: "Side Path", use: "Side Path off-angle Hardpoint." },
          ],
          spawnKillSpots: [
            { from: "Tower View", target: "Courtyard defender", risk: "Medium — exposed long shot", reward: "Hardpoint pick + Killstreak" },
          ],
          advancedSetups: [
            "Stun + Frag chain.",
            "Killstreak Cluster on Courtyard.",
            "Side Path flank.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Shotgun", role: "Close-range", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Hold Courtyard: AR Statue Cover, Shotgun corner, Sniper Tower View.",
        callouts: ["Courtyard", "Center Fountain", "Side Pillars", "Statue Cover", "Side Path", "Tower View", "Wall"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Shotgun: Corner",
          "Sniper: Tower View",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Path", target: "enemy flank", timing: "Setup pre-position" },
            { from: "Wall", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Center Fountain.",
            "Claymore Side Path.",
          ],
          advancedSetups: [
            "Claymore + Trophy.",
            "Sniper Tower denial.",
            "Killstreak Chopper.",
          ],
        },
      },
    },
  },
  "vondel": {
    "city-center": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Vondel City Center is the dense Resurgence urban POI. AR pre-aims contested choke, SMG flanks via Side Streets, Sniper picks from Rooftop, Support runs Recon Drone.",
        callouts: ["City Center", "Plaza", "Side Streets", "Rooftop", "Tunnels", "Spawn", "Cathedral View"],
        utility: [
          "AR Anchor: AR + Frag for mid-range",
          "SMG Rusher: SMG + Stun for entry",
          "Sniper / Marksman: Sniper for long sightline",
          "Support: Recon Drone for intel; Trophy for grenade denial",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "City Center push", from: "Plaza", use: "Ring rotation timing — push City Center on incoming circle." },
            { spawn: "Side Street flank", from: "Tunnels", use: "Side Street flank for off-angle pinch." },
          ],
          spawnKillSpots: [
            { from: "Rooftop", target: "enemy rotation path", risk: "Medium — exposed off-angle", reward: "Round-opener pick + map control" },
          ],
          advancedSetups: [
            "Killstreak combo: UAV → Cluster Strike on contested zone.",
            "Loadout drop timing: post-first-ring close for full kit.",
            "Smoke cover: Support smokes contested choke, AR pushes on the fade.",
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
        strategy: "Hold City Center: Sniper Rooftop, AR mid-range, SMG corner, Support Recon Drone for push reads.",
        callouts: ["City Center", "Plaza", "Side Streets", "Rooftop", "Tunnels", "Spawn", "Cathedral View"],
        utility: [
          "AR Anchor: AR + Claymore on entries",
          "SMG Rusher: SMG + Stun for entry trade",
          "Sniper: Rooftop long sightline + Cold-Blooded",
          "Support: Claymores + Trophy + Recon Drone",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Streets", target: "enemy approach path", timing: "Setup phase pre-position" },
            { from: "Rooftop", target: "enemy back-line", timing: "Mid-fight flank punish" },
          ],
          antiSpawnPeek: [
            "Pre-aim Plaza entry — every push commits through there.",
            "Save Sniper Rooftop shot for post-first-push third party.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo on entries.",
            "Off-angle Rooftop forces entry re-clear, buys 2-3s utility cycle.",
            "Rotation read: pre-position for ring close.",
          ],
        },
      },
    },
    "cathedral": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Vondel Cathedral is the elevated stone-work POI with tower vantage. Sniper from Bell Tower, AR mid-range, SMG flanks via Side Door.",
        callouts: ["Cathedral", "Bell Tower", "Nave", "Side Door", "Roof", "Crypt", "Spawn"],
        utility: [
          "AR Anchor: AR + Frag",
          "SMG Rusher: SMG + Stun entry",
          "Sniper: Bell Tower long sightline",
          "Support: Recon Drone + Trophy",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Cathedral push", from: "Nave", use: "Ring rotation push — Stun chain into Nave." },
            { spawn: "Crypt flank", from: "Side Door", use: "Crypt off-angle entry for back-line." },
          ],
          spawnKillSpots: [
            { from: "Bell Tower", target: "Cathedral defender", risk: "Medium — exposed long shot", reward: "Vantage pick + map control" },
          ],
          advancedSetups: [
            "Killstreak Cluster on Cathedral.",
            "Bell Tower Sniper take pre-fight.",
            "Crypt flank for surprise back-line.",
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
        strategy: "Hold Cathedral: Sniper Bell Tower, AR Nave, SMG corner, Support Recon Drone.",
        callouts: ["Cathedral", "Bell Tower", "Nave", "Side Door", "Roof", "Crypt", "Spawn"],
        utility: [
          "AR Anchor: AR + Claymore",
          "SMG Rusher: SMG + Stun",
          "Sniper: Bell Tower",
          "Support: Claymores + Trophy + Recon",
        ],
        premiumTactics: {
          runouts: [
            { from: "Crypt", target: "enemy push", timing: "Setup pre-position" },
            { from: "Roof", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Nave entry.",
            "Claymore Side Door.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo.",
            "Sniper Bell Tower denial.",
            "Rotation read.",
          ],
        },
      },
    },
    "marina": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
          { name: "Support / Tactical", role: "Support", priority: "recommended" },
        ],
        strategy: "Vondel Marina is the dock-side POI with water rotation routes. AR pre-aims main entry, SMG flanks via Boat Dock, Sniper from Dock Tower.",
        callouts: ["Marina", "Boat Dock", "Dock Tower", "Side Path", "Water Edge", "Spawn", "Cargo Cover"],
        utility: [
          "AR Anchor: AR + Frag",
          "SMG Rusher: SMG + Stun entry",
          "Sniper: Dock Tower long sightline",
          "Support: Recon Drone + Trophy",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Marina push", from: "Cargo Cover", use: "Ring push, Stun + Frag chain." },
            { spawn: "Boat Dock flank", from: "Water Edge", use: "Boat Dock flank for off-angle." },
          ],
          spawnKillSpots: [
            { from: "Dock Tower", target: "Marina defender", risk: "Medium — exposed long shot", reward: "Vantage pick + map control" },
          ],
          advancedSetups: [
            "Killstreak Cluster on Marina.",
            "Boat Dock flank for back-line.",
            "Water rotation route via Boat.",
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
        strategy: "Hold Marina: Sniper Dock Tower, AR Cargo Cover, SMG Boat Dock corner.",
        callouts: ["Marina", "Boat Dock", "Dock Tower", "Side Path", "Water Edge", "Spawn", "Cargo Cover"],
        utility: [
          "AR Anchor: AR + Claymore",
          "SMG Rusher: SMG + Stun",
          "Sniper: Dock Tower",
          "Support: Claymores + Trophy",
        ],
        premiumTactics: {
          runouts: [
            { from: "Boat Dock", target: "enemy push", timing: "Setup pre-position" },
            { from: "Water Edge", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Cargo Cover.",
            "Claymore Boat Dock.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo.",
            "Sniper Dock Tower denial.",
            "Water boat denial: trade on rotation.",
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
        strategy: "Vondel Stadium is the open arena POI with elevated seats. AR cross-map, SMG flanks via Tunnels, Sniper from Press Box.",
        callouts: ["Stadium", "Center Field", "Stadium Seats", "Tunnels", "Press Box", "Spawn", "Concourse"],
        utility: [
          "AR Anchor: AR + Frag cross",
          "SMG Rusher: SMG + Stun entry",
          "Sniper: Press Box long sightline",
          "Support: Recon Drone + Trophy",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Stadium push", from: "Center Field", use: "Ring push, Stun chain through Tunnels." },
            { spawn: "Stadium Seats flank", from: "Concourse", use: "Stadium Seats vertical flank." },
          ],
          spawnKillSpots: [
            { from: "Press Box", target: "Stadium defender", risk: "Medium — exposed long shot", reward: "Vantage pick + map control" },
          ],
          advancedSetups: [
            "Killstreak VTOL on Stadium.",
            "Press Box Sniper take pre-fight.",
            "Tunnels flank for back-line.",
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
        strategy: "Hold Stadium: Sniper Press Box, AR Stadium Seats, SMG Tunnels corner.",
        callouts: ["Stadium", "Center Field", "Stadium Seats", "Tunnels", "Press Box", "Spawn", "Concourse"],
        utility: [
          "AR Anchor: AR + Claymore",
          "SMG Rusher: SMG + Stun",
          "Sniper: Press Box",
          "Support: Claymores + Trophy",
        ],
        premiumTactics: {
          runouts: [
            { from: "Tunnels", target: "enemy push", timing: "Setup pre-position" },
            { from: "Concourse", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Center Field.",
            "Claymore Tunnels.",
          ],
          advancedSetups: [
            "Claymore + Trophy combo.",
            "Sniper Press Box denial.",
            "Killstreak VTOL on cap.",
          ],
        },
      },
    },
  },
  "stalingrad": {
    "tank": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Stalingrad Tank is the iconic destroyed tank Hardpoint. SMG entry + AR cross from Factory View, Sniper trades from rubble.",
        callouts: ["Tank", "Tank Cover", "Rubble", "Side Path", "Factory View", "Roof", "Open"],
        utility: [
          "AR Anchor: AR + Frag",
          "SMG Rusher: SMG + Stun entry",
          "Sniper: Rubble long sightline",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Tank push", from: "Tank Cover", use: "SMG Stun chain on Tank entry." },
            { spawn: "Side flank", from: "Rubble", use: "Side flank off-angle Hardpoint." },
          ],
          spawnKillSpots: [
            { from: "Roof", target: "Tank defender", risk: "Medium — exposed long shot", reward: "Hardpoint pick + Killstreak" },
          ],
          advancedSetups: [
            "Stun + Frag chain on entry.",
            "Killstreak Cluster on Tank.",
            "Rubble flank for back-line.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Shotgun", role: "Close-range", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Hold Tank Hardpoint: AR Tank Cover, Shotgun corner, Sniper rubble.",
        callouts: ["Tank", "Tank Cover", "Rubble", "Side Path", "Factory View", "Roof", "Open"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Shotgun: Corner",
          "Sniper: Rubble",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Path", target: "enemy push", timing: "Setup pre-position" },
            { from: "Roof", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Tank Cover.",
            "Claymore Side Path.",
          ],
          advancedSetups: [
            "Claymore + Trophy.",
            "Sniper denial.",
            "Killstreak hold.",
          ],
        },
      },
    },
    "factory": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Shotgun", role: "Close-range", priority: "recommended" },
        ],
        strategy: "Stalingrad Factory is the interior tight Hardpoint. SMG rush + AR cross from Office.",
        callouts: ["Factory", "Office", "Side Doors", "Catwalk", "Loading Bay", "Window", "Stairs"],
        utility: [
          "AR Anchor: AR + Frag",
          "SMG Rusher: SMG + Stun entry",
          "Shotgun: Corner trade",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Factory push", from: "Loading Bay", use: "SMG Stun chain through Loading Bay." },
            { spawn: "Catwalk flank", from: "Stairs", use: "Catwalk vertical off-angle." },
          ],
          spawnKillSpots: [
            { from: "Window", target: "Factory defender", risk: "Medium — exposed flank", reward: "Hardpoint pick + back-line trade" },
          ],
          advancedSetups: [
            "Stun + Frag chain on entry.",
            "Killstreak Cluster on Factory.",
            "Catwalk vertical flank.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Shotgun", role: "Close-range hold", priority: "essential" },
          { name: "SMG Rusher", role: "Flank", priority: "recommended" },
        ],
        strategy: "Hold Factory Hardpoint: AR Office, Shotgun corner, SMG counter-flank.",
        callouts: ["Factory", "Office", "Side Doors", "Catwalk", "Loading Bay", "Window", "Stairs"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Shotgun: Corner",
          "SMG Rusher: Counter-flank",
        ],
        premiumTactics: {
          runouts: [
            { from: "Stairs", target: "enemy flank", timing: "Setup pre-position" },
            { from: "Window", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Loading Bay.",
            "Claymore Side Doors.",
          ],
          advancedSetups: [
            "Claymore + Trophy.",
            "Office sustain trade.",
            "Killstreak hold.",
          ],
        },
      },
    },
    "plaza": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Stalingrad Plaza is the open central Hardpoint. AR cross-map, SMG rush, Sniper from rubble.",
        callouts: ["Plaza", "Center Cover", "Side Rubble", "Statue", "Side Path", "Window View", "Open"],
        utility: [
          "AR Anchor: AR + Frag cross",
          "SMG Rusher: SMG + Stun entry",
          "Sniper: Rubble long sightline",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Plaza push", from: "Center Cover", use: "AR + SMG cross commit." },
            { spawn: "Side Rubble flank", from: "Side Path", use: "Side Rubble off-angle Hardpoint." },
          ],
          spawnKillSpots: [
            { from: "Window View", target: "Plaza defender", risk: "Medium — exposed long shot", reward: "Hardpoint pick + Killstreak" },
          ],
          advancedSetups: [
            "Stun + Frag chain.",
            "Killstreak Cluster on Plaza.",
            "Rubble flank.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Shotgun", role: "Close-range", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "recommended" },
        ],
        strategy: "Hold Plaza: AR Center Cover, Shotgun Statue corner, Sniper Window View.",
        callouts: ["Plaza", "Center Cover", "Side Rubble", "Statue", "Side Path", "Window View", "Open"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Shotgun: Statue corner",
          "Sniper: Window View",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Rubble", target: "enemy flank", timing: "Setup pre-position" },
            { from: "Window View", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Center Cover.",
            "Claymore Side Path.",
          ],
          advancedSetups: [
            "Claymore + Trophy.",
            "Sniper Window denial.",
            "Killstreak Chopper.",
          ],
        },
      },
    },
    "bridge": {
      attack: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "essential" },
          { name: "SMG Rusher", role: "SMG / Entry", priority: "recommended" },
        ],
        strategy: "Stalingrad Bridge is the long sightline crossing. Sniper anchors long, AR mid-range, SMG rushes via Side Path.",
        callouts: ["Bridge", "Sniper Spot", "Side Path", "Below Bridge", "Far Side", "Cover", "Open"],
        utility: [
          "AR Anchor: AR + Frag",
          "Sniper: Long sightline",
          "SMG Rusher: SMG + Stun Side Path",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Bridge cross", from: "Cover", use: "Sniper covers, SMG rushes Side Path." },
            { spawn: "Below Bridge flank", from: "Side Path", use: "Below Bridge for off-angle." },
          ],
          spawnKillSpots: [
            { from: "Sniper Spot", target: "Bridge defender", risk: "Medium — counter-snipe", reward: "Hardpoint pick + map control" },
          ],
          advancedSetups: [
            "Sniper long-shot pre-aim Bridge.",
            "Killstreak VTOL on Bridge.",
            "Below Bridge flank.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "AR Anchor", role: "AR", priority: "essential" },
          { name: "Sniper / Marksman", role: "Sniper", priority: "essential" },
          { name: "Shotgun", role: "Close-range", priority: "recommended" },
        ],
        strategy: "Hold Bridge Hardpoint: Sniper anchors, AR Cover, Shotgun Side Path.",
        callouts: ["Bridge", "Sniper Spot", "Side Path", "Below Bridge", "Far Side", "Cover", "Open"],
        utility: [
          "AR Anchor: AR + Claymore",
          "Sniper: Long sightline",
          "Shotgun: Side Path trade",
        ],
        premiumTactics: {
          runouts: [
            { from: "Below Bridge", target: "enemy flank", timing: "Setup pre-position" },
            { from: "Far Side", target: "enemy back-line", timing: "Mid-fight flank" },
          ],
          antiSpawnPeek: [
            "Pre-aim Bridge cross.",
            "Claymore Side Path.",
          ],
          advancedSetups: [
            "Claymore + Trophy.",
            "Sniper denial.",
            "Killstreak VTOL.",
          ],
        },
      },
    },
  },
  "gulag": {
    "main-floor": {
      attack: {
        operators: [
          { name: "Loadout", role: "1v1 Trade", priority: "essential" },
        ],
        strategy: "Gulag is 1v1 — Main Floor is the standard ground engagement zone. Push with pre-aimed gun, listen for footsteps, trade on the head peek.",
        callouts: ["Main Floor", "Center", "Side Doors", "Cubby", "Stairs Up", "Spawn Side"],
        utility: [
          "Loadout: Pistol or SMG; throwing knife for chip damage",
        ],
      },
      defense: {
        operators: [
          { name: "Loadout", role: "1v1 Hold", priority: "essential" },
        ],
        strategy: "Hold Gulag Main Floor: pre-aim corner, listen for opponent. 1v1 is reaction + audio.",
        callouts: ["Main Floor", "Center", "Side Doors", "Cubby", "Stairs Up", "Spawn Side"],
        utility: [
          "Loadout: Pistol/SMG; throwing knife",
        ],
      },
    },
    "catwalk": {
      attack: {
        operators: [
          { name: "Loadout", role: "1v1 Trade", priority: "essential" },
        ],
        strategy: "Gulag Catwalk is the elevated flank route. Push Catwalk for vertical angle, drop on opponent below.",
        callouts: ["Catwalk", "Catwalk Top", "Stairs Up", "Main Floor View", "Drop Point", "Side"],
        utility: [
          "Loadout: Pistol or SMG; throwing knife for chip damage",
        ],
      },
      defense: {
        operators: [
          { name: "Loadout", role: "1v1 Hold", priority: "essential" },
        ],
        strategy: "Hold Gulag Catwalk: pre-aim Stairs Up, listen for climbing audio.",
        callouts: ["Catwalk", "Catwalk Top", "Stairs Up", "Main Floor View", "Drop Point", "Side"],
        utility: [
          "Loadout: Pistol/SMG; throwing knife",
        ],
      },
    },
  },
}

export default STRATS
