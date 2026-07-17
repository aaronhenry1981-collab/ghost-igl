# Claude Code Command — Fix R6 Rank Divisions (domain accuracy)

The `/coaching` rank selector (and the `/climb` tiers) show broad ranks only — "Silver," "Gold." **Real R6 ranks have 5 divisions each.** A coaching site that doesn't show divisions reads as "built by people who don't play ranked" — credibility poison for this exact product. This has been built wrong twice; fix it once, from a single source of truth.

Repo: `ghost-igl`. Rules: lint 0; `.\deploy.ps1`; never `sam deploy`; don't touch Cognito; all AWS.

## The correct ladder — Ranked 3.0 (live 2026-06-02), current as of July 2026
**40 ranks. Every tier V→I, where V is lowest and I is highest.** Champion got divisions in Ranked 3.0 — include them.

```
Copper V, Copper IV, Copper III, Copper II, Copper I,
Bronze V, Bronze IV, Bronze III, Bronze II, Bronze I,
Silver V, Silver IV, Silver III, Silver II, Silver I,
Gold V, Gold IV, Gold III, Gold II, Gold I,
Platinum V, Platinum IV, Platinum III, Platinum II, Platinum I,
Emerald V, Emerald IV, Emerald III, Emerald II, Emerald I,
Diamond V, Diamond IV, Diamond III, Diamond II, Diamond I,
Champion V, Champion IV, Champion III, Champion II, Champion I
```
(Order matters: Emerald sits between Platinum and Diamond.)

## Build
1. **Single source of truth:** add a `src/data/ranks.js` exporting the ordered 40-rank list above (each entry: `{ tier: 'Silver', div: 4, label: 'Silver IV', order: 13 }` or similar). Everything rank-related imports this — so it can never drift again.
2. **`/coaching` selectors:** Current rank + Goal rank dropdowns populate from `ranks.js` — all 40 options, in order. Keep the "recommended package" logic working off the `order` gap between current and goal (bigger gap → bigger package).
3. **Validation:** goal rank must be higher than current (compare `order`). If not, nudge: "pick a goal above your current rank."
4. **`/climb`:** the Copper→Champion pipeline's tier labels/gates should reference the same divisions where it shows ranks, so it matches (no "Silver to Gold" without divisions anywhere).
5. Grep the whole `src/` tree for any hardcoded rank list (`['Copper','Bronze',...]`) or "Silver to Gold" style copy and replace with `ranks.js`. Leave nothing that lists ranks without divisions.

## Verify
- `/coaching` current + goal dropdowns each list all 40 ranks, Copper V → Champion I, in correct order.
- Selecting e.g. Silver IV → Gold II recommends a sensible package; selecting a goal below current is blocked.
- No page anywhere shows a rank without its division.
- Lint 0, `.\deploy.ps1`, no `sam deploy`, Cognito untouched, existing login works.

## Why this matters
Domain accuracy is the whole credibility of a coaching brand. A player who sees "Silver → Gold" with no divisions bounces before booking. Getting the ladder exactly right (including Champion's new divisions) signals you actually play — which is the entire pitch.
