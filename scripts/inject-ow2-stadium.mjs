// One-shot script — adds Stadium-mode content to the OW2 VOD Lambda context
// so the VOD Lambda can recognize Stadium screenshots and give Stadium-
// specific coaching (build paths, economy, Power picks). Run with `node`
// from the repo root.

import { readFileSync, writeFileSync, statSync } from 'node:fs'

const PATH = 'lambda/vod/ow2-context.json'
const c = JSON.parse(readFileSync(PATH, 'utf8'))

// Update tagline + modes
c.game_meta.tagline =
  '5v5 team-based hero shooter. Standard ranked = point capture / escort / control / push / flashpoint / clash with role queue (1 Tank / 2 DPS / 2 Support). Stadium = BO5/BO7 round-based mode with per-round Cash economy, hero-specific Powers (4 unlocked R1/R3/R5/R7), and Common/Rare/Epic Items shop between rounds.'

c.game_meta.modes = c.game_meta.modes || {}
c.game_meta.modes.ranked_5v5 =
  'Standard role-queue 5v5. BO3/BO5 maps, 2 rounds per map (attack+defense). No respawn fees, no shop, no Powers — pure hero pick + comp execution.'
c.game_meta.modes.stadium =
  'Round-based 5v5 with economy. First team to 4 round wins in BO7. Each round you spend Cash (won via round outcome + kills + objective time) on hero-specific Powers (4 per match, unlocked at R1/R3/R5/R7 — permanent once picked) and stat Items (Common / Rare / Epic). Curated hero pool (subset of full roster, refreshed seasonally). Toggleable first/third-person camera.'

// Stadium-specific coaching block — the VOD Lambda will surface this when a
// Stadium screenshot is detected, regardless of which Stadium map.
c.stadium_mode = {
  detect_cues: [
    'Cash counter visible in HUD (top-left or scoreboard area)',
    'Round X of 7 indicator (not round 1 of 2)',
    'Power-pick screen between rounds (4 cards displayed)',
    'Item shop UI between rounds (Common / Rare / Epic tiered)',
    'Round-result splash showing Cash earned + breakdown',
    'Third-person rear-shoulder camera (Stadium-exclusive option)',
    'Build / Loadout panel in spawn showing equipped Powers and Items',
    'Limited hero pool in hero-select (~40 heroes, not full ~45+ roster)',
  ],
  round_economy: {
    win_cash:
      'Round win pays ~3,500–4,500 Cash (scales with match length + individual contribution)',
    loss_cash:
      'Round loss pays ~2,500–3,000 Cash (loss bonus is intentional anti-snowball)',
    bonuses:
      'Eliminations ~100–250 each, objective time ~10/sec, Round MVP +500, assists ~50 each',
    spend_window:
      'Item shop open ~30s between rounds. Powers picked at end of rounds 1, 3, 5, 7.',
  },
  power_progression:
    'R1 Power = baseline (kit enhancement). R3 = synergy multiplier. R5 = situational counter. R7 = win-condition. Once locked, Powers cannot be swapped — wrong R1 pick compounds through R7.',
  item_categories: {
    weapon_power:
      'Percent boost to primary-fire damage. Best for hitscan DPS (Soldier, Cassidy, Ashe, Sojourn). Weak on tanks due to hero-tag damage reduction.',
    ability_power:
      'Percent boost to ability damage / heal / utility. Best for ability-driven heroes (Ana, Sigma, Mei, Junkrat, Symmetra).',
    armor_health:
      'Flat HP or armor layer. Armor reduces incoming damage 30% on shots <=10 dmg. Best for tanks and brawl DPS.',
    cooldown_reduction:
      'Percent off ability cooldowns. Best for cooldown-driven heroes (Brigitte, Ana, Lúcio).',
    life_steal:
      'Heal for percent of damage dealt. Best for sustain DPS (Reaper, Mauga, Mei).',
    move_speed:
      'Base movement boost. Best for flank DPS (Reaper, Sombra) and mobile supports.',
  },
  coaching_signals: [
    'Cash <=500 mid-round means the player overspent and is locked into the current build.',
    'R1 Power that does not match the Item stack (e.g. damage Power but no Weapon Power items) = wasted synergy — call it out.',
    'Tank with stacked Weapon Power items = misallocated. Tanks should prioritize Armor + Cooldown.',
    'Round 5+ with no Epic items = either threw rounds (low Cash) or hoarded — both lose late game.',
    'Third-person camera reveals positioning that first-person hides. Read crosshair as best-effort, not literal aim.',
  ],
  common_mistakes: [
    'Picking the highest-damage R1 Power without checking if the hero scales with affordable items.',
    'Buying 4–5 Common items past Round 3 instead of saving for a Rare. Diminishing returns hit hard past 3 stacks of one stat.',
    'Tanks buying Weapon Power. Hero-tag DR makes it the worst dollar spend per round.',
    'Saving Cash for Round 7 then leaving 2,000+ unspent. Unspent Cash is forfeited at match end.',
    'Throwing Round 1 intentionally for loss bonus. Comp + Power lead from a R1 win outweighs ~1,000 Cash.',
  ],
  role_priorities: {
    tank:
      'Armor > Cooldown Reduction > Ability Power (or Weapon Power for Mauga only). Powers should always extend survivability.',
    dps:
      'Weapon Power > Life Steal (brawl) OR Cooldown Reduction (ability-heavy) > Armor. Pick one damage vector, stack toward it.',
    support:
      'Ability Power > Cooldown Reduction > Armor. Pick CC/heal-scaling Powers, not raw-damage Powers.',
  },
}

// Add Stadium map entries to the catalog so the model can detect map+mode
// together and reference the right physical geometry.
const stadiumMaps = {
  stadium_hanaoka_clash: {
    name: 'Stadium — Hanaoka (Clash)',
    mode: 'stadium-clash',
    notes:
      'Reduced-size Clash variant. 3 banks (mid + 2 sides). Cash economy + Power picks. BO7 format.',
  },
  stadium_throne_of_anubis_clash: {
    name: 'Stadium — Throne of Anubis (Clash)',
    mode: 'stadium-clash',
    notes:
      'Sand-floor sightlines favor hitscan DPS — Ashe/Soldier with stacked Weapon Power dominate.',
  },
  stadium_busan_control: {
    name: 'Stadium — Busan Downtown (Control)',
    mode: 'stadium-control',
    notes:
      'Sub-point only. Closed-corner geometry favors brawl + Armor stacking.',
  },
  stadium_nepal_control: {
    name: 'Stadium — Nepal Sanctum (Control)',
    mode: 'stadium-control',
    notes:
      'Catwalk high-ground play is decisive. D.Va / Pharah / Sojourn with Move Speed items dominate rooftop.',
  },
  stadium_antarctic_control: {
    name: 'Stadium — Antarctic Peninsula (Control)',
    mode: 'stadium-control',
    notes:
      'Icebreaker sub-point. Long sightlines + bridge high-ground. Hitscan + aerial picks win the air.',
  },
  stadium_ilios_control: {
    name: 'Stadium — Ilios Lighthouse (Control)',
    mode: 'stadium-control',
    notes:
      'Well environmental kills matter. Lúcio + Doomfist boops + knockback items extend value.',
  },
  stadium_oasis_control: {
    name: 'Stadium — Oasis City Center (Control)',
    mode: 'stadium-control',
    notes:
      'Cars/rooftop verticality. Brawl + Hitscan both viable — pick the hero with the best R5+ Power.',
  },
  stadium_samoa_control: {
    name: 'Stadium — Samoa Downtown (Control)',
    mode: 'stadium-control',
    notes:
      'Temple high ground is the win condition. Aim items to secure it for your DPS.',
  },
  stadium_colosseo_push: {
    name: 'Stadium — Colosseo (Push)',
    mode: 'stadium-push',
    notes:
      'One robot, contested mid. Brawl + Armor wins the choke.',
  },
  stadium_esperanca_push: {
    name: 'Stadium — Esperança (Push)',
    mode: 'stadium-push',
    notes:
      'Plaza long sightlines feed hitscan. Ana / Soldier / Sojourn with Ability/Weapon Power dominate.',
  },
  stadium_runasapi_push: {
    name: 'Stadium — Runasapi (Push)',
    mode: 'stadium-push',
    notes:
      'Stadium-first Push map. Multi-level fighting around the robot. Verticality + mobility items pay off.',
  },
}
Object.assign(c.maps, stadiumMaps)

c.generated_at = new Date().toISOString()
writeFileSync(PATH, JSON.stringify(c, null, 2))
console.log(`Updated ${PATH} — added Stadium content. Size: ${statSync(PATH).size} bytes`)
