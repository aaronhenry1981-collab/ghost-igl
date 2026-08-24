// R6 season schedule — drives the SeasonCountdown badge.
//
// SEASON_END is the expected launch of the NEXT season (= when the current
// ranked season ends). Ubisoft rarely announces this far ahead, so the date
// carries a confidence label that the UI surfaces honestly: "expected" until
// Ubisoft confirms, then flip CONFIRMED to true and drop the hedge.
//
// Maintenance: update these three lines each season (or when Ubi announces).
// If the date passes with no update, the countdown auto-hides — we never show
// a negative timer or a stale promise.

export const SEASON_LABEL = 'Y11S2 · Operation System Override'
export const NEXT_SEASON_LABEL = 'Y11S3'
// Verified 2026-08-02: Ubisoft's official Siege page lists the Operation
// System Override Battle Pass as running June 2 through September 1. The
// exact daily reset hour is still based on the normal update window.
export const SEASON_END = new Date('2026-09-01T13:00:00Z')
export const CONFIRMED = true

export function seasonTimeRemaining(now = Date.now()) {
  const totalMs = SEASON_END.getTime() - now
  if (totalMs <= 0) return { expired: true, totalMs: 0, days: 0, hours: 0, minutes: 0 }
  const days = Math.floor(totalMs / 86_400_000)
  const hours = Math.floor((totalMs % 86_400_000) / 3_600_000)
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000)
  return { expired: false, totalMs, days, hours, minutes }
}
