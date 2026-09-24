import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveReferralsWidgetView } from './referralsWidgetState.js'

test('hides for a signed-out user regardless of fetch state', () => {
  assert.deepEqual(
    resolveReferralsWidgetView({ user: null, loading: false, error: null, data: null }),
    { kind: 'hidden' },
  )
})

test('shows loading while the request is in flight', () => {
  const view = resolveReferralsWidgetView({ user: {}, loading: true, error: null, data: null })
  assert.equal(view.kind, 'loading')
})

test('surfaces a fetch error instead of going blank', () => {
  const view = resolveReferralsWidgetView({ user: {}, loading: false, error: 'network down', data: null })
  assert.equal(view.kind, 'error')
  assert.equal(view.message, 'network down')
})

test('treats a successful-but-empty response as an error, not silence', () => {
  const view = resolveReferralsWidgetView({ user: {}, loading: false, error: null, data: null })
  assert.equal(view.kind, 'error')
})

test('treats a response missing share_url/code as an error, not a fabricated link', () => {
  const view = resolveReferralsWidgetView({
    user: {},
    loading: false,
    error: null,
    data: { same_tier_active: 0 },
  })
  assert.equal(view.kind, 'error')
})

test('renders ready with the real backend data once it is complete', () => {
  const data = { code: 'aaron-ab12cd', share_url: 'https://r6coaching.com/r/aaron-ab12cd' }
  const view = resolveReferralsWidgetView({ user: {}, loading: false, error: null, data })
  assert.equal(view.kind, 'ready')
  assert.equal(view.data, data)
})
