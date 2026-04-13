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
  kafe: {
    'reading-fireplace': {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 80, reason: 'Reading Room wall is the primary hard breach target on this site' },
          { name: 'Thatcher', pickRate: 68, reason: 'Clearing Kaid electroclaw on Reading wall is the standard support play' },
          { name: 'Buck', pickRate: 55, reason: 'Vertical from roof hatch into Fireplace Hall is very common' },
          { name: 'Capitao', pickRate: 48, reason: 'Fire bolts deny Fireplace anchor spots during late-round execute' },
        ],
        commonStrats: [
          'Hard breach Reading wall + vertical from roof hatch above Fireplace (55% of rounds)',
          'White stairs push into Reading with Ash entry (25% of rounds)',
          'Split push: cigar shop + white stairs pinch (20% of rounds)',
        ],
        tendencies: [
          'Hard breach on Reading wall is the default play — expect Thermite or Ace every round',
          'Vertical pressure through the roof hatch comes early — watch for Buck within 60 seconds',
          'Capitao fire bolts will target your Fireplace anchor position during the plant',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Kaid', pickRate: 75, reason: 'Electroclaw on Reading Room wall is the standard anti-breach setup' },
          { name: 'Smoke', pickRate: 65, reason: 'Denies plant in Fireplace Hall doorways and Reading Room connector' },
          { name: 'Vigil', pickRate: 52, reason: 'Roams white stairs and cigar shop to waste attacker time' },
          { name: 'Jager', pickRate: 58, reason: 'ADS protect anchor positions from Capitao bolts and grenades' },
        ],
        commonStrats: [
          'Kaid wall + Smoke anchor Fireplace, roamer on white stairs (50% of rounds)',
          'Extended cigar shop hold to deny map control (25% of rounds)',
          'Aggressive red stairs peek to catch early pushes (25% of rounds)',
        ],
        tendencies: [
          'Kaid tricking on Reading wall is standard — bring a counter or rush the breach',
          'One roamer will contest white stairs control early in the round',
          'Smoke saves canisters for the last 30 seconds — clear him before attempting plant',
        ],
      },
    },
    'mining-train': {
      attack: {
        likelyOps: [
          { name: 'Hibana', pickRate: 74, reason: 'Opens Mining Room wall at range from cigar balcony' },
          { name: 'Sledge', pickRate: 60, reason: 'Vertical from roof into Train Museum is a primary strategy' },
          { name: 'Thatcher', pickRate: 65, reason: 'Clears Bandit batteries on Mining Room wall' },
          { name: 'Ash', pickRate: 52, reason: 'Fast entry through white stairs or red stairs into site' },
        ],
        commonStrats: [
          'Hibana breach Mining wall + vertical from above Train Museum (50% of rounds)',
          'White stairs push with Ash entry into Mining Room (30% of rounds)',
          'Split push: cigar balcony + red stairs pinch (20% of rounds)',
        ],
        tendencies: [
          'Hibana will target Mining Room wall from cigar balcony — long range breach is standard',
          'Vertical play through roof hatch above Train Museum comes within the first 90 seconds',
          'If they take white stairs early, they are setting up a fast push into Mining',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Bandit', pickRate: 72, reason: 'Battery tricking on Mining Room wall is the default anti-breach' },
          { name: 'Maestro', pickRate: 55, reason: 'Evil Eyes on Train Museum plant spots provide intel and damage' },
          { name: 'Mute', pickRate: 50, reason: 'Jammers support Bandit on the wall and deny drone intel' },
          { name: 'Ela', pickRate: 45, reason: 'Roams freezer and white stairs with Grzmot mines' },
        ],
        commonStrats: [
          'Bandit trick wall + Maestro cameras on plant (50% of rounds)',
          'Extended white stairs hold to deny map control (25% of rounds)',
          'Roam heavy with 2 players off-site in freezer and cigar (25% of rounds)',
        ],
        tendencies: [
          'Bandit tricking is almost guaranteed on Mining wall — assume they are doing it',
          'Maestro cameras in Train Museum will provide intel on your push — clear them first',
          'A roamer will contest freezer or white stairs — clear before executing',
        ],
      },
    },
    'kitchen-bakery': {
      attack: {
        likelyOps: [
          { name: 'Ace', pickRate: 70, reason: 'Opens Kitchen wall from bakery corridor at range' },
          { name: 'Buck', pickRate: 62, reason: 'Vertical from Reading Room above Kitchen is very effective' },
          { name: 'Zofia', pickRate: 55, reason: 'Soft breach and concussions for clearing tight Kitchen angles' },
          { name: 'Flores', pickRate: 42, reason: 'Drones clear defender gadgets and force repositioning' },
        ],
        commonStrats: [
          'Hard breach Kitchen wall + vertical from Reading Room above (55% of rounds)',
          'Red stairs push into Kitchen with Ash/Zofia entry (25% of rounds)',
          'Bakery corridor push with utility clear (20% of rounds)',
        ],
        tendencies: [
          'Hard breach on Kitchen wall is the default — expect Ace or Thermite every round',
          'Vertical play from Reading Room floor above Kitchen comes within the first 90 seconds',
          'If they clear bakery corridor early, the execute is coming through there',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Mira', pickRate: 65, reason: 'Black Mirror between Kitchen and Bakery gives massive intel on the push' },
          { name: 'Smoke', pickRate: 62, reason: 'Denies plant in bakery corridor and Kitchen doorways' },
          { name: 'Jager', pickRate: 58, reason: 'ADS protect Mira window and anchor positions from projectiles' },
          { name: 'Vigil', pickRate: 48, reason: 'Roams above site to deny vertical play setup' },
        ],
        commonStrats: [
          'Mira mirror + Smoke denial in bakery corridor (50% of rounds)',
          'Extended freezer hold to deny rotation (25% of rounds)',
          'Roam above to deny Buck vertical play (25% of rounds)',
        ],
        tendencies: [
          'If Mira is not banned, expect a Black Mirror between Kitchen and Bakery',
          'Smoke holds canisters for the last 30 seconds — clear him before planting',
          'A roamer will play above site to contest vertical — check before committing Buck',
        ],
      },
    },
    'bar-cocktail': {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 78, reason: 'Bar wall is the primary hard breach target from main entrance' },
          { name: 'Sledge', pickRate: 58, reason: 'Vertical from Mining Room above Cocktail Lounge is common' },
          { name: 'Capitao', pickRate: 52, reason: 'Fire bolts deny bar counter anchor during execute' },
          { name: 'Thatcher', pickRate: 66, reason: 'Clears Kaid/Bandit on Bar wall before breach' },
        ],
        commonStrats: [
          'Hard breach Bar wall + vertical from Mining Room above (50% of rounds)',
          'Red stairs push into Cocktail Lounge (25% of rounds)',
          'Main entrance push with Ash/Zofia (25% of rounds)',
        ],
        tendencies: [
          'Hard breach on Bar wall from main entrance is the default — expect it every round',
          'Sledge or Buck will play vertical above Cocktail Lounge within the first 90 seconds',
          'Late-round Capitao fire will deny your bar counter anchor — reposition before execute',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Kaid', pickRate: 74, reason: 'Electroclaw on Bar wall is the standard anti-breach setup' },
          { name: 'Smoke', pickRate: 63, reason: 'Canisters deny plant at main entrance and bar counter' },
          { name: 'Jager', pickRate: 60, reason: 'ADS protect anchor positions from grenades and fire bolts' },
          { name: 'Alibi', pickRate: 44, reason: 'Prismas in freezer and cigar shop confuse attackers' },
        ],
        commonStrats: [
          'Kaid wall + Smoke hold + roamer on freezer (50% of rounds)',
          'Extended red stairs hold to deny attacker map control (25% of rounds)',
          'Aggressive main entrance peek early round (25% of rounds)',
        ],
        tendencies: [
          'Kaid electroclaw on Bar wall is standard — assume they are tricking',
          'Smoke saves utility for the last 30 seconds to deny plant at main entrance',
          'Watch for an aggressive peek from red stairs in the first 15 seconds',
        ],
      },
    },
  },
  consulate: {
    'consul-meeting': {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 82, reason: 'Consul Office wall is the primary hard breach target — almost every attack team brings him' },
          { name: 'Thatcher', pickRate: 70, reason: 'Clearing Kaid electroclaw on Consul wall is the default support play' },
          { name: 'Buck', pickRate: 55, reason: 'Vertical from roof hatch above Meeting Room is a primary strategy' },
          { name: 'Nomad', pickRate: 48, reason: 'Airjabs on yellow stairs and connector watch flanks' },
        ],
        commonStrats: [
          'Hard breach Consul wall + vertical from roof above Meeting Room (55% of rounds)',
          'Piano room control into Consul push (25% of rounds)',
          'Balcony entry with split push from yellow stairs (20% of rounds)',
        ],
        tendencies: [
          'Hard breach on Consul wall is the default — expect Thermite or Ace every round',
          'Vertical from roof hatch comes within the first 90 seconds',
          'If they take piano room early, they are setting up a coordinated push',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Kaid', pickRate: 76, reason: 'Electroclaw on Consul Office wall is the highest priority setup' },
          { name: 'Smoke', pickRate: 64, reason: 'Denies plant in Meeting Room doorway and connector' },
          { name: 'Vigil', pickRate: 52, reason: 'Roams yellow stairs and admin office to waste time' },
          { name: 'Mute', pickRate: 50, reason: 'Jammers on wall and drone holes deny intel and support anti-breach' },
        ],
        commonStrats: [
          'Kaid wall + Smoke anchor Meeting Room, roamer on yellow stairs (50% of rounds)',
          'Extended piano room hold to deny map control (25% of rounds)',
          'Aggressive balcony peek early round (25% of rounds)',
        ],
        tendencies: [
          'Kaid tricking on Consul wall is standard — bring a counter or rush the breach',
          'One roamer will play yellow stairs or admin — clear before committing',
          'Smoke saves canisters for plant denial in the last 30 seconds',
        ],
      },
    },
    'lobby-press': {
      attack: {
        likelyOps: [
          { name: 'Hibana', pickRate: 72, reason: 'Opens Lobby reinforced wall from main entrance at range' },
          { name: 'Sledge', pickRate: 58, reason: 'Vertical from Consul Office floor above Press Room is common' },
          { name: 'Zofia', pickRate: 55, reason: 'Soft breach and concussions for clearing Lobby corners' },
          { name: 'Ash', pickRate: 52, reason: 'Fast entry from visa entrance into Lobby' },
        ],
        commonStrats: [
          'Hard breach Lobby wall + vertical from above Press Room (50% of rounds)',
          'Visa entrance push into Lobby with Ash entry (30% of rounds)',
          'Main entrance push into Front Desk control (20% of rounds)',
        ],
        tendencies: [
          'Hard breach on Lobby wall is the standard — expect Hibana or Ace from main entrance',
          'Vertical play from Consul Office floor above comes early in the round',
          'If they take visa office control, they are flanking through visa entrance',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Mira', pickRate: 65, reason: 'Black Mirror between Lobby and Press Room gives massive intel advantage' },
          { name: 'Smoke', pickRate: 60, reason: 'Denies plant in visa corridor and Lobby doorways' },
          { name: 'Jager', pickRate: 58, reason: 'ADS protect Mira window and anchor spots from grenades' },
          { name: 'Ela', pickRate: 45, reason: 'Roams upstairs with Grzmot mines on yellow stairs' },
        ],
        commonStrats: [
          'Mira mirror + Smoke denial at visa corridor (50% of rounds)',
          'Extended spiral stairs hold to deny flank (25% of rounds)',
          'Roam heavy upstairs to deny vertical play (25% of rounds)',
        ],
        tendencies: [
          'If Mira is not banned, expect a Black Mirror between Lobby and Press Room',
          'Smoke holds canisters for plant denial — clear him before attempting plant',
          'Check for Ela Grzmot mines on yellow stairs before pushing',
        ],
      },
    },
    'garage-cafeteria': {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 85, reason: 'Garage wall is the primary breach target — essential for opening up basement' },
          { name: 'Thatcher', pickRate: 72, reason: 'Clearing Bandit on Garage wall is critical for the hard breach' },
          { name: 'Buck', pickRate: 58, reason: 'Vertical from 1F above Cafeteria pressures defenders off default spots' },
          { name: 'Gridlock', pickRate: 44, reason: 'Trax on spiral stairs deny the rotation from above' },
        ],
        commonStrats: [
          'Hard breach Garage wall + vertical from 1F above Cafeteria (55% of rounds)',
          'Spiral stairs push into basement corridor (25% of rounds)',
          'Full basement rush through Garage door with utility dump (20% of rounds)',
        ],
        tendencies: [
          'Hard breach on Garage wall is almost guaranteed — it is the default play',
          'Vertical play from 1F comes within the first 60 seconds — watch for Buck above',
          'If they take spiral stairs early, they are setting up a corridor push',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Bandit', pickRate: 78, reason: 'Tricking Garage wall is the highest priority — standard every round' },
          { name: 'Smoke', pickRate: 68, reason: 'Basement corridor denial is extremely strong with limited paths' },
          { name: 'Mute', pickRate: 55, reason: 'Jammers support Bandit on Garage wall and deny drone intel' },
          { name: 'Pulse', pickRate: 42, reason: 'C4 through ceiling against vertical players on 1F' },
        ],
        commonStrats: [
          'Bandit trick Garage wall + Smoke hold corridor, Pulse plays C4 below (50% of rounds)',
          'Extended 1F hold to deny vertical play setup (25% of rounds)',
          'Aggressive spiral stairs roam to waste time (25% of rounds)',
        ],
        tendencies: [
          'Bandit will be tricking Garage wall — always assume they are doing it',
          'Smoke saves canisters for the last 30 seconds to deny plant in corridor',
          'Watch for Pulse below 1F with C4 if you are playing vertical',
        ],
      },
    },
    'tellers-archives': {
      attack: {
        likelyOps: [
          { name: 'Ace', pickRate: 70, reason: 'Opens Tellers wall from main entrance side at range' },
          { name: 'Sledge', pickRate: 56, reason: 'Vertical from 2F above Archives pressures anchor positions' },
          { name: 'Nomad', pickRate: 50, reason: 'Airjabs on yellow stairs and spiral stairs watch flanks' },
          { name: 'Twitch', pickRate: 45, reason: 'Drone clears anti-breach gadgets on Tellers wall' },
        ],
        commonStrats: [
          'Hard breach Tellers wall + vertical from above Archives (50% of rounds)',
          'Visa office control into Tellers push (30% of rounds)',
          'Main entrance push with utility clear (20% of rounds)',
        ],
        tendencies: [
          'Hard breach on Tellers wall is the default — expect Ace or Thermite every round',
          'Vertical play from 2F above Archives comes within the first 90 seconds',
          'Nomad airjabs will block your rotation through yellow stairs late round',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Bandit', pickRate: 70, reason: 'Tricking Tellers wall to deny Ace is the standard play' },
          { name: 'Lesion', pickRate: 58, reason: 'Gu mines on every entry point for early warning and slow' },
          { name: 'Jager', pickRate: 56, reason: 'ADS protect site from flashbangs and projectiles' },
          { name: 'Valkyrie', pickRate: 46, reason: 'Cameras in visa office and spiral stairs for rotation intel' },
        ],
        commonStrats: [
          'Bandit trick wall + Lesion mines on entries (45% of rounds)',
          'Extended visa office hold to deny flank route (30% of rounds)',
          'Roam heavy with 2 players upstairs wasting time (25% of rounds)',
        ],
        tendencies: [
          'Bandit tricking on Tellers wall is common — listen for batteries and time your breach',
          'Check for Valkyrie cameras in visa office before pushing through',
          'Lesion mines will be on every entry point — slow down and check your feet',
        ],
      },
    },
  },
  chalet: {
    'master-office': {
      attack: {
        likelyOps: [
          { name: 'Hibana', pickRate: 76, reason: 'Opens Master Bedroom wall from balcony at range' },
          { name: 'Thatcher', pickRate: 66, reason: 'Clears Kaid electroclaw on Master wall before breach' },
          { name: 'Ash', pickRate: 58, reason: 'Fast entry from main stairs into hallway' },
          { name: 'Zofia', pickRate: 52, reason: 'Soft breach and concussions on Office walls and angles' },
        ],
        commonStrats: [
          'Hard breach Master wall from balcony + main stairs push (50% of rounds)',
          'Library control into Office push from hallway (30% of rounds)',
          'Balcony entry with split push from back stairs (20% of rounds)',
        ],
        tendencies: [
          'Hard breach on Master wall from balcony is the default — expect Hibana or Thermite',
          'Library control is usually the first objective before pushing Office',
          'If they take hallway control early, the execute is coming from main stairs',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Kaid', pickRate: 74, reason: 'Electroclaw on Master Bedroom wall is the standard anti-breach' },
          { name: 'Smoke', pickRate: 62, reason: 'Denies plant in hallway doorway and Office connector' },
          { name: 'Vigil', pickRate: 54, reason: 'Roams library and main stairs to deny map control' },
          { name: 'Jager', pickRate: 58, reason: 'ADS protect balcony windows and Office angles from projectiles' },
        ],
        commonStrats: [
          'Kaid wall + Smoke anchor site, roamer on library (50% of rounds)',
          'Extended hallway hold to deny main stairs push (25% of rounds)',
          'Aggressive balcony peek early round (25% of rounds)',
        ],
        tendencies: [
          'Kaid tricking on Master wall is standard — bring a counter or rush',
          'One roamer will contest library control — clear before committing',
          'Smoke holds canisters for the last 30 seconds to deny plant',
        ],
      },
    },
    'bar-gaming': {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 80, reason: 'Bar wall is the primary hard breach target from campfire side' },
          { name: 'Buck', pickRate: 62, reason: 'Vertical from Master Bedroom above Gaming Room is the primary pressure tool' },
          { name: 'Capitao', pickRate: 50, reason: 'Fire bolts deny bar counter anchor during execute' },
          { name: 'Thatcher', pickRate: 68, reason: 'Clears Bandit on Bar wall before breach' },
        ],
        commonStrats: [
          'Hard breach Bar wall + vertical from Master Bedroom above Gaming (55% of rounds)',
          'Trophy room push into Gaming Room flank (25% of rounds)',
          'Main entrance push with Ash/Zofia entry (20% of rounds)',
        ],
        tendencies: [
          'Hard breach on Bar wall from campfire is the default — expect it every round',
          'Vertical play from Master Bedroom above Gaming Room comes within the first 90 seconds',
          'If they take trophy room early, they are flanking into Gaming Room',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Bandit', pickRate: 74, reason: 'Tricking Bar wall to deny Thermite is standard every round' },
          { name: 'Maestro', pickRate: 55, reason: 'Evil Eyes on Gaming Room plant spots provide bulletproof intel' },
          { name: 'Jager', pickRate: 60, reason: 'ADS protect against Capitao bolts and grenades' },
          { name: 'Ela', pickRate: 46, reason: 'Roams trophy room and main stairs with Grzmot mines' },
        ],
        commonStrats: [
          'Bandit trick wall + Maestro cameras on Gaming Room plant (50% of rounds)',
          'Extended trophy room hold to deny flank route (25% of rounds)',
          'Aggressive campfire peek early round (25% of rounds)',
        ],
        tendencies: [
          'Bandit tricking on Bar wall is standard — assume they are doing it',
          'Maestro cameras in Gaming Room — bring Ash or Sledge to clear them',
          'Watch for an aggressive campfire peek in the first 15 seconds',
        ],
      },
    },
    'kitchen-trophy': {
      attack: {
        likelyOps: [
          { name: 'Ace', pickRate: 72, reason: 'Opens Kitchen wall from campfire side at range' },
          { name: 'Sledge', pickRate: 60, reason: 'Vertical from Office above Trophy Room pressures anchors' },
          { name: 'Zofia', pickRate: 55, reason: 'Soft breach into Trophy Room and concussions for clearing angles' },
          { name: 'Nomad', pickRate: 48, reason: 'Airjabs on back stairs and connector deny flanks' },
        ],
        commonStrats: [
          'Hard breach Kitchen wall + vertical from Office above Trophy Room (50% of rounds)',
          'Connector push with Zofia/Ash entry (30% of rounds)',
          'Campfire push through Kitchen wall breach (20% of rounds)',
        ],
        tendencies: [
          'Hard breach on Kitchen wall is the default — expect Ace or Thermite every round',
          'Vertical play from Office above Trophy Room comes within the first 90 seconds',
          'If they take connector early, they are pushing through to Trophy Room',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Mira', pickRate: 64, reason: 'Black Mirror between Kitchen and Trophy Room gives massive intel' },
          { name: 'Smoke', pickRate: 62, reason: 'Denies plant in connector and Kitchen doorway' },
          { name: 'Jager', pickRate: 58, reason: 'ADS protect Mira window from grenades' },
          { name: 'Vigil', pickRate: 48, reason: 'Roams above site to deny vertical play setup' },
        ],
        commonStrats: [
          'Mira mirror + Smoke denial at connector (50% of rounds)',
          'Extended back stairs hold to deny flank (25% of rounds)',
          'Roam above to deny Sledge vertical play (25% of rounds)',
        ],
        tendencies: [
          'If Mira is not banned, expect a Black Mirror between Kitchen and Trophy Room',
          'Smoke saves canisters for plant denial — kill him early',
          'A roamer will play above site to contest vertical — check before committing',
        ],
      },
    },
    'wine-snowmobile': {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 84, reason: 'Snowmobile Garage wall is the primary breach target — essential for basement' },
          { name: 'Thatcher', pickRate: 70, reason: 'Clearing Bandit on Garage wall is critical' },
          { name: 'Buck', pickRate: 60, reason: 'Vertical from Kitchen above Wine Cellar is the primary pressure play' },
          { name: 'Gridlock', pickRate: 44, reason: 'Trax on wine cellar stairs deny defender rotation' },
        ],
        commonStrats: [
          'Hard breach Garage wall + vertical from Kitchen above Wine Cellar (55% of rounds)',
          'Wine cellar stairs push into basement corridor (25% of rounds)',
          'Full basement rush through Garage door (20% of rounds)',
        ],
        tendencies: [
          'Hard breach on Garage wall is guaranteed — it is the only viable attack every round',
          'Vertical play from Kitchen above Wine Cellar comes within the first 60 seconds',
          'If they take wine cellar stairs early, they are pushing from both sides',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Bandit', pickRate: 80, reason: 'Tricking Garage wall is the highest priority on this site' },
          { name: 'Smoke', pickRate: 70, reason: 'Basement corridor denial is devastating with limited paths' },
          { name: 'Mute', pickRate: 55, reason: 'Jammers support Bandit on Garage wall and deny drones' },
          { name: 'Pulse', pickRate: 45, reason: 'C4 through ceiling against vertical players in Kitchen' },
        ],
        commonStrats: [
          'Bandit trick Garage wall + Smoke corridor hold, Pulse plays C4 below (50% of rounds)',
          'Extended 1F hold to deny vertical play (25% of rounds)',
          'Aggressive wine cellar stairs roam (25% of rounds)',
        ],
        tendencies: [
          'Bandit tricking is guaranteed on Garage wall — always assume they are doing it',
          'Smoke saves canisters for the final 30 seconds to deny plant in corridor',
          'Pulse will be below Kitchen with C4 — be careful playing vertical',
        ],
      },
    },
  },
  border: {
    'armory-archives': {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 83, reason: 'Armory wall is the primary hard breach target — almost every team brings Thermite here' },
          { name: 'Thatcher', pickRate: 70, reason: 'If not banned, Thatcher is the default for clearing Kaid/Bandit on the Armory wall' },
          { name: 'Sledge', pickRate: 55, reason: 'Vertical play from above Archives through the soft ceiling is a common secondary strategy' },
          { name: 'Nomad', pickRate: 46, reason: 'Airjabs on main stairs and CCTV watch flanks during the execute' },
        ],
        commonStrats: [
          'Hard breach Armory wall + vertical pressure from above Archives (60% of rounds)',
          'East balcony push into offices with Ash/Zofia entry (22% of rounds)',
          'Split push: east balcony + main stairs pinch (18% of rounds)',
        ],
        tendencies: [
          'Most teams default to breaching the Armory wall — expect hard breach every round',
          'If they lose the wall breach, expect a fast rotate to the east balcony push',
          'Watch for Sledge or Buck playing above Archives within the first 60 seconds',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Kaid', pickRate: 77, reason: 'Electroclaw on Armory wall is the default anti-breach setup' },
          { name: 'Smoke', pickRate: 64, reason: 'Area denial in Archives doorways to deny late-round plant' },
          { name: 'Vigil', pickRate: 50, reason: 'Most common roamer — plays offices and east balcony to waste time' },
          { name: 'Mute', pickRate: 48, reason: 'Jammers on wall and drone denial are standard on this site' },
        ],
        commonStrats: [
          'Kaid wall + Smoke anchor Archives, roamer in offices (52% of rounds)',
          'Extended office hold to deny attacker map control (25% of rounds)',
          'Aggressive east balcony peek to catch early pushes (23% of rounds)',
        ],
        tendencies: [
          'Expect Kaid tricking on Armory wall — bring a counter or rush the breach',
          'One roamer will almost always contest offices or east balcony early',
          'Late-round Smoke canisters will deny your plant — clear anchors first',
        ],
      },
    },
    'workshop-ventilation': {
      attack: {
        likelyOps: [
          { name: 'Hibana', pickRate: 74, reason: 'Opens the Workshop wall from parking lot at range' },
          { name: 'Ash', pickRate: 63, reason: 'Fast entry through main lobby is the most common opening move' },
          { name: 'Buck', pickRate: 56, reason: 'Vertical from above Ventilation is a primary pressure strategy' },
          { name: 'Zofia', pickRate: 48, reason: 'Soft breach and concussions for clearing Workshop corners' },
        ],
        commonStrats: [
          'Hard breach Workshop wall + vertical above Ventilation (50% of rounds)',
          'Main lobby push into Workshop with Ash entry (30% of rounds)',
          'Supply corridor push with utility clear (20% of rounds)',
        ],
        tendencies: [
          'Hibana breach from parking lot is the standard — expect long-range breach every round',
          'Fast Ash push through main lobby is extremely common — have a player watching early',
          'If they take supply corridor control, they are setting up a late execute',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Bandit', pickRate: 72, reason: 'Wall denial on Workshop is critical — Bandit tricking is standard' },
          { name: 'Smoke', pickRate: 60, reason: 'Supply corridor denial is strong with limited attacker paths' },
          { name: 'Jager', pickRate: 65, reason: 'ADS protect anchors from projectile spam through windows' },
          { name: 'Ela', pickRate: 44, reason: 'Roams main lobby and central stairs with Grzmot mines' },
        ],
        commonStrats: [
          'Bandit trick wall + Smoke hold supply corridor (48% of rounds)',
          'Extended main lobby hold with Jager + roamer (28% of rounds)',
          'Aggressive parking lot peek early round (24% of rounds)',
        ],
        tendencies: [
          'Bandit tricking on Workshop wall is standard — listen for batteries and time your breach',
          'Expect Jager ADS protecting main doorways and windows',
          'At least one roamer will be in main lobby — clear before pushing site',
        ],
      },
    },
    'customs-supply': {
      attack: {
        likelyOps: [
          { name: 'Ace', pickRate: 72, reason: 'Opens Customs wall from exterior at range with S.E.L.M.A' },
          { name: 'Sledge', pickRate: 58, reason: 'Vertical from above Supply Room through the soft floor' },
          { name: 'Twitch', pickRate: 52, reason: 'Drone clears electronics on Customs wall before breach' },
          { name: 'Gridlock', pickRate: 44, reason: 'Trax on central stairs deny defender rotations during execute' },
        ],
        commonStrats: [
          'Hard breach Customs wall + vertical from above Supply Room (52% of rounds)',
          'Main lobby control into passport check push (28% of rounds)',
          'Full exterior push through Customs wall breach with utility dump (20% of rounds)',
        ],
        tendencies: [
          'Hard breach on Customs wall is the default — expect Ace or Thermite every round',
          'Vertical play from above Supply Room comes within the first 90 seconds',
          'If they take passport check early, they are setting up a corridor push',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Mira', pickRate: 66, reason: 'Black Mirror between Customs and Supply gives massive intel on the exterior push' },
          { name: 'Smoke', pickRate: 62, reason: 'Passport check corridor denial is devastating with limited paths' },
          { name: 'Mozzie', pickRate: 50, reason: 'Captured drones provide counter-intel on attacker setup outside' },
          { name: 'Alibi', pickRate: 42, reason: 'Roams main lobby and waiting room with prismas' },
        ],
        commonStrats: [
          'Mira mirror + Smoke denial in passport check corridor (48% of rounds)',
          'Extended main lobby hold to deny attacker map control (27% of rounds)',
          'Roam heavy with 2 players off-site wasting time (25% of rounds)',
        ],
        tendencies: [
          'If Mira is not banned, expect a Black Mirror between Customs and Supply',
          'Smoke saves canisters for the last 30 seconds — clear him before planting',
          'A roamer will contest main lobby — clear before committing to the push',
        ],
      },
    },
    'bathroom-tellers': {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 80, reason: 'Tellers wall is the primary hard breach target from east balcony side' },
          { name: 'Thatcher', pickRate: 68, reason: 'Clearing Kaid electroclaw on Tellers wall is the default support play' },
          { name: 'Buck', pickRate: 58, reason: 'Vertical from roof above Bathroom is a primary pressure strategy' },
          { name: 'Iana', pickRate: 47, reason: 'Hologram safely drones out Tellers and Bathroom before the execute' },
        ],
        commonStrats: [
          'Hard breach Tellers wall + vertical from above Bathroom (55% of rounds)',
          'Offices push into east balcony entry with Ash/Zofia (25% of rounds)',
          'Split push: east balcony + main stairs pinch (20% of rounds)',
        ],
        tendencies: [
          'Hard breach on Tellers wall is the default — expect Thermite or Ace every round',
          'Vertical play above Bathroom comes within the first 90 seconds',
          'If they take offices early, they are setting up an east balcony entry',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Kaid', pickRate: 75, reason: 'Electroclaw on Tellers wall is the standard anti-breach setup' },
          { name: 'Lesion', pickRate: 58, reason: 'Gu mines on every entry point for early warning and slow' },
          { name: 'Jager', pickRate: 56, reason: 'ADS protect key positions from grenades and flashes' },
          { name: 'Valkyrie', pickRate: 46, reason: 'Cameras in offices and east balcony give early warning on pushes' },
        ],
        commonStrats: [
          'Kaid wall + Lesion mines on entries, roamer in offices (48% of rounds)',
          'Extended offices hold to deny east balcony control (27% of rounds)',
          'Aggressive east balcony peek early round (25% of rounds)',
        ],
        tendencies: [
          'Kaid tricking on Tellers wall is standard — bring a counter or rush the breach',
          'Check for Valkyrie cameras in offices before pushing through',
          'Lesion mines will be on every entry point — slow down and check your feet',
        ],
      },
    },
  },
  lair: {
    'balcony-memorial': {
      attack: {
        likelyOps: [
          { name: 'Ace', pickRate: 80, reason: 'Memorial wall is the primary hard breach target — S.E.L.M.A is the safest option at range' },
          { name: 'Thatcher', pickRate: 70, reason: 'If not banned, Thatcher is the default for clearing Kaid on Memorial wall' },
          { name: 'Sledge', pickRate: 56, reason: 'Vertical play from above Balcony through the soft floor is a common secondary strategy' },
          { name: 'Iana', pickRate: 44, reason: 'Hologram safely scouts Balcony and Memorial before the final execute' },
        ],
        commonStrats: [
          'Hard breach Memorial wall + vertical pressure from above (58% of rounds)',
          'Connector push into Balcony with Ash/Zofia entry (24% of rounds)',
          'Split push: back stairs + main stairs pinch (18% of rounds)',
        ],
        tendencies: [
          'Most teams default to breaching Memorial wall — expect hard breach every round',
          'If they lose the wall breach, expect a fast rotate to connector push',
          'Watch for Sledge or Buck playing above site within the first 60 seconds',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Kaid', pickRate: 76, reason: 'Electroclaw on Memorial wall is the default anti-breach setup' },
          { name: 'Smoke', pickRate: 66, reason: 'Area denial in Balcony doorways to deny late-round plant attempts' },
          { name: 'Vigil', pickRate: 50, reason: 'Most common roamer — plays connector and main stairs to waste time' },
          { name: 'Jager', pickRate: 54, reason: 'ADS protect anchor positions from projectiles through windows' },
        ],
        commonStrats: [
          'Kaid wall + Smoke anchor Balcony, roamer in connector (52% of rounds)',
          'Extended connector hold to deny attacker map control (26% of rounds)',
          'Aggressive hallway peek to catch early pushes (22% of rounds)',
        ],
        tendencies: [
          'Expect Kaid tricking on Memorial wall — bring a counter or rush the breach',
          'One roamer will almost always contest connector or main stairs early',
          'Late-round Smoke canisters will deny your plant — clear anchors first',
        ],
      },
    },
    'surveillance-lounge': {
      attack: {
        likelyOps: [
          { name: 'Hibana', pickRate: 72, reason: 'Opens the Surveillance connector wall at range with X-KAIROS' },
          { name: 'Capitao', pickRate: 55, reason: 'Fire bolts deny anchor positions in Lounge corners during execute' },
          { name: 'Ash', pickRate: 60, reason: 'Fast entry from hallway is the most common opening move' },
          { name: 'Zofia', pickRate: 48, reason: 'Soft breach and concussions for clearing Surveillance corners' },
        ],
        commonStrats: [
          'Hard breach connector wall + Capitao fire to flush Lounge anchors (48% of rounds)',
          'Hallway push into Lounge with Ash entry (30% of rounds)',
          'Tech Room control into Surveillance flank (22% of rounds)',
        ],
        tendencies: [
          'Hibana breach on connector wall is the standard — expect long-range breach every round',
          'Fast Ash push through hallway is extremely common — have a player watching early',
          'If they take Tech Room, they are setting up a Surveillance flank',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Mira', pickRate: 68, reason: 'Black Mirror on Surveillance connector wall gives massive intel advantage' },
          { name: 'Maestro', pickRate: 54, reason: 'Evil Eyes on Lounge plant spots provide bulletproof intel and damage' },
          { name: 'Jager', pickRate: 62, reason: 'ADS protect Mira window and anchor positions from projectile spam' },
          { name: 'Alibi', pickRate: 43, reason: 'Roams hallway and stairs to slow the attacker push' },
        ],
        commonStrats: [
          'Mira mirror + Maestro cameras on Lounge plant spots (50% of rounds)',
          'Extended hallway hold with Jager + roamer (28% of rounds)',
          'Aggressive Tech Room roam to deny attacker control (22% of rounds)',
        ],
        tendencies: [
          'If Mira is not banned, expect a Black Mirror on the connector wall',
          'Expect Jager ADS protecting the Mira window and main doorways',
          'At least one roamer will be in hallway or Tech Room — clear before pushing site',
        ],
      },
    },
    'lab-workshop': {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 82, reason: 'Workshop wall is the primary hard breach target — Thermite is the reliable pick' },
          { name: 'Thatcher', pickRate: 68, reason: 'Clearing Bandit off Workshop wall from outside or above is the default support play' },
          { name: 'Buck', pickRate: 60, reason: 'Vertical destruction from 2F to deny anchor positions in R&D Lab' },
          { name: 'Gridlock', pickRate: 44, reason: 'Trax stingers on corridors deny defender rotations during execute' },
        ],
        commonStrats: [
          'Hard breach Workshop wall + Buck vertical from 2F (55% of rounds)',
          'Main Hall control into Lab push through side entrance (25% of rounds)',
          'Full utility dump on Workshop and fast execute (20% of rounds)',
        ],
        tendencies: [
          'Vertical play from 2F is the top strategy — expect Buck or Sledge above you',
          'Hard breacher will target the Workshop wall within the first 90 seconds',
          'If they take Main Hall control early, expect a side entrance push into Lab',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Bandit', pickRate: 74, reason: 'Wall denial on Workshop is critical — Bandit tricking is the standard play' },
          { name: 'Smoke', pickRate: 68, reason: 'Lab doorway denial is devastating with limited attacker entry paths' },
          { name: 'Mute', pickRate: 55, reason: 'Jammers support wall denial and block attacker drones' },
          { name: 'Ela', pickRate: 42, reason: 'Roams 2F and Main Hall to waste attacker time' },
        ],
        commonStrats: [
          'Bandit trick Workshop wall + Smoke hold Lab doorways (50% of rounds)',
          'Extended Main Hall hold to deny attacker map control (27% of rounds)',
          'Aggressive 2F roam to deny vertical play (23% of rounds)',
        ],
        tendencies: [
          'Bandit tricking on Workshop wall is guaranteed — listen for batteries and time your breach',
          'Smoke saves canisters for the last 30 seconds to deny plant',
          'Watch for Ela on 2F — she will contest your vertical player with Grzmot mines',
        ],
      },
    },
    'server-vault': {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 85, reason: 'Vault wall is the primary hard breach target — Thermite is essential for the basement push' },
          { name: 'Thatcher', pickRate: 72, reason: 'Clearing Kaid electroclaw on Vault wall and hatch is the default support play' },
          { name: 'Sledge', pickRate: 57, reason: 'Vertical from 1F above Server room denies anchor positions below' },
          { name: 'Nomad', pickRate: 46, reason: 'Airjabs on basement stairs catch flanking defenders during execute' },
        ],
        commonStrats: [
          'Hard breach Vault wall + vertical pressure from 1F above Server (55% of rounds)',
          'Corridor control into Server push through side room (25% of rounds)',
          'Full basement rush through stairs with utility dump (20% of rounds)',
        ],
        tendencies: [
          'Vertical play from 1F is the top strategy — expect Sledge or Buck above you',
          'Hard breacher targets the Vault wall within the first 90 seconds',
          'If they take corridor control early, expect a side room push into Server',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Kaid', pickRate: 80, reason: 'Electroclaw on Vault wall and hatch is the highest priority on this site' },
          { name: 'Smoke', pickRate: 72, reason: 'Corridor denial is devastating with limited basement entry paths' },
          { name: 'Mozzie', pickRate: 52, reason: 'Captured drones provide counter-intel on attacker setup in corridor' },
          { name: 'Pulse', pickRate: 45, reason: 'C4 through ceiling from below 1F counters vertical players' },
        ],
        commonStrats: [
          'Kaid wall + Smoke corridor hold, Pulse plays C4 above (48% of rounds)',
          'Extended 1F hold to deny vertical play setup (27% of rounds)',
          'Aggressive basement stairs roam to catch early pushes (25% of rounds)',
        ],
        tendencies: [
          'Kaid tricking is guaranteed on Vault wall — always assume they are doing it',
          'Smoke saves canisters for the final 30 seconds to deny plant in corridor',
          'Pulse will be above Server on 1F with C4 — be careful playing vertical',
        ],
      },
    },
  },

  skyscraper: {
    'tea-room': {
      attack: {
        likelyOps: [
          { name: 'Buck', pickRate: 78, reason: 'Vertical play from above Tea Room is the primary attack strategy on this site' },
          { name: 'Ash', pickRate: 65, reason: 'Fast entry through Geisha window or balcony is the most common opening' },
          { name: 'Zofia', pickRate: 52, reason: 'Concussions and soft breach for clearing site corners and opening rotations' },
          { name: 'Nomad', pickRate: 44, reason: 'Airjabs on Dragon and hallway cover flanks during the execute' },
        ],
        commonStrats: [
          'Vertical play from above + Geisha window entry (55% of rounds)',
          'Balcony push into Tea Room with Ash/Zofia entry (25% of rounds)',
          'Split push: Dragon hallway + Geisha pinch (20% of rounds)',
        ],
        tendencies: [
          'Most teams default to vertical play from above — expect Buck or Sledge on the roof early',
          'Geisha window is the most common entry point — have someone watching it',
          'If they take Exhibition control early, they are setting up a Dragon hallway push',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Smoke', pickRate: 72, reason: 'Area denial in Tea Room doorways is essential for late-round plant denial' },
          { name: 'Jager', pickRate: 65, reason: 'ADS protect Geisha window and balcony doors from projectile spam' },
          { name: 'Vigil', pickRate: 55, reason: 'Most common roamer — usually plays Geisha or Exhibition' },
          { name: 'Mute', pickRate: 48, reason: 'Jammers deny drone intel and protect rotation holes' },
        ],
        commonStrats: [
          'Anchor Tea Room with Smoke + Mute, Vigil roams Geisha (50% of rounds)',
          'Extended Exhibition hold to deny attacker map control (28% of rounds)',
          'Aggressive Geisha peek to catch window entry early (22% of rounds)',
        ],
        tendencies: [
          'Smoke saves canisters for the last 30 seconds to deny plant',
          'One roamer almost always plays Geisha to intercept window entries',
          'Expect Jager ADS on Geisha window and balcony doors',
        ],
      },
    },
    bedroom: {
      attack: {
        likelyOps: [
          { name: 'Hibana', pickRate: 75, reason: 'Opens Bedroom reinforced wall from balcony at range' },
          { name: 'Thatcher', pickRate: 68, reason: 'Clears electronics on Bedroom wall if not banned' },
          { name: 'Sledge', pickRate: 54, reason: 'Vertical destruction from above to pressure Closet anchors' },
          { name: 'Gridlock', pickRate: 42, reason: 'Trax on rotation routes deny defender flanks during execute' },
        ],
        commonStrats: [
          'Hard breach Bedroom wall + vertical from above Closet (50% of rounds)',
          'Balcony push with Hibana opening wall at range (30% of rounds)',
          'Geisha control into Bedroom push through bathroom (20% of rounds)',
        ],
        tendencies: [
          'Expect hard breach on Bedroom wall every round — it is the default play',
          'If they take Geisha early, they are setting up a bathroom flank',
          'Late-round Gridlock trax will block your rotation from main stairs',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Kaid', pickRate: 74, reason: 'Electroclaw on Bedroom wall is the standard anti-breach setup' },
          { name: 'Lesion', pickRate: 60, reason: 'Gu mines on bathroom and hallway entries provide early warning' },
          { name: 'Jager', pickRate: 58, reason: 'ADS protect site from balcony window projectiles' },
          { name: 'Ela', pickRate: 45, reason: 'Roams Geisha and main stairs to waste attacker time' },
        ],
        commonStrats: [
          'Kaid wall + Lesion intel, Ela roams Geisha (48% of rounds)',
          'Extended bathroom hold with Jager ADS protecting angles (30% of rounds)',
          'Aggressive main stairs roam to deny attacker map control (22% of rounds)',
        ],
        tendencies: [
          'Kaid tricking on Bedroom wall is standard — bring a counter',
          'At least one roamer will play Geisha to intercept flanks',
          'Lesion mines will be on every entry point — move carefully',
        ],
      },
    },
    kitchen: {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 80, reason: 'Kitchen wall is the primary breach target — Thermite is the reliable pick' },
          { name: 'Thatcher', pickRate: 70, reason: 'Clears Bandit batteries on Kitchen wall from the exterior' },
          { name: 'Buck', pickRate: 58, reason: 'Vertical from 2F above BBQ to deny anchor positions' },
          { name: 'Nomad', pickRate: 46, reason: 'Airjabs on main stairs and Dragon cover flanks' },
        ],
        commonStrats: [
          'Hard breach Kitchen wall + vertical from 2F above BBQ (55% of rounds)',
          'Exterior push through Kitchen wall with Nomad flank watch (25% of rounds)',
          'Dragon hallway control into Kitchen side push (20% of rounds)',
        ],
        tendencies: [
          'Hard breacher will target Kitchen wall within the first 90 seconds',
          'Vertical play from 2F above BBQ is the most common secondary strategy',
          'If they take Dragon control early, expect a Kitchen side push',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Bandit', pickRate: 76, reason: 'Wall denial on Kitchen reinforcements is essential' },
          { name: 'Smoke', pickRate: 68, reason: 'Area denial in BBQ corridor denies plant attempts' },
          { name: 'Maestro', pickRate: 50, reason: 'Evil Eyes on Kitchen entry and plant spots provide intel through smoke' },
          { name: 'Vigil', pickRate: 44, reason: 'Roams 2F and Dragon to waste attacker time' },
        ],
        commonStrats: [
          'Bandit trick Kitchen wall + Smoke holds BBQ corridor (50% of rounds)',
          'Extended 2F hold to deny vertical play setup (28% of rounds)',
          'Aggressive Dragon roam to catch attackers rotating (22% of rounds)',
        ],
        tendencies: [
          'Bandit will be tricking the Kitchen wall — time your breach carefully',
          'Smoke saves canisters for late-round plant denial in BBQ',
          'One roamer usually plays 2F or Dragon to slow the push',
        ],
      },
    },
    'work-office': {
      attack: {
        likelyOps: [
          { name: 'Ace', pickRate: 72, reason: 'S.E.L.M.A opens Work Office wall safely from range' },
          { name: 'Twitch', pickRate: 58, reason: 'Drone clears electronics and ADS before breach' },
          { name: 'Sledge', pickRate: 52, reason: 'Opens soft walls between Exhibition and Office for new angles' },
          { name: 'Capitao', pickRate: 45, reason: 'Fire bolts flush anchors from behind desks during execute' },
        ],
        commonStrats: [
          'Hard breach Office wall + soft breach Exhibition connector (50% of rounds)',
          'Exhibition control into Work Office push (30% of rounds)',
          'Ventilation push with Capitao fire on anchor spots (20% of rounds)',
        ],
        tendencies: [
          'Expect hard breach on Office wall as the default strategy',
          'If they take Exhibition early, they are opening soft walls for angles',
          'Late-round Capitao fire will flush your anchor positions',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Mira', pickRate: 68, reason: 'Black Mirror between Exhibition and Work Office gives dominant intel' },
          { name: 'Smoke', pickRate: 62, reason: 'Canisters deny plant in Office doorways' },
          { name: 'Mozzie', pickRate: 48, reason: 'Captures attacker drones for counter-intel' },
          { name: 'Pulse', pickRate: 42, reason: 'Below-floor intel for C4 opportunities against vertical play' },
        ],
        commonStrats: [
          'Mira window hold + Smoke denial at doorways (45% of rounds)',
          'Extended Exhibition hold with Mozzie drone intel (30% of rounds)',
          'Pulse C4 from below against vertical players (25% of rounds)',
        ],
        tendencies: [
          'If Mira is not banned, expect a Black Mirror on Exhibition/Office wall',
          'Smoke canisters will deny your plant in the last 30 seconds',
          'Mozzie drones will be watching hallway and main stairs',
        ],
      },
    },
  },

  'theme-park': {
    'throne-room': {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 84, reason: 'Throne Room wall is the primary breach target on this site' },
          { name: 'Thatcher', pickRate: 72, reason: 'Clears Kaid/Bandit on Throne wall if not banned' },
          { name: 'Buck', pickRate: 60, reason: 'Vertical from above Armory to deny anchor positions' },
          { name: 'Capitao', pickRate: 48, reason: 'Fire bolts deny key positions behind Throne Room cover' },
        ],
        commonStrats: [
          'Hard breach Throne wall + vertical above Armory (55% of rounds)',
          'Connector push into Armory with Capitao fire (25% of rounds)',
          'Split push: Dragon stairs + Haunted balcony pinch (20% of rounds)',
        ],
        tendencies: [
          'Hard breacher targets Throne Room wall within the first 90 seconds',
          'Vertical play from above Armory is the most common secondary strategy',
          'If they take connector early, expect an Armory side push',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Kaid', pickRate: 78, reason: 'Electroclaw on Throne Room wall is the default anti-breach setup' },
          { name: 'Smoke', pickRate: 67, reason: 'Area denial in Armory doorways for late-round plant denial' },
          { name: 'Vigil', pickRate: 55, reason: 'Roams connector and Dragon stairs to waste time' },
          { name: 'Jager', pickRate: 52, reason: 'ADS protect key angles from projectile spam' },
        ],
        commonStrats: [
          'Kaid wall + Smoke Armory hold, Vigil roams connector (50% of rounds)',
          'Extended connector hold to deny attacker map control (28% of rounds)',
          'Aggressive Dragon stairs roam to catch early pushes (22% of rounds)',
        ],
        tendencies: [
          'Expect Kaid tricking on Throne Room wall — bring a counter or rush',
          'One roamer almost always plays connector or Dragon stairs',
          'Smoke saves canisters for the last 30 seconds to deny plant',
        ],
      },
    },
    lab: {
      attack: {
        likelyOps: [
          { name: 'Hibana', pickRate: 76, reason: 'Opens Lab reinforced wall at range from safety' },
          { name: 'Thatcher', pickRate: 66, reason: 'Clears Bandit batteries on Lab wall' },
          { name: 'Sledge', pickRate: 56, reason: 'Vertical from 2F above Storage to pressure anchors' },
          { name: 'Gridlock', pickRate: 44, reason: 'Trax deny rotations through connector and maintenance' },
        ],
        commonStrats: [
          'Hard breach Lab wall + vertical from 2F above Storage (52% of rounds)',
          'Maintenance push into Storage side with Gridlock covering (28% of rounds)',
          'Yellow corridor control into Lab front push (20% of rounds)',
        ],
        tendencies: [
          'Expect hard breach on Lab wall as the default strategy every round',
          'Vertical play from 2F above Storage is extremely common',
          'If they take yellow corridor early, they are setting up a front push on Lab',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Bandit', pickRate: 73, reason: 'Wall denial on Lab reinforcements is essential' },
          { name: 'Lesion', pickRate: 62, reason: 'Gu mines on maintenance and connector give early warning' },
          { name: 'Jager', pickRate: 56, reason: 'ADS protect site from grenades and flashbangs' },
          { name: 'Ela', pickRate: 45, reason: 'Roams 2F and yellow corridor to slow the push' },
        ],
        commonStrats: [
          'Bandit trick Lab wall + Lesion intel on entries (48% of rounds)',
          'Extended 2F hold to deny vertical play setup (28% of rounds)',
          'Aggressive yellow corridor roam to catch attackers early (24% of rounds)',
        ],
        tendencies: [
          'Bandit will be tricking the Lab wall — time your breach carefully',
          'At least one roamer will play 2F to deny vertical destruction',
          'Lesion mines will be on every entry point — clear carefully',
        ],
      },
    },
    office: {
      attack: {
        likelyOps: [
          { name: 'Ace', pickRate: 70, reason: 'S.E.L.M.A opens Office wall safely from the exterior' },
          { name: 'Twitch', pickRate: 60, reason: 'Drone clears gadgets before the breach' },
          { name: 'Zofia', pickRate: 54, reason: 'Concussions clear Initiation corners and open soft rotations' },
          { name: 'Ash', pickRate: 48, reason: 'Fast entry through connector for early pressure' },
        ],
        commonStrats: [
          'Hard breach Office wall + Zofia soft breach into Initiation (50% of rounds)',
          'Connector push with Ash entry and Twitch drone support (30% of rounds)',
          'Haunted stairs push into Initiation from below (20% of rounds)',
        ],
        tendencies: [
          'Hard breach on Office wall is the most common opening strategy',
          'Expect Zofia or Ash pushing through connector early for map control',
          'If they take Cafe, they are likely setting up a Haunted stairs push',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Mira', pickRate: 66, reason: 'Black Mirror between Office and Initiation gives dominant intel' },
          { name: 'Smoke', pickRate: 64, reason: 'Canisters deny plant in Office doorways' },
          { name: 'Mozzie', pickRate: 50, reason: 'Captured drones provide counter-intel in connector' },
          { name: 'Alibi', pickRate: 43, reason: 'Roams Cafe and Haunted stairs to slow the push' },
        ],
        commonStrats: [
          'Mira window hold + Smoke denial at Office doorways (48% of rounds)',
          'Extended connector hold with Mozzie intel (28% of rounds)',
          'Alibi roam Cafe and Haunted stairs to waste time (24% of rounds)',
        ],
        tendencies: [
          'If Mira is not banned, expect a Black Mirror on Office/Initiation wall',
          'Mozzie drones will be watching connector and Haunted stairs',
          'Smoke canisters are saved for the last 30 seconds to deny plant',
        ],
      },
    },
    bunk: {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 82, reason: 'Bunk wall is the primary breach target — Thermite is reliable' },
          { name: 'Thatcher', pickRate: 70, reason: 'Clears electronics on Bunk wall from the exterior' },
          { name: 'Buck', pickRate: 58, reason: 'Vertical from 2F above Day Care to deny anchors' },
          { name: 'Flores', pickRate: 44, reason: 'Exploding drones clear utility and force repositions' },
        ],
        commonStrats: [
          'Hard breach Bunk wall + vertical from 2F above Day Care (55% of rounds)',
          'Yellow corridor control into Bunk front push (25% of rounds)',
          'Arcade push into Day Care side with Flores utility clear (20% of rounds)',
        ],
        tendencies: [
          'Hard breach on Bunk wall is the default strategy every round',
          'Vertical play from 2F above Day Care is extremely common',
          'If they take arcade early, expect a Day Care side push',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Kaid', pickRate: 76, reason: 'Electroclaw on Bunk wall is the standard anti-breach' },
          { name: 'Smoke', pickRate: 66, reason: 'Area denial in Day Care corridor for plant denial' },
          { name: 'Mute', pickRate: 52, reason: 'Jammers deny drone intel and support wall denial' },
          { name: 'Vigil', pickRate: 46, reason: 'Roams 2F and yellow corridor to waste time' },
        ],
        commonStrats: [
          'Kaid wall + Smoke Day Care hold, Vigil roams 2F (50% of rounds)',
          'Extended 2F hold to deny vertical play above Day Care (27% of rounds)',
          'Aggressive arcade roam to catch early pushes (23% of rounds)',
        ],
        tendencies: [
          'Kaid tricking on Bunk wall is guaranteed — always assume it',
          'One roamer will play 2F to deny vertical destruction above Day Care',
          'Smoke saves canisters for the final 30 seconds to deny plant',
        ],
      },
    },
  },
  villa: {
    'aviator-games': {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 85, reason: 'Aviator wall is the primary breach target — nearly every attack team brings a hard breacher here' },
          { name: 'Thatcher', pickRate: 70, reason: 'If not banned, Thatcher is the go-to for clearing Bandit/Kaid on the Aviator wall' },
          { name: 'Buck', pickRate: 56, reason: 'Vertical play from Astronomy above is the most common secondary strategy' },
          { name: 'Nomad', pickRate: 44, reason: 'Airjabs on study and main stairs watch flanks during the execute' },
        ],
        commonStrats: [
          'Hard breach Aviator wall + vertical from Astronomy above (60% of rounds)',
          'Study push into Games Room with Ash/Zofia entry (25% of rounds)',
          'Split push: balcony + main stairs pinch (15% of rounds)',
        ],
        tendencies: [
          'Most teams default to breaching the Aviator wall — expect hard breach every round',
          'If they lose the wall breach, expect a fast rotate to study push',
          'Watch for Buck/Sledge playing above site from Astronomy in the first 60 seconds',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Bandit', pickRate: 76, reason: 'Wall denial on Aviator reinforcement is the default anti-breach setup' },
          { name: 'Smoke', pickRate: 64, reason: 'Area denial in Games Room doorways to deny late-round plant' },
          { name: 'Vigil', pickRate: 50, reason: 'Most common roamer — usually plays study and main stairs' },
          { name: 'Jager', pickRate: 66, reason: 'ADS protect anchors from projectile spam through windows and doorways' },
        ],
        commonStrats: [
          'Bandit trick Aviator wall + Smoke hold Games Room doorways (55% of rounds)',
          'Aggressive study roam with Vigil to waste attacker time (25% of rounds)',
          'Extended hold on main stairs to deny map control (20% of rounds)',
        ],
        tendencies: [
          'Bandit will be tricking the Aviator wall — bring a counter or rush the breach',
          'One roamer almost always plays around study and main stairs',
          'Late-round Smoke canisters will deny your plant — clear anchors first',
        ],
      },
    },
    'trophy-statuary': {
      attack: {
        likelyOps: [
          { name: 'Hibana', pickRate: 78, reason: 'Opens Trophy wall at range from balcony — safer than Thermite on this site' },
          { name: 'Capitao', pickRate: 54, reason: 'Fire bolts deny anchor positions behind Trophy displays during the execute' },
          { name: 'Sledge', pickRate: 52, reason: 'Vertical play from 3F above Statuary is a common secondary strategy' },
          { name: 'Zofia', pickRate: 60, reason: 'Red stairs entry with concussions is the most common opening move' },
        ],
        commonStrats: [
          'Hard breach Trophy wall from balcony + Sledge vertical above Statuary (55% of rounds)',
          'Red stairs push with Zofia/Ash into Statuary (30% of rounds)',
          'Classical hallway control into Trophy side push (15% of rounds)',
        ],
        tendencies: [
          'Hibana from balcony is the most common breach — expect ranged hard breach',
          'If they control red stairs early, they are setting up for a Statuary push',
          'Watch for Capitao fire bolts on your anchor spots in the last 30 seconds',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Kaid', pickRate: 72, reason: 'Electroclaw on Trophy wall and hatch is the default anti-breach setup' },
          { name: 'Maestro', pickRate: 58, reason: 'Evil Eyes on Statuary plant spots provide intel and damage through smoke' },
          { name: 'Ela', pickRate: 46, reason: 'Roams red stairs and bathroom with Grzmot mines to delay pushes' },
          { name: 'Mute', pickRate: 50, reason: 'Jammers on Trophy wall and drone entry deny intel and breach' },
        ],
        commonStrats: [
          'Kaid wall + Maestro cameras on Statuary plant spots (50% of rounds)',
          'Extended red stairs hold with Ela to deny attacker entry (30% of rounds)',
          'Aggressive roam through classical and bathroom to waste time (20% of rounds)',
        ],
        tendencies: [
          'Expect Kaid on Trophy wall — bring EMP or be ready for electrified reinforcements',
          'Maestro Evil Eyes will be on Statuary plant spots — bring utility to clear them',
          'At least one roamer plays red stairs or bathroom — clear before pushing site',
        ],
      },
    },
    'kitchen-dining': {
      attack: {
        likelyOps: [
          { name: 'Ace', pickRate: 74, reason: 'S.E.L.M.A charges open Dining wall safely from mudroom at range' },
          { name: 'Thatcher', pickRate: 66, reason: 'Clears electronic denial on Dining wall before hard breach' },
          { name: 'Buck', pickRate: 58, reason: 'Vertical destruction from 2F above Kitchen is a dominant attack strategy' },
          { name: 'Gridlock', pickRate: 42, reason: 'Trax stingers deny library hallway flanks during the execute' },
        ],
        commonStrats: [
          'Hard breach Dining wall + Buck vertical from 2F above Kitchen (55% of rounds)',
          'Mudroom push into Dining with Zofia/Ash entry (25% of rounds)',
          'Library hallway control into Kitchen side push (20% of rounds)',
        ],
        tendencies: [
          'Vertical play from 2F above Kitchen is the primary strategy — expect Buck above you',
          'Hard breacher will target the Dining wall within the first 90 seconds',
          'If they take library hallway control early, expect a Kitchen side push',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Mira', pickRate: 70, reason: 'Black Mirror on Kitchen/Pantry wall provides intel on mudroom pushes' },
          { name: 'Smoke', pickRate: 65, reason: 'Area denial in Dining Room doorways is critical for denying plant' },
          { name: 'Vigil', pickRate: 48, reason: 'Roams 2F and red stairs to delay attackers and deny vertical control' },
          { name: 'Thunderbird', pickRate: 40, reason: 'Kona stations keep Kitchen anchors alive through chip damage' },
        ],
        commonStrats: [
          'Mira window Kitchen + Smoke deny Dining plant (50% of rounds)',
          'Extended 2F hold to deny vertical play above Kitchen (30% of rounds)',
          'Aggressive red stairs roam to waste attacker time (20% of rounds)',
        ],
        tendencies: [
          'Mira window on Kitchen/Pantry wall is guaranteed — bring Twitch or Flores to counter',
          'Smoke saves canisters for the final 30 seconds to deny plant in Dining',
          'Watch for Vigil on 2F trying to deny your vertical control above Kitchen',
        ],
      },
    },
    'living-library': {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 80, reason: 'Library wall is the primary breach target — Thermite is the reliable pick' },
          { name: 'Twitch', pickRate: 55, reason: 'Drone clears Mira windows and electronics before the breach' },
          { name: 'Sledge', pickRate: 50, reason: 'Opens soft walls between Library and Piano room for new angles' },
          { name: 'Nomad', pickRate: 46, reason: 'Airjabs watch kitchen rotation and main stairs during execute' },
        ],
        commonStrats: [
          'Hard breach Library wall from garden + soft breach angles (55% of rounds)',
          'Main hall push into Living Room with entry fraggers (25% of rounds)',
          'Piano room control into Library side push (20% of rounds)',
        ],
        tendencies: [
          'Garden-side breach on Library wall is the default strategy — expect it every round',
          'If they take Piano room early, they are setting up side angles into Library',
          'Watch for Nomad airjabs on your rotation routes from kitchen',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Mira', pickRate: 75, reason: 'Black Mirror on Living Room wall dominates main hall sightlines' },
          { name: 'Kaid', pickRate: 68, reason: 'Electroclaw on Library wall and hatch is the standard anti-breach' },
          { name: 'Jager', pickRate: 62, reason: 'ADS protect Mira window and main doorways from projectile spam' },
          { name: 'Alibi', pickRate: 44, reason: 'Roams kitchen and 2F to delay attacker pushes' },
        ],
        commonStrats: [
          'Mira Living Room + Kaid Library wall, one roamer in kitchen (50% of rounds)',
          'Extended garden-side hold to deny breach setup (25% of rounds)',
          'Aggressive 2F roam to waste attacker time (25% of rounds)',
        ],
        tendencies: [
          'Mira window on Living Room wall is guaranteed — expect it and bring counter-utility',
          'Kaid will electrify Library wall — always assume it is electrified',
          'At least one roamer plays kitchen or 2F — clear before pushing site',
        ],
      },
    },
  },
  nighthaven: {
    'server-control': {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 86, reason: 'Server Room wall is the primary hard breach target — essential for basement takes' },
          { name: 'Thatcher', pickRate: 72, reason: 'If not banned, Thatcher clears all electronics on the Server wall' },
          { name: 'Buck', pickRate: 60, reason: 'Vertical destruction from 1F above Control Room is the top secondary strategy' },
          { name: 'Lion', pickRate: 42, reason: 'Scans catch defenders rotating during the execute in tight basement corridors' },
        ],
        commonStrats: [
          'Hard breach Server wall + Buck vertical from 1F above (60% of rounds)',
          'Utility tunnel push into Control Room with entry fraggers (25% of rounds)',
          'Full basement rush through elevator and back stairs (15% of rounds)',
        ],
        tendencies: [
          'Most teams default to breaching Server wall — expect hard breach every round',
          'Vertical play from 1F is the most common secondary — watch for Buck above you',
          'If they take tech lab early, they are setting up a Control Room push from the side',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Kaid', pickRate: 78, reason: 'Electroclaw on Server wall and overhead hatch is the default anti-breach' },
          { name: 'Smoke', pickRate: 68, reason: 'Area denial in basement corridor doorways stops late-round plants' },
          { name: 'Pulse', pickRate: 50, reason: 'Plays above on 1F with C4 to counter vertical attackers' },
          { name: 'Mute', pickRate: 54, reason: 'Jammers deny drones and hard breach on Server wall' },
        ],
        commonStrats: [
          'Kaid wall + Smoke corridor denial, Pulse above with C4 (50% of rounds)',
          'Extended 1F hold to deny vertical play above Control Room (30% of rounds)',
          'Aggressive elevator and back stairs roam to waste time (20% of rounds)',
        ],
        tendencies: [
          'Kaid tricking on Server wall is guaranteed — always assume it is electrified',
          'Pulse will be above on 1F with C4 — be careful playing vertical',
          'Smoke saves canisters for the final 30 seconds to deny plant in corridor',
        ],
      },
    },
    'assembly-production': {
      attack: {
        likelyOps: [
          { name: 'Hibana', pickRate: 76, reason: 'Opens Assembly wall at range from courtyard — safer than Thermite here' },
          { name: 'Capitao', pickRate: 52, reason: 'Fire bolts deny anchor positions behind Production equipment' },
          { name: 'Ash', pickRate: 64, reason: 'Fast lobby entry is the most common opening move on this site' },
          { name: 'Zofia', pickRate: 48, reason: 'Soft breach and concussions for clearing Production corners' },
        ],
        commonStrats: [
          'Hard breach Assembly wall from courtyard + lobby entry with Ash (55% of rounds)',
          'Connector push into Production with Zofia/Ash (25% of rounds)',
          'Loading bay control into Assembly side push (20% of rounds)',
        ],
        tendencies: [
          'Fast Ash push through lobby is extremely common — have a player watching lobby early',
          'Expect Capitao fire bolts on your anchor spots in the last 30 seconds',
          'If they control connector early, they are setting up a Production push',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Bandit', pickRate: 72, reason: 'Wall denial on Assembly reinforcement is the standard anti-breach' },
          { name: 'Maestro', pickRate: 56, reason: 'Evil Eyes on Production plant spots give intel and damage through smoke' },
          { name: 'Jager', pickRate: 66, reason: 'ADS protect anchors from projectile spam through courtyard openings' },
          { name: 'Alibi', pickRate: 44, reason: 'Roams lobby and connector to slow attacker pushes' },
        ],
        commonStrats: [
          'Bandit trick Assembly wall + Maestro cameras on Production (50% of rounds)',
          'Extended lobby hold with Jager + roamer (30% of rounds)',
          'Connector roam to deny attacker map control (20% of rounds)',
        ],
        tendencies: [
          'Bandit will be tricking Assembly wall — time your breach or bring a counter',
          'Expect Jager ADS protecting the courtyard-facing angles',
          'At least one roamer in lobby or connector — clear before pushing site',
        ],
      },
    },
    'briefing-meeting': {
      attack: {
        likelyOps: [
          { name: 'Ace', pickRate: 74, reason: 'S.E.L.M.A charges open Briefing wall safely from hallway at range' },
          { name: 'Thatcher', pickRate: 65, reason: 'Clears electronic denial on Briefing wall before the hard breach' },
          { name: 'Sledge', pickRate: 53, reason: 'Opens soft walls for angles into Meeting Room from adjacent rooms' },
          { name: 'Iana', pickRate: 48, reason: 'Hologram safely gathers intel through hallway and observation with zero risk' },
        ],
        commonStrats: [
          'Hard breach Briefing wall from hallway + soft breach angles into Meeting (55% of rounds)',
          'Terrace push into Meeting Room with entry fraggers (25% of rounds)',
          'Observation control into Briefing side push (20% of rounds)',
        ],
        tendencies: [
          'Hallway breach on Briefing wall is the default strategy — expect it every round',
          'If they control observation early, they are setting up angles into Briefing',
          'Watch for Iana hologram scouting through hallway before the real push',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Mira', pickRate: 70, reason: 'Black Mirror on Briefing wall provides intel on hallway pushes' },
          { name: 'Smoke', pickRate: 64, reason: 'Area denial in Meeting Room doorways stops late-round plant attempts' },
          { name: 'Vigil', pickRate: 50, reason: 'Roams main stairs and skybridge to waste attacker time' },
          { name: 'Wamai', pickRate: 46, reason: 'Mag-NETs catch projectiles near site to protect anchors' },
        ],
        commonStrats: [
          'Mira Briefing wall + Smoke Meeting doorways, roamer on main stairs (50% of rounds)',
          'Extended observation hold to deny attacker angles (30% of rounds)',
          'Aggressive skybridge roam to waste time (20% of rounds)',
        ],
        tendencies: [
          'Mira window on Briefing wall is expected — bring Twitch or Flores to counter',
          'Smoke saves canisters for the final 30 seconds to deny plant in Meeting',
          'One roamer will play main stairs or skybridge — clear before pushing site',
        ],
      },
    },
    'dormitory-bunks': {
      attack: {
        likelyOps: [
          { name: 'Thermite', pickRate: 82, reason: 'Dormitory wall is the primary breach target from the exterior balcony' },
          { name: 'Twitch', pickRate: 56, reason: 'Drone clears electronics and gadgets before the Dormitory wall breach' },
          { name: 'Buck', pickRate: 54, reason: 'Vertical destruction from roof above Bunks is a strong secondary strategy' },
          { name: 'Capitao', pickRate: 46, reason: 'Fire bolts flush anchors from behind bunk cover during the execute' },
        ],
        commonStrats: [
          'Hard breach Dormitory wall from balcony + Buck vertical from roof (55% of rounds)',
          'Hallway push into Bunks with entry fraggers (25% of rounds)',
          'Skybridge control into Dormitory side push (20% of rounds)',
        ],
        tendencies: [
          'Balcony breach on Dormitory wall is the default strategy — expect it every round',
          'If they take roof control early, they are setting up vertical play above Bunks',
          'Watch for Capitao fire bolts on bunk anchor spots in the last 30 seconds',
        ],
      },
      defense: {
        likelyOps: [
          { name: 'Kaid', pickRate: 74, reason: 'Electroclaw on Dormitory wall and overhead hatch is the standard anti-breach' },
          { name: 'Maestro', pickRate: 56, reason: 'Evil Eyes on Bunks plant spots provide intel through smoke' },
          { name: 'Ela', pickRate: 48, reason: 'Roams hallway and skybridge with Grzmot mines to delay pushes' },
          { name: 'Jager', pickRate: 62, reason: 'ADS protect anchors from grenades and flashes through balcony window' },
        ],
        commonStrats: [
          'Kaid wall + Maestro Bunks cameras, Ela roams hallway (50% of rounds)',
          'Extended hallway hold to deny attacker entry (30% of rounds)',
          'Aggressive skybridge roam to waste time and deny map control (20% of rounds)',
        ],
        tendencies: [
          'Kaid tricking on Dormitory wall is guaranteed — always assume it is electrified',
          'Maestro Evil Eyes will be on Bunks plant spots — bring utility to clear them',
          'At least one roamer plays hallway or skybridge — clear before pushing site',
        ],
      },
    },
  },
}

export default ENEMY_META
