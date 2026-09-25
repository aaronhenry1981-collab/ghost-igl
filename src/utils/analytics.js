// Plausible event tracking. The script is loaded in index.html; this util
// just wraps `window.plausible(...)` so the rest of the app can call it
// without checking `typeof window` or whether the script loaded.
//
// Set up corresponding goals in Plausible dashboard:
//   - Pricing CTA Click  (props: tier=pro|champion, location=hero|pricing-card|softpaywall|champion-gate|pro-gate)
//   - Paywall Shown      (props: viewCount=N)
//   - Paywall Dismiss    (props: viewCount=N)
//   - Signup Completed   (no props)
//   - Signin Completed   (no props)
//   - VOD Analyze Click  (no props)
//   - Strat Viewed       (props: map=X, site=Y, side=Z, plan=free|pro|champion)
//
// Plausible filters by goal name in the dashboard. Funnel reports compare
// "Pricing CTA Click" → "Signup Completed" → real subscriber events from
// the Stripe webhook (those are server-side; surface manually if needed).
//
// Every event also carries this browser's acquisition attribution as custom
// properties (source, channel, medium, campaign, content, last_source,
// landing; see src/lib/attribution/store.js). Plausible only reports custom
// properties that are added under Site settings → Custom properties.
// Event-specific props win over attribution props with the same name.

import { attributionProps } from '../lib/attribution/store'

// Signed-in funnel steps are also recorded first-party by
// AcquisitionTracker, which listens for this DOM event.
export const TRACK_EVENT = 'recon:track'

export function track(event, props) {
  try {
    if (typeof window === 'undefined') return
    try {
      window.dispatchEvent(new CustomEvent(TRACK_EVENT, { detail: { event, props: props || {} } }))
    } catch { /* listeners must never break tracking */ }
    if (typeof window.plausible !== 'function') return
    const enriched = { ...attributionProps(), ...(props || {}) }
    if (Object.keys(enriched).length > 0) {
      window.plausible(event, { props: enriched })
    } else {
      window.plausible(event)
    }
  } catch {
    // Tracking should never break the app. Fail silently.
  }
}
