// PUBG: Battlegrounds — Battle Royale map catalog with POIs as sites.
// Maps vary by size (4x4km Sanhok, 8x8km Erangel/Miramar) and biome.

const MAPS = [
  {
    id: "erangel",
    name: "Erangel",
    type: "8x8km Classic",
    rankedPool: true,
    sites: [
      { id: "pochinki", name: "Pochinki (Center Hot Drop)", floor: "—" },
      { id: "school", name: "School (Center Brawl)", floor: "—" },
      { id: "georgopol", name: "Georgopol (North-West Loot Hub)", floor: "—" },
      { id: "military-base", name: "Military Base (South Tier-3 Loot)", floor: "—" },
      { id: "mylta", name: "Mylta (East Town)", floor: "—" },
      { id: "rozhok", name: "Rozhok (Center Town)", floor: "—" },
      { id: "primorsk", name: "Primorsk (South Coast)", floor: "—" },
    ],
  },
  {
    id: "miramar",
    name: "Miramar",
    type: "8x8km Desert",
    rankedPool: true,
    sites: [
      { id: "pecado", name: "Pecado (Center Hot Drop)", floor: "—" },
      { id: "hacienda", name: "Hacienda del Patrón (Tier-3 Hot Drop)", floor: "—" },
      { id: "los-leones", name: "Los Leones (Largest City)", floor: "—" },
      { id: "san-martin", name: "San Martín", floor: "—" },
      { id: "el-pozo", name: "El Pozo", floor: "—" },
    ],
  },
  {
    id: "sanhok",
    name: "Sanhok",
    type: "4x4km Jungle",
    rankedPool: true,
    sites: [
      { id: "paradise-resort", name: "Paradise Resort (Center)", floor: "—" },
      { id: "bootcamp", name: "Bootcamp (Tier-3 Hot Drop)", floor: "—" },
      { id: "ruins", name: "Ruins (Cave POI)", floor: "—" },
      { id: "ha-tinh", name: "Ha Tinh", floor: "—" },
    ],
  },
  {
    id: "vikendi",
    name: "Vikendi",
    type: "6x6km Snow",
    rankedPool: true,
    sites: [
      { id: "castle", name: "Castle (Center Vertical POI)", floor: "—" },
      { id: "cosmodrome", name: "Cosmodrome (Tier-3 Loot)", floor: "—" },
      { id: "villa", name: "Villa", floor: "—" },
      { id: "mount-kreznic", name: "Mount Kreznic", floor: "—" },
    ],
  },
  {
    id: "taego",
    name: "Taego",
    type: "8x8km Korean Forest",
    rankedPool: true,
    sites: [
      { id: "go-san", name: "Go-Sang Village", floor: "—" },
      { id: "shipyard", name: "Shipyard (Tier-3 Loot)", floor: "—" },
      { id: "hosan", name: "Hosan Town", floor: "—" },
      { id: "pyungwon", name: "Pyungwon", floor: "—" },
    ],
  },
  {
    id: "deston",
    name: "Deston",
    type: "8x8km Coastal",
    rankedPool: true,
    sites: [
      { id: "amusement-park", name: "Amusement Park (Hot Drop)", floor: "—" },
      { id: "rig", name: "Off-Shore Rig (Tier-3 Vertical Loot)", floor: "—" },
      { id: "ripton", name: "Ripton (City)", floor: "—" },
    ],
  },
]

export default MAPS
