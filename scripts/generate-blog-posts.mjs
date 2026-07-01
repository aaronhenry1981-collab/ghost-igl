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
  <meta property="og:site_name" content="Recon 6" />
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
    <p>&copy; Recon 6 — coaching across 20 competitive games. <a href="${SITE_URL}/">r6coaching.com</a></p>
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
  // Y11S2 seasonal coverage — shipped May 21, 2026 (12 days ahead of the
  // June 2 launch) to seed Google indexing before the search wave hits.
  // The from/to rank fields are repurposed as season transitions; the
  // metaTitle and intro frame this as a season preview not a rank guide.
  {
    game: 'r6',
    gameLabel: 'Rainbow Six Siege',
    fromRank: 'Y11S1',
    toRank: 'Y11S2',
    slug: 'r6-y11s2-system-override-guide',
    metaTitle: 'R6 Y11S2 Operation System Override — Calypso Casino, Dokkaebi Remaster, Ranked 3.0 (2026)',
    metaDescription: 'Complete guide to Rainbow Six Siege Y11S2 Operation System Override. New Calypso Casino map, Dokkaebi Jegeo Payload rework, XK23 Assault Rifle, Pulse/Mozzie/Gridlock buffs, and Ranked 3.0 system overhaul. Released June 2, 2026.',
    intro: `<p>Y11S2 Operation System Override drops to live ranked on June 2, 2026 — Test Server is live now. Headline changes: a new <strong>Calypso Casino</strong> map (Vegas-inspired, ranked from day one), a full <strong>Dokkaebi remaster</strong> trading her Logic Bomb for the targeted Jegeo Payload, a brand-new XK23 Assault Rifle, significant Pulse / Mozzie / Gridlock buffs, and the Ranked 3.0 system overhaul (no more hidden MMR). Here's everything that's changing and how it shifts the meta.</p>`,
    sections: [
      {
        heading: 'Calypso Casino — the new ranked map',
        html: `<p>Calypso Casino is the first all-new map of Year 11 and lands in the ranked pool immediately on June 2. Ubisoft built it from the ground up for competitive Siege but pulled inspiration from the original Rainbow Six Vegas setting.</p>
<p><strong>Confirmed map features:</strong></p>
<ul>
  <li><strong>Rooftop crane access</strong> — new vertical entry point for attackers, comparable to Skyscraper's rooftop hatches but with movement utility built in</li>
  <li><strong>Basement spawn</strong> — defenders spawning in basement, attackers can scale the casino façade</li>
  <li><strong>Expanded drone vent network</strong> — more pre-round intel paths than any current ranked map</li>
  <li><strong>Atrium</strong> as the central vertical sightline</li>
  <li><strong>Aquarium</strong> as a key rotational corridor</li>
</ul>
<p><strong>Likely bomb site combos</strong> (Ubisoft hasn't officially confirmed pairings):</p>
<ul>
  <li>2F VIP Lounge / Cash Room</li>
  <li>1F Casino Floor / Keno Room</li>
  <li>1F Main Lobby / Mezzanine</li>
  <li>B Vault / Security Room</li>
</ul>
<p><strong>Day-one meta read:</strong> the expanded drone vent network means droning will be more powerful than usual on this map — Twitch and IQ pick rates will jump. The rooftop crane is the new spawn-peek concern for defenders: expect a Nomad or Gridlock to airjab/Trax the crane zip-line every round in week one.</p>`,
      },
      {
        heading: 'Dokkaebi — Jegeo Payload remaster',
        html: `<p>Dokkaebi's Logic Bomb is gone. Her new gadget is <strong>Jegeo Payload</strong> — a targeted attack that fundamentally changes how she's used.</p>
<p><strong>How it works:</strong></p>
<ul>
  <li>Dokkaebi <strong>targets one specific defender per call</strong> using a Deimos-style tracker</li>
  <li>The targeted defender's phone rings with an "urgent, angry" ringtone — they have a brief window to relocate</li>
  <li>If they don't move, their phone <strong>explodes for ~40 HP direct damage + fire damage</strong> in the surrounding area (catches nearby teammates)</li>
  <li>The defender is then <strong>locked out of observation tools</strong> (cameras, sensors) AND any phone-controlled gadget</li>
</ul>
<p><strong>Operators directly disabled by a successful Jegeo Payload:</strong> Maestro (Evil Eyes), Echo (Yokai drones), Mozzie (Pests), Fenrir (F-NATT dread mines), Skopós (rope-cam ability). Anchoring with any of these is now genuinely risky.</p>
<p><strong>Charge count + cooldown:</strong> more charges than old Logic Bomb, faster cooldown — but single-target focus, so the area-denial pressure shifts to "who's the priority kill" rather than "everyone reveal."</p>
<p><strong>Meta impact:</strong> Dokkaebi goes from situational (anti-camera intel) to a hard counter against any phone-gadget defender comp. Expect her ban rate to spike against teams that habitually run Maestro/Echo. She becomes a near-mandatory pick on Bank, Clubhouse, and Kafe where Maestro and Echo are common anchors.</p>`,
      },
      {
        heading: 'XK23 — the new Assault Rifle',
        html: `<p>Ubisoft is giving the season's new weapon — the <strong>XK23 Assault Rifle</strong> — free to all players. It's an experimental bullpup framed for mid-range dominance with better maneuverability than full-length ARs.</p>
<p><strong>Operators with XK23 access:</strong> Dokkaebi, Sens, Rauora.</p>
<p>Pre-release stats aren't published in full, but bullpup design typically means: shorter overall length (better strafe + ADS speed), slightly lower muzzle velocity, manageable recoil. For Dokkaebi specifically, this fills the mid-range gap her previous loadout had — combined with the Jegeo Payload, she's now a credible solo entry op, not just an intel role.</p>`,
      },
      {
        heading: 'Operator balance — the buffs that matter',
        html: `<p>Four operators get meaningful number changes. The Gridlock buff is the most consequential.</p>
<ul>
  <li><strong>Gridlock</strong> — Trax Stinger HP <strong>1 → 35</strong>, deploy delay <strong>0.45s → 0.40s</strong>. This is enormous: Trax used to die to a single bullet, now requires committed clearing. Gridlock becomes a real spawn-peek / anti-flank threat instead of a one-trick area denial.</li>
  <li><strong>Pulse</strong> — HB-5 Cardiac Sensor range <strong>9m → 10.5m</strong>. Pulse plays from more rooms now; the C4-from-below punish is back.</li>
  <li><strong>Mozzie</strong> — Pest hijack range <strong>1.5m → 1.75m</strong>. Marginally better drone capture; mostly relevant on Coastline and Theme Park where drone paths are tight.</li>
  <li><strong>Nomad</strong> — detection range +0.25, new weapon grip attachments. Quality-of-life, not a meta shift.</li>
</ul>
<p><strong>Map modernizations</strong> hit Kanal, Emerald Plains, and Outback — 4K textures, improved lighting, destructibility tweaks. Recon 6's existing strats for these maps stay correct for the most part; major shifts will be flagged after community VOD review.</p>`,
      },
      {
        heading: 'Ranked 3.0 — the system changes',
        html: `<p>Beyond gameplay, Y11S2 ships a ranked system overhaul. Three changes matter:</p>
<ol>
  <li><strong>Hidden MMR removed.</strong> Your displayed rank IS your matchmaking rank — no more "I'm actually playing Diamond MMR while showing Plat." This makes climbing feel honest and removes the "smurf MMR" frustration.</li>
  <li><strong>5 placement matches</strong> at the start of each season. Faster than the previous system, gets you into your real rank quicker.</li>
  <li><strong>Squad rank restrictions:</strong> squadmates must be within 3 ranks of each other, tightening to within 2 at Diamond and Champion. End of Bronze-Diamond carries; tightens matchmaking quality at the top.</li>
</ol>
<p>For improvement-focused players this is a net positive: matches will be more genuinely competitive, and "I lost because matchmaking was broken" becomes a less valid excuse.</p>`,
      },
    ],
    mistakes: [
      'Banning Dokkaebi on attack without checking if the enemy is running a phone-gadget comp — sometimes she\'s not the threat',
      'Pushing the Calypso rooftop crane spawn-side without expecting a Gridlock Trax (now 35 HP — your Twitch drone won\'t clear it cleanly)',
      'Treating Pulse the same as Y11S1 — his 10.5m range opens up new C4 spots you haven\'t prepped for',
      'Sticking with old hidden-MMR strategies (loss streak farming) — Ranked 3.0 makes those obsolete',
      'Expecting old Logic Bomb behavior from Dokkaebi — she\'s a single-target threat now, not an area reveal',
    ],
    drill: {
      heading: 'How to prep for Y11S2 launch day',
      html: `<ul>
  <li><strong>Play Test Server</strong> if you have it — get reps on Calypso Casino before the ranked rush. The drone vent network is its own learning curve.</li>
  <li><strong>Re-learn Dokkaebi</strong> — old Logic Bomb instincts will mislead you. Practice the target-prioritization read (kill the Maestro vs kill the Mira vs kill the fragger).</li>
  <li><strong>Add Gridlock to your defense pool</strong> — she goes from C-tier to legitimate Trax-anchor pick with the HP buff. The Recon 6 R6 tier list will reflect this on launch day.</li>
  <li><strong>Update your Calypso bans plan</strong> — at launch, the meta will favor banning Twitch + IQ (anti-drone) on defense and Dokkaebi + Mira on attack. We'll publish a refined bans page in the first 72 hours post-launch.</li>
</ul>`,
    },
    aiVodMention: `<p>Y11S2 is going to shake the meta for two to three weeks while everyone re-learns. The <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> is map-aware — drop a Calypso Casino screenshot when ranked goes live and it'll reference the actual site you're playing, not a generic example. Pro tier covers all of Y11S2's changes from day one.</p>`,
    relatedLinks: [
      { name: 'R6 Operator Tier List (auto-updated)', url: '/#/tools/r6-tier-list' },
      { name: 'All R6 Map Guides', url: '/guides/' },
      { name: 'Live Coach (in-match walkthrough)', url: '/#/live' },
      { name: 'Recon 6 Changelog', url: '/#/changelog' },
    ],
    readMinutes: 9,
  },
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
    aiVodMention: `<p>If you can't tell why specific rounds feel off, the <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> reads your replays and flags positioning mistakes per round — useful when you know you're losing but can't see why.</p>`,
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
    aiVodMention: `<p>Once you're confident on map basics, <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> can tell you which positions you held that pros don't — useful for spotting predictable habits before your opponents do.</p>`,
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
    aiVodMention: `<p>Utility timing mismatches are hard to spot in the moment. <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> tracks your Thatcher / Thermite sync and flags rounds where your timing was off — actionable feedback you can apply the next match.</p>`,
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> tracks utility cycles per round and flags gaps in your post-plant timing — useful for finding the rounds where your team's coordination broke down without a teammate being obviously at fault.</p>`,
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
    aiVodMention: `<p>At this elo, finding the predictable habits in your own play is the climb. <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> tags rounds where you held the same anchor twice in a row or used identical exec timing — the patterns Emerald opponents will exploit.</p>`,
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> can extract opponent habits across multiple matches — useful for spotting tendencies that you can't track in real-time but are obvious in aggregate.</p>`,
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
    aiVodMention: `<p>At Diamond+, the gaps are subtle. <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> compares your decision patterns against pro-tier reads — useful for finding the rounds where you knew the right call but committed to the wrong one anyway.</p>`,
    relatedLinks: [
      { name: 'Coastline — Complete Strategy Guide', url: '/guides/coastline.html' },
      { name: 'Bank — Complete Strategy Guide', url: '/guides/bank.html' },
      { name: 'Kafe Dostoyevsky — Complete Strategy Guide', url: '/guides/kafe.html' },
      { name: 'R6 Operator Comparison Tool', url: '/#/operators' },
      { name: 'Recon 6 Pricing & Plans', url: '/#pricing' },
    ],
    readMinutes: 11,
  },
]

// ---------- RENDERING ----------

function renderBreadcrumb(post) {
  return `<nav class="breadcrumb">
    <a href="/">Recon 6</a> ›
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
      <h3>Related Recon 6 guides</h3>
      <ul>${post.relatedLinks.map((l) => `<li><a href="${escape(l.url)}">${escape(l.name)}</a></li>`).join('')}</ul>
    </div>` : ''

  // Stadium posts get a Stadium-specific CTA pointing into the Pro-gated
  // Stadium map strats — this is the SEO-to-conversion bridge that turns
  // a Google visitor reading the tier list into a Pro signup. Generic CTA
  // for every other post.
  const isStadiumPost = post.slug && post.slug.startsWith('ow2-stadium')
  const ctaHtml = isStadiumPost
    ? `
    <div class="intro-cta">
      <h3>Stadium strats for all 11 maps — Pro feature</h3>
      <p>Per-map Stadium intel: Cash priorities, Power picks per round, Item shop timing, hero lineups for Clash / Control / Push. 33 sites · 66 build paths. Founding rate $9/mo locked for life if you join before May 31.</p>
      <a class="btn" href="${SITE_URL}/#/strats/stadium-busan/point/attack">Open Stadium strats →</a>
      &nbsp;
      <a class="btn" href="${SITE_URL}/#pricing" style="background:transparent;border:1px solid rgba(255,201,122,0.5);color:#ffc97a">See pricing</a>
    </div>`
    : `
    <div class="intro-cta">
      <h3>Want AI-powered VOD review on your own gameplay?</h3>
      <p>Recon 6 Pro reads your replays and flags positioning, utility, and decision mistakes round-by-round. Founding rate $9/mo.</p>
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
      author: { '@type': 'Organization', name: 'Recon 6' },
      publisher: { '@type': 'Organization', name: 'Recon 6', logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-image.png` } },
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
        { '@type': 'ListItem', position: 1, name: 'Recon 6', item: SITE_URL },
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

// Map game ids → genre labels. Used for the genre filter on the blog index.
// With 98+ posts across 16 game verticals, an unfiltered list buries content.
// Tab-based filter (pure CSS, ?game=cs2 query param respected by client JS).
const GENRE_OF = {
  // Tactical Shooters
  r6: 'tactical', cs2: 'tactical', valorant: 'tactical',
  // Hero Shooters
  ow2: 'hero', mvr: 'hero',
  // Battle Royale
  apex: 'br', pubg: 'br', fn: 'br', naraka: 'br',
  // Arena Shooters
  halo: 'arena', finals: 'arena', cod: 'arena',
  // MOBAs
  lol: 'moba', dota: 'moba', dota2: 'moba', deadlock: 'moba',
  // Fighting
  tk8: 'fighting', tekken: 'fighting', sf6: 'fighting',
  // Sports
  eafc: 'sports', nba2k: 'sports',
  // Other
  rl: 'sports',
}
const GENRE_LABELS = {
  all: 'All Games',
  tactical: 'Tactical FPS',
  hero: 'Hero Shooter',
  br: 'Battle Royale',
  arena: 'Arena Shooter',
  moba: 'MOBA',
  fighting: 'Fighting',
  sports: 'Sports',
}

function renderIndex(allPosts) {
  // Group by game for the index page.
  const byGame = {}
  for (const p of allPosts) {
    if (!byGame[p.game]) byGame[p.game] = { label: p.gameLabel, posts: [], genre: GENRE_OF[p.game] || 'other' }
    byGame[p.game].posts.push(p)
  }

  // Render each game section with a data-genre attribute so the client-side
  // filter can show/hide whole sections via CSS without re-rendering.
  const sectionsHtml = Object.entries(byGame).map(([gameId, group]) => `
    <section class="blog-game-section" data-game="${gameId}" data-genre="${group.genre}" style="margin-bottom: 36px">
      <h2 style="margin-bottom: 12px">${escape(group.label)} <span style="font-size: 0.7rem; color: rgba(230,233,239,0.5); font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; margin-left: 8px">${escape(GENRE_LABELS[group.genre] || 'Other')}</span></h2>
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

  const genreTabs = Object.entries(GENRE_LABELS).map(([id, label]) => `
    <button type="button" class="blog-filter-tab" data-filter="${id}" aria-pressed="${id === 'all' ? 'true' : 'false'}" style="padding: 6px 14px; background: ${id === 'all' ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${id === 'all' ? 'rgba(0,229,255,0.5)' : 'rgba(255,255,255,0.1)'}; color: ${id === 'all' ? '#00e5ff' : 'rgba(230,233,239,0.8)'}; border-radius: 999px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.15s;">
      ${label}
    </button>`).join('')

  const filterScript = `
    <script>
      // Genre filter — show/hide sections by data-genre. Pure client-side, no
      // re-fetch. Also respects ?genre=X query param on load so links from
      // other pages can deep-link to a specific genre view.
      (function() {
        var tabs = document.querySelectorAll('.blog-filter-tab')
        var sections = document.querySelectorAll('.blog-game-section')
        function applyFilter(genre) {
          for (var i = 0; i < sections.length; i++) {
            var s = sections[i]
            s.style.display = (genre === 'all' || s.getAttribute('data-genre') === genre) ? '' : 'none'
          }
          for (var j = 0; j < tabs.length; j++) {
            var t = tabs[j]
            var active = t.getAttribute('data-filter') === genre
            t.setAttribute('aria-pressed', active ? 'true' : 'false')
            t.style.background = active ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.03)'
            t.style.borderColor = active ? 'rgba(0,229,255,0.5)' : 'rgba(255,255,255,0.1)'
            t.style.color = active ? '#00e5ff' : 'rgba(230,233,239,0.8)'
          }
        }
        for (var i = 0; i < tabs.length; i++) {
          tabs[i].addEventListener('click', function(e) {
            applyFilter(e.currentTarget.getAttribute('data-filter'))
          })
        }
        var params = new URLSearchParams(location.search)
        var fromQuery = params.get('genre')
        if (fromQuery) applyFilter(fromQuery)
      })()
    </script>`

  const bodyInner = `
    <h1>Recon 6 Blog — Rank-Up Guides for 20 Competitive Games</h1>
    <p style="color: rgba(230,233,239,0.8)">Tactical rank-up guides for every supported title. Each guide targets a specific rank gap with characters, callouts, common mistakes, and drills you can run today. Filter by genre below.</p>
    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin: 1.5rem 0 2rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.08);">
      ${genreTabs}
    </div>
    ${sectionsHtml}
    ${filterScript}
    <div class="intro-cta">
      <h3>Want AI VOD review on top of these guides?</h3>
      <p>Recon 6 Pro reads your replays and flags positioning + utility mistakes per round.</p>
      <a class="btn" href="${SITE_URL}/#pricing">See plans</a>
    </div>`

  const jsonLdBlocks = [
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Recon 6 Blog',
      description: 'Tactical rank-up guides for 20 supported competitive games — R6 Siege, CS2, Valorant, OW2, LoL, Tekken 8, EA FC, PUBG, Dota 2, and more.',
      url: `${SITE_URL}/blog/`,
      publisher: { '@type': 'Organization', name: 'Recon 6', logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-image.png` } },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Recon 6', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog/` },
      ],
    },
  ]

  return htmlShell({
    title: 'Rank-Up Guides for 20 Competitive Games — Recon 6 Blog',
    description: 'Tactical guides for every rank gap across 20 competitive games — R6, CS2, Valorant, OW2, LoL, Tekken 8, EA FC, PUBG, Dota 2, Apex, Marvel Rivals, Halo, Finals, CoD, Fortnite, RL, Stadium, Deadlock, Naraka, and NBA 2K.',
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
    aiVodMention: `<p>If you're losing rounds and can't tell why, the <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> reads your replays and flags positioning + utility mistakes round by round — useful for catching the habit you don't know you have.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Nova to Master Guardian', url: '/blog/cs2-nova-to-mg.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'CS2 Mirage Guide', url: '/games/cs2/mirage.html' },
      { name: 'CS2 Inferno Guide', url: '/games/cs2/inferno.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p>Once you're confident on lineups, <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> can flag rounds where your trade-frag distance was off — useful when you don't know why a 4v3 became a 0v3.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Nova', url: '/blog/cs2-silver-to-nova.html' },
      { name: 'How to Climb from MG to DMG', url: '/blog/cs2-mg-to-dmg.html' },
      { name: 'CS2 Mirage Guide', url: '/games/cs2/mirage.html' },
      { name: 'CS2 Inferno Guide', url: '/games/cs2/inferno.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> tracks your smoke placement vs pro placement on the same map — useful for spotting where your smokes are blocking the wrong angle.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Nova to MG', url: '/blog/cs2-nova-to-mg.html' },
      { name: 'How to Climb from DMG to LE', url: '/blog/cs2-dmg-to-le.html' },
      { name: 'CS2 Mirage Guide', url: '/games/cs2/mirage.html' },
      { name: 'CS2 Inferno Guide', url: '/games/cs2/inferno.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> tracks your AWP angle variation across the match — useful for spotting when you've held the same spot 3 rounds in a row without realizing it.</p>`,
    relatedLinks: [
      { name: 'How to Climb from MG to DMG', url: '/blog/cs2-mg-to-dmg.html' },
      { name: 'How to Climb from LE to LEM', url: '/blog/cs2-le-to-lem.html' },
      { name: 'CS2 Inferno Guide', url: '/games/cs2/inferno.html' },
      { name: 'CS2 Anubis Guide', url: '/games/cs2/anubis.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> can compute your headshot rate by weapon and map — useful for finding the gun-map combination that's holding back your stats.</p>`,
    relatedLinks: [
      { name: 'How to Climb from DMG to LE', url: '/blog/cs2-dmg-to-le.html' },
      { name: 'How to Climb from LEM to Supreme', url: '/blog/cs2-lem-to-supreme.html' },
      { name: 'CS2 Mirage Guide', url: '/games/cs2/mirage.html' },
      { name: 'CS2 Inferno Guide', url: '/games/cs2/inferno.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> can compare your decision patterns against pro-tier reads round-by-round — useful for finding the rounds where you knew the right call but committed to the wrong one anyway.</p>`,
    relatedLinks: [
      { name: 'How to Climb from LE to LEM', url: '/blog/cs2-le-to-lem.html' },
      { name: 'How to Climb from Supreme to Global', url: '/blog/cs2-supreme-to-global.html' },
      { name: 'CS2 Mirage Guide', url: '/games/cs2/mirage.html' },
      { name: 'CS2 Inferno Guide', url: '/games/cs2/inferno.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p>At the Global queue level, the gaps are subtle. <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> compares your in-match adaptation (round 1-3 vs round 4-6) against pro-tier patterns — useful for finding the rounds where you should have switched strat but didn't.</p>`,
    relatedLinks: [
      { name: 'How to Climb from LEM to Supreme', url: '/blog/cs2-lem-to-supreme.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'CS2 Mirage Guide', url: '/games/cs2/mirage.html' },
      { name: 'CS2 Inferno Guide', url: '/games/cs2/inferno.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p>If you can't tell why specific rounds feel off, the <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> reads your replays and flags positioning + ability usage mistakes per round — useful when you know you're losing but can't see why.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/valorant-bronze-to-silver.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Valorant Bind Guide', url: '/games/valorant/bind.html' },
      { name: 'Valorant Haven Guide', url: '/games/valorant/haven.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p>Once you're confident on map basics, <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> can flag rounds where your positioning telegraphed your push direction — useful for spotting predictable habits.</p>`,
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> tracks utility timing per round and flags rounds where your team's exec was off-tempo.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/valorant-bronze-to-silver.html' },
      { name: 'How to Climb from Gold to Plat', url: '/blog/valorant-gold-to-plat.html' },
      { name: 'Valorant Bind Guide', url: '/games/valorant/bind.html' },
      { name: 'Valorant Haven Guide', url: '/games/valorant/haven.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> can flag rounds where your team's comp was missing a role and the round was lost on synergy, not aim.</p>`,
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> can flag rounds where you held the same anchor angle 3+ rounds in a row — predictable habits Diamond opponents will exploit.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Gold to Plat', url: '/blog/valorant-gold-to-plat.html' },
      { name: 'How to Climb from Diamond to Ascendant', url: '/blog/valorant-diamond-to-ascendant.html' },
      { name: 'Valorant Bind Guide', url: '/games/valorant/bind.html' },
      { name: 'Valorant Icebox Guide', url: '/games/valorant/icebox.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> compares your comp adaptations across the match — useful for spotting rounds where the right call was obvious but you played default.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Plat to Diamond', url: '/blog/valorant-plat-to-diamond.html' },
      { name: 'How to Climb from Ascendant to Immortal', url: '/blog/valorant-ascendant-to-immortal.html' },
      { name: 'Valorant Ascent Guide', url: '/games/valorant/ascent.html' },
      { name: 'Valorant Bind Guide', url: '/games/valorant/bind.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p>At Immortal queue, gaps are subtle. <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> compares your decision patterns against pro-tier reads — useful for finding rounds where you knew the right call but committed to the wrong one anyway.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Diamond to Ascendant', url: '/blog/valorant-diamond-to-ascendant.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Valorant Ascent Guide', url: '/games/valorant/ascent.html' },
      { name: 'Valorant Bind Guide', url: '/games/valorant/bind.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p>If you can't tell why team fights feel off, the <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> reads your replays and flags positioning + ult timing mistakes per fight.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/ow2-silver-to-gold.html' },
      { name: 'OW2 Stadium Guide — Builds, Powers & Economy', url: '/blog/ow2-stadium-guide.html' },
      { name: 'OW2 Stadium Tier List', url: '/blog/ow2-stadium-tier-list.html' },
      { name: 'OW2 King\'s Row Guide', url: '/games/ow2/kings-row.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> can flag rounds where your hero pick contradicted team comp synergy — useful for spotting "I should have switched" moments.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/ow2-bronze-to-silver.html' },
      { name: 'How to Climb from Gold to Plat', url: '/blog/ow2-gold-to-plat.html' },
      { name: 'OW2 Stadium Guide — Builds, Powers & Economy', url: '/blog/ow2-stadium-guide.html' },
      { name: 'OW2 Stadium Items Guide', url: '/blog/ow2-stadium-items-guide.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> tracks your hero swap timing and flags rounds where you should have counter-picked but didn't.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/ow2-silver-to-gold.html' },
      { name: 'How to Climb from Plat to Diamond', url: '/blog/ow2-plat-to-diamond.html' },
      { name: 'OW2 Stadium Guide — Builds, Powers & Economy', url: '/blog/ow2-stadium-guide.html' },
      { name: 'OW2 Stadium Tier List', url: '/blog/ow2-stadium-tier-list.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p>At Diamond, the gaps are subtle. <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> compares your decision patterns against pro-tier reads — useful for finding rounds where you knew the right call but committed to the wrong one.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Gold to Plat', url: '/blog/ow2-gold-to-plat.html' },
      { name: 'OW2 Stadium Guide — Builds, Powers & Economy', url: '/blog/ow2-stadium-guide.html' },
      { name: 'OW2 Stadium Items Guide', url: '/blog/ow2-stadium-items-guide.html' },
      { name: 'OW2 King\'s Row Guide', url: '/games/ow2/kings-row.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> can compute your hero-swap timing across matches and flag rounds where you should have swapped mid-fight but didn't. Useful for finding the Diamond plateau pattern of "stuck on main hero" that Master players have already broken.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Plat to Diamond', url: '/blog/ow2-plat-to-diamond.html' },
      { name: 'How to Climb from Master to GM', url: '/blog/ow2-master-to-gm.html' },
      { name: 'OW2 Stadium Guide — Builds, Powers & Economy', url: '/blog/ow2-stadium-guide.html' },
      { name: 'OW2 Stadium Tier List', url: '/blog/ow2-stadium-tier-list.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> compares your decision patterns against OWCS-tier reads round-by-round. Particularly useful for finding the rounds where you knew the right call but committed to the wrong one — the exact pattern that separates Master plateau from GM ceiling.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Diamond to Master', url: '/blog/ow2-diamond-to-master.html' },
      { name: 'OW2 Stadium Guide — Builds, Powers & Economy', url: '/blog/ow2-stadium-guide.html' },
      { name: 'OW2 Stadium Tier List', url: '/blog/ow2-stadium-tier-list.html' },
      { name: 'OW2 Stadium Economy Guide', url: '/blog/ow2-stadium-economy.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 11,
  },

  // ──────────────────────────────────────────────────────────────────────
  // OW2 STADIUM — high-priority SEO bet. Stadium (S16 launch, April 2025)
  // is the newest, lowest-competition keyword cluster in OW2. Search demand
  // is high ("stadium builds", "stadium powers", "stadium ow2"), and the
  // major coaching sites haven't covered it deeply yet. This is a
  // first-mover content opportunity, not a saturated topic.
  // ──────────────────────────────────────────────────────────────────────
  {
    game: 'ow2',
    gameLabel: 'Overwatch 2',
    fromRank: 'Stadium',
    toRank: 'Mastery',
    slug: 'ow2-stadium-guide',
    metaTitle: 'OW2 Stadium Guide — Best Builds, Powers & Economy (2026)',
    metaDescription: 'Complete Overwatch 2 Stadium guide: how the BO7 round economy works, best Powers per hero, Item shop priorities (Weapon Power / Ability Power / Armor / CDR / Life Steal / Move Speed), tank vs DPS vs support build paths, and the round-economy mistakes that cost you the match.',
    intro: `<p>Stadium is OW2's round-based 5v5 mode added in Season 16. First team to 4 round wins in a best-of-7 takes the match. Between rounds you spend Cash (won via round outcome + kills + objective time) on hero-specific Powers (4 unlocked at rounds 1/3/5/7 — permanent once picked) and stat Items in a shop. Build path matters more than mechanical aim past Diamond — picking the wrong Power chain or stat curve loses rounds even with a 60% hero win rate. This guide breaks down the round economy, the six Item categories, archetype build paths for the most common picks, and the round-economy mistakes that quietly cost you the match.</p>`,
    sections: [
      {
        heading: 'How the round economy actually works',
        html: `<p>Stadium is a best-of-7 format. First team to 4 round wins takes the match. Each round you earn Cash you spend in the next round's shop:</p>
<ul>
  <li><strong>Round win:</strong> ~3,500–4,500 Cash (scales with contribution + match length).</li>
  <li><strong>Round loss:</strong> ~2,500–3,000 Cash. Loss bonus is intentional — it's anti-snowball, not punishment.</li>
  <li><strong>Eliminations:</strong> ~100–250 each. Round MVP +500. Assists ~50 each. Objective time ~10/sec.</li>
</ul>
<p>The shop opens for ~30 seconds between every round. Powers are unlocked at the end of rounds 1, 3, 5, and 7. Once a Power is locked, you can't swap it — wrong R1 picks compound through R7. This is the most common silver-to-plat Stadium mistake: picking a "looks strong" Power without checking whether the Items you can afford this round actually support it.</p>
<p><strong>Critical rule:</strong> never enter Round 7 with more than ~1,000 unspent Cash. Unspent Cash is forfeited at match end. The single most common throw in low-rank Stadium is hoarding Cash that's never deployed.</p>`,
      },
      {
        heading: 'The six Item categories and which hero each one fits',
        html: `<p>The shop offers six stat categories, each in Common / Rare / Epic tiers. Common items are cheapest but suffer hard diminishing returns past three stacks of the same stat — past Round 3 you should be eyeing Rare and Epic upgrades, not stacking your fourth Common.</p>
<ul>
  <li><strong>Weapon Power</strong> — percent damage boost on primary fire. Best for hitscan DPS (Soldier 76, Cassidy, Ashe, Sojourn). Weakest on tanks because of hero-tag damage reduction.</li>
  <li><strong>Ability Power</strong> — percent boost on ability damage, healing, and utility effects. Best for ability-driven heroes (Ana, Sigma, Mei, Junkrat, Symmetra, Reinhardt for Earthshatter scaling).</li>
  <li><strong>Armor / Health</strong> — flat HP or armor layer. Armor reduces incoming damage 30% on shots ≤10 damage (the bullet-armor rule). Best for tanks and brawl DPS (Reaper, Mauga, Junker Queen).</li>
  <li><strong>Cooldown Reduction</strong> — percent off ability cooldowns. Best for cooldown-driven heroes (Brigitte, Ana, Lúcio, D.Va for Defense Matrix uptime).</li>
  <li><strong>Life Steal</strong> — heal for percent of damage dealt. Best for sustain DPS (Reaper, Mauga, Mei) who win 1v1s by out-lasting trades.</li>
  <li><strong>Move Speed</strong> — base movement boost. Best for flank DPS (Reaper, Sombra) and mobile supports.</li>
</ul>
<p><strong>The single biggest stat-allocation mistake:</strong> tanks buying Weapon Power. Tank damage gets hit by hero-tag damage reduction in Stadium — Weapon Power is the worst dollar-per-impact category for any tank that isn't Mauga. Buy Armor and Cooldown Reduction first; ignore Weapon Power until your defensive stack is set.</p>`,
      },
      {
        heading: 'Reinhardt build — Brawl Tank baseline path',
        html: `<p>Reinhardt is the most build-stable Stadium tank. Build for survivability + Earthshatter scaling, not raw damage:</p>
<ul>
  <li><strong>R1 Power:</strong> Charging Rhino (Charge cooldown reduction). Lets you reposition the choke faster.</li>
  <li><strong>R3 Power:</strong> Steadfast (knockback resistance during Charge). Lets you commit Charge through bumps and CC.</li>
  <li><strong>R5 Power:</strong> Earthsplitter (Earthshatter AoE expansion). The fight-winner — bigger AoE = more guaranteed knockdowns.</li>
  <li><strong>R7 Power:</strong> Crusader Resurgence (heal-on-Earthshatter-hit). Survive the post-shatter team fight.</li>
</ul>
<p><strong>Item path:</strong> R1 — 2× Armor Common · R2 — 1× Cooldown Reduction Rare · R3 — 1× Armor Epic (Bulwark) · R4 — 1× Ability Power Rare (scales Earthshatter damage) · R5 — 1× Cooldown Reduction Epic · R6 — top up Armor + 1× Move Speed Common.</p>
<p>By Round 5 your Earthshatter has bigger AoE, your Charge cooldown is short enough to reposition twice per fight, and you're hard to kill behind Bulwark armor stacks. Round 7 wins on the heal-on-shatter Power flipping the post-shatter cleanup.</p>`,
      },
      {
        heading: 'Soldier 76 build — Hitscan DPS baseline path',
        html: `<p>Soldier is the most build-portable hitscan in Stadium. He scales with Weapon Power harder than almost anyone else:</p>
<ul>
  <li><strong>R1 Power:</strong> Steady Aim (recoil control). Improves your headshot rate from Round 1.</li>
  <li><strong>R3 Power:</strong> Anti-Gravity Pulse (Helix Rockets gain knockback). Pairs with team-fight engages.</li>
  <li><strong>R5 Power:</strong> Stim Sprint (sprint heals while moving). Sustain through poke fights.</li>
  <li><strong>R7 Power:</strong> Tactical Visor Overload (longer Tac Visor, faster fire rate). One-shots the round.</li>
</ul>
<p><strong>Item path:</strong> R1 — 2× Weapon Power Common · R2 — 1× Weapon Power Rare · R3 — 1× Life Steal Common · R4 — 1× Cooldown Reduction Rare (Helix uptime) · R5 — 1× Weapon Power Epic (Crit Bonus) · R6 — 1× Armor Common.</p>
<p>Tac Visor in Round 5+ should win the round outright. The Weapon Power stack is your win condition; never substitute it for Ability Power on Soldier — Helix is utility, not your damage core.</p>`,
      },
      {
        heading: 'Ana build — Spell Support baseline path',
        html: `<p>Ana is Stadium's highest-scaling support because her kit is 100% ability-driven. Heal numbers, sleep duration, and Nano impact all scale with Ability Power:</p>
<ul>
  <li><strong>R1 Power:</strong> Eye in the Sky (rifle scope speed). Helps you land sleep darts and biotic shots in fights.</li>
  <li><strong>R3 Power:</strong> Nano Boost: Combined Arms (Nano boosts Ana too). Turns Ana into a third DPS while supporting.</li>
  <li><strong>R5 Power:</strong> Sleep Dart: Lullaby (sleep duration + small AoE). Reliable single-target lock.</li>
  <li><strong>R7 Power:</strong> Mother (Biotic Grenade heals twice). Doubles your peel value in late-round fights.</li>
</ul>
<p><strong>Item path:</strong> R1 — 2× Ability Power Common · R2 — 1× Cooldown Reduction Rare · R3 — 1× Ability Power Rare · R4 — 1× Cooldown Reduction Common · R5 — 1× Ability Power Epic (Nano scaling) · R6 — 1× Move Speed Common.</p>
<p>Ana wins Stadium support 1v1s through sleep-dart trades. Combined Arms in Round 3 + Mother in Round 7 makes you a third DPS in the late game while still healing peak numbers.</p>`,
      },
      {
        heading: 'Tracer, D.Va, Reaper — quick build paths for the meta',
        html: `<p>Tracer dive DPS: R1 Quantum Entanglement (Recall heals) · R3 Pulse Bomb: Final Blow (crit boost on Pulse) · R5 Blink: Slipstream (third blink) · R7 Pulse Maelstrom (Pulse at half cooldown). Item path: Weapon Power → Cooldown Reduction → Life Steal → Move Speed.</p>
<p>D.Va anti-dive tank: R1 Boostrr (Boosters refresh on kill) · R3 Defense Matrix: Reformat (DM regen rate) · R5 Micro Missiles: Resupply (faster cooldown after kill) · R7 Mech Rage (Self-Destruct armor while charging). Item path: Armor → Cooldown Reduction → Armor Epic → Weapon Power Common.</p>
<p>Reaper brawl DPS: R1 Soul Globe Generosity · R3 From The Shadows (Wraith DR) · R5 Death Blossom: Lifeblood (Blossom heals on hit) · R7 Shadowstep: Phase Lurk (faster Shadow Step + invis). Item path: Life Steal → Weapon Power → Armor → Move Speed.</p>`,
      },
      {
        heading: 'The five round-economy mistakes that cost you the match',
        html: `<ul>
  <li><strong>Picking the highest-damage R1 Power without checking your Item stack.</strong> Anti-Gravity Pulse with no Cooldown Reduction items is a 12-second cooldown the whole round — wasted Power slot.</li>
  <li><strong>Over-stacking Commons past Round 3.</strong> Diminishing returns are real: 5× Common Weapon Power = roughly 3.5× effective Weapon Power. Switch to Rare/Epic by R4.</li>
  <li><strong>Tanks buying Weapon Power.</strong> Hero-tag DR makes it the worst dollar spend on every tank except Mauga. Armor and Cooldown first.</li>
  <li><strong>Saving Cash for Round 7 then leaving 2,000+ unspent.</strong> Unspent Cash is forfeited at match end. Always enter Round 7 with under ~1,000 banked.</li>
  <li><strong>Throwing Round 1 for the loss bonus.</strong> The comp/Power lead from a Round 1 win compounds — it's worth more than the ~1,000 extra Cash.</li>
</ul>`,
      },
      {
        heading: 'Stat priorities by role — the cheat sheet',
        html: `<p><strong>Tank:</strong> Armor > Cooldown Reduction > Ability Power (Mauga is the only tank where Weapon Power leads). Pick Powers that extend survivability; raw-damage Powers on tank lose rounds.</p>
<p><strong>DPS:</strong> Weapon Power > Life Steal (brawl) OR Cooldown Reduction (ability-heavy) > Armor. Pick one damage vector, stack toward it; don't split.</p>
<p><strong>Support:</strong> Ability Power > Cooldown Reduction > Armor. Powers should scale your CC and heal output, not your damage — supports who pick raw-damage Powers feed the enemy DPS.</p>`,
      },
    ],
    mistakes: [
      'Picking damage Powers as a tank instead of survivability Powers.',
      'Stacking 4+ Common items in one category past Round 3 (diminishing returns).',
      'Buying Weapon Power on every tank (Mauga is the only exception).',
      'Entering Round 7 with 2,000+ unspent Cash — it\'s forfeited.',
      'Throwing Round 1 intentionally for loss bonus — comp/Power lead beats Cash lead.',
    ],
    drill: {
      heading: 'Drill: 7-day Stadium build literacy regimen',
      html: `<ul>
  <li><strong>Day 1-2:</strong> Pick ONE hero and play 5 Stadium matches with the same build path. Don't deviate — feel the rhythm of when Powers come online.</li>
  <li><strong>Day 3-4:</strong> Same hero, swap the R3 Power. Notice which one wins more rounds. Track it.</li>
  <li><strong>Day 5-7:</strong> Switch to a different role (tank → support, or DPS → tank). Test build literacy across archetypes.</li>
</ul>
<p>By the end of the week you'll know your home hero's Power tree cold, and you'll have the framework to learn any new hero's build in 2-3 matches instead of 10.</p>`,
    },
    aiVodMention: `<p>The <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> reads Stadium HUD cues — Cash counter, equipped Powers, Item stack — and flags build-vs-Power mismatches automatically. Useful when you know a round felt wrong but can't pinpoint whether it was your build, your positioning, or both.</p>`,
    relatedLinks: [
      { name: 'OW2 Stadium Tier List — Best Heroes Per Role', url: '/blog/ow2-stadium-tier-list.html' },
      { name: 'OW2 Stadium Items Guide — When to Buy What', url: '/blog/ow2-stadium-items-guide.html' },
      { name: 'OW2 Stadium Economy Guide — Cash & Round Strategy', url: '/blog/ow2-stadium-economy.html' },
      { name: 'How to Climb from Diamond to Master in OW2', url: '/blog/ow2-diamond-to-master.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 11,
  },

  // ──────────────────────────────────────────────────────────────────────
  // OW2 STADIUM CLUSTER POST #2 — TIER LIST
  // Tier lists get pinned in Discords, shared on Reddit, and ranked for
  // high-volume "best X" queries. Lower commercial intent than the build
  // guide but huge top-of-funnel pull.
  // ──────────────────────────────────────────────────────────────────────
  {
    game: 'ow2',
    gameLabel: 'Overwatch 2',
    fromRank: 'Stadium',
    toRank: 'Meta',
    slug: 'ow2-stadium-tier-list',
    metaTitle: 'OW2 Stadium Tier List 2026 — Best Heroes Per Role',
    metaDescription: 'Updated Overwatch 2 Stadium tier list: S/A/B/C tiers for every hero in the Stadium pool, ranked by build ceiling, Power synergy, and BO7 round impact. Tank, DPS, and support breakdowns with reasoning per pick.',
    intro: `<p>Stadium tier lists from May 2025 are wrong by now — Powers have been rebalanced, the hero pool has shifted, and the round economy got patched twice. This is an updated 2026 tier list based on current Stadium pick rates at Diamond+ and Power synergy data. Tier criteria: build ceiling (how strong does this hero get with their full 4-Power kit), Power-Item synergy (do affordable Items support the Powers), and BO7 round impact (do they close out rounds 5-7 when fights matter most). Heroes that scale poorly with Items or have weak R7 Powers drop tiers regardless of base kit strength.</p>`,
    sections: [
      {
        heading: 'How this tier list is built',
        html: `<p>Stadium tier lists need different criteria than ranked tier lists. In ranked, raw hero strength wins. In Stadium, build scaling wins. A hero with a mediocre base kit but excellent Power tree (Ana, D.Va) tiers higher than a hero with a strong base kit but weak Powers (Bastion, Roadhog).</p>
<p>Three weighted factors:</p>
<ul>
  <li><strong>Build ceiling (40%)</strong> — how much does the hero gain across R1→R7 Power picks. Tracer with full Powers is a different hero; Soldier with full Powers is the same hero with more damage. Build ceiling weighs ability-driven heroes heavier.</li>
  <li><strong>Item economy (30%)</strong> — can the hero hit their power-spike build inside a ~13,000 Cash budget? Heroes that need 3+ Epic items to function (most Common-stack heroes) tier lower than heroes that scale linearly with cheap stacking (Soldier, Ana).</li>
  <li><strong>BO7 round impact (30%)</strong> — does the R7 Power win the round? Heroes whose R7 is a stat boost (yawn) tier lower than heroes whose R7 fundamentally changes their kit (Tracer Pulse Maelstrom, Ana Mother, Reinhardt Resurgence).</li>
</ul>
<p>S-tier = wins games. A-tier = wins matches with right team. B-tier = playable in the right comp. C-tier = throw pick unless map/comp specifically favors.</p>`,
      },
      {
        heading: 'S-Tier — Stadium-defining picks',
        html: `<ul>
  <li><strong>Ana (Support)</strong> — best support in Stadium. Combined Arms (R3) makes her a third DPS while supporting. Mother (R7) doubles peel value. Lullaby (R5) is the single most reliable lockdown CD in the game. Items: Ability Power → Cooldown Reduction stack. Wins R1, scales through R7.</li>
  <li><strong>Reinhardt (Tank)</strong> — best tank in Stadium. Earthsplitter + Crusader Resurgence in late rounds is the closest thing to a guaranteed round win. Armor stacking economy is cheap and effective. Hard to throw with — even bad Rein wins R1-R3 because Armor stacks aren't gated.</li>
  <li><strong>Tracer (DPS)</strong> — Pulse Maelstrom (R7) at half cooldown is the single most broken late-game Power in Stadium. Three blinks (Slipstream) at R5 makes her uncatchable. Item economy is cheap (Weapon Power Commons stack well). High skill floor but ceiling is "carries the BO7."</li>
</ul>`,
      },
      {
        heading: 'A-Tier — Strong picks with map/comp dependencies',
        html: `<ul>
  <li><strong>D.Va (Tank)</strong> — Reformat (R3) keeps DM uptime ~70% of fights. Anti-dive specialist. Drops to B against poke comps where DM matters less.</li>
  <li><strong>Soldier 76 (DPS)</strong> — Weapon Power scales linearly, Tac Visor Overload (R7) wins R7 outright. Drops to B against heavy-shield comps.</li>
  <li><strong>Reaper (DPS)</strong> — Death Blossom: Lifeblood (R5) gives full heal + 2 picks per Blossom. Strong on closed-corner maps. Drops to B on open-sightline maps.</li>
  <li><strong>Kiriko (Support)</strong> — Suzu (R3 Power enhancement) is mandatory peel. Lower ceiling than Ana but easier to execute. Cleanse uptime decides team fights.</li>
  <li><strong>Cassidy (DPS)</strong> — Magnetic Grenade scaling on Ability Power Items makes him a poke threat at any range. R7 Power varies by patch.</li>
</ul>`,
      },
      {
        heading: 'B-Tier — Playable but conditional',
        html: `<ul>
  <li><strong>Junker Queen (Tank)</strong> — Carnage scaling on Ability Power makes her viable, but Reinhardt does the brawl job better. Pick into dive comps.</li>
  <li><strong>Mauga (Tank)</strong> — only tank where Weapon Power is the correct primary stat. Sustains 1v2s on Life Steal items. Drops against shield/DR comps.</li>
  <li><strong>Genji (DPS)</strong> — Dragonblade scales with Powers but requires Nano synergy from Ana. Drops to C without team coordination.</li>
  <li><strong>Lúcio (Support)</strong> — Speed Boost amped is map-dependent. Strong on Push/Esperança, mediocre on Control.</li>
  <li><strong>Sigma (Tank)</strong> — Ability Power on Hyperspheres gives the highest tank DPS in Stadium. But fragile under dive. Map-dependent.</li>
  <li><strong>Brigitte (Support)</strong> — Whip Shot CDR (Cooldown Reduction) Items make her oppressive at close range. Falls off at range. Stadium maps are closed enough that B-tier holds.</li>
</ul>`,
      },
      {
        heading: 'C-Tier — Avoid unless niche pick',
        html: `<ul>
  <li><strong>Roadhog (Tank)</strong> — no synergy with Weapon Power (hero-tag DR), no Ability Power scaling. R7 Power is underwhelming. Throw pick into Reinhardt.</li>
  <li><strong>Bastion (DPS)</strong> — Sentry damage caps because of DR scaling. R7 Power doesn't change his core gameplay.</li>
  <li><strong>Symmetra (DPS)</strong> — Turret scaling with Ability Power exists but ult is heavily nerfed in Stadium format.</li>
  <li><strong>Mercy (Support)</strong> — single-target pocket doesn't scale with Items. Resurrection is round-decisive once per round, not enough to outweigh Ana/Kiriko.</li>
  <li><strong>Moira (Support)</strong> — fade healing doesn't scale, primary heal beam falls off vs. Ana's burst peel. Throw pick.</li>
</ul>`,
      },
      {
        heading: 'Why "best hero" depends on round number',
        html: `<p>One mistake players make with tier lists is treating them as static. In Stadium, the strongest hero in R1 isn't the strongest in R7. Reinhardt and Soldier are R1 monsters because their base kits don't need Powers to function. Tracer and Ana scale into R7 monsters because their R5+R7 Powers fundamentally change what they do.</p>
<p>If you're playing first to 4 and lose R1-R2, you've still got R3-R7 where late-scaling heroes pull ahead. If you're up 2-0 after R1-R2, double down on R1-strong picks to close fast. Tier list reads should adapt — early-game vs. late-game ceilings are different stats.</p>`,
      },
      {
        heading: 'Bans, swaps, and counter-picking',
        html: `<p>Stadium has hero bans mid-match. Ban priority for most teams:</p>
<ol>
  <li><strong>Tracer</strong> — late-game ceiling is too high. Ban if your team can't deal with dive.</li>
  <li><strong>Ana</strong> — too much value across all 7 rounds. Ban if you don't have a second sleep-immune hero.</li>
  <li><strong>Reinhardt</strong> — only ban if your tank player doesn't have a Reinhardt counter pocket. Otherwise leave him; your team can match.</li>
</ol>
<p>Counter-picking matters less than build-picking in Stadium. A Rein with full Armor stacks beats a Mauga with full Life Steal regardless of "the match-up." Trust the build path, not the hero matchup chart.</p>`,
      },
    ],
    mistakes: [
      'Treating ranked tier lists as Stadium tier lists — different game, different criteria.',
      'Picking S-tier heroes you can\'t play well. C-tier-on-main beats S-tier you\'ve never touched.',
      'Banning Tracer or Ana without a backup pick — you waste a ban if their player just swaps to the same archetype.',
      'Picking a late-game hero (Tracer) when you\'re down 0-2 — you don\'t reach the late game without R3-R4 fight wins.',
      'Forcing a meta tank pick when your team comp wants the off-meta one (e.g., picking Rein into a poke comp because he\'s "S-tier").',
    ],
    drill: {
      heading: 'Drill: 5-day tier list ladder test',
      html: `<ul>
  <li><strong>Day 1:</strong> Play 5 matches with your S-tier home hero. Track win rate.</li>
  <li><strong>Day 2:</strong> Same with your A-tier secondary. Track win rate.</li>
  <li><strong>Day 3:</strong> Same with a B-tier you'd normally avoid. Track win rate.</li>
  <li><strong>Day 4:</strong> Replay round 5-7 of three matches and identify which hero closed each round.</li>
  <li><strong>Day 5:</strong> Build your personal tier list based on YOUR win rate, not Reddit's.</li>
</ul>
<p>By Day 5 you'll know whether the meta tier list matches your skill — most players' personal tier lists differ by 2-3 spots from meta. Trust your tier list, not theirs.</p>`,
    },
    aiVodMention: `<p>The <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> catches per-round impact — flags rounds where your hero pick contributed less than the team needed. Useful for tier-list calibration: if your S-tier pick is showing C-tier round impact, you've found the gap between "meta says strong" and "your gameplay supports it."</p>`,
    relatedLinks: [
      { name: 'OW2 Stadium Guide — Builds, Powers & Economy', url: '/blog/ow2-stadium-guide.html' },
      { name: 'OW2 Stadium Items Guide — When to Buy What', url: '/blog/ow2-stadium-items-guide.html' },
      { name: 'OW2 Stadium Economy Guide', url: '/blog/ow2-stadium-economy.html' },
      { name: 'How to Climb from Diamond to Master in OW2', url: '/blog/ow2-diamond-to-master.html' },
      { name: 'Recon 6 OW2 Loadouts', url: '/#/loadouts' },
    ],
    readMinutes: 10,
  },

  // ──────────────────────────────────────────────────────────────────────
  // OW2 STADIUM CLUSTER POST #3 — ITEMS DEEP DIVE
  // High-intent informational query. Targets "stadium items guide",
  // "stadium item priorities", "stadium [stat] items".
  // ──────────────────────────────────────────────────────────────────────
  {
    game: 'ow2',
    gameLabel: 'Overwatch 2',
    fromRank: 'Stadium',
    toRank: 'Items',
    slug: 'ow2-stadium-items-guide',
    metaTitle: 'OW2 Stadium Items Guide — When to Buy What (2026)',
    metaDescription: 'Complete OW2 Stadium item shop guide: Common vs Rare vs Epic tier strategy, diminishing returns per stat, hero-specific buy paths, and the round-by-round Cash budget that maximizes power-spike timing.',
    intro: `<p>Stadium has six Item categories in the shop and three tiers per category (Common / Rare / Epic). On paper that's 18 buy options per shop visit. In practice, only 3-4 of them help your hero — the other 14 are noise. This guide breaks down which Items fit which hero, when to buy Common vs. Rare vs. Epic, and the Cash-budget rhythm that hits your power-spike right when fights matter.</p>`,
    sections: [
      {
        heading: 'The 6 Item categories — what each one actually does',
        html: `<p>Stadium's shop offers six stat categories. Every Item is one of these stats at one of three tiers. The Common-Rare-Epic gap isn't just a price scale; Epics have unique secondary effects that change how the stat plays.</p>
<ul>
  <li><strong>Weapon Power</strong> — percent damage boost on primary fire. Common: ~6% per stack. Rare: ~14% with minor crit chance. Epic: ~22% with significant secondary (e.g. armor pierce, headshot bonus, splash damage). Best for hitscan DPS.</li>
  <li><strong>Ability Power</strong> — percent damage/heal/utility boost on cooldown abilities. Same tier curve. Best for ability-driven heroes.</li>
  <li><strong>Armor / Health</strong> — flat HP boost OR armor layer. Common: 15-25 HP. Rare: 50 HP + small DR. Epic: 75-100 HP + significant DR. Armor specifically punishes hitscan because armor blocks 30% of damage on shots ≤10.</li>
  <li><strong>Cooldown Reduction</strong> — percent off ability cooldowns. Stacks multiplicatively. Best for cooldown-driven heroes.</li>
  <li><strong>Life Steal</strong> — heal for percent of damage dealt. Common: 5-7%. Rare: 12% + minor on-kill heal. Epic: 18% + significant on-kill heal.</li>
  <li><strong>Move Speed</strong> — base movement boost. Common: 5%. Rare: 10% + sprint heal. Epic: 15% + minor on-kill speed.</li>
</ul>`,
      },
      {
        heading: 'Diminishing returns — when Commons stop scaling',
        html: `<p>The single most important Items concept: <strong>diminishing returns past 3 stacks of the same Common tier in one category.</strong> Specifically:</p>
<ul>
  <li><strong>Stacks 1-3:</strong> ~100% efficiency. Linear scaling.</li>
  <li><strong>Stacks 4-5:</strong> ~70% efficiency per additional stack.</li>
  <li><strong>Stacks 6+:</strong> ~40% efficiency. You're burning Cash.</li>
</ul>
<p>This means by Round 3-4 you should be looking at Rare upgrades, not your 4th Common. Selling 2-3 Commons to fund 1 Rare nets you more stat value than stacking the 4th and 5th Commons.</p>
<p>Epics break diminishing-returns scaling for their category. An Epic Weapon Power on top of 3 Common Weapon Power stacks correctly — they're treated as separate "tiers" in the scaling formula. This is why most top-tier builds end with: 3× Common (R1-R3) → 1× Rare (R4) → 1× Epic (R5-R6) per primary stat.</p>`,
      },
      {
        heading: 'Selling and refunding Items',
        html: `<p>Items can be sold mid-match between rounds. You recover ~75% of the original cost (a "rebuy fee" of 25% applies). This is the most-underused Stadium mechanic.</p>
<p>When to sell:</p>
<ul>
  <li><strong>Stat misallocation.</strong> You bought 4× Common Weapon Power on tank, realized hero-tag DR was eating your value. Sell two of them, buy Cooldown Reduction Rare.</li>
  <li><strong>Power swap incoming.</strong> R3 Power unlocks and the Power changes your scaling priority. Sell off the now-irrelevant stat stack, buy into the new vector.</li>
  <li><strong>Tier upgrade.</strong> Sell 2× Common to fund 1× Rare in the same category. Net effective stat boost is ~20-30% higher even after the rebuy fee.</li>
</ul>
<p><strong>Don't sell:</strong> Items that match your Power-locked synergy. If you've picked Soldier's Tac Visor Overload R7 Power, Weapon Power Items are core — never sell those mid-match.</p>`,
      },
      {
        heading: 'Hero-specific Item priorities (10 most common picks)',
        html: `<ul>
  <li><strong>Reinhardt:</strong> Armor (Bulwark Epic R3) > Cooldown Reduction > Ability Power (Earthshatter scaling). Skip Weapon Power entirely.</li>
  <li><strong>D.Va:</strong> Cooldown Reduction (DM uptime) > Armor > Weapon Power Common. Don't buy Move Speed — Boosters give you the mobility.</li>
  <li><strong>Mauga:</strong> Life Steal Rare > Weapon Power > Armor. The only tank that prioritizes Weapon Power. Skip Cooldown Reduction.</li>
  <li><strong>Soldier 76:</strong> Weapon Power x3 Common → Rare → Epic. Single-vector build. Cooldown Reduction Rare for Helix uptime if you have spare Cash.</li>
  <li><strong>Cassidy:</strong> Weapon Power > Ability Power (Magnetic Grenade) > Armor Common. Split-vector if you want flexibility.</li>
  <li><strong>Tracer:</strong> Weapon Power Common stack → Rare → Cooldown Reduction Epic (Blink). Life Steal Common for sustain. Skip Armor — your survival is positioning.</li>
  <li><strong>Reaper:</strong> Life Steal + Weapon Power evenly. Armor Common Round 3+. Skip Ability Power — Wraith doesn't scale.</li>
  <li><strong>Ana:</strong> Ability Power x3 Common → Rare → Epic. Cooldown Reduction Rare for sleep dart uptime. Skip Armor — Ana's value is range positioning.</li>
  <li><strong>Kiriko:</strong> Ability Power (Suzu scaling) + Cooldown Reduction (Suzu uptime). Weapon Power Common Round 4+ for late-round DPS contribution.</li>
  <li><strong>Lúcio:</strong> Cooldown Reduction Rare (Speed amp uptime) + Ability Power (boop scaling) + Move Speed Common. Skip Armor — speed is the survival stat.</li>
</ul>`,
      },
      {
        heading: 'The Cash budget rhythm — power-spike timing',
        html: `<p>Stadium Cash budgets are ~13,000 total across rounds 1-6. Spent correctly, the budget hits a power spike at R5 — exactly when fights get decisive in a BO7.</p>
<ul>
  <li><strong>R1 budget (~3,000):</strong> 2× Common in your primary stat. Don't full-spend. Save 500-1,000 for R2 top-up.</li>
  <li><strong>R2 budget (~3,500):</strong> 1× Rare in your primary stat. This is the first power spike.</li>
  <li><strong>R3 budget (~3,500):</strong> Secondary-stat Common (Cooldown Reduction or Armor depending on hero) OR upgrade existing Common to Rare via sell.</li>
  <li><strong>R4 budget (~4,000):</strong> Save for R5 Epic. Buy 1 Common at most.</li>
  <li><strong>R5 budget (~4,500):</strong> 1× Epic in primary stat. This is the round-5 power spike — your win condition for closing R5-R7.</li>
  <li><strong>R6 budget (~3,000):</strong> Top-up. Buy whatever Common rounds out the build.</li>
</ul>
<p><strong>R7 rule:</strong> never enter Round 7 with more than 1,000 unspent Cash. Spend everything — even on suboptimal Commons. Unspent Cash is forfeited at match end.</p>`,
      },
      {
        heading: 'Common mistakes — the 30% efficiency tax',
        html: `<ul>
  <li><strong>Buying 4-5 Commons in one stat past R3.</strong> Diminishing returns turn 5× Common = ~3.5× effective. Switch to Rare/Epic by R4.</li>
  <li><strong>Splitting between 2 primary stats.</strong> Stadium rewards single-vector builds. 4× Weapon Power beats 2× Weapon + 2× Ability Power for hitscan DPS — even though "balanced" looks safer.</li>
  <li><strong>Tanks buying Weapon Power (except Mauga).</strong> Hero-tag DR makes it the worst dollar spend on every other tank.</li>
  <li><strong>Saving Cash for an Epic that you never afford.</strong> If you're at R5 with no Epic budget, spend on 2× Rare instead. Hoarded Cash is wasted.</li>
  <li><strong>Forgetting Items reset between matches.</strong> A perfect R7 build gets you nothing in the NEXT match — Stadium economy resets per match. Don't try to "save up" between matches.</li>
</ul>`,
      },
    ],
    mistakes: [
      'Stacking 4+ Commons of the same stat past Round 3 — diminishing returns cost you ~30% efficiency.',
      'Splitting between two damage stats (Weapon + Ability Power) instead of single-vector building.',
      'Tanks buying Weapon Power. Only Mauga benefits — every other tank prioritizes Armor/Cooldown.',
      'Hoarding Cash for an Epic that never gets purchased. 2× Rare beats 1 saved-but-unspent Epic budget.',
      'Forgetting to sell mismatched Items mid-match. The 25% rebuy fee is almost always worth the stat upgrade.',
    ],
    drill: {
      heading: 'Drill: 3-match Item literacy test',
      html: `<ul>
      <li><strong>Match 1:</strong> Play your home hero, buy ONLY Common Items. Track power spike round.</li>
      <li><strong>Match 2:</strong> Same hero, buy Common R1-R3, Rare R4, Epic R5+. Track power spike round.</li>
      <li><strong>Match 3:</strong> Same hero, build "split-vector" — split between 2 stats. Track round wins.</li>
    </ul>
<p>By the end of three matches you'll feel the difference single-vector builds make. The all-Common run will be sluggish past Round 4. The split-vector run will feel "fine" until R7 when nothing pops off. The Rare-Epic ladder is the winning rhythm.</p>`,
    },
    aiVodMention: `<p>The <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> reads your equipped Items vs. Powers and flags mismatches — e.g., "you bought Weapon Power on Ana but her Powers scale with Ability Power; reallocate next match." Useful for catching the 30% efficiency tax before it costs you 3 round losses.</p>`,
    relatedLinks: [
      { name: 'OW2 Stadium Guide — Builds, Powers & Economy', url: '/blog/ow2-stadium-guide.html' },
      { name: 'OW2 Stadium Tier List — Best Heroes Per Role', url: '/blog/ow2-stadium-tier-list.html' },
      { name: 'OW2 Stadium Economy Guide', url: '/blog/ow2-stadium-economy.html' },
      { name: 'How to Climb from Diamond to Master in OW2', url: '/blog/ow2-diamond-to-master.html' },
      { name: 'Recon 6 OW2 Loadouts', url: '/#/loadouts' },
    ],
    readMinutes: 11,
  },

  // ──────────────────────────────────────────────────────────────────────
  // OW2 STADIUM CLUSTER POST #4 — ECONOMY
  // Niche but high-intent. Targets "stadium economy", "stadium cash",
  // "stadium round strategy", "loss bonus stadium".
  // ──────────────────────────────────────────────────────────────────────
  {
    game: 'ow2',
    gameLabel: 'Overwatch 2',
    fromRank: 'Stadium',
    toRank: 'Economy',
    slug: 'ow2-stadium-economy',
    metaTitle: 'OW2 Stadium Economy Guide — Cash & Round Strategy (2026)',
    metaDescription: 'How OW2 Stadium\'s Cash economy works: round win/loss payouts, contribution bonuses, when to save vs spend, the loss-bonus trap, and the 6-round Cash budget that hits a power spike at R5.',
    intro: `<p>Stadium isn't just hero picks and Powers — it's an economy game. Round wins and losses pay you Cash, which you spend in the shop between rounds. Knowing the Cash math separates Diamond-stuck players from GM-tier Stadium climbers. This guide breaks down exactly how Cash works, when to save vs. spend, the loss-bonus trap, and the round-by-round budget rhythm that wins matches.</p>`,
    sections: [
      {
        heading: 'Cash sources — what pays you what',
        html: `<p>Every round you earn Cash from four buckets:</p>
<ul>
  <li><strong>Round outcome.</strong> Win pays ~3,500–4,500. Loss pays ~2,500–3,000. Loss is intentional — it's anti-snowball.</li>
  <li><strong>Eliminations.</strong> Each elim pays ~100–250 Cash. Final blows pay more than assists (~50). Roles equalize: tanks earn comparable Cash to DPS even with lower elim count, because objective contribution evens it out.</li>
  <li><strong>Objective time.</strong> ~10 Cash per second on point/payload. This is the silent earner — tanks who hold point during overtime out-earn DPS who farm kills off-objective.</li>
  <li><strong>Round MVP.</strong> +500 to whoever the system flags as round MVP (usually a combination of damage, healing, elims, and objective contribution).</li>
</ul>
<p>Average match total budget across 6 rounds: ~13,000-15,000 Cash if you play well, ~11,000-12,000 if you have poor rounds. This is your total spending pool for the entire BO7.</p>`,
      },
      {
        heading: 'The loss bonus is not a free win',
        html: `<p>The most-debated Stadium economy concept is the loss bonus. Losing a round pays ~70-80% of what winning pays. New players see this and think "if I throw R1 for the loss bonus, I can come back stronger in R2." This is wrong.</p>
<p>Three reasons the loss bonus trap loses you the match:</p>
<ul>
  <li><strong>Power lead compounds.</strong> The winning team picks their R1 Power first (or in parallel). Their R1 Power kicks in for R2. Yours kicks in R2 also, but they have momentum and you're rebuilding.</li>
  <li><strong>Cash gap is only ~1,000.</strong> That's 1× Common item. Not enough to flip a R2 fight on its own.</li>
  <li><strong>Mental tilt.</strong> Players who tell themselves "we'll come back" rarely do. The team that wins R1 picks confidently for R3; the losing team second-guesses.</li>
</ul>
<p>The correct read: play R1 to win. If you lose, take the bonus and adapt — but don't throw rounds intentionally for it. The cash differential isn't worth the comp/Power lead.</p>`,
      },
      {
        heading: 'When to save vs spend per round',
        html: `<p>Every round-end you face a save-or-spend decision. Here's the framework:</p>
<ul>
  <li><strong>R1 → R2:</strong> Spend ~70% of R1 Cash on Common Items. Save 500-1,000 for R2 top-up.</li>
  <li><strong>R2 → R3:</strong> Spend full. Buy 1× Rare in your primary stat. R2 is your first power spike.</li>
  <li><strong>R3 → R4:</strong> If under 3,000 Cash on hand, spend. If over 5,000, save toward R5 Epic. The middle ground (3,000-5,000) — buy a Rare in your secondary stat.</li>
  <li><strong>R4 → R5:</strong> Save toward R5 Epic. Buy at most 1× Common. This is the "spend feels wrong" round but pays off in R5-R7.</li>
  <li><strong>R5 → R6:</strong> Spend on Epic. Whatever's left, buy Commons in your secondary stat.</li>
  <li><strong>R6 → R7:</strong> Spend ALL remaining Cash. Unspent Cash is forfeited at match end. Even on suboptimal Commons, spend it.</li>
</ul>`,
      },
      {
        heading: 'Power-spike rounds — when fights become unfair',
        html: `<p>A "power spike" is a round where your hero's effective strength jumps because a Power unlocked + the Items finally clicked. Power-spike rounds win 70%+ even against equally-skilled opponents.</p>
<ul>
  <li><strong>R3 spike:</strong> Your R3 Power unlocks. If it synergizes with your R1-R2 Item stack, you're at first peak power. Otherwise R3 is rebuild.</li>
  <li><strong>R5 spike:</strong> Epic Items + R5 Power. This is the biggest spike in Stadium — most heroes hit their "fun build" here. Win R5, win the BO7.</li>
  <li><strong>R7 spike:</strong> R7 Power locks in. For heroes like Tracer (Pulse Maelstrom) or Ana (Mother), this is a round-winning shift in raw power.</li>
</ul>
<p>Identifying YOUR hero's spike round changes how you play earlier rounds. If your spike is R5 (Tracer, Ana), play conservatively in R3-R4 to make sure you reach R5. If your spike is R3 (Reinhardt, Soldier base), play aggressive earlier to close out fast.</p>`,
      },
      {
        heading: 'Reading the enemy economy — when they\'re forced into bad buys',
        html: `<p>You can roughly estimate enemy team Cash by tracking round outcomes + their visible Items. Useful reads:</p>
<ul>
  <li><strong>Enemy is on a 2-round loss streak.</strong> They have higher loss-bonus Cash than your team — expect them to hit a power spike a round earlier.</li>
  <li><strong>Enemy tank has only Common Items visible at R4.</strong> They\'re behind. Push fights before R5 — they can\'t out-build you yet.</li>
  <li><strong>Enemy DPS has Epic Items at R3.</strong> They threw R1 for loss bonus (mistake) or got Round MVP bonus (skilled). Either way, expect a strong R4 from them.</li>
</ul>
<p>This isn't perfectly readable mid-match (you can't see full enemy builds), but the visible Items + round outcomes give you enough to estimate. At Diamond+ Stadium, players check enemy loadouts in the spawn-room cycle between rounds — make this a habit.</p>`,
      },
      {
        heading: 'Final-round economy — the R7 endgame',
        html: `<p>If the match reaches R7, both teams are evenly matched at 3-3. The R7 decision is purely economy + Power synergy:</p>
<ul>
  <li><strong>Spend EVERY Cash dollar.</strong> Even on Commons. Even on stats you don\'t need.</li>
  <li><strong>Don\'t buy your secondary stat — buy MORE of your primary.</strong> R7 is one round. You want max impact for that one round, not balanced longevity.</li>
  <li><strong>If down 3-0 on Power slots,</strong> don\'t buy a stat your R7 Power doesn\'t use. Buy Armor instead — survive longer, contribute more on objective.</li>
  <li><strong>Sell mismatched Items for the rebuy fee.</strong> R7 is the round where the 25% sell penalty is most worth eating.</li>
</ul>
<p>R7 economy is the most punishing for hoarders. Top Stadium players enter R7 with ≤1,000 banked Cash, buy aggressively, and trust the build. Players who hoard 3,000+ "in case" lose R7 to a team that fully kitted out.</p>`,
      },
    ],
    mistakes: [
      'Throwing Round 1 for the loss bonus — comp/Power lead beats ~1,000 Cash bonus.',
      'Saving Cash through Rounds 4-5 for an Epic you never actually buy.',
      'Spending evenly across two primary stats instead of single-vector building.',
      'Entering Round 7 with 2,000+ unspent Cash — it\'s forfeited at match end.',
      'Not reading enemy economy via visible Items + round outcomes — you\'re flying blind on power-spike timing.',
    ],
    drill: {
      heading: 'Drill: 5-match Cash tracking regimen',
      html: `<ul>
  <li><strong>Match 1:</strong> Write down your Cash at the start of every round (post-round payout). Track total across the match.</li>
  <li><strong>Match 2:</strong> Same, but also note enemy visible Items per round. Practice estimating their Cash.</li>
  <li><strong>Match 3:</strong> Force yourself to enter R7 with ≤500 Cash. Spend whatever R5-R6 paid out fully.</li>
  <li><strong>Match 4-5:</strong> Identify YOUR hero\'s power spike round and adjust earlier-round spending to maximize that spike.</li>
</ul>
<p>After 5 matches you\'ll have a working economy intuition. Most players can\'t tell you their R3 Cash balance without checking — you\'ll be able to estimate within 500.</p>`,
    },
    aiVodMention: `<p>The <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> flags economy mistakes per match — e.g., "you held 3,200 Cash going into Round 7 — that\'s a wasted Epic upgrade." Useful when you suspect builds are letting you down but can\'t tell whether it\'s your Powers, your Items, or your Cash management.</p>`,
    relatedLinks: [
      { name: 'OW2 Stadium Guide — Builds, Powers & Economy', url: '/blog/ow2-stadium-guide.html' },
      { name: 'OW2 Stadium Tier List — Best Heroes Per Role', url: '/blog/ow2-stadium-tier-list.html' },
      { name: 'OW2 Stadium Items Guide — When to Buy What', url: '/blog/ow2-stadium-items-guide.html' },
      { name: 'How to Climb from Diamond to Master in OW2', url: '/blog/ow2-diamond-to-master.html' },
      { name: 'Recon 6 OW2 Loadouts', url: '/#/loadouts' },
    ],
    readMinutes: 10,
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
    aiVodMention: `<p>If you can't tell why specific squad fights feel off, the <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> reads your replays and flags positioning + rotation mistakes per squad fight.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/apex-silver-to-gold.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Apex Storm Point Guide', url: '/games/apex/storm-point.html' },
      { name: 'Apex World\'s Edge Guide', url: '/games/apex/worlds-edge.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> tracks squad cohesion (distance between teammates during fights) and flags rounds where the squad split into solo plays.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/apex-bronze-to-silver.html' },
      { name: 'How to Climb from Gold to Plat', url: '/blog/apex-gold-to-plat.html' },
      { name: 'Apex Storm Point Guide', url: '/games/apex/storm-point.html' },
      { name: 'Apex World\'s Edge Guide', url: '/games/apex/worlds-edge.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> can flag rounds where you committed to fights without ult-chain support — useful for spotting the decisions that lost the round.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/apex-silver-to-gold.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Apex Olympus Guide', url: '/games/apex/olympus.html' },
      { name: 'Apex Broken Moon Guide', url: '/games/apex/broken-moon.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> tracks your engagement decisions across matches and flags the rounds where you fought a battle you couldn't win — useful for catching the Plat plateau pattern of "engaging on instinct."</p>`,
    relatedLinks: [
      { name: 'How to Climb from Gold to Plat', url: '/blog/apex-gold-to-plat.html' },
      { name: 'How to Climb from Diamond to Master', url: '/blog/apex-diamond-to-master.html' },
      { name: 'Apex Storm Point Guide', url: '/games/apex/storm-point.html' },
      { name: 'Apex World\'s Edge Guide', url: '/games/apex/worlds-edge.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> can flag the rounds where you took an unfavorable engagement that didn't fit the match script — particularly useful for spotting the Diamond plateau of "engaging on instinct" that Master macro discipline solves.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Plat to Diamond', url: '/blog/apex-plat-to-diamond.html' },
      { name: 'How to Climb from Master to Predator', url: '/blog/apex-master-to-pred.html' },
      { name: 'Apex Olympus Guide', url: '/games/apex/olympus.html' },
      { name: 'Apex Storm Point Guide', url: '/games/apex/storm-point.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> compares your decision patterns against ALGS-tier reads — particularly useful for finding the rounds where you knew the right call but committed to the wrong one. The exact pattern that separates Master plateau from Predator ceiling.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Diamond to Master', url: '/blog/apex-diamond-to-master.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Apex Storm Point Guide', url: '/games/apex/storm-point.html' },
      { name: 'Apex Olympus Guide', url: '/games/apex/olympus.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> reads your replays and flags ult-coordination mistakes per team fight.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/mvr-silver-to-gold.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'MVR Tokyo 2099 Guide', url: '/games/mvr/shin-shibuya.html' },
      { name: 'MVR Yggsgard Guide', url: '/games/mvr/yggdrasill-path.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> can flag rounds where your hero pick contradicted team comp synergy. Useful for spotting the games where your team had 4 Duelists and you didn't swap to fill — a common Silver-to-Gold mistake that's invisible without an outside review.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/mvr-bronze-to-silver.html' },
      { name: 'How to Climb from Gold to Plat', url: '/blog/mvr-gold-to-plat.html' },
      { name: 'MVR Tokyo 2099 Guide', url: '/games/mvr/shin-shibuya.html' },
      { name: 'MVR Yggsgard Guide', url: '/games/mvr/yggdrasill-path.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> compares your in-match adaptations against pro-tier patterns — flags rounds where you should have swapped comp but didn't. Particularly useful for spotting whether your team's comp synergized with the map's archetype on each round, or whether you ran the same comp regardless.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/mvr-silver-to-gold.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'MVR Tokyo 2099 Guide', url: '/games/mvr/shin-shibuya.html' },
      { name: 'MVR Wakanda Guide', url: '/games/mvr/birnin-tchalla.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> tracks your hero-swap timing and team-up combo usage across matches. Useful for spotting the Plat plateau pattern of "stuck on main hero through whole match" that Diamond mid-fight swaps solve.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Gold to Plat', url: '/blog/mvr-gold-to-plat.html' },
      { name: 'How to Climb from Diamond to GM', url: '/blog/mvr-diamond-to-gm.html' },
      { name: 'MVR Tokyo 2099 Guide', url: '/games/mvr/shin-shibuya.html' },
      { name: 'MVR Yggsgard Guide', url: '/games/mvr/yggdrasill-path.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> compares your in-match adaptation patterns against tier-1 reads — flags rounds where you should have swapped comp but didn't. The Diamond plateau pattern that GM macro discipline solves. Recon 6 also reads ult timing across the full match — useful for spotting whether your healing-ult anticipation actually beats the enemy damage ult window.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Plat to Diamond', url: '/blog/mvr-plat-to-diamond.html' },
      { name: 'How to Climb from GM to Celestial', url: '/blog/mvr-gm-to-celestial.html' },
      { name: 'MVR Tokyo 2099 Guide', url: '/games/mvr/shin-shibuya.html' },
      { name: 'MVR Wakanda Guide', url: '/games/mvr/birnin-tchalla.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p>At Celestial, gaps are subtle. <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> compares your in-match adaptation against tournament-tier patterns — flags rounds where you should have switched comp but didn't.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Diamond to GM', url: '/blog/mvr-diamond-to-gm.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'MVR Tokyo 2099 Guide', url: '/games/mvr/shin-shibuya.html' },
      { name: 'MVR Yggsgard Guide', url: '/games/mvr/yggdrasill-path.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> reads your replays and flags positioning + grenade timing mistakes per round.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/halo-silver-to-gold.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Halo Aquarius Guide', url: '/games/halo/aquarius.html' },
      { name: 'Halo Live Fire Guide', url: '/games/halo/live-fire.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> tracks your power weapon contest win rate and flags rounds where the rotation broke down. Useful for spotting the maps where you consistently lose the Sniper contest — usually a positioning issue you can fix once you know which map's contest you're losing.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/halo-bronze-to-silver.html' },
      { name: 'How to Climb from Gold to Plat', url: '/blog/halo-gold-to-plat.html' },
      { name: 'Halo Recharge Guide', url: '/games/halo/recharge.html' },
      { name: 'Halo Streets Guide', url: '/games/halo/streets.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> compares your decision patterns against pro-tier reads for power weapon contests. Particularly useful for finding the rounds where you contested a power weapon solo when your team was 30+ meters away — the most common Plat-tier mistake that costs games to Onyx-tier opponents.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/halo-silver-to-gold.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Halo Bazaar Guide', url: '/games/halo/bazaar.html' },
      { name: 'Halo Empyrean Guide', url: '/games/halo/empyrean.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> tracks your power weapon contest win rate per map and flags rounds where the rotation broke down. Useful for spotting which maps have the worst contest win rates so you can study them specifically.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Gold to Plat', url: '/blog/halo-gold-to-plat.html' },
      { name: 'How to Climb from Diamond to Onyx', url: '/blog/halo-diamond-to-onyx.html' },
      { name: 'Halo Aquarius Guide', url: '/games/halo/aquarius.html' },
      { name: 'Halo Live Fire Guide', url: '/games/halo/live-fire.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> compares your decision patterns against HCS-tier reads for power weapon contests + spawn flips. Useful for finding the rounds where you missed a spawn flip your team should have called.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Plat to Diamond', url: '/blog/halo-plat-to-diamond.html' },
      { name: 'How to Climb from Onyx to Champion', url: '/blog/halo-onyx-to-champion.html' },
      { name: 'Halo Recharge Guide', url: '/games/halo/recharge.html' },
      { name: 'Halo Empyrean Guide', url: '/games/halo/empyrean.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> compares your decision patterns against HCS-tier reads round-by-round. Particularly useful for finding the rounds where you knew the right call but committed to the wrong one — the exact pattern separating Onyx plateau from Champion ceiling.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Diamond to Onyx', url: '/blog/halo-diamond-to-onyx.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Halo Bazaar Guide', url: '/games/halo/bazaar.html' },
      { name: 'Halo Empyrean Guide', url: '/games/halo/empyrean.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> reads your replays and flags squad-coordination mistakes per fight.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Gold to Plat', url: '/blog/finals-gold-to-plat.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'The Finals Las Vegas Guide', url: '/games/finals/las-vegas.html' },
      { name: 'The Finals Monaco Guide', url: '/games/finals/monaco.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> compares your Defib timing against pro-tier patterns. Useful for spotting rounds where your Defib was wasted on full-HP teammates or saved too late after a wipe — both are common Plat-tier mistakes that don't show up in standard kill-cam review.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/finals-bronze-to-silver.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'The Finals Seoul Guide', url: '/games/finals/seoul.html' },
      { name: 'The Finals Kyoto Guide', url: '/games/finals/kyoto.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> tracks your kit usage timing across matches and flags rounds where the engage was uncoordinated. Useful for spotting Silver-tier "3 solo plays" patterns vs Gold-tier synced engagements.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/finals-bronze-to-silver.html' },
      { name: 'How to Climb from Gold to Plat', url: '/blog/finals-gold-to-plat.html' },
      { name: 'The Finals Las Vegas Guide', url: '/games/finals/las-vegas.html' },
      { name: 'The Finals Monaco Guide', url: '/games/finals/monaco.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> compares your Defib timing against pro-tier patterns. Useful for spotting rounds where your Defib was wasted on full-HP teammates or saved too late after a wipe.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Gold to Plat', url: '/blog/finals-gold-to-plat.html' },
      { name: 'How to Climb from Diamond to Ruby', url: '/blog/finals-diamond-to-ruby.html' },
      { name: 'The Finals Seoul Guide', url: '/games/finals/seoul.html' },
      { name: 'The Finals Kyoto Guide', url: '/games/finals/kyoto.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p>At Ruby, gaps are subtle. <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> compares your decision patterns against tournament-tier reads — flags rounds where you knew the right call but committed to the wrong one. The Diamond plateau pattern that Ruby macro discipline solves.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Plat to Diamond', url: '/blog/finals-plat-to-diamond.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'The Finals Las Vegas Guide', url: '/games/finals/las-vegas.html' },
      { name: 'The Finals Bernal Guide', url: '/games/finals/bernal.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> reads your replays and flags positioning + recoil mistakes per match. Useful for spotting whether your tap-fire discipline holds at long range or breaks down under pressure — the distinction between Bronze and Silver-tier aim consistency.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Plat to Diamond', url: '/blog/cod-plat-to-diamond.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'CoD Rebirth Island Guide', url: '/games/cod/rebirth-island.html' },
      { name: 'CoD Verdansk Guide', url: '/games/cod/verdansk.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> can compute your loadout-drop timing efficiency across matches.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/cod-bronze-to-silver.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'CoD Rebirth Island Guide', url: '/games/cod/rebirth-island.html' },
      { name: 'CoD Verdansk Guide', url: '/games/cod/verdansk.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> reads your replays and flags positioning + recoil mistakes per match. Useful for spotting whether your tap-fire discipline holds at long range or breaks down under pressure — the distinction between Silver and Gold-tier aim consistency.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/cod-bronze-to-silver.html' },
      { name: 'How to Climb from Gold to Plat', url: '/blog/cod-gold-to-plat.html' },
      { name: 'CoD Rebirth Island Guide', url: '/games/cod/rebirth-island.html' },
      { name: 'CoD Verdansk Guide', url: '/games/cod/verdansk.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> tracks anchor position win rates per map. Useful for spotting which maps have your worst hold percentages so you can study CDL pro positioning specifically for those maps.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/cod-silver-to-gold.html' },
      { name: 'How to Climb from Plat to Diamond', url: '/blog/cod-plat-to-diamond.html' },
      { name: 'CoD Rebirth Island Guide', url: '/games/cod/rebirth-island.html' },
      { name: 'CoD Verdansk Guide', url: '/games/cod/verdansk.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> compares your decision patterns against CDL-tier reads. Useful for finding the rounds where your killstreak banking decision was wrong (used too early or saved too late) — the exact macro pattern that separates Diamond plateau from Iridescent climb.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Plat to Diamond', url: '/blog/cod-plat-to-diamond.html' },
      { name: 'How to Climb from Iridescent to Top 250', url: '/blog/cod-iri-to-top250.html' },
      { name: 'CoD Rebirth Island Guide', url: '/games/cod/rebirth-island.html' },
      { name: 'CoD Verdansk Guide', url: '/games/cod/verdansk.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p>At Top 250 the gaps are subtle. <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> compares your decision patterns against CDL-tier reads round-by-round. Useful for finding the rounds where you knew the right call but committed to the wrong one — the exact pattern separating Iridescent plateau from Top 250 ceiling.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Diamond to Iridescent', url: '/blog/cod-diamond-to-iri.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'CoD Rebirth Island Guide', url: '/games/cod/rebirth-island.html' },
      { name: 'CoD Verdansk Guide', url: '/games/cod/verdansk.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> reads your replays and flags positioning + healing-timing mistakes per match. Particularly useful for catching the rounds where you healed in the open and got punished — the most common Bronze-tier death pattern in Zero Build.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Plat to Diamond', url: '/blog/fn-plat-to-diamond.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Fortnite Map Guide', url: '/games/fn/current-chapter.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
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
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> can flag rounds where your endgame positioning broke down. Useful for finding the specific Ring 4 decisions that lost you the game — high-ground neglect, mobility item hoarding, or pushing first into crystal endgame are common Plat-tier patterns the review surfaces.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/fn-bronze-to-silver.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Fortnite Map Guide', url: '/games/fn/current-chapter.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
]

// ============================================================================
// FORTNITE GAP POSTS (4)
// ============================================================================
const FN_POSTS_GAPS = [
  {
    game: 'fn',
    gameLabel: 'Fortnite Zero Build',
    fromRank: 'Silver',
    toRank: 'Gold',
    slug: 'fn-silver-to-gold',
    metaTitle: 'How to Climb from Silver to Gold in Fortnite Zero Build (2026 Guide)',
    metaDescription: 'Fortnite Zero Build Silver-to-Gold — squad coordination, audio cues, sensitivity setup, mobility item discipline, and zone rotation timing.',
    intro: `<p>Silver in Zero Build means you can edge-drop, loot, and survive Ring 3. Gold demands squad coordination, audio cue tracking, sensitivity tuning, and mobility item usage that turns rotations into engagements. The Silver-to-Gold leap is layering the small habits on top of the foundational ones — not a single mechanical fix but a stack of fundamentals that compounds across rotations.</p>`,
    sections: [
      { heading: 'Squad coordination in trio queue', html: `<p>If you queue trios, coordinate basic tactics:</p>
<ul>
  <li>Designate roles — 1 IGL caller, 1 fragger, 1 support.</li>
  <li>Drop together — split-drops lose 70% of fights.</li>
  <li>Heal together — Chug Splash heals all 3 in radius. Use it.</li>
  <li>Voice calls: "Pushing together, 3, 2, 1." NOT "should we push?"</li>
</ul>
<p>Bronze trios are 3 solo players. Gold trios coordinate basic engages on a count.</p>` },
      { heading: 'Audio cues — footsteps and reload sounds', html: `<p>Fortnite Zero Build audio:</p>
<ul>
  <li>Footsteps: directional + distance.</li>
  <li>Healing sound: enemy is mid-heal for 3-10s. Push for the kill.</li>
  <li>Reload sound: enemy is reloading. Push the trade.</li>
  <li>Storm closing sound: zone damage starting; rotate now.</li>
  <li>Drop sound (boxes / chests): enemy looting — they're stuck for 2-3 seconds.</li>
</ul>
<p>Crank footstep volume to 100. Wear good headphones.</p>` },
      { heading: 'Sensitivity and FOV setup', html: `<p>Fortnite Zero Build benefits from tuned settings:</p>
<ul>
  <li>ADS sensitivity: 0.8x multiplier of hipfire. Slower ADS = more accurate snipes.</li>
  <li>Hipfire sensitivity: medium-fast (test in Creative).</li>
  <li>FOV: 100+ on PC. Wider = better awareness.</li>
  <li>Crosshair color: bright cyan or yellow. Avoid red.</li>
</ul>
<p>Bronze players use defaults. Silver players tune. Spend a session in Creative dialing in.</p>` },
      { heading: 'Mobility item discipline', html: `<p>Mobility items break engagements:</p>
<ul>
  <li><strong>Crash Pad:</strong> bounce up high. Use for retreat or surprise high-ground take.</li>
  <li><strong>Launch Pad:</strong> long-range rotation. Use for zone repositioning.</li>
  <li><strong>Shockwave Grenade:</strong> instant escape from a fight you're losing.</li>
  <li><strong>Boogie Bomb:</strong> disable enemy for 5 seconds — round-winning.</li>
</ul>
<p>Silver players save mobility "for emergencies" and never use them. Gold players use them in every fight.</p>` },
      { heading: 'Zone rotation timing', html: `<p>Fortnite zone phases:</p>
<ul>
  <li>Ring 1 (5 min): loot.</li>
  <li>Ring 2 (3 min): rotate to zone center.</li>
  <li>Ring 3-4 (2 min each): commit to defensible terrain.</li>
  <li>Final ring: high ground + cover.</li>
</ul>
<p>Silver runs zone damage. Gold pre-rotates by Ring 2 with positioning advantage.</p>` },
      { heading: 'Pre-aim common angles', html: `<p>Universal FPS fundamental: crosshair at head height. Walk through every POI with crosshair pre-aimed at standard fight angles. Most Silver players walk into rooms with crosshair at the floor and miss free kills.</p>` },
      { heading: 'Healing rotation discipline', html: `<p>Fortnite heals are sequenced:</p>
<ul>
  <li><strong>Mini Shield (lower priority):</strong> use for fast partial shield top-up.</li>
  <li><strong>Big Shield Pot:</strong> use to top up to full shields.</li>
  <li><strong>Med Kit:</strong> full health regen, 10 seconds slow heal.</li>
  <li><strong>Chug Splash:</strong> instant team heal during fights — use it in trio queue.</li>
</ul>
<p>Heal in cover, never in the open. Silver players heal in the open and get punished. Gold players heal behind cover and reset the fight on full HP.</p>` },
      { heading: 'Drop spot strategy at Silver', html: `<p>Silver drops still tend toward hot zones. Edge-drop pattern:</p>
<ul>
  <li>Land at named POIs but in edge buildings (corners, not the center).</li>
  <li>Loot full kit: shotgun + AR + sniper + 2 heal items + 1 mobility.</li>
  <li>Push contested zones AFTER most teams have died.</li>
</ul>
<p>The 30-second loot window of an edge drop wins more games than fragging at the contested center.</p>` },
      { heading: 'Buy round / loot priority order', html: `<p>Silver loadouts are inconsistent. The order:</p>
<ol>
  <li>Shotgun (Hammer Pump or Frenzy) — 200 HP burst.</li>
  <li>AR (Striker or Tactical) — mid-range damage.</li>
  <li>Heals (2+ Med Kits or 4 Bandages).</li>
  <li>Sniper / DMR (optional) — long-range threat.</li>
  <li>Mobility item — Crash Pad or Launch Pad.</li>
</ol>
<p>Without shotgun + heals, you can't win 1v1s. Gold players hit this loadout by Ring 2 every game.</p>` },
      { heading: 'Trade-fragging in trio fights', html: `<p>Two-on-one duels win Zero Build fights. The trade fragger:</p>
<ul>
  <li>Stays within 5m of the entry.</li>
  <li>Has line-of-sight to the entry's target angle.</li>
  <li>Has crosshair pre-aimed at head height.</li>
  <li>Doesn't reload at the same time the entry's pushing.</li>
</ul>
<p>If your teammate dies in the doorway, you peek the SAME doorway from a slightly different angle within 2 seconds. The enemy just used recoil cooldown — your trade kill is free.</p>` },
    ],
    mistakes: [
      '3 IGLs in trio.',
      'Audio at default volume.',
      'Default sensitivity / FOV.',
      'Saving mobility items unused.',
      'Running zone damage.',
      'Crosshair at chest height.',
      'Healing in the open.',
      'Random loot priorities.',
      'Hot-dropping with random builds.',
      'Trade-fragger too far back.',
    ],
    drill: { heading: 'Drill: 5-game role-locked trio + Creative warm-up', html: `<p>If you queue with a 3-stack, designate roles pre-match. Play 5 games role-locked. Track win rate.</p><p>Before each session, 15 min Creative aim courses (search "Aim Trainer Zero Build" maps). Warm up shotgun headshots + AR tracking. By session 5 the warm-up + role coordination compounds into a +10% win rate.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> reads your replays and flags positioning + healing-timing mistakes per match.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/fn-bronze-to-silver.html' },
      { name: 'How to Climb from Gold to Plat', url: '/blog/fn-gold-to-plat.html' },
      { name: 'Fortnite Map Guide', url: '/games/fn/current-chapter.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
  {
    game: 'fn',
    gameLabel: 'Fortnite Zero Build',
    fromRank: 'Gold',
    toRank: 'Platinum',
    slug: 'fn-gold-to-plat',
    metaTitle: 'How to Climb from Gold to Plat in Fortnite Zero Build (2026 Guide)',
    metaDescription: 'Fortnite Zero Build Gold-to-Plat — endgame positioning, third-party reads, loot loadout priorities, mobility chain rotations, and ranked queue veto.',
    intro: `<p>Gold in Zero Build means you have squad coordination + audio cues. Plat demands endgame positioning, third-party reads, optimized loot loadouts, and chained mobility item rotations that out-position 80% of opponents. The Gold-to-Plat leap is converting individual mechanics into squad-level macro decisions where most close-range fights are won or lost by who has high-ground first.</p>`,
    sections: [
      { heading: 'Endgame positioning — high ground + cover', html: `<p>By Ring 4, the zone has 4-5 squads. The team holding high ground with cover wins. Specifics:</p>
<ul>
  <li>Take a ridge or building roof — height advantage forces enemies uphill.</li>
  <li>Have at least one cover object (rock, tree) within 5m for disengage.</li>
  <li>If zone closes onto a flat, use Crash Pad or Launch Pad to claim high ground first.</li>
</ul>
<p>Gold squads fight on flat. Plat squads take elevation 60+ seconds before zone forces.</p>` },
      { heading: 'Third-party reads', html: `<p>Plat enemies will lurker-flank. Reads:</p>
<ul>
  <li>If a fight has 2 visible enemies, the 3rd is flanking.</li>
  <li>Audio cue from behind = lurker. Reposition immediately.</li>
  <li>Watch the kill feed for nearby fights — third squad arriving in 30s.</li>
</ul>
<p>Gold squads get flanked 30%+ of fights. Plat squads less than 10%.</p>` },
      { heading: 'Loot loadout priorities', html: `<p>Plat loadouts are optimized:</p>
<ul>
  <li><strong>Hammer Pump Shotgun</strong> (S-tier CQB).</li>
  <li><strong>Striker AR</strong> (S-tier mid-range).</li>
  <li><strong>Heisted Sniper</strong> (S-tier long-range).</li>
  <li>2 Big Shield Pots + 1 Med Kit + 1 Chug Splash.</li>
  <li>1 Mobility item (Crash Pad or Launch Pad).</li>
</ul>
<p>If you don't have this loadout by Ring 3, swap into it from looted players. Gold plays with random loadouts; Plat optimizes mid-match.</p>` },
      { heading: 'Mobility chain rotations', html: `<p>Plat squads chain mobility for fast cross-map rotations:</p>
<ul>
  <li>Crash Pad → Launch Pad: free 200m rotation in 5 seconds.</li>
  <li>Shockwave Grenade: land safely from height — escape engagements.</li>
  <li>Boogie Bomb in clutch 1v1: disables enemy for 5s, free kill.</li>
</ul>
<p>Gold saves mobility "for emergencies." Plat uses them as standard rotation method.</p>` },
      { heading: 'Crystal endgame — final 2-3 squads', html: `<p>Crystal endgame: 2-3 squads, ring closing fast. Specifics:</p>
<ul>
  <li>Don't push first — let others contest.</li>
  <li>If you have a sniper, hold high ground for picks.</li>
  <li>If you have shockwave + Boogie, save for the final 1v1.</li>
</ul>
<p>The team landing the first knock in crystal endgame wins 70%+ of placements.</p>` },
      { heading: 'Ranked queue veto strategy', html: `<p>Fortnite Zero Build doesn't have map veto in the traditional sense, but you can pick when to queue. Specifics:</p>
<ul>
  <li>Queue at off-peak hours for less sweaty lobbies.</li>
  <li>Track win rate by chapter section / event. If a special event mode tilts your style, skip it.</li>
  <li>Take session breaks if you tilt-stack 2 losses.</li>
</ul>
<p>Plat players are deliberate about when they queue. Gold players grind regardless of fatigue or tilt state.</p>` },
      { heading: 'Mental game and tilt management', html: `<p>Fortnite matches are 20+ minutes. One bad rotation can lose the game. Tilt management:</p>
<ul>
  <li>60-second mental reset between matches.</li>
  <li>If you tilt-stack 3 losses, stop for 30 minutes.</li>
  <li>Don't blame teammates in voice — kills team morale + own focus.</li>
  <li>Track session win rate. <40%, end session.</li>
</ul>
<p>Plat players reset; Gold players grind through tilt.</p>` },
      { heading: 'Pro VOD watching as practice', html: `<p>Watch one FNCS Zero Build pro tournament match per day. Pause every minute. Predict the call. By VOD 30 you'll absorb pro-tier endgame positioning patterns + rotation timing.</p>
<p>Recommended VODs: FNCS Zero Build finals, regional events. Avoid casual streamer content.</p>` },
      { heading: 'Sensitivity and FOV optimization', html: `<p>Plat players tune sensitivity beyond Gold defaults:</p>
<ul>
  <li>800-1600 DPI standard.</li>
  <li>Sensitivity in cm/360°: 30-50cm.</li>
  <li>FOV: max in-game.</li>
  <li>Crosshair: bright cyan or yellow. Avoid red.</li>
</ul>
<p>If you're using defaults, dial in over a session in Creative.</p>` },
      { heading: 'Spawn / drop pattern variation', html: `<p>Plat-tier squads vary their drop patterns:</p>
<ul>
  <li>If you've dropped same POI 3 games in a row, swap. Defenders learn your patterns.</li>
  <li>Pick drops based on bus path — early-bus drops vs late-bus drops change loot competition.</li>
  <li>Track which drops have your highest win rate; queue toward them.</li>
</ul>
<p>Gold squads drop the same POI every game. Plat squads vary based on bus + lobby reads.</p>` },
    ],
    mistakes: [
      'Fighting on flat ground in Ring 4.',
      'Saving mobility items unused.',
      'Random loot loadouts.',
      'No third-party reads.',
      'Pushing first in crystal endgame.',
      'No queue strategy (when to queue).',
      'Tilt-stacking matches.',
      'No pro VOD prep.',
      'Default sensitivity / FOV.',
      'Same drop POI every game.',
    ],
    drill: { heading: 'Drill: 5 ranked games tracking endgame positioning', html: `<p>5 ranked games. For each, focus on Ring 4 high-ground take. Did you claim elevation before zone forced? Did you use a mobility item to get there?</p><p>By game 5 the pre-positioning habit is automatic. Your placement bumps from "top 5" to "top 3" consistently.</p><p>Track per-game: Ring 4 high-ground claim time, third-party encounter count, mobility items used. Patterns emerge by game 3.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> can flag rounds where you committed to fights without high-ground positioning. Useful for finding the rounds where your placement was lost on macro, not aim.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/fn-silver-to-gold.html' },
      { name: 'How to Climb from Plat to Diamond', url: '/blog/fn-plat-to-diamond.html' },
      { name: 'Fortnite Map Guide', url: '/games/fn/current-chapter.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 10,
  },
  {
    game: 'fn',
    gameLabel: 'Fortnite Zero Build',
    fromRank: 'Diamond',
    toRank: 'Elite',
    slug: 'fn-diamond-to-elite',
    metaTitle: 'How to Climb from Diamond to Elite in Fortnite Zero Build (2026 Guide)',
    metaDescription: 'Fortnite Zero Build Diamond-to-Elite — pro VOD prep, mechanical aim consistency, FNCS-tier macro patterns, audio cue mastery, and tilt protocols.',
    intro: `<p>Diamond in Zero Build means you have endgame positioning + loadout discipline. Elite demands FNCS-tier macro patterns, mechanical aim consistency at the ceiling, and tilt protocols that convert close losses into close wins. At Diamond you survive to crystal endgame; at Elite you win it 50%+ of the time.</p>`,
    sections: [
      { heading: 'FNCS-tier macro patterns', html: `<p>Elite squads play 20-minute matches with a script:</p>
<ul>
  <li>0:00-3:00: drop, edge-loot, no engages unless forced.</li>
  <li>3:00-8:00: rotate to zone center, hold mid-game position.</li>
  <li>8:00-12:00: pre-position for Ring 4.</li>
  <li>12:00+: crystal endgame, mobility chain commits.</li>
</ul>
<p>Diamond squads play minute-by-minute. Elite squads play match-by-match with the script.</p>` },
      { heading: 'Mechanical aim consistency at the ceiling', html: `<p>Elite aim benchmarks per weapon class:</p>
<ul>
  <li>Hammer Pump Shotgun: 60%+ headshot rate at point-blank.</li>
  <li>Striker AR: 25%+ headshot rate at mid-range.</li>
  <li>Heisted Sniper: 50%+ headshot rate at any range.</li>
</ul>
<p>Daily aim regimen: 60 min Creative aim courses + 30 min ranked play with focus on shot quality. Track headshot rate weekly.</p>` },
      { heading: 'Audio cue mastery', html: `<p>Elite Zero Build audio:</p>
<ul>
  <li>Footstep distance: estimate enemy distance to within 5m.</li>
  <li>Heal sound: enemy stuck for 6s. Push.</li>
  <li>Reload + plate sound: free trade kill window.</li>
  <li>Storm sound: zone closing, time rotation.</li>
  <li>Vehicle / ATV sound: enemy traversing — pre-aim road junctions.</li>
</ul>
<p>Crank audio. Elite players track 5-6 cues simultaneously.</p>` },
      { heading: 'Pro VOD library at scale', html: `<p>By Elite, you should have absorbed 60+ specific FNCS patterns. Watch one match per day for 90 days. By day 90:</p>
<ul>
  <li>You auto-recognize standard endgame setups.</li>
  <li>You predict third-party arrivals.</li>
  <li>You know which loot routes win which maps.</li>
</ul>
<p>Recommended VODs: FNCS Globals, regional finals.</p>` },
      { heading: 'Tilt protocols and mental game', html: `<p>Fortnite matches are 20+ minutes. Tilt-stacking 2 losses is the Diamond plateau killer:</p>
<ul>
  <li>60-second mental reset between matches.</li>
  <li>If you tilt-stack 2 placements outside top 5, stop for 30 minutes.</li>
  <li>Don't review kill cam past first 5 seconds — distracts from current game.</li>
</ul>
<p>Elite players reset; Diamond players grind tilt and lose more.</p>` },
      { heading: 'Sensitivity and FOV at the ceiling', html: `<p>Elite players tune sensitivity:</p>
<ul>
  <li>800-1600 DPI standard.</li>
  <li>Sensitivity in cm/360°: 30-50cm.</li>
  <li>FOV: max in-game.</li>
  <li>Crosshair: bright cyan or yellow.</li>
</ul>
<p>If you're using defaults, dial in over a week.</p>` },
      { heading: 'Squad role designation', html: `<p>Elite trios designate roles:</p>
<ul>
  <li>IGL: makes engage / disengage calls.</li>
  <li>Fragger: takes first contact.</li>
  <li>Support: heals + revives + drone scouts.</li>
</ul>
<p>Diamond trios fight as 3 IGLs. Elite trios have one IGL whose calls everyone follows.</p>` },
      { heading: 'Endgame loadout optimization', html: `<p>Elite squads optimize loadouts mid-match:</p>
<ul>
  <li>By Ring 2, every player has S-tier shotgun + AR + sniper.</li>
  <li>If a teammate dies, salvage their kit if better than yours.</li>
  <li>Carry only 1 mobility item; don't waste slot.</li>
  <li>2 Big Shield Pots in inventory minimum at all times.</li>
</ul>
<p>Diamond players keep whatever loot they grabbed. Elite players actively swap up to optimal loadouts every fight.</p>` },
      { heading: 'Pro player habits — common patterns', html: `<p>Pro Zero Build players share habits:</p>
<ul>
  <li>Always full heal between fights, even if it costs 10 seconds of looting.</li>
  <li>Always carry a sniper for endgame, even on close-range builds.</li>
  <li>Mobility items used proactively, not reserved for emergencies.</li>
  <li>Pre-aim every corner at head height.</li>
</ul>
<p>Mimic these patterns. Pro habits at Diamond → Elite is the bridge.</p>` },
      { heading: 'Crystal endgame mastery', html: `<p>Crystal endgame in Zero Build: 2-3 squads, ring closing fast. Elite-tier:</p>
<ul>
  <li>Don't push first — let other squads contest.</li>
  <li>Position on highest available ground with cover.</li>
  <li>Save Boogie Bomb / Shockwave for final 1v1.</li>
  <li>Pre-aim known rotation paths from each adjacent squad.</li>
</ul>
<p>Elite squads convert top-3 placements to wins 50%+ of the time. Diamond converts 30%.</p>` },
    ],
    mistakes: [
      'Match macro by feel, not script.',
      'Aim ceiling at Diamond benchmarks.',
      'Audio at default volume.',
      'Pro VOD library at 20 patterns, not 60+.',
      'Tilt-stacking matches.',
      'Default sensitivity / FOV.',
      'No squad role designation.',
      'No mid-match loadout swap.',
      'Mobility items reserved for emergencies.',
      'Pushing first in crystal endgame.',
    ],
    drill: { heading: 'Drill: 90-day FNCS-VOD-per-day + aim regimen', html: `<p>90 days of 60 min daily aim + 1 FNCS match per day. By day 90 you have a 60+ pattern library AND your aim is at Elite benchmarks.</p><p>Track weekly: shotgun headshot rate, AR tracking percentage, sniper accuracy at long range. If numbers plateau before day 90, fix sensitivity or technique before continuing.</p>` },
    aiVodMention: `<p><a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> compares your in-match decisions against FNCS-tier reads. Useful for finding the rounds where your endgame positioning broke down — the macro pattern that separates Diamond plateau from Elite climb. Particularly useful for spotting whether your mobility chain rotations were proactive or reactive.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Plat to Diamond', url: '/blog/fn-plat-to-diamond.html' },
      { name: 'How to Climb from Elite to Champion', url: '/blog/fn-elite-to-champion.html' },
      { name: 'Fortnite Map Guide', url: '/games/fn/current-chapter.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 10,
  },
  {
    game: 'fn',
    gameLabel: 'Fortnite Zero Build',
    fromRank: 'Elite',
    toRank: 'Champion',
    slug: 'fn-elite-to-champion',
    metaTitle: 'How to Climb from Elite to Champion in Fortnite Zero Build (2026 Guide)',
    metaDescription: 'Fortnite Zero Build Elite-to-Champion — top-1% mental game, mechanical aim at the ceiling, FNCS-tier macro patterns at scale, and queue strategy.',
    intro: `<p>Elite is high-elo Zero Build. Champion is top 1%. The gap is mental discipline at the high-pressure rounds, mechanical aim at the absolute ceiling, and FNCS-tier macro patterns absorbed from 90+ days of pro VOD review. The Champion plateau is mental more than mechanical — most plateaued Elite players have the aim and game sense; they lose 4-match streaks to tilt.</p>`,
    sections: [
      { heading: 'Top-1% mental discipline', html: `<p>Champion matches are 20+ minutes of high-pressure decisions. Mental discipline:</p>
<ul>
  <li>2-second mental reset between deaths. Same crosshair, same default position.</li>
  <li>If you tilt-stack 2 matches, stop session.</li>
  <li>Don't blame teammates — Champion teams solve, Elite teams blame.</li>
  <li>Track session win rate. Below 50%, end session.</li>
</ul>
<p>The reset discipline separates Champion consistency from Elite volatility.</p>` },
      { heading: 'Champion-tier aim benchmarks', html: `<p>Specific aim benchmarks:</p>
<ul>
  <li>Shotgun: 65%+ headshot rate at point-blank.</li>
  <li>AR: 28%+ headshot rate at mid-range.</li>
  <li>Sniper: 55%+ headshot rate at any range.</li>
  <li>SMG: 30%+ headshot rate in CQB.</li>
</ul>
<p>Daily aim regimen: 90 min Creative aim courses + ranked match warm-up. Track weekly.</p>` },
      { heading: 'FNCS-tier macro at scale', html: `<p>By Champion you should have absorbed 100+ specific FNCS patterns. Watch one match per day for 90 days. By day 90:</p>
<ul>
  <li>You auto-recognize standard endgame loot routes.</li>
  <li>You predict third-party arrivals 30+ seconds before they happen.</li>
  <li>You read crystal endgame positioning 60+ seconds before zone close.</li>
</ul>
<p>Recommended VODs: FNCS Globals finals, regional finals from past 2 years.</p>` },
      { heading: 'Sensitivity and FOV optimization', html: `<p>Champion players tune sensitivity:</p>
<ul>
  <li>800-2400 DPI standard.</li>
  <li>Sensitivity in cm/360°: 25-40cm.</li>
  <li>FOV: max in-game.</li>
</ul>
<p>If you're using defaults, dial in over a week.</p>` },
      { heading: 'Queue strategy and session management', html: `<p>Champion players treat queue as a strategic decision:</p>
<ul>
  <li>Queue at off-peak hours (less sweaty lobbies, faster placement gains).</li>
  <li>Don't queue tilted — track session state.</li>
  <li>Practice in Creative before queueing if you haven't warmed up.</li>
</ul>
<p>Elite players grind regardless of state. Champion players are deliberate.</p>` },
      { heading: 'Crystal endgame mastery', html: `<p>Crystal endgame in Zero Build: 2-3 squads, ring closing. Champion-tier:</p>
<ul>
  <li>Don't push first — let other squads contest.</li>
  <li>Position on highest available ground with cover.</li>
  <li>Save Boogie Bomb / Shockwave for final 1v1.</li>
  <li>Pre-aim known rotation paths from each adjacent squad.</li>
</ul>
<p>Champion squads convert top-3 placements to wins 50%+ of the time. Elite converts 30%.</p>` },
      { heading: 'Tilt protocols at high-pressure rounds', html: `<p>Late-game tilt is the Elite plateau killer. Specific protocols:</p>
<ul>
  <li>4-second box breath between matches. Heart rate from 95+ BPM to 70 BPM.</li>
  <li>If you lose 2 placements outside top 5, stop session.</li>
  <li>Don't review kill cam past first 5 seconds.</li>
</ul>
<p>Champion+ players have these protocols. Elite players grind through tilt and lose more.</p>` },
      { heading: 'Communication discipline at top tier', html: `<p>Champion comms are short and decisive:</p>
<ul>
  <li>"Pushing on count, 3, 2, 1."</li>
  <li>"Snipe in cover, save."</li>
  <li>"Their squad low, push." / "Falling back, smoke me."</li>
</ul>
<p>NOT commentary. Information only — what changes a teammate's decision.</p>` },
      { heading: 'Reading enemy patterns across the match', html: `<p>By the mid-game you should have read at least 3 patterns from any squad you contested:</p>
<ul>
  <li>Their preferred drop spot (predictable).</li>
  <li>Their rotation routes (do they fly directly, or take side paths?).</li>
  <li>Their engagement style (third-party heavy vs straight-fight).</li>
</ul>
<p>Champion squads track enemies and call counter-rotations. Elite squads play their own game.</p>` },
      { heading: 'Pro player habits at the ceiling', html: `<p>Champion-tier player habits:</p>
<ul>
  <li>Heal between every fight, even mid-rotation.</li>
  <li>Pre-aim every doorway at head height — no exceptions.</li>
  <li>Use mobility items proactively (every fight), not reactively (emergencies).</li>
  <li>Pre-rotate 90+ seconds before zone close.</li>
  <li>Track session win rate; end session below 50%.</li>
</ul>
<p>Elite players have most of these. Champion players have all of them, every match, every round.</p>` },
    ],
    mistakes: [
      'Tilt-stacking matches.',
      'Aim ceiling at Elite benchmarks instead of Champion.',
      'Pro VOD library at 50 patterns, not 100+.',
      'Default sensitivity / FOV.',
      'No queue strategy.',
      'Crystal endgame engaged on instinct, not script.',
      'No tilt protocols.',
      'Comms full of commentary, not decisions.',
      'No enemy pattern tracking.',
      'Reactive mobility item use.',
    ],
    drill: { heading: 'Drill: 90-day FNCS pro VOD + aim regimen', html: `<p>90 days of 90 min daily aim + 1 FNCS match per day. By day 90 you have a 100-pattern library AND your aim is at Champion benchmarks. Track weekly: headshot rate per weapon, top-3 placement rate, session win rate.</p><p>If aim numbers plateau at Elite benchmarks for 4+ weeks, the issue is sensitivity, ergonomics, or technique. Get a coach review or try a sensitivity audit (compare to pro players' eDPI numbers).</p>` },
    aiVodMention: `<p>At Champion the gaps are subtle. <a href="${SITE_URL}/#/vod">Recon 6 AI VOD review</a> compares your decision patterns against FNCS-tier reads. Useful for finding the rounds where you knew the right call but committed to the wrong one — the exact pattern separating Elite plateau from Champion ceiling.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Diamond to Elite', url: '/blog/fn-diamond-to-elite.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Fortnite Map Guide', url: '/games/fn/current-chapter.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 11,
  },
]

// ============================================================================
// ROCKET LEAGUE POSTS (7)
// ============================================================================
// RL ranks: Bronze → Silver → Gold → Platinum → Diamond → Champion → GC → SSL.
// Voice anchors on real mechanics (ball cam, half-flip, speedflip, fast aerial,
// flip reset, musty flick, air dribble, etc.). Avoids "AI VOD" language —
// uses "Pro reviews your screenshots" framing instead per content brief.
const RL_POSTS = [
  {
    game: 'rl',
    gameLabel: 'Rocket League',
    fromRank: 'Bronze',
    toRank: 'Silver',
    slug: 'rl-bronze-to-silver',
    metaTitle: 'How to Climb from Bronze to Silver in Rocket League (2026)',
    metaDescription: 'Rocket League Bronze-to-Silver — ball cam fundamentals, basic positioning, flip stop habits, and the kick-off setup that wins half your starts.',
    intro: `<p>Bronze is where everyone starts after placements. You're not bad — you don't have ball cam dialed yet and you're chasing the ball instead of reading it. The Bronze-to-Silver gap closes the moment ball cam becomes default. Here's exactly what to fix, in order.</p>`,
    sections: [
      {
        heading: 'Ball cam is on by default — every second',
        html: `<p>The single most important Bronze habit is ball cam. Hold the ball cam toggle (default: spacebar on PC, right stick click on controller) so your camera is locked on the ball at all times. Most Bronze players camera-toggle by accident and end up looking the wrong way.</p>
<ul>
  <li>Set ball cam to <strong>toggle</strong>, not hold. Hit it once at the kickoff. Don't release.</li>
  <li>The only time to break ball cam: when you're going for boost in a known-safe spot, or you've just hit the ball and need to read what's behind you.</li>
  <li>If you ever feel "lost" — ball cam is off. Toggle it back on. Don't argue with yourself.</li>
</ul>
<p>Ball cam alone is worth ~200 MMR. Most Silvers have it, most Bronzes don't.</p>`,
      },
      {
        heading: 'Basic positioning — first man, second man, last man',
        html: `<p>RL is 3v3 by default (1v1, 2v2, and 3v3 all have ranked queues, but 3v3 is the standard). Bronze teammates all chase the ball; Silver teammates use rotation positions:</p>
<ul>
  <li><strong>First man:</strong> closest to the ball, attacking it.</li>
  <li><strong>Second man:</strong> midfield, ready to follow up if first man misses.</li>
  <li><strong>Last man:</strong> defending the goal, on your back wall.</li>
</ul>
<p>If two of you go for the ball at the same time, you're double-committing — that's the #1 way to give up easy goals at Bronze. If you see a teammate going, fall back to second man.</p>`,
      },
      {
        heading: 'Flip stop — stop dodge-flipping into walls',
        html: `<p>Every Bronze player double-jumps and flips into every challenge. You give up momentum, you stall in the air, and you lose your dodge for 1.5 seconds. The Silver habit: flip <em>only</em> when you're going to make contact with the ball.</p>
<ul>
  <li>Save your flip for the ball touch, not the approach. Sprint into challenges with boost, not flip.</li>
  <li>If you flip and miss, you're a sitting duck. The opponent reads it and counters.</li>
  <li>The exception: flipping to recover from a 90° angle (half-flip) or for distance on a long forward roll. Learn those last.</li>
</ul>`,
      },
      {
        heading: 'Kick-off basics — pick a position and commit',
        html: `<p>RL kickoffs are 30% of your goals. Bronze players hesitate on kickoff and lose 50/50 fights. Pick one of these kickoff types and use it every time:</p>
<ul>
  <li><strong>Speed kickoff:</strong> drive straight, hold boost, no flip. Wins on contact 70% of the time.</li>
  <li><strong>Flip kickoff:</strong> drive forward, flip into the ball at the last second. Adds power to your hit.</li>
  <li><strong>Diagonal kickoff:</strong> if you're back-left/right, drive diagonally for a wider angle.</li>
</ul>
<p>Commit to one and run it for a week. Don't change kickoff strategies every match.</p>`,
      },
      {
        heading: 'Boost management — small pads, not 100 boost',
        html: `<p>Bronze players boost-rush every 100-pad and run out of boost in 5 seconds. Silver players grab <strong>small pads</strong> (12 boost each) constantly along the way. The map has 28 small pads — they're free boost.</p>
<ul>
  <li>Never drive in a straight line. Curve through small pads.</li>
  <li>Don't take the 100 boost in your own corner if your teammate is defending — that's their boost, not yours.</li>
  <li>30+ boost is enough for most plays. You don't need 100 to shoot.</li>
</ul>`,
      },
      {
        heading: 'Don\'t commit to challenges you can\'t win',
        html: `<p>Bronze players boost into every challenge. The opponent's already in position with boost, you crash in, lose the 50/50, and they score on an open net. The Silver habit: <strong>if you can't win the challenge, don't take it</strong>.</p>
<ul>
  <li>If the opponent has boost and you don't, fall back. Let them touch first, then challenge.</li>
  <li>If your teammate is in position to challenge, you go second man.</li>
  <li>"Fake challenges" — drive at the ball but break off — bait the opponent into a flip they can't recover from.</li>
</ul>`,
      },
    ],
    mistakes: [
      'Ball cam off most of the match.',
      'Double-committing with a teammate.',
      'Flip-dodging into every approach.',
      'Hesitating on kickoff — getting outpaced.',
      'Boost-rushing 100 pads only.',
      'Challenging without boost or position.',
      'Camping in front of the goal.',
    ],
    drill: {
      heading: 'Drill: Free Play, 15 minutes of ball cam + small pads',
      html: `<p>Hit Training → Free Play. Spend 15 minutes driving around the field, ball cam locked on, only grabbing small pads. Don't touch the ball. Goal: ball cam becomes invisible. By the end you'll instinctively look at the ball, even when grabbing pads behind you. Repeat daily for a week.</p>`,
    },
    aiVodMention: `<p>Stuck on the same mistake every match? Drop a screenshot from your last ranked game — <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews your screenshots</a> and tells you exactly which mechanic is capping your rank. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/rl-silver-to-gold.html' },
      { name: 'How to Climb from Gold to Platinum', url: '/blog/rl-gold-to-platinum.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Rocket League Home', url: '/games/rl/' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 6,
  },
  {
    game: 'rl',
    gameLabel: 'Rocket League',
    fromRank: 'Silver',
    toRank: 'Gold',
    slug: 'rl-silver-to-gold',
    metaTitle: 'How to Climb from Silver to Gold in Rocket League (2026)',
    metaDescription: 'Rocket League Silver-to-Gold — rotation basics, the no-double-commit rule, half-flip recovery, and boost economy that wins 3v3 trades.',
    intro: `<p>Silver means ball cam is locked in and your kickoffs aren't disasters. Gold demands real rotation, half-flip recovery, and boost economy. The Silver-to-Gold climb is about playing as a team, not three forwards trying to score the same goal.</p>`,
    sections: [
      {
        heading: 'Rotation basics — clockwise around the field',
        html: `<p>RL rotation is a clockwise (or counter-clockwise) cycle through three positions. After you hit the ball, you rotate back to second man. After the next teammate hits, they rotate back. The cycle never breaks.</p>
<ul>
  <li><strong>1st man hits ball → rotates back to 3rd man (last man).</strong></li>
  <li><strong>2nd man becomes 1st man → goes for the next touch.</strong></li>
  <li><strong>3rd man (you, post-hit) becomes 2nd man on the next cycle.</strong></li>
</ul>
<p>The mistake at Silver: people rotate <em>through the center of the field</em>. Wrong. Rotate <strong>through the corners</strong>. Cut across mid only if you have no boost and need to grab a small pad fast.</p>`,
      },
      {
        heading: 'The no-double-commit rule',
        html: `<p>If your teammate is going for the ball with momentum, you do not also go. You will:</p>
<ul>
  <li>Bump them, killing their shot.</li>
  <li>Take their boost.</li>
  <li>Leave a gaping hole behind you.</li>
</ul>
<p>The cue: if your teammate is closer to the ball <em>and</em> facing it, they're going. You fall back to second man. Spam the "I got it" quick chat <strong>before</strong> you commit, not after.</p>`,
      },
      {
        heading: 'Half-flip recovery — backwards-into-forwards in 1.2 seconds',
        html: `<p>The half-flip is the first "intermediate" RL mechanic and the single highest-impact one for Silver-to-Gold. It lets you rotate backwards (after defending a shot) into forwards motion in 1.2 seconds, instead of doing a 3-second arc turn.</p>
<ul>
  <li>Reverse-drive backwards.</li>
  <li>Hit jump → diagonal back stick → second jump → cancel the flip by pulling the stick forward.</li>
  <li>You land facing forward, sprinting.</li>
</ul>
<p>Practice this in Free Play for 10 minutes a day for a week. Once it's muscle memory, your recoveries are twice as fast — that's the difference between getting back in goal in time or watching the open-net tap-in.</p>`,
      },
      {
        heading: 'Boost economy — never below 30',
        html: `<p>Gold players manage boost like a budget. Specifics:</p>
<ul>
  <li>Never go into a challenge with under 30 boost. You can't recover, you can't follow up.</li>
  <li>Grab the corner 100 only when you're rotating back — never as a detour during attack.</li>
  <li>Small pads on your rotation path are free. Always curve through them.</li>
  <li>If you're at 0 boost in your defensive third, your job is to be a wall, not chase the ball.</li>
</ul>`,
      },
      {
        heading: 'First-touch shots — directional power',
        html: `<p>Bronze and Silver players hit the ball wherever they happen to be aimed. Gold players aim their first touch:</p>
<ul>
  <li>If you're approaching from your offensive third, aim your touch <strong>toward the goal</strong>, not straight up.</li>
  <li>Use the corner of your car to push the ball cross-net — this is a "directional touch," not a dribble.</li>
  <li>If you can't shoot, push the ball to the opponent's corner to set up a teammate.</li>
</ul>`,
      },
      {
        heading: 'Reading teammates — fast-chat shortcuts',
        html: `<p>RL quick chat is your comm system. Memorize four:</p>
<ul>
  <li>"I got it!" — committing to the ball.</li>
  <li>"Take the shot!" — passing or letting them have it.</li>
  <li>"Defending!" — you're going back, they can push.</li>
  <li>"Nice one!" — positive comm builds momentum. Don't toxic-chat.</li>
</ul>
<p>The bind: set "I got it" and "Defending" to your most reachable buttons. Spam them every play.</p>`,
      },
    ],
    mistakes: [
      'Rotating through the middle of the field.',
      'Double-committing on every offensive play.',
      'No half-flip — slow recoveries from defense.',
      'Going into challenges with 5 boost.',
      'Random first-touch direction.',
      'No quick chat — your team has no idea what you\'re doing.',
    ],
    drill: {
      heading: 'Drill: Workshop Half-Flip + Rotation (Free Play)',
      html: `<p>Free Play, 10 minutes daily for a week: 50 half-flips off the back wall, then run the rotation cycle solo (drive corner → mid → corner → repeat). By day 7 your half-flip lands clean every time and your rotation muscle memory feels automatic. This is the single highest-value drill at Silver.</p>`,
    },
    aiVodMention: `<p>If your rotations feel right but you keep losing — <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews your screenshots</a> and tells you exactly which mechanic is capping your rank. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Bronze to Silver', url: '/blog/rl-bronze-to-silver.html' },
      { name: 'How to Climb from Gold to Platinum', url: '/blog/rl-gold-to-platinum.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Rocket League Home', url: '/games/rl/' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 7,
  },
  {
    game: 'rl',
    gameLabel: 'Rocket League',
    fromRank: 'Gold',
    toRank: 'Platinum',
    slug: 'rl-gold-to-platinum',
    metaTitle: 'How to Climb from Gold to Platinum in Rocket League (2026)',
    metaDescription: 'Rocket League Gold-to-Plat — power slide cornering, fast aerial inputs, wave-dash recovery, defensive positioning, and ball-cam toggling.',
    intro: `<p>Gold is where mechanics start mattering. You have rotation down; now you need aerial control, wave-dash recovery, and power-slide cornering. The Gold-to-Plat jump is the first real "skill" climb — opponents stop crashing into each other and start setting up actual plays.</p>`,
    sections: [
      {
        heading: 'Power slide cornering — sharp turns without slowing down',
        html: `<p>Bronze and Silver players brake to turn. Gold players power-slide:</p>
<ul>
  <li>Hold the power-slide button (default: square / X) while turning. Your car slides instead of decelerating.</li>
  <li>Use power-slides for cornering at speed — turning around the back wall, cutting through midfield without losing momentum.</li>
  <li>Don't power-slide on straightaways; you'll just lose grip.</li>
</ul>
<p>Practice: in Free Play, drive in figure-8s around two boost pads. Hold power-slide on every corner. By minute 30 it's muscle memory.</p>`,
      },
      {
        heading: 'Fast aerial inputs — jump + boost order',
        html: `<p>A "fast aerial" is the basic aerial mechanic at Plat+. You hit jump, then <em>immediately</em> press boost while pulling back on the stick. The order:</p>
<ol>
  <li>Jump (single tap).</li>
  <li>Hold boost.</li>
  <li>Pull back on the stick to pitch your nose up.</li>
  <li>Once airborne, double-jump if you need extra height.</li>
</ol>
<p>The trick is the speed of the jump→boost transition. Goal: under 0.1s. Practice this in Free Play with the "AirRoll Right" workshop map or just by aerialing the ball off the ground 50 times in a row.</p>`,
      },
      {
        heading: 'Wave-dash recovery — landing into momentum',
        html: `<p>When you land from an aerial, you usually lose your dodge and stall. A wave-dash is a dodge while landing that converts the landing into forward momentum:</p>
<ul>
  <li>Just before landing, pull back on the stick and dodge (jump while in the air).</li>
  <li>Your car lands flat with momentum equivalent to a flip.</li>
  <li>Use this after every aerial that doesn't end in a save.</li>
</ul>
<p>Wave-dash recoveries shave 1-2 seconds off every aerial play. At Plat that's the difference between getting back in goal or watching the rebound goal.</p>`,
      },
      {
        heading: 'Defensive positioning — back post, not mid net',
        html: `<p>Most Gold defenders camp the center of the goal. Plat defenders park on the <strong>far post</strong> (opposite side from where the ball is coming from):</p>
<ul>
  <li>If ball is on left wing, you sit back-right post.</li>
  <li>This denies the cross-net shot, which is 70% of Plat goals.</li>
  <li>You can drive forward to defend a center shot — you can't drive sideways to defend a cross.</li>
</ul>
<p>This single positioning shift wins half your defenses. Don't camp mid-net.</p>`,
      },
      {
        heading: 'Ball-cam toggling — strategic, not constant',
        html: `<p>At Plat you're allowed to break ball cam — but strategically:</p>
<ul>
  <li>Ball cam OFF when you're collecting boost and need to read your surroundings.</li>
  <li>Ball cam OFF when recovering after an aerial — you need to land facing forward.</li>
  <li>Ball cam ON every other moment.</li>
</ul>
<p>The pattern: ball cam on by default, toggle off for max 1-2 seconds, then back on. If you forget to toggle back on for 5+ seconds, you're playing blind.</p>`,
      },
      {
        heading: 'Reading the rebound — anticipate, don\'t react',
        html: `<p>Plat play involves a lot of save → rebound → save cycles. Plat defenders anticipate the rebound direction based on the incoming shot angle:</p>
<ul>
  <li>Incoming shot from left = rebound bounces right. Pre-rotate to the right.</li>
  <li>If the shot is dead-center, rebound bounces back at the shooter. They get a follow-up — challenge them before they recover.</li>
  <li>If the shot is along the wall, rebound bounces on a wall track — pre-position on the wall.</li>
</ul>`,
      },
    ],
    mistakes: [
      'Braking to turn instead of power-sliding.',
      'Slow jump → boost transitions (>0.3s).',
      'No wave-dash recoveries — flat landings.',
      'Camping mid-net on defense.',
      'Ball cam constantly off, then constantly on — no rhythm.',
      'Reacting to rebounds instead of anticipating.',
    ],
    drill: {
      heading: 'Drill: Workshop Aerial Training (Beginner pack)',
      html: `<p>Search "Aerial Training - Beginner" in custom training. 50 shots per day for a week. Goal: hit 35+/50 by day 7. Combines fast aerial + ball direction + recovery in one practice loop. Pair with 10 minutes of figure-8 power-slides in Free Play. By the end of the week the mechanics are loaded.</p>`,
    },
    aiVodMention: `<p>Mechanics feel locked but you keep getting outplayed? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews your screenshots</a> and tells you exactly which mechanic is capping your rank. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Silver to Gold', url: '/blog/rl-silver-to-gold.html' },
      { name: 'How to Climb from Plat to Diamond', url: '/blog/rl-platinum-to-diamond.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Rocket League Home', url: '/games/rl/' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 7,
  },
  {
    game: 'rl',
    gameLabel: 'Rocket League',
    fromRank: 'Platinum',
    toRank: 'Diamond',
    slug: 'rl-platinum-to-diamond',
    metaTitle: 'How to Climb from Platinum to Diamond in Rocket League (2026)',
    metaDescription: 'Rocket League Plat-to-Diamond — speedflip kickoff intro, aerial control (yaw, pitch, roll), backboard reads, possession holding, no panic clears.',
    intro: `<p>Plat is where you have mechanics — fast aerial, half-flip, wave-dash, power-slide. Diamond is where mechanics become accuracy. Speedflip kickoffs win the contest before it starts, aerial control means hitting the upper 90 instead of the goalie's hood, and possession-holding stops giving the ball back. The Plat-to-Diamond climb is precision.</p>`,
    sections: [
      {
        heading: 'Speedflip kickoff — the Diamond-tier kickoff',
        html: `<p>The speedflip is the fastest possible kickoff in RL. It uses a diagonal flip with a roll to convert the flip into supersonic-speed forward motion before the ball arrives.</p>
<ul>
  <li>Hold boost from start.</li>
  <li>Around 1.5 seconds in, flip diagonally forward-right (or left).</li>
  <li>Air-roll opposite during the flip to flatten your car.</li>
  <li>Land facing forward, sprinting, hit the ball at supersonic.</li>
</ul>
<p>This wins ~70% of kickoffs against non-speedflip players. Drill it in the "Speedflip Trainer" workshop map. Goal: clean speedflip 8/10 attempts before queueing ranked.</p>`,
      },
      {
        heading: 'Aerial control — yaw, pitch, roll',
        html: `<p>Diamond aerials are 3D-controlled — yaw (left/right), pitch (forward/back), and roll (rotate around your axis). Plat players use only pitch. Diamond players use all three:</p>
<ul>
  <li><strong>Yaw:</strong> stick left/right in the air. Rotates your car horizontally.</li>
  <li><strong>Pitch:</strong> stick forward/back. Tips your nose up/down.</li>
  <li><strong>Roll:</strong> shoulder buttons (or AirRoll right/left). Rotates around your axis.</li>
</ul>
<p>Practice "Aerial Hits" custom training pack. Focus on hitting the corners of the goal, not the center. Yaw + pitch combinations let you redirect the ball mid-air.</p>`,
      },
      {
        heading: 'Backboard reads — clearing rebounds proactively',
        html: `<p>Plat games are full of backboard rebounds — the ball hits your back wall and bounces back into play. Plat players panic-clear; Diamond players read the bounce:</p>
<ul>
  <li>Watch the angle the ball hit the backboard. Steep = bounces forward fast. Shallow = bounces high and slow.</li>
  <li>Pre-position to <strong>catch</strong> the rebound on the dribble, not just clear it.</li>
  <li>If you can catch the rebound and turn it into a fast counter, you flip momentum.</li>
</ul>
<p>This shift — from clearing to catching — is the single biggest possession upgrade at Plat→Diamond.</p>`,
      },
      {
        heading: 'Possession holding — dribbling on the hood',
        html: `<p>A hood dribble keeps the ball on your car's hood, letting you control where it goes. Basics:</p>
<ul>
  <li>Get the ball on your hood by hitting it gently from below.</li>
  <li>Drive forward at medium speed. Pitch slightly down to keep the ball balanced.</li>
  <li>Use micro-jumps to keep the ball alive.</li>
</ul>
<p>You don't need flicks yet — that's Champion-tier. You just need to hold possession for 2-3 seconds before passing or shooting. Holding possession denies the opponent counter-play.</p>`,
      },
      {
        heading: 'No panic clears — make a decision',
        html: `<p>Diamond defenders don't panic-clear. They decide:</p>
<ul>
  <li><strong>Pass to a teammate</strong> via a directional clear (aim toward open midfield).</li>
  <li><strong>Convert to a counter</strong> by catching the ball on the hood (see above).</li>
  <li><strong>Boost-clear high</strong> only as a last resort, never as default.</li>
</ul>
<p>The panic clear gives the ball straight back to the opponent in their offensive third. Diamond defense is decisive, not panicked.</p>`,
      },
      {
        heading: 'Wall reads — coming off the wall with momentum',
        html: `<p>RL fields have wall-driving. Diamond players use the wall offensively:</p>
<ul>
  <li>Drive up the side wall to gain speed for an aerial approach.</li>
  <li>Use the wall to dodge a challenge — drive up, jump off the wall, redirect.</li>
  <li>Wall plays are unpredictable for opponents who fixate on ground play.</li>
</ul>
<p>Practice in Free Play: drive up the wall, jump off, hit the ball mid-air. By rep 50 it feels natural.</p>`,
      },
      {
        heading: 'Mental — accept the loss streak',
        html: `<p>Diamond is the first rank where tilt-stacking matters. Specific:</p>
<ul>
  <li>If you lose 3 ranked in a row, stop. Take 10 minutes off.</li>
  <li>Don't blame teammates in chat — it's a 50% solo-queue. Quick-chat positive only.</li>
  <li>Track session win rate. End sessions above 50%.</li>
</ul>`,
      },
    ],
    mistakes: [
      'Standard flip kickoffs (lose to speedflips 70% of the time).',
      'Only using pitch in aerials — flat shots.',
      'Panic-clearing every backboard rebound.',
      'No hood dribble — every touch goes back to opponent.',
      'Random clears with no direction.',
      'Tilt-stacking 5+ losses.',
    ],
    drill: {
      heading: 'Drill: Workshop Speedflip Trainer + 100 aerial reps daily',
      html: `<p>Search "Speedflip Trainer" in workshop maps (BakkesMod required on PC, custom training on console). 100 speedflip attempts per day for two weeks. Track success rate. Goal: 80%+ clean speedflips by week 2. Pair with the "Aerial Shots Intermediate" custom training pack — 50 reps daily. By week 2 the speedflip + aerial accuracy combo is loaded.</p>`,
    },
    aiVodMention: `<p>Speedflip won't lock in? Aerials still inconsistent? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews your screenshots</a> and tells you exactly which mechanic is capping your rank. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Gold to Platinum', url: '/blog/rl-gold-to-platinum.html' },
      { name: 'How to Climb from Diamond to Champion', url: '/blog/rl-diamond-to-champion.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Rocket League Home', url: '/games/rl/' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
  {
    game: 'rl',
    gameLabel: 'Rocket League',
    fromRank: 'Diamond',
    toRank: 'Champion',
    slug: 'rl-diamond-to-champion',
    metaTitle: 'How to Climb from Diamond to Champion in Rocket League (2026)',
    metaDescription: 'Rocket League Diamond-to-Champion — speedflip mastery, advanced aerial mechanics, rotation discipline, boost denial, and callout discipline.',
    intro: `<p>Diamond means mechanics are functional — your speedflip lands, your aerials hit clean, your defense is decisive. Champion is where mechanics meet macro. Rotation becomes discipline, boost denial becomes strategy, and "going" / "rotate" callouts replace random chat. The Diamond-to-Champion climb is the leap from "I can hit shots" to "I make my team better."</p>`,
    sections: [
      {
        heading: 'Speedflip mastery — every kickoff, every time',
        html: `<p>At Diamond, your speedflip lands 80% of the time. At Champion, 95%+. The difference is consistency under pressure:</p>
<ul>
  <li>Practice speedflips after losing — when you're tilted. That's when Champion players still land them.</li>
  <li>Mix in diagonal-left and diagonal-right speedflips so you can read the opponent's kickoff direction and counter.</li>
  <li>If you're on a back-corner kickoff, use the "corner speedflip" — same mechanic, different angle.</li>
</ul>
<p>Lose the kickoff = give up 30% of round outcomes. Champion = win the kickoff every time.</p>`,
      },
      {
        heading: 'Advanced aerial mechanics — air dribble starter, fast aerial reads',
        html: `<p>Champion-tier aerials introduce the air-dribble starter — holding the ball on your car's roof while flying through the air:</p>
<ul>
  <li>Hit the ball gently into the air at a low angle. Stick to it with boost from below.</li>
  <li>Use micro-stick movements to keep the ball balanced on your roof.</li>
  <li>Once you're set up, you can shoot or pass at 2x normal speed.</li>
</ul>
<p>The air dribble is a Champion-tier offensive mechanic. You don't need to master it — but knowing when an opponent is setting one up (and when to challenge it) is the defensive skill that wins games.</p>`,
      },
      {
        heading: 'Rotation discipline — no exceptions',
        html: `<p>Diamond rotations are 80% correct; Champion rotations are 95%. The discipline:</p>
<ul>
  <li>Every touch → rotate back to last man immediately. No exceptions.</li>
  <li>If you double-touch (hit ball twice in a row), you've made a critical rotation error.</li>
  <li>If teammate hits ball, you become second man IMMEDIATELY — don't wait to see what happens.</li>
</ul>
<p>This is the macro-skill that separates Diamond from Champion. Mechanics are equal at this level — discipline wins.</p>`,
      },
      {
        heading: 'Boost denial — control the map\'s economy',
        html: `<p>Champion players don\'t just grab their own boost — they deny the opponent's:</p>
<ul>
  <li>If the enemy's nearest 100 boost is open and you can grab it on your rotation, take it. Even if you don't need it.</li>
  <li>If you see an opponent low on boost in midfield, drive at them — force them off their pad.</li>
  <li>Track who has boost. The team with more boost wins 70% of trades.</li>
</ul>
<p>Boost denial is a Champion-tier concept that doesn't show up in highlights — but it's why some Champions seem to always have boost while their opponents are stuck on small pads.</p>`,
      },
      {
        heading: 'Callouts — "going" and "rotate"',
        html: `<p>Champion-tier comm is just two words:</p>
<ul>
  <li>"Going" — bound to your most reachable button. Spam it any time you're committing to the ball.</li>
  <li>"Rotate" — bound to a backup button. Use it when your teammate needs to fall back.</li>
</ul>
<p>Forget every other quick chat. These two prevent 90% of double-commits. Bind them, spam them, win 100 MMR.</p>`,
      },
      {
        heading: 'Reading shot setups — anticipate, don\'t react',
        html: `<p>Champion defenders read the setup, not the shot:</p>
<ul>
  <li>Ball on opponent\'s wing → they\'re setting up a cross. Pre-position center for the cross-net.</li>
  <li>Ball on opponent's back wall → they're setting up a backboard pass. Pre-position to catch.</li>
  <li>Opponent on the wall driving up → they're setting up an aerial. Pre-position high.</li>
</ul>
<p>Diamond defenders react to the shot. Champion defenders are already in position when the shot happens.</p>`,
      },
      {
        heading: 'Mid-air boost management',
        html: `<p>Champion aerials are boost-efficient. Tips:</p>
<ul>
  <li>Don't hold boost the entire aerial — pulse it in 0.2s bursts.</li>
  <li>Pitch up to gain height passively (gravity-vs-momentum trades).</li>
  <li>Land at 20+ boost so you can immediately re-aerial if needed.</li>
</ul>`,
      },
    ],
    mistakes: [
      'Inconsistent speedflip (>20% miss rate).',
      'Double-touching after challenges.',
      'No boost denial — letting opponent stockpile.',
      'Quick chat spam beyond "going" / "rotate."',
      'Reacting to shots instead of reading setups.',
      'Wasting boost on full-power aerials.',
    ],
    drill: {
      heading: 'Drill: Workshop Striker Drill 2.0 (60 mins daily)',
      html: `<p>Search "Striker Drill 2.0" in BakkesMod workshop maps (PC) or use the equivalent "Tournament Custom Training" pack on console. 60 minutes daily for 14 days. Drill covers speedflip, aerial accuracy, redirect shots, and rotation reads. Track shot conversion %. Goal: 60%+ shot conversion by day 14. Pair with one ranked-tournament VOD per day — watch how Champion-level players rotate after every touch.</p>`,
    },
    aiVodMention: `<p>Champion gap won\'t close? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews your screenshots</a> and tells you exactly which mechanic is capping your rank — often it's not mechanics but a rotation or boost-denial pattern. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Plat to Diamond', url: '/blog/rl-platinum-to-diamond.html' },
      { name: 'How to Climb from Champion to GC', url: '/blog/rl-champion-to-gc.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Rocket League Home', url: '/games/rl/' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
  {
    game: 'rl',
    gameLabel: 'Rocket League',
    fromRank: 'Champion',
    toRank: 'Grand Champion',
    slug: 'rl-champion-to-gc',
    metaTitle: 'How to Climb from Champion to Grand Champion in Rocket League (2026)',
    metaDescription: 'Rocket League Champion-to-GC — air dribble basics, advanced kickoff plays (fake-flip-cancel), pre-position vs reactive defense, and team comp coordination.',
    intro: `<p>Champion means rotations are disciplined, speedflips are consistent, and your defense is decisive. Grand Champion is where the air dribble enters your offense, kickoff mind games matter, and pre-positioning replaces reactive defense. This is the first rank where macro-strategy decides games more than mechanics.</p>`,
    sections: [
      {
        heading: 'Air dribble basics — sticking the ball to your roof',
        html: `<p>The air dribble is the signature GC-tier mechanic. You stick the ball to your car's roof and fly with it, controlling exactly where it goes:</p>
<ul>
  <li>Start with a low ball touch off the wall or off your own dribble.</li>
  <li>Aerial after the ball, getting underneath it.</li>
  <li>Hold boost lightly, use yaw + pitch to keep the ball balanced on your roof.</li>
  <li>Shoot or pass at maximum unpredictability.</li>
</ul>
<p>GC players don't need to land every air dribble — they need to <em>threaten</em> the air dribble so opponents fear it. The threat alone bends opponent positioning.</p>`,
      },
      {
        heading: 'Advanced kickoff plays — fake-flip-cancel',
        html: `<p>At GC, opponents read your speedflip. The counter: fake the flip, cancel it, change the kickoff line at the last second:</p>
<ul>
  <li>Begin the speedflip motion (jump + diagonal stick).</li>
  <li>Cancel the flip by pulling the stick the opposite way before the dodge fires.</li>
  <li>Boost forward without flipping — you arrive a fraction later but on an unexpected line.</li>
</ul>
<p>The fake-flip-cancel wins kickoffs against opponents expecting a standard speedflip — about 30% of GC matches. Use sparingly so opponents can't read the pattern.</p>`,
      },
      {
        heading: 'Pre-position vs reactive defense',
        html: `<p>Champion defenders react to where the ball goes. GC defenders pre-position before the opponent's touch:</p>
<ul>
  <li>Read the opponent's pre-touch body language. Are they coiled to flip? Going for power?</li>
  <li>Pre-rotate to where their shot is likely to go — not where the ball currently is.</li>
  <li>Position so you're already in the save spot before the shot is taken.</li>
</ul>
<p>This is anticipation, not reaction. GC defense looks effortless because they\'re already there. Champion defense is constant scrambling.</p>`,
      },
      {
        heading: 'Team comp coordination — pre-game setup',
        html: `<p>GC matches are won in lobby before the kickoff. Specifics:</p>
<ul>
  <li>If you\'re in a 3-stack: agree on roles (striker, mid, fixer/defender).</li>
  <li>Agree on kickoff cheats (one player goes for kickoff, others rotate to predict).</li>
  <li>Agree on quick-chat patterns (who calls "going," who supports).</li>
</ul>
<p>Random-queue at GC is a coinflip; 3-stack at GC is dominant. If you can find consistent teammates, your MMR jumps 100-200 immediately.</p>`,
      },
      {
        heading: 'Setting up the air dribble — the pass',
        html: `<p>Air dribble offense usually requires a setup pass. The pattern:</p>
<ul>
  <li>Teammate dribbles the ball into the corner.</li>
  <li>Teammate passes the ball off the back wall at a specific angle.</li>
  <li>You (set up off the wall) catch the ball mid-air on your roof.</li>
  <li>You air-dribble toward goal.</li>
</ul>
<p>This 2-touch setup is what separates GC offense from Champion. Champion duos rely on individual offense; GC duos chain plays.</p>`,
      },
      {
        heading: 'Wall reads at GC — wall-to-air-dribbles',
        html: `<p>GC players use the wall to set up air dribbles:</p>
<ul>
  <li>Drive up the wall toward the corner.</li>
  <li>Hit the ball off the wall at a low diagonal angle.</li>
  <li>Aerial off the wall, catch the ball, air-dribble.</li>
</ul>
<p>Practice in Free Play: 50 wall-to-air-dribble attempts daily. By rep 200 the timing is muscle memory.</p>`,
      },
      {
        heading: 'Mental — pro VOD pattern library',
        html: `<p>Champion-to-GC climb requires watching pro RL gameplay. Watch RLCS matches:</p>
<ul>
  <li>1 match per day, pause every minute. Predict what each player will do.</li>
  <li>Track 3 patterns per match (e.g., "pro X always pre-rotates on opponent kickoff fail").</li>
  <li>Build a 50-pattern library over 6 weeks.</li>
</ul>
<p>GC players have an internalized macro-library from pro VODs. Champion players play instinct.</p>`,
      },
    ],
    mistakes: [
      'No air-dribble threat — predictable offense.',
      'Only speedflip kickoff (opponent reads it).',
      'Reactive defense — constant scrambling.',
      'Random teammates, no role coordination.',
      'Individual offense, no 2-touch setups.',
      'No pro VOD library.',
    ],
    drill: {
      heading: 'Drill: BakkesMod Air-Dribble Trainer + 1 RLCS match/day',
      html: `<p>BakkesMod (PC) or custom training packs (console) — search "Air Dribble Single" pack. 50 reps daily for two weeks. Goal: 30/50 clean by day 14. Pair with 1 RLCS VOD per day — pause every minute and predict the play. By day 14 you have an air-dribble threat AND a 14-pattern pro library. That's the GC-tier package.</p>`,
    },
    aiVodMention: `<p>Air dribbles inconsistent? Pre-positioning still feels random? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews your screenshots</a> and tells you exactly which mechanic or read is capping your rank. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Diamond to Champion', url: '/blog/rl-diamond-to-champion.html' },
      { name: 'How to Climb from GC to SSL', url: '/blog/rl-gc-to-ssl.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Rocket League Home', url: '/games/rl/' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 10,
  },
  {
    game: 'rl',
    gameLabel: 'Rocket League',
    fromRank: 'Grand Champion',
    toRank: 'Supersonic Legend',
    slug: 'rl-gc-to-ssl',
    metaTitle: 'How to Climb from Grand Champion to Supersonic Legend in Rocket League (2026)',
    metaDescription: 'Rocket League GC-to-SSL — flip resets, musty flicks, pinch pass setups, frame-perfect mechanics, and tournament-level closeout discipline.',
    intro: `<p>Grand Champion is the top 5%. Supersonic Legend is the top 0.2% — the pro-adjacent rank. The GC-to-SSL climb is frame-perfect mechanics (flip resets, musty flicks, pinches) and tournament-level discipline. Every wasted boost pad costs MMR. Every panic touch costs a series. This is where mechanics become art.</p>`,
    sections: [
      {
        heading: 'Flip resets — regaining your flip in mid-air',
        html: `<p>The flip reset is the signature SSL mechanic. When you touch the ball with all four wheels, you reset your flip mid-air, letting you double-flip in a single aerial:</p>
<ul>
  <li>Aerial under the ball.</li>
  <li>Touch the ball with all four wheels (car upside down).</li>
  <li>Your flip resets — you have a fresh dodge.</li>
  <li>Use the second flip to power the shot.</li>
</ul>
<p>Flip resets are the SSL signature offensive mechanic. Practice in BakkesMod's "Flip Reset Training" pack — 100 reps daily for a month. By week 4 you'll land 1 in 10 in ranked. By month 3, 1 in 3.</p>`,
      },
      {
        heading: 'Musty flicks — the upside-down dodge',
        html: `<p>The musty flick is a dribble-shot variant that adds unpredictability:</p>
<ul>
  <li>Hood-dribble the ball.</li>
  <li>Just before shooting, pitch the car forward (nose-down) while jumping and dodging back.</li>
  <li>Your car flips backwards while the ball flicks forward at unexpected speed.</li>
</ul>
<p>Used by Musty (the YouTuber/pro). Hard to block because of the deceptive car motion. SSL goalkeepers prepare for it — but if you can chain a musty with a flip reset, you've broken through any defense.</p>`,
      },
      {
        heading: 'Pinch pass setups — wall pinches and corner pinches',
        html: `<p>A pinch is when two cars (or a car and the wall) compress the ball between them, sending it at 2-3x normal speed:</p>
<ul>
  <li><strong>Wall pinch:</strong> hit the ball into the wall at the exact moment the ball is touching the wall — sends it at 4000+ uu/s.</li>
  <li><strong>Corner pinch:</strong> two teammates hit the ball at the same instant from opposite angles.</li>
  <li><strong>Aerial pinch:</strong> hit the ball into a teammate driving up the wall.</li>
</ul>
<p>Pinches are SSL's main "1-touch goal" tool. Practice in Free Play. They're 30% setup, 70% timing.</p>`,
      },
      {
        heading: 'Frame-perfect mechanics — milliseconds matter',
        html: `<p>At SSL every input is timed to the frame:</p>
<ul>
  <li>Speedflips land at the exact 1.5s mark of kickoff.</li>
  <li>Flicks fire at the exact moment of dodge windup.</li>
  <li>Half-flips chain into wave-dashes for instant recovery.</li>
</ul>
<p>This requires obsessive practice. Most SSLs grind 4+ hours daily for years. If you're not willing to commit, you'll plateau at high GC.</p>`,
      },
      {
        heading: 'Tournament-level closeout discipline',
        html: `<p>At SSL, mechanics are equal. Games are won by closeout discipline:</p>
<ul>
  <li>When ahead by 1 in the final 2 minutes — do NOT take risks. Sit back, deny the opponent\'s offense, run the clock.</li>
  <li>When tied with 30s left — set up an air dribble OR force a kickoff with a deep clear.</li>
  <li>Overtime: first touch wins games. Pre-aim the kickoff line with conviction.</li>
</ul>
<p>Tournament-level players close games. SSLs who can\'t close stall at low SSL forever.</p>`,
      },
      {
        heading: 'Reading SSL-tier mindgames',
        html: `<p>SSL opponents bait you constantly:</p>
<ul>
  <li><strong>Fake challenges:</strong> they drive at the ball but break off, baiting your flip.</li>
  <li><strong>Fake aerials:</strong> they aerial without intent to touch — baiting you off the ground.</li>
  <li><strong>Fake possession:</strong> they dribble away from goal to bait you into chasing, then pass back to a teammate.</li>
</ul>
<p>The counter: don't react to opponent body language. React to actual ball touches and committed boost.</p>`,
      },
      {
        heading: 'Pro coaching — when to invest',
        html: `<p>At SSL the marginal improvements require expert guidance:</p>
<ul>
  <li>Get a 1-on-1 with a pro coach. Cost: $50-150/hr. 2-3 sessions is enough for a major tier-1 patterns review.</li>
  <li>Join an SSL community Discord. The replay sharing and pro feedback is invaluable.</li>
  <li>Watch RLCS Grand Finals VODs — every clip is SSL-tier macro.</li>
</ul>`,
      },
    ],
    mistakes: [
      'No flip-reset attempts in ranked.',
      'Predictable flicks — opponent reads them.',
      'No pinch awareness — wasted offensive opportunities.',
      'Speedflip timing off by 100ms+.',
      'Risky plays when ahead in final minutes.',
      'Falling for fake challenges and aerials.',
      'No pro coaching investment.',
    ],
    drill: {
      heading: 'Drill: BakkesMod Pro Training Pack (90 mins daily) + 1 RLCS VOD',
      html: `<p>BakkesMod\'s "Pro Training" pack: flip resets, musty flicks, pinch pass setups, double-touch aerials. 90 minutes daily for 60 days. Goal: land flip reset in ranked 1/3 attempts, pinch attempts 1/5, musty flicks 50%. Pair with 1 RLCS Grand Finals VOD per day, pausing every minute to predict the play. By day 60 you have a complete SSL-tier mechanical package AND a 60-clip pro pattern library. Most SSL climbers take 6-12 months at this drill volume; the consistency matters more than intensity.</p>`,
    },
    aiVodMention: `<p>SSL gap won\'t close? Mechanics solid but games slip away in closeout? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews your screenshots</a> and tells you exactly which mechanic, read, or closeout pattern is capping your rank. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'How to Climb from Champion to GC', url: '/blog/rl-champion-to-gc.html' },
      { name: 'Recon 6 Blog — All Rank-Up Guides', url: '/blog/' },
      { name: 'Rocket League Home', url: '/games/rl/' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 11,
  },
]

// ============================================================================
// LEAGUE OF LEGENDS POSTS (5)
// ============================================================================
// Pillar guide + tier list + itemization deep-dive + rank-up + top-lane
// matchup cluster. Cross-linked for topical authority. Targets ~480M MAU
// LoL TAM — biggest single-game audience on the platform.
const LOL_POSTS = [
  {
    game: 'lol', gameLabel: 'League of Legends', fromRank: 'Iron', toRank: 'Bronze',
    slug: 'lol-beginner-guide-2026',
    metaTitle: 'League of Legends Beginner Guide 2026 — Climb Out of Iron',
    metaDescription: 'LoL beginner guide for 2026: champion picks per role, last-hitting basics, lane phase fundamentals, jungle paths, objective control, and the 10 habits that get you to Bronze.',
    intro: `<p>If you've just hit Iron in League of Legends, the fastest way out isn't "play more games" — it's fixing four things: champion pool, last-hitting CS, map awareness, and objective priority. This guide covers the fundamentals that 90% of Iron players ignore. Read it once, drill the habits for two weeks, and Bronze is unavoidable.</p>`,
    sections: [
      { heading: 'Pick a small champion pool — not the whole roster', html: `<p>LoL has 165+ champions. You'll never get good at all of them. Pick three per role and stay there until you've played 30 games on each:</p>
<ul>
  <li><strong>Top:</strong> Garen (point-and-click silence, sustain) or Malphite (R AoE engage). Both forgiving, both winning at Iron.</li>
  <li><strong>Jungle:</strong> Warwick or Master Yi. Forgiving clears, kill pressure from level 6.</li>
  <li><strong>Mid:</strong> Annie (point-and-click stun, R AoE) or Garen (off-meta but works). Burst beats kiting at low elo.</li>
  <li><strong>ADC:</strong> Caitlyn (longest auto range, lane bully) or Miss Fortune (R AoE wave clear).</li>
  <li><strong>Support:</strong> Soraka (heals, peel) or Leona (point-and-click R, easy engage).</li>
</ul>
<p>Don't bounce. Iron-to-Bronze winners pick a champ and grind it. Stop trying to play 30 different champions in 100 games.</p>` },
      { heading: 'Last-hitting (CS) — the single biggest skill gap', html: `<p>CS = creep score = minion kills. Each minion is ~20 gold. At 10 minutes you should have 70+ CS. Iron players average 30. That's 40 CS × 20 gold = 800 gold deficit — one component item difference.</p>
<p>Drill: open custom game, last-hit minions for 10 minutes. Goal: 50 CS by 5 minutes solo. Practice tapping the right-click for the last-hit, not auto-attacking through the wave.</p>
<p>The CS gap is the single highest-impact stat in low elo. If you can last-hit 70+ CS at 10 minutes, you'll out-gold 90% of Iron opponents and snowball every game.</p>` },
      { heading: 'Map awareness — check the minimap every 5 seconds', html: `<p>Iron players stare at their lane the entire game. Bronze players check the minimap. Drill: every time minions meet, glance at minimap. Every time you take a tower plate, glance at minimap. Every time you ult, glance at minimap.</p>
<ul>
  <li>See enemy jungler bot? Mid lane can push up safely.</li>
  <li>See enemy top lane missing? Jungle / mid is in danger — back off.</li>
  <li>See ally jungler near you? Push wave for dive setup.</li>
</ul>
<p>You're not vision-impaired. You just need to look. Glance every 5 seconds; you'll be ahead of Iron forever.</p>` },
      { heading: 'Lane phase: trade at minion advantage, recall on plate proc', html: `<p>Don't trade randomly. Trade when your minions outnumber theirs (their auto-attacks distract). Don't trade under enemy tower. Don't dive without ally backup or 50% HP advantage.</p>
<p>Recall rules: 1300+ gold for component item, OR after taking a tower plate (free time), OR after a kill (no wave pressure). Never recall on equal wave with no resources earned.</p>
<p>This single habit — trade on advantage, recall on plate — gets you Bronze. Iron players recall randomly, lose plates, lose CS, lose lane.</p>` },
      { heading: 'Objective priority: drake > Baron > tower', html: `<p>First drake at 7:30. Soul at 4 drakes. Baron at 25 minutes. Towers anytime. Objective priority for an Iron-to-Bronze player:</p>
<ul>
  <li>Drake spawn at 7:30: have a ward at 7:00 in pit.</li>
  <li>Push wave before drake — bring teammates to the fight with minion pressure.</li>
  <li>Never solo-fight drake without team — getting smited off is a free objective for enemy.</li>
  <li>Baron at 25+ minutes: only commit with 4+ team members + vision around pit.</li>
</ul>
<p>Bronze players fight every objective; Gold players take objectives uncontested. Even at Iron, just being aware of drake spawn timer puts you ahead.</p>` },
      { heading: 'Jungle pathing for beginners — Warwick / Master Yi clear', html: `<p>If you're playing jungle: full clear before ganking. Red → Blue → Krugs → Raptors → Wolves → Gromp → Scuttle Crab. By 3:30 you're level 4 with full mana, ready to gank a pushed lane.</p>
<p>Gank windows: 3:30, 5:00, 6:00 (R unlocked). Look for pushed lanes where enemy is past river. Use Smite to confirm Smite — you'll lose 50% of duels without it.</p>
<p>Counter-jungle at Bronze: take enemy raptor/krug if you see enemy jungler opposite side on the map. Easy XP gain.</p>` },
      { heading: 'The 10 habits that get you to Bronze', html: `<ul>
  <li>Pick a 3-champion pool per role; never deviate for 30 games.</li>
  <li>Last-hit 70+ CS by 10 minutes.</li>
  <li>Check minimap every 5 seconds.</li>
  <li>Trade at minion advantage; recall on plate proc.</li>
  <li>Use both summoner spells (Flash + Teleport/Ignite for kill pressure).</li>
  <li>Ward river bush at minute 3 (top side or bot side).</li>
  <li>Set up drake control at 7:00 (pit ward).</li>
  <li>Never solo-fight at 30%+ HP disadvantage.</li>
  <li>Build defensive boots after Mythic (Tabis vs AD, Mercury's vs AP/CC).</li>
  <li>Don't surrender early — Iron games come back from 10k gold deficits.</li>
</ul>` },
    ],
    mistakes: [
      'Bouncing champions — playing 30 different picks in 100 games',
      'Auto-attacking through minions instead of last-hitting',
      'Staring at lane, never glancing at minimap',
      'Recalling on equal wave with no resources earned',
      'Solo-fighting objectives without team or vision',
    ],
    drill: {
      heading: 'Drill: 14-day fundamentals regimen',
      html: `<ul>
  <li><strong>Day 1-3:</strong> Custom games for last-hitting. Goal: 70 CS by 10 min, no champion abilities used.</li>
  <li><strong>Day 4-7:</strong> Ranked games with chosen champion pool only. Track CS per minute, deaths per game.</li>
  <li><strong>Day 8-10:</strong> Drake / Baron objective focus. Ward pit 30 seconds before spawn every game.</li>
  <li><strong>Day 11-14:</strong> Map awareness drill. Pause replays every 5 minutes; count how many enemies you knew the position of.</li>
</ul>
<p>By day 14 you'll be in Bronze. Most Iron players stay because they refuse to drill fundamentals — they keep playing for fun and losing.</p>`,
    },
    aiVodMention: `<p>Stuck despite drilling fundamentals? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews your match screenshots</a> and flags the exact CS gap, vision pattern, or fight commitment that's capping your rank. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'LoL Champion Tier List 2026 — Best Picks Per Role', url: '/blog/lol-champion-tier-list-2026.html' },
      { name: 'LoL Itemization Guide — Mythics, Components, Build Paths', url: '/blog/lol-itemization-guide.html' },
      { name: 'How to Climb from Gold to Platinum in LoL', url: '/blog/lol-gold-to-platinum.html' },
      { name: 'LoL Top Lane Matchups — 10 Counter Picks', url: '/blog/lol-top-lane-matchups.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 12,
  },
  {
    game: 'lol', gameLabel: 'League of Legends', fromRank: 'Tier List', toRank: '2026 Meta',
    slug: 'lol-champion-tier-list-2026',
    metaTitle: 'LoL Champion Tier List 2026 — Best Picks Per Role',
    metaDescription: 'LoL 2026 champion tier list across all 5 roles. S-tier dive, A-tier balanced, B-tier situational. Updated for the current meta with win rates and pick rationale.',
    intro: `<p>Tier lists in League of Legends shift every patch. This is the 2026 meta snapshot: S-tier (must-pick / must-ban), A-tier (strong meta), B-tier (situational). Tiered by win rate × pick rate × climb-ability for solo queue. Pro play differs — this is solo Q meta, not LCS.</p>`,
    sections: [
      { heading: 'Top Lane — S, A, B tiers', html: `<h3>S-tier</h3>
<ul>
  <li><strong>Darius</strong> — 5-stack hemorrhage execute, level 1 all-in. Iron-to-Plat top pick.</li>
  <li><strong>Sett</strong> — W true damage execute, R displacement engage. Brawl scaling perfect for solo Q chaos.</li>
  <li><strong>Camille</strong> — E hookshot engage, R isolate. Strong vs squishies + brawlers.</li>
</ul>
<h3>A-tier</h3>
<ul>
  <li><strong>Garen</strong> — Conqueror sustain, point-and-click silence. Forgiving, scales well.</li>
  <li><strong>Fiora</strong> — vital duelist, 1v1 monster. High skill cap.</li>
  <li><strong>Ornn</strong> — team-wide passive items, R global slow. Best team-fight tank top.</li>
</ul>
<h3>B-tier</h3>
<ul>
  <li><strong>Malphite</strong> — R AoE engage is huge, but lane phase weak vs bruisers.</li>
  <li><strong>Riven</strong> — high mechanical ceiling, low floor. Skip if not 100+ games invested.</li>
</ul>` },
      { heading: 'Jungle — S, A, B tiers', html: `<h3>S-tier</h3>
<ul>
  <li><strong>Hecarim</strong> — E run-down knockback, R fear engage. Best snowball jungler in meta.</li>
  <li><strong>Kha'Zix</strong> — isolation passive Q, R invisibility. Picks squishies all game.</li>
  <li><strong>Sejuani</strong> — R AoE stun engage, frostbite shred. Best team-fight jungle tank.</li>
</ul>
<h3>A-tier</h3>
<ul>
  <li><strong>Lee Sin</strong> — Q insec kick + early gank pressure. Falls off after 20 min but dominates early.</li>
  <li><strong>Vi</strong> — R lock-on ult, point-and-click target access. Solid tank-bruiser.</li>
  <li><strong>Bel'Veth</strong> — true damage Q, attack speed scaling. Late-game monster.</li>
</ul>
<h3>B-tier</h3>
<ul>
  <li><strong>Master Yi</strong> — Solo Q snowball if uncontested. Hard counters destroy.</li>
  <li><strong>Karthus</strong> — global R, scaling jungler. Needs comp synergy.</li>
</ul>` },
      { heading: 'Mid Lane — S, A, B tiers', html: `<h3>S-tier</h3>
<ul>
  <li><strong>Akali</strong> — invisibility shroud, R double-cast execute. Highest carry mid.</li>
  <li><strong>Sylas</strong> — steals enemy ult, sustain bruiser. Always strong.</li>
  <li><strong>Zed</strong> — shadow clone burst, R mark execute. Snowball assassin.</li>
</ul>
<h3>A-tier</h3>
<ul>
  <li><strong>Ahri</strong> — charm CC, R triple-dash mobility. Roams + scales.</li>
  <li><strong>Yasuo</strong> — wind wall blocks projectiles. Skill-dependent.</li>
  <li><strong>Syndra</strong> — point-and-click stun, R execute. Late-game threat.</li>
</ul>
<h3>B-tier</h3>
<ul>
  <li><strong>Orianna</strong> — ball management requires team coordination. Strong in pro play, weaker in solo Q.</li>
  <li><strong>Vladimir</strong> — Pool dodge + sustain. Late-game scaling, weak laning.</li>
</ul>` },
      { heading: 'ADC — S, A, B tiers', html: `<h3>S-tier</h3>
<ul>
  <li><strong>Caitlyn</strong> — longest auto range, trap setup. Lane bully + late scaling.</li>
  <li><strong>Jinx</strong> — hyper-carry, R global execute. Best scaling ADC.</li>
  <li><strong>Kai'Sa</strong> — evolution passive, R dash. Hybrid AP/AD damage.</li>
</ul>
<h3>A-tier</h3>
<ul>
  <li><strong>Jhin</strong> — 4-shot reload, R sniper execute. 1-shot crit damage.</li>
  <li><strong>Aphelios</strong> — 5-weapon rotation. Highest skill floor in role.</li>
  <li><strong>Senna</strong> — heals + scaling soul collection. Hybrid carry/support.</li>
</ul>
<h3>B-tier</h3>
<ul>
  <li><strong>Vayne</strong> — late-game hyper-carry. Hard counter to tanks; needs babysitting early.</li>
  <li><strong>Draven</strong> — high-skill axe-catching. Snowball if mastered.</li>
</ul>` },
      { heading: 'Support — S, A, B tiers', html: `<h3>S-tier</h3>
<ul>
  <li><strong>Thresh</strong> — Q hook engage, lantern save, soul-stacking. Skill expression.</li>
  <li><strong>Lulu</strong> — W polymorph/peel, R ally HP burst. Best enchanter for ADC carries.</li>
  <li><strong>Nautilus</strong> — point-and-click R lock-on. Best easy-engage support.</li>
</ul>
<h3>A-tier</h3>
<ul>
  <li><strong>Leona</strong> — point-and-click R, tankiest engage. Solo Q hard carry.</li>
  <li><strong>Janna</strong> — disengage queen, R AoE knockback. Anti-dive support.</li>
  <li><strong>Pyke</strong> — R execute heals team gold. Highest roam impact.</li>
</ul>
<h3>B-tier</h3>
<ul>
  <li><strong>Soraka</strong> — heals, peel. Beginner-friendly but punished by dive.</li>
  <li><strong>Senna</strong> — hybrid carry. Strong but contested with ADC.</li>
</ul>` },
      { heading: 'Counter-pick matrix — 5 key matchups', html: `<ul>
  <li><strong>Malphite > Yasuo</strong> — Point-and-click stun + AP burst destroys wind wall.</li>
  <li><strong>Vayne > Darius</strong> — Range kite stops 5-stack hemorrhage.</li>
  <li><strong>Lissandra > Zed</strong> — R suppress + hard CC locks down all-in.</li>
  <li><strong>Brand > Lulu</strong> — AoE damage support out-trades enchanter pre-6.</li>
  <li><strong>Caitlyn > Jinx</strong> — Lane bullies stop scaling hyper-carry.</li>
</ul>
<p>Counter-picking lane is the single biggest win condition in low elo. Use Champion Select to deny opponent's pick or counter directly. See <a href="/blog/lol-top-lane-matchups.html">LoL Top Lane Matchups</a> for the full counter-pick guide.</p>` },
    ],
    mistakes: [
      'Picking B-tier champions despite their lower win rate (chasing personal favorites over meta)',
      'No counter-pick consideration in champion select',
      'One-tricking outside the S-tier list (assuming "all picks are viable" is solo Q cope)',
      'Following pro-play picks (Orianna in LCS ≠ Orianna in solo Q)',
      'Ignoring patch notes — meta shifts every 2 weeks',
    ],
    drill: {
      heading: 'Drill: 1 S-tier pick per role per week',
      html: `<p>Pick one S-tier champ from this list. Play 20 ranked games on it. Don't deviate. Track win rate per week. By month 4 you've mastered 5 S-tier picks across roles and you can flex into any role solo Q forces you into. This is the climbing path — not "play whatever champ I like."</p>`,
    },
    aiVodMention: `<p>Got the picks right but still losing? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags specific lane phase mistakes (CS gap, wave management, gank windows). Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'LoL Beginner Guide 2026 — Climb Out of Iron', url: '/blog/lol-beginner-guide-2026.html' },
      { name: 'LoL Itemization Guide — Mythics, Components, Build Paths', url: '/blog/lol-itemization-guide.html' },
      { name: 'How to Climb from Gold to Platinum in LoL', url: '/blog/lol-gold-to-platinum.html' },
      { name: 'LoL Top Lane Matchups — 10 Counter Picks', url: '/blog/lol-top-lane-matchups.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 11,
  },
  {
    game: 'lol', gameLabel: 'League of Legends', fromRank: 'Build', toRank: 'Mastery',
    slug: 'lol-itemization-guide',
    metaTitle: 'LoL Itemization Guide 2026 — Mythics, Components, Build Paths',
    metaDescription: 'LoL itemization guide: Mythic Items, component spike paths, role-specific build orders, situational defensive items, and the build mistakes that cost you 30% of your damage.',
    intro: `<p>Itemization wins games more than mechanics past Silver. The wrong Mythic on Yasuo loses you 4,000 effective damage over a fight. The right defensive item against an Akali turns a 100-0 burst into a 90-50 survive-then-kill trade. This guide breaks down Mythic item choices per role, component spike timing, and the situational defensives every LoL player needs.</p>`,
    sections: [
      { heading: 'How Mythic Items work — the 1-item meta', html: `<p>Mythic Items are the cornerstone of LoL itemization. You can only own one at a time. Each Mythic passive scales with subsequent Legendary items, so the wrong Mythic compounds over your entire build.</p>
<ul>
  <li><strong>Mythic = your build identity.</strong> Stridebreaker on Camille is bruiser-engage; Eclipse is burst-assassin. Different champions, different Mythics.</li>
  <li><strong>Mythic passive scales per Legendary.</strong> Each subsequent item adds bonus stats from the Mythic's passive.</li>
  <li><strong>Buy Mythic by component priority.</strong> Don't buy it first. Buy components (BF Sword, Pickaxe, Sapphire Crystal) until you can complete the Mythic with the recall gold.</li>
</ul>` },
      { heading: 'Top lane Mythic choice — Stridebreaker vs Eclipse vs Trinity', html: `<ul>
  <li><strong>Stridebreaker</strong> — Bruiser. Camille, Darius, Sett. Movement speed + slow + bonus damage.</li>
  <li><strong>Eclipse</strong> — Burst bruiser/assassin. Renekton, Pantheon. Spell-shield-piercing damage spikes.</li>
  <li><strong>Trinity Force</strong> — Flex bruiser. Irelia, Jax, Camille. Sheen procs + AS + movement speed.</li>
  <li><strong>Goredrinker</strong> — Sustained bruiser. Darius (old build), Trundle. Heal-on-damage in fights.</li>
</ul>
<p>Choose by champion archetype: Stridebreaker for movement-heavy bruisers, Eclipse for burst, Trinity for sustained DPS, Goredrinker for sustain.</p>` },
      { heading: 'Jungle Mythic choice — Eclipse vs Ravenous Hydra vs Sunfire', html: `<ul>
  <li><strong>Eclipse</strong> — Assassin jungle. Kha'Zix, Lee Sin. Burst damage spikes.</li>
  <li><strong>Stridebreaker</strong> — Engage jungler. Hecarim. Movement speed + AoE slow.</li>
  <li><strong>Sunfire Aegis</strong> — Tank jungle. Sejuani, Maokai. AoE damage + defensive stats.</li>
  <li><strong>Goredrinker</strong> — Sustain jungler. Warwick. Heal-on-damage.</li>
</ul>` },
      { heading: "Mid Mage Mythic choice — Luden's vs Liandry's vs Riftmaker", html: `<ul>
  <li><strong>Luden's Companion</strong> — Burst mage. Syndra, Ahri, Lux. Big damage on cooldown spells.</li>
  <li><strong>Liandry's Anguish</strong> — Sustained mage. Zyra, Ryze. DoT damage on champions.</li>
  <li><strong>Everfrost</strong> — Control mage. Lissandra, Anivia. Frost field utility.</li>
  <li><strong>Riftmaker</strong> — Bruiser mage. Sylas, Mordekaiser. Omnivamp + bonus damage.</li>
</ul>
<p>Choose by playstyle: Luden's for burst combos, Liandry's for sustained damage, Everfrost for CC, Riftmaker for hybrid bruiser play.</p>` },
      { heading: 'ADC Mythic choice — Galeforce vs Kraken Slayer vs Yun Tal Wildarrows', html: `<ul>
  <li><strong>Galeforce</strong> — Mobile ADC. Caitlyn, Lucian. Dash gap-closer + AoE damage.</li>
  <li><strong>Kraken Slayer</strong> — Hyper-carry. Jinx, Vayne. 3rd auto true damage.</li>
  <li><strong>Yun Tal Wildarrows</strong> — Crit ADC. Jhin. Crit scaling bonus.</li>
  <li><strong>Immortal Shieldbow</strong> — Bursty ADC. Twitch, Tristana. Bonus shield + omnivamp.</li>
</ul>
<p>For solo Q ADC at low elo: Galeforce on mobile carries, Kraken Slayer on scaling hyper-carries. Yun Tal Wildarrows is Jhin-specific.</p>` },
      { heading: "Support Mythic choice — Moonstone vs Locket vs Shurelya's", html: `<ul>
  <li><strong>Moonstone Renewer</strong> — Enchanter peel. Lulu, Janna, Soraka. Continuous team healing.</li>
  <li><strong>Locket of the Iron Solari</strong> — Engage tank support. Leona, Nautilus, Thresh. Bonus team shield.</li>
  <li><strong>Shurelya's Battlesong</strong> — Roaming support. Pyke, Senna. Active speed boost.</li>
  <li><strong>Imperial Mandate</strong> — Damage support. Lux, Karma. Mark + ally damage boost.</li>
</ul>` },
      { heading: 'Defensive items — when to deviate from the meta build', html: `<p>Don't sleep on defensive items. They turn fights:</p>
<ul>
  <li><strong>Thornmail</strong> — vs heavy auto-attack ADC (Jinx, Vayne). Reflect damage + Grievous Wounds on tank.</li>
  <li><strong>Tabi Boots</strong> — vs full AD comp. 12% auto attack damage reduction.</li>
  <li><strong>Mercury's Treads</strong> — vs AP / CC comp. Tenacity + magic resistance.</li>
  <li><strong>Maw of Malmortius</strong> — bruiser vs full AP. Spell shield + bonus AD on low HP.</li>
  <li><strong>Zhonya's Hourglass</strong> — mage vs assassin. Stasis for 2.5 seconds + armor.</li>
  <li><strong>Mercurial Scimitar</strong> — ADC vs hard CC (Zed R, Malzahar R). Removes CC + cleanses.</li>
  <li><strong>Guardian Angel</strong> — ADC late game. Revive after death (4 minute cooldown).</li>
</ul>
<p>Buy 1 defensive item by Item 3 every game. Iron players rush 6 damage items and die in 0.8 seconds to Zed.</p>` },
      { heading: 'Component spike paths — when to fight before Mythic', html: `<ul>
  <li><strong>BF Sword</strong> (1300 gold) — first component for AD carries. 40 AD spike.</li>
  <li><strong>Sapphire Crystal</strong> (350 gold) — first mana for mages. 300 mana to spam Q.</li>
  <li><strong>Pickaxe</strong> (875 gold) — 25 AD for ADCs. Lane combat spike.</li>
  <li><strong>Tear of the Goddess</strong> (400 gold) — Manamune stacking start for mid mage.</li>
  <li><strong>Vampiric Scepter</strong> (900 gold) — ADC sustain start. 10% lifesteal.</li>
</ul>
<p>Don't recall on equal wave with no resources. Wait for 1300+ gold to recall and buy a meaningful component. The component spike (BF or Pickaxe) is where you should fight; the Mythic completion is where you should team fight.</p>` },
    ],
    mistakes: [
      'Building 6 damage items, dying to assassins in 0.8s',
      'Wrong Mythic for champion archetype (Eclipse on tank, Stridebreaker on assassin)',
      'No defensive boots by Item 2 (Tabis or Mercury\'s)',
      'Buying Item 1 → Item 2 → Item 3 without checking enemy comp damage type',
      'Recalling with 600 gold instead of waiting for 1300 component spike',
    ],
    drill: {
      heading: 'Drill: Build path consistency for 10 games',
      html: `<p>Pick one champion. Build the same path 10 games in a row. Track win rate. Then swap one item per game and compare. By game 30 you've tested 3 build paths and know which one is highest win rate FOR YOU on that champion. This is how pros build their item knowledge — not by copying OP.GG blindly, but by testing in their solo Q matches.</p>`,
    },
    aiVodMention: `<p>Build path right but still losing fights? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags positioning + ability sequence errors per team fight. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'LoL Beginner Guide 2026 — Climb Out of Iron', url: '/blog/lol-beginner-guide-2026.html' },
      { name: 'LoL Champion Tier List 2026 — Best Picks Per Role', url: '/blog/lol-champion-tier-list-2026.html' },
      { name: 'How to Climb from Gold to Platinum in LoL', url: '/blog/lol-gold-to-platinum.html' },
      { name: 'LoL Top Lane Matchups — 10 Counter Picks', url: '/blog/lol-top-lane-matchups.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 11,
  },
  {
    game: 'lol', gameLabel: 'League of Legends', fromRank: 'Gold', toRank: 'Platinum',
    slug: 'lol-gold-to-platinum',
    metaTitle: 'How to Climb from Gold to Platinum in LoL (2026)',
    metaDescription: 'LoL Gold-to-Plat — wave management, vision priority, jungle pathing reads, objective coordination, and the mid-round adapts that flip games at the Plat threshold.',
    intro: `<p>Gold-to-Platinum in LoL is the first rank where macro decisions out-weigh mechanics. At Gold, you can last-hit cleanly and play a champion pool — that's not enough. Plat demands wave management, vision priority, jungle pathing reads, and objective coordination. The gap closes when you stop playing your lane and start playing the map.</p>`,
    sections: [
      { heading: 'Wave management — the Plat-level skill gap', html: `<p>Gold players push wave or freeze randomly. Plat players manage waves intentionally:</p>
<ul>
  <li><strong>Push wave to enemy tower</strong> when you want to recall + take resources.</li>
  <li><strong>Freeze wave near your tower</strong> when enemy has TP cooldown or jungle pressure.</li>
  <li><strong>Slow-push wave</strong> by letting their wave bigger than yours; build a 30-minion wave to crash for tower plate.</li>
  <li><strong>Don't shove + roam in lane phase</strong>; you give XP + gold lead to enemy laner.</li>
</ul>
<p>Wave management = 30% of your CS and tower plate gold. Plat players bank an extra 800 gold over Gold opponents through wave control alone.</p>` },
      { heading: 'Vision priority — wards win games at Plat', html: `<p>Gold players ward defensively (jungle entrances). Plat players ward offensively (enemy jungle, objective pits).</p>
<ul>
  <li><strong>Pink ward enemy jungle entrance</strong> at minute 8 — denies enemy ward, gives team intel.</li>
  <li><strong>Ward enemy raptor/krug</strong> when you have lane priority. See enemy jungler path.</li>
  <li><strong>Deep ward Baron pit at 22:00</strong> for 25:00 Baron spawn vision setup.</li>
  <li><strong>Sweep enemy wards</strong> with Control Ward before objectives — denies them vision.</li>
</ul>
<p>Vision differential is the single biggest macro skill. Plat players have 50% more vision score than Gold opponents. Buy Control Wards every recall.</p>` },
      { heading: 'Jungle pathing reads — track enemy jungler position', html: `<p>Plat players track enemy jungler every minute. Methods:</p>
<ul>
  <li>Pause replay every 2 min, count enemy jungler\'s position based on side they ganked.</li>
  <li>Enemy bot pushed wave but mid lane is back wave — jungler is mid side.</li>
  <li>You see Smite cooldown audio on enemy buff — they took it.</li>
  <li>Enemy raptor/krug not warded but you see no ally pass through — enemy jungler took it.</li>
</ul>
<p>If you know enemy jungler position, you can play 2-3 screens forward in lane safely. If you don't, you stay back and lose CS to over-conservative trades.</p>` },
      { heading: 'Objective coordination — get the team to the pit on time', html: `<p>Gold players solo-fight objectives. Plat players bring the team:</p>
<ul>
  <li><strong>Drake at 7:30</strong> — push side waves at 7:00 so team can rotate.</li>
  <li><strong>Baron at 25:00</strong> — set up vision 22-23 min, push 1-2 lanes, force enemy split.</li>
  <li><strong>Elder dragon (post-soul)</strong> — never solo-fight; full team commit only.</li>
  <li><strong>Rift Herald at 10:00</strong> — call team rotation early; use for tower plate gold.</li>
</ul>
<p>Solo-killing a drake at 7:30 with no team coordination = throwing summoner spells + missing a kill window. Coordinate via ping at minute 6 for drake at 7:30.</p>` },
      { heading: 'Mid-round adapts — when to abandon a lane phase plan', html: `<p>Plat players adapt mid-game. If your top is hard-losing 0/5, don't commit to top dive — write that lane off, force mid + bot lead. If your jungler is 0/3, don\'t expect ganks; play safer in lane.</p>
<p>Mid-round adapt rules:</p>
<ul>
  <li>If 1 lane is 4+ kills behind: don't rotate to help, force the other 2 lanes to win.</li>
  <li>If enemy jungler is fed: don't farm — group with team at 15:00.</li>
  <li>If you're behind: defensive item priority over damage (Tabis + Maw vs assassins).</li>
  <li>If you're ahead: snowball + force fights before enemy items spike.</li>
</ul>` },
      { heading: 'Comp matchup reads — when to fight vs when to scale', html: `<p>Plat players read enemy comp:</p>
<ul>
  <li><strong>Enemy hyper-carry (Vayne, Jinx)</strong>: force fights pre-25 min before they item spike.</li>
  <li><strong>Enemy dive comp (Malphite + Yasuo R wombo)</strong>: stay split, don't team fight unless you have disengage.</li>
  <li><strong>Enemy split push (Fiora, Camille)</strong>: 1-3-1 with hard tank to side-pressure.</li>
  <li><strong>Enemy poke (Caitlyn, Xerath)</strong>: tank engage immediately; can't out-poke.</li>
</ul>
<p>If you can identify enemy comp archetype in 5 minutes and plan around it, you're playing at Plat level. See <a href="/blog/lol-champion-tier-list-2026.html">our 2026 tier list</a> for comp archetypes.</p>` },
      { heading: 'The Plat plateau — 6 habits to break out', html: `<ul>
  <li>Track CS per minute every game (target: 7+ CS/min).</li>
  <li>Buy Control Ward every recall.</li>
  <li>Identify enemy comp archetype in first 5 minutes.</li>
  <li>Use minimap to track enemy jungler every 2 minutes.</li>
  <li>Force team rotations to objectives (minute 6 ping for 7:30 drake).</li>
  <li>Buy 1 defensive item by Item 3.</li>
</ul>` },
    ],
    mistakes: [
      'Pushing wave + roaming without lane priority (giving up XP/gold)',
      'Defensive warding only — never warding enemy jungle',
      'Solo-fighting objectives without team coordination',
      'Sticking with lane phase plan when teammate hard-loses',
      'Buying 6 damage items, dying to assassins in 0.8s',
      'Not buying Control Ward every recall (vision denial loss)',
    ],
    drill: {
      heading: 'Drill: 7-day macro regimen',
      html: `<ul>
  <li><strong>Day 1-2:</strong> Track CS per minute in 5 games. Goal: 7+ CS/min by game 5.</li>
  <li><strong>Day 3-4:</strong> Buy Control Ward every recall in 5 games. Track vision score.</li>
  <li><strong>Day 5-6:</strong> Pause replay every 2 min. Identify enemy jungler position from memory.</li>
  <li><strong>Day 7:</strong> Play 3 games coordinating objectives — ping team 1 min before drake spawn.</li>
</ul>
<p>By day 7, you'll have macro instincts that put you at Plat threshold. Mechanics matter less than these habits.</p>`,
    },
    aiVodMention: `<p>Macro feels right but still hard-stuck Gold? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags fight commit timing, position errors, and team-fight crosshair placement. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'LoL Beginner Guide 2026 — Climb Out of Iron', url: '/blog/lol-beginner-guide-2026.html' },
      { name: 'LoL Champion Tier List 2026 — Best Picks Per Role', url: '/blog/lol-champion-tier-list-2026.html' },
      { name: 'LoL Itemization Guide — Mythics, Components, Build Paths', url: '/blog/lol-itemization-guide.html' },
      { name: 'LoL Top Lane Matchups — 10 Counter Picks', url: '/blog/lol-top-lane-matchups.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 10,
  },
  {
    game: 'lol', gameLabel: 'League of Legends', fromRank: 'Top Lane', toRank: 'Matchups',
    slug: 'lol-top-lane-matchups',
    metaTitle: 'LoL Top Lane Matchups 2026 — 10 Counter Picks That Win Lanes',
    metaDescription: 'LoL top lane counter-pick guide for 2026. 10 matchup-defining picks across bruiser, tank, and skirmisher classes. Counter Darius, Camille, Fiora, Sett, and more.',
    intro: `<p>Top lane is the island lane — once it starts, you're locked in 1v1 with minimal jungle interaction. Counter-picking in champion select is the single highest-impact decision you make all game. This guide covers the 10 matchups that win or lose lane in 2026's meta. Use it in champion select, not after the game.</p>`,
    sections: [
      { heading: 'Counter pick #1 — Vayne vs Darius', html: `<p><strong>Why it works:</strong> Vayne kites Darius before he Q-pulls into 5-stack hemorrhage. Vayne W procs (true damage every 3rd attack) shred Darius armor. Vayne R invisibility removes Darius all-in pressure.</p>
<p><strong>Lane play:</strong> Stay max auto range. Trade with W procs only. Push wave 1 to draw Darius into bad positions. Item: Berserker's Greaves → Kraken Slayer → IE.</p>
<p><strong>Counter-counter:</strong> If Vayne struggles, swap to Quinn for the longer range bully or Kennen for the AoE shock.</p>` },
      { heading: 'Counter pick #2 — Renekton vs Camille', html: `<p><strong>Why it works:</strong> Renekton W stun + Q sustain shut down Camille E hookshot engage before she scales. Renekton scales lane phase better; Camille scales post-Item 2.</p>
<p><strong>Lane play:</strong> Push wave 1, all-in level 3 (after first Stridebreaker component). Force Camille flash, then snowball lane.</p>
<p><strong>Counter-counter:</strong> If Renekton can't kill Camille pre-6, swap to Tryndamere for the scaling 1v1.</p>` },
      { heading: 'Counter pick #3 — Malphite vs Yasuo', html: `<p><strong>Why it works:</strong> Malphite R is point-and-click AoE. Yasuo wind wall blocks projectiles but doesn't block point-and-click. Malphite passive shield + AP burst destroys Yasuo all-in.</p>
<p><strong>Lane play:</strong> Build full AP Malphite. Push wave, R Yasuo when he flashes. Easy lane to plate first tower.</p>
<p><strong>Counter-counter:</strong> If Yasuo plays back, swap to Pantheon for the early all-in.</p>` },
      { heading: 'Counter pick #4 — Quinn vs Fiora', html: `<p><strong>Why it works:</strong> Quinn range outranges Fiora vital duelist kit. Quinn R global lets her roam mid + bot when Fiora can't follow.</p>
<p><strong>Lane play:</strong> Stay max range. Skip 50/50 trades. Roam mid at 5:00 when Quinn R unlocks.</p>
<p><strong>Counter-counter:</strong> If Fiora dodges Quinn poke, swap to Jax for the tank-buster matchup.</p>` },
      { heading: 'Counter pick #5 — Cho\'Gath vs Fiora', html: `<p><strong>Why it works:</strong> Cho R execute counters Fiora R vital damage. Cho passive HP stacking makes Fiora vitals worthless. Cho silence Q disables Fiora R parry.</p>
<p><strong>Lane play:</strong> Q silence when Fiora dashes in. R execute at level 6 if she's below 50% HP.</p>
<p><strong>Counter-counter:</strong> If Cho can't kill Fiora, swap to Malphite for the tank-bust matchup.</p>` },
      { heading: 'Counter pick #6 — Renekton vs Camille (deep alternative)', html: `<p><strong>Why it works:</strong> Same matchup, different engagement timing. Pantheon E parry blocks Camille E hookshot, then Pantheon W stun + R global engages.</p>
<p><strong>Lane play:</strong> Pantheon level 3 all-in. Trade Q + W + auto chain. R global for jungle gank setup.</p>` },
      { heading: 'Counter pick #7 — Garen vs Sett', html: `<p><strong>Why it works:</strong> Garen passive HP regen out-sustains Sett W execute. Garen W shield blocks Sett R displacement. Garen Q silence kills Sett before he can W execute back.</p>
<p><strong>Lane play:</strong> Garen full tank build. Out-sustain Sett until Item 2. Snowball with Conqueror.</p>` },
      { heading: 'Counter pick #8 — Tryndamere vs Camille', html: `<p><strong>Why it works:</strong> Trynda R invincibility (5s undying) shuts down Camille all-in. Trynda E spin gap-closer matches Camille E hookshot.</p>
<p><strong>Lane play:</strong> Trynda all-in level 6. Trade with E spin reset. Scale to Lethal Tempo + Infinity Edge for 1v9.</p>` },
      { heading: 'Counter pick #9 — Ornn vs Most Bruisers', html: `<p><strong>Why it works:</strong> Ornn tank build with team-wide passive upgrades makes him strong vs Darius/Sett/Fiora. R global slow gives team-fight value top lacks.</p>
<p><strong>Lane play:</strong> Trade with Q + W combo. Build Frozen Heart vs Crit ADC, Thornmail vs heavy auto comps.</p>` },
      { heading: 'Counter pick #10 — Jax vs Most Top Picks', html: `<p><strong>Why it works:</strong> Jax E counter-strike is parry. Jax R passive splash damage shreds AS and AD users. Jax scales hard.</p>
<p><strong>Lane play:</strong> Trade with E parry on enemy auto. Scale to Trinity Force + Steark's. Late game Jax 1v9.</p>` },
      { heading: 'How to use this in champion select', html: `<p>Pick this guide up before queueing. In champion select, after enemy locks top:</p>
<ul>
  <li>If enemy Darius: lock Vayne.</li>
  <li>If enemy Camille: lock Renekton or Pantheon.</li>
  <li>If enemy Yasuo: lock Malphite.</li>
  <li>If enemy Fiora: lock Quinn or Cho\'Gath.</li>
  <li>If enemy Sett: lock Garen.</li>
</ul>
<p>Don't lock your favorite champion if it's counter-picked. Adapt or lose lane. See <a href="/blog/lol-champion-tier-list-2026.html">our 2026 tier list</a> for the meta picks per role.</p>` },
    ],
    mistakes: [
      'Locking your main champion despite hard counter (e.g., Yasuo into Malphite)',
      'Picking before enemy locks top — gives them counter-pick advantage',
      'Ignoring matchup data after losing 5 games to same matchup',
      'Building the same items every game regardless of opponent',
      'Not adjusting wave management based on counter-pick relationship',
    ],
    drill: {
      heading: 'Drill: 10 matchup mastery',
      html: `<p>Pick 10 champions from this list. Play 3 games on each matchup in custom games (vs bot). Goal: feel the lane phase rhythm of each counter. By the end of 30 games you've internalized the counter-pick map and can adapt in champion select.</p>`,
    },
    aiVodMention: `<p>Counter-pick right but still losing lane? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags lane phase positioning, trade timing, and recall windows. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'LoL Beginner Guide 2026 — Climb Out of Iron', url: '/blog/lol-beginner-guide-2026.html' },
      { name: 'LoL Champion Tier List 2026 — Best Picks Per Role', url: '/blog/lol-champion-tier-list-2026.html' },
      { name: 'LoL Itemization Guide — Mythics, Components, Build Paths', url: '/blog/lol-itemization-guide.html' },
      { name: 'How to Climb from Gold to Platinum in LoL', url: '/blog/lol-gold-to-platinum.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
]

// ============================================================================
// EA SPORTS FC POSTS (5)
// ============================================================================
// FUT-focused content cluster — Division Rivals + Champions are the main
// competitive paths. Targets the ~50M EAFC TAM.
const EAFC_POSTS = [
  {
    game: 'eafc', gameLabel: 'EA Sports FC', fromRank: 'Beginner', toRank: 'Division 5',
    slug: 'eafc-beginner-guide-2026',
    metaTitle: 'EA Sports FC 26 Beginner Guide — Climb FUT Rivals From Div 10',
    metaDescription: 'EAFC beginner guide for 2026: formation picks, custom tactics, FUT Rivals progression, skill move basics, defending controls, and the habits that get you to Division 5.',
    intro: `<p>If you're new to EA Sports FC, the fastest way to climb FUT Division Rivals isn't playing more games — it's fixing four things: formation, custom tactics, defending controls, and skill move basics. This guide covers the fundamentals that 90% of Division 10 players ignore. Drill these for 2 weeks and Division 5 is automatic.</p>`,
    sections: [
      { heading: 'Pick one formation — not five', html: `<p>EAFC has 30+ formations. You'll never master all of them. Pick one and grind it until Division 5:</p>
<ul>
  <li><strong>4-2-3-1 Wide</strong> — most balanced; CAM playmaker + 2 CDMs hold midfield. Beginner-friendly.</li>
  <li><strong>4-3-3 Attack</strong> — pace wingers + attacking full-backs. Higher skill ceiling.</li>
  <li><strong>5-3-2</strong> — defensive shell with counter-attack pace. Hard to crack but slower play.</li>
</ul>
<p>Don't bounce. Pick one, learn its rhythm, master it. The formation-switching habit at Division 10 is the #1 reason players don't climb.</p>` },
      { heading: 'Set 3 custom tactics presets', html: `<p>Custom Tactics 1 / 2 / 3 are L1 + D-pad up/right/down in-match. Set them:</p>
<ul>
  <li><strong>Tactic 1 — High Press:</strong> Depth 85, Width 50, Aggressive Interceptions. Use when losing.</li>
  <li><strong>Tactic 2 — Balanced (default):</strong> Depth 65, Width 50, Pressure on Heavy Touch.</li>
  <li><strong>Tactic 3 — Park Bus:</strong> Depth 45, Width 35, Drop Back, Counter-Attack. Use when winning 1-0 in last 5 min.</li>
</ul>
<p>Swap tactics every 15-20 minutes based on score. This is the single biggest macro habit Division 5+ players have.</p>` },
      { heading: 'Defending controls — the Division 10 skill gap', html: `<p>Beginner defending = slide tackle everything. Pro defending = stand-up tackle, jockey, manual select.</p>
<ul>
  <li><strong>Stand-up tackle (X / Press button):</strong> Default tackle. Used 90% of the time.</li>
  <li><strong>Jockey (L2):</strong> Back off and angle the striker to weak foot.</li>
  <li><strong>Manual CB select (L1 + R-stick):</strong> Switch to the right defender on the run.</li>
  <li><strong>L2 + R-stick (manual defender):</strong> Free-control any player on defense.</li>
</ul>
<p>Never slide-tackle in the penalty box — 80% chance of conceding a penalty. Stand up, jockey, force the bad angle.</p>` },
      { heading: 'Attack basics — scoring patterns that work', html: `<p>Three reliable scoring patterns at any rank:</p>
<ul>
  <li><strong>Cut-back cross:</strong> LB/RB to byline → cross-back to CAM late run → finesse shot.</li>
  <li><strong>Cut-inside skill:</strong> 5-star winger R1+R2 toward goal → low driven shot from 18 yards.</li>
  <li><strong>Through-ball pace:</strong> CAM L1 + through-ball → pace striker run behind → 1v1 GK.</li>
</ul>
<p>Don't shoot from outside the box unless you have a 5-star weak foot striker. Don't chain skill moves — defenders read multi-skill combos. One skill move + finish is meta.</p>` },
      { heading: 'FUT chemistry basics', html: `<p>FUT chemistry adds stat boosts to players in your squad. You need 5+ chemistry per player; 23+ total for full team boost.</p>
<ul>
  <li>Same league = 1 chemistry link</li>
  <li>Same nation = 1 chemistry link</li>
  <li>Same club = 2 chemistry links</li>
  <li>Icon Cards = link to anyone same nation OR club</li>
  <li>Hero Cards = +2 chem for matching league</li>
</ul>
<p>Build a team where most players share 1-2 leagues + nations. Don't mix 6 leagues for the "best" players if it tanks chemistry — 80-rated players with full chem outperform 88-rated with 4 chem.</p>` },
      { heading: 'Division Rivals weekly objectives', html: `<p>Rivals is the weekly grind to Champions Qualifier:</p>
<ul>
  <li>First 3 wins = qualifier points + objective rewards</li>
  <li>5 wins = 1 player pack + 200 Rivals points</li>
  <li>10 wins = Champions Qualifier slot</li>
  <li>Champions Qualifier wins → Champions Finals slot (top tier)</li>
</ul>
<p>Pace yourself: 3 games per session, 2-3 sessions per week. Total ~10 wins. Skip if losing 3+ in a row — tilt-stack costs you 5+ wins.</p>` },
      { heading: 'The 8 habits that get you to Division 5', html: `<ul>
  <li>Pick one formation; never switch in Division 10.</li>
  <li>Set 3 custom tactics presets.</li>
  <li>Use stand-up tackle (X), not slide (Square).</li>
  <li>Manual CB select (L1+R-stick) on box entries.</li>
  <li>Build chemistry — 23+ total, 5+ per player.</li>
  <li>Score via cut-back, cut-inside, or through-ball — not from distance.</li>
  <li>Swap tactics every 15 min based on score.</li>
  <li>Stop playing after 3 losses (tilt protocols).</li>
</ul>` },
    ],
    mistakes: [
      'Bouncing formations every 2 games',
      'Slide-tackling in the box (penalty machine)',
      'Building team for "best players" not chemistry',
      'Shooting from outside the box without 5-star weak foot',
      'Playing through 3+ losses despite tilt',
    ],
    drill: {
      heading: 'Drill: 14-day fundamentals regimen',
      html: `<ul>
  <li><strong>Day 1-3:</strong> Lock in one formation. Play 10 Squad Battle games to feel rhythm.</li>
  <li><strong>Day 4-7:</strong> Practice defending in Squad Battles. Stand-up tackle only.</li>
  <li><strong>Day 8-10:</strong> Score 3 cut-back goals per game. Force the cut-back pattern.</li>
  <li><strong>Day 11-14:</strong> Rivals games. Tactic 1 if losing, Tactic 3 if winning last 5 min.</li>
</ul>
<p>By day 14 you're in Division 5. Most Division 10 players stay there because they refuse to drill fundamentals.</p>`,
    },
    aiVodMention: `<p>Stuck despite drilling? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags formation, tactic, or defending mistakes per goal. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'EAFC Best Formations 2026', url: '/blog/eafc-best-formations-2026.html' },
      { name: 'EAFC FUT Chemistry Deep Dive', url: '/blog/eafc-fut-chemistry-guide.html' },
      { name: 'How to Climb from Division 5 to Elite in EAFC', url: '/blog/eafc-div5-to-elite.html' },
      { name: 'EAFC Custom Tactics Guide — Press / Balanced / Park-Bus', url: '/blog/eafc-custom-tactics-guide.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 11,
  },
  {
    game: 'eafc', gameLabel: 'EA Sports FC', fromRank: 'Formation', toRank: 'Tier List',
    slug: 'eafc-best-formations-2026',
    metaTitle: 'EAFC 26 Best Formations Tier List — FUT Rivals & Champions Meta',
    metaDescription: 'EA Sports FC formation tier list 2026: S-tier 4-2-3-1 Wide, A-tier 4-3-3 Attack, situational 5-3-2 + 3-4-3. Tactical breakdown per division and game state.',
    intro: `<p>Formation choice is the most important pre-match decision you make in EA Sports FC. 2026's meta is defined by 4-2-3-1 Wide's flexibility, 4-3-3 Attack's pace, and 5-3-2's defensive shell. This is the 2026 tier list — S/A/B with breakdown of when to pick each.</p>`,
    sections: [
      { heading: 'S-tier — 4-2-3-1 Wide', html: `<p>The most balanced formation in EAFC 26. Two CDMs hold midfield, CAM creates centrally, 2 wide forwards attack channels.</p>
<ul>
  <li><strong>Strengths:</strong> defensive solidity from double CDM; CAM-anchored attack; wing channels for crosses.</li>
  <li><strong>Weaknesses:</strong> wide attack relies on full-back overlap; ST isolated without CAM support.</li>
  <li><strong>Meta picks:</strong> Mbappé ST + Bellingham CAM + Saka/Vinícius LW + Salah RW + Rodri + Kanté CDMs.</li>
  <li><strong>Win condition:</strong> Patient build-up, CAM through-balls, cut-back finishing.</li>
</ul>` },
      { heading: 'S-tier — 4-3-3 Attack', html: `<p>High-press, pacey wingers, attacking full-backs. Higher skill ceiling than 4-2-3-1; faster game state.</p>
<ul>
  <li><strong>Strengths:</strong> Pace cut-inside wingers; attacking full-backs for overlaps; 3-forward press.</li>
  <li><strong>Weaknesses:</strong> Vulnerable to counter-attack (high line); needs Rodri-tier CDM.</li>
  <li><strong>Meta picks:</strong> Mbappé ST + Vinícius LW + Salah RW + Bellingham + Pedri + Rodri.</li>
  <li><strong>Win condition:</strong> Fast tempo, pace wingers cut inside, 4-1-2-1-2 dynamic.</li>
</ul>` },
      { heading: 'A-tier — 5-3-2 (Park-the-Bus)', html: `<p>Defensive shell with 3 CBs and 2 wing-backs. Counter-attack on turnovers.</p>
<ul>
  <li><strong>Strengths:</strong> Almost uncrackable defense; counter-attack with wing-backs forward; 2 forwards.</li>
  <li><strong>Weaknesses:</strong> Slow build-up; opponent dictates possession.</li>
  <li><strong>Meta picks:</strong> Mbappé + Haaland forwards; Bellingham + Rodri + Pedri midfield; Van Dijk + Rüdiger + Saliba CBs; Theo + Hakimi wing-backs.</li>
  <li><strong>Win condition:</strong> Park bus 70 minutes, counter-attack 1 goal, hold lead.</li>
</ul>` },
      { heading: 'A-tier — 4-4-2 Flat', html: `<p>Two banks of 4, fast forwards on counter. Pre-2024 meta still effective in 2026.</p>
<ul>
  <li><strong>Strengths:</strong> Defensive shape; 2-striker partnership; counter-attack pace.</li>
  <li><strong>Weaknesses:</strong> No CAM = limited central build-up; wide spaces between midfield + attack.</li>
  <li><strong>Meta picks:</strong> Mbappé + Haaland forwards; Bellingham + Saka wide mids; Rodri + Kanté central; Van Dijk + Rüdiger CBs.</li>
  <li><strong>Win condition:</strong> Long-ball to strikers, defensive shape, counter on turnover.</li>
</ul>` },
      { heading: 'B-tier — 3-4-3 Wide Wingback', html: `<p>Wingback-heavy with 3 CBs. High risk / high reward.</p>
<ul>
  <li><strong>Strengths:</strong> Attacking wingbacks (Theo / Hakimi) create overload wide; 3 forwards.</li>
  <li><strong>Weaknesses:</strong> Vulnerable to counter-attack on wings if wingback caught forward.</li>
  <li><strong>Meta picks:</strong> Mbappé + Vinícius + Salah forwards; Bellingham + Rodri mids; Theo + Hakimi wingbacks.</li>
  <li><strong>Win condition:</strong> Wingback overlap creates 3v2 wide; cut-back to forwards.</li>
</ul>` },
      { heading: 'When to pick each formation', html: `<ul>
  <li><strong>Division 10-7:</strong> 4-2-3-1 Wide (forgiving, balanced).</li>
  <li><strong>Division 6-4:</strong> 4-3-3 Attack (pace meta; punishes slow defenders).</li>
  <li><strong>Division 3-1:</strong> 4-2-3-1 Wide or 5-3-2 (meta vs Elite players).</li>
  <li><strong>Champions Qualifier:</strong> 4-2-3-1 Wide (consistent under pressure).</li>
  <li><strong>Trailing in match:</strong> Switch to 4-3-3 Attack high press.</li>
  <li><strong>Leading 1-0 last 5 min:</strong> Switch to 5-3-2 park bus.</li>
</ul>` },
    ],
    mistakes: [
      'Picking 4-3-3 in Division 10 (too aggressive for beginner)',
      'Sticking with one formation despite hard-losing 5 in a row',
      'Picking 3-4-3 without elite wingback (Theo/Hakimi tier)',
      'Park-bus 5-3-2 with no pace striker (no counter)',
      'Switching mid-match to a formation you haven\'t practiced',
    ],
    drill: {
      heading: 'Drill: One formation per week mastery',
      html: `<p>Pick S-tier 4-2-3-1 Wide. Play 30 Rivals games with it. Don't deviate. Track win rate. Then test A-tier 5-3-2 for the same 30 games. Compare. By month 2 you've mastered 2 formations and know when to swap. Most Division 5 players bounce 5+ formations weekly — that's the climb killer.</p>`,
    },
    aiVodMention: `<p>Formation right but losing? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags tactical execution + player positioning per goal. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'EAFC Beginner Guide 2026', url: '/blog/eafc-beginner-guide-2026.html' },
      { name: 'EAFC FUT Chemistry Deep Dive', url: '/blog/eafc-fut-chemistry-guide.html' },
      { name: 'How to Climb from Division 5 to Elite in EAFC', url: '/blog/eafc-div5-to-elite.html' },
      { name: 'EAFC Custom Tactics Guide', url: '/blog/eafc-custom-tactics-guide.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 10,
  },
  {
    game: 'eafc', gameLabel: 'EA Sports FC', fromRank: 'FUT', toRank: 'Chemistry Mastery',
    slug: 'eafc-fut-chemistry-guide',
    metaTitle: 'EAFC 26 FUT Chemistry Guide — Maximize Stats & Build the Meta',
    metaDescription: 'EAFC 2026 chemistry guide: link rules, Hero & Icon impact, position cards, 23-chem squad building, meta chemistry chains for Mbappé / Haaland / Bellingham.',
    intro: `<p>FUT Chemistry is the most misunderstood mechanic in EA Sports FC. Players at Division 5 build for highest-rated card, ignoring chem — an 88-rated card with 5 chemistry plays at 80-rated stats. This guide breaks down how chem works in 2026, the link rules, and how to build squads where every player hits full chemistry.</p>`,
    sections: [
      { heading: 'How chemistry works in EAFC 26', html: `<p>Each player has a chemistry score from 0-10. The squad chemistry is the total of all 11 players (max 33). Player chemistry boosts their stats — 5 chem = full boost.</p>
<ul>
  <li>Each player needs 5+ chemistry to play at full stats.</li>
  <li>Squad chemistry doesn't matter as much as individual chem.</li>
  <li>Below 5 chem = significant stat penalty (-3 to -5 across all stats).</li>
  <li>Manager bonuses add +1 chemistry to all players matching nation.</li>
</ul>` },
      { heading: 'The 4 chemistry link types', html: `<ul>
  <li><strong>League link (1 chem):</strong> Same Premier League / La Liga / Serie A etc. Most common link.</li>
  <li><strong>Nation link (1 chem):</strong> Same country. Cross-league.</li>
  <li><strong>Club link (2 chem):</strong> Same club (Real Madrid + Real Madrid). Highest single link.</li>
  <li><strong>Icon link:</strong> Icon cards count as link to any nation OR club.</li>
</ul>
<p>Build squads where every player has at least 2 links to other players. Example: Mbappé (France/Real Madrid) links to Bellingham (England/Real Madrid via club) AND Hernández (France via nation). Mbappé hits 3 chem easily.</p>` },
      { heading: 'Hero & Icon cards — chemistry game-changers', html: `<p>Hero Cards (mid-tier collectibles) and Icon Cards (legends) change chemistry math:</p>
<ul>
  <li><strong>Hero Cards</strong> — +2 chem boost to all players matching their league.</li>
  <li><strong>Icon Cards</strong> — links to any nation OR club (count as both).</li>
  <li><strong>Best meta Heroes:</strong> Premier League Heroes (link to massive PL pool); Bundesliga Heroes (link to Bayern/Dortmund stars).</li>
  <li><strong>Best meta Icons:</strong> Pelé, Cruyff, Maradona, Henry — link to any nation/club + stat-pumped.</li>
</ul>
<p>Building around Heroes/Icons lets you mix leagues without losing chem. Build a "Premier League + 1 Hero" squad with players from any league as long as Hero unlocks the chem.</p>` },
      { heading: 'Position cards — chemistry tax', html: `<p>Players in their preferred position get full chemistry. Out-of-position players lose chemistry unless you use a Position Card.</p>
<ul>
  <li><strong>Buy Position Cards</strong> at the SBC menu (cheap, ~500 coins each).</li>
  <li><strong>Lock in positions</strong> for players you've built around. Don't waste cards on rotation players.</li>
  <li><strong>Multi-position cards</strong> let some players play 2 positions (e.g., Bellingham plays CAM + CM).</li>
</ul>` },
      { heading: 'Meta chemistry chains for top players', html: `<p>Build squads around these meta chemistry chains:</p>
<ul>
  <li><strong>Mbappé (France/Real Madrid):</strong> + Bellingham (England/Real Madrid via club) + Theo Hernández (France via nation) + Vinícius (Brazil/Real Madrid via club). 4 players, 6 chem links.</li>
  <li><strong>Haaland (Norway/Man City):</strong> + Rodri (Spain/Man City via club) + De Bruyne (Belgium/Man City via club) + Ederson (Brazil/Man City via club). 4 players, 6 chem links.</li>
  <li><strong>Bellingham + Saka (England):</strong> + Trent (England/Liverpool via nation) + Foden (England/Man City via nation). 4 England players, 6 chem links.</li>
</ul>` },
      { heading: 'Mixed-league squads — the Hero hack', html: `<p>If you want top-rated players from multiple leagues:</p>
<ul>
  <li>Add a Premier League Hero (Drogba / Vidic / Henry-style cards).</li>
  <li>Add an Icon (Pelé / Cruyff).</li>
  <li>Use them as chemistry "bridge" — links to any nation + club + league simultaneously.</li>
  <li>Result: Mbappé + Haaland + Vinícius can all be in the same squad with full chem.</li>
</ul>` },
      { heading: 'The 23-chem checklist', html: `<ul>
  <li>Each player has 5+ chemistry individually.</li>
  <li>Front 3 forwards: 3 chem each (full attack stats).</li>
  <li>Midfield 3: 3 chem each (full passing + dribbling stats).</li>
  <li>Defense 4: 3 chem each (full defending + physical stats).</li>
  <li>GK: 1 chem (Diving + Handling + Reflexes).</li>
  <li>Total: 23+ chem with attacking + defensive balance.</li>
</ul>
<p>Don't build for 33 chem at the cost of 78-rated players. 80-rated with 23 chem outperforms 88-rated with 18 chem.</p>` },
    ],
    mistakes: [
      'Building for highest-rated cards, ignoring chemistry',
      'Mixing 6 leagues without a chemistry-bridge Icon/Hero',
      'Not buying Position Cards (out-of-position chemistry loss)',
      'Stacking same league for "easy" chem (player rating cap)',
      'Not using Manager bonus chemistry boost',
    ],
    drill: {
      heading: 'Drill: Build 3 squads, track win rate',
      html: `<p>Build 3 squads: 1 high-rated low-chem, 1 mid-rated high-chem, 1 mixed-league Hero-bridge. Play 10 Rivals games each. Track win rate. The winning squad shows you chemistry > rating in 2026. Iterate.</p>`,
    },
    aiVodMention: `<p>Chemistry right but losing? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags tactical + player-pick errors. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'EAFC Beginner Guide 2026', url: '/blog/eafc-beginner-guide-2026.html' },
      { name: 'EAFC Best Formations Tier List', url: '/blog/eafc-best-formations-2026.html' },
      { name: 'How to Climb from Division 5 to Elite', url: '/blog/eafc-div5-to-elite.html' },
      { name: 'EAFC Custom Tactics Guide', url: '/blog/eafc-custom-tactics-guide.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 10,
  },
  {
    game: 'eafc', gameLabel: 'EA Sports FC', fromRank: 'Division 5', toRank: 'Elite Division',
    slug: 'eafc-div5-to-elite',
    metaTitle: 'How to Climb from Division 5 to Elite in EAFC 26',
    metaDescription: 'EAFC Division 5 to Elite — advanced skill move combos, pro defending, tactic switching mid-game, FUT Champions prep, and the mental game that wins the weekend tournament.',
    intro: `<p>Division 5 to Elite Division is the biggest skill jump in EAFC. Beginner habits won't cut it. Elite players have skill move combos, pro defending instincts, tactical adapts every 15 minutes, and tournament-grade mental management. This guide breaks down what separates Division 5 from Elite.</p>`,
    sections: [
      { heading: 'Skill move combos — the 5-star meta', html: `<p>5-star skill move strikers (Mbappé, Vinícius, Salah, Saka) unlock the cut-inside meta. Combos:</p>
<ul>
  <li><strong>Cut-inside finesse:</strong> R1 + R-stick toward goal → Finesse Shot (Square). Top corner from 18 yards.</li>
  <li><strong>Heel-to-heel:</strong> L1 + L1 (heel flick) → Shot. Skip past CB.</li>
  <li><strong>Rainbow flick:</strong> L1 + R-stick up. Unguardable but high-risk.</li>
  <li><strong>Ball roll + through ball:</strong> L1 + R-stick across → L1 + Cross. Split-second through-ball setup.</li>
</ul>
<p>Drill each combo 100 times in skill games before using in Rivals. Half-baked execution gives ball away.</p>` },
      { heading: 'Pro defending — manual select + jockey discipline', html: `<p>Elite defending is manual control:</p>
<ul>
  <li><strong>Manual CB select (L1 + R-stick):</strong> Switch to the right defender on every counter-attack.</li>
  <li><strong>Jockey (L2):</strong> Back off + angle attacker to weak foot.</li>
  <li><strong>L2 + R-stick (full manual):</strong> Position your defender precisely on box entry.</li>
  <li><strong>Stand-up tackle (X / Press):</strong> Default tackle; never slide in box.</li>
  <li><strong>Container press:</strong> R1 + auto-pressure on 2nd attacker.</li>
</ul>
<p>At Elite, you control every defender manually during box entries. Auto-defense at Division 5 is throwing.</p>` },
      { heading: 'Tactic switching — every 15 minutes', html: `<p>Elite players adapt tactics 3-5 times per match. Triggers:</p>
<ul>
  <li><strong>0-0 at 30 min:</strong> Stay default Balanced (Tactic 2).</li>
  <li><strong>Losing 0-1 at 60 min:</strong> Switch to High Press (Tactic 1). Depth 85, Aggressive Interceptions.</li>
  <li><strong>Winning 1-0 at 80 min:</strong> Switch to Park Bus (Tactic 3). Depth 45, Drop Back.</li>
  <li><strong>Drawn 1-1 in extra time:</strong> High Press + Counter-Attack. Risky but Elite-tier decisive.</li>
</ul>` },
      { heading: 'FUT Champions weekend prep', html: `<p>FUT Champions is the weekend tournament. 10-15 games over 2 days. Rewards scale steeply.</p>
<ul>
  <li>Take 2-day prep: practice 4-5 Rivals games, no more (avoid tilt).</li>
  <li>Sleep 8 hours before tournament weekend.</li>
  <li>Hydrate + minimal caffeine (smooth reflexes).</li>
  <li>Between games: 5-minute breaks (no scrolling Twitter).</li>
  <li>Track wins/losses per session; stop after 3 losses in a row.</li>
</ul>
<p>Tournament tilt is the biggest Elite-tier killer. Mental game is 40% of Champions performance.</p>` },
      { heading: 'Counter-attack timing — the Elite finishing move', html: `<p>Elite players score 60% of goals on counter-attacks. Setup:</p>
<ul>
  <li>Defensive turnover (interception or block).</li>
  <li>Quick pass to CDM (R1 + Pass).</li>
  <li>CDM long ball to ST/winger break.</li>
  <li>Pace striker run behind defense.</li>
  <li>Finish: 1v1 GK or cut-back to onrushing CAM.</li>
</ul>
<p>Counter-attack scoring rate at Elite is 70%+; at Division 5 it's 25%. The gap is pace timing + finishing efficiency.</p>` },
      { heading: 'Mental game — the Elite plateau breaker', html: `<p>At Elite, mechanics are equal. Mental wins games:</p>
<ul>
  <li>Track wins/losses per session.</li>
  <li>Stop playing after 3 losses (tilt protocols).</li>
  <li>Don't chase wins in last 30 min of session.</li>
  <li>Don't blame teammates in Pro Clubs (kills morale).</li>
  <li>Watch pro EAFC streamers between matches (passive learning).</li>
</ul>` },
      { heading: 'The 6 habits separating Division 5 from Elite', html: `<ul>
  <li>5-star skill move combos drilled 100+ reps.</li>
  <li>Manual defender select on every box entry.</li>
  <li>Tactic switching every 15 min based on score.</li>
  <li>Counter-attack scoring rate 60%+.</li>
  <li>FUT Champions prep — sleep + breaks + tilt protocols.</li>
  <li>Custom tactics + formation specialization (1 main + 1 backup).</li>
</ul>` },
    ],
    mistakes: [
      'Spamming skill moves in Rivals (predictable + risky)',
      'Auto-defending instead of manual select',
      'Sticking with default tactics 90 minutes',
      'Playing through 5+ losses despite tilt',
      'Counter-attack scoring rate below 40%',
      'Switching formations every game in Division 3-1',
    ],
    drill: {
      heading: 'Drill: 30-day Elite Division regimen',
      html: `<ul>
  <li><strong>Week 1:</strong> 5-star skill move combos in skill games — 100 reps each.</li>
  <li><strong>Week 2:</strong> Manual defender select drill in Rivals — 10 games tracked.</li>
  <li><strong>Week 3:</strong> Tactic switching practice — 10 games with 3 tactical adapts each.</li>
  <li><strong>Week 4:</strong> FUT Champions prep weekend — full tournament with all habits.</li>
</ul>
<p>By day 30 you've trained Elite habits. Most Division 5 players plateau because they don't drill consistently.</p>`,
    },
    aiVodMention: `<p>Elite gap won't close? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags decision-making, formation choice, or skill move timing errors per goal. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'EAFC Beginner Guide 2026', url: '/blog/eafc-beginner-guide-2026.html' },
      { name: 'EAFC Best Formations Tier List', url: '/blog/eafc-best-formations-2026.html' },
      { name: 'EAFC FUT Chemistry Guide', url: '/blog/eafc-fut-chemistry-guide.html' },
      { name: 'EAFC Custom Tactics Guide', url: '/blog/eafc-custom-tactics-guide.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 11,
  },
  {
    game: 'eafc', gameLabel: 'EA Sports FC', fromRank: 'Tactics', toRank: 'Mastery',
    slug: 'eafc-custom-tactics-guide',
    metaTitle: 'EAFC 26 Custom Tactics Guide — High Press / Balanced / Park Bus',
    metaDescription: 'EAFC custom tactics guide: 3 presets (High Press, Balanced, Park Bus), depth + width settings, player instructions, when to switch in-match.',
    intro: `<p>Custom Tactics in EA Sports FC are how Elite players adapt mid-match. Setting them right is more impactful than your formation choice. This guide gives you 3 preset Custom Tactics (slots 1/2/3 in-match), the depth + width math, and the exact triggers for switching.</p>`,
    sections: [
      { heading: 'How Custom Tactics work in EAFC 26', html: `<p>You have 5 Custom Tactic slots per squad. Set them in Squad Management. In-match: L1 + D-pad up/right/down/left activates Tactic 1/2/3/4. Two types of settings:</p>
<ul>
  <li><strong>Defensive Style</strong> — Drop Back / Pressure on Heavy Touch / Aggressive Interceptions / Constant Pressure.</li>
  <li><strong>Offensive Style</strong> — Counter-Attack / Quick Build Up / Balanced / Possession.</li>
  <li><strong>Depth (1-100)</strong> — how high your defensive line sits. Higher = more aggressive press but more counter-attack risk.</li>
  <li><strong>Width (1-100)</strong> — how wide your players spread. Higher = wider attacks but more central gaps.</li>
</ul>` },
      { heading: 'Tactic 1 — High Press preset', html: `<ul>
  <li><strong>Defensive Style:</strong> Aggressive Interceptions</li>
  <li><strong>Offensive Style:</strong> Quick Build Up, Direct Passing</li>
  <li><strong>Depth:</strong> 85</li>
  <li><strong>Width:</strong> 50</li>
  <li><strong>Player Instructions:</strong> Wingers — Stay Wide. CDM — Stay Back. CAM — Get Forward. STs — Get in Behind.</li>
</ul>
<p><strong>Triggers:</strong> Losing 0-1 at 60+ min; need to force goals; opponent parking the bus.</p>
<p>High Press wins late goals but bleeds counter-attack damage. Don't use full match.</p>` },
      { heading: 'Tactic 2 — Balanced preset (default)', html: `<ul>
  <li><strong>Defensive Style:</strong> Pressure on Heavy Touch</li>
  <li><strong>Offensive Style:</strong> Balanced, Mixed Passing</li>
  <li><strong>Depth:</strong> 65</li>
  <li><strong>Width:</strong> 50</li>
  <li><strong>Player Instructions:</strong> Wingers — Mixed. CDMs — Stay Back. CAM — Free Roam. STs — Stay Forward.</li>
</ul>
<p><strong>Triggers:</strong> Default 1st half setting; 0-0 game state; balanced opponent.</p>
<p>This is your home base. Switch to Tactic 1 or 3 based on game state.</p>` },
      { heading: 'Tactic 3 — Park the Bus preset', html: `<ul>
  <li><strong>Defensive Style:</strong> Drop Back, Compact Lines</li>
  <li><strong>Offensive Style:</strong> Counter-Attack, Long Ball</li>
  <li><strong>Depth:</strong> 45</li>
  <li><strong>Width:</strong> 35</li>
  <li><strong>Player Instructions:</strong> Wingers — Stay Wide. CDMs — Cover Center. CAM — Stay Back. STs — Get in Behind.</li>
</ul>
<p><strong>Triggers:</strong> Winning 1-0 in last 5 minutes; vs faster opponent; vs Elite player with skill-move attack.</p>
<p>Park Bus is throwing 50-50 if you don't have pace counter-attackers. Mbappé / Haaland on counter is meta.</p>` },
      { heading: 'Optional Tactic 4 — Possession preset', html: `<ul>
  <li><strong>Defensive Style:</strong> Drop Back</li>
  <li><strong>Offensive Style:</strong> Possession, Short Passing</li>
  <li><strong>Depth:</strong> 55</li>
  <li><strong>Width:</strong> 60</li>
  <li><strong>Player Instructions:</strong> CDMs — Press on Heavy Touch. CAM — Free Roam. STs — Drop Back.</li>
</ul>
<p><strong>Triggers:</strong> Possession comp (Pedri + De Bruyne in midfield); vs aggressive opponent who needs to chase.</p>` },
      { heading: 'Tactic-switching triggers — the 5 mid-match cues', html: `<ul>
  <li><strong>Score 1-0 lead at 75 min:</strong> Switch to Tactic 3 (Park Bus) immediately.</li>
  <li><strong>Concede 0-1 at 60 min:</strong> Switch to Tactic 1 (High Press) and force tempo.</li>
  <li><strong>Drawn 1-1 in last 10 min:</strong> Tactic 1 + push for winner (high risk/high reward).</li>
  <li><strong>Winning 2-0 at 70 min:</strong> Tactic 3 (Park Bus) immediately; preserve lead.</li>
  <li><strong>0-0 stalemate at 50 min:</strong> Stay on Tactic 2 Balanced; don't over-commit.</li>
</ul>` },
      { heading: 'The Elite tactic-switching habit', html: `<p>Elite players switch tactics 3-5 times per match. Division 5 players stick with one tactic and lose 50% of games on poor adaptation. Practice switching with muscle memory: L1 + D-pad up = Tactic 1, D-pad right = Tactic 2, D-pad down = Tactic 3. Repeat in skill games until automatic.</p>` },
    ],
    mistakes: [
      'Sticking with default Tactic 2 for full 90 minutes',
      'Switching to High Press at 0-0 (lose counter risk)',
      'Park-Bus 5-3-2 with no pace striker',
      'Not setting Custom Tactics 1/3 at all (only Tactic 2 default)',
      'Switching tactics every 5 minutes (no commit)',
    ],
    drill: {
      heading: 'Drill: 7-day tactic-switching mastery',
      html: `<p>Day 1-2: Set up Custom Tactics 1/2/3 with the presets above. Day 3-4: Play 5 Squad Battle games practicing the switch (Tactic 1 if losing, Tactic 3 if winning last 5 min). Day 5-7: Play 5 Rivals games tracking tactic-switches per match. Target: 3-5 switches per game. By day 7 the switch is muscle memory.</p>`,
    },
    aiVodMention: `<p>Tactics right but losing? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags timing of tactic switches per goal conceded. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'EAFC Beginner Guide 2026', url: '/blog/eafc-beginner-guide-2026.html' },
      { name: 'EAFC Best Formations Tier List', url: '/blog/eafc-best-formations-2026.html' },
      { name: 'EAFC FUT Chemistry Guide', url: '/blog/eafc-fut-chemistry-guide.html' },
      { name: 'How to Climb from Division 5 to Elite', url: '/blog/eafc-div5-to-elite.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
]

// ============================================================================
// TEKKEN 8 POSTS (5)
// ============================================================================
// Fighting game cluster — Tekken 8 ranked is the most coachable game on the
// platform (frame data, matchups, BnBs are all explicit).
const TK8_POSTS = [
  {
    game: 'tk8', gameLabel: 'Tekken 8', fromRank: 'Beginner', toRank: '1st Dan',
    slug: 'tekken-8-beginner-guide-2026',
    metaTitle: 'Tekken 8 Beginner Guide — Climb From Beginner to 1st Dan',
    metaDescription: 'Tekken 8 beginner guide: character picks, BnB combos, defensive basics (sidestep, parry, KBD), Heat system, ranked progression. Get out of Beginner ranks.',
    intro: `<p>Tekken 8 has the steepest learning curve in fighting games. 30 ranks, 30+ characters, 100+ moves per character, frame data that determines every interaction. But the climb from Beginner to 1st Dan only requires four things: pick a character, learn 2 BnB combos, learn to sidestep, learn to KBD. Drill these for two weeks and 1st Dan is automatic.</p>`,
    sections: [
      { heading: 'Pick one character — not the whole roster', html: `<p>Tekken 8 has 32+ characters as of 2026. You'll never master all of them. Pick one and stay for 100+ ranked matches:</p>
<ul>
  <li><strong>Beginner-friendly:</strong> Paul, Jin, Lars — easy BnBs, strong baseline mid-range game.</li>
  <li><strong>Aggressive:</strong> Hwoarang, Lars — multiple stance pressure, oki specialist.</li>
  <li><strong>Defensive:</strong> Asuka, Jun — parry kicks, sidestep punisher, reactive defense.</li>
  <li><strong>Mishima (hard):</strong> Kazuya, Heihachi, Reina — Electric Wind God Fist execution required.</li>
</ul>
<p>If unsure: pick Paul. His Deathfist (qcf+2) is easy, his BnB is df+1+2 → 1,2,1 → Deathfist → wall. Master him in 100 matches, then expand.</p>` },
      { heading: 'Learn 2 BnB combos — not 30', html: `<p>BnB = "bread and butter" — the combo every Tekken player needs. Pick a launcher (df+2 for most chars), pick a wall ender, learn the connection:</p>
<ul>
  <li><strong>Paul BnB:</strong> df+1+2 → 1,2,1 → Deathfist → wall.</li>
  <li><strong>Jin BnB:</strong> df+2 → 1,4 → b+3,1 → Heat Engager → ZEN combo → wall.</li>
  <li><strong>Asuka BnB:</strong> df+2 → 1,4 → b+4 → Heat Engager → wall.</li>
</ul>
<p>Drill in Practice Mode 100 times per combo. Don't move on until you can land it 8/10 attempts. BnB execution is the single biggest skill gap in Tekken Beginner ranks.</p>` },
      { heading: 'Sidestepping — the #1 defensive skill', html: `<p>Tekken has 3D movement. Sidestep (SS+L for left, SS+R for right) lets you dodge linear strings. 60% of moves in Tekken 8 are sidesteppable.</p>
<ul>
  <li>Tap up to step right, down to step left (in default config).</li>
  <li>Sidestep during opponent's commit (their string is 5+ frames).</li>
  <li>After sidestep, punish with df+2 launcher or 1, 4 combo.</li>
  <li>Sidewalk (SS-walk hold) for sustained spacing.</li>
</ul>
<p>Beginner players block everything; 1st Dan players sidestep. This is the gateway skill.</p>` },
      { heading: 'KBD (Korean Backdash) — spacing essential', html: `<p>KBD = Korean Backdash. Press back-back-back-back rapidly to chain backdashes faster than walking forward. Keeps you at whiff-punish range.</p>
<ul>
  <li>Default input: b, b, b, b (or back-cancel-back-cancel).</li>
  <li>Practice for 10 min/day in training mode until automatic.</li>
  <li>Used to escape pressure + maintain whiff-punish range (~15 frames).</li>
  <li>Counter-spacing: when KBD'd, opponent's committed move whiffs.</li>
</ul>` },
      { heading: 'The Heat system — Tekken 8\'s new mechanic', html: `<p>Heat is the new Tekken 8 system. Heat gauge fills passively + on offense.</p>
<ul>
  <li><strong>Heat Engager:</strong> special move that enters Heat on hit.</li>
  <li><strong>Heat Burst:</strong> instant burst, ends Heat.</li>
  <li><strong>Heat Smash:</strong> devastating finish during Heat (R1+R2).</li>
  <li><strong>Duration:</strong> ~15 seconds; combo damage boosted.</li>
</ul>
<p>Save Heat for round-deciding moments. Don't burn it on the round opener.</p>` },
      { heading: 'Ranked progression — Beginner to 1st Dan', html: `<p>Tekken 8 ranks: Beginner → 1st Dan → 5th Dan → Bushin → Tenrai → Tekken King → Tekken Emperor → Tekken God.</p>
<ul>
  <li>Beginner (0-9): Learn 1 character; play 50 ranked matches.</li>
  <li>1st Dan: BnB combo mastery + sidestep practice.</li>
  <li>Win rate above 55% over 10 matches = ready to climb.</li>
  <li>Skip if losing 3 in a row (tilt-stack costs 5+ matches).</li>
</ul>` },
      { heading: 'The 8 habits that get you to 1st Dan', html: `<ul>
  <li>Pick 1 character; never deviate for 100 matches.</li>
  <li>Master 2 BnB combos to 8/10 execution rate.</li>
  <li>Sidestep linear strings in every match.</li>
  <li>Practice KBD 10 min/day until automatic.</li>
  <li>Use Heat Engager → wall combo for round-deciding damage.</li>
  <li>Watch pro VOD between sessions (Knee, Arslan Ash matches).</li>
  <li>Stop after 3 losses (tilt protocols).</li>
  <li>15 minutes of Practice Mode before every session.</li>
</ul>` },
    ],
    mistakes: [
      'Bouncing characters every 5 matches',
      'Learning 20 combos instead of mastering 2',
      'Block-everything defense (no sidestep)',
      'Burning Heat at round start',
      'No Practice Mode warm-up before ranked',
    ],
    drill: {
      heading: 'Drill: 14-day Tekken fundamentals',
      html: `<ul>
  <li><strong>Day 1-3:</strong> Pick character. Drill 2 BnB combos to 8/10 execution.</li>
  <li><strong>Day 4-7:</strong> 100 KBD reps daily. Sidestep practice (sidestep 5 times every match).</li>
  <li><strong>Day 8-10:</strong> Ranked matches. Track win rate. Pause replays to identify mistakes.</li>
  <li><strong>Day 11-14:</strong> Heat management practice + wall combo refinement.</li>
</ul>
<p>By day 14 you're 1st Dan or higher. Most Beginner players stay because they refuse to drill consistently.</p>`,
    },
    aiVodMention: `<p>Stuck despite drilling? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags specific frame disadvantage or sidestep miss patterns. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'Tekken 8 Character Tier List 2026', url: '/blog/tekken-8-tier-list-2026.html' },
      { name: 'Tekken 8 BnB Combos Per Character', url: '/blog/tekken-8-bnb-combos-guide.html' },
      { name: 'How to Climb from 1st Dan to Tekken King', url: '/blog/tekken-8-1st-dan-to-king.html' },
      { name: 'Tekken 8 Matchup Chart 2026', url: '/blog/tekken-8-matchup-chart-2026.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 10,
  },
  {
    game: 'tk8', gameLabel: 'Tekken 8', fromRank: 'Character', toRank: 'Tier List',
    slug: 'tekken-8-tier-list-2026',
    metaTitle: 'Tekken 8 Character Tier List 2026 — Best Picks for Ranked',
    metaDescription: 'Tekken 8 tier list 2026: S-tier Mishimas + Hwoarang, A-tier Kazuya + Jin + King, B-tier mains. Pick rationale, win rate, matchup notes per character.',
    intro: `<p>Tekken 8 has 32+ characters as of 2026. This is the ranked tier list — S/A/B with breakdown of what each character excels at. Tournament picks differ from ranked picks; this is the ranked grind meta.</p>`,
    sections: [
      { heading: 'S-Tier — Top 5 ranked picks', html: `<ul>
  <li><strong>Hwoarang</strong> — Stance pressure + multi-kick mix-ups. Highest win-rate stance character.</li>
  <li><strong>Reina</strong> — Mishima newcomer. Wind God Step Lite + Senjutsu stance. Easy execution Mishima.</li>
  <li><strong>King</strong> — Grappler. Chain throws (Rolling Death Cradle), oki specialist.</li>
  <li><strong>Bryan</strong> — Counter-hit god. Snake Edge + Taunt setup makes opponents block.</li>
  <li><strong>Steve</strong> — Boxer. Flicker stance, mid-range frame trap, easy to climb with.</li>
</ul>` },
      { heading: 'A-Tier — Strong meta picks', html: `<ul>
  <li><strong>Kazuya</strong> — Classic Mishima. Hard but rewarding; Electric Wind God Fist (EWGF) is the climbing tool.</li>
  <li><strong>Jin</strong> — All-Rounder. ZEN stance, balanced kit, beginner-friendly.</li>
  <li><strong>Heihachi</strong> — Mishima. Similar to Kazuya but slightly different mix-up game.</li>
  <li><strong>Lars</strong> — Rushdown. Dynamic Entry stance, easy Heat-burst combos.</li>
  <li><strong>Yoshimitsu</strong> — Mix-Up specialist. Manji stance, sword pokes, suicide unblockable.</li>
  <li><strong>Lee</strong> — Hitman stance specialist; frame-perfect mix-ups for advanced players.</li>
  <li><strong>Devil Jin</strong> — Mishima variant with air mobility. Laser sweep mix-up.</li>
  <li><strong>Asuka</strong> — Defensive Counter. Parry game + sidestep punisher.</li>
</ul>` },
      { heading: 'B-Tier — Strong but specialized', html: `<ul>
  <li><strong>Paul</strong> — Beginner-friendly damage striker. Deathfist (qcf+2) does massive damage.</li>
  <li><strong>Jun</strong> — Defensive footsie character. Parry + spacing.</li>
  <li><strong>Lili</strong> — Whiff-punish queen. Sidestep specialist.</li>
  <li><strong>Marduk</strong> — Grappler 2. Anaconda throw + brawler pressure.</li>
  <li><strong>Nina</strong> — Assassin. Command grabs + frame traps.</li>
  <li><strong>Kuma</strong> — Grappler 3. Hunting Bear stance + fart cancel mind games.</li>
  <li><strong>Anna</strong> — Counter-hit specialist with gunshot zoning.</li>
  <li><strong>Eddy Gordo</strong> — Capoeira stance pressure.</li>
  <li><strong>Azucena</strong> — Heat Burst specialist; Libertador stance.</li>
  <li><strong>Victor</strong> — Sword + gun pokes; sniper-zone character.</li>
</ul>` },
      { heading: 'Why S-tier wins in ranked', html: `<p>S-tier characters have low-execution mix-ups + high reward. Hwoarang's stance pressure beats most defensive characters. Reina's Wind God Step Lite gives Mishima access without EWGF execution. King's grappler kit has chain throws that swing rounds with one read. Bryan's counter-hit game punishes opponents who try to interrupt. Steve has the cleanest frame-trap pressure in the game.</p>
<p>Don't pick an A or B character if you can flex to S — ranked rewards efficiency, not flair. See <a href="/blog/tekken-8-matchup-chart-2026.html">our matchup chart</a> for matchup advantages.</p>` },
      { heading: 'Beginner vs Veteran tier list differences', html: `<p>For beginners: pick easy A-tier (Jin, Paul, Lars). For veterans: optimize S-tier (Hwoarang, Reina, King). The execution gap between these is significant — a beginner Hwoarang loses to a beginner Paul, but a veteran Hwoarang demolishes a veteran Paul.</p>
<p>Pick by your execution comfort, not just tier. A "weaker" character you play well beats an "S-tier" you struggle to execute.</p>` },
    ],
    mistakes: [
      'Picking S-tier despite no execution capacity (Kazuya without EWGF)',
      'Picking your "main" because of looks/lore (Yoshimitsu fan disservice)',
      'Bouncing tier list rankings every patch',
      'Picking B-tier for "uniqueness" in a competitive ladder',
      'Ignoring matchup chart when picking character',
    ],
    drill: {
      heading: 'Drill: Pick 1 character per month',
      html: `<p>Pick one S-tier character (Hwoarang or Reina recommended for accessibility). Play 100 ranked matches. Track win rate. Then test one A-tier (Jin or Kazuya). Compare. By month 3 you've mastered 2 characters at S/A level and know when to pick which.</p>`,
    },
    aiVodMention: `<p>Character pick right but losing? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags execution / sidestep / Heat management errors. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'Tekken 8 Beginner Guide 2026', url: '/blog/tekken-8-beginner-guide-2026.html' },
      { name: 'Tekken 8 BnB Combos Per Character', url: '/blog/tekken-8-bnb-combos-guide.html' },
      { name: 'How to Climb from 1st Dan to Tekken King', url: '/blog/tekken-8-1st-dan-to-king.html' },
      { name: 'Tekken 8 Matchup Chart 2026', url: '/blog/tekken-8-matchup-chart-2026.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
  {
    game: 'tk8', gameLabel: 'Tekken 8', fromRank: 'Combos', toRank: 'Mastery',
    slug: 'tekken-8-bnb-combos-guide',
    metaTitle: 'Tekken 8 BnB Combos Guide — Essential Combos Per Character',
    metaDescription: 'Tekken 8 BnB combos for every meta character. Paul, Jin, Kazuya, King, Hwoarang, Reina, Asuka. Damage, difficulty, Heat extensions, wall enders.',
    intro: `<p>BnB combos (Bread-and-Butter) are the foundation of Tekken 8 damage. Every character has 2-3 essential combos — learn these before adding flair. This guide covers BnBs for the 10 meta characters with damage numbers, difficulty, and wall extensions.</p>`,
    sections: [
      { heading: 'How combos work in Tekken 8', html: `<p>Tekken combos follow a structure: launcher (df+2, ws+2, etc.) → juggle filler → Heat Engager (optional) → wall splat → wall combo.</p>
<ul>
  <li><strong>Launcher:</strong> Move that puts opponent in air state. Most universal: df+2.</li>
  <li><strong>Juggle:</strong> Multi-hit string while opponent is airborne (~3-4 hits).</li>
  <li><strong>Heat Engager:</strong> Optional Heat-entering move (specific to character).</li>
  <li><strong>Wall Splat (W!):</strong> Hit opponent against the wall for additional damage.</li>
  <li><strong>Wall Combo:</strong> Multi-hit string after wall splat (~3-4 more hits).</li>
</ul>
<p>Each character has 1-3 launchers and unique juggle paths. Learn one BnB per launcher.</p>` },
      { heading: 'Paul BnB combos', html: `<ul>
  <li><strong>Basic:</strong> df+1+2 (launcher) → 1, 2, 1 → Deathfist (qcf+2) → wall splat. Damage ~75. <strong>Difficulty: Easy</strong></li>
  <li><strong>Heat Engager:</strong> df+1+2 → 1, 2, 1 → Heat Engager (b+1,2) → dash → Deathfist → wall. Damage ~95. <strong>Difficulty: Medium</strong></li>
  <li><strong>Wall combo:</strong> Wall splat → 1, 2 → Deathfist. Damage +30.</li>
</ul>
<p>Paul's Deathfist (qcf+2) is the easiest high-damage move in the game. Drill the Deathfist canceling for 100 reps.</p>` },
      { heading: 'Jin BnB combos', html: `<ul>
  <li><strong>Basic:</strong> df+2 (launcher) → 1, 4 → b+3, 1 → Heat Engager (uf+4) → ZEN combo. Damage ~70. <strong>Difficulty: Medium</strong></li>
  <li><strong>Heat extension:</strong> Heat Engager → ZEN combo → wall splat. Damage ~85. <strong>Difficulty: Medium</strong></li>
  <li><strong>Wall combo:</strong> Wall splat → b+3, 1 → ZEN combo. Damage +35.</li>
</ul>` },
      { heading: 'Kazuya BnB combos', html: `<ul>
  <li><strong>Electric Wind God Fist (EWGF):</strong> f, n, d, df+2 (just-frame execution). Damage 30 launcher. <strong>Difficulty: Hard</strong></li>
  <li><strong>Mishima BnB:</strong> EWGF (launcher) → b+3 → dash → f+4 → Heat Engager → wall. Damage ~80. <strong>Difficulty: Hard</strong></li>
  <li><strong>Wall combo:</strong> Wall splat → 1, 1, 2 → Twin Pistons (qcf+1+2). Damage +40.</li>
</ul>
<p>EWGF requires just-frame execution. Practice in training mode for 200+ reps until consistent.</p>` },
      { heading: 'King BnB combos', html: `<ul>
  <li><strong>Basic:</strong> df+2 (launcher) → ff+2, 1 → S! (Slap) → 1+3 (grab) → 2+4 (grab) → 1+3 (grab). Damage ~85 (chain throw). <strong>Difficulty: Medium</strong></li>
  <li><strong>Heat Engager:</strong> ff+2, 1 → Heat Engager (b+1+2) → chain throw. Damage ~95.</li>
  <li><strong>Wall combo:</strong> Wall splat → 1, 2 → Rolling Death Cradle (qcb+2). Damage +50.</li>
</ul>` },
      { heading: 'Hwoarang BnB combos', html: `<ul>
  <li><strong>Basic:</strong> df+3, 2 (launcher) → Right Flamingo (RFS) → 4, 4 → Heat Engager → wall. Damage ~65. <strong>Difficulty: Medium</strong></li>
  <li><strong>RFS Pressure:</strong> RFS → 3, 4 → LFS (Left Flamingo) → kick string. Block pressure setup.</li>
  <li><strong>Wall combo:</strong> Wall splat → 1, 3 → RFS kick string. Damage +30.</li>
</ul>` },
      { heading: 'Reina BnB combos', html: `<ul>
  <li><strong>Wind God Step Lite:</strong> f, n, d, df+2 (similar to EWGF but easier). Damage 30. <strong>Difficulty: Hard</strong></li>
  <li><strong>Mishima BnB:</strong> WGS Lite → b+3, 4 → dash → Heat Engager → wall. Damage ~70.</li>
  <li><strong>Senjutsu Stance:</strong> Cancel into Senjutsu (b+1+2) → kick string for pressure.</li>
</ul>` },
      { heading: 'Asuka BnB combos', html: `<ul>
  <li><strong>Basic:</strong> df+2 (launcher) → 1, 4 → b+4 → Heat Engager → wall. Damage ~60. <strong>Difficulty: Medium</strong></li>
  <li><strong>Parry combo:</strong> Parry (1+2) → df+2 → 1, 4 → wall. Damage ~70.</li>
  <li><strong>Wall combo:</strong> Wall splat → 1, 4 → b+4. Damage +25.</li>
</ul>` },
      { heading: 'Practice mode regimen — 100 reps per combo', html: `<p>Tekken 8 has built-in combo recording in Practice Mode. Record opponent at "block" or "neutral guard" position. Drill BnB combo:</p>
<ul>
  <li>Day 1: 100 reps; pause if losing rhythm.</li>
  <li>Day 2: 100 reps; aim for 8/10 execution rate.</li>
  <li>Day 3: 100 reps; integrate wall extension.</li>
  <li>Day 4: 100 reps; integrate Heat extension.</li>
  <li>Day 5+: Apply in ranked matches.</li>
</ul>
<p>Don't skip Practice. BnB execution at 8/10 hit rate is the difference between 1st Dan and Bushin rank.</p>` },
    ],
    mistakes: [
      'Learning 20 combos shallow vs 2 combos deep',
      'No Practice Mode reps before ranked',
      'Dropping combos in ranked due to no muscle memory',
      'Skipping wall extension (50% damage missed)',
      'Burning Heat outside Heat Engager combo',
    ],
    drill: {
      heading: 'Drill: 7-day BnB mastery',
      html: `<p>Pick 2 BnB combos for your character. Drill 100 reps per day in Practice Mode for 7 days. By day 7, execution should be 8/10+. Apply in ranked. Track win rate; BnB execution alone gives you 1-2 ranks.</p>`,
    },
    aiVodMention: `<p>Combos right but losing? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags whiff-punish opportunities + defensive sidestep misses. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'Tekken 8 Beginner Guide 2026', url: '/blog/tekken-8-beginner-guide-2026.html' },
      { name: 'Tekken 8 Character Tier List 2026', url: '/blog/tekken-8-tier-list-2026.html' },
      { name: 'How to Climb from 1st Dan to Tekken King', url: '/blog/tekken-8-1st-dan-to-king.html' },
      { name: 'Tekken 8 Matchup Chart 2026', url: '/blog/tekken-8-matchup-chart-2026.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
  {
    game: 'tk8', gameLabel: 'Tekken 8', fromRank: '1st Dan', toRank: 'Tekken King',
    slug: 'tekken-8-1st-dan-to-king',
    metaTitle: 'How to Climb from 1st Dan to Tekken King in Tekken 8',
    metaDescription: 'Tekken 8 1st Dan to Tekken King — frame data basics, matchup-specific punishes, oki mix-up game, Heat management, mental discipline for ranked grind.',
    intro: `<p>1st Dan to Tekken King is the biggest skill jump in Tekken 8. Beginner habits won't cut it. Tekken King players have frame data knowledge, matchup-specific punishes, oki mix-up game, and tournament-tier mental management. This guide breaks down what separates 1st Dan from Tekken King.</p>`,
    sections: [
      { heading: 'Frame data — the language of Tekken', html: `<p>Every Tekken 8 move has frame data: startup frames, on-block advantage, on-hit advantage. Tekken King players know frame data for their character's 20 most-used moves.</p>
<ul>
  <li><strong>Startup:</strong> Frames before the move hits (10-frame jab = fast).</li>
  <li><strong>On-block:</strong> If +0 or worse, opponent has frame advantage; if -10 or worse, opponent can launch.</li>
  <li><strong>On-hit:</strong> Frame advantage when move hits (positive = combo into next move).</li>
</ul>
<p>Learn your character's launchable moves (-10 or worse on block) — these get punished if blocked. Avoid them in unsafe situations. Use moves at +0 or better for frame trap pressure.</p>` },
      { heading: 'Matchup-specific punishes', html: `<p>Each opponent character has 5-10 moves that are launch-punishable. Learn the punishes:</p>
<ul>
  <li><strong>vs Kazuya:</strong> Blocked Hellsweep (df+4) = launch with df+2.</li>
  <li><strong>vs Hwoarang:</strong> Blocked RFS kick string = launch.</li>
  <li><strong>vs King:</strong> Whiffed throw (1+3 / 2+4) = launch with df+2.</li>
  <li><strong>vs Paul:</strong> Blocked Deathfist (qcf+2) = launch with character-specific.</li>
  <li><strong>vs Bryan:</strong> Blocked Snake Edge = launch.</li>
</ul>
<p>Practice these punishes in training mode for 50 reps per matchup. Tekken King is matchup knowledge first, execution second.</p>` },
      { heading: 'Oki mix-up game — the post-knockdown play', html: `<p>Oki = post-knockdown setup. After your opponent gets up, you mix-up their options:</p>
<ul>
  <li><strong>Stand block:</strong> Standard get-up. Blocks mid; can be low-hit.</li>
  <li><strong>Get-up kick (3+4):</strong> Counter-attack on rise. Blockable but pressures.</li>
  <li><strong>Tech-roll:</strong> Roll back; escapes oki but gives ground.</li>
  <li><strong>Stay down:</strong> Wait; vulnerable to ground hit.</li>
</ul>
<p>Mix-up: high attack vs stand block. Low attack vs late get-up. Grab vs tech-roll. Force opponent to guess. Tekken King players have 3-4 oki setups per character.</p>` },
      { heading: 'Heat management — Tekken 8 round-deciding', html: `<p>Heat is your win condition. Save Heat for round-deciding moments:</p>
<ul>
  <li><strong>Heat Engager hit:</strong> Extend combo for 30%+ damage.</li>
  <li><strong>Defensive Heat Burst:</strong> Escape pressure when cornered.</li>
  <li><strong>Heat Smash (R1+R2):</strong> Devastating finish — save for kill.</li>
  <li><strong>Don't burn Heat:</strong> at round-start; on early opener.</li>
</ul>
<p>Tekken King players track opponent's Heat gauge too. If opponent has Heat available + low HP, they'll Heat Smash you. Defensively, sidestep or break the mix-up.</p>` },
      { heading: 'Mental discipline — the Tekken King mindset', html: `<p>Tekken King requires tournament-tier mental:</p>
<ul>
  <li>Pause after every loss; analyze before queuing.</li>
  <li>Track losses per session; stop after 3 consecutive losses.</li>
  <li>Practice mode warm-up 15 min before ranked.</li>
  <li>Watch pro VOD (Knee, Arslan Ash, JDCR) for matchup study.</li>
  <li>Don't blame "lag" or "delay-based netcode" — focus on improvement.</li>
</ul>` },
      { heading: 'The 6 habits separating 1st Dan from Tekken King', html: `<ul>
  <li>Frame data knowledge for top 20 character moves.</li>
  <li>Matchup-specific punishes (5+ characters memorized).</li>
  <li>Oki mix-up game (3-4 setups per character).</li>
  <li>Heat management — save for round-deciding moments.</li>
  <li>Tilt protocols — stop after 3 losses.</li>
  <li>Pro VOD watching — 1 match per day, paused for analysis.</li>
</ul>` },
    ],
    mistakes: [
      'No frame data knowledge (random move selection)',
      'No matchup-specific punishes',
      'Skipping oki mix-up (free escape for opponent)',
      'Burning Heat on opener',
      'Playing through 5+ losses despite tilt',
    ],
    drill: {
      heading: 'Drill: 30-day Tekken King regimen',
      html: `<ul>
  <li><strong>Week 1:</strong> Frame data study for your character\'s top 20 moves.</li>
  <li><strong>Week 2:</strong> Matchup-specific punish drilling vs 5 opponent characters.</li>
  <li><strong>Week 3:</strong> Oki mix-up setups — 3-4 per character.</li>
  <li><strong>Week 4:</strong> Heat management practice + ranked matches with all skills applied.</li>
</ul>
<p>By day 30 you've trained Tekken King habits. Most 1st Dan players plateau because they don\'t drill consistently.</p>`,
    },
    aiVodMention: `<p>Tekken King gap won\'t close? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags frame-trap exposure + Heat management errors. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'Tekken 8 Beginner Guide 2026', url: '/blog/tekken-8-beginner-guide-2026.html' },
      { name: 'Tekken 8 Character Tier List 2026', url: '/blog/tekken-8-tier-list-2026.html' },
      { name: 'Tekken 8 BnB Combos Per Character', url: '/blog/tekken-8-bnb-combos-guide.html' },
      { name: 'Tekken 8 Matchup Chart 2026', url: '/blog/tekken-8-matchup-chart-2026.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 10,
  },
  {
    game: 'tk8', gameLabel: 'Tekken 8', fromRank: 'Matchup', toRank: 'Chart',
    slug: 'tekken-8-matchup-chart-2026',
    metaTitle: 'Tekken 8 Matchup Chart 2026 — Hard / Even / Favorable Matchups',
    metaDescription: 'Tekken 8 matchup chart 2026 across S-tier and A-tier characters. Hwoarang vs Kazuya, King vs Lili, Bryan vs Jin, and the top 30 matchups every Tekken player needs.',
    intro: `<p>Tekken 8 matchups are the macro-game. Two equally skilled players have different win rates based purely on character matchup. This guide covers the 30 most impactful matchups in the 2026 meta — favorable, even, and hard matchups for the top 10 characters.</p>`,
    sections: [
      { heading: 'Why matchups matter in Tekken 8', html: `<p>Tekken 8 character vs character matchups can be 60-40 to 70-30 in skill-equal matches. Matchup knowledge can swing 1-2 ranks of effective skill. Tournament players track matchups to choose secondaries; ranked players track matchups to identify which characters to grind against.</p>` },
      { heading: 'Hwoarang matchups', html: `<ul>
  <li><strong>Hwoarang vs King:</strong> 70-30 Hwoarang. Stance pressure beats grappler entry. King can\'t land grab mid-pressure.</li>
  <li><strong>Hwoarang vs Steve:</strong> 50-50. Counter-hit game vs stance pressure — coinflip matchup.</li>
  <li><strong>Hwoarang vs Lili:</strong> 40-60 Lili. Spacing kite beats stance commits. Hard matchup for Hwoarang.</li>
  <li><strong>Hwoarang vs Kazuya:</strong> 55-45 Hwoarang. Stance pressure beats Mishima electric commits at close range.</li>
</ul>` },
      { heading: 'Kazuya matchups', html: `<ul>
  <li><strong>Kazuya vs Lars:</strong> 60-40 Kazuya. Mishima electric beats Dynamic Entry stance.</li>
  <li><strong>Kazuya vs Yoshimitsu:</strong> 40-60 Yoshimitsu. Manji stance parries beat Electric attempts.</li>
  <li><strong>Kazuya vs Paul:</strong> 55-45 Kazuya. Hellsweep mix-up beats Paul counter-hit setups.</li>
  <li><strong>Kazuya vs Jin:</strong> 50-50. Mirror matchup; pure execution game.</li>
</ul>` },
      { heading: 'King matchups', html: `<ul>
  <li><strong>King vs Asuka:</strong> 60-40 King. Grab mix-up overloads Asuka\'s reactive defense.</li>
  <li><strong>King vs Yoshimitsu:</strong> 45-55 Yoshi. Manji stance grab break + parry beats King chain throws.</li>
  <li><strong>King vs Lili:</strong> 50-50. King grabs vs Lili spacing — coinflip.</li>
</ul>` },
      { heading: 'Bryan matchups', html: `<ul>
  <li><strong>Bryan vs Jin:</strong> 60-40 Bryan. Counter-hit game beats Jin neutral; Taunt setup destroys Jin oki.</li>
  <li><strong>Bryan vs Paul:</strong> 55-45 Bryan. Counter-hit vs Deathfist commits.</li>
  <li><strong>Bryan vs Asuka:</strong> 40-60 Asuka. Parry kicks beat Bryan\'s mid-range commits; reversal launcher beats Snake Edge.</li>
</ul>` },
      { heading: 'Steve matchups', html: `<ul>
  <li><strong>Steve vs Hwoarang:</strong> 55-45 Steve. Counter-hit beats stance commits.</li>
  <li><strong>Steve vs Jun:</strong> 40-60 Jun. Jun parry blocks Steve counter-hit attempts; spacing footsies win.</li>
  <li><strong>Steve vs Bryan:</strong> 50-50. Both counter-hit kings; pure execution.</li>
</ul>` },
      { heading: 'Reina matchups', html: `<ul>
  <li><strong>Reina vs Paul:</strong> 60-40 Reina. Wind God Step Lite beats Paul linear committed moves.</li>
  <li><strong>Reina vs Asuka:</strong> 50-50. Mishima mix-up vs parry/reversal game.</li>
  <li><strong>Reina vs Lars:</strong> 55-45 Reina. WGS Lite beats Dynamic Entry stance.</li>
</ul>` },
      { heading: 'Lili matchups', html: `<ul>
  <li><strong>Lili vs Paul:</strong> 60-40 Lili. Lili sidesteps Deathfist, whiff-punishes 50%+ damage.</li>
  <li><strong>Lili vs Hwoarang:</strong> 60-40 Lili. Spacing kite beats stance commits.</li>
  <li><strong>Lili vs King:</strong> 50-50. Spacing vs grab — coinflip.</li>
</ul>` },
      { heading: 'How to use this matchup chart in ranked', html: `<p>Apply this knowledge in three ways:</p>
<ul>
  <li><strong>Pick character to climb:</strong> Identify your secondary that wins your hard matchups.</li>
  <li><strong>Identify hard matchups:</strong> Avoid playing your main into 40-60 disadvantage matchups; pick secondary.</li>
  <li><strong>Study secondary opponent matchups:</strong> Play against AI / friends with hard-matchup characters before ranked.</li>
</ul>
<p>Tekken King players have a 90% character vs character knowledge map. 1st Dan players ignore matchups entirely.</p>` },
    ],
    mistakes: [
      'Ignoring matchup chart when picking character',
      'Playing main into 40-60 disadvantage matchup',
      'No secondary character for hard matchups',
      'Not studying opponent character\'s top 5 moves',
      'Blaming losses on "lag" instead of matchup',
    ],
    drill: {
      heading: 'Drill: Matchup-specific training',
      html: `<p>Pick one hard matchup (e.g., Hwoarang vs Lili). Play 30 matches against AI/friends with hard-matchup character. Track win rate. By 30 matches you\'ve mapped the punishes + understood timing. Apply in ranked. Repeat for top 5 matchups.</p>`,
    },
    aiVodMention: `<p>Matchup knowledge right but losing? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags character-specific punish opportunities you missed. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'Tekken 8 Beginner Guide 2026', url: '/blog/tekken-8-beginner-guide-2026.html' },
      { name: 'Tekken 8 Character Tier List 2026', url: '/blog/tekken-8-tier-list-2026.html' },
      { name: 'Tekken 8 BnB Combos Per Character', url: '/blog/tekken-8-bnb-combos-guide.html' },
      { name: 'How to Climb from 1st Dan to Tekken King', url: '/blog/tekken-8-1st-dan-to-king.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
]

// ============================================================================
// PUBG POSTS (5)
// ============================================================================
// BR coaching cluster — Erangel + Miramar are the meta maps.
const PUBG_POSTS = [
  {
    game: 'pubg', gameLabel: 'PUBG: Battlegrounds', fromRank: 'Bronze', toRank: 'Silver',
    slug: 'pubg-beginner-guide-2026',
    metaTitle: 'PUBG Beginner Guide 2026 — Climb From Bronze to Silver',
    metaDescription: 'PUBG beginner guide: drop strategy, loot priority, squad roles, basic gunplay, circle awareness. Get out of Bronze in 2 weeks.',
    intro: `<p>PUBG: Battlegrounds is the original Battle Royale. 100 players, 4-stack squads, shrinking circle, last squad standing. The Bronze-to-Silver climb requires fixing four things: drop strategy, loot priority, squad role assignment, and basic gunplay. Drill these for 2 weeks and Silver is automatic.</p>`,
    sections: [
      { heading: 'Drop strategy — hot vs edge', html: `<p>Drop choice = game outcome. Two strategies:</p>
<ul>
  <li><strong>Hot drop:</strong> Pochinki / Bootcamp / Pecado. 3-5 squads, fast action. 60% wipe rate, high adrenaline.</li>
  <li><strong>Edge drop:</strong> Primorsk / Crater Fields / Goroka. 0-1 squad, safer loot. 90% survival to mid-game.</li>
</ul>
<p>For Bronze climbing: alternate hot drops 50% / edge drops 50%. Hot drops teach gunplay; edge drops teach rotation. Both skills required.</p>` },
      { heading: 'Loot priority — 60 seconds to gear up', html: `<p>You need full kit within 60 seconds of landing. Priority order:</p>
<ul>
  <li>Armor (helmet level 2 + vest level 2 minimum).</li>
  <li>Primary weapon (AR — M416 / AKM / Beryl).</li>
  <li>Secondary weapon (Sniper Kar98k or SMG UMP45).</li>
  <li>Heals (8 bandages + 4 first-aid + 2 medkits).</li>
  <li>Boost items (2 painkillers + 2 energy drinks).</li>
  <li>Grenades (2 frags + 2 smokes minimum).</li>
</ul>
<p>Don't loot all bodies. Grab essentials, rotate. Looting time = death.</p>` },
      { heading: 'Squad roles — assign before queue', html: `<p>4-stack squads need 4 roles:</p>
<ul>
  <li><strong>IGL / Caller:</strong> Drop spot, rotation calls, engagement decisions.</li>
  <li><strong>Fragger:</strong> First push, close-range duels, top-K player.</li>
  <li><strong>Sniper:</strong> Long-range pick-off, cover during rotation.</li>
  <li><strong>Support:</strong> Heals, smokes, revives, mid-range backup.</li>
</ul>
<p>Discuss roles before queue. Random squads = 4 solo players; coordinated squads have 50% higher win rate.</p>` },
      { heading: 'Basic gunplay — single-fire mid-range, burst close', html: `<p>PUBG bullets have travel time and drop. At Bronze, learn:</p>
<ul>
  <li><strong>Single-fire</strong> mid-range (100-200m) with AR. Reduces recoil.</li>
  <li><strong>Burst-fire</strong> close-range (under 100m) with AR. 3-5 round bursts.</li>
  <li><strong>Sniper</strong> long-range (200m+) with Kar98k. Aim for head; helmet 2 = 1-shot.</li>
  <li><strong>ADS</strong> (right-click) for accuracy.</li>
  <li><strong>Hipfire</strong> only at point-blank with SMG.</li>
</ul>
<p>Recoil control: pull mouse down slightly during full-auto. Practice in Training Mode for 30 minutes before ranked.</p>` },
      { heading: 'Circle awareness — rotate before damage', html: `<p>Most Bronze deaths are circle damage, not gunfire. Circle phases:</p>
<ul>
  <li>White circle = next safe zone (visible at start).</li>
  <li>Yellow countdown = circle moves in 1 minute.</li>
  <li>Blue circle = current safe zone (damage if outside).</li>
  <li>Damage scales with phase: phase 1 = 1 HP/tick, phase 6 = 25 HP/tick.</li>
</ul>
<p>Rule: always rotate 30 seconds before circle close. Pre-position on cover before circle damage starts.</p>` },
      { heading: 'The 8 habits that get you to Silver', html: `<ul>
  <li>Alternate hot drops (gunplay) and edge drops (rotation).</li>
  <li>Loot full kit in 60 seconds.</li>
  <li>Assign squad roles pre-queue.</li>
  <li>Single-fire mid-range, burst close, snipe long.</li>
  <li>Pre-position 30 seconds before circle close.</li>
  <li>Boost items stacked (painkillers + energy drink).</li>
  <li>Vehicle rotation for long open ground.</li>
  <li>Watch kill feed for 3rd-party timing.</li>
</ul>` },
    ],
    mistakes: [
      'Random drops without strategy',
      'Looting all bodies instead of essentials',
      'No squad role assignment',
      'Spraying full-auto at long range',
      'Rotating last-second into circle damage',
    ],
    drill: {
      heading: 'Drill: 14-day fundamentals regimen',
      html: `<ul>
  <li><strong>Day 1-3:</strong> Training Mode for gunplay. Single-fire / burst / spray practice.</li>
  <li><strong>Day 4-7:</strong> 5 ranked games hot-dropping Pochinki / Bootcamp. Practice loot speed.</li>
  <li><strong>Day 8-10:</strong> 5 ranked games edge-dropping. Practice rotation timing.</li>
  <li><strong>Day 11-14:</strong> Squad coordination ranked games with role assignment.</li>
</ul>`,
    },
    aiVodMention: `<p>Stuck despite drilling? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags drop / loot / rotation mistakes. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'PUBG Best Drop Spots Per Map', url: '/blog/pubg-best-drops-2026.html' },
      { name: 'PUBG Weapon Tier List 2026', url: '/blog/pubg-weapon-tier-list-2026.html' },
      { name: 'How to Climb from Silver to Gold in PUBG', url: '/blog/pubg-silver-to-gold.html' },
      { name: 'PUBG Endgame Strategy — Final Circle Tactics', url: '/blog/pubg-endgame-strategy.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
  {
    game: 'pubg', gameLabel: 'PUBG: Battlegrounds', fromRank: 'Drops', toRank: 'Strategy',
    slug: 'pubg-best-drops-2026',
    metaTitle: 'PUBG Best Drop Spots Per Map 2026 — Hot, Mid, Edge Drops',
    metaDescription: 'PUBG drop guide 2026 across Erangel, Miramar, Sanhok, Vikendi, Taego, Deston. Hot drops for action, mid drops for tier-3, edge drops for safety.',
    intro: `<p>Drop choice is the most important pre-game decision in PUBG. This guide covers hot drops, mid drops, and edge drops across all 6 ranked maps in 2026. Pick drops based on your squad's strategy + skill level.</p>`,
    sections: [
      { heading: 'Erangel drops — Pochinki vs Military vs Primorsk', html: `<ul>
  <li><strong>Hot drops:</strong> Pochinki (center, 3-5 squads), School (5-7 squads tier-2), Georgopol (north-west tier-2).</li>
  <li><strong>Mid drops:</strong> Mylta (east town, 1-2 squads), Rozhok (center town, 1-2 squads).</li>
  <li><strong>Edge drops:</strong> Primorsk (south coast, 0-1 squad), Lipovka (east, 0-1 squad).</li>
  <li><strong>Tier-3 loot:</strong> Military Base (south), School roof, Georgopol Crates.</li>
</ul>` },
      { heading: 'Miramar drops — Pecado vs Hacienda vs Crater', html: `<ul>
  <li><strong>Hot drops:</strong> Pecado (center, 3-5 squads), Hacienda del Patrón (tier-3 castle), Los Leones (largest city).</li>
  <li><strong>Mid drops:</strong> San Martín (1-2 squads), El Pozo (1-2 squads).</li>
  <li><strong>Edge drops:</strong> Crater Fields (north), Tuna Park (south).</li>
  <li><strong>Vehicle rotation:</strong> Mandatory — Miramar is the largest map.</li>
</ul>` },
      { heading: 'Sanhok drops — Bootcamp vs Paradise vs Ruins', html: `<ul>
  <li><strong>Hot drops:</strong> Bootcamp (center, 5-7 squads), Paradise Resort (5-7 squads), Ruins (cave).</li>
  <li><strong>Mid drops:</strong> Ha Tinh (north-east, 1-2 squads), Camp Charlie (west, 1-2 squads).</li>
  <li><strong>Edge drops:</strong> Lakawi (south, 0-1 squad).</li>
  <li><strong>Note:</strong> Small map = fast circles; edge drops can be risky.</li>
</ul>` },
      { heading: 'Vikendi drops — Castle vs Cosmodrome vs Goroka', html: `<ul>
  <li><strong>Hot drops:</strong> Castle (center vertical), Cosmodrome (tier-3), Villa.</li>
  <li><strong>Mid drops:</strong> Mount Kreznic (1-2 squads).</li>
  <li><strong>Edge drops:</strong> Goroka (south, 0-1 squad), Tovar (north-west, 0-1 squad).</li>
  <li><strong>Snow tracks:</strong> Visible to enemies — stick to roads if possible.</li>
</ul>` },
      { heading: 'Taego drops — Shipyard vs Hosan vs Pyungwon', html: `<ul>
  <li><strong>Hot drops:</strong> Shipyard (tier-3, 3-5 squads), Hosan Town (3-5 squads).</li>
  <li><strong>Mid drops:</strong> Go-Sang Village (1-2 squads).</li>
  <li><strong>Edge drops:</strong> Pyungwon (south, 0-1 squad).</li>
  <li><strong>Comeback BR:</strong> Use to revive teammates in extended ranked.</li>
</ul>` },
      { heading: 'Deston drops — Amusement Park vs Rig vs Ascent', html: `<ul>
  <li><strong>Hot drops:</strong> Amusement Park (center, 3-5 squads), Off-Shore Rig (tier-3 vertical), Ripton.</li>
  <li><strong>Mid drops:</strong> Tomb (1-2 squads).</li>
  <li><strong>Edge drops:</strong> Ascent (south-west, 0-1 squad).</li>
  <li><strong>Off-Shore Rig:</strong> Unique vertical POI — boats / parachutes only.</li>
</ul>` },
      { heading: 'Drop strategy by squad skill level', html: `<ul>
  <li><strong>Bronze / Silver:</strong> 70% edge drops, 30% hot drops. Survival + loot focus.</li>
  <li><strong>Gold / Platinum:</strong> 50% hot drops, 50% edge. Balance combat + survival.</li>
  <li><strong>Diamond+:</strong> 70% hot drops for K/D + scrim practice.</li>
</ul>` },
    ],
    mistakes: [
      'Random drops without team comm',
      'All-edge drops at Diamond+ (no combat practice)',
      'All-hot drops at Bronze (low survival)',
      'Drop near another squad without backup',
      'Drop spots based on personal preference, not map meta',
    ],
    drill: {
      heading: 'Drill: Drop spot mastery per map',
      html: `<p>Pick 1 hot drop per map. Play 10 games landing there. Track squad wipe rate + loot speed. Then pick 1 edge drop per map. Compare. By 60 games you've mapped drop preferences for all 6 maps.</p>`,
    },
    aiVodMention: `<p>Drop choice right but losing? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags loot priority + rotation mistakes per game. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'PUBG Beginner Guide 2026', url: '/blog/pubg-beginner-guide-2026.html' },
      { name: 'PUBG Weapon Tier List 2026', url: '/blog/pubg-weapon-tier-list-2026.html' },
      { name: 'How to Climb from Silver to Gold in PUBG', url: '/blog/pubg-silver-to-gold.html' },
      { name: 'PUBG Endgame Strategy', url: '/blog/pubg-endgame-strategy.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
  {
    game: 'pubg', gameLabel: 'PUBG: Battlegrounds', fromRank: 'Weapons', toRank: 'Tier List',
    slug: 'pubg-weapon-tier-list-2026',
    metaTitle: 'PUBG Weapon Tier List 2026 — Best AR, Sniper, SMG Picks',
    metaDescription: 'PUBG weapon tier list 2026: S-tier Beryl + M416 + Kar98k + AWM. A-tier AKM + SLR + UMP45. Loadout combos for ranked.',
    intro: `<p>Weapon meta in PUBG is stable across patches. S-tier ARs are Beryl M762, M416, AKM. S-tier snipers are AWM, Kar98k. SMG meta is UMP45 + Vector. This guide ranks all weapons + builds loadout combos for ranked play.</p>`,
    sections: [
      { heading: 'AR tier list — S, A, B', html: `<h3>S-tier</h3>
<ul>
  <li><strong>Beryl M762</strong> — Highest-damage AR (5.56). Heavy recoil but 2-shot kills.</li>
  <li><strong>M416</strong> — Versatile, low recoil, mid-range king. Universal pick.</li>
  <li><strong>AKM</strong> — High damage, hard recoil. Close-mid range.</li>
</ul>
<h3>A-tier</h3>
<ul>
  <li><strong>Groza</strong> — Care Package, best AR in the game. Drop only.</li>
  <li><strong>SCAR-L</strong> — Low-recoil beginner pick.</li>
  <li><strong>Famas</strong> — Semi-auto burst (3-round).</li>
</ul>
<h3>B-tier</h3>
<ul>
  <li><strong>QBZ</strong> — Sanhok variant. Mid-tier.</li>
  <li><strong>G36C</strong> — Vikendi variant. Mid-tier.</li>
</ul>` },
      { heading: 'Sniper tier list — S, A, B', html: `<h3>S-tier</h3>
<ul>
  <li><strong>AWM</strong> — Care Package, 1-shot any helmet. Drop only.</li>
  <li><strong>Kar98k</strong> — Helmet 2 1-shot. Most common bolt-action.</li>
  <li><strong>Mosin</strong> — Kar98 alternative; bolt-action, same damage.</li>
</ul>
<h3>A-tier</h3>
<ul>
  <li><strong>SLR</strong> — Semi-auto marksman. Fast follow-up shots.</li>
  <li><strong>Mk14</strong> — Care Package DMR. Semi/full-auto, highest DMR damage.</li>
</ul>
<h3>B-tier</h3>
<ul>
  <li><strong>VSS</strong> — Suppressed marksman. Mid-tier damage.</li>
  <li><strong>M21</strong> — Marksman; falls off at long range.</li>
</ul>` },
      { heading: 'SMG / Shotgun tier list — S, A, B', html: `<h3>S-tier</h3>
<ul>
  <li><strong>UMP45</strong> — Versatile mid-range SMG. Low recoil.</li>
  <li><strong>S686</strong> — Instant breach kill (double barrel).</li>
  <li><strong>P90</strong> — 50-round mag, high DPS close-range.</li>
</ul>
<h3>A-tier</h3>
<ul>
  <li><strong>Uzi</strong> — Fastest fire-rate, point-blank duel.</li>
  <li><strong>MP5K</strong> — Vikendi variant. Mid-tier.</li>
</ul>
<h3>B-tier</h3>
<ul>
  <li><strong>Vector</strong> — Low ammo mag (13 rounds), high DPS but bad reload.</li>
  <li><strong>Tommy Gun</strong> — Low range, niche pick.</li>
</ul>` },
      { heading: 'Loadout combos for ranked', html: `<ul>
  <li><strong>Aggressive Fragger:</strong> Beryl M762 + UMP45. Close-mid range duels.</li>
  <li><strong>Versatile All-Rounder:</strong> M416 + Kar98k. Mid + long range coverage.</li>
  <li><strong>Sniper Specialist:</strong> Kar98k + SCAR-L. Long-range pick-off + mid backup.</li>
  <li><strong>Brawler:</strong> AKM + S686. Close-range domination.</li>
  <li><strong>Endgame Tournament:</strong> M416 + SLR. Long-range marksman duo.</li>
</ul>` },
      { heading: 'Care Package weapon priority', html: `<p>Care Packages drop tier-3+ loot. Priority order:</p>
<ul>
  <li><strong>AWM</strong> — 1-shot kill any helmet level. Top priority.</li>
  <li><strong>Groza</strong> — Best AR. Mid priority.</li>
  <li><strong>Mk14</strong> — Best DMR. Mid priority.</li>
  <li><strong>Tier-3 Armor</strong> — Helmet level 3 + Vest level 3. Survival priority.</li>
</ul>
<p>Don't fight at Care Package — wait for 1-2 squads to engage, then 3rd-party. The drop attracts squads for 1-2 minutes.</p>` },
    ],
    mistakes: [
      'Using AR for long-range (200m+) — switch to Sniper or DMR',
      'Sniping with SMG-tier weapon at close range',
      'No SMG/Shotgun backup for close engagements',
      'Care Package fight without 3rd-party plan',
      'No attachments — bare weapons = 50% damage loss',
    ],
    drill: {
      heading: 'Drill: Recoil training per weapon',
      html: `<p>Training Mode practice: 100 bullets fired per weapon, recoil pattern memorized. M416 / AKM / Beryl recoil patterns are different — drill each separately. Goal: full 30-round mag headshot at 50m range.</p>`,
    },
    aiVodMention: `<p>Loadout right but losing? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags engagement-range mistakes. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'PUBG Beginner Guide 2026', url: '/blog/pubg-beginner-guide-2026.html' },
      { name: 'PUBG Best Drop Spots Per Map', url: '/blog/pubg-best-drops-2026.html' },
      { name: 'How to Climb from Silver to Gold in PUBG', url: '/blog/pubg-silver-to-gold.html' },
      { name: 'PUBG Endgame Strategy', url: '/blog/pubg-endgame-strategy.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
  {
    game: 'pubg', gameLabel: 'PUBG: Battlegrounds', fromRank: 'Silver', toRank: 'Gold',
    slug: 'pubg-silver-to-gold',
    metaTitle: 'How to Climb from Silver to Gold in PUBG (2026)',
    metaDescription: 'PUBG Silver-to-Gold guide: rotation reads, 3rd-party timing, compound holds, gunplay accuracy, squad coordination calls.',
    intro: `<p>Silver-to-Gold in PUBG is the first real macro skill jump. Beginner habits aren't enough. Gold players read rotations, identify 3rd parties, hold compounds correctly, and use squad coordination calls. This guide breaks down what separates Silver from Gold.</p>`,
    sections: [
      { heading: 'Rotation reads — track circle vs other squads', html: `<p>Gold players track 2-3 squads at all times. Methods:</p>
<ul>
  <li>Kill feed shows where squads are dying (rough position).</li>
  <li>Vehicle audio = nearby rotation (gunshot in distance = engagement happening).</li>
  <li>Pre-position 60 seconds before circle close.</li>
  <li>Identify "highway" routes between circle phases.</li>
</ul>` },
      { heading: '3rd-party timing — wait for 2 squads to engage', html: `<p>Gold players let other squads fight first, then 3rd-party the survivor.</p>
<ul>
  <li>Listen for sustained gunfire (1+ minute of fight = both squads weakened).</li>
  <li>Approach from elevated angle.</li>
  <li>Push the winning squad after they've used heals.</li>
  <li>Loot both squads' bodies after wipe.</li>
</ul>
<p>3rd-party kill ratio at Gold = 70%+. At Silver = 30%.</p>` },
      { heading: 'Compound holds — pre-position cover', html: `<p>When you take a building/compound, hold properly:</p>
<ul>
  <li>Pre-position windows for incoming sight lines.</li>
  <li>Frag denial on stair entries.</li>
  <li>Smoke cover for revives + rotations.</li>
  <li>Sniper covers exit route from elevated angle.</li>
</ul>` },
      { heading: 'Gunplay accuracy — burst-fire mid-range mastery', html: `<p>Gold players land 80%+ accuracy at mid-range. Drills:</p>
<ul>
  <li>Training Mode burst-fire practice (3-5 round bursts at 100m).</li>
  <li>Single-fire at 150m+ for recoil control.</li>
  <li>Sniper head-aim — helmet level 2 = 1-shot kill.</li>
  <li>SMG hipfire at point-blank.</li>
</ul>` },
      { heading: 'Squad coordination calls — comm discipline', html: `<p>Gold squads have 4-5 specific call types:</p>
<ul>
  <li>"Going east, kar98 100m" — direction + weapon + range.</li>
  <li>"Rotation now, follow me" — squad rotate command.</li>
  <li>"Push left house, I cover stairs" — engagement coordination.</li>
  <li>"Wipe complete, looting 30 seconds" — phase update.</li>
  <li>"Hold this position, circle in 90 seconds" — pre-position.</li>
</ul>
<p>No commentary, no chat. Information only. Silver squads have 1-2 calls per game; Gold has 30+.</p>` },
      { heading: 'The 6 habits separating Silver from Gold', html: `<ul>
  <li>Rotation reads at every circle close (60-second early pre-position).</li>
  <li>3rd-party timing on sustained engagements.</li>
  <li>Compound holds with frag/smoke discipline.</li>
  <li>80%+ accuracy mid-range burst-fire.</li>
  <li>30+ squad calls per match.</li>
  <li>Endgame elevation positioning (high ground wins 70% of finals).</li>
</ul>` },
    ],
    mistakes: [
      'Engaging without 3rd-party setup',
      'Holding compound with no pre-positioning',
      'Spraying full-auto mid-range',
      'No squad calls (4 solo players in voice)',
      'Endgame in open field (low ground)',
    ],
    drill: {
      heading: 'Drill: 30-day Gold regimen',
      html: `<ul>
  <li><strong>Week 1:</strong> Training Mode accuracy — 80%+ at 100m.</li>
  <li><strong>Week 2:</strong> Compound hold practice in custom games.</li>
  <li><strong>Week 3:</strong> 3rd-party timing in ranked — wait for sustained fights.</li>
  <li><strong>Week 4:</strong> Squad coordination calls regimen — track call count per match.</li>
</ul>`,
    },
    aiVodMention: `<p>Gold gap won't close? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags rotation + 3rd-party timing errors. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'PUBG Beginner Guide 2026', url: '/blog/pubg-beginner-guide-2026.html' },
      { name: 'PUBG Best Drop Spots Per Map', url: '/blog/pubg-best-drops-2026.html' },
      { name: 'PUBG Weapon Tier List 2026', url: '/blog/pubg-weapon-tier-list-2026.html' },
      { name: 'PUBG Endgame Strategy', url: '/blog/pubg-endgame-strategy.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
  {
    game: 'pubg', gameLabel: 'PUBG: Battlegrounds', fromRank: 'Endgame', toRank: 'Chicken Dinner',
    slug: 'pubg-endgame-strategy',
    metaTitle: 'PUBG Endgame Strategy Guide — Final Circle Tactics for the Win',
    metaDescription: 'PUBG endgame strategy: positioning for final circles, 3v1/4v1 finishes, smoke + grenade chains, high-ground holds, 1v4 clutch tactics.',
    intro: `<p>Endgame in PUBG is everything. Top-10 placements are easy; final 5 squads is where the real game is. This guide breaks down endgame positioning, smoke/grenade chains, high-ground holds, and the 1v4 clutch tactics that win the Chicken Dinner.</p>`,
    sections: [
      { heading: 'Final 5 squads — pre-position 90 seconds early', html: `<p>When 5 squads remain (about 22-24 minutes in), positioning matters more than firepower:</p>
<ul>
  <li>Watch the white circle 90 seconds before close.</li>
  <li>Identify high ground in the circle.</li>
  <li>Rotate to the most defensible cover BEFORE circle close.</li>
  <li>Pre-position frag grenades on common rotation paths.</li>
  <li>Smoke cover for revives and rotation under fire.</li>
</ul>` },
      { heading: 'High-ground holds — 70% of finals won here', html: `<p>Elevation = win condition. Final circles 4-6 reward high-ground holds.</p>
<ul>
  <li>Hill / building / rock = vertical advantage.</li>
  <li>Prone on hilltop for stealth.</li>
  <li>Squad-split: 2 on hill, 2 covering retreat (or 4 stacked).</li>
  <li>Watch for 1-2 squads pushing hill simultaneously.</li>
</ul>` },
      { heading: 'Smoke + grenade chains — controlled engagements', html: `<p>Smoke cover lets you control engagement timing.</p>
<ul>
  <li>Smoke approach to enemy compound for safe push.</li>
  <li>Frag grenade chain on enemy compound entry.</li>
  <li>Smoke + revive cycle when teammate downed.</li>
  <li>Smoke escape from bad positions (open ground).</li>
</ul>` },
      { heading: 'Final 3 squads — the kill-or-be-killed phase', html: `<p>3 squads, 9 players, 1 winner. Tactics:</p>
<ul>
  <li>Identify enemy positions via gunshot / kill feed.</li>
  <li>3rd-party the engagement: let 2 squads fight, push the survivor.</li>
  <li>Squad-split aggressive: 2 push, 2 cover from elevated angle.</li>
  <li>Heal cycle: full HP + boost gauge before engaging.</li>
</ul>` },
      { heading: '1v4 clutch tactics — win the Chicken Dinner alone', html: `<p>If teammates die and you're 1 vs 4 enemies:</p>
<ul>
  <li>Stealth — prone, no movement, wait for circle to force enemy commit.</li>
  <li>Isolation — split enemy squad with grenade chains.</li>
  <li>High ground — hill / rooftop advantage.</li>
  <li>Heal stack — Painkillers + Energy Drink + Adrenaline for boost gauge.</li>
  <li>Pick off one enemy at a time via long-range Sniper.</li>
  <li>Don't engage all 4 at once — split squad through isolation.</li>
</ul>` },
      { heading: 'Final circle (10x10m) — the death zone', html: `<p>Final circle (phase 7-8) is tiny. Last 2-3 players left:</p>
<ul>
  <li>Prone in cover (rock, bush, building edge).</li>
  <li>Bullet-tracking on enemy direction.</li>
  <li>Wait for enemy commit; counter-shoot.</li>
  <li>Boost items mandatory — circle damage = 25 HP/tick.</li>
  <li>Final 1v1: head-aim with AR + crouch.</li>
</ul>` },
    ],
    mistakes: [
      'Engaging top-10 placements in open field',
      'No high-ground hold in finals',
      'Pushing all 4 enemies simultaneously',
      'No smoke + revive cycle setup',
      'Endgame in low ground / no cover',
    ],
    drill: {
      heading: 'Drill: Custom games endgame practice',
      html: `<p>Custom games with 4-stack squad. Drop in pre-final circle position. Practice 4v4 vs 4v4 in final 2 circles. Track wipe rate. Repeat 30 games. By game 30 you've practiced endgame instincts that win Chicken Dinners.</p>`,
    },
    aiVodMention: `<p>Final circle losses? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags positioning + grenade chain errors. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'PUBG Beginner Guide 2026', url: '/blog/pubg-beginner-guide-2026.html' },
      { name: 'PUBG Best Drop Spots Per Map', url: '/blog/pubg-best-drops-2026.html' },
      { name: 'PUBG Weapon Tier List 2026', url: '/blog/pubg-weapon-tier-list-2026.html' },
      { name: 'How to Climb from Silver to Gold in PUBG', url: '/blog/pubg-silver-to-gold.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
]

// ============================================================================
// DOTA 2 POSTS (5)
// ============================================================================
// MOBA coaching cluster — positions 1-5 system + heavy macro game.
const DOTA2_POSTS = [
  {
    game: 'dota2', gameLabel: 'Dota 2', fromRank: 'Herald', toRank: 'Guardian',
    slug: 'dota-2-beginner-guide-2026',
    metaTitle: 'Dota 2 Beginner Guide 2026 — Climb From Herald to Guardian',
    metaDescription: 'Dota 2 beginner guide: pick a position, learn last-hitting, understand the 5-role system, ward basics, hero pool. Climb out of Herald.',
    intro: `<p>Dota 2 has the steepest learning curve in MOBAs. 124+ heroes, 5 positions (1-5), 100+ items, lane-by-lane macro, Roshan timing, runes. The Herald-to-Guardian climb requires fixing four things: pick a position, learn last-hitting, master the 5-role system, basic warding. Drill these for 2 weeks and Guardian is automatic.</p>`,
    sections: [
      { heading: 'Pick one position — not all 5', html: `<p>Dota 2 has 5 positions: Pos 1 (Carry), Pos 2 (Mid), Pos 3 (Offlaner), Pos 4 (Soft Support), Pos 5 (Hard Support).</p>
<ul>
  <li><strong>Pos 5 (recommended for beginners):</strong> Wards + heals + carry babysit. Lowest gold/XP priority but easiest to learn.</li>
  <li><strong>Pos 4:</strong> Roaming gank support. Mid-game playmaker.</li>
  <li><strong>Pos 3 (Offlaner):</strong> 1v2 lane survival, mid-game initiator.</li>
  <li><strong>Pos 2 (Mid):</strong> Snowball role, 1v1 mid for rune control.</li>
  <li><strong>Pos 1 (Carry):</strong> Late-game scaling, last-hits in safe lane.</li>
</ul>
<p>Pick one and stay for 100+ matches. Don't bounce positions — each has unique mechanics.</p>` },
      { heading: 'Last-hitting — the Herald skill gap', html: `<p>Last-hitting = killing creeps at 1 HP for gold. Each creep = 35-60 gold.</p>
<ul>
  <li>Tap right-click when creep is at 1 HP for last-hit (no auto-attack).</li>
  <li>Deny own creep at 50% HP (right-click on your own creep) — enemy gets less XP.</li>
  <li>Practice in custom games or "Last Hit Trainer" workshop maps.</li>
  <li>Target: 50+ CS by 10 minutes for Pos 1 carry.</li>
</ul>` },
      { heading: 'The 5-role system — gold + XP priority', html: `<p>Each position has gold/XP priority:</p>
<ul>
  <li>Pos 1 = 1st priority. Farms freely; team protects.</li>
  <li>Pos 2 = 2nd priority. Mid lane solo.</li>
  <li>Pos 3 = 3rd priority. Offlaner survives 1v2.</li>
  <li>Pos 4 = 4th priority. Roams + ganks.</li>
  <li>Pos 5 = 5th priority. Wards + heals; lowest gold.</li>
</ul>
<p>Don't steal Carry farm. Don't take Mid runes. Stay in your position lane.</p>` },
      { heading: 'Ward basics — where + when', html: `<p>Vision wins games. Pos 5 / Pos 4 buy wards:</p>
<ul>
  <li><strong>Observer Ward (Pos 5):</strong> Place at high ground / rune spawns / tri-bush.</li>
  <li><strong>Sentry Ward (Pos 5):</strong> Counter-ward enemy invisible heroes (Pudge / Riki / Bounty Hunter).</li>
  <li>Place 1 Observer at lane bush at 0:00, 1 at rune spawn before 2:00.</li>
  <li>Reward Sentry at minute 5+ at enemy jungle entrance.</li>
</ul>` },
      { heading: 'Hero pool — pick 3-5 per position', html: `<p>Don't learn 30 heroes. Pick 3-5 for your position:</p>
<ul>
  <li><strong>Pos 5 picks:</strong> Crystal Maiden, Lion, Lich, Witch Doctor, Treant Protector.</li>
  <li><strong>Pos 4 picks:</strong> Pudge, Mirana, Tusk, Earth Spirit.</li>
  <li><strong>Pos 3 picks:</strong> Axe, Centaur Warrunner, Tidehunter, Bristleback.</li>
  <li><strong>Pos 2 picks:</strong> Invoker, Shadow Fiend, Storm Spirit, Puck.</li>
  <li><strong>Pos 1 picks:</strong> Anti-Mage, Spectre, Faceless Void, Wraith King.</li>
</ul>` },
      { heading: 'Lane phase basics — minute 0-15', html: `<p>Lane phase = 0-15 minutes. Each position has goals:</p>
<ul>
  <li>Pos 1: Last-hit 50+ CS by 10 min. Hit level 6 for ult.</li>
  <li>Pos 2: Win 1v1 mid. Rune control via Bottle.</li>
  <li>Pos 3: Survive 1v2 lane. Don't die.</li>
  <li>Pos 4: Smoke gank at 5:00 with Pos 3.</li>
  <li>Pos 5: Ward + heal + harass enemy offlaner.</li>
</ul>` },
      { heading: 'The 8 habits that get you to Guardian', html: `<ul>
  <li>Pick 1 position; stay 100 matches.</li>
  <li>Master 3-5 heroes per position.</li>
  <li>Last-hit 50+ CS by 10 minutes.</li>
  <li>Buy wards every 4 minutes (Observer + Sentry).</li>
  <li>Smoke gank coordinated with team.</li>
  <li>TP Scroll in inventory after 5:00.</li>
  <li>Track enemy hero positions (minimap awareness).</li>
  <li>Don't dive without backup.</li>
</ul>` },
    ],
    mistakes: [
      'Bouncing positions every game',
      'Auto-attacking creeps instead of last-hitting',
      'No ward placement',
      'Diving without team',
      'Picking 20 different heroes shallow',
    ],
    drill: {
      heading: 'Drill: 14-day fundamentals',
      html: `<ul>
  <li><strong>Day 1-3:</strong> Last-hit Trainer 100 reps per day. Goal: 50 CS in 10 minutes.</li>
  <li><strong>Day 4-7:</strong> Custom games as Pos 5 hero (Crystal Maiden). Ward practice.</li>
  <li><strong>Day 8-10:</strong> 5 ranked games sticking to position role.</li>
  <li><strong>Day 11-14:</strong> Practice smoke gank coordination + lane phase.</li>
</ul>`,
    },
    aiVodMention: `<p>Stuck? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags last-hit + warding + rotation errors. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'Dota 2 Hero Tier List 2026', url: '/blog/dota-2-hero-tier-list-2026.html' },
      { name: 'Dota 2 Position 1-5 Item Builds', url: '/blog/dota-2-item-builds-guide.html' },
      { name: 'How to Climb from Crusader to Archon in Dota 2', url: '/blog/dota-2-crusader-to-archon.html' },
      { name: 'Dota 2 Warding Guide — Vision Wins Games', url: '/blog/dota-2-warding-guide-2026.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 10,
  },
  {
    game: 'dota2', gameLabel: 'Dota 2', fromRank: 'Hero', toRank: 'Tier List',
    slug: 'dota-2-hero-tier-list-2026',
    metaTitle: 'Dota 2 Hero Tier List 2026 — Best Picks Per Position',
    metaDescription: 'Dota 2 hero tier list 2026 by position. S-tier Pos 1 carries, A-tier Pos 2 mids, situational Pos 3/4/5 picks. Solo Q meta breakdown.',
    intro: `<p>Dota 2 has 124+ heroes across 5 positions. This is the 2026 ranked tier list — S/A/B per position, optimized for solo Q ladder climbing.</p>`,
    sections: [
      { heading: 'Pos 1 Carry — S, A, B', html: `<h3>S-tier</h3>
<ul>
  <li><strong>Anti-Mage</strong> — Mana Break + Manta + Blink. Late-game 1v9.</li>
  <li><strong>Faceless Void</strong> — Time Lock crit, Chronosphere AoE.</li>
  <li><strong>Spectre</strong> — Haunt global teleport, Radiance scaling.</li>
</ul>
<h3>A-tier</h3>
<ul>
  <li><strong>Phantom Assassin</strong> — Coup de Grace crit, Phantom Strike blink.</li>
  <li><strong>Wraith King</strong> — Reincarnation 2 lives, Skeleton army ult.</li>
  <li><strong>Juggernaut</strong> — Healing Ward + Blade Fury, Omnislash ult.</li>
  <li><strong>Sven</strong> — Storm Hammer stun + God's Strength.</li>
</ul>` },
      { heading: 'Pos 2 Mid — S, A, B', html: `<h3>S-tier</h3>
<ul>
  <li><strong>Invoker</strong> — 10 invokable spells. Highest skill ceiling.</li>
  <li><strong>Shadow Fiend</strong> — Necromastery + Requiem of Souls.</li>
  <li><strong>Storm Spirit</strong> — Ball Lightning mobility.</li>
</ul>
<h3>A-tier</h3>
<ul>
  <li><strong>Puck</strong> — Phase Shift + Illusory Orb.</li>
  <li><strong>Tinker</strong> — Rearm cooldown reset.</li>
  <li><strong>Queen of Pain</strong> — Blink + Scream of Pain.</li>
  <li><strong>Outworld Destroyer</strong> — Astral Imprisonment.</li>
</ul>` },
      { heading: 'Pos 3 Offlaner — S, A, B', html: `<h3>S-tier</h3>
<ul>
  <li><strong>Axe</strong> — Berserker's Call AoE taunt.</li>
  <li><strong>Centaur Warrunner</strong> — Hoof Stomp + Stampede.</li>
  <li><strong>Tidehunter</strong> — Ravage 5-man stun ult.</li>
</ul>
<h3>A-tier</h3>
<ul>
  <li><strong>Bristleback</strong> — Quill Spray damage stacks.</li>
  <li><strong>Mars</strong> — Spear of Mars + Arena of Blood.</li>
  <li><strong>Dark Seer</strong> — Vacuum + Wall of Replica.</li>
</ul>` },
      { heading: 'Pos 4 Roamer — S, A, B', html: `<h3>S-tier</h3>
<ul>
  <li><strong>Pudge</strong> — Meat Hook gank specialist.</li>
  <li><strong>Mirana</strong> — Sacred Arrow stun, Leap mobility.</li>
  <li><strong>Tusk</strong> — Snowball gap-closer.</li>
</ul>
<h3>A-tier</h3>
<ul>
  <li><strong>Earth Spirit</strong> — Boulder Smash + stones.</li>
  <li><strong>Bounty Hunter</strong> — Track ult gold bounty.</li>
</ul>` },
      { heading: 'Pos 5 Hard Support — S, A, B', html: `<h3>S-tier</h3>
<ul>
  <li><strong>Crystal Maiden</strong> — Crystal Nova + Frostbite + Freezing Field.</li>
  <li><strong>Lion</strong> — Earth Spike chain + Finger of Death execute.</li>
  <li><strong>Treant Protector</strong> — Living Armor team heal + Overgrowth root.</li>
</ul>
<h3>A-tier</h3>
<ul>
  <li><strong>Lich</strong> — Frost Blast + Chain Frost bounce.</li>
  <li><strong>Warlock</strong> — Fatal Bonds + Chaotic Offering golem.</li>
  <li><strong>Witch Doctor</strong> — Maledict + Death Ward.</li>
  <li><strong>Dazzle</strong> — Shallow Grave invuln save.</li>
  <li><strong>Oracle</strong> — False Promise save.</li>
</ul>` },
      { heading: 'How to use this tier list', html: `<p>Pick S-tier in your position. Master 3-5 picks per position. Tier lists shift every patch — check OP.GG / DOTABUFF for current win rates. This is the 2026 baseline.</p>
<p>For climbing: pick S-tier Pos 5 (Crystal Maiden / Lion). Easiest to learn + highest win rate. Once mastered, expand to Pos 4 / Pos 3 / Pos 2 / Pos 1.</p>` },
    ],
    mistakes: [
      'Picking B-tier heroes despite lower win rate',
      'No counter-pick consideration in draft phase',
      'Following pro-play picks (LCS meta ≠ solo Q meta)',
      'Ignoring patch notes — meta shifts every 2 weeks',
      'One-tricking outside S-tier list',
    ],
    drill: {
      heading: 'Drill: Master 5 S-tier picks per month',
      html: `<p>Pick 5 S-tier heroes from this list. Play 20 ranked games on each. Track win rate. By month 4 you've mastered 5 picks across positions and can flex into any role solo Q forces.</p>`,
    },
    aiVodMention: `<p>Hero picks right but losing? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags lane phase + mid-game decision errors. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'Dota 2 Beginner Guide 2026', url: '/blog/dota-2-beginner-guide-2026.html' },
      { name: 'Dota 2 Position 1-5 Item Builds', url: '/blog/dota-2-item-builds-guide.html' },
      { name: 'How to Climb from Crusader to Archon in Dota 2', url: '/blog/dota-2-crusader-to-archon.html' },
      { name: 'Dota 2 Warding Guide', url: '/blog/dota-2-warding-guide-2026.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
  {
    game: 'dota2', gameLabel: 'Dota 2', fromRank: 'Items', toRank: 'Mastery',
    slug: 'dota-2-item-builds-guide',
    metaTitle: 'Dota 2 Item Builds Guide 2026 — Best Items Per Position',
    metaDescription: 'Dota 2 item builds guide 2026: Pos 1 Battle Fury / Manta / Black King Bar paths. Pos 5 ward + sentry + force staff. Itemization for ranked.',
    intro: `<p>Item builds in Dota 2 are position-specific. Pos 1 Carry stacks damage; Pos 5 Hard Support stacks utility. This guide breaks down core item paths per position + situational items for matchup adapt.</p>`,
    sections: [
      { heading: 'Pos 1 Carry item paths', html: `<ul>
  <li><strong>Starting:</strong> Iron Branch x3, Tango, Healing Salve</li>
  <li><strong>Early:</strong> Wraith Band → Power Treads → Battle Fury (or Manta Style)</li>
  <li><strong>Mid:</strong> Manta Style → Skadi → Black King Bar</li>
  <li><strong>Late:</strong> Butterfly → Daedalus → Abyssal Blade</li>
  <li><strong>Situational:</strong> Linken's Sphere vs single-target, Aegis from Roshan</li>
</ul>` },
      { heading: 'Pos 2 Mid item paths', html: `<ul>
  <li><strong>Starting:</strong> Tango, Iron Branch, Mango</li>
  <li><strong>Early:</strong> Bottle → Boots → Hand of Midas</li>
  <li><strong>Mid:</strong> Aether Lens → Aghs Shard → Force Staff</li>
  <li><strong>Late:</strong> Refresher Orb → Octarine Core</li>
  <li><strong>Situational:</strong> Black King Bar vs CC, Eul's Scepter for setup</li>
</ul>` },
      { heading: 'Pos 3 Offlaner item paths', html: `<ul>
  <li><strong>Starting:</strong> Iron Branch, Bracer, Quelling Blade</li>
  <li><strong>Early:</strong> Phase Boots → Vanguard → Blade Mail</li>
  <li><strong>Mid:</strong> Blink Dagger → Black King Bar → Crimson Guard</li>
  <li><strong>Late:</strong> Heart of Tarrasque → Lotus Orb → Aghs Scepter</li>
  <li><strong>Situational:</strong> Pipe of Insight vs AP, Force Staff for save</li>
</ul>` },
      { heading: 'Pos 4 Roamer item paths', html: `<ul>
  <li><strong>Starting:</strong> Iron Branch, Tango, Smoke of Deceit</li>
  <li><strong>Early:</strong> Boots → Magic Wand → Smoke of Deceit (always 1 in inventory)</li>
  <li><strong>Mid:</strong> Aether Lens → Force Staff → Glimmer Cape</li>
  <li><strong>Late:</strong> Octarine Core → Aeon Disk → Aghs Shard</li>
  <li><strong>Situational:</strong> Eul's Scepter for setup, Solar Crest vs strong carry</li>
</ul>` },
      { heading: 'Pos 5 Hard Support item paths', html: `<ul>
  <li><strong>Starting:</strong> Observer Ward, Sentry Ward, Tango</li>
  <li><strong>Early:</strong> Tranquil Boots → Magic Wand → Force Staff</li>
  <li><strong>Mid:</strong> Aether Lens → Glimmer Cape → Aghs Shard</li>
  <li><strong>Late:</strong> Aeon Disk → Refresher Orb → Octarine Core</li>
  <li><strong>Situational:</strong> Mekansm for team heal, Pipe of Insight vs AP, Solar Crest for ally buff</li>
</ul>` },
      { heading: 'Universal items — every hero needs', html: `<ul>
  <li><strong>TP Scroll</strong> — always 1 in inventory after 5:00. Tower defense + objective rotation.</li>
  <li><strong>Magic Stick / Wand</strong> — burst mana from enemy spell stacks.</li>
  <li><strong>Smoke of Deceit</strong> — invisibility for 5-man approach.</li>
  <li><strong>Black King Bar (BKB)</strong> — anti-disable spell immunity. Essential for cores.</li>
  <li><strong>Aghanim's Scepter / Shard</strong> — ult upgrade.</li>
</ul>` },
      { heading: 'Situational items — matchup adapt', html: `<ul>
  <li><strong>vs Heavy AP:</strong> Pipe of Insight, Mekansm</li>
  <li><strong>vs Heavy AD:</strong> Plate Mail, Heart of Tarrasque, Crimson Guard</li>
  <li><strong>vs CC chain:</strong> Black King Bar (BKB)</li>
  <li><strong>vs Invisibility (Riki/BH):</strong> Sentry Ward, Gem of True Sight</li>
  <li><strong>vs Hexers (Lion):</strong> Linken's Sphere</li>
  <li><strong>vs Long-range nukes (Sniper):</strong> Force Staff, Blink Dagger escape</li>
</ul>` },
    ],
    mistakes: [
      'Wrong Mythic for hero archetype',
      'No defensive item by Item 3',
      'Skipping TP Scroll (lose tower)',
      'No BKB on Pos 1 Carry vs CC',
      'Pos 5 buying damage items (waste of gold)',
    ],
    drill: {
      heading: 'Drill: Build path testing',
      html: `<p>Pick 1 hero. Play 10 games with same build path. Then test 1 alternative item. Track win rate. By 30 games you've tested 3 paths and know which is highest win rate for your playstyle.</p>`,
    },
    aiVodMention: `<p>Build right but losing? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags positioning + ability sequence errors per fight. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'Dota 2 Beginner Guide 2026', url: '/blog/dota-2-beginner-guide-2026.html' },
      { name: 'Dota 2 Hero Tier List 2026', url: '/blog/dota-2-hero-tier-list-2026.html' },
      { name: 'How to Climb from Crusader to Archon in Dota 2', url: '/blog/dota-2-crusader-to-archon.html' },
      { name: 'Dota 2 Warding Guide', url: '/blog/dota-2-warding-guide-2026.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
  {
    game: 'dota2', gameLabel: 'Dota 2', fromRank: 'Crusader', toRank: 'Archon',
    slug: 'dota-2-crusader-to-archon',
    metaTitle: 'How to Climb from Crusader to Archon in Dota 2 (2026)',
    metaDescription: 'Dota 2 Crusader-to-Archon — lane phase efficiency, Roshan timing, smoke gank coordination, ward priority, mid-game team fight reads.',
    intro: `<p>Crusader-to-Archon in Dota 2 is the first real macro skill jump. Beginner habits aren't enough. Archon players have lane phase efficiency, Roshan timing reads, smoke gank coordination, and mid-game team-fight commitment. This guide breaks down what separates Crusader from Archon.</p>`,
    sections: [
      { heading: 'Lane phase efficiency — minute 0-15', html: `<p>Crusader = lane survival. Archon = lane dominance. Specifics:</p>
<ul>
  <li>Last-hit 70+ CS by 10 minutes for Pos 1.</li>
  <li>Denies 30+ creep at 10 minutes.</li>
  <li>Pos 5 deward enemy ward at minute 5.</li>
  <li>Pos 4 smoke gank at minute 4-5 lane.</li>
  <li>Pos 3 offlaner doesn't die more than 1 time in lane.</li>
</ul>` },
      { heading: 'Roshan timing — Aegis priority', html: `<p>Roshan spawn at 7:30, then 8-11 minute cycle. Archon teams take Roshan:</p>
<ul>
  <li>First Rosh at 15-20 min with full 5-man team.</li>
  <li>Smoke approach + deward enemy.</li>
  <li>Pos 3 Offlaner tanks Roshan.</li>
  <li>Pos 1 Carry takes Aegis last-hit.</li>
  <li>Push high ground siege after Aegis.</li>
</ul>` },
      { heading: 'Smoke gank coordination', html: `<p>Smoke of Deceit grants invisibility for 5-man approach. Archon teams:</p>
<ul>
  <li>Use Smoke 2-3 times per game.</li>
  <li>Smoke through enemy jungle / forest.</li>
  <li>Coordinate Smoke gank with team voice/ping.</li>
  <li>Always Smoke for Roshan approach.</li>
  <li>Always Smoke for mid-game pickoffs.</li>
</ul>` },
      { heading: 'Ward priority — vision wins games', html: `<p>Archon Pos 5 places 50+ wards per game.</p>
<ul>
  <li>Observer at rune spawn at 0:00 + 2:00 cycle.</li>
  <li>Observer at tri-bush minute 0.</li>
  <li>Sentry at enemy jungle entrance for ganking.</li>
  <li>Sentry at Roshan pit for vision denial.</li>
  <li>Deward enemy wards every minute 5-10.</li>
</ul>` },
      { heading: 'Mid-game team fight reads', html: `<p>Mid-game (15-25 min) = team-fight commit. Archon players:</p>
<ul>
  <li>Identify enemy ult cooldowns (track Pos 1 BKB, Pos 3 Blink, Pos 5 Force).</li>
  <li>5-man team fight setup with initiator ult.</li>
  <li>Don't 4v5 — wait for full team.</li>
  <li>Position 2-3 screens behind tank for back-line peel.</li>
  <li>Buy-back if Aegis-less.</li>
</ul>` },
      { heading: 'The 6 habits separating Crusader from Archon', html: `<ul>
  <li>Lane phase efficiency (70+ CS by 10 min Pos 1).</li>
  <li>Roshan timing tracking (first Rosh at 15-20 min).</li>
  <li>Smoke gank coordination (2-3 per game).</li>
  <li>Ward placement (50+ wards per game Pos 5).</li>
  <li>Mid-game 5-man team fight commitment.</li>
  <li>Track enemy ult cooldowns + Aegis status.</li>
</ul>` },
    ],
    mistakes: [
      'Solo Roshan attempt (no team)',
      'No Smoke gank coordination',
      'Pos 5 not warding enemy jungle',
      'Mid-game 4v5 commit (1 player missing)',
      'Not buy-back after wipe',
    ],
    drill: {
      heading: 'Drill: 30-day Archon regimen',
      html: `<ul>
  <li><strong>Week 1:</strong> Lane phase practice — 70 CS by 10 min Pos 1.</li>
  <li><strong>Week 2:</strong> Smoke gank coordination + Roshan setup.</li>
  <li><strong>Week 3:</strong> Ward placement + dewarding regimen.</li>
  <li><strong>Week 4:</strong> Mid-game 5-man team fight practice.</li>
</ul>`,
    },
    aiVodMention: `<p>Archon gap won't close? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags lane phase + Rosh timing + smoke gank errors. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'Dota 2 Beginner Guide 2026', url: '/blog/dota-2-beginner-guide-2026.html' },
      { name: 'Dota 2 Hero Tier List 2026', url: '/blog/dota-2-hero-tier-list-2026.html' },
      { name: 'Dota 2 Position 1-5 Item Builds', url: '/blog/dota-2-item-builds-guide.html' },
      { name: 'Dota 2 Warding Guide', url: '/blog/dota-2-warding-guide-2026.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 9,
  },
  {
    game: 'dota2', gameLabel: 'Dota 2', fromRank: 'Vision', toRank: 'Mastery',
    slug: 'dota-2-warding-guide-2026',
    metaTitle: 'Dota 2 Warding Guide 2026 — Vision Wins Games',
    metaDescription: 'Dota 2 warding guide: Observer + Sentry ward placement, rune spawn vision, anti-Pudge dewarding, Roshan pit vision, jungle ganking.',
    intro: `<p>Vision wins Dota 2. 50% of pro games are decided by ward placement. This guide breaks down Observer + Sentry placements per phase, dewarding strategy, rune control vision, and Roshan pit setup.</p>`,
    sections: [
      { heading: 'Observer Ward placements', html: `<ul>
  <li><strong>Rune spawn high ground</strong> — top + bottom rune spawns at minutes 0, 2, 4, 6 cycle.</li>
  <li><strong>Tri-bush (between lane + jungle)</strong> — enemy gank vision.</li>
  <li><strong>Ancient camp</strong> — scout enemy roam Pos 4.</li>
  <li><strong>Roshan pit high ground</strong> — minute 7+ Aegis prep.</li>
  <li><strong>Tier-2 tower side</strong> — mid-game gank vision.</li>
</ul>` },
      { heading: 'Sentry Ward placements', html: `<ul>
  <li><strong>Anti-Pudge dewarding mid lane</strong> — at high ground bush.</li>
  <li><strong>Anti-invisibility heroes (Riki / Bounty Hunter)</strong> — at lane.</li>
  <li><strong>Roshan pit deward</strong> — deny enemy vision.</li>
  <li><strong>Smoke gank route</strong> — catch invisible enemy.</li>
  <li><strong>Enemy jungle entrance</strong> — track enemy Pos 4 roam.</li>
</ul>` },
      { heading: 'Rune control — minutes 0/2/4/6 cycle', html: `<p>Runes spawn every 2 minutes. Vision = control:</p>
<ul>
  <li>Minute 0:00 — Bounty Rune (Top + Bottom). Ward at 0:00 / take rune at 0:00.</li>
  <li>Minute 2:00 — Power Rune. Mid heroes Bottle the rune.</li>
  <li>Minute 4:00, 6:00, 8:00 — Power Rune cycle.</li>
  <li>Minute 6:00+ — Bounty Rune spawns every 5 min.</li>
</ul>
<p>Ward both rune spawns at 0:00 for first 2 cycles. Adjusts vision priority.</p>` },
      { heading: 'Roshan pit setup', html: `<p>Roshan first spawn 7:30, then 8-11 minute cycle.</p>
<ul>
  <li>Observer Ward at high ground for vision (deny enemy approach).</li>
  <li>Sentry Ward in pit to deward enemy.</li>
  <li>Deep ward enemy jungle around pit at 22 minutes pre-spawn.</li>
  <li>Smoke approach for 5-man take.</li>
  <li>Force Staff in inventory for last-hit Aegis.</li>
</ul>` },
      { heading: 'Dewarding strategy — deny enemy vision', html: `<p>Dewarding = destroying enemy Observer wards.</p>
<ul>
  <li>Buy Sentry Ward at every minute 5+ recall.</li>
  <li>Identify enemy ward spots via minimap (mini-icon).</li>
  <li>Deward 3-4 wards per 5-minute period.</li>
  <li>Don't deward without team — enemy will gank ward attempt.</li>
  <li>Glimmer Cape for stealth deward approach.</li>
</ul>` },
      { heading: 'High-ground ward placements (post-Roshan)', html: `<p>After taking Rosh, push high ground requires vision.</p>
<ul>
  <li>Observer at tier-3 tower entry — track enemy buy-back.</li>
  <li>Sentry at high ground for invisible Pudge / Bounty.</li>
  <li>Smoke approach with team for high-ground siege.</li>
  <li>Maintain vision for 5-min siege window.</li>
</ul>` },
      { heading: 'The 7 vision habits separating Crusader from Archon', html: `<ul>
  <li>50+ wards placed per game as Pos 5.</li>
  <li>Rune spawn warding at 0:00 / 2:00 cycle.</li>
  <li>Sentry deward at 5-minute intervals.</li>
  <li>Roshan pit vision at minute 7+.</li>
  <li>Smoke approach for ganks.</li>
  <li>High-ground vision pre-siege.</li>
  <li>Anti-invisibility Sentry vs Pudge / Riki / BH.</li>
</ul>` },
    ],
    mistakes: [
      'Less than 30 wards per game',
      'Wards in obvious spots (enemy dewards)',
      'No Sentry against invisible heroes',
      'No Roshan pit vision setup',
      'No high-ground vision for siege',
    ],
    drill: {
      heading: 'Drill: 7-day warding regimen',
      html: `<p>Play 10 ranked games as Pos 5 Crystal Maiden. Goal: 50+ wards placed per game. Track ward stat at end of match. By game 10 ward placement is muscle memory.</p>`,
    },
    aiVodMention: `<p>Wards right but losing? <a href="${SITE_URL}/#/vod">Recon 6 Pro reviews match screenshots</a> and flags vision gaps + smoke gank errors per fight. Founding rate $9/mo, locked for life if you join before May 31.</p>`,
    relatedLinks: [
      { name: 'Dota 2 Beginner Guide 2026', url: '/blog/dota-2-beginner-guide-2026.html' },
      { name: 'Dota 2 Hero Tier List 2026', url: '/blog/dota-2-hero-tier-list-2026.html' },
      { name: 'Dota 2 Position 1-5 Item Builds', url: '/blog/dota-2-item-builds-guide.html' },
      { name: 'How to Climb from Crusader to Archon in Dota 2', url: '/blog/dota-2-crusader-to-archon.html' },
      { name: 'Recon 6 Pricing', url: '/#pricing' },
    ],
    readMinutes: 8,
  },
]

// ---------- MAIN ----------

function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  // All supported games + 5 new game clusters (LoL + EAFC + TK8 + PUBG + Dota2 = 25 posts).
  // Total ~98 posts across 16 games.
  const allPosts = [...R6_POSTS, ...CS2_POSTS, ...VALORANT_POSTS, ...OW2_POSTS, ...OW2_POSTS_HIGH, ...APEX_POSTS, ...APEX_POSTS_HIGH, ...MVR_POSTS, ...MVR_POSTS_HIGH, ...HALO_POSTS, ...HALO_POSTS_HIGH, ...FINALS_POSTS, ...FINALS_POSTS_GAPS, ...COD_POSTS, ...COD_POSTS_GAPS, ...FN_POSTS, ...FN_POSTS_GAPS, ...RL_POSTS, ...LOL_POSTS, ...EAFC_POSTS, ...TK8_POSTS, ...PUBG_POSTS, ...DOTA2_POSTS]

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

export { R6_POSTS, CS2_POSTS, VALORANT_POSTS, OW2_POSTS, OW2_POSTS_HIGH, APEX_POSTS, APEX_POSTS_HIGH, MVR_POSTS, MVR_POSTS_HIGH, HALO_POSTS, HALO_POSTS_HIGH, FINALS_POSTS, FINALS_POSTS_GAPS, COD_POSTS, COD_POSTS_GAPS, FN_POSTS, FN_POSTS_GAPS, RL_POSTS, LOL_POSTS, EAFC_POSTS, TK8_POSTS, PUBG_POSTS, DOTA2_POSTS, htmlShell, renderPost, renderIndex }
