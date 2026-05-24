// Fortnite Zero Build — current chapter map POIs (May 2026).
// VERIFY: Fortnite rotates POIs every chapter (~3-4 months) — re-verify
// names against the official Fortnite map before relying on specific POIs.

const MAPS = [
  {
    id: "current-chapter",
    name: "Current Chapter Map (Zero Build)",
    rankedPool: true,
    sites: [
      { id: "pleasant-piazza", name: "Pleasant Piazza", floor: '—' },
      { id: "foxy-floodgate", name: "Foxy Floodgate", floor: '—' },
      { id: "hidden-hollow", name: "Hidden Hollow", floor: '—' },
      { id: "magic-mosses", name: "Magic Mosses", floor: '—' },
      { id: "foxy-faulks", name: "Foxy Faulks", floor: '—' },
      { id: "demons-domain", name: "Demon's Domain", floor: '—' },
      { id: "brutal-beachhead", name: "Brutal Beachhead", floor: '—' },
      { id: "shogun-x", name: "Shogun's X-tate", floor: '—' },
      { id: "masked-meadows", name: "Masked Meadows", floor: '—' },
      { id: "open-air-onsen", name: "Open-Air Onsen", floor: '—' },
      { id: "twinkle-terrace", name: "Twinkle Terrace", floor: '—' },
      { id: "ranger-ridge", name: "Ranger Ridge", floor: '—' },
    ],
  },
  {
    id: "br-current",
    name: "BR Current Chapter",
    type: "Battle Royale",
    rankedPool: true,
    sites: [
      { id: 'tilted-towers', name: "Tilted Towers", floor: '—' },
      { id: 'the-citadel', name: "The Citadel", floor: '—' },
      { id: 'reckless-railways', name: "Reckless Railways", floor: '—' },
      { id: 'mythic-poi', name: "Mythic POI", floor: '—' },
      { id: 'coastal', name: "Coastal", floor: '—' },
    ],
  },
  {
    id: "reload",
    name: "Reload",
    type: "Reload",
    rankedPool: true,
    sites: [
      { id: 'lavish-lair', name: "Lavish Lair", floor: '—' },
      { id: 'hazy-hillside', name: "Hazy Hillside", floor: '—' },
      { id: 'ritzy-riviera', name: "Ritzy Riviera", floor: '—' },
      { id: 'forbidden-falls', name: "Forbidden Falls", floor: '—' },
      { id: 'salty-springs', name: "Salty Springs", floor: '—' },
      { id: 'tilted-towers', name: "Tilted Towers", floor: '—' },
    ],
  },
  {
    id: "og",
    name: "OG (Original Map)",
    type: "Battle Royale OG",
    rankedPool: true,
    sites: [
      { id: 'tilted-towers', name: "Tilted Towers", floor: '—' },
      { id: 'pleasant-park', name: "Pleasant Park", floor: '—' },
      { id: 'retail-row', name: "Retail Row", floor: '—' },
      { id: 'greasy-grove', name: "Greasy Grove", floor: '—' },
      { id: 'salty-springs', name: "Salty Springs", floor: '—' },
    ],
  },
  {
    id: "creative-ranked",
    name: "Creative Ranked Pool",
    type: "Creative / UEFN",
    rankedPool: true,
    sites: [
      { id: 'box-fight', name: "Box Fight", floor: '—' },
      { id: 'zone-wars', name: "Zone Wars", floor: '—' },
      { id: 'realistic-1v1', name: "Realistic 1v1", floor: '—' },
      { id: 'tycoon', name: "Tycoon", floor: '—' },
      { id: 'pit', name: "Pit", floor: '—' },
    ],
  },
]

export default MAPS
