import test from 'node:test'
import assert from 'node:assert/strict'
import { deriveHelp } from './mission.mjs'

const facts = (features, plan = 'pro') => ({ billing: { plan }, config: { features } })

test('the home help card offers Player Command first when support is on', () => {
  const on = deriveHelp(facts({ support: true, messaging: false }))
  assert.equal(on[0].id, 'support')
  assert.equal(on[0].cta.href, '/support')
  assert.ok(!on.some((o) => o.id === 'message'), 'messaging stays hidden when its flag is off')
  assert.ok(on.some((o) => o.id === 'email'), 'email support is always offered')
})

test('with support off the card never links to Player Command', () => {
  const off = deriveHelp(facts({ support: false, messaging: false }, 'champion'))
  assert.ok(!off.some((o) => o.id === 'support'))
  assert.deepEqual(off.map((o) => o.id), ['coaching', 'email'])
})
