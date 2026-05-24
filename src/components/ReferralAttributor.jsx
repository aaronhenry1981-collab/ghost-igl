import { useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'

// On sign-in, check for a referral cookie/localStorage entry and POST it
// to /me/referral-attribution so the backend can attach the referrer to
// this user's profile. Idempotent — backend uses first-touch wins, and
// this component clears the cookie after a successful attribution so
// it doesn't keep trying.
//
// Mount once inside Layout. No UI.

const COOKIE_NAME = 'recon:ref'

function readReferralCode() {
  // Check both cookie + localStorage. Different browsers / private modes
  // handle them differently — having both as fallback maximizes capture.
  try {
    const ls = localStorage.getItem(COOKIE_NAME)
    if (ls) return ls
  } catch { /* ignore */ }
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME.replace(/[.+]/g, '\\$&')}=([^;]+)`))
    if (match) return decodeURIComponent(match[1])
  } catch { /* ignore */ }
  return null
}

function clearReferralCode() {
  try { localStorage.removeItem(COOKIE_NAME) } catch { /* ignore */ }
  try {
    // Expire the cookie by setting an expired date
    document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`
  } catch { /* ignore */ }
}

export default function ReferralAttributor() {
  const { user, loading } = useAuth()
  const attemptedRef = useRef(false)

  useEffect(() => {
    if (loading || !user) return
    if (attemptedRef.current) return
    const code = readReferralCode()
    if (!code) return
    attemptedRef.current = true

    ;(async () => {
      try {
        const cognitoUser = getCurrentUser()
        if (!cognitoUser) return
        const session = await getSession(cognitoUser)
        const token = getIdToken(session)
        const res = await fetch(`${API_URL}/me/referral-attribution`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        })
        if (res.ok) {
          // Attribution recorded (or already existed) — clear cookie so
          // we don't re-fire on every page navigation.
          clearReferralCode()
        }
      } catch {
        // Silent failure — referral isn't critical to the user's experience.
        // We just lose attribution credit. Don't block sign-in flow on this.
      }
    })()
  }, [user, loading])

  return null
}
