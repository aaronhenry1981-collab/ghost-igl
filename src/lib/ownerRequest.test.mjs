import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const source = readFileSync(new URL('./ownerRequest.js', import.meta.url), 'utf8').replace(/^import .*\r?\n/gm, '').replace(/export /g, '')
const deferred = () => { let resolve; const promise = new Promise(ok => { resolve = ok }); return { promise, resolve } }
function fixture() {
  let subject = 'subject-a', generation = 1, present = true, sessionWait = null, responseWait = null
  const calls = []
  const scope = { captureAuthScope: () => generation, isAuthScopeCurrent: captured => captured === generation }
  const context = vm.createContext({
    API_URL: 'https://local-fixture.invalid', getCurrentUser: () => present ? {} : null,
    getSession: async () => { const captured = subject; if (sessionWait) await sessionWait.promise; return { getIdToken: () => ({ decodePayload: () => ({ sub: captured }) }), token: 'fixture:' + captured } },
    getIdToken: session => session.token,
    fetch: async (url, init) => { calls.push({ url, init }); if (responseWait) return responseWait.promise; return { ok: true, json: async () => ({ url: 'https://billing-fixture.invalid/subject-a' }) } },
  })
  vm.runInContext(source, context)
  return { context, scope, calls, switchAccount: next => { subject = next; generation++; present = !!next },
    waitSession: () => sessionWait = deferred(), waitResponse: () => responseWait = deferred() }
}
const cancelled = error => error.name === 'AbortError'

test('same-owner request uses its verified session and cannot override authorization from init', async () => {
  const app = fixture()
  const data = await app.context.requestForOwner('subject-a', app.scope, '/me', { method: 'PUT', body: '{"first_name":"Local"}', headers: { Authorization: 'forged' } })
  assert.match(data.url, /subject-a/)
  assert.equal(app.calls[0].init.headers.Authorization, 'Bearer fixture:subject-a')
  assert.equal(app.calls[0].init.body, '{"first_name":"Local"}')
})

for (const next of [null, 'subject-b']) test(`session refresh interrupted by ${next || 'logout'} cannot dispatch`, async () => {
  const app = fixture(), pending = app.waitSession()
  const request = app.context.requestForOwner('subject-a', app.scope, '/me', { method: 'PUT', body: '{}' })
  app.switchAccount(next); pending.resolve()
  await assert.rejects(request, cancelled)
  assert.equal(app.calls.length, 0)
})

test('retained account-A client cannot acquire account-B token for drafts or Support attachments', async () => {
  const app = fixture(); app.switchAccount('subject-b')
  await assert.rejects(app.context.requestForOwner('subject-a', app.scope, '/me', { method: 'PUT', body: '{"private":"A"}' }), cancelled)
  await assert.rejects(app.context.tokenForOwner('subject-a', app.scope), cancelled)
  assert.equal(app.calls.length, 0)
})

for (const next of [null, 'subject-b']) test(`late former-owner billing response is not returned after ${next || 'logout'}`, async () => {
  const app = fixture(), pending = app.waitResponse()
  const request = app.context.requestForOwner('subject-a', app.scope, '/me/billing-portal', { method: 'POST' })
  await new Promise(setImmediate)
  assert.equal(app.calls.length, 1)
  app.switchAccount(next); pending.resolve({ ok: true, json: async () => ({ url: 'https://billing-fixture.invalid/private-A' }) })
  await assert.rejects(request, cancelled)
})

test('identity change while reading response body also discards private results', async () => {
  const app = fixture(), pending = app.waitResponse(), body = deferred()
  const request = app.context.requestForOwner('subject-a', app.scope, '/me')
  await new Promise(setImmediate)
  pending.resolve({ ok: true, json: () => body.promise })
  await new Promise(setImmediate)
  app.switchAccount('subject-b'); body.resolve({ profile: 'private A' })
  await assert.rejects(request, cancelled)
})

test('valid same-owner reauthentication allows a fresh request while invalidating old scopes', async () => {
  const app = fixture(), old = app.scope.captureAuthScope()
  app.switchAccount('subject-a')
  assert.equal(app.scope.isAuthScopeCurrent(old), false)
  assert.equal(await app.context.tokenForOwner('subject-a', app.scope), 'fixture:subject-a')
})

test('missing owner is rejected before any request', async () => {
  const app = fixture()
  await assert.rejects(app.context.requestForOwner(null, app.scope, '/me'), cancelled)
  assert.equal(app.calls.length, 0)
})

test('transport authorization retains the original generation through switch and same-owner reauthentication', async () => {
  const app = fixture()
  const authorization = await app.context.authorizationForOwner('subject-a', app.scope)
  assert.equal(authorization.token, 'fixture:subject-a')
  assert.equal(authorization.isCurrent(), true)
  app.switchAccount('subject-b')
  assert.equal(authorization.isCurrent(), false)
  app.switchAccount('subject-a')
  assert.equal(authorization.isCurrent(), false, 'completion must not acquire the new generation')
  assert.equal((await app.context.authorizationForOwner('subject-a', app.scope)).isCurrent(), true)
})
