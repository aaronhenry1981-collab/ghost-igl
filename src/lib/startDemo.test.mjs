import test from 'node:test'
import assert from 'node:assert/strict'

import { DEFAULT_SELECTION, demoPlan, freePlanSignupPath, planPath, resolveDemoSelection, validDemoSelection } from './startDemo.js'

test('opens on Bank CEO attack by default', () => {
  assert.deepEqual(resolveDemoSelection(new URLSearchParams('')), DEFAULT_SELECTION)
})

test('a campaign link can open a specific free site and side', () => {
  assert.deepEqual(
    resolveDemoSelection(new URLSearchParams('map=coastline&site=kitchen-service&side=defense')),
    { mapId: 'coastline', siteId: 'kitchen-service', side: 'defense' },
  )
  // Map only: first site of that map.
  assert.deepEqual(
    resolveDemoSelection(new URLSearchParams('map=coastline')),
    { mapId: 'coastline', siteId: 'hookah-billiards', side: 'attack' },
  )
})

test('a locked or unknown map never opens as if it were free', () => {
  assert.deepEqual(resolveDemoSelection(new URLSearchParams('map=oregon&site=kids-dorms')), DEFAULT_SELECTION)
  assert.deepEqual(resolveDemoSelection(new URLSearchParams('map=bank&site=nope&side=attack')), { mapId: 'bank', siteId: 'ceo', side: 'attack' })
  assert.deepEqual(resolveDemoSelection(new URLSearchParams('map=bank&site=ceo&side=sideways')), DEFAULT_SELECTION)
})

test('the demo plan is the public plan, with footage-verified callouts marked', () => {
  const plan = demoPlan(DEFAULT_SELECTION)
  assert.equal(plan.mapName, 'Bank')
  assert.equal(plan.floor, '2F')
  assert.equal(plan.operators.length, 5)
  assert.deepEqual(Object.keys(plan.operators[0]), ['name', 'role', 'priority'])
  assert.ok(plan.plan.length > 10)
  assert.ok(plan.callouts.some((callout) => callout.verified), 'Bank has footage-verified names')
  assert.ok(plan.footage.frames > 0)
})

test('CTA destinations keep the chosen plan through signup', () => {
  const selection = { mapId: 'coastline', siteId: 'blue-bar', side: 'defense' }
  assert.equal(planPath(selection), '/strats/coastline/blue-bar/defense')
  assert.equal(freePlanSignupPath(selection), '/auth?mode=signup&redirect=%2Fstrats%2Fcoastline%2Fblue-bar%2Fdefense')
})

test('choices made in the demo controls are kept (and still guarded)', () => {
  assert.deepEqual(
    validDemoSelection({ mapId: 'coastline', siteId: 'kitchen-service', side: 'defense' }),
    { mapId: 'coastline', siteId: 'kitchen-service', side: 'defense' },
  )
  // Switching map keeps the side and moves to that map's first site.
  assert.deepEqual(
    validDemoSelection({ mapId: 'coastline', siteId: 'ceo', side: 'defense' }),
    { mapId: 'coastline', siteId: 'hookah-billiards', side: 'defense' },
  )
  assert.deepEqual(validDemoSelection({ mapId: 'oregon', siteId: 'x', side: 'attack' }), DEFAULT_SELECTION)
})
