import { useEffect, useState } from 'react'
import { API_URL, getCurrentUser, getIdToken, getSession } from '../lib/cognito'
import { useAuth } from './useAuth'

let memoryCatalog = null
let memoryPlan = null

export function clearProtectedCatalogCache() {
  memoryCatalog = null
  memoryPlan = null
}

export default function useProtectedCatalog() {
  const { user, isPro, plan, loading: authLoading } = useAuth()
  const [catalog, setCatalog] = useState(() => (memoryPlan === plan ? memoryCatalog : null))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (authLoading) return undefined
    if (!user || !isPro || !API_URL) {
      clearProtectedCatalogCache()
      setCatalog(null)
      setLoading(false)
      setError(null)
      return undefined
    }
    if (memoryCatalog && memoryPlan === plan) {
      setCatalog(memoryCatalog)
      setLoading(false)
      return undefined
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    ;(async () => {
      const cognitoUser = getCurrentUser()
      const session = await getSession(cognitoUser)
      const token = getIdToken(session)
      const response = await fetch(`${API_URL}/content/catalog`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || `Protected content unavailable (${response.status})`)
      }
      const next = await response.json()
      memoryCatalog = next
      memoryPlan = plan
      setCatalog(next)
    })().catch((err) => {
      if (err?.name !== 'AbortError') {
        clearProtectedCatalogCache()
        setCatalog(null)
        setError(err)
      }
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })

    return () => controller.abort()
  }, [authLoading, isPro, plan, user])

  return { catalog, loading, error }
}
