// Route-level safety of POST /admin/backfill (reconcile). DynamoDB and Stripe
// are stubbed in memory; nothing leaves the process. All ids are fictional.
import test from 'node:test'
import assert from 'node:assert/strict'

Object.assign(process.env, {
  STRIPE_SECRET_KEY: ['sk', 'test', 'fixture'].join('_'),
  COGNITO_USER_POOL_ID: 'us-east-1_FIXTURE', COGNITO_CLIENT_ID: 'fixture-client',
  AWS_ACCESS_KEY_ID: 'fixture', AWS_SECRET_ACCESS_KEY: 'fixture', AWS_REGION: 'us-east-1', AWS_ENDPOINT_URL: 'http://127.0.0.1:9',
})
delete process.env.AWS_PROFILE

const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb')
const table = new Map()
const writes = []
const auditLog = []
let proto = DynamoDBDocumentClient.prototype
while (proto && !Object.prototype.hasOwnProperty.call(proto, 'send')) proto = Object.getPrototypeOf(proto)
proto.send = async function (cmd) {
  const name = cmd.constructor.name
  const input = cmd.input
  if (input.TableName === 'ghost-igl-audit-log') { auditLog.push(input.Item); return {} }
  if (name === 'ScanCommand') return { Items: [...table.values()].map((r) => ({ ...r })) }
  if (name === 'UpdateCommand') {
    writes.push(input)
    const row = table.get(input.Key.stripe_customer_id)
    // Evaluate the "#fN = :bN" guards the route sends.
    for (const [alias, field] of Object.entries(input.ExpressionAttributeNames)) {
      const n = alias.match(/^#f(\d+)$/)?.[1]
      if (n !== undefined && `:b${n}` in input.ExpressionAttributeValues && row[field] !== input.ExpressionAttributeValues[`:b${n}`]) {
        const err = new Error('conditional'); err.name = 'ConditionalCheckFailedException'; throw err
      }
    }
    for (const [alias, field] of Object.entries(input.ExpressionAttributeNames)) {
      const n = alias.match(/^#f(\d+)$/)?.[1]
      if (n !== undefined) row[field] = input.ExpressionAttributeValues[`:a${n}`]
    }
    return {}
  }
  if (name === 'PutCommand') { writes.push(input); table.set(input.Item.stripe_customer_id, input.Item); return {} }
  throw new Error(`unexpected ${name}`)
}

const PRO = 'price_1TLEtrJNddvjgWcg9iTWJoLS'
let stripeSubs = []
globalThis.fetch = async (url) => {
  const u = String(url)
  if (u.startsWith('https://api.stripe.com/v1/subscriptions')) return { ok: true, json: async () => ({ data: stripeSubs, has_more: false }) }
  if (u.startsWith('https://api.stripe.com/v1/customers/')) return { ok: true, json: async () => ({ email: 'New.Member@Example.test' }) }
  throw new Error(`unexpected fetch ${u}`)
}

const { reconcileMemberships } = await import('./index.mjs')
const call = async (body) => {
  const r = await reconcileMemberships(body === undefined ? undefined : JSON.stringify(body), {}, 'admin@example.test')
  return { status: r.statusCode, body: JSON.parse(r.body) }
}

function seed() {
  table.clear(); writes.length = 0; auditLog.length = 0
  table.set('cus_A', { stripe_customer_id: 'cus_A', stripe_subscription_id: 'sub_A', plan: 'pro', status: 'past_due', current_period_end: '2026-10-01T00:00:00.000Z', vod_sessions_used: 4, cognito_sub: 'fixture-sub-a' })
  stripeSubs = [
    { id: 'sub_A', customer: 'cus_A', status: 'active', created: 1, current_period_end: 1790000000, items: { data: [{ price: { id: PRO } }] } },
    { id: 'sub_N', customer: 'cus_N', status: 'active', created: 2, current_period_end: 1790000000, items: { data: [{ price: { id: PRO } }] } },
  ]
}

test('the default is a read-only preview that is audited', async () => {
  seed()
  const r = await call(undefined)
  assert.equal(r.status, 200)
  assert.equal(r.body.mode, 'preview')
  assert.equal(r.body.counts.updates, 1)
  assert.equal(r.body.counts.creates, 1)
  assert.equal(r.body.confirmPhrase, 'APPLY 2 CHANGES')
  assert.equal(writes.length, 0, 'a preview writes nothing to the membership table')
  assert.equal(auditLog.at(-1).action, 'reconcile.preview')
})

test('apply needs the matching preview id and the exact phrase', async () => {
  seed()
  const { body: p } = await call({ mode: 'preview' })
  assert.equal((await call({ mode: 'apply', previewId: 'stale', confirm: p.confirmPhrase })).status, 409)
  assert.equal((await call({ mode: 'apply', previewId: p.previewId, confirm: 'yes' })).status, 400)
  assert.equal((await call({ mode: 'apply', previewId: p.previewId })).status, 400)
  assert.equal(writes.length, 0)
})

test('a confirmed apply writes only billing fields, keeps usage and identity, and audits each row', async () => {
  seed()
  const { body: p } = await call({ mode: 'preview' })
  const r = await call({ mode: 'apply', previewId: p.previewId, confirm: p.confirmPhrase })
  assert.deepEqual([r.status, r.body.applied, r.body.conflicts, r.body.failed], [200, 2, 0, 0])
  const a = table.get('cus_A')
  assert.equal(a.status, 'active')
  assert.equal(a.vod_sessions_used, 4)
  assert.equal(a.cognito_sub, 'fixture-sub-a')
  const update = writes.find((w) => w.Key)
  assert.ok(update.ConditionExpression.includes('attribute_exists(stripe_customer_id)'))
  assert.ok(!Object.values(update.ExpressionAttributeNames).includes('vod_sessions_used'))
  const created = table.get('cus_N')
  assert.equal(created.email, 'new.member@example.test')
  assert.equal(writes.find((w) => w.Item).ConditionExpression, 'attribute_not_exists(stripe_customer_id)')
  assert.deepEqual(auditLog.map((e) => e.action).sort(), ['reconcile.apply', 'reconcile.preview', 'reconcile.row', 'reconcile.row'])
})

test('a row changed after the preview is a conflict, not an overwrite', async () => {
  seed()
  const { body: p } = await call({ mode: 'preview' })
  // The webhook moves the row between preview and apply; the plan is
  // recomputed, so the preview id no longer matches and nothing is written.
  table.get('cus_A').status = 'canceled'
  const r = await call({ mode: 'apply', previewId: p.previewId, confirm: p.confirmPhrase })
  assert.equal(r.status, 409)
  assert.equal(writes.length, 0)
})
