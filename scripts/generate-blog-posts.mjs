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

// ============================================================================
// OW2 POSTS
// ============================================================================
// Overwatch 2 rank ladder: Bronze → Silver → Gold → Platinum → Diamond → Master
// → Grandmaster → Top 500. 5v5 role-locked. Each post focuses on the
// per-role tactical gap, comp synergy, and ult economy.

const OW2_POSTS = [
  {
    game: 'ow2',
    gameLabel: 'Overwatch 2',
    fromRank: 'Bronze',
    toRank: 'Silver',
    slug: 'ow2-bronze-to-silver',
    metaTitle: 'How to Climb from Bronze to Silver in Overwatch 2 (2026 Guide)',
    metaDescription: 'OW2 Bronze-to-Silver — pick one role, master 2-3 heroes per role, crosshair placement, ult tracking, and the round-losing habits to drop first.',
    intro: `<p>Bronze in Overwatch 2 is the foundation tier. Most Bronze players try to play every hero and master none. The Bronze-to-Silver climb is role specialization, hero-pool focus, and basic ult tracking.</p>`,
    sections: [
      {
        heading: 'Pick one role and stick to it',
        html: `<p>OW2 is 5v5 with locked roles: 1 Tank, 2 DPS, 2 Support. At Bronze, players queue Flex and play whatever role pops — never building real expertise. The fix:</p>
<ul>
  <li><strong>Pick the role you genuinely enjoy.</strong> Tank gets the most game-changing impact at Bronze. Support is the easiest to climb on if your aim is below average. DPS rewards pure mechanical skill.</li>
  <li><strong>Queue role-specific only</strong> for 4 weeks. Don't queue Flex.</li>
  <li><strong>Track win rate per role.</strong> If your DPS win rate is 35% but Support is 55%, the data tells you the role.</li>
</ul>
<p>By the end of 4 weeks of role-locked queue, you'll have 60+ matches of muscle memory on the same role. That's the foundation Silver-tier players have.</p>`,
      },
      {
        heading: 'Master 2-3 heroes per role',
        html: `<p>Pick 2-3 heroes total. Specifics by role:</p>
<ul>
  <li><strong>Tank:</strong> Reinhardt (brawl), Winston (dive), Orisa (anchor). Three archetypes — pick whichever the team comp needs.</li>
  <li><strong>DPS:</strong> Soldier 76 (forgiving aim), Cassidy (CQB + ult), Pharah (vertical advantage on big maps).</li>
  <li><strong>Support:</strong> Mercy (positional, simple kit), Lúcio (utility + healing), Ana (high skill ceiling but rewards practice).</li>
</ul>
<p>Bronze players one-trick a hero AND ignore the comp need. Silver players have a 2-3 hero pool and pick based on map + comp. Don't expand the pool until you're winning consistently with your three.</p>`,
      },
      {
        heading: 'Crosshair placement at head height',
        html: `<p>This is universal across FPS games. Walk through any map with your crosshair at chest height and you'll lose 70% of duels. Walk with the crosshair at head height (about 1/4 of the way down the screen) and your one-shot threshold drops dramatically.</p>
<p>Specific habit: every corner you turn, your crosshair sits at the head height of where the enemy will appear. Most Bronze players aim at the floor.</p>
<p>Practice in custom games with bots: walk a map with no enemies, focus on keeping crosshair at head height through every doorway and corner. After 10 sessions it's automatic.</p>`,
      },
      {
        heading: 'Track enemy ult charges',
        html: `<p>OW2 is an ult-driven game. By 1:30 into the round you should have a rough count of enemy ult availability:</p>
<ul>
  <li>Did the enemy Reinhardt use Earthshatter? They're 60-70 seconds from the next one.</li>
  <li>Did the enemy Ana use Nano? They're 90 seconds out.</li>
  <li>Did the enemy Tracer Pulse Bomb? Wait for it again at minute 2.</li>
</ul>
<p>Bronze players ignore enemy ults. Silver players track 1-2 ults. Gold players track all enemy ults at all times.</p>
<p>Specific habit: when you die, watch the kill cam. Note which ults the enemy team has — call them out in voice chat or pings.</p>`,
      },
      {
        heading: 'Don\'t throw your ult uncoordinated',
        html: `<p>The biggest Bronze mistake: ulting alone into 5 enemies. Specifics:</p>
<ul>
  <li><strong>Reinhardt Earthshatter:</strong> only ult when teammates can follow up with damage ults (Pharah barrage, Soldier visor). Solo Earthshatter = 1 stun, 0 kills.</li>
  <li><strong>Ana Nano:</strong> Nano the carry hero (DPS or Tank with damage ult). Don't Nano a Mercy.</li>
  <li><strong>Cassidy Deadeye:</strong> Use it from cover, with team taking attention. Open-ground Deadeye = 0 kills, 1 dead Cassidy.</li>
  <li><strong>Tracer Pulse:</strong> stick the Tank or grouped enemies. Don't stick a Tracer.</li>
</ul>
<p>The "ult coordination call" is what wins teamfights. If you don't say "Earthshatter ready" in voice and time it with your team, you're throwing the ult.</p>`,
      },
    ],
    mistakes: [
      'Queueing Flex — never specializing.',
      'Hero pool of 8+ — no muscle memory on any.',
      'Crosshair at chest height.',
      'No ult tracking — surprise ults wipe you.',
      'Solo ulting into 5 enemies.',
      'Mercy boost on a Soldier instead of Pharah (boost the aerial).',
      'Tank running ahead of supports (out of heal range).',
    ],
    drill: {
      heading: 'Practice routine for week 1',
      html: `<ul>
  <li><strong>30 min Workshop aim training</strong> — there's a popular Workshop code (look up "AimBots") for hero-specific aim drills.</li>
  <li><strong>5 ranked games per day</strong> on your chosen role with your 2-3 hero pool.</li>
  <li><strong>1 VOD review per session</strong> — watch a high-rank player on your hero for 10 minutes after each session.</li>
</ul>
<p>If you commit to fundamentals — role specialization, small hero pool, head-height crosshair, ult tracking — you'll exit Bronze inside 3-4 weeks.</p>`,
    },
    aiVodMention: `<p>If you can't tell why team fights feel off, the <a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> reads your replays and flags positioning + ult timing mistakes per fight.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/ow2-silver-to-gold.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'OW2 King\'s Row Guide', url: '/games/ow2/kings-row.html' },
      { name: 'OW2 Eichenwalde Guide', url: '/games/ow2/eichenwalde.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
  {
    game: 'ow2',
    gameLabel: 'Overwatch 2',
    fromRank: 'Silver',
    toRank: 'Gold',
    slug: 'ow2-silver-to-gold',
    metaTitle: 'How to Climb from Silver to Gold in Overwatch 2 (2026 Guide)',
    metaDescription: 'Silver-to-Gold OW2 — comp archetypes (dive/poke/brawl), ult chains, high ground positioning, map-specific hero picks, and team fight reset reads.',
    intro: `<p>Silver-to-Gold in OW2 is comp synergy. At Silver, players pick their main without checking team comp. At Gold, picks are based on the team's archetype: dive, poke, or brawl. Here's the leap.</p>`,
    sections: [
      {
        heading: 'Recognize the three comp archetypes',
        html: `<p>OW2 team comps fall into three archetypes:</p>
<ul>
  <li><strong>Dive comp:</strong> Winston + Tracer + Genji + Lúcio + Ana. Mobility-heavy, picks on supports, breaks position.</li>
  <li><strong>Brawl comp:</strong> Reinhardt + Reaper + Mei + Brigitte + Lúcio. CQB-heavy, walks the team forward, wins close fights.</li>
  <li><strong>Poke comp:</strong> Sigma + Hanzo + Widowmaker + Baptiste + Ana. Long-range, holds high ground, wins from distance.</li>
</ul>
<p>Pick a hero that fits the team's archetype. If your team has 4 dive heroes and you pick Bastion, you're throwing. If your team is brawl and you pick Widow, you're throwing.</p>
<p>Quick check: when 4 players have locked, look at the comp. If 3+ are dive, pick dive. If 3+ are brawl, pick brawl.</p>`,
      },
      {
        heading: 'Coordinated ult chains',
        html: `<p>Ult chains are the highest-impact play in OW2:</p>
<ul>
  <li><strong>Grav + Dragon:</strong> Zarya Graviton Surge + Hanzo Dragonstrike. Standard team-wipe combo.</li>
  <li><strong>Nano + Blade:</strong> Ana Nano on Genji Dragonblade. 4 kills on average.</li>
  <li><strong>Earthshatter + Visor:</strong> Reinhardt shatter + Soldier 76 visor. Picks 3-4 stunned enemies.</li>
  <li><strong>Self-Destruct + Whole Hog:</strong> D.Va bomb + Roadhog ult. Forces enemy into chokepoint.</li>
</ul>
<p>The chain timing: ult 1 lands, ult 2 fires within 1 second. Practice these in scrims or Mystery Heroes warm-up. Silver teams ult independently and waste them; Gold teams chain ults and win the fight.</p>`,
      },
      {
        heading: 'High ground positioning by map',
        html: `<p>Every OW2 map has high ground that controls the team fight. Specifics:</p>
<ul>
  <li><strong>King's Row Statue:</strong> hold from Big Window or Roof — long sightline to the choke.</li>
  <li><strong>Eichenwalde Townsquare:</strong> Tavern roof or Bridge gives Pharah/Hanzo angles.</li>
  <li><strong>Ilios Lighthouse:</strong> spiral stairs high ground = control of the entire point.</li>
  <li><strong>Antarctic Peninsula Icebreaker:</strong> Crow's Nest is the dominant angle.</li>
</ul>
<p>Gold players take high ground first; Silver players brawl for the point. The team holding high ground wins the fight 65%+ of the time.</p>`,
      },
      {
        heading: 'Map-specific hero picks',
        html: `<p>The strongest hero by map (Gold-tier reads):</p>
<ul>
  <li><strong>Big maps (Havana, Junkertown):</strong> Pharah/Echo for vertical, Bastion for setup pieces.</li>
  <li><strong>Tight chokes (Hanamura, Volskaya):</strong> Mei (wall + freeze), Reinhardt (brawl walk).</li>
  <li><strong>Vertical maps (Numbani, Rialto):</strong> Pharah dominant if no hitscan counter.</li>
  <li><strong>Indoor sections (Dorado finals, Ilios Well):</strong> Reaper, Mei, brawl heroes.</li>
</ul>
<p>If your team has Pharah on a tight indoor map, swap. If your team has Reinhardt on Havana, swap. Map-specific picks are the Gold differentiator.</p>`,
      },
      {
        heading: 'Team fight reset reads',
        html: `<p>After a wipe (yours or theirs), there's a 25-second window to regroup. Specifics:</p>
<ul>
  <li>If you wiped, the enemy has 5+ second ult advantage. Don't trickle in — wait for the team and fight together.</li>
  <li>If they wiped, push the objective NOW. They'll arrive piecemeal; pick them off.</li>
  <li>If both teams wiped (overtime), the team that respawns closer wins. Read the spawn distances.</li>
</ul>
<p>Silver players trickle in solo and feed. Gold players read the wipe state and regroup or push together.</p>`,
      },
      {
        heading: 'Spawn timing reads on payload maps',
        html: `<p>On Escort and Hybrid maps, defender spawn times shift as the payload progresses. Specifics:</p>
<ul>
  <li>Defender spawn after each payload checkpoint moves 5-8 seconds further away. Track this — your push window grows.</li>
  <li>Attacker spawn stays roughly constant. Your trickle-in mechanics matter less if defenders take longer to return.</li>
  <li>On the final checkpoint, defender spawn is right next to the objective. Don't engage 1v5; wait for your team.</li>
</ul>
<p>Gold players know spawn timings; Silver players don't. The 5-second spawn advantage on Point B vs Point A is the difference between winning and losing the fight.</p>`,
      },
    ],
    mistakes: [
      'Picking your main against comp need.',
      'Solo ulting (not chaining).',
      'Brawling for the point without taking high ground first.',
      'Wrong hero for the map type.',
      'Trickling in after a wipe.',
      'Mercy pocketing the wrong target.',
      'Tank charging without supports in range.',
      'Engaging at final spawn distance — defenders return in 5 seconds.',
    ],
    drill: {
      heading: 'Drill: 3-comp archetype practice',
      html: `<p>Play 5 games with each comp archetype (15 games total):</p>
<ul>
  <li>5 dive games: Winston + Tracer + Lúcio + Ana.</li>
  <li>5 brawl games: Reinhardt + Reaper + Mei + Lúcio + Ana.</li>
  <li>5 poke games: Sigma + Hanzo + Widow + Bap + Mercy.</li>
</ul>
<p>Even if you're flexing, you'll learn how each comp wins the fight. After 15 games you'll auto-recognize comps from the round 1 lock-in screen.</p>`,
    },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> can flag rounds where your hero pick contradicted team comp synergy — useful for spotting "I should have switched" moments.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/ow2-bronze-to-silver.html' },
      { name: 'How to Climb from Gold to Plat', url: '/blog/ow2-gold-to-plat.html' },
      { name: 'OW2 King\'s Row Guide', url: '/games/ow2/kings-row.html' },
      { name: 'OW2 Eichenwalde Guide', url: '/games/ow2/eichenwalde.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
  {
    game: 'ow2',
    gameLabel: 'Overwatch 2',
    fromRank: 'Gold',
    toRank: 'Platinum',
    slug: 'ow2-gold-to-plat',
    metaTitle: 'How to Climb from Gold to Platinum in Overwatch 2 (2026 Guide)',
    metaDescription: 'Gold-to-Plat in OW2 — counter-pick reads, Nano-blade and Grav-Dragon timings, defending high ground, ult economy across multiple fights, and comm discipline.',
    intro: `<p>At Gold-to-Plat, the meta starts mattering. You're playing against people who counter-pick your hero, time their ults precisely, and defend high ground actively. Here's the meta-aware climb.</p>`,
    sections: [
      {
        heading: 'Read enemy comp and counter-pick',
        html: `<p>Round 1 you see the enemy lock-in. Use it:</p>
<ul>
  <li>Enemy Pharah → swap to Soldier 76, Ashe, or Cassidy. Hitscan beats vertical.</li>
  <li>Enemy Doomfist → swap to Cassidy or Brig. Stun shuts down dive.</li>
  <li>Enemy Bastion in setup → swap to Genji deflect or Sombra hack.</li>
  <li>Enemy Widowmaker → swap to Winston or D.Va. Force her off the angle.</li>
</ul>
<p>Counter-picks aren't optional at Plat. If you ignore the enemy team's comp, you lose comp diff. Plat players check enemy comp every round and adjust.</p>`,
      },
      {
        heading: 'Coordinated ult combos with timing',
        html: `<p>Plat-tier ult chains:</p>
<ul>
  <li><strong>Grav-Dragon:</strong> Zarya Graviton lands, Hanzo Dragonstrike fires within 1 second. 4-5 kills.</li>
  <li><strong>Nano-Blade:</strong> Ana Nano-boosts Genji's Dragonblade. Genji clears the back-line in 4 swings.</li>
  <li><strong>Sound Barrier reset:</strong> Lúcio Sound Barrier as the team takes incoming ult damage. Saves the team for re-engage.</li>
  <li><strong>Trans + Coalescence:</strong> Zenyatta Trans + Moira Coalescence stacked = unkillable team for 5 seconds.</li>
</ul>
<p>The combo timing is 1-second windows. Practice in scrims with voice comm: "Grav in 3, 2, 1." Each ult fires on the count.</p>`,
      },
      {
        heading: 'Defending high ground actively',
        html: `<p>At Gold, players take high ground and stay there passively. At Plat, defenders actively defend high ground:</p>
<ul>
  <li>If the enemy Tank tries to pressure your high ground (Winston jump, D.Va boost), the supports peel back to mid-line and the DPS rotates.</li>
  <li>If the enemy Pharah pressures, the hitscan player swaps to Soldier or Cassidy.</li>
  <li>If the enemy uses a flanker (Tracer, Sombra), the Brigitte or Mei holds the back line.</li>
</ul>
<p>Passive high ground is bait. Active high ground is a winning fight every time.</p>`,
      },
      {
        heading: 'Ult economy across multiple team fights',
        html: `<p>OW2 has ~3 team fights per round on most modes. Plat-tier teams budget ults across the fights:</p>
<ul>
  <li>Fight 1: maybe use 2 ults (e.g., Earthshatter + Nano).</li>
  <li>Fight 2: hold ults, use only 1 if forced.</li>
  <li>Fight 3 (overtime): commit all remaining ults for the win.</li>
</ul>
<p>Gold teams blow all ults fight 1, then fight 2-3 with no ult advantage. Plat teams hold ults for the round-deciding fight.</p>`,
      },
      {
        heading: 'Communication discipline at Plat',
        html: `<p>Plat comms are short, decisive, and ult-focused:</p>
<ul>
  <li>"Earthshatter ready" — call ult availability.</li>
  <li>"Grav in 3, 2, 1" — call combo execution.</li>
  <li>"Pharah on flank, swap" — call counter-pick.</li>
  <li>"They wiped, push" — call tempo.</li>
</ul>
<p>Gold comms include commentary ("they're so good, what's our chance?"). Plat comms only contain decisions and information. Train this — it's the biggest comm differentiator.</p>`,
      },
      {
        heading: 'Anti-flank coverage and back-line protection',
        html: `<p>Flankers (Tracer, Sombra, Genji) win Gold rounds by killing supports. Plat teams cover the back line:</p>
<ul>
  <li>Brigitte or Mei plays mid-line, peels for supports on flank pings.</li>
  <li>Cassidy holds an angle that watches the standard flank routes.</li>
  <li>Supports stick within 8m of each other for cross-heal cover.</li>
  <li>Mercy uses Guardian Angel to escape, not to engage solo.</li>
</ul>
<p>If the enemy Tracer is wiping your supports every fight, swap a DPS to Cassidy or Soldier and post on the flank. Gold ignores flanker damage; Plat actively counters.</p>`,
      },
      {
        heading: 'Map-specific ult priority',
        html: `<p>Different maps reward different ults more than others:</p>
<ul>
  <li><strong>King's Row Point A:</strong> Earthshatter into the choke wins the round. Highest priority ult.</li>
  <li><strong>Junkertown payload 2:</strong> Pharah Barrage from above payload destroys the team. High priority.</li>
  <li><strong>Ilios Lighthouse:</strong> Lúcio knock-off ult (Sound Barrier doesn't apply) — Reinhardt charge is the win.</li>
  <li><strong>Hanaoka Point 3 (Mid):</strong> Grav-Dragon combo wins the team fight 80%+ of the time.</li>
</ul>
<p>Plat teams plan ults around map-specific priorities. Gold teams blow ults the moment they're available regardless of map.</p>`,
      },
    ],
    mistakes: [
      'Mains-only — refusing to counter-pick.',
      'Solo ulting (no combo).',
      'Passive high ground (taking it then sitting).',
      'No ult budget across fights.',
      'Comms full of commentary, not decisions.',
      'No back-line peel for flanker damage.',
      'Wrong ult priority for the map (using Earthshatter on a knockoff map).',
    ],
    drill: {
      heading: 'Drill: 5-game counter-pick exercise',
      html: `<p>Play 5 games where you commit to swapping heroes when the enemy counter-picks you. Track:</p>
<ul>
  <li>How many times you swapped per match (target: 2-3 swaps minimum if enemy comp shifts).</li>
  <li>Which counter-picks you used and whether they fixed the matchup.</li>
  <li>Did your swap teach you a new hero in your role pool?</li>
</ul>
<p>By game 5 you'll have 10+ counter-pick scenarios under your belt. Apply in ranked. The swap habit is the Plat-to-Diamond bridge — it's worth more rank than mechanical aim improvement at this stage.</p>`,
    },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> tracks your hero swap timing and flags rounds where you should have counter-picked but didn't.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/ow2-silver-to-gold.html' },
      { name: 'How to Climb from Plat to Diamond', url: '/blog/ow2-plat-to-diamond.html' },
      { name: 'OW2 King\'s Row Guide', url: '/games/ow2/kings-row.html' },
      { name: 'OW2 Eichenwalde Guide', url: '/games/ow2/eichenwalde.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
  {
    game: 'ow2',
    gameLabel: 'Overwatch 2',
    fromRank: 'Platinum',
    toRank: 'Diamond',
    slug: 'ow2-plat-to-diamond',
    metaTitle: 'How to Climb from Platinum to Diamond in Overwatch 2 (2026 Guide)',
    metaDescription: 'Plat-to-Diamond OW2 — round-by-round counter-picks, healing ult timing, overtime double-fight reads, comp swaps mid-match, and pro VOD prep.',
    intro: `<p>Platinum players have comp synergy. Diamond players adapt round-by-round, time healing ults precisely, and read overtime double-fights. The leap is in-match adaptation.</p>`,
    sections: [
      {
        heading: 'Counter-picks per round, not per match',
        html: `<p>Plat teams pick at round start and run the same comp. Diamond teams adapt per round:</p>
<ul>
  <li>If you won round 1 with dive comp → enemy will swap to anti-dive (Brig, Cassidy). Be ready to swap to brawl for round 2.</li>
  <li>If you lost round 1 to brawl → swap to poke comp for round 2 (out-range them).</li>
  <li>If the enemy's main DPS dies first round 2 → they're vulnerable. Push aggressive round 3.</li>
</ul>
<p>Diamond IGLs call hero swaps every round. Plat teams stick with what worked round 1 and lose round 3 because the enemy adapted.</p>`,
      },
      {
        heading: 'Healing ult timing',
        html: `<p>Healing ults (Trans, Coalescence, Sound Barrier, Valkyrie) are the round-savers. Diamond timing:</p>
<ul>
  <li><strong>Trans (Zenyatta):</strong> use to absorb enemy damage ult (Earthshatter, Dragon, Nano-Blade). Don't use it for chip damage.</li>
  <li><strong>Sound Barrier (Lúcio):</strong> use as the team takes ult damage. Saves 4-5 HP per teammate.</li>
  <li><strong>Coalescence (Moira):</strong> use as a re-engage ult, not as a desperate save.</li>
  <li><strong>Valkyrie (Mercy):</strong> use to spread heals across multiple targets. Don't pocket a single target.</li>
</ul>
<p>Plat supports use healing ults reactively (after teammates take damage). Diamond supports use them anticipatively (before the enemy ult lands).</p>`,
      },
      {
        heading: 'Overtime double-fight reads',
        html: `<p>Overtime in OW2 frequently has a "double fight" — both teams wipe and the second wave determines the round. Diamond reads:</p>
<ul>
  <li>If both teams wipe, the team that respawns closer wins the contest. Read spawn distances.</li>
  <li>If you have ults remaining, push immediately. They probably don't.</li>
  <li>If you don't have ults, hold spawn-side high ground and force them to over-extend.</li>
  <li>If overtime is at 0 remaining, every fight is round-ending. Don't trickle.</li>
</ul>
<p>Plat teams trickle into overtime fights. Diamond teams group up and contest as 5.</p>`,
      },
      {
        heading: 'Comp swaps mid-match based on map type',
        html: `<p>Diamond IGLs swap comps mid-match based on map progression:</p>
<ul>
  <li><strong>King's Row:</strong> Point A favors brawl (tight choke), Point B favors poke (open street), final favors dive (back-line targets).</li>
  <li><strong>Junkertown:</strong> First payload section favors poke, second favors brawl, third favors dive (Mercy carry).</li>
  <li><strong>Ilios Well:</strong> Always brawl; close-range knockoffs are the win condition.</li>
</ul>
<p>If your comp doesn't fit the map section, swap. Plat teams stick with what worked at Point A even when Point B demands a different comp.</p>`,
      },
      {
        heading: 'Pro-VOD watching as practice',
        html: `<p>Watch one tier-1 OWCS match per day. Pause every minute. Predict the call. Was it a counter-pick? An ult chain? A regroup?</p>
<p>By VOD 30 you'll start anticipating decisions. The macro decisions at this tier are what you're absorbing — aim is already at Plat-tier.</p>
<p>Recommended VODs: OWCS finals, regional finals. Watch with the "pause and predict" method.</p>`,
      },
      {
        heading: 'Tilt management between rounds',
        html: `<p>Plat players tilt-stack into 3-round losing streaks. Diamond players reset every round. The technique:</p>
<ul>
  <li>30-second box breath between rounds (in 4, hold 4, out 4, hold 4). Drops heart rate from 95+ BPM (tilted) to 70 BPM (focused).</li>
  <li>If you lose 2 rounds in a row, IGL calls for a comp swap. The mental break + the new picks reset both pieces.</li>
  <li>If a teammate is tilting visibly (callouts in caps, blame in voice), don't escalate. Quick "you got this, swap heroes" defuses tilt better than silence.</li>
</ul>
<p>Diamond+ teams have tilt protocols. Plat teams don't and lose the second half.</p>`,
      },
      {
        heading: 'Reading enemy team economy',
        html: `<p>Track enemy ult charges across the entire match, not just round-to-round. By round 5 of a long match you should know:</p>
<ul>
  <li>Enemy total ults available right now (rough count from kill cam observations).</li>
  <li>Enemy DPS ult cycle (used round 2, will have it again round 5).</li>
  <li>Enemy Tank ult cycle (used round 3, will have it round 6).</li>
  <li>Enemy Support ults — most important, they're the round-savers.</li>
</ul>
<p>Diamond teams plan engages around enemy ult availability. If the enemy has 5 ults, hold defensive position. If they have 0, push aggressively. Plat teams ignore this and lose ult diff fights.</p>`,
      },
    ],
    mistakes: [
      'Same comp every round.',
      'Healing ults used reactively, not anticipatively.',
      'Trickling into overtime fights.',
      'No comp swap based on map section.',
      'No pro VOD prep.',
      'Tilt-stacks into 3-round losing streaks.',
      'No ult tracking on enemy team across rounds.',
    ],
    drill: {
      heading: 'Drill: 30 days of pro VOD-per-day',
      html: `<p>Watch one tier-1 OWCS match per day for 30 days. Note 1 specific takeaway per match. By day 30 you'll have 30 specific patterns memorized.</p>
<p>Examples: "OWCS team uses Sound Barrier on the regroup, not the engage." "Pro IGL always swaps tank from Reinhardt to Sigma between Point A and B on King's Row."</p>`,
    },
    aiVodMention: `<p>At Diamond, the gaps are subtle. <a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> compares your decision patterns against pro-tier reads — useful for finding rounds where you knew the right call but committed to the wrong one.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Gold to Plat', url: '/blog/ow2-gold-to-plat.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'OW2 King\'s Row Guide', url: '/games/ow2/kings-row.html' },
      { name: 'OW2 Junkertown Guide', url: '/games/ow2/junkertown.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
]

// ============================================================================
// OW2 HIGH-TIER POSTS (2)
// ============================================================================
const OW2_POSTS_HIGH = [
  {
    game: 'ow2',
    gameLabel: 'Overwatch 2',
    fromRank: 'Diamond',
    toRank: 'Master',
    slug: 'ow2-diamond-to-master',
    metaTitle: 'How to Climb from Diamond to Master in Overwatch 2 (2026 Guide)',
    metaDescription: 'OW2 Diamond-to-Master — mid-fight counter-picks, anticipative healing-ult timing, pro-VOD library at scale, 2-round comp swaps, mechanical benchmarks, and veto strategy.',
    intro: `<p>Diamond players adapt round-by-round. Master players adapt mid-fight. The leap is in-fight comp awareness, anticipative healing-ult timing, and a pro-VOD library deep enough to recognize patterns from a single ult cooldown.</p>`,
    sections: [
      { heading: 'Mid-fight counter-picks — swap during the fight, not before', html: `<p>Diamond IGLs call counter-picks at round start. Master IGLs swap heroes DURING a fight if the matchup tilts wrong. Specifics:</p>
<ul>
  <li>Your DPS is being shut down by Cassidy stuns mid-fight → mid-fight, the DPS dies → respawn as Genji or Tracer (mobility) instead of staying Soldier 76.</li>
  <li>Enemy Tank goes Doomfist → swap your Reinhardt to Sigma at next death. Don't wait for round end.</li>
  <li>Enemy Pharah is dominating → if your hitscan died, respawn as a different hitscan (Cassidy if you were Soldier, Ashe if you were Cassidy).</li>
</ul>
<p>Master IGLs make 4-6 hero swaps per match. Diamond IGLs make 1-2. The mid-fight swap window is the biggest single climb lever at this elo.</p>` },
      { heading: 'Anticipative healing-ult timing', html: `<p>Diamond supports use Trans / Sound Barrier / Coalescence reactively (after damage starts). Master supports time them 1-2 seconds BEFORE the enemy damage ult lands.</p>
<p>Specific reads:</p>
<ul>
  <li>Enemy Reinhardt has Earthshatter charged → pre-emptive Trans when the team is grouped within shatter range.</li>
  <li>Enemy Genji ults from cover → Sound Barrier the moment Dragonblade voiceline triggers.</li>
  <li>Enemy Sigma Gravitic Flux above the team → Trans on the freeze, not after the slam.</li>
</ul>
<p>Anticipation requires tracking enemy ult charge percentages constantly. Most Diamond supports forget to track. Master supports never forget.</p>` },
      { heading: 'Pro-VOD library at scale — 30+ patterns memorized', html: `<p>By Master, you should have 30+ specific OWCS patterns memorized:</p>
<ul>
  <li>Pro Reinhardt always pre-blocks the choke for 3 seconds before charging.</li>
  <li>Pro Ana sleep darts the Tank's primary ult target, not the Tank itself.</li>
  <li>Pro Tracer always Pulse Bombs the grouped Support pair, never solo Tank.</li>
  <li>Pro Lúcio amps speed boost for the engage, then heals for the trade.</li>
</ul>
<p>Build the library by watching one OWCS match per day with the pause-and-predict method. By month 2 you'll have 60+ patterns. By month 3 you're playing at Master-tier macro reads.</p>` },
      { heading: '2-round comp swaps — adapt every 2 rounds', html: `<p>Plat teams hold same comp for 5 rounds. Diamond teams swap every 3. Master teams swap every 2. The cycle:</p>
<ul>
  <li>Rounds 1-2: standard comp probe.</li>
  <li>Rounds 3-4: counter-comp based on round 1-2 reads.</li>
  <li>Rounds 5-6: re-counter or hold based on results.</li>
</ul>
<p>The 2-round window is what beats opponent adaptation. Diamond opponents adapt slowly; Master opponents adapt by round 4. Beat the curve by switching first.</p>` },
      { heading: 'Mechanical aim benchmarks', html: `<p>At Master, the aim ceiling drops most plateaus. Specific benchmarks per role:</p>
<ul>
  <li>Hitscan DPS (Cassidy, Ashe, Soldier): 30%+ headshot rate, 50%+ critical hit rate.</li>
  <li>Tracer / Sojourn: tracking percentage 60%+ on moving targets.</li>
  <li>Ana: Sleep dart hit rate 40%+ on engaged enemies.</li>
  <li>Widowmaker (if maining): 35%+ headshot rate.</li>
</ul>
<p>Track these weekly via in-game stats. If you're stuck at Diamond benchmarks (22-25% headshot), the issue is mechanical, not macro. Fix aim before chasing macro.</p>` },
      { heading: 'Veto strategy and ranked queue optimization', html: `<p>By Diamond you have win-rate data per map. Master players use it strategically:</p>
<ul>
  <li>Toggle off your bottom 3 maps in queue settings.</li>
  <li>Track win rate weekly per map. If a previously-strong map drops below 50%, study pro VODs of it before queueing again.</li>
  <li>Focus practice on your 4-5 strongest maps. Become the team's expert there.</li>
  <li>Note opponent comp tendencies on rematch lobbies — same opponents at this elo recur.</li>
</ul>
<p>Veto + practice focus compounds across a season. Diamonds who veto strategically gain 30%+ more SR per session than Diamonds who play all maps.</p>` },
      { heading: 'Mental game — between-match resets', html: `<p>OWCS-tier mental discipline. Specific protocols:</p>
<ul>
  <li>30-second box breath between rounds (in 4, hold 4, out 4, hold 4). Drops heart rate from 95+ BPM to 70 BPM.</li>
  <li>If you tilt-stack 3 matches, stop for 30 minutes. Walk, water, return fresh.</li>
  <li>If a teammate is tilting, don't escalate. Quick "you got this, swap heroes" defuses better than silence.</li>
  <li>Track session win rate. Below 40%, end the session — your performance compounds badly.</li>
</ul>
<p>Master players reset 100% of rounds. Diamond players carry tilt for 2-3 rounds. That swing alone is the rank gap.</p>` },
    ],
    mistakes: [
      'Hero swaps only at round start, not mid-fight.',
      'Healing ults reactive (after damage), not anticipative.',
      'Pro VOD library at 5-10 patterns, not 30+.',
      'Comp swaps every 5 rounds, not every 2.',
      'Aim ceiling at Diamond benchmarks (22-25% headshot).',
      'No queue veto — playing weak maps for free SR loss.',
      'Tilt-stacking 3+ match losing streaks.',
    ],
    drill: { heading: 'Drill: 30-day pro VOD-per-day library build', html: `<p>Watch one tier-1 OWCS match per day for 30 days. Note 1 specific takeaway per match — pattern, ult timing, comp swap, positioning detail. By day 30 you have 30 patterns.</p><p>Test it: at day 30, watch a new pro match and predict 5 calls before they happen. Hit rate should be 60%+. If it's lower, your library is shallow — keep watching for another 30 days.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> can compute your hero-swap timing across matches and flag rounds where you should have swapped mid-fight but didn't. Useful for finding the Diamond plateau pattern of "stuck on main hero" that Master players have already broken.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Plat to Diamond', url: '/blog/ow2-plat-to-diamond.html' },
      { name: 'How to Climb from Master to GM', url: '/blog/ow2-master-to-gm.html' },
      { name: 'OW2 King\'s Row Guide', url: '/games/ow2/kings-row.html' },
      { name: 'OW2 Eichenwalde Guide', url: '/games/ow2/eichenwalde.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 10,
  },
  {
    game: 'ow2',
    gameLabel: 'Overwatch 2',
    fromRank: 'Master',
    toRank: 'Grandmaster',
    slug: 'ow2-master-to-gm',
    metaTitle: 'How to Climb from Master to Grandmaster in Overwatch 2 (2026 Guide)',
    metaDescription: 'OW2 Master-to-GM — top 0.5% mental discipline, mechanical aim consistency at scale, hero pool depth, match-to-match macro reads, and OWCS-tier comp absorption.',
    intro: `<p>Master is top 2% of OW2. Grandmaster is top 0.5%. The gap is mental discipline at the high-pressure rounds, mechanical aim at the ceiling, and hero pool depth that lets you cover any meta swap.</p>`,
    sections: [
      { heading: 'Top-0.5% mental discipline', html: `<p>GM matches are 30+ minutes of high-pressure decisions. Mental discipline at this tier:</p>
<ul>
  <li>2-second mental reset between deaths. Same crosshair, same default, same focus. No commentary on the death.</li>
  <li>If you tilt-stack 2 losses, stop the session. Don't grind through tilt at GM — your SR loss compounds badly.</li>
  <li>Don't blame teammates in voice. Master players blame; GM players solve.</li>
  <li>Track session win rate. Below 50%, end session.</li>
</ul>
<p>The reset discipline is what separates GM consistency from Master volatility. Most plateaued Masters have the mechanics but lose 4-round streaks to mental tilt.</p>` },
      { heading: 'Mechanical aim at the ceiling', html: `<p>GM aim benchmarks per role:</p>
<ul>
  <li>Hitscan DPS: 35%+ headshot rate, 60%+ crit rate.</li>
  <li>Projectile DPS (Genji, Hanzo, Pharah): 50%+ projectile-shot accuracy on moving targets.</li>
  <li>Ana: 50%+ Sleep dart hit rate, 40%+ crit rate on rifle.</li>
  <li>Tracker (Tracer, Soldier 76): 65%+ tracking percentage.</li>
</ul>
<p>Daily aim regimen at this tier:</p>
<ul>
  <li>30 min Aim Lab (Gridshot, Tracking, Microshot).</li>
  <li>30 min OW2 quick play with target hero (don't waste competitive matches on aim warm-up).</li>
  <li>30 min hero-specific scenario practice (e.g., Tracer flickshots, Genji deflect timing).</li>
</ul>
<p>If you're below GM benchmarks after 4 weeks of regimen, the issue is sensitivity or technique. Get a coach to review.</p>` },
      { heading: 'Hero pool depth — 6-8 heroes per role', html: `<p>Master players have 3-4 heroes per role. GM players have 6-8. Why: meta swaps and counter-picks demand fluency.</p>
<p>Specific GM hero pools:</p>
<ul>
  <li>Tank: Reinhardt, D.Va, Winston, Sigma, Orisa, Junker Queen, Ramattra, Zarya. Match-up dependent.</li>
  <li>DPS hitscan: Soldier, Cassidy, Ashe, Sojourn. Plus Tracer for dive comp.</li>
  <li>DPS projectile: Pharah, Echo, Hanzo, Genji.</li>
  <li>Support: Ana, Kiriko, Lúcio, Mercy, Baptiste, Brigitte. Plus Juno for sustain comps.</li>
</ul>
<p>If you're 3-trick at Master, expand the pool BEFORE chasing GM. The 4-round counter-pick window demands flexibility.</p>` },
      { heading: 'Match-to-match macro reads', html: `<p>GM teams play match-to-match, not round-to-round. Specifics:</p>
<ul>
  <li>Round 1-3: probe enemy comp + ult patterns.</li>
  <li>Round 4-6: pick best counter-strat from probe data.</li>
  <li>Round 7-9: lock in winning pattern.</li>
  <li>Round 10-12: half-time prep + comp adjustment based on full half data.</li>
  <li>Round 13+: counter-strat round 2.</li>
</ul>
<p>Master teams play round-to-round. GM teams play match-to-match. The 12-round vision is what wins overtime games.</p>` },
      { heading: 'OWCS-tier comp absorption', html: `<p>By GM, you should have absorbed 100+ pro patterns. Watch one tier-1 match per day for 90 days. By day 90:</p>
<ul>
  <li>You auto-recognize standard comps from round 1 lock-in.</li>
  <li>You predict ult chains 5+ seconds before they fire.</li>
  <li>You read healing-ult timing windows by matching to pro patterns.</li>
  <li>You know which maps favor dive vs brawl vs poke comps.</li>
</ul>
<p>Recommended VODs: OWCS Worlds finals, regional finals, top streamers' tournament play. Avoid casual content — only tier-1 prep level.</p>` },
      { heading: 'Sensitivity and FOV optimization', html: `<p>GM players tune sensitivity to body type and hand speed. Specifics:</p>
<ul>
  <li>800-1600 DPI is standard at GM. Higher DPI = faster flicks but less precision.</li>
  <li>Sensitivity in cm/360°: most GM players use 30-50cm/360° for hitscan, 20-30cm for projectile.</li>
  <li>FOV: 103 (max in OW2) for situational awareness.</li>
  <li>Crosshair: bright cyan or yellow. Avoid red (blends with HUD).</li>
</ul>
<p>If you're using default settings, you're playing at a mechanical disadvantage. Spend a week dialing in your sensitivity before chasing GM.</p>` },
      { heading: 'Tilt protocols at the high-pressure rounds', html: `<p>Round 13+ is where matches are decided. Specific tilt protocols:</p>
<ul>
  <li>Between rounds, 4-second box breath. Heart rate from 95+ to 70 BPM.</li>
  <li>If you lose 2 in a row, IGL calls "default round" — no trick play, just fundamentals.</li>
  <li>If you lose 3 in a row, IGL calls a player swap if anyone's tilting visibly.</li>
</ul>
<p>GM teams run these protocols. Master teams tilt-stack into 6-round losing streaks. The protocol is the conversion lever.</p>` },
    ],
    mistakes: [
      'Tilt-stacking matches — losing 4-6 in a row to mental, not mechanical.',
      'Aim ceiling at Master benchmarks (28-30% headshot) instead of GM (35%+).',
      'Hero pool of 3-4 — can\'t cover counter-pick demands.',
      'Round-to-round play instead of match-to-match macro.',
      'Pro VOD library at 30 patterns, not 100+.',
      'Default sensitivity / FOV settings.',
      'No tilt protocol for round 13+.',
    ],
    drill: { heading: 'Drill: 90-day pro VOD library + aim regimen', html: `<p>90 days, 30 min aim + 1 pro VOD per day. By day 90 you have a 100-pattern library AND your aim is at GM benchmarks.</p><p>Track weekly: headshot rate, sleep dart hit rate (if Ana), crit rate per role. If numbers plateau before day 90, fix sensitivity or ergonomics before continuing.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> compares your decision patterns against OWCS-tier reads round-by-round. Particularly useful for finding the rounds where you knew the right call but committed to the wrong one — the exact pattern that separates Master plateau from GM ceiling.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Diamond to Master', url: '/blog/ow2-diamond-to-master.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'OW2 King\'s Row Guide', url: '/games/ow2/kings-row.html' },
      { name: 'OW2 Junkertown Guide', url: '/games/ow2/junkertown.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 11,
  },
]

// ============================================================================
// APEX LEGENDS POSTS (3)
// ============================================================================
const APEX_POSTS = [
  {
    game: 'apex', gameLabel: 'Apex Legends', fromRank: 'Bronze', toRank: 'Silver',
    slug: 'apex-bronze-to-silver',
    metaTitle: 'How to Climb from Bronze to Silver in Apex Legends (2026 Guide)',
    metaDescription: 'Apex Bronze-to-Silver — pick 3 legends, master slide-jumping, edge-drop instead of hot-drop, loot priority by tier, and squad-up before pushing.',
    intro: `<p>Bronze in Apex is the BR foundation tier. Most Bronze players third-party every fight, drop into hot zones unprepared, and push solo into 3-team fights. Here's the 4-week climb plan to Silver.</p>`,
    sections: [
      { heading: 'Pick 3 legends — one per class', html: `<p>Apex has 25+ legends across Assault, Skirmisher, Recon, Controller, and Support. Bronze players try to play them all and master none. Pick three:</p><ul><li><strong>Assault:</strong> Bangalore (smoke + ult forces re-positions, forgiving gun selection).</li><li><strong>Skirmisher:</strong> Pathfinder (grapple is the most versatile mobility in the game).</li><li><strong>Support:</strong> Lifeline (heal drone + care package, the easiest support to climb on).</li></ul><p>By the end of 4 weeks of legend-locked queue, you'll have 60+ matches of muscle memory on the same three. That's the foundation Silver players have. Don't expand the pool until you're consistently winning with these.</p>` },
      { heading: 'Master slide-jumping and tap-strafing', html: `<p>Apex movement is what separates Bronze from Silver more than aim does. Practice in the Firing Range:</p><ul><li><strong>Slide-jumping:</strong> hold crouch + jump while running downhill. Free 30% movement speed boost.</li><li><strong>Mantle-jumping:</strong> jump onto an obstacle then jump again immediately. Faster than going around.</li><li><strong>Tap-strafing (PC only):</strong> bind W to scroll wheel up. Mid-air direction changes break enemy aim tracking.</li></ul><p>10 minutes per day for a week and slide-jumping becomes muscle memory. You'll out-rotate every Bronze player who runs flat-footed.</p>` },
      { heading: 'Edge-drop, do not hot-drop', html: `<p>Hot-dropping at Bronze is suicide. 12 squads land at the same POI; 11 die in 60 seconds. The fix: drop the edge of the named POI, loot full kit (purple armor + 2 weapons + 100+ ammo + 3 heals), then push the contested zone after most teams have died.</p><p>Specific drops on Storm Point: instead of Storm Catcher (hot), drop Antenna or Lightning Rod (edge POIs). On World's Edge: skip Fragments (hot), drop Skyhook or Drill Site. The 30-second loot window of an edge drop wins more games than fragging out at Storm Catcher.</p>` },
      { heading: 'Loot priority — armor before weapons', html: `<p>Bronze players grab the first gun they see, no armor, full health, and die to one shot. The order:</p><ol><li><strong>Body armor</strong> (white > blue > purple > red).</li><li><strong>Helmet</strong> (white > blue > purple).</li><li><strong>Weapon 1</strong> (any rifle or SMG; don't waste time hunting specific guns).</li><li><strong>Backpack</strong> (white at minimum, holds extra heals).</li><li><strong>Heals</strong> (2-3 syringes + 2 shield cells minimum).</li><li><strong>Weapon 2</strong> (your specialty — sniper if you AWP-type, shotgun if CQB).</li></ol><p>Without armor and heals, you can't trade in fights. With them, you survive 1v1s.</p>` },
      { heading: 'Squad up before pushing', html: `<p>The biggest Bronze mistake: pushing solo into a fight your squad can't reach. The rule:</p><ul><li>If both teammates are within 50m, you can engage.</li><li>If a teammate is downed, ALL squad commits to revive — do NOT push for the kill alone.</li><li>If a teammate is dead, decide as squad whether to push for banner or rotate. No solo banner runs.</li></ul><p>Bronze deaths are 70% solo plays. Silver deaths are 30% solo plays. The squad-up habit is the rank gap.</p>` },
      { heading: 'Ring rotation timing — count zone phases', html: `<p>Apex rounds have ring phases at 2-minute intervals. Plan rotations:</p><ul><li>Ring 1 (5 min): loot, no rotation needed yet.</li><li>Ring 2 (3 min): start rotating to next zone center. Don't wait for ring damage.</li><li>Ring 3 (2 min): zone damage starts mattering. Get to zone or risk 3rd-party.</li><li>Ring 4-5 (90s each): commit fights or hold position. No more loot runs.</li></ul><p>Bronze squads loot through Ring 3 and die to ring damage. Silver squads rotate by Ring 2 and have positioning advantage.</p>` },
      { heading: 'Audio cues — listen before you peek', html: `<p>Apex audio is information. Bronze players have audio low or muted; Silver players play with footstep volume turned up. Specifics:</p><ul><li>Footsteps: directional + distance. You can hear an enemy 30m away before you see them.</li><li>Reload sound: enemy is reloading — push for the trade kill.</li><li>Healing sound (med kit, syringe): enemy is using heals — they're stuck for 6+ seconds.</li><li>Door open/close: enemy is in/exiting a building.</li><li>Ult activation: enemy used a defensive ult; their cooldown is now 3 minutes.</li></ul><p>Crank your in-game footstep volume to 100. Wear good headphones. The audio advantage in Apex is rank-decisive.</p>` },
    ],
    mistakes: ['Hot-dropping with 12 squads.','Solo pushing without squad.','Looting through Ring 3.','No body armor before fight.','Picking 5+ legends — no specialization.','Running flat-footed — no slide-jump.','Playing with footstep volume too low.'],
    drill: { heading: 'Drill: 10 Firing Range movement reps', html: `<p>10 minutes daily in Firing Range. Practice slide-jumping down hills, mantle-jumping over crates, and tap-strafing direction changes. After 7 days movement becomes muscle memory and you'll out-rotate every Bronze opponent.</p>` },
    aiVodMention: `<p>If you can't tell why specific squad fights feel off, the <a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> reads your replays and flags positioning + rotation mistakes per squad fight.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/apex-silver-to-gold.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Apex Storm Point Guide', url: '/games/apex/storm-point.html' },
      { name: 'Apex World\'s Edge Guide', url: '/games/apex/worlds-edge.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
  {
    game: 'apex', gameLabel: 'Apex Legends', fromRank: 'Silver', toRank: 'Gold',
    slug: 'apex-silver-to-gold',
    metaTitle: 'How to Climb from Silver to Gold in Apex Legends (2026 Guide)',
    metaDescription: 'Apex Silver-to-Gold — squad coordination, ring rotation reads, third-party awareness, ult cycle timings, and the loot-vs-fight decision.',
    intro: `<p>Silver to Gold in Apex is squad coordination. At Silver you have movement + loot down. At Gold the squad fights as a unit, reads third-parties, and times ult chains for engages.</p>`,
    sections: [
      { heading: 'Squad fights as a unit, not three solos', html: `<p>Gold-tier squads commit together and disengage together. Specifics:</p><ul><li><strong>Engage signal:</strong> "I'm taking the right flank, follow on my push" — not "I'm pushing now bye."</li><li><strong>Trade-frag distance:</strong> teammates within 30m of each other so a knock + revive is possible.</li><li><strong>Disengage signal:</strong> "Falling back, smoke me" — squad covers retreat with smokes/ults.</li></ul><p>Silver squads are 3 solo players. Gold squads are 1 unit with 3 health bars. The communication discipline is the rank gap.</p>` },
      { heading: 'Third-party awareness — read the kill feed', html: `<p>Every Apex fight attracts third parties. Gold-tier squads read the threat:</p><ul><li>Kill feed shows another squad fighting nearby — they'll arrive in 30 seconds.</li><li>Audio cue (footsteps, gunshots) from a direction you didn't engage from — third party incoming.</li><li>If a squad just fought, push them with full HP — they're low.</li><li>If you just fought and squad is low, rotate to cover and heal before re-engaging.</li></ul><p>Silver squads ignore third-party signals; Gold squads time engages around them.</p>` },
      { heading: 'Ult cycle timings for engages', html: `<p>Each legend's ult has a cooldown. Gold squads time ult-engages:</p><ul><li><strong>Bangalore Rolling Thunder:</strong> ult cycles in ~3 minutes. Use to push a fortified position.</li><li><strong>Gibraltar Defensive Bombardment:</strong> ult cycles in ~3 minutes. Use to deny re-engage on a downed squad.</li><li><strong>Pathfinder Zipline:</strong> ult cycles in ~2 minutes. Use for forced rotations + flanks.</li><li><strong>Octane Launch Pad:</strong> ult cycles in ~1 minute. Use for fast rotations.</li></ul><p>If your squad's pushing without ults, wait 30 seconds for cycle. Ult-stack pushes win 70%+ of engagements.</p>` },
      { heading: 'Ring rotation — pre-position before zone damage', html: `<p>Silver squads run from zone damage; Gold squads pre-rotate. Specifics:</p><ul><li>Ring 2 (3 min): rotate when your squad has positioning, not when ring forces. Avoid running through 3 squad zones.</li><li>Ring 3 (2 min): take a defensible position with high ground or building cover. Don't get stuck in a flat area.</li><li>Ring 4 (90s): commit to your position; don't rotate again unless you have ult mobility (Pathfinder zip, Octane pad).</li></ul><p>Pre-rotating means you arrive first, take the high ground, and force fights on your terms.</p>` },
      { heading: 'Loot vs fight decision', html: `<p>You're rotating and you see a fresh squad with full kit. Do you fight?</p><ul><li>If your squad has full kit + ults → fight (you have advantage).</li><li>If your squad has white armor + no ults → rotate around the fight.</li><li>If a third squad is fighting nearby → push the loser at full HP, free kit + RP.</li></ul><p>Gold-tier decision-making is "what's the EV of this fight?" — not "they're there, let's fight."</p>` },
      { heading: 'Healing rotation discipline', html: `<p>Apex heals are a sequence. Mistake-prone Bronze/Silver players use them in wrong order:</p><ol><li><strong>Med Kit</strong> (slow heal, full health) — use after fight, before next engage.</li><li><strong>Syringes</strong> (fast heal, partial health) — use mid-fight when behind cover.</li><li><strong>Phoenix Kit</strong> (full health + shields) — use after a wipe-and-revive when squad is low.</li><li><strong>Shield batteries</strong> > shield cells in clutch moments (cells are too slow mid-fight).</li></ol><p>Healing in the wrong order kills more Silver players than aim. Learn the sequence.</p>` },
      { heading: 'Audio cues at gold tier — track everything', html: `<p>Gold players use audio for everything:</p><ul><li>Enemy ult activation: 3-minute cooldown on their next ult. Push aggressive in that window.</li><li>Enemy reload: 2-3 seconds of vulnerability. Push for the trade.</li><li>Enemy heal sound: they're stuck for 6 seconds. Free push.</li><li>Approaching squads: sounds before sight. Pre-position based on direction.</li></ul><p>Silver players use audio for proximity only. Gold players track 4+ audio signals simultaneously. Crank footstep volume to 100, wear headphones.</p>` },
      { heading: 'Squad role designation pre-match', html: `<p>Gold-tier 3-stacks designate roles:</p><ul><li><strong>IGL (caller):</strong> makes engage/disengage calls.</li><li><strong>Fragger (entry):</strong> takes first contact in fights.</li><li><strong>Support (sustainer):</strong> heals + revives + drone scouts.</li></ul><p>If your trio doesn't have designated roles, fights collapse on miscommunication. Silver trios fight as 3 IGLs. Gold trios have 1 IGL whose calls everyone follows.</p>` },
    ],
    mistakes: ['Three solo plays per fight.','Ignoring kill feed (third-party blind).','Fighting without ults.','Running zone damage instead of pre-rotating.','Healing in wrong order.','Engaging full-kit squads on white armor.','No squad role designation.','Audio at default volume.'],
    drill: { heading: 'Drill: 5-game ult tracking', html: `<p>For 5 games, track your ult cycles + your squad's ult cycles. Note when each ult comes off cooldown. By game 5 you'll auto-call "ults in 30 seconds" before engages — the Gold-tier engagement timing.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> tracks squad cohesion (distance between teammates during fights) and flags rounds where the squad split into solo plays.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/apex-bronze-to-silver.html' },
      { name: 'How to Climb from Gold to Plat', url: '/blog/apex-gold-to-plat.html' },
      { name: 'Apex Storm Point Guide', url: '/games/apex/storm-point.html' },
      { name: 'Apex World\'s Edge Guide', url: '/games/apex/worlds-edge.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
  {
    game: 'apex', gameLabel: 'Apex Legends', fromRank: 'Gold', toRank: 'Platinum',
    slug: 'apex-gold-to-plat',
    metaTitle: 'How to Climb from Gold to Platinum in Apex Legends (2026 Guide)',
    metaDescription: 'Apex Gold-to-Plat — endgame positioning, ult coordination chains, beam discipline, ring 4+ commit decisions, and pro-tier movement habits.',
    intro: `<p>Gold-to-Plat in Apex is endgame mastery. You have movement + squad coordination. The Plat gap is positioning in Ring 4+, ult chain combos, and beam-vs-cover discipline.</p>`,
    sections: [
      { heading: 'Endgame positioning — high ground + cover', html: `<p>By Ring 4, the zone is small enough that 4-5 squads remain. The team holding high ground with cover wins. Specifics:</p><ul><li>Take a ridge or building roof — height advantage forces enemies to push uphill.</li><li>Have at least one cover object (rock, tree, building wall) within 5m so you can disengage if pushed.</li><li>Watch flank routes — most third parties come from the side, not the front.</li><li>If zone closes onto a flat area, use Pathfinder zip / Octane pad / Valk ult to take the high ground first.</li></ul><p>Gold squads fight on flat. Plat squads take elevation 60+ seconds before zone closes.</p>` },
      { heading: 'Ult coordination chains', html: `<p>Plat-tier ult chains:</p><ul><li><strong>Bangalore smoke + Bloodhound ult:</strong> smoke covers your push, scan reveals targets through smoke.</li><li><strong>Gibraltar dome + Octane pad:</strong> dome to revive, pad to escape after.</li><li><strong>Caustic ult + Wattson fence:</strong> chokepoint denial, forces enemies to take damage to push.</li><li><strong>Valkyrie ult + Pathfinder zip:</strong> mass rotation across the map in 5 seconds.</li></ul><p>Each combo wins fights or denies third parties. Practice in scrims with your trio.</p>` },
      { heading: 'Beam discipline — cover-trade, not open-trade', html: `<p>Apex damage is high; open-ground trades favor whoever shoots first. Plat-tier beam discipline:</p><ul><li>Always shoot from cover (rock, building corner, tree).</li><li>Peek to fire 3-4 shots, then back to cover. Repeat.</li><li>Don't beam an enemy who's also in cover — they'll trade you and you lose 100% of trades.</li><li>Force enemies into open ground via flanks or smokes, then beam.</li></ul><p>Gold players beam in the open and win 50% of trades. Plat players force open-ground trades on their opponents and win 80%.</p>` },
      { heading: 'Ring 4+ commit decisions', html: `<p>Ring 4 is when matches are decided. Plat decision tree:</p><ul><li>If your squad has full ults + high ground → push the weakest squad to thin the field.</li><li>If your squad is mid-HP + has cover → hold position, force enemies to push you.</li><li>If your squad is low-HP → don't engage; bunker, heal, wait for third-party.</li><li>If you can rotate ahead of zone with ult mobility → take the next zone's high ground first.</li></ul><p>Ring 4-5 commit decisions are where Gold-to-Plat games are won or lost. Treat each Ring 4 like a separate decision tree, not a continuation of mid-game.</p>` },
      { heading: 'Lurker reads — squad never solo-pushes alone', html: `<p>Plat enemies will lurker-flank you. The reads:</p><ul><li>If a squad fight has 2 visible enemies, the 3rd is flanking. Watch your back.</li><li>Audio cue from behind = lurker. Reposition immediately.</li><li>If your squad commits forward, leave one player on rear-watch (Bangalore back-line, Bloodhound scanning).</li></ul><p>Solo lurkers wipe entire Gold squads. Plat squads have a designated rear-watcher every fight.</p>` },
      { heading: 'Crystal endgame — final 2-3 squads', html: `<p>Crystal endgame in Apex: 2-3 squads, ring closing fast, ults depleted. Specifics:</p><ul><li>Don't push first — let the other squads contest each other.</li><li>If you have a Caustic / Wattson, set up area denial in the zone center.</li><li>If you have heals, top up to 200 (full HP + shields) before the final fight.</li><li>The team that lands the first knock in crystal endgame wins 70%+ of the time.</li></ul><p>Crystal endgame is the Plat finishing skill. Master it and you'll convert top-3 placements into wins.</p>` },
      { heading: 'Pro VOD watching as practice', html: `<p>Watch one ALGS (Apex Legends Global Series) match per day. Pause every minute. Predict the call.</p><p>By VOD 30 you'll absorb pro-tier rotation timings, ult chain combos, and crystal endgame patterns. Recommended VODs: ALGS Year 4 finals, ALGS Pro League weekly matches.</p>` },
      { heading: 'Mental game and tilt management', html: `<p>Apex matches are 20+ minutes. One bad rotation can lose the game and feel devastating. Plat-tier mental game:</p><ul><li>Between matches, take 60 seconds before queueing again. Reset focus.</li><li>If you tilt-stack 3 losses in a row, stop playing for 30 minutes.</li><li>Don't blame teammates in voice chat — kills team morale and your own focus.</li><li>Track wins/losses per session. If session win rate drops below 40%, end the session.</li></ul><p>Gold players grind through tilt and lose 5 matches in a row. Plat players reset and queue back fresh.</p>` },
    ],
    mistakes: ['Fighting on flat ground in Ring 4.','Solo ulting — no chain.','Open-ground beaming.','Ignoring lurker audio cues.','Committing into crystal endgame first.','No rear-watcher in squad fights.','No pro VOD prep.','Tilt-stacking losses.'],
    drill: { heading: 'Drill: 5 ranked games of Ring 4+ decision tracking', html: `<p>For 5 ranked games, focus only on Ring 4+ decisions. Note: did you take high ground? Did you have cover? Did you commit at the right moment? After 5 games you'll have a decision framework that auto-applies in clutch moments.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> can flag rounds where you committed to fights without ult-chain support — useful for spotting the decisions that lost the round.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/apex-silver-to-gold.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Apex Olympus Guide', url: '/games/apex/olympus.html' },
      { name: 'Apex Broken Moon Guide', url: '/games/apex/broken-moon.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
]

// ============================================================================
// APEX HIGH-TIER POSTS (3)
// ============================================================================
const APEX_POSTS_HIGH = [
  {
    game: 'apex',
    gameLabel: 'Apex Legends',
    fromRank: 'Platinum',
    toRank: 'Diamond',
    slug: 'apex-plat-to-diamond',
    metaTitle: 'How to Climb from Plat to Diamond in Apex Legends (2026 Guide)',
    metaDescription: 'Apex Plat-to-Diamond — endgame zone reads, mobility chain rotations, anti-flank discipline, lobby-by-lobby loadout swaps, and ALGS-tier engagement decisions.',
    intro: `<p>Plat in Apex means you have movement, drops, and basic squad coordination locked in. Diamond demands consistent endgame zone reads, mobility chain rotations, and the discipline to disengage fights you can't win. Here's the leap.</p>`,
    sections: [
      { heading: 'Endgame zone reads — predict the next ring before it closes', html: `<p>Plat squads react to ring damage. Diamond squads pre-position 60+ seconds before each ring closes. The cycle:</p>
<ul>
  <li>At ring 1 close (5:00), call out the next zone center based on the new circle.</li>
  <li>Identify the high-ground spot that will sit inside the next ring. Plan the mobility-item route to claim it.</li>
  <li>If the next zone forces you through 2+ enemy POIs, change rotation now — don't wait for ring damage to push you through them.</li>
</ul>
<p>Diamond squads arrive at zone with cover. Plat squads arrive bleeding ring damage and out of mobility items.</p>` },
      { heading: 'Mobility chain rotations', html: `<p>Plat squads save mobility items "for emergencies" and die holding them. Diamond squads chain them as primary rotation:</p>
<ul>
  <li><strong>Pathfinder zip + Octane pad:</strong> 200m+ rotation in 8 seconds.</li>
  <li><strong>Valkyrie ult + Pathfinder zip:</strong> cross-map repositioning to deny third-party.</li>
  <li><strong>Wraith portal + Octane pad:</strong> commit-and-retreat for high-risk pushes.</li>
  <li><strong>Horizon ult + DPS dive:</strong> grouped enemies into a Black Hole, free clean-up.</li>
</ul>
<p>Practice these chains in scrims. Each chain wins 2-3 fights per match if timed right.</p>` },
      { heading: 'Anti-flank discipline — designated rear-watcher', html: `<p>Diamond squads always have one player watching the flank. Specific protocol:</p>
<ul>
  <li>Front fight: 2 players engaged, 1 rear-watching from cover.</li>
  <li>Rotation: rear-watcher's drone or scan covers the back-line.</li>
  <li>If audio cue from behind, rear-watcher calls "lurker, holding the angle" — front pair completes engage knowing the back is covered.</li>
</ul>
<p>Plat squads commit 3-deep, get flanked, lose the round. Diamond squads commit 2-deep with a rear-watcher and maintain map control.</p>` },
      { heading: 'Lobby-by-lobby loadout swaps', html: `<p>Plat squads loot whatever they find. Diamond squads optimize loadouts mid-match based on lobby reads:</p>
<ul>
  <li>If lobby is full of Bocek + R-99 close-range squads → swap to a long-range loadout (Sentinel, G7, Triple Take).</li>
  <li>If lobby is sniper-heavy → swap to fast-mobility legend (Octane, Path) and SMG/AR mid-range.</li>
  <li>If you're carrying a weapon you don't main, swap to looted alt at next death-box.</li>
</ul>
<p>The loadout swap is a 5-second mental check between fights. Diamond squads do it; Plat squads forget.</p>` },
      { heading: 'Audio cue tracking at high tier', html: `<p>Diamond audio at the ceiling:</p>
<ul>
  <li>Footsteps: directional + distance + numbers (1 player vs 3).</li>
  <li>Reload sound: enemy is reloading — push trade.</li>
  <li>Heal sound: enemy stuck for 6s; push.</li>
  <li>Ult activation: enemy used ult, 3-min cooldown — aggress in that window.</li>
  <li>Door open / close: building entry signal — pre-aim the doorway.</li>
  <li>Healing pickup sound (in death box): teammate picking up enemy heals — coverage shift incoming.</li>
</ul>
<p>Diamond players track 4-5 audio signals simultaneously. Plat players track 1-2. Crank footstep volume to 100, wear good headphones — non-negotiable at this elo.</p>` },
      { heading: 'Engagement decision tree — fight or flee?', html: `<p>Diamond squads have an engagement framework:</p>
<ul>
  <li>Full kit + ults available → engage.</li>
  <li>White armor + no ults → rotate around the fight.</li>
  <li>2 squads fighting nearby → wait, third-party the loser.</li>
  <li>Ring 4+ low-HP situation → bunker, heal, do not engage.</li>
  <li>Endgame with 3 squads remaining → don't push first; let the others contest each other.</li>
</ul>
<p>Plat squads engage on instinct. Diamond squads engage on EV calculation.</p>` },
      { heading: 'Pro VOD prep — ALGS patterns', html: `<p>Watch one ALGS match per day. Pause every minute. Predict the call. By VOD 30 you'll absorb pro-tier rotation timings, ult chain combos, and crystal endgame patterns.</p>
<p>Specific ALGS patterns to internalize: pre-rotation 60s before ring close, Valk ult to claim high-ground, Caustic ult to deny choke, third-team baiting via fake-engagement.</p>` },
    ],
    mistakes: [
      'Reacting to ring damage instead of pre-rotating.',
      'Saving mobility items unused.',
      'No designated rear-watcher in fights.',
      'Random loot loadouts — no lobby-based swap.',
      'Audio at default volume.',
      'Engaging on instinct without EV check.',
      'No ALGS VOD prep.',
    ],
    drill: { heading: 'Drill: 5-game pre-rotation tracking', html: `<p>5 ranked Apex games. For each, mark the 60-second-before-ring-close moment in your head and call the next zone center. Track whether you actually pre-rotated or whether you reacted to ring damage.</p><p>By game 5 the pre-rotation habit is automatic. Your placement bumps from "top 5" to "top 3" consistently.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> tracks your engagement decisions across matches and flags the rounds where you fought a battle you couldn't win — useful for catching the Plat plateau pattern of "engaging on instinct."</p>`,
    relatedLinks: [
      { name: 'How to Climb from Gold to Plat', url: '/blog/apex-gold-to-plat.html' },
      { name: 'How to Climb from Diamond to Master', url: '/blog/apex-diamond-to-master.html' },
      { name: 'Apex Storm Point Guide', url: '/games/apex/storm-point.html' },
      { name: 'Apex World\'s Edge Guide', url: '/games/apex/worlds-edge.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 10,
  },
  {
    game: 'apex',
    gameLabel: 'Apex Legends',
    fromRank: 'Diamond',
    toRank: 'Master',
    slug: 'apex-diamond-to-master',
    metaTitle: 'How to Climb from Diamond to Master in Apex Legends (2026 Guide)',
    metaDescription: 'Apex Diamond-to-Master — final-ring positioning depth, ult chain combos, loadout optimization at scale, third-team timing reads, and ALGS-tier macro discipline.',
    intro: `<p>Diamond squads have the fundamentals. Master squads have refined macro: final-ring positioning, ult chain combos timed to the second, and the discipline to play 20+ minute matches without a single ego-engagement. The leap is converting individual mechanics into team-coordinated late-game decisions where most ranked Apex matches are won or lost.</p>`,
    sections: [
      { heading: 'Final-ring positioning — high ground + cover', html: `<p>By Ring 5, the zone is small enough that 3-4 squads remain. Master positioning:</p>
<ul>
  <li>Take the highest available ground that has cover within 5m.</li>
  <li>If zone closes onto flat terrain, use ult mobility (Pathfinder zip, Valk ult) to claim a building roof.</li>
  <li>If a squad already holds the high ground, don't dispute — bunker on adjacent ground and force them to push you.</li>
  <li>Watch for terrain-tilt: which squads are forced to push uphill into your position by ring close?</li>
</ul>
<p>Master squads set up final-ring positioning 90+ seconds before zone forces. Diamond squads scramble for cover when ring damage starts.</p>` },
      { heading: 'Ult chain combos timed to the second', html: `<p>Master ult chains:</p>
<ul>
  <li><strong>Bangalore smoke + Bloodhound ult:</strong> smoke covers your push, scan reveals targets through smoke. Drop on a count: smoke, 2-second beat, scan.</li>
  <li><strong>Caustic ult + Wattson fence:</strong> chokepoint denial. Caustic ult lands first, fences activate as ult expires.</li>
  <li><strong>Valk ult + Path zip:</strong> mass repositioning to claim or deny zone center.</li>
  <li><strong>Horizon ult + Bangalore Rolling Thunder:</strong> grouped enemies, then artillery.</li>
</ul>
<p>Practice in scrims with voice comm: "Ult in 3, 2, 1." Each combo wins fights when synced within 1 second of each other.</p>` },
      { heading: 'Loadout optimization at the ceiling', html: `<p>Master squads have specific loadout priorities:</p>
<ul>
  <li><strong>Long-range:</strong> Sentinel (charged), Triple Take, or G7 Scout. Hold high ground.</li>
  <li><strong>Mid-range:</strong> Flatline, R-301, Hemlok. Standard fight range.</li>
  <li><strong>Close-range:</strong> R-99, CAR, Volt SMG. Push fights.</li>
  <li><strong>Anti-armor:</strong> Mastiff or Peacekeeper as backup for full-purple enemies.</li>
</ul>
<p>By Ring 4, your team should have 1 long-range, 2 mid-range, 0 hot-drop SMGs unless your comp is dive-heavy. Master squads optimize per ring; Diamond squads keep what they grabbed at drop.</p>` },
      { heading: 'Third-team timing reads', html: `<p>Master squads predict third-team arrival within 15 seconds. Specifics:</p>
<ul>
  <li>Kill feed shows nearby fight → 30-second arrival window for the third team. Plan engage timing accordingly.</li>
  <li>Audio of distant gunshots → directional read. Third team coming from that vector.</li>
  <li>If you just won a fight, retreat to cover and HEAL before the inevitable third party.</li>
  <li>If you're the third team, push the loser — full kit + RP.</li>
</ul>
<p>Diamond squads forget third-teaming half the time. Master squads bake it into every engagement decision.</p>` },
      { heading: 'Match macro across 20-minute games', html: `<p>Master squads play 20-minute matches with a script:</p>
<ul>
  <li>0:00-5:00: drop, loot full kit, no engages unless contested at drop.</li>
  <li>5:00-10:00: rotate to zone, third-party 1-2 fights opportunistically, build kit.</li>
  <li>10:00-15:00: pre-position for Ring 3-4, hold high ground.</li>
  <li>15:00+: final ring, ult chain coordination, crystal endgame.</li>
</ul>
<p>Diamond squads play minute-by-minute. Master squads play match-by-match with the script in mind.</p>` },
      { heading: 'Squad role designation pre-match', html: `<p>Master 3-stacks designate roles:</p>
<ul>
  <li><strong>IGL (caller):</strong> makes engage/disengage calls. Final say on rotation timing.</li>
  <li><strong>Fragger (entry):</strong> takes first contact in fights. Aggressive legend pick (Octane, Bangalore).</li>
  <li><strong>Support (sustainer):</strong> heals, drone scouts, banner runs. Defensive legend pick (Lifeline, Newcastle, Conduit).</li>
</ul>
<p>If your trio doesn't have designated roles, fights collapse on miscommunication. Plat trios fight as 3 IGLs. Master trios have one IGL whose calls everyone follows. Practice: pre-match role-call in voice — "I'm IGL, you fragger, you support" — and stick with it for the session.</p>` },
      { heading: 'Tilt management at the high-pressure rounds', html: `<p>Master matches are 20+ minutes, often ending in close losses. Tilt management:</p>
<ul>
  <li>Between matches, 60-second mental reset. No reviewing the kill cam past the first 10 seconds.</li>
  <li>If you tilt-stack 3 losses, stop for 30 minutes.</li>
  <li>Don't blame teammates — the squad is your unit, not your opponent.</li>
</ul>
<p>Master discipline is what converts 60% session win rate into a Master placement. Diamond grinders without tilt protocols stay Diamond.</p>` },
    ],
    mistakes: [
      'Final-ring positioning by reaction, not pre-positioning.',
      'Solo ulting (no chain).',
      'Loadout from drop unchanged through Ring 4.',
      'No third-team timing read.',
      'Match macro by feel, not script.',
      'No squad role designation.',
      'Tilt-stacking 3+ matches.',
    ],
    drill: { heading: 'Drill: 5 games of match-macro tracking', html: `<p>5 ranked games. For each, write down (1) drop time, (2) first kit complete time, (3) Ring 3 position, (4) final-ring high-ground status. Compare your timeline to the Master script (5:00 / 10:00 / 15:00 markers).</p><p>If you're lagging on any phase, that's where to focus practice.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> can flag the rounds where you took an unfavorable engagement that didn't fit the match script — particularly useful for spotting the Diamond plateau of "engaging on instinct" that Master macro discipline solves.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Plat to Diamond', url: '/blog/apex-plat-to-diamond.html' },
      { name: 'How to Climb from Master to Predator', url: '/blog/apex-master-to-pred.html' },
      { name: 'Apex Olympus Guide', url: '/games/apex/olympus.html' },
      { name: 'Apex Storm Point Guide', url: '/games/apex/storm-point.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 11,
  },
  {
    game: 'apex',
    gameLabel: 'Apex Legends',
    fromRank: 'Master',
    toRank: 'Predator',
    slug: 'apex-master-to-pred',
    metaTitle: 'How to Climb from Master to Predator in Apex Legends (2026 Guide)',
    metaDescription: 'Apex Master-to-Predator — top 750 mental game, constant ult tracking, mid-game flex decisions, ALGS-tier squad coordination, and aim consistency at the ceiling.',
    intro: `<p>Master is top 4% of Apex. Predator is top 750 globally per region. The gap is constant ult tracking, mid-game flex decisions, and mental discipline at the high-pressure rounds. Here's what Predator-tier squads do that Master squads don't — the squad-protocol depth, aim consistency benchmarks, and 90-day pro VOD library that converts plateau into ceiling.</p>`,
    sections: [
      { heading: 'Constant ult tracking — yours and theirs', html: `<p>Predator squads track every legend's ult cooldown across the entire lobby. Specifics:</p>
<ul>
  <li>Squad ult availability is announced every minute: "Path ult in 30, Bang ult ready, Octane pad cycling."</li>
  <li>Enemy ult tracking via observation: "Caustic used ult 2 minutes ago — they don't have it for next 60 seconds."</li>
  <li>Engage timing windows are calculated from squad-ult-availability: only engage when 4+ ults across the squad are charged.</li>
  <li>Disengage triggers: if your squad has 0 ults and the enemy clearly has multiple, retreat and reset. No ego-engagements at this elo.</li>
</ul>
<p>Master squads check ult availability "sometimes." Predator squads track it constantly. The 60-second ult window between fights is what determines engage feasibility — Predators win because they only fight when ahead on ult charge, never when behind.</p>` },
      { heading: 'Mid-game flex decisions', html: `<p>Predator squads adapt mid-game based on lobby reads:</p>
<ul>
  <li>Lobby is third-party-heavy → switch to fight-and-flee posture: only engage when you can disengage in 30 seconds.</li>
  <li>Lobby is camp-heavy → take aggressive engagements early to thin the field.</li>
  <li>Lobby is endgame-focused → loot longer, conserve ults, bunker for crystal endgame.</li>
</ul>
<p>The flex happens around the 10-minute mark. Master squads play the same game-plan every match. Predators flex based on the data.</p>` },
      { heading: 'ALGS-tier squad coordination', html: `<p>Predator-tier squad coordination patterns:</p>
<ul>
  <li><strong>Engage protocol:</strong> "I push left, follow on my call." NOT "I'm pushing now."</li>
  <li><strong>Disengage protocol:</strong> "Falling back, smoke me." Squad covers retreat with smokes/ults.</li>
  <li><strong>Banner protocol:</strong> teammate dies → squad designates banner runner. Other 2 cover.</li>
  <li><strong>Reset protocol:</strong> after a wipe-and-revive, full team heals to 200 (full HP + shields) BEFORE re-engage.</li>
</ul>
<p>Master squads have rough versions of these protocols. Predators have them down to the second.</p>` },
      { heading: 'Aim consistency at the ceiling', html: `<p>Predator aim benchmarks:</p>
<ul>
  <li>Tracking %: 65%+ on moving targets at mid-range.</li>
  <li>Recoil control: full-auto R-99 at 30m drops <30% accuracy from first-shot baseline.</li>
  <li>Long-range Sentinel: 50%+ headshot rate at 100m+.</li>
  <li>Reaction time: <250ms on visual flicks (test in Aim Lab).</li>
</ul>
<p>Daily aim regimen at this tier: 60 min Aim Lab + 60 min Apex Firing Range with target legend's main weapon. Track headshot rate weekly.</p>` },
      { heading: 'Mental game and tilt protection', html: `<p>Predator matches are 20-30 minutes of high-pressure decisions. Mental discipline:</p>
<ul>
  <li>Reset between deaths in <5 seconds. No commentary on the death.</li>
  <li>Tilt-stack 2 matches → stop session.</li>
  <li>Don't review kill cam past the first 5 seconds.</li>
  <li>Track session win rate. Below 50%, end session.</li>
</ul>
<p>The mental game is where Predator separates from Master. Mechanically the gap is 5%. Mentally, 95%.</p>` },
      { heading: 'Veto and queue strategy', html: `<p>Predator queues are optimized:</p>
<ul>
  <li>Top 3 maps prepped (heat maps memorized, drop spots optimized, pro VOD library curated).</li>
  <li>Bottom 2 maps avoided via queue settings or off-peak queue.</li>
  <li>Lobby reads from session 1: same opponents at this rank recur. Note their tendencies.</li>
</ul>
<p>The veto edge compounds across a season. Predators climb 30%+ faster per session than Masters who play all maps.</p>` },
      { heading: 'Pro player VOD library at scale', html: `<p>Predator squads have absorbed 100+ specific ALGS patterns. Watch one match per day for 90 days. By day 90:</p>
<ul>
  <li>You auto-recognize squad comps from drop.</li>
  <li>You predict ult chains 5+ seconds before they fire.</li>
  <li>You read engagement timing windows by matching pro patterns.</li>
  <li>You know which maps favor dive vs poke vs bunker comps.</li>
</ul>
<p>Recommended VODs: ALGS Year 4+ finals, regional Pro League. Avoid casual streamer content — only tier-1 prep level.</p>` },
    ],
    mistakes: [
      'Ult tracking only "sometimes."',
      'Same game-plan every match — no mid-game flex.',
      'Squad protocols are vibes, not scripts.',
      'Aim ceiling at Master benchmarks (50% tracking) instead of Predator (65%+).',
      'Mental game absent at high-pressure rounds.',
      'No queue veto.',
      'Pro VOD library at 30 patterns, not 100+.',
    ],
    drill: { heading: 'Drill: 90-day pro VOD library + aim regimen', html: `<p>90 days of 60 min daily aim + 1 ALGS match per day. By day 90 you have a 100-pattern library AND your aim is at Predator benchmarks.</p><p>Track weekly: tracking %, headshot rate per weapon, reaction time. If numbers plateau before day 90, fix sensitivity or ergonomics first.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> compares your decision patterns against ALGS-tier reads — particularly useful for finding the rounds where you knew the right call but committed to the wrong one. The exact pattern that separates Master plateau from Predator ceiling.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Diamond to Master', url: '/blog/apex-diamond-to-master.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Apex Storm Point Guide', url: '/games/apex/storm-point.html' },
      { name: 'Apex Olympus Guide', url: '/games/apex/olympus.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 11,
  },
]

// ============================================================================
// MARVEL RIVALS POSTS (3)
// ============================================================================
const MVR_POSTS = [
  {
    game: 'mvr', gameLabel: 'Marvel Rivals', fromRank: 'Bronze', toRank: 'Silver',
    slug: 'mvr-bronze-to-silver',
    metaTitle: 'How to Climb from Bronze to Silver in Marvel Rivals (2026 Guide)',
    metaDescription: 'MVR Bronze-to-Silver — pick one role (Vanguard/Duelist/Strategist), 2-3 hero pool, ult discipline, comp synergy basics, and team-up combo awareness.',
    intro: `<p>Bronze in Marvel Rivals is the foundation tier. Most Bronze players try to play every hero in 6v6 chaos. The climb is role specialization, hero-pool focus, and ult discipline.</p>`,
    sections: [
      { heading: 'Pick one role — Vanguard, Duelist, or Strategist', html: `<p>MVR is 6v6 with three roles. Pick one and queue role-locked:</p><ul><li><strong>Vanguard:</strong> the tank role. Highest impact at low elo because Bronze teams ignore the front-line. Reinhardt-equivalents like Doctor Strange, Magneto, Hulk.</li><li><strong>Duelist:</strong> the DPS role. Reward pure mechanical skill. Hela, Punisher, Iron Man are forgiving picks.</li><li><strong>Strategist:</strong> the support role. Easiest to climb on if your aim is below average. Mantis, Luna Snow, Adam Warlock.</li></ul><p>Don't queue Flex — you'll never specialize. By 60+ matches in one role you'll have the muscle memory Silver players have.</p>` },
      { heading: 'Master 2-3 heroes per role', html: `<p>Pick 2-3 heroes total. Specifics:</p><ul><li><strong>Vanguard:</strong> Doctor Strange (anchor + portal), Magneto (bubble + ult denial), Hulk (dive engage).</li><li><strong>Duelist:</strong> Hela (long-range damage), Punisher (turret + ult), Iron Man (vertical advantage).</li><li><strong>Strategist:</strong> Mantis (sleep + heals), Luna Snow (group heals), Adam Warlock (revive ult).</li></ul><p>Don't expand the pool. 2-3 heroes is plenty at Bronze; deep mastery beats wide-but-shallow.</p>` },
      { heading: 'Ult discipline — coordinate, don\'t solo', html: `<p>Solo ulting is the biggest Bronze mistake. Specifics:</p><ul><li><strong>Hela ult:</strong> only when team is committing to a push. Solo Hela ult = wasted.</li><li><strong>Magneto ult:</strong> save for retake when team can follow up with damage.</li><li><strong>Doctor Strange ult:</strong> portal team to high ground, not into the enemy back-line solo.</li><li><strong>Iron Man ult:</strong> use during team push, not as a defensive panic.</li></ul><p>Call your ult availability in voice. "Hela ult ready" enables team coordination. Silent ulting wastes 50%+ of your ults.</p>` },
      { heading: 'Comp synergy — 2-2-2 standard', html: `<p>Standard MVR comp: 2 Vanguards, 2 Duelists, 2 Strategists. If your team has 4 Duelists and 0 Vanguards, you can't engage. If your team has 0 Strategists, you'll lose every team fight to no heals.</p><p>Quick check at lobby: if 4 players locked Duelists, swap to Vanguard or Strategist regardless of your role preference. Comp synergy beats individual hero preference.</p>` },
      { heading: 'Team-up combo awareness', html: `<p>MVR has team-up bonuses when specific hero pairs are picked. Specifics:</p><ul><li><strong>Hulk + Iron Man:</strong> damage boost on each other.</li><li><strong>Doctor Strange + Magik:</strong> portal synergy for entry.</li><li><strong>Luna Snow + Hawkeye/Iron Fist:</strong> stat bonuses.</li><li><strong>Storm + Human Torch:</strong> elemental combo for cleanup.</li></ul><p>Bronze players ignore team-ups. Silver players ask "who's on my team that I can synergy with?" — and pick accordingly.</p>` },
      { heading: 'Crosshair placement and positioning fundamentals', html: `<p>Universal FPS fundamentals apply:</p><ul><li>Crosshair at head height every doorway and corner.</li><li>Move with cover, not in the open.</li><li>Don't push without your team within 30m.</li><li>If you're a Duelist, position behind the Vanguards, not in front.</li><li>If you're a Strategist, stay within 15m of teammates for cross-heal range.</li></ul><p>These are the basics that win Bronze rounds. Master them before chasing meta picks.</p>` },
      { heading: 'Map awareness — learn 4 maps deep', html: `<p>MVR has 12+ maps across Convoy, Convergence, and Domination types. At Bronze, learn 4 deeply rather than all 12 shallowly:</p><ul><li><strong>Tokyo 2099 — Shin-Shibuya:</strong> Convoy, payload-focused. Learn the rooftop rotation routes.</li><li><strong>Yggsgard — Royal Palace:</strong> Domination, capture point control. Learn the throne room sightlines.</li><li><strong>Klyntar — Symbiotic Surface:</strong> Convergence, both styles needed. Learn cap then payload routes.</li><li><strong>Wakanda — Birnin T'Challa:</strong> Domination with vertical layers. Learn the upper-tier high ground.</li></ul><p>Bronze players play all 12 maps shallowly and never specialize. Silver players know 4 maps cold.</p>` },
      { heading: 'Team fight reset reads', html: `<p>After a wipe, you have a 25-second window to regroup:</p><ul><li>If you wiped, the enemy has ult advantage. Don't trickle in; wait for full team.</li><li>If they wiped, push the objective NOW; they arrive piecemeal.</li><li>If both wiped (overtime), respawn distance determines the winner.</li></ul><p>Bronze squads trickle into reset fights and feed. Silver squads regroup and contest as 6.</p>` },
    ],
    mistakes: ['Queueing Flex — no specialization.','Hero pool of 8+ heroes.','Solo ulting.','Picking 4 Duelists, 0 Vanguards.','Ignoring team-ups.','Strategist out of range of teammates.','Playing all 12 maps shallowly.','Trickling into reset fights.'],
    drill: { heading: 'Drill: 10 games role-locked', html: `<p>Queue role-locked for 10 games on your chosen role. Use only your 2-3 hero pool. Track win rate. By game 10 you'll have foundational map + hero patterns Silver players take for granted.</p><p>If your win rate is 50%+ after 10 games, expand the pool to 4 heroes. If it's 40-50%, keep the 3 and play 10 more. If it's <40%, switch role — your aim or game sense doesn't fit this role.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> reads your replays and flags ult-coordination mistakes per team fight.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/mvr-silver-to-gold.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'MVR Tokyo 2099 Guide', url: '/games/mvr/shin-shibuya.html' },
      { name: 'MVR Yggsgard Guide', url: '/games/mvr/yggdrasill-path.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
  {
    game: 'mvr', gameLabel: 'Marvel Rivals', fromRank: 'Silver', toRank: 'Gold',
    slug: 'mvr-silver-to-gold',
    metaTitle: 'How to Climb from Silver to Gold in Marvel Rivals (2026 Guide)',
    metaDescription: 'MVR Silver-to-Gold — comp synergy depth, ult chain combos, map-archetype hero matching, high-ground positioning, and counter-pick basics.',
    intro: `<p>Silver-to-Gold in MVR is comp synergy depth. At Silver you have a 2-3 hero pool. At Gold you understand which heroes synergize on which maps and time ult chains for fights.</p>`,
    sections: [
      { heading: 'Map archetype hero matching', html: `<p>MVR has Convoy (escort), Convergence (hybrid), and Domination (control) maps. Each rewards different comps:</p><ul><li><strong>Convoy:</strong> brawl comp (Reinhardt-style Vanguards + close-range Duelists). Walk the payload as a unit.</li><li><strong>Convergence:</strong> mixed comp — Duelists for cap, Vanguards for hold. Adapt mid-round.</li><li><strong>Domination:</strong> poke comp (long-range Duelists like Hela + Punisher) for point control.</li></ul><p>Pick your hero based on map type, not preference. Silver picks the same hero every match; Gold picks based on map.</p>` },
      { heading: 'Ult chain combos', html: `<p>Gold-tier ult chains:</p><ul><li><strong>Hela ult + Magneto ult:</strong> Magneto pulls enemies, Hela cleans up the cluster. 4+ kills.</li><li><strong>Strange portal + DPS dive:</strong> Strange portals a Duelist into back-line, picks Strategists.</li><li><strong>Adam Warlock revive + team push:</strong> Adam revives wiped teammates, team re-engages with full HP.</li><li><strong>Cloak & Dagger ult + tank push:</strong> Veil for cover during a Vanguard charge.</li></ul><p>Practice in QM with your team. Each combo wins fights when timed within 1 second of each other.</p>` },
      { heading: 'High ground positioning by map', html: `<p>Every MVR map has high ground that controls fights. Specifics:</p><ul><li><strong>Tokyo 2099 (Shin-Shibuya):</strong> rooftops along the convoy route. Ranged Duelists (Hela, Hawkeye) win from above.</li><li><strong>Yggsgard (Royal Palace):</strong> Throne room balconies. Iron Man / Storm hold from elevation.</li><li><strong>Klyntar (Symbiotic Surface):</strong> elevated walkways. Doctor Strange portal team up.</li></ul><p>Gold players take high ground first; Silver players brawl on flat. The team holding elevation wins 65%+ of fights.</p>` },
      { heading: 'Counter-pick basics', html: `<p>MVR has counter-picks like other hero shooters:</p><ul><li>Enemy Iron Man flying free → swap to Hawkeye, Punisher, or Hela (long-range).</li><li>Enemy Storm dominating → swap to Punisher (turret denies airspace).</li><li>Enemy Doctor Strange portal abuse → Magneto (denies portal exits).</li><li>Enemy Mantis sleeping you → KAY/O-style anti-utility (pick a duelist that bursts the support).</li></ul><p>Silver players one-trick. Gold players counter-pick when the matchup demands it.</p>` },
      { heading: 'Healing ult timing', html: `<p>Healing ults are round-savers when timed:</p><ul><li><strong>Adam Warlock revive ult:</strong> use after a wipe to bring back the team. Don't pre-emptively burn it.</li><li><strong>Luna Snow group heal ult:</strong> use when 3+ teammates are below 50% HP. Heals + sustains the push.</li><li><strong>Cloak & Dagger Veil ult:</strong> use to break enemy LOS during your team's commit.</li></ul><p>Silver supports use ults reactively (after damage). Gold supports use them anticipatively (before enemy ult lands).</p>` },
      { heading: 'Team fight reset reads after a wipe', html: `<p>After a wipe, you have a 25-second window to regroup:</p><ul><li>If you wiped, the enemy has ult advantage. Don't trickle in; wait for full team.</li><li>If they wiped, push the objective NOW; they arrive piecemeal.</li><li>If both wiped (overtime), respawn distance determines the winner. Read the spawn paths.</li></ul><p>Silver squads trickle into resets and feed. Gold squads regroup and contest as 6.</p>` },
      { heading: 'Communication discipline at Gold', html: `<p>Gold-tier comms are short and decisive:</p><ul><li>"Hela ult ready" — call ult availability.</li><li>"Their Strange portal up, fall back" — call counter-ult.</li><li>"Pushing on count, 3, 2, 1" — call synced engages.</li><li>"My HP is 30, falling back" — call your own state.</li></ul><p>Silver comms include commentary and questions. Gold comms only contain decisions and information that change a teammate's action.</p>` },
      { heading: 'Spawn-side rotation reads', html: `<p>MVR maps have predictable defender spawn rotations on Convoy maps:</p><ul><li>Defender spawn after each payload checkpoint moves further away (5-8 seconds).</li><li>Track this — your push window grows on later checkpoints.</li><li>On final checkpoint, defender spawn is right next to objective. Don't engage 1v6.</li></ul><p>Gold players know spawn timings; Silver players don't. The 5-second spawn advantage is fight-decisive.</p>` },
    ],
    mistakes: ['Same hero every map — no archetype matching.','Solo ulting (no chain).','Brawling on flat ground.','One-tricking through counter-picks.','Healing ults reactive, not anticipative.','Trickling into reset fights.','Comms full of commentary, not decisions.','No spawn timing reads.'],
    drill: { heading: 'Drill: 5-game map-comp practice', html: `<p>Play 5 games on each map archetype (15 games total). Brawl on Convoy, mixed on Convergence, poke on Domination. By game 15 you auto-recognize the right comp from the load screen.</p><p>Track per-game: did you pick the right archetype? Did your team comp synergize? After 15 games you'll have direct map → comp mappings memorized.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> can flag rounds where your hero pick contradicted team comp synergy. Useful for spotting the games where your team had 4 Duelists and you didn't swap to fill — a common Silver-to-Gold mistake that's invisible without an outside review.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/mvr-bronze-to-silver.html' },
      { name: 'How to Climb from Gold to Plat', url: '/blog/mvr-gold-to-plat.html' },
      { name: 'MVR Tokyo 2099 Guide', url: '/games/mvr/shin-shibuya.html' },
      { name: 'MVR Yggsgard Guide', url: '/games/mvr/yggdrasill-path.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
  {
    game: 'mvr', gameLabel: 'Marvel Rivals', fromRank: 'Gold', toRank: 'Platinum',
    slug: 'mvr-gold-to-plat',
    metaTitle: 'How to Climb from Gold to Platinum in Marvel Rivals (2026 Guide)',
    metaDescription: 'MVR Gold-to-Plat — counter-picks per round, ult tracking, healing-ult anticipation, pro VOD prep, and comp swaps mid-match.',
    intro: `<p>Gold players have comp synergy. Plat players adapt round-by-round, time ults precisely, and read the enemy comp by round 2. The leap is in-match adaptation — counter-picks, ult tracking across the match, and healing-ult anticipation that flips contested rounds.</p>`,
    sections: [
      { heading: 'Counter-picks per round, not per match', html: `<p>Gold teams pick at round start and run the same comp. Plat teams adapt:</p><ul><li>If you won round 1 with a dive comp → enemy will swap to anti-dive heroes. Switch to brawl for round 2.</li><li>If your Vanguard died first 3 rounds → swap your Vanguard to a more defensive pick (Magneto over Hulk).</li><li>If enemy Hela is carrying → counter-pick Iron Man or Hawkeye to shut her down.</li></ul><p>Plat IGLs call hero swaps every round. Gold teams stick with what worked round 1.</p>` },
      { heading: 'Ult tracking on enemy team across the match', html: `<p>By round 5 you should track enemy ult availability:</p><ul><li>Used Hela ult round 3 → no ult round 4-7. Push aggressive.</li><li>Used Strange ult round 4 → no portal round 5-9.</li><li>Used Magneto ult round 5 → no bubble round 6-9.</li><li>Used Adam Warlock revive round 6 → no panic save round 7+.</li></ul><p>If enemy team has 5+ ults at round 6, hold defensive. If they have 0 ults, push aggressive. Plat plans engages around enemy ult state.</p>` },
      { heading: 'Healing ult anticipation', html: `<p>Plat-tier supports anticipate the enemy push and ult before damage lands:</p><ul><li>Cloak & Dagger Veil before the enemy commits, not after teammates die.</li><li>Adam Warlock revive on the regroup, not as desperate save.</li><li>Luna Snow group heal during sustained team push, before HPs drop below 50%.</li></ul><p>Gold supports use ults reactively. Plat supports time them 1-2 seconds before the trigger event.</p>` },
      { heading: 'Pro-VOD watching as practice', html: `<p>Watch one tier-1 MVR tournament match per day. Pause every minute. Predict the call. By VOD 30 you'll absorb pro-tier macro decisions.</p><p>Recommended VODs: Ignite Tournament finals, regional MVR pro events. Pause-and-predict is the practice method.</p>` },
      { heading: 'Comp swap mid-match', html: `<p>Plat teams swap comps mid-match based on map progression and enemy reads. Example flow:</p><ul><li>Round 1-2: standard 2-2-2 comp.</li><li>Round 3-4: if losing, switch to dive comp to break enemy hold.</li><li>Round 5-6: if winning, lock in the working comp; deny their adaptation.</li></ul><p>Gold teams play the same comp 6 rounds. Plat teams swap every 3 rounds based on results.</p>` },
      { heading: 'Communication discipline', html: `<p>Plat comms are short and ult-focused:</p><ul><li>"Hela ult in 30s, save engage."</li><li>"Magneto ult ready, push on count."</li><li>"Their Adam used revive, push the wipe."</li></ul><p>NOT commentary. Information only — what changes a teammate's decision.</p>` },
      { heading: 'Tilt management at Plat', html: `<p>Gold players tilt-stack into 3-round losing streaks. Plat players reset every round. Technique:</p><ul><li>30-second box breath between rounds (in 4, hold 4, out 4, hold 4). Drops heart rate from 95 BPM (tilted) to 70 BPM (focused).</li><li>If you lose 2 rounds in a row, IGL calls comp swap. Mental break + new picks reset both pieces.</li><li>If a teammate is tilting visibly (caps in chat, blame in voice), don't escalate.</li></ul><p>Plat+ teams have tilt protocols. Gold teams don't and lose the second half.</p>` },
      { heading: 'Anti-stack reads', html: `<p>If 4 enemy heroes stack on point A, point B is open. Plat-tier counter:</p><ul><li>Fake A with 2 utility (smoke + flash), pull rotators.</li><li>Quick rotate to B with 4 players.</li><li>Plant cashout fast. Rotators caught between sites.</li></ul><p>The read happens through droning A early — if you see 3+ enemy silhouettes through smoke or in scans, B is the play. Gold teams commit to called site even when info contradicts. Plat teams audible mid-round based on info advantage.</p>` },
    ],
    mistakes: ['Same comp every round.','No ult tracking.','Healing ults reactive.','No pro VOD prep.','No mid-match comp swap.','Comm-overload.','Tilt-stacks losses.','No anti-stack reads.'],
    drill: { heading: 'Drill: 30 days of pro-VOD-per-day', html: `<p>Watch one tier-1 MVR match per day for 30 days. Note 1 takeaway per match. By day 30 you have 30 specific tactical patterns memorized.</p><p>Examples of takeaways: "Pro Hela ults always paired with Magneto pull." "Pro Strange portal goes to enemy back-line, not your high ground." "Pro Adam Warlock revive used after the second wipe, not the first." Each pattern compounds across the 30-day cycle.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> compares your in-match adaptations against pro-tier patterns — flags rounds where you should have swapped comp but didn't. Particularly useful for spotting whether your team's comp synergized with the map's archetype on each round, or whether you ran the same comp regardless.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/mvr-silver-to-gold.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'MVR Tokyo 2099 Guide', url: '/games/mvr/shin-shibuya.html' },
      { name: 'MVR Wakanda Guide', url: '/games/mvr/birnin-tchalla.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
]

// ============================================================================
// MVR HIGH-TIER POSTS (3)
// ============================================================================
const MVR_POSTS_HIGH = [
  {
    game: 'mvr',
    gameLabel: 'Marvel Rivals',
    fromRank: 'Platinum',
    toRank: 'Diamond',
    slug: 'mvr-plat-to-diamond',
    metaTitle: 'How to Climb from Platinum to Diamond in Marvel Rivals (2026 Guide)',
    metaDescription: 'MVR Plat-to-Diamond — mid-fight counter-picks, healing-ult anticipation, comp-archetype mastery, anti-stack reads, team-up combo discipline, and pro VOD prep.',
    intro: `<p>Plat players have comp synergy. Diamond players adapt mid-fight, time healing ults before damage lands, and read enemy comp by round 2. The leap is in-fight adaptation, not just round-by-round picks.</p>`,
    sections: [
      { heading: 'Mid-fight counter-picks — swap during the fight', html: `<p>Plat IGLs call counter-picks at round start. Diamond IGLs swap heroes DURING a fight if the matchup tilts. Specifics:</p>
<ul>
  <li>Your Vanguard is being shut down by enemy Magneto bubble → mid-fight swap to Doctor Strange (portal to back-line) or Thor (mobility).</li>
  <li>Enemy Hela is carrying → mid-fight swap to Iron Man / Hawkeye / Punisher to shut down ranged DPS.</li>
  <li>Enemy is running 3 Strategists for sustain → swap your Duelist to a burst pick (Spider-Man, Magik, Iron Fist) to cut through heals.</li>
</ul>
<p>Diamond IGLs make 4-6 hero swaps per match. Plat IGLs make 1-2. The mid-fight swap is the biggest single climb lever at this elo.</p>` },
      { heading: 'Healing-ult anticipation', html: `<p>Plat Strategists use ults reactively. Diamond Strategists time them 1-2 seconds BEFORE enemy damage ult lands.</p>
<ul>
  <li>Enemy Hela charges ult → pre-emptive Cloak & Dagger Veil for the team.</li>
  <li>Enemy Strange portal opens → Adam Warlock revive ready for the wipe-and-revive.</li>
  <li>Enemy Iron Man Gamma Overdrive → Luna Snow ult to sustain through the burst.</li>
</ul>
<p>Anticipation requires tracking enemy ult charges constantly. Most Plat Strategists forget. Diamond Strategists never forget.</p>` },
      { heading: 'Comp-archetype mastery', html: `<p>Diamond teams know which comp wins which map type:</p>
<ul>
  <li><strong>Convoy maps:</strong> brawl comp (Reinhardt-style Vanguards + close-range Duelists). Walk the payload as a unit.</li>
  <li><strong>Convergence maps:</strong> mixed comp — Duelists for cap, Vanguards for hold. Adapt mid-round.</li>
  <li><strong>Domination maps:</strong> poke comp (long-range Duelists like Hela + Punisher) for point control.</li>
</ul>
<p>If your team's running brawl on a Domination map, swap. Comp synergy beats individual hero preference every time.</p>` },
      { heading: 'Anti-stack reads — punish bunched enemies', html: `<p>If enemy team stacks 4 on point A, point B is undefended. Diamond counter:</p>
<ul>
  <li>Fake A with 2 utility (smoke + flash), pull rotators.</li>
  <li>Quick rotate to B with 4 players. The 1-2 enemy at B can't hold against 4.</li>
  <li>Cap fast. Rotators caught between sites.</li>
</ul>
<p>The read happens through droning A early. Plat teams commit to the called site even when info contradicts. Diamond teams audible mid-round.</p>` },
      { heading: 'Team-up combo discipline', html: `<p>MVR has hero pair bonuses. Diamond teams pick around them:</p>
<ul>
  <li><strong>Hulk + Iron Man:</strong> damage boost on each other.</li>
  <li><strong>Doctor Strange + Magik:</strong> portal synergy for entry.</li>
  <li><strong>Luna Snow + Hawkeye/Iron Fist:</strong> stat bonuses.</li>
  <li><strong>Storm + Human Torch:</strong> elemental combo.</li>
</ul>
<p>If you're playing without checking team-up combos, you're leaving 5-10% damage on the table per fight. Plat ignores this. Diamond builds comp around it.</p>` },
      { heading: 'Tilt management between rounds', html: `<p>Diamond players reset every round. Tilt protocol:</p>
<ul>
  <li>30-second box breath between rounds (in 4, hold 4, out 4, hold 4). Heart rate from 95+ BPM to 70 BPM.</li>
  <li>If you tilt-stack 3 losses, end the session. Don't grind through tilt at this elo.</li>
  <li>Don't blame teammates. Quick "you got this, swap heroes" defuses tilt better than silence.</li>
</ul>
<p>Diamond+ teams have tilt protocols. Plat teams don't and lose the second half.</p>` },
      { heading: 'Pro VOD prep — tournament patterns', html: `<p>Watch one tier-1 MVR tournament match per day. Pause every minute. Predict the call.</p>
<p>By VOD 30 you'll absorb pro-tier macro: ult chain timing, comp swaps mid-match, healing-ult anticipation. Recommended VODs: Ignite Tournament finals, regional MVR pro events.</p>` },
      { heading: 'Communication discipline at high elo', html: `<p>Plat comms include commentary. Diamond comms are short and decisive:</p>
<ul>
  <li>"Hela ult ready" — call ult availability.</li>
  <li>"Their Strange portal up, fall back" — call counter-ult.</li>
  <li>"Pushing on count, 3, 2, 1" — synced engage call.</li>
  <li>"My HP is 30, falling back" — call your own state.</li>
</ul>
<p>NOT "I think we should push, what do you think?" Information only — what changes a teammate's decision. The comm discipline is the single biggest non-mechanical Diamond differentiator.</p>` },
    ],
    mistakes: [
      'Hero swaps only at round start, not mid-fight.',
      'Healing ults reactive, not anticipative.',
      'Comp archetype mismatch (brawl on Domination map).',
      'No anti-stack reads.',
      'Ignoring team-up combos.',
      'Tilt-stacking 3+ rounds.',
      'No pro VOD prep.',
      'Comms full of commentary, not decisions.',
    ],
    drill: { heading: 'Drill: 5-game team-up combo audit', html: `<p>5 ranked games. Pre-match, identify which 2-3 hero pairs in your team comp have team-up bonuses. Post-match, check whether you actually picked complementary heroes.</p><p>By game 5 you'll auto-pick around team-up combos in lobby — the Diamond differentiator that Plat IGLs ignore.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> tracks your hero-swap timing and team-up combo usage across matches. Useful for spotting the Plat plateau pattern of "stuck on main hero through whole match" that Diamond mid-fight swaps solve.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Gold to Plat', url: '/blog/mvr-gold-to-plat.html' },
      { name: 'How to Climb from Diamond to GM', url: '/blog/mvr-diamond-to-gm.html' },
      { name: 'MVR Tokyo 2099 Guide', url: '/games/mvr/shin-shibuya.html' },
      { name: 'MVR Yggsgard Guide', url: '/games/mvr/yggdrasill-path.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 10,
  },
  {
    game: 'mvr',
    gameLabel: 'Marvel Rivals',
    fromRank: 'Diamond',
    toRank: 'Grandmaster',
    slug: 'mvr-diamond-to-gm',
    metaTitle: 'How to Climb from Diamond to Grandmaster in Marvel Rivals (2026 Guide)',
    metaDescription: 'MVR Diamond-to-GM — top-tier mental discipline, mechanical aim consistency, hero pool depth, match-to-match macro reads, and 100+ pattern pro VOD library.',
    intro: `<p>Diamond is high-elo in MVR. Grandmaster is top 1%. The gap is mental discipline at the high-pressure rounds, mechanical aim at the ceiling, and hero pool depth that lets you cover any meta swap. Here's the climb.</p>`,
    sections: [
      { heading: 'Top-1% mental discipline', html: `<p>GM matches are 30+ minutes of high-pressure decisions. Mental discipline:</p>
<ul>
  <li>2-second mental reset between deaths. Same crosshair, same default, same focus. No commentary.</li>
  <li>If you tilt-stack 2 losses, end the session.</li>
  <li>Don't blame teammates in voice. GM players solve; Diamond players blame.</li>
  <li>Track session win rate. Below 50%, end session — your performance compounds badly past that point.</li>
</ul>
<p>The reset discipline is what separates GM consistency from Diamond volatility. Most plateaued Diamonds have the mechanics but lose 4-round streaks to tilt.</p>` },
      { heading: 'Mechanical aim at the ceiling', html: `<p>GM aim benchmarks per role:</p>
<ul>
  <li>Duelist (Hela, Punisher): 35%+ headshot rate.</li>
  <li>Iron Man / Storm: 50%+ projectile accuracy on moving targets.</li>
  <li>Hawkeye: 40%+ headshot rate at long range.</li>
  <li>Strategist (Mantis Sleep, Cloak Dagger): 50%+ utility hit rate.</li>
</ul>
<p>Daily aim regimen: 30 min Aim Lab + 30 min MVR practice + 30 min hero-specific scenario. Track headshot rate weekly.</p>` },
      { heading: 'Hero pool depth — 5+ per role', html: `<p>Diamond players have 2-3 heroes per role. GM players have 5+. Why: meta swaps and counter-picks demand fluency.</p>
<p>Specific GM hero pools:</p>
<ul>
  <li>Vanguard: Doctor Strange, Magneto, Hulk, Thor, Venom (match-up dependent).</li>
  <li>Duelist: Hela, Punisher, Black Panther, Iron Man, Hawkeye, Storm, Spider-Man.</li>
  <li>Strategist: Mantis, Luna Snow, Adam Warlock, Cloak & Dagger, Invisible Woman.</li>
</ul>
<p>If you're 2-trick at Diamond, expand the pool BEFORE chasing GM. The 4-round counter-pick window demands flexibility.</p>` },
      { heading: 'Match-to-match macro reads', html: `<p>GM teams play match-to-match, not round-to-round. Specifics:</p>
<ul>
  <li>Round 1-3: probe enemy comp + ult patterns.</li>
  <li>Round 4-6: pick best counter-strat from probe data.</li>
  <li>Round 7+: lock in winning pattern.</li>
</ul>
<p>Diamond teams play round-to-round. GM teams play match-to-match. The 12-round vision is what wins overtime games.</p>` },
      { heading: 'Pro VOD library at scale — 100+ patterns', html: `<p>By GM, you should have absorbed 100+ specific pro patterns. Watch one tier-1 match per day for 90 days. By day 90:</p>
<ul>
  <li>You auto-recognize standard comps from round 1 lock-in.</li>
  <li>You predict ult chains 5+ seconds before they fire.</li>
  <li>You read healing-ult timing windows by matching pro patterns.</li>
  <li>You know which maps favor brawl vs poke vs dive comps.</li>
</ul>
<p>Recommended VODs: tier-1 MVR tournaments, regional finals. Avoid casual content.</p>` },
      { heading: 'Sensitivity and FOV optimization', html: `<p>GM players tune sensitivity to body type and hand speed:</p>
<ul>
  <li>800-1600 DPI is standard. Higher DPI = faster flicks but less precision.</li>
  <li>Sensitivity in cm/360°: 30-50cm for Duelists, 20-30cm for projectile-heavy heroes.</li>
  <li>FOV: max in-game.</li>
  <li>Crosshair: bright cyan or yellow.</li>
</ul>
<p>If you're using default settings, you're playing at a mechanical disadvantage. Spend a week dialing in.</p>` },
      { heading: 'Veto strategy and queue optimization', html: `<p>By Diamond you have win-rate data per map. GM uses it strategically:</p>
<ul>
  <li>Toggle off bottom 3 maps in queue settings.</li>
  <li>Track win rate weekly. If a strong map drops below 50%, study pro VODs of it before queueing again.</li>
  <li>Focus practice on top 4-5 strongest maps.</li>
</ul>
<p>Veto + practice focus compounds across a season. Diamonds who veto strategically gain 30%+ more rank per session.</p>` },
      { heading: 'Tilt protocols at the high-pressure rounds', html: `<p>Round 13+ is where MVR matches are decided. Specific tilt protocols:</p>
<ul>
  <li>Between rounds, 4-second box breath. Heart rate from 95+ BPM to 70 BPM.</li>
  <li>If you lose 2 in a row, IGL calls "default round" — no trick play, just fundamentals. Resets the team's mental.</li>
  <li>If you lose 3 in a row, IGL calls a hero swap if anyone's tilting visibly. The swap is more valuable than 1 round of frags.</li>
</ul>
<p>GM teams have this protocol. Diamond teams tilt-stack into 6-round losing streaks.</p>` },
    ],
    mistakes: [
      'Tilt-stacking matches.',
      'Aim ceiling at Diamond benchmarks instead of GM.',
      'Hero pool of 2-3 per role.',
      'Round-to-round play instead of match-to-match macro.',
      'Pro VOD library at 30 patterns, not 100+.',
      'Default sensitivity / FOV.',
      'No queue veto.',
      'No tilt protocol for round 13+.',
    ],
    drill: { heading: 'Drill: 90-day pro VOD library + aim regimen', html: `<p>90 days of 30 min aim + 1 pro VOD per day. By day 90 you have a 100-pattern library AND your aim is at GM benchmarks.</p><p>Track weekly: headshot rate, healing per game (Strategists), damage per game (Duelists). If numbers plateau before day 90, fix sensitivity or ergonomics first before continuing.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> compares your in-match adaptation patterns against tier-1 reads — flags rounds where you should have swapped comp but didn't. The Diamond plateau pattern that GM macro discipline solves. Recon+ also reads ult timing across the full match — useful for spotting whether your healing-ult anticipation actually beats the enemy damage ult window.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Plat to Diamond', url: '/blog/mvr-plat-to-diamond.html' },
      { name: 'How to Climb from GM to Celestial', url: '/blog/mvr-gm-to-celestial.html' },
      { name: 'MVR Tokyo 2099 Guide', url: '/games/mvr/shin-shibuya.html' },
      { name: 'MVR Wakanda Guide', url: '/games/mvr/birnin-tchalla.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 11,
  },
  {
    game: 'mvr',
    gameLabel: 'Marvel Rivals',
    fromRank: 'Grandmaster',
    toRank: 'Celestial',
    slug: 'mvr-gm-to-celestial',
    metaTitle: 'How to Climb from Grandmaster to Celestial in Marvel Rivals (2026 Guide)',
    metaDescription: 'MVR GM-to-Celestial — top-0.5% macro round structure, mechanical aim at the ceiling, enemy emotional reads, full-pool hero fluency, and tournament-tier comm discipline.',
    intro: `<p>GM is top 1% in MVR. Celestial is top 0.3%. The gap is macro round structure across full matches, mechanical aim at the ceiling, and tournament-tier comm discipline that converts close losses into close wins.</p>`,
    sections: [
      { heading: 'Macro round structure across full matches', html: `<p>Celestial teams script the match across all rounds:</p>
<ul>
  <li>Rounds 1-3: probe enemy comp + ult patterns.</li>
  <li>Rounds 4-6: pick best counter-strat based on probe data.</li>
  <li>Rounds 7-9: lock in winning pattern.</li>
  <li>Rounds 10+: counter-counter-strats based on enemy adaptation.</li>
</ul>
<p>GM teams play round-to-round. Celestial teams play match-to-match with the script in mind.</p>` },
      { heading: 'Mechanical reset discipline every round', html: `<p>At Celestial, you will get one-shot from spawn unfairly. You will lose a 1v3. The Celestial difference is reset. Every round.</p>
<p>2-second mental reset between deaths. No commentary. Same crosshair, same default position. The reset is what 0.3% of MVR players have. Most who reach GM can't reset; they tilt round 14+ and lose the half.</p>` },
      { heading: 'Pro-aim consistency at the ceiling', html: `<p>Specific Celestial benchmarks:</p>
<ul>
  <li>Duelist headshot rate: 38%+.</li>
  <li>Projectile accuracy (Iron Man, Storm): 55%+ on moving targets.</li>
  <li>Strategist utility hit rate: 55%+ Mantis sleep, 50%+ Cloak Dagger pierce.</li>
</ul>
<p>If your numbers are below these, you have an aim ceiling blocking the climb. Drill: 1 hour daily of focused aim. Track weekly.</p>` },
      { heading: 'Enemy emotional reads', html: `<p>By round 14 you should know if the enemy team is frustrated or focused. Specific signals:</p>
<ul>
  <li>Callout volume drops when focused, rises when tilting.</li>
  <li>Utility usage gets sloppier when tilting.</li>
  <li>Hero swaps become panic-picks instead of strategic.</li>
</ul>
<p>Celestial IGLs read this and call counter-strats that exploit tilt. Standard: when enemy is tilting, run safe defaults — they'll over-extend trying to make a play.</p>` },
      { heading: 'Full-pool hero fluency — 6+ per role', html: `<p>Celestial players have 6+ heroes per role. Why: meta swaps and counter-pick demands.</p>
<ul>
  <li>Vanguard pool: Strange, Magneto, Hulk, Thor, Venom, Cap America, Groot, Peni.</li>
  <li>Duelist pool: Hela, Punisher, Iron Man, Hawkeye, Storm, Spider-Man, Magik, Psylocke, Black Panther.</li>
  <li>Strategist pool: Mantis, Luna, Adam Warlock, Cloak Dagger, Invisible Woman, Rocket, Loki.</li>
</ul>
<p>GM players have 4-5 heroes per role. Celestial players have 6+. The depth is the conversion lever.</p>` },
      { heading: 'Tournament-tier comm discipline', html: `<p>Celestial teams comm short and decisive:</p>
<ul>
  <li>"Hela ult ready" — call ult availability.</li>
  <li>"Pushing on count, 3, 2, 1" — synced engage.</li>
  <li>"Their Strange portal up, fall back" — counter-call.</li>
</ul>
<p>NOT commentary. Information only — what changes a teammate's decision.</p>` },
      { heading: 'Veto and matchmaking macro', html: `<p>Celestial queues: top 4 maps prepped + bottom 3 banned. Veto wins matches before round 1.</p>
<ul>
  <li>Ban opponents' best 2 maps based on match history.</li>
  <li>Pick your best 2 maps.</li>
  <li>Decider: highest win rate vs their comp style.</li>
</ul>
<p>The veto edge compounds across a season. Celestial players win 60%+ of matches at veto.</p>` },
      { heading: 'Anti-stack + anti-utility positioning', html: `<p>At Celestial, the enemy will throw perfect utility every round. The Celestial counter is positioning that minimizes utility damage:</p>
<ul>
  <li>Stand at flash-resistant angles — corners where the wall blocks pop-flashes.</li>
  <li>Pre-aim ult-throwing spots. If the enemy Hela ults from the same spot every round, pre-aim that spot at her ult activation timing.</li>
  <li>If a healing ult lands on the enemy team, focus the highest-damage Duelist (not the Strategist who ulted) — the heal expires in 5-8 seconds.</li>
</ul>
<p>This is positional discipline that requires 1000+ rounds of practice. GM players know the angles theoretically; Celestial players use them in every round.</p>` },
      { heading: 'Endgame 1v1 reads', html: `<p>Celestial 1v1s are won on reads, not aim. In the 5 seconds before contact:</p>
<ul>
  <li>What's the opponent's last move? (Ult? Reload? Swap?)</li>
  <li>What angle did they hold round 1? (Predictable peek?)</li>
  <li>Are they tilted (just lost a duel)? Over-aggressive peek incoming.</li>
  <li>Do they have ult charge? (Track from observation, not memory.)</li>
</ul>
<p>The reads compound. By round 18 you've collected 30+ data points on the enemy carry. Celestial players use 5-6 reads per 1v1. GM players use 2-3.</p>` },
    ],
    mistakes: [
      'No macro round structure — playing each round in isolation.',
      'Mechanical reset failing — tilt-stack 4+ rounds.',
      'Aim ceiling at GM benchmarks instead of Celestial.',
      'No enemy emotional read.',
      'Hero pool of 4-5 per role.',
      'No veto strategy.',
      'Comm-overload.',
      'Standing in standard ult-throw spots round-after-round.',
      '1v1 reads using only 1-2 data points instead of 5-6.',
    ],
    drill: { heading: 'Drill: 30-day stat tracking', html: `<p>Track per-match: headshot rate, K/D, healing per game (Strategists), damage per game (Duelists). If numbers are flat over 30 matches, fix aim regimen first before chasing macro.</p>` },
    aiVodMention: `<p>At Celestial, gaps are subtle. <a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> compares your in-match adaptation against tournament-tier patterns — flags rounds where you should have switched comp but didn't.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Diamond to GM', url: '/blog/mvr-diamond-to-gm.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'MVR Tokyo 2099 Guide', url: '/games/mvr/shin-shibuya.html' },
      { name: 'MVR Yggsgard Guide', url: '/games/mvr/yggdrasill-path.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 11,
  },
]

// ============================================================================
// HALO INFINITE POSTS (3)
// ============================================================================
const HALO_POSTS = [
  {
    game: 'halo', gameLabel: 'Halo Infinite', fromRank: 'Bronze', toRank: 'Silver',
    slug: 'halo-bronze-to-silver',
    metaTitle: 'How to Climb from Bronze to Silver in Halo Infinite (2026 Guide)',
    metaDescription: 'Halo Bronze-to-Silver — BR75 mastery, crosshair placement, power weapon awareness, grenade arc fundamentals, and 4v4 communication basics.',
    intro: `<p>Bronze in Halo Infinite is the foundation tier. Most Bronze players have decent twitch reactions but lose rounds to BR misuse, ignored power weapons, and poor map awareness. The Bronze-to-Silver climb is fundamentals.</p>`,
    sections: [
      { heading: 'Master the BR75 — Halo\'s defining weapon', html: `<p>The BR75 (Battle Rifle) is Halo's universal weapon. Master it before anything else:</p><ul><li>BR is a 4-shot kill at any range with full body shots.</li><li>Headshots break the 4-shot rule and kill in 3 bursts.</li><li>The first burst is most accurate; subsequent bursts spread.</li><li>Tap-fire at long range; full-auto at close range.</li></ul><p>Bronze players spray the BR full-auto at long range and miss. Silver players tap-fire and land. The BR is 80% of every Halo gunfight — master it first.</p>` },
      { heading: 'Crosshair placement at head height', html: `<p>Halo's headshot bonus damage (3-burst kill instead of 4) makes head-height crosshair placement the highest-value habit. Walk through any map with crosshair at head height (about 1/4 of the way down screen). Your kills-per-game doubles.</p><p>Specific habit: every corner you turn, crosshair sits at head height. Practice in custom games walking maps with no enemies.</p>` },
      { heading: 'Power weapon awareness — Sniper, Rocket, Sword', html: `<p>Halo Arena has timed power weapon spawns. Bronze players ignore them; Silver players time them:</p><ul><li><strong>Sniper:</strong> spawns every 90 seconds. Mid-map, contested. Win the contest = round momentum.</li><li><strong>Rocket Launcher:</strong> spawns every 120 seconds. Counters vehicle pushes (rare in Arena).</li><li><strong>Energy Sword:</strong> spawns every 90 seconds. CQB instant-kill weapon. Hold cover to deny.</li><li><strong>Mangler:</strong> spawns at fixed locations. 2-shot kill on body, 1-shot on melee follow-up.</li></ul><p>Set a mental timer for power weapons. Be at the spawn 5 seconds before respawn time.</p>` },
      { heading: 'Grenade arc fundamentals', html: `<p>Halo grenades (Frag, Plasma, Spike) are round-deciders. Specifics:</p><ul><li><strong>Frag:</strong> bounces. Cook by holding throw button to reduce fuse delay.</li><li><strong>Plasma:</strong> sticks. Counter-grenade an enemy to one-shot.</li><li><strong>Spike:</strong> sticks to surfaces. Useful for area denial in chokes.</li></ul><p>Throw a grenade before every contested room entry. The grenade clears the corner and opens up your safe push. Bronze players run in dry; Silver players grenade-then-push.</p>` },
      { heading: '4v4 communication basics', html: `<p>Halo Arena is 4v4. Calls matter:</p><ul><li><strong>Power weapon timing:</strong> "Sniper in 30 seconds."</li><li><strong>Enemy positions:</strong> "2 in Top Mid, 1 Pushing right."</li><li><strong>Health calls:</strong> "I\'m one shot, falling back."</li><li><strong>Coordinated pushes:</strong> "Push together on count, 3, 2, 1."</li></ul><p>Without calls, your team plays 4 solos. With calls, you have 4 minds working as one. Bronze games are 4 solos; Silver games coordinate basic info.</p>` },
      { heading: 'Map control basics — top mid wins rounds', html: `<p>Halo maps are symmetric, with a contested center. Specifics on Aquarius, Live Fire, Recharge:</p><ul><li><strong>Top mid</strong> is the high-ground center area. The team holding it wins fights and power weapon spawns.</li><li><strong>Bottom mid</strong> is the low-ground passage. Risky to cross alone.</li><li><strong>Bases</strong> are spawn-side, defendable but trade-heavy.</li></ul><p>Bronze players sit in their base. Silver players push for top mid every round. Map control is the rank gap.</p>` },
      { heading: 'Movement basics — clamber, slide, sprint', html: `<p>Halo Infinite movement options:</p><ul><li><strong>Clamber:</strong> grab onto ledges to reach high ground. Practice clamber-jumps in custom maps.</li><li><strong>Slide:</strong> sprint + crouch. Use to reposition behind cover during fights.</li><li><strong>Sprint:</strong> faster cross-map traversal. Penalty: can't shoot for 0.5s after stopping sprint.</li><li><strong>Crouch-jumping:</strong> reach unintuitive high spots that opponents won't cover.</li></ul><p>Bronze plays flat-footed. Silver clambers, slides, and crouch-jumps for surprise angles.</p>` },
      { heading: 'Game mode awareness — Slayer vs CTF vs Strongholds', html: `<p>Halo Arena has multiple modes. Each rewards different play:</p><ul><li><strong>Slayer:</strong> first to 50 kills. Spawn-control + power weapon contests are key.</li><li><strong>CTF (Capture the Flag):</strong> grab enemy flag, return to your base. Coordinate flag carry + escort.</li><li><strong>Strongholds:</strong> capture 3 of 5 zones. Rotate between zones; don't stack one.</li><li><strong>Oddball:</strong> hold the ball for points. Carrier protection > kills.</li></ul><p>Bronze players play every mode the same. Silver players adapt strategy to mode.</p>` },
    ],
    mistakes: ['BR full-auto at long range.','Crosshair at chest height.','Ignoring power weapon timers.','Pushing rooms without grenades.','No comms — 4 solo players.','Sitting in your base instead of pushing top mid.','Flat-footed movement (no clamber, slide).','Same strategy across all modes.'],
    drill: { heading: 'Drill: 30 min BR75 Range practice', html: `<p>Halo Range or custom games for 30 minutes. Practice tap-firing the BR at long range, full-auto at close range. By session 7 the spray pattern + tap-firing rhythm is muscle memory.</p><p>Specific routine: 10 min tap-firing the BR at 30+m targets (count headshots). 10 min burst-firing at 15m. 10 min CQB combat with bots. Track headshot accuracy weekly.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> reads your replays and flags positioning + grenade timing mistakes per round.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/halo-silver-to-gold.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Halo Aquarius Guide', url: '/games/halo/aquarius.html' },
      { name: 'Halo Live Fire Guide', url: '/games/halo/live-fire.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
  {
    game: 'halo', gameLabel: 'Halo Infinite', fromRank: 'Silver', toRank: 'Gold',
    slug: 'halo-silver-to-gold',
    metaTitle: 'How to Climb from Silver to Gold in Halo Infinite (2026 Guide)',
    metaDescription: 'Halo Silver-to-Gold — power weapon rotation, equipment use (Repulsor, Threat Sensor, Drop Wall), grenade arcs, and team-up trades on power weapons.',
    intro: `<p>Silver-to-Gold is power weapon mastery and equipment usage. At Silver you know power weapons exist; at Gold you control them, time them, and use equipment to win contested fights.</p>`,
    sections: [
      { heading: 'Power weapon rotation by map', html: `<p>Each map has 1-2 power weapon spawns at fixed locations. Specifics:</p><ul><li><strong>Aquarius:</strong> Sniper at top mid (every 90s). Hammer at bottom mid (every 90s).</li><li><strong>Live Fire:</strong> Sniper at sniper tower (every 90s). Overshield in OS room (every 120s).</li><li><strong>Recharge:</strong> Sniper at top tower (every 90s). Power Drain at bottom mid (every 90s).</li><li><strong>Streets:</strong> Hammer at bottom mid (every 90s). Sniper at lookout point.</li></ul><p>Track the power weapon respawn timer. Win the contest = round momentum. Gold players have power weapon timers in their head every match.</p>` },
      { heading: 'Equipment use — Repulsor, Threat Sensor, Drop Wall', html: `<p>Halo equipment changes engagement outcomes:</p><ul><li><strong>Repulsor:</strong> blocks projectiles, deflects grenades. Use defensively when caught in the open.</li><li><strong>Threat Sensor:</strong> reveals enemy positions through walls. Use before pushing a contested room.</li><li><strong>Drop Wall:</strong> blocks bullets, lets you peek safely. Use for power weapon contests.</li><li><strong>Grappleshot:</strong> mobility. Use for surprise high-ground takes.</li></ul><p>Silver players ignore equipment; Gold players cycle equipment every fight. The 5-second equipment usage is the round-decider.</p>` },
      { heading: 'Grenade arc accuracy', html: `<p>Gold-tier grenade arcs are practiced. Specifics:</p><ul><li>Cook a Frag (1.5s hold) for instant detonation on landing.</li><li>Plasma stick: lead the target by 0.5s; throw at the upper body.</li><li>Bounce a Frag off a wall to clear a corner you can't see.</li><li>Throw a Spike grenade at a known anchor position; denies that spot for 5s.</li></ul><p>Practice grenade arcs in custom maps. After 50 reps, the arc becomes muscle memory.</p>` },
      { heading: 'Team-up trades on power weapons', html: `<p>Power weapon contests are 1v1 to the death. Gold-tier trades:</p><ul><li>Teammate enters the power weapon zone first; you trade-frag from cover.</li><li>If teammate dies, you commit and pick up the weapon they dropped.</li><li>If you both die, the weapon is in the open — the third teammate takes it.</li></ul><p>Silver teams send 1 player to power weapon and lose. Gold teams send 2 and trade for control.</p>` },
      { heading: 'Spawn timing reads', html: `<p>Halo Arena has predictable spawn rotations. Specifics:</p><ul><li>After a wipe, your team spawns at base. Plan rotation paths before respawning.</li><li>If enemy team is at top mid, you'll spawn opposite side. Trade with timing.</li><li>If you killed an enemy, they respawn at their base. 5 seconds to push for the kill before they're back.</li></ul><p>Gold players track spawn paths to set up trade kills. Silver players don't think about spawn paths.</p>` },
      { heading: 'Sword fights and CQB awareness', html: `<p>Energy Sword is an instant kill at melee range. Counter-strats:</p><ul><li>Don't engage Sword in CQB; back away to BR distance.</li><li>Use Repulsor when Sword is mid-lunge; cancels the kill.</li><li>If you have Sword, lunge from cover with the angle hidden.</li></ul><p>Silver players panic-trade with Sword; Gold players counter the lunge with equipment or distance.</p>` },
      { heading: 'Comp role designation — 4v4 specialist roles', html: `<p>Halo Arena is 4v4. Gold-tier teams designate roles:</p><ul><li><strong>Slayer (entry fragger):</strong> takes first contact, BR/Mangler aggressive.</li><li><strong>Power weapon controller:</strong> Sniper / Skewer holder, plays back.</li><li><strong>Objective runner:</strong> grabs flag/ball/captures zones in objective modes.</li><li><strong>Support / utility:</strong> Drop Wall, Threat Sensor, Repulsor for team plays.</li></ul><p>Silver teams 4 solo players. Gold teams designate roles and stick with them.</p>` },
      { heading: 'Power-up timing — Overshield + Active Camo', html: `<p>Beyond power weapons, Halo has power-ups: Overshield (extra HP) and Active Camo (invisibility). Spawn timings:</p><ul><li><strong>Overshield:</strong> 120s respawn. Critical for dive engages.</li><li><strong>Active Camo:</strong> 90s respawn. Sniper or Sword carrier holds it.</li></ul><p>Track power-up timers in your head. Win the contest = power-up advantage = round momentum.</p>` },
    ],
    mistakes: ['Power weapon timers ignored.','Equipment unused.','Grenades thrown blindly.','1-player power weapon contests.','No spawn timing reads.','Trading Sword in CQB.','No role designation in 4-stack.','Ignoring Overshield / Active Camo timers.'],
    drill: { heading: 'Drill: 5 ranked games tracking power weapon timers', html: `<p>For 5 games, set a mental timer (or use stopwatch) for each power weapon respawn. Be at the spawn 5 seconds early. Track win-rate of power weapon contests. By game 5 you'll auto-track timers.</p><p>Specific habit: when a power weapon is picked up (yours or enemy's), start a 90-second timer in your head. At 80 seconds, communicate "Sniper in 10." At 90 seconds, contest the spawn.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> tracks your power weapon contest win rate and flags rounds where the rotation broke down. Useful for spotting the maps where you consistently lose the Sniper contest — usually a positioning issue you can fix once you know which map's contest you're losing.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/halo-bronze-to-silver.html' },
      { name: 'How to Climb from Gold to Plat', url: '/blog/halo-gold-to-plat.html' },
      { name: 'Halo Recharge Guide', url: '/games/halo/recharge.html' },
      { name: 'Halo Streets Guide', url: '/games/halo/streets.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
  {
    game: 'halo', gameLabel: 'Halo Infinite', fromRank: 'Gold', toRank: 'Platinum',
    slug: 'halo-gold-to-plat',
    metaTitle: 'How to Climb from Gold to Platinum in Halo Infinite (2026 Guide)',
    metaDescription: 'Halo Gold-to-Plat — coordinated power weapon contests, spawn-flip control, grenade-cook timing, anti-grapple positioning, and pro VOD prep.',
    intro: `<p>Gold-to-Plat in Halo is coordinated power weapon contests, spawn flips, and pro-tier positioning. The leap is converting individual fundamentals into team-coordinated map control. At Gold you contest power weapons solo; at Plat your team posts 4 players around the spawn and dominates the cycle.</p>`,
    sections: [
      { heading: 'Coordinated power weapon contests', html: `<p>Plat teams contest power weapons as 4, not 1. Specifics:</p><ul><li>30 seconds before respawn: 2 players posted at the spawn, 2 players covering rotation paths.</li><li>10 seconds before respawn: 1 player throws Threat Sensor in the spawn zone.</li><li>0 seconds: pick up weapon, retreat to cover, wait for the next contest.</li></ul><p>Gold teams send 1 player and lose. Plat teams pre-position 4-deep and dominate the spawn cycle.</p>` },
      { heading: 'Spawn-flip control', html: `<p>Halo has reverse-spawn mechanics: kill 3 enemies in their base, they spawn at your base instead. Plat teams use this:</p><ul><li>Coordinate a 4-player base push when enemy is at top mid.</li><li>Kill 3 in their base = spawn flip.</li><li>You now control top mid AND their power weapon spawn.</li></ul><p>Spawn-flips are round-winning. Gold teams don't read spawns; Plat teams flip 1-2 times per match.</p>` },
      { heading: 'Grenade-cook timing', html: `<p>Plat-tier grenade play is timed:</p><ul><li>Cook Frag for 1.5s = instant detonation on landing. Use in 1v1 corner peeks.</li><li>Cook Plasma for 0.5s = quicker stick. Use on moving targets.</li><li>Pre-throw a Frag through a doorway 1 second before pushing. The room is cleared by the time you arrive.</li></ul><p>Gold grenades land 2 seconds late. Plat grenades land on the count.</p>` },
      { heading: 'Anti-grapple positioning', html: `<p>Grappleshot is mobility-heavy. Plat anti-grapple:</p><ul><li>Hold cover that grapple can't reach (low ceilings, building corners).</li><li>If enemy grapples to high ground, throw a Plasma or Frag to deny the perch.</li><li>If enemy grapples toward you, BR-burst mid-air. The grapple is a free shot.</li></ul><p>Silver / Gold lose to grapple plays. Plat preps for them.</p>` },
      { heading: 'Pro VOD watching as practice', html: `<p>Watch one HCS (Halo Championship Series) match per day. Pause every minute. Predict the call. By VOD 30 you'll absorb pro-tier macro decisions: power weapon rotations, spawn-flip timing, equipment cycles.</p><p>Recommended VODs: HCS Worlds finals, regional finals.</p>` },
      { heading: 'Comp diff awareness', html: `<p>Halo Arena has 4 player roles: Slayer (frag), Power Weapon (Sniper main), Objective Runner (CTF/Strongholds focus), Support (utility + revives). Plat teams designate roles pre-match.</p><p>If your team has 4 Slayers and no Objective Runner, you can't take the flag. If you have 4 Power Weapon contesters and no Slayer, you'll lose every gunfight outside the spawn zone.</p><p>Designate roles before round 1. Stick with them unless map demands a swap.</p>` },
      { heading: 'Mode-specific strategies — CTF, Strongholds, Oddball', html: `<p>Plat teams adapt strategies per mode:</p><ul><li><strong>CTF:</strong> 2 escorts the carrier, 2 defend home flag. Pick equipment for carrier protection (Drop Wall on the carry route).</li><li><strong>Strongholds:</strong> rotate between zones every 15-20 seconds. Don't stack one zone.</li><li><strong>Oddball:</strong> ball carrier stays in cover. Other 3 trade frags around them.</li><li><strong>King of the Hill:</strong> hold the hill from cover, not on it. Snipe from range.</li></ul><p>Mode-specific play wins Plat-tier matches. Gold runs the same playbook on every mode.</p>` },
      { heading: 'Tilt management between matches', html: `<p>Halo matches are 5-15 minutes each. Tilt-stacking 3 losses in a row is the Plat plateau killer. Specifics:</p><ul><li>Between matches, take 60 seconds before queueing again. Reset focus.</li><li>If you tilt-stack 3, stop playing for 30 minutes — go for a walk, get water, come back fresh.</li><li>Don't blame teammates in voice. Kills team morale + your own focus.</li><li>Track session win rate. If session win rate drops below 40%, end the session.</li></ul><p>Plat+ players have tilt protocols. Gold players grind through tilt and lose 5+ matches in a row.</p>` },
    ],
    mistakes: ['1-player power weapon contests.','No spawn-flip awareness.','Grenades 2 seconds late.','No anti-grapple prep.','No pro VOD prep.','No role designations pre-match.','Same strategy on every mode.','Tilt-stacking 3+ matches.'],
    drill: { heading: 'Drill: 30 days of HCS pro-VOD-per-day', html: `<p>Watch one HCS match per day for 30 days. Note 1 takeaway per match. By day 30 you have 30 specific tactical patterns memorized.</p><p>Examples: "Pro team designates power-weapon controller pre-match." "Pro IGL calls grenade-cook timing on the count: 'Frag in 2, 1, throw.'" "Pro team always full-heals + reloads between fights." The 30-day discipline is the Plat-to-Onyx bridge.</p><p>If 30 minutes per day is too much, watch in 5-minute chunks. Each chunk = 1 takeaway. The pattern compounds.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> compares your decision patterns against pro-tier reads for power weapon contests. Particularly useful for finding the rounds where you contested a power weapon solo when your team was 30+ meters away — the most common Plat-tier mistake that costs games to Onyx-tier opponents.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/halo-silver-to-gold.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Halo Bazaar Guide', url: '/games/halo/bazaar.html' },
      { name: 'Halo Empyrean Guide', url: '/games/halo/empyrean.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
]

// ============================================================================
// HALO HIGH-TIER POSTS (3)
// ============================================================================
const HALO_POSTS_HIGH = [
  {
    game: 'halo',
    gameLabel: 'Halo Infinite',
    fromRank: 'Platinum',
    toRank: 'Diamond',
    slug: 'halo-plat-to-diamond',
    metaTitle: 'How to Climb from Plat to Diamond in Halo Infinite (2026 Guide)',
    metaDescription: 'Halo Plat-to-Diamond — coordinated power weapon contests, equipment cycling, spawn-flip awareness, mode-specific strategies, and pro VOD prep.',
    intro: `<p>Plat in Halo Infinite means you have the BR fundamentals + power weapon awareness. Diamond demands coordinated 4-player power weapon contests, mode-specific strategies, and active spawn-flip reads. Here's the leap.</p>`,
    sections: [
      { heading: 'Coordinated power weapon contests — 4 players, not 1', html: `<p>Plat teams send 1 player to contest power weapons and lose. Diamond teams pre-position 4 deep:</p>
<ul>
  <li>30 seconds before respawn: 2 players posted near the spawn, 2 covering rotation paths.</li>
  <li>10 seconds before respawn: 1 player throws Threat Sensor in the spawn zone.</li>
  <li>0 seconds: pick up weapon, retreat to cover. Don't fight from the spawn point.</li>
</ul>
<p>Diamond squads dominate the spawn cycle. Plat squads contest 1v1 and lose 50%+ of contests.</p>` },
      { heading: 'Equipment cycling — Drop Wall, Threat Sensor, Repulsor', html: `<p>Diamond teams cycle equipment every fight:</p>
<ul>
  <li><strong>Drop Wall:</strong> peek safely, then collapse the wall to push.</li>
  <li><strong>Threat Sensor:</strong> reveals enemy positions through walls. Throw before pushing contested rooms.</li>
  <li><strong>Repulsor:</strong> reflects projectiles + grenades. Use defensively when caught open.</li>
  <li><strong>Grappleshot:</strong> mobility for surprise high-ground.</li>
</ul>
<p>Plat teams ignore equipment. Diamond teams cycle 2-3 pieces per minute. The 5-second equipment usage is the round-decider.</p>` },
      { heading: 'Spawn-flip awareness', html: `<p>Halo has reverse-spawn mechanics: kill 3 enemies in their base, they spawn at your base instead. Diamond teams use this:</p>
<ul>
  <li>Coordinate a 4-player base push when enemy is at top mid.</li>
  <li>Kill 3 in their base = spawn flip.</li>
  <li>You now control top mid AND their power weapon spawn.</li>
</ul>
<p>Plat teams don't read spawns. Diamond teams flip 1-2 times per match.</p>` },
      { heading: 'Mode-specific strategies', html: `<p>Plat teams play every mode the same. Diamond teams adapt:</p>
<ul>
  <li><strong>Slayer:</strong> spawn-control + power weapon contests. Force kill-feed momentum.</li>
  <li><strong>CTF:</strong> 2 escorts the carrier, 2 defend home flag. Pick equipment for carrier protection (Drop Wall on the carry route).</li>
  <li><strong>Strongholds:</strong> rotate between zones every 15-20 seconds. Don't stack one zone.</li>
  <li><strong>Oddball:</strong> ball carrier stays in cover. Other 3 trade frags around them.</li>
  <li><strong>King of the Hill:</strong> hold the hill from cover, not on it. Snipe from range.</li>
</ul>
<p>Mode-specific play wins Diamond rounds. Plat runs the same playbook every mode.</p>` },
      { heading: 'Grenade-cook timing', html: `<p>Diamond grenades are timed. Specifics:</p>
<ul>
  <li>Cook Frag for 1.5s = instant detonation on landing. Use in 1v1 corner peeks.</li>
  <li>Cook Plasma for 0.5s = quicker stick. Use on moving targets.</li>
  <li>Pre-throw a Frag through a doorway 1 second before pushing — room is cleared by the time you arrive.</li>
</ul>
<p>Plat grenades land 2 seconds late. Diamond grenades land on the count.</p>` },
      { heading: 'Power-up timing — Overshield + Active Camo', html: `<p>Beyond power weapons, Halo has power-ups: Overshield (extra HP) and Active Camo (invisibility). Spawn timings:</p>
<ul>
  <li>Overshield: 120s respawn. Critical for dive engages.</li>
  <li>Active Camo: 90s respawn. Sniper or Sword carrier holds it.</li>
</ul>
<p>Track power-up timers in your head. Win the contest = power-up advantage = round momentum.</p>` },
      { heading: 'Pro VOD watching as practice', html: `<p>Watch one HCS match per day. Pause every minute. Predict the call. By VOD 30 you'll absorb pro-tier macro: power weapon rotations, spawn-flip timing, equipment cycles.</p>
<p>Recommended VODs: HCS Worlds finals, regional finals.</p>` },
      { heading: 'Sensitivity and FOV — tune before chasing rank', html: `<p>Halo Infinite default sensitivity is too high for accurate aim at Diamond+. Setup:</p>
<ul>
  <li><strong>Look sensitivity:</strong> 4-6 horizontal, 4-6 vertical (matches the BR's recoil pattern).</li>
  <li><strong>Look acceleration:</strong> 0 (linear). Default acceleration is awful for tracking.</li>
  <li><strong>FOV:</strong> 105+ on PC for situational awareness.</li>
  <li><strong>Crosshair color:</strong> bright cyan or yellow.</li>
</ul>
<p>Plat players use defaults. Diamond players tune. Spend a week dialing in before grinding more matches.</p>` },
      { heading: 'Communication discipline', html: `<p>Diamond comms are short and decisive:</p>
<ul>
  <li>"Sniper in 30s" — call timing.</li>
  <li>"Pushing top mid, follow on call" — synced engage.</li>
  <li>"Their power weapon dead, push" — call momentum.</li>
  <li>"I'm one-shot, falling back" — call your state.</li>
</ul>
<p>NOT commentary. Information only — what changes a teammate's decision. Plat comms include questions and commentary; Diamond comms only contain decisions.</p>` },
    ],
    mistakes: [
      '1-player power weapon contests.',
      'Equipment unused.',
      'No spawn-flip awareness.',
      'Same strategy on every mode.',
      'Grenades 2 seconds late.',
      'No Overshield / Active Camo timer tracking.',
      'No pro VOD prep.',
      'Default sensitivity / FOV / acceleration.',
      'Comms full of commentary, not decisions.',
    ],
    drill: { heading: 'Drill: 5 ranked games tracking power-up timers', html: `<p>For 5 ranked games, set a mental timer for each power weapon AND power-up respawn. Be at the spawn 5 seconds early. Track win-rate of power-up + power-weapon contests.</p><p>By game 5 you'll auto-track timers. Apply in matchmaking — the 90-second cycle is the Diamond differentiator.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> tracks your power weapon contest win rate per map and flags rounds where the rotation broke down. Useful for spotting which maps have the worst contest win rates so you can study them specifically.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Gold to Plat', url: '/blog/halo-gold-to-plat.html' },
      { name: 'How to Climb from Diamond to Onyx', url: '/blog/halo-diamond-to-onyx.html' },
      { name: 'Halo Aquarius Guide', url: '/games/halo/aquarius.html' },
      { name: 'Halo Live Fire Guide', url: '/games/halo/live-fire.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 10,
  },
  {
    game: 'halo',
    gameLabel: 'Halo Infinite',
    fromRank: 'Diamond',
    toRank: 'Onyx',
    slug: 'halo-diamond-to-onyx',
    metaTitle: 'How to Climb from Diamond to Onyx in Halo Infinite (2026 Guide)',
    metaDescription: 'Halo Diamond-to-Onyx — comp role designation, anti-grapple positioning, mid-match adaptation, mental game, and HCS-tier macro absorption.',
    intro: `<p>Diamond is high-elo in Halo Infinite. Onyx is top 3%. The gap is comp role designation, anti-grapple positioning, mid-match adaptation, and HCS-tier macro patterns absorbed from VOD review.</p>`,
    sections: [
      { heading: 'Comp role designation pre-match', html: `<p>Onyx 4-stacks designate roles:</p>
<ul>
  <li><strong>Slayer (entry fragger):</strong> takes first contact, BR/Mangler aggressive.</li>
  <li><strong>Power weapon controller:</strong> Sniper / Skewer holder, plays back.</li>
  <li><strong>Objective runner:</strong> grabs flag/ball/captures zones in objective modes.</li>
  <li><strong>Support / utility:</strong> Drop Wall, Threat Sensor, Repulsor for team plays.</li>
</ul>
<p>Diamond teams have rough roles. Onyx teams have explicit roles + voice calls that confirm them ("I'm power weapon, you objective"). The role discipline is the conversion lever.</p>` },
      { heading: 'Anti-grapple positioning', html: `<p>Onyx enemies will grapple-flank you. Counter:</p>
<ul>
  <li>Hold cover that grapple can't reach (low ceilings, building corners).</li>
  <li>If enemy grapples to high ground, throw Plasma or Frag to deny the perch.</li>
  <li>If enemy grapples toward you, BR-burst mid-air. The grapple is a free shot.</li>
  <li>Pre-aim grapple landing spots — most players grapple to the same spots map after map.</li>
</ul>
<p>Diamond loses to grapple plays. Onyx preps for them.</p>` },
      { heading: 'Mid-match adaptation', html: `<p>Onyx IGLs adapt mid-match based on round 1-3 reads:</p>
<ul>
  <li>Enemy team consistently rushes top mid → fall back, set up cross-fire from base side.</li>
  <li>Enemy power weapon controller dies first → push the next power weapon spawn aggressively.</li>
  <li>Enemy keeps using grapple to claim same high-ground → pre-throw nades to that spot.</li>
</ul>
<p>Diamond teams play set strategies. Onyx teams adapt based on observed patterns.</p>` },
      { heading: 'Mechanical aim consistency', html: `<p>Onyx aim benchmarks:</p>
<ul>
  <li>BR75: 30%+ headshot rate at 30+ meters.</li>
  <li>Sniper: 60%+ headshot rate at any range.</li>
  <li>Mangler: 25%+ headshot rate (combo with melee for 1-shot kill).</li>
</ul>
<p>Daily aim regimen: 30 min Range BR practice, 15 min Sniper practice, 15 min Mangler combo drilling. Track headshot rate weekly.</p>` },
      { heading: 'Mental game between matches', html: `<p>Halo matches are 5-15 min each. Tilt-stacking 3 losses is the Diamond plateau killer:</p>
<ul>
  <li>60-second mental reset between matches.</li>
  <li>If you tilt-stack 3, stop for 30 minutes.</li>
  <li>Don't blame teammates in voice — kills team morale + your own focus.</li>
  <li>Track session win rate. Below 50%, end session.</li>
</ul>
<p>Onyx players reset; Diamond players grind through tilt and lose more.</p>` },
      { heading: 'HCS macro absorption', html: `<p>Watch HCS matches with the pause-and-predict method. By VOD 30, you'll have absorbed:</p>
<ul>
  <li>Standard map control sequences (Aquarius top mid, Live Fire OS contests).</li>
  <li>Coordinated grenade arc setups for chokes.</li>
  <li>Power weapon contest patterns (4 vs 1 dominate).</li>
  <li>Spawn-flip mechanics + reads.</li>
</ul>
<p>Recommended VODs: HCS Worlds, EU/NA regional finals. Tier-1 only.</p>` },
      { heading: 'Equipment + grenade combo plays', html: `<p>Onyx-tier setups:</p>
<ul>
  <li>Drop Wall + Frag throw: peek through wall, throw, retreat behind wall.</li>
  <li>Repulsor + Plasma: reflect enemy grenades AND throw your sticky.</li>
  <li>Threat Sensor + grenade arc: ping enemies through wall, then nade their location.</li>
</ul>
<p>Practice these combos in Custom Game with a buddy. After 20 reps each, the combo timing is muscle memory.</p>` },
      { heading: 'Map veto and queue strategy', html: `<p>By Diamond you have win-rate data per map. Onyx players use it:</p>
<ul>
  <li>Toggle off your bottom 2-3 maps in queue settings.</li>
  <li>Track win rate weekly per map. If a strong map drops below 50%, study HCS VODs of it before queueing again.</li>
  <li>Focus practice on top 4 strongest maps. Become the team's expert there.</li>
</ul>
<p>The veto compounds across a season. Diamonds who veto strategically gain 30%+ more rank per session. The hours invested in the wrong maps is hours lost in the climb.</p>` },
      { heading: 'Tilt protocols for objective modes', html: `<p>In CTF / Strongholds / KOTH, late-game tilt is the round killer. Specific protocols:</p>
<ul>
  <li>If a teammate keeps dying with the flag, switch carriers in voice — "I'll take flag, you escort." Don't assign blame.</li>
  <li>If your team loses a round to overtime, IGL calls "default round next" — no trick play, fundamentals only.</li>
  <li>Between matches, 60-second mental reset. Don't queue back tilted.</li>
</ul>
<p>Onyx teams have these protocols baked in. Diamond teams tilt-stack and lose 4-round streaks.</p>` },
    ],
    mistakes: [
      'No role designation — 4 IGLs in stack.',
      'No anti-grapple prep.',
      'Set strategies, no mid-match adaptation.',
      'Aim ceiling at Diamond benchmarks.',
      'Tilt-stacking matches.',
      'No HCS VOD prep.',
      'Equipment + grenade used independently, not as combos.',
      'No queue veto.',
      'No tilt protocol for objective overtime rounds.',
    ],
    drill: { heading: 'Drill: 30-day HCS pro VOD-per-day + role-locked sessions', html: `<p>30 days of 1 HCS match per day + 4-stack practice with explicit role designation. By day 30 you have 30 patterns memorized + role coordination muscle memory.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> compares your decision patterns against HCS-tier reads for power weapon contests + spawn flips. Useful for finding the rounds where you missed a spawn flip your team should have called.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Plat to Diamond', url: '/blog/halo-plat-to-diamond.html' },
      { name: 'How to Climb from Onyx to Champion', url: '/blog/halo-onyx-to-champion.html' },
      { name: 'Halo Recharge Guide', url: '/games/halo/recharge.html' },
      { name: 'Halo Empyrean Guide', url: '/games/halo/empyrean.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 11,
  },
  {
    game: 'halo',
    gameLabel: 'Halo Infinite',
    fromRank: 'Onyx',
    toRank: 'Champion',
    slug: 'halo-onyx-to-champion',
    metaTitle: 'How to Climb from Onyx to Champion in Halo Infinite (2026 Guide)',
    metaDescription: 'Halo Onyx-to-Champion — top 200 mental game, mechanical aim consistency, HCS-tier macro patterns, comm discipline, and competitive map veto.',
    intro: `<p>Onyx is top 3% of Halo Infinite. Champion is top 200 globally. The gap is mental discipline at the high-pressure rounds, mechanical aim at the ceiling, and HCS-tier macro patterns absorbed from 90+ days of VOD review.</p>`,
    sections: [
      { heading: 'Top-200 mental discipline', html: `<p>Champion matches are 5-15 minutes of high-pressure decisions. Mental discipline:</p>
<ul>
  <li>2-second mental reset between deaths. Same crosshair, same default position.</li>
  <li>If you tilt-stack 2 losses, stop the session. Champion matches don't reward tilt-grinding.</li>
  <li>Don't blame teammates — Champion teams solve, Onyx teams blame.</li>
  <li>Track session win rate. Below 55%, end session.</li>
</ul>
<p>The reset discipline separates Champion consistency from Onyx volatility. Most plateaued Onyx players have the mechanics but lose 4-round streaks to mental tilt.</p>` },
      { heading: 'Champion-tier aim benchmarks', html: `<p>Specific aim benchmarks per weapon:</p>
<ul>
  <li>BR75: 35%+ headshot rate at any range.</li>
  <li>Sniper: 70%+ headshot rate.</li>
  <li>Mangler: 30%+ headshot rate (with melee combo discipline).</li>
  <li>Bandit Evo: 35%+ headshot rate (precision rifle, longer time-to-kill rewards consistency).</li>
</ul>
<p>Daily aim regimen at this tier: 60 min Range practice + 30 min in-match warm-up. Track weekly. If you're stuck below benchmarks, fix sensitivity or technique before chasing macro.</p>` },
      { heading: 'HCS-tier macro patterns at scale', html: `<p>By Champion you should have absorbed 100+ specific HCS patterns. Watch one match per day for 90 days. By day 90:</p>
<ul>
  <li>You auto-recognize map control patterns.</li>
  <li>You predict power weapon contests 30+ seconds before they happen.</li>
  <li>You read spawn flips by position alone.</li>
  <li>You know which equipment combos counter which player styles.</li>
</ul>
<p>Recommended VODs: HCS Worlds finals, regional finals from past 3 years. Avoid casual content.</p>` },
      { heading: 'Communication discipline at top tier', html: `<p>Champion comms are short and decisive:</p>
<ul>
  <li>"Sniper in 10" — call timing.</li>
  <li>"OS gone, push" — call commit.</li>
  <li>"Their power weapon controller dead, push spawn" — call momentum.</li>
  <li>"Falling back, regroup" — call disengage.</li>
</ul>
<p>NOT commentary. Information only. Comm discipline is what separates Champion teams from Onyx teams that frag equally well but lose to miscommunication.</p>` },
      { heading: 'Sensitivity and FOV optimization', html: `<p>Champion players tune sensitivity to body type and hand speed:</p>
<ul>
  <li>800-2400 DPI is standard. Higher DPI = faster flicks, less precision.</li>
  <li>Sensitivity in cm/360°: 25-40cm. Test in custom games.</li>
  <li>FOV: max in-game (Halo Infinite supports 105+).</li>
  <li>Crosshair: bright color (cyan, yellow). Avoid red.</li>
</ul>
<p>If you're using default settings, you're playing at a mechanical disadvantage. Spend a week dialing in.</p>` },
      { heading: 'Map veto and competitive queue strategy', html: `<p>Champion queues: top 4 maps prepped + bottom 3 banned. Veto strategy:</p>
<ul>
  <li>Toggle off bottom 3 maps in queue settings.</li>
  <li>Track win rate weekly per map.</li>
  <li>Focus practice on top 4-5 strongest maps.</li>
  <li>Note opponent comp tendencies on rematch lobbies — at this elo, opponents recur.</li>
</ul>
<p>The veto edge compounds across a season. Champions gain 30%+ more rank per session than Onyx players who play all maps.</p>` },
      { heading: 'Tilt protocols at high-pressure rounds', html: `<p>Round 13+ in objective modes is where matches are decided. Specific tilt protocols:</p>
<ul>
  <li>Between rounds, 4-second box breath. Heart rate from 95+ BPM to 70 BPM.</li>
  <li>If you lose 2 rounds in a row, IGL calls "default round" — no trick play, fundamentals only.</li>
  <li>If you lose 3 in a row, IGL calls a player swap if anyone's tilting visibly.</li>
</ul>
<p>Champion teams have these protocols. Onyx teams tilt-stack into 6-round losing streaks.</p>` },
      { heading: 'Reading enemy team patterns across the match', html: `<p>By round 8 you should have read at least 3 enemy patterns:</p>
<ul>
  <li>Their power weapon controller's preferred angle (predictable peek).</li>
  <li>Their grenade-throwing tendency (do they always cook to 1.5s, or random fuse?).</li>
  <li>Their grapple use (are they aggressive flankers or defensive escapes?).</li>
  <li>Their objective priority (do they stack the hill or rotate?).</li>
</ul>
<p>Champion IGLs build a mental model of enemy tendencies and call counter-plays based on it. Onyx IGLs play their own game without tracking opponents.</p>` },
    ],
    mistakes: [
      'Tilt-stacking matches.',
      'Aim ceiling at Onyx benchmarks instead of Champion.',
      'Pro VOD library at 30 patterns, not 100+.',
      'Comm-overload.',
      'Default sensitivity / FOV.',
      'No queue veto.',
      'No tilt protocol for round 13+.',
      'No enemy pattern tracking across rounds.',
    ],
    drill: { heading: 'Drill: 90-day pro VOD library + aim regimen', html: `<p>90 days of 60 min daily aim + 1 HCS match per day. By day 90 you have a 100-pattern library AND your aim is at Champion benchmarks. Track weekly: headshot rate per weapon, contest win rate, K/D.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> compares your decision patterns against HCS-tier reads round-by-round. Particularly useful for finding the rounds where you knew the right call but committed to the wrong one — the exact pattern separating Onyx plateau from Champion ceiling.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Diamond to Onyx', url: '/blog/halo-diamond-to-onyx.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Halo Bazaar Guide', url: '/games/halo/bazaar.html' },
      { name: 'Halo Empyrean Guide', url: '/games/halo/empyrean.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 11,
  },
]

// ============================================================================
// THE FINALS POSTS (2)
// ============================================================================
const FINALS_POSTS = [
  {
    game: 'finals', gameLabel: 'The Finals', fromRank: 'Bronze', toRank: 'Silver',
    slug: 'finals-bronze-to-silver',
    metaTitle: 'How to Climb from Bronze to Silver in The Finals (2026 Guide)',
    metaDescription: 'The Finals Bronze-to-Silver — pick a build (Light/Medium/Heavy), Cashout vs vault decisions, building destructibility basics, and 3-team awareness.',
    intro: `<p>Bronze in The Finals is foundation tier. Most Bronze players play random builds, contest every cashout, and ignore third-party squads. The Bronze-to-Silver climb is build mastery and cashout decision discipline.</p>`,
    sections: [
      { heading: 'Pick one build — Light, Medium, or Heavy', html: `<p>The Finals has 3 build classes:</p><ul><li><strong>Light (150 HP):</strong> high mobility (Cloak, Grapple, Dash). SR-84 sniper or V9S pistol. Glass cannon.</li><li><strong>Medium (250 HP):</strong> versatile, Healing Beam + Defibrillator. AKM, FCAR, Model 1887. Backbone of any squad.</li><li><strong>Heavy (350 HP):</strong> high HP, Mesh Shield, Charge \'N Slam. Sledgehammer, M60, RPG. Vault carrier.</li></ul><p>Pick one and main it for 4 weeks. Don't bounce builds. Master Medium first if you're new — it's the most forgiving.</p>` },
      { heading: 'Cashout vs vault decisions', html: `<p>The Finals revolves around stealing cash from vaults and depositing into Cashout statues. Bronze players steal randomly; Silver players choose:</p><ul><li>If your squad has 2 Heavies → carry the vault yourself. Heavy + Mesh Shield is unbreakable.</li><li>If you find a vault unopposed → take it. Free money.</li><li>If a vault is contested by 2+ squads → wait, third-party the winner.</li><li>If a Cashout is at 1:30 timer → contest it; the holders are committed and can't relocate.</li></ul><p>Silver squads steal smart. Bronze squads steal whatever vault they see.</p>` },
      { heading: 'Building destructibility basics', html: `<p>The Finals has fully destructible buildings. Bronze players ignore this; Silver players use it:</p><ul><li>Heavy Sledgehammer can destroy walls in 3 hits — make new entries.</li><li>RPG can blow holes in floors — drop on enemy from above.</li><li>Goo Gun (Heavy) can seal entries — denies enemy push paths.</li><li>Defibrillator (Medium) revives teammates anywhere — doesn't need direct line.</li></ul><p>Use destructibility to break enemy holds. The map is a tool, not a fixed environment.</p>` },
      { heading: 'Third-team awareness', html: `<p>The Finals is 4-team mode. Every fight attracts third teams. Specifics:</p><ul><li>Watch the kill feed. Two teams fighting nearby → third party arriving in 30 seconds.</li><li>Audio cue from a direction you didn't engage → third team pushing.</li><li>If you just won a fight, retreat to cover and heal before the next contest.</li><li>If a Cashout is being contested by 2 teams, you're the third team — push the loser.</li></ul><p>Bronze squads forget third teams exist. Silver squads time engages around them.</p>` },
      { heading: 'Healing rotation discipline', html: `<p>The Finals heals are sequenced:</p><ol><li><strong>Healing Beam (Medium ult):</strong> sustained heal, use during sustained fights.</li><li><strong>Defibrillator:</strong> revive a downed teammate. Don't waste on full-HP teammate.</li><li><strong>Health regen (passive):</strong> retreat to cover and wait. Free heal.</li><li><strong>Health pack pickup:</strong> emergency only.</li></ol><p>Silver players use Defib correctly; Bronze players Defib teammates who don't need it.</p>` },
      { heading: 'Squad coordination basics', html: `<p>The Finals 3-stack basics:</p><ul><li>1 Heavy carries the vault, 1 Medium heals, 1 Light scouts.</li><li>If 1 dies, 2 commit to revive — don't push for kills with a downed teammate.</li><li>Group up for Cashout contests; don't trickle in.</li><li>Communicate in voice: "Vault locked, taking it." "Defib in 5 seconds, hold them."</li></ul><p>Bronze trios are 3 solo players. Silver trios coordinate basic tactics.</p>` },
      { heading: 'Movement basics — sprint, slide, mantle', html: `<p>The Finals has agile movement:</p><ul><li><strong>Light dash:</strong> short teleport. Use to escape engagements or break enemy aim.</li><li><strong>Heavy charge:</strong> Charge \'N Slam ult. Use to engage or break a Cashout hold.</li><li><strong>Medium jump pad:</strong> deploy as portable mobility for repositioning.</li><li><strong>Mantle and slide:</strong> use to enter cover faster than running.</li></ul><p>Bronze plays flat-footed. Silver uses build-specific mobility every fight.</p>` },
      { heading: 'Audio cues — listen for footsteps and ult sounds', html: `<p>The Finals audio is rich:</p><ul><li>Footsteps: directional. Hear enemies before sight.</li><li>Cashout statue audio: enemy is depositing — push to interrupt.</li><li>Defibrillator sound: enemy revived a teammate — refocus damage.</li><li>Glitch grenade sound: your gadgets are disabled for 5s; reposition.</li></ul><p>Crank footstep volume to 100. Wear good headphones. Audio is round-decisive.</p>` },
    ],
    mistakes: ['Bouncing builds — no specialization.','Stealing every vault, including contested ones.','Ignoring destructibility.','No third-team awareness.','Defib-ing full-HP teammates.','3 solo plays per fight.','Flat-footed movement.','Audio at default volume.'],
    drill: { heading: 'Drill: 5 ranked games as Medium build', html: `<p>Lock in Medium build for 5 games. Practice Healing Beam + Defib + AKM. By game 5 your role muscle memory is foundational.</p><p>Specific focus per game: game 1, master AKM recoil + ADS. Game 2, master Defib timing (revive teammate before they finish bleed-out). Game 3, master Healing Beam — sustain a Heavy through prolonged fights. Games 4-5, integrate all three.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> reads your replays and flags squad-coordination mistakes per fight.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Gold to Plat', url: '/blog/finals-gold-to-plat.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'The Finals Las Vegas Guide', url: '/games/finals/las-vegas.html' },
      { name: 'The Finals Monaco Guide', url: '/games/finals/monaco.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
  {
    game: 'finals', gameLabel: 'The Finals', fromRank: 'Gold', toRank: 'Platinum',
    slug: 'finals-gold-to-plat',
    metaTitle: 'How to Climb from Gold to Platinum in The Finals (2026 Guide)',
    metaDescription: 'The Finals Gold-to-Plat — build synergy in 3-stacks, vault carry routes, Defib timing, anti-grenade positioning, and Cashout contest reads.',
    intro: `<p>Gold-to-Plat in The Finals is squad coordination depth. At Gold you have build mastery; at Plat your 3-stack synergizes builds, times Defibs precisely, and reads Cashout contests round-by-round.</p>`,
    sections: [
      { heading: 'Build synergy in 3-stacks', html: `<p>Plat-tier 3-stack composition:</p><ul><li><strong>1 Heavy (vault carrier + tank):</strong> RPG, Mesh Shield, M60.</li><li><strong>1 Medium (healer + utility):</strong> Healing Beam, Defib, FCAR.</li><li><strong>1 Light (scout + flank):</strong> SR-84, Cloak, Stun Gun.</li></ul><p>The Heavy carries the cashout, the Medium heals + revives, the Light flanks. Each role is essential. Gold trios run 3 random builds; Plat trios run synergy comps.</p>` },
      { heading: 'Vault carry routes', html: `<p>Each map has fastest carry routes from vault to Cashout. Specifics:</p><ul><li><strong>Las Vegas Casino vault → Strip Cashout:</strong> via the rooftops; avoid Streets ground level.</li><li><strong>Monaco Yacht vault → Plaza Cashout:</strong> via the harbor side, less contested.</li><li><strong>Seoul Mall vault → Plaza Cashout:</strong> via the subway tunnel.</li></ul><p>Plat squads know the carry routes; Gold squads run the obvious path and get third-partied.</p>` },
      { heading: 'Defib timing — anticipate the wipe', html: `<p>Plat-tier Medium players Defib before the wipe is complete:</p><ul><li>Teammate is being shot from 1 angle → Defib BEFORE they go down (full health Defib).</li><li>Teammate is being focused by 3 enemies → use Defib to wipe-and-revive.</li><li>If team is wiping, hide and Defib after the enemy moves on. Don't Defib in the middle of the fight.</li></ul><p>Gold Mediums use Defib reactively (after wipe). Plat Mediums anticipate the wipe and time the Defib for max effect.</p>` },
      { heading: 'Anti-grenade positioning', html: `<p>Pyro grenades and Frag spam break Cashout contests. Plat counter:</p><ul><li>Stand in spots where Frag arc can't reach (under overhangs, behind cover with no roof gap).</li><li>Pre-aim grenade-throwing angles. Most enemies throw from the same spot every time.</li><li>If pyro is thrown, retreat to non-flammable terrain (concrete, glass).</li></ul><p>Gold players take grenade damage every Cashout fight. Plat players minimize it via positioning.</p>` },
      { heading: 'Cashout contest reads', html: `<p>By round 3 you should know how to read Cashout contests:</p><ul><li>If 2 squads are committed to the Cashout → third-party the winner.</li><li>If 1 squad is committed and another is approaching → time the engage on their commitment.</li><li>If you're holding a Cashout, watch all 3 entry directions (one on each squad).</li></ul><p>Plat squads call the read in voice: "2 squads committed at A, third squad incoming from B, hold and let them fight."</p>` },
      { heading: 'Pro-VOD watching as practice', html: `<p>Watch one tier-1 The Finals tournament match per day. Pause every minute. Predict the call. By VOD 30 you'll absorb pro-tier macro: vault routes, Defib timings, third-party reads.</p><p>Recommended VODs: TFCS finals, regional events. Tier-1 only.</p>` },
      { heading: 'Map destructibility — pro-tier usage', html: `<p>Plat squads exploit the destructible environment:</p><ul><li>Heavy with Sledgehammer: knock walls down to make new entries on Cashout sites.</li><li>Heavy RPG: blow holes in floors to drop on enemies from above.</li><li>Heavy Goo Gun: seal entries to deny enemy push paths.</li><li>Light Vanishing Bomb: invisible explosion blows out small walls/floors quickly.</li></ul><p>Gold squads use the map as it is. Plat squads remake the map mid-fight to change the engagement geometry.</p>` },
      { heading: 'Mental game and tilt management', html: `<p>The Finals matches are 8-15 minutes each. Tilt-stacking 3 losses is the Plat plateau killer:</p><ul><li>Between matches, 60-second mental reset.</li><li>If you tilt-stack 3, stop playing for 30 minutes.</li><li>Don't blame teammates in voice — kills team morale.</li><li>Track wins/losses per session. <40% session = end the session.</li></ul><p>Plat+ players have tilt protocols. Gold players grind through tilt and lose more.</p>` },
    ],
    mistakes: ['Random builds in 3-stack.','Carrying via the obvious route.','Defib reactive, not anticipative.','Standing in grenade arc spots.','No Cashout contest read.','No pro VOD prep.','Ignoring map destructibility.','Tilt-stacking matches.'],
    drill: { heading: 'Drill: 5 ranked games on Las Vegas with carry-route practice', html: `<p>Play 5 ranked games on Las Vegas. Each match, practice carrying the vault via the rooftop route, not the Streets. Track success rate. By game 5 the route is muscle memory.</p><p>Specific pattern: Heavy carries the cashout via Pool → Rooftop → Streets corner → Cashout statue. Avoid the open Strip. Heavy + Mesh Shield can survive ranged shots from rooftops; the bigger threat is third-party squads on the ground.</p><p>After Las Vegas, repeat the drill on Monaco (Yacht → Harbor → Plaza route) and Seoul (Mall → Subway → Plaza route). Each map's carry route is unique; pro squads have all 6 memorized.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> compares your Defib timing against pro-tier patterns. Useful for spotting rounds where your Defib was wasted on full-HP teammates or saved too late after a wipe — both are common Plat-tier mistakes that don't show up in standard kill-cam review.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/finals-bronze-to-silver.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'The Finals Seoul Guide', url: '/games/finals/seoul.html' },
      { name: 'The Finals Kyoto Guide', url: '/games/finals/kyoto.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
]

// ============================================================================
// FINALS GAP POSTS (3)
// ============================================================================
const FINALS_POSTS_GAPS = [
  {
    game: 'finals',
    gameLabel: 'The Finals',
    fromRank: 'Silver',
    toRank: 'Gold',
    slug: 'finals-silver-to-gold',
    metaTitle: 'How to Climb from Silver to Gold in The Finals (2026 Guide)',
    metaDescription: 'The Finals Silver-to-Gold — synced 3-stack engagement, build-specific kit mastery, third-team timing reads, vault carry routes per map, and Defib timing.',
    intro: `<p>Silver in The Finals means you've picked a build and have basic Cashout discipline. Gold demands synced 3-stack play, build-specific kit mastery, and third-team timing reads that flip contested rounds. The Silver-to-Gold leap is communication discipline + map-specific carry routes — fundamentals that turn 3 solo players into 1 coordinated unit.</p>`,
    sections: [
      { heading: 'Synced 3-stack engagement', html: `<p>Silver trios fight as 3 solo players. Gold trios fight as 1 unit. Specifics:</p>
<ul>
  <li><strong>Engage call:</strong> "I push left, follow on my call." NOT "I'm pushing now."</li>
  <li><strong>Trade-fragger distance:</strong> within 5m of the entry, crosshair pre-aimed at the engage angle.</li>
  <li><strong>Disengage call:</strong> "Falling back, smoke me." Squad covers retreat.</li>
</ul>
<p>Voice comm is the conversion lever. Silent trios at Silver are 3 solos; comm-disciplined trios at Gold are 1 unit.</p>` },
      { heading: 'Build-specific kit mastery', html: `<p>Pick one build and master its full kit:</p>
<ul>
  <li><strong>Heavy:</strong> Mesh Shield + RPG + Charge \'N Slam. Practice the Mesh Shield-into-engage on every contest.</li>
  <li><strong>Medium:</strong> Healing Beam + Defib + Goo Gun. Master Defib timing (anticipative, not reactive).</li>
  <li><strong>Light:</strong> Cloak + Stun Gun + Glitch Grenades. Master the cloak-flank-stun-pick pattern.</li>
</ul>
<p>Silver players use kits randomly. Gold players have specific combos for every contest scenario.</p>` },
      { heading: 'Third-team timing reads', html: `<p>The Finals is 4-team. Every fight attracts a third squad. Specific reads:</p>
<ul>
  <li>Kill feed shows nearby fight → 30-second arrival window for the third team.</li>
  <li>Audio cue from a direction you didn't engage from → third team pushing.</li>
  <li>If you just won a fight, retreat to cover and heal IMMEDIATELY before the third party.</li>
  <li>If a Cashout is being contested by 2 teams, you're the third team — push the loser.</li>
</ul>
<p>Silver squads forget third teams. Gold squads time engagements around them.</p>` },
      { heading: 'Vault carry routes — map-specific', html: `<p>Silver squads carry the vault via the obvious path and get third-partied. Gold squads use less-contested routes:</p>
<ul>
  <li><strong>Las Vegas Casino → Strip Cashout:</strong> via rooftops, not Streets.</li>
  <li><strong>Monaco Yacht → Plaza:</strong> via harbor side, not promenade.</li>
  <li><strong>Seoul Mall → Plaza:</strong> via subway tunnel, not Streets.</li>
</ul>
<p>Each map has 2-3 fastest carry routes. Memorize them in offline mode before queueing ranked.</p>` },
      { heading: 'Defib timing — anticipate the wipe', html: `<p>Silver Mediums Defib reactively (after wipe). Gold Mediums Defib BEFORE the wipe is complete:</p>
<ul>
  <li>Teammate is being shot from 1 angle → Defib BEFORE they go down (full health Defib).</li>
  <li>Teammate is being focused by 3 enemies → use Defib to wipe-and-revive.</li>
  <li>If team is wiping, hide and Defib after enemy moves on. Don't Defib mid-fight.</li>
</ul>
<p>The Defib timing is the round-saver. Silver Mediums use Defib correctly 30% of the time. Gold Mediums hit 70%+.</p>` },
      { heading: 'Audio cues — track footsteps and ult sounds', html: `<p>Gold The Finals players use audio for everything:</p>
<ul>
  <li>Footsteps: directional + distance.</li>
  <li>Cashout deposit sound: enemy committing — push to interrupt.</li>
  <li>Defibrillator sound: enemy revived — refocus damage on the new target.</li>
  <li>Glitch grenade sound: gadgets disabled, reposition.</li>
</ul>
<p>Crank footstep volume to 100. Wear good headphones.</p>` },
      { heading: 'Map destructibility basics', html: `<p>The Finals has fully destructible buildings. Silver players ignore this; Gold players use it:</p>
<ul>
  <li>Heavy Sledgehammer breaks walls in 3 hits — make new entries on contested Cashouts.</li>
  <li>Heavy RPG blows holes in floors — drop on enemies from above.</li>
  <li>Goo Gun (Heavy) seals entries — denies enemy push paths.</li>
  <li>Defibrillator (Medium) revives teammates anywhere — doesn't need direct line.</li>
</ul>
<p>The map is a tool, not fixed environment. Use destructibility to break enemy holds.</p>` },
      { heading: 'Sensitivity and crosshair setup', html: `<p>Default sensitivity in The Finals is too high for accurate aim at Gold+. Setup:</p>
<ul>
  <li>ADS sensitivity: 0.8x multiplier of hipfire.</li>
  <li>Hipfire sensitivity: medium-fast (test in practice mode).</li>
  <li>FOV: 100+ on PC for awareness.</li>
  <li>Crosshair: bright color (cyan, yellow). Avoid red.</li>
</ul>
<p>Silver uses defaults. Gold tunes settings before grinding more matches.</p>` },
    ],
    mistakes: [
      'Silent trios — 3 solo players.',
      'Random kit usage.',
      'No third-team timing read.',
      'Standard carry routes (predictable).',
      'Reactive Defib timing.',
      'Audio at default volume.',
      'Ignoring map destructibility.',
      'Default sensitivity / FOV.',
    ],
    drill: { heading: 'Drill: 5-game build mastery focus', html: `<p>Pick one build and play 5 ranked games with it. Track your kit usage per round — did you use Mesh Shield in every contest? Did you Defib at the right moment? After 5 games your build feels reflexive.</p><p>Specific tracking: write 1 line per game on what worked and what didn't. Re-read your notes before queueing the next session — patterns emerge fast when you keep notes.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> tracks your kit usage timing across matches and flags rounds where the engage was uncoordinated. Useful for spotting Silver-tier "3 solo plays" patterns vs Gold-tier synced engagements.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/finals-bronze-to-silver.html' },
      { name: 'How to Climb from Gold to Plat', url: '/blog/finals-gold-to-plat.html' },
      { name: 'The Finals Las Vegas Guide', url: '/games/finals/las-vegas.html' },
      { name: 'The Finals Monaco Guide', url: '/games/finals/monaco.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
  {
    game: 'finals',
    gameLabel: 'The Finals',
    fromRank: 'Platinum',
    toRank: 'Diamond',
    slug: 'finals-plat-to-diamond',
    metaTitle: 'How to Climb from Plat to Diamond in The Finals (2026 Guide)',
    metaDescription: 'The Finals Plat-to-Diamond — anticipative Defib timing, multi-floor cashout holds, anti-grenade positioning, build synergy depth, and pro VOD prep.',
    intro: `<p>Plat in The Finals means you have build mastery + carry routes. Diamond demands anticipative Defib timing, multi-floor Cashout holds, and the discipline to read enemy commit patterns 1-2 seconds before they happen. The leap is converting individual mechanics into team-coordinated late-round decisions where most close matches are won or lost.</p>`,
    sections: [
      { heading: 'Anticipative Defib timing perfected', html: `<p>Plat Mediums Defib at 50% bleed-out. Diamond Mediums Defib BEFORE the teammate goes down:</p>
<ul>
  <li>Teammate dropping below 30 HP under fire → instant Defib (full health).</li>
  <li>Teammate is being focused by 3 → Defib mid-fight to convert the loss into a wipe-and-revive.</li>
  <li>If team is wiping, position behind cover and Defib AFTER enemy commits to the next push.</li>
</ul>
<p>Diamond Mediums hit 80%+ Defib accuracy. Plat sits at 60-70%.</p>` },
      { heading: 'Multi-floor Cashout holds', html: `<p>Plat squads hold Cashout from one floor. Diamond squads use multi-floor positioning:</p>
<ul>
  <li>Heavy on Cashout floor (anchor + Mesh Shield).</li>
  <li>Medium one floor up with Jump Pad ready (heal sustainment + repositioning).</li>
  <li>Light on rooftop (sniper picks + flank scouting).</li>
</ul>
<p>The vertical split forces enemies to commit to multiple angles. Plat single-floor holds collapse to coordinated commits.</p>` },
      { heading: 'Anti-grenade positioning', html: `<p>Pyro grenades and Frag spam break Cashout contests. Diamond counter:</p>
<ul>
  <li>Stand under overhangs / behind cover with no roof gap (Frag arc can't reach).</li>
  <li>Pre-aim grenade-throwing angles. Most enemies throw from the same spot every time.</li>
  <li>If pyro is thrown, retreat to non-flammable terrain (concrete, glass).</li>
</ul>
<p>Plat players take grenade damage every Cashout fight. Diamond players minimize it via positioning.</p>` },
      { heading: 'Build synergy in 3-stacks', html: `<p>Diamond 3-stack composition:</p>
<ul>
  <li><strong>1 Heavy:</strong> RPG + Mesh Shield + M60. Vault carrier + tank.</li>
  <li><strong>1 Medium:</strong> Healing Beam + Defib + FCAR. Healer + utility.</li>
  <li><strong>1 Light:</strong> SR-84 + Cloak + Stun Gun. Scout + flank.</li>
</ul>
<p>Plat trios run 3 random builds. Diamond trios run synergy comps where each build fills a specific role.</p>` },
      { heading: 'Cashout contest reads', html: `<p>By round 3 you should know how to read Cashout contests:</p>
<ul>
  <li>If 2 squads are committed to the Cashout → third-party the winner.</li>
  <li>If 1 squad is committed and another is approaching → time engage on their commitment.</li>
  <li>If you're holding a Cashout, watch all 3 entry directions (one per squad).</li>
</ul>
<p>Diamond squads call the read in voice: "2 squads committed at A, third squad incoming from B, hold and let them fight."</p>` },
      { heading: 'Map destructibility — pro-tier usage', html: `<p>Diamond squads exploit destructible environments:</p>
<ul>
  <li>Heavy with Sledgehammer: knock walls down to make new entries.</li>
  <li>Heavy RPG: blow holes in floors to drop on enemies from above.</li>
  <li>Heavy Goo Gun: seal entries to deny push paths.</li>
  <li>Light Vanishing Bomb: invisible explosion blows out small walls/floors.</li>
</ul>
<p>Plat squads use the map as it is. Diamond squads remake the map mid-fight.</p>` },
      { heading: 'Pro VOD watching as practice', html: `<p>Watch one tier-1 The Finals tournament match per day. Pause every minute. Predict the call. By VOD 30 you'll absorb pro-tier macro: vault routes, Defib timings, third-party reads.</p>
<p>Recommended VODs: TFCS finals, regional events. Tier-1 only.</p>` },
      { heading: 'Tilt management between matches', html: `<p>The Finals matches are 8-15 minutes each. Tilt-stacking 3 losses is the Plat plateau killer:</p>
<ul>
  <li>60-second mental reset between matches.</li>
  <li>If you tilt-stack 3, stop for 30 minutes.</li>
  <li>Don't blame teammates in voice — kills team morale + own focus.</li>
  <li>Track session win rate. Below 40%, end the session.</li>
</ul>
<p>Diamond+ teams have tilt protocols. Plat teams grind through tilt and lose more matches per hour.</p>` },
      { heading: 'Round-by-round opponent reads', html: `<p>By round 3 you should have read at least 2 enemy patterns:</p>
<ul>
  <li>Their Heavy's Mesh Shield commit timing — predictable peeks.</li>
  <li>Their Medium's Defib usage frequency.</li>
  <li>Their Light's flank routes per map.</li>
</ul>
<p>Diamond teams build mental models of opponents and call counter-plays based on them. Plat teams play their own game without tracking.</p>` },
    ],
    mistakes: [
      'Defib accuracy at Plat benchmarks (60%) instead of Diamond (80%+).',
      'Single-floor Cashout holds.',
      'Standing in grenade arc spots.',
      'Random build comp in 3-stack.',
      'No Cashout contest read.',
      'Ignoring map destructibility.',
      'No pro VOD prep.',
      'No round-by-round opponent tracking.',
      'Tilt-stacking matches.',
    ],
    drill: { heading: 'Drill: 5 ranked games tracking Defib accuracy', html: `<p>5 ranked games as Medium. Track per game: how many Defibs were "anticipative" (before bleed) vs "reactive" (after bleed). Goal: 80%+ anticipative by game 5.</p><p>If you're not playing Medium, run the drill on your Heavy Mesh Shield commit timing or Light Cloak-flank-stun chain instead. The principle is the same: track kit usage per round, refine via review.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> compares your Defib timing against pro-tier patterns. Useful for spotting rounds where your Defib was wasted on full-HP teammates or saved too late after a wipe.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Gold to Plat', url: '/blog/finals-gold-to-plat.html' },
      { name: 'How to Climb from Diamond to Ruby', url: '/blog/finals-diamond-to-ruby.html' },
      { name: 'The Finals Seoul Guide', url: '/games/finals/seoul.html' },
      { name: 'The Finals Kyoto Guide', url: '/games/finals/kyoto.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 10,
  },
  {
    game: 'finals',
    gameLabel: 'The Finals',
    fromRank: 'Diamond',
    toRank: 'Ruby',
    slug: 'finals-diamond-to-ruby',
    metaTitle: 'How to Climb from Diamond to Ruby in The Finals (2026 Guide)',
    metaDescription: 'The Finals Diamond-to-Ruby — top-1% mental game, mechanical aim consistency, pro VOD library at scale, tournament-tier comm discipline, and queue veto strategy.',
    intro: `<p>Diamond is high-elo in The Finals. Ruby is top 1%. The gap is mental discipline at the high-pressure rounds, mechanical aim at the ceiling, and tournament-tier macro patterns absorbed from 90+ days of pro VOD review. The Diamond-to-Ruby plateau is mental more than mechanical — most plateaued Diamonds have the aim and game sense, they just lose 4-round streaks to tilt.</p>`,
    sections: [
      { heading: 'Top-1% mental discipline', html: `<p>Ruby matches are 8-15 minutes of high-pressure decisions. Mental discipline:</p>
<ul>
  <li>2-second mental reset between deaths. No commentary on the death.</li>
  <li>If you tilt-stack 2 losses, end the session. Don't grind through tilt.</li>
  <li>Don't blame teammates. Ruby teams solve, Diamond teams blame.</li>
  <li>Track session win rate. Below 50%, end session.</li>
</ul>
<p>The reset discipline separates Ruby consistency from Diamond volatility. Most plateaued Diamonds have the mechanics but lose 4-round streaks to tilt.</p>` },
      { heading: 'Mechanical aim at the ceiling', html: `<p>Ruby aim benchmarks per build:</p>
<ul>
  <li>Heavy (M60, Lewis Gun): 25%+ headshot rate at 30m.</li>
  <li>Medium (FCAR, AKM): 30%+ headshot rate.</li>
  <li>Light (SR-84 sniper): 50%+ headshot rate at any range.</li>
  <li>Light (V9S pistol): 35%+ headshot rate.</li>
</ul>
<p>Daily aim regimen: 60 min in The Finals practice mode + 30 min Aim Lab. Track weekly. If you're stuck below benchmarks, fix sensitivity or technique.</p>` },
      { heading: 'Pro VOD library at scale — 100+ patterns', html: `<p>By Ruby, you should have absorbed 100+ specific tournament patterns. Watch one match per day for 90 days. By day 90:</p>
<ul>
  <li>You auto-recognize standard 3-stack comps from drop.</li>
  <li>You predict third-team arrivals before they happen.</li>
  <li>You know which vault carry routes win which maps.</li>
  <li>You know which build matchups counter which.</li>
</ul>
<p>Recommended VODs: TFCS Worlds finals, regional finals from past year.</p>` },
      { heading: 'Tournament-tier comm discipline', html: `<p>Ruby teams comm short:</p>
<ul>
  <li>"Vault locked, taking it."</li>
  <li>"Defib in 3, hold them."</li>
  <li>"Their Heavy ult ready, don't push."</li>
  <li>"Falling back, smoke me."</li>
</ul>
<p>NOT commentary. Information only. Comm discipline is the conversion lever for close matches.</p>` },
      { heading: 'Queue veto strategy', html: `<p>Ruby queues: top 4 maps prepped + bottom 2 banned. The veto compounds across a season.</p>
<ul>
  <li>Toggle off your bottom 2 maps in queue settings.</li>
  <li>Track win rate weekly per map.</li>
  <li>Focus practice on top 4 strongest maps.</li>
</ul>
<p>Diamonds who veto strategically gain 30%+ more rank per session than those who play all maps.</p>` },
      { heading: 'Round-by-round opponent reads', html: `<p>By round 5 you should have read at least 3 enemy patterns:</p>
<ul>
  <li>Their Heavy's Mesh Shield commit timing.</li>
  <li>Their Medium's Defib usage frequency (anticipative vs reactive).</li>
  <li>Their Light's flank routes.</li>
  <li>Their carry route preferences per map.</li>
</ul>
<p>Ruby IGLs build mental models of enemy tendencies and call counter-plays. Diamond IGLs play their own game without tracking.</p>` },
      { heading: 'Endgame 1v1 reads', html: `<p>Ruby 1v1s are won on reads, not aim. In 5 seconds before contact:</p>
<ul>
  <li>What's the opponent's last move? (Reload? Heal? Repositioned?)</li>
  <li>What angle did they hold round 1? (Predictable peek?)</li>
  <li>Are they tilted (just lost a duel)? Over-aggressive peek incoming.</li>
  <li>Have they used Mesh Shield / Cloak / Defib already this fight? Cooldown awareness.</li>
</ul>
<p>Ruby players use 4-5 reads. Diamonds use 1-2.</p>` },
      { heading: 'Tilt protocols for high-pressure matches', html: `<p>Ruby tilt protocols at the high-pressure rounds:</p>
<ul>
  <li>30-second box breath between matches. Heart rate from 95+ BPM (tilted) to 70 BPM (focused).</li>
  <li>If you tilt-stack 2 losses, stop session. Don't grind through tilt at this elo.</li>
  <li>If a teammate is tilting, don't escalate. Quick "you got this, swap builds" defuses tilt better than silence.</li>
</ul>
<p>Ruby+ teams have these protocols. Diamond teams tilt-stack into 4-round losing streaks.</p>` },
      { heading: 'Sensitivity and FOV at the ceiling', html: `<p>Ruby players tune sensitivity to body type and hand speed:</p>
<ul>
  <li>800-1600 DPI is standard. Higher DPI = faster flicks, less precision.</li>
  <li>Sensitivity in cm/360°: 30-50cm. Test in practice mode.</li>
  <li>FOV: max in-game.</li>
  <li>Crosshair: bright cyan or yellow.</li>
</ul>
<p>If you're using default settings, you're playing at a mechanical disadvantage. Spend a week dialing in.</p>` },
    ],
    mistakes: [
      'Tilt-stacking matches.',
      'Aim ceiling at Diamond benchmarks instead of Ruby.',
      'Pro VOD library at 30 patterns, not 100+.',
      'Comm-overload.',
      'No queue veto.',
      'No round-by-round opponent tracking.',
      '1v1 reads using only 1-2 data points.',
      'Default sensitivity / FOV.',
    ],
    drill: { heading: 'Drill: 90-day pro VOD library + aim regimen', html: `<p>90 days of 60 min daily aim + 1 TFCS match per day. By day 90 you have a 100-pattern library AND your aim is at Ruby benchmarks. Track weekly: headshot rate per weapon, Defib accuracy (Mediums), session win rate.</p>` },
    aiVodMention: `<p>At Ruby, gaps are subtle. <a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> compares your decision patterns against tournament-tier reads — flags rounds where you knew the right call but committed to the wrong one. The Diamond plateau pattern that Ruby macro discipline solves.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Plat to Diamond', url: '/blog/finals-plat-to-diamond.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'The Finals Las Vegas Guide', url: '/games/finals/las-vegas.html' },
      { name: 'The Finals Bernal Guide', url: '/games/finals/bernal.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 11,
  },
]

// ============================================================================
// CALL OF DUTY POSTS (2)
// ============================================================================
const COD_POSTS = [
  {
    game: 'cod', gameLabel: 'Call of Duty', fromRank: 'Bronze', toRank: 'Silver',
    slug: 'cod-bronze-to-silver',
    metaTitle: 'How to Climb from Bronze to Silver in Call of Duty (2026 Guide)',
    metaDescription: 'CoD Bronze-to-Silver — meta loadout (AR + SMG combo), Warzone drop spots, recoil control, slide-cancel movement, and ring rotation timing.',
    intro: `<p>Bronze in CoD (Warzone or MP) is foundation tier. Most Bronze players use random loadouts, hot-drop into death zones, and full-auto without recoil control. The Bronze-to-Silver climb is meta loadouts, drop discipline, and recoil mastery.</p>`,
    sections: [
      { heading: 'Meta loadout — AR + SMG combo', html: `<p>Most CoD seasons have a clear meta AR and SMG. Stick to one:</p><ul><li><strong>Primary AR:</strong> the season's S-tier AR (currently MCW or similar). 4-shot kill at any range.</li><li><strong>Secondary SMG:</strong> the season's S-tier SMG (currently RAM-9 or WSP Swarm). 3-shot CQB.</li><li><strong>Perks:</strong> Double Time, EOD, Ghost (Warzone). Dead Silence, Battle Hardened (MP).</li><li><strong>Lethal/Tactical:</strong> Frag + Stun. Standard meta combo.</li></ul><p>Don't experiment. The meta loadout wins 60%+ of duels.</p>` },
      { heading: 'Drop spot selection (Warzone)', html: `<p>Hot-dropping at Bronze is suicide. Edge-drop:</p><ul><li><strong>Rebirth Island:</strong> instead of Prison or Security (hot), drop Industry or Living Quarters (edge).</li><li><strong>Verdansk:</strong> instead of Downtown or Superstore (hot), drop Farmland or Hospital (edge).</li></ul><p>Loot full kit (armor, weapons, $5000 cash) before pushing contested zones. Edge drops win more games than fragging at Prison.</p>` },
      { heading: 'Recoil control on the AR', html: `<p>The AR's recoil is predictable: pulls up, then right. Counter-pull:</p><ul><li>Pull mouse down to compensate vertical recoil.</li><li>Pull mouse left after 5 shots to counter horizontal drift.</li><li>Tap-fire at long range (3-shot bursts).</li><li>Full-auto at close range (under 30m).</li></ul><p>Practice in the Firing Range or Bot Lobbies. After 30 minutes the recoil pattern is muscle memory.</p>` },
      { heading: 'Slide-cancel movement (MP)', html: `<p>CoD MP is movement-heavy. Slide-cancel basics:</p><ul><li>Sprint forward, then slide (Crouch button), then cancel (Jump or Crouch again).</li><li>Slide-cancel breaks enemy aim tracking.</li><li>Use it to enter rooms unpredictably.</li><li>Combine with mantle-jumps for vertical surprise.</li></ul><p>Bronze players run flat-footed; Silver players slide-cancel every entry. The movement is the rank gap.</p>` },
      { heading: 'Ring rotation timing (Warzone)', html: `<p>Warzone ring phases:</p><ul><li>Ring 1 (5 min): loot, no rotation.</li><li>Ring 2 (3 min): start rotating to next zone.</li><li>Ring 3 (2 min): take a defensible position with high ground or building.</li><li>Ring 4-5 (90s each): commit to position; no more loot.</li></ul><p>Rotate before zone forces. Bronze runs zone damage; Silver pre-rotates with positioning advantage.</p>` },
      { heading: 'Pre-aim common angles', html: `<p>CoD MP maps have known peek spots. Specifics:</p><ul><li><strong>Highrise:</strong> pre-aim Helipad and Office spawn corners.</li><li><strong>Skidrow:</strong> pre-aim Apartments doorway and Mid alley.</li><li><strong>Terminal:</strong> pre-aim Plane stairs and Lobby corner.</li></ul><p>Pre-aim at head height. Most Bronze players walk into rooms with crosshair at the floor.</p>` },
      { heading: 'Killstreak basics (MP)', html: `<p>CoD MP killstreaks chain across kills:</p><ul><li><strong>UAV (4 kills):</strong> reveals enemy positions for the team. Use immediately.</li><li><strong>Counter UAV (5 kills):</strong> denies enemy UAV.</li><li><strong>Care Package / Cluster Strike (8 kills):</strong> objective denial.</li><li><strong>Gunship / VTOL (12 kills):</strong> round-deciding pressure.</li></ul><p>Pick streaks that suit your playstyle. Bronze players pick random streaks; Silver players pick a chain that synergizes (UAV → Counter UAV → Cluster Strike).</p>` },
      { heading: 'Audio cues — footsteps + reload sounds', html: `<p>CoD audio is information. Bronze plays with audio low; Silver plays loud:</p><ul><li>Footsteps: directional + distance.</li><li>Reload sound: enemy is reloading — push for trade.</li><li>Killstreak announcer: enemy got a streak — they have UAV/Counter active.</li><li>Door opens: enemy is entering a room.</li></ul><p>Crank footstep volume. Wear good headphones. The audio advantage in CoD is rank-decisive.</p>` },
      { heading: 'Crosshair sensitivity setup', html: `<p>Default sensitivity in CoD is too high for accurate aim. Setup:</p><ul><li><strong>ADS sensitivity:</strong> 0.8 multiplier (not the 1.0 default). Slower aim down sights = more accurate.</li><li><strong>Hipfire sensitivity:</strong> match your normal mouse/stick speed for fast 360s.</li><li><strong>Field of view (FOV):</strong> 100-110 on PC, 100 on console. Wider FOV = better situational awareness.</li></ul><p>Bronze players use defaults; Silver players tune sensitivity to their hand speed.</p>` },
    ],
    mistakes: ['Random loadouts.','Hot-dropping with 12 squads.','Spraying full-auto at long range.','No slide-cancel — flat-footed.','Looting through Ring 3.','Crosshair at chest height.','Default sensitivity / FOV.','Random killstreak picks.'],
    drill: { heading: 'Drill: 30 min Firing Range recoil control', html: `<p>30 minutes daily in Firing Range. Use the meta AR. Practice tap-firing at distance, full-auto at close, with manual recoil compensation. After 7 days the recoil pattern is automatic.</p><p>Specific routine: 10 min tap-firing at the 50m target (3-shot bursts, count headshots). 10 min full-auto at 25m (mag dump, learn the spray). 10 min tracking moving targets (set bots to "running" difficulty if available).</p><p>Track tracker percentage weekly. By week 2 your aim consistency should jump 10-15%.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> reads your replays and flags positioning + recoil mistakes per match. Useful for spotting whether your tap-fire discipline holds at long range or breaks down under pressure — the distinction between Bronze and Silver-tier aim consistency.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Plat to Diamond', url: '/blog/cod-plat-to-diamond.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'CoD Rebirth Island Guide', url: '/games/cod/rebirth-island.html' },
      { name: 'CoD Verdansk Guide', url: '/games/cod/verdansk.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
  {
    game: 'cod', gameLabel: 'Call of Duty', fromRank: 'Platinum', toRank: 'Diamond',
    slug: 'cod-plat-to-diamond',
    metaTitle: 'How to Climb from Plat to Diamond in Call of Duty (2026 Guide)',
    metaDescription: 'CoD Plat-to-Diamond — loadout drop timing, killstreak management, third-party prevention, end-game crystal positioning, and pro VOD prep.',
    intro: `<p>Plat-to-Diamond in CoD is endgame mastery and killstreak economy. At Plat you have meta loadouts; at Diamond you time loadout drops, manage killstreaks for clutch moments, and read end-game crystal positioning.</p>`,
    sections: [
      { heading: 'Loadout drop timing (Warzone)', html: `<p>Loadout drops are 10K cash and the round-decider. Plat-tier timing:</p><ul><li>Buy at Ring 2 close (~3 minutes in). Have full meta kit before Ring 3.</li><li>Don't buy at Ring 1 — too early, exposes your team to hot drop fights.</li><li>Don't buy at Ring 4 — too late, you're in fight mode.</li><li>If you don't have $10K by Ring 2, scrap looted weapons; the meta kit beats found weapons in 80%+ of fights.</li></ul><p>Plat squads buy on time; Diamond squads time the buy with squad positioning.</p>` },
      { heading: 'Killstreak management (MP)', html: `<p>CoD MP killstreaks chain:</p><ul><li><strong>UAV (4 kills):</strong> use immediately for team intel.</li><li><strong>Counter UAV (5 kills):</strong> use before enemy UAV — denies their intel.</li><li><strong>Cluster Strike (8 kills):</strong> use on contested objective.</li><li><strong>Gunship / VTOL Jet (12 kills):</strong> use for round-deciding push.</li></ul><p>Save killstreaks for the round-deciding moments, not for spam.</p>` },
      { heading: 'Third-party prevention (Warzone)', html: `<p>Diamond Warzone squads minimize third-party exposure:</p><ul><li>After winning a fight, retreat to cover and heal IMMEDIATELY. Don't loot in the open.</li><li>Watch the kill feed for nearby fights → third party incoming in 30 seconds.</li><li>Use smoke grenades to break LOS during reposition.</li><li>If a third party arrives, don't engage — break contact and rotate.</li></ul><p>Plat squads get third-partied 30%+ of fights. Diamond squads <10%.</p>` },
      { heading: 'End-game crystal positioning', html: `<p>End-game in Warzone (Ring 5+) is 3-4 squads remaining. Specifics:</p><ul><li>Take high ground with cover within 10m. Snipe positions on rocks or buildings.</li><li>Don't push first — let other squads contest each other.</li><li>If you have killstreaks left, use Cluster Strike on the contested objective.</li><li>If you don't have streaks, hold position; the team that pushes first usually loses.</li></ul><p>Crystal endgame wins 70%+ of placements for the team that masters it.</p>` },
      { heading: 'Pro-VOD watching as practice', html: `<p>Watch one CDL (Call of Duty League) match per day. Pause every minute. Predict the call. Recommended VODs: CDL Champs, regional finals. Pause-and-predict is the practice method.</p>` },
      { heading: 'Anti-meta swap when needed', html: `<p>If the meta AR is the same on every loadout, swap to a counter:</p><ul><li>If everyone runs MCW → swap to BAS-B at long range. Faster TTK at distance.</li><li>If everyone runs WSP Swarm SMG → swap to RAM-9 for ranged advantage in CQB.</li><li>If a sniper meta is dominant → swap to Suppressed AR + Stim/Smoke.</li></ul><p>Plat plays the meta blindly. Diamond plays the counter-meta when matchups demand it.</p>` },
      { heading: 'Squad coordination in Warzone', html: `<p>Diamond Warzone trios coordinate every fight:</p><ul><li>Designated IGL — calls engage/disengage decisions.</li><li>Designated entry — takes first contact in pushes.</li><li>Designated revive specialist — uses self-revive carefully + drops banners cleanly.</li><li>Voice comm: "I'm entering, follow on the trade." Not "should we push?"</li></ul><p>Plat trios fight as 3 IGLs. Diamond trios have 1 IGL whose calls everyone follows.</p>` },
      { heading: 'Audio cues at high tier', html: `<p>Diamond Warzone players track:</p><ul><li>Helicopter sounds: enemy is using vehicle for rotation.</li><li>Dead silence footstep mute: enemy has the ult, expect a flank.</li><li>Loadout drop sound: enemy buying loadout — they're stopped for 5 seconds.</li><li>Plate-swap sound: enemy reloading armor — push the trade.</li></ul><p>Audio at high tier replaces 50% of visual scanning. Crank it.</p>` },
      { heading: 'Mental game — 30-min match resilience', html: `<p>Warzone matches are 25-30 minutes. Tilt management at Diamond:</p><ul><li>Don't review the lobby kill cam every death — distracts you from the game.</li><li>If your team gets wiped early, focus on placement (Top 10) over kills.</li><li>Save banner/buy decisions for after the cooldown breath.</li></ul><p>Diamond players reset after deaths in <10 seconds. Plat players carry the death feeling for 60+ seconds.</p>` },
    ],
    mistakes: ['Loadout drop too early or too late.','Spamming killstreaks instead of saving for clutch.','Looting in the open after fights.','Pushing first in crystal endgame.','No pro VOD prep.','Always running meta — never countering.','3 IGLs in trio.','Reviewing kill cams too long.'],
    drill: { heading: 'Drill: 5 Warzone games tracking loadout timing', html: `<p>Play 5 Warzone games. For each, note when you bought the loadout and how the timing affected the round. By game 5 you'll have a feel for the optimal buy window for your playstyle.</p><p>Specific tracking sheet: write down (1) when you bought the loadout (Ring 1 / Ring 2 / Ring 3+), (2) whether you survived to Ring 4, (3) whether you got 5+ kills with the loadout. Patterns emerge by game 3.</p><p>Most players find their sweet spot at Ring 2 close. Some aggressive players prefer Ring 1 (riskier but lets them control buy stations). Find your style.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> can compute your loadout-drop timing efficiency across matches.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/cod-bronze-to-silver.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'CoD Rebirth Island Guide', url: '/games/cod/rebirth-island.html' },
      { name: 'CoD Verdansk Guide', url: '/games/cod/verdansk.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
]

// ============================================================================
// CoD GAP POSTS (4)
// ============================================================================
const COD_POSTS_GAPS = [
  {
    game: 'cod',
    gameLabel: 'Call of Duty',
    fromRank: 'Silver',
    toRank: 'Gold',
    slug: 'cod-silver-to-gold',
    metaTitle: 'How to Climb from Silver to Gold in Call of Duty Ranked (2026 Guide)',
    metaDescription: 'CoD Silver-to-Gold — full meta loadout setup, recoil control patterns, slide-cancel movement, audio cues, and SnD-specific positioning fundamentals.',
    intro: `<p>Silver in CoD ranked means you have a meta loadout and basic map awareness. Gold demands consistent recoil control, slide-cancel movement, audio cues, and SnD-specific positioning that wins anchor / entry duels.</p>`,
    sections: [
      { heading: 'Full meta loadout — every attachment matters', html: `<p>Silver players use a meta gun with random attachments. Gold players run the optimized 5-attachment build:</p>
<ul>
  <li><strong>Optic:</strong> standard reticle that fits your eye (avoid red dots that blend with HUD).</li>
  <li><strong>Barrel:</strong> for range / recoil based on map size (long-range AR vs CQB SMG).</li>
  <li><strong>Underbarrel:</strong> grip for recoil control on long sightlines.</li>
  <li><strong>Magazine:</strong> larger mag for SnD anchor positions.</li>
  <li><strong>Stock:</strong> ADS speed adjustment for entry duelists.</li>
</ul>
<p>Builds change per season. Check tier-1 sources (TrueGameData, JGOD) before each season for optimal builds.</p>` },
      { heading: 'Recoil control — pull patterns by gun', html: `<p>Gold-tier recoil control. Specific patterns per S-tier weapon class:</p>
<ul>
  <li><strong>AR:</strong> pulls up + slight left. Counter: pull mouse down, slight right.</li>
  <li><strong>SMG:</strong> pulls up rapidly. Counter: pull mouse down hard, less horizontal compensation.</li>
  <li><strong>LMG:</strong> high vertical recoil after burst 5. Tap-fire at distance.</li>
</ul>
<p>Practice 30 min daily in private match. After 7 days the recoil patterns become muscle memory.</p>` },
      { heading: 'Slide-cancel movement', html: `<p>CoD is movement-heavy. Slide-cancel basics:</p>
<ul>
  <li>Sprint forward → slide (Crouch button) → cancel (Jump or Crouch again).</li>
  <li>Slide-cancel breaks enemy aim tracking.</li>
  <li>Use to enter rooms unpredictably.</li>
  <li>Combine with mantle-jumps for vertical surprise.</li>
</ul>
<p>Silver players run flat-footed. Gold players slide-cancel every entry. The movement is the biggest mid-tier rank gap.</p>` },
      { heading: 'Audio cues — track footsteps, plates, killstreaks', html: `<p>Crank audio at Gold. Specifics:</p>
<ul>
  <li>Footsteps: directional + distance.</li>
  <li>Plate sound: enemy reloading armor — push trade.</li>
  <li>Killstreak announcer: enemy got UAV / Counter UAV — they have intel/denial.</li>
  <li>Door open sound: enemy in/out building.</li>
  <li>Reload sound: enemy is reloading; push for free trade.</li>
</ul>
<p>Crank footstep volume to 100. Wear good headphones. Audio is rank-decisive.</p>` },
      { heading: 'SnD-specific positioning', html: `<p>If you're queueing Search and Destroy (the ranked mode in CoD), positioning matters more than aim. Specifics:</p>
<ul>
  <li><strong>Anchor positions:</strong> hold the back-corner of bombsite with line of sight to entry.</li>
  <li><strong>Entry positions:</strong> commit through smokes, not without.</li>
  <li><strong>Plant spots:</strong> always plant the bomb in cover. The post-plant defense matters.</li>
  <li><strong>Trade-fragger distance:</strong> 5m of the entry, crosshair pre-aimed.</li>
</ul>
<p>Silver SnD players treat each round like Slayer. Gold SnD players play position-first.</p>` },
      { heading: 'Sensitivity setup', html: `<p>CoD default sens is too high for accurate aim. Setup:</p>
<ul>
  <li>ADS sensitivity: 0.8 multiplier of hipfire.</li>
  <li>Hipfire: medium-fast.</li>
  <li>FOV: 100-110 on PC, 100 on console.</li>
</ul>
<p>Silver uses defaults. Gold tunes. Spend a session dialing in.</p>` },
      { heading: 'Pre-aim common angles', html: `<p>CoD MP maps have known peek spots. Specifics on Skidrow, Highrise, Terminal:</p>
<ul>
  <li>Skidrow: pre-aim Apartments doorway, Mid alley window.</li>
  <li>Highrise: pre-aim Helipad cubby, Office spawn corner.</li>
  <li>Terminal: pre-aim Plane stairs, Lobby corner.</li>
</ul>
<p>Pre-aim at head height. Most Silver players walk into rooms with crosshair at the floor.</p>` },
      { heading: 'Trade-fragging discipline', html: `<p>Two-on-one duels win SnD rounds. The trade fragger:</p>
<ul>
  <li>Stays within 5 meters of the entry.</li>
  <li>Has line-of-sight to the entry's target angle.</li>
  <li>Has crosshair pre-aimed at the angle the entry will engage.</li>
  <li>Doesn't reload at the same time the entry's pushing.</li>
</ul>
<p>If your IGL doesn't call trades and your team doesn't trade naturally, you're not in Gold yet. Stack with players who know to trade — soloqueue Silver teaches the wrong habits.</p>` },
      { heading: 'Loadout swaps mid-match', html: `<p>If your starting loadout isn't working, swap. Specifics:</p>
<ul>
  <li>Long-range maps (Highrise, Terminal): switch from SMG to AR if your CQB build isn't landing.</li>
  <li>CQB maps (Skidrow): switch from AR to SMG if you're losing close-range duels.</li>
  <li>If you're getting shotgunned consistently in spawn, swap to a perk that counters Tactical Sprint or wear armor.</li>
</ul>
<p>Silver players bring 1 loadout and stick. Gold players have 3 prepped + swap based on map and momentum.</p>` },
    ],
    mistakes: [
      'Random attachments on meta gun.',
      'Spraying full-auto at long range.',
      'Flat-footed movement (no slide-cancel).',
      'Audio at default volume.',
      'Treating SnD like Slayer.',
      'Default sensitivity / FOV.',
      'Crosshair at chest height.',
      'Trade-fragger too far back.',
      '1 loadout for every map and momentum.',
    ],
    drill: { heading: 'Drill: 30 min recoil + 30 min slide-cancel daily', html: `<p>Daily routine:</p><ul><li>30 min in Firing Range with meta AR — practice recoil pull patterns at 50m+ targets.</li><li>30 min in private match practicing slide-cancel + mantle-jumps.</li></ul><p>After 7 days both become muscle memory. Apply in ranked.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> reads your replays and flags positioning + recoil mistakes per match. Useful for spotting whether your tap-fire discipline holds at long range or breaks down under pressure — the distinction between Silver and Gold-tier aim consistency.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/cod-bronze-to-silver.html' },
      { name: 'How to Climb from Gold to Plat', url: '/blog/cod-gold-to-plat.html' },
      { name: 'CoD Rebirth Island Guide', url: '/games/cod/rebirth-island.html' },
      { name: 'CoD Verdansk Guide', url: '/games/cod/verdansk.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
  {
    game: 'cod',
    gameLabel: 'Call of Duty',
    fromRank: 'Gold',
    toRank: 'Platinum',
    slug: 'cod-gold-to-plat',
    metaTitle: 'How to Climb from Gold to Plat in Call of Duty Ranked (2026 Guide)',
    metaDescription: 'CoD Gold-to-Plat — map-specific positioning, killstreak chain optimization, anti-flank discipline, SnD utility timing, and pro VOD prep.',
    intro: `<p>Gold players have meta loadouts and basic positioning. Plat demands map-specific holds, killstreak chain optimization, anti-flank discipline, and the discipline to play position-first SnD without ego-pushing.</p>`,
    sections: [
      { heading: 'Map-specific positioning by map', html: `<p>Each CoD ranked map has known anchor spots and contested angles. Specifics:</p>
<ul>
  <li><strong>Skidrow:</strong> Apartments balcony anchor, Mid alley AR hold, Side stairs flank-watch.</li>
  <li><strong>Highrise:</strong> Helipad rooftop anchor, Office tower long sightline, Crane corner.</li>
  <li><strong>Terminal:</strong> Plane stairs anchor, Lobby AR hold, Tarmac long sightline.</li>
  <li><strong>Karachi:</strong> Mid alley anchor, A-side window long sightline.</li>
</ul>
<p>Gold players play default spawns. Plat players hold map-specific anchors that pre-aim every common push angle.</p>` },
      { heading: 'Killstreak chain optimization', html: `<p>CoD killstreaks chain across kills. Plat-tier streaks:</p>
<ul>
  <li><strong>UAV (4 kills):</strong> use immediately for team intel.</li>
  <li><strong>Counter UAV (5 kills):</strong> use BEFORE enemy UAV — denies their intel.</li>
  <li><strong>Cluster Strike (8 kills):</strong> use on contested objective.</li>
  <li><strong>Gunship / VTOL (12 kills):</strong> save for round-deciding push.</li>
</ul>
<p>Pick a chain that synergizes (UAV → Counter UAV → Cluster Strike). Gold players pick random streaks; Plat players have a deliberate chain.</p>` },
      { heading: 'Anti-flank discipline — designated rear-watcher', html: `<p>Plat 4-stacks always have a rear-watcher. Specifics:</p>
<ul>
  <li>Front fight: 2-3 players engaged, 1 rear-watching from cover.</li>
  <li>If audio cue from behind, rear-watcher calls "lurker, holding."</li>
  <li>If a teammate dies to flank, refocus team rotation to cover the gap.</li>
</ul>
<p>Gold teams commit 4-deep, get flanked, lose round. Plat teams commit 3-deep with 1 rear-watcher.</p>` },
      { heading: 'SnD utility timing', html: `<p>If you queue ranked SnD, utility timing matters:</p>
<ul>
  <li>Smoke at choke entry on the team count: "smoke in 3, 2, 1."</li>
  <li>Stun grenade through doorway BEFORE entry, not after.</li>
  <li>Frag for clearing standard anchor positions in tight rooms.</li>
</ul>
<p>Synced utility wins SnD rounds at Plat. Gold players throw nades on instinct; Plat players time them.</p>` },
      { heading: 'Audio cues at the higher tier', html: `<p>Plat audio:</p>
<ul>
  <li>Footstep distance: estimate enemy distance to within 5m.</li>
  <li>Plate sounds + reload sounds: free trade kill on the reload window.</li>
  <li>Dead silence ult activation: enemy mute incoming — pre-aim the flank.</li>
  <li>Door open / close: building entry signal.</li>
</ul>
<p>Plat players track 4-5 audio signals simultaneously. Gold tracks 1-2.</p>` },
      { heading: 'Pro VOD watching as practice', html: `<p>Watch one CDL match per day. Pause every minute. Predict the call. By VOD 30 you'll absorb pro-tier macro: anchor positions, killstreak timings, smoke usage.</p>
<p>Recommended VODs: CDL Champs, regional finals.</p>` },
      { heading: 'Comp role designation in 4-stacks', html: `<p>Plat 4-stacks designate roles:</p>
<ul>
  <li><strong>IGL:</strong> calls engage / disengage.</li>
  <li><strong>Slayer (entry):</strong> takes first contact.</li>
  <li><strong>Anchor:</strong> holds map-specific anchor angle.</li>
  <li><strong>Support / utility:</strong> smokes + utility timing.</li>
</ul>
<p>Gold teams play 4 solo. Plat teams have 1 IGL whose calls everyone follows.</p>` },
      { heading: 'Spawn awareness in CoD MP', html: `<p>CoD MP has spawn flips that change game flow. Plat players track:</p>
<ul>
  <li>Killing 3 enemies near their spawn flips them to the opposite spawn.</li>
  <li>If your team is dying to back-shots, spawns just flipped — reposition immediately.</li>
  <li>Use spawn-flip awareness for objective modes (Hardpoint rotation, Domination flag swaps).</li>
</ul>
<p>Gold players ignore spawns. Plat players read them every 30 seconds.</p>` },
      { heading: 'Mental game and tilt management', html: `<p>CoD ranked matches are 30+ minutes. Tilt-stacking 3 losses is the Gold plateau killer:</p>
<ul>
  <li>60-second mental reset between matches.</li>
  <li>If you tilt-stack 3, stop for 30 minutes.</li>
  <li>Don't blame teammates in voice — Plat teams solve, Gold teams blame.</li>
  <li>Track session win rate. Below 45%, end session — your performance compounds badly past that point.</li>
</ul>
<p>Plat teams have tilt protocols. Gold teams grind through tilt and lose more matches per hour. The 30-minute break to walk + hydrate is worth more than the 30 minutes of tilted ranked you'd have played.</p>` },
      { heading: 'Sensitivity and FOV optimization', html: `<p>Plat players tune sensitivity beyond Gold's defaults:</p>
<ul>
  <li>800-1600 DPI is standard.</li>
  <li>Sensitivity in cm/360°: 25-40cm for AR, 20-30cm for sniper.</li>
  <li>FOV: 105+ on PC, 100 on console.</li>
</ul>
<p>If you're using defaults, dial in over a week. The mechanical edge compounds.</p>` },
    ],
    mistakes: [
      'Default spawns instead of map-specific anchors.',
      'Random killstreak picks (no chain).',
      'No designated rear-watcher.',
      'Utility thrown on instinct, not on synced count.',
      'Audio at default volume.',
      'No pro VOD prep.',
      'No role designation in 4-stack.',
      'No spawn-flip awareness.',
      'Tilt-stacking matches.',
    ],
    drill: { heading: 'Drill: 5-game role-designated stack', html: `<p>If you queue with a 4-stack, designate roles pre-match. Play 5 games role-locked. Track win rate.</p><p>By game 5 the role coordination is automatic. The IGL discipline is the conversion lever for ranked SnD.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> tracks anchor position win rates per map. Useful for spotting which maps have your worst hold percentages so you can study CDL pro positioning specifically for those maps.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/cod-silver-to-gold.html' },
      { name: 'How to Climb from Plat to Diamond', url: '/blog/cod-plat-to-diamond.html' },
      { name: 'CoD Rebirth Island Guide', url: '/games/cod/rebirth-island.html' },
      { name: 'CoD Verdansk Guide', url: '/games/cod/verdansk.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 10,
  },
  {
    game: 'cod',
    gameLabel: 'Call of Duty',
    fromRank: 'Diamond',
    toRank: 'Iridescent',
    slug: 'cod-diamond-to-iri',
    metaTitle: 'How to Climb from Diamond to Iridescent in CoD Ranked (2026 Guide)',
    metaDescription: 'CoD Diamond-to-Iridescent — pro-tier macro round patterns, lobby-by-lobby reads, killstreak banking, mental game, and CDL-tier comm discipline.',
    intro: `<p>Diamond is high-elo in CoD ranked. Iridescent is top 1%. The gap is macro round patterns, lobby-by-lobby opponent reads, killstreak banking for round-decider moments, and CDL-tier comm discipline that converts close losses into wins.</p>`,
    sections: [
      { heading: 'Pro-tier macro round patterns', html: `<p>Iridescent teams script the match across 11-round games:</p>
<ul>
  <li>Rounds 1-3: probe enemy comp + anchor patterns.</li>
  <li>Rounds 4-6: counter-strat based on probe data.</li>
  <li>Rounds 7+: lock in winning pattern, save killstreaks for match-deciding rounds.</li>
</ul>
<p>Diamond teams play round-to-round. Iridescent teams play match-to-match. The 11-round vision is what wins close matches.</p>` },
      { heading: 'Lobby-by-lobby opponent reads', html: `<p>By round 3 you should have read at least 3 enemy patterns:</p>
<ul>
  <li>Their AWP/sniper main's preferred angle.</li>
  <li>Their entry fragger's typical push direction.</li>
  <li>Their utility commit timing (do they smoke first or flash first?).</li>
  <li>Their bomb plant location preference (covered vs open).</li>
</ul>
<p>Iridescent IGLs build mental models of enemy tendencies + call counter-plays. Diamond IGLs play their own game without tracking.</p>` },
      { heading: 'Killstreak banking — save for clutch moments', html: `<p>Iridescent teams bank killstreaks for round-deciding moments:</p>
<ul>
  <li>If you're 3-0 ahead, save streaks for the closeout round.</li>
  <li>If you're 1-3 behind, use streaks to reset momentum.</li>
  <li>If round 11 is overtime, full team commits all streaks.</li>
</ul>
<p>Diamond players spam streaks the moment they're available. Iridescent players bank for the round that decides the match.</p>` },
      { heading: 'Mechanical aim consistency', html: `<p>Iridescent aim benchmarks:</p>
<ul>
  <li>AR headshot rate: 25%+ at all engagement ranges.</li>
  <li>SMG headshot rate: 30%+ in CQB.</li>
  <li>Sniper one-shot accuracy: 50%+ in ranked SnD.</li>
</ul>
<p>Daily aim regimen: 60 min in Firing Range + private match. Track headshot rate weekly. If you're stuck below benchmarks, fix sensitivity or technique.</p>` },
      { heading: 'CDL-tier comm discipline', html: `<p>Iridescent comms are short:</p>
<ul>
  <li>"Pushing on smoke, 3, 2, 1."</li>
  <li>"Their AWP heaven, save."</li>
  <li>"UAV up, push their flank."</li>
  <li>"Bomb planted, defend long."</li>
</ul>
<p>NOT commentary. Information only. Comm discipline is what separates Iridescent teams from Diamond teams that frag equally well.</p>` },
      { heading: 'Mental game — between rounds', html: `<p>Iridescent ranked matches are 30+ minutes. Tilt-stacking 3 losses is the Diamond plateau killer:</p>
<ul>
  <li>30-second box breath between rounds.</li>
  <li>If you tilt-stack 3, end the session.</li>
  <li>Don't blame teammates — Iridescent teams solve, Diamond teams blame.</li>
</ul>
<p>Diamond+ teams have tilt protocols. Diamond teams without protocols stay Diamond.</p>` },
      { heading: 'Pro VOD library at scale', html: `<p>By Iridescent you should have absorbed 60+ specific CDL patterns. Watch one match per day for 90 days. By day 90:</p>
<ul>
  <li>You auto-recognize pro setups for major SnD maps.</li>
  <li>You predict killstreak chains 5+ seconds before they fire.</li>
  <li>You read smoke + flash timings by matching pro patterns.</li>
</ul>
<p>Recommended VODs: CDL Champs, regional finals.</p>` },
      { heading: 'Sensitivity and FOV optimization', html: `<p>Iridescent players tune sensitivity to body type and hand speed:</p>
<ul>
  <li>800-2400 DPI is standard.</li>
  <li>Sensitivity in cm/360°: 25-40cm for AR, 20-30cm for sniper.</li>
  <li>FOV: 105+ on PC, 100 on console.</li>
  <li>Crosshair: bright color (cyan, yellow). Avoid red.</li>
</ul>
<p>If you're using default settings at this tier, you're playing at a mechanical disadvantage. Spend a week dialing in.</p>` },
      { heading: 'Veto strategy for ranked queue', html: `<p>By Iridescent you should have win-rate data per map. Specific veto pattern:</p>
<ul>
  <li>Toggle off your bottom 2-3 maps in queue settings.</li>
  <li>Track win rate weekly per map.</li>
  <li>Focus practice on top 4 strongest maps.</li>
</ul>
<p>The veto compounds across a season. Iridescent players who veto strategically gain 30%+ more rank per session than those who play all maps.</p>` },
      { heading: 'Tilt protocols at the high-pressure rounds', html: `<p>Round 7+ in 11-round SnD is where matches are decided. Specific protocols:</p>
<ul>
  <li>Between rounds, 4-second box breath. Heart rate from 95+ BPM (tilted) to 70 BPM (focused).</li>
  <li>If you lose 2 in a row, IGL calls "default round" — fundamentals only.</li>
  <li>If you lose 3 in a row, IGL calls a player swap if anyone's tilting visibly.</li>
</ul>
<p>Iridescent teams have these protocols. Diamond teams tilt-stack into 6-round losing streaks.</p>` },
    ],
    mistakes: [
      'Round-to-round play instead of match-to-match macro.',
      'No lobby-by-lobby opponent reads.',
      'Streaks spammed instead of banked.',
      'Aim ceiling at Diamond benchmarks.',
      'Comm-overload.',
      'Tilt-stacking matches.',
      'Pro VOD library at 20 patterns, not 60+.',
      'Default sensitivity / FOV.',
      'No queue veto.',
    ],
    drill: { heading: 'Drill: 90-day CDL-VOD-per-day + aim regimen', html: `<p>90 days of 60 min daily aim + 1 CDL match per day. By day 90 you have a 60+ pattern library AND your aim is at Iridescent benchmarks.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> compares your decision patterns against CDL-tier reads. Useful for finding the rounds where your killstreak banking decision was wrong (used too early or saved too late) — the exact macro pattern that separates Diamond plateau from Iridescent climb.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Plat to Diamond', url: '/blog/cod-plat-to-diamond.html' },
      { name: 'How to Climb from Iridescent to Top 250', url: '/blog/cod-iri-to-top250.html' },
      { name: 'CoD Rebirth Island Guide', url: '/games/cod/rebirth-island.html' },
      { name: 'CoD Verdansk Guide', url: '/games/cod/verdansk.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 11,
  },
  {
    game: 'cod',
    gameLabel: 'Call of Duty',
    fromRank: 'Iridescent',
    toRank: 'Top 250',
    slug: 'cod-iri-to-top250',
    metaTitle: 'How to Climb from Iridescent to Top 250 in CoD Ranked (2026 Guide)',
    metaDescription: 'CoD Iridescent-to-Top 250 — top-tier mental game, mechanical aim consistency at the ceiling, CDL-tier macro patterns, sensitivity optimization, and queue veto.',
    intro: `<p>Iridescent is top 1% of CoD ranked. Top 250 is top 0.05% globally. The gap is mental discipline at the high-pressure rounds, mechanical aim at the absolute ceiling, and CDL-tier macro patterns absorbed from 90+ days of pro VOD review.</p>`,
    sections: [
      { heading: 'Top-0.05% mental discipline', html: `<p>Top 250 matches are 30+ minutes of high-pressure decisions. Mental discipline:</p>
<ul>
  <li>2-second mental reset between deaths. Same crosshair, same default position.</li>
  <li>If you tilt-stack 2 losses, stop session. Don't grind through tilt at this elo.</li>
  <li>Don't blame teammates — Top 250 teams solve, Iridescent teams blame.</li>
  <li>Track session win rate. Below 55%, end session.</li>
</ul>
<p>The reset discipline is what separates Top 250 consistency from Iridescent volatility. Most plateaued Iridescent players have the mechanics but lose 4-round streaks to mental tilt.</p>` },
      { heading: 'Top-tier aim benchmarks', html: `<p>Specific aim benchmarks per weapon class:</p>
<ul>
  <li>AR: 28%+ headshot rate at all ranges.</li>
  <li>SMG: 32%+ headshot rate in CQB.</li>
  <li>Sniper: 60%+ one-shot accuracy in ranked SnD.</li>
  <li>Pistol: 25%+ headshot rate (clutch scenarios).</li>
</ul>
<p>Daily aim regimen: 90 min in Firing Range + private match. Track weekly. If you're stuck below benchmarks, fix sensitivity or technique before chasing macro.</p>` },
      { heading: 'CDL-tier macro at scale', html: `<p>By Top 250 you should have absorbed 100+ specific CDL patterns. Watch one match per day for 90 days. By day 90:</p>
<ul>
  <li>You auto-recognize pro anchor setups by map.</li>
  <li>You predict killstreak chains 5+ seconds before they fire.</li>
  <li>You read smoke + flash timings perfectly.</li>
  <li>You know which weapon matchups counter which.</li>
</ul>
<p>Recommended VODs: CDL Champs, regional finals from past 2 years.</p>` },
      { heading: 'Sensitivity and FOV optimization', html: `<p>Top 250 players tune sensitivity to body type and hand speed:</p>
<ul>
  <li>800-2400 DPI is standard. Higher DPI = faster flicks, less precision.</li>
  <li>Sensitivity in cm/360°: 25-40cm for AR, 20-30cm for sniper.</li>
  <li>FOV: 105+ on PC.</li>
  <li>Crosshair: bright cyan or yellow.</li>
</ul>
<p>If you're using default settings at this tier, you're playing at a mechanical disadvantage. Spend a week dialing in.</p>` },
      { heading: 'Queue veto and matchmaking macro', html: `<p>Top 250 queues: top 4 maps prepped + bottom 2 banned. Veto wins matches before round 1.</p>
<ul>
  <li>Toggle off your bottom 2 maps.</li>
  <li>Track win rate weekly.</li>
  <li>Focus practice on top 4 strongest maps.</li>
</ul>
<p>The veto edge compounds across a season. Iridescent players who veto strategically gain 30%+ more rank per session.</p>` },
      { heading: 'Comm discipline at high-pressure rounds', html: `<p>Top 250 comms are short and decisive:</p>
<ul>
  <li>"Pushing on count, 3, 2, 1."</li>
  <li>"AWP heaven, save."</li>
  <li>"Their UAV up, hold cover."</li>
  <li>"Bomb planted, defend long."</li>
</ul>
<p>NOT commentary. Information only — what changes a teammate's decision.</p>` },
      { heading: 'Tilt protocols at high-pressure rounds', html: `<p>Round 8+ in 11-round SnD is where matches are decided. Specific protocols:</p>
<ul>
  <li>Between rounds, 4-second box breath. Heart rate from 95+ BPM to 70 BPM.</li>
  <li>If you lose 2 rounds in a row, IGL calls "default round" — fundamentals only.</li>
  <li>If you lose 3 in a row, IGL calls a player swap if anyone's tilting.</li>
</ul>
<p>Top 250 teams have these protocols. Iridescent teams tilt-stack into 6-round losing streaks.</p>` },
      { heading: 'Reading enemy comp + counter-strats', html: `<p>By round 5 you should have read at least 3 enemy patterns:</p>
<ul>
  <li>Their AWP main's preferred angle.</li>
  <li>Their entry fragger's typical commit timing.</li>
  <li>Their utility commit patterns (smoke first vs flash first).</li>
  <li>Their bomb plant location preferences.</li>
</ul>
<p>Top 250 IGLs build mental models of enemy tendencies and call counter-plays. Iridescent IGLs play their own game without tracking opponents across rounds.</p>` },
      { heading: 'Match macro across full ranked games', html: `<p>Top 250 teams script the full match across 11 rounds:</p>
<ul>
  <li>Rounds 1-3: probe enemy setups.</li>
  <li>Rounds 4-6: counter-strat.</li>
  <li>Rounds 7-9: lock in winning pattern.</li>
  <li>Rounds 10-11: closeout, save killstreaks for clutch.</li>
</ul>
<p>Iridescent teams play round-to-round. Top 250 teams play match-to-match with the script in mind.</p>` },
    ],
    mistakes: [
      'Tilt-stacking matches.',
      'Aim ceiling at Iridescent benchmarks instead of Top 250.',
      'Pro VOD library at 50 patterns, not 100+.',
      'Comm-overload.',
      'Default sensitivity / FOV.',
      'No queue veto.',
      'No tilt protocol for round 8+.',
      'No round-by-round opponent tracking.',
      'Round-to-round play instead of match-to-match macro.',
    ],
    drill: { heading: 'Drill: 90-day CDL pro VOD library + aim regimen', html: `<p>90 days of 90 min daily aim + 1 CDL match per day. By day 90 you have a 100-pattern library AND your aim is at Top 250 benchmarks. Track weekly: headshot rate per weapon, K/D, ADR.</p>` },
    aiVodMention: `<p>At Top 250 the gaps are subtle. <a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> compares your decision patterns against CDL-tier reads round-by-round. Useful for finding the rounds where you knew the right call but committed to the wrong one — the exact pattern separating Iridescent plateau from Top 250 ceiling.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Diamond to Iridescent', url: '/blog/cod-diamond-to-iri.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'CoD Rebirth Island Guide', url: '/games/cod/rebirth-island.html' },
      { name: 'CoD Verdansk Guide', url: '/games/cod/verdansk.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 11,
  },
]

// ============================================================================
// FORTNITE POSTS (2)
// ============================================================================
const FN_POSTS = [
  {
    game: 'fn', gameLabel: 'Fortnite Zero Build', fromRank: 'Bronze', toRank: 'Silver',
    slug: 'fn-bronze-to-silver',
    metaTitle: 'How to Climb from Bronze to Silver in Fortnite Zero Build (2026 Guide)',
    metaDescription: 'Fortnite Zero Build Bronze-to-Silver — drop spot strategy, loot priority, healing rotation, mobility item usage, and zone awareness.',
    intro: `<p>Bronze in Fortnite Zero Build is foundation tier. Most Bronze players hot-drop into death zones, hoard heals, and ignore zone rotations. The Bronze-to-Silver climb is drop discipline, healing rotation, and zone reads. This guide walks through the four-week practice plan that Silver-tier players have already absorbed: edge-drop pattern, loot priority, mobility item usage, and the audio cues that make every fight predictable.</p>`,
    sections: [
      { heading: 'Edge-drop instead of hot-drop', html: `<p>Hot-dropping at Bronze loses 80% of games. The fix: edge-drop, loot, then push.</p><ul><li>Land at named POIs but in edge buildings (corners of the POI, not the center).</li><li>Loot full kit: shotgun + AR + sniper + 2 heal items + 1 mobility.</li><li>Push contested zones AFTER most teams have died (around 5-min mark).</li></ul><p>The 30-second loot window of an edge drop wins more games than fragging at the contested center.</p>` },
      { heading: 'Loot priority — shotgun + AR + heals', html: `<p>Bronze players grab the first weapon they see. The order:</p><ol><li><strong>Shotgun (Hammer Pump or Frenzy):</strong> CQB damage, 200 hp burst.</li><li><strong>AR (Striker or Tactical):</strong> mid-range damage.</li><li><strong>Heals:</strong> at least 2 Med Kits or 4 Bandages.</li><li><strong>Sniper / DMR (optional):</strong> long-range threat.</li><li><strong>Mobility item:</strong> Crash Pad, Launch Pad, Shockwave.</li></ol><p>Without shotgun + heals, you can't take fights. With them, you survive 1v1s.</p>` },
      { heading: 'Healing rotation discipline', html: `<p>Fortnite heals are sequenced:</p><ul><li><strong>Mini Shield (lower priority):</strong> use for fast partial shield.</li><li><strong>Big Shield Pot:</strong> use to top up to full shields.</li><li><strong>Med Kit:</strong> full health regen, 10 seconds slow heal.</li><li><strong>Chug Splash:</strong> instant team heal during fights.</li></ul><p>Use Mini Shields first to top up partial shields, save Big Pots for full restore. Heal in cover, never in the open.</p>` },
      { heading: 'Mobility item usage', html: `<p>Mobility items break engagements:</p><ul><li><strong>Crash Pad:</strong> bounce up high. Use for retreat or surprise high-ground take.</li><li><strong>Launch Pad:</strong> long-range rotation. Use for zone repositioning.</li><li><strong>Shockwave Grenade:</strong> instant escape from a fight you're losing.</li><li><strong>Boogie Bomb:</strong> disable enemy for 5 seconds — round-winning.</li></ul><p>Bronze players save mobility items "for emergencies" and never use them. Silver players use them in every fight.</p>` },
      { heading: 'Zone awareness', html: `<p>Fortnite zone phases:</p><ul><li>Ring 1 (5 min): loot.</li><li>Ring 2 (3 min): rotate to zone center.</li><li>Ring 3-4 (2 min each): commit to defensible terrain.</li><li>Final ring: high ground + cover.</li></ul><p>Bronze runs zone damage; Silver pre-rotates by Ring 2.</p>` },
      { heading: 'Crosshair placement and pre-aim', html: `<p>Universal FPS fundamental: crosshair at head height. Walk through every POI with crosshair pre-aimed at the standard fight angles. Most Bronze players aim at the floor and miss free kills.</p>` },
      { heading: 'Squad coordination in trio queue', html: `<p>If you queue trios in Zero Build, coordinate basic tactics:</p><ul><li>Designate roles — 1 IGL caller, 1 fragger, 1 support.</li><li>Drop together — split-drops lose 70% of fights.</li><li>Heal together — Chug Splash heals all 3 in radius. Use it.</li><li>Voice calls: "Pushing together, 3, 2, 1." Not "should we push?"</li></ul><p>Bronze trios are 3 solo players. Silver trios coordinate basic engages.</p>` },
      { heading: 'Audio cues — footsteps and reload sounds', html: `<p>Fortnite Zero Build audio:</p><ul><li>Footsteps: directional + distance.</li><li>Healing sound: enemy is mid-heal for 3-10s. Push for the kill.</li><li>Reload sound: enemy is reloading. Push the trade.</li><li>Storm closing sound: zone damage starting; rotate now.</li></ul><p>Crank footstep volume. Wear good headphones.</p>` },
      { heading: 'Sensitivity and FOV setup', html: `<p>Fortnite Zero Build benefits from tuned settings:</p><ul><li><strong>ADS sensitivity:</strong> 0.8x multiplier of hipfire. Slower ADS = more accurate snipes.</li><li><strong>Hipfire sensitivity:</strong> medium-fast (test in Creative).</li><li><strong>FOV:</strong> 100+ on PC. Wider = better awareness.</li><li><strong>Crosshair color:</strong> bright cyan or yellow. Avoid red (blends with names).</li></ul><p>Bronze players use defaults; Silver players tune.</p>` },
    ],
    mistakes: ['Hot-dropping into hot zones.','Looting random weapons — no loadout priority.','Healing in the open.','Saving mobility items "for later."','Running zone damage.','Crosshair at chest height.','3 IGLs in trio.','Default sensitivity / FOV.'],
    drill: { heading: 'Drill: 10 games of edge-drop discipline', html: `<p>10 ranked games. Each game, edge-drop a different POI. Track how many full-loot 1v1s you survive. By game 10 your loot priority is automatic.</p><p>Specific pattern: ranked game 1, edge-drop a low-contest POI like Magic Mosses or Hidden Hollow. Game 2, edge-drop Foxy Floodgate. Game 3, edge-drop Open-Air Onsen. Each game, focus on the loot sequence (shotgun → AR → 2 heals → mobility) before pushing any contested zone.</p><p>By game 10, you've trained drop discipline + loot priority + 1v1 survival simultaneously. The compound effect is rank-decisive.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> reads your replays and flags positioning + healing-timing mistakes per match. Particularly useful for catching the rounds where you healed in the open and got punished — the most common Bronze-tier death pattern in Zero Build.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Plat to Diamond', url: '/blog/fn-plat-to-diamond.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Fortnite Map Guide', url: '/games/fn/current-chapter.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 7,
  },
  {
    game: 'fn', gameLabel: 'Fortnite Zero Build', fromRank: 'Platinum', toRank: 'Diamond',
    slug: 'fn-plat-to-diamond',
    metaTitle: 'How to Climb from Platinum to Diamond in Fortnite Zero Build (2026 Guide)',
    metaDescription: 'Fortnite Zero Build Plat-to-Diamond — endgame positioning, mobility chain rotations, anti-flank reads, loot loadout priorities, and pro VOD prep.',
    intro: `<p>Plat-to-Diamond in Fortnite Zero Build is endgame mastery. At Plat you have movement and looting; at Diamond you control endgame positioning, chain mobility items for rotations, and read flanks. The leap is converting individual mechanics into squad-coordinated late-game decisions where most matches are won or lost.</p>`,
    sections: [
      { heading: 'Endgame positioning — high ground + cover', html: `<p>By Ring 4, the zone has 4-5 squads. The team holding high ground with cover wins. Specifics:</p><ul><li>Take a ridge or building roof — height advantage forces enemies uphill.</li><li>Have at least one cover object (rock, tree) within 5m for disengage.</li><li>If zone closes onto a flat, use Crash Pad / Launch Pad to claim high ground first.</li></ul><p>Plat squads fight on flat. Diamond squads take elevation 60+ seconds before zone forces.</p>` },
      { heading: 'Mobility chain rotations', html: `<p>Diamond squads chain mobility items for fast cross-map rotations:</p><ul><li>Crash Pad → Launch Pad → free 200m rotation in 5 seconds.</li><li>Shockwave Grenade → land safely from height — escape engagements.</li><li>Boogie Bomb in clutch 1v1: disables enemy for 5s, free kill.</li></ul><p>Plat saves mobility "for emergencies." Diamond uses them as the standard rotation method.</p>` },
      { heading: 'Anti-flank reads', html: `<p>Diamond enemies will lurker-flank. Reads:</p><ul><li>If a fight has 2 visible enemies, the 3rd is flanking.</li><li>Audio cue from behind = lurker. Reposition immediately.</li><li>Watch the kill feed for nearby fights — third squad arriving in 30s.</li></ul><p>Plat squads get flanked 30%+ of fights. Diamond squads <10%.</p>` },
      { heading: 'Loot loadout priorities', html: `<p>Diamond loadouts are optimized:</p><ul><li><strong>Hammer Pump Shotgun</strong> (S-tier CQB).</li><li><strong>Striker AR</strong> (S-tier mid-range).</li><li><strong>Heisted Sniper</strong> (S-tier long-range).</li><li><strong>2 Big Shield Pots + 1 Med Kit + 1 Chug Splash.</strong></li><li><strong>1 Mobility item (Crash Pad or Launch Pad).</strong></li></ul><p>If you don't have this loadout by Ring 3, swap into it from looted players. Plat plays with random loadouts; Diamond optimizes.</p>` },
      { heading: 'Pro-VOD watching as practice', html: `<p>Watch one Fortnite Zero Build pro tournament match per day. Pause every minute. Predict the call. By VOD 30 you'll absorb pro-tier endgame positioning patterns.</p><p>Recommended VODs: FNCS Zero Build finals.</p>` },
      { heading: 'Crystal endgame — final 2-3 squads', html: `<p>Crystal endgame: 2-3 squads, ring closing fast. Specifics:</p><ul><li>Don't push first — let others contest.</li><li>If you have a sniper, hold high ground for picks.</li><li>If you have shockwave + Boogie Bomb, save for the final 1v1.</li><li>The team landing the first knock in crystal endgame wins 70%+.</li></ul><p>Crystal endgame is the Diamond finishing skill.</p>` },
      { heading: 'Loadout management mid-match', html: `<p>Diamond squads optimize loadouts as the match progresses:</p><ul><li>By Ring 2, every player has S-tier shotgun + AR + sniper.</li><li>If a teammate dies, salvage their kit if better than yours.</li><li>Carry only 1 mobility item; don't waste slot.</li><li>2 Big Shield Pots in inventory minimum at all times.</li></ul><p>Plat players keep whatever loot they grabbed. Diamond players actively swap up to optimal loadouts.</p>` },
      { heading: 'Mental game and tilt management', html: `<p>Fortnite matches are 20+ minutes. One bad rotation can lose the game. Tilt management:</p><ul><li>60-second mental reset between matches.</li><li>If you tilt-stack 3 losses, stop for 30 minutes.</li><li>Don't blame teammates in voice — kills team morale + own focus.</li><li>Track session win rate. If <40%, end session.</li></ul><p>Diamond players reset; Plat players grind through tilt.</p>` },
      { heading: 'Pro player habits — common patterns', html: `<p>Pro Zero Build players share habits:</p><ul><li>Always full heal between fights, even if it costs 10 seconds of looting.</li><li>Always carry a sniper for endgame, even on close-range builds.</li><li>Mobility items used proactively, not reserved for emergencies.</li><li>Pre-aim every corner at head height.</li></ul><p>Mimic these patterns. Pro habits at Diamond is the bridge to Elite.</p>` },
    ],
    mistakes: ['Fighting on flat in Ring 4.','Saving mobility items unused.','Ignoring lurker audio cues.','Random loot loadouts.','Pushing first in crystal endgame.','No pro VOD prep.','No loadout swap as match progresses.','Tilt-stacking losses.'],
    drill: { heading: 'Drill: 5 ranked games tracking Ring 4+ positioning', html: `<p>5 ranked games. For each, focus on Ring 4 high-ground take. By game 5 you'll auto-position before zone closes.</p><p>Specific pattern: at Ring 3 close, identify the next zone center on the map. Plan the high-ground spot in that zone. Use mobility items (Crash Pad / Launch Pad) to claim it 60+ seconds before zone forces.</p><p>Track your Ring 4+ survival rate. If you're being eliminated before final ring 80%+ of games, fix positioning before chasing aim improvements.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon+ AI VOD review</a> can flag rounds where your endgame positioning broke down. Useful for finding the specific Ring 4 decisions that lost you the game — high-ground neglect, mobility item hoarding, or pushing first into crystal endgame are common Plat-tier patterns the review surfaces.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/fn-bronze-to-silver.html' },
      { name: 'Recon+ Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Fortnite Map Guide', url: '/games/fn/current-chapter.html' },
      { name: 'Recon+ Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
]

// ---------- MAIN ----------

function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  // Stage 5: all 10 games. R6 (7) + CS2 (7) + Valorant (7) + OW2 (4) + Apex (3) + MVR (3) + Halo (3) + Finals (2) + CoD (2) + Fortnite (2) = 40 posts.
  const allPosts = [...R6_POSTS, ...CS2_POSTS, ...VALORANT_POSTS, ...OW2_POSTS, ...OW2_POSTS_HIGH, ...APEX_POSTS, ...APEX_POSTS_HIGH, ...MVR_POSTS, ...MVR_POSTS_HIGH, ...HALO_POSTS, ...HALO_POSTS_HIGH, ...FINALS_POSTS, ...FINALS_POSTS_GAPS, ...COD_POSTS, ...COD_POSTS_GAPS, ...FN_POSTS]

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

export { R6_POSTS, CS2_POSTS, VALORANT_POSTS, OW2_POSTS, OW2_POSTS_HIGH, APEX_POSTS, APEX_POSTS_HIGH, MVR_POSTS, MVR_POSTS_HIGH, HALO_POSTS, HALO_POSTS_HIGH, FINALS_POSTS, FINALS_POSTS_GAPS, COD_POSTS, COD_POSTS_GAPS, FN_POSTS, htmlShell, renderPost, renderIndex }
