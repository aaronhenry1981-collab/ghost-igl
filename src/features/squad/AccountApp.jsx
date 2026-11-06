import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createExistingAccountClient } from './existing-account.mjs'
import { createRemoteSquadAdapter } from './remote-adapter.mjs'
import { createAccountViewCache } from './account-cache.mjs'
import { createRoomRealtime } from './realtime-client.mjs'
import { createRoleSpeech } from './speech.mjs'
import { OPERATORS, myRole, planFor } from './domain.mjs'
import RoleCard from './RoleCard.jsx'
import StackPlanner from './StackPlanner.jsx'
import MapPicker from './MapPicker.jsx'
import { stackPlanning, planningSizeFor } from './stack-planning.mjs'
import PreviewInstall from './PreviewInstall.jsx'
import '../../index.css'
import './squad.css'
const canInteract = () => navigator.onLine && !document.hidden

function ProfileForm({ profile, busy, save }) {
  const [platform, setPlatform] = useState(profile?.platform || 'unknown'), [season, setSeason] = useState(profile?.season || ''), [mode, setMode] = useState(profile?.mode || ''), [rank, setRank] = useState(profile?.rankLabel || 'Unknown'), [rp, setRp] = useState(profile?.rp ?? ''), [context, setContext] = useState('profile')
  return <form className="sq-profile" onSubmit={event => { event.preventDefault(); save({ requestId: crypto.randomUUID(), expectedVersion: profile?.version || 0, platform, season, mode, rankLabel: rank, rp: rp === '' ? null : Number(rp), context }) }}>
    <p>Your companion profile is private. Rank and points are your report, not an official game feed. Existing Recon records are not overwritten or imported.</p>
    <label>Platform<select value={platform} onChange={e => setPlatform(e.target.value)}>{['unknown', 'pc', 'playstation', 'xbox'].map(value => <option key={value}>{value}</option>)}</select></label>
    <label>Season<input maxLength={24} required value={season} onChange={e => setSeason(e.target.value)} placeholder="Season shown in your game" /></label>
    <label>Mode<input maxLength={30} required value={mode} onChange={e => setMode(e.target.value)} placeholder="Your current mode" /></label>
    <label>Current rank<input maxLength={30} required value={rank} onChange={e => setRank(e.target.value)} placeholder="Unknown or Unranked is fine" /></label>
    <label>Points, if your mode shows them (optional)<input type="number" min="0" max="1000000" value={rp} onChange={e => setRp(e.target.value)} /></label>
    <label>Observation<select value={context} onChange={e => setContext(e.target.value)}><option value="profile">Profile update</option><option value="before_session">Before this session</option><option value="after_session">After this session</option></select></label>
    <button disabled={busy}>Save my private observation</button>
  </form>
}
export default function AccountApp({ endpoints, authClient, onDemo }) {
  const auth = useMemo(() => authClient || createExistingAccountClient(), [authClient])
  const [planningSize, setPlanningSize] = useState(null)
  const [identity, setIdentity] = useState(null), [alias, setAlias] = useState(''), [code, setCode] = useState(''), [snapshot, setSnapshot] = useState(null), [grant, setGrant] = useState(null), [invite, setInvite] = useState(''), [profile, setProfile] = useState(null), [history, setHistory] = useState([])
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [connection, setConnection] = useState('Not connected'), [online, setOnline] = useState(navigator.onLine), [audioEnabled, setAudioEnabled] = useState(false), [audioStatus, setAudioStatus] = useState('Muted')
  const [fresh, setFresh] = useState(false)
  const [recoveryRequired, setRecoveryRequired] = useState(false)
  const [historyCursor, setHistoryCursor] = useState(null)
  const pendingMutation = useRef(null)
  const api = useRef(null), realtime = useRef(null), generation = useRef(0), attached = useRef(false)
  const speech = useMemo(() => createRoleSpeech({ onStatus: setAudioStatus }), [])
  const forgetAccount = useCallback(message => {
    pendingMutation.current = null; setRecoveryRequired(false)
    generation.current++; attached.current = false; realtime.current?.stop(); api.current?.disconnect(); auth.disconnect(); speech.mute()
    setPlanningSize(null); setIdentity(null); setSnapshot(null); setGrant(null); setProfile(null); setHistory([]); setHistoryCursor(null); setInvite(''); setAlias(''); setCode(''); setBusy(false); setAudioEnabled(false); setFresh(false); setError(message)
  }, [auth, speech])
  const suspend = useCallback(message => {
    generation.current++; attached.current = false; realtime.current?.stop(); api.current?.disconnect({ clearAccountCache: false }); speech.mute()
    setBusy(false); setFresh(false); setAudioEnabled(false); setRecoveryRequired(true); setConnection(message)
  }, [speech])
  const room = snapshot?.room, role = myRole(room, snapshot?.memberId), plan = planFor(room?.plan?.id), igl = room?.igl === snapshot?.memberId
  const ownerHosting = grant?.kind === 'owner' || snapshot?.hostingMode === 'owner'
  const planning = stackPlanning(room, planningSizeFor(room, planningSize))
  const audioContext = [identity?.subject, room?.id, room?.phaseEpoch, room?.iglTerm, room?.planRevision, room?.assignmentRevision, room?.plan?.locked, fresh].join(':')
  useEffect(() => { speech.setContext(audioContext); return () => speech.stop() }, [speech, audioContext])
  useEffect(() => {
    if (!snapshot?.expiresAt) return
    const mine = generation.current, timer = setTimeout(() => { if (generation.current !== mine) return; speech.mute(); setAudioEnabled(false); setFresh(false); realtime.current?.stop(); setConnection('This room has ended. Close this view to open a new room within your hosting limits. Saved observations follow their retention policy.') }, Math.max(0, snapshot.expiresAt - Date.now()))
    return () => clearTimeout(timer)
  }, [snapshot?.expiresAt, room?.id, speech, fresh])
  useEffect(() => {
    const invalidate = () => { generation.current++ }
    const changed = () => forgetAccount('The account session changed. Connect again.')
    const unsubscribe = auth.subscribe(changed)
    const network = () => { setOnline(navigator.onLine); if (!navigator.onLine) suspend('Offline - cached view only; recover or refresh before deciding') }
    const hide = () => { if (document.hidden) suspend('Paused while hidden - recover or refresh before deciding') }
    window.addEventListener('online', network); window.addEventListener('offline', network); document.addEventListener('visibilitychange', hide)
    return () => { invalidate(); unsubscribe(); window.removeEventListener('online', network); window.removeEventListener('offline', network); document.removeEventListener('visibilitychange', hide); realtime.current?.stop(); api.current?.disconnect(); auth.disconnect(); speech.mute() }
  }, [auth, speech, forgetAccount, suspend])
  function apply(value, mine) {
    if (generation.current !== mine || !canInteract() || !attached.current || !auth.currentSubject() || !value.room?.members?.[value.memberId] || value.expiresAt <= Date.now()) return
    setSnapshot(current => current?.room.id === value.room.id && current.revision > value.revision ? current : value)
    setFresh(!pendingMutation.current)
  }
  function watch(value, mine) {
    if (generation.current !== mine || !canInteract() || !attached.current || !auth.currentSubject() || pendingMutation.current) return
    realtime.current?.stop()
    realtime.current = createRoomRealtime({ api: api.current, endpoint: endpoints.socket, onState: next => apply(next, mine), onStatus: value => { if (generation.current === mine && canInteract() && attached.current) { setConnection(value); if (value !== 'Snapshot synchronized' || pendingMutation.current) setFresh(false) } } })
    realtime.current.start(value.room.id)
  }
  async function perform(task, { start = false, mutation = false, recover = false } = {}) {
    if (!canInteract()) { setError('Keep this view visible and online before confirming a change.'); return }
    if (mutation && recoveryRequired && !recover) { setError('Recover the interrupted change or refresh before another decision.'); return }
    if (mutation) pendingMutation.current = { task, options: { start, mutation: true } }
    if (start || mutation) { speech.stop(); setFresh(false) }
    const mine = generation.current; setBusy(true); setError('')
    try {
      const value = await task()
      if (generation.current !== mine) return
      if (!canInteract()) { suspend('Interrupted - recover or refresh before deciding'); return }
      if (!auth.currentSubject()) { forgetAccount('The account session changed. Connect again.'); return }
      if (value.ended) {
        closeView(); setGrant(null)
        await perform(() => api.current.grant(), { recover: true })
        return value
      }
      if (mutation) pendingMutation.current = null
      if (recover || value.room) setRecoveryRequired(Boolean(pendingMutation.current))
      if (value.room) { attached.current = true; apply(value, mine); if (value.invite) setInvite(`${value.room.id}.${value.invite}`); if (start || recover) watch(value, mine) }
      if (Object.hasOwn(value, 'profile')) setProfile(value.profile)
      if (Array.isArray(value.observations)) { setHistory(value.observations); setHistoryCursor(value.nextCursor || null) }
      if (typeof value.enabled === 'boolean') setGrant(value)
      return value
    } catch (problem) {
      if (generation.current !== mine) return
      if (problem.status === 401 || problem.name === 'StaleAccountError' || !auth.currentSubject()) { forgetAccount('Sign in to Recon again before using a private squad.'); return }
      if ([403, 410].includes(problem.status)) { closeView(); setGrant(null); api.current?.disconnect(); setError(problem.message); return }
      if (mutation && problem.status >= 400 && problem.status < 500) { pendingMutation.current = null; setRecoveryRequired(false) }
      else if (mutation) setRecoveryRequired(true)
      speech.stop(); setFresh(false); setError(problem.message)
    }
    finally { if (generation.current === mine) setBusy(false) }
  }
  async function connect() {
    if (!canInteract()) return
    const mine = ++generation.current; setBusy(true); setError('')
    try {
      const person = await auth.connect()
      if (generation.current !== mine) return
      if (!canInteract()) { suspend('Interrupted sign-in - connect again when visible and online'); return }
      api.current = createRemoteSquadAdapter({ baseUrl: endpoints.http, trustedOrigins: [new URL(endpoints.http).origin], getIdentity: auth.identity, getCurrentSubject: auth.currentSubject,
        viewCache: createAccountViewCache({ storage: localStorage }) })
      setIdentity(person)
      const values = await Promise.allSettled([api.current.grant(), api.current.profile()])
      if (generation.current !== mine || auth.currentSubject() !== person.subject) return
      if (!canInteract()) { suspend('Interrupted sign-in - refresh access when visible and online'); return }
      setGrant(values[0].status === 'fulfilled' ? values[0].value : null)
      if (values[0].status === 'rejected' && values[0].reason.status !== 403) setError('Hosting access could not be verified. Refresh before creating a squad.')
      if (values[1].status === 'fulfilled') setProfile(values[1].value.profile)
      setConnection(values[0].status === 'fulfilled' && values[0].value.kind === 'owner' ? 'Account connected; create or join a private squad' : 'Account connected; create or join an approved trial squad')
    } catch (problem) { if (generation.current === mine) { auth.disconnect(); setIdentity(null); setError(problem.message) } }
    finally { if (generation.current === mine) setBusy(false) }
  }
  function closeView() { generation.current++; pendingMutation.current = null; setRecoveryRequired(false); attached.current = false; realtime.current?.stop(); speech.mute(); setAudioEnabled(false); setFresh(false); setBusy(false); setSnapshot(null); setInvite(''); setError(''); setConnection('View closed') }
  function command(type, fields = {}) {
    speech.stop(); setFresh(false)
    const id = room.id, body = { type, requestId: crypto.randomUUID(), phaseEpoch: room.phaseEpoch, iglTerm: room.iglTerm, expectedRevision: room.revision, ...fields }
    return perform(() => api.current.command(id, body), { mutation: true })
  }
  function endSquad() { return command('close_room') }
  function refresh() { perform(() => api.current.snapshot(room.id), { start: true, recover: true }) }
  function createSquad() { const name = alias.trim(), requestId = crypto.randomUUID(); perform(() => api.current.create(name, requestId), { start: true, mutation: true }) }
  function replaceInvite() { const id = room.id, requestId = crypto.randomUUID(); perform(() => api.current.rotateInvite(id, requestId), { mutation: true }) }
  function recoverChange() { const saved = pendingMutation.current; if (saved) perform(saved.task, { ...saved.options, recover: true }) }
  const live = online && Boolean(snapshot && snapshot.expiresAt > Date.now()), disabled = busy || !live || !fresh || recoveryRequired
  return <div className={room ? 'sq-app sq-active' : 'sq-app'}><header className="sq-header"><a className="sq-brand" href="/squad-preview/">RECON<span>PRIVATE SQUAD</span></a><button onClick={() => { closeView(); onDemo() }}>Switch to demo</button></header><PreviewInstall mode="account" /><main>
    <aside className="sq-notice"><strong>{ownerHosting ? 'Private squad.' : 'Private preview.'}</strong> General coordination drills; map-specific tactics are not verified. No billing changes, microphone or automatic game observation.</aside>
    {error && <p className="sq-error" role="alert">{error}</p>}
    {identity && recoveryRequired && <section className="sq-notice" role="status"><p>This view was interrupted. Nothing resumes automatically. A change may already have reached the server.</p>{pendingMutation.current ? <button disabled={busy || !online} onClick={recoverChange}>Recover interrupted change</button> : <p>Use Refresh hosting access or Refresh / reconnect before deciding.</p>}<p>Recovery reuses the original request ID and receipt; it does not create a second change. Closing the view abandons this in-memory recovery.</p></section>}
    {!identity ? <section className="sq-card"><h1>Use your existing account.</h1><p>This uses the Recon account you already have. Hosting access is checked separately; signing in does not start a room or change your membership.</p><div className="sq-actions"><button disabled={busy || !online} onClick={connect}>Connect my Recon account</button><a className="sq-signin-link" href="/auth?redirect=%2Fsquad-preview%2F">Sign in to Recon</a></div><p>Return here after sign-in. A hosting grant is separate from your membership.</p></section> : <>
      <section className="sq-card sq-session"><p>Existing account connected. {grant?.enabled ? ownerHosting ? `Owner hosting: up to ${grant.maxMembers} participants. ${grant.sessionsToday}/${grant.maxSessionsPerDay} rooms today; ${grant.sessionsUsed}/${grant.maxSessions} this UTC month. One active room; each room has a four-hour privacy lease and up to 500 changes. ${grant.retainedRooms}/${grant.maxRetainedRooms} retained-room capacity slots used. Capacity reservations never delete history or reset monthly.` : `Hosting test: up to ${grant.maxMembers} participant(s).` : 'Hosting is not active; you may join an approved invitation.'}</p><p role="status">{connection}</p>
        {!room ? <><label>Your squad alias<input maxLength={30} value={alias} onChange={e => setAlias(e.target.value)} placeholder="An alias your squad recognizes" /></label><div className="sq-actions"><button disabled={busy || !online || !grant?.enabled || !alias.trim() || Boolean(grant?.activeRoomId) || grant?.sessionsUsed >= grant?.maxSessions || (ownerHosting && (grant?.sessionsToday >= grant?.maxSessionsPerDay || grant?.retainedRooms >= grant?.maxRetainedRooms)) || recoveryRequired} onClick={createSquad}>Create private squad</button><button disabled={busy || !online} onClick={() => perform(() => api.current.grant(), { recover: true })}>Refresh hosting access</button>{grant?.activeRoomId && <button disabled={busy || !online} onClick={() => perform(() => api.current.snapshot(grant.activeRoomId), { start: true, recover: true })}>Open my active squad</button>}</div><label>Invitation code<input value={code} onChange={e => setCode(e.target.value.trim())} autoCapitalize="none" spellCheck="false" /></label><button disabled={busy || !online || !alias.trim() || recoveryRequired} onClick={() => { const [roomId, token, extra] = code.split('.'); if (!roomId || !token || extra) { setError('Paste the room and invitation code shared by the IGL.'); return }; const body = { roomId, invite: token, alias: alias.trim(), requestId: crypto.randomUUID() }; perform(() => api.current.join(body), { start: true, mutation: true }) }}>Join private squad</button></> : <>
          <div className="sq-room-meta"><strong>{room.map || 'Map not chosen'} · Round {room.round}</strong><span>{Object.keys(room.members).length} participant(s)</span><span>IGL: {room.members[room.igl]?.alias}</span><button disabled={busy || !online} onClick={refresh}>Refresh / reconnect</button><button onClick={closeView}>Close view</button></div>
          {invite && <details><summary>Your invitation — permitted signed-in teammates only</summary><label>Copy this code to your approved teammate<input readOnly value={invite} onFocus={e => e.target.select()} /></label><p>The invitation stays in this view only. It is not sent automatically or saved in the offline cache. Owner-room invitations last fifteen minutes; only people you share a valid invitation with can join, up to five members. Replacing or revoking the invitation stops new joins.</p></details>}
          {(igl || room.owner === snapshot.memberId) && <button disabled={disabled} onClick={replaceInvite}>Create replacement invitation</button>}
          {ownerHosting && room.owner === snapshot.memberId && <div className="sq-notice"><p>End room closes access for everyone and allows another room within your daily/monthly limits. Records are preserved. Close view only detaches this device.</p><button disabled={busy || !online || !fresh || recoveryRequired} onClick={endSquad}>End room for everyone</button></div>}
        </>}
      </section>
      <StackPlanner planning={planning} onChange={setPlanningSize} hostingLimit={grant?.maxMembers} />
      {room && <>{!live && <p className="sq-offline" role="status">Cached or expired view - reconnect and verify access before deciding. No changes can be confirmed here.</p>}
        <div className="sq-grid"><div className="sq-stack"><section className="sq-card"><h2>Shared preparation</h2>
          {igl && !room.map && <MapPicker disabled={disabled} onConfirm={map => command('choose_map', { map })} />}
          {room.map && <p className="sq-no-playbook" role="status">{room.map} selected for coordination only. No verified map/site playbook is attached in this preview.</p>}
              <label>Your reported operator<select value={room.members[snapshot.memberId].operator} disabled={disabled} onChange={e => command('report_operator', { operator: e.target.value })}>{OPERATORS.map(operator => <option key={operator}>{operator}</option>)}</select></label>
          {room.phase === 'round_prep' && [planning.drill].map(item => <article className="sq-plan" key={item.id}><h3>{item.name}</h3><p>Generic exercise · {item.minPlayers} coordinated player minimum · {Object.values(room.votes).filter(value => value === item.id).length} votes</p><div className="sq-actions"><button disabled={disabled} onClick={() => command('vote', { planId: item.id })}>Vote</button>{igl && <button disabled={disabled} onClick={() => command('select_plan', { planId: item.id })}>Select plan</button>}</div></article>)}
          {plan?.roles.map(item => <div className="sq-assignment" key={item.id}><strong>{item.name}</strong>{igl && room.phase === 'round_prep' ? <select aria-label={`Assign ${item.name}`} disabled={disabled} value={room.assignments[item.id] || ''} onChange={e => command('assign', { roleId: item.id, memberSubject: e.target.value })}><option value="" disabled>Choose player</option>{Object.values(room.members).filter(member => item.operators.includes(member.operator)).map(member => <option value={member.subject} key={member.subject}>{member.alias}</option>)}</select> : <span>{room.members[room.assignments[item.id]]?.alias || 'Unassigned'}</span>}</div>)}
          {igl && <div className="sq-actions">{room.phase === 'round_prep' && <><button disabled={disabled || !room.plan || room.plan.locked} onClick={() => command('lock')}>Lock plan</button><button disabled={disabled || !room.plan?.locked} onClick={() => command('advance')}>Start action</button></>}{room.phase === 'action' && <button disabled={disabled} onClick={() => command('advance')}>Finish round</button>}{room.phase === 'result' && <><button disabled={disabled} onClick={() => command('record_result', { result: 'unknown' })}>Record unknown result</button><button disabled={disabled} onClick={() => command('new_round')}>Next round</button></>}</div>}
        </section><section className="sq-card"><h2>Squad</h2>{Object.values(room.members).map(member => <div className="sq-member" key={member.subject}><div><strong>{member.alias}</strong><small>{member.operator} · {room.ready[member.subject] ? 'Ready for this plan' : 'Not acknowledged'}</small></div>{igl && member.subject !== room.igl && <div className="sq-actions"><button disabled={disabled} onClick={() => command('transfer', { memberSubject: member.subject })}>Make IGL</button><button disabled={disabled} onClick={() => command('remove', { memberSubject: member.subject })}>Remove player</button></div>}</div>)}{igl && <button disabled={disabled || room.inviteRevoked} onClick={() => command('revoke_invite')}>Revoke invitation</button>}</section>
          <section className="sq-card"><details><summary>My private rank observations</summary><ProfileForm key={profile?.version || 0} profile={profile} busy={disabled} save={fields => perform(() => api.current.updateProfile(room.id, fields), { mutation: true })} /><div className="sq-actions"><button disabled={busy || !online} onClick={() => perform(() => api.current.profile())}>Refresh my profile</button><button disabled={busy || !online} onClick={() => perform(() => api.current.history())}>Load my recent history</button>{historyCursor && <button disabled={busy || !online} onClick={() => perform(() => api.current.history(historyCursor))}>Load older observations</button>}</div><ul>{history.map(row => <li key={row.version}>{row.season} · {row.mode} · {row.rankLabel} · {row.context} · user reported</li>)}</ul></details></section>
        </div><RoleCard verified={fresh} role={role} operator={room.members[snapshot.memberId].operator} locked={Boolean(room.plan?.locked && snapshot.expiresAt > Date.now())} ready={Boolean(room.ready[snapshot.memberId])} disabled={disabled} onReady={() => command('ready', { planRevision: room.planRevision, assignmentRevision: room.assignmentRevision })} audio={{ enabled: audioEnabled, status: audioStatus, enable: () => { speech.setContext(audioContext); setAudioEnabled(speech.enable()) }, read: () => { if (role) { speech.setContext(audioContext); speech.read(`${role.name}. ${role.first} ${role.cue} ${role.fallback}`, audioContext) } }, stop: () => speech.stop(), mute: () => { speech.mute(); setAudioEnabled(false) } }} /></div>
      </>}
      {!room && <section className="sq-card"><h2>My saved private observations</h2><p>Read your companion records without starting a session. This does not import or change existing Recon history.</p><button disabled={busy || !online} onClick={() => perform(() => api.current.history())}>Load my recent history</button>{historyCursor && <button disabled={busy || !online} onClick={() => perform(() => api.current.history(historyCursor))}>Load older observations</button>}<ul>{history.map(row => <li key={row.version}>{row.season} - {row.mode} - {row.rankLabel} - user reported</li>)}</ul></section>}
    </>}<footer>{ownerHosting ? 'Host access does not expire as a pilot. Records and historical observations are retained; room and ticket expiry only end access. No automatic deletion is enabled. When retained-room capacity is full, new room creation stops and an operator must review a capacity increase; existing records remain available. Existing paid memberships are unchanged.' : 'Private preview access and existing paid memberships are separate.'} This app does not include verified map-specific instructions, video analysis, paid AI or live voice observation.</footer>
  </main></div>
}
