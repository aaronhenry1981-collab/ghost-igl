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
//   - Strat Viewed       (props: map=X, site=Y, side=Z)
//
// Plausible filters by goal name in the dashboard. Funnel reports compare
// "Pricing CTA Click" → "Signup Completed" → real subscriber events from
// the Stripe webhook (those are server-side; surface manually if needed).
//
// The business outcomes below also go to Heycatch as named events. Its
// autocapture already records pageviews and clicks, so only the outcomes it
// cannot see are sent, and never with an identity: Recon 6 does not send
// Heycatch names, email addresses or account IDs (privacy policy, PR #54).

import { analytics } from '@heycatch/sdk'
import { analyticsStarted } from '../lib/analyticsScope.mjs'
import { getCampaignAttribution, getRefSource } from '../lib/refSource'

export const HEYCATCH_EVENTS = Object.freeze({
  'Signup Started': 'signup_started',
  'Account Verified': 'account_verified',
  'Signup Completed': 'signup_completed',
  'Membership Checkout Opened': 'checkout_started',
  'Checkout Completed': 'subscription_started',
  'Checkout Cancelled': 'checkout_cancelled',
  'Strat Viewed': 'strat_viewed',
})

// Heycatch takes flat string/number/boolean values only.
export function heycatchProps(props) {
  return Object.fromEntries(
    Object.entries(props || {}).filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value)),
  )
}

export function track(event, props) {
  try {
    if (typeof window === 'undefined') return
    const campaign = getCampaignAttribution() || {}
    const enriched = Object.fromEntries(
      Object.entries({
        source: campaign.source || getRefSource() || 'direct',
        medium: campaign.medium || undefined,
        campaign: campaign.campaign || undefined,
        content: campaign.content || undefined,
        term: campaign.term || undefined,
        path: window.location.pathname,
        ...(props || {}),
      }).filter(([, value]) => value !== undefined && value !== '')
    )
    const heycatchEvent = HEYCATCH_EVENTS[event]
    if (heycatchEvent && analyticsStarted()) analytics.trackEvent(heycatchEvent, heycatchProps(enriched))
    if (typeof window.plausible !== 'function') return
    window.plausible(event, { props: enriched })
  } catch {
    // Tracking should never break the app. Fail silently.
  }
}
