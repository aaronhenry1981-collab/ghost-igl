// EA Sports FC — formation comparison + custom tactics presets + player chemistry.
// FUT meta-driven; FUT Champions is the primary competitive context.

const LOADOUTS = {
  formations: {
    name: "Formation Comparison",
    role: "Pick a formation by playstyle",
    summary: "Formation choice anchors your whole game. Switching mid-game costs muscle memory.",
    options: {
      "4-3-3-attack": {
        name: "4-3-3 (Attack)",
        playstyle: "High-press, pacey wingers, attacking full-backs",
        strengths: "Pace cut-inside wingers (Mbappé / Vinícius / Salah); CAM-anchored attack",
        weaknesses: "Vulnerable to counter-attack (high line); needs Rodri-tier CDM",
        meta_picks: "Mbappé ST + Vinícius LW + Salah RW + Bellingham CAM + Rodri CDM",
      },
      "4-2-3-1-wide": {
        name: "4-2-3-1 Wide",
        playstyle: "Possession-based, double CDM screen, CAM anchor",
        strengths: "Most balanced formation; CAM creates from center; 2 CDMs hold midfield",
        weaknesses: "Wide attack relies on full-back overlap; ST isolated if no support",
        meta_picks: "Mbappé ST + Bellingham CAM + Saka LW + Salah RW + Rodri + Kanté CDM",
      },
      "4-4-2-flat": {
        name: "4-4-2 Flat",
        playstyle: "Counter-attack, banks of 4, fast forwards",
        strengths: "Defensive shape; 2 forwards for counter-attack pace",
        weaknesses: "No CAM = limited build-up; wide spaces between midfield + attack",
        meta_picks: "Mbappé + Haaland (forwards) + Bellingham + Saka (wide mids) + Van Dijk + Rüdiger",
      },
      "5-3-2": {
        name: "5-3-2 (Park-the-Bus)",
        playstyle: "Defensive shell, 3 CBs, 2 wing-backs",
        strengths: "Almost uncrackable defense; counter-attack with wing-backs forward",
        weaknesses: "Slow build-up; opponent dictates possession; relies on counter-finishing",
        meta_picks: "Mbappé + Haaland forwards + Rodri + Bellingham + Pedri mids + Van Dijk + Rüdiger + Saliba CBs",
      },
      "3-4-3": {
        name: "3-4-3 Wide Wingback",
        playstyle: "Wingback-heavy, 3 CBs, attacking wing-backs",
        strengths: "Attacking wingbacks (Theo / Hakimi) create overload wide",
        weaknesses: "Vulnerable to counter-attack on wings if wingback caught forward",
        meta_picks: "Mbappé + Vinícius + Salah forwards + Bellingham + Rodri mids + Theo + Hakimi wingbacks",
      },
    },
  },

  custom_tactics: {
    name: "Custom Tactics Presets",
    role: "In-match tactical adjustments",
    summary: "Tactics matter more than formation. Set Custom Tactics 1 = high press, 2 = balanced, 3 = park bus.",
    presets: {
      high_press: {
        name: "1 — High Press (Custom Tactic 1)",
        defensive_style: "High Press, Aggressive Interceptions",
        offensive_style: "Quick Build Up, Direct Passing",
        depth: 85,
        width: 50,
        when: "Losing 0-1, last 15 minutes",
      },
      balanced: {
        name: "2 — Balanced (Custom Tactic 2)",
        defensive_style: "Pressure on Heavy Touch, Balanced",
        offensive_style: "Balanced, Mixed Passing",
        depth: 65,
        width: 50,
        when: "Default 1st half setting",
      },
      park_bus: {
        name: "3 — Park the Bus (Custom Tactic 3)",
        defensive_style: "Drop Back, Compact Lines",
        offensive_style: "Counter-Attack, Long Ball",
        depth: 45,
        width: 35,
        when: "Winning 1-0 in last 5 minutes, or vs faster opponent",
      },
    },
  },

  player_chemistry: {
    name: "FUT Chemistry",
    role: "Chemistry points + Hero / Icon links",
    summary: "Chemistry adds stat boost. Aim for 23-25 chem; players need 5+ to play full potential.",
    rules: [
      "Same league / nation / club = chemistry link",
      "Icon Cards = 1 link to any nation OR club",
      "Hero Cards = +2 chem for league nation matches",
      "Manager card = +1 to all squad with same nation",
      "Position chemistry: player must be in preferred position OR alt position card",
    ],
    chemistry_priority: [
      "Front 3: 3 chemistry (full bonus on shooting + pace)",
      "Midfield 3: 3 chemistry (full bonus on passing + dribbling)",
      "Defense 4: 3 chemistry (full bonus on defending + physical)",
      "Goalkeeper: 1 chemistry (Diving + Handling + Reflexes)",
    ],
  },

  combo_meta: {
    name: "Combo Meta",
    role: "Skill move + finish combos",
    summary: "5-star skill move strikers enable the cut-inside meta.",
    combos: [
      { name: "Cut-Inside Finesse", inputs: "R1 + R-stick toward goal → Finesse shot (Square)", users: "Mbappé, Vinícius, Salah", goal: "Score top corner from 18 yards" },
      { name: "Ball Roll + Through Ball", inputs: "L1 + R-stick across → L1 + Cross", users: "Bellingham, De Bruyne", goal: "Set up split-second through-ball" },
      { name: "Heel-to-Heel + Shot", inputs: "L1 + L1 (heel) → Shot (Circle)", users: "Mbappé, Bellingham", goal: "Skip past CB, low-driven shot" },
      { name: "Rainbow Flick", inputs: "L1 + R-stick up", users: "Vinícius, Saka", goal: "Skip past CB in 1v1 — risky but unguardable" },
      { name: "Driven Cross", inputs: "L1 + R1 + Square (low driven)", users: "Trent, Hakimi", goal: "Cross-back to onrushing CAM" },
    ],
  },

  rivals_grind_strategy: {
    name: "Division Rivals Grind",
    role: "Weekly rank objectives",
    summary: "Rivals points convert to weekly rewards + Champions Qualifier slots.",
    objectives: [
      "First 3 wins = qualifier points + weekend objective",
      "5 wins = 1 player pack + 200 Rivals points",
      "10 wins = Champions Qualifier slot",
      "Champions Qualifier wins → Champions Finals slot",
      "Skip cup matches; focus on solo Rivals for consistent rewards",
    ],
    pacing: "3 games per session, 2-3 sessions per week, total ~10 wins. Skip if losing 3+ in row (tilt-stack costs you 5+ wins).",
  },
}

export default LOADOUTS
