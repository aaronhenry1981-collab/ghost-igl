// EA Sports FC — formation slots + meta player archetypes by position.
// "side" attack = possession-side roles; defense = defending roles.
// Player names are the most-used 2026 meta picks at high Rivals/Champions ranks.

const CAST = [
  // FORWARDS / STRIKERS
  { name: "Mbappé (ST)", side: "attack", role: "Striker — pace + finishing; 5-star skills; meta wing-cutting inside runs" },
  { name: "Haaland (ST)", side: "attack", role: "Target Striker — strength + finishing; head-tap from crosses, hold-up play" },
  { name: "Vinícius Jr. (LW/ST)", side: "attack", role: "Inside Forward — pace + dribbling; cut-back finisher, 5-star skills" },
  { name: "Salah (RW)", side: "attack", role: "Right Inside Forward — finishing curve, fakes the cut-back" },

  // ATTACKING MIDFIELDERS
  { name: "Bellingham (CAM)", side: "attack", role: "Attacking Mid — balance + passing + finishing; meta 4-2-3-1 anchor" },
  { name: "De Bruyne (CAM)", side: "attack", role: "Playmaker — vision + crossing; through-ball machine" },
  { name: "Musiala (CAM)", side: "attack", role: "Mobile CAM — agility + dribbling; cut inside fakes" },

  // CENTRAL MIDFIELDERS
  { name: "Rodri (CM/CDM)", side: "defense", role: "Defensive Mid — interceptions + passing; meta pivot for any 4-1-2-1-2" },
  { name: "Pedri (CM)", side: "attack", role: "Box-to-box CM — passing + balance; possession metronome" },
  { name: "Bellingham (CM alt)", side: "attack", role: "Driving CM — late runs into box; meta vs counter-attack" },
  { name: "Kanté (CDM)", side: "defense", role: "Holding Mid — interceptions + tackling; defensive screen" },

  // WINGERS
  { name: "Saka (LW/RW)", side: "attack", role: "Pace + dribbling winger; meta cut-inside on R1+R2" },

  // FULL-BACKS
  { name: "Theo Hernández (LB)", side: "attack", role: "Attacking LB — overlap runs, crossing accuracy" },
  { name: "Trent Alexander-Arnold (RB)", side: "attack", role: "Attacking RB — crossing + passing; can play CM as well" },
  { name: "Davies (LB)", side: "attack", role: "Pace LB — overlapping runs, recovery defending" },
  { name: "Hakimi (RB)", side: "attack", role: "Pace RB — overlap pace, defensive positioning weaker" },

  // CENTER BACKS
  { name: "Van Dijk (CB)", side: "defense", role: "Defensive Anchor — pace + strength + interceptions; meta CB pairing" },
  { name: "Rüdiger (CB)", side: "defense", role: "Aggressive CB — pace + tackling; man-marks strikers" },
  { name: "Saliba (CB)", side: "defense", role: "Composed CB — passing + defending; ball-playing distributor" },
  { name: "Marquinhos (CB)", side: "defense", role: "Balanced CB — composed defending + sharp passing" },

  // GOALKEEPERS
  { name: "Ederson (GK)", side: "defense", role: "Sweeper Keeper — distribution + reflexes; build-out support" },
  { name: "Alisson (GK)", side: "defense", role: "Shot-Stopper — reflexes + handling; meta vs through-balls" },
  { name: "Donnarumma (GK)", side: "defense", role: "Tall GK — reach + diving + shot-stopping; FUT meta pick" },

  // FORMATION ARCHETYPES (still tracked for the formation-pick layer)
  { name: "4-3-3 Attack", side: "attack", role: "High-Press Formation — 3 forwards, balanced midfield, attacking full-backs" },
  { name: "4-2-3-1 Wide", side: "attack", role: "Possession Formation — CAM playmaker anchor, 2 CDMs hold shape" },
  { name: "4-4-2 Flat", side: "defense", role: "Counter-Attack Formation — 2 banks of 4, fast forwards on counter" },
  { name: "5-3-2", side: "defense", role: "Park-the-Bus Formation — 3 CBs, 2 wing-backs, defensive shell" },
]

export default CAST
