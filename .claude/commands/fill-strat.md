---
description: Convert rough strat notes into a properly-formatted strats.js entry. Args:&nbsp;<map-id> <site-id> <side>
---

You're helping Aaron rapidly fill content gaps in `src/data/strats.js` for Ghost IGL. The user invoked this command with arguments: $ARGUMENTS

Parse the arguments as `<map-id> <site-id> <side>` (e.g. `bank ceo defense`). If any are missing, ask the user to supply them before continuing.

## Workflow

1. **Verify the map and site exist.** Read `src/data/maps.js` and confirm the `mapId` is present and the `siteId` is one of that map's sites. If not, list the valid options and stop.
2. **Check what already exists.** Read `src/data/strats.js` and find `STRATS[<mapId>]?.[<siteId>]?.[<side>]`. If a strat already exists for this map/site/side, show it and ask Aaron to confirm whether he wants to **replace** or **abandon** the command.
3. **Ask Aaron for his rough notes.** Prompt him to dictate or paste freeform notes covering:
   - Operators he'd run (5 operators: which are essential, recommended, flex)
   - The high-level strategy / win condition
   - Key callouts (room/area names attackers and defenders use)
   - Utility usage notes (which gadgets where, why)
4. **Format the entry.** Convert his notes into the canonical schema:
   ```js
   {
     operators: [
       { name: 'Thermite', role: 'Hard Breach', priority: 'essential' },
       { name: 'Thatcher', role: 'Support', priority: 'essential' },
       { name: 'Sledge', role: 'Vertical Play', priority: 'recommended' },
       { name: 'Nomad', role: 'Flank Watch', priority: 'recommended' },
       { name: 'Iana', role: 'Intel / Entry', priority: 'flex' },
     ],
     strategy: 'Single paragraph, 2-4 sentences, R6 vocabulary.',
     callouts: ['CEO', 'Executive Lounge', 'Janitor', 'Skylight', 'Server', 'Spiral Stairs', 'Front Door'],
     utility: [
       'Thermite: 2 charges on CEO reinforced wall',
       'Thatcher: EMP CEO wall to clear Bandit/Kaid tricking',
       // ...
     ],
   }
   ```
5. **Show Aaron the formatted entry.** Display it as a code block so he can review.
6. **Edit the file.** When he confirms, use the Edit tool to insert the entry into `src/data/strats.js` at the correct nested location:
   `STRATS.<mapId>.<siteId>.<side> = { ... }`
7. **Verify.** Run `npm run build` to confirm the entry parses cleanly. If the build fails, show the error and offer to revert.

## Voice/format rules

- **5 operators per side.** Always 2 essential + 2 recommended + 1 flex. If Aaron gives fewer, ask follow-up questions to fill the lineup.
- **Strategy paragraph:** R6 vocabulary (anchor, roam, hard breach, soft breach, ADS, drone, runout, intel, frag). 2-4 sentences. No marketing fluff.
- **Callouts:** real callout names from the actual map. Don't invent names.
- **Utility list:** prefix each line with the operator name + colon. Be specific about placement ("on CEO reinforced wall," not "near CEO").
- **JSON formatting:** match the existing file's style exactly — 6-space indent inside operators array, single quotes for strings, trailing commas where the existing code has them.

## Common pitfalls to flag

- If Aaron's strategy contradicts his operator picks (e.g. picks Thermite but the strategy is all soft breach), point it out.
- If the callouts list is missing critical rooms (entry points, plant spots), prompt for them.
- If utility doesn't account for what each operator brings (Thermite has charges, Thatcher has EMPs, etc.), prompt.

When done, tell Aaron how many sites are still empty so he knows what's left.
