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
}

export default BANS
