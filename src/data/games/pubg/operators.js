// PUBG: Battlegrounds — squad role archetypes for ranked 4-stack play.
// `side` attack = engagement / fragging roles; defense = sustain / lurk roles.

const CAST = [
  // SQUAD ROLES
  { name: "IGL / Caller", side: "attack", role: "Squad shotcaller — drop, rotation, engagement calls. Reads circle + 3rd-party timing" },
  { name: "Fragger", side: "attack", role: "Entry duels, top-K player. AR + close-range; gets first kills in fight" },
  { name: "Sniper", side: "defense", role: "Long-range pick-off. Kar98 / SLR / Mk14; covers squad from elevated angle" },
  { name: "Support", side: "defense", role: "Heals, smokes, revives. Drops boost items for fragger; mid-range backup" },
  { name: "Scout", side: "attack", role: "Recon + grenade lineups. Spots enemies, flashes corners, identifies 3rd parties" },
  { name: "Anchor", side: "defense", role: "Holds the compound. Defensive position; covers exit routes" },

  // WEAPON ARCHETYPES (as "operators")
  { name: "M416", side: "attack", role: "Versatile AR — full-auto + burst, mid-range king. Universal pick" },
  { name: "AKM", side: "attack", role: "High-damage AR — heavy recoil but 2-shot kill. Close-mid range" },
  { name: "Beryl M762", side: "attack", role: "Highest-damage AR — strongest 5.56 caliber. Heavy recoil, mid-range" },
  { name: "Groza", side: "attack", role: "Care Package AR — fastest fire-rate, 7.62. Best AR in game (drop only)" },
  { name: "SCAR-L", side: "attack", role: "Low-recoil AR — beginner-friendly, mid-range" },

  // SNIPERS
  { name: "Kar98k", side: "defense", role: "Bolt-action sniper — 1-shot headshot with helmet level 2" },
  { name: "Mosin", side: "defense", role: "Bolt-action sniper — 1-shot headshot, semi-rare drop" },
  { name: "AWM", side: "defense", role: "Care Package sniper — 1-shot headshot at any helmet level" },
  { name: "SLR", side: "defense", role: "Semi-auto marksman — fast follow-up shots, 7.62 caliber" },
  { name: "Mk14", side: "defense", role: "Care Package DMR — semi/full-auto, highest DMR damage" },

  // SMG / SHOTGUN
  { name: "Uzi", side: "attack", role: "SMG — fastest fire-rate, close-range duel" },
  { name: "UMP45", side: "attack", role: "SMG — versatile mid-range, low recoil" },
  { name: "P90", side: "attack", role: "SMG — 50-round mag, high DPS close-range" },
  { name: "S686", side: "attack", role: "Shotgun — double-barrel close kill, instant breach" },

  // PISTOLS / UTILITY
  { name: "Frag Grenade", side: "attack", role: "Utility — area damage; clear corner / building" },
  { name: "Smoke Grenade", side: "defense", role: "Utility — vision block for revive cycle or escape" },
  { name: "Stun Grenade", side: "attack", role: "Utility — blind enemy at engagement range" },
  { name: "Boost Item Stack", side: "defense", role: "Painkillers / Energy Drink / Adrenaline — boost gauge for HP regen" },
]

export default CAST
