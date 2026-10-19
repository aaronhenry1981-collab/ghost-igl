# Recon browser-audit follow-up

PR78 merged as ef8d122ccc54ea4a33d927a8b6389c98ff3c2e38 and deployed at 14:28 UTC. VOD code SHA256 is yG8wg9wyLo5KHi90rEq6HIiAkk+DYwTADkQTpjjLPwo=. Active/Successful, configuration digest and reservation IAM policy unchanged; OPTIONS 200 and anonymous POST 401. No inference, counter or history changes. CI release-ci 39135946152, billing 39135946140 and coaching 39135946168 all succeeded. The rollback ZIP is retained outside the repository in recon-video-ui/quality-release-rollback.zip. Deployment evidence is quality-release-deployment.json and quality-release-live-verification.json in that directory.

The follow-up website patch addresses the browser audit:

- Pricing routes admin/comp access with no real Stripe customer to Account instead of sending a synthetic customer ID to the portal. Actual cus_ customer records retain portal navigation, including administrators. No checkout or payment backend change.
- Download no longer marks unverified capture, overlays, recording, clips, hotkeys or console coaching as fully supported/Now. Installer access remains available. The staged native candidate is not advertised as an installed update.
- Desktop setup explains Windows, explicit source selection, manual context, PS5/capture-card HDMI/USB wiring, preview verification, separate Windows speech and capture audio, and support for build-specific uncertainty. Guidance is grounded in recon-desktop-next/README.md and its capture-session implementation; no native file/process changed.
- The browser Live Coach identifies itself as a manually configured planner and links to desktop setup.
- Homepage copy describes selected-image evidence limits and distinguishes accepted/synced feedback from rejected/timed-out attempts. It no longer promises every review is saved or that a still establishes causal/recurring mistakes.

Focused tests cover synthetic/absent versus genuine Stripe customer IDs and rendered platform/source/audio guidance and navigation. The normal release workflow additionally runs lint, production tests, frontend build and content audits. Deployment is not established by this source document; use the separate release receipt for live verification.

Open acceptance gates: useful accurate AI output within the API deadline; genuine Stripe test checkout/signed webhook/entitlement/sign-in and referral-credit acceptance in an isolated application; platform-specific native gameplay, recognition, audio and Stop/mute testing owned by the other session. Historical billing access details are in BILLING-READINESS-2026-10-14.md and must be rechecked before any paid-path attempt. Browser audit establishes an owner-only synthetic-customer error, not an ordinary paying-customer checkout failure. Existing review history is preserved. No daily allowance bypass or additional inference is authorized by this patch.
