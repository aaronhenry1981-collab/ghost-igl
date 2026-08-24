import test from 'node:test'
import assert from 'node:assert/strict'
import { ALL_PROGRESS_SKILLS, PROGRESS_TIERS, evidenceStatus } from './progressCurriculum.js'

test('keeps the full eight-tier, forty-objective ladder', () => {
  assert.equal(PROGRESS_TIERS.length, 8)
  assert.equal(ALL_PROGRESS_SKILLS.length, 40)
  assert.equal(new Set(ALL_PROGRESS_SKILLS.map((skill) => skill.id)).size, 40)
  assert.deepEqual(PROGRESS_TIERS.map((tier) => tier.name), [
    'Copper', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Champion',
  ])
})

test('does not turn missing gameplay evidence into a pass or failure', () => {
  const action = ALL_PROGRESS_SKILLS.find((skill) => skill.id === 'drone-before-entry')
  assert.equal(evidenceStatus(action, {}, false), 'not-observed')
})

test('requires repeated proof and lets recent misses reopen a skill', () => {
  const action = ALL_PROGRESS_SKILLS.find((skill) => skill.id === 'drone-before-entry')
  assert.equal(evidenceStatus(action, {
    proved: 3, missed: 0, recent: [
      { result: 'proved' }, { result: 'proved' }, { result: 'proved' },
    ],
  }), 'mastered')
  assert.equal(evidenceStatus(action, {
    proved: 3, missed: 1, recent: [
      { result: 'proved' }, { result: 'proved' }, { result: 'proved' }, { result: 'missed' },
    ],
  }), 'needs-work')
})

test('knowledge is clearly self-confirmed rather than AI-proven', () => {
  const knowledge = ALL_PROGRESS_SKILLS.find((skill) => skill.id === 'settings-locked')
  assert.equal(evidenceStatus(knowledge, {}, false), 'not-started')
  assert.equal(evidenceStatus(knowledge, {}, true), 'confirmed')
})
