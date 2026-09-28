import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTestimonials } from '../hooks/useTestimonials'
import { useCheckoutResume } from '../hooks/useCheckoutResume'
import MembershipCheckoutButton from '../components/MembershipCheckoutButton'
import ErrorBoundary from '../components/ErrorBoundary'
import VERIFIED_CALLOUTS from '../data/verified-callouts'
import { FREE_MAPS, MAP_COUNT, PLAN_FACTS } from '../config/planFacts'
import { startCampaign } from '../config/startCampaigns'
import { SIDES, demoPlan, freePlanSignupPath, planPath, resolveDemoSelection, validDemoSelection } from '../lib/startDemo'
import { deferOnboardingUntilAfterPlan } from '../lib/onboardingDeferral'
import { track } from '../utils/analytics'
import './StartPage.css'

// /start — the social (TikTok, Shorts, Reels) sales page. One job: turn a
// video viewer into a player who has opened a real round plan, then show
// what paid adds. Standard: docs/GROWTH-UX-OPERATING-STANDARD.md.
//
// Every product fact on this page comes from a source of truth: prices and
// plan names from config/stripe.js + config/memberships.js (via planFacts),
// free maps from data/maps.js, review allowances mirrored from the VOD
// Lambda (planFacts.test.mjs), the plan preview from the same public data
// /strats shows signed-out players, testimonials from the live API.

const PRO = PLAN_FACTS.pro
const ELITE = PLAN_FACTS.elite
const CHAMPION = PLAN_FACTS.champion
const FREE_MAP_NAMES = FREE_MAPS.map((map) => map.name).join(' and ')
const PRIORITY_LABEL = { essential: 'Essential', recommended: 'Recommended', flex: 'Flex' }
const FOOTAGE = Object.values(VERIFIED_CALLOUTS).reduce(
  (sum, map) => ({ frames: sum.frames + (map.framesRead || 0), maps: sum.maps + 1 }),
  { frames: 0, maps: 0 },
)

function usd(amount) {
  return `$${amount}`
}

function Brand() {
  return (
    <Link to="/" className="navbar-logo start-brand" aria-label="Recon 6 home">
      <img src="/logo-mark.svg" alt="" width="24" height="24" aria-hidden="true" />
      Recon<span>6</span>
    </Link>
  )
}

function RoundPlanDemo({ selection, onSelect, openHref, onOpen }) {
  const plan = demoPlan(selection)
  const map = FREE_MAPS.find((item) => item.id === selection.mapId)
  if (!plan || !map) return null
  const choose = (next, action) => onSelect({ ...selection, ...next }, action)

  return (
    <section className={`start-plan start-plan-${plan.side}`} aria-label="Free round plan preview">
      <div className="start-plan-head">
        <span className="start-plan-kicker">Round plan</span>
        <span className="start-plan-beta">Beta</span>
      </div>

      <div className="start-plan-controls">
        <div className="start-seg" role="group" aria-label="Map">
          {FREE_MAPS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === plan.mapId}
              onClick={() => choose({ mapId: item.id, siteId: item.sites[0].id }, 'map')}
            >
              {item.name}
            </button>
          ))}
        </div>
        <label className="start-site-picker">
          <span className="start-visually-hidden">Bomb site</span>
          <select value={plan.siteId} onChange={(event) => choose({ siteId: event.target.value }, 'site')}>
            {map.sites.map((site) => (
              <option key={site.id} value={site.id}>{site.floor} {site.name}</option>
            ))}
          </select>
        </label>
        <div className="start-seg start-seg-side" role="group" aria-label="Side">
          {SIDES.map((side) => (
            <button
              key={side}
              type="button"
              aria-pressed={side === plan.side}
              className={`start-side-${side}`}
              onClick={() => choose({ side }, 'side')}
            >
              {side === 'attack' ? 'Attack' : 'Defense'}
            </button>
          ))}
        </div>
      </div>

      <h3 className="start-plan-title">
        {plan.mapName} · {plan.floor} {plan.siteName} · {plan.side === 'attack' ? 'Attack' : 'Defense'}
      </h3>

      <ol className="start-lineup" aria-label="Operators and their jobs">
        {plan.operators.map((operator) => (
          <li key={operator.name}>
            <strong>{operator.name}</strong>
            <span className="start-lineup-role">{operator.role}</span>
            <span className={`start-priority start-priority-${operator.priority}`}>
              {PRIORITY_LABEL[operator.priority] || operator.priority}
            </span>
          </li>
        ))}
      </ol>

      <p className="start-plan-call"><span>The plan</span>{plan.plan}</p>

      <div className="start-callouts">
        <span className="start-callouts-label">Callouts</span>
        <ul>
          {plan.callouts.map((callout) => (
            <li key={callout.name} className={callout.verified ? 'is-verified' : 'is-unverified'}>
              {callout.name}
              <span className="start-visually-hidden">{callout.verified ? ' (verified from match footage)' : ' (not yet verified)'}</span>
            </li>
          ))}
        </ul>
      </div>
      {plan.footage && (
        <p className="start-plan-evidence">
          <span className="start-check" aria-hidden="true">✓</span> Name read off real {plan.mapName} match footage
          ({plan.footage.frames.toLocaleString()} frames, {plan.footage.sessions} sessions).
          The plan text is AI-assisted and still being reviewed map by map.
        </p>
      )}

      <div className="start-plan-locked">
        <span>Pro adds this site&apos;s utility plan and enemy intel, and opens all {MAP_COUNT} maps.</span>
        <a href="#pricing" onClick={() => track('Demo Upgrade Link Click', { map: plan.mapId, site: plan.siteId, side: plan.side })}>
          See Pro
        </a>
      </div>

      <Link className="start-plan-open" to={openHref} onClick={onOpen}>
        Open this plan without an account <span aria-hidden="true">→</span>
      </Link>
    </section>
  )
}

const HOW = [
  {
    step: '01',
    title: 'Before the round',
    text: 'Open your map, bomb site and side. Five operators, one job each, and the plan in one line.',
  },
  {
    step: '02',
    title: 'During the round',
    text: 'Play your job and call rooms by the names the game prints, so your team knows exactly where you mean.',
  },
  {
    step: '03',
    title: 'After a lost round',
    text: `Upload the screenshot of the moment it went wrong. Get what happened and one fix to carry into the next game (Pro, ${PRO.aiReviewsPerMonth} reviews a month).`,
  },
]

const CAPABILITIES = [
  {
    key: 'review',
    tier: 'Pro',
    title: 'AI round review',
    when: 'After a round you lost',
    text: `Upload up to ${PRO.screenshotsPerReview} screenshots: a death cam, a post-plant freeze, the scoreboard. Recon 6 names the mistake it can see, the fix, and a drill for the week.`,
    sample: [
      'What went wrong: crosshair on the door frame, not pre-aimed at head height into Executive Lounge.',
      'Fix: step two paces back behind the desk to break the head-glitch angle.',
    ],
    link: { to: '/vod?demo=1', label: 'See the full sample review' },
  },
  {
    key: 'setups',
    tier: 'Elite',
    title: 'Setups verified from real matches',
    when: 'When you want a setup you can trust',
    text: 'Bomb-site setups built from recorded matches on Oregon, Consulate and Villa, each labelled with how it was verified. The plan changes for solo, duo or a full stack, and for the operators that are banned or taken.',
    link: { to: '/setups', label: 'Browse the setup library (free)' },
  },
  {
    key: 'live',
    tier: 'Pro',
    title: 'Live Coach walkthrough',
    when: 'Between rounds, on your phone',
    text: 'One screen for the match: stack size, map, bans, side, site and operators. It keeps your map and bans across rounds so prep takes seconds.',
  },
]

const COMPARE = [
  {
    feature: `${FREE_MAP_NAMES} round plans`,
    benefit: 'Know which operator to pick and what that operator does.',
    free: true,
    pro: true,
  },
  {
    feature: `All ${MAP_COUNT} maps, with each site's utility plan and enemy intel`,
    benefit: 'The same plan on whatever map the vote lands on.',
    free: false,
    pro: true,
  },
  {
    feature: `AI round review, ${PRO.aiReviewsPerMonth} a month`,
    benefit: 'Find what cost you the round, from your own screenshots.',
    free: false,
    pro: true,
  },
  {
    feature: 'Live Coach walkthrough',
    benefit: 'Prep once per match; the plan follows the bans.',
    free: false,
    pro: true,
  },
  {
    feature: 'Windows desktop coach (beta)',
    benefit: 'Optional app for PC players.',
    free: false,
    pro: true,
  },
]

const OBJECTIONS = [
  {
    q: 'Is this cheating?',
    a: 'No. Recon 6 is a planning and review tool you read before and after rounds. It does not inject into Rainbow Six, modify game files or control the game client, and nobody logs into your account.',
  },
  {
    q: 'Does it play for me?',
    a: 'No. It tells you the plan and reviews your screenshots. You still have to take the fight.',
  },
  {
    q: 'Will it work if I solo queue?',
    a: 'Yes. Every plan gives each operator a job, so you can take one and play it without a five-stack. The setup library and Live Coach also change their picks for solo, duo or a full stack.',
  },
  {
    q: 'Do I need another app open while I play?',
    a: 'No. Plans and reviews work in the browser on your phone or PC, so it sits next to your console or monitor. The Windows desktop coach is optional, beta, and part of paid plans.',
  },
  {
    q: 'Why not just watch YouTube?',
    a: 'A video shows one site the way one player runs it. Recon 6 opens the plan for the site you are on, uses the room names the game prints, and can review your own lost rounds, which a video cannot see.',
  },
  {
    q: "I'm Copper. Is it for me?",
    a: `Start with the free ${FREE_MAP_NAMES} plans. They tell you who to pick and what that operator is for, which is where most early rounds go wrong. No rank promises: you still have to play it.`,
  },
  {
    q: "I'm Emerald or Diamond. Will it teach me anything?",
    a: 'The paid plans carry the detail: utility plans and enemy intel on every map, premium tactics and verified setups on Elite, and reviews of your own rounds. The strategies are in beta; if you know a site better, tell us on Discord and we will fix it.',
  },
  {
    q: 'Console or PC?',
    a: 'Both. The website works on any phone or computer. Only the optional desktop coach is Windows-only.',
  },
  {
    q: 'How do I cancel?',
    a: 'From your Account page, in one click through Stripe. You keep access until the end of the period you paid for. Your first charge has a 7-day money-back window.',
  },
]

function Proof() {
  const { visible: testimonials } = useTestimonials()
  const quotes = testimonials.slice(0, 2)
  return (
    <section className="start-section start-proof" aria-labelledby="start-proof-title">
      <p className="start-kicker">Proof, not promises</p>
      <h2 id="start-proof-title">What is real today</h2>
      <ul className="start-facts">
        <li>
          <strong>{FOOTAGE.frames.toLocaleString()}</strong>
          <span>frames of real ranked footage read for room and site names, across {FOOTAGE.maps} maps</span>
        </li>
        <li>
          <strong>{FREE_MAPS.length}</strong>
          <span>maps you can open right now with no card: {FREE_MAP_NAMES}</span>
        </li>
        <li>
          <strong>0</strong>
          <span>game files touched. It is a planning and review tool, not software that runs in the game</span>
        </li>
      </ul>
      {quotes.length > 0 && (
        <div className="start-quotes">
          {quotes.map((quote) => (
            <figure key={quote.id || quote.name}>
              <blockquote>{quote.text}</blockquote>
              <figcaption>
                <strong>{quote.name}</strong>
                {quote.rank && <span>{quote.rank}</span>}
                {quote.hours && <span>{quote.hours}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      <p className="start-honest">
        Strategies are in beta: AI-assisted and reviewed map by map with real players. See something wrong?{' '}
        <a href="https://discord.gg/namGQqs3jb" target="_blank" rel="noopener noreferrer">Tell us on Discord</a>.
      </p>
    </section>
  )
}

function PriceCard({ plan, emphasis, reason, points, cta }) {
  return (
    <article className={`start-price${emphasis ? ' is-emphasis' : ''}`} aria-labelledby={`start-price-${plan.key}`}>
      {reason && <p className="start-price-reason">{reason}</p>}
      <h3 id={`start-price-${plan.key}`}>{plan.label}</h3>
      <p className="start-price-amount">
        {plan.monthlyUsd ? <>{usd(plan.monthlyUsd)}<span>/month</span></> : 'Free'}
      </p>
      <ul>
        {points.map((point) => <li key={point}>{point}</li>)}
      </ul>
      {cta}
    </article>
  )
}

export default function StartPage() {
  const { user, isPro, plan: currentPlan } = useAuth()
  const [searchParams] = useSearchParams()
  const campaign = useMemo(() => startCampaign(searchParams.get('utm_campaign')), [searchParams])
  const [selection, setSelection] = useState(() => resolveDemoSelection(searchParams, validDemoSelection(campaign?.demo)))
  const [checkoutError, setCheckoutError] = useState(null)
  const [stickyVisible, setStickyVisible] = useState(false)
  const heroCtaRef = useRef(null)
  const pricingRef = useRef(null)
  const finalRef = useRef(null)
  const interactedRef = useRef(false)

  useCheckoutResume(useCallback((error) => setCheckoutError(error.message || 'Could not open secure checkout.'), []))

  // Signed-in players go straight to the plan; everyone else creates a free
  // account on the way and lands on the same plan.
  const primaryHref = user ? planPath(selection) : freePlanSignupPath(selection)
  const primaryLabel = user ? 'Open my round plan' : 'Open my free round plan'

  useEffect(() => {
    const previous = document.title
    document.title = 'Recon 6 — Know your job before prep ends'
    track('Landing Viewed', {
      page: 'start',
      entry_source: searchParams.get('utm_source') || undefined,
      entry_campaign: searchParams.get('utm_campaign') || undefined,
      entry_content: searchParams.get('utm_content') || undefined,
    })
    return () => { document.title = previous }
    // Once per visit: the entry params are what the visitor arrived with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pricing viewed once. The sticky CTA only shows once the player has
  // scrolled past both the hero CTA and the demo (never on top of the
  // product), and hides again at pricing and the final CTA.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined
    let pricingSeen = false
    const visible = { hero: true, demo: true, pricing: false, final: false }
    const update = () => setStickyVisible(!visible.hero && !visible.demo && !visible.pricing && !visible.final)
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const key = entry.target.dataset.watch
        visible[key] = entry.isIntersecting
        if (key === 'pricing' && entry.isIntersecting && !pricingSeen) {
          pricingSeen = true
          track('Pricing Viewed', { page: 'start' })
        }
      }
      update()
    }, { threshold: 0.15 })
    const demo = document.querySelector('.start-plan')
    if (demo) demo.dataset.watch = 'demo'
    for (const node of [heroCtaRef.current, demo, pricingRef.current, finalRef.current]) if (node) observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const selectPlan = useCallback((next, action) => {
    const resolved = validDemoSelection(next)
    setSelection(resolved)
    track('Demo Interaction', {
      action,
      first: interactedRef.current ? 'no' : 'yes',
      map: resolved.mapId,
      site: resolved.siteId,
      side: resolved.side,
    })
    interactedRef.current = true
  }, [])

  const trackPrimary = (location) => () => {
    // Promised a round plan: after signup the plan comes before profile setup.
    if (!user) deferOnboardingUntilAfterPlan()
    track('Hero CTA Click', {
      location,
      map: selection.mapId,
      site: selection.siteId,
      side: selection.side,
      signed_in: user ? 'yes' : 'no',
    })
  }

  const checkoutProps = (tier, location) => ({
    tier,
    location,
    returnPath: '/start',
    onError: (error) => setCheckoutError(error.message || 'Could not open secure checkout.'),
  })

  const paidCta = (tier, label, primary = false) => (isPro ? (
    <Link to="/account" className={`btn ${primary ? 'btn-primary' : 'btn-outline'} start-price-cta`}>
      {currentPlan === tier ? 'Manage your plan' : 'Change plan in Account'}
    </Link>
  ) : (
    <MembershipCheckoutButton {...checkoutProps(tier, 'start-pricing')} className={`btn ${primary ? 'btn-primary' : 'btn-outline'} start-price-cta`}>
      {label}
    </MembershipCheckoutButton>
  ))

  return (
    <ErrorBoundary>
      <div className="start-page">
        <header className="start-top">
          <Brand />
          {user
            ? <Link to="/dashboard" className="start-top-link">My dashboard</Link>
            : <Link to="/auth?redirect=%2Fstart" className="start-top-link">Sign in</Link>}
        </header>

        <main>
          <section className="start-hero" aria-labelledby="start-title">
            <div className="start-hero-copy">
              <p className="start-eyebrow">{campaign?.eyebrow || 'Rainbow Six Siege · round plans'}</p>
              <h1 id="start-title">Know your job before prep ends.</h1>
              <p className="start-sub">
                Pick your map, site and side. Recon 6 shows the five operators to run, the job each one does
                and the plan for the round.
              </p>
              <div className="start-cta-block" ref={heroCtaRef} data-watch="hero">
                <Link to={primaryHref} className="btn btn-primary btn-lg start-cta" onClick={trackPrimary('start-hero')}>
                  {primaryLabel} <span aria-hidden="true">→</span>
                </Link>
                <p className="start-cta-note">
                  {FREE_MAP_NAMES} are free{user ? '' : ' · free account, no card'}.{' '}
                  Pro is {usd(PRO.monthlyUsd)}/month for all {MAP_COUNT} maps and AI round reviews.{' '}
                  <a href="#pricing">See plans</a>
                </p>
              </div>
            </div>
            <RoundPlanDemo
              selection={selection}
              onSelect={selectPlan}
              openHref={planPath(selection)}
              onOpen={trackPrimary('start-demo-no-account')}
            />
          </section>

          <section className="start-section" aria-labelledby="start-how-title">
            <p className="start-kicker">How players use it</p>
            <h2 id="start-how-title">Plan it, play it, fix it</h2>
            <ol className="start-how">
              {HOW.map((item) => (
                <li key={item.step}>
                  <span className="start-how-step">{item.step}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="start-section" aria-labelledby="start-more-title">
            <p className="start-kicker">Beyond the free plan</p>
            <h2 id="start-more-title">What the paid tools actually do</h2>
            <div className="start-caps">
              {CAPABILITIES.map((cap) => (
                <article key={cap.key} className="start-cap">
                  <p className="start-cap-meta"><span>{cap.tier}</span>{cap.when}</p>
                  <h3>{cap.title}</h3>
                  <p>{cap.text}</p>
                  {cap.sample && (
                    <div className="start-sample" aria-label="Excerpt from the sample review">
                      <span className="start-sample-label">Sample review</span>
                      {cap.sample.map((line) => <p key={line}>{line}</p>)}
                    </div>
                  )}
                  {cap.link && (
                    <Link to={cap.link.to} onClick={() => track('Start Capability Link Click', { capability: cap.key })}>
                      {cap.link.label} <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="start-section" aria-labelledby="start-compare-title">
            <p className="start-kicker">Free vs Pro</p>
            <h2 id="start-compare-title">Free gets you playing. Pro covers every map.</h2>
            <div className="start-compare" role="table" aria-label="What Free and Pro include">
              <div className="start-compare-row start-compare-head" role="row">
                <span role="columnheader">What you get</span>
                <span role="columnheader">Free</span>
                <span role="columnheader">Pro</span>
              </div>
              {COMPARE.map((row) => (
                <div className="start-compare-row" role="row" key={row.feature}>
                  <span role="cell">
                    <strong>{row.feature}</strong>
                    <small>{row.benefit}</small>
                  </span>
                  <span role="cell" className={row.free ? 'is-yes' : 'is-no'}>{row.free ? 'Yes' : '—'}</span>
                  <span role="cell" className={row.pro ? 'is-yes' : 'is-no'}>{row.pro ? 'Yes' : '—'}</span>
                </div>
              ))}
            </div>
          </section>

          <Proof />

          <section className="start-section start-pricing" id="pricing" aria-labelledby="start-pricing-title" ref={pricingRef} data-watch="pricing">
            <p className="start-kicker">Pricing</p>
            <h2 id="start-pricing-title">Start free. Pay when you want every map.</h2>
            <div className="start-prices">
              <PriceCard
                plan={PLAN_FACTS.free}
                points={[
                  `${FREE_MAP_NAMES} round plans`,
                  'Operator lineups, jobs and callouts',
                  'Browse the setup library',
                  'No card needed',
                ]}
                cta={(
                  <Link
                    to={primaryHref}
                    className="btn btn-outline start-price-cta"
                    onClick={() => {
                      if (!user) deferOnboardingUntilAfterPlan()
                      track('Free Tier CTA Click', { location: 'start-pricing' })
                    }}
                  >
                    {primaryLabel}
                  </Link>
                )}
              />
              <PriceCard
                plan={PRO}
                emphasis
                reason="Where most players should start: it opens every map and reviews your own rounds."
                points={[
                  `All ${MAP_COUNT} maps: utility plans and enemy intel`,
                  `AI round review, ${PRO.aiReviewsPerMonth} a month (up to ${PRO.screenshotsPerReview} screenshots each)`,
                  'Live Coach walkthrough',
                  'Windows desktop coach (beta)',
                ]}
                cta={paidCta('pro', `Start Pro — ${usd(PRO.monthlyUsd)}/month`, true)}
              />
              <PriceCard
                plan={ELITE}
                points={[
                  'Everything in Pro',
                  'Setups verified from real matches, and premium tactics',
                  `AI round review, ${ELITE.aiReviewsPerMonth} a month (up to ${ELITE.screenshotsPerReview} screenshots each)`,
                ]}
                cta={paidCta('elite', `Start Elite — ${usd(ELITE.monthlyUsd)}/month`)}
              />
              <PriceCard
                plan={CHAMPION}
                points={[
                  'Everything in Elite',
                  `${CHAMPION.liveSessionsPerMonth} live 1:1 coaching sessions a month with Aaron`,
                  `AI round review, ${CHAMPION.aiReviewsPerMonth} a month`,
                ]}
                cta={paidCta('champion', `Start Champion — ${usd(CHAMPION.monthlyUsd)}/month`)}
              />
            </div>
            <div className="start-billing">
              <p>
                <strong>How paying works:</strong> create your free account (email and a code we send you), then pay
                on Stripe&apos;s secure checkout. Plans bill monthly, starting when you subscribe.
              </p>
              <p>
                Cancel from your Account page in one click; you keep access until the end of the period.
                Your first charge has a 7-day money-back window (<Link to="/refund">refund policy</Link>).
              </p>
              {checkoutError && <p className="start-error" role="alert">{checkoutError}</p>}
            </div>
          </section>

          <section className="start-section" aria-labelledby="start-questions-title">
            <p className="start-kicker">Straight answers</p>
            <h2 id="start-questions-title">Before you sign up</h2>
            <div className="start-questions">
              {OBJECTIONS.map((item) => (
                <details
                  key={item.q}
                  onToggle={(event) => { if (event.currentTarget.open) track('Objection Opened', { question: item.q.slice(0, 60) }) }}
                >
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="start-final" aria-labelledby="start-final-title" ref={finalRef} data-watch="final">
            <h2 id="start-final-title">Your next round starts in prep.</h2>
            <p>Open a free plan for {FREE_MAP_NAMES}, take a job, and see how the round goes.</p>
            <Link to={primaryHref} className="btn btn-primary btn-lg start-cta" onClick={trackPrimary('start-final')}>
              {primaryLabel} <span aria-hidden="true">→</span>
            </Link>
            {!isPro && (
              <MembershipCheckoutButton {...checkoutProps('pro', 'start-final')} className="start-final-secondary">
                Or start Pro — {usd(PRO.monthlyUsd)}/month
              </MembershipCheckoutButton>
            )}
          </section>
        </main>

        <footer className="start-footer">
          <nav aria-label="Legal">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/refund">Refund policy</Link>
            <a href="https://discord.gg/namGQqs3jb" target="_blank" rel="noopener noreferrer">Discord</a>
          </nav>
          <p>© 2026 Recon 6. Fan-made Rainbow Six Siege coaching; not affiliated with Ubisoft.</p>
        </footer>

        <div className={`start-sticky${stickyVisible ? ' is-visible' : ''}`} aria-hidden={!stickyVisible}>
          <Link
            to={primaryHref}
            className="btn btn-primary start-cta"
            tabIndex={stickyVisible ? 0 : -1}
            onClick={trackPrimary('start-sticky')}
          >
            {primaryLabel}
          </Link>
        </div>
      </div>
    </ErrorBoundary>
  )
}
