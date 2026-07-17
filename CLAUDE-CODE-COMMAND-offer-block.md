# Build command — the canonical $20 offer block + site-wide consistency sweep

**Defined by Aaron 2026-07-17.** Until now the coaching had a *price* ($20/$40/$140) but no
defined *deliverable* — you can't sell, or write "what's included" for, an unspecified thing.
This is the specification. **Rides the supervised migration push — no standalone deploy.**

## THE CANONICAL DESCRIPTION (use this text verbatim, everywhere)

> ### $20 — Your first Recon 6 session
> *(50% off the $40 single session)*
>
> **What you get:**
> - **1 hour, live.** Screen share with Aaron — we go through your gameplay together, in real time.
> - **Bring it however you want.** Send a VOD or clips ahead of time, or just hop on and
>   screen-share live. Either works.
> - **A written breakdown within 48 hours.** What went wrong, why it went wrong, and what to
>   change. In writing, so you can refer back to it.
> - **Personalized drills.** Specific things to work on in your next matches — not generic advice.
>
> **What it isn't:**
> - **Not boosting.** I don't play for you.
> - **No rank guarantee.** I'll tell you the truth about what's holding you back. The reps are yours.
>
> **After the first:** $40 per session, or $140 for a 4-pack.

## THE CONSISTENCY RULE (this is the point of the command)
Every price and offer claim on the site must match the block above **exactly**. Sweep for and fix:
- Any remaining **"free session"** language anywhere (copy, buttons, nav, meta, OG tags, guides,
  emails, the countdown page). The only known one was `LandingPage.jsx:499`, already fixed in the
  working tree — **re-grep the whole repo** (`free session|free coaching|first session free`),
  ignoring code comments, and confirm zero visible instances.
- Any price that isn't **$20 intro / $40 single / $140 4-pack**.
- Any implied deliverable that contradicts the block (e.g. "instant", "unlimited", a rank promise).
- **No invented metrics.** Do not add "X% improvement" style numbers — nothing is calculated or
  validated, so it would be fabrication.

## Placement
- A dedicated offer block on the landing page, directly reachable from the primary CTA.
- The primary CTA everywhere: **"Book your first session — 50% off ($20)"**.
- Reuse the same block on `/coaching` (or wherever booking lives) — same words, same price.

## Guardrails
- `.\deploy.ps1` only — **never** `sam deploy`.
- Don't touch Cognito; verify login after.
- Commit after; report what deployed and what was held.

## Answered by Aaron 2026-07-17 — the offer is fully specified, nothing open
1. **What the player brings:** EITHER — send a VOD/clips ahead, or just screen-share live. Both
   accepted. ("How it works" step 1 should say exactly that: *"Send a VOD or clips — or just hop on
   and screen-share. Either works."*)
2. **"What it isn't" list:** confirmed as **no boosting** + **no rank guarantee**. Aaron did NOT
   confirm a "no account access" line, so it is deliberately OMITTED — do not add it back without him.
3. **Booking lead time:** no copy claim needed. Booking is calendar-based (`recon6-availability` →
   `recon6-bookings`), so the customer picks a real, visible slot at checkout — the calendar IS the
   expectation. Do NOT hardcode a "within X days" promise that the calendar could contradict.
   (Operational note for Aaron, not copy: keep real availability open, or the offer stalls.)
