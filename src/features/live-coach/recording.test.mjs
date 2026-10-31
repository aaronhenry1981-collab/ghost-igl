import test from 'node:test'
import assert from 'node:assert/strict'
import { createGameplayRecorder, RECORDING_LIMITS } from './recording.mjs'
import { createGameplayCapture } from './capture.mjs'

test('browser permission denial leaves no selected or confirmed capture', async () => {
  const capture = createGameplayCapture({ devices: { getUserMedia: async () => { throw new Error('NotAllowedError') }, getDisplayMedia: async () => { throw new Error('NotAllowedError') } } })
  await assert.rejects(capture.choose('window'), /NotAllowedError/)
  assert.equal(capture.current().stream, null); assert.equal(capture.current().confirmed, false)
})

function fixture() {
  const states = [], results = [], timers = new Map(), instances = []
  let time = 0, id = 0, releases = 0
  class Recorder {
    static isTypeSupported(type) { return type === 'video/webm;codecs=vp8' }
    constructor(stream, options) { this.stream = stream; this.mimeType = options.mimeType; this.options = options; this.state = 'inactive'; instances.push(this) }
    start(slice) { this.slice = slice; this.state = 'recording' }
    stop() { this.state = 'inactive' }
    data(size = 20) { this.ondataavailable({ data: new Blob([new Uint8Array(size)]) }) }
    finish() { this.onstop() }
  }
  const recorder = createGameplayRecorder({ Recorder, onState: state => states.push(state), onComplete: blob => results.push(blob), onRelease: () => releases++, now: () => time,
    schedule: (fn, delay) => { timers.set(++id, { fn, delay }); return id }, cancel: key => timers.delete(key) })
  const source = () => {
    const track = new EventTarget()
    track.readyState = 'live'; track.stop = () => { track.readyState = 'ended' }; track.getSettings = () => ({ displaySurface: 'window' })
    return { confirmed: true, kind: 'capture-card', stream: { getVideoTracks: () => [track], getTracks: () => [track], getAudioTracks: () => [] }, track }
  }
  return { recorder, Recorder, instances, source, states, results, timers, releases: () => releases, advance: value => { time = value }, fire: delay => { const [key, value] = [...timers].find(([, timer]) => timer.delay === delay); timers.delete(key); value.fn() } }
}
test('start requires explicit confirmed video-only gameplay; never selects a device', () => {
  const f = fixture()
  for (const change of [{ confirmed: false }, { kind: 'camera' }, { stream: { getVideoTracks: () => [] } }]) assert.throws(() => f.recorder.start({ ...f.source(), ...change }))
  const source = f.source(); source.stream.getAudioTracks = () => [{}]
  assert.throws(() => f.recorder.start(source)); assert.equal(f.instances.length, 0)
})
test('unrecognized window/desktop/tab rejected, supported confirmed window accepted', () => {
  const f = fixture(), source = f.source(); source.kind = 'window'
  for (const surface of ['browser', 'monitor', undefined]) { source.track.getSettings = () => ({ displaySurface: surface }); assert.throws(() => f.recorder.start(source)) }
  source.track.getSettings = () => ({ displaySurface: 'window' }); f.recorder.start(source); f.recorder.discard()
})
test('start/stop finalizes a video-only WebM and immediately releases capture; repeat is fresh', () => {
  const f = fixture()
  for (let round = 0; round < 2; round++) {
    const source = f.source(); f.recorder.start(source)
    const r = f.instances.at(-1); assert.equal(r.options.videoBitsPerSecond, 1_000_000); assert.equal(r.slice, 1000)
    assert.throws(() => f.recorder.start(source)); r.data(); f.recorder.stop()
    assert.equal(source.track.readyState, 'ended'); assert.equal(f.states.at(-1).phase, 'stopping')
    r.data(5); r.finish(); assert.equal(f.results.at(-1).size, 25); assert.equal(f.results.at(-1).type, 'video/webm;codecs=vp8'); assert.equal(f.timers.size, 0)
  }
  assert.equal(f.releases(), 2)
})
test('five minute deadline stops capture and makes bounded result available', () => {
  const f = fixture(), source = f.source(); f.recorder.start(source); f.instances[0].data()
  f.advance(300_000); f.fire(300_000); assert.equal(source.track.readyState, 'ended'); f.instances[0].finish()
  assert.equal(f.states.at(-1).reason, 'time-limit'); assert.equal(f.states.at(-1).seconds, 300)
})
test('size threshold reserves finalization room and saved result never exceeds 64 MiB', () => {
  const f = fixture(); f.recorder.start(f.source()); f.instances[0].data(60 * 1024 * 1024)
  assert.equal(f.states.at(-1).reason, 'size-limit'); f.instances[0].data(1024); f.instances[0].finish()
  assert.ok(f.results[0].size <= RECORDING_LIMITS.bytes); assert.equal(f.timers.size, 0)
})
test('oversize encoder chunk fails closed instead of downloading truncated WebM', () => {
  const f = fixture(), source = f.source(); f.recorder.start(source); f.instances[0].data(64 * 1024 * 1024 + 1)
  f.instances[0].finish(); assert.equal(f.results.length, 0); assert.equal(source.track.readyState, 'ended'); assert.equal(f.states.at(-1).phase, 'error')
})
test('source disconnect, encoder failure and missing final event release capture', () => {
  for (const event of ['ended', 'error', 'timeout']) {
    const f = fixture(), source = f.source(); f.recorder.start(source); f.instances[0].data()
    if (event === 'ended') { source.track.dispatchEvent(new Event('ended')); f.instances[0].finish(); assert.equal(f.results.length, 1) }
    if (event === 'error') { f.instances[0].onerror(); assert.equal(f.results.length, 0) }
    if (event === 'timeout') { f.recorder.stop(); f.fire(5000); assert.equal(f.results.length, 0) }
    assert.equal(source.track.readyState, 'ended'); assert.equal(f.timers.size, 0)
  }
})
test('navigation/account cleanup discards output and suppresses late callbacks', () => {
  const f = fixture(), source = f.source(); f.recorder.start(source); f.instances[0].data(); f.recorder.stop(); f.recorder.discard()
  const before = f.states.length; f.instances[0].data(); f.instances[0].finish(); f.instances[0].onerror()
  assert.equal(f.results.length, 0); assert.equal(f.states.length, before); assert.equal(f.timers.size, 0); assert.equal(source.track.readyState, 'ended')
})
test('unsupported MediaRecorder and encoder start denial surface errors without dangling runs', () => {
  const f = fixture(); f.Recorder.isTypeSupported = () => false
  assert.throws(() => f.recorder.start(f.source()), /cannot save WebM/)
  f.Recorder.isTypeSupported = () => true; f.Recorder.prototype.start = () => { throw new Error('denied') }
  const source = f.source(); assert.throws(() => f.recorder.start(source), /denied/); assert.equal(source.track.readyState, 'ended'); assert.equal(f.timers.size, 0)
})
