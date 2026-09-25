# Evidence: Split Fire season surfaces (/countdown/ + SeasonCountdown badge)

Screenshots for the pull request on `claude/split-fire-season-surfaces`. This branch only holds evidence; it is not meant to be merged.

## How these were captured

- **Tool:** headless Microsoft Edge over the DevTools protocol.
- **Widths:**
  - desktop 1366 (1.5× crops)
  - phone 390 (2× device emulation)
  - small phone 360 (2× device emulation)
- **Blocked hosts:** production API, analytics and Stripe were mapped to 127.0.0.1, so nothing was sent.
- **`captured-text.json`:** the rendered text of every crop, plus a horizontal-overflow check. No crop overflowed.

### Before and after

- **`before-production/`:** r6coaching.com, captured September 25, 2026.
  - The static page is captured at `/countdown/index.html`. On production the canonical `/countdown/` URL currently serves the React app shell instead; see the PR notes.
  - `countdown-hero` shows "Current season: Y11S2 Operation System Override. Next up: Y11S3.", a 0 / 0 / 0 / 0 timer, and "The expected window has arrived — the new season should be launching any day now."
  - `countdown-content` shows "What's coming in Y11S3" with the pre-launch codename "Fireworks".
  - `strats-header` and `meta-header` show no season badge at all: it had hidden itself when September 1 passed.
- **`after/`:** this branch, served by the Vite dev server.
  - `countdown-hero`: "Operation Split Fire is live". Ubisoft has not announced the Y11S4 date, so there is no timer. The facts panel shows:
    - Live season: Y11S3 Operation Split Fire, live since September 1, 2026
    - Battle Pass: September 1 – December 1, 2026
    - Latest patch: Y11S3.1, September 22, 2026
    - Next season: Y11S4, date not announced
  - `countdown-content`: "What Operation Split Fire brought", summarized from Ubisoft's season page.
  - `strats-header`: pill "Y11S3 · Operation Split Fire live · Y11S4 date not announced". It wraps onto two lines at 390 and 360.
  - `meta-header`: banner "Y11S3 · Operation Split Fire — Live now — Y11S4 date not announced yet".
  - `desktop-countdown-hero-simulated-dec-2.png`: the same page with the clock set to December 2, 2026. The page switches itself to "Check Ubisoft for the current season" once Ubisoft's Split Fire Battle Pass window has ended, even without a rebuild.

## Merge-order note (`merge-order-note/`)

- **What it shows:** this branch *without* #27. The base beginner guide still has its pre-existing "UPCOMING · NOT LIVE … while Y11S2.2 remains live" section, and that section includes the season banner, which now says "Live now".
- **How #27 resolves it:** #27 (Y11S3.1 content hotfix) rewrites that section and removes the banner from it. With both merged, the beginner guide no longer uses the badge. Merge #27 first.

## Sources (checked September 25, 2026)

- [Operation Split Fire season page](https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/seasons/splitfire): Y11S3; Noor; Legend Division "opens mid-season"; Villa targeted map update.
- [Battle Pass page](https://www.ubisoft.com/en-us/game/rainbow-six/siege/shop/battlepass): "Operation Split Fire Battle Pass — from September 1 to December 1".
- [Y11S3.1 patch notes](https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/3WMly2DNZqv1GpUK9GNGm5/y11s31-patch-notes): dated September 22, 2026.
- [R6 news](https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates): no Y11S4 announcement. The newest posts are the Wasteland Circuit Twitch drop (9/23) and the Y11S3.1 patch notes (9/22).
