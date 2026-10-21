export function createGameplayCapture({ devices = globalThis.navigator?.mediaDevices, onEnded = () => {} } = {}) {
  let generation = 0, stream = null, confirmed = false, kind = null
  const release = value => value?.getTracks().forEach(track => track.stop())
  function stop() { generation++; confirmed = false; kind = null; release(stream); stream = null }
  async function cards() {
    if (!devices?.enumerateDevices) throw new Error('Use a desktop browser with capture support.')
    const list = await devices.enumerateDevices()
    return list.filter(device => device.kind === 'videoinput' && /elgato|4k\s*x|hd60|game\s*capture/i.test(device.label))
  }
  async function choose(sourceKind, deviceId) {
    stop()
    const mine = generation
    if (!devices?.getUserMedia || !devices?.getDisplayMedia) throw new Error('Capture needs HTTPS and a supported desktop browser.')
    let selected
    if (sourceKind === 'capture-card') {
      const allowed = await cards()
      if (!allowed.some(device => device.deviceId === deviceId)) throw new Error('Select a listed capture card. No camera is selected automatically.')
      if (mine !== generation) return null
      selected = await devices.getUserMedia({ audio: false, video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 15, max: 15 } } })
    } else if (sourceKind === 'window') {
      selected = await devices.getDisplayMedia({ audio: false, video: { displaySurface: 'window', frameRate: 15, width: { ideal: 1280 }, height: { ideal: 720 } },
        systemAudio: 'exclude', monitorTypeSurfaces: 'exclude', selfBrowserSurface: 'exclude', surfaceSwitching: 'exclude' })
      if (selected.getVideoTracks()[0]?.getSettings().displaySurface !== 'window') {
        release(selected); throw new Error('Choose only your game window or capture preview window. Entire-screen and browser-tab sharing are blocked.')
      }
    } else throw new Error('Choose a gameplay source.')
    // Discard any unexpected audio tracks even if a browser ignores audio:false.
    for (const track of selected.getAudioTracks()) { track.stop(); selected.removeTrack(track) }
    if (mine !== generation) { release(selected); return null }
    if (selected.getVideoTracks().length !== 1) { release(selected); throw new Error('A single gameplay video source is required.') }
    stream = selected; kind = sourceKind
    selected.getVideoTracks()[0].addEventListener('ended', () => {
      if (stream === selected) { stop(); onEnded() }
    }, { once: true })
    return selected
  }
  return { cards, choose, stop, confirm() {
    if (!stream?.getVideoTracks().some(track => track.readyState === 'live')) throw new Error('Choose your gameplay source first.')
    confirmed = true
  }, current: () => ({ stream, kind, confirmed }) }
}

export function frameFromVideo(video, document = globalThis.document) {
  if (!video || video.readyState < 2 || !video.videoWidth) throw new Error('The gameplay preview is not ready.')
  const canvas = document.createElement('canvas')
  const scale = Math.min(1, 768 / Math.max(video.videoWidth, video.videoHeight))
  canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale)
  canvas.getContext('2d', { alpha: false }).drawImage(video, 0, 0, canvas.width, canvas.height)
  const image = canvas.toDataURL('image/jpeg', 0.65).split(',')[1]
  if (!image || image.length > 400_000) throw new Error('This frame is too large. Reduce the capture resolution.')
  return image
}

export function createAnalysisLoop({ takeFrame, request, onAdvice, onError, now = Date.now, schedule = setTimeout, cancel = clearTimeout }) {
  let generation = 0, timer, controller, sequence = 0
  function stop() { generation++; cancel(timer); controller?.abort(); controller = null }
  function start(epoch) {
    stop(); const mine = generation
    async function tick() {
      if (mine !== generation) return
      const capturedAt = now(), seq = ++sequence
      controller = new AbortController()
      try {
        const image = takeFrame()
        const result = await request({ capturedAt, sequence: seq, epoch, image }, controller.signal)
        if (mine === generation && !result.stale && result.epoch === epoch && result.sequence === seq && now() - capturedAt <= 8000) onAdvice(result.text, { capturedAt, epoch, sequence: seq })
      } catch (error) {
        if (mine === generation) { stop(); onError(error) }
        return
      }
      if (mine === generation) timer = schedule(tick, 15_000)
    }
    void tick()
  }
  return { start, stop }
}
