// One reviewed snapshot for every public surface that needs to describe the
// live Rainbow Six season or ranked rotation. Do not infer patch-level state
// from the calendar: Ubisoft can rotate maps in a mid-season update.

export const CURRENT_R6_SEASON = Object.freeze({
  code: 'Y11S2.2',
  name: 'Operation System Override — Mid-Season',
  label: 'Y11S2.2 System Override',
  verifiedOn: '2026-08-23',
  reviewDue: '2026-09-01',
  sourceUrl: 'https://www.ubisoft.com/en-us/news/ignt.61899/operation-system-override-mid-season-update-everything-you-need-to-know',
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
})

// Pre-release information lives beside, never inside, the live snapshot.
// Nothing in this object should drive current loadouts, strategies, or Ranked
// eligibility until Ubisoft ships the season and the live data is re-reviewed.
export const UPCOMING_R6_SEASON = Object.freeze({
  code: 'Y11S3',
  name: 'Operation Split Fire',
  status: 'announced-not-live',
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
