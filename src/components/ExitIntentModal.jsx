import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const SEEN_KEY = 'ghost-igl:exit-intent-seen'
const EXIT_DELAY_MS = 400

// Reasonable touch detection — skip the mouseleave trigger on touch-primary
// devices since there's no "leaving the viewport with a mouse" concept there.
function isTouchDevice() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(hover: none) and (pointer: coarse)').matches ?? false
}

function wasSeenRecently() {
  try {
    const ts = localStorage.getItem(SEEN_KEY)
    if (!ts) return false
    const ageMs = Date.now() - Number(ts)
    // Don't show again for 30 days
    return ageMs < 30 * 24 * 60 * 60 * 1000
  } catch {
    return true // storage error → treat as seen, never bug the user
  }
}

function markSeen() {
  try { localStorage.setItem(SEEN_KEY, String(Date.now())) } catch { /* no-op */ }
}

export default function ExitIntentModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (wasSeenRecently()) return
    if (isTouchDevice()) return

    let armed = false
    // Arm only after the user has been on page at least 8s AND scrolled down a bit.
    // Prevents firing on immediate bounce (feels spammy).
    const armTimer = setTimeout(() => { armed = true }, 8000)

    function handleMouseLeave(e) {
      if (!armed) return
      // Fire only when the mouse leaves the top edge (tab-switching or URL-bar targeting)
      if (e.clientY > 20) return
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          setOpen(true)
          markSeen()
          document.removeEventListener('mouseleave', handleMouseLeave)
        }
      }, EXIT_DELAY_MS)
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      clearTimeout(armTimer)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    // Lock body scroll
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <div className="exit-intent-overlay" onClick={() => setOpen(false)}>
      <div
        className="exit-intent-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Before you go"
      >
        <button onClick={() => setOpen(false)} className="exit-intent-close" aria-label="Close">×</button>
        <div className="exit-intent-kicker">Before you go</div>
        <h2>
          Grab a <span className="gradient-text">free map guide</span>.
          No signup, no email.
        </h2>
        <p>
          Full strat breakdowns for every R6 ranked site — operator picks, callouts,
          utility, and ban recs. Pick one to open now:
        </p>
        <div className="exit-intent-guides">
          <a href="/guides/bank.html" className="exit-intent-guide">
            <strong>Bank</strong>
            <span>4 sites · 2F CEO, 1F Tellers, B Lockers…</span>
          </a>
          <a href="/guides/clubhouse.html" className="exit-intent-guide">
            <strong>Clubhouse</strong>
            <span>4 sites · Cash, Bar, Church, Gym</span>
          </a>
          <a href="/guides/coastline.html" className="exit-intent-guide">
            <strong>Coastline</strong>
            <span>4 sites · Hookah, Theater, Kitchen, Blue Bar</span>
          </a>
        </div>
        <div className="exit-intent-cta-row">
          <a href="/guides/" className="btn btn-primary btn-sm">See every R6 map guide</a>
          <Link to="/strats" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
            Or open the interactive tool
          </Link>
        </div>
        <p className="exit-intent-footnote">
          We don’t use exit-intent to harvest emails. Just so you don’t miss what’s free.
        </p>
      </div>
    </div>
  )
}
