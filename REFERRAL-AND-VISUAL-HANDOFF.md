# Recon 6 repairs — September 24, 2026

Confirmed production failure: API Gateway u0k402df6j has no GET /me/referrals, POST /me/referral-attribution, or GET /referral/{code} routes, nor their OPTIONS routes. No catch-all route exists. The deployed subscription Lambda already implements all three handlers. The referral table exists; IAM simulation permits its query/read/write operations. The dashboard hides failed requests with return null, making this routing failure look like an empty program.

This branch adds the six routes to the SAM definition and adds a visible referral error/retry state. Six view-state tests pass. Vite compilation passes. Actual authenticated link retrieval and attribution still require verification after the production routes are connected.

After Aaron explicitly approved connecting the routes, all six were connected to the existing production subscription integration, with route-scoped Lambda invoke permissions. Authenticated dashboard retrieval now displays the referral link and the Copy link button works. Unauthenticated account retrieval and attribution return 401; preflight returns 200.

A second defect was discovered: DynamoDB Scan applied Limit: 1 before filtering referral codes. Both lookup callers now use a tested paginated helper. The production package was patched narrowly from a verified backup; unrelated local changes were not deployed. Public lookup of the owner's displayed referral code returns HTTP 200 with valid: true. Four pagination/error tests pass. A real referred-user signup and reward qualification have NOT been verified, and no reward payments or subscription changes were made.

Training visual: replaces abstract circles with real Clubhouse frames at 520, 521, and 522 seconds from Aaron's March 23 gameplay recording and a muted three-second movement clip. These are explicitly presented as angle-progression review footage, not a perfect demonstration of all four drills. Full drill-specific reset/quick-peek demonstration footage remains to be selected. No AI-generated gameplay claims are made. Original media is untouched.

The live source checkout has unrelated uncommitted work. This isolated branch starts at 8054871; reconcile the production release baseline before deploying a whole frontend build. The frontend is not deployed. The SAM definition records the six routes already connected directly in production; reconcile infrastructure state on the next managed deployment.
