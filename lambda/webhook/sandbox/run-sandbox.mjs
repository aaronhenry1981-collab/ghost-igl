// Stripe SANDBOX verification for the membership-row fix (PR #33).
//
// Unlike the mocked tests, this uses REAL Stripe test-mode objects and the REAL
// events Stripe emits for them (the account's actual API version and payload
// shapes), fed to the real handler step by step. DynamoDB and Cognito stay
// in-memory, so nothing here can touch production data. Live keys are
// refused, and every event must report livemode=false. Nothing runs in CI.
//
// Secure local setup (never paste a key into chat or a file):
//   powershell -ExecutionPolicy Bypass -File <recovery>\entitlement-check-2026-09-27\run-sandbox.ps1
// (prompts for an sk_test_/rk_test_ key with masked input and clears it after).
// It creates a test clock (plus a product/prices tagged recon6-sandbox) and
// deletes the clock at the end, which removes its customer and subscriptions.
//
// Steps (each checked against the membership row):
//   1 checkout of sub A (Pro)                 -> row owner A, active
//   2 renewal fails                           -> row past_due
//   3 recovery: the open invoice is paid      -> row active again
//   4 renewal fails again                     -> row past_due
//   5 replacement: sub B (Elite) + checkout    -> row owner B, active
//   6 duplicate: sub C (Elite) + checkout      -> C cancelled in Stripe, row stays B
//   7 old sub A is cancelled                  -> row stays B, active
//   8 owner B is cancelled                    -> row canceled
//   9 every event again, shuffled, on a fresh table, then all redelivered in
//     reverse on top                          -> row canceled, no further cancels

import { randomBytes } from 'node:crypto'
import { assertTestEvent, hasExpectedEvents } from './sandbox-support.mjs'
import { createFakeDynamo } from '../test-support/fakeDynamo.mjs'

const key = process.env.STRIPE_SANDBOX_KEY || ''
if (!/^(sk|rk)_test_/.test(key)) {
  console.error('STRIPE_SANDBOX_KEY must be a TEST-mode key (sk_test_… or rk_test_…). Live keys are refused.')
  process.exit(2)
}
const WHSEC = `whsec_${randomBytes(24).toString('hex')}` // events are signed locally
Object.assign(process.env, {
  STRIPE_SECRET_KEY: key, STRIPE_WEBHOOK_SECRET: WHSEC, COGNITO_USER_POOL_ID: 'us-east-1_SANDBOX',
  AWS_ACCESS_KEY_ID: 'AKIATESTONLY', AWS_SECRET_ACCESS_KEY: 'test-only', AWS_REGION: 'us-east-1', AWS_ENDPOINT_URL: 'http://127.0.0.1:9',
  BOOKING_API: 'http://127.0.0.1:9',
})
delete process.env.AWS_PROFILE

const Stripe = (await import('stripe')).default
const stripe = new Stripe(key)
const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb')
const { CognitoIdentityProviderClient } = await import('@aws-sdk/client-cognito-identity-provider')
const db = createFakeDynamo()
const ownerOf = (o, n) => { let p = o; while (p && !Object.prototype.hasOwnProperty.call(p, n)) p = Object.getPrototypeOf(p); return p }
for (const proto of new Set([ownerOf(DynamoDBDocumentClient.prototype, 'send'), ownerOf(CognitoIdentityProviderClient.prototype, 'send')])) {
  const orig = proto.send
  proto.send = function (cmd) {
    if (this instanceof DynamoDBDocumentClient) return db.send(cmd)
    if (this instanceof CognitoIdentityProviderClient) {
      if (cmd.constructor.name === 'AdminGetUserCommand') return Promise.resolve({ Username: 'sandbox', UserAttributes: [{ Name: 'sub', Value: '00000000-0000-4000-8000-000000000001' }] })
      return Promise.reject(new Error('sandbox: unexpected Cognito call'))
    }
    return orig.call(this, cmd)
  }
}
// Record every subscription cancel. The resource prototype is shared by all
// Stripe instances (including the handler's own), so this sees the handler's
// cancels; the harness cancels only in steps 7 and 8, outside the windows that
// steps 6 and 9 measure.
const setupStripe = new Stripe(key)
let handlerCancels = []
const subsProto = Object.getPrototypeOf(stripe.subscriptions)
const origCancel = subsProto.cancel
subsProto.cancel = function (id, ...rest) { handlerCancels.push(id); return origCancel.call(this, id, ...rest) }

const log = (...a) => console.log(...a)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const EMAIL = `sandbox-${Date.now()}@example.com`
const results = []
const check = (label, ok, detail) => { results.push([label, ok, detail]); log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`) }

async function advance(clock, seconds) {
  const target = (await setupStripe.testHelpers.testClocks.retrieve(clock.id)).frozen_time + seconds
  await setupStripe.testHelpers.testClocks.advance(clock.id, { frozen_time: target })
  for (let i = 0; i < 90; i++) { if ((await setupStripe.testHelpers.testClocks.retrieve(clock.id)).status === 'ready') return; await sleep(2000) }
  throw new Error('test clock did not become ready')
}

let clock
let product
const createdPrices = []
const allEvents = []
const seen = new Set()
async function collect(customerId, ownIds, { wantTypes = [], subscriptionId, timeoutMs = 60000 } = {}) {
  const deadline = Date.now() + timeoutMs
  const fresh = []
  for (;;) {
    for await (const e of setupStripe.events.list({ created: { gte: startTs }, limit: 100 })) {
      const o = e.data.object
      const related = o.customer === customerId || ownIds.has(o.id) || ownIds.has(o.subscription) || ownIds.has(o.parent?.subscription_details?.subscription)
      if (!related || seen.has(e.id)) continue
      assertTestEvent(e)
      seen.add(e.id); fresh.push(e); allEvents.push(e)
    }
    const complete = hasExpectedEvents(fresh, wantTypes, subscriptionId)
    if (complete) break
    if (Date.now() > deadline) throw new Error('Timed out waiting for fresh subscription events: ' + wantTypes.join(', '))
    await sleep(3000)
  }
  return fresh.sort((a, b) => a.created - b.created)
}

const startTs = Math.floor(Date.now() / 1000) - 5
try {
  product = await setupStripe.products.create({ name: 'recon6-sandbox membership', metadata: { recon6: 'sandbox' } })
  const pro = await setupStripe.prices.create({ product: product.id, unit_amount: 1200, currency: 'usd', recurring: { interval: 'month' } })
  createdPrices.push(pro.id)
  const elite = await setupStripe.prices.create({ product: product.id, unit_amount: 3900, currency: 'usd', recurring: { interval: 'month' } })
  createdPrices.push(elite.id)
  process.env.STRIPE_PRO_PRICE_ID = pro.id       // handler maps -> 'pro'
  process.env.STRIPE_CHAMPION_PRICE_ID = elite.id // handler maps -> 'elite'
  const { handler } = await import('../index.mjs')
  const signer = new Stripe('sk_test_signer_only')
  const deliver = async (evt) => {
    assertTestEvent(evt)
    const payload = JSON.stringify(evt)
    const sig = signer.webhooks.generateTestHeaderString({ payload, secret: WHSEC })
    const res = await handler({ headers: { 'stripe-signature': sig }, body: payload, isBase64Encoded: false })
    if (res.statusCode !== 200) throw new Error(`${evt.type} ${evt.id} -> HTTP ${res.statusCode}`)
  }
  // Checkout can't be completed headlessly: a checkout.session.completed carrying
  // the REAL subscription id stands in (the handler re-reads the subscription).
  const synthCheckout = (sub, t) => ({ id: `evt_sandbox_checkout_${sub}`, object: 'event', livemode: false, type: 'checkout.session.completed', created: t,
    data: { object: { id: `cs_sandbox_${sub}`, object: 'checkout.session', mode: 'subscription', customer: customerId, subscription: sub, customer_email: EMAIL, metadata: { email: EMAIL }, payment_status: 'paid' } } })

  clock = await setupStripe.testHelpers.testClocks.create({ frozen_time: Math.floor(Date.now() / 1000), name: 'recon6-sandbox' })
  const customer = await setupStripe.customers.create({ email: EMAIL, test_clock: clock.id })
  var customerId = customer.id
  const good = await setupStripe.paymentMethods.attach('pm_card_visa', { customer: customer.id })
  const bad = await setupStripe.paymentMethods.attach('pm_card_chargeCustomerFail', { customer: customer.id })
  const useCard = async (pm, sub) => {
    await setupStripe.customers.update(customer.id, { invoice_settings: { default_payment_method: pm.id } })
    if (sub) await setupStripe.subscriptions.update(sub, { default_payment_method: pm.id })
  }
  const own = new Set()
  const row = () => db.get('ghost-igl-subscriptions', { stripe_customer_id: customer.id })
  const deliverFresh = async (opts) => { for (const e of await collect(customer.id, own, opts)) await deliver(e) }

  // 1 checkout A
  await useCard(good)
  const subA = await setupStripe.subscriptions.create({ customer: customer.id, items: [{ price: pro.id }], default_payment_method: good.id }); own.add(subA.id)
  await deliverFresh({ wantTypes: ['customer.subscription.created'] })
  await deliver(synthCheckout(subA.id, Math.floor(Date.now() / 1000)))
  check('1 checkout -> correct subscription', row()?.stripe_subscription_id === subA.id && row()?.status === 'active' && row()?.plan === 'pro', `${row()?.status}/${row()?.plan}`)

  // 2 renewal fails
  await useCard(bad, subA.id)
  await advance(clock, 32 * 86400)
  await deliverFresh({ wantTypes: ['invoice.payment_failed'], subscriptionId: subA.id })
  check('2 payment failure -> past_due (no access)', row()?.status === 'past_due', `row ${row()?.status}, Stripe ${(await setupStripe.subscriptions.retrieve(subA.id)).status}`)

  // 3 recovery: pay the open invoice with the good card
  await useCard(good, subA.id)
  const open = (await setupStripe.invoices.list({ subscription: subA.id, status: 'open', limit: 1 })).data[0]
  if (open) await setupStripe.invoices.pay(open.id, { payment_method: good.id })
  await deliverFresh({ wantTypes: ['invoice.paid'], subscriptionId: subA.id })
  check('3 recovery -> access restored', row()?.status === 'active' && row()?.stripe_subscription_id === subA.id, `row ${row()?.status}, Stripe ${(await setupStripe.subscriptions.retrieve(subA.id)).status}`)

  // 4 renewal fails again
  await useCard(bad, subA.id)
  await advance(clock, 31 * 86400)
  await deliverFresh({ wantTypes: ['invoice.payment_failed'], subscriptionId: subA.id })
  check('4 second failure -> past_due', row()?.status === 'past_due', `row ${row()?.status}`)

  // 5 replacement: Elite subscription B
  await useCard(good)
  const subB = await setupStripe.subscriptions.create({ customer: customer.id, items: [{ price: elite.id }], default_payment_method: good.id }); own.add(subB.id)
  await deliverFresh({})
  await deliver(synthCheckout(subB.id, Math.floor(Date.now() / 1000)))
  check('5 replacement subscription -> row owner B, active', row()?.stripe_subscription_id === subB.id && row()?.status === 'active' && row()?.plan === 'elite', `${row()?.status}/${row()?.plan}`)

  // 6 duplicate: another Elite subscription C on the same customer
  const subC = await setupStripe.subscriptions.create({ customer: customer.id, items: [{ price: elite.id }], default_payment_method: good.id }); own.add(subC.id)
  handlerCancels = []
  await deliverFresh({})
  await deliver(synthCheckout(subC.id, Math.floor(Date.now() / 1000)))
  const cStatus = (await setupStripe.subscriptions.retrieve(subC.id)).status
  check('6 duplicate checkout -> duplicate cancelled once, owner kept', cStatus === 'canceled' && handlerCancels.filter((x) => x === subC.id).length === 1 && row()?.stripe_subscription_id === subB.id && row()?.status === 'active', `C ${cStatus}, handler cancels ${handlerCancels.length}, row owner ${row()?.stripe_subscription_id === subB.id ? 'B' : '?'}`)
  await deliverFresh({})

  // 7 old subscription A is cancelled
  await setupStripe.subscriptions.cancel(subA.id)
  await deliverFresh({ wantTypes: ['customer.subscription.deleted'], subscriptionId: subA.id })
  check('7 old subscription cancelled -> owner B unaffected', row()?.stripe_subscription_id === subB.id && row()?.status === 'active', `${row()?.status}`)

  // 8 owner B is cancelled
  await setupStripe.subscriptions.cancel(subB.id)
  await deliverFresh({ wantTypes: ['customer.subscription.deleted'], subscriptionId: subB.id })
  check('8 owner cancelled -> no access', row()?.stripe_subscription_id === subB.id && row()?.status === 'canceled', `${row()?.status}`)

  // 9 replay and out-of-order delivery on a fresh table
  const stream = [...allEvents, synthCheckout(subA.id, 0), synthCheckout(subB.id, 0), synthCheckout(subC.id, 0)]
  handlerCancels = []
  db.reset()
  for (const e of [...stream].sort(() => (randomBytes(1)[0] & 1 ? 1 : -1))) await deliver(e)
  for (const e of [...stream].reverse()) await deliver(e)
  check('9 shuffled replay + reverse redelivery -> no access, no further cancels', row()?.status === 'canceled' && handlerCancels.length === 0, `${row()?.status}, cancels ${handlerCancels.length}`)

  // Evidence about the account itself
  const apiVersions = [...new Set(allEvents.map((e) => e.api_version))]
  const inv = allEvents.find((e) => e.type.startsWith('invoice.'))?.data.object
  const invoiceShape = !inv ? 'no invoice event' : inv.subscription ? 'invoice.subscription (pre-basil)' : inv.parent?.subscription_details ? 'invoice.parent.subscription_details (basil+)' : 'other'
  const periodShape = allEvents.find((e) => e.type.startsWith('customer.subscription.'))?.data.object
  const liveTouched = allEvents.some((e) => e.livemode !== false)
  log(`EVIDENCE ${JSON.stringify({ events: allEvents.length, apiVersions, invoiceShape, subscriptionPeriodEndOn: periodShape?.current_period_end ? 'subscription' : periodShape?.items?.data?.[0]?.current_period_end ? 'item' : 'unknown', eventTypes: [...new Set(allEvents.map((e) => e.type))].sort(), liveTouched })}`)
  check('no live-mode object or event touched', !liveTouched)
  const failed = results.filter((r) => !r[1]).length
  log(`RESULT ${results.length - failed}/${results.length} steps passed`)
  process.exitCode = failed ? 1 : 0
} finally {
  const cleanup = async (label, task) => { try { await task() } catch { console.error(label + ' cleanup failed'); process.exitCode = 1 } }
  if (clock) await cleanup('clock', () => setupStripe.testHelpers.testClocks.del(clock.id))
  for (const id of createdPrices) await cleanup('price', () => setupStripe.prices.update(id, { active: false }))
  if (product) await cleanup('product', () => setupStripe.products.update(product.id, { active: false }))
}
