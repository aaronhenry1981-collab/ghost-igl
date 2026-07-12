#!/usr/bin/env node
// Generates public/coaching/index.html — the coaching-first landing page.
// RECON6's revenue product: 1-on-1 AI-augmented coaching with Aaron.
//
// Design decisions (2026-07-06):
// - STATIC page (like /countdown/) so Service + FAQ schema can earn rich
//   results — hash routes can't.
// - Booking = the existing Formspree lead pipe (same endpoint EmailCapture
//   uses) → booking requests land in Aaron's email today. When direct Stripe
//   checkout links exist for the paid tiers, drop them into TIERS[].link.
// - NO star/AggregateRating schema yet: there are no third-party coaching
//   reviews, and self-reviews violate Google's guidelines. Add it when real
//   student reviews exist.
// - The AI is OUT FRONT (headline), never hidden — non-negotiable.
//
// Run: node scripts/generate-coaching-page.mjs

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { RANKS } from '../src/data/ranks.js' // single source of truth — all 40 R6 ranks

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'coaching')
const SITE = 'https://r6coaching.com'
const FORM_ENDPOINT = 'https://formspree.io/f/mykbrrob' // same pipe as EmailCapture

const TIERS = [
  { id: 'intro', name: 'Free Intro', price: '$0', unit: '30 min', desc: 'We watch your clips together, I give you one real fix, and you decide if this is for you. No card, no pitch.', cta: 'Book free intro', featured: true },
  { id: 'single', name: 'Single Session', price: '$40', unit: 'per session', desc: 'One full hour: VOD review of your rounds + a live-coached plan for your next queue.' },
  { id: 'tuneup', name: 'Tune-Up', price: '$75', unit: '2 sessions', desc: 'Find the leak, fix the leak, verify it stuck. The right size for one stubborn habit.' },
  { id: 'climb', name: 'Climb', price: '$140', unit: '4 sessions', desc: 'A month of structured work: session reports, drills between sessions, measurable death-cause trends.' },
  { id: 'rankup', name: 'Rank-Up', price: '$195', unit: '6 sessions', desc: 'The full program — we target the next rank and track every number that gets you there.' },
  { id: 'duo', name: 'Duo add-on', price: '+$15', unit: 'per session', desc: 'Bring your duo to any session. Trade timing, crossfires, and comms coached as a pair.' },
  { id: 'squad', name: 'Squad Session', price: '$90', unit: 'per session', desc: 'Your 5-stack, one session: set roles, defaults, and a ban map for your team.' },
]

// Rank <option>s built from the 40-rank source of truth. value = global order
// (1..40) so the recommendation logic compares by rank distance. Defaults:
// Silver IV (a common "stuck" rank) → Gold II.
const rankOptions = (selectedOrder) =>
  RANKS.map((r) => `<option value="${r.order}"${r.order === selectedOrder ? ' selected' : ''}>${r.label}</option>`).join('')

const FAQ = [
  ['What does "AI-augmented" actually mean?', 'You get a human coach working with a full AI staff. Every session uses the RECON6 stack: AI VOD breakdowns of your rounds, death-cause analysis across your sessions, and the same live-coach system that calls bans, picks, and setups in real matches. The AI finds the pattern; your coach fixes it with you. Nothing about it is hidden — the AI is the point.'],
  ['What happens in the free intro?', 'Thirty minutes. You bring 2-3 clips or screenshots of rounds you lost, we break down what actually cost you the rounds (it is usually not what you think), you leave with one concrete fix. At the end, if a package makes sense for your goal, we talk about it. If not, keep the fix.'],
  ['Is this boosting?', 'No. Nobody touches your account, ever. You earn every rank — coaching just stops you from making the same mistake five matches in a row.'],
  ['Console or PC?', 'Both. Your coach plays ranked on PS5 with a capture-card coaching setup, so console players get coached by someone who actually plays with their input and their lobbies. PC works exactly the same.'],
  ['How do paid sessions get scheduled and paid?', 'Book the free intro first — every package starts there. Scheduling and payment are set up directly with your coach after the intro (invoice or payment link). The 7-day money-back guarantee covers every package.'],
  ['What rank do I need to be?', 'Any rank. Copper to Diamond, the process is the same: find the leak that costs the most rounds, fix it, measure it. The lower your rank, the faster the results.'],
]

const tierCards = TIERS.map((t) => `
  <div class="tier${t.featured ? ' featured' : ''}" id="tier-${t.id}">
    ${t.featured ? '<div class="tag">START HERE</div>' : ''}
    <h3>${t.name}</h3>
    <div class="price">${t.price} <span>${t.unit}</span></div>
    <p>${t.desc}</p>
    <a class="btn${t.featured ? ' primary' : ''}" href="#book" data-tier="${t.name}">${t.cta || 'Book — starts with the free intro'}</a>
  </div>`).join('\n')

const faqHtml = FAQ.map(([q, a]) => `
  <details><summary>${q}</summary><p>${a}</p></details>`).join('\n')

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'RECON6 Rainbow Six Siege Coaching',
    serviceType: 'Esports coaching (Rainbow Six Siege)',
    provider: { '@type': 'Organization', name: 'RECON6', url: SITE },
    areaServed: 'Online',
    description: 'AI-augmented 1-on-1 Rainbow Six Siege coaching: VOD review, live-coached ranked plans, and measurable death-cause tracking. Free 30-minute intro session.',
    offers: TIERS.filter((t) => t.id !== 'intro').map((t) => ({
      '@type': 'Offer',
      name: `${t.name} (${t.unit})`,
      price: t.price.replace(/[^0-9.]/g, ''),
      priceCurrency: 'USD',
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  },
]

const title = 'Rainbow Six Siege Coaching — AI-Augmented 1-on-1 Sessions | RECON6'
const description = 'Human coaching with an AI staff: VOD breakdowns, death-cause tracking, live ranked plans. Free 30-minute intro session — console and PC, any rank.'

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="${description}" />
<link rel="canonical" href="${SITE}/coaching/" />
<meta name="robots" content="index, follow" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${SITE}/coaching/" />
<meta property="og:image" content="${SITE}/og-image.png" />
${jsonLd.map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join('\n')}
<style>
  :root { --bg:#0a0e17; --panel:#111827; --line:#1f2a3f; --cyan:#00e5ff; --text:#dbe4f0; --dim:#8b98ab; --orange:#ff9b5c; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:var(--bg); color:var(--text); font-family:'Segoe UI',system-ui,sans-serif; line-height:1.65; }
  .wrap { max-width:960px; margin:0 auto; padding:48px 20px 80px; }
  a { color:var(--cyan); }
  h1 { font-size:2rem; line-height:1.25; margin-bottom:12px; }
  h2 { font-size:1.3rem; color:var(--cyan); margin:44px 0 14px; }
  .sub { color:var(--dim); font-size:1.05rem; max-width:680px; }
  .btn { display:inline-block; padding:12px 22px; border-radius:10px; border:1px solid var(--cyan); color:var(--cyan); text-decoration:none; font-weight:700; margin-top:10px; }
  .btn.primary { background:var(--cyan); color:#04222a; }
  .selector { background:var(--panel); border:1px solid var(--line); border-radius:14px; padding:22px; margin:30px 0; }
  .selector .row { display:flex; gap:14px; flex-wrap:wrap; align-items:end; }
  .selector label { display:block; font-size:.85rem; color:var(--dim); margin-bottom:4px; }
  .selector select { background:#0d1320; color:var(--text); border:1px solid var(--line); border-radius:8px; padding:10px 12px; font-size:1rem; min-width:170px; }
  #reco { margin-top:14px; font-size:1.02rem; }
  #reco strong { color:var(--orange); }
  .tiers { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:14px; }
  .tier { background:var(--panel); border:1px solid var(--line); border-radius:14px; padding:20px; position:relative; }
  .tier.featured { border-color:var(--cyan); }
  .tier .tag { position:absolute; top:-10px; left:16px; background:var(--cyan); color:#04222a; font-size:.7rem; font-weight:800; padding:2px 10px; border-radius:999px; letter-spacing:.06em; }
  .tier h3 { margin-bottom:4px; }
  .price { font-size:1.6rem; font-weight:800; color:var(--cyan); }
  .price span { font-size:.8rem; color:var(--dim); font-weight:400; }
  .tier p { font-size:.92rem; color:var(--dim); margin-top:8px; min-height:66px; }
  details { background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:14px 18px; margin:10px 0; }
  summary { cursor:pointer; font-weight:700; }
  details p { margin-top:10px; color:var(--dim); }
  form { background:var(--panel); border:1px solid var(--cyan); border-radius:14px; padding:24px; margin-top:16px; }
  form label { display:block; font-size:.85rem; color:var(--dim); margin:12px 0 4px; }
  form input, form select, form textarea { width:100%; background:#0d1320; color:var(--text); border:1px solid var(--line); border-radius:8px; padding:10px 12px; font-size:1rem; }
  form button { margin-top:18px; width:100%; padding:14px; background:var(--cyan); color:#04222a; font-weight:800; font-size:1.05rem; border:none; border-radius:10px; cursor:pointer; }
  .ok { color:#7ee2a4; margin-top:12px; display:none; }
  footer { margin-top:52px; color:var(--dim); font-size:.85rem; border-top:1px solid var(--line); padding-top:18px; }
</style>
</head>
<body>
<div class="wrap">
  <h1>A human coach. An AI staff. Your rank.</h1>
  <p class="sub">1-on-1 Rainbow Six Siege coaching backed by the full RECON6 AI stack — VOD breakdowns, death-cause tracking, and live ranked plans. The AI finds what's costing you rounds; your coach fixes it with you. First session is free.</p>
  <a class="btn primary" href="#book">Book a free session</a>
  <a class="btn" href="/#/strats" style="margin-left:8px">Browse the strat library</a>

  <h2>Where are you → where do you want to be?</h2>
  <div class="selector">
    <div class="row">
      <div><label for="cur">Current rank</label>
        <select id="cur">${rankOptions(12)}</select></div>
      <div><label for="goal">Goal rank</label>
        <select id="goal">${rankOptions(19)}</select></div>
    </div>
    <div id="reco"></div>
  </div>

  <h2>Session packages</h2>
  <div class="tiers">
${tierCards}
  </div>
  <p style="color:var(--dim);font-size:.9rem;margin-top:12px">Every package starts with the free intro — scheduling and payment are set up there. 7-day money-back guarantee on all packages.</p>

  <h2>How a session works</h2>
  <p class="sub">Before we meet, the AI has already processed your clips: what killed you, where, and the pattern across rounds. In the session we watch the moments that matter, fix ONE thing properly, and build the plan for your next queue — with the same strat library and live-coach data RECON6 subscribers use. After the session you get the write-up: the leak, the fix, the drill.</p>

  <h2>Questions</h2>
${faqHtml}

  <h2 id="book">Book your free intro</h2>
  <!-- IN-HOUSE SCHEDULER (2026-07-06): real slot booking against the
       recon6-booking API — double-booking-proof (conditional writes),
       visitor-timezone display, 5-minute holds, email confirmations with
       .ics + self-serve reschedule/cancel links. The Formspree form below
       survives ONLY as the automatic fallback if the API is unreachable. -->
  <div id="scheduler">
    <div id="slotArea"><p style="color:var(--dim)">Loading open times…</p></div>
    <div id="holdBar" style="display:none;background:rgba(255,155,92,.12);border:1px solid var(--orange);border-radius:10px;padding:10px 14px;margin:12px 0">
      Holding <strong id="holdSlotLabel"></strong> for you — <span id="holdCountdown">5:00</span> to finish booking.
    </div>
    <form id="confirmForm" style="display:none">
      <label for="c-name">Name *</label>
      <input id="c-name" name="name" type="text" required placeholder="Your name" />
      <label for="c-email">Email * (confirmation + calendar invite)</label>
      <input id="c-email" name="email" type="email" required placeholder="you@example.com" />
      <label for="c-discord">Discord (sessions run on Discord)</label>
      <input id="c-discord" name="discord" type="text" placeholder="yourname" />
      <label for="c-rank">Current rank → goal</label>
      <input id="c-rank" name="rank_goal" type="text" placeholder="Silver → Gold" />
      <label for="c-type">Session type</label>
      <select id="c-type" name="sessionType">
        <option>Free Intro</option>
        ${TIERS.filter((t) => t.id !== 'intro').map((t) => `<option>${t.name}</option>`).join('')}
      </select>
      <label for="c-notes">What's costing you rounds? (optional)</label>
      <textarea id="c-notes" name="notes" rows="3" placeholder="e.g. I keep dying first on attack"></textarea>
      <button type="submit" id="confirmBtn">Confirm this session</button>
      <div class="ok" id="confirmOk"></div>
      <div id="confirmErr" style="color:#ff6b6b;margin-top:12px;display:none"></div>
    </form>
  </div>
  <form id="bookForm" action="${FORM_ENDPOINT}" method="POST" style="display:none">
    <input type="hidden" name="_subject" value="COACHING BOOKING — free intro request" />
    <input type="hidden" name="form" value="coaching-booking" />
    <label for="f-email">Email *</label>
    <input id="f-email" name="email" type="email" required placeholder="you@example.com" />
    <label for="f-discord">Discord (fastest way to schedule)</label>
    <input id="f-discord" name="discord" type="text" placeholder="yourname" />
    <label for="f-rank">Current rank → goal</label>
    <input id="f-rank" name="rank_goal" type="text" placeholder="Silver → Gold" />
    <label for="f-tier">Package you're eyeing (optional)</label>
    <select id="f-tier" name="tier">
      <option>Just the free intro for now</option>
      ${TIERS.filter((t) => t.id !== 'intro').map((t) => `<option>${t.name} — ${t.price} ${t.unit}</option>`).join('')}
    </select>
    <label for="f-notes">What's costing you rounds? (optional)</label>
    <textarea id="f-notes" name="notes" rows="3" placeholder="e.g. I keep dying first on attack"></textarea>
    <button type="submit">Request my free intro session</button>
    <div class="ok" id="okMsg">Got it — you'll hear back within a day to schedule. Check your email.</div>
  </form>
  <p style="color:var(--dim);font-size:.9rem;margin-top:10px">Prefer Discord? <a href="https://discord.gg/namGQqs3jb" target="_blank" rel="noopener">Join the server</a> and post in #coaching.</p>

  <footer><a href="/">RECON6</a> · <a href="/#/strats">Strats</a> · <a href="/#/vod">AI VOD review</a> · <a href="/blog/">Blog</a> · <a href="/countdown/">Next season</a></footer>
</div>
<script>
(function () {
  var TIER_FOR_GAP = [
    ['Single Session', 'tier-single', 'one focused session to sharpen what is already working'],
    ['Tune-Up (2 sessions)', 'tier-tuneup', 'find the leak, fix it, verify it stuck'],
    ['Climb (4 sessions)', 'tier-climb', 'a structured month with drills and measurable trends'],
    ['Rank-Up (6 sessions)', 'tier-rankup', 'the full program for a multi-rank jump'],
  ];
  var cur = document.getElementById('cur'), goal = document.getElementById('goal'), reco = document.getElementById('reco');
  function update() {
    // Option values are the global rank order (1..40). Gap = rank divisions to
    // climb; ~5 divisions per tier. Goal must sit above current rank.
    var c = parseInt(cur.value, 10), g = parseInt(goal.value, 10);
    if (g <= c) {
      reco.innerHTML = '<strong style="color:var(--orange)">Pick a goal above your current rank.</strong> Even one division up is a real target — that is exactly what a session fixes.';
      return;
    }
    var gap = g - c;
    var pick = gap <= 3 ? TIER_FOR_GAP[0] : gap <= 8 ? TIER_FOR_GAP[1] : gap <= 15 ? TIER_FOR_GAP[2] : TIER_FOR_GAP[3];
    reco.innerHTML = 'Recommended: <strong>' + pick[0] + '</strong> — ' + pick[2] +
      '. <a href="#' + pick[1] + '">See it</a> · either way, <a href="#book">start with the free intro</a>.';
  }
  cur.addEventListener('change', update); goal.addEventListener('change', update); update();

  // ---- in-house scheduler ----
  var API = 'https://u0k402df6j.execute-api.us-east-1.amazonaws.com/prod';
  var held = null, holdTimer = null;
  var tz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC';

  // Channel attribution — mirror src/lib/refSource.js (localStorage 'recon:src',
  // first-touch). React captures ?ref on the landing page; this also captures
  // it if a visitor lands directly on /coaching/?ref=tiktok. getRef() defaults
  // to 'direct' so every booking carries a source.
  var SRC_KEY = 'recon:src';
  function captureRef() {
    try {
      var raw = new URLSearchParams(window.location.search).get('ref');
      var clean = (raw || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
      if (clean && !localStorage.getItem(SRC_KEY)) localStorage.setItem(SRC_KEY, clean);
    } catch (e) { /* storage blocked — lose attribution, never break booking */ }
  }
  function getRef() {
    try { return localStorage.getItem(SRC_KEY) || 'direct'; } catch (e) { return 'direct'; }
  }
  captureRef();

  function fallbackToForm() {
    document.getElementById('scheduler').style.display = 'none';
    document.getElementById('bookForm').style.display = 'block';
  }
  var fbForm = document.getElementById('bookForm');
  fbForm.addEventListener('submit', function (e) {
    e.preventDefault();
    fetch(fbForm.action, { method: 'POST', body: new FormData(fbForm), headers: { Accept: 'application/json' } })
      .then(function (r) { if (r.ok) { document.getElementById('okMsg').style.display = 'block'; fbForm.querySelector('button').disabled = true; } else { fbForm.submit(); } })
      .catch(function () { fbForm.submit(); });
  });

  function fmtDay(iso) {
    return new Intl.DateTimeFormat(undefined, { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso));
  }
  function fmtTime(iso) {
    return new Intl.DateTimeFormat(undefined, { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
  }

  function loadSlots() {
    fetch(API + '/booking/slots').then(function (r) { return r.json(); }).then(function (d) {
      if (!d.slots) throw new Error('no slots field');
      var area = document.getElementById('slotArea');
      if (!d.slots.length) {
        area.innerHTML = '<p style="color:var(--dim)">No open times right now — check back tomorrow or <a href="https://discord.gg/namGQqs3jb">ping us on Discord</a>.</p>';
        return;
      }
      var byDay = {};
      d.slots.forEach(function (s) { var k = fmtDay(s); (byDay[k] = byDay[k] || []).push(s); });
      var html = '<p style="color:var(--dim);font-size:.9rem">Times shown in your timezone (' + tz + '). Sessions are ' + d.session_minutes + ' minutes.</p>';
      Object.keys(byDay).forEach(function (day) {
        html += '<div style="margin:14px 0 6px;font-weight:700">' + day + '</div><div style="display:flex;gap:8px;flex-wrap:wrap">';
        byDay[day].forEach(function (s) {
          html += '<button type="button" class="btn slot-btn" data-slot="' + s + '">' + fmtTime(s) + '</button>';
        });
        html += '</div>';
      });
      area.innerHTML = html;
      area.querySelectorAll('.slot-btn').forEach(function (b) {
        b.addEventListener('click', function () { holdSlot(b.dataset.slot, b); });
      });
    }).catch(function () { fallbackToForm(); });
  }

  function holdSlot(slotId, btn) {
    btn.disabled = true;
    fetch(API + '/booking/hold', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slotId: slotId }) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) { btn.textContent = 'Taken'; btn.style.opacity = .4; return; }
        held = { slotId: slotId, token: res.d.holdToken, until: Date.parse(res.d.heldUntil) };
        document.getElementById('holdSlotLabel').textContent = fmtDay(slotId) + ' ' + fmtTime(slotId);
        document.getElementById('holdBar').style.display = 'block';
        document.getElementById('confirmForm').style.display = 'block';
        document.getElementById('confirmForm').scrollIntoView({ behavior: 'smooth' });
        if (holdTimer) clearInterval(holdTimer);
        holdTimer = setInterval(function () {
          var left = Math.max(0, held.until - Date.now());
          var m = Math.floor(left / 60000), s = Math.floor(left % 60000 / 1000);
          document.getElementById('holdCountdown').textContent = m + ':' + (s < 10 ? '0' : '') + s;
          if (left <= 0) { clearInterval(holdTimer); document.getElementById('holdBar').style.display = 'none'; document.getElementById('confirmForm').style.display = 'none'; held = null; loadSlots(); }
        }, 1000);
      })
      .catch(function () { fallbackToForm(); });
  }

  document.getElementById('confirmForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!held) return;
    document.getElementById('confirmBtn').disabled = true;
    // Read fields by id, NOT via form.name/form.email — HTMLFormElement.name
    // (and other reflected props) shadow same-named controls, so f.name.value
    // is the form's name attribute, not the input. That silently dropped the
    // customer's name and made every /booking/confirm fail with "missing
    // fields" — holds succeeded, confirms never did. Read by id to be safe.
    var val = function (id) { return document.getElementById(id).value; };
    fetch(API + '/booking/confirm', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slotId: held.slotId, holdToken: held.token, tz: tz,
        name: val('c-name'), email: val('c-email'), discord: val('c-discord'),
        rank_goal: val('c-rank'), sessionType: val('c-type'), notes: val('c-notes'),
        referral_source: getRef(),
      }),
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) {
          document.getElementById('confirmErr').style.display = 'block';
          document.getElementById('confirmErr').textContent = (res.d && res.d.error) || 'Something broke — try another slot.';
          document.getElementById('confirmBtn').disabled = false;
          return;
        }
        if (holdTimer) clearInterval(holdTimer);
        document.getElementById('holdBar').style.display = 'none';
        var ok = document.getElementById('confirmOk');
        ok.style.display = 'block';
        ok.textContent = res.d.confirmationEmail === 'sent'
          ? 'Booked. Confirmation + calendar invite are in your email.'
          : 'Booked. Your coach has been notified and will confirm by email shortly.';
      })
      .catch(function () {
        document.getElementById('confirmErr').style.display = 'block';
        document.getElementById('confirmErr').textContent = 'Network hiccup — your hold is still active, try Confirm again.';
        document.getElementById('confirmBtn').disabled = false;
      });
  });

  loadSlots();

  document.querySelectorAll('a[data-tier]').forEach(function (a) {
    a.addEventListener('click', function () {
      var sel = document.getElementById('c-type') || document.getElementById('f-tier');
      if (!sel) return;
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].text.indexOf(a.dataset.tier) === 0) { sel.selectedIndex = i; break; }
      }
    });
  });
})();
</script>
</body>
</html>
`

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(join(OUT_DIR, 'index.html'), html)
console.log('✓ Generated public/coaching/index.html (' + TIERS.length + ' tiers, ' + FAQ.length + ' FAQ items, Service + FAQPage schema)')
