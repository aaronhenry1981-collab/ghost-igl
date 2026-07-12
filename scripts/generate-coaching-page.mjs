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

// LAUNCH: only the $20 intro is live (matches checkout exactly — every visitor
// is a first-timer right now). Ongoing coaching is the $70/mo add-on + $99
// Academy bundle, built in the next pass; they are NOT shown until they can
// actually be charged (copy must agree with the charge — the "$39 fire" rule).
const TIERS = [
  { id: 'intro', type: 'intro', name: 'First Session', price: '$20', unit: '50% off · first session', desc: 'Your first hour at half price. Full VOD review of the rounds you lost + a live-coached plan for your next queue. First-timers only.', cta: 'Book your first session — $20', featured: true },
]

// Rank <option>s built from the 40-rank source of truth. value = global order
// (1..40) so the recommendation logic compares by rank distance. Defaults:
// Silver IV (a common "stuck" rank) → Gold II.
const rankOptions = (selectedOrder) =>
  RANKS.map((r) => `<option value="${r.order}"${r.order === selectedOrder ? ' selected' : ''}>${r.label}</option>`).join('')

const FAQ = [
  ['What does "AI-augmented" actually mean?', 'You get a human coach working with a full AI staff. Every session uses the RECON6 stack: AI VOD breakdowns of your rounds, death-cause analysis across your sessions, and the same live-coach system that calls bans, picks, and setups in real matches. The AI finds the pattern; your coach fixes it with you. Nothing about it is hidden — the AI is the point.'],
  ['What happens in the first session?', 'A full hour. You bring 2-3 clips or screenshots of rounds you lost, we break down what actually cost you the rounds (it is usually not what you think), and you leave with a concrete plan for your next queue. Your first session is 50% off — just $20. Ongoing coaching plans launch soon.'],
  ['Is this boosting?', 'No. Nobody touches your account, ever. You earn every rank — coaching just stops you from making the same mistake five matches in a row.'],
  ['Console or PC?', 'Both. Your coach plays ranked on PS5 with a capture-card coaching setup, so console players get coached by someone who actually plays with their input and their lobbies. PC works exactly the same.'],
  ['How do sessions get scheduled and paid?', 'Pick an open time on the calendar, pay securely through Stripe (first session $20), and the slot is instantly confirmed with a calendar invite. The 7-day money-back guarantee covers every session.'],
  ['What rank do I need to be?', 'Any rank. Copper to Diamond, the process is the same: find the leak that costs the most rounds, fix it, measure it. The lower your rank, the faster the results.'],
]

const tierCards = TIERS.map((t) => `
  <div class="tier${t.featured ? ' featured' : ''}" id="tier-${t.id}">
    ${t.featured ? '<div class="tag">START HERE</div>' : ''}
    <h3>${t.name}</h3>
    <div class="price">${t.price} <span>${t.unit}</span></div>
    <p>${t.desc}</p>
    <a class="btn${t.featured ? ' primary' : ''}" href="#book" data-type="${t.type}">${t.cta || `Book — ${t.name}`}</a>
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
    description: 'AI-augmented 1-on-1 Rainbow Six Siege coaching: VOD review, live-coached ranked plans, and measurable death-cause tracking. First session 50% off ($20).',
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
const description = 'Human coaching with an AI staff: VOD breakdowns, death-cause tracking, live ranked plans. First session 50% off ($20) — console and PC, any rank.'

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
  <p class="sub">1-on-1 Rainbow Six Siege coaching backed by the full RECON6 AI stack — VOD breakdowns, death-cause tracking, and live ranked plans. The AI finds what's costing you rounds; your coach fixes it with you. First session is <strong style="color:var(--cyan)">50% off — just $20</strong>.</p>
  <a class="btn primary" href="#book">Book your first session — 50% off ($20)</a>
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

  <h2>Start here</h2>
  <div class="tiers">
${tierCards}
  </div>
  <p style="color:var(--dim);font-size:.9rem;margin-top:12px">Your first session is 50% off — just $20. Pay securely at checkout and your slot is confirmed with a calendar invite. Ongoing coaching plans are on the way; jump in with a first session now. 7-day money-back guarantee.</p>

  <h2>How a session works</h2>
  <p class="sub">Before we meet, the AI has already processed your clips: what killed you, where, and the pattern across rounds. In the session we watch the moments that matter, fix ONE thing properly, and build the plan for your next queue — with the same strat library and live-coach data RECON6 subscribers use. After the session you get the write-up: the leak, the fix, the drill.</p>

  <h2>Questions</h2>
${faqHtml}

  <h2 id="book">Book your first session — $20</h2>
  <p class="sub" style="margin-bottom:8px">First session is <strong style="color:var(--cyan)">50% off — just $20</strong>. Pick a time, pay, and you're booked instantly with a calendar invite.</p>
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
      <select id="c-type" name="type">
        ${TIERS.map((t) => `<option value="${t.type}">${t.name} — ${t.price}</option>`).join('')}
      </select>
      <label for="c-notes">What's costing you rounds? (optional)</label>
      <textarea id="c-notes" name="notes" rows="3" placeholder="e.g. I keep dying first on attack"></textarea>
      <button type="submit" id="confirmBtn">Continue to payment →</button>
      <div class="ok" id="confirmOk"></div>
      <div id="confirmErr" style="color:#ff6b6b;margin-top:12px;display:none"></div>
    </form>
  </div>
  <form id="bookForm" action="${FORM_ENDPOINT}" method="POST" style="display:none">
    <input type="hidden" name="_subject" value="COACHING BOOKING — session request" />
    <input type="hidden" name="form" value="coaching-booking" />
    <label for="f-email">Email *</label>
    <input id="f-email" name="email" type="email" required placeholder="you@example.com" />
    <label for="f-discord">Discord (fastest way to schedule)</label>
    <input id="f-discord" name="discord" type="text" placeholder="yourname" />
    <label for="f-rank">Current rank → goal</label>
    <input id="f-rank" name="rank_goal" type="text" placeholder="Silver → Gold" />
    <label for="f-tier">Which session</label>
    <select id="f-tier" name="tier">
      ${TIERS.map((t) => `<option>${t.name} — ${t.price} ${t.unit}</option>`).join('')}
    </select>
    <label for="f-notes">What's costing you rounds? (optional)</label>
    <textarea id="f-notes" name="notes" rows="3" placeholder="e.g. I keep dying first on attack"></textarea>
    <button type="submit">Request a session</button>
    <div class="ok" id="okMsg">Got it — you'll hear back within a day to set up your session. Check your email.</div>
  </form>
  <p style="color:var(--dim);font-size:.9rem;margin-top:10px">Prefer Discord? <a href="https://discord.gg/namGQqs3jb" target="_blank" rel="noopener">Join the server</a> and post in #coaching.</p>

  <footer><a href="/">RECON6</a> · <a href="/#/strats">Strats</a> · <a href="/#/vod">AI VOD review</a> · <a href="/blog/">Blog</a> · <a href="/countdown/">Next season</a></footer>
</div>
<script>
(function () {
  var cur = document.getElementById('cur'), goal = document.getElementById('goal'), reco = document.getElementById('reco');
  function update() {
    // Option values are the global rank order (1..40). Goal must sit above
    // current rank. Everything funnels to the $20 first session.
    var c = parseInt(cur.value, 10), g = parseInt(goal.value, 10);
    if (g <= c) {
      reco.innerHTML = '<strong style="color:var(--orange)">Pick a goal above your current rank.</strong> Even one division up is a real target — that is exactly what a session fixes.';
      return;
    }
    var gap = g - c;
    var span = gap <= 5 ? 'a division or two' : 'a multi-rank climb';
    reco.innerHTML = 'That is <strong>' + span + '</strong> — exactly what coaching targets. <a href="#book">Start with your first session — 50% off ($20)</a>.';
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
    var errEl = document.getElementById('confirmErr');
    errEl.style.display = 'none';
    // Create a Stripe Checkout Session for the chosen type, then redirect. The
    // slot stays held during checkout; payment confirms it (webhook + success
    // page). A pre-paid package credit confirms directly with no redirect.
    fetch(API + '/booking/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slotId: held.slotId, holdToken: held.token, tz: tz,
        name: val('c-name'), email: val('c-email'), discord: val('c-discord'),
        rank_goal: val('c-rank'), type: val('c-type'), notes: val('c-notes'),
        referral_source: getRef(),
      }),
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (res.ok && res.d.checkoutUrl) { window.location.href = res.d.checkoutUrl; return; }
        if (res.ok && res.d.booked) {
          if (holdTimer) clearInterval(holdTimer);
          document.getElementById('holdBar').style.display = 'none';
          var ok = document.getElementById('confirmOk'); ok.style.display = 'block';
          ok.textContent = res.d.viaCredit
            ? 'Booked with a package credit (' + res.d.creditsLeft + ' left). Calendar invite is in your email.'
            : 'Booked. Confirmation + calendar invite are in your email.';
          return;
        }
        // Returning player (already used the intro) — ongoing coaching plans
        // aren't live yet, so point them to Discord to book directly.
        if (res.d && res.d.code === 'not_first_session') {
          errEl.innerHTML = 'Looks like you\\'ve already had your intro. Ongoing coaching plans are launching shortly — <a href="https://discord.gg/namGQqs3jb" target="_blank" rel="noopener">grab a session on Discord</a> in the meantime.';
        } else {
          errEl.textContent = (res.d && res.d.error) || 'Something broke — try another slot.';
        }
        errEl.style.display = 'block';
        document.getElementById('confirmBtn').disabled = false;
      })
      .catch(function () {
        errEl.style.display = 'block';
        errEl.textContent = 'Network hiccup — your hold is still active, try again.';
        document.getElementById('confirmBtn').disabled = false;
      });
  });

  loadSlots();

  // Tier card CTAs pre-select the matching session type in the booking form.
  document.querySelectorAll('a[data-type]').forEach(function (a) {
    a.addEventListener('click', function () {
      var sel = document.getElementById('c-type');
      if (!sel) return;
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === a.dataset.type) { sel.selectedIndex = i; break; }
      }
    });
  });
})();
</script>
</body>
</html>
`

// Post-checkout success page. Stripe redirects here with ?session_id=…; we
// call /booking/finalize (idempotent with the webhook) to confirm the slot and
// show the booked state. If finalize is slow (webhook races), we retry briefly.
const bookedHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>You're booked — RECON6 Coaching</title>
<meta name="robots" content="noindex" />
<link rel="canonical" href="${SITE}/coaching/booked/" />
<style>
  body { background:#0a0e17; color:#dbe4f0; font-family:'Segoe UI',system-ui,sans-serif; line-height:1.65; margin:0; }
  .wrap { max-width:620px; margin:0 auto; padding:64px 20px; text-align:center; }
  a { color:#00e5ff; }
  h1 { font-size:2rem; margin-bottom:10px; }
  .card { background:#111827; border:1px solid #1f2a3f; border-radius:14px; padding:28px; margin-top:20px; text-align:left; }
  .btn { display:inline-block; padding:12px 22px; border-radius:10px; background:#00e5ff; color:#04222a; text-decoration:none; font-weight:700; margin-top:18px; }
  .muted { color:#8b98ab; }
  .spinner { color:#ff9b5c; }
</style>
</head>
<body>
<div class="wrap">
  <div id="state"><h1 class="spinner">Confirming your payment…</h1><p class="muted">One moment — locking in your session.</p></div>
  <div class="card">
    <p><strong>What's next:</strong></p>
    <ul>
      <li>A confirmation email with a calendar invite (.ics) is on its way.</li>
      <li>Sessions run on Discord — join <a href="https://discord.gg/namGQqs3jb" target="_blank" rel="noopener">the server</a> and you'll get a DM before your session.</li>
      <li>Bring 2-3 clips or screenshots of rounds you lost — that's the raw material.</li>
    </ul>
    <a class="btn" href="/coaching/">Back to coaching</a>
  </div>
</div>
<script>
(function () {
  var API = 'https://u0k402df6j.execute-api.us-east-1.amazonaws.com/prod';
  var sid = new URLSearchParams(location.search).get('session_id');
  var el = document.getElementById('state');
  if (!sid) { el.innerHTML = '<h1>Thanks!</h1><p class="muted">If you just paid, your confirmation email is on its way.</p>'; return; }
  var tries = 0;
  function finalize() {
    tries++;
    fetch(API + '/booking/finalize', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId: sid }) })
      .then(function (r) { return r.json().then(function (d) { return { ok:r.ok, status:r.status, d:d }; }); })
      .then(function (res) {
        if (res.ok && res.d.booked) { el.innerHTML = '<h1 style="color:#7ee2a4">You\\'re booked! ✓</h1><p class="muted">Payment received and your session is confirmed.</p>'; return; }
        if (res.status === 402 && tries < 6) { setTimeout(finalize, 1500); return; } // payment still settling
        el.innerHTML = '<h1 style="color:#7ee2a4">Payment received ✓</h1><p class="muted">Your session is being confirmed — the email will follow shortly.</p>';
      })
      .catch(function () { if (tries < 6) setTimeout(finalize, 1500); else el.innerHTML = '<h1 style="color:#7ee2a4">Payment received ✓</h1><p class="muted">Confirmation email is on its way.</p>'; });
  }
  finalize();
})();
</script>
</body>
</html>
`

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(join(OUT_DIR, 'index.html'), html)
mkdirSync(join(OUT_DIR, 'booked'), { recursive: true })
writeFileSync(join(OUT_DIR, 'booked', 'index.html'), bookedHtml)
console.log('✓ Generated public/coaching/index.html + booked/ (' + TIERS.length + ' paid tiers, ' + FAQ.length + ' FAQ items, Service + FAQPage schema)')
