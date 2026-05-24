import { useEffect, useState } from 'react'
import { foundingTimeRemaining, isFoundingOpen, FOUNDING_END_SHORT } from '../config/founding'
import './FoundingCountdown.css'

// Live countdown badge for the founding-rate deadline.
//
// Three sizes:
//   - 'pill'    : compact inline badge ("9D 14H · May 31")
//   - 'banner'  : full call-to-action banner with days/hours/minutes
//   - 'inline'  : single-line phrase used inside body copy
//
// Auto-hides after the deadline passes — so we never leave a stale promise
// rendered. Re-ticks every 60s (or every 1s if under 1 hour remains) so the
// urgency feels real instead of static.

function fmtN(n) { return String(n).padStart(2, '0') }

export default function FoundingCountdown({
  variant = 'pill',
  className = '',
  showSuffix = true,
  intensity = 'auto',  // 'auto' | 'muted' | 'urgent'
}) {
  const [now, setNow] = useState(() => Date.now())
  const remaining = foundingTimeRemaining(now)

  useEffect(() => {
    if (remaining.expired) return
    // Tick every second under 1h, every minute otherwise. Either way the
    // banner stays "alive" without expensive updates.
    const intervalMs = remaining.totalMs < 3_600_000 ? 1000 : 60_000
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [remaining.expired, remaining.totalMs])

  if (remaining.expired || !isFoundingOpen(now)) return null

  // Auto intensity: subtle in the first half of the window, urgent in the last
  // ~3 days, max-urgent in the last day.
  let mode = intensity
  if (mode === 'auto') {
    if (remaining.days <= 1) mode = 'urgent'
    else if (remaining.days <= 7) mode = 'warn'
    else mode = 'muted'
  }

  if (variant === 'inline') {
    return (
      <span className={`founding-inline founding-${mode} ${className}`.trim()}>
        Founding rate ends in{' '}
        <strong>
          {remaining.days > 0 ? `${remaining.days}d ` : ''}
          {fmtN(remaining.hours)}h {fmtN(remaining.minutes)}m
        </strong>
        {showSuffix && ` · ${FOUNDING_END_SHORT}`}
      </span>
    )
  }

  if (variant === 'banner') {
    return (
      <div className={`founding-banner founding-${mode} ${className}`.trim()}>
        <div className="founding-banner-label">Founding rate ends</div>
        <div className="founding-banner-clock" aria-label={`${remaining.days} days ${remaining.hours} hours ${remaining.minutes} minutes left`}>
          <span className="founding-clock-cell">
            <strong>{remaining.days}</strong><span className="founding-clock-unit">d</span>
          </span>
          <span className="founding-clock-sep">·</span>
          <span className="founding-clock-cell">
            <strong>{fmtN(remaining.hours)}</strong><span className="founding-clock-unit">h</span>
          </span>
          <span className="founding-clock-sep">·</span>
          <span className="founding-clock-cell">
            <strong>{fmtN(remaining.minutes)}</strong><span className="founding-clock-unit">m</span>
          </span>
          {remaining.totalMs < 86_400_000 && (
            <>
              <span className="founding-clock-sep">·</span>
              <span className="founding-clock-cell">
                <strong>{fmtN(remaining.seconds)}</strong><span className="founding-clock-unit">s</span>
              </span>
            </>
          )}
        </div>
        <div className="founding-banner-sub">
          Subscribe before {FOUNDING_END_SHORT} and you keep founding pricing for life.
        </div>
      </div>
    )
  }

  // Default: pill
  return (
    <span className={`founding-pill founding-${mode} ${className}`.trim()}>
      <span className="founding-pill-dot" aria-hidden="true" />
      <span className="founding-pill-text">
        {remaining.days > 0 ? `${remaining.days}D ${fmtN(remaining.hours)}H` : `${fmtN(remaining.hours)}H ${fmtN(remaining.minutes)}M`}
        {showSuffix && ` · Founding ends ${FOUNDING_END_SHORT}`}
      </span>
    </span>
  )
}
