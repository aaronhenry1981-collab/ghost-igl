// Member names: validation, the backfill's split/keep/review rules, and the
// admin name route (profile name fields only, audited, admins only).
// DynamoDB, Cognito and the JWT verifier are stubbed; all people fictional.
import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanNamePart, decideName, nameFieldsOf, splitFullName, validateNameEdit } from './member-names.mjs'

Object.assign(process.env, {
  STRIPE_SECRET_KEY: ['sk', 'test', 'fixture'].join('_'),
  COGNITO_USER_POOL_ID: 'us-east-1_FIXTURE', COGNITO_CLIENT_ID: 'fixture-client',
  AWS_ACCESS_KEY_ID: 'fixture', AWS_SECRET_ACCESS_KEY: 'fixture', AWS_REGION: 'us-east-1', AWS_ENDPOINT_URL: 'http://127.0.0.1:9',
})
delete process.env.AWS_PROFILE

test('name parts are trimmed and collapsed, capitalisation kept, bad input refused', () => {
  assert.equal(cleanNamePart('  Mary   Ann  '), 'Mary Ann')
  assert.equal(cleanNamePart('mcDonald'), 'mcDonald', 'stored as the person wrote it')
  assert.equal(cleanNamePart(''), '')
  assert.throws(() => cleanNamePart('a'.repeat(101)), /longer than 100/)
  assert.throws(() => cleanNamePart('x\u0007y'), /control characters/)
  assert.throws(() => cleanNamePart('someone@example.test'), /email/)
  assert.deepEqual(validateNameEdit({ first_name: ' Zoë ', last_name: '' }), { first: 'Zoë', last: '' }, 'single-name member')
})

test('only an unambiguous two-word name is split; everything else goes to review', () => {
  assert.deepEqual(splitFullName('Jordan  Reyes'), { status: 'split', first: 'Jordan', last: 'Reyes' })
  assert.deepEqual(splitFullName("Siobhán O'Neill-Park"), { status: 'split', first: 'Siobhán', last: "O'Neill-Park" })
  assert.equal(splitFullName('Madonna').status, 'ambiguous', 'one word could be a handle')
  assert.equal(splitFullName('Mary Ann Van Dyke').status, 'ambiguous')
  assert.equal(splitFullName('xX Slayer99 Xx').status, 'ambiguous')
  assert.equal(splitFullName('').status, 'empty')
})

test('backfill decision: existing names win, sources agree or go to review, never guessed', () => {
  assert.deepEqual(decideName({ first_name: 'Kept' }, [{ source: 'stripe', full: 'Other Person' }]), { action: 'keep' })
  assert.deepEqual(decideName({}, [{ source: 'cognito', full: 'Jordan Reyes' }, { source: 'stripe', full: 'jordan reyes' }]), { action: 'set', first: 'Jordan', last: 'Reyes', source: 'cognito' }, 'same name, different case: one answer')
  const conflict = decideName({}, [{ source: 'cognito', full: 'Jordan Reyes' }, { source: 'stripe', full: 'Maria Reyes' }])
  assert.equal(conflict.action, 'review', 'a card-holder name that differs is not assumed to be the player')
  assert.equal(conflict.candidates.length, 2)
  assert.deepEqual(decideName({}, [{ source: 'cognito', given: 'Ana', family: '' }]), { action: 'set', first: 'Ana', last: '', source: 'cognito' })
  assert.equal(decideName({}, [{ source: 'stripe', full: 'Madonna' }]).action, 'review')
  assert.deepEqual(decideName({}, []), { action: 'missing' })
})

test('record fields: member-entered names without a source are labelled member', () => {
  assert.equal(nameFieldsOf({ first_name: 'A' }).name_source, 'member')
  assert.equal(nameFieldsOf({ first_name: 'A', name_source: 'admin' }).name_source, 'admin')
  assert.deepEqual(nameFieldsOf({ name_review: '[{"source":"stripe","value":"Madonna","reason":"one word"}]' }).name_review, [{ source: 'stripe', value: 'Madonna', reason: 'one word' }])
  assert.equal(nameFieldsOf(null).name_source, null)
})

// ---- the route, through the real handler ----
const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb')
const { CognitoJwtVerifier } = await import('aws-jwt-verify')
const writes = []
const auditLog = []
const auditScans = []
let auditRows = []
let profile = null
let proto = DynamoDBDocumentClient.prototype
while (proto && !Object.prototype.hasOwnProperty.call(proto, 'send')) proto = Object.getPrototypeOf(proto)
proto.send = async function (cmd) {
  const { TableName } = cmd.input
  if (TableName === 'ghost-igl-audit-log' && cmd.constructor.name === 'ScanCommand') {
    auditScans.push(cmd.input)
    const v = cmd.input.ExpressionAttributeValues || {}
    return { Items: auditRows.filter((r) => (!v[':t'] || r.target === v[':t']) && (!v[':a'] || r.action === v[':a'])) }
  }
  if (TableName === 'ghost-igl-audit-log') { auditLog.push(cmd.input.Item); return {} }
  if (cmd.constructor.name === 'GetCommand') return { Item: profile ? { ...profile } : undefined }
  if (cmd.constructor.name === 'UpdateCommand') {
    writes.push(cmd.input)
    const v = cmd.input.ExpressionAttributeValues
    profile = { ...(profile || { email: cmd.input.Key.email }), name_source: v[':src'] }
    if (v[':first']) profile.first_name = v[':first']; else delete profile.first_name
    if (v[':last']) profile.last_name = v[':last']; else delete profile.last_name
    return { Attributes: { ...profile } }
  }
  throw new Error(`unexpected ${cmd.constructor.name} ${TableName}`)
}
let groups = ['admins']
const vp = Object.getPrototypeOf(CognitoJwtVerifier.create({ userPoolId: 'us-east-1_FIXTURE', tokenUse: 'id', clientId: 'fixture-client' }))
vp.verify = async () => ({ email: 'admin@example.test', 'cognito:groups': groups })
const { handler, enrichUsersWithStripe } = await import('./index.mjs')
const call = (body) => handler({ requestContext: { http: { method: 'POST', path: '/prod/admin/users/name' } }, headers: { authorization: 'Bearer t' }, body: JSON.stringify(body) })
const getAudit = (target) => handler({ requestContext: { http: { method: 'GET', path: '/prod/admin/audit' } }, headers: { authorization: 'Bearer t' }, queryStringParameters: target ? { target } : undefined })

test('the name route updates ONLY name fields on the profile and audits before/after', async () => {
  profile = { email: 'player.one@example.test', display_name: 'P1', stripe_customer_id: 'must-not-change' }
  writes.length = 0; auditLog.length = 0; groups = ['admins']
  const r = await call({ email: 'Player.One@Example.test', first_name: '  Jordan ', last_name: 'Reyes' })
  assert.equal(r.statusCode, 200)
  assert.equal(writes.length, 1)
  const w = writes[0]
  assert.equal(w.TableName, 'ghost-igl-profiles')
  assert.deepEqual(w.Key, { email: 'player.one@example.test' }, 'the email is the key and is lower-cased, never changed')
  const [setPart, removePart = ''] = w.UpdateExpression.split(' REMOVE ')
  const touched = [
    ...setPart.replace(/^SET /, '').split(/,\s*(?![^()]*\))/).map((x) => x.split('=')[0].trim()),
    ...removePart.split(',').map((x) => x.trim()),
  ].filter(Boolean)
  for (const f of touched) assert.match(f, /^(first_name|last_name|name_source|name_updated_at|name_updated_by|name_review|updated_at|created_at)$/, `unexpected field ${f}`)
  assert.equal(auditLog[0].action, 'user.name.update')
  assert.deepEqual(auditLog[0].details.after, { first_name: 'Jordan', last_name: 'Reyes' })
  assert.equal(JSON.parse(r.body).name_source, 'admin')
})

test('a single-name member keeps one field; invalid input is refused; non-admins get 403', async () => {
  profile = { email: 'single@example.test', first_name: 'Old', last_name: 'Name' }
  writes.length = 0
  const r = await call({ email: 'single@example.test', first_name: 'Cher', last_name: '' })
  assert.equal(r.statusCode, 200)
  assert.match(writes[0].UpdateExpression, /REMOVE .*last_name/)
  assert.equal((await call({ email: 'single@example.test', first_name: 'a@b.c' })).statusCode, 400)
  assert.equal((await call({ email: 'not-an-email', first_name: 'A' })).statusCode, 400)
  groups = []
  writes.length = 0
  assert.equal((await call({ email: 'single@example.test', first_name: 'X' })).statusCode, 403)
  assert.equal(writes.length, 0)
  groups = ['admins']
})

test('an account removed in the console keeps its records: name edits are refused, nothing written', async () => {
  auditRows = [{ id: 'a1', action: 'user.delete', target: 'removed@example.test', timestamp: '2026-07-01T00:00:00Z' }]
  profile = null
  writes.length = 0; auditLog.length = 0; groups = ['admins']
  const r = await call({ email: 'Removed@Example.test', first_name: 'New' })
  assert.equal(r.statusCode, 409)
  assert.equal(writes.length, 0, 'no profile row is created or changed')
  assert.equal(auditLog.length, 0)
  auditRows = []
})

test('audit route: admins only, newest first, one member history by lower-cased target', async () => {
  auditRows = [
    { id: 'e1', action: 'comp.grant', target: 'one@example.test', timestamp: '2026-09-01T00:00:00Z' },
    { id: 'e2', action: 'user.name.update', target: 'one@example.test', timestamp: '2026-09-02T00:00:00Z' },
    { id: 'e3', action: 'comp.grant', target: 'two@example.test', timestamp: '2026-09-03T00:00:00Z' },
  ]
  groups = ['admins']
  const all = JSON.parse((await getAudit()).body).events
  assert.deepEqual(all.map((e) => e.id), ['e3', 'e2', 'e1'])
  auditScans.length = 0
  const one = await getAudit('ONE@example.test')
  assert.equal(one.statusCode, 200)
  assert.deepEqual(JSON.parse(one.body).events.map((e) => e.id), ['e2', 'e1'])
  assert.equal(auditScans[0].ExpressionAttributeValues[':t'], 'one@example.test')
  groups = []
  assert.equal((await getAudit()).statusCode, 403)
  groups = ['admins']
  auditRows = []
})

test('members report how many Stripe customer records they have (duplicate-customer filter)', () => {
  const sub = (id, customer, status = 'active') => ({ id, status, customer: { id: customer, email: 'dup@example.test' }, items: { data: [{ price: { unit_amount: 1200 }, current_period_end: 1893456000 }] } })
  const [dup] = enrichUsersWithStripe([{ email: 'dup@example.test', stripe_customer_id: 'cus_A', plan: 'pro' }], [sub('sub_1', 'cus_A'), sub('sub_2', 'cus_B', 'canceled')])
  assert.equal(dup.stripe_customer_count, 2)
  assert.ok(dup.billing_alerts.includes('multiple_stripe_customers'))
  assert.equal(dup.live_subscription_count, 1)
  const [single] = enrichUsersWithStripe([{ email: 'one@example.test', stripe_customer_id: 'cus_C', plan: 'pro' }], [])
  assert.equal(single.stripe_customer_count, 1)
  assert.deepEqual(single.billing_alerts, [])
})
