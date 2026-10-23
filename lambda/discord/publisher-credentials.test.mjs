import test from 'node:test'
import assert from 'node:assert/strict'
import { createBotClient, publishDailyTip } from './publisher.mjs'

const channelId = '1561007958890909706', guildId = '1492733599424839781'
function fixture(token, status = 200) {
  const calls = [], rows = new Map()
  const discord = createBotClient({
    channelId, guildId, getToken: async () => token,
    fetchImpl: async (_url, request) => {
      calls.push(request)
      return new Response(JSON.stringify(status === 200
        ? { id: channelId, guild_id: guildId, type: 0 }
        : { code: 0, message: 'private credential diagnostic' }), { status })
    },
  })
  const args = {
    config: { enabled: true, channelId }, discord,
    event: { action: 'daily-tip', scheduledTime: '2026-10-23T16:00:00Z' },
    now: new Date('2026-10-23T16:00:01Z'),
    store: {
      claim: async row => { if (rows.has(row.key)) return false; rows.set(row.key, row); return true },
      markUncertain: async (key, diagnostic) => { rows.get(key).diagnostic = diagnostic },
      markSent: async () => assert.fail('these tests must not send messages'),
    },
  }
  return { discord, calls, rows, args }
}

for (const token of ['Bot fixture-private', 'Bearer fixture-private', ' fixture-private', 'fixture-private ', 'fixture\nprivate', '"fixture-private"', '{"token":"fixture-private"}', 'fixture\u007fprivate']) {
  test('malformed credential envelope is rejected locally: ' + JSON.stringify(token), async () => {
    const f = fixture(token)
    const result = await publishDailyTip(f.args)
    assert.equal(result.status, 'needs-review')
    assert.equal(result.diagnostic.kind, 'credential-format')
    assert.equal(result.diagnostic.postStarted, false)
    assert.equal(f.calls.length, 0)
    assert.equal((await publishDailyTip(f.args)).status, 'already-claimed')
    assert.doesNotMatch(JSON.stringify([...f.rows.values()]), /fixture-private|Authorization|token/)
  })
}

test('valid opaque token receives exactly one Bot prefix, without rewriting it', async () => {
  const f = fixture('fixture-private')
  await f.discord.verifyChannel(channelId)
  assert.equal(f.calls.length, 1)
  assert.equal(f.calls[0].headers.Authorization, 'Bot fixture-private')
})

test('401 stops subsequent requests in the same client and retains the daily claim', async () => {
  const f = fixture('fixture-private', 401)
  const first = await publishDailyTip(f.args)
  assert.equal(first.status, 'needs-review')
  assert.equal(first.diagnostic.httpStatus, 401)
  assert.equal(first.diagnostic.postStarted, false)
  assert.equal((await publishDailyTip(f.args)).status, 'already-claimed')
  await assert.rejects(f.discord.verifyChannel(channelId))
  await assert.rejects(f.discord.send({ content: 'must not send' }, 'synthetic'))
  assert.equal(f.calls.length, 1)
  assert.doesNotMatch(JSON.stringify(first), /fixture-private|private credential diagnostic/)
})
