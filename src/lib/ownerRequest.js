import { API_URL, getCurrentUser, getSession, getIdToken } from './cognito'

function interrupted() {
  return Object.assign(new Error('This account request was cancelled. Sign in again to continue.'), { name: 'AbortError' })
}

async function ownerSession(ownerId, lifecycle) {
  const scope = lifecycle.captureAuthScope()
  const current = () => lifecycle.isAuthScopeCurrent(scope)
  if (!ownerId || !current()) throw interrupted()
  const user = getCurrentUser()
  if (!user) throw interrupted()
  const session = await getSession(user)
  const subject = session?.getIdToken()?.decodePayload()?.sub
  if (subject !== ownerId || !current()) throw interrupted()
  return { session, current }
}

// A retained component/client cannot use the next account's fresh session to
// send the previous owner's draft. No client-supplied identity reaches the API.
export async function tokenForOwner(ownerId, lifecycle) {
  const { session } = await ownerSession(ownerId, lifecycle)
  return getIdToken(session)
}

// Keep the original generation check attached to a transport request. A bare
// token can authenticate its start but cannot validate a delayed completion.
export async function authorizationForOwner(ownerId, lifecycle) {
  const { session, current } = await ownerSession(ownerId, lifecycle)
  return { token: getIdToken(session), isCurrent: current }
}

export async function requestForOwner(ownerId, lifecycle, path, init = {}) {
  const { session, current } = await ownerSession(ownerId, lifecycle)
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(init.headers || {}), Authorization: `Bearer ${getIdToken(session)}` },
  })
  const data = await response.json().catch(() => ({}))
  // In particular, never open a former account's billing session after logout.
  if (!current()) throw interrupted()
  if (!response.ok) throw Object.assign(new Error(data?.error || `HTTP ${response.status}`), { status: response.status })
  return data
}
