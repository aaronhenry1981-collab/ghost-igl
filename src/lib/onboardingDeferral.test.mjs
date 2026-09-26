import test from 'node:test'
import assert from 'node:assert/strict'

import { deferOnboardingUntilAfterPlan, onboardingDeferredHere } from './onboardingDeferral.js'

function memoryStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  }
}

test('onboarding is untouched for visitors who did not come through /start', () => {
  assert.equal(onboardingDeferredHere('/strats/bank/ceo/attack', memoryStorage()), false)
})

test('after a /start CTA, onboarding waits on the plan and on /auth, then resumes elsewhere', () => {
  const storage = memoryStorage()
  deferOnboardingUntilAfterPlan(storage)
  assert.equal(onboardingDeferredHere('/auth', storage), true)
  assert.equal(onboardingDeferredHere('/strats/bank/ceo/attack', storage), true)
  assert.equal(onboardingDeferredHere('/dashboard', storage), false)
  assert.equal(onboardingDeferredHere('/strats/coastline/blue-bar/defense', storage), true)
})
