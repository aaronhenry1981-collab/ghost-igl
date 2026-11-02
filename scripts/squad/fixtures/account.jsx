// LOCAL RENDER FIXTURE ONLY. Excluded from both public build inputs.
import { createRoot } from 'react-dom/client'
import AccountApp from '../../../src/features/squad/AccountApp.jsx'
import { createRoom, applyCommand } from '../../../src/features/squad/domain.mjs'
let subject = 'synthetic-owner-001', listener, room, profile
const memberId = 'synthetic-member-001', id = 'synthetic-room-001'
const receipts = new Map()
const snapshot = () => ({ room: structuredClone(room), memberId, revision: room.revision, expiresAt: Date.now() + 60_000 })
window.__fixture = { calls: [], hold: false, holdPath: null, unauthorized: false, socketStarts: 0, commits: { create: 0, join: 0, commands: 0 }, changeAccount() { subject = null; listener?.() }, release: null,
  seedJoin() { const owner = { subject: 'synthetic-existing-igl', alias: 'Existing IGL' }; room = createRoom({ id, actor: owner, now: Date.now(), inviteExpiresAt: Date.now() + 60_000 }); room = applyCommand(room, { type: 'choose_map', map: 'Bank', requestId: 'seed-map-001', phaseEpoch: room.phaseEpoch, iglTerm: room.iglTerm, expectedRevision: room.revision }, owner, Date.now()) } }
const auth = { connect: async () => ({ subject: subject ||= 'synthetic-owner-001' }), identity: async () => ({ subject, token: 'synthetic-never-sent-token' }), currentSubject: () => subject, subscribe: fn => { listener = fn; return () => { listener = null } }, disconnect: () => {} }
window.fetch = async (url, options) => {
  const path = new URL(url).pathname.replace('/prod', ''), body = options.body ? JSON.parse(options.body) : null
  window.__fixture.calls.push({ path, method: options.method, requestId: body?.requestId })
  if (window.__fixture.unauthorized) { window.__fixture.unauthorized = false; return { ok: false, status: 401, json: async () => ({ error: 'Fixture session expired' }) } }
  if ((window.__fixture.hold && path.endsWith('/commands')) || window.__fixture.holdPath === path) { window.__fixture.hold = false; window.__fixture.holdPath = null; await new Promise(resolve => { window.__fixture.release = resolve }) }
  const receiptKey = body?.requestId && `${path}:${body.requestId}`
  if (receiptKey && receipts.has(receiptKey)) return { ok: true, json: async () => ({ ...snapshot(), recovered: true }) }
  let value
  if (path.endsWith('/me/grant')) value = { enabled: true, maxMembers: 1, maxSessions: 3, sessionsUsed: room ? 1 : 0, activeRoomId: room ? id : null }
  else if (path.endsWith('/me/profile')) value = { subject, profile: profile || null }
  else if (path.endsWith('/me/history')) value = { observations: profile ? [profile] : [] }
  else if (path === '/squads') { window.__fixture.commits.create++; room = createRoom({ id, actor: { subject: memberId, alias: body.alias }, now: Date.now(), inviteExpiresAt: Date.now() + 60_000 }); value = { ...snapshot(), invite: 'fixture-invite' } }
  else if (path === '/squads/join') { window.__fixture.commits.join++; room = applyCommand(room, { type: 'join', requestId: body.requestId, phaseEpoch: room.phaseEpoch }, { subject: memberId, alias: body.alias }, Date.now()); value = snapshot() }
  else if (path.endsWith('/commands')) { window.__fixture.commits.commands++; room = applyCommand(room, body, room.members[memberId], Date.now()); value = snapshot() }
  else if (path.endsWith('/socket-ticket')) value = { ...snapshot(), ticket: 'fixture-one-use', ticketExpiresAt: Date.now() + 30_000 }
  else if (path.endsWith('/profile')) { profile = { ...body, version: 1, source: 'user_reported' }; value = { ...snapshot(), profile } }
  else value = snapshot()
  if (receiptKey) receipts.set(receiptKey, true)
  return { ok: true, json: async () => structuredClone(value) }
}
window.WebSocket = class {
  readyState = 1
  constructor() { window.__fixture.socketStarts++; setTimeout(() => this.onopen?.(), 0) }
  send(message) { if (JSON.parse(message).type === 'sync') setTimeout(() => this.onmessage?.({ data: JSON.stringify({ type: 'snapshot', ...snapshot() }) }), 0) }
  close() { this.readyState = 3 }
}
Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => [], cancel: () => {}, speak: () => {} } })
createRoot(document.getElementById('root')).render(<AccountApp endpoints={{ http: 'https://abcdefghij.execute-api.us-east-1.amazonaws.com/prod', socket: 'wss://klmnopqrst.execute-api.us-east-1.amazonaws.com/prod' }} authClient={auth} onDemo={() => {}} />)
