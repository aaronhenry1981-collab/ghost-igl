# Claude Code Command — Clip Pipeline, Brand Mark, Support Inbox

Three bounded builds. **They touch two different repos.** Do not run one agent across both — finish a repo, then move.

---

## HARD RULES (apply to everything below)

- **Never `sam deploy`** on `ghost-igl`. Template drift wipes the live Stripe webhook secret out of the Lambda env. Lambda deploys are per-function zips + `aws lambda update-function-code`.
- **Never touch the Cognito User Pool** (`us-east-1_rvLy8WLQB`). Everything additive. Before calling any deploy done, verify an existing user can still log in.
- **Never paste secrets into chat or commits** — `sk_live_…`, `rk_live_…`, `whsec_…`, AWS keys. Redact command output before sharing.
- One Stripe account serves **two live businesses** (Iron Front Digital, `us-east-2`; RECON6, `us-east-1`). Never delete or modify a Stripe resource without confirming which business owns it.
- **Ban safety is not negotiable.** Everything here reads Aaron's own recordings, after the fact, on his machine. No live capture, no game hooks, no memory reads, no enemy detection.
- Lint 0. It builds. Existing subscribers unaffected.

---

# PART 1 — Coaching sidecar export  *(repo: `igl-coach-ps5`)*

**This is the highest-value item. It unlocks the TikTok content engine.**

## The problem, in one sentence

`voice_log` timestamps every spoken coaching line in **wall-clock ISO time**. A video file timestamps everything from **0:00**. Nothing records where those two lines up — so we can't say "the coach said *rotate* at 4:31 into this recording."

Close that gap and the clipper at `C:\IronFront_Master\recon6-clipper\clip.mjs` (already written, already tested, zero npm deps) automatically cuts TikTok clips built around real AI coaching calls, with the coach's exact words burned on screen.

## Build

**1. Record when capture starts.**
Write `recording_started_at` = `new Date().toISOString()` into `app_meta` when a capture session begins.

**2. Export the sidecar.**
New IPC handler + a button (Settings, or the VOD page): **"Export coaching log for clipping."**
Given a video at `X.mp4`, write `X.events.json` beside it:

```json
{
  "recordingStartedAt": "2026-07-10T18:04:12.000Z",
  "video": "X.mp4",
  "events": [
    {
      "created_at": "2026-07-10T18:04:32.000Z",
      "text": "Rotate to CEO now, they're stacking Janitor",
      "context": "prep",
      "confidence": 0.9
    }
  ]
}
```

Source rows from `voice_log` (`created_at`, `text`, `context`), filtered to
`[recordingStartedAt, recordingStartedAt + duration]`.
Use the existing `probeDurationSec()` in `src/main/ffmpeg-service.ts` for duration — don't add a probe dependency.

Join `confidence` from `recommendation_audit` on matching `line_text` **only if it's cheap**. Otherwise omit the field; the clipper defaults it to 0.5.

**3. Fallback when the recording started outside the app.**
If `recording_started_at` is missing, read `creation_time` from the mp4 container. Also expose a manual "recording started at" time input on the export dialog.

**Guard:** if zero events land inside the video's time window, the offset is wrong. **Fail loudly.** Do not write a sidecar that will silently produce garbage clips.

**4. Auto-export (do it if it's clean).**
When a capture session ends and the app knows the recording path, write the sidecar automatically.

## Verify

- Capture a session, let the coach speak ≥3 lines, stop.
- Export. Open the JSON: `created_at − recordingStartedAt` must equal where you actually *hear* that line in the video, ±1s. **Confirm by scrubbing the video. Do not trust the arithmetic.**
- `node C:\IronFront_Master\recon6-clipper\clip.mjs "<that video>" --dry` → prints `✓ coached mode` with sensible timestamps.
- Drop `--dry`: the rendered clip shows the coach's line burned on screen at the moment he says it.
- Delete the sidecar, rerun → falls back to `heuristic mode` cleanly.
- Lint 0, builds, **no new npm dependencies**, nothing AWS touched.

---

# PART 2 — Ship the brand mark  *(repo: `ghost-igl`)*

New identity lives in `ghost-igl\brand\`:
- `recon6-avatar.svg` — the mark. Pure paths, no text nodes, no font dependency.
- `recon6-mark.svg` — detailed variant (graduation collar, lattice) for large display only.
- `avatar_1080.png` — raster, for social.

**Concept, so you don't "improve" it wrong:** a hexagon has six sides — that's the 6, expressed structurally rather than typed. Five sides are ice (`#9BE7FF`), silent. One is amber (`#FFB03A`) — the call. **Amber appears exactly once.** If a second amber element shows up anywhere in the identity, both die. Field is `#07090B`.

## Build

1. **Favicon** from `recon6-avatar.svg`. Emit `favicon.svg` + PNG fallbacks at 32/180/192/512. Delete any old `6`-glyph favicon.
   *Test at 32px.* If it reads as a smudge, the mark is scaled wrong — the hexagon should nearly fill the frame.
2. **Site header logo** → `recon6-avatar.svg` + the `RECON6` wordmark. Never use `recon6-mark.svg` below ~200px.
3. **Open Graph / Twitter card** image using the mark on the `#07090B` field.
4. **Do not embed live `<text>` in any logo asset.** Any wordmark ships as outlined paths or as real DOM text next to the mark — never as a text node inside the SVG.
5. Purge the old reticle-and-"6" assets. They declare no `font-family`, so they render differently in every browser.

## Verify
Favicon legible at 32px in a real browser tab. Header logo crisp at 1× and 2×. Exactly one amber element on screen. Lighthouse doesn't regress. `.\deploy.ps1`.

---

# PART 3 — `support@r6coaching.com`  *(repo: `ghost-igl` + AWS, `us-east-1`)*

Customer-facing address for booking confirmations to reply to. All AWS, no new vendor, pennies.

## Build

1. **MX record** in Route 53 (`Z029335322YATCIIJXX6`) → `10 inbound-smtp.us-east-1.amazonaws.com`.
2. **Verify the domain** for SES receiving.
3. **SES receipt rule set:** recipient `support@r6coaching.com` → S3 (or straight to Lambda).
4. **Forwarder Lambda** — `ghost-igl-mail-forward`. Reads the raw message, rewrites the envelope (`From:` a verified domain sender, `Reply-To:` the original sender), forwards to Aaron's Gmail. Deploy as a **per-function zip** with a **direct IAM role**. Not SAM.
5. Aaron configures Gmail "send mail as" via SES SMTP so replies leave as `support@r6coaching.com`.

## Verify
- Mail to `support@r6coaching.com` lands in Gmail within a minute.
- Hitting Reply goes to the **original sender**, not to AWS.
- A reply sent from Gmail arrives with `support@r6coaching.com` in the From, passing SPF/DKIM.
- **The Stripe webhook Lambda's env is untouched.** Print its config before and after and diff it.
- Existing user login still works.

---

## Order

**Part 1 first.** It's the only one that produces something that gets customers this week — every clip is a demo where the AI is visibly the star, which is the entire positioning. Part 2 is an hour. Part 3 can wait for a slow afternoon.

## Out of scope — do not start

Serving `strats.js` via API, sync-spine Part B, `/climb` changes, pricing, anything Stripe. Those are other lanes. Finish these three.
