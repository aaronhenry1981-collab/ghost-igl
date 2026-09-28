# Recon 6 growth, conversion and UX audit, September 25, 2026

**What this is:** an audit against `docs/GROWTH-UX-OPERATING-STANDARD.md`, done before any broad rebuild, as Aaron asked. It lists problems and recommendations only. Apart from the fixes already in open PRs (noted per finding), nothing here is implemented. It stops for Aaron and ChatGPT's review.

**Scope:**
- Public pages: the React app and the build-generated static pages.
- Signup and checkout.
- Onboarding.
- The admin console.
- Analytics and attribution.
- Mobile and performance.
- SEO and content generation.

**Method:**
- **Code inventory** of the production line `content/strat-beta-disclaimer` @ `8054871`.
- **Read-only checks of what is actually deployed:**
  - Lambda code and non-secret environment keys.
  - The Cognito password policy.
  - S3 listings.
  - The public testimonials API.
  - Live page behavior on r6coaching.com.
- **Official sources** for season facts.
- **Research:** the principles summarized in the standard, section 2.

No secrets were read or printed, and nothing in production was changed.

**Priority scale:**
- **P0:** revenue or truth. Money, legal terms, or public claims that are wrong today.
- **P1:** a conversion or usability problem.
- **P2:** optimization.
- **P3:** polish.

Each finding lists what is wrong, why it matters, the evidence, the recommended change, the metric it should move, and the implementation risk.

## Summary

**The top five:**
1. **Nobody can say what the product costs and includes with one voice.**
   - Trial terms contradict each other: the Terms page promises a 30-day trial, the home page says there is none, and the deployed checkout grants none (P0-1).
   - The free tier is described as "every strat" in several places while it is two maps (P0-8).
   - Several features are described as more automatic or more complete than they are (P0-9, P1-12).
2. **The deployed system doesn't match any branch.**
   - The subscription Lambda was deployed from uncommitted work.
   - The admin Lambda was deployed from `main`.
   - The live site was deployed from an uncommitted tree.
   - A routine deploy from the production branch would silently bring back a 30-day Pro trial (P0-2).
3. **Paying Champions can't redeem their included sessions self-serve** (P0-3).
4. **Every static page's canonical URL redirects to the home page** (`/blog/`, `/guides/`, `/tools/`, `/climb/`, `/countdown/`, `/coaching/`, `/status/`). The content is only reachable at `…/index.html` (P0-6).
5. **Measurement stops at the click.**
   - Campaign data never reaches the server.
   - Until PR #29 there was no paid-conversion event.
   - The admin cannot answer "which video produced customers?" (P1-6, P1-7).

**Already fixed in open PRs, awaiting review:**
- **Season surfaces:**
  - #27 fixes the Y11S3.1 values and the beginner-guide season panel.
  - #28 fixes `/countdown/` and the season badge, including the countdown page's "free tier covers the whole pool".
- **Signup and funnel (#29):**
  - The signup password rule now matches the live pool (P0-5).
  - Onboarding waits for the promised plan, for `/start` signups (P1-4, partly).
  - Paid returns are measured (P1-7, partly).

## Category index

| # | Category | Findings |
|---|---|---|
| 1 | Product-truth conflicts | P0-1, P0-3, P0-7, P0-8, P0-9, P0-10, P0-11, P0-12, P1-11, P1-12, P2-8 |
| 2 | Conversion leaks | P0-6, P1-1, P1-2, P1-3, P1-15 |
| 3 | Navigation and information architecture | P2-4, P2-5 |
| 4 | Signup and checkout friction | P0-5, P1-5 |
| 5 | Activation and onboarding | P1-4, P1-15 |
| 6 | Admin usability | P0-4, P1-8, P1-9, P1-10, P2-6, P3-3 (details and proposed structure in `admin-jobs-and-ia.md`) |
| 7 | Analytics and attribution | P1-6, P1-7, P2-7 |
| 8 | Mobile and performance | P2-3 |
| 9 | SEO and content-generation drift | P0-6, P0-7, P1-11, P2-1, P2-2 |
| — | Process | P0-2, P1-13, P1-14, P3-1, P3-2, P3-4 |

---

## P0: revenue and truth

### P0-1 · Trial terms contradict each other
- **Wrong:** Three different answers:
  - The Terms page says "Pro begins with a card-required 30-day trial"; the tools page and the changelog say the same.
  - The home page says "there is no free trial".
  - The deployed checkout grants no trial on any tier.
  - Locked maps carry a "TRIAL" badge, and 100 site guides mention "trial terms".
- **Why:** Billing terms that disagree are a chargeback and trust risk. The Terms page is the legal statement, and it is the one that's wrong. Honest price and terms up front are a core trust factor (standard, section 2).
- **Evidence:**
  - `src/pages/TermsPage.jsx:17`
  - `scripts/generate-tools-page.mjs:39` → `public/tools/index.html:19`
  - `src/data/changelog.js:43`
  - `src/pages/LandingPage.jsx:896`
  - `src/components/strats/MapSelector.jsx:139`
  - `scripts/generate-guides.mjs:295`, `src/components/SignInGate.jsx:60`, `src/pages/LoadoutsPage.jsx:237`
  - Deployed `membership-checkout.mjs`: `trialDays: 0` for all tiers (Lambda deployed 2026-09-24). Committed code says 30 for Pro; see P0-2.
- **Change:** Aaron decides the trial policy once. Record it in the registry (standard, section 3), then change the Terms page, tools generator, changelog, badge and guide copy to match. Add a build check that fails on trial wording that disagrees with the registry.
- **Metric:** checkout completion, refund and dispute rate.
- **Risk:** low for copy. The Terms change needs Aaron's legal sign-off.

### P0-2 · What is deployed doesn't match any committed branch
- **Wrong:**
  - The subscription Lambda deployed on 2026-09-24 contains uncommitted changes from the live checkout: `trialDays: 0`, extra profile fields, and regenerated protected content.
  - The admin Lambda (2026-09-17) is `main`'s 827-line version, not the production line's 684-line one.
  - The live home page headline ("Know the strat. Know your job. Win more rounds.") isn't in the production branch either.
- **Why:** A normal deploy from `content/strat-beta-disclaimer` would:
  - silently re-enable a 30-day Pro trial;
  - regress the admin's billing fields;
  - replace the live home page.
  Nobody can review what customers are running.
- **Evidence:**
  - Read-only download of the deployed code: `trialDays` lines, and admin field names present or absent.
  - `git status` in the live checkout (84 uncommitted entries, including `lambda/subscription/*`).
  - Home page on production vs `LandingPage.jsx` on the branch.
- **Change:**
  - Commit the live-checkout work.
  - Pick one deployable branch per surface (site and each Lambda).
  - Record the deployed commit (for example a `DEPLOYED_SHA` env value or tag).
  - Have `deploy.ps1` refuse to run from a dirty tree.
- **Metric:** none directly; this is risk removal.
- **Risk:** medium (git housekeeping on a busy tree). Do it before any other deploy.

### P0-3 · Champion's two monthly sessions can't be redeemed self-serve
- **Wrong:**
  - Champion ($70) promises two live 1:1 sessions a month.
  - The webhook grants credits, but the booking API only uses them when `/booking/checkout` receives a signed-in token. The booking page never sends one, so Champions are sent to the $20/$40 Stripe checkout.
  - The promised "one lifetime no-show waiver" has no logic anywhere.
- **Why:** A paying customer is asked to pay again for what the plan includes. It is the highest-price tier, and a refund or dispute is likely.
- **Evidence:**
  - `lambda/booking/index.mjs:692-700` and 744-781
  - `public/coaching/index.html:294-302` (no token sent)
  - `lambda/booking/coaching-credits.test.mjs:175`
  - `LandingPage.jsx:281, 285`
- **Change:** Send the Cognito token from the booking page when the visitor is signed in, and show the credit balance. Until then, say "book with Aaron on Discord" on the Champion card. Implement or remove the waiver claim.
- **Metric:** Champion retention, refunds, bookings per Champion.
- **Risk:** medium (payment path in the booking Lambda).

### P0-4 · Stripe reconciliation can overwrite customer access with no confirmation
- **Wrong:** "Reconcile memberships from Stripe" rewrites a full row for every Stripe subscription, cancelled ones included:
  - It can wipe `vod_lifetime_used` and `cognito_sub`.
  - An older cancelled subscription can overwrite a live row.
  - There is no confirmation and no audit entry, though the page says it won't cancel customers.
- **Why:** One click can revoke paid access or reset usage for the whole customer base.
- **Evidence:** `src/pages/AdminPage.jsx:617-619`; `lambda/admin/index.mjs:362-399`; `lambda/vod/index.mjs:733`; `lambda/webhook/index.mjs:425`.
- **Change:** Add a dry-run diff first. Preserve usage and identity fields, never let a cancelled row replace a live one, require confirmation, and write each change to the audit log.
- **Metric:** support incidents about lost access.
- **Risk:** medium; test against a copy of the table.

### P0-5 · The signup form contradicts the password policy (fixed in #29)
- **Wrong:** The form said "Min 8 characters, mix of letters and numbers" and accepted 8. The live pool requires 12 characters and no character-type rules. So 8–11 character passwords passed the form and were then rejected by Cognito.
- **Why:** Every signup that hits this fails at the last step, and TikTok traffic signs up on phones.
- **Evidence:** `src/pages/AuthPage.jsx:250-256` (before #29); Cognito `describe-user-pool` shows `MinimumLength: 12`.
- **Change:** Done in #29: the form states and enforces 12, with standard autofill hints.
- **Metric:** `Signup Completed` ÷ `Signup Started`.
- **Risk:** low.

### P0-6 · Static pages' canonical URLs redirect to the home page
- **Wrong:**
  - `https://r6coaching.com/blog/` ends on `https://r6coaching.com/`. So do `/guides/`, `/tools/`, `/climb/`, `/countdown/`, `/coaching/` and `/status/`.
  - Each returns HTTP 200 from CloudFront's error fallback with the React shell, whose catch-all route redirects to `/`. The real pages exist at `…/index.html`.
  - The directory-index CloudFront function in the repo (`aws/cloudfront-directory-index.js`) isn't attached.
- **Why:**
  - Every link, sitemap entry and canonical tag for these pages sends people and crawlers to the home page, so the SEO pages can't rank for their own content.
  - The coaching page is a sales page.
- **Evidence:**
  - `curl`: every one of these returns `X-Cache: Error from cloudfront` with the shell's title.
  - The browser check lands on `/`.
  - `src/main.jsx` catch-all route.
  - `aws/cloudfront-directory-index.js`.
- **Change:**
  - Attach a viewer-request function to distribution `E2WUR8DDHCOYC9` that maps `/x/` → `/x/index.html` (the repo already has one), then verify.
  - Consider real 404s for unknown routes instead of redirecting home.
- **Metric:** organic landing sessions on static pages, and coaching bookings.
- **Risk:** medium (production CloudFront change; needs Aaron's approval and a quick rollback plan).

### P0-7 · Expired founding prices still ship on generated pages
- **Wrong:**
  - 47 operator posts say "Founding rate $9/mo until May 31 — locked in for life."
  - Every generated blog post says "Founding rate $9/mo."
  - The founding window closed on August 31. The prune step's rewrite only matches "before May (8|31)", so these slip through.
- **Why:** It advertises a price new buyers can't get.
- **Evidence:** `scripts/generate-r6-operator-posts.mjs:869`; `scripts/generate-blog-posts.mjs:2444`; `scripts/prune-non-r6-output.mjs:48`; `src/config/founding.js:19`.
- **Change:** Generators read prices from `src/config/stripe.js` and founding state from `founding.js`. Add a build check for founding wording after the deadline, and regenerate the posts.
- **Metric:** pricing-related support questions; checkout drop-off at the price.
- **Risk:** low.

### P0-8 · The free tier is described as far bigger than it is
- **Wrong:** Free is Bank and Coastline. Other pages say otherwise:
  - WelcomeModal: "every strat, every callout, every operator".
  - VodPage: "Free accounts can browse every strat".
  - ExitIntentModal: "Full strat breakdowns for every R6 ranked site … No signup".
  - `index.html` and `manifest.json`: "Every map, every site, every callout — pre-loaded".
  - CreatorDemoPage: "Use the full strategy library…" next to "Start free".
  - Countdown: "free tier covers the whole pool" (fixed in #28).
- **Why:** Players who sign up for "everything free" meet a lock on 23 of 25 maps. That erodes trust at the exact moment we want them to upgrade.
- **Evidence:** `WelcomeModal.jsx:103`; `VodPage.jsx:347`; `ExitIntentModal.jsx:89-94`; `index.html:19,27`; `public/manifest.json`; `CreatorDemoPage.jsx:119-121`; gating in `StratsPage.jsx:118-126`.
- **Change:** Describe the free tier from one place (`src/config/planFacts.js`, introduced in #29) and replace these strings.
- **Metric:** signup-to-upgrade rate; complaints about paywalls.
- **Risk:** low.

### P0-9 · Capability claims beyond what ships
- **Wrong:**
  - **Live Coach:** described as "evidence-based calls while you play" or "detect match state"; the web Live Coach is a manual walkthrough.
  - **Desktop app:**
    - The Download page tags all six PC extras "Now" while it also says "Early access", "PC Beta" and "not code-signed".
    - `index.html`'s FAQ says no install is needed, while pricing sells the desktop app.
  - **Screenshots per review:** WelcomeModal says "Paste 1-10 screenshots"; Pro is capped at 5.
  - **Clips:** the coaching page says the AI "has already processed your clips"; there is no clip upload path.
- **Why:** An overstated capability found after paying is the same failure that caused the "AI slop" churn.
- **Evidence:** `Navbar.jsx:74`; `DashboardPage.jsx:296`; `LandingPage.jsx:203`; `LiveCoachPage.jsx:16-39`; `DownloadPage.jsx:25-32,139-143,160,193`; `index.html:127-130`; `WelcomeModal.jsx:126`; `lambda/vod/index.mjs:92`; `public/coaching/index.html:100`.
- **Change:** Add a capability registry (shipped / beta / planned) next to the plan facts, and rewrite the claims from it.
- **Metric:** refunds and churn within 7 days.
- **Risk:** low.

### P0-10 · The Privacy page doesn't describe what the product does with uploads
- **Wrong:**
  - Privacy says "screenshots or videos" and deletion within 30 days.
  - In code, only screenshots are accepted, images are not stored, and analysis outputs are archived with a hashed email and no expiry.
- **Why:** A privacy policy has to match reality. Here it's wrong in both directions: it claims video uploads that don't exist, and deletion that doesn't happen.
- **Evidence:** `src/pages/PrivacyPage.jsx:12,20,26`; `lambda/vod/index.mjs:559-582`.
- **Change:** Aaron decides the retention policy. Then update Privacy, or add an expiry (for example a DynamoDB TTL) to match it.
- **Metric:** none (compliance).
- **Risk:** low for copy; low to medium for a TTL.

### P0-11 · Unsupported numbers and labels on the home page
- **Wrong:**
  - "MOST POPULAR" on Pro, with no data behind it.
  - Every testimonial shows five stars, but there is no rating field.
  - "107 site setups" when the data has 100 sites.
- **Why:** Standard rule 5. Invented popularity and ratings are exactly what skeptical TikTok players look for.
- **Evidence:** `LandingPage.jsx:809, 596, 542`; `src/data/maps.js` (25 maps, 100 sites); `site-index.js:1401`.
- **Change:**
  - Remove the label and the stars.
  - Compute counts from data.
  - If Pro should be emphasized, state the product reason (as `/start` does).
- **Metric:** none directly; trust.
- **Risk:** low.

### P0-12 · Two ranked-pool lists disagree
- **Wrong:**
  - `maps.js` `rankedPool` (which drives the UI) includes Coastline, Emerald Plains and Outback, and excludes Villa, Theme Park and Kanal.
  - `r6-season.js` `rankedMapIds` (verified August 23) says the reverse for those six.
  - `maps.js` also flags Emerald Plains as ranked while its comment says "no Ranked tag".
- **Why:** Players plan for the wrong pool, and the site disagrees with itself.
- **Evidence:** `src/data/maps.js:3-7, 88-94`; `src/data/r6-season.js:18-33`; `src/data/changelog.js:16`.
- **Change:** Make one list authoritative, checked against Ubisoft's official Ranked pages, and derive the other from it. Recheck at Y11S3.1 (#27 left the list unchanged by design).
- **Metric:** content accuracy complaints.
- **Risk:** medium (the strats UI filters on it).

---

## P1: conversion and usability

### P1-1 · Pricing links hide two of the three paid plans
- **Wrong:**
  - Every "See pricing" / `/#pricing` link (blog, guides, tools, coaching page, WelcomeModal "Upgrade to Elite") lands where Elite and Champion are collapsed behind "Compare Elite and Champion".
  - In-app links to `/#pricing` don't scroll to the section at all.
- **Why:** A visitor sent to compare plans can't see them. The Elite upsell from inside the app lands on nothing.
- **Evidence:** `LandingPage.jsx:462, 802`; `generate-coaching-page.mjs:36`; `DashboardPage.jsx:402`.
- **Change:** Show all plans when arriving at `#pricing`, or give each tier a deep link, and scroll to hash targets.
- **Metric:** `Pricing CTA Click` by tier.
- **Risk:** low.

### P1-2 · Guides silently bounce free visitors
- **Wrong:** 23 static map guides link to "Open interactive X strats". For free or signed-out players, the app silently sends them back to `/strats` with no explanation.
- **Why:** A dead end at a moment of interest; the player doesn't know it's a Pro map.
- **Evidence:** `StratsPage.jsx:134-136`; `scripts/generate-guides.mjs`.
- **Change:** Show the locked state with "This map is in Pro" and the free alternatives.
- **Metric:** guide → strat click-through and upgrades from guides.
- **Risk:** low.

### P1-3 · Sign-up bait that leads to a wall
- **Wrong:**
  - `/live` tells signed-out visitors "Sign up — free", then says "Live Coach is a Pro feature" after signup.
  - "Review a round free" in the nav leads to a canned sample.
  - Ban guides say recommendations are "inside the signed-in strategy tool", but they are Pro.
  - Setup stubs say "Sign in, open the Setup Library", but verified setups are Elite.
- **Why:** Each is a broken promise right after the signup we asked for.
- **Evidence:** `LiveCoachPage.jsx:238-255`; `Navbar.jsx:349`; `generate-ban-guides.mjs:101`; `SetupsPage.jsx:1311`.
- **Change:** Label the gated state honestly before signup ("Pro feature, see what it does"). Keep "free" for things that are free.
- **Metric:** signup → activation rate; 7-day retention of new accounts.
- **Risk:** low.

### P1-4 · Onboarding modals cover the first value
- **Wrong:**
  - After signup, the required profile form (z-index 9999; name and platform) opens over the Welcome tour, which opens over the page the player came for.
  - Both ask for a role, with different options.
  - The name is asked twice: signup and display name.
  - Skipping the profile only lasts the browser session.
- **Why:** The standard's activation rule: the first plan comes before profile setup (Apple HIG and Intercom agree).
- **Evidence:** `ProfileSetupModal.jsx:80, 142`; `WelcomeModal.jsx:31-35`; `WelcomeModal.jsx:12-19` vs `ProfileSetupModal.jsx:42-49`.
- **Change:**
  - #29 defers both modals for `/start` signups.
  - Next: one optional, shorter profile step shown after the first plan, for everyone.
  - Drop the duplicate name and role questions.
- **Metric:** first-plan views per signup (activation).
- **Risk:** low to medium.

### P1-5 · Signup friction
- **Wrong:**
  - Full Name is required, though login doesn't need it.
  - Raw Cognito error text is shown.
  - There is no show-password toggle.
  - Some CTAs (climb page, referral page) go to signup with no redirect back.
  - The desktop nav has no Sign up button.
- **Why:** Baymard: field count and unclear errors drive abandonment; users must return to their intended path.
- **Evidence:** `AuthPage.jsx:333-345, 316-325`; `Navbar.jsx:240, 250`.
- **Change:**
  - Drop Full Name from signup; ask for it later if it's needed at all.
  - Map Cognito errors to plain fixes, for example "That email already has an account — sign in".
  - Add show-password.
  - Add a redirect to every signup CTA.
- **Metric:** `Signup Completed` ÷ `Signup Started`.
- **Risk:** low.

### P1-6 · Campaign attribution never reaches the server
- **Wrong:**
  - The first-touch campaign lives only in the browser and in Plausible event props.
  - The profile stores `referral_source` (source only).
  - Stripe Checkout Sessions carry no campaign metadata.
  - The admin can't attribute revenue to a campaign or video.
- **Why:** "Which video produced customers?" can't be answered from our own data, and ad blockers hide some Plausible events.
- **Evidence:** `src/lib/refSource.js`; `ReferralAttributor.jsx`; `lambda/subscription/index.mjs:1185-1203`; admin audit (Source column).
- **Change:**
  - Store the campaign object on the profile at signup.
  - Add `utm_*` Checkout Session and subscription metadata (a sanitizer was drafted and tested but held back from #29 because of P0-2).
  - Show campaign in the customer record.
- **Metric:** share of paid customers with a known campaign.
- **Risk:** low, after P0-2 is resolved.

### P1-7 · Paid conversion wasn't measured on the site (fixed in #29)
- **Wrong:**
  - Plausible had click events but no event for a completed or abandoned checkout.
  - Goals were documented only in a code comment.
- **Why:** The funnel stopped at "clicked Pro".
- **Evidence:** `src/utils/analytics.js:5-16`; `AccountPage.jsx` (no checkout handling).
- **Change:**
  - Done in #29: `Checkout Completed` / `Checkout Cancelled`, with the tier and originating CTA.
  - Next: add the goals in Plausible, and keep Stripe as the server truth.
- **Metric:** checkout completion rate.
- **Risk:** low.

### P1-8 · Admin numbers that can't be true
- **Wrong:**
  - "Trials expected to convert" is always 0, because the deployed admin Lambda doesn't return it.
  - On the production branch's Lambda, Collected, Refunds, Next billing and Source are blank. The deployed `main` version does return them; see P0-2.
  - Pending cancellations show as "Paid", because the webhook ignores cancel-at-period-end.
  - There is no dated view of who started or cancelled this week.
- **Why:** A dashboard that is sometimes wrong teaches the owner to ignore it.
- **Evidence:** `AdminPage.jsx:357-373, 216-217`; `lambda/admin/index.mjs` (deployed vs branch); `lambda/webhook/index.mjs:547, 588`.
- **Change:**
  - Render only fields the deployed Lambda returns.
  - Store cancellation dates.
  - Add a dated revenue timeline.
- **Metric:** time to answer the weekly revenue questions.
- **Risk:** low to medium.

### P1-9 · No single customer record
- **Wrong:**
  - Billing, bookings, comps and audit entries are on different tabs.
  - Usage, coaching credits and history, and CRM email aren't visible anywhere.
  - Search is by email or Stripe id only.
- **Why:** Every support question means hunting across tabs (Shopify and HubSpot's one-record principle).
- **Evidence:** admin audit; `AdminPage.jsx:227-231`.
- **Change:** A customer page with all of it, reached by one search box that also matches name and gamertag.
- **Metric:** support time per ticket.
- **Risk:** medium (new views; read-only first).

### P1-10 · Coaching operations can lose money or double-book
- **Wrong:**
  - Cancelling a booking neither refunds nor restores a credit.
  - Two availability editors overwrite each other.
  - Comped slots are offered again as open.
  - Comped sessions get no reminder emails.
- **Evidence:** `lambda/booking/index.mjs:211, 389-391, 793-811, 998-1023`; `AppointmentsCalendar.jsx`; `AvailabilityEditor.jsx`.
- **Change:**
  - Cancelling offers refund or credit-back.
  - One availability editor with time off.
  - Comped slots count as taken.
  - Reminders go to every confirmed session.
- **Metric:** booking disputes, no-shows.
- **Risk:** medium (booking payment path).

### P1-11 · Multi-game remnants ship on an R6-only product
- **Wrong:**
  - Blog and operator footers say "coaching across 20 competitive games" and "FPS coaching across 10 games".
  - The blog wordmark reads "RECON+".
  - Five The Finals posts survive the prune and link to pruned pages.
- **Evidence:** `generate-blog-posts.mjs:114,126`; `generate-r6-operator-posts.mjs:695,707`; `scripts/prune-non-r6-output.mjs:12`; `scripts/check-product-truth.mjs:11`.
- **Change:** Fix the generator footers, extend the prune and product-truth patterns, and remove the orphan posts.
- **Metric:** none directly; trust and SEO focus.
- **Risk:** low.

### P1-12 · Ban and intel coverage is overstated
- **Wrong:**
  - "The right ban for every map" and "every ban — pre-loaded", while Calypso Casino has no bans at all and 11 maps' bans are auto-derived.
  - The public ban boards are empty.
  - Enemy intel covers 13 of 25 maps but is sold as a Pro feature without qualification.
- **Evidence:** `SoftPaywall.jsx:104-105, 121`; `index.html:19`; `src/data/ban-suggestions.js:2-3`; `src/data/enemyMeta.js`; `src/data/meta.js`.
- **Change:** State coverage honestly ("bans for 24 maps", "enemy intel for 13"), or fill the gaps first.
- **Metric:** paid churn.
- **Risk:** low.

### P1-13 · The referral program is probably broken
- **Wrong:**
  - Referral lookups scan DynamoDB with `Limit: 1` before the filter, so most codes return "not found".
  - The promised free month is never applied.
  - Earning requires `all_access`, which is no longer sold.
- **Evidence:** `lambda/subscription/index.mjs:47-51, 661-666, 706-711, 848-851`; `ReferralsWidget.jsx:92, 102`.
- **Change:** Query an index instead of scanning, implement or remove the reward, and update the copy.
- **Metric:** referral signups.
- **Risk:** medium.

### P1-14 · CLAUDE.md gives future sessions stale facts
- **Wrong:** The repo's `CLAUDE.md` still says:
  - HashRouter;
  - a May 8 desktop launch;
  - Pro $9 and Champion $29/$39 founding pricing;
  - a "Recruit" free tier.
- **Why:** Sessions that trust it write wrong copy. This doc PR adds a pointer to the standard's truth registry at the top.
- **Change:** Rewrite the pricing and launch sections, or delete them and point to the registry.
- **Risk:** low.

### P1-15 · The free plan is the product's first impression, and it's thin
- **Wrong:**
  - The public plan for a site is one strategy sentence, four callouts and five operators.
  - The visual round plan pads it with generic steps ("Keep comms short and use the named spaces…"), and phase labels don't always fit the step ("DRONE: Open the CEO wall with Thermite").
  - A paying customer cancelled over "AI slop" (see `/setups` for the verified alternative).
- **Why:** For cold traffic, the free plan is the proof. Thin or templated output undercuts every sales page, including `/start`.
- **Evidence:** `scripts/generate-content-boundaries.mjs:22-29`; `src/components/strats/TacticalRoundPlan.jsx:17-38`; the churn notes.
- **Change:**
  - Prioritize verified content for the free maps first (Bank, Coastline).
  - Drop the filler steps when the source text is short.
  - Consider using a verified setup as the free sample.
- **Metric:** first-plan → second-plan views; upgrade rate.
- **Risk:** medium (content work; needs Aaron's footage per the verification pipeline).

---

## P2: optimization

- **P2-1 · Sitemap, RSS and structured data.**
  - Every `<lastmod>` and `pubDate` is the build time.
  - The sitemap lists gated pages (`/auth`, `/dashboard`, `/download`) and omits `/beginner-guide` and `/progress`.
  - The home page's FAQ JSON-LD is served on every route and doesn't match the visible FAQ.
  - *Change:* real modification dates, an allow-list of indexable pages, route-specific structured data.
  - *Metric:* organic impressions.
  - *Risk:* low.
- **P2-2 · Generators outside the build, and hard-coded dates.**
  - `generate-r6-operator-posts.mjs` (47 committed pages) and the non-R6 generators aren't in `generate:all`.
  - Posts say "Last updated: 2026-05".
  - JSON-LD dates default to May 10.
  - *Change:* put every shipped generator in the build (or delete it); take dates from data.
  - *Risk:* low (#27 narrowed the operator posts on purpose; syncing their site tables is a separate, verified change).
- **P2-3 · Mobile performance of acquisition pages.**
  - Every route loads the shared 78 KB gzip app bundle before its own chunk (`/start` adds 14 KB).
  - TikTok's in-app browser is slow to start JavaScript.
  - *Change:* prerender `/start` to static HTML, or trim the shared bundle (the home page imports strategy and meta data up front). Measure a real Landing Page View against taps.
  - *Metric:* landing-view ÷ taps, bounce.
  - *Risk:* medium.
- **P2-4 · Naming drift.**
  - Round Review vs VOD Review.
  - Site Strategy vs Strats Browser.
  - Basic vs Recruit.
  - "Champion Tactics" that unlock at Elite.
  - *Change:* one name per thing, from a glossary in the standard.
  - *Risk:* low.
- **P2-5 · Duplicate destinations.**
  - `/climb/` vs `/progress`.
  - Three operator page sets.
  - `/status.html` and `/status/`.
  - *Change:* one canonical page each, with redirects.
  - *Risk:* low.
- **P2-6 · Admin information architecture.**
  - Attention-first home, jobs-based sections, saved views and a support inbox.
  - *Proposal:* `admin-jobs-and-ia.md`.
  - *Metric:* time on routine tasks.
  - *Risk:* medium (incremental).
- **P2-7 · Event naming for a later GA4 or TikTok pixel.**
  - Keep a mapping from our Plausible names to standard events (`sign_up`, `begin_checkout`, `purchase`, TikTok `CompleteRegistration`/`Subscribe`) so adding either is a mapping, not a rename.
  - *Risk:* low.
- **P2-8 · Match prep's free/paid position is unclear.**
  - It's sold as a Pro feature, but signed-in free accounts get the same page (from public data).
  - *Change:* decide; then either gate it or list it as free.
  - *Risk:* low.

## P3: polish

- **P3-1:** Footer payment badges show PayPal and Apple Pay. Confirm they're enabled in Stripe or remove them (`Footer.jsx:78-106`).
- **P3-2:** Dead code:
  - `FoundingTopBanner` never renders (`Layout.jsx:29` plus its own `null` on `/`).
  - `DailyPlaybook` and `PromoKit` admin components are unused.
  - `t.initials` is used but never returned by the API.
- **P3-3:** Admin surface bugs:
  - Unstyled error classes in CompManager, AuditLog and GameCatalog.
  - "Copied N emails" shows even when copying fails.
  - The demo-video form drops the caption.
- **P3-4:** `robots.txt` still describes the site as hash-routed.

## Product-truth conflicts at a glance

| Topic | Versions found | Deployed or authoritative truth |
|---|---|---|
| Pro trial | "No trial" (home) · "30-day card-required trial" (Terms, tools, changelog) · "TRIAL" badge | No trial (deployed checkout) |
| Free tier | Bank and Coastline · "every strat / every site / every callout" (modals, meta, manifest) | Bank and Coastline |
| Plan names | Basic · Recruit · "Champion" used for Elite content | Basic, Pro, Elite, Champion (`memberships.js`) |
| Pro price | $12 · "$9 founding, locked for life" on generated posts | $12 (founding closed Aug 31) |
| Site count | 107 · 100 | 100 |
| Ranked pool | `maps.js` list · `r6-season.js` list | Verify against Ubisoft (P0-12) |
| Season | Y11S2 (data, countdown, badge) · Y11S3 (home badge by calendar) | Y11S3 Operation Split Fire, Y11S3.1 (#27, #28) |
| Live Coach | "detects match state / evidence-based" · manual walkthrough | Manual walkthrough (web); desktop coach beta |
| Desktop app | "Now" · "Early access" · "PC Beta" · "no install needed" | 2.0.4 installer for paid members, beta, unsigned |
| Screenshots per review | "1-10" for everyone | Pro 5; Elite and Champion 10 |
| Upload retention | "videos … deleted within 30 days" | Screenshots only; images not stored; analyses archived without expiry |
| Champion sessions | "2 live sessions a month" | Credits granted, but not redeemable self-serve |

## Suggested order

1. **Freeze deploys until P0-2 is resolved** (commit the live work, then one deploy source). Everything else depends on knowing what ships.
2. **One registry for plan facts and capabilities** (#29 starts it with `planFacts.js`). Then fix P0-1, P0-7, P0-8, P0-9, P0-11 and P1-12 from it, with a build check.
3. **P0-6** (CloudFront directory index) and **P0-3** (Champion sessions).
4. **P0-4** (reconciliation guard) and **P0-10** (Privacy).
5. **Measurement:** P1-6, and Plausible goals for the #29 events.
6. **Signup and onboarding:** P1-4, P1-5.
7. **Admin:** P1-8 → P1-9 → the attention home (`admin-jobs-and-ia.md`).
