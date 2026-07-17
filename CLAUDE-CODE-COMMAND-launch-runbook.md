# Claude Code Command — Launch Runbook: "ready for traffic" gate (RECON6, 2026-07-17)

The single checklist that separates **written correctly** from **ready for traffic**. Run this AFTER the supervised migration deploy, BEFORE pointing any paid or high-intent traffic at the site. Nothing here is assumed-good because "the backend does it" — each line is a test that must actually pass **in production**.

**Rules:** `ghost-igl` + AWS + Stripe (live); never `sam deploy`; never mix test/live Stripe IDs; never paste secrets.

## Evidence & sign-off (applies to every gate)
- A gate is **not** green because someone says the test passed. Each test records: **device, browser, production URL, Stripe mode (test/live), timestamp, tester, and evidence** (screenshot and/or Stripe event ID / analytics event ID).
- Any failed test gets an **owner** and a **retest result** logged.
- **Traffic stays closed until all FIVE gates pass in the production environment.** A failed production test is a launch blocker, not a note to fix later.

---

## GATE 1 — Production copy/price reconciliation
- `grep` the built `dist/` (before S3 sync) and the live HTML after: **zero** occurrences of `$140`, `4-pack`, `4 pack`, "first session is free", "session is free".
- Hero, pricing table, coaching page, `<title>`, meta description, OG tags + generated OG images, and JSON-LD all show current prices ($20 / $40 / $70-mo / $99; founding $9/$29).
- "Meet the Coach" and the labeled Example Analysis render on production.
- Footer reads the corrected tagline; the rank line is the softened non-results wording.
- No old/cached page or component exposes deprecated pricing.

## GATE 2 — Subscription / credit entitlement (Stripe test mode → then a live smoke test)
- Two credits created after each successful **$70 renewal** (`invoice.paid`).
- Credits **reset to 2** on the real Stripe billing date — do **not** accumulate to 4.
- **No credits** after a **failed** renewal.
- **Duplicate webhooks don't double credits** — fire the same event twice, credits stay at 2 (idempotent by event/invoice id).
- **Concurrency:** two rapid booking attempts against the **last remaining credit** do NOT both succeed — the credit is spent exactly once (no race-condition double-spend).
- Cancelling sets `cancel_at_period_end = true` — ends at period close, not immediately.
- A **cancelled-but-still-paid** customer can still book and consume remaining credits until cycle end.
- Refunded / disputed payment produces the intended entitlement change (access revoked per the suspension rule).
- The **$20 intro cannot be purchased twice** by the same account.
- An admin can apply the **one lifetime courtesy waiver** without corrupting billing records.

## GATE 3 — Real-device purchase journey (real hardware, not emulator)
Devices/browsers: **Safari on a real iPhone** AND **Chrome on a real Android.** Run the full journey on each:
1. TikTok link opens → 2. page loads correct → 3. price immediately clear → 4. CTA works → 5. real booking times appear → 6. keyboard/form fields behave → 7. Stripe checkout loads → 8. payment completes → 9. confirmation page shows → 10. confirmation email arrives → 11. calendar booking created → 12. Aaron gets notification + customer info → 13. customer knows what to submit and what's next.

Payment variations to cover: **a wallet payment** (Apple Pay / Google Pay where enabled), **a standard card**, and **a failed card**.
Adverse conditions: **slow/interrupted connectivity**, **refreshing the confirmation page**, **returning from Stripe with the browser back button**, **duplicate-click**, **abandoned checkout** — each behaves sanely (no double-charge, no phantom booking, no dead end).

## GATE 4 — Analytics funnel (events appear in the dashboard, not just the script in source)
Confirm each event records: landing visit → primary coaching CTA click → booking started → checkout started → **payment succeeded** → payment failed/abandoned (where measurable) → intro session booked → subscription started → Discord/email conversion. Each TikTok series uses its own tagged URL so content maps to revenue. (Tagged-link attribution from TikTok only works once the bio link is clickable — 1k followers or Business account; until then lean on TikTok analytics + a "how'd you hear?" prompt.)

## GATE 5 — Post-purchase fulfillment
- The purchased session / subscription **entitlement is recorded correctly**.
- The booked appointment time **becomes unavailable to other customers**, and **unrelated availability remains bookable** (no over-booking, no accidental calendar-wide lockout).
- Confirmation email contains the **correct price** and clear next steps (what to submit, when the session is, how the written breakdown arrives).
- Aaron receives the booking + the customer's context.
- Operational: keep real availability open on the calendar — an empty calendar behind a "book now" button is a refund.

## Definition of done — the FIVE gates (all must be green, in production)
1. **Production & pricing reconciliation.**
2. **Subscription-credit & webhook/concurrency behavior.**
3. **Real-device purchase journey.**
4. **Analytics event verification.**
5. **Post-purchase fulfillment.**

All five green, with recorded evidence = ready for traffic. Any red = not yet, regardless of how good the staged copy looks. A failed production test blocks launch.
