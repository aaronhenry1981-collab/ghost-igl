# Map Data Corrections — Sourced from Ubisoft + r6calls.com

Last updated: 2026-05-09. ALL findings cross-referenced against at least 2 sources where possible.

**Methodology.** Authoritative ranked-pool status was pulled from r6calls.com's `mainData.json` (`https://r6calls.com/data/mainData.json`, `poolData.ranked.mapPool`) and cross-referenced against each map's official Ubisoft page (`https://www.ubisoft.com/en-us/game/rainbow-six/siege/game-info/maps/<slug>`) for the playlist tag. Bombsite layouts came from Liquipedia (`https://liquipedia.net/rainbowsix/<map>`) plus, for the high-priority maps, the official r6calls.com map SVGs (`https://r6calls.com/img/maps/<slug>.svg`) which embed every room name and bombsite letter as text spans. Modernization dates are taken verbatim from each Ubisoft map page's "Modernized Map" / "Reworked" line.

**Two known sources for the current ranked pool diverge.** r6calls.com lists 16 ranked maps (Bank, Border, Chalet, Club, Coastline, Consulate, Emerald, Kafe, Kanal, Lair, Labs, Oregon, Outback, Skyscraper, Themepark, Villa). siege.gg's Year 11 S1 mid-season article (Apr 16, 2026) lists 17 (the 16 above plus Fortress, minus Emerald). Hotspawn's Operation Tenfold Pursuit article (Dec 2025) lists 9 *competitive* maps (different from full ranked rotation): Bank, Border, Chalet, Clubhouse, Consulate, Kafe, Lair, Labs, Fortress. **The ranked-pool grid on Ubisoft's own per-map page is the tiebreaker** — I used that as the final yes/no for "in ranked" below. Where a map page tags it `Ranked`, I treat it as in. Where it doesn't (e.g. Emerald Plains), I treat it as out.

---

## Section 1: Maps Aaron should ADD to maps.js

For each map currently in the Ubisoft-tagged Ranked playlist but missing or improperly flagged in `maps.js`:

### Fortress — ADD as `rankedPool: true`

- **Suggested ID:** `fortress` (Aaron already has this slug, but currently flagged `rankedPool: false, comingSoon: true`)
- **Display name:** Fortress
- **Floor count:** 2 floors + roof/exterior (1F, 2F, R)
- **Bombsite list with IDs (per Liquipedia, post-Tenfold-Pursuit rework):**
  - `bedroom-commander` — Bedroom / Commander's Office (2F)
  - `dormitory-briefing` — Dormitory / Briefing Room (2F)
  - `kitchen-cafeteria` — Kitchen / Cafeteria (1F)
  - `hammam-sitting` — Hammam / Sitting Room (1F)
- **Modernization date:** December 2025 (Operation Tenfold Pursuit / Patch 10.4.0, full rework + ranked-eligible). Confirmed by Ubisoft map page ("Modernized: December 2025") and Liquipedia rework section.
- **Ubisoft playlists:** Quick Match, Unranked, Ranked.
- **Confidence:** HIGH (3 sources agree the rework went live Dec 2025; 2 sources agree on the bombsite pairs above).
- **Recommended action:** Flip `rankedPool: true`, drop `comingSoon: true` once Aaron adds strats. Replace Aaron's current site IDs (`commander-briefing`, `kitchen-dining`, `council-guard`, `tower-rooftop`) with the four above — they are all wrong post-rework. The "Council Chamber / Guard Room" and "Tower / Rooftop" Aaron has never existed as bombsites — those callouts are not in r6calls's Fortress SVG label set.

### Stadium Bravo — leave as `rankedPool: false`, but Aaron currently has `comingSoon: true`

- **Slug match:** `stadium-bravo` (already in `maps.js`, marked comingSoon)
- **Ubisoft playlists:** Quick Match, Unranked. **NOT in Ranked.**
- **Modernization date:** June 2024 (per Ubisoft Stadium Bravo page).
- **Confidence:** HIGH (Ubisoft + r6calls both agree Stadium Bravo is not in ranked).
- **Recommended action:** Keep `rankedPool: false`. If Aaron wants Champion-tier coverage, mark `championOnly: true` and remove `comingSoon` once strats land.

**No other maps need adding** — every map currently in the Ubisoft Ranked grid (Bank, Border, Chalet, Clubhouse, Coastline, Consulate, Kafe, Kanal, Lair, Nighthaven Labs, Oregon, Outback, Skyscraper, Theme Park, Villa, Fortress) already has an entry in Aaron's `maps.js`. Aaron does NOT need to add any all-new map cards.

---

## Section 2: Maps Aaron should REMOVE or FLAG as non-ranked

### Emerald Plains — FLIP `rankedPool: true` → `false`

- **Source 1 (HIGH confidence):** Ubisoft's Emerald Plains map page tags playlists as "Quick Match, Unranked, Team Deathmatch". **No Ranked tag.**
- **Source 2:** r6calls.com's `poolData.ranked.mapPool` includes `emerald` — this disagrees, but r6calls is community-maintained and looks like it hasn't been updated since the Year 11 ranked shake-up. Trust Ubisoft.
- **Recommended fix:** `rankedPool: false`. Aaron may want to keep it visible as a Champion-tier map (`championOnly: true`) since it's a unique map players care about — or just leave it un-flagged so it shows for everyone in the non-ranked tab.

### Bartlett University — REMOVE entirely

- Bartlett was retired from R6 Siege when T-Hunt and Situations were removed (Operation Solar Raid era). Per Liquipedia and Fandom wiki, Bartlett was last available in Custom Game / Training Grounds and was removed from Custom Game in Operation Brutal Swarm.
- **It does not exist in Ubisoft's current map index** (only 27 maps listed; Bartlett is not one).
- **Recommended fix:** Delete the Bartlett entry from `maps.js`. Aaron's "Library / Classrooms", "Bar / Stage", "Basement / Lockers", "Cafeteria / Kitchen" sites are pre-rework Bartlett layout and aren't authoritative for any current playable version.
- **Confidence:** HIGH (3 sources: Liquipedia, Fandom, Ubisoft maps grid).

### Maps Aaron has flagged `rankedPool: false, comingSoon: true` that ARE actually in Ubisoft Ranked

These need `rankedPool: true`:

| Map | Aaron's current flag | Ubisoft tag | r6calls ranked pool | Recommended |
|---|---|---|---|---|
| **Fortress** | `rankedPool: false, comingSoon: true` | Ranked | not listed (pre-Tenfold) | `rankedPool: true` |
| **Outback** | `rankedPool: false, comingSoon: true` | Ranked | listed | `rankedPool: true` |
| **Kanal** | `rankedPool: false, comingSoon: true` | Ranked | listed | `rankedPool: true` |

Aaron's current Outback/Kanal/Fortress entries have unauthoritative bombsite lists — see Section 3.

### Maps that are correctly flagged non-ranked

These are confirmed NOT in Ubisoft's current ranked grid — Aaron has them right (`rankedPool: false`):

- Favela (Modernized: June 2021. Playlists: Quick Match, Unranked.)
- Hereford Base (Reworked: September 2018. Playlists: Quick Match, Unranked.)
- House (Reworked: June 2020. Playlists: Quick Match, Unranked.)
- Plane / Presidential Plane (Original 2015 release; never modernized. Playlists: Quick Match, Unranked.)
- Tower (Released November 2017; no modernization listed. Playlists: Quick Match, Unranked.)
- Yacht (Released February 2016; no modernization. Playlists: Quick Match, Unranked.)

---

## Section 3: Bombsite layout corrections per map

### Bank — VERIFY (looks correct, modern)

- **Aaron has:** ceo (CEO Office / Executive Lounge, 2F), open-area (Open Area / Staff Room, 1F), tellers (Teller's Office / Archives, 1F), basement (Lockers / CCTV Room, B)
- **Liquipedia says:** Bombsite 1 (2F) CEO Office / Executive Lounge; Bombsite 2 (1F) Open Area / Staff Room; Bombsite 3 (1F) Tellers' Office / Archives; Bombsite 4 (B) CCTV / Lockers.
- **r6calls Bank SVG labels** include: CEO, Janitor, Skylight, Tellers, Archives, Open Space, Staff (Open Space Hallway too — see Section 4 for callout note), Lockers, CCTV, Vault, Server, Tunnel, Garage.
- **Confidence:** HIGH — Aaron's site IDs match. **No fix needed** for the bombsite layout itself, just confirm callouts (Section 4).

### Border — Floor labels need correction

- **Aaron has:** armory-archives (Armory Lockers / Archives, 2F), workshop-ventilation (Workshop / Ventilation Room, 1F), customs-supply (Customs Inspection / Supply Room, 1F), bathroom-tellers (Tellers / Bathroom, **2F**)
- **Liquipedia says:** Bombsite 4 Armory Lockers / Archives is 2F (matches). Bombsite 1 Supply / Customs (1F, matches). Bombsite 2 Workshop / Ventilation (1F, matches). Bombsite 3 Bathroom / Tellers — Liquipedia inconsistently lists this as 1F, but the in-game floor label says **2F** (Tellers room is upstairs). Aaron's 2F is correct.
- **r6calls Border SVG** includes Bathroom, Tellers, Archives, Armory, Customs, Supply, Workshop, Ventilation — all match.
- **Confidence:** HIGH on Aaron's layout. **No fix needed.**

### Chalet — VERIFY (looks correct)

- **Aaron has:** master-office (2F), bar-gaming (1F), kitchen-trophy (1F), wine-snowmobile (B).
- **Liquipedia says:** Office / Master Bedroom (2F); Gaming Room / Bar (1F); Wine Cellar / Snowmobile Garage (B). Liquipedia list omits Kitchen / Trophy as a bomb pair, but acknowledges the 1F config can include Kitchen — and r6calls's Chalet SVG explicitly has both Kitchen and Trophy as labelled rooms.
- **Confidence:** MEDIUM — Liquipedia shows 3 sites; in-game has 4. Aaron's list is consistent with the live ranked rotation. **No fix needed.**

### Clubhouse — Site naming order needs review

- **Aaron has:** cash-cctv (Cash Room / CCTV Room, 2F), bar-stock (Bar / Stock Room, 1F), church (Church / Arsenal, B), gym-bedroom (Gym / Bedroom, 2F).
- **Liquipedia says:** Bombsite 1 (2F) Bedroom / Gym; Bombsite 2 (2F) Cash Room / CCTV Room; Bombsite 3 (1F) Bar / Stock Room; Bombsite 4 (B) Church / Arsenal Room.
- **r6calls Clubhouse SVG** has all of: Cash, CCTV, Bar, Stock, Church, Arsenal, Gym, Bedroom — matches.
- **Confidence:** HIGH. **No fix needed.**

### Coastline — VERIFY (looks correct, just modernized March 2026)

- **Aaron has:** hookah-billiards (Hookah Lounge / Billiards Room, 2F), theater-penthouse (Theater / Penthouse, 2F), kitchen-service (Kitchen / Service Entrance, 1F), blue-bar (Blue Bar / Sunrise Bar, 1F).
- **r6calls Coastline SVG** confirms: Hookah, Pool Table (= Billiards in older callouts — see callout note below), VIP / Penthouse, Sunrise, Blue Bar, Kitchen.
- **Note:** the r6calls SVG does not contain a "Theater" or "Billiards" label — those have been renamed in the March 2026 modernization. New names appear to be **VIP** (where Theater was) and **Pool Table** / **Pool Bar** (where Billiards was). See Section 4.
- **Confidence:** MEDIUM — site IDs are still correct conceptually; display names should be updated to match new in-game labels.

### Consulate — Major callout drift, possible site rename

- **Aaron has:** consul-meeting (Consul Office / Meeting Room, 2F), lobby-press (Lobby / Press Room, 1F), garage-cafeteria (Garage / Cafeteria, B), tellers-archives (Tellers / Archives, 1F).
- **Liquipedia says:** Bombsite 1 (2F) Meeting / Consulate Office (matches). Bombsite 2 (1F) Piano Room / Exposition Room (Aaron is missing this — he has "Lobby / Press Room" which doesn't exist post-rework). Bombsite 3 (1F → B per Liquipedia) Tellers / Servers (Aaron has "Tellers / Archives" — Archives doesn't exist on post-2023 Consulate; it's now "Servers" or pairs differently). Bombsite 4 (B) Cafeteria / Garage (matches).
- **r6calls Consulate SVG labels** confirm post-rework Consulate has: Admin, Meeting, Piano, Expo, Tellers, Servers, Garage, Memorial, Lobby, Visa, CEO Side, Police, Coffee, Long Desk, Lockers, etc. **No "Press Room" exists. No "Archives" exists.**
- **Recommended fix:**
  - `consul-meeting` → keep, but rename to `meeting-consul` to match Liquipedia ordering (Meeting Room / Consulate Office, 2F)
  - `lobby-press` → REPLACE with `piano-expo` (Piano Room / Exposition, 1F)
  - `tellers-archives` → REPLACE with `tellers-servers` (Tellers / Servers — and per Liquipedia these are split-floor: Tellers is 1F, Servers is B)
  - `garage-cafeteria` → keep (Cafeteria / Garage, B)
- **Confidence:** HIGH — Aaron's Consulate data is built on the pre-2023-rework map. Operation Dread Factor (May 2023) reworked the map heavily; Operation High Stakes (Sept 2025) modernized again. Aaron's strats.js Consulate callouts mostly reflect the OLD map.

### Kafe Dostoyevsky — Floor labels are wrong

- **Aaron has:** reading-fireplace (Reading Room / Fireplace Hall, **3F**), mining-train (Mining Room / Train Museum, **2F**), kitchen-bakery (Kitchen / Bakery, 1F), bar-cocktail (Bar / Cocktail Lounge, 1F).
- **Liquipedia says:** Cocktail Lounge / Bar is **3F** (top floor). Fireplace / Mining is 2F (with two configs: Reading / Fireplace also 2F or Fireplace / Mining 2F). Kitchen Service / Kitchen Cooking is 1F.
- **siege.gg map guide** confirms Bar / Cocktail Lounge is the top floor (3F), not Reading Room.
- **r6calls Kafe SVG labels** include: Reading, Fireplace, Mining, Train, Cocktail, Bar, Bakery, Kitchen, Cooking, Service. The Kafe Modernized in Siege X (June 2025).
- **Recommended fix:** Swap floor assignments:
  - `bar-cocktail` should be **3F** (top floor)
  - `reading-fireplace` should be **2F**
  - `mining-train` should be **2F** (or merge with reading-fireplace; in some game configs only 3 sites are active per round)
  - `kitchen-bakery` stays **1F**
- **Confidence:** HIGH — multiple sources agree top floor is Bar / Cocktail Lounge.

### Oregon — Floor labels and a missing site

- **Aaron has:** kids-dorms (Kids' Dorms / Bunk, 2F), meeting-hall (Meeting Hall / Kitchen, 1F), laundry (Laundry / Supply Room, B), tower (Attic / Tower, **3F**).
- **Liquipedia (post-Silent-Hunt March 2026):** Bombsite 1 (2F) Kids' Dorms / Dorms Main Hall; Bombsite 2 (1F) Kitchen / Dining Hall; Bombsite 3 (1F) Meeting / Kitchen; Bombsite 4 (B) Laundry Room / Supply Room. **No "Attic / Tower" bombsite is listed — Tower is a strat callout, not a bombsite pair.**
- **r6calls Oregon SVG** confirms Tower, Small Tower, Attic exist as room labels but no `5A`/`5B` markers — Oregon has at most 4 bombsite pairs.
- **Note on Aaron's "meeting-hall" pair:** Aaron labels it as Meeting Hall / Kitchen — Liquipedia has Kitchen / Dining as the 1F pair AND Meeting / Kitchen as a separate 1F pair. Aaron's may merge two. Modernized for Year 11 in March 2026.
- **Recommended fix:**
  - `tower` site (Attic / Tower, 3F) — REMOVE. This is not a real bombsite. (Or keep as a flavor card with Champion-only premium tactics around the tower roam path.)
  - `meeting-hall` — split into TWO sites if Aaron wants full coverage: `meeting-kitchen` (Meeting / Kitchen, 1F) and `kitchen-dining` (Kitchen / Dining Hall, 1F). Or keep one as a hybrid.
- **Confidence:** HIGH on tower removal. MEDIUM on the Meeting/Kitchen/Dining split.

### Villa — VERIFY, modernized March 2026

- **Aaron has:** aviator-games (Aviator / Games, 2F), trophy-statuary (Trophy / Statuary, 2F), kitchen-dining (Kitchen / Dining, 1F), living-library (Living / Library, 1F).
- **Liquipedia says:** all four pairs match exactly (Aviator / Games 2F; Trophy / Statuary 2F; Living / Library 1F; Dining / Kitchen 1F).
- **Confidence:** HIGH. **No fix needed.**

### Lair — Major bombsite layout mismatch

- **Aaron has:** balcony-memorial (Balcony / Memorial, 2F), surveillance-lounge (Surveillance / Lounge, 2F), lab-workshop (R&D Lab / Workshop, 1F), server-vault (Server / Vault, B).
- **Liquipedia says:** 2F Master Office / R6 Room. 1F Bunks / Briefing AND Armory / Weapon Maintenance. Basement Lab / Lab Support.
- **r6calls Lair SVG labels include:** Bunks, Briefing (typo'd in SVG as "Breifing"), Armory, Lab, Server, CCTV, Master, Mezzanine, Medical, Operational, Reception, Six, Toxin, Missile, Filtration, Stockpile, Mask, Booth — none of "Surveillance", "Memorial" (Memorial is a Consulate callout, not Lair), "Workshop", or "Vault" appear.
- **Recommended fix:**
  - `balcony-memorial` → REPLACE with `master-r6` (Master Office / R6 Room, 2F)
  - `surveillance-lounge` → REPLACE — there is no second 2F bomb pair in standard Lair; Lair has 1×2F + 2×1F + 1×B. Remove or remap to `bunks-briefing` (1F).
  - `lab-workshop` → REPLACE with `armory-weapon` (Armory / Weapon Maintenance, 1F) AND/OR `bunks-briefing` (Bunks / Briefing, 1F)
  - `server-vault` → REPLACE with `lab-support` (Lab / Lab Support, B). Server exists as a callout but isn't a bombsite room name.
- **Confidence:** HIGH — Aaron's Lair callouts (Balcony, Memorial, Surveillance, Lounge, R&D Lab, Workshop, Vault) appear to be invented or copy-pasted from a different map's structure. None match in-game labels.

### Nighthaven Labs — Layout mismatch

- **Aaron has:** server-control (Server Room / Control Room, **B**), assembly-production (Assembly / Production, 1F), briefing-meeting (Briefing Room / Meeting Room, 2F), dormitory-bunks (Dormitory / Bunks, 2F).
- **Liquipedia says:** Bombsite 1 (2F) Command / Server. Bombsite 2 (1F) Control / Storage. Bombsite 3 (1F) Kitchen / Cafeteria. Bombsite 4 (B) Tank / Assembly.
- **r6calls Labs SVG** confirms: Command, Server, Control, Storage, Kitchen, Cafeteria, Tank, Assembly, Meeting, Workshop, Cargo, Lobby, Helipad, Generator. **"Briefing", "Bunks", "Dormitory", "Production" do NOT appear.**
- **Recommended fix:**
  - `server-control` → REPLACE with `command-server` (Command / Server, 2F)
  - `assembly-production` → REPLACE with `tank-assembly` (Tank / Assembly, B)
  - `briefing-meeting` → REPLACE with `control-storage` (Control / Storage, 1F)
  - `dormitory-bunks` → REPLACE with `kitchen-cafeteria` (Kitchen / Cafeteria, 1F)
- **Confidence:** HIGH — 3 sources (Liquipedia, r6calls SVG, Ubisoft Solar Raid release article) confirm Nighthaven Labs has no Briefing/Dormitory/Bunks rooms. Aaron's data is wrong.

### Skyscraper — Floor labels swapped

- **Aaron has:** tea-room (Tea Room / Karaoke, 2F), bedroom (Bedroom / Closet, **2F**), kitchen (Kitchen / BBQ, 1F), work-office (Work Office / Exhibition, **1F**).
- **Liquipedia says:** Bombsite 1 (2F) Tea / Karaoke (matches). Bombsite 2 (2F) Work Office / Exhibition (Aaron has 1F — **wrong**). Bombsite 3 (1F) BBQ / Kitchen (matches). Bombsite 4 (1F) Bedroom / Bathroom (Aaron has Bedroom / Closet on 2F — **wrong on both site name and floor**).
- **r6calls Skyscraper SVG** confirms: Tea, Karaoke, Office, Exhibition, BBQ, Kitchen, Bedroom, Bathroom (and Closet exists too — likely a sub-room of Bedroom, not the bomb pair).
- **Recommended fix:**
  - `tea-room` → keep (Tea Room / Karaoke, 2F)
  - `bedroom` → rename `bedroom-bathroom` (Bedroom / Bathroom, **1F**), not 2F and not "Closet"
  - `kitchen` → keep (Kitchen / BBQ, 1F)
  - `work-office` → rename `work-exhibition` (Work Office / Exhibition, **2F**), not 1F
- **Confidence:** HIGH — Liquipedia + Ubisoft modernization (Dec 2025 rework reaffirms current layout) + r6calls SVG agree.

### Theme Park — Layout possibly correct

- **Aaron has:** throne-room (Throne Room / Armory, 2F), lab (Lab / Storage, 1F), office (Office / Initiation, 2F), bunk (Bunk / Day Care, 1F).
- **r6calls Themepark SVG** has all of: Throne, Armory, Lab, Storage, Office, Initiation, Bunk, Day Care, Drug, Maintenance — Aaron's site IDs are plausible. Theme Park modernized December 2025.
- **Confidence:** MEDIUM — couldn't get Liquipedia to give bombsite confirmation in clean form; the labels exist on the SVG so layout is at least internally consistent.

### Outback — Layout mismatch (Aaron's data is pre-November 2021 rework)

- **Aaron has:** laundry-games (Laundry Room / Games Room, 2F), office-mechanic (Office / Mechanical Bull Room, 2F), bushranger-bathroom (Bushranger / Bathroom, 1F), compressor-party (Compressor Room / Party Room, 1F).
- **Liquipedia says (post-2021-rework):** Bombsite 1 (2F) Laundry Room / Piano Room. Bombsite 2 (2F) Party Room / Office. Bombsite 3 (1F) Green Bedroom / Red Bedroom. Bombsite 4 (1F) Mechanic Shop / Kitchen.
- **r6calls Outback SVG** confirms: Laundry, Piano, Party, Office, Green, Red, Garage, Kitchen, Bull (yes), Reptile, Restaurant, Lobby, Lounge, Shark, Showers, Storage Yard. **No "Compressor Room", "Bushranger", or "Games Room".**
- **Recommended fix:**
  - `laundry-games` → REPLACE with `laundry-piano` (Laundry / Piano, 2F)
  - `office-mechanic` → REPLACE with `party-office` (Party / Office, 2F)
  - `bushranger-bathroom` → REPLACE with `green-red` or `bedrooms` (Green Bedroom / Red Bedroom, 1F)
  - `compressor-party` → REPLACE with `mechanic-kitchen` (Mechanic Shop / Kitchen, 1F)
- **Confidence:** HIGH — Aaron's Outback data is from the pre-November 2021 layout (the original Burnt Horizon release). Outback was reworked in Operation High Calibre and the bombsite pairs changed.

### Kanal — Layout mismatch (Aaron's data is pre-September 2019 rework or invented)

- **Aaron has:** server-radio (Server Room / Radio Room, 2F), kitchen-coast (Kitchen / Coast Guard Meeting, 1F), construction-control (Construction Site / Control Room, 1F), engine-supply (Engine Room / Supply Room, B).
- **r6calls Kanal SVG** has: Server, Radio, Construction, Control, Lock Gate, Diving, Kayaks, Map, Model, Museum, Renovations, Forklift, Lounge, Meeting, Kitchen, Garage, Archives, Pipes, Radar, Projector, Bridge, Lawn, Locker, Printer, Gym, Shower, Supply. **No "Coast Guard Meeting", no "Engine Room".**
- **Liquipedia bombsite info couldn't be cleanly extracted** in the time available, but the canonical Kanal post-2019-rework pairs per community consensus are:
  - 2F Server / Radio (Aaron got this right — though "Radio Room" may be more accurately "Radio" per r6calls)
  - 2F Map / Map Room (alternate config)
  - 1F Construction / Control (matches Aaron, though "Control Room" → "Control")
  - 1F Lock Gate / Lounge or similar
  - **There is no Basement objective on modern Kanal** — Kanal has 2F + 1F + waterfront/dock area, no "B" floor with bombsites.
- **Recommended fix:**
  - `kitchen-coast` → REPLACE with `kitchen-meeting` or similar; "Coast Guard Meeting" room name is not in r6calls labels. Verify in-game.
  - `engine-supply` → REPLACE or REMOVE; Engine Room is not a Kanal bombsite. This may be a leftover from a different map's data.
- **Confidence:** MEDIUM — Aaron has 2 sites that look valid (server-radio, construction-control) and 2 sites that don't match modern Kanal at all. Recommend Aaron verify in-game / via custom match before strats.js gets filled out.

### Emerald Plains — Layout mismatch

- **Aaron has:** lounge-bedroom (Lounge / Bedroom, 2F), kitchen-dining (Kitchen / Dining, 1F), bar-irish (Bar / Irish Room, 1F), gym-studio (Gym / Studio, 2F).
- **Liquipedia says:** Bombsite 1 (2F) Administration / CEO Office. Bombsite 2 (2F) Private Gallery / Meeting. Bombsite 3 (1F) Bar / Lounge. Bombsite 4 (1F) Dining / Kitchen.
- **r6calls Emerald SVG labels include:** Admin, CEO, Library, Lounge, Bar, Meeting, Pantry, Dining, Kitchen, Music, Pool, Trophy, Statue, Vault, Wine, Stables, Stock, Painting, Folding Screen, Harp. **No "Irish Room", no "Bedroom", no "Gym", no "Studio".**
- **Recommended fix:**
  - `lounge-bedroom` → REPLACE with `admin-ceo` (Administration / CEO Office, 2F)
  - `kitchen-dining` → keep (Dining / Kitchen, 1F) — Aaron's site ID matches but the name order is reversed
  - `bar-irish` → REPLACE with `bar-lounge` (Bar / Lounge, 1F)
  - `gym-studio` → REPLACE with `gallery-meeting` (Private Gallery / Meeting, 2F)
- **Confidence:** HIGH — multiple sources agree Emerald Plains has Admin/CEO/Gallery/Meeting/Bar/Lounge/Dining/Kitchen as the 4 bomb pairs. Aaron's sites read like they were copied from Bartlett's pre-rework concept (Emerald Plains was originally a Bartlett rework — see search result).

---

## Section 4: Callout corrections per map

### Bank (`src/data/strats.js`)

- **Site `ceo` (attack/defense):** "Spiral Stairs" — r6calls SVG calls these **"Square Stairs"** + a separate "Lobby Stairs" + "Main Stairs". "Spiral Stairs" is a Consulate callout, not Bank. **Recommended:** drop "Spiral Stairs" or rename to "Main Stairs". HIGH confidence.
- **Site `open-area` (attack):** "Main Stairs" exists. "Admin" exists. "Lobby" exists. "Electrical" exists. "Staff Room" — r6calls SVG just labels this room "Open Space" / "Open Space Hallway" — Aaron's "Staff Room" callout for the 1F site isn't a label r6calls uses. Could be old terminology; the Liquipedia bombsite name is still "Open Area / Staff Room" so the site name stays, but the in-game callout for the room is "Open Space" or similar. MEDIUM confidence.
- **Site `tellers`:** "Square" — r6calls confirms this exterior area. All other callouts (Tellers, Archives, Lobby, Main Stairs, Admin) match. HIGH confidence on existing list.
- **Site `basement`:** All callouts (Lockers, CCTV, Server Stairs, Tunnel, Garage, Elevator) match r6calls labels (Server / Tunnel / Garage / Elevators all present). HIGH confidence.

### Border (`src/data/strats.js`)

- **Aaron's callouts include "East Balcony"** — matches r6calls SVG exactly. HIGH.
- **Aaron's "Detention"** — r6calls confirms. HIGH.
- **Aaron's "Central Stairs"** — r6calls labels these **"Main Stairs"** (with West/East variants). MEDIUM — community may use both, but in-game label is "Main Stairs".
- **Aaron's "Break Room"** on `bathroom-tellers` defense — r6calls has no "Break Room" label on Border (Cafeteria / Sandwich exist). LOW confidence on "Break Room" being a Border callout. **Recommended:** remove or rename.

### Chalet (`src/data/strats.js`)

- **Aaron's callouts:** Master Bedroom, Office, Balcony, Main Stairs, Back Stairs, Library, Bar, Gaming Room, Campfire, Trophy, Fireplace, Connector, Wine Cellar, Snowmobile Garage, Basement Corridor, Garage Door, Wine Cellar Stairs, Kitchen.
- **r6calls Chalet SVG** confirms: Master, Office, Balcony, Main Stairs, Library, Bar, Gaming, Campfire, Trophy, Fireplace, Wine, Snowmobiles, Garage, Bar Stock, Kitchen.
- **"Connector"** — not a Chalet label per r6calls (no Connector room). In-game players sometimes use it informally; safer to use a specific name. LOW confidence on keeping.
- **"Garage Door"** — r6calls just labels as "Garage". MEDIUM, OK as colloquial.
- **HIGH confidence** on most callouts.

### Clubhouse (`src/data/strats.js`)

- **Aaron's "Construction"** on the cash-cctv site — r6calls SVG has "Construction Site" as a label. Match. HIGH.
- **Aaron's "Master Bedroom"** on cash-cctv — r6calls labels the room "Bedroom" (no "Master"). Aaron may have meant the Clubhouse Bedroom site, which is the gym-bedroom site. LOW — Aaron may have a copy-paste error here.
- **Aaron's "Garage"** on bar-stock and church — r6calls confirms. HIGH.
- **Aaron's "Western Hallway"** on bar-stock — r6calls SVG doesn't label any "Western Hallway"; closest is "Kitchen Hallway" or "Strip Hallway". MEDIUM — possibly community callout, possibly stale.
- **Aaron's "Oil Pit"** on church — r6calls SVG has no "Oil Pit" label. The Clubhouse basement labels are: Church, Arsenal, Tunnel, Junkyard, Storage. "Oil Pit" may be informal. LOW.
- **Aaron's "Blue Stairs"** — r6calls confirms. HIGH.

### Coastline (`src/data/strats.js`)

- **Aaron's "Hall of Fame"** on theater-penthouse — r6calls Coastline SVG does NOT have a "Hall of Fame" label. The post-modernization label is **VIP** (a hall) or **Penthouse**. MEDIUM-LOW. **Recommended:** rename to "VIP".
- **Aaron's "VIP"** — confirmed in r6calls. HIGH.
- **Aaron's "Aqua"** — confirmed (Aqua + Aqua Balcony). HIGH.
- **Aaron's "Cool Vibes"** — r6calls SVG does NOT have a "Cool Vibes" label. The closest is "Pool Bar" (Cool Vibes was the pre-rework name for that area). LOW. **Recommended:** rename to "Pool Bar" post-March-2026 modernization.
- **Aaron's "Theater"** — r6calls SVG has no "Theater" label any more (post-March 2026 rework). The room is now **VIP** or similar. MEDIUM. **Recommended:** rename Aaron's site display name from "Theater / Penthouse" to "VIP / Penthouse".
- **Aaron's "Billiards"** — r6calls labels are "Pool Table", "Pool Bar", "Pool Side". "Billiards" is the pre-rework name. MEDIUM — keep for player recognition, but verify in-game post-March-2026.
- **Aaron's "Sunrise"** — confirmed (Sunrise / Sunrise Entrance / Sunrise Hallway). HIGH.

### Consulate (`src/data/strats.js`)

- Aaron's callouts: "Consul Office", "Meeting Room", "Balcony", "Yellow Stairs", "Piano", "Connector", "Admin Office", "Lobby", "Press Room", "Visa Office", "Main Entrance", "Spiral Stairs", "Front Desk", "Garage", "Cafeteria", "Basement Corridor", "Server Room", "Visa Entrance", "Tellers", "Archives".
- **"Press Room"** — r6calls Consulate SVG has NO "Press" label anywhere. Post-2023-rework Consulate has "Police", "Memorial", "Expo" instead. HIGH confidence Aaron's "Press Room" is wrong. **Recommended:** "Press Room" → "Expo" (Exposition Room) for the 1F site.
- **"Connector"** — not in r6calls SVG. Generic; LOW.
- **"Front Desk"** — r6calls labels "Long Desk", "Reception" or "Front Office". MEDIUM. **Recommended:** "Front Office" or "Reception".
- **"Yellow Stairs"** — confirmed. HIGH.
- **"Spiral Stairs"** — confirmed (Spiral Stairs + Top Spiral). HIGH.
- **"Archives"** — r6calls Consulate SVG has NO "Archives". Aaron is using a Border callout on Consulate. HIGH confidence wrong. **Recommended:** rename `tellers-archives` site to `tellers-servers` and use "Servers" callout.

### Kafe Dostoyevsky (`src/data/strats.js`)

- **"Reading Room"** — r6calls confirms ("Reading", "Reading Corridor"). HIGH.
- **"Fireplace Hall"** — r6calls labels just "Fireplace". MEDIUM — fine as colloquial.
- **"White Stairs"** — confirmed. HIGH.
- **"Red Stairs"** — confirmed (also Wood Stairs as third stairwell). HIGH.
- **"Cigar Shop"** — r6calls labels "Cigar" and "Cigar Balcony". MEDIUM.
- **"Mining Room"** — confirmed ("Mining", "Mining Corridor"). HIGH.
- **"Train Museum"** — r6calls labels "Train". MEDIUM (the long form is OK).
- **"Pillar"** — confirmed. HIGH.
- **"Bar"** — confirmed. HIGH.
- **"Cocktail Lounge"** — r6calls labels "Cocktail" + "Cocktail Entrance". HIGH.
- **"Bakery Corridor"** — confirmed. HIGH.
- **"Prep Area"** — r6calls labels just "Prep". HIGH (fine as Prep Area).
- **"Freezer"** — confirmed. HIGH.

### Oregon (`src/data/strats.js`)

- **"Kids' Dorms"** — r6calls labels "Kids" + "Dorm". HIGH.
- **"Bunk"** — r6calls has no "Bunk" label on Oregon (Bunker exists). The Oregon "Bunk" room may be Aaron's name for what r6calls labels "Dorm". MEDIUM. **Recommended:** Verify — likely OK as colloquial.
- **"Walk-in"** — confirmed ("Walk In"). HIGH.
- **"Big Tower"** — r6calls labels "Tower" + "Tower Roof" + "Tower Stairs" — also has "Small Tower" + "Small Tower Roof". HIGH on both.
- **"Freezer"** — confirmed. HIGH.
- **"Basement Stairs"** — r6calls labels "Laundry Stairs" + "Freezer Stairs"; no generic "Basement Stairs" label. MEDIUM — Aaron's term is fine colloquially.
- **"Tunnel"** — r6calls Oregon SVG has NO "Tunnel" label (the old basement tunnel was renamed in the 2020 Void Edge rework). LOW. **Recommended:** drop "Tunnel" from Oregon callouts; this is a Bank/Border callout.

### Villa (`src/data/strats.js`)

- **"Aviator"** — confirmed ("Aviator"). HIGH.
- **"Games Room"** — r6calls has "Gaming". HIGH (fine as Games Room).
- **"Astronomy"** — r6calls labels "Astro" + "Astro Stairs". HIGH (fine as long-form).
- **"Vault"** — confirmed. HIGH.
- **"Trophy"** + **"Statuary"** — r6calls has "Trophy" + "Trophy Balcony". "Statuary" doesn't appear in r6calls SVG — but in-game and Liquipedia both confirm "Statuary Room" is the official name for the room next to Trophy. Likely the SVG just labels its sub-areas. MEDIUM-HIGH.
- **"Classical"** — r6calls SVG has no "Classical" label. Aaron may mean "Gallery" or "Art" (both confirmed). LOW. **Recommended:** verify or replace.
- **"Mudroom"** — confirmed. HIGH.
- **"Library Hallway"** — r6calls has "Library" + "Living Hallway"; no specific "Library Hallway" label. LOW-MEDIUM.
- **"China Room"** — r6calls confirms "China". HIGH.
- **"Red Stairs"** — confirmed. HIGH.

### Lair (`src/data/strats.js`)

Per Section 3, Aaron's Lair sites are wrong, so most of these callouts are mismatched. Where callouts ARE valid Lair labels:

- **"Bunks"** — confirmed in r6calls SVG. HIGH.
- **"Briefing"** — confirmed (typo'd "Breifing" in SVG). HIGH.
- **"Armory"** — confirmed. HIGH.
- **"Lab"** — confirmed. HIGH.
- **"Server"** — exists as a label but is NOT a bombsite room. MEDIUM.

Aaron's invented callouts (NOT in r6calls Lair SVG, almost certainly wrong):
- "Memorial" (Consulate callout)
- "Surveillance" (not a Lair label)
- "Lounge" (not a Lair label)
- "Window" (generic)
- "Tech Room" (not a Lair label — closest is "Filtration", "Toxin", "Maintenance")
- "Workshop" (Kanal/Border callout)
- "Vault" (Bank/Villa callout)
- "Hatch" (generic — Lair uses "Roof Stairs" / specific stair names)

**Recommended:** Aaron's Lair callouts need a full rewrite from r6calls's actual Lair labels: Master, Bunks, Briefing, Armory, Mezzanine, CCTV, Lab, Server, Six (a notable callout — the giant Six sculpture room), Toxin, Missile, Filtration, Mask, Booth, Storage, Operational, Reception, Stockpile.

### Nighthaven Labs (`src/data/strats.js`)

Per Section 3, Aaron's Labs sites are wrong. Valid Labs callouts per r6calls SVG: Command, Server, Control, Storage, Cafeteria, Kitchen, Tank, Assembly, Workshop, Cargo, Lobby, Helipad, Generator, Meeting, Pantry, Park, Vending, Catwalk, Containers, Animus, Nano, Exo, IT, Observatory, Roof.

**Aaron's invented callouts that don't exist on Labs:**
- "Briefing" — not on Labs (it's a Lair callout)
- "Production" — not on Labs (closest: Workshop / Assembly)
- "Dormitory" / "Bunks" — not on Labs (Lair callouts)
- "Skybridge" — not on Labs
- "Loading Bay" — not on Labs (closest: Cargo / Helipad Delivery)
- "Tech Lab" — not on Labs (closest: Animus / Nano / Exo)
- "Utility Tunnel" — not on Labs (closest: Generator / Containers)
- "Roof Access" — not standard; Labs has "Roof"

**Recommended:** Full callout rewrite for Labs. Use the authoritative r6calls list above.

### Skyscraper (`src/data/strats.js`)

- **"Tea Room"** + **"Karaoke"** + **"Geisha"** + **"Dragon"** — all confirmed in r6calls Skyscraper SVG. HIGH.
- **"Exhibition"** — confirmed. HIGH.
- **"Closet"** — confirmed (also "Coat", "Dressing"). HIGH (though Aaron has it on the wrong floor, see Section 3).
- **"Pantry"** — confirmed. HIGH.
- **"BBQ"** — confirmed. HIGH.
- **"Ventilation"** — confirmed. HIGH.
- **"Back Alley"** — r6calls has no "Back Alley" label on Skyscraper (it has "East Garden", "West Garden", "Side Path"). LOW. **Recommended:** "Side Path" or "East Garden".

### Theme Park (`src/data/strats.js`)

- **"Throne Room"** + **"Armory"** + **"Connector"** — Throne and Armory confirmed; Connector is generic but appears as "Cafe Corridor" / "Cash Corridor" / "Lab Corridor". MEDIUM.
- **"Dragon Stairs"** — confirmed. HIGH.
- **"Haunted Balcony"** — r6calls labels are "Cafe", "Arcade", "Castle"; no "Haunted Balcony". MEDIUM-LOW. **Recommended:** "Castle" or "Cafe".
- **"Yellow Corridor"** — confirmed (Yellow Balcony, Yellow Hatch, Yellow Stairs all exist). HIGH.
- **"Drug Lab"** — r6calls labels just "Drug". HIGH (Drug Lab is fine).
- **"Maintenance"** — confirmed. HIGH.
- **"Initiation"** — confirmed. HIGH.
- **"Cafe"** + **"Gargoyle"** — Cafe confirmed; "Gargoyle" not in r6calls labels. MEDIUM-LOW.
- **"Day Care"** — confirmed. HIGH.
- **"Arcade"** — confirmed. HIGH.

---

## Section 5: Modernization timeline

Use this table to prioritize which maps need premium-tactics re-verification. Strats older than the modernization date are stale.

| Map | Modernization (most recent) | Source | In ranked? |
|---|---|---|---|
| Bank | June 2025 (Siege X) | Ubisoft + Liquipedia (Siege X launch) | YES |
| Border | June 2025 (Siege X) | Ubisoft | YES |
| Chalet | June 2025 (Siege X) | Ubisoft | YES |
| Clubhouse | June 2025 (Siege X) | Ubisoft | YES |
| Kafe Dostoyevsky | June 2025 (Siege X) | Ubisoft | YES |
| Coastline | March 2026 (Operation Silent Hunt — Y11S1) | Ubisoft | YES |
| Oregon | March 2026 (Operation Silent Hunt — Y11S1) | Ubisoft | YES |
| Villa | March 2026 (Operation Silent Hunt — Y11S1) | Ubisoft | YES |
| Consulate | September 2025 (Operation High Stakes; original rework May 2023 in Operation Dread Factor) | Ubisoft + Liquipedia | YES |
| Lair | September 2025 (modernized); released Nov 2023 | Ubisoft | YES |
| Nighthaven Labs | September 2025 (modernized); released Dec 2022 | Ubisoft | YES |
| Skyscraper | December 2025 | Ubisoft | YES |
| Theme Park | December 2025 | Ubisoft | YES |
| Fortress | December 2025 (Operation Tenfold Pursuit — full rework + ranked) | Ubisoft + Liquipedia | YES (newly) |
| Outback | November 2021 (Operation High Calibre) | Ubisoft | YES |
| Kanal | September 2019 | Ubisoft | YES |
| Emerald Plains | April 2022 (released; never modernized) | Ubisoft | NO (unranked-only per Ubisoft) |
| Stadium Bravo | June 2024 | Ubisoft | NO |
| Hereford Base | September 2018 | Ubisoft | NO |
| House | June 2020 | Ubisoft | NO |
| Favela | June 2021 | Ubisoft | NO |
| Plane / Presidential Plane | None (released Dec 2015) | Ubisoft | NO |
| Tower | None (released Nov 2017) | Ubisoft | NO |
| Yacht | None (released Feb 2016) | Ubisoft | NO |
| Bartlett University | REMOVED FROM GAME | Liquipedia + Ubisoft maps grid | N/A — DELETE |

**Priority order for Aaron's premium-tactics re-verification (most recently modernized first):**

1. **Coastline, Oregon, Villa** (March 2026 — 2 months old)
2. **Fortress, Skyscraper, Theme Park** (December 2025)
3. **Consulate, Lair, Nighthaven Labs** (September 2025)
4. **Bank, Border, Chalet, Clubhouse, Kafe** (June 2025 — Siege X foundation modernization)
5. **Outback, Kanal, Emerald Plains** (older — but Aaron's Kanal/Outback/Emerald data is wrong regardless of age, see Section 3)

---

## Section 6: What I couldn't extract

**JS-rendered data I had to skip:**
- **r6calls.com per-floor "Explore view" with bombsite icon overlays.** The floor-icon coordinates are not in the bundled JS or the data JSONs — they're embedded in the per-map SVG as graphical elements (paths/circles), not as text spans. I extracted text spans only. So while I have authoritative ROOM NAME LISTS per map (Section 4), I could not programmatically verify which exact bombsite letter (1A vs 1B vs 2A etc.) sits in which room. For the 12 priority maps Aaron has strats for, I cross-referenced bombsite layouts via Liquipedia and that worked; for non-priority maps the SVG-only approach left bombsite letter assignment unverified.

**403 errors:**
- **Fandom wiki (`rainbowsix.fandom.com`)** returned 403 Forbidden via WebFetch — couldn't pull Lair's or Emerald Plains' Fandom pages as a third source. Not a blocker since Liquipedia + r6calls SVGs covered the same ground.

**Coastline modernization detail gap:**
- Coastline Modernized in March 2026 per Ubisoft, but the room renames are not yet documented on Liquipedia. I caught the obvious ones via the r6calls SVG ("Theater" and "Cool Vibes" gone, "VIP" / "Pool Bar" present) but Aaron should verify in-game whether these renames are stable.

**Kanal bombsite confirmation:**
- I couldn't get Liquipedia or siege.gg to cleanly confirm Kanal's current 4 bomb pairs. The recommended Kanal fixes in Section 3 are MEDIUM confidence. Aaron should drop into a custom match on Kanal and verify before strats.js gets premium tactics added.

**Theme Park detailed bombsite confirmation:**
- Liquipedia returned a non-actionable response for Theme Park bombsites. The room names match Aaron's IDs (Throne / Armory / Lab / Storage / Office / Initiation / Bunk / Day Care all present in r6calls SVG), but the EXACT pairing of which 4 sites are the live competitive bombs is MEDIUM confidence — confirm in-game.

**Confidence summary:**
- Maps where Aaron's data is FULLY CORRECT (HIGH confidence): Bank, Border, Chalet, Clubhouse, Villa.
- Maps where Aaron has small callout fixes (MEDIUM-HIGH): Coastline (post-March-2026 renames), Theme Park.
- Maps where Aaron has FLOOR / SITE-NAME issues (HIGH confidence on the fix): Kafe (3F→2F swap), Skyscraper (floor swaps), Oregon (drop tower).
- Maps where Aaron has MAJOR layout drift (HIGH confidence Aaron's data is broken): Consulate, Lair, Nighthaven Labs, Outback, Emerald Plains, Fortress, Kanal — these need site IDs and callouts rewritten, not patched.

---

## Appendix: All data sources cited

- Ubisoft Maps Index: `https://www.ubisoft.com/en-us/game/rainbow-six/siege/game-info/maps`
- Ubisoft per-map pages (used for modernization dates + playlists): `https://www.ubisoft.com/en-us/game/rainbow-six/siege/game-info/maps/<slug>`
- r6calls authoritative room data: `https://r6calls.com/data/mainData.json` (ranked pool); `https://r6calls.com/img/maps/<slug>.svg` (text-span room labels)
- Liquipedia Rainbow Six Wiki (per-map pages): `https://liquipedia.net/rainbowsix/<map>`
- siege.gg Year 11 Season 1 mid-season ranked update: `https://siege.gg/news/rainbow-six-siege-ranked-map-pool-update-kanal-outback-skyscraper-and-theme-park-added`
- siege.gg Operation Tenfold Pursuit competitive map pool: `https://siege.gg/news/rainbow-six-siege-x-competitive-map-pool`
- alviran.net Year 11 ranked guide: `https://alviran.net/blog/r6-ranked-map-pool-2026/`
- Hotspawn Siege X 2026 competitive pool: `https://www.hotspawn.com/rainbow-six/guide/rainbow-six-siege-x-competitive-map-pool`
- Bartlett retirement context: Liquipedia Bartlett University article + Ubisoft maps grid (absence)

---

# CORRECTIONS APPLIED (2026-04-29)

Mechanical fixes from this audit are now LIVE on r6coaching.com via the deploy at I5L8WKNMQR1V85U82PHYQYDUYR. Summary:

## maps.js changes

- **Bartlett University** — DELETED (map removed from R6 Siege)
- **Fortress** → `rankedPool: true` (kept `comingSoon: true` until strats rewrite)
- **Outback** → `rankedPool: true` + comingSoon. Site IDs replaced with current pairs (laundry-piano, party-office, bedrooms, mechanic-kitchen)
- **Kanal** → `rankedPool: true` + comingSoon
- **Emerald Plains** → `rankedPool: false` + comingSoon. Site IDs replaced with current pairs (admin-ceo, gallery-meeting, bar-lounge, kitchen-dining)
- **Lair** → comingSoon. Site IDs replaced (master-r6, bunks-briefing, armory-weapon, lab-support)
- **Nighthaven Labs** → comingSoon. Site IDs replaced (command-server, control-storage, kitchen-cafeteria, tank-assembly)
- **Consulate** → comingSoon. Site IDs updated (lobby-press → piano-expo, tellers-archives → tellers-servers)
- **Kafe** → floor labels swapped (bar-cocktail 1F → 3F, reading-fireplace 3F → 2F)
- **Skyscraper** → floor labels swapped + name fixed (bedroom 2F → 1F + "Bathroom" not "Closet"; work-office 1F → 2F)
- **Oregon** → comingSoon, removed bogus `tower` site (not a real bombsite), added `kitchen-dining` site

## strats.js changes

Removed orphaned strat blocks for maps where Aaron's old data referenced rooms that no longer exist:
- **consulate** block deleted (Press Room / Archives don't exist post-2023 rework)
- **lair** block deleted (Memorial / Surveillance / Workshop / Vault are not Lair callouts)
- **nighthaven** block deleted (Briefing / Dormitory / Bunks don't exist)
- **emerald-plains** block deleted (lounge-bedroom etc. don't match current map; was orphaned by maps.js cleanup)

10 maps still have strats live: bank, oregon, clubhouse, coastline, kafe, chalet, border, skyscraper, theme-park, villa.

## What's still on Aaron

For these 8 maps now showing as `comingSoon` because their old strat data was wrong:
- **Consulate** — Aaron knows this map; rewrite via `/fill-strat consulate <site> <side>` for each of the 4 sites × 2 sides (8 strats)
- **Lair** — same pattern, 4 sites × 2 sides
- **Nighthaven Labs** — same
- **Outback, Kanal, Emerald Plains, Fortress** — same
- **Oregon** — has `kids-dorms`, `meeting-hall`, `laundry` as old strats but the site list changed. Verify the existing strats still match current floor layout post-Silent-Hunt March 2026 rework, and add fresh strat for new `kitchen-dining` site.

## Build state

- 24 maps total in maps.js (was 25; Bartlett removed)
- 16 maps in ranked pool
- 15 maps marked `comingSoon` (because content is missing or stale)
- 10 maps with live strat data (bank/oregon/clubhouse/coastline/kafe/chalet/border/skyscraper/theme-park/villa)
- Build clean, deployed, CloudFront invalidating
