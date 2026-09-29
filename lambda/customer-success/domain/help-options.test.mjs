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

test('audit P0-3: included sessions go to self-service booking on the coaching page', async () => {
  const { INCLUDED_SESSION_CTA } = await import('./plans.mjs')
  assert.equal(INCLUDED_SESSION_CTA.href, '/coaching/index.html#book')
  const champ = deriveHelp(facts({ support: true, messaging: false }, 'champion'))
  const coaching = champ.find((o) => o.id === 'coaching')
  assert.equal(coaching.cta.href, INCLUDED_SESSION_CTA.href)
  const pro = deriveHelp(facts({ support: true, messaging: false }, 'pro')).find((o) => o.id === 'coaching')
  assert.equal(pro.cta.href, '/coaching/index.html', 'paid single sessions still go to the coaching page')
})
