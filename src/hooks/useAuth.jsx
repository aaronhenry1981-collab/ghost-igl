import { useState, useEffect, createContext, useContext } from 'react'
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

  useEffect(() => {
    if (!userPool) {
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

  // Profile + sub state lives in one /me call now (was two: /subscription + nothing).
  // /me returns { plan, sub_status, profile, profile_complete } so consumers can
  // gate UI like the onboarding modal on profile_complete without an extra round trip.
  async function checkProStatus(userId, payload, session) {
    if (!API_URL) return

    try {
      const token = getIdToken(session)
      const res = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const p = data?.plan === 'pro' || data?.plan === 'champion' ? data.plan : 'free'
        setPlan(p)
        setIsPro(p === 'pro' || p === 'champion')
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

  async function signUp(email, password) {
    if (!userPool) return { error: { message: 'Auth not configured' } }

    return new Promise((resolve) => {
      const attributes = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
      ]

      userPool.signUp(email, password, attributes, null, (err, result) => {
        if (err) {
          resolve({ data: null, error: { message: err.message } })
        } else {
          resolve({ data: result, error: null })
        }
      })
    })
  }

  async function signIn(email, password) {
    if (!userPool) return { error: { message: 'Auth not configured' } }

    return new Promise((resolve) => {
      const cognitoUser = getCognitoUser(email)
      const authDetails = getAuthDetails(email, password)

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session) => {
          const payload = session.getIdToken().decodePayload()
          const userData = {
            id: payload.sub,
            email: payload.email,
            cognitoUser,
            session,
          }
          setUser(userData)
          setIsAdmin(computeIsAdmin(payload))
          checkProStatus(userData.id, payload, session)
          resolve({ data: { user: userData, session }, error: null })
        },
        onFailure: (err) => {
          resolve({ data: null, error: { message: err.message } })
        },
      })
    })
  }

  async function confirmSignUp(email, code) {
    if (!userPool) return { error: { message: 'Auth not configured' } }

    return new Promise((resolve) => {
      const cognitoUser = getCognitoUser(email)
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

    return new Promise((resolve) => {
      const cognitoUser = getCognitoUser(email)
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
    const cognitoUser = getCurrentUser()
    if (cognitoUser) {
      cognitoUser.signOut()
    }
    setUser(null)
    setIsPro(false)
    setIsAdmin(false)
    setPlan('free')
  }

  // Step 1 of password reset: emails the user a 6-digit code.
  async function forgotPassword(email) {
    if (!userPool) return { error: { message: 'Auth not configured' } }

    return new Promise((resolve) => {
      const cognitoUser = getCognitoUser(email)
      cognitoUser.forgotPassword({
        onSuccess: (data) => resolve({ data, error: null }),
        onFailure: (err) => resolve({ data: null, error: { message: err.message } }),
      })
    })
  }

  // Step 2 of password reset: verifies the code and sets a new password.
  async function confirmForgotPassword(email, code, newPassword) {
    if (!userPool) return { error: { message: 'Auth not configured' } }

    return new Promise((resolve) => {
      const cognitoUser = getCognitoUser(email)
      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => resolve({ data: { ok: true }, error: null }),
        onFailure: (err) => resolve({ data: null, error: { message: err.message } }),
      })
    })
  }

  return (
    <AuthContext.Provider value={{ user, isPro, isAdmin, plan, tierScope, profile, profileComplete, vodUsage, setVodUsage, loading, signUp, signIn, signOut, confirmSignUp, resendConfirmationCode, forgotPassword, confirmForgotPassword, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
