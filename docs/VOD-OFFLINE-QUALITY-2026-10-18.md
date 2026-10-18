# Offline VOD quality investigation — October 18, 2026

Status: tested local correction only. No push, CI run, deployment, inference, history change, counter change, credential creation or native-game change in this investigation.

## Findings

The approved 1280×720 JPEG (81,908 bytes, SHA256 `9bf57a8d9fe6a36f1c0e85fd199ddbad000953efb76d3733a566c3360ef778bc`) shows the doorway, HUD 100 health, 26/125 ammunition, 8:52 timer, objective B / 2 m, DEFUSE/DROP prompts and an instructional caption. Those facts do not establish planting, movement, off-screen utility, recurring habits or outcomes. The expected-response fixture is hand-authored, not a retained live model response.

Upload trace: SessionUploadZone sends the files array and selected map/site IDs; removal filters both files and previews by index. useVodAnalysis forwards both. vodApi encodes with Promise.all in input order and whitelists supplied context. The Lambda places each image and its index into the model content and appends supplied context. Structural validation requires response count and indexes to match input. Grounding validation runs before archive/private publication; the client only synchronizes coaching evidence on a successful response. Saved coaching evidence prioritizes supplied context and preserves null score.

`coastline` and `theater-penthouse` compare equal to `Coastline` and `Theater / Penthouse` in the deployed validator. Different site names, reordered aliases, inferred labels and absent-context labels remain rejected. There is no evidence of a dropped hint or wrong image in the tested path. The prior live response was not retained, so its exact mismatched labels and triggering phrase remain unknown.

The deployed PR77 validator reproducibly rejects both these synthetic valid phrases:

- “Post-plant status cannot be determined from this frame.”
- Advice: “If reviewing a post-plant round, compare the visible doorway angles.”

The first falls outside its narrow uncertainty allowlist; the second is scanned as an observed post-plant claim. This establishes validator false positives, but does not establish that either exact phrase occurred in the live failure.

## Local correction

- Add anchored uncertainty formulations and a bounded hypothetical-plus-imperative exception only in advice fields. Continue scanning the imperative for unsupported assertions; no wholesale exemption for uncertainty/advice fields.
- Reject additional explicit unsupported movement, prior-action and repeated-behavior formulations, plus empty observation/uncertainty strings.
- Mark contextual catalog information as reference material rather than evidence of this player's actions/location. Make the diagnosis instruction require visible evidence, with supplied context used for conditional advice.
- Preserve map/site matching, null score, unknown phase, empty single-frame patterns, reservation/concurrency rules and reject-before-persistence behavior.

This is a conservative lexical validator, not complete semantic verification. Other valid paraphrases may still reject; unsupported prose without a recognized phrase may still evade it. A fixture pass is not proof of model visual accuracy. Do not describe this as production acceptance.

## Verification

41 focused Node tests pass with the network-denial preload. This includes grounding, realistic approved-frame fixtures, owner reservation/concurrency, coach contract, rank snapshot, request deadline and coaching evidence tests. ESLint on changed source/tests and git diff --check pass. No frontend implementation changed, so no frontend rebuild was run.

`still-pipeline.test.mjs` runs the real frontend encoding/request function, real Lambda handler, real prompt construction, actual structural/grounding validators and real coaching-event construction, with model/auth/storage/network boundaries mocked. With RECON_APPROVED_FRAME set, it verifies the exact approved JPEG hash and checks identical base64 reaches the model-input boundary. A hand-authored grounded result archives/publishes/syncs once with null score and original hints; an unsupported temporal claim returns 422 with zero such writes and no repair call. This does not call Bedrock.

Local evidence outside the repository, under `../recon-video-ui/`:

- `offline-quality-tests.txt`: 41/41 test results.
- `offline-grounding-comparison.json`: old deployed validator versus local correction on synthetic fixtures.
- `owner-vod-limit.json`: minimal read-only counter/config evidence.

## Owner limit and remaining acceptance

At `2026-10-18T06:16:10Z`, an exact owner Cognito-sub lookup and strongly consistent profile GetItem showed stored day `2026-10-18`, count **3**, effective daily limit **3**, remaining **0**. No configured override exists; source default is 3. No email, keys or tokens were emitted. The Lambda code SHA remained `Iyu/0TDf0xzvWT7bTkZeC83lVhI7W8MrJGYhuzn61fU=` (PR77).

The source derives the day from UTC and lazily initializes count=1 on the first accepted reservation of a new day. Next eligibility boundary is **2026-10-19 00:00:00 UTC**; there is no scheduled write/reset. Existing Retry-After=3600 does not mean allowance returns after one hour. The read before conditional reservation is eventually consistent, which can cause a conservative conflict under concurrency; the conditional write still prevents exceeding the cap. Neither behavior was changed.

Live quality and latency acceptance remain unverified. The prior local deadline commit `1f5b376` bounds inference and disables SDK retries; it provides a structured failure before the gateway deadline but does not make inference faster. Both it and this correction are undeployed. A later separately authorized release and bounded test after allowance renewal are required to prove useful accurate output arrives before the gateway deadline and saves correctly. No additional credentials were required for this investigation, and no infrastructure/security/spending change is proposed here.
