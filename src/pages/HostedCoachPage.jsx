import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { createAnalysisLoop, createGameplayCapture, frameFromVideo } from '../features/live-coach/capture.mjs'
import { liveRequest, liveRequestId } from '../features/live-coach/api'
import { joinGameplayMeeting } from '../features/live-coach/meeting'
import { createCoachSpeech } from '../features/live-coach/speech.mjs'
import { BROWSER_COACH_PILOT, canUsePilotControls, isPilotWindowOpen } from '../features/live-coach/pilot-release.mjs'
import './HostedCoachPage.css'

const date = value => new Date(value).toLocaleString()
export default function HostedCoachPage() {
  const { user, isAdmin, loading } = useAuth()
  const [pilotOpen, setPilotOpen] = useState(() => isPilotWindowOpen())
  const [availability, setAvailability] = useState(null)
  const [view, setView] = useState('player')
  const [mode, setMode] = useState('private')
  const [session, setSession] = useState(null)
  const [history, setHistory] = useState([])
  const [cards, setCards] = useState([])
  const [captureReady, setCaptureReady] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('Choose your role to begin.')
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [invite, setInvite] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [note, setNote] = useState('')
  const [advice, setAdvice] = useState('')
  const [speechStatus, setSpeechStatus] = useState('off')
  const [review, setReview] = useState(null)
  const preview = useRef(null), remote = useRef(null), active = useRef(null), connection = useRef(null)
  const analysis = useRef(null), generation = useRef(0), sourceEnded = useRef(null)
  const [capture] = useState(() => createGameplayCapture({ onEnded: () => sourceEnded.current?.() }))
  const [speech] = useState(() => createCoachSpeech({ onStatus: setSpeechStatus }))
  const sessionId = session?.id, sessionDeadline = session?.expiresAt
  const userId = user?.id

  const refresh = useCallback(async () => {
    const mine = generation.current
    const [status, saved] = await Promise.all([liveRequest('/status'), liveRequest('/history')])
    if (mine === generation.current) { setAvailability(status); setHistory(saved.sessions || []) }
  }, [])
  useEffect(() => {
    setHistory([]); setReview(null); setSession(null); setInvite(''); setJoinCode(''); setEmail(''); setAdvice(''); setAvailability(null); setError(''); setCaptureReady(false); setConfirmed(false); setBusy(false)
    if (loading || !userId) return
    let canceled = false
    Promise.all([liveRequest('/status'), liveRequest('/history')]).then(([status, saved]) => {
      if (!canceled) { setAvailability(status); setHistory(saved.sessions || []) }
    }).catch(err => { if (!canceled) { setAvailability({ serviceEnabled: false }); setError(err.message) } })
    return () => { canceled = true }
  }, [loading, userId])

  const releaseLocal = useCallback(() => {
    generation.current++; analysis.current?.stop(); analysis.current = null
    speech.stop()
    capture.stop(); void connection.current?.close(); connection.current = null
    if (preview.current) preview.current.srcObject = null
    if (remote.current) remote.current.srcObject = null
  }, [capture, speech])
  const stop = useCallback(async () => {
    const previous = active.current
    active.current = null; releaseLocal()
    const mine = generation.current
    setCaptureReady(false); setConfirmed(false); setAdvice(''); setInvite(''); setSession(null)
    setMessage('Capture stopped on this device. Confirming the private session has ended…')
    if (previous) {
      try {
        const saved = await liveRequest(`/sessions/${previous.id}/${previous.owner ? 'stop' : 'leave'}`, {})
        if (mine !== generation.current) return
        setReview(saved); setMessage('Session ended. Your notes are saved in this account.')
        await refresh()
      } catch (err) { if (mine === generation.current) setError(`${err.message} Local capture is stopped. The server cleanup may still be pending; use Stop in session history to retry.`) }
    } else setMessage('Preview stopped. No gameplay is being shared.')
  }, [refresh, releaseLocal])
  useEffect(() => { sourceEnded.current = () => { void stop() } }, [stop])
  useEffect(() => {
    if (!pilotOpen) return
    const timer = setTimeout(() => { setPilotOpen(false); void stop() }, Math.max(0, Date.parse(BROWSER_COACH_PILOT.endsAt) - Date.now()))
    return () => clearTimeout(timer)
  }, [pilotOpen, stop])
  useEffect(() => () => { active.current = null; releaseLocal() }, [releaseLocal, user?.id])
  useEffect(() => {
    if (!sessionId) return
    let canceled = false
    const timer = setInterval(async () => {
      try {
        const current = await liveRequest(`/sessions/${sessionId}`)
        if (canceled) return
        if (current.state !== 'active' || current.expiresAt <= Date.now()) {
          active.current = null; releaseLocal(); setSession(null); setCaptureReady(false); setConfirmed(false)
          setAdvice(''); setInvite(''); setReview(current); setMessage('This session has ended or expired.')
          void refresh()
        } else { active.current = current; setSession(current) }
      } catch (err) {
        if (!canceled) {
          // Losing server access must not leave a remote stream running.
          active.current = null; releaseLocal(); setSession(null); setCaptureReady(false); setConfirmed(false); setAdvice(''); setError(err.message)
        }
      }
    }, 10_000)
    const deadline = setTimeout(() => { if (!canceled) void stop() }, Math.max(0, sessionDeadline - Date.now()))
    return () => { canceled = true; clearInterval(timer); clearTimeout(deadline) }
  }, [sessionId, sessionDeadline, refresh, releaseLocal, stop])

  async function choose(kind, deviceId) {
    if (!isPilotWindowOpen() || !availability?.available) { setError('This account has no available private pilot session.'); return }
    setError(''); setConfirmed(false); setCaptureReady(false); setBusy(true)
    try {
      const stream = await capture.choose(kind, deviceId)
      if (stream && preview.current) {
        preview.current.srcObject = stream; await preview.current.play()
        setCaptureReady(true); setMessage('Preview stays on this device until you confirm the source and start.')
      }
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  async function findCards() {
    if (!isPilotWindowOpen() || !availability?.available) { setError('This account has no available private pilot session.'); return }
    setError('')
    try {
      const found = await capture.cards(); setCards(found)
      if (!found.length) setMessage('No labeled capture card is available. Use Choose game window to select an existing Elgato preview, or grant your browser camera permission to the capture card in browser settings. No camera was opened.')
    } catch (err) { setError(err.message) }
  }
  async function start() {
    if (busy || !isPilotWindowOpen() || !availability?.available || !confirmed || !capture.current().confirmed) return
    setBusy(true); setError(''); setAdvice(''); setReview(null)
    const mine = ++generation.current
    let created
    try {
      created = await liveRequest('/sessions', { mode, sourceKind: capture.current().kind, sourceConfirmed: true, requestId: liveRequestId() })
      if (mine !== generation.current) { await liveRequest(`/sessions/${created.id}/stop`, {}); return }
      active.current = created; setSession(created)
      if (mode === 'private') {
        const credentials = await liveRequest(`/sessions/${created.id}/join`, { requestId: liveRequestId() })
        if (mine !== generation.current) return
        const joined = await joinGameplayMeeting(credentials, { stream: capture.current().stream, onStatus: value => { if (mine === generation.current) setMessage(value) } })
        if (mine !== generation.current) { await joined.close(); return }
        connection.current = joined
      }
      setMessage(mode === 'private' ? 'Your confirmed gameplay source is connected. Invite your coach when you are ready. Microphone and source audio are off.' : 'Coaching session started. Turn on AI frame analysis separately when you are ready.')
      await refresh()
    } catch (err) {
      if (created) { await liveRequest(`/sessions/${created.id}/stop`, {}).catch(() => {}) }
      if (mine === generation.current) { releaseLocal(); active.current = null; setSession(null); setCaptureReady(false); setConfirmed(false); setError(err.message) }
    } finally { setBusy(false) }
  }
  async function toggleAi() {
    if (!session?.owner || busy) return
    setBusy(true); setError(''); analysis.current?.stop(); speech.stop(); setAdvice('')
    const mine = generation.current
    try {
      const current = await liveRequest(`/sessions/${session.id}/consent`, { enabled: !session.aiEnabled })
      if (mine !== generation.current) return
      active.current = current; setSession(current)
      if (current.aiEnabled) {
        const loop = createAnalysisLoop({
          takeFrame: () => frameFromVideo(preview.current),
          request: (frame, signal) => liveRequest(`/sessions/${current.id}/analyze`, { ...frame, requestId: liveRequestId() }, signal),
          onAdvice: (text, context) => { setAdvice(text); speech.speak(text, context.capturedAt) },
          onError: err => {
            if (mine !== generation.current) return
            speech.stop()
            setError(err.message); setAdvice('')
            void liveRequest(`/sessions/${current.id}/consent`, { enabled: false }).then(value => { if (mine === generation.current) { active.current = value; setSession(value) } }).catch(() => {})
          },
        })
        analysis.current = loop; loop.start(current.epoch)
      }
    } catch (err) { if (mine === generation.current) setError(err.message) }
    finally { setBusy(false) }
  }
  async function makeInvite(event) {
    event.preventDefault(); setBusy(true); setError('')
    const mine = generation.current
    try {
      const result = await liveRequest(`/sessions/${session.id}/invite`, { email })
      if (mine !== generation.current) return
      setInvite(`${result.sessionId}.${result.token}`)
      setMessage('Private invitation created for this email. Copy it and send it to your coach yourself. It expires in 10 minutes.')
    } catch (err) { if (mine === generation.current) setError(err.message) }
    finally { setBusy(false) }
  }
  async function join(event) {
    event.preventDefault(); setBusy(true); setError(''); setReview(null)
    const [id, token, extra] = joinCode.trim().split('.')
    if (!id || !token || extra || !/^[a-zA-Z0-9_-]+$/.test(token)) { setError('Paste the complete private invitation code.'); setBusy(false); return }
    const mine = ++generation.current
    try {
      const credentials = await liveRequest(`/sessions/${id}/join`, { token, requestId: liveRequestId() })
      const current = await liveRequest(`/sessions/${id}`)
      if (mine !== generation.current) { await liveRequest(`/sessions/${id}/leave`, {}); return }
      active.current = current; setSession(current); setJoinCode('')
      const joined = await joinGameplayMeeting(credentials, { video: remote.current, onStatus: value => { if (mine === generation.current) setMessage(value) } })
      if (mine !== generation.current) { await joined.close(); return }
      connection.current = joined; setMessage('Viewing the player’s explicitly shared gameplay. Your microphone and camera are off.')
    } catch (err) { if (mine === generation.current) { releaseLocal(); setError(err.message) } }
    finally { setBusy(false) }
  }
  async function addNote(event) {
    event.preventDefault(); setBusy(true); setError('')
    const target = session || review
    const mine = generation.current
    try {
      const saved = await liveRequest(`/sessions/${target.id}/notes`, { text: note, requestId: liveRequestId(), focus: target.owner && target.state === 'stopped' })
      if (mine !== generation.current) return
      if (session) { active.current = saved; setSession(saved) } else setReview(saved)
      setNote(''); await refresh()
    } catch (err) { if (mine === generation.current) setError(err.message) }
    finally { setBusy(false) }
  }
  async function stopSaved(id) {
    setBusy(true); setError('')
    const mine = generation.current
    try { const saved = await liveRequest(`/sessions/${id}/stop`, {}); if (mine !== generation.current) return; setReview(saved); await refresh() }
    catch (err) { if (mine === generation.current) setError(err.message) } finally { setBusy(false) }
  }

  if (loading) return <main className="hosted-coach"><p role="status">Loading your Recon account…</p></main>
  if (!user) return <main className="hosted-coach"><h1>Private browser coach pilot</h1><p>This limited test uses your existing Recon account. Only the approved account can start a session. Gameplay feedback and spoken coaching still need real gameplay acceptance.</p>{pilotOpen ? <><p>The approved pilot ends {date(BROWSER_COACH_PILOT.endsAt)} in your local time.</p><Link className="btn btn-primary" to="/auth?redirect=/live-coaching">Sign in to check pilot access</Link></> : <p>The approved pilot has ended. No capture, sharing or analysis can start.</p>}<p><Link to="/live">Open the round guide</Link></p></main>
  const available = pilotOpen && canUsePilotControls({ availability, activeSession: session?.state === 'active' })
  const shown = session || review
  return <main className="hosted-coach">
    <header><span className="hosted-eyebrow">Recon 6 - Private browser pilot</span><h1>Your gameplay. Your private session.</h1><p>This test is limited to its approved account and finite grant. Choose your gameplay source yourself. Capture, sharing and AI analysis each require an explicit action.</p><p>Pilot ends {date(BROWSER_COACH_PILOT.endsAt)} in your local time. Gameplay feedback and spoken coaching are still being tested.</p><nav aria-label="Coaching tools"><Link to="/progress">My progress</Link><Link to="/live">Round guide</Link><Link to="/account">My account</Link></nav></header>
    <div className="hosted-banner" role="status">{!pilotOpen ? 'The approved pilot has ended. No new capture, sharing or analysis can start.' : availability ? (available ? message : availability.reason || 'Hosted coaching is not activated yet.') : 'Checking hosted coaching availability.'}</div>
    {error && <div className="hosted-error" role="alert">{error}</div>}
    {!available && <section className="hosted-card"><h2>Hosted sessions are unavailable</h2><p>{availability?.reason || 'The hosted service must pass deployment, credit and live media checks before it can be used.'} No capture has started.</p><p>Your existing Windows coach and website round guide remain available.</p><Link className="btn btn-secondary" to="/live">Open round guide</Link></section>}
    {available && <>
      {!session && <div className="hosted-roles" role="group" aria-label="Your session role"><button type="button" className={view === 'player' ? 'selected' : ''} disabled={busy || captureReady} onClick={() => { setView('player'); setReview(null) }}>Share my gameplay</button><button type="button" className={view === 'coach' ? 'selected' : ''} disabled={busy || captureReady} onClick={() => { setView('coach'); setReview(null) }}>Join as coach</button></div>}
      <div className="hosted-grid">
        <section className="hosted-card">
          <h2>{session?.role === 'coach' || (!session && view === 'coach') ? 'Player’s shared gameplay' : 'My gameplay source'}</h2>
          <video ref={preview} className={view === 'coach' ? 'hosted-hidden' : 'hosted-video'} muted playsInline autoPlay aria-label="Your gameplay preview" />
          <video ref={remote} className={view === 'coach' ? 'hosted-video' : 'hosted-hidden'} muted playsInline autoPlay aria-label="Invited player’s gameplay" />
          {view === 'player' && !session && <>
            <p>PC: select your game window. PS5: HDMI → Elgato → this computer, then select the capture card or its preview window. This shows only your own source.</p>
            <div className="hosted-actions"><button type="button" className="btn btn-secondary" disabled={busy || !availability.available} onClick={() => choose('window')}>Choose game window</button><button type="button" className="btn btn-secondary" disabled={busy || !availability.available} onClick={findCards}>Find capture cards</button></div>
            {cards.map(card => <button key={card.deviceId} type="button" className="btn btn-secondary" disabled={busy} onClick={() => choose('capture-card', card.deviceId)}>Preview {card.label}</button>)}
            {captureReady && <label className="hosted-check"><input type="checkbox" checked={confirmed} onChange={event => { if (event.target.checked) capture.confirm(); setConfirmed(event.target.checked) }} />I can see my gameplay in this preview and agree to share this source.</label>}
            <fieldset disabled={busy}><legend>Session type</legend><label><input type="radio" name="coach-mode" checked={mode === 'private'} onChange={() => setMode('private')} />Private session with my coach</label><label><input type="radio" name="coach-mode" checked={mode === 'ai'} disabled={!availability.aiAvailable} onChange={() => setMode('ai')} />AI practice on my own</label></fieldset>
            <button type="button" className="btn btn-primary" disabled={!confirmed || busy || !availability.available || (mode === 'ai' && !availability.aiAvailable)} onClick={start}>Start live coaching</button>
          </>}
          {view === 'coach' && !session && <form onSubmit={join}><p>The player must choose their own source and invite the email on your verified Recon coach account. You do not need to join their game.</p><label>Private invitation code<input value={joinCode} onChange={event => setJoinCode(event.target.value)} autoComplete="off" spellCheck={false} required /></label><button className="btn btn-primary" disabled={busy || !isAdmin}>Join private session</button>{!isAdmin && <p>A Recon coach account is required to accept an invitation.</p>}</form>}
          {(session || captureReady) && <button type="button" className="hosted-stop" onClick={stop}>{session?.role === 'coach' ? 'Leave and end private session' : 'Stop sharing and coaching'}</button>}
          <p className="hosted-muted">Microphone off. Source audio off. No media recording or paid voice service. Closing this page stops local capture; the server also enforces the session deadline.</p>
        </section>
        <section className="hosted-card">
          <h2>Credits and session controls</h2>
          <p>{availability.available ? `${availability.kind} credits · ${availability.framesRemaining} AI frames · ${availability.shareMinutesRemaining} sharing minutes remaining` : availability.reason}</p>
          {availability.endsAt && <p>Credits end {date(availability.endsAt)}. Sessions last at most 30 minutes. No automatic overage or recharge.</p>}
          {session?.owner && session.mode === 'private' && <form onSubmit={makeInvite}><h3>Invite my coach</h3><label>Coach’s Recon account email<input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="off" required /></label><button className="btn btn-secondary" disabled={busy || !!invite || session.coachConnected}>Create private invitation</button>{invite && <><label>Private invitation code<textarea readOnly value={invite} aria-label="Private invitation code" /></label><button type="button" className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(invite).then(() => setMessage('Invitation copied. Send it only to the invited coach.')).catch(() => setError('Select and copy the invitation code manually.'))}>Copy invitation</button></>}<p>Only the invited verified coach can join. To revoke access, Stop sharing ends the media session and invalidates its invitation.</p></form>}
          {session?.owner && <><h3>AI frame analysis</h3><p>AI is separate from human viewing. Turning it on sends one small frame of this confirmed source for analysis at most every 15 seconds. Raw frames are not saved in session history. Advice is observational; it does not prove rank or skills.</p><button type="button" className="btn btn-secondary" disabled={busy || !availability.aiAvailable} onClick={toggleAi}>{session.aiEnabled ? 'Turn off AI analysis' : 'Allow AI frame analysis'}</button>{advice && <p className="hosted-advice" role="status">{advice}</p>}</>}
          {session?.owner && <div className="hosted-voice"><h3>Spoken AI coaching</h3><label className="hosted-check"><input type="checkbox" checked={['ready','speaking'].includes(speechStatus)} disabled={!session.aiEnabled} onChange={event => { if (event.target.checked) speech.enable(); else speech.mute() }} />Speak fresh AI feedback on this computer</label><div className="hosted-actions"><button type="button" className="btn btn-secondary" disabled={!['ready','speaking'].includes(speechStatus)} onClick={() => speech.test()}>Test local voice</button><button type="button" className="btn btn-secondary" onClick={() => speech.mute()}>Mute spoken coaching</button></div><p role="status">{speechStatus === 'unavailable' ? 'No local English browser voice is available. Written feedback remains available.' : speechStatus === 'failed' ? 'The browser could not speak. Written feedback remains available.' : speechStatus === 'speaking' ? 'Speaking fresh feedback on this computer.' : speechStatus === 'ready' ? 'Local voice ready. Fresh AI feedback will be spoken.' : 'Spoken coaching is off.'}</p><p className="hosted-muted">Uses a browser-declared local voice and this computer’s current audio output. No microphone, remote voice service or audio-routing change. Your PS5 headset and Discord stay on the PS5. Mute, Stop and leaving this page cancel queued speech.</p></div>}
          {shown && <><h3>Private session notes</h3><p>Use text coaching here. Audio communication is not enabled. {shown.state === 'stopped' && shown.owner ? 'Save one focus for your next match.' : 'Notes are visible to this session’s participants.'}</p><ul className="hosted-notes">{shown.notes.map((entry, index) => <li key={`${entry.at}-${index}`}><strong>{entry.source === 'human-coach' ? 'Coach' : 'Player'}:</strong> {entry.text}</li>)}</ul><form onSubmit={addNote}><label>{shown.state === 'stopped' && shown.owner ? 'My next-match focus' : 'Coaching note'}<textarea value={note} onChange={event => setNote(event.target.value)} maxLength={1000} required /></label><button className="btn btn-secondary" disabled={busy || !note.trim()}>Save note</button></form></>}
        </section>
      </div>
    </>}
    <section className="hosted-card"><h2>My session history and review</h2><p>Saved with this Recon account. Human notes and AI observations remain distinct. Your <Link to="/progress">Road to Champion</Link> uses its existing evidence rules; session notes do not automatically certify skills.</p>{!history.length ? <p>No hosted sessions are saved for this account.</p> : <ul className="hosted-history">{history.map(saved => <li key={saved.id}><div><strong>{date(saved.createdAt)}</strong><span>{saved.mode === 'private' ? 'Private coaching' : 'AI practice'} · {saved.state}</span>{saved.focus && <p>Next match: {saved.focus}</p>}</div><button type="button" className="btn btn-secondary" disabled={busy || !!session} onClick={() => setReview(saved)}>Review</button>{saved.state !== 'stopped' && <button type="button" className="hosted-stop" disabled={busy} onClick={() => stopSaved(saved.id)}>Stop session</button>}</li>)}</ul>}{review && <div className="hosted-review"><h3>Review · {date(review.createdAt)}</h3>{review.notes.map((entry, index) => <p key={`n-${index}`}><strong>{entry.source}:</strong> {entry.text}</p>)}{review.review.map((entry, index) => <p key={`a-${index}`}><strong>AI observation:</strong> {entry.text}</p>)}{!review.notes.length && !review.review.length && <p>No coaching notes or AI observations were saved.</p>}</div>}</section>
  </main>
}
