# Claude Code Command — $70/mo coaching add-on: subscription rules (RECON6, 2026-07-17, FINAL)

Pricing settled (Model A). This locks the **entitlement rules** and the **customer-facing terms**, and hands the verification to the launch runbook (`CLAUDE-CODE-COMMAND-launch-runbook.md`). Rides the migration push; no standalone deploy.

**Rules:** `ghost-igl`; lint 0; never `sam deploy`; one agent; never paste secrets.

---

## Locked entitlement rules (code + Stripe + DB + copy must all match these)
1. **Entitlement:** $70/billing cycle grants **2 session credits.**
2. **Reset cadence:** credits set to **2 on each `invoice.paid`** (the Stripe billing anniversary), not calendar month. Set, don't increment.
3. **No rollover:** unused credits expire at the end of the billing cycle.
4. **Booking:** credits booked **individually** through the cycle; customer need not schedule both at once.
5. **Rescheduling:** allowed with **24+ hours** notice, no credit lost.
6. **No-show / late cancel (<24h):** normally **consumes one credit.** **Each customer gets ONE lifetime courtesy waiver.** Attendance rule: **no contact 15 minutes past start = no-show.**
7. **Cancellation (updated — Stripe `cancel_at_period_end`):** cancelling stops the **next** renewal but does **not** end the current paid period. The customer keeps access and may **schedule and use** remaining credits until the cycle ends; unused credits expire at cycle end. Do **not** disable booking at the moment of cancel.
8. **Immediate suspension exception:** access may be cut immediately for payment disputes, fraud, chargebacks, abuse, harassment, or material ToS violations.
9. **Intro:** the **$20 intro is once per customer, ever**, enforced server-side from the bookings table. After that: $40/single or $70/cycle for two.

## Customer-facing membership terms — display BEFORE checkout (verbatim)
> **Coaching Membership — $70 per billing cycle**
> Includes **2 coaching-session credits**, issued on your billing date. Credits don't roll over and expire at the end of each cycle.
>
> **Rescheduling:** reschedule any session with at least 24 hours' notice. A cancellation under 24 hours, or a no-show, uses one credit — every account gets one courtesy late-cancel waiver. No contact 15 minutes after the start time counts as a no-show.
>
> **Cancelling:** cancel anytime before your next renewal. Cancelling stops future charges but keeps your membership active through the period you've already paid for — you can still book and use your remaining credits until it ends. Unused credits expire when the cycle ends.
>
> **Intro session:** the $20 first session is available once per customer. After that, coaching is $40 per session or $70 per cycle for two.

This block must render on the add-on purchase surface **before** payment (clear, conspicuous, affirmative consent) — it's how recurring-billing disclosure is meant to work, and in several US states it's required. **Have the final terms reviewed for the jurisdictions you sell in — this is operational guidance, not legal advice.**

## Consistency requirement
Code, Stripe config, DB entitlements, the displayed terms above, the confirmation email, and the Stripe customer portal must all express this identical policy. Verification lives in the launch runbook — the rules are not "done" until those tests pass.

## Definition of done
Rules implemented as written, terms shown pre-purchase, same policy everywhere the customer or support can see it, and every acceptance test in the launch runbook green.
