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
}

export default STRATS
