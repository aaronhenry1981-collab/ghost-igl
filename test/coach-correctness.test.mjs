import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import MAPS from '../src/data/maps.js'
import { RANKED_ROTATION } from '../src/data/rankedRotation.js'
import { buildMapContext, buildRefundUpdate, validateAnalysis } from '../lambda/vod/coach-contract.mjs'

const vodContext = JSON.parse(readFileSync(new URL('../lambda/vod/r6-context.json', import.meta.url), 'utf8'))

test('selected later site is included completely before supporting context truncation', () => {
  const map = vodContext.maps.bank
  const selected = map.sites.at(-1)
  const promptContext = buildMapContext(map, selected.id)
  assert.match(promptContext, /SELECTED SITE \(authoritative, complete\)/)
  assert.ok(promptContext.includes(JSON.stringify(selected, null, 2)))
  assert.match(promptContext, /Lockers \/ CCTV Room/)
})

test('Calypso Casino and all four verified sites are available to VOD generation', () => {
  const calypso = vodContext.maps['calypso-casino']
  assert.equal(calypso.name, 'Calypso Casino')
  assert.deepEqual(calypso.sites.map((site) => site.id), [
    'vip-cash', 'casino-keno', 'lobby-mezzanine', 'vault-security',
  ])
})

test('ranked manifest, map UI flags, and VOD context stay in parity', () => {
  const flagged = MAPS.filter((map) => map.rankedPool).map((map) => map.id).sort()
  assert.deepEqual(flagged, [...RANKED_ROTATION.mapIds].sort())
  assert.deepEqual(vodContext.ranked_rotation.mapIds, RANKED_ROTATION.mapIds)
  for (const mapId of RANKED_ROTATION.mapIds) assert.ok(vodContext.maps[mapId], `${mapId} missing from VOD context`)
  for (const removed of RANKED_ROTATION.removed) assert.equal(MAPS.find((map) => map.id === removed)?.rankedPool, false)
})

test('failure compensation atomically refunds paid and trial reservations', () => {
  const sub = { stripe_customer_id: 'cus_test' }
  const paid = buildRefundUpdate(sub, false, 'subs', '2026-07-18T00:00:00.000Z')
  const trial = buildRefundUpdate(sub, true, 'subs', '2026-07-18T00:00:00.000Z')
  assert.match(paid.UpdateExpression, /vod_sessions_used = vod_sessions_used - :one/)
  assert.match(trial.UpdateExpression, /vod_lifetime_used = vod_lifetime_used - :one/)
  assert.match(paid.ConditionExpression, /vod_sessions_used > :zero/)
  assert.deepEqual(paid.Key, { stripe_customer_id: 'cus_test' })
})

test('strict result validator rejects incomplete model output', () => {
  assert.ok(validateAnalysis({ session: { headline: 'x', score: 50, image_count: 1 }, per_image: [] }, 1).length > 0)
})

test('repeated generic tactic text is quarantined from coach context', () => {
  const serialized = JSON.stringify(vodContext)
  assert.equal(serialized.includes('Verified in-game spawn — drone your approach lane from here before you commit.'), false)
  const quarantineCount = Object.values(vodContext.maps)
    .flatMap((map) => map.sites)
    .reduce((sum, site) => sum + site.attack_quarantined_repeated_tactics + site.defense_quarantined_repeated_tactics, 0)
  assert.ok(quarantineCount > 0)
})
