import test from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeFeedback } from './feedback.mjs'

test('accepts bounded product feedback', () => {
  assert.deepEqual(sanitizeFeedback({
    category: 'game-plan', rating: 2, message: 'My mission did not update after review.', page: '/progress?tab=focus',
  }), {
    category: 'game-plan', rating: 2, message: 'My mission did not update after review.', page: '/progress?tab=focus',
  })
})

test('rejects unknown categories and empty complaints', () => {
  assert.equal(sanitizeFeedback({ category: 'password', message: 'long enough message' }).error, 'choose a feedback category')
  assert.equal(sanitizeFeedback({ category: 'other', message: 'short' }).error, 'tell us a little more so we can act on it')
})
