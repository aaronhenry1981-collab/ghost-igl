// Changelog — reverse-chronological. Add a new entry at the top on every meaningful release.
// Each entry: { date: 'YYYY-MM-DD', tag: 'feature' | 'fix' | 'content' | 'design' | 'release', title, items: [string] }

const CHANGELOG = [
  {
    date: '2026-05-12',
    tag: 'release',
    title: 'Recon 6 launches with 20 supported games',
    items: [
      'Rebranded from Recon+ to Recon 6 — flows with r6coaching.com, broadens the platform mandate from a single title to the 20 most-played competitive games',
      'Added 9 new games: League of Legends, Dota 2, EA FC, Tekken 8, Street Fighter 6, PUBG, Deadlock, Naraka Bladepoint, NBA 2K — alongside R6, CS2, Valorant, Overwatch 2, Apex, Marvel Rivals, Halo, The Finals, Call of Duty, Fortnite, Rocket League',
      'AI VOD review now works on every supported game — uploaded a clip from any title and Claude analyzes it with that game\'s map/character/mistake context',
      'Free trial gives you 3 lifetime VOD analyses on any game — no card required',
      'New blog clusters across 5 games: Stadium economy for OW2, lane-priority macro for LoL, FUT meta for EA FC, Heihachi punish flows for Tekken 8, drop-rotation reads for PUBG',
      'Founding rates ($9 Pro / $29 Champion) lock for life through May 31 — banner runs site-wide while the window is open',
    ],
  },
  {
    date: '2026-04-24',
    tag: 'feature',
    title: 'Operator comparison + conversion upgrades',
    items: [
      'Side-by-side operator comparison tool — pick up to 3 ops, see overlapping sites and exclusive coverage',
      'Auto-generated per-map OG social preview images (SVG, 1200×630)',
      'Scroll-triggered reveal animations on landing page sections',
      'Changelog page so you can see exactly what we shipped and when',
      'Dynamic sitemap regenerated on every build',
    ],
  },
  {
    date: '2026-04-23',
    tag: 'design',
    title: 'Design system overhaul',
    items: [
      'Space Grotesk for headings, Inter for UI — proper font pairing throughout',
      'Expanded color tokens: attack orange, defense blue, role purple alongside cyan primary',
      'Gradient text on hero headline, step numbers, brand wordmark',
      'Pricing "Most Popular" Pro card now has dominant visual weight',
      'Feature / step / FAQ cards polished with elevation gradients and hover glow',
      'Buttons get consistent tactile feedback: gradient primary, scale-on-active, focus ring',
    ],
  },
  {
    date: '2026-04-22',
    tag: 'feature',
    title: 'Admin autonomous promo kit + testimonials + demo video',
    items: [
      'Promo Kit: 9 templates across Discord, Reddit, Twitter, YouTube — every post uses your real strat data',
      'Testimonial builder — paste a quote, it renders on the landing page instantly',
      'Demo video manager — drop a YouTube or Twitch VOD URL, it embeds on the landing',
      'Per-template "Why this works" reasoning and "used before" tracking',
    ],
  },
  {
    date: '2026-04-22',
    tag: 'fix',
    title: 'Audited every clickable thing on the site',
    items: [
      'Fixed dead Stripe portal link — now creates fresh session via Lambda every click',
      'Fixed 8 "See plans" buttons that silently redirected home instead of scrolling to pricing',
      'AuthPage now honors ?redirect= param (was always dumping to /strats)',
      'Added Operators + Meta to the top navbar',
      'Verified all payment links live via HTTP probe + Stripe API',
    ],
  },
  {
    date: '2026-04-22',
    tag: 'content',
    title: '14 public, SEO-indexable map guide pages',
    items: [
      'One standalone HTML page per map at /guides/<map>.html',
      'Article schema JSON-LD for rich search results',
      'Full operator picks + strategy + callouts + bans per site',
      'Build pipeline regenerates guides from strats.js on every deploy',
    ],
  },
  {
    date: '2026-04-21',
    tag: 'feature',
    title: 'Ranked Meta page + operator-centric views',
    items: [
      'New /meta page: top essential picks, most-banned ops, map complexity leaderboard',
      'New /operators page: every op across every map, personalized to your main role',
      'Operator detail view at /operators/:name',
      'Personalization: your profile role highlights matching ops on every strat',
    ],
  },
  {
    date: '2026-04-21',
    tag: 'feature',
    title: 'Strats page power-user features',
    items: [
      'Deep linking: /strats/:map/:site/:side — bookmark and share any strat',
      'Global fuzzy search across ops, callouts, map names',
      'Quick Brief compact view for pre-round scan (B key)',
      'Recent strats — last 5 you viewed, cross-tab synced',
      'Keyboard shortcuts cheat sheet (press ?)',
      'Click-to-copy callout chips',
    ],
  },
  {
    date: '2026-04-20',
    tag: 'content',
    title: 'Emerald Plains full strat writeup',
    items: [
      'All 4 sites × attack + defense = 8 tier-1 strat blocks',
      'Operator lineups, strategies, callouts, utility placement',
      'Ranked pool now fully covered: 14 maps, 56 sites',
    ],
  },
  {
    date: '2026-04-20',
    tag: 'release',
    title: 'Initial launch',
    items: [
      'Cognito auth, Stripe billing, admin dashboard',
      'Discord bot with /strat, /maps, /callouts, /meta, /ping',
      'VOD Review via Bedrock Claude Sonnet 4.5',
      'Desktop app v0.1 installer',
      'Marketing site with pricing, FAQ, compare table',
    ],
  },
]

export default CHANGELOG
