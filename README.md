# Evidence: Recon 6 acquisition attribution (phase 1)

Screenshots for the acquisition-attribution pull request. This branch only
holds evidence; it is not meant to be merged.

- **Fictional visits only.** Each scenario is a fresh headless browser
  profile visiting the local dev build with made-up campaign links.
- **No production system was contacted.** The production API, Plausible and
  Stripe hostnames were mapped to 127.0.0.1; `window.plausible` was replaced
  by a recorder, so the Plausible call below was captured, not sent.
- The panel is the development-only attribution inspector (`?attr_debug=1`),
  which is absent from production builds.
- Captured with Microsoft Edge (headless) over the DevTools protocol:
  desktop 1366px, phone 390px. No horizontal overflow on any page.

| # | Scenario | What it shows |
|---|---|---|
| 01 | First visit via `?utm_source=chatgpt.com` to `/strats` | "ChatGPT-tagged visit (utm_source=chatgpt.com)", raw value kept, landing page recorded |
| 02 | Same browser returns via a TikTok link (`site_files` / `sf012`) | First touch still ChatGPT; last touch TikTok; events that sign-in would record |
| 03 | Browser the older tracker had tagged `chatgptcom` | Kept as the historical first touch, read as ChatGPT, `recon:src` untouched |
| 04 | Creator code `?ref=SplitAim`, then friend link `/r/AB12CD` | Creator and friend-referral touches in history |

`captured-values.json` holds the stored state after scenarios 02 and 04 and
the recorded Plausible call for a checkout click in scenario 02:

```json
["Pricing CTA Click", {"props": {"source": "chatgpt", "channel": "ai_search", "last_source": "tiktok", "landing": "/strats", "tier": "elite", "location": "pricing-card"}}]
```
