import { useState, useEffect } from 'react'
import './App.css'

function AnimatedCounter({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const step = end / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [end, duration])
  return <>{count.toLocaleString()}{suffix}</>
}

const FEATURES = [
  {
    icon: '\uD83C\uDFAF',
    title: 'Live Callouts',
    desc: 'Real-time tactical callouts during ranked matches. Know when to push, hold, or rotate before the enemy does.',
  },
  {
    icon: '\uD83D\uDDFA\uFE0F',
    title: 'Map Strategies',
    desc: 'Deep strats for every map in the ranked pool. Default executes, retakes, and site setups used by pros.',
  },
  {
    icon: '\uD83D\uDEE1\uFE0F',
    title: 'Operator Picks',
    desc: 'Smart operator suggestions based on your team comp, map, and site. Build the perfect lineup every round.',
  },
  {
    icon: '\uD83D\uDCC8',
    title: 'Rank Tracking',
    desc: 'Track your MMR, win rate, and improvement over time. See exactly what\'s working and what needs fixing.',
  },
  {
    icon: '\uD83C\uDFAC',
    title: 'VOD Review',
    desc: 'AI-powered round analysis that spots your mistakes. Actionable feedback on positioning, timing, and utility.',
  },
  {
    icon: '\uD83D\uDC65',
    title: 'Team Coordination',
    desc: 'Coordinate your five-stack with role assignments, operator bans, and attack/defense game plans.',
  },
]

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
  { num: '01', title: 'Connect', desc: 'Link your Siege account and let Ghost IGL analyze your play style, rank history, and operator pool.' },
  { num: '02', title: 'Learn', desc: 'Get personalized strats, callouts, and operator picks tailored to your rank and the maps you play.' },
  { num: '03', title: 'Play', desc: 'Queue ranked with Ghost IGL running live. Get real-time callouts and tactical suggestions mid-match.' },
  { num: '04', title: 'Climb', desc: 'Watch your rank climb as your game sense, positioning, and decision-making improve every session.' },
]

const COMPARE = [
  { feature: 'You actually improve', ghost: true, boost: false, coach: true },
  { feature: 'Available 24/7', ghost: true, boost: true, coach: false },
  { feature: 'No account sharing risk', ghost: true, boost: false, coach: true },
  { feature: 'Real-time in-match help', ghost: true, boost: false, coach: false },
  { feature: 'Personalized to your rank', ghost: true, boost: false, coach: true },
  { feature: 'Affordable monthly pricing', ghost: true, boost: false, coach: false },
  { feature: 'Keep your rank permanently', ghost: true, boost: false, coach: true },
  { feature: 'No scheduling needed', ghost: true, boost: true, coach: false },
]

const TESTIMONIALS = [
  {
    text: 'I was hard-stuck Gold for three seasons. Ghost IGL taught me rotations and site setups I never would have figured out alone. Hit Platinum in two weeks flat.',
    name: 'FragHunter',
    rank: 'Gold \u2192 Platinum',
    initials: 'FH',
    hours: '47 hours played',
  },
  {
    text: 'The live callouts are insane. It\'s like having a diamond player whispering in your ear every round. My game sense jumped overnight. Worth every penny.',
    name: 'ValkMain_',
    rank: 'Silver \u2192 Gold',
    initials: 'VM',
    hours: '32 hours played',
  },
  {
    text: 'Finally broke into Diamond after being Plat for a year. The VOD reviews showed me I was wasting utility every single round. Absolute game changer.',
    name: 'AceOfSiege',
    rank: 'Platinum \u2192 Diamond',
    initials: 'AS',
    hours: '89 hours played',
  },
]

const PRICING = [
  {
    tier: 'Recruit',
    price: 'Free',
    period: '',
    desc: 'Get started with basic strategy guides',
    link: '#',
    features: [
      'Map overviews for ranked pool',
      'Basic operator tier lists',
      'Community Discord access',
      'Weekly strategy articles',
    ],
  },
  {
    tier: 'Pro',
    price: '$12',
    period: '/mo',
    desc: 'Everything you need to climb',
    featured: true,
    link: 'https://buy.stripe.com/00weVe0gygI4c3d3tM7ss0a',
    features: [
      'Live AI callouts in-match',
      'Personalized operator picks',
      'AI VOD review (10/month)',
      'Rank tracking dashboard',
      'Advanced map strategies',
      'Priority Discord support',
    ],
  },
  {
    tier: 'Champion',
    price: '$29',
    period: '/mo',
    desc: 'For players who want it all',
    link: 'https://buy.stripe.com/aFa5kE9R84Zmc3d7K27ss0b',
    features: [
      'Everything in Pro',
      'Unlimited VOD reviews',
      'Team coordination tools',
      'Custom strat builder',
      'Scrim analysis',
      '1-on-1 coaching sessions',
      'Early access to new features',
    ],
  },
]

const FAQ = [
  {
    q: 'Is Ghost IGL a boosting service?',
    a: 'No. Ghost IGL is an AI coaching tool that helps YOU improve. Nobody else plays your account. You earn your rank through better game sense, positioning, and decision-making.',
  },
  {
    q: 'Will I get banned for using Ghost IGL?',
    a: 'No. Ghost IGL runs as a separate overlay and does not modify game files, inject code, or interact with the game client in any way. It\'s fully compliant with Ubisoft\'s terms of service.',
  },
  {
    q: 'How do live callouts work?',
    a: 'Ghost IGL uses screen analysis and game state tracking to provide real-time tactical suggestions through an overlay. It tells you when to rotate, where enemies are likely pushing, and which angles to hold.',
  },
  {
    q: 'What ranks does Ghost IGL support?',
    a: 'Ghost IGL works for all ranks from Copper to Champion. Strategies and callouts are tailored to your specific rank, so you get advice that\'s relevant to the opponents you\'re actually facing.',
  },
  {
    q: 'Can I use Ghost IGL with a team?',
    a: 'Yes. The Champion plan includes team coordination tools. You can share strats with your squad, assign roles, and plan operator lineups together before queuing.',
  },
  {
    q: 'What maps are supported?',
    a: 'All maps in the current ranked rotation. Strategies are updated within 48 hours whenever the ranked pool changes or a new season drops.',
  },
]

function FaqItem({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-item${open ? ' open' : ''}`} onClick={() => setOpen(!open)}>
      <div className="faq-question">
        <span>{item.q}</span>
        <span className="faq-toggle">{open ? '\u2212' : '+'}</span>
      </div>
      {open && <div className="faq-answer">{item.a}</div>}
    </div>
  )
}

function App() {
  const [mobileMenu, setMobileMenu] = useState(false)

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-logo">
          Ghost <span>IGL</span>
        </div>
        <ul className={`navbar-links${mobileMenu ? ' show' : ''}`}>
          <li><a href="#features" onClick={() => setMobileMenu(false)}>Features</a></li>
          <li><a href="#how-it-works" onClick={() => setMobileMenu(false)}>How It Works</a></li>
          <li><a href="#compare" onClick={() => setMobileMenu(false)}>Why Us</a></li>
          <li><a href="#pricing" onClick={() => setMobileMenu(false)}>Pricing</a></li>
        </ul>
        <div className="navbar-right">
          <div className="live-dot" />
          <span className="live-count">2,847 players online</span>
          <a href="#pricing" className="btn btn-primary btn-sm">Start Free</a>
        </div>
        <button className="mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-grid-bg" />
        <div className="hero-glow" />
        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot" />
            Rainbow Six Siege &mdash; Season Y9S4
          </div>
          <h1>
            Stop Getting <span className="accent">Boosted.</span><br />
            Start Getting <span className="accent">Better.</span>
          </h1>
          <p className="hero-subtitle">
            Ghost IGL is the AI-powered In-Game Leader that coaches you in real time.
            Live callouts, map strats, and operator picks &mdash; your rank, earned by you.
          </p>
          <div className="hero-cta">
            <a href="#pricing" className="btn btn-primary btn-lg">Get Ghost IGL &mdash; It's Free</a>
            <a href="#how-it-works" className="btn btn-ghost btn-lg">See How It Works</a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <strong><AnimatedCounter end={14829} /></strong>
              <span>Active Players</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <strong><AnimatedCounter end={2} suffix="+" />M</strong>
              <span>Rounds Analyzed</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <strong><AnimatedCounter end={94} suffix="%" /></strong>
              <span>Rank Up in 30 Days</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-item">
          <span className="trust-icon">{'\u2713'}</span> No Account Sharing
        </div>
        <div className="trust-item">
          <span className="trust-icon">{'\u2713'}</span> TOS Compliant
        </div>
        <div className="trust-item">
          <span className="trust-icon">{'\u2713'}</span> Cancel Anytime
        </div>
        <div className="trust-item">
          <span className="trust-icon">{'\u2713'}</span> 24/7 AI Coaching
        </div>
      </div>

      {/* Features */}
      <section className="section" id="features">
        <div className="section-header">
          <div className="section-label">Features</div>
          <h2>Everything You Need to Rank Up</h2>
          <p>The tools that pro players and coaches use &mdash; powered by AI, available 24/7, for a fraction of the cost.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-dark" id="how-it-works">
        <div className="section-header">
          <div className="section-label">How It Works</div>
          <h2>From Install to Champion in 4 Steps</h2>
          <p>Get set up in under 2 minutes. No downloads, no plugins, no BS.</p>
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

      {/* Comparison */}
      <section className="section" id="compare">
        <div className="section-header">
          <div className="section-label">Why Ghost IGL</div>
          <h2>Ghost IGL vs The Competition</h2>
          <p>Boosting services play your account. Coaches cost $50+/hour. Ghost IGL is better than both.</p>
        </div>
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th></th>
                <th className="compare-highlight">Ghost IGL</th>
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

      {/* Rank Progression */}
      <section className="section section-dark" id="ranks">
        <div className="section-header">
          <div className="section-label">Progression</div>
          <h2>Your Climb to Champion</h2>
          <p>Ghost IGL has helped players break through every rank ceiling in Siege.</p>
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

      {/* Testimonials */}
      <section className="section" id="testimonials">
        <div className="section-header">
          <div className="section-label">Testimonials</div>
          <h2>Players Are Ranking Up</h2>
          <p>Real results from real Siege players using Ghost IGL.</p>
        </div>
        <div className="testimonials-grid">
          {TESTIMONIALS.map((t) => (
            <div className="testimonial-card" key={t.name}>
              <div className="testimonial-stars">{'★★★★★'}</div>
              <p className="testimonial-text">{t.text}</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.initials}</div>
                <div className="testimonial-meta">
                  <strong>{t.name}</strong>
                  <span className="rank-up">{t.rank}</span>
                </div>
              </div>
              <div className="testimonial-hours">{t.hours}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="section section-dark" id="pricing">
        <div className="section-header">
          <div className="section-label">Pricing</div>
          <h2>Choose Your Loadout</h2>
          <p>Start free. Upgrade when you're ready to climb. Cancel anytime.</p>
        </div>
        <div className="pricing-grid">
          {PRICING.map((p) => (
            <div className={`pricing-card${p.featured ? ' featured' : ''}`} key={p.tier}>
              <div className="pricing-tier">{p.tier}</div>
              <div className="pricing-price">
                {p.price}
                {p.period && <span>{p.period}</span>}
              </div>
              <p className="pricing-desc">{p.desc}</p>
              <ul className="pricing-features">
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <a href={p.link} target={p.link.startsWith('http') ? '_blank' : undefined} className={`btn ${p.featured ? 'btn-primary' : 'btn-outline'}`}>
                {p.price === 'Free' ? 'Get Started Free' : 'Subscribe Now'}
              </a>
            </div>
          ))}
        </div>
        <p className="pricing-note">All plans include a 7-day money-back guarantee. No questions asked.</p>
      </section>

      {/* FAQ */}
      <section className="section" id="faq">
        <div className="section-header">
          <div className="section-label">FAQ</div>
          <h2>Got Questions?</h2>
          <p>Everything you need to know about Ghost IGL.</p>
        </div>
        <div className="faq-list">
          {FAQ.map((item) => (
            <FaqItem key={item.q} item={item} />
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Stop Losing MMR?</h2>
          <p>Join 14,000+ Siege players who are actually getting better &mdash; not just getting boosted.</p>
          <a href="#pricing" className="btn btn-primary btn-lg">Get Ghost IGL &mdash; It's Free</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">Ghost <span>IGL</span></div>
            <p className="footer-tagline">AI-powered coaching for Rainbow Six Siege.<br />Your rank, earned by you.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Community</h4>
            <ul>
              <li><a href="#discord">Discord</a></li>
              <li><a href="#twitter">Twitter / X</a></li>
              <li><a href="#youtube">YouTube</a></li>
              <li><a href="#twitch">Twitch</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#refund">Refund Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Ghost IGL. Not affiliated with Ubisoft Entertainment.</p>
          <div className="payment-badges">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>PayPal</span>
            <span>Apple Pay</span>
          </div>
        </div>
      </footer>
    </>
  )
}

export default App
