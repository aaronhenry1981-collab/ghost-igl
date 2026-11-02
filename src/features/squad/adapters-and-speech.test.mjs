import test from 'node:test'
import assert from 'node:assert/strict'
import { createLocalSquadAdapter } from './local-adapter.mjs'
import { createRoleSpeech } from './speech.mjs'
const a = { subject: 'a', alias: 'Demo Alpha' }, b = { subject: 'b', alias: 'Demo Bravo' }
function setup() {
  const rows = new Map(); let tail = Promise.resolve()
  const locks = { request: (_key, task) => { const result = tail.then(task); tail = result.catch(() => {}); return result } }
  const storage = { getItem: key => rows.get(key), setItem: (key, value) => rows.set(key, value) }
  return createLocalSquadAdapter({ storage, locks, now: () => 1000, id: () => '1234567890-local' })
}
test('local adapter serializes concurrent joins and isolates outsider reads', async () => {
  const adapter = setup(), room = await adapter.create(a)
  const c = { subject: 'c', alias: 'Demo Charlie' }
  await Promise.all([b, c].map(actor => adapter.dispatch(room.id, actor, { type: 'join', requestId: actor.subject, phaseEpoch: 1 })))
  assert.equal(Object.keys(adapter.read(room.id, a).members).length, 3)
  assert.throws(() => adapter.read(room.id, { subject: 'outsider' }), /Join/)
})
test('missing Web Locks rejects writes instead of pretending atomic storage', async () => {
  const adapter = createLocalSquadAdapter({ storage: {}, locks: null, now: () => 1, id: () => 'abcd' })
  await assert.rejects(() => adapter.create(a), /serialize/)
})
test('a reused create identifier does not overwrite a room', async () => {
  const adapter = setup(); const room = await adapter.create(a)
  await assert.rejects(() => adapter.create(b), /collision/)
  assert.equal(adapter.read(room.id, a).owner, a.subject)
})
function speechFixture(local = true) {
  const spoken = [], status = []; let cancels = 0; let timeout
  const synthesis = { getVoices: () => [{ localService: local, lang: 'en-GB' }], cancel: () => { cancels++ }, speak: line => spoken.push(line) }
  const speech = createRoleSpeech({ synthesis, utterance: text => ({ text }), onStatus: value => status.push(value),
    schedule: callback => { timeout = callback; return 1 }, clear: () => {} })
  return { speech, spoken, status, cancels: () => cancels, timeout: () => timeout() }
}
test('speech requires individual opt-in, current context and a local voice', () => {
  const f = speechFixture(); f.speech.setContext('plan-1')
  assert.equal(f.speech.read('Read this role.', 'plan-1'), false)
  assert.equal(f.speech.enable(), true)
  assert.equal(f.speech.read('Read this role.', 'old-plan'), false)
  assert.equal(f.speech.read('Read this role.', 'plan-1'), true)
  const remote = speechFixture(false); assert.equal(remote.speech.enable(), false); assert.equal(remote.spoken.length, 0)
})
test('Stop cancels queued speech and stale completion cannot restart it', () => {
  const f = speechFixture(); f.speech.enable(); f.speech.setContext('plan-1'); f.speech.read('First role.', 'plan-1')
  const old = f.spoken[0]; f.speech.stop(); const count = f.cancels(); old.onstart(); old.onend()
  assert.equal(f.spoken.length, 1); assert.equal(f.cancels(), count); assert.equal(f.status.at(-1), 'Ready to read')
})
test('late old callback does not cancel a newer valid utterance', () => {
  const f = speechFixture(); f.speech.enable(); f.speech.setContext('plan-1'); f.speech.read('Old role.', 'plan-1')
  f.speech.setContext('plan-2'); f.speech.read('New role.', 'plan-2'); const count = f.cancels()
  f.spoken[0].onstart(); f.spoken[0].onend(); assert.equal(f.cancels(), count)
  f.spoken[1].onstart(); assert.equal(f.status.at(-1), 'Reading your current role')
})
test('Mute disables replay; room/account context changes stop pending speech', () => {
  const f = speechFixture(); f.speech.enable(); f.speech.setContext('account-a'); f.speech.read('Role.', 'account-a')
  const count = f.cancels(); f.speech.setContext('account-b'); assert.ok(f.cancels() > count)
  f.speech.mute(); assert.equal(f.speech.read('Role.', 'account-b'), false)
})
test('speech timeout releases pending output', () => {
  const f = speechFixture(); f.speech.enable(); f.speech.setContext('x'); f.speech.read('Role.', 'x')
  const count = f.cancels(); f.timeout(); assert.ok(f.cancels() > count)
})
