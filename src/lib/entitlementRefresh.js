export const CHECKOUT_ENTITLEMENT_DELAYS_MS = Object.freeze([500, 1000, 2000, 4000])

export function hasVerifiedPaidCheckout(data, checkoutSessionId) {
  const plan = String(data?.plan || '').toLowerCase()
  const status = String(data?.sub_status || '').toLowerCase()
  const sessionId = String(checkoutSessionId || '')
  return !data?.is_admin && data?.comp !== true &&
    ['pro', 'elite', 'champion'].includes(plan) &&
    ['active', 'trialing'].includes(status) &&
    /^cus_[A-Za-z0-9]+$/.test(String(data?.stripe_customer_id || '')) &&
    /^cs_(?:live|test)_[A-Za-z0-9]+$/.test(sessionId) &&
    data?.checkout_session_id === sessionId &&
    data?.checkout_payment_status === 'paid'
}

function abortError() {
  const error = new Error('Checkout confirmation cancelled')
  error.name = 'AbortError'
  return error
}

const wait = (ms, signal) => new Promise((resolve, reject) => {
  if (signal?.aborted) return reject(abortError())
  const timer = setTimeout(() => {
    signal?.removeEventListener('abort', onAbort)
    resolve()
  }, ms)
  const onAbort = () => {
    clearTimeout(timer)
    reject(abortError())
  }
  signal?.addEventListener('abort', onAbort, { once: true })
})

// Stripe can redirect before the webhook has written the subscription row.
// Retry for a bounded 7.5 seconds, then leave the page usable with the latest
// server state. A later reload/relogin remains a safe fallback.
export async function loadMembershipAfterCheckout(fetchMembership, {
  checkoutStatus,
  checkoutSessionId,
  delays = CHECKOUT_ENTITLEMENT_DELAYS_MS,
  sleep = wait,
  signal,
} = {}) {
  let data = null
  let lastError = null
  const attempts = checkoutStatus === 'success' ? delays.length + 1 : 1
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (attempt > 0) await sleep(delays[attempt - 1], signal)
    if (signal?.aborted) throw abortError()
    try {
      const next = await fetchMembership()
      if (next) data = next
    } catch (error) {
      lastError = error
      if (checkoutStatus !== 'success') throw error
    }
    if (checkoutStatus !== 'success') return { data, verifiedPayment: false }
    if (hasVerifiedPaidCheckout(data, checkoutSessionId)) {
      return { data, verifiedPayment: true }
    }
  }

  if (!data && lastError) throw lastError
  return { data, verifiedPayment: false }
}
