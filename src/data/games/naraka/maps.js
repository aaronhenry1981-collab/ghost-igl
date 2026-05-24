// Naraka: Bladepoint — early-access map/mode catalog. Strats data being added
// per Recon 6's content pipeline; this seeds the structure so the strats /
// loadouts / match-prep pages render correctly while content depth grows.

const MAPS = [
  {
    "id": "morus",
    "name": "Morus Isle",
    "type": "Trios BR",
    "rankedPool": true,
    "sites": [
      {
        "id": "hidden-fort",
        "name": "Hidden Fortress",
        "floor": "—"
      },
      {
        "id": "man-cheng",
        "name": "Man Cheng",
        "floor": "—"
      },
      {
        "id": "shipwreck",
        "name": "Shipwreck",
        "floor": "—"
      }
    ]
  },
  {
    "id": "holoroth",
    "name": "Holoroth",
    "type": "Trios BR",
    "rankedPool": true,
    "sites": [
      {
        "id": "ancient-fortress",
        "name": "Ancient Fortress",
        "floor": "—"
      },
      {
        "id": "temple-of-shadows",
        "name": "Temple of Shadows",
        "floor": "—"
      }
    ]
  },
  {
    "id": "solo-arena",
    "name": "Solo Showdown",
    "type": "Solo",
    "rankedPool": true,
    "sites": [
      {
        "id": "duel-zone",
        "name": "Duel Zone",
        "floor": "—"
      }
    ]
  }
]

export default MAPS
