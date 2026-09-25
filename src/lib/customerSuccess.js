import { API_URL, getCurrentUser, getIdToken, getSession } from './cognito'

// Customer-success API (isolated stack, aws/customer-success-template.yaml).
// Unset = the player home runs in "lite" mode from the account API only.
const CS_API_URL = String(import.meta.env.VITE_CUSTOMER_SUCCESS_API_URL || '').replace(/\/$/, '')

export function isCustomerSuccessConfigured() {
  return Boolean(CS_API_URL)
}

export async function currentIdToken() {
  const cognitoUser = getCurrentUser()
  if (!cognitoUser) return null
  const session = await getSession(cognitoUser)
  return getIdToken(session)
}

async function request(base, path, { token, method = 'GET', body, keepalive = false, signal } = {}) {
  if (!base) return null
  if (!token) throw new Error('Sign in again to continue.')
  const res = await fetch(`${base}${path}`, {
    method,
    keepalive,
    signal,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(payload.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return payload
}

export function csRequest(path, options) {
  return request(CS_API_URL, path, options)
}

export function fetchPlayerHome(token, options = {}) {
  return csRequest('/cs/me/home', { token, ...options })
}

export function recordActivity(token, activity) {
  return csRequest('/cs/me/activity', { token, method: 'POST', body: activity, keepalive: true })
}

// Existing account API endpoints the lite home reads.
export function fetchClimbProgress(token, options = {}) {
  return request(API_URL, '/me/climb-progress', { token, ...options })
}

export async function openBillingPortal(token) {
  const data = await request(API_URL, '/me/billing-portal', { token, method: 'POST' })
  if (!data?.url) throw new Error('Billing portal is unavailable right now.')
  window.location.assign(data.url)
}
