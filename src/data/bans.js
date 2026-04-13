const BANS = {
  bank: {
    attack: [
      { name: 'Thatcher', reason: 'Removes all electronic denial on reinforced walls — without him, hard breachers struggle to open CEO and basement walls.' },
      { name: 'Maverick', reason: 'Can silently open reinforced walls without any counter. Eliminates Bandit/Kaid tricking entirely.' },
    ],
    defense: [
      { name: 'Mira', reason: 'Black Mirrors on key walls give defenders massive intel advantage and deny safe pushes on multiple sites.' },
      { name: 'Valkyrie', reason: 'Hidden cameras throughout Bank\'s tight hallways provide too much roamer intel and C4 kills.' },
    ],
  },
  oregon: {
    attack: [
      { name: 'Thatcher', reason: 'Essential for clearing electronics on Meeting Hall and Laundry walls. Banning him forces attackers into risky alternatives.' },
      { name: 'Montagne', reason: 'Shield pressure in Oregon\'s narrow hallways is extremely hard to deal with, especially on Tower and Kids\' Dorms.' },
    ],
    defense: [
      { name: 'Echo', reason: 'Yokai drones in the ceiling deny plant attempts across all sites. Very hard to clear on Oregon\'s low ceilings.' },
      { name: 'Mira', reason: 'Basement Mira windows make Laundry nearly impossible to take without perfectly coordinated utility.' },
    ],
  },
  clubhouse: {
    attack: [
      { name: 'Thatcher', reason: 'Church/Arsenal and Cash/CCTV walls are heavily electrified. Without Thatcher, hard breach becomes a coin flip.' },
      { name: 'Sledge', reason: 'Vertical play from above is the primary way to attack Bar and Cash. Removing Sledge weakens vertical pressure significantly.' },
    ],
    defense: [
      { name: 'Kaid', reason: 'Electroclaw range lets him deny multiple hatches and walls simultaneously. Critical for Church and Cash defense.' },
      { name: 'Smoke', reason: 'Area denial in Clubhouse\'s tight doorways makes late-round plant attempts nearly impossible.' },
    ],
  },
  coastline: {
    attack: [
      { name: 'Iana', reason: 'Her hologram safely gathers intel through Coastline\'s many windows and doors with zero risk. Top fragging potential.' },
      { name: 'Ash', reason: 'Fast entry through Coastline\'s many soft walls and windows. Her speed and utility clear make her dominant on this map.' },
    ],
    defense: [
      { name: 'Maestro', reason: 'Evil Eyes lock down Hookah, Kitchen, and Blue Bar with bulletproof intel and damage. Forces attackers to waste utility.' },
      { name: 'Jager', reason: 'ADS protect every window and door on Coastline. Without them, defenders get overwhelmed by grenades and flashes.' },
    ],
  },
  kafe: {
    attack: [
      { name: 'Thatcher', reason: 'Kafe\'s reinforced walls on Reading and Mining sites depend on electronic denial. Without Thatcher, attackers must rely on slower alternatives to clear Kaid and Bandit.' },
      { name: 'Capitao', reason: 'Fire bolts deny critical anchor positions behind bar counters and in Fireplace Hall. Removing him weakens late-round execute potential.' },
    ],
    defense: [
      { name: 'Maestro', reason: 'Evil Eyes on Kafe\'s tight plant spots are extremely hard to clear. Maestro provides bulletproof intel and chip damage that stalls executes.' },
      { name: 'Smoke', reason: 'Kafe\'s narrow doorways and stairwells make Smoke\'s canisters devastating for plant denial across every site.' },
    ],
  },
  consulate: {
    attack: [
      { name: 'Thatcher', reason: 'Garage wall and Consul Office reinforcements are heavily electrified. Banning Thatcher forces risky Maverick or Twitch plays to open key walls.' },
      { name: 'Montagne', reason: 'Consulate\'s long hallways and tight doorways make Montagne\'s shield push nearly unstoppable, especially on Lobby and Garage sites.' },
    ],
    defense: [
      { name: 'Mira', reason: 'Black Mirrors on Consul Office and Garage connector walls give defenders overwhelming intel advantage and deny safe entry.' },
      { name: 'Echo', reason: 'Yokai drones on Consulate\'s low ceilings deny plant on every site. Extremely hard to find and clear in time.' },
    ],
  },
  chalet: {
    attack: [
      { name: 'Buck', reason: 'Vertical play from above is the primary attack strategy on most Chalet sites. Without Buck, attackers lose their strongest pressure tool.' },
      { name: 'Sledge', reason: 'Chalet\'s extensive soft floors make Sledge\'s vertical destruction devastating. Banning him alongside Buck cripples vertical play entirely.' },
    ],
    defense: [
      { name: 'Bandit', reason: 'Wine Cellar and Snowmobile Garage walls require Bandit tricking to hold. His batteries are essential for basement site defense.' },
      { name: 'Valkyrie', reason: 'Chalet\'s many exterior approaches and balconies make Valkyrie\'s outside cameras invaluable for early warning and C4 kills.' },
    ],
  },
  border: {
    attack: [
      { name: 'Thatcher', reason: 'Border\'s reinforced walls on Workshop and Armory are heavily electrified. Without Thatcher, attackers must rely on slow Kali or Twitch plays to clear Bandit and Kaid.' },
      { name: 'Ace', reason: 'S.E.L.M.A charges can open multiple walls from safety. Removing Ace forces attackers into riskier Thermite plays on Border\'s exposed wall positions.' },
    ],
    defense: [
      { name: 'Mira', reason: 'Black Mirrors on Workshop connector and Customs walls give defenders overwhelming intel and deny safe entry through Border\'s tight corridors.' },
      { name: 'Valkyrie', reason: 'Border\'s many exterior windows and rooftop approaches make Valkyrie\'s outside cameras devastating for early warning and C4 runout kills.' },
    ],
  },
  skyscraper: {
    attack: [
      { name: 'Buck', reason: 'Skyscraper\'s soft floors make vertical play devastating on Tea Room and Bedroom. Without Buck, attackers lose their strongest tool for pressuring anchors from above.' },
      { name: 'Ash', reason: 'Fast entry through Skyscraper\'s many windows and balcony doors makes Ash a dominant fragger. Banning her slows down aggressive window plays significantly.' },
    ],
    defense: [
      { name: 'Valkyrie', reason: 'Skyscraper\'s exterior balconies and windows make Valkyrie\'s outside cameras extremely powerful for C4 kills and early rotation reads.' },
      { name: 'Echo', reason: 'Yokai drones deny plant in Tea Room and Kitchen\'s tight plant spots. Very hard to clear with Skyscraper\'s cluttered ceiling spaces.' },
    ],
  },
  'theme-park': {
    attack: [
      { name: 'Thatcher', reason: 'Theme Park\'s reinforced walls on Throne Room and Lab are heavily electrified. Without Thatcher, hard breachers struggle to open critical walls.' },
      { name: 'Capitao', reason: 'Fire bolts deny anchor positions in Throne Room\'s tight corners and Lab\'s storage area. Removing him weakens late-round plant executes.' },
    ],
    defense: [
      { name: 'Kaid', reason: 'Electroclaw range lets Kaid deny hatches and walls on multiple Theme Park sites simultaneously. Critical for Throne Room and Lab defense.' },
      { name: 'Smoke', reason: 'Theme Park\'s narrow doorways and connector hallways make Smoke\'s canisters devastating for denying plant on every site.' },
    ],
  },
  villa: {
    attack: [
      { name: 'Thatcher', reason: 'Villa\'s reinforced walls on Trophy and Kitchen sites rely on electronic denial. Without Thatcher, attackers must use slower alternatives to clear Bandit and Kaid setups.' },
      { name: 'Maverick', reason: 'Maverick silently opens reinforced walls in Statuary and Dining without any counter. Banning him removes the only uncounterable hard breach option on Villa\'s key walls.' },
    ],
    defense: [
      { name: 'Mira', reason: 'Black Mirrors on Aviator connector and Kitchen hallway walls give defenders dominant intel and shut down safe attacker pushes on Villa\'s two strongest sites.' },
      { name: 'Maestro', reason: 'Evil Eyes on Villa\'s plant spots provide bulletproof intel and chip damage. The map\'s open sightlines make his cameras extremely hard to clear without wasting utility.' },
    ],
  },
  nighthaven: {
    attack: [
      { name: 'Thatcher', reason: 'Nighthaven Labs\' basement Server Room walls are heavily electrified. Without Thatcher, attackers must rely on risky Kali or Twitch plays to open critical reinforcements.' },
      { name: 'Flores', reason: 'Flores\' exploding drones clear bulletproof utility through Nighthaven\'s long corridors with zero risk. Banning him forces attackers to push into defender gadgets head-on.' },
    ],
    defense: [
      { name: 'Kaid', reason: 'Electroclaw range lets Kaid deny hatches and walls on Server Room and Assembly simultaneously. His flexibility is critical for Nighthaven\'s vertical-heavy defense.' },
      { name: 'Smoke', reason: 'Nighthaven Labs\' tight chokepoints and narrow corridors make Smoke\'s canisters devastating for denying plant attempts on every site.' },
    ],
  },
  lair: {
    attack: [
      { name: 'Thatcher', reason: 'Lair\'s basement Vault walls and 1F Workshop reinforcements rely on electronic denial. Without Thatcher, attackers must use slow Twitch or Kali plays to clear Kaid and Bandit setups.' },
      { name: 'Maverick', reason: 'Maverick silently opens reinforced walls in Vault and Workshop with zero counter-play. Banning him removes the only uncounterable hard breach option on Lair\'s tightest sites.' },
    ],
    defense: [
      { name: 'Mira', reason: 'Black Mirrors on Workshop connector and Surveillance hallway walls give defenders dominant intel and deny safe attacker pushes on Lair\'s strongest sites.' },
      { name: 'Smoke', reason: 'Lair\'s narrow corridors and chokepoints leading into every site make Smoke\'s canisters devastating for denying late-round plant attempts.' },
    ],
  },
}

export default BANS
