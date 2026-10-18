# PR77 test: gateway timeout plus later grounding rejection

## Confirmed request path

- API u0k402df6j, POST /vod/analyze, route qrnyvwu, integration oqmmfgf, timeout 30,000 ms.
- API access-log request FbQ7ehiXoAMEbhQ=: status 503, integrationLatency 30,000 ms. This explains the browser's Service Unavailable.
- Lambda request c60bbdda-4212-46a9-a950-1284b9141613 began 06:06:26.552 UTC and ran 34,141.72 ms (34,142 billed ms). Lambda timeout is 60 seconds: it did not time out.
- Sonnet returned at 06:07:00.677 UTC after one attempt. Provider request 9496d815-5c44-4cc7-80fc-7b7568d8d8f9, 4,248 input / 1,350 output tokens. No provider availability exception is evidenced.
- At 06:07:00.679 the handler rejected session map mismatch, per-image map/site mismatch and a temporal/repeated-behavior match. Its intended 422 arrived after the gateway had already returned 503.
- There were no missing-observation/uncertainty, score or phase validation errors this time. The previous schema correction addressed that part, but did not establish useful feedback quality.

The deployed source performs an awaited conditional admin reservation before calling Bedrock. Since this request reached Bedrock, that reservation succeeded; no refund path exists afterward. It did not reach the archive/private publisher after grounding rejection. Browser history remained 138. No counter, history or credential was read or changed by this investigation.

Raw model output is not logged or saved on rejection. We cannot distinguish a truly wrong map from another unrecognized label variant, nor inspect the exact temporal claim. Do not loosen grounding based on speculation. The last known deployed code SHA remains Iyu/0TDf0xzvWT7bTkZeC83lVhI7W8MrJGYhuzn61fU=. The observed configuration RevisionId differs from the prior deployment receipt; no change was made by this investigation and the cause of revision movement was not established.

Evidence: sibling recon-video-ui/unavailable-lambda-evidence.json, vod-route-timeout.json, vod-route-failure-logs.json. Browser screenshots are in the delegated browser worker's review directory.

## Local covered fix

Add a shared 24-second request deadline, measured from handler entry, for primary and optional repair model calls. Abort the transport and return structured 504 review_timeout before the verified 30-second gateway limit. Both calls consume the same time budget; an expired budget prevents starting repair. Set Bedrock SDK maxAttempts=1 to avoid automatic retry latency and cost. Preserve reservation, entitlement, daily/lifetime/concurrency guards, model identities, token caps and no-refund behavior.

Aborting an HTTP transport does not prove the provider stopped generation or waived billing. The error explicitly says the allowance may have been used and forbids automatic resubmission. The 6-second headroom is not a guarantee against an unrelated slow authentication/database operation. This fix improves failure delivery; it does not make a 34-second review finish sooner or solve the still-unresolved grounding rejection. Async review jobs could support longer inference, but would be a separate architecture/scope decision, not silently introduced here.

30 offline Node tests pass, including actual-handler structured timeout with no persistence, transport cancellation, no retries, shared primary/repair deadline and existing grounding/reservation regressions. Lint, syntax and diff checks pass. Deployment packaging includes request-deadline.mjs and tests. No new PR/CI, deploy, paid inference, IAM/API timeout change, history change or desktop interaction occurred.

## Cost and remaining blockers

This call's token-based estimate is $0.0362934 at previously reviewed regional rates ($3.30/$16.50 per million input/output). Lambda execution adds about $0.0002847 before other requests/logging. Three model-test estimates total $0.0950829. Dollar amounts are not an invoice reconciliation. After prior conservative remainder and deployment allowances, retain no more than $1.09 as a planning remainder of the original $1.25, not a verified account balance.

Three model-reaching owner tests have now been observed today; each required reservation, and the configured default owner limit is three daily reviews. Treat another same-day test as unavailable unless independently established otherwise; never reset or bypass the daily cap. No new test is authorized.

Next step: review the local timeout fix separately from feedback quality. A future release would need normal CI/package/live verification. Further paid experimentation should wait for an approved plan that resolves evidence visibility and quality without weakening validation, and respects the daily limit and remaining dollar allowance. No request for additional money is implied.
