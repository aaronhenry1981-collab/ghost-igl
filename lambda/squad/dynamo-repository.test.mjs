import test from 'node:test'
import assert from 'node:assert/strict'
import { GetCommand, QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb'
import { createDynamoRepository } from './dynamo-repository.mjs'
const commands = { GetCommand, QueryCommand, TransactWriteCommand }
function fixture(responses = []) {
  const calls = [], repo = createDynamoRepository({ table: 'recon-squad-state', commands, now: () => 1000,
    client: { send: async command => { calls.push(command); const value = responses.shift(); if (value instanceof Error) throw value; return value || {} } } })
  return { repo, calls }
}
const grant = { id: 'grant-test-001', ownerSubject: 'verified-host-001', version: 1, maxSessions: 3 }
const envelope = { id: 'room-test-001', hostSubject: grant.ownerSubject, grantId: grant.id, version: 1, expiresAt: 9000, state: { receipts: [], revision: 1 } }
test('repository refuses existing production tables and binds strong reads to exact keys', async () => {
  assert.throws(() => createDynamoRepository({ client: {}, commands, table: 'ghost-igl-subscriptions' }), /dedicated/)
  const f = fixture([{ Item: { grant } }]); assert.deepEqual(await f.repo.getGrant(grant.ownerSubject), grant)
  assert.deepEqual(f.calls[0].input.Key, { PK: 'GRANT#verified-host-001', SK: 'ACCESS' }); assert.equal(f.calls[0].input.ConsistentRead, true)
  assert.equal(f.calls[0].input.TableName, 'recon-squad-grants')
})
test('create transaction conditions grant, active-session usage and duplicate receipt atomically', async () => {
  const f = fixture([{}, {}]); assert.equal(await f.repo.createSession({ envelope, grant, createReceipt: { requestId: 'request-001' } }), true)
  const items = f.calls[1].input.TransactItems
  assert.equal(items.length, 4); assert.equal(items[0].ConditionCheck.Key.PK.startsWith('GRANT#'), true)
  assert.ok(items[0].ConditionCheck.ConditionExpression.includes('#g.#enabled'))
  assert.equal(items[0].ConditionCheck.TableName, 'recon-squad-grants'); assert.ok(items.slice(1).every(item => item.Put.TableName === 'recon-squad-state'))
  assert.equal(items.filter(item => item.Put?.Item.PK.startsWith('GRANT#')).length, 0)
})
test('room state, compact receipt and ticket/profile changes share a conditional transaction', async () => {
  const f = fixture([{}]); const profile = { ownerSubject: grant.ownerSubject, version: 1, rankLabel: 'Unknown' }
  assert.equal(await f.repo.commitRoom({ expectedVersion: 0, next: envelope, grant, receipt: { actor: 'member-001', requestId: 'request-001' }, ticket: { hash: 'a'.repeat(64) }, privateProfile: { previousVersion: 0, profile, requestId: 'request-001' } }), true)
  const items = f.calls[0].input.TransactItems
  assert.equal(items.length, 6); assert.ok(items[1].Put.ConditionExpression.includes('#e.#v'))
  assert.ok(items.some(item => item.Put?.Item.SK.startsWith('RECEIPT#'))); assert.ok(items.some(item => item.Put?.Item.SK.startsWith('OBS#')))
  assert.ok(items.every(item => !item.Put?.Item.PK.startsWith('GRANT#')))
})
test('only known cancelled conditional transactions return a retryable false', async () => {
  const error = Object.assign(new Error('condition'), { name: 'TransactionCanceledException', CancellationReasons: [{ Code: 'None' }, { Code: 'ConditionalCheckFailed' }] })
  const f = fixture([error]); assert.equal(await f.repo.commitRoom({ expectedVersion: 0, next: envelope, grant, receipt: { actor: 'member', requestId: 'request' } }), false)
  const timeout = fixture([new Error('network outcome unknown')]); await assert.rejects(() => timeout.repo.commitRoom({ expectedVersion: 0, next: envelope, grant, receipt: { actor: 'member', requestId: 'request' } }), /unknown/)
  assert.equal(timeout.calls.length, 1)
})
test('private history and connection queries are bounded to exact partitions without scans', async () => {
  const f = fixture([{ Items: [] }, { Items: [] }]); await f.repo.getProfileHistory('verified-host-001'); await f.repo.getConnections('room-test-001')
  assert.equal(f.calls[0].input.ExpressionAttributeValues[':pk'], 'USER#verified-host-001'); assert.equal(f.calls[0].input.Limit, 25)
  assert.equal(f.calls[1].input.ExpressionAttributeValues[':pk'], 'ROOM#room-test-001'); assert.equal(f.calls[1].input.Limit, 50)
  assert.ok(f.calls.every(command => command.input.ConsistentRead === true && command instanceof QueryCommand))
})
