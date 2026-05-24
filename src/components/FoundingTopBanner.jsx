import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  foundingTimeRemaining,
  isFoundingOpen,
  FOUNDING_END_SHORT,
} from '../config/founding'
import './FoundingTopBanner.css'

// Site-wide founding-rate urgency strip.
//
// Why: the FoundingCountdown badge only appears on Landing / Dashboard upsell
// / SoftPaywall / MatchPrep. A non-paid visitor who lands on a blog post, a
// per-game landing, or browses /strats never sees the countdown — so the May
// 31 cutoff stops doing any persuasion work on the largest chunk of session
// surface area. This banner sits at the very top of every page and closes
// that gap.
//
// Show conditions (all must be true):
//   - founding window still open
//   - user is not paid (plan === 'free' OR no user)
//   - user hasn't dismissed it this session (sessionStorage, not local — we
//     re-show next visit so a returning lead sees the deadline shrinking)
//   - not on the landing hero itself (the hero already has its own countdown
//     banner; doubling up looks desperate)
//
// Intensity follows the same scale as FoundingCountdown:
//   - >14 days: muted cyan
//   - 8–14   : warn amber
//   - <=7    : urgent red pulse
//
// CTA routes to landing-page pricing anchor since that's where the payment
// links live.

const DISMISS_KEY = 'recon6-founding-banner-dismissed'

function fmtN(n) {
  return String(n).padStart(2, '0')
}

export default function FoundingTopBanner() {
  const { user, plan, loading } = useAuth()
  const location = useLocation()
  const [now, setNow] = useState(() => Date.now())
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  const remaining = foundingTimeRemaining(now)

  useEffect(() => {
    if (remaining.expired) return
    const intervalMs = remaining.totalMs < 3_600_000 ? 1000 : 60_000
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [remaining.expired, remaining.totalMs])

  // Bail before we render anything — keeps the DOM clean for paid users +
  // post-deadline rotations.
  if (loading) return null
  if (!isFoundingOpen(now)) return null
  if (dismissed) return null
  // Already-paying customers don't need a "lock founding rate" pitch. plan is
  // 'free' for unsigned-in too — both groups see it.
  if (user && plan && plan !== 'free') return null
  // The landing hero has its own large countdown — skip the strip there to
  // avoid double-stacking urgency.
  if (location.pathname === '/') return null

  let mode = 'muted'
  if (remaining.days <= 7) mode = 'urgent'
  else if (remaining.days <= 14) mode = 'warn'

  function handleDismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // sessionStorage blocked (private mode in some browsers) — just hide
      // locally for this render. They'll see it on next nav, which is fine.
    }
    setDismissed(true)
  }

  // Phrasing: tighter as the deadline approaches.
  let phrase
  if (remaining.days === 0) {
    phrase = `Last day — founding rates lock in at midnight PT`
  } else if (remaining.days === 1) {
    phrase = `1 day left — founding rates end tomorrow`
  } else if (remaining.days <= 7) {
    phrase = `${remaining.days} days left — founding rates end ${FOUNDING_END_SHORT}`
  } else {
    phrase = `Lock founding rates before ${FOUNDING_END_SHORT}`
  }

  const clock =
    remaining.days > 0
      ? `${remaining.days}d ${fmtN(remaining.hours)}h ${fmtN(remaining.minutes)}m`
      : `${fmtN(remaining.hours)}h ${fmtN(remaining.minutes)}m ${fmtN(remaining.seconds)}s`

  return (
    <div className={`founding-top-banner founding-top-${mode}`} role="region" aria-label="Founding rate offer">
      <div className="founding-top-inner">
        <span className="founding-top-dot" aria-hidden="true" />
        <span className="founding-top-phrase">{phrase}</span>
        <span className="founding-top-clock" aria-label={`${remaining.days} days ${remaining.hours} hours ${remaining.minutes} minutes left`}>
          {clock}
        </span>
        <Link to="/#pricing" className="founding-top-cta">
          Lock $9/mo →
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="founding-top-close"
          aria-label="Dismiss founding-rate banner"
        >
          ×
        </button>
      </div>
    </div>
  )
}
