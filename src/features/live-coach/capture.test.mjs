import test from 'node:test'
import assert from 'node:assert/strict'
import { createGameplayCapture, createAnalysisLoop } from './capture.mjs'

function track(settings = {}) { return { readyState: 'live', stopped: false, stop() { this.stopped = true; this.readyState = 'ended' }, getSettings: () => settings, addEventListener() {} } }
function media(surface = 'window', audio = false) {
  const video = track({ displaySurface: surface }), sound = audio ? track() : null
  return { video, sound, getVideoTracks: () => [video], getAudioTracks: () => sound && !sound.stopped ? [sound] : [], getTracks: () => [video, sound].filter(Boolean), removeTrack() {} }
}
function fixture(source = media()) {
  const calls = [], devices = {
    async enumerateDevices() { calls.push('list'); return [{ kind: 'videoinput', label: 'Elgato 4K X', deviceId: 'card' }, { kind: 'videoinput', label: 'Webcam', deviceId: 'camera' }] },
    async getUserMedia(options) { calls.push(options); return source },
    async getDisplayMedia(options) { calls.push(options); return source },
  }
  return { capture: createGameplayCapture({ devices }), calls, devices, source }
}
test('construction never opens devices; only known capture cards are listed', async () => {
  const f = fixture(); assert.equal(f.calls.length, 0)
  assert.equal((await f.capture.cards()).length, 1)
  await assert.rejects(f.capture.choose('capture-card', 'camera'))
  assert.equal(f.calls.some(call => call.video), false)
})

test('device discovery reports hidden labels without requesting permission or opening media', async () => {
  let opened = 0
  const capture = createGameplayCapture({ devices: {
    enumerateDevices: async () => [{ kind: 'videoinput', label: '', deviceId: '' }],
    getUserMedia: async () => { opened++; throw Error('must not open') },
    getDisplayMedia: async () => { opened++; throw Error('must not open') },
  } })
  assert.deepEqual(await capture.inspectCards(), { cards: [], hiddenLabels: true, videoInputCount: 1 })
  assert.equal(opened, 0)
})

test('discovery distinguishes no exposed inputs from a named non-card and rejects a card without an ID', async () => {
  for (const inputs of [[], [{ kind: 'videoinput', label: 'Webcam', deviceId: 'camera' }], [{ kind: 'videoinput', label: 'Elgato 4K X', deviceId: '' }]]) {
    const capture = createGameplayCapture({ devices: { enumerateDevices: async () => inputs } })
    const result = await capture.inspectCards()
    assert.equal(result.cards.length, 0)
    assert.equal(result.hiddenLabels, false)
    assert.equal(result.videoInputCount, inputs.length)
  }
})
test('capture card uses exact device ID and audio:false; source needs explicit confirmation', async () => {
  const f = fixture(); await f.capture.choose('capture-card', 'card')
  assert.equal(f.capture.current().confirmed, false)
  assert.deepEqual(f.calls[1].video.deviceId, { exact: 'card' }); assert.equal(f.calls[1].audio, false)
  f.capture.confirm(); assert.equal(f.capture.current().confirmed, true)
  f.capture.stop(); assert.equal(f.source.video.stopped, true)
})
test('whole-desktop and tab sharing fail closed and release all tracks', async () => {
  for (const kind of ['monitor', 'browser', undefined]) {
    const f = fixture(media(kind === undefined ? null : kind, true))
    await assert.rejects(f.capture.choose('window'))
    assert.equal(f.source.video.stopped, true); assert.equal(f.source.sound.stopped, true)
  }
})
test('unexpected source audio is discarded and stale pending capture is released after Stop', async () => {
  const f = fixture(media('window', true)); await f.capture.choose('window')
  assert.equal(f.source.sound.stopped, true)
  f.capture.stop()
  let resolve
  const next = media()
  f.devices.getDisplayMedia = () => new Promise(r => { resolve = r })
  const pending = f.capture.choose('window'); f.capture.stop(); resolve(next)
  assert.equal(await pending, null); assert.equal(next.video.stopped, true)
})
test('analysis aborts and suppresses a late response after Stop', async () => {
  let resolve, signal, advice = 0
  const loop = createAnalysisLoop({ takeFrame: () => 'jpeg', request: (body, s) => { signal = s; return new Promise(r => { resolve = () => r({ ...body, text: 'late' }) }) }, onAdvice: () => advice++, onError: assert.fail })
  loop.start(1); loop.stop(); resolve(); await new Promise(r => setImmediate(r))
  assert.equal(signal.aborted, true); assert.equal(advice, 0)
})

test('finite analysis completes after three images without taking or dispatching a fourth', async () => {
  const pending = []
  let images = 0, requests = 0, completed = 0
  const sequences = []
  const loop = createAnalysisLoop({ maxFrames: 3, initialSequence: 4,
    takeFrame: () => { images++; return 'synthetic-jpeg' },
    request: async body => { requests++; sequences.push(body.sequence); return { ...body, text: 'synthetic advice' } },
    onAdvice() {}, onError: assert.fail, onComplete: () => { completed++ },
    schedule: callback => { pending.push(callback); return pending.length }, cancel() {},
  })
  loop.start(2)
  await new Promise(resolve => setImmediate(resolve))
  while (pending.length) { pending.shift()(); await new Promise(resolve => setImmediate(resolve)) }
  assert.equal(images, 3); assert.equal(requests, 3); assert.equal(completed, 1)
  assert.deepEqual(sequences, [5, 6, 7])
})

test('zero or invalid image allowance cannot dispatch an image', async () => {
  let completed = 0
  const loop = createAnalysisLoop({ maxFrames: 0, takeFrame: assert.fail, request: assert.fail, onAdvice: assert.fail, onError: assert.fail, onComplete: () => completed++ })
  loop.start(1)
  assert.equal(completed, 1)
  for (const maxFrames of [-1, 1.2, NaN]) assert.throws(() => createAnalysisLoop({ maxFrames }))
})
test('stale epoch and aged advice never display; loop schedules one request at a time', async () => {
  let clock = 1000, resolve, scheduled = 0, advice = 0, calls = 0
  const loop = createAnalysisLoop({ now: () => clock, takeFrame: () => 'jpeg', request: body => { calls++; return new Promise(r => { resolve = () => r({ ...body, epoch: 9, text: 'bad' }) }) },
    schedule: () => { scheduled++ }, cancel() {}, onAdvice: () => advice++, onError: assert.fail })
  loop.start(1); assert.equal(calls, 1); assert.equal(scheduled, 0)
  clock += 10_000; resolve(); await new Promise(r => setImmediate(r))
  assert.equal(advice, 0); assert.equal(scheduled, 1); loop.stop()
})
