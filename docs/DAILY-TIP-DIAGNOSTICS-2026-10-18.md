# Daily-tip sanitized diagnostics — local only

The failed October 18 delivery remains `needs-review`; this patch neither retries it nor reveals its historical cause.

Changes: failure stage, safe category, UTC timestamp, POST-started flag, optional integer HTTP status and Discord error code are saved with the existing uncertain ledger update. The handler emits the same sanitized object to the existing log group, including when the diagnostic ledger write fails. Raw response/error text, stacks, URLs, headers and credentials are excluded. Response bodies retain the 64 KiB bound and 8-second timeout. A started POST means fetch was attempted, not confirmed accepted or transmitted.

The atomic daily claim, no retry policy, destination checks, successful receipt, nonce, finite pilot dates, and HTTP signature routing remain intact. No new AWS/Discord call is added to normal execution. No schedule, permission, credential or existing receipt is modified.

Offline tests cover channel mismatch; POST 403/code 50013; network errors before and after POST start; timeout; invalid receipt; receipt-storage failure; diagnostic-storage failure; invalid/non-numeric codes and non-JSON responses; untrusted error metadata; successful delivery; and repeated calls after every failed outcome.

## Deployment review needs

Not deployed or pushed. Review/merge through the normal repository CI, build the Discord package from the approved merged source (preserving any newer interaction changes), compare against current production metadata, retain rollback version 3, update code and publish a new immutable version, then point only the existing daily-tip alias at that version. Preserve current environment, exact destination, pilot dates, schedule, roles, retry policy, and ledger. Do not invoke the alias as deployment smoke: verify metadata without invocation and inspect the next scheduled delivery. Do not reset October 18's claim.

No infrastructure or permission expansion is needed. Incremental runtime work is one bounded log record on a failed scheduled run and a few hundred bytes in its existing ledger update, with no extra invocation or request. For the remaining 30 daily runs, even all failures add less than roughly 30 KiB of diagnostic logs plus small ledger growth; expected incremental operating cost is below one cent. This is a planning estimate, not a verified bill or spending authorization. Packaging/storage/API verification costs need inclusion in the deployer's existing allowance; no additional spend is authorized here.
