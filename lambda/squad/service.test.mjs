import test from 'node:test'
import assert from 'node:assert/strict'
import * as domain from '../../src/features/squad/domain.mjs'
import { createSquadService, createHttpHandler } from './service.mjs'
import { createMemoryRepository } from './memory-repository.mjs'
const host = { subject: 'verified-host-001' }, guest = { subject: 'verified-guest-002' }, stranger = { subject: 'verified-other-003' }
function fixture(overrides = {}) {
  let clock = 100_000, serial = 0
  const grant = { id: 'grant-test-001', ownerSubject: host.subject, version: 1, enabled: true, validUntil: clock + 7 * 86400_000, maxMembers: 5, maxCommands: 500, maxSessions: 3, sessionMs: 3600_000, allowedSubjects: [host.subject, guest.subject, stranger.subject, 'verified-user-0', 'verified-user-1'], ...overrides }
  const repo = createMemoryRepository({ grants: [grant], now: () => clock })
  const service = createSquadService({ repo, authenticate: async request => request.verifiedPrincipal || null, domain, now: () => clock,
    random: () => `generated-id-${String(++serial).padStart(5, '0')}` })
  const request = actor => ({ verifiedPrincipal: actor })
  const create = (id = 'create-request-001') => service.create(request(host), { requestId: id, alias: 'Demo Host' })
  const command = async (snapshot, actor, type, values = {}) => service.command(request(actor), snapshot.room.id,
    { type, requestId: `command-${++serial}`, phaseEpoch: snapshot.room.phaseEpoch, iglTerm: snapshot.room.iglTerm, expectedRevision: snapshot.room.revision, ...values })
  return { repo, service, request, create, command, grant, advance: ms => { clock += ms } }
}

test('three/four-player planning does not expand a one-owner grant or admit random teammates', async () => {
  const f = fixture({ maxMembers: 1, maxSessions: 1, allowedSubjects: [host.subject] })
  const before = await f.repo.getGrant(host.subject)
  let current = await f.create(); const originalId = current.room.id
  current = { ...current, ...await f.command(current, host, 'choose_map', { map: 'Villa' }) }
  for (const planId of ['trio', 'quad']) {
    current = { ...current, ...await f.command(current, host, 'select_plan', { planId }) }
    await assert.rejects(() => f.command(current, host, 'lock'), error => error.code === 'STACK_SIZE')
    await assert.rejects(() => f.service.join(f.request(guest), { requestId: `not-enrolled-${planId}`, roomId: originalId, alias: 'Not enrolled', invite: current.invite }), { status: 403 })
    const snapshot = await f.service.snapshot(f.request(host), originalId)
    assert.equal(snapshot.room.id, originalId); assert.equal(snapshot.room.map, 'Villa'); assert.equal(Object.keys(snapshot.room.members).length, 1)
    assert.equal(snapshot.room.plan.id, planId); assert.equal(snapshot.room.plan.locked, false)
    assert.deepEqual(await f.repo.getGrant(host.subject), before)
  }
})
test('missing verified authentication rejects even when body supplies a subject', async () => {
  const f = fixture()
  await assert.rejects(() => f.service.create({}, { alias: 'Demo', requestId: 'request-001', subject: host.subject }), { status: 401 })
})
test('disabled, expired and invalid hosting allowances cannot create a room', async () => {
  for (const overrides of [{ enabled: false }, { validUntil: 1 }, { maxMembers: 6 }, { maxCommands: 501 }, { sessionMs: 7200_000 }, { version: 0 }]) {
    const f = fixture(overrides); await assert.rejects(() => f.create()); assert.equal(f.repo.fixture.roomCount(), 0)
  }
})
test('client cannot write hosting grant or choose another principal on create', async () => {
  const f = fixture()
  await assert.rejects(() => f.service.create(f.request(host), { requestId: 'request-001', alias: 'Demo', ownerSubject: stranger.subject }), { status: 400 })
  await assert.rejects(() => f.service.grant(f.request(guest)), { status: 403 })
})
test('created snapshot omits grant, host identity, invite hash and receipts', async () => {
  const f = fixture(), room = await f.create(), snapshot = await f.service.snapshot(f.request(host), room.room.id)
  assert.ok(room.invite); assert.equal(snapshot.memberId, room.memberId)
  for (const privateKey of ['hostSubject', 'inviteHash', 'grantId', 'receipts', 'excluded']) assert.equal(JSON.stringify(snapshot).includes(privateKey), false)
  assert.equal(JSON.stringify(snapshot).includes(host.subject), false)
})
test('unknown principal cannot read a known room identifier', async () => {
  const f = fixture(), room = await f.create()
  await assert.rejects(() => f.service.snapshot(f.request(stranger), room.room.id), { status: 404 })
})
test('join requires the exact invitation and obtains the latest round without resetting', async () => {
  const f = fixture(); let room = await f.create(); room = { ...room, ...await f.command(room, host, 'choose_map', { map: 'Bank' }) }
  await assert.rejects(() => f.service.join(f.request(guest), { requestId: 'join-request-001', roomId: room.room.id, alias: 'Demo Guest', invite: 'wrong' }), { status: 403 })
  const joined = await f.service.join(f.request(guest), { requestId: 'join-request-002', roomId: room.room.id, alias: 'Demo Guest', invite: room.invite })
  assert.equal(joined.room.phase, room.room.phase); assert.equal(joined.room.phaseEpoch, room.room.phaseEpoch); assert.equal(joined.room.map, 'Bank')
})
test('concurrent joins are atomic and cannot allocate a sixth seat', async () => {
  const f = fixture({ allowedSubjects: [host.subject, ...Array.from({length:4},(_,i)=>`verified-user-${i}`)] }), room = await f.create()
  const joins = await Promise.allSettled(Array.from({ length: 5 }, (_, index) => f.service.join(f.request({ subject: `verified-user-${index}` }), {
    requestId: `join-request-${index}`, roomId: room.room.id, alias: `Demo ${index}`, invite: room.invite })))
  assert.equal(joins.filter(row => row.status === 'fulfilled').length, 4)
  assert.equal(Object.keys((await f.service.snapshot(f.request(host), room.room.id)).room.members).length, 5)
})
test('new allowances cannot be bypassed by closing or recreating the client', async () => {
  const f = fixture({ maxSessions: 1 }), first = await f.create()
  await assert.rejects(() => f.create('create-request-002'), { status: 409 }); assert.equal(f.repo.fixture.roomCount(), 1)
  f.advance(3600_001); await assert.rejects(() => f.create('create-request-003'), { status: 409 })
  await assert.rejects(() => f.service.snapshot(f.request(host), first.room.id), { status: 410 })
})
test('create retry is recoverable without storing or redisclosing the invite token', async () => {
  const f = fixture(), first = await f.create(), repeated = await f.create()
  assert.equal(first.room.id, repeated.room.id); assert.equal(repeated.recovered, true); assert.equal(repeated.invite, null); assert.equal(f.repo.fixture.roomCount(), 1)
})
test('a changed create payload cannot reuse a request ID', async () => {
  const f = fixture(); await f.create()
  await assert.rejects(() => f.service.create(f.request(host), { alias: 'Different', requestId: 'create-request-001' }), { status: 409 })
})
test('command retry is exactly once even if JSON key order changes', async () => {
  const f = fixture(), room = await f.create(), command = { type: 'vote', requestId: 'vote-request-001', phaseEpoch: 1, planId: 'solo' }
  const next = await f.service.command(f.request(host), room.room.id, command)
  const retry = await f.service.command(f.request(host), room.room.id, Object.fromEntries(Object.entries(command).reverse()))
  assert.equal(retry.revision, next.revision); assert.equal(retry.recovered, true)
  await assert.rejects(() => f.service.command(f.request(host), room.room.id, { ...command, planId: 'pair' }), { status: 409 })
})
test('body identity, unsupported commands and excessive fields are rejected', async () => {
  const f = fixture(), room = await f.create()
  for (const body of [{ type: 'toString', requestId: 'request-001' }, { type: 'join', requestId: 'request-001' }, { type: 'vote', requestId: 'request-001', actor: host.subject }, { type: 'vote', requestId: 'request-001', planId: 'x'.repeat(101) }]) {
    await assert.rejects(() => f.service.command(f.request(host), room.room.id, body), { status: 400 })
  }
})
test('member decisions cannot impersonate the IGL or update another operator', async () => {
  const f = fixture(), created = await f.create(), room = await f.service.join(f.request(guest), { requestId: 'join-request-001', roomId: created.room.id, alias: 'Demo Guest', invite: created.invite })
  await assert.rejects(() => f.command(room, guest, 'choose_map', { map: 'Bank' }), { code: 'IGL_ONLY' })
  const next = await f.command(room, guest, 'report_operator', { operator: 'Buck' })
  assert.equal(next.room.members[created.memberId].operator, 'Thermite'); assert.equal(next.room.members[room.memberId].operator, 'Buck')
})
test('removal is enforced before duplicate receipts and all later reads', async () => {
  const f = fixture(), created = await f.create(), body = { requestId: 'join-request-001', roomId: created.room.id, alias: 'Demo Guest', invite: created.invite }
  const joined = await f.service.join(f.request(guest), body)
  await f.command(joined, host, 'remove', { memberSubject: joined.memberId })
  await assert.rejects(() => f.service.join(f.request(guest), body), { status: 403 })
  await assert.rejects(() => f.service.snapshot(f.request(guest), created.room.id), { status: 404 })
})
test('server command cap rejects extra operations, while identical retry remains readable', async () => {
  const f = fixture({ maxCommands: 1 }), room = await f.create(), body = { type: 'vote', requestId: 'vote-request-001', planId: 'solo', phaseEpoch: 1 }
  await f.service.command(f.request(host), room.room.id, body)
  assert.equal((await f.service.command(f.request(host), room.room.id, body)).recovered, true)
  await assert.rejects(() => f.service.command(f.request(host), room.room.id, { ...body, requestId: 'vote-request-002' }), { status: 429 })
})
test('grant revocation and expiry prevent later reads or mutations', async () => {
  const f = fixture(), room = await f.create()
  f.repo.fixture.setGrant({ ...f.grant, enabled: false, version: 2 })
  await assert.rejects(() => f.service.snapshot(f.request(host), room.room.id), { status: 403 })
  const g = fixture(), other = await g.create(); g.advance(3600_001)
  await assert.rejects(() => g.command(other, host, 'vote', { planId: 'solo' }), { status: 410 })
})
test('HTTP handler rejects malformed/base64/oversized JSON and unknown routes without exposing internals', async () => {
  const f = fixture(), handler = createHttpHandler(f.service)
  const event = { requestContext: { http: { method: 'POST' } }, rawPath: '/squads', verifiedPrincipal: host }
  assert.equal((await handler({ ...event, body: '{' })).statusCode, 400)
  assert.equal((await handler({ ...event, isBase64Encoded: true })).statusCode, 400)
  assert.equal((await handler({ ...event, body: 'x'.repeat(4097) })).statusCode, 413)
  assert.equal((await handler({ ...event, rawPath: '/admin/grant', body: '{}' })).statusCode, 404)
  const response = await handler({ ...event, body: JSON.stringify({ alias: 'Demo', requestId: 'request-001' }) })
  assert.equal(response.statusCode, 201); assert.equal(response.headers['Cache-Control'], 'no-store')
})
const profileBody = (overrides = {}) => ({ requestId: 'profile-request-001', expectedVersion: 0, platform: 'playstation', season: 'User season', mode: 'User mode', rankLabel: 'Unknown', rp: null, context: 'before_session', ...overrides })
test('private rank observations bind to the verified owner, stay out of shared snapshots and dedupe retries', async () => {
  const f = fixture(), room = await f.create(), body = profileBody()
  const saved = await f.service.updateProfile(f.request(host), room.room.id, body)
  assert.equal(saved.profile.source, 'user_reported'); assert.equal(saved.profile.verified, false)
  assert.equal((await f.service.profile(f.request(guest))).profile, null)
  const repeated = await f.service.updateProfile(f.request(host), room.room.id, Object.fromEntries(Object.entries(body).reverse()))
  assert.equal(repeated.recovered, true); assert.equal((await f.service.history(f.request(host))).observations.length, 1)
  assert.equal(JSON.stringify((await f.service.snapshot(f.request(host), room.room.id)).room).includes('rankLabel'), false)
  await assert.rejects(() => f.service.updateProfile(f.request(host), room.room.id, profileBody({ requestId: 'profile-request-002', ownerSubject: guest.subject })), { status: 400 })
})
test('profile CAS prevents account-device overwrite and retains private history after session expiry', async () => {
  const f = fixture(), room = await f.create(); await f.service.updateProfile(f.request(host), room.room.id, profileBody())
  await assert.rejects(() => f.service.updateProfile(f.request(host), room.room.id, profileBody({ requestId: 'profile-request-002', rankLabel: 'Different' })), { status: 409 })
  f.advance(3600_001)
  assert.equal((await f.service.profile(f.request(host))).profile.version, 1)
  assert.equal((await f.service.history(f.request(host))).observations.length, 1)
  await assert.rejects(() => f.service.updateProfile(f.request(host), room.room.id, profileBody({ requestId: 'profile-request-003', expectedVersion: 1 })), { status: 410 })
})
test('owner can recover an active room without a raw invite, then explicitly replace the invite', async () => {
  const f = fixture(), room = await f.create(), current = await f.service.grant(f.request(host))
  assert.equal(current.activeRoomId, room.room.id); assert.equal(current.sessionsUsed, 1)
  const updated = await f.service.rotateInvite(f.request(host), room.room.id, { requestId: 'invite-request-001' })
  assert.notEqual(updated.invite, room.invite)
  await assert.rejects(() => f.service.join(f.request(guest), { roomId: room.room.id, alias: 'Guest', requestId: 'join-request-old', invite: room.invite }), { status: 403 })
  assert.ok(await f.service.join(f.request(guest), { roomId: room.room.id, alias: 'Guest', requestId: 'join-request-new', invite: updated.invite }))
})
test('named-stage paths work, and fanout failure does not hide an already committed operation', async () => {
  const f = fixture(), handler = createHttpHandler(f.service, { afterCommit: async () => { throw new Error('transport') } })
  const response = await handler({ requestContext: { http: { method: 'POST' }, stage: 'prod' }, rawPath: '/prod/squads', verifiedPrincipal: host, body: JSON.stringify({ alias: 'Demo', requestId: 'create-stage-001' }) })
  assert.equal(response.statusCode, 201); assert.equal(JSON.parse(response.body).delivery, 'refresh_required'); assert.equal(f.repo.fixture.roomCount(), 1)
})
