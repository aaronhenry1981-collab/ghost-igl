// League of Legends — meta champion catalog (May 2026).
// `side` follows the LoL "Blue Side" (attack — bottom-left) / "Red Side"
// (defense — top-right) convention. Most champions are flex picks; side
// is set to the meta context where they're most often played.

const CAST = [
  // TOP LANE
  { name: "Garen", side: "defense", role: "Top Tank — Conqueror bruiser, point-and-click silence, sustain through Q + W passive" },
  { name: "Darius", side: "attack", role: "Top Bruiser — 5-stack hemorrhage execute, all-in level 1 with W slow + Q pull" },
  { name: "Sett", side: "attack", role: "Top Bruiser — W true damage execute, R displacement engage tool" },
  { name: "Camille", side: "attack", role: "Top Diver — E hookshot engage, R isolate carry, mid-game spike kit" },
  { name: "Fiora", side: "attack", role: "Top Skirmisher — vital duelist, true damage Q + W parry, 1v1 monster" },
  { name: "Ornn", side: "defense", role: "Top Tank — team-wide passive items, R global slow + engage knockup" },
  { name: "Malphite", side: "defense", role: "Top Tank — R AoE knockup engage, AP scaling burst, anti-AD passive" },

  // JUNGLE
  { name: "Lee Sin", side: "attack", role: "Jungle Diver — Q→insec carry kick, early-game ganker, falls off after 20 min" },
  { name: "Kha'Zix", side: "attack", role: "Jungle Assassin — isolation passive Q, R invisibility, picks squishies" },
  { name: "Hecarim", side: "attack", role: "Jungle Bruiser — E run-down knockback, R fear engage, AoE damage from movement speed" },
  { name: "Vi", side: "attack", role: "Jungle Diver — R lock-on ult, point-and-click target access, builds tank-bruiser" },
  { name: "Sejuani", side: "defense", role: "Jungle Tank — R AoE stun engage, frostbite passive shred, team-wide CC" },
  { name: "Bel'Veth", side: "attack", role: "Jungle Skirmisher — true damage Q, attack speed scaling, late-game monster" },

  // MID LANE
  { name: "Yasuo", side: "attack", role: "Mid Skirmisher — wind wall blocks projectiles, R knockup combo, crit scaling" },
  { name: "Ahri", side: "attack", role: "Mid Burst Mage — charm CC, R triple-dash mobility, roams to side lanes" },
  { name: "Zed", side: "attack", role: "Mid Assassin — shadow clone deception, R mark execute, snowball champion" },
  { name: "Syndra", side: "attack", role: "Mid Burst Mage — point-and-click stun, R orb execute, late-game 1-shot threat" },
  { name: "Sylas", side: "attack", role: "Mid Bruiser — steals enemy ult with R, sustain through W, picks 1-shot ults" },
  { name: "Akali", side: "attack", role: "Mid Assassin — invisibility shroud, R double-cast execute, snowball champion" },
  { name: "Orianna", side: "defense", role: "Mid Control Mage — ball management, R AoE pull-and-damage engage, team-fight queen" },

  // ADC (BOT LANE CARRY)
  { name: "Jhin", side: "attack", role: "ADC Marksman — 4-shot reload, R sniper execute, late-game 1-shot crit damage" },
  { name: "Jinx", side: "attack", role: "ADC Marksman — passive movement speed on kill, R global execute, hyper-carry scaling" },
  { name: "Caitlyn", side: "attack", role: "ADC Marksman — longest auto range, trap setup, lane bully early game" },
  { name: "Kai'Sa", side: "attack", role: "ADC Marksman — evolution passive, R dash gap-closer, hybrid AP/AD scaling" },
  { name: "Aphelios", side: "attack", role: "ADC Marksman — 5-weapon rotation, no Q/W/E (gun-determined), late-game DPS monster" },

  // SUPPORT
  { name: "Lulu", side: "defense", role: "Enchanter Support — W ally polymorph/peel, R ally HP burst, scales hyper-carry" },
  { name: "Thresh", side: "defense", role: "Support Engage — Q hook engage, lantern save, soul-stacking armor/AP" },
  { name: "Nautilus", side: "defense", role: "Support Engage — point-and-click R lock-on, Q pull engage, anti-dive peel" },
  { name: "Janna", side: "defense", role: "Enchanter Support — disengage queen, E shield + AD boost, R AoE knockback heal" },
  { name: "Pyke", side: "attack", role: "Support Assassin — R execute heals team gold, Q pull engage, roams mid-jungle" },
  { name: "Leona", side: "defense", role: "Support Engage — point-and-click R lock-on, E gap-closer, tankiest engage support" },
  { name: "Senna", side: "attack", role: "Support Marksman — heals + scaling soul collection, R global execute, hybrid carry/support" },
]

export default CAST
