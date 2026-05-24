import { useState, useEffect, useCallback } from 'react'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'

// Demo video singleton — backed by /demo-video API endpoint (DDB row stored
// in the testimonials table with a special id). Migrated from localStorage
// on 2026-05-10 so visitors actually see the video instead of just the admin.

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

// Accepts a YouTube, YouTube short, or Twitch VOD URL and returns a standard
// embed URL + a provider label. Returns null if the URL isn't recognized.
export function parseVideoUrl(raw) {
  if (!raw || typeof raw !== 'string') return null
  const url = raw.trim()
  const ytMatch =
    url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/) ||
    url.match(/youtube\.com\/watch\?.*[?&]v=([A-Za-z0-9_-]{6,})/)
  if (ytMatch) {
    return { provider: 'YouTube', embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`, id: ytMatch[1] }
  }
  const twMatch = url.match(/twitch\.tv\/videos\/(\d{4,})/)
  if (twMatch) {
    const parent = (typeof window !== 'undefined' && window.location.hostname) || 'r6coaching.com'
    return {
      provider: 'Twitch',
      embedUrl: `https://player.twitch.tv/?video=${twMatch[1]}&parent=${parent}&autoplay=false`,
      id: twMatch[1],
    }
  }
  return null
}

export function useDemoVideo() {
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/demo-video`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      // Reconstruct the embed metadata from the raw URL on every fetch so
      // the consumer always gets a parsed shape rather than just a URL string.
      if (data?.video?.url) {
        const parsed = parseVideoUrl(data.video.url)
        setVideo(parsed ? { ...parsed, url: data.video.url, title: data.video.title || null } : null)
      } else {
        setVideo(null)
      }
      setError(null)
    } catch (err) {
      // Soft-fail — landing page just hides the video section if null.
      console.warn('Demo video fetch failed:', err.message)
      setVideo(null)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const save = useCallback(async (entry) => {
    // entry is the raw URL or a parsed video object. Backend stores the
    // raw URL only; the frontend re-parses on read.
    const url = typeof entry === 'string' ? entry : entry?.url
    const title = typeof entry === 'object' ? entry?.title : null
    if (!url) throw new Error('URL required')
    await authedFetch('/admin/demo-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, title }),
    })
    await refresh()
  }, [refresh])

  const clear = useCallback(async () => {
    await authedFetch('/admin/demo-video', { method: 'DELETE' })
    await refresh()
  }, [refresh])

  return { video, loading, error, save, clear }
}
