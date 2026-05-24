// R6 Siege loadouts — operator weapon picks, secondary, gadget priority,
// counter intel. R6's operators have fixed gadgets but a weapon choice
// per slot — those weapon picks matter. Some are clearly better than
// others.
//
// Curated by role (the role on the strats data: Hard Breach, Anchor,
// Roamer, Support, etc.) since loadouts cluster by role more than by
// individual op.

const LOADOUTS = {
  hard_breach: {
    name: 'Hard Breach',
    role: 'Open reinforced walls',
    summary: 'Thermite, Hibana, Ace, Maverick, Kali. Without them, the team can\'t open electrified walls. Always picked when defenders have Bandit/Kaid/Mute.',
    operators: [
      {
        name: 'Thermite',
        primary: '556xi (1.5x)',
        secondary: 'Desert Eagle (high damage backup)',
        gadget: '2× Exothermic Charges (the wall openers)',
        secondary_gadget: 'Smoke Grenade or Stun Grenade (Stuns preferred)',
        counter_picks: 'Bandit / Kaid / Mute can deny Thermite — bring Thatcher to clear',
        why: '556xi has the cleanest 4x scope option. Stun grenades flush defenders pre-breach.',
      },
      {
        name: 'Hibana',
        primary: 'Type-89 (high fire rate AR) or Supernova shotgun',
        secondary: 'Bearing-9 machine pistol',
        gadget: 'X-Kairos pellets (ranged hard breach)',
        secondary_gadget: 'Stun Grenade or Smoke Grenade',
        counter_picks: 'Mira windows can deny Hibana on certain walls',
        why: 'X-Kairos opens hatches AND walls — vertical play option. Bearing-9 is a strong secondary.',
      },
      {
        name: 'Ace',
        primary: 'AK-12 (recoil-friendly AR)',
        secondary: 'P9 pistol',
        gadget: 'S.E.L.M.A. (Selfdeploying Ladder + breach in one)',
        secondary_gadget: 'Stun Grenade or Breach Charge',
        counter_picks: 'Kaid / Bandit + tricks',
        why: 'AK-12 best AR in the game — laser at any range. SELMA ladders breach hatches AND walls.',
      },
      {
        name: 'Maverick',
        primary: 'AR-15.50 (DMR-style AR) or M4 (full-auto)',
        secondary: '1911 TACOPS pistol',
        gadget: 'Suri Knife (silent wall opener — bypasses Bandit)',
        secondary_gadget: 'Breach Charge or Smoke Grenade',
        counter_picks: 'Hard to counter — Maverick bans are extremely common',
        why: 'AR-15.50 is borderline DMR — pre-aim sightlines through Suri\'d walls. The "I don\'t care about Bandit tricks" pick.',
      },
    ],
  },

  support: {
    name: 'Support',
    role: 'Utility clear / Drone / Intel',
    summary: 'Thatcher, Twitch, Iana, Dokkaebi, IQ. Clear electronics, scout site, force defenders to react.',
    operators: [
      {
        name: 'Thatcher',
        primary: 'AR-33 or M590A1 shotgun or L85A2',
        secondary: 'Five-Seven or M45 MEUSOC',
        gadget: '3× EMP Grenades (clear all electronics)',
        secondary_gadget: 'Frag Grenade or Breach Charge',
        counter_picks: 'Hard ban target — banned every round',
        why: 'EMPs clear Bandit / Mute / Kaid / Echo / Maestro / Valkyrie. Game-winning utility.',
      },
      {
        name: 'Twitch',
        primary: 'F2 (high fire rate AR) or 417 (DMR)',
        secondary: 'P9 pistol',
        gadget: 'Shock Drone (destroys cameras + utility from range)',
        secondary_gadget: 'Smoke Grenade or Claymore',
        counter_picks: 'Mute jammers can shut down shock drone',
        why: 'F2 has the fastest fire rate of any AR. Shock drone clears more utility than Thatcher in some maps.',
      },
      {
        name: 'Iana',
        primary: 'ARX200 or G36C (very accurate AR)',
        secondary: 'MK1 9mm pistol',
        gadget: 'Gemini Replicator (hologram for intel)',
        secondary_gadget: 'Frag Grenade or Smoke Grenade',
        counter_picks: 'Mute / Mozzie can deny replicator',
        why: 'G36C is one of the easiest ARs to control. Gemini gives free intel that doesn\'t risk a teammate.',
      },
    ],
  },

  entry_fragger: {
    name: 'Entry Fragger',
    role: 'First through doors',
    summary: 'Ash, Sledge, Zofia, Buck, Amaru. Take the opening duel, frag out, win the entry.',
    operators: [
      {
        name: 'Ash',
        primary: 'R4-C (premium AR) or G36C',
        secondary: '5.7 USG pistol',
        gadget: 'Breaching Round (ranged soft-wall breach)',
        secondary_gadget: 'Stun Grenade or Breach Charge',
        counter_picks: 'Banned every other round — extremely common ban',
        why: 'R4-C has the highest DPS of any AR. Two breach rounds = mid-range soft wall opening from cover.',
      },
      {
        name: 'Sledge',
        primary: 'L85A2 (laser AR) or M590A1 shotgun',
        secondary: 'P226 pistol',
        gadget: 'Tactical Breaching Hammer (silent vertical play)',
        secondary_gadget: 'Stun Grenade or Frag Grenade',
        counter_picks: 'Mute / Maestro can deny vertical play with cameras + jammers',
        why: 'L85A2 is borderline DMR-accurate. Hammer makes Sledge the king of vertical play. Frags clear corners pre-entry.',
      },
      {
        name: 'Zofia',
        primary: 'LMG-E (suppressive fire) or M762',
        secondary: 'RG15 pistol (ACOG sidearm)',
        gadget: 'KS79 Lifeline Launcher (concussion + impact)',
        secondary_gadget: 'Breach Charge',
        counter_picks: 'Mute can jam concussion grenades',
        why: 'Concussion + impact in one launcher = self-flash + entry combo. RG15 ACOG pistol is unique advantage.',
      },
    ],
  },

  anchor: {
    name: 'Anchor',
    role: 'Hold site',
    summary: 'Smoke, Mute, Kaid, Castle, Bandit. Plant your flag on site, deny pushes, sustain through pressure.',
    operators: [
      {
        name: 'Smoke',
        primary: 'FMG-9 SMG (high mobility) or M590A1 shotgun',
        secondary: 'P226 MK 25',
        gadget: '3× Remote Gas Grenades (deadly area denial)',
        secondary_gadget: 'Barbed Wire or Proximity Alarm',
        counter_picks: 'Twitch shock drone can kill the gas canisters',
        why: 'FMG-9 has lowest recoil of any SMG. Gas grenades on plant deny defuse — game-winning.',
      },
      {
        name: 'Mute',
        primary: 'M590A1 shotgun or MP5K SMG',
        secondary: 'P226 MK 25',
        gadget: '4× Signal Disruptors (drones + breaches)',
        secondary_gadget: 'Nitro Cell or Barbed Wire',
        counter_picks: 'Thatcher EMP grenade clears all 4 jammers',
        why: 'Jammers protect reinforced walls from Thermite/Hibana/Ace AND deny enemy drones. Nitro cell is a 200dmg play.',
      },
      {
        name: 'Kaid',
        primary: 'AUG A3 (top-tier SMG) or TCSG12 (slug shotgun)',
        secondary: '.44 Mag Semi-Auto',
        gadget: '2× Rtila Electroclaws (electrify multiple walls + hatches)',
        secondary_gadget: 'Nitro Cell or Barbed Wire',
        counter_picks: 'Maverick / Thatcher both bypass electroclaws',
        why: 'TCSG12 slug shotgun = ACOG slug = sniper rifle in CQC. Electroclaws cover 2 walls each.',
      },
    ],
  },

  roamer: {
    name: 'Roamer',
    role: 'Flank / Waste attacker time',
    summary: 'Vigil, Caveira, Mozzie, Pulse, Alibi. Don\'t hold site — kill drones, flank, waste the round timer.',
    operators: [
      {
        name: 'Vigil',
        primary: 'BOSG.12.2 slug shotgun or K1A SMG',
        secondary: 'C75 Auto pistol or SMG-12',
        gadget: 'ERC-7 (invisible to drones)',
        secondary_gadget: 'Bulletproof Camera or Impact Grenade',
        counter_picks: 'Lion scan denies the drone-invis advantage briefly',
        why: 'K1A is one of the best SMGs in the game. ERC-7 lets you flank without being droned.',
      },
      {
        name: 'Caveira',
        primary: 'M12 SMG or SPAS-15 shotgun',
        secondary: 'Luison silenced pistol (unique mechanic)',
        gadget: 'Silent Step (silent walking + interrogate downed enemies)',
        secondary_gadget: 'Impact Grenade or Bulletproof Camera',
        counter_picks: 'Drones can\'t see her step but cameras + Lion can',
        why: 'Luison interrogate reveals all attacker positions to entire team. Game-changer if landed.',
      },
      {
        name: 'Mozzie',
        primary: 'Commando 9 SMG or P10 RONI',
        secondary: 'Super Shorty pump-pistol',
        gadget: 'Pest Launcher (steal drones)',
        secondary_gadget: 'Nitro Cell or Barbed Wire',
        counter_picks: 'Twitch shock drone kills Pests',
        why: 'Stealing attacker drones gives full intel on attacker positions. Super Shorty is a one-shot pistol-shotgun.',
      },
    ],
  },

  intel: {
    name: 'Intel / Gadget Counter',
    role: 'Information warfare',
    summary: 'Lion, Jackal, Dokkaebi (atk) / Maestro, Valkyrie, Echo (def). Map awareness through gadgets.',
    operators: [
      {
        name: 'Maestro',
        primary: 'ALDA 5.56 LMG (high cap) or M590A1 shotgun',
        secondary: 'Bailiff 410 revolver-shotgun',
        gadget: '2× Evil Eye cameras (bulletproof + laser)',
        secondary_gadget: 'Barbed Wire or Impact Grenade',
        counter_picks: 'Thatcher / Twitch / Maverick all counter Evil Eyes',
        why: 'ALDA holds 90 rounds. Evil Eyes track attackers, deal damage, and deny plant attempts.',
      },
      {
        name: 'Valkyrie',
        primary: 'MPX SMG or SPAS-12 shotgun',
        secondary: 'D-50 (Desert Eagle equivalent)',
        gadget: '3× Black Eye cameras (sticky placeable)',
        secondary_gadget: 'Nitro Cell or Impact Grenade',
        counter_picks: 'IQ pings cameras through walls',
        why: 'Three placeable cameras = total map intel. Nitro Cell secondary = game-changer.',
      },
      {
        name: 'Jackal',
        primary: 'C7E AR or PDW9 SMG',
        secondary: 'ITA12S shotgun-pistol or USP40',
        gadget: 'Eyenox (footstep tracker — locates roamers)',
        secondary_gadget: 'Smoke Grenade or Claymore',
        counter_picks: 'Caveira hides from footstep scan',
        why: 'Eyenox finds roamers anywhere in the building. C7E is a top-tier AR.',
      },
    ],
  },
}

export default LOADOUTS
