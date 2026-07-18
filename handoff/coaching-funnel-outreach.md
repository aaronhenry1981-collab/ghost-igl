# Coaching funnel — outreach drafts ($20 intro)

**Status:** DRAFTS for Aaron's review. Nothing here has been sent or posted.
**Generated:** 2026-07-18

## Why this file exists (the honest funnel audit)

The machinery is done. Traced end-to-end today:

| Layer | State |
|---|---|
| Stripe key + live coaching prices ($20 / $40 / $70mo) | ✅ done |
| `/coaching` page: scheduler, checkout, SEO schema, FAQ | ✅ done |
| On-site surfacing (navbar `$20` button + coaching-first hero) | ✅ done |
| `?ref` attribution — capture (React + coaching page) → Lambda persists `referral_source` | ✅ **already built** (walk back the "attribution gap" — it's real and working) |
| **Outreach that asks the warm audience to book the $20 intro** | ❌ **missing — this is the gap** |

Every template in `src/data/promoTemplates.js` drives to FREE content (guides/meta) — value-first, correct for cold Reddit/YouTube. But nothing converts the warm channels toward the paid intro. These drafts fill that.

## Attribution: use the `?ref` tags — they're the whole point of the plumbing

Every link below carries `?ref=<channel>`. The coaching page's `captureRef()` stores it (localStorage `recon:src`, first-touch), the booking widget sends it on `/booking/checkout`, and the Lambda writes `referral_source` on the booking row. So after this goes out you can actually answer "which channel converted" from the bookings table. **Don't strip the `?ref=` when posting.**

Canonical link shape: `https://r6coaching.com/coaching/?ref=<channel>#book`

---

## 1. Discord — server announcement (warmest, highest intent)

**Channel:** your own server (#announcements or #coaching). Emojis OK here.
**Link:** `https://r6coaching.com/coaching/?ref=discord#book`

> **1-on-1 coaching is open — first session is $20. 🎯**
>
> Not boosting. Nobody touches your account. You bring 2–3 clips of rounds you *lost*, the RECON6 AI staff breaks down what actually cost you those rounds (usually not what you think), and we fix ONE thing properly + build the plan for your next queue.
>
> - Full hour, on Discord — console (PS5 capture-card) or PC, any rank
> - First session **$20** (50% off the $40 single, first-timers only)
> - Pick a slot, pay, booked instantly with a calendar invite
> - 7-day money-back guarantee
>
> Grab a time → https://r6coaching.com/coaching/?ref=discord#book

---

## 2. Email — in-house CRM campaign (SES, no 3rd party)

**Mechanism:** wired into `lambda/crm/index.mjs` as an invoke-only campaign
(`{campaign:'coaching-intro'}`) — NOT the daily cron. Once-only per address
(`coaching_intro_sent_at` flag in `ghost-igl-crm-log`), honors `DRY_RUN`, and
best-effort excludes anyone who already booked a session. Voice = Aaron/RECON6,
plain text, no emojis (CRM convention). Link `?ref=email`. See run steps at the
bottom. **Nothing sends until you run the dry-run, review counts, and green-light.**

**Link:** `https://r6coaching.com/coaching/?ref=email#book`
**Subject options:**
- `The thing costing you the most rounds — let's find it ($20)`
- `Your first coaching session is $20`

> Subject: The thing costing you the most rounds — let's find it ($20)
>
> You've got the strat library. Here's the part it can't do for you: watch *your* rounds and tell you which mistake you're repeating five matches in a row.
>
> That's a coaching session. First one is **$20** — half the $40 single rate, first-timers only.
>
> How it works:
> - Bring 2–3 clips or screenshots of rounds you lost.
> - The AI processes them before we meet — what killed you, where, the pattern across rounds.
> - We watch the moments that matter, fix ONE thing properly, and you leave with a concrete plan for your next queue.
> - Console or PC. Any rank. On Discord. 7-day money-back guarantee.
>
> Pick a time → https://r6coaching.com/coaching/?ref=email#book
>
> — Aaron, RECON6

---

## 3. X / Twitter (short, no hashtags — R6 Twitter hates hashtag stacks)

**Link:** `https://r6coaching.com/coaching/?ref=twitter#book`

> Most players lose the same round five times before they see the pattern.
>
> Bring 2–3 clips of rounds you lost. The AI finds what actually cost you them. We fix one thing properly.
>
> First 1-on-1 session is $20. Console or PC, any rank.
>
> https://r6coaching.com/coaching/?ref=twitter#book

---

## 4. Reddit (r/Rainbow6) — community-safe framing, NOT a link drop

r/Rainbow6 removes overt promo and the offer link will get you flagged. Lead with free value; the coaching link goes in a comment reply if someone asks, NOT the post body. Draft for a *comment* when coaching naturally comes up:

> Been doing 1-on-1 VOD review sessions — the pattern I see most at Gold/Plat is people re-taking the same bad fight instead of playing the round state. If you want to try it the first session's $20 (r6coaching, half the normal rate) but honestly even just recording your own losses and rewatching for "why did I peek there" gets you 70% of the way. Happy to look at a clip if you post one.

---

## Running the in-house email campaign (gated)

Voice = Aaron/RECON6 (confirmed). Email = in-house SES via `ghost-igl-crm`.
The code is written and syntax-checked; **nothing has deployed or sent.**

**Step 1 — deploy the updated CRM Lambda** (only the crm function changed):
```powershell
cd lambda/crm
npm install --omit=dev
Compress-Archive -Path index.mjs,package.json,node_modules -DestinationPath function.zip -Force
aws lambda update-function-code --function-name ghost-igl-crm --zip-file fileb://function.zip --region us-east-1
```

**Step 2 — DRY RUN (sends NOTHING to customers; emails you a preview digest):**
```powershell
aws lambda invoke --function-name ghost-igl-crm --region us-east-1 `
  --payload '{"campaign":"coaching-intro","segment":"all","dryRun":true}' `
  --cli-binary-format raw-in-base64-out out.json
cat out.json   # WOULD-send count + skip breakdown; check the digest email too
```
Segments: `all` (every confirmed account), `free` (no active sub), `subscribers`
(active sub only). Add `"limit": 25` to cap a first wave.

**Step 3 — LIVE SEND, small batch first (only after you OK the dry-run numbers):**
```powershell
aws lambda invoke --function-name ghost-igl-crm --region us-east-1 `
  --payload '{"campaign":"coaching-intro","segment":"all","limit":25}' `
  --cli-binary-format raw-in-base64-out out.json
```
Re-invoke without `limit` to send the rest — once-only flags prevent re-emailing
anyone already sent. **I will not run Steps 1–3 without your explicit go.**

## Open questions / offers

1. **Segment** — default `all` (whole warm list). If you'd rather protect paying
   subs from the pitch, say `free` and I'll note it as the default.
2. **Reusable social posts** — I can add a coaching-conversion template set to
   `promoTemplates.js` so the generator produces booking posts (Discord/X), not
   just free-content posts. Say the word.
3. **SES prod** — sends assume SES production access is live (per prior session).
   If the account is still sandboxed, customer mail silently holds; the dry-run
   digest will still reach you, so we'll know before a real batch.
