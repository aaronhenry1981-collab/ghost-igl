# Claude Code Command — Claims honesty sweep (RECON6, 2026-07-17)

Two unsupported/inaccurate claims are live on the homepage (external review caught them). Same discipline as the pricing fixes: say only what's true and provable. **Rides the supervised migration push — no standalone deploy.**

**Rules:** `ghost-igl`; lint 0; never `sam deploy`; one agent on repo; never paste secrets.

---

## 1. Footer FPS inaccuracy
`src/components/Footer.jsx:33` — the tagline "Climb faster in every FPS you play" is inaccurate: several supported games (League, Dota, EA FC, Tekken) are not FPS.

Change to:
> Play smarter. Win more rounds. Earn your R6 rank.

(Keep the existing second line "R6 live today. Your rank, earned by you." if it still reads well after the swap.)

## 2. Unsupported rank-results claim
`src/pages/LandingPage.jsx:794` — "Recon 6 has helped players break through every rank ceiling in Siege" reads as a documented results claim. With ~2 paying customers and no rank-climb case studies, it isn't supportable.

Change to:
> Built to help players at every rank find what's holding them back.

(If real, documented rank-climb case studies exist later, a results claim can return — with the evidence next to it.)

## 3. Post-deploy verification — "first session is free" is gone from ALL surfaces
The `LandingPage.jsx:499` hero fix ("First session is 50% off — $20") is in source but not yet live. When the migration deploys, verify the false "free" claim appears on **no** surface — not just the hero:
- Rendered hero + pricing + coaching page copy
- Page `<title>` / meta description
- OpenGraph tags + generated OG images
- JSON-LD / structured data
- The built `dist/` output (grep it before syncing) and, after deploy, the live HTML
Command to prove it: `grep -rniE "first session.{0,6}free|session is free" dist` returns nothing before the S3 sync.

## Verify
- Footer + rank line show the corrected copy.
- No "first session free" anywhere in the built output or live surfaces.
- Lint 0; rides the migration push; no standalone deploy; login still works.

## Definition of done
Both inaccurate claims corrected, and a clean post-build grep proving "first session free" is dead across hero, meta, structured data, and cache. Ships inside the migration deploy.
