// Tekken 8 — character archetypes, essential combos, matchup chart highlights.

const LOADOUTS = {
  archetypes: {
    name: "Character Archetypes",
    role: "Identify by playstyle",
    summary: "Tekken 8 has 6 archetypes. Pick one that matches your style — don't bounce between archetypes.",
    options: {
      rushdown: {
        name: "Rushdown / Pressure",
        examples: "Hwoarang, Lars, Steve",
        playstyle: "Constant frame-trap pressure, stance mix-ups, oki specialist",
        win_condition: "Overwhelm opponent with mix-up volume before they read patterns",
        weakness: "Whiff-punishers (Lili, Jun) waiting for committed strings",
      },
      mishima: {
        name: "Mishima / Electric Pressure",
        examples: "Kazuya, Heihachi, Reina, Devil Jin",
        playstyle: "Electric Wind God Fist (EWGF) into launcher, hellsweep mix-up, Heat pressure",
        win_condition: "Precision Electric execution + hellsweep mind-game",
        weakness: "Linear committed moves get sidestepped",
      },
      grappler: {
        name: "Grappler",
        examples: "King, Marduk, Kuma",
        playstyle: "Chain throws, command grab mix-ups, oki domination",
        win_condition: "Land a grab → 100+ damage through chain throw",
        weakness: "Jump cancel on throw (1+3 / 2+4 break), zoners spacing out grappler",
      },
      zoner: {
        name: "Zoner / Spacing",
        examples: "Yoshimitsu, Lili, Nina",
        playstyle: "Mid-range pokes, footsies, whiff-punish",
        win_condition: "Bait opponent into committed strings, whiff-punish for 50%+ damage",
        weakness: "Rushdown getting inside spacing range",
      },
      defensive: {
        name: "Defensive / Counter",
        examples: "Asuka, Jun, Anna",
        playstyle: "Parry game, sidestep punisher, reactive defense",
        win_condition: "Bait opponent into committed mix-up, parry / reversal launcher",
        weakness: "Mix-up volume — multiple high/low/throw decisions overload reactive game",
      },
      all_rounder: {
        name: "All-Rounder",
        examples: "Jin, Paul",
        playstyle: "Balanced kit — has tools for all matchups",
        win_condition: "Adapt to opponent's archetype each round",
        weakness: "No exceptional damage in any single matchup",
      },
    },
  },

  essential_combos: {
    name: "Essential Combos Per Character",
    role: "BnB (Bread-and-Butter) combos every player needs",
    summary: "Each Tekken 8 character has 2-3 essential BnB combos. Master these before learning advanced setups.",
    by_character: {
      kazuya: {
        name: "Kazuya BnB",
        combo: "Electric (f,n,d,df+2) → b+3 → dash → f+4 → Heat Engager → wall",
        damage: "~70 → 95+ on Heat",
        difficulty: "Hard (just-frame electric)",
      },
      jin: {
        name: "Jin BnB",
        combo: "df+2 (launcher) → 1, 4 → b+3,1 → Heat Engager → ZEN Combo → wall",
        damage: "~65 → 80+ on Heat",
        difficulty: "Medium",
      },
      king: {
        name: "King BnB",
        combo: "df+2 (launcher) → ff+2,1 → S! (Slap) → grab → grab → grab",
        damage: "~85 (chain throw)",
        difficulty: "Medium",
      },
      paul: {
        name: "Paul BnB",
        combo: "df+1+2 (launcher) → 1, 2, 1 → Deathfist (qcf+2) → wall",
        damage: "~75 → 100+ on Heat",
        difficulty: "Easy",
      },
      asuka: {
        name: "Asuka BnB",
        combo: "df+2 (launcher) → 1, 4 → b+4 → Heat Engager → wall",
        damage: "~60 → 75+ on Heat",
        difficulty: "Medium",
      },
      reina: {
        name: "Reina BnB",
        combo: "Electric Lite (f,n,d,df+2) → b+3,4 → dash → Heat Engager → wall",
        damage: "~70 → 90+ on Heat",
        difficulty: "Hard",
      },
      hwoarang: {
        name: "Hwoarang BnB",
        combo: "df+3,2 → Right Flamingo → 4,4 → Heat Engager → wall",
        damage: "~65 → 80+ on Heat",
        difficulty: "Medium",
      },
      lars: {
        name: "Lars BnB",
        combo: "df+2 (launcher) → 1, 4 → SE+R → Heat Engager → wall",
        damage: "~60 → 75+ on Heat",
        difficulty: "Easy",
      },
    },
  },

  matchup_chart: {
    name: "Matchup Chart Highlights",
    role: "Hard matchups + good matchups by character",
    summary: "Top 10 character matchup advantages for ranked play.",
    advantages: [
      { vs: "Yoshimitsu vs Kazuya", winner: "Yoshimitsu", reason: "Yoshi parries Electric attempts, stance mix-up beats Mishima poke" },
      { vs: "Hwoarang vs King", winner: "Hwoarang", reason: "Stance pressure beats grappler entry; King can't land grab mid-pressure" },
      { vs: "Lili vs Paul", winner: "Lili", reason: "Lili sidesteps Deathfist, whiff-punishes 50%+ damage" },
      { vs: "Bryan vs Jin", winner: "Bryan", reason: "Bryan counter-hit game beats Jin neutral; Taunt setup destroys Jin oki" },
      { vs: "King vs Asuka", winner: "King", reason: "Grab mix-up overloads Asuka's reactive defense" },
      { vs: "Kazuya vs Lars", winner: "Kazuya", reason: "Mishima Electric beats Lars Dynamic Entry stance" },
      { vs: "Steve vs Hwoarang", winner: "Steve", reason: "Steve counter-hit game beats Hwoarang stance commits" },
      { vs: "Jun vs Steve", winner: "Jun", reason: "Jun parry blocks Steve counter-hit attempts; spacing footsies win" },
      { vs: "Reina vs Paul", winner: "Reina", reason: "Reina Wind God Step Lite beats Paul linear committed moves" },
      { vs: "Asuka vs Bryan", winner: "Asuka", reason: "Parry kicks Bryan's mid-range commits; reversal launcher beats Snake Edge" },
    ],
  },

  heat_management: {
    name: "Heat System Mastery",
    role: "Tekken 8 Heat resource management",
    summary: "Heat is the new mechanic. Manage your Heat gauge — save for round-deciding moments.",
    rules: [
      "Heat gauge fills passively + on offense (~5 hits to fill)",
      "Heat Burst (R2 in default config) — instant burst, ends Heat",
      "Heat Engager — special move that enters Heat on hit",
      "Heat Smash — devastating finish during Heat (R1+R2)",
      "Heat duration: ~15 seconds; combo damage boosted",
    ],
    when_to_burn: [
      "Round 2/3 close — burn Heat to seal damage",
      "After Heat Engager hit — extend combo for 30%+ damage",
      "Defensive Heat Burst — escape opponent's pressure",
      "Don't burn Heat at round-start; save for kill moves",
    ],
  },

  ranked_progression: {
    name: "Ranked Progression Strategy",
    role: "Weekly Tekken King grind",
    summary: "Tekken 8 ranked has 30 ranks. Tekken King is the climbing goal for serious players.",
    rank_path: [
      "Beginner (0-9): Learn 1 character; play 50 ranked matches",
      "1st Dan to 5th Dan: Master 2-3 BnB combos; defensive sidestepping",
      "Bushin to Tenrai Bushin: Heat management + wall combos",
      "Tekken King: Matchup knowledge for top 10 picks; advanced oki",
      "Tekken Emperor: Frame data knowledge; pro-tier whiff-punish",
      "Tekken God: Tournament-level execution; mind games + reads",
    ],
    weekly_grind: [
      "Lock in 1 main character; learn 1 secondary (~30% playtime)",
      "10 ranked matches per session, 3 sessions/week",
      "Watch pro VOD between sessions (Knee, Arslan Ash, JDCR matches)",
      "Track win rate; if losing 3+ in row, stop session",
      "Practice mode 15 min before ranked (warm up BnB combos)",
    ],
  },
}

export default LOADOUTS
