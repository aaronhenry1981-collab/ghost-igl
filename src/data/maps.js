// Rainbow Six Siege maps with bomb sites.
// `rankedPool: true` flags maps currently in the competitive rotation.
// `comingSoon: true` marks maps that are listed but don't yet have strat data —
// MapSelector disables those cards. Remove the flag once strats.js has entries.
// `championOnly: true` restricts a map to Champion subscribers (legacy/non-ranked
// maps with full premium tactics live here). MapSelector shows a star badge and
// disables the card for non-Champions; StratsPage redirects URL access.

const MAPS = [
  {
    id: 'bank',
    name: 'Bank',
    rankedPool: true,
    sites: [
      { id: 'ceo', name: 'CEO Office / Executive Lounge', floor: '2F' },
      { id: 'open-area', name: 'Open Area / Staff Room', floor: '1F' },
      { id: 'tellers', name: "Teller's Office / Archives", floor: '1F' },
      { id: 'basement', name: 'Lockers / CCTV Room', floor: 'B' },
    ],
  },
  {
    id: 'border',
    name: 'Border',
    rankedPool: true,
    sites: [
      { id: 'armory-archives', name: 'Armory Lockers / Archives', floor: '2F' },
      { id: 'workshop-ventilation', name: 'Workshop / Ventilation Room', floor: '1F' },
      { id: 'customs-supply', name: 'Customs Inspection / Supply Room', floor: '1F' },
      { id: 'bathroom-tellers', name: 'Bathroom / Tellers', floor: '1F' },
    ],
  },
  {
    id: 'chalet',
    name: 'Chalet',
    rankedPool: true,
    sites: [
      { id: 'master-office', name: 'Master Bedroom / Office', floor: '2F' },
      { id: 'bar-gaming', name: 'Bar / Gaming Room', floor: '1F' },
      { id: 'kitchen-trophy', name: 'Kitchen / Dining Room', floor: '1F' },
      { id: 'wine-snowmobile', name: 'Wine Cellar / Snowmobile Garage', floor: 'B' },
    ],
  },
  {
    id: 'clubhouse',
    name: 'Clubhouse',
    rankedPool: true,
    sites: [
      { id: 'cash-cctv', name: 'Cash Room / CCTV Room', floor: '2F' },
      { id: 'bar-stock', name: 'Bar / Stock Room', floor: '1F' },
      { id: 'church', name: 'Church / Arsenal', floor: 'B' },
      { id: 'gym-bedroom', name: 'Gym / Bedroom', floor: '2F' },
    ],
  },
  {
    id: 'coastline',
    name: 'Coastline',
    rankedPool: true,
    sites: [
      { id: 'hookah-billiards', name: 'Hookah Lounge / Billiards Room', floor: '2F' },
      { id: 'theater-penthouse', name: 'Theater / Penthouse', floor: '2F' },
      { id: 'kitchen-service', name: 'Kitchen / Service Entrance', floor: '1F' },
      { id: 'blue-bar', name: 'Blue Bar / Sunrise Bar', floor: '1F' },
    ],
  },
  {
    // Consulate — modernized Sept 2025 (Operation High Stakes). Pre-2023
    // strats referenced "Press Room" and "Archives" which no longer exist.
    // Marked comingSoon until rewritten with current rooms (Piano/Expo,
    // Tellers/Servers, Cafeteria/Garage, Meeting/Consulate Office).
    id: 'consulate',
    name: 'Consulate',
    rankedPool: true,
    sites: [
      { id: 'consul-meeting', name: 'Consul Office / Meeting Room', floor: '2F' },
      { id: 'piano-expo', name: 'Piano Room / Exposition Room', floor: '1F' },
      { id: 'garage-cafeteria', name: 'Garage / Cafeteria', floor: 'B' },
      { id: 'tellers-servers', name: 'Tellers / Servers', floor: '1F' },
    ],
  },
  {
    // Emerald Plains — Ubisoft tags this Quick Match / Unranked / TDM only
    // (no Ranked tag). Site IDs corrected per r6calls/Liquipedia: real bomb
    // pairs are Admin/CEO, Gallery/Meeting, Bar/Lounge, Kitchen/Dining.
    // Marked comingSoon until strats are rewritten.
    id: 'emerald-plains',
    name: 'Emerald Plains',
    rankedPool: true,
    sites: [
      { id: 'admin-ceo', name: 'Administration / CEO Office', floor: '2F' },
      { id: 'gallery-meeting', name: 'Private Gallery / Meeting', floor: '2F' },
      { id: 'bar-lounge', name: 'Bar / Lounge', floor: '1F' },
      { id: 'kitchen-dining', name: 'Kitchen / Dining', floor: '1F' },
    ],
  },
  {
    id: 'favela',
    name: 'Favela',
    rankedPool: false,
    sites: [
      { id: 'bedroom-autoshop', name: 'Meth Lab / Packaging Room', floor: '3F' },
      { id: 'kitchen-meeting', name: 'Football Office / Football Bedroom', floor: '2F' },
      { id: 'market-party', name: "Biker's Apartment / Biker's Bedroom", floor: '1F' },
      { id: 'aunts-footsie', name: "Aunt's Bedroom / Aunt's Apartment", floor: '2F' },
    ],
  },
  {
    // Fortress — fully reworked Dec 2025 (Operation Tenfold Pursuit). Now
    // ranked-eligible. Old site IDs (Commander, Council, Tower) don't match
    // post-rework layout. Replaced with placeholder IDs to be confirmed
    // when Aaron writes strats; comingSoon stays until then.
    id: 'fortress',
    name: 'Fortress',
    rankedPool: false,
    sites: [
      { id: 'commander-briefing', name: 'Bedroom / Commander Office', floor: '2F' },
      { id: 'kitchen-dining', name: 'Dormitory / Briefing Room', floor: '2F' },
      { id: 'council-guard', name: 'Kitchen / Cafeteria', floor: '1F' },
      { id: 'tower-rooftop', name: 'Hammam / Sitting Room', floor: '1F' },
    ],
  },
  {
    id: 'hereford',
    name: 'Hereford Base',
    rankedPool: false,
    sites: [
      { id: 'dorms-office', name: 'Master Bedroom / Kids Room', floor: '2F' },
      { id: 'kitchen-dining', name: 'Kitchen / Dining Room', floor: '1F' },
      { id: 'briefing-stairs', name: 'Ammo Storage / Tractor Storage', floor: '3F' },
      { id: 'wine-cellar', name: 'Fermentation Chamber / Brewery', floor: 'B' },
    ],
  },
  {
    id: 'house',
    name: 'House',
    rankedPool: false,
    sites: [
      { id: 'master-closet', name: 'Master Bedroom / Closet', floor: '2F' },
      { id: 'kitchen-living', name: 'Kitchen / Living Room', floor: '1F' },
      { id: 'garage-workshop', name: 'Garage / Workshop', floor: '1F' },
      { id: 'boiler-laundry', name: 'Boiler / Laundry', floor: 'B' },
    ],
  },
  {
    // Kafe — modernized Siege X (June 2025). Floor labels were inverted in
    // the old data: Bar/Cocktail Lounge is the TOP floor (3F), not 1F. The
    // 2F has Fireplace/Mining as a single bombsite pair. Kitchen/Bakery
    // remains 1F.
    id: 'kafe',
    name: 'Kafe Dostoyevsky',
    rankedPool: true,
    sites: [
      { id: 'bar-cocktail', name: 'Bar / Cocktail Lounge', floor: '3F' },
      { id: 'reading-fireplace', name: 'Reading Room / Fireplace Hall', floor: '2F' },
      { id: 'mining-train', name: 'Mining Room / Fireplace Hall', floor: '2F' },
      { id: 'kitchen-bakery', name: 'Kitchen Service / Kitchen Cooking', floor: '1F' },
    ],
  },
  {
    // Kanal — re-added to ranked April 2026. Modern layout has no basement
    // bombsite. "Coast Guard Meeting" and "Engine Room" are not r6calls
    // labels for current Kanal. Site IDs flagged for Aaron to verify
    // in-game before strats are written.
    id: 'kanal',
    name: 'Kanal',
    rankedPool: true,
    sites: [
      { id: 'server-radio', name: 'Server Room / Radar Room', floor: '2F' },
      { id: 'kitchen-coast', name: 'Security Room / Map Room', floor: '1F' },
      { id: 'construction-control', name: 'Coast Guard Meeting / Lounge', floor: '1F' },
      { id: 'engine-supply', name: 'Kayaks / Supply Room', floor: 'B' },
    ],
  },
  {
    // Lair — modernized Sept 2025. Old site IDs (Balcony/Memorial,
    // Surveillance, Workshop, Vault) don't match in-game labels per
    // r6calls SVG. Replaced with authoritative bombsites. Marked
    // comingSoon until Aaron writes fresh strats with the new room names.
    id: 'lair',
    name: 'Lair',
    rankedPool: true,
    sites: [
      { id: 'master-r6', name: 'Master Office / R6 Room', floor: '2F' },
      { id: 'bunks-briefing', name: 'Bunks / Briefing', floor: '1F' },
      { id: 'armory-weapon', name: 'Armory / Weapon Maintenance', floor: '1F' },
      { id: 'lab-support', name: 'Lab / Lab Support', floor: 'B' },
    ],
  },
  {
    // Nighthaven Labs — modernized Sept 2025. Old site IDs referenced rooms
    // that don't exist (Briefing/Dormitory/Bunks/Production are not in the
    // r6calls SVG). Replaced with authoritative bombsites: Command/Server
    // (2F), Control/Storage (1F), Kitchen/Cafeteria (1F), Tank/Assembly (B).
    id: 'nighthaven',
    name: 'Nighthaven Labs',
    rankedPool: true,
    sites: [
      { id: 'command-server', name: 'Command / Server', floor: '2F' },
      { id: 'control-storage', name: 'Control / Storage', floor: '1F' },
      { id: 'kitchen-cafeteria', name: 'Kitchen / Cafeteria', floor: '1F' },
      { id: 'tank-assembly', name: 'Tank / Assembly', floor: 'B' },
    ],
  },
  {
    // Oregon — modernized March 2026 (Operation Silent Hunt). The "tower"
    // site Aaron previously listed isn't a real bombsite (Tower is a strat
    // callout, not a bomb pair). Removed and replaced with Kitchen/Dining
    // per Liquipedia. Marked comingSoon until strats are verified against
    // the post-Silent-Hunt layout.
    id: 'oregon',
    name: 'Oregon',
    rankedPool: true,
    sites: [
      { id: 'kids-dorms', name: "Kids' Dorms / Dorms Main Hall", floor: '2F' },
      { id: 'meeting-hall', name: 'Meeting Hall / Kitchen', floor: '1F' },
      { id: 'kitchen-dining', name: 'Kitchen / Dining Hall', floor: '1F' },
      { id: 'laundry', name: 'Laundry / Supply Room', floor: 'B' },
    ],
  },
  {
    // Outback — Operation High Calibre rework (Nov 2021) changed all 4
    // bomb pairs. Old IDs were pre-rework. Now ranked-eligible per Ubisoft.
    // Replaced with current pairs: Laundry/Piano, Party/Office, Green/Red
    // Bedrooms, Mechanic Shop/Kitchen.
    id: 'outback',
    name: 'Outback',
    rankedPool: true,
    sites: [
      { id: 'laundry-piano', name: 'Laundry / Piano', floor: '2F' },
      { id: 'party-office', name: 'Party / Office', floor: '2F' },
      { id: 'bedrooms', name: 'Green Bedroom / Red Bedroom', floor: '1F' },
      { id: 'mechanic-kitchen', name: 'Mechanic Shop / Kitchen', floor: '1F' },
    ],
  },
  {
    id: 'plane',
    name: 'Presidential Plane',
    rankedPool: false,
    sites: [
      { id: 'meeting-office', name: 'Meeting Room / Office', floor: '2F' },
      { id: 'security-cargo', name: 'Security Room / Cargo Hold', floor: '1F' },
      { id: 'kitchen-stateroom', name: 'Kitchen / Stateroom', floor: '1F' },
      { id: 'work-lobby', name: 'Work Room / Lobby', floor: '1F' },
    ],
  },
  {
    // Skyscraper — modernized Dec 2025. Floor labels were wrong on two
    // sites: Bedroom/Bathroom is actually 1F (was tagged 2F + wrong name
    // "Closet"); Work Office/Exhibition is actually 2F (was tagged 1F).
    // Verified against Liquipedia + r6calls SVG.
    id: 'skyscraper',
    name: 'Skyscraper',
    rankedPool: true,
    sites: [
      { id: 'tea-room', name: 'Tea Room / Karaoke', floor: '2F' },
      { id: 'work-office', name: 'Work Office / Exhibition', floor: '2F' },
      { id: 'kitchen', name: 'Kitchen / BBQ', floor: '1F' },
      { id: 'bedroom', name: 'Bedroom / Bathroom', floor: '1F' },
    ],
  },
  {
    id: 'stadium-bravo',
    name: 'Stadium Bravo',
    rankedPool: false,
    sites: [
      { id: 'medic-executive', name: 'Office / Target Room', floor: '2F' },
      { id: 'locker-dispensary', name: "Kids' Dormitory / Dormitory", floor: '2F' },
      { id: 'garage-press', name: 'Piano Room / Living Room', floor: '1F' },
      { id: 'nats-oregon', name: 'Piano Room / Kitchen', floor: '1F' },
    ],
  },
  {
    id: 'theme-park',
    name: 'Theme Park',
    rankedPool: true,
    sites: [
      { id: 'throne-room', name: 'Throne Room / Armory', floor: '1F' },
      { id: 'lab', name: 'Lab / Storage', floor: '1F' },
      { id: 'office', name: 'Office / Initiation', floor: '2F' },
      { id: 'bunk', name: 'Bunk / Day Care', floor: '2F' },
    ],
  },
  {
    id: 'tower',
    name: 'Tower',
    rankedPool: false,
    sites: [
      { id: 'bar-lounge', name: 'Gift Shop / Lantern Room', floor: '2F' },
      { id: 'ventilation-seating', name: 'Tea Room / Bar', floor: '1F' },
      { id: 'tea-exhibition', name: 'Restaurant / Bird Room', floor: '1F' },
      { id: 'ballroom-bedroom', name: 'Exhibit Room / Media Center', floor: '2F' },
    ],
  },
  {
    id: 'villa',
    name: 'Villa',
    rankedPool: true,
    sites: [
      { id: 'aviator-games', name: 'Aviator Room / Games Room', floor: '2F' },
      { id: 'trophy-statuary', name: 'Trophy Room / Statuary Room', floor: '2F' },
      { id: 'kitchen-dining', name: 'Kitchen / Dining Room', floor: '1F' },
      { id: 'living-library', name: 'Living Room / Library', floor: '1F' },
    ],
  },
  {
    id: 'yacht',
    name: 'Yacht',
    rankedPool: false,
    sites: [
      { id: 'navigation-cafeteria', name: 'Cockpit / Maps Room', floor: '4F' },
      { id: 'casino-bar', name: 'Cafeteria / Staff Dormitory', floor: '2F' },
      { id: 'kitchen-engine', name: 'Engine Control / Kitchen', floor: '2F' },
      { id: 'submarine-stern', name: 'Server Room / Engine Storage', floor: '1F' },
    ],
  },
]

export default MAPS
