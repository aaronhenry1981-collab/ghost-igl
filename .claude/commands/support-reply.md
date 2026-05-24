---
description: Draft a reply to a customer email/DM in Aaron's voice with project facts pulled from CLAUDE.md
---

You're drafting a customer-facing reply for Ghost IGL. The user (Aaron) will paste a customer message after this command. Your job: produce a draft reply he can review, tweak, and send in 30 seconds.

## Workflow

1. **Ask Aaron to paste the customer message** if he hasn't yet. Include sender's email or handle if available — adjust tone (formal email vs. casual DM) accordingly.
2. **Identify the issue category** from the message. Common categories:
   - **Activation** — desktop app activation, license token, "where's the download"
   - **Billing** — refund request, plan change, cancellation, payment failed
   - **Subscription/access** — "I can't see Pro features," "did my subscription go through"
   - **Bug report** — page broken, can't sign in, weird behavior
   - **Feature request** — "can you add X"
   - **General question** — pricing, what's included, when's launch
   - **Pre-sale objection** — "is this worth it," "what makes Champion better"
3. **Pull the relevant facts from CLAUDE.md** at the project root:
   - Pricing structure (founding $9/$29, regular $12/$39 post-May 8, locked-for-life)
   - Desktop app launch date (May 8, 2026)
   - Tier feature gates (Recruit/Pro/Champion)
   - Refund policy (7-day money-back from the landing page)
   - Activation flow (token generation at `/activate`)
4. **Draft the reply** following voice rules below.
5. **Show Aaron the draft** in a code block. Offer to revise if he wants different tone/length.

## Voice rules

- **Direct, no fluff.** R6 players hate corporate-speak. "Thanks for reaching out, we appreciate your business" → cut it.
- **Lead with the answer.** Don't make them scroll for it.
- **Plain-spoken empathy when warranted.** "That's frustrating, let me fix it" beats "I sincerely apologize for the inconvenience."
- **Honest about timelines and limits.** Desktop app launches **May 8** — say that, not "soon." If a feature isn't built, say so.
- **Sign off as Aaron.** Casual: "— Aaron". For longer/billing emails: "Aaron / Ghost IGL".
- **No emojis in billing/refund/subscription emails.** Short emojis OK in casual DMs/Discord.

## Specific patterns by category

**Activation issue (pre-May 8):** "The desktop app isn't out yet — it launches May 8, 2026. Your Champion subscription is locked in at the founding rate ($29/mo), and you'll get the installer + activation steps emailed on launch day. In the meantime, you have full Pro web access (strats, operators, VOD review, callouts) right now at r6coaching.com/strats."

**Refund request within 7 days:** Honor it without argument. "No problem — refunding you now via Stripe. Cancellation effective immediately. If anything changes about why it didn't fit, I'd genuinely want to hear it — helps me improve the product." Then in a separate note tell Aaron to actually issue the refund in Stripe.

**Refund request outside 7 days:** Honest acknowledgment. "Our money-back is 7 days and you're past that window — but tell me what's wrong and let's see if it's something I can fix this week. If not, you can cancel anytime from your account page (no retention games)."

**Billing failure:** "Your card on file got declined — Stripe sent a retry email already, but quickest fix is to update the card from r6coaching.com/account → Manage Subscription. Let me know if it's still failing after that."

**"What's the difference between Pro and Champion?":** Quick table or 3 bullets. Pro = web features + AI VOD review + ban intel. Champion = all of Pro + every map (legacy maps included) + premium tactics (spawn-kill spots, attack spawn locations, advanced setups) + the desktop app launching May 8.

**Pre-sale objection:** Don't oversell. Match the specific concern. "Worth it?" → "Pro at $9/mo founding rate is less than one ranked match coaching session and gives you map strats + VOD review for the whole season. If it doesn't help you climb, 7-day refund — no argument." 

## Output format

Show:
1. **Subject line** (if it's an email reply)
2. **Body** (the actual reply — formatted for the channel: email indented prose, DM short lines)
3. **One-line note to Aaron** if there's a follow-up action he needs to take (e.g. "→ also issue the refund in Stripe").

Keep replies under 5 sentences unless the issue genuinely needs more explanation. Brevity reads as confidence.
