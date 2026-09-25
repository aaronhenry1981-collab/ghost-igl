# Recon 6 Acquisition Engine

Goal: grow from about 70 registered to **700 verified** users, and know
which channels, pages and content actually produce verified, activated and
paying players. This document covers the whole engine; **this change ships
phase 1 only** (attribution and the acquisition event foundation).

| Phase | Scope | Status |
|---|---|---|
| 1 | Attribution capture and acquisition events | **this change** |
| 2 | Acquisition command center | planned (needs phase 1 data + Plausible Stats API key) |
| 3 | Activation automation | planned (builds on the customer-success layer, PR #24) |
| 4 | Product-led referral and sharing | planned |
| 5 | AI-search / SEO (crawler policy, structured data, topic hubs, visibility checks, static-page attribution) | planned |
| 6 | Social content pipeline (no automatic publishing of unverified content) | planned |
| 7 | Creator / partnership tracking (no outreach from code) | planned |

Nothing in this change publishes content, contacts anyone, buys advertising
or touches production data.

## 1. Audit: what existed before this change

Two lines of the site exist: `main` (this PR's base) and the production line
(`content/strat-beta-disclaimer`, latest attribution commit `8054871`).

| Dimension | Production line | `main` |
|---|---|---|
| `utm_source` | read by the SPA into `recon:src`, sanitised (dots stripped) | not read |
| `utm_medium` / `campaign` / `content` | browser only (`recon:campaign`) + Plausible props | not read |
| `utm_term` | not read | not read |
| `ref` (creator / channel code) | read; beats `utm_source` | read |
| Referring domain | mapped to 5 labels, raw domain dropped | not read |
| Landing page | not stored | not stored |
| First touch | browser only (`recon:src`, first value wins) | same |
| Last touch | not stored | not stored |
| Signup / checkout / subscription attribution | profile `referral_source` string only, written after verification; nothing on Stripe metadata or the subscription row | same, fewer sources |
| Coaching booking | `referral_source` on the booking row (defaults to `direct`, lost once the profile is attributed) | same |
| Friend referral | `/r/:code` → `referred_by` (first touch) | same |
| Content / post id | `utm_content` in browser + Plausible only | none |
| `utm_source=chatgpt.com` | stored as `chatgptcom` | not stored |
| Static pages (≈1,100 generated HTML files) | do not load Plausible; ~130 read `?ref` only | same |

Findings that shape the design:

- **All campaign detail stays in the browser**; the server sees one sanitised
  string on the profile. There is no record of first touch vs last touch,
  landing page, or which campaign preceded a signup, checkout or booking.
- **`chatgpt.com` became `chatgptcom`** (sanitiser strips dots). Existing
  values must be read as ChatGPT-tagged, and the raw value kept from now on.
- **Static pages are invisible to analytics**, and a visitor who lands on a
  blog post from an AI answer and then clicks into the app arrives with an
  internal referrer: attributed as direct.
- The referral-code lookup can miss valid codes (it scans with a one-item
  limit before filtering); tracked as a separate fix on the production line.

## 2. Attribution model (`src/lib/attribution/core.js`)

A **touch** is one landing on the site. It records:

| Field | Meaning |
|---|---|
| `source` | normalised source id (`chatgpt`, `tiktok`, `google`, `creator:<code>`, `friend_referral`, a domain, or `direct`) |
| `sourceLabel` | readable name ("ChatGPT") |
| `sourceRaw` | the raw value as received (`chatgpt.com`), kept for auditing |
| `channel` | `ai_search`, `search`, `social_video`, `social`, `community`, `email`, `paid`, `creator`, `referral`, `website`, `direct` |
| `evidence` | how we know: `utm_tag`, `referrer`, `ref_code`, `referral_code`, `legacy_first_touch`, `none` |
| `medium`, `campaign`, `content`, `term` | the UTM values (cleaned) |
| `contentId` | `cid` / `content_id` / `utm_content`: the post or asset id |
| `ref`, `referralCode` | creator code (`?ref=`) and friend code (`/r/<code>`) |
| `referrerDomain` | external referring **hostname only** |
| `landingPath` | path only, never the query string |
| `at` | when |

Rules:

1. **Precedence within one landing:** `utm_source` → `?ref=` → `/r/<code>` →
   external referrer → direct. A known source in `?ref=` (e.g. `twitter`) is
   that source; anything else is a creator code.
2. **Normalisation** uses a fixed table (`KNOWN_SOURCES`): ChatGPT
   (`chatgpt.com`, `chat.openai.com`), Perplexity, Gemini, Copilot, Claude,
   Google (country domains), Bing, DuckDuckGo, TikTok, YouTube (`youtu.be`),
   Instagram, Twitch, Reddit (`old.`), Discord, X (`t.co`), Facebook, email.
   Paid mediums (`cpc`, `paid_social`, …) put a touch in the `paid` channel.
3. **First touch is never overwritten.** The first landing in a browser stays
   the first touch; if it was direct, the first real source is kept separately
   (`firstNonDirectTouch`). A value the older tracker stored in `recon:src` is
   adopted as the historical first touch (`legacy_first_touch`), including
   `chatgptcom` → ChatGPT.
4. **Last touch** follows the last non-direct landing; a later direct visit
   does not erase it. The last 10 non-direct touches are kept; the same touch
   repeated within 30 minutes is not double-counted.
5. **Honest reporting.** A ChatGPT UTM tag is reported as a
   *"ChatGPT-tagged visit (utm_source=chatgpt.com)"*: the link was clicked
   inside ChatGPT, which does **not** prove ChatGPT recommended Recon
   independently (the user may have asked for Recon by name, or pasted the
   link). A `chatgpt.com` referrer is reported as a visit from chatgpt.com.
   Nothing is described as a recommendation unless stronger evidence exists.
6. **Privacy by construction:** hostnames not URLs, paths not query strings,
   values capped at 100 characters (paths at 200), control/HTML characters stripped, anything
   containing `@` stored as `[redacted]`, click ids (`gclid`, `fbclid`) never
   read. No cookies are added.

## 3. Where attribution is kept

| Place | What | When |
|---|---|---|
| `localStorage` `recon:attr:v1` | the attribution state for this browser | every page load (`captureAttribution()` in `src/main.jsx`, before the router and before the older tracker) |
| `localStorage` `recon:attr:sync:v1` | event keys already recorded per signed-in user (keyed by a hash, never the user id) | after a successful record |
| Plausible custom properties | `source`, `channel`, `medium`, `campaign`, `content`, `last_source`, `landing` on every `track()` event | every event (`src/utils/analytics.js`) |
| player-data events (Recon's system of record) | the events below, on the signed-in player's own timeline | signed-in page loads and checkout clicks (`src/components/AcquisitionTracker.jsx`) |

The older keys (`recon:src`, and `recon:campaign` on the production line) are
left exactly as they were; nothing here reads them except the one-time
first-touch adoption, and nothing writes them.

## 4. Event definitions

All events go to `POST /player-data/events` for the signed-in player, with
`visibility: private`. Shared policy:

- **Stored in:** player-data events table (`recon-player-events`).
- **Consent:** first-party measurement of how people found Recon; no
  cross-site identifiers, advertising ids or personal data in payloads.
- **Retention:** player-data event retention (deleted or anonymised on
  account request).
- **Owner:** Growth (Aaron).
- **Idempotency:** fixed `event_id` + `occurred_at` taken from stored facts;
  player-data keys events by `occurred_at#event_id` with a conditional write,
  and (with this change) treats a repeat of a caller-keyed event as success.

| Event | Fires | `event_id` / `occurred_at` | Payload |
|---|---|---|---|
| `acquisition_attributed` | first signed-in load on a browser with attribution | `acq-first-v1` / when this browser was first seen | `first_touch`, `first_non_direct_touch`, `last_touch`, `landing_path`, `visits`, `first_seen_at`, `seeded_from_legacy` |
| `acquisition_touch` | each recorded non-direct touch not yet recorded for this player | `acq-touch-<hash>` / the visit time | `touch` |
| `checkout_started` | the existing "Pricing CTA Click" while signed in (a click, not a purchase) | `checkout-<tier>-<location>` / the minute | `tier`, `location`, `attribution` snapshot |

A player's **signup attribution** is the earliest `acquisition_attributed`
record whose `first_seen_at` is at or before their account creation time. If
the browser was first seen after the account was created (existing players,
new devices), the record is still kept but reported as "attribution after
signup", not as the signup source.

Anonymous visitors are never recorded server-side; their behaviour is
measured by Plausible (cookieless) only.

## 5. Funnel definitions

| Stage | Defined by (fact) | Source | Measurable now |
|---|---|---|---|
| Visitor | a visit to the app | Plausible unique visitors (app pages; static pages not yet instrumented) | partial |
| Signup | Cognito user created | Cognito `UserCreateDate` | yes |
| Verified | Cognito user `CONFIRMED` with a verified email | Cognito | yes |
| Profile completed | minimum identity fields set | `ghost-igl-profiles` | yes |
| First value | first core action: round plan, match prep, VOD review, Road to Champion task, coaching session | customer-success activity, player-data, climb, bookings | after PR #24 deploys |
| Activated | profile complete **and** a core action (customer-success rule) | same | after PR #24 deploys |
| Engaged | activated and active on 3+ distinct days in 14 | same | after PR #24 deploys |
| Trial | live Stripe `trialing` row, or a no-card trial row | subscriptions ledger | yes |
| Paid | live, Stripe-billed, non-trial row | subscriptions ledger (+ live Stripe check) | yes |
| Retained | paid and still paid after the first renewal | ledger (period end beyond the first interval); invoices for exact | approximate |
| Referred | referred at least one signup / was referred | `ghost-igl-referrals`, `referred_by` | yes (lookup fix pending) |

At-risk and churned follow the customer-success lifecycle (PR #24, docs §4).
Every metric in the command center is a count of these facts; ratios always
show numerator and denominator.

## 6. The 700 target

630 additional verified users in 90 days is **7.0 per day, 49 per week**
(about 53 per week if counted over 12 weeks). The command center will show
the actual trailing 28-day rate of net-new verified users, the projection at
that rate, and the gap; no conversion rate or forecast is assumed before
there is data to compute it.

## 7. Command center (phase 2 plan)

Admin-only page backed by a read-only aggregation (same isolation pattern as
the customer-success stack):

- Totals: registered, verified, net-new verified (day / week / 28 days), DAU,
  WAU, MAU (from recorded activity), activated, engaged, trial, paid, retained,
  at risk, churned, referred.
- Conversion between every funnel stage, by source, channel, campaign,
  landing page and content id, with sample sizes.
- Free-to-paid and trial-to-paid, paying subscribers, ledger MRR (charged
  subscriptions only), retention and churn, referral rate.
- Progress to 700 with the trailing-rate projection.
- Best content, landing pages, campaigns and channels (by verified and paid,
  not visits); drop-off points; running experiments; a short, prioritised
  action queue (same rules as the CRM queue: facts, reason, recommendation).

Inputs: Cognito, profiles, the subscription ledger, player-data acquisition
events, customer-success activity, referrals, and the Plausible Stats API for
anonymous stages.

## 8. Integrating with the production line

- `src/utils/analytics.js` conflicts with `8054871`, which also enriches
  `track()` (`source`, `medium`, `campaign`, `content`, `path`). Keep this
  change's `attributionProps()` (same key names, raw-value-safe, plus
  `channel`, `last_source`, `landing`); `path` can stay.
- `src/main.jsx`: this change adds two imports after `LandingPage` and one
  call before `captureRefSource()`; production changed the `refSource` import
  line, so the hunks should merge cleanly.
- Production's `/tiktok` redirect sets campaign values in JavaScript, not in
  the URL. Redirect with the UTM parameters in the URL (or call
  `captureAttribution` after setting them) so they are captured.
- Server-side next steps on the production line: put the attribution snapshot
  in Checkout Session metadata (note the checkout idempotency key hashes
  user + tier + a 5-minute window: keep metadata stable within that window),
  copy it onto the subscription row in the webhook, and add it to booking
  checkout metadata.
- `src/lib/playerData.js` exists only on `main`; production builds need it
  and `VITE_PLAYER_DATA_API_URL` for signed-in recording.

## 9. Required settings (each needs Aaron's approval)

1. **Player-data Lambda redeploy** (manual `workflow_dispatch` of the existing
   player-data workflow) so repeated caller-keyed events succeed and invalid
   dates return 400. Until then, a repeated event returns an error that the
   browser ignores (it is recorded locally as pending and retried once per
   page load).
2. **`VITE_PLAYER_DATA_API_URL`** set in the production site build. Without
   it, signed-in recording is off and only Plausible properties are sent.
3. **Plausible:** add the custom properties `source`, `channel`, `medium`,
   `campaign`, `content`, `last_source`, `landing` under Site settings, so
   they appear in the dashboard.
4. **Privacy policy:** add a sentence that Recon records how visitors found
   the site (source, campaign, landing page) in the browser and, after
   sign-in, on the account. Legal wording is Aaron's call.
5. Phase 2 only: a Plausible Stats API key stored as a secret.

## 10. Limitations

- Static pages (blogs, guides, tools, coaching) are not instrumented yet;
  a visitor who lands there and then opens the app is attributed as direct.
  Phase 5 adds a shared static snippet.
- Client-side attribution is self-reported by the browser: it can be blocked,
  cleared, or spoofed, and it does not follow a person across devices.
- Anonymous funnel stages come from Plausible, which excludes visitors who
  block it.
- Checkout, subscription and booking attribution is not yet written
  server-side (see §8); `checkout_started` records intent only.
- The development-only inspector (`?attr_debug=1`) is absent from production
  builds.
