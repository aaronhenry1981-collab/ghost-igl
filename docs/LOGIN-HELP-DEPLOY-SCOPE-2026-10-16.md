# Login-help deployment scope — October 16, 2026

## Exact proposed changes

Release only the current-session coach handoff and explicit login-help workflow, plus the support-route correction. Exclude the separate Siege content commits when preparing the production release branch.

- Replace code for existing `recon-customer-success-CustomerSuccessFunction-8kCym8sIbxS7` with the reviewed customer-success package. Current source plus dependencies measures 11,644,557 bytes before ZIP compression.
- Preserve every existing Lambda environment value; add `LOGIN_HELP_EMAIL_ENABLED=true` and `LOGIN_HELP_EMAIL_FROM=Recon 6 Support <support@r6coaching.com>`. Activation does not send by itself. No scheduled or batch sender is introduced. Template defaults remain false for subsequent managed stack deployment.
- Use existing `GET`/`POST /cs/admin/support/login-help/{key}` under API `uz6jlkc7aa`'s existing `/cs/admin/support/{proxy+}` integration. Live Lambda resource policy already permits that API's `* /cs/admin/support/*` invocation. No new route, invocation permission, IAM statement, credential, domain, table or stack is required. The existing SES role statement and verified domain suffice. Both handlers still require application admin authentication.
- Publish frontend through the canonical production checkout and deploy guards to S3 `r6coaching.com-site`, followed by one `/*` invalidation on CloudFront `E2WUR8DDHCOYC9`. No IFD resource is touched. Do not deploy the whole unreleased Siege worktree merely to get these two features.
- Retain prior Lambda ZIP/config and website release for rollback. Disable login-help first if needed; preserve durable receipt records during rollback. No customer email is part of deployment or smoke testing.

## Bounded cost plan

Observed full local build: 732 files / 11,274,637 bytes; deploy script recopies 25 guide SVGs. Use a conservative ceiling of 900 S3 writes including artifacts, under 30 MiB new storage, one invalidation path, and at most ten read-only/no-send smoke requests. Recount the canonical production build before deployment; stop if it exceeds those bounds.

Proposed allocation: **$0.03 maximum estimated incremental release cost**, including request/storage allowance and contingency; this is an estimate/control bound, not a measured invoice. No free tier is assumed. No model calls, SES sends, new running infrastructure or customer acceptance traffic is included. This fits the reported $0.119 contingency without drawing on the $1.007 protected reserve. Do not double-allocate against concurrent IFD work; parent owns the shared ledger. No allocation was consumed by a deployment in this turn.

AWS's pricing pages are the pricing reference, not a claim of account-specific discounts: https://aws.amazon.com/s3/pricing/ ; https://aws.amazon.com/cloudfront/pricing/ ; https://aws.amazon.com/api-gateway/pricing/ . CloudFront documents that one wildcard counts as one invalidation path: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PayingForInvalidation.html . Recheck bounds before executing. Observed usage/billing remains separate from this estimate.

## Precise blocker

Required screenshots at 390 px, 430 px and desktop have not been captured. The available tool catalog currently exposes neither `node_repl` nor `cua_repl` nor a normal-browser automation tool; the computer-use skill requires its provided JavaScript session. Its referenced local `docs/guidance.md` also cannot be read at the installed path. Previous attempts failed before UI attachment. No IAB, CDP, alternate browser profile or shell screenshot substitute has been used.

Permitted completion route: restore the bundled computer-use runtime in this child or perform the visual review in another authorized session using Aaron's normal Chrome/Edge. Use the existing fictional customer-success dev fixtures, including disabled/preview/accepted/unknown states; never press a real customer Send for a screenshot. Aaron's standing merge/deploy authority remains valid within budget. This is a missing verification capability, not a request for generic GO or new IAM access.

After visual evidence, prepare the scoped production-line release, inspect rollback artifacts and final code/environment diff, coordinate the $0.03 ledger allocation, and execute within the stated bounds. Actual email delivery acceptance still needs explicit intended recipient/send authority. Hosted Stripe acceptance is separately outstanding.
