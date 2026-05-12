// Tekken 8 — character archetypes and meta picks for ranked.
// `side` attack = aggressor / pressure character; defense = whiff-punish / counter-hit.
// 2026 ranked meta — top picks at Tekken King and above.

const CAST = [
  // MISHIMAS (Electric + Heat pressure)
  { name: "Kazuya", side: "attack", role: "Mishima — Electric mix-up, Heat pressure, hellsweep into uppercut launcher" },
  { name: "Heihachi", side: "attack", role: "Mishima — Electric Wind God Fist (EWGF) into launcher, classic mix-up game" },
  { name: "Reina", side: "attack", role: "Mishima Newcomer — Wind God Step Lite + Senjutsu stance pressure" },
  { name: "Devil Jin", side: "attack", role: "Mishima Variant — Laser sweep, Mishima mix-up + air mobility" },

  // PRESSURE / RUSHDOWN
  { name: "Hwoarang", side: "attack", role: "Stance Pressure — multiple stance transitions, kick mix-ups, oki specialist" },
  { name: "Lars", side: "attack", role: "Rushdown — Dynamic Entry stance, ranged pokes, easy Heat-burst combos" },
  { name: "Steve", side: "attack", role: "Boxer — Flicker stance, mid-range counter-hit, frame-trap pressure" },
  { name: "Bryan", side: "attack", role: "Mid-Range Pressure — Taunt setup, Snake Edge, counter-hit launcher game" },

  // GRAPPLERS
  { name: "King", side: "attack", role: "Grappler — Chain throws (Rolling Death Cradle), oki mix-ups, command grab mix" },
  { name: "Marduk", side: "attack", role: "Grappler — Knee mix-ups, Anaconda throw, brawler pressure" },
  { name: "Kuma", side: "attack", role: "Grappler — Hunting Bear stance, fart-cancel mind games" },

  // ZONERS / SPACING
  { name: "Yoshimitsu", side: "attack", role: "Mix-Up / Stance — Manji stance, sword pokes, suicide unblockable" },
  { name: "Eddy Gordo", side: "attack", role: "Capoeira Stance — multi-string pressure, low/high mix" },
  { name: "Lili", side: "defense", role: "Spacing — Whiff-punish queen, sidestep specialist, footsie game" },
  { name: "Nina", side: "attack", role: "Assassin — Command grabs + frame traps, blonde bombshell mix-up" },

  // ALL-ROUNDER / BEGINNER-FRIENDLY
  { name: "Jin", side: "attack", role: "All-Rounder — Sword Stance, electric launchers, balanced kit" },
  { name: "Paul", side: "attack", role: "Damage Striker — Deathfist (qcf+2), high-damage launchers, easy combo execution" },
  { name: "Lee", side: "attack", role: "Mishima Variant — fast kicks, Hitman stance, frame-perfect mix-ups" },
  { name: "Lars (alt)", side: "attack", role: "All-Rounder Lars — easy combos, strong pokes, beginner pick" },

  // DEFENSIVE / COUNTER
  { name: "Asuka", side: "defense", role: "Defensive Counter — Parry game, sidestep punisher, reactive defense" },
  { name: "Jun", side: "defense", role: "Mid-Range Defender — Genjitsu Stance, parry kicks, defensive whiff-punish" },
  { name: "Anna", side: "defense", role: "Counter-Hit — high-low mix-up, gunshot zoning, defensive whiff-punish" },

  // HEAT-FOCUSED (TEKKEN 8 NEW MECHANIC)
  { name: "Azucena", side: "attack", role: "Heat Burst Specialist — Libertador stance, mix-up pressure into Heat" },
  { name: "Victor", side: "attack", role: "Sword & Gun — long-range pokes, parry, sword counter-hits" },
]

export default CAST
