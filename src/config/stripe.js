// Centralized Stripe price IDs and display amounts.
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
//   - The webhook Lambda's getPlanFromPrice() — it must recognize every legacy
//     and current price ID to map incoming events to the right plan label.
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
// 30-DAY FREE TRIAL links (created 2026-07-11, plink_1Ts6U8 / plink_1Ts6UJ):
// card up front (payment_method_collection: always), trial_period_days: 30, then
// auto-bills the founding rate. Same founding PRICE, so the price-locked-for-life
// promise is unchanged. Old no-trial links kept for rollback:
//   Pro:      https://buy.stripe.com/cNi7sM2oGdvSaZ97K27ss0f
//   Champion: https://buy.stripe.com/3cIfZibZgezWd7h9Sa7ss0d
export const PRO_FOUNDING_PRICE_ID = 'price_1TPtOKJNddvjgWcg47I16AQp'
export const PRO_FOUNDING_AMOUNT = 9 // dollars

// The former Champion digital tier is now Elite. Existing $29 subscribers
// remain locked at $29 and keep every digital entitlement they bought. The
// public Elite offer uses the regular $39 price; the $29 link is retained only
// for account reconciliation and rollback, never for new sales.
export const ELITE_LEGACY_FOUNDING_PRICE_ID = 'price_1TLEtsJNddvjgWcgYcmiNmW7'
export const ELITE_LEGACY_FOUNDING_AMOUNT = 29

// Regular rates — flip to these after the founding window for new sign-ups.
// New public Elite uses the former $39 digital-tier price. New Champion is
// a separate $70 high-touch membership so coaching credits and access match.
export const PRO_REGULAR_PRICE_ID = 'price_1TLEtrJNddvjgWcg9iTWJoLS'
export const PRO_REGULAR_AMOUNT = 12

export const ELITE_REGULAR_PRICE_ID = 'price_1TPtOYJNddvjgWcgfEWjzGnp'
export const ELITE_CURRENT_AMOUNT = 39

// New Champion is the high-touch membership: everything in Elite plus two
// live coaching sessions each billing cycle. The environment override lets a
// tested Stripe Payment Link be staged without hardcoding it into an older
// build. The fallback keeps visitors on the coaching page until that link is
// present, so nobody can reach a mismatched checkout.
export const CHAMPION_MEMBERSHIP_PRICE_ID = import.meta.env?.VITE_CHAMPION_MEMBERSHIP_PRICE_ID || 'price_1TzrjiJNddvjgWcgw1DYSf88'
export const CHAMPION_CURRENT_AMOUNT = 70

// Resolved at runtime based on STRIPE_FOUNDING_ACTIVE — what the site should
// link visitors to today.
// Lock Stripe checkout to the SAME email as the signed-in account. Subscriptions
// link to a login purely by email, so a user paying with a different address
// than they signed up with silently orphans themselves — they get billed and
// get nothing. Prefilling removes the chance to typo or use another inbox.

export const PRO_CURRENT_AMOUNT = STRIPE_FOUNDING_ACTIVE ? PRO_FOUNDING_AMOUNT : PRO_REGULAR_AMOUNT

// All-Access tier — covers all 10 supported FPS games (R6 today, CS2/Val/etc
// rolling out as data is generated). Higher willingness-to-pay since most
// players play 2+ games. ~2.1× ARPU vs single-game tier.
//
// Created 2026-05-10 via Stripe MCP. Founding pricing locked in for life
// of subscription (same promise as single-game tiers).
export const PRO_ALL_ACCESS_PRICE_ID = 'price_1TVUcxJNddvjgWcgBImnUKZe'
export const PRO_ALL_ACCESS_AMOUNT = 19 // dollars/mo

export const PRO_ALL_ACCESS_ANNUAL_PRICE_ID = 'price_1TVUd3JNddvjgWcgShz9Ndg5'
export const PRO_ALL_ACCESS_ANNUAL_AMOUNT = 190 // saves $38 vs monthly

export const CHAMPION_ALL_ACCESS_PRICE_ID = 'price_1TVUd0JNddvjgWcgIPWakA3S'
export const CHAMPION_ALL_ACCESS_AMOUNT = 49

export const CHAMPION_ALL_ACCESS_ANNUAL_PRICE_ID = 'price_1TVUd6JNddvjgWcgc3csHICD'
export const CHAMPION_ALL_ACCESS_ANNUAL_AMOUNT = 490 // saves $98 vs monthly

// ---- Coaching (one-time paid sessions, NOT subscriptions) --------------------
// Product "RECON6 Coaching" (prod_Us9Aa8zlWWiHjM) on the shared IFD live
// account, created 2026-07-12 via Stripe MCP. All three are ONE-TIME prices
// (Checkout mode:'payment'), never recurring. The booking Lambda creates the
// Checkout Session; the webhook confirms the held slot on
// checkout.session.completed (keyed off metadata.slotId). The $20 intro is
// enforced first-session-only SERVER-SIDE — never trust the client.
// Reconciled model (2026-07-12): $20 one-time intro + $70/mo add-on (2 session
// credits/mo, reset monthly, no rollover). "Academy" = Champion + add-on = $99
// (marketing label, not a SKU). The old à-la-carte single-session and multi-session package
// prices were archived — one model, no mismatch.
export const COACHING_PRODUCT_ID = 'prod_Us9Aa8zlWWiHjM'
export const COACHING_INTRO_PRICE_ID = 'price_1TsOskJNddvjgWcgOPhkaqnK'  // $20 intro, one-time, first-timers only (50% off the single)
export const COACHING_SINGLE_PRICE_ID = 'price_1TsOsaJNddvjgWcgmalTAfcn' // $40 single session, one-time — the anchor the intro is 50% off, and the no-subscription option
export const COACHING_ADDON_PRICE_ID = 'price_1TsZtQJNddvjgWcgwPKVEYQm'  // $70/mo recurring, grants 2 credits/month
export const COACHING_AMOUNTS = { intro: 20, single: 40, addon: 70, academy: 99 } // dollars, for copy

// Prepaid usage add-on. The authenticated backend creates Checkout sessions
// so it can attach the account email and an idempotent credit-grant marker.
// No client ever receives a Stripe secret, and no overage is automatic.
export const AI_USAGE_PACK_AMOUNT = 10
export const AI_USAGE_PACK_CREDITS = 100

// Siege Starter Field Workbook — one-time digital product. Checkout sessions
// are created by the authenticated backend so purchase identity and private
// delivery stay tied to the signed-in Recon 6 account.
export const WORKBOOK_PRODUCT_ID = 'prod_V84uw1PNvl0qTD'
export const WORKBOOK_PRICE_ID = 'price_1U7okSJNddvjgWcgyomwEAa2'
export const WORKBOOK_AMOUNT = 14.99

// Convenience helper for components — what's the current best link to
// upsell a non-paying user to a given tier.
