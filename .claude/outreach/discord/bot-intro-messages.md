# Discord Bot Intro Messages

## Context

When the Recon+ Discord bot is added to a new server (or when a user joins your own Recon+ Discord), the bot should send introduction messages. These are the drafts.

The bot itself isn't built yet — these are copy-ready when implementation happens.

## Welcome message — sent when user joins Recon+ Discord

**Channel:** #welcome (or DM to the new joiner)

```
Welcome to Recon+, [username] 👋

We're an AI-powered FPS coaching platform for 10 games (R6, CS2, Valorant, OW2, Apex, Marvel Rivals, Halo, The Finals, CoD, Fortnite).

**Quick start:**
- 📖 Read **#rules** — short, mostly common sense.
- 🎯 Pick your game roles in **#role-select** — gets you into the right channels.
- 📤 Drop a VOD in **#vod-uploads** — bot will analyze it within 24 hours.
- 💬 Say hi in **#introductions** if you want to.

**Useful channels per game:**
- `#r6-strats`, `#cs2-strats`, `#valorant-strats`, etc.
- `#vod-uploads` for AI-reviewed clips.
- `#feature-requests` if you want something added.

**Pricing reminders:**
- Founding rate is $9/mo (Pro) and $29/mo (Champion) until May 8.
- Locked in for life if you sign up before then.
- Free tier: 3 VOD reviews / month with limited tagging.

Questions? Ping a mod or open a ticket in `#support`.

GLHF 👊
```

## Welcome message — when the bot is added to an external server

**Triggers:** When a server admin invites the Recon+ bot to their server (e.g., a YouTube creator's Discord wants to integrate VOD review for their members).

```
👋 Hi! I'm the Recon+ bot.

I provide AI VOD review for [user's server game(s)]. Server admin can configure me with `/recon-config`.

**What I do:**
- Process VOD uploads to a designated channel.
- Tag flagged patterns (positioning, utility timing, ult usage).
- Provide pro-VOD comparisons.

**What I don't do:**
- Send DMs unsolicited.
- Track member data outside this server.
- Auto-promote anything.

**For server admins:**
- `/recon-config channel <#channel>` — set the VOD upload channel
- `/recon-config game <game>` — set the default game (R6, CS2, etc.)
- `/recon-help` — see all commands

**For server members:**
- Upload a VOD to the configured channel; I'll process it.
- Use `/recon-stats` to see your aggregate patterns.

Aaron @ Recon+ ([https://r6coaching.com](https://r6coaching.com))
```

## VOD-processed message — sent when a user's VOD is done

```
📊 **VOD review complete for [username]'s [game] match**

**Top 3 flagged patterns:**
1. **[pattern title]** — [brief description]. Round-by-round: rounds [list].
2. **[pattern title]** — [brief description].
3. **[pattern title]** — [brief description].

**Pro VOD comparison:** [link to relevant pro example, if applicable]

**Full report:** [link to dashboard view]

Tag a teammate with `@username` to share findings.
```

## Re-engagement message — sent if user hasn't uploaded in 14+ days

**(Bot to user DM, opt-out available.)**

```
Hey, noticed you haven't uploaded a VOD in 2 weeks. No pressure!

If you're stuck on a rank or fighting tilt, sometimes a fresh VOD review helps. Drop one in #vod-uploads when you're ready.

(Reply STOP to mute these check-ins.)
```

## Champion comp confirmation

```
🎉 **Champion access granted, [username]**

You now have:
- All 10 games unlocked
- Unlimited VOD reviews
- Pro-VOD comparison library
- Early access to new features

Lifetime founding rate: $29/mo locked in (regular price post-May 8 will be $39/mo — you stay at $29 forever).

Get started: drop a VOD in #vod-uploads.

Need help? `#support` channel or DM @aaron.
```

## Tone guidelines

- **Casual but informative.** Match Discord tone, not LinkedIn tone.
- **No emoji spam.** 1-2 per message max.
- **Direct and short.** Discord users skim — get to the point in 3 lines.
- **Use `code` formatting for commands.** Highlights the action.
- **Avoid corporate phrases.** "Reach out", "circle back", "engagement metrics" — never.

## Don't

- Don't send marketing DMs without opt-in. Discord ToS violation.
- Don't auto-tag users (`@username`) in announcements. Annoying.
- Don't send the same message twice. Bot looks broken.
- Don't link to checkout / pricing in welcome. Discord communities hate sales pressure.

## Implementation note for Aaron

When you build the bot:
- Use Discord.js or discord.py.
- Store user opt-in/opt-out in your DB. Never message a user who hasn't joined a Recon+ server.
- Rate-limit per user to avoid spam (max 1 onboarding message + 1 weekly recap).
- If you set the bot to scan VOD channels, get explicit `/recon-config opt-in` from the server admin.
