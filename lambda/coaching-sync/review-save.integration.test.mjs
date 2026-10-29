import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { aggregateProgressEvidence, sanitizeProgressEvidence } from './progress-evidence.mjs'
import { evaluateCondition } from '../webhook/test-support/fakeDynamo.mjs'
import { buildVodCoachingEvent } from '../../src/api/vodEvidence.js'

const backendSource = readFileSync(new URL('./index.mjs', import.meta.url), 'utf8')
const apiSource = readFileSync(new URL('../../src/api/vodApi.js', import.meta.url), 'utf8').replace(/^import .*\r?\n/gm, '').replace(/export /g, '')
function fixture({ unprocessed = false, lostReceipt = false } = {}) {
  let subject = 'subject-a', blocked = unprocessed, lose = lostReceipt, models = 0
  const events = new Map(), quota = new Map()
  class QueryCommand { constructor(input) { this.input = input } }
  class GetCommand { constructor(input) { this.input = input } }
  class UpdateCommand { constructor(input) { this.input = input } }
  class BatchWriteCommand { constructor(input) { this.input = input } }
  const backend = vm.createContext({
    Buffer, MAX_BATCH_EVENTS: 100, MAX_BODY_BYTES: 262144, MAX_EVENT_BYTES: 8192,
    DAILY_EVENT_LIMIT: 5000, RETENTION_DAYS: 90, SUBSCRIPTIONS_TABLE: 'subs-fixture', TABLE: 'events-fixture',
    QueryCommand, GetCommand, UpdateCommand, BatchWriteCommand, aggregateProgressEvidence, sanitizeProgressEvidence,
    verifier: { verify: async () => ({ sub: subject, email: subject + '@example.test', email_verified: true }) },
    console: { error() {} },
    ddb: { send: async command => {
      const input = command.input
      if (command instanceof QueryCommand) {
        if (input.TableName === 'subs-fixture') return { Items: [{ stripe_customer_id: 'customer-fixture' }] }
        assert.equal(input.TableName, 'events-fixture')
        return { Items: [...events.values()].filter(row => row.userId === input.ExpressionAttributeValues[':u']) }
      }
      if (command instanceof GetCommand) {
        assert.equal(input.TableName, 'subs-fixture')
        assert.equal(input.ConsistentRead, true)
        return { Item: { stripe_customer_id: 'customer-fixture', email: subject + '@example.test', plan: 'pro', status: 'active', current_period_end: '2099-01-01T00:00:00Z', cognito_sub: subject } }
      }
      if (command instanceof UpdateCommand) {
        const key = input.Key.userId + '#' + input.Key.sk, row = quota.get(key)
        if (!evaluateCondition(input.ConditionExpression, row, input.ExpressionAttributeNames, input.ExpressionAttributeValues)) throw Object.assign(Error('quota'), { name: 'ConditionalCheckFailedException' })
        quota.set(key, { count: (row?.count || 0) + input.ExpressionAttributeValues[':inc'] }); return {}
      }
      assert.ok(command instanceof BatchWriteCommand)
      const writes = input.RequestItems['events-fixture']
      if (blocked) return { UnprocessedItems: { 'events-fixture': writes } }
      for (const { PutRequest: { Item } } of writes) events.set(Item.userId + '#' + Item.sk, structuredClone(Item))
      return { UnprocessedItems: {} }
    } },
  })
  vm.runInContext(backendSource.slice(backendSource.indexOf('const HEADERS =')).replace('export async function handler', 'async function handler'), backend)
  async function request(method, path, body) {
    const response = await backend.handler({ headers: { authorization: 'Bearer fixture-only' }, requestContext: { http: { method } }, rawPath: path, body: body && JSON.stringify(body) })
    return { ok: response.statusCode >= 200 && response.statusCode < 300, status: response.statusCode, json: async () => JSON.parse(response.body) }
  }
  class FileReader { readAsDataURL() { this.result = 'data:image/png;base64,bG9jYWw='; this.onload() } }
  const client = vm.createContext({
    AbortController, setTimeout, clearTimeout,
    API_URL: 'https://fixture.invalid', FileReader, buildVodCoachingEvent,
    getCurrentUser: () => ({}), getIdToken: () => 'fixture-only', getSession: async () => ({ getIdToken: () => ({ decodePayload: () => ({ sub: subject }) }) }),
    fetch: async (url, init) => {
      if (url.endsWith('/vod/analyze')) { models++; return { ok: true, json: async () => ({ session: { headline: 'Visible doorway observation', image_count: 1 }, practice_plan: { this_week: ['Check the doorway in a custom game.'] }, usage: { remaining: 19 } }) } }
      const response = await request('POST', '/me/coaching-events', JSON.parse(init.body))
      if (lose) { lose = false; throw Error('Receipt lost after durable write') }
      return response
    },
  })
  vm.runInContext(apiSource, client)
  return { client, events, request, models: () => models, unblock: () => { blocked = false }, switchUser: next => { subject = next } }
}

for (const mode of ['unprocessed', 'lostReceipt']) test(`review → ${mode} → evidence-only retry → actual history/profile readback`, async () => {
  const app = fixture({ [mode]: true })
  const review = await app.client.analyzeSessionApi([{ type: 'image/png' }], { map: 'bank', site: 'ceo', side: 'attack' })
  assert.equal(review.roadmap_sync, 'pending')
  if (mode === 'unprocessed') assert.equal(app.events.size, 0)
  app.unblock()
  const saved = await app.client.retryVodEvidenceApi(review)
  assert.equal(saved.roadmap_sync, 'saved')
  assert.equal(app.models(), 1)
  assert.equal(app.events.size, 1, 'lost receipt replay must not create duplicate evidence')
  const history = await (await app.request('GET', '/me/coaching-history')).json()
  assert.equal(history.sessions.length, 1)
  assert.equal(history.sessions[0].events, 1)
  const profile = await (await app.request('GET', '/me/coaching-profile')).json()
  assert.equal(profile.totals.sessions, 1)
  assert.equal(profile.mechanics.latest.drill, 'Check the doorway in a custom game.')
  assert.equal(profile.mechanics.latest.rpDelta, null, 'one still never fabricates rank improvement')
  app.switchUser('subject-b')
  const other = await (await app.request('GET', '/me/coaching-profile')).json()
  assert.equal(other.totals.sessions, 0)
  assert.equal(other.mechanics.latest, null)
})

test('the authenticated subject owns writes even when payload claims another user', async () => {
  const app = fixture()
  app.switchUser('subject-b')
  const response = await app.request('POST', '/me/coaching-events', { userId: 'subject-a', events: [{ sessionId: 'fixture', ts: '2026-10-29T00:00:00Z', userId: 'subject-a' }] })
  assert.equal(response.status, 200)
  assert.equal([...app.events.values()][0].userId, 'subject-b')
})
