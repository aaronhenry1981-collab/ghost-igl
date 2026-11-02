export function createRoleSpeech({ synthesis = globalThis.speechSynthesis,
  utterance = text => new globalThis.SpeechSynthesisUtterance(text), schedule = setTimeout, clear = clearTimeout, onStatus = () => {} } = {}) {
  let enabled = false, generation = 0, timer, context = '', active = null
  const voice = () => synthesis?.getVoices().find(item => item.localService === true && /^en(?:-|$)/i.test(item.lang || ''))
  function stop() { generation++; clear(timer); synthesis?.cancel(); active = null; onStatus(enabled ? 'Ready to read' : 'Muted') }
  return {
    enable() { enabled = Boolean(voice()); onStatus(enabled ? 'Ready to read' : 'Local speech unavailable — use the role card'); return enabled },
    mute() { enabled = false; stop() }, stop,
    setContext(value) { if (value !== context) { context = value; stop() } },
    read(text, capturedContext) {
      if (!enabled || capturedContext !== context || !voice()) { onStatus('Local speech unavailable — use the role card'); return false }
      stop(); const mine = generation; const line = utterance(String(text).replace(/\s+/g, ' ').trim().slice(0, 360))
      if (!line.text) return false
      line.voice = voice(); line.lang = line.voice.lang; line.rate = 1
      active = line
      line.onstart = () => { if (mine !== generation || capturedContext !== context || !enabled) { if (active === line) stop(); return }; onStatus('Reading your current role') }
      line.onend = () => { if (mine === generation) { clear(timer); onStatus('Ready to read') } }
      line.onerror = () => { if (mine === generation) { clear(timer); onStatus('Speech interrupted — read or replay the role card') } }
      timer = schedule(() => { if (mine === generation) stop() }, 18_000)
      try { synthesis.speak(line); return true } catch { enabled = false; stop(); onStatus('Speech unavailable — use the role card'); return false }
    },
  }
}
