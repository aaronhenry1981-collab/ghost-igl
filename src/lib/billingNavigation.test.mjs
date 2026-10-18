import test from 'node:test'
import assert from 'node:assert/strict'
import { hasStripeBilling } from './billingNavigation.js'
test('admin and comp access identifiers never navigate to Stripe billing', () => {
  for (const stripe_customer_id of [null, '', 'admin_fixture', 'comp_fixture', 'cus_']) {
    assert.equal(hasStripeBilling({ stripe_customer_id }), false)
  }
  assert.equal(hasStripeBilling(null), false)
})
test('real customer identifiers retain portal access including administrators and past-due customers', () => {
  for (const account of [
    { stripe_customer_id: 'cus_fixture123', is_admin: false, sub_status: 'active' },
    { stripe_customer_id: 'cus_fixture123', is_admin: true, sub_status: 'active' },
    { stripe_customer_id: 'cus_fixture123', sub_status: 'past_due' },
  ]) assert.equal(hasStripeBilling(account), true)
})
