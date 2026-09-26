# Growth, Sales, Conversion and UX Operating Standard

**Scope:** Recon 6 (r6coaching.com) and Iron Front Digital. This covers public pages, social acquisition pages, signup, checkout, onboarding and activation, lifecycle and CRM, the admin console, and the analytics behind them.

**Status:** proposed, September 25, 2026. Aaron adopts or edits it through the pull request that adds it.

**Who reads it:** anyone (human or Claude session) changing a public page, signup, checkout, onboarding, growth tooling, the CRM or the admin. Read it before the change, not after.

> Core principle: **generic positioning is bad; familiar UX patterns are good.** Recon 6 should look unmistakably like Recon 6 and behave like software people already understand.

The companion audit, `docs/audits/2026-09-25-growth-ux-audit.md`, records where the site stands against this standard today and what to fix first.

---

## 1. The shared rules

These are the non-negotiables. Each rule has a test you can apply to a page or a pull request.

| # | Rule | How to check it |
|---|---|---|
| 1 | Every page has one primary job. | Name the job in one sentence. If the page has two equal CTAs pointing to different jobs, it fails. |
| 2 | Every traffic source lands on a page that continues the promise that produced the click. | Put the ad/video/post next to the landing page. The first screen should repeat its subject (map, site, problem) in its first line. |
| 3 | Show real product value before demanding commitment whenever practical. | A cold visitor can see or use real output before an account or card is asked for. |
| 4 | Never use vague SaaS copy when specific product evidence exists. | Strike any sentence that would fit another product unchanged. |
| 5 | Never invent proof, urgency, popularity, scarcity or outcomes. | Every number, quote, badge, deadline and rank claim points to a source (API data, code, Stripe, Ubisoft). "Most Popular" needs real data. |
| 6 | Pricing, plan names, trials, limits, refunds and product capabilities have one authoritative source of truth. | Copy imports the value from the registry in section 3; nothing is typed by hand into two places. |
| 7 | Public pages never disagree about product truth. | Build-time checks and the audit's truth table show no conflicts. |
| 8 | Social acquisition pages are mobile-first. | Design and review at 390 px first, then 430 px, then desktop. |
| 9 | Signup is not the goal; first meaningful product value is the activation goal. | The activation event (section 7) is measured and reported next to signups. |
| 10 | Paid conversion follows experienced or clearly demonstrated value. | No page asks for money before showing what the money buys. |
| 11 | Every major funnel step is measurable. | Each step in section 8 has an event, with campaign props attached. |
| 12 | Admin interfaces are organized around operator jobs and frequency, not backend architecture. | The admin home answers "what needs me now?" before anything else. |
| 13 | Rare and dangerous admin controls use progressive disclosure. | Destructive or money-moving controls are not on the first screen. |
| 14 | Destructive actions require clear confirmation and recovery where technically possible. | The confirmation names the object and the consequence; an undo or restore path is documented. |
| 15 | Search and filter replace hunting through large admin datasets. | Any customer can be found by email, name or Stripe id in one step. |
| 16 | The most important information appears first. | Read the first screen alone and ask whether it would be enough. |
| 17 | The interface always makes the next sensible action obvious. | Every state (empty, loading, error, success) has a next action. |
| 18 | Performance, accessibility and mobile usability are conversion concerns, not polish. | Budgets in section 10 are met before launch. |
| 19 | We test assumptions rather than declaring a design "high converting". | PRs explain the reasoning and the metric to watch, never a conversion claim. |
| 20 | Copy, design, analytics and product behavior agree. | The checkout, the pricing copy and the event names describe the same thing. |

---

## 2. Research basis

The rules above distil established guidance. We copy the principles, never the visual design. Sources were checked on 2026-09-25.

### Usability: Nielsen Norman Group
- **Visibility of system status.** Give feedback within about a second; any wait over a few seconds shows progress. After payment, show an explicit success state. ([visibility](https://www.nngroup.com/articles/visibility-system-status/), [response times](https://www.nngroup.com/articles/response-times-3-important-limits/))
- **Match the real world.** Use the player's words (site, callout, anchor, runout), never internal names such as plan IDs, table names or "sub rows". ([article](https://www.nngroup.com/articles/match-system-real-world/))
- **Consistency and standards.** One name per tier and per feature across the site, email, Stripe and Discord. ([article](https://www.nngroup.com/articles/consistency-and-standards/))
- **Error prevention, then recovery.**
  - Prefer pickers, defaults and constraints to free typing. Keep confirmations for costly actions only; people click through confirmations they see often.
  - Error messages name the cause and the fix at the field, and keep the user's input.
  - Sources: [slips](https://www.nngroup.com/articles/slips/), [confirmation dialogs](https://www.nngroup.com/articles/confirmation-dialog/), [error messages](https://www.nngroup.com/articles/error-message-guidelines/)
- **Recognition over recall.** Keep options visible and remember the last map, site and side. ([article](https://www.nngroup.com/articles/recognition-and-recall/))
- **Aesthetic and minimalist design; progressive disclosure.** Essentials first, advanced detail on request, at most two levels. ([minimalism](https://www.nngroup.com/articles/aesthetic-minimalist-design/), [progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/))
- **Attention concentrates at the top.** Most viewing time is above the fold and within the first two screens. Put the value proposition, one CTA and a visible piece of real product on the first phone screen. ([scrolling and attention](https://www.nngroup.com/articles/scrolling-and-attention/))
- **Credibility comes from specifics.**
  - Upfront prices and terms, correct and current content, and real examples beat self-praise.
  - "Powered by AI" is not a value proposition.
  - Small social-proof numbers can backfire.
  - Sources: [trustworthy design](https://www.nngroup.com/articles/trustworthy-design/), [powered by AI](https://www.nngroup.com/articles/powered-by-ai-is-not-a-value-proposition/), [social proof](https://www.nngroup.com/articles/social-proof-ux/)
- **No login wall before value.** A login wall asks for commitment before giving anything back. ([login walls](https://www.nngroup.com/articles/login-walls/))

### Interaction design: Apple Human Interface Guidelines
- **Design principles (2026):** agency, responsibility, familiarity and simplicity. Give people control, feedback and easy recovery; collect only what is needed; use known patterns consistently. ([design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles))
- **Buttons.**
  - One or two prominent buttons per view, labelled with a verb.
  - Destructive actions are never the default and always offer Cancel.
  - Sources: [buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), [alerts](https://developer.apple.com/design/human-interface-guidelines/alerts)
- **Onboarding and accounts.** Let people use the product before asking them to buy. Delay sign-in and explain why it is needed. Teach in context. ([onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding), [managing accounts](https://developer.apple.com/design/human-interface-guidelines/managing-accounts))
- **Accessibility.**
  - Touch targets of at least 44 × 44 pt.
  - Text contrast of 4.5:1.
  - Never rely on color alone.
  - Source: [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)

### Signup and checkout: Baymard Institute
- **Most abandonment comes from fixable friction.**
  - Documented average cart abandonment is about 70%.
  - Leading reasons: extra costs, distrust of the site with a card, forced account creation, a long or complicated flow, and errors.
  - Source: [cart abandonment](https://baymard.com/lists/cart-abandonment-rate)
- **Field count matters more than step count.** Ask only for what is needed. ([form fields](https://baymard.com/blog/checkout-flow-average-form-fields))
- **Password rules: minimum length only, shown before typing,** with no character-type rules. ([password requirements](https://baymard.com/blog/password-requirements-and-password-reset))
- **Mobile keyboards.** Use the right input types, no auto-capitalization or autocorrect on email, and one-time-code autofill for verification codes. ([touch keyboards](https://baymard.com/blog/mobile-touch-keyboards))
- **Validate when a field is left.** Error messages say how to fix the problem and never wipe input. ([inline validation](https://baymard.com/blog/inline-form-validation), [error messages](https://baymard.com/blog/adaptive-validation-error-messages))
- **Keep people on their intended path through sign-in and reset.** Name the next step, including that payment happens on Stripe. ([sign-in flows](https://baymard.com/blog/account-sign-in-flows), [payment UX](https://baymard.com/blog/payment-ux))

### Message match and measurement: Google Ads and Google Analytics 4
- **Landing page experience** means the page is relevant to the click, transparent, easy to navigate on mobile, and fast. ([landing page experience](https://support.google.com/google-ads/answer/2404197), [improve landing pages](https://support.google.com/google-ads/answer/6238826))
- **UTM discipline.**
  - Always set source, medium and campaign; use content for the creative. Use lowercase only.
  - Partial tagging shows up as "(not set)".
  - Sources: [campaign URLs](https://support.google.com/analytics/answer/10917952), [URL builder](https://support.google.com/analytics/answer/11242870)
- **Events.**
  - Keep key events few.
  - Standard lead events such as `generate_lead`, `qualify_lead` and `close_convert_lead`, plus `sign_up`, `begin_checkout` and `purchase`, make a later GA4 mapping one-to-one.
  - Count a purchase once, after the server confirms it.
  - Sources: [recommended events](https://support.google.com/analytics/answer/9267735), [event reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events), [key events](https://support.google.com/analytics/answer/13965727)
- **State the attribution model before comparing numbers.** Plausible credits the converting visit; our first-touch store preserves the originating video. ([attribution](https://support.google.com/analytics/answer/10596866))

### Social acquisition: TikTok for Business
- **Creative Codes:** TikTok-first, trend-aware, production-principled, structured (hook, body, close), stimulating, sound-on. State the value in the first seconds. ([Creative Codes](https://ads.tiktok.com/business/en-US/creative-codes), [best practices](https://ads.tiktok.com/help/article/creative-best-practices?lang=en))
- **The video, caption, CTA and landing page must match.** Mismatches are a policy problem for ads and a trust problem for organic traffic. ([ad format policy](https://ads.tiktok.com/help/article/tiktok-ads-policy-ad-format-and-functionality))
- **One focused page per campaign:** one message, fewer distractions, key content visible without scrolling, mobile-first and fast. ([website advertising guide](https://ads.tiktok.com/business/en/guides/website-advertising-guide), [loading optimizations](https://ads.tiktok.com/help/article/landing-page-loading-optimizations))

### Activation and onboarding: Intercom
- **Activation is not signup.** Define activation from what retained customers have in common. For Recon 6 today, provisionally: the player opened a round plan they chose. ([onboarding guide](https://www.intercom.com/blog/onboarding-guide/), [aha moments](https://www.intercom.com/blog/understanding-your-aha-moments-and-putting-them-to-work/))
- **Defer obligations.** Carry the context the visitor arrived with through signup and land them on the value. ([signup](https://www.intercom.com/blog/yesterdays-signup-wont-work-today/))
- **Teach in context.**
  - Keep checklists short: three to seven tasks, and we cap ours at three.
  - Avoid tooltip tours on phones.
  - Sources: [checklists](https://www.intercom.com/help/en/articles/6899972-checklist-best-practices), [product tours](https://www.intercom.com/help/en/articles/3095688-best-practices-for-using-product-tours)
- **Message on behavior, not the calendar.** One deep-linked nudge if the first plan is not opened, with a stop condition. ([onboarding series](https://www.intercom.com/help/en/articles/421-create-an-effective-onboarding-series))

### Back office: Shopify, HubSpot, Vercel
- **The admin home is a work queue, not a report.** Show counted tasks that clear when resolved. ([Shopify Home](https://help.shopify.com/en/manual/shopify-admin/shopify-home))
- **Navigate by business object; keep settings apart.** Saved views replace repeated searches, and bulk actions confirm their scale. ([Shopify admin](https://help.shopify.com/en/manual/shopify-admin/shopify-admin-overview), [search, filters and views](https://help.shopify.com/en/manual/shopify-admin/productivity-tools/searching-filtering-views))
- **Confirmations name the action and its consequence,** with verb labels; destructive actions sit away from the primary action. ([Shopify modal](https://shopify.dev/docs/api/app-home/web-components/overlays/modal))
- **One record per person** (properties, a timeline and associated records). Lifecycle stage is separate from process pipelines. ([HubSpot records](https://knowledge.hubspot.com/records/work-with-records), [lifecycle stages](https://knowledge.hubspot.com/records/use-lifecycle-stages))
- **Deletes are restorable,** and bulk deletes confirm their scale. ([HubSpot restore](https://knowledge.hubspot.com/records/restore-deleted-records))
- **Order navigation by frequency. Status first,** with alerts you can trust. **Danger at the bottom,** with a reversible option offered first and an activity log. ([Vercel navigation](https://vercel.com/changelog/new-dashboard-navigation-available), [alerts](https://vercel.com/docs/alerts), [managing projects](https://vercel.com/docs/projects/managing-projects), [activity log](https://vercel.com/docs/activity-log))

---

## 3. Product truth: one source per fact

Rule 6 in practice. A public page quotes a fact only through its source; nobody types a price, limit or trial into copy by hand.

**Order of authority when sources disagree:**
1. What the deployed system does: checkout Lambda, Stripe prices, VOD quota enforcement.
2. Then the repository config that feeds it.
3. Then page copy.

If copy disagrees with the deployed behavior, the copy is wrong. If the committed code disagrees with the deployed code, stop and reconcile before any deploy; see audit finding P0-2.

| Fact | Truth on 2026-09-25 | Authoritative source | How it was verified |
|---|---|---|---|
| Plan names | Basic (free), Pro, Elite, Champion | `src/config/memberships.js` (`PLAN_LABEL`) | code |
| Monthly prices | Pro $12, Elite $39, Champion $70 | Display: `src/config/stripe.js` (`*_CURRENT_AMOUNT`). Charge: the price IDs in `lambda/subscription/membership-checkout.mjs`. | Deployed Lambda env price IDs match the code defaults. |
| Founding rate | Pro $9 founding window closed August 31, 2026; existing founding subscribers keep it | `src/config/founding.js`, Lambda `FOUNDING_END_ISO` | deployed env |
| Free trial | **None** for new memberships | Deployed `membership-checkout.mjs` (`trialDays: 0` for all tiers) | Deployed code, 2026-09-24. The committed code still says 30 days for Pro; see P0-2. |
| AI VOD reviews | Pro 20, Elite 60, Champion 75 per month; free trial accounts 3 | `lambda/vod/index.mjs` defaults (no env override) | deployed code and env |
| Free tier | Bank and Coastline plans (`freeSample` maps) for everyone. A free account adds the sign-in-only tools (match prep, loadouts, progress checks). No AI reviews. | `freeSample` in `src/data/maps.js`, `StratsPage` gating, `lambda/vod` (reviews need a paid plan) | code |
| Screenshots per review | Pro 5, Elite and Champion 10 | `lambda/vod/index.mjs` (`PRO_MAX_IMAGES`, `ELITE_MAX_IMAGES`) | code |
| Live coaching | Champion includes two 1:1 sessions a month | Champion price, plus webhook credits used by the booking Lambda | code. Self-serve redemption is broken; see audit P0-3. |
| One-off coaching | $40 single session; first session $20, checked on the server by email | `lambda/booking/index.mjs` price map | code |
| Desktop coach | Recon 6 Command 2.0.4 for Windows (beta, not code-signed), for paid members | `lambda/subscription` `DESKTOP_DOWNLOAD_KEY`; private bucket object | S3 listing (installer uploaded 2026-08-07) |
| Workbook | Siege Starter Field Workbook, $14.99 one-time | Stripe workbook price in the subscription Lambda | release notes (Build 228) |
| Refunds and cancellation | Cancel from Account (Stripe portal); access continues to the end of the period. 7-day money-back on the first paid charge, case by case after that. Separately booked coaching sessions are excluded. | `src/pages/RefundPage.jsx`, `src/pages/TermsPage.jsx` | code. The Terms page still describes a 30-day trial; see P0-1. |
| Password rule | 12+ characters, no character-type rules | Cognito pool `PasswordPolicy` (`aws/template.yaml`) | live pool, read 2026-09-25 |
| Season and patch | Operation Split Fire (Y11S3), patch Y11S3.1, September 22, 2026 | `src/data/r6-season.js`, `src/config/season.js` | Ubisoft official pages |

When a fact changes, change the source, run the build checks, and update this table in the same PR.

---

## 4. Page types and their one job

| Page | One primary job | Primary CTA leads to |
|---|---|---|
| Social acquisition page (`/start`) | Turn a video viewer into a player who opened their first real round plan | Account creation that returns them to that plan |
| Home (`/`) | Explain Recon 6 to a mixed audience and route them | The strategy library or pricing |
| Product pages (`/strats`, `/vod`, `/live`, `/progress`) | Deliver the value itself | The next use of the same tool |
| Pricing (a section, reached by `/pricing`) | Let a convinced player pick the plan that fits | Secure checkout |
| Auth (`/auth`) | Create or open an account with no surprises | Back to the intent that sent them |
| Checkout return (`/account?checkout=success`) | Confirm payment and start the paid value | The first paid feature |
| Admin (`/admin`) | Show Aaron what needs attention now | The one item to handle |

---

## 5. Social acquisition pages

**Traffic:** a phone, 5 to 15 seconds of attention, sound probably still on from the video.

**The first 390 px screen answers seven questions:**
1. What is Recon 6?
2. What does it do for my next Siege match?
3. Why is it better than random tips?
4. Can I see what I get?
5. Can I try it now?
6. What does paid unlock?
7. Where do I click?

**Structure:** hook → show the result → how you get it → more capability → why this instead of free tips → free vs paid → real proof → pricing → objections → final CTA. Each section earns the next scroll; delete any section that exists only because landing pages usually have one.

**Requirements:**
- Continue the promise of the video. Campaign links carry `utm_campaign`/`utm_content`; the page can adapt its first line or its demo to them from one config, without a hard-coded page per video.
- One dominant primary CTA, named for what happens next (for example "Open my free round plan"). Never "Get started", "Learn more", "Explore" or "Join now".
- Real product UI, large enough to read on a phone. No screenshots that need zooming.
- No global navigation, no modal over the product, no autoplaying decorative video above the fold.
- Objections are answered where they arise (cheating, solo queue, "do I need another app?", "does it play for me?", Copper vs Emerald), not in a generic FAQ.
- Pricing appears only after the value is shown, but it is never hidden: one tap from the hero.
- A plan may be visually emphasized only for a stated product reason (for example "most players start here because it adds AI reviews"). Never "Most Popular" without data.

---

## 6. Signup and checkout

1. **Ask only for what the account needs.** Today that is email, password and the emailed verification code. Do not add fields to signup; collect profile details after activation.
2. **Keep the intent across the detour.** Anyone sent to `/auth` from a CTA returns to the same page, with the same plan or map selected. Paid CTAs use `membershipSignInPath(tier, returnPath)`, and the return page resumes checkout once.
3. **Explain errors in words, next to the field,** and keep what the player typed.
4. **State the price, billing timing and cancellation before the checkout button,** in the same words the checkout uses. No trial claim unless the deployed checkout creates one.
5. **No dead ends.** Every checkout outcome (success, cancel, error, already subscribed) lands somewhere with a next action.
6. **Trust at the payment step comes from specifics:**
   - Stripe-hosted checkout.
   - "Cancel from your Account page".
   - The exact refund window from `/refund`.

---

## 7. Activation and onboarding

**The activation event for Recon 6 is opening a real round plan for a map and site the player chose.** Signing up is not activation.

- Send new accounts straight to that value, with their map and site pre-selected when known. Profile setup and tours come after the first plan, never before it.
- Keep onboarding to a short checklist (three items at most) of real actions, such as: open your first plan, pick your role, review one lost round. Each item is completed by doing it, not by reading about it.
- Put education in context, next to the feature it explains; avoid multi-step tours.
- Treat lifecycle stages as data: visitor → account → activated → paying → retained, with the moment each stage is reached recorded.

---

## 8. Measurement

Plausible is the analytics tool; `track()` in `src/utils/analytics.js` attaches first-touch campaign props (`source`, `medium`, `campaign`, `content`, `term`, `path`) to every event. Stripe's webhook is the source of truth for payment.

### UTM conventions for social links

| Parameter | Value |
|---|---|
| `utm_source` | platform: `tiktok`, `youtube`, `instagram`, `discord` |
| `utm_medium` | `social` (organic), `paid_social` (ads), `bio` (profile link) |
| `utm_campaign` | the series or push, e.g. `site_files` |
| `utm_content` | the specific video, e.g. `ep001_oregon_kids_dorms` |
| `utm_term` | optional: the map or site key, e.g. `oregon` |

### Funnel events

| Step | Event | Key props |
|---|---|---|
| Landing viewed | `Landing Viewed` | `page`, `entry_campaign`, `entry_content` (last touch) |
| Product interaction | `Demo Interaction` | `map`, `site`, `side`, `action` |
| Primary CTA | `Hero CTA Click` / `Free Tier CTA Click` | `location` |
| Pricing viewed | `Pricing Viewed` | `page` |
| Checkout start | `Pricing CTA Click` | `tier`, `location` |
| Signup start | `Signup Started` | (auth page) |
| Signup completed | `Signup Completed` | (auth page) |
| Activation | `Strat Viewed` (first plan opened after signup) | `map`, `site`, `side`, `plan` |
| Paid return | `Checkout Completed` / `Checkout Cancelled` | `tier`, `location` |
| Paid (server truth) | Stripe subscription with metadata | tier, customer |

**Attribution rules:**
- First touch is stored once and never overwritten (`src/lib/refSource.js`).
- The landing event also records the last-touch entry campaign, so a returning viewer's newest video is visible.
- Server-side attribution belongs in Stripe Checkout Session metadata; see the audit for the pending change.

**The four questions this must answer:**
1. Which videos produced paying customers?
2. Which produced signups but no purchases?
3. Which CTA converts best?
4. Where do people leave?

---

## 9. Copy

Every sentence must do one of four jobs: **increase desire, explain the product, remove an objection, or move the reader toward action.** Delete anything else.

**Banned** (unless quoting existing material): "elevate your gameplay", "unlock your potential", "take your game to the next level", "AI-powered insights", "dominate the competition", "revolutionary coaching", "level up".

**R6 vocabulary, used correctly:** operator, site, callout, utility, drone, intel, frag, anchor, roam, spawn-peek, runout, hard breach, soft breach.

**Honesty:**
- Strategy content is labelled as beta until it is verified.
- Footage-verified callouts are the only content described as verified.
- No rank-gain promises.
- No invented reviews, counts, deadlines or popularity.

**Tone:** direct and specific; no emojis in billing or subscription copy.

---

## 10. Design, accessibility and performance

- **Identity:** Recon 6's dark surfaces, cyan accent (`--accent`), attack orange and defense blue, and Space Grotesk headings. Use the tokens in `src/index.css`; do not invent new colors per page.
- **Familiar patterns:** real buttons, visible labels, standard form controls, predictable back behavior.
- **Accessibility:**
  - Contrast AA or better.
  - Touch targets at least 44 × 44 px.
  - Visible focus rings.
  - A logical tab order.
  - No information carried by color alone.
- **Performance budget for acquisition pages:**
  - The first screen renders without waiting for below-the-fold data.
  - No autoplay video.
  - Images are lazy below the fold.
  - JavaScript for the route is split from the app shell.

---

## 11. Admin and back office

- **The admin home is an attention list.** It opens on what needs Aaron now: failed payments and disputes, customers waiting on a reply, appointments today, funnel anomalies, system alerts. KPIs come second; controls come last.
- **Organize by job, not by table:** Customers, Revenue, Coaching, Growth, Content, System. Navigation mirrors the questions Aaron asks, not the Lambda that answers them.
- **One customer record:** profile, subscriptions, payments, usage, appointments, feedback and notes on one screen. Reached by search, never by scrolling a list.
- **Filters and saved views instead of long tables.**
- **Rare and dangerous controls** (backfills, deletions, comps, refunds, bulk messages) live behind a "Maintenance" or record-level menu. Each confirmation names the object and consequence and, where possible, offers a restore path. An audit trail records who did what.

---

## 12. Review gates for pull requests

Before opening a PR that touches a public page, signup, checkout, onboarding, growth tooling or the admin:

1. **Truth check.** Every price, limit, trial, refund term, count and capability on the page comes from section 3. List any conflict found; never resolve one by guessing.
2. **Hostile conversion review.** Read the page as a Copper player, a Gold solo-queue player, an Emerald player, a skeptical TikTok viewer, and someone who has never heard of Recon 6. For each persona, answer:
   - What do they think it does after five seconds?
   - Where do they see proof?
   - What stops them signing up?
   - What stops them paying?
3. **Screenshots** at 390 px, 430 px and desktop, covering the first screen, the product proof, free vs paid, pricing and the final CTA.
4. **Measurement.** Name the events added or changed and the funnel question they answer.
5. **Tests, lint and a production build.** Nothing is merged or deployed without Aaron's review.
6. **No conversion claims.** Describe the reasoning and the metric to watch; the numbers decide later.
