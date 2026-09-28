// The read-only player-data methods added to the PR #24 tables interface:
// Query only, per player (or per provider), never a Scan; no free-text or
// identity fields projected.

import test from 'node:test'
import assert from 'node:assert/strict'
import { createDynamoTables } from '../../data/dynamoTables.mjs'
import { createMemoryTables } from '../../data/memoryTables.mjs'
import { buildSupportWorld } from '../fixtures.mjs'

function fakeDdb(pages = {}) {
  const calls = []
  return {
    calls,
    async send(command) {
      calls.push({ name: command.constructor.name, input: command.input })
      const key = command.input.TableName
      return pages[key] ? pages[key](command.input) : { Items: [] }
    },
  }
}

const NAMES = { playerSnapshots: 'recon-player-snapshots', playerIdentities: 'recon-player-identities', providerHealth: 'recon-player-provider-health' }

test('dynamo playerSnapshots: Query newest-first on one player, bounded pages, no notes', async () => {
  const ddb = fakeDdb({ 'recon-player-snapshots': (input) => (input.ExclusiveStartKey ? { Items: [{ snapshot_key: 'b' }] } : { Items: [{ snapshot_key: 'a' }], LastEvaluatedKey: { k: 1 } }) })
  const tables = createDynamoTables({ ddb, names: NAMES })
  const rows = await tables.playerSnapshots('RP-fixture')
  assert.equal(rows.length, 2)
  assert.ok(ddb.calls.every((c) => c.name === 'QueryCommand'))
  const input = ddb.calls[0].input
  assert.equal(input.TableName, 'recon-player-snapshots')
  assert.equal(input.ScanIndexForward, false)
  assert.equal(input.ExpressionAttributeValues[':id'], 'RP-fixture')
  assert.ok(!/notes/.test(JSON.stringify(input.ExpressionAttributeNames)))
  assert.ok(ddb.calls.length <= 2)
  assert.deepEqual(await tables.playerSnapshots(null), [])
})

test('dynamo playerIdentities and providerHealth: Query only, no external ids', async () => {
  const ddb = fakeDdb({ 'recon-player-provider-health': (input) => ({ Items: [{ provider: input.ExpressionAttributeValues[':p'], status: 'healthy' }] }) })
  const tables = createDynamoTables({ ddb, names: NAMES })
  await tables.playerIdentities('RP-fixture')
  const health = await tables.providerHealth()
  assert.equal(health.length, 7)
  assert.ok(ddb.calls.every((c) => c.name === 'QueryCommand'), 'never a Scan')
  const ident = ddb.calls.find((c) => c.input.TableName === 'recon-player-identities').input
  assert.ok(!/external_id|username/.test(JSON.stringify(ident.ExpressionAttributeNames)))
  for (const c of ddb.calls.filter((x) => x.input.TableName === 'recon-player-provider-health')) {
    assert.equal(c.input.Limit, 1)
    assert.equal(c.input.ScanIndexForward, false)
    assert.ok(!/checked_by/.test(JSON.stringify(c.input.ExpressionAttributeNames)))
  }
})

test('dynamo: unconfigured table names are not_connected', async () => {
  const tables = createDynamoTables({ ddb: fakeDdb(), names: {} })
  await assert.rejects(tables.playerSnapshots('RP-x'), { name: 'NotConnectedError' })
  await assert.rejects(tables.providerHealth(), { name: 'NotConnectedError' })
})

test('memory tables mirror the same shapes and fail independently', async () => {
  const world = buildSupportWorld()
  const rp = world.scenarios.paying_active.reconPlayerId
  const tables = createMemoryTables(world)
  const snaps = await tables.playerSnapshots(rp)
  assert.equal(snaps[0].snapshot_id, 'snap-vex-ubi-2', 'newest first')
  assert.ok(snaps.every((s) => !('notes' in s)))
  const ids = await tables.playerIdentities(rp)
  assert.ok(ids.every((i) => !('external_id' in i) && !('username' in i)))
  const health = await tables.providerHealth()
  assert.ok(health.every((h) => !('checked_by' in h)))
  assert.deepEqual(await tables.playerSnapshots('RP-nobody'), [])
  const failing = createMemoryTables(world, { failures: { playerSnapshots: true } })
  await assert.rejects(failing.playerSnapshots(rp))
  assert.ok((await failing.playerIdentities(rp)).length > 0)
  const legacyWorld = { ...world, playerSnapshots: undefined, playerIdentities: undefined, providerHealth: undefined }
  assert.deepEqual(await createMemoryTables(legacyWorld).providerHealth(), [])
})
