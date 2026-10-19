import test from 'node:test'
import assert from 'node:assert/strict'
import { accessDetail, billingLabel, nextChargeLabel } from './memberFormat.mjs'

test('payment recovery never claims there is no scheduled charge or invents a retry date', () => {
  for (const sub_status of ['past_due', 'unpaid', 'incomplete']) {
    const member = { sub_status, will_renew: false, next_billing_at: '2099-01-01' }
    assert.equal(nextChargeLabel(member), 'Check Stripe for payment recovery timing')
    assert.equal(billingLabel(member).title, 'Payment issue')
  }
  assert.equal(nextChargeLabel({ sub_status: 'canceled', will_renew: false }), 'None scheduled')
  assert.equal(nextChargeLabel({ sub_status: 'active', will_renew: true }), 'Check Stripe for charge timing')
  assert.notEqual(nextChargeLabel({ sub_status: 'active', will_renew: true, next_billing_at: '2099-01-01' }), 'None scheduled')
})

test('valid and expired comp access have distinct labels; admin access stays explicit', () => {
  const now = Date.parse('2026-10-19')
  const comp = { is_comp: true, billing_state: 'comp', sub_status: 'active', plan: 'elite', current_period_end: '2026-11-01' }
  assert.equal(billingLabel(comp, now).title, 'Complimentary')
  assert.match(accessDetail(comp, now), /^Complimentary through /)
  const expired = { ...comp, current_period_end: '2026-10-01' }
  assert.equal(billingLabel(expired, now).title, 'Complimentary ended')
  assert.match(accessDetail(expired, now), /^Complimentary access ended /)
  assert.equal(accessDetail({ is_admin: true }, now), 'Admin access exemption')
  assert.equal(accessDetail({ sub_status: 'past_due' }, now), 'Paid access paused while payment needs attention')
})
