// Execute the actual request authorization, Support transport/client and
// CaseTimeline continuations. All identities, sessions and HTTP are local.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const root = process.env.RECON_SUPPORT_BASELINE_DIR || fileURLToPath(new URL('../../../', import.meta.url))
const read = path => readFileSync(resolve(root, path), 'utf8')
const executable = source => source.replace(/^import .*\r?\n/gm, '').replace(/export /g, '').replace(/import\.meta\.env\.VITE_CUSTOMER_SUCCESS_API_URL/g, "'https://local-fixture.invalid'")
const route = read('src/features/support/SupportRoute.jsx')
const scoped = route.includes('createLiveSupportApi({ getAuthorization })')
const deferred = () => { let resolve, reject; const promise = new Promise((ok, fail) => { resolve = ok; reject = fail }); return { promise, resolve, reject } }
const turn = () => new Promise(setImmediate)

function fixture() {
  let generation = 1, subject = 'subject-a', present = true, sessionWait = null
  const requests = [], navigations = [], errors = [], notices = []
  let reloads = 0, replyResets = 0
  const context = vm.createContext({
    AbortController, setTimeout, clearTimeout, URLSearchParams,
    lifecycle: { captureAuthScope: () => generation, isAuthScopeCurrent: captured => captured === generation },
    getCurrentUser: () => present ? {} : null,
    getSession: async () => { const captured = subject; if (sessionWait) await sessionWait.promise; return { getIdToken: () => ({ decodePayload: () => ({ sub: captured }) }), token: 'fixture:' + captured } },
    getIdToken: session => session.token,
    currentIdToken: () => { throw Error('unexpected unscoped token reader') }, isCustomerSuccessConfigured: () => true,
    fetchImpl: async (_url, init) => { const pending = deferred(); requests.push({ init, ...pending }); return pending.promise },
    setBusy() {}, setError: value => { if (value) errors.push(value) }, setNotice: value => { if (value) notices.push(value) },
    setReply: () => { replyResets++ }, setRequestId() {}, createClientRequestId: () => 'same-local-request-id',
    res: { reload: () => { reloads++ } }, replyError: null, reply: 'Private A fixture reply', requestId: 'same-local-request-id', caseNumber: 'CASE-A',
    paths: { caseUrl: number => '/support/cases/' + number }, navigate: (...args) => navigations.push(args),
  })
  vm.runInContext(executable(read('src/lib/ownerRequest.js')), context)
  vm.runInContext(executable(read('src/features/support/supportApi.js')), context)
  // Follow the actual route's wiring, so the old checkpoint reproduces the
  // finding rather than merely failing because the new helper did not exist.
  const authorization = scoped ? "getAuthorization:()=>authorizationForOwner('subject-a',lifecycle)" : "getToken:()=>tokenForOwner('subject-a',lifecycle)"
  vm.runInContext(`const api=createSupportClient(createLiveSupportTransport({baseUrl:'https://local-fixture.invalid',${authorization},fetchImpl}));`, context)
  const page = read('src/features/support/player/CaseTimeline.jsx')
  vm.runInContext(page.slice(page.indexOf('  async function run('), page.indexOf('  async function attach(')), context)
  return {
    context, requests, navigations, errors, notices,
    reply: () => context.sendReply({ preventDefault() {} }),
    switchAccount: next => { subject = next; present = !!next; generation++ },
    waitSession: () => sessionWait = deferred(), reloads: () => reloads, replyResets: () => replyResets,
  }
}
const response = (payload, status = 200) => ({ ok: status < 300, status, json: async () => payload })
const followup = { linkedCaseNumber: 'FOLLOWUP-PRIVATE-A' }
function noCompletion(app) {
  assert.deepEqual(app.navigations, [], 'stale completion must not navigate the next account')
  assert.deepEqual(app.notices, [])
  assert.deepEqual(app.errors, [])
  assert.equal(app.reloads(), 0)
  assert.equal(app.replyResets(), 0)
}

test('same-owner closed-case reply navigates once to its own follow-up', async () => {
  const app = fixture(), pending = app.reply(); await turn()
  app.requests[0].resolve(response(followup)); await pending
  assert.equal(app.navigations.length, 1)
  assert.equal(app.navigations[0][0], '/support/cases/FOLLOWUP-PRIVATE-A')
  assert.equal(app.navigations[0][1].state.followUpOf, 'CASE-A')
  assert.equal(app.replyResets(), 1)
})

for (const next of ['subject-b', null, 'subject-a']) test(`late closed-case success has no continuation after ${next || 'logout'}`, async () => {
  const app = fixture(), pending = app.reply(); await turn()
  app.switchAccount(next); app.requests[0].resolve(response(followup)); await pending
  noCompletion(app)
})

for (const mode of ['http-error', 'network-error']) test(`late ${mode} is discarded after account switch`, async () => {
  const app = fixture(), pending = app.reply(); await turn(); app.switchAccount('subject-b')
  if (mode === 'http-error') app.requests[0].resolve(response({ error: 'PRIVATE-A-ERROR' }, 503))
  else app.requests[0].reject(Error('PRIVATE-A-TRANSPORT-ERROR'))
  await pending; noCompletion(app)
})

test('switch while response JSON is pending blocks follow-up navigation and notices', async () => {
  const app = fixture(), body = deferred(), pending = app.reply(); await turn()
  app.requests[0].resolve({ ok: true, status: 200, json: () => body.promise }); await turn()
  app.switchAccount('subject-b'); body.resolve(followup); await pending
  noCompletion(app)
})

test('same-owner failed reply retains request identity for a successful retry', async () => {
  const app = fixture(), first = app.reply(); await turn()
  app.requests[0].resolve(response({ error: 'Synthetic retryable error' }, 503)); await first
  assert.equal(app.navigations.length, 0); assert.equal(app.errors.length, 1); assert.equal(app.replyResets(), 0)
  const second = app.reply(); await turn()
  assert.equal(JSON.parse(app.requests[0].init.body).clientRequestId, JSON.parse(app.requests[1].init.body).clientRequestId)
  app.requests[1].resolve(response(followup)); await second
  assert.equal(app.navigations.length, 1)
})

test('interruption during authorization cannot start the old-owner request', async () => {
  const app = fixture(), session = app.waitSession(), pending = app.reply()
  app.switchAccount('subject-b'); session.resolve(); await pending
  noCompletion(app); assert.equal(app.requests.length, 0)
})

test('structured authorization without a completion guard fails closed before HTTP', async () => {
  const app = fixture()
  vm.runInContext("const malformed=createLiveSupportTransport({baseUrl:'https://local-fixture.invalid',getAuthorization:async()=>({token:'fixture-only'}),fetchImpl});", app.context)
  await assert.rejects(vm.runInContext("malformed.request('POST','/cs/me/support/cases',{})", app.context), error => error.name === 'AbortError')
  assert.equal(app.requests.length, 0)
})
