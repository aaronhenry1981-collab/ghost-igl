import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentSeason } from '../utils/season'
// All-Access link/amount imports removed 2026-07-06 (R6-only) — the constants
// stay exported from config/stripe.js for existing subscribers' plumbing.
import {
  PRO_CHECKOUT_LINK,
  CHAMPION_CHECKOUT_LINK,
} from '../config/stripe'
import { isFoundingOpen } from '../config/founding'
import { track } from '../utils/analytics'
import EmailCapture from '../components/EmailCapture'
import FoundingCountdown from '../components/FoundingCountdown'
import StratDisplay from '../components/strats/StratDisplay'
import STRATS from '../data/strats'
import META from '../data/meta'
import { useAuth } from '../hooks/useAuth'
import { useTestimonials } from '../hooks/useTestimonials'

// R6-ONLY flag (2026-07-06): RECON6 is a Rainbow Six product. The multi-game
// showcase and All-Access upsell JSX below are kept behind this flag instead
// of deleted — flip to false to instantly restore them if the direction
// changes. Existing All-Access subscribers are unaffected either way.
const R6_ONLY = true

// Days until the expected Y11S3 launch — SAME date as scripts/generate-countdown.mjs
// (bump both each season; the /countdown/ page is the source of truth users see).
// Computed once at module load: day-granularity, so no live ticking needed here.
const Y11S3_DAYS_LEFT = Math.max(0, Math.ceil((Date.parse('2026-09-01T13:00:00Z') - Date.now()) / 86400000))
import { useDemoVideo } from '../hooks/useDemoVideo'
import { useReveal } from '../hooks/useReveal'
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
    title: 'Walk Into Every Map Prepared',
    desc: 'Site-by-site breakdowns for every ranked R6 map: who to pick, who to ban, where to set up, what callouts to use. Pull it up in 5 seconds before the round starts.',
    link: '/strats',
  },
  {
    icon: 'roster',
    title: 'Stop Guessing Who to Pick',
    desc: 'Get the lineup the meta actually supports for your map, side, and role — not whatever your duo last saw on YouTube. Every recommendation has a reason behind it.',
    link: '/strats',
  },
  {
    icon: 'catalog',
    title: 'Every Operator, One Search',
    desc: 'Every Siege operator, indexed by role, kit, and the sites where they win. Find the right pick in seconds instead of scrolling Reddit.',
    link: '/operators',
  },
  {
    icon: 'meta',
    title: 'See What\'s Actually Working',
    desc: 'Top picks, biggest ban targets, and map complexity at your rank — refreshed every season. Stop running last patch\'s loadout when the meta has already moved.',
    link: '/meta',
  },
  {
    icon: 'vod',
    title: 'Find Out Exactly Why You Lost the Round',
    desc: 'Drop 1–10 screenshots from a match — death cams, post-plant freezes, scoreboards. You get a specific fix per shot ("you held off-angle on the wrong window") instead of generic "use utility better" advice. Live today for R6.',
    link: '/vod?demo=1',
  },
  {
    icon: 'bans',
    title: 'Ban the Operator That\'s Killing You',
    desc: 'Data-driven ban targets per map with the reasoning. Stop banning Jackal every round out of habit when the actual problem is the Bandit on the wall behind you.',
    link: '/strats',
  },
  {
    icon: 'predict',
    title: 'Know What They\'ll Do Before They Do It',
    desc: 'The standard executes, the standard setups, the standard re-aggression timing — for any map and side. Counter-strat the meta, not the last clip you watched.',
    link: '/strats',
  },
  {
    icon: 'squad',
    title: 'Plays That Work With Your Stack',
    desc: 'Solo, duo, three-stack, full squad — you get a different role and different priorities. Recon 6 tells you which one to take.',
    link: '/strats',
  },
  {
    icon: 'plan',
    title: 'A Weekly Drill List Built From Your Own VODs',
    desc: 'After a few uploads we know your patterns. You get 3–5 specific drills per week (e.g. "Bandit-trick the next 20 reinforce attempts on Bank") so practice actually moves the needle.',
    link: '/vod?demo=1',
    badge: 'Champion',
  },
  {
    icon: 'kit',
    title: 'Held Accountable for the Pick You Made',
    desc: 'Brought Thatcher and never EMPed a battery? Picked Sova and never threw a Recon Bolt? Recon 6 calls it out so you stop wasting picks on operators you\'re not using.',
    link: '/vod?demo=1',
    badge: 'Champion',
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

const RANKS = [
  { name: 'Copper', color: '#a35129' },
  { name: 'Bronze', color: '#cd7f32' },
  { name: 'Silver', color: '#a8a8a8' },
  { name: 'Gold', color: '#ffd700' },
  { name: 'Platinum', color: '#3ec9d1' },
  { name: 'Emerald', color: '#2ecc71' },
  { name: 'Diamond', color: '#b388ff' },
  { name: 'Champion', color: '#00e5ff' },
]

const STEPS = [
  { num: '01', title: 'Pick Your Game & Role', desc: 'Choose one of the 11 supported games and tell Recon 6 how you play — Entry, Support, Anchor, IGL, AWPer, Duelist, 1st Man, whatever fits. Every strat is filtered to your playstyle.' },
  { num: '02', title: 'Open the Map You\'re Loading Into', desc: 'Pull up any map in seconds. Sites, callouts, common executes, and the lineup the meta supports — all in one screen.' },
  { num: '03', title: 'Study the Strat', desc: 'Character picks, positioning, callouts, and utility usage. Plus what to ban and how the enemy is most likely to set up.' },
  { num: '04', title: 'Review Your Gameplay', desc: 'Drop 1-10 screenshots from a match — death cams, post-plant freezes, scoreboards. The AI references the actual map, your character, and the strats — and tells you what to fix.' },
]

const COMPARE = [
  { feature: 'You actually improve', ghost: true, boost: false, coach: true },
  { feature: 'Available 24/7', ghost: true, boost: true, coach: false },
  { feature: 'No account sharing risk', ghost: true, boost: false, coach: true },
  { feature: 'Every map + site covered', ghost: true, boost: false, coach: false },
  { feature: 'Every operator indexed + searchable', ghost: true, boost: false, coach: false },
  { feature: 'Personalized to your main role', ghost: true, boost: false, coach: true },
  { feature: 'Round-by-round VOD breakdowns', ghost: true, boost: false, coach: true },
  { feature: 'Affordable monthly pricing', ghost: true, boost: false, coach: false },
  { feature: 'Keep your rank permanently', ghost: true, boost: false, coach: true },
  { feature: 'No scheduling needed', ghost: true, boost: true, coach: false },
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
    tier: 'Recruit',
    price: 'Free',
    period: '',
    desc: 'A real taste — the operator catalog and two full sample maps. Start a trial for the rest.',
    link: '/strats',
    features: [
      'Full operator catalog — who to pick, every op',
      'Two sample maps, full free-tier detail (Bank & Coastline)',
      'Key callouts — click to copy',
      'Discord community access',
      'Start a 30-day trial anytime to unlock everything',
    ],
  },
  {
    tier: 'Pro',
    price: '$9',
    regularPrice: '$12',
    period: '/mo',
    desc: 'Start free for 30 days — the deep intel that wins rounds, all unlocked.',
    featured: true,
    founding: true,
    trialDays: 30,
    link: PRO_CHECKOUT_LINK,
    features: [
      '30-day free trial — card up front, cancel anytime before it bills',
      'Everything in Recruit',
      '+ Round-by-round breakdowns — upload 5 screenshots per session, get specific fixes',
      '+ Tells you exactly which utility to use, where, and when',
      '+ The right ban for every map (with reasoning so you remember why)',
      '+ Read the enemy\'s likely setup before round start',
      '+ Plays scaled to your squad size — solo to full stack',
      '+ Priority Discord support',
      'Pro applies to one game of your choice — switch in the sidebar anytime',
    ],
  },
  {
    tier: 'Champion',
    price: '$29',
    regularPrice: '$39',
    period: '/mo',
    desc: 'Start free for 30 days — Pro plus deeper VOD analysis, practice plans, and every map unlocked.',
    founding: true,
    trialDays: 30,
    link: CHAMPION_CHECKOUT_LINK,
    features: [
      '30-day free trial — card up front, cancel anytime before it bills',
      'Everything in Pro',
      '+ Review a full round at once — upload up to 10 screenshots per session',
      '+ Held accountable for every pick (did you actually use the gadget?)',
      '+ Recurring-weakness reports across all your sessions',
      '+ A weekly drill list built from your own clips (3–5 specific reps)',
      '+ Every R6 legacy map unlocked (Favela, Fortress, Hereford, House, Kanal)',
      '+ Premium tactics — spawn-kills, runouts, anti-spawn-peek setups',
      '+ Recon 6 Command desktop app (beta — for power users)',
      '+ Early access to new features',
    ],
  },
]

const FAQ = [
  {
    q: 'What does Recon 6 actually do for me?',
    a: 'Two things. First, it pulls every callout, lineup, ban target, and site setup for any map into one screen so you walk into the round prepared instead of guessing. Second, you can upload screenshots from your matches and get a specific breakdown of what cost you the round — with a fix you can use next game, not vague tips. The result: you stop losing rounds you should win, and you climb faster.',
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
    a: 'No. Recon 6 is a website that shows you reference data and reviews screenshots you upload. It does not inject into any game, modify game files, or interact with any game client. The optional Champion-tier desktop app reads your screen via OCR (the same way OBS does) and never touches the game process.',
  },
  {
    q: 'What does a VOD breakdown actually look like?',
    a: 'Drop 1–10 screenshots from a match — death cams, post-plant freezes, end-of-round scoreboards. You get back: the specific mistake on each shot ("you held off-angle on the wrong window"), the recurring patterns across the session, and a fix you can apply next round. Not "use utility better." Specifics. Pro reviews 5 screenshots per session; Champion reviews 10 and stitches patterns across multiple sessions.',
  },
  {
    q: 'What ranks does Recon 6 help?',
    a: 'Every rank, Copper to Champion. The site adjusts the read to your skill level — you don\'t need pro-tier lineups to climb out of Bronze, you need the basics done correctly. As you climb, the depth scales with you.',
  },
  {
    q: 'Pro or Champion — which one fits me?',
    a: 'Pro gives you the strats plus AI VOD breakdowns — the right pick for most players who want to climb. Champion adds a structured-climb layer: weekly drill plans built from your own clips, recurring-weakness reports, full-round reviews, and the desktop coach app.',
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

export default function LandingPage() {
  const { user, isPro } = useAuth()
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
    <>
      <section className="hero">
        <div className="hero-grid-bg" />
        <div className="hero-glow" />
        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot" />
            Recon 6 · Rainbow Six Siege · Season {getCurrentSeason()}
          </div>
          <h1>
            AI-augmented coaching for <br />
            <span className="accent">Rainbow Six</span>.
          </h1>
          <p className="hero-subtitle">
            A human coach backed by a full AI staff: VOD breakdowns of your actual rounds,
            death-cause tracking across sessions, and live ranked plans for every map and site.
            The AI finds what's costing you rounds — your coach fixes it with you.
            First session is free, console and PC, any rank.
          </p>
          {/* COACHING-FIRST (2026-07-06 master command): the paid-intro CTA is
              primary; the AI VOD demo stays co-primary as the try-it-now path.
              AI is the headline, never hidden. First session is 50% off ($20). */}
          <div className="hero-cta">
            <a
              href="/coaching/"
              className="btn btn-primary btn-lg"
              onClick={() => track('Hero CTA Click', { type: 'coaching-intro-paid' })}
            >
              Book your first session — 50% off ($20)
            </a>
            <Link
              to="/vod?demo=1"
              className="btn btn-ghost btn-lg hero-cta-vod"
              onClick={() => track('Hero CTA Click', { type: 'vod-demo' })}
            >
              ▶ Try AI VOD Review — Free
            </Link>
            <a
              href="#pricing"
              onClick={(e) => {
                e.preventDefault()
                track('Pricing CTA Click', { tier: 'pro', location: 'hero' })
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="btn btn-ghost btn-lg"
            >
              See plans & pricing
            </a>
          </div>
          <div className="hero-cta-sub" style={{ textAlign: 'center', fontSize: '0.85rem', color: 'rgba(230,233,239,0.65)', marginTop: '0.5rem' }}>
            Drop a screenshot from any match. We tell you exactly what cost you the round, with a fix you can use next game. <strong style={{ color: '#00e5ff' }}>No signup to try.</strong>
          </div>
          {isFoundingOpen() && (
            <div className="hero-tertiary" style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
              <FoundingCountdown variant="pill" />
            </div>
          )}
          <div className="hero-tertiary" style={{ display: 'flex', gap: 16, justifyContent: 'center', fontSize: '0.85rem' }}>
            <Link to="/strats">Or browse R6 Strats (free) →</Link>
            <Link to="/live">Try Live Coach →</Link>
            {/* Season countdown badge — target date lives in ONE place:
                scripts/generate-countdown.mjs (bump it each season). This badge
                intentionally recomputes from the same expected date so the two
                never disagree by more than the config constant. */}
            <a href="/countdown/" style={{ color: '#00e5ff' }}>
              ⏳ Y11S3 in ~{Y11S3_DAYS_LEFT} days →
            </a>
          </div>
          <div className="hero-micro-trust">
            <span>✓ No credit card to try</span>
            <span>✓ Free tier covers every R6 ranked map</span>
            <span>✓ 7-day money-back on any plan</span>
          </div>
          {/* R6-only stats (2026-07-06) — real numbers counted from strats.js:
              25 maps, 107 sites with full setups. Operator count = full Siege
              roster incl. crossovers. Update alongside data, not vibes. */}
          <div className="hero-stats">
            <div className="hero-stat">
              <strong><AnimatedCounter end={25} /></strong>
              <span>R6 Maps Covered</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <strong><AnimatedCounter end={107} /></strong>
              <span>Sites With Full Setups</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <strong><AnimatedCounter end={78} /></strong>
              <span>Operators Indexed</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <strong><AnimatedCounter end={24} />/7</strong>
              <span>AI Coach On Call</span>
            </div>
          </div>
        </div>
      </section>

      <div className="trust-bar">
        <div className="trust-item"><span className="trust-icon">{'\u2713'}</span> No Account Sharing</div>
        <div className="trust-item"><span className="trust-icon">{'\u2713'}</span> TOS-Safe by Design</div>
        <div className="trust-item"><span className="trust-icon">{'\u2713'}</span> Cancel in One Click</div>
        <div className="trust-item"><span className="trust-icon">{'\u2713'}</span> Refreshed Every Season</div>
      </div>

      {/* Testimonials moved directly under the hero (2026-07-06 coherence
          pass) \u2014 social proof belongs before the feature tour, not below it. */}
      {testimonials.length > 0 && (
      <section className="section" id="testimonials">
        <div className="section-header">
          <div className="section-label">Testimonials</div>
          <h2>Players Are Ranking Up</h2>
          <p>Real climbs from R6 players who use Recon 6.</p>
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
          <div className="section-label">Features</div>
          <h2>Everything You Need to Rank Up</h2>
          <p>What a pro coach would tell you about your map, your pick, and your last round — available the moment you need it, for a fraction of the cost.</p>
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
          <p>No downloads, no plugins, no friction. Open the site, pick your game, climb.</p>
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

      <section className="section" id="preview">
        <div className="section-header">
          <div className="section-label">Live Preview — R6</div>
          <h2>Try a Real Strat — No Signup</h2>
          <p>An honest preview of what every site looks like inside Recon 6. Pick an R6 map and side, see real tactical content — the full utility / character / callout breakdown unlocks on Pro.</p>
        </div>
        <StratPreview />
        <div className="section-sub-header">
          <div className="section-label">R6 Ranked Meta — Live</div>
          <h3>What’s defining the R6 ranked pool right now</h3>
        </div>
        <MetaStrip />
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

      <section className="section" id="compare">
        <div className="section-header">
          <div className="section-label">Why Recon 6</div>
          <h2>Recon 6 vs The Competition</h2>
          <p>Boosting services play your account. Human coaches cost $50+/hour and only know one game. Recon 6 does the work of both for the price of a pizza.</p>
        </div>
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th></th>
                <th className="compare-highlight">Recon 6</th>
                <th>Boosting</th>
                <th>Human Coach</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row) => (
                <tr key={row.feature}>
                  <td>{row.feature}</td>
                  <td className="compare-highlight">{row.ghost ? '\u2713' : '\u2717'}</td>
                  <td>{row.boost ? '\u2713' : '\u2717'}</td>
                  <td>{row.coach ? '\u2713' : '\u2717'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section section-dark" id="ranks">
        <div className="section-header">
          <div className="section-label">Progression</div>
          <h2>Your Climb to Champion</h2>
          <p>Recon 6 has helped players break through every rank ceiling in Siege.</p>
        </div>
        <div className="ranks-track">
          {RANKS.map((r, i) => (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center' }}>
              <div className="rank-node">
                <div className="rank-diamond" style={{ color: r.color, borderColor: r.color }} />
                <span className="rank-label" style={{ color: r.color }}>{r.name}</span>
              </div>
              {i < RANKS.length - 1 && <div className="rank-connector" />}
            </div>
          ))}
        </div>
      </section>

      <section className="section section-dark" id="pricing">
        <div className="section-header">
          <div className="section-label">Pricing</div>
          <h2>Choose Your Loadout</h2>
          <p>Start free. Upgrade when you're ready to climb. Cancel anytime.</p>
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
              <p>If Recon 6 doesn't help you climb, we refund you. No questions, no argument.</p>
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
              <strong>Your rank stays yours</strong>
              <p>Nobody ever logs into your account. Ubisoft TOS safe by design.</p>
            </div>
          </div>
        </div>
        {/* Billing-scope toggle REMOVED 2026-07-06 — R6-only: pricing is just
            Pro + Champion for Rainbow Six. All-Access SKUs live on for
            existing subscribers (config/stripe.js + useAuth tier_scope). */}
        <div className="pricing-grid">
          {PRICING.map((p) => {
            const displayPrice = p.price
            const displayLink = p.link
            const showFounding = p.founding
            const showRegular = p.regularPrice
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
                  {portalLoading ? 'Opening…' : 'Manage Subscription'}
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
                    else if (p.tier === 'Champion') track('Pricing CTA Click', { tier: 'champion', location: 'pricing-card' })
                    else if (p.price === 'Free') track('Free Tier CTA Click', { location: 'pricing-card' })
                  }}
                  className={`btn ${p.featured ? 'btn-primary' : 'btn-outline'}`}
                >
                  {p.price === 'Free' ? 'Get Started Free' : p.trialDays ? `Start ${p.trialDays}-day free trial` : 'Subscribe Now'}
                </a>
              )}
            </div>
            )
          })}
        </div>
        <p className="pricing-note">Paid plans start with a 30-day free trial — cancel anytime before it bills and you're never charged.</p>
        {portalError && (
          <p className="pricing-note" style={{ color: '#ff6b6b' }}>
            {portalError} — you can also <Link to="/account">manage from Account</Link>.
          </p>
        )}

        {/* All-Access upsell REMOVED 2026-07-06 — R6-only. Existing All-Access
            subscribers keep their plans; new visitors only see Pro/Champion. */}
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
          <h2>Got Questions?</h2>
          <p>Everything you need to know about Recon 6.</p>
        </div>
        <div className="faq-list">
          {FAQ.map((item) => (<FaqItem key={item.q} item={item} />))}
        </div>
      </section>

      <section className="section" id="newsletter">
        <div className="section-header">
          <EmailCapture />
        </div>
      </section>

      {/* Featured rank-up guides — gives the homepage internal links to the
          highest-SEO-potential posts so they inherit crawl equity from the
          root domain. Without these direct links the homepage's PageRank
          can't flow to individual posts (Google crawls /blog/ → posts, but
          gives less weight than a direct homepage link). */}
      <section className="section" id="featured-guides">
        <div className="section-header">
          <div className="section-label">Free Guides</div>
          <h2>Specific Rank-Up Playbooks</h2>
          <p>Long-form guides with the exact tactics, drills, and habits that move you up a rank in each game. Written by players, not AI-generated SEO mush.</p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
            maxWidth: 1100,
            margin: '0 auto',
          }}
        >
          {[
            { href: '/blog/lol-champion-tier-list-2026.html', game: 'League of Legends', title: 'LoL Champion Tier List 2026', sub: 'S/A/B/C picks per role — top, jungle, mid, ADC, support — for the current meta patch.' },
            { href: '/blog/tekken-8-tier-list-2026.html', game: 'Tekken 8', title: 'Tekken 8 Tier List 2026', sub: 'Character rankings by archetype — Mishima, rushdown, grappler, counter, all-rounder.' },
            { href: '/blog/ow2-stadium-tier-list.html', game: 'OW2 Stadium', title: 'OW2 Stadium Tier List 2026', sub: 'S/A/B/C tiers for every Stadium hero, ranked by build ceiling + R7 impact.' },
            { href: '/blog/eafc-best-formations-2026.html', game: 'EA Sports FC', title: 'EA FC Best Formations 2026', sub: '4-3-3 vs 4-2-3-1 vs 5-3-2 — when each wins, custom tactics presets, FUT chemistry.' },
            { href: '/blog/r6-copper-to-bronze.html', game: 'R6 Siege', title: 'How to Climb Out of Copper', sub: 'The 5 operators to main, drone discipline, reinforcement priority.' },
            { href: '/blog/pubg-best-drops-2026.html', game: 'PUBG', title: 'Best PUBG Drop Locations 2026', sub: 'Drop strategy per map — Erangel, Miramar, Sanhok — with loot priority and rotation paths.' },
            { href: '/blog/dota-2-hero-tier-list-2026.html', game: 'Dota 2', title: 'Dota 2 Hero Tier List 2026', sub: 'Position 1-5 rankings, item priority, draft logic for current patch.' },
            { href: '/blog/valorant-iron-to-bronze.html', game: 'VALORANT', title: 'How to Climb Out of Iron', sub: 'Crosshair placement, agent picks, util usage that wins Iron rounds.' },
          ].map((post) => (
            <a
              key={post.href}
              href={post.href}
              style={{
                display: 'block',
                padding: '1.1rem 1.2rem',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
              className="card-hover"
            >
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#00e5ff', fontWeight: 700, marginBottom: 6 }}>
                {post.game}
              </div>
              <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: 6, lineHeight: 1.3 }}>
                {post.title}
              </strong>
              <p style={{ margin: 0, color: 'rgba(230,233,239,0.7)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                {post.sub}
              </p>
            </a>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a href="/blog/" className="btn btn-ghost btn-sm">All 98 Guides →</a>
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
    </>
  )
}
