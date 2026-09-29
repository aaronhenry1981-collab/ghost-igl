# Help Center review — 2026-09-28

The 11 articles in `lambda/customer-success/support/help/articles.mjs` were fact-checked claim by claim against the production release line. The articles had been drafted against `main`, which differs from production. Each is now `status: 'reviewed'` and served by the public Help API. Statements that are business or legal policy, not product behaviour, were left out and are listed at the end.

## What changed, by article

| Article | Corrections |
|---|---|
| Connect your gaming account | Display name is required too; there is no "Connect tracker": the Progress page reads a rank/stats **screenshot** you confirm. Recon does not pull stats; password/token refusal is the player-data service |
| Upload a VOD for AI review | Elite/Champion allow 10 screenshots; allowance is per **30-day period from your first review**, not monthly; a review that fails after the AI starts **still counts**; real error wording (rate-limited, paused, could not be reserved) |
| Can I upload match replays? | Logged as a replay request, not a feature request; VOD review needs Pro+ |
| Why your rank or stats look different | Recon does **not** use Tracker Network; home rank is the last rank you saved; confirmed screenshots expire after 24 hours; Recon keeps the latest value, not a dated history of rank |
| How Recon keeps your history | Selection order stated as the code does it (last 24 hours, then trusted source, then recency); staff can see your history; export/delete points to the published Privacy page (privacy@r6coaching.com) |
| Your plan and what it unlocks | Basic = Bank and Coastline; Pro includes the desktop app; access returns when a **payment goes through**, not when a card is saved |
| Coaching credits | **The coaching page does not apply Champion credits** (it sends no sign-in token, so every booking goes to card checkout): Champions are told not to pay by card and to use Support. Moving a session uses the reschedule link. Session length/notice defaults not quoted (admin-configurable) |
| Billing, payments and cancelling | During a failed payment the Account page showed "See plans", not "Manage billing"; the article points to "Update payment method" (and the Account page now shows it, see below) |
| Get better results from AI VOD review | Operator context is the role, not the kit; non-Siege rejection happens only when none of the images look like Siege, and still counts |
| The desktop app | Activation tokens expire after 30 days or at period end |
| Sign-in and password help | "Forgot password?" label; 12-character minimum; signed-out players email support (a case needs sign-in) |

All articles say "open a case from Support" (the account-menu label), not "Get Help".

## Held for a decision (not published)

1. **Billing-portal capabilities.** Whether players can cancel, update the card and see invoices in the portal is set in the Stripe Dashboard, not in code. The article only says "Manage billing opens Stripe's secure billing portal". Confirm the portal settings, then add the capabilities.
2. **Data export and deletion (resolved 2026-09-28).** An operator tool now handles export and deletion (`lambda/customer-success/tools/privacy-request.mjs`, runbook in `docs/PRIVACY-REQUESTS.md`). The Privacy page's contact was `privacy@r6coaching.com`, which never received mail; it now points to support@. The article points there too.
3. **AI-review retention.** The VOD Lambda writes the full analysis to a `recon6-review-archive` table, with a hashed email and no images and no expiry. The Privacy page doesn't disclose this, and it still mentions video uploads. The article says only what the player can see (a short summary; the full report can't be reopened). Decide retention and update the Privacy page (audit P0-10).
4. **How Champions redeem included sessions.** The article tells Champions to use Support instead of paying by card. The actual redemption process (manual booking, self-serve token booking, or something else) is audit P0-3.

## Product issues found by the review

- **Fixed in this release:**
  - The Account page showed **"See plans"** to past-due members, which could start a second, duplicate checkout. It now shows **"Update payment method"**, which opens the billing portal. The portal endpoint already serves past-due rows.
  - The Account page said VOD caps reset "from your billing period start". They reset 30 days from the first review in each period.
  - The Account page labelled trialing and past-due periods "Ended". It now says "Renews", "Paid through" or "Ended".
- **Not fixed:**
  - Profile setup saves the platform as `pc/xbox/ps5`, while the Account dropdown uses `PC/Xbox/PlayStation`, so a saved `ps5` doesn't preselect.
  - `lambda/customer-success/domain/home.mjs` says "analyses are not stored server-side", which contradicts the review archive above.
  - Coaching credits are keyed to the email on the Stripe customer, which can differ from the Recon sign-in email.
