import { useState, useEffect, createContext, useContext, useRef } from 'react'
import {
  userPool,
  getCognitoUser,
  getAuthDetails,
  getCurrentUser,
  getSession,
  getIdToken,
  API_URL
} from '../lib/cognito'
import { CognitoUserAttribute } from 'amazon-cognito-identity-js'
import { hasPlan, normalizePlan } from '../config/memberships'

const AuthContext = createContext(null)

function computeIsAdmin(payload) {
  const groups = payload?.['cognito:groups'] || []
  return Array.isArray(groups) && groups.includes('admins')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isPro, setIsPro] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [plan, setPlan] = useState('free')
  // tier_scope: 'single' = subscription unlocks one game; 'all_access' =
  // all 20 games. Free users default to 'all_access' since gating doesn't
  // apply to browse-only content. Admins always all_access.
  const [tierScope, setTierScope] = useState('all_access')
  const [profile, setProfile] = useState(null)
  const [profileComplete, setProfileComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  // VOD session usage: { used, limit, remaining, is_trial, period_end, unlimited }.
  // null for non-Pro users (they can't hit the endpoint anyway). Updated on
  // every /me fetch + bumped client-side after a successful VOD analyze so
  // the UI reflects the new count without a re-fetch.
  const [vodUsage, setVodUsage] = useState(null)
  // Cognito keeps the NEW_PASSWORD_REQUIRED challenge on this user object.
  // Keep it in memory only; refreshing the page intentionally requires the
  // customer to sign in with the temporary password again.
  const pendingNewPasswordRef = useRef(null)

  // Profile + sub state lives in one /me call now (was two: /subscription + nothing).
  // /me returns { plan, sub_status, profile, profile_complete } so consumers can
  // gate UI like the onboarding modal on profile_complete without an extra round trip.
  // Declared BEFORE the mount effect that calls it (react-hooks/immutability).
  async function checkProStatus(userId, payload, session) {
    if (!API_URL) return

    try {
      const token = getIdToken(session)
      const res = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const p = normalizePlan(data?.plan)
        setPlan(p)
        setIsPro(hasPlan(p, 'pro'))
        setTierScope(data?.tier_scope === 'single' ? 'single' : 'all_access')
        setProfile(data?.profile || null)
        setProfileComplete(!!data?.profile_complete)
        setVodUsage(data?.vod_usage || null)
      } else {
        // Admins still get champion access even if /me fails — fall back to JWT claim.
        if (computeIsAdmin(payload)) {
          setIsPro(true); setPlan('champion')
        } else {
          setPlan('free'); setIsPro(false)
        }
      }
    } catch {
      if (computeIsAdmin(payload)) {
        setIsPro(true); setPlan('champion')
      } else {
        setPlan('free'); setIsPro(false)
      }
    }
  }

  useEffect(() => {
    if (!userPool) {
      // Terminal state when Cognito isn't configured — set once on mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      return
    }

    // Check current session on mount. We MUST await checkProStatus before
    // flipping loading=false — otherwise consumers like ProfileSetupModal
    // briefly see `loading=false, user={...}, profileComplete=false` (the
    // initial state) while /me is still in flight, then flip to
    // profileComplete=true a moment later. That race flashed the profile-
    // setup popup on every refresh.
    const cognitoUser = getCurrentUser()
    if (cognitoUser) {
      getSession(cognitoUser)
        .then((session) => {
          const payload = session.getIdToken().decodePayload()
          const userData = {
            id: payload.sub,
            email: payload.email,
            name: payload.name || '',
            cognitoUser,
            session,
          }
          setUser(userData)
          setIsAdmin(computeIsAdmin(payload))
          // Return the promise so .finally waits for /me to resolve before
          // clearing the loading flag. No more first-paint flash.
          return checkProStatus(userData.id, payload, session)
        })
        .catch(() => {
          setUser(null)
          setIsPro(false)
          setIsAdmin(false)
          setPlan('free')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  // Re-fetch /me — call after the user updates their profile so consumers
  // (like the onboarding modal) see the new state without a full reload.
  async function refreshProfile() {
    const cognitoUser = getCurrentUser()
    if (!cognitoUser) return
    try {
      const session = await getSession(cognitoUser)
      const payload = session.getIdToken().decodePayload()
      await checkProStatus(payload.sub, payload, session)
    } catch (err) {
      console.warn('refreshProfile failed:', err)
    }
  }

  // Our Cognito pool uses email as the username and is CASE-SENSITIVE (confirmed
  // live: a user stored as "Bob@gmail.com" is not found by "bob@gmail.com"). If
  // the client passed the email through raw, a user whose keyboard capitalized
  // their address differently than at signup would be silently locked out with
  // "User does not exist." We canonicalize every email to trimmed-lowercase so
  // new accounts are consistent, and sign-in falls back to exact-typed casing
  // for the handful of legacy accounts created before this normalization.
  function normalizeEmail(raw) {
    return (raw || '').trim().toLowerCase()
  }

  // fullName is optional at the API level so existing callers keep working,
  // but the sign-up form now asks for it — knowing who a member actually is
  // (not just their email) is what makes support and coaching personal.
  async function signUp(email, password, fullName = '') {
    if (!userPool) return { error: { message: 'Auth not configured' } }
    const normEmail = normalizeEmail(email)
    const name = (fullName || '').trim()

    return new Promise((resolve) => {
      const attributes = [
        new CognitoUserAttribute({ Name: 'email', Value: normEmail }),
      ]
      if (name) attributes.push(new CognitoUserAttribute({ Name: 'name', Value: name }))

      userPool.signUp(normEmail, password, attributes, null, (err, result) => {
        if (err) {
          resolve({ data: null, error: { message: err.message } })
        } else {
          resolve({ data: result, error: null })
        }
      })
    })
  }

  // Single Cognito auth attempt for a specific username spelling. Resolves
  // { ok, session, cognitoUser } on success or { ok:false, err } on failure —
  // never rejects, so the caller can cleanly try a fallback spelling.
  function attemptSignIn(username, password) {
    return new Promise((resolve) => {
      const cognitoUser = getCognitoUser(username)
      const authDetails = getAuthDetails(username, password)
      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session) => resolve({ ok: true, session, cognitoUser }),
        onFailure: (err) => resolve({ ok: false, err }),
        newPasswordRequired: (userAttributes, requiredAttributes) => resolve({
          ok: false,
          challenge: 'NEW_PASSWORD_REQUIRED',
          cognitoUser,
          userAttributes,
          requiredAttributes,
        }),
      })
    })
  }

  async function signIn(email, password) {
    if (!userPool) return { error: { message: 'Auth not configured' } }

    const typed = (email || '').trim()
    const lower = typed.toLowerCase()

    // Try the canonical lowercase spelling first — matches all new signups
    // plus every existing lowercase account regardless of how the user's
    // device capitalized their input.
    let result = await attemptSignIn(lower, password)

    // Fall back to the exact-typed casing ONLY when the lowercase user truly
    // doesn't exist (not on a wrong-password) and the casing actually differs.
    // This keeps the few legacy capitalized accounts working with no regression.
    if (!result.ok) {
      const err = result.err || {}
      const notFound = err.code === 'UserNotFoundException' ||
        /user does not exist/i.test(err.message || '')
      if (notFound && typed !== lower) {
        result = await attemptSignIn(typed, password)
      }
    }

    // Handle the challenge after the casing fallback too, so a legacy account
    // whose stored email contains capitals gets the same first-login flow.
    if (result.challenge === 'NEW_PASSWORD_REQUIRED') {
      // Cognito rejects read-only attributes if they are sent back during
      // completeNewPasswordChallenge. Keep only mutable attributes supplied
      // by the challenge and never persist the temporary password.
      const attributes = { ...(result.userAttributes || {}) }
      delete attributes.email_verified
      delete attributes.phone_number_verified
      delete attributes.sub
      delete attributes.identities
      pendingNewPasswordRef.current = {
        cognitoUser: result.cognitoUser,
        attributes,
      }
      return {
        data: { challenge: 'NEW_PASSWORD_REQUIRED' },
        error: null,
      }
    }

    if (result.ok) {
      pendingNewPasswordRef.current = null
      const { session, cognitoUser } = result
      const payload = session.getIdToken().decodePayload()
      const userData = { id: payload.sub, email: payload.email, name: payload.name || '', cognitoUser, session }
      setUser(userData)
      setIsAdmin(computeIsAdmin(payload))
      checkProStatus(userData.id, payload, session)
      return { data: { user: userData, session }, error: null }
    }
    return { data: null, error: { message: result.err?.message || 'Sign in failed' } }
  }

  async function completeNewPassword(newPassword) {
    const pending = pendingNewPasswordRef.current
    if (!pending?.cognitoUser) {
      return { data: null, error: { message: 'Your first-login session expired. Sign in again with the temporary password.' } }
    }

    return new Promise((resolve) => {
      pending.cognitoUser.completeNewPasswordChallenge(newPassword, pending.attributes, {
        onSuccess: async (session) => {
          pendingNewPasswordRef.current = null
          const payload = session.getIdToken().decodePayload()
          const userData = {
            id: payload.sub,
            email: payload.email,
            name: payload.name || '',
            cognitoUser: pending.cognitoUser,
            session,
          }
          setUser(userData)
          setIsAdmin(computeIsAdmin(payload))
          await checkProStatus(userData.id, payload, session)
          resolve({ data: { user: userData, session }, error: null })
        },
        onFailure: (err) => resolve({
          data: null,
          error: { message: err?.message || 'Could not set your new password' },
        }),
      })
    })
  }

  // Runs a Cognito op that takes a username, trying canonical lowercase first
  // then the exact-typed casing if that user doesn't exist. `run(username)`
  // must resolve { ok, ... } / { ok:false, err } and never reject.
  async function withCasingFallback(email, run) {
    const typed = (email || '').trim()
    const lower = typed.toLowerCase()
    let r = await run(lower)
    if (!r.ok) {
      const err = r.err || {}
      const notFound = err.code === 'UserNotFoundException' ||
        /user does not exist/i.test(err.message || '')
      if (notFound && typed !== lower) r = await run(typed)
    }
    return r
  }

  async function confirmSignUp(email, code) {
    if (!userPool) return { error: { message: 'Auth not configured' } }
    // Confirm pairs with a just-created (lowercased) signup — canonicalize.
    const normEmail = normalizeEmail(email)

    return new Promise((resolve) => {
      const cognitoUser = getCognitoUser(normEmail)
      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          resolve({ data: null, error: { message: err.message } })
        } else {
          resolve({ data: result, error: null })
        }
      })
    })
  }

  async function resendConfirmationCode(email) {
    if (!userPool) return { error: { message: 'Auth not configured' } }
    const normEmail = normalizeEmail(email)

    return new Promise((resolve) => {
      const cognitoUser = getCognitoUser(normEmail)
      cognitoUser.resendConfirmationCode((err, result) => {
        if (err) {
          resolve({ data: null, error: { message: err.message } })
        } else {
          resolve({ data: result, error: null })
        }
      })
    })
  }

  async function signOut() {
    pendingNewPasswordRef.current = null
    const cognitoUser = getCurrentUser()
    if (cognitoUser) {
      cognitoUser.signOut()
    }
    setUser(null)
    setIsPro(false)
    setIsAdmin(false)
    setPlan('free')
  }

  // Step 1 of password reset: emails the user a 6-digit code. Uses the casing
  // fallback so both new lowercase accounts and legacy capitalized ones can
  // trigger a reset regardless of how the email is typed.
  async function forgotPassword(email) {
    if (!userPool) return { error: { message: 'Auth not configured' } }

    const r = await withCasingFallback(email, (username) => new Promise((resolve) => {
      getCognitoUser(username).forgotPassword({
        onSuccess: (data) => resolve({ ok: true, data }),
        onFailure: (err) => resolve({ ok: false, err }),
      })
    }))
    return r.ok ? { data: r.data, error: null } : { data: null, error: { message: r.err?.message || 'Request failed' } }
  }

  // Step 2 of password reset: verifies the code and sets a new password. Same
  // casing fallback — the reset code is valid for the real account whichever
  // spelling resolves to it.
  async function confirmForgotPassword(email, code, newPassword) {
    if (!userPool) return { error: { message: 'Auth not configured' } }

    const r = await withCasingFallback(email, (username) => new Promise((resolve) => {
      getCognitoUser(username).confirmPassword(code, newPassword, {
        onSuccess: () => resolve({ ok: true }),
        onFailure: (err) => resolve({ ok: false, err }),
      })
    }))
    return r.ok ? { data: { ok: true }, error: null } : { data: null, error: { message: r.err?.message || 'Reset failed' } }
  }

  const isElite = hasPlan(plan, 'elite', isAdmin)
  const isChampion = hasPlan(plan, 'champion', isAdmin)

  return (
    <AuthContext.Provider value={{ user, isPro, isElite, isChampion, isAdmin, plan, tierScope, profile, profileComplete, vodUsage, setVodUsage, loading, signUp, signIn, completeNewPassword, signOut, confirmSignUp, resendConfirmationCode, forgotPassword, confirmForgotPassword, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
