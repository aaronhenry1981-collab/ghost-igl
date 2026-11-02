import test from 'node:test'
import assert from 'node:assert/strict'
import { createExistingAccountClient } from './existing-account.mjs'
test('existing account client binds verified subject and rejects session/account switches', async () => {
  let name = 'fixture-a', sub = 'verified-account-a'
  const sdk = { getCurrentUser: () => name ? { getUsername: () => name } : null, getSession: async () => ({ getIdToken: () => ({ payload: { sub } }) }), getIdToken: () => 'fixture-id-token' }
  const auth = createExistingAccountClient({ load: async () => sdk })
  assert.deepEqual(await auth.connect(), { subject: sub }); assert.deepEqual(await auth.identity(), { subject: sub, token: 'fixture-id-token' })
  sub = 'verified-account-b'; await assert.rejects(() => auth.identity(), /changed/)
  name = 'fixture-b'; assert.equal(auth.currentSubject(), null); auth.disconnect(); await assert.rejects(() => auth.identity(), /changed/)
})
test('logout/storage invalidation drops a pending identity completion and unsubscribe detaches listener', async () => {
  let release, first = true, handler; const sdk = { getCurrentUser: () => ({ getUsername: () => 'fixture-a' }), getIdToken: () => 'fixture-token', getSession: async () => first ? (first = false, { getIdToken: () => ({ payload: { sub: 'verified-account-a' } }) }) : new Promise(resolve => { release = resolve }) }
  const auth = createExistingAccountClient({ load: async () => sdk }); await auth.connect()
  let changes = 0, removed = 0; const unsubscribe = auth.subscribe(() => changes++, { addEventListener: (_type, fn) => { handler = fn }, removeEventListener: (_type, fn) => { assert.equal(fn, handler); removed++ } })
  const pending = auth.identity(); handler({ key: 'CognitoIdentityServiceProvider.fixture.LastAuthUser' }); release({ getIdToken: () => ({ payload: { sub: 'verified-account-a' } }) })
  await assert.rejects(() => pending, /changed/); assert.equal(auth.currentSubject(), null); assert.equal(changes, 1); unsubscribe(); assert.equal(removed, 1)
})
