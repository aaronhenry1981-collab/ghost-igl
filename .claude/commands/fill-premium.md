---
description: Add a Champion-gated premiumTactics block to a site. Args:&nbsp;<map-id> <site-id> <side>
---

You're helping Aaron add Champion-tier premium tactical content to a site in `src/data/strats.js`. This is the differentiator that makes the $29 Champion tier sellable. The command was invoked with: $ARGUMENTS

Parse arguments as `<map-id> <site-id> <side>`. If missing, ask.

## Schema reminder

The `premiumTactics` block lives inside an existing `attack` or `defense` strat object. All sub-fields are optional — render only what's filled.

**Attack-side fields:**
```js
premiumTactics: {
  attackSpawns: [
    { spawn: 'Front Yard', from: 'street side', use: 'Cross to garage early to avoid the Castle window peek' },
  ],
  spawnKillSpots: [
    { from: 'CEO window', target: 'Truck spawn', risk: 'long sightline, easy headshot if they prefire', reward: 'free pick if defender pushes early' },
  ],
  advancedSetups: [
    'Drone CEO from skylight before commit — most defenders forget to check up',
  ],
}
```

**Defense-side fields:**
```js
premiumTactics: {
  runouts: [
    { from: 'Garage', target: 'Truck spawn', timing: 'first 15s before drones arrive' },
  ],
  antiSpawnPeek: [
    'Reinforce CEO window first — denies the spawn-peek lane entirely',
    'Camera on truck spawn approach — call attacker spawn for runout teammate',
  ],
  advancedSetups: [
    'Bandit trick + ADS combo on CEO wall — the ADS catches Thatcher EMPs before they kill the trick',
  ],
}
```

## Workflow

1. **Verify the strat already exists.** Read `src/data/strats.js`. The base `attack` or `defense` strat for `<mapId>.<siteId>` must exist before you can add `premiumTactics` to it. If it doesn't, tell Aaron to run `/fill-strat` first.
2. **Check if `premiumTactics` already exists** for this side. If so, show it and confirm replace vs. abandon.
3. **Ask Aaron for premium intel.** Prompt by side:
   - **Attack:** Where do attackers spawn (which side of map)? Best routes from spawn to site? Spawn-kill opportunities (windows/angles where attackers can punish defender runouts)? Advanced tricks not in the basic strategy?
   - **Defense:** Best runout windows (timing + spot)? How to deny attacker spawn-peek angles? Advanced setups (Bandit tricks, vertical plays, etc.)?
4. **Format into the schema** — only include sub-fields with content. Don't pad with empty arrays.
5. **Show Aaron the block.** Code block, formatted, ready to paste.
6. **Edit the file.** Add the `premiumTactics` field to the existing strat object using the Edit tool. Match indentation of surrounding code exactly.
7. **Verify with `npm run build`.** Show errors if any.

## Voice rules

- Premium tactics should feel like **insider knowledge** — specific spots, specific timings, specific tricks. Generic "play smart" or "use utility well" content doesn't justify $29/mo.
- Cite real callouts. "From Truck spawn" beats "from the road area."
- For `risk` / `reward` fields: be honest. "Long sightline, easy headshot if they prefire" is honest. "No risk, free kill" is bullshit and erodes trust.
- Don't invent strategies that don't work in the current meta. If Aaron's notes describe an outdated tactic (e.g. an operator that's been reworked), flag it.

## What this enables

Every site with a filled `premiumTactics` block automatically renders behind the `ChampionGate` component on the site. Pro and Free users see an upgrade prompt. Champion subscribers see the full tactical detail. No additional wiring needed — the schema doc in `strats.js` and the `<ChampionGate>` wrapper in `StratDisplay.jsx` already handle it.

When done, tell Aaron how many sites have `premiumTactics` filled vs. total — so he knows the Champion tier's real depth at any moment.
