import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { API_URL } from '../lib/cognito'
import { isFoundingOpen, FOUNDING_END_SHORT } from '../config/founding'
import './ReferralLandingPage.css'

// Referral landing page — /r/:code. Public route, no auth required.
// Fetches the referrer's first name + tier from the public
// /referral/:code endpoint, sets a 30-day cookie with the referrer code,
// and shows a friendly "your friend invited you" CTA that drives signups.

const COOKIE_NAME = 'recon:ref'
const COOKIE_DAYS = 30

function setReferralCookie(code) {
  try {
    const expires = new Date(Date.now() + COOKIE_DAYS * 86400000).toUTCString()
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(code)}; expires=${expires}; path=/; SameSite=Lax`
    // Also stash in localStorage as a backup — some browsers / privacy modes
    // strip cookies more aggressively than they do localStorage.
    try { localStorage.setItem(COOKIE_NAME, code) } catch { /* SSR safe */ }
  } catch { /* no-op */ }
}

export default function ReferralLandingPage() {
  const { code } = useParams()
  const [state, setState] = useState({ loading: true, valid: false, referrerName: '', tier: '' })

  useEffect(() => {
    let cancelled = false
    if (!code) {
      // Terminal no-code state, set once on mount — nothing downstream re-triggers it.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ loading: false, valid: false, referrerName: '', tier: '' })
      return
    }
    // Set the cookie immediately so even users who don't click through
    // get attributed if they sign up later from the same browser session.
    setReferralCookie(code)
    fetch(`${API_URL}/referral/${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setState({
          loading: false,
          valid: !!data.valid,
          referrerName: data.referrer_name || '',
          tier: data.tier || 'free',
        })
      })
      .catch(() => {
        if (cancelled) return
        setState({ loading: false, valid: false, referrerName: '', tier: '' })
      })
    return () => { cancelled = true }
  }, [code])

  if (state.loading) {
    return (
      <div className="ref-landing">
        <p className="ref-loading">Checking invite…</p>
      </div>
    )
  }

  if (!state.valid) {
    return (
      <div className="ref-landing">
        <div className="ref-card">
          <div className="ref-eyebrow">Invite not found</div>
          <h1>That invite code didn’t match anyone.</h1>
          <p>
            The link may be expired or mistyped. You can still sign up directly
            and start a 7-day Pro trial — we just can’t credit a friend.
          </p>
          <div className="ref-cta-row">
            <Link to="/auth?mode=signup" className="btn btn-primary btn-lg">Sign up — free</Link>
            <Link to="/" className="btn btn-ghost btn-lg">Back to home</Link>
          </div>
        </div>
      </div>
    )
  }

  const tierLabel =
    state.tier === 'champion' ? 'Champion' :
    state.tier === 'pro' ? 'Pro' :
    'Recon 6'

  return (
    <div className="ref-landing">
      <div className="ref-card">
        <div className="ref-eyebrow">Friend invite</div>
        <h1>
          <span className="ref-name">{state.referrerName}</span> invited you to <span className="ref-accent">Recon 6</span>.
        </h1>
        <p className="ref-lead">
          {state.referrerName} is a {tierLabel} subscriber and thinks you’d climb
          faster with Recon 6. Sign up now and you get a free 7-day Pro trial —
          no credit card. {state.referrerName} gets credit toward their next free month
          when 3 friends stay subscribed.
        </p>

        <ul className="ref-perks">
          <li>
            <span className="ref-check">&#10003;</span>
            <strong>Free 7-day Pro trial</strong> — round-by-round VOD breakdowns, ban intel, opponent reads
          </li>
          <li>
            <span className="ref-check">&#10003;</span>
            <strong>Strats, loadouts, match prep</strong> across all 20 supported games
          </li>
          <li>
            <span className="ref-check">&#10003;</span>
            <strong>No credit card to start</strong>. Cancel in one click if it’s not for you.
          </li>
          {isFoundingOpen() && (
            <li>
              <span className="ref-check">&#10003;</span>
              <strong>Founding rate locked for life</strong> if you subscribe before {FOUNDING_END_SHORT}
            </li>
          )}
        </ul>

        <div className="ref-cta-row">
          <Link to="/auth?mode=signup" className="btn btn-primary btn-lg">
            Start free trial →
          </Link>
          <Link to="/strats" className="btn btn-ghost btn-lg">
            Browse the strats first
          </Link>
        </div>

        <div className="ref-foot">
          <p>
            How the referral works: {state.referrerName} earns a free month when 3 of their referrals
            stay subscribed for 30+ days. You don’t pay anything extra — they just get
            credit for bringing you in. Honest, simple, no spam.
          </p>
        </div>
      </div>
    </div>
  )
}
