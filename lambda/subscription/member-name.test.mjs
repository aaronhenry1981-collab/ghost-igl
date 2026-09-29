// PUT /me name edits: a name the member changes becomes member-sourced,
// clears a pending admin review and is audited; resending unchanged names
// (every Account save does) leaves the name metadata alone. Only profile name
// fields change. DynamoDB and the JWT verifier are stubbed; people fictional.
import test from 'node:test'
import assert from 'node:assert/strict'

Object.assign(process.env, {
  COGNITO_USER_POOL_ID: 'us-east-1_FIXTURE', COGNITO_CLIENT_ID: 'fixture-client',
  AWS_ACCESS_KEY_ID: 'fixture', AWS_SECRET_ACCESS_KEY: 'fixture', AWS_REGION: 'us-east-1', AWS_ENDPOINT_URL: 'http://127.0.0.1:9',
})
delete process.env.AWS_PROFILE

const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb')
const { CognitoJwtVerifier } = await import('aws-jwt-verify')

const EMAIL = 'member.one@example.test'
let profile = {}
let audits = []
let failAudit = false
const profileWrites = []

// Minimal UpdateExpression applier: SET a = :v | if_not_exists(...), REMOVE a, b.
function applyUpdate(item, input) {
  const names = input.ExpressionAttributeNames || {}
  const values = input.ExpressionAttributeValues || {}
  const name = (n) => names[n] || n
  const [setPart, removePart = ''] = input.UpdateExpression.split(' REMOVE ')
  for (const clause of setPart.replace(/^SET /, '').split(/,\s*(?![^()]*\))/)) {
    const [left, right] = clause.split('=').map((x) => x.trim())
    const key = name(left)
    if (right.startsWith('if_not_exists')) { if (item[key] === undefined) item[key] = values[right.match(/(:\w+)\)$/)[1]] } else item[key] = values[right]
  }
  for (const r of removePart.split(',').map((x) => x.trim()).filter(Boolean)) delete item[name(r)]
}

let proto = DynamoDBDocumentClient.prototype
while (proto && !Object.prototype.hasOwnProperty.call(proto, 'send')) proto = Object.getPrototypeOf(proto)
proto.send = async function (cmd) {
  const { TableName } = cmd.input
  const kind = cmd.constructor.name
  if (kind === 'QueryCommand') return { Items: [] } // no subscription rows
  if (TableName === 'ghost-igl-audit-log' && kind === 'PutCommand') {
    if (failAudit) throw new Error('audit unavailable')
    audits.push(cmd.input.Item)
    return {}
  }
  if (TableName === 'ghost-igl-profiles' && kind === 'GetCommand') return { Item: { ...profile } }
  if (TableName === 'ghost-igl-profiles' && kind === 'UpdateCommand') {
    if (cmd.input.ConditionExpression?.includes('cognito_sub')) { applyUpdate(profile, cmd.input); return {} }
    profileWrites.push(cmd.input)
    applyUpdate(profile, cmd.input)
    return {}
  }
  throw new Error(`unexpected ${kind} ${TableName}`)
}
const vp = Object.getPrototypeOf(CognitoJwtVerifier.create({ userPoolId: 'us-east-1_FIXTURE', tokenUse: 'id', clientId: 'fixture-client' }))
vp.verify = async () => ({ email: EMAIL, email_verified: true, sub: 'sub-member-one' })
const { handler } = await import('./index.mjs')
const putMe = (body) => handler({ requestContext: { http: { method: 'PUT', path: '/prod/me' } }, headers: { authorization: 'Bearer t', origin: 'https://r6coaching.com' }, body: JSON.stringify(body) })

function reset(start) {
  profile = { email: EMAIL, cognito_sub: 'sub-member-one', referral_code: 'keep-me', display_name: 'P1', ...start }
  audits = []
  profileWrites.length = 0
  failAudit = false
}

test('a member-entered name is member-sourced, clears the admin review, and is audited', async () => {
  reset({ name_review: '[{"source":"stripe","value":"Slayer","reason":"one word"}]' })
  const r = await putMe({ first_name: '  Jordan  ', last_name: 'Reyes' })
  assert.equal(r.statusCode, 200)
  assert.equal(profile.first_name, 'Jordan', 'whitespace collapsed')
  assert.equal(profile.last_name, 'Reyes')
  assert.equal(profile.name_source, 'member')
  assert.equal(profile.name_updated_by, 'member')
  assert.ok(profile.name_updated_at)
  assert.equal(profile.name_review, undefined, 'pending review cleared')
  assert.equal(profile.referral_code, 'keep-me')
  assert.equal(profile.display_name, 'P1')
  assert.equal(audits.length, 1)
  assert.deepEqual({ action: audits[0].action, actor: audits[0].actor, target: audits[0].target }, { action: 'user.name.update', actor: EMAIL, target: EMAIL })
  assert.deepEqual(audits[0].details, { by: 'member', before: { first_name: null, last_name: null }, after: { first_name: 'Jordan', last_name: 'Reyes' } })
})

test('re-saving unchanged names (any Account save) keeps an admin correction as it is', async () => {
  reset({ first_name: 'Jordan', last_name: 'Reyes', name_source: 'admin', name_updated_by: 'owner@example.test' })
  const r = await putMe({ first_name: 'Jordan', last_name: 'Reyes', platform: 'PC' })
  assert.equal(r.statusCode, 200)
  assert.equal(profile.platform, 'PC')
  assert.equal(profile.name_source, 'admin')
  assert.equal(profile.name_updated_by, 'owner@example.test')
  assert.equal(audits.length, 0)
  assert.doesNotMatch(profileWrites[0].UpdateExpression, /name_source|#nsrc/)
})

test('a single-name member, and a member removing their name', async () => {
  reset({ first_name: 'Old', last_name: 'Name', name_source: 'cognito' })
  assert.equal((await putMe({ first_name: 'Cher', last_name: '' })).statusCode, 200)
  assert.equal(profile.first_name, 'Cher')
  assert.equal(profile.last_name, undefined)
  assert.equal(profile.name_source, 'member')
  assert.equal((await putMe({ first_name: '', last_name: '' })).statusCode, 200)
  assert.equal(profile.first_name, undefined)
  assert.equal(profile.name_source, undefined, 'no source claimed for an empty name')
  assert.equal(audits.length, 2)
})

test('an email in a name field is refused and nothing is written', async () => {
  reset({})
  const r = await putMe({ first_name: 'me@example.test' })
  assert.equal(r.statusCode, 400)
  assert.equal(profileWrites.length, 0)
  assert.equal(audits.length, 0)
})

test('a failed audit write never fails the member save', async () => {
  reset({})
  failAudit = true
  const r = await putMe({ first_name: 'Ana', last_name: 'Lima' })
  assert.equal(r.statusCode, 200)
  assert.equal(profile.first_name, 'Ana')
})
