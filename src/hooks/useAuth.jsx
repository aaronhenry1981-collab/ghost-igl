import { useState, useEffect, createContext, useContext } from 'react'
import {
  userPool,
  getCognitoUser,
  getAuthDetails,
  getCurrentUser,
  getSession,
  getIdToken,
  API_URL
} from '../lib/supabase'
import { CognitoUserAttribute } from 'amazon-cognito-identity-js'

const AuthContext = createContext(null)
const ADMIN_EMAILS = ['aaronhenry1981@gmail.com']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userPool) {
      setLoading(false)
      return
    }

    // Check current session on mount
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
          checkProStatus(userData.id, userData.email, session)
        })
        .catch(() => {
          setUser(null)
          setIsPro(false)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function checkProStatus(userId, email, session) {
    if (ADMIN_EMAILS.includes(email?.toLowerCase())) {
      setIsPro(true)
      return
    }

    if (!API_URL) return

    try {
      const token = getIdToken(session)
      const res = await fetch(`${API_URL}/subscription`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setIsPro(data?.plan === 'pro' || data?.plan === 'champion')
      } else {
        setIsPro(false)
      }
    } catch {
      setIsPro(false)
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
          checkProStatus(userData.id, userData.email, session)
          resolve({ data: { user: userData, session }, error: null })
        },
        onFailure: (err) => {
          resolve({ data: null, error: { message: err.message } })
        },
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
  }

  return (
    <AuthContext.Provider value={{ user, isPro, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
