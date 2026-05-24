// NBA 2K — early-access map/mode catalog. Strats data being added
// per Recon 6's content pipeline; this seeds the structure so the strats /
// loadouts / match-prep pages render correctly while content depth grows.

const MAPS = [
  {
    "id": "mycareer",
    "name": "MyCareer / The City",
    "type": "Single-Player + Online",
    "rankedPool": true,
    "sites": [
      {
        "id": "rec-center",
        "name": "Rec Center 5v5",
        "floor": "—"
      },
      {
        "id": "park",
        "name": "Park 3v3",
        "floor": "—"
      },
      {
        "id": "pro-am",
        "name": "Pro-Am",
        "floor": "—"
      }
    ]
  },
  {
    "id": "myteam",
    "name": "MyTeam",
    "type": "Online Card Game",
    "rankedPool": true,
    "sites": [
      {
        "id": "triple-threat",
        "name": "Triple Threat 3v3",
        "floor": "—"
      },
      {
        "id": "unlimited",
        "name": "Unlimited 5v5",
        "floor": "—"
      },
      {
        "id": "limited",
        "name": "Limited Weekend",
        "floor": "—"
      }
    ]
  },
  {
    "id": "play-now",
    "name": "Play Now Online",
    "type": "Online 5v5",
    "rankedPool": true,
    "sites": [
      {
        "id": "quick-match",
        "name": "Quick Match",
        "floor": "—"
      },
      {
        "id": "ranked-match",
        "name": "Ranked Match",
        "floor": "—"
      }
    ]
  }
]

export default MAPS
