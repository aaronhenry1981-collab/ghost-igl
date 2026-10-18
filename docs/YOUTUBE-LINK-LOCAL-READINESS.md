# YouTube replay submissions — local release candidate

Base: production commit 907bf41d57b0d37936c6dfefaea9dbbf42581cd2. Isolated branch codex/recon-youtube-local-20261018. At local-candidate validation, no push, PR, paid CI, live submission or deployment had been performed. Subsequent release results belong in the deployment evidence. Authorized read-only AWS preflight downloaded and hash-verified the current Lambda rollback archive and confirmed existing route coverage.

## Behavior

Eligible signed-in players on /vod see “Send a YouTube replay” alongside the unchanged screenshot workflow, when existing Support UI is enabled. Submit one public/unlisted Siege video using “Submit for manual review.” A successful server response shows the persisted Support case number and a link to its existing player case page. Existing Support staff can open it through their queue. Video availability/privacy is not remotely verified.

This is **manual-review intake**, not video analysis: no YouTube fetch, embed, download, model call, transcript extraction, automatic review or guaranteed turnaround. Screenshot analysis and quotas are unchanged. A link receipt never appears in screenshot-analysis results.

Server accepts HTTPS youtube.com/www.youtube.com/m.youtube.com watch/shorts/live/embed links and youtu.be video links; exactly11 URL-safe video-ID characters. Rejects playlists/channels, deceptive hosts, credentials, non-HTTPS, unsupported ports, malformed IDs and extra request fields. Canonicalizes before persistence, discarding tracking parameters/timestamps/fragments. No arbitrary URL is fetched (no SSRF path).

POST /cs/me/support/youtube-vods uses verified existing customer-success identity and effective entitlement facts, including active comps; free/expired accounts are denied and missing billing data fails closed. Admin behavior follows existing VOD access. Existing Support case storage supplies rate limits, audit, per-customer isolation and conditional idempotency. Equivalent links reuse the same per-player video request key. In-flight duplicate attempts can return409; ambiguous failures instruct the player to check existing cases before retrying. Durable persistence uses the existing production store adapter; local tests use its in-memory implementation, not a live DynamoDB acceptance claim.

The existing support staff-notification behavior, if already enabled in production, is inherited. No notification flags, addresses, permissions or credentials are added or enabled. Staff capacity/availability for manual review must be confirmed before advertising turnaround.

## Validation

- 58 tests passed with TCP/UDP networking blocked: YouTube validation, exact route persistence/replay/ownership/staff retrieval, active/expired Elite comps, simultaneous retries, daily limits, existing Support/security and screenshot coaching-contract regressions.
- Full customer-success suite: 336/336 passed with TCP/UDP blocked, using existing deployed dependencies restored locally from the verified rollback ZIP; no installation or dependency change.
- Candidate Lambda ZIP differs from the verified deployed ZIP in exactly three source entries (support route and two new helpers), with no removals or dependency changes. No upload performed.
- Frontend ESLint passed for changed UI and VOD page; backend files checked by ESLint invocation too.
- Full local build passed including product truth, coaching terms, public content, patch facts and personal-data checks. 740 files /11,453,807 bytes; this is a local build, not the production-environment payload.
- Build-generated tracked files restored; only feature files/docs remain changed. No dependency/lockfile changes.
- No live browser/UI or live backend acceptance claimed. No account comp mutation attempted.

## Production prerequisites and bounded estimate

Owner subsequently explicitly approved the separate $0.10 AWS allowance and CI within the existing $10 GitHub cap (parent-relayed message Sentinel_653baaff1e288191afa5f3b455f65a57). Cap/Stop usage must be verified before CI; this child has neither a billing-capable GitHub tool nor normal-browser control. Do not treat the earlier conditional zero-spend approval as the operative scope. Prior PR70/PR72 rollback and daily-tip reserves remain separate.

Proposed separate AWS allowance: **$0.10**, covering one frontend + customer-success code rollout, bounded verification and one safe rollback. Based on the locally retained October17 pricing assumptions (not a fresh billing query): prior frontend rollout/rollback envelope approximately$0.040812; reserve$0.02 for backend packaging/rollback storage, <=40 API/Lambda calls at512MiB/30seconds, <=10,000 DDB write units and<=5,000 read units, <=5MiB logs and existing notification traffic; remainder contingency. Actual cost is not established and this is not a hard AWS account cap. Confirm rates/configuration at release; stop/recalculate if runtime memory/duration or quantities exceed these assumptions.

Bounds: <=900 forward frontend writes,<=900 rollback writes,<=1,000 backup GETs,<=40 lists,<=50MB additional artifact storage for30days, two wildcard invalidation paths,<=2,000 HTTPS requests,<=50MB transfer. Existing same-day frontend build suggests765 maximum writes including25 SVG metadata recopies; canonical build/dry run must remeasure. Maximum20 explicitly authorized intake smoke submissions included in the backend invocation/DDB envelope; prefer one synthetic owner-controlled test with receipt verification. Retain its audit record; deletion is not implied. Routine future customer traffic, staff labor, taxes, longer retention and unbounded abuse are excluded and need ongoing operating allocation.

GitHub CI is separate: retained $10 cap/Stop usage must remain unchanged. No remaining included minutes or marginal cost has been verified; parent must authorize the bounded CI run under that existing cap or establish included usage before triggering it. No cost-free claim.

Before release: inspect current production source/artifact drift and current customer-success FEATURE_SUPPORT, persistent-store configuration and existing route coverage without printing secrets. Source template already defines ANY /cs/me/support/{proxy+}; no new table/API/IAM is proposed. If deployed route/store/flags are missing or permissions need expanding, stop and return exact scope; do not provision/enable unrelated Support features. Verify existing support engines remain deterministic/no paid model invocation on case creation. Frontend must use canonical production checkout/environment and guarded deploy.ps1; package customer-success with its existing release workflow and all required modules. Do not change the screenshot VOD Lambda.

Release sequence: preserve frontend and customer-success rollback artifacts; deploy backend first; confirm unauthenticated/malformed requests fail and a permitted test request persists once and is staff-readable; deploy frontend; verify live bundle matches; perform normal-browser link submission/receipt with an approved identity and no video analysis. Rollback frontend/backend code only, retaining cases/audit records and avoiding broad stack changes.

## Exact acceptance scope for this release

This change does not modify checkout, Stripe webhook handling, referral credits, billing ownership or entitlement refresh. The historical isolated Stripe paid-path acceptance gap is separate and is not a prerequisite to this manual-review intake release. Do not restart expired Stripe forwarding or create a payment to test this feature.

Before pushing/triggering CI, await parent-provided current evidence that the existing GitHub $10 cap and Stop usage are enabled. The separate $0.10 AWS rollout allowance is already approved; no additional generic approval is required within its bounds.

Live acceptance uses an existing authorized signed-in account with effective Pro/Elite/Champion access or an active qualifying comp. Read current access first; do not retry an uncertain comp mutation. The server permits existing administrators as well, so an administrator submission alone proves persistence and staff access but does not prove non-admin entitlement gating. Local tests cover free denial, active comp acceptance and expired comp denial. If only an administrator is available, record that live entitlement limitation explicitly instead of claiming ordinary paid-role acceptance.

After code/CI and guarded deployment, use normal Chrome/Edge to verify /vod copy, submit one clearly identified safe test video link with permission to share, open its receipt from My Support, and verify staff can read the same canonical link. Retry the same link once to verify the same receipt rather than a second case. Retain the audit record. No video fetch or paid analysis is involved. Verify anonymous requests remain denied and screenshot review behavior is unchanged. Do not count a code hash or HTTP shell check as browser acceptance.

## Current release authorization evidence

Parent relayed a signed-in normal Chrome inspection by browser child 01a14c57-a3c6-7451-b85c-2d4f7915b018: repository owner Actions monthly budget $10, Stop usage checked, spend $6.17; no settings changed. This clears the CI hold for the approved scoped release without increasing the cap. Parent also verified signed-in owner /vod rendering and the requested account's active Elite comp through 2026-11-17 without another grant. No account credentials are copied into this document. Historical hold text above records prerequisites that are now satisfied for release; live new-feature acceptance still follows deployment.
