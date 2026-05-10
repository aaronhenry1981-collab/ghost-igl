// Call of Duty — must-pick weapon + utility loadouts per map per side.
// Replaces bans.js — CoD has no character bans.

const PICKS = {
  "rebirth-island": {
    attack: [
      { name: "Assault Rifle (mid-range loadout)", reason: "Rebirth Island mid-range engagements reward the AR — primary loadout for any push commit." },
      { name: "SMG (entry loadout)", reason: "Rebirth Island POI fights at close range; SMG Rusher takes first frag in any building contest." },
      { name: "Stun Grenade + Smoke", reason: "Rebirth Island pushes commit on Stun + Smoke combo — denies the anchor's pre-aim and breaks line of sight." },
    ],
    defense: [
      { name: "Assault Rifle (anchor loadout)", reason: "AR is the universal hold weapon — anchor positions on Rebirth Island all reward consistent AR play." },
      { name: "Sniper / Marksman (long sightline)", reason: "Rebirth Island long sightlines reward the Sniper pickup; off-angle is round-decider on contested zones." },
      { name: "Claymore + Trophy System", reason: "Claymore on entry + Trophy on mid-room covers most Rebirth Island hold setups against grenade + rush attempts." },
    ],
  },
  "verdansk": {
    attack: [
      { name: "Assault Rifle (mid-range loadout)", reason: "Verdansk mid-range engagements reward the AR — primary loadout for any push commit." },
      { name: "SMG (entry loadout)", reason: "Verdansk POI fights at close range; SMG Rusher takes first frag in any building contest." },
      { name: "Stun Grenade + Smoke", reason: "Verdansk pushes commit on Stun + Smoke combo — denies the anchor's pre-aim and breaks line of sight." },
    ],
    defense: [
      { name: "Assault Rifle (anchor loadout)", reason: "AR is the universal hold weapon — anchor positions on Verdansk all reward consistent AR play." },
      { name: "Sniper / Marksman (long sightline)", reason: "Verdansk long sightlines reward the Sniper pickup; off-angle is round-decider on contested zones." },
      { name: "Claymore + Trophy System", reason: "Claymore on entry + Trophy on mid-room covers most Verdansk hold setups against grenade + rush attempts." },
    ],
  },
  "skidrow": {
    attack: [
      { name: "Assault Rifle (mid-range loadout)", reason: "Skidrow (MW3 6v6) mid-range engagements reward the AR — primary loadout for any push commit." },
      { name: "SMG (entry loadout)", reason: "Skidrow (MW3 6v6) chokes are SMG range — Rusher with Dead Silence wins the mid take." },
      { name: "Stun Grenade + Smoke", reason: "Skidrow (MW3 6v6) pushes commit on Stun + Smoke combo — denies the anchor's pre-aim and breaks line of sight." },
    ],
    defense: [
      { name: "Assault Rifle (anchor loadout)", reason: "AR is the universal hold weapon — anchor positions on Skidrow (MW3 6v6) all reward consistent AR play." },
      { name: "Sniper / Marksman (long sightline)", reason: "Skidrow (MW3 6v6) long sightlines reward the Sniper pickup; off-angle is round-decider on contested zones." },
      { name: "Claymore + Trophy System", reason: "Claymore on entry + Trophy on mid-room covers most Skidrow (MW3 6v6) hold setups against grenade + rush attempts." },
    ],
  },
  "highrise": {
    attack: [
      { name: "Assault Rifle (mid-range loadout)", reason: "Highrise (MW3 6v6) mid-range engagements reward the AR — primary loadout for any push commit." },
      { name: "SMG (entry loadout)", reason: "Highrise (MW3 6v6) chokes are SMG range — Rusher with Dead Silence wins the mid take." },
      { name: "Stun Grenade + Smoke", reason: "Highrise (MW3 6v6) pushes commit on Stun + Smoke combo — denies the anchor's pre-aim and breaks line of sight." },
    ],
    defense: [
      { name: "Assault Rifle (anchor loadout)", reason: "AR is the universal hold weapon — anchor positions on Highrise (MW3 6v6) all reward consistent AR play." },
      { name: "Sniper / Marksman (long sightline)", reason: "Highrise (MW3 6v6) long sightlines reward the Sniper pickup; off-angle is round-decider on contested zones." },
      { name: "Claymore + Trophy System", reason: "Claymore on entry + Trophy on mid-room covers most Highrise (MW3 6v6) hold setups against grenade + rush attempts." },
    ],
  },
  "terminal": {
    attack: [
      { name: "Assault Rifle (mid-range loadout)", reason: "Terminal (MW3 6v6) mid-range engagements reward the AR — primary loadout for any push commit." },
      { name: "SMG (entry loadout)", reason: "Terminal (MW3 6v6) chokes are SMG range — Rusher with Dead Silence wins the mid take." },
      { name: "Stun Grenade + Smoke", reason: "Terminal (MW3 6v6) pushes commit on Stun + Smoke combo — denies the anchor's pre-aim and breaks line of sight." },
    ],
    defense: [
      { name: "Assault Rifle (anchor loadout)", reason: "AR is the universal hold weapon — anchor positions on Terminal (MW3 6v6) all reward consistent AR play." },
      { name: "Sniper / Marksman (long sightline)", reason: "Terminal (MW3 6v6) long sightlines reward the Sniper pickup; off-angle is round-decider on contested zones." },
      { name: "Claymore + Trophy System", reason: "Claymore on entry + Trophy on mid-room covers most Terminal (MW3 6v6) hold setups against grenade + rush attempts." },
    ],
  },
  "rust": {
    attack: [
      { name: "Assault Rifle (mid-range loadout)", reason: "Rust (MW3 6v6) mid-range engagements reward the AR — primary loadout for any push commit." },
      { name: "SMG (entry loadout)", reason: "Rust (MW3 6v6) chokes are SMG range — Rusher with Dead Silence wins the mid take." },
      { name: "Stun Grenade + Smoke", reason: "Rust (MW3 6v6) pushes commit on Stun + Smoke combo — denies the anchor's pre-aim and breaks line of sight." },
    ],
    defense: [
      { name: "Assault Rifle (anchor loadout)", reason: "AR is the universal hold weapon — anchor positions on Rust (MW3 6v6) all reward consistent AR play." },
      { name: "Sniper / Marksman (long sightline)", reason: "Rust (MW3 6v6) long sightlines reward the Sniper pickup; off-angle is round-decider on contested zones." },
      { name: "Claymore + Trophy System", reason: "Claymore on entry + Trophy on mid-room covers most Rust (MW3 6v6) hold setups against grenade + rush attempts." },
    ],
  },
  "karachi": {
    attack: [
      { name: "Assault Rifle (mid-range loadout)", reason: "Karachi (MW3 6v6) mid-range engagements reward the AR — primary loadout for any push commit." },
      { name: "SMG (entry loadout)", reason: "Karachi (MW3 6v6) chokes are SMG range — Rusher with Dead Silence wins the mid take." },
      { name: "Stun Grenade + Smoke", reason: "Karachi (MW3 6v6) pushes commit on Stun + Smoke combo — denies the anchor's pre-aim and breaks line of sight." },
    ],
    defense: [
      { name: "Assault Rifle (anchor loadout)", reason: "AR is the universal hold weapon — anchor positions on Karachi (MW3 6v6) all reward consistent AR play." },
      { name: "Sniper / Marksman (long sightline)", reason: "Karachi (MW3 6v6) long sightlines reward the Sniper pickup; off-angle is round-decider on contested zones." },
      { name: "Claymore + Trophy System", reason: "Claymore on entry + Trophy on mid-room covers most Karachi (MW3 6v6) hold setups against grenade + rush attempts." },
    ],
  },
  "favela": {
    attack: [
      { name: "Assault Rifle (mid-range loadout)", reason: "Favela (MW3 6v6) mid-range engagements reward the AR — primary loadout for any push commit." },
      { name: "SMG (entry loadout)", reason: "Favela (MW3 6v6) chokes are SMG range — Rusher with Dead Silence wins the mid take." },
      { name: "Stun Grenade + Smoke", reason: "Favela (MW3 6v6) pushes commit on Stun + Smoke combo — denies the anchor's pre-aim and breaks line of sight." },
    ],
    defense: [
      { name: "Assault Rifle (anchor loadout)", reason: "AR is the universal hold weapon — anchor positions on Favela (MW3 6v6) all reward consistent AR play." },
      { name: "Sniper / Marksman (long sightline)", reason: "Favela (MW3 6v6) long sightlines reward the Sniper pickup; off-angle is round-decider on contested zones." },
      { name: "Claymore + Trophy System", reason: "Claymore on entry + Trophy on mid-room covers most Favela (MW3 6v6) hold setups against grenade + rush attempts." },
    ],
  },
}

export default PICKS
