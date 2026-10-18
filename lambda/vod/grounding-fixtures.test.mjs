import test from 'node:test'
import assert from 'node:assert/strict'
import { groundedStill, context } from './fixtures/coastline-still.mjs'
import { validateAnalysis } from './coach-contract.mjs'
import { validateGrounding } from './grounding.mjs'

test('realistic approved-frame fixture passes both structural and grounding validation', () => {
  assert.deepEqual(validateAnalysis(groundedStill(), 1), [])
  assert.deepEqual(validateGrounding(groundedStill(), 1, context), [])
})
for (const field of ['specific_advice', 'uncertainties', 'observations', 'what_went_wrong']) {
  test(`unsupported assertions remain blocked in ${field}`, () => {
    for (const claim of [
      'You successfully planted the defuser.', 'You moved through the doorway.',
      'You repeatedly expose yourself.', 'You peeked before checking utility.',
      'You consistently aim too low.', 'You have planted the defuser.',
      'Post-plant status is unknown, but you have planted the defuser.',
      'Recurring habits cannot be established from a single image because you always rush.',
    ]) {
      const value = groundedStill(); value.per_image[0][field] = [claim]
      assert.ok(validateGrounding(value, 1, context).some(e => e.includes('temporal')), claim)
    }
  })
}
test('bounded conditional advice is accepted only in advice fields, with no assertion exemption', () => {
  const advice = 'If reviewing a post-plant round, compare the visible doorway angles.'
  const value = groundedStill(); value.per_image[0].specific_advice = [advice]
  value.practice_plan.this_week = [advice]
  assert.deepEqual(validateGrounding(value, 1, context), [])
  value.per_image[0].observations = [advice]
  assert.ok(validateGrounding(value, 1, context).some(e => e.includes('temporal')))
  value.per_image[0].observations = ['The HUD shows 100 health.']
  value.per_image[0].specific_advice = ['If this is a post-plant round, check the doorway because you have planted the defuser.']
  assert.ok(validateGrounding(value, 1, context).some(e => e.includes('temporal')))
})
test('unsupported map, site, phase, score and recurring patterns fail independently', () => {
  for (const mutate of [
    v => { v.session.detected_map = 'House' },
    v => { v.per_image[0].detected.site = 'Kids Bedroom / Master Bedroom' },
    v => { v.per_image[0].detected.round_phase = 'post-plant' },
    v => { v.session.score = 62 },
    v => { v.patterns.standout_strengths = ['Good movement habits'] },
    v => { v.per_image[0].observations = [' '] },
    v => { v.per_image[0].uncertainties = [''] },
  ]) {
    const value = groundedStill(); mutate(value)
    assert.ok(validateGrounding(value, 1, context).length)
  }
})
test('absent context requires null labels even when the fixture location is known to the reviewer', () => {
  const value = groundedStill()
  assert.ok(validateGrounding(value, 1, {}).some(e => e.includes('map')))
  value.session.detected_map = null
  value.per_image[0].detected.map = null; value.per_image[0].detected.site = null
  assert.deepEqual(validateGrounding(value, 1, {}), [])
})
