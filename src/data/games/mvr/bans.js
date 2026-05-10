// Marvel Rivals — per-map hero ban recommendations.

const BANS = {
  "shin-shibuya": {
    attack: [
      { name: "Hela", reason: "Tokyo 2099: Shin-Shibuya long sightlines reward Hela's ranged DPS — ban removes the round-opener pick threat." },
      { name: "Doctor Strange", reason: "Convoy engages favor Strange's portal play + bubble — ban opens up dive comps cleanly." },
    ],
    defense: [
      { name: "Punisher", reason: "Tokyo 2099: Shin-Shibuya chokes funnel attackers into Punisher's turret + ult lanes — ban removes the brawl-shutdown." },
      { name: "Magneto", reason: "Payload hold rewards Magneto bubble + ult absorb — ban removes the iron Vanguard hold." },
    ],
  },
  "ninomaru": {
    attack: [
      { name: "Hela", reason: "Tokyo 2099: Ninomaru long sightlines reward Hela's ranged DPS — ban removes the round-opener pick threat." },
      { name: "Doctor Strange", reason: "Convergence engages favor Strange's portal play + bubble — ban opens up dive comps cleanly." },
    ],
    defense: [
      { name: "Punisher", reason: "Tokyo 2099: Ninomaru chokes funnel attackers into Punisher's turret + ult lanes — ban removes the brawl-shutdown." },
      { name: "Magneto", reason: "Payload hold rewards Magneto bubble + ult absorb — ban removes the iron Vanguard hold." },
    ],
  },
  "spider-islands": {
    attack: [
      { name: "Hela", reason: "Tokyo 2099: Spider-Islands long sightlines reward Hela's ranged DPS — ban removes the round-opener pick threat." },
      { name: "Doctor Strange", reason: "Domination engages favor Strange's portal play + bubble — ban opens up dive comps cleanly." },
    ],
    defense: [
      { name: "Punisher", reason: "Tokyo 2099: Spider-Islands chokes funnel attackers into Punisher's turret + ult lanes — ban removes the brawl-shutdown." },
      { name: "Magneto", reason: "Cap point hold rewards Magneto bubble + ult absorb — ban removes the iron Vanguard hold." },
    ],
  },
  "yggdrasill-path": {
    attack: [
      { name: "Hela", reason: "Yggsgard: Yggdrasill Path long sightlines reward Hela's ranged DPS — ban removes the round-opener pick threat." },
      { name: "Doctor Strange", reason: "Convoy engages favor Strange's portal play + bubble — ban opens up dive comps cleanly." },
    ],
    defense: [
      { name: "Punisher", reason: "Yggsgard: Yggdrasill Path chokes funnel attackers into Punisher's turret + ult lanes — ban removes the brawl-shutdown." },
      { name: "Magneto", reason: "Payload hold rewards Magneto bubble + ult absorb — ban removes the iron Vanguard hold." },
    ],
  },
  "royal-palace": {
    attack: [
      { name: "Hela", reason: "Yggsgard: Royal Palace long sightlines reward Hela's ranged DPS — ban removes the round-opener pick threat." },
      { name: "Doctor Strange", reason: "Domination engages favor Strange's portal play + bubble — ban opens up dive comps cleanly." },
    ],
    defense: [
      { name: "Punisher", reason: "Yggsgard: Royal Palace chokes funnel attackers into Punisher's turret + ult lanes — ban removes the brawl-shutdown." },
      { name: "Magneto", reason: "Cap point hold rewards Magneto bubble + ult absorb — ban removes the iron Vanguard hold." },
    ],
  },
  "symbiotic-surface": {
    attack: [
      { name: "Hela", reason: "Klyntar: Symbiotic Surface long sightlines reward Hela's ranged DPS — ban removes the round-opener pick threat." },
      { name: "Doctor Strange", reason: "Convergence engages favor Strange's portal play + bubble — ban opens up dive comps cleanly." },
    ],
    defense: [
      { name: "Punisher", reason: "Klyntar: Symbiotic Surface chokes funnel attackers into Punisher's turret + ult lanes — ban removes the brawl-shutdown." },
      { name: "Magneto", reason: "Payload hold rewards Magneto bubble + ult absorb — ban removes the iron Vanguard hold." },
    ],
  },
  "celestial-apex": {
    attack: [
      { name: "Hela", reason: "Klyntar: Celestial's Apex long sightlines reward Hela's ranged DPS — ban removes the round-opener pick threat." },
      { name: "Doctor Strange", reason: "Domination engages favor Strange's portal play + bubble — ban opens up dive comps cleanly." },
    ],
    defense: [
      { name: "Punisher", reason: "Klyntar: Celestial's Apex chokes funnel attackers into Punisher's turret + ult lanes — ban removes the brawl-shutdown." },
      { name: "Magneto", reason: "Cap point hold rewards Magneto bubble + ult absorb — ban removes the iron Vanguard hold." },
    ],
  },
  "birnin-tchalla": {
    attack: [
      { name: "Hela", reason: "Wakanda: Birnin T'Challa long sightlines reward Hela's ranged DPS — ban removes the round-opener pick threat." },
      { name: "Doctor Strange", reason: "Domination engages favor Strange's portal play + bubble — ban opens up dive comps cleanly." },
    ],
    defense: [
      { name: "Punisher", reason: "Wakanda: Birnin T'Challa chokes funnel attackers into Punisher's turret + ult lanes — ban removes the brawl-shutdown." },
      { name: "Magneto", reason: "Cap point hold rewards Magneto bubble + ult absorb — ban removes the iron Vanguard hold." },
    ],
  },
  "hall-of-djalia": {
    attack: [
      { name: "Hela", reason: "Wakanda: Hall of Djalia long sightlines reward Hela's ranged DPS — ban removes the round-opener pick threat." },
      { name: "Doctor Strange", reason: "Convergence engages favor Strange's portal play + bubble — ban opens up dive comps cleanly." },
    ],
    defense: [
      { name: "Punisher", reason: "Wakanda: Hall of Djalia chokes funnel attackers into Punisher's turret + ult lanes — ban removes the brawl-shutdown." },
      { name: "Magneto", reason: "Payload hold rewards Magneto bubble + ult absorb — ban removes the iron Vanguard hold." },
    ],
  },
  "krakoa": {
    attack: [
      { name: "Hela", reason: "Hellfire Gala: Krakoa long sightlines reward Hela's ranged DPS — ban removes the round-opener pick threat." },
      { name: "Doctor Strange", reason: "Domination engages favor Strange's portal play + bubble — ban opens up dive comps cleanly." },
    ],
    defense: [
      { name: "Punisher", reason: "Hellfire Gala: Krakoa chokes funnel attackers into Punisher's turret + ult lanes — ban removes the brawl-shutdown." },
      { name: "Magneto", reason: "Cap point hold rewards Magneto bubble + ult absorb — ban removes the iron Vanguard hold." },
    ],
  },
  "hells-heaven": {
    attack: [
      { name: "Hela", reason: "Hydra Charteris Base: Hell's Heaven long sightlines reward Hela's ranged DPS — ban removes the round-opener pick threat." },
      { name: "Doctor Strange", reason: "Convoy engages favor Strange's portal play + bubble — ban opens up dive comps cleanly." },
    ],
    defense: [
      { name: "Punisher", reason: "Hydra Charteris Base: Hell's Heaven chokes funnel attackers into Punisher's turret + ult lanes — ban removes the brawl-shutdown." },
      { name: "Magneto", reason: "Payload hold rewards Magneto bubble + ult absorb — ban removes the iron Vanguard hold." },
    ],
  },
  "midtown": {
    attack: [
      { name: "Hela", reason: "Empire of Eternal Night: Midtown long sightlines reward Hela's ranged DPS — ban removes the round-opener pick threat." },
      { name: "Doctor Strange", reason: "Convergence engages favor Strange's portal play + bubble — ban opens up dive comps cleanly." },
    ],
    defense: [
      { name: "Punisher", reason: "Empire of Eternal Night: Midtown chokes funnel attackers into Punisher's turret + ult lanes — ban removes the brawl-shutdown." },
      { name: "Magneto", reason: "Payload hold rewards Magneto bubble + ult absorb — ban removes the iron Vanguard hold." },
    ],
  },
}

export default BANS
