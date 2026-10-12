import test from 'node:test'
import assert from 'node:assert/strict'
import MAPS from '../../../src/data/maps.js'
import PUBLIC_STRATS from '../../../src/data/public-strats.generated.js'
import { buildFacts } from './facts.mjs'
import { deriveMission } from './mission.mjs'
import { deriveActivation } from './activation.mjs'
import { firstRoundPlanCta } from './firstRoundPlan.mjs'

test('Basic first-plan action resolves to existing free map, site and defense content', () => {
  const [, prefix, mapId, siteId, side] = firstRoundPlanCta('free').to.split('/')
  assert.equal(prefix, 'strats')
  const map = MAPS.find(item => item.id === mapId)
  assert.equal(map.freeSample, true)
  assert.ok(!map.comingSoon && !map.championOnly)
  assert.ok(map.sites.some(site => site.id === siteId))
  const plan = PUBLIC_STRATS[mapId]?.[siteId]?.[side]
  assert.ok(plan?.strategy && plan?.operators?.length, 'the destination contains real public strategy and operator jobs')
})

test('profile-complete Basic player gets matching direct actions without completing activation', () => {
  const facts = buildFacts({ now: Date.parse('2026-10-12T08:00:00Z'), identity: { signedIn: true }, sources: {
    me: { status: 'ok', data: { plan: 'free', profile_complete: true, profile: { display_name: 'ExampleAnchor', platform: 'pc' } } },
  } })
  facts.activity.strategy.total = 0
  facts.activity.usageEvidence = 'this_device'
  const mission = deriveMission(facts)
  const step = deriveActivation(facts).steps.find(item => item.id === 'round_plan')
  assert.equal(mission.id, 'first_round_plan')
  assert.deepEqual(mission.cta, step.cta)
  assert.equal(step.done, false)
  assert.equal(facts.activity.strategy.total, 0)
})

test('paid users retain their catalog choice and partial evidence never claims a missing first plan', () => {
  for (const plan of ['pro', 'champion']) assert.equal(firstRoundPlanCta(plan).to, '/strats')
  const facts = buildFacts({ identity: { signedIn: true }, sources: {} })
  facts.account.profileComplete = true
  facts.activity.strategy.total = 0
  facts.activity.usageEvidence = 'partial'
  assert.notEqual(deriveMission(facts).id, 'first_round_plan')
  assert.equal(deriveActivation(facts).steps.find(item => item.id === 'round_plan').done, null)
})
