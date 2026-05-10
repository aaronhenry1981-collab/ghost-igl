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

// ---------- MAIN ----------

function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  // Stage 1: only R6 posts. Other games will be added in subsequent commits.
  const allPosts = [...R6_POSTS]

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

export { R6_POSTS, htmlShell, renderPost, renderIndex }
