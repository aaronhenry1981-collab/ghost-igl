# Grounding retest rejection and local remediation

## Confirmed result

Request eb2d65ed-0071-4148-831a-02a8a0e0ec8a reached Sonnet once and failed grounding at 2026-10-18T05:50:15.569Z. Logged errors:
1. Session map did not match supplied context.
2. Per-image map/site did not match supplied context.
3. Observations missing, empty or wrong type.
4. Uncertainties missing, empty or wrong type.
5. Temporal/repeated-behavior keyword match.

There was no numeric-score or round-phase error in this response. The private counter reservation occurred before inference; no refund or reset is proposed. Browser reported history unchanged at 138. Actual handler tests confirm grounding rejection occurs before archive/private ingest; browser client does not publish failed API responses as coaching events.

Raw model output was not logged. Consequently we cannot establish whether its map was House again or merely capitalized Coastline, or whether the keyword match was an actual claim or an uncertainty sentence. Do not present a reconstructed fixture as the actual response. Evidence: sibling recon-video-ui/grounding-rejection-evidence.json.

## Defects found

The prior patch was incomplete: the system instructions required observations/uncertainties and null score, but RESPONSE_SCHEMA still omitted those arrays and asked for an integer tactical score. The patch's text substitutions did not match those schema lines; the original tests constructed compliant fixtures without checking the actual model-facing schema. This is our implementation defect, not evidence that the owner supplied an unusable screenshot.

The validator also compared user IDs and display names byte-for-byte (coastline versus Coastline; theater-penthouse versus Theater / Penthouse). Its broad keyword scan included explicit uncertainty statements. These are independently reproduced false-positive paths, not proven explanations for every live rejection.

The image remains limited: a static custom-game frame with instructional overlays cannot establish movement, previous plants, repeated habits or ranked outcomes. That limitation is retained.

## Local fix

- Explicitly corrected the actual RESPONSE_SCHEMA: score null, round_phase unknown, required visible observations and uncertainties, no minimum advice quota.
- Removed conflicting user-message wording that invited replacing supplied context based on visual guesses.
- Compare map/site labels case-insensitively with punctuation/spacing normalization only. Coastline can match coastline; House still cannot. No fuzzy map replacement or rewriting a wrong prediction into the supplied answer.
- Permit narrowly defined complete uncertainty sentences such as "Cannot determine whether this is a post-plant situation". Positive plant claims and assertions smuggled into uncertainty fields remain rejected. This remains a conservative heuristic, not a general language fact checker.
- Correct upload help text: omitted map/site remains unknown, not auto-detected.
- On rejection, provide a clearly labeled general self-check and state the result was not saved and allowance may have been used. This is not personalized successful analysis.
- Added regression tests against the actual model-facing schema plus case/format differences, explicit uncertainty, and contradictory positive claims. Original House/62/post-plant/habit rejection and fail-closed tests remain.

Repair strategy unchanged: no additional paid model call for semantic grounding failures. A text-only repair cannot verify missing visual observations, so using it to manufacture evidence would be inappropriate. Existing malformed-JSON repair remains bounded and must still pass grounding.

## Cost and next approval scope

The new receipt logs provider request 418ac0a0-0196-4a55-8c29-78439d11180e, attempts=1, 4,253 input and 844 output tokens. At previously verified regional planning rates $3.30/$16.50 per million, estimated model cost is $0.0279609. Lambda billed duration 20,410 ms at 512 MB adds approximately $0.0001703 before API/logging. These token counts are request-correlated; dollar amounts are estimates, not invoice confirmation.

Combined two model-test estimates: $0.0587895. Retain a conservative $1.15 planning remainder within the original $1.25, accounting for the earlier deployment allowance and unverified ancillary charges. No new budget or spending authority is assumed.

Proposed bundle, requiring renewed approval: reviewed code-only VOD update and upload-help text release, then ONE same-frame browser retest with Coastline / Theater-Penthouse context. No new IAM/resources/history changes. Reuse existing safeguards; no quota reset or purchase. Allocate at most $0.01 for deployment verification, subject to a fresh upload count. Revised prompt reserve: 10,154 system bytes, 1,526 schema bytes, $0.1860474 primary-plus-repair reserve, $1.1162844 for six full attempts each. Total proposed reserve $1.1262844 fits the conservative $1.15 remainder but is not a hard service cap. If the final plan exceeds it, stop.

All code work remains local, with no new inference or deployment. Customer quality is still blocked pending a real accepted, useful response and consistent saved evidence. Do not change the erroneous older House review without separate approval.

## Verification and deliverables

27 Node tests and 2 infrastructure tests pass offline; targeted lint, Lambda syntax and diff checks pass. Full website build passes with network blocked, including content/privacy audits. Generated output restored after build. Local candidate grounding-remediation-candidate.zip is 3,676,249 bytes, SHA256 232bbfd130dfd31cef593edb4e465e0bcde556123b5bc32b246621bb39fad5f5. Compared with the last deployed ZIP, only index.mjs and grounding.mjs differ; all dependencies and other assets preserved. Final extracted package OPTIONS smoke passes offline with dummy Cognito identifiers and networking blocked. No PR/CI cycle or production write was started for this remediation.
