import { useState } from 'react'
import { Link } from 'react-router-dom'
import { track } from '../utils/analytics'
import './PressPage.css'

// Press / media kit — every outreach email Aaron sends to streamers,
// journalists, or R6 community admins links here instead of repeating
// the same pitch. Single page with: one-liner, longer description, logo
// downloads, screenshots, founder bio, founding-rate hook, contact.
//
// SEO-relevant: this is a linkable asset. Other R6 sites writing about
// us link here for the "official" intro. Schema markup is Organization
// + Person so Google's knowledge panel can pull from this directly.

const COPY_PRESETS = {
  oneLine: 'Recon 6 is the AI-powered in-match coach for 20 competitive games — every map, every site, every callout pre-loaded for you, plus AI VOD review on your own clips.',
  paragraph: `Recon 6 (r6coaching.com) gives competitive players a single screen that walks them through every pre-round decision: map, bans, side, queue size, site, operator, loadout, and site setup. AI VOD review reads screenshots and tells players exactly what cost them the round. Live across R6 Siege, CS2, Valorant, Overwatch 2 (including Stadium mode), Apex, LoL, Dota 2, Tekken 8, EAFC, PUBG, and 10 more competitive titles. Founding-rate Pro subscriptions ($9/mo) are locked for life through May 31, 2026.`,
  founder: `Aaron Henry founded Recon 6 (originally Ghost IGL, rebranded May 12, 2026) after six months of recording his own ranked R6 matches looking for the patterns that kept him and his friends stuck at Plat. The tactical observations from those replays became the seed for the coaching tool. He builds the platform solo from Texas while playing Siege competitively.`,
}

const SCREENSHOTS = [
  { src: '/og-image.png', label: 'Site preview card (1200×630)', alt: 'Recon 6 landing page social preview' },
  { src: '/guides/og/bank.svg', label: 'R6 map guide preview — Bank', alt: 'Bank strategy guide social card' },
  { src: '/games/og/stadium-busan.svg', label: 'OW2 Stadium map preview — Busan', alt: 'Stadium Busan Downtown share preview' },
]

const LOGOS = [
  { src: '/favicon.svg', label: 'Brand mark (SVG)', size: 'Vector' },
  { src: '/og-image.png', label: 'Social preview (1200×630 PNG)', size: '1200×630' },
]

const OUTREACH_TEMPLATES = [
  {
    id: 'streamer',
    label: 'For R6 streamers / YouTubers',
    body: `Hey {{name}},

I built a free in-match coaching tool for R6 — r6coaching.com/live — that walks you through map → bans → site → operator → loadout in one screen. It's the kind of thing I wish existed when I was grinding ranked solo.

The Pro tier ($9/mo founding rate, locked for life if you sub before May 31) adds AI VOD review on screenshots — drop a clip, get back what cost you the round. I'd love to send you a free Champion comp if you want to take it for a spin on stream. No strings, just want feedback from real Diamond+ players.

If you want a thumbnail-friendly intro for your audience, the press kit (logos, screenshots, one-line description) is at r6coaching.com/press.

— Aaron
Recon 6`,
  },
  {
    id: 'journalist',
    label: 'For gaming / esports journalists',
    body: `Hi {{name}},

Pitching a story angle on AI coaching tools in tactical FPS — Recon 6 (r6coaching.com) just expanded from R6-only to 20 competitive games, including the first dedicated coaching coverage of OW2's new Stadium mode (Cash economy, Power picks, Item shop builds).

Bullets that might fit a piece:
- Single founder, bootstrapped, profitable on a $9/mo founding rate
- AI VOD review reads screenshots round-by-round (not full video) — drastically cheaper than what was previously possible
- 20-game coverage including non-FPS titles (LoL, Dota 2, Tekken 8, EAFC, NBA 2K) on the same coaching engine

Happy to provide founder quotes, screenshots, or a free Champion sub for review purposes. Press kit (logos, copy presets, screenshots) at r6coaching.com/press.

— Aaron Henry, Founder
aaronhenry1981@gmail.com`,
  },
  {
    id: 'community',
    label: 'For Discord / community mods',
    body: `Hey {{name}},

Built a free tool that R6 players in your community might find useful — r6coaching.com/live. It's an in-match walkthrough (map → bans → site → operator → loadout) optimized for the 90-second ready-up window. No signup required to try it.

If it lands well with your members, I'd be happy to set up a community partnership — comp Champion subs for active mods, custom landing page with your server's branding, that kind of thing. Reply if interested or just share the link if you think it'd help.

— Aaron
Recon 6 / r6coaching.com`,
  },
]

function CopyBlock({ label, text }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      track('Press Copy', { label })
      setTimeout(() => setCopied(false), 1800)
    }).catch(() => {})
  }
  return (
    <div className="press-copy-block">
      <div className="press-copy-head">
        <span className="press-copy-label">{label}</span>
        <button type="button" className="press-copy-btn" onClick={copy}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="press-copy-text">{text}</pre>
    </div>
  )
}

export default function PressPage() {
  return (
    <div className="press-page">
      <header className="press-header">
        <div className="press-eyebrow">Press kit · Media resources</div>
        <h1>Press & <span className="press-accent">Media Kit</span></h1>
        <p className="press-lead">
          Everything you need to write about, cover, or partner with Recon 6. Copy presets, logos, screenshots,
          founder bio, and outreach templates — all designed to be lifted straight into your article, video, or DM.
        </p>
        <div className="press-quick-links">
          <a href="#copy">Copy presets</a>
          <a href="#logos">Logos & screenshots</a>
          <a href="#founder">Founder bio</a>
          <a href="#templates">Outreach templates</a>
          <a href="#contact">Contact</a>
        </div>
      </header>

      <section id="copy" className="press-section">
        <h2>Copy presets</h2>
        <p>Drop these straight into your article or tweet. Click Copy.</p>
        <CopyBlock label="One-line description" text={COPY_PRESETS.oneLine} />
        <CopyBlock label="Paragraph description" text={COPY_PRESETS.paragraph} />
        <CopyBlock label="Founder bio (one paragraph)" text={COPY_PRESETS.founder} />
      </section>

      <section id="logos" className="press-section">
        <h2>Logos & screenshots</h2>
        <p>Right-click → Save image, or hotlink directly.</p>
        <div className="press-asset-grid">
          {LOGOS.map((a) => (
            <a key={a.src} href={a.src} download className="press-asset-card">
              <div className="press-asset-preview" style={{ background: a.src.endsWith('.svg') ? '#0a0f19' : 'transparent' }}>
                <img src={a.src} alt={a.label} />
              </div>
              <div className="press-asset-meta">
                <strong>{a.label}</strong>
                <span>{a.size} · download</span>
              </div>
            </a>
          ))}
        </div>
        <h3 style={{ marginTop: '2rem' }}>Share-preview screenshots</h3>
        <div className="press-asset-grid">
          {SCREENSHOTS.map((s) => (
            <a key={s.src} href={s.src} download className="press-asset-card">
              <div className="press-asset-preview wide">
                <img src={s.src} alt={s.alt} />
              </div>
              <div className="press-asset-meta">
                <strong>{s.label}</strong>
                <span>SVG / PNG · download</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section id="founder" className="press-section">
        <h2>Founder</h2>
        <div className="press-founder-card">
          <div className="press-founder-name">Aaron Henry</div>
          <div className="press-founder-title">Founder & sole engineer · Recon 6 (Iron Front Digital LLC)</div>
          <p>{COPY_PRESETS.founder}</p>
          <ul className="press-founder-facts">
            <li><strong>Based:</strong> Texas, USA</li>
            <li><strong>Company:</strong> Iron Front Digital LLC (parent)</li>
            <li><strong>Founded:</strong> 2025 (as Ghost IGL); rebranded to Recon 6 May 12, 2026</li>
            <li><strong>Funding:</strong> Bootstrapped, profitable</li>
            <li><strong>Tech:</strong> React + AWS (Cognito, Lambda, DynamoDB, S3 + CloudFront) + Stripe + AWS Bedrock (Claude Sonnet 4.5 for VOD analysis)</li>
          </ul>
        </div>
      </section>

      <section id="templates" className="press-section">
        <h2>Outreach templates</h2>
        <p>If you're an Aaron / a partner reaching out on Recon 6's behalf — pick a template, copy, customize the <code>{'{{name}}'}</code> placeholder, send. Templates intentionally avoid pressure tactics.</p>
        {OUTREACH_TEMPLATES.map((t) => (
          <CopyBlock key={t.id} label={t.label} text={t.body} />
        ))}
      </section>

      <section id="contact" className="press-section press-contact">
        <h2>Contact</h2>
        <ul className="press-contact-list">
          <li><strong>Press / interviews:</strong> <a href="mailto:aaronhenry1981@gmail.com">aaronhenry1981@gmail.com</a></li>
          <li><strong>Partnerships / collabs:</strong> Same — DMs welcome</li>
          <li><strong>Live site:</strong> <a href="https://r6coaching.com">r6coaching.com</a></li>
          <li><strong>Try the in-match coach:</strong> <Link to="/live">/live</Link></li>
          <li><strong>Founding-rate cutoff:</strong> May 31, 2026 (then regular rates apply; founding subscribers stay locked for life)</li>
        </ul>
      </section>

      <footer className="press-foot">
        <p>This page is a public press kit — feel free to share, hotlink, or quote any content above. JSON-LD Organization schema below for search engines.</p>
        <Link to="/" className="btn btn-outline">← Back to site</Link>
      </footer>

      {/* Organization JSON-LD — fuels Google knowledge-panel entries
          when other sites link here as the official intro to Recon 6. */}
      {/* JSON.stringify of our own object — no user input, XSS-safe */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Recon 6',
            alternateName: 'Recon 6 Coaching',
            url: 'https://r6coaching.com',
            logo: 'https://r6coaching.com/favicon.svg',
            description: COPY_PRESETS.oneLine,
            founder: { '@type': 'Person', name: 'Aaron Henry' },
            sameAs: ['https://r6coaching.com'],
          }),
        }}
      />
    </div>
  )
}
