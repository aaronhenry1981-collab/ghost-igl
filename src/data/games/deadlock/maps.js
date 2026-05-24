// Deadlock — early-access map/mode catalog. Strats data being added
// per Recon 6's content pipeline; this seeds the structure so the strats /
// loadouts / match-prep pages render correctly while content depth grows.

const MAPS = [
  {
    "id": "main-map",
    "name": "The Deadlock Map",
    "type": "6v6",
    "rankedPool": true,
    "sites": [
      {
        "id": "lane-1",
        "name": "Lane 1",
        "floor": "—"
      },
      {
        "id": "lane-2",
        "name": "Lane 2",
        "floor": "—"
      },
      {
        "id": "lane-3",
        "name": "Lane 3",
        "floor": "—"
      },
      {
        "id": "lane-4",
        "name": "Lane 4",
        "floor": "—"
      },
      {
        "id": "mid-boss",
        "name": "Mid Boss / Patron",
        "floor": "—"
      },
      {
        "id": "urn",
        "name": "Soul Urn Spawn",
        "floor": "—"
      }
    ]
  }
]

export default MAPS
