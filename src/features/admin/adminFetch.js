import { API_URL, getCurrentUser, getSession, getIdToken } from '../../lib/cognito'

// One authenticated client for every admin screen (replaces the identical
// per-component helpers). The API enforces the admins group on every route;
// this only attaches the signed-in admin's Cognito ID token.
//
// setAdminTokenSource is for the dev-only fixture preview (/__dev/admin),
// which serves fictional data and has no Cognito session.
let tokenSource = null

export function setAdminTokenSource(fn) {
  tokenSource = fn
}

async function idToken() {
  const preset = tokenSource ? tokenSource() : null
  if (preset) return preset
  const user = getCurrentUser()
  if (!user) throw new Error('Not signed in')
  return getIdToken(await getSession(user))
}

export async function adminFetch(path, opts = {}) {
  const token = await idToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return data
}

/** JSON write (POST / PUT / DELETE with a body). */
export function adminSend(path, method, body) {
  return adminFetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
}

/** Unauthenticated read of a public API route (open booking slots). */
export async function publicFetch(path) {
  const res = await fetch(`${API_URL}${path}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
  return data
}
