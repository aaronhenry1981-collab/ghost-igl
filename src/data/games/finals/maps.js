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
]

export default MAPS
