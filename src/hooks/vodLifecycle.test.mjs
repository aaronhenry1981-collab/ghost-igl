import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const source = readFileSync(new URL('./useVodAnalysis.js', import.meta.url), 'utf8').replace(/^import .*\r?\n/gm, '').replace(/export /g, '')
const deferred = () => { let resolve, reject; const promise = new Promise((ok, fail) => { resolve = ok; reject = fail }); return { promise, resolve, reject } }
function harness() {
  const state = [], refs = [], updates = [], effects = []
  let index = 0, refIndex = 0, user = { id: 'subject-a' }, generation = 1
  const pending = []
  const context = vm.createContext({
    useState: initial => { const slot = index++; if (!(slot in state)) state[slot] = initial; return [state[slot], next => { state[slot] = typeof next === 'function' ? next(state[slot]) : next }] },
    useRef: initial => refs[refIndex++] ||= { current: initial },
    useEffect: callback => { effects.push(callback) },
    useAuth: () => ({ user, captureAuthScope: () => generation, isAuthScopeCurrent: value => value === generation, setVodUsage: usage => updates.push(usage) }),
    analyzeSessionApi: () => { const task = deferred(); pending.push(task); return task.promise },
    retryVodEvidenceApi: async analysis => ({ ...analysis, roadmap_sync: 'saved' }),
  })
  vm.runInContext(source, context)
  const render = () => { index = 0; refIndex = 0; return context.useVodAnalysis() }
  return { render, pending, updates, switchUser: id => { generation++; user = id ? { id } : null } }
}
const result = { session: { headline: 'private review for A' }, usage: { remaining: 19 } }

for (const next of [null, 'subject-b']) test(`late successful review cannot cross auth boundary: ${next || 'logout'}`, async () => {
  const app = harness(), task = app.render().analyzeSession([{}])
  app.switchUser(next); app.render()
  app.pending[0].resolve(result); await task
  assert.equal(app.render().analysis, null)
  assert.equal(app.updates.length, 0)
  assert.equal(app.render().loading, false)
})

test('late failed review cannot overwrite the next account allowance or error', async () => {
  const app = harness(), task = app.render().analyzeSession([{}])
  app.switchUser('subject-b'); app.render()
  app.pending[0].reject(Object.assign(Error('private error A'), { usage: { remaining: 0 } })); await task
  assert.equal(app.updates.length, 0)
  assert.equal(app.render().error, null)
})

test('reset invalidates an outstanding review without automatic resubmission', async () => {
  const app = harness(), task = app.render().analyzeSession([{}])
  app.render().reset(); app.pending[0].resolve(result); await task
  assert.equal(app.render().analysis, null)
  assert.equal(app.pending.length, 1)
})

test('repeated submit cannot create a second paid request while the first is active', async () => {
  const app = harness(), first = app.render().analyzeSession([{}]), second = app.render().analyzeSession([{}])
  await second
  assert.equal(app.pending.length, 1)
  assert.equal(app.render().loading, true)
  app.pending[0].resolve(result); await first
  assert.equal(app.render().analysis.session.headline, 'private review for A')
  assert.equal(app.updates.length, 1)
})