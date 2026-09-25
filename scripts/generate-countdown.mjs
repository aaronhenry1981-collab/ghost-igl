#!/usr/bin/env node
// Generates public/countdown/index.html — a static, crawlable page for the
// recurring "when is the next r6 season" search. The page ranks, brings
// players back every season, and funnels into /strats and /operators where
// the product lives.
//
// Season facts come from src/config/season.js, the same record the in-app
// SeasonCountdown badge reads, so the two can never disagree. Update that
// file, not this one, when Ubisoft announces or launches a season.
//
// What the page shows:
//   - Next season announced (NEXT_SEASON.launchAt set): a live countdown to
//     Ubisoft's announced launch time.
//   - Not announced: no timer. The live season, its official Battle Pass
//     window, the latest patch, and "next season date not announced yet".
// Safety net: the inline script switches the page to a "check Ubisoft's news"
// notice once the announced launch time or the live season's Battle Pass
// window has passed, so a stale page never claims a season that has ended.
//
// Run: node scripts/generate-countdown.mjs

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { LIVE_SEASON, NEXT_SEASON, liveClaimEndsAt, seasonStatus } from '../src/config/season.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'countdown')
const SITE = 'https://r6coaching.com'

const esc = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

const dateLabel = (iso) => new Date(iso).toLocaleDateString('en-US', {
  month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
})

function hero(live, next, status) {
  if (status.state === 'countdown') {
    return `<div class="eyebrow">Next season countdown</div>
  <h1>Rainbow Six Siege<br>${esc(next.code)} Countdown</h1>
  <p class="sub"><strong>${esc(live.code)} ${esc(live.name)}</strong> is live. Ubisoft has announced <strong>${esc(next.code)}</strong> for ${esc(dateLabel(next.launchAt))}.</p>

  <div class="timer" id="timer" data-target="${esc(next.launchAt)}">
    <div class="cell"><b id="d">–</b><span>days</span></div>
    <div class="cell"><b id="h">–</b><span>hours</span></div>
    <div class="cell"><b id="m">–</b><span>minutes</span></div>
    <div class="cell"><b id="s">–</b><span>seconds</span></div>
  </div>
  <p class="hedge" id="hedge">Launch time from Ubisoft's announcement. <a href="${esc(live.newsUrl)}">Official news</a></p>`
  }
  if (status.state === 'live') {
    return `<div class="eyebrow" id="season-eyebrow">Live season · ${esc(live.code)}</div>
  <h1 id="season-title">${esc(live.name)} is live</h1>
  <p class="sub" id="season-sub">Ubisoft has not announced the ${esc(next.code)} release date yet. This page will count down to it as soon as there's an official date.</p>
  <dl class="facts" id="season-facts">
    <div><dt>Live season</dt><dd>${esc(live.code)} ${esc(live.name)}, live since ${esc(live.startedOnLabel)}</dd></div>
    <div><dt>Battle Pass</dt><dd><a href="${esc(live.battlePassUrl)}">${esc(live.battlePassWindowLabel)}</a></dd></div>
    <div><dt>Latest patch</dt><dd><a href="${esc(live.latestPatchUrl)}">${esc(live.latestPatch)}</a>, ${esc(live.latestPatchOnLabel)}</dd></div>
    <div><dt>Next season</dt><dd>${esc(next.code)}: date not announced</dd></div>
  </dl>`
  }
  return staleHero(live)
}

function staleHero(live) {
  return `<div class="eyebrow">Season update</div>
  <h1>Check Ubisoft for the current season</h1>
  <p class="sub">${staleNotice(live)}</p>`
}

function staleNotice(live) {
  return `Ubisoft listed the ${esc(live.name)} Battle Pass as ending ${esc(live.battlePassEndsOnLabel)}, so this page may be out of date. <a href="${esc(live.newsUrl)}">See Ubisoft's news for the current season</a>.`
}

function highlights(live) {
  if (!live.highlights?.length) return ''
  return `
  <h2>What ${esc(live.name)} brought</h2>
  <p>From Ubisoft's official <a href="${esc(live.seasonUrl)}">${esc(live.name)} season page</a>:</p>
  <ul>
${live.highlights.map((h) => `    <li><strong>${esc(h.title)}</strong> — ${esc(h.text)}</li>`).join('\n')}
  </ul>
`
}

function script(live, next, status) {
  if (status.state === 'countdown') {
    return `<script>
(function () {
  var target = new Date(document.getElementById('timer').dataset.target).getTime();
  var els = { d: document.getElementById('d'), h: document.getElementById('h'), m: document.getElementById('m'), s: document.getElementById('s') };
  function tick() {
    var left = target - Date.now();
    if (left <= 0) {
      document.getElementById('hedge').innerHTML = ${JSON.stringify(`Ubisoft's announced launch time for ${esc(next.code)} has passed. <a href="${esc(live.newsUrl)}">See Ubisoft's news for the live season</a>.`)};
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
</script>`
  }
  if (status.state === 'live') {
    // Built while the season was live, but possibly viewed after it ended.
    return `<script>
(function () {
  if (Date.now() < ${liveClaimEndsAt(live)}) return;
  document.getElementById('season-eyebrow').textContent = 'Season update';
  document.getElementById('season-title').textContent = 'Check Ubisoft for the current season';
  document.getElementById('season-sub').innerHTML = ${JSON.stringify(staleNotice(live))};
  document.getElementById('season-facts').hidden = true;
})();
</script>`
  }
  return ''
}

export function renderCountdownPage({ live = LIVE_SEASON, next = NEXT_SEASON, now = Date.now() } = {}) {
  const status = seasonStatus(now, live, next)
  const title = status.state === 'countdown'
    ? `Rainbow Six Siege Next Season Countdown — ${next.code} Release Date`
    : `Rainbow Six Siege Next Season — ${next.code} Release Date Not Announced Yet`
  const description = status.state === 'countdown'
    ? `Live countdown to R6 ${next.code}, which Ubisoft has announced for ${dateLabel(next.launchAt)}. ${live.name} (${live.code}) is live until then.`
    : `${live.name} (${live.code}) is live. Ubisoft hasn't announced the ${next.code} release date yet; this page counts down as soon as there's an official date.`

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${SITE}/countdown/" />
<meta name="robots" content="index, follow" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${SITE}/countdown/" />
<meta property="og:image" content="${SITE}/og-image.png" />
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: title,
  description,
  url: `${SITE}/countdown/`,
  dateModified: live.verifiedOn,
  isPartOf: { '@type': 'WebSite', name: 'RECON6', url: SITE },
}).replaceAll('<', '\\u003c')}</script>
<style>
  :root { --bg:#080c12; --panel:#111925; --line:#243248; --cyan:#5dd8e8; --text:#eaf1f8; --dim:#91a0b4; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:radial-gradient(circle at 50% 0,rgba(93,216,232,.09),transparent 34%),var(--bg); color:var(--text); font-family:'Segoe UI',system-ui,-apple-system,sans-serif; line-height:1.65; }
  .topbar { max-width:960px; margin:0 auto; padding:20px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,.06); }
  .brand { color:var(--text); font-weight:800; letter-spacing:.12em; }
  .brand b { color:var(--cyan); }
  .toplinks { display:flex; gap:18px; font-size:.84rem; }
  .wrap { max-width:900px; margin:0 auto; padding:54px 20px 80px; }
  a { color:var(--cyan); text-decoration:none; }
  a:hover { text-decoration:underline; }
  .season-hero { text-align:center; padding:34px 24px 28px; background:linear-gradient(180deg,rgba(93,216,232,.06),rgba(17,25,37,.72)); border:1px solid var(--line); border-radius:18px; box-shadow:0 22px 60px rgba(0,0,0,.28); }
  .eyebrow { color:var(--cyan); font-size:.7rem; font-weight:800; letter-spacing:.16em; text-transform:uppercase; margin-bottom:10px; }
  h1 { font-size:clamp(2rem,6vw,3.3rem); line-height:1.08; letter-spacing:-.04em; margin-bottom:12px; text-wrap:balance; }
  .sub { color:var(--dim); margin:0 auto 24px; max-width:650px; }
  .timer { display:flex; gap:10px; justify-content:center; margin:24px 0 12px; flex-wrap:wrap; }
  .cell { background:rgba(7,12,18,.78); border:1px solid var(--line); border-radius:12px; padding:16px 8px; width:112px; text-align:center; }
  .cell b { display:block; font-size:2.4rem; color:var(--cyan); font-variant-numeric:tabular-nums; }
  .cell span { color:var(--dim); font-size:.8rem; text-transform:uppercase; letter-spacing:.08em; }
  .hedge { text-align:center; color:var(--dim); font-size:.86rem; margin:0 auto; max-width:650px; }
  .facts { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; max-width:680px; margin:8px auto 0; text-align:left; }
  .facts div { background:rgba(7,12,18,.78); border:1px solid var(--line); border-radius:12px; padding:12px 14px; }
  .facts dt { color:var(--dim); font-size:.72rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; }
  .facts dd { font-weight:600; }
  .content { max-width:760px; margin:40px auto 0; }
  h2 { font-size:1.15rem; color:var(--cyan); margin:34px 0 10px; }
  ul { padding-left:22px; margin:10px 0; }
  li { margin:7px 0; }
  .cta { background:var(--panel); border:1px solid var(--line); border-left:3px solid var(--cyan); border-radius:12px; padding:18px 20px; margin:30px 0; }
  footer { margin-top:48px; color:var(--dim); font-size:.85rem; border-top:1px solid var(--line); padding-top:18px; }
  @media (max-width:560px) { .toplinks { display:none; } .wrap { padding-top:30px; } .season-hero { padding:26px 14px 22px; } .cell { width:42%; } .facts { grid-template-columns:1fr; } }
</style>
</head>
<body>
<nav class="topbar">
  <a class="brand" href="/">RECON <b>6</b></a>
  <div class="toplinks"><a href="/strats">Strategies</a><a href="/vod">VOD review</a><a href="/coaching/index.html">Human coaching</a></div>
</nav>
<div class="wrap">
  <section class="season-hero">
  ${hero(live, next, status)}
  </section>

  <div class="content">
${highlights(live)}
  <h2>How to spend the time left this season</h2>
  <p>Season resets compress your MMR toward the middle — the players who climb fastest after a reset are the ones who fixed their fundamentals <em>before</em> it. Two honest suggestions:</p>
  <ul>
    <li>Learn the ranked pool properly: <a href="/strats">site-by-site strats for every ranked map</a> — free tier covers the whole pool.</li>
    <li>Find out what actually costs you rounds: <a href="/vod">drop a screenshot for an AI breakdown</a>, or browse the <a href="/operators">operator index</a> and <a href="/meta">live meta board</a>.</li>
  </ul>

  <div class="cta"><strong>Playing ranked tonight?</strong> <a href="/live">RECON6's Live Coach</a> calls bans, picks, and site setups in real time — updated for every patch this season.</div>

  <footer>Season facts from Ubisoft's official <a href="${esc(live.seasonUrl)}">season page</a>, <a href="${esc(live.battlePassUrl)}">Battle Pass page</a> and <a href="${esc(live.latestPatchUrl)}">${esc(live.latestPatch)} patch notes</a>, checked ${esc(live.verifiedOnLabel)}. <a href="/">RECON6</a> · <a href="/blog/">Blog</a></footer>
  </div>
</div>
${script(live, next, status)}
</body>
</html>
`
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const now = Date.now()
  const status = seasonStatus(now)
  if (status.state === 'hidden') {
    console.warn(`⚠ src/config/season.js is out of date: ${LIVE_SEASON.name}'s Battle Pass window or the announced ${NEXT_SEASON.code} launch has passed. /countdown/ will tell players to check Ubisoft until it is updated.`)
  }
  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(join(OUT_DIR, 'index.html'), renderCountdownPage({ now }))
  console.log(`✓ Generated public/countdown/index.html (${status.state}: ${LIVE_SEASON.code} ${LIVE_SEASON.name}; ${NEXT_SEASON.code} ${NEXT_SEASON.launchAt || 'not announced'})`)
}
