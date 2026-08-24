import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeRankSnapshot } from './rank-snapshot.mjs'

test('accepts an exact high-confidence Platinum division and visible stats', () => {
  assert.deepEqual(normalizeRankSnapshot({
    rank: 'PLATINUM III', rp: '3275', kd: '1.18', win_rate: '54.2', matches: 84,
    confidence: 0.93, visible_fields: ['rank', 'rp', 'kd'], warnings: [], platform: 'PlayStation',
  }), {
    rank: 'Platinum III', rp: 3275, kd: 1.18, win_rate: 54.2, matches: 84,
    wins: null, losses: null, season: null, platform: 'PlayStation', confidence: 0.93,
    visible_fields: ['rank', 'rp', 'kd'], warnings: [],
  })
})

test('rejects a tier without an exact division or weak visual confidence', () => {
  assert.equal(normalizeRankSnapshot({ rank: 'Platinum', confidence: 0.99 }), null)
  assert.equal(normalizeRankSnapshot({ rank: 'Platinum III', confidence: 0.74 }), null)
})

test('does not carry impossible or invented numeric fields', () => {
  const row = normalizeRankSnapshot({ rank: 'Champion I', confidence: 0.9, win_rate: 140, kd: -2 })
  assert.equal(row.win_rate, null)
  assert.equal(row.kd, null)
})
