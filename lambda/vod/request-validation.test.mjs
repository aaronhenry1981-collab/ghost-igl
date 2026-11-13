import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const source = readFileSync(new URL('./index.mjs', import.meta.url), 'utf8')
const handler = source.slice(source.indexOf('export async function handler('), source.indexOf('async function getActiveSub(')).replace('export ', '')
for (const [label, body] of [
  ['null body', null], ['array body', []], ['string body', 'invalid'], ['numeric body', 42],
  ['null image', { images: [null] }], ['array image', { images: [[]] }],
  ['string image', { images: ['invalid'] }],
]) test(`rejects ${label} before allowance reservation or paid work`, async () => {
  let reservations = 0, calls = 0, writes = 0
  const app = vm.createContext({
    REVIEW_REQUEST_BUDGET_MS: 24000, buildHeaders: () => ({}),
    verifier: { verify: async () => ({ email: 'fixture@example.test', email_verified: true, 'cognito:groups': ['admins'] }) },
    VOD_AI_ENABLED: true, CONTEXTS_BY_GAME: { r6: {} }, ELITE_MAX_IMAGES: 10, MAX_IMAGE_BYTES: 5000000,
    reserveAdminUsage: async () => { reservations++ },
    callBedrock: async () => { calls++; throw new Error('unexpected inference') },
    ddb: { send: async () => { writes++ } }, console: { error() {} },
  })
  vm.runInContext(handler, app)
  const response = await app.handler({ headers: { authorization: 'Bearer offline-only' }, body: JSON.stringify(body) })
  assert.equal(response.statusCode, 400)
  assert.equal(typeof JSON.parse(response.body).error, 'string')
  assert.equal(reservations, 0); assert.equal(calls, 0); assert.equal(writes, 0)
})

test('client event cannot populate the trusted worker identity or deadline',async()=>{
 const ctx=vm.createContext({REVIEW_REQUEST_BUDGET_MS:24000,buildHeaders:()=>({})})
 vm.runInContext(handler,ctx)
 const result=await ctx.handler({headers:{},verifiedPayload:{sub:'attacker','cognito:groups':['admins']},runtime:{verifiedPayload:{sub:'attacker'},deadline:Infinity},body:'{}'})
 assert.equal(result.statusCode,401)
})
