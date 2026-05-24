# Ghost IGL — Project Brief for Claude

You're working on **Ghost IGL** (r6coaching.com), an AI-powered in-game leader / coaching SaaS for Rainbow Six Siege. This file auto-loads every session — use it to skip the "explain the project" tax.

---

## Stack

- **Frontend:** React 18 + Vite + React Router (HashRouter — `#/route` style URLs). Source in `src/`. Built artifacts go to `dist/`.
- **Auth:** AWS Cognito (`amazon-cognito-identity-js`). User pool `us-east-1_rvLy8WLQB`, client `5bpa1cteenctoue24v4e245re8`. Admins are members of the `admins` Cognito group.
- **API:** AWS API Gateway HTTP API at `https://u0k402df6j.execute-api.us-east-1.amazonaws.com/prod` → Lambda functions in `lambda/`.
- **Lambdas:** `subscription` (user lookup + profile + Stripe billing portal + `/desktop/verify`), `webhook` (Stripe events), `admin` (admin dashboard + Stripe backfill), `vod` (Bedrock VOD analysis), `announcements`, `discord`.
- **Data:** DynamoDB. Subscriptions table `ghost-igl-subscriptions` (PK `stripe_customer_id`, GSI `email-index`). Profiles table `ghost-igl-profiles` (PK `email`).
- **Stripe:** account shared with Iron Front Digital. Live mode. Price IDs and payment links in the **Pricing** section below.
- **Hosting:** S3 bucket `r6coaching.com-site` behind CloudFront `E2WUR8DDHCOYC9`. Route 53 hosted zone `Z029335322YATCIIJXX6`.
- **Region:** all infra in `us-east-1`.

## Desktop app (separate repo)

Lives at `C:\IronFront_Master\igl-coach-ps5\` — Electron + React + Tesseract OCR + TTS for live coaching from PC capture or console capture-card feed. Verifies licenses via the `/desktop/verify` endpoint on this site's API. **Launches May 8, 2026.** Pre-order framing is live in the site's pricing/download pages.

---

## Pricing — founding-rate launch

Two-tier price strategy. Founding rates are sold pre-May 8; regular rates flip on after. **Existing subscribers stay locked at their founding rate forever** — that's the marketing promise; honor it.

| Tier | Founding (now) | Regular (post-May 8) | Stripe price ID (founding) | Stripe price ID (regular) |
|---|---|---|---|---|
| **Pro** | $9/mo | $12/mo | `price_1TPtOKJNddvjgWcg47I16AQp` | `price_1TLEtrJNddvjgWcg9iTWJoLS` |
| **Champion** | $29/mo | $39/mo | `price_1TLEtsJNddvjgWcgYcmiNmW7` (same as prior single-tier) | `price_1TPtOYJNddvjgWcgfEWjzGnp` |

**Payment links currently on the site:**
- Pro: `https://buy.stripe.com/cNi7sM2oGdvSaZ97K27ss0f` ($9 founding)
- Champion: `https://buy.stripe.com/3cIfZibZgezWd7h9Sa7ss0d` ($29 founding)

**On May 8 launch:** swap the `link` field in `PRICING` (LandingPage.jsx) for both tiers to the regular-price payment links. Founding subscribers stay locked.

The webhook Lambda's `getPlanFromPrice()` knows about all four price IDs — incoming Stripe events for any of them route to the correct plan label.

## Tier feature gates

- **Recruit (free):** ranked-pool maps, basic strats, operator catalog, Discord access.
- **Pro:** everything in Recruit + full utility/callout breakdowns, ban recommendations, enemy intel, squad coaching, AI VOD review.
- **Champion:** everything in Pro + **all maps unlocked** (legacy/non-ranked maps gated by `championOnly: true` in `src/data/maps.js`) + **premium tactics** (per-site `premiumTactics` block in `src/data/strats.js` — spawn-kill spots, attack spawn locations, advanced setups, runouts, anti-spawn-peek) + IGL Command desktop app + live capture coaching + team sync.

Gating components: `ProGate` (Pro+), `ChampionGate` (Champion only) — both in `src/components/strats/`. Use them, don't roll new gating.

---

## Content schemas

### `src/data/maps.js`

```js
{
  id: 'bank',
  name: 'Bank',
  rankedPool: true,         // currently in competitive rotation
  comingSoon: false,        // true = card disabled, no strats yet
  championOnly: false,      // true = Champion subs only (legacy maps)
  sites: [{ id: 'ceo', name: 'CEO Office / Executive Lounge', floor: '2F' }, ...],
}
```

### `src/data/strats.js`

```js
{
  bank: {
    ceo: {
      attack: {
        operators: [{ name, role, priority: 'essential' | 'recommended' | 'flex' }, ...],
        strategy: '...',
        callouts: ['CEO', 'Janitor', ...],
        utility: ['Thermite: 2 charges on CEO wall', ...],
        // OPTIONAL — Champion-gated:
        premiumTactics: {
          attackSpawns: [{ spawn, from, use }, ...],
          spawnKillSpots: [{ from, target, risk, reward }, ...],
          advancedSetups: ['...', '...'],
        },
      },
      defense: {
        // same shape; defense premiumTactics also supports:
        premiumTactics: {
          runouts: [{ from, target, timing }, ...],
          antiSpawnPeek: ['...', '...'],
          advancedSetups: ['...', '...'],
        },
      },
    },
  },
}
```

All `premiumTactics` sub-fields are optional — partial content renders cleanly behind `ChampionGate`.

---

## Voice / tone for customer-facing output

- **Direct, no fluff.** Aaron's customers are R6 players who hate corporate speak.
- **Honest about what we ship.** Don't over-promise; don't say "coming soon" on something that has a real date — use the date.
- **Use R6 vocabulary correctly.** Operator, site, callout, utility, drone, intel, frag, anchor, roam, spawn-peek, runout, hard breach, soft breach, ADS (jager gadget, not aim-down-sights).
- **No emojis in subscription/billing messages.** Casual emojis OK in marketing/Discord copy.
- **Founding-rate urgency.** When relevant, mention "founding rate ends May 8" and "locked in for life."

## Common commands

```powershell
# Build + deploy site to prod (S3 + CloudFront invalidate)
.\deploy.ps1

# Production build only
npm run build

# Dev server
npm run dev   # http://localhost:5173

# Deploy a Lambda (subscription / webhook / admin)
cd lambda/<name>
npm install --omit=dev
Compress-Archive -Path index.mjs,package.json,node_modules -DestinationPath function.zip -Force
aws lambda update-function-code --function-name ghost-igl-<name>-api --zip-file fileb://function.zip --region us-east-1

# Full SAM stack deploy (only when template.yaml changes)
cd aws && sam build && sam deploy

# Pull live env vars on a Lambda (redact before pasting into chat)
aws lambda get-function-configuration --function-name ghost-igl-stripe-webhook --region us-east-1 --query 'Environment.Variables'
```

## Secrets handling

Never paste raw `sk_live_…`, `rk_live_…`, `whsec_…`, AWS access keys, or DB strings into chat. When a command's output contains them, redact before pasting back. If they leak, rotate immediately — don't continue as if nothing happened.

---

## Current launch state (as of 2026-04-28)

**Done:**
- Stripe webhook fixed (clover API version, multi-price handling)
- Subscription Lambda profile-save bug fixed and deployed
- Admin Lambda backfill fixed for founding prices, deployed
- Founding pricing wired in code (LandingPage, ProGate, ChampionGate, DownloadPage, webhook Lambda)
- Cognito password-reset flow added (`AuthPage` `forgot` + `reset` modes)
- Champion content gating mechanism wired (`championOnly` flag, `premiumTactics` schema, `ChampionGate` component)
- AdminPage Rules-of-Hooks crash fixed
- Desktop app license verification rewired Supabase → ghost-igl Cognito API (in `igl-coach-ps5` repo)

**Aaron must do (in order):**
1. `.\deploy.ps1` — push founding-pricing site to r6coaching.com (current live site is from Apr 24, before pricing changes)
2. Fill content gaps. Tier 1: Bank's missing 3 sites (CEO is done; `tellers`, `basement`, `open-area` need full coverage), Theme Park's missing 3 sites, Clubhouse Church.
3. (Optional) `cd aws && sam deploy` — only needed before testing desktop-app activation against live `/desktop/verify`.
4. Buy code-signing cert (~$300 EV from SSL.com) before May 8 desktop-app launch.
5. Push to existing R6 audience.

## Slash commands available

- `/fill-strat <map-id> <site-id> <side>` — paste raw notes, get a JSON-formatted strats.js entry.
- `/fill-premium <map-id> <site-id> <side>` — paste raw notes, get a Champion-gated `premiumTactics` block.
- `/support-reply` — paste a customer message, get a draft reply in voice.
- `/launch-tweet` — draft launch tweets for the R6 audience push.
- `/launch-discord-post` — draft a Discord launch announcement.

Project-specific commands live in `.claude/commands/`. User-level commands and skills are loaded too.
