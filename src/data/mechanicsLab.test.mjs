import assert from 'node:assert/strict'
import {
  buildSensitivityPlan,
  emptyMechanicsState,
  evaluateSensitivityComparison,
  issuesForInput,
  normalizeMechanicsState,
  sensitivityHistoryVerdict,
} from './mechanicsLab.js'
import {
  OPERATOR_DEPTH,
  OPERATOR_DEPTH_TARGET,
  RANGE_SESSION,
  evaluateRangeSession,
  recommendOperators,
  situationPlan,
  trainingPromotion,
} from './operatorTraining.js'

const empty = emptyMechanicsState()
assert.equal(empty.profile.ads1x, null, 'there must be no universal default sensitivity')
assert.deepEqual(empty.trainingSessions, [])
assert.equal(issuesForInput('mouse').some((issue) => issue.id === 'stick-drift'), false)

const plan = buildSensitivityPlan({ input: 'controller', ads1x: 35 }, 'over-flick')
assert.deepEqual({ status: plan.status, baseline: plan.baseline, candidate: plan.candidate }, { status: 'ready', baseline: 35, candidate: 34 })

const driftBlocked = buildSensitivityPlan({ input: 'controller', rightDeadzone: 8, driftStatus: 'unknown' }, 'micro-stuck')
assert.equal(driftBlocked.status, 'blocked')

const comparison = evaluateSensitivityComparison(
  plan,
  { acquisition: 6, micro: 6, peek: 6, recoil: 6, errors: 3, comfort: 4 },
  { acquisition: 8, micro: 6, peek: 6, recoil: 6, errors: 2, comfort: 4 },
)
assert.equal(comparison.verdict, 'candidate-won')

const state = normalizeMechanicsState({
  comparisons: [
    { planId: plan.id, verdict: 'candidate-won' },
    { planId: plan.id, verdict: 'candidate-won' },
  ],
})
assert.equal(sensitivityHistoryVerdict(state, plan).status, 'lock-candidate')

const rollback = evaluateSensitivityComparison(
  plan,
  { acquisition: 7, micro: 7, peek: 7, recoil: 7, errors: 1, comfort: 4 },
  { acquisition: 8, micro: 6, peek: 6, recoil: 6, errors: 3, comfort: 4 },
)
assert.equal(rollback.verdict, 'rollback')

const bounded = normalizeMechanicsState({
  comparisons: Array.from({ length: 40 }, (_, index) => ({ id: `c-${index}`, verdict: 'candidate-won', baseline: comparison.baseline, candidate: comparison.candidate })),
  aimSessions: Array.from({ length: 60 }, (_, index) => ({ id: `a-${index}`, drillId: 'first-shot', successes: 8 })),
  peekSessions: Array.from({ length: 60 }, (_, index) => ({ id: `p-${index}`, drillId: 'slice-clear', successes: 8 })),
  trainingSessions: Array.from({ length: 80 }, (_, index) => ({ id: `t-${index}`, lessonId: 'slice-room', venue: 'custom', successes: 8, reps: 10, passed: true })),
})
assert.equal(bounded.comparisons.length, 8)
assert.equal(bounded.aimSessions.length, 20)
assert.equal(bounded.peekSessions.length, 20)
assert.equal(bounded.trainingSessions.length, 40)
assert.ok(JSON.stringify(bounded).length < 20_000, 'bounded mechanics state must fit the climb-progress cloud limit')

assert.equal(OPERATOR_DEPTH.attack.length, OPERATOR_DEPTH_TARGET)
assert.equal(OPERATOR_DEPTH.defense.length, OPERATOR_DEPTH_TARGET)
const legal = recommendOperators({
  side: 'attack',
  banned: ['Dokkaebi', 'Jackal', 'Ash'],
  taken: ['Thermite', 'Ace', 'Ram', 'Striker'],
  siteNeeds: ['Buck', 'Gridlock'],
  performance: { attack: { Buck: { rounds: 10, wins: 6 } } },
})
assert.equal(legal.length, 5, '12-deep pool must leave five choices after three bans and four teammate locks')
assert.equal(legal[0].op, 'Buck', 'confirmed site fit and personal evidence should outrank a generic fallback')
assert.equal(legal.some((item) => ['Dokkaebi', 'Jackal', 'Ash', 'Thermite', 'Ace', 'Ram', 'Striker'].includes(item.op)), false)
assert.equal(trainingPromotion([
  { lessonId: 'slice-room', passed: true },
  { lessonId: 'slice-room', passed: true },
], 'slice-room').status, 'ranked-ready')
assert.equal(RANGE_SESSION.stages.length, 7)
assert.equal(RANGE_SESSION.stages.reduce((total, stage) => total + stage.seconds, 0), RANGE_SESSION.totalSeconds)
const rangeBaseline = RANGE_SESSION.stages.map((stage) => ({
  drillId: stage.id,
  metrics: stage.kind === 'knowledge'
    ? { damage5: 40, damage15: 36, damage25: 32, damage35: 28, wallEffect: 'opens one bullet hole' }
    : { accuracy: 50, [stage.primaryMetric]: stage.primaryMetric === 'accuracy' ? 50 : 10 },
}))
const assessment = evaluateRangeSession(rangeBaseline)
assert.deepEqual({ complete: assessment.complete, passed: assessment.passed, baseline: assessment.baseline }, { complete: true, passed: false, baseline: true })
const rangeImproved = rangeBaseline.map((result) => {
  const stage = RANGE_SESSION.stages.find((item) => item.id === result.drillId)
  if (stage.kind === 'knowledge') return result
  return {
    ...result,
    metrics: {
      ...result.metrics,
      accuracy: stage.primaryMetric === 'accuracy' ? 53 : 48,
      [stage.primaryMetric]: stage.primaryMetric === 'accuracy' ? 53 : 11,
    },
  }
})
const workout = evaluateRangeSession(rangeImproved, [{ lessonId: RANGE_SESSION.id, stageResults: rangeBaseline }])
assert.deepEqual({ complete: workout.complete, passed: workout.passed, successes: workout.successes }, { complete: true, passed: true, successes: 10 })
assert.equal(evaluateRangeSession([{ drillId: 'z3-first-shot', metrics: { accuracy: 50 } }]).complete, false)
assert.equal(situationPlan({ ours: 1, theirs: 5, side: 'attack' }).state, 'clutch')

console.log('build 208 mechanics, guided Range, operator-depth, and situation protocol tests passed')
