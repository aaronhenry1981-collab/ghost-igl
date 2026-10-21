// Reuses the standalone coach's native SpeechSynthesis pattern, with explicit
// opt-in, browser-declared local voices only and no microphone/voice service.
export function createCoachSpeech({ synthesis = globalThis.speechSynthesis, utterance = text => new globalThis.SpeechSynthesisUtterance(text),
  now = Date.now, schedule = setTimeout, cancel = clearTimeout, onStatus = () => {} } = {}) {
  let enabled = false, generation = 0, active = null, timer, last = '', lastAt = 0
  function clear() {
    generation++; cancel(timer)
    if (active) { synthesis?.cancel(); active = null }
  }
  function mute() { enabled = false; clear(); last = ''; lastAt = 0; onStatus('off') }
  function localVoice() { return synthesis?.getVoices().find(voice => voice.localService === true && /^en(?:-|$)/i.test(voice.lang || '')) }
  function enable() {
    if (!synthesis || !localVoice()) { mute(); onStatus('unavailable'); return false }
    enabled = true; onStatus('ready'); return true
  }
  function speak(value, capturedAt, { voiceTest = false } = {}) {
    if (!enabled || !Number.isFinite(capturedAt) || now() - capturedAt > 8000 || capturedAt > now() + 1000) return false
    const voice = localVoice()
    if (!voice) { mute(); onStatus('unavailable'); return false }
    const clean = String(value || '').replace(/[*_#`]/g, '').replace(/\s+/g, ' ').trim()
    const first = clean.match(/^.{1,180}?[.!?](?:\s|$)/)?.[0]?.trim() || clean.split(' ').slice(0, 24).join(' ').slice(0, 180)
    if (!first || (!voiceTest && first === last && now() - lastAt < 30_000)) return false
    clear(); const mine = generation
    const line = utterance(first)
    line.voice = voice; line.lang = voice.lang; line.rate = 1.08; line.pitch = 1; line.volume = 1
    const valid = () => enabled && generation === mine && now() - capturedAt <= 8000
    line.onstart = () => { if (!valid()) { if (active === line) clear(); return }; onStatus('speaking') }
    line.onend = () => { if (generation === mine) { cancel(timer); active = null; onStatus(enabled ? 'ready' : 'off') } }
    line.onerror = event => { if (generation === mine) { cancel(timer); active = null; if (!['canceled','interrupted'].includes(event.error)) { enabled = false; onStatus('failed') } } }
    active = line; last = first; lastAt = now()
    timer = schedule(() => { if (active === line) { clear(); onStatus(enabled ? 'ready' : 'off') } }, Math.max(0, Math.min(6500, 8000 - (now() - capturedAt))))
    try { synthesis.speak(line) } catch { mute(); onStatus('failed'); return false }
    return true
  }
  return { enable, mute, stop: mute, speak, test: () => speak('Spoken coaching is on for this computer.', now(), { voiceTest: true }) }
}
