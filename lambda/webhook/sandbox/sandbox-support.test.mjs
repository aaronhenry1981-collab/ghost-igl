import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assertTestEvent, hasExpectedEvents } from './sandbox-support.mjs'
test('live and unspecified event mode are refused before delivery', () => {
  assert.throws(()=>assertTestEvent({livemode:true}))
  assert.throws(()=>assertTestEvent({}))
  assert.doesNotThrow(()=>assertTestEvent({livemode:false}))
})
test('waits require this batch and the requested subscription', () => {
  const old = { type:'invoice.paid', data:{object:{subscription:'sub_old'}} }
  assert.equal(hasExpectedEvents([],['invoice.paid'],'sub_old'),false)
  assert.equal(hasExpectedEvents([old],['invoice.paid'],'sub_new'),false)
  assert.equal(hasExpectedEvents([old],['invoice.paid'],'sub_old'),true)
  assert.equal(hasExpectedEvents([{type:'invoice.paid',data:{object:{parent:{subscription_details:{subscription:'sub_new'}}}}}],['invoice.paid'],'sub_new'),true)
})
