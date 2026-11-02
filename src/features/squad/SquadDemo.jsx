import { useEffect, useMemo, useRef, useState } from 'react'
import { DEMO_PLANS, OPERATORS, PHASES, myRole, planFor } from './domain.mjs'
import { createLocalSquadAdapter } from './local-adapter.mjs'
import { createRoleSpeech } from './speech.mjs'
import PreviewInstall from './PreviewInstall.jsx'
import RoleCard from './RoleCard.jsx'
import '../../index.css'
import './squad.css'

const PLAYERS = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'].map((name, index) => ({ subject: `synthetic-${index}`, alias: `Demo ${name}` }))
const phaseNames = { prequeue: 'Prepare', map_offer: 'Map choice', round_prep: 'Round prep', action: 'Action', result: 'Result' }
const viewKey = subject => `recon.squad.synthetic.view.v1.${subject}`
function initialView() {
  try {
    const id = localStorage.getItem(viewKey(PLAYERS[0].subject))
    if (!/^[a-f0-9]{10}$/.test(id || '')) return null
    const room = JSON.parse(localStorage.getItem(`recon.squad.synthetic.v1.${id}`) || 'null')
    return room?.schema === 1 && room.members?.[PLAYERS[0].subject] && !room.excluded?.includes(PLAYERS[0].subject) ? room : null
  } catch { return null }
}
function rememberView(subject, roomId) { try { if (roomId) localStorage.setItem(viewKey(subject), roomId); else localStorage.removeItem(viewKey(subject)) } catch { /* Resume is optional; do not discard a confirmed change. */ } }
export default function SquadDemo() {
  const [initial] = useState(initialView)
  const [actorId, setActorId] = useState(PLAYERS[0].subject), [roomId, setRoomId] = useState(initial?.id || ''), [room, setRoom] = useState(initial)
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [audioEnabled, setAudioEnabled] = useState(false), [audioStatus, setAudioStatus] = useState('Muted')
  const [online, setOnline] = useState(navigator.onLine)
  const generation = useRef(0), attached = useRef(Boolean(initial))
  const [viewOpen, setViewOpen] = useState(Boolean(initial))
  const actor = PLAYERS.find(player => player.subject === actorId)
  const adapter = useMemo(() => createLocalSquadAdapter({ storage: { getItem: name => localStorage.getItem(name), setItem: (name, value) => localStorage.setItem(name, value) }, locks: navigator.locks }), [])
  const speech = useMemo(() => createRoleSpeech({ onStatus: setAudioStatus }), [])
  const selected = planFor(room?.plan?.id), role = myRole(room, actor.subject), igl = room?.igl === actor.subject
  const context = [actor.subject, room?.id, room?.round, room?.phaseEpoch, room?.iglTerm, room?.planRevision, room?.assignmentRevision, room?.plan?.locked].join(':')
  useEffect(() => { speech.setContext(context); return () => speech.stop() }, [speech, context])
  useEffect(() => {
    const changed = () => setOnline(navigator.onLine)
    window.addEventListener('online', changed); window.addEventListener('offline', changed)
    return () => { window.removeEventListener('online', changed); window.removeEventListener('offline', changed) }
  }, [])
  useEffect(() => {
    const hide = () => { if (document.hidden) speech.stop() }
    document.addEventListener('visibilitychange', hide)
    return () => { document.removeEventListener('visibilitychange', hide); speech.mute() }
  }, [speech])
  useEffect(() => {
    if (!viewOpen) return
    const mine = generation.current
    const update = event => {
      if (!attached.current || generation.current !== mine) return
      if (event.key !== `recon.squad.synthetic.v1.${roomId}`) return
      try { setRoom(adapter.read(roomId, actor)); setError('') }
      catch (problem) { generation.current++; attached.current = false; setViewOpen(false); setBusy(false); rememberView(actor.subject, null); speech.mute(); setAudioEnabled(false); setRoom(null); setError(problem.message) }
    }
    window.addEventListener('storage', update)
    return () => window.removeEventListener('storage', update)
  }, [adapter, roomId, actor, speech, viewOpen])
  async function perform(task) {
    if (!navigator.onLine) { setError('Offline — this cached view cannot confirm squad changes. Reconnect first.'); return }
    const mine = generation.current
    setBusy(true); setError('')
    try { const next = await task(); if (generation.current === mine) { attached.current = true; setViewOpen(true); rememberView(actor.subject, next.id); setRoom(current => current?.id === next.id && current.revision > next.revision ? current : next); setRoomId(next.id) } }
    catch (problem) { if (generation.current === mine) setError(problem.message) }
    finally { if (generation.current === mine) setBusy(false) }
  }
  function command(type, values = {}) {
    if (!room) return
    perform(() => adapter.dispatch(room.id, actor, { type, requestId: crypto.randomUUID(), phaseEpoch: room.phaseEpoch,
      iglTerm: room.iglTerm, expectedRevision: room.revision, ...values }))
  }
  function switchPlayer(subject) {
    generation.current++; attached.current = false; setViewOpen(false); speech.mute(); setAudioEnabled(false); setBusy(false); setActorId(subject); setError('')
    try { const next = adapter.read(roomId, PLAYERS.find(player => player.subject === subject)); attached.current = true; setViewOpen(true); rememberView(subject, next.id); setRoom(next) }
    catch { setRoom(null) }
  }
  function closeView() {
    generation.current++; attached.current = false; setViewOpen(false); setBusy(false); setError('')
    rememberView(actor.subject, null); speech.mute(); setAudioEnabled(false); setRoom(null)
  }
  function join() {
    if (!/^[a-f0-9]{10}$/.test(roomId)) { setError('Enter the 10-character code created in this browser.'); return }
    perform(() => adapter.dispatch(roomId, actor, { type: 'join', requestId: crypto.randomUUID(), phaseEpoch: readInviteEpoch(roomId) }))
  }
  function readInviteEpoch(id) {
    // The synthetic adapter has no unauthenticated public snapshot endpoint.
    // Only demo state is read here. A production join endpoint binds the invite
    // and principal on the server and returns the current authorized snapshot.
    return JSON.parse(localStorage.getItem(`recon.squad.synthetic.v1.${id}`) || '{}').phaseEpoch
  }
  function readRole() {
    if (!room?.plan?.locked || !role) return
    speech.setContext(context)
    speech.read(`${role.name}. ${role.first} ${role.cue} ${role.fallback}`, context)
  }
  const playerControl = <label>Simulate player<select value={actorId} onChange={event => switchPlayer(event.target.value)}>{PLAYERS.map(player => <option key={player.subject} value={player.subject}>{player.alias}</option>)}</select></label>
  return <div className={room ? 'sq-app sq-active' : 'sq-app'}>
    <header className="sq-header"><a href={import.meta.env.BASE_URL === '/' ? '/squad-demo.html' : import.meta.env.BASE_URL} className="sq-brand">RECON<span>SQUAD WORKSPACE</span></a><span className="sq-local">Local prototype</span></header>
    <PreviewInstall />
    <main>
      <div className="sq-intro"><p className="sq-eyebrow">ONE PLAN. YOUR ROLE.</p><h1>Know your next action.</h1><p>Choose a plan together. Keep your assignment close.</p></div>
      <aside className="sq-notice" role="note">{room ? <><strong>Local demo.</strong> Same-browser simulation; instructions are unverified. No online squad connection.</> : <><strong>Synthetic demo on this browser.</strong> No real accounts, cloud synchronization, payments or CRM connection. The example drills and diagram are not verified Siege tactics. Open a second local tab to simulate another player; a room code will not work on another device.</>}</aside>
      {!online && <aside className="sq-offline" role="status"><strong>Offline — cached view only.</strong> Reconnect before confirming a squad change. This view can be out of date.</aside>}
      <section className="sq-card sq-session" aria-labelledby="session-title">
        <h2 id="session-title">Your demo player</h2>
        {room ? <details><summary>Player: {actor.alias} · simulation controls</summary>{playerControl}</details> : playerControl}
        {!room ? <div className="sq-connect"><button className="sq-primary" disabled={busy || !online} onClick={() => perform(() => adapter.create(actor))}>Create squad</button><label>Local room code<input value={roomId} maxLength={10} spellCheck="false" autoCapitalize="none" onChange={event => setRoomId(event.target.value.trim().toLowerCase())} /></label><button disabled={busy || !online} onClick={join}>Join squad</button></div> : <div className="sq-room-meta"><span>Room <strong>{room.id}</strong></span><span>{Object.keys(room.members).length}/5 players</span><span>IGL: <strong>{room.members[room.igl]?.alias}</strong></span><span>Revision {room.revision}</span><button onClick={closeView}>Close view</button></div>}
      </section>
      {error && <div className="sq-error" role="alert">{error}</div>}
      {busy && <p role="status">Applying your change…</p>}
      {room && <>
        <nav className="sq-phases" aria-label="Match phase">{PHASES.map(phase => <span key={phase} aria-current={room.phase === phase ? 'step' : undefined}>{phaseNames[phase]}</span>)}</nav>
        <div className="sq-grid">
          <div className="sq-stack">
            <section className="sq-card"><div className="sq-heading"><h2>{room.map || 'Choose the actual map'}</h2><span>Round {room.round} · {phaseNames[room.phase]}</span></div>
              {!room.map && <p>The map is manually confirmed. Camera scanning is outside this prototype.</p>}
              {igl && ['prequeue', 'map_offer'].includes(room.phase) && <div className="sq-actions">{['Bank', 'Coastline'].map(map => <button disabled={busy || !online} key={map} onClick={() => command('choose_map', { map })}>{map}</button>)}</div>}
              <label>Your reported operator<select value={room.members[actor.subject].operator} disabled={busy || !online} onChange={event => command('report_operator', { operator: event.target.value })}>{OPERATORS.map(operator => <option key={operator}>{operator}</option>)}</select></label>
              {room.phase === 'round_prep' && <><h3>Choose a coordination drill</h3><p>Votes help the IGL decide. They do not silently lock a plan.</p><div className="sq-plans">{DEMO_PLANS.map(plan => <article key={plan.id} className={room.plan?.id === plan.id ? 'sq-plan sq-selected' : 'sq-plan'}><h4>{plan.name}</h4><p>{plan.complexity} · {plan.minPlayers} player{plan.minPlayers > 1 ? 's' : ''} minimum · {Object.values(room.votes).filter(value => value === plan.id).length} votes</p><div className="sq-actions"><button disabled={busy || !online} onClick={() => command('vote', { planId: plan.id })}>Vote</button>{igl && <button disabled={busy || !online} onClick={() => command('select_plan', { planId: plan.id })}>Select plan</button>}</div></article>)}</div></>}
              {selected && <><h3>{selected.name} <span className="sq-chip">{room.plan.locked ? 'Locked' : 'Draft — review required'}</span></h3><p>Plan revision {room.planRevision}. Operator changes reopen review.</p>{selected.roles.map(item => <div className="sq-assignment" key={item.id}><div><strong>{item.name}</strong><small>{item.operators.join(' / ')}</small></div>{igl && room.phase === 'round_prep' ? <select aria-label={`Assign ${item.name}`} disabled={busy || !online} value={room.assignments[item.id] || ''} onChange={event => command('assign', { roleId: item.id, memberSubject: event.target.value })}><option value="" disabled>Choose player</option>{Object.values(room.members).filter(member => item.operators.includes(member.operator)).map(member => <option key={member.subject} value={member.subject}>{member.alias}</option>)}</select> : <span>{room.members[room.assignments[item.id]]?.alias || 'Unassigned'}</span>}</div>)}
                {igl && room.phase === 'round_prep' && <div className="sq-actions"><button className="sq-primary" disabled={busy || !online || room.plan.locked} onClick={() => command('lock')}>Lock plan</button><button disabled={busy || !online || !room.plan.locked} onClick={() => command('advance')}>Start action</button></div>}
              </>}
              {igl && room.phase === 'action' && <button className="sq-primary" disabled={busy || !online} onClick={() => command('advance')}>Finish round</button>}
              {room.phase === 'result' && <><p>Reported outcome: <strong>{room.result?.outcome || 'Not recorded'}</strong>. This is a player report.</p>{igl && <div className="sq-actions">{['win', 'loss', 'unknown'].map(result => <button disabled={busy || !online} key={result} onClick={() => command('record_result', { result })}>{result}</button>)}<button className="sq-primary" disabled={busy || !online} onClick={() => command('new_round')}>Next round</button></div>}</>}
            </section>
            <section className="sq-card"><h2>Squad readiness</h2>{Object.values(room.members).map(member => <div className="sq-member" key={member.subject}><div><strong>{member.alias}</strong><small>{member.operator} · {room.igl === member.subject ? 'IGL' : 'Player'} · {room.ready[member.subject] ? 'Ready for this plan' : 'Not acknowledged'}</small></div>{igl && member.subject !== room.igl && <button disabled={busy || !online} onClick={() => command('transfer', { memberSubject: member.subject })}>Make IGL</button>}</div>)}{igl && <button disabled={busy || !online || room.inviteRevoked} onClick={() => command('revoke_invite')}>{room.inviteRevoked ? 'Invite revoked' : 'Revoke invitation'}</button>}</section>
          </div>
          <RoleCard role={role} operator={room.members[actor.subject].operator} locked={room.plan?.locked} ready={Boolean(room.ready[actor.subject])} disabled={busy || !online} onReady={() => command("ready", { planRevision: room.planRevision, assignmentRevision: room.assignmentRevision })} audio={{ enabled: audioEnabled, status: audioStatus, enable: () => { speech.setContext(context); setAudioEnabled(speech.enable()) }, read: readRole, stop: () => speech.stop(), mute: () => { speech.mute(); setAudioEnabled(false) } }} />
        </div>
      </>}
      <footer>Prototype boundary: local synthetic storage only. Existing Recon subscriptions, Support and CRM records are unchanged. Production identity, entitlements, room service and content verification are pending.</footer>
    </main>
  </div>
}
