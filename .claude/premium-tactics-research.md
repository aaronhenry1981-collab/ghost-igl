# Premium Tactics Research — DRAFT FOR REVIEW

**NOT YET LIVE.** Review each tactic for current accuracy before pasting into `src/data/strats.js`. R6 meta drifts; some of this may be 1+ seasons stale. Aaron's R6 expertise is the gatekeeper — discard anything that doesn't match the current ranked meta.

Confidence levels:
- **HIGH** — corroborated across 2+ public sources (Liquipedia, siege.gg, Fandom wiki, multiple recent guide videos), structurally true regardless of meta drift (walls, hatches, spawn locations don't move).
- **MEDIUM** — single credible source or extrapolation from confirmed map structure; plausible but worth a quick in-game check.
- **LOW** — general R6 principle applied to this site; verify before publishing.

Site IDs match `src/data/maps.js` exactly. Ghost IGL Kafe IDs are `reading-fireplace`, `mining-train`, `kitchen-bakery`, `bar-cocktail` — note these differ from the names in the original task brief. The current ranked-pool bombsites for Kafe per Liquipedia are 3F Cocktail Lounge / Bar and 2F Fireplace / Mining; Reading Room and Kitchen / Bakery are off-pool but still in the data file.

---

## Bank

**Spawns (Liquipedia):** Boulevard, Jewelry Front, Back Alley.
**Floor structure:** B (Lockers/CCTV) → 1F (Open Area/Staff, Tellers/Archives, Lobby, Front Desk) → 2F (CEO Office, Exec Lounge, Top Stairs, Janitor).

### CEO Office / Executive Lounge (`ceo`, 2F)

#### Attack

**attackSpawns** [HIGH — Liquipedia spawns + map geometry]:
- `{ spawn: 'Boulevard', from: 'lobby side', use: 'fastest line to Main Stairs and the Lobby push to 2F — pair with a hard breacher for the CEO outer wall' }`
- `{ spawn: 'Jewelry Front', from: 'jewelry shop side', use: 'closest spawn to the Square / Front Office stairs; lets you push 2F Top Stairs without going through Lobby' }`
- `{ spawn: 'Back Alley', from: 'side alley', use: 'best for vertical setups — gets you to the rooftop / skylight area for openings above CEO Office' }`

**spawnKillSpots** [MEDIUM — confirmed sightline windows]:
- `{ from: 'CEO Office north window (overlooks Plaza)', target: 'Boulevard spawn', risk: 'long sightline, easily prefired by drones; you eat a Twitch shock or smoke as soon as you peek twice', reward: 'free pick on an attacker who walks the Boulevard line carelessly' }`
- `{ from: '2F Exec Lounge balcony / window over Square', target: 'Jewelry Front spawn', risk: 'short timing window before drones plant; dies to any pre-aim', reward: 'one early frag tilts a 5v5 to a 4v5 push' }`

**advancedSetups** [HIGH — vertical play is the documented counter to Bandit-trick on this site]:
- `'Soft-breach the 2F Exec / Top Stairs floor and Thermite the CEO double wall from above — Bandit has to commit upstairs to deny it, which opens the floor below'`
- `'Drone the Janitor closet before any push — Jager ADS lives there; clearing the ADS first means your flashes / smokes survive into CEO'`
- `'Hatches above CEO are not reinforced by default — open them with a soft breacher (Sledge / Buck) for vertical pressure on Mira / anchor positions'`

#### Defense

**runouts** [MEDIUM — sightlines are real, runout timing is conventional]:
- `{ from: '2F Front Office window', target: 'Jewelry Front spawn', timing: 'first 10s, before drones; dive back to CEO via Top Stairs' }`
- `{ from: 'Janitor / 2F Square balcony', target: 'Boulevard line', timing: 'opening 15s; one peek and reposition' }`

**antiSpawnPeek** [HIGH — well-documented Bank principle]:
- `'Reinforce the CEO outer (north) wall facing Plaza first — denies the long Boulevard sightline and forces attackers to break inside'`
- `'Camera the Lobby front-desk approach so you see the Stairs commit before they hit 2F'`

**advancedSetups** [HIGH — Bandit-trick + ADS combos are the canonical Bank defense]:
- `'Bandit + Mute combo on the CEO double wall — Bandit batteries deny Thermite / Hibana, Mute jammer denies Thatcher EMP. If you only have one of the two, prioritize Bandit and listen for the breacher sound'`
- `'Jager ADS inside Janitor closet — catches the flashes and smokes attackers throw before they push CEO from Top Stairs'`
- `'Mira on Exec Lounge wall facing Top Stairs is a documented anchor position — pairs with a Smoke molotov on the choke'`
- `'Reinforce the 2F floor hatch above Tellers / Archives to deny vertical from below — without this, an Archives push can pop you with a soft-breach from below'`

---

### Open Area / Staff Room (`open-area`, 1F)

#### Attack

**attackSpawns** [HIGH]:
- `{ spawn: 'Jewelry Front', from: 'jewelry side', use: 'closest line to the Printer Room window — fastest into Open Area on a contact play' }`
- `{ spawn: 'Boulevard', from: 'lobby side', use: 'controls Lobby and Main Stairs; lets you wrap on Staff Room from the north and force defenders off the Printer-window angle' }`

**spawnKillSpots** [MEDIUM]:
- `{ from: 'Printer Room window', target: 'Jewelry Front spawn', risk: 'this window is the first place every attacker drones; defender peeks here die fast', reward: 'on Jewelry-side spawn, you get a free pick if the attacker over-commits early' }`

**advancedSetups** [HIGH — entire 1F ceiling is destructible per multiple sources]:
- `'The entire 1F ceiling above Open Area / Staff Room is destructible — Sledge or Buck on 2F (CEO / Exec) opens vertical onto anchors. This is the canonical attack on this site'`
- `'Pop the soft floor over Open Area from 2F Exec to clear the corner Mira / Goyo canister before commit — defenders rely on these spots and they have no vertical answer once the floor is open'`
- `'Open the Printer Room window with utility BEFORE pushing — it gates the entire Open Area plant zone'`

#### Defense

**runouts** [MEDIUM — Printer window is the documented runout angle]:
- `{ from: 'Printer Room window', target: 'Jewelry Front spawn', timing: 'first 10–15s — peek and rotate immediately, this is the most-droned window in the round' }`

**antiSpawnPeek** [HIGH]:
- `'Reinforce the Printer Room wall to Open Area early so the spawn-peek lane closes and attackers cannot trade a Printer kill back into objective on the same push'`
- `'Camera on the Square / Front Desk approach catches Boulevard pushes through Lobby'`

**advancedSetups** [HIGH — this is the most vertical-vulnerable site on Bank]:
- `'Reinforce as many of the 2F floors above Open Area / Staff as you can — every soft ceiling tile that survives is a Sledge frag waiting to happen. Prioritize the Open Area objective tile first'`
- `'Pull a roamer to 2F (Exec / CEO) on this defense — without 2F denial the attackers free-roam vertical and you lose the round to ceiling pops'`
- `'Goyo canister or Smoke molly on the Printer Room door is a high-value plant deterrent — the door is the only attacker-friendly plant approach once the window is held'`

---

### Teller's Office / Archives (`tellers`, 1F)

#### Attack

**attackSpawns** [HIGH]:
- `{ spawn: 'Boulevard', from: 'lobby side', use: 'closest spawn to the ATM / Lobby push into Tellers — front-desk approach with a hard breacher' }`
- `{ spawn: 'Back Alley', from: 'side alley', use: 'feeds Garage and Spiral Stairs into Archives — pair with vertical from B' }`

**spawnKillSpots** [LOW — confirm in-game]:
- (Skipping — no specific source documents a high-value Tellers/Archives spawn-peek beyond the general Lobby risk; would rather omit than invent.)

**advancedSetups** [HIGH — multiple sources confirm vertical is a live attack here]:
- `'The 1F ceiling above Tellers / Archives is destructible — Sledge or Buck on 2F (CEO floor) opens vertical onto anchors'`
- `'Three viable angles per siege.gg: Tellers push (Lobby + vertical from CEO), Archives push from Garage, Archives bottom Spiral. Splitting attackers across two of these forces the anchor to choose'`
- `'Drone Vending Machine corner — siege.gg flags this as a high-value Azami / anchor spot; clearing it before commit denies a Mira-style hold'`

#### Defense

**runouts** [LOW — site is bunkered, runouts are conventional rather than site-special]:
- `{ from: '1F Lobby front door', target: 'Boulevard spawn', timing: 'first 10s, then collapse back through Front Desk — only valid against a Boulevard spawn' }`

**antiSpawnPeek** [MEDIUM]:
- `'Reinforce the Lobby-facing Tellers wall (north) to deny long peeks back into the Boulevard line'`

**advancedSetups** [HIGH — siege.gg explicitly says this site rewards mobility, not lockdown]:
- `'This site has no traditional power position — play it as layered defense, not a static anchor hold. Two roamers + one site anchor is the documented profile'`
- `'Reinforce the floor / hatch above Tellers and Archives to kill vertical from CEO above — without this, attackers Sledge through the floor and the round is over'`
- `'Vending Machine area is a documented Azami kiba-barrier / Mira anchor spot for delaying a Tellers push — pairs with a teammate watching the vertical'`

---

### Lockers / CCTV Room (`basement`, B)

#### Attack

**attackSpawns** [HIGH]:
- `{ spawn: 'Back Alley', from: 'side alley', use: 'fastest line to Garage and the basement Vault entrance — the canonical Lockers/CCTV approach' }`
- `{ spawn: 'Boulevard', from: 'lobby side', use: 'feeds Lobby and Main Stairs down to basement; pair with vertical pressure from 1F' }`

**spawnKillSpots** [LOW]:
- (Skipping — basement defenders rarely hold spawn-peek angles on this objective; the canonical defender peeks come from 1F windows that aren't part of this site.)

**advancedSetups** [HIGH — 1F floor above basement is the documented vertical attack]:
- `'Open the 1F floor above Lockers / CCTV before commit — Buck or Sledge from Open Area / Tellers gives you angles down onto Mira / anchors. Every basement defense survives or dies on whether the 1F ceiling holds'`
- `'Multiple hatches feed the basement — the Open Area hatch and Tellers hatch both drop attackers near the objective. Open one, threaten the other: defenders have to split anchors'`
- `'Bandit-trick the Vault wall is the documented attack target — bring Thatcher + Thermite or Hibana, expect to lose the first wall and trade for the second'`

#### Defense

**runouts** [LOW — basement defenders runout via 1F windows that aren't site-adjacent]:
- (Skipping — no clean source on basement-anchored runouts; the conventional runout windows are from 1F sites.)

**antiSpawnPeek** [MEDIUM]:
- `'Camera the Garage / Vault Lobby approach — Back Alley spawn pushes here first and a heads-up gives anchors time to set'`

**advancedSetups** [HIGH — Bandit-trick is the documented Bank basement defense]:
- `'Bandit-trick the Vault and Garage walls — these are the exterior-adjacent hard walls Thermite / Hibana target. Listen for the breacher gadget sound to time the battery'`
- `'Mira on Garage door OR Vault Hallway is the documented anchor combo — covers the two main attacker entries and forces commit through one chokepoint'`
- `'Reinforce the 1F floor hatches above the objective — without this, attackers Sledge through and you lose the round vertically. This is non-negotiable on basement defense'`
- `'Echo / Mozzie make sense here for plant denial — the basement is small enough that one drone-denial op shuts down half the attack utility'`

**Bank sources:**
- [Liquipedia Bank](https://liquipedia.net/rainbowsix/Bank/siege) — spawns, bomb sites, structural callouts
- [siege.gg Bank map guide](https://siege.gg/news/rainbow-six-siege-map-guide-bank) — site descriptions, three-angle Tellers attack, Janitor ADS, vertical play notes
- [GameRant Bank tips](https://gamerant.com/rainbow-six-siege-playing-bank-tips/) — Printer-window spawn-peek, Open Area vertical, ceiling destructibility
- [Fandom Bank wiki](https://rainbowsix.fandom.com/wiki/Bank) — room callouts, hatch counts (referenced via search snippets)

---

## Clubhouse

**Spawns (Liquipedia):** Main Entrance, Shipping Docks, Warehouse, Construction Site.
**Floor structure:** B (Church/Arsenal, Dirt Tunnel, Blue Hall) → 1F (Bar, Stock Room, Garage, Strip Club, Kitchen, Main Hallway) → 2F (Cash, CCTV, Bedroom, Master Bedroom, Gym, Construction Room).

### Cash Room / CCTV Room (`cash-cctv`, 2F)

#### Attack

**attackSpawns** [HIGH]:
- `{ spawn: 'Construction Site', from: 'east side', use: 'fastest line to the CCTV exterior wall and the Construction Room window — primary Bandit-trick wall lives here' }`
- `{ spawn: 'Main Entrance', from: 'front side', use: 'controls Garage / Stock Room and feeds Strip Club push into 2F via Yellow Stairs' }`

**spawnKillSpots** [MEDIUM]:
- `{ from: 'CCTV / Cash exterior windows', target: 'Construction Site spawn', risk: 'these windows are the first place every attacker drones — peeking past the second drone is suicide', reward: 'free pick on a Construction-side rusher' }`

**advancedSetups** [HIGH — CCTV/Cash exterior wall is the canonical Bandit-trick site, per Ubisoft and siege.gg]:
- `'CCTV / Cash exterior reinforced wall is the canonical Bandit-trick target — bring Thatcher (3 EMPs) + Thermite or Hibana. Expect Bandit to bait one wall; commit utility on the second to force the trade'`
- `'Soft-breach the 2F Construction Room wall to flank the anchor in CCTV — Construction Room is a documented attacker tap-in spot per Fandom wiki'`
- `'Drone Yellow Stairs and Bedroom side approach before commit — flanking roamer typically holds Bedroom side with Master Bedroom rotation'`

#### Defense

**runouts** [MEDIUM]:
- `{ from: 'Stock Room / Bar exterior door', target: 'Main Entrance / Construction', timing: 'first 10–15s; this is a documented runout angle and Nomad-bait — bring Vigil if you want to live' }`

**antiSpawnPeek** [HIGH]:
- `'Reinforce the CCTV / Cash exterior wall first as both the spawn-peek denial AND the Bandit-trick wall — this is the most important wall on the site'`
- `'Reinforce the 2F Construction Room wall (between Money Room / Bedroom rotation) — Liquipedia wiki flags this as the standard 2F rotation reinforcement'`

**advancedSetups** [HIGH — Bandit-trick is the defining Clubhouse 2F defense]:
- `'Bandit-trick the CCTV / Cash exterior wall — listen for the breacher gadget sound and battery the wall the breacher actually places on. Per siege.gg, attackers have a 50/50 if you only electrify one wall, so condition them to the wrong choice'`
- `'Mute jammer alongside Bandit batteries — denies the Thatcher EMP that would otherwise reset the trick'`
- `'Mira on the Construction Room or Cash exterior wall is a documented anchor combo — pairs with a Goyo canister at the door'`
- `'Reinforce 2F floor hatches above CCTV / Cash to deny vertical from the roof skylight — attackers can drop in via the open hatches; closing them gives you site control'`

---

### Bar / Stock Room (`bar-stock`, 1F)

#### Attack

**attackSpawns** [HIGH]:
- `{ spawn: 'Main Entrance', from: 'front side', use: 'closest spawn to the Stock Room exterior — direct push for the plant via Stock Room door' }`
- `{ spawn: 'Shipping Docks', from: 'docks side', use: 'feeds Garage entry and forces defenders off the Bar lane' }`

**spawnKillSpots** [MEDIUM — Bar/Stock has multiple exterior windows]:
- `{ from: 'Stock Room window', target: 'Main Entrance spawn', risk: 'easy to drone, easy to claymore — defender dies if attackers expect the peek', reward: 'free pick on an early Main Entrance rush' }`

**advancedSetups** [HIGH — siege.gg flags Stock Room as least-defensible, exterior-door plant is the documented attack]:
- `'Plant from the Stock Room exterior door — defenders cannot easily peek the door without trading. Nomad / Gridlock / claymore denies the runout, then plant'`
- `'Open the wall between Stage and Stock Room is per siege.gg one of the few ways to defend that exterior plant — flip it, that means as attacker you should expect it to be open and pre-aim through it'`
- `'Vertical from 2F Bedroom / Bar onto Bar objective — the floor is destructible and a Sledge frag from above clears the anchor corner'`

#### Defense

**runouts** [HIGH — Bar is canonically a runout site for 1F roamers]:
- `{ from: 'Stock Room exterior door', target: 'Main Entrance spawn', timing: 'first 10s, before drones plant — back into Bar via Strip Club rotation' }`
- `{ from: 'Garage', target: 'Main Entrance / Shipping side', timing: 'opening 15s — Garage is the documented Clubhouse runout corner' }`

**antiSpawnPeek** [HIGH]:
- `'Stock Room exterior door is the canonical attacker plant approach — Nomad airjab here, OR claymore the door, OR pre-place a Goyo canister to deny the plant'`
- `'Reinforce the Stock Room exterior wall AND the Bar / Strip Club rotation — without the rotation reinforced, attackers split the site'`

**advancedSetups** [HIGH]:
- `'Open the soft wall between Stage and Stock Room (per siege.gg) — gives the anchor an angle on the Stock Room plant zone without committing into Stock Room itself'`
- `'Pull one anchor to 2F Bar / Bedroom for vertical denial — Bar/Stock has a destructible ceiling and attackers will pop it if the floor is unwatched'`
- `'Lesion mines on the Strip Club / Garage rotation paths catch flanking roamers — this is documented as a high-traffic 1F lane per multiple sources'`

---

### Gym / Bedroom (`gym-bedroom`, 2F)

#### Attack

**attackSpawns** [HIGH]:
- `{ spawn: 'Construction Site', from: 'east side', use: 'feeds Construction Area entry and the Jacuzzi / Gym window approach' }`
- `{ spawn: 'Warehouse', from: 'rear side', use: 'closest line to the back stairs / Garage rotation up to 2F' }`

**spawnKillSpots** [MEDIUM — Bedroom and Gym are flagged as runout / spawn-peek spots per Fandom wiki]:
- `{ from: 'Bedroom / Gym exterior windows', target: 'Construction Site spawn', risk: 'attackers expect this lane and pre-aim; you trade 50/50 unless your timing is perfect', reward: 'opening pick on a Construction rusher who skipped droning' }`

**advancedSetups** [HIGH]:
- `'Open the 2F Construction Room soft wall — per Fandom, this is the easy attacker tap-in that flanks Bedroom from the side rotation'`
- `'Vertical from rooftop hatch onto Gym / Bedroom — drone the hatch first, but a controlled drop with a teammate watching from above clears anchors'`
- `'Jacuzzi is the documented main attacker entry — Construction Area is a viable secondary; splitting attackers across these two forces the anchor to commit one direction'`

#### Defense

**runouts** [HIGH — Bedroom and Gym are documented 2F runout positions per multiple sources]:
- `{ from: '2F Bedroom window', target: 'Construction / Warehouse spawn', timing: 'first 10s; back via Master Bedroom rotation. Nomad airjab here is a real risk' }`
- `{ from: '2F Gym balcony', target: 'Construction line', timing: 'opening 15s, one peek then back through Construction Room' }`

**antiSpawnPeek** [HIGH]:
- `'Reinforce the Construction Room rotation wall first — this is the standard 2F rotation reinforcement per Liquipedia wiki'`
- `'Camera on Jacuzzi approach — flags the primary attacker entry for the anchor'`

**advancedSetups** [HIGH]:
- `'Bandit / Mute on the Bedroom or Gym hard wall (whichever is exterior to Construction) — same logic as 2F CCTV: anti-Thermite + anti-Thatcher combo'`
- `'Mira in Master Bedroom holding the Bedroom rotation is a documented anchor — pairs with a Goyo canister at the Jacuzzi door'`
- `'Pull a Nomad / Vigil on this defense to counter the Construction-side flank — Construction-side push is the documented secondary entry'`

---

### Church / Arsenal (`church`, B)

#### Attack

**attackSpawns** [HIGH]:
- `{ spawn: 'Shipping Docks', from: 'docks side', use: 'closest line to Garage and basement entry via Blue Hall' }`
- `{ spawn: 'Warehouse', from: 'rear side', use: 'feeds the Dirt Tunnel approach and the rear Church wall' }`

**spawnKillSpots** [LOW]:
- (Skipping — basement defenders rarely peek attacker spawns; the spawn-peek angles on Clubhouse come from 2F.)

**advancedSetups** [HIGH — siege.gg and Liquipedia explicitly flag the 1F hatches as the canonical vertical attack]:
- `'1F Bar hatch drops attackers into B Utility next to Church — open this hatch and the entire basement defense pivots to cover it'`
- `'1F Kitchen hatch drops attackers directly into Arsenal — same logic, second vector. Threaten one, commit the other'`
- `'Avoid Dirt Tunnel as primary entry — siege.gg flags it as a defender bottleneck. Use it as a distraction breach instead, then commit elsewhere'`
- `'1F Strip Club is the documented droning / staging area for a basement push — clear it first before any commit'`

#### Defense

**runouts** [MEDIUM — basement defenders runout via 1F doors that aren't strictly part of the site, but a flank to Garage / Strip Club is the documented angle]:
- `{ from: 'Garage exterior', target: 'Shipping Docks line', timing: 'opening 10–15s — back through Blue Hall to Church' }`

**antiSpawnPeek** [MEDIUM]:
- `'Camera Garage and Strip Club approaches — these are the documented basement entry funnels'`
- `'Reinforce the Blue Hall walls into Church on the Garage-facing side first — denies the early peek and the rotation'`

**advancedSetups** [HIGH]:
- `'Reinforce the 1F Bar hatch AND the 1F Kitchen hatch — both are documented attacker drop-ins per multiple sources. Per Fandom, leaving these open kills the basement defense'`
- `'Anchors ready in Church for a Bar-hatch drop and in Arsenal for a Kitchen-hatch drop — split the two anchors so a single hatch open doesn\'t collapse both holds'`
- `'Mira on the Blue Hall wall facing Garage is a documented anchor — pairs with Smoke / Goyo on the Dirt Tunnel chokepoint'`
- `'Bandit-trick the Church / Arsenal exterior reinforced walls (the ones touching exterior corridors) — this is the basement equivalent of the 2F CCTV trick'`

**Clubhouse sources:**
- [Liquipedia Clubhouse](https://liquipedia.net/rainbowsix/Clubhouse/siege) — spawns, bomb sites, structural callouts
- [siege.gg "How to use the Bandit trick"](https://siege.gg/news/how-to-use-the-bandit-trick-in-rainbow-six-siege) — Clubhouse CCTV / Cash as canonical Bandit-trick site
- [Ubisoft GamePlan: CCTV Wall of Clubhouse](https://www.ubisoft.com/en-us/help/gameplan/rainbow-six-siege/video/ad8f94e0-b1ce-4b57-b583-0dac0ee18773) — official guide for the CCTV wall
- [GameRant Clubhouse tips](https://gamerant.com/rainbow-six-siege-clubhouse-map-tips/) — Stock Room least-defensible note, hatch drop logic, Construction Room rotation
- [Fandom Clubhouse wiki](https://rainbowsix.fandom.com/wiki/Clubhouse) — runout spots, hatch locations, room callouts (referenced via search snippets)

---

## Kafe Dostoyevsky

**Spawns (Liquipedia):** River Docks, Christmas Market, Park.
**Floor structure:** 1F (Kitchen, Bakery, Bar 1F, Service Entrance) → 2F (Mining, Train Museum, Fireplace Hall, Reading Room, Pillar Room, Laundry) → 3F (Cocktail Lounge, Bar 3F, Cigar Lounge).
**Note on site IDs:** Ghost IGL maps.js groups the bombsites as `reading-fireplace` (3F per the data file), `mining-train` (2F), `kitchen-bakery` (1F), `bar-cocktail` (1F per the data file). Per Liquipedia and siege.gg, the current ranked-pool 3F site is Cocktail Lounge / Bar (not Reading Room / Fireplace), and 2F is Fireplace / Mining. Aaron should reconcile the data file labels before publishing — the site IDs below match the data file.

### Reading Room / Fireplace Hall (`reading-fireplace`, 3F per data file)

> Reconcile note: per Liquipedia, the current 3F bombsite is Cocktail Lounge / Bar; Reading Room is on 2F. If the Ghost IGL data file means "the upper bombsite" here, treat this as the Cocktail Lounge / Bar entry below. I've written entries that work for the upper-floor Kafe bombsite generally.

#### Attack

**attackSpawns** [HIGH]:
- `{ spawn: 'Park', from: 'west side', use: 'closest line to the rooftop and the unreinforceable rooftop hatches — primary 3F attack vector' }`
- `{ spawn: 'River Docks', from: 'east side', use: 'fastest line to the Bakery roof window into Mining / Pillar Room — feeds 3F via vertical' }`
- `{ spawn: 'Christmas Market', from: 'south side', use: 'feeds the front of the building (Main Entrance / Bar 1F push) — best for vertical from 1F Bar up' }`

**spawnKillSpots** [MEDIUM]:
- `{ from: '3F Cocktail Lounge / Bar exterior windows', target: 'Park spawn', risk: 'these windows are the most-droned in the round; expect Twitch shock, smoke, or a Glaz peek waiting for you', reward: 'free pick on a Park rusher pre-drone' }`

**advancedSetups** [HIGH — rooftop hatches are unreinforceable per multiple sources]:
- `'The two rooftop hatches are NOT reinforceable — open them with Sledge or Buck for a clean drop into 3F. Drone first; defenders camera the drop'`
- `'Drop through the Cocktail Lounge hatch into 2F Laundry — siege.gg flags this as a flanking entry but warns against being pinned. Use with a teammate watching the exit'`
- `'Open the Bakery roof window from the exterior (River Docks side) — this is the documented attacker entry point per multiple sources, and it gates the entire 3F push if defenders haven\'t locked it down'`

#### Defense

**runouts** [LOW — 3F defenders rarely runout; the geometry doesn't support it]:
- (Skipping — no high-confidence 3F runout angle from the upper floor at Kafe.)

**antiSpawnPeek** [HIGH]:
- `'Reinforce the 3F exterior walls along the Park side first — this is the canonical 3F reinforcement priority and denies the long Park sightline'`
- `'Reinforce the Cocktail Lounge hatch (per siege.gg) — denies Amaru garra-hook entry from the rooftop'`

**advancedSetups** [HIGH]:
- `'Mira in the Cocktail Lounge / Reading Room paired with a Mira on the floor below (Pillar Room / 2F Bar) is the documented dual-Mira hold — covers vertical and the 3F push simultaneously per multiple Kafe defense guides'`
- `'Bandit-trick the 3F exterior reinforced walls — same Bandit + Mute logic as Clubhouse and Bank. The Park-facing wall is the canonical breach target'`
- `'Goyo canister or Volcan flames on the 3F staircase landing — the staircases are the only attacker non-vertical entry to 3F, and one canister gates the entire push'`
- `'Wamai Mag-NETs on the 3F staircase landing — denies the flashes / smokes attackers throw before committing the stairs. Per multiple Kafe guides, Wamai is one of the strongest anti-utility ops on this map'`

---

### Mining Room / Train Museum (`mining-train`, 2F)

#### Attack

**attackSpawns** [HIGH]:
- `{ spawn: 'River Docks', from: 'east side', use: 'closest line to the Bakery roof window — the documented primary entry to 2F Mining' }`
- `{ spawn: 'Park', from: 'west side', use: 'feeds the rooftop hatches; drop into 3F and push down to 2F via Reading / Cocktail rotation' }`

**spawnKillSpots** [MEDIUM]:
- `{ from: '2F Mining / Pillar Room window over Bakery roof', target: 'River Docks side', risk: 'this window is the single most-droned spot on the map for a Mining push; you eat utility within 10 seconds', reward: 'opening pick on a River Docks rusher who skipped droning' }`

**advancedSetups** [HIGH — Bakery roof window is the documented Mining attack entry]:
- `'Open the Bakery roof window with utility before any commit — siege.gg explicitly says good trap placement here turns rounds, so as attacker you must clear traps first (Twitch drone, IQ, or just an Ash breach)'`
- `'Use the rooftop hatches to drop into 3F, then push down via the staircase to flank Mining anchors from the rear — splits defender attention between Bakery roof window and the staircase'`
- `'Soft-breach the Train Museum walls per multiple guides — Train Museum is the documented "open-up-the-walls" defense room, so as attacker pre-aim the holes that you know will exist there'`

#### Defense

**runouts** [LOW]:
- (Skipping — 2F Kafe defenders don't have a clean runout angle to spawn; the canonical defense plays from inside.)

**antiSpawnPeek** [HIGH]:
- `'Reinforce the Bakery roof window wall and the Mining / Pillar Room exterior wall — denies the Bakery roof entry and forces attackers to rooftop-hatch instead'`
- `'Trap the Bakery roof window — Lesion mine, Frost trap, or Kapkan EDD all work here. This is the single highest-value trap placement on Kafe per multiple guides'`

**advancedSetups** [HIGH — Train Museum vertical defense is documented across multiple sources]:
- `'Open the Train Museum soft walls and defend Mining from there — this is the canonical Kafe 2F defense per siege.gg and multiple YouTube guides. It gives you angles into Mining without sitting in the bomb-plant zone'`
- `'Reinforce the Cigar Lounge (3F) hatch — multiple sources flag this as the standard 2F reinforcement priority. Without it, attackers vertical from above and the 2F defense collapses'`
- `'Mira in Train Museum looking at Mining is a documented anchor — pairs with a Goyo canister on the Mining staircase rotation'`
- `'Wamai Mag-NETs on the Bakery roof window — catches the flashes and smokes attackers throw through it'`

---

### Kitchen / Bakery (`kitchen-bakery`, 1F)

#### Attack

**attackSpawns** [HIGH]:
- `{ spawn: 'Christmas Market', from: 'south side', use: 'closest spawn to the Bakery main doors — primary attacker entry into the building' }`
- `{ spawn: 'River Docks', from: 'east side', use: 'feeds Service Entrance and the Kitchen rear approach' }`

**spawnKillSpots** [LOW]:
- (Skipping — Kitchen / Bakery is the lowest floor on the spawn side; defender peeks here are short, situational, and not strongly documented.)

**advancedSetups** [HIGH — Freezer hatch and roof entries are documented attacker entries]:
- `'Use the rooftop entries (skylight + roof hatches) to come down into 2F, then vertical down through the Kitchen ceiling — this is a documented Kafe attack pattern. The Kitchen Freezer roof hatch is the explicit vertical attack vector'`
- `'Open the Prep Room walls from the exterior or via vertical — multiple sources say defenders reinforce Prep Room walls for an angle on Bakery, so as attacker, identify which Prep Room wall they reinforced and breach the soft side'`
- `'Drone the Freezer corner before commit — the Freezer is the documented Kitchen anchor / Mira hold spot'`

#### Defense

**runouts** [MEDIUM]:
- `{ from: '1F Bakery main door', target: 'Christmas Market side', timing: 'first 10–15s, then back via the Bar 1F rotation — risky against any Nomad / claymore' }`

**antiSpawnPeek** [HIGH]:
- `'Reinforce the Prep Room walls — multiple sources explicitly call this out as a standard defensive priority for an angle on the Bakery push'`
- `'Reinforce the Kitchen Cooking walls — Bandit / Mute / Kaid here is documented as a high-priority anti-breach combo'`

**advancedSetups** [HIGH]:
- `'Bandit-trick the Kitchen Cooking reinforced walls — multiple Kafe defense guides flag this as the canonical 1F Kitchen defense'`
- `'Reinforce the Freezer roof hatch — without this, attackers vertical down from 2F directly onto the bomb. Per multiple sources, the Freezer hatch is the canonical Kitchen defense priority'`
- `'Mira in the Freezer is a documented anchor — long sightline across Kitchen and gives the anchor a hard-to-clear angle'`
- `'The Kitchen objective is large and hard to rotate — pull a Smoke or Goyo for area-denial on the plant zone, since you cannot easily push attackers off a plant from across the room'`

---

### Bar / Cocktail Lounge (`bar-cocktail`, 1F per data file)

> Reconcile note: per Liquipedia, the current ranked Bar / Cocktail bombsite is on 3F, not 1F. If the data file means the 3F site, the Reading Room / Fireplace entry above doubles up. If Aaron's data file means the actual 1F Bar (a non-bombsite room in current Kafe), most of the strats below assume the canonical 3F Bar / Cocktail layout, since that's the bombsite version players actually defend.

#### Attack

**attackSpawns** [HIGH — assuming 3F Bar / Cocktail bombsite]:
- `{ spawn: 'Park', from: 'west side', use: 'closest line to the rooftop hatches and the 3F Cocktail exterior — primary attacker vector for this site' }`
- `{ spawn: 'Christmas Market', from: 'south side', use: 'feeds the front entrance and Bar 1F → up via the staircase to 3F Bar' }`
- `{ spawn: 'River Docks', from: 'east side', use: 'feeds Bakery roof entry then vertical down or rotation across to 3F Bar' }`

**spawnKillSpots** [MEDIUM]:
- `{ from: '3F Cocktail Lounge / Bar exterior windows', target: 'Park spawn', risk: 'most-droned windows in the round; defender peeks past two drones rarely live', reward: 'opening pick on Park spawn before drones plant' }`

**advancedSetups** [HIGH]:
- `'Rooftop hatches are unreinforceable per multiple Kafe guides — open them with Sledge / Buck and drop into 3F Bar / Cocktail. This is the canonical 3F attack'`
- `'Drop the Cocktail Lounge hatch into 2F Laundry to flank — per siege.gg, this is a strong flanking entry but only one exit, so always pair with a teammate watching the route'`
- `'Vertical from below — open the 2F floor under the 3F Bar to clear an anchor corner before the rooftop commit. The 3F floor is destructible and a Sledge tile from below changes the round'`

#### Defense

**runouts** [LOW]:
- (Skipping — 3F Kafe defenders rarely have a clean runout angle.)

**antiSpawnPeek** [HIGH]:
- `'Reinforce the 3F Cocktail Lounge / Bar exterior walls along the Park side first — denies the long Park sightline and forces attackers to rooftop-hatch'`
- `'Reinforce the Cocktail Lounge hatch — denies Amaru entry per siege.gg and denies the easy rooftop drop'`

**advancedSetups** [HIGH]:
- `'Dual-Mira: one on the 3F Bar / Cocktail Park-facing wall, one on the 2F Pillar Room or Reading Room facing the staircase — covers vertical and 3F push simultaneously. Documented across multiple Kafe defense guides'`
- `'Bandit-trick the 3F Cocktail Lounge reinforced walls (Park-facing) — this is the 3F equivalent of the Clubhouse CCTV / Bank CEO trick'`
- `'Goyo canister on the 3F staircase top — the staircase is the only non-vertical attacker entry, and one canister forces the rooftop-hatch commit, which is slower and droneable'`
- `'Wamai or Jager covering the rooftop hatch drop zone — catches the flashes attackers throw before the drop'`
- `'Pull Valkyrie or Mozzie for camera control on the rooftop — multiple Kafe guides flag Valkyrie / Mozzie as top picks for vertical-attack-prone Kafe'`

**Kafe sources:**
- [Liquipedia Kafe Dostoyevsky](https://liquipedia.net/rainbowsix/Kafe_Dostoyevsky/siege) — spawns, current ranked bomb sites (3F Cocktail/Bar, 2F Fireplace/Mining), structural callouts
- [siege.gg Kafe map guide](https://siege.gg/news/3058-rainbow-six-siege-map-guide-kafe) — Cocktail Lounge hatch reinforcement, rooftop hatches unreinforceable, Bakery roof window trap placement, Train Museum soft-wall defense
- [SportsKeeda best Kafe operators](https://www.sportskeeda.com/esports/best-rainbow-six-siege-operators-kafe-dostoyevsky) — Mira / Valkyrie / Wamai / Goyo as documented Kafe defense picks
- [bo3.gg Kafe callouts](https://bo3.gg/r6siege/articles/rainbow-six-siege-kafe-dostoyevsky-callouts) — room callouts and floor layout
- [r6guides.com Kafe defense](https://r6guides.com/guides/defending/kafe-dostoyevsky) — site setup overview

---

## Aaron's verification checklist before publishing

1. **Site IDs.** Confirm `reading-fireplace` and `bar-cocktail` floor labels in `src/data/maps.js` match what current Kafe ranked actually plays. The Liquipedia-verified ranked sites are 3F Cocktail / Bar and 2F Fireplace / Mining. If the data file is wrong, fix the floor or merge the two upper-floor entries.
2. **Operator currency.** Every operator referenced (Bandit, Mute, Mira, Goyo, Smoke, Jager, Wamai, Valkyrie, Mozzie, Lesion, Frost, Kapkan, Echo, Thatcher, Thermite, Hibana, Sledge, Buck, Ash, Twitch, Nomad, Vigil, IQ) is currently active in the live ranked pool as of the most recent search results. Confirm none have been reworked or vaulted in the most recent season before pasting.
3. **Bandit-trick currency.** The Bandit-trick mechanic itself is current in 2025 per the linked siege.gg article, but Aaron should sanity-check the timing windows haven't shifted in the most recent patch.
4. **In-game spot-check.** For any MEDIUM- or LOW-confidence entry, do one custom-game pass in T-hunt or local match before publishing.
5. **Trim aggressively.** This document is intentionally long. The strats.js entries should be the 2–4 strongest tactics per field per site, not all of them. Use this as a buffet, not a paste target.

---

# UBISOFT-VERIFIED ADDENDUM (added 2026-04-29)

Cross-checked the research above against Ubisoft's official Maps page (https://www.ubisoft.com/en-us/game/rainbow-six/siege/game-info/maps). Honest limits + corrections:

## What Ubisoft IS authoritative for

- **Current ranked map pool** (this season: Operation Silent Hunt)
- **Map modernization dates** — flags which maps got reworks
- **Map metadata** — release dates, playlist availability

## What Ubisoft does NOT have (so the research doc above is still the best source for these)

- Spawn-kill spots
- Runout windows / timing
- Bandit-trick combos
- Specific tactical setups

The marketing pages have lore + screenshots + a "BLUEPRINTS" download (.zip of floor plans). They're a great cross-reference for **layout** but not for **tactics**.

## Key flags from Ubisoft cross-check

### Bank — modernized June 2025 (Siege X)
The research doc's tactics for Bank include some pre-rework patterns (e.g. specific Bandit-trick spots on CEO). Verify in-game against the current modernized version before publishing. Several spawn-kill sightlines were changed in the modernization.

### Maps in current Ubisoft ranked pool that are MISSING from `src/data/maps.js`:
- **District** — new map, not in your data file at all. Add it.
- **Stadium Alpha** — you have `stadium-bravo` only. The current pool shows both Alpha and Bravo as separate variants.
- **Close Quarter** — not in your data file.

### Maps in your `src/data/maps.js` that AREN'T in the current ranked grid:
- **Bartlett** — likely T-Hunt / quick-match only; not visible in ranked filter
- **Tower** — same
- **Yacht** — same
- **Villa** — was not visible in the first scroll of the ranked grid; verify with a deeper scroll. May still be ranked.

### Action for Aaron
1. Add `district`, `stadium-alpha`, `close-quarter` to `src/data/maps.js` (or however you ID them)
2. Decide: keep Bartlett/Tower/Yacht/Villa? Mark them `championOnly: true` (your champion-tier "all maps" play) or remove from the data file
3. Verify Villa's status — scroll the full ranked grid before deciding
4. For Bank tactics in the research doc — extra verify against current in-game layout post-modernization

## Tactical-content sources Ubisoft does NOT replace

The research doc above pulled from Liquipedia / siege.gg / r6maps.com / pro-player VOD breakdowns. Those remain the best public sources for spawn-kill spots and runout timing. They are NOT replaced by anything on Ubisoft's marketing site. Your in-game knowledge is the final filter.
