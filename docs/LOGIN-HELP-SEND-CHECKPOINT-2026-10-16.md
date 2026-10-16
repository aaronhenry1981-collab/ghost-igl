# Login-help send checkpoint — October 16, 2026

Local implementation only. No customer email has been sent; no deployment or environment update performed.

## Behavior

For `account_setup_incomplete`, the CRM now offers Review login-help email, then an explicit Send button with the exact recipient, subject and body visible. The server refreshes directory, Cognito, billing and do-not-contact state at send time and rejects stale previews. It requires FORCE_CHANGE_PASSWORD and paid access. It does not reset passwords, change entitlements, mark the issue resolved, delete drafts or overwrite decision history.

A conditional DynamoDB receipt prevents concurrent/repeated sends for the same account creation and template. SES automatic retries are disabled. Receipts retain actor, content, timestamp, status history and provider message ID. `accepted` means SES accepted the request, not inbox delivery. Known rejection is `failed`; uncertain transport outcomes are `unknown`. Uncertain/failed records are not automatically retried. A function crash after reserving a receipt can leave `sending`; inspect provider evidence before any manual reconciliation. Delivery/bounce ingestion and automatic resend are not implemented. Receipt storage remains durable after account resolution, although this preview endpoint then rejects further sends and the queue item may disappear.

## Validation

- Customer-success suite: 324 tests passed, including five new tests for authorization/disabled transport, simultaneous sends, changed preview and uncertain outcome, account resolution, and provider rejection.
- Website lint and full production build passed, including product-truth, patch-fact and privacy checks.
- Coach sign-in handoff has two separate focused tests for current-user-only session entries and invalid sessions.
- Browser screenshots and live email acceptance have not been completed. Existing computer-use executor fails before attaching to the normal browser.

## Inspected AWS facts

The existing customer-success Lambda has the support sender configured as `Recon 6 Support <support@r6coaching.com>`. Its role already permits `ses:SendEmail` for the r6coaching.com identity. The identity is verified. SES account read on October 16 returned SendingEnabled=true, ProductionAccessEnabled=true and EnforcementStatus=HEALTHY. No IAM grant is needed for this proposed transport. The login-help enable/sender variables are absent from the live function.

## Remaining release steps

1. Review CRM and coach-connect screenshots at 390 px, 430 px and desktop per GROWTH-UX-OPERATING-STANDARD section 12; normal Chrome/Edge automation is currently unavailable.
2. Review and deploy the scoped customer-success code plus frontend through the canonical release process. The template adds a default-false LoginHelpEmailEnabled parameter, using the existing support sender and permission. Activation requires that flag and sender environment variable; no new infrastructure is proposed.
3. Obtain explicit authorization for one named recipient acceptance test before sending. No batch send is authorized. Check saved receipt and recipient delivery independently, then verify that the original login issue remains open until account state actually changes.

No new CI run, AWS deployment, SES send or inference spend was initiated. Shared release budget remains $0.874 accounted/reserved of $2, with $1.126 remaining; actual billing is not asserted. Preserve GitHub's $10 cap and Stop usage setting. Hosted Stripe free-to-paid/sign-out/sign-in and referral acceptance remain separate unverified runtime gates; backend and synthetic sandbox success do not establish them.
