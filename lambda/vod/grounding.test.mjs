import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { GROUNDING_RULES, requireGroundedAnalysis, validateGrounding } from './grounding.mjs'
const safe = () => ({ session: { headline: 'A still shows the player facing a doorway.', score: null, detected_map: null, image_count: 1 }, per_image: [{ image_index: 0, detected: { map: null, site: null, round_phase: 'unknown' }, observations: ['The HUD shows 100 health.'], uncertainties: ['Movement and prior actions cannot be established.'], what_happened: 'The player faces a doorway.', what_went_wrong: [], what_went_right: [], specific_advice: [] }], patterns: { recurring_weaknesses: [], standout_strengths: [] }, practice_plan: { this_week: [] } })

test('reviewer: unknown floor and separate-field destructive pronoun advice must be rejected', () => {
  const value = safe()
  value.per_image[0].uncertainties = ['Floor material and destructibility cannot be verified from this frame.']
  value.per_image[0].specific_advice = ['Use Sledge to open it and attack the defenders below.']
  assert.ok(validateGrounding(value, 1).some(error => error.includes('geometry')))
  assert.throws(() => requireGroundedAnalysis(value, 1, {}), { name: 'ModelGroundingError' })
})

test('reviewer: waiting for verified destructibility is safe abstention', () => {
  const value = safe()
  value.per_image[0].uncertainties = ['Floor material and destructibility cannot be verified from this frame.']
  value.per_image[0].specific_advice = ['Do not breach the floor until its destructibility is verified.']
  assert.deepEqual(validateGrounding(value, 1), [])
})

const unknownFloor = value => { value.per_image[0].uncertainties = ['Floor material and destructibility cannot be verified from this frame.']; return value }
for (const field of ['specific_advice', 'observations', 'uncertainties', 'what_went_wrong', 'what_went_right', 'what_happened', 'headline', 'practice_plan', 'character_feedback']) {
  test(`separate-field destructive pronoun cannot bypass geometry checks in ${field}`, () => {
    const value = unknownFloor(safe()), text = 'Use Sledge to open it and attack the defenders below.'
    if (field === 'headline') value.session.headline = text
    else if (field === 'practice_plan') value.practice_plan.this_week = [text]
    else if (field === 'character_feedback') value.character_feedback = { action: text }
    else if (field === 'what_happened') value.per_image[0].what_happened = text
    else value.per_image[0][field] = [...(field === 'uncertainties' ? value.per_image[0].uncertainties : []), text]
    assert.ok(validateGrounding(value, 1).some(error => error.includes('geometry')))
  })
}
for (const text of ['Break it with Buck.', 'Hammer that to create an opening.', 'Shoot through it.', 'Blast them from here.']) {
  test(`ambiguous destructive target retains report-level geometry context: ${text}`, () => {
    const value = unknownFloor(safe()); value.per_image[0].specific_advice = [text]
    assert.ok(validateGrounding(value, 1).some(error => error.includes('geometry')))
  })
}
test('geometry context persists across images and global practice advice without inventing a referent', () => {
  const value = unknownFloor(safe()); value.session.image_count = 2
  value.per_image.push({ ...structuredClone(value.per_image[0]), image_index: 1, uncertainties: ['The target cannot be identified.'], specific_advice: ['Open it with Sledge.'] })
  assert.ok(validateGrounding(value, 2).some(error => error.includes('geometry')))
  value.per_image[1].specific_advice = []; value.practice_plan.this_week = ['Use Buck to break it.']
  assert.ok(validateGrounding(value, 2).some(error => error.includes('geometry')))
})
for (const text of [
  'Do not breach the floor until its destructibility is verified.',
  'Do not open this hatch until its breachability is confirmed in the current game build.',
  'Never shoot through that wall unless its destructibility has been verified.',
  "Don't break it until its destructibility is confirmed.",
  'The floor material is unknown.',
  'Cannot verify whether this floor is destructible from this frame.',
  'Check the visible doorway before advancing.',
]) test(`safe hold or unknown stays usable with geometry uncertainty: ${text}`, () => {
  const value = unknownFloor(safe()); value.per_image[0].specific_advice = [text]
  assert.deepEqual(validateGrounding(value, 1), [])
})
for (const appended of [
  ', but use Sledge to open it now.',
  '; open it with Buck.',
  '. It is verified, so breach it.',
  ' and then shoot through the floor.',
  '. Use Sledge to open it and attack the defenders below.',
]) test(`a safe hold cannot exempt contradictory appended instructions: ${appended}`, () => {
  const value = unknownFloor(safe()); value.per_image[0].specific_advice = ['Do not breach the floor until its destructibility is verified' + appended]
  assert.ok(validateGrounding(value, 1).some(error => error.includes('geometry')))
})
test('safe hold in one item or field cannot authorize a destructive follow-up item', () => {
  const value = safe(); value.per_image[0].specific_advice = ['Do not breach the floor until its destructibility is verified.', 'Open it with Sledge.']
  assert.ok(validateGrounding(value, 1).some(error => error.includes('geometry')))
  value.per_image[0].specific_advice.pop(); value.practice_plan.this_week = ['Break it with Buck.']
  assert.ok(validateGrounding(value, 1).some(error => error.includes('geometry')))
})

test('unknown floor destructibility cannot coexist with actionable Sledge advice', () => {
  const value = safe()
  value.per_image[0].uncertainties = ['Floor material and destructibility cannot be verified from this frame.']
  value.per_image[0].specific_advice = ['This floor is destructible; use Sledge to open a vertical angle here.']
  assert.ok(validateGrounding(value, 1).some(error => error.includes('geometry')))
  assert.throws(() => requireGroundedAnalysis(value, 1, {}), { name: 'ModelGroundingError' })
})

const unsafeGeometry = [
  'This floor is destructible; use Sledge to open a vertical angle here.',
  'Use Buck to open the ceiling above this position.',
  'Breach the hatch and shoot into the room below.',
  'The reinforced wall can be breached from this position.',
  'The floor is concrete, so vertical play cannot work here.',
  'If the floor is soft, use Sledge to open it now.',
  'Floor material and destructibility cannot be verified from this frame, but use Buck to open it.',
  'Floor material and destructibility cannot be verified from this frame; open it with Sledge.',
  'Do not assume this floor is destructible, but open it with Sledge.',
  'This floor\'s destructibility is unknown, but use Sledge to open it.',
  'Cannot determine whether the floor is soft from this image because it is concrete.',
  'Create a vertical angle with Buck.',
  'Practice shooting through this ceiling.',
  'Verify surface destructibility in the current game build before planning any breach or vertical play; then breach this hatch.',
  'Use Sledge to open this FLOOR.',
  'Ｕｓｅ Ｂｕｃｋ ｔｏ ｏｐｅｎ ｔｈｅ ｆｌｏｏｒ.',
]
for (const advice of unsafeGeometry) test(`unverified geometry is withheld: ${advice}`, () => {
  const value = safe(); value.per_image[0].specific_advice = [advice]
  assert.ok(validateGrounding(value, 1).some(error => error.includes('geometry')), advice)
})

for (const field of ['headline', 'observations', 'uncertainties', 'what_happened', 'what_went_wrong', 'what_went_right', 'practice_plan', 'character_feedback', 'patterns']) {
  test(`unverified geometry cannot move to ${field} to bypass the advice check`, () => {
    const value = safe(), text = 'Use Buck to open this floor.'
    if (field === 'headline') value.session.headline = text
    else if (field === 'practice_plan') value.practice_plan.this_week = [text]
    else if (field === 'character_feedback') value.character_feedback = { recommendation: text }
    else if (field === 'patterns') value.patterns.recurring_weaknesses = [text]
    else if (field === 'what_happened') value.per_image[0][field] = text
    else value.per_image[0][field] = [text]
    assert.ok(validateGrounding(value, 1).some(error => error.includes('geometry')))
  })
}

test('unknown and supplied locations do not grant verified geometry, including multiple frames', () => {
  const value = safe(); value.session.image_count = 2
  value.session.detected_map = 'Bank'; value.per_image[0].detected = { map: 'Bank', site: 'Server', round_phase: 'unknown' }
  value.per_image.push({ ...structuredClone(value.per_image[0]), image_index: 1, specific_advice: ['Open this floor with Buck.'] })
  const context = { map: 'Bank', site: 'Server', geometry_verified: true, verified_facts: ['floor is soft'] }
  assert.ok(validateGrounding(value, 2, context).some(error => error.includes('geometry')))
})

for (const text of [
  'Surface destructibility is not verified.',
  'Floor material and destructibility cannot be verified from this frame.',
  'This floor\'s destructibility is unknown.',
  'The ceiling material is not verified.',
  'The hatch breachability cannot be confirmed from this image.',
  'Cannot determine whether the floor is soft from this image.',
  'Do not assume this floor is destructible.',
  'Verify surface destructibility in the current game build before planning any breach or vertical play.',
  'A hole is visible in the floor.',
  'Keep the visible doorway in view before advancing.',
  'Sledge is visible in the selected image.',
]) test(`abstention or bounded visible observation remains usable: ${text}`, () => {
  const value = safe(); value.per_image[0].specific_advice = [text]
  assert.deepEqual(validateGrounding(value, 1), [])
})
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
