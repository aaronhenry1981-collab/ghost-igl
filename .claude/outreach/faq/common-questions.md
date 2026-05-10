# FAQ — 30 Common Customer Questions + Aaron-Voice Answers

Voice: direct, no fluff, R6/FPS vocabulary correct (per CLAUDE.md), no corporate speak. Casual but accurate.

---

## Pricing & Plans

### 1. How much is it?

Recon+ has three tiers:
- **Recruit (Free):** 3 VOD reviews/month with limited tagging.
- **Pro ($9/mo founding rate):** Full VOD review, all 10 games, per-game lineup library.
- **Champion ($29/mo founding rate):** Everything in Pro + IGL Command desktop app + premium tactics + early access.

Founding rate is locked for life if you sign up before May 8, 2026. After that, regular pricing kicks in ($12/$39 respectively).

### 2. What's the difference between Pro and Champion?

Pro is the AI VOD review for all 10 games. Champion adds:
- IGL Command desktop app (live in-game coaching from your PC or capture card — launches May 8).
- Premium tactics (spawn-kill spots, advanced setups, runouts).
- Early access to new games and features.

If you only care about post-game review, Pro covers it. If you want live coaching during play, Champion.

### 3. Do you have a free trial?

Yes — Recruit tier is free forever. 3 VOD reviews per month, basic pattern tagging. No card required. If you want to upgrade, the founding rate is $9 or $29.

### 4. What's the founding rate and when does it end?

Founding rate is the lower price you lock in for the life of your subscription. $9/mo (Pro) and $29/mo (Champion). It ends May 8, 2026 — after that, regular rate kicks in for new sign-ups. Existing founding subscribers stay at $9/$29 forever.

### 5. Why is the founding rate "for life"?

Because I want to reward early adopters who took a chance before the platform was proven. If you signed up at $9, you're on $9 in 5 years. No price hikes.

### 6. Can I cancel anytime?

Yes. Cancel from your account page or via the Stripe billing portal. No questions, no retention call. Your access continues through your billing period and stops at renewal.

### 7. Do you offer refunds?

Yes for the first 14 days, no questions. After that, prorated refunds case-by-case if there's a service issue. Email aaron@r6coaching.com.

### 8. What payment methods do you accept?

Stripe handles checkout — credit cards (Visa/MC/Amex/Discover), Apple Pay, Google Pay, and most regional debit cards. No PayPal or crypto right now.

---

## Product / Features

### 9. What games are supported?

Ten: Rainbow Six Siege, Counter-Strike 2, Valorant, Overwatch 2, Apex Legends, Marvel Rivals, Halo Infinite, The Finals, Call of Duty (Warzone + MW3 multiplayer), and Fortnite (Zero Build).

### 10. How does the AI VOD review actually work?

You upload a replay (or link a Twitch VOD / YouTube clip). Our analysis pipeline extracts gameplay patterns, then flags positioning mistakes, utility timing issues, and predictable habits per round. You get a report with timestamps, suggested fixes, and pro-VOD comparisons.

### 11. Is this AI replacing human coaches?

No. The AI flags patterns; it doesn't replace a coach who can talk to you. Think of it as an automated first pass — you watch the flagged moments yourself, or share them with a coach.

### 12. How accurate is the AI review?

The AI is solid on objective patterns (same anchor spot 4 rounds in a row, EMP-then-charge timing off, ult unused). It's weaker on judgment calls (was that a good push or a bad one?). Use it for pattern detection; bring a coach for nuance.

### 13. Does it work for console players?

Yes. The AI processes any replay format — PC or console. For Champion's desktop app, you'll need a capture card to feed console gameplay to your PC. PC players can run it natively.

### 14. Will it tell me if I'm cheating-flagged?

No. We don't analyze for cheats or anti-cheat. Use Vanguard / FACEIT / VAC for that.

### 15. How long does a VOD review take?

24 hours for the standard pipeline. Champion users get priority queue (~6 hours).

### 16. Do you support older game replays?

Within reason. R6 replays from current and previous Year work. CS2 demos work. Valorant doesn't have public replay export so you upload Twitch/YouTube clips. Older patches may have gameplay that doesn't match current pattern set.

### 17. Can I share VOD reviews with friends?

Yes. Each review has a shareable link. By default, links are private — toggle public if you want the team to see.

### 18. Does the desktop app work for streamers?

Yes, but be careful with overlays. The IGL Command UI is a HUD that may show in your stream. Enable "stream-safe mode" in settings to hide tactical info from viewers.

---

## The Desktop App (IGL Command)

### 19. When does the desktop app launch?

May 8, 2026. Pre-orders open now at the founding rate ($29/mo Champion locks in lifetime).

### 20. What does the desktop app do that the web tool doesn't?

Live capture during play. The app reads your screen / capture card feed in real-time and gives tactical voice prompts ("rotate to A", "save your ult", "they're stacking site"). Web tool is post-game only.

### 21. Does it work for all 10 games?

R6 first at launch. CS2 and Valorant within 30 days of May 8 (priority order). Other games rolling out through summer 2026.

### 22. Will it get me banned?

No. The app reads visible screen content — same as a streaming overlay. It doesn't inject into game memory, doesn't read game files, doesn't communicate with game servers. It's compliant with all major anti-cheats.

---

## Account & Technical

### 23. How do I reset my password?

Go to r6coaching.com/auth, click "Forgot password", enter your email. You'll get a reset link via Cognito email.

### 24. I forgot which email I used.

Email aaron@r6coaching.com from any address with proof of payment (Stripe receipt) and we'll find your account.

### 25. Why is the site at r6coaching.com if you support 10 games?

Honest answer: rebranding to recon-plus.com (or similar) is on the roadmap but not urgent. The current site / data is at r6coaching.com because R6 was the first game. Multi-game expansion is recent.

### 26. Is my replay data private?

Yes. We don't share your replays with anyone. We don't sell data. We do aggregate anonymized patterns to improve the AI (e.g., "X% of Plat players have this habit"), but no individual data leaks.

### 27. Can I delete my account + data?

Yes. Email aaron@r6coaching.com asking for account deletion. We delete account + replay data within 7 days. Stripe payment records are kept per accounting requirements.

### 28. Do you have a mobile app?

Not yet. Web tool works on mobile browsers (responsive). Desktop app is PC-only at launch.

---

## About / General

### 29. Who built this?

Aaron — solo dev + R6 player. I started building Recon+ because I was tired of explaining to my Plat-stuck friends why they were losing rounds. The AI was the fix.

I work on this full-time now. Live in [your location], reachable at aaron@r6coaching.com or on Twitter @[your handle].

### 30. Is this a scam? Why is the founding rate so cheap?

Fair skepticism. Two reasons:
1. **I want users**, not revenue. Cheap founding rate gets early adopters in. The product wins them over (or it doesn't), and either way I learn from real usage.
2. **I'm a solo dev.** I don't have a sales team or a marketing budget. The founding rate is what I can charge while bootstrapping.

If you sign up and feel scammed, email me. 14-day refund, no questions.

---

## Tone notes

- **Direct and short.** Most answers <100 words.
- **R6 / FPS vocabulary correct.** "Anchor", "rotation", "utility", "site", "ult" — never use generic gaming terms.
- **Honest about limitations.** "It's weaker on judgment calls" beats "it's perfect."
- **No corporate speak.** Avoid "engagement", "value proposition", "synergize".
- **Self-deprecating where appropriate.** "Honest answer: rebranding is on the roadmap but not urgent" beats marketing-speak.
