# Autonomous Selling System spec — reconciled against the actual repo

**Read this before building anything from the handoff spec.** Written 2026-07-28.

The spec was authored by chat-Claude, which cannot see this filesystem or the
AWS account. Section 8 lists five "Open Questions for Aaron". Four of them are
answerable from the repo, and two of the answers invert the spec's build order.

Nothing here criticises the spec — its reasoning is sound given what it could
see. It just could not see this.

---

## The build order in the spec is inverted

Spec says: **3 (lead intake) → 1 (lifecycle) → 2 (content)**, on the basis that
1 and 3 are the smallest lifts. Both are already built and live.

### Automation 1 — Customer Lifecycle: **BUILT AND RUNNING**

`lambda/crm/index.mjs` → `ghost-igl-crm`, state Active, deployed 2026-07-21,
`DRY_RUN=false`, fired daily by EventBridge rule `ghost-igl-crm-daily`.

It already does the sequence the spec describes:

| Spec asks for | CRM lambda does |
|---|---|
| Day 0 welcome | `WELCOME` — confirmed signup < 14 days, once only |
| Day 1–2 reminder if intake incomplete | `CONFIRM` — resends Cognito code, max 2, 72h apart |
| Day 30 win-back | `WINBACK` — > 7 days old, not seen in 14 days, one email ever |
| — | `ORPHANS` — active Stripe sub with no Cognito login, flagged |
| — | `DIGEST` — daily summary to ALERT_EMAIL |
| "no sends without a dry-run log first" | `DRY_RUN` env var, exactly that guardrail |

State is in DynamoDB `ghost-igl-crm-log` (PK email), flags set only after a
successful send.

**Genuinely missing from Automation 1:** the post-delivery testimonial request
and the day-7 upsell. Those two are real work. The rest is not.

### Automation 3 — Lead capture → intake → assignment: **LARGELY BUILT**

`lambda/booking/index.mjs` → `recon6-booking`, Active, deployed 2026-07-24. It
is a full scheduler, not a form handler — double-booking made impossible by a
conditional `attribute_not_exists(slotId)` write, UTC slot keys with DST-safe
expansion, 24h/1h no-show reminders on a 30-min EventBridge tick, and signed
reschedule/cancel tokens in every confirmation.

That is more than the spec's Automation 3 asks for.

### Automation 2 — Content pipeline: **the only real work, and its hardest piece is mostly done**

The spec calls stage 2 (highlight detection) "the highest-effort piece — budget
real time for it, don't underscope", and proposes OpenCV template-matching
against Siege HUD elements.

**The coach has been doing HUD detection live for months and writing a
timestamped event log for every session.** Each recording in `~/Downloads` has a
`.coaching.json` sidecar. Across the last 40 sessions:

```
DIED             156      round WON        71
respawned        220      round LOST       58
phase → action   289      side → attack    64
phase → prep     488      room           1305
phase → pick     656      route           165
```

That is a ready-made highlight index with second-level timestamps, over **182
recorded sessions**, already on disk. `mine_maps.py` already uses these sidecars
to seek to specific moments in a recording — the seek-and-clip mechanism exists.

So for v1, no computer vision is needed for:

- **death clips** — `DIED` with a timestamp; cut the window *before* it, which is
  exactly the "setup/read worth showing even when it goes wrong" the spec wants
- **round wins** — `round WON`
- **round structure** — `phase →` transitions bound every clip cleanly

CV is still needed for what the sidecars do **not** log: multi-kill banners
(2K/3K/4K/ACE), MVP screens, and rank-up screens. Kills are not currently logged
at all — only deaths. Adding kill detection to the coach is likely cheaper than
building a separate offline CV pipeline, since it already reads the HUD.

---

## Architecture: the spec's stack is not this stack

The spec specifies **Postgres (Prisma, pgvector)** and **AWS App Runner**.

This repo has **zero** Postgres or Prisma — `grep` finds no reference in any
Lambda or in `package.json`. Everything is DynamoDB + Lambda + API Gateway +
EventBridge, with the site on S3/CloudFront. Eight Lambdas already use the
DynamoDB client.

Introducing Postgres and App Runner means running two datastores and two
hosting models for one product. That may still be right if Recon 6 Intel is a
separate application with its own needs, but it is a decision, not an
inheritance — and the spec presents it as matching an existing stack.

Also from `CLAUDE.md`: **never `sam deploy`** on this repo (it wipes the live
Stripe webhook secret), and Lambda deploys are per-function zips.

---

## Answers to Section 8

| Spec question | Answer |
|---|---|
| What processes payments? | **Stripe**, live. Price IDs and payment links are in `CLAUDE.md`; `lambda/webhook` handles events. |
| Existing CRM? | **Yes** — DynamoDB `ghost-igl-subscriptions` (PK stripe_customer_id, GSI email-index), `ghost-igl-profiles` (PK email), plus `ghost-igl-crm-log` for lifecycle state. Source of truth for "paying customer" is Stripe → subscriptions table. |
| Intake form live? | **`recon6-booking` is live** and handles booking end to end. Whether a separate 7-field VOD intake form exists is the one part still worth confirming with Aaron. |
| TikTok API/Business status? | **Cannot be determined from the repo.** This is the one genuine open question. |
| Who has the Elgato captures? | **`C:\Users\aaron\Downloads`** — 182 `ghost-coach-*.webm` files, ~274 GB, each with a `.coaching.json` sidecar. Not `/captures/YYYY-MM-DD_session/`. Note: 2 recent files have no sidecar, so they cannot be indexed. |

---

## Suggested revised order

1. **Verify, don't rebuild.** Confirm the CRM's live behaviour (it is on
   `DRY_RUN=false` already — check what it has actually sent) and confirm
   booking covers the intake need. Cost: minutes.
2. **Close the two real gaps in Automation 1** — post-delivery testimonial
   request, day-7 upsell.
3. **Content pipeline v1 off the sidecars** — deaths and round wins, no CV.
   Reuses the existing seek-and-clip path in `mine_maps.py` and the three
   existing clippers (`aim-coach/make_clips.mjs`, `aim-coach/style_clip.mjs`,
   `recon6-clipper/clip.mjs`).
4. **Add kill/ACE detection to the coach**, not to a separate CV pipeline.
5. **TikTok posting last**, gated on the API answer — the spec is right about
   this and it should not move.

## Constraints already known that the spec should absorb

- TikTok web scheduling **cannot use trending sounds**, and scheduled posts
  **cannot be edited** once queued. Sound-dependent posts must go up from the
  phone. A queue that assumes web scheduling will silently drop those.
- Bedrock: **Haiku is access-denied**; everything falls through to Sonnet. Any
  per-clip caption generation needs a cost ceiling before it runs at volume.
- `CLAUDE.md` in `OneDrive\Desktop\ghost-igl` is the **retired** copy. The live
  one is `C:\IronFront_Master\ghost-igl\CLAUDE.md`.
