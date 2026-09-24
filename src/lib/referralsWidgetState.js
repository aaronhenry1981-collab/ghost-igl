// Pure view-state resolver for the dashboard Referrals widget. Kept out of
// the component so "never silently render nothing" is unit-testable without
// a DOM. The widget was returning null on any fetch error AND on a
// successful-but-empty response, which is indistinguishable from "hide this
// for signed-out users" — from the outside both looked like a blank card.
export function resolveReferralsWidgetView({ user, loading, error, data }) {
  if (!user) return { kind: 'hidden' }
  if (loading) return { kind: 'loading' }
  if (error) return { kind: 'error', message: error }
  // A 200 with a body missing the fields the widget needs to render a real
  // link is still not something we can show — treat it the same as an error
  // rather than fabricating a link or silently disappearing.
  if (!data || !data.share_url || !data.code) {
    return { kind: 'error', message: 'No referral data came back for your account.' }
  }
  return { kind: 'ready', data }
}
