// Ban suggestions for maps not covered by the hand-curated BANS data in
// bans.js. Same schema, merged at module load. Auto-derived from common R6
// meta patterns; Aaron can replace any entry by adding the map to bans.js.
//
// Schema: { mapId: { attack: [{name, reason}, ...], defense: [{name, reason}, ...] } }
// "attack bans" = attacker operators DEFENDERS want banned
// "defense bans" = defender operators ATTACKERS want banned

const BAN_SUGGESTIONS = {
  'emerald-plains': {
    attack: [
      { name: 'Thatcher', reason: 'Emerald Plains has heavy reinforcement on Admin and Gallery walls — without Thatcher, attackers can\'t clear Bandit and Kaid for hard breach.' },
      { name: 'Buck', reason: 'Vertical from above CEO and Meeting is the standard 2F exec. Banning Buck removes the cleanest vertical pressure tool.' },
    ],
    defense: [
      { name: 'Mira', reason: 'Black Mirrors on Admin/Library and Bar/Lounge walls give defenders untouchable intel — extremely hard to dislodge in tight Emerald sightlines.' },
      { name: 'Maestro', reason: 'Evil Eyes covering Dining and Gallery plant spots stall executes by forcing utility commitments before plant.' },
    ],
  },
  favela: {
    attack: [
      { name: 'Sledge', reason: 'Favela is a vertical map — Sledge above Aunt\'s and Football sites is the standard pressure play. Banning him kills the floor-drop game.' },
      { name: 'Capitao', reason: 'Fire bolts deny anchor positions in Favela\'s open rooms. Removes a key area-denial threat from execute reads.' },
    ],
    defense: [
      { name: 'Echo', reason: 'Yokai drones on Favela\'s low ceilings deny plant attempts on every site. Hard to clear given the verticality.' },
      { name: 'Mira', reason: 'Black Mirrors in Football Office and Aunt\'s Apartment give defenders read on the standard Side Stairs push.' },
    ],
  },
  fortress: {
    attack: [
      { name: 'Thatcher', reason: 'Fortress\'s reinforced walls on Commander Office and Kitchen depend on electronics. Banning Thatcher forces hard-breach gambles.' },
      { name: 'Buck', reason: 'Vertical from above Hammam and Briefing is the cleanest 2F→1F pressure. Buck is the most reliable open-floor option.' },
    ],
    defense: [
      { name: 'Maestro', reason: 'Evil Eyes covering Cafeteria and Sitting Room plant spots are extremely hard to clear. Forces attackers to spend utility before plant.' },
      { name: 'Goyo', reason: 'Volcan shields in Fortress\'s narrow corridors deny rotations and create plant-denial fire walls. Hard counter to standard executes.' },
    ],
  },
  hereford: {
    attack: [
      { name: 'Sledge', reason: 'Hereford\'s soft floors between Master/Catwalk and Ammo/Tractor enable vertical play. Sledge is the most reliable opener.' },
      { name: 'Thatcher', reason: 'Master and Kitchen reinforced walls are heavily electrified — Thatcher\'s EMPs are mandatory for hard breach.' },
    ],
    defense: [
      { name: 'Mira', reason: 'Black Mirrors in Master Bedroom and Brewery cover the standard attacker push lanes. Extremely hard to clear without Twitch.' },
      { name: 'Lesion', reason: 'Gu mines on Hereford\'s narrow connectors and stairwells provide constant intel and chip damage on every push.' },
    ],
  },
  house: {
    attack: [
      { name: 'Sledge', reason: 'House is a vertical map — Sledge from 2F above Garage and Living dominates the standard exec.' },
      { name: 'Ash', reason: 'House\'s soft walls and tight rooms favor Ash\'s breaching round entry pressure. Banning her slows attacker tempo.' },
    ],
    defense: [
      { name: 'Mira', reason: 'Black Mirrors on Master/Trampoline and Living/Foyer walls give defenders impossible-to-counter sightlines.' },
      { name: 'Echo', reason: 'Yokai drones on House\'s low ceilings deny plant attempts in Garage and basement sites.' },
    ],
  },
  kanal: {
    attack: [
      { name: 'Thatcher', reason: 'Kanal\'s reinforced walls on Server Room and Map Room depend on Bandit/Kaid tricking. Without Thatcher, hard breach becomes a gamble.' },
      { name: 'Maverick', reason: 'Silent wall holes on key Kanal sightlines (Bridge, Quay) bypass standard defender setups. Removing him forces predictable breach lines.' },
    ],
    defense: [
      { name: 'Mira', reason: 'Black Mirrors on Server/Bridge and Coast Meeting walls give defenders central-map intel that bypasses standard droning.' },
      { name: 'Maestro', reason: 'Evil Eyes covering Lounge and Supply plant spots make late-round plants risky and stall execute timing.' },
    ],
  },
  outback: {
    attack: [
      { name: 'Sledge', reason: 'Outback\'s 2F sites (Laundry/Piano, Party/Office) have soft floors above. Sledge from Reception/Compressor dominates verticals.' },
      { name: 'Thatcher', reason: 'Mechanic and Bedroom reinforced walls require electronic clearing. Banning Thatcher hurts attacker execute reliability.' },
    ],
    defense: [
      { name: 'Maestro', reason: 'Evil Eyes covering Mechanic and Office plant spots are extremely hard to clear given Outback\'s open sightlines.' },
      { name: 'Ela', reason: 'Grzmot mines in Outback\'s connector hallways waste attacker time and provide constant intel on rotations.' },
    ],
  },
  plane: {
    attack: [
      { name: 'Thatcher', reason: 'Plane\'s reinforced walls on Meeting and Stateroom depend on Bandit tricking. Thatcher EMP makes hard breach reliable.' },
      { name: 'Iana', reason: 'Plane\'s tight corridors favor Iana\'s safe-intel hologram. Banning her removes the cleanest droning option through narrow choke points.' },
    ],
    defense: [
      { name: 'Mira', reason: 'Black Mirrors in Meeting Room and Cargo Hold cover Plane\'s central rotation lanes — extremely hard to dislodge.' },
      { name: 'Smoke', reason: 'Smoke canisters in Plane\'s narrow doorways make late-round plants nearly impossible.' },
    ],
  },
  'stadium-bravo': {
    attack: [
      { name: 'Sledge', reason: 'Stadium Bravo\'s 2F sites have soft floors above. Sledge from Press Box dominates Office and Dorm verticals.' },
      { name: 'Thatcher', reason: 'Heavy reinforcement on Office and Living walls — without Thatcher, hard breach attempts get tricked consistently.' },
    ],
    defense: [
      { name: 'Mira', reason: 'Black Mirrors on Office/Target and Living/Piano walls give defenders sightlines on Tunnel/Concourse approaches.' },
      { name: 'Maestro', reason: 'Evil Eyes covering Kitchen and Living plant spots stall executes. Forces attacker utility commitment before plant.' },
    ],
  },
  tower: {
    attack: [
      { name: 'Thatcher', reason: 'Tower\'s reinforced walls on Gift Shop and Restaurant depend on electronic denial. Thatcher EMP is mandatory for reliable hard breach.' },
      { name: 'Capitao', reason: 'Fire bolts deny anchor positions in Tower\'s open exhibition rooms. Removes a key area-denial tool from execute reads.' },
    ],
    defense: [
      { name: 'Mira', reason: 'Black Mirrors in Gift Shop and Tea Room give defenders impossible-to-counter sightlines on the standard Lobby/East push.' },
      { name: 'Echo', reason: 'Yokai drones on Tower\'s tight site ceilings deny plants and provide constant intel during exec.' },
    ],
  },
  yacht: {
    attack: [
      { name: 'Sledge', reason: 'Yacht\'s vertical layout (Cockpit/Maps above Engine sites) favors Sledge floor-drop play. Banning him kills vertical pressure.' },
      { name: 'Thatcher', reason: 'Engine Control and Cockpit reinforced walls are heavily electrified. Thatcher is mandatory for reliable hard breach.' },
    ],
    defense: [
      { name: 'Mira', reason: 'Black Mirrors in Cafeteria and Engine Control cover Yacht\'s central rotation paths — extremely hard to clear with limited utility.' },
      { name: 'Lesion', reason: 'Gu mines on Yacht\'s narrow stairwells and corridors waste attacker time and provide constant intel on rotations.' },
    ],
  },
}

export default BAN_SUGGESTIONS
