import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../../lib/cognito'
import './ReferralsWidget.css'

// Dashboard widget that surfaces the referral program. Reads
// /me/referrals and renders the hybrid-program state — different copy
// for founding-window users (any tier earns) vs post-launch
// (Champion+ only). Goal: every paid sub sees their share link, their
// progress toward the free month, and the right urgency framing for
// their situation.

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }).catch(() => {})
  }
  return (
    <button type="button" className="ref-widget-copy" onClick={copy}>
      {copied ? 'Copied' : 'Copy link'}
    </button>
  )
}

export default function ReferralsWidget() {
  const { user, isPro, isAdmin, plan } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      try {
        const cognitoUser = getCurrentUser()
        if (!cognitoUser) return
        const session = await getSession(cognitoUser)
        const token = getIdToken(session)
        const res = await fetch(`${API_URL}/me/referrals`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('referrals fetch failed')
        const json = await res.json()
        if (cancelled) return
        setData(json)
      } catch (err) {
        if (cancelled) return
        setError(err.message)
      } finally {
        if (cancelled) return
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user])

  if (!user) return null
  if (loading) {
    return (
      <section className="ref-widget skeleton-card">
        <div className="skeleton skeleton-line title" />
        <div className="skeleton skeleton-line medium" />
        <div className="skeleton skeleton-line short" />
      </section>
    )
  }
  if (error || !data) return null

  const {
    code, share_url, same_tier_active = 0, same_tier_pending = 0,
    qualifies_for_comp = false, eligible_to_earn = false,
    is_founding_referrer = false, founding_window_open = false,
    founding_days_left = 0,
  } = data

  const progress = Math.min(same_tier_active, 3)
  const isFree = !isPro && !isAdmin
  // Decide which header / urgency banner to show:
  //   1. Comp this cycle → green "month's on us"
  //   2. Qualifies (3+ active) but no cron run yet → green "you've earned it"
  //   3. Founding referrer + still in window → "founding referrer" badge
  //   4. Founding window open, not yet a paid sub → "join now to lock in"
  //   5. Post-launch, not eligible → quiet upgrade prompt
  //   6. Otherwise → standard progress
  let banner = null
  if (qualifies_for_comp) {
    banner = { tone: 'success', label: 'Free month earned', text: 'Your next bill is on us. The credit applies automatically.' }
  } else if (is_founding_referrer && founding_window_open) {
    banner = { tone: 'accent', label: 'Founding referrer · locked for life', text: 'You’re grandfathered into the referral program at your current tier forever — even after it restricts to Champion+ only.' }
  } else if (is_founding_referrer && !founding_window_open) {
    banner = { tone: 'accent', label: 'Founding referrer · locked in', text: 'You earn at your current tier forever. New referrers since launch need Champion+ to qualify.' }
  } else if (founding_window_open && isFree) {
    banner = { tone: 'gold', label: `Founding window: ${founding_days_left} day${founding_days_left === 1 ? '' : 's'} left`, text: `Subscribe to any paid tier before the window closes and you keep the referral benefit at that tier — forever.` }
  } else if (founding_window_open && isPro) {
    banner = { tone: 'accent', label: `Founding window: ${founding_days_left} day${founding_days_left === 1 ? '' : 's'} left`, text: 'Refer 3 friends before the window closes to lock in the program at your current tier forever.' }
  } else if (!eligible_to_earn) {
    banner = { tone: 'muted', label: 'Champion+ only', text: 'The post-launch referral program is exclusive to Champion+ All-Access subscribers. Upgrade to start earning.' }
  }

  return (
    <section className="ref-widget">
      <header className="ref-widget-head">
        <div>
          <div className="ref-widget-eyebrow">Refer + earn</div>
          <h2 className="ref-widget-title">Refer 3 friends. Get a free month.</h2>
        </div>
      </header>

      {banner && (
        <div className={`ref-widget-banner ref-widget-banner-${banner.tone}`}>
          <strong>{banner.label}</strong>
          <p>{banner.text}</p>
        </div>
      )}

      <div className="ref-widget-share">
        <div className="ref-widget-share-label">Your invite link</div>
        <div className="ref-widget-share-link">
          <code>{share_url}</code>
          <CopyButton value={share_url} />
        </div>
      </div>

      {/* Progress ring — 3 segments, filled by referral count. */}
      <div className="ref-widget-progress">
        <div className="ref-widget-progress-label">
          Active referrals at your tier
          <span className="ref-widget-progress-count">{progress}<span>/ 3</span></span>
        </div>
        <div className="ref-widget-progress-bar" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`ref-widget-progress-seg${i < progress ? ' filled' : ''}`} />
          ))}
        </div>
        {same_tier_pending > 0 && (
          <div className="ref-widget-progress-sub">
            +{same_tier_pending} pending (in the 30-day clearance window)
          </div>
        )}
      </div>

      <div className="ref-widget-cta">
        {!isPro && !isAdmin ? (
          <Link to="/#pricing" className="btn btn-primary btn-sm">Subscribe to start earning</Link>
        ) : (
          <Link to="/account" className="btn btn-outline btn-sm">View referrals on Account</Link>
        )}
        <span className="ref-widget-code">
          Code: <code>{code}</code>
        </span>
      </div>
    </section>
  )
}
