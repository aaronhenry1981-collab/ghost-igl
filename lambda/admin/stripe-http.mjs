// Minimal Stripe REST client used by the admin Lambda (reconciliation reads,
// referral-reward credits). Shared with sandbox/referral-sandbox.mjs so the
// Stripe TEST-mode run exercises exactly the code production uses.
export function createStripeHttp(secret, fetchImpl = globalThis.fetch) {
  async function get(path, params = {}) {
    if (!secret) throw new Error('Stripe is not configured')
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) value.forEach((item) => query.append(key, String(item)))
      else if (value !== undefined && value !== null) query.set(key, String(value))
    }
    const response = await fetchImpl(`https://api.stripe.com${path}${query.size ? `?${query}` : ''}`, {
      headers: { Authorization: `Bearer ${secret}` },
    })
    if (!response.ok) throw new Error(`Stripe ${path} returned HTTP ${response.status}`)
    return response.json()
  }

  // Form-encoded POST with an idempotency key (Stripe keeps the first result
  // for 24h, so a retried request can never create a second object).
  async function post(path, form, idempotencyKey) {
    if (!secret) throw new Error('Stripe is not configured')
    const response = await fetchImpl(`https://api.stripe.com${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/x-www-form-urlencoded', ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}) },
      body: new URLSearchParams(form).toString(),
    })
    if (!response.ok) throw new Error(`Stripe POST ${path} returned HTTP ${response.status}`)
    return response.json()
  }

  return { get, post }
}
