// Halo Infinite — must-pick weapon + setup loadouts per map per side.
// Halo has no character bans; this replaces bans.js with weapon priorities.

const PICKS = {
  "aquarius": {
    attack: [
      { name: "BR75 Battle Rifle", reason: "Aquarius is BR-defining — every gunfight at any range routes through the BR." },
      { name: "Sniper Rifle (power weapon)", reason: "Aquarius long sightlines reward the Sniper pickup; control the spawn timing." },
      { name: "Plasma Grenade (anchor sticky)", reason: "Plasma stick on contested choke + Frag chain denies the standard anchor on every push." },
    ],
    defense: [
      { name: "BR75 Battle Rifle", reason: "BR is the universal hold weapon — anchor positions all over Aquarius reward consistent BR play." },
      { name: "Power weapon denial setup", reason: "Aquarius power weapon spawns rotate every 60-120s; deny the pickup with grenade arc + cross-fire." },
      { name: "Drop Wall + Threat Sensor", reason: "Drop Wall on the choke + Threat Sensor on push read covers most Aquarius hold setups." },
    ],
  },
  "live-fire": {
    attack: [
      { name: "BR75 Battle Rifle", reason: "Live Fire is BR-defining — every gunfight at any range routes through the BR." },
      { name: "Sniper Rifle (power weapon)", reason: "Live Fire long sightlines reward the Sniper pickup; control the spawn timing." },
      { name: "Plasma Grenade (anchor sticky)", reason: "Plasma stick on contested choke + Frag chain denies the standard anchor on every push." },
    ],
    defense: [
      { name: "BR75 Battle Rifle", reason: "BR is the universal hold weapon — anchor positions all over Live Fire reward consistent BR play." },
      { name: "Power weapon denial setup", reason: "Live Fire power weapon spawns rotate every 60-120s; deny the pickup with grenade arc + cross-fire." },
      { name: "Drop Wall + Threat Sensor", reason: "Drop Wall on the choke + Threat Sensor on push read covers most Live Fire hold setups." },
    ],
  },
  "recharge": {
    attack: [
      { name: "BR75 Battle Rifle", reason: "Recharge is BR-defining — every gunfight at any range routes through the BR." },
      { name: "Sniper Rifle (power weapon)", reason: "Recharge long sightlines reward the Sniper pickup; control the spawn timing." },
      { name: "Plasma Grenade (anchor sticky)", reason: "Plasma stick on contested choke + Frag chain denies the standard anchor on every push." },
    ],
    defense: [
      { name: "BR75 Battle Rifle", reason: "BR is the universal hold weapon — anchor positions all over Recharge reward consistent BR play." },
      { name: "Power weapon denial setup", reason: "Recharge power weapon spawns rotate every 60-120s; deny the pickup with grenade arc + cross-fire." },
      { name: "Drop Wall + Threat Sensor", reason: "Drop Wall on the choke + Threat Sensor on push read covers most Recharge hold setups." },
    ],
  },
  "streets": {
    attack: [
      { name: "BR75 Battle Rifle", reason: "Streets is BR-defining — every gunfight at any range routes through the BR." },
      { name: "Sniper Rifle (power weapon)", reason: "Streets long sightlines reward the Sniper pickup; control the spawn timing." },
      { name: "Plasma Grenade (anchor sticky)", reason: "Plasma stick on contested choke + Frag chain denies the standard anchor on every push." },
    ],
    defense: [
      { name: "BR75 Battle Rifle", reason: "BR is the universal hold weapon — anchor positions all over Streets reward consistent BR play." },
      { name: "Power weapon denial setup", reason: "Streets power weapon spawns rotate every 60-120s; deny the pickup with grenade arc + cross-fire." },
      { name: "Drop Wall + Threat Sensor", reason: "Drop Wall on the choke + Threat Sensor on push read covers most Streets hold setups." },
    ],
  },
  "bazaar": {
    attack: [
      { name: "BR75 Battle Rifle", reason: "Bazaar is BR-defining — every gunfight at any range routes through the BR." },
      { name: "Sniper Rifle (power weapon)", reason: "Bazaar long sightlines reward the Sniper pickup; control the spawn timing." },
      { name: "Plasma Grenade (anchor sticky)", reason: "Plasma stick on contested choke + Frag chain denies the standard anchor on every push." },
    ],
    defense: [
      { name: "BR75 Battle Rifle", reason: "BR is the universal hold weapon — anchor positions all over Bazaar reward consistent BR play." },
      { name: "Power weapon denial setup", reason: "Bazaar power weapon spawns rotate every 60-120s; deny the pickup with grenade arc + cross-fire." },
      { name: "Drop Wall + Threat Sensor", reason: "Drop Wall on the choke + Threat Sensor on push read covers most Bazaar hold setups." },
    ],
  },
  "solitude": {
    attack: [
      { name: "BR75 Battle Rifle", reason: "Solitude is BR-defining — every gunfight at any range routes through the BR." },
      { name: "Sniper Rifle (power weapon)", reason: "Solitude long sightlines reward the Sniper pickup; control the spawn timing." },
      { name: "Plasma Grenade (anchor sticky)", reason: "Plasma stick on contested choke + Frag chain denies the standard anchor on every push." },
    ],
    defense: [
      { name: "BR75 Battle Rifle", reason: "BR is the universal hold weapon — anchor positions all over Solitude reward consistent BR play." },
      { name: "Power weapon denial setup", reason: "Solitude power weapon spawns rotate every 60-120s; deny the pickup with grenade arc + cross-fire." },
      { name: "Drop Wall + Threat Sensor", reason: "Drop Wall on the choke + Threat Sensor on push read covers most Solitude hold setups." },
    ],
  },
  "empyrean": {
    attack: [
      { name: "BR75 Battle Rifle", reason: "Empyrean is BR-defining — every gunfight at any range routes through the BR." },
      { name: "Sniper Rifle (power weapon)", reason: "Empyrean long sightlines reward the Sniper pickup; control the spawn timing." },
      { name: "Plasma Grenade (anchor sticky)", reason: "Plasma stick on contested choke + Frag chain denies the standard anchor on every push." },
    ],
    defense: [
      { name: "BR75 Battle Rifle", reason: "BR is the universal hold weapon — anchor positions all over Empyrean reward consistent BR play." },
      { name: "Power weapon denial setup", reason: "Empyrean power weapon spawns rotate every 60-120s; deny the pickup with grenade arc + cross-fire." },
      { name: "Drop Wall + Threat Sensor", reason: "Drop Wall on the choke + Threat Sensor on push read covers most Empyrean hold setups." },
    ],
  },
}

export default PICKS
