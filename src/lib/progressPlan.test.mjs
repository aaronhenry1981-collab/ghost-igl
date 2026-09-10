import test from 'node:test'
import assert from 'node:assert/strict'

import { PROGRESS_TIERS } from '../data/progressCurriculum.js'
import { normalizeRoadmap, resolveFocus } from './progressPlan.js'

const gold = PROGRESS_TIERS.find((tier) => tier.id === 'gold')

test('legacy automatic focus ids no longer pin a stale mission', () => {
  const roadmap = normalizeRoadmap({ focusId: 'utility-sequencing', rankMode: 'auto' })
  const evidence = {
    'utility-sequencing': { proved: 3, missed: 0, recent: [{ result: 'proved' }, { result: 'proved' }, { result: 'proved' }] },
    'drone-entry-partner': { proved: 0, missed: 2, recent: [{ result: 'missed' }, { result: 'missed' }] },
  }

  assert.equal(roadmap.focusMode, 'auto')
  assert.equal(resolveFocus(roadmap, gold, evidence).id, 'drone-entry-partner')
})

test('an explicit manual mission stays selected until automatic mode is restored', () => {
  const roadmap = normalizeRoadmap({ focusId: 'utility-sequencing', focusMode: 'manual' })
  const evidence = {
    'drone-entry-partner': { proved: 0, missed: 3, recent: [{ result: 'missed' }] },
  }

  assert.equal(resolveFocus(roadmap, gold, evidence).id, 'utility-sequencing')
  assert.equal(resolveFocus({ ...roadmap, focusMode: 'auto' }, gold, evidence).id, 'drone-entry-partner')
})
