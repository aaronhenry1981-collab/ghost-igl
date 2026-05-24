// Snapshot of map data for the Discord bot Lambda.
// Keep in sync with src/data/maps.js when updated.

const MAPS = [
  { id: 'bank', name: 'Bank', rankedPool: true, sites: [
    { floor: '2F', name: 'CEO Office / Executive Lounge' },
    { floor: '1F', name: 'Open Area / Staff Room' },
    { floor: '1F', name: "Teller's Office / Archives" },
    { floor: 'B',  name: 'Lockers / CCTV Room' },
  ]},
  { id: 'bartlett', name: 'Bartlett University', rankedPool: false, sites: [
    { floor: '2F', name: 'Library / Classrooms' },
    { floor: '1F', name: 'Bar / Stage' },
    { floor: 'B',  name: 'Basement / Lockers' },
    { floor: '1F', name: 'Cafeteria / Kitchen' },
  ]},
  { id: 'border', name: 'Border', rankedPool: true, sites: [
    { floor: '2F', name: 'Armory Lockers / Archives' },
    { floor: '1F', name: 'Workshop / Ventilation Room' },
    { floor: '1F', name: 'Customs Inspection / Supply Room' },
    { floor: '2F', name: 'Tellers / Bathroom' },
  ]},
  { id: 'chalet', name: 'Chalet', rankedPool: true, sites: [
    { floor: '2F', name: 'Master Bedroom / Office' },
    { floor: '1F', name: 'Bar / Gaming Room' },
    { floor: '1F', name: 'Kitchen / Trophy Room' },
    { floor: 'B',  name: 'Wine Cellar / Snowmobile Garage' },
  ]},
  { id: 'clubhouse', name: 'Clubhouse', rankedPool: true, sites: [
    { floor: '2F', name: 'Cash Room / CCTV Room' },
    { floor: '1F', name: 'Bar / Stock Room' },
    { floor: 'B',  name: 'Church / Arsenal' },
    { floor: '2F', name: 'Gym / Bedroom' },
  ]},
  { id: 'coastline', name: 'Coastline', rankedPool: true, sites: [
    { floor: '2F', name: 'Hookah Lounge / Billiards Room' },
    { floor: '2F', name: 'Theater / Penthouse' },
    { floor: '1F', name: 'Kitchen / Service Entrance' },
    { floor: '1F', name: 'Blue Bar / Sunrise Bar' },
  ]},
  { id: 'consulate', name: 'Consulate', rankedPool: true, sites: [
    { floor: '2F', name: 'Consul Office / Meeting Room' },
    { floor: '1F', name: 'Lobby / Press Room' },
    { floor: 'B',  name: 'Garage / Cafeteria' },
    { floor: '1F', name: 'Tellers / Archives' },
  ]},
  { id: 'emerald-plains', name: 'Emerald Plains', rankedPool: true, sites: [
    { floor: '2F', name: 'Lounge / Bedroom' },
    { floor: '1F', name: 'Kitchen / Dining' },
    { floor: '1F', name: 'Bar / Irish Room' },
    { floor: '2F', name: 'Gym / Studio' },
  ]},
  { id: 'favela', name: 'Favela', rankedPool: false, sites: [
    { floor: '3F', name: 'Bedroom / Auto Shop' },
    { floor: '2F', name: 'Kitchen / Meeting Room' },
    { floor: '1F', name: 'Market / Party Room' },
    { floor: '2F', name: "Aunt's Apartment / Footsie Bar" },
  ]},
  { id: 'fortress', name: 'Fortress', rankedPool: false, sites: [
    { floor: '2F', name: 'Commander Office / Briefing Room' },
    { floor: '1F', name: 'Kitchen / Dining Hall' },
    { floor: '1F', name: 'Council Chamber / Guard Room' },
    { floor: 'R',  name: 'Tower / Rooftop' },
  ]},
  { id: 'hereford', name: 'Hereford Base', rankedPool: false, sites: [
    { floor: '2F', name: 'Dorms / Office' },
    { floor: '1F', name: 'Kitchen / Dining Room' },
    { floor: '1F', name: 'Briefing / Stairs' },
    { floor: 'B',  name: 'Wine Cellar / Storage' },
  ]},
  { id: 'house', name: 'House', rankedPool: false, sites: [
    { floor: '2F', name: 'Master Bedroom / Closet' },
    { floor: '1F', name: 'Kitchen / Living Room' },
    { floor: '1F', name: 'Garage / Workshop' },
    { floor: 'B',  name: 'Boiler / Laundry' },
  ]},
  { id: 'kafe', name: 'Kafe Dostoyevsky', rankedPool: true, sites: [
    { floor: '3F', name: 'Reading Room / Fireplace Hall' },
    { floor: '2F', name: 'Mining Room / Train Museum' },
    { floor: '1F', name: 'Kitchen Service / Kitchen Cooking' },
    { floor: '1F', name: 'Bar / Cocktail Lounge' },
  ]},
  { id: 'kanal', name: 'Kanal', rankedPool: false, sites: [
    { floor: '2F', name: 'Server Room / Radio Room' },
    { floor: '1F', name: 'Kitchen / Coast Guard Meeting' },
    { floor: '1F', name: 'Construction Site / Control Room' },
    { floor: 'B',  name: 'Engine Room / Supply Room' },
  ]},
  { id: 'lair', name: 'Lair', rankedPool: true, sites: [
    { floor: '2F', name: 'Balcony / Memorial' },
    { floor: '2F', name: 'Surveillance / Lounge' },
    { floor: '1F', name: 'R&D Lab / Workshop' },
    { floor: 'B',  name: 'Server / Vault' },
  ]},
  { id: 'nighthaven', name: 'Nighthaven Labs', rankedPool: true, sites: [
    { floor: 'B',  name: 'Server Room / Control Room' },
    { floor: '1F', name: 'Assembly / Production' },
    { floor: '2F', name: 'Briefing Room / Meeting Room' },
    { floor: '2F', name: 'Dormitory / Bunks' },
  ]},
  { id: 'oregon', name: 'Oregon', rankedPool: true, sites: [
    { floor: '2F', name: "Kids' Dorms / Bunk" },
    { floor: '1F', name: 'Meeting Hall / Kitchen' },
    { floor: 'B',  name: 'Laundry / Supply Room' },
    { floor: '3F', name: 'Attic / Tower' },
  ]},
  { id: 'outback', name: 'Outback', rankedPool: false, sites: [
    { floor: '2F', name: 'Laundry Room / Games Room' },
    { floor: '2F', name: 'Office / Mechanical Bull Room' },
    { floor: '1F', name: 'Bushranger / Bathroom' },
    { floor: '1F', name: 'Compressor Room / Party Room' },
  ]},
  { id: 'plane', name: 'Presidential Plane', rankedPool: false, sites: [
    { floor: '2F', name: 'Meeting Room / Office' },
    { floor: '1F', name: 'Security Room / Cargo Hold' },
    { floor: '1F', name: 'Kitchen / Stateroom' },
    { floor: '1F', name: 'Work Room / Lobby' },
  ]},
  { id: 'skyscraper', name: 'Skyscraper', rankedPool: true, sites: [
    { floor: '2F', name: 'Tea Room / Karaoke' },
    { floor: '2F', name: 'Bedroom / Closet' },
    { floor: '1F', name: 'Kitchen / BBQ' },
    { floor: '1F', name: 'Work Office / Exhibition' },
  ]},
  { id: 'stadium-bravo', name: 'Stadium Bravo', rankedPool: false, sites: [
    { floor: '2F', name: 'Medic / Executive Suite' },
    { floor: '1F', name: 'Locker Room / Dispensary' },
    { floor: '1F', name: 'Garage / Press Conference' },
    { floor: '1F', name: 'Nats Lounge / Oregon Bar' },
  ]},
  { id: 'theme-park', name: 'Theme Park', rankedPool: true, sites: [
    { floor: '2F', name: 'Throne Room / Armory' },
    { floor: '1F', name: 'Lab / Storage' },
    { floor: '2F', name: 'Office / Initiation' },
    { floor: '1F', name: 'Bunk / Day Care' },
  ]},
  { id: 'tower', name: 'Tower', rankedPool: false, sites: [
    { floor: '2F', name: 'Bar / Lounge' },
    { floor: '1F', name: 'Ventilation / Seating Area' },
    { floor: '1F', name: 'Tea Room / Exhibition' },
    { floor: '2F', name: 'Ballroom / Bedroom' },
  ]},
  { id: 'villa', name: 'Villa', rankedPool: true, sites: [
    { floor: '2F', name: 'Aviator Room / Games Room' },
    { floor: '2F', name: 'Trophy Room / Statuary Hall' },
    { floor: '1F', name: 'Kitchen / Dining Room' },
    { floor: '1F', name: 'Living Room / Library' },
  ]},
  { id: 'yacht', name: 'Yacht', rankedPool: false, sites: [
    { floor: '3F', name: 'Navigation Room / Cafeteria' },
    { floor: '2F', name: 'Casino / Bar' },
    { floor: '1F', name: 'Kitchen / Engine Room' },
    { floor: '1F', name: 'Submarine / Stern' },
  ]},
]

export default MAPS
