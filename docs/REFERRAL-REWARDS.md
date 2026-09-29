# Referral rewards

The published terms, from the referral widget and the `/r/<code>` landing page:
- **"Refer 3 friends. Get a free month."**
- A referral counts once the friend has stayed subscribed for 30+ days at the referrer's own tier.
- The referrer must be eligible: a founding referrer, an Elite/Champion All-Access member, or an admin.
- Every 3 counted referrals earn one free month. Each referral counts once.

The code is `lambda/admin/referral-rewards.mjs`, and it adds nothing to these terms.

## How it runs

- **Schedule.** EventBridge rule `recon6-referral-rewards-daily` invokes `ghost-igl-admin-api` once a day with `{"job":"referral-rewards","mode":"apply"}`. The job only runs on direct invocations; an HTTP request through API Gateway can't reach it.
- **Claim.** One DynamoDB transaction writes a ledger row in `ghost-igl-referral-rewards` (key `referrer_email` + `reward_seq`) and stamps `reward_id` on the 3 referral rows it uses. Every write is conditional, so a referral can never back two rewards.
- **Credit.** The job credits one month of the referrer's current subscription price to their Stripe customer balance, and Stripe takes it off the next invoice. The ledger moves `earned` → `applying` → `applied`, with the Stripe balance-transaction id recorded.
- **No double credit.**
  - The `applying` lock stops two runs applying the same reward at once.
  - Before posting, the job searches the customer's balance transactions for `metadata.recon_reward_id`.
  - The post carries an idempotency key.
  - If a run crashed after Stripe but before the ledger update, the next run finds the credit instead of adding another.
- **`manual_required`.** Nothing is sent to Stripe when the referrer has no paid monthly Stripe subscription (comped or admin accounts, or a non-monthly price). The reason is recorded on the ledger row and in the audit log. Credit these by hand, then set the row to `applied`.
- **Audit.** Every step is written to `ghost-igl-audit-log`: `referral.reward.earned`, `.applied` and `.manual_required`.
- **Throughput.** A run applies at most 10 rewards; the rest wait for the next day.

## Operator commands

Preview is a read-only reconciliation. It shows the new rewards the referral rows support and every ledger row that isn't `applied` yet:

```bash
aws lambda invoke --function-name ghost-igl-admin-api --region us-east-1 --cli-binary-format raw-in-base64-out --payload '{"job":"referral-rewards","mode":"preview"}' out.json
```

- **Limit to one referrer:** add `"referrer":"<email>"`.
- **Apply now,** instead of waiting for the schedule: use `"mode":"apply"`.

## History

- **2026-09-29.** Automation built. Reconciliation before it went live: 0 referral rows and 0 ledger rows, so no reward had been earned and nothing was owed.
