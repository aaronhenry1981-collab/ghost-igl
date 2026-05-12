// EA Sports FC — gameplay phase strats.
// `attack` = possession / attacking play; `defense` = defending phase.
// Strats grounded in FUT Division Rivals + Champions meta (2026).

const STRATS = {
  "ultimate-team": {
    "rivals": {
      attack: {
        operators: [
          { name: "Mbappé (ST)", role: "Pace striker — finisher", priority: "essential" },
          { name: "Bellingham (CAM)", role: "Playmaker anchor", priority: "essential" },
          { name: "Vinícius Jr. (LW)", role: "5-star skiller", priority: "recommended" },
          { name: "Rodri (CDM)", role: "Defensive pivot", priority: "recommended" },
        ],
        strategy: "Division Rivals is the weekly grind to qualify for Champions (top weekly tournament). Pick a 4-2-3-1 wide or 4-3-3 formation. Play wide possession on attack — pass through the channels (between CBs and FBs), don't dribble through the center. Use L1 + button passes for through-balls; ground passes for build-up. Score from wide cut-backs (square + run + finesse shot with curve striker). Don't overplay — Rivals rewards efficient finishing, not flashy skills. Aim for 3 wins per session minimum; that's enough to earn Champions Qualifier points and FUT rewards.",
        callouts: ["L1 + Through Ball", "Square + Sprint Pass", "Cut-Back Cross", "Finesse Shot", "Driven Pass", "Skill Move (R1+R2)", "Possession Lock"],
        utility: [
          "L1 + Through Ball for runs behind defense",
          "R1 + Pass for fast ground build-up",
          "Square + Sprint for cross-back from byline",
          "Triangle + Pace striker for over-the-top long ball",
          "Skill Move R1+R2 (cut-inside) for 5-star strikers",
        ],
      },
      defense: {
        operators: [
          { name: "Van Dijk (CB)", role: "Defensive anchor", priority: "essential" },
          { name: "Rüdiger (CB)", role: "Aggressive CB", priority: "recommended" },
          { name: "Rodri (CDM)", role: "Defensive screen", priority: "essential" },
          { name: "Alisson (GK)", role: "Shot-stopper", priority: "recommended" },
        ],
        strategy: "Defending in Rivals is about staying compact and intercepting passes — not slide-tackling. Use Player Lock (R3) on your CDM to stay positioned. Manual select your CB with L1 + R-stick when opponent gets near box. Stand-up tackle (X / press button) instead of slide-tackle (Square). Block crosses with manual select on full-back. Don't dive into 1v1s with strikers — back off, force them to outside, let them lose the ball or shoot from bad angle. Goalkeepers in 2026 EAFC are unreliable on long shots — close down at 25 yards.",
        callouts: ["L1 + R-Stick CB Select", "X / Press Button", "L2 + Player Run", "Back-Off Defending", "Stand-Up Tackle", "Block Cross", "Shot Coverage"],
        utility: [
          "L1 + R-Stick to manually select CB",
          "X / Press button (stand-up tackle, no slide)",
          "L2 + Player Run for second-man defense pressure",
          "Back-off, force striker to outside",
          "Close down at 25 yards from goal",
        ],
      },
    },
    "champions": {
      attack: {
        operators: [
          { name: "Mbappé (ST)", role: "Pace striker", priority: "essential" },
          { name: "Vinícius Jr. (LW)", role: "5-star skiller", priority: "essential" },
          { name: "Bellingham (CAM)", role: "Playmaker anchor", priority: "recommended" },
          { name: "Theo Hernández (LB)", role: "Attacking FB", priority: "recommended" },
        ],
        strategy: "FUT Champions is the weekly top-tier tournament. 10-15 games over a weekend; rewards scale steeply. Run a high-press 4-3-3 with overlapping full-backs. Win games through pace + finishing efficiency — don't get cute with skills. Use Counter-Attack tactic on defensive plays. Build through the wings with overlap runs (R1 + R-stick toward winger), cross-back to onrushing CAM. Don't shoot from outside box — finesse shots only if striker has 5-star weak foot. Champions is mental: between games, take 5-minute breaks to stay sharp. Tilt-stack costs you 3+ wins per weekend.",
        callouts: ["Overlap Run (R1 + R-stick)", "Through Ball", "Finesse Shot", "Driven Cross", "5-Star Skill", "Counter-Attack Trigger", "L1+L1 (Custom Player Run)"],
        utility: [
          "L1 + R-stick toward winger for overlap run",
          "L1 + L1 (custom player run) for CAM late run",
          "Finesse shot only with 5-star weak foot",
          "Counter-Attack tactic on defensive turnover",
          "Cross-back to onrushing CAM from byline",
        ],
      },
      defense: {
        operators: [
          { name: "Van Dijk (CB)", role: "Defensive anchor", priority: "essential" },
          { name: "Saliba (CB)", role: "Composed CB", priority: "recommended" },
          { name: "Kanté (CDM)", role: "Holding Mid", priority: "essential" },
          { name: "Donnarumma (GK)", role: "Tall GK", priority: "recommended" },
        ],
        strategy: "Defending in Champions is about depth and width. Set depth to 65-75 (mid-line, not high). Width 50 (compact). Use Player Lock on your CB pairing. Manually select CB to step out on the long-ball attacker. Use jockey (L2) to back off and angle striker to wrong foot. Goalkeeper at 65+ rating handles 1v1 well — close down at 18 yards from goal. Custom tactic Constant Pressure off-ball (auto pressure) for the second half if losing.",
        callouts: ["Depth 65-75", "Width 50", "L2 Jockey", "Player Lock CB", "Drop to Defensive Stance", "Constant Pressure (Custom Tactic)"],
        utility: [
          "L2 jockey to back off + angle striker",
          "Manually CB step out on long ball",
          "Custom tactic Depth 65-75, Width 50",
          "Constant Pressure on losing half",
          "Close down 18 yards from goal",
        ],
      },
    },
    "kickoff-attack": {
      attack: {
        operators: [
          { name: "Mbappé (ST)", role: "Pace striker", priority: "essential" },
          { name: "Bellingham (CAM)", role: "Playmaker", priority: "essential" },
          { name: "Theo Hernández (LB)", role: "Overlapping FB", priority: "recommended" },
        ],
        strategy: "Build-up from kickoff: ball to CDM, lateral pass to CM, vertical pass through CAM. Don't long-ball from kickoff — opponent's CB pairing will intercept. Once ball is in CAM zone, look for the wing channel (Mbappé cut inside, FB overlap behind). At Pro level, kickoff sequence is muscle memory: 3 short passes, 1 vertical, then split decision (cross or through-ball). At lower elo, dribble through center occasionally — opponent doesn't track CAM run.",
        callouts: ["CDM Drop", "CAM Vertical", "Wing Channel", "Overlap Run", "Through Ball", "Finesse Shot Box"],
        utility: [
          "3 short passes to settle build-up rhythm",
          "Vertical pass to CAM through midfield",
          "Wing channel — LB/RB overlap behind winger",
          "Through-ball pace striker for split-decision",
        ],
      },
      defense: {
        operators: [
          { name: "Rodri (CDM)", role: "Defensive screen", priority: "essential" },
          { name: "Kanté (CDM)", role: "Interception screen", priority: "recommended" },
          { name: "Van Dijk (CB)", role: "Aerial CB", priority: "essential" },
        ],
        strategy: "Defending kickoff: CDM closes the central pass lane, CBs stay narrow. If opponent passes wide, full-back closes down with body angle (not slide). Force opponent to cross from byline. Cross defense: CB heads it clear (manual select with R-stick). After kickoff, force opponent to play back to GK — turn the game into a possession battle on YOUR terms.",
        callouts: ["CDM Press", "Narrow CBs", "Wide Press FB", "Body Angle (No Slide)", "Force Long Ball", "Force Back-Pass"],
        utility: [
          "CDM press central pass lane",
          "Narrow CBs (force wide play)",
          "Body angle full-back (don't slide)",
          "Manual CB header on crosses",
          "Force opponent to back-pass to GK",
        ],
      },
    },
    "final-third": {
      attack: {
        operators: [
          { name: "Mbappé (ST)", role: "Pace finisher", priority: "essential" },
          { name: "Vinícius Jr. (LW)", role: "5-star skiller", priority: "essential" },
          { name: "Bellingham (CAM)", role: "Cut-back receiver", priority: "recommended" },
          { name: "Theo Hernández (LB)", role: "Overlap to byline", priority: "recommended" },
        ],
        strategy: "Final third = where Rivals games are won. Standard scoring patterns: cut-back cross (LB to byline → cross-back to CAM late run for finesse shot), cut-inside skill (winger R1+R2 toward center, low driven shot), through-ball pace (CAM L1 + through-ball to striker run behind). Don't shoot from distance unless 5-star weak foot striker. Best finishing: 18-yard box, slight angle, driven shot or finesse if curve striker. Use AI-controlled runs (L1 + L1) to drag defenders out of position.",
        callouts: ["Cut-Back Cross", "Cut-Inside Shot", "Through-Ball Run", "Driven Shot", "Finesse Shot", "AI Player Run (L1 + L1)"],
        utility: [
          "Cut-back cross from byline (cross to onrushing CAM)",
          "Cut-inside skill move (R1+R2) for shot",
          "Through-ball pace striker run",
          "Driven shot from 18 yards angle",
          "AI Player Run (L1 + L1) drag defender",
        ],
      },
      defense: {
        operators: [
          { name: "Van Dijk (CB)", role: "Aerial CB", priority: "essential" },
          { name: "Rüdiger (CB)", role: "Aggressive CB", priority: "recommended" },
          { name: "Rodri (CDM)", role: "Box screen", priority: "essential" },
          { name: "Donnarumma (GK)", role: "Tall GK shot-stopper", priority: "recommended" },
        ],
        strategy: "Defending final third = the hardest skill. Stay compact in box (depth 55-65). Manually CB select on attacker entering box; jockey (L2) to back off and force shot to bad angle. Cross defense: CB head clear (manual select with R-stick). Don't slide-tackle in box — concedes penalty 80% of time. Force attacker to weak foot. GK position: 6 yards off line for crosses. Through-ball defense: CDM positioning + CB step-out coordinated.",
        callouts: ["L2 Jockey", "Manual CB Step-Out", "Header Clear", "No Slide in Box", "Block Cross", "GK Position 6 Yards"],
        utility: [
          "L2 jockey to back off attacker",
          "Manual CB step-out on box entry",
          "CB header clear on crosses (R-stick)",
          "Block cross from byline (full-back close down)",
          "Force striker to weak foot (body angle)",
        ],
      },
    },
    "set-pieces": {
      attack: {
        operators: [
          { name: "Trent Alexander-Arnold (RB)", role: "Free-kick taker", priority: "essential" },
          { name: "Van Dijk (CB)", role: "Aerial threat", priority: "essential" },
          { name: "Haaland (ST)", role: "Header threat", priority: "recommended" },
          { name: "Bellingham (CAM)", role: "Late runner", priority: "recommended" },
        ],
        strategy: "Set pieces are 2026 EAFC's most reliable scoring source. Corner setup: 2-3 aerial threats (Van Dijk, Haaland, Rüdiger) in box. Take corner with whipped delivery (Square hold-down + curl R-stick). Aim for back post — second-man header into goal mouth. Free kicks 25+ yards: aim for top corner with curve specialist (Trent). Inside box free kicks: low driven hit through wall corner.",
        callouts: ["Whipped Corner", "Back-Post Run", "Free-Kick Curve", "Wall Aim (Top Corner)", "Second-Man Header"],
        utility: [
          "Square + R-stick curl for whipped delivery",
          "Aim back post (defender harder to mark)",
          "Free-kick top corner with curve specialist",
          "Inside box: low driven through wall corner",
          "Second-man late header into goal mouth",
        ],
      },
      defense: {
        operators: [
          { name: "Van Dijk (CB)", role: "Aerial header clear", priority: "essential" },
          { name: "Donnarumma (GK)", role: "Tall GK punch", priority: "recommended" },
          { name: "Rodri (CDM)", role: "Box presence", priority: "recommended" },
        ],
        strategy: "Defending set pieces: man-mark the aerial threats. Set custom tactic 'Defensive Set Pieces' to 2 men on near post + 2 zonal. Manual CB select on the corner attacker (R-stick to player). GK punches crosses (X button) instead of catching. After clearance, full-back rotates wide to attack the counter.",
        callouts: ["Man-Mark Aerial", "GK Punch (X)", "Manual CB Header", "Counter From Clearance"],
        utility: [
          "Man-mark Van Dijk-level aerial threats",
          "GK X button to punch (don't catch)",
          "Manual CB header with R-stick",
          "Full-back rotates wide on clearance for counter",
          "Set 'Defensive Set Pieces' to 2 men on near post",
        ],
      },
    },
  },
}

export default STRATS
