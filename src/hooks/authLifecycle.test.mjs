import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { hasPlan, normalizePlan } from '../config/memberships.js'

// Execute the real provider's lifecycle/functions, replacing only its JSX
// render and React/Cognito/network boundaries. All identities and sessions are
// local fixtures; no Cognito, AWS, Stripe or browser storage is accessed.
const source = readFileSync(new URL('./useAuth.jsx', import.meta.url), 'utf8')
const start = source.indexOf('function computeIsAdmin(')
const end = source.indexOf("  const isElite = hasPlan(plan, 'elite', isAdmin)")
assert.ok(start > 0 && end > start, 'provider source boundaries changed')
const executable = source.slice(start, end).replace('export function AuthProvider', 'function AuthProvider') + `
  return { user, isPro, isAdmin, plan, profile, profileComplete, vodUsage, account,
    tierScope, loading, signIn, signOut, refreshProfile, completeNewPassword, captureAuthScope, isAuthScopeCurrent }
}
`

const deferred = () => {
  let resolve, reject
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail })
  return { promise, resolve, reject }
}
const flush = async () => { for (let i = 0; i < 15; i++) await Promise.resolve() }
const sessionFor = (id = 'fixture-a') => ({
  getIdToken: () => ({ decodePayload: () => ({ sub: id, email: `${id}@example.test` }), getJwtToken: () => `fixture:${id}` }),
})
const membership = (plan = 'pro') => ({
  plan, sub_status: 'active', tier_scope: 'single', profile: { main_role: 'Support' },
  profile_complete: true, vod_usage: { remaining: 20 },
})
const response = data => ({ ok: true, json: async () => data })

function harness({ current = true, fetchMembership, initialSession = Promise.resolve(sessionFor()), authenticate, completePassword } = {}) {
  const values = [], refs = [], effects = [], cleanups = []
  let stateIndex = 0, refIndex = 0, effectIndex = 0
  let present = current
  const user = { signOut: () => { present = false } }
  const context = vm.createContext({
    useState: initial => {
      const index = stateIndex++
      if (!(index in values)) values[index] = typeof initial === 'function' ? initial() : initial
      return [values[index], next => { values[index] = typeof next === 'function' ? next(values[index]) : next }]
    },
    useRef: initial => refs[refIndex++] ||= { current: initial },
    useEffect: callback => { if (!effects[effectIndex]) effects[effectIndex] = callback; effectIndex++ },
    userPool: {}, getCurrentUser: () => present ? user : null,
    getSession: () => initialSession,
    getIdToken: session => session.getIdToken().getJwtToken(),
    getCognitoUser: username => ({
      authenticateUser: (_details, callbacks) => {
        if (authenticate) authenticate(username, callbacks)
        else callbacks.onSuccess(sessionFor(username))
      },
      completeNewPasswordChallenge: (_password, attributes, callbacks) => completePassword(attributes, callbacks),
    }),
    getAuthDetails: () => ({}), API_URL: 'https://synthetic.invalid',
    fetch: fetchMembership || (async () => response(membership())),
    hasPlan, normalizePlan, console: { warn() {} },
  })
  vm.runInContext(executable, context)
  const render = () => {
    stateIndex = 0; refIndex = 0; effectIndex = 0
    return context.AuthProvider({ children: null })
  }
  render()
  for (const callback of effects) cleanups.push(callback())
  return { render, unmount: () => cleanups.forEach(cleanup => cleanup?.()) }
}

test('reload hydration keeps loading until server membership is available', async () => {
  const pending = deferred()
  const app = harness({ fetchMembership: () => pending.promise })
  await flush()
  assert.equal(app.render().loading, true)
  pending.resolve(response(membership('champion')))
  await flush()
  assert.equal(app.render().loading, false)
  assert.equal(app.render().plan, 'champion')
})

test('feature scopes are invalidated synchronously by sign-out', async () => {
  const app = harness()
  await flush()
  const captured = app.render().captureAuthScope()
  const check = app.render().isAuthScopeCurrent
  assert.equal(check(captured), true)
  await app.render().signOut()
  assert.equal(check(captured), false)
})

test('normal sign-in resolves only after paid entitlement hydration', async () => {
  const pending = deferred()
  const app = harness({ current: false, fetchMembership: () => pending.promise })
  let finished = false
  const signingIn = app.render().signIn('fixture-b@example.test', 'local-unused').then(() => { finished = true })
  await flush()
  assert.equal(finished, false)
  pending.resolve(response(membership('elite')))
  await signingIn
  assert.equal(app.render().plan, 'elite')
})

test('late membership response cannot restore paid/profile state after sign-out', async () => {
  const pending = deferred()
  const app = harness({ fetchMembership: () => pending.promise })
  await flush()
  await app.render().signOut()
  pending.resolve(response(membership('champion')))
  await flush()
  const state = app.render()
  assert.equal(state.user, null)
  assert.equal(state.plan, 'free')
  assert.equal(state.isPro, false)
  assert.equal(state.profile, null)
  assert.equal(state.account, null)
})

test('sign-out clears cached profile, quota and game scope', async () => {
  const app = harness()
  await flush()
  assert.equal(app.render().profileComplete, true)
  await app.render().signOut()
  const state = app.render()
  assert.equal(state.profile, null)
  assert.equal(state.profileComplete, false)
  assert.equal(state.vodUsage, null)
  assert.equal(state.tierScope, 'all_access')
})

test('a restored session cannot re-sign-in after sign-out while it was pending', async () => {
  const pending = deferred()
  const app = harness({ initialSession: pending.promise })
  await app.render().signOut()
  pending.resolve(sessionFor())
  await flush()
  assert.equal(app.render().user, null)
  assert.equal(app.render().isPro, false)
})

test('a previous account membership response cannot overwrite the next account', async () => {
  const old = deferred()
  let calls = 0
  const app = harness({ fetchMembership: () => ++calls === 1 ? old.promise : Promise.resolve(response(membership('pro'))) })
  await flush()
  await app.render().signOut()
  await app.render().signIn('fixture-b@example.test', 'local-unused')
  old.resolve(response(membership('champion')))
  await flush()
  assert.equal(app.render().user.id, 'fixture-b@example.test')
  assert.equal(app.render().plan, 'pro')
})

test('a late failed membership request cannot downgrade the next paid account', async () => {
  const old = deferred()
  let calls = 0
  const app = harness({ fetchMembership: () => ++calls === 1 ? old.promise : Promise.resolve(response(membership('elite'))) })
  await flush()
  await app.render().signOut()
  await app.render().signIn('fixture-b@example.test', 'local-unused')
  old.reject(new Error('Synthetic old request failure'))
  await flush()
  assert.equal(app.render().plan, 'elite')
  assert.equal(app.render().isPro, true)
})

test('sign-out while response JSON is pending also invalidates the old result', async () => {
  const json = deferred()
  const app = harness({ fetchMembership: async () => ({ ok: true, json: () => json.promise }) })
  await flush()
  await app.render().signOut()
  json.resolve(membership('champion'))
  await flush()
  assert.equal(app.render().plan, 'free')
})

test('unmount invalidates in-flight sign-in hydration', async () => {
  const pending = deferred()
  const app = harness({ current: false, fetchMembership: () => pending.promise })
  const signingIn = app.render().signIn('fixture-b@example.test', 'local-unused')
  await flush()
  app.unmount()
  pending.resolve(response(membership('champion')))
  const result = await signingIn
  assert.equal(result.data, null)
  assert.match(result.error.message, /cancelled/)
  assert.equal(app.render().plan, 'free')
})

test('first-login challenge still completes and hydrates paid access', async () => {
  const app = harness({
    current: false,
    authenticate: (_username, callbacks) => callbacks.newPasswordRequired({ name: 'Synthetic', sub: 'read-only', email_verified: true }, []),
    completePassword: (attributes, callbacks) => {
      assert.equal(attributes.sub, undefined)
      assert.equal(attributes.email_verified, undefined)
      callbacks.onSuccess(sessionFor('fixture-new'))
    },
  })
  const result = await app.render().signIn('fixture-new@example.test', 'local-unused')
  assert.equal(result.data.challenge, 'NEW_PASSWORD_REQUIRED')
  assert.equal(app.render().user, null)
  assert.equal((await app.render().completeNewPassword('local-unused-new')).error, null)
  assert.equal(app.render().user.id, 'fixture-new')
  assert.equal(app.render().plan, 'pro')
})

test('a completed first-login challenge cannot restore state after sign-out', async () => {
  let completion
  let membershipCalls = 0
  const app = harness({
    current: false,
    authenticate: (_username, callbacks) => callbacks.newPasswordRequired({}, []),
    completePassword: (_attributes, callbacks) => { completion = callbacks },
    fetchMembership: async () => { membershipCalls++; return response(membership()) },
  })
  await app.render().signIn('fixture-new@example.test', 'local-unused')
  const pending = app.render().completeNewPassword('local-unused-new')
  await app.render().signOut()
  await completion.onSuccess(sessionFor('fixture-new'))
  assert.match((await pending).error.message, /cancelled/)
  assert.equal(app.render().user, null)
  assert.equal(membershipCalls, 0)
})
