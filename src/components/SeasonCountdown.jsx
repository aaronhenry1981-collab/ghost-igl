import { useEffect, useState } from 'react'
import { SEASON_LABEL, NEXT_SEASON_LABEL, CONFIRMED, seasonTimeRemaining } from '../config/season'
import './SeasonCountdown.css'

// Live countdown to the end of the current R6 ranked season.
//
// Two sizes:
//   - 'pill'   : compact inline badge ("Y11S2 ends in 38d 6h")
//   - 'banner' : fuller strip with the season name and an honest "expected"
//                hedge until Ubisoft confirms the date (CONFIRMED flag).
//
// Same discipline as FoundingCountdown: auto-hides once the date passes so a
// stale timer can never sit on the page, and the tick rate steps up only when
// the clock is nearly out.

function fmtN(n) { return String(n).padStart(2, '0') }

export default function SeasonCountdown({ variant = 'pill', className = '' }) {
  const [now, setNow] = useState(() => Date.now())
  const remaining = seasonTimeRemaining(now)

  useEffect(() => {
    if (remaining.expired) return
    const intervalMs = remaining.totalMs < 3_600_000 ? 1000 : 60_000
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [remaining.expired, remaining.totalMs])

  if (remaining.expired) return null

  const hedge = CONFIRMED ? '' : ' (expected)'

  if (variant === 'banner') {
    return (
      <div className={`season-countdown season-banner ${className}`.trim()}>
        <span className="season-name">{SEASON_LABEL}</span>
        <span className="season-time">
          ends in <b>{remaining.days}d {fmtN(remaining.hours)}h {fmtN(remaining.minutes)}m</b>{hedge}
        </span>
        <span className="season-next">{NEXT_SEASON_LABEL} incoming — lock your rank</span>
      </div>
    )
  }

  return (
    <span className={`season-countdown season-pill ${className}`.trim()}>
      Season ends in <b>{remaining.days}d {fmtN(remaining.hours)}h</b>{hedge}
    </span>
  )
}
