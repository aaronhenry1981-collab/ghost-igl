// One reviewed snapshot for every public surface that needs to describe the
// live Rainbow Six season or ranked rotation. Do not infer patch-level state
// from the calendar: Ubisoft can rotate maps in a mid-season update.
//
// Y11S3.1 review (2026-09-25): the season, patch and balance facts below were
// checked word for word against Ubisoft's official Y11S3.1 patch notes. Those
// notes announce no change to the Ranked map pool, Villa's layout, Legend
// Division or the rank structure, so those fields are carried over exactly as
// they were and are NOT re-verified by this review.

export const Y11S31_PATCH_NOTES_URL = 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/3WMly2DNZqv1GpUK9GNGm5/y11s31-patch-notes'

// Y11S3.1 refinement changes, exactly as published (September 22, 2026).
// `operators` lists who carries the changed gadget or weapon, as Ubisoft
// lists them. Consumers render `summary`; tests pin `before` / `after`.
export const Y11S31_BALANCE_CHANGES = Object.freeze([
  Object.freeze({ id: 'buck-skeleton-key-ammo', kind: 'gadget', operators: Object.freeze(['Buck']), item: 'Skeleton Key', stat: 'total ammo', before: '31', after: '36', summary: 'Skeleton Key total ammo increased to 36 (was 31).' }),
  Object.freeze({ id: 'castle-armor-panel-melee', kind: 'gadget', operators: Object.freeze(['Castle']), item: 'Armor Panel', stat: 'melee hits to destroy', before: '9', after: '10', summary: 'An Armor Panel now takes 10 melee hits to destroy (was 9).' }),
  Object.freeze({ id: 'fenrir-dread-mine-gas', kind: 'gadget', operators: Object.freeze(['Fenrir']), item: 'F-NATT Dread Mine', stat: 'time for gas to reach maximum range', before: '2 seconds', after: '1.9 seconds', summary: 'F-NATT Dread Mine gas now reaches maximum range in 1.9 seconds (was 2 seconds).' }),
  Object.freeze({ id: 'maestro-evil-eye-battery', kind: 'gadget', operators: Object.freeze(['Maestro']), item: 'Evil Eye', stat: 'battery life', before: '8 seconds', after: '9 seconds', summary: 'Evil Eye battery life increased to 9 seconds (was 8 seconds).' }),
  Object.freeze({ id: 'thermite-exothermic-damage', kind: 'gadget', operators: Object.freeze(['Thermite']), item: 'Exothermic Charge', stat: 'damage', before: '200 HP', after: '220 HP', summary: 'Exothermic Charge damage increased to 220 HP (was 200 HP).' }),
  Object.freeze({ id: 'sledge-hammer-swing', kind: 'gadget', operators: Object.freeze(['Sledge']), item: 'Breaching Hammer', stat: 'swing time', before: '1 second', after: '0.8 seconds', summary: 'Breaching Hammer swing time reduced to 0.8 seconds (was 1 second).' }),
  Object.freeze({ id: 'm1014-damage', kind: 'weapon', operators: Object.freeze(['Ace', 'Castle', 'Pulse', 'Thermite']), item: 'M1014', stat: 'damage', before: '28 HP', after: '30 HP', summary: 'M1014 damage increased to 30 (was 28).' }),
  Object.freeze({ id: 'spas15-damage', kind: 'weapon', operators: Object.freeze(['Caveira', 'Thunderbird']), item: 'SPAS-15', stat: 'damage', before: '24 HP', after: '26 HP', summary: 'SPAS-15 damage increased to 26 (was 24).' }),
])

// Noor / Horus Lance behaviour after the Y11S3.1 bug fixes, stated as it
// works now. Each line corresponds to a "Fixed -" entry in the official notes.
// These describe corrected bugs; none of them is a tactic.
export const Y11S31_NOOR_FIXES = Object.freeze([
  "Montagne's Le Roc Shield no longer auto-retracts just because a Horus Lance hits it.",
  'Operators can no longer remove a Horus Lance while holding a secondary gadget.',
  'Shield Operators can throw devices while affected by a Horus Lance.',
  'Pressing an embedded Horus Lance against a wall no longer prevents its damage.',
  'Players can no longer swap to a secondary gadget while affected by a Horus Lance.',
  "Horus Lance flames on Blackbeard's H.U.L.L Adaptable Shield no longer go the wrong way while he rappels.",
  "Ying's Candela now deploys when hit with Horus Lance flames.",
  "Montagne's Le Roc Shield can be retracted while crouching and removing a Horus Lance.",
  'Cancelling the animation no longer removes a Horus Lance immediately from a shield carried on the back.',
  'Horus Lance flames deployed on top of a door frame now damage opponents.',
  'Operators no longer continue moving when hit by a Horus Lance.',
  "The flame effect now plays when the top of an opponent's shield is hit by a Horus Lance while in the prone position.",
])

export const CURRENT_R6_SEASON = Object.freeze({
  code: 'Y11S3.1',
  season: 'Y11S3',
  name: 'Operation Split Fire',
  label: 'Y11S3.1 Operation Split Fire',
  patchDate: '2026-09-22',
  patchDateLabel: 'September 22, 2026',
  verifiedOn: '2026-09-25',
  // The rank ladder, Ranked map pool and map index below were last verified
  // on 2026-08-23 and are carried over unchanged (no official change in the
  // Y11S3.1 notes). Keep that date wherever those facts are displayed.
  rankedVerifiedOn: '2026-08-23',
  reviewDue: '2026-10-20',
  sourceUrl: Y11S31_PATCH_NOTES_URL,
  patchNotesUrl: Y11S31_PATCH_NOTES_URL,
  seasonUrl: 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/seasons/splitfire',
  mapIndexUrl: 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/game-info/maps',
  officialMapIndexCount: 27,
  strategyCoverageExclusions: Object.freeze([
    Object.freeze({ id: 'close-quarter', reason: 'Dedicated Team Deathmatch map with no Bomb sites.' }),
    Object.freeze({ id: 'stadium-alpha', reason: 'Bomb-site coaching held until the current layout and sites are verified.' }),
  ]),
  rankedMapIds: Object.freeze([
    'bank',
    'border',
    'calypso-casino',
    'chalet',
    'clubhouse',
    'consulate',
    'fortress',
    'kafe',
    'kanal',
    'lair',
    'nighthaven',
    'oregon',
    'theme-park',
    'villa',
  ]),
  balanceChanges: Y11S31_BALANCE_CHANGES,
  noorFixes: Y11S31_NOOR_FIXES,
})

// Every Y11S3.1 change that touches an operator's own gadget or weapon.
export function balanceChangesFor(operatorName) {
  return Y11S31_BALANCE_CHANGES.filter((change) => change.operators.includes(operatorName))
}

// No next season has been reviewed yet. Surfaces must not show a countdown or
// "upcoming" facts while this is null.
export const UPCOMING_R6_SEASON = null

// Historical: what Ubisoft announced before Operation Split Fire launched on
// September 1, 2026 (Y11S3 Designer's Notes). Kept for reference only. These
// are announced values, not re-verified live numbers; nothing current should
// be driven from this object.
export const SPLIT_FIRE_LAUNCH_ANNOUNCEMENT = Object.freeze({
  code: 'Y11S3',
  name: 'Operation Split Fire',
  status: 'launched',
  launchesOn: '2026-09-01',
  launchesAt: '2026-09-01T13:00:00Z',
  launchDateLabel: 'September 1, 2026',
  launchDateShort: 'September 1',
  confirmed: true,
  notesPublishedOn: '2026-08-17',
  seasonUrl: 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/seasons/splitfire',
  designerNotesUrl: 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/PONCuRt8LaCr3O31NkBQb/y11s3-designers-notes',
  highlights: Object.freeze([
    Object.freeze({
      title: 'Noor + Horus Lance',
      summary: 'A new Defender built to disrupt shield-led pushes and deny space. Treat his five-projectile loadout and interactions as pre-release until launch validation.',
    }),
    Object.freeze({
      title: 'Legend Division',
      summary: 'A SoloQ-only playlist announced for eligible high-skill players. Ubisoft says it opens mid-season, so it is not a ninth live Ranked 3.0 tier today.',
    }),
    Object.freeze({
      title: 'Villa targeted update',
      summary: 'Villa’s basement and garage are changing, including moving the Living Room / Library bomb site downstairs. Current Villa briefs expire at launch.',
    }),
    Object.freeze({
      title: '3v3 arcade mode',
      summary: 'A limited-time, faster 3v3 version of Bomb is announced with all Attackers and Defenders available.',
    }),
  ]),
  balanceChanges: Object.freeze([
    Object.freeze({
      title: 'Dokkaebi',
      summary: 'Jegeo uploads require a constant connection; interruption cancels the upload and the tablet remains active. Impact EMPs are replaced by Breach Charges.',
    }),
    Object.freeze({
      title: 'Kali / CSRX 300',
      summary: 'V-Lance swaps keep ADS. Scopes move to 3.5x / 8x, pump time to 0.8s, and ammo to 51, with higher recoil and hip-fire spread.',
    }),
    Object.freeze({
      title: 'SMG-12 + defender DMRs',
      summary: 'SMG-12 moves to 16 damage, 22-round magazine, and 111 max ammo. AR-15.50 moves to 59 damage and MK14 EBR to 56, with first-shot recoil increases.',
    }),
    Object.freeze({
      title: 'Refinements',
      summary: 'Lion warning 1.4s; Kapkan damage 62; Echo refill 15s; SPSMG9 damage 35; Claymore damage 155. These values are announced, not yet live.',
    }),
  ]),
})

export default CURRENT_R6_SEASON
