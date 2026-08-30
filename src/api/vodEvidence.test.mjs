import assert from 'node:assert/strict'
import test from 'node:test'

import { buildVodCoachingEvent } from './vodEvidence.js'

test('builds honest coaching evidence from a VOD analysis', () => {
  const event = buildVodCoachingEvent({
    session: { detected_map: 'Coastline', detected_side: 'attack', score: 72, image_count: 2 },
    per_image: [{
      detected: { site: 'Hookah', character: 'Ash' },
      what_went_wrong: ['Entered without drone intel'],
    }],
    patterns: { recurring_weaknesses: ['Skipped the information step'] },
    practice_plan: { this_week: ['Drone the entry before every push'] },
  }, {}, { now: '2026-08-30T12:00:00.000Z', sessionId: 'vod-test' })

  assert.equal(event.sessionId, 'vod-test')
  assert.equal(event.phase, 'round-review')
  assert.deepEqual(event.gameState, {
    map: 'Coastline', siteId: 'Hookah', side: 'attack', operatorId: 'Ash',
  })
  assert.equal(event.report.mechanics.dominant, 'Skipped the information step')
  assert.equal(event.report.mechanics.drill, 'Drone the entry before every push')
  assert.equal(event.report.score, 72)
  assert.equal(event.outcome, undefined)
})

test('uses player context only as a fallback and does not invent outcomes', () => {
  const event = buildVodCoachingEvent({}, {
    map: 'bank', site: 'basement', side: 'defense', operator: 'Mute',
  }, { now: '2026-08-30T12:00:00.000Z', sessionId: 'vod-context' })

  assert.deepEqual(event.gameState, {
    map: 'bank', siteId: 'basement', side: 'defense', operatorId: 'Mute',
  })
  assert.equal(event.report.mechanics.dominant, null)
  assert.equal(event.report.mechanics.drill, null)
  assert.equal(event.report.score, null)
})
