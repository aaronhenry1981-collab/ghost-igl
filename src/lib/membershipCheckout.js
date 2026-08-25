import { API_URL, getCurrentUser, getIdToken, getSession } from './cognito'

export async function openMembershipCheckout(tier) {
  const cognitoUser = getCurrentUser()
  if (!cognitoUser) {
    const error = new Error('Sign in before choosing a paid plan.')
    error.code = 'AUTH_REQUIRED'
    throw error
  }
  const session = await getSession(cognitoUser)
  const token = getIdToken(session)
  const response = await fetch(`${API_URL}/me/membership-checkout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tier }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.url) {
    throw new Error(data.error || `Could not open checkout (HTTP ${response.status})`)
  }
  window.location.assign(data.url)
}

export function membershipSignInPath(tier) {
  const redirect = `/?checkout=${encodeURIComponent(tier)}`
  return `/auth?mode=signup&redirect=${encodeURIComponent(redirect)}`
}
