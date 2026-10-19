# Admin entitlement display review

Prepared against production release `5a05a465bb65a8b66e82ce13e4c31476ed6670a3` on `content/strat-beta-disclaimer`. The repository's remote default `main` is an older, divergent line and is not the release target.

## Result

A member with a Pro billing product and `past_due` membership now shows Basic (the product's Free tier) under Plan access, while Billing continues to show Pro and Payment issue. Next charge says **Check Stripe for payment recovery timing**, rather than **None scheduled**. No retry date is inferred from a billing-period end.

The admin API projects access from the subscription ledger before live Stripe enrichment. It follows the deployed subscription API's active/trialing and future-period-end requirement, best-valid-plan selection, legacy Elite mapping and admin-group exemption. An active membership canceled at period end retains access until that end. Valid complimentary grants retain access; expired grants do not. A separate valid grant does not conceal an outstanding Stripe billing issue.

Member-list badges, access filters and the record use effective access. CSV retains its historical `plan` column and adds `access_plan`, `access_source` and `access_period_end`.

## Verification and review

- Offline tests compare the admin projection directly with the existing subscription authorization functions and exercise the read-only admin response with strict SDK/Stripe stubs, including Stripe disagreement and outage, multiple memberships, expired comps and paginated admin lookup.
- Final checks: 72 tests passed, repository lint passed, and the full production build passed (including product truth, coaching terms, public content, patch facts and personal-data audits).
- Local fictional preview checked at 1440, 390 and 430 CSS pixels. Phone views have no horizontal overflow; payment recovery text wraps visibly. Screenshots and complete test/build logs are in the task's sibling `review/` directory.
- Truth conflict found in dev fixtures: Elite/Champion amounts were swapped. They now import the central Stripe display amounts. The fixture's complimentary status and access fields now match the API contract. These fixtures are development-only.
- This is a staff record, so the five customer funnel personas do not encounter it. The operator's task is to distinguish current access from billing recovery. No signup, checkout, public pricing, conversion claim or analytics event changes.

## Release scope and cost

Requires the **ghost-igl-admin-api Lambda** and the **static frontend** (existing S3/CloudFront hosting). Deploy the admin API first, including `member-access.mjs`, then the frontend. Refresh the admin member data after both. The frontend retains a status/date fallback for older responses, but the complete ledger/Stripe separation and admin exemptions require the new API fields.

No subscription or webhook Lambda deployment, database migration, membership rewrite, Stripe change, scheduled cleanup, identity deletion, credential change, new infrastructure or model invocation is needed. The deployed admin role already permits `cognito-idp:ListUsersInGroup`; verified read-only on 2026-10-19. All six deployed root runtime modules match the release base after newline normalization. Live admin code metadata still matches the downloaded package (`axf0FQ6lb8fQ56wGZKa01Klqqpp0NmcJvWrLaf9YQD0=`).

Expected model/API inference cost is **$0**. Runtime adds one paginated Cognito admin-group list per member-directory refresh (normally one request), using existing resources and quotas. Release uses ordinary existing CI/static hosting/Lambda deployment operations; no new recurring service charge is introduced. An exact hosting/CI bill is not estimated here.

Deployment and merge are intentionally pending Aaron's review. The 90-day inactivity deletion policy and all account-deletion changes remain outside this patch.
