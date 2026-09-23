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

import { getCampaignAttribution, getRefSource } from '../lib/refSource'

export function track(event, props) {
  try {
    if (typeof window === 'undefined') return
    if (typeof window.plausible !== 'function') return
    const campaign = getCampaignAttribution() || {}
    const enriched = Object.fromEntries(
      Object.entries({
        source: campaign.source || getRefSource() || 'direct',
        medium: campaign.medium || undefined,
        campaign: campaign.campaign || undefined,
        content: campaign.content || undefined,
        path: window.location.pathname,
        ...(props || {}),
      }).filter(([, value]) => value !== undefined && value !== '')
    )
    window.plausible(event, { props: enriched })
  } catch {
    // Tracking should never break the app. Fail silently.
  }
}
