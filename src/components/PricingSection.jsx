import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { AI_USAGE_PACK_AMOUNT } from '../config/stripe'
import { isFoundingOpen } from '../config/founding'
import { FREE_MAP_NAMES, PLAN_FACTS } from '../config/planFacts'
import { useAuth } from '../hooks/useAuth'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'
import { track } from '../utils/analytics'
import FoundingCountdown from './FoundingCountdown'
import MembershipCheckoutButton from './MembershipCheckoutButton'

// The membership plans, shared by the home page (#pricing) and /pricing.
// Prices and allowances come from planFacts. The 1-on-1 rate is the $40
// single session sold on /coaching/ (config/stripe.js COACHING_SINGLE_PRICE_ID).
const COACHING_SINGLE_SESSION_USD = 40

// Opens Stripe's customer portal via a freshly-created session. Never fall back to
// a hardcoded portal URL — portal session IDs change and static URLs 404.
async function openStripePortal() {
  const cognitoUser = getCurrentUser()
  if (!cognitoUser) throw new Error('Not signed in')
  const session = await getSession(cognitoUser)
  const token = getIdToken(session)
  const res = await fetch(`${API_URL}/me/billing-portal`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Could not open billing portal (HTTP ${res.status})`)
  }
  const data = await res.json()
  if (!data.url) throw new Error('Billing portal returned no URL')
  window.location.href = data.url
}

// Founding-member pricing active through May 31, 2026 (extended from May 8
// while the desktop app finishes). After this date payment links swap to the
// regular-price Stripe price IDs and the `price` / `regularPrice` fields flip
// (regular becomes current). Existing subscribers stay locked in at the
// founding rate — that's the promise.
// Pricing copy is intentionally explicit about what each tier ADDS vs the
// previous one. Reviewers and visitors should be able to read the cards and
// know in 5 seconds why they'd pay more. "Everything in Pro / Recruit"
// language anchors the comparison.
const PRICING = [
  {
    tier: 'Basic',
    tierKey: 'free',
    audience: `For trying Recon 6 on ${FREE_MAP_NAMES}`,
    price: 'Free',
    period: '',
    desc: 'Free Bank and Coastline strategy previews, plus the operator catalog.',
    link: '/auth?mode=signup&redirect=%2Fstrats',
    features: [
      'Bank and Coastline sample maps with basic attack and defense plans',
      'Operator lineups and role guidance',
      'Map, site, and key-callout reference',
      'No paid AI usage required',
      'Upgrade only when you want analysis or live tools',
    ],
  },
  {
    tier: 'Pro',
    tierKey: 'pro',
    audience: 'For the solo ranked grinder',
    price: '$9',
    regularPrice: '$12',
    period: '/mo',
    desc: 'Advanced strategies, AI analysis, and the optional PC Live Coach.',
    anchor: `Less than one 1-on-1 session ($${COACHING_SINGLE_SESSION_USD}) — and it coaches every round.`,
    founding: true,
    featured: true,
    trialDays: 0,
    features: [
      'Paid membership — billing starts at checkout',
      'Everything in Basic',
      '+ Advanced Pro strategies and utility plans',
      '+ AI VOD breakdowns tied to your screenshots',
      '+ 20 VOD review sessions each month',
      '+ Recon 6 Command desktop coach for Windows',
      '+ Match prep scaled to solo, duo, or full stack',
      '+ Website AI hard limit — no surprise overage charges',
    ],
  },
  {
    tier: 'Elite',
    tierKey: 'elite',
    audience: 'For players who review their matches every week',
    price: '$39',
    period: '/mo',
    desc: 'The full self-service coaching system for players who use Recon 6 every week.',
    advanced: true,
    features: [
      'Everything in Pro',
      '+ Champion-level strategy library and premium tactics',
      '+ 60 VOD review sessions each month',
      '+ Up to 10 screenshots in one multi-round review',
      '+ Recurring-mistake reports and weekly practice goals',
      '+ Recon 6 Command desktop coach for Windows',
      '+ Website AI hard limit — no surprise overage charges',
    ],
  },
  {
    tier: 'Champion',
    tierKey: 'champion',
    audience: 'For players who want live coaching with Aaron',
    price: '$70',
    period: '/mo',
    desc: 'High-touch coaching: everything in Elite plus two live sessions with Aaron every month.',
    cta: 'Start Champion membership',
    advanced: true,
    features: [
      'Everything in Elite',
      '+ 75 VOD review sessions each month',
      '+ Two live 1:1 coaching sessions each month',
      '+ Aaron can use Recon 6 as a private assistant while watching you play',
      '+ Session findings carried into your next practice goal',
      '+ Sessions do not roll over; cancel at the end of the billing period',
      '+ One lifetime no-show waiver',
    ],
  },
]

const { pro: PRO, elite: ELITE, champion: CHAMPION } = PLAN_FACTS
const usd = (n) => `$${n}`
const audienceFor = (tierKey) => PRICING.find((p) => p.tierKey === tierKey).audience

// Shown while the Elite and Champion cards are collapsed, so their prices and
// what they add never hide behind the toggle.
const UPPER_TIERS = [
  {
    key: 'elite',
    name: 'Elite',
    price: usd(ELITE.monthlyUsd),
    audience: audienceFor('elite'),
    delta: `Everything in Pro, ${ELITE.aiReviewsPerMonth / PRO.aiReviewsPerMonth}× the VOD reviews (${ELITE.aiReviewsPerMonth} a month), up to ${ELITE.screenshotsPerReview} screenshots per review, and premium tactics.`,
  },
  {
    key: 'champion',
    name: 'Champion',
    price: usd(CHAMPION.monthlyUsd),
    audience: audienceFor('champion'),
    delta: `Everything in Elite, ${CHAMPION.aiReviewsPerMonth} VOD reviews a month, and ${CHAMPION.liveSessionsPerMonth} live 1:1 coaching sessions with Aaron every month.`,
  },
]

const COMPARE_PLANS = ['Basic', 'Pro', 'Elite', 'Champion']
const COMPARE_ROWS = [
  ['Price', 'Free', `${usd(PRO.monthlyUsd)}/mo`, `${usd(ELITE.monthlyUsd)}/mo`, `${usd(CHAMPION.monthlyUsd)}/mo`],
  ['Strategy plans', `${FREE_MAP_NAMES} samples`, 'Advanced Pro strategies', '+ premium tactics', 'Everything in Elite'],
  ['AI VOD reviews a month', '—', PRO.aiReviewsPerMonth, ELITE.aiReviewsPerMonth, CHAMPION.aiReviewsPerMonth],
  ['Screenshots per review', '—', PRO.screenshotsPerReview, ELITE.screenshotsPerReview, CHAMPION.screenshotsPerReview],
  ['Recon 6 Command desktop coach (Windows)', '—', 'Included', 'Included', 'Included'],
  ['Recurring-mistake reports and weekly practice goals', '—', '—', 'Included', 'Included'],
  ['Live 1:1 coaching sessions with Aaron', '—', '—', '—', `${CHAMPION.liveSessionsPerMonth} a month`],
]

export default function PricingSection({ externalError = null }) {
  const { user, isPro, plan } = useAuth()
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState(null)
  const [checkoutError, setCheckoutError] = useState(null)
  const [showAdvancedPlans, setShowAdvancedPlans] = useState(false)

  const handleManageSubscription = useCallback(async () => {
    setPortalLoading(true)
    setPortalError(null)
    try {
      await openStripePortal()
    } catch (err) {
      setPortalError(err.message || 'Could not open billing portal')
      setPortalLoading(false)
    }
  }, [])

  return (
    <section className="section section-dark" id="pricing">
      <div className="section-header">
        <div className="section-label">Pricing</div>
        <h2>Start With Pro. Upgrade Only When You Use More.</h2>
        <p>Pro is the default paid plan: full strategies, AI review, and the desktop coach for $12/month.</p>
      </div>
      {isFoundingOpen() && (
        <div style={{ display: 'flex', justifyContent: 'center', maxWidth: 720, margin: '0 auto 2rem' }}>
          <FoundingCountdown variant="banner" />
        </div>
      )}

      <div className="pricing-reassure">
        <div className="pricing-reassure-item">
          <span className="pricing-reassure-icon">⟲</span>
          <div>
            <strong>7-day money-back</strong>
            <p>Request a refund within seven days of your first paid charge. See the refund policy for details.</p>
          </div>
        </div>
        <div className="pricing-reassure-item">
          <span className="pricing-reassure-icon">⊘</span>
          <div>
            <strong>Cancel in one click</strong>
            <p>Stripe customer portal from your Account page. No phone calls, no retention tricks.</p>
          </div>
        </div>
        <div className="pricing-reassure-item">
          <span className="pricing-reassure-icon">∞</span>
          <div>
            <strong>Your account stays yours</strong>
            <p>Nobody logs into your game account, and Recon 6 does not inject into the game client.</p>
          </div>
        </div>
      </div>
      {/* Billing-scope toggle REMOVED 2026-07-06 — R6-only pricing. All-Access SKUs live on for
          existing subscribers (config/stripe.js + useAuth tier_scope). */}
      <div className="pricing-grid">
        {PRICING.filter((p) => showAdvancedPlans || !p.advanced).map((p) => {
          const foundingOpen = isFoundingOpen()
          const displayPrice = p.founding && !foundingOpen && p.regularPrice ? p.regularPrice : p.price
          const showFounding = p.founding && foundingOpen
          const showRegular = showFounding && p.regularPrice
          return (
          <div className={`pricing-card${p.featured ? ' featured' : ''}`} key={p.tier}>
            {p.featured && <div className="pricing-popular">Recommended start</div>}
            <div className="pricing-tier">{p.tier}</div>
            <p className="pricing-for">{p.audience}</p>
            <div className="pricing-price">
              {showRegular && (
                <span
                  style={{
                    display: 'inline-block',
                    marginRight: 8,
                    color: 'rgba(255,255,255,0.4)',
                    textDecoration: 'line-through',
                    fontSize: '0.75em',
                    verticalAlign: 'middle',
                  }}
                >
                  {p.regularPrice}
                </span>
              )}
              {displayPrice}
              {p.period && <span>{p.period}</span>}
            </div>
            {p.anchor && <p className="pricing-anchor">{p.anchor}</p>}
            {showFounding && (
              <div
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  marginBottom: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#ff9b5c',
                  background: 'rgba(255,155,92,0.12)',
                  border: '1px solid rgba(255,155,92,0.4)',
                  borderRadius: 999,
                }}
              >
                Founding rate — locked for life
              </div>
            )}
            <p className="pricing-desc">{p.desc}</p>
            <ul className="pricing-features">
              {p.features.map((f) => (<li key={f}>{f}</li>))}
            </ul>
            {isPro && p.price !== 'Free' ? (
              <button
                type="button"
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className={`btn ${p.featured ? 'btn-primary' : 'btn-outline'}`}
              >
                {portalLoading ? 'Opening…' : p.tierKey === plan ? 'Manage Subscription' : 'Change Plan'}
              </button>
            ) : p.price === 'Free' && user ? (
              <Link to="/strats" className={`btn ${p.featured ? 'btn-primary' : 'btn-outline'}`}>
                Go to Strats
              </Link>
            ) : p.price === 'Free' ? (
              <Link
                to={p.link}
                onClick={() => track('Free Tier CTA Click', { location: 'pricing-card' })}
                className={`btn ${p.featured ? 'btn-primary' : 'btn-outline'}`}
              >
                Get Started Free
              </Link>
            ) : (
              <MembershipCheckoutButton
                tier={p.tierKey}
                location="pricing-card"
                onError={(error) => setCheckoutError(error.message || 'Could not open secure checkout.')}
                className={`btn ${p.featured ? 'btn-primary' : 'btn-outline'}`}
              >
                {p.cta || (p.trialDays ? `Start ${p.trialDays}-day free trial` : 'Subscribe Now')}
              </MembershipCheckoutButton>
            )}
          </div>
          )
        })}
      </div>
      {!showAdvancedPlans && (
        <ul className="pricing-upper" aria-label="Elite and Champion plans">
          {UPPER_TIERS.map((t) => (
            <li key={t.key}>
              <strong>{t.name} — {t.price}<span>/mo</span></strong>
              <span><b className="pricing-upper-for">{t.audience}</b>{t.delta}</span>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="btn btn-outline pricing-advanced-toggle"
        onClick={() => {
          setShowAdvancedPlans((current) => !current)
          track('Advanced Plans Toggle', { state: showAdvancedPlans ? 'closed' : 'open' })
        }}
      >
        {showAdvancedPlans ? 'Hide Elite and Champion' : 'Compare Elite and Champion'}
      </button>
      <div className="pricing-compare-wrap">
        <table className="pricing-compare">
          <caption>Compare every plan</caption>
          <thead>
            <tr>
              <th scope="col">What you get</th>
              {COMPARE_PLANS.map((name) => <th scope="col" key={name}>{name}</th>)}
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map(([label, ...cells]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                {cells.map((cell, i) => <td key={COMPARE_PLANS[i]} data-plan={COMPARE_PLANS[i]}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="pricing-note">
        Paid memberships start billing at checkout; there is no free trial. Website AI usage is capped, and extra usage is prepaid at ${AI_USAGE_PACK_AMOUNT} with no automatic overage. Recon 6 Command is included with paid Pro, Elite, and Champion accounts. Champion includes two live sessions.
      </p>
      {(portalError || checkoutError || externalError) && (
        <p className="pricing-note" style={{ color: '#ff6b6b' }}>
          {portalError || checkoutError || externalError} — you can also <Link to="/account">manage from Account</Link>.
        </p>
      )}

    </section>
  )
}
