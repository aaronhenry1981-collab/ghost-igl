import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentSeason } from '../utils/season'
// All-Access link/amount imports removed 2026-07-06 (R6-only) — the constants
// stay exported from config/stripe.js for existing subscribers' plumbing.
import {
  PRO_CHECKOUT_LINK,
  ELITE_CHECKOUT_LINK,
  CHAMPION_CHECKOUT_LINK,
  CHAMPION_CHECKOUT_AVAILABLE,
  AI_USAGE_PACK_AMOUNT,
  withCheckoutEmail,
} from '../config/stripe'
import { isFoundingOpen } from '../config/founding'
import { track } from '../utils/analytics'
import FoundingCountdown from '../components/FoundingCountdown'
import StratDisplay from '../components/strats/StratDisplay'
import STRATS from '../data/public-strats.generated'
import META from '../data/meta'
import { useAuth } from '../hooks/useAuth'
import { useTestimonials } from '../hooks/useTestimonials'

// R6-ONLY flag (2026-07-06): RECON6 is a Rainbow Six product. The multi-game
// showcase and All-Access upsell JSX below are kept behind this flag instead
// of deleted — flip to false to instantly restore them if the direction
// changes. Existing All-Access subscribers are unaffected either way.
const R6_ONLY = true

import { useDemoVideo } from '../hooks/useDemoVideo'
import { useReveal } from '../hooks/useReveal'
import './WorkbookLanding.css'
import { API_URL, getCurrentUser, getSession, getIdToken } from '../lib/cognito'

const PREVIEW_STRATS = {
  'bank-ceo-attack': { map: 'Bank', site: 'CEO Office', side: 'attack', data: STRATS.bank.ceo.attack },
  'bank-ceo-defense': { map: 'Bank', site: 'CEO Office', side: 'defense', data: STRATS.bank.ceo.defense },
  'clubhouse-cctv-attack': { map: 'Clubhouse', site: 'Cash / CCTV', side: 'attack', data: STRATS.clubhouse['cash-cctv'].attack },
  'kafe-cocktail-defense': { map: 'Kafe Dostoyevsky', site: 'Bar / Cocktail Lounge', side: 'defense', data: STRATS.kafe['bar-cocktail'].defense },
}

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

const STEPS = [
  { num: '01', title: 'Choose Your Map and Site', desc: 'Open the exact Rainbow Six map, bombsite, and side you are playing. The free strategy library gives you a usable plan before the round starts.' },
  { num: '02', title: 'Play With a Clear Job', desc: 'See operator roles, positioning, callouts, utility priorities, and the execute or setup your team needs.' },
  { num: '03', title: 'Review Real Match Evidence', desc: 'Drop screenshots from a round for an AI VOD breakdown, or use the PC Live Coach to detect match state while you play.' },
  { num: '04', title: 'Prove the Fix in Your Gameplay', desc: 'Road to Champion tracks repeated evidence, reopens a skill when the mistake returns, and gives you one clear mission for the next match.' },
]

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
    price: 'Free',
    period: '',
    desc: 'Foundational Rainbow Six strategies with no AI usage charge.',
    link: '/strats',
    features: [
      'Foundational attack and defense strategies',
      'Full operator catalog and role guidance',
      'Map, site, and key-callout reference',
      'No paid AI usage required',
      'Upgrade only when you want analysis or live tools',
    ],
  },
  {
    tier: 'Pro',
    tierKey: 'pro',
    price: '$9',
    regularPrice: '$12',
    period: '/mo',
    desc: 'Advanced strategies, AI analysis, and the optional PC Live Coach.',
    founding: true,
    trialDays: 30,
    link: PRO_CHECKOUT_LINK,
    features: [
      '30-day free trial — card up front, cancel anytime before it bills',
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
    price: '$39',
    period: '/mo',
    desc: 'The full self-service coaching system for players who use Recon 6 every week.',
    featured: true,
    link: ELITE_CHECKOUT_LINK,
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
    price: '$70',
    period: '/mo',
    desc: 'High-touch coaching: everything in Elite plus two live sessions with Aaron every month.',
    link: CHAMPION_CHECKOUT_LINK || '/coaching/index.html#book',
    cta: CHAMPION_CHECKOUT_AVAILABLE ? 'Start Champion membership' : 'Book a $20 first session',
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
        <div className="meta-strip-label">Most-banned targets</div>
        <ol className="meta-strip-list">
          {topBans.map((b, i) => (
            <li key={b.name}>
              <span className="meta-strip-rank">{i + 1}</span>
              <span className="meta-strip-name">{b.name}</span>
              <span className="meta-strip-count">{b.total} maps</span>
            </li>
          ))}
        </ol>
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
        <StratDisplay strat={current.data} side={current.side} gated={true} />
      </div>
    </div>
  )
}

const HERO_JOBS = [
  { slot: '01', operator: 'Thermite', role: 'Hard breach', job: 'Open the CEO double wall' },
  { slot: '02', operator: 'Thatcher', role: 'Support', job: 'Clear denial before the breach' },
  { slot: '03', operator: 'Nomad', role: 'Flank watch', job: 'Lock Spiral and back stairs' },
  { slot: '04', operator: 'Sledge', role: 'Vertical', job: 'Force anchors off default' },
  { slot: '05', operator: 'Iana', role: 'Entry intel', job: 'Drone the final execute' },
]

function HeroBriefing() {
  return (
    <div className="hero-briefing" aria-label="Example Recon 6 squad briefing">
      <div className="hero-briefing-topline">
        <div>
          <span className="hero-briefing-kicker">LIVE STRAT BRIEF</span>
          <strong>Bank · 2F CEO · Attack</strong>
        </div>
        <span className="hero-briefing-status"><i /> READY</span>
      </div>
      <div className="hero-briefing-plan">
        <div className="hero-briefing-phase">
          <span>THE CALL</span>
          <strong>Open CEO. Pin Spiral. Execute on the drone.</strong>
        </div>
        <div className="hero-briefing-clock">
          <span>PREP</span>
          <strong>0:42</strong>
        </div>
      </div>
      <div className="hero-job-list">
        {HERO_JOBS.map((job) => (
          <div className="hero-job" key={job.slot}>
            <span className="hero-job-slot">{job.slot}</span>
            <div className="hero-job-operator">
              <strong>{job.operator}</strong>
              <span>{job.role}</span>
            </div>
            <p>{job.job}</p>
          </div>
        ))}
      </div>
      <div className="hero-briefing-footer">
        <span><i /> 5 jobs synced</span>
        <Link to="/strats">Open full strat <span aria-hidden="true">→</span></Link>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const { user, isPro, plan } = useAuth()
  const { visible: testimonials } = useTestimonials()
  const { video: demoVideo } = useDemoVideo()
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState(null)
  // R6-ONLY (2026-07-06): the billing-scope toggle and All-Access SKUs are no
  // longer offered to NEW visitors — RECON6 is a Rainbow Six product. The
  // All-Access price IDs stay live in config/stripe.js and useAuth still
  // honors tier_scope 'all_access' so existing subscribers lose nothing.
  useReveal()

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
    <div className="recon-landing-v2">
      <section className="hero hero-v2">
        <div className="hero-v2-image" aria-hidden="true" />
        <div className="hero-v2-shade" aria-hidden="true" />
        <div className="hero-v2-grid" aria-hidden="true" />
        <div className="hero-v2-inner">
          <div className="hero-v2-copy">
            <div className="hero-badge hero-v2-badge">
              <span className="pulse-dot" />
              Built for real R6 rounds · Season {getCurrentSeason()}
            </div>
            <h1>
              Know the strat.<br />
              <span className="accent">Know your job.</span><br />
              Win more rounds.
            </h1>
            <p className="hero-subtitle">
              Pick the map, site, and side. Recon 6 gives your squad five clear operator jobs,
              then reviews the round and tells you what to fix next.
            </p>
            <div className="hero-cta hero-v2-cta">
              <Link
                to="/strats"
                className="btn btn-primary btn-lg"
                onClick={() => track('Hero CTA Click', { type: 'free-strat' })}
              >
                Open a free strat <span aria-hidden="true">→</span>
              </Link>
              <Link
                to="/vod?demo=1"
                className="btn btn-ghost btn-lg hero-cta-vod"
                onClick={() => track('Hero CTA Click', { type: 'vod-demo' })}
              >
                Review a round free
              </Link>
            </div>
            <div className="hero-v2-proof">
              <span><strong>25</strong> maps</span>
              <span><strong>107</strong> site setups</span>
              <span><strong>78</strong> operators</span>
              <span><i /> No signup to preview</span>
            </div>
          </div>
          <HeroBriefing />
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

      <section className="section workbook-launch-card" aria-labelledby="workbook-launch-heading">
        <div>
          <span className="section-label">New player field guide</span>
          <h2 id="workbook-launch-heading">Learn the round before you chase the rank.</h2>
          <p>64 pages, 357 fillable fields, a print-friendly edition, and a 30-day practice path for brand-new Siege players.</p>
          <div className="workbook-launch-facts">
            <span>$14.99 one time</span>
            <span>Private download</span>
            <span>7-day guarantee</span>
          </div>
        </div>
        <Link to="/beginner-guide" className="btn btn-primary">Preview the workbook</Link>
      </section>

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
            <span className="section-label">R6 ranked meta · live</span>
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
        <div className="testimonials-grid">
          {testimonials.map((t) => (
            <div className="testimonial-card" key={t.id || t.name}>
              <div className="testimonial-stars">{'\u2605\u2605\u2605\u2605\u2605'}</div>
              <p className="testimonial-text">\u201c{t.text}\u201d</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.initials}</div>
                <div className="testimonial-meta">
                  <strong>{t.name}</strong>
                  {t.rank && <span className="rank-up">{t.rank}</span>}
                </div>
              </div>
              {t.hours && <div className="testimonial-hours">{t.hours}</div>}
            </div>
          ))}
        </div>
      </section>
      )}

      <section className="section" id="features">
        <div className="section-header">
          <div className="section-label">More than a strat library</div>
          <h2>The plan is only useful if it changes your next round.</h2>
          <p>Recon 6 connects the briefing, your individual job, the mistake you made, and the correction you carry into the next match.</p>
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
            { id: 'apex', name: 'Apex Legends', short: 'APEX', color: '#9b51e0', status: 'LIVE' },
            { id: 'ow2', name: 'Overwatch 2', short: 'OW2', color: '#ff8c00', status: 'LIVE' },
            { id: 'mvr', name: 'Marvel Rivals', short: 'MVR', color: '#e62b50', status: 'LIVE' },
            { id: 'finals', name: 'The Finals', short: 'FINALS', color: '#00d4ff', status: 'LIVE' },
            { id: 'halo', name: 'Halo Infinite', short: 'HALO', color: '#5cb85c', status: 'LIVE' },
            { id: 'fn', name: 'Fortnite', short: 'FN', color: '#5d3fd3', status: 'LIVE' },
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
              <div style={{ fontSize: '0.78rem', color: 'rgba(230,233,239,0.85)', marginBottom: 6 }}>
                {g.name}
              </div>
              <div style={{
                display: 'inline-block',
                padding: '2px 8px',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                borderRadius: 999,
                color: g.status === 'LIVE' ? '#7ee2a4' : 'rgba(230,233,239,0.5)',
                background: g.status === 'LIVE' ? 'rgba(80,200,120,0.15)' : 'rgba(255,255,255,0.05)',
                border: g.status === 'LIVE' ? '1px solid #50c878' : '1px solid rgba(255,255,255,0.1)',
              }}>{g.status}</div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', color: 'rgba(230,233,239,0.6)', fontSize: '0.9rem', marginTop: '1.5rem', maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
          Rainbow Six goes deepest — every map, site, operator, and the AI VOD review. Your other games are covered too: maps, characters, loadouts, strats, and match prep, with more depth shipping every week.
          <strong style={{ color: '#00e5ff' }}> All-Access ($19/mo)</strong> adds every game to one plan as it grows.
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
        <div className="road-home-mission">
          <div className="road-home-mission-label">Example next-match mission</div>
          <strong>Drone the room you will enter—then act on what you saw.</strong>
          <p>Complete the behavior repeatedly in real matches. One lucky round does not mark the skill as mastered.</p>
        </div>
      </section>

      <section className="section section-dark" id="pricing">
        <div className="section-header">
          <div className="section-label">Pricing</div>
          <h2>Choose the Support You Need</h2>
          <p>Start with the free strategy foundation, add AI analysis when you use it, or include live coaching.</p>
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
          {PRICING.map((p) => {
            const foundingOpen = isFoundingOpen()
            const displayPrice = p.founding && !foundingOpen && p.regularPrice ? p.regularPrice : p.price
            // Lock checkout to the signed-in account's email. Subscriptions link
            // to a login by email alone, so paying with a different address
            // silently orphans them (billed, no access). Signed-out visitors are
            // unaffected — they type their email at Stripe and the post-checkout
            // page tells them to sign up with that same address.
            const displayLink = p.link.startsWith('http') ? withCheckoutEmail(p.link, user?.email) : p.link
            const showFounding = p.founding && foundingOpen
            const showRegular = showFounding && p.regularPrice
            return (
            <div className={`pricing-card${p.featured ? ' featured' : ''}`} key={p.tier}>
              {p.featured && <div className="pricing-popular">MOST POPULAR</div>}
              <div className="pricing-tier">{p.tier}</div>
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
              ) : (
                <a
                  href={displayLink}
                  target={displayLink.startsWith('http') ? '_blank' : undefined}
                  onClick={() => {
                    if (p.tier === 'Pro') track('Pricing CTA Click', { tier: 'pro', location: 'pricing-card' })
                    else if (p.tier === 'Elite') track('Pricing CTA Click', { tier: 'elite', location: 'pricing-card' })
                    else if (p.tier === 'Champion') track('Pricing CTA Click', { tier: 'champion', location: 'pricing-card' })
                    else if (p.price === 'Free') track('Free Tier CTA Click', { location: 'pricing-card' })
                  }}
                  className={`btn ${p.featured ? 'btn-primary' : 'btn-outline'}`}
                >
                  {p.cta || (p.price === 'Free' ? 'Get Started Free' : p.trialDays ? `Start ${p.trialDays}-day free trial` : 'Subscribe Now')}
                </a>
              )}
            </div>
            )
          })}
        </div>
        <p className="pricing-note">
          Pro starts with a 30-day trial. Website AI usage is capped, and extra usage is prepaid at ${AI_USAGE_PACK_AMOUNT} with no automatic overage. Recon 6 Command is included with paid Pro, Elite, and Champion accounts. Champion includes two live sessions.
        </p>
        {portalError && (
          <p className="pricing-note" style={{ color: '#ff6b6b' }}>
            {portalError} — you can also <Link to="/account">manage from Account</Link>.
          </p>
        )}

        {/* All-Access upsell REMOVED 2026-07-06 — R6-only. Existing All-Access
            subscribers keep their plans; new visitors see the R6-only membership ladder. */}
        {!R6_ONLY && <div
          style={{
            maxWidth: 920,
            margin: '2.5rem auto 0',
            padding: '1.5rem 2rem',
            background: 'linear-gradient(135deg, rgba(0,229,255,0.10), rgba(180,140,255,0.10))',
            border: '1px solid rgba(0,229,255,0.4)',
            borderRadius: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ flex: '1 1 360px' }}>
              <div style={{ color: '#00e5ff', fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                Recon 6 All-Access
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem' }}>
                Play more than just Siege? One plan covers your whole rotation.
              </h3>
              <p style={{ color: 'rgba(230,233,239,0.85)', margin: '0 0 0.75rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
                R6 is home — the deepest content plus AI VOD review. The same toolkit (strats, loadouts, match prep, meta board) is ready for CS2, Valorant, Call of Duty, Apex, Overwatch 2, Marvel Rivals, The Finals, Halo Infinite, Fortnite, and Rocket League — switch in the sidebar, no per-game upgrade.
              </p>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'rgba(230,233,239,0.7)' }}>
                <span><strong style={{ color: '#fff' }}>Pro+</strong> $19/mo — unlock all 20 games on Pro tier</span>
                <span><strong style={{ color: '#fff' }}>Champion+</strong> $49/mo — full Champion across all games</span>
                <span style={{ color: '#7ee2a4' }}>Annual: save 17%</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 200 }}>
              <a
                href="https://buy.stripe.com/00w4gAfbsbnK7MXfcu7ss0i"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('Pricing CTA Click', { tier: 'pro-all-access', location: 'all-access-banner' })}
                className="btn btn-primary"
              >
                Pro+ — $19/mo →
              </a>
              <a
                href="https://buy.stripe.com/eVq7sM8N4crO9V55BU7ss0j"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('Pricing CTA Click', { tier: 'champion-all-access', location: 'all-access-banner' })}
                className="btn btn-outline"
              >
                Champion+ — $49/mo →
              </a>
              <div style={{ fontSize: '0.78rem', color: 'rgba(230,233,239,0.55)', textAlign: 'center' }}>
                Annual options at checkout
              </div>
            </div>
          </div>
        </div>}
      </section>

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
            The strats are free. Open one map, pick a side, see how much it tells you.
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
            <Link to="/strats" className="btn btn-primary btn-lg">Open R6 Strats — Free</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
