# Private browser coach website release

This local candidate connects the website to the existing approved pilot. It changes only the browser interface, the pinned browser meeting SDK dependency and the CloudFront route entry. It contains no new Lambda, billing, invoice, account-entitlement, IAM or webhook changes. It does not deploy or modify the pilot backend.

The intended route is `/live-coaching`. `/live` remains the existing manual round guide. Build with `VITE_LIVE_COACH_API_BASE_URL=https://gc3tzbeeoi.execute-api.us-east-1.amazonaws.com/prod`; the client rejects a missing or different endpoint. The existing admin account gets **Tools > Browser Live Coach** during the original window. Menu visibility is discovery only; the server enforces the exact approved account and finite grant.

The unchanged pilot admits only its approved account, with five selected frames, 1,800 sharing seconds and a $0.25 lifetime usage cap. It expires at **2026-10-21T03:01:21Z**. The client stops local preview and speech at that deadline. No account subject or credential is embedded in this source or browser build. Audit data remains retained by the already-configured backend.

Capture, sharing, AI frame analysis and local spoken feedback each require the user's own explicit actions. Microphone and source audio remain off. Do not start them as part of deployment verification. Actual gameplay feedback and spoken-coaching performance still require acceptance testing.

Publish only after the exact payload has passed review and required checks, through the existing canonical production release workflow. Deploy the built frontend, generated noindex route shell and CloudFront route map together. A local build does not prove publication. After release, verify the real URL, approved signed-in account, unapproved-account denial and safe default controls before Aaron chooses and confirms his gameplay source.

The earlier broad candidate's backend, paid-credit issuer, invoice compatibility changes, webhook IAM policy and private commit history are excluded from this website release. The existing backend and its cleanup schedule retain their original limits and deadline.
