import { useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'
import { getRefSource, clearRefSource } from '../lib/refSource'

// On sign-in, check for a referral cookie/localStorage entry and POST it
// to /me/referral-attribution so the backend can attach the referrer to
// this user's profile. Idempotent — backend uses first-touch wins, and
// this component clears the cookie after a successful attribution so
// it doesn't keep trying.
//
// Also attaches ?ref= channel attribution (recon:src, see lib/refSource.js)
// to the profile's referral_source field for signed-in users who never had
// one — covers users who skip the profile-setup modal where the field is
// normally collected. Profile-modal answers win: we only write when the
// profile has no referral_source yet.
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
  const { user, loading, profile } = useAuth()
  const attemptedRef = useRef(false)
  const attemptedSrc = useRef(false)

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

  // Channel attribution — one-shot PUT of the stored ?ref= source onto the
  // profile. Waits for the profile to load so we can honor first-touch: a
  // profile that already has a referral_source (from the setup modal or a
  // prior visit) is never overwritten.
  useEffect(() => {
    if (loading || !user || !profile) return
    if (attemptedSrc.current) return
    const src = getRefSource()
    if (!src) return
    if (profile.referral_source) {
      // Already attributed — stale local value, stop carrying it around.
      clearRefSource()
      return
    }
    attemptedSrc.current = true

    ;(async () => {
      try {
        const cognitoUser = getCurrentUser()
        if (!cognitoUser) return
        const session = await getSession(cognitoUser)
        const token = getIdToken(session)
        const res = await fetch(`${API_URL}/me`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ referral_source: src }),
        })
        if (res.ok) clearRefSource()
      } catch {
        // Silent — attribution is nice-to-have, never block the session.
      }
    })()
  }, [user, loading, profile])

  return null
}
