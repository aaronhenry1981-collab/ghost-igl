import { useState, useEffect } from 'react'
import { API_URL } from '../lib/cognito'
import './AnnouncementBanner.css'

const DISMISSED_KEY = 'ghost-igl-dismissed-announcements'

function getDismissed() {
  try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')) }
  catch { return new Set() }
}

function markDismissed(id) {
  const set = getDismissed()
  set.add(id)
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]))
}

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([])
  const [dismissed, setDismissed] = useState(() => getDismissed())

  useEffect(() => {
    if (!API_URL) return
    fetch(`${API_URL}/announcements`)
      .then((r) => (r.ok ? r.json() : { announcements: [] }))
      .then((d) => setAnnouncements(d.announcements || []))
      .catch(() => {})
  }, [])

  function dismiss(id) {
    markDismissed(id)
    setDismissed(new Set([...dismissed, id]))
  }

  const visible = announcements.filter((a) => !dismissed.has(a.id))
  if (visible.length === 0) return null

  return (
    <div className="announcement-stack">
      {visible.map((a) => (
        <div key={a.id} className={`announcement announcement-${a.level || 'info'}`}>
          <div className="announcement-body">
            <div className="announcement-title">{a.title}</div>
            <div className="announcement-message">{a.message}</div>
          </div>
          <button
            onClick={() => dismiss(a.id)}
            className="announcement-close"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
