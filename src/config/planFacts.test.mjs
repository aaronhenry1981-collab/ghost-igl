import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { FREE_MAPS, MAP_COUNT, PLAN_FACTS } from './planFacts.js'

const vodLambda = readFileSync(new URL('../../lambda/vod/index.mjs', import.meta.url), 'utf8')

function lambdaDefault(name) {
  const match = vodLambda.match(new RegExp(`const ${name} = parseInt\\(process\\.env\\.${name} \\|\\| '(\\d+)'`))
  assert.ok(match, `${name} not found in lambda/vod/index.mjs`)
  return Number(match[1])
}

function lambdaConstant(name) {
  const match = vodLambda.match(new RegExp(`const ${name} = (\\d+)`))
  assert.ok(match, `${name} not found in lambda/vod/index.mjs`)
  return Number(match[1])
}

test('AI review allowances match what the VOD Lambda enforces', () => {
  assert.equal(PLAN_FACTS.pro.aiReviewsPerMonth, lambdaDefault('VOD_PRO_LIMIT'))
  assert.equal(PLAN_FACTS.elite.aiReviewsPerMonth, lambdaDefault('VOD_ELITE_LIMIT'))
  assert.equal(PLAN_FACTS.champion.aiReviewsPerMonth, lambdaDefault('VOD_CHAMPION_LIMIT'))
})

test('screenshots per review match the VOD Lambda caps', () => {
  assert.equal(PLAN_FACTS.pro.screenshotsPerReview, lambdaConstant('PRO_MAX_IMAGES'))
  assert.equal(PLAN_FACTS.elite.screenshotsPerReview, lambdaConstant('ELITE_MAX_IMAGES'))
  assert.equal(PLAN_FACTS.champion.screenshotsPerReview, lambdaConstant('ELITE_MAX_IMAGES'))
})

test('prices and plan names come from the shared config', () => {
  assert.deepEqual(
    Object.values(PLAN_FACTS).map((plan) => [plan.label, plan.monthlyUsd]),
    [['Basic', 0], ['Pro', 12], ['Elite', 39], ['Champion', 70]],
  )
})

test('the free maps are the freeSample maps', () => {
  assert.deepEqual(FREE_MAPS.map((map) => map.id), ['bank', 'coastline'])
  assert.equal(MAP_COUNT, 25)
})
