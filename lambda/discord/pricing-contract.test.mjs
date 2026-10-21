import test from 'node:test'
import assert from 'node:assert/strict'
import { pricingResponse } from './index.mjs'
import { PLAN_FACTS } from '../../src/config/planFacts.js'

test('Discord Elite pricing states the shipped review allowance without promising more live usage', () => {
  const elite = pricingResponse().split('\n').find(line => line.startsWith('**Elite**'))
  const facts = PLAN_FACTS.elite
  assert.ok(elite.includes(`$${facts.monthlyUsd}/mo`))
  assert.ok(elite.includes(`${facts.aiReviewsPerMonth} VOD reviews`))
  assert.ok(elite.includes(`up to ${facts.screenshotsPerReview} screenshots per review`))
  assert.doesNotMatch(elite, /higher live usage|unlimited|24\/7|continuous/i)
})
