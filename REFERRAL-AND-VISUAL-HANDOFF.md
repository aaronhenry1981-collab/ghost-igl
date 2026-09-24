# Recon 6 repairs — September 24, 2026

Confirmed production failure: API Gateway u0k402df6j has no GET /me/referrals, POST /me/referral-attribution, or GET /referral/{code} routes, nor their OPTIONS routes. No catch-all route exists. The deployed subscription Lambda already implements all three handlers. The referral table exists; IAM simulation permits its query/read/write operations. The dashboard hides failed requests with return null, making this routing failure look like an empty program.

This branch adds the six routes to the SAM definition and adds a visible referral error/retry state. Six view-state tests pass. Vite compilation passes. Actual authenticated link retrieval and attribution still require verification after the production routes are connected.

Production route repair was blocked by automatic approval review. No production routes, permissions, code, or data were changed. Approval is needed to connect these six routes to the existing subscription integration and add only their scoped Lambda invoke permissions. No reward payments or subscription changes are part of that operation.

Training visual: replaces abstract circles with real Clubhouse frames at 520, 521, and 522 seconds from Aaron's March 23 gameplay recording and a muted three-second movement clip. These are explicitly presented as angle-progression review footage, not a perfect demonstration of all four drills. Full drill-specific reset/quick-peek demonstration footage remains to be selected. No AI-generated gameplay claims are made. Original media is untouched.

The live source checkout has unrelated uncommitted work. This isolated branch starts at 8054871; reconcile the production release baseline before deploying a whole frontend build. The frontend and SAM changes are not deployed.
