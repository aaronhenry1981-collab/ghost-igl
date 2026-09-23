---
workflow: general-video
flow: automation
storyboard: no
message: "The round was lost on reads, not aim — Recon6 fixes reads."
destination: social
aspect: "9:16"
language: en
audience: "Rainbow Six Siege ranked players, roughly Copper through Plat"
length: "~22s"
angle: "Self-roast post-round autopsy, soft brand tag at the end"
---

## Intent

Short-form meme video for TikTok / YouTube Shorts / Reels, aimed at R6 Siege
players. Companion piece to `siege-teammate-quotes` — same format, flipped
target. That one roasted the teammate; this one roasts the viewer. Five reasons
you lost the round, each followed by a dry aside that takes away the excuse.

Self-roast travels further than teammate-roast: viewers tag themselves and
their squad instead of getting defensive, and the comment section argues with
itself. The Recon6 tag lands only at the very end, as a punchline rather than
an ad.

Tone is dry and deadpan. No hype, no corporate voice, no emoji. Same voice as
the site: direct, no fluff.

## Customizations

- Registry component `rgb-glitch-text` drives the hook card's chromatic tear.
- Vertical 1080x1920 with generous platform-UI safe margins (top 15%, bottom 20%).
- Silent by design — built to be read on mute, which is how Shorts/TikTok
  autoplay for most viewers.

## Notes

- Brand: RECON6. Background near-black `#06070b`, primary accent cyan `#00e5ff`,
  punchline amber `#ffd54a`, alert coral `#ff5a5a`.
- No gameplay footage available in this pipeline — text/motion only.
- Do not claim ranks, stats, or results anywhere in the video. The final card
  sells coaching, not outcomes.
- Beat timing carries the comedy: hard cuts, no slow fades.
- Beats 3 and 5 run coral — those are the two that sting, so they get the
  alert colour rather than the amber aside.
