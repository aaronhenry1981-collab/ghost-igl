import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LIVE_SEASON } from '../src/config/season.js'
import { renderCountdownPage } from './generate-countdown.mjs'

const at = (iso) => Date.parse(iso)
const notAnnounced = { code: 'Y11S4', launchAt: null }

test('while Split Fire is live and Y11S4 is unannounced: no timer, no stale copy', () => {
  const html = renderCountdownPage({ next: notAnnounced, now: at('2026-09-25T12:00:00Z') })
  assert.match(html, /<link rel="canonical" href="https:\/\/r6coaching\.com\/countdown\/" \/>/)
  assert.match(html, /<title>Rainbow Six Siege Next Season — Y11S4 Release Date Not Announced Yet<\/title>/)
  assert.match(html, /Operation Split Fire is live/)
  assert.match(html, /Ubisoft has not announced the Y11S4 release date yet/)
  assert.match(html, /September 1 – December 1, 2026/)
  assert.match(html, /Y11S3\.1<\/a>, September 22, 2026/)
  assert.doesNotMatch(html, /id="timer"/)
  assert.doesNotMatch(html, /any day now|Y11S2|System Override|Fireworks/)
  // The page switches itself to a "check Ubisoft" notice once the season's
  // Battle Pass window is over, even if nobody rebuilds it.
  assert.match(html, new RegExp(`Date\\.now\\(\\) < ${at('2026-12-01T00:00:00Z')}`))
})

test('once Ubisoft announces a date, the page counts down to it', () => {
  const next = { code: 'Y11S4', launchAt: '2026-12-01T14:00:00Z' }
  const html = renderCountdownPage({ next, now: at('2026-11-20T00:00:00Z') })
  assert.match(html, /<title>Rainbow Six Siege Next Season Countdown — Y11S4 Release Date<\/title>/)
  assert.match(html, /data-target="2026-12-01T14:00:00Z"/)
  assert.match(html, /Ubisoft has announced <strong>Y11S4<\/strong> for December 1, 2026/)
  assert.doesNotMatch(html, /any day now/)
})

test('built after the season window with no update: never claims a live season', () => {
  const html = renderCountdownPage({ live: LIVE_SEASON, next: notAnnounced, now: at('2026-12-05T00:00:00Z') })
  assert.match(html, /Check Ubisoft for the current season/)
  assert.doesNotMatch(html, /is live<\/h1>/)
  assert.doesNotMatch(html, /id="timer"/)
})
