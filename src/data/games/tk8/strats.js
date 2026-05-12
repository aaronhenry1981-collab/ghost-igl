// Tekken 8 — gameplay phase strats per stage.
// `attack` = P1 pressure / mix-up game; `defense` = P2 counter / whiff-punish.

const STRATS = {
  "arena": {
    "neutral": {
      attack: {
        operators: [
          { name: "Jin", role: "All-Rounder", priority: "essential" },
          { name: "Kazuya", role: "Mishima Pressure", priority: "recommended" },
          { name: "Lars", role: "Rushdown", priority: "recommended" },
          { name: "Paul", role: "Damage Striker", priority: "recommended" },
        ],
        strategy: "Neutral game is mid-distance footsies — 15-frame-range pokes, whiff-punishment, and movement. Pre-emptive low jab (d+1), mid pokes (df+1, df+2 launchers if available), and KBD (Korean Backdash) to maintain spacing. Don't commit to high-damage moves at neutral — opponent ducks and launches. Use df+1 to interrupt opponent's mid-range pokes. Heat Engager (Heat-Burst on hit) is your gateway to combo mode. Save Heat for round-deciding mix-ups, not opener neutrals.",
        callouts: ["df+1 (Mid Jab)", "d+1 (Low Jab)", "KBD (Korean Backdash)", "Heat Engager", "Whiff-Punish", "Sidestep", "Round-Start Range"],
        utility: [
          "df+1 mid jab — interrupts mid-range pokes",
          "d+1 low jab — pressure opponent's stance",
          "KBD for spacing + whiff-punish",
          "Heat Engager on hit — combo mode",
          "Sidestep (SS) — circle to opponent's weak side",
        ],
      },
      defense: {
        operators: [
          { name: "Asuka", role: "Defensive Counter", priority: "essential" },
          { name: "Lili", role: "Spacing", priority: "recommended" },
          { name: "Jun", role: "Mid-Range Defender", priority: "recommended" },
        ],
        strategy: "Defensive neutral: backdash to whiff-punish range (15-frame KBD repeat). Sidestep (SS+R for right step, SS+L for left) is the cornerstone of Tekken 8 defense — every linear move can be sidestepped. Parry incoming kicks with df+3 (Asuka) or block-string into reversal launcher. Crouch-block low pokes by holding d/b; stand-block mid pokes neutral. Don't get baited into committing on opponent's frame-trap setups. Identify opponent's most-common neutral string (3 mid-range moves) and pre-emptively sidestep it.",
        callouts: ["KBD", "Sidestep (SS+L or SS+R)", "Parry (df+3 Asuka)", "Crouch-Block", "Stand-Block", "Reversal Launcher"],
        utility: [
          "KBD for whiff-punish range",
          "Sidestep linear strings",
          "Parry with df+3 (Asuka) or character-specific",
          "Stand-block mids, crouch-block lows",
          "Reversal launcher on block-string break",
        ],
      },
    },
    "wall": {
      attack: {
        operators: [
          { name: "King", role: "Grappler", priority: "essential" },
          { name: "Bryan", role: "Mid-Range Pressure", priority: "recommended" },
          { name: "Hwoarang", role: "Stance Pressure", priority: "recommended" },
        ],
        strategy: "Wall pressure: opponent's back is to the wall. Maximize damage with wall combos. Standard wall combo: Heat Engager → micro-dash → Wall Splat (W!) → Wall Combo → Wall Break (W!) → 65+ damage. Character-specific extender (Bryan: f+4 ender; Kazuya: hellsweep ender). Wall-carry damage scales with character — King has the longest carry; Lili has the shortest. After wall break, use oki (knockdown mix-up): df+2 launcher into another wall.",
        callouts: ["Wall Splat (W!)", "Wall Break (W!)", "Heat Engager", "Wall Combo Extender", "Oki Mix-Up", "Tornado (50+ damage)"],
        utility: [
          "Heat Engager → Wall Splat combo",
          "Micro-dash before Wall Splat",
          "Character-specific Wall Combo Extender",
          "Wall Break (W!) for second hit",
          "Oki Mix-Up after Wall Break",
        ],
      },
      defense: {
        operators: [
          { name: "Asuka", role: "Defensive Counter", priority: "essential" },
          { name: "Lili", role: "Spacing", priority: "recommended" },
        ],
        strategy: "Wall defense: don't get caught in opponent's wall combo. Pre-wall escape: sidestep before opponent gets you wall-splatted. If you're wall-splatted, hold neutral and tech-roll on landing (no input = standard roll; b+1+2 for back-tech). Reversal launcher (Asuka 1+2) on opponent's wall combo extender = escape route. Get up correctly: rise + block immediately for opponent's oki mix-up.",
        callouts: ["Pre-Wall Sidestep", "Tech Roll (b+1+2)", "Reversal Launcher (1+2)", "Stand Block on Rise", "Get-Up Kick"],
        utility: [
          "Sidestep before wall splat",
          "Tech-roll b+1+2 on landing",
          "Reversal launcher on Wall Combo break",
          "Stand-block on rise from oki",
          "Get-Up Kick (3+4) to escape pressure",
        ],
      },
    },
    "corner": {
      attack: {
        operators: [
          { name: "Hwoarang", role: "Stance Pressure", priority: "essential" },
          { name: "Lars", role: "Rushdown", priority: "recommended" },
          { name: "Bryan", role: "Mid-Range Pressure", priority: "recommended" },
        ],
        strategy: "Corner carry: opponent has no escape. Mix-up game maxed. High/low/throw mix every block-string. Hwoarang stance pressure: Right Flamingo → Left Flamingo → kick string + throw mix-up. Lars Dynamic Entry stance: SE+L for mid, SE+R for low, throw to break stance. Don't break corner pressure without a sure-kill setup; opponent escapes if you give them oki. Use throws (1+3 for left grab, 2+4 for right grab) to break corner block.",
        callouts: ["High/Low/Throw Mix", "Hwoarang Flamingo Pressure", "Lars Dynamic Entry", "Throw (1+3 or 2+4)", "Oki Mix-Up"],
        utility: [
          "High/Low/Throw mix-up every block",
          "Hwoarang stance pressure",
          "Lars Dynamic Entry stance",
          "Throw break corner block",
          "Oki Mix-Up after knockdown",
        ],
      },
      defense: {
        operators: [
          { name: "Jun", role: "Defensive Spacing", priority: "essential" },
          { name: "Asuka", role: "Reversal Counter", priority: "recommended" },
        ],
        strategy: "Corner defense: you're trapped. Two options: escape laterally (sidestep with SS+L or SS+R), or break the mix-up with reversal. Tech-rolling out of knockdown is your escape route. Don't commit to a low parry (Asuka df+1+2) unless you've read low coming. Block correctly: stand-block mid, crouch-block low, jump cancel on throw (high+low jump break = 1+3 or 2+4 simultaneously on opponent's throw whiff timing).",
        callouts: ["Sidestep Escape", "Tech-Roll", "Throw Break (1+3 or 2+4 jump)", "Reversal (1+2)", "Stand-Block / Crouch-Block"],
        utility: [
          "Sidestep escape from corner",
          "Tech-roll on knockdown",
          "Throw break (1+3 / 2+4 jump)",
          "Reversal launcher (1+2)",
          "Stand-block mid, crouch-block low",
        ],
      },
    },
    "round-start": {
      attack: {
        operators: [
          { name: "Paul", role: "Damage Striker", priority: "essential" },
          { name: "Bryan", role: "Mid-Range Pressure", priority: "recommended" },
          { name: "Kazuya", role: "Mishima Pressure", priority: "recommended" },
        ],
        strategy: "Round-start is the 5-frame opportunity at match start. Use unique round-start strings: Paul Deathfist (qcf+2) for opener damage, Bryan B+1 elbow for counter-hit launcher, Kazuya electric uppercut for Mishima opener. Don't commit at round-start without read; opponent's defensive sidestep beats linear opener. Sidestep your own opener if opponent stands still — they're punishing.",
        callouts: ["Round-Start Range (~15 frames)", "Paul Deathfist (qcf+2)", "Bryan B+1 Elbow", "Kazuya Electric (EWGF)", "Sidestep Counter"],
        utility: [
          "Paul Deathfist for high damage opener",
          "Bryan B+1 elbow for counter-hit launcher",
          "Kazuya Electric Wind God Fist (EWGF)",
          "Sidestep if opponent stands still",
          "Don't commit; read opponent's pattern first",
        ],
      },
      defense: {
        operators: [
          { name: "Lili", role: "Whiff-Punisher", priority: "essential" },
          { name: "Asuka", role: "Reversal Counter", priority: "recommended" },
        ],
        strategy: "Defensive round-start: backdash 1 to 2 KBD steps for whiff-punish range. Sidestep with SS+L (right step) to break Paul Deathfist's linear path. If opponent commits Mishima Electric, parry with character-specific reversal. Don't get baited into committing; the first move of the round sets the tone. Whiff-punish with df+2 launcher.",
        callouts: ["Backdash (KBD)", "Sidestep SS+L", "Parry (1+2 or character-specific)", "df+2 Whiff-Punish Launcher"],
        utility: [
          "KBD 2 steps for whiff-punish range",
          "Sidestep SS+L for linear openers",
          "Parry / reversal for committed openers",
          "df+2 whiff-punish launcher",
          "Don't commit; let opponent commit first",
        ],
      },
    },
  },
}

export default STRATS
