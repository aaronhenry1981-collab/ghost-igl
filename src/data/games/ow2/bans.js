// Overwatch 2 — per-map hero ban recommendations (S9+ ban phase).

const BANS = {
  "antarctic-peninsula": {
    attack: [
      { name: "Sombra", reason: "Sombra hack disrupts Control engage timings — ban removes the only reliable counter to coordinated pushes." },
      { name: "Roadhog", reason: "Roadhog hook on engage punishes any tank commit; map-defining on tight chokes." },
    ],
    defense: [
      { name: "Pharah", reason: "Antarctic Peninsula has open sightlines that favor Pharah air superiority — ban forces ground engages." },
      { name: "Widowmaker", reason: "Antarctic Peninsula long sightlines reward Widowmaker pick attempts — ban removes the round-opener pick threat." },
    ],
  },
  "busan": {
    attack: [
      { name: "Sombra", reason: "Sombra hack disrupts Control engage timings — ban removes the only reliable counter to coordinated pushes." },
      { name: "Roadhog", reason: "Roadhog hook on engage punishes any tank commit; map-defining on tight chokes." },
    ],
    defense: [
      { name: "Pharah", reason: "Busan has open sightlines that favor Pharah air superiority — ban forces ground engages." },
      { name: "Widowmaker", reason: "Busan long sightlines reward Widowmaker pick attempts — ban removes the round-opener pick threat." },
    ],
  },
  "ilios": {
    attack: [
      { name: "Sombra", reason: "Sombra hack disrupts Control engage timings — ban removes the only reliable counter to coordinated pushes." },
      { name: "Roadhog", reason: "Roadhog hook on engage punishes any tank commit; map-defining on tight chokes." },
    ],
    defense: [
      { name: "Pharah", reason: "Ilios has open sightlines that favor Pharah air superiority — ban forces ground engages." },
      { name: "Widowmaker", reason: "Ilios long sightlines reward Widowmaker pick attempts — ban removes the round-opener pick threat." },
    ],
  },
  "nepal": {
    attack: [
      { name: "Sombra", reason: "Sombra hack disrupts Control engage timings — ban removes the only reliable counter to coordinated pushes." },
      { name: "Roadhog", reason: "Roadhog hook on engage punishes any tank commit; map-defining on tight chokes." },
    ],
    defense: [
      { name: "Pharah", reason: "Nepal has open sightlines that favor Pharah air superiority — ban forces ground engages." },
      { name: "Widowmaker", reason: "Nepal long sightlines reward Widowmaker pick attempts — ban removes the round-opener pick threat." },
    ],
  },
  "eichenwalde": {
    attack: [
      { name: "Sombra", reason: "Sombra hack disrupts Hybrid engage timings — ban removes the only reliable counter to coordinated pushes." },
      { name: "Mei", reason: "Mei wall + freeze on funneled attacker pushes blocks payload progression cleanly." },
    ],
    defense: [
      { name: "Pharah", reason: "Eichenwalde has open sightlines that favor Pharah air superiority — ban forces ground engages." },
      { name: "Widowmaker", reason: "Eichenwalde long sightlines reward Widowmaker pick attempts — ban removes the round-opener pick threat." },
    ],
  },
  "kings-row": {
    attack: [
      { name: "Sombra", reason: "Sombra hack disrupts Hybrid engage timings — ban removes the only reliable counter to coordinated pushes." },
      { name: "Mei", reason: "Mei wall + freeze on funneled attacker pushes blocks payload progression cleanly." },
    ],
    defense: [
      { name: "Pharah", reason: "King's Row has open sightlines that favor Pharah air superiority — ban forces ground engages." },
      { name: "Widowmaker", reason: "King's Row long sightlines reward Widowmaker pick attempts — ban removes the round-opener pick threat." },
    ],
  },
  "midtown": {
    attack: [
      { name: "Sombra", reason: "Sombra hack disrupts Hybrid engage timings — ban removes the only reliable counter to coordinated pushes." },
      { name: "Mei", reason: "Mei wall + freeze on funneled attacker pushes blocks payload progression cleanly." },
    ],
    defense: [
      { name: "Pharah", reason: "Midtown has open sightlines that favor Pharah air superiority — ban forces ground engages." },
      { name: "Widowmaker", reason: "Midtown long sightlines reward Widowmaker pick attempts — ban removes the round-opener pick threat." },
    ],
  },
  "numbani": {
    attack: [
      { name: "Sombra", reason: "Sombra hack disrupts Hybrid engage timings — ban removes the only reliable counter to coordinated pushes." },
      { name: "Mei", reason: "Mei wall + freeze on funneled attacker pushes blocks payload progression cleanly." },
    ],
    defense: [
      { name: "Pharah", reason: "Numbani has open sightlines that favor Pharah air superiority — ban forces ground engages." },
      { name: "Widowmaker", reason: "Numbani long sightlines reward Widowmaker pick attempts — ban removes the round-opener pick threat." },
    ],
  },
  "circuit-royal": {
    attack: [
      { name: "Sombra", reason: "Sombra hack disrupts Escort engage timings — ban removes the only reliable counter to coordinated pushes." },
      { name: "Mei", reason: "Mei wall + freeze on funneled attacker pushes blocks payload progression cleanly." },
    ],
    defense: [
      { name: "Pharah", reason: "Circuit Royal has open sightlines that favor Pharah air superiority — ban forces ground engages." },
      { name: "Widowmaker", reason: "Circuit Royal long sightlines reward Widowmaker pick attempts — ban removes the round-opener pick threat." },
    ],
  },
  "dorado": {
    attack: [
      { name: "Sombra", reason: "Sombra hack disrupts Escort engage timings — ban removes the only reliable counter to coordinated pushes." },
      { name: "Mei", reason: "Mei wall + freeze on funneled attacker pushes blocks payload progression cleanly." },
    ],
    defense: [
      { name: "Pharah", reason: "Dorado has open sightlines that favor Pharah air superiority — ban forces ground engages." },
      { name: "Widowmaker", reason: "Dorado long sightlines reward Widowmaker pick attempts — ban removes the round-opener pick threat." },
    ],
  },
  "junkertown": {
    attack: [
      { name: "Sombra", reason: "Sombra hack disrupts Escort engage timings — ban removes the only reliable counter to coordinated pushes." },
      { name: "Mei", reason: "Mei wall + freeze on funneled attacker pushes blocks payload progression cleanly." },
    ],
    defense: [
      { name: "Pharah", reason: "Junkertown has open sightlines that favor Pharah air superiority — ban forces ground engages." },
      { name: "Widowmaker", reason: "Junkertown long sightlines reward Widowmaker pick attempts — ban removes the round-opener pick threat." },
    ],
  },
  "gibraltar": {
    attack: [
      { name: "Sombra", reason: "Sombra hack disrupts Escort engage timings — ban removes the only reliable counter to coordinated pushes." },
      { name: "Mei", reason: "Mei wall + freeze on funneled attacker pushes blocks payload progression cleanly." },
    ],
    defense: [
      { name: "Pharah", reason: "Watchpoint: Gibraltar has open sightlines that favor Pharah air superiority — ban forces ground engages." },
      { name: "Widowmaker", reason: "Watchpoint: Gibraltar long sightlines reward Widowmaker pick attempts — ban removes the round-opener pick threat." },
    ],
  },
  "colosseo": {
    attack: [
      { name: "Sombra", reason: "Sombra hack disrupts Push engage timings — ban removes the only reliable counter to coordinated pushes." },
      { name: "Roadhog", reason: "Roadhog hook on engage punishes any tank commit; map-defining on tight chokes." },
    ],
    defense: [
      { name: "Pharah", reason: "Colosseo has open sightlines that favor Pharah air superiority — ban forces ground engages." },
      { name: "Widowmaker", reason: "Colosseo long sightlines reward Widowmaker pick attempts — ban removes the round-opener pick threat." },
    ],
  },
  "esperanca": {
    attack: [
      { name: "Sombra", reason: "Sombra hack disrupts Push engage timings — ban removes the only reliable counter to coordinated pushes." },
      { name: "Roadhog", reason: "Roadhog hook on engage punishes any tank commit; map-defining on tight chokes." },
    ],
    defense: [
      { name: "Pharah", reason: "Esperança has open sightlines that favor Pharah air superiority — ban forces ground engages." },
      { name: "Widowmaker", reason: "Esperança long sightlines reward Widowmaker pick attempts — ban removes the round-opener pick threat." },
    ],
  },
  "suravasa": {
    attack: [
      { name: "Sombra", reason: "Sombra hack disrupts Flashpoint engage timings — ban removes the only reliable counter to coordinated pushes." },
      { name: "Roadhog", reason: "Roadhog hook on engage punishes any tank commit; map-defining on tight chokes." },
    ],
    defense: [
      { name: "Pharah", reason: "Suravasa has open sightlines that favor Pharah air superiority — ban forces ground engages." },
      { name: "Widowmaker", reason: "Suravasa long sightlines reward Widowmaker pick attempts — ban removes the round-opener pick threat." },
    ],
  },
  "hanaoka": {
    attack: [
      { name: "Sombra", reason: "Sombra hack disrupts Clash engage timings — ban removes the only reliable counter to coordinated pushes." },
      { name: "Roadhog", reason: "Roadhog hook on engage punishes any tank commit; map-defining on tight chokes." },
    ],
    defense: [
      { name: "Pharah", reason: "Hanaoka has open sightlines that favor Pharah air superiority — ban forces ground engages." },
      { name: "Widowmaker", reason: "Hanaoka long sightlines reward Widowmaker pick attempts — ban removes the round-opener pick threat." },
    ],
  },
}

export default BANS
