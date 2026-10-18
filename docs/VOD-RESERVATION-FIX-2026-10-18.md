# VOD reservation failure: diagnosis and approval scope

## Confirmed failure

The single approved owner screenshot request at 2026-10-18T05:12:24.849Z failed with AccessDeniedException on dynamodb:GetItem for ghost-igl-profiles. Lambda request ID: 001e8cd9-94da-4d56-b794-4f95cea88fe5. Billed Lambda duration: 262 ms, configured memory 512 MB. The deployed hash remains 9VauEuIci2ueUitp+M7+lBIL2JMeFPj+e1eG3RBjv6k=.

Read-only inspection of the actual execution role confirms no profiles-table permission. It has subscription reads/updates, Bedrock invocation, review archive writes, trusted player-data invocation and basic logging. PROFILES_TABLE is unset, so the existing handler correctly uses its ghost-igl-profiles default. The missing grant is an infrastructure omission, not a malformed JPEG or exhausted daily limit.

The exception occurs at the first reservation read. No reservation update, Bedrock call, review archive write or player-data publish occurs on this handler branch. This request therefore incurred no model inference charge and did not consume its admin daily counter. Infrastructure requests/logging can still cost money; the UI's broad "Nothing was charged" is not proof of zero AWS spend. No review was retried.

## Local change

Isolated worktree recon-vod-reservation, branch codex/recon-vod-reservation-20261018, based on 1e8c4a8. Only aws/template.yaml and offline tests changed, plus this record. The template explicitly binds PROFILES_TABLE and grants the VOD role GetItem and UpdateItem on ProfilesTable.Arn. This supports existing owner reservations and prepaid-credit reads/conditional deductions. It adds no Scan, Query, PutItem, DeleteItem, index access, wildcard resource, new principal, or credential.

This is table-scoped permission, not field-scoped or restricted to one owner's key: the role could point-read/update other rows and attributes in that table. Existing authenticated runtime code chooses the caller's email and applies conditional counters/credit checks. This scope must be understood in the security approval. No runtime code or budget/entitlement/concurrency guard is changed.

Validation: 14 Node tests pass with network blocked (7 actual reservation/handler regressions, 4 coaching-contract, 3 rank-snapshot), plus 2 parsed-template Python tests. Covered first reservation, cap exhaustion, simultaneous final-slot requests, concurrent day rollover, IAM denial propagation, and actual handler denial before model/persistence. git diff --check passes. No new CI run or GitHub spend.

## Approval required before live repair

Exact production target: role ghost-igl-VodFunctionRole-EG7TUErea3ou; new inline policy VodProfileUsageReservation; actions dynamodb:GetItem and dynamodb:UpdateItem; resource arn:aws:dynamodb:us-east-1:183678667221:table/ghost-igl-profiles. No Lambda code upload is needed to fix this live failure. Proposed live operation is one additive policy attachment, preserving all existing policies. Verify its resulting document read-only; rollback removes only this new policy. Do not run a whole-stack deployment against stale infrastructure or invoke the model to test the grant. The local template change keeps the required permission represented for future reviewed infrastructure releases.

Policy attachment itself has no additional IAM service charge (https://aws.amazon.com/iam/faqs/). It enables future metered DynamoDB and model use, bounded by existing application safeguards, not a hard dollar cap. No recurring job, capacity provision or new infrastructure is proposed. Any future code/stack rollout needs its own reviewed change set. No production grant has been applied.

## Cost and repeat-test boundary

At the published first-tier x86 Lambda rate of $0.0000166667/GB-second plus $0.20/million requests (https://aws.amazon.com/lambda/pricing/), this failed 512-MB, 262-ms invocation is approximately $0.000002383 in Lambda compute/request cost before free tier, excluding API/logging. All three VOD invocations in the examined window total 343 billed ms: approximately $0.000003458 for Lambda only. They are not all necessarily the submitted analysis. These are estimates, not an invoice reconciliation.

The prior $1.25 allowance has no model inference spend attributable to this failed request; its exact remainder cannot be certified without the ancillary billed costs. Conservatively retain $0.01 for this failure/diagnostic overhead and treat no more than $1.24 as a planning remainder, not a verified balance. IAM repair needs explicit security approval; another screenshot submission separately needs renewed one-attempt authority even if the dollar allowance remains largely unused. Real model quality, persistence and Road to Champion acceptance remain pending.

Read-only evidence is in sibling recon-video-ui/reservation-diagnostic.json and reservation-role-policies.json; test output is reservation-tests.txt. Desktop/game session and IFD were untouched.
