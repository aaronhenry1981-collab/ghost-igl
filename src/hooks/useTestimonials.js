import { useState, useEffect, useCallback } from 'react'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'

// Testimonials backed by ghost-igl-testimonials DynamoDB table.
//
// Public reads hit /testimonials (no auth) — used by the landing page so
// real visitors see actual social proof. Admin writes hit /admin/testimonials
// with a Cognito JWT — used by the TestimonialBuilder admin component.
//
// Migrated from localStorage on 2026-05-09. Old localStorage entries (key
// 'ghost-igl:testimonials') are abandoned — they only ever showed in the
// admin's own browser anyway, so nothing visitor-facing is lost.
//
// Returns:
//   visible      array — what the landing page should display
//                (sorted: featured first, then newest)
//   list         array — same data; admin alias for clarity
//   loading      bool — true during initial fetch
//   error        string|null — fetch error if any
//   add(entry)   async — POST a new testimonial (admin only)
//   remove(id)   async — DELETE a testimonial by id (admin only)
//   refresh()    async — re-fetch from API (called automatically after writes)

async function authedFetch(path, opts = {}) {
  const cognitoUser = getCurrentUser()
  if (!cognitoUser) throw new Error('Not signed in')
  const session = await getSession(cognitoUser)
  const token = getIdToken(session)
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
  return data
}

// gameId scopes what `visible` returns. Testimonials without a game_id are
// treated as R6 — every existing entry (the founder review) is R6-specific,
// and showing a "Bronze to Silver" R6 quote on the NBA 2K or SF6 dashboard
// reads as templated/fake, which is worse than showing nothing. `list` stays
// unfiltered for the admin builder.
export function useTestimonials(gameId = 'r6') {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/testimonials`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setList(Array.isArray(data?.testimonials) ? data.testimonials : [])
      setError(null)
    } catch (err) {
      // Soft-fail: empty array, log the error. Landing page hides the
      // testimonials section when list is empty (already conditional), so
      // a fetch failure just means visitors see no testimonials section —
      // never a broken UI.
      console.warn('Testimonials fetch failed:', err.message)
      setList([])
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const add = useCallback(async (entry) => {
    const data = await authedFetch('/admin/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
    await refresh()
    return data
  }, [refresh])

  const remove = useCallback(async (id) => {
    await authedFetch(`/admin/testimonials/${encodeURIComponent(id)}`, { method: 'DELETE' })
    await refresh()
  }, [refresh])

  const visible = list.filter((t) => (t.game_id || 'r6') === (gameId || 'r6'))
  return { visible, list, loading, error, add, remove, refresh }
}
