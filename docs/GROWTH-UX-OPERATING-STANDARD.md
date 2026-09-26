# Growth, Sales, Conversion and UX Operating Standard

| | |
|---|---|
| **Status** | **Proposed, 2026-09-25. Pending Aaron's approval.** Nothing here is in force until Aaron merges it. |
| **Applies to** | Recon 6 (r6coaching.com) and Iron Front Digital |
| **Owner** | Aaron. Changes follow §11. |
| **Current findings** | [`docs/audits/GROWTH-UX-AUDIT-2026-09-25.md`](audits/GROWTH-UX-AUDIT-2026-09-25.md). This file holds rules only. It does not list Recon 6 bugs. |

**Contents:** 1 Purpose and scope · 2 Core principle · 3 The 20 shared rules · 4 Proposed rules 21–30 · 5 Product-truth governance · 6 Measurement · 7 Review checklists · 8 Admin information architecture · 9 Experimentation · 10 `/start` acceptance criteria · 11 How to use this document

---

## 1. Purpose, scope and when it applies

**Purpose.** One set of tested principles for every acquisition, signup, checkout, onboarding, CRM and admin change, so pages stop contradicting each other and design is judged by measurement, not taste.

**Scope** (both businesses):

| Surface | Recon 6 examples | Iron Front Digital examples |
|---|---|---|
| Public site | Home, pricing, coaching page, generated blog and guide pages, structured data | Marketing site, product pages |
| Social and ad landing pages | `/start`, profile bio links | Ad landing pages |
| Signup and checkout | `/auth`, Stripe Checkout, coaching booking checkout | Registration, Stripe Checkout |
| Onboarding and activation | Profile step, welcome flow, first plan, first review | Onboarding wizard, first delivered asset |
| Lifecycle messaging | CRM Lambda emails, Discord bot replies | Sequences, nurture emails |
| Growth and analytics | Plausible events, UTM capture, Stripe metadata | Pixel/CAPI, GA4, lead-stage imports |
| CRM and admin | `/admin` and any CRM section | Admin dashboards and CRM |

**When it applies:** any change that alters what a visitor, customer or operator sees, is told or is charged on those surfaces. That includes text inside generators, email templates, bots, outreach files, structured data and the files Claude sessions read (`CLAUDE.md`).

**Not covered:** game-content accuracy (strats, patch notes), except where content makes a claim about the product.

---

## 2. Core principle

> **Generic positioning is bad. Familiar UX patterns are good.**
>
> We want Recon 6 to look unmistakably like Recon 6 while behaving like software users immediately understand.

Be distinctive in what you say and show. Be conventional in how the interface behaves.

| Be distinctive in | Be conventional in |
|---|---|
| **Voice:** R6 vocabulary used correctly (site, callout, anchor, runout, hard breach), direct, no hype | **Navigation:** logo goes home, short noun labels, Back works, no hidden gestures |
| **Evidence:** real round plans, real review output, counts computed from data | **Controls:** real buttons with verb labels, standard form fields, visible labels |
| **Visual identity:** the product's design tokens (surfaces, accent colors, type) | **Checkout:** hosted payment, price and terms shown before the button, standard card and wallet flows |
| **Offer:** what only this product does for this audience | **Feedback and errors:** inline, specific, input kept |
| **Hooks:** tied to real player moments ("why you lost that round") | **Admin:** tables, filters, search, confirmations, undo |

Two tests:
- **Generic test.** If a sentence could appear unchanged on a competitor's site, replace it with a product fact or a real artifact (Rule 4).
- **Familiarity test.** If a control would surprise someone who uses Stripe, Gmail or Shopify, replace it with the standard pattern. People bring expectations from the other products they use ([NN/g: consistency](https://www.nngroup.com/articles/consistency-and-standards/); [Apple HIG: Familiarity](https://developer.apple.com/design/human-interface-guidelines/design-principles)).

Distinctive never means novel interaction. Familiar never means stock copy.

---

## 3. The 20 shared rules

Each rule is quoted verbatim, then explained. **Check** is a pass/fail test a reviewer applies to a pull request. Cite rules by number in PR descriptions (§11).

**1. Every page has one primary job.**
- **Means:** One intended action per page. Secondary actions are visually subordinate. A page serving two audiences routes them; it doesn't pitch both.
- **Check:** The PR states the page's job in one sentence. **Pass** if exactly one primary-styled CTA is visible at any scroll position (repeats of the same CTA are fine). **Fail** if two primary-styled CTAs lead to different jobs.
- **Sources:** [NN/g: minimalist design](https://www.nngroup.com/articles/aesthetic-minimalist-design/) · [Apple HIG: principles](https://developer.apple.com/design/human-interface-guidelines/design-principles) · [Google: landing page experience](https://support.google.com/sa360/answer/9351020?hl=en)

**2. Every traffic source must land on a page that continues the promise that produced the click.**
- **Means:** The first screen repeats the specific subject of the ad, video or post (map, problem, offer). The CTA verb matches the creative's close. Any offer named in the creative exists on the page on the same terms.
- **Check:** Put each creative next to its landing page. **Pass** if the H1 or first line restates the promise, and the product, price, trial and brand name match exactly. **Fail** on any mismatch.
- **Sources:** [TikTok: landing page checklist](https://ads.tiktok.com/help/article/ad-review-checklist-landing-page?lang=en) · [TikTok: misleading content](https://ads.tiktok.com/help/article/tiktok-ads-policy-misleading-and-false-content) · [Google Ads: Quality Score](https://support.google.com/google-ads/answer/2404197?hl=en) · [Google Ads: misrepresentation](https://support.google.com/adspolicy/answer/6020955?hl=en)

**3. Show real product value before demanding commitment whenever practical.**
- **Means:** A cold visitor sees real output (a real plan, a labelled sample review) before an account or card is required. Require an account only when the core function needs one.
- **Check:** **Pass** if real output, not stock imagery or a mock, is visible within the first two phone screens and before any form. **Fail** if an account or paywall precedes all value without a written reason.
- **Sources:** [Apple HIG: accounts](https://developer.apple.com/design/human-interface-guidelines/managing-accounts) · [Apple HIG: onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding) · [Baymard: forced accounts, 18–19% of abandoners](https://baymard.com/lists/cart-abandonment-rate) · [Intercom: C.A.R.E.](https://www.intercom.com/blog/c-a-r-e-simple-framework-user-onboarding/)

**4. Never use vague SaaS copy when specific product evidence exists.**
- **Means:** Replace adjectives ("AI-powered", "deep intel", "level up") with nouns, numbers and artifacts that exist in the product.
- **Check:** **Fail** any sentence that would be true of a competitor unchanged. **Pass** if every benefit claim names a concrete output, a computed count or a real screenshot.
- **Sources:** [NN/g: objective copy +27%, combined +124%](https://www.nngroup.com/articles/concise-scannable-and-objective-how-to-write-for-the-web/) · [Google Ads: landing pages](https://support.google.com/google-ads/answer/6238826?hl=en)

**5. Never invent proof, urgency, popularity, scarcity or outcomes.**
- **Means:** Every testimonial, rating, count, badge, timer, deadline, "spots left" message and result claim traces to a real record or an enforced system constraint. Real urgency is allowed: a true deadline that is never extended.
- **Check:** **Pass** if each such element in the diff names its source (record, query, config). **Fail** on hard-coded stars, "Most Popular" without data, rank-up promises, moved or reset deadlines, or unsourced percentages.
- **Sources:** [FTC reviews rule (since 2024-10-21)](https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers) · [NN/g: deceptive patterns](https://www.nngroup.com/articles/deceptive-patterns/) · [TikTok: misleading content](https://ads.tiktok.com/help/article/tiktok-ads-policy-misleading-and-false-content) · [Built for Shopify: claims and pressure](https://shopify.dev/docs/apps/launch/built-for-shopify/requirements)

**6. Pricing, plan names, trials, limits, refunds and product capabilities must have one authoritative source of truth.**
- **Means:** Each value is defined once, in the product-facts catalog (§5), and every consumer reads it, from pages and emails to checkout and entitlement code.
- **Check:** **Pass** if the diff adds no literal price, trial length, limit, plan name or capability claim outside the catalog, and the CI literal scan is green. **Fail** otherwise.
- **Sources:** [Baymard: extra costs, about 40% of abandoners](https://baymard.com/lists/cart-abandonment-rate) · [Google Ads: billing terms](https://support.google.com/adspolicy/answer/6020955?hl=en) · [TikTok: price parity](https://ads.tiktok.com/help/article/ad-review-checklist-landing-page?lang=en)

**7. Public pages must never disagree about product truth.**
- **Means:** Consistency is checked across every public surface (static output, emails, bots, structured data), not only the page in the diff.
- **Check:** **Pass** if the cross-surface truth check is green and the PR's truth table lists no conflicts. **Fail** if a conflict was found and resolved by guessing.
- **Sources:** [NN/g: consistency](https://www.nngroup.com/articles/consistency-and-standards/) · [Apple HIG: Familiarity](https://developer.apple.com/design/human-interface-guidelines/design-principles)

**8. Social acquisition pages are mobile-first.**
- **Means:** Design, build and review at 360–390 px first. The in-app browsers of TikTok and Instagram are the primary environment.
- **Check:** **Pass** if screenshots at 360, 390, 430 px and desktop are attached, there is no horizontal scroll at 320 px, and the §7(f) thresholds are met. **Fail** otherwise.
- **Sources:** [TikTok: page speed](https://ads.tiktok.com/help/article/landing-page-loading-optimizations) · [web.dev: Core Web Vitals](https://web.dev/articles/vitals) · [Baymard: touch keyboards](https://baymard.com/blog/mobile-touch-keyboards)

**9. Signup is not the goal; first meaningful product value is the activation goal.**
- **Means:** Success is measured at activation (§6.2) and reported next to signups, by source.
- **Check:** **Pass** if the PR names the activation event its change should move, and that event is actually emitted. **Fail** if success is defined as signups or profile completion.
- **Sources:** [Intercom: activation is not signup](https://www.intercom.com/blog/onboarding-guide/) · [Apple HIG: onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding) · [Google Ads: qualified leads](https://support.google.com/google-ads/answer/11459091?hl=en)

**10. Paid conversion should follow experienced or clearly demonstrated value.**
- **Means:** Pay prompts come after the user has experienced value, or next to an explicit demonstration of exactly what payment buys.
- **Check:** **Pass** if every upgrade prompt in the diff fires after an activation event or beside a real demonstration of the paid output. **Fail** if a paywall is the first thing a new visitor meets.
- **Sources:** [Apple HIG: value before purchase prompts](https://developer.apple.com/design/human-interface-guidelines/onboarding) · [Intercom: Convert stage](https://www.intercom.com/blog/c-a-r-e-simple-framework-user-onboarding/)

**11. Every major funnel step must be measurable.**
- **Means:** Each step in §6.3 has a registered event that fires once per action and carries attribution. Money steps are recorded by the server.
- **Check:** **Pass** if new or changed steps emit registered events, visible in a debug view and in the funnel report. **Fail** on unregistered names or on events documented but never emitted.
- **Sources:** [GA4: recommended events](https://support.google.com/analytics/answer/9267735?hl=en) · [GA4: funnels](https://support.google.com/analytics/answer/9327974?hl=en) · [TikTok: deduplication](https://ads.tiktok.com/help/article/event-deduplication?lang=en)

**12. Admin interfaces are organized around operator jobs and frequency, not backend architecture.**
- **Means:** Navigation names jobs and business objects (Today, Members, Coaching, Revenue), ordered by how often the operator does them. It never mirrors tables, Lambdas or components.
- **Check:** **Pass** if every navigation item added maps to a job in the jobs inventory (§8). **Fail** if it is named after a table or service, or placed for implementation convenience.
- **Sources:** [Shopify: navigation](https://shopify.dev/docs/apps/design-guidelines/navigation) · [Vercel: navigation by frequency](https://vercel.com/changelog/new-dashboard-navigation-available) · [HubSpot: sales workspace](https://knowledge.hubspot.com/prospecting/review-sales-activity-in-the-sales-workspace)

**13. Rare and dangerous admin controls use progressive disclosure.**
- **Means:** Destructive, bulk or money-moving controls live in the record they affect or in System, at most two levels deep, and findable by search.
- **Check:** **Pass** if no destructive control appears on a default view or beside a routine control. **Fail** otherwise.
- **Sources:** [NN/g: progressive disclosure, two levels max](https://www.nngroup.com/articles/progressive-disclosure/) · [Vercel: danger at the bottom](https://vercel.com/docs/projects/managing-projects)

**14. Destructive actions require clear confirmation and recovery where technically possible.**
- **Means:** Irreversible actions name the object and the exact consequence, and require a typed confirmation. A reversible alternative (disable, pause, archive) is offered first. Reversible actions use Undo instead of a dialog. Every such action is audited.
- **Check:** **Pass** if the confirmation names object and consequence, uses verb buttons with Cancel not the default, documents a restore path (or why none exists), and writes an audit entry. **Fail** otherwise.
- **Sources:** [NN/g: confirmation dialogs](https://www.nngroup.com/articles/confirmation-dialog/) · [Apple HIG: alerts](https://developer.apple.com/design/human-interface-guidelines/alerts) · [Vercel: Instant Rollback](https://vercel.com/docs/instant-rollback)

**15. Search/filter must replace hunting through large admin datasets.**
- **Means:** One search box finds any customer, booking or payment by name, email, handle or Stripe ID. Lists over about 50 rows have filters, sort and saved views, with filter state in the URL.
- **Check:** **Pass** if any record the change touches is reachable in two interactions or fewer from any admin page. **Fail** if the operator must scroll or scan to find it.
- **Sources:** [Shopify: search and views](https://help.shopify.com/en/manual/shopify-admin/productivity-tools/searching-filtering-views) · [HubSpot: saved views](https://knowledge.hubspot.com/records/create-and-manage-saved-views) · [NN/g: data tables](https://www.nngroup.com/articles/data-tables/)

**16. The most important information appears first.**
- **Means:** Inverted pyramid. The first phone screen holds the main point and the main action or status. Details follow.
- **Check:** **Pass** if a reviewer reading only the first 375 px viewport can state the page's point and its next action. **Fail** otherwise.
- **Sources:** [NN/g: inverted pyramid](https://www.nngroup.com/articles/inverted-pyramid/) · [Shopify Home: tasks first](https://help.shopify.com/en/manual/shopify-admin/shopify-home) · [TikTok: first seconds decide (platform-reported)](https://ads.tiktok.com/business/en/blog/creative-best-practices-top-performing-ads)

**17. The interface must always make the next sensible action obvious.**
- **Means:** Every state (empty, loading, error, success, locked) shows one clear next step. Locked content says why it is locked and how to unlock it.
- **Check:** **Pass** if each new state in the diff has a labelled next action. **Fail** on disabled dead-end buttons, silent redirects or blank empty states.
- **Sources:** [NN/g: system status](https://www.nngroup.com/articles/visibility-system-status/) · [Shopify: setup guide](https://shopify.dev/docs/api/app-home/latest/patterns/compositions/setup-guide) · [Intercom: first-use patterns](https://www.intercom.com/blog/product-tours-first-use-onboarding/)

**18. Performance, accessibility and mobile usability are conversion concerns, not polish items.**
- **Means:** The §7(f) thresholds block a release like a failing test.
- **Check:** **Pass** if LCP, INP, CLS and the accessibility checks meet §7(f). **Fail** otherwise.
- **Sources:** [web.dev: Core Web Vitals](https://web.dev/articles/vitals) · [web.dev: Milliseconds Make Millions (observational)](https://web.dev/case-studies/milliseconds-make-millions) · [WCAG 2.2: target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) · [Apple HIG: accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)

**19. We test assumptions rather than declaring a design “high converting.”**
- **Means:** A conversion claim is a hypothesis until a dated test or a before/after measurement supports it (§9).
- **Check:** **Pass** if the PR states the hypothesis and the metric to watch, and makes no conversion claim. **Fail** on "high-converting", "proven" or similar wording without linked data.
- **Sources:** [NN/g: A/B testing](https://www.nngroup.com/articles/ab-testing/) · [NN/g: 5 users](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/) · [Google Ads: experiments](https://support.google.com/google-ads/answer/6261395?hl=en)

**20. Copy, design, analytics and product behavior must agree.**
- **Means:** What the page says, what the button does, what the server enforces and what the event records all describe the same thing.
- **Check:** **Pass** if, for each claim in the diff, the enforcing code and the proving event are named. **Fail** if any of the four disagree.
- **Sources:** [GA4: key events](https://support.google.com/analytics/answer/13965727?hl=en) · [HubSpot: lifecycle stages](https://knowledge.hubspot.com/records/use-lifecycle-stages) · [TikTok: landing page checklist](https://ads.tiktok.com/help/article/ad-review-checklist-landing-page?lang=en)

---

## 4. Proposed additions: rules 21–30 (need Aaron's approval)

These close gaps the research found in the 20 rules. **They are not in force until Aaron approves them.** Until then, reviewers may cite them only as advice.

| # | Proposed rule | Check | Main sources |
|---|---|---|---|
| 21 | No surprise costs or terms at the moment of commitment. | Before the pay button: amount charged today, recurring amount, interval, renewal or trial-end date, and how to cancel. | [Baymard: checkout](https://baymard.com/blog/checkout-flow-ux-optimization) · [Google Ads: misrepresentation](https://support.google.com/adspolicy/answer/6020955?hl=en) |
| 22 | Ask only for what you need, when you need it, and say why. | Every field and permission has a stated reason on screen; no unused fields. | [Apple HIG: Responsibility](https://developer.apple.com/design/human-interface-guidelines/design-principles) · [Baymard: forms](https://baymard.com/blog/form-design) |
| 23 | Never make users redo work. | After any error, decline, navigation away or timeout, entered data is still there. | [NN/g: errors](https://www.nngroup.com/articles/error-message-guidelines/) · [Baymard: payment](https://baymard.com/blog/payment-ux) |
| 24 | Acknowledge every action within perceptual limits. | Feedback within 0.1 s; busy state after 1 s; progress and Cancel after 10 s. | [NN/g: response times](https://www.nngroup.com/articles/response-times-3-important-limits/) · [Apple HIG: feedback](https://developer.apple.com/design/human-interface-guidelines/feedback) |
| 25 | Use the user's vocabulary, never internal names, on public and admin surfaces. | A glossary maps each term to one meaning; no codenames, table names or plan IDs in the UI. | [NN/g: heuristic 2](https://www.nngroup.com/articles/ten-usability-heuristics/) |
| 26 | Lifecycle messaging is triggered by behavior and carries one next step. | Every automated message has a behavioral trigger, an exit condition, one link, and (for marketing email) a working opt-out. | [Intercom: message schedule](https://www.intercom.com/blog/designing-onboarding-message-schedule/) |
| 27 | Attribution survives every hop, and every conversion is counted once. | Click IDs and UTMs reach the final URL; the payment domain is not a referrer; browser and server events share one event ID. | [Google Ads: auto-tagging](https://support.google.com/google-ads/answer/3095550?hl=en) · [TikTok: click ID](https://ads.tiktok.com/help/article/tiktok-click-id?lang=en) · [TikTok: deduplication](https://ads.tiktok.com/help/article/event-deduplication?lang=en) |
| 28 | Close the loop with lead-stage outcomes, not form fills (Iron Front Digital especially). | The CRM stores click IDs and hashed contact data per lead; qualified and converted outcomes are uploaded on a schedule. | [Google Ads: qualified leads](https://support.google.com/google-ads/answer/11459091?hl=en) · [Google Ads: offline imports](https://support.google.com/google-ads/answer/10029210?hl=en) |
| 29 | Exits are as easy as entries. | Cancelling a subscription and deleting an account take no more steps than signing up, with no call or email required. | [Apple HIG: accounts](https://developer.apple.com/design/human-interface-guidelines/managing-accounts) · [cancellation law (secondary source)](https://www.crowell.com/en/insights/client-alerts/clicking-all-the-right-boxes-ftc-moves-to-revive-click-to-cancel-rule-following-eighth-circuit-vacatur) |
| 30 | Funnel stage, work status and revenue pipeline are separate, rule-governed fields. | Lifecycle stage moves forward automatically from real events; pipeline rules block skipped stages. | [HubSpot: lifecycle stages](https://knowledge.hubspot.com/records/use-lifecycle-stages) · [HubSpot: pipeline rules](https://knowledge.hubspot.com/object-settings/set-up-pipeline-rules) |

---

## 5. Product-truth governance

### 5.1 What counts as a product fact

Plan names; prices (current, founding and legacy); billing interval; trials (length, card required, which plans); free-tier scope; usage limits (for example reviews per period, screenshots per review); refund and cancellation terms; one-time products (workbooks, credit packs); coaching offers, prices and credit rules; referral rewards; supported games; the status of every capability (shipped, beta, planned, retired); current season and patch; and every public count (maps, sites, operators, posts).

### 5.2 Order of authority

1. **What the customer is charged and what the server enforces:** the Stripe Price and Checkout settings, the checkout code, and the entitlement checks.
2. **The product-facts catalog.** It must equal (1); a scheduled contract check proves it.
3. **Everything that describes the product:** pages, structured data, generators, emails, bots, outreach files and docs.

Resolve disagreements in that order:
- If (3) disagrees with (1) or (2), (3) is wrong.
- If (2) disagrees with (1), stop and reconcile before deploying. Never edit copy to match a guess.
- If committed code disagrees with deployed code, freeze deploys of that artifact until the two are reconciled and the deployed commit is recorded.

### 5.3 Proposed design

This is the recommended mechanism. Aaron approves the design; the implementation PR may adjust file names.

- **One file: `config/product-facts.json`.** Plain JSON, read identically by Vite, Node scripts, Lambdas and CI. Sections: `plans` (labels, prices with status and Stripe IDs, trials, entitlements, limits), `freeTier`, `founding`, `refunds`, `coaching` (offers, prices, credits, cancellation and no-show rules), `oneTimeProducts`, `referral`, `capabilities` (each feature's status, `shipped | beta | planned | retired`, and its plans), `marketedGames`, and `season` (code, name, patch, ranked map IDs, `reviewDue`, sources).
- **Counts are never typed.** A build step computes them from the data into `dist/facts.generated.json`.
- **Thin adapters.** `src/config/productFacts.js` exposes helpers such as `getOffer(plan, now)` and `getEntitlements(plan)`, and a shared Lambda module bundled at deploy exposes the same values to the server. Any existing page-level fact file becomes a view over the catalog, never a second source.
- **Checkout is server-created.** The price ID and trial days come from the catalog. The client sends the amount it displayed, and the server rejects a mismatch. Upgrades go through a subscription update or the Stripe customer portal, never a second checkout.

### 5.4 Consumers that must read the catalog

Pricing cards, paywalls and upgrade prompts; structured data; the Terms, Refund and Privacy pages; every static generator (including the AI-coach context); lifecycle emails and the Discord bot; the checkout, webhook, entitlement, booking and admin Lambdas; and outreach or brand kits unless marked do-not-publish and excluded from the scan.

### 5.5 CI checks

| Check | Fails the build when | Runs |
|---|---|---|
| Literal scan | A currency amount, trial length, limit, plan name, "founding", "locked for life", "money-back", "unlimited" or game name appears in `src/**`, generator templates, Lambda copy or built `dist/**` without coming from the catalog | Every PR |
| Expiry gate | Founding copy renders after `founding.endsAt`; `season.reviewDue` has passed; any other dated promise is in the past | Every PR, plus a daily scheduled build |
| Cross-surface truth | Built pages disagree with each other or with the catalog on any §5.1 fact | Every PR |
| Entitlement parity | Two Lambdas treat the same subscription status, plan or limit differently | Every PR |
| Stripe contract | A catalog price ID's amount, interval, active flag or trial differs from Stripe | **Scheduled only**, with a restricted read-only key held as a CI secret; never on pull requests |
| Generated output | Committed output is stale against its generator, or a `public/` file has no generator and no allowlist entry | Every PR |
| Event registry | An emitted event is not registered, or a registered event has no emitter (§6.7) | Every PR |
| Deploy provenance | A deploy runs from a dirty tree or a branch other than the declared production branch; the deployed commit is not recorded | Every deploy |

### 5.6 Changing a fact

1. Edit the catalog in one PR. List every consumer affected.
2. Run the checks. Regenerate static output in the same PR.
3. If terms change, bump the legal pages' effective date and have Aaron sign off.
4. Deploy every consumer that bundles the catalog together: the site and each affected Lambda.
5. Record the change and its reason in `docs/DECISIONS.md` (create the file with its first entry).

**Dated promises:** an announced deadline is never extended. When an offer ends, its copy disappears at the end time through the expiry gate, without a manual edit.

**Conflicts:** a PR that finds a conflict lists it in its truth table and stops. It does not pick a side silently.

---

## 6. Measurement standard

### 6.1 Principles

- The server is the source of truth for money. The client is the source of truth for behavior.
- One event registry. One name per event. Display names in analytics tools are aliases of the registry keys.
- Every report states its attribution model (first touch or last touch) and its window.

### 6.2 Activation (first meaningful product value)

Activation is one behavior, emitted by the server where possible. It is never "signed up" or "completed a profile."

| Product | Proposed activation events | Notes |
|---|---|---|
| Recon 6, free path | **A1 `activation_first_plan`:** a signed-in player opens a round plan for a map and site they chose | Fast, free value |
| Recon 6, core | **A2 `activation_first_review`:** the first completed review of the player's own screenshot | The value the product is sold on |
| Recon 6, coaching | **`booking_attended`:** first attended session | Coaching funnel only |
| Iron Front Digital | First live asset or first delivered lead, defined per product | Recorded in that repo |

Report A1 and A2 separately, by source. Which one is the headline activation metric is Aaron's decision. Validate the choice against 30-day retention once there are enough accounts.

### 6.3 Canonical funnel events

| Step | Registry key | Recorded by | Step-specific properties | GA4 / TikTok equivalent |
|---|---|---|---|---|
| Landing viewed | `landing_view` | client | `page`, `hook_id` | `page_view` / ViewContent |
| Product interaction | `demo_interaction` | client | `action`, `map`, `site`, `side` | `select_content` |
| Primary CTA | `cta_click` | client | `location`, `destination` | — |
| Pricing viewed | `pricing_view` | client | `page` | `view_item_list` |
| Signup started | `signup_start` | client, on first field focus | `method` | — |
| Account created | `account_created` | server | `method` | `sign_up` / CompleteRegistration |
| Email verified | `email_verified` | server | — | — |
| Activation | `activation_first_plan`, `activation_first_review` | server (A1 may be client-confirmed) | `map`, `site`, `image_count` | key event |
| Trial started | `trial_started` | server | `plan`, `trial_days`, `card_required` | — |
| Checkout started | `checkout_started` | server, when the session is created | `plan`, `price_id`, `amount_cents` | `begin_checkout` / InitiateCheckout |
| Paid | `purchase_completed` or `subscription_started` | server (webhook) | `plan`, `amount_cents`, `currency`, Stripe IDs | `purchase` / CompletePayment |
| Trial converted | `trial_converted` | server | `plan`, `amount_cents` | — |
| Renewal | `subscription_renewed` | server | `amount_cents` | — |
| Payment failed | `payment_failed` | server | `attempt` | — |
| Cancellation | `subscription_canceled` | server | `at_period_end`, `reason` | — |
| Refund or dispute | `refund_issued`, `dispute_opened` | server | `amount_cents` | `refund` |
| Coaching | `booking_started`, `booking_paid`, `booking_attended` | server | `type`, `amount_cents` | — |
| Lead (Iron Front Digital) | `lead_captured` → `lead_qualified` → `lead_converted` | server / CRM | `stage`, `source` | `generate_lead`, `qualify_lead`, `close_convert_lead` |

### 6.4 Properties on every event

| Property | Rule |
|---|---|
| `event_id` | Unique. A browser copy and a server copy of the same conversion share it. |
| `anon_id` | First-party identifier. The user key is attached only server-side. |
| `variant` | The experiment arm, or `none` |
| `first_touch`, `last_touch` | `source`, `medium`, `campaign`, `content`, `term`, `landing_path`, `referrer_host`, `ts` |
| `page` | Path only, no query string |
| `app_version` | The deployed commit |
| Money events | `amount_cents` and `currency` |

**Never** send email addresses, names or free text in client events.

### 6.5 Attribution rules

1. **UTM conventions,** lowercase only: `utm_source` = the platform (`tiktok`, `youtube`, `instagram`, `discord`, `reddit`, `email`); `utm_medium` = `social`, `paid_social`, `email` or `referral`; `utm_campaign` = the series or push; `utm_content` = the video or creative slug; `utm_term` = optional map or site.
2. **Capture before any client redirect:** the parameters, `ref`, landing path, referrer host and timestamp. A redirect such as `/tiktok` must carry the parameters in the redirect URL itself.
3. **First touch is written once and never overwritten.** Last touch updates each session. A self-reported "how did you find us?" answer lives in its own field and never overwrites captured data.
4. **Click IDs** (`ttclid`, `gclid`, `fbclid`) are kept on the final URL through any redirect. Store them only when paid ads run and the privacy policy and consent cover them.
5. **Persist at every hand-off:**
   - account creation → the profile
   - checkout → `client_reference_id`, `metadata` and `subscription_data.metadata`, so renewals and cancellations carry it
   - booking checkout → the same metadata
   - The webhook copies attribution onto the subscription record.
6. **If GA4 is used,** list the payment and auth domains as unwanted referrals.
7. **Deduplication:** count each purchase once, by Stripe session or invoice ID. Browser and server pairs share an `event_id`; TikTok deduplicates matching pairs within 48 hours.

### 6.6 Reporting

- A weekly funnel by `utm_content` and `variant`: view → CTA → account → A1 → A2 → checkout → paid.
- Revenue by first touch and by last touch, each labelled as such.
- A proposed target: at least 90% of new revenue has a known source.

### 6.7 Registry and CI

- One registry file lists every event with its properties.
- CI fails when an emitted name isn't in the registry, or when a registered event has no emitter. A goal that exists only in a comment is a failed check, not documentation.

---

## 7. Review checklists

Apply every checklist whose surface the PR touches. Each item is pass/fail.

### (a) Social or TikTok landing page

- [ ] The page's one job is written in the PR and at the top of the page source.
- [ ] The first line restates each linking creative's promise. Product, price, trial, offer and brand match the creative and the catalog. The CTA verb matches the creative's close.
- [ ] One primary-styled CTA at any time; everything else is a subordinate text link.
- [ ] At 360 × 640, the headline, one value sentence and the CTA show without scrolling, and the price (or "free") is visible before the tap.
- [ ] Real product output appears within two screens and before any form. Samples are labelled.
- [ ] No global navigation, modal, banner or pop-up covers the product.
- [ ] Company identity, contact, Terms, Privacy and Refund are reachable. Viewing needs no personal data.
- [ ] The §6.3 events fire with attribution properties.

### (b) Signup and checkout

- [ ] Before the pay button: today's charge, the recurring amount, interval, renewal or trial-end date, and how to cancel, all from the catalog.
- [ ] An account is required only if the core function needs it; otherwise the user buys first and sets a password after.
- [ ] One column; labels above fields; optional fields marked; every field has a stated reason.
- [ ] Correct `type`, `inputmode` and `autocomplete` (`email`, `new-password`, `one-time-code`). Email has autocapitalize and autocorrect off. Inputs are at least 16 px.
- [ ] Password rules shown before typing equal the enforced policy, read from one config.
- [ ] Validation on blur. Errors sit at the field, name the problem and the fix, and clear on the fixing keystroke.
- [ ] Entered data survives errors, declines and app switches. Focus moves to the first error.
- [ ] The Checkout Session is created server-side, bound to the account (`client_reference_id`, locked email), carries attribution metadata, and opens in the same tab.
- [ ] Success and cancel land on pages with a next action. The confirmation says what was bought, what was charged and when it renews.
- [ ] Each purchase is recorded once, by the server. Cancelling takes no more steps than signing up.

### (c) Onboarding and activation

- [ ] The activation event the change should move is named and emitted.
- [ ] The first screen after signup is one action away from the activation task. There is no mandatory tour, and profile setup comes after first value.
- [ ] At most one modal at a time. Nothing covers the page the user came for.
- [ ] Any checklist has 3–7 verb-first tasks with progress, completes from real events, and can be dismissed and reopened.
- [ ] Any tour is optional, has 7 steps or fewer and fewer than 20 words per step, and never replays once dismissed.
- [ ] Every empty state shows how to start. Sample data is labelled as sample.
- [ ] Upgrade prompts appear only after activation or next to an explicit demonstration.
- [ ] Lifecycle messages are triggered by behavior, carry one link, stop when the user activates, and include a working opt-out when they are marketing.

### (d) Admin and CRM screens

- [ ] Each new navigation item maps to a job in the jobs inventory (§8).
- [ ] The first screen follows §8.2. Metrics come after tasks and show their date range.
- [ ] Every money figure shows its source and "as of" time. Unknown values render as "—", never 0.
- [ ] Any record can be found by name, email, handle or Stripe ID in two interactions or fewer.
- [ ] Lists over about 50 rows have filters, sort and saved views, with filter state in the URL.
- [ ] Destructive or bulk actions follow the §8.3 pattern and write an audit entry.
- [ ] Marketing exports include only consented, unsuppressed contacts.
- [ ] The top daily tasks work on a phone with no horizontal scroll.
- [ ] Every admin route and permission is declared in infrastructure code.

### (e) Copy and claims

**Banned** unless backed by a real record or an enforced constraint:
- star ratings or "reviews" without a rating field and verified reviewers
- "Most Popular", "#1", "best" or "players love"
- user counts
- rank-up or win-rate promises
- "guaranteed" results
- countdowns, "ends soon", "spots left", or "locked for life" after the window closed
- percentages without a source, sample and date
- "unlimited" when a cap exists
- "free" for anything that needs payment or a trial

**Required:**
- Testimonials record the customer, their consent and a date. Founder or staff quotes are labelled as such.
- Estimates are labelled "estimate"; samples are labelled "sample".
- Capabilities are described at the status the catalog gives them (shipped, beta, planned).

**Policy notes** (not legal advice; confirm with counsel):
- FTC reviews rule: no fake or AI-generated reviews and no fake social-influence indicators ([FTC Q&A](https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers)).
- TikTok: no exaggerated or absolute claims, restricted before/after comparisons, no non-functional interactive elements ([TikTok: ad messaging](https://ads.tiktok.com/help/article/ad-review-checklist-ad-messaging)).
- Google Ads: no unavailable offers, improbable results or omitted billing terms ([Google Ads: misrepresentation](https://support.google.com/adspolicy/answer/6020955?hl=en)).
- Auto-renewal: ROSCA and state laws still apply after the FTC click-to-cancel rule was vacated in July 2025 ([secondary source](https://www.crowell.com/en/insights/client-alerts/clicking-all-the-right-boxes-ftc-moves-to-revive-click-to-cancel-rule-following-eighth-circuit-vacatur)).
- Commercial email: CAN-SPAM requires a working unsubscribe and a postal address. This one is outside the research base; confirm it with counsel.

### (f) Performance, accessibility and mobile thresholds

| Area | Threshold | Source |
|---|---|---|
| Largest Contentful Paint | ≤ 2.5 s at the 75th percentile, mobile, field data | [web.dev](https://web.dev/articles/vitals) |
| Interaction to Next Paint | ≤ 200 ms at p75 | [web.dev](https://web.dev/articles/vitals) |
| Cumulative Layout Shift | ≤ 0.1 at p75 (social landing pages: ≤ 0.05) | [web.dev](https://web.dev/articles/vitals) |
| Tap targets | At least 24 × 24 CSS px (WCAG 2.2 AA); aim for 44 × 44 | [WCAG SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) · [Apple HIG: accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| Text contrast | At least 4.5:1, or 3:1 for large text | [Apple HIG: accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| Color | Never the only way information is conveyed | Apple HIG, accessibility |
| Form inputs | At least 16 px text so iOS does not zoom | Recon 6 funnel audit |
| Focus | Visible on every control, and never hidden behind sticky bars (WCAG 2.2 SC 2.4.11) | WCAG 2.2 |
| Motion | `prefers-reduced-motion` honored: no animated counters, glows or autoplay | WCAG 2.2 |
| Feedback timing | Response within 0.1 s; busy state after 1 s; progress and Cancel after 10 s | [NN/g: response times](https://www.nngroup.com/articles/response-times-3-important-limits/) |
| Layout | No horizontal scroll at 320 px; readable in portrait and landscape | [TikTok: landing page checklist](https://ads.tiktok.com/help/article/ad-review-checklist-landing-page?lang=en) |

Until there is enough field data, use lab measurements (Lighthouse mobile, slow 4G, mid-tier CPU) as a proxy, and say so in the PR.

---

## 8. Admin information architecture

### 8.1 Principles

1. **Jobs and frequency first.** The jobs inventory (kept in the audit) decides the sections and their order.
2. **Land on Today** (§8.2). When nothing needs the operator, it says so in one line.
3. **One console.** CRM, acquisition and coaching features become sections of one admin shell: no parallel consoles, no competing queues, one revenue figure.
4. **One record per person:** key facts, quick actions, a searchable timeline and associated records on one screen ([HubSpot's record layout](https://knowledge.hubspot.com/records/work-with-records)).
5. **Numbers show their source and time** ("Live Stripe · 2 min ago", "Ledger estimate"). Unknown is "—", never 0.
6. **Saved views are named for jobs** ("Payment issue", "Cancellation scheduled", "Paid, no login", "Trial ending this week"). On phones, Today comes first and lists become cards below 640 px.

### 8.2 The first screen: exactly six blocks

Each block shows only items that apply. A block with nothing in it collapses to one line. Each item states what happened and why, and has one primary action.

| # | Block | What qualifies | Limits |
|---|---|---|---|
| 1 | **What needs attention now** | Critical or due today, from any area: a paying customer who can't get access, a dispute with its evidence deadline, a refund owed, a payment failing for 3 or more days, a session within 2 hours with no prep | At most 5 items, sorted by severity, then age |
| 2 | **Revenue/customer changes worth noticing** | Since the last visit: new paying customers, scheduled cancellations with $/month at risk, churn, trials ending this week, MRR and cash, each with its source | Unchanged figures are dimmed; each links to a filtered list |
| 3 | **Outstanding customer problems** | Unanswered messages, negative feedback, stuck signups, duplicate subscriptions, open data requests | A count and the oldest age per group |
| 4 | **Appointments/actions due** | Sessions in the next 48 hours, follow-ups and no-shows to record, abandoned bookings, expiring comps or trials, content to review after a patch | Times shown in both time zones |
| 5 | **Funnel/growth issues** | Flagged movements only: signups, verifications, activations, trials and paid conversions against a 4-week baseline; top source; routine progress | Only when the movement is outside normal range |
| 6 | **System problems requiring action** | Failures only: webhook silence while subscriptions are live, failed jobs, held email, admin routes erroring, API error spikes | One line when all is well: "All systems normal · checked N min ago" |

**Not on the first screen:** full KPI grids, member tables, calendars, maintenance controls, exports and settings.

### 8.3 Pattern for rare and dangerous controls

1. **Home:** the record the control affects, or System. Never a default view.
2. **Reversible default first:** disable instead of delete, pause instead of cancel, archive instead of remove.
3. **Dry run and diff:** anything that writes more than one row shows exactly what will change, per row, before it writes.
4. **Typed confirmation:** name the object and the consequence; state the count for bulk actions; use verb buttons; Cancel is never the default.
5. **Audit entry:** who, what, when, which rows, from what to what.
6. **Recovery:** undo or restore where technically possible. Otherwise the dialog says "This cannot be undone" and why.

---

## 9. Experimentation

A design is not "high converting" until measured (Rule 19).

**Before a test, write down** the hypothesis and the one change, the primary metric with its dated baseline, the minimum detectable effect, guardrail metrics (for example activation, refunds, page speed) and the stopping rule.

**Sample size.** For a conversion rate, `n ≈ 16 · p(1 − p) / δ²` per arm (5% significance, 80% power), where `p` is the baseline rate and `δ` the absolute lift to detect. For example, a 15% baseline and a +5-point lift need about 800 visitors per arm.

**Run rules:** assign by visitor, sticky, 50/50; run at least 7 full days and until `n` is reached (NN/g advises 1–2 weeks); check for sample-ratio mismatch; don't peek or stop early; ship only if the 95% confidence interval excludes zero; log `variant` on every client and server event and in checkout metadata.

**When traffic is too low** for that `n`, run rounds of 5-user usability sessions ([NN/g](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/)) or compare sequential periods with unchanged measurement and the variant logged, and label the result directional.

**Record every test** in `docs/experiments/YYYY-MM-DD-<slug>.md`: hypothesis, dates, `n`, result and decision.

---

## 10. `/start` (TikTok sales page): acceptance criteria

These criteria apply to `/start` immediately, including the version in development. Every item is a requirement unless marked **(Recommended)**; a PR may deviate from a recommended item if it says why.

### 10.1 One job
1. The page's one job is written as a comment at the top of the page source and in the PR. It is one of these:
   - Open a free plan (activation A1)
   - Review my own round (activation A2)
   - Book a paid session
2. The CTA destination delivers that job without a detour. The jobs not chosen do not appear as primary actions.
3. No global navigation, banners, pop-ups, welcome or profile modals, newsletter capture or multi-plan grid above the value section.
4. The only exits are the primary CTA, in-page anchors, sign-in, and the footer legal links (Terms, Privacy, Refund, contact).

### 10.2 Hook continuity
1. The H1 or eyebrow comes from an allowlist keyed by `utm_content`, with a default hook. Raw URL text is never echoed onto the page.
2. No rank, win-rate, result or urgency claims, matching the video posting rules.
3. **(Recommended)** Visual continuity with the video (same wordmark, dark surface, type family or a system fallback).

### 10.3 Value first
1. Real product output is visible in the first screen or the next one. That is a real plan for a current ranked-pool map, or a review excerpt labelled "Sample".
2. Locked items say why they are locked and what unlocks them. No disabled dead-end buttons.
3. Next to the CTA, state what happens after the tap (for example "Email → 6-digit code → your plan opens"), generated from the catalog.
4. Never imply the visitor can review their own round for free unless that is true for them at that moment.

### 10.4 One CTA
1. One label and one destination, repeated at most three times (hero, after the proof, sticky bar).
2. The label says the action and, when it costs money, the cost, taken from the catalog.
3. Same-tab navigation. The CTA lands on signup mode with a redirect back to the chosen value.

### 10.5 Pricing from the catalog only
1. The page source and its built HTML contain zero literal prices, trial lengths or limits. CI enforces this.
2. Where pricing appears, the §7(b) pre-payment disclosures appear with it, matching what checkout creates.
3. No strikethrough price unless the catalog defines a current real reference price. No "founding", "locked for life", countdowns or "spots left".
4. Checkout is created server-side from the catalog price ID. An automated test in Stripe test mode compares the page's amount and trial with the created session.

### 10.6 No invented proof
1. Only consented, dated, verifiable testimonials; no stars; counts computed at build time; estimates labelled.
2. A CI banned-phrase check on `/start` output covers `★`, "most popular", "helped players", "locked for life", "ends in", "left at this price", "#1" and any `%` without a source.

### 10.7 Mobile and speed budgets
1. Designed at 360 × 640 first and checked at 320, 360, 375, 390 and 414 px with no horizontal scroll.
2. At 360 × 640, the top of the primary CTA sits at or above 480 px, leaving room for the in-app browser's chrome.
3. A sticky bottom CTA appears once the hero CTA scrolls away. It is at least 48 px tall, respects `env(safe-area-inset-bottom)`, and never covers a focused field.
4. Tap targets at least 44 × 44; body text and inputs at least 16 px.
5. Field thresholds at p75: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.05.
6. The lab gate (Lighthouse mobile, slow 4G, mid-tier CPU): LCP ≤ 2.0 s, TBT ≤ 150 ms, performance score ≥ 90, accessibility score ≥ 95.
7. **(Proposed, for Aaron to decide)** Weight budget:
   - First-load JavaScript ≤ 60 KB gzip
   - Total transfer ≤ 200 KB in ≤ 10 requests
   - Plausible as the only third party, deferred
   - No web fonts, or one preloaded subset of 25 KB or less
   - Images ≤ 50 KB each with dimensions set
   - No autoplay video

   Meeting the JavaScript figure implies a prerendered page that does not load the main app bundle.
8. The HTML served for `/start` and `/start/`, before any JavaScript runs, carries the page's own `<title>`, description, Open Graph tags and canonical URL, or `noindex,follow` (recommended while it is a social or paid landing). Link previews and crawlers read the served HTML, not a client-set title.

### 10.8 TikTok in-app browser
1. No new tabs, pop-ups or `window.open` on the conversion path. The Stripe redirect is same-tab.
2. Email verification uses an in-page code field with `autocomplete="one-time-code"`, and form state survives an app switch.
3. Attribution stays in the URL until it is stored server-side, so it survives "Open in browser."
4. Nothing depends on Apple Pay or Google Pay.
5. Before launch, run the full path to the chosen activation in TikTok's in-app browser on iOS and on Android.

### 10.9 Events
These fire with the §6.4 properties: `landing_view` (`page=start`, `hook_id`), `demo_interaction`, `cta_click` (`location` = hero, proof or sticky), `signup_start` (first field focus), `account_created`, `email_verified`, the activation event for the page's job, and `checkout_started` / `subscription_started` when a paid path exists. Every one is in the registry and has an emitter; CI checks both.

### 10.10 Attribution
1. The bio link follows §6.5, for example `https://r6coaching.com/start?utm_source=tiktok&utm_medium=social&utm_campaign=<series>&utm_content=<video_slug>`. Update it when the pinned video changes.
2. First and last touch are captured on first paint, persisted to the profile at account creation, and written into Checkout Session `metadata` and `subscription_data.metadata`.
3. The admin revenue view can group paid customers by `utm_content`.

### 10.11 Accessibility (WCAG 2.2 AA)
- One `h1`, `lang` set, landmarks and a skip link.
- Contrast per §7(f). Visible, unclipped focus that the sticky bar never hides.
- Visible labels. Errors tied to their fields and announced. Lock state in accessible names, not color alone. Reduced motion honored.
- A manual pass with VoiceOver, TalkBack and keyboard only.

### 10.12 First A/B test
Hook-matched H1 against a generic H1, nothing else changed; visitors split 50/50, sticky, randomized within each video's traffic. Primary metric: unique `cta_click` ÷ unique `landing_view`. Guardrails: `email_verified` ÷ `cta_click`, activation rate and LCP. Rules per §9 (about 800 visitors per arm at a 15% baseline and a +5-point lift); with less traffic, run it as a directional sequential test.

### 10.13 Definition of done
- [ ] `/start` and `/start/` return 200 with the page's own served head (10.7.8).
- [ ] Prices, trial and limits on the page equal the Stripe test-mode Checkout Session.
- [ ] Every §10.9 event appears in the analytics debug view with its properties. The activation event fires.
- [ ] Test sessions and subscriptions carry the attribution metadata.
- [ ] The lab gate and the literal-price and banned-phrase checks pass in CI.
- [ ] An end-to-end manual run to activation succeeds in TikTok's in-app browser on iOS and Android.
- [ ] Screenshots at 360, 390, 430 px and desktop are attached to the PR.

---

## 11. How to use this document

### 11.1 Which PRs cite which rules

| The PR touches | It must cite and pass |
|---|---|
| Any public page, generator or structured data | 1, 4, 5, 6, 7, 16, 17, 20; checklist (e) |
| A social or ad landing page | The above, plus 2, 3, 8, 10, 11, 18, 19; checklists (a) and (f); §10 when it is `/start` |
| Signup, auth or checkout | 3, 6, 9, 10, 11, 17, 18, 20; checklists (b) and (f) |
| Onboarding, lifecycle email or bots | 5, 6, 9, 10, 11, 17, 20; checklists (c) and (e) |
| Prices, plans, trials, limits, refunds or capabilities | 6, 7, 20; §5.6 procedure |
| Analytics or attribution | 11, 20; §6 |
| Admin or CRM | 12–17, 20; checklist (d); §8 |

### 11.2 PR description block

```
Standard rules applied: <numbers>
Checklists passed: <letters>, with any failing item explained
Product facts used: <catalog keys> (no literals added)
Truth conflicts found: <none, or a list; not resolved by guessing>
Events added or changed: <registry keys> → funnel question answered
Hypothesis and metric to watch: <text> (no conversion claims)
Exceptions: <rule #, reason, expiry, Aaron's approval link>
```

### 11.3 Exceptions

A rule may be waived only with Aaron's approval, recorded in the PR and in `docs/DECISIONS.md`. The record gives the rule number, the reason, the scope, an expiry date and the follow-up owner. An exception never covers Rule 5 (invented proof, urgency, popularity, scarcity or outcomes).

### 11.4 Changing this standard

- Anyone may open a PR that edits this file. Aaron approves.
- Each change updates the status table at the top and adds a line to the change log below.
- Weakening Rules 5, 6 or 7, or the §5.2 order of authority, needs an explicit decision from Aaron, recorded in `docs/DECISIONS.md`.

### 11.5 Change log

| Date | Change | Approved by |
|---|---|---|
| 2026-09-25 | First proposal | Pending |
