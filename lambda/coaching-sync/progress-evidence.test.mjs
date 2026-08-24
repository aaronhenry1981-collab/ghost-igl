import test from 'node:test'
import assert from 'node:assert/strict'
import { aggregateProgressEvidence, normalizeObservedRank, sanitizeProgressEvidence } from './progress-evidence.mjs'

test('accepts only closed-list, high-confidence literal evidence', () => {
  assert.deepEqual(sanitizeProgressEvidence({
    skillId: 'drone-before-entry', result: 'proved', confidence: 0.94,
    evidence: 'A drone view immediately preceded the doorway entry.', source: 'temporal-vision',
  }), {
    skillId: 'drone-before-entry', result: 'proved', confidence: 0.94,
    evidence: 'A drone view immediately preceded the doorway entry.', source: 'temporal-vision',
  })
  assert.equal(sanitizeProgressEvidence({ skillId: 'fake', result: 'proved', confidence: 1, evidence: 'Long enough fake evidence.' }), null)
  assert.equal(sanitizeProgressEvidence({ skillId: 'drone-before-entry', result: 'missed', confidence: 0.81, evidence: 'Long but low-confidence evidence.' }), null)
  assert.equal(sanitizeProgressEvidence({ skillId: 'drone-before-entry', result: 'missed', confidence: 0.99, evidence: 'vague' }), null)
})

test('aggregates proved and missed evidence without turning absence into failure', () => {
  const result = aggregateProgressEvidence([
    { ts: '2026-08-07T10:00:00Z', sessionId: 'one', gameState: { map: 'villa', side: 'attack' },
      progressEvidence: { skillId: 'drone-before-entry', result: 'missed', confidence: 0.93, evidence: 'The player entered the doorway without a fresh drone or visible cue.' } },
    { ts: '2026-08-07T10:02:00Z', sessionId: 'one', gameState: { map: 'villa', side: 'attack' },
      progressEvidence: { skillId: 'drone-before-entry', result: 'proved', confidence: 0.95, evidence: 'A drone checked the room before the player crossed the same doorway.' } },
    { ts: '2026-08-07T10:03:00Z', sessionId: 'one', coachAction: { spokenLine: 'rank observed: GOLD II' } },
    { ts: '2026-08-07T10:04:00Z', sessionId: 'one' },
  ])
  assert.equal(result.skills['drone-before-entry'].missed, 1)
  assert.equal(result.skills['drone-before-entry'].proved, 1)
  assert.equal(Object.keys(result.skills).length, 1)
  assert.equal(result.observedRank, 'Gold II')
  assert.equal(result.recent.length, 2)
})

test('observed rank requires an exact current division', () => {
  assert.equal(normalizeObservedRank('platinum iii'), 'Platinum III')
  assert.equal(normalizeObservedRank('Platinum'), null)
  assert.equal(normalizeObservedRank('Top 500'), null)
})
