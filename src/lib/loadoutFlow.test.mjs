import test from 'node:test'
import assert from 'node:assert/strict'
import { findOperatorLoadout, operatorContextUrl } from './loadoutFlow.js'

const LOADOUTS = {
  hard_breach: {
    name: 'Hard Breach',
    operators: [{ name: 'Thermite', primary: '556xi' }, { name: 'Ace', primary: 'AK-12' }],
  },
  intel: {
    name: 'Intel',
    operators: [{ name: 'Valkyrie', primary: 'MPX' }],
  },
}

test('findOperatorLoadout matches an operator without case sensitivity', () => {
  const result = findOperatorLoadout(LOADOUTS, 'therMITE')
  assert.equal(result.sectionId, 'hard_breach')
  assert.equal(result.operator.primary, '556xi')
})

test('findOperatorLoadout returns null for an operator without a curated loadout', () => {
  assert.equal(findOperatorLoadout(LOADOUTS, 'Montagne'), null)
})

test('operatorContextUrl carries only defined round context', () => {
  assert.equal(
    operatorContextUrl('Thermite', { map: 'bank', site: 'ceo', side: 'attack' }),
    '/loadouts?operator=Thermite&map=bank&site=ceo&side=attack',
  )
  assert.equal(operatorContextUrl('Ace'), '/loadouts?operator=Ace')
})
