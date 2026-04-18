import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentSeason } from '../utils/season'
import EmailCapture from '../components/EmailCapture'

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
  { icon: '\uD83D\uDDFA\uFE0F', title: 'Map Strategies', desc: 'Deep strats for every map in the ranked pool. Default executes, retakes, and site setups used by pros.', link: '/strats' },
  { icon: '\uD83D\uDEE1\uFE0F', title: 'Operator Picks', desc: 'Smart operator suggestions based on map, site, and side. Build the perfect lineup every round.', link: '/strats' },
  { icon: '\uD83C\uDFAC', title: 'AI VOD Review', desc: 'Upload a gameplay screenshot and get instant AI-powered coaching. Feedback on positioning, crosshair, and utility.', link: '/vod' },
  { icon: '\uD83D\uDEAB', title: 'Operator Bans', desc: 'Know exactly who to ban on every map. Data-driven ban recommendations with reasoning for attack and defense.', link: '/strats' },
  { icon: '\uD83D\uDD2E', title: 'Enemy Predictions', desc: 'Predict what your opponents will pick and how they\'ll play. Counter-strat before the round even starts.', link: '/strats' },
  { icon: '\uD83D\uDC65', title: 'Squad Coaching', desc: 'Solo to five-stack guidance. Know your role, your priorities, and which operators to pick for any squad size.', link: '/strats' },
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
  { num: '01', title: 'Pick Your Map', desc: 'Select any map from the ranked pool. Ghost IGL has full strats for every site on every map.' },
  { num: '02', title: 'Study the Strat', desc: 'Get operator picks, positioning, callouts, and utility usage. Learn what to ban and what the enemy will do.' },
  { num: '03', title: 'Review Your Gameplay', desc: 'Upload screenshots from your matches. Our AI coach gives instant feedback on what to improve.' },
  { num: '04', title: 'Climb', desc: 'Better game sense, smarter operator picks, and stronger positioning. Your rank improves because YOU improve.' },
]

const COMPARE = [
  { feature: 'You actually improve', ghost: true, boost: false, coach: true },
  { feature: 'Available 24/7', ghost: true, boost: true, coach: false },
  { feature: 'No account sharing risk', ghost: true, boost: false, coach: true },
  { feature: 'Every map + site covered', ghost: true, boost: false, coach: false },
  { feature: 'AI-powered VOD review', ghost: true, boost: false, coach: true },
  { feature: 'Affordable monthly pricing', ghost: true, boost: false, coach: false },
  { feature: 'Keep your rank permanently', ghost: true, boost: false, coach: true },
  { feature: 'No scheduling needed', ghost: true, boost: true, coach: false },
]

const TESTIMONIALS = []

const PRICING = [
  { tier: 'Recruit', price: 'Free', period: '', desc: 'Get started with basic strategy guides', link: '#', features: ['Map strats for all ranked maps', 'Basic operator suggestions', 'Community Discord access', 'Attack & defense strategies'] },
  { tier: 'Pro', price: '$12', period: '/mo', desc: 'Everything you need to climb', featured: true, link: 'https://buy.stripe.com/00w00k5ASezWaZ94xQ7ss0c', features: ['Full utility & callout breakdowns', 'Operator ban recommendations', 'Enemy prediction intel', 'Squad coaching (solo to 5-stack)', 'AI VOD screenshot review', 'Priority Discord support'] },
  { tier: 'Champion', price: '$29', period: '/mo', desc: 'For players who want it all', link: 'https://buy.stripe.com/3cIfZibZgezWd7h9Sa7ss0d', features: ['Everything in Pro', 'Unlimited VOD reviews', 'Early access to new maps & features', 'Priority feature requests', 'Direct coaching support', 'Exclusive Discord channels'] },
]

const FAQ = [
  { q: 'Is Ghost IGL a boosting service?', a: 'No. Ghost IGL is an AI coaching tool that helps YOU improve. Nobody else plays your account. You earn your rank through better game sense, positioning, and decision-making.' },
  { q: 'Will I get banned for using Ghost IGL?', a: 'No. Ghost IGL is a web-based strategy guide and coaching tool. It does not modify game files, inject code, or interact with the game client in any way.' },
  { q: 'How does the VOD review work?', a: 'Upload a screenshot from your gameplay and our AI analyzes your positioning, crosshair placement, utility usage, and tactical situation. You get instant, actionable coaching feedback.' },
  { q: 'What ranks does Ghost IGL support?', a: 'Ghost IGL works for all ranks from Copper to Champion. Strategies cover the full competitive meta, so you get advice relevant to any skill level.' },
  { q: 'What\'s the difference between free and Pro?', a: 'Free gives you basic strats and operator picks for every map. Pro unlocks full utility breakdowns, callouts, operator ban recommendations, enemy predictions, and squad coaching.' },
  { q: 'What maps are supported?', a: 'All maps in the current ranked rotation. Strategies are updated each season when the map pool changes.' },
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

export default function LandingPage() {
  return (
    <>
      <section className="hero">
        <div className="hero-grid-bg" />
        <div className="hero-glow" />
        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot" />
            Rainbow Six Siege &mdash; Season {getCurrentSeason()}
          </div>
          <h1>
            Stop Getting <span className="accent">Boosted.</span><br />
            Start Getting <span className="accent">Better.</span>
          </h1>
          <p className="hero-subtitle">
            Ghost IGL is the AI-powered In-Game Leader for Rainbow Six Siege.
            Map strats, operator picks, enemy predictions, and AI VOD review &mdash; your rank, earned by you.
          </p>
          <div className="hero-cta">
            <Link to="/strats" className="btn btn-primary btn-lg">Try Strat Tool &mdash; Free</Link>
            <a href="#" onClick={(e) => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }) }} className="btn btn-ghost btn-lg">See How It Works</a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <strong><AnimatedCounter end={13} /></strong>
              <span>Maps Covered</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <strong><AnimatedCounter end={52} />+</strong>
              <span>Site Strategies</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <strong><AnimatedCounter end={100} suffix="%" /></strong>
              <span>Ranked Pool</span>
            </div>
          </div>
        </div>
      </section>

      <div className="trust-bar">
        <div className="trust-item"><span className="trust-icon">{'\u2713'}</span> No Account Sharing</div>
        <div className="trust-item"><span className="trust-icon">{'\u2713'}</span> TOS Compliant</div>
        <div className="trust-item"><span className="trust-icon">{'\u2713'}</span> Cancel Anytime</div>
        <div className="trust-item"><span className="trust-icon">{'\u2713'}</span> Updated Every Season</div>
      </div>

      <section className="section" id="features">
        <div className="section-header">
          <div className="section-label">Features</div>
          <h2>Everything You Need to Rank Up</h2>
          <p>The tools that pro players and coaches use &mdash; powered by AI, available 24/7, for a fraction of the cost.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f) => (
            f.link ? (
              <Link to={f.link} className="feature-card" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </Link>
            ) : (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            )
          ))}
        </div>
      </section>

      <section className="section section-dark" id="how-it-works">
        <div className="section-header">
          <div className="section-label">How It Works</div>
          <h2>Start Improving in 4 Steps</h2>
          <p>No downloads, no plugins, no BS. Just better Siege.</p>
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

      {TESTIMONIALS.length > 0 && (
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
      )}

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
                {p.features.map((f) => (<li key={f}>{f}</li>))}
              </ul>
              <a href={p.link} target={p.link.startsWith('http') ? '_blank' : undefined} className={`btn ${p.featured ? 'btn-primary' : 'btn-outline'}`}>
                {p.price === 'Free' ? 'Get Started Free' : 'Subscribe Now'}
              </a>
            </div>
          ))}
        </div>
        <p className="pricing-note">All plans include a 7-day money-back guarantee. No questions asked.</p>
      </section>

      <section className="section" id="faq">
        <div className="section-header">
          <div className="section-label">FAQ</div>
          <h2>Got Questions?</h2>
          <p>Everything you need to know about Ghost IGL.</p>
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

      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Stop Losing MMR?</h2>
          <p>AI-powered strats, operator picks, and coaching for every map in the ranked pool.</p>
          <Link to="/strats" className="btn btn-primary btn-lg">Try the Strat Tool &mdash; Free</Link>
        </div>
      </section>
    </>
  )
}
