# Recon 6 growth, conversion and UX audit: 2026-09-25

**Status:** proposal for review. Docs only; nothing here is implemented. Findings are measured against the proposed [`docs/GROWTH-UX-OPERATING-STANDARD.md`](../GROWTH-UX-OPERATING-STANDARD.md).

**Commits checked** (fetched 2026-09-25):

| Line | Ref | SHA | Last commit |
|---|---|---|---|
| **main** | `origin/main` | `ede787e6db53d4f036581eb03d8d184d9e0c7860` | 2026-09-12 |
| **production branch** | `origin/content/strat-beta-disclaimer` | `8054871148fbc7ba3a503efcfa4c5f36fc9d13ca` | 2026-09-23 |
| Merge base | — | `a71f0cf1cff6ad8fbdad421230af24265fd3e5c1` | 2026-07-17 |
| `/start` (open PR #29, spot-check only) | `claude/recon6-social-sales-landing` | `341e076` | 2026-09-25 |

**Evidence notation:**
- `M path:line` is main at `ede787e`; `P path:line` is the production branch at `8054871`.
- Every P0 and P1 finding below was spot-checked at those SHAs.
- "Reported by PR #30" marks facts about what is *deployed*. PR #30 obtained them through read-only AWS checks; this audit did not repeat them.
- P2/P3 evidence comes from the three input audits (main at `873798a`, production at `36ebdec`/`8054871`) and was re-checked only where marked.

**Priorities:**
- **P0 revenue/truth:** money charged, owed or reported wrongly; a paid entitlement not delivered; legal terms wrong; a public claim false today; or an action that can remove paid access.
- **P1 conversion/usability.**
- **P2 optimization.**
- **P3 polish.**

**Line:** each finding says whether it applies to **main**, the **production branch**, or **both**.

---

## Executive summary

**First, the precondition: there is no single Recon 6 to fix yet (PT-01).**
- `main` and the production branch split on 2026-07-17. Since then there are 69 commits only on main and 63 only on the production branch, and 497 files differ.
- They sell different catalogs through different checkouts:
  - main: Recruit, Pro, and Champion as a $39 digital tier, bought through client-side Payment Links
  - production branch: Basic, Pro $12, Elite $39, and Champion as a $70 coaching membership, bought through server-created Checkout
- PR #30 reports that what is deployed is a mix: the admin Lambda is main's, while the subscription Lambda and the live homepage come from uncommitted work that is in neither branch.
- main's own GitHub workflow can redeploy the production subscription and admin Lambdas from main. main's subscription Lambda has no handler for the checkout route the production site calls.
- Every fix below depends on choosing one line and freezing deploys from the other.

**The P0s to decide first:**
1. **Trial terms have five different answers** (PT-03): public cards, the Terms page, the committed server checkout and the deployed checkout disagree. One decision fixes it: D4.
2. **Price shown ≠ price charged, and expired "founding, locked for life" copy** (PT-02, PT-04):
   - main's pricing cards and structured data still sell $9/$29 while checkout charges $12/$39.
   - 318 committed pages on main and 201 on the production branch carry founding copy.
3. **Paid promises with no mechanism** (PT-07 to PT-10):
   - the referral "free month" is never applied (both lines)
   - coaching refunds are promised but not implemented (main)
   - Champion's two included sessions can't be redeemed self-serve (production branch)
   - trialing subscribers are refused VOD review (main)
   - "Upgrade to Champion" double-bills (main)
4. **One admin button can remove paid access for every member** (AD-01): Reconcile/Backfill from Stripe.
5. **False public claims** (PT-05, PT-06, PT-11): the free tier is described as "every map"; the site shows hard-coded stars, "Most Popular", invented counts and a rank-ceiling claim; features that aren't shipped are sold as included.

**The top P1:** measurement stops at the click (AN-01, AN-02). No server record carries campaign attribution. The documented activation event (`Strat Viewed`) is emitted nowhere, including in the `/start` PR that relies on it.

### Decisions needed from Aaron

| # | Decision | Recommendation |
|---|---|---|
| **D1** | **Which branch is the production line to build on.** | Make `content/strat-beta-disclaimer` canonical: it is what customers use, and it already fixes main's worst defects (PT-07, PT-08, SC-01). First commit the uncommitted live work that PR #30 reports, then port main's unique work in small PRs: `invoice.payment_succeeded` handling, the player-data and member-profile work, and reconciliation PRs #15–#17. Until then, **freeze deploys from main**, including dispatching `deploy-member-profile-prod.yml`, and freeze deploys from dirty trees. |
| **D2** | **Which proposal to keep: this one or PR #30** (opened earlier the same evening, against the production branch). | Keep one standard file on the canonical line. Merge this PR's rule text, checklists and `/start` criteria with PR #30's deployed-state truth table and hostile-persona review. |
| **D3** | **Which plan catalog is correct.** | Confirm Basic/Pro $12/Elite $39/Champion $70 (production branch). Decide what main-era Champion ($29/$39 digital) and All-Access subscribers are now called and receive. |
| **D4** | **Trial policy per plan.** | Choose none, a 30-day card-up-front Pro trial, or a 7-day no-card trial. Then confirm what live checkout does: the deployed `trialDays` (PR #30 says 0) and, if any Payment Links are still active, their trial settings in Stripe. |
| **D5** | **Refund and coaching terms.** | Refund window measured from the first paid charge. Written coaching cancellation, refund and credit-restore rules. Until PT-10 is fixed, Champion copy should say how to book (for example "book with Aaron on Discord"). |
| **D6** | **All-Access subscribers.** | Count active All-Access subscriptions in Stripe. Restore multi-game access for them, or migrate and partly refund. |
| **D7** | **Referral reward.** | Implement the credit, make it an explicitly manual credit, or retire the promise. |
| **D8** | **The headline activation metric.** | Report both A1 (first chosen plan opened) and A2 (first own-round review). Pick A2 as the headline once there is a free path to it; `/start` (PR #29) currently targets A1. |
| **D9** | **Free tier.** | Keep two sample maps, but choose them from the current ranked pool; Coastline is out of ranked per main's rotation. Decide whether the static guides' free content is intended. |
| **D10** | **Reconcile/Backfill button.** | Disable it now. Before anyone runs it again, check the Stripe account's default API version. |
| **D11** | **`/start` weight budget.** | A prerendered static page meets the proposed 60 KB JS budget. PR #29 is an SPA route: a 14 KB chunk (per PR #29) on top of the shared bundle, which PR #30 reports as about 78 KB gzip. |
| **D12** | **How to market the desktop app.** | Confirm the wording ("Windows beta, not code-signed") and which plans it is promised to. |

### How this relates to open PRs

- **PR #30** (`claude/growth-ux-standard` → production branch) is a parallel proposal of the same standard and audit, opened earlier the same evening.
  - Where the two overlap, the findings agree.
  - PR #30 adds deployed-state checks this session could not make.
  - This audit adds per-line evidence at fixed SHAs, main-only defects, the source map below, the admin jobs inventory and a PR-by-PR plan.
  - They should become one document set after D1 and D2.
- **PR #29** (`/start`) is spot-checked against the standard's §10 in Appendix A.

---

## Product-truth source map

"True value" is what code or payment configuration enforces. Stripe-side values were not read.

| Fact | Where the true value lives | Public places that disagree |
|---|---|---|
| **Plan names** | No single source. main: `M src/config/stripe.js` plus webhook `getPlanFromPrice` (`M lambda/webhook/index.mjs:523`). Production: `P src/config/memberships.js` and `P lambda/subscription/membership-checkout.mjs:5-44`. | Refund page "reverts to the free Recruit plan" (`M src/pages/RefundPage.jsx:27`); Discord bot tiers (`M lambda/discord/index.mjs:122-124`); `CLAUDE.md` on both lines. |
| **Price for new subscribers** | The Stripe Price behind each ID (unverified). main: Payment Links resolve to $12/$39 after Aug 31 (`M src/config/stripe.js:33-37, 59-72`). Production: `P membership-checkout.mjs:5-44`, plus `*_CURRENT_AMOUNT` for display. | main cards $9/$29 (`M src/pages/LandingPage.jsx:298, 320`); JSON-LD 9.00/29.00 (`M index.html:70-79`); Discord "Champion — $29/mo" (`M lambda/discord/index.mjs:124`); generators and PressPage (PT-04). |
| **Founding price** | `founding.js:19`: ended 2026-08-31 (both lines). Existing founding subscribers keep their Stripe price. | 318 (main) / 201 (production) committed pages; blog and operator-post generators on both lines; `M CLAUDE.md:107`. |
| **Free vs paid** | `freeSample` maps Bank and Coastline (`M src/data/maps.js:16, 61`; `P :19, 64`) via the StratsPage gate. Own-round review needs an account plus a paid plan (`M src/pages/VodPage.jsx:281`; `P :273`). | See PT-05: hero, JSON-LD, og:description, manifest, WelcomeModal, VodPage, ExitIntentModal, CRM email, countdown. |
| **Trial** | No single source. main: Stripe Payment Link setting (unverified) plus a 7-day no-card trial (`M lambda/subscription/index.mjs:859-875`). Production: 30-day Pro trial (`P membership-checkout.mjs:23`). Deployed: none (reported by PR #30). | main cards "Start 30-day free trial" (`M LandingPage.jsx:919, 926`); production home "there is no free trial" (`P LandingPage.jsx:896`); production Terms "30-day trial" (`P TermsPage.jsx:17`); main Terms silent (`M TermsPage.jsx:17`). |
| **Refunds** | Policy text only; manual by email; no refund code or refund/dispute webhook events on either line. | main coaching page "covers every session" (`M public/coaching/index.html:117`); "If Recon 6 doesn't help you climb, we refund you" (`M LandingPage.jsx:825`); outreach FAQ "14 days" (`M .claude/outreach/faq/common-questions.md:45`). |
| **AI/VOD limits** | `lambda/vod/index.mjs`. main: Pro 5 screenshots/20 sessions; Champion 10/60 (`:89-90, :106-110`). Production: Pro 5/20; Elite 10/60; Champion 10/75 (`:92-93, :109-115`). | "unlimited VOD" (`M lambda/discord/index.mjs:124`); "1-10 screenshots" for everyone (`M WelcomeModal.jsx:119`, `P :126`, `M LandingPage.jsx:148, 256, 360`, `M index.html:126`); "across all 20 games" (`M VodPage.jsx:448`). |
| **Map/site/operator counts** | Data: 25 maps and 100 sites (`maps.js`, both lines); 48 operators (operator index, "48 operators"). | "107" sites (`M LandingPage.jsx:564`, `P :542`); "78" operators (`M :569`); "All 98 Guides" (`M :1064`) vs "62 posts" (`M DashboardPage.jsx:313`). |
| **Supported games** | R6 only (`M config/product-truth.json:2`; UI locked, `M src/hooks/useActiveGame.jsx:27-34`). The VOD API still accepts 20 game IDs (`M lambda/vod/index.mjs:35`). | PT-13: "11", "20", "10 games", "every FPS" and the multi-game Terms. |
| **Workbook price** | Production only: `WORKBOOK_AMOUNT = 14.99` (`P src/config/stripe.js:128-130`). Not on main. | No conflict found; not in the refund copy on main. |
| **Coaching price** | Booking Lambda price map: intro $20, single $40; add-on $70 for 2 credits (main) or Champion $70 membership (production). | Committed main coaching page "ongoing coaching plans launch soon" (`M public/coaching/index.html:111`) while its generator says $70/mo. |
| **Season/patch** | main: `r6PatchFacts.js`, `rankedRotation.js`, `utils/season.js`, countdown generator. Production: `r6-season.js`, `config/season.js`. External: Y11S3.1 per PRs #27/#28 (unverified). | PT-14: calendar badge vs data, "Y11S3 in ~0 days", Y11S2.2 in the AI-coach context and win-back email, three ranked-pool lists. |
| **Obsolete or unshipped features** | Desktop app: `shipped:false` (main) vs Windows beta 2.0.4, unsigned (production). All-Access: not sold. Review is screenshot-only. Weekly email: no sender. Referral credit: no fulfilment. | PT-11, PT-12, PT-09, AO-04. |

---

## 1. Product-truth conflicts

#### PT-01 · P0 · both: Three versions of the product, and deploy paths that can mix them
- **What is wrong:**
  - The lines diverged at `a71f0cf` (2026-07-17): 69 commits only on main, 63 only on the production branch, 497 files different.
  - Catalogs and checkouts differ. main uses client-side Payment Links (`M src/config/stripe.js:48-72`). The production site posts to `/me/membership-checkout` (`P src/lib/membershipCheckout.js:12` → `P lambda/subscription/index.mjs:258-259`), a route main's subscription Lambda does not have.
  - Each line lacks fixes the other has:
    - production only: trialing VOD access, Cognito's new-password challenge, account-bound checkout, portal upgrades
    - main only: `invoice.payment_succeeded` handling (`M lambda/webhook/index.mjs:85`; the production branch handles `invoice.paid` only, `P :89`) and the player-data and member-profile work
  - Deploys have no guard. `deploy.ps1` builds and syncs whatever is checked out, with no branch or clean-tree check (`M deploy.ps1:97, 111`; the production copy is the same).
  - main's `deploy-member-profile-prod.yml` can be dispatched manually (`workflow_dispatch`, lines 3–8) and updates `ghost-igl-subscription-api` and `ghost-igl-admin-api` from main. `deploy-player-data-prod.yml` runs `sam deploy` from main.
  - Reported by PR #30 (not re-verified): the deployed subscription Lambda contains uncommitted work (`trialDays: 0`), the deployed admin Lambda is main's, and the live homepage headline is in neither branch.
- **Why it matters:**
  - No catalog, copy fix or `/start` page has a known target.
  - Dispatching main's member-profile workflow would replace the production subscription Lambda with code that lacks the checkout route every production purchase uses. This is inferred from code, not tested.
- **Evidence:** the SHAs above; `M .github/workflows/deploy-member-profile-prod.yml:3-8` and its `--function-name ghost-igl-subscription-api` / `ghost-igl-admin-api` steps; `P src/lib/membershipCheckout.js:12`; `P lambda/subscription/index.mjs:258`; `M deploy.ps1:97, 111`.
- **Recommended change:**
  - Decide D1.
  - Commit the live uncommitted work (Aaron's machine).
  - Record the deployed commit for the site (`/version.json`) and for each Lambda (tag or env).
  - Make `deploy.ps1` refuse dirty trees and non-canonical branches.
  - Disable manual dispatch of main's deploy workflows until reconciled (PR #23 narrows one).
  - Port the other line's unique fixes in small PRs.
- **Expected metric:** regressions after deploy; fixes live ÷ fixes merged.
- **Implementation risk:** high for reconciliation (PR #24's description reports 39 conflicting files in an earlier merge attempt); low for the guards.

#### PT-02 · P0 · main: The price shown is not the price charged
- **What is wrong:**
  - The founding window closed on 2026-08-31 (`M src/config/founding.js:19`), so the Pro and Champion buttons now resolve to the regular $12/$39 links (`M src/config/stripe.js:33-37, 59-72`).
  - The cards still render `$9` and `$29` with the regular price struck through, "Founding rate — locked for life" and "MOST POPULAR". Nothing is gated on the date (`M src/pages/LandingPage.jsx:298-299, 303, 320-321, 324, 848-851, 854, 888`). The buttons use the resolved links (`:305, :326`).
  - JSON-LD offers "Pro (Founding)" 9.00 and "Champion (Founding)" 29.00 (`M index.html:70-71, 78-79`).
  - Commit `4a91a9e` (2026-07-12) records the same failure in July: "checkout was serving $39/no-trial".
  - On the production branch the card flips to the regular price when founding closes (`P LandingPage.jsx:803-805`).
- **Why it matters:** an advertised price that differs from the charge leads to refunds, disputes and Stripe account risk, and search snippets show the wrong price.
- **Evidence:** as cited.
- **Recommended change:** render price, strikethrough and badge from the catalog (standard §5), with founding gated on the date; generate JSON-LD from the catalog.
- **Expected metric:** checkout completion; refund and dispute rate.
- **Implementation risk:** low.

#### PT-03 · P0 · both: Trial terms have five different answers
- **What is wrong on main:**
  - Cards say "Start free for 30 days", "30-day free trial — card up front", "Start 30-day free trial" and "you're never charged" (`M LandingPage.jsx:301, 304, 307, 919, 926`).
  - A 30-day trial is documented only for the *founding* Payment Links (`M src/config/stripe.js:42-47`). The regular links served since Sept 1 (`:59, :63`) have no documented trial. Unverified: the Stripe setting.
  - A separate 7-day no-card Pro trial is granted only when the profile is saved (`M lambda/subscription/index.mjs:859-875`; `M src/components/ProfileSetupModal.jsx:143, 207`). It is promised in the sign-in wall, on the loadouts page and in the welcome email (`M src/components/SignInGate.jsx:65`; `M src/pages/LoadoutsPage.jsx:118`; `M lambda/crm/index.mjs:42`).
  - The Terms mention no trial (`M src/pages/TermsPage.jsx:17`).
- **What is wrong on the production branch:**
  - Server checkout gives Pro 30 days (`P lambda/subscription/membership-checkout.mjs:23`; applied at `P lambda/subscription/index.mjs:1203`). The Terms promise "a card-required 30-day trial" (`P TermsPage.jsx:17`), and the CRM sends "your trial ends" emails (`P lambda/crm/index.mjs:123-149`).
  - The same branch's homepage says "there is no free trial" and sets the Pro card to `trialDays: 0` (`P LandingPage.jsx:896, 241`).
  - There is no no-card trial on this line.
- **Deployed** (reported by PR #30): no trial on any tier.
- **Why it matters:** the legal page and checkout disagree. A buyer who expected a trial is charged on day 0 and disputes it.
- **Recommended change:** decide D4. Put one trial policy per plan in the catalog; checkout reads it; Terms, cards and emails render it; delete the rest.
- **Expected metric:** trial starts; trial→paid; dispute rate.
- **Implementation risk:** low for code. Needs legal sign-off, and affects revenue timing.

#### PT-04 · P0 · both: Expired "founding, locked for life" copy on hundreds of pages
- **What is wrong:**
  - main's generators emit it on every build:
    - `M scripts/generate-blog-posts.mjs:2501` ("Founding rate $9/mo.")
    - `M scripts/generate-guides.mjs:297` ("before May 31")
    - `M scripts/generate-tools-page.mjs:198` ("locked for life if you join before May 31, 2026")
    - `M scripts/generate-game-landing-pages.mjs:421`
  - The operator-post generator (`M scripts/generate-r6-operator-posts.mjs:869`, "until May 31 — locked in for life") isn't in `generate:all` (`M package.json:9`), so its 47 posts are frozen.
  - The press page repeats the May 31 founding offer (`M src/pages/PressPage.jsx:40, 55, 190`).
  - Committed public HTML files containing "Founding rate" or "locked (in) for life": **318 on main, 201 on the production branch**.
  - The production branch still emits the copy at `P scripts/generate-blog-posts.mjs:2444` and `P scripts/generate-r6-operator-posts.mjs:869`. Its post-build rewrite only matches "before May (8|31)" (`P scripts/prune-non-r6-output.mjs:48`), so both strings survive into `dist/`.
  - The deadline moved from May 8 to May 31 to Aug 31 (`M src/config/stripe.js:10-11`; commit `4a91a9e`).
  - main's `CLAUDE.md` tells every session to use "founding rate ends May 8" and "locked in for life" (`M CLAUDE.md:107`).
- **Why it matters:** it advertises a price nobody can get, and a deadline that moves is fake urgency (Rule 5). Both are ad-review risks.
- **Recommended change:**
  - Strip literal prices and dates from generators and render CTAs from the catalog.
  - Add the expiry gate and literal scan (standard §5.5).
  - Regenerate or prune the frozen pages.
  - Adopt "an announced deadline is never extended."
  - Fix `CLAUDE.md` (SEO-05).
- **Expected metric:** pricing tickets; refunds; ad approval.
- **Implementation risk:** low. Don't bump `dateModified` for CTA-only changes.

#### PT-05 · P0 · both: The free tier is described as "everything"; code gives two sample maps
- **What is wrong:**
  - Non-subscribers can open only the `freeSample` maps, Bank and Coastline (`M src/pages/StratsPage.jsx:115-123`; `M src/data/maps.js:16, 61`; `P StratsPage.jsx:118`; `P maps.js:19, 64`). Uploads need an account and a paid plan (`M VodPage.jsx:281`; `P :273`).
  - main says otherwise:
    - "No signup to try", "Free tier covers every R6 ranked map", "No credit card to try" (`M LandingPage.jsx:531, 550-551`)
    - JSON-LD "Every R6 ranked map … at no cost" (`M index.html:110`)
    - "every strat, every callout, every operator" (`M src/components/WelcomeModal.jsx:96, 113`)
    - "Free accounts can browse every strat" (`M VodPage.jsx:375`)
    - "Full R6 catalog." (`M src/pages/DashboardPage.jsx:254`)
    - the welcome email (`M lambda/crm/index.mjs:42`)
    - the countdown page (`M scripts/generate-countdown.mjs:118`)
  - The production branch says otherwise:
    - og:description "Every R6 site, every callout, every ban — pre-loaded" (`P index.html:19`)
    - the PWA manifest (`P public/manifest.json:4`)
    - WelcomeModal (`P :103, :120`) and VodPage (`P :347`)
    - "Full strat breakdowns for every R6 ranked site" (`P src/components/ExitIntentModal.jsx:93`)
    - the welcome email (`P lambda/crm/index.mjs:51`)
    - the countdown (`P scripts/generate-countdown.mjs:135`; PR #28 fixes this one)
- **Why it matters:** it is the first promise a TikTok visitor tests, and it fails. The false claim also sits in structured data and share previews.
- **Recommended change:** a `freeTier` record in the catalog; every free-tier line renders from it; decide D9.
- **Expected metric:** signup→upgrade rate; bounce on `/vod`.
- **Implementation risk:** low.

#### PT-06 · P0 · both: Invented or unsupported proof, popularity and counts
- **What is wrong:**
  - **Stars:** five stars are hard-coded on every testimonial (`M LandingPage.jsx:600`; `P :596`). The testimonial form has no rating, consent or verification fields (`M src/components/admin/TestimonialBuilder.jsx:29-36`).
  - **Testimonials:** main's heading says "Real climbs from R6 players who use Recon 6" (`M :595`), while the code calls the stored entry "the founder review" (`M src/hooks/useTestimonials.js:39`).
  - **"MOST POPULAR"** with no data behind it (`M :854`; `P :809`).
  - **Counts:**
    - "107" sites (`M :564`; `P :542`); the data has 100 on both lines
    - "78 Operators Indexed" (`M :569`); the operator index lists 48
    - "All 98 Guides" (`M :1064`) and "62 posts" (`M DashboardPage.jsx:313`) disagree with each other and with the roughly 85 committed R6 posts
  - **main only:**
    - "Recon 6 has helped players break through every rank ceiling in Siege." (`M :793`)
    - "Written by players, not AI-generated SEO mush." (`M :1015`), although premium tactics and 15 maps' strats are generator output (`M src/data/premium-tactics.js:1-3`; `M scripts/generate-comingsoon-strats.mjs:2-6`)
  - **Unsourced precision:** `pickRate: 87` and "(65% of rounds)" (`M/P src/data/enemyMeta.js:7, 13`); "Data-driven ban targets" (`M :154`).
  - **Referral page:** it speaks for the referrer, "… thinks you'd climb faster" (`M src/pages/ReferralLandingPage.jsx:98`).
- **Why it matters:**
  - The FTC reviews rule covers fake reviews and indicators.
  - Ad platforms reject unverifiable claims.
  - Players discount everything once they spot one invented number.
- **Recommended change:**
  - Remove each item, or give it a source.
  - Compute counts at build time.
  - Testimonials need consent, a verified customer and a date.
  - Label estimates.
  - Write the referral line as "<name> sent you an invite."
- **Expected metric:** trust (qualitative); ad approval; refunds.
- **Implementation risk:** low.

#### PT-07 · P0 · main: Stripe-trialing customers are refused VOD review
- **What is wrong:**
  - The VOD Lambda accepts only `status === 'active'` (`M lambda/vod/index.mjs:412, 578`) and otherwise returns 402 "VOD review requires Pro or Champion" (`:417-421`).
  - `/me` grants the plan for `trialing` (`M lambda/subscription/index.mjs:243`), and the webhook stores `trialing` on later updates (`M lambda/webhook/index.mjs:409`).
  - The VOD Lambda also ignores comp expiry, so an expired no-card trial row (status `active`) can win over a paid row (`M vod:578` vs `M subscription:244-247`).
  - The production branch has fixed this (`P lambda/vod/index.mjs:384, 657-683`). Which VOD code is deployed is unverified.
- **Why it matters:** the flagship paid feature fails for exactly the customers deciding whether to keep paying.
- **Recommended change:** close it through reconciliation (D1); one shared entitlement function with a parity test.
- **Expected metric:** activation A2; trial→paid.
- **Implementation risk:** medium (Bedrock spend for trialists).

#### PT-08 · P0 · main: "Upgrade to Champion" creates a second subscription
- **What is wrong:**
  - For a Pro subscriber, the upgrade button opens a new Payment Link checkout in a new tab (`M src/components/strats/ChampionGate.jsx:19, 44-47`).
  - The webhook treats Pro→Champion as legitimate (`M lambda/webhook/index.mjs:159`). The only subscription mutation in any Lambda is the duplicate-signup cancel (`M :212`), so the Pro subscription keeps billing.
  - The plan shown afterwards depends on row order: `/me` takes the first matching row (`M lambda/subscription/index.mjs:223`) from a hash-only email index (`M aws/template.yaml:275-278`).
  - The production branch sends existing subscribers to the Stripe portal instead (`P lambda/subscription/index.mjs:1177-1182`).
- **Why it matters:** double billing leads to refunds and chargebacks.
- **Recommended change:** close through reconciliation. Then audit Stripe for customers holding two live Recon subscriptions and refund them (unverified whether any exist).
- **Expected metric:** duplicate live subscriptions; refunds.
- **Implementation risk:** medium.

#### PT-09 · P0 · both: The referral "free month" is promised but never applied
- **What is wrong:**
  - The dashboard says "Your next bill is on us. The credit applies automatically." (`M/P src/components/dashboard/ReferralsWidget.jsx:92`).
  - The code returns `comp_active_this_cycle: false` and defers to "the daily cron" (`M lambda/subscription/index.mjs:616-619`; `P :848-851`). No such cron or Stripe credit code exists on either line.
  - Referral codes are looked up with a DynamoDB `Scan` using `Limit: 1` before the filter (`M :431-433, :476-478`; `P :661-665, :710`). That examines one item per call, so most valid codes return "not found".
- **Why it matters:** a promised credit never arrives, and referral attribution is mostly lost.
- **Recommended change:** decide D7. Implement an idempotent Stripe customer-balance credit and an index lookup, or change the copy.
- **Expected metric:** referral signups; referral tickets.
- **Implementation risk:** medium.

#### PT-10 · P0 · both: Coaching refund promises and session credits don't match the code
- **What is wrong on main:**
  - "The 7-day money-back guarantee covers every session" (`M scripts/generate-coaching-page.mjs:48`; `M public/coaching/index.html:15` in the FAQ JSON-LD, and `:89, :117`).
  - The refund policy covers Pro and Champion only (`M src/pages/RefundPage.jsx:8`).
  - Customer and admin cancellations free the slot and send an email, with no refund and no credit restore (`M lambda/booking/index.mjs:653-663, 786-798`).
  - Add-on credits are spent for whoever types a member's email; there is no identity check (`M :566-572`).
- **What is wrong on the production branch:**
  - The guarantee is gone, and the refund policy excludes coaching (`P RefundPage.jsx:8`).
  - Champion ($70) includes "two live sessions" (`P LandingPage.jsx:896`; `P scripts/generate-coaching-page.mjs:36`).
  - Credits are spent only for an authenticated caller (`P lambda/booking/index.mjs:692-696`), but the coaching page never sends a token (`P public/coaching/index.html:294-302`). Champions are sent to paid checkout for sessions their plan includes (matches PR #30 P0-3).
- **Why it matters:** customers pay twice for included sessions or get no refund for a cancelled paid session, which leads to disputes. On main, credits can be spent by someone else.
- **Recommended change:**
  - Put coaching terms in the catalog.
  - The booking page sends the token and shows the credit balance.
  - The admin cancel flow prompts for a refund or credit restore (AD-04).
  - Interim Champion copy per D5.
- **Expected metric:** coaching disputes; Champion retention; bookings per Champion.
- **Implementation risk:** medium (booking payment path).

#### PT-11 · P0 · both: Features sold beyond what ships
- **What is wrong on main:**
  - Champion includes "the desktop coach app" and "Real-time 5-stack team sessions + voice callouts", shown as enabled (`M src/pages/DashboardPage.jsx:353`; `M src/pages/AccountPage.jsx:311`; `M src/components/strats/ChampionGate.jsx:23`; `M src/pages/ActivatePage.jsx:106-107`). The desktop app is `shipped: false` (`M config/product-truth.json:4-9`).
  - The Discord bot's `/pricing` says "Champion — $29/mo · Everything + desktop app, team tools, unlimited VOD" and "Pro … Live AI callouts" (`M lambda/discord/index.mjs:123-124`).
  - Champion is sold on "Recurring-weakness reports across all your sessions", "A weekly drill list" and "death-cause tracking across sessions" (`M LandingPage.jsx:332-333, 496`; `M index.html:126`). The VOD prompt schema is identical for every tier (`M lambda/vod/index.mjs:232-236`).
- **What is wrong on both lines:**
  - Pro results already contain the drill list, yet the upsell under a Pro result sells it again (`M src/components/vod/SessionResults.jsx:198`; `P :198`, which says "Upgrade to Elite").
  - "Recon 6 Pro reads your replays" appears in blog and operator CTAs (`M scripts/generate-blog-posts.mjs:2501`; `P :2444`; `M/P scripts/generate-r6-operator-posts.mjs:869`). Review is screenshot-only: the video and link inputs are `available: false` (`M VodPage.jsx:265-266`).
  - "Paste 1-10 screenshots" is shown to everyone (`M WelcomeModal.jsx:119`; `P :126`), although Pro is capped at 5 (`M vod:89`; `P :92`).
- **What is wrong on the production branch:**
  - The Download page tags six PC extras "Now" (`P src/pages/DownloadPage.jsx:26-31`) directly under a comment saying they must stay false until the installer is downloadable (`:22-24`). The same page says "Early access", "PC Beta" and "isn't code-signed yet" (`:140-143, 160, 193`).
  - The FAQ says "No download or installation is required" (`P index.html:127-130`), while every paid plan includes the desktop coach (`P LandingPage.jsx:248, 266, 896`).
- **Why it matters:** customers pay for things that don't exist, which leads to refunds and churn.
- **Recommended change:** a `capabilities` record (shipped/beta/planned) in the catalog; render every capability claim from it, including the Discord response; fix the Pro-result upsell.
- **Expected metric:** 7-day refunds and churn; upgrade rate.
- **Implementation risk:** low for copy; medium to build the features.

#### PT-12 · P0 if active All-Access subscriptions exist, otherwise P1 · both: All-Access is still recorded and advertised but can't be used
- **What is wrong:**
  - The webhook still records `tier_scope: 'all_access'` for All-Access prices (`M lambda/webhook/index.mjs:548-556`).
  - The UI locks everyone to R6 (`M src/hooks/useActiveGame.jsx:27-34`), even though its comment cites "existing All-Access subscribers' entitlements".
  - main upsells "Champion All-Access … across all 20 games" (`M VodPage.jsx:448`).
  - 719 committed `/games` pages describe All-Access (for example `M public/games/cs2/index.html:7`) and ship in main's build. The production branch removes `dist/games` (`P scripts/prune-non-r6-output.mjs:22`).
  - Unverified: the number of active All-Access subscriptions.
- **Why it matters:** customers paying for multi-game access can't reach it.
- **Recommended change:** decide D6; remove All-Access copy.
- **Expected metric:** All-Access refunds and churn.
- **Implementation risk:** medium (refunds; SEO traffic from `/games`).

#### PT-13 · P1 · both: Supported games are stated five ways
- **What is wrong on main:**
  - "Choose one of the 11 supported games" (`M LandingPage.jsx:253`)
  - "Pro applies to one game of your choice — switch in the sidebar anytime" (`M :315`)
  - "all 20 supported games" (`M src/pages/LoadoutsPage.jsx:117`; `M src/pages/MatchPrepPage.jsx:73`; `M src/pages/ReferralLandingPage.jsx:111`; `M VodPage.jsx:448`)
  - "20 competitive games" (`M src/pages/PressPage.jsx:16, 52`)
  - Terms list nine other titles as "rolling out" (`M TermsPage.jsx:11`)
  - "Climb faster in every FPS you play." (`M src/components/Footer.jsx:33`)
  - the homepage "Free Guides" section links seven non-R6 posts (`M LandingPage.jsx:1011-1034`)
- **What is wrong on the production branch:** generator footers say "coaching across 20 competitive games" and "AI-powered FPS coaching across 10 games" (`P scripts/generate-blog-posts.mjs:126`; `P scripts/generate-r6-operator-posts.mjs:707`).
- **Guard gap:** main's truth check scans only named files (`M scripts/check-product-truth.mjs:29-42`).
- **Why it matters:** it confuses R6 visitors and contradicts "built for Siege".
- **Recommended change:** `marketedGames: ["r6"]` in the catalog; a scan over `src/**` and `dist/**`; decide whether the VOD API should reject non-R6 games (`M lambda/vod/index.mjs:35`).
- **Expected metric:** bounce; trust.
- **Implementation risk:** low.

#### PT-14 · P1 · both: Season, patch and ranked pool disagree across sources
- **What is wrong on main:**
  - The hero season badge comes from the calendar (`M LandingPage.jsx:488`), next to "⏳ Y11S3 in ~0 days" (`M :29, :546`).
  - The data says Y11S2.2 (`M src/data/r6PatchFacts.js:4`; `M src/data/rankedRotation.js:5-7`).
  - The AI coach is grounded in Y11S2.2 (`M lambda/vod/r6-context.json:35-36`), and the win-back email says "updated for Y11S2.2" (`M lambda/crm/index.mjs:49`).
- **What is wrong on the production branch:** the current season is still Y11S2.2, with `reviewDue: '2026-09-01'` already past (`P src/data/r6-season.js:6-10`). PRs #27 and #28 (open, production-only) move it to Y11S3.1 Operation Split Fire; those external facts were not verified here.
- **Three ranked-pool lists:**
  - main's rotation includes Skyscraper and not Fortress (`M rankedRotation.js:9-15`).
  - The production `maps.js` pool includes Coastline, Emerald Plains, Outback and Fortress, and excludes Kanal, Theme Park and Villa.
  - The production `r6-season.js` list includes Kanal, Theme Park, Villa and Fortress, and excludes Coastline, Emerald Plains, Outback and Skyscraper (`P :18-33`).
  - The free sample Coastline is out of ranked per main's own rotation (`M rankedRotation.js:10`).
- **Why it matters:** R6 players spot stale meta immediately.
- **Recommended change:** one season record, with ranked map IDs and `reviewDue`, in the catalog; regenerate the AI-coach context; remove the calendar badge; pick free samples from the current pool.
- **Expected metric:** trust; return visits.
- **Implementation risk:** low (the ranked list needs re-verification against Ubisoft).

#### PT-15 · P1 · both: Refund wording varies and the window is ambiguous
- **What is wrong on main:**
  - The policy says "within 7 days of your initial purchase", for Pro and Champion only (`M RefundPage.jsx:8`). That is ambiguous when the first charge comes on day 30.
  - The homepage says both "7-day money-back on any plan" (`M :552`) and "If Recon 6 doesn't help you climb, we refund you" (`M :825`).
  - The outreach FAQ says 14 days (`M .claude/outreach/faq/common-questions.md:45, 159`).
- **Production branch:** "within seven days of your first paid membership charge", excluding coaching (`P RefundPage.jsx:8`). This is the model to keep.
- **Why it matters:** refund disputes.
- **Recommended change:** a `refunds` record in the catalog; mark the outreach FAQ do-not-publish or fix it.
- **Expected metric:** refund disputes.
- **Implementation risk:** low (legal sign-off).

---

## 2. Conversion leaks

#### CL-01 · P1 · main (production branch partly fixed): The homepage has no single job, and its hook doesn't match the videos
- **What is wrong:**
  - The H1 reads "AI-augmented coaching for Rainbow Six." with a four-line subtitle (`M LandingPage.jsx:490-499`).
  - Three equal hero buttons serve three jobs: $20 coaching, the VOD sample, and pricing (`M :503-528`). Below them sit "Or browse R6 Strats", "Try Live Coach" and a countdown link (`M :539-546`).
  - The nav's only CTA is coaching (`M src/components/Navbar.jsx:238`), while the compare table says "No scheduling needed" and "Human coaching can cost $50+/hour" (`M :269, :763`).
  - The videos hook on lost rounds (PR #19 posting pack), and the bio link lands on `/`.
  - The production branch has one primary CTA plus one text link (`P LandingPage.jsx:524-539`). PR #30 reports the live homepage differs from that branch (unverified).
- **Why it matters:** short-video visitors decide in seconds, and split intent lowers every path's click-through.
- **Recommended change:** send social traffic to `/start` (standard §10); give `/` one primary job.
- **Expected metric:** visit→primary-CTA click-through; bounce.
- **Implementation risk:** medium.

#### CL-02 · P1 · both: Dead ends for signed-out visitors
- **What is wrong:**
  - Locked map cards are `disabled` buttons (`M/P src/components/strats/MapSelector.jsx:71`) labelled "Start free trial" (`M :47`) or "See Pro options" (`P :47`), with a "🔒 TRIAL" badge (`M/P :139`).
  - Locked deep links from static guides silently redirect to `/strats` (`M StratsPage.jsx:133`; `P :136`).
  - "Sign Up Free" leads to `/auth`, which opens in sign-in mode (`M ProGate.jsx:40-41`, `P :35-36`; `M AuthPage.jsx:26`, `P :30`).
  - Live Coach shows a sign-in wall, then "Live Coach is a Pro feature" (`P LiveCoachPage.jsx:240, 255`; main has the same sign-in gate at `:239`).
- **Why it matters:** each is a tap that produces nothing, and on mobile the visitor leaves.
- **Recommended change:** turn locked cards into links that give the reason; show an interstitial for locked deep links; add `mode=signup` to every sign-up link; label gated features before signup.
- **Expected metric:** click-through on locked content; signup starts; guide bounce.
- **Implementation risk:** low.

#### CL-03 · P1 · both: Pricing links don't show the plans
- **What is wrong:** on main, in-app `/#pricing` links don't scroll to pricing (acknowledged in `M src/utils/sectionLink.js:4-8`). On the production branch, Elite and Champion are collapsed behind "Compare Elite and Champion" (`P LandingPage.jsx:893`).
- **Why it matters:** a visitor sent to compare plans sees one.
- **Recommended change:** expand plans on `#pricing`, add a deep link per plan, and scroll to the hash on mount.
- **Expected metric:** pricing CTA clicks by plan.
- **Implementation risk:** low.

**CL-04 · P2 · main · Vague hero copy.**
- **What:** "AI-augmented coaching", "a full AI staff" (`M LandingPage.jsx:490-499`), while concrete artifacts exist: the sample breakdown and the per-site plans.
- **Why:** specific artifacts convert cold visitors; the hooks promise "why you lost."
- **Evidence:** as cited (artifacts per the funnel audit).
- **Change:** show one real, labelled sample next to the CTA.
- **Metric:** CTA click-through.
- **Risk:** low.

**CL-05 · P3 · both · Testimonial quotes render a literal `“`.**
- **What:** JSX text doesn't process escape sequences.
- **Why:** it looks broken.
- **Evidence:** `M LandingPage.jsx:601`; `P :597`.
- **Change:** use `{'“'}` or literal quotes.
- **Metric:** polish.
- **Risk:** trivial.

---

## 3. Navigation and information architecture

#### IA-01 · P1 · both: Directory URLs serve the app shell and bounce to the homepage
- **What is wrong:**
  - CloudFront maps 403 and 404 to `/index.html` with status 200 (`M aws/template.yaml:192-198`; `P :191-196`).
  - The directory-index function `aws/cloudfront-directory-index.js` exists on both lines, but no template associates it: zero `FunctionAssociations`.
  - The SPA catch-all redirects to `/` (`M src/main.jsx:201`; `P :217`).
  - In-app links point at directory URLs: `M Footer.jsx:51, 56, 57`; `M Navbar.jsx:329`; `M DashboardPage.jsx:311`; `M LandingPage.jsx:545, 1064`; `P Footer.jsx:59`; `P Navbar.jsx:360`; `P DashboardPage.jsx:373`; `M/P ExitIntentModal.jsx:111`.
  - PR #30 reports that live `/blog/`, `/guides/`, `/tools/`, `/climb/`, `/countdown/`, `/coaching/` and `/status/` all end on `/` (it rated this P0).
- **Why it matters:** the SEO hubs and the coaching sales page are unreachable at their canonical URLs.
- **Recommended change:** attach the viewer-request function to distribution `E2WUR8DDHCOYC9` (an AWS change for Aaron, with a rollback plan); serve real 404s for unknown paths.
- **Expected metric:** organic landings on static pages; coaching bookings.
- **Implementation risk:** medium (production CDN change).

#### IA-02 · P1 · both: No visible call to action in the mobile nav
- **What is wrong:** the only persistent CTA sits in `navbar-desktop-only` (`M Navbar.jsx:231, 237-238`; `P :221, 237`). The signed-out drawer has no free-value path (per the funnel audit).
- **Why it matters:** most social traffic is on phones.
- **Recommended change:** one compact CTA in the mobile bar, plus "Try a free plan" in the drawer.
- **Expected metric:** mobile click-through.
- **Implementation risk:** low.

**IA-03 · P2 · both · The public site is split across unrelated shells and brands.**
- **What:** "RECON+" blog wordmark, extra font families on `/climb/`, separate navs on static pages (funnel audit).
- **Why:** brand and navigation inconsistency.
- **Evidence:** `scripts/generate-blog-posts.mjs:115` (funnel audit).
- **Change:** shared header and footer partial, one wordmark.
- **Metric:** navigation success.
- **Risk:** low.

**IA-04 · P2 · both · Overlapping page sets compete for the same queries.**
- **What:** 47 `r6-operator-*` blog posts plus 48 operator guide pages on both lines; maps covered by four page types.
- **Why:** they split ranking signals.
- **Evidence:** file counts at both SHAs.
- **Change:** one canonical page per intent.
- **Metric:** organic clicks per page.
- **Risk:** medium.

---

## 4. Signup and checkout friction

#### SC-01 · P0 · main: Paying before having an account strands buyers; checkout isn't bound to an account
- **What is wrong:**
  - Pricing buttons open Payment Links in a new tab with no email or ID attached (`M LandingPage.jsx:909-911`; `M ChampionGate.jsx:45-47`).
  - The webhook links a payment to an account by email only (`M lambda/webhook/index.mjs:187`) and auto-creates a Cognito user with an emailed temporary password (`M :319-326`).
  - `/auth?checkout=success` then tells the buyer to sign up with the same email (`M src/pages/AuthPage.jsx:52-56`), in a page that defaults to sign-in (`:26`).
  - Nothing in main's `src/` handles Cognito's `NEW_PASSWORD_REQUIRED` challenge.
  - The production branch fixed both: server sessions with `client_reference_id` (`P lambda/subscription/index.mjs:1189`) and challenge handling (`P src/hooks/useAuth.jsx:183`).
- **Why it matters:** the most valuable visitor, one who just paid, can't get in. The code comment records "2 of the first 4 paying customers" orphaning themselves.
- **Recommended change:** close through reconciliation (D1).
- **Expected metric:** paid→signed in within 24 hours; refunds; support tickets.
- **Implementation risk:** high if rebuilt on main; low if the production branch becomes canonical.

#### SC-02 · P1 · both: Signup form friction, and a password-rule mismatch on the production branch
- **What is wrong:**
  - On the production branch, the form says and accepts "Min 8 characters" (`P AuthPage.jsx:253`), but the pool requires 12 (`P aws/template.yaml:230`; PR #30 read the live pool as 12). Passwords of 8–11 characters fail after submit. PR #29 fixes this.
  - On main, the placeholder says "Min 8 characters, mix of letters and numbers" (`M AuthPage.jsx:202`), while the pool requires 6 characters and no character classes (`M aws/template.yaml:232-234`).
  - main has no `autoComplete` attributes on the auth inputs, and input text is 0.9 rem (`M src/pages/AuthPage.css:41`), so iOS zooms.
  - `Signup Started` fires after the account is created (`M AuthPage.jsx:80`).
  - The production branch requires a Full Name at signup (`P :334`).
- **Why it matters:** field friction and late errors cost signups, and TikTok visitors sign up on phones.
- **Recommended change:** show and enforce the password rule from one config; add `autocomplete`; 16 px inputs; plain-language Cognito errors; fire `signup_start` on first focus; drop Full Name.
- **Expected metric:** signup completion.
- **Implementation risk:** low.

#### SC-03 · P1 · both: Coaching checkout lacks measurement and recovery
- **What is wrong:**
  - No generated page on either line loads Plausible, including the coaching page.
  - Stripe's `cancel_url` `?cancelled=1` is not handled by the page (`M lambda/booking/index.mjs:581`; `P :708`; no handler in either generator).
  - A slot is held for 5 minutes (`M :65`; `P :67`), shorter than a typical mobile checkout.
  - On main, `confirmHeld` confirms the slot without checking the payer's hold token (`M :418-429`). The production branch checks it (`P :496`).
- **Why it matters:** on main, coaching is the hero's primary CTA, yet its funnel is invisible. An expired hold can confirm the wrong person's booking.
- **Recommended change:** add analytics to static pages; handle `cancelled=1` by releasing the hold and showing a message; hold for the checkout's lifetime; verify hold ownership.
- **Expected metric:** slot→paid conversion; support tickets.
- **Implementation risk:** medium.

#### SC-04 · P1 · both: The duplicate-signup guard cancels a charged duplicate without refunding it
- **What is wrong:** when someone checks out twice, the second subscription is cancelled with no refund (`M lambda/webhook/index.mjs:208-231`; `P :321-336`). That is harmless on trial links but charges the customer on no-trial links.
- **Why it matters:** money is taken for a subscription that is immediately cancelled.
- **Recommended change:** refund the latest invoice when cancelling a charged duplicate.
- **Expected metric:** refund tickets.
- **Implementation risk:** low.

**SC-05 · P2 · main · Checkout opens in new tabs, and payment badges are unverified.**
- **What:** Payment Links use `target="_blank"` (`M LandingPage.jsx:911`; `M ChampionGate.jsx:47`); the footer shows PayPal and Apple Pay badges (`M Footer.jsx:97-104`).
- **Why:** new tabs misbehave in in-app browsers, and the badges may be untrue.
- **Evidence:** as cited; payment methods unverified.
- **Change:** same-tab checkout; check the methods in Stripe and remove badges that aren't enabled.
- **Metric:** mobile checkout completion.
- **Risk:** low.

---

## 5. Activation and onboarding

#### AO-01 · P1 · both: Activation is undefined, and the first own-round review takes 12+ steps
- **What is wrong:**
  - No emitted activation event exists on either line.
  - The definitions in flight disagree:
    - PR #24: "profile complete + one core action"
    - PR #29: "opened a plan", via `Strat Viewed`, which nothing emits (AN-02)
    - the funnel audit: "first own-round review"
  - On main, reaching one's own review takes an account, an emailed code and a profile with required first and last names (`M ProfileSetupModal.jsx:91`). The trial is granted only on profile save (`:143`) and mentioned only on step 2 (`:201-207`). "Skip for now" skips the trial too (`:192`).
  - The production branch has no no-card trial, so own-round value requires payment. Free value is the two sample maps.
- **Why it matters:** Rule 9. Signups can't be judged without an activation measure.
- **Recommended change:** decide D8 (A1/A2 per standard §6.2); defer the profile until after first value; grant any trial at verification.
- **Expected metric:** activation rate; time to first value.
- **Implementation risk:** medium.

#### AO-02 · P1 · both: Onboarding modals stack over the first value
- **What is wrong:**
  - The layout mounts the welcome and profile modals together (`M src/components/Layout.jsx:35-36`; `P :38-39`).
  - The role question is asked twice, with different lists (`M src/components/WelcomeModal.jsx:13-20` vs `M ProfileSetupModal.jsx:42`).
  - The profile inputs use `.testi-input`, which is defined only in the admin stylesheet (`M src/pages/AdminPage.css:655`). Non-admins get unstyled inputs under 16 px on both lines.
  - PR #29 defers both modals, but only for `/start` signups.
- **Why it matters:** first value is covered by forms.
- **Recommended change:** one modal at a time, after first value; one role list; shared input styles.
- **Expected metric:** activation; onboarding completion.
- **Implementation risk:** low.

#### AO-03 · P1 · both: Lifecycle emails have no opt-out or postal address
- **What is wrong:**
  - On main, the welcome and win-back emails are plain text with no unsubscribe link or address (`M lambda/crm/index.mjs:39-49`). The send wrapper adds no footer or `List-Unsubscribe` header (`:53-59`). Recipient selection does respect consent and suppression (`:152-153`).
  - On the production branch, the trial emails are the same (`P :90-149`; wrapper `:206-212`).
  - main's win-back email hard-codes "Y11S2.2" (`M :49`).
- **Why it matters:** compliance (CAN-SPAM for marketing email; confirm with counsel), and people mark mail without an unsubscribe as spam.
- **Recommended change:** a footer with unsubscribe and postal address, plus `List-Unsubscribe`, on marketing mail; season text from the catalog.
- **Expected metric:** complaint and unsubscribe rates.
- **Implementation risk:** low.

**AO-04 · P2 · main · The newsletter promises weekly emails that no sender delivers.**
- **What:** "Weekly strats and patch updates incoming", but signups go to Formspree and `localStorage` only.
- **Why:** a broken promise with no event to measure it.
- **Evidence:** `M src/components/EmailCapture.jsx:13-18, 36`; rendered at `M LandingPage.jsx:1002`. The production branch doesn't render it.
- **Change:** remove it, or build the sender with double opt-in.
- **Metric:** email→return visits.
- **Risk:** low.

**AO-05 · P2 · main · The new-user dashboard has no next action.**
- **What:** "Pick up where you left off" and tool cards, with no checklist or trial status (funnel audit; the "Full R6 catalog" truth part is in PT-05).
- **Why:** there is no path to activation.
- **Evidence:** `M DashboardPage.jsx:247-254` (funnel audit).
- **Change:** a 3-item checklist whose first mission is the activation task.
- **Metric:** activation; D1/D7 return.
- **Risk:** low.

---

## 6. Admin usability

### 6.1 Admin jobs inventory

From the admin audit (main at `873798a`, production branch spot-checked). "Today" means the current console.

| Job type | Jobs and questions | Supported today? | Main gap |
|---|---|---|---|
| **Daily** | Is any payer blocked (failed payment, paid but can't log in)? Today's sessions. Support replies. Growth routine. New signups. | Partly | No attention queue; sessions sit in a second tab; support lives in Gmail; the routine is saved in one browser |
| **Weekly** | Monday numbers (MRR, customers, churn). Lifecycle review. Coaching availability. Expiring comps and trials. Post-patch content check. Which channels work. | Partly or no | Trials, cancellations and cash are hidden; CRM results aren't shown; the availability editors conflict; no patch queue; no channel view |
| **Rare / maintenance** | Reconcile with Stripe. Site banner. Hero video and testimonials. Export. System health. Key rotation. Audit review. | Yes, but risky | Reconcile is one click; health checks aren't in the console; audit is partial |
| **High-risk** | Refunds. Deleting accounts. Plan changes. Bulk sends. Comps. Cancelling sessions. Credential changes. | Mixed | Refunds aren't linked to cancellations; delete can't be undone; exports ignore consent; no MFA |
| **Revenue** | MRR now? Cash this month? Who is failing to pay? Who is cancelling? Which trials convert? Coaching and workbook revenue? Refunds and disputes? By channel? | Mostly no | The money figures can be estimates without saying so; refunds and disputes aren't recorded |
| **Customer / support** | Is this person paying? Can they log in? What have they used? Their bookings and credits? Did they get our emails? Are they inside the refund window? | Partly | No single member record; credits and email history are invisible |
| **Marketing / growth** | Where do signups come from? What converts? Reddit opportunities? Social proof? Referrals? | No | Source is per row only; the Reddit digest is public; testimonials lack consent |
| **Coaching / appointments** | Who's next? Opening and closing time. No-shows. Abandoned checkouts. Follow-ups. Credits. | Partly | No no-show status; abandoned checkouts appear as "held"; credits invisible |
| **Content** | What exists? What went stale after a patch? Banner and hero video? | Partly | The patch watcher's queue has no surface |

### 6.2 Proposed job-based information architecture

**Navigation, in order of frequency:**

| Section | Contents |
|---|---|
| **Today** (default) | The six blocks below |
| **Members** | Directory with saved views; the member record (billing and access, activity, coaching, messages, history); access grants |
| **Coaching** | Upcoming list (default); calendar; availability; follow-ups; credits; checkout leads |
| **Revenue** | MRR, cash, trials, cancellations, churn, refunds and disputes, revenue by product, each with its source and time |
| **Growth** | Funnel by channel and video; routine; Reddit opportunities (private); testimonials with consent |
| **Content** | Patch freshness queue; catalog coverage; banner; hero video |
| **System** (overflow menu on phones) | Health; Reconcile (dry run); data requests; audit; integrations and keys; build info (branch and commit) |

**Today's first screen has exactly six blocks.** Each collapses to one line when empty.

| Block | Built from (existing or small new endpoints) |
|---|---|
| **What needs attention now** (at most 5) | Paid-without-account, disputes with deadlines, refunds owed, payments failing 3+ days, sessions within 2 hours: `/admin/users` snapshot, booking rows, new refund and dispute webhook events |
| **Revenue/customer changes worth noticing** | Live Stripe snapshot (`M lambda/admin/stripe-revenue.mjs`), cached, with a source badge |
| **Outstanding customer problems** | PR #24's queue, once deployed; until then derived from `/admin/users` plus the CRM log |
| **Appointments/actions due** | Bookings in the next 48 hours, expiring comps and trials, expired holds with customer data, patch-watcher runs |
| **Funnel/growth issues** | Weekly signups, verifications and activations vs a 4-week baseline; top source (later: PR #25 phase 2) |
| **System problems requiring action** | New `/admin/health`: route probes, newest webhook row, CRM last run, email sending status, 5xx count |

Rare and dangerous controls move to the record they affect or to System, behind the standard's §8.3 pattern. PR #24's CRM and PR #25's planned command center become sections of this one shell (AD-15).

### 6.3 Findings

#### AD-01 · P0 · both: Reconcile/Backfill can remove paid access for every member
- **What is wrong on main:**
  - "Backfill from Stripe" sits next to Refresh and runs with no confirmation (`M src/pages/AdminPage.jsx:205-218, 337-339`).
  - It replaces each row with a new item that drops `tier_scope`, `price_id` and the trial fields, and takes `current_period_end` from the top-level subscription field (`M lambda/admin/index.mjs:541-553`, field at `:549`).
- **What is wrong on the production branch:**
  - It moved to System as "Reconcile memberships from Stripe", with a note that it won't reprice, but it is still one click with no confirmation (`P AdminPage.jsx:617-620`).
  - It hard-codes `tier_scope: 'single'` and writes the top-level period end or `null` (`P lambda/admin/index.mjs:393, 395`).
  - The production access check denies any row without a future period end (`P lambda/subscription/index.mjs:343-344`).
- **Both lines:**
  - main's own code notes that Stripe's newer API moved period dates onto subscription items (`M lambda/admin/stripe-revenue.mjs:179-183`).
  - Neither admin Lambda pins a Stripe API version: no `Stripe-Version` header in `lambda/admin/index.mjs` on either line.
  - Nothing is audited. Only `comp.grant`, `comp.revoke` and `user.delete` are (`M lambda/admin/index.mjs:147, 688, 816`).
  - PR #24's action queue tells the operator to run the backfill for "renewal not recorded" (`claude/recon-cs-foundation`: `lambda/customer-success/domain/actionQueue.mjs:34`).
- **Why it matters:** if the account's default API version is the newer one, one click writes null paid-through dates. On the production branch that denies access to every member it touches. This is inferred from code; see Appendix B.
- **Recommended change:**
  - Now: disable the button (D10).
  - Then rebuild it as dry run → per-row diff → apply selected rows, following the admin audit's design:
    - update only Stripe-owned fields
    - take the period end from `items.data[0]`, falling back to the top-level field
    - derive `tier_scope`
    - keep one primary subscription per customer
    - never write a null period end for a live subscription
    - pin the API version, and audit every run
  - Change PR #24's advice.
- **Expected metric:** members wrongly locked out; lost-access tickets.
- **Implementation risk:** low to disable; medium to rebuild.

#### AD-02 · P0 · both: Money figures can be wrong without saying so
- **What is wrong on main:**
  - When the live Stripe read fails, the MRR card silently shows a database estimate. The UI never reads `billing_warning` or `billing_source`: no references in `M src/pages/AdminPage.jsx`.
  - The estimate uses $15/$35 from the template (`M aws/template.yaml:65-72`) or $12/$29 from code (`M lambda/admin/index.mjs:14-15`). Real prices are $9 or $12, and $29 or $39.
  - Cards show $0.00 while loading or after errors (`M AdminPage.jsx:15-19`).
- **What is wrong on the production branch:** it shows the warning (`P AdminPage.jsx:142, 378`), but has no live Stripe path: MRR is always a ledger estimate, and cash and refunds read "Unavailable" (`P :359, :372`).
- **Why it matters:** the Monday numbers come from these cards, and a wrong figure looks exactly like a right one.
- **Recommended change:** a source badge and "as of" time on every figure; "—" for unknown values; port main's live snapshot to the canonical line, cached.
- **Expected metric:** revenue reporting error.
- **Implementation risk:** low.

#### AD-03 · P0 · main (production branch partly fixed): Member status overstates access and payment
- **What is wrong:**
  - `isComp` treats any row without a Stripe subscription ID as a comp, whatever its expiry (`M lambda/admin/index.mjs:568-570`, used at `:402`). Every expired no-card trial therefore shows as an active comp.
  - The "active" filter includes comps and expired trials (`M AdminPage.jsx:178`), so "Copy emails" on that filter produces mostly non-payers.
  - "Past due" misses `unpaid` and `incomplete` (`:179`).
  - The production branch fixes the billing labels, but per the admin audit it still counts expired trials as complimentary (not re-verified).
- **Why it matters:** support answers and outreach lists are wrong.
- **Recommended change:** an `access_state` computed with the site's own access rule; saved views (standard §8).
- **Expected metric:** support-answer accuracy; mis-targeted email.
- **Implementation risk:** low.

#### AD-04 · P0 · both: Cancelling a paid coaching session ignores the money; comped sessions are forgotten
- **What is wrong:**
  - Admin and customer cancellations write a tombstone and send an email, with no refund, no credit restore, no "refund owed" record and no audit (`M lambda/booking/index.mjs:653-663, 786-798`; `P :800, :961`).
  - Reminders query only `confirmed` bookings (`M :349`; `P :391`), so comped sessions get none.
  - Open-slot calculation removes only confirmed bookings and active holds (`M :210`; `P :211`), so comped slots are offered again.
- **Why it matters:** refund errors, chargebacks, no-shows and double bookings.
- **Recommended change:** a cancel dialog showing the payment type and amount, offering refund, restore credit, or no refund with a reason; a "refund owed" item on Today; include comped sessions in reminders and slot blocking.
- **Expected metric:** coaching disputes; no-shows; double bookings.
- **Implementation risk:** low for the prompt and reminders; medium for automated refunds.

#### AD-05 · P1 · both: The first screen doesn't say what needs attention
- **What is wrong:**
  - main opens on the Members tab (`M AdminPage.jsx:83`) under ten always-visible stat cards (`M :298-309`).
  - Payment problems, paid-without-login members, today's sessions, CRM results and system failures are hidden, emailed elsewhere or untracked.
  - The production branch has a billing-only attention strip (admin audit; not re-verified).
- **Why it matters:** a solo operator spends the first minutes of every day scanning.
- **Recommended change:** build Today (§6.2), composed in the browser from existing endpoints first.
- **Expected metric:** time from opening the admin to the first action.
- **Implementation risk:** low.

#### AD-06 · P1 · both: Admin routes and permissions are outside infrastructure code, and nobody is alerted
- **What is wrong:**
  - main's template declares only the announcements, subscriptions, users, backfill and comp routes (`M aws/template.yaml:475-492, 589-636`). The comps, uncomp, delete, audit, availability, bookings, calendar, testimonials and demo-video routes exist only outside it.
  - The 5xx alarm has no actions (`M :692-709`).
  - The production branch adds some routes and alarm actions (admin audit).
- **Why it matters:** a stack deploy can silently break admin tools.
- **Recommended change:** declare every route and permission in the template; add `/admin/health`; add alarm actions; add a post-deploy smoke test.
- **Expected metric:** time to detect admin breakage.
- **Implementation risk:** medium (importing hand-made routes).

#### AD-07 · P1 · both: Account deletion can't be undone, is incomplete, and its guard has gaps
- **What is wrong:** delete removes the Cognito user and the profile permanently. It skips bookings, referrals and the CRM log. The server guard blocks only `status === 'active'` (`M lambda/admin/index.mjs:761`), so trialing, past-due and unpaid customers whom Stripe will still charge can be deleted.
- **Why it matters:** chargebacks, and incomplete privacy requests.
- **Recommended change:** "Disable login" as the reversible default. Full deletion moves to System, blocked by any live Stripe subscription, listing every store it touches, exporting first, and audited.
- **Expected metric:** deletion errors.
- **Implementation risk:** medium.

#### AD-08 · P1 · both: The two availability editors overwrite each other
- **What is wrong:** the calendar and the weekly editor each load and save the whole config (`M src/components/admin/AppointmentsCalendar.jsx:65, 179`; `M src/components/admin/AvailabilityEditor.jsx:33, 47`). The server replaces it with no version check (`M lambda/booking/index.mjs:846`). Drags publish immediately, and there is no UI for time off (admin audit).
- **Why it matters:** missed or unwanted bookings.
- **Recommended change:** one shared state; versioned conditional writes; a list of one-offs and time off; confirm-with-undo on drag.
- **Expected metric:** booking errors.
- **Implementation risk:** low to medium.

#### AD-09 · P1 · both: The audit trail misses the riskiest actions and isn't the latest
- **What is wrong:** only comp grant, comp revoke and user delete are audited (`M lambda/admin/index.mjs:147, 688, 816`). The log is read with a `Scan` capped at 200 items (`M :824`), so it isn't truly "the latest".
- **Why it matters:** incidents can't be reconstructed.
- **Recommended change:** audit every admin write; store the log so it can be queried by time; show a history on each record.
- **Expected metric:** time to reconstruct an incident.
- **Implementation risk:** low.

#### AD-10 · P1 · both: "Copy emails" and export ignore consent
- **What is wrong:** both take everyone in the current filter (`M AdminPage.jsx:265-283`), while the CRM job respects consent and suppression (`M lambda/crm/index.mjs:152-153`).
- **Why it matters:** complaints and domain reputation.
- **Recommended change:** separate marketing (consented, unsuppressed) and service lists; show the excluded count; log exports.
- **Expected metric:** complaint rate.
- **Implementation risk:** low.

#### AD-11 · P1 · both: The Reddit digest, with drafted comments, is public and wiped by deploys
- **What is wrong:** the watcher writes to the public site bucket (`M lambda/reddit-watcher/index.mjs:18, 396-405`). The site deploy syncs with `--delete` (`M deploy.ps1:111`), so every deploy erases the digest.
- **Why it matters:** a public page of drafted promotional replies is a reputation risk, and the daily routine's link breaks.
- **Recommended change:** a private bucket or prefix, served through an admin endpoint; freshness shown on Today.
- **Expected metric:** routine completion.
- **Implementation risk:** low.

#### AD-12 · P1 · both: Refunds, disputes, coaching revenue and workbook revenue are invisible
- **What is wrong:** the webhook handles no `charge.refunded` or `charge.dispute.*` events (`M lambda/webhook/index.mjs:69-86`; `P :73-89`). The console shows no charges.
- **Why it matters:** dispute evidence deadlines get missed, and revenue questions can't be answered.
- **Recommended change:** handle refund and dispute events in the ledger and audit; put disputes on Today; a Revenue page by product.
- **Expected metric:** missed dispute deadlines.
- **Implementation risk:** low to medium (the Stripe endpoint's event list must change).

#### AD-13 · P1 · both: Coaching leads, credits and no-shows are invisible
- **What is wrong:** abandoned paid checkouts keep customer details on expired holds, but no list shows them. Credit balances have no view. There is no no-show status (admin audit, `lambda/booking/index.mjs` hold and credit rows).
- **Why it matters:** the warmest coaching leads and member questions get lost.
- **Recommended change:** Coaching › Checkout leads; credits on the member record, with an audited adjust action; a no-show status.
- **Expected metric:** recovered coaching revenue.
- **Implementation risk:** low.

#### AD-14 · P1 · both: Content-truth operations have no surface
- **What is wrong:** the patch watcher stores new Ubisoft patch notes as `pending_review` (`M lambda/ubisoft-patch-watcher/index.mjs:68-92`), and no admin screen reads them on either line. The testimonial form has no consent, verification or date fields (`M TestimonialBuilder.jsx:29-36`).
- **Why it matters:** stale strats after a patch, and unverifiable proof (PT-06).
- **Recommended change:** a Content › Freshness queue; testimonials linked to a member, a consent date and the member's real plan.
- **Expected metric:** days content stays stale after a patch.
- **Implementation risk:** low.

#### AD-15 · P1 · open PRs: Parallel consoles are emerging
- **What is wrong:** PR #24 adds `/admin/crm` with 10 tabs of its own (`claude/recon-cs-foundation`: `src/main.jsx:182-184`; `src/features/crm/crmTabs.js`), its own MRR and its own queue. PR #25's phase 2 plans another command center.
- **Why it matters:** several places to look, and conflicting numbers.
- **Recommended change:** one admin shell; PR #24's queue feeds Today; one Revenue page.
- **Expected metric:** screens per task.
- **Implementation risk:** medium.

#### AD-16 · P1 · main (production branch partly fixed): The mobile layout hides the useful parts
- **What is wrong:** ten stat cards stack before the tabs. The sticky tabs (`top: 0; z-index: 5`) sit under the sticky navbar (`z-index: 100`) and vanish on scroll (`M src/pages/AdminPage.css:90-92`; `M src/App.css:63-67`). The member table has 12 columns.
- **Why it matters:** "who's next?" and "is this person paying?" are phone questions.
- **Recommended change:** Today first; cards below 640 px; offset the tabs.
- **Expected metric:** time to answer on a phone.
- **Implementation risk:** low.

#### AD-17 · P1 · both: The admin identity is weakly protected
- **What is wrong:** main's pool allows 6-character passwords (`M aws/template.yaml:232`; production raises this to 12). Neither template configures MFA. The calendar feed uses a static key with no rotation (`M lambda/booking/index.mjs:719`).
- **Why it matters:** the admin can delete accounts, grant access and read every customer's contact details.
- **Recommended change:** TOTP MFA for the admins group; key rotation under System.
- **Expected metric:** blast radius of an account takeover.
- **Implementation risk:** low to medium.

**P2 and P3 (from the admin audit; not re-verified):**
- **AD-18 · P2 · main · Delete is blocked for expired trials, with the wrong reason.**
  - **What:** the tooltip wrongly says "Active paying customer".
  - **Why:** it slows cleanup of test and spam accounts.
  - **Evidence:** `M AdminPage.jsx:400, 407-413`.
  - **Change:** derive the reason from the live check.
  - **Metric:** cleanup time.
  - **Risk:** low.
- **AD-19 · P2 · both · The hero video caption is dropped, and the public read can miss the row.**
  - **What:** caption not sent; a `Scan` with `Limit: 1` before the filter.
  - **Why:** the landing page shows no video.
  - **Evidence:** `DemoVideoManager.jsx:22-25`; `lambda/announcements/index.mjs:293-301`.
  - **Change:** `GetCommand` by key; send the caption.
  - **Metric:** landing correctness.
  - **Risk:** low.
- **AD-20 · P2 · main · Growth numbers are mislabelled.**
  - **What:** "New (30d)" counts subscription rows, not signups.
  - **Why:** a wrong growth read.
  - **Evidence:** `M lambda/admin/index.mjs:593-595`.
  - **Change:** split new signups from new payers; add signups by source.
  - **Metric:** time to answer "where from?"
  - **Risk:** low.
- **AD-21 · P2 · main · Loading, error and empty states mislead.**
  - **What:** zeros while loading; "No testimonials yet" shown on errors.
  - **Why:** false "nothing here" reads.
  - **Evidence:** `M AdminPage.jsx:15-19, 115-122`.
  - **Change:** skeletons, "—", and error states with retry.
  - **Metric:** false reads.
  - **Risk:** low.
- **AD-22 · P2 · main · Accessibility basics are missing.**
  - **What:** unlabeled controls; the booking drawer isn't a dialog; notices aren't announced.
  - **Why:** keyboard and screen-reader users can't finish tasks.
  - **Evidence:** `M AdminPage.jsx:346-366`; `AppointmentsCalendar.jsx:299-311`.
  - **Change:** labels, dialog semantics, `role="status"`.
  - **Metric:** task completion.
  - **Risk:** low.
- **AD-23 · P2 · both · Comps and trials are mixed.**
  - **What:** trials appear in Comp accounts with revoke buttons that fail.
  - **Why:** wrong revokes.
  - **Evidence:** `M lambda/admin/index.mjs:130-145`.
  - **Change:** separate Trials from Complimentary; add Extend.
  - **Metric:** wrong-revoke attempts.
  - **Risk:** low.
- **AD-24 · P2 · main · `/admin/users` does heavy work on every load.**
  - **What:** lists every Cognito user and every subscription in the shared Stripe account.
  - **Why:** slow first screen; risks the 60 s limit.
  - **Evidence:** `M lambda/admin/index.mjs:273-276, 342-356`.
  - **Change:** cache; filter by Recon price IDs.
  - **Metric:** load time.
  - **Risk:** low.
- **AD-25 · P3 · main · Polish and documentation drift.**
  - **What:** 11 vs 20 games in the catalog header; a dead `/admin/subscriptions`; seven copies of `authedFetch`.
  - **Why:** maintenance cost.
  - **Evidence:** admin audit F26.
  - **Change:** consolidate.
  - **Metric:** none.
  - **Risk:** low.

---

## 7. Analytics and attribution gaps

#### AN-01 · P1 · both: The funnel can't be measured end to end, and money isn't attributed
- **What is wrong:**
  - main captures only a sanitized `?ref=`, first touch, in the browser. There are no `utm_*` or click IDs anywhere in `src/` or `lambda/` (zero matches).
  - On main, the self-reported source overwrites the captured one (`M ProfileSetupModal.jsx:69-71`).
  - The production branch stores `utm_*` first touch in `localStorage` and attaches it to Plausible events (`P src/lib/refSource.js:43-72`; commit `8054871`). Nothing reaches the server: checkout metadata carries only kind, email, `cognito_sub` and tier (`P lambda/subscription/index.mjs:1194-1201`), and subscription rows carry no attribution.
  - No generated static page loads Plausible on either line, so the coaching page, about 1,100 blog and guide pages, tools and countdown are unmeasured.
  - The funnel audit rated this P0.
- **Why it matters:** "which video produced paying customers?" can't be answered, and ad blockers hide part of the client events.
- **Recommended change:** standard §6.5: persist attribution at account creation and in Checkout `metadata` and `subscription_data.metadata`; the webhook copies it; add analytics to the static templates; admin revenue by `utm_content`.
- **Expected metric:** share of revenue with a known source (proposed target: 90% or more).
- **Implementation risk:** low to medium, after D1.

#### AN-02 · P1 · both: Documented events are never emitted, including the activation event `/start` relies on
- **What is wrong:**
  - `Strat Viewed`, `VOD Analyze Click`, `Signin Completed` and `Paywall Dismiss` are documented as goals (`M/P src/utils/analytics.js:5-12`), but nothing emits them on either line.
  - PR #29 names `Strat Viewed` as its activation event, and nothing emits it at `341e076` either.
  - There is no event registry and no `variant` property.
- **Why it matters:** Rule 11. Activation can't be reported, so neither `/start` nor any test can be judged.
- **Recommended change:** a registry file plus the CI parity check (standard §6.7); emit A1 and A2 server-side.
- **Expected metric:** analytics coverage; activation reporting.
- **Implementation risk:** low.

#### AN-03 · P1 · main: Trialing subscriptions are stored as active at checkout
- **What is wrong:** `handleCheckout` writes `status: 'active'` (`M lambda/webhook/index.mjs:253`), so trial and paid customers look the same until a later event. The admin MRR counts them as paying. The production branch stores `sub.status` (`P :369`).
- **Why it matters:** trial→paid conversion can't be measured.
- **Recommended change:** closed by reconciliation; store `trial_end` too.
- **Expected metric:** trial→paid measurability.
- **Implementation risk:** low.

**AN-04 · P2 · both · No click IDs, ad pixels, deduplication plan or experiment variant.**
- **What:** none are captured.
- **Why:** this only matters once paid ads or tests run.
- **Evidence:** zero matches for `ttclid`, `gclid` and `fbclid` on main; PR #25 excludes click IDs by design.
- **Change:** standard §6.5 rules 4 and 7 when ads start; `variant` on all events.
- **Metric:** attributed ad conversions.
- **Risk:** low.

---

## 8. Mobile and performance problems

#### MP-01 · P1 · main: The landing bundle pulls in every dormant game's data and the full strategy database
- **What is wrong:**
  - `src/data/games/index.js` statically imports `gameMeta` from 19 non-R6 game modules (`M :21-40`), each of which imports that game's maps, strats, picks and loadouts (for example `M src/data/games/cs2/index.js:1-6`). That is about 2.2 MB of source.
  - The homepage imports the full `STRATS` (`M LandingPage.jsx:15`).
  - `AuthProvider` loads for everyone (`M src/main.jsx:7`).
  - The production branch imports only R6's metadata (`P src/data/games/index.js:4`) and a generated public strats file (`P LandingPage.jsx:13`). PR #30 reports its shared bundle as about 78 KB gzip.
  - Actual bundle sizes were not measured; nothing was built.
- **Why it matters:** slow first interaction on mid-range Android in TikTok's webview.
- **Recommended change:** closed by reconciliation. If main survives, split game metadata and lazy-load auth.
- **Expected metric:** LCP and INP; bounce.
- **Implementation risk:** medium.

#### MP-02 · P1 · main: The primary CTA is likely below the fold on small phones, and there is no sticky CTA
- **What is wrong:** a three-line H1, a subtitle of about 330 characters and a badge precede three stacked CTAs (`M LandingPage.jsx:488-528`). The funnel audit estimates the first CTA at about 640 px on a 360 × 640 screen. That is an **estimate from CSS**; nothing was rendered.
- **Why it matters:** Rule 16; in-app browser chrome takes further space.
- **Recommended change:** a one-to-two-line subtitle and a sticky bottom CTA. `/start` covers social traffic (standard §10).
- **Expected metric:** CTA visible in the first viewport; click-through.
- **Implementation risk:** low.

**MP-03 · P2 · both · Render-blocking Google Fonts and paint costs.**
- **What:** eight font files; an animated glow; `backdrop-filter`.
- **Why:** LCP and INP.
- **Evidence:** `M index.html:157-159`; `P :145-147`; `App.css` per the funnel audit.
- **Change:** self-host two subset weights; static glow on mobile.
- **Metric:** LCP.
- **Risk:** low.

**MP-04 · P2 · both · Small tap targets.**
- **What:** hero tertiary links at 0.85 rem in a non-wrapping row; locked cards announce no lock state.
- **Why:** mis-taps; accessibility.
- **Evidence:** `M LandingPage.jsx:538`; `MapSelector.jsx:72-80` (funnel audit).
- **Change:** targets of 44 × 44 or larger; lock state in the accessible name.
- **Metric:** mis-taps.
- **Risk:** low.

---

## 9. SEO and content-generation drift

#### SEO-01 · P1 · main: Dormant multi-game inventory is deployed and indexable
- **What is wrong:** 719 `/games` pages (`index, follow`; for example `M public/games/cs2/index.html:9`) and 91 non-R6 blog posts are committed on both lines. main's build copies `public/` without pruning (`M package.json:8`), and its homepage links seven of those posts (`M LandingPage.jsx:1026-1034`). The production branch prunes them from `dist/` (`P package.json:8`; `P scripts/prune-non-r6-output.mjs:22-31`).
- **Why it matters:** crawl budget and topical focus; it contradicts the R6-only positioning.
- **Recommended change:** closed by reconciliation. Otherwise add `noindex` plus 301 redirects, or delete.
- **Expected metric:** organic clicks to R6 pages.
- **Implementation risk:** low to medium.

#### SEO-02 · P1 · both: The sitemap misleads crawlers
- **What is wrong:**
  - Every `lastmod` is the build date (`M scripts/generate-sitemap.mjs:18`; `P :14`).
  - It lists app routes `/auth` and `/dashboard` (`M :22-23`; `P :18-19`), plus `/download` on the production branch (`P :26`).
  - main drops any blog slug that doesn't start with `r6-` (`M :357`), which excludes the 25 committed map posts.
- **Why it matters:** crawlers learn to ignore `lastmod`, and real R6 posts go undiscovered.
- **Recommended change:** build the sitemap from actual outputs; `lastmod` from a content hash; drop app routes; gate on R6 metadata instead of the slug prefix.
- **Expected metric:** indexed R6 posts.
- **Implementation risk:** low.

#### SEO-03 · P1 · both: App routes share the homepage's canonical; unknown URLs are soft 404s
- **What is wrong:** `index.html` carries `canonical https://r6coaching.com/` for every SPA route on main, the production branch and PR #29 alike. Unknown paths return 200 and redirect home (see IA-01).
- **Why it matters:** SPA pages, `/start` included, can't be indexed or previewed as themselves.
- **Recommended change:** per-route served head tags or prerendering; real 404s; `noindex` for app routes.
- **Expected metric:** indexed pages; share previews.
- **Implementation risk:** medium.

#### SEO-04 · P1 · both: Freshness dates are hard-coded and nothing enforces freshness
- **What is wrong:** posts show "Last updated: 2026-05" (`M scripts/generate-blog-posts.mjs:2513`; `P :2456`). No build step fails when `reviewDue` passes or when season data goes stale (see PT-14).
- **Why it matters:** trust and click-through from search.
- **Recommended change:** stamp dates from data; add the expiry gate (standard §5.5).
- **Expected metric:** click-through from search; trust.
- **Implementation risk:** low.

#### SEO-05 · P1 · both: `CLAUDE.md` feeds stale, rule-breaking instructions to the sessions that write content
- **What is wrong:** main's brief still says:
  - HashRouter (`M CLAUDE.md:9`)
  - a May 8 desktop launch (`:20`)
  - $9/$29 founding pricing, and swapping Payment Links on May 8 (`:24-37`)
  - Champion unlocks legacy maps via `championOnly` plus the desktop app (`:45`)
  - "Founding-rate urgency … 'founding rate ends May 8' and 'locked in for life'" (`:107`)

  The production branch's copy has the same header. PR #22 (draft) and PR #30 propose fixes.
- **Why it matters:** generated copy inherits these errors, including PT-04.
- **Recommended change:** this PR adds a pointer to the standard (proposed). The canonical line's brief should drop its pricing and launch sections in favor of the catalog.
- **Expected metric:** new copy that fails the truth checks.
- **Implementation risk:** low.

**SEO-06 · P2 · both · Generator hygiene.**
- **What:** outputs are never cleaned; the operator-post generator is outside `generate:all`; the blog index has empty genre tabs; counts are hard-coded.
- **Why:** stale pages keep shipping.
- **Evidence:** `M package.json:9` (funnel audit for the rest).
- **Change:** clean output directories; put every generator in the build; derive counts.
- **Metric:** stale-page count.
- **Risk:** low.

**SEO-07 · P2 · both · Social previews and structured data.**
- **What:** SVG `og:image` on guides; FAQ JSON-LD that isn't visible on the page; no `llms.txt`.
- **Why:** share click-through and search compliance.
- **Evidence:** `scripts/generate-guides.mjs` and `index.html` FAQ (funnel audit).
- **Change:** PNG or JPG OG images; JSON-LD that matches visible content; an `llms.txt` generated from the catalog.
- **Metric:** share click-through.
- **Risk:** low.

**SEO-08 · P2 · both · Orphan "Ghost IGL" guide pages remain committed.**
- **What:** for example `M public/guides/consulate/lobby-press.html`. The production branch rewrites the brand in `dist/` (`P scripts/prune-non-r6-output.mjs:47`), but the pages still deploy.
- **Why:** they are crawlable and carry the old brand and prices.
- **Evidence:** as cited.
- **Change:** delete them with 301 redirects; add an orphan detector.
- **Metric:** crawl quality.
- **Risk:** low.

---

## 10. Prioritized fixes: the PR sequence

These are small, independently reviewable PRs, in order. Each lands on the canonical line (D1). "Verify" lists what to check before and after.

| # | PR | Scope | Closes | Risk | Verify before → after |
|---|---|---|---|---|---|
| **0** | **Decision record** (docs) | D1–D12 answers in `docs/DECISIONS.md` | Unblocks all | None | — |
| **Aaron** | **Commit the live work** | Commit the uncommitted deployed changes (per PR #30) to the canonical branch | PT-01 (part) | Medium | Diff deployed Lambda code against the branch → none |
| **1** | **Deploy guards** | `deploy.ps1` refuses dirty or non-canonical trees; writes `/version.json`; Lambda deploys record their commit; disable dispatch of main's deploy workflows (or merge #23) | PT-01 | Low | Record current deployed SHAs → `/version.json` matches `HEAD` |
| **2** | **Disable Reconcile** | Hide the button or require a typed phrase; add an audit entry | AD-01 (interim) | Low | Button absent from default views |
| **3** | **Coaching money safety** | Cancel dialog with refund, credit-restore or reason; "refund owed" flag; comped sessions in reminders and slot blocking | AD-04, PT-10 (part) | Low | Test booking: cancel shows payment → flag set |
| **4** | **Champion credits** | Booking page sends the token and shows the balance | PT-10 | Medium | Stripe test mode: a Champion books with a credit and is not charged |
| **5** | **Product-facts catalog** | `config/product-facts.json` plus UI and Lambda adapters; tests that the catalog equals the price IDs, VOD caps and booking prices. No copy change. | Enables PT-* | Low | Tests fail if a cap or price drifts |
| **6** | **Money surfaces from the catalog** | Cards, JSON-LD, Terms, Refund, CRM emails, Discord bot (needs D3–D5; legal sign-off) | PT-02, PT-03, PT-15 | Low | Page amount and trial = Stripe test-mode session |
| **7** | **Generators and frozen pages** | Remove founding, "replays" and games copy; expiry gate and literal-scan CI; regenerate or prune | PT-04, PT-13, SEO-04, SEO-06 | Low | CI red on a planted "$9/mo" → green after |
| **8** | **Free-tier and capability claims** | WelcomeModal, VodPage, `index.html`/manifest, Download "Now" flags, upsell text, all from the catalog | PT-05, PT-11 | Low | Truth scan of built HTML clean |
| **9** | **Proof cleanup** | Stars, "Most Popular", computed counts, rank-ceiling and "written by players" lines, estimate labels, testimonial consent fields | PT-06, AD-14 (part) | Low | Banned-phrase scan clean |
| **10** | **Remaining entitlements** | Referral (D7) plus index lookup; refund charged duplicates; All-Access (D6) | PT-09, SC-04, PT-12 | Medium | Stripe test mode: referral credit applied once |
| **11** | **Event registry and activation** | Registry, CI parity, server-side A1/A2 events | AN-02, AO-01 (part) | Low | Events visible in Plausible debug |
| **12** | **Server-side attribution** | Profile campaign object at signup; Checkout `metadata` and `subscription_data.metadata`; webhook copy; booking metadata; admin revenue by `utm_content` | AN-01 | Low–medium | Test subscription carries the UTM metadata |
| **13** | **`/start` conformance** (PR #29 follow-ups) | Served head or `noindex`; activation emitter; attribution; Champion copy per D5; weight budget per D11; in-app browser test | Appendix A gaps | Low–medium | Standard §10.13 checklist |
| **14** | **Directory index and 404s** | Attach the CloudFront function (Aaron's AWS change, with rollback); real 404s | IA-01, SEO-03 (part) | Medium | `curl /blog/` → blog page, not home |
| **15** | **Dead ends and navigation** | Locked cards as links; interstitial for locked deep links; `mode=signup`; mobile nav CTA; pricing hash and expand | CL-02, CL-03, IA-02 | Low | Manual path test at 360 px |
| **16** | **Signup form** | Password rule from one config; autocomplete; 16 px inputs; error mapping; drop Full Name | SC-02 | Low | iOS: no zoom; password managers fill |
| **17** | **Onboarding and lifecycle email** | One modal after first value; shared input styles; one role list; email footer and opt-out | AO-02, AO-03 | Low | New account reaches first plan with no modal on top |
| **18** | **Admin Today (read-only)** | Six blocks from existing endpoints; source badges; "—" for unknown | AD-05, AD-02 (display) | Low | Today renders with each block's source |
| **19** | **Members and PR #24 fold-in** | `access_state`, saved views, member record; PR #24 as sections | AD-03, AD-15 | Medium | Expired trial shows as "Trial ended" |
| **20** | **Admin infrastructure and safety** | Routes and permissions in IaC; `/admin/health`; alarm actions; audit every write; MFA; rebuilt dry-run Reconcile | AD-01, AD-06, AD-09, AD-17 | Medium | Post-deploy smoke test of admin routes |
| **21** | **Coaching operations** | Single availability state with versioned writes; checkout leads; credits; no-show status | AD-08, AD-13 | Low–medium | Concurrent edits don't clobber |
| **22** | **Growth and content surfaces** | Private Reddit digest; patch freshness queue; consent-aware exports | AD-10, AD-11, AD-14 | Low | Digest URL not public |
| **23** | **SEO hygiene** | Sitemap from outputs; `noindex` for app routes; per-route head; `lastmod` from content | SEO-02, SEO-03 | Low | Sitemap lists only indexable R6 pages |
| **24** | **Performance** (if main survives) | Split dormant game data; lazy auth; fonts | MP-01, MP-03 | Medium | `vite build` size report before and after |
| **25+** | **P2/P3 batch** | CL-04, CL-05, IA-03, IA-04, SC-05, AO-04, AO-05, AD-18–25, AN-04, MP-04, SEO-07, SEO-08 | — | Low | Per item |

---

## Appendix A: `/start` (PR #29 at `341e076`) against standard §10

A read-only spot-check; nothing was run. PR #29 already meets several criteria and names its own open items. The gaps below are what the standard would block on.

| Criterion (§10) | Status | Evidence |
|---|---|---|
| One job, written down | Met in the PR body ("open a real round plan" = A1) | PR #29 description |
| No literal prices in page source | Met | No `$` followed by a digit in `src/pages/StartPage.jsx` |
| Plan facts from one source | Partly met | `src/config/planFacts.js` reads prices from `stripe.js` but types the review and screenshot caps (guarded by a drift test). It should become a view over the catalog (standard §5.3). |
| Same-tab conversion path | Met | `target="_blank"` only on the Discord links (`StartPage.jsx:306, 635`) |
| Served head (title, OG, canonical or `noindex`) | **Not met** | The title is set client-side (`StartPage.jsx:348-356`); the served canonical is still the homepage's (`index.html` at `341e076`) |
| Activation event emitted | **Not met** | PR #29 names `Strat Viewed`; no code emits it (AN-02) |
| Attribution in Checkout metadata | **Not met** (deferred by PR #29 because of PT-01) | PR #29 description |
| Weight budget | Decision needed (D11) | A 14 KB route chunk (PR #29) plus the shared bundle (about 78 KB gzip per PR #30), against a proposed 60 KB |
| Truthful plan claims | **Risk** | The page lists Champion's two live sessions, which can't be redeemed self-serve (PT-10) |
| In-app browser test on iOS and Android | Not done | PR #29: only possible after deploy |
| First A/B test | Not started | Events exist; the test is deferred |

---

## Appendix B: Unverified items and how to check them

| Item | Why it matters | How to check (read-only) |
|---|---|---|
| What is deployed for the site and each Lambda | PT-01 | AWS console, or `aws lambda get-function --function-name <name> --query 'Configuration.[LastModified,CodeSha256]'`; compare against branch builds. PR #30 did this. |
| Trial settings on any active Payment Link | PT-03 | Stripe Dashboard › Payment Links › each link › "Include a free trial" |
| Amounts behind every price ID | PT-02, PT-03 | Stripe Dashboard › Products |
| Active All-Access subscriptions | PT-12 | Stripe › Subscriptions, filtered by the four All-Access price IDs in `M src/config/stripe.js:80-94` |
| Customers with two live Recon subscriptions | PT-08 | Stripe › Subscriptions, grouped by customer email |
| The Stripe account's default API version | AD-01 | Stripe › Developers › API version |
| Live admin API routes | AD-06 | `aws apigatewayv2 get-routes --api-id u0k402df6j --region us-east-1 --query 'Items[].RouteKey'` |
| Whether the CloudFront directory function is attached | IA-01 | CloudFront › `E2WUR8DDHCOYC9` › Behaviors › Function associations |
| Current R6 season and ranked pool | PT-14 | Ubisoft's official Ranked and patch-note pages |
| Plausible goals and custom properties | AN-01, AN-02 | Plausible › Site settings › Goals |
| Bundle sizes | MP-01, D11 | `npm run build` on each line, then inspect `dist/assets` |
| PayPal and Apple Pay enabled | SC-05 | Stripe › Settings › Payment methods |

---

## Appendix C: Input-report findings dropped or corrected

1. **Base commit.** The input audits read main at `873798a`. `origin/main` is now `ede787e`: a DynamoDB projection alias in `lambda/admin/index.mjs` plus a hotfix workflow. Admin line numbers after 181 shift by one (for example, the audit read is at `:824` and the delete guard at `:761`).
2. **The production branch moved** from `36ebdec` to `8054871`, one commit that adds `utm_*` first-touch capture. So "only `?ref=` is captured" (funnel audit AN-02) now applies to main only.
3. **Founding-copy page count.** Recounted as 318 on main and 201 on the production branch ("Founding rate" or "locked (in) for life"), instead of 302.
4. **The "38 posts in the blog index" count was dropped.** It couldn't be reproduced reliably; the audit cites about 85 committed R6 posts and the two contradictory UI figures instead.
5. **Scoped to main only:**
   - the Discord bot pricing (C9): the production bot already lists Basic/Pro/Elite/Champion (`P lambda/discord/index.mjs:122-125`)
   - the coaching money-back guarantee (C6): the production branch removed it, but has the Champion-credit problem instead (PT-10)
   - bundle bloat (MP-01): the production branch already imports only R6 metadata
   - the unguarded booking `finalize` (SC-06): the production branch checks the hold token
6. **A candidate finding was excluded:** the production homepage's multi-game paragraph (`P LandingPage.jsx:682`) sits inside `{!R6_ONLY && …}` and doesn't render. main's All-Access block (`M :935-958`) is likewise dormant.
7. **Evidence dropped as unverified:** the admin audit's "admin Lambdas accept unverified-email tokens" (F18); the rest of F18 is verified. PR #30's deployed-state facts (`trialDays: 0`, admin Lambda from main, live homepage) are cited as reported by PR #30, not asserted.
8. **Priority differences:**
   - IA-01 (directory URLs) is **P1** here; PR #30 rates it P0.
   - AN-01 (end-to-end measurement) is **P1** here; the funnel audit rates it P0. It is a conversion and measurement issue, not a money or truth error.
   - The free-tier claim (PT-05) is **P0** here, as in PR #30 and the funnel audit; the product-truth audit rated it P1.
9. **Added in this audit:**
   - main's deploy workflow can overwrite the production subscription Lambda with code that lacks `/me/membership-checkout` (PT-01)
   - referral codes are looked up with `Scan` and `Limit: 1` on both lines (PT-09)
   - main's add-on credits can be spent without an identity check (PT-10)
   - a third ranked-pool list (PT-14)
   - the production branch's committed checkout contradicts its own homepage on the trial (PT-03)

---

Stop here for Aaron/ChatGPT review before broad implementation.
