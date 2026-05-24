// Centralized Stripe checkout URLs and price IDs.
//
// Why this file exists: payment links were previously hardcoded in 4+
// component files (LandingPage, ProGate, ChampionGate, SoftPaywall). Every
// time the founding-rate window flips, or you swap to a different payment
// link for a promo, you'd have to find and replace all of them and risk
// missing one — which would mean the page shows $9 but Stripe charges $12
// (or worse). Single source of truth here.
//
// HOW TO FLIP TO REGULAR PRICING (currently scheduled for May 31, 2026 —
// extended from the original May 8 launch date):
//   - Set STRIPE_FOUNDING_ACTIVE = false below.
//   - Or override per env via VITE_STRIPE_FOUNDING_ACTIVE in .env.production.
//   - Existing founding subscribers stay locked at their founding rate
//     (Stripe doesn't auto-bump prices on existing subscriptions).
//
// Keep these in sync with:
//   - The webhook Lambda's getPlanFromPrice() — it must recognize all 4 price
//     IDs to map incoming events to the right plan label.
//   - aws/template.yaml stack params (StripePriceIdPro, ...).
//   - The Stripe MCP / dashboard — these are real production IDs.

import { isFoundingOpen } from './founding.js'

// Resolves whether the founding window is currently active. Order of
// precedence:
//   1. Explicit env override (VITE_STRIPE_FOUNDING_ACTIVE=true|false)
//   2. Date-based: founding.js's FOUNDING_END_ISO timestamp.
//
// This means the site auto-flips to regular pricing the moment the founding
// deadline passes — no manual deploy required. Aaron can still force-flip
// early via env var if he wants to end the promo before the deadline.
const FOUNDING_ENV = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_STRIPE_FOUNDING_ACTIVE : null)
export const STRIPE_FOUNDING_ACTIVE =
  FOUNDING_ENV === 'false' ? false :
  FOUNDING_ENV === 'true' ? true :
  isFoundingOpen()

// Founding rates — sold during the founding window (currently through
// May 31, 2026). Subscribers locked at this price for as long as they stay
// subscribed (the marketing promise).
export const PRO_FOUNDING_LINK = 'https://buy.stripe.com/cNi7sM2oGdvSaZ97K27ss0f'
export const PRO_FOUNDING_PRICE_ID = 'price_1TPtOKJNddvjgWcg47I16AQp'
export const PRO_FOUNDING_AMOUNT = 9 // dollars

export const CHAMPION_FOUNDING_LINK = 'https://buy.stripe.com/3cIfZibZgezWd7h9Sa7ss0d'
export const CHAMPION_FOUNDING_PRICE_ID = 'price_1TLEtsJNddvjgWcgYcmiNmW7'
export const CHAMPION_FOUNDING_AMOUNT = 29

// Regular rates — flip to these after the founding window for new sign-ups.
// The Champion regular ($39) doesn't have a payment link yet; create one
// in Stripe before flipping STRIPE_FOUNDING_ACTIVE off.
export const PRO_REGULAR_LINK = 'https://buy.stripe.com/00w00k5ASezWaZ94xQ7ss0c'
export const PRO_REGULAR_PRICE_ID = 'price_1TLEtrJNddvjgWcg9iTWJoLS'
export const PRO_REGULAR_AMOUNT = 12

export const CHAMPION_REGULAR_LINK = 'https://buy.stripe.com/14AcN61kCbnK3wH1lE7ss0h' // $39 Champion regular — created 2026-05-09, plink_1TVMeeJNddvjgWcgEFTWe8uz
export const CHAMPION_REGULAR_PRICE_ID = 'price_1TPtOYJNddvjgWcgfEWjzGnp'
export const CHAMPION_REGULAR_AMOUNT = 39

// Resolved at runtime based on STRIPE_FOUNDING_ACTIVE — what the site should
// link visitors to today.
export const PRO_CHECKOUT_LINK = STRIPE_FOUNDING_ACTIVE ? PRO_FOUNDING_LINK : PRO_REGULAR_LINK
export const CHAMPION_CHECKOUT_LINK = STRIPE_FOUNDING_ACTIVE ? CHAMPION_FOUNDING_LINK : CHAMPION_REGULAR_LINK
export const PRO_CURRENT_AMOUNT = STRIPE_FOUNDING_ACTIVE ? PRO_FOUNDING_AMOUNT : PRO_REGULAR_AMOUNT
export const CHAMPION_CURRENT_AMOUNT = STRIPE_FOUNDING_ACTIVE ? CHAMPION_FOUNDING_AMOUNT : CHAMPION_REGULAR_AMOUNT

// All-Access tier — covers all 10 supported FPS games (R6 today, CS2/Val/etc
// rolling out as data is generated). Higher willingness-to-pay since most
// players play 2+ games. ~2.1× ARPU vs single-game tier.
//
// Created 2026-05-10 via Stripe MCP. Founding pricing locked in for life
// of subscription (same promise as single-game tiers).
export const PRO_ALL_ACCESS_LINK = 'https://buy.stripe.com/00w4gAfbsbnK7MXfcu7ss0i'
export const PRO_ALL_ACCESS_PRICE_ID = 'price_1TVUcxJNddvjgWcgBImnUKZe'
export const PRO_ALL_ACCESS_AMOUNT = 19 // dollars/mo

export const PRO_ALL_ACCESS_ANNUAL_LINK = 'https://buy.stripe.com/aFa8wQe7o9fC6IT4xQ7ss0k'
export const PRO_ALL_ACCESS_ANNUAL_PRICE_ID = 'price_1TVUd3JNddvjgWcgShz9Ndg5'
export const PRO_ALL_ACCESS_ANNUAL_AMOUNT = 190 // saves $38 vs monthly

export const CHAMPION_ALL_ACCESS_LINK = 'https://buy.stripe.com/eVq7sM8N4crO9V55BU7ss0j'
export const CHAMPION_ALL_ACCESS_PRICE_ID = 'price_1TVUd0JNddvjgWcgIPWakA3S'
export const CHAMPION_ALL_ACCESS_AMOUNT = 49

export const CHAMPION_ALL_ACCESS_ANNUAL_LINK = 'https://buy.stripe.com/00waEY0gycrO0kv8O67ss0l'
export const CHAMPION_ALL_ACCESS_ANNUAL_PRICE_ID = 'price_1TVUd6JNddvjgWcgc3csHICD'
export const CHAMPION_ALL_ACCESS_ANNUAL_AMOUNT = 490 // saves $98 vs monthly

// Convenience helper for components — what's the current best link to
// upsell a non-paying user to a given tier.
export function checkoutLinkFor(tier) {
  if (tier === 'champion') return CHAMPION_CHECKOUT_LINK
  if (tier === 'pro-all') return PRO_ALL_ACCESS_LINK
  if (tier === 'champion-all') return CHAMPION_ALL_ACCESS_LINK
  return PRO_CHECKOUT_LINK
}
