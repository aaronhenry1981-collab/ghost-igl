import test from 'node:test'
import assert from 'node:assert/strict'
import { withRequestDeadline } from './request-deadline.mjs'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'

test('completed provider call returns once and clears its deadline', async () => {
  let cleared = false, calls = 0
  const result = await withRequestDeadline(async signal => { calls++; assert.equal(signal.aborted, false); return 'result' }, 100, {
    now: () => 0, setTimer: () => 123, clearTimer: id => { assert.equal(id, 123); cleared = true },
  })
  assert.equal(result, 'result'); assert.equal(calls, 1); assert.equal(cleared, true)
})
test('deadline aborts hanging transport without waiting for it or retrying', async () => {
  let expire, signal, calls = 0
  const pending = withRequestDeadline(s => { signal = s; calls++; return new Promise(() => {}) }, 100, {
    now: () => 0, setTimer: callback => { expire = callback; return 1 }, clearTimer() {},
  })
  await Promise.resolve(); expire()
  await assert.rejects(pending, { name: 'ReviewDeadlineError' })
  assert.equal(signal.aborted, true); assert.equal(calls, 1)
})
test('an exhausted shared budget prevents starting a repair call', async () => {
  let calls = 0
  await assert.rejects(withRequestDeadline(() => { calls++ }, 100, { now: () => 101 }), { name: 'ReviewDeadlineError' })
  assert.equal(calls, 0)
})
test('provider failure is preserved and is not retried', async () => {
  let calls = 0
  await assert.rejects(withRequestDeadline(async () => { calls++; throw Object.assign(new Error('provider unavailable'), { name: 'ServiceUnavailableException' }) }, Date.now() + 1000), { name: 'ServiceUnavailableException' })
  assert.equal(calls, 1)
})

test('actual handler returns structured timeout after reservation and before persistence', async () => {
  const source = readFileSync(new URL('./index.mjs', import.meta.url), 'utf8')
  let reserved = 0, writes = 0
  const ctx = vm.createContext({
    REVIEW_REQUEST_BUDGET_MS: 24000, Date: { now: () => 1000 }, buildHeaders: () => ({}),
    verifier: { verify: async () => ({ email: 'fixture@example.test', email_verified: true, 'cognito:groups': ['admins'] }) },
    console: { error() {} }, VOD_AI_ENABLED: true, VOD_ADMIN_DAILY_LIMIT: 3,
    CONTEXTS_BY_GAME: { r6: {} }, ELITE_MAX_IMAGES: 10, MAX_IMAGE_BYTES: 5000000,
    reserveAdminUsage: async () => { reserved++ },
    callBedrock: async (_game, _images, _context, _tier, deadline) => {
      assert.equal(deadline, 25000)
      throw Object.assign(new Error('deadline'), { name: 'ReviewDeadlineError' })
    },
    ddb: { send: async () => { writes++ } }, publishVodPlayerData: async () => { writes++ },
  })
  vm.runInContext(source.slice(source.indexOf('export async function handler('), source.indexOf('async function getActiveSub(')).replace('export ', ''), ctx)
  const response = await ctx.handler({ headers: { authorization: 'Bearer offline-fixture' }, body: JSON.stringify({ images: [{ base64: 'eA==', media_type: 'image/jpeg' }] }) })
  assert.equal(response.statusCode, 504)
  assert.equal(JSON.parse(response.body).error, 'review_timeout')
  assert.match(JSON.parse(response.body).message, /used one review attempt/)
  assert.equal(JSON.parse(response.body).allowance_consumed, true)
  assert.equal(reserved, 1); assert.equal(writes, 0)
})

test('actual primary and repair calls share the same deadline', async () => {
  const source = readFileSync(new URL('./index.mjs', import.meta.url), 'utf8')
  const calls = []
  const ctx = vm.createContext({ GAME_DISPLAY: { r6: { name: 'Siege' } }, MODEL_ID: 'primary', BUDGET_MODEL_ID: 'repair', RESPONSE_SCHEMA: '{}', GROUNDING_RULES: '',
    buildSystemPrompt: () => '', invokeModel: async (_input, model, deadline) => { calls.push({ model, deadline }); return calls.length === 1 ? 'invalid' : '{}' },
    parseModelJson: text => text === '{}' ? {} : null, validateAnalysis: () => [], requireGroundedAnalysis: value => value,
  })
  vm.runInContext(source.slice(source.indexOf('async function callBedrock('), source.indexOf('async function callRankSnapshot(')), ctx)
  await ctx.callBedrock('r6', [{ media_type: 'image/jpeg', base64: 'eA==' }], {}, 'champion', 25000)
  assert.deepEqual(calls, [{ model: 'primary', deadline: 25000 }, { model: 'repair', deadline: 25000 }])
})
