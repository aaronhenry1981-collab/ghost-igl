import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { hostingPolicy, audienceAllows, sessionEndsAt, usageForDisplay } from './hosting-policy.mjs'

export class ApiError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code }
}
const fail = (status, code, message) => { throw new ApiError(status, code, message) }
const digest = value => createHash('sha256').update(value).digest('hex')
const fingerprintOf = value => digest(JSON.stringify(Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]]))))
export const memberIdFor = (roomId, subject) => digest(`${roomId}:${subject}`).slice(0, 32)
const equal = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))
const cleanText = (value, max = 30) => typeof value === 'string' && value.trim() && value.length <= max && !/[\u0000-\u001f<>]/.test(value)
const ID = /^[a-zA-Z0-9_-]{8,100}$/
const COMMAND_FIELDS = {
  report_operator: ['operator'], vote: ['planId'], choose_map: ['map'], select_plan: ['planId'], assign: ['roleId', 'memberSubject'],
  lock: [], ready: ['planRevision', 'assignmentRevision'], advance: [], new_round: ['side'], transfer: ['memberSubject'],
  remove: ['memberSubject'], revoke_invite: [], record_result: ['result'],
  close_room: [],
}
function validateCommand(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'BODY', 'A command object is required.')
  if (typeof body.type !== 'string' || !Object.hasOwn(COMMAND_FIELDS, body.type)) fail(400, 'COMMAND', 'This room command is not supported.')
  const extra = COMMAND_FIELDS[body.type]
  const allowed = new Set(['type', 'requestId', 'phaseEpoch', 'iglTerm', 'expectedRevision', ...extra])
  if (Object.keys(body).some(key => !allowed.has(key))) fail(400, 'FIELD', 'The command includes unsupported fields.')
  if (!ID.test(body.requestId || '')) fail(400, 'REQUEST', 'A valid request ID is required.')
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string' && value.length > 100) fail(400, 'SIZE', 'A command field is too long.')
    if (key !== 'type' && typeof value !== 'string' && (!Number.isSafeInteger(value) || value < 0)) fail(400, 'FIELD', 'Command values must be bounded text or integers.')
  }
  if (Buffer.byteLength(JSON.stringify(body)) > 2048) fail(413, 'SIZE', 'The command is too large.')
  return structuredClone(body)
}
function stateForClient(envelope) {
  const state = structuredClone(envelope.state)
  delete state.receipts; delete state.excluded
  return { room: state, expiresAt: envelope.expiresAt, revision: envelope.version, ...(envelope.hostingKind === 'owner' ? { hostingMode: 'owner' } : {}) }
}

// repo operations are atomic contracts, not calls to an existing production DB.
// authenticate must return a signature-verified principal from the transport.
export function createSquadService({ repo, authenticate, domain, now = Date.now,
  random = () => randomBytes(24).toString('base64url'), maxRetries = 5 }) {
  if (!repo || !authenticate || !domain?.applyCommand) throw new Error('Repository, verified authentication and domain are required')
  async function principal(request) {
    const value = await authenticate(request)
    if (!value || typeof value.subject !== 'string' || !ID.test(value.subject)) fail(401, 'SIGN_IN', 'Sign in to Recon again.')
    if (value.tokenExpiresAt !== undefined && (!Number.isFinite(value.tokenExpiresAt) || value.tokenExpiresAt <= now())) fail(401, 'SIGN_IN', 'Sign in to Recon again.')
    return { subject: value.subject, tokenExpiresAt: value.tokenExpiresAt }
  }
  async function grantFor(subject) {
    const grant = hostingPolicy(await repo.getGrant(subject), subject, now())
    if (grant.error === 403) fail(403, 'GRANT', 'Squad hosting access is not active.')
    if (grant.error) fail(503, 'GRANT_CONFIG', 'The hosting allowance is not valid.')
    return grant
  }
  async function activeRoom(id) {
    if (!ID.test(id || '')) fail(404, 'ROOM', 'Room not found.')
    const room = await repo.getRoom(id)
    if (!room) fail(404, 'ROOM', 'Room not found.')
    if (room.expiresAt <= now()) fail(410, 'EXPIRED', 'This squad session has ended.')
    const grant = await grantFor(room.hostSubject)
    if (grant.id !== room.grantId) fail(403, 'GRANT', 'This room no longer has an active hosting allowance.')
    if (grant.kind === 'owner' && room.hostingKind !== 'owner') fail(503, 'ROOM_CONFIG', 'The owner room configuration is not valid.')
    return { room, grant }
  }
  function member(room, owner) {
    const id = memberIdFor(room.id, owner.subject)
    if (!room.state.members[id] || room.state.excluded.includes(id)) fail(404, 'ROOM', 'Room not found.')
    return { subject: id, alias: room.state.members[id].alias }
  }
  async function saveMutation({ id, actor, body, kind, mutate }) {
    const fingerprint = fingerprintOf(body)
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { room, grant } = await activeRoom(id)
      if (!audienceAllows(grant, actor.subject)) fail(403, 'AUDIENCE', 'This account is outside the approved audience.')
      const who = kind === 'join' ? { subject: memberIdFor(id, actor.subject), alias: body.alias } : member(room, actor)
      // Authorization precedes receipt lookup, so removal cannot be bypassed by retry.
      if (room.state.excluded.includes(who.subject)) fail(403, 'REMOVED', 'This player was removed from the room.')
      const receipt = await repo.getReceipt(id, who.subject, body.requestId)
      if (receipt) {
        if (receipt.fingerprint !== fingerprint || receipt.kind !== kind) fail(409, 'REPLAY', 'This request ID was already used for a different operation.')
        if (!room.state.members[who.subject]) fail(403, 'REMOVED', 'This player is no longer in the room.')
        return { ...stateForClient(room), memberId: who.subject, recovered: true }
      }
      if (room.commandCount >= grant.maxCommands && body.type !== 'close_room') fail(429, 'ALLOWANCE', 'This session has reached its command allowance.')
      const next = structuredClone(room)
      if (grant.kind === 'owner' && body.type !== 'close_room') {
        if (room.ownerRate && (!Number.isSafeInteger(room.ownerRate.second) || !Number.isSafeInteger(room.ownerRate.count) || room.ownerRate.count < 0 || room.ownerRate.count > grant.changesPerSecond)) fail(503, 'ROOM_CONFIG', 'The owner room rate state is not valid.')
        const second = Math.floor(now() / 1000), count = room.ownerRate?.second === second ? room.ownerRate.count : 0
        if (count >= grant.changesPerSecond) fail(429, 'RATE', 'Too many squad changes at once. Wait a moment, then refresh.')
        next.ownerRate = { second, count: count + 1 }
      }
      const change = await mutate(next, who, grant) || {}
      // Domain receipt storage is for the local adapter. Persist a compact,
      // separate receipt atomically here, never an ever-growing room array.
      next.state.receipts = []
      next.version = room.version + 1; next.commandCount = room.commandCount + 1
      if (Buffer.byteLength(JSON.stringify(next.state)) > 24_000) fail(413, 'STATE_SIZE', 'The room state reached its safe size limit.')
      const accepted = await repo.commitRoom({ expectedVersion: room.version, next, grant, ticket: change.ticket, privateProfile: change.privateProfile, releaseActiveRoom: Boolean(change.releaseActiveRoom),
        receipt: { roomId: id, actor: who.subject, requestId: body.requestId, fingerprint, kind, acceptedAt: now(), version: next.version } })
      if (accepted) return { ...stateForClient(next), memberId: who.subject, ...change.publicResult }
    }
    fail(409, 'CONFLICT', 'The squad changed at the same time. Refresh before retrying.')
  }
  return {
    async grant(request) {
      const actor = await principal(request), value = await grantFor(actor.subject)
      const usage = await repo.getUsage(value.id, value.kind === 'owner' ? value.ownerSubject : undefined)
      const current = usageForDisplay(value, usage, now())
      return { enabled: true, ...(value.kind === 'owner' ? { kind: 'owner', maxSessionsPerDay: value.maxSessionsPerDay, sessionsToday: current.sessionsToday } : {}), maxMembers: value.maxMembers, maxSessions: value.maxSessions, maxCommands: value.maxCommands, sessionMs: value.sessionMs, validUntil: value.validUntil ?? null, sessionsUsed: current.sessions, activeRoomId: current.activeRoomId, ...(value.kind === 'owner' ? { retainedRooms: current.retainedRooms, reservedBytes: current.reservedBytes, maxRetainedRooms: value.maxRetainedRooms, roomReservationBytes: value.roomReservationBytes, maxReservedBytes: value.maxRetainedRooms * value.roomReservationBytes } : {}) }
    },
    async create(request, body) {
      const actor = await principal(request)
      if (!body || !ID.test(body.requestId || '') || !cleanText(body.alias) || Object.keys(body).some(key => !['requestId', 'alias'].includes(key))) fail(400, 'BODY', 'Provide an alias and request ID.')
      const grant = await grantFor(actor.subject)
      const previous = await repo.getCreateReceipt(actor.subject, body.requestId)
      const fingerprint = fingerprintOf(body)
      if (previous) {
        if (previous.fingerprint !== fingerprint) fail(409, 'REPLAY', 'This request ID was already used.')
        const { room } = await activeRoom(previous.roomId)
        if (room.hostSubject !== actor.subject) fail(403, 'OWNER', 'Room ownership mismatch.')
        return { ...stateForClient(room), memberId: memberIdFor(room.id, actor.subject), recovered: true, invite: null }
      }
      const id = random(), invite = random(), timestamp = now(), who = { subject: memberIdFor(id, actor.subject), alias: body.alias.trim() }
      const endsAt = sessionEndsAt(grant, timestamp)
      const envelope = { id, version: 0, hostSubject: actor.subject, grantId: grant.id, createdAt: timestamp,
        expiresAt: endsAt, commandCount: 0, ticketCount: 0, inviteHash: digest(invite),
        ...(grant.kind === 'owner' ? { hostingKind: 'owner' } : {}),
        state: domain.createRoom({ id, actor: who, now: timestamp, inviteExpiresAt: grant.kind === 'owner' ? Math.min(endsAt, timestamp + 15 * 60_000) : endsAt }) }
      const accepted = await repo.createSession({ envelope, grant, createReceipt: { ownerSubject: actor.subject, requestId: body.requestId, fingerprint, roomId: id } })
      if (!accepted) fail(409, 'SESSION', 'A room is active or a room/capacity limit was reached. Refresh hosting access. Saved records are preserved; storage capacity requires an operator-reviewed increase.')
      return { ...stateForClient(envelope), memberId: who.subject, invite }
    },
    async snapshot(request, id) {
      const actor = await principal(request), { room, grant } = await activeRoom(id), who = member(room, actor)
      if (!audienceAllows(grant, actor.subject)) fail(403, 'AUDIENCE', 'This account is outside the approved audience.')
      return { ...stateForClient(room), memberId: who.subject }
    },
    async join(request, body) {
      const actor = await principal(request)
      if (!body || !ID.test(body.roomId || '') || !ID.test(body.requestId || '') || !cleanText(body.alias) || typeof body.invite !== 'string' || body.invite.length > 128 || Object.keys(body).some(key => !['roomId', 'requestId', 'alias', 'invite'].includes(key))) fail(400, 'BODY', 'Provide the invitation, alias and request ID.')
      return saveMutation({ id: body.roomId, actor, body, kind: 'join', mutate(next, who, grant) {
        if (next.state.inviteRevoked || !equal(next.inviteHash, digest(body.invite)) || now() >= next.state.inviteExpiresAt) fail(403, 'INVITE', 'This invitation is unavailable.')
        if (!next.state.members[who.subject] && Object.keys(next.state.members).length >= grant.maxMembers) fail(409, 'FULL', 'This squad has no available seat.')
        next.state = domain.applyCommand(next.state, { type: 'join', requestId: body.requestId, phaseEpoch: next.state.phaseEpoch }, who, now())
      } })
    },
    async command(request, id, raw) {
      const actor = await principal(request), body = validateCommand(raw)
      if (body.type === 'close_room') {
        const stored = ID.test(id || '') && await repo.getRoom(id)
        if (stored?.hostSubject === actor.subject && stored.expiresAt <= now()) {
          const grant = await grantFor(actor.subject), receipt = await repo.getReceipt(id, memberIdFor(id, actor.subject), body.requestId)
          if (grant.kind === 'owner' && receipt?.kind === 'command' && receipt.fingerprint === fingerprintOf(body)) return { ended: true, roomId: id, recovered: true }
          fail(410, 'EXPIRED', 'This squad session has ended.')
        }
      }
      return saveMutation({ id, actor, body, kind: 'command', mutate(next, who, grant) {
        if (body.type === 'close_room') {
          if (grant.kind !== 'owner' || actor.subject !== next.hostSubject) fail(403, 'OWNER', 'Only this room host can end an owner room.')
          if (body.expectedRevision !== next.state.revision) fail(409, 'STALE', 'Refresh the latest room before ending it.')
          next.expiresAt = now()
          return { releaseActiveRoom: true, publicResult: { ended: true, roomId: id } }
        }
        next.state = domain.applyCommand(next.state, body, who, now())
      } })
    },
    async socketTicket(request, id, body) {
      const actor = await principal(request)
      if (!body || !ID.test(body.requestId || '') || Object.keys(body).some(key => key !== 'requestId')) fail(400, 'BODY', 'A ticket request ID is required.')
      return saveMutation({ id, actor, body, kind: 'socket_ticket', mutate(next, who, grant) {
        if ((next.ticketCount || 0) >= (grant.maxTickets || 20)) fail(429, 'TICKETS', 'This session reached its reconnect allowance.')
        const token = random(), authorizationExpiresAt = Math.min(next.expiresAt, actor.tokenExpiresAt || next.expiresAt), expiresAt = Math.min(now() + 30_000, authorizationExpiresAt)
        next.ticketCount = (next.ticketCount || 0) + 1
        return { ticket: { hash: digest(token), roomId: id, subject: actor.subject, memberId: who.subject, expiresAt, authorizationExpiresAt }, publicResult: { ticket: token, ticketExpiresAt: expiresAt } }
      } })
    },
    async rotateInvite(request, id, body) {
      const actor = await principal(request)
      if (!body || !ID.test(body.requestId || '') || Object.keys(body).some(key => key !== 'requestId')) fail(400, 'BODY', 'An invitation request ID is required.')
      return saveMutation({ id, actor, body, kind: 'rotate_invite', mutate(next, who) {
        if (![next.state.owner, next.state.igl].includes(who.subject)) fail(403, 'IGL_ONLY', 'Only the host or current IGL can replace the invitation.')
        const invite = random(); next.inviteHash = digest(invite); next.state.inviteRevoked = false; next.state.inviteExpiresAt = Math.min(now() + 15 * 60_000, next.expiresAt)
        return { publicResult: { invite } }
      } })
    },
    async connectionSnapshot(connectionId) {
      const connection = await repo.getConnection(connectionId)
      if (!connection || connection.status !== 'active' || connection.authorizationExpiresAt <= now()) fail(403, 'CONNECTION', 'This connection is no longer active.')
      const { room, grant } = await activeRoom(connection.roomId)
      if (!audienceAllows(grant, connection.subject)) fail(403, 'AUDIENCE', 'This account is outside the approved audience.')
      const who = member(room, { subject: connection.subject })
      if (who.subject !== connection.memberId) fail(403, 'CONNECTION', 'Connection ownership mismatch.')
      return { ...stateForClient(room), memberId: who.subject }
    },
    async profile(request) {
      const actor = await principal(request), profile = await repo.getProfile(actor.subject)
      if (profile && profile.ownerSubject !== actor.subject) fail(403, 'OWNER', 'Profile ownership mismatch.')
      return { subject: actor.subject, profile }
    },
    async history(request) {
      const actor = await principal(request), query = request.queryStringParameters || {}
      if (Object.keys(query).some(key => key !== 'cursor')) fail(400, 'HISTORY_CURSOR', 'Reload recent history for this account.')
      const { observations, nextCursor } = await repo.getProfileHistory(actor.subject, query.cursor)
      if (observations.some(row => row.ownerSubject !== actor.subject)) fail(403, 'OWNER', 'History ownership mismatch.')
      return { observations, nextCursor, limit: 25, source: 'user_reported' }
    },
    async updateProfile(request, id, body) {
      const actor = await principal(request)
      const allowed = ['requestId', 'expectedVersion', 'platform', 'season', 'mode', 'rankLabel', 'rp', 'context']
      if (!body || Object.keys(body).some(key => !allowed.includes(key)) || !ID.test(body.requestId || '') || !Number.isSafeInteger(body.expectedVersion) || body.expectedVersion < 0 || !['pc', 'playstation', 'xbox', 'unknown'].includes(body.platform) || !cleanText(body.season, 24) || !cleanText(body.mode, 30) || !cleanText(body.rankLabel, 30) || !['profile', 'before_session', 'after_session'].includes(body.context) || (body.rp !== null && (!Number.isSafeInteger(body.rp) || body.rp < 0 || body.rp > 1_000_000))) fail(400, 'PROFILE', 'Provide a platform, season, mode and self-reported rank. Points are optional.')
      const result = await saveMutation({ id, actor, body, kind: 'private_profile', async mutate(next) {
        const previous = await repo.getProfile(actor.subject)
        if ((previous?.version || 0) !== body.expectedVersion) fail(409, 'PROFILE_CHANGED', 'Your profile changed on another device. Refresh it before saving.')
        if (previous && previous.ownerSubject !== actor.subject) fail(403, 'OWNER', 'Profile ownership mismatch.')
        const profile = { ownerSubject: actor.subject, version: body.expectedVersion + 1, platform: body.platform,
          season: body.season.trim(), mode: body.mode.trim(), rankLabel: body.rankLabel.trim(), rp: body.rp,
          context: body.context, roomId: id, round: next.state.round, recordedAt: now(), source: 'user_reported', verified: false }
        return { privateProfile: { previousVersion: body.expectedVersion, profile, requestId: body.requestId }, publicResult: { profile } }
      } })
      // A replay never creates another observation; recover its current owned
      // profile even if the original HTTP response was lost.
      return result.profile ? result : { ...result, profile: await repo.getProfile(actor.subject) }
    },
  }
}

export function createHttpHandler(service, { afterCommit } = {}) {
  return async event => {
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    try {
      const method = event.requestContext?.http?.method, rawPath = event.rawPath || ''
      const path = event.requestContext?.stage === 'prod' && rawPath.startsWith('/prod/') ? rawPath.slice(5) : rawPath
      if (event.isBase64Encoded) fail(400, 'BODY', 'Encoded request bodies are not supported.')
      if (Buffer.byteLength(event.body || '') > 4096) fail(413, 'SIZE', 'The request is too large.')
      let body
      if (['POST', 'PUT'].includes(method)) { try { body = JSON.parse(event.body || '{}') } catch { fail(400, 'JSON', 'The request JSON is invalid.') } }
      let result, statusCode = 200
      if (method === 'GET' && path === '/squads/me/grant') result = await service.grant(event)
      else if (method === 'GET' && path === '/squads/me/profile') result = await service.profile(event)
      else if (method === 'GET' && path === '/squads/me/history') result = await service.history(event)
      else if (method === 'POST' && path === '/squads') { result = await service.create(event, body); statusCode = 201 }
      else if (method === 'POST' && path === '/squads/join') result = await service.join(event, body)
      else if (method === 'GET' && /^\/squads\/[a-zA-Z0-9_-]{8,100}$/.test(path)) result = await service.snapshot(event, path.split('/').at(-1))
      else if (method === 'POST' && /^\/squads\/[a-zA-Z0-9_-]{8,100}\/commands$/.test(path)) result = await service.command(event, path.split('/')[2], body)
      else if (method === 'POST' && /^\/squads\/[a-zA-Z0-9_-]{8,100}\/socket-ticket$/.test(path)) result = await service.socketTicket(event, path.split('/')[2], body)
      else if (method === 'POST' && /^\/squads\/[a-zA-Z0-9_-]{8,100}\/invite$/.test(path)) result = await service.rotateInvite(event, path.split('/')[2], body)
      else if (method === 'PUT' && /^\/squads\/[a-zA-Z0-9_-]{8,100}\/profile$/.test(path)) result = await service.updateProfile(event, path.split('/')[2], body)
      else fail(404, 'ROUTE', 'Route not found.')
      if (method === 'POST' && result.room && !path.endsWith('/socket-ticket') && afterCommit) {
        try { const delivery = await afterCommit(result.room.id); result.delivery = delivery.uncertain ? 'refresh_required' : delivery.delivered ? 'notified' : 'no_subscribers' }
        catch { result.delivery = 'refresh_required' }
      }
      return { statusCode, headers, body: JSON.stringify(result) }
    } catch (error) {
      const status = error.status || (error.name === 'SquadError' ? 409 : 500)
      return { statusCode: status, headers, body: JSON.stringify({ code: error.code || 'SERVER', error: status === 500 ? 'Squad service is unavailable. Retry the read before repeating a change.' : error.message }) }
    }
  }
}
