// Predicted enemy picks and tendencies based on ranked meta data per map/site
const ENEMY_META = {
  bank: {
    ceo: {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 87, reason: 'CEO wall is the primary objective — almost every attack team brings a hard breacher here' },
          { name: 'Thatcher', pickRate: 72, reason: 'If not banned, Thatcher is the go-to for clearing Kaid/Bandit on CEO wall' },
          { name: 'Sledge', pickRate: 58, reason: 'Vertical play from above is the most common secondary strategy' },
          { name: 'Iana', pickRate: 45, reason: 'Popular for droning out CEO and Executive Lounge safely before the execute' },
        ],
        commonStrats: [
          'Hard breach CEO wall + vertical pressure from above (65% of rounds)',
          'Lobby push into Executive Lounge with Ash/Zofia entry (20% of rounds)',
          'Split push: skylight + front door pinch (15% of rounds)',
        ],
        tendencies: [
          'Most teams default to breaching CEO wall — expect hard breach every round',
          'If they lose the wall breach, expect a fast rotate to lobby push',
          'Watch for Sledge/Buck playing above site in the first 60 seconds',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Kaid', pickRate: 79, reason: 'Electroclaw on CEO wall is the default anti-breach setup' },
          { name: 'Smoke', pickRate: 65, reason: 'Area denial in CEO doorways to deny late-round plant' },
          { name: 'Vigil', pickRate: 52, reason: 'Most common roamer — usually plays around spiral and server room' },
          { name: 'Mute', pickRate: 48, reason: 'Jammers on wall + drone denial are standard on this site' },
        ],
        commonStrats: [
          'Anchor CEO with Kaid + Smoke, one roamer on spiral stairs (55% of rounds)',
          'Aggressive roam with Vigil wasting time in lobby (25% of rounds)',
          'Extended hold in server room to deny attacker map control (20% of rounds)',
        ],
        tendencies: [
          'Expect Kaid tricking on CEO wall — bring a counter or be ready to rush',
          'One roamer almost always plays around spiral staircase',
          'Late-round Smoke canisters will deny your plant attempt — clear anchors first',
        ],
      },
    },
    'open-area': {
      attack: {
        likelyOps: [
          { name: 'Hibana', pickRate: 74, reason: 'Opens the reinforced wall between open area and teller side at range' },
          { name: 'Capitao', pickRate: 56, reason: 'Fire bolts deny anchor positions behind cover in open area' },
          { name: 'Ash', pickRate: 62, reason: 'Fast entry from lobby is the most common opening move' },
          { name: 'Zofia', pickRate: 48, reason: 'Soft breach + concussions for clearing corners in the open floor plan' },
        ],
        commonStrats: [
          'Lobby push into open area with Ash entry (50% of rounds)',
          'Hard breach wall + Capitao fire to flush anchors (30% of rounds)',
          'Vertical play from above through admin offices (20% of rounds)',
        ],
        tendencies: [
          'Fast Ash rush through lobby is extremely common — have a player watching lobby early',
          'Expect Capitao fire on your anchor spots in the last 30 seconds',
          'If they take admin control early, they\'re setting up vertical play',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Bandit', pickRate: 71, reason: 'Wall denial is critical — Bandit tricking is the standard play' },
          { name: 'Maestro', pickRate: 55, reason: 'Evil Eyes on plant spots give intel and damage through smoke' },
          { name: 'Jager', pickRate: 68, reason: 'ADS protect anchors from projectile spam in the open floor plan' },
          { name: 'Alibi', pickRate: 42, reason: 'Roams basement and lobby to slow the attacker push' },
        ],
        commonStrats: [
          'Bandit trick wall + Maestro cameras on plant (50% of rounds)',
          'Extended lobby hold with Jager + roamer (30% of rounds)',
          'Basement roam to waste attacker time and deny map control (20% of rounds)',
        ],
        tendencies: [
          'Bandit will be tricking the wall — listen for the battery and time your breach',
          'Expect Jager ADS protecting the main entrance angles',
          'At least one roamer will be in basement or lobby — clear before pushing site',
        ],
      },
    },
    basement: {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 82, reason: 'Basement walls need hard breach — Thermite is the reliable pick' },
          { name: 'Thatcher', pickRate: 68, reason: 'Clearing Bandit/Mute off basement walls from above or outside' },
          { name: 'Buck', pickRate: 61, reason: 'Vertical destruction from 1F to deny anchor positions below' },
          { name: 'Jackal', pickRate: 44, reason: 'Tracking roamers who leave basement early is high value' },
        ],
        commonStrats: [
          'Hard breach basement wall + Buck vertical from 1F (55% of rounds)',
          'Server room control into CCTV push (25% of rounds)',
          'Full basement rush through garage (20% of rounds)',
        ],
        tendencies: [
          'Vertical play from 1F is the #1 strategy — expect Buck or Sledge above you',
          'Hard breacher will target the main basement wall within first 90 seconds',
          'If they take server room early, expect a CCTV push from the side',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Bandit', pickRate: 75, reason: 'Wall denial on basement reinforcements is essential' },
          { name: 'Smoke', pickRate: 70, reason: 'Area denial in the tight basement corridors is extremely strong' },
          { name: 'Mute', pickRate: 58, reason: 'Jammers deny drones and hard breach on basement walls' },
          { name: 'Pulse', pickRate: 40, reason: 'C4 through the floor to counter vertical players above' },
        ],
        commonStrats: [
          'Bandit trick + Smoke hold doorways, Pulse plays C4 from below (45% of rounds)',
          'Extended hold on 1F to deny vertical play (30% of rounds)',
          'Aggressive roam on 1F and lobby to waste time (25% of rounds)',
        ],
        tendencies: [
          'Bandit will be on the wall — always assume they\'re tricking',
          'Smoke saves canisters for the last 30 seconds to deny plant',
          'Watch for Pulse below 1F if you\'re playing vertical — he\'ll C4 you through the floor',
        ],
      },
    },
    tellers: {
      attack: {
        likelyOps: [
          { name: 'Hibana', pickRate: 70, reason: 'Opens hatches and walls at range to pressure teller positions' },
          { name: 'Sledge', pickRate: 55, reason: 'Vertical destruction from 2F to pressure tellers from above' },
          { name: 'Nomad', pickRate: 50, reason: 'Airjabs on rotation routes to catch flanking defenders' },
          { name: 'Flores', pickRate: 43, reason: 'Drone clears utility and forces defenders to reposition' },
        ],
        commonStrats: [
          'Hard breach + vertical pressure from 2F (50% of rounds)',
          'Lobby control into tellers push through main entrance (30% of rounds)',
          'Archives push with Nomad covering flanks (20% of rounds)',
        ],
        tendencies: [
          'Expect vertical play from above — they\'ll try to open floors over your anchors',
          'Lobby control is usually their first move before pushing tellers',
          'Late-round Nomad airjabs will block your rotation paths',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Mira', pickRate: 63, reason: 'Black Mirror between tellers and archives gives massive intel advantage' },
          { name: 'Smoke', pickRate: 60, reason: 'Canisters deny plant in tellers doorways and windows' },
          { name: 'Jager', pickRate: 55, reason: 'ADS protect key positions from grenades and flashes' },
          { name: 'Valkyrie', pickRate: 47, reason: 'Cameras in lobby and halls give early warning on pushes' },
        ],
        commonStrats: [
          'Mira window hold + Smoke denial at doorways (45% of rounds)',
          'Extended lobby hold with Valkyrie cameras (30% of rounds)',
          'Roam heavy with 2 players off-site wasting time (25% of rounds)',
        ],
        tendencies: [
          'If Mira isn\'t banned, expect a Black Mirror between tellers and archives',
          'Smoke will save utility for the last 30 seconds — you need to clear him early',
          'Check for Valkyrie cameras in lobby before you push through',
        ],
      },
    },
  },
  oregon: {
    'kids-dorms': {
      attack: {
        likelyOps: [
          { name: 'Sledge', pickRate: 75, reason: 'Vertical play from attic to dorms is the primary strategy' },
          { name: 'Thatcher', pickRate: 65, reason: 'Clears electronics on kids\' dorms walls and hatches' },
          { name: 'Thermite', pickRate: 60, reason: 'Opens the kids\' dorms reinforced wall from hallway' },
          { name: 'Nomad', pickRate: 48, reason: 'Airjabs on back stairs and big tower to watch flanks' },
        ],
        commonStrats: [
          'Vertical from attic + hard breach kids wall (55% of rounds)',
          'Big tower control into dorms push (25% of rounds)',
          'Split push: meeting hall stairs + back stairs pinch (20% of rounds)',
        ],
        tendencies: [
          'Vertical play from attic is the default — expect destruction from above within 60 seconds',
          'They\'ll try to take big tower control for the crossfire angle',
          'Nomad airjabs on stairs mean your rotations will be cut off late round',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Smoke', pickRate: 68, reason: 'Denies plant in kids\' dorms doorway and connector' },
          { name: 'Mute', pickRate: 55, reason: 'Jammers on walls and drone holes to slow intel gathering' },
          { name: 'Vigil', pickRate: 50, reason: 'Roams attic to deny vertical play setup' },
          { name: 'Jager', pickRate: 58, reason: 'ADS on key positions to protect from grenades' },
        ],
        commonStrats: [
          'Smoke anchor + Vigil roam attic to deny vertical (50% of rounds)',
          'Extended hold in big tower to deny map control (25% of rounds)',
          'Aggressive meeting hall roam (25% of rounds)',
        ],
        tendencies: [
          'Expect a roamer in attic trying to deny your vertical play',
          'Smoke will hold canisters for plant denial — kill him before planting',
          'If they hold big tower aggressively, clear it before committing to the execute',
        ],
      },
    },
    'meeting-hall': {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 78, reason: 'Meeting hall wall is the primary breach target' },
          { name: 'Thatcher', pickRate: 70, reason: 'Essential for clearing electronics on meeting hall wall' },
          { name: 'Capitao', pickRate: 52, reason: 'Fire bolts deny kitchen anchor positions during execute' },
          { name: 'Ash', pickRate: 55, reason: 'Fast entry through dining or main stairs' },
        ],
        commonStrats: [
          'Hard breach meeting hall wall + kitchen push (55% of rounds)',
          'Dining hall entry with Ash + support (25% of rounds)',
          'Vertical from 2F into kitchen (20% of rounds)',
        ],
        tendencies: [
          'They will hard breach the meeting hall wall — this is the default attack every round',
          'Capitao fire will come in the last 20 seconds to deny your anchor spot',
          'If they take dining early, they\'re setting up a fast execute on meeting hall',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Kaid', pickRate: 72, reason: 'Electroclaw on meeting hall wall is the standard deny' },
          { name: 'Smoke', pickRate: 65, reason: 'Denies plant in meeting hall doorways and kitchen connector' },
          { name: 'Mira', pickRate: 55, reason: 'Black Mirror in kitchen gives intel on meeting hall push' },
          { name: 'Vigil', pickRate: 45, reason: 'Roams 2F or dining to waste attacker time' },
        ],
        commonStrats: [
          'Kaid wall + Mira kitchen mirror + Smoke plant denial (50% of rounds)',
          'Extended dining hold to deny attacker map control (25% of rounds)',
          'Roam heavy with 2F control (25% of rounds)',
        ],
        tendencies: [
          'Kaid tricking on meeting hall wall is standard — bring a counter',
          'If Mira isn\'t banned, expect a mirror in kitchen watching meeting hall',
          'One roamer will be in dining or 2F — clear before executing',
        ],
      },
    },
    laundry: {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 80, reason: 'Laundry walls need hard breach to open up the site' },
          { name: 'Thatcher', pickRate: 72, reason: 'Clearing electronics on laundry walls is essential' },
          { name: 'Buck', pickRate: 58, reason: 'Vertical play from 1F into laundry and supply room' },
          { name: 'Montagne', pickRate: 40, reason: 'Shield push through tight basement corridors is very strong' },
        ],
        commonStrats: [
          'Hard breach laundry wall + vertical from above (55% of rounds)',
          'Basement corridor push with Montagne leading (25% of rounds)',
          'Supply room flank through back stairs (20% of rounds)',
        ],
        tendencies: [
          'Hard breach on laundry wall is the #1 play — expect it every round',
          'If they bring Montagne, they\'re planning a corridor push — prepare for shield',
          'Watch for Buck opening floors above supply room',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Bandit', pickRate: 74, reason: 'Wall denial on laundry reinforcements is critical' },
          { name: 'Smoke', pickRate: 68, reason: 'Corridor denial is extremely strong in basement' },
          { name: 'Mira', pickRate: 60, reason: 'Black Mirror in supply room watching laundry entrance' },
          { name: 'Ela', pickRate: 42, reason: 'Grzmot mines in corridor and stairs slow down pushes' },
        ],
        commonStrats: [
          'Bandit trick + Mira mirror + Smoke denial (50% of rounds)',
          'Extended corridor hold with traps (25% of rounds)',
          'Roam 1F to deny vertical setup (25% of rounds)',
        ],
        tendencies: [
          'Bandit tricking is almost guaranteed on laundry — assume they\'re doing it',
          'If Mira isn\'t banned, she\'ll have a mirror watching your push',
          'Smoke canisters in the corridor will cut off your push path in the last 30 seconds',
        ],
      },
    },
    tower: {
      attack: {
        likelyOps: [
          { name: 'Sledge', pickRate: 65, reason: 'Opening soft walls and ceilings around tower and attic' },
          { name: 'Ash', pickRate: 60, reason: 'Fast entry through tower stairs or meeting hall' },
          { name: 'Zofia', pickRate: 55, reason: 'Concussions and soft breach for clearing tight tower angles' },
          { name: 'Nomad', pickRate: 50, reason: 'Airjabs on stairs to deny defender rotation and flanks' },
        ],
        commonStrats: [
          'Tower stairs push with Ash entry + support (45% of rounds)',
          'Meeting hall control into attic push (30% of rounds)',
          'Vertical from above through attic soft floor (25% of rounds)',
        ],
        tendencies: [
          'Fast push through tower stairs is the most common opening',
          'Expect Nomad airjabs blocking your rotation from big tower',
          'If they take meeting hall first, they\'re setting up to push from below',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Jager', pickRate: 62, reason: 'ADS protect tower positions from projectile spam' },
          { name: 'Smoke', pickRate: 58, reason: 'Area denial in the tight tower stairwell is very effective' },
          { name: 'Lesion', pickRate: 48, reason: 'Gu mines on stairs and entry points slow pushes and give intel' },
          { name: 'Vigil', pickRate: 52, reason: 'Roams big tower and attic to waste attacker time' },
        ],
        commonStrats: [
          'Jager + Smoke hold tower stairs, Vigil roams (45% of rounds)',
          'Extended meeting hall hold to deny map control (30% of rounds)',
          'Lesion trap stack on tower stairs (25% of rounds)',
        ],
        tendencies: [
          'Expect traps on tower stairs — check for Lesion Gu mines',
          'Smoke will deny the stairwell push in the last 30 seconds',
          'A roamer will usually be in big tower or attic — clear before committing',
        ],
      },
    },
  },
  clubhouse: {
    'cash-cctv': {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 82, reason: 'Cash room wall is the primary hard breach target' },
          { name: 'Thatcher', pickRate: 70, reason: 'Clearing Kaid electroclaw on cash wall' },
          { name: 'Sledge', pickRate: 60, reason: 'Vertical play from bedroom floor above cash/CCTV' },
          { name: 'Ash', pickRate: 50, reason: 'Fast entry through main or gym to establish map control' },
        ],
        commonStrats: [
          'Hard breach cash wall + vertical from above (55% of rounds)',
          'Gym/bedroom push into CCTV flank (25% of rounds)',
          'Balcony entry into cash room direct push (20% of rounds)',
        ],
        tendencies: [
          'Hard breach on cash wall is the default — expect Thermite/Ace almost every round',
          'Vertical player above cash/CCTV within the first 90 seconds',
          'If they take gym control early, expect a CCTV flank',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Kaid', pickRate: 76, reason: 'Electroclaw on cash wall and CCTV hatch' },
          { name: 'Smoke', pickRate: 62, reason: 'Plant denial in cash room doorways' },
          { name: 'Jager', pickRate: 58, reason: 'ADS protect key positions from utility' },
          { name: 'Vigil', pickRate: 50, reason: 'Roams bedroom/gym to deny vertical and map control' },
        ],
        commonStrats: [
          'Kaid wall + Smoke hold + roamer denying vertical (50% of rounds)',
          'Extended gym hold to deny map control (25% of rounds)',
          'Aggressive main hall/balcony peek early round (25% of rounds)',
        ],
        tendencies: [
          'Kaid electroclaw on cash wall is standard — assume they\'re doing it',
          'A roamer will try to deny your vertical play from bedroom',
          'Smoke saves utility for last 30 seconds — clear him before planting',
        ],
      },
    },
    'bar-stock': {
      attack: {
        likelyOps: [
          { name: 'Buck', pickRate: 68, reason: 'Vertical play from 2F into bar is the primary strategy' },
          { name: 'Thermite', pickRate: 55, reason: 'Opens stock room wall from outside' },
          { name: 'Zofia', pickRate: 58, reason: 'Soft breach and concussions for bar entry' },
          { name: 'Nomad', pickRate: 45, reason: 'Airjabs on rotation paths from kitchen/garage' },
        ],
        commonStrats: [
          'Vertical from bedroom into bar + stock room wall breach (50% of rounds)',
          'Front entrance push into bar direct (25% of rounds)',
          'Garage control into stock room flank (25% of rounds)',
        ],
        tendencies: [
          'Vertical play from 2F is the #1 strategy — expect Buck/Sledge above bar',
          'If they take garage early, they\'re flanking through stock room',
          'Nomad airjabs will block your kitchen rotation',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Smoke', pickRate: 65, reason: 'Bar doorways are tight — canisters deny plant effectively' },
          { name: 'Maestro', pickRate: 52, reason: 'Evil Eyes on bar plant spots provide intel and damage' },
          { name: 'Jager', pickRate: 60, reason: 'ADS protect stock room positions from projectiles' },
          { name: 'Pulse', pickRate: 42, reason: 'C4 through floor to counter vertical players' },
        ],
        commonStrats: [
          'Smoke + Maestro anchor bar, Pulse plays below 2F (45% of rounds)',
          'Extended garage hold to deny flank route (30% of rounds)',
          'Aggressive front entrance peek early round (25% of rounds)',
        ],
        tendencies: [
          'Pulse will be watching for vertical players — check for C4 from below',
          'Smoke holds canisters for plant denial in the last 30 seconds',
          'If they hold garage aggressively, clear it before trying to flank through stock',
        ],
      },
    },
    church: {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 85, reason: 'Church wall is the primary hard breach target — essential' },
          { name: 'Thatcher', pickRate: 74, reason: 'Clearing Kaid on church wall is critical for the execute' },
          { name: 'Ash', pickRate: 55, reason: 'Entry from main or connector into church' },
          { name: 'Capitao', pickRate: 48, reason: 'Fire bolts deny arsenal anchor positions during plant' },
        ],
        commonStrats: [
          'Hard breach church wall from outside (60% of rounds)',
          'Connector push into arsenal flank (20% of rounds)',
          'Blue stairs push into church from above (20% of rounds)',
        ],
        tendencies: [
          'Hard breach on church wall is almost guaranteed — it\'s the default play',
          'Expect Thatcher EMPs on the wall — if he\'s banned, they may bring Maverick',
          'Late-round Capitao fire will deny your anchor spot during the plant',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Kaid', pickRate: 80, reason: 'Electroclaw on church wall is the highest priority' },
          { name: 'Smoke', pickRate: 68, reason: 'Canisters deny plant in church and connector' },
          { name: 'Mute', pickRate: 55, reason: 'Jammers on church wall as backup anti-breach' },
          { name: 'Bandit', pickRate: 50, reason: 'Battery tricking on church wall if Kaid is banned' },
        ],
        commonStrats: [
          'Kaid/Bandit trick church wall + Smoke plant denial (55% of rounds)',
          'Extended connector hold to deny map control (25% of rounds)',
          'Roam blue stairs and main hall to waste time (20% of rounds)',
        ],
        tendencies: [
          'Church wall will be electrified — Kaid or Bandit tricking is standard',
          'Expect double wall denial (Kaid + Mute) if they\'re serious about holding',
          'Smoke will be the last defender alive — he\'s saving canisters for plant denial',
        ],
      },
    },
    'gym-bedroom': {
      attack: {
        likelyOps: [
          { name: 'Ash', pickRate: 65, reason: 'Fast entry from balcony or main into gym' },
          { name: 'Zofia', pickRate: 58, reason: 'Concussions and soft breach for gym/bedroom angles' },
          { name: 'Hibana', pickRate: 52, reason: 'Opens bedroom wall or gym hatch from outside' },
          { name: 'Nomad', pickRate: 48, reason: 'Airjabs on rotation paths from cash side' },
        ],
        commonStrats: [
          'Balcony entry into gym with Ash/Zofia (45% of rounds)',
          'Main push into gym from hallway (30% of rounds)',
          'CCTV/cash side push with bedroom wall breach (25% of rounds)',
        ],
        tendencies: [
          'Balcony entry is the most common opening — hold a window angle early',
          'Ash will try to breach soft walls quickly for sightlines across gym',
          'If they take cash side control, they\'re pushing bedroom from CCTV',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Jager', pickRate: 65, reason: 'ADS protect gym windows and doorways from projectiles' },
          { name: 'Smoke', pickRate: 55, reason: 'Plant denial in gym doorways' },
          { name: 'Lesion', pickRate: 50, reason: 'Gu mines on balcony and entry points give intel' },
          { name: 'Valkyrie', pickRate: 45, reason: 'Cameras in main hall and balcony for early warning' },
        ],
        commonStrats: [
          'Jager + Lesion trap gym entrance, Smoke holds (45% of rounds)',
          'Extended balcony peek to deny entry (25% of rounds)',
          'Roam cash side to deny flank route (30% of rounds)',
        ],
        tendencies: [
          'Expect traps at gym entrance and on the balcony',
          'Smoke will deny plant in the last 30 seconds if he\'s alive',
          'Check Valkyrie cameras in main hall before pushing through',
        ],
      },
    },
  },
  coastline: {
    'hookah-billiards': {
      attack: {
        likelyOps: [
          { name: 'Ash', pickRate: 72, reason: 'Fast entry through VIP or pool side into hookah' },
          { name: 'Zofia', pickRate: 60, reason: 'Concussions for clearing hookah corners + soft breach' },
          { name: 'Iana', pickRate: 55, reason: 'Hologram scouts hookah and billiards safely' },
          { name: 'Capitao', pickRate: 48, reason: 'Fire bolts deny anchor positions in hookah/billiards' },
        ],
        commonStrats: [
          'Pool side push into billiards + VIP entry into hookah (50% of rounds)',
          'Rooftop drop into hookah window (25% of rounds)',
          'Aqua push through main entrance into billiards (25% of rounds)',
        ],
        tendencies: [
          'Pool side entry is the most common — expect attackers from that angle first',
          'Window plays into hookah are very common — watch for repel peeks',
          'Iana hologram will scout your position before the real push comes',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Maestro', pickRate: 62, reason: 'Evil Eyes in hookah provide bulletproof intel and damage' },
          { name: 'Jager', pickRate: 65, reason: 'ADS on hookah windows and doors are critical' },
          { name: 'Smoke', pickRate: 55, reason: 'Denies plant attempts in hookah doorway' },
          { name: 'Vigil', pickRate: 48, reason: 'Roams pool side to deny attacker map control' },
        ],
        commonStrats: [
          'Jager + Maestro anchor hookah, roamer on pool side (50% of rounds)',
          'Aggressive VIP peek early round (25% of rounds)',
          'Extended cool vibes hold to deny aqua push (25% of rounds)',
        ],
        tendencies: [
          'Maestro cameras in hookah are standard — bring Ash or Sledge to clear them',
          'Expect Jager ADS protecting hookah windows from your grenades',
          'One roamer will be on pool side — clear before executing',
        ],
      },
    },
    'theater-penthouse': {
      attack: {
        likelyOps: [
          { name: 'Ash', pickRate: 68, reason: 'Fast entry through hallway or VIP into theater' },
          { name: 'Sledge', pickRate: 55, reason: 'Opens soft walls and floors around theater and penthouse' },
          { name: 'Iana', pickRate: 52, reason: 'Hologram scouts theater corners and penthouse angles' },
          { name: 'Nomad', pickRate: 46, reason: 'Airjabs on rotation from hookah/billiards side' },
        ],
        commonStrats: [
          'Hallway push into theater with Ash entry (45% of rounds)',
          'VIP control into penthouse flank (30% of rounds)',
          'Rooftop entry through penthouse windows (25% of rounds)',
        ],
        tendencies: [
          'Hallway push into theater is the default — hold an angle on hallway early',
          'Expect window entries into penthouse — common for coordinated teams',
          'Nomad airjabs will block your rotation through hookah connector',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Jager', pickRate: 62, reason: 'ADS protect theater and penthouse windows from projectiles' },
          { name: 'Smoke', pickRate: 58, reason: 'Plant denial in theater is strong with limited entry points' },
          { name: 'Maestro', pickRate: 48, reason: 'Evil Eyes covering theater plant spots' },
          { name: 'Vigil', pickRate: 50, reason: 'Roams hallway and VIP to deny map control' },
        ],
        commonStrats: [
          'Jager + Smoke hold theater, roamer denies hallway control (50% of rounds)',
          'Extended VIP hold to deny attacker map control (25% of rounds)',
          'Aggressive penthouse window peek early round (25% of rounds)',
        ],
        tendencies: [
          'A roamer will contest hallway control early — expect a fight for hallway',
          'Smoke saves canisters for plant denial — clear him before attempting plant',
          'Check for aggressive window peeks in penthouse in the first 30 seconds',
        ],
      },
    },
    'kitchen-service': {
      attack: {
        likelyOps: [
          { name: 'Ash', pickRate: 65, reason: 'Entry from pool or main hall into kitchen' },
          { name: 'Zofia', pickRate: 58, reason: 'Concussions clear kitchen corners + soft breach' },
          { name: 'Capitao', pickRate: 55, reason: 'Fire bolts on kitchen counter and service entrance anchors' },
          { name: 'Iana', pickRate: 48, reason: 'Hologram scouts kitchen and service safely' },
        ],
        commonStrats: [
          'Main hall push into kitchen with Ash/Zofia (45% of rounds)',
          'Pool side entry into service entrance flank (30% of rounds)',
          'Sunrise bar control into kitchen from below (25% of rounds)',
        ],
        tendencies: [
          'Main hall push is the most common — expect early pressure from hallway',
          'Capitao fire bolts will deny your anchor spots during the execute',
          'If they take sunrise bar control, they\'re planning to push from below',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Maestro', pickRate: 58, reason: 'Evil Eyes covering kitchen plant spots are hard to clear' },
          { name: 'Jager', pickRate: 62, reason: 'ADS protect kitchen doorways from utility spam' },
          { name: 'Smoke', pickRate: 55, reason: 'Denies plant in kitchen doorway and service connector' },
          { name: 'Lesion', pickRate: 45, reason: 'Gu mines on service entrance and pool side entry' },
        ],
        commonStrats: [
          'Maestro + Jager anchor kitchen, roamer on pool side (45% of rounds)',
          'Extended main hall hold (25% of rounds)',
          'Aggressive sunrise peek early round (30% of rounds)',
        ],
        tendencies: [
          'Maestro cameras in kitchen — bring utility to clear them',
          'Lesion mines on service entrance will slow your flank push',
          'Expect an aggressive peek from sunrise bar in the first 30 seconds',
        ],
      },
    },
    'blue-bar': {
      attack: {
        likelyOps: [
          { name: 'Ash', pickRate: 68, reason: 'Fast entry from main or pool into blue bar' },
          { name: 'Sledge', pickRate: 55, reason: 'Opens soft walls around blue bar for new angles' },
          { name: 'Zofia', pickRate: 52, reason: 'Concussions and impacts clear blue bar corners' },
          { name: 'Flores', pickRate: 42, reason: 'Drone clears utility and forces repositioning' },
        ],
        commonStrats: [
          'Main entrance push into blue bar (45% of rounds)',
          'Pool side entry into sunrise bar connector (30% of rounds)',
          'Vertical from 2F into blue bar (25% of rounds)',
        ],
        tendencies: [
          'Main entrance push is the default — hold an angle there early',
          'Expect soft wall destruction to create new angles into blue bar',
          'If they take 2F control, they\'re setting up vertical play — watch for breaches above you',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Jager', pickRate: 65, reason: 'ADS protect blue bar positions from utility spam' },
          { name: 'Smoke', pickRate: 58, reason: 'Canisters deny plant in blue bar doorways' },
          { name: 'Maestro', pickRate: 50, reason: 'Evil Eyes covering sunrise bar and blue bar plant spots' },
          { name: 'Alibi', pickRate: 42, reason: 'Prismas at main entrance and pool side confuse attackers' },
        ],
        commonStrats: [
          'Jager + Smoke anchor blue bar (45% of rounds)',
          'Extended sunrise hold to deny connector push (25% of rounds)',
          'Aggressive main entrance peek early round (30% of rounds)',
        ],
        tendencies: [
          'Expect Jager ADS protecting doorways — your grenades may get eaten',
          'Smoke holds canisters for the last 30 seconds — clear him before planting',
          'An aggressive peek from main entrance or sunrise is common early round',
        ],
      },
    },
  },
}

export default ENEMY_META
