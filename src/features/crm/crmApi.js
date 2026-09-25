import { API_URL } from '../../lib/cognito'
import { csRequest, currentIdToken, isCustomerSuccessConfigured } from '../../lib/customerSuccess'

// Live CRM client: customer-success API with the admin's Cognito ID token.
// `liveStripe` calls the EXISTING admin endpoint (GET /admin/users), which
// already reconciles against live Stripe with partial-failure handling; the
// CRM shows its warnings verbatim instead of re-implementing Stripe reads.
export function createLiveCrmApi() {
  return {
    mode: 'live',
    configured: isCustomerSuccessConfigured(),
    async get(path) {
      return csRequest(path, { token: await currentIdToken() })
    },
    async post(path, body) {
      return csRequest(path, { token: await currentIdToken(), method: 'POST', body })
    },
    async put(path, body) {
      return csRequest(path, { token: await currentIdToken(), method: 'PUT', body })
    },
    async liveStripe() {
      const token = await currentIdToken()
      const res = await fetch(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Live Stripe check failed (${res.status})`)
      return data
    },
  }
}
