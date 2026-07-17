# Claude Code Command — "Meet the Coach" section + testimonial honesty audit (RECON6, 2026-07-17)

Add a founder/coach trust section to the homepage, and fix a real FTC/honesty problem in the existing testimonials. Copy is final and verified below — **use it verbatim.**

**Bundling:** this ships **inside the supervised BrowserRouter migration push**, NOT as a standalone deploy. Do not fire `deploy.ps1` for this alone. Build it into the same tree as the migration and it goes live when that does.

**Rules:** `ghost-igl`; lint 0; never `sam deploy`; don't touch Cognito; one agent on the repo at a time; never paste secrets.

---

## Why this exists (context so nothing regresses)
Two claims got caught as fabrications tonight and must NOT reappear:
1. The coaching intro is **$20, not free** — no "first session free" anywhere (already fixed on `LandingPage.jsx:499`).
2. **JoCephis88 (Jackson) is a COMPED account — he has never paid.** Records: `comp = True`, no Stripe sub. The only Champion who ever paid was Austin (refunded + cancelled). So he **cannot** be labeled "Champion subscriber," "customer," or anything implying a purchase. His review is real and genuinely positive — keep it, but framed honestly.

---

## 1. New section — "Meet the Coach"
Placement: a dedicated section on the homepage between the "Recon6 vs the competition" block and the Pricing section (where a prospect is warming up but hasn't decided). Simple layout — heading + the copy, optionally a photo/avatar on the left, text on the right. No animation needed.

**Heading:** Meet the Coach

**Body copy (verbatim):**

> I've been coaching Siege for two years.
>
> I built Recon6 because there's too much trash out there that doesn't actually help anyone get better. Montage channels. "Top 5 operators" lists. Coaches who tell you what they'd do and leave you exactly where you started.
>
> That's not coaching. That's content.
>
> I don't just teach you how to do things — I teach you how to get better on your own. That's the whole difference. Anyone can tell you to hold an off-angle. I'll show you why you keep dying on the same one, and how to catch it yourself next round, without me.
>
> That's what Recon6 is: everything I'd tell you in a session, built into an AI that watches your screen live and calls the round as it happens — plus me, when you want a human to dig into your VOD with you.
>
> 713 hours. 2,696 matches. Every leak this thing calls out is one I've had myself. That's not a pitch — it's why it works.

**Numbers policy (deliberate):** feature hours (713) and matches (2,696) only. Do **not** print current rank (Silver I) or K/D (0.88) — not hidden (the tracker is public, and the founder testimonial already says Bronze→Silver), just not featured, because they're the one thing that gives a prospect a reason to leave. Keep it that way.

**Optional — only if Aaron supplies a real number:** the first line may become "I've been coaching Siege for two years — [N]+ sessions." Do NOT invent N. If Aaron hasn't given a real figure, ship the line as-is.

---

## 2. Corrected testimonial block (use directly under the section, and fix the existing one)
Render exactly this — no tier, no "subscriber," no purchase implication, with a clear FTC disclosure of the comp relationship:

> ★★★★★
> "The system is great — it gives great ideas and tells you exactly which ops the team needs. Great system all around."
> — JoCephis88 · early-access member (received complimentary access)

The "received complimentary access" disclosure is **required**, not optional — see §3.

---

## 3. FTC honesty audit — ALL displayed testimonials  ⚠️ do this, not just JoCephis88
US FTC endorsement rules (16 CFR Part 255) require disclosing a "material connection" — and a comped/free account is one. So:
- Query the profiles/testimonials store and check the `comp` / `comp_note` fields for **every testimonial currently rendered on the site** (JoCephis88, the "Splinter — creator / Bronze→Silver" one, and any others).
- For each testimonial from a **comped or free-access** account: keep the real quote, but (a) remove any label implying they paid/subscribed, and (b) add a clear, conspicuous disclosure on that review (e.g., "received complimentary access" / "early-access member").
- Testimonials from genuine **paying** customers can be shown normally (optionally labeled with real tier only if verified against Stripe).
- If in doubt on any single one, disclose — under-claiming is safe, over-claiming is the risk.
- Report back which testimonials were comped so Aaron knows the real state.

**Do not fabricate or upgrade any tier.** No "Champion," "Pro," or "subscriber" label unless it's verified against an actual paid Stripe subscription for that email.

---

## 4. Verify
- "Meet the Coach" renders between the competition block and pricing; copy matches verbatim; no rank/KD printed.
- JoCephis88 review shows with the complimentary-access disclosure and no purchase implication.
- Every other displayed testimonial audited; comped ones disclosed; no unverified tier labels remain anywhere.
- Lint 0. No standalone deploy — rides the migration push. Existing login still works.

## Definition of done
A truthful "Meet the Coach" section live (inside the migration deploy), every featured review either verified-paying or disclosed-as-comped, zero fabricated customer/tier claims on the page. Report the comp-status findings back to Aaron.
