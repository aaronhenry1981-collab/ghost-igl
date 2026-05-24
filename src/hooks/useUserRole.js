import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'

const STORAGE_KEY = 'ghost-igl:user-role'

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write(value) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage disabled - no-op
  }
}

/**
 * Reads the signed-in user's gamer profile role from cache + refreshes from /me in the background.
 * Returns { role, loading } — role is a string like "Entry" | "Support" | "IGL" | "Roamer" | etc., or null.
 */
export function useUserRole() {
  const { user } = useAuth()
  const [role, setRole] = useState(read)
  const [loading, setLoading] = useState(false)

  // Clear cached role on sign-out
  useEffect(() => {
    if (!user) {
      setRole(null)
      write(null)
    }
  }, [user])

  // Refresh from /me in the background when signed in
  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const cognitoUser = getCurrentUser()
      if (!cognitoUser) return
      const session = await getSession(cognitoUser)
      const token = getIdToken(session)
      const res = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      const newRole = data.profile?.main_role || null
      setRole(newRole)
      write(newRole)
    } catch {
      // Network / auth issue - keep cached value
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Cross-tab sync
  useEffect(() => {
    function onStorage(e) {
      if (e.key === STORAGE_KEY) setRole(read())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return { role, loading, refresh }
}

/**
 * Matches a user's main_role against an operator's declared role string.
 * Returns true if this operator is a good pick for the user's playstyle.
 */
export function operatorFitsRole(operator, userRole) {
  if (!userRole || !operator?.role) return false
  const opRole = operator.role.toLowerCase()
  switch (userRole) {
    case 'Entry':
      return opRole.includes('entry') || opRole.includes('frag')
    case 'Support':
      return (
        opRole.includes('support') ||
        opRole.includes('hard breach') ||
        opRole.includes('utility clear') ||
        opRole.includes('soft breach') ||
        opRole.includes('intel denial')
      )
    case 'Anchor':
      return (
        opRole.includes('anti-breach') ||
        opRole.includes('area denial') ||
        opRole.includes('sustain') ||
        opRole.includes('drone denial') ||
        opRole.includes('utility denial') ||
        opRole.includes('reinforce')
      )
    case 'Roamer':
      return opRole.includes('roam') || opRole.includes('flank')
    case 'IGL':
      return (
        opRole.includes('intel') ||
        opRole.includes('flex') ||
        opRole.includes('vertical')
      )
    case 'Flex':
      return true
    default:
      return false
  }
}
