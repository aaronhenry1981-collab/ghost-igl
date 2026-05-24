// Founding-window single source of truth.
//
// The founding-rate launch promise: any subscriber who signs up before
// FOUNDING_END_ISO is locked at their founding rate (Pro $9, Champion $29,
// Pro All-Access $19, Champion All-Access $49) for the life of their
// subscription. After this date new sign-ups pay regular rates.
//
// Why centralize: previously every "Ends May 31" mention was a hardcoded
// string scattered across LandingPage / DashboardPage / SoftPaywall /
// WelcomeModal / GameVodPreviewPage / ReferralLandingPage. On June 1 every
// one of those becomes a stale promise. With ONE timestamp, the whole site
// rotates automatically — countdown badges hide, "Founding rate" framing
// flips, and (via stripe.js) the checkout links swap to regular pricing
// without a manual deploy.
//
// To extend the window: change FOUNDING_END_ISO here and redeploy. To flip
// immediately for emergency, set VITE_STRIPE_FOUNDING_ACTIVE=false in env.

export const FOUNDING_END_ISO = '2026-05-31T23:59:59-07:00' // PDT midnight cutoff
export const FOUNDING_END_DISPLAY = 'May 31, 2026'
export const FOUNDING_END_SHORT = 'May 31'

// Pre-launch the founding window was open from the launch announcement;
// after a launch retrospective we may want to reference the start window.
export const FOUNDING_START_ISO = '2026-04-28T00:00:00-07:00'

export function foundingDeadlineMs() {
  return new Date(FOUNDING_END_ISO).getTime()
}

export function isFoundingOpen(nowMs = Date.now()) {
  return nowMs < foundingDeadlineMs()
}

// Returns { days, hours, minutes, seconds, totalMs, expired }.
// All values clamp to 0 once expired.
export function foundingTimeRemaining(nowMs = Date.now()) {
  const total = foundingDeadlineMs() - nowMs
  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, expired: true }
  }
  const days = Math.floor(total / 86_400_000)
  const hours = Math.floor((total % 86_400_000) / 3_600_000)
  const minutes = Math.floor((total % 3_600_000) / 60_000)
  const seconds = Math.floor((total % 60_000) / 1000)
  return { days, hours, minutes, seconds, totalMs: total, expired: false }
}

// Human phrasing helpers — keep the copy consistent across components.
export function foundingDaysLeftPhrase(nowMs = Date.now()) {
  const { days, hours, expired } = foundingTimeRemaining(nowMs)
  if (expired) return null
  if (days === 0) return hours <= 1 ? 'Last hour' : `${hours} hours left`
  if (days === 1) return 'Last day · 24h left'
  if (days <= 3) return `${days} days left`
  if (days <= 14) return `${days} days left · ${FOUNDING_END_SHORT}`
  return `Ends ${FOUNDING_END_SHORT}`
}

// Used in upsell copy — "founding rate (locked for life if you join before
// May 31)". When expired we suppress the founding framing entirely so we
// don't promise something that's no longer available.
export function foundingPromisePhrase() {
  if (!isFoundingOpen()) return null
  return `founding rate (locked for life if you join before ${FOUNDING_END_SHORT})`
}
