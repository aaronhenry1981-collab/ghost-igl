# Recon+ — Press One-Pager

**For journalists, content creators, and press inquiries.**

---

## What is Recon+?

Recon+ is an AI-powered FPS coaching platform that automates VOD (replay) review across 10 competitive games. Players upload replays, the AI flags patterns — positioning mistakes, utility timing issues, predictable habits — and returns a per-round breakdown comparing the player to pro-tier reads.

---

## The 10 supported games (May 2026)

- Rainbow Six Siege
- Counter-Strike 2
- Valorant
- Overwatch 2
- Apex Legends
- Marvel Rivals
- Halo Infinite
- The Finals
- Call of Duty (Warzone + MW3 multiplayer)
- Fortnite (Zero Build)

---

## Background

Recon+ started as a R6-only coaching tool ("Ghost IGL"). Founder Aaron is a solo developer + competitive R6 player who built the prototype after months of recording his own friend group's ranked matches and noticing the same plateau patterns recurring across players.

The platform launched publicly in late 2025. Multi-game expansion (CS2, Valorant, OW2, etc.) shipped in early 2026 in response to user requests for cross-game coaching from players who actively play multiple titles.

---

## What makes Recon+ different

1. **Multi-game by design.** Most coaching tools are single-game. Recon+'s pattern-detection logic is shared across games, with per-game terminology layered on top (operators / agents / legends / heroes / loadout archetypes).

2. **AI VOD review at scale.** The platform automates what tier-1 esports coaches do manually — pattern recognition across 50-200 hours of footage. Players can self-review without booking expensive sessions.

3. **Lifetime founding pricing.** Sign up before May 8, 2026 and lock in $9/mo (Pro) or $29/mo (Champion) for life. No price hikes ever for founding subscribers.

4. **IGL Command desktop app (launching May 8, 2026).** Real-time tactical coaching from a PC or console capture card during play — not just post-game review.

---

## Pricing

| Tier | Founding (before May 8) | Regular (after) |
|---|---|---|
| Recruit (free) | 3 VOD reviews/month | Same |
| Pro | $9/mo | $12/mo |
| Champion | $29/mo | $39/mo |

---

## Product features

**Pro tier ($9/mo founding):**
- Unlimited VOD reviews across 10 games
- Per-round positioning + utility timing analysis
- Pro-VOD comparison library
- Per-game lineup library (smokes, recon, Mira angles, etc.)
- Discord community access

**Champion tier ($29/mo founding):**
- All Pro features
- IGL Command desktop app (live coaching)
- Premium tactics (spawn-kill spots, runouts, advanced setups)
- Early access to new games + features
- Priority VOD review queue

---

## Technical stack (for the curious)

- **Frontend:** React 19 + Vite, hosted on AWS S3 + CloudFront.
- **Backend:** AWS Lambda (Node.js), DynamoDB.
- **Auth:** AWS Cognito.
- **Billing:** Stripe.
- **AI:** AWS Bedrock for VOD analysis (with multi-game pattern library curated from pro VODs).
- **Desktop app:** Electron + Tesseract OCR for screen capture, TTS for live calls.

---

## Founder

**Aaron** — solo developer based in [city]. Builds full-stack + does product strategy + handles support. Reachable directly at aaron@r6coaching.com or on Twitter @[your handle].

Aaron is a competitive R6 player and longtime FPS player. The motivation for Recon+ was personal: explaining to his friend group why they were stuck at Plat. The AI was the systematic answer.

---

## Press / interview availability

Aaron is available for:
- Written interviews (reply via email).
- Live podcast / Twitter Spaces / Discord stage interviews — schedule through aaron@r6coaching.com.
- Product demos for journalists or content creators (~30 min, screen share, walks through the AI VOD review on a real replay).

For high-engagement journalists, free Champion access is available — email aaron@r6coaching.com.

---

## Press kit / assets

- **Logo (high-res):** [link to logo file when available]
- **Founder photo:** [link when available]
- **Product screenshots:** [link to screenshots when available]
- **Demo video:** [link when available]
- **Live site:** https://r6coaching.com

---

## Story angles

If you're a journalist looking for an angle:

- **"Solo dev builds AI coaching for 10 FPS games"** — bootstrapping + product story.
- **"Why FPS coaching markets are fragmented per game"** — multi-game thesis.
- **"AI vs human esports coaches — automation in competitive gaming"** — broader trend piece.
- **"Why Plat is the universal FPS plateau"** — tactical / data analysis piece using Recon+'s aggregated patterns.

---

## Contact

- **Email:** aaron@r6coaching.com (Aaron, founder, replies within 24 hours)
- **Twitter / X:** @[your handle]
- **Discord:** [your-discord-invite] (not for press, but for community context)
- **Site:** https://r6coaching.com

---

## Honest caveats (for journalists who care about accuracy)

- Recon+ is a small bootstrapped project (1 founder, no investors as of May 2026).
- The AI VOD review is solid on objective patterns; weaker on judgment calls. Don't oversell it.
- Multi-game support is a recent expansion (early 2026). The R6 module is the most mature; other games are v1.
- Founding pricing is genuine — it's lifetime locked, not a "founding" gimmick that ends quietly.
- Pre-launch hype on the desktop app is real but the product launches May 8, 2026 — no demos before then.

---

## Last updated

May 2026 — refreshed each major launch milestone.
