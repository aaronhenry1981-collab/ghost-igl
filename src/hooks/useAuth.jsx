import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) checkProStatus(session.user.id)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkProStatus(session.user.id)
      } else {
        setIsPro(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkProStatus(userId) {
    if (!supabase) return
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('status, plan')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      setIsPro(data?.plan === 'pro' || data?.plan === 'champion')
    } catch {
      // No subscription found — free user
      setIsPro(false)
    }
  }

  async function signUp(email, password) {
    if (!supabase) return { error: { message: 'Auth not configured' } }
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error }
  }

  async function signIn(email, password) {
    if (!supabase) return { error: { message: 'Auth not configured' } }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
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
