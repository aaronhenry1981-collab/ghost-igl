// DEV ONLY client for scripts/cs-dev-server.mjs (fictional fixture data).
const DEV_SERVER = import.meta.env.VITE_CS_DEV_SERVER_URL || 'http://127.0.0.1:8787'

export const DEV_SCENARIOS = Object.freeze([
  'new',
  'free_activated',
  'paying_active',
  'paying_locked_out',
  'paying_renewal_stale',
  'at_risk',
  'payment_failed',
  'churned',
  'dormant_free',
])

export async function devFetch(path, as, { method = 'GET', body } = {}) {
  const res = await fetch(`${DEV_SERVER}${path}`, {
    method,
    headers: { Authorization: `Bearer dev:${as}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(payload.error || `Dev server request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return payload
}

// Dev CRM client: fictional admin against the fixture server. There is no
// live Stripe in dev, so the live check is unavailable by design.
export function createDevCrmApi() {
  return {
    mode: 'dev',
    configured: true,
    get: (path) => devFetch(path, 'admin'),
    post: (path, body) => devFetch(path, 'admin', { method: 'POST', body }),
    liveStripe: null,
  }
}
