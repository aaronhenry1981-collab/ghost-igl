const STRATS = {
  bank: {
    ceo: {
      attack: {
        operators: [
          { name: 'Thermite', role: 'Hard Breach', priority: 'essential' },
          { name: 'Thatcher', role: 'Support', priority: 'essential' },
          { name: 'Sledge', role: 'Vertical Play', priority: 'recommended' },
          { name: 'Nomad', role: 'Flank Watch', priority: 'recommended' },
          { name: 'Iana', role: 'Intel / Entry', priority: 'flex' },
        ],
        strategy: 'Open the CEO wall with Thermite while Thatcher clears anti-breach. Sledge plays vertical from above to force defenders off the site. Nomad covers flanks from spiral and back stairs. Iana drones out remaining defenders before the execute.',
        callouts: ['CEO', 'Executive Lounge', 'Janitor', 'Skylight', 'Server', 'Spiral Stairs', 'Front Door'],
        utility: [
          'Thermite: 2 charges on CEO reinforced wall',
          'Thatcher: EMP CEO wall to clear Bandit/Kaid tricking',
          'Sledge: Open floor above site for vertical pressure',
          'Nomad: Airjabs on spiral staircase and back stairs',
        ],
      },
      defense: {
        operators: [
          { name: 'Kaid', role: 'Anti-Breach', priority: 'essential' },
          { name: 'Smoke', role: 'Area Denial', priority: 'essential' },
          { name: 'Mute', role: 'Intel Denial', priority: 'recommended' },
          { name: 'Vigil', role: 'Roam', priority: 'recommended' },
          { name: 'Valkyrie', role: 'Intel', priority: 'flex' },
        ],
        strategy: 'Reinforce CEO wall and electrify with Kaid from the floor below or behind a shield. Smoke holds doorways and denies plant attempts. Mute covers drone holes and reinforced walls. Vigil roams to waste attacker time. Valkyrie places cameras in key hallways.',
        callouts: ['CEO', 'Executive Lounge', 'Janitor', 'Skylight', 'Server', 'Spiral Stairs'],
        utility: [
          'Kaid: Electroclaw CEO wall from below or behind cover',
          'Smoke: Canisters to deny plant in doorways',
          'Mute: Jammers on CEO wall and drone entry points',
          'Valkyrie: Cameras in elevator hall and server room',
        ],
      },
    },
    'open-area': {
      attack: {
        operators: [
          { name: 'Hibana', role: 'Hard Breach', priority: 'essential' },
          { name: 'Capitao', role: 'Area Denial', priority: 'essential' },
          { name: 'Zofia', role: 'Soft Breach', priority: 'recommended' },
          { name: 'Ash', role: 'Entry Frag', priority: 'recommended' },
          { name: 'Flores', role: 'Utility Clear', priority: 'flex' },
        ],
        strategy: 'Hibana opens the reinforced wall between open area and teller side. Capitao uses fire bolts to deny anchor positions. Zofia clears utility and opens rotations. Ash pushes from lobby. Flores drones and destroys defender gadgets.',
        callouts: ['Open Area', 'Staff Room', 'Electrical', 'Admin', 'Lobby', 'Main Stairs'],
        utility: [
          'Hibana: Open reinforced wall from teller side',
          'Capitao: Fire bolts on default anchor spots',
          'Zofia: Impact grenades on soft walls for rotations',
          'Flores: Clear barbed wire and shields',
        ],
      },
      defense: {
        operators: [
          { name: 'Bandit', role: 'Anti-Breach', priority: 'essential' },
          { name: 'Maestro', role: 'Intel / Denial', priority: 'essential' },
          { name: 'Jager', role: 'Utility Denial', priority: 'recommended' },
          { name: 'Alibi', role: 'Roam / Intel', priority: 'recommended' },
          { name: 'Thunderbird', role: 'Sustain', priority: 'flex' },
        ],
        strategy: 'Bandit tricking on the reinforced wall is critical. Maestro places Evil Eyes to deny plant and provide intel. Jager\'s ADS protect against flashbangs and projectiles. Alibi roams basement and lobby to slow the push. Thunderbird provides healing in high-traffic rotation spots.',
        callouts: ['Open Area', 'Staff Room', 'Electrical', 'Admin', 'Lobby'],
        utility: [
          'Bandit: Trick the reinforced wall (listen for Hibana/Thermite)',
          'Maestro: Evil Eyes covering plant spots',
          'Jager: ADS near doorways and windows',
          'Alibi: Prismas in common push paths',
        ],
      },
    },
    basement: {
      attack: {
        operators: [
          { name: 'Thermite', role: 'Hard Breach', priority: 'essential' },
          { name: 'Thatcher', role: 'Support', priority: 'essential' },
          { name: 'Buck', role: 'Vertical Play', priority: 'recommended' },
          { name: 'Gridlock', role: 'Area Denial', priority: 'recommended' },
          { name: 'Lion', role: 'Intel', priority: 'flex' },
        ],
        strategy: 'Open the server wall with Thermite. Buck plays vertical from above to open the floor over CCTV. Gridlock covers flanks with trax. Lion scans to catch rotating defenders. Control garage and tunnel for a clean execute.',
        callouts: ['Lockers', 'CCTV', 'Server Stairs', 'Tunnel', 'Garage', 'Elevator'],
        utility: [
          'Thermite: Server room wall breach',
          'Thatcher: EMP to clear anti-breach gadgets',
          'Buck: Vertical destruction above CCTV',
          'Gridlock: Trax stingers on flanking routes',
        ],
      },
      defense: {
        operators: [
          { name: 'Mira', role: 'Intel / Anchor', priority: 'essential' },
          { name: 'Smoke', role: 'Area Denial', priority: 'essential' },
          { name: 'Mozzie', role: 'Intel Denial', priority: 'recommended' },
          { name: 'Ela', role: 'Roam', priority: 'recommended' },
          { name: 'Castle', role: 'Delay', priority: 'flex' },
        ],
        strategy: 'Mira window on the wall between server and lockers for intel. Smoke denies tunnel push and plant. Mozzie captures attacker drones for counter-intel. Ela roams topside to waste time. Castle barricades slow pushes through server stairs.',
        callouts: ['Lockers', 'CCTV', 'Server Stairs', 'Tunnel', 'Garage'],
        utility: [
          'Mira: Black mirror on server/lockers wall',
          'Smoke: Canisters to deny tunnel and plant',
          'Mozzie: Pests in garage and tunnel entrances',
          'Castle: Barricade key doorways to delay push',
        ],
      },
    },
    tellers: {
      attack: {
        operators: [
          { name: 'Ace', role: 'Hard Breach', priority: 'essential' },
          { name: 'Twitch', role: 'Support', priority: 'essential' },
          { name: 'Sledge', role: 'Vertical / Soft Breach', priority: 'recommended' },
          { name: 'Nomad', role: 'Flank Watch', priority: 'recommended' },
          { name: 'Dokkaebi', role: 'Intel', priority: 'flex' },
        ],
        strategy: 'Ace opens the reinforced wall from the lobby side. Twitch drone clears gadgets before breach. Sledge opens the floor above for vertical pressure on archives. Nomad watches lobby and main stairs. Dokkaebi calls phones to reveal anchor positions.',
        callouts: ['Teller\'s', 'Archives', 'Lobby', 'Main Stairs', 'Admin', 'Square'],
        utility: [
          'Ace: S.E.L.M.A on reinforced teller wall',
          'Twitch: Drone to clear ADS and shock wire',
          'Sledge: Vertical play above archives',
          'Nomad: Airjabs on main stairs and lobby',
        ],
      },
      defense: {
        operators: [
          { name: 'Bandit', role: 'Anti-Breach', priority: 'essential' },
          { name: 'Lesion', role: 'Intel / Delay', priority: 'essential' },
          { name: 'Jager', role: 'Utility Denial', priority: 'recommended' },
          { name: 'Pulse', role: 'Intel', priority: 'recommended' },
          { name: 'Aruni', role: 'Utility Gate', priority: 'flex' },
        ],
        strategy: 'Bandit trick the teller wall. Lesion mines cover all entry points for early warning. Jager ADS protect the site from projectiles. Pulse plays below to give vertical intel and C4. Aruni gates on critical doorways to slow the push.',
        callouts: ['Teller\'s', 'Archives', 'Lobby', 'Main Stairs', 'Admin'],
        utility: [
          'Bandit: Trick the reinforced teller wall',
          'Lesion: Gu mines at every entry point',
          'Jager: ADS covering windows and doors',
          'Pulse: Below-floor intel for C4 opportunities',
        ],
      },
    },
  },

  oregon: {
    'kids-dorms': {
      attack: {
        operators: [
          { name: 'Thermite', role: 'Hard Breach', priority: 'essential' },
          { name: 'Thatcher', role: 'Support', priority: 'essential' },
          { name: 'Buck', role: 'Vertical Play', priority: 'recommended' },
          { name: 'Ash', role: 'Entry Frag', priority: 'recommended' },
          { name: 'Nomad', role: 'Flank Watch', priority: 'flex' },
        ],
        strategy: 'Open the kids\' dorms wall from attic side with Thermite. Buck plays vertical from above. Ash pushes from main stairs after clearing utility. Nomad watches back stairs and small tower. Control attic before executing.',
        callouts: ['Kids\' Dorms', 'Bunk', 'Attic', 'Small Tower', 'Back Stairs', 'Main Stairs', 'Walk-in'],
        utility: [
          'Thermite: Breach kids\' dorms wall from attic',
          'Thatcher: EMP to clear anti-breach',
          'Buck: Open attic floor for vertical control',
          'Nomad: Airjabs on back stairs',
        ],
      },
      defense: {
        operators: [
          { name: 'Kaid', role: 'Anti-Breach', priority: 'essential' },
          { name: 'Smoke', role: 'Area Denial', priority: 'essential' },
          { name: 'Jager', role: 'Utility Denial', priority: 'recommended' },
          { name: 'Vigil', role: 'Roam', priority: 'recommended' },
          { name: 'Wamai', role: 'Utility Denial', priority: 'flex' },
        ],
        strategy: 'Kaid electrifies the dorms wall. Smoke holds plant denial. Jager and Wamai stack utility denial on site. Vigil roams attic and small tower to waste attacker time and deny vertical control.',
        callouts: ['Kids\' Dorms', 'Bunk', 'Attic', 'Small Tower', 'Back Stairs', 'Walk-in'],
        utility: [
          'Kaid: Electroclaw on kids\' dorms wall',
          'Smoke: Canisters to deny plant',
          'Jager: ADS on critical angles',
          'Vigil: Roam attic to deny Buck',
        ],
      },
    },
    'meeting-hall': {
      attack: {
        operators: [
          { name: 'Hibana', role: 'Hard Breach', priority: 'essential' },
          { name: 'Capitao', role: 'Area Denial', priority: 'essential' },
          { name: 'Zofia', role: 'Soft Breach', priority: 'recommended' },
          { name: 'Sledge', role: 'Vertical Play', priority: 'recommended' },
          { name: 'Iana', role: 'Intel', priority: 'flex' },
        ],
        strategy: 'Hibana opens the meeting hall wall. Sledge plays vertical from kids\' dorms above. Capitao denies anchor positions with fire bolts during the execute. Zofia clears utility. Iana drones for final push.',
        callouts: ['Meeting Hall', 'Kitchen', 'Dining', 'Main Stairs', 'Lobby', 'Big Tower'],
        utility: [
          'Hibana: Breach meeting hall reinforced wall',
          'Capitao: Fire bolts on anchor spots during plant',
          'Sledge: Vertical destruction from above',
          'Zofia: Concussion and impact grenades for utility clear',
        ],
      },
      defense: {
        operators: [
          { name: 'Mira', role: 'Intel', priority: 'essential' },
          { name: 'Smoke', role: 'Area Denial', priority: 'essential' },
          { name: 'Lesion', role: 'Intel / Delay', priority: 'recommended' },
          { name: 'Ela', role: 'Roam', priority: 'recommended' },
          { name: 'Melusi', role: 'Slow', priority: 'flex' },
        ],
        strategy: 'Mira window on the wall between kitchen and meeting hall. Smoke denies plant. Lesion mines provide early warning on all entries. Ela roams upstairs to deny vertical play. Melusi slows pushes through dining.',
        callouts: ['Meeting Hall', 'Kitchen', 'Dining', 'Main Stairs', 'Lobby'],
        utility: [
          'Mira: Black mirror on kitchen/meeting wall',
          'Smoke: Plant denial canisters',
          'Lesion: Gu mines at every entry',
          'Melusi: Banshees in dining and lobby',
        ],
      },
    },
    laundry: {
      attack: {
        operators: [
          { name: 'Maverick', role: 'Hard Breach', priority: 'essential' },
          { name: 'Ash', role: 'Entry Frag', priority: 'essential' },
          { name: 'Gridlock', role: 'Area Denial', priority: 'recommended' },
          { name: 'IQ', role: 'Intel / Utility Clear', priority: 'recommended' },
          { name: 'Finka', role: 'Support', priority: 'flex' },
        ],
        strategy: 'Maverick torches the laundry wall for a sneaky open. Ash pushes through main stairs. Gridlock covers rotations with trax. IQ finds and calls out defender electronics. Finka boosts the team for the final push.',
        callouts: ['Laundry', 'Supply', 'Freezer', 'Main Stairs', 'Basement Stairs', 'Tunnel'],
        utility: [
          'Maverick: Torch holes in laundry wall for angles',
          'Ash: Breach rounds to clear barricades',
          'Gridlock: Trax on rotation paths',
          'IQ: Detect and call out Pulse/Valkyrie/traps',
        ],
      },
      defense: {
        operators: [
          { name: 'Smoke', role: 'Area Denial', priority: 'essential' },
          { name: 'Mute', role: 'Anti-Breach / Intel Denial', priority: 'essential' },
          { name: 'Frost', role: 'Trap', priority: 'recommended' },
          { name: 'Vigil', role: 'Roam', priority: 'recommended' },
          { name: 'Thunderbird', role: 'Sustain', priority: 'flex' },
        ],
        strategy: 'Mute jammers on the laundry wall to deny Maverick intel and breach. Smoke holds the choke points. Frost mats under windows for free kills. Vigil roams topside. Thunderbird provides healing near site.',
        callouts: ['Laundry', 'Supply', 'Freezer', 'Main Stairs', 'Basement Stairs'],
        utility: [
          'Mute: Jammers on laundry wall',
          'Smoke: Deny plant and choke points',
          'Frost: Welcome mats under windows and doorways',
          'Vigil: Roam main floor to waste time',
        ],
      },
    },
    tower: {
      attack: {
        operators: [
          { name: 'Thermite', role: 'Hard Breach', priority: 'essential' },
          { name: 'Thatcher', role: 'Support', priority: 'essential' },
          { name: 'Zofia', role: 'Soft Breach', priority: 'recommended' },
          { name: 'Nomad', role: 'Flank Watch', priority: 'recommended' },
          { name: 'Ace', role: 'Secondary Breach', priority: 'flex' },
        ],
        strategy: 'Thermite opens the attic wall. Control big tower and push from above. Zofia clears utility and opens rotations. Nomad watches flanks from small tower and back stairs. Coordinate a fast execute from multiple angles.',
        callouts: ['Attic', 'Tower', 'Big Tower', 'Small Tower', 'Back Stairs', 'Walk-in'],
        utility: [
          'Thermite: Breach attic reinforced wall',
          'Thatcher: EMP to clear Kaid/Bandit',
          'Zofia: Clear utility and open soft walls',
          'Nomad: Flank watch on rotations',
        ],
      },
      defense: {
        operators: [
          { name: 'Kaid', role: 'Anti-Breach', priority: 'essential' },
          { name: 'Jager', role: 'Utility Denial', priority: 'essential' },
          { name: 'Aruni', role: 'Utility Gate', priority: 'recommended' },
          { name: 'Alibi', role: 'Roam / Intel', priority: 'recommended' },
          { name: 'Doc', role: 'Anchor', priority: 'flex' },
        ],
        strategy: 'Kaid electrifies the attic wall. Jager and Aruni deny attacker utility. Alibi roams with prismas to create confusion. Doc anchors site with healing capability. Control small tower to deny the vertical push.',
        callouts: ['Attic', 'Tower', 'Big Tower', 'Small Tower', 'Back Stairs'],
        utility: [
          'Kaid: Electroclaw on attic wall',
          'Jager: ADS covering the main angles',
          'Aruni: Surya gates on key doorways',
          'Alibi: Prismas to confuse attackers',
        ],
      },
    },
  },

  clubhouse: {
    'cash-cctv': {
      attack: {
        operators: [
          { name: 'Thermite', role: 'Hard Breach', priority: 'essential' },
          { name: 'Maverick', role: 'Support Breach', priority: 'essential' },
          { name: 'Sledge', role: 'Vertical Play', priority: 'recommended' },
          { name: 'Nomad', role: 'Flank Watch', priority: 'recommended' },
          { name: 'Iana', role: 'Intel', priority: 'flex' },
        ],
        strategy: 'Thermite opens the cash room wall from construction. Maverick creates murder holes if Thermite gets denied. Sledge plays vertical from roof. Nomad watches master bedroom flank. Iana drones before the execute.',
        callouts: ['Cash Room', 'CCTV', 'Construction', 'Master Bedroom', 'Gym', 'Balcony', 'Roof'],
        utility: [
          'Thermite: Breach cash room wall',
          'Maverick: Torch backup holes on CCTV wall',
          'Sledge: Open roof above site',
          'Nomad: Airjabs on master bedroom rotation',
        ],
      },
      defense: {
        operators: [
          { name: 'Bandit', role: 'Anti-Breach', priority: 'essential' },
          { name: 'Smoke', role: 'Area Denial', priority: 'essential' },
          { name: 'Mute', role: 'Intel Denial', priority: 'recommended' },
          { name: 'Vigil', role: 'Roam', priority: 'recommended' },
          { name: 'Wamai', role: 'Utility Denial', priority: 'flex' },
        ],
        strategy: 'Bandit trick the cash wall to deny Thermite. Smoke holds CCTV and denies plant. Mute covers drone entry. Vigil roams to waste time on lower floors. Wamai adds utility denial on site.',
        callouts: ['Cash Room', 'CCTV', 'Construction', 'Master Bedroom', 'Gym'],
        utility: [
          'Bandit: Trick the cash room wall',
          'Smoke: Deny plant in CCTV doorway',
          'Mute: Jammers on drone holes and walls',
          'Wamai: Mag-NETs near windows',
        ],
      },
    },
    'bar-stock': {
      attack: {
        operators: [
          { name: 'Hibana', role: 'Hard Breach', priority: 'essential' },
          { name: 'Thatcher', role: 'Support', priority: 'essential' },
          { name: 'Buck', role: 'Vertical Play', priority: 'recommended' },
          { name: 'Ash', role: 'Entry Frag', priority: 'recommended' },
          { name: 'Flores', role: 'Utility Clear', priority: 'flex' },
        ],
        strategy: 'Hibana opens the stock room wall from outside. Buck plays vertical from above through master bedroom floor. Ash pushes bar from the front. Flores clears utility before execute. Thatcher EMPs anti-breach.',
        callouts: ['Bar', 'Stock Room', 'Stage', 'Garage', 'Blue Stairs', 'Western Hallway'],
        utility: [
          'Hibana: X-KAIROS on stock room wall',
          'Thatcher: EMP to clear Bandit/Mute',
          'Buck: Open floor from master bedroom',
          'Flores: Drone clear barbed wire and shields',
        ],
      },
      defense: {
        operators: [
          { name: 'Kaid', role: 'Anti-Breach', priority: 'essential' },
          { name: 'Maestro', role: 'Intel / Denial', priority: 'essential' },
          { name: 'Jager', role: 'Utility Denial', priority: 'recommended' },
          { name: 'Ela', role: 'Roam', priority: 'recommended' },
          { name: 'Lesion', role: 'Intel / Delay', priority: 'flex' },
        ],
        strategy: 'Kaid electrifies stock room wall. Maestro Evil Eyes cover plant spots. Jager ADS deny projectiles. Ela roams construction and garage. Lesion provides intel on all entry points.',
        callouts: ['Bar', 'Stock Room', 'Stage', 'Garage', 'Blue Stairs'],
        utility: [
          'Kaid: Electroclaw on stock room wall',
          'Maestro: Evil Eyes on plant spots',
          'Jager: ADS in bar area',
          'Lesion: Gu mines on entries',
        ],
      },
    },
    church: {
      attack: {
        operators: [
          { name: 'Ace', role: 'Hard Breach', priority: 'essential' },
          { name: 'Thatcher', role: 'Support', priority: 'essential' },
          { name: 'Sledge', role: 'Vertical Play', priority: 'recommended' },
          { name: 'Capitao', role: 'Area Denial', priority: 'recommended' },
          { name: 'Dokkaebi', role: 'Intel', priority: 'flex' },
        ],
        strategy: 'Ace opens church wall from tunnel. Sledge plays vertical from above through bar floor. Capitao denies anchor positions during plant. Dokkaebi calls phones for intel. Control blue stairs and tunnel entrance.',
        callouts: ['Church', 'Arsenal', 'Tunnel', 'Blue Stairs', 'Oil Pit', 'Garage'],
        utility: [
          'Ace: S.E.L.M.A on church wall',
          'Thatcher: EMP anti-breach gadgets',
          'Sledge: Vertical from bar floor',
          'Capitao: Fire bolts on anchor spots',
        ],
      },
      defense: {
        operators: [
          { name: 'Mira', role: 'Intel', priority: 'essential' },
          { name: 'Smoke', role: 'Area Denial', priority: 'essential' },
          { name: 'Mute', role: 'Anti-Breach', priority: 'recommended' },
          { name: 'Vigil', role: 'Roam', priority: 'recommended' },
          { name: 'Pulse', role: 'Intel', priority: 'flex' },
        ],
        strategy: 'Mira window on arsenal wall for church intel. Smoke denies plant and tunnel push. Mute jammers on church wall. Vigil roams upstairs. Pulse plays below for vertical intel.',
        callouts: ['Church', 'Arsenal', 'Tunnel', 'Blue Stairs', 'Oil Pit'],
        utility: [
          'Mira: Black mirror on arsenal/church wall',
          'Smoke: Deny tunnel and plant',
          'Mute: Jammers on church wall',
          'Pulse: Below-floor intel and C4',
        ],
      },
    },
    'gym-bedroom': {
      attack: {
        operators: [
          { name: 'Thermite', role: 'Hard Breach', priority: 'essential' },
          { name: 'Thatcher', role: 'Support', priority: 'essential' },
          { name: 'Zofia', role: 'Soft Breach', priority: 'recommended' },
          { name: 'Ash', role: 'Entry Frag', priority: 'recommended' },
          { name: 'Nomad', role: 'Flank Watch', priority: 'flex' },
        ],
        strategy: 'Thermite opens the gym wall from construction. Push from balcony and construction simultaneously. Zofia clears utility and opens soft walls. Ash entries from master bedroom. Nomad watches blue stairs.',
        callouts: ['Gym', 'Bedroom', 'Construction', 'Balcony', 'Master Bedroom', 'Cash Room'],
        utility: [
          'Thermite: Breach gym wall from construction',
          'Thatcher: EMP anti-breach on gym wall',
          'Zofia: Clear utility and soft walls',
          'Nomad: Watch blue stairs flank',
        ],
      },
      defense: {
        operators: [
          { name: 'Bandit', role: 'Anti-Breach', priority: 'essential' },
          { name: 'Jager', role: 'Utility Denial', priority: 'essential' },
          { name: 'Wamai', role: 'Utility Denial', priority: 'recommended' },
          { name: 'Alibi', role: 'Roam', priority: 'recommended' },
          { name: 'Doc', role: 'Anchor', priority: 'flex' },
        ],
        strategy: 'Bandit trick the gym wall. Jager and Wamai stack utility denial. Alibi roams construction side. Doc anchors bedroom with healing. Control master bedroom rotation.',
        callouts: ['Gym', 'Bedroom', 'Construction', 'Balcony', 'Master Bedroom'],
        utility: [
          'Bandit: Trick the gym wall',
          'Jager: ADS in bedroom and gym',
          'Wamai: Mag-NETs covering balcony window',
          'Alibi: Prismas in construction',
        ],
      },
    },
  },

  coastline: {
    'hookah-billiards': {
      attack: {
        operators: [
          { name: 'Ash', role: 'Entry Frag', priority: 'essential' },
          { name: 'Zofia', role: 'Soft Breach', priority: 'essential' },
          { name: 'Sledge', role: 'Vertical Play', priority: 'recommended' },
          { name: 'Nomad', role: 'Flank Watch', priority: 'recommended' },
          { name: 'Iana', role: 'Intel', priority: 'flex' },
        ],
        strategy: 'No hard breach needed — the walls are soft. Ash and Zofia push from balcony and VIP. Sledge plays vertical from above. Nomad watches cool vibes and main stairs. Iana drones ahead of the push. Fast execute from multiple angles.',
        callouts: ['Hookah', 'Billiards', 'VIP', 'Aqua', 'Cool Vibes', 'Main Stairs', 'Balcony'],
        utility: [
          'Ash: Breach rounds on barricades and soft walls',
          'Zofia: Concussions to clear site',
          'Sledge: Open floor from penthouse above',
          'Nomad: Airjabs on cool vibes and main stairs',
        ],
      },
      defense: {
        operators: [
          { name: 'Jager', role: 'Utility Denial', priority: 'essential' },
          { name: 'Wamai', role: 'Utility Denial', priority: 'essential' },
          { name: 'Vigil', role: 'Roam', priority: 'recommended' },
          { name: 'Valkyrie', role: 'Intel', priority: 'recommended' },
          { name: 'Melusi', role: 'Slow', priority: 'flex' },
        ],
        strategy: 'Jager and Wamai stack utility denial — this site gets hit with tons of projectiles. Vigil roams VIP and penthouse to deny vertical. Valkyrie cameras outside for early warning. Melusi banshees slow balcony and VIP pushes.',
        callouts: ['Hookah', 'Billiards', 'VIP', 'Aqua', 'Cool Vibes', 'Main Stairs'],
        utility: [
          'Jager: ADS in hookah and billiards',
          'Wamai: Mag-NETs covering windows',
          'Valkyrie: Outside cameras for early warning',
          'Melusi: Banshees on balcony door and VIP',
        ],
      },
    },
    'theater-penthouse': {
      attack: {
        operators: [
          { name: 'Hibana', role: 'Hard Breach', priority: 'essential' },
          { name: 'Thatcher', role: 'Support', priority: 'essential' },
          { name: 'Ash', role: 'Entry Frag', priority: 'recommended' },
          { name: 'Capitao', role: 'Area Denial', priority: 'recommended' },
          { name: 'Gridlock', role: 'Flank Denial', priority: 'flex' },
        ],
        strategy: 'Hibana opens the theater wall from VIP side. Ash pushes from hall of fame. Capitao denies anchor positions during plant. Gridlock covers rotations. Control VIP and balcony for multiple angles on site.',
        callouts: ['Theater', 'Penthouse', 'VIP', 'Hall of Fame', 'Balcony', 'North Stairs'],
        utility: [
          'Hibana: X-KAIROS on theater wall',
          'Thatcher: EMP anti-breach',
          'Capitao: Fire bolts during plant execute',
          'Gridlock: Trax on flanking paths',
        ],
      },
      defense: {
        operators: [
          { name: 'Kaid', role: 'Anti-Breach', priority: 'essential' },
          { name: 'Smoke', role: 'Area Denial', priority: 'essential' },
          { name: 'Jager', role: 'Utility Denial', priority: 'recommended' },
          { name: 'Ela', role: 'Roam', priority: 'recommended' },
          { name: 'Thunderbird', role: 'Sustain', priority: 'flex' },
        ],
        strategy: 'Kaid electrifies the theater wall. Smoke denies plant. Jager protects site from projectiles. Ela roams VIP and hookah to slow attackers. Thunderbird provides sustain near site rotations.',
        callouts: ['Theater', 'Penthouse', 'VIP', 'Hall of Fame', 'Balcony'],
        utility: [
          'Kaid: Electroclaw on theater wall',
          'Smoke: Deny plant with canisters',
          'Jager: ADS in penthouse and theater',
          'Ela: Grzmot mines on push paths',
        ],
      },
    },
    'kitchen-service': {
      attack: {
        operators: [
          { name: 'Zofia', role: 'Soft Breach', priority: 'essential' },
          { name: 'Ash', role: 'Entry Frag', priority: 'essential' },
          { name: 'Buck', role: 'Vertical Play', priority: 'recommended' },
          { name: 'Nomad', role: 'Flank Watch', priority: 'recommended' },
          { name: 'Finka', role: 'Support', priority: 'flex' },
        ],
        strategy: 'All soft walls — no hard breach needed. Buck plays vertical from above. Ash and Zofia push from pool and sunrise. Nomad watches flanks from blue bar side. Fast execute with Finka boost.',
        callouts: ['Kitchen', 'Service', 'Pool', 'Sunrise', 'Cool Vibes', 'Main Lobby'],
        utility: [
          'Zofia: Clear utility and concuss anchors',
          'Ash: Breach barricades for fast entry',
          'Buck: Vertical from hookah floor above',
          'Nomad: Airjabs on flanking routes',
        ],
      },
      defense: {
        operators: [
          { name: 'Maestro', role: 'Intel / Denial', priority: 'essential' },
          { name: 'Jager', role: 'Utility Denial', priority: 'essential' },
          { name: 'Lesion', role: 'Intel', priority: 'recommended' },
          { name: 'Vigil', role: 'Roam', priority: 'recommended' },
          { name: 'Wamai', role: 'Utility Denial', priority: 'flex' },
        ],
        strategy: 'Maestro Evil Eyes cover plant spots and pool entrance. Jager ADS deny projectiles. Lesion provides early warning. Vigil roams upstairs. Heavy utility stacking is key since walls are soft.',
        callouts: ['Kitchen', 'Service', 'Pool', 'Sunrise', 'Cool Vibes'],
        utility: [
          'Maestro: Evil Eyes on plant spots',
          'Jager: ADS in kitchen and service',
          'Lesion: Gu mines on all entries',
          'Wamai: Mag-NETs for additional denial',
        ],
      },
    },
    'blue-bar': {
      attack: {
        operators: [
          { name: 'Ash', role: 'Entry Frag', priority: 'essential' },
          { name: 'Zofia', role: 'Soft Breach', priority: 'essential' },
          { name: 'Sledge', role: 'Vertical Play', priority: 'recommended' },
          { name: 'Nomad', role: 'Flank Watch', priority: 'recommended' },
          { name: 'Dokkaebi', role: 'Intel', priority: 'flex' },
        ],
        strategy: 'Push from sunrise bar and pool side simultaneously. Sledge opens the floor from above for vertical pressure. Nomad watches main lobby flanks. Dokkaebi calls phones for intel on anchors. Fast multi-directional execute.',
        callouts: ['Blue Bar', 'Sunrise Bar', 'Pool', 'Main Lobby', 'Cool Vibes', 'South Stairs'],
        utility: [
          'Ash: Breach barricades for entries',
          'Zofia: Concussions and impacts',
          'Sledge: Vertical from billiards above',
          'Nomad: Airjabs on main lobby and cool vibes',
        ],
      },
      defense: {
        operators: [
          { name: 'Jager', role: 'Utility Denial', priority: 'essential' },
          { name: 'Smoke', role: 'Area Denial', priority: 'essential' },
          { name: 'Valkyrie', role: 'Intel', priority: 'recommended' },
          { name: 'Ela', role: 'Roam', priority: 'recommended' },
          { name: 'Aruni', role: 'Utility Gate', priority: 'flex' },
        ],
        strategy: 'Smoke denies plant. Jager protects site. Valkyrie provides outside intel. Ela roams upstairs to deny vertical play. Aruni gates slow pushes from sunrise and pool.',
        callouts: ['Blue Bar', 'Sunrise Bar', 'Pool', 'Main Lobby', 'Cool Vibes'],
        utility: [
          'Smoke: Deny plant with canisters',
          'Jager: ADS in blue bar',
          'Valkyrie: Outside cameras for rotations',
          'Aruni: Gates on sunrise and pool doors',
        ],
      },
    },
  },
}

export default STRATS
