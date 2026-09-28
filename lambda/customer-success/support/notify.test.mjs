import test from 'node:test'
import assert from 'node:assert/strict'
import * as realEngines from './engines.mjs'
import { PLAYERS, identityOf, supportServiceHarness } from './fixtures/world.mjs'

// Staff-only new-case notifications: minimal payload, never the player's
// email or words, and a failing sender can never break case creation.
const TEXT = 'My VOD review never finished and my email is visible here'

test('a new case notifies staff once with case number and category only', async () => {
  const sent = []
  const h = supportServiceHarness({ engines: realEngines, config: { support: { notifyStaff: async (msg) => { sent.push(msg) } } } })
  const out = await h.service.createCase(identityOf('a'), { text: TEXT, clientRequestId: 'notify-00000001' })
  assert.equal(sent.length, 1)
  assert.deepEqual(Object.keys(sent[0]).sort(), ['caseNumber', 'category', 'linked', 'priority', 'source'])
  assert.equal(sent[0].caseNumber, out.case.caseNumber)
  const json = JSON.stringify(sent[0])
  assert.ok(!json.includes(PLAYERS.a.email), 'no player email')
  assert.ok(!json.includes('never finished'), 'no player message text')
})

test('a failing sender never fails the request; no sender means no call', async () => {
  const h = supportServiceHarness({ engines: realEngines, config: { support: { notifyStaff: async () => { throw new Error('SES down') } } } })
  const out = await h.service.createCase(identityOf('a'), { text: TEXT, clientRequestId: 'notify-00000002' })
  assert.ok(out.case.caseNumber)
  const quiet = supportServiceHarness({ engines: realEngines })
  const out2 = await quiet.service.createCase(identityOf('b'), { text: TEXT, clientRequestId: 'notify-00000003' })
  assert.ok(out2.case.caseNumber)
})
