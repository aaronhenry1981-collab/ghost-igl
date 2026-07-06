#!/usr/bin/env node
// Generates public/countdown/index.html — a static, crawlable countdown to the
// next R6 season. Proven recurring-search play ("when is the next r6 season"):
// the page ranks, the countdown brings players back every season, and the
// content funnels into /#/strats and /#/operators where the product lives.
//
// ── SEASONAL MAINTENANCE (one-line update) ──────────────────────────────────
// When Ubisoft confirms the next season's date (or a new season goes live),
// update NEXT_SEASON below — same single-source-of-truth pattern as
// src/config/founding.js. If TARGET passes with no update, the page
// automatically switches its copy to "launching any day now" instead of
// showing a negative countdown.
//
// Facts verified 2026-07-06 against Ubisoft's Year 11 roadmap coverage:
// Y11S3 announced at Six Invitational (Feb 2026); new anti-shield Defender
// codenamed "Fireworks" (projectile pierces shields); large Villa rework +
// targeted map adjustments; Operator Mastery progression; solo-only Legend
// Division in Ranked; 3v3 arcade mode + drone racing event. EXACT DATE NOT
// ANNOUNCED — copy hedges with "expected".
//
// Run: node scripts/generate-countdown.mjs

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'countdown')
const SITE = 'https://r6coaching.com'

const CURRENT_SEASON = {
  code: 'Y11S2',
  name: 'Operation System Override',
  live: '2026-06-02',
}
const NEXT_SEASON = {
  code: 'Y11S3',
  // Expected date — Siege seasons run ~3 months; S2 went live June 2.
  // NOT officially confirmed. Update + set confirmed: true when Ubisoft posts it.
  target: '2026-09-01T13:00:00Z',
  confirmed: false,
  headline: 'a new anti-shield Defender (codename "Fireworks")',
}

const title = `Rainbow Six Siege Next Season Countdown — ${NEXT_SEASON.code} Release Date`
const description = `Live countdown to R6 ${NEXT_SEASON.code}. Expected release, what's coming (the anti-shield defender "Fireworks", Villa rework, Operator Mastery, Legend Division), and how to prep your rank before the reset.`

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="${description}" />
<link rel="canonical" href="${SITE}/countdown/" />
<meta name="robots" content="index, follow" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${SITE}/countdown/" />
<meta property="og:image" content="${SITE}/og-image.png" />
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: title,
  description,
  url: `${SITE}/countdown/`,
  isPartOf: { '@type': 'WebSite', name: 'RECON6', url: SITE },
})}</script>
<style>
  :root { --bg:#0a0e17; --panel:#111827; --line:#1f2a3f; --cyan:#00e5ff; --text:#dbe4f0; --dim:#8b98ab; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:var(--bg); color:var(--text); font-family:'Segoe UI',system-ui,-apple-system,sans-serif; line-height:1.65; }
  .wrap { max-width:760px; margin:0 auto; padding:48px 20px 80px; }
  a { color:var(--cyan); text-decoration:none; }
  a:hover { text-decoration:underline; }
  h1 { font-size:1.7rem; line-height:1.3; margin-bottom:8px; }
  .sub { color:var(--dim); margin-bottom:34px; }
  .timer { display:flex; gap:12px; justify-content:center; margin:30px 0 10px; flex-wrap:wrap; }
  .cell { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:18px 8px; width:110px; text-align:center; }
  .cell b { display:block; font-size:2.4rem; color:var(--cyan); font-variant-numeric:tabular-nums; }
  .cell span { color:var(--dim); font-size:.8rem; text-transform:uppercase; letter-spacing:.08em; }
  .hedge { text-align:center; color:var(--dim); font-size:.9rem; margin-bottom:36px; }
  h2 { font-size:1.15rem; color:var(--cyan); margin:34px 0 10px; }
  ul { padding-left:22px; margin:10px 0; }
  li { margin:7px 0; }
  .cta { background:var(--panel); border:1px solid var(--line); border-left:3px solid var(--cyan); border-radius:10px; padding:16px 18px; margin:28px 0; }
  footer { margin-top:48px; color:var(--dim); font-size:.85rem; border-top:1px solid var(--line); padding-top:18px; }
</style>
</head>
<body>
<div class="wrap">
  <h1>Rainbow Six Siege: Next Season Countdown</h1>
  <p class="sub">Current season: <strong>${CURRENT_SEASON.code} ${CURRENT_SEASON.name}</strong> (live since June 2, 2026). Next up: <strong>${NEXT_SEASON.code}</strong>.</p>

  <div class="timer" id="timer" data-target="${NEXT_SEASON.target}">
    <div class="cell"><b id="d">–</b><span>days</span></div>
    <div class="cell"><b id="h">–</b><span>hours</span></div>
    <div class="cell"><b id="m">–</b><span>minutes</span></div>
    <div class="cell"><b id="s">–</b><span>seconds</span></div>
  </div>
  <p class="hedge" id="hedge">${NEXT_SEASON.confirmed
    ? `Confirmed launch: ${new Date(NEXT_SEASON.target).toUTCString().slice(0, 16)}.`
    : `Expected around September 1, 2026 — Ubisoft has <em>not</em> announced the exact date yet. Siege seasons run ~3 months and ${CURRENT_SEASON.code} went live June 2. We'll update this the day it's confirmed.`}</p>

  <h2>What's coming in ${NEXT_SEASON.code}</h2>
  <p>Announced on the official Year 11 roadmap (Six Invitational, February 2026):</p>
  <ul>
    <li><strong>New Defender, codename "Fireworks"</strong> — built to counter shield operators, with a projectile that pierces shields. If shield metas tilt your lobbies, this is the season's biggest ranked shift.</li>
    <li><strong>Villa rework</strong> plus targeted map adjustments — bomb spots, rotations, and sightlines change. Re-learn your setups (our <a href="/blog/villa-defense-setups-ranked.html">Villa defense guide</a> covers the current layout and will be updated on release).</li>
    <li><strong>Operator Mastery</strong> — long-term per-operator progression.</li>
    <li><strong>Legend Division</strong> — a new solo-only division in Ranked.</li>
    <li>A 3v3 arcade mode and a drone racing event.</li>
  </ul>

  <h2>How to spend the time left this season</h2>
  <p>Season resets compress your MMR toward the middle — the players who climb fastest after a reset are the ones who fixed their fundamentals <em>before</em> it. Two honest suggestions:</p>
  <ul>
    <li>Learn the ranked pool properly: <a href="/#/strats">site-by-site strats for every ranked map</a> — free tier covers the whole pool.</li>
    <li>Find out what actually costs you rounds: <a href="/#/vod">drop a screenshot for an AI breakdown</a>, or browse the <a href="/#/operators">operator index</a> and <a href="/#/meta">live meta board</a>.</li>
  </ul>

  <div class="cta"><strong>Playing ranked tonight?</strong> <a href="/#/live">RECON6's Live Coach</a> calls bans, picks, and site setups in real time — updated for every patch this season.</div>

  <footer>Season facts sourced from Ubisoft's official Year 11 roadmap. Countdown target is our estimate until Ubisoft confirms the date. <a href="/">RECON6</a> · <a href="/blog/">Blog</a></footer>
</div>
<script>
(function () {
  var target = new Date(document.getElementById('timer').dataset.target).getTime();
  var els = { d: document.getElementById('d'), h: document.getElementById('h'), m: document.getElementById('m'), s: document.getElementById('s') };
  function tick() {
    var left = target - Date.now();
    if (left <= 0) {
      document.getElementById('hedge').textContent = 'The expected window has arrived — the new season should be launching any day now. Check back for the confirmed date.';
      els.d.textContent = '0'; els.h.textContent = '0'; els.m.textContent = '0'; els.s.textContent = '0';
      return;
    }
    els.d.textContent = Math.floor(left / 86400000);
    els.h.textContent = Math.floor(left % 86400000 / 3600000);
    els.m.textContent = Math.floor(left % 3600000 / 60000);
    els.s.textContent = Math.floor(left % 60000 / 1000);
    setTimeout(tick, 1000);
  }
  tick();
})();
</script>
</body>
</html>
`

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(join(OUT_DIR, 'index.html'), html)
console.log('✓ Generated public/countdown/index.html (target: ' + NEXT_SEASON.target + ', confirmed: ' + NEXT_SEASON.confirmed + ')')
