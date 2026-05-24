// The Finals — Cashout map pool May 2026.
// Sites = vault locations + Cashout extraction points per map.
// VERIFY: Embark rotates maps seasonally — re-check current pool.

const MAPS = [
  {
    id: "las-vegas",
    name: "Las Vegas",
    rankedPool: true,
    sites: [
      { id: "casino-vault", name: "Casino Vault", floor: '—' },
      { id: "strip-cashout", name: "Strip Cashout", floor: '—' },
      { id: "penthouse-cashout", name: "Penthouse Cashout", floor: '—' },
    ],
  },
  {
    id: "monaco",
    name: "Monaco",
    rankedPool: true,
    sites: [
      { id: "yacht-vault", name: "Yacht Vault", floor: '—' },
      { id: "plaza-cashout", name: "Plaza Cashout", floor: '—' },
      { id: "harbor-cashout", name: "Harbor Cashout", floor: '—' },
    ],
  },
  {
    id: "seoul",
    name: "Seoul",
    rankedPool: true,
    sites: [
      { id: "mall-vault", name: "Mall Vault", floor: '—' },
      { id: "plaza-cashout", name: "Plaza Cashout", floor: '—' },
      { id: "tower-cashout", name: "Tower Cashout", floor: '—' },
    ],
  },
  {
    id: "kyoto",
    name: "Kyoto",
    rankedPool: true,
    sites: [
      { id: "temple-vault", name: "Temple Vault", floor: '—' },
      { id: "plaza-cashout", name: "Plaza Cashout", floor: '—' },
      { id: "rooftop-cashout", name: "Rooftop Cashout", floor: '—' },
    ],
  },
  {
    id: "sys-horizon",
    name: "SYS$HORIZON",
    rankedPool: true,
    sites: [
      { id: "grid-vault", name: "Grid Vault", floor: '—' },
      { id: "tower-cashout", name: "Tower Cashout", floor: '—' },
      { id: "rooftop-cashout", name: "Rooftop Cashout", floor: '—' },
    ],
  },
  {
    id: "bernal",
    name: "Bernal",
    rankedPool: true,
    sites: [
      { id: "mining-vault", name: "Mining Vault", floor: '—' },
      { id: "plaza-cashout", name: "Plaza Cashout", floor: '—' },
      { id: "rooftop-cashout", name: "Rooftop Cashout", floor: '—' },
    ],
  },
  {
    id: "skyway-stadium",
    name: "Skyway Stadium",
    type: "Cashout / World Tour",
    rankedPool: true,
    sites: [
      { id: 'stadium', name: "Stadium", floor: '—' },
      { id: 'skybridges', name: "Skybridges", floor: '—' },
      { id: 'plaza', name: "Plaza", floor: '—' },
      { id: 'pavilion', name: "Pavilion", floor: '—' },
    ],
  },
  {
    id: "fortune-stadium",
    name: "Fortune Stadium",
    type: "Cashout / World Tour",
    rankedPool: true,
    sites: [
      { id: 'stadium', name: "Stadium", floor: '—' },
      { id: 'concourse', name: "Concourse", floor: '—' },
      { id: 'plaza', name: "Plaza", floor: '—' },
      { id: 'parking', name: "Parking", floor: '—' },
    ],
  },
  {
    id: "dean-square",
    name: "Dean Square",
    type: "Cashout",
    rankedPool: true,
    sites: [
      { id: 'plaza', name: "Plaza", floor: '—' },
      { id: 'theater', name: "Theater", floor: '—' },
      { id: 'apartments', name: "Apartments", floor: '—' },
      { id: 'underpass', name: "Underpass", floor: '—' },
    ],
  },
  {
    id: "studio",
    name: "Studio",
    type: "Cashout / TV Studio",
    rankedPool: true,
    sites: [
      { id: 'stage-a', name: "Stage A", floor: '—' },
      { id: 'stage-b', name: "Stage B", floor: '—' },
      { id: 'green-room', name: "Green Room", floor: '—' },
      { id: 'sound-booth', name: "Sound Booth", floor: '—' },
    ],
  },
  {
    id: "vegas-strip",
    name: "Vegas Strip",
    type: "Cashout",
    rankedPool: true,
    sites: [
      { id: 'casino-floor', name: "Casino Floor", floor: '—' },
      { id: 'hotel', name: "Hotel", floor: '—' },
      { id: 'strip', name: "Strip", floor: '—' },
      { id: 'pool', name: "Pool", floor: '—' },
    ],
  },
  {
    id: "horizon-2",
    name: "SYS$HORIZON 2.0",
    type: "Cashout",
    rankedPool: true,
    sites: [
      { id: 'server-room', name: "Server Room", floor: '—' },
      { id: 'network', name: "Network", floor: '—' },
      { id: 'backbone', name: "Backbone", floor: '—' },
      { id: 'datacenter', name: "Datacenter", floor: '—' },
    ],
  },
]

export default MAPS
