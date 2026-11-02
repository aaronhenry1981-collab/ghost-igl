import test from 'node:test'
import assert from 'node:assert/strict'
import { createRoomRealtime } from './realtime-client.mjs'
import { squadEndpoints } from './endpoint-config.mjs'
const state = (revision = 1) => ({ room: { id: 'room-test-001', members: { member: { alias: 'Fixture' } } }, memberId: 'member', revision, expiresAt: 100_000 })
function fixture(api = {}) {
  const sockets = [], accepted = [], statuses = [], timers = new Map(); let timerId = 0
  const client = createRoomRealtime({ api: { socketTicket: async () => ({ ...state(), ticket: 'one-use-fixture', ticketExpiresAt: 20_000 }), snapshot: async () => state(2), ...api }, endpoint: 'wss://abcdefghij.execute-api.us-east-1.amazonaws.com/prod', now: () => 1000,
    socketFactory: url => { const socket = { url, readyState: 1, sent: [], send(value) { this.sent.push(JSON.parse(value)) }, close() { this.closed = true } }; sockets.push(socket); return socket },
    schedule: (fn, ms) => { timers.set(++timerId, { fn, ms }); return timerId }, cancel: id => timers.delete(id), requestId: () => 'request-id-001', onState: value => accepted.push(value), onStatus: value => statuses.push(value) })
  return { client, sockets, accepted, statuses, timers }
}
test('dedicated endpoints are required together and existing payment/player/capture APIs are rejected', () => {
  assert.equal(squadEndpoints(), null)
  assert.throws(() => squadEndpoints('https://abcdefghij.execute-api.us-east-1.amazonaws.com/prod'), /Both/)
  assert.throws(() => squadEndpoints('https://u0k402df6j.execute-api.us-east-1.amazonaws.com/prod', 'wss://abcdefghij.execute-api.us-east-1.amazonaws.com/prod'), /dedicated/)
  assert.throws(() => squadEndpoints('https://abcdefghij.execute-api.us-east-1.amazonaws.com/prod?token=bad', 'wss://abcdefghij.execute-api.us-east-1.amazonaws.com/prod'), /dedicated/)
  assert.ok(squadEndpoints('https://abcdefghij.execute-api.us-east-1.amazonaws.com/prod', 'wss://klmnopqrst.execute-api.us-east-1.amazonaws.com/prod'))
})
test('Stop during a pending ticket cannot open a late socket or restore room state', async () => {
  let release; const f = fixture({ socketTicket: () => new Promise(resolve => { release = resolve }) })
  const pending = f.client.start('room-test-001'); f.client.stop(); release({ ...state(), ticket: 'fixture', ticketExpiresAt: 20_000 }); await pending
  assert.equal(f.sockets.length, 0); assert.equal(f.accepted.length, 0); assert.equal(f.timers.size, 0)
})
test('socket sends no Cognito token, rejects wrong member/room and never rolls back a newer revision', async () => {
  const f = fixture(); await f.client.start('room-test-001'); const socket = f.sockets[0]; socket.onopen()
  assert.equal(new URL(socket.url).searchParams.get('ticket'), 'one-use-fixture'); assert.deepEqual(socket.sent[0], { type: 'sync', knownRevision: 1 })
  const message = value => socket.onmessage({ data: JSON.stringify({ type: 'snapshot', ...value }) })
  message(state(4)); message(state(2)); message({ ...state(5), memberId: 'outsider' }); message({ ...state(6), room: { ...state().room, members: {} } })
  assert.deepEqual(f.accepted.map(value => value.revision), [1, 4]); f.client.stop(); assert.equal(socket.closed, true); assert.equal(f.timers.size, 0)
})
test('coalesced notifications use current reads and a stopped refresh cannot leak into the next view', async () => {
  let resolve, reads = 0; const f = fixture({ snapshot: () => { reads++; return new Promise(done => { resolve = done }) } })
  await f.client.start('room-test-001'); const socket = f.sockets[0]
  socket.onmessage({ data: JSON.stringify({ type: 'version', roomId: 'room-test-001', revision: 2 }) })
  socket.onmessage({ data: JSON.stringify({ type: 'version', roomId: 'room-test-001', revision: 3 }) })
  assert.equal(reads, 1); f.client.stop(); resolve(state(3)); await new Promise(done => setTimeout(done, 0))
  assert.deepEqual(f.accepted.map(value => value.revision), [1])
})
test('ticket failure does not automatically retry or consume another reconnect allowance', async () => {
  let count = 0; const f = fixture({ socketTicket: async () => { count++; throw new Error('quota') } })
  await f.client.start('room-test-001'); assert.equal(count, 1); assert.equal(f.sockets.length, 0); assert.match(f.statuses.at(-1), /reconnect explicitly/)
})
