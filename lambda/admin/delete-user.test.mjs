// POST /admin/users/delete keeps the account's Cognito sub in its audit entry
// so the privacy tool can finish the purge (docs/PRIVACY-REQUESTS.md), and
// keeps its guards. DynamoDB and Cognito are stubbed; all ids are fictional.
import test from 'node:test'
import assert from 'node:assert/strict'

Object.assign(process.env, {
  STRIPE_SECRET_KEY: ['sk', 'test', 'fixture'].join('_'),
  COGNITO_USER_POOL_ID: 'us-east-1_FIXTURE', COGNITO_CLIENT_ID: 'fixture-client',
  AWS_ACCESS_KEY_ID: 'fixture', AWS_SECRET_ACCESS_KEY: 'fixture', AWS_REGION: 'us-east-1', AWS_ENDPOINT_URL: 'http://127.0.0.1:9',
})
delete process.env.AWS_PROFILE

const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb')
const { CognitoIdentityProviderClient } = await import('@aws-sdk/client-cognito-identity-provider')
const auditLog = []
let subRows = []
let groups = []
const cognitoCalls = []
// Both clients inherit one base `send`, so a single stub serves both.
const sendOf = (Cls) => { let p = Cls.prototype; while (p && !Object.prototype.hasOwnProperty.call(p, 'send')) p = Object.getPrototypeOf(p); return p }
const stub = async function (cmd) {
  const name = cmd.constructor.name
  if (name === 'ListUsersCommand') return { Users: [{ Username: 'u-fixture', Attributes: [{ Name: 'email', Value: 'gone@example.test' }, { Name: 'sub', Value: 'fixture-sub-1' }] }] }
  if (name === 'AdminListGroupsForUserCommand') return { Groups: groups.map((GroupName) => ({ GroupName })) }
  if (name === 'AdminDeleteUserCommand') { cognitoCalls.push(name); return {} }
  const { TableName, Item } = cmd.input
  if (TableName === 'ghost-igl-audit-log') { auditLog.push(Item); return {} }
  if (name === 'QueryCommand') return { Items: subRows }
  return {}
}
sendOf(DynamoDBDocumentClient).send = stub
sendOf(CognitoIdentityProviderClient).send = stub

const { deleteUser } = await import('./index.mjs')
const del = async (email) => {
  const r = await deleteUser(JSON.stringify({ email }), {}, 'admin@example.test')
  return { status: r.statusCode, body: JSON.parse(r.body) }
}

test('the audit entry records the Cognito sub and a pending privacy purge', async () => {
  auditLog.length = 0; subRows = [{ stripe_customer_id: 'cus_FIXTURE', status: 'canceled' }]; groups = []
  const r = await del('Gone@Example.test')
  assert.equal(r.status, 200)
  const entry = auditLog.at(-1)
  assert.equal(entry.action, 'user.delete')
  assert.equal(entry.target, 'gone@example.test')
  assert.equal(entry.details.cognito_sub, 'fixture-sub-1')
  assert.equal(entry.details.privacy_purge, 'pending')
})

test('admins and active paid members are still refused', async () => {
  auditLog.length = 0; cognitoCalls.length = 0; subRows = []; groups = ['admins']
  assert.equal((await del('gone@example.test')).status, 403)
  groups = []; subRows = [{ stripe_customer_id: 'cus_FIXTURE', status: 'active' }]
  assert.equal((await del('gone@example.test')).status, 409)
  assert.equal(cognitoCalls.length, 0, 'refusals never delete the sign-in')
  assert.equal(auditLog.length, 0, 'and write no deletion entry')
})
