#!/usr/bin/env node
// Generates static SEO blog posts at public/blog/<slug>.html.
// Each post targets a long-tail "how to rank up" search query for one of the
// 10 supported games. Idempotent: re-running produces the same files.
//
// Visual style mirrors scripts/generate-guides.mjs (dark theme, cyan accents)
// so the blog feels like part of the same site. Article-specific styles
// (typography, callout boxes, mistake/drill blocks) are added on top.
//
// Run: node scripts/generate-blog-posts.mjs

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'blog')
const SITE_URL = 'https://r6coaching.com'

function escape(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function htmlShell({ title, description, canonical, bodyInner, jsonLdBlocks = [], ogImage }) {
  const ogImageUrl = ogImage || `${SITE_URL}/og-image.png`
  const jsonLdHtml = jsonLdBlocks.map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join('\n  ')
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}" />
  <link rel="canonical" href="${escape(canonical)}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#0a0f19" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escape(title)}" />
  <meta property="og:description" content="${escape(description)}" />
  <meta property="og:url" content="${escape(canonical)}" />
  <meta property="og:image" content="${escape(ogImageUrl)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Recon+" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${escape(ogImageUrl)}" />
  ${jsonLdHtml}
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #0a0f19; color: #e6e9ef; line-height: 1.7; }
    a { color: #00e5ff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .nav { padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; }
    .brand { font-weight: 900; letter-spacing: 0.06em; color: #fff; text-decoration: none; }
    .brand span { color: #00e5ff; }
    .nav-links a { margin-left: 18px; color: rgba(230,233,239,0.85); font-size: 0.9rem; }
    main { max-width: 760px; margin: 0 auto; padding: 32px 24px 80px; }
    article h1 { font-size: 2.1rem; margin: 0 0 8px; line-height: 1.25; }
    .meta-row { color: rgba(230,233,239,0.6); font-size: 0.88rem; margin-bottom: 24px; display: flex; gap: 14px; flex-wrap: wrap; }
    .meta-row .pill { background: rgba(0,229,255,0.08); border: 1px solid rgba(0,229,255,0.2); border-radius: 999px; padding: 2px 10px; color: #c0f4fc; }
    article p { margin: 0 0 16px; color: rgba(230,233,239,0.9); }
    article h2 { font-size: 1.4rem; margin: 32px 0 12px; color: #fff; border-left: 3px solid #00e5ff; padding-left: 12px; }
    article h3 { font-size: 1.05rem; margin: 22px 0 8px; color: #c0f4fc; }
    article ul, article ol { padding-left: 22px; margin: 0 0 18px; color: rgba(230,233,239,0.9); }
    article ul li, article ol li { margin-bottom: 6px; }
    article strong { color: #fff; font-weight: 700; }
    article code { background: rgba(0,229,255,0.08); padding: 1px 6px; border-radius: 3px; font-size: 0.92em; color: #c0f4fc; }
    .callout { margin: 22px 0; padding: 16px 18px; background: rgba(0,229,255,0.05); border-left: 3px solid #00e5ff; border-radius: 0 6px 6px 0; }
    .callout.mistakes { background: rgba(255,80,80,0.05); border-left-color: #ff5050; }
    .callout.mistakes h3 { color: #ff8899; margin-top: 0; }
    .callout.drill { background: rgba(80,255,140,0.04); border-left-color: #50ff8c; }
    .callout.drill h3 { color: #98ffc6; margin-top: 0; }
    .callout h3 { margin: 0 0 8px; }
    .callout p:last-child, .callout ul:last-child, .callout ol:last-child { margin-bottom: 0; }
    .related { margin: 32px 0; padding: 20px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; }
    .related h3 { margin: 0 0 10px; }
    .related ul { margin: 0; padding-left: 18px; }
    .breadcrumb { font-size: 0.85rem; color: rgba(230,233,239,0.6); margin-bottom: 12px; }
    .breadcrumb a { color: rgba(230,233,239,0.85); }
    .intro-cta { padding: 24px; background: linear-gradient(180deg, rgba(0,229,255,0.06), rgba(10,15,25,0.6)); border: 1px solid rgba(0,229,255,0.2); border-radius: 12px; margin: 32px 0; text-align: center; }
    .intro-cta h3 { margin: 0 0 6px; color: #fff; }
    .intro-cta p { margin: 0 0 12px; color: rgba(230,233,239,0.8); }
    .btn { display: inline-block; padding: 10px 20px; background: #00e5ff; color: #051117; font-weight: 700; border-radius: 6px; text-decoration: none; }
    .footer-strip { max-width: 760px; margin: 40px auto; padding: 0 24px; color: rgba(230,233,239,0.5); font-size: 0.82rem; text-align: center; }
    @media (max-width: 600px) {
      main { padding: 20px 16px 40px; }
      article h1 { font-size: 1.55rem; }
      article h2 { font-size: 1.18rem; }
    }
  </style>
</head>
<body>
  <nav class="nav">
    <a class="brand" href="${SITE_URL}/">RECON<span>+</span></a>
    <div class="nav-links">
      <a href="${SITE_URL}/blog/">Blog</a>
      <a href="${SITE_URL}/guides/">Map guides</a>
      <a href="${SITE_URL}/#/strats">Interactive strats</a>
      <a href="${SITE_URL}/#pricing">Pricing</a>
    </div>
  </nav>
  <main>
    ${bodyInner}
  </main>
  <div class="footer-strip">
    <p>&copy; Recon+ — AI-powered FPS coaching across 10 games. <a href="${SITE_URL}/">r6coaching.com</a></p>
  </div>
</body>
</html>`
}

// ---------- POST CONTENT ----------
// Each post is structured: { game, gameLabel, fromRank, toRank, slug,
// metaTitle, metaDescription, intro, sections[], mistakes[], drill,
// relatedLinks[], readMinutes, lastUpdated }
//
// Sections is an array of { heading, html } where html is the body content
// for that H2. Keeping it as data (not a single blob) lets us auto-generate
// the HowTo schema steps from the headings.

const R6_POSTS = [
  {
    game: 'r6',
    gameLabel: 'Rainbow Six Siege',
    fromRank: 'Copper',
    toRank: 'Bronze',
    slug: 'r6-copper-to-bronze',
    metaTitle: 'How to Climb Out of Copper in Rainbow Six Siege (2026)',
    metaDescription: 'Specific tactics that win Copper rounds in R6 Siege — the 5 operators to main, drone discipline, reinforcement priority, and the round-losing habits to drop first.',
    intro: `<p>Copper is where most R6 players land after placement matches. You're not bad — you don't have a foundation yet. The Copper-to-Bronze gap closes when you commit to fundamentals: a small operator pool, drone discipline, smart reinforcements, and trade fragging. Here's exactly what to do.</p>`,
    sections: [
      {
        heading: 'Pick 5 operators total — not the whole roster',
        html: `<p>The single biggest Copper mistake is trying to play every operator. R6 has 70+ operators with unique kits, ult charges, and timing windows. You'll never get good at all of them. Pick five and main them for the next month:</p>
<ul>
  <li><strong>Sledge</strong> — entry attacker, simple kit (hammer + frags). His sledgehammer breaks soft walls and floors. No timing required, no charges to count.</li>
  <li><strong>Ash</strong> — entry attacker, fastest gun in the game, breaching rounds for soft walls from range.</li>
  <li><strong>Doc</strong> — defender, anchor, heals teammates. Kit is just "press button, gain HP". Built for Copper.</li>
  <li><strong>Rook</strong> — defender, drops armor for the team. Free 20 HP for everyone — round-changing utility, zero skill ceiling.</li>
  <li><strong>Mute</strong> — defender, anti-breach + anti-drone. Drop a jammer on a wall, attackers can't breach it.</li>
</ul>
<p>That's your pool. Master these five, then expand. Bandit and Thermite go on the list at Bronze when you're ready for hard breach mechanics.</p>`,
      },
      {
        heading: 'Drone for 3 seconds before every push',
        html: `<p>Copper rounds are lost on dry pushes — running into a room with no info. Before any door, hold your drone for 3 full seconds and scan. If you see a defender, you have free intel. If the room is empty, you've earned the right to push.</p>
<p>Specific habit: when you spawn as attacker, immediately drone the entry hallway you're going to use. Don't run forward — drone first. Every Copper player who fixes this single habit climbs to Bronze inside two weeks.</p>
<p>Also: <strong>buy the second drone</strong>. The second drone slot is one of the cheapest gadgets and most attackers don't bring it. Two drones = two pieces of intel per round = a clean push.</p>`,
      },
      {
        heading: 'Reinforce 4 walls per round, never exteriors',
        html: `<p>Every defense round, your team has 8 reinforcements. Use 4 of them on the right walls:</p>
<ol>
  <li>The two reinforced walls between your bomb pair (the wall connecting the A and B sites).</li>
  <li>Two more on hatch denial above your site — open the soft hatch yourself, then reinforce the hatch on the rotation room (forces attackers to play around your setup).</li>
</ol>
<p><strong>Common Copper mistake: reinforcing exterior walls.</strong> Don't. Exterior walls only matter against Sledge or Buck, and Copper attackers don't run those operators consistently. You're wasting reinforcements that should go inside the site. Save your two unused reinforcements for round-mid rotation calls — sometimes a teammate calls a wall during prep that you didn't see.</p>`,
      },
      {
        heading: 'Pre-fire angles you have already cleared',
        html: `<p>When you push through a door you've droned, your crosshair should already be on head height (about 1.7m off the ground in-game) at the spot where defenders typically peek. When the defender peeks, your bullet's already on their face — they don't get to react.</p>
<p>Bank CEO main door: pre-aim at the corner by the desk. Clubhouse Cash entry: pre-aim at the back-left corner by the safe. Kafe Bar: pre-aim at the doorway to White Stairs. These are the spots Copper-Bronze defenders sit.</p>
<p>Aim training matters less than crosshair placement. Most Copper deaths happen because crosshair was at chest height when the defender's head was at 1.7m. Fix the placement first.</p>`,
      },
      {
        heading: 'Trade frags — never push first',
        html: `<p>The first player through a doorway in Copper dies because they have no info advantage. Let your teammate commit first, then you peek behind them on the trade. Two-on-one fights win rounds.</p>
<p>This is the hardest habit to build because Copper feels like a frag race. It's not. It's a positioning game. The team that trades frags wins the round 70%+ of the time even if their individual aim is worse.</p>
<p>If your teammate dies in the doorway, you peek the SAME doorway from a slightly different angle within 3 seconds. The defender just used 1 second's recoil cooldown — their first shot will miss. Your trade kill is free.</p>`,
      },
    ],
    mistakes: [
      'Spawn-peeking with no info — dying first 30 seconds.',
      'Reinforcing exterior walls — wasted utility.',
      'Buying 1 drone instead of 2.',
      'Pushing first into rooms — no trade.',
      'No Mute jammer — free Twitch / Hibana breaches every round.',
    ],
    drill: {
      heading: 'Practice routine for week 1',
      html: `<ul>
  <li><strong>30 min aim training</strong> — Aim Lab or in-game T-Hunt with a single weapon. Don't switch guns; build muscle memory on one.</li>
  <li><strong>15 min map walk on Bank</strong> — load Bank in T-Hunt, just walk around. Learn rooms, don't fight bots. By the end of a week you'll know every callout on the map.</li>
  <li><strong>5 ranked games per day</strong> — 4 with your 5-op pool, 1 to experiment with a new operator.</li>
</ul>
<p>If you commit to fundamentals — small op pool, drone before push, smart reinforcements, trade fragging — you'll exit Copper inside two weeks.</p>`,
    },
    aiVodMention: `<p>If you can't tell why specific rounds feel off, the <a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> reads your replays and flags positioning mistakes per round — useful when you know you're losing but can't see why.</p>`,
    relatedLinks: [
      { name: 'Bank — Complete Strategy Guide', url: '/guides/bank.html' },
      { name: 'Clubhouse — Complete Strategy Guide', url: '/guides/clubhouse.html' },
      { name: 'Coastline — Complete Strategy Guide', url: '/guides/coastline.html' },
      { name: 'All R6 Operators (kit reference)', url: '/guides/operators/' },
    ],
    readMinutes: 6,
  },
  {
    game: 'r6',
    gameLabel: 'Rainbow Six Siege',
    fromRank: 'Bronze',
    toRank: 'Silver',
    slug: 'r6-bronze-to-silver',
    metaTitle: 'How to Climb from Bronze to Silver in Rainbow Six Siege (2026)',
    metaDescription: 'The Bronze-to-Silver leap in R6 Siege is map awareness — specific callouts, two-main operator focus, bomb-pair reinforcement discipline, and how to stop dry pushing.',
    intro: `<p>Bronze players know operator kits but don't have map awareness yet. The rank that separates Bronze from Silver is "did you survive 30 seconds without a callout from a teammate?" — Silver players know maps deeply enough to position alone. Here's the leap.</p>`,
    sections: [
      {
        heading: 'Master 3 maps. Stop playing the whole rotation',
        html: `<p>Pick three ranked maps. Bank, Clubhouse, and Kafe is a strong starter set. Or Border, Chalet, Consulate — any three. Play these maps ranked-only for two weeks. By the end of week 2, you'll know:</p>
<ul>
  <li>Every site's name (CEO, Cash Room, Cocktail Bar, etc.)</li>
  <li>Where common roamers play</li>
  <li>Where to set up Mira and Maestro on defense</li>
  <li>Standard reinforcement patterns per site</li>
  <li>Which exterior walls to watch for Sledge / Buck</li>
</ul>
<p>If you switch maps every game, you never get the depth needed for Silver+. Bronze players play 18 maps shallowly. Silver players play 5 maps deeply.</p>`,
      },
      {
        heading: 'Pick 2 attackers + 2 defenders to main',
        html: `<p>Your operator pool needs to grow from "5 simple operators" (Copper) to "specialized roles you understand deeply" (Silver). Pick:</p>
<ul>
  <li><strong>One attacking entry</strong> — Ash, Iana, or Zofia. These three frag well and have utility for clearing.</li>
  <li><strong>One attacking utility/support</strong> — Thatcher (clears defender gadgets), Twitch (drones into site), or Capitao (denies anchor positions with fire).</li>
  <li><strong>One defending anchor</strong> — Mute (anti-breach + anti-drone), Bandit (anti-breach), or Smoke (area denial).</li>
  <li><strong>One defending roamer</strong> — Vigil (uncatchable on cam), Pulse (heartbeat sensor for vertical info), or Caveira (stealth + interrogate).</li>
</ul>
<p>At Bronze, learning how Iana's hologram drones around corners is more valuable than knowing 10 operators superficially. Specialization is the climb.</p>`,
      },
      {
        heading: 'Learn 5 callouts per map',
        html: `<p>Callouts are how teams coordinate. If a teammate calls "Spiral push!" and you don't know where Spiral is, you can't rotate. Memorize five callouts per map.</p>
<p><strong>Bank:</strong> CEO, Spiral, Open Area, Garage, Truck. (Plus: Front Door, Back Alley.)</p>
<p><strong>Clubhouse:</strong> Cash Room, CCTV, Construction, Master Bedroom, Gym. (Plus: Roof, Garage.)</p>
<p><strong>Kafe:</strong> Cocktail Bar, Reading Room, Mining Room, Kitchen, Bakery. (Plus: White Stairs, Red Stairs.)</p>
<p>Drill: load each map in T-Hunt, walk around for 15 minutes, and say each callout out loud as you enter the room. After 9 sessions you'll out-position any Bronze player.</p>`,
      },
      {
        heading: 'Site setup discipline — bomb-pair walls every round',
        html: `<p>On every defense round, ask one question: <strong>"Are the two walls between my site and the other bomb reinforced?"</strong></p>
<p>If yes, you have a defensible site. If no, fix it before the action phase. This single rule — bomb-pair walls reinforced — wins Bronze rounds because most Bronze defenders reinforce randomly.</p>
<p>Specifics:</p>
<ul>
  <li><strong>Bank CEO/Open Area site:</strong> reinforce the wall between CEO and Janitor + the wall between Open Area and Admin.</li>
  <li><strong>Clubhouse Cash/CCTV:</strong> reinforce the wall between Cash and Construction + the wall between CCTV and Master.</li>
  <li><strong>Kafe Cocktail/Reading:</strong> reinforce the wall between Cocktail and Mining + the wall above the bar.</li>
</ul>`,
      },
      {
        heading: 'Stop dry pushing — utility before commit',
        html: `<p>Bronze attackers commit first, lose the trade, and the round folds. The fix: <strong>no utility, no push.</strong></p>
<p>Before any push, you should have used at least one of: a flash, a smoke, a drone clear, or a breach. If you don't have utility ready, you don't push. Drone first, then commit.</p>
<p>Specific check: if you're 20 seconds from round end and you haven't thrown utility, you're either winning the round (good) or losing it (most likely). The team that uses utility wins the round 65%+ of the time at Bronze.</p>`,
      },
    ],
    mistakes: [
      'Reinforcing the wrong walls (exterior, not bomb-pair).',
      'Switching operators every match — no specialization.',
      'No callouts learned — can\'t rotate when teammates call.',
      'Ash-only attackers with no utility coordination.',
      'Pulse-only defenders — no anchor on site.',
      'Wide swinging on every angle (peek-and-pray).',
    ],
    drill: {
      heading: 'Drill: T-Hunt site prep on your 3 chosen maps',
      html: `<p>Load each of your 3 chosen maps (Bank, Clubhouse, Kafe) in Terrorist Hunt. Run each map 3 times solo over the next week — 9 sessions total. For each map:</p>
<ul>
  <li><strong>Run 1:</strong> walk every floor and say callouts out loud.</li>
  <li><strong>Run 2:</strong> practice your two attacker mains' utility on every site.</li>
  <li><strong>Run 3:</strong> practice your two defender mains' anchor positions per site.</li>
</ul>
<p>By session 9, you'll position better than any Bronze player. Map knowledge is the Silver gap.</p>`,
    },
    aiVodMention: `<p>Once you're confident on map basics, <a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> can tell you which positions you held that pros don't — useful for spotting predictable habits before your opponents do.</p>`,
    relatedLinks: [
      { name: 'Bank — Complete Strategy Guide', url: '/guides/bank.html' },
      { name: 'Clubhouse — Complete Strategy Guide', url: '/guides/clubhouse.html' },
      { name: 'Kafe Dostoyevsky — Complete Strategy Guide', url: '/guides/kafe.html' },
      { name: 'Border — Complete Strategy Guide', url: '/guides/border.html' },
      { name: 'Interactive R6 Strats (deep linked)', url: '/#/strats' },
    ],
    readMinutes: 7,
  },
  {
    game: 'r6',
    gameLabel: 'Rainbow Six Siege',
    fromRank: 'Silver',
    toRank: 'Gold',
    slug: 'r6-silver-to-gold',
    metaTitle: 'How to Climb from Silver to Gold in Rainbow Six Siege (2026)',
    metaDescription: 'The Silver-to-Gold leap is utility coordination — Thatcher EMP timing, hard breach combos, vertical play, Bandit tricking, and drone discipline.',
    intro: `<p>Silver to Gold is the utility coordination jump. At Silver you might run Thatcher with Thermite but their EMPs and charges aren't synced. At Gold the EMP lands on the wall one second before Thermite places his charge — perfect timing. Here's how to build that coordination.</p>`,
    sections: [
      {
        heading: 'Hard breach combo timing — sequence matters',
        html: `<p>The most-tested Silver mistake: Thermite places his charge, then Thatcher EMPs after. Wrong order. The pellet's already exposed when the EMP lands — you've gained nothing.</p>
<p>Correct sequence:</p>
<ol>
  <li><strong>Thatcher EMP at 1:50 round timer</strong> (or the 2-minute mark, whichever you can reach safely).</li>
  <li><strong>Wait 2 seconds</strong> for the EMP to fully detonate and clear electronics on the wall.</li>
  <li><strong>Thermite places his charge</strong> while Bandits are off the wall.</li>
  <li><strong>Detonate.</strong></li>
</ol>
<p>The whole sequence takes 8-10 seconds. Practice it in Custom Game with a buddy. If you're soloing without a Thatcher, run Twitch instead — her drone disables the Bandit battery without needing the global EMP.</p>`,
      },
      {
        heading: 'Drone discipline — 3 drones up before site',
        html: `<p>Before any site execute, your team should have 3 drones on the site for full coverage. Two from teammates, one from you. Pre-stage drones in safe spots so Mute jammers don't kill them.</p>
<p>Iana's hologram counts as a drone for clearing — if you main Iana, you can scout site without committing your real drone. Lion's scan flushes hidden defenders for free intel.</p>
<p>Silver mistake: blowing all drones in the first 30 seconds. By the time you're ready to push, you have zero info. Save at least 1 drone for the actual exec — drone the bomb spot 5 seconds before you breach.</p>`,
      },
      {
        heading: 'Vertical play — Sledge and Buck above sites',
        html: `<p>Top-tier vertical attackers turn 1 round into 2. Sledge can break the soft floor over a site from above and shoot the anchor through his own ceiling. This is round-losing for defenders.</p>
<p>Specific lineups:</p>
<ul>
  <li><strong>Bank:</strong> Sledge above CEO from the white stairs side. Drop a frag through the hole onto the bomb default plant.</li>
  <li><strong>Clubhouse:</strong> Buck above Cash Room from the bedroom. Target the corner anchor by the safe.</li>
  <li><strong>Kafe:</strong> Sledge above Cocktail Bar from 3F. Vertical opens to the bar counter where defenders sit.</li>
</ul>
<p>Vertical play needs a hard breach below to commit the team. Sledge alone is just a distraction. Sledge + Thermite + Thatcher is a round.</p>`,
      },
      {
        heading: 'Bandit tricking — one battery, one wall',
        html: `<p>Bandit's batteries last 3 seconds when applied. The trick: place the battery on the wall right before Hibana places her pellet. The pellet starts its 4-second activation; your battery activates simultaneously and detonates the pellet harmlessly. The wall stays up.</p>
<p>Timing window: when you hear the Hibana pellet sound effect, count 1 second, then place the battery. Practice this in Custom Game until it's muscle memory.</p>
<p>This is one of the most-tested skills at Gold+ defense. Silvers don't trick. Golds trick consistently. Plats trick AND have a fallback (Mute jammer or Kaid Electroclaw on the same wall).</p>`,
      },
      {
        heading: 'Anchor discipline — at least 2 anchors on every site',
        html: `<p>At Silver, players over-roam and lose site control. By the time the attackers breach, no defender's on site to contest the plant.</p>
<p>Gold defenders have at least 2 anchors on every defense round. One Maestro on a corner Evil Eye providing intel; one Mute or Smoke holding the choke. Roamer is 1 player max — and the roamer's job is to delay, not solo-frag the entire attacking team.</p>
<p>Specific test: when you load into a defense round, count how many teammates are on site at 1:30 timer. If it's fewer than 3, your team's roaming too hard. Call for an anchor to fall back.</p>`,
      },
    ],
    mistakes: [
      'Thermite without Thatcher — pellet just gets denied.',
      'Roaming as a 4-stack — no one anchors site.',
      'Ash with no flash or breach — just runs in.',
      'Not pre-firing common angles after droning.',
      'Buying primary gadgets instead of secondaries (smokes and nitro beat impacts in most matchups).',
      'Vertical Sledge with no hard breach below — pure distraction, wins nothing.',
    ],
    drill: {
      heading: 'Drill: spawn-peek timing on Bank',
      html: `<p>Load Bank in Custom Game with a friend. Practice peeking from CEO window at the 0:08 and 0:30 round-timer marks. There's a window where attackers always cross the truck spawn — you can read it and pick the entry fragger before they have utility ready.</p>
<p>After 20 reps, this becomes muscle memory. You'll get free round-opener picks in ranked.</p>`,
    },
    aiVodMention: `<p>Utility timing mismatches are hard to spot in the moment. <a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> tracks your Thatcher / Thermite sync and flags rounds where your timing was off — actionable feedback you can apply the next match.</p>`,
    relatedLinks: [
      { name: 'Bank — Complete Strategy Guide', url: '/guides/bank.html' },
      { name: 'Kafe Dostoyevsky — Complete Strategy Guide', url: '/guides/kafe.html' },
      { name: 'Clubhouse — Complete Strategy Guide', url: '/guides/clubhouse.html' },
      { name: 'Thermite operator guide', url: '/guides/operators/thermite.html' },
      { name: 'Thatcher operator guide', url: '/guides/operators/thatcher.html' },
    ],
    readMinutes: 8,
  },
  {
    game: 'r6',
    gameLabel: 'Rainbow Six Siege',
    fromRank: 'Gold',
    toRank: 'Platinum',
    slug: 'r6-gold-to-platinum',
    metaTitle: 'How to Climb from Gold to Platinum in Rainbow Six Siege (2026)',
    metaDescription: 'Gold-to-Plat is where the metagame matters — meta operator bans, Mira anchor angles, spawn-peek timing, post-plant cycling, and vertical destruction targeting.',
    intro: `<p>At Gold-to-Plat the meta starts mattering. You're playing against people who watch pro VODs, have fixed setups for every site, and know how to counter your default plays. The climb here is meta-awareness plus refined utility usage.</p>`,
    sections: [
      {
        heading: 'Ranked pool ops are mandatory bans',
        html: `<p>Most Gold players don't ban Thatcher or Maverick on attack because they think those are "just Thermite alternatives." Wrong. Thatcher's EMP clears 4-6 enemy gadgets at once — Mute jammers, Mira windows, Bandit batteries, Maestro Evil Eyes. Maverick silently opens reinforced walls without any counter; he fully bypasses Bandit and Kaid.</p>
<p>At Plat, Thatcher and Maverick are banned almost every match on attack. On defense, Mira and Valkyrie are the priority bans. If you don't ban these operators, you're effectively playing 2.5 vs 5.</p>
<p>Ban priorities by side:</p>
<ul>
  <li><strong>Attack-side bans</strong> (you're on defense): Thatcher first, Maverick second, Iana third on certain maps.</li>
  <li><strong>Defense-side bans</strong> (you're on attack): Mira first, Valkyrie second, Maestro third on intel-heavy maps.</li>
</ul>`,
      },
      {
        heading: 'Mira anchor angles — site denial through walls',
        html: `<p>At Gold you might place Mira on the obvious wall (between bomb sites). At Plat, Miras go on angles that read 3-4 attacker positions per round:</p>
<ul>
  <li><strong>Bank:</strong> Mira between CEO and white stairs sees attackers approaching from front lobby.</li>
  <li><strong>Coastline:</strong> Mira between Hookah and VIP stairs denies the standard exec.</li>
  <li><strong>Clubhouse:</strong> Mira between Cash Room and Construction sees the Thermite breach attempt.</li>
  <li><strong>Border:</strong> Mira on Workshop connector wall reads the standard split push.</li>
</ul>
<p>These angles aren't intuitive — they're learned from pro VODs and Top 100 Mira players. Gold Miras play obvious; Plat Miras play surprising.</p>`,
      },
      {
        heading: 'Spawn-peek timing — free round-opener picks',
        html: `<p>Some maps have spawn windows where defenders peek for free picks if attackers don't pre-aim. At Plat, defenders practice these and contest them. Specific timings:</p>
<ul>
  <li><strong>Bank:</strong> CEO window peeks Truck spawn at 0:05 timer.</li>
  <li><strong>Border:</strong> Tellers window peeks East spawn at 0:08.</li>
  <li><strong>Clubhouse:</strong> Bedroom peeks Construction at 0:10.</li>
  <li><strong>Kafe:</strong> Cocktail balcony peeks the standard spawn approach at 0:08.</li>
</ul>
<p>If you're playing attack against a Plat team, pre-aim these windows on round start. You'll catch the spawn-peeker mid-action 30%+ of the time, flipping the early-round economy.</p>`,
      },
      {
        heading: 'Post-plant utility cycling — the round-deciding 30 seconds',
        html: `<p>When the bomb is down, defenders need to break the plant. Pro defenders cycle utility every 5 seconds:</p>
<ol>
  <li>Smoke canister at 0:30 (denies defuse for 5 seconds).</li>
  <li>Maestro Evil Eye laser at 0:25 (chip damage on the planter).</li>
  <li>Goyo canister at 0:20 (forces defuser to swap or die).</li>
  <li>Final frag at 0:15 (kills the defuser if they haven't repositioned).</li>
</ol>
<p>This forces attackers to re-utility (Twitch drone, Thatcher EMP, fresh frags) just to defuse — and most attackers don't have the spare utility for it post-plant.</p>
<p>Practice this sequence on Custom Game with all 5 defenders coordinated. It's the round-deciding 30 seconds in any 1.5 timer.</p>`,
      },
      {
        heading: 'Vertical destruction targeting — open ABOVE the anchor',
        html: `<p>Don't just open the floor — open it directly above the anchor's typical position. On Bank CEO, the Smoke anchor sits behind the desk. Open the floor exactly there with Sledge, drop a frag through. The defender has nowhere to rotate — the desk blocks their movement.</p>
<p>This is round-winning mechanically and psychologically. Defenders feel impossible to defend; attackers feel uncatchable.</p>
<p>Specific Sledge / Buck targets:</p>
<ul>
  <li><strong>Bank CEO:</strong> floor above the bomb default plant (just inside the door).</li>
  <li><strong>Clubhouse Cash:</strong> floor above the back-corner anchor (by the safe).</li>
  <li><strong>Kafe Cocktail:</strong> floor above the bar anchor (the corner where defenders sit for trade).</li>
</ul>`,
      },
    ],
    mistakes: [
      'Not banning meta operators — playing 2.5v5 every round.',
      'Maverick "as a backup Thermite" — wrong tool, wrong timing.',
      'Mira on the obvious wall (front lobby) — easily countered.',
      'No post-plant utility cycle — attackers defuse uncontested.',
      'Vertical destruction without a target — random floor breaks.',
      'Same spawn every round — defenders read your attack site.',
    ],
    drill: {
      heading: 'Drill: post-plant utility timing on Bank CEO',
      html: `<p>Set up a 5-on-5 Custom Game on Bank CEO. As defenders, plant the bomb and intentionally let it stand for the full timer. Practice cycling utility every 5 seconds to stop defuse for the entire 45-second post-plant window.</p>
<p>After 5 reps, your team will have a synced cycle. Apply it in ranked. You'll win 2-3 extra post-plant rounds per match.</p>`,
    },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> tracks utility cycles per round and flags gaps in your post-plant timing — useful for finding the rounds where your team's coordination broke down without a teammate being obviously at fault.</p>`,
    relatedLinks: [
      { name: 'Bank — Complete Strategy Guide', url: '/guides/bank.html' },
      { name: 'Border — Complete Strategy Guide', url: '/guides/border.html' },
      { name: 'Clubhouse — Complete Strategy Guide', url: '/guides/clubhouse.html' },
      { name: 'Coastline — Complete Strategy Guide', url: '/guides/coastline.html' },
      { name: 'Mira operator guide', url: '/guides/operators/mira.html' },
    ],
    readMinutes: 9,
  },
  {
    game: 'r6',
    gameLabel: 'Rainbow Six Siege',
    fromRank: 'Platinum',
    toRank: 'Emerald',
    slug: 'r6-platinum-to-emerald',
    metaTitle: 'How to Climb from Platinum to Emerald in Rainbow Six Siege (2026)',
    metaDescription: 'Plat-to-Emerald is refined positioning — off-angle holds, run-out timing, vertical micro-destruction, anti-meta picks, and drone bait + re-engage tactics.',
    intro: `<p>Plat players have the fundamentals. Emerald players have refinements: off-angle holds, vertical micro-destruction, run-out timing, and anti-meta picks per match-up. Here's the upgrade.</p>`,
    sections: [
      {
        heading: 'Off-angle anchoring — break the predictable corner',
        html: `<p>At Plat, defenders sit on the obvious anchor spots: corner near doorway, default plant corner, etc. Emerald defenders pre-aim from spots opponents don't expect:</p>
<ul>
  <li><strong>Bank CEO:</strong> anchor in the corner BY the safe, not the obvious bomb corner.</li>
  <li><strong>Coastline Hookah:</strong> hold from VIP stairs corner, not the bar.</li>
  <li><strong>Kafe Bar:</strong> anchor on the chair corner facing main entrance, not behind the bar.</li>
  <li><strong>Border Workshop:</strong> hold from Vending side, not behind the workbench.</li>
</ul>
<p>Off-angles force attackers to re-clear after entry — buys the rotator 2-3 seconds and often a free trade kill.</p>`,
      },
      {
        heading: 'Run-out timing on exposed sites',
        html: `<p>Some sites have exterior windows that attackers cross for spawn-peeks. Defenders can run out, peek the exterior window for a free pick, then return to site BEFORE the attacker spawn timer goes negative.</p>
<ul>
  <li><strong>Border:</strong> run out from Workshop window at 0:10, peek attacker spawn, return by 0:25.</li>
  <li><strong>Coastline:</strong> run out from Hookah balcony at 0:08, peek the standard exec approach.</li>
  <li><strong>Bank:</strong> do NOT run out from CEO. It's a trap — attackers always pre-aim it.</li>
</ul>
<p>Run-outs win 2-3 rounds per match if timed right. They're high-risk for solo plays — coordinate with a teammate watching the flank to cover your re-entry.</p>`,
      },
      {
        heading: 'Vertical micro-destruction — single tiles, not whole floors',
        html: `<p>Sledge can break a single floor tile, not the whole floor. Drop a frag through that 1-tile hole onto a known anchor position. The defender doesn't know where the hole is — they think the floor's still intact.</p>
<ul>
  <li><strong>Bank CEO:</strong> micro-tile above the bomb default plant.</li>
  <li><strong>Clubhouse Cash:</strong> micro-tile above the back-corner anchor.</li>
  <li><strong>Kafe Mining:</strong> micro-tile above the bar stool position.</li>
</ul>
<p>Micro-destruction is invisible from below — defenders won't reposition because they can't see the threat. Frag through, kill the anchor, win the round.</p>`,
      },
      {
        heading: 'Anti-meta picks per map',
        html: `<p>Plat plays the meta straight. Emerald varies it based on map. Specifics:</p>
<ul>
  <li><strong>Coastline:</strong> Goyo canisters on the floor below the standard vertical drop — frag the Goyo when attackers vertical you, denies their floor break.</li>
  <li><strong>Bank:</strong> Frost mats in basement on the standard rotation paths — catches attackers post-execute.</li>
  <li><strong>Clubhouse:</strong> Castle barricades on the stairs forces attackers into one entry, your Mira reads it.</li>
  <li><strong>Kafe:</strong> Aruni gates on the connector window forces attackers to bring soft-breach utility (Buck or Sledge), which removes one of their meta picks.</li>
</ul>
<p>Anti-meta picks shock Plats who expect default setups. They lose round 1 to your unfamiliar setup, then over-correct round 2 — you re-adapt.</p>`,
      },
      {
        heading: 'Drone bait + re-engage from opposite entry',
        html: `<p>Send your drone obviously through one entry. Attackers commit utility on that drone — Mute jammers go up, Maestro Evil Eyes activate, Castle barricades stay closed. They've used utility on a fake.</p>
<p>You then exec from the OPPOSITE entry. Their utility is in the wrong place. Specific bait setups:</p>
<ul>
  <li>Bank CEO: drone obvious through Front Lobby, exec through White Stairs.</li>
  <li>Clubhouse Church: drone obvious through Construction, exec through Garage.</li>
  <li>Coastline Theater: drone obvious through Pool, exec through VIP Stairs.</li>
</ul>
<p>This works at Plat because Plat defenders react to drones. Drone bait + opposite exec wins 1-2 rounds per match consistently. The key is committing fully to the bait — your drone needs to take a risky angle the defenders will visibly destroy. A drone that quietly disappears doesn't trigger the defender utility commit.</p>`,
      },
    ],
    mistakes: [
      'Same anchor spot every round — predictable to Emerald reads.',
      'No run-outs on Border / Coastline — free picks lost.',
      'Vertical floor-breaking without a target — open and pray.',
      'Default ranked ops every match — predictable comp.',
      'No drone bait or fake exec — opponents read your real exec every round.',
    ],
    drill: {
      heading: 'Drill: 5-round Custom Game on Bank with role variation',
      html: `<p>Set up a 5-round Custom Game on Bank with a buddy. Each round, vary your strat:</p>
<ol>
  <li>Round 1: run-out from CEO Lobby (defender side practice).</li>
  <li>Round 2: vertical Sledge drop from white stairs.</li>
  <li>Round 3: off-angle hold by the safe (instead of standard corner).</li>
  <li>Round 4: Frost mats in basement on the rotation path.</li>
  <li>Round 5: standard meta exec.</li>
</ol>
<p>Each round forces a different muscle memory. Mix this into your scrim routine and you'll start auto-adapting per-round in ranked.</p>`,
    },
    aiVodMention: `<p>At this elo, finding the predictable habits in your own play is the climb. <a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> tags rounds where you held the same anchor twice in a row or used identical exec timing — the patterns Emerald opponents will exploit.</p>`,
    relatedLinks: [
      { name: 'Coastline — Complete Strategy Guide', url: '/guides/coastline.html' },
      { name: 'Border — Complete Strategy Guide', url: '/guides/border.html' },
      { name: 'Bank — Complete Strategy Guide', url: '/guides/bank.html' },
      { name: 'Goyo operator guide', url: '/guides/operators/goyo.html' },
      { name: 'Sledge operator guide', url: '/guides/operators/sledge.html' },
    ],
    readMinutes: 9,
  },
  {
    game: 'r6',
    gameLabel: 'Rainbow Six Siege',
    fromRank: 'Emerald',
    toRank: 'Diamond',
    slug: 'r6-emerald-to-diamond',
    metaTitle: 'How to Climb from Emerald to Diamond in Rainbow Six Siege (2026)',
    metaDescription: 'Emerald-to-Diamond is adaptability — opponent spawn rotation reads, off-meta picks situationally, late-round 1v1 reads, anti-roam clears, and per-round strat switching.',
    intro: `<p>Emerald is high-elo. The Diamond gap is adaptability — varying strats round-to-round, reading opponent tendencies, and committing to off-meta operators when the match-up calls for it.</p>`,
    sections: [
      {
        heading: 'Read opponent spawn rotations across rounds',
        html: `<p>Watch where attackers spawn in match round 1. They typically pick the same spawn for the next 3-5 rounds. If attackers spawn Truck on Bank, they'll attack CEO. If they spawn Front, they'll attack Tellers.</p>
<p>Diamond defenders adjust setups per spawn read. Same operator pool, different positioning per round.</p>
<p>Read pattern by spawn (Bank example):</p>
<ul>
  <li><strong>Truck spawn → CEO/Open Area attack</strong> (front side of building).</li>
  <li><strong>Front Lobby spawn → Tellers attack</strong> (lobby/stairs split).</li>
  <li><strong>Back Alley spawn → Basement attack</strong> (garage/CCTV access).</li>
</ul>
<p>If you set up for the wrong site, your team's behind from round start. Spawn-read every round and call rotations 30 seconds in.</p>`,
      },
      {
        heading: 'Off-meta picks situationally — not for variety',
        html: `<p>Off-meta isn't "pick something weird every round." It's "pick the operator that beats this specific match-up." Specifics:</p>
<ul>
  <li><strong>Goyo on Coastline kitchen</strong> — denies the standard hookah split.</li>
  <li><strong>Frost on Bank basement</strong> — mats on the rotation cause forced regroups.</li>
  <li><strong>Caveira solo-roam on Kafe</strong> — if attackers stack 4-on-bar, Cave catches the lurker.</li>
  <li><strong>Castle on Bank Tellers</strong> — barricades force attackers into one entry, Mira reads it.</li>
</ul>
<p>Pick off-meta when your read says it wins. Don't pick off-meta because you're bored. Diamond is read-based; randomness loses rounds.</p>`,
      },
      {
        heading: 'Late-round 1v1 reads — opponent habits matter',
        html: `<p>In a 1v1 endgame, the player who reads the other's habits wins. Specifics to read:</p>
<ul>
  <li>Does opponent peek with their off-hand or strong hand?</li>
  <li>Have they reload-peeked once already this match?</li>
  <li>Are they Bandit-tricking on a count or randomly?</li>
  <li>Do they pre-aim head height or chest?</li>
  <li>Have they used their secondary gadget yet (smoke / nitro)?</li>
</ul>
<p>Diamond players read 3 of these per opponent per round. Emerald players read 1. Build the habit by paying attention every round, not just in 1v1s. The information compounds across the match.</p>`,
      },
      {
        heading: 'Anti-roam clear timing — 30s/30s/30s',
        html: `<p>Roaming defenders punish unprotected back lines. Diamond attackers have a structured anti-roam plan:</p>
<ol>
  <li><strong>First 30 seconds:</strong> Lion scan to flush hidden roamers.</li>
  <li><strong>Next 30 seconds:</strong> Iana hologram into common roam corners.</li>
  <li><strong>Next 30 seconds:</strong> Drone every flank as you push to site.</li>
</ol>
<p>At Emerald, attackers ignore roaming defenders and lose 1-2 rounds per match to backstabs. At Diamond, they actively hunt them. The 30/30/30 cycle catches roamers on rotation paths.</p>`,
      },
      {
        heading: 'Mid-round strat switching based on defender reactions',
        html: `<p>Diamond IGLs vary per round based on defender reactions. Sample sequence:</p>
<ol>
  <li>Round 1: hit Bank CEO.</li>
  <li>Round 2: defenders expect CEO; you fake CEO and hit Tellers.</li>
  <li>Round 3: defenders are confused; you go CEO again with the standard exec.</li>
  <li>Round 4: defenders stack CEO; you hit basement.</li>
  <li>Round 5: defenders split — exec the under-defended site.</li>
</ol>
<p>This works because most teams adapt slowly. By round 3 they're still set up for round 1's strat. Diamond IGLs exploit the adaptation lag.</p>`,
      },
      {
        heading: 'Droning depth — clear two rooms before the choke',
        html: `<p>At Emerald, attackers drone the room they're entering. At Diamond, they drone the room AFTER the one they're entering. The reason: roamers play one room behind site, expecting the entry to clear only the immediate threat.</p>
<p>Specific sequence on Bank CEO entry through Front Lobby:</p>
<ol>
  <li>Drone Front Lobby (immediate threat). Clear visible defenders.</li>
  <li>Drone Spiral / White Stairs (the rotation rooms behind Lobby). Catches the roamer who thinks they're hidden.</li>
  <li>Push Lobby with the second drone still scanning Spiral so a teammate can callout if a roamer rotates in.</li>
</ol>
<p>This is two-drone discipline. You burn drones faster but you push into clear space. At Emerald, attackers die to the unseen roamer 2-3 rounds per match. At Diamond, the second drone catches the roamer first.</p>`,
      },
      {
        heading: 'Default round vs eco round — different play styles',
        html: `<p>At Emerald, every round looks the same. At Diamond, there's a clear differentiation between default rounds (full buy, normal exec) and eco rounds (save mode, baited setups).</p>
<p>Eco round play (defender side, after losing 2 in a row):</p>
<ul>
  <li>Pick aggressive roamers like Caveira or Vigil instead of standard anchors.</li>
  <li>Go for round-opener picks at unexpected angles — the goal is round momentum, not site control.</li>
  <li>If you don't get the pick, fall back hard and play for survival, not site defense.</li>
</ul>
<p>Eco round play (attacker side):</p>
<ul>
  <li>Skip hard breach (Thermite / Hibana). Pick Sledge for soft breach + frag.</li>
  <li>Go for an unexpected exec — vertical from above or side-room flank instead of standard.</li>
  <li>If the eco play fails, save your operators for next round's reset.</li>
</ul>
<p>Diamond teams treat eco rounds as a different game. Emerald teams play them like reduced-buy default rounds and lose the round AND the round after.</p>`,
      },
    ],
    mistakes: [
      'Same site every round — predictable to Diamond defender reads.',
      '1v1s without opponent habit reading — auto-pilot peeks.',
      'Anti-roam = "hope they don\'t roam."',
      'Off-meta picks once a match, not situationally.',
      'No spawn rotation read.',
      'IGL calls same strat 3 rounds in a row.',
      'Eco rounds played like default rounds — no differentiation in op picks or strat.',
      'Single-drone before push — roamer in next room kills entry every time.',
    ],
    drill: {
      heading: 'Drill: opponent tendencies log',
      html: `<p>Keep notes after every loss. Examples:</p>
<ul>
  <li>"Round 2: this opponent always Caveira solo-roamed; I should have called for an anti-roam."</li>
  <li>"Round 4: their entry was Ash → Iana → Thatcher; I can read the entry order next match."</li>
  <li>"They Bandit-trick on the 0:50 timer mark consistently. Hibana pellet at 0:48 instead would've worked."</li>
</ul>
<p>Build a mental model of common opponent patterns. After 10 ranked games of note-taking, you'll start anticipating instead of reacting. Diamond is an information game.</p>`,
    },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> can extract opponent habits across multiple matches — useful for spotting tendencies that you can't track in real-time but are obvious in aggregate.</p>`,
    relatedLinks: [
      { name: 'Bank — Complete Strategy Guide', url: '/guides/bank.html' },
      { name: 'Kafe Dostoyevsky — Complete Strategy Guide', url: '/guides/kafe.html' },
      { name: 'Coastline — Complete Strategy Guide', url: '/guides/coastline.html' },
      { name: 'Goyo operator guide', url: '/guides/operators/goyo.html' },
      { name: 'Caveira operator guide', url: '/guides/operators/caveira.html' },
    ],
    readMinutes: 10,
  },
  {
    game: 'r6',
    gameLabel: 'Rainbow Six Siege',
    fromRank: 'Diamond',
    toRank: 'Champion',
    slug: 'r6-diamond-to-champion',
    metaTitle: 'How to Climb from Diamond to Champion in Rainbow Six Siege (2026)',
    metaDescription: 'Diamond-to-Champion is 5% mechanical, 95% mental + macro — utility economy, tilt management, opponent reads across the match, comp swap per round, and communication discipline.',
    intro: `<p>Diamond is top 1% of the playerbase. Champion is the ceiling. The gap is 5% mechanical and 95% mental and macro. Here's what flips the conversion.</p>`,
    sections: [
      {
        heading: 'Per-round utility economy — bank for overtime',
        html: `<p>Champion teams budget utility across the full match. They have a "save round" where they intentionally don't blow utility round 1 (use only frags + flashes). This banks 4 charges of utility for round 6+ when matches go to overtime.</p>
<p>Diamonds blow everything every round. By round 7 in a tied match, they have nothing. Champions still have a Thatcher EMP, two Bandit batteries, and a pre-saved Maestro angle.</p>
<p>Specific: on Bank, save your Thatcher EMP for round 4+ (the second economy round in a long match). The extra utility wins overtime rounds 60% of the time per pro studies.</p>`,
      },
      {
        heading: 'Mental game — tilt management between rounds',
        html: `<p>You will lose rounds you should win. You will get headshot from spawn unfairly. The Champion difference is reset every round — not "next round," now. Same crosshair placement, same default positioning, same mental state.</p>
<p>Specific technique: between rounds, if you feel tilted, do 30 seconds of slow box breathing — 4-second inhale, 4-second hold, 4-second exhale, 4-second hold. Not a meme; it physically lowers heart rate from 95+ BPM (tilt state) to 70 BPM (focus state).</p>
<p>Champion players reset 100% of rounds. Diamond players carry tilt for 2-3 rounds. That's a 2-3 round swing per match — directly the gap between Diamond and Champion MMR.</p>`,
      },
      {
        heading: 'Reading opponent tendencies across the full match',
        html: `<p>You've been playing the same 5 opponents for 30 minutes. By round 4 you should have read:</p>
<ul>
  <li>Their primary defender for each anchor position.</li>
  <li>Their attacker entry order — who fragges first?</li>
  <li>Their utility timings — do they Thatcher early or late?</li>
  <li>Their ban patterns — consistent bans tell you their team's weak comp.</li>
  <li>Their economic round indicator — do they go full SMG-11 secondary on save rounds?</li>
</ul>
<p>Champion teams adapt round 5+ based on this read. Diamond teams keep running the same 3 strats and lose to the meta-game.</p>`,
      },
      {
        heading: 'Comp swap per round — break opponent reads',
        html: `<p>Champions rotate operators across rounds. If your team plays Bank attack and round 1 your Thatcher dies first, round 2 the Thatcher player swaps to Twitch (which doesn't need to peek) and someone else picks up the EMP role.</p>
<p>This breaks opponent reads. They saw your team's "Thatcher-Thermite combo" — round 2 you play "Twitch-Ace" and they over-prepared for the wrong thing.</p>
<p>Practice: in your stack, designate role-fluid players. Two players know how to play both Thatcher and Twitch. Two more know both Thermite and Ace. The 4 hard-breach permutations let you swap freely round-to-round.</p>`,
      },
      {
        heading: 'Communication discipline — calls are decisions, not commentary',
        html: `<p>At Diamond, players spam too many calls. By round 4 the comms are noise. At Champion, calls are short, time-boxed, and decision-driven:</p>
<ul>
  <li>"Roamer top, taking it." (3 seconds, decision made.)</li>
  <li>NOT: "I think the roamer's top, I might push, what should I do?" (15 seconds, no decision.)</li>
</ul>
<p>Practice: between actions, say nothing. Information only when it changes a teammate's decision. No commentary on what just happened — the dead player can already see the kill cam.</p>
<p>This sounds basic. It's not. The mental discipline of <em>not talking</em> when you're tilted or confused is what separates Diamond comms from Champion comms.</p>`,
      },
    ],
    mistakes: [
      'Tilt-stacking losses — 1 lost round becomes 3.',
      'Same comp every round — predictable to Champion-level reads.',
      'Communication overload — no one knows what\'s actually going on.',
      'No save rounds — utility banked at 0 by round 6.',
      'Treating each round independently — no opponent read across the match.',
      'Diamond plateau caused by mental, not mechanical gaps.',
    ],
    drill: {
      heading: 'Drill: 5-game pro-VOD analysis with prediction',
      html: `<p>Watch one professional R6 match. Pause every 30 seconds and predict what the team will do next. Was the next call a rotation? A push? A bait?</p>
<p>By game 5 you'll start anticipating instead of reacting. The pro players are using the exact reads you should be making — once you can predict their decisions, you've internalized the same decision-making framework.</p>
<p>Recommended VODs: Six Invitational finals from the past 2 years. The prep level is highest, the macro is most refined, and the comp swaps round-to-round are textbook.</p>`,
    },
    aiVodMention: `<p>At Diamond+, the gaps are subtle. <a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> compares your decision patterns against pro-tier reads — useful for finding the rounds where you knew the right call but committed to the wrong one anyway.</p>`,
    relatedLinks: [
      { name: 'Coastline — Complete Strategy Guide', url: '/guides/coastline.html' },
      { name: 'Bank — Complete Strategy Guide', url: '/guides/bank.html' },
      { name: 'Kafe Dostoyevsky — Complete Strategy Guide', url: '/guides/kafe.html' },
      { name: 'R6 Operator Comparison Tool', url: '/#/operators' },
      { name: 'Recon+ Pricing & Plans', url: '/#pricing' },
    ],
    readMinutes: 11,
  },
]

// ---------- RENDERING ----------

function renderBreadcrumb(post) {
  return `<nav class="breadcrumb">
    <a href="/">Recon+</a> ›
    <a href="/blog/">Blog</a> ›
    <a href="/blog/?game=${post.game}">${escape(post.gameLabel)}</a> ›
    <span>${escape(post.fromRank)} → ${escape(post.toRank)}</span>
  </nav>`
}

function renderPost(post) {
  const canonical = `${SITE_URL}/blog/${post.slug}.html`
  const sectionsHtml = post.sections.map((s) => `
    <h2 id="${s.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}">${escape(s.heading)}</h2>
    ${s.html}
  `).join('\n')

  const mistakesHtml = post.mistakes && post.mistakes.length ? `
    <div class="callout mistakes">
      <h3>Common ${escape(post.fromRank)}-rank mistakes</h3>
      <ul>${post.mistakes.map((m) => `<li>${m}</li>`).join('')}</ul>
    </div>` : ''

  const drillHtml = post.drill ? `
    <div class="callout drill">
      <h3>${escape(post.drill.heading)}</h3>
      ${post.drill.html}
    </div>` : ''

  const aiHtml = post.aiVodMention || ''

  const relatedHtml = post.relatedLinks && post.relatedLinks.length ? `
    <div class="related">
      <h3>Related Recon+ guides</h3>
      <ul>${post.relatedLinks.map((l) => `<li><a href="${escape(l.url)}">${escape(l.name)}</a></li>`).join('')}</ul>
    </div>` : ''

  const ctaHtml = `
    <div class="intro-cta">
      <h3>Want AI-powered VOD review on your own gameplay?</h3>
      <p>Recon+ Pro reads your replays and flags positioning, utility, and decision mistakes round-by-round. Founding rate $9/mo.</p>
      <a class="btn" href="${SITE_URL}/#pricing">See plans</a>
    </div>`

  const bodyInner = `
    ${renderBreadcrumb(post)}
    <article>
      <h1>${escape(post.metaTitle)}</h1>
      <div class="meta-row">
        <span class="pill">${escape(post.gameLabel)}</span>
        <span class="pill">${escape(post.fromRank)} → ${escape(post.toRank)}</span>
        <span>${post.readMinutes} min read</span>
        <span>Last updated: 2026-05</span>
      </div>
      ${post.intro}
      ${sectionsHtml}
      ${mistakesHtml}
      ${drillHtml}
      ${aiHtml}
      ${relatedHtml}
      ${ctaHtml}
    </article>`

  // JSON-LD: Article + HowTo + BreadcrumbList. HowTo steps are auto-derived
  // from the post sections — Google's HowTo rich result renders these as
  // numbered steps in the SERP for "how to" queries, which is exactly what
  // these posts target.
  const jsonLdBlocks = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.metaTitle,
      description: post.metaDescription,
      author: { '@type': 'Organization', name: 'Recon+' },
      publisher: { '@type': 'Organization', name: 'Recon+', logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-image.png` } },
      datePublished: '2026-05-10',
      dateModified: '2026-05-10',
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      inLanguage: 'en-US',
      articleSection: post.gameLabel,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: `How to climb from ${post.fromRank} to ${post.toRank} in ${post.gameLabel}`,
      description: post.metaDescription,
      totalTime: `PT${post.readMinutes}M`,
      step: post.sections.map((s, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: s.heading,
        text: s.html.replace(/<[^>]+>/g, '').slice(0, 500),
        url: `${canonical}#${s.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Recon+', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog/` },
        { '@type': 'ListItem', position: 3, name: post.gameLabel, item: `${SITE_URL}/blog/?game=${post.game}` },
        { '@type': 'ListItem', position: 4, name: `${post.fromRank} to ${post.toRank}`, item: canonical },
      ],
    },
  ]

  return htmlShell({
    title: post.metaTitle,
    description: post.metaDescription,
    canonical,
    bodyInner,
    jsonLdBlocks,
  })
}

function renderIndex(allPosts) {
  // Group by game for the index page.
  const byGame = {}
  for (const p of allPosts) {
    if (!byGame[p.game]) byGame[p.game] = { label: p.gameLabel, posts: [] }
    byGame[p.game].posts.push(p)
  }

  const sectionsHtml = Object.entries(byGame).map(([gameId, group]) => `
    <section style="margin-bottom: 36px">
      <h2 style="margin-bottom: 12px">${escape(group.label)}</h2>
      <ul style="list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">
        ${group.posts.map((p) => `
          <li>
            <a href="/blog/${p.slug}.html" style="display: block; padding: 16px 18px; background: rgba(255,255,255,0.03); border: 1px solid rgba(0,229,255,0.15); border-radius: 8px; color: inherit; text-decoration: none;">
              <strong style="color: #00e5ff; display: block; margin-bottom: 4px">${escape(p.fromRank)} → ${escape(p.toRank)}</strong>
              <span style="font-size: 0.88rem; color: rgba(230,233,239,0.75)">${escape(p.metaDescription.slice(0, 110))}…</span>
            </a>
          </li>`).join('')}
      </ul>
    </section>`).join('')

  const bodyInner = `
    <h1>Recon+ Blog — Rank-Up Guides for 10 FPS Games</h1>
    <p style="color: rgba(230,233,239,0.8)">Tactical rank-up guides for every supported title. Each guide targets a specific rank gap with operators, callouts, common mistakes, and drills you can run today.</p>
    ${sectionsHtml}
    <div class="intro-cta">
      <h3>Want AI VOD review on top of these guides?</h3>
      <p>Recon+ Pro reads your replays and flags positioning + utility mistakes per round. $9/mo founding rate before May 8.</p>
      <a class="btn" href="${SITE_URL}/#pricing">See plans</a>
    </div>`

  const jsonLdBlocks = [
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Recon+ Blog',
      description: 'Tactical rank-up guides for 10 supported FPS games — R6 Siege, CS2, Valorant, OW2, and more.',
      url: `${SITE_URL}/blog/`,
      publisher: { '@type': 'Organization', name: 'Recon+', logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-image.png` } },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Recon+', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog/` },
      ],
    },
  ]

  return htmlShell({
    title: 'Rank-Up Guides for 10 FPS Games — Recon+ Blog',
    description: 'Tactical guides for every rank gap across R6 Siege, CS2, Valorant, OW2, Apex, Marvel Rivals, Halo, The Finals, CoD, and Fortnite.',
    canonical: `${SITE_URL}/blog/`,
    bodyInner,
    jsonLdBlocks,
  })
}

// ============================================================================
// CS2 POSTS
// ============================================================================
// Counter-Strike 2 rank-up posts. Skill group ladder: Silver → Gold Nova →
// Master Guardian → DMG → LE → LEM → Supreme → Global. Content targets the
// specific tactical gap at each tier — economy at Silver, smoke lineups at
// Nova, opponent reads at LEM, etc.

const CS2_POSTS = [
  {
    game: 'cs2',
    gameLabel: 'Counter-Strike 2',
    fromRank: 'Silver',
    toRank: 'Gold Nova',
    slug: 'cs2-silver-to-nova',
    metaTitle: 'How to Climb Out of Silver in CS2 (2026 Guide)',
    metaDescription: 'Specific tactics that win Silver rounds in CS2 — crosshair placement, AK-47/M4 discipline, plant spot selection, full-buy economy, and the must-know smoke lineups.',
    intro: `<p>Silver in CS2 is the foundation tier. Most Silvers have decent aim but lose rounds to crosshair placement, weapon discipline, and economy mistakes. The Silver-to-Nova climb is fundamentals — fix three habits and you'll move up inside two weeks.</p>`,
    sections: [
      {
        heading: 'One weapon per side, master before you experiment',
        html: `<p>Pick AK-47 on T-side and M4A4 on CT-side. Don't experiment with the Galil, Famas, AUG, or SG 553 yet. Master the one-tap headshot at distance with the AK and the burst control with the M4.</p>
<p>The AK-47 deals 36 body damage and 100+ headshot damage with armor. At 30 meters, two body shots kill. At any range, one headshot kills through helmet. Practice the AK spray pattern in offline mode for 30 minutes — most Silver players never learn it.</p>
<p>The M4A4 has lower damage per bullet but better accuracy in bursts. CT-side gunplay is positional, not aggressive — hold an angle, burst the head when the T peeks. Learn the M4's first-bullet accuracy by tap-firing at long distance in deathmatch.</p>`,
      },
      {
        heading: 'Crosshair placement at head height',
        html: `<p>Walk through any map with your crosshair at chest height and you'll lose 70% of duels in Silver. Walk with the crosshair at head height (about a quarter of the way down the screen for most resolutions, ~165cm in-game) and you'll start one-tapping CTs who peek the same angle every round.</p>
<p>Specific habit: every corner you turn, your crosshair sits at the head height of where the enemy will appear, not where their feet will appear. Most Silvers aim at the floor reflexively — fix this and your kills-per-round triples.</p>
<p>Practice in deathmatch with one rule: if you ever fire a shot when your crosshair was below shoulder height, that kill doesn't count to you. After 10 deathmatch sessions, head-height becomes muscle memory.</p>`,
      },
      {
        heading: 'Plant for the post-plant, not for ease',
        html: `<p>This is a Silver classic. You take A site, kill the anchor, then plant the bomb in the open spot because it's the fastest. Wrong. Plant for the post-plant lineup, not for the easy plant.</p>
<ul>
  <li><strong>Mirage A:</strong> plant at Triple Box (covered by Default common) not Default (exposed to Connector and Stairs).</li>
  <li><strong>Inferno B:</strong> plant in Coffins (covered by New Box) not Site corner (exposed to CT mid).</li>
  <li><strong>Anubis A:</strong> plant at the Connector wall (denies Heaven defuse trade).</li>
  <li><strong>Dust 2 A:</strong> plant at Goose corner (covered by Default and CT) not Default (open to Long).</li>
</ul>
<p>Every plant spot has a teammate who pre-aims the post-plant defuse angle. Pre-plan it. Plant + 1 trade kill on the defuser = round won.</p>`,
      },
      {
        heading: 'The full-buy CT loadout — exact dollars',
        html: `<p>Silver players buy 2 flashes + a smoke and call it good. Wrong. The standard CT-side full-buy includes:</p>
<ul>
  <li>M4A4 ($3100) or M4A1-S ($2900)</li>
  <li>1 flashbang ($200)</li>
  <li>1 smoke grenade ($300)</li>
  <li>1 incendiary ($600)</li>
  <li>Kevlar+helmet ($1000)</li>
  <li>Defuse kit ($400 — critical on CT)</li>
</ul>
<p>Total: ~$5300. That's a full CT buy. T-side is similar but skip the kit, swap the incendiary for a molotov ($400), and you save $400 — use it on a Deagle for the second player as a backup AWP/Deagle threat.</p>
<p>Defuse kit is often skipped at Silver. Don't. The kit changes a 10-second defuse to 5 seconds — the difference between defusing on time and dying mid-defuse.</p>`,
      },
      {
        heading: 'Economy management — when to save vs force buy',
        html: `<p>Silver players force-buy after losing one round, which loses round 2 AND round 3. The rule:</p>
<ul>
  <li><strong>Lost pistol round, less than $3000 round 2:</strong> save full (just pistol). Do NOT force buy at Silver.</li>
  <li><strong>Lost pistol, $3000-4500 round 2:</strong> SMG buy + light kevlar. Goal is round momentum, not winning the round.</li>
  <li><strong>Lost pistol, $4500+ round 2:</strong> rifle force, full team commit.</li>
</ul>
<p>If you save round 2, you full-buy round 3 with $5500+. If you force round 2 and lose, you're stuck on full eco round 3 with $1500. The save-then-full-buy pattern wins more rounds long-term than chained force-buys.</p>`,
      },
    ],
    mistakes: [
      'Buying random rifles (Galil, Famas) instead of the AK / M4.',
      'Crosshair at chest height — losing every duel to head-height CTs.',
      'Planting on the open spot for an easy plant — losing the post-plant trade.',
      'Skipping the defuse kit on CT.',
      'Force-buying after losing round 1 — losing round 2 AND round 3.',
      'Reloading in the open mid-fight.',
      'Sprinting through smokes (you make a target sound).',
    ],
    drill: {
      heading: 'Drill: Mirage A standard execute smokes',
      html: `<p>Load Mirage in offline practice mode. Practice the standard A site execute smoke set:</p>
<ol>
  <li><strong>CT smoke</strong> — from T spawn, blocks the AWP from CT.</li>
  <li><strong>Stairs smoke</strong> — from A Ramp, blocks the rotator from CT spawn.</li>
  <li><strong>Jungle smoke</strong> — from A Main, blocks Connector trade.</li>
  <li><strong>Window smoke</strong> — from Top Mid, denies the Mid AWP.</li>
</ol>
<p>Each lineup takes 5 minutes to learn. After 20 minutes you have the most-used T-side execute on the most-played CS2 map. Apply in matchmaking.</p>`,
    },
    aiVodMention: `<p>If you're losing rounds and can't tell why, the <a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> reads your replays and flags positioning + utility mistakes round by round — useful for catching the habit you don't know you have.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Nova to Master Guardian', url: '/blog/cs2-nova-to-mg.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'CS2 Mirage Guide', url: '/games/cs2/mirage.html' },
      { name: 'CS2 Inferno Guide', url: '/games/cs2/inferno.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 7,
  },
  {
    game: 'cs2',
    gameLabel: 'Counter-Strike 2',
    fromRank: 'Gold Nova',
    toRank: 'Master Guardian',
    slug: 'cs2-nova-to-mg',
    metaTitle: 'How to Climb from Gold Nova to Master Guardian in CS2 (2026 Guide)',
    metaDescription: 'Nova-to-MG is map mastery + smoke lineups + economy reads — three-map focus, five must-know smokes, trade-frag positioning, and AWP discipline.',
    intro: `<p>Gold Nova is where most CS2 players plateau because they have aim but no game sense. Master Guardian is where game sense kicks in: deep map knowledge, real smoke lineups, and economy reads that dictate the buy.</p>`,
    sections: [
      {
        heading: 'Master 3 maps deep, not 7 shallow',
        html: `<p>Pick Mirage, Inferno, and Anubis (or Mirage / Inferno / Dust 2 — three is enough). Play these maps exclusively in matchmaking for two weeks. By end of week 2 you'll know:</p>
<ul>
  <li>Standard CT setups for both bombsites</li>
  <li>T-side execute smokes by lineup, not by feel</li>
  <li>Common spawn-peek angles (and how to avoid them)</li>
  <li>Default plant spots and post-plant lineups</li>
  <li>Where the AWP holds long sightlines on each map</li>
</ul>
<p>If you keep queuing all 9 maps, you never get the depth needed to climb. Nova players play 9 maps shallowly. MG players play 3 maps deeply.</p>`,
      },
      {
        heading: 'Five must-know smoke lineups',
        html: `<p>Each lineup takes ~10 minutes to learn from a YouTube tutorial. Memorize five and you've covered the standard executes on three maps.</p>
<ul>
  <li><strong>Mirage A:</strong> CT smoke from T spawn (blocks the AWP from CT spawn for the A take).</li>
  <li><strong>Mirage B:</strong> Apps smoke from T spawn (denies CT mid rotator).</li>
  <li><strong>Inferno A:</strong> Library one-way smoke (your team can shoot through, defenders can't).</li>
  <li><strong>Inferno B:</strong> Banana flash from T spawn (the round-deciding nade — pop-flashes the CT anchor).</li>
  <li><strong>Anubis A:</strong> Connector smoke (isolates Heaven from Default).</li>
</ul>
<p>Every Nova player who learns 5 smoke lineups climbs to MG inside a month. Aim is already in your hands; lineups are pure knowledge work.</p>`,
      },
      {
        heading: 'Economy reads — count enemy money round-by-round',
        html: `<p>When the enemy team forces, read it: did they win round 1 with full eco? They have $5000 round 2. Did they lose pistol AND round 2? They have $3000 — they're saving round 3.</p>
<p>This information dictates your buy:</p>
<ul>
  <li>Enemy saving (full eco or pistol) → eco round for you (don't full-buy, save for round after).</li>
  <li>Enemy force-buying → full buy and trade frags. Their SMG/shotgun buy can't out-rifle you.</li>
  <li>Enemy full-buying → mirror their buy.</li>
</ul>
<p>If you ignore enemy economy and full-buy every round, you'll go even when you should be ahead. MG teams use the eco state to skip safe round 1 buys for richer round 3 buys.</p>`,
      },
      {
        heading: 'Trade fragging at proper distance',
        html: `<p>Two-on-one duels win rounds. The trade fragger:</p>
<ul>
  <li>Stays within 5 meters of the entry</li>
  <li>Has line-of-sight to the entry's target angle</li>
  <li>Has crosshair pre-aimed at the angle the entry will engage</li>
  <li>Doesn't reload at the same time the entry's pushing</li>
</ul>
<p>Specific drill: Mirage A take. Your entry takes the Stairs angle from Ramp. You're 3 meters behind, crosshair at head height pointed at Stairs. Entry dies → you take the duel within 1 second. The CT just spent recoil cooldown on the entry — your trade kill is free.</p>
<p>If your IGL doesn't call trades and your team doesn't trade naturally, you're not in MG yet. Play with stacks where players know to trade — soloqueue Nova teaches the wrong habits.</p>`,
      },
      {
        heading: 'AWP discipline on CT-side',
        html: `<p>The AWP is the round-decider on most CT maps. Rules:</p>
<ul>
  <li>Hold ONE angle. Don't peek if your team's not trading.</li>
  <li>If you don't get a kill in the first 30 seconds, fall back to a safer position.</li>
  <li>Save the AWP if you can't engage — it's worth $4750. Losing it twice = lost economy.</li>
  <li>Standard CT AWP positions: Mirage CT Spawn (covers Mid), Inferno Banana (covers Banana take), Dust 2 Long (covers Long doors), Anubis Heaven (covers Connector + Default).</li>
</ul>
<p>If your AWPer is dying first every round, swap. The AWP role is map-knowledge-heavy — wrong position loses the AWP and the round.</p>`,
      },
    ],
    mistakes: [
      'Force-buying every round after a loss.',
      'No smoke lineups — eco-balling utility into general areas.',
      'Trading at the wrong distance (10 meters back, miss the trade window).',
      'AWP peeking on rotation, giving away $4750 every round.',
      'Full save round → full buy round (losing the save round in between for no reason).',
      'Playing all 9 maps in rotation, never learning any deeply.',
    ],
    drill: {
      heading: 'Drill: Inferno B execute timing',
      html: `<p>Practice the standard Inferno B execute:</p>
<ol>
  <li><strong>0:50 timer:</strong> Banana molotov to clear the standard CT anchor spot.</li>
  <li><strong>0:48:</strong> Library smoke (deny A rotator).</li>
  <li><strong>0:46:</strong> Two flashbangs over the Banana corner.</li>
  <li><strong>0:45:</strong> B Site smoke + team take.</li>
</ol>
<p>Run this timing 10 times offline. By rep 10 you have the standard MG-level B exec. Apply in matchmaking with your stack.</p>`,
    },
    aiVodMention: `<p>Once you're confident on lineups, <a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> can flag rounds where your trade-frag distance was off — useful when you don't know why a 4v3 became a 0v3.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Nova', url: '/blog/cs2-silver-to-nova.html' },
      { name: 'How to Climb from MG to DMG', url: '/blog/cs2-mg-to-dmg.html' },
      { name: 'CS2 Mirage Guide', url: '/games/cs2/mirage.html' },
      { name: 'CS2 Inferno Guide', url: '/games/cs2/inferno.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
  {
    game: 'cs2',
    gameLabel: 'Counter-Strike 2',
    fromRank: 'Master Guardian',
    toRank: 'DMG',
    slug: 'cs2-mg-to-dmg',
    metaTitle: 'How to Climb from Master Guardian to DMG in CS2 (2026 Guide)',
    metaDescription: 'MG-to-DMG is utility coordination + pro-style positioning — surgical smokes, trade-frag distance, defendable plant spots, round-3 economy lever, and opponent reads.',
    intro: `<p>At MG you have aim and basic game sense. Distinguished Master Guardian is utility coordination and pro-style positioning. The leap is moving from "general area smokes" to "specific sightline smokes" — and from playing the round to playing the match.</p>`,
    sections: [
      {
        heading: 'Pro-style smokes — block specific sightlines',
        html: `<p>At MG, players smoke "the general area." At DMG, smokes block specific sightlines:</p>
<ul>
  <li><strong>Mirage A:</strong> Stairs smoke covers the AWP angle from CT spawn — not "the stairs" generally.</li>
  <li><strong>Inferno B:</strong> New Box molly denies the default anchor position specifically — not "the site."</li>
  <li><strong>Anubis A:</strong> Heaven flash blinds the AWP for 2 seconds — the exact window for entry.</li>
  <li><strong>Dust 2 A:</strong> Pit smoke covers the AWP from Pit corner only — leaves Default common contestable.</li>
</ul>
<p>Each pro smoke has a single purpose. Watch a tier-1 pro VOD with smokes paused — count what each smoke blocks. After 5 VODs you'll think pro-utility.</p>`,
      },
      {
        heading: 'Default plant spots — covered, not exposed',
        html: `<p>DMG players plant for the post-plant lineup, not for the easy plant. Specifics:</p>
<ul>
  <li><strong>Mirage A:</strong> plant at Triple (covered by Default common) not Default (exposed to Connector).</li>
  <li><strong>Inferno B:</strong> plant at Coffins (covered) not Site (exposed to CT mid).</li>
  <li><strong>Anubis A:</strong> plant at Connector wall (denies Heaven defuse trade).</li>
  <li><strong>Dust 2 B:</strong> plant in Plat (covered by Door) not Site corner (open to Tunnels).</li>
</ul>
<p>Every plant spot has a 10-second AWP angle the planter holds while teammates rotate. Pre-plan it. The 0:30 post-plant window is round-deciding — don't waste it on an exposed plant.</p>`,
      },
      {
        heading: 'Round-3 economy lever',
        html: `<p>After winning pistol round, most players go full SMG-buy round 2 (and rifle-buy round 3). This wins round 1 + round 3 even if you lose round 2.</p>
<p>Sequence:</p>
<ol>
  <li><strong>Round 1 (pistol):</strong> full Glock or USP. Win → bonus $700.</li>
  <li><strong>Round 2 (anti-eco):</strong> SMG/shotgun for high frag bonuses, or rifle if rich. Win → bonus $1400.</li>
  <li><strong>Round 3 (full buy):</strong> rifles + utility, full kit.</li>
</ol>
<p>If you lose round 2 anti-eco, the enemy SMG team's economy spikes. Read the round-3 buy carefully — they can full-buy. Adjust accordingly.</p>`,
      },
      {
        heading: 'Trade fragging at 3-5 meter distance',
        html: `<p>The trade fragger should be 3-5 meters behind the entry, with crosshair pre-aimed at the same angle. At MG, trade fraggers are 10 meters back and miss the trade window. The CT just used recoil cooldown on the entry — the trade-fragger has 1-2 seconds to land the kill before the CT realigns.</p>
<p>Drill it: Mirage A take. Entry takes Stairs angle. Trade fragger is 3 meters behind, crosshair at head height pointed at Stairs. Entry dies → trade fragger takes the duel within 1 second. Round won.</p>`,
      },
      {
        heading: 'Reading opponent tendencies in real time',
        html: `<p>By round 5 of any DMG match you should have read at least 2 of:</p>
<ul>
  <li>Does the enemy AWPer always hold the same angle round-to-round? (Predictable peek.)</li>
  <li>Does the enemy IGL call double-A executes when behind? (Forces you to over-rotate to A.)</li>
  <li>Does the enemy molly Banana every Inferno round? (Read it; play around it.)</li>
  <li>Does the enemy lurker take Mid every round? (Mid trade prep.)</li>
  <li>Does the enemy buy AWP only when they have $5500+ savings? (Predict AWP rounds from economy alone.)</li>
  <li>Does the enemy spawn-peek the same window every gun round? (Free pre-aim kill.)</li>
</ul>
<p>DMG is information game. Track 2-3 patterns per match in your head, exploit them rounds 6+. Most DMG players track zero — they just play their own game and hope. The DMG-to-LE gap is converting passive observation into active counter-strats.</p>`,
      },
      {
        heading: 'Eco round playbook — how to win 0-buy rounds',
        html: `<p>DMG players treat eco rounds as throwaways. LE players have an eco playbook that wins ~25% of full ecos:</p>
<ul>
  <li><strong>Stack one site with all 5</strong> — concentrated firepower beats spread defense even with pistols.</li>
  <li><strong>Take the AWP if you kill the enemy AWPer</strong> — flips the round economy and denies them the AWP next round.</li>
  <li><strong>Default Deagle one-tap practice</strong> — Deagle headshot at any range = cheap rifle kill that loots a P250 or better.</li>
  <li><strong>Ninja defuse on plant</strong> — if attackers are pushed off, sneak the defuse instead of fragging.</li>
</ul>
<p>The eco round you steal flips $7000+ of enemy economy across the next 2 rounds. DMG teams write off ecos; LE teams play them as round 1 of a 3-round comeback.</p>`,
      },
    ],
    mistakes: [
      'Smoking general areas not specific angles.',
      'Trade fragger too far back to make the trade window.',
      'Default plant on the exposed corner — losing post-plant defuse.',
      'Skipping round-2 anti-eco buy.',
      'No opponent read by round 5.',
      'Same AWP angle every round.',
      'Treating eco rounds as throwaways instead of stack-and-steal opportunities.',
    ],
    drill: {
      heading: 'Drill: Mirage Window spawn-peek timing',
      html: `<p>Mirage Window peek (CT side) catches A pushers at 0:08 timer mark. Practice in offline mode: peek Window at 0:08 with crosshair at head height pre-aimed at the standard A Ramp player position. Hit the peek 20 times until muscle memory.</p>
<p>Apply in ranked. You'll get a free round-opener pick on most A executes — flips the round economy.</p>`,
    },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> tracks your smoke placement vs pro placement on the same map — useful for spotting where your smokes are blocking the wrong angle.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Nova to MG', url: '/blog/cs2-nova-to-mg.html' },
      { name: 'How to Climb from DMG to LE', url: '/blog/cs2-dmg-to-le.html' },
      { name: 'CS2 Mirage Guide', url: '/games/cs2/mirage.html' },
      { name: 'CS2 Inferno Guide', url: '/games/cs2/inferno.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
  {
    game: 'cs2',
    gameLabel: 'Counter-Strike 2',
    fromRank: 'DMG',
    toRank: 'LE',
    slug: 'cs2-dmg-to-le',
    metaTitle: 'How to Climb from DMG to Legendary Eagle in CS2 (2026 Guide)',
    metaDescription: 'DMG-to-LE is synced executes + spawn-peek timing + AWP rotation + off-angle holds + counter-flank reads. The pro-style refinements that close the gap.',
    intro: `<p>DMG players have utility coordination. Legendary Eagle players have refined pro-style executes and the discipline to commit (or hold) on a coordinated count. Here's the upgrade.</p>`,
    sections: [
      {
        heading: 'Synced execute counts — utility on the beat',
        html: `<p>At DMG, players "smoke when ready." At LE, the IGL counts: "Smoke in 3, 2, 1, GO." All 5 utility hit on the same beat — the enemy can't react fast enough to coordinated cover fire.</p>
<p>Practice with a 5-stack in Custom Game on Mirage. Run a 5-utility A exec with a coordinated count. Repeat 10 times. Apply in ranked. The team that hits utility on a count wins ~70% of executed rounds at this elo.</p>`,
      },
      {
        heading: 'Spawn-peek timings — free round-opener picks',
        html: `<p>Some maps have spawn windows where attackers cross at known timings. CT defenders can peek for free picks:</p>
<ul>
  <li><strong>Mirage Window:</strong> peeks A pushers at 0:08 timer.</li>
  <li><strong>Inferno CT Mid:</strong> peeks Mid takers at 0:10.</li>
  <li><strong>Anubis Mid:</strong> peeks Connectors at 0:12.</li>
  <li><strong>Dust 2 Long Doors:</strong> peeks Long take at 0:09.</li>
</ul>
<p>These aren't intuitive — they're learned from pro VODs and from running them in offline practice. LE-tier defenders practice these timings; DMG-tier attackers don't pre-aim them.</p>`,
      },
      {
        heading: 'AWP angle rotation across rounds',
        html: `<p>At DMG you hold one AWP angle. At LE you rotate per round to break the read:</p>
<ul>
  <li>Round 1: hold Mid Window.</li>
  <li>Round 2: hold Stairs (if they read your round-1 angle).</li>
  <li>Round 3: rotate back to Window with a teammate trading from Stairs.</li>
  <li>Round 4: hold the AWP from CT spawn (off-angle).</li>
</ul>
<p>Predictable AWP positioning loses LE matches. Variation wins them. Specifically: if you held Mid Window 2 rounds in a row and got a kill both times, swap angle for round 3 — the enemy IGL will call a flash + push on Window.</p>`,
      },
      {
        heading: 'Off-angle holds force re-clearing',
        html: `<p>LE defenders pre-aim from spots T-side doesn't expect:</p>
<ul>
  <li><strong>Mirage A:</strong> hold Default from Ramp side (not Triple corner).</li>
  <li><strong>Inferno B:</strong> hold Site from Coffins instead of Default.</li>
  <li><strong>Anubis A:</strong> hold from Heaven side, not Connector.</li>
  <li><strong>Dust 2 A:</strong> hold from CT corner (not the obvious Default angle).</li>
</ul>
<p>Off-angles cost the entry 1-2 seconds of re-clearing. That's the trade window your teammate uses. The pro-tip: switch off-angle every round. The enemy team's first frag remembers angle X — they expect it again next round and you've moved.</p>`,
      },
      {
        heading: 'Counter-flank reads — predict the round',
        html: `<p>By round 5 you've seen patterns. Use them:</p>
<ul>
  <li>If the enemy lurker is always coming through Mid → set up a CT mid trade.</li>
  <li>If the enemy IGL fakes A every economy round → expect the real B exec when they're poor.</li>
  <li>If the enemy team economy means they CAN'T full-buy round 6 → adjust your buy down (eco or force).</li>
  <li>If the enemy AWPer has died twice this match on the same angle → continue pre-aiming it.</li>
</ul>
<p>LE is read-based. Predict the round, prep the counter. DMG plays default rounds; LE plays counter-default rounds.</p>`,
      },
      {
        heading: 'Half-time comp prep — review and adjust',
        html: `<p>At LE you have 30 seconds between rounds 12 and 13 to switch sides. Don't waste it on chat. Use it for a comp prep:</p>
<ul>
  <li>What's the opposing team's strongest player and their weapon? Counter-pick (e.g., bait their AWPer with a forward Deagle pick).</li>
  <li>Which sites did they hit on T-side? Stack the under-defended one on your CT-side.</li>
  <li>Which CT angles did they hold? Avoid those on T-side or run a fake to bait them off.</li>
  <li>Did they tilt-call (frustrated comms after losses)? You're winning the half — don't let up.</li>
</ul>
<p>LE teams do this comp prep automatically every match. DMG teams chat-talk through the half-time and start round 13 unprepared.</p>`,
      },
    ],
    mistakes: [
      'Uncoordinated utility timing (smoke when ready).',
      'Predictable AWP angles every round.',
      'Default holds only — no off-angle variation.',
      'No counter-flank read by round 5.',
      'Spawn-peek timings unknown — free CT picks lost.',
      'No half-time comp prep — round 13 starts cold.',
    ],
    drill: {
      heading: 'Drill: Inferno B fake-A → real-B exec',
      html: `<p>Run a fake-A then real-B execute:</p>
<ol>
  <li><strong>0:55:</strong> full utility commit to A — Library smoke, Pit molly, two flashes from A Long.</li>
  <li><strong>0:48:</strong> 4 players visible at A common, AWPer baits at A long.</li>
  <li><strong>0:42:</strong> quick rotate to B through CT mid (the rotators have already left B).</li>
  <li><strong>0:38:</strong> exec B Site with whatever utility remains.</li>
</ol>
<p>Catches LE-tier defenders out of position 50%+ of attempts. Run it as a stack 5-10 times for the timing.</p>`,
    },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> tracks your AWP angle variation across the match — useful for spotting when you've held the same spot 3 rounds in a row without realizing it.</p>`,
    relatedLinks: [
      { name: 'How to Climb from MG to DMG', url: '/blog/cs2-mg-to-dmg.html' },
      { name: 'How to Climb from LE to LEM', url: '/blog/cs2-le-to-lem.html' },
      { name: 'CS2 Inferno Guide', url: '/games/cs2/inferno.html' },
      { name: 'CS2 Anubis Guide', url: '/games/cs2/anubis.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
  {
    game: 'cs2',
    gameLabel: 'Counter-Strike 2',
    fromRank: 'LE',
    toRank: 'LEM',
    slug: 'cs2-le-to-lem',
    metaTitle: 'How to Climb from LE to LEM in CS2 (2026 Guide)',
    metaDescription: 'LE-to-LEM is macro reads — utility tracking across the match, comp swap per round, pro-aim consistency, tilt protection round 13+, and map veto strategy.',
    intro: `<p>LE players read opponents per round. LEM players read across the entire match. The macro upgrade — utility tracking, comp swaps, and tilt protection — is what closes the gap.</p>`,
    sections: [
      {
        heading: 'Util tracking — count enemy nades round-to-round',
        html: `<p>By round 5 of a match you should have a rough count of enemy utility used. Each player carries 2-3 nades by default. If the enemy has burned 50%+ of utility by round 5, they're light on nades for round 6+.</p>
<p>Specific tracking:</p>
<ul>
  <li>Enemy Banana mollies: 1 per match per CT typically. Round 1-3 used = no Banana molly round 4.</li>
  <li>Enemy A executes: 4-5 utility per round. Two A executes by round 5 = they're light for round 6.</li>
  <li>Enemy AWP rounds: each AWP loss = no AWP round 7+ unless they hit the bonus.</li>
</ul>
<p>If you remember which utility the enemy has, you predict their force-buy capacity. LEM teams play the round assuming the enemy has X — LE teams play assuming the enemy has full kit.</p>`,
      },
      {
        heading: 'Comp swap per round — break opponent reads',
        html: `<p>LE teams play the same 5-role comp every round. LEM teams swap roles per round:</p>
<ul>
  <li>Round 1: standard AWPer + standard entry.</li>
  <li>Round 5: AWPer plays support angle, entry picks up the AWP.</li>
  <li>Round 8: original AWPer back, but on a different angle.</li>
</ul>
<p>This breaks opponent reads of "their AWPer always plays X angle." Now their AWPer's angle is unknown round-to-round. The enemy team has to re-read every round.</p>
<p>Practice: in your stack, designate role-fluid players. 2 players know how to play both AWP and rifle support. The role swap is a 30-second pre-round call from the IGL.</p>`,
      },
      {
        heading: 'Pro-grade aim refinement',
        html: `<p>At LEM, raw aim has to compete with pro players' practice routines. Daily aim:</p>
<ul>
  <li><strong>30 minutes/day of scenario practice</strong> — Aim Lab Gridshot, scenario-specific tracking drills.</li>
  <li><strong>30 minutes/day of CS2 deathmatch</strong> with rifle only.</li>
  <li><strong>30 minutes/day of recoil training</strong> — offline, shoot at wall, learn AK and M4 spray pattern from muscle memory.</li>
</ul>
<p>LEM aim is consistent: 30%+ headshot rate on rifle, 60%+ on AWP. Track yours in the in-game stats screen. If you're below these numbers, fix the aim regimen first — utility coordination doesn't matter if your duels are lost.</p>`,
      },
      {
        heading: 'Tilt protection round 13+',
        html: `<p>LE players win 11 rounds, then lose 4 in a row to tilt. LEM players reset every round.</p>
<p>The reset technique: between rounds, deep breath in for 4 seconds, hold 4, exhale 4. Lower heart rate from tilted (95+ BPM) to focused (70 BPM). It's not a meme — it physically lowers your heart rate and your reaction time stays sharp.</p>
<p>If you can't reset from tilt at LE, you'll never reach LEM consistently. Round 13 onwards is where matches are won — if your team's tilted at the half, the second half is a 11-15 loss.</p>`,
      },
      {
        heading: 'Map veto pre-game prep',
        html: `<p>By LE you should have 2-3 maps you crush + 2-3 maps you lose. Veto your weak maps. Pick your strong maps. Specific veto pattern for matchmaking:</p>
<ul>
  <li>Ban: your weakest map first (Vertigo or Ancient typically).</li>
  <li>Ban: enemy's strongest map (you can read this from their stats).</li>
  <li>Pick: your strongest map (Mirage or Inferno usually).</li>
  <li>Decider: whichever map you have the highest win rate on this season.</li>
</ul>
<p>LEM teams pick maps based on opponent reads. If the enemy lost their last 5 Mirage games, ban Mirage off them. Veto wins the match before round 1.</p>`,
      },
    ],
    mistakes: [
      'Blowing utility every round — no eco round 6 reserves.',
      'Same comp 7 rounds in a row — predictable to LEM-level reads.',
      'Raw aim plateau — 25% headshot rate ceiling.',
      'Tilt-stacks — losing 4 rounds in a row after a frustrating loss.',
      'No veto strategy — playing whatever map gets picked.',
    ],
    drill: {
      heading: 'Drill: 2-week aim regimen',
      html: `<p>90 minutes/day of structured aim:</p>
<ol>
  <li><strong>30 min Aim Lab</strong> — Gridshot for clicking, Strafeshot for movement aim.</li>
  <li><strong>30 min CS2 deathmatch</strong> — rifle only, no AWP, no pistol.</li>
  <li><strong>30 min recoil training</strong> — offline AK spray at the wall, M4 burst at the wall, learn the patterns to muscle memory.</li>
</ol>
<p>Track headshot % weekly via the stats screen. If you're not at 28%+ after 2 weeks, extend to 4 weeks. Aim is the foundation — utility doesn't fix lost duels.</p>`,
    },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> can compute your headshot rate by weapon and map — useful for finding the gun-map combination that's holding back your stats.</p>`,
    relatedLinks: [
      { name: 'How to Climb from DMG to LE', url: '/blog/cs2-dmg-to-le.html' },
      { name: 'How to Climb from LEM to Supreme', url: '/blog/cs2-lem-to-supreme.html' },
      { name: 'CS2 Mirage Guide', url: '/games/cs2/mirage.html' },
      { name: 'CS2 Inferno Guide', url: '/games/cs2/inferno.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
  {
    game: 'cs2',
    gameLabel: 'Counter-Strike 2',
    fromRank: 'LEM',
    toRank: 'Supreme',
    slug: 'cs2-lem-to-supreme',
    metaTitle: 'How to Climb from LEM to Supreme Master First Class in CS2 (2026 Guide)',
    metaDescription: 'LEM-to-Supreme is pro-VOD prep, map-specific pro setups, mid-match strat switching, enemy economy reads round 12+, and tier-1 communication discipline.',
    intro: `<p>LEM is the top 2% of CS2. Supreme Master First Class is the top 0.7%. The gap is pro-VOD-level prep, mid-match adaptation, and mental discipline at the high-pressure rounds 12+.</p>`,
    sections: [
      {
        heading: 'Pro-VOD watching as practice',
        html: `<p>Watch one tier-1 CS2 match per day. Pause every 30 seconds. Predict the next call. Was it a default? An exec? A counter-strat?</p>
<p>By VOD 10 you'll start anticipating pro decisions. By VOD 30 you'll think like a pro IGL during your own matches.</p>
<p>Recommended VODs: BLAST Premier finals, IEM Cologne, ESL Pro League. Avoid casual content — only watch tier-1 prep level. The macro decision-making at this tier is what you're absorbing, not the aim. Aim's already at LEM.</p>`,
      },
      {
        heading: 'Map-specific pro setups',
        html: `<p>Each pro team has signature setups. Astralis on Inferno Banana. NaVi on Anubis. Vitality on Mirage. Watch their exec patterns and copy:</p>
<ul>
  <li><strong>Astralis Inferno B:</strong> smoke timing 0:50, molly 0:48, flash 0:46, Banana take 0:45. The 5-second windows are deliberate.</li>
  <li><strong>NaVi Anubis A:</strong> 5-utility split with 2 from Mid, 3 from A Main. Synced commit on count.</li>
  <li><strong>Vitality Mirage A:</strong> 4-utility with the AWPer holding off-angle Connector for the trade.</li>
</ul>
<p>Pros set up rounds 5+ with information from rounds 1-4. Copy this thinking into your own play.</p>`,
      },
      {
        heading: 'Mid-match strat switching every 3 rounds',
        html: `<p>Supreme teams switch strats every 3 rounds based on opponent adaptation:</p>
<ol>
  <li>Rounds 1-3: standard exec patterns.</li>
  <li>Rounds 4-6: switch comp + utility timings (the enemy's adapted to round 1-3).</li>
  <li>Rounds 7-9: re-adapt based on round 4-6 wins/losses.</li>
  <li>Rounds 10-12: half-time prep + comp adjustment.</li>
  <li>Rounds 13+: counter-strats based on full-half data.</li>
</ol>
<p>LEM teams hold the same strat for 5 rounds. Supreme teams switch every 3. The enemy team adapts in 5 rounds — Supreme teams beat the adaptation curve.</p>`,
      },
      {
        heading: 'Reading enemy economy round 12+',
        html: `<p>By round 12 of a long match you should know:</p>
<ul>
  <li>Enemy total utility used (rough count).</li>
  <li>Enemy AWP availability (yes/no per round based on saves and losses).</li>
  <li>Enemy IGL's force-buy patterns (do they force after one loss or two?).</li>
  <li>Enemy team's emotional state (winning streak vs losing streak).</li>
</ul>
<p>This dictates your buy and strat round 13+. If the enemy is forced to eco round 13, you can full-buy + run a riskier strat (the eco can't punish bad utility). If the enemy can full-buy, you mirror the buy.</p>`,
      },
      {
        heading: 'Communication discipline at high elo',
        html: `<p>LEM teams over-comm. Supreme teams comm short and decisive:</p>
<ul>
  <li>"Roamer top, taking it." (3 seconds, decision made.)</li>
  <li>"Smoke landed, push in 3, 2, 1." (Synced execute call.)</li>
  <li>"Anchor heaven, save AWP." (Post-loss recovery decision.)</li>
</ul>
<p>NOT: "I think the roamer's top, I might push, what do you think?" (15 seconds, no decision.) Mid-round commentary is noise. Information only — and only when it changes a teammate's decision.</p>`,
      },
      {
        heading: 'Anti-stack reads — when the enemy bunches up',
        html: `<p>Supreme teams notice when the enemy stacks. Three CTs on A site means B is open. The standard counter:</p>
<ul>
  <li>Fake A with 2 utility (smoke + flash), pull rotators.</li>
  <li>Quick rotate to B with 4 players. The 1 leftover CT can't hold against 4.</li>
  <li>Plant fast at B for the post-plant cycle. Rotators are caught between sites.</li>
</ul>
<p>The read happens through droning A early — if you see 3 silhouettes through smoke, B is the play. LEM teams commit to the called site even when info contradicts. Supreme teams audible mid-round based on info.</p>`,
      },
      {
        heading: 'Tilt management at the high-pressure rounds',
        html: `<p>Rounds 14-22 are where matches are decided. Tilt protection is non-negotiable. Specific technique that works at this elo:</p>
<ul>
  <li>Between rounds, 4-second box breath (in 4, hold 4, out 4, hold 4). Drops heart rate from 95+ BPM (tilted) to 70 BPM (focused).</li>
  <li>If you lose 2 in a row, IGL calls a "default round" — no trick play, just fundamentals. Resets the team's mental.</li>
  <li>If you lose 3 in a row, IGL calls a player swap if anyone's tilting visibly. The mental swap is more valuable than 1 round of frags.</li>
</ul>
<p>Supreme teams have this protocol. LEM teams tilt-stack into 6-round losing streaks.</p>`,
      },
    ],
    mistakes: [
      'No pro VOD prep — playing on instinct, not pattern recognition.',
      'Copy-paste team strats with no mid-match switching.',
      'No enemy economy read by round 12.',
      'Comm-overload — flooding voice with non-decisions.',
      'Treating round 13+ like rounds 1-12 — no half-time adaptation.',
      'No anti-stack read — committing to called site when info contradicts.',
      'Tilt-stacking into 4-6 round losing streaks.',
    ],
    drill: {
      heading: 'Drill: 30 days of pro-VOD-per-day',
      html: `<p>Watch one tier-1 CS2 match per day for 30 days. Tracking sheet on your phone — note 1 thing learned per match. By day 30 you'll have 30 specific takeaways: utility timings, default plant spots, anti-eco buys, half-time reads.</p>
<p>This is the practice routine that bridges LEM to Supreme. The gap isn't aim — it's pattern recognition at the pro level.</p>`,
    },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> can compare your decision patterns against pro-tier reads round-by-round — useful for finding the rounds where you knew the right call but committed to the wrong one anyway.</p>`,
    relatedLinks: [
      { name: 'How to Climb from LE to LEM', url: '/blog/cs2-le-to-lem.html' },
      { name: 'How to Climb from Supreme to Global', url: '/blog/cs2-supreme-to-global.html' },
      { name: 'CS2 Mirage Guide', url: '/games/cs2/mirage.html' },
      { name: 'CS2 Inferno Guide', url: '/games/cs2/inferno.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
  {
    game: 'cs2',
    gameLabel: 'Counter-Strike 2',
    fromRank: 'Supreme',
    toRank: 'Global Elite',
    slug: 'cs2-supreme-to-global',
    metaTitle: 'How to Climb from Supreme Master to Global Elite in CS2 (2026 Guide)',
    metaDescription: 'Supreme-to-Global is macro round structure, mechanical reset, pro-aim consistency, enemy emotional reads, and matchmaking veto strategy.',
    intro: `<p>Supreme Master First Class is the top 0.7%. Global Elite is the top 0.1%. The gap is mental, mechanical, and macro at the highest tier — fewer mistakes per round, better reads across the match, and consistent aim every duel.</p>`,
    sections: [
      {
        heading: 'Macro round structure across 24 rounds',
        html: `<p>Global teams script the match across all 24 rounds:</p>
<ol>
  <li>Rounds 1-3: probe enemy comp + utility patterns.</li>
  <li>Rounds 4-6: pick best counter-strat based on probe data.</li>
  <li>Rounds 7-9: lock in the winning pattern.</li>
  <li>Rounds 10-12: half-time comp prep.</li>
  <li>Rounds 13-15: switch sides, re-probe.</li>
  <li>Rounds 16-18: counter-strat round 2.</li>
  <li>Rounds 19-24: closeout (or comeback) plays.</li>
</ol>
<p>Supreme teams play round-to-round. Global teams play match-to-match. Every round is a piece of the larger plan.</p>`,
      },
      {
        heading: 'Mechanical reset discipline every round',
        html: `<p>At Global, you will get one-tapped from spawn unfairly. You will lose a 4v1. The Global difference is reset. Every round.</p>
<p>Specific: 2-second mental reset between rounds. Same crosshair, same default position, same focus. No commentary on the previous round. Any deviation costs the round.</p>
<p>The reset is what 0.1% of CS2 players have. Most players who reach Supreme can't reset; they tilt round 14+ and lose the half. Global players reset 100% of rounds.</p>`,
      },
      {
        heading: 'Pro-aim consistency benchmarks',
        html: `<p>Specific aim numbers you should hit by Global:</p>
<ul>
  <li><strong>30%+ headshot rate on rifle.</strong></li>
  <li><strong>60%+ headshot rate on AWP.</strong></li>
  <li><strong>80%+ on Deagle one-taps</strong> (yes, really, at this level).</li>
</ul>
<p>If your numbers are below, you have an aim ceiling that's blocking the climb. Drill: 1 hour/day of focused aim. AK spray, M4 burst, Deagle one-tap. Track weekly. The aim regimen is non-negotiable at Global queue.</p>`,
      },
      {
        heading: 'Enemy emotional reads',
        html: `<p>By round 14 you should know if the enemy team is frustrated or focused. Their callout volume drops when focused, rises when tilting. Their utility usage gets sloppier when tilting. Their AWPer over-peeks when tilting.</p>
<p>Global IGLs read this and call counter-strats that exploit tilt:</p>
<ul>
  <li>Enemy is tilting → run safe defaults; they over-extend trying to make a play.</li>
  <li>Enemy is focused → switch up your strats; they're reading you fast.</li>
  <li>Enemy is split (some tilted, some focused) → bait the tilted player with risky exec, the focused player traps it.</li>
</ul>`,
      },
      {
        heading: 'Veto and matchmaking macro',
        html: `<p>Global queues: top 5 maps prepped + top 5 banned. Veto wins the match before the first round.</p>
<p>Specifically:</p>
<ul>
  <li>Ban opponents' best 2 maps based on their match history.</li>
  <li>Pick your best 2 maps.</li>
  <li>Decider goes to the map you have the highest win rate vs their comp style.</li>
</ul>
<p>Supreme teams ignore veto strategy and play whatever map gets picked. Global teams win 60%+ of matches at veto. The veto edge compounds across a season — the teams that veto well climb faster than teams that just play better.</p>`,
      },
      {
        heading: 'Anti-flash + anti-utility positioning',
        html: `<p>At Global, the enemy team will throw perfect utility every round. The Global counter is positioning that minimizes utility damage:</p>
<ul>
  <li><strong>Stand at flash-resistant angles</strong> — corners where the wall blocks pop-flashes. Specific spots: Mirage A Default behind Triple, Inferno B in Coffins corner, Anubis A in Connector cubby.</li>
  <li><strong>Pre-aim molly spots</strong> — if the enemy mollies the same spot every round (Banana corner on Inferno, Pit on Mirage), don't stand there. Move 5 meters back; the molly damage drops to zero.</li>
  <li><strong>Smoke-spot off-angles</strong> — when the enemy smokes, the smoke fade window is 3 seconds. Pre-aim the fade angle from the side the smoke doesn't fully cover.</li>
</ul>
<p>This is positional discipline that requires 1000+ rounds of practice. Supreme players know the angles theoretically; Global players use them in every round.</p>`,
      },
      {
        heading: 'Endgame 1v1 reads — read the opponent in 5 seconds',
        html: `<p>Global 1v1s are won on reads, not aim. In the 5 seconds before contact:</p>
<ul>
  <li>What's the opponent's last move? (Reload? Repositioned? Just won a duel?)</li>
  <li>What angle did they hold round 1? (Predictable peek?)</li>
  <li>Are they tilted (just lost their AWPer)? (Over-aggressive peek incoming.)</li>
  <li>Do they pre-fire common angles? (Counter with a wide swing or jiggle peek.)</li>
</ul>
<p>The reads compound. By round 18 you've collected 30+ data points on the enemy AWPer. The 1v1 endgame uses ALL of them. Most Supreme players use 2-3. Globals use 5-6.</p>`,
      },
    ],
    mistakes: [
      'No macro round structure — playing each round in isolation.',
      'Tilt-resets failing — losing rounds 14+ to mental, not mechanical.',
      'Mechanical aim ceiling — 25% headshot rate ceiling on rifle.',
      'No enemy emotional read by round 14.',
      'No veto strategy — random map picks.',
      'Standing in standard molly spots round-after-round.',
      '1v1 reads using only 1-2 data points instead of 5-6.',
    ],
    drill: {
      heading: 'Drill: 1 month of stat tracking',
      html: `<p>Track per-match: headshot %, K/D, ADR (average damage per round). If numbers are flat over 30 matches, fix the aim regimen first before trying to climb on macro.</p>
<p>Aim is the foundation that lets the macro work. Without 30%+ headshot rate, your reads don't matter — you're losing duels even when you read correctly.</p>`,
    },
    aiVodMention: `<p>At the Global queue level, the gaps are subtle. <a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> compares your in-match adaptation (round 1-3 vs round 4-6) against pro-tier patterns — useful for finding the rounds where you should have switched strat but didn't.</p>`,
    relatedLinks: [
      { name: 'How to Climb from LEM to Supreme', url: '/blog/cs2-lem-to-supreme.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'CS2 Mirage Guide', url: '/games/cs2/mirage.html' },
      { name: 'CS2 Inferno Guide', url: '/games/cs2/inferno.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 10,
  },
]

// ============================================================================
// VALORANT POSTS
// ============================================================================
// Valorant rank ladder: Iron → Bronze → Silver → Gold → Platinum → Diamond
// → Ascendant → Immortal → Radiant. Each post targets the gap to the next
// tier with agent-specific advice, real callouts from current map pool,
// and lineup references where they matter.

const VALORANT_POSTS = [
  {
    game: 'valorant',
    gameLabel: 'Valorant',
    fromRank: 'Iron',
    toRank: 'Bronze',
    slug: 'valorant-iron-to-bronze',
    metaTitle: 'How to Climb Out of Iron in Valorant (2026 Guide)',
    metaDescription: 'Iron-to-Bronze in Valorant — agent pool of 4, crosshair placement, Vandal vs Phantom decision, fundamentals that win Iron rounds.',
    intro: `<p>Iron is the foundation tier in Valorant. Most Iron players have decent reactions but lose rounds to crosshair placement, agent overload, and undisciplined buys. Here's the four-week plan to escape.</p>`,
    sections: [
      {
        heading: 'Pick 4 agents — not the whole roster',
        html: `<p>Valorant has 26+ agents with unique abilities, ult charges, and timing windows. Iron players try to play them all and master none. Pick four:</p>
<ul>
  <li><strong>Phoenix</strong> (Duelist) — self-healing flash + wall, forgiving kit. Curveball flash teaches lineup thinking.</li>
  <li><strong>Brimstone</strong> (Controller) — straightforward smokes from a top-down map. No lineup memorization needed.</li>
  <li><strong>Sage</strong> (Sentinel) — wall + heals + slow orbs. Most-played defender role at low elos for a reason.</li>
  <li><strong>Sova</strong> (Initiator) — recon arrow gives free intel. Drone scouts for the team. Hard to throw with.</li>
</ul>
<p>Master these four, then expand. KAY/O, Cypher, and Jett go on the list at Bronze when you're ready for more complex utility timing.</p>`,
      },
      {
        heading: 'Crosshair placement at head height',
        html: `<p>Walk through any map with your crosshair at chest height and you'll lose 70% of duels in Iron. Walk with the crosshair at head height (about a quarter of the way down the screen) and you'll start one-tapping enemies who peek the same angle every round.</p>
<p>Specific habit: every corner you turn, your crosshair sits at the head height of where the enemy will appear. Most Iron players aim at the floor. Fix this single habit and your kills-per-round triples.</p>
<p>Practice in deathmatch with one rule: if you ever fire when your crosshair was below shoulder height, that kill doesn't count. After 10 deathmatch sessions, head-height becomes muscle memory.</p>`,
      },
      {
        heading: 'Vandal vs Phantom — pick one, master it',
        html: `<p>Both rifles cost 2900 credits. The choice:</p>
<ul>
  <li><strong>Vandal</strong> — one-shot headshot at any range. Slower fire rate. Reward for one-tap aim.</li>
  <li><strong>Phantom</strong> — faster fire rate, body-shot insurance, but loses the one-shot at long range.</li>
</ul>
<p>At Iron, pick Vandal. The one-shot headshot rewards good crosshair placement and punishes bad placement decisively. You'll learn aim discipline faster on Vandal because every body shot you take is a "should have been a headshot" lesson.</p>
<p>Switch to Phantom at Gold+ when you understand range-based decisions. Don't switch back and forth — pick one for 100 hours, then experiment.</p>`,
      },
      {
        heading: 'Buy discipline — the 3000-credit eco line',
        html: `<p>Iron players buy randomly. The rule: if your team has less than 3000 credits per player on round 2 (after losing pistol), save full. Just pistol, no shields, no utility.</p>
<p>The save round gives you ~3500 credits round 3 for a full Vandal + light shields buy. The force-buy round 2 with 2500 credits gets you a Spectre + nothing — guaranteed loss. Then you're stuck on full eco round 3.</p>
<p>Specifics:</p>
<ul>
  <li>Round 1 lost pistol: save round 2.</li>
  <li>Round 2 won (eco): force or save round 3 based on credits.</li>
  <li>Round 2 lost (eco): save round 3, full-buy round 4.</li>
</ul>`,
      },
      {
        heading: 'Don\'t push first — trade frags',
        html: `<p>The first player through a doorway in Iron dies because they have no info advantage. Let your teammate commit, then peek behind them on the trade. Two-on-one fights win rounds — period.</p>
<p>This is the hardest habit to build because Iron feels like a frag race. It's not. It's a positioning game. The team that trades frags wins rounds 70%+ of the time even with worse aim.</p>
<p>If your teammate dies in the doorway, you peek the SAME doorway from a slightly different angle within 2 seconds. The enemy just used recoil cooldown — their first shot will miss. Your trade kill is free.</p>`,
      },
    ],
    mistakes: [
      'Spawn-peeking with no info — dying first 30 seconds.',
      'Buying random rifles + utility every round.',
      'Force-buying after a loss — losing round 2 AND round 3.',
      'Switching agents every match — no specialization.',
      'Picking Reyna and trying to 1v5.',
      'Crosshair at chest height.',
      'Pushing first into rooms — no trade.',
    ],
    drill: {
      heading: 'Practice routine for week 1',
      html: `<ul>
  <li><strong>30 min aim training</strong> — Aim Lab Gridshot or Valorant Range with bots, Vandal only.</li>
  <li><strong>15 min map walk on Bind</strong> — load Range, walk every site, learn callouts.</li>
  <li><strong>5 ranked games per day</strong> — 4 with your 4-agent pool, 1 to experiment.</li>
</ul>
<p>If you commit to fundamentals — small agent pool, head-height crosshair, save-don't-force, trade fragging — you'll exit Iron inside two weeks.</p>`,
    },
    aiVodMention: `<p>If you can't tell why specific rounds feel off, the <a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> reads your replays and flags positioning + ability usage mistakes per round — useful when you know you're losing but can't see why.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/valorant-bronze-to-silver.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Valorant Bind Guide', url: '/games/valorant/bind.html' },
      { name: 'Valorant Haven Guide', url: '/games/valorant/haven.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 7,
  },
  {
    game: 'valorant',
    gameLabel: 'Valorant',
    fromRank: 'Bronze',
    toRank: 'Silver',
    slug: 'valorant-bronze-to-silver',
    metaTitle: 'How to Climb from Bronze to Silver in Valorant (2026 Guide)',
    metaDescription: 'Bronze-to-Silver is map awareness — three-map focus, callout vocabulary, basic smokes by map, trade-frag positioning, and stop dry pushing.',
    intro: `<p>Bronze players know agent kits but don't have map awareness yet. The rank that separates Bronze from Silver is "did you survive 30 seconds without a callout?" — Silvers know maps deeply enough to position alone.</p>`,
    sections: [
      {
        heading: 'Master 3 maps. Stop playing the whole rotation',
        html: `<p>Pick Bind, Haven, and Ascent (or any three of the current 10-map pool). Play these maps exclusively for two weeks. By end of week 2 you'll know:</p>
<ul>
  <li>Every site's name and standard plant spots</li>
  <li>Where common defenders set up</li>
  <li>Where to throw your basic smokes</li>
  <li>Standard agent picks for your team comp</li>
  <li>Which exterior angles get spawn-peeked</li>
</ul>
<p>If you queue all 10 maps, you never get the depth needed for Silver+. Bronze players play 10 maps shallowly. Silver players play 3 deeply.</p>`,
      },
      {
        heading: 'Learn 7 callouts per map',
        html: `<p>Callouts are how teams coordinate. If a teammate calls "Hookah push!" on Bind and you don't know where Hookah is, you can't rotate. Memorize seven per map:</p>
<p><strong>Bind:</strong> A Site, A Bath, A Truck, B Site, B Hookah, B Window, Mid, Showers, Lamps.</p>
<p><strong>Haven:</strong> A Heaven, A Long, B Site, B Mid, C Site, C Long, C Garage, Mid Doors.</p>
<p><strong>Ascent:</strong> A Site, A Main, A Tree, A Generator, B Site, B Main, B Stairs, Mid, Catwalk, Market.</p>
<p>Drill: load each map in the Range, walk around for 15 minutes, say each callout out loud as you enter the room. After 9 sessions you'll out-position any Bronze player.</p>`,
      },
      {
        heading: 'Five must-know smoke setups',
        html: `<p>Each setup takes 5-10 minutes to learn. Memorize five and you've covered the standard executes on three maps:</p>
<ul>
  <li><strong>Bind A:</strong> Brim smoke on CT + Bath. Denies the AWP from Default and the rotator from Bath.</li>
  <li><strong>Bind B:</strong> Brim smoke on Window + CT. Standard B exec, denies the AWP cross.</li>
  <li><strong>Haven A:</strong> Brim smoke on Heaven + A Link. Denies the rotation trade.</li>
  <li><strong>Ascent A:</strong> Omen smoke on Generator + Tree. Denies the standard CT angle.</li>
  <li><strong>Ascent B:</strong> Omen smoke on Stairs + B Main entry. Synced exec smokes.</li>
</ul>
<p>If your controller doesn't know lineups, do them yourself in custom mode. 30 minutes of lineup practice = 5 lineups memorized.</p>`,
      },
      {
        heading: 'Stop dry pushing — utility before commit',
        html: `<p>Bronze attackers commit first, lose the trade, the round folds. The fix: <strong>no utility, no push.</strong> Before any push, you should have used at least one of: a smoke, a flash, a recon dart, or a drone clear. If you don't have utility ready, you don't push. Period.</p>
<p>Specific check: if you're 30 seconds from round end and you haven't thrown any utility, you're either winning easily (good) or losing the round (most likely). The team that uses utility wins the round 65%+ of the time at Bronze.</p>`,
      },
      {
        heading: 'Trade fragging — second peek wins',
        html: `<p>Two-on-one duels win rounds. The trade fragger:</p>
<ul>
  <li>Stays within 5 meters of the entry</li>
  <li>Has line-of-sight to the entry's target angle</li>
  <li>Has crosshair pre-aimed at the angle the entry will engage</li>
  <li>Doesn't reload at the same time</li>
</ul>
<p>If your teammate dies, you peek the SAME angle within 2 seconds. The defender just used recoil cooldown — their first shot will miss. Your trade kill is free.</p>`,
      },
      {
        heading: 'Buy discipline by round number',
        html: `<p>Valorant economy is unforgiving at Bronze. Specific buy patterns:</p>
<ul>
  <li><strong>Round 1 (pistol):</strong> Classic + light shields + 1 ability. 800 credits remaining for round 2.</li>
  <li><strong>Round 2 (after pistol loss):</strong> Save full. 1900 credits + bonus = 2800 round 3.</li>
  <li><strong>Round 2 (after pistol win):</strong> Sheriff + light shields + 2 abilities. Anti-eco round.</li>
  <li><strong>Round 3 (full buy):</strong> Vandal + full shields + 4 abilities = 4900 credits.</li>
  <li><strong>Round 6 (long match):</strong> Track team economy — if anyone is below 4500, force or save.</li>
</ul>
<p>Bronze players force-buy after round 1 loss with 2500 credits → buy a Spectre + nothing → guaranteed loss → stuck on full eco round 3. The save-then-full-buy pattern wins more rounds long-term.</p>`,
      },
    ],
    mistakes: [
      'Switching agents every match — no specialization.',
      'No callouts learned — can\'t rotate when teammates call.',
      'Smokes thrown without lineups (general area smokes).',
      'Trade fragger 10 meters back — misses the trade window.',
      'Dry pushing without utility.',
      'Buying full SMG round when you should save.',
      'Force-buying after round 1 loss with 2500 credits.',
    ],
    drill: {
      heading: 'Drill: 3-map deathmatch + range loop',
      html: `<p>For each of your 3 chosen maps:</p>
<ul>
  <li><strong>15 min Range</strong> — walk every site, say callouts.</li>
  <li><strong>15 min deathmatch</strong> — practice angles in real fights.</li>
  <li><strong>3 ranked games</strong> on the map.</li>
</ul>
<p>Repeat for 3 maps × 1 week. By end of week you've put 9+ hours into 3 maps. Map knowledge is the Silver gap.</p>`,
    },
    aiVodMention: `<p>Once you're confident on map basics, <a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> can flag rounds where your positioning telegraphed your push direction — useful for spotting predictable habits.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Iron to Bronze', url: '/blog/valorant-iron-to-bronze.html' },
      { name: 'How to Climb from Silver to Gold', url: '/blog/valorant-silver-to-gold.html' },
      { name: 'Valorant Bind Guide', url: '/games/valorant/bind.html' },
      { name: 'Valorant Haven Guide', url: '/games/valorant/haven.html' },
      { name: 'Valorant Ascent Guide', url: '/games/valorant/ascent.html' },
    ],
    readMinutes: 8,
  },
  {
    game: 'valorant',
    gameLabel: 'Valorant',
    fromRank: 'Silver',
    toRank: 'Gold',
    slug: 'valorant-silver-to-gold',
    metaTitle: 'How to Climb from Silver to Gold in Valorant (2026 Guide)',
    metaDescription: 'Silver-to-Gold is utility coordination — synced executes, Sage wall placement, Killjoy ult timing, post-plant lineups, and trade fragging at proper distance.',
    intro: `<p>Silver to Gold is the utility coordination jump. At Silver you might run smokes and flashes but they're not synced. At Gold the smoke lands, the flash pops 0.5 seconds later, and the entry pushes through both — perfect timing.</p>`,
    sections: [
      {
        heading: 'Synced execute counts — utility on the beat',
        html: `<p>At Silver, players "smoke when ready." At Gold, the IGL counts: "Smoke in 3, 2, 1, GO." All 5 utility hit on the same beat.</p>
<p>Practice in Custom Game with a 5-stack. Run a 5-utility A exec on Bind with synced count. Repeat 10 times. Apply in ranked. The team that hits utility on a count wins ~70% of executed rounds.</p>
<p>Specific Bind A exec sequence:</p>
<ol>
  <li><strong>0:55:</strong> Brim smoke on CT.</li>
  <li><strong>0:53:</strong> Brim smoke on Bath.</li>
  <li><strong>0:50:</strong> Phoenix flash from A Short.</li>
  <li><strong>0:48:</strong> Entry takes A Short.</li>
  <li><strong>0:45:</strong> Trade fragger pushes through.</li>
</ol>`,
      },
      {
        heading: 'Sage wall placement on key chokes',
        html: `<p>Sage wall is the most under-used utility in Silver. At Gold, players place walls strategically:</p>
<ul>
  <li><strong>Bind A:</strong> wall blocks the CT-to-Site sightline. Forces defenders to peek the long way.</li>
  <li><strong>Haven C:</strong> wall blocks Garage rotation, isolates C from rest of map.</li>
  <li><strong>Ascent B:</strong> wall on Stairs forces the rotation through Mid only.</li>
</ul>
<p>The wall's effect is ~30 seconds. That's a full execute window where defenders can't trade-rotate. Sage walls win Silver-Gold rounds.</p>`,
      },
      {
        heading: 'Killjoy turret + ult timing',
        html: `<p>Killjoy on defense is one of the strongest agents at Gold. Specifics:</p>
<ul>
  <li>Turret + Alarmbot on the choke. Free kills if defenders push without smoke.</li>
  <li>Nanoswarm grenades on default plant spots — denies plant for ~5 seconds.</li>
  <li>Lockdown ult on retake. Use it as the team executes back, not pre-emptively.</li>
</ul>
<p>The ult timing is the Gold differentiator. Silver Killjoys ult at the wrong time. Gold Killjoys ult at the synced retake call.</p>`,
      },
      {
        heading: 'Post-plant utility cycling',
        html: `<p>When the spike is down, defenders need to break the plant. Pro defenders cycle utility:</p>
<ol>
  <li>Brim molly at 0:35 (denies defuse for 5 seconds).</li>
  <li>Killjoy nanoswarm at 0:30 (chip damage on planter).</li>
  <li>Sage slow orb at 0:25 (slows the rotator).</li>
  <li>Final flash at 0:20 (blinds the defuser).</li>
</ol>
<p>Practice this sequence on Custom Game. It's the round-deciding 30 seconds in any executed round.</p>`,
      },
      {
        heading: 'Trade fragging at 3-5 meter distance',
        html: `<p>The trade fragger should be 3-5 meters behind the entry, with crosshair pre-aimed at the same angle. At Silver, trade fraggers are 10 meters back and miss the trade window.</p>
<p>Drill: Bind A take. Entry takes Bath corner. Trade fragger is 3 meters behind, crosshair at head height pointed at Bath. Entry dies → trade fragger takes the duel within 1 second. Round won.</p>`,
      },
      {
        heading: 'Sentinel setups — Cypher trips and Killjoy turret placement',
        html: `<p>Sentinels win Gold rounds when their utility is placed strategically:</p>
<ul>
  <li><strong>Cypher on Bind:</strong> Trips on Showers (catches A flank), Bath teleporter exit (catches A push), B Hookah corner (catches B push). Spycam in B Window for site intel.</li>
  <li><strong>Cypher on Haven:</strong> Trips on A Long, Garage rotation, C Long. Spycam from Heaven covering all three sites.</li>
  <li><strong>Killjoy on Ascent:</strong> Turret in Tree corner covers A site approach. Alarmbot on Catwalk catches mid takers. Nanoswarm on default plant.</li>
  <li><strong>Killjoy on Sunset:</strong> Turret on B Mall covers the standard B push. Alarmbot in Mid Bottom for early intel.</li>
</ul>
<p>Sentinel utility takes 30 seconds to set up at round start. Use the buy phase + first 30 seconds to place every gadget. If you're contacting at 0:55 timer with utility unplaced, you're playing Silver.</p>`,
      },
      {
        heading: 'Spike plant timing — when to plant for round economy',
        html: `<p>The plant decision matters at Gold:</p>
<ul>
  <li><strong>Plant ASAP if you have 3+ teammates alive:</strong> denies the retake utility cycle.</li>
  <li><strong>Plant slow if 4v5 or worse:</strong> burn timer, save the spike for the next attempt.</li>
  <li><strong>Don't plant in the open:</strong> always plant for the post-plant lineup (Bind A Truck, Bind B Hookah).</li>
  <li><strong>Don't plant if defenders have ult:</strong> you'll get retaken via Killjoy Lockdown or Sova Hunter's Fury.</li>
</ul>
<p>Plant timing is round-deciding. Wrong plant = 30 seconds of trying to defend impossible angles.</p>`,
      },
    ],
    mistakes: [
      'Smokes thrown without sync count.',
      'Sage wall placed in the open (not on a choke).',
      'Killjoy ult pre-emptively (wasted).',
      'No post-plant utility cycle.',
      'Trade fragger too far back.',
      'Sentinel utility unplaced at 0:55 timer.',
      'Plant in the open spot — losing the post-plant defense.',
    ],
    drill: {
      heading: 'Drill: Bind A synced execute',
      html: `<p>Stack 5 in Custom Game. Run the Bind A exec sequence above 10 times. Each rep, the IGL counts the timer; utility hits on the count. After 10 reps the timing is muscle memory.</p>`,
    },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> tracks utility timing per round and flags rounds where your team's exec was off-tempo.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/valorant-bronze-to-silver.html' },
      { name: 'How to Climb from Gold to Plat', url: '/blog/valorant-gold-to-plat.html' },
      { name: 'Valorant Bind Guide', url: '/games/valorant/bind.html' },
      { name: 'Valorant Haven Guide', url: '/games/valorant/haven.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
  {
    game: 'valorant',
    gameLabel: 'Valorant',
    fromRank: 'Gold',
    toRank: 'Platinum',
    slug: 'valorant-gold-to-plat',
    metaTitle: 'How to Climb from Gold to Platinum in Valorant (2026 Guide)',
    metaDescription: 'Gold-to-Plat is comp synergy + map-specific agent picks — Cypher on Bind, Killjoy on Ascent, Viper on Icebox. Plus post-plant lineups and Sova Recon Bolt timings.',
    intro: `<p>Gold-to-Plat is where the Valorant meta starts mattering. You're playing against people who pick agents based on the map, not preference. Here's the meta-aware climb.</p>`,
    sections: [
      {
        heading: 'Map-specific agent picks',
        html: `<p>Each map favors specific agents. Plat players pick by map; Gold players pick by preference and lose comp synergy.</p>
<ul>
  <li><strong>Bind:</strong> Cypher (TP trips), Brimstone (smokes), Skye (flash + heal), Raze (nades clear corners), Phoenix.</li>
  <li><strong>Ascent:</strong> Killjoy (Lockdown ult), Omen (TP smoke), KAY/O (suppression), Jett (mobility), Sova.</li>
  <li><strong>Icebox:</strong> Viper (wall + ult), Sage (wall + heals), Sova (recon), Jett (mobility for vertical), KAY/O.</li>
  <li><strong>Haven:</strong> Cypher (3-site coverage), Astra (global utility), Sova (recon), Jett, Phoenix.</li>
</ul>
<p>If your team's playing Killjoy on Bind or Cypher on Icebox, you've already lost comp. Re-pick.</p>`,
      },
      {
        heading: 'Sova Recon Bolt timings — exact spots',
        html: `<p>Sova Recon Bolt scans for 1.5 seconds and shows enemies through walls. Pro lineups exist for every map:</p>
<ul>
  <li><strong>Ascent A:</strong> Recon from A Main, lands on Heaven, scans the standard anchor + Tree.</li>
  <li><strong>Bind B:</strong> Recon from B Long, lands on Hookah, scans the Hookah + Window angle.</li>
  <li><strong>Haven A:</strong> Recon from A Long, lands on Heaven, scans the trade angle.</li>
</ul>
<p>Each lineup takes 5 minutes from a YouTube tutorial. Plat Sovas have 5+ lineups per map. Gold Sovas throw recon randomly.</p>`,
      },
      {
        heading: 'Comp synergy — controller + sentinel + initiator + 2 duelists',
        html: `<p>Standard Plat comp:</p>
<ul>
  <li>1 Controller (smokes for entry).</li>
  <li>1 Sentinel (defends site, watches flank).</li>
  <li>1 Initiator (recon + flash for entry).</li>
  <li>2 Duelists or 1 Duelist + 1 Flex (entry + trade).</li>
</ul>
<p>If your team has 3 duelists and no controller, you can't smoke executes. If your team has 2 sentinels, you have no entry. Plat queues fill missing roles automatically; Gold queues fight over duelists.</p>`,
      },
      {
        heading: 'Post-plant utility cycling — full 30 seconds',
        html: `<p>Plat-tier post-plant: cycle utility every 5 seconds for 30 seconds total. Defenders forced to re-utility on every cycle.</p>
<ol>
  <li>0:35: smoke the defuser angle.</li>
  <li>0:30: molly the post-plant approach.</li>
  <li>0:25: flash from off-angle.</li>
  <li>0:20: ult denial (Sova Hunter's Fury, KAY/O suppression).</li>
  <li>0:15: trade frag the defuser.</li>
</ol>
<p>If your team plants and dies trying to defend — you didn't post-plant cycle. Practice this in Custom mode.</p>`,
      },
      {
        heading: 'Spike plant for the post-plant lineup',
        html: `<p>At Gold you plant for ease. At Plat you plant for the post-plant lineup. Specific spots:</p>
<ul>
  <li><strong>Bind A:</strong> plant at Truck (defendable from CT and Heaven).</li>
  <li><strong>Bind B:</strong> plant at Hookah (covered by Hookah corner).</li>
  <li><strong>Ascent A:</strong> plant at Default (Tree + Generator covers).</li>
  <li><strong>Ascent B:</strong> plant at Default (Stairs covers).</li>
</ul>
<p>Each plant spot has a 30-second window where the team holds specific angles. Plan it pre-execute.</p>`,
      },
      {
        heading: 'Phantom vs Vandal range matchups by map',
        html: `<p>Plat-tier players pick the right rifle by map and role:</p>
<ul>
  <li><strong>Bind:</strong> Vandal preferred — long sightlines on A Long and B Long reward one-tap.</li>
  <li><strong>Haven:</strong> Vandal for the C Long AWP-trade angles, Phantom for entries on A and B (close range).</li>
  <li><strong>Ascent:</strong> Vandal for A Main long peek, Phantom for B Main close fights.</li>
  <li><strong>Icebox:</strong> Phantom — most fights are mid-range, rapid fire wins more duels than one-tap discipline.</li>
  <li><strong>Sunset:</strong> Phantom for both sites — close range CQB.</li>
</ul>
<p>Wrong rifle for the engagement range = lost duel. Plat fixes this by map; Gold uses the same gun every match.</p>`,
      },
      {
        heading: 'Reading enemy ult points — economy of ults',
        html: `<p>By round 5 you should track enemy ult charges. Each ult costs 6-8 points. After they pop ult, you have 3-4 rounds before they have it again.</p>
<p>Specific tracking:</p>
<ul>
  <li>Jett Blade Storm used round 3 → no ult round 4-7. Push aggressive on those rounds.</li>
  <li>Killjoy Lockdown used round 4 → no retake ult round 5-9.</li>
  <li>Sova Hunter's Fury used round 5 → no recon ult round 6-9.</li>
</ul>
<p>If enemy team has 3+ ults at round 6, eco round to deny ult value. If they have 0 ults, full-buy and push aggressively.</p>`,
      },
    ],
    mistakes: [
      'Picking duelists instead of role-fill.',
      'Sova recon thrown randomly — no lineup.',
      'Plant on the open spot.',
      'No post-plant utility cycle.',
      'Same agent every map.',
      'Wrong rifle for the engagement range.',
      'No ult tracking — surprise ults flip rounds.',
    ],
    drill: {
      heading: 'Drill: 5 Sova lineups in 30 minutes',
      html: `<p>Watch a YouTube Sova lineup video for your 3 main maps. Practice in Custom mode for 30 minutes total — 5 lineups memorized. Apply in ranked. Round-opener picks 30%+ of the time on the maps you know.</p>`,
    },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> can flag rounds where your team's comp was missing a role and the round was lost on synergy, not aim.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/valorant-silver-to-gold.html' },
      { name: 'How to Climb from Plat to Diamond', url: '/blog/valorant-plat-to-diamond.html' },
      { name: 'Valorant Ascent Guide', url: '/games/valorant/ascent.html' },
      { name: 'Valorant Bind Guide', url: '/games/valorant/bind.html' },
      { name: 'Valorant Icebox Guide', url: '/games/valorant/icebox.html' },
    ],
    readMinutes: 8,
  },
  {
    game: 'valorant',
    gameLabel: 'Valorant',
    fromRank: 'Platinum',
    toRank: 'Diamond',
    slug: 'valorant-plat-to-diamond',
    metaTitle: 'How to Climb from Platinum to Diamond in Valorant (2026 Guide)',
    metaDescription: 'Plat-to-Diamond is refined positioning — off-angle setups, Vandal vs Phantom range decisions, jiggle peek mechanics, agent ult timing reads, and counter-utility prep.',
    intro: `<p>Plat players have the fundamentals. Diamond players have refinements: off-angle setups, jiggle-peek mechanics, ult timing reads, and counter-utility prep that flips contested rounds.</p>`,
    sections: [
      {
        heading: 'Off-angle setups — break the predictable corner',
        html: `<p>At Plat, defenders sit on obvious anchor spots. Diamond defenders pre-aim from spots opponents don't expect:</p>
<ul>
  <li><strong>Bind A:</strong> hold from A Truck (not the obvious A Short angle).</li>
  <li><strong>Ascent B:</strong> hold from B Stairs middle (not the corner).</li>
  <li><strong>Haven C:</strong> hold from C Cubby (not C Long).</li>
  <li><strong>Icebox B:</strong> hold from B Yellow (not the obvious Tube angle).</li>
</ul>
<p>Off-angles cost the entry 1-2 seconds of re-clearing. That's the trade window your teammate uses. Switch off-angle every round so opponents can't read it.</p>`,
      },
      {
        heading: 'Vandal vs Phantom range decisions',
        html: `<p>At Plat, players pick one rifle. At Diamond, players pick by the engagement range:</p>
<ul>
  <li>Long range (50m+): Vandal (one-shot headshot still kills at any range).</li>
  <li>Medium range (20-50m): Vandal preferred.</li>
  <li>Close range (under 20m): Phantom (faster fire rate makes spray more effective).</li>
</ul>
<p>If you're holding a long sightline (Bind Long, Haven Long), pick Vandal. If you're entry-fragging in CQB sites, pick Phantom. Plat players use the wrong rifle for the engagement.</p>`,
      },
      {
        heading: 'Jiggle peek mechanics — read before commit',
        html: `<p>The jiggle peek: tap A-D quickly while stepping forward 1 step at a time. The enemy sees a half-second silhouette and reflexes a shot. You step back into cover before their bullet lands.</p>
<p>Result: you've baited their first shot. Now you peek wide for free.</p>
<p>Specific use: Bind Hookah jiggle to bait the AWP. The AWPer fires once → you peek wide and trade. Diamond peeks are layered like this.</p>`,
      },
      {
        heading: 'Ult timing reads — track enemy ult points',
        html: `<p>By round 5 you should have a count of enemy ult charges. Each agent's ult costs 6-8 points. Tracking when they pop ults tells you when they don't have it next round.</p>
<p>Specific reads:</p>
<ul>
  <li>Jett ult used round 3 → no ult round 4-7.</li>
  <li>Killjoy Lockdown ult used round 4 → no ult round 5-9.</li>
  <li>Sova Hunter's Fury used round 5 → no recon ult round 6-9.</li>
</ul>
<p>If the enemy team has 0 ults, full-buy. If they have 3+ ults, eco round to deny their ult value. Plat ignores ult tracking; Diamond builds buys around it.</p>`,
      },
      {
        heading: 'Counter-utility prep — anticipate enemy lineups',
        html: `<p>If the enemy Sova always recons the same spot from A Main, pre-aim that spot at the recon timing. The recon takes 1.5 seconds — your kill on the Sova denies the team's intel for the round.</p>
<p>If the enemy Phoenix always flashes from B Hookah, anti-flash by turning around or holding cover. Your sight comes back faster than their flash window.</p>
<p>Counter-utility is what Diamonds do automatically. Plat players react to utility; Diamond players prep for it.</p>`,
      },
      {
        heading: 'Anti-flash positioning by site',
        html: `<p>At Diamond, the enemy throws perfect pop-flashes every entry. The counter is positioning that minimizes flash exposure:</p>
<ul>
  <li><strong>Bind A:</strong> hold from CT corner facing Site (flash from A Short doesn't hit you).</li>
  <li><strong>Bind B:</strong> hold from CT side of Hookah (flash from Hookah doesn't hit you).</li>
  <li><strong>Ascent A:</strong> hold from Tree corner (flash from A Main doesn't hit you).</li>
  <li><strong>Ascent B:</strong> hold from B Site default behind cover (flash from B Main doesn't hit you).</li>
</ul>
<p>If you're holding an angle that gets flashed every round, move 5 meters laterally. The flash window shifts; you keep sight while the enemy entry is blind.</p>`,
      },
      {
        heading: 'Round-3 economy — the post-pistol lever',
        html: `<p>After winning pistol round, Diamond teams go full SMG-buy round 2 (and rifle-buy round 3). This wins round 1 + round 3 even if round 2 is lost.</p>
<p>Sequence:</p>
<ol>
  <li><strong>Round 1 (pistol):</strong> Classic + light shields. Win → bonus.</li>
  <li><strong>Round 2 (anti-eco):</strong> Spectre or Bulldog + light shields. SMG range fights.</li>
  <li><strong>Round 3 (full buy):</strong> Vandal/Phantom + full shields + 4 abilities.</li>
</ol>
<p>If the enemy team forces round 2 against your SMG buy, your range advantage wins. If they save round 2, you bank credits for round 3 full buy.</p>`,
      },
    ],
    mistakes: [
      'Same anchor spot every round — predictable.',
      'Wrong rifle for the engagement range.',
      'No jiggle peeks — wide swinging into AWPs.',
      'No ult tracking — surprise ults flip rounds.',
      'No counter-utility prep — reacting instead of anticipating.',
      'Standing in the same flash spot every round.',
      'Skipping round-2 anti-eco buy.',
    ],
    drill: {
      heading: 'Drill: jiggle peek practice in Range',
      html: `<p>Load Range with bots set to "easy" (so they don't track). Practice jiggle-peeking: 1 A tap → 1 D tap → step forward 1 frame → step back. Repeat 50 times. The motion becomes muscle memory.</p>
<p>Apply in ranked when peeking AWPs or known angle holders. Bait the first shot, peek wide for the trade.</p>`,
    },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> can flag rounds where you held the same anchor angle 3+ rounds in a row — predictable habits Diamond opponents will exploit.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Gold to Plat', url: '/blog/valorant-gold-to-plat.html' },
      { name: 'How to Climb from Diamond to Ascendant', url: '/blog/valorant-diamond-to-ascendant.html' },
      { name: 'Valorant Bind Guide', url: '/games/valorant/bind.html' },
      { name: 'Valorant Icebox Guide', url: '/games/valorant/icebox.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
  {
    game: 'valorant',
    gameLabel: 'Valorant',
    fromRank: 'Diamond',
    toRank: 'Ascendant',
    slug: 'valorant-diamond-to-ascendant',
    metaTitle: 'How to Climb from Diamond to Ascendant in Valorant (2026 Guide)',
    metaDescription: 'Diamond-to-Ascendant is reading opponent comp + counter-strat per round + retake utility cycles + spawn-peek timings + agent role swap.',
    intro: `<p>Diamond is the high-elo bracket. Ascendant is where reads compound across the match. The gap is round-by-round adaptation, comp counter-picks, and retake utility.</p>`,
    sections: [
      {
        heading: 'Read opponent agent compositions round 1',
        html: `<p>Round 1 you see the enemy team's agents. Use them:</p>
<ul>
  <li>Enemy Cypher → expect TP trips on Bind. Pre-aim TP exits.</li>
  <li>Enemy Killjoy → expect Lockdown ult on retake. Save smokes for the ult counter.</li>
  <li>Enemy Sova → recon coming from common lineup spots. Move from those spots round-by-round.</li>
  <li>Enemy Jett → blade-running every retake. Track Jett ult charge; deny her on cooldown.</li>
</ul>
<p>Diamond players ignore comp; Ascendants build round 1 plans around the read.</p>`,
      },
      {
        heading: 'Comp swap per round — break opponent reads',
        html: `<p>If the enemy reads "their Phoenix always flashes from A Short," round 6 the Phoenix swaps with the Brimstone — a smoke comes from A Short instead. The enemy pre-aim is wrong.</p>
<p>Practice this in your stack: 2 players know multiple agent roles. The role swap is a 30-second pre-round call.</p>`,
      },
      {
        heading: 'Retake utility cycles — coordinated execute back',
        html: `<p>Retake on Ascent A:</p>
<ol>
  <li>Sova recon scans default plant spot.</li>
  <li>Killjoy nanoswarm denies the planter.</li>
  <li>Brim molly the rotation path.</li>
  <li>Team smokes the defuse cross.</li>
  <li>Phoenix flash + entry from CT.</li>
</ol>
<p>Each retake is 5 utility burned in 5 seconds. Retake utility cycles win Ascendant rounds; Diamond teams retake one-by-one and lose.</p>`,
      },
      {
        heading: 'Spawn-peek timings — free round-opener picks',
        html: `<p>Specific timings:</p>
<ul>
  <li><strong>Bind A:</strong> peek A Short window at 0:08.</li>
  <li><strong>Ascent A:</strong> peek A Main from CT at 0:10.</li>
  <li><strong>Haven A:</strong> peek A Lobby from CT at 0:09.</li>
</ul>
<p>Practice these in offline mode. Apply on round 1 every match. Free round-opener picks 30%+ of attempts.</p>`,
      },
      {
        heading: '1v1 reads at the endgame',
        html: `<p>In 1v1 endgame, read the opponent in 5 seconds:</p>
<ul>
  <li>Did they reload? Half their mag is empty. They'll prefer to peek wide for the trade.</li>
  <li>Did they use ult? Their utility is depleted — they can't flash or smoke the next push.</li>
  <li>What's their last position? Predict the rotation path. Most players take the shortest route.</li>
  <li>Are they tilted (just lost a duel)? Over-aggressive peek incoming.</li>
  <li>Have they jiggle-peeked already? They're baiting the first shot — don't bite.</li>
</ul>
<p>Ascendant players use 4-5 reads. Diamond players use 1-2. Build the habit by paying attention every round, not just in 1v1s — the information compounds across the match.</p>`,
      },
      {
        heading: 'Map veto and queue strategy',
        html: `<p>By Diamond you should have 2-3 maps you crush + 2-3 maps you lose. Veto your weak maps in ranked queue. Specific veto pattern:</p>
<ul>
  <li>Toggle your weakest 2-3 maps OFF in queue settings.</li>
  <li>Keep your strongest 5-6 maps ON for queue.</li>
  <li>Prep specifically for the maps you'll see — lineup library, agent picks, common defensive setups.</li>
  <li>Track win rate per map weekly. If you drop below 50% on a map you previously crushed, take it off queue and study pro VODs of that map.</li>
</ul>
<p>The veto compounds — you avoid the 5 maps you lose 60%+ on. Net rank gain over a season is 200+ RR. Diamonds who play all 10 maps queue inefficiently and gain less rank per hour. Ascendants who veto strategically gain ~30% more RR per session.</p>`,
      },
      {
        heading: 'Mid-round adapts based on round-1 reads',
        html: `<p>Ascendant IGLs adapt mid-round based on round 1-3 reads:</p>
<ul>
  <li>If enemy team rushed A round 1 → expect a fake A round 5 (real B exec).</li>
  <li>If enemy AWPer held the same angle round 1-3 → bait that angle round 4 with utility.</li>
  <li>If enemy team economy was forced rounds 1-3 → they're rich round 4. Mirror buy.</li>
</ul>
<p>Diamond teams set the round 1 strat and run it for 6 rounds. Ascendant teams adapt every 3 rounds based on round-1 patterns.</p>`,
      },
    ],
    mistakes: [
      'No comp read round 1 — playing default vs read setup.',
      'Same agents every round — no swap.',
      'Retake one-by-one — uncoordinated.',
      'Spawn-peeks unknown — free CT picks lost.',
      '1v1s without read — auto-pilot peeks.',
      'No queue veto — playing weak maps for free RR loss.',
      'Same strat 6 rounds in a row — predictable to Ascendant reads.',
    ],
    drill: {
      heading: 'Drill: round 1 comp-read protocol',
      html: `<p>Every match, the IGL announces 3 reads on round 1: "Their Cypher has TP trips. Their Killjoy has Lockdown. Their Sova has recon lineups." Team adjusts setup accordingly.</p>
<p>Practice this for 10 matches. After 10 matches, the comp-read protocol is automatic.</p>`,
    },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> compares your comp adaptations across the match — useful for spotting rounds where the right call was obvious but you played default.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Plat to Diamond', url: '/blog/valorant-plat-to-diamond.html' },
      { name: 'How to Climb from Ascendant to Immortal', url: '/blog/valorant-ascendant-to-immortal.html' },
      { name: 'Valorant Ascent Guide', url: '/games/valorant/ascent.html' },
      { name: 'Valorant Bind Guide', url: '/games/valorant/bind.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
  {
    game: 'valorant',
    gameLabel: 'Valorant',
    fromRank: 'Ascendant',
    toRank: 'Immortal',
    slug: 'valorant-ascendant-to-immortal',
    metaTitle: 'How to Climb from Ascendant to Immortal in Valorant (2026 Guide)',
    metaDescription: 'Ascendant-to-Immortal is pro VOD prep + map-specific lineups + tilt management + utility economy across rounds + decisive comm discipline.',
    intro: `<p>Ascendant is top 5% of Valorant. Immortal is top 1%. The gap is pro-VOD-level prep, lineup mastery, and mental discipline at the high-pressure rounds 13+.</p>`,
    sections: [
      {
        heading: 'Pro-VOD watching as practice',
        html: `<p>Watch one tier-1 VCT match per day. Pause every 30 seconds. Predict the call. By VOD 30 you'll think like a pro IGL during your own matches.</p>
<p>Recommended VODs: VCT Champions finals, VCT Masters, regional finals. Avoid casual content — only watch tier-1 prep level. Map-specific patterns are what you're absorbing.</p>`,
      },
      {
        heading: 'Lineup mastery per agent + map',
        html: `<p>Immortal players have ~5 lineups per agent per map they play. Specific:</p>
<ul>
  <li><strong>Sova on Ascent:</strong> 5 recon spots covering A Main, B Main, Mid, Catwalk, retake angles.</li>
  <li><strong>Brim on Bind:</strong> 5 smoke lineups for A exec, B exec, retake A, retake B, mid control.</li>
  <li><strong>Viper on Icebox:</strong> 5 wall positions for A take, B take, A retake, B retake, mid setup.</li>
</ul>
<p>30 minutes per agent + map = 5 lineups memorized. Repeat across 3 main maps. After 4.5 hours of lineup practice you have a tier-1 lineup library.</p>`,
      },
      {
        heading: 'Tilt management round 13+',
        html: `<p>Ascendant players win 11 rounds, then lose 4 to tilt. Immortal players reset every round.</p>
<p>Technique: between rounds, 4-second box breath (in 4, hold 4, out 4, hold 4). Drops heart rate from 95+ BPM (tilted) to 70 BPM (focused). Not a meme — it physically resets your reaction speed.</p>
<p>If you can't reset from tilt at Ascendant, you'll never reach Immortal consistently. Round 13+ is where matches are won.</p>`,
      },
      {
        heading: 'Utility economy across rounds',
        html: `<p>Immortal teams budget utility. They have a "save round" where they intentionally don't blow utility round 1 (use only one util commit). This banks utility for rounds 6+ when match goes long.</p>
<p>Specific: on Bind, save your Sova ult for round 4+ (the second economy round in a long match). The extra ult wins overtime rounds 60% of the time.</p>`,
      },
      {
        heading: 'Communication discipline — decisive comms',
        html: `<p>Ascendant comms over-share. Immortal comms are short:</p>
<ul>
  <li>"Roamer top, taking it." (3 seconds, decision made.)</li>
  <li>"Smoke landed, push in 3, 2, 1." (Synced execute call.)</li>
  <li>"Anchor heaven, save AWP." (Post-loss decision.)</li>
</ul>
<p>NOT: "I think the roamer's top, I might push, what do you think?" (15 seconds, no decision.)</p>`,
      },
      {
        heading: 'Pro lineup library — top 5 maps',
        html: `<p>Immortal players have a lineup library of ~5 lineups per agent on every map they queue. Specific minimums:</p>
<ul>
  <li><strong>Sova on Ascent:</strong> 2 recon spots for A, 2 for B, 1 for Mid. Plus Hunter's Fury post-plant lineup.</li>
  <li><strong>Brim on Bind:</strong> 4 smoke spots for A, 4 for B. Stim Beacon usage on retakes.</li>
  <li><strong>Viper on Icebox:</strong> Wall spots for both sites + Pit ult timing on retake.</li>
  <li><strong>Killjoy on Sunset:</strong> Lockdown ult position + turret spots covering both sites.</li>
  <li><strong>Cypher on Bind:</strong> 6 trip placements + Spycam positions for global intel.</li>
</ul>
<p>30 minutes per agent + map = 5 lineups memorized. Repeat across 5 main maps = 5+ hours of lineup practice. The library is the Ascendant-to-Immortal differentiator.</p>`,
      },
      {
        heading: 'Pro-grade aim consistency',
        html: `<p>Ascendant raw aim plateaus around 22-25% headshot rate. Immortal players hit 28%+ consistently. The gap is daily aim regimen:</p>
<ul>
  <li><strong>30 min/day Aim Lab</strong> — Gridshot + tracking scenarios.</li>
  <li><strong>30 min/day Valorant deathmatch</strong> — Vandal only, hold the same gun.</li>
  <li><strong>30 min/day spray training</strong> — practice the Vandal first-bullet accuracy + the Phantom 5-shot burst.</li>
</ul>
<p>Track headshot % weekly. If you're stuck at 25% after 2 weeks of regimen, the issue is sensitivity or technique — get a coach to review your crosshair placement.</p>`,
      },
      {
        heading: 'Half-time review and round 13+ adaptation',
        html: `<p>Between rounds 12 and 13 you have 30 seconds. Don't waste it on chat. Use it for a comp prep:</p>
<ul>
  <li>Which sites did the enemy hit on T-side? Stack the under-defended one on your CT-side.</li>
  <li>Which agent was their carry? Counter-pick by stacking that angle with utility.</li>
  <li>What was their economy state? Predict round 13 buy.</li>
  <li>Are they tilting? Run defaults — they'll over-extend trying to make a play.</li>
</ul>
<p>Immortal teams do this comp prep automatically. Ascendant teams chat-talk through half-time and start round 13 unprepared. Half-time prep is a 30-second win.</p>`,
      },
    ],
    mistakes: [
      'No pro VOD prep.',
      'Lineup library at 1-2 per agent — not 5+.',
      'Tilt-stacks round 13+.',
      'Blowing utility every round.',
      'Comm-overload.',
      'Headshot rate plateaued at 22-25% — no aim regimen.',
      'No half-time prep — round 13 starts cold.',
    ],
    drill: {
      heading: 'Drill: 30 days of pro-VOD-per-day',
      html: `<p>Watch one tier-1 VCT match per day for 30 days. Tracking sheet on phone — note 1 thing learned per match. By day 30 you'll have 30 specific takeaways.</p>`,
    },
    aiVodMention: `<p>At Immortal queue, gaps are subtle. <a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> compares your decision patterns against pro-tier reads — useful for finding rounds where you knew the right call but committed to the wrong one anyway.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Diamond to Ascendant', url: '/blog/valorant-diamond-to-ascendant.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Valorant Ascent Guide', url: '/games/valorant/ascent.html' },
      { name: 'Valorant Bind Guide', url: '/games/valorant/bind.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
]

// ---------- MAIN ----------

function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  // Stage 3: R6 + CS2 + Valorant. Other games added in subsequent commits.
  const allPosts = [...R6_POSTS, ...CS2_POSTS, ...VALORANT_POSTS]

  let written = 0
  for (const post of allPosts) {
    const html = renderPost(post)
    writeFileSync(join(OUT_DIR, `${post.slug}.html`), html, 'utf8')
    written++
  }

  writeFileSync(join(OUT_DIR, 'index.html'), renderIndex(allPosts), 'utf8')

  console.log(`✓ Generated ${written} blog posts + index in public/blog/`)
  console.log(`  Posts: ${allPosts.map((p) => p.slug).join(', ')}`)
}

main()

export { R6_POSTS, CS2_POSTS, VALORANT_POSTS, htmlShell, renderPost, renderIndex }
