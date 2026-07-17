# Claude Code — Master Build Order (RECON6, 2026-07-12)

Execute these in order. Each has its own detailed command file in this folder — open and follow it. Cross-cutting rules apply to all.

## Cross-cutting rules (every task)
- **Never `sam deploy`** — template drift wipes the live Stripe webhook `whsec_`. Lambda changes are per-function zips + `aws lambda update-function-configuration`.
- **Never touch the Cognito User Pool** (`us-east-1_rvLy8WLQB`). Everything additive. Before calling any task done, verify an existing user can still log in.
- `.\deploy.ps1` for the site (build + S3 sync + CloudFront invalidate). Lint 0. Never paste secrets.
- One agent on `ghost-igl` at a time (it's OneDrive-synced; concurrent agents corrupt files).
- Commit after each task so they're isolated and rebaseable.

---

## ORDER

### 1. Plausible analytics fix  — SMALL, SAFE, DO FIRST
The `track()` calls are dark: `src/utils/analytics.js` expects `window.plausible`, but the Plausible script isn't in `index.html`, so all CTA/traffic tracking silently no-ops.
- Add the Plausible script tag to `index.html` for domain `r6coaching.com`.
- Verify `track()` fires (Plausible realtime shows the event on a CTA click).
- `.\deploy.ps1`.
*Unlocks the traffic/referrer + CTA-funnel dashboard.*

### 1b. R6 rank divisions fix  — SMALL, HIGH-CREDIBILITY, DO EARLY  — see `CLAUDE-CODE-COMMAND-rank-divisions-fix.md`
The `/coaching` rank selector and `/climb` show broad ranks (Silver, Gold) with no divisions. Real R6 is 40 ranks, every tier V→I incl. Champion (Ranked 3.0). Build a single `src/data/ranks.js` source of truth and wire both surfaces to it. Domain accuracy = coaching credibility; this has been built wrong twice.

### 2. Booking calendar + coaching attribution  — see `CLAUDE-CODE-COMMAND-booking-calendar.md`
You've already shipped Step 0/1/3 backend. Finish it:
- Step 2: FullCalendar Appointments admin tab (drag-to-paint availability, booking drawer, color-coded events, mobile). Move `AvailabilityEditor` out of "Growth" into its own **Appointments** tab.
- Step 4: `.ics` as a real email attachment + webcal feed + 24h/1h reminders fire once.
- **Attribution (NEW, was added after Step 3 shipped):** capture `referral_source` (`getRefSource()` from `src/lib/refSource.js`) onto every booking; show the source in the Appointments admin. Step 3 may have shipped without this — add it.
- Step 5: full end-to-end verify incl. the browser click-through.

### 3. Paid coaching wiring  — see `CLAUDE-CODE-COMMAND-paid-coaching.md`  (CANONICAL — supersedes any other coaching-pricing spec)
Model: **$20 intro one-time (first-timers only)** + **$70/mo add-on granting 2 session credits/mo (no rollover, no trial)** + **"Academy" = Champion + add-on = $99** (marketing label, not a separate SKU). Two Stripe prices (intro one-time, add-on recurring); add-on feeds `coaching_credits`; strip all "free session" and any $40/$140 copy so words match checkout.

### 4. SEO routing migration  — see `CLAUDE-CODE-COMMAND-seo-routing-fix.md`  — ⚠️ DO LAST, SUPERVISED
HashRouter (`#/`) → real URLs + CloudFront SPA fallback + prerender content pages + real sitemap. **This is the highest-risk change: it rewrites every URL, the CloudFront config, and the auth flow on the live site.**
- Do NOT run this fire-and-forget. Build it, test **every** public route by direct-URL visit + view-source, test auth + Stripe return + billing portal, confirm old `#/` links redirect — THEN `.\deploy.ps1`.
- If anything is uncertain, stop and surface it rather than deploying a half-migrated site.
- After deploy: resubmit the sitemap in Search Console, URL-inspect a few pages.

---

## Separate / not in this batch
- **`igl-coach-ps5` sidecar exporter** (`CLAUDE-CODE-sidecar-export.md`) — different repo, and Aaron isn't using the desktop coach right now. Dormant; don't build unless he asks.

## Definition of done for the batch
Analytics live; Appointments calendar + attribution working; coaching takes real payment; site on real crawlable URLs and re-indexing. Existing subscribers unaffected, existing user can log in, no `sam deploy` ran. Report what deployed and what (if anything) you held for Aaron's eyes.
