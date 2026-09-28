// R6 season facts for the SeasonCountdown badge (Strats and Meta pages) and
// the static /countdown/ page (scripts/generate-countdown.mjs imports this
// file), so the two can never disagree. Official Ubisoft sources only:
// never guess a date.
//
// Keep these in step with CURRENT_R6_SEASON in src/data/r6-season.js. Once
// the Y11S3.1 content update (aaronhenry1981-collab/ghost-igl#27) lands, the
// season name and patch can be read from there instead.
//
// Maintenance:
//   - When Ubisoft announces the next season's launch date and time, set
//     NEXT_SEASON.launchAt. The badge and /countdown/ then count down to it.
//   - When that season goes live, move it into LIVE_SEASON (with its official
//     Battle Pass window) and set NEXT_SEASON.launchAt back to null.
// Safety net: once NEXT_SEASON.launchAt has passed, or LIVE_SEASON's
// official Battle Pass window has ended, the badge hides and /countdown/
// tells players to check Ubisoft, so a stale season never sits on the page.

// Verified 2026-09-25 against Ubisoft's official pages:
//   - Battle Pass page: "Operation Split Fire Battle Pass, from September 1
//     to December 1".
//   - Season page: Operation Split Fire, Y11S3.
//   - Y11S3.1 patch notes, dated September 22, 2026.
//   - News page: no Y11S4 announcement.
export const LIVE_SEASON = Object.freeze({
  code: 'Y11S3',
  name: 'Operation Split Fire',
  startedOnLabel: 'September 1, 2026',
  battlePassEndsOn: '2026-12-01',
  battlePassEndsOnLabel: 'December 1, 2026',
  battlePassWindowLabel: 'September 1 – December 1, 2026',
  latestPatch: 'Y11S3.1',
  latestPatchOnLabel: 'September 22, 2026',
  verifiedOn: '2026-09-25',
  verifiedOnLabel: 'September 25, 2026',
  seasonUrl: 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/seasons/splitfire',
  battlePassUrl: 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/shop/battlepass',
  latestPatchUrl: 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/3WMly2DNZqv1GpUK9GNGm5/y11s31-patch-notes',
  newsUrl: 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates',
  // Summarized from the official season page; shown on /countdown/.
  highlights: Object.freeze([
    { title: 'Noor', text: 'a new Defender built to counter shield operators; his Horus Lance Launcher fires projectiles that pierce shields and destructible surfaces before erupting into flames.' },
    { title: 'Legend Division', text: 'a SoloQ-only Ranked playlist for eligible top players, which Ubisoft says opens mid-season.' },
    { title: 'Villa targeted map update', text: 'the basement and garage were redesigned, and the Living Room / Library bomb site moved downstairs.' },
    { title: 'Balance changes', text: 'to operators and weapons at launch, followed by the Y11S3.1 patch on September 22, 2026.' },
  ]),
})

export const NEXT_SEASON = Object.freeze({
  code: 'Y11S4',
  // ISO timestamp from an official Ubisoft announcement, or null while the
  // date is not announced (the case on 2026-09-25).
  launchAt: null,
})

export const SEASON_LABEL = `${LIVE_SEASON.code} · ${LIVE_SEASON.name}`
export const NEXT_SEASON_LABEL = NEXT_SEASON.code

// The "live" claim stops at the start (UTC) of the Battle Pass end date, so
// it can't outlive the season whatever time the switchover happens that day.
export function liveClaimEndsAt(live = LIVE_SEASON) {
  return Date.parse(`${live.battlePassEndsOn}T00:00:00Z`)
}

// 'countdown' when Ubisoft has announced the next launch and it is still
// ahead; 'live' when no date is announced and the live season's window is
// still open; 'hidden' otherwise.
export function seasonStatus(now = Date.now(), live = LIVE_SEASON, next = NEXT_SEASON) {
  if (next.launchAt) {
    const totalMs = Date.parse(next.launchAt) - now
    if (!(totalMs > 0)) return { state: 'hidden', totalMs: 0 }
    return {
      state: 'countdown',
      totalMs,
      days: Math.floor(totalMs / 86_400_000),
      hours: Math.floor((totalMs % 86_400_000) / 3_600_000),
      minutes: Math.floor((totalMs % 3_600_000) / 60_000),
    }
  }
  const claimEndsAt = liveClaimEndsAt(live)
  if (!(now < claimEndsAt)) return { state: 'hidden', totalMs: 0 }
  return { state: 'live', totalMs: claimEndsAt - now }
}
