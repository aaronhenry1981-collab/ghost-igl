# Claude Code Command — Paid Coaching (CANONICAL pricing, reconciled 2026-07-12)

Turn coaching into revenue. **This file supersedes any other coaching-pricing spec** (the à-la-carte $40/$140 version and any standalone $70 add-on spec). One model, below.

Repo: `ghost-igl` + AWS (`us-east-1`) + Stripe (shared live account).

**Rules:** lint 0; `.\deploy.ps1`; **never `sam deploy`** (per-function zips + `update-function-configuration` only); don't touch Cognito; verify existing login works; all AWS; never paste secrets. **Name every new Stripe object `RECON6 Coaching —…`** so it's never confused with Iron Front Digital; don't modify/delete anything you didn't create.

---

## THE MODEL (source of truth)
- **Intro session — $20, one-time.** First-timers only, enforced server-side. The low-friction front door.
- **Coaching add-on — $70/month, recurring.** Grants **2 live session credits per month**; credits expire monthly, no rollover. Tacks onto ANY plan (or stands alone). **No trial, one price** — deliberately no founding/date machinery (that's what caused the $39 mispricing fire).
- **"Academy" = Champion + Coaching add-on = $99/mo.** Marketing label for the bundle — NOT a separate Stripe SKU. It's simply the Champion subscription + the $70 add-on subscription running together.

## 1. Stripe — create two prices under one product "RECON6 Coaching"
- `RECON6 Coaching — Intro Session` = **$20.00 one-time** (Checkout `mode: 'payment'`).
- `RECON6 Coaching — Add-on` = **$70.00/month recurring** (Checkout `mode: 'subscription'`).
Capture IDs into `src/config/stripe.js`: `COACHING_INTRO_PRICE_ID`, `COACHING_ADDON_PRICE_ID`. The add-on subscription can coexist with a Pro/Champion plan subscription — they're independent line items.

## 2. Credits — the add-on feeds the booking system
The booking-calendar command already has a `coaching_credits` concept (keyed by email/Cognito). Wire the add-on to it:
- On the add-on's `checkout.session.completed` and each monthly `invoice.paid` (renewal): **set** the customer's `coaching_credits` to **2** for that month (set, don't increment — no rollover; expire/reset monthly).
- Booking a session with credits available **decrements** the balance and **skips checkout**.
- At 0 credits, a member either waits for the monthly reset or books a one-off (intro if first-timer, else prompt to add the add-on).

## 3. Intro session — $20, first-timers only
- `POST /booking` with `type: 'intro'` → check `recon6-bookings` for any prior `confirmed` coaching session for that email. None → allow the $20 intro Checkout (`mode: payment`). One or more → reject ("intro rate is first-session only"), and offer the add-on ($70/mo, 2 sessions) as the path forward.
- Server decides first-timer status from the bookings table — never trust the client.

## 4. Booking flow (pairs with the booking-calendar command)
- Paid intro → Stripe Checkout (payment) → on `completed`, flip the held slot to confirmed, send confirmation + `.ics`.
- Add-on member with credits → book directly, decrement a credit, no checkout.
- Soft-hold the slot (`held` + TTL) during any checkout so no double-book.

## 5. Comp path
Admin (Cognito-gated) can mark a booking `comped` → $0 confirmed booking, no checkout, no credit consumed. For hand-out passes (Aaron already promised one).

## 6. Webhook — recognize coaching events
The webhook Lambda must handle: intro one-time `checkout.session.completed` (confirm the booking via `slotId` metadata); add-on `checkout.session.completed` + `invoice.paid` (set credits to 2); add-on `customer.subscription.deleted` (stop granting credits). Keep the existing plan-subscription handling untouched — add a separate coaching branch.

## 7. Site copy — match the model exactly
- `/coaching`: lead with **"First session $20"**, then **"$70/mo for 2 sessions"** for ongoing, and the **$99 Academy** bundle (Champion + coaching). Kill every remaining "free session" and any $40/$140 à-la-carte line — copy must match checkout (the exact mismatch class that caused the $39 fire).
- Hero CTA → "Book your first session — $20".

## Verify
- New email books intro → $20 Checkout → pay (test) → slot confirmed, `.ics` sent.
- Same email tries intro again → rejected, offered the add-on.
- Buy the add-on → credits = 2 → book two sessions with no checkout → third booking prompts (out of credits).
- Simulate a monthly renewal (`invoice.paid`) → credits reset to 2 (not 4 — no rollover).
- Cancel the add-on → credits stop granting next cycle.
- Comp path → $0 confirmed booking.
- No "free session" or $40/$140 copy remains anywhere; `/coaching` shows $20 / $70-mo / $99 Academy.
- Lint 0, `.\deploy.ps1`, no `sam deploy`, Cognito untouched, existing login works, webhook plan handling still works.

**The test:** a stranger books a $20 intro and pays; a returning player subscribes to the $70 add-on and books two sessions on credits; a Champion sees the $99 Academy upsell. All three flows take real money end to end and match the on-screen price.
