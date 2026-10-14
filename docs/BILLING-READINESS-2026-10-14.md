# Recon billing readiness checkpoint — 2026-10-14

## Reconciled source

Isolated worktree: `C:/Users/aaron/Documents/Codex/2026-10-14/task/recon-billing`.
Branch: `codex/recon-billing-readiness-20261014`.
Production source: `a6134c5dce9389282643a29b07754ba025f2345c`.
PR33 source: `2a90579250fd8413b16fea5e4e2da5648d26554e`.

PR33 remains an open conflicting draft. This branch reconciles its ownership,
atomic fetch tickets, replay protection, duplicate checkout handling, invoice
payload compatibility, sandbox and regression tests against current production.
The conflict was the PR67 checkout receipt write. Both first-row creation and
conditional existing-row checkout updates now retain `stripe_checkout_session_id`
and `checkout_payment_status`. Subscription updates preserve that receipt.
Tests enforce DynamoDB conditional semantics, cover replacement checkout receipts,
and assert concurrent same-plan checkouts/replays keep the winning receipt.

The old PR33 all-repository CI job lacked dependencies for today's repository.
The existing release-ci remains responsible for broad validation. The additional
billing job runs only on PRs, on Node 24, with blocked outbound connections; no
redundant production push/full-suite job was carried over. No budget, Stop usage,
production payment configuration, IAM grants, or persistent credentials changed.

## Verified

- 100/100 focused tests pass locally: ownership, signed webhook receipt,
  add-on isolation, sandbox mode/event helpers, checkout, best membership,
  referral lookup/rewards, auth contract, checkout funnel, entitlement refresh.
- Network guard log absent: zero outbound attempts during these tests.
- `node --check lambda/webhook/index.mjs` and `git diff --check` pass.
- AWS read-only package comparison: deployed webhook `index.mjs`, subscription
  `index.mjs`, and `membership-checkout.mjs` match production source a6134c5
  after normalizing line endings. This independently verifies PR67 backend code,
  not the frontend or real paid journey.
- Deployed webhook CodeSha256: `hTUB1E7ZfWJlZuqhBYEHa6sxJ0TxlEDSsoCTER0x5QM=`;
  modified `2026-10-12T18:11:57.000+0000`, Active.
- Deployed subscription CodeSha256: `nUjx91jqGY5nhDRlCZf7XHgQn1lRxtRZRmjOp+uqU5c=`;
  modified `2026-10-12T18:11:28.000+0000`, Active.

## Unavoidable acceptance blockers

1. Stripe account discovery returns only Iron Front Digital LLC, livemode=true.
   No test-mode account is connected. No STRIPE runtime variable names are present
   in the local execution environment. No secret stores/files were searched for keys.
   Existing harnesses require a securely supplied test runtime credential; the
   live connector cannot substitute. No new key or access grant was created.
2. Minimum for the two existing Stripe API harnesses: restricted TEST access with
   Write Customers (includes balance transactions), Payment Methods, Products,
   Prices, Subscriptions, Invoices and Test Clocks; Read Events. The historical
   release record additionally requested Read Checkout Sessions, but these two
   harnesses synthesize checkout events and do not read Checkout Sessions.
   No live key or AWS access is needed for those two harnesses. Supply access via
   an approved masked local prompt/session, never chat or a repository file.
3. The existing webhook sandbox is NOT full paid-path acceptance: it creates real
   test subscriptions but synthesizes checkout completion, signs locally, and
   fakes DynamoDB/Cognito. Referral sandbox tests real test-mode balance credits
   and renewal consumption with in-memory application tables. Neither proves
   Stripe webhook delivery, real hosted Checkout, free-account signup, browser
   entitlement refresh, or sign-out/sign-in persistence.
4. Full end-to-end acceptance additionally needs a test-only application runtime
   and identity/data boundary wired to test Stripe prices, actual Checkout Session
   creation (test Checkout Sessions Write), and signed webhook delivery. An
   existing authorized isolated environment has not been identified/verified.
   Do not repoint production payment settings or use production paid tests.
   Before provisioning AWS resources/grants, report exact proposed resources,
   permissions and estimated cost to parent; no Recon spending allowance was inferred.
5. Normal Chrome/Edge inspection could not start: browser tool kernel exits with
   `MXC launcher: cannot locate required Windows platform directory: HRESULT 0x80070003`.
   No IAB fallback was used. Browser runtime repair/access is needed for the
   requested saved-session browser journey. No real or daughter account was used.

## Resume and release

Run from this worktree, with dummy AWS credentials/dead endpoint and the network
preload (`NODE_OPTIONS=--import=<absolute file URL of scripts/test-netguard.mjs>`):

```
node --test lambda/webhook/subscription-ownership.test.mjs lambda/webhook/coaching-addon.test.mjs lambda/webhook/checkout-receipt.test.mjs lambda/webhook/sandbox/sandbox-support.test.mjs lambda/subscription/membership-checkout.test.mjs lambda/subscription/pick-best-sub.test.mjs lambda/subscription/referral-lookup.test.mjs lambda/admin/referral-rewards.test.mjs src/lib/entitlementRefresh.test.mjs src/lib/checkoutFunnel.test.mjs src/hooks/useAuth.contract.test.mjs
```

After securely providing approved test access, run
`node lambda/webhook/sandbox/run-sandbox.mjs` and
`node lambda/admin/sandbox/referral-sandbox.mjs`, then the separate real browser
journey on the isolated application. Preserve evidence separately for each gate.

Do not merge/deploy this reconciliation until required acceptance passes. User
has already authorized deployment when ready; no generic reconfirmation is needed.
Recheck deployed hash for drift, preserve rollback package, build from committed
bytes with `scripts/build-lambda-zip.py`, and deploy only the reconciled webhook
using existing resources without changing environment variables or permissions.
No deployment or production payment mutation occurred in this task.
