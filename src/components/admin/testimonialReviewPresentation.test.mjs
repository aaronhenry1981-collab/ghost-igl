import test from 'node:test'
import assert from 'node:assert/strict'
import { testimonialReviewPresentation as present } from './testimonialReviewPresentation.mjs'

test('legacy missing metadata is neither denial nor invented recorded permission', () => {
  const p = present({ name: 'Existing manual quote' })
  assert.equal(p.quotePermission, 'Not recorded (legacy admin entry)')
  assert.equal(p.photoPermission, 'Not recorded (legacy admin entry)')
  assert.equal(p.recorded, 'Not recorded')
  assert.equal(p.publishDisabled, false)
  assert.equal(p.publishAction, 'publish')
  assert.match(p.publishPrompt, /checked the original permission/)
  assert.doesNotMatch(p.publishSuccess, /recorded permission/)
})
test('explicit false customer consent remains private and cannot publish', () => {
  for (const status of ['pending', 'approved']) {
    const p = present({ record_type: 'customer_submission', status, quote_consent: false })
    assert.equal(p.quotePermission, 'No - private feedback only')
    assert.equal(p.publishDisabled, true)
    assert.equal(p.legacyNotice, null)
  }
})
test('missing or malformed customer consent cannot inherit legacy handling', () => {
  for (const quote_consent of [undefined, null, 'true', 1]) {
    const p = present({ record_type: 'customer_submission', status: 'pending', quote_consent })
    assert.equal(p.publishDisabled, true)
    assert.equal(p.quotePermission, 'Not recorded - publication unavailable')
  }
})
test('consenting pending customer retains exact consent labels and approval action', () => {
  const p = present({ record_type: 'customer_submission', status: 'pending', quote_consent: true, photo_consent: false, consent_at: 'fixture timestamp' })
  assert.equal(p.quotePermission, 'Yes'); assert.equal(p.photoPermission, 'No')
  assert.equal(p.recorded, 'fixture timestamp'); assert.equal(p.publishDisabled, false); assert.equal(p.publishAction, 'approve')
  assert.equal(present({ record_type: 'customer_submission', status: 'rejected', quote_consent: true }).publishDisabled, true)
})
test('explicit legacy false is displayed as a stored No and cannot be republished in UI', () => {
  const p = present({ quote_consent: false })
  assert.equal(p.quotePermission, 'No'); assert.equal(p.publishDisabled, true)
})
