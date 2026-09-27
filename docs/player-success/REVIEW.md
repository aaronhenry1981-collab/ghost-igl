# Player Command (Player Success & Support): review package

Branch `claude/player-success-support`, stacked on PR #24 (`claude/recon-cs-foundation`). **Review only.**
- Nothing is deployed, routed, emailed or published.
- No player has been contacted, and no Stripe, DNS, entitlement or marketing change was made.
- Every Support flag defaults **off**.
- Separate from billing PR #33, which it neither changes nor depends on.

Companion docs: [ARCHITECTURE.md](ARCHITECTURE.md) (design and data model) · [API-CONTRACT.md](API-CONTRACT.md) (final request/response shapes, generated from the real backend).

## 1. Existing-system inventory (what was reused)

| Existing primitive | State | Support uses it for |
|---|---|---|
| PR #24 customer-success Lambda: `createApp`, route modules, `lib/http`, verified-email Cognito auth, `admins` group | built, **not deployed** | the Support route module, auth, roles |
| PR #24 single table + memory/Dynamo stores | not deployed | case/event/incident items (new item types, same table) |
| PR #24 Player 360 assembly, facts, lifecycle, `playerRecord`, action queue | not deployed | Player 360, onboarding/lifecycle signals |
| PR #24 `domain/plans.mjs` `resolveBilling` (parity-tested with production) | not deployed | the **only** entitlement resolver; no Stripe logic in Support |
| PR #24 `inbound.mjs` parser | not deployed | email ingestion (hardened here: RFC 5322 From parsing, DMARC-only trust) |
| Deployed `ghost-igl-mail-forward` (support@ receipt) | **deployed** | future inbound hook (unchanged here) |
| Deployed player-data (`recon-player-snapshots`, `-identities`, `-provider-health`, `reconPlayerIdFor(sub)`) | **deployed** | connection health, freshness, rank-discrepancy context (Query-only reads) |
| Deployed subscriptions/profiles/bookings/VOD usage | deployed | read-only diagnostics via PR #24's tables interface |
| PR #24 CRM console (`/admin/crm/*`), dev preview `/__dev/*` | not deployed | the Command Center lives inside it; fixture previews |

**Gaps in production that Support reports honestly, and does not invent:**
- VOD reviews have no job/request ids or stored failure records.
- There is no replay-upload system.
- Desktop activation and version are not recorded.
- Player-data doesn't record per-player failed sync attempts; provider health is global.
- The Stripe-reported state isn't checked (there is no read-only Stripe port).
- The admin audit route is unrouted in production.

## 2–13. Where each deliverable lives

| # | Deliverable | Location |
|---|---|---|
| 2 | Architecture | `ARCHITECTURE.md` §1–§2 |
| 3 | Schema / migration plan | `ARCHITECTURE.md` §3; `support/items.mjs`. The DynamoDB single table needs no migration: new item types and prefixes only (`CASE#`, `CEV#`, `ATT#`, `SUP#…`). |
| 4 | Player portal | `/support`, `/support/cases/:caseNumber`: `src/features/support/player/*` |
| 5 | Command Center | `/admin/crm/support/*` inside the PR #24 console: `src/features/support/staff/*` |
| 6 | Player 360 | case workspace panel (PR #24 summary + support context) |
| 7 | Support Copilot | `support/copilot.mjs`: deterministic, every item tagged fact/inference, copy-guarded draft, no write paths. The model adapter is off. |
| 8 | Diagnostics framework | `support/diagnostics/*`: 11 providers, player vs staff views, role masking, secret scrub. Entitlement operator view and connection health per source. |
| 9 | Proactive Player Care | `support/proactive.mjs` + `service.recordProactive`: five rules on real telemetry only; dry-run by default; weekly dedupe; never contacts the player; player-safe text only. |
| 10 | Incident foundation | `support/incidents.mjs`, staff routes/UI; the customer-safe update is draft-only. |
| 11 | Help Center | `/help`, `/help/:slug`; 11 articles grounded in product behaviour, each citing source files. **All `draft`, pending Aaron's review**, so production serves none yet. Search is natural-language BM25 plus synonyms. |
| 12 | Support email | `support/email.mjs` + hardened `inbound.mjs`: canonical Message-ID hash, claim/lease dedupe, HMAC plus-address case tokens, References threading, DMARC-only sender trust, automated/DSN classification, uncertain → review queue, attachments manifest, STOP is not an opt-out. **Not wired to SES.** |
| 13 | Metrics / CSAT | `support/metrics.mjs` (computed only from stored events; `null` where there's no data); CSAT asked once per resolution. |

## 14. Tests and negative controls

| Suite | Result |
|---|---|
| customer-success (PR #24's original 102 + Support) | **290 / 290** |
| `src/features/support/` + `scripts/support/` (UI logic, contract, client second lock) | **32 / 32** |
| lint / build / fixture-snapshot parity | clean / OK / match |

The suite covers:
- authorization: cross-player access by number, id or email → 404, byte-identical to "missing";
- the full staff role matrix on 24+ routes, unverified email and flag-off 404;
- player projections: no private notes, staff diagnostics, copilot, SLA, Stripe ids or other players' data;
- status workflow, messages, notes, attachments (disabled path, allowlist), email dedupe/threading/uncertain identity;
- billing references and entitlement mismatch display;
- identity connection state, VOD and coaching cases;
- escalation handoff, incident linking, reopen, CSAT once;
- copilot permissions, sensitive-action blocking (no write outside the Support partitions is possible);
- proactive dedupe, metrics, redaction, rate limits (atomic), audit uniqueness;
- mobile overflow on every screenshot.

**Independent adversarial review:**
- Result: 1 blocker, 2 major and 12 minor findings, **all fixed**. Each has a regression test (`support/security.test.mjs` SEC-01…SEC-15, `src/features/support/security.test.mjs`) that failed before its fix.
- The blocker was encoded-word From-header smuggling in PR #24's shared parser. The majors were SPF+DKIM without DMARC being trusted, and proactive evidence visible to players.
- The two PR #24 files touched for this (`inbound.mjs`, `lib/http.mjs`) keep their original tests green.

## 15. Screenshots

64 shots: 32 screens × desktop 1440×900 and mobile 390×844, all with fictional data from fixtures generated by running the real backend. 0 overflow, 0 console errors. See the evidence branch `claude/player-success-evidence` (`index.html` contact sheet).

## 17. Implemented vs connected vs tested vs live

| Area | Implemented | Connected | Tested | Live |
|---|---|---|---|---|
| Case model, workflow, roles, audit | yes | no (flag off, PR #24 undeployed) | unit + route + security | no |
| Player portal, Help Center UI | yes | no (links hidden unless `VITE_SUPPORT_UI=true`) | logic + contract + screenshots | no |
| Command Center | yes | no | logic + contract + screenshots | no |
| Diagnostics / Player 360 | yes | reads only; tables wired in code, no deploy | unit + integration | no |
| Entitlement operator view | yes | read-only; Stripe state "not checked" | unit | no |
| Copilot | yes (deterministic) | model adapter off | unit + guard | no |
| Proactive care | yes | dry-run only, flag off | unit + security | no |
| Incidents | yes | no | unit + route | no |
| Email ingestion | yes (pure) | **not wired** (SES/mail-forward) | unit + adversarial | no |
| Attachments | manifest + validation | **no bucket / presign** | unit | no |
| Help articles | 11 drafts | not published | search tests | no |
| Metrics / CSAT | yes | no | unit | no |

## 18. Remaining provider / secret / DNS / access steps (each needs Aaron's approval)

1. Land and deploy PR #24 (the customer-success stack). This work is stacked on it.
2. Settle the contact-key decision D-C1 (HMAC, secret in Secrets Manager) before any data is stored.
3. Set `FEATURE_SUPPORT=true` only after review, in a controlled rollout.
4. Grant IAM `dynamodb:Query` on the three player-data tables (already in the template, not deployed).
5. Attachments: a private S3 bucket (SSE, lifecycle, malware scan) plus a presign route.
6. Email:
   - hook the mail-forward receipt path to Support ingestion;
   - store the plus-address token secret in Secrets Manager;
   - add the SES identity, DKIM and DMARC for support replies;
   - add the `sendGate` transactional switch;
   - decide whether direct support replies are exempt from a relationship opt-out.
7. Create Cognito groups `support-agent` / `support-billing` / `support-engineering` / `support-lead` when there's staff beyond `admins`. Four-eyes authorization needs two leads/admins.
8. Aaron reviews and publishes the Help Center drafts (`status: 'reviewed'`, `reviewedBy`).
9. Add the API Gateway routes for `/cs/*support*` and `/cs/help/*`, and put `/help` in the sitemap.
10. Schedule the auto-close sweep (dry-run first, rule created disabled).
11. An optional model-drafted copilot needs a cost/risk/measurement/rollback case first.

## 19. Rollback / migration

- **No schema migration.** Support only adds item types to PR #24's retained table, and writes nothing else. Items stay if the flag is turned off.
- **Rollback:** set `FEATURE_SUPPORT=false`. The routes return 404 and the UI shows "support not enabled". Hide the links by unsetting `VITE_SUPPORT_UI`.
- **Changes to PR #24 files**, all additive or security fixes:
  - store pagination (fail-closed);
  - CORS allows PATCH;
  - tables gain Query-only player-data readers;
  - inbound From parsing and DMARC-only trust;
  - `matchPath` returns 400 on malformed encoding.

## 20. Found along the way (outside this PR; for the ledger)

PR #24's base (main line) still carries copy the production line already fixed or that conflicts with current decisions:
- founding $9/$29 prices and "30-day free trial" wording;
- a "Free Intro" default in booking emails (`lambda/booking/index.mjs`);
- a real name in player-facing plan copy (`PLAN_FEATURES`, `activation.mjs`);
- a Privacy page promising self-serve export and deletion that doesn't exist;
- an Elite VOD limit keyed to the "champion" label;
- the personal-data audit flags a handle placeholder in the index and ProgressPage chunks.

These belong to PR #24's rebase onto production (PR-T1 scope), not to this workstream.
