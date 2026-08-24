import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildConcurrentRolloverFollowupUpdate,
  buildMapContext,
  buildRefundUpdate,
  buildRolloverReserveUpdate,
  resolveSite,
  validateAnalysis,
} from './coach-contract.mjs'

const map = {
  name: 'Bank',
  sites: [
    { id: 'basement', name: 'CCTV / Lockers', floor: 'B', setup: 'complete-site-detail' },
    { id: 'top-floor', name: 'CEO / Lounge', floor: '2F' },
  ],
  bans: ['Kaid'],
}

test('resolveSite accepts normalized id and display name', () => {
  assert.equal(resolveSite(map.sites, 'BASEMENT')?.id, 'basement')
  assert.equal(resolveSite(map.sites, 'CCTV Lockers')?.id, 'basement')
  assert.equal(resolveSite(map.sites, 'missing'), null)
})

test('buildMapContext preserves the complete selected site', () => {
  const context = buildMapContext(map, 'CCTV / Lockers')
  assert.match(context, /SELECTED SITE \(authoritative, complete\)/)
  assert.match(context, /complete-site-detail/)
  assert.match(context, /top-floor/)
})

test('validateAnalysis accepts a complete response and rejects an invalid phase', () => {
  const valid = {
    session: { headline: 'Good review', score: 75, image_count: 1 },
    per_image: [{
      image_index: 0,
      detected: { round_phase: 'action' },
      what_happened: 'The player held the doorway.',
      what_went_wrong: [],
      what_went_right: ['Kept cover'],
      specific_advice: ['Hold the tighter angle'],
    }],
    patterns: { recurring_weaknesses: [], standout_strengths: [] },
    practice_plan: { this_week: ['Angle drill'] },
  }

  assert.deepEqual(validateAnalysis(valid, 1), [])
  valid.per_image[0].detected.round_phase = 'invented'
  assert.match(validateAnalysis(valid, 1).join('\n'), /round_phase is invalid/)
})

test('usage counter updates keep their concurrency guards', () => {
  const sub = { stripe_customer_id: 'cus_test', vod_period_start_at: '2026-07-01T00:00:00.000Z' }
  const now = '2026-08-01T00:00:00.000Z'

  const refund = buildRefundUpdate(sub, false, 'subs', now)
  assert.equal(refund.UpdateExpression, 'SET vod_sessions_used = vod_sessions_used - :one, vod_updated_at = :now')
  assert.match(refund.ConditionExpression, /vod_sessions_used > :zero/)

  const rollover = buildRolloverReserveUpdate(sub, 'subs', now)
  assert.equal(rollover.ExpressionAttributeValues[':previous'], sub.vod_period_start_at)

  const followup = buildConcurrentRolloverFollowupUpdate(sub, 'subs', 20, now)
  assert.equal(followup.ExpressionAttributeValues[':limit'], 20)
  assert.match(followup.ConditionExpression, /vod_sessions_used < :limit/)
})
