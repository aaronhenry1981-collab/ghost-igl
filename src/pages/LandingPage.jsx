import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getCurrentSeason } from '../utils/season'
import { isFoundingOpen } from '../config/founding'
import { track } from '../utils/analytics'
import FoundingCountdown from '../components/FoundingCountdown'
import StratDisplay from '../components/strats/StratDisplay'
import STRATS from '../data/public-strats.generated'
import META from '../data/meta'
import OPERATORS from '../data/operators'
import { MAP_COUNT, PLAN_FACTS, SITE_COUNT } from '../config/planFacts'
import { useAuth } from '../hooks/useAuth'
import { useTestimonials } from '../hooks/useTestimonials'

// R6-ONLY flag (2026-07-06): RECON6 is a Rainbow Six product. The multi-game
// showcase and All-Access upsell JSX below are kept behind this flag instead
// of deleted — flip to false to instantly restore them if the direction
// changes. Existing All-Access subscribers are unaffected either way.
const R6_ONLY = true

import { useDemoVideo } from '../hooks/useDemoVideo'
import { useReveal } from '../hooks/useReveal'
import { openMembershipCheckout } from '../lib/membershipCheckout'
import { checkoutReturnEvent } from '../lib/checkoutFunnel'
import MembershipCheckoutButton from '../components/MembershipCheckoutButton'
import PricingSection from '../components/PricingSection'
import TestimonialCards from '../components/TestimonialCards'
import { R6_DEMO_ANALYSIS } from '../data/vodDemoR6'
import { findProgressSkill } from '../data/progressCurriculum'

const PREVIEW_STRATS = {
  'bank-ceo-attack': { map: 'Bank', mapId: 'bank', site: 'CEO Office', siteId: 'ceo', side: 'attack', data: STRATS.bank.ceo.attack },
  'bank-ceo-defense': { map: 'Bank', mapId: 'bank', site: 'CEO Office', siteId: 'ceo', side: 'defense', data: STRATS.bank.ceo.defense },
  'clubhouse-cctv-attack': { map: 'Clubhouse', mapId: 'clubhouse', site: 'Cash / CCTV', siteId: 'cash-cctv', side: 'attack', data: STRATS.clubhouse['cash-cctv'].attack },
  'kafe-cocktail-defense': { map: 'Kafe Dostoyevsky', mapId: 'kafe', site: 'Bar / Cocktail Lounge', siteId: 'bar-cocktail', side: 'defense', data: STRATS.kafe['bar-cocktail'].defense },
}


// Counter that displays the final value by default and only animates the
// count-up once when first scrolled into view. Previous version started at 0
// every render, which meant scrolling, navigating, or any re-render briefly
// showed "0 Maps / 2+ Strategies / 4% Ranked Pool" — terrible first
// impression. Now the displayed number is always the real value (or higher).
function AnimatedCounter({ end, suffix = '', duration = 1400 }) {
  const [count, setCount] = useState(end) // start at final value so we never flash low numbers
  const elRef = useRef(null)
  const playedRef = useRef(false)

  useEffect(() => {
    if (playedRef.current) return
    const node = elRef.current
    if (!node) return

    // If IntersectionObserver isn't available, just show the final number.
    if (typeof IntersectionObserver === 'undefined') return

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting || playedRef.current) return
        playedRef.current = true
        io.disconnect()

        // Run the count-up once.
        setCount(0)
        let start = 0
        const step = Math.max(1, end / (duration / 16))
        const timer = setInterval(() => {
          start += step
          if (start >= end) {
            setCount(end)
            clearInterval(timer)
          } else {
            setCount(Math.floor(start))
          }
        }, 16)
      },
      { threshold: 0.4 }
    )
    io.observe(node)
    return () => io.disconnect()
  }, [end, duration])

  return (
    <span ref={elRef}>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

// Features. Each title leads with the outcome ("what's in it for me?") and
// the description spells out the concrete benefit. We don't sell the engine
// (vision models, vector retrieval, etc.) \u2014 buyers care about climbing,
// not the technology. Where a feature is currently R6-only, we say so
// explicitly so a CS2 visitor isn't deceived. SVG icons render consistently
// across OSes; emoji previously caused visual drift.
const FEATURES = [
  {
    icon: 'map',
    title: 'Pull the Exact Round',
    desc: 'Choose the map, bombsite, and side. Get one usable attack or defense plan instead of searching through a wall of disconnected tips.',
    link: '/strats',
  },
  {
    icon: 'roster',
    title: 'Show Me My Job',
    desc: 'Every operator gets a purpose: route, utility, timing, and the teammate they enable. Solo players see the role they can actually control.',
    link: '/match-prep',
  },
  {
    icon: 'vod',
    title: 'Find What Cost the Round',
    desc: 'Submit real match evidence and get the specific mistake, correction, and practice focus—not a generic list of recycled advice.',
    link: '/vod?demo=1',
  },
  {
    icon: 'plan',
    title: 'Carry One Fix Forward',
    desc: 'Road to Champion turns repeated gameplay evidence into one next-match mission and reopens the skill when the mistake returns.',
    link: '/progress',
  },
]

// Inline SVGs for feature icons. Rendered as 24px monoline glyphs \u2014 looks
// like a designed product, not pasted Slack emoji. currentColor lets the
// CSS accent flow through so they tint with the card hover state.
const FEATURE_ICONS = {
  map: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14"/><path d="M15 6v14"/>
    </svg>
  ),
  roster: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 11a3 3 0 1 0 0-6"/><path d="M21.5 20a5 5 0 0 0-5-5"/>
    </svg>
  ),
  catalog: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10"/><path d="M7 12h10"/><path d="M7 16h6"/>
    </svg>
  ),
  meta: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21V11"/><path d="M9 21V7"/><path d="M15 21V13"/><path d="M21 21V4"/>
    </svg>
  ),
  vod: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2"/><path d="m10 9 5 3-5 3z" fill="currentColor"/>
    </svg>
  ),
  bans: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>
    </svg>
  ),
  predict: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    </svg>
  ),
  squad: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="7" cy="9" r="2.5"/><circle cx="17" cy="9" r="2.5"/><circle cx="12" cy="9" r="2.5"/><path d="M2.5 20a4.5 4.5 0 0 1 9 0"/><path d="M12.5 20a4.5 4.5 0 0 1 9 0"/>
    </svg>
  ),
  plan: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="4" width="16" height="17" rx="2"/><path d="M9 2v4"/><path d="M15 2v4"/><path d="M8 11h8"/><path d="M8 15h5"/>
    </svg>
  ),
  kit: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v3"/><path d="m4.5 7 2 2"/><path d="m19.5 7-2 2"/><path d="M5 13a7 7 0 1 1 14 0v6H5z"/><path d="M9 13h.01"/><path d="M15 13h.01"/>
    </svg>
  ),
}

// What the paid features hand back, shown with real product data rather than
// described: an excerpt of the /vod demo's sample review (the same object),
// and an example Road to Champion board built from the real curriculum, its
// "Needs work" skill matching the sample's mistake. Both are labelled as
// samples; neither is a member's data.
const SAMPLE_SHOT = R6_DEMO_ANALYSIS.per_image[0]
const SAMPLE_REVIEW_PLACE = [
  `${SAMPLE_SHOT.detected.map} ${SAMPLE_SHOT.detected.site}`,
  SAMPLE_SHOT.detected.side === 'defense' ? 'Defense' : 'Attack',
  SAMPLE_SHOT.detected.character,
].join(' · ')
const SAMPLE_REVIEW_STEPS = [
  { label: 'Screenshot', text: SAMPLE_SHOT.what_happened },
  { label: 'Mistake', text: SAMPLE_SHOT.what_went_wrong[0] }, // crosshair on the door frame
  { label: 'Practice', text: R6_DEMO_ANALYSIS.practice_plan.this_week[0] }, // pre-aim head height drill
]
const BOARD_MISSION = findProgressSkill('crosshair-head-height')
const BOARD_EXAMPLE = [
  { skill: findProgressSkill('drone-before-entry'), state: 'proven', label: 'Proven' },
  { skill: BOARD_MISSION, state: 'needs', label: 'Needs work' },
  { skill: findProgressSkill('controlled-peeks'), state: 'building', label: 'Building proof' },
  { skill: findProgressSkill('spawn-discipline'), state: 'unseen', label: 'Not observed' },
]

const STEPS = [
  { num: '01', title: 'Choose Your Map and Site', desc: 'Open the exact Rainbow Six map, bombsite, and side you are playing. Preview Bank and Coastline for free; a paid plan unlocks more maps and detail.' },
  { num: '02', title: 'Play With a Clear Job', desc: 'See operator roles, positioning, callouts, utility priorities, and the execute or setup your team needs.' },
  { num: '03', title: 'Review Real Match Evidence', desc: 'Drop screenshots from a round for an AI VOD breakdown, or follow the Live Coach walkthrough (stack, bans, side, site, operator) while you play.' },
  { num: '04', title: 'Prove the Fix in Your Gameplay', desc: 'Road to Champion tracks repeated evidence, reopens a skill when the mistake returns, and gives you one clear mission for the next match.' },
]


const FAQ = [
  {
    q: 'What does Recon 6 actually do for me?',
    a: 'It puts Rainbow Six callouts, operator lineups, ban targets, and site setups in one place. You can also upload screenshots from your matches for feedback tied to what you share and one correction to practice in your next games.',
  },
  {
    q: 'Which games does Recon 6 support today?',
    a: 'RECON6 is a Rainbow Six Siege coaching platform. Everything on the site is built for Siege: the full strat library for every ranked map, premium tactics, AI VOD review, the live coach, and the meta board — all updated every season and every balance patch.',
  },
  {
    q: 'Is Recon 6 a boosting service?',
    a: 'No. Nobody ever logs into your account. You earn your rank through better game sense, positioning, and decision-making — Recon 6 just shortens the learning curve so you stop making the same mistake five matches in a row.',
  },
  {
    q: 'Will I get banned?',
    a: 'Recon 6 does not inject into Rainbow Six, modify game files, or control the game client. The optional Pro desktop app reads your own capture feed and never touches the game process.',
  },
  {
    q: 'What does a VOD breakdown actually look like?',
    a: 'Drop screenshots from a match — death cams, post-plant freezes, or end-of-round scoreboards. You get the specific mistake shown in the evidence, the pattern across the session, and a fix you can apply next round. VOD reviews use the monthly limit included with your plan, and stop when that allowance is used.',
  },
  {
    q: 'Who is Recon 6 not for?',
    a: 'Players who want someone else to raise their rank: nobody logs into your account, so this is not boosting. It is not a cheat, macro or aim trainer either. Recon 6 is for players who want to understand their rounds and fix one mistake at a time.',
  },
  {
    q: 'What ranks does Recon 6 help?',
    a: 'Every rank, Copper to Champion. The site starts with the basics for newer players and gives you more tactical depth as you build the habits to use it.',
  },
  {
    q: 'Pro, Elite, or Champion — which one fits me?',
    a: 'Pro is the affordable AI toolkit. Elite is the full self-service system with deeper strategies and much more VOD usage. Champion adds two live coaching sessions with Aaron each month.',
  },
  {
    q: 'How often does the content update?',
    a: 'Strats refresh every season when the ranked pool rotates and after any balance patch that moves the meta. The blog ships patch breakdowns and map guides continuously.',
  },
]

function FaqItem({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      type="button"
      className={`faq-item${open ? ' open' : ''}`}
      onClick={() => setOpen(!open)}
      aria-expanded={open}
    >
      <div className="faq-question">
        <span>{item.q}</span>
        <span className="faq-toggle">{open ? '\u2212' : '+'}</span>
      </div>
      {open && <div className="faq-answer">{item.a}</div>}
    </button>
  )
}

function MetaStrip() {
  const top3 = META.opBoard.slice(0, 3)
  const topBans = META.banBoard.slice(0, 3)
  return (
    <div className="meta-strip">
      <div className="meta-strip-col">
        <div className="meta-strip-label">Top essential picks</div>
        <ol className="meta-strip-list">
          {top3.map((op, i) => (
            <li key={op.name}>
              <span className="meta-strip-rank">{i + 1}</span>
              <Link to={`/operators/${encodeURIComponent(op.name.toLowerCase())}`} className="meta-strip-name">
                {op.name}
              </Link>
              <span className="meta-strip-count">{op.essential} sites</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="meta-strip-col">
        <div className="meta-strip-label">Common ban recommendations</div>
        {topBans.length > 0 ? (
          <ol className="meta-strip-list">
            {topBans.map((b, i) => (
              <li key={b.name}>
                <span className="meta-strip-rank">{i + 1}</span>
                <span className="meta-strip-name">{b.name}</span>
                <span className="meta-strip-count">{b.total} recommendations</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="meta-strip-locked">
            Ban targets for every ranked map, each with the reason, come with Pro. <Link to="/pricing">See plans</Link>
          </p>
        )}
      </div>
      <div className="meta-strip-cta">
        <Link to="/meta" className="btn btn-primary btn-sm">See full meta →</Link>
      </div>
    </div>
  )
}

function StratPreview() {
  const [key, setKey] = useState('bank-ceo-attack')
  const current = PREVIEW_STRATS[key]
  return (
    <div className="strat-preview-wrap">
      <div className="strat-preview-tabs">
        {Object.entries(PREVIEW_STRATS).map(([k, v]) => (
          <button
            key={k}
            type="button"
            className={`strat-preview-tab${k === key ? ' active' : ''}`}
            onClick={() => setKey(k)}
          >
            <span className="strat-preview-map">{v.map}</span>
            <span className="strat-preview-site">{v.site} · {v.side === 'attack' ? 'Attack' : 'Defense'}</span>
          </button>
        ))}
      </div>
      <div className="strat-preview-body">
        <StratDisplay strat={current.data} side={current.side} mapId={current.mapId} mapName={current.map} siteId={current.siteId} siteName={current.site} gated={true} />
      </div>
    </div>
  )
}

export default function LandingPage() {
  const { user, isPro } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const { visible: testimonials } = useTestimonials()
  const { video: demoVideo } = useDemoVideo()
  const [checkoutError, setCheckoutError] = useState(null)
  const checkoutResumeRef = useRef(false)
  const landingViewTrackedRef = useRef(false)
  // R6-ONLY (2026-07-06): the billing-scope toggle and All-Access SKUs are no
  // longer offered to NEW visitors — RECON6 is a Rainbow Six product. The
  // All-Access price IDs stay live in config/stripe.js and useAuth still
  // honors tier_scope 'all_access' so existing subscribers lose nothing.
  useReveal()

  useEffect(() => {
    if (landingViewTrackedRef.current) return
    landingViewTrackedRef.current = true
    track('Landing Viewed')
  }, [])

  // Stripe sends an abandoned checkout back here with ?checkout=cancelled.
  useEffect(() => {
    const event = checkoutReturnEvent(searchParams.get('checkout'))
    if (event) track(event.name, event.props)
  }, [searchParams])

  // A signed-out visitor chooses a tier, creates/signs into a verified account,
  // then returns here. Resume the server-owned Checkout Session exactly once.
  useEffect(() => {
    const tier = searchParams.get('checkout')
    if (!user || checkoutResumeRef.current || !['pro', 'elite', 'champion'].includes(tier)) return
    checkoutResumeRef.current = true
    const next = new URLSearchParams(searchParams)
    next.delete('checkout')
    setSearchParams(next, { replace: true })
    openMembershipCheckout(tier).catch((error) => {
      checkoutResumeRef.current = false
      setCheckoutError(error.message || 'Could not open secure checkout.')
    })
  }, [user, searchParams, setSearchParams])

  return (
    <div className="recon-landing-v2">
      <section className="hero hero-v2">
        <img
          className="hero-v2-image"
          src="/recon6-tactical-hero.webp"
          alt="Illustration of two attackers breaching into a room at night, with a floor plan and a dashed entry route drawn beside them"
          width="1920"
          height="1080"
          fetchPriority="high"
          decoding="async"
        />
        <div className="hero-v2-shade" aria-hidden="true" />
        <div className="hero-v2-grid" aria-hidden="true" />
        <div className="hero-v2-inner">
          <div className="hero-v2-copy">
            <div className="hero-badge hero-v2-badge">
              <span className="pulse-dot" />
              Built for real R6 rounds · Season {getCurrentSeason()}
            </div>
            <h1>
              Load your next Siege round.<br />
              <span className="accent">Know your job.</span><br />
              Play it together.
            </h1>
            <p className="hero-subtitle">
              Pick the Rainbow Six Siege map, site, and side. Recon 6 gives your squad five clear operator jobs,
              then reviews the round and tells you what to fix next.
            </p>
            <div className="hero-cta hero-v2-cta">
              <Link
                to="/strats/bank/ceo/defense"
                className="btn btn-primary btn-lg"
                onClick={() => track('Hero CTA Click', { type: 'bank-defense' })}
              >
                Open the free Bank defense <span aria-hidden="true">→</span>
              </Link>
              <a
                href="#pricing"
                className="btn btn-outline btn-lg"
                onClick={() => track('Hero Pricing Link Click')}
              >
                See Pro from ${PLAN_FACTS.pro.monthlyUsd}/month
              </a>
            </div>
            <div className="hero-v2-proof">
              <span><strong>{MAP_COUNT}</strong> maps</span>
              <span><strong>{SITE_COUNT}</strong> site setups</span>
              <span><strong>{OPERATORS.length}</strong> operators in current plans</span>
              <span><i /> No signup to preview</span>
            </div>
          </div>

        </div>
        <div className="hero-v2-rail" aria-label="How Recon 6 improves a round">
          <div><span>01</span><strong>PREP</strong><p>Pick the site and get the five jobs.</p></div>
          <div><span>02</span><strong>PLAY</strong><p>Run one clear execute—not five separate ideas.</p></div>
          <div><span>03</span><strong>REVIEW</strong><p>Find the mistake and carry one fix forward.</p></div>
        </div>
      </section>

      <div className="trust-bar">
        <div className="trust-item"><span className="trust-icon">{'\u2713'}</span> No Account Sharing</div>
        <div className="trust-item"><span className="trust-icon">{'\u2713'}</span> No Game-File Injection</div>
        <div className="trust-item"><span className="trust-icon">{'\u2713'}</span> Cancel in One Click</div>
        <div className="trust-item"><span className="trust-icon">{'\u2713'}</span> No Automatic AI Overages</div>
      </div>

      <section className="section product-proof" id="preview">
        <div className="product-proof-heading">
          <div>
            <div className="section-label">The product, not a promise</div>
            <h2>Open the exact round you are about to play.</h2>
          </div>
          <p>
            Choose a real map, bombsite, and side. See the lineup, execute, callouts,
            utility priorities, and advanced tactics before you create an account.
          </p>
        </div>
        <StratPreview />
        <div className="product-proof-footer">
          <div>
            <span className="section-label">R6 strategy library trends</span>
            <strong>Current picks and bans, connected to the strat.</strong>
          </div>
          <MetaStrip />
        </div>
      </section>

      {/* Testimonials moved directly under the hero (2026-07-06 coherence
          pass) \u2014 social proof belongs before the feature tour, not below it. */}
      {testimonials.length > 0 && (
      <section className="section" id="testimonials">
        <div className="section-header">
          <div className="section-label">Testimonials</div>
          <h2>What Players Say</h2>
          <p>Feedback from R6 players who have used Recon 6.</p>
        </div>
        <TestimonialCards testimonials={testimonials} />
      </section>
      )}

      <section className="section" id="features">
        <div className="section-header">
          <div className="section-label">More than a strat library</div>
          <h2>The plan is only useful if it changes your next round.</h2>
          <p>Hardstuck, and more hours aren't fixing it? Usually it's one mistake, repeated every match. Recon 6 connects the briefing, your individual job, the mistake you made, and the correction you carry into the next match.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f) => {
            const iconNode = FEATURE_ICONS[f.icon] || null
            const Card = (
              <>
                {f.badge && <span className="feature-badge">{f.badge}</span>}
                <div className="feature-icon" aria-hidden="true">{iconNode}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </>
            )
            return f.link ? (
              <Link to={f.link} className={`feature-card${f.badge ? ' feature-card-champion' : ''}`} key={f.title}>{Card}</Link>
            ) : (
              <div className={`feature-card${f.badge ? ' feature-card-champion' : ''}`} key={f.title}>{Card}</div>
            )
          })}
        </div>
        <figure className="review-sample">
          <figcaption className="review-sample-head">
            <span className="review-sample-badge">Sample review</span>
            <strong>{SAMPLE_REVIEW_PLACE}</strong>
          </figcaption>
          <ol className="review-sample-steps">
            {SAMPLE_REVIEW_STEPS.map((step) => (
              <li key={step.label}>
                <span>{step.label}</span>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
          <div className="review-sample-foot">
            <span>Each review is saved to Road to Champion as coaching evidence.</span>
            <Link to="/vod?demo=1">Open the full sample review <span aria-hidden="true">→</span></Link>
          </div>
        </figure>
      </section>

      {demoVideo && (
        <section className="section" id="demo">
          <div className="section-header">
            <div className="section-label">Demo</div>
            <h2>{demoVideo.title}</h2>
            <p>{demoVideo.caption}</p>
          </div>
          <div className="demo-video-wrap">
            <iframe
              src={demoVideo.embedUrl}
              title={demoVideo.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </section>
      )}

      <section className="section section-dark" id="how-it-works">
        <div className="section-header">
          <div className="section-label">How It Works</div>
          <h2>Start Improving in 4 Steps</h2>
          <p>Prepare, play, review, and prove the correction in your next matches.</p>
        </div>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <div className="step-card" key={s.num}>
              <div className="step-num">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section creator-strip" id="creators">
        <div className="creator-strip-copy">
          <div className="section-label">Creators and squad coaches</div>
          <h2>Make Siege content or coach a stack?</h2>
          <p>
            The 60-second demo shows a full round plan you can put on stream or send to your squad. The press kit has
            logos, screenshots, and a way to request a review build.
          </p>
        </div>
        <div className="creator-strip-actions">
          <Link to="/creator-demo" className="btn btn-primary">Open the 60-second demo</Link>
          <Link to="/press" className="btn btn-outline">Press and creator kit</Link>
        </div>
      </section>

      {/* Multi-game showcase REMOVED 2026-07-06 — RECON6 is R6-only. The
          /games/ static pages stay live for their indexed SEO value, but the
          product story on this page is pure Rainbow Six. */}
      {!R6_ONLY && <section className="section" id="games">
        <div className="section-header">
          <div className="section-label">Built for R6 first</div>
          <h2>Rainbow Six is home. Your other games come free.</h2>
          <p>Recon 6 goes deepest on Siege — premium tactics, AI VOD review, the desktop coach. The same toolkit (strats, loadouts, match prep, meta) is there for the other games you play too, one switch away in the sidebar. No extra subscription.</p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '0.75rem',
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 1rem',
        }}>
          {[
            { id: 'r6', name: 'Rainbow Six Siege', short: 'R6', color: '#ff9b5c', status: 'LIVE' },
            { id: 'cs2', name: 'Counter-Strike 2', short: 'CS2', color: '#f5b800', status: 'LIVE' },
            { id: 'valorant', name: 'Valorant', short: 'VAL', color: '#ff4655', status: 'LIVE' },
            { id: 'cod', name: 'Call of Duty', short: 'COD', color: '#7ed321', status: 'LIVE' },
            { id: 'apex', name: 'Apex Legends', short: 'APEX', color: '#c4a16d', status: 'LIVE' },
            { id: 'ow2', name: 'Overwatch 2', short: 'OW2', color: '#ff8c00', status: 'LIVE' },
            { id: 'mvr', name: 'Marvel Rivals', short: 'MVR', color: '#e62b50', status: 'LIVE' },
            { id: 'finals', name: 'The Finals', short: 'FINALS', color: '#ed6212', status: 'LIVE' },
            { id: 'halo', name: 'Halo Infinite', short: 'HALO', color: '#5cb85c', status: 'LIVE' },
            { id: 'fn', name: 'Fortnite', short: 'FN', color: '#bc965c', status: 'LIVE' },
            { id: 'rl', name: 'Rocket League', short: 'RL', color: '#f7941d', status: 'LIVE' },
          ].map(g => (
            <div key={g.id} style={{
              padding: '1rem 0.75rem',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${g.status === 'LIVE' ? g.color : 'rgba(255,255,255,0.08)'}`,
              textAlign: 'center',
              opacity: g.status === 'LIVE' ? 1 : 0.65,
              position: 'relative',
            }}>
              <div style={{
                fontSize: '1.5rem', fontWeight: 800, color: g.color,
                letterSpacing: '0.04em', marginBottom: 4,
              }}>{g.short}</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(235,228,215,0.85)', marginBottom: 6 }}>
                {g.name}
              </div>
              <div style={{
                display: 'inline-block',
                padding: '2px 8px',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                borderRadius: 999,
                color: g.status === 'LIVE' ? '#7ee2a4' : 'rgba(235,228,215,0.5)',
                background: g.status === 'LIVE' ? 'rgba(80,200,120,0.15)' : 'rgba(255,255,255,0.05)',
                border: g.status === 'LIVE' ? '1px solid #50c878' : '1px solid rgba(255,255,255,0.1)',
              }}>{g.status}</div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', color: 'rgba(235,228,215,0.6)', fontSize: '0.9rem', marginTop: '1.5rem', maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
          Rainbow Six goes deepest — every map, site, operator, and the AI VOD review. Your other games are covered too: maps, characters, loadouts, strats, and match prep, with more depth shipping every week.
          <strong style={{ color: '#f07430' }}> All-Access ($19/mo)</strong> adds every game to one plan as it grows.
        </p>
      </section>}

      <section className="section road-home" id="road-to-champion">
        <div className="road-home-copy">
          <div className="section-label">Road to Champion</div>
          <h2>Stop Wondering What You Should Practice</h2>
          <p>
            Your dashboard separates knowledge from gameplay proof. It shows what is already reliable,
            what is failing, what has not been observed yet, and the single mission to carry into your next match.
          </p>
          <div className="road-home-states" aria-label="Progress evidence states">
            <span className="road-state road-state-proven">Proven</span>
            <span className="road-state road-state-building">Building proof</span>
            <span className="road-state road-state-needs">Needs work</span>
            <span className="road-state road-state-unseen">Not observed</span>
          </div>
          <Link to="/progress" className="btn btn-primary">Open Road to Champion</Link>
        </div>
        <div className="road-home-board">
          <div className="road-home-mission-label">Example board</div>
          <ul className="road-home-skills" aria-label="Example skills and their evidence states">
            {BOARD_EXAMPLE.map(({ skill, state, label }) => (
              <li key={skill.id}>
                <span>{skill.title}</span>
                <span className={`road-state road-state-${state}`}>{label}</span>
              </li>
            ))}
          </ul>
          <div className="road-home-mission">
            <div className="road-home-mission-label">Next-match mission</div>
            <strong>{BOARD_MISSION.action}</strong>
            <p>Complete the behavior repeatedly in real matches. One lucky round does not mark the skill as mastered.</p>
          </div>
        </div>
      </section>

      <PricingSection externalError={checkoutError} />

      <section className="section" id="faq">
        <div className="section-header">
          <div className="section-label">FAQ</div>
          <h2>Questions Before You Start?</h2>
          <p>Clear answers about plans, analysis, safety, and what the tools actually do.</p>
        </div>
        <div className="faq-list">
          {FAQ.map((item) => (<FaqItem key={item.q} item={item} />))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Stop Losing Rounds You Should Win.</h2>
          <p>
            Preview Bank and Coastline for free. Pick a side and try a plan before choosing a paid subscription.
            {isFoundingOpen()
              ? ' If you want the round-by-round breakdowns next, founding pricing locks in for life if you join before the countdown ends.'
              : ' If you want the round-by-round breakdowns next, Pro unlocks the VOD engine.'}
          </p>
          {isFoundingOpen() && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
              <FoundingCountdown variant="pill" />
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isPro ? (
              <Link to="/account" className="btn btn-primary btn-lg">Manage membership</Link>
            ) : (
              <MembershipCheckoutButton
                tier="pro"
                location="final-cta"
                onError={(error) => setCheckoutError(error.message || 'Could not open secure checkout.')}
                className="btn btn-primary btn-lg"
              >
                Start Pro — $12/month
              </MembershipCheckoutButton>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
