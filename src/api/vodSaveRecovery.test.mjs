import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { buildVodCoachingEvent } from './vodEvidence.js'

const source = readFileSync(new URL('./vodApi.js', import.meta.url), 'utf8').replace(/^import .*\r?\n/gm, '').replace(/export /g, '')
function harness(receipts, { hanging = false, deferredImage = false } = {}) {
  let subject = 'subject-a', modelRequests = 0
  const writes = [], persisted = new Map(), deadlines = [], readers = []
  class FileReader { readAsDataURL() { this.result = 'data:image/png;base64,Zml4dHVyZQ=='; if (deferredImage) readers.push(this); else this.onload() } }
  const context = vm.createContext({
    API_URL: 'https://fixture.invalid', FileReader, buildVodCoachingEvent,
    AbortController, setTimeout: callback => { deadlines.push(callback); return deadlines.length }, clearTimeout() {},
    getCurrentUser: () => ({}), getIdToken: () => `fixture-${subject}`,
    getSession: async () => ({ getIdToken: () => ({ decodePayload: () => ({ sub: subject }) }) }),
    fetch: async (url, request) => {
      if (url.endsWith('/vod/analyze')) { modelRequests++; return { ok: true, json: async () => ({ session: { headline: 'fixture observation', image_count: 1 }, per_image: [], usage: { remaining: 19 } }) } }
      assert.ok(url.endsWith('/me/coaching-events'))
      const event = JSON.parse(request.body).events[0]; writes.push(event)
      if (hanging) return new Promise(() => {})
      const receipt = receipts.shift() || { written: 1, received: 1 }
      if (receipt.written === 1) persisted.set(event.sessionId + '#' + event.ts, event)
      return { ok: true, json: async () => receipt }
    },
  })
  vm.runInContext(source, context)
  return { context, writes, persisted, deadlines, readers, switchUser: value => { subject = value }, models: () => modelRequests }
}

test('HTTP 200 with no durable write is pending, not saved', async () => {
  const app = harness([{ written: 0, received: 1 }])
  const review = await app.context.analyzeSessionApi([{ type: 'image/png' }])
  assert.equal(review.roadmap_sync, 'pending')
  assert.equal(app.persisted.size, 0)
})

test('evidence-only retry reuses its receipt identity and never re-runs paid analysis', async () => {
  const app = harness([{ written: 0, received: 1 }, { written: 1, received: 1 }])
  const review = await app.context.analyzeSessionApi([{ type: 'image/png' }])
  const saved = await app.context.retryVodEvidenceApi(review)
  assert.equal(saved.roadmap_sync, 'saved')
  assert.equal(app.models(), 1)
  assert.equal(app.writes.length, 2)
  assert.deepEqual(app.writes[1], app.writes[0])
  assert.equal(app.persisted.size, 1)
  assert.doesNotMatch(JSON.stringify(app.writes), /base64|Zml4dHVyZQ/)
})

test('pending evidence from another subject cannot be submitted with a new session', async () => {
  const app = harness([{ written: 0, received: 1 }])
  const review = await app.context.analyzeSessionApi([{ type: 'image/png' }])
  app.switchUser('subject-b')
  await assert.rejects(app.context.retryVodEvidenceApi(review), error => error.code === 'not_authenticated')
  assert.equal(app.writes.length, 1)
  assert.equal(app.models(), 1)
})

test('a hanging evidence save yields a bounded pending result, without another model call', async () => {
  const app = harness([], { hanging: true })
  const review = app.context.analyzeSessionApi([{ type: 'image/png' }])
  for (let i = 0; i < 15 && !app.deadlines.length; i++) await Promise.resolve()
  assert.equal(app.deadlines.length, 1)
  app.deadlines[0]()
  assert.equal((await review).roadmap_sync, 'pending')
  assert.equal(app.models(), 1)
})

for (const boundary of ['account', 'reset']) test(`interruption during image encoding prevents paid dispatch: ${boundary}`, async () => {
  const app = harness([], { deferredImage: true })
  let current = true
  const review = app.context.analyzeSessionApi([{ type: 'image/png' }], {}, { isCurrent: () => current })
  for (let i = 0; i < 10 && !app.readers.length; i++) await Promise.resolve()
  if (boundary === 'account') app.switchUser('subject-b')
  else current = false
  app.readers[0].onload()
  await assert.rejects(review, error => ['not_authenticated', 'review_cancelled'].includes(error.code))
  assert.equal(app.models(), 0)
  assert.equal(app.writes.length, 0)
})
