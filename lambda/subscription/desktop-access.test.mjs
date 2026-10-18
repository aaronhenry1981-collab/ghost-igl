import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

// Execute the actual production handler and expiry predicate, with only its
// token/storage boundaries stubbed. No AWS connection or real token is used.
const source = readFileSync(new URL('./index.mjs', import.meta.url), 'utf8')
const active = source.slice(source.indexOf('function isActiveSub(s)'), source.indexOf('async function getSubscriptionRows'))
const verify = source.slice(source.indexOf('async function postDesktopVerify('), source.indexOf('// Issues a signed activation token'))
const now = Date.now()
async function check(row, { token = 'valid-fixture', admin = false } = {}) {
  const payload = { email: 'desktop-fixture@example.test', expires_at: now + 86400000, admin }
  const context = vm.createContext({
    Date, JSON,
    getActiveSub: async () => row,
    effectivePlan: sub => sub?.plan || 'free',
    verifyActivationToken: value => value === 'valid-fixture' ? { ok: true, payload } : { ok: false },
  })
  vm.runInContext(active + '\n' + verify, context)
  const response = await context.postDesktopVerify(JSON.stringify({ token }), {})
  return { status: response.statusCode, body: JSON.parse(response.body) }
}
const membership = (plan, extra = {}) => ({ plan, status: 'active', current_period_end: new Date(now + 3600000).toISOString(), ...extra })

test('desktop re-verification accepts paid tiers and bounds access by membership expiry', async () => {
  for (const plan of ['pro', 'elite', 'champion']) {
    const result = await check(membership(plan))
    assert.equal(result.status, 200)
    assert.equal(result.body.plan, plan)
    assert.equal(result.body.status, 'active', '2.0.4 activation requires membership status')
    assert.equal(result.body.expires_at, now + 3600000)
  }
})

test('active comp and card trial qualify; expired or canceled access does not', async () => {
  assert.equal((await check(membership('elite', { comp: true }))).status, 200)
  const trial = await check(membership('pro', { status: 'trialing' }))
  assert.equal(trial.status, 200)
  assert.equal(trial.body.status, 'trialing')
  for (const extra of [{ comp: true, current_period_end: new Date(now - 1).toISOString() }, { status: 'canceled' }, { current_period_end: 'invalid' }]) {
    assert.equal((await check(membership('elite', extra))).status, 403)
  }
})

test('previously issued token cannot retain desktop access after downgrade to a non-desktop plan', async () => {
  for (const plan of ['free', 'basic', 'unknown']) {
    const result = await check(membership(plan))
    assert.equal(result.status, 403, plan)
    assert.equal(result.body.valid, false)
  }
})

test('signed administrator behavior is preserved and invalid tokens fail closed', async () => {
  const admin = await check(null, { admin: true })
  assert.equal(admin.status, 200)
  assert.equal(admin.body.status, 'active')
  assert.equal((await check(membership('champion'), { token: 'invalid' })).status, 401)
  assert.equal((await check(membership('champion'), { token: '' })).status, 401)
})
