// Client-side checkout funnel markers for Plausible.
//
// Stripe Checkout runs on stripe.com, so the page that started checkout and
// the page Stripe returns to never share React state. The tier and CTA are
// kept in sessionStorage (per tab, survives the round trip to Stripe) so the
// return can be reported as "Checkout Completed" with the same campaign props
// that track() adds from first-touch attribution.
//
// Stripe's webhook stays the source of truth for who paid; these events only
// connect a paid return to the campaign and CTA that produced it.

const PENDING_KEY = 'recon:checkout-pending'
const REPORTED_KEY = 'recon:checkout-reported'

export function rememberCheckoutStart(tier, location, storage = globalThis.sessionStorage) {
  try {
    storage?.setItem(PENDING_KEY, JSON.stringify({ tier, location, at: Date.now() }))
  } catch { /* storage blocked — tracking never blocks checkout */ }
}

// Returns the event to send for a checkout return URL, or null. Each pending
// checkout is reported at most once, so reloading the success page does not
// count a second purchase.
export function checkoutReturnEvent(status, storage = globalThis.sessionStorage) {
  if (status !== 'success' && status !== 'cancelled') return null
  let pending = null
  try {
    pending = JSON.parse(storage?.getItem(PENDING_KEY) || 'null')
  } catch { pending = null }
  const marker = `${status}:${pending?.at || 'unknown'}`
  try {
    if (storage?.getItem(REPORTED_KEY) === marker) return null
    storage?.setItem(REPORTED_KEY, marker)
  } catch { /* storage blocked — report once for this page view */ }
  return {
    name: status === 'success' ? 'Checkout Completed' : 'Checkout Cancelled',
    props: {
      tier: pending?.tier || 'unknown',
      ...(pending?.location ? { location: pending.location } : {}),
    },
  }
}
