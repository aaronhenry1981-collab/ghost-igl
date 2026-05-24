// Overwatch 2 loadouts — hero pairings, ult combos, counter picks, dive vs
// brawl identification. OW2 has no per-round buy mechanic in 5v5 ranked;
// the "loadout" is your hero pick and the synergy with your team.
//
// Stadium (the 5v5 round-based mode added Season 16) IS economy-driven,
// with a Cash budget per round and a shop offering Powers and Items. The
// `stadium` block below covers round economy, power-selection trees, and
// recommended item paths per hero archetype.

const LOADOUTS = {
  comps: {
    name: 'Hero Compositions',
    role: 'Team comp archetypes',
    summary: 'Pick your comp by looking at the opposing 5. Three core archetypes: dive, brawl, poke. Mismatch = lose.',
    archetypes: {
      dive: {
        name: 'Dive Comp',
        recommended: ['Winston / D.Va (tank)', 'Genji / Tracer (DPS)', 'Sojourn / Pharah (DPS)', 'Mercy / Lúcio (support)', 'Kiriko / Brigitte (support)'],
        plays: 'Coordinated jump on a squishy target. Win one fight, snowball the rest of the team.',
        win_condition: 'Pick off the enemy support before their team can react.',
        weakness: 'CC-heavy comps (Brig, Mei, Cassidy hindering hammer).',
      },
      brawl: {
        name: 'Brawl Comp',
        recommended: ['Reinhardt / Junker Queen / Mauga (tank)', 'Reaper / Bastion / Mei (DPS)', 'Cassidy / Soldier (DPS)', 'Lúcio / Kiriko (support)', 'Brigitte / Ana (support)'],
        plays: 'Group up, push as one ball, win through sustain. Reinhardt charges the front line, supports keep the team alive through chip damage.',
        win_condition: 'Out-sustain the enemy in a closed area (chokes, hallways, points).',
        weakness: 'Long sightlines, Pharmercy, dive picks on supports.',
      },
      poke: {
        name: 'Poke Comp',
        recommended: ['Sigma / Ramattra / Orisa (tank)', 'Hanzo / Widowmaker (DPS)', 'Pharah / Echo (DPS)', 'Ana / Baptiste (support)', 'Zenyatta (support)'],
        plays: 'Long-range chip damage. Force the enemy into a bad fight before commit.',
        win_condition: 'Enemy tank dies first or two squishies fall before fight starts.',
        weakness: 'Dive comps closing the distance; Winston / D.Va into Widowmaker is brutal.',
      },
    },
  },

  ult_priorities: {
    name: 'Ult Tracking',
    role: 'Charge order + combo timing',
    summary: 'Knowing when YOUR team has ults — and when THEIRS does — wins more fights than mechanical aim.',
    combo_chains: [
      {
        name: 'Zarya Grav + DPS Ult',
        chain: 'Zarya Graviton Surge → Hanzo Dragonstrike OR Reaper Death Blossom OR Genji Dragonblade',
        when: 'Both ults available, enemy clustered (around point / payload).',
        result: 'Team wipe — minimum 3 picks.',
      },
      {
        name: 'Nano + Genji Blade',
        chain: 'Ana Nano Boost on Genji + Dragonblade',
        when: 'Genji has clear path to enemy backline.',
        result: '4-5 picks if uncoordinated enemy. Counters: Brigitte stun, Sombra hack.',
      },
      {
        name: 'Anti + Dive',
        chain: 'Ana Biotic Grenade on enemy tank → Winston jump → kill chain',
        when: 'Enemy tank has no Suzu / Immortality up.',
        result: 'Tank dies in 2 seconds — fight over.',
      },
      {
        name: 'Sound Barrier Defense',
        chain: 'Lúcio Sound Barrier when enemy ults pop',
        when: 'Defensive — hear D.Va / Junkrat / Pharah ult voiceline.',
        result: 'Negates 750 damage, your team survives a wipe ult.',
      },
    ],
    track_enemy: [
      'Enemy support ults (Suzu, Immortality, Sound Barrier, Resurrect) FIRST — bait them out before commit.',
      'Track enemy tank ult — Reinhardt Earthshatter, D.Va Self-Destruct, Sigma Gravitic Flux are fight-enders.',
      'Don\'t engage when enemy has 2+ ults you don\'t have answers for.',
    ],
  },

  counters: {
    name: 'Counter Picks',
    role: 'Hard counters by hero',
    summary: 'When you\'re losing fights, switch. OW2 lets you swap mid-match — use it.',
    counter_table: [
      { hero: 'Pharah', counter: 'Soldier 76, Cassidy, Hitscan DPS', why: 'Pharah needs sky time — punish from ground' },
      { hero: 'Reinhardt', counter: 'Bastion, Reaper, Mei, Junker Queen', why: 'Burst damage through shield, anti-armor' },
      { hero: 'Winston', counter: 'Reaper, Brigitte, Bastion', why: 'Reaper out-DPS at close range, Brig stuns dive' },
      { hero: 'Tracer', counter: 'Brigitte, Cassidy, Mei', why: 'Brig hammer outranges blink, Cassidy stun + grenade' },
      { hero: 'Genji', counter: 'Brigitte, Mei, Symmetra', why: 'Brig stun cancels deflect, Mei wall traps blade' },
      { hero: 'Widowmaker', counter: 'Winston, D.Va, Genji, Sombra', why: 'Dive in, kill her, leave' },
      { hero: 'Sombra', counter: 'Moira, Brigitte, Reaper', why: 'AoE damage breaks invis + hack' },
      { hero: 'Ana', counter: 'Genji, Tracer, Winston', why: 'Dive squishy back-line support' },
      { hero: 'Mercy', counter: 'Junkrat, Echo, Pharah', why: 'AoE forces her off pocket' },
    ],
  },

  ability_priorities: {
    name: 'Cooldown Tracking',
    role: 'When to push',
    summary: 'OW2 fights are won on cooldowns, not aim. Track key cooldowns on your team and the enemy.',
    track: [
      { ability: 'Suzu (Kiriko)', cd: '15s', impact: 'Cleanse + immortality — bait it before committing ults.' },
      { ability: 'Immortality Field (Baptiste)', cd: '20s', impact: 'Same — must be destroyed or wait.' },
      { ability: 'Defense Matrix (D.Va)', cd: 'sustained', impact: 'Eats projectile ults. Wait for it down.' },
      { ability: 'Reflect (Genji)', cd: '8s', impact: 'Sends Hanzo arrows back. Wait it out.' },
      { ability: 'Whip Shot (Brigitte)', cd: '6s', impact: 'Stops dive. Bait, then dive.' },
      { ability: 'Sleep Dart (Ana)', cd: '12s', impact: 'Cancels Genji blade, Reinhardt charge — track her cooldown.' },
    ],
  },

  stadium: {
    name: 'Stadium',
    role: 'Round economy + builds for the BO5/BO7 mode',
    summary:
      'Stadium is round-based 5v5 with a per-round Cash budget you spend on hero-specific Powers (4 total chosen across rounds 1/3/5/7) and stat Items (Common/Rare/Epic). Build path matters more than mechanical aim past Diamond — picking the wrong Power chain or stat curve loses rounds even with a 60% win-rate hero.',
    format: {
      length: 'Best of 7 — first team to 4 round wins takes the match. Rounds alternate offense/defense where applicable (Push, Clash). Control variants flip side every round.',
      cash_per_round: 'Win: ~3,500–4,500 Cash. Loss: ~2,500–3,000 Cash (loss bonus prevents snowball). Eliminations and objective contribution add bumps (~100–250 per kill, +500 for round MVP).',
      power_rounds: 'Powers are unlocked at rounds 1, 3, 5, 7 — 4 total per hero. Cannot be undone; picking the wrong Power early can lock you out of synergy.',
      item_shop: 'Open between every round. Items have 3 tiers: Common (1k–2k), Rare (3.5k–5k), Epic (7k–10k). Selling items refunds ~75% of cost minus a small fee.',
      hero_pool: 'Stadium has a curated hero subset (not the full roster) — refreshed each season. Tanks have lower DPS contribution requirements but higher health-multiplier Item value.',
    },
    economy_rules: [
      'NEVER full-spend in round 1. Save 1,000–1,500 Cash to top up after round 2 — round 1 Items don\'t carry the snowball most players think.',
      'Loss bonus is a feature, not punishment. Throwing round 1 to stack Cash for round 2 is rarely correct — the comp difference compounds. Play to win, then buy with the loss bonus.',
      'Buy your Power synergy items BEFORE you unlock the Power. Example: if you\'re going Soldier 76 Anti-Gravity Volley, stack Weapon Power before round 3 so the Power lands at peak DPS.',
      'Don\'t over-stack one stat. Diminishing returns kick in hard past 3 stacked Common items in the same category — switch to Rare/Epic.',
      'Save 2,000+ Cash for the final round if down 2-3 — Epic Items in the last shop can flip a fight even without a Power refresh.',
    ],
    item_categories: [
      {
        name: 'Weapon Power',
        what: '% damage boost on primary fire. Stacks additive (4× common = ~24%, 2× Rare = ~30%, 1× Epic = ~25% + secondary effect).',
        good_for: 'Hitscan DPS (Soldier, Cassidy, Ashe, Sojourn), Tracer, Reaper at close range. Tanks gain less because of hero-tag damage reduction.',
        skip_for: 'Mei, Symmetra, Sym/Mei kits scale better with Ability Power.',
      },
      {
        name: 'Ability Power',
        what: '% damage / healing / utility-effect boost on cooldown abilities. Scales spell-heavy heroes massively.',
        good_for: 'Ana (Biotic Grenade + Nano), Sigma (Hyperspheres + Accretion), Mei (Blizzard + Wall), Junkrat, Symmetra, any hero whose damage is in abilities not the gun.',
        skip_for: 'Soldier, Cassidy, Hitscan-aim-checked DPS — Weapon Power is the better spend.',
      },
      {
        name: 'Armor / Health',
        what: 'Flat HP boost or armor layer. Armor reduces incoming damage by ~30% on shots ≤10 damage (the bullet-armor rule).',
        good_for: 'Tanks (Reinhardt, Mauga, Roadhog), brawl DPS (Reaper, Junker Queen-flex). Armor specifically punishes hitscan because most shots are <10 dmg.',
        skip_for: 'Glass-cannon DPS (Tracer, Genji, Pharah) — your survival is from positioning, not HP.',
      },
      {
        name: 'Cooldown Reduction',
        what: '% off ability cooldowns. Multiplicative with hero base cooldowns.',
        good_for: 'Brigitte (Whip Shot), Ana (Sleep Dart + Nade), Lúcio (boops), any hero whose cooldown IS the value.',
        skip_for: 'Reinhardt, Pharah — main mechanics aren\'t cooldown-gated.',
      },
      {
        name: 'Life Steal',
        what: 'Heal for % of damage dealt. Stacks with healing received.',
        good_for: 'Sustain DPS (Reaper, Mauga, Mei). Lets you 1v1 in unfavorable trades.',
        skip_for: 'Burst DPS — you\'re not in fights long enough to benefit.',
      },
      {
        name: 'Move Speed',
        what: '% boost to base movement. Doesn\'t affect ability movement (Lúcio amp, Genji dash).',
        good_for: 'Flank DPS (Reaper, Sombra), positioning-heavy supports (Lúcio without amp).',
        skip_for: 'Stationary heroes (Bastion, Widowmaker, Junkrat sentry).',
      },
    ],
    archetype_builds: [
      {
        name: 'Reinhardt — Brawl Tank',
        powers: ['Round 1: Charging Rhino (Charge cooldown reduction)', 'Round 3: Steadfast (charge knockback resistance)', 'Round 5: Earthsplitter (Earthshatter AoE expansion)', 'Round 7: Crusader Resurgence (heal on Earthshatter hit)'],
        items: ['R1: Armor x2 Common', 'R2: Cooldown Reduction Rare', 'R3: Armor Epic (Bulwark)', 'R4: Ability Power Rare (Earthshatter scaling)', 'R5: Cooldown Reduction Epic', 'R6: Top up Armor + 1 Move Speed Common'],
        win_condition: 'Survive longer than the enemy tank in a closed fight. Earthsplitter + Resurgence turns Earthshatter into a fight-deciding wipe.',
      },
      {
        name: 'Soldier 76 — Hitscan DPS',
        powers: ['Round 1: Steady Aim (recoil control)', 'Round 3: Anti-Gravity Pulse (helix knockback)', 'Round 5: Stim Sprint (sprint heals)', 'Round 7: Tactical Visor Overload (longer Tac Visor, faster fire rate)'],
        items: ['R1: Weapon Power x2 Common', 'R2: Weapon Power Rare', 'R3: Life Steal Common', 'R4: Cooldown Reduction Rare (Helix)', 'R5: Weapon Power Epic (Crit Bonus)', 'R6: 1 Armor Common'],
        win_condition: 'Out-DPS the enemy DPS in mid-range duels. Tac Visor in round 5+ should win the round outright.',
      },
      {
        name: 'Ana — Spell Support',
        powers: ['Round 1: Eye in the Sky (Biotic Rifle scope speed)', 'Round 3: Nano Boost: Combined Arms (Nano gives Ana damage too)', 'Round 5: Sleep Dart: Lullaby (sleep duration + AoE)', 'Round 7: Mother (Biotic Grenade pulses heal twice)'],
        items: ['R1: Ability Power x2 Common', 'R2: Cooldown Reduction Rare', 'R3: Ability Power Rare', 'R4: Cooldown Reduction Common', 'R5: Ability Power Epic (Nano scaling)', 'R6: 1 Move Speed Common'],
        win_condition: 'Win the support 1v1 by sleep-dart trade. Mother + Combined Arms in round 7 makes you a third DPS while supporting.',
      },
      {
        name: 'Tracer — Dive DPS',
        powers: ['Round 1: Quantum Entanglement (Recall heals)', 'Round 3: Pulse Bomb: Final Blow (Pulse Bomb crits boost cooldown)', 'Round 5: Blink: Slipstream (3rd blink)', 'Round 7: Pulse Maelstrom (Pulse Bomb at half cooldown)'],
        items: ['R1: Weapon Power x2 Common', 'R2: Cooldown Reduction Rare (Blink)', 'R3: Life Steal Common', 'R4: Weapon Power Rare', 'R5: Cooldown Reduction Epic', 'R6: 1 Move Speed Common'],
        win_condition: 'Pick off enemy support twice per round. Slipstream + Pulse Maelstrom turns you into a back-line wipe machine.',
      },
      {
        name: 'D.Va — Anti-Dive Tank',
        powers: ['Round 1: Boostrr (Boosters refresh on kill)', 'Round 3: Defense Matrix: Reformat (DM regen rate)', 'Round 5: Micro Missiles: Resupply (faster cooldown after kill)', 'Round 7: Mech Rage (Self-Destruct armor while charging)'],
        items: ['R1: Armor x2 Common', 'R2: Cooldown Reduction Rare (DM)', 'R3: Armor Rare', 'R4: Weapon Power Common', 'R5: Armor Epic (Bulwark)', 'R6: 1 Cooldown Reduction Common'],
        win_condition: 'Deny enemy DPS by eating their burst with DM. Reformat keeps DM up 70% of the fight by Round 5.',
      },
      {
        name: 'Reaper — Brawl DPS',
        powers: ['Round 1: Soul Globe Generosity (Soul Globes heal more)', 'Round 3: From The Shadows (Wraith damage reduction)', 'Round 5: Death Blossom: Lifeblood (Blossom heals on hit)', 'Round 7: Shadowstep: Phase Lurk (faster Shadow Step + invisibility on arrival)'],
        items: ['R1: Life Steal Common + Weapon Power Common', 'R2: Weapon Power Rare', 'R3: Armor Common', 'R4: Life Steal Rare', 'R5: Weapon Power Epic (Spread reduction)', 'R6: 1 Move Speed Common'],
        win_condition: 'Out-sustain tanks in close range. By round 5+ your Death Blossom is a guaranteed 2-pick + full heal.',
      },
    ],
    common_mistakes: [
      'Picking a Power for raw damage without checking if your Items support the scaling — Anti-Gravity Pulse with no Cooldown Reduction is a 12-second cooldown the whole round.',
      'Over-stacking Common items past round 4 instead of saving for a Rare/Epic. Diminishing returns mean 5 Common = 3.5 Common effective.',
      'Throwing round 1 for loss bonus — the comp/Power lead from a round 1 win is worth more than the 500–1,000 extra Cash.',
      'Tanks buying Weapon Power early. The hero-tag damage reduction makes Weapon Power on tanks the worst stat per dollar — buy Armor/Cooldown first.',
      'Saving Cash for the final round but never spending — you should ALWAYS enter round 7 with ≤1,000 Cash. Unspent Cash doesn\'t carry past the match.',
    ],
    role_priorities: {
      tank: 'Armor > Cooldown Reduction > Ability Power (or Weapon Power for Mauga). Powers should always extend survivability — picking damage-boost powers on tank loses you the round.',
      dps: 'Weapon Power > Life Steal (brawl) or Cooldown Reduction (ability-heavy) > Armor. Pick one damage-vector power and stack toward it.',
      support: 'Ability Power > Cooldown Reduction > Armor. Powers should scale your CC / heal output — supports who pick raw damage powers feed the enemy DPS.',
    },
  },
}

export default LOADOUTS
