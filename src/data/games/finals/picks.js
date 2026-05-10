// The Finals — must-pick build / weapon loadouts per arena per side.
// Replaces bans.js. Per-side recommendations based on extract / steal context.

const PICKS = {
  "las-vegas": {
    attack: [
      { name: "Heavy with Mesh Shield + RPG", reason: "Las Vegas vault contests reward Heavy front-line — Mesh Shield carries the cashout, RPG cracks defender utility." },
      { name: "Medium with Defibrillator + Healing Beam", reason: "Defib chain enables re-pushes on wipes; Healing Beam sustains the Heavy front-line through contests." },
      { name: "Light with Grappling Hook + Glitch Grenade", reason: "Grapple flanks reach off-angles defenders can't cover; Glitch denies enemy Defib + Mesh Shield." },
    ],
    defense: [
      { name: "Heavy with Barricade + APS Turret", reason: "Barricade seals the choke, APS denies grenades + RPGs. Mandatory defender Heavy on every Cashout hold." },
      { name: "Medium with Goo Gun + Smoke", reason: "Goo seals the entries, Smoke breaks contest line of sight. Standard utility for any extract hold." },
      { name: "Light with SR-84 Sniper + Cloak", reason: "Off-angle Sniper picks reach contest teams before they commit; Cloak repositions on flank reads." },
    ],
  },
  "monaco": {
    attack: [
      { name: "Heavy with Mesh Shield + RPG", reason: "Monaco vault contests reward Heavy front-line — Mesh Shield carries the cashout, RPG cracks defender utility." },
      { name: "Medium with Defibrillator + Healing Beam", reason: "Defib chain enables re-pushes on wipes; Healing Beam sustains the Heavy front-line through contests." },
      { name: "Light with Grappling Hook + Glitch Grenade", reason: "Grapple flanks reach off-angles defenders can't cover; Glitch denies enemy Defib + Mesh Shield." },
    ],
    defense: [
      { name: "Heavy with Barricade + APS Turret", reason: "Barricade seals the choke, APS denies grenades + RPGs. Mandatory defender Heavy on every Cashout hold." },
      { name: "Medium with Goo Gun + Smoke", reason: "Goo seals the entries, Smoke breaks contest line of sight. Standard utility for any extract hold." },
      { name: "Light with SR-84 Sniper + Cloak", reason: "Off-angle Sniper picks reach contest teams before they commit; Cloak repositions on flank reads." },
    ],
  },
  "seoul": {
    attack: [
      { name: "Heavy with Mesh Shield + RPG", reason: "Seoul vault contests reward Heavy front-line — Mesh Shield carries the cashout, RPG cracks defender utility." },
      { name: "Medium with Defibrillator + Healing Beam", reason: "Defib chain enables re-pushes on wipes; Healing Beam sustains the Heavy front-line through contests." },
      { name: "Light with Grappling Hook + Glitch Grenade", reason: "Grapple flanks reach off-angles defenders can't cover; Glitch denies enemy Defib + Mesh Shield." },
    ],
    defense: [
      { name: "Heavy with Barricade + APS Turret", reason: "Barricade seals the choke, APS denies grenades + RPGs. Mandatory defender Heavy on every Cashout hold." },
      { name: "Medium with Goo Gun + Smoke", reason: "Goo seals the entries, Smoke breaks contest line of sight. Standard utility for any extract hold." },
      { name: "Light with SR-84 Sniper + Cloak", reason: "Off-angle Sniper picks reach contest teams before they commit; Cloak repositions on flank reads." },
    ],
  },
  "kyoto": {
    attack: [
      { name: "Heavy with Mesh Shield + RPG", reason: "Kyoto vault contests reward Heavy front-line — Mesh Shield carries the cashout, RPG cracks defender utility." },
      { name: "Medium with Defibrillator + Healing Beam", reason: "Defib chain enables re-pushes on wipes; Healing Beam sustains the Heavy front-line through contests." },
      { name: "Light with Grappling Hook + Glitch Grenade", reason: "Grapple flanks reach off-angles defenders can't cover; Glitch denies enemy Defib + Mesh Shield." },
    ],
    defense: [
      { name: "Heavy with Barricade + APS Turret", reason: "Barricade seals the choke, APS denies grenades + RPGs. Mandatory defender Heavy on every Cashout hold." },
      { name: "Medium with Goo Gun + Smoke", reason: "Goo seals the entries, Smoke breaks contest line of sight. Standard utility for any extract hold." },
      { name: "Light with SR-84 Sniper + Cloak", reason: "Off-angle Sniper picks reach contest teams before they commit; Cloak repositions on flank reads." },
    ],
  },
  "sys-horizon": {
    attack: [
      { name: "Heavy with Mesh Shield + RPG", reason: "SYS$HORIZON vault contests reward Heavy front-line — Mesh Shield carries the cashout, RPG cracks defender utility." },
      { name: "Medium with Defibrillator + Healing Beam", reason: "Defib chain enables re-pushes on wipes; Healing Beam sustains the Heavy front-line through contests." },
      { name: "Light with Grappling Hook + Glitch Grenade", reason: "Grapple flanks reach off-angles defenders can't cover; Glitch denies enemy Defib + Mesh Shield." },
    ],
    defense: [
      { name: "Heavy with Barricade + APS Turret", reason: "Barricade seals the choke, APS denies grenades + RPGs. Mandatory defender Heavy on every Cashout hold." },
      { name: "Medium with Goo Gun + Smoke", reason: "Goo seals the entries, Smoke breaks contest line of sight. Standard utility for any extract hold." },
      { name: "Light with SR-84 Sniper + Cloak", reason: "Off-angle Sniper picks reach contest teams before they commit; Cloak repositions on flank reads." },
    ],
  },
  "bernal": {
    attack: [
      { name: "Heavy with Mesh Shield + RPG", reason: "Bernal vault contests reward Heavy front-line — Mesh Shield carries the cashout, RPG cracks defender utility." },
      { name: "Medium with Defibrillator + Healing Beam", reason: "Defib chain enables re-pushes on wipes; Healing Beam sustains the Heavy front-line through contests." },
      { name: "Light with Grappling Hook + Glitch Grenade", reason: "Grapple flanks reach off-angles defenders can't cover; Glitch denies enemy Defib + Mesh Shield." },
    ],
    defense: [
      { name: "Heavy with Barricade + APS Turret", reason: "Barricade seals the choke, APS denies grenades + RPGs. Mandatory defender Heavy on every Cashout hold." },
      { name: "Medium with Goo Gun + Smoke", reason: "Goo seals the entries, Smoke breaks contest line of sight. Standard utility for any extract hold." },
      { name: "Light with SR-84 Sniper + Cloak", reason: "Off-angle Sniper picks reach contest teams before they commit; Cloak repositions on flank reads." },
    ],
  },
}

export default PICKS
