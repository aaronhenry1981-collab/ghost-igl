# Handling privacy requests (access, export, deletion)

The Privacy page tells players to email **support@r6coaching.com** from their account email, with "Privacy request" in the subject. That is the only r6coaching.com address that receives mail; before 2026-09-28 the page named privacy@, which never received anything.

## 1. Verify the requester

- Act only on a request sent from the account's email address.
- If it came from another address, reply there and ask them to write from the account email.
- Never export or delete on the strength of a name, gamertag or payment detail alone.

## 2. Export (a copy of their data)

The tool lives in the repo at `lambda/customer-success/tools/privacy-request.mjs` and runs with your own AWS credentials. It only reads:

```powershell
cd C:\IronFront_Master\ghost-igl-production\lambda\customer-success
npm ci
node tools/privacy-request.mjs export player@example.com --out C:\IronFront_Master\recon6-recovery\privacy-requests
```

It collects:
- the Cognito account attributes;
- the profile;
- membership rows;
- the CRM log;
- referrals;
- Road to Champion;
- coaching events and bookings;
- the AI-review archive (matched by email hash);
- support and customer-success records;
- player-data.

The file is named by a hash of the email. Keep it outside the repository, send it only to the verified email, then delete your local copy.

Payment records live at Stripe (the payment processor). For those, point the player to Stripe's receipts, or export them from the Stripe Dashboard.

## 3. Deletion

```powershell
node tools/privacy-request.mjs preview-delete player@example.com
```

The preview lists what would be deleted, anonymised or blocked. It stays blocked while:
- **the player has a live membership:** cancel it in Stripe first;
- **the account is an admin.**

Booking slots stay on the schedule with the customer details removed; everything else that belongs to the player is deleted, Cognito account last. To apply exactly that preview:

```powershell
node tools/privacy-request.mjs apply-delete player@example.com --plan <planId> --confirm "DELETE ALL DATA FOR player@example.com"
```

- **A preview is single-use.** If anything changed since it was taken, the plan id no longer matches and nothing runs; take a new preview.
- **Audit.** The audit log records the request by email hash only.
- **Manual step:** delete the listed Stripe customer(s) in the Stripe Dashboard if the request covers payment data.

### Accounts already deleted in the admin console

The console's "Delete user" removes only the sign-in, the profile and the membership rows. Player data, Road to Champion and coaching history are keyed by the account's Cognito `sub`, so since 2026-09-29 the console records that `sub` in its audit entry (`user.delete`, `details.cognito_sub`), and the tool finds it automatically. For an older deletion with no recorded `sub`, pass it by hand if you have it (`--sub <id>`); without it, only the email-keyed data can be found.

List console deletions that still need the full purge:

```powershell
node tools/privacy-request.mjs pending
```

Run preview-delete / apply-delete for each one. A purge counts once a `privacy.delete` audit entry exists that is newer than the console deletion.

## 4. Reply

Confirm to the player what was exported or deleted. The Privacy page commits to deletion within 30 days of the request.

## Retention (as stated on the Privacy page)

- **Screenshots** are never stored. The VOD Lambda sends them for analysis in memory and keeps no copy.
- **AI-review archive** (`recon6-review-archive`): keeps the typed notes and the analysis under a hashed email, with no images. It is kept while the account is active and deleted with the rest of the account's data.
- **Deletion:** everything above is removed within 30 days of a deletion request or a console deletion. Check `pending` at least weekly.
- **Kept:** booking slots stay on the schedule with the customer removed, and payment records stay at Stripe.
