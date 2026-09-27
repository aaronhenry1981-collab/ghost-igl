// Stripe SANDBOX verification for the membership-row ownership fix.
//
// Unlike the mocked tests, this uses REAL Stripe test-mode objects and REAL
// events (with the account's actual API version and payload shapes). DynamoDB
// and Cognito stay in-memory: nothing here can touch production data.
// It refuses any live key. Nothing runs in CI.
//
// Secure local setup (never paste a key into chat or a file):
//   1. Stripe Dashboard → switch to a Sandbox (or Test mode) → Developers → API keys
//      → reveal the TEST secret key (sk_test_…). A live key is refused below.
//   2. Windows PowerShell, from lambda/webhook (deps: npm ci --omit=dev):
//        $k = Read-Host -AsSecureString "Stripe TEST secret key"
//        $env:STRIPE_SANDBOX_KEY = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($k))
//        node sandbox/run-sandbox.mjs
//        Remove-Item Env:STRIPE_SANDBOX_KEY
//   3. It creates a test clock (and a product/prices tagged recon6-sandbox) and
//      deletes the clock at the end, which removes its customer and subscriptions.
//
// Scenario (the production defect): member on sub A fails a renewal (past_due),
// buys sub B, then A is cancelled. Every real event Stripe emitted is fed to
// the real handler in delivery order, then again SHUFFLED and REPLAYED. The
// row must end owned by B, active, plan elite. Also reports the event
// api_version and which invoice shape (invoice.subscription vs
// parent.subscription_details) the account actually sends.

import { randomBytes } from 'node:crypto'
import { createFakeDynamo } from '../test-support/fakeDynamo.mjs'

const key = process.env.STRIPE_SANDBOX_KEY || ''
if (!/^(sk|rk)_test_/.test(key)) {
  console.error('STRIPE_SANDBOX_KEY must be a TEST-mode key (sk_test_… or rk_test_…). Live keys are refused.')
  process.exit(2)
}
// The handler reads these at import. Local signing secret: events are signed here.
const WHSEC = `whsec_${randomBytes(24).toString('hex')}`
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

const log = (...a) => console.log(...a)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const EMAIL = `sandbox-${Date.now()}@example.com`
const start = Math.floor(Date.now() / 1000) - 5

async function advance(clock, seconds) {
  const target = (await stripe.testHelpers.testClocks.retrieve(clock.id)).frozen_time + seconds
  await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: target })
  for (let i = 0; i < 60; i++) { if ((await stripe.testHelpers.testClocks.retrieve(clock.id)).status === 'ready') return; await sleep(2000) }
  throw new Error('test clock did not become ready')
}

let clock
try {
  const product = await stripe.products.create({ name: 'recon6-sandbox membership', metadata: { recon6: 'sandbox' } })
  const pro = await stripe.prices.create({ product: product.id, unit_amount: 1200, currency: 'usd', recurring: { interval: 'month' } })
  const elite = await stripe.prices.create({ product: product.id, unit_amount: 3900, currency: 'usd', recurring: { interval: 'month' } })
  process.env.STRIPE_PRO_PRICE_ID = pro.id       // getPlanFromPrice -> 'pro'
  process.env.STRIPE_CHAMPION_PRICE_ID = elite.id // getPlanFromPrice -> 'elite'
  const { handler } = await import('../index.mjs')

  clock = await stripe.testHelpers.testClocks.create({ frozen_time: Math.floor(Date.now() / 1000), name: 'recon6-sandbox' })
  const customer = await stripe.customers.create({ email: EMAIL, test_clock: clock.id })
  const good = await stripe.paymentMethods.attach('pm_card_visa', { customer: customer.id })
  await stripe.customers.update(customer.id, { invoice_settings: { default_payment_method: good.id } })
  const subA = await stripe.subscriptions.create({ customer: customer.id, items: [{ price: pro.id }] })
  log('sub A', subA.id, subA.status)

  // Checkout can't be completed headlessly: a checkout.session.completed with the
  // REAL subscription id stands in for it (the handler re-reads the subscription).
  const syntheticCheckout = (sub, t) => ({ id: `evt_sandbox_checkout_${sub}`, object: 'event', type: 'checkout.session.completed', created: t,
    data: { object: { id: `cs_sandbox_${sub}`, object: 'checkout.session', mode: 'subscription', customer: customer.id, subscription: sub, customer_email: EMAIL, metadata: { email: EMAIL }, payment_status: 'paid' } } })

  const bad = await stripe.paymentMethods.attach('pm_card_chargeCustomerFail', { customer: customer.id })
  await stripe.customers.update(customer.id, { invoice_settings: { default_payment_method: bad.id } })
  await stripe.subscriptions.update(subA.id, { default_payment_method: bad.id })
  await advance(clock, 32 * 86400) // renewal fails -> past_due
  log('sub A after renewal:', (await stripe.subscriptions.retrieve(subA.id)).status)

  const subB = await stripe.subscriptions.create({ customer: customer.id, items: [{ price: elite.id }], default_payment_method: good.id })
  log('sub B', subB.id, subB.status)
  await stripe.subscriptions.cancel(subA.id)
  await sleep(5000)

  const events = []
  for await (const e of stripe.events.list({ created: { gte: start }, limit: 100 })) {
    const o = e.data.object
    if (o.customer === customer.id || o.id === customer.id) events.push(e)
  }
  events.sort((a, b) => a.created - b.created)
  const shapes = { apiVersions: [...new Set(events.map((e) => e.api_version))], types: {} }
  for (const e of events) shapes.types[e.type] = (shapes.types[e.type] || 0) + 1
  const inv = events.find((e) => e.type.startsWith('invoice.'))?.data.object
  shapes.invoiceShape = inv ? (inv.subscription ? 'invoice.subscription (pre-basil)' : inv.parent?.subscription_details ? 'parent.subscription_details (basil+)' : 'none') : 'no invoice event'
  log('real events:', JSON.stringify(shapes))

  const signer = new Stripe('sk_test_signer_only')
  const deliver = async (evt) => {
    const payload = JSON.stringify(evt)
    const sig = signer.webhooks.generateTestHeaderString({ payload, secret: WHSEC })
    const res = await handler({ headers: { 'stripe-signature': sig }, body: payload, isBase64Encoded: false })
    if (res.statusCode !== 200) throw new Error(`${evt.type} ${evt.id} -> HTTP ${res.statusCode}`)
  }
  const tA = events.find((e) => e.data.object.id === subA.id)?.created ?? start
  const tB = events.find((e) => e.data.object.id === subB.id)?.created ?? start
  const stream = [syntheticCheckout(subA.id, tA), ...events, syntheticCheckout(subB.id, tB)].sort((a, b) => a.created - b.created)

  const row = () => db.get('ghost-igl-subscriptions', { stripe_customer_id: customer.id })
  const results = []
  const check = (label) => { const r = row(); const ok = r?.stripe_subscription_id === subB.id && r?.status === 'active' && r?.plan === 'elite'; results.push([label, ok, r ? `${r.stripe_subscription_id === subB.id ? 'B' : r.stripe_subscription_id === subA.id ? 'A' : '?'}/${r.status}/${r.plan}` : 'no row']) }
  for (const e of stream) await deliver(e)
  check('delivery order')
  const shuffled = [...stream].sort(() => (randomBytes(1)[0] & 1 ? 1 : -1))
  db.reset(); for (const e of shuffled) await deliver(e); check('shuffled order')
  for (const e of [...stream].reverse()) await deliver(e); check('replayed in reverse on top')
  for (const [label, ok, state] of results) log(`${ok ? 'PASS' : 'FAIL'}  ${label}: row ${state}`)
  process.exitCode = results.every((r) => r[1]) ? 0 : 1
} finally {
  if (clock) await stripe.testHelpers.testClocks.del(clock.id).catch((e) => console.error('clock cleanup failed:', e.message))
}
