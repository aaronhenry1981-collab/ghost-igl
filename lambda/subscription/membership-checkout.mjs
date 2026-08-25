import crypto from 'node:crypto'

export const DEFAULT_FOUNDING_END_ISO = '2026-08-31T23:59:59-07:00'

const DEFAULT_PRICES = {
  pro_founding: 'price_1TPtOKJNddvjgWcg47I16AQp',
  pro_regular: 'price_1TLEtrJNddvjgWcg9iTWJoLS',
  elite: 'price_1TPtOYJNddvjgWcgfEWjzGnp',
  champion: 'price_1TzrjiJNddvjgWcgw1DYSf88',
}

export function resolveMembershipOffer(tier, nowMs = Date.now(), env = process.env) {
  const normalizedTier = String(tier || '').trim().toLowerCase()
  const foundingEnd = Date.parse(env.FOUNDING_END_ISO || DEFAULT_FOUNDING_END_ISO)
  const foundingOpen = Number.isFinite(foundingEnd) && nowMs < foundingEnd

  if (normalizedTier === 'pro') {
    return {
      tier: 'pro',
      priceId: foundingOpen
        ? (env.STRIPE_PRO_FOUNDING_PRICE_ID || DEFAULT_PRICES.pro_founding)
        : (env.STRIPE_PRO_PRICE_ID || DEFAULT_PRICES.pro_regular),
      trialDays: 30,
      founding: foundingOpen,
    }
  }
  if (normalizedTier === 'elite') {
    return {
      tier: 'elite',
      priceId: env.STRIPE_ELITE_PRICE_ID || env.STRIPE_CHAMPION_REGULAR_PRICE_ID || DEFAULT_PRICES.elite,
      trialDays: 0,
      founding: false,
    }
  }
  if (normalizedTier === 'champion') {
    return {
      tier: 'champion',
      priceId: env.STRIPE_CHAMPION_MEMBERSHIP_PRICE_ID || DEFAULT_PRICES.champion,
      trialDays: 0,
      founding: false,
    }
  }
  return null
}

export function membershipIntegrationIdentifier(randomBytes = crypto.randomBytes) {
  const letters = Array.from(randomBytes(8), (byte) => String.fromCharCode(97 + (byte % 26))).join('')
  return `recon6_membership_${letters}`
}

export function membershipIdempotencyKey(subject, tier, nowMs = Date.now()) {
  const fiveMinuteBucket = Math.floor(nowMs / 300000)
  return crypto.createHash('sha256').update(`recon6-membership:${subject}:${tier}:${fiveMinuteBucket}`).digest('hex')
}
