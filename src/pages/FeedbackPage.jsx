import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'
import './FeedbackPage.css'

const CATEGORIES = [
  ['game-plan', 'Road to Champion plan'],
  ['live-coach', 'Live Match Coach'],
  ['round-review', 'Round Review'],
  ['account', 'Account or sign-in'],
  ['billing', 'Billing'],
  ['other', 'Something else'],
]

export default function FeedbackPage() {
  const { user, loading } = useAuth()
  const [searchParams] = useSearchParams()
  const [category, setCategory] = useState(searchParams.get('about') || 'game-plan')
  const [rating, setRating] = useState(null)
  const [message, setMessage] = useState('')
  const [state, setState] = useState('idle')
  const [error, setError] = useState(null)

  async function submit(event) {
    event.preventDefault()
    setState('sending')
    setError(null)
    try {
      const cognitoUser = getCurrentUser()
      if (!cognitoUser) throw new Error('Please sign in before sending feedback.')
      const session = await getSession(cognitoUser)
      const token = getIdToken(session)
      const res = await fetch(`${API_URL}/me/feedback`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, rating, message, page: searchParams.get('from') || '/feedback' }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Feedback could not be sent.')
      setState('sent')
      setMessage('')
    } catch (err) {
      setState('idle')
      setError(err.message)
    }
  }

  if (loading) return <main className="feedback-shell"><div className="feedback-card">Loading…</div></main>
  if (!user) {
    return (
      <main className="feedback-shell">
        <section className="feedback-card feedback-signin">
          <span className="feedback-eyebrow">Player feedback</span>
          <h1>Tell us what slowed you down.</h1>
          <p>Sign in so we can connect the report to the right account and follow up with a real fix.</p>
          <Link className="btn btn-primary" to="/auth?redirect=/feedback">Sign in to leave feedback</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="feedback-shell">
      <header className="feedback-hero">
        <span className="feedback-eyebrow">Player feedback</span>
        <h1>What got in the way?</h1>
        <p>Short and specific wins. Tell us what you expected, what happened, and what would make the next match easier.</p>
      </header>

      <form className="feedback-card" onSubmit={submit}>
        <label>
          What is this about?
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>

        <fieldset>
          <legend>How useful was it?</legend>
          <div className="feedback-rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={rating === value ? 'active' : ''}
                aria-pressed={rating === value}
                onClick={() => setRating(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <small>1 = blocked me · 5 = nailed it</small>
        </fieldset>

        <label>
          What happened?
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            minLength={10}
            maxLength={2000}
            rows={7}
            required
            placeholder="Example: After Round Review found a drone problem, Road to Champion kept showing my old utility mission."
          />
        </label>
        <small className="feedback-safety">Do not include passwords, card numbers, or private game/account codes.</small>

        {error && <div className="feedback-error" role="alert">{error}</div>}
        {state === 'sent' && <div className="feedback-success" role="status">Feedback received. It is now in the Recon 6 admin queue.</div>}
        <button className="btn btn-primary" type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Send feedback'}
        </button>
      </form>
    </main>
  )
}
