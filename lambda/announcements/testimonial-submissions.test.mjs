import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { validateSubmission, publicTestimonial, moderateSubmission, rateRecord } from './testimonial-submissions.mjs'
const valid = { name: 'Fixture only', text: 'I used the Bank plan and understood my next job.', displayPreference: 'gamertag', honestExperience: true, quoteConsent: true }
const indexId = '__public_testimonials_v1__'
const legacyId = '2ac6e39f-ae37-47c0-a5fb-9b93a643a5fe'
function fixture() {
  const rows = new Map(), commands = []
  let collisionCount = 0
  class ScanCommand { constructor(input) { this.input = input } }
  class PutCommand { constructor(input) { this.input = input } }
  class DeleteCommand { constructor(input) { this.input = input } }
  class GetCommand { constructor(input) { this.input = input } }
  const send = async command => {
    commands.push(command); const x = command.input
    if (command instanceof ScanCommand) {
      const all = [...rows.values()], start = x.ExclusiveStartKey ? all.findIndex(r => r.id === x.ExclusiveStartKey.id) + 1 : 0
      const page = all.slice(start, start + (x.Limit || all.length))
      return { Items: structuredClone(page), LastEvaluatedKey: start + page.length < all.length ? { id: page.at(-1).id } : undefined }
    }
    if (command instanceof GetCommand) return { Item: structuredClone(rows.get(x.Key.id)) }
    if (command instanceof DeleteCommand) { rows.delete(x.Key.id); return {} }
    if (command instanceof PutCommand) {
      const prior = rows.get(x.Item.id); let fail = false
      if (x.ConditionExpression?.includes('next_allowed <= ')) fail = prior && prior.next_allowed > x.ExpressionAttributeValues[':now']
      else if (x.ConditionExpression === 'next_allowed = :admitted') fail = prior?.next_allowed !== x.ExpressionAttributeValues[':admitted']
      else if (x.ConditionExpression === '#status = :pending') fail = prior?.status !== 'pending'
      else if (x.ConditionExpression === 'revision = :revision') fail = prior?.revision !== x.ExpressionAttributeValues[':revision']
      else if (x.ConditionExpression === 'attribute_not_exists(id)') fail = !!prior
      if (x.Item.id === indexId && collisionCount > 0) { collisionCount--; fail = true }
      if (fail) throw Object.assign(new Error('conditional'), { name: 'ConditionalCheckFailedException' })
      rows.set(x.Item.id, structuredClone(x.Item)); return {}
    }
  }
  const context = { DynamoDBClient: class {}, DynamoDBDocumentClient: { from: () => ({ send }) }, ScanCommand, PutCommand, DeleteCommand, GetCommand,
    CognitoJwtVerifier: { create: () => ({ verify: async token => {
      if (['forged', 'expired', 'wrong-client', 'access-token'].includes(token)) throw Error('invalid')
      return { sub: token === 'missing-sub' ? undefined : token, 'cognito:groups': token === 'admin' ? ['admins'] : ['members'], email: 'fixture@example.invalid' }
    } }) }, process: { env: {} }, randomUUID, validateSubmission, publicTestimonial, moderateSubmission, rateRecord, Buffer, console: { error() {} }, Date }
  const code = readFileSync(new URL('./index.mjs', import.meta.url), 'utf8').replace(/^import .*$/gm, '').replace('export async function handler', 'async function handler')
  vm.runInNewContext(code + '\nthis.run=handler;', context)
  const request = (method, path, body, token = 'member', extra = {}) => context.run({ requestContext: { http: { method, path, sourceIp: '192.0.2.1' } }, headers: { origin: 'https://r6coaching.com', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(body), ...extra })
  return { rows, request, commands, collide: count => { collisionCount = count } }
}

test('signed-in customer persists pending with verified owner; public cannot see private fields', async () => {
  const f = fixture(), r = await f.request('POST', '/testimonials', { ...valid, submitted_by: 'spoof', email: 'private@example.invalid', outcome: 'Private context' })
  assert.equal(r.statusCode, 201); const { id } = JSON.parse(r.body)
  assert.equal(f.rows.get(id).submitted_by, 'member'); assert.equal(f.rows.get(id).status, 'pending')
  assert.deepEqual(JSON.parse((await f.request('GET', '/testimonials', undefined, null)).body).testimonials, [])
  assert.equal((await f.request('POST', '/admin/testimonials', { id, action: 'approve' }, 'admin')).statusCode, 200)
  const publicResponse = (await f.request('GET', '/testimonials')).body
  assert.match(publicResponse, /Fixture only/); assert.doesNotMatch(publicResponse, /private@example|Private context|submitted_by|consent_at|reviewed_by|next_allowed/)
  assert.equal((await f.request('POST', '/admin/testimonials', { id, action: 'approve' }, 'admin')).statusCode, 200)
})
test('missing, rejected or subjectless token cannot write; verifier remains ID-token and client scoped', async () => {
  const f = fixture()
  for (const token of [null, 'forged', 'expired', 'wrong-client', 'access-token', 'missing-sub']) assert.equal((await f.request('POST', '/testimonials', valid, token)).statusCode, 401)
  assert.equal(f.commands.length, 0)
  const source = readFileSync(new URL('./index.mjs', import.meta.url), 'utf8')
  assert.match(source, /tokenUse: 'id'/); assert.match(source, /clientId: process.env.COGNITO_CLIENT_ID/)
})
test('same account across IPs shares conditional limit; different accounts on one IP do not', async () => {
  const f = fixture()
  const result = await Promise.all([f.request('POST', '/testimonials', valid), f.request('POST', '/testimonials', valid, 'member', { requestContext: { http: { method: 'POST', path: '/testimonials', sourceIp: '192.0.2.99' } } })])
  assert.deepEqual(result.map(r => r.statusCode).sort(), [201, 429])
  assert.equal((await f.request('POST', '/testimonials', valid, 'second-member')).statusCode, 201)
  assert(![...f.rows.keys()].some(id => id.includes('192.0.2.')))
  const rate = f.rows.get(rateRecord('member').id); assert(rate.next_allowed > Date.now() + 14 * 60000)
})
test('malformed and oversized authenticated attempts consume admission before parsing', async () => {
  const f = fixture()
  assert.equal((await f.request('POST', '/testimonials', undefined, 'member', { body: '{' })).statusCode, 400)
  assert.equal((await f.request('POST', '/testimonials', valid)).statusCode, 429)
  assert.equal((await f.request('POST', '/testimonials', { ...valid, text: 'x'.repeat(8200) }, 'large')).statusCode, 413)
  assert.equal((await f.request('POST', '/testimonials', valid, 'large')).statusCode, 429)
  assert.equal([...f.rows.values()].filter(r => r.record_type === 'customer_submission').length, 0)
  const rate = f.rows.get(rateRecord('member').id); assert(rate.next_allowed <= Date.now() + 60000)
})
test('invalid text, honeypot and all photos are rejected; publication fields cannot be forged', async () => {
  const f = fixture()
  for (const [i, body] of [null, [], { ...valid, website: 'bot' }, { ...valid, text: 'short' }, { ...valid, honestExperience: false }, { ...valid, photo: 'data:image/jpeg;base64,/9j/2Q==', photoConsent: true }, { ...valid, photoConsent: true }, { ...valid, name: 'x'.repeat(61) }].entries()) assert.equal((await f.request('POST', '/testimonials', body, 'invalid-' + i)).statusCode, 400)
  const r = await f.request('POST', '/testimonials', { ...valid, status: 'approved', tier: 'champion', featured: true })
  const item = f.rows.get(JSON.parse(r.body).id); assert.equal(item.status, 'pending'); assert(!item.tier); assert(!item.featured); assert.equal(item.photo, null)
  assert.equal((await f.request('POST', '/testimonials', valid, 'another', { headers: { origin: 'https://example.invalid', authorization: 'Bearer another' } })).statusCode, 403)
})
test('private feedback cannot be approved or published; rejection clears contact and deletion is admin-only', async () => {
  const f = fixture(), r = await f.request('POST', '/testimonials', { ...valid, quoteConsent: false, email: 'private@example.invalid' })
  const { id } = JSON.parse(r.body)
  for (const action of ['approve', 'publish']) assert.equal((await f.request('POST', '/admin/testimonials', { id, action }, 'admin')).statusCode, 400)
  for (const [method, path, body] of [['GET', '/admin/testimonials'], ['POST', '/admin/testimonials', { id, action: 'approve' }], ['DELETE', '/admin/testimonials/' + id]]) assert.equal((await f.request(method, path, body)).statusCode, 403)
  assert.equal((await f.request('POST', '/admin/testimonials', { id, action: 'reject' }, 'admin')).statusCode, 200)
  assert.equal(f.rows.get(id).email, null)
  assert.equal((await f.request('DELETE', '/admin/testimonials/' + id, undefined, 'admin')).statusCode, 200); assert(!f.rows.has(id))
  assert.equal((await f.request('DELETE', '/admin/testimonials/' + indexId, undefined, 'admin')).statusCode, 400)
})
test('public reads use only bounded keys, preserve current legacy content and honor deletion', async () => {
  const f = fixture(); f.rows.set(legacyId, { id: legacyId, name: 'Existing', text: 'Original approved text' })
  for (let i = 0; i < 100; i++) f.rows.set('private-' + i, { id: 'private-' + i, record_type: 'customer_submission', status: 'pending' })
  let r = await f.request('GET', '/testimonials', undefined, null)
  assert.equal(JSON.parse(r.body).testimonials[0].text, 'Original approved text')
  assert.equal(f.commands.length, 3); assert(f.commands.every(c => c.constructor.name === 'GetCommand'))
  await f.request('DELETE', '/admin/testimonials/' + legacyId, undefined, 'admin')
  r = await f.request('GET', '/testimonials'); assert.deepEqual(JSON.parse(r.body).testimonials, [])
})
test('publication registry bounds read count and public output; never falls back to a table scan', async () => {
  const f = fixture(), ids = []
  for (let i = 0; i < 30; i++) { const id = randomUUID(); ids.push(id); f.rows.set(id, { id, name: 'Fixture', text: 'Published fixture' }) }
  f.rows.set(indexId, { id: indexId, ids, revision: 'fixture' })
  const r = await f.request('GET', '/testimonials'); assert.equal(JSON.parse(r.body).testimonials.length, 20)
  assert.equal(f.commands.length, 21); assert(f.commands.every(c => c.constructor.name === 'GetCommand'))
})
test('concurrent approvals retain both registry entries and retry CAS conflicts', async () => {
  const f = fixture(), ids = [randomUUID(), randomUUID()]
  for (const id of ids) f.rows.set(id, { ...validateSubmission(valid), id })
  f.collide(1)
  const results = await Promise.all(ids.map(id => f.request('POST', '/admin/testimonials', { id, action: 'approve' }, 'admin')))
  assert(results.every(r => r.statusCode === 200)); assert(ids.every(id => f.rows.get(indexId).ids.includes(id)))
  assert.equal(JSON.parse((await f.request('GET', '/testimonials')).body).testimonials.length, 2)
})
test('publication failure stays private and is recoverable by an approved-row retry', async () => {
  const f = fixture(), id = randomUUID(); f.rows.set(id, { ...validateSubmission(valid), id }); f.collide(5)
  assert.equal((await f.request('POST', '/admin/testimonials', { id, action: 'approve' }, 'admin')).statusCode, 500)
  assert.deepEqual(JSON.parse((await f.request('GET', '/testimonials')).body).testimonials, [])
  assert.equal((await f.request('POST', '/admin/testimonials', { id, action: 'approve' }, 'admin')).statusCode, 200)
  assert.equal(JSON.parse((await f.request('GET', '/testimonials')).body).testimonials.length, 1)
})
test('admin pagination traverses private and rejected records without duplicates', async () => {
  const f = fixture(); for (let i = 0; i < 100; i++) f.rows.set('row-' + i, { id: 'row-' + i, status: i % 2 ? 'pending' : 'rejected' })
  let cursor, ids = []
  do { const r = await f.request('GET', '/admin/testimonials', undefined, 'admin', { queryStringParameters: { cursor } }); assert.equal(r.statusCode, 200)
    const data = JSON.parse(r.body); assert(data.testimonials.length <= 20); ids.push(...data.testimonials.map(t => t.id)); cursor = data.nextCursor
  } while (cursor)
  assert.equal(new Set(ids).size, 100)
  assert.equal((await f.request('GET', '/admin/testimonials', undefined, 'admin', { queryStringParameters: { cursor: 'x'.repeat(513) } })).statusCode, 400)
})
test('manual quote create and recoverable publication stay available to admins', async () => {
  const f = fixture(), r = await f.request('POST', '/admin/testimonials', { name: 'Fixture', text: 'Manual approved quote' }, 'admin')
  assert.equal(r.statusCode, 201); const { id } = JSON.parse(r.body).testimonial
  assert.equal(JSON.parse((await f.request('GET', '/testimonials')).body).testimonials.length, 1)
  assert.equal((await f.request('POST', '/admin/testimonials', { id, action: 'publish' }, 'admin')).statusCode, 200)
})
test('announcements and demo video behavior remain available', async () => {
  const f = fixture(), r = await f.request('POST', '/admin/announcements', { title: 'Fixture', message: 'Offline test' }, 'admin')
  assert.equal(r.statusCode, 201); assert.equal(JSON.parse((await f.request('GET', '/announcements')).body).announcements.length, 1)
  await f.request('DELETE', '/admin/announcements/' + JSON.parse(r.body).announcement.id, undefined, 'admin')
  assert.equal((await f.request('POST', '/admin/demo-video', { url: 'https://www.youtube.com/watch?v=fixture', title: 'Fixture' }, 'admin')).statusCode, 200)
  assert.equal(JSON.parse((await f.request('GET', '/demo-video')).body).video.title, 'Fixture')
  await f.request('DELETE', '/admin/demo-video', undefined, 'admin'); assert.equal(JSON.parse((await f.request('GET', '/demo-video')).body).video, null)
})
test('customer form requires account, uses authenticated POST and auth return reloads without replay', () => {
  const form = readFileSync(new URL('../../src/pages/TestimonialPage.jsx', import.meta.url), 'utf8')
  assert.match(form, /!user/); assert.match(form, /redirect=%2Ftestimonial/); assert.match(form, /authedFetch\('\/testimonials'/); assert.doesNotMatch(form, /type="file"|preparePhoto/)
  const auth = readFileSync(new URL('../../src/pages/AuthPage.jsx', import.meta.url), 'utf8')
  assert.match(auth, /target.split\('\?'\)\[0\] === '\/testimonial'/)
})
