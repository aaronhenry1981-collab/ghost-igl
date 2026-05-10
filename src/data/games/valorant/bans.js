// Valorant — per-map agent ban / discourage recommendations.
// Pro play uses agent bans; ranked does not. These reflect competitive priority.

const BANS = {
  "bind": {
    attack: [
      { name: "Cypher", reason: "Bind is Cypher's strongest map — TP trips and Showers Spycam shut down both attack lanes by themselves." },
      { name: "Viper", reason: "A Long Viper wall + B Hookah cage controls both site executes; banning her opens up clean utility lanes." },
    ],
    defense: [
      { name: "Raze", reason: "Raze nades clear Cypher trips and Showers anchors with ease; her satchel mobility punishes static defenders." },
      { name: "Skye", reason: "Skye flash + Trailblazer combo destroys default Bind defensive setups; banning her slows attack execs." },
    ],
  },
  "haven": {
    attack: [
      { name: "Cypher", reason: "Three sites with multiple flank lanes make Cypher trips a nightmare; he covers C Garage + A Long simultaneously." },
      { name: "Astra", reason: "Astra controls all three sites with global utility; her smokes adapt to any rotation read in real time." },
    ],
    defense: [
      { name: "Sova", reason: "Sova recon arrows clear C Lobby and A Long with zero risk; he counters all default Haven holds." },
      { name: "Jett", reason: "Jett dash mobility lets her abuse Haven's long sightlines; A Long and C Long are dash-defining." },
    ],
  },
  "split": {
    attack: [
      { name: "Killjoy", reason: "Killjoy lockdown ult on B + turret on A site is the textbook Split anchor; banning her opens both sites significantly." },
      { name: "Omen", reason: "Omen TP into Heaven + double smoke covers both A and B retakes; he is map-defining on Split." },
    ],
    defense: [
      { name: "Raze", reason: "Raze satchels into Heaven from A Ramps + Tower bypass anchor positions entirely; her nades clear Killjoy setups." },
      { name: "Breach", reason: "Breach stuns through walls + Aftershock punish anchors hiding in Heaven boxes; he counters static Split holds." },
    ],
  },
  "ascent": {
    attack: [
      { name: "Killjoy", reason: "Ascent is Killjoy's defining map — Lockdown ult on B + turret on Mid + nanoswarms cover both sites simultaneously." },
      { name: "KAY/O", reason: "KAY/O suppression ult clears Killjoy setups + Astra smokes for retake; ban removes the only counter to default Ascent." },
    ],
    defense: [
      { name: "Jett", reason: "Jett dash on Catwalk + Generator wins A round-openers; her mobility punishes static Ascent defenses." },
      { name: "Sova", reason: "Sova recon arrows on Mid Top + A Tree clear default anchor positions with zero risk." },
    ],
  },
  "icebox": {
    attack: [
      { name: "Sage", reason: "Sage wall on A Belt + B Tube blocks both site executes; her healing + slow orb anchor potential is map-defining." },
      { name: "Viper", reason: "Viper wall down Mid + Pit ult on retake makes Icebox unwinnable; she controls every executed round." },
    ],
    defense: [
      { name: "Sova", reason: "Sova recon clears Belt + Yellow anchors; his ult lockout retakes are map-defining on Icebox." },
      { name: "Jett", reason: "Jett updraft to A Rafters + Pipes opens up vertical attack angles defenders can't hold." },
    ],
  },
  "breeze": {
    attack: [
      { name: "Chamber", reason: "Breeze long sightlines make Chamber Tour de Force ult dominant; his TP sentinel covers both sites." },
      { name: "Viper", reason: "Viper wall + ult on Breeze is the textbook hold; she controls A Halls and B Tunnel simultaneously." },
    ],
    defense: [
      { name: "Jett", reason: "Jett operator + dash on A Bridge + B Hall punishes Breeze's long sightlines; she anchors any executed round." },
      { name: "Sova", reason: "Sova recon + Hunter's Fury through Breeze's walls clears default anchor positions cross-map." },
    ],
  },
  "lotus": {
    attack: [
      { name: "Killjoy", reason: "Three sites + multiple flank lanes make Killjoy lockdown + turret coverage map-defining on Lotus." },
      { name: "Harbor", reason: "Harbor walls control A Hut + B Main + C Hall executes simultaneously; he is the textbook Lotus controller." },
    ],
    defense: [
      { name: "Raze", reason: "Raze nades clear Lotus's tight chokes; her satchel mobility punishes Hut and Drop anchors." },
      { name: "Fade", reason: "Fade Nightfall ult through Lotus's connectors locks down 3+ defenders per use; she is map-defining for retakes." },
    ],
  },
  "sunset": {
    attack: [
      { name: "Cypher", reason: "Sunset's tight choke points + multiple rotation paths make Cypher trips and Spycam map-defining." },
      { name: "Omen", reason: "Omen TP into Heaven on both sites + double smoke covers retakes; he is the textbook Sunset controller." },
    ],
    defense: [
      { name: "Raze", reason: "Raze nades clear Sunset's default anchors; her satchel mobility into Mall and Elbow punishes static holds." },
      { name: "Skye", reason: "Skye flash + Trailblazer combo clears default Sunset holds; her ult locks down retake setups." },
    ],
  },
  "abyss": {
    attack: [
      { name: "Killjoy", reason: "Abyss's vertical layout + tight chokes make Killjoy lockdown ult and turret coverage map-defining." },
      { name: "Iso", reason: "Iso shield + ult dominates Abyss's 1v1 chokepoint duels; he is the textbook Abyss duelist." },
    ],
    defense: [
      { name: "Tejo", reason: "Tejo missiles + ult clear Abyss's anchor positions cross-site; he is map-defining for retakes." },
      { name: "Clove", reason: "Clove Not Dead Yet revive + smoke retakes punish stacked Abyss holds; she swings round economy." },
    ],
  },
  "corrode": {
    attack: [
      { name: "Vyse", reason: "Vyse's setup-heavy kit fits Corrode's long sightlines and tight chokes — VERIFY: confirm against pro VODs." },
      { name: "Clove", reason: "Clove's revive + double smoke punishes Corrode default holds — VERIFY: tier-1 meta read post-launch." },
    ],
    defense: [
      { name: "Waylay", reason: "Waylay's fast-mobility kit punishes Corrode's long lanes and rotate paths — VERIFY: tier-1 meta read post-launch." },
      { name: "Tejo", reason: "Tejo's missiles + ult clear default anchor positions on Corrode — VERIFY: confirm against pro VODs." },
    ],
  },
}

export default BANS
