import { useState, useMemo, useCallback } from 'react'
import './DailyPlaybook.css'

// Daily Playbook — the customer-acquisition checklist, pinned at the top
// of the admin dashboard so Aaron sees it every time he opens admin (which
// the routine itself tells him to do for the daily pulse check).
//
// Why a streak counter: the entire value of this routine is CONSISTENCY.
// Customer acquisition for a no-audience SaaS compounds only if the daily
// habit is unbroken. A visible streak turns "should I do this today?" into
// "I don't want to break my streak" — the same loop that makes habit apps
// work. All state is localStorage — no backend, no auth round-trip.

const LS = {
  dayPrefix: 'recon6-playbook-',          // + YYYY-MM-DD → JSON array of checked ids
  streak: 'recon6-playbook-streak',       // integer
  lastComplete: 'recon6-playbook-last-complete', // YYYY-MM-DD of last fully-done day
}

// The Daily 35 — 4 items. Keep this list SHORT. The whole point is that
// it's small enough to never feel like a burden.
const ITEMS = [
  {
    id: 'reddit-comments',
    label: 'Post 2-3 helpful Reddit comments',
    hint: 'From the digest. Prioritise r/OverwatchUniversity + r/SiegeAcademy. Stop at 3 — more looks spammy.',
    link: 'https://r6coaching.com/reddit-digest/latest.html',
    linkLabel: 'Open digest →',
    minutes: 20,
  },
  {
    id: 'reddit-replies',
    label: 'Reply to anyone who responded to you',
    hint: 'Use the "Recon6 - Draft Reddit Reply" desktop shortcut. Highlight thread → Ctrl+C → double-click.',
    link: 'https://www.reddit.com/message/inbox/',
    linkLabel: 'Open Reddit inbox →',
    minutes: 5,
  },
  {
    id: 'pulse',
    label: 'Pulse check — review new signups + VOD activity',
    hint: "You're already on the admin page — scroll to the user table. Looking for the trend, not perfection.",
    link: null,
    minutes: 5,
  },
  {
    id: 'one-post',
    label: 'One post elsewhere — Twitter / Discord / YouTube comment',
    hint: 'Rotate it: a tactical tip on X, a Stadium build in Discord, or a genuine comment on an R6/OW2 video.',
    link: null,
    minutes: 10,
  },
]

function todayStr(d = new Date()) {
  // Local-time YYYY-MM-DD (not UTC — the routine is a local-day habit)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return todayStr(d)
}

function readChecked(day) {
  try {
    return new Set(JSON.parse(localStorage.getItem(LS.dayPrefix + day) || '[]'))
  } catch {
    return new Set()
  }
}

export default function DailyPlaybook() {
  const today = useMemo(() => todayStr(), [])
  const [checked, setChecked] = useState(() => readChecked(today))

  // Streak: stored integer, but only "valid" if last completion was today
  // or yesterday. If the last complete day is older, the chain is broken
  // and the displayed streak is 0 until today is completed.
  const [streak, setStreak] = useState(() => {
    // Defensive: localStorage can throw in private-browsing / sandboxed
    // contexts. Never let this crash the admin page.
    try {
      const stored = parseInt(localStorage.getItem(LS.streak) || '0', 10)
      const last = localStorage.getItem(LS.lastComplete)
      if (last === today || last === yesterdayStr()) return stored
      return 0 // chain broken
    } catch {
      return 0
    }
  })

  const allDone = checked.size === ITEMS.length

  const toggle = useCallback((id) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        localStorage.setItem(LS.dayPrefix + today, JSON.stringify([...next]))
        // Streak bookkeeping — only fires the moment the day FIRST becomes
        // complete. lastComplete === today guards against double-counting.
        if (next.size === ITEMS.length) {
          const last = localStorage.getItem(LS.lastComplete)
          if (last !== today) {
            const stored = parseInt(localStorage.getItem(LS.streak) || '0', 10)
            const newStreak = last === yesterdayStr() ? stored + 1 : 1
            localStorage.setItem(LS.streak, String(newStreak))
            localStorage.setItem(LS.lastComplete, today)
            setStreak(newStreak)
          }
        }
      } catch {
        // Storage unavailable — checklist still works for this session,
        // just won't persist. Better than crashing the page.
      }
      return next
    })
  }, [today])

  const totalMinutes = ITEMS.reduce((sum, it) => sum + it.minutes, 0)
  const doneMinutes = ITEMS.filter((it) => checked.has(it.id)).reduce((s, it) => s + it.minutes, 0)

  return (
    <section className="playbook">
      <div className="playbook-head">
        <div>
          <h2>Today's Playbook <span className="playbook-date">{today}</span></h2>
          <p className="playbook-sub">
            The Daily 35 — customer acquisition compounds only if this stays unbroken.
          </p>
        </div>
        <div className={`playbook-streak${streak >= 3 ? ' hot' : ''}`}>
          <span className="playbook-streak-num">{streak}</span>
          <span className="playbook-streak-label">day{streak === 1 ? '' : 's'}{streak >= 3 ? ' 🔥' : ''}</span>
        </div>
      </div>

      <div className="playbook-progress">
        <div className="playbook-progress-bar">
          <div
            className="playbook-progress-fill"
            style={{ width: `${(checked.size / ITEMS.length) * 100}%` }}
          />
        </div>
        <span className="playbook-progress-text">
          {checked.size}/{ITEMS.length} done · ~{totalMinutes - doneMinutes} min left
        </span>
      </div>

      <ul className="playbook-list">
        {ITEMS.map((it) => {
          const done = checked.has(it.id)
          return (
            <li key={it.id} className={`playbook-item${done ? ' done' : ''}`}>
              <button
                type="button"
                className="playbook-check"
                onClick={() => toggle(it.id)}
                aria-pressed={done}
                aria-label={done ? `Mark "${it.label}" not done` : `Mark "${it.label}" done`}
              >
                {done ? '✓' : ''}
              </button>
              <div className="playbook-item-body">
                <div className="playbook-item-label">
                  {it.label}
                  <span className="playbook-item-mins">{it.minutes}m</span>
                </div>
                <div className="playbook-item-hint">{it.hint}</div>
                {it.link && (
                  <a href={it.link} target="_blank" rel="noopener noreferrer" className="playbook-item-link">
                    {it.linkLabel}
                  </a>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {allDone ? (
        <div className="playbook-done-banner">
          ✅ Daily 35 complete. Streak: {streak} day{streak === 1 ? '' : 's'}.
          Close the laptop — you did the work today.
        </div>
      ) : (
        <div className="playbook-foot-note">
          Do this every day — especially when it feels pointless. Weeks 1-4 produce
          almost nothing visible; the reputation you build then is what converts in weeks 8-12.
        </div>
      )}
    </section>
  )
}
