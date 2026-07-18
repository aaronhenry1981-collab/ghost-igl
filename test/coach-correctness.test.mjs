import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import MAPS from '../src/data/maps.js'
import { RANKED_ROTATION } from '../src/data/rankedRotation.js'
import { R6_PATCH_FACTS } from '../src/data/r6PatchFacts.js'
import { buildConcurrentRolloverFollowupUpdate, buildMapContext, buildRefundUpdate, buildRolloverReserveUpdate, validateAnalysis } from '../lambda/vod/coach-contract.mjs'

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

test('paid-period rollover uses compare-and-set and counts the losing concurrent request', () => {
  const sub = { stripe_customer_id: 'cus_test', vod_period_start_at: '2026-06-01T00:00:00.000Z' }
  const rollover = buildRolloverReserveUpdate(sub, 'subs', '2026-07-18T00:00:00.000Z')
  assert.match(rollover.ConditionExpression, /vod_period_start_at = :previous/)
  assert.equal(rollover.ExpressionAttributeValues[':previous'], sub.vod_period_start_at)
  const followup = buildConcurrentRolloverFollowupUpdate(sub, 'subs', 20, '2026-07-18T00:00:00.000Z')
  assert.match(followup.UpdateExpression, /vod_sessions_used = vod_sessions_used \+ :one/)
  assert.match(followup.ConditionExpression, /vod_period_start_at <> :previous/)
  assert.equal(followup.ExpressionAttributeValues[':limit'], 20)
})

test('current R6 patch facts supersede the stale Dokkaebi timing', () => {
  assert.equal(R6_PATCH_FACTS.patch, 'Y11S2.2')
  assert.equal(R6_PATCH_FACTS.operatorChanges.Dokkaebi.jegeoPayloadCooldownSeconds, 14)
  assert.equal(R6_PATCH_FACTS.operatorChanges.Dokkaebi.cooldownScope, 'per-target')
  assert.equal(vodContext.current_patch.operatorChanges.Dokkaebi.jegeoPayloadCooldownSeconds, 14)
})

test('generated content does not teach the superseded seven-second recovery window', () => {
  const generator = readFileSync(new URL('../scripts/generate-blog-posts.mjs', import.meta.url), 'utf8')
  assert.equal(generator.includes('guaranteed ~7 seconds'), false)
  assert.equal(generator.includes('put a 7-second cooldown between activations'), false)
})

test('CRM win-back requires consent and honors durable marketing suppression', () => {
  const crm = readFileSync(new URL('../lambda/crm/index.mjs', import.meta.url), 'utf8')
  assert.match(crm, /marketingConsented && !marketingSuppressed/)
  assert.match(crm, /!log\.welcome_sent_at && !marketingSuppressed/)
  assert.match(crm, /profile\?\.marketing_consent_at/)
})

test('desktop verification requires a signed token and issued tokens identify the user', () => {
  const subscription = readFileSync(new URL('../lambda/subscription/index.mjs', import.meta.url), 'utf8')
  assert.match(subscription, /Missing activation token/)
  assert.equal(subscription.includes("typeof body.email === 'string'"), false)
  assert.match(subscription, /user_id: payload\?\.sub \|\| email/)
  assert.match(subscription, /token_id: crypto\.randomUUID\(\)/)
})
