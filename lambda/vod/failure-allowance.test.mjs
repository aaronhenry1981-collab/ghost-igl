import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

// Execute the real handler, API helper and hook. Identity, storage and the
// provider are synthetic boundaries; no Stripe, AWS, image or network is used.
const source = readFileSync(new URL('./index.mjs', import.meta.url), 'utf8')
const apiSource = readFileSync(new URL('../../src/api/vodApi.js', import.meta.url), 'utf8')
const hookSource = readFileSync(new URL('../../src/hooks/useVodAnalysis.js', import.meta.url), 'utf8')
const executable = text => text.replace(/^import .*\r?\n/gm, '').replace(/export /g, '')
const handlerStart = source.indexOf('export async function handler(')
const handlerEnd = source.indexOf('async function getActiveSub(')
assert.ok(handlerStart > 0 && handlerEnd > handlerStart)

function harness({ prepaid = false, failure = 'ModelSchemaError', blocked = false } = {}) {
  let used = prepaid ? 20 : 18, credits = prepaid ? 10 : 0
  let modelCalls = 0, requests = 0, reserves = 0
  const backend = vm.createContext({
    REVIEW_REQUEST_BUDGET_MS: 24000, buildHeaders: () => ({}),
    verifier: { verify: async () => ({ sub: 'synthetic', email: 'synthetic@example.test', email_verified: true }) },
    VOD_AI_ENABLED: true, VOD_PURCHASED_CREDIT_COST: 5,
    PRO_MAX_IMAGES: 5, ELITE_MAX_IMAGES: 10, MAX_IMAGE_BYTES: 5000000,
    CONTEXTS_BY_GAME: { r6: {} },
    getActiveSub: async () => ({ status: 'active', plan: 'pro' }),
    effectivePlan: sub => sub.plan,
    computeUsage: () => ({ used, limit: 20, remaining: 20 - used, periodEnd: '2099-01-01T00:00:00Z' }),
    getPurchasedCredits: async () => credits,
    reserveSession: async () => {
      if (blocked) throw Object.assign(new Error('synthetic unavailable storage'), { name: 'AccessDeniedException' })
      reserves++; used++
    },
    reservePurchasedUsage: async () => { reserves++; credits -= 5 },
    callBedrock: async () => {
      modelCalls++
      throw Object.assign(new Error('private upstream details must not reach the customer'), { name: failure })
    },
    callRankSnapshot: async () => { modelCalls++; return null },
    console: { error() {} },
  })
  vm.runInContext(executable(source.slice(handlerStart, handlerEnd)), backend)
  class FileReader {
    readAsDataURL() { this.result = 'data:image/png;base64,bG9jYWw='; this.onload() }
  }
  const frontend = vm.createContext({
    FileReader, API_URL: 'https://synthetic.invalid',
    getCurrentUser: () => ({}), getSession: async () => ({}), getIdToken: () => 'synthetic',
    fetch: async (url, request) => {
      requests++
      assert.ok(url.endsWith('/vod/analyze'), 'failed reviews must not sync coaching evidence')
      const result = await backend.handler({ headers: request.headers, body: request.body })
      return { ok: result.statusCode === 200, status: result.statusCode, json: async () => JSON.parse(result.body) }
    },
  })
  vm.runInContext(executable(apiSource), frontend)
  const state = [], usageUpdates = []
  let index = 0
  const hook = vm.createContext({
    useAuth: () => ({ setVodUsage: usage => usageUpdates.push(usage) }),
    useState: initial => {
      const slot = index++
      if (!(slot in state)) state[slot] = initial
      return [state[slot], next => { state[slot] = next }]
    },
    analyzeSessionApi: frontend.analyzeSessionApi,
  })
  vm.runInContext(executable(hookSource), hook)
  const render = () => { index = 0; return hook.useVodAnalysis() }
  return {
    render, usageUpdates,
    counters: () => ({ used, credits, modelCalls, requests, reserves }),
    api: frontend.analyzeSessionApi,
  }
}

for (const failure of ['ReviewDeadlineError', 'ModelGroundingError', 'ThrottlingException', 'AccessDeniedException', 'ValidationException', 'ModelSchemaError']) {
  for (const prepaid of [false, true]) test(`${failure}: ${prepaid ? 'prepaid credits' : 'monthly attempt'} stay visible after failure`, async () => {
    const app = harness({ prepaid, failure })
    await app.render().analyzeSession([{ type: 'image/png' }])
    const result = app.render()
    assert.equal(result.loading, false)
    assert.equal(result.analysis, null)
    assert.doesNotMatch(result.error, /private upstream|provisioned|clear up shortly/)
    assert.match(result.error, prepaid ? /used 5 prepaid usage credits/ : /used one review attempt/)
    assert.match(result.error, /Do not resubmit automatically/)
    assert.equal(app.usageUpdates.length, 1)
    assert.equal(app.usageUpdates[0].used, prepaid ? 20 : 19)
    assert.equal(app.usageUpdates[0].remaining, prepaid ? 0 : 1)
    assert.equal(app.usageUpdates[0].purchased_credits, prepaid ? 5 : 0)
    assert.deepEqual(app.counters(), { used: prepaid ? 20 : 19, credits: prepaid ? 5 : 0, modelCalls: 1, requests: 1, reserves: 1 })
  })
}

test('API preserves the consumed flag and quota payload without retrying a failed review', async () => {
  const app = harness()
  await assert.rejects(app.api([{ type: 'image/png' }]), error => {
    assert.equal(error.allowance_consumed, true)
    assert.equal(error.usage.remaining, 1)
    assert.equal(error.code, 'analysis_failed')
    return true
  })
  assert.equal(app.counters().requests, 1)
})

test('reservation failure blocks processing and never claims an attempt was consumed', async () => {
  const app = harness({ blocked: true })
  await assert.rejects(app.api([{ type: 'image/png' }]), error => {
    assert.equal(error.allowance_consumed, false)
    assert.equal(error.usage, undefined)
    assert.equal(error.code, 'usage_reservation_unavailable')
    assert.match(error.message, /Nothing was charged or used/)
    return true
  })
  assert.deepEqual(app.counters(), { used: 18, credits: 0, modelCalls: 0, requests: 1, reserves: 0 })
})

test('an unreadable rank snapshot also updates the reserved allowance', async () => {
  const app = harness()
  await app.render().analyzeSession([{ type: 'image/png' }], { analysis_type: 'rank_snapshot' })
  assert.equal(app.render().errorCode, 'rank_not_verified')
  assert.equal(app.usageUpdates[0].remaining, 1)
  assert.equal(app.counters().modelCalls, 1)
})
