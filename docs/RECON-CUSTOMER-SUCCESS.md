# Recon 6 customer success: player home, CRM, outreach and feedback

This is the operating layer between Recon's product data and the people who
use it. Players get one focused home that tells them what to do next. Aaron
gets one customer-success CRM that tells him who needs a human and why.
Everything is derived from recorded facts; nothing is hand-entered or
invented.

Status: **built and tested, not deployed.** Delivery of messages is
**disabled** by default and there is no email transport in the code.

## 1. Architecture

```
existing Recon tables (read-only)          customer-success table (new, retained)
  subscriptions, profiles, climb,            activity beacons, messages, consent,
  bookings, coaching events, player-data,    outreach records, feedback, prompt
  referrals, crm-log, testimonials, Cognito  state, queue decisions, audit
                 \                                  /
                  +---- data/assemble.mjs ---------+     one read per source; a
                                 |                       failing source is marked
                        domain/facts.mjs                 "unavailable", never "none"
                                 |
     +-------------+-------------+--------------+----------------+
 lifecycle.mjs  mission.mjs  activation.mjs  outreach.mjs     feedback.mjs
 (stage, health) (next action)               (eligibility)    (moments, themes)
     |                |                            |                |
 CRM projections  customer home projection    outreach records  prompts + analysis
 (routes/admin)   (GET /cs/me/home)           (routes/outreach) (routes/feedback)
```

- `lambda/customer-success/domain/*` is pure JavaScript with no AWS or Node
  imports. The Lambda uses it, and the browser uses the same files for the
  home's **lite mode** (`src/features/home/liteHome.js`), so the player sees
  the same truth whether or not the new API is deployed.
- `app.mjs` is the SDK-free application core (`createApp(deps)`); `index.mjs`
  only wires AWS clients and environment. Tests and the local dev server run
  the production code against in-memory data.
- Infrastructure is an **isolated SAM stack** (`aws/customer-success-template.yaml`),
  like `player-data-template.yaml`. Deploying it does not touch the main
  `ghost-igl` stack.

## 2. Data sources

| Source | Where | Key | Used for | Access |
|---|---|---|---|---|
| Logins | Cognito pool `us-east-1_rvLy8WLQB` | email | account status (CONFIRMED / FORCE_CHANGE_PASSWORD / UNCONFIRMED / no account), created date, admin group | `ListUsers`, `ListUsersInGroup` |
| Billing ledger | `ghost-igl-subscriptions` | `stripe_customer_id`, GSI `email-index` | plan, status, paid-through date, price, VOD counters | read |
| Profiles | `ghost-igl-profiles` | `email` | names, gamertag, platform, rank/goal, `last_seen_at`, referral fields | read |
| Road to Champion | `recon6-climb-progress` | Cognito `sub` | checklist progress (40 habits) | read |
| Coaching bookings | `recon6-bookings` | `slotId` (scan, filter by email) | upcoming/completed sessions, credits | read |
| Live coach history | `recon6-coaching-events` | `userId` (= sub) | coached match count | read |
| Player data | `recon-player-store`, `recon-player-events` | `recon_player_id` | VOD reviews, skill gaps, practice plans, rank provenance | read |
| Referrals | `ghost-igl-referrals` | referrer / referred email | referral counts | read |
| Existing CRM log | `ghost-igl-crm-log` | `email` | welcome / win-back / confirmation-nudge history | read (optional suppression write, §8) |
| Testimonials | `ghost-igl-testimonials` | `id` | published count | read |
| Live Stripe | existing `GET /admin/users` (admin Lambda, #17) | — | on-demand revenue and cancellation check in Billing & health | existing endpoint |

Cancellation schedules and invoice history are **not** in the ledger (the
webhook never stores `cancel_at_period_end`). The CRM says so and offers the
live Stripe check for them.

## 3. Plans and entitlements

Production access rules are mirrored exactly (`domain/plans.mjs`, tested):

| Plan | Price IDs | Notes |
|---|---|---|
| Basic | no active paid row | free account |
| Pro | `price_1TPtOK…` $9 founding, `price_1TLEtr…` $12, legacy All-Access `price_1TVUcx…`, `price_1TVUd3…` | |
| Elite | `price_1TLEts…` $29 legacy, `price_1TPtOY…` $39, legacy All-Access `price_1TVUd0…`, `price_1TVUd6…` | older ledger rows still say `champion`; the price decides |
| Champion | `price_1TzrjI…` $70 | two live 1:1 sessions per month |

Access = `active`/`trialing` **and** a future paid-through date, best row by
plan then date (production `pickBestSub`). A failed payment or an unrecorded
renewal pauses access (production behaviour, unchanged) but the player still
sees the plan they pay for, with the reason and the fix, and no upsell. A row
Stripe calls live but with **no** paid-through date (the admin backfill can
write one) is treated the same as a passed date: production grants nothing,
so it is flagged as "renewal not confirmed", never shown as a free account.

Access and paying are separate questions:

- **Access** comes from the best row, which can be a comp (often dated 2099).
- **Paying** means a live Stripe-billed row that is not a trial. A member on
  complimentary access who also has a live paid subscription is still counted
  as paying, under the plan they pay for; the home tells them, and the CRM
  flags it for review. Card-up-front Stripe trials are paid members (they have
  access through Stripe) but are **not** counted as paying or in MRR until
  charged; the CRM shows them separately.

Lite mode (no customer-success API yet) reads `/me`. It relies on the
production `/me` contract: `plan` is production's `effectivePlan` (legacy
$29/$39 prices report `elite`), admin-granted rows are keyed `comp_…` /
`admin_…`, and a paused member reports `free`, so the paused plan is unknown
and the copy never names one ("Paid membership", "your last payment").

VOD allowances follow the production subscription and VOD Lambdas (Elite
60/75, Champion 75/90). `main`'s older VOD Lambda predates the Elite tier.

`src/hooks/useAuth.jsx` now normalises plans with `src/config/memberships.js`
(byte-identical to the production line) so `elite` is never dropped to free.

## 4. Lifecycle and health

Stages, first match wins:

| Stage | Rule |
|---|---|
| Churned | paid before, no access, subscription ended (or Stripe gave up: `unpaid`) |
| At risk | paying (or payment retrying / renewal unconfirmed) **and** a critical, high or commercial risk |
| Paid | access through a Stripe-billed row, no such risk |
| Engaged | activated and active on 3+ distinct days in the last 14 |
| Activated | profile complete and at least one core action (round plan, match prep, VOD review, Road to Champion, coaching) |
| Activating | signed in or started, not activated |
| Signed up | account exists, nothing else recorded |

Health = worst risk (critical / at risk / needs attention), else healthy,
dormant (activated free player idle 30+ days) or unknown (billing unreadable).
Every risk carries a reason and dated evidence:

| Risk | Severity | Fires when |
|---|---|---|
| `payment_failed` | critical | ledger `past_due` / `unpaid` / `incomplete` |
| `renewal_unconfirmed` | critical | `active`/`trialing` row whose paid-through date passed or was never recorded |
| `paid_no_account` | critical | paying, no Cognito user |
| `account_setup_incomplete` | critical | paying, Cognito FORCE_CHANGE_PASSWORD / UNCONFIRMED / RESET_REQUIRED |
| `account_disabled` | critical | paying, Cognito user disabled |
| `paid_never_logged_in` | high | paying 2+ days, login works, never opened the app |
| `inactive_14d` | high | paying, no activity for 14+ days |
| `cancel_scheduled` | high | cancellation scheduled (when known) |
| `not_activated_7d` | medium | paying 7+ days, not activated |
| `unused_paid_features` | medium | activated payer not using Elite/Champion features |
| `negative_feedback` | medium | helpfulness ≤ 2 or recommend ≤ 6 in 30 days, unresolved |
| `unanswered_message` | medium | player message waiting > 24h |
| `duplicate_live_subscriptions` | medium | 2+ live Stripe rows on one email |
| `secondary_payment_failed` | medium | another row on the email is failing |
| `comp_with_paid_subscription` | medium | complimentary access while a paid subscription is also live |
| `email_unconfirmed` | low | free signup unconfirmed 2+ days (existing CRM job nudges) |
| `plan_label_mismatch` | low | ledger label disagrees with the price (access unchanged) |

## 5. Action queue

Only items that need a human (10 types). Each shows what happened, why it was
flagged, the recommended action and item-specific controls. Items are keyed
by an occurrence fingerprint: once decided, the same occurrence never comes
back; a new occurrence (a later failed payment) does.

| Item | Controls | Approve records |
|---|---|---|
| Paying, no site login | approve, fix, dismiss | account-help message |
| Paying, first login never finished | approve, fix, dismiss | login-help message |
| Renewal not recorded | fix, dismiss | — (check Stripe, run backfill) |
| Payment still failing after 3 days | approve, deny, dismiss | card-update reminder |
| Paying subscriber gone quiet | approve, deny, dismiss | personal check-in |
| Unhappy feedback | approve, fix, dismiss | feedback reply |
| Player message waiting | fix, dismiss | — (reply in Conversations) |
| Two live subscriptions | fix, dismiss | — (check invoices first) |
| Paying while on complimentary access | fix, dismiss | — (decide in Stripe) |
| Coaching session recap | approve, deny, dismiss | recap (Aaron replaces the placeholder first) |

"Payment still failing" is measured from the estimated failed renewal (one
billing interval before the recorded period end), not from the last ledger
update, which moves on every Stripe retry; the item says which basis it used.

Everything else is **auto-handled** and only counted (fresh failed payment,
never-signed-in nudge, activation nudge, unused-features walkthrough,
confirmation nudges, cancellation prompt). Decisions are validated against
the live item, idempotent (409 on repeat) and audited. An approval that could
not produce an allowed, placeholder-free message is refused **before**
anything is written.

The list and the player record agree: the list loads desktop / live-coach
activity for every player with a live paid relationship (the ones the at-risk
rules apply to), and a decision is accepted for an item shown in either view.

## 6. Customer home

One "Today's Mission", chosen by ordered rules (first match wins):
fix payment → confirm renewal → coaching session within 72h → finish profile
→ drill the fix from a VOD review in the last 7 days → first round plan →
(Champion) book included session → first VOD review → book with credits →
next Road to Champion habit → start Road to Champion → continue last round
plan → prep next match. Every mission lists the facts that triggered it.

Also: Road to Champion progress (real checklist, "not started" instead of
0%), activation checklist (only steps available on the player's plan;
"couldn't check" when a source failed), continue where you left off, what
you're improving (VOD / coaching / checklist, with source and date),
evidence, where you're stuck, VOD status and next action, coaching,
membership and usage, messages, email preferences, help, and six tools.
Removed: the old dashboard's generic tips and blog lists for other games.

## 7. Outreach

| Workflow | Consent class | Channel | Approval | Limits |
|---|---|---|---|---|
| Welcome | relationship | email | existing CRM job | never re-sent here |
| Win-back | marketing | email | existing CRM job | never re-sent here |
| Activation nudge | relationship | in-app | automatic | 2, 7 days apart |
| Paid, never signed in | service | email | automatic | 2, 4 days apart |
| Account access help | service | email | Aaron approves (queue) | 3, 2 days apart |
| Card update reminder | service | email | Aaron approves (queue) | 2, 3 days apart |
| What you paid for | relationship | in-app | automatic | 1 |
| VOD review follow-up | relationship | in-app | automatic | 1, 14 days apart |
| Coaching follow-up | relationship | email | Aaron approves (queue) | one per session, 2 days apart |
| At-risk check-in | relationship | email | Aaron approves (queue) | 1, 21 days apart |
| Feedback reply | service | in-app | Aaron approves (queue) | 1 |
| Dormant player | marketing | email | automatic | 1, 60 days apart |
| Feedback by email | relationship | email | automatic | 3, 21 days apart |
| Cancellation feedback | relationship | in-app | automatic | 1 |

Rules, in order: contact state readable (if the customer-success store or,
for marketing, the existing CRM log could not be read, **nothing** goes out;
defaults would ignore an opt-out) → do-not-contact (including one mirrored to
the existing CRM log) → consent class (service: only DNC blocks;
relationship: respects opt-out; marketing: needs explicit opt-in and no
suppression in the existing CRM log) → per-workflow max and cooldown → quiet
period (no automated nudge within 72h of a player message) → global cap (one
non-service message per 72h, four per 30 days, **including the existing CRM
job's sends**) → idempotency (one record per workflow occurrence, conditional
put).

Enforced at run time as well:

- Consent is re-read immediately before each delivery; an opt-out or
  do-not-contact set since evaluation records the message as `suppressed`.
- One run delivers at most one non-service message per player (the rest are
  reported as blocked by the 72-hour cap and wait for a later run).
- Only messages that reached, or are about to reach, the player (`approved`,
  `delivered`, `sent`) count toward caps and one-shot limits. Records made
  while delivery is off reached nobody and consume nothing.
- Workflows that need Aaron's approval never run automatically; they appear
  in the action queue, where the approval happens.

Delivery modes (`OUTREACH_DELIVERY_MODE`): `disabled` (default: recorded as
`delivery_disabled`, nothing reaches anyone) or `in_app` (in-app messages
become visible). Email is never sent: `lib/delivery.mjs` has no transport. An
admin reply only marks the player's message answered once it was delivered;
a reply recorded while delivery is off leaves the thread waiting. Replies
carry a client id, so a double-click or retry is never sent twice.

Inbound: `inbound.mjs` parses a raw email (quoted history stripped, linear
time on hostile headers), deduplicates by Message-ID and attaches it to the
player. A missing, malformed or future `Date` falls back to the receipt time.
Sender authentication uses the SES receipt verdicts: only DMARC pass (or SPF
and DKIM both passing when there is no DMARC verdict) counts as verified.
Unverified mail is kept for admins, flagged, and never shown to the player as
their own message. A verified STOP / UNSUBSCRIBE suppresses relationship and
marketing email; an unverified one only turns marketing off (the harmless
direction) and an admin confirms anything more.

## 8. Consent and suppression

Players manage preferences on their home (`#contact-preferences`); account
and billing notices always go. Admins can mark do-not-contact (reason
required, audited). The player sees that messages are paused but never the
admin's reason. Consent writes use optimistic concurrency and retry on a
conflict, so an opt-out is never lost to a race. With
`SyncLegacySuppression=true`, opt-outs are mirrored
to `ghost-igl-crm-log.marketing_suppressed_at` so the existing daily CRM job
honours them; the IAM grant is limited to that table and those attributes and
only ever sets a timestamp (`if_not_exists`).

## 9. Feedback

| Moment | When | Questions |
|---|---|---|
| Cancellation | cancel scheduled / ended ≤ 14 days | reason, missing, comment |
| Failed renewal | payment failed | blocker, comment |
| After coaching | session ≤ 3 days ago | helpful, result, recommend, review permission |
| After VOD review | review ≤ 3 days ago | helpful, result, confusing |
| After real use | a Road to Champion tier completed, or 5 recorded round plans | used, helpful, missing |
| Month 1 | days 28-35 | result, helpful, missing, recommend, review permission |
| Week 1 | days 7-10 | used, helpful, missing, recommend |
| Early days | days 2-4 and has signed in | used, helpful, confusing |

One prompt at a time; 5-day cooldown (cancellation and failed renewal bypass
it); answered or dismissed moments never return; "not now" works once. One
response per moment occurrence. Card numbers and passwords are rejected in
free text. The CRM computes the recommend score only from 5+ answers, and
themes are keyword rules that show their source quotes. Review quotes can
only be approved with the player's explicit publish permission; approval
returns a draft and never publishes.

## 10. Security and privacy

- Identity always comes from the verified Cognito ID token; no header, body
  or query parameter can name another player. Tokens whose email is not
  verified are refused, because records are keyed by email (the same rule as
  production's `/me` routes). Admin routes require the `admins` group
  server-side (401/403 tested on every route).
- Multi-page reads fail closed: a scan or query that would need more than 40
  pages throws instead of returning a partial list (which would drop some
  players' consent and decisions). Activity writes are bounded by key: one
  record per player, type and day.
- CORS allows only the production origins; a validation stack can add one
  origin through the `DevOrigin` parameter.
- CRM search terms (often emails) stay in the browser: never in page URLs and
  never sent to the API.
- "View as player" is a read-only admin projection; it performs no writes.
  Player read state (`readByPlayerAt`) only changes through the player's own
  token; admins set `readByAdminAt` only.
- Admin URLs use opaque contact keys (`pl_…`), never emails. Booking manage
  tokens are never returned. Customer responses exclude internal health/risk
  labels.
- Activity beacons record only map / site / side ids and expire after 180
  days (DynamoDB TTL). No gameplay, credentials or free text are captured.

## 11. Data changes

One new DynamoDB table, `recon-customer-success` (on-demand, point-in-time
recovery, retained on delete/replace, TTL on `expires_at`):

| sk | Item |
|---|---|
| `ACT#<day>#<type>` | activity beacon, latest place that day (TTL 180d) |
| `MSG#<iso>#<id>` | message (inbound or outbound, with delivery status) |
| `FB#m#<moment>#<instance>` | feedback response |
| `PROMPT#<moment>#<instance>` | prompt state (shown / snoozed / dismissed / answered) |
| `CONSENT` | contact preferences, do-not-contact, history |
| `OUT#<workflow>#<instance>` | outreach record (idempotency key) |
| `DEC#<queue item>` | queue decision |
| `AUDIT#<iso>#…` | audit entry |
| `IDEM#<scope>#<clientId>` | idempotency marker for admin replies (TTL 7d) |

`pk = C#<contactKey>`; GSI `gsi1` (`gsi1pk` = type, `gsi1sk` = time) serves
cross-player lists without scans. **No existing table changes shape.** The
only write to an existing table is the optional suppression mirror (§8).

## 12. Deployment and production configuration (all require Aaron's approval)

1. `sam validate --lint -t aws/customer-success-template.yaml` and deploy a
   validation stack with a non-production `TablePrefix`.
2. Deploy the production stack (`recon-customer-success-prod`). The GitHub
   OIDC deploy role is scoped to the player-data stack today; extend
   `aws/github-actions-recon-deploy-permissions.json` or deploy manually.
3. Set `ActivityTrackingSince` to the deploy date.
4. Set the frontend build variable `VITE_CUSTOMER_SUCCESS_API_URL` to the
   `CustomerSuccessApiUrl` output. Until then the home runs in lite mode and
   the CRM shows a "not configured" notice.
5. Optional, separately: `FeatureMessaging=true`, `FeatureFeedback=true`,
   `SyncLegacySuppression=true`, and only after review
   `OutreachDeliveryMode=in_app`. Email delivery requires a new change.
6. Inbound email: add an SES receipt rule for the reply address that stores
   raw mail in S3 and invokes a small handler around `ingestInboundEmail`,
   passing the receipt's SPF / DKIM / DMARC verdicts.
7. No scheduler is included; outreach runs are started from the CRM.
8. Recommended hardening for the shared user pool (main stack, separate
   change): require verification before an email change takes effect
   (`UserAttributeUpdateSettings.AttributesRequireVerificationBeforeUpdate`).

## 13. Local development

```bash
node scripts/cs-dev-server.mjs   # production API code over fictional data, 127.0.0.1:8787
npm run dev                      # then open /__dev/home?as=paying_active or /__dev/crm
```

`/__dev/*` routes exist only in dev builds (`import.meta.env.DEV`) and are
absent from production bundles. Fixtures (`lambda/customer-success/fixtures`)
are invented people on the reserved `.test` domain.

## 14. Integrating with the production line

`content/strat-beta-disclaimer` (production) and `main` diverge by ~65
commits each. Merged onto production this branch adds two conflicts beyond
the existing 39: `src/hooks/useAuth.jsx` (keep production's
`normalizePlan`/`hasPlan`; add this branch's `account` state; the home also
falls back to reading `/me` if `account` is absent) and
`src/pages/DashboardPage.css` (delete; the home replaces it). New files merge
cleanly; `src/config/memberships.js` is byte-identical on both lines. The
referral program widget from the old dashboard is kept on `/dashboard`.

Where `main` and production differ, this layer follows production:
`isActiveSub` requires a future paid-through date for every row, `/me`
reports `effectivePlan`, and VOD allowances include the Elite tier. Keep
production's subscription and VOD Lambdas when integrating.

## 15. Known limitations

- Strategy / match-prep activity is recorded only after the stack is
  deployed; earlier activity shows as "not recorded", not "none".
- VOD analyses are not stored anywhere; the home shows review counts and
  player-data summaries, not full reports.
- Bookings are scanned (tens of rows today); add an email index before the
  table grows.
- The CRM directory reads every table per request (20s cache), plus one
  timeline and one live-coach query per player with a live paid relationship;
  fine for hundreds of players, needs indexes and pagination for tens of
  thousands. Past 40 pages a read fails closed rather than truncating.
- Cancellation schedules come only from the live Stripe check.
- Referral records may be incomplete; referral and channel attribution are
  being repaired in the separate Acquisition Engine change.
- No scheduled outreach runner and no email transport, by design.
