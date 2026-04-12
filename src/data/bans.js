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
}

export default BANS
