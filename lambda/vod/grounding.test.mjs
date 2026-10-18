import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { GROUNDING_RULES, requireGroundedAnalysis, validateGrounding } from './grounding.mjs'
const safe = () => ({ session: { headline: 'A still shows the player facing a doorway.', score: null, detected_map: null, image_count: 1 }, per_image: [{ image_index: 0, detected: { map: null, site: null, round_phase: 'unknown' }, observations: ['The HUD shows 100 health.'], uncertainties: ['Movement and prior actions cannot be established.'], what_happened: 'The player faces a doorway.', what_went_wrong: [], what_went_right: [], specific_advice: [] }], patterns: { recurring_weaknesses: [], standout_strengths: [] }, practice_plan: { this_week: [] } })
test('actual model schema includes every required grounding field and has no scoring or phase conflict', () => {
  const source = readFileSync(new URL('./index.mjs', import.meta.url), 'utf8')
  const context = vm.createContext({})
  vm.runInContext(source.slice(source.indexOf('const RESPONSE_SCHEMA ='), source.indexOf('// Pull a compact')), context)
  const schema = vm.runInContext('RESPONSE_SCHEMA', context)
  assert.match(schema, /"score": null/)
  assert.match(schema, /"round_phase": "unknown"/)
  assert.match(schema, /"observations": \[/)
  assert.match(schema, /"uncertainties": \[/)
  assert.doesNotMatch(schema, /integer 0-100|"post-plant"/)
})
test('display-name formatting is equivalent to supplied IDs, but another map is rejected', () => {
  const value = safe(); value.session.detected_map = 'Coastline'
  Object.assign(value.per_image[0].detected, { map: 'Coastline', site: 'Theater / Penthouse' })
  assert.deepEqual(validateGrounding(value, 1, { map: 'coastline', site: 'theater-penthouse' }), [])
  value.session.detected_map = 'House'
  assert.ok(validateGrounding(value, 1, { map: 'coastline', site: 'theater-penthouse' }).some(x => x.startsWith('session map')))
})
test('explicit uncertainty about post-plant is permitted without permitting a positive claim', () => {
  const value = safe(); value.per_image[0].uncertainties = ['Cannot determine whether this is a post-plant situation.']
  assert.deepEqual(validateGrounding(value, 1), [])
  value.per_image[0].uncertainties = ['Cannot determine phase, but you have planted the defuser.']
  assert.ok(validateGrounding(value, 1).some(x => x.includes('temporal')))
  value.per_image[0].uncertainties = ['You have planted the defuser.']
  assert.ok(validateGrounding(value, 1).some(x => x.includes('temporal')))
  value.per_image[0].uncertainties = ['Cannot determine phase because you have planted the defuser.']
  assert.ok(validateGrounding(value, 1).some(x => x.includes('temporal')))
})
test('exact Coastline failure is rejected before persistence: House, 62, post-plant and habits', () => {
  const bad = safe(); bad.session.score = 62; bad.session.detected_map = 'House'
  bad.per_image[0].detected = { map: 'House', site: "Kids Bedroom / Master Bedroom", round_phase: 'post-plant' }
  bad.per_image[0].what_happened = "You've planted the defuser."
  bad.patterns.recurring_weaknesses = ['Crosshair placement consistently too low']
  const errors = validateGrounding(bad, 1, { map: 'Coastline', site: 'Penthouse' })
  for (const word of ['score', 'map', 'phase', 'patterns', 'temporal']) assert.ok(errors.some(e => e.includes(word)))
  assert.throws(() => requireGroundedAnalysis(bad, 1, {}), { name: 'ModelGroundingError' })
})
test('no supplied context retains unknown labels and no tactical score', () => {
  const result = requireGroundedAnalysis(safe(), 1, {})
  assert.equal(result.session.score, null); assert.equal(result.context_provenance, 'unknown')
})
test('supplied Coastline and Penthouse are preserved as user context, not detected proof', () => {
  const value = safe(); value.session.detected_map = 'Coastline'; Object.assign(value.per_image[0].detected, { map: 'Coastline', site: 'Penthouse' })
  assert.equal(requireGroundedAnalysis(value, 1, { map: 'Coastline', site: 'Penthouse' }).context_provenance, 'user_context')
})
test('unknown labels alone do not excuse missing evidence or fabricated prose', () => {
  const value = safe(); value.per_image[0].observations = []; value.per_image[0].what_happened = 'You successfully planted the defuser.'
  assert.ok(validateGrounding(value, 1).length >= 2)
})
test('real callBedrock rejects semantically invalid output after one model call without repair', async () => {
  const source = readFileSync(new URL('./index.mjs', import.meta.url), 'utf8')
  let calls = 0
  const bad = safe(); bad.session.score = 62
  const ctx = vm.createContext({ REVIEW_REQUEST_BUDGET_MS: 24000, MODEL_ID: 'offline', GAME_DISPLAY: { r6: { name: 'Siege' } }, buildSystemPrompt: () => GROUNDING_RULES,
    invokeModel: async () => { calls++; return JSON.stringify(bad) }, parseModelJson: JSON.parse,
    validateAnalysis: () => [], requireGroundedAnalysis })
  vm.runInContext(source.slice(source.indexOf('async function callBedrock('), source.indexOf('async function callRankSnapshot(')), ctx)
  await assert.rejects(ctx.callBedrock('r6', [{ media_type: 'image/jpeg', base64: 'eA==' }], {}, 'champion'), { name: 'ModelGroundingError' })
  assert.equal(calls, 1)
})
