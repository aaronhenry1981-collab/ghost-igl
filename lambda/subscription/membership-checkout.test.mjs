import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_FOUNDING_END_ISO,
  membershipIdempotencyKey,
  membershipIntegrationIdentifier,
  resolveMembershipOffer,
} from './membership-checkout.mjs'

test('Pro preserves the founding price and 30-day card-up-front trial before the deadline', () => {
  const offer = resolveMembershipOffer('pro', Date.parse(DEFAULT_FOUNDING_END_ISO) - 1)
  assert.equal(offer.priceId, 'price_1TPtOKJNddvjgWcg47I16AQp')
  assert.equal(offer.trialDays, 30)
  assert.equal(offer.founding, true)
})

test('Pro switches new buyers to the regular price after the deadline', () => {
  const offer = resolveMembershipOffer('pro', Date.parse(DEFAULT_FOUNDING_END_ISO) + 1)
  assert.equal(offer.priceId, 'price_1TLEtrJNddvjgWcg9iTWJoLS')
  assert.equal(offer.trialDays, 30)
  assert.equal(offer.founding, false)
})

test('Elite and Champion do not receive a trial', () => {
  assert.equal(resolveMembershipOffer('elite').trialDays, 0)
  assert.equal(resolveMembershipOffer('champion').trialDays, 0)
  assert.equal(resolveMembershipOffer('unknown'), null)
})

test('integration identifier has Stripe-required eight-letter suffix', () => {
  const id = membershipIntegrationIdentifier(() => Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7]))
  assert.match(id, /^recon6_membership_[a-z]{8}$/)
})

test('double clicks share one five-minute idempotency key', () => {
  const first = membershipIdempotencyKey('sub-123', 'pro', 1_800_000)
  const retry = membershipIdempotencyKey('sub-123', 'pro', 1_800_001)
  const otherTier = membershipIdempotencyKey('sub-123', 'elite', 1_800_001)
  assert.equal(first, retry)
  assert.notEqual(first, otherTier)
})
