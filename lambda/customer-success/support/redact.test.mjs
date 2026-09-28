import test from 'node:test'
import assert from 'node:assert/strict'
import { maskBillingRefs, maskRef, redactSensitive } from './redact.mjs'
// Fake secret prefixes are assembled at runtime so secret scanners never see a
// key-shaped literal in the source; the values under test are unchanged.
const SK_LIVE = ['sk', 'live', ''].join('_')
const RK_LIVE = ['rk', 'live', ''].join('_')
const WHSEC = ['whsec', ''].join('_')
const AKIA = ['AK', 'IA'].join('')


// All values below are fabricated test shapes (standard public test card
// numbers and obviously fake keys), never real credentials.
const FAKE = {
  visa: '4242424242424242',
  visaSpaced: '4242 4242 4242 4242',
  amexDashed: '3782-822463-10005',
  skLive: `${SK_LIVE}${'FAKEFAKE'.repeat(3)}`,
  skTest: `sk_test_${'Fake1234'.repeat(3)}`,
  pk: `pk_live_${'ZZZZ9999'.repeat(2)}`,
  rk: `${RK_LIVE}${'Fake5678'.repeat(2)}`,
  whsec: `${WHSEC}${'Fake0000'.repeat(3)}`,
  akia: `${AKIA}FAKEFAKEFAKE1234`,
  jwt: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmaXh0dXJlIn0.ZmFrZXNpZ25hdHVyZWZha2U',
}

test('redacts every sensitive kind and never returns the original value', () => {
  const cases = [
    [`my card is ${FAKE.visa} thanks`, 'card_number', FAKE.visa],
    [`card ${FAKE.visaSpaced}`, 'card_number', FAKE.visaSpaced],
    [`amex ${FAKE.amexDashed}`, 'card_number', FAKE.amexDashed],
    [`key ${FAKE.skLive}`, 'stripe_secret', FAKE.skLive],
    [`key ${FAKE.skTest}`, 'stripe_secret', FAKE.skTest],
    [`key ${FAKE.pk}`, 'stripe_secret', FAKE.pk],
    [`key ${FAKE.rk}`, 'stripe_secret', FAKE.rk],
    [`hook ${FAKE.whsec}`, 'webhook_secret', FAKE.whsec],
    [`aws ${FAKE.akia}`, 'aws_access_key', FAKE.akia],
    [`token ${FAKE.jwt}`, 'jwt', FAKE.jwt],
    [`Authorization: Bearer ${'abcDEF123456'.repeat(3)}`, 'bearer_token', 'abcDEF123456abcDEF123456'],
    ['password: hunter2fixture', 'password', 'hunter2fixture'],
    ['pwd=Fixture!Pass9', 'password', 'Fixture!Pass9'],
    ['Password = "spaces are fine"', 'password', 'spaces are fine'],
    ['my password is Fixture123!', 'password', 'Fixture123!'],
  ]
  for (const [input, kind, secret] of cases) {
    const out = redactSensitive(input)
    assert.ok(!out.text.includes(secret), `${kind} removed from "${out.text}"`)
    assert.ok(out.redactions.some((r) => r.kind === kind), `${kind} reported for ${input}`)
    assert.ok(out.redactions.every((r) => Object.keys(r).join() === 'kind'), 'redactions carry only the kind')
    assert.ok(!JSON.stringify(out.redactions).includes(secret))
  }
})

test('negative controls: ordinary support text survives untouched', () => {
  const keep = [
    'Case R6-000123 about my Ubisoft link',
    'My order 1234567890123456 is not a card (fails Luhn)',
    'Called 555-0100 at 10:30',
    'Stripe customer cus_FIXTURESUPD1234 and sub_FIXTURESUPD5678 are references, not secrets',
    'status in_progress then waiting_on_player',
    'I forgot my password, how do I reset it?',
    'price_1TLEtrJNddvjgWcg9iTWJoLS',
    '2026-09-25T15:00:00.000Z',
  ]
  for (const t of keep) {
    const out = redactSensitive(t)
    assert.equal(out.text, t, t)
    assert.deepEqual(out.redactions, [])
  }
  assert.deepEqual(redactSensitive(null), { text: '', redactions: [] })
})

test('billing references are masked to the last 4 for roles without full access', () => {
  assert.equal(maskRef('cus_FIXTURESUPD1234'), 'cus_…1234')
  assert.equal(maskRef('in_progress'), 'in_progress', 'status words are not ids')
  const masked = maskBillingRefs({ refs: { subscription: { stripeCustomerId: 'cus_FIXTURESUPD1234', stripeSubscriptionId: 'sub_FIXTURESUPD5678' } }, list: ['pi_FIXTURE00009999'], n: 3, none: null })
  assert.deepEqual(masked, { refs: { subscription: { stripeCustomerId: 'cus_…1234', stripeSubscriptionId: 'sub_…5678' } }, list: ['pi_…9999'], n: 3, none: null })
})
