import test from 'node:test'
import assert from 'node:assert/strict'
import { validateWorkbookPurchase, workbookIntegrationIdentifier } from './workbook-purchase.mjs'

const priceId = 'price_workbook'
const paidSession = {
  id: 'cs_live_example',
  mode: 'payment',
  payment_status: 'paid',
  customer_details: { email: 'Player@Example.com' },
  metadata: { kind: 'beginner_workbook', email: 'player@example.com' },
}
const lineItems = [{ price: { id: priceId } }]

test('accepts a paid workbook purchase for the signed-in email', () => {
  const result = validateWorkbookPurchase({
    session: paidSession,
    lineItems,
    accountEmail: 'player@example.com',
    expectedPriceId: priceId,
  })
  assert.equal(result.ok, true)
  assert.equal(result.email, 'player@example.com')
})
test('rejects a session owned by a different email', () => {
  const result = validateWorkbookPurchase({
    session: paidSession,
    lineItems,
    accountEmail: 'someone-else@example.com',
    expectedPriceId: priceId,
  })
  assert.equal(result.ok, false)
  assert.match(result.error, /same email/i)
})

test('rejects unpaid and wrong-product sessions', () => {
  assert.equal(validateWorkbookPurchase({
    session: { ...paidSession, payment_status: 'unpaid' },
    lineItems,
    accountEmail: 'player@example.com',
    expectedPriceId: priceId,
  }).ok, false)
  assert.equal(validateWorkbookPurchase({
    session: paidSession,
    lineItems: [{ price: { id: 'price_other' } }],
    accountEmail: 'player@example.com',
    expectedPriceId: priceId,
  }).ok, false)
})

test('checkout integration identifier has an eight-letter suffix', () => {
  assert.match(workbookIntegrationIdentifier(), /^recon6_workbook_[a-z]{8}$/)
})
