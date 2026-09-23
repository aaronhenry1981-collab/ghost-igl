# Ghost IGL — Project Brief for Claude

You're working on **Ghost IGL** (r6coaching.com), an AI-powered in-game leader / coaching SaaS for Rainbow Six Siege. This file auto-loads every session — use it to skip the "explain the project" tax.

**Naming:** "Ghost IGL" is internal — the repo, the AWS resource prefix, this brief. The customer-facing brand is **RECON6** (wordmark, site copy, video tags). Don't put "Ghost IGL" in anything a customer sees.

**Dated claims in this file go stale.** Anything with a date attached is a snapshot, not a guarantee — verify against the code before acting on it. The sections most worth re-checking are Pricing, Desktop app, and Current state.

---

## Stack

- **Frontend:** React 18 + Vite + React Router (HashRouter — `#/route` style URLs). Source in `src/`. Built artifacts go to `dist/`.
- **Auth:** AWS Cognito (`amazon-cognito-identity-js`). User pool `us-east-1_rvLy8WLQB`, client `5bpa1cteenctoue24v4e245re8`. Admins are members of the `admins` Cognito group.
- **API:** AWS API Gateway HTTP API at `https://u0k402df6j.execute-api.us-east-1.amazonaws.com/prod` → Lambda functions in `lambda/`.
- **Lambdas:** 15 under `lambda/`. Core: `subscription` (user lookup + profile + Stripe billing portal + `/desktop/verify`), `webhook` (Stripe events), `admin` (admin dashboard + Stripe backfill), `vod` (Bedrock VOD analysis). Also `announcements`, `booking` (coaching Checkout Sessions), `climb-progress`, `coaching-sync`, `crm`, `discord`, `mail-forward`, `player-data`, `reddit-watcher`, `trn`, `ubisoft-patch-watcher` (its tests run in CI).
- **Data:** DynamoDB. Subscriptions table `ghost-igl-subscriptions` (PK `stripe_customer_id`, GSI `email-index`). Profiles table `ghost-igl-profiles` (PK `email`).
- **Stripe:** account shared with Iron Front Digital. Live mode. Price IDs and payment links in the **Pricing** section below.
- **Hosting:** S3 bucket `r6coaching.com-site` behind CloudFront `E2WUR8DDHCOYC9`. Route 53 hosted zone `Z029335322YATCIIJXX6`.
- **Region:** all infra in `us-east-1`.

## Desktop app (separate repo)

Lives at `C:\IronFront_Master\igl-coach-ps5\` — Electron + React + Tesseract OCR + TTS for live coaching from PC capture or console capture-card feed. Verifies licenses via the `/desktop/verify` endpoint on this site's API.

**Status: not shipped.** The May 8 2026 date came and went; nothing was released. `config/product-truth.json` records it as `shipped: false, live: false, downloadable: false`, and the only label allowed in copy is "early access".

One env flag holds the whole launch closed — `VITE_DESKTOP_APP_RELEASED`, read in `main.jsx`, `Navbar.jsx`, `WelcomeModal.jsx` and `DownloadPage.jsx`, and **set nowhere** (no `.env`, not in `.env.example`, not in `deploy.ps1`, not in CI), so it is `false` in every build. While false it redirects `/download` to `/account`, hides the desktop links, and keeps `/download` out of the sitemap. `npm run check:truth` enforces all three, so flipping the flag means relaxing those rules in the same change.

---

## Pricing

**The founding window is CLOSED.** It ran from 2026-04-28 and was extended twice
(May 8 → May 31 → Aug 31), re-opening 2026-07-12, and expired **August 31, 2026**.
New sign-ups pay regular rates. Existing founding subscribers stay locked at their
founding rate for the life of the subscription — that is the marketing promise;
honor it. Stripe does not auto-bump existing subscriptions, so this holds by default.

**Do not hardcode prices or payment links in components.** Two config files are the
single source of truth, and everything else reads from them:

- `src/config/founding.js` — `FOUNDING_END_ISO` and the display strings. One
  timestamp drives the whole site.
- `src/config/stripe.js` — every price ID, payment link and amount, plus the
  resolved `PRO_CHECKOUT_LINK` / `CHAMPION_CHECKOUT_LINK` / `*_CURRENT_AMOUNT`
  that components should use.

The site **rotates automatically** on the deadline: countdown badges hide, founding
framing is suppressed, and checkout links swap to regular pricing. No manual link
swap and no deploy are needed to flip pricing — the earlier "swap the `link` field
in `PRICING` on launch day" instruction is obsolete and was never how this works.

| Tier | Founding | Regular (current) | Founding price ID | Regular price ID |
|---|---|---|---|---|
| **Pro** | $9/mo | **$12/mo** | `price_1TPtOKJNddvjgWcg47I16AQp` | `price_1TLEtrJNddvjgWcg9iTWJoLS` |
| **Champion** | $29/mo | **$39/mo** | `price_1TLEtsJNddvjgWcgYcmiNmW7` | `price_1TPtOYJNddvjgWcgfEWjzGnp` |

Founding checkout links carry a **30-day free trial** (created 2026-07-11, card up
front, then auto-bills the founding rate). The pre-trial links are kept in
`stripe.js` for rollback only — they are not what the site serves.

**Coaching** (one-time / add-on, product `prod_Us9Aa8zlWWiHjM`, not subscriptions):
$20 intro (first session only, enforced server-side — never trust the client),
$40 single, $70/mo add-on granting 2 session credits per month with no rollover.
"Academy" ($99) is a marketing label for Champion + add-on, not a SKU.

**All-Access** ($19 Pro+ / $49 Champion+, covering 10 games) exists in `stripe.js`
with live links, but is **dormant**: `R6_ONLY = true` in `LandingPage.jsx` gates the
banner off, and `check:truth` forbids multi-game marketing on active surfaces. Do not
revive it without changing the product-truth registry deliberately.

To change pricing: edit `founding.js` / `stripe.js`, never the components. To end a
promo early, set `VITE_STRIPE_FOUNDING_ACTIVE=false`.

The webhook Lambda's `getPlanFromPrice()` must recognise every price ID above —
keep it in sync or incoming Stripe events map to the wrong plan label.

## Tier feature gates

- **Recruit (free):** ranked-pool maps, basic strats, operator catalog, Discord access.
- **Pro:** everything in Recruit + full utility/callout breakdowns, ban recommendations, enemy intel, squad coaching, AI VOD review.
- **Champion:** everything in Pro + **premium tactics** (per-site `premiumTactics` block in `src/data/strats.js` — spawn-kill spots, attack spawn locations, advanced setups, runouts, anti-spawn-peek) + IGL Command desktop app + live capture coaching + team sync. The desktop app is **not shipped** (see above), so premium tactics is Champion's only live differentiator today.

> **Known inconsistency — map gating does not work as advertised.** `championOnly`
> is fully wired (`MapSelector.jsx`, `StratsPage.jsx` both honor it) but **no map
> sets it** — in `src/data/maps.js` the flag appears only in a comment, so all 25
> maps are open to free users. Meanwhile `LandingPage.jsx` sells Champion on
> "Every R6 legacy map unlocked (Favela, Fortress, Hereford, House, Kanal)" while
> `SoftPaywall.jsx` sells the *same* unlock as a Pro benefit — and Kanal is in the
> ranked pool, not legacy. Needs a product decision: either re-gate the legacy maps
> (`favela`, `fortress`, `hereford`, `house`, `outback`, `plane`, `tower`, `yacht`,
> `coastline`, `emerald-plains`, `stadium-bravo`) or drop the unlock claims from the
> copy. Do not "fix" one side silently — it changes what customers get or are promised.

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

# Run everything CI runs, in CI's order
npm run ci
```

### Checks

`npm run ci` chains these; run them individually while iterating:

| Command | Guards |
|---|---|
| `npm run check:truth` | R6-only active surfaces, desktop release gate |
| `npm run check:generated` | committed `public/` output matches the generators |
| `npm run check:metadata` | metadata dates |
| `npm run test:rss` | feed dates |

`public/` is generator output that is **also committed**, so it can silently fall
behind `scripts/`. `check:generated` rebuilds and diffs it, ignoring only the two
wall-clock fields (`<lastBuildDate>` in `feed.xml`, `<lastmod>` in `sitemap.xml`).
If it fails: run `npm run build`, review the diff, commit `public/`.

## Short-form video (`videos/`)

HyperFrames (HeyGen) projects that render 1080x1920 MP4s for TikTok / Shorts /
Reels — HTML + GSAP motion graphics, **not** talking avatars. One directory per
video, each self-contained with its own `BRIEF.md`, vendored GSAP and font
subsets so renders are reproducible offline.

```bash
cd videos/<name>
npm run check    # lint + runtime + layout + motion + contrast — must be clean
npm run render   # -> renders/*.mp4
```

`renders/` and `snapshots/` are gitignored as regenerable output. Compositions must
be deterministic (no `Date.now()`, no unseeded `Math.random()`, no render-time
network). Content rules: no rank/stat/result claims, no emoji, dry deadpan voice,
RECON6 tag only at the end.

## Secrets handling

Never paste raw `sk_live_…`, `rk_live_…`, `whsec_…`, AWS access keys, or DB strings into chat. When a command's output contains them, redact before pasting back. If they leak, rotate immediately — don't continue as if nothing happened.

---

## Current state (as of 2026-09-23)

The previous snapshot in this file was from 2026-04-28 and had gone badly stale —
it still described the founding window as open, listed content gaps that were
filled months ago, and gave a manual pricing-swap procedure that was never how the
code works. ~82 commits landed on `main` between then and now. Re-verify before
trusting any dated claim here.

**Verified current:**
- **Content is complete.** All 25 maps × 4 sites × 2 sides = **200/200 slots**
  populated, every one with 5 operators, a strategy, callouts, utility, and a
  `premiumTactics` block. The old "Tier 1 content gaps" (Bank `tellers`/`basement`/
  `open-area`, Theme Park's 3 sites, Clubhouse Church) are **done**.
- **Founding window closed 2026-08-31**; the site auto-rotated to regular pricing.
- **Desktop app never shipped** — see the Desktop app section.
- Shipped since April: paid coaching funnel + booking, referrals, CRM, persistent
  player-intelligence foundation (`player-data` SAM stack), Y11S2.2 content
  grounding, member profiles + admin directory, and GitHub OIDC production deploys.

**Open decisions (need Aaron, not a code fix):**
1. Map gating vs. marketing copy — see the Known inconsistency box above.
2. Whether `/download` returns to the sitemap. Gated on the desktop app actually
   shipping, not on a date.

**Housekeeping worth doing:**
- `.github/workflows/` holds four `apply-member-profile-upgrade*.yml` one-shot
  migrations plus `hotfix-admin-region-projection.yml`. They self-trigger on a push
  to `main` that touches their own file, and carry `contents: write` / `id-token:
  write`. Harmless while untouched, but a bulk edit across `.github/` would re-fire
  production migrations. Delete them once confirmed spent.
- `src/config/stripe.js` still warns that the $39 Champion regular link "doesn't
  have a payment link yet". It does — created 2026-05-09. Stale comment only.

## Slash commands available

- `/fill-strat <map-id> <site-id> <side>` — paste raw notes, get a JSON-formatted strats.js entry.
- `/fill-premium <map-id> <site-id> <side>` — paste raw notes, get a Champion-gated `premiumTactics` block.
- `/support-reply` — paste a customer message, get a draft reply in voice.
- `/launch-tweet` — draft launch tweets for the R6 audience push.
- `/launch-discord-post` — draft a Discord launch announcement.

Project-specific commands live in `.claude/commands/`. User-level commands and skills are loaded too.
