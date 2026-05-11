// The Finals — v1 generated strats. Per (arena, vault/cashout, side).
// `attack` = stealing / contesting, `defense` = defending the extract.

const STRATS = {
  "las-vegas": {
    "casino-vault": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Cashout contest on Casino Vault: Light enters first to scout, Heavy charges in with Mesh Shield, Medium Defibs on wipe. Goal is killing all 3 of the holding team before the extraction completes. Pool entry is the off-angle flank — Light grapples to penthouse for vertical pickoffs.",
        callouts: ["Casino Floor", "Vault", "Penthouse", "Pool", "Garage", "Strip", "Casino"],
        utility: [
          "Heavy: Mesh Shield + Barricade for vault carry; RPG / C4 for cracking the contest",
          "Medium: Healing Beam + Defibrillator for sustain; APS Turret for projectile defense",
          "Light: Cloak + Grapple for flanking; Glitch Grenades to disable enemy Defibs",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Casino Vault steal route", from: "Casino Floor", use: "Standard vault carry path — Heavy carries with Mesh Shield, team holds adjacent angles." },
            { spawn: "Casino Vault re-steal opportunity", from: "Adjacent rooftop", use: "When third team contests, re-steal the cashout while two teams fight each other." },
          ],
          spawnKillSpots: [
            { from: "Casino Floor", target: "enemy Cashout team during contest", risk: "Medium — third team may engage during your push", reward: "Cashout steal + 3rd-place team eliminated" },
          ],
          advancedSetups: [
            "Third-party timing: wait for two teams to engage at Casino Vault, push the survivor + steal the cashout. Standard 3-team rotation read.",
            "Vault carry route: Heavy commits front with Mesh + Barricade, Medium runs heal beam behind, Light flanks for trade kill.",
            "Defib chain: Medium Defibs on wipe, team retraces to the same Casino Vault position. Force the contest team to commit twice.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Reset / re-steal hold on Casino Vault: hold the Cashout but pre-position for the inevitable wipe. Medium has Defib ready, Heavy ready to re-steal post-wipe, Light flanks the contest team for the third-party trade. Penthouse cross-fire from Pool gives the standard 2-floor hold.",
        callouts: ["Casino Floor", "Vault", "Penthouse", "Pool", "Garage", "Strip", "Casino"],
        utility: [
          "Heavy: Barricade + APS Turret + RPG for choke denial; Goo Gun for sealing entries",
          "Medium: Healing Beam + Defib + Smoke for sustained holds; Jump Pad for vertical reposition",
          "Light: SR-84 + Grappling Hook + Stun Gun for off-angle pickoffs",
        ],
        premiumTactics: {
          runouts: [
            { from: "Casino Floor", target: "incoming team approach", timing: "15-second extract timer — pre-position before contest engages." },
            { from: "Side rooftop", target: "flanking third team", timing: "Mid-contest — peel for teammate that engaged first." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard approach on Casino Floor — most contests come from the same path each round.",
            "Save the off-angle Light SR-84 shot for after the first team pushes — third team always comes from a different direction.",
            "Trade-stack Casino Floor with the Heavy — if the first contestant takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Goo + Pyro combo: Heavy goos the entry, Medium Pyros the goo for fire damage, Light cleans up survivors.",
            "Multi-floor hold: Heavy on Cashout, Medium one floor up with Jump Pad, Light on rooftop. Punish the standard ground push.",
            "Reset hold: pre-position for the inevitable wipe — Medium Defib ready, Heavy ready to re-engage. Force contest team to commit twice.",
          ],
        },
      },
    },
    "strip-cashout": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Cashout contest on Strip Cashout: Light enters first to scout, Heavy charges in with Mesh Shield, Medium Defibs on wipe. Goal is killing all 3 of the holding team before the extraction completes. Streets approach is exposed — Heavy commits front with Mesh Shield cover.",
        callouts: ["Strip", "Plaza", "Rooftops", "Streets", "Garage", "Strip", "Casino"],
        utility: [
          "Heavy: Mesh Shield + Barricade for vault carry; RPG / C4 for cracking the contest",
          "Medium: Healing Beam + Defibrillator for sustain; APS Turret for projectile defense",
          "Light: Cloak + Grapple for flanking; Glitch Grenades to disable enemy Defibs",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Strip Cashout steal route", from: "Strip", use: "Standard vault carry path — Heavy carries with Mesh Shield, team holds adjacent angles." },
            { spawn: "Strip Cashout re-steal opportunity", from: "Adjacent rooftop", use: "When third team contests, re-steal the cashout while two teams fight each other." },
          ],
          spawnKillSpots: [
            { from: "Strip", target: "enemy Cashout team during contest", risk: "Medium — third team may engage during your push", reward: "Cashout steal + 3rd-place team eliminated" },
          ],
          advancedSetups: [
            "Third-party timing: wait for two teams to engage at Strip Cashout, push the survivor + steal the cashout. Standard 3-team rotation read.",
            "Vault carry route: Heavy commits front with Mesh + Barricade, Medium runs heal beam behind, Light flanks for trade kill.",
            "Defib chain: Medium Defibs on wipe, team retraces to the same Strip Cashout position. Force the contest team to commit twice.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Reset / re-steal hold on Strip Cashout: hold the Cashout but pre-position for the inevitable wipe. Medium has Defib ready, Heavy ready to re-steal post-wipe, Light flanks the contest team for the third-party trade. Rooftop hold with Light snipe + Heavy choke barricade wins most contests.",
        callouts: ["Strip", "Plaza", "Rooftops", "Streets", "Garage", "Strip", "Casino"],
        utility: [
          "Heavy: Barricade + APS Turret + RPG for choke denial; Goo Gun for sealing entries",
          "Medium: Healing Beam + Defib + Smoke for sustained holds; Jump Pad for vertical reposition",
          "Light: SR-84 + Grappling Hook + Stun Gun for off-angle pickoffs",
        ],
        premiumTactics: {
          runouts: [
            { from: "Strip", target: "incoming team approach", timing: "15-second extract timer — pre-position before contest engages." },
            { from: "Side rooftop", target: "flanking third team", timing: "Mid-contest — peel for teammate that engaged first." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard approach on Strip — most contests come from the same path each round.",
            "Save the off-angle Light SR-84 shot for after the first team pushes — third team always comes from a different direction.",
            "Trade-stack Strip with the Heavy — if the first contestant takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Goo + Pyro combo: Heavy goos the entry, Medium Pyros the goo for fire damage, Light cleans up survivors.",
            "Multi-floor hold: Heavy on Cashout, Medium one floor up with Jump Pad, Light on rooftop. Punish the standard ground push.",
            "Reset hold: pre-position for the inevitable wipe — Medium Defib ready, Heavy ready to re-engage. Force contest team to commit twice.",
          ],
        },
      },
    },
    "penthouse-cashout": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Off-angle hit on Penthouse Cashout: Medium drops a Jump Pad behind the holders, Light flanks via grappling hook, Heavy commits front. Force a multi-angle contest before extract. Rooftop entry is the off-angle — Light grapples to roof for the surprise commit.",
        callouts: ["Penthouse", "Casino Floor", "Rooftops", "Pool", "Streets", "Strip", "Casino"],
        utility: [
          "Heavy: Mesh Shield + Barricade for vault carry; RPG / C4 for cracking the contest",
          "Medium: Healing Beam + Defibrillator for sustain; APS Turret for projectile defense",
          "Light: Cloak + Grapple for flanking; Glitch Grenades to disable enemy Defibs",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Penthouse Cashout steal route", from: "Penthouse", use: "Standard vault carry path — Heavy carries with Mesh Shield, team holds adjacent angles." },
            { spawn: "Penthouse Cashout re-steal opportunity", from: "Adjacent rooftop", use: "When third team contests, re-steal the cashout while two teams fight each other." },
          ],
          spawnKillSpots: [
            { from: "Penthouse", target: "enemy Cashout team during contest", risk: "Medium — third team may engage during your push", reward: "Cashout steal + 3rd-place team eliminated" },
          ],
          advancedSetups: [
            "Third-party timing: wait for two teams to engage at Penthouse Cashout, push the survivor + steal the cashout. Standard 3-team rotation read.",
            "Vault carry route: Heavy commits front with Mesh + Barricade, Medium runs heal beam behind, Light flanks for trade kill.",
            "Defib chain: Medium Defibs on wipe, team retraces to the same Penthouse Cashout position. Force the contest team to commit twice.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Defend Penthouse Cashout: Heavy sets Barricade + APS Turret on the choke, Medium runs heal beam, Light scouts approaches with grapple from Penthouse. Force teams to push you in a 3rd-team-friendly setup. Casino floor anchor with Penthouse trade is the standard 2-floor hold.",
        callouts: ["Penthouse", "Casino Floor", "Rooftops", "Pool", "Streets", "Strip", "Casino"],
        utility: [
          "Heavy: Barricade + APS Turret + RPG for choke denial; Goo Gun for sealing entries",
          "Medium: Healing Beam + Defib + Smoke for sustained holds; Jump Pad for vertical reposition",
          "Light: SR-84 + Grappling Hook + Stun Gun for off-angle pickoffs",
        ],
        premiumTactics: {
          runouts: [
            { from: "Penthouse", target: "incoming team approach", timing: "15-second extract timer — pre-position before contest engages." },
            { from: "Side rooftop", target: "flanking third team", timing: "Mid-contest — peel for teammate that engaged first." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard approach on Penthouse — most contests come from the same path each round.",
            "Save the off-angle Light SR-84 shot for after the first team pushes — third team always comes from a different direction.",
            "Trade-stack Penthouse with the Heavy — if the first contestant takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Goo + Pyro combo: Heavy goos the entry, Medium Pyros the goo for fire damage, Light cleans up survivors.",
            "Multi-floor hold: Heavy on Cashout, Medium one floor up with Jump Pad, Light on rooftop. Punish the standard ground push.",
            "Reset hold: pre-position for the inevitable wipe — Medium Defib ready, Heavy ready to re-engage. Force contest team to commit twice.",
          ],
        },
      },
    },
  },
  "monaco": {
    "yacht-vault": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Off-angle hit on Yacht Vault: Medium drops a Jump Pad behind the holders, Light flanks via grappling hook, Heavy commits front. Force a multi-angle contest before extract. Pool entry is the swim flank — Light dives for the surprise rear push.",
        callouts: ["Yacht Deck", "Vault Hold", "Cabin", "Pool", "Harbor", "Harbor", "Streets"],
        utility: [
          "Heavy: Mesh Shield + Barricade for vault carry; RPG / C4 for cracking the contest",
          "Medium: Healing Beam + Defibrillator for sustain; APS Turret for projectile defense",
          "Light: Cloak + Grapple for flanking; Glitch Grenades to disable enemy Defibs",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Yacht Vault steal route", from: "Yacht Deck", use: "Standard vault carry path — Heavy carries with Mesh Shield, team holds adjacent angles." },
            { spawn: "Yacht Vault re-steal opportunity", from: "Adjacent rooftop", use: "When third team contests, re-steal the cashout while two teams fight each other." },
          ],
          spawnKillSpots: [
            { from: "Yacht Deck", target: "enemy Cashout team during contest", risk: "Medium — third team may engage during your push", reward: "Cashout steal + 3rd-place team eliminated" },
          ],
          advancedSetups: [
            "Third-party timing: wait for two teams to engage at Yacht Vault, push the survivor + steal the cashout. Standard 3-team rotation read.",
            "Vault carry route: Heavy commits front with Mesh + Barricade, Medium runs heal beam behind, Light flanks for trade kill.",
            "Defib chain: Medium Defibs on wipe, team retraces to the same Yacht Vault position. Force the contest team to commit twice.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Defend Yacht Vault: Heavy sets Barricade + APS Turret on the choke, Medium runs heal beam, Light scouts approaches with grapple from Yacht Deck. Force teams to push you in a 3rd-team-friendly setup. Cabin anchor with Yacht Deck cross-fire denies the standard pool dive.",
        callouts: ["Yacht Deck", "Vault Hold", "Cabin", "Pool", "Harbor", "Harbor", "Streets"],
        utility: [
          "Heavy: Barricade + APS Turret + RPG for choke denial; Goo Gun for sealing entries",
          "Medium: Healing Beam + Defib + Smoke for sustained holds; Jump Pad for vertical reposition",
          "Light: SR-84 + Grappling Hook + Stun Gun for off-angle pickoffs",
        ],
        premiumTactics: {
          runouts: [
            { from: "Yacht Deck", target: "incoming team approach", timing: "15-second extract timer — pre-position before contest engages." },
            { from: "Side rooftop", target: "flanking third team", timing: "Mid-contest — peel for teammate that engaged first." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard approach on Yacht Deck — most contests come from the same path each round.",
            "Save the off-angle Light SR-84 shot for after the first team pushes — third team always comes from a different direction.",
            "Trade-stack Yacht Deck with the Heavy — if the first contestant takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Goo + Pyro combo: Heavy goos the entry, Medium Pyros the goo for fire damage, Light cleans up survivors.",
            "Multi-floor hold: Heavy on Cashout, Medium one floor up with Jump Pad, Light on rooftop. Punish the standard ground push.",
            "Reset hold: pre-position for the inevitable wipe — Medium Defib ready, Heavy ready to re-engage. Force contest team to commit twice.",
          ],
        },
      },
    },
    "plaza-cashout": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Vault steal on Plaza Cashout: Heavy carries the vault on extract, Medium heals + Defibs on wipes, Light flanks contesting teams from Plaza. Force a 3rd-team contest by holding the vault between two enemy spawn rotations. Promenade rooftop dive splits the holding team.",
        callouts: ["Plaza", "Streets", "Rooftops", "Promenade", "Garage", "Harbor", "Streets"],
        utility: [
          "Heavy: Mesh Shield + Barricade for vault carry; RPG / C4 for cracking the contest",
          "Medium: Healing Beam + Defibrillator for sustain; APS Turret for projectile defense",
          "Light: Cloak + Grapple for flanking; Glitch Grenades to disable enemy Defibs",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Plaza Cashout steal route", from: "Plaza", use: "Standard vault carry path — Heavy carries with Mesh Shield, team holds adjacent angles." },
            { spawn: "Plaza Cashout re-steal opportunity", from: "Adjacent rooftop", use: "When third team contests, re-steal the cashout while two teams fight each other." },
          ],
          spawnKillSpots: [
            { from: "Plaza", target: "enemy Cashout team during contest", risk: "Medium — third team may engage during your push", reward: "Cashout steal + 3rd-place team eliminated" },
          ],
          advancedSetups: [
            "Third-party timing: wait for two teams to engage at Plaza Cashout, push the survivor + steal the cashout. Standard 3-team rotation read.",
            "Vault carry route: Heavy commits front with Mesh + Barricade, Medium runs heal beam behind, Light flanks for trade kill.",
            "Defib chain: Medium Defibs on wipe, team retraces to the same Plaza Cashout position. Force the contest team to commit twice.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Multi-floor hold on Plaza Cashout: Heavy on the Cashout floor, Medium one floor up with Jump Pad ready, Light on rooftop for vertical pickoffs. Punish the standard ground push. Rooftop snipe + Plaza ground anchor is the textbook hold.",
        callouts: ["Plaza", "Streets", "Rooftops", "Promenade", "Garage", "Harbor", "Streets"],
        utility: [
          "Heavy: Barricade + APS Turret + RPG for choke denial; Goo Gun for sealing entries",
          "Medium: Healing Beam + Defib + Smoke for sustained holds; Jump Pad for vertical reposition",
          "Light: SR-84 + Grappling Hook + Stun Gun for off-angle pickoffs",
        ],
        premiumTactics: {
          runouts: [
            { from: "Plaza", target: "incoming team approach", timing: "15-second extract timer — pre-position before contest engages." },
            { from: "Side rooftop", target: "flanking third team", timing: "Mid-contest — peel for teammate that engaged first." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard approach on Plaza — most contests come from the same path each round.",
            "Save the off-angle Light SR-84 shot for after the first team pushes — third team always comes from a different direction.",
            "Trade-stack Plaza with the Heavy — if the first contestant takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Goo + Pyro combo: Heavy goos the entry, Medium Pyros the goo for fire damage, Light cleans up survivors.",
            "Multi-floor hold: Heavy on Cashout, Medium one floor up with Jump Pad, Light on rooftop. Punish the standard ground push.",
            "Reset hold: pre-position for the inevitable wipe — Medium Defib ready, Heavy ready to re-engage. Force contest team to commit twice.",
          ],
        },
      },
    },
    "harbor-cashout": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Vault steal on Harbor Cashout: Heavy carries the vault on extract, Medium heals + Defibs on wipes, Light flanks contesting teams from Harbor. Force a 3rd-team contest by holding the vault between two enemy spawn rotations. Harbor swim approach catches the standard rooftop hold off-angle.",
        callouts: ["Harbor", "Yacht", "Promenade", "Streets", "Plaza", "Harbor", "Streets"],
        utility: [
          "Heavy: Mesh Shield + Barricade for vault carry; RPG / C4 for cracking the contest",
          "Medium: Healing Beam + Defibrillator for sustain; APS Turret for projectile defense",
          "Light: Cloak + Grapple for flanking; Glitch Grenades to disable enemy Defibs",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Harbor Cashout steal route", from: "Harbor", use: "Standard vault carry path — Heavy carries with Mesh Shield, team holds adjacent angles." },
            { spawn: "Harbor Cashout re-steal opportunity", from: "Adjacent rooftop", use: "When third team contests, re-steal the cashout while two teams fight each other." },
          ],
          spawnKillSpots: [
            { from: "Harbor", target: "enemy Cashout team during contest", risk: "Medium — third team may engage during your push", reward: "Cashout steal + 3rd-place team eliminated" },
          ],
          advancedSetups: [
            "Third-party timing: wait for two teams to engage at Harbor Cashout, push the survivor + steal the cashout. Standard 3-team rotation read.",
            "Vault carry route: Heavy commits front with Mesh + Barricade, Medium runs heal beam behind, Light flanks for trade kill.",
            "Defib chain: Medium Defibs on wipe, team retraces to the same Harbor Cashout position. Force the contest team to commit twice.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Multi-floor hold on Harbor Cashout: Heavy on the Cashout floor, Medium one floor up with Jump Pad ready, Light on rooftop for vertical pickoffs. Punish the standard ground push. Yacht cross-fire from Harbor wins the standard contest.",
        callouts: ["Harbor", "Yacht", "Promenade", "Streets", "Plaza", "Harbor", "Streets"],
        utility: [
          "Heavy: Barricade + APS Turret + RPG for choke denial; Goo Gun for sealing entries",
          "Medium: Healing Beam + Defib + Smoke for sustained holds; Jump Pad for vertical reposition",
          "Light: SR-84 + Grappling Hook + Stun Gun for off-angle pickoffs",
        ],
        premiumTactics: {
          runouts: [
            { from: "Harbor", target: "incoming team approach", timing: "15-second extract timer — pre-position before contest engages." },
            { from: "Side rooftop", target: "flanking third team", timing: "Mid-contest — peel for teammate that engaged first." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard approach on Harbor — most contests come from the same path each round.",
            "Save the off-angle Light SR-84 shot for after the first team pushes — third team always comes from a different direction.",
            "Trade-stack Harbor with the Heavy — if the first contestant takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Goo + Pyro combo: Heavy goos the entry, Medium Pyros the goo for fire damage, Light cleans up survivors.",
            "Multi-floor hold: Heavy on Cashout, Medium one floor up with Jump Pad, Light on rooftop. Punish the standard ground push.",
            "Reset hold: pre-position for the inevitable wipe — Medium Defib ready, Heavy ready to re-engage. Force contest team to commit twice.",
          ],
        },
      },
    },
  },
  "seoul": {
    "mall-vault": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Off-angle hit on Mall Vault: Medium drops a Jump Pad behind the holders, Light flanks via grappling hook, Heavy commits front. Force a multi-angle contest before extract. Floors above the vault give vertical pressure — Light grapples for the drop.",
        callouts: ["Mall Center", "Vault", "Floors", "Atrium", "Streets", "Streets", "Mall"],
        utility: [
          "Heavy: Mesh Shield + Barricade for vault carry; RPG / C4 for cracking the contest",
          "Medium: Healing Beam + Defibrillator for sustain; APS Turret for projectile defense",
          "Light: Cloak + Grapple for flanking; Glitch Grenades to disable enemy Defibs",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Mall Vault steal route", from: "Mall Center", use: "Standard vault carry path — Heavy carries with Mesh Shield, team holds adjacent angles." },
            { spawn: "Mall Vault re-steal opportunity", from: "Adjacent rooftop", use: "When third team contests, re-steal the cashout while two teams fight each other." },
          ],
          spawnKillSpots: [
            { from: "Mall Center", target: "enemy Cashout team during contest", risk: "Medium — third team may engage during your push", reward: "Cashout steal + 3rd-place team eliminated" },
          ],
          advancedSetups: [
            "Third-party timing: wait for two teams to engage at Mall Vault, push the survivor + steal the cashout. Standard 3-team rotation read.",
            "Vault carry route: Heavy commits front with Mesh + Barricade, Medium runs heal beam behind, Light flanks for trade kill.",
            "Defib chain: Medium Defibs on wipe, team retraces to the same Mall Vault position. Force the contest team to commit twice.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Defend Mall Vault: Heavy sets Barricade + APS Turret on the choke, Medium runs heal beam, Light scouts approaches with grapple from Mall Center. Force teams to push you in a 3rd-team-friendly setup. Multi-floor anchor with cross-fire from Atrium denies the standard push.",
        callouts: ["Mall Center", "Vault", "Floors", "Atrium", "Streets", "Streets", "Mall"],
        utility: [
          "Heavy: Barricade + APS Turret + RPG for choke denial; Goo Gun for sealing entries",
          "Medium: Healing Beam + Defib + Smoke for sustained holds; Jump Pad for vertical reposition",
          "Light: SR-84 + Grappling Hook + Stun Gun for off-angle pickoffs",
        ],
        premiumTactics: {
          runouts: [
            { from: "Mall Center", target: "incoming team approach", timing: "15-second extract timer — pre-position before contest engages." },
            { from: "Side rooftop", target: "flanking third team", timing: "Mid-contest — peel for teammate that engaged first." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard approach on Mall Center — most contests come from the same path each round.",
            "Save the off-angle Light SR-84 shot for after the first team pushes — third team always comes from a different direction.",
            "Trade-stack Mall Center with the Heavy — if the first contestant takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Goo + Pyro combo: Heavy goos the entry, Medium Pyros the goo for fire damage, Light cleans up survivors.",
            "Multi-floor hold: Heavy on Cashout, Medium one floor up with Jump Pad, Light on rooftop. Punish the standard ground push.",
            "Reset hold: pre-position for the inevitable wipe — Medium Defib ready, Heavy ready to re-engage. Force contest team to commit twice.",
          ],
        },
      },
    },
    "plaza-cashout": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Cashout contest on Plaza Cashout: Light enters first to scout, Heavy charges in with Mesh Shield, Medium Defibs on wipe. Goal is killing all 3 of the holding team before the extraction completes. Subway flank from underneath catches the standard rooftop hold.",
        callouts: ["Plaza", "Streets", "Rooftops", "Subway", "Garage", "Streets", "Mall"],
        utility: [
          "Heavy: Mesh Shield + Barricade for vault carry; RPG / C4 for cracking the contest",
          "Medium: Healing Beam + Defibrillator for sustain; APS Turret for projectile defense",
          "Light: Cloak + Grapple for flanking; Glitch Grenades to disable enemy Defibs",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Plaza Cashout steal route", from: "Plaza", use: "Standard vault carry path — Heavy carries with Mesh Shield, team holds adjacent angles." },
            { spawn: "Plaza Cashout re-steal opportunity", from: "Adjacent rooftop", use: "When third team contests, re-steal the cashout while two teams fight each other." },
          ],
          spawnKillSpots: [
            { from: "Plaza", target: "enemy Cashout team during contest", risk: "Medium — third team may engage during your push", reward: "Cashout steal + 3rd-place team eliminated" },
          ],
          advancedSetups: [
            "Third-party timing: wait for two teams to engage at Plaza Cashout, push the survivor + steal the cashout. Standard 3-team rotation read.",
            "Vault carry route: Heavy commits front with Mesh + Barricade, Medium runs heal beam behind, Light flanks for trade kill.",
            "Defib chain: Medium Defibs on wipe, team retraces to the same Plaza Cashout position. Force the contest team to commit twice.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Reset / re-steal hold on Plaza Cashout: hold the Cashout but pre-position for the inevitable wipe. Medium has Defib ready, Heavy ready to re-steal post-wipe, Light flanks the contest team for the third-party trade. Rooftop hold with Subway choke barricade is the textbook setup.",
        callouts: ["Plaza", "Streets", "Rooftops", "Subway", "Garage", "Streets", "Mall"],
        utility: [
          "Heavy: Barricade + APS Turret + RPG for choke denial; Goo Gun for sealing entries",
          "Medium: Healing Beam + Defib + Smoke for sustained holds; Jump Pad for vertical reposition",
          "Light: SR-84 + Grappling Hook + Stun Gun for off-angle pickoffs",
        ],
        premiumTactics: {
          runouts: [
            { from: "Plaza", target: "incoming team approach", timing: "15-second extract timer — pre-position before contest engages." },
            { from: "Side rooftop", target: "flanking third team", timing: "Mid-contest — peel for teammate that engaged first." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard approach on Plaza — most contests come from the same path each round.",
            "Save the off-angle Light SR-84 shot for after the first team pushes — third team always comes from a different direction.",
            "Trade-stack Plaza with the Heavy — if the first contestant takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Goo + Pyro combo: Heavy goos the entry, Medium Pyros the goo for fire damage, Light cleans up survivors.",
            "Multi-floor hold: Heavy on Cashout, Medium one floor up with Jump Pad, Light on rooftop. Punish the standard ground push.",
            "Reset hold: pre-position for the inevitable wipe — Medium Defib ready, Heavy ready to re-engage. Force contest team to commit twice.",
          ],
        },
      },
    },
    "tower-cashout": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Cashout snipe + push on Tower Cashout: Light snipes with SR-84 from Tower Top, Heavy + Medium push on the trade. Defib chain through the contest. Heavy carries the new Cashout to the next extract. Rooftop dive from adjacent buildings splits the hold.",
        callouts: ["Tower Top", "Streets", "Rooftops", "Plaza", "Garage", "Streets", "Mall"],
        utility: [
          "Heavy: Mesh Shield + Barricade for vault carry; RPG / C4 for cracking the contest",
          "Medium: Healing Beam + Defibrillator for sustain; APS Turret for projectile defense",
          "Light: Cloak + Grapple for flanking; Glitch Grenades to disable enemy Defibs",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Tower Cashout steal route", from: "Tower Top", use: "Standard vault carry path — Heavy carries with Mesh Shield, team holds adjacent angles." },
            { spawn: "Tower Cashout re-steal opportunity", from: "Adjacent rooftop", use: "When third team contests, re-steal the cashout while two teams fight each other." },
          ],
          spawnKillSpots: [
            { from: "Tower Top", target: "enemy Cashout team during contest", risk: "Medium — third team may engage during your push", reward: "Cashout steal + 3rd-place team eliminated" },
          ],
          advancedSetups: [
            "Third-party timing: wait for two teams to engage at Tower Cashout, push the survivor + steal the cashout. Standard 3-team rotation read.",
            "Vault carry route: Heavy commits front with Mesh + Barricade, Medium runs heal beam behind, Light flanks for trade kill.",
            "Defib chain: Medium Defibs on wipe, team retraces to the same Tower Cashout position. Force the contest team to commit twice.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Gas + Goo hold on Tower Cashout: Heavy goos the choke entries, Medium drops Smoke + heal, Light flanks for the trade kill. Force pushers to break utility before contesting. Tower top cross-fire from rooftops denies the standard contest.",
        callouts: ["Tower Top", "Streets", "Rooftops", "Plaza", "Garage", "Streets", "Mall"],
        utility: [
          "Heavy: Barricade + APS Turret + RPG for choke denial; Goo Gun for sealing entries",
          "Medium: Healing Beam + Defib + Smoke for sustained holds; Jump Pad for vertical reposition",
          "Light: SR-84 + Grappling Hook + Stun Gun for off-angle pickoffs",
        ],
        premiumTactics: {
          runouts: [
            { from: "Tower Top", target: "incoming team approach", timing: "15-second extract timer — pre-position before contest engages." },
            { from: "Side rooftop", target: "flanking third team", timing: "Mid-contest — peel for teammate that engaged first." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard approach on Tower Top — most contests come from the same path each round.",
            "Save the off-angle Light SR-84 shot for after the first team pushes — third team always comes from a different direction.",
            "Trade-stack Tower Top with the Heavy — if the first contestant takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Goo + Pyro combo: Heavy goos the entry, Medium Pyros the goo for fire damage, Light cleans up survivors.",
            "Multi-floor hold: Heavy on Cashout, Medium one floor up with Jump Pad, Light on rooftop. Punish the standard ground push.",
            "Reset hold: pre-position for the inevitable wipe — Medium Defib ready, Heavy ready to re-engage. Force contest team to commit twice.",
          ],
        },
      },
    },
  },
  "kyoto": {
    "temple-vault": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Vault steal on Temple Vault: Heavy carries the vault on extract, Medium heals + Defibs on wipes, Light flanks contesting teams from Temple Center. Force a 3rd-team contest by holding the vault between two enemy spawn rotations. Garden approach is the off-angle — Light grapples to bridge for surprise.",
        callouts: ["Temple Center", "Vault", "Garden", "Bridge", "Streets", "Streets", "Temple"],
        utility: [
          "Heavy: Mesh Shield + Barricade for vault carry; RPG / C4 for cracking the contest",
          "Medium: Healing Beam + Defibrillator for sustain; APS Turret for projectile defense",
          "Light: Cloak + Grapple for flanking; Glitch Grenades to disable enemy Defibs",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Temple Vault steal route", from: "Temple Center", use: "Standard vault carry path — Heavy carries with Mesh Shield, team holds adjacent angles." },
            { spawn: "Temple Vault re-steal opportunity", from: "Adjacent rooftop", use: "When third team contests, re-steal the cashout while two teams fight each other." },
          ],
          spawnKillSpots: [
            { from: "Temple Center", target: "enemy Cashout team during contest", risk: "Medium — third team may engage during your push", reward: "Cashout steal + 3rd-place team eliminated" },
          ],
          advancedSetups: [
            "Third-party timing: wait for two teams to engage at Temple Vault, push the survivor + steal the cashout. Standard 3-team rotation read.",
            "Vault carry route: Heavy commits front with Mesh + Barricade, Medium runs heal beam behind, Light flanks for trade kill.",
            "Defib chain: Medium Defibs on wipe, team retraces to the same Temple Vault position. Force the contest team to commit twice.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Multi-floor hold on Temple Vault: Heavy on the Cashout floor, Medium one floor up with Jump Pad ready, Light on rooftop for vertical pickoffs. Punish the standard ground push. Bridge cross-fire from Garden gives the standard 2-angle hold.",
        callouts: ["Temple Center", "Vault", "Garden", "Bridge", "Streets", "Streets", "Temple"],
        utility: [
          "Heavy: Barricade + APS Turret + RPG for choke denial; Goo Gun for sealing entries",
          "Medium: Healing Beam + Defib + Smoke for sustained holds; Jump Pad for vertical reposition",
          "Light: SR-84 + Grappling Hook + Stun Gun for off-angle pickoffs",
        ],
        premiumTactics: {
          runouts: [
            { from: "Temple Center", target: "incoming team approach", timing: "15-second extract timer — pre-position before contest engages." },
            { from: "Side rooftop", target: "flanking third team", timing: "Mid-contest — peel for teammate that engaged first." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard approach on Temple Center — most contests come from the same path each round.",
            "Save the off-angle Light SR-84 shot for after the first team pushes — third team always comes from a different direction.",
            "Trade-stack Temple Center with the Heavy — if the first contestant takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Goo + Pyro combo: Heavy goos the entry, Medium Pyros the goo for fire damage, Light cleans up survivors.",
            "Multi-floor hold: Heavy on Cashout, Medium one floor up with Jump Pad, Light on rooftop. Punish the standard ground push.",
            "Reset hold: pre-position for the inevitable wipe — Medium Defib ready, Heavy ready to re-engage. Force contest team to commit twice.",
          ],
        },
      },
    },
    "plaza-cashout": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Off-angle hit on Plaza Cashout: Medium drops a Jump Pad behind the holders, Light flanks via grappling hook, Heavy commits front. Force a multi-angle contest before extract. Tunnels flank from underneath catches the standard hold off-angle.",
        callouts: ["Plaza", "Streets", "Rooftops", "Tunnels", "Garden", "Streets", "Temple"],
        utility: [
          "Heavy: Mesh Shield + Barricade for vault carry; RPG / C4 for cracking the contest",
          "Medium: Healing Beam + Defibrillator for sustain; APS Turret for projectile defense",
          "Light: Cloak + Grapple for flanking; Glitch Grenades to disable enemy Defibs",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Plaza Cashout steal route", from: "Plaza", use: "Standard vault carry path — Heavy carries with Mesh Shield, team holds adjacent angles." },
            { spawn: "Plaza Cashout re-steal opportunity", from: "Adjacent rooftop", use: "When third team contests, re-steal the cashout while two teams fight each other." },
          ],
          spawnKillSpots: [
            { from: "Plaza", target: "enemy Cashout team during contest", risk: "Medium — third team may engage during your push", reward: "Cashout steal + 3rd-place team eliminated" },
          ],
          advancedSetups: [
            "Third-party timing: wait for two teams to engage at Plaza Cashout, push the survivor + steal the cashout. Standard 3-team rotation read.",
            "Vault carry route: Heavy commits front with Mesh + Barricade, Medium runs heal beam behind, Light flanks for trade kill.",
            "Defib chain: Medium Defibs on wipe, team retraces to the same Plaza Cashout position. Force the contest team to commit twice.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Defend Plaza Cashout: Heavy sets Barricade + APS Turret on the choke, Medium runs heal beam, Light scouts approaches with grapple from Plaza. Force teams to push you in a 3rd-team-friendly setup. Rooftop snipe + Plaza ground anchor is the textbook hold.",
        callouts: ["Plaza", "Streets", "Rooftops", "Tunnels", "Garden", "Streets", "Temple"],
        utility: [
          "Heavy: Barricade + APS Turret + RPG for choke denial; Goo Gun for sealing entries",
          "Medium: Healing Beam + Defib + Smoke for sustained holds; Jump Pad for vertical reposition",
          "Light: SR-84 + Grappling Hook + Stun Gun for off-angle pickoffs",
        ],
        premiumTactics: {
          runouts: [
            { from: "Plaza", target: "incoming team approach", timing: "15-second extract timer — pre-position before contest engages." },
            { from: "Side rooftop", target: "flanking third team", timing: "Mid-contest — peel for teammate that engaged first." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard approach on Plaza — most contests come from the same path each round.",
            "Save the off-angle Light SR-84 shot for after the first team pushes — third team always comes from a different direction.",
            "Trade-stack Plaza with the Heavy — if the first contestant takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Goo + Pyro combo: Heavy goos the entry, Medium Pyros the goo for fire damage, Light cleans up survivors.",
            "Multi-floor hold: Heavy on Cashout, Medium one floor up with Jump Pad, Light on rooftop. Punish the standard ground push.",
            "Reset hold: pre-position for the inevitable wipe — Medium Defib ready, Heavy ready to re-engage. Force contest team to commit twice.",
          ],
        },
      },
    },
    "rooftop-cashout": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Cashout contest on Rooftop Cashout: Light enters first to scout, Heavy charges in with Mesh Shield, Medium Defibs on wipe. Goal is killing all 3 of the holding team before the extraction completes. Bridge dive from adjacent rooftops splits the hold.",
        callouts: ["Rooftops", "Streets", "Plaza", "Temple", "Bridge", "Streets", "Temple"],
        utility: [
          "Heavy: Mesh Shield + Barricade for vault carry; RPG / C4 for cracking the contest",
          "Medium: Healing Beam + Defibrillator for sustain; APS Turret for projectile defense",
          "Light: Cloak + Grapple for flanking; Glitch Grenades to disable enemy Defibs",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Rooftop Cashout steal route", from: "Rooftops", use: "Standard vault carry path — Heavy carries with Mesh Shield, team holds adjacent angles." },
            { spawn: "Rooftop Cashout re-steal opportunity", from: "Adjacent rooftop", use: "When third team contests, re-steal the cashout while two teams fight each other." },
          ],
          spawnKillSpots: [
            { from: "Rooftops", target: "enemy Cashout team during contest", risk: "Medium — third team may engage during your push", reward: "Cashout steal + 3rd-place team eliminated" },
          ],
          advancedSetups: [
            "Third-party timing: wait for two teams to engage at Rooftop Cashout, push the survivor + steal the cashout. Standard 3-team rotation read.",
            "Vault carry route: Heavy commits front with Mesh + Barricade, Medium runs heal beam behind, Light flanks for trade kill.",
            "Defib chain: Medium Defibs on wipe, team retraces to the same Rooftop Cashout position. Force the contest team to commit twice.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Reset / re-steal hold on Rooftop Cashout: hold the Cashout but pre-position for the inevitable wipe. Medium has Defib ready, Heavy ready to re-steal post-wipe, Light flanks the contest team for the third-party trade. Cross-fire from Temple + Plaza wins the rooftop contest.",
        callouts: ["Rooftops", "Streets", "Plaza", "Temple", "Bridge", "Streets", "Temple"],
        utility: [
          "Heavy: Barricade + APS Turret + RPG for choke denial; Goo Gun for sealing entries",
          "Medium: Healing Beam + Defib + Smoke for sustained holds; Jump Pad for vertical reposition",
          "Light: SR-84 + Grappling Hook + Stun Gun for off-angle pickoffs",
        ],
        premiumTactics: {
          runouts: [
            { from: "Rooftops", target: "incoming team approach", timing: "15-second extract timer — pre-position before contest engages." },
            { from: "Side rooftop", target: "flanking third team", timing: "Mid-contest — peel for teammate that engaged first." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard approach on Rooftops — most contests come from the same path each round.",
            "Save the off-angle Light SR-84 shot for after the first team pushes — third team always comes from a different direction.",
            "Trade-stack Rooftops with the Heavy — if the first contestant takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Goo + Pyro combo: Heavy goos the entry, Medium Pyros the goo for fire damage, Light cleans up survivors.",
            "Multi-floor hold: Heavy on Cashout, Medium one floor up with Jump Pad, Light on rooftop. Punish the standard ground push.",
            "Reset hold: pre-position for the inevitable wipe — Medium Defib ready, Heavy ready to re-engage. Force contest team to commit twice.",
          ],
        },
      },
    },
  },
  "sys-horizon": {
    "grid-vault": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Stealth steal on Grid Vault: Light cloaks to scout the contest, Medium positions Defib + heal beam, Heavy waits for the engage call. Strike when the enemy team commits to a fight with a third party. Tower vertical pressure denies the standard Grid hold.",
        callouts: ["Grid Center", "Vault", "Tower", "Bridge", "Plaza", "Grid", "Tower"],
        utility: [
          "Heavy: Mesh Shield + Barricade for vault carry; RPG / C4 for cracking the contest",
          "Medium: Healing Beam + Defibrillator for sustain; APS Turret for projectile defense",
          "Light: Cloak + Grapple for flanking; Glitch Grenades to disable enemy Defibs",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Grid Vault steal route", from: "Grid Center", use: "Standard vault carry path — Heavy carries with Mesh Shield, team holds adjacent angles." },
            { spawn: "Grid Vault re-steal opportunity", from: "Adjacent rooftop", use: "When third team contests, re-steal the cashout while two teams fight each other." },
          ],
          spawnKillSpots: [
            { from: "Grid Center", target: "enemy Cashout team during contest", risk: "Medium — third team may engage during your push", reward: "Cashout steal + 3rd-place team eliminated" },
          ],
          advancedSetups: [
            "Third-party timing: wait for two teams to engage at Grid Vault, push the survivor + steal the cashout. Standard 3-team rotation read.",
            "Vault carry route: Heavy commits front with Mesh + Barricade, Medium runs heal beam behind, Light flanks for trade kill.",
            "Defib chain: Medium Defibs on wipe, team retraces to the same Grid Vault position. Force the contest team to commit twice.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Stack Grid Vault: 3-on-objective. Heavy on the Cashout body-blocking, Medium with Defib ready, Light watches the timer + rotation pings. Save utility for the second team push — first contest always brings a third. Bridge cross-fire from Grid + Tower wins the standard contest.",
        callouts: ["Grid Center", "Vault", "Tower", "Bridge", "Plaza", "Grid", "Tower"],
        utility: [
          "Heavy: Barricade + APS Turret + RPG for choke denial; Goo Gun for sealing entries",
          "Medium: Healing Beam + Defib + Smoke for sustained holds; Jump Pad for vertical reposition",
          "Light: SR-84 + Grappling Hook + Stun Gun for off-angle pickoffs",
        ],
        premiumTactics: {
          runouts: [
            { from: "Grid Center", target: "incoming team approach", timing: "15-second extract timer — pre-position before contest engages." },
            { from: "Side rooftop", target: "flanking third team", timing: "Mid-contest — peel for teammate that engaged first." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard approach on Grid Center — most contests come from the same path each round.",
            "Save the off-angle Light SR-84 shot for after the first team pushes — third team always comes from a different direction.",
            "Trade-stack Grid Center with the Heavy — if the first contestant takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Goo + Pyro combo: Heavy goos the entry, Medium Pyros the goo for fire damage, Light cleans up survivors.",
            "Multi-floor hold: Heavy on Cashout, Medium one floor up with Jump Pad, Light on rooftop. Punish the standard ground push.",
            "Reset hold: pre-position for the inevitable wipe — Medium Defib ready, Heavy ready to re-engage. Force contest team to commit twice.",
          ],
        },
      },
    },
    "tower-cashout": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Cashout snipe + push on Tower Cashout: Light snipes with SR-84 from Tower Top, Heavy + Medium push on the trade. Defib chain through the contest. Heavy carries the new Cashout to the next extract. Rooftop dive from adjacent towers splits the hold.",
        callouts: ["Tower Top", "Rooftops", "Bridge", "Plaza", "Grid", "Grid", "Tower"],
        utility: [
          "Heavy: Mesh Shield + Barricade for vault carry; RPG / C4 for cracking the contest",
          "Medium: Healing Beam + Defibrillator for sustain; APS Turret for projectile defense",
          "Light: Cloak + Grapple for flanking; Glitch Grenades to disable enemy Defibs",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Tower Cashout steal route", from: "Tower Top", use: "Standard vault carry path — Heavy carries with Mesh Shield, team holds adjacent angles." },
            { spawn: "Tower Cashout re-steal opportunity", from: "Adjacent rooftop", use: "When third team contests, re-steal the cashout while two teams fight each other." },
          ],
          spawnKillSpots: [
            { from: "Tower Top", target: "enemy Cashout team during contest", risk: "Medium — third team may engage during your push", reward: "Cashout steal + 3rd-place team eliminated" },
          ],
          advancedSetups: [
            "Third-party timing: wait for two teams to engage at Tower Cashout, push the survivor + steal the cashout. Standard 3-team rotation read.",
            "Vault carry route: Heavy commits front with Mesh + Barricade, Medium runs heal beam behind, Light flanks for trade kill.",
            "Defib chain: Medium Defibs on wipe, team retraces to the same Tower Cashout position. Force the contest team to commit twice.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Gas + Goo hold on Tower Cashout: Heavy goos the choke entries, Medium drops Smoke + heal, Light flanks for the trade kill. Force pushers to break utility before contesting. Tower cross-fire from Bridge + Grid is the textbook hold.",
        callouts: ["Tower Top", "Rooftops", "Bridge", "Plaza", "Grid", "Grid", "Tower"],
        utility: [
          "Heavy: Barricade + APS Turret + RPG for choke denial; Goo Gun for sealing entries",
          "Medium: Healing Beam + Defib + Smoke for sustained holds; Jump Pad for vertical reposition",
          "Light: SR-84 + Grappling Hook + Stun Gun for off-angle pickoffs",
        ],
        premiumTactics: {
          runouts: [
            { from: "Tower Top", target: "incoming team approach", timing: "15-second extract timer — pre-position before contest engages." },
            { from: "Side rooftop", target: "flanking third team", timing: "Mid-contest — peel for teammate that engaged first." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard approach on Tower Top — most contests come from the same path each round.",
            "Save the off-angle Light SR-84 shot for after the first team pushes — third team always comes from a different direction.",
            "Trade-stack Tower Top with the Heavy — if the first contestant takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Goo + Pyro combo: Heavy goos the entry, Medium Pyros the goo for fire damage, Light cleans up survivors.",
            "Multi-floor hold: Heavy on Cashout, Medium one floor up with Jump Pad, Light on rooftop. Punish the standard ground push.",
            "Reset hold: pre-position for the inevitable wipe — Medium Defib ready, Heavy ready to re-engage. Force contest team to commit twice.",
          ],
        },
      },
    },
    "rooftop-cashout": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Vault steal on Rooftop Cashout: Heavy carries the vault on extract, Medium heals + Defibs on wipes, Light flanks contesting teams from Rooftops. Force a 3rd-team contest by holding the vault between two enemy spawn rotations. Bridge approach from adjacent towers catches the standard hold.",
        callouts: ["Rooftops", "Tower", "Bridge", "Grid", "Plaza", "Grid", "Tower"],
        utility: [
          "Heavy: Mesh Shield + Barricade for vault carry; RPG / C4 for cracking the contest",
          "Medium: Healing Beam + Defibrillator for sustain; APS Turret for projectile defense",
          "Light: Cloak + Grapple for flanking; Glitch Grenades to disable enemy Defibs",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Rooftop Cashout steal route", from: "Rooftops", use: "Standard vault carry path — Heavy carries with Mesh Shield, team holds adjacent angles." },
            { spawn: "Rooftop Cashout re-steal opportunity", from: "Adjacent rooftop", use: "When third team contests, re-steal the cashout while two teams fight each other." },
          ],
          spawnKillSpots: [
            { from: "Rooftops", target: "enemy Cashout team during contest", risk: "Medium — third team may engage during your push", reward: "Cashout steal + 3rd-place team eliminated" },
          ],
          advancedSetups: [
            "Third-party timing: wait for two teams to engage at Rooftop Cashout, push the survivor + steal the cashout. Standard 3-team rotation read.",
            "Vault carry route: Heavy commits front with Mesh + Barricade, Medium runs heal beam behind, Light flanks for trade kill.",
            "Defib chain: Medium Defibs on wipe, team retraces to the same Rooftop Cashout position. Force the contest team to commit twice.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Multi-floor hold on Rooftop Cashout: Heavy on the Cashout floor, Medium one floor up with Jump Pad ready, Light on rooftop for vertical pickoffs. Punish the standard ground push. Tower cross-fire from Grid wins the rooftop contest.",
        callouts: ["Rooftops", "Tower", "Bridge", "Grid", "Plaza", "Grid", "Tower"],
        utility: [
          "Heavy: Barricade + APS Turret + RPG for choke denial; Goo Gun for sealing entries",
          "Medium: Healing Beam + Defib + Smoke for sustained holds; Jump Pad for vertical reposition",
          "Light: SR-84 + Grappling Hook + Stun Gun for off-angle pickoffs",
        ],
        premiumTactics: {
          runouts: [
            { from: "Rooftops", target: "incoming team approach", timing: "15-second extract timer — pre-position before contest engages." },
            { from: "Side rooftop", target: "flanking third team", timing: "Mid-contest — peel for teammate that engaged first." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard approach on Rooftops — most contests come from the same path each round.",
            "Save the off-angle Light SR-84 shot for after the first team pushes — third team always comes from a different direction.",
            "Trade-stack Rooftops with the Heavy — if the first contestant takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Goo + Pyro combo: Heavy goos the entry, Medium Pyros the goo for fire damage, Light cleans up survivors.",
            "Multi-floor hold: Heavy on Cashout, Medium one floor up with Jump Pad, Light on rooftop. Punish the standard ground push.",
            "Reset hold: pre-position for the inevitable wipe — Medium Defib ready, Heavy ready to re-engage. Force contest team to commit twice.",
          ],
        },
      },
    },
  },
  "bernal": {
    "mining-vault": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Cashout contest on Mining Vault: Light enters first to scout, Heavy charges in with Mesh Shield, Medium Defibs on wipe. Goal is killing all 3 of the holding team before the extraction completes. Tunnel flank from underneath catches the standard mining hold.",
        callouts: ["Mining Center", "Vault", "Tunnel", "Bridge", "Plaza", "Streets", "Plaza"],
        utility: [
          "Heavy: Mesh Shield + Barricade for vault carry; RPG / C4 for cracking the contest",
          "Medium: Healing Beam + Defibrillator for sustain; APS Turret for projectile defense",
          "Light: Cloak + Grapple for flanking; Glitch Grenades to disable enemy Defibs",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Mining Vault steal route", from: "Mining Center", use: "Standard vault carry path — Heavy carries with Mesh Shield, team holds adjacent angles." },
            { spawn: "Mining Vault re-steal opportunity", from: "Adjacent rooftop", use: "When third team contests, re-steal the cashout while two teams fight each other." },
          ],
          spawnKillSpots: [
            { from: "Mining Center", target: "enemy Cashout team during contest", risk: "Medium — third team may engage during your push", reward: "Cashout steal + 3rd-place team eliminated" },
          ],
          advancedSetups: [
            "Third-party timing: wait for two teams to engage at Mining Vault, push the survivor + steal the cashout. Standard 3-team rotation read.",
            "Vault carry route: Heavy commits front with Mesh + Barricade, Medium runs heal beam behind, Light flanks for trade kill.",
            "Defib chain: Medium Defibs on wipe, team retraces to the same Mining Vault position. Force the contest team to commit twice.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Reset / re-steal hold on Mining Vault: hold the Cashout but pre-position for the inevitable wipe. Medium has Defib ready, Heavy ready to re-steal post-wipe, Light flanks the contest team for the third-party trade. Bridge cross-fire from Plaza + Tunnels denies the standard push.",
        callouts: ["Mining Center", "Vault", "Tunnel", "Bridge", "Plaza", "Streets", "Plaza"],
        utility: [
          "Heavy: Barricade + APS Turret + RPG for choke denial; Goo Gun for sealing entries",
          "Medium: Healing Beam + Defib + Smoke for sustained holds; Jump Pad for vertical reposition",
          "Light: SR-84 + Grappling Hook + Stun Gun for off-angle pickoffs",
        ],
        premiumTactics: {
          runouts: [
            { from: "Mining Center", target: "incoming team approach", timing: "15-second extract timer — pre-position before contest engages." },
            { from: "Side rooftop", target: "flanking third team", timing: "Mid-contest — peel for teammate that engaged first." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard approach on Mining Center — most contests come from the same path each round.",
            "Save the off-angle Light SR-84 shot for after the first team pushes — third team always comes from a different direction.",
            "Trade-stack Mining Center with the Heavy — if the first contestant takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Goo + Pyro combo: Heavy goos the entry, Medium Pyros the goo for fire damage, Light cleans up survivors.",
            "Multi-floor hold: Heavy on Cashout, Medium one floor up with Jump Pad, Light on rooftop. Punish the standard ground push.",
            "Reset hold: pre-position for the inevitable wipe — Medium Defib ready, Heavy ready to re-engage. Force contest team to commit twice.",
          ],
        },
      },
    },
    "plaza-cashout": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Stealth steal on Plaza Cashout: Light cloaks to scout the contest, Medium positions Defib + heal beam, Heavy waits for the engage call. Strike when the enemy team commits to a fight with a third party. Rooftop dive splits the hold; Tunnels flank for the trade.",
        callouts: ["Plaza", "Streets", "Rooftops", "Mining", "Tunnels", "Streets", "Plaza"],
        utility: [
          "Heavy: Mesh Shield + Barricade for vault carry; RPG / C4 for cracking the contest",
          "Medium: Healing Beam + Defibrillator for sustain; APS Turret for projectile defense",
          "Light: Cloak + Grapple for flanking; Glitch Grenades to disable enemy Defibs",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Plaza Cashout steal route", from: "Plaza", use: "Standard vault carry path — Heavy carries with Mesh Shield, team holds adjacent angles." },
            { spawn: "Plaza Cashout re-steal opportunity", from: "Adjacent rooftop", use: "When third team contests, re-steal the cashout while two teams fight each other." },
          ],
          spawnKillSpots: [
            { from: "Plaza", target: "enemy Cashout team during contest", risk: "Medium — third team may engage during your push", reward: "Cashout steal + 3rd-place team eliminated" },
          ],
          advancedSetups: [
            "Third-party timing: wait for two teams to engage at Plaza Cashout, push the survivor + steal the cashout. Standard 3-team rotation read.",
            "Vault carry route: Heavy commits front with Mesh + Barricade, Medium runs heal beam behind, Light flanks for trade kill.",
            "Defib chain: Medium Defibs on wipe, team retraces to the same Plaza Cashout position. Force the contest team to commit twice.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Stack Plaza Cashout: 3-on-objective. Heavy on the Cashout body-blocking, Medium with Defib ready, Light watches the timer + rotation pings. Save utility for the second team push — first contest always brings a third. Rooftop snipe + Plaza ground anchor is the textbook hold.",
        callouts: ["Plaza", "Streets", "Rooftops", "Mining", "Tunnels", "Streets", "Plaza"],
        utility: [
          "Heavy: Barricade + APS Turret + RPG for choke denial; Goo Gun for sealing entries",
          "Medium: Healing Beam + Defib + Smoke for sustained holds; Jump Pad for vertical reposition",
          "Light: SR-84 + Grappling Hook + Stun Gun for off-angle pickoffs",
        ],
        premiumTactics: {
          runouts: [
            { from: "Plaza", target: "incoming team approach", timing: "15-second extract timer — pre-position before contest engages." },
            { from: "Side rooftop", target: "flanking third team", timing: "Mid-contest — peel for teammate that engaged first." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard approach on Plaza — most contests come from the same path each round.",
            "Save the off-angle Light SR-84 shot for after the first team pushes — third team always comes from a different direction.",
            "Trade-stack Plaza with the Heavy — if the first contestant takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Goo + Pyro combo: Heavy goos the entry, Medium Pyros the goo for fire damage, Light cleans up survivors.",
            "Multi-floor hold: Heavy on Cashout, Medium one floor up with Jump Pad, Light on rooftop. Punish the standard ground push.",
            "Reset hold: pre-position for the inevitable wipe — Medium Defib ready, Heavy ready to re-engage. Force contest team to commit twice.",
          ],
        },
      },
    },
    "rooftop-cashout": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Cashout snipe + push on Rooftop Cashout: Light snipes with SR-84 from Rooftops, Heavy + Medium push on the trade. Defib chain through the contest. Heavy carries the new Cashout to the next extract. Bridge dive from adjacent rooftops splits the hold.",
        callouts: ["Rooftops", "Plaza", "Bridge", "Streets", "Mining", "Streets", "Plaza"],
        utility: [
          "Heavy: Mesh Shield + Barricade for vault carry; RPG / C4 for cracking the contest",
          "Medium: Healing Beam + Defibrillator for sustain; APS Turret for projectile defense",
          "Light: Cloak + Grapple for flanking; Glitch Grenades to disable enemy Defibs",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Rooftop Cashout steal route", from: "Rooftops", use: "Standard vault carry path — Heavy carries with Mesh Shield, team holds adjacent angles." },
            { spawn: "Rooftop Cashout re-steal opportunity", from: "Adjacent rooftop", use: "When third team contests, re-steal the cashout while two teams fight each other." },
          ],
          spawnKillSpots: [
            { from: "Rooftops", target: "enemy Cashout team during contest", risk: "Medium — third team may engage during your push", reward: "Cashout steal + 3rd-place team eliminated" },
          ],
          advancedSetups: [
            "Third-party timing: wait for two teams to engage at Rooftop Cashout, push the survivor + steal the cashout. Standard 3-team rotation read.",
            "Vault carry route: Heavy commits front with Mesh + Barricade, Medium runs heal beam behind, Light flanks for trade kill.",
            "Defib chain: Medium Defibs on wipe, team retraces to the same Rooftop Cashout position. Force the contest team to commit twice.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Gas + Goo hold on Rooftop Cashout: Heavy goos the choke entries, Medium drops Smoke + heal, Light flanks for the trade kill. Force pushers to break utility before contesting. Cross-fire from Plaza + Mining wins the rooftop contest.",
        callouts: ["Rooftops", "Plaza", "Bridge", "Streets", "Mining", "Streets", "Plaza"],
        utility: [
          "Heavy: Barricade + APS Turret + RPG for choke denial; Goo Gun for sealing entries",
          "Medium: Healing Beam + Defib + Smoke for sustained holds; Jump Pad for vertical reposition",
          "Light: SR-84 + Grappling Hook + Stun Gun for off-angle pickoffs",
        ],
        premiumTactics: {
          runouts: [
            { from: "Rooftops", target: "incoming team approach", timing: "15-second extract timer — pre-position before contest engages." },
            { from: "Side rooftop", target: "flanking third team", timing: "Mid-contest — peel for teammate that engaged first." },
          ],
          antiSpawnPeek: [
            "Pre-aim the standard approach on Rooftops — most contests come from the same path each round.",
            "Save the off-angle Light SR-84 shot for after the first team pushes — third team always comes from a different direction.",
            "Trade-stack Rooftops with the Heavy — if the first contestant takes a duel, the trade kill is on a fixed crosshair placement.",
          ],
          advancedSetups: [
            "Goo + Pyro combo: Heavy goos the entry, Medium Pyros the goo for fire damage, Light cleans up survivors.",
            "Multi-floor hold: Heavy on Cashout, Medium one floor up with Jump Pad, Light on rooftop. Punish the standard ground push.",
            "Reset hold: pre-position for the inevitable wipe — Medium Defib ready, Heavy ready to re-engage. Force contest team to commit twice.",
          ],
        },
      },
    },
  },
  "skyway-stadium": {
    "stadium": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Skyway Stadium center is the open arena floor with stadium seating cover. Heavy mesh-shields onto the cashout, Medium runs Heal Beam behind, Light grapples to the catwalks for vertical picks. Stadium destruction opens new angles each round — adapt the carry route.",
        callouts: ["Center Field", "Stadium Seats", "Catwalks", "Concourse", "Rooftop", "Tunnels", "VIP Box"],
        utility: [
          "Heavy: Mesh Shield + RPG; Goo Gun for sealing entries",
          "Medium: Healing Beam + Defib; APS Turret for projectile defense",
          "Light: SR-84 + Grapple + Glitch Grenades for support disable",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Stadium center steal", from: "Center Field", use: "Heavy mesh-carries through center, Medium follows with heal beam, Light flanks Catwalks." },
            { spawn: "Catwalk vertical commit", from: "Light Grapple", use: "Light grapples Catwalks for top-down picks during contest." },
          ],
          spawnKillSpots: [
            { from: "VIP Box", target: "enemy Cashout team", risk: "Medium — third team may engage", reward: "Cashout steal + 3rd-place team eliminated" },
          ],
          advancedSetups: [
            "Stadium destruction read: blown-out seats create new sightlines — Light SR-84 picks from new angle.",
            "Third-party timing: wait for two teams to engage Stadium, push the survivor + steal cashout.",
            "Goo + Pyro combo: Heavy goos contest entry, Medium Pyros the goo, Light cleans up.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Stadium center: multi-floor hold with Heavy on cashout, Medium with Jump Pad for vertical reposition, Light on Catwalks for off-angle pickoffs. Use destructible walls to wall off the contest team mid-fight.",
        callouts: ["Center Field", "Stadium Seats", "Catwalks", "Concourse", "Rooftop", "Tunnels", "VIP Box"],
        utility: [
          "Heavy: Barricade + APS Turret + RPG; Goo Gun on entries",
          "Medium: Healing Beam + Defib + Jump Pad for vertical reposition",
          "Light: SR-84 + Grapple + Stun Gun for back-line pickoffs",
        ],
        premiumTactics: {
          runouts: [
            { from: "Catwalks", target: "incoming team approach", timing: "15s extract timer — pre-position before contest" },
            { from: "VIP Box", target: "flanking third team", timing: "Mid-contest — peel for teammate" },
          ],
          antiSpawnPeek: [
            "Pre-aim Center Field — most contests come from the open arena.",
            "Save the Light SR-84 for after the first team commits — third team always comes from another direction.",
            "Trade-stack Cashout with Heavy — if contestant takes a duel, trade kill is on a fixed crosshair.",
          ],
          advancedSetups: [
            "Multi-floor hold: Heavy on Cashout, Medium one floor up with Jump Pad, Light on Catwalks.",
            "Destructible wall denial: Heavy RPGs Stadium walls to open new defensive angles.",
            "Reset hold: Medium Defib ready, Heavy re-engages — force contest team to commit twice.",
          ],
        },
      },
    },
    "skybridges": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Skybridges is the vertical connection between buildings — Light grapples win the flanks. Heavy mesh-carries on the bridge, Medium covers with Heal Beam, Light grapples between buildings for vertical picks.",
        callouts: ["Skybridge", "Building A", "Building B", "Bridge Top", "Bridge Bottom", "Side Doors", "Rooftops"],
        utility: [
          "Heavy: Mesh Shield + Barricade + RPG",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: Cloak + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Bridge steal", from: "Building A", use: "Heavy mesh-carries through Bridge, Light grapples roof for top-down pick." },
            { spawn: "Vertical flank", from: "Building B Rooftop", use: "Light grapples between buildings — surprise the standard ground push." },
          ],
          spawnKillSpots: [
            { from: "Bridge Top", target: "enemy Cashout team", risk: "Medium — exposed vertical", reward: "Cashout steal + height advantage" },
          ],
          advancedSetups: [
            "Vertical chain: Heavy bridge commit, Medium heal beam behind, Light grapples for top-down trade.",
            "Glitch Grenade combo: Light Glitches Defib mid-fight — denies the reset.",
            "Bridge destruction: Heavy RPGs Bridge structure to deny enemy commit.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Skybridges: Heavy anchors with Barricade, Medium runs Heal Beam, Light covers vertical with Grapple + SR-84. Bridge destruction is a defensive option — RPG the Bridge to deny the steal.",
        callouts: ["Skybridge", "Building A", "Building B", "Bridge Top", "Bridge Bottom", "Side Doors", "Rooftops"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun on entries",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Rooftops", target: "enemy vertical commit", timing: "15s extract timer pre-position" },
            { from: "Side Doors", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Bridge ground approach — most pushes commit from below.",
            "Light SR-84 from Rooftops covers all vertical pushes.",
          ],
          advancedSetups: [
            "Bridge destruction denial: Heavy RPGs Bridge structure to prevent the steal route.",
            "Multi-floor: Heavy on Cashout, Medium Jump Pad rooftop, Light grapples between buildings.",
            "Reset hold: Medium Defib ready for the inevitable wipe.",
          ],
        },
      },
    },
    "plaza": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Skyway Plaza is the open courtyard outside the stadium. Heavy mesh-carries through the open, Medium covers heal beam, Light flanks via the side garage. Plaza is exposed — push only on third-party timing.",
        callouts: ["Plaza Center", "Garage", "Side Cafe", "Fountain", "Rooftop", "Ramps", "Concourse"],
        utility: [
          "Heavy: Mesh Shield + RPG; Goo Gun for sealing",
          "Medium: Healing Beam + Defib; APS Turret",
          "Light: SR-84 + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Plaza commit", from: "Garage", use: "Heavy mesh-carries through Garage entry, full team covers with heal beam." },
            { spawn: "Side Cafe flank", from: "Side Doors", use: "Light grapples Cafe rooftop for off-angle picks during contest." },
          ],
          spawnKillSpots: [
            { from: "Rooftop", target: "enemy Cashout team", risk: "Medium — exposed third-party angle", reward: "Cashout steal + height advantage" },
          ],
          advancedSetups: [
            "Third-party timing: Plaza is the contested zone — wait for two teams to engage.",
            "Fountain cover route: Heavy uses Fountain as carry cover.",
            "Goo + Pyro combo: Heavy goos Plaza entry, Medium Pyros, Light cleans up.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Plaza: Heavy anchors Cashout behind Fountain cover, Medium runs Heal Beam, Light covers Garage + Cafe flanks with SR-84.",
        callouts: ["Plaza Center", "Garage", "Side Cafe", "Fountain", "Rooftop", "Ramps", "Concourse"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Rooftop", target: "incoming team approach", timing: "15s extract pre-position" },
            { from: "Garage", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Garage entry — most contests come from main approach.",
            "Light SR-84 from Rooftop covers all incoming.",
          ],
          advancedSetups: [
            "Multi-floor: Heavy Plaza, Medium Rooftop Jump Pad, Light Cafe roof.",
            "Fountain cover: pre-position behind Fountain for trade angle.",
            "Reset hold: Medium Defib for the inevitable wipe.",
          ],
        },
      },
    },
    "pavilion": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Pavilion is the covered outdoor area with destructible columns. Heavy mesh-carries through columns, Medium follows with heal beam, Light grapples to roof for vertical picks. Column destruction opens new sightlines.",
        callouts: ["Pavilion Center", "Columns", "Side Tables", "Rooftop", "Bar", "Loading Dock", "Concourse"],
        utility: [
          "Heavy: Mesh Shield + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: SR-84 + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Pavilion commit", from: "Loading Dock", use: "Heavy mesh-carries through Columns, Medium covers heal beam." },
            { spawn: "Rooftop vertical", from: "Light Grapple", use: "Light grapples Pavilion roof for top-down picks." },
          ],
          spawnKillSpots: [
            { from: "Rooftop", target: "enemy Cashout team", risk: "Medium — third-party angle", reward: "Cashout steal + height advantage" },
          ],
          advancedSetups: [
            "Column destruction: Heavy RPGs columns mid-fight to open new sightlines.",
            "Bar flank: Light grapples Bar for off-angle SR-84.",
            "Reset hold: Medium Defib for the inevitable wipe.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Pavilion: Heavy anchors Cashout behind Columns, Medium runs Heal Beam, Light covers Loading Dock with SR-84.",
        callouts: ["Pavilion Center", "Columns", "Side Tables", "Rooftop", "Bar", "Loading Dock", "Concourse"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Rooftop", target: "incoming team approach", timing: "15s extract pre-position" },
            { from: "Bar", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Loading Dock — most contests come from there.",
            "Light SR-84 from Rooftop covers all vertical approaches.",
          ],
          advancedSetups: [
            "Column cover: pre-position behind Columns for trade angle.",
            "Multi-floor: Heavy Pavilion, Medium Rooftop, Light Bar roof.",
            "Reset hold: Medium Defib for inevitable wipe.",
          ],
        },
      },
    },
  },
  "fortune-stadium": {
    "stadium": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Fortune Stadium center is the open field with high stadium walls. Heavy mesh-carries through center, Medium heal-beams behind, Light grapples to seats for vertical picks. Stadium walls are destructible — new sightlines each round.",
        callouts: ["Center Field", "Stadium Seats", "Catwalks", "Concourse", "Rooftop", "Tunnels", "Press Box"],
        utility: [
          "Heavy: Mesh Shield + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: SR-84 + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Field commit", from: "Tunnels", use: "Heavy mesh-carries through Tunnels, full team covers with heal beam." },
            { spawn: "Press Box vertical", from: "Light Grapple", use: "Light grapples Press Box for top-down picks." },
          ],
          spawnKillSpots: [
            { from: "Press Box", target: "enemy Cashout team", risk: "Medium — exposed vertical", reward: "Cashout steal + height advantage" },
          ],
          advancedSetups: [
            "Stadium wall destruction: Heavy RPGs walls for new angles.",
            "Third-party timing: wait for two teams to engage.",
            "Goo + Pyro combo: Heavy goos contest, Medium Pyros, Light cleans up.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Fortune Stadium: Heavy anchors Cashout, Medium heal beam + Jump Pad vertical, Light on Catwalks for SR-84 picks.",
        callouts: ["Center Field", "Stadium Seats", "Catwalks", "Concourse", "Rooftop", "Tunnels", "Press Box"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Catwalks", target: "incoming team", timing: "15s extract pre-position" },
            { from: "Press Box", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Tunnels entry.",
            "Light SR-84 from Press Box covers all incoming.",
          ],
          advancedSetups: [
            "Multi-floor: Heavy Field, Medium Catwalks, Light Press Box.",
            "Stadium destruction: Heavy RPGs walls for defensive angles.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
    },
    "concourse": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Fortune Concourse is the wrap-around corridor — tight chokepoints with side rooms. Heavy mesh-carries through main, Medium covers heal beam, Light flanks via side rooms.",
        callouts: ["Concourse Main", "Side Rooms", "Stairwells", "Bathroom", "Bar", "Stadium Entry", "Loading Dock"],
        utility: [
          "Heavy: Mesh Shield + Barricade + RPG",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: Cloak + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Main commit", from: "Stadium Entry", use: "Heavy mesh-carries through Main, Medium covers heal beam." },
            { spawn: "Side Room flank", from: "Loading Dock", use: "Light cloak through Side Rooms for back-line trade." },
          ],
          spawnKillSpots: [
            { from: "Bar", target: "enemy Cashout team", risk: "Medium — exposed flank", reward: "Cashout steal + back-line trade" },
          ],
          advancedSetups: [
            "Side Room flank: Light cloaks for surprise back-line.",
            "Goo + Pyro combo: Heavy goos Main, Medium Pyros, Light cleans up.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Fortune Concourse: Heavy anchors Cashout, Medium runs Heal Beam, Light covers Side Rooms with SR-84.",
        callouts: ["Concourse Main", "Side Rooms", "Stairwells", "Bathroom", "Bar", "Stadium Entry", "Loading Dock"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Side Rooms", target: "incoming team", timing: "15s extract pre-position" },
            { from: "Bar", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Stadium Entry.",
            "Light SR-84 from Bar covers all incoming.",
          ],
          advancedSetups: [
            "Side Room denial: Heavy goos Side Rooms.",
            "Multi-floor: Heavy Concourse, Medium Stairwells, Light Side Rooms.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
    },
    "plaza": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Fortune Plaza is the outdoor pre-stadium area. Heavy mesh-carries through Main entry, Medium covers heal beam, Light flanks Side Cafe.",
        callouts: ["Plaza Center", "Main Entry", "Side Cafe", "Fountain", "Rooftop", "Tickets", "Parking Edge"],
        utility: [
          "Heavy: Mesh Shield + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: SR-84 + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Plaza commit", from: "Main Entry", use: "Heavy mesh-carries through Main, full team covers." },
            { spawn: "Cafe flank", from: "Side Cafe", use: "Light grapples Cafe roof for off-angle." },
          ],
          spawnKillSpots: [
            { from: "Rooftop", target: "enemy Cashout team", risk: "Medium — exposed third-party", reward: "Cashout steal + height advantage" },
          ],
          advancedSetups: [
            "Third-party timing: wait for two teams to engage.",
            "Fountain cover route for Heavy carry.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Fortune Plaza: Heavy anchors Fountain Cashout, Medium heal beam, Light Cafe roof SR-84.",
        callouts: ["Plaza Center", "Main Entry", "Side Cafe", "Fountain", "Rooftop", "Tickets", "Parking Edge"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Rooftop", target: "incoming team", timing: "15s extract pre-position" },
            { from: "Side Cafe", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Main Entry.",
            "Light SR-84 from Rooftop.",
          ],
          advancedSetups: [
            "Fountain cover trade angle.",
            "Multi-floor: Heavy Plaza, Medium Rooftop, Light Cafe.",
            "Reset hold: Medium Defib.",
          ],
        },
      },
    },
    "parking": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Fortune Parking is the multi-level garage with car cover. Heavy mesh-carries between cars, Medium heal-beams behind, Light grapples to upper deck for vertical picks. Cars are destructible — RPG to open new sightlines.",
        callouts: ["Garage Level 1", "Level 2", "Level 3", "Ramps", "Side Doors", "Loading Dock", "Open Floor"],
        utility: [
          "Heavy: Mesh Shield + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: SR-84 + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Level 1 commit", from: "Ramps", use: "Heavy mesh-carries up Ramps, Medium covers heal beam." },
            { spawn: "Level 3 vertical", from: "Light Grapple", use: "Light grapples Level 3 for top-down picks." },
          ],
          spawnKillSpots: [
            { from: "Level 3", target: "enemy Cashout team", risk: "Medium — exposed vertical", reward: "Cashout steal + height advantage" },
          ],
          advancedSetups: [
            "Car destruction: Heavy RPGs cars to open new sightlines.",
            "Multi-level commit: Level 1 Heavy + Level 3 Light split.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Fortune Parking: Heavy anchors Cashout behind cars, Medium heal beam, Light Level 3 SR-84.",
        callouts: ["Garage Level 1", "Level 2", "Level 3", "Ramps", "Side Doors", "Loading Dock", "Open Floor"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Level 3", target: "incoming team", timing: "15s extract pre-position" },
            { from: "Loading Dock", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Ramps.",
            "Light SR-84 from Level 3.",
          ],
          advancedSetups: [
            "Car cover: Heavy uses cars as carry cover.",
            "Multi-level: Heavy Level 1, Medium Level 2, Light Level 3.",
            "Reset hold: Medium Defib.",
          ],
        },
      },
    },
  },
  "dean-square": {
    "plaza": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Dean Square Plaza is the central courtyard with monument cover. Heavy mesh-carries past Monument, Medium covers heal beam, Light grapples to Apartments balcony for SR-84 picks.",
        callouts: ["Plaza Center", "Monument", "Apartments Balcony", "Theater Entry", "Side Cafe", "Underpass", "Rooftops"],
        utility: [
          "Heavy: Mesh Shield + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: SR-84 + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Plaza commit", from: "Theater Entry", use: "Heavy mesh-carries past Monument, Medium heal beam behind." },
            { spawn: "Apartments balcony flank", from: "Light Grapple", use: "Light grapples Apartments for top-down SR-84." },
          ],
          spawnKillSpots: [
            { from: "Apartments Balcony", target: "enemy Cashout team", risk: "Medium — exposed vertical", reward: "Cashout steal + height advantage" },
          ],
          advancedSetups: [
            "Monument cover route: Heavy uses Monument as carry cover.",
            "Third-party timing: wait for two teams to engage Plaza.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Dean Square Plaza: Heavy anchors Monument Cashout, Medium heal beam, Light Apartments balcony.",
        callouts: ["Plaza Center", "Monument", "Apartments Balcony", "Theater Entry", "Side Cafe", "Underpass", "Rooftops"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Apartments Balcony", target: "incoming team", timing: "15s extract pre-position" },
            { from: "Theater Entry", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Theater Entry.",
            "Light SR-84 from Apartments Balcony.",
          ],
          advancedSetups: [
            "Monument cover trade angle.",
            "Multi-floor: Heavy Plaza, Medium Rooftops, Light Apartments.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
    },
    "theater": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Dean Square Theater is the interior multi-floor arena. Heavy mesh-carries through main entry, Medium heal beam, Light grapples to balcony for vertical picks.",
        callouts: ["Theater Lobby", "Stage", "Balcony", "Side Doors", "Mezzanine", "Backstage", "Rooftop"],
        utility: [
          "Heavy: Mesh Shield + Barricade + RPG",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: Cloak + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Stage commit", from: "Theater Lobby", use: "Heavy mesh-carries through Lobby, Medium covers heal beam." },
            { spawn: "Balcony flank", from: "Light Grapple", use: "Light grapples Balcony for top-down picks." },
          ],
          spawnKillSpots: [
            { from: "Balcony", target: "enemy Cashout team", risk: "Medium — exposed vertical", reward: "Cashout steal + height advantage" },
          ],
          advancedSetups: [
            "Backstage flank: Light cloaks for surprise back-line.",
            "Multi-floor commit: Heavy Stage + Light Balcony split.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Dean Square Theater: Heavy anchors Stage Cashout, Medium heal beam, Light Balcony SR-84.",
        callouts: ["Theater Lobby", "Stage", "Balcony", "Side Doors", "Mezzanine", "Backstage", "Rooftop"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Balcony", target: "incoming team", timing: "15s extract pre-position" },
            { from: "Backstage", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Theater Lobby.",
            "Light SR-84 from Balcony.",
          ],
          advancedSetups: [
            "Multi-floor: Heavy Stage, Medium Mezzanine, Light Balcony.",
            "Backstage denial: Heavy goos Backstage.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
    },
    "apartments": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Dean Square Apartments is the multi-floor residential block. Heavy mesh-carries through stairwell, Medium heal beam, Light grapples between floors.",
        callouts: ["Apt 1st", "Apt 2nd", "Apt 3rd", "Stairwell", "Hallway", "Rooftop", "Side Doors"],
        utility: [
          "Heavy: Mesh Shield + Barricade + RPG",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: Cloak + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Stairwell commit", from: "Side Doors", use: "Heavy mesh-carries up Stairwell, Medium covers heal beam." },
            { spawn: "Rooftop flank", from: "Light Grapple", use: "Light grapples Rooftop for top-down picks." },
          ],
          spawnKillSpots: [
            { from: "Rooftop", target: "enemy Cashout team", risk: "Medium — exposed vertical", reward: "Cashout steal + height advantage" },
          ],
          advancedSetups: [
            "Multi-floor commit: Heavy stairwell + Light rooftop split.",
            "Goo + Pyro combo: Heavy goos stairwell, Medium Pyros, Light cleans up.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Dean Square Apartments: Heavy anchors Cashout floor, Medium heal beam, Light Rooftop SR-84.",
        callouts: ["Apt 1st", "Apt 2nd", "Apt 3rd", "Stairwell", "Hallway", "Rooftop", "Side Doors"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Rooftop", target: "incoming team", timing: "15s extract pre-position" },
            { from: "Stairwell", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Stairwell.",
            "Light SR-84 from Rooftop.",
          ],
          advancedSetups: [
            "Multi-floor: Heavy Apt, Medium hallway, Light Rooftop.",
            "Stairwell denial: Heavy goos Stairwell.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
    },
    "underpass": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Dean Square Underpass is the underground tunnel network. Heavy mesh-carries through tight tunnel, Medium heal beam, Light cloaks for surprise back-line.",
        callouts: ["Tunnel Center", "Side Tunnels", "Stairs Up", "Stairs Down", "Cubby", "Choke", "Exit Plaza"],
        utility: [
          "Heavy: Mesh Shield + Barricade + RPG",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: Cloak + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Tunnel commit", from: "Stairs Down", use: "Heavy mesh-carries through Tunnel, Medium covers heal beam." },
            { spawn: "Side Tunnel flank", from: "Light Cloak", use: "Light cloaks Side Tunnel for back-line trade." },
          ],
          spawnKillSpots: [
            { from: "Stairs Up", target: "enemy Cashout team", risk: "Medium — exposed vertical", reward: "Cashout steal + back-line trade" },
          ],
          advancedSetups: [
            "Goo + Pyro combo: Heavy goos Tunnel, Medium Pyros, Light cleans up.",
            "Side Tunnel flank: Light cloak for surprise.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Dean Square Underpass: Heavy anchors Tunnel Cashout, Medium heal beam, Light Side Tunnel SR-84.",
        callouts: ["Tunnel Center", "Side Tunnels", "Stairs Up", "Stairs Down", "Cubby", "Choke", "Exit Plaza"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Stairs Up", target: "incoming team", timing: "15s extract pre-position" },
            { from: "Side Tunnels", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Tunnel choke.",
            "Light SR-84 from Stairs Up.",
          ],
          advancedSetups: [
            "Tunnel denial: Heavy goos Tunnel entries.",
            "Multi-floor: Heavy Tunnel, Medium Stairs, Light Cubby.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
    },
  },
  "studio": {
    "stage-a": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Studio Stage A is the TV studio set with breakaway props. Heavy mesh-carries through main set, Medium heal beam, Light grapples to lighting rig for vertical picks.",
        callouts: ["Stage A Floor", "Lighting Rig", "Audience Seats", "Backstage", "Control Booth", "Side Doors", "Set Props"],
        utility: [
          "Heavy: Mesh Shield + Barricade + RPG",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: Cloak + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Stage commit", from: "Audience Seats", use: "Heavy mesh-carries through Audience, Medium covers heal beam." },
            { spawn: "Lighting Rig vertical", from: "Light Grapple", use: "Light grapples Lighting Rig for top-down picks." },
          ],
          spawnKillSpots: [
            { from: "Lighting Rig", target: "enemy Cashout team", risk: "Medium — exposed vertical", reward: "Cashout steal + height advantage" },
          ],
          advancedSetups: [
            "Set destruction: Heavy RPGs props for new sightlines.",
            "Backstage flank: Light cloaks for surprise back-line.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Studio Stage A: Heavy anchors Cashout, Medium heal beam, Light Lighting Rig SR-84.",
        callouts: ["Stage A Floor", "Lighting Rig", "Audience Seats", "Backstage", "Control Booth", "Side Doors", "Set Props"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Lighting Rig", target: "incoming team", timing: "15s extract pre-position" },
            { from: "Backstage", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Audience Seats.",
            "Light SR-84 from Lighting Rig.",
          ],
          advancedSetups: [
            "Set cover: pre-position behind Set Props.",
            "Multi-floor: Heavy Stage, Medium Control Booth, Light Lighting Rig.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
    },
    "stage-b": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Studio Stage B is the secondary TV set with weather-effect props. Heavy mesh-carries through set, Medium heal beam, Light grapples for vertical picks.",
        callouts: ["Stage B Floor", "Weather Wall", "Audience Seats", "Backstage", "Control Booth", "Side Doors", "Props"],
        utility: [
          "Heavy: Mesh Shield + Barricade + RPG",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: Cloak + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Stage commit", from: "Audience Seats", use: "Heavy mesh-carries through Audience, Medium covers heal beam." },
            { spawn: "Vertical flank", from: "Light Grapple", use: "Light grapples set lighting for top-down picks." },
          ],
          spawnKillSpots: [
            { from: "Backstage", target: "enemy Cashout team", risk: "Medium — exposed flank", reward: "Cashout steal + back-line trade" },
          ],
          advancedSetups: [
            "Set destruction: Heavy RPGs props for new sightlines.",
            "Backstage flank: Light cloaks for surprise.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Studio Stage B: Heavy anchors Cashout, Medium heal beam, Light Lighting SR-84.",
        callouts: ["Stage B Floor", "Weather Wall", "Audience Seats", "Backstage", "Control Booth", "Side Doors", "Props"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Control Booth", target: "incoming team", timing: "15s extract pre-position" },
            { from: "Backstage", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Audience Seats.",
            "Light SR-84 from Lighting.",
          ],
          advancedSetups: [
            "Set cover: pre-position behind Props.",
            "Multi-floor: Heavy Stage, Medium Control Booth, Light Lighting.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
    },
    "green-room": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Studio Green Room is the close-quarters lounge area. Heavy mesh-carries through doorway, Medium heal beam, Light cloaks for back-line trade.",
        callouts: ["Green Room Center", "Side Couches", "Bar", "Side Doors", "Hallway", "Ceiling Vent", "Stairs"],
        utility: [
          "Heavy: Mesh Shield + Barricade + RPG",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: Cloak + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Doorway commit", from: "Hallway", use: "Heavy mesh-carries through Doorway, Medium covers heal beam." },
            { spawn: "Side Door flank", from: "Side Doors", use: "Light cloaks Side Doors for back-line." },
          ],
          spawnKillSpots: [
            { from: "Bar", target: "enemy Cashout team", risk: "Medium — exposed flank", reward: "Cashout steal + back-line trade" },
          ],
          advancedSetups: [
            "Goo + Pyro combo: Heavy goos Doorway, Medium Pyros, Light cleans up.",
            "Side Door flank: Light cloak for surprise.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Studio Green Room: Heavy anchors Cashout, Medium heal beam, Light Side Doors SR-84.",
        callouts: ["Green Room Center", "Side Couches", "Bar", "Side Doors", "Hallway", "Ceiling Vent", "Stairs"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Bar", target: "incoming team", timing: "15s extract pre-position" },
            { from: "Side Doors", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Doorway.",
            "Light SR-84 from Bar.",
          ],
          advancedSetups: [
            "Side Door denial: Heavy goos Side Doors.",
            "Multi-floor: Heavy Green Room, Medium Stairs, Light Ceiling Vent.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
    },
    "sound-booth": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Studio Sound Booth is the recording-equipment-filled tight room. Heavy mesh-carries through doorway, Medium heal beam, Light grapples to ceiling for vertical picks.",
        callouts: ["Sound Booth Floor", "Recording Equipment", "Side Doors", "Hallway", "Window", "Ceiling Vent", "Control Panel"],
        utility: [
          "Heavy: Mesh Shield + Barricade + RPG",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: Cloak + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Booth commit", from: "Hallway", use: "Heavy mesh-carries through Doorway, Medium covers heal beam." },
            { spawn: "Window flank", from: "Light Grapple", use: "Light grapples to Window for surprise back-line." },
          ],
          spawnKillSpots: [
            { from: "Window", target: "enemy Cashout team", risk: "Medium — exposed flank", reward: "Cashout steal + back-line trade" },
          ],
          advancedSetups: [
            "Equipment destruction: Heavy RPGs Recording Equipment for new sightlines.",
            "Goo + Pyro combo: Heavy goos Doorway, Medium Pyros, Light cleans up.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Studio Sound Booth: Heavy anchors Cashout, Medium heal beam, Light Window SR-84.",
        callouts: ["Sound Booth Floor", "Recording Equipment", "Side Doors", "Hallway", "Window", "Ceiling Vent", "Control Panel"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Ceiling Vent", target: "incoming team", timing: "15s extract pre-position" },
            { from: "Window", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Doorway.",
            "Light SR-84 from Window.",
          ],
          advancedSetups: [
            "Equipment cover: pre-position behind Recording Equipment.",
            "Multi-floor: Heavy Booth, Medium Ceiling Vent, Light Window.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
    },
  },
  "vegas-strip": {
    "casino-floor": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Vegas Strip Casino Floor is the wide-open gambling hall with slot machine cover. Heavy mesh-carries between rows, Medium heal beam, Light grapples to upper balcony for SR-84 picks.",
        callouts: ["Casino Center", "Slot Rows", "Tables", "Cage", "Balcony", "Bar", "Side Doors"],
        utility: [
          "Heavy: Mesh Shield + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: SR-84 + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Casino commit", from: "Side Doors", use: "Heavy mesh-carries between Slot Rows, Medium covers heal beam." },
            { spawn: "Balcony flank", from: "Light Grapple", use: "Light grapples Balcony for top-down SR-84 picks." },
          ],
          spawnKillSpots: [
            { from: "Balcony", target: "enemy Cashout team", risk: "Medium — exposed vertical", reward: "Cashout steal + height advantage" },
          ],
          advancedSetups: [
            "Slot Row cover: Heavy uses slot machines as carry cover.",
            "Third-party timing: wait for two teams to engage.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Vegas Strip Casino Floor: Heavy anchors Cashout between Slot Rows, Medium heal beam, Light Balcony SR-84.",
        callouts: ["Casino Center", "Slot Rows", "Tables", "Cage", "Balcony", "Bar", "Side Doors"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Balcony", target: "incoming team", timing: "15s extract pre-position" },
            { from: "Bar", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Side Doors entry.",
            "Light SR-84 from Balcony.",
          ],
          advancedSetups: [
            "Slot cover: pre-position between Slot Rows.",
            "Multi-floor: Heavy Casino, Medium Mezzanine, Light Balcony.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
    },
    "hotel": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Vegas Strip Hotel is the multi-floor tower with stairwell access. Heavy mesh-carries through Hotel Lobby, Medium heal beam, Light grapples between floors.",
        callouts: ["Hotel Lobby", "Stairwell", "Hotel Floor 1", "Hotel Floor 2", "Rooftop", "Side Doors", "Hallway"],
        utility: [
          "Heavy: Mesh Shield + Barricade + RPG",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: Cloak + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Lobby commit", from: "Side Doors", use: "Heavy mesh-carries through Lobby, Medium covers heal beam." },
            { spawn: "Rooftop vertical", from: "Light Grapple", use: "Light grapples Rooftop for top-down picks." },
          ],
          spawnKillSpots: [
            { from: "Rooftop", target: "enemy Cashout team", risk: "Medium — exposed vertical", reward: "Cashout steal + height advantage" },
          ],
          advancedSetups: [
            "Multi-floor commit: Heavy Lobby + Light Rooftop split.",
            "Stairwell goo: Heavy goos Stairwell for denial.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Vegas Strip Hotel: Heavy anchors Cashout floor, Medium heal beam, Light Rooftop SR-84.",
        callouts: ["Hotel Lobby", "Stairwell", "Hotel Floor 1", "Hotel Floor 2", "Rooftop", "Side Doors", "Hallway"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Rooftop", target: "incoming team", timing: "15s extract pre-position" },
            { from: "Stairwell", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Lobby entry.",
            "Light SR-84 from Rooftop.",
          ],
          advancedSetups: [
            "Multi-floor: Heavy Hotel Floor, Medium Stairwell, Light Rooftop.",
            "Stairwell denial: Heavy goos Stairwell entry.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
    },
    "strip": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Vegas Strip outdoor lane is the central pedestrian boulevard. Heavy mesh-carries down the open Strip, Medium heal beam, Light grapples Casino rooftops for vertical picks.",
        callouts: ["Strip Center", "Crosswalk", "Casino Rooftops", "Side Cafe", "Fountain", "Tickets", "Loading Dock"],
        utility: [
          "Heavy: Mesh Shield + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: SR-84 + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Strip commit", from: "Crosswalk", use: "Heavy mesh-carries down Strip, full team covers." },
            { spawn: "Casino Rooftop flank", from: "Light Grapple", use: "Light grapples Casino Rooftop for top-down picks." },
          ],
          spawnKillSpots: [
            { from: "Casino Rooftops", target: "enemy Cashout team", risk: "Medium — exposed third-party", reward: "Cashout steal + height advantage" },
          ],
          advancedSetups: [
            "Fountain cover route for Heavy carry.",
            "Third-party timing: wait for two teams to engage on the Strip.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Vegas Strip: Heavy anchors Fountain Cashout, Medium heal beam, Light Casino Rooftop SR-84.",
        callouts: ["Strip Center", "Crosswalk", "Casino Rooftops", "Side Cafe", "Fountain", "Tickets", "Loading Dock"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Casino Rooftops", target: "incoming team", timing: "15s extract pre-position" },
            { from: "Side Cafe", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Crosswalk.",
            "Light SR-84 from Casino Rooftop.",
          ],
          advancedSetups: [
            "Fountain cover: trade angle.",
            "Multi-floor: Heavy Strip, Medium Casino mezzanine, Light Rooftop.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
    },
    "pool": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Vegas Strip Pool is the open rooftop pool area. Heavy mesh-carries past pool deck, Medium heal beam, Light grapples to umbrellas + cabanas for vertical picks. Pool hazard — boop enemies in for kills.",
        callouts: ["Pool Deck", "Cabanas", "Diving Board", "Bar", "Hotel Door", "Side Pool", "Edge"],
        utility: [
          "Heavy: Mesh Shield + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: SR-84 + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Pool commit", from: "Hotel Door", use: "Heavy mesh-carries past Pool Deck, Medium covers heal beam." },
            { spawn: "Cabana flank", from: "Light Grapple", use: "Light grapples Cabana for off-angle SR-84 picks." },
          ],
          spawnKillSpots: [
            { from: "Diving Board", target: "enemy Cashout team", risk: "Medium — exposed vertical", reward: "Cashout steal + height advantage" },
          ],
          advancedSetups: [
            "Pool hazard: boop enemies into Pool — round-winning play.",
            "Cabana flank: Light grapples for vertical pick.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Vegas Strip Pool: Heavy anchors Cashout (not near edge), Medium heal beam, Light Cabana SR-84.",
        callouts: ["Pool Deck", "Cabanas", "Diving Board", "Bar", "Hotel Door", "Side Pool", "Edge"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Diving Board", target: "incoming team", timing: "15s extract pre-position" },
            { from: "Side Pool", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Hotel Door entry.",
            "Don't anchor near Edge — boop = instant kill.",
          ],
          advancedSetups: [
            "Pool hazard: boop enemies in pool for round win.",
            "Multi-floor: Heavy Deck, Medium Bar, Light Cabana.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
    },
  },
  "horizon-2": {
    "server-room": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "SYS$HORIZON 2.0 Server Room is the high-tech digital arena — neon corridors and server-rack cover. Heavy mesh-carries between racks, Medium heal beam, Light grapples to upper catwalks for vertical picks.",
        callouts: ["Server Room Center", "Server Racks", "Catwalks", "Cooling Pipes", "Side Doors", "Control Room", "Ceiling Grid"],
        utility: [
          "Heavy: Mesh Shield + Barricade + RPG",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: Cloak + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Server Room commit", from: "Side Doors", use: "Heavy mesh-carries between Server Racks, Medium covers heal beam." },
            { spawn: "Catwalks vertical", from: "Light Grapple", use: "Light grapples Catwalks for top-down picks." },
          ],
          spawnKillSpots: [
            { from: "Ceiling Grid", target: "enemy Cashout team", risk: "Medium — exposed vertical", reward: "Cashout steal + height advantage" },
          ],
          advancedSetups: [
            "Server Rack cover: Heavy uses racks as carry cover.",
            "Goo + Pyro combo: Heavy goos Side Doors, Medium Pyros, Light cleans up.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Server Room: Heavy anchors Cashout between racks, Medium heal beam, Light Catwalks SR-84.",
        callouts: ["Server Room Center", "Server Racks", "Catwalks", "Cooling Pipes", "Side Doors", "Control Room", "Ceiling Grid"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Catwalks", target: "incoming team", timing: "15s extract pre-position" },
            { from: "Control Room", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Side Doors entry.",
            "Light SR-84 from Catwalks.",
          ],
          advancedSetups: [
            "Rack cover: trade angle between Server Racks.",
            "Multi-floor: Heavy Server Room, Medium Control Room, Light Catwalks.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
    },
    "network": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Network Cashout is the central neon hub with data-stream effects. Heavy mesh-carries through main, Medium heal beam, Light grapples for vertical picks. Data-stream walls are destructible — RPG for new sightlines.",
        callouts: ["Network Hub", "Data Streams", "Side Routers", "Switch Banks", "Catwalk Top", "Side Doors", "Cable Pit"],
        utility: [
          "Heavy: Mesh Shield + Barricade + RPG",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: Cloak + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Network commit", from: "Side Doors", use: "Heavy mesh-carries through Network Hub, Medium covers heal beam." },
            { spawn: "Catwalk Top flank", from: "Light Grapple", use: "Light grapples Catwalk Top for top-down picks." },
          ],
          spawnKillSpots: [
            { from: "Catwalk Top", target: "enemy Cashout team", risk: "Medium — exposed vertical", reward: "Cashout steal + height advantage" },
          ],
          advancedSetups: [
            "Data-stream destruction: Heavy RPGs walls for new angles.",
            "Cable Pit flank: Light cloaks through Cable Pit.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Network: Heavy anchors Cashout, Medium heal beam, Light Catwalk Top SR-84.",
        callouts: ["Network Hub", "Data Streams", "Side Routers", "Switch Banks", "Catwalk Top", "Side Doors", "Cable Pit"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Catwalk Top", target: "incoming team", timing: "15s extract pre-position" },
            { from: "Cable Pit", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Side Doors entry.",
            "Light SR-84 from Catwalk Top.",
          ],
          advancedSetups: [
            "Data-stream cover: trade angle behind streams.",
            "Multi-floor: Heavy Hub, Medium Switch Banks, Light Catwalk.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
    },
    "backbone": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Backbone is the long central corridor connecting the network nodes. Heavy mesh-carries down corridor, Medium heal beam, Light grapples to overhead cable runs for vertical.",
        callouts: ["Backbone Corridor", "Cable Runs", "Side Junctions", "Server Banks", "Catwalk", "Ceiling Cables", "Side Doors"],
        utility: [
          "Heavy: Mesh Shield + Barricade + RPG",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: Cloak + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Corridor commit", from: "Side Doors", use: "Heavy mesh-carries down Corridor, Medium covers heal beam." },
            { spawn: "Cable run flank", from: "Light Grapple", use: "Light grapples Cable Run for top-down picks." },
          ],
          spawnKillSpots: [
            { from: "Ceiling Cables", target: "enemy Cashout team", risk: "Medium — exposed vertical", reward: "Cashout steal + height advantage" },
          ],
          advancedSetups: [
            "Side Junction flank: Light cloaks Side Junctions.",
            "Server Bank cover: Heavy uses Server Banks as carry cover.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Backbone Corridor: Heavy anchors Cashout, Medium heal beam, Light Catwalk SR-84.",
        callouts: ["Backbone Corridor", "Cable Runs", "Side Junctions", "Server Banks", "Catwalk", "Ceiling Cables", "Side Doors"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Catwalk", target: "incoming team", timing: "15s extract pre-position" },
            { from: "Side Junctions", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Corridor entry.",
            "Light SR-84 from Catwalk.",
          ],
          advancedSetups: [
            "Server Bank cover: trade angle behind banks.",
            "Multi-floor: Heavy Corridor, Medium Catwalk, Light Ceiling Cables.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
    },
    "datacenter": {
      attack: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Datacenter is the large open server farm with rows of racks. Heavy mesh-carries between row aisles, Medium heal beam, Light grapples to upper management deck for vertical.",
        callouts: ["Datacenter Floor", "Server Rows", "Management Deck", "Cooling Aisle", "Side Doors", "Power Room", "Catwalk"],
        utility: [
          "Heavy: Mesh Shield + Barricade + RPG",
          "Medium: Healing Beam + Defib + APS Turret",
          "Light: Cloak + Grapple + Glitch Grenades",
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: "Floor commit", from: "Side Doors", use: "Heavy mesh-carries between Server Rows, Medium covers heal beam." },
            { spawn: "Management Deck flank", from: "Light Grapple", use: "Light grapples Management Deck for top-down picks." },
          ],
          spawnKillSpots: [
            { from: "Management Deck", target: "enemy Cashout team", risk: "Medium — exposed vertical", reward: "Cashout steal + height advantage" },
          ],
          advancedSetups: [
            "Server Row cover: Heavy uses rows as carry cover.",
            "Power Room flank: Light cloaks Power Room.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
      defense: {
        operators: [
          { name: "Heavy", role: "Anchor / Vault Carry", priority: "essential" },
          { name: "Medium", role: "Healer / Utility", priority: "essential" },
          { name: "Light", role: "Flank / Pick", priority: "recommended" },
        ],
        strategy: "Hold Datacenter: Heavy anchors Cashout between Server Rows, Medium heal beam, Light Management Deck SR-84.",
        callouts: ["Datacenter Floor", "Server Rows", "Management Deck", "Cooling Aisle", "Side Doors", "Power Room", "Catwalk"],
        utility: [
          "Heavy: Barricade + APS + RPG; Goo Gun",
          "Medium: Healing Beam + Defib + Jump Pad",
          "Light: SR-84 + Grapple + Stun Gun",
        ],
        premiumTactics: {
          runouts: [
            { from: "Management Deck", target: "incoming team", timing: "15s extract pre-position" },
            { from: "Power Room", target: "flanking third team", timing: "Mid-contest peel" },
          ],
          antiSpawnPeek: [
            "Pre-aim Side Doors entry.",
            "Light SR-84 from Management Deck.",
          ],
          advancedSetups: [
            "Server Row cover: trade angle between rows.",
            "Multi-floor: Heavy Floor, Medium Catwalk, Light Management Deck.",
            "Reset hold: Medium Defib for wipe.",
          ],
        },
      },
    },
  },
}

export default STRATS
