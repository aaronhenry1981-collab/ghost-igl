# Recon 6 Player Command: Player Success & Support — architecture and contract

**Status:** review-only design + implementation on branch `claude/player-success-support`, stacked on PR #24 (`claude/recon-cs-foundation`). Nothing is deployed, routed, emailed or published. Feature flag `features.support` defaults to **off**.

**Not Zendesk inside Recon.** A case is the entry point to a *player record*: the system already knows the account, access, identities, VOD/coaching history and recent failures, so the player never re-explains and staff never re-investigate from zero.

---

## 1. Where it lives (reuse, don't duplicate)

| Concern | Reused primitive (existing) | Support adds |
|---|---|---|
| HTTP app, CORS, errors, route modules | PR #24 `createApp` / `routes/index.mjs` / `lib/http.mjs` | `routes/support.mjs` route module (flagged) |
| Identity + roles | PR #24 `lib/auth.mjs` (verified-email Cognito ID token; `admins` group) | Support role mapping (§5) from Cognito groups |
| Storage | PR #24 single table `recon-customer-success` + `memoryStore` / `dynamoStore` | new item types under the same table (§3) |
| Contact key | PR #24 `contactKeyFor` (to be replaced by HMAC per decision D-C1 — Support calls it only through `ctx.keyFor`) | none |
| Player 360 data | PR #24 `assembleOne` / facts / lifecycle / `playerRecord` | support + diagnostics sections |
| Entitlement / access | PR #24 `domain/plans.mjs` `resolveBilling` (parity-tested against production) — **the only resolver Support uses**; no Stripe logic, no webhook imports | a read-only *view* (§7.2) |
| Admin work queue | PR #24 action queue (`queueItemsFor`, decisions) | `support_reply_due` / `support_escalated` queue items — no second queue |
| Conversation messages | PR #24 `messageItem` (in-app, player-visible) | case-scoped events (§3); a case message can mirror to the thread view |
| Inbound email | deployed `ghost-igl-mail-forward` receipt path (unchanged here) + PR #24 `inbound.mjs` parser | `support/email.mjs` ingestion rules (§10), wired later through the same receipt path |
| Outbound | PR #24 delivery (`disabled` / `in_app`) | nothing new; email replies later via the marketing `sendGate` (transactional) — OFF |
| Audit | PR #24 `AUDIT#` items (per contact) | every support write audited (unique sort keys) |
| Player history | deployed player-data (`recon-player-snapshots`, `recon-player-events`, `reconPlayerIdFor(sub)`) — Recon's timestamped history is the system of record | per-source connection health derived from it (§7.3) |

Support is a **separate domain folder** `lambda/customer-success/support/` with pure modules and explicit references to the primitives above. No cross-repo runtime dependency; names (case, incident, severity, escalation) stay compatible with a future IFD executive-support overview.

## 2. Principles

1. Ask the player only what the system cannot determine.
2. Facts are labelled with their source and timestamp; inferences are labelled as inferences with the rule that produced them. No hidden chain-of-thought; no invented telemetry — a source that does not record something says **"not recorded"**.
3. Support never performs billing, entitlement, identity, email, deletion/export, cancellation or refund changes. It records an **action request** (§6) that a person authorizes and the authoritative system executes; both steps are audited.
4. One player never sees another player's data. Private notes and staff diagnostics never reach the player.
5. No public SLA promises; SLA timestamps are internal.
6. Copy follows the repository's product-truth, coaching-terms and personal-data build guards (no trial wording, no forbidden coaching terms, no real player names/handles, no quoted paid strat text).

## 3. Data model (single table, new item types)

Partition keys:
- per player: `C#<contactKey>` (same as PR #24)
- global support index items: `SUP#<kind>` partitions

| pk | sk | Item |
|---|---|---|
| `C#<contactKey>` | `CASE#<caseId>` | **case** (current state, `version` for optimistic concurrency) |
| `C#<contactKey>` | `CEV#<caseId>#<iso>#<seq>` | **case event**: `message_player`, `message_staff`, `note_private`, `status_change`, `assignment`, `escalation`, `incident_link`, `system`, `csat`, `attachment`, `email_in` |
| `C#<contactKey>` | `ATT#<caseId>#<attId>` | attachment manifest (object key in a private bucket, mime, size, sha256, scan state) — never the bytes |
| `C#<contactKey>` | `SUP#RATE#<case\|msg>#<yyyy-mm-dd>#<slot>` | daily rate-limit slot (§11), claimed with a conditional put; TTL `expires_at` |
| `C#<contactKey>` | `IDEM#support_msg_<caseId>#<clientRequestId>` | message idempotency marker, scoped to the case |
| `SUP#COUNTER` | `CASENO` | human case-number counter (optimistic `version` loop) |
| `SUP#CASENO` | `<caseNumber>` | case-number → `{contactKey, caseId}` lookup |
| `SUP#CASEID` | `<caseId>` | case-id → `{contactKey, caseNumber}` (plus-address token threading) |
| `SUP#INCIDENT` | `INC#<incidentId>` | incident (§9) |
| `SUP#INCIDENT` | `INCEV#<incidentId>#<iso>#<seq>` | incident timeline entry |
| `SUP#EMAIL` | `MID#<sha256(canonical Message-ID)>` | inbound-email dedupe marker: a claim (`processing`) finalized to `done` after a successful apply; `failed` or a stale claim (5 min lease) is reclaimable |
| `SUP#EMAIL` | `OUT#<sha256(Message-ID)>` | outbound support reply → case (References threading; empty until outbound email exists) |
| `SUP#EMAIL` | `UNMATCHED#<iso>#<id>` | uncertain/unmatched inbound mail awaiting staff review |
| `SUP#PROACTIVE` | `PRO#<ruleId>#<contactKey>#<window>` | proactive-case dedupe marker |
| `SUP#KBPROP` | `KBP#<iso>#<id>` | proposed Help Center article/change (never published automatically) |

`gsi1pk` / `gsi1sk` (existing index): cases use `gsi1pk = 'CASE'`, `gsi1sk = <updatedAt>#<contactKey>`; incidents `gsi1pk = 'INCIDENT'`. Lists read all pages (`store.listByType(type, { all: true })`, fail-closed on a page error or past the store's page limit), never a silent first page. The service keeps a documented hard safety bound of 25,000 items per cross-contact list (503 beyond it).

### 3.1 Case record

```
caseId (uuid) · caseNumber ("R6-000123") · contactKey · reconPlayerId (sha of Cognito sub, for player-data joins) · email (contact) ·
product ("r6") · category · subcategory · source (portal|email|proactive|staff) · subject · description ·
status · priority (p1..p4) · severity (sev1..sev4) · waitingOn (recon|player|provider|null) ·
assignee · team (support|billing|player_data|vod_ai|coaching|security|leadership) ·
refs { subscription:{stripeCustomerId,stripeSubscriptionId}, coachingSession, vodJob, replay, identitySource, conversation, incidentId } ·
escalation { team, at, by, handoff } · rootCause · resolution { summary, code, at, by } ·
learning { productArea, avoidable, docGap, onboardingGap, bug, featureRequest } ·
tags[] · csat { rating, comment, at } ·
sla { firstResponseDueAt, firstResponseAt, nextResponseDueAt, resolveTargetAt } (internal only) ·
createdAt · updatedAt · resolvedAt · closedAt · reopenedAt · reopenCount · version
```
No secrets, tokens, passwords or card data are ever stored; free text is scanned and card-number / secret-looking strings are redacted before storage (§11).

### 3.2 Status workflow

States: `new → triaged → in_progress → waiting_on_player | waiting_on_provider → escalated → resolved → closed`, plus `reopened`.

| From | To | Who |
|---|---|---|
| new | triaged, in_progress, escalated, resolved | staff |
| triaged | in_progress, waiting_*, escalated, resolved | staff |
| in_progress | waiting_*, escalated, resolved | staff |
| waiting_on_player | in_progress (auto when the player replies), resolved | system / staff |
| waiting_on_provider | in_progress, resolved | staff |
| escalated | in_progress, resolved | staff |
| resolved | closed (after 7 days, or player confirms), reopened (player replies ≤ 14 days, or staff) | system / player / staff |
| closed | reopened (staff only; a player reply after close opens a *linked* new case) | staff |
| reopened | same as in_progress | — |

Player-facing buckets: **Open** (new, triaged, reopened), **Waiting on Recon** (in_progress, escalated, waiting_on_provider), **Waiting on me** (waiting_on_player), **Resolved**, **Closed**. Priority and severity are independent of state.

## 4. API contract (all under the existing `/cs` HTTP API; `features.support` off → 404)

The exact request/response shapes, generated from and tested against the real backend, are in **[API-CONTRACT.md](API-CONTRACT.md)**. The list below is the design summary.

Player (own data only; identity from the verified token):
- `POST /cs/me/support/triage` `{text, context?}` → `{suggestedCategory, confidence, questions[] (only what can't be determined), diagnosticsPreview, helpArticles[]}` (no case created)
- `POST /cs/me/support/cases` `{text, category?, subcategory?, answers?, clientRequestId}` → case (idempotent on clientRequestId)
- `GET /cs/me/support/cases` → buckets
- `GET /cs/me/support/cases/{caseNumber}` → case + public timeline + player-safe diagnostics
- `POST /cs/me/support/cases/{caseNumber}/messages` `{text, clientRequestId}`
- `POST /cs/me/support/cases/{caseNumber}/attachments` `{name, mime, size}` → upload intent (presign **not wired**; returns `upload_disabled` while the bucket is not provisioned)
- `POST /cs/me/support/cases/{caseNumber}/resolve-confirm` · `POST …/reopen` · `POST …/csat` `{rating 1..5 | up/down, comment?}`
- `GET /cs/help/articles?q=` · `GET /cs/help/articles/{slug}` (public, reviewed articles only)

Staff (role-checked, §5):
- `GET /cs/admin/support/queue?view=unassigned|mine|critical|billing|identity|vod|coaching|bugs|waiting|at_risk|incidents`
- `GET /cs/admin/support/cases/{caseNumber}` → case + full timeline + Player 360 + staff diagnostics + copilot
- `POST /cs/admin/support/cases/{caseNumber}/messages` (public reply) · `…/notes` (private) · `…/status` · `…/assign` · `…/escalate` `{team}` · `…/link-incident` · `…/resolve` `{summary, code, learning}` · `…/action-requests` `{kind, reason}` (§6)
- `GET/POST /cs/admin/support/incidents` · `GET/PATCH /cs/admin/support/incidents/{id}` · `POST …/timeline`
- `GET /cs/admin/support/metrics?from=&to=`
- `GET /cs/admin/support/email/unmatched` · `POST …/unmatched/{id}/assign`
- `GET /cs/admin/support/kb/proposals` · `POST …/proposals/{id}/decision`
- `POST /cs/admin/support/proactive/run?dryRun=1` (dry-run default; creates flagged cases only when dryRun=0 and the flag `support.proactive` is on)
- `POST /cs/admin/support/maintenance/auto-close?dryRun=1` (lead/admin; dry-run default; closes resolved cases after 7 days of no activity as the system actor; audited per case and per run; `service.autoCloseResolved({ now, dryRun })` is the same sweep for a future scheduler)

## 5. Roles and authorization

Roles come only from verified Cognito groups. Today only `admins` exists; `admins` holds every role. Future groups map without code change:

| Role | Group | Can |
|---|---|---|
| player | (signed in, verified email) | own cases only; public messages; player-safe diagnostics; CSAT |
| agent | `support-agent` | queue, cases, public replies, private notes, status, assign, escalate, link incident, staff diagnostics (no billing identifiers beyond last 4 of IDs) |
| billing | `support-billing` | agent + entitlement operator view with full Stripe references; create billing action requests |
| engineering | `support-engineering` | agent + technical diagnostics (job ids, request ids, error classes) |
| lead | `support-lead` | all of the above + incidents + metrics + KB proposal decisions + authorize action requests |
| admin | `admins` | everything |

Negative controls (tested): a player cannot read/modify another player's case by number, id or email; a player never receives private notes, staff diagnostics, copilot output, assignee, internal SLA, or other players' identifiers; staff routes return 401/403 without the role; copilot endpoints cannot execute an action request.

## 6. Sensitive actions

`kind ∈ { entitlement_repair, email_change, account_recovery, identity_unlink, data_export, data_deletion, cancellation, refund }` → an **action request** event on the case: requested by, reason, required verification (e.g. "player confirms from the verified address"), status `requested → authorized (lead/admin, audited) → done_externally (recorded by a person after doing it in the authoritative system) | rejected`. Support has no code path that changes billing, Cognito, Stripe or player-data.

**Four-eyes:** the person who created a request can never authorize it (`403 four_eyes_required`), whatever their role; `done_externally` still requires a prior authorization (`409 invalid_state`). With only one lead/admin, that person's own requests **stay `requested`** until a second lead or admin exists to authorize them. This is deliberate: there is no override.

## 7. Diagnostics framework

Each provider returns `{ id, status: ok|degraded|unavailable|not_connected|not_recorded, facts[], inferences[], playerSafe, staff, observedAt }`. A fact carries `{ label, value, source, at }`; an inference carries `{ label, value, basis, confidence }`. Providers run independently; one failing source degrades only its own panel (PR #24 pattern).

### 7.1 Providers
account (Cognito/profile: created, verified, identity bound) · **entitlement** (§7.2) · **identity sources** (§7.3) · VOD (usage counter, review archive — *no job/failure records exist in production: shown as "not recorded"*) · replay (*no replay upload system exists: "not available"*) · coaching (credits row, sessions, booking status) · onboarding/activation (PR #24 facts/lifecycle) · feature usage (activity beacons) · desktop client (*activation/version not recorded*) · incidents (open incidents for the matched service) · previous cases.

### 7.2 Entitlement operator view
Shows side by side: Stripe customer/subscription reference (from the Recon row), product/tier, **Stripe-reported state = "not checked"** unless a read-only Stripe port is configured (it is not; see PR #33 reconciliation tooling), Recon entitlement state (`resolveBilling`), identity binding (`cognito_sub` on row/profile), last reconciliation/check timestamp (row `state_fetched_at`/`applied_seq` once PR #33 is deployed; otherwise "not recorded"), and `mismatchSuspected` with the rule that raised it. Never repairs anything.

### 7.3 Connection health per source
Ubisoft / PSN / Xbox / TRN / replay / VOD / desktop: `linked`, `lastSuccessAt` (newest snapshot by source), `lastAttemptAt` and `errorClass` (*not recorded per player today* → shown honestly), `freshness` (player-data `computeFreshness` rules), `retryEligible`, `userActionRequired`, `reconActionRequired`. No platform credentials are stored or requested.

## 8. Support Copilot

Deterministic by default (rules + templates) with an optional model adapter behind `support.copilotModel` = off (a cost/risk/measurement/rollback case is required before enabling, per the frontier standard). Output per case:
`summary · playerContext · diagnostics · category (+confidence) · severity · likelyRootCause (inference) · recentChanges · relatedCases/incidents · suggestedSteps · draftReply · helpArticles · suggestedEscalation`, each item tagged `fact` or `inference`. Drafts pass the same copy guards as the site and never promise refunds, credits, SLAs or access changes. The copilot cannot call write routes.

Player Success intent is classified separately from category: `broken` ("something is broken"), `how_to` ("I don't understand how to use Recon"), `value` ("I'm not getting results"). `value` cases surface usage/completion/onboarding evidence and a coaching-escalation suggestion instead of a bug workflow.

## 9. Incidents

Separate entity: service (identity_ubisoft|identity_psn|identity_xbox|trn|vod_processing|auth|payment_access|desktop_client|other), status (investigating|identified|monitoring|resolved), severity, owner, affected count (if known), workaround, internal notes, customer-safe update (**draft only — never published automatically**), timeline. Cases link many-to-one.

## 10. Support email (design + pure ingestion; not wired)

Inbound path: the existing `ghost-igl-mail-forward` receipt rule (unchanged in this PR). `support/email.mjs`:
- canonical Message-ID (angle brackets stripped, lowercased domain) hashed to the `MID#` dedupe marker; provider message id stored separately;
- threading: `support+<caseToken>@` plus-address in Reply-To (token = HMAC of caseId, not guessable; secret `support.emailTokenSecret` from `SUPPORT_EMAIL_TOKEN_SECRET_ARN`, **unset = token lookups return nothing**), then `In-Reply-To`/`References` against stored outbound Message-IDs (`OUT#`, written only when a reply is actually emailed: **empty until outbound support email exists**);
- sender verification (SES verdicts, PR #24 `senderVerified(verdicts, parsed)`): **only a DMARC pass** verifies (SPF and DKIM alone are not aligned to the From domain); the address comes from the **raw** From header through an RFC 5322 mailbox parser, and RFC 2047 encoded words are decoded for the display name only; a From with more than one mailbox, group syntax, text after the address, or a second From header is unverified; when the verdicts carry `dmarcDomain`, the From domain must equal it. An unverified sender or an address that matches no account/case → `UNMATCHED#` review queue, **never auto-attached**;
- automated mail (`Auto-Submitted`, `Precedence: bulk|auto_reply|list`, `X-Autoreply`, DSN / `MAILER-DAEMON`) → classified, never a player message;
- attached email shares the player's daily message budget (§11); over it, the email goes to the review queue (`rate_limited`);
- HTML-only mail → text fallback (tags stripped, entities decoded once, tags stripped again, then anything still reading as `<tag`, `on<event>=` or `javascript:` neutralized); attachments → manifest only (names redacted, control/bidi characters removed);
- STOP-like text in a support reply is **not** an opt-out (opt-out only via preferences / List-Unsubscribe).

## 11. Security

Redaction before storage: matching runs on NFKC-normalized text with zero-width, bidi and control characters removed (the normalized text is what is stored). Card-like numbers (Luhn; separators space / tab / newline / `.` / `/` / no-break space / `-`, digit boundaries only, card-style grouping), Stripe secret / restricted / webhook keys (also when glued to other text), AWS access key ids and secrets (labelled, next to an access key id, or a bare 40-character base64 token with mixed case, a digit and `/` or `+`), JWTs, bearer tokens, and passwords (`password: X`, `my/the password is X`, `password X` when X looks like a secret, `login user@example / X`). Ordinary game text (ranks, scores, timestamps, versions) is not touched; tests pin both directions. Redacted fields: case text, answers, messages, notes, replies, reasons, summaries, CSAT comments, attachment names, KB decision notes, incident title / owner / workaround / internal notes / customer update draft (create **and** PATCH/PUT), email subject/body. `context.page` keeps the path only (query and fragment dropped).

Text input: bidi overrides and zero-width characters are stripped **before** length checks; text that is empty afterwards is rejected (400).

Role masking: every staff response (case, queue, incidents list/detail/writes, unmatched email, KB proposals) goes through the same `forRoles` masking, so roles without `billing.refs.full` see Stripe ids as their last 4 characters.

Attachments allowlisted by mime/size; stored privately; never inlined. All writes audited. Malformed percent-encoding in a path parameter is a 400.

Rate limits per player (5 cases/day, 30 messages/day; portal messages, reopen text and attached email share the message budget, and a new case's opening message counts): a rolling 24-hour check over stored items, plus an **atomic** cap: each accepted case/message claims slot N of the player's UTC-day allowance (`SUP#RATE#…`, conditional put), so concurrent requests can never exceed the limit.

Player timeline second lock: the API marks every player-visible event `visibility: 'public'`; the client renders an event only with that mark **and** an allowlisted kind.

## 12. Proactive Player Care

Rules run only on telemetry that exists today; each has a dedupe key and a dry-run mode; creates a flagged case (source `proactive`, status `new`), never contacts the player. A **dry run writes nothing** (no marker, no case, no audit item). The dedupe window must be the ISO week of the clock (`^\d{4}-W\d{2}$`, equal to the current week); a finding with any other window is skipped, so repeated runs in one week create one case. The case stores **player-safe copy** as its subject and description (per rule, with a generic fallback); the evidence (table and field names, lifecycle labels, billing statuses) lives only in the staff-only opening `system` event. The player projection never returns a proactive case's stored text unless it was written as player-safe copy:
- paid Recon row with status `past_due` or unbound identity;
- coaching purchase (booking paid) with no credits row;
- onboarding stalled (PR #24 lifecycle) for a paying member;
- VOD usage consumed with no review record in the archive (possible failed review);
- provider health globally failing (→ incident suggestion, not per-player cases).

## 13. Help Center

Reviewed articles live in the repo (`src/features/support/help/articles/*.md`, front-matter `status: draft|reviewed`, `reviewedBy`, `sources`). Only `reviewed` articles are served; drafts written here are marked `draft` for Aaron's review. Search is local natural-language ranking (field-weighted BM25 + synonyms + intent). Case trends produce **proposals** only.

## 14. Metrics / CSAT

Computed only from stored case events: open, aging buckets, first response, resolution time, reopen rate, volume per active member, categories, root causes, entitlement/provider/VOD/coaching issue counts, CSAT (rating distribution, response rate), repeat users, incident frequency. No backfilled or estimated history. CSAT: "Did we get this handled?" (👍/👎 or 1–5) + optional comment, asked once after resolution.

## 15. Frontend

- Player: `/support` (Get Help + My Support), `/support/cases/:caseNumber`, `/help`, `/help/:slug`; entries in the account dropdown, mobile drawer and footer Help column.
- Staff: Support area inside the PR #24 console: `/admin/crm/support` (queues), `/admin/crm/support/cases/:caseNumber` (case workspace with Player 360, diagnostics, copilot, notes, audit), `/admin/crm/support/incidents`, `/admin/crm/support/metrics`.
- Fixtures via the existing dev preview route for screenshots; no real player data.

## 16. Rollout / rollback

Nothing ships in this PR. `aws/customer-success-template.yaml` carries the switches, all OFF by default: `FeatureSupport`, `SupportAttachments`, `SupportProactive`, `SupportCopilotModel` (only `false` allowed), `SupportEmailTokenSecretArn` (empty), plus the three player-data table names (Query-only IAM). The support HTTP routes are intentionally not registered in API Gateway yet. The attachments bucket and the SES/mail-forward hookup are commented in the template as NOT provisioned.

Enabling later requires (Aaron-approved, in order): PR #24 deployed; the support routes registered in the template and `FeatureSupport=true`; attachments bucket (private, SSE, lifecycle), presign route and scan step before `SupportAttachments=true`; mail-forward hook for inbound support mail and the token secret; SES identity/DKIM for support@ replies (sendGate transactional switch). Rollback: turn the flag off — items stay in the retained table; no other table is written.
