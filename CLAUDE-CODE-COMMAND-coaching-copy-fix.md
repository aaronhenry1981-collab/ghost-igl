# Claude Code Command — Coaching continuation-pricing copy fix (RECON6, 2026-07-17)

**Decision (Aaron, via strategist): Model A — the model already built. The à-la-carte $140 4-pack is dead.**

There's a copy-vs-backend drift: the finalized $20 offer block (and the committed `paid booking UI + copy — $20/$40/$140`) advertises a **$140 4-pack** and omits the **$70/mo add-on**. But `src/config/stripe.js` and `CLAUDE-CODE-COMMAND-paid-coaching.md` (canonical) both define the real model as **$20 intro / $40 single / $70/mo add-on (2 credits/mo) / $99 Academy**, with `COACHING_AMOUNTS = { intro: 20, single: 40, addon: 70, academy: 99 }` — no 140. So the copy promises a package the backend doesn't sell. Fix the copy to match the built model everywhere.

**Bundling:** rides the supervised BrowserRouter migration push. No standalone `deploy.ps1`.
**Rules:** `ghost-igl`; lint 0; never `sam deploy`; don't touch Cognito; one agent on the repo; never paste secrets.

---

## 1. The canonical continuation model (source of truth)
- **$20** — first session, one-time, first-timers only (50% off the $40 single).
- **$40** — a single session after the first.
- **$70/mo** — the add-on: 2 session credits/month, reset monthly, no rollover. The "keep going" option.
- **$99 "Academy"** — marketing label for Champion + the $70 add-on together. Not a separate SKU.
- **No $140. No "4-pack." No "package."** Remove every occurrence in coaching copy.

## 2. Corrected offer block (use verbatim)

> ## $20 — Your first Recon 6 session
> *(50% off the $40 single)*
>
> **What you get:**
> - **1 hour, live.** Screen share with Aaron — we go through your gameplay together, in real time.
> - **Bring it however you want.** Send a VOD or clips ahead, or just hop on and screen-share live. Either works.
> - **A written breakdown within 48 hours.** What went wrong, why, and what to change — in writing, so you can refer back.
> - **Personalized drills.** Specific things to work on in your next matches.
>
> **What it isn't:**
> - **Not boosting.** I don't play for you.
> - **No rank guarantee.** I'll tell you the truth about what's holding you back. The reps are yours.
>
> **After the first:** $40 a single session, or **$70/mo for 2 sessions a month** if you want ongoing reps. (Champion members get both in the $99 Academy bundle.)

## 3. Reconcile everywhere — copy must equal config must equal backend
- Update the coaching page / booking UI so the continuation shown is **$40 single / $70-mo add-on / $99 Academy** — never $140 / 4-pack.
- Confirm the checkout flows that exist match the copy: intro ($20 one-time), single ($40 one-time), add-on ($70/mo recurring → grants 2 credits). If the UI still wires a $140 package price, remove it.
- Leave `stripe.js` as the source of truth; make the rendered copy read from / agree with `COACHING_AMOUNTS`.

## 4. Verify
- `grep -rniE "140|4-pack|4 pack|package" src` returns **zero** coaching-pricing references (ignore CSS/px/z-index).
- Coaching page shows $20 / $40 / $70-mo / $99, matching `COACHING_AMOUNTS`.
- Each visible price maps to a real, working checkout (no button that promises a price with no flow behind it).
- Lint 0. No standalone deploy — rides the migration push. Existing login works.

## Definition of done
Coaching copy, `stripe.js`, and the live checkout flows all state the identical model ($20 / $40 / $70-mo / $99); zero "$140 / 4-pack" left anywhere; every shown price has a working flow. Ships inside the migration deploy.
