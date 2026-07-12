// Single source of truth for the R6 ranked ladder — Ranked 3.0 (live
// 2026-06-02), current as of July 2026.
//
// 40 ranks: 8 tiers × 5 divisions. Divisions run V (lowest) → I (highest).
// Champion got divisions in Ranked 3.0 — they're included. Tier order matters:
// Emerald sits between Platinum and Diamond.
//
// EVERYTHING rank-related imports this (the /coaching selectors, /climb, any
// copy). Never hardcode a rank list again — that's how divisions got dropped
// twice. This file is plain data (no JSX) so the static page generator
// (scripts/generate-coaching-page.mjs) can import it too.

export const TIERS = ['Copper', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Champion']

// Divisions, lowest → highest. In R6, V is the lowest division and I the
// highest, so a player climbs V → IV → III → II → I within a tier.
const DIVISIONS = [5, 4, 3, 2, 1]
const ROMAN = { 5: 'V', 4: 'IV', 3: 'III', 2: 'II', 1: 'I' }

// Flattened ladder, lowest → highest. `order` is a global 1..40 rank index so
// two ranks can be compared and a climb "gap" measured with plain subtraction.
export const RANKS = TIERS.flatMap((tier, ti) =>
  DIVISIONS.map((div, di) => ({
    tier,
    div,                                   // 5=V (lowest) … 1=I (highest)
    label: `${tier} ${ROMAN[div]}`,        // e.g. "Silver IV"
    order: ti * DIVISIONS.length + di + 1, // Copper V = 1 … Champion I = 40
  }))
)

export const rankByOrder = (order) => RANKS.find((r) => r.order === order) || null
export const rankByLabel = (label) => RANKS.find((r) => r.label === label) || null

// The lowest rank of a tier — handy for tier-level gates that don't care about
// division (e.g. "Platinum+"): tierFloor('Platinum').order.
export const tierFloor = (tier) => RANKS.find((r) => r.tier === tier) || null
