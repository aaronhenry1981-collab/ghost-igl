import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PRO_CHECKOUT_LINK,
  CHAMPION_CHECKOUT_LINK,
  PRO_CURRENT_AMOUNT,
  CHAMPION_CURRENT_AMOUNT,
  PRO_REGULAR_AMOUNT,
} from '../../config/stripe'
import { isFoundingOpen, FOUNDING_END_SHORT } from '../../config/founding'
import FoundingCountdown from '../FoundingCountdown'
import { track } from '../../utils/analytics'

// Soft-paywall modal for free-tier users who hit the strat-view threshold.
// Doesn't block content — they can dismiss and keep browsing — but escalates
// the upgrade ask each time they trip it (see useFreeStratLimit).

export default function SoftPaywall({ open, viewCount, onDismiss, isAuthed }) {
  const navigate = useNavigate()

  // Track every paywall impression so we can compute open-rate / dismiss-rate
  useEffect(() => {
    if (open) track('Paywall Shown', { viewCount })
  }, [open, viewCount])

  // Lock body scroll while open so the modal feels modal
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Esc to dismiss
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onDismiss])

  if (!open) return null

  function handleSignUp() {
    onDismiss()
    navigate('/auth?redirect=/strats')
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="soft-paywall-title"
      onClick={onDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 540,
          width: '100%',
          background: 'linear-gradient(180deg, #0d1620 0%, #0a1018 100%)',
          border: '1px solid rgba(0, 229, 255, 0.35)',
          borderRadius: 16,
          padding: '1.75rem 1.5rem 1.25rem',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.6)',
          color: 'white',
        }}
      >
        {isFoundingOpen() && (
          <div style={{ marginBottom: 10 }}>
            <FoundingCountdown variant="pill" />
          </div>
        )}

        <h2
          id="soft-paywall-title"
          style={{ fontSize: '1.5rem', margin: '0 0 0.6rem', lineHeight: 1.2 }}
        >
          You've burned through {viewCount} free strats.
        </h2>

        <p style={{ color: 'rgba(255,255,255,0.78)', margin: '0 0 1rem', lineHeight: 1.5 }}>
          {isFoundingOpen() ? (
            <>
              That&rsquo;s the free tier. Lock in <strong>${PRO_CURRENT_AMOUNT}/mo Pro for life</strong> before {FOUNDING_END_SHORT}
              {' '}and you keep that rate for as long as you stay subscribed. After the founding window the rate
              {' '}goes to ${PRO_REGULAR_AMOUNT} for new sign-ups.
            </>
          ) : (
            <>
              That&rsquo;s the free tier. <strong>${PRO_CURRENT_AMOUNT}/mo Pro</strong> unlocks all maps, all sites, ban
              recommendations, enemy intel, and round-by-round VOD breakdowns.
            </>
          )}
        </p>

        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '0 0 1.25rem',
            color: 'rgba(255,255,255,0.85)',
            fontSize: '0.92rem',
            lineHeight: 1.7,
          }}
        >
          <li>&#10003; Every callout + every utility piece per site</li>
          <li>&#10003; The right ban for every map (with reasoning)</li>
          <li>&#10003; What the enemy will most likely do, before round start</li>
          <li>&#10003; Round-by-round VOD breakdowns from your screenshots</li>
          <li>&#10003; 7-day money-back, cancel in one click</li>
        </ul>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a
            href={PRO_CHECKOUT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('Pricing CTA Click', { tier: 'pro', location: 'softpaywall' })}
            className="btn btn-primary"
            style={{ flex: '1 1 auto', minWidth: 200, textAlign: 'center' }}
          >
            Lock in Pro — ${PRO_CURRENT_AMOUNT}/mo
          </a>
          <a
            href={CHAMPION_CHECKOUT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('Pricing CTA Click', { tier: 'champion', location: 'softpaywall' })}
            className="btn btn-outline"
            style={{ flex: '1 1 auto', minWidth: 200, textAlign: 'center', borderColor: 'rgba(0,229,255,0.5)', color: '#00e5ff' }}
          >
            Champion — ${CHAMPION_CURRENT_AMOUNT}/mo
          </a>
        </div>

        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
          }}
        >
          {!isAuthed ? (
            <button
              type="button"
              onClick={handleSignUp}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.7)',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Already have an account? Sign in
            </button>
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.5)' }} />
          )}
          <button
            type="button"
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.55)',
              cursor: 'pointer',
              padding: '6px 8px',
              fontSize: '0.85rem',
            }}
          >
            Keep browsing
          </button>
        </div>
      </div>
    </div>
  )
}
