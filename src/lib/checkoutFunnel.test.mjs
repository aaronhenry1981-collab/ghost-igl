import test from 'node:test'
import assert from 'node:assert/strict'

import { checkoutReturnEvent, rememberCheckoutStart } from './checkoutFunnel.js'

function memoryStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  }
}

test('a paid return is reported once, with the tier and CTA that started it', () => {
  const storage = memoryStorage()
  rememberCheckoutStart('pro', 'start-pricing', storage)

  assert.deepEqual(checkoutReturnEvent('success', storage), {
    name: 'Checkout Completed',
    props: { tier: 'pro', location: 'start-pricing' },
  })
  // Reloading the success page must not count a second purchase.
  assert.equal(checkoutReturnEvent('success', storage), null)
})

test('a cancelled return is reported without clearing the pending checkout', () => {
  const storage = memoryStorage()
  rememberCheckoutStart('elite', 'start-final', storage)

  assert.deepEqual(checkoutReturnEvent('cancelled', storage), {
    name: 'Checkout Cancelled',
    props: { tier: 'elite', location: 'start-final' },
  })
  assert.equal(checkoutReturnEvent('cancelled', storage), null)
  // Trying again and paying still counts.
  assert.equal(checkoutReturnEvent('success', storage)?.props.tier, 'elite')
})

test('a return with no remembered checkout still counts, as tier unknown', () => {
  assert.deepEqual(checkoutReturnEvent('success', memoryStorage()), {
    name: 'Checkout Completed',
    props: { tier: 'unknown' },
  })
})

test('other values of ?checkout= are ignored', () => {
  const storage = memoryStorage()
  assert.equal(checkoutReturnEvent('pro', storage), null)
  assert.equal(checkoutReturnEvent(null, storage), null)
})
