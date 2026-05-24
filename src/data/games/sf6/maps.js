// Street Fighter 6 — early-access map/mode catalog. Strats data being added
// per Recon 6's content pipeline; this seeds the structure so the strats /
// loadouts / match-prep pages render correctly while content depth grows.

const MAPS = [
  {
    "id": "genbu-temple",
    "name": "Genbu Temple",
    "type": "Walled",
    "rankedPool": true,
    "sites": [
      {
        "id": "neutral",
        "name": "Neutral Spacing",
        "floor": "—"
      },
      {
        "id": "corner",
        "name": "Corner Carry",
        "floor": "—"
      },
      {
        "id": "drive-pressure",
        "name": "Drive Pressure Setups",
        "floor": "—"
      }
    ]
  },
  {
    "id": "metro-city",
    "name": "Metro City Downtown",
    "type": "Walled",
    "rankedPool": true,
    "sites": [
      {
        "id": "neutral",
        "name": "Neutral Spacing",
        "floor": "—"
      },
      {
        "id": "corner",
        "name": "Corner Carry",
        "floor": "—"
      }
    ]
  }
]

export default MAPS
