# Customer testimonial collection — review before release

Status: local code only; no commit, push, CI or deployment for this audit diff. Proposed shareable URL: https://r6coaching.com/testimonial. It is not live-verified. Aaron sends it himself; no customer messages were sent. This revision supersedes the anonymous/photo-upload proposal.

## Customer flow and controls

The landing page is public. Existing-account sign-in is required to show/send the form; the link uses `/auth?mode=signin&redirect=%2Ftestimonial`. Successful auth returns by full page load, preventing session replay initialized on auth from carrying into the form. Paid status is not required. The server independently verifies the existing Cognito ID token against the configured pool/client and takes ownership only from its verified `sub`, never a submitted owner or IP address.

Text-only first release: selected first name/gamertag/initials, experience 20–500 characters, optional private outcome 300, rank 40, play time 20 and contact email 254. The form offers optional photo follow-up through Contact with the receipt; uploads and photo-consent payloads are rejected. There is no image decoding, object storage, attachment ACL or new dependency. Photos would require separate permission and a later reviewed workflow. This reduces customer friction to one sign-in and eliminates upload storage/decoder abuse costs.

Honest-experience confirmation is required; positive feedback is not. Quote permission is optional. Unchecked permission means private feedback that the server refuses to publish. Pending entries retain consent version/date and the verified account ID privately. The public projection excludes account ID, email, private outcome, consent and reviewer metadata. React escapes all text. No automatic publication or emails. Heycatch is excluded from the form; existing pageview-only Plausible remains.

The body limit is 8,192 bytes. A conditional per-account admission row permits one attempt per minute, claimed before parsing/size validation, so malformed and oversized authenticated attempts also count. A valid submission extends the interval to 15 minutes before storage. Same account across IPs shares the limit; unrelated users on one IP do not. Limiter keys hash the verified subject. No raw IP is saved. Invalid/missing tokens perform no DynamoDB operations. Existing Cognito verification may fetch/cache public signing keys; those are not credentials.

## Bounded storage access

Read-only AWS inspection: `ghost-igl-testimonials` has only the string `id` partition key and no secondary index. No new table/index/grant is required.

Public `GET /testimonials` uses a consistent `GetItem` for `__public_testimonials_v1__`, then at most 20 consistent keyed reads. It never scans or queries the private table. Before the registry exists it reads only the two IDs verified from the current public API on October 17: `2ac6e39f-ae37-47c0-a5fb-9b93a643a5fe` and `3f8d225c-d906-4ff8-91d0-1ff3f53ad90c`. Quote text is read from current records rather than copied; deletion is effective even if a stale ID remains in the registry. Recheck these IDs for drift before deployment.

Admin publication updates the small registry using Get/conditional Put with revision comparison and at most five attempts, preventing lost concurrent approvals. It retains the latest 20 publication IDs; re-publishing an already-listed ID is idempotent. The returned visible quotes remain featured-first/newest-first. A registry failure does not expose an unlisted quote; an approved or manual row can retry publication from review history. Conditional pending-state moderation prevents competing reviews. Permanent deletion removes the underlying row; a stale registry ID returns nothing. No application-data export or migration write has been performed.

Admin `GET /admin/testimonials` is one DynamoDB Scan page, Limit 20 evaluated records, with a cursor; no automatic all-page traversal. It excludes reserved registry/rate/demo rows. Empty filtered pages may have a Next page. Pending/private/rejected/manual entries remain reviewable/deletable. All admin operations require verified `admins` group. Reserved IDs cannot be deleted through the testimonial route. Exact-key demo-video GetItem prevents unrelated rows from hiding its singleton. Existing announcement behavior is unchanged.

## Exact deployment operations and permissions

1. Replace code in existing `ghost-igl-announcements-api` with index.mjs, testimonial-submissions.mjs and the existing production dependencies. No jpeg-js dependency remains. Preserve environment, role, memory 128 MB and timeout 30 seconds. Previously downloaded deployed index matched the branch's pre-change source after newline normalization. Observed CodeSha256 `D186HbE8u/3aNTUKaCMR98Zm6D8vtjywi/pmVp09MfM=`, LastModified August 30 00:41:35 UTC, Active; recheck revision before update.
2. Add POST `/testimonials` to existing HTTP API `u0k402df6j`, existing integration `gc2fh27`. API Gateway auth remains unchanged; the Lambda enforces verified user authentication. GET/OPTIONS and existing admin routes remain. Existing deployed role `ghost-igl-AnnouncementsFunctionRole-G01x2gs7aFTp` already allows GetItem/PutItem/Scan/DeleteItem on this exact table. Existing Lambda invoke permission covers the API `/*/*`. No new IAM permission, access grant, secret, account or credential is requested.
3. Publish built website assets and `/_shell/testimonial.html`, and the existing CloudFront router mapping. Apply the release mechanism's narrow cache invalidation. No payment Lambda, Stripe, Cognito configuration, coach or IFD changes.

No production mutations have occurred. Registry initialization happens only on a future authorized admin publication; public reads do not write. No extra persistent infrastructure is proposed.

## Cost bounds and remaining ordinary operations

Each public testimonial request performs 1 + at most 20 GetItem calls (currently 3 total before registry initialization), independent of private-table size. At most 20 text quotes are returned. Admin list is one page per click. A successful customer submission performs three conditional PutItem operations (admission, extended interval, pending row); a rate-limited request attempts one conditional write; malformed authenticated submissions do one admission write. Admin publication uses its existing row reads/writes plus at most five registry read/write attempts. These are billable operations, not a zero-cost guarantee.

Existing stage throttle remains 25 requests/second, burst 50; no throttle change is proposed. Authentication and per-account limits remove anonymous writes and decoder abuse; many genuine or newly registered accounts can still create usage within existing signup controls. Rate rows are reused per account, not per attempt. No automatic TTL or retention cleanup is claimed. Contact/reference-based deletion is available to admins. Costs remain API requests, existing Lambda duration, bounded DynamoDB operations/text storage and ordinary asset transfer/invalidation. GitHub $10 cap and Stop usage settings remain unchanged.

## Rollout, rollback and acceptance

Deploy safe keyed public reads before enabling POST/form. Preserve existing quotes by checking current IDs before deployment. Once private records exist, never restore the old handler that returns the entire testimonial table: rollback must disable intake/form while retaining the safe public projection and keyed reads.

44 focused tests pass, including auth contract tests, account ownership, malformed-attempt limits, cross-IP/same-IP behavior, consent, private-data exclusion, keyed reads/count bounds, concurrent registry updates, failed-publication retry, admin pagination/deletion and unchanged announcement/demo behavior. Test verifier and database are mocks; no claim of live Cognito/DB verification is made. Production build/lint and browser results are recorded in the release checkpoint.

After root reviews and authorizes deployment: open the shareable link signed out, sign in using an existing authorized account, verify return to the form, submit one clearly labeled synthetic private-feedback text (no quote permission), verify private persisted owner/consent and public absence, then reject/delete the fixture. Verify unauthenticated POST and non-admin moderation fail. Verify existing published quotes and the keyed public response. Do not publish a synthetic endorsement. Only then return a live-verified link to Aaron.
