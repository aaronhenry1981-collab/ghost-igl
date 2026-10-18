# Still-image quality failure: local fix and next gate

## Evidence

The successful request ff1b0b55-f62c-41cb-bc3d-40ac816e5802 ran for 27,549 ms (27,550 billed ms, 512 MB) around 05:26 UTC. It returned House, score 62, invented post-plant events, and recurring habits from one Coastline/Penthouse custom-game frame.

Exact erroneous records identified read-only:
- Archive review_id: d5f7eed2-3d4d-45d8-8f1b-19485b1c2e14; created_at 2026-10-18T05:26:41.341Z.
- Road to Champion sessionId: vod-1792301200285-7fjjgru; ts 2026-10-18T05:26:40.285Z.
- Coaching table key: userId 84c8b438-e031-7025-dc38-a7aa94592231; sk vod-1792301200285-7fjjgru#2026-10-18T05:26:40.285Z.
- Read-only evidence: sibling recon-video-ui/quality-live-evidence.json and quality-record-and-usage.json. Both bounded scans completed and found one matching record.

No owner history was changed. Propose an explicit audited invalidation record referencing those exact keys, reason internal_test_grounding_failure, excluded_from_stats=true, retaining original raw analysis and original timestamps. Aggregation readers must honor this exclusion before it affects counts/scores; simply attaching a flag would not repair current statistics. The independently ingested player-data snapshot/projection also needs targeted reconciliation after its exact ID is resolved. Do not rewrite House into Coastline as though the original AI identified it correctly. Exclusion and reconciliation need separate approval and tested reader support.

## Root cause and changes

The schema demanded a numeric tactical score, multiple weaknesses, recurring patterns and a weekly plan. Prompt examples inferred previous peeks and unused off-screen utility, contradicting its evidence cautions. Output validation checked shape, not groundedness. The UI offered user context but it was optional; the live test supplied none. The client preferred AI map/site over supplied context when saving coaching evidence. Archive user_context was String(object), losing structured context.

Local candidate now:
- Requires null tactical scores for still reviews; no validated scoring rubric exists.
- Keeps map/site null without supplied context, and preserves supplied values with user_context provenance. Phase stays unknown for this still-review path.
- Requires separate observations and uncertainties and displays both.
- Requires empty single-frame pattern arrays and rejects the observed temporal/habit claims.
- Rejects grounding violations before archive/ingest/response, without an extra model repair for semantically invalid but well-shaped output. Invalid JSON can still use the existing one bounded repair; both paths pass grounding validation.
- Returns a clear 422 for grounding failure, without promising a refund.
- Prefers supplied map/site when building coaching events; stores context as JSON in future archives.
- Logs only provider model ID, input/output token counts, request ID and attempts for future cost correlation, never image/prompt/auth data.
- Packages grounding.mjs in the existing deploy script and includes regression tests. Spending reservations, entitlements, counters and IAM are unchanged.

These deterministic checks reject the observed failure class; they are not an independent visual fact checker. Novel hallucinations or paraphrases can still pass. The conservative map/phase rules intentionally sacrifice automatic detection. Live quality must pass separately.

## Verification

22 Node tests pass offline with network blocked, plus 2 parsed-infrastructure tests. Includes exact House/62/post-plant/habit regression, unknown context, supplied Coastline/Penthouse, missing evidence, actual callBedrock rejecting without repair, client context precedence, reservation concurrency and fail-closed behavior. Lambda syntax check, JSX parser and git diff --check pass. Full website build passed with network blocked, including product-truth, coaching terminology, public-content, patch-fact and personal-data audits. Generated source changes were restored after the build. Browser visual acceptance remains a release gate; no new CI or deployment occurred.

Live ZIP baseline matches source before this patch exactly. Locally prepared grounding-candidate.zip (3,675,734 bytes), SHA256 2169a1f60d7fbd1d8c653de897ea6a60248ebb9490d025c34de006724df4d7e8; only index.mjs and coach-contract.mjs changed, grounding.mjs added. Every other ZIP entry preserved. Original ZIP retained as grounding-rollback.zip; evidence grounding-package.json. The extracted package is smoke-tested offline using dummy Cognito identifiers; no real token is used.

## Cost evidence and bounded release proposal

CloudWatch Bedrock metrics in the 05:26 UTC minute report one Sonnet 4.5 invocation, 3,387 input and 1,191 output tokens; no matching Haiku metric datapoint was returned. At the previously reviewed regional rates $3.30/$16.50 per million tokens this is $0.0308286 estimated inference cost. Model/time aggregates are consistent with this test, but are not request-specific invoice proof. Lambda compute/request for its 27.550-second 512-MB execution is about $0.0002298, excluding API/DynamoDB/logs. The previous deployed handler did not log model usage, so no exact request-level token receipt can be recovered from its Lambda logs.

Original $1.25 less estimated inference leaves $1.2191714 before infrastructure; use at most $1.20 as conservative planning remainder, not a certified balance.

Proposed bundled next approval: code-only VOD Lambda update plus the reviewed result-display/context-precedence web changes, with no IAM/model/entitlement/payment changes; one same-JPEG website retest with supplied Coastline/Penthouse context, no manual retry, within the original remaining allowance. Candidate/live reconciliation, Lambda packaging and complete web build are done; inspect the final website upload delta and browser layout before publication. Allocate at most $0.01 of the planning remainder to deployment verification overhead. Revised exact prompt measurement with Coastline/Penthouse context: 10,351 UTF-8 bytes; schema 1,459 bytes. Conservative input reserve 11,351 tokens plus 8,192 image tokens; repair reserve 63,021 tokens; 2,400 output tokens per call. Primary plus optional repair reserve $0.186615; six full attempts each $1.11969, below the remaining $1.19 after deployment allocation. Measurement/calculation saved in grounding-budget.json. These are conservative reserves, not an enforced cap or actual tokenizer counts.

Pass criteria: no score or recurring habit claims; correct supplied context labeled as supplied; phase unknown; visible facts separated from uncertainty; no invented plant or off-screen utility; private persistence and Road to Champion agree; token usage receipt captured. On failure, stop and preserve evidence. No retry/deployment authority has been exercised for this candidate. Native game/desktop and IFD untouched.
