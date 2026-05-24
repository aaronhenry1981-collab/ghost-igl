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

export function track(event, props) {
  try {
    if (typeof window === 'undefined') return
    if (typeof window.plausible !== 'function') return
    if (props && Object.keys(props).length > 0) {
      window.plausible(event, { props })
    } else {
      window.plausible(event)
    }
  } catch {
    // Tracking should never break the app. Fail silently.
  }
}
