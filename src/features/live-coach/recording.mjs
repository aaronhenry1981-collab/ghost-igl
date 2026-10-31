export const RECORDING_LIMITS = Object.freeze({ durationMs: 300_000, bytes: 64 * 1024 * 1024, videoBitsPerSecond: 1_000_000 })
const FINAL_CHUNK_RESERVE = 4 * 1024 * 1024

// Only receives an already selected, confirmed gameplay stream. No device request,
// network call, audio, session creation or automatic download belongs here.
export function createGameplayRecorder({ Recorder = globalThis.MediaRecorder, onState = () => {}, onComplete = () => {}, onRelease = () => {}, now = () => performance.now(), schedule = setTimeout, cancel = clearTimeout } = {}) {
  let run = null
  function clearTimers(current) { cancel(current.timer); cancel(current.clock); cancel(current.finalTimer) }
  function release(current) {
    if (current.released) return
    current.released = true
    current.stream.getTracks().forEach(track => track.stop())
    onRelease()
  }
  function finish(current) {
    if (run !== current) return
    clearTimers(current); release(current); run = null
    current.track.removeEventListener('ended', current.ended)
    const blob = !current.failed && current.bytes > 0 ? new Blob(current.chunks, { type: current.recorder.mimeType }) : null
    current.chunks = []
    onState({ phase: blob ? 'ready' : 'error', reason: current.reason, bytes: blob?.size || 0, seconds: Math.min(300, Math.floor((now() - current.startedAt) / 1000)) })
    if (blob) onComplete(blob)
  }
  function stop(reason = 'user') {
    const current = run
    if (!current || current.stopping) return
    current.stopping = true; current.reason = reason
    cancel(current.timer); cancel(current.clock)
    onState({ phase: 'stopping', reason, bytes: current.bytes })
    try { if (current.recorder.state !== 'inactive') current.recorder.stop() } catch { current.failed = true }
    release(current)
    if (run !== current) return
    if (current.failed) finish(current)
    else current.finalTimer = schedule(() => { current.failed = true; current.reason = 'finalize-failed'; finish(current) }, 5000)
  }
  function discard() {
    const current = run
    if (!current) return
    run = null; clearTimers(current)
    current.track.removeEventListener('ended', current.ended)
    current.chunks = []
    try { if (current.recorder.state !== 'inactive') current.recorder.stop() } catch { /* tracks are still released */ }
    release(current)
  }
  function start(source) {
    if (run) throw new Error('Stop the current recording before starting another.')
    const stream = source?.stream, tracks = stream?.getVideoTracks() || []
    if (!source?.confirmed || !['capture-card', 'window'].includes(source.kind) || tracks.length !== 1 || tracks[0].readyState !== 'live' || stream.getAudioTracks().length) throw new Error('Confirm one live, video-only gameplay source before recording.')
    if (source.kind === 'window' && tracks[0].getSettings().displaySurface !== 'window') throw new Error('Only the confirmed gameplay preview window can be recorded.')
    const mimeType = ['video/webm;codecs=vp8', 'video/webm'].find(type => Recorder?.isTypeSupported?.(type))
    if (!mimeType) throw new Error('This browser cannot save WebM recordings. Use a supported desktop Chrome or Edge browser.')
    const recorder = new Recorder(stream, { mimeType, videoBitsPerSecond: RECORDING_LIMITS.videoBitsPerSecond })
    const current = { recorder, stream, track: tracks[0], chunks: [], bytes: 0, startedAt: now(), reason: 'user' }
    run = current
    current.ended = () => stop('source-ended')
    current.track.addEventListener('ended', current.ended, { once: true })
    recorder.ondataavailable = event => {
      if (run !== current || current.failed || !event.data?.size) return
      if (current.bytes + event.data.size > RECORDING_LIMITS.bytes) {
        current.failed = true; current.reason = 'size-exceeded'; current.chunks = []
        if (!current.stopping) stop('size-exceeded')
        return
      }
      current.chunks.push(event.data); current.bytes += event.data.size
      if (current.bytes >= RECORDING_LIMITS.bytes - FINAL_CHUNK_RESERVE) stop('size-limit')
    }
    recorder.onstop = () => finish(current)
    recorder.onerror = () => { if (run === current) { current.failed = true; stop('recorder-error') } }
    try { recorder.start(1000) } catch (error) { discard(); throw error }
    const tick = () => {
      if (run !== current || current.stopping) return
      const elapsed = now() - current.startedAt
      if (elapsed >= RECORDING_LIMITS.durationMs) { stop('time-limit'); return }
      onState({ phase: 'recording', bytes: current.bytes, seconds: Math.floor(elapsed / 1000) })
      current.clock = schedule(tick, 1000)
    }
    current.timer = schedule(() => stop('time-limit'), RECORDING_LIMITS.durationMs)
    tick()
  }
  return { start, stop, discard }
}
