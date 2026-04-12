const MAPS = [
  {
    id: 'bank',
    name: 'Bank',
    sites: [
      { id: 'ceo', name: 'CEO Office / Executive Lounge', floor: '3F' },
      { id: 'open-area', name: 'Open Area / Staff Room', floor: '2F' },
      { id: 'basement', name: 'Lockers / CCTV Room', floor: 'B' },
      { id: 'tellers', name: 'Teller\'s Office / Archives', floor: '1F' },
    ],
  },
  {
    id: 'oregon',
    name: 'Oregon',
    sites: [
      { id: 'kids-dorms', name: 'Kids\' Dorms / Bunk', floor: '2F' },
      { id: 'meeting-hall', name: 'Meeting Hall / Kitchen', floor: '1F' },
      { id: 'laundry', name: 'Laundry / Supply Room', floor: 'B' },
      { id: 'tower', name: 'Attic / Tower', floor: '3F' },
    ],
  },
  {
    id: 'clubhouse',
    name: 'Clubhouse',
    sites: [
      { id: 'cash-cctv', name: 'Cash Room / CCTV', floor: '2F' },
      { id: 'bar-stock', name: 'Bar / Stock Room', floor: '1F' },
      { id: 'church', name: 'Church / Arsenal', floor: 'B' },
      { id: 'gym-bedroom', name: 'Gym / Bedroom', floor: '2F' },
    ],
  },
  {
    id: 'coastline',
    name: 'Coastline',
    sites: [
      { id: 'hookah-billiards', name: 'Hookah Lounge / Billiards', floor: '2F' },
      { id: 'theater-penthouse', name: 'Theater / Penthouse', floor: '2F' },
      { id: 'kitchen-service', name: 'Kitchen / Service Entrance', floor: '1F' },
      { id: 'blue-bar', name: 'Blue Bar / Sunrise Bar', floor: '1F' },
    ],
  },
  {
    id: 'consulate',
    name: 'Consulate',
    sites: [
      { id: 'consul-meeting', name: 'Consul Office / Meeting Room', floor: '2F' },
      { id: 'lobby-press', name: 'Lobby / Press Room', floor: '1F' },
      { id: 'garage-cafeteria', name: 'Garage / Cafeteria', floor: 'B' },
      { id: 'tellers-archives', name: 'Tellers / Archives', floor: '1F' },
    ],
  },
  {
    id: 'kafe',
    name: 'Kafe Dostoyevsky',
    sites: [
      { id: 'reading-fireplace', name: 'Reading Room / Fireplace Hall', floor: '2F' },
      { id: 'mining-train', name: 'Mining Room / Train Museum', floor: '2F' },
      { id: 'kitchen-bakery', name: 'Kitchen / Bakery', floor: '1F' },
      { id: 'bar-cocktail', name: 'Bar / Cocktail Lounge', floor: '1F' },
    ],
  },
  {
    id: 'chalet',
    name: 'Chalet',
    sites: [
      { id: 'master-office', name: 'Master Bedroom / Office', floor: '2F' },
      { id: 'bar-gaming', name: 'Bar / Gaming Room', floor: '1F' },
      { id: 'kitchen-trophy', name: 'Kitchen / Trophy Room', floor: '1F' },
      { id: 'wine-snowmobile', name: 'Wine Cellar / Snowmobile Garage', floor: 'B' },
    ],
  },
  { id: 'border', name: 'Border', sites: [], comingSoon: true },
  { id: 'skyscraper', name: 'Skyscraper', sites: [], comingSoon: true },
  { id: 'theme-park', name: 'Theme Park', sites: [], comingSoon: true },
  { id: 'villa', name: 'Villa', sites: [], comingSoon: true },
  { id: 'nighthaven', name: 'Nighthaven Labs', sites: [], comingSoon: true },
  { id: 'lair', name: 'Lair', sites: [], comingSoon: true },
]

export default MAPS
