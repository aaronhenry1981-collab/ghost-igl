import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const source = readFileSync(new URL('./index.mjs', import.meta.url), 'utf8')
const reserve = source.slice(source.indexOf('async function reserveAdminUsage('), source.indexOf('async function callBedrock('))
const day = new Date().toISOString().slice(0, 10)
const conditional = () => Object.assign(new Error('conditional conflict'), { name: 'ConditionalCheckFailedException' })
function fixture(initial, denied = false) {
  let item = initial ? { ...initial } : undefined
  let updates = 0
  class GetCommand { constructor(input) { this.input = input } }
  class UpdateCommand { constructor(input) { this.input = input } }
  const ddb = { async send(cmd) {
    assert.equal(cmd.input.TableName, 'profiles-fixture')
    assert.equal(cmd.input.Key.email, 'owner@example.test')
    if (denied) throw Object.assign(new Error('not authorized'), { name: 'AccessDeniedException' })
    if (cmd instanceof GetCommand) return { Item: item ? { ...item } : undefined }
    const v = cmd.input.ExpressionAttributeValues
    const sameDay = item?.vod_admin_usage_day === v[':day']
    const matches = ':expected' in v
      ? sameDay && (item?.vod_admin_usage_count === undefined || item.vod_admin_usage_count === v[':expected'])
      : !sameDay
    if (!matches) throw conditional()
    assert.equal(cmd.input.UpdateExpression, 'SET #day = :day, #count = :next')
    item = { ...item, vod_admin_usage_day: v[':day'], vod_admin_usage_count: v[':next'] }
    updates++
    return {}
  } }
  const ctx = vm.createContext({ ddb, GetCommand, UpdateCommand, Date, Math, Number, Error, PROFILES_TABLE: 'profiles-fixture', VOD_ADMIN_DAILY_LIMIT: 3 })
  vm.runInContext(reserve, ctx)
  return { run: () => ctx.reserveAdminUsage('owner@example.test'), item: () => item, updates: () => updates }
}
test('first owner reservation preserves unrelated profile fields', async () => {
  const f = fixture({ plan: 'elite' }); await f.run()
  assert.deepEqual(f.item(), { plan: 'elite', vod_admin_usage_day: day, vod_admin_usage_count: 1 })
})
test('daily cap rejects without a write', async () => {
  const f = fixture({ vod_admin_usage_day: day, vod_admin_usage_count: 3 })
  await assert.rejects(f.run(), { name: 'ConditionalCheckFailedException' }); assert.equal(f.updates(), 0)
})
test('simultaneous reservations cannot both consume the final slot', async () => {
  const f = fixture({ vod_admin_usage_day: day, vod_admin_usage_count: 2 })
  const r = await Promise.allSettled([f.run(), f.run()])
  assert.equal(r.filter(x => x.status === 'fulfilled').length, 1)
  assert.equal(f.item().vod_admin_usage_count, 3)
})
test('concurrent day rollover grants only one initial reservation', async () => {
  const f = fixture({ vod_admin_usage_day: '2000-01-01', vod_admin_usage_count: 3 })
  const r = await Promise.allSettled([f.run(), f.run()])
  assert.equal(r.filter(x => x.status === 'fulfilled').length, 1)
  assert.equal(f.item().vod_admin_usage_count, 1)
})
test('IAM denial propagates without a write', async () => {
  const f = fixture(undefined, true)
  await assert.rejects(f.run(), { name: 'AccessDeniedException' }); assert.equal(f.updates(), 0)
})
for (const [name, status] of [['AccessDeniedException', 503], ['ConditionalCheckFailedException', 429]]) {
  test(`handler blocks Bedrock and persistence on ${name}`, async () => {
    let modelCalls = 0, writes = 0
    const ctx = vm.createContext({
      REVIEW_REQUEST_BUDGET_MS: 24000, buildHeaders: () => ({}), console: { error() {} },
      verifier: { verify: async () => ({ email: 'owner@example.test', email_verified: true, 'cognito:groups': ['admins'] }) },
      VOD_AI_ENABLED: true, VOD_ADMIN_DAILY_LIMIT: 3,
      CONTEXTS_BY_GAME: { r6: {} }, ELITE_MAX_IMAGES: 10, MAX_IMAGE_BYTES: 5000000,
      reserveAdminUsage: async () => { throw Object.assign(new Error('fixture'), { name }) },
      callBedrock: async () => { modelCalls++; throw new Error('must not run') },
      ddb: { send: async () => { writes++; throw new Error('must not write') } },
      publishVodPlayerData: async () => { writes++ },
    })
    vm.runInContext(source.slice(source.indexOf('export async function handler('), source.indexOf('async function getActiveSub(')).replace('export ', ''), ctx)
    const response = await ctx.handler({ headers: { authorization: 'Bearer offline-fixture' }, body: JSON.stringify({ images: [{ base64: 'eA==', media_type: 'image/jpeg' }] }) })
    assert.equal(response.statusCode, status)
    assert.equal(modelCalls, 0); assert.equal(writes, 0)
  })
}
