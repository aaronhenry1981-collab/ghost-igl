import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { MAX_VOD_REQUEST_BYTES, buildVodRequestBody, preflightVodUpload, serializeVodRequest } from './vodUploadSize.mjs'

const source = readFileSync(new URL('./vodApi.js', import.meta.url), 'utf8').replace(/^import .*\r?\n/gm, '').replace(/export /g, '')
const bytes = value => new TextEncoder().encode(value).byteLength
const image = (size, extra = {}) => ({ size, type: 'image/png', ...extra })
function harness({ output, deferred = false } = {}) {
  let subject = 'fixture-account', readers = 0, events = 0
  const requests = [], pending = []
  class FileReader {
    constructor() { readers++ }
    readAsDataURL(file) {
      this.result = `data:${file.type || 'image/png'};base64,${output ?? 'A'.repeat(4 * Math.ceil(file.size / 3))}`
      if (deferred) pending.push(() => this.onload())
      else this.onload()
    }
  }
  const context = vm.createContext({
    API_URL: 'https://fixture.invalid', FileReader, preflightVodUpload, serializeVodRequest,
    AbortController, setTimeout, clearTimeout,
    getCurrentUser: () => subject ? {} : null,
    getIdToken: () => 'fixture-token-never-in-errors',
    getSession: async () => ({ getIdToken: () => ({ decodePayload: () => ({ sub: subject }) }) }),
    buildVodCoachingEvent: () => { events++; return { sessionId: 'fixture-session', ts: 'fixture-time' } },
    fetch: async (url, options) => {
      requests.push({ url, ...options })
      if (url.endsWith('/vod/analyze')) return { ok: true, json: async () => ({ session: { headline: 'Fixture review' }, usage: { remaining: 19 } }) }
      assert.ok(url.endsWith('/me/coaching-events'))
      return { ok: true, json: async () => ({ written: 1, received: 1 }) }
    },
  })
  vm.runInContext(source, context)
  return { api: context, requests, pending, readers: () => readers, events: () => events, switchAccount: value => { subject = value } }
}

async function assertRejectedBeforeEncoding(files, context = {}) {
  const app = harness()
  await assert.rejects(app.api.analyzeSessionApi(files, context), problem => {
    assert.equal(problem.code, 'screenshot_batch_too_large')
    assert.equal(problem.allowance_consumed, false)
    assert.match(problem.message, /fewer or smaller screenshots/)
    assert.match(problem.message, /No review started/)
    assert.doesNotMatch(JSON.stringify(problem) + problem.message, /fixture-token|secret-name|raw-frame|fixture-account/)
    assert.equal(problem.usage, undefined)
    return true
  })
  assert.equal(app.readers(), 0)
  assert.equal(app.requests.length, 0)
  assert.equal(app.events(), 0)
}

test('a nominally allowed 5 MiB image is rejected before FileReader, fetch or evidence work', async () => {
  await assertRejectedBeforeEncoding([image(5 * 1024 * 1024, { name: 'secret-name.png' })])
})

test('combined base64 overhead rejects a multi-image batch without encoding a partial batch', async () => {
  await assertRejectedBeforeEncoding([image(1600000), image(1600000)])
})

test('UTF-8 and JSON escaping metadata count before any image encoding', async () => {
  // Code-unit count would fit; UTF-8 plus JSON escaping does not.
  await assertRejectedBeforeEncoding([image(1)], { map: '界'.repeat(1500000), site: '\"\\\n' })
})

test('second-layer API event escaping is bounded even when raw JSON would fit', async () => {
  const context = { map: '\\'.repeat(1400000) }, files = [image(600000)]
  const simulated = buildVodRequestBody([{ base64: 'A'.repeat(800000), media_type: 'image/png' }], context)
  assert.ok(bytes(JSON.stringify(simulated)) < MAX_VOD_REQUEST_BYTES)
  assert.ok(bytes(JSON.stringify(JSON.stringify(simulated))) > 5 * 1024 * 1024)
  await assertRejectedBeforeEncoding(files, context)
  assert.throws(() => serializeVodRequest(simulated), problem => problem.code === 'screenshot_batch_too_large')
})

test('missing or invalid size fails closed without encoding, request or quota metadata', async () => {
  for (const size of [undefined, -1, NaN, Infinity, 0.5]) {
    const app = harness()
    await assert.rejects(app.api.analyzeSessionApi([image(size)]), problem => problem.code === 'screenshot_size_unavailable' && problem.allowance_consumed === false && !problem.usage)
    assert.equal(app.readers(), 0)
    assert.equal(app.requests.length, 0)
  }
})

test('preflight includes exact base64 rounding, media type and only existing context fields', () => {
  const context = { game_id: 'r6', analysis_type: 'rank_snapshot', map: '界😀', side: 'attack', operator: 'O"p', character: 'C\\h', site: 'A\nB', ignored: 'not-sent' }
  for (const size of [0, 1, 2, 3, 4]) {
    const files = [image(size, { type: 'image/webp' })]
    const body = preflightVodUpload(files, context)
    assert.deepEqual(body, buildVodRequestBody([{ base64: '', media_type: 'image/webp' }], context))
    body.images[0].base64 = 'A'.repeat(4 * Math.ceil(size / 3))
    assert.equal(bytes(serializeVodRequest(body)), bytes(JSON.stringify(preflightVodUpload(files, context))) + 4 * Math.ceil(size / 3))
    assert.equal(body.context.ignored, undefined)
  }
})

test('a just-under-cap multi-image review sends the full batch and preserves response/save behavior', async () => {
  const context = { game_id: 'r6', map: '界😀', operator: 'Smoke', side: 'defense', site: 'A', character: '' }
  const files = [image(3), image(0, { type: 'image/jpeg' })]
  const overhead = bytes(JSON.stringify(preflightVodUpload(files, context)))
  files[1].size = 3 * Math.floor((MAX_VOD_REQUEST_BYTES - overhead - 5) / 4)
  const app = harness()
  const result = await app.api.analyzeSessionApi(files, context)
  assert.equal(app.readers(), 2)
  assert.equal(app.requests.length, 2)
  const request = app.requests[0], body = JSON.parse(request.body)
  assert.ok(bytes(request.body) < MAX_VOD_REQUEST_BYTES)
  assert.ok(bytes(request.body) >= MAX_VOD_REQUEST_BYTES - 4)
  assert.equal(body.images.length, 2)
  assert.equal(body.images[0].base64.length, 4)
  assert.equal(body.images[1].base64.length, 4 * Math.ceil(files[1].size / 3))
  assert.deepEqual(body.context, { map: '界😀', side: 'defense', operator: 'Smoke', site: 'A' })
  assert.equal(body.game_id, 'r6')
  assert.equal(request.headers.Authorization, 'Bearer fixture-token-never-in-errors')
  assert.equal(result.roadmap_sync, 'saved')
  assert.equal(result.usage.remaining, 19)
  assert.equal(app.events(), 1)
})

test('exact serialized body cap permits equality and rejects one UTF-8 byte beyond it', () => {
  const body = buildVodRequestBody([{ base64: '', media_type: 'image/png' }], { map: '' })
  const overhead = bytes(JSON.stringify(body))
  body.images[0].base64 = 'A'.repeat(MAX_VOD_REQUEST_BYTES - overhead)
  assert.equal(bytes(serializeVodRequest(body)), MAX_VOD_REQUEST_BYTES)
  body.images[0].base64 += 'A'
  assert.throws(() => serializeVodRequest(body), problem => problem.code === 'screenshot_batch_too_large')
})

test('unexpected encoded output is stopped by exact guard before fetch/model/save', async () => {
  const app = harness({ output: 'raw-frame'.repeat(Math.ceil(MAX_VOD_REQUEST_BYTES / 9)) })
  await assert.rejects(app.api.analyzeSessionApi([image(1)]), problem => {
    assert.equal(problem.code, 'screenshot_batch_too_large')
    assert.doesNotMatch(problem.message, /raw-frame|fixture-token/)
    return true
  })
  assert.equal(app.readers(), 1)
  assert.equal(app.requests.length, 0)
  assert.equal(app.events(), 0)
})

test('rank snapshots still use the same bounded adapter without evidence writes', async () => {
  const app = harness()
  await app.api.analyzeRankSnapshotApi(image(3))
  assert.equal(JSON.parse(app.requests[0].body).analysis_type, 'rank_snapshot')
  assert.equal(app.requests.length, 1)
  assert.equal(app.events(), 0)
})

for (const interruption of ['logout', 'account', 'reset']) test(`existing ${interruption} fence still prevents dispatch after valid encoding`, async () => {
  const app = harness({ deferred: true })
  let current = true
  const request = app.api.analyzeSessionApi([image(3)], {}, { isCurrent: () => current })
  await new Promise(setImmediate)
  assert.equal(app.pending.length, 1)
  if (interruption === 'reset') current = false
  else app.switchAccount(interruption === 'logout' ? null : 'other-account')
  app.pending[0]()
  await assert.rejects(request, problem => ['not_authenticated', 'review_cancelled'].includes(problem.code))
  assert.equal(app.requests.length, 0)
  assert.equal(app.events(), 0)
})

test('actual upload-selection callback rejects before preview FileReader and retains previous selection', () => {
  const component = readFileSync(new URL('../components/vod/SessionUploadZone.jsx', import.meta.url), 'utf8')
  const start = component.indexOf('const addFiles = useCallback('), end = component.indexOf('\n\n  function removeAt', start)
  assert.ok(start >= 0 && end > start)
  const calls = [], previous = [image(1200000)]
  const scope = vm.createContext({
    preflightVodUpload, files: previous, maxImages: 5, tier: 'pro', context: {}, activeGameId: 'r6',
    useCallback: callback => callback,
    setError: message => calls.push(['error', message]), setFiles: value => calls.push(['files', value]), setPreviews: value => calls.push(['previews', value]),
    FileReader: class { constructor() { calls.push(['reader']) } },
  })
  const sizeConstant = component.match(/^const MAX_FILE_SIZE = .*$/m)[0]
  vm.runInContext(`${sizeConstant}; ${component.slice(start, end)}; addFiles([${JSON.stringify(image(2000000))}]);`, scope)
  assert.deepEqual(calls.map(call => call[0]), ['error', 'error'])
  assert.match(calls[1][1], /No review started/)
  assert.equal(previous.length, 1)
})
