import { useState } from 'react'

export default function EmailCapture() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null) // null | 'sending' | 'success' | 'error'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('sending')
    try {
      // Store email in localStorage as backup + send to formspree
      const stored = JSON.parse(localStorage.getItem('ghost_emails') || '[]')
      stored.push({ email: email.trim(), date: new Date().toISOString() })
      localStorage.setItem('ghost_emails', JSON.stringify(stored))

      const res = await fetch('https://formspree.io/f/mykbrrob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!res.ok) throw new Error('Failed')

      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="email-capture success">
        <span className="email-capture-icon">{'\u2705'}</span>
        <p><strong>You're in.</strong> Weekly strats and patch updates incoming.</p>
      </div>
    )
  }

  return (
    <form className="email-capture" onSubmit={handleSubmit}>
      <div className="email-capture-text">
        <span className="email-capture-icon">{'\uD83D\uDCE7'}</span>
        <div>
          <strong>Get weekly strats + patch updates free</strong>
          <p>Meta shifts, new operator guides, and pro tips delivered to your inbox.</p>
        </div>
      </div>
      <div className="email-capture-form">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="email-capture-input"
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending...' : 'Subscribe'}
        </button>
      </div>
      {status === 'error' && <p className="email-capture-error">Something went wrong. Try again.</p>}
    </form>
  )
}
