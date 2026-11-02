import test from 'node:test'
import assert from 'node:assert/strict'
import * as domain from '../../src/features/squad/domain.mjs'
import { createSquadService } from './service.mjs'
import { createMemoryRepository } from './memory-repository.mjs'
import { createWebsocketService } from './websocket.mjs'
const host = { subject: 'verified-host-001' }, guest = { subject: 'verified-guest-002' }
async function fixture(ownerOnly = false) {
  let clock = 100_000, serial = 0
  const grant = { id: 'grant-test-001', ownerSubject: host.subject, version: 1, enabled: true, validUntil: 99_999_999,
    maxMembers: ownerOnly ? 1 : 5, maxCommands: 500, maxSessions: 3, sessionMs: 3600_000, allowedSubjects: ownerOnly ? [host.subject] : [host.subject, guest.subject] }
  const repo = createMemoryRepository({ grants: [grant], now: () => clock })
  const service = createSquadService({ repo, domain, now: () => clock, authenticate: async request => request.principal,
    random: () => `random-fixture-${++serial}` })
  const request = actor => ({ principal: actor }), room = await service.create(request(host), { alias: 'Demo Host', requestId: 'create-request-001' })
  const sent = [], closed = [], ws = createWebsocketService({ apiId: 'new-squad-ws', repo, service,
    transport: { post: async (connectionId, data) => sent.push({ connectionId, data }), close: async id => closed.push(id) } })
  const event = (id, routeKey, values = {}) => ({ requestContext: { apiId: 'new-squad-ws', connectionId: id, routeKey }, ...values })
  const ticket = actor => service.socketTicket(request(actor), room.room.id, { requestId: `ticket-request-${++serial}` })
  const connect = async (id, actor = host) => { const value = await ticket(actor); return ws.handler(event(id, '$connect', { queryStringParameters: { ticket: value.ticket } })) }
  return { room, repo, service, ws, event, request, grant, sent, closed, ticket, connect, advance: ms => { clock += ms } }
}
test('owner-only trial supports two devices of the same account without another participant', async () => {
  const f = await fixture(true)
  assert.equal((await f.connect('owner-phone')).statusCode, 200); assert.equal((await f.connect('owner-laptop')).statusCode, 200)
  const current = await f.service.snapshot(f.request(host), f.room.room.id)
  assert.equal(Object.keys(current.room.members).length, 1)
  await assert.rejects(() => f.service.join(f.request(guest), { roomId: f.room.room.id, alias: 'Guest', requestId: 'join-request-001', invite: f.room.invite }), { status: 403 })
})
test('socket admission requires a single-use current ticket and rejects body identity tricks', async () => {
  const f = await fixture(), ticket = await f.ticket(host)
  assert.equal((await f.ws.handler(f.event('socket-a', '$connect', { queryStringParameters: { ticket: ticket.ticket } }))).statusCode, 200)
  assert.equal((await f.ws.handler(f.event('socket-b', '$connect', { queryStringParameters: { ticket: ticket.ticket } }))).statusCode, 403)
  assert.equal((await f.ws.handler(f.event('socket-c', '$connect', { queryStringParameters: { ticket: 'fake-ticket', subject: host.subject } }))).statusCode, 403)
  const wrong = f.event('socket-d', '$connect', { queryStringParameters: { ticket: ticket.ticket } }); wrong.requestContext.apiId = 'other-api'
  assert.equal((await f.ws.handler(wrong)).statusCode, 403)
})
test('expired tickets and tickets issued before removal cannot connect', async () => {
  const f = await fixture(), ticket = await f.ticket(host); f.advance(30_001)
  assert.equal((await f.ws.handler(f.event('expired', '$connect', { queryStringParameters: { ticket: ticket.ticket } }))).statusCode, 403)
  const g = await fixture(), joined = await g.service.join(g.request(guest), { roomId: g.room.room.id, alias: 'Demo Guest', requestId: 'join-request-001', invite: g.room.invite }), pending = await g.ticket(guest)
  const current = await g.service.snapshot(g.request(host), g.room.room.id)
  await g.service.command(g.request(host), g.room.room.id, { type: 'remove', memberSubject: joined.memberId, requestId: 'remove-request-001', phaseEpoch: current.room.phaseEpoch, iglTerm: current.room.iglTerm, expectedRevision: current.room.revision })
  assert.equal((await g.ws.handler(g.event('removed', '$connect', { queryStringParameters: { ticket: pending.ticket } }))).statusCode, 403)
})
test('sync delivers the authoritative latest snapshot bound to the stored socket identity', async () => {
  const f = await fixture(); await f.connect('socket-a')
  assert.equal((await f.ws.handler(f.event('socket-a', '$default', { body: JSON.stringify({ type: 'sync', knownRevision: 0 }) }))).statusCode, 200)
  assert.equal(f.sent.at(-1).data.type, 'snapshot'); assert.equal(f.sent.at(-1).data.memberId, f.room.memberId)
  assert.equal(JSON.stringify(f.sent).includes(host.subject), false); assert.equal(JSON.stringify(f.sent).includes(f.room.invite), false)
})
test('new connection supersedes the oldest only after the per-member two-device limit', async () => {
  const f = await fixture(); await f.connect('device-one'); await f.connect('device-two'); await f.connect('device-three')
  assert.ok(f.closed.includes('device-one')); assert.equal((await f.repo.getConnections(f.room.room.id)).length, 2)
  assert.equal((await f.ws.handler(f.event('device-one', '$default', { body: '{"type":"sync"}' }))).statusCode, 403)
})
test('reconnect tickets are bounded and replay does not redisclose a token', async () => {
  const f = await fixture(), first = await f.service.socketTicket(f.request(host), f.room.room.id, { requestId: 'ticket-request-same' })
  const retry = await f.service.socketTicket(f.request(host), f.room.room.id, { requestId: 'ticket-request-same' })
  assert.ok(first.ticket); assert.equal(retry.ticket, undefined); assert.equal(retry.recovered, true)
  for (let i = 1; i < 20; i++) await f.ticket(host)
  await assert.rejects(() => f.ticket(host), { status: 429 })
})
test('token expiry prevents later socket messages even while the room is active', async () => {
  const f = await fixture(), ticket = await f.ticket({ ...host, tokenExpiresAt: 101_000 })
  await f.ws.handler(f.event('short-token', '$connect', { queryStringParameters: { ticket: ticket.ticket } })); f.advance(1001)
  assert.equal((await f.ws.handler(f.event('short-token', '$default', { body: '{"type":"ping"}' }))).statusCode, 403)
  assert.ok(f.closed.includes('short-token')); assert.equal(f.sent.length, 0)
})
test('grant revocation is rechecked before every fanout delivery', async () => {
  const f = await fixture(); await f.connect('socket-a'); f.repo.fixture.setGrant({ ...f.grant, enabled: false, version: 2 })
  const delivered = await f.ws.broadcastRoom(f.room.room.id)
  assert.equal(delivered.delivered, 0); assert.equal(delivered.skipped, 1); assert.ok(f.closed.includes('socket-a')); assert.equal(f.sent.length, 0)
})
test('malformed messages, client identity fields and encoded payloads cannot request another role', async () => {
  for (const values of [{ body: '{' }, { body: '{"type":"sync","subject":"another-player"}' }, { body: '{"type":"sync"}', isBase64Encoded: true }, { body: '{"type":"ping","knownRevision":-1}' }]) {
    const f = await fixture(); await f.connect('socket-a')
    assert.equal((await f.ws.handler(f.event('socket-a', '$default', values))).statusCode, 400); assert.equal(f.sent.length, 0); assert.ok(f.closed.includes('socket-a'))
  }
})
test('disconnect is idempotent and does not delete room/audit data', async () => {
  const f = await fixture(); await f.connect('socket-a')
  await f.ws.handler(f.event('socket-a', '$disconnect')); await f.ws.handler(f.event('socket-a', '$disconnect'))
  assert.ok(await f.repo.getRoom(f.room.room.id)); assert.equal((await f.repo.getConnection('socket-a')).status, 'closed')
})
