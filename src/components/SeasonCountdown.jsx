import { useEffect, useState } from 'react'
import { SEASON_LABEL, NEXT_SEASON_LABEL, seasonStatus } from '../config/season'
import './SeasonCountdown.css'

// R6 season badge, driven by seasonStatus() in src/config/season.js:
//   - 'countdown': Ubisoft has announced the next season's launch, so count
//     down to it ("Y11S3 · Operation Split Fire ends in 38d 6h").
//   - 'live': no official next-season date yet, so say the live season is
//     live and the next date is not announced. Never a guessed timer.
//   - 'hidden': the announced time or the live season's Battle Pass window
//     has passed without a config update, so render nothing rather than a
//     stale claim.
//
// Two sizes:
//   - 'pill'   : compact inline badge
//   - 'banner' : fuller strip with the season name and what comes next

function fmtN(n) { return String(n).padStart(2, '0') }

export default function SeasonCountdown({ variant = 'pill', className = '' }) {
  const [now, setNow] = useState(() => Date.now())
  const status = seasonStatus(now)
  const { state, totalMs } = status

  useEffect(() => {
    if (state === 'hidden') return
    const intervalMs = state === 'countdown' && totalMs < 3_600_000 ? 1000 : 60_000
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [state, totalMs])

  if (state === 'hidden') return null

  if (state === 'live') {
    if (variant === 'banner') {
      return (
        <div className={`season-countdown season-banner season-live ${className}`.trim()}>
          <span className="season-name">{SEASON_LABEL}</span>
          <span className="season-time"><b>Live now</b></span>
          <span className="season-next">{NEXT_SEASON_LABEL} date not announced yet</span>
        </div>
      )
    }
    return (
      <span className={`season-countdown season-pill season-live ${className}`.trim()}>
        <span>{SEASON_LABEL} <b>live</b></span>
        <span className="season-pill-note">{NEXT_SEASON_LABEL} date not announced</span>
      </span>
    )
  }

  if (variant === 'banner') {
    return (
      <div className={`season-countdown season-banner ${className}`.trim()}>
        <span className="season-name">{SEASON_LABEL}</span>
        <span className="season-time">
          ends in <b>{status.days}d {fmtN(status.hours)}h {fmtN(status.minutes)}m</b>
        </span>
        <span className="season-next">{NEXT_SEASON_LABEL} follows the season reset</span>
      </div>
    )
  }

  return (
    <span className={`season-countdown season-pill ${className}`.trim()}>
      {SEASON_LABEL} ends in <b>{status.days}d {fmtN(status.hours)}h</b>
    </span>
  )
}
