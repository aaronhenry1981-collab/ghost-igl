// Counter-Strike 2 — must-pick weapon + utility loadouts per map per side.
// CS2 has no character ban phase; this file replaces bans.js for the CS2
// game data shape. Per-map list of weapons / utility you cannot skip.

const PICKS = {
  "mirage": {
    attack: [
      { name: "AK-47", reason: "T-side rifle, one-shot headshot. Mandatory full-buy on every gun round." },
      { name: "Window smoke", reason: "Smoking CT Window denies the AWPer's most dangerous mid pick angle. Zero-cost mid control." },
      { name: "Apps molotov (B exec)", reason: "Bench molly clears the default B anchor and forces a 6-second utility trade." },
    ],
    defense: [
      { name: "AWP", reason: "Mirage is AWP-defining — Jungle hold from CT spawn wins more rounds than any other CT setup." },
      { name: "M4A1-S", reason: "Connector and Apps holds reward the silenced one-tap; M4A4 acceptable but A1-S is preferred at the level." },
      { name: "Stairs molotov (A hold)", reason: "Standard CT Stairs molly delays the A take and forces a re-smoke from the Ts." },
    ],
  },
  "inferno": {
    attack: [
      { name: "AK-47", reason: "Mandatory T rifle for Banana and A site executes — both sites reward one-tap rifling at distance." },
      { name: "Banana molotov", reason: "Standard T-side Banana molly clears CT pre-aim spots and unlocks the choke. Single most-thrown utility on Inferno." },
      { name: "Library smoke (A exec)", reason: "Without Library smoke, the CT AWP holds Pit indefinitely — one-way smoke is non-negotiable." },
    ],
    defense: [
      { name: "AWP", reason: "Banana and Pit AWP angles win Inferno rounds; A-default AWP holds the Long sightline by itself." },
      { name: "New Box molotov (B hold)", reason: "New Box molly + CT mid AWP is the textbook Inferno B hold. Burn it on every executed round." },
      { name: "CT Banana molotov", reason: "Forces the T-side Banana take to commit two utility instead of one — economy lever." },
    ],
  },
  "anubis": {
    attack: [
      { name: "AK-47", reason: "Long sightlines on both sites reward consistent rifle play; Anubis A take is rifle-heavy." },
      { name: "Connector smoke (A exec)", reason: "Connector smoke isolates Heaven from Default — without it, the Heaven AWP shuts down every A take." },
      { name: "Walkway flash (B exec)", reason: "Standard pop-flash to blind Heaven rotator on the B hit. Mandatory for the Bridge take." },
    ],
    defense: [
      { name: "AWP", reason: "Heaven and Bridge AWP angles define Anubis CT — rifle anchors lose without the AWP trade." },
      { name: "Mid molotov (early hold)", reason: "Mid molly delays the standard T-side Mid takeover by 4-5 seconds, opens room for the rotate." },
      { name: "Defuse kit", reason: "Anubis post-plants on both sites favor 5-second defuses; the kit gap is round-deciding." },
    ],
  },
  "nuke": {
    attack: [
      { name: "AK-47", reason: "Outside takeover and ramp peeks reward the AK's one-tap; M4A4 trade is fine on Outside ramp." },
      { name: "Hut smoke (A exec)", reason: "Hut smoke blocks the Heaven trade angle — without it, every A take collapses on the cross." },
      { name: "Vent flashbang (B exec)", reason: "Pop-flash on the Vent drop blinds the Default anchor; mandatory for any B exec into Lobby/Vent." },
    ],
    defense: [
      { name: "AWP", reason: "Heaven AWP holds A site by itself; Outside AWP from CT controls the ramp pre-utility." },
      { name: "Outside molotov", reason: "Round-opening Outside molly delays Outside takeover by 6+ seconds — economy lever." },
      { name: "Vent peek setup", reason: "CT Vent peek into B catches drops; mandatory for the Lobby-stacked round." },
    ],
  },
  "ancient": {
    attack: [
      { name: "AK-47", reason: "Donut and Tunnel choke fights reward the rifle one-tap; Ancient is an aim map." },
      { name: "Donut smoke (A exec)", reason: "Donut smoke blocks the Heaven trade and isolates the anchor; without it, A take collapses." },
      { name: "Tunnel smoke (B exec)", reason: "Tunnel smoke on B exec is a fade — pre-aim Default common as the smoke fades." },
    ],
    defense: [
      { name: "AWP", reason: "Donut AWP from Heaven holds the choke; Lane AWP from CT denies Tunnel pushes solo." },
      { name: "M4A1-S", reason: "Cave and Pillar holds reward the silenced one-tap; off-angle pre-aim wins more than M4A4 spam." },
      { name: "Mid molotov", reason: "Mid molly cycle delays the standard Mid takeover by 4-5 seconds; primary economy lever." },
    ],
  },
  "vertigo": {
    attack: [
      { name: "AK-47", reason: "Ramp peeks and Stairs takes reward the AK one-tap at close range." },
      { name: "Sandbags smoke (A exec)", reason: "Without Sandbags smoke, Ramp peek is suicide — the Heaven AWP locks the angle." },
      { name: "Catwalk smoke (B exec)", reason: "Catwalk smoke isolates the rotator from Site; mandatory for any B Stairs+Generator double-take." },
    ],
    defense: [
      { name: "AWP", reason: "Ramp AWP from Heaven defines Vertigo A — rifle anchor at A loses without the AWP trade." },
      { name: "Ramp molotov", reason: "Ramp molly cycle delays the A take by 5+ seconds; primary economy lever on Vertigo." },
      { name: "Catwalk molotov", reason: "Catwalk molly forces the B take to commit smokes early; flips the round economy." },
    ],
  },
  "dust2": {
    attack: [
      { name: "AK-47", reason: "Long peeks and Tunnel takes reward the AK one-tap at all distances; Dust 2 is rifle-defining." },
      { name: "CT smoke + Pit smoke (A exec)", reason: "Double smoke for A Long take is the textbook exec; without both, AWP picks the lane." },
      { name: "Tunnel smoke (B exec)", reason: "Tunnel smoke isolates Plat anchor; standard for any executed B take." },
    ],
    defense: [
      { name: "AWP", reason: "Long AWP defines Dust 2 — every CT round routes through the Long pick or trade." },
      { name: "Cat molotov", reason: "Cat molly delays the Mid takeover and the Cat-to-A drop; primary CT utility." },
      { name: "Plat molotov (B hold)", reason: "Plat molly cycle on B forces the T side to over-commit utility on the take." },
    ],
  },
  "train": {
    attack: [
      { name: "AK-47", reason: "Halls peeks and Z connector trades reward the AK one-tap; Train is an aim-heavy map." },
      { name: "Pop Dog smoke (A exec)", reason: "Pop Dog smoke blocks the Z connector trade; mandatory for any A take." },
      { name: "Headshot Box smoke (B exec)", reason: "Headshot Box smoke isolates the Upper anchor; required for the Lower drop B take." },
    ],
    defense: [
      { name: "AWP", reason: "Halls AWP from Heaven holds A by itself; Headshot Box AWP from Ivy locks B." },
      { name: "Ivy molotov", reason: "Ivy molly cycle delays the standard B take by 4-5 seconds; primary economy lever." },
      { name: "Pop Dog molotov", reason: "Pop Dog molly delays the A take and forces the smoke commit; CT economy lever." },
    ],
  },
}

export default PICKS
